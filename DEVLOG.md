# DEVLOG

---

## 2026-07-01 — win 型別第三型 objective + 標籤唯一真相來源 + 稽核執法；版本 Test10

狀態：已實作，preview 無 console error、/scenariocheck 與 /itemcheck 皆 exit 0；尚未 commit/push（與 Test09 flags/vars 同一批未推）。

背景：作家有「限時完成一連串日常任務」的新劇本型別，非 escape 也非 survive。掃描確認 `win` 只在 `choose()` 的 turnLimit fallback（[index.html] `win==="survive"?cleared:dead`）與顯示標籤兩處被讀取，且標籤 map 已預留 `objective` key。決定把第三型正式化，並把標籤治理成「單一真相 + 機械稽核」以防日後亂填。

做了什麼：
- index.html 抽出 `WIN_LABELS` 常數（escape/survive/objective 三型）為標籤唯一真相來源，放在頂部常數區；render 改查此表並加防禦退回（未知值顯示原字串而非 undefined），取代原本內嵌的 map 字面量。
- CLAUDE.md §3 新增「win 型別規則」表：三型的標籤、語意、turnLimit fallback 結局；標明 win 不參與 node.end 實際勝負、objective 勝負建議用 valueCheck+明確 end 節點決定；列出新增第四型需同步的四處。
- tools/scenario_audit.js 新增「檢查 4：win 型別合法性」：scenario.win 不在 {escape,survive,objective} 即 ❌ 計入退出碼（WIN_ALLOWED 須與 WIN_LABELS keys 同步）；.claude/skills 之 /scenariocheck 沿用。
- Dev 版本號 Test09→Test10。
- CLAUDE.md §5 flags/vars 段補上比較運算子型別規則：字串只用 ==/!=（值比較，node 實跑驗證）、> < >= <= 只給數字（字串會走字典序）、== 為寬鬆等於故 threshold 型別須與變數一致、未 set 變數＝undefined 可作預設走 fail。

技術決策：
- objective 的 turnLimit fallback 沿用 escape 語意（超時＝dead＝沒在時限內完成），故 choose() 第 446 行無須改動，只擴標籤＋稽核 ← 「在時限內完成」的自然反面是「超時＝失敗」；若未來要「超時算贏」的變體，才需動 fallback（已在契約標明四處同步點）。
- 標籤治理選「單一常數 + 稽核執法」而非只寫文件規則 ← 專案既有哲學是機械判斷由 code；純文件規則擋不住亂填，稽核才是真防線。
- render 未知值退回原字串而非丟錯 ← 稽核已在 dev-time 攔非法值，runtime 只需不顯示 undefined 的防禦性退路。

下一步：
- /scenariocheck 擴充（承 Test09）：flags/vars 幽靈旗標偵測、valueCheck.pass/fail 併入節點引用集。
- 接作家的 objective 型新劇本。

---

## 2026-07-01 — 引擎新增 flags/vars 通用原語（選擇歷史閘門 + 確定性數值分支）；版本 Test09

狀態：已實作並 preview 實跑驗收（3 條路徑全通過 + 既有副本回歸無干擾）；尚未 commit/push。

背景：作家劇本需求有兩類現有機制做不到——① 選項出現/結局取決於「先前選了哪個」（非持有道具）；② 選項對應「花費時間」累加，與 deadline 做**確定性**比較後分岔（非擲骰、非 accumulate 的機率判定）。讀引擎程式碼確認 `require` 只查背包、`check` 是 d20 機率、`accumulate` 最終是擲骰，皆無法乾淨表達。決定加一個通用 flags/vars 原語一次解掉兩者。

