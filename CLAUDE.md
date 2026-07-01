# 無限流遊戲 — 專案說明（給 Claude Code 看）

> 讀完這份就能接手。本檔放在專案根目錄，Claude Code 每次會自動讀取。

## 1. 這是什麼
- 一個「無限流」文字冒險 roguelike，做成**純前端靜態網頁**。
- **遊戲執行時完全不呼叫任何 AI / API。** 內容是事先準備好的資料池。
- 可直接丟上 GitHub Pages / itch.io，零伺服器、零執行成本。
- 全程**台灣繁體中文，禁簡體**（含 UI 文案與劇本內容）。
- 本機測試須用 **VS Code Live Server**（`http://` 協定），直接雙擊 `index.html` 會因 `file://` 安全限制無法載入劇本。

---

## 2. 檔案結構

```
無限流 code/
  index.html                    ← 引擎主體、UI 結構（不再含資料定義或 CSS）
  style.css                     ← 所有樣式（從 index.html 抽出）
  CLAUDE.md                     ← 本文件
  data/
    slots.js                    ← SLOTS（裝備槽）、RARITY_META（稀有度元資料）
    shop_items.js               ← SHOP_ITEMS（商店道具）
    achievements.js             ← ACHIEVEMENTS（成就定義）
    items_core.js               ← ITEMS：核心道具（domain:"core"，多副本共用）
    items_aquarium.js           ← ITEMS：水族館專屬道具（domain:"aquarium"，slot:null）
    items_bakery.js             ← ITEMS：麵包店專屬道具（domain:"bakery"）
    winmodes.js                 ← registerWinMode 登記（引擎主 script 之後載入）
    compendium.js               ← COMPENDIUM 圖鑑 manifest + COMPENDIUM_COMMON 共通道具（引擎前載入）
  scenarios/
    hospital_01.js              ← 廢棄醫院（T1，普通）
    store_01.js                 ← 深夜便利商店（T1，普通）
    wreck_01.js                 ← 傾覆的沉船（T2，普通）
    metro_01.js                 ← 廢棄地鐵站（T1，需解鎖 80 點）
    aquarium_01.js              ← 閉館後的藍（T1，特殊劇本，winMode:"accumulate"）
    bakery_01.js                ← 凌晨四點的麵包店（T1，特殊劇本）
  tools/
    item_audit.js               ← 道具稽核工具（node tools/item_audit.js）
    scenario_audit.js           ← 劇本結構稽核（幽靈節點 + 契約誤用 + 成就幽靈）
```

### index.html 的 script 載入順序（不可任意調換）
1. `data/slots.js`、`data/shop_items.js`、`data/achievements.js`（靜態查找表）
2. `const ITEMS = {};`（空宣告）
3. `data/items_core.js`、`data/items_aquarium.js`、`data/items_bakery.js`（Object.assign 合併）
4. `const SCENARIOS = {};`（空宣告）
5. `scenarios/*.js`（各副本定義）
6. `data/compendium.js`（COMPENDIUM 圖鑑 manifest；引擎 render 時才讀，置於引擎前即可）
7. 引擎主 `<script>`（含 WIN_CONDITIONS、WINMODE_HOOKS、registerWinMode 等）
8. `data/winmodes.js`（必須在引擎之後，registerWinMode 函式才存在）

### 新增道具
- 跨副本通用道具 → 加進 `data/items_core.js`，`domain:"core"`
- 副本專屬道具 → 新增 `data/items_X.js`，`domain:"X"`；在 index.html 加一行 `<script src>`
- 每個道具**必須**有 `domain` 欄位，且值等於所在檔的 `X`（由 itemcheck 強制）

### 新增普通劇本
1. 在 `scenarios/` 新增 `xxx.js`，格式：`SCENARIOS["id"] = { ... };`
2. 在 `index.html` script 載入區加 `<script src="scenarios/xxx.js"></script>`
3. 引擎自動識別，不需其他修改。

