#!/usr/bin/env node
/* ============================================================
 *  scenario_audit.js — 劇本「結構」稽核（純確定性，無 AI 判斷）
 *  ------------------------------------------------------------
 *  與 item_audit.js 並列、職責分離：
 *    - item_audit.js 管道具 id / name。
 *    - 本工具只管劇本「結構」：節點圖完整性 + 契約未實作機制誤用。
 *
 *  檢查 1：節點圖完整性
 *    幽靈節點（被引用卻未定義）→ ❌ 錯誤（計入退出碼）
 *    孤兒節點（已定義卻無引用、非 start）→ ⓘ 僅資訊，不計退出碼
 *  檢查 2：契約未實作機制誤用（逐 choice）
 *    require 物件閘門 {not}/{any}、require 陣列含非字串、choice.requireMemory
 *    → 出現即 ❌ 錯誤（計入退出碼）
 *  檢查 3：節點成就 id 存在性（逐節點）
 *    node.achievement 指向 ACHIEVEMENTS 未定義的 id（成就幽靈）→ ❌ 錯誤（計入退出碼）
 *    （只檢查節點層，對齊引擎：index.html 僅 if(node.achievement) unlockAchievement(...)）
 *  檢查 4：win 型別合法性（逐劇本）
 *    scenario.win 不在允許集 {escape, survive, objective} → ❌ 錯誤（計入退出碼）
 *    （對齊引擎 WIN_LABELS 單一真相來源；防止標籤亂填顯示 undefined）
 *
 *  用法（於 repo 根目錄執行）：  node tools/scenario_audit.js
 *  可選參數：  node tools/scenario_audit.js <repoRoot>   （預設為當前工作目錄）
 *  退出碼：    0 = 乾淨    1 = 有需處理的問題（幽靈節點 + 機制誤用 + 成就幽靈 + win 非法）
 * ============================================================ */
"use strict";
const fs   = require("fs");
const path = require("path");

const ROOT    = process.argv[2] || process.cwd();
const SCN_DIR = path.join(ROOT, "scenarios");

// win 允許集：須與 index.html 的 WIN_LABELS keys 一致（新增型別時兩處同步）
const WIN_ALLOWED = new Set(["escape", "survive", "objective"]);

/* ---- 載入 SCENARIOS（沿用 item_audit.js 的方式）---- */
global.SCENARIOS = {};
const scnFiles = fs.readdirSync(SCN_DIR).filter(f => f.endsWith(".js")).sort();
for(const f of scnFiles){
  const src = fs.readFileSync(path.join(SCN_DIR, f), "utf8");
  eval(src.charCodeAt(0) === 0xFEFF ? src.slice(1) : src); // 信任自家劇本；剝除 UTF-8 BOM
}

/* ---- 載入 ACHIEVEMENTS（檢查 3 用）----
 * achievements.js 為 `const ACHIEVEMENTS = {...}` 宣告式（非 SCENARIOS 的賦值式），
 * 嚴格模式 eval 會把 const 綁進 eval 私有作用域，故在同一段 eval 末尾把它指回 global。 */
global.ACHIEVEMENTS = {};
const ACH_FILE = path.join(ROOT, "data", "achievements.js");
try {
  const asrc   = fs.readFileSync(ACH_FILE, "utf8");
  const aclean = asrc.charCodeAt(0) === 0xFEFF ? asrc.slice(1) : asrc;
  eval(aclean + "\n;global.ACHIEVEMENTS = ACHIEVEMENTS;");
} catch(e){
  console.error("⚠ 無法載入 data/achievements.js，檢查 3 將以空成就池進行：" + e.message);
}

/* ============================================================
 *  逐劇本稽核
 * ============================================================ */
const scenarioReports = [];   // { sid, title, nodeCount, ghosts[], orphans[], misuse[] }
let ghostCount  = 0;          // 計入退出碼
let misuseCount = 0;          // 計入退出碼
let badAchCount = 0;          // 計入退出碼
let badWinCount = 0;          // 計入退出碼

