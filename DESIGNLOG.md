# DESIGNLOG

---

## 2026-06-28 — 資料／樣式拆檔重構：ITEMS 分檔 + domain 來源域標記

劇本/設定定案：
- 本次無新增劇本或敘事內容。屬於架構重構，非劇本設計。
- 道具資料治理規則（新發明，定為當前真相）：遊戲執行期要用的資料一律 `.js` 全域檔、同步 `<script>` 載入，禁止 fetch／ESM／markdown 解析；人與 AI 看的文件才用 `.md`，引擎永不載入。道具屬於前者，不得轉成 md。
- 檔案職責邊界（定為當前真相）：index.html 只留引擎邏輯、UI 結構、引擎常數、`<script src>` 引入清單；資料與樣式抽出為獨立檔。切割依「職責」而非「行數大小」——大小是症狀，資料與邏輯混檔才是病。
- 拆檔後的檔案配置（當前真相）：
  - `style.css` ＝ 全部 CSS
  - `data/slots.js` ＝ SLOTS + RARITY_META
  - `data/shop_items.js` ＝ SHOP_ITEMS
  - `data/achievements.js` ＝ ACHIEVEMENTS
  - `data/items_core.js`（7 顆，多副本共用）/ `data/items_aquarium.js`（3 顆）/ `data/items_bakery.js`（8 顆）＝ ITEMS 三檔，index.html 改為 `const ITEMS={};` 空宣告，各檔以 `Object.assign(ITEMS,{...})` 填入
  - `data/winmodes.js` ＝ WIN_CONDITIONS + registerWinMode，須在引擎主體之後載入（registerWinMode 依賴 WINMODE_HOOKS）
- domain 來源域標記（新發明，當前真相）：每顆道具新增 `domain` 欄位，值等於所在檔（core／aquarium／bakery）。純標記欄位，引擎不讀取、不影響任何遊戲行為，僅供稽核與未來 Dev 回填指引使用。
- 載入順序（當前真相）：slots → shop_items → achievements → `const ITEMS={}` → items_core → items_aquarium → items_bakery → `const SCENARIOS={}` → scenarios → 引擎主體 → winmodes。
- 原稿邊界確認：baguette_bat 三顆球棒的 A 段／普通版註解確認為先前 session 新增（拆檔前 commit bef9a00／e52e881 的 index.html 無此三行），非本次竄改；經裁示保留。除新增 domain 欄位外，所有道具資料值與原稿逐字相同。`node_hidden_9`「它將永遠跟著你走下去」在 scenarios/bakery_01.js，本次未動。

設計原則/教訓：
- 切割依職責、不依大小 ← 照「檔案太大」切會把同一坨東西打散成碎檔，問題只是換地方堆；照「職責」切（引擎／資料／樣式／查找表）才真的好維護。錯誤直覺是「讓 HTML 變小就好」。
- runtime 資料用 .js、文件才用 .md ← md 存不住 carry／internal／memoryPower／name 等機器要讀的欄位，且需引入 parser＋fetch＋錯誤處理，反而增加失敗面；file:// 本機開發會被 fetch/CORS 擋。要避免「為了瘦身把資料搬進 md」這個陷阱。
- 多檔聚合的稽核要驗聯集、不驗逐檔 ← `Object.assign` 後寫覆蓋且靜默無錯，兩檔同 id 執行期只剩一顆而不報錯。/itemcheck 必須先聯集再驗 name 唯一，並主動偵測跨檔同 id。
- domain 標記順勢成為第三道稽核防線 ← 道具被貼錯檔時 domain 與所在檔不符即被攔，防止拆檔後人工回填貼錯位置。
- 動引擎檔的重構要逐步 commit ← 七步各一 commit，壞了能乾淨退回單步，而非整包翻車。
- 「完成」是驗收者拍板、不是執行者宣稱 ← AI 常宣稱「測過了」實則只跑正向。驗收要求逐項出示證據（反向測試實際輸出＋退出碼、git diff、grep、載入順序、git log），尤其反向測試要看到三種故障都被攔、退出碼正確。

有效的提示詞：
- 「每一項都要實際執行並把輸出貼給我看，不接受『已測試／沒問題』這種口頭結論」 ← 把驗收寫成「你示範、我看證據」，逼出 AI 是否真的做過反向測試（做過就貼輸出、沒做過才補跑），同時擋掉虛報。
- 「乾淨時放行、髒時攔截，兩個方向都要驗」 ← 反向測試注入假 name 撞車／跨檔同 id／domain 不符，確認真的擋得住，而非只驗乾淨放行。
- 「先確認這些 md 是引擎要載入的資料、還是給人看的文件」 ← 一句話分流，擋下「把道具資料搬進 md」這個會破壞稽核與機械判斷原則的錯誤路線。

給 Claude Code 的交接（若有）：
- 本次無新引擎機制需求。能力契約（§5）未更動，純搬遷。
- 待辦（下一張工作單，非本次）：Dev 面板 UI 指引強化——改完道具數值後，依 domain 在匯出框顯示「這顆屬於 data/items_X.js，貼到 ITEMS 區塊」的人話指引，讓「匯出→回填」round-trip 在拆檔後不斷。