### 新增特殊劇本
⚠️ 使用者會在給你的內容上標註「特殊劇本」。遇到時：
1. 在 `data/winmodes.js` 尾端加 `registerWinMode(...)` 登記（**不要**寫進 index.html）
2. **不要**把特殊邏輯直接塞進引擎的 if/else，保持各劇本邏輯完全隔離
3. 詳見第 5 節「擴充機制」

---

## 3. 資料形狀

### SCENARIOS（每個 .js 檔一筆）
```js
SCENARIOS["id"] = {
  title, theme, tier,           // tier: 1 或 2
  objective,                    // 任務說明字串
  win: "escape"|"survive"|"objective",  // 型別標籤（見下方「win 型別規則」）；只能填這三種
  turnLimit: 15,                // 強制結束回合數
  steerAt: 10,                  // 第幾回合起導向高潮節點（特殊劇本可用 skipSteer 略過）
  climaxNode: "node_id",        // 高潮節點 id
  locked: true,                 // 選填，需花點數解鎖
  price: 80,                    // 解鎖費用
  pool: ["item_id", ...],       // 此副本可掉落的 ITEMS id 清單
  // ── 特殊劇本專用欄位（普通劇本不需要）──
  winMode: "accumulate",        // 標記使用特殊勝負機制（目前唯一通用 winMode）
  accumulator: { ... },         // accumulate winMode 的設定物件（見第 5 節）
  nodes: { ... }
};
```

### win 型別規則（標籤唯一真相來源，禁止亂填）

`win` 只能填以下三種值之一。標籤集中定義於 `index.html` 的 `WIN_LABELS` 常數，畫面一律查此表；**新增劇本一律從這三種挑一個，不得自創新字串**（`/scenariocheck` 檢查 4 會攔）。

| win 值 | 顯示標籤 | 語意 | turnLimit 到達時的預設結局 |
|--------|----------|------|-----------------------------|
| `"escape"` | ESCAPE 逃出 | 在時限內逃出 | **dead**（沒能逃出＝輸） |
| `"survive"` | SURVIVE 生存 | 撐過時限 | **cleared**（撐到時間＝贏） |
| `"objective"` | OBJECTIVE 任務 | 在時限內完成一連串任務／達成目標 | **dead**（沒能在時限內完成＝輸） |

- 唯一被引擎邏輯讀取的地方是 `choose()` 的 turnLimit fallback（`win==="survive"` → cleared，其餘 → dead）與上面的顯示標籤；`win` **不參與**節點 `end` 的實際勝負判定（那由 `node.end:"cleared"/"dead"` 直接決定）。
- `objective` 型的實際勝負，建議用 **flags/vars 的 `valueCheck` + 明確 `end` 節點**（見 §5）在自己的節點決定，turnLimit fallback 只當「拖到超時＝失敗」的安全網。
- ⚠️ 要新增第四型（例如「時間到算贏的 objective 變體」）必須四處同步：① `WIN_LABELS` ② 若時間到語意不同則改 `choose()` 的 turnLimit fallback ③ 本表 ④ `tools/scenario_audit.js` 的 `WIN_ALLOWED`。缺一處就會標籤或稽核不一致。

### choice 形式（普通劇本）
```js
{ text, next }                                        // 一般
{ text, loot:true, next }                             // 掉落（觸發 rollDrops）
{ text, danger:1|2|3, check:{type,dc,success,fail} }  // 判定
{ text, require:"item_id_or_name", next }             // 條件（背包無此物則隱藏）
// danger: 1=低危, 2=中危(⚠), 3=高危(☠)
// reward: 判定成功的額外點數獎勵（選填）
```

### choice 特殊欄位（accumulate winMode 專用）
```js
{ text, survival: 20, next }
// → 選擇後 state[accumulator.stateKey] += 20
//   欄位名稱由 accumulator.choiceKey 指定（aquarium 用 "survival"）

{ text, finalRoll:true, success:"node_cleared", fail:"node_dead" }
// → 觸發最終機率判定，由 accumulate winMode 讀取 accumulator 設定處理
//   欄位名稱由 accumulator.finalChoiceKey 指定（aquarium 用 "finalRoll"）
```