做了什麼（全在 index.html，加法式、向後相容）：
- `runState._flags` 揮發狀態袋，`enterTier` 以 `scenario.initFlags` 初始化（不進 localStorage）。
- 新增三個 helper：`applyChoiceEffects`（套用 `choice.set` / `choice.addValue`）、`evalFlagCond`（字串＝存在真值；`{var,op,threshold}` 六種比較）、`resolveValueCheck`（進節點時依 `node.valueCheck` 確定性重導 pass/fail，鏈式 + 50 層迴圈防護）。
- `choose()` 接線：一進來就 `applyChoiceEffects`（在算分支前，valueCheck 才看得到更新值）；算出 nextId 後 `resolveValueCheck`（在 steer/turnLimit 之前）。
- 選項可見性過濾加 `requireFlag`（與既有道具 `require` 為 AND）。
- CLAUDE.md §5 新增「flags/vars 通用原語」段、require 表補註記；Dev 版本號 Test08→Test09。

驗收（preview_eval 三路徑）：
- 抄捷徑 time=5、route=short → 暗門選項可見、valueCheck ≤10 pass → win_ontime(cleared)。
- 繞遠路 time=15、route=long → 暗門隱藏、valueCheck >10 fail → win_late(dead)。
- 抄捷徑+徘徊 time=15 → 證明 addValue 跨節點/自迴圈累加、valueCheck 讀更新值 → win_late。
- 回歸：hospital_01 無 flag 欄位，start→window 正常、`runState._flags` 保持 `{}` 無干擾。
- 測試副本 `_flagtest_01` 驗收後已刪除（避免污染隨機抽選池），index.html script 標籤一併移除。

技術決策：
- 選通用原語而非 winMode hook ← 這是任何普通副本都會用到的跨節點條件/數值能力，屬引擎通用原語（如同 require/check），不是單一副本專屬邏輯，故進核心而非 hook；仍守 §6（不寫任何副本專屬 if/else）。
- `valueCheck` 放在 steer/turnLimit 之前 ← 它是正常路由的一部分；若重導到 end 節點，後續 steer/turnLimit 的 `!isEnd` 判斷自然略過。
- 明令禁止用 internal 道具濫充旗標 ← 語意骯髒且污染 /itemcheck；既然有乾淨原語就不留後門。

下一步：
- /scenariocheck 擴充：`requireFlag`/`valueCheck` 指向的 var 是否有某處 `set`/`addValue`（幽靈旗標）；`valueCheck.pass/fail` 併入節點引用集（否則被誤報孤兒）。
- 擴充副本數量（目前 6，目標 10+）。

---

## 2026-06-30 — 副本圖鑑系統（持久層 + endingId + 帶出記錄 + manifest + UI + 共通道具區）；版本 Test08

狀態：已 commit 並 push（版本 Test08）。/scenariocheck、/itemcheck 皆 exit 0；preview 實跑驗收全通過。

做了什麼：
- 引擎持久層新增三個只增不刪集合（存進同一份 mugen_save_v2）：seenEndings（已見結局 id）、carriedItems（已帶出道具 id）、visitedScenarios（曾進入副本 id）。saveState/loadState/init 三處同步。
- 節點欄位 endingId：進節點時於 processGrant 之後、resolveEnd 之前 recordEnding，時機與既有 achievement 欄位完全相同；無 endingId 節點行為不變。
- 帶出記錄（recordCarried）：三個 runLoot entry 建立點（processGrant / rollDrops / rollAutoDrops）蓋上 id；resolveEnd 三條「真正進永久背包」提交點（cleared 的 carried、強制退出的 goddessGifts、一般失敗的 escaped 奇蹟逃脫）呼叫 recordCarried，以 id 為鍵；內含 ITEMS[id].internal 額外防線。
- visitedScenarios 在 enterTier（唯一進入點，含 DEV 強制）記錄。
- 新增 data/compendium.js（COMPENDIUM manifest + COMPENDIUM_COMMON 共通道具），index.html 在引擎主體前載入。
- 6 個副本 10 個結局節點全部接上 endingId；manifest 收錄全 6 副本。
- 新增 renderCompendium UI（Hub「副本圖鑑」入口）：按副本分區（結局/道具/成就，空類別跳過）+ 獨立「共通道具」區；未解鎖一律「？？？」；蒐集率平攤、全局率為所有格數總和之比。
- 共通道具（domain:"core" 且 carry:true：amulet、compass）獨立成區、不掛在任一副本下，避免「帶一顆 amulet 三個副本同時亮」。專屬欄位 from（出沒來源），UI 解析為副本名。
- 副本門檻：副本須「曾進入」才出現在圖鑑；共通道具逐顆判定，須進過其 from 來源之一才揭露（只玩麵包店不揭露任何共通道具）；出沒行只列「已進過」的來源。

