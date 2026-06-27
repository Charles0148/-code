#!/usr/bin/env node
/* ============================================================
 *  item_audit.js — 道具 id / name 稽核（純確定性，無 AI 判斷）
 *  ------------------------------------------------------------
 *  掃描 index.html 的 ITEMS / SHOP_ITEMS 定義，
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

const ROOT      = process.argv[2] || process.cwd();
const INDEX     = path.join(ROOT, "index.html");
const SCN_DIR   = path.join(ROOT, "scenarios");

/* ---- 從 index.html 抽出某個物件字面量區塊，回傳 [物件, 原始行陣列] ---- */
function extractBlock(startRe){
  const lines = fs.readFileSync(INDEX, "utf8").split("\n");
  const block = [];
  let f = false;
  for(const line of lines){
    if(!f && startRe.test(line)){ f = true; block.push(line); continue; }
    if(f){
      block.push(line);
      if(/^\};/.test(line)) break;
    }
  }
  if(!block.length) throw new Error("找不到區塊：" + startRe);
  // 把「const NAME = { ... };」轉成可回傳的物件
  const body = block.join("\n").replace(/^const\s+\w+\s*=\s*/, "return ");
  const obj  = (new Function(body))();   // 區塊內只有字面量，安全
  return [obj, block];
}

/* ---- 文字層偵測重複 id 鍵（eval 會靜默吃掉重複鍵，故需原文掃描）---- */
function dupKeys(blockLines){
  const seen = {}, dups = [];
  for(const line of blockLines){
    const m = line.match(/^\s{2}([A-Za-z_][A-Za-z0-9_]*)\s*:/); // 頂層鍵＝2 空格縮排
    if(m){ seen[m[1]] = (seen[m[1]]||0)+1; if(seen[m[1]]===2) dups.push(m[1]); }
  }
  return dups;
}

/* ---- 1) 供給面：載入定義 ---- */
const [ITEMS, itemsLines]     = extractBlock(/^const ITEMS = \{/);
const [SHOP_ITEMS, shopLines] = extractBlock(/^const SHOP_ITEMS = \{/);
const dupItemKeys = dupKeys(itemsLines);
const dupShopKeys = dupKeys(shopLines);

/* ---- 2) 需求面：掃描劇本引用 ---- */
global.SCENARIOS = {};
const scnFiles = fs.readdirSync(SCN_DIR).filter(f => f.endsWith(".js")).sort();
for(const f of scnFiles){
  eval(fs.readFileSync(path.join(SCN_DIR, f), "utf8")); // 信任自家劇本
}
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

/* ---- 3) 比對 ---- */
const defIds = new Set([...Object.keys(ITEMS), ...Object.keys(SHOP_ITEMS)]);
const refIds = new Set(Object.keys(refs));
const ghosts  = [...refIds].filter(id => !defIds.has(id));                  // 引用卻未定義
const orphans = Object.keys(ITEMS).filter(id => !refIds.has(id));          // 定義卻未引用（僅提示）
const byName  = {};
for(const [id, d] of Object.entries({ ...ITEMS, ...SHOP_ITEMS })) (byName[d.name] ||= []).push(id);
const nameClashes    = Object.entries(byName).filter(([, ids]) => ids.length > 1);   // 不同 id 同 name
const internalNoCarry = Object.entries(ITEMS).filter(([, d]) => d.internal && d.carry !== false).map(([id]) => id);

/* ---- 4) 對應表 ---- */
const flags = d => [d.carry&&"carry", d.internal&&"internal", d.memoryPower&&"memory", d.quest&&"quest"].filter(Boolean).join(",") || "-";
console.log("\n# 道具對應表（ITEMS）");
console.log("id | name | drop | slot | 旗標 | 被引用於");
console.log("---|------|------|------|------|--------");
for(const [id, d] of Object.entries(ITEMS)){
  console.log(`${id} | ${d.name} | ${d.drop} | ${d.slot||"-"} | ${flags(d)} | ${refs[id] ? [...refs[id]].join(" / ") : "（未被引用）"}`);
}
console.log("\n# 商店道具（SHOP_ITEMS，靠購買，不經劇本引用）");
for(const [id, d] of Object.entries(SHOP_ITEMS)) console.log(`${id} | ${d.name} | slot:${d.slot}`);

/* ---- 5) 問題清單 ---- */
console.log("\n# 問題清單");
let problems = 0;
const report = (label, arr, fmt = x => x) => {
  if(arr.length){ problems += arr.length; console.log(`❌ ${label}：`); arr.forEach(x => console.log("   - " + fmt(x))); }
  else console.log(`✅ ${label}：無`);
};
report("重複 id 鍵（ITEMS）", dupItemKeys);
report("重複 id 鍵（SHOP_ITEMS）", dupShopKeys);
report("幽靈（被引用卻無定義）", ghosts);
report("name 撞車（不同 id 同名，runtime 會視為同一道具）", nameClashes, ([n, ids]) => `「${n}」← ${ids.join(", ")}`);
report("internal:true 但未 carry:false", internalNoCarry);
console.log(`\nⓘ 孤兒（已定義、目前無劇本引用；carry/商店道具屬正常，僅供參考）：${orphans.length ? orphans.join(", ") : "無"}`);
console.log(`\n=== 稽核結束：${problems} 個需處理的問題 ===`);
process.exit(problems > 0 ? 1 : 0);