### ITEMS（在 index.html 中定義）
```js
"id": {
  name, effect,
  value,            // 變賣價格
  tier: 1|2,
  carry: bool,      // true = 過關可帶出副本
  drop: 0~1,        // 掉落機率
  check: "判定類型"|null,
  bonus: 0~10,      // 裝備後對該判定的加成（d20 系統）
  slot: "head"|"body"|"feet"|"weapon"|"amulet"|"acc1"|"acc2"|null,
  icon: "emoji",
  rarity: "white"|"green"|"blue"|"yellow"|"red"|"gold"|"rainbow",
  // ── 特殊劇本專用欄位 ──
  finalBonus: 0~50, // 最終存活判定加成（不進裝備系統，slot 設 null）
}
```

### SHOP_ITEMS（在 index.html 中定義）
```js
"id": { name, effect, price, check, bonus, slot, icon, rarity }
// 購買價格；回收 = price × 0.6
```

### ACHIEVEMENTS（在 index.html 中定義）
```js
"id": {
  name:     "成就名稱",
  hint:     "解鎖後顯示的說明",
  icon:     "emoji",
  rarity:   "white"|...|"rainbow",
  scenario: "scenario_id",       // 屬於哪個劇本
  type:     "collect"|"title"|"points"|"unlock",
  visible:  bool,                // false = 未解鎖時顯示「???」
  reward:   null | { points:N } | { title:"稱號" } | { unlockScenario:"id" },
}
```

---

## 4. 已完成功能

| 功能 | 說明 |
|------|------|
| Hub 主神空間 | 點數、裝備概覽、進入 T1/T2（T2 需 50 點）、成就入口 |
| 劇本抽選+排除 | `drawScenario`：抽未玩過的，全玩過就重置；已鎖副本需解鎖 |
| DEV 強制關卡 | DEV 面板頂部常駐選單，指定後下一場進入該副本 |
| 副本迴圈 | 場景、選項、回合計數 |
| 高潮導引 | 第 `steerAt` 回合起自動導向 `climaxNode`（特殊副本可跳過） |
| 判定系統 | d20 + 已裝備道具加成 ≥ DC = 成功 |
| 危險等級 | danger 1/2/3；高危成功有 reward 獎勵點數 |
| 掉落系統 | `rollDrops` 按機率擲；彈出 Popup |
| 裝備系統 | 7 槽；只有裝備中的道具提供判定加成 |
| 自動裝備 | 掉落道具若對應槽空著自動裝備（slot:null 的道具不進裝備系統） |
| 背包條件選項 | `require` 欄位：背包無指定道具則隱藏 |
| 結算 | 過關：carry 道具保留、其餘變賣；死亡：本場道具消失 |
| 10% 奇蹟逃脫 | 死亡時 carry 道具有 10% 機率保住 |
| localStorage 存檔 | key: `mugen_save_v2`；存 currency/inventory/seen/unlockedScenarios/equipped/unlockedAchievements/seenEndings/carriedItems/visitedScenarios |
| 商店 | 買裝備、賣道具、解鎖副本 |
| 成就系統 | ACHIEVEMENTS 定義、解鎖 Popup、Hub 成就畫面（按劇本分組） |
| WINMODE_HOOKS | 特殊劇本擴充機制（見第 5 節） |
| accumulate winMode | 通用：累積變數、最終機率判定；aquarium 使用此機制 |
| 副本圖鑑 | 按副本統計結局/道具/成就蒐集；共通道具獨立區（domain:"core" carry 道具）；持久層 seenEndings/carriedItems/visitedScenarios |
| DEV 面板 | 6 個 Tab（見下方） |

