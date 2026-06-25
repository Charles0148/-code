# DEVLOG

---

## 2026-06-26 — 審查並修正 handoff skill 的 git 語法

狀態：SKILL.md 已修正，handoff 流程可正常觸發並取得真實 repo 狀態。

做了什麼：
- 審查 `.claude/skills/handoff/SKILL.md` 三處語法：`disable-model-invocation`、`! git` 前置語法、`/handoff` 觸發
- 確認 `! git status` / `! git diff HEAD` / `! git log` 的 `!` 自動執行語法在目前版本不支援，改為純文字指示由 Bash 工具主動執行
- 修正 SKILL.md 第一步：移除三行 `!` 語法，改為明確要求先執行三道 git 指令再進行後續步驟
- 確認 FIXLOG.md 格式完整（五欄齊備）、CLAUDE.md 第 5 節兩條 internal 待辦均已存在，無需更動

技術決策：
- `disable-model-invocation` 維持原樣，待觀察是否真的阻止自動觸發
- `name: handoff` 維持英文，中文 name 雖技術上支援但未測試，維持現狀

下一步：
- 觀察 /handoff 在實際工作後觸發是否正常運作（本次為首次真實觸發）

---

## 2026-06-26 — 接入 bakery_01 副本並修正引擎 grant/require 缺口

狀態：bakery_01（凌晨四點的麵包店）已完整接入引擎，六個副本全部可玩；網站已部署至 GitHub Pages（https://charles0148.github.io/-code/）。

做了什麼：
- 將 bakery_01.js（v4 完全貼合原稿重建版）接入引擎，確認 `<script src="scenarios/bakery_01.js">` 已存在第 542 行
- 新增 ITEMS：`shop_intact`（internal 標記）；更新 `frag_2`、`frag_3`、`old_baseball` 的 effect 文字至 v4 版本；刪除已廢棄的 `hidden_key`（確認無其他副本引用）
- 擴充 `require` 判定支援陣列 AND（`node_true_5` 隱藏選項需同時持有 `old_baseball` 與 `shop_intact`）
- `processGrant` 補上 `internal` 欄位傳遞，讓 grant 授予的道具能正確被 UI 過濾
- 三處 inventory UI（Hub 背包、裝備管理、商店出售）加 `internal:true` 過濾
- loot popup 標題計數與卡片迴圈加 `internal:true` 過濾
- DEV 面板 Tab 3 的 require 顯示支援陣列（以「 & 」連接）
- 修正 grant 路徑的空 popup bug（見 FIXLOG）
- 刪除頁面底部的開發說明文字（`footnote` 函式）
- 部署至 GitHub Pages，對外網址確認可用

技術決策：
- `require` 陣列改為「引擎層支援 Array.isArray 三分支」← 比退路方案（合併成單一中介道具 hidden_ok）更乾淨，且對未來多條件副本有通用性
- `internal:true` 道具靜默授予，在 `processGrant` 層攔截不推入 `pendingLootItems` ← 比在 `renderLootPopup` 過濾更早，避免「獲得道具 × 0」的空 popup 彈出
- 刪除 `hidden_key`（v3 舊產物），確認無其他副本引用後才刪除
- 新增 CLAUDE.md「引擎能力契約」區塊（第 5 節），記錄 require、requireMemory、internal 的當前真相與待辦

下一步：
- 朋友測試回饋後視需要修 bug
- 擴充副本數量（目前 6 個，目標 10+）
- head/feet 裝備槽目前完全空白，可補道具
- internal:true 待辦兩項（見 CLAUDE.md 第 5 節）：引擎強制隱含 carry:false、resolveEnd 明確排除 internal