技術決策：
- 帶出記錄以 id 為鍵，但背包 entry 原本只存 name → 在三個 runLoot entry 建立點蓋 id，提交時讀 it.id（商店道具不進 runLoot、無 id，自然不記錄）。internal 雙重防線（loop 頂的 it.internal + 提交點的 ITEMS[id].internal）順帶補上 rollDrops entry 未複製 internal 旗標的潛在缺口。
- aquarium（accumulate winMode）結局走 choose() 正常路徑：因 onChoiceMade 只回傳 overrideNextId、不回傳 endKind，故 node.endingId 照常被記錄，引擎 hook 路徑無須改動（已實跑確認 endingId + 帶出 + 成就三者皆正確）。
- 共通道具用獨立 const COMPENDIUM_COMMON（非塞進 COMPENDIUM 的 scenario key），UI 以 typeof 防衛性讀取。

下一步：
- 把 endingId 納入 scenario_audit 的交叉稽核（endingId↔manifest 雙向齊全、manifest 宣告道具是否真 carry:true）— 另開工單。
- 擴充副本數量（目前 6 個，目標 10+）。
- 寶物庫系統（成就累積觸發）。

---

## 2026-06-30 — scenario_audit 新增檢查 3：節點成就 id 存在性；版本 Test07

狀態：已 commit 並 push（commit aec6af2，版本 Test07）；工作目錄乾淨。正向 6 劇本全通過、反向注入不存在成就 id 被攔（退出碼 1）；/scenariocheck、/itemcheck 皆 exit 0。

做了什麼：
- tools/scenario_audit.js 新增「檢查 3：節點成就 id 存在性」：node.achievement 指向 ACHIEVEMENTS 未定義 id（成就幽靈）即計入退出碼
- 載入 data/achievements.js：因其為 const ACHIEVEMENTS = {...} 宣告式（非 scenarios 的賦值式），以 eval 末尾附 global.ACHIEVEMENTS = ACHIEVEMENTS 取出，含 UTF-8 BOM 剝除 + try/catch 防護
- 只檢查節點層 achievement（對齊引擎：index.html 僅 if(node.achievement) unlockAchievement），不檢查 choice 層
- 頭部註解、逐劇本摘要、問題清單、退出碼說明同步更新
- .claude/skills/scenariocheck/SKILL.md 描述與通過訊息加入「成就幽靈」

技術決策：
- 範圍只做 node.achievement id 存在性，不擴及 choice.achievement 偵測 ← 引擎根本不讀 choice.achievement，屬另一獨立判斷、另開工單；執法工具不自創契約沒禁的規則
- achievements.js 用 eval 末尾指回 global 取出 ← 嚴格模式 direct eval 的 const 綁在 eval 私有作用域，須在同段 eval 內賦回 global 才取得到（與 scenarios 直接賦值 global.SCENARIOS 的載入方式不同）

下一步：
- 完成 2026-06-29 DEVLOG 標記的「節點成就 id 存在性檢查（需載 achievements.js）」待辦
- 後續：endingId↔manifest 雙向稽核（見同日圖鑑工單）

---

## 2026-06-29 — 新增劇本結構稽核 tools/scenario_audit.js（A2+B2）+ /scenariocheck

狀態：已 commit 並 push 至 GitHub（版本 Test06）；正向 P1 + 反向 N1~N3 驗收全通過，工作目錄乾淨。
       repo 現有 6 個劇本結構全乾淨，可作為新劇本的回歸基準。