### DEV 面板 Tab 說明
- **Tab 0 商店裝備**：卡片式編輯 SHOP_ITEMS
- **Tab 1 副本道具**：卡片式編輯 ITEMS（含副本分配 chip）
- **Tab 2 判定試算**：DC × 加成的成功率對照表
- **Tab 3 劇本分析**：各劇本節點數、判定分布
- **Tab 4 匯出**：複製修改後的 JSON 貼回程式碼
- **Tab 5 成就**：卡片式編輯 ACHIEVEMENTS、強制解鎖/重置

> DEV 修改即時生效但刷新後恢復。要永久保存請用 Tab 4 匯出後貼回 `index.html`。

---

## 5. 引擎能力契約（當前真相）

> 這裡記錄的是引擎**現在真正支援**的能力邊界。
> 未列入的功能請勿在劇本中使用，等到需要它的副本才加進引擎。

### 選項可見性：require 欄位

| 寫法 | 語意 | 支援狀態 |
|------|------|----------|
| 無 require | 永遠顯示 | ✅ |
| `require: "item_id"` | 持有該道具才顯示 | ✅ |
| `require: ["a", "b"]` | 同時持有 a **且** b 才顯示（AND） | ✅ |
| `require: { not: "item_id" }` | 缺少該道具才顯示（反向） | ❌ 未實作 |
| `require: { any: ["a","b"] }` | 持有任一即顯示（OR） | ❌ 未實作 |

> 道具反向與 OR 閘門未實作，等到有副本真正需要才加。
> ⚠️ 注意：`require` 只查「背包持有道具」。若要依「先前選擇／數值」控制選項可見性，用下方的 **flags/vars 原語**（`requireFlag`），不要用道具濫充旗標。

### requireMemory 欄位

**未實作。** `memoryPower:true` 目前只是道具的標記欄位，引擎不讀取它來控制選項可見性。
規格預留如下（實作前勿使用）：
- 條件：武器槽裝備了 `memoryPower:true` 的道具（檢查裝備欄，不是背包）
- 行為：滿足才顯示選項，否則整個隱藏（不是反灰）

### internal:true 道具

- **授予**：透過 `grant` 靜默加進背包與 `runLoot`，不彈出 popup，不顯示於任何 UI
- **離場清除**：依賴 `carry:false`——cleared/dead 結算時 `resolveEnd` 會正確清除，不會滲入永久背包
- **隱含 carry:false**（待辦）：目前 `internal:true` 的離場清除依賴作者手動加 `carry:false`，此前提未被引擎強制。建議引擎將 `internal:true` 自動視同 `carry:false`，使「隱形標記絕不滲入永久背包」成為引擎保證，而非作者慣例；可加開發期警告：偵測到 `internal:true` 卻未含 `carry:false` 時提示。
- **帶出／賣錢防護**：`resolveEnd` 三個迴圈（通關、強制退出、一般失敗）均已加上 `if(it.internal){ removeFromInventory(it); continue; }`，靜默清除、不列入任何面向玩家的結算清單（carried / consumed / lost / escaped / goddessGifts 均排除）。

### 節點成就觸發

節點物件上可設 `achievement: "ach_id"`，引擎進入該節點時自動呼叫 `unlockAchievement`。

- 觸發時機：`processGrant` 之後、`resolveEnd` 之前（道具已授予，結算尚未開始）
- 支援任何節點（含 `end` 節點）
- 不需要 winMode，普通副本直接使用
- 複雜條件（回合數、累積數值等）未來以擴充欄位處理，現階段不支援

```js
node_hidden_final: {
  end: "cleared",
  achievement: "ach_1782663164619",
  scene: "..."
}
```

---

### 節點結局記錄 endingId（圖鑑用）

節點物件上可設 `endingId: "字串"`。引擎進入該節點時把它加入持久集合 `seenEndings`（圖鑑「已見結局」）。

