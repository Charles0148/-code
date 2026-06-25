# FIXLOG

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
