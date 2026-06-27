#!/usr/bin/env node
/* ============================================================
 *  item_audit.js — 道具 id / name 稽核（純確定性，無 AI 判斷）
 *  ------------------------------------------------------------
 *  掃描 data/items_*.js（ITEMS）與 data/shop_items.js（SHOP_ITEMS），
 *  比對 scenarios/*.js 的引用（pool / grant / require / choice.grant），
 *  產出對應表 + 問題清單。
 *
 *  用法（於 repo 根目錄執行）：  node tools/item_audit.js
 *  可選參數：  node tools/item_audit.js <repoRoot>   （預設為當前工作目錄）
 *  退出碼：    0 = 乾淨    1 = 有需處理的問題
 * ============================================================ */
"use strict";
const fs   = require("fs");
const path = require("path");

const ROOT    = process.argv[2] || process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const SCN_DIR  = path.join(ROOT, "scenarios");

/* ---- 文字層偵測同一檔內重複 id 鍵（top-level，2 格縮排）---- */
function withinFileDupKeys(src){
  const seen = {}, dups = [];
  for(const line of src.split("\n")){
    const m = line.match(/^ {2}"([A-Za-z_][A-Za-z0-9_]*)"\s*:/);
    if(m){ seen[m[1]] = (seen[m[1]]||0)+1; if(seen[m[1]]===2) dups.push(m[1]); }
  }
  return dups;
}

/* ---- 1) 供給面：從 data/items_*.js 逐檔載入 ITEMS（隔離以偵測跨檔重複 id）---- */
const itemFiles = fs.readdirSync(DATA_DIR)
  .filter(f => /^items_.*\.js$/.test(f)).sort();

const allItems    = {};  // 合併後的 ITEMS
const idToFile    = {};  // id → 所屬檔案名稱
const crossFileDups = []; // 跨檔重複 id
const withinFileDupResults = []; // 檔內重複 id