- 觸發時機：與 `achievement` **完全相同**——`processGrant` 之後、`resolveEnd` 之前。
- 無條件記錄、不做任何過濾；無 `endingId` 的節點行為不變（向後相容）。
- 可與 `achievement`、`end` 同節點並存（bakery `node_hidden_final` 三者皆有）。
- ⚠️ 限制：若未來有 winMode 在 `onChoiceMade` 回傳 `endKind` 走 `choose()` 提早 return 路徑，該路徑目前**不處理** `endingId` / `achievement`。現有 accumulate 回傳 `overrideNextId` 走正常路徑，不受影響。

```js
node_end_true: {
  end: "cleared",
  endingId: "bakery_true",
  scene: "..."
}
```

### 圖鑑持久層與 manifest（當前真相）

- 持久集合（只增不刪，存於 `mugen_save_v2`）：`seenEndings`（結局 id）、`carriedItems`（帶出道具 id）、`visitedScenarios`（曾進入副本 id）。
- `carriedItems` 記錄點＝`resolveEnd` 中道具「真正進永久背包」的三處提交（cleared 的 carried、強制退出的 goddessGifts、一般失敗的 escaped 奇蹟逃脫）；以 **id** 為鍵；`ITEMS[id].internal` 為真者一律不記錄。entry 的 `id` 於 `processGrant` / `rollDrops` / `rollAutoDrops` 建立時蓋上（商店道具不進 runLoot、無 id，自然不記錄）。
- `visitedScenarios` 於 `enterTier`（唯一進入點，含 DEV 強制）記錄。
- 分母由 `data/compendium.js` 宣告：`COMPENDIUM`（按副本：`endings` / `items` / `achievements`）＋ `COMPENDIUM_COMMON`（共通道具，含專屬欄位 `from` 出沒來源）。`items` **只列 carry:true 且非 internal** 道具。
- 顯示門檻：副本須在 `visitedScenarios` 才出現於圖鑑；共通道具逐顆比對 `from`∩`visitedScenarios` 才揭露（只玩不掉共通道具的副本不會揭露任何共通道具）；未解鎖格遮為「？？？」；共通道具出沒行只列已進過的來源。

---

### flags/vars 通用原語（跨節點旗標與數值）

用於「依玩家先前的**選擇**（而非持有道具）控制選項可見性或分支」，以及「累加一個數值、和門檻做**確定性**比較後分支（無擲骰）」。是通用原語，任何普通副本直接用，不需 winMode。

- **狀態袋**：`runState._flags`（揮發、**不進 localStorage**）。進副本時以 `scenario.initFlags`（選填）初始化，否則為空物件。
- **寫入（choice 欄位）**：
  - `set: { key: value }` — 設旗標／變數（值可為字串、數字、布林）。
  - `addValue: { key: n }` — 數值累加（同 key 累加，未初始化視為 0）。
  - 時機：`choose()` 一進來就套用（在算分支之前），故同一選項的 `addValue` 會被同一步的 `valueCheck` 看見。
- **讀取——選項可見性（choice 欄位）**：
  - `requireFlag: "key"` — 該旗標存在且為真值才顯示。
  - `requireFlag: { var, op, threshold }` — 比較式才顯示。`op` ∈ `>=` `<=` `>` `<` `==` `!=`。
  - 與既有 `require`（道具）**同時存在時為 AND**（兩者都過才顯示）。
- **讀取——確定性分支（node 欄位）**：
  - `valueCheck: { var, op, threshold, pass, fail }` — 引擎「即將進入」該節點時求值，確定性重導到 `pass` 或 `fail` 節點（**不擲骰**）。玩家不會停在此節點，故它是純路由節點（`scene`/`choices` 可留空）。
  - 可鏈式（pass/fail 再指向另一個 valueCheck 節點），含 50 層迴圈防護。
  - 執行順序：在 `steerAt` 高潮導引與 `turnLimit` 強制結束**之前**。