for(const [sid, scn] of Object.entries(SCENARIOS)){
  const nodes = scn.nodes || {};
  const defined = new Set(Object.keys(nodes));

  /* ---- 檢查 4：win 型別合法性 ---- */
  const badWin = (!("win" in scn) || !WIN_ALLOWED.has(scn.win))
    ? [`win=${JSON.stringify(scn.win)} 不在允許集 {escape, survive, objective}`]
    : [];

  /* ---- 檢查 1：蒐集引用集（僅字串型目標）---- */
  const referenced = new Set();
  const addRef = v => { if(typeof v === "string") referenced.add(v); };

  // climaxNode：steer 導向用（非顯式 next）
  addRef(scn.climaxNode);

  /* ---- 檢查 2：契約未實作機制誤用（逐 choice）---- */
  const misuse = [];
  /* ---- 檢查 3：節點成就 id 存在性（逐節點）---- */
  const badAch = [];

  for(const [nid, node] of Object.entries(nodes)){
    // ── 檢查 3：node.achievement 指向的成就 id 必須已定義 ──
    if(node.achievement && !(node.achievement in ACHIEVEMENTS)){
      badAch.push(`節點 ${nid}：achievement="${node.achievement}" 指向不存在的成就 id（ACHIEVEMENTS 未定義）`);
    }

    for(const c of (node.choices || [])){
      // ── 檢查 1：路由目標 ──
      addRef(c.next);
      addRef(c.success);              // accumulate winMode 的 finalRoll 用
      addRef(c.fail);
      if(c.check && typeof c.check === "object"){
        addRef(c.check.success);      // 氛圍判定用
        addRef(c.check.fail);
      }

      // ── 檢查 2：require 機制誤用 ──
      if("require" in c){
        const r = c.require;
        if(r !== null && typeof r === "object" && !Array.isArray(r)){
          // 物件閘門 {not}/{any}
          misuse.push(`節點 ${nid}：require=${JSON.stringify(r)} 使用了契約未實作的機制（物件閘門 {not}/{any}）`);
        } else if(Array.isArray(r)){
          const bad = r.filter(el => typeof el !== "string");
          if(bad.length){
            misuse.push(`節點 ${nid}：require 陣列含非字串元素 ${JSON.stringify(bad)} 使用了契約未實作的機制（陣列僅支援全字串 AND）`);
          }
        }
        // r 為字串：合法，不報
      }

      // ── 檢查 2：requireMemory ──
      if("requireMemory" in c){
        misuse.push(`節點 ${nid}：choice 含 requireMemory=${JSON.stringify(c.requireMemory)} 使用了契約未實作的機制（requireMemory 未實作）`);
      }
    }
  }

  /* ---- 比對：幽靈 / 孤兒 ---- */
  const ghosts  = [...referenced].filter(id => !defined.has(id));
  const orphans = [...defined].filter(id => !referenced.has(id) && id !== "start");

  ghostCount  += ghosts.length;
  misuseCount += misuse.length;
  badAchCount += badAch.length;
  badWinCount += badWin.length;

  scenarioReports.push({
    sid, title: scn.title || "(無標題)",
    nodeCount: defined.size, ghosts, orphans, misuse, badAch, badWin,
  });
}

/* ============================================================
 *  輸出：逐劇本摘要
 * ============================================================ */
console.log("\n# 劇本結構稽核");
for(const r of scenarioReports){
  console.log(`\n## ${r.sid}（${r.title}）`);
  console.log(`   節點數：${r.nodeCount}`);
  console.log(`   ${r.ghosts.length ? "❌" : "✅"} 幽靈節點：${r.ghosts.length ? r.ghosts.join(", ") : "無"}`);
  console.log(`   ${r.misuse.length ? "❌" : "✅"} 契約機制誤用：${r.misuse.length ? "" : "無"}`);
  r.misuse.forEach(m => console.log(`      - ${m}`));
  console.log(`   ${r.badAch.length ? "❌" : "✅"} 成就幽靈（node.achievement 指向未定義 id）：${r.badAch.length ? "" : "無"}`);
  r.badAch.forEach(a => console.log(`      - ${a}`));
  console.log(`   ${r.badWin.length ? "❌" : "✅"} win 型別合法性：${r.badWin.length ? "" : "無"}`);
  r.badWin.forEach(w => console.log(`      - ${w}`));
  console.log(`   ⓘ 孤兒節點（已定義無引用；turnLimit 強制結束的 end 節點屬正常）：${r.orphans.length ? r.orphans.join(", ") : "無"}`);
}

/* ============================================================
 *  輸出：問題清單
 * ============================================================ */
console.log("\n# 問題清單");
let problems = 0;
const report = (label, arr, fmt = x => x) => {
  if(arr.length){ problems += arr.length; console.log(`❌ ${label}：`); arr.forEach(x => console.log("   - " + fmt(x))); }
  else console.log(`✅ ${label}：無`);
};

const allGhosts = scenarioReports.flatMap(r => r.ghosts.map(g => `${r.sid}：${g}`));
const allMisuse = scenarioReports.flatMap(r => r.misuse.map(m => `${r.sid} / ${m}`));
const allBadAch = scenarioReports.flatMap(r => r.badAch.map(a => `${r.sid} / ${a}`));
const allBadWin = scenarioReports.flatMap(r => r.badWin.map(w => `${r.sid} / ${w}`));
report("幽靈節點（被引用卻未定義）", allGhosts);
report("契約未實作機制誤用", allMisuse);
report("成就幽靈（node.achievement 指向未定義 id）", allBadAch);
report("win 型別非法（不在 {escape, survive, objective}）", allBadWin);

const allOrphans = scenarioReports.flatMap(r => r.orphans.map(o => `${r.sid}：${o}`));
console.log(`\nⓘ 孤兒節點（不計入退出碼；僅靠 turnLimit 到達的 end 節點屬正常）：${allOrphans.length ? allOrphans.join(", ") : "無"}`);

console.log(`\n=== 稽核結束：${problems} 個需處理的問題 ===`);
process.exit(problems > 0 ? 1 : 0);
