SCENARIOS["wreck_01"] = {
  title:"傾覆的沉船", theme:"海洋", tier:2, objective:"在氧氣耗盡前逃出沉船",
  win:"escape", turnLimit:15, steerAt:10, climaxNode:"ascent_final",
  pool:["diveknife","compass","flashlight"],
  nodes:{
    start:{ scene:"你在傾斜的船艙裡睜開眼，海水已淹到胸口，氧氣表的指針緩緩下沉。\n唯一的艙門被擠壓變形，卡死了。", choices:[
      { text:"搜艙找工具", loot:true, next:"hall" },
      { text:"硬撬艙門", danger:2, check:{type:"蠻力",dc:14,success:"hall",fail:"cabin2"} },
    ]},
    cabin2:{ scene:"艙門沒有鬆動，反而卡得更死。海水繼續上升，你需要找另一條路。", choices:[
      { text:"摸索通風管道", danger:1, check:{type:"搜查",dc:12,success:"hall",fail:"hall"} },
      { text:"找潛水備用裝備", loot:true, next:"hall" },
    ]},
    hall:{ scene:"走道半邊淹水，微光從上層透來。水流把殘骸和雜物不停推向你。", choices:[
      { text:"撿拾漂過身邊的物品", loot:true, next:"cargo" },
      { text:"逆著水流游向微光", danger:2, check:{type:"敏捷",dc:13,success:"deck",fail:"engine_room"} },
      { text:"貼著牆慢慢摸向貨艙", next:"cargo" },
    ]},
    cargo:{ scene:"貨艙裡大型鐵箱橫七豎八，其中一個角落透出燈光——裡頭有緊急備用品。", choices:[
      { text:"撬開最近的箱子", danger:2, check:{type:"蠻力",dc:14,success:"cargo_loot",fail:"engine_room"} },
      { text:"繞過去找通往甲板的梯子", next:"engine_room" },
    ]},
    cargo_loot:{ scene:"箱子裡有緊急物資，部分還能用。你快速整理，把有用的帶走。", choices:[
      { text:"拿走重要物品就走", loot:true, next:"engine_room" },
      { text:"繼續仔細翻找", loot:true, danger:1, check:{type:"搜查",dc:12,success:"engine_room",fail:"engine_room"} },
    ]},
    engine_room:{ scene:"引擎艙的機械在水中發出悶響，艙壁因水壓開始微微變形。這裡不安全，但也許有出路。", choices:[
      { text:"嘗試手動開啟水密門", danger:2, check:{type:"蠻力",dc:15,success:"deck",fail:"deck"} },
      { text:"找緊急浮力裝備", loot:true, danger:2, reward:25, check:{type:"搜查",dc:14,success:"deck",fail:"deck"} },
    ]},
    deck:{ scene:"你抓住通往甲板的扶梯。海面在頭頂數公尺處晃動，光線從那裡折射進來，美得像幻覺。氧氣表已見底。", choices:[
      { text:"拆下安全欄杆備用", loot:true, next:"surface_prep" },
      { text:"直接往上游", danger:2, check:{type:"敏捷",dc:14,success:"surface_prep",fail:"hall"} },
    ]},
    surface_prep:{ scene:"你穩住呼吸，胸口開始發燙。海面的光在頭頂閃動，你算準了距離。", choices:[
      { text:"做好準備，一鼓作氣", next:"ascent_final" },
      { text:"最後一次搜尋周遭", loot:true, next:"ascent_final" },
    ]},
    ascent_final:{ climax:true, scene:"你的肺快要炸開了，海面的光就在幾公尺外。船體開始最後的沉降，把你往下拉。\n\n這是唯一的機會。", choices:[
      { text:"拼盡全力往上游", danger:2, check:{type:"敏捷",dc:15,success:"out",fail:"dead"} },
      { text:"放棄掙扎，順著水流的間隙上浮", danger:3, reward:50, check:{type:"膽識",dc:17,success:"out",fail:"dead"} },
    ]},
    out:{ scene:"你的頭破出海面，大口吸進帶鹹味的空氣。遠處有漁火在搖，有人聽到了聲音，正划船過來。", end:"cleared", endingId:"wreck_escape" },
    dead:{ scene:"氧氣表歸零。海水溫柔得可怕，船艙的黑暗把你輕輕收了回去。", end:"dead", endingId:"wreck_dead" },
  }
};
