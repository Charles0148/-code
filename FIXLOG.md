# FIXLOG

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