下一步：
- 親跑一輪麵包店副本，確認三顆球棒授予與彈窗正常、internal 道具（shop_intact）結算靜默清除（若尚未跑，push 前補上）。
- 開第二張工作單：Dev 面板 domain-aware 回填指引（UI 層，與本次拆檔分離）。
- 仍掛著的舊債：分析／遙測缺口、localStorage 跨局累積脆弱性、QBN 旗標複雜度成長。

---

## 2026-06-27 — 道具稽核機能、Dev 進階旗標、記憶球棒三道具分流、internal 結算修復

劇本/設定定案：
- 記憶球棒拆成三顆，依結局路徑分流授予（新發明）：
  - echo 影子版 `baguette_bat_echo`「會說話的法國麵包」：第一幕授予、副本內當武器，`carry:false`，離場必清、失敗不外洩；無 memoryPower。註解為 A 段（只寫手感、不爆雷）。
  - 普通帶出版 `baguette_bat_plain`「法國麵包」：普通結局與一般真結局授予，`carry:true`、`memoryPower:true`，無特別註解、無成就。
  - 特別帶出版 `baguette_bat`「可以打棒球的法國麵包」（沿用原有道具）：僅隱藏記憶路徑授予，B 段註解、之後綁成就（成就本身尚未做）。
- 帶出資格規則（新發明）：只要是勝利結局拿到的球棒都帶 `memoryPower:true`，差別只在名稱／註解／稀有度／成就。普通結局（留在原地，沒勝利也沒失敗）視為「給普通版」的一員。
- 「帶出機率為 0」的達成方式（新發明）：不靠調引擎全域逃脫常數，而是讓 carry:true 的帶出版「只在通關路徑授予」——失敗局從未持有它，外洩機率結構性為 0。
- 揭露彈窗節點規則（新發明）：需要跳道具彈窗揭露的授予，不能與 `end` 同節點（結算當下會清空彈窗），必須放在結局前一個節點。隱藏路徑新增 `node_baguette_reward`（授予特別版＋揭露 B 段）與 `node_hidden_final`（收尾結算）兩節點。
- 原稿邊界：B 段註解、隱藏記憶台詞、`node_hidden_9`「它將永遠跟著你走下去」皆為原稿，未改；A 段註解、普通版註解、兩個新節點的橋接場景皆為本次新發明。
- internal 道具結算規則（定案為當前真相）：internal 道具在 `resolveEnd` 的通關／強制退出／一般失敗三條路徑，一律靜默清除、不列入任何面向玩家的結算清單（carried／consumed／lost／escaped／sold）。此為引擎保證，不再依賴作者每次手動小心。

設計原則/教訓：
- 道具的執行期身份是「名稱 name」、不是 id ← 引擎 `hasItem` 與 `grant` 去重都比對 `it.name`，背包條目也只存 name。所以撞車風險的主軸是「name 唯一」而非「id 唯一」；同名不同 id 會被當成同一顆。錯誤直覺是「只要 id 不重複就安全」。
- `grant` 對「背包已有同 name」自動跳過（冪等）← 「重複通關會不會給第二顆」這類邊界，引擎本身已解，不需在劇本端額外防重複。
- 「帶出機率歸零」要靠結構、不要靠調參 ← 與其改全域逃脫常數冒風險，不如讓道具在失敗局「不存在」。授予位置即是最乾淨的閘門。
- 隱形標記漏出來是「對稱性缺口」的典型 ← 授予端早有 `if(!entry.internal)` 防線，但離場結算端少了對稱那一道，於是 internal 道具在死亡損失清單現形。修法是補上對稱過濾，而非個案打補丁。
- 資料與引擎邏輯不該共檔 ← 道具 `ITEMS` 目前混在 index.html，與「劇本資料放 scenarios/、引擎邏輯放 index.html」的既定原則有缺口。問題不在「寫在 HTML」，在「資料和邏輯混在同檔」，會帶來單檔膨脹、職責混淆、協作摩擦（每次調道具都在碰引擎檔）。
- Dev 面板是「ITEMS 字面量的即時編輯器」，不是另一套程式 ← 唯一真相是 index.html 的 `ITEMS` 字面量；Dev 即時編輯它、`JSON.stringify` 匯出含所有特別欄位，Claude Code 也只改它。只要改動都流經這份字面量，就不會有「兩套道具程式」。

有效的提示詞：
- 「先寫一支確定性稽核腳本、拿它掃現有檔案產出表格，這支腳本同時就是要交給 Claude Code 安裝的那支」 ← 一次產出「現況快照」與「常駐機能原型」，且符合「機械判斷由 code、AI 不介入」。
- 「乾淨時通過、髒時攔截，兩個方向都要驗」 ← 稽核腳本注入假的 name 撞車與幽靈引用做反向測試，確認真的擋得住、退出碼正確，而非只驗證「乾淨時放行」。
- 「驗收要看欄位有沒有正確反映現況，而不是看註解對不對」 ← Dev 新欄位驗收改看 `baguette_bat` 的 memoryPower 是否已勾、`shop_intact` 的 internal 是否已勾、取消勾選後匯出欄位是否消失，比看註解更能證明讀寫雙向皆通。

