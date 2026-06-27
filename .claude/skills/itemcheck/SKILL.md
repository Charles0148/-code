---
name: itemcheck
description: 手動執行道具 id / name 稽核，比對 ITEMS 定義與 scenarios 引用，回報重複或錯誤代號。
allowed-tools: [Bash]
---

# /itemcheck — 道具稽核

當作者輸入 `/itemcheck` 時：

1. 於 repo 根目錄執行：`node tools/item_audit.js`
2. 擷取腳本的完整 stdout 與退出碼。
3. 呈現結果：
   - 退出碼 0 → 先回報「✅ 道具稽核通過，無重複或錯誤代號」，再附上對應表。
   - 退出碼 1 → 先回報「⚠ 發現 N 個道具問題」，把「問題清單」段落放最前面，再附對應表供對照。
4. 僅回報，不自動修改任何檔案。任何修正方案都交由作者決定後另行處理。