- **比較運算子的型別規則**（`requireFlag` 與 `valueCheck` 共用 `evalFlagCond`，直接套 JS 運算子、不做型別轉換）：
  - **字串變數只用 `==` / `!=`**：兩邊都是字串時為值比較，正確可靠（如 `set:{route:"short"}` 配 `op:"==", threshold:"short"`）。
  - **`> < >= <=` 只給數字**：對字串會做**字典序**比較（非報錯但通常非本意），字串旗標勿用。
  - `==` 為**寬鬆**等於：threshold 型別要與變數一致（字串變數配字串、`addValue` 出來的數字變數配數字），勿拿數字變數跟字串 `"5"` 比（會型別轉換意外相等）。
  - **未 set 過的變數**＝`undefined`：`== 任何字串` 為 false（走 fail）、`!=` 為 true，可作為「沒選過就走預設」的自然預設。
- **多門檻／多結局**：用多個 `valueCheck` 節點串接即可（例：先比 `<=10` 分兩路，pass 支再比 `<=5`）。
- **相容性**：全部選填、加法式；無這些欄位的既有副本行為完全不變（`runState._flags` 保持 `{}`，`evalFlagCond` 不被呼叫）。
- **與 `require` 的分工**：`require` 只查「背包持有道具」；「選了什麼／累積多少」一律走 flags/vars，**禁止**用 internal 道具濫充旗標（語意骯髒、污染道具稽核）。
- **與 accumulate 的分工**：`accumulate` 是「累積數值 → **機率**判定」（最終擲骰）；flags/vars 的 `valueCheck` 是「累積數值 → **確定性**比較」（不擲骰）。兩者互不取代。

```js
// choice：抄捷徑，記下選擇並累加時間
{ text:"抄捷徑（+5 分鐘）", set:{ route:"short" }, addValue:{ time:5 }, next:"junction" }
// choice：只有抄過捷徑的人看得到
{ text:"【暗門】", requireFlag:{ var:"route", op:"==", threshold:"short" }, next:"arrival" }
// node：純路由，依 time 確定性分岔到不同結局
arrival: { valueCheck:{ var:"time", op:"<=", threshold:10, pass:"win_ontime", fail:"win_late" }, choices:[] }
```

---

### 回合數哨兵顯示

當 `scenario.turnLimit === 99` 時，副本內右上角的回合計數器分母渲染為 `??`，分子照常累加（顯示 `1 / ??`）。

- 引擎只認哨兵值 99，不認劇本名稱或任何其他欄位。
- 內部上限邏輯不變，只影響顯示層。
- 任何 `turnLimit: 99` 的副本自動套用此規則，無需額外設定。

---

## 6. 擴充機制：WINMODE_HOOKS

### 核心規範（所有人必讀）

> **副本專屬邏輯一律寫進 `WINMODE_HOOKS`，絕不寫進 `choose()` 主流程。**

`choose()` 是引擎核心，不能知道任何特定副本的存在。所有「這個副本要做特別的事」都透過 hook 注入。違反此原則會讓引擎主流程積累 if/else 特例，長期形成無人敢碰的技術債。

判斷標準：如果你要在 `choose()` 裡加 `if(某副本特有欄位)`，就是違反了這條規範——把那段邏輯搬進該副本的 `onChoiceMade` hook 裡。

### 設計原則
普通副本不受影響（無 winMode = 無鉤子）。特殊副本透過 `registerWinMode` 登記，邏輯完全隔離。

### 鉤子生命週期與結構
```js
registerWinMode("winMode名稱", {
  skipSteer:     true,   // 略過通用 steerAt 導引
  skipTurnLimit: true,   // 略過通用回合上限強制結束

  // 進入副本時：初始化自訂 state 變數
  onEnter(state){ },

  // 玩家點選選項後（非 check 類選項走這裡，check 類也會呼叫但目前忽略回傳值）
  // ctx = { inventory, runLoot, scenario, turn, checkOk? }
  // 回傳值（選填）：
  //   { overrideNextId: "node_id" }  → 覆蓋引擎預設的下一節點
  //   { endKind: "cleared"|"dead" }  → 直接觸發結算（需同時設 overrideNextId 指向對應結局節點，供 renderEnding 取 scene）
  //   null / undefined               → 照引擎正常處理
  onChoiceMade(choice, state, ctx){ },

  // 進入新節點後：用於自動掉落、狀態更新等
  // 結局節點（node.end 存在）通常應在此直接 return，不觸發副作用
  onNodeEnter(nodeId, state, ctx){ },
});
```