做了什麼：
- 新增 tools/scenario_audit.js，與 item_audit.js 並列、職責分離：item_audit 管道具 id/name，本工具只管劇本「結構」
- 檢查 1 節點圖完整性：逐節點逐 choice 蒐集字串型路由目標（next / success / fail / check.success / check.fail）+ 劇本 climaxNode 併入引用集；幽靈節點（被引用未定義）計入退出碼，孤兒節點（定義未引用、非 start）僅 ⓘ 資訊不計退出碼
- 檢查 2 契約未實作機制誤用：require 物件閘門 {not}/{any}、require 陣列含非字串、choice.requireMemory，三者出現即計入退出碼
- 退出碼只由「幽靈節點 + 機制誤用」決定；孤兒不影響退出碼
- 新增 .claude/skills/scenariocheck/SKILL.md，/scenariocheck 比照 /itemcheck 接線
- 載入方式沿用 item_audit.js 的 global.SCENARIOS={}; eval(...)，加 UTF-8 BOM 剝除保護

技術決策：
- 工具放置選 A2（新開 scenario_audit.js）而非 A1（擴充 item_audit.js）← 切割依職責不依大小：item_audit 職責是「道具 id/name」，節點圖屬「劇本結構」，寧可兩支共用一點載入樣板，也不混職責、各自退出碼獨立
- 本次範圍定為 B2（節點圖完整性 + 契約機制誤用），先讀過 item_audit 全文才定範圍 ← item_audit 已涵蓋的（檔內/跨檔重複 id、道具幽靈、name 撞車、domain、internal 配 carry）不重做，避免造重複輪子
- 只強制契約「明確標為 ❌ 未實作」的項目，不自行新增契約沒禁的規則 ← 本工具是契約的執法者，不是立法者
- 引用集只收「字串型」目標、require 機制誤用獨立成檢查 2 ← 避免把 require 物件當路由 id 誤判成 [object Object] 幽靈，遮蔽真正診斷（見 FIXLOG 同日）

刻意排除（防範圍蔓延，留待各自工單）：
- 節點成就 id 存在性檢查（node.achievement 指向的 id 是否真存在）— 真缺口，但需載入 achievements.js，本次不做
- 「choice 沒有任何跳轉目標（點了沒去處）」— 既非幽靈也非契約誤用，現有 6 劇本無此情形，本次不做

教訓：
- 「先讀 → 實跑 → 才定範圍」這次有實效：原想開的「schema 驗證器」約七成已被 item_audit 做掉，沒讀那支就寫工單會大量重複，讀過才擋下重複輪子
- 既有 item_audit 把未實作的 require 物件閘門當 id 丟進引用表會吐 [object Object] 幽靈（沉默誤判）；新工具明確報「契約未實作機制」（明確攔截）。已記錄於 FIXLOG

下一步：
- 節點成就 id 存在性檢查（需載 achievements.js）— 已知缺口，另開工單
- 擴充副本數量（目前 5 個可玩，目標 10+）
- 每次新增/改劇本後執行 /scenariocheck 確認結構乾淨

---

## 2026-06-29 — 成就觸發機制、Dev 匯出欄位化、中離訊息統一、版本號顯示

狀態：全部 commit 並 push 至 GitHub（最新 ver. Test04）；repo 工作目錄乾淨。

