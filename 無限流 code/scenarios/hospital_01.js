SCENARIOS["hospital_01"] = {
  title:"廢棄醫院", theme:"恐怖", tier:1, objective:"在天亮前離開醫院",
  win:"escape", turnLimit:15, steerAt:10, climaxNode:"final_escape",
  pool:["flashlight","scalpel","candle","key","amulet"],
  nodes:{
    start:{ scene:"你在一張生鏽的病床上醒來。半數日光燈管已熄滅，剩下的在頭頂明滅。\n空氣裡有消毒水蓋不住的腐味。床尾識別牌上的名字，被人用力刮掉了。", choices:[
      { text:"搜查床頭櫃", loot:true, next:"corridor" },
      { text:"摸黑走向亮燈的走廊", danger:1, check:{type:"膽識",dc:11,success:"nurses_station",fail:"corridor"} },
      { text:"拉開窗簾看外面", next:"window" },
    ]},
    corridor:{ scene:"走廊兩側的病房門半開半掩，每一扇後面都黑得像沒有底。某扇門縫裡有什麼東西正盯著你，一動也不動。", choices:[
      { text:"推開最近的一扇門", loot:true, danger:1, check:{type:"膽識",dc:12,success:"ward_room",fail:"ward_room"} },
      { text:"往護理站方向走", next:"nurses_station" },
      { text:"找逃生標誌", next:"stairwell" },
    ]},
    window:{ scene:"窗外不是夜空，而是另一條一模一樣的走廊。你的背影正站在對面的窗後，一動也不動。", choices:[
      { text:"別過頭，快步離開", next:"corridor" },
      { text:"用力敲窗，想看清楚", danger:2, reward:15, check:{type:"膽識",dc:14,success:"nurses_station",fail:"corridor"} },
    ]},
    ward_room:{ scene:"廢棄病房裡，床墊腐爛塌陷，點滴架空著生鏽的鉤子。窗台上有人用血色的字跡寫著：「別找出口」。", choices:[
      { text:"仔細搜查房間", loot:true, danger:1, check:{type:"搜查",dc:11,success:"corridor",fail:"corridor"} },
      { text:"立刻離開", next:"corridor" },
    ]},
    nurses_station:{ scene:"護理站的值班記錄還開著，今天的日期，病人欄被反覆描深，寫的是你的名字。抽屜裡有東西在動。", choices:[
      { text:"翻抽屜", loot:true, next:"basement_door" },
      { text:"查閱病歷找線索", danger:1, check:{type:"搜查",dc:12,success:"stairwell",fail:"basement_door"} },
      { text:"沿走廊繼續往前", next:"stairwell" },
    ]},
    basement_door:{ scene:"走廊末端有一道鐵門，「地下室」的標誌已鏽蝕。門縫透出腥冷的氣味，隱約有水聲。", choices:[
      { text:"強行推門進去", danger:2, check:{type:"蠻力",dc:13,success:"basement",fail:"stairwell"} },
      { text:"放棄，找其他路", next:"stairwell" },
    ]},
    basement:{ scene:"地下室潮濕，積水淹過腳踝。廢棄的醫療推車橫亙其中，某個角落傳來金屬摩擦聲。", choices:[
      { text:"搜查廢棄推車", loot:true, next:"stairwell" },
      { text:"找配電箱", danger:2, reward:20, check:{type:"搜查",dc:14,success:"stairwell",fail:"stairwell"} },
    ]},
    stairwell:{ scene:"樓梯間的燈還亮著，這是整棟醫院最正常的地方。往上可到頂樓，逃生門標誌指向一樓。", choices:[
      { text:"往頂樓走，找求救方式", danger:1, check:{type:"敏捷",dc:12,success:"rooftop",fail:"exit_ground"} },
      { text:"直接往一樓逃生口", next:"exit_ground" },
    ]},
    rooftop:{ scene:"頂樓風很大，城市燈火在遠方搖曳。你可以從這裡呼救，但走廊的聲音已經追上來了。", choices:[
      { text:"找繩索或工具", loot:true, next:"exit_ground" },
      { text:"對著夜空大喊", danger:2, reward:10, check:{type:"膽識",dc:14,success:"exit_ground",fail:"exit_ground"} },
    ]},
    exit_ground:{ scene:"一樓走廊。逃生門的綠燈在遠端閃爍，距離看起來很近，但你走了很久，它始終在同樣的位置。", choices:[
      { text:"加速衝向出口", next:"final_escape" },
      { text:"閉眼穩步前進，不看周遭", danger:1, check:{type:"膽識",dc:11,success:"final_escape",fail:"final_escape"} },
    ]},
    final_escape:{ climax:true, scene:"出口的鐵門就在你面前，門把冰涼。你的背後，走廊開始縮短，某個東西正貼著地板快速滑過來。\n\n你只有一秒鐘的決定。", choices:[
      { text:"抓住門把全力衝出", danger:2, check:{type:"敏捷",dc:14,success:"cleared",fail:"dead"} },
      { text:"不理背後，深呼吸，穩穩推開門", danger:3, reward:35, check:{type:"膽識",dc:16,success:"cleared",fail:"dead"} },
    ]},
    cleared:{ scene:"鐵門在你掌心讓步，冷風灌入。你踏進真正的夜裡——身後，醫院的燈一盞盞熄滅，走廊的聲音也消失了。", end:"cleared" },
    dead:{ scene:"那東西比你快。黑暗合攏，再也沒有走廊，也沒有出口。", end:"dead" },
  }
};