給 Claude Code 的交接（若有）：
- 本次的引擎/工具改動皆已在現有能力範圍內完成，無新的引擎機制需求。
- 已完成並交付的工單：① /itemcheck 道具稽核機能（tools/item_audit.js ＋ skill，手動觸發）；② Dev 道具卡片新增 memoryPower／quest／internal／finalBonus 四欄位並分組清晰化；③ bakery 記憶球棒三道具分流實作；④ resolveEnd 排除 internal 的 bug 修復。
- 待作者處理（非 Claude Code）：引擎能力契約 CLAUDE.md 第 5 節 internal:true 段落那條「resolveEnd 補上對 internal 的明確排除」待辦，現已實作，應由作者把該條由「待辦」改標為「已實作」。

下一步：
- 【下一輪專門處理】道具外置：把 `ITEMS`／`SHOP_ITEMS` 從 index.html 抽出，比照劇本架構獨立成資料檔。定案方向：採「解法 A」——index.html 保留空物件宣告 `const ITEMS = {};`，新增 `items/` 資料夾、按副本切檔（如 items_core.js／items_bakery.js），以 `<script src>` 在引擎邏輯之前引入；同步載入，引擎讀 ITEMS 處不需改；與劇本架構同構、零建構步驟、雙擊可開。不採 fetch JSON（file:// CORS 與非同步時序成本不划算）、不採打包工具（破壞無建構步驟的簡單性）。此搬遷屬引擎層、改動面較大，須單獨開一輪規劃遷移步驟（切檔方式、Dev 匯出是否跟改、/itemcheck 掃描來源改為 items/*.js、確保遷移前後道具完全一致），不與其他改動混推。
- 記憶球棒特別版的「成就」尚未實作，待隱藏結局成就系統開做時一併處理。
- 其餘既有待辦延續：ω 點數經濟設計、記憶副本的 requireMemory（檢查裝備槽）按鈕機制（屆時作為該副本前置交 Claude Code）。

---

## 2026-06-26 — 命名定案與 HUD 單位修復、回合數哨兵顯示

劇本/設定定案：
- 〔新發明〕app 正式更名為「記憶狹間」。
- 〔新發明〕主神商店更名為「記憶迴廊」（取賣場/陳列語感，取代偏貨幣感的命名候選）。
- 〔新發明〕點數系統單位改用希臘字母 ω，顯示格式固定為 `50 ω`（數字＋半形空格＋ω）。
- 〔新發明〕回合數顯示哨兵規則：當 scenario 的 turnLimit === 99 時，右上角總回合「分母」一律渲染為 ??，分子照常累加，呈現 1 / ??。引擎只認哨兵值 99、不認劇本名，往後任何停用導引的線性／多結局劇本自動套用。屬引擎通用能力，非麵包店特例。

設計原則/教訓：
- 「單一字元換字型怎麼都改不掉、且只發生在某一處」≠ 字形／缺字問題 ← 本次 HUD 的 ω 永遠顯示為大寫 Ω，根因是 .sys-top 套了 text-transform: uppercase，把原始碼正確的小寫 ω(U+03C9) 在渲染時強制轉成 Ω，與字型無關。錯誤直覺是「顯示錯就先換字型」。正確診斷順序：先排除 CSS 大小寫轉換（uppercase／capitalize），再確認原始碼碼位，最後才懷疑字型。
- 修 CSS 衝突時，「覆寫」與「移除來源規則」要分清取捨 ← 在目標元素加 text-transform: none 是覆寫；若無任何元素真正依賴該大寫，優先移除來源規則，少一層未來會再咬人的覆寫。
- 「顯示被更新、實際狀態沒被更新」是雙真相來源的典型症狀 ← Dev 加點後需重整才能用，根因是加點只更新了顯示／localStorage，未同步花費邏輯實際讀取的執行期變數；重整等於從 localStorage 重新 hydrate 才湊巧一致。修法是寫進花費邏輯真正讀的那個狀態，並複用一般加點的 save＋重渲染路徑。

有效的提示詞：
- 「先確認範圍再改」對 CSS 修法很有效 ← 在核准 text-transform 覆寫前，先問「是否有元素刻意依賴 .sys-top 的 uppercase」，據此在「覆寫 vs 移除來源」之間拍板，避免無謂多疊一層規則。
- 「ω 全面掃描所有出處、列出位置再改」避免單位字串漏改（HUD／商店／Dev 面板）。

給 Claude Code 的交接（若有）：
- 本次無新的劇本機制需求。三項修復（Dev 加點即時可用、改名＋ω 單位、回合數哨兵 1 / ??）均屬引擎既有能力範圍內的修正，無需新增跨副本機制。回合數哨兵規則屬引擎通用能力，已非劇本專屬。

下一步：
- 開始設計下一個 scenario（本輪先處理 bug 與命名，設計順延）。若該 scenario 用到記憶序列，將「實作 requireMemory（檢查裝備槽）」列為其前置需求交給 Claude Code，正式啟用該機制。

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