做了什麼：
- 新增引擎節點成就觸發：節點物件可設 `achievement: "ach_id"`，引擎進入節點時自動呼叫 unlockAchievement（processGrant 之後、resolveEnd 之前）
- bakery_01 node_hidden_final 加上 `achievement: "ach_1782663164619"`，走完隱藏結局自動解鎖「全壘打」
- data/achievements.js 補入 ach_1782663164619（全壘打）定義；原本只在 Dev 面板新增、未寫回檔案，導致成就無法觸發
- Dev 差異匯出改為欄位級：新增 getFieldDiff()，「修改」類型改為逐欄位列出差異（舊值/新值/可直接貼的新行），不再輸出整塊 Object.assign；「新增」維持整塊，「刪除」維持 delete 語句
- 中離結算訊息統一：resolveEnd 的 ending 物件加入 forceExit 旗標；renderEnding 偵測後改顯示固定文字「你拒絕了記憶的殘片。現在，殘片也拒絕了你。」，不洩漏劇本死亡台詞
- Dev 面板 header 加版本號顯示（`ver. TestXX`，金色 brass 色）
- 道具文字更新（均由作者透過 Dev 面板修改後貼回）：baguette_bat / baguette_bat_echo / baguette_bat_plain 的 effect；baguette_bat_plain 改名為「不願放手的法國麵包」

技術決策：
- 節點成就觸發選「宣告式欄位」而非 winMode hook ← 每個副本開一個 winMode 只為觸發成就屬過度設計；節點路由本身已是條件閘門，到達特定節點即隱含走完了對應路徑，覆蓋九成成就需求
- 複雜成就條件（回合數、累積數值、完成次數）暫不實作 ← 等到第一個真正需要的成就出現時再以 enum 擴充，不預先設計
- Dev 匯出「修改」改為欄位級而非整塊 ← 整塊替換會蓋掉原始碼中的 JS 註解（如 baguette_bat 的 B 段說明）；欄位級輸出讓作者只換有變動的行，其餘原始碼內容完全保留
- ending.forceExit 存進 ending 物件 ← isForceExit 只是 resolveEnd 的參數，不存進物件則 renderEnding 無法判斷；加旗標是最小改動，不影響其他路徑

下一步：
- 擴充副本數量（目前 5 個可玩，目標 10+）
- 複雜成就條件機制（等有需求再做）
- 每次 push 須同時更新版本號（已記入協作規則）

---

## 2026-06-28 — Dev 面板改為差異匯出；復原 autoDrop 誤改；調降 aquarium 掉落率

狀態：index.html 差異匯出功能完成（未 commit）；metro_01 pool 移除 key（未 commit）；aquarium 掉落率已在前一 commit 更新完畢。

做了什麼：
- Dev 面板 Tab 1（道具）、Tab 0（商店）、Tab 4（匯出）全面改為差異匯出：頁面載入時對 ITEMS / SHOP_ITEMS / SCENARIOS[*].pool 各做基線快照，只有被修改的項目才顯示對應的匯出區塊（含所屬檔案提示與可複製 payload）；未改動則顯示提示文字「尚無變更，修改後自動出現」
- 新增劇本 pool 差異偵測（buildPoolDiffExport）：pool 住在 SCENARIOS 而非 ITEMS，需獨立快照（SCENARIOS_POOL_BASELINE）與獨立 diff 函式；副本分配 chip 點擊後補發 change 事件（dispatchEvent）以觸發即時重整
- 復原 autoDrop 誤修：前一 commit（e1b503f）誤改為整局每顆道具只擲一次（Set 記錄已擲），不符設計語意；本 session 確認正確行為是「每回合進節點獨立擲骰，已持有者跳過」，已在 7628eef 完全復原
- 調降 aquarium 掉落率（已於上一 commit）：rusty_fish_knife 0.30→0.15、eye_hook 0.35→0.20
- 作者透過 Dev 面板將廢棄地鐵站（metro_01）pool 移除「護理長的鑰匙」（key），差異匯出顯示正確，pool 已在工作目錄更新

