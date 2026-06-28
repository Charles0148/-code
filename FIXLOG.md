# FIXLOG

---

## 2026-06-29 — 成就定義未寫回檔案，觸發後無反應

症狀：
bakery_01 走到 node_hidden_final，引擎呼叫 unlockAchievement("ach_1782663164619")，
但畫面無成就解鎖 popup，成就列表也未更新。

根因：
作者在 Dev 面板新增了 ach_1782663164619，Dev 面板直接寫入執行記憶體中的 ACHIEVEMENTS 物件，
但未透過匯出流程貼回 data/achievements.js；
頁面重新整理後該成就消失，unlockAchievement 取 ACHIEVEMENTS[id] 得到 undefined，
雖然 id 被加進 unlockedAchievements Set，但 popup 渲染因 ach 為 undefined 靜默跳過，
也因此不顯示任何解鎖動畫。

錯誤直覺：
「節點的 achievement 欄位或引擎觸發邏輯有問題」——
實際上引擎觸發完全正確，問題在資料層根本不存在該成就定義。

正確修法：
將 ach_1782663164619 定義補入 data/achievements.js 的 ACHIEVEMENTS 物件。

波及檔案：
- data/achievements.js（補入成就定義）

---

## 2026-06-28 — autoDrop 語意誤解：誤改為整局只擲一次

症狀：
commit e1b503f 把 rollAutoDrops 改為使用 Set（autoDropRolled）記錄已擲過的道具，
確保整局每顆道具只擲一次；7628eef 完全復原。

根因：
在修改前未向作者確認「drop 代表整局機率還是每回合機率」，逕自假設「整局只擲一次語意更合理」。
實際設計是每回合進節點時獨立擲骰（per-node fixed probability），
已持有的道具由 `inventory.some(it => it.name === def.name)` 擋掉重複取得，
不需要 Set 記錄已擲狀態。

錯誤直覺：
「drop 是掉落率，整局只擲一次比較符合直覺（像 RPG 的全局掉落旗標）」——
但此遊戲的設計是累積曝光：多回合探索、每回合都有獨立機會遇到道具，
整局只擲一次會讓前幾回合沒掉的道具後面再也不會出現。

正確修法：
git revert e1b503f 邏輯，刪除 autoDropRolled Set 與相關 reset 程式碼，
rollAutoDrops 恢復為對每個未持有的道具獨立 Math.random() < def.drop 判斷。

波及檔案：
- index.html（rollAutoDrops 函式，以及 runEnter 中的 autoDropRolled.clear() 呼叫）

---

## 2026-06-28 — 副本 pool 變更不出現在差異匯出

症狀：
Dev 面板點擊道具卡片的「副本分配」chip 移除某副本後，
Tab 1 / Tab 4 的匯出區塊沒有顯示任何 pool 變更輸出。

根因：
ITEMS diff（getDataDiff(ITEMS, ITEMS_BASELINE)）只比較道具本身的屬性，
pool 陣列住在 SCENARIOS[id].pool，根本不在 ITEMS 比較範圍內，
因此 chip 點擊修改 pool 後，ITEMS diff 永遠為空，不觸發任何輸出。

錯誤直覺：
「副本分配 chip 修改的是道具與副本的關聯，應該會反映在道具的匯出裡」——
實際上 chip 直接寫入 SCENARIOS[id].pool，與 ITEMS 物件完全分離。

正確修法：
1. 頁面載入時額外快照 SCENARIOS_POOL_BASELINE（各副本 pool 陣列的淺拷貝）
2. 新增 getPoolDiff() 比較 SCENARIOS[*].pool 與基線
3. 新增 buildPoolDiffExport() 渲染 pool 變更區塊（含 grep 提示 + 可複製的新 pool 陣列）
4. Tab 1 與 Tab 4 的匯出渲染函式末尾呼叫 buildPoolDiffExport()

波及檔案：
- index.html（基線快照段、getPoolDiff、buildPoolDiffExport、Tab 1 / Tab 4 匯出渲染）

---

## 2026-06-28 — 副本分配 chip 點擊後差異匯出未即時更新

症狀：
點擊道具卡片的副本分配 chip 移除副本後，差異匯出區塊不自動重繪，
需手動切換 Tab 或觸發其他 input 事件才會顯示 pool 變更。

根因：
差異匯出監聽 `input` / `change` 事件來觸發重繪；
chip 是 `<button>` 元素，點擊只觸發 `click`，不冒泡 `change` 事件，
因此 pool 已被修改但渲染函式未被呼叫。

錯誤直覺：
「chip 的 onclick handler 修改了 SCENARIOS pool，監聽器應該能感知到」——
DOM 事件與資料變動是完全分離的；監聽器感知的是 DOM 事件，不是 JS 物件的屬性變化。

正確修法：
在 chip 的 onclick handler 末尾加一行：
`chip.dispatchEvent(new Event("change", { bubbles:true }));`
讓 chip 點擊也能觸發 change 冒泡，與其他 input 元素的行為一致。

波及檔案：
- index.html（buildCard 函式中 chip 的 onclick handler）

---

## 2026-06-28 — items_core.js 工作目錄編碼損壞

症狀：
驗收流程中，`node tools/item_audit.js` 執行 `new Function("localItems", modified)` 時拋出
「Invalid or unexpected token」，日誌顯示字串值如 `"name": "?蝑?` 為亂碼，
但 `git show HEAD:data/items_core.js` 可正常顯示繁體中文。