for(const f of itemFiles){
  const src = fs.readFileSync(path.join(DATA_DIR, f), "utf8");

  // 文字層檔內重複鍵
  const dups = withinFileDupKeys(src);
  if(dups.length) withinFileDupResults.push({ file: f, ids: dups });

  // 替換 Object.assign(ITEMS, → Object.assign(localItems, 以隔離本檔貢獻
  const localItems = {};
  const clean    = src.charCodeAt(0) === 0xFEFF ? src.slice(1) : src;  // strip UTF-8 BOM
  const modified = clean.replace(/\bObject\.assign\s*\(\s*ITEMS\s*,/, "Object.assign(localItems,");
  try{
    (new Function("localItems", modified))(localItems);
  } catch(e){
    console.error(`❌ 載入 ${f} 失敗：${e.message}`);
    process.exit(1);
  }

  // 跨檔重複 id 偵測
  for(const id of Object.keys(localItems)){
    if(id in allItems){
      crossFileDups.push({ id, file1: idToFile[id], file2: f });
    } else {
      allItems[id] = localItems[id];
      idToFile[id]  = f;
    }
  }
}

/* ---- 2) 從 data/shop_items.js 載入 SHOP_ITEMS ---- */
const shopSrc  = fs.readFileSync(path.join(DATA_DIR, "shop_items.js"), "utf8");
// 把「// 注解\nconst SHOP_ITEMS = {...};」轉成可執行的「return {...};」
const shopBody = shopSrc.replace(/[\s\S]*?const\s+SHOP_ITEMS\s*=\s*/, "return ");
const SHOP_ITEMS = (new Function(shopBody))();

/* ---- 3) 需求面：載入 SCENARIOS ---- */
global.SCENARIOS = {};
const scnFiles = fs.readdirSync(SCN_DIR).filter(f => f.endsWith(".js")).sort();
for(const f of scnFiles){
  eval(fs.readFileSync(path.join(SCN_DIR, f), "utf8")); // 信任自家劇本
}

/* ---- 4) 掃描劇本引用 ---- */
const refs = {};
const addRef = (id, where) => { (refs[id] ||= new Set()).add(where); };
for(const [sid, scn] of Object.entries(SCENARIOS)){
  (scn.pool || []).forEach(id => addRef(id, sid + ":pool"));
  for(const [nid, node] of Object.entries(scn.nodes || {})){
    (node.grant || []).forEach(id => addRef(id, `${sid}:${nid}:grant`));
    for(const c of (node.choices || [])){
      if(c.require) (Array.isArray(c.require)?c.require:[c.require]).forEach(id => addRef(id, `${sid}:${nid}:require`));
      if(c.grant)   (Array.isArray(c.grant)?c.grant:[c.grant]).forEach(id => addRef(id, `${sid}:${nid}:choice.grant`));
    }
  }
}

/* ---- 5) 比對 ---- */
const defIds  = new Set([...Object.keys(allItems), ...Object.keys(SHOP_ITEMS)]);
const refIds  = new Set(Object.keys(refs));
const ghosts  = [...refIds].filter(id => !defIds.has(id));
const orphans = Object.keys(allItems).filter(id => !refIds.has(id));

// name 撞車（不同 id 同名 → runtime 視同一道具）
const byName = {};
for(const [id, d] of Object.entries({ ...allItems, ...SHOP_ITEMS }))
  (byName[d.name] ||= []).push(id);
const nameClashes = Object.entries(byName).filter(([, ids]) => ids.length > 1);

// internal:true 但未設 carry:false
const internalNoCarry = Object.entries(allItems)
  .filter(([, d]) => d.internal && d.carry !== false).map(([id]) => id);

// domain 一致性：道具的 domain 欄位必須等於所在檔（items_X.js → domain:"X"）
const domainMismatches = Object.entries(allItems)
  .filter(([id, d]) => {
    const expected = idToFile[id].replace(/^items_/, "").replace(/\.js$/, "");
    return d.domain !== expected;
  })
  .map(([id, d]) => {
    const expected = idToFile[id].replace(/^items_/, "").replace(/\.js$/, "");
    return `${id}（${idToFile[id]}）domain="${d.domain ?? "(未設)"}" 應為 "${expected}"`;
  });

/* ---- 6) 對應表 ---- */
const flags = d => [d.carry&&"carry", d.internal&&"internal", d.memoryPower&&"memory", d.quest&&"quest"]
  .filter(Boolean).join(",") || "-";
console.log("\n# 道具對應表（ITEMS）");
console.log("id | name | domain | drop | slot | 旗標 | 被引用於");
console.log("---|------|--------|------|------|------|--------");
for(const [id, d] of Object.entries(allItems)){
  console.log(`${id} | ${d.name} | ${d.domain||"?"} | ${d.drop} | ${d.slot||"-"} | ${flags(d)} | ${refs[id] ? [...refs[id]].join(" / ") : "（未被引用）"}`);
}
console.log("\n# 商店道具（SHOP_ITEMS，靠購買，不經劇本引用）");
for(const [id, d] of Object.entries(SHOP_ITEMS))
  console.log(`${id} | ${d.name} | slot:${d.slot}`);

/* ---- 7) 問題清單 ---- */
console.log("\n# 問題清單");
let problems = 0;
const report = (label, arr, fmt = x => x) => {
  if(arr.length){ problems += arr.length; console.log(`❌ ${label}：`); arr.forEach(x => console.log("   - " + fmt(x))); }
  else console.log(`✅ ${label}：無`);
};

const allWithinDups = withinFileDupResults.flatMap(({file, ids}) => ids.map(id => `${file}：${id}`));
report("同一檔內重複 id 鍵", allWithinDups);
report("跨檔重複 id（Object.assign 會靜默後寫覆蓋）", crossFileDups,
  ({id, file1, file2}) => `"${id}"  ← ${file1}  ×  ${file2}`);
report("幽靈（被引用卻無定義）", ghosts);
report("name 撞車（不同 id 同名，runtime 會視為同一道具）", nameClashes,
  ([n, ids]) => `「${n}」← ${ids.join(", ")}`);
report("domain 不一致（欄位值與所在檔不符）", domainMismatches);
report("internal:true 但未 carry:false", internalNoCarry);

console.log(`\nⓘ 孤兒（已定義、目前無劇本引用；carry/商店道具屬正常，僅供參考）：${orphans.length ? orphans.join(", ") : "無"}`);
console.log(`\n=== 稽核結束：${problems} 個需處理的問題 ===`);
process.exit(problems > 0 ? 1 : 0);