### 目前已登記的 winMode

| winMode | 副本 | 說明 |
|---------|------|------|
| `accumulate` | aquarium | 通用：累積自訂變數、最終機率判定；讀取副本的 `accumulator` 設定物件 |

---

### 通用 winMode：`accumulate`

適用於「在副本過程累積一個數值，最後做一次機率判定決定勝負」的設計。副本只需填 `winMode:"accumulate"` 並提供 `accumulator` 設定物件，不需要自行寫 hook。

#### `accumulator` 設定欄位

```js
accumulator: {
  stateKey:        "survivalRate",   // runState 變數名稱（任意字串）
  initValue:       0,                // 進場時的初始值
  choiceKey:       "survival",       // choice 上的累加欄位名稱（choice[choiceKey] 加進 state）
  finalChoiceKey:  "finalRoll",      // choice 上的「觸發最終判定」旗標欄位名稱
  roll:            { min: 1, max: 100 },  // 骰子範圍（含兩端）
  bonusFrom:       "finalBonus",     // ITEMS 欄位：道具加成來源（同名道具只算一次）
  winIf:           "roll_lte_value", // 勝利條件 enum（見下方）
  overflow:        { achievementRoll: true },  // total >= max 時的溢出行為（選填）
  skipSteer:       true,             // 略過通用 steerAt 高潮導引
  skipTurnLimit:   true,             // 略過通用回合上限強制結束
  autoDropPerNode: true,             // 每回合進節點時對 pool 擲掉落；drop 為「每回合」固定機率，尚未取得者每回合各自獨立擲一次（選填，預設 false）
}
```

#### winIf enum 清單

| 值 | 意義 |
|----|------|
| `"roll_lte_value"` | `roll ≤ (stateValue + bonus)` 則勝利 |

> ⚠️ 勝利條件**一律用 enum**，禁止用字串 eval。新增條件請在 `index.html` 的 `WIN_CONDITIONS` 物件裡新增對應函式。

#### 最終判定邏輯（自動）

```
total = state[stateKey] + computeAccumulatorBonus(inventory, bonusFrom)

if total >= roll.max:
  → 必定勝利
  → 若 overflow.achievementRoll，以 (total - roll.max) 作為 overflow 觸發成就骰
else:
  → roll = random(roll.min ~ roll.max)
  → WIN_CONDITIONS[winIf](roll, total) ? 勝利 : 失敗
```

#### 道具設計（配合 accumulate）

不進裝備系統的加成道具請設 `slot: null`，加成欄位名稱對應 `accumulator.bonusFrom`：

```js
// 範例：aquarium 的道具用 finalBonus 欄位
"rusty_fish_knife": { ..., slot: null, finalBonus: 20 }
```

### 新增特殊副本的步驟

**若機制能用 `accumulate` 描述（最優先）：**
1. 建立劇本 `.js` 檔，填 `winMode:"accumulate"` 並設計 `accumulator` 物件
2. 在 `index.html` script 載入區加一行 `<script src>`
3. 若有專屬道具，設 `slot:null`、對應的 bonusFrom 欄位，加進 ITEMS

**若機制無法用現有 winMode 描述（需要全新 hook）：**
1. 在 `WINMODE_HOOKS` 區塊加一個 `registerWinMode(...)`，**邏輯完全自包含**
2. 建立劇本 `.js` 檔，填對應的 `winMode` 字串
3. 在 `index.html` script 載入區加一行 `<script src>`
4. 若有專屬道具，加進 ITEMS

---

## 7. 副本清單