根因：
前一 session 由 Write 工具寫入的工作目錄版 items_core.js，
帶有 UTF-8 BOM（EF BB BF）但正文並非合法 UTF-8——
`fs.readFileSync(path, "utf8")` 讀回後，中文字串被替換為 `?` 與無關漢字混雜的亂碼，
導致字串 token 未閉合，`new Function` 解析失敗。
git 倉庫中的版本（c55a645 提交）仍為正確 UTF-8，未受影響。

錯誤直覺：
在 `item_audit.js` 加入 BOM 剝除（`src.charCodeAt(0) === 0xFEFF ? src.slice(1) : src`）；
實際上剝除 BOM 後正文仍是亂碼，問題不在 BOM 而在正文編碼，此修法無效。

正確修法：
`git checkout HEAD -- data/items_core.js`，以 git 追蹤的正確版本覆蓋損壞的工作目錄檔。
BOM 剝除程式碼已寫入 item_audit.js 作為防禦性保護（對其他可能帶 BOM 的檔案有益），保留。

波及檔案：
- data/items_core.js（工作目錄，git restore 後恢復正常）
- tools/item_audit.js（新增 BOM 剝除保護，副作用無害）

---

## resolveEnd 未排除 internal 道具，shop_intact 出現在死亡損失清單 (2026-06-27)
- 症狀：走「下樓（店完好）」拿到 shop_intact 後死亡，結算的「損失道具」清單出現「完好的麵包店」，玩家可見此隱形標記道具。
- 根因：resolveEnd 三個迴圈（通關、強制退出、一般失敗）在組裝面向玩家的結算清單時，未排除 internal:true 的道具，shop_intact 因 carry:false 被 push 進 ending.lost / ending.consumed。
- 錯誤直覺：以為 processGrant 的 `if(!entry.internal)` 防線已足夠——但那道防線只攔授予端的彈窗，離場結算端是完全獨立的路徑，授予端的過濾對它無效。
- 正確修法：在三個跑過 runLoot 的迴圈最前面各加一行 `if(it.internal){ removeFromInventory(it); continue; }`，靜默清除、跳過所有 push 步驟。清除行為不變，只修顯示。
- 波及檔案：index.html（resolveEnd 函式，通關迴圈約第 1212 行、強制退出迴圈約第 1223 行、一般失敗迴圈約第 1232 行）

---

## Dev 加點後需重整才能花用 (2026-06-26)
- 症狀：Dev 面板按「+點數」後 HUD 數字增加，但 T2 按鈕與商店購買按鈕仍 disabled；重整頁面後才恢復正常。
- 根因：加點 handler 只更新 $("points").textContent 與 localStorage，未呼叫 render()；T2/商店 disabled 判斷在 renderHub()/renderShop() 裡，沒有重新執行。
- 錯誤直覺：以為 HUD 數字更新就等於狀態已同步，忽略 disabled 邏輯在 render() 路徑裡才重算。
- 正確修法：Dev 加點 handler 尾端改呼叫 render()，與一般加點（商店賣道具）的 save + render 路徑一致。
- 波及檔案：index.html（Dev 加點 handler，約第 1643 行）

---

## HUD ω 渲染成大寫 Ω (2026-06-26)
- 症狀：HUD 右上角的 ω 字元永遠顯示為大寫 Ω；換任何字型（Calibri、Noto Sans、system-ui 等）均無效。
- 根因：.sys-top 套了 text-transform: uppercase，把原始碼正確的小寫 ω（U+03C9）在渲染時強制轉成 Ω，與字型完全無關。
- 錯誤直覺：誤判為字型缺 Greek glyph 或 JetBrains Mono 把 ω 設計成 Ω 形狀，連續替換四種字型（M PLUS Rounded 1c、Calibri、Noto Sans、system-ui）均無效，浪費多輪診斷。
- 正確修法：從 .sys-top CSS 規則移除 text-transform: uppercase（.sys-top 內僅含中文標題與數字，無元素依賴此規則）。正確診斷順序：先排 CSS 大小寫轉換（uppercase/capitalize），再確認原始碼碼位，最後才懷疑字型。
- 波及檔案：index.html（.sys-top CSS，約第 37 行）

---

## 2026-06-26 — grant 授予 internal 道具彈出空 popup 卡住

症狀：
進入 bakery_01 的 `node_descend`（`grant: ["shop_intact"]`）時，畫面彈出「獲得道具 × 0」的 popup 並卡住，無法繼續遊戲。

根因：
`processGrant` 對所有授予道具一律推入 `pendingLootItems`。`renderLootPopup` 雖已在卡片迴圈過濾 `internal:true`，但 popup 的觸發判斷是 `pendingLootItems.length > 0`——`shop_intact` 仍會讓 popup 開啟，只是內容空白、標題顯示「× 0」。

錯誤直覺：
「在 `renderLootPopup` 裡過濾就夠了」——卡片確實不顯示，但 popup 本身因 `length > 0` 仍會彈出，造成空殼 popup 卡住流程，體驗反而更差。

正確修法：
在 `processGrant` 推入 `pendingLootItems` 前攔截：
```js
if(!entry.internal) pendingLootItems.push({ entry, autoEquipped });
```
`internal:true` 道具靜默加入 `inventory` 和 `runLoot`，完全不進 popup 流程。

波及檔案：`index.html`（`processGrant` 函式，約第 916 行）
