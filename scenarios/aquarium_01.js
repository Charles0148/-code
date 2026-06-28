/* ============================================================
 *  副本：閉館後的藍  (aquarium)
 *  難度：T1 ｜ 回合上限：15 ｜ 勝利方式：第 15 回合存活率判定
 * ------------------------------------------------------------
 *  winMode: "final_roll"
 *  自訂欄位：
 *    choice.survival : <number>   選對該謎，累積存活率 +N%
 *    choice.finalRoll : true       觸發最終存活判定
 * ============================================================ */

SCENARIOS["aquarium"] = {
  title: "閉館後的藍",
  theme: "深夜水族館",
  tier: 1,
  objective: "你是白天昏迷、深夜醒來的觀光客。手臂上有「不要回頭」的血字。在天亮前解開四道謎，累積回頭的存活率，活著走出鐵門。",
  win: "survive",
  winMode: "accumulate",
  accumulator: {
    stateKey:        "survivalRate",   // runState 變數名稱
    initValue:       0,                // 進場初始值
    choiceKey:       "survival",       // choice 欄位：選對謎題時累加
    finalChoiceKey:  "finalRoll",      // choice 欄位：觸發最終判定
    roll:            { min: 1, max: 100 },
    bonusFrom:       "finalBonus",     // ITEMS 欄位：道具加成來源
    winIf:           "roll_lte_value", // 勝利條件 enum
    overflow:        { achievementRoll: true },
    skipSteer:       true,
    skipTurnLimit:   true,
    autoDropPerNode: true,             // 每回合進節點對 pool 擲掉落；drop 為每回合固定機率，尚未取得者每回合各自獨立擲一次
  },
  turnLimit: 15,
  steerAt: 10,
  climaxNode: "node_climax",
  pool: ["rusty_fish_knife", "eye_hook", "humanface_fish"],

  nodes: {

    /* ===== 謎題一：骷髏的提問（第 1～2 回合）===== */
    start: {
      scene: "你在陌生的藍光裡睜開眼，手臂上「不要回頭」四個血字還在滲。一隻魚猛地撞上玻璃，你回頭——面容猙獰的美人魚正死盯著你，全身腐爛的大白鯊朝你游來，而一隻人臉魚用慈祥的眼神望著你。你衝向出口，一隻骷髏手抓住你的手腕：「你要選哪個——鯊魚、美人魚，還是人面魚？」",
      choices: [
        { text: "「人面魚。」", survival: 20, next: "node_p1_pass" },   // 正確
        { text: "「美人魚。」", next: "node_p1_fail" },
        { text: "「大白鯊。」", next: "node_p1_fail" },
      ]
    },

    node_p1_pass: {
      scene: "骷髏空洞的眼眶凝視你片刻，緩緩朝你揮了揮手，像在道別，然後碎成齏粉。門鎖喀地一聲鬆開了。",
      choices: [
        { text: "推門離開", next: "node_hall_1" },
      ]
    },

    node_p1_fail: {
      scene: "骷髏沒有任何表示，逕自消散在藍光裡，彷彿你的答案根本不值得回應。但門，還是開了。",
      choices: [
        { text: "推門離開", next: "node_hall_1" },
      ]
    },

    /* ===== 過場一（第 3 回合）===== */
    node_hall_1: {
      scene: "一條長廊在你面前展開，兩側魚缸的藍光把影子拉得老長。水流聲很規律，規律到你開始懷疑那不是幫浦的聲音。",
      choices: [
        { text: "屏住呼吸快步穿過", danger: 1,
          check: { type: "敏捷", dc: 10, success: "node_p2", fail: "node_p2" } }, // 氛圍用判定：成敗皆同，不影響結果，請勿當成 bug 移除
        { text: "貼著牆慢慢摸索", next: "node_p2" },
      ]
    },

    /* ===== 謎題二：餐廳的菜單（第 4～5 回合）===== */
    node_p2: {
      scene: "你走進水族館餐廳，桌椅蒙著薄塵。一個穿廚師服的幽靈憑空冒出，熱情地遞上菜單：「客人您好！本店招牌有——涼拌蠕蟲、爆炒北極熊掌、清蒸美人魚頭。」你低頭，發現自己的倒影在不鏽鋼桌面上泛著一層淡淡的鱗光。",
      choices: [
        { text: "「涼拌蠕蟲。」", survival: 20, next: "node_p2_pass" },   // 正確：你其實是一條魚
        { text: "「爆炒北極熊掌。」", next: "node_p2_fail" },
        { text: "「清蒸美人魚頭。」", next: "node_p2_fail" },
      ]
    },

    node_p2_pass: {
      scene: "廚師眉開眼笑，端出一盤蠕動的東西，站在一旁等你吃完。你說不清自己是怎麼嚥下去的，只知道盤子空了，廚師滿意地讓開了路。",
      choices: [
        { text: "離開餐廳", next: "node_hall_2" },
      ]
    },

    node_p2_fail: {
      scene: "廚師的笑容瞬間扭曲：「你可以滾了，骯髒的靈魂。」一股力道把你推出餐廳，門在背後重重闔上。",
      choices: [
        { text: "離開餐廳", next: "node_hall_2" },
      ]
    },

    /* ===== 過場二（第 6 回合）===== */
    node_hall_2: {
      scene: "穿過一段沒有燈的通道，玻璃裡的倒影慢了你半拍才跟上動作。你不確定剛剛那是不是錯覺。",
      choices: [
        { text: "盯著倒影看清楚", danger: 1,
          check: { type: "膽識", dc: 11, success: "node_p3", fail: "node_p3" } }, // 氛圍用判定：成敗皆同，不影響結果，請勿當成 bug 移除
        { text: "別過頭快走", next: "node_p3" },
      ]
    },

    /* ===== 謎題三：禮品區的玩偶（第 7～8 回合）===== */
    node_p3: {
      scene: "禮品區的捲門突然落下，把你關在裡頭。架上的玩偶齊聲開口：「歡迎光臨，外來者。請你選出——最完美的那一個。」眼前是斷尾的虎鯨、被撕掉雙螯的螃蟹，以及一隻頭被布袋整個罩住的企鵝。",
      choices: [
        { text: "頭被布罩住的企鵝", survival: 20, next: "node_p3_pass" },   // 正確：唯一看不見破綻的
        { text: "斷尾的虎鯨", next: "node_p3_fail" },
        { text: "斷螯的螃蟹", next: "node_p3_fail" },
      ]
    },

    node_p3_pass: {
      scene: "玩偶們發出滿意的窸窣聲：「謝謝你，外來者。你可以走了。」眼前一花，你已經站在禮品區之外。",
      choices: [
        { text: "繼續前進", next: "node_hall_3" },
      ]
    },

    node_p3_fail: {
      scene: "尖叫從四面八方炸開：「愚昧！沒有美感的靈魂！滾出去！」你被一股力道狠狠摔出捲門外。",
      choices: [
        { text: "繼續前進", next: "node_hall_3" },
      ]
    },

    /* ===== 過場三（第 9 回合）===== */
    node_hall_3: {
      scene: "水位不知何時漫到了腳踝，冰冷刺骨。遠處傳來一下、又一下，像有什麼東西在水裡緩慢地拍打。",
      choices: [
        { text: "踩著水加速前進", danger: 1,
          check: { type: "敏捷", dc: 12, success: "node_p4_a", fail: "node_p4_a" } }, // 氛圍用判定：成敗皆同，不影響結果，請勿當成 bug 移除
        { text: "彎腰在水裡摸找", next: "node_p4_a" },
      ]
    },

    /* ===== 謎題四：美人魚壁畫（第 10～12 回合）===== */
    node_p4_a: {   // 第 10 回合（steerAt）
      scene: "一條窄廊，牆上是一幅巨大的美人魚壁畫，畫面缺了一塊。藍光在缺口裡微微晃動。你可以細看，或者趕路。",
      choices: [
        { text: "仔細查看", next: "node_p4_b_seen" },
        { text: "粗略掃過", next: "node_p4_b_blind" },
      ]
    },

    node_p4_b_seen: {   // 第 11 回合（有線索）
      scene: "你湊近，在畫框邊緣的牆面讀到幾乎看不見的一行小字：「她會傷害你。」這時壁畫裡的美人魚開口了：「親愛的外來者，旁邊有東西能補上我缺的那塊，能幫我放上去嗎？」地上擺著貝殼、一條魚、一柄染血的魚叉。",
      choices: [
        { text: "放上染血的魚叉", survival: 20, next: "node_p4_pass" },   // 正確
        { text: "放上貝殼", next: "node_p4_fail" },
        { text: "放上魚", next: "node_p4_fail" },
      ]
    },

    node_p4_b_blind: {   // 第 11 回合（無線索）
      scene: "你沒多看，只注意到壁畫缺了一塊。美人魚忽然開口：「親愛的外來者，旁邊有東西能補上我缺的那塊，能幫我放上去嗎？」地上擺著貝殼、一條魚、一柄染血的魚叉。",
      choices: [
        { text: "放上染血的魚叉", survival: 20, next: "node_p4_pass" },   // 正確
        { text: "放上貝殼", next: "node_p4_fail" },
        { text: "放上魚", next: "node_p4_fail" },
      ]
    },

    node_p4_pass: {   // 第 12 回合
      scene: "魚叉一觸上缺口，美人魚發出非人的尖嘯，露出猙獰的真面目，朝你瘋狂咒罵——下一秒，魚叉貫穿了她。壁畫安靜下來，前路暢通。",
      choices: [
        { text: "繼續前進", next: "node_hall_4" },
      ]
    },

    node_p4_fail: {   // 第 12 回合
      scene: "美人魚露出狡詐的笑：「謝謝你，外來者。出口就在前面。」然後消失無蹤。你莫名打了個寒顫，但路確實通了。",
      choices: [
        { text: "繼續前進", next: "node_hall_4" },
      ]
    },

    /* ===== 過場四（第 13 回合）===== */
    node_hall_4: {
      scene: "最後一段走廊。水位退去了，安靜得能聽見自己的心跳。出口的綠色逃生燈，就在前方亮著。",
      choices: [
        { text: "穩住呼吸走過去", danger: 1,
          check: { type: "膽識", dc: 10, success: "node_exit", fail: "node_exit" } }, // 氛圍用判定：成敗皆同，不影響結果，請勿當成 bug 移除
        { text: "再四下看一眼", next: "node_exit" },
      ]
    },

    /* ===== 出口前（第 14 回合）===== */
    node_exit: {
      scene: "出口就在一步之外，門縫透進外頭微弱的天光。可是就在你要跨出去的瞬間，一股無法抗拒的衝動從脊椎竄上來——回頭。回頭看一眼。你手臂上的血字燙得發痛。",
      choices: [
        { text: "忍住，盯著門", next: "node_climax" },
        { text: "手已經放上門把", next: "node_climax" },
      ]
    },

    /* ===== 高潮：最終存活判定（第 15 回合）===== */
    node_climax: {
      climax: true,
      scene: "那股衝動再也壓不住了。你只剩下一個動作可以做——回頭。",
      // TODO(engine): 以下三個選項皆觸發「最終存活判定」：
      //   總成功率 = state.survivalRate + 持有道具的 finalBonus 總和（不重複堆疊、無上限）
      //   roll 1~100，roll <= 總成功率 → node_cleared，否則 → node_dead
      //   若總成功率 >= 100：必定存活，溢出值（總成功率 - 100）交給成就系統做判定（先留接口）
      choices: [
        { text: "遲疑地回頭", finalRoll: true, success: "node_cleared", fail: "node_dead" },
        { text: "顫抖地回頭", finalRoll: true, success: "node_cleared", fail: "node_dead" },
        { text: "認命地回頭", finalRoll: true, success: "node_cleared", fail: "node_dead" },
      ]
    },

    /* ===== 結局 ===== */
    node_cleared: {
      scene: "就在你回頭的剎那，一雙溫暖的手按上你的背，用力把你推出了大門。你跌坐在清晨的廣場上，回頭——水族館的玻璃門內，空無一物。陽光照下來，手臂上的血字，淡了。",
      end: "cleared"
    },

    node_dead: {
      scene: "你回頭了。走道深處的黑暗轟然炸開，一條幽靈般的大白鯊挾著腥冷的水汽疾衝而出。你連尖叫都來不及。藍光，熄滅了。",
      end: "dead"
    },

  }
};

