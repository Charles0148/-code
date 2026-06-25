# DESIGNLOG

---

## 2026-06-26 — 交接系統建置與引擎契約三項確認

劇本/設定定案：
- requireMemory 機制目前「未實作」（來自 Claude Code 對 repo 的確認）。memoryPower:true 目前只是道具標記，引擎不讀取它來控制選項可見性。規格預留：檢查「武器槽裝備欄」（不是背包）是否有 memoryPower:true 道具，滿足才顯示選項，否則整個隱藏（不是反灰）。
  → 直接規則：法國麵包的隱藏記憶序列在現階段不可使用 requireMemory 觸發；要用到它的劇本，須將「實作 requireMemory」列為該劇本的前置需求交給 Claude Code。
- require 欄位目前只支援正向：無 require（永遠顯示）／單一道具／陣列 AND（同時持有）。反向（not）與 OR（any）未實作。
  → 直接規則：劇本不可使用契約未列出的反向或 OR 閘門；需要時標記「需引擎新增」交回 Claude Code，不可用其他寫法硬湊假閘門。
- internal:true 道具：透過 grant 靜默授予、不彈 popup、不進任何 UI；離場清除目前依賴 carry:false 間接達成（非引擎強制）。
  → 直接規則：凡 internal:true 道具必須同時設 carry:false，否則會悄悄滲入永久背包且 UI 不可見、極難 debug。

設計原則/教訓：
- 「保護來自一個沒被強制的慣例」是最危險的一類設計 ← internal 的離場清除靠作者每次手動加 carry:false，引擎沒強制；錯誤直覺是「看起來有保護就安全」。已交付待辦：理想上引擎應讓 internal:true 自動視同 carry:false。
- require ≠ requireMemory，不可混用 ← 前者查背包「持有」，後者查裝備槽「裝備」；玩家可能持有卻未裝備，語意不同，不可用 require 頂替 requireMemory。
- 機制隔離原則再次確認 ← requireMemory 等跨副本機制，等到真正需要它的副本才加進引擎，不放進全域。

有效的提示詞：
- 「確認 + 補缺」型提示詞對日誌/契約維護很有效：要求對著 repo 真實狀態回答、不確定標『待確認』、有就別動缺才補、先給草稿再寫檔。能避免 AI 熱心重寫已正確的內容。

給 Claude Code 的交接：
- 本次無新的劇本機制需求。internal 的兩條待辦（隱含 carry:false、carry-out/賣錢防護）已於本次寫入 CLAUDE.md 引擎契約，無額外動作。

下一步：
- 開始設計下一個 scenario。屆時若用到記憶機制，將「實作 requireMemory（檢查裝備槽）」作為該劇本前置需求交給 Claude Code，正式啟用該機制。