| 檔案 | 標題 | Tier | 類型 | 特殊機制 |
|------|------|------|------|----------|
| hospital_01.js | 廢棄醫院 | T1 | 普通 | 無 |
| store_01.js | 深夜便利商店 | T1 | 普通 | 無 |
| metro_01.js | 廢棄地鐵站 | T1 | 普通 | locked，需 80 點解鎖 |
| wreck_01.js | 傾覆的沉船 | T2 | 普通 | 無 |
| aquarium_01.js | 閉館後的藍 | T1 | **特殊** | winMode:"accumulate"，survivalRate 累積，最終判定，每回合自動掉落 |

### aquarium_01 專屬道具（ITEMS，slot:null，不進裝備系統）
| id | 名稱 | drop | finalBonus | rarity |
|----|------|------|------------|--------|
| rusty_fish_knife | 生鏽的殺魚刀 | 30% | +20% | blue |
| eye_hook | 勾著眼珠的魚鉤 | 35% | +10% | green |
| humanface_fish | 長著人臉的魚 | 0.1% | +50% | yellow，carry |

### aquarium_01 成就
| id | 名稱 | 觸發條件 | rarity | visible |
|----|------|----------|--------|---------|
| aquarium_perfect_clear | [隱藏成就] 過於完美的通關 | overflow > 0，以 overflow% 骰 | red | false |

---

## 8. 重要常數

```js
const TIER2_COST = 50;            // 進入 T2 需要的點數
const CARRY_ESCAPE_CHANCE = 0.10; // 死亡時 carry 道具的奇蹟保留機率
const SAVE_KEY = "mugen_save_v2"; // localStorage 鍵名
```

### 稀有度對照
| 代碼 | 標籤 | 建議用途 |
|------|------|----------|
| white | 普通 | 常見掉落 |
| green | 稀有 | 較常見 |
| blue | 精良 | 一般副本掉落上限 |
| yellow | 史詩 | 少見 |
| red | 傳說 | 非常稀有、特殊成就 |
| gold | 神器 | 活動限定 |
| rainbow | 彩虹 | 最高級 |

### 裝備槽
`head` / `body` / `feet` / `weapon` / `amulet` / `acc1` / `acc2`
特殊道具（只影響最終判定，不裝備）用 `slot:null`

---

## 9. 待辦與已知未解決事項

- [ ] **擴充劇本**（最關鍵）——現有 5 個，體感無限至少需要 10+
- [ ] **擴充道具池**——ITEMS 與 SHOP_ITEMS 都還很少，head/feet 槽完全空白
- [ ] **寶物庫系統**——成就累積到一定數量後觸發（接口：`triggerAchievementRoll` 已留，內容待設計）
- [ ] 數值平衡——DC、掉落率、獎勵點數整體調整
- [ ] 商店擴充——更多可購買裝備
- [ ] Tier 3 副本
- [ ] 成就獎勵類型「頭銜」的 Hub 顯示位置尚未設計

---

## 10. 合作方式（請遵守）

- 改程式碼時**指明改哪裡（檔案 + 函式）**，不要貼整份。
- 新劇本**只需貼 `.js` 檔內容**，不用動 `index.html` 其他部分（特殊劇本除外，需加 registerWinMode）。
- 遇到「特殊劇本」標註：用 `WINMODE_HOOKS` 新增鉤子，**不要**把邏輯加進引擎 if/else。
- 全程**台灣繁體中文**。
- 動工前先說明計畫，等確認後再改。每做完一項可測試再進下一步。

---

## 11. 用 AI 離線生成內容

給 AI 的提示詞範本：見上一個 session 產出的提示詞（包含劇本格式、流程引導、輸出格式說明）。

生成後：
- 普通劇本 → 存成 `scenarios/xxx.js` + `index.html` 加一行 `<script src>`
- 特殊劇本 → 同上，另需在 `WINMODE_HOOKS` 區塊登記
- 新道具 → 貼進 `index.html` 的 `ITEMS` 物件
- 新成就 → 貼進 `index.html` 的 `ACHIEVEMENTS` 物件

**⚠️ API key 絕對不能進任何會公開的檔案。**