技術決策：
- 差異匯出基線在 `const ITEMS_BASELINE = JSON.parse(JSON.stringify(ITEMS))` 時機點取（所有 data/*.js 載入後、引擎主 script 前），確保捕捉到純資料原始值 ← 若在引擎後取則可能含引擎動態注入的欄位
- pool diff 顯示 `SCENARIOS["metro_01"]` grep 提示而非硬猜副本檔名 ← 副本 id（metro_01）與檔名（metro_01.js）恰好一致，但 aquarium id → 檔名是 aquarium_01.js，直接拼接會出錯，故統一用 grep 提示讓作者自行確認
- 副本分配 chip 是 `<button>` 元素，點擊不會自然冒泡 input/change 事件；以 `chip.dispatchEvent(new Event("change", { bubbles:true }))` 補發

下一步：
- commit 並 push 差異匯出功能 + metro_01 pool 變更
- 擴充副本數量（目前 5 個可玩，目標 10+）

---

## 2026-06-28 — 拆檔重構驗收：通過，修正二個資料檔異常

狀態：拆檔重構全七步驗收通過；repo 工作目錄乾淨，未 push。

做了什麼：
- 執行拆檔重構的正式驗收（/itemcheck 三次故障注入 + 乾淨確認、git diff 原稿比對、domain 覆蓋率、載入順序、頂層消費、git 紀錄）
- 發現 data/items_core.js 在工作目錄的編碼已損壞（帶 UTF-8 BOM 但正文亂碼），以 git checkout HEAD 還原
- 發現 data/items_aquarium.js 因注入測試 Python 腳本的還原流程，帶入多餘 BOM 與尾部空行，以 git checkout HEAD 還原
- 確認 data/items_bakery.js 三行行內注解（B 段 / A 段 / 普通帶出版）為拆檔時新增、原稿無此內容，作者裁示保留

技術決策：
- items_core.js 編碼損壞根因未完全釐清（Write 工具在前一 session 寫入時可能產生 BOM + 錯誤正文），以 git restore 為正解，而非嘗試重新寫入 ← 避免再次引入編碼不確定性
- 注入測試腳本採 Python 位元組層級還原，但若原始 bytes 本身已含 BOM，還原後仍會污染工作目錄；正確做法是注入測試結束後以 git checkout 確認乾淨

下一步：
- 擴充副本數量（目前 6 個，目標 10+）
- 作者撰寫 DESIGNLOG（本次重構設計動機）

---

## 2026-06-27 — 資料／樣式拆檔重構（ITEMS 分檔 + domain 標記）

狀態：7 步驟全數完成並 commit；引擎契約（§5）未變動。

做了什麼：
- Step 1：抽 CSS → `style.css`，`index.html` 改 `<link rel="stylesheet">`
- Step 2：抽 SLOTS + RARITY_META → `data/slots.js`
- Step 3：抽 SHOP_ITEMS → `data/shop_items.js`
- Step 4：抽 ACHIEVEMENTS → `data/achievements.js`
- Step 5：抽 ITEMS → 三檔（`items_core.js`、`items_aquarium.js`、`items_bakery.js`），每項加 `domain` 欄位；改用 `Object.assign(ITEMS, {...})` 合併模式
- Step 6：抽 `registerWinMode("accumulate", ...)` → `data/winmodes.js`；`WIN_CONDITIONS` / `computeAccumulatorBonus` 留在引擎主體（引擎工具函式不屬於 winMode）
- Step 7：改 `tools/item_audit.js`，掃描來源從 index.html 改為 data/items_*.js；新增跨檔重複 id 偵測、domain 一致性驗證、聯集後驗 name 唯一；加 UTF-8 BOM 剝除保護；三方向注入測試全部通過

技術決策：
- winmodes.js 必須在引擎主 `<script>` 之後載入（registerWinMode 函式才存在）
- WIN_CONDITIONS 留在引擎：跨 script 的 `const` 有 scope 陷阱，且它是引擎工具非 winMode 私物
- Step 6 曾出現「aquarium 副本永遠通關」bug：root cause 是 WIN_CONDITIONS 移到 winmodes.js 後 const 跨 script 無法存取；修法是把它移回引擎
- BOM 問題：items_core.js 曾因 Write 工具寫出帶 BOM 的 UTF-8 導致 new Function 失敗，已在 item_audit.js 加 charCodeAt(0) 剝除，並從 git 還原正確編碼

下一步：
- 擴充副本數量（目前 6 個，目標 10+）
- DESIGNLOG 由作者撰寫（本次重構的設計動機）

---

## 2026-06-27 — resolveEnd 補上 internal 排除；作者透過 Dev 調整球棒數值

狀態：internal 道具不再出現在任何面向玩家的結算清單；CLAUDE.md 引擎能力契約對應更新。

做了什麼：
- resolveEnd 通關、強制退出、一般失敗三個迴圈，各加一行 `if(it.internal){ removeFromInventory(it); continue; }`，靜默清除、不列入任何結算清單
- 作者透過 Dev 面板微調三顆球棒數值後匯出貼回，ITEMS 格式同時從單行轉為多行 JSON：baguette_bat（value 60→180、rarity blue→red）；baguette_bat_echo（bonus 3→1）；baguette_bat_plain（bonus 3→2、rarity green→blue）

技術決策：
- 修復只動顯示層（push 前 continue），清除行為不變 ← shop_intact 被清除是正確的，錯的是它被顯示，兩者完全獨立

下一步：
- 作者本機驗收全六條 bakery 路徑
- 擴充副本數量（目前 6 個，目標 10+）

---

## 2026-06-27 — bakery 記憶球棒三道具分流

狀態：bakery_01 記憶武器拆為三顆，各結局路徑各自授予正確版本。

做了什麼：
- 新增 ITEMS：baguette_bat_echo（會說話的法國麵包，carry:false，副本內武器）、baguette_bat_plain（法國麵包，carry:true，memoryPower:true，普通帶出版）
- bakery_01 node_fight1：改授予 baguette_bat_echo（echo 版，離場必清）
- bakery_01 node_normal_end：新增 grant baguette_bat_plain（普通結局帶出普通版）
- bakery_01 node_end_true：新增 grant baguette_bat_plain（一般真結局帶出普通版）
- bakery_01 node_hidden_9：移除 end，改為 choices 導向 node_baguette_reward
- 新增 node_baguette_reward：grant baguette_bat（特別版），此處跳道具彈窗揭露 B 段效果，再導向 node_hidden_final
- 新增 node_hidden_final：end:"cleared"，隱藏記憶真結局收尾

技術決策：
- 揭露彈窗必須在 resolveEnd 的前一節點授予（node_baguette_reward），不能與 end 同節點 ← 引擎在 resolveEnd 當下會清空道具彈窗
- 三顆球棒 name 全部不同，引擎以 name 認同一性，無衝突風險
- 失敗路徑從未授予 carry:true 道具，帶出機率結構性為 0，無需額外防護
- 未新增任何引擎機制，全在現有 grant / carry / require 能力內

下一步：
- 作者在本機用 Live Server 驗收六條路徑
- /itemcheck 確認三顆球棒 name 不撞車、無幽靈

---

## 2026-06-27 — Dev 道具卡片新增進階旗標欄位

狀態：Dev 面板道具卡片補齊 memoryPower／quest／internal／finalBonus 四欄位，並加上授予來源唯讀標示。

做了什麼：
- buildCard 新增「進階旗標」列（r3b），含四個控制項：記憶武器（memoryPower）、任務道具（quest）、內部標記（internal）均為 checkbox；存活加成（finalBonus）為數值框
- 寫回時保持 ITEMS 精簡：取消勾選 / 值為 0 時 delete 欄位，而非寫成 false / 0
- 新增授予來源唯讀標示：掃描 SCENARIOS 各節點的 node.grant 與 choice.grant，顯示「授予於：副本名 / 節點 id」
- 刷新綁定沿用既有 sec 上的 input + change 冒泡，無需額外接線
- 視覺沿用既有 dev-ic-r4 / dev-ic-pool-title / dev-ic-field / dev-ic-label class，dashed border-top 分隔，不引入新樣式

技術決策：
- r3b 直接沿用 dev-ic-r4 class ← 分隔線樣式與副本分配一致，無需新增 CSS
- 授予來源僅唯讀顯示，不提供編輯（grant 屬劇本邏輯，不在 Dev 道具面板修改）

下一步：
- 用 Dev 面板驗收：baguette_bat 的記憶武器應勾選、shop_intact 的內部標記應勾選、aquarium 道具的存活加成應顯示正確數值

---

## 2026-06-27 — 新增 /itemcheck 道具稽核機能

狀態：dev-time 稽核工具上線，可手動比對 ITEMS 定義與 scenarios 引用。

做了什麼：
- 新增 tools/item_audit.js：掃描 ITEMS / SHOP_ITEMS 定義，比對 scenarios/*.js 的 pool / grant / require / choice.grant 引用，回報幽靈 id、name 撞車、重複鍵、internal 未 carry:false 等問題；退出碼 0 = 乾淨，1 = 有需處理問題
- 新增 .claude/skills/itemcheck/SKILL.md：/itemcheck slash command，跑腳本並轉述結果給作者

技術決策：
- 腳本用 eval / new Function 載入自家劇本與 ITEMS 區塊 ← dev-time 工具只讀信任的原始碼，引入完整 JS parser 屬過度設計
- 不動引擎邏輯與引擎能力契約，純 dev-time 工具層新增

下一步：
- 每次新增道具後執行 /itemcheck 確認乾淨
- 擴充副本數量（目前 6 個，目標 10+）

---

## 2026-06-26 — 命名定案、ω 單位全面替換、三項修復

狀態：三項 bug 修復完成，命名全面更新，GitHub Pages（master 分支）已同步。

做了什麼：
- Dev 加點 handler 改呼叫 render()，消除花費邏輯雙真相來源
- app 更名「記憶狹間」、主神商店更名「記憶迴廊」
- 點數單位全面替換為 ω（12 處），涵蓋 HUD、商店按鈕、結算、Dev 面板
- 修正 .sys-top 的 text-transform:uppercase 導致 ω 渲染成 Ω 的根因，移除該規則（.sys-top 內無任何元素真正依賴 uppercase）
- 回合數哨兵：turnLimit === 99 時分母渲染為 ??，通用引擎規則，非副本特例

技術決策：
- text-transform 選「移除來源規則」而非「在 ω span 加覆寫」← 無任何元素依賴，移除更乾淨，少一層未來會咬人的覆寫
- ω 渲染問題診斷過程：先懷疑字型 → 換字型無效 → 發現 CSS text-transform:uppercase 才是根因；正確診斷順序已記入 DESIGNLOG

下一步：
- 開始設計下一個 scenario
- 若新副本用到記憶序列，requireMemory 實作將作為前置需求提出

---

## 2026-06-26 — 建立本機 git 並與 GitHub 同步

狀態：本機已是 git repository，與 GitHub（https://charles0148.github.io/-code/）完全同步，14 個檔案全部納入版本控制。

做了什麼：
- 確認專案目錄不是 git repo，執行 `git init`
- 建立 `.gitignore`（排除 .DS_Store、Thumbs.db、.vscode/、settings.local.json）
- 將所有專案檔案（index.html、scenarios/、CLAUDE.md、DEVLOG.md、FIXLOG.md、.claude/skills/、.claude/commands/、.gitignore）做第一次 commit
- 連上 GitHub remote（https://github.com/Charles0148/-code.git），fetch 後確認兩邊 index.html 與 scenarios/ 內容一致
- `git reset --hard origin/main` 以 GitHub 為基礎，CLAUDE.md 等本機專屬檔案被意外刪除，從舊 commit（8b74bfc）以 `git checkout` 救回
- commit 救回的檔案並推上 GitHub，同步完成
- 以 `git ls-files` 確認全部 14 個檔案在位

技術決策：
- 以 GitHub 為歷史基礎（reset --hard），而非 merge --allow-unrelated-histories ← 使用者明確要求以 GitHub 版本為準

下一步：
- 日常改動：`git add -A` → `git commit -m "說明"` → `git push`
- 觀察 /handoff 的 git 指令在本機 repo 初始化後是否正常運作

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
