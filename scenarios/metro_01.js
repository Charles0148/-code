SCENARIOS["metro_01"] = {
  title:"廢棄地鐵站", theme:"都市傳說", tier:1, locked:true, price:80,
  objective:"在末班車抵達前找到出口",
  win:"escape", turnLimit:15, steerAt:10, climaxNode:"last_train",
  pool: ["flashlight","candle","amulet"],
  nodes:{
    start:{ scene:"你獨自走進一座標示「停用」的地鐵站。月台燈光昏黃，鐵軌方向傳來遠方悶雷般的聲響。\n看板上的時刻表仍在，末班車——十分鐘後。", choices:[
      { text:"搜查月台上的遺留物", loot:true, next:"platform" },
      { text:"走向站務室", next:"office" },
      { text:"跳下軌道查看", danger:2, check:{type:"敏捷",dc:13,success:"tracks",fail:"platform"} },
    ]},
    platform:{ scene:"月台牆壁上有人用噴漆寫著：「不要等車」。廣播忽然有了靜電聲，然後是一串數字倒數。", choices:[
      { text:"往廣播室走", danger:1, check:{type:"搜查",dc:12,success:"office",fail:"tunnels"} },
      { text:"往出口方向走", next:"tunnels" },
      { text:"搜查遺留行李", loot:true, next:"tunnels" },
    ]},
    office:{ scene:"站務室的值班記錄最後一頁只有一行字：「不要讓它看到你的臉。」桌上有手電筒和一串備用鑰匙。", choices:[
      { text:"拿走桌上的東西", loot:true, next:"tunnels" },
      { text:"查閱更多記錄", danger:1, check:{type:"搜查",dc:11,success:"tunnels",fail:"tunnels"} },
    ]},
    tracks:{ scene:"鐵軌之間比想像中更寬，燈光不及的地方一片墨黑。你看到遠處有個人影站在軌道中央，一動也不動。", choices:[
      { text:"開口問那個人影", danger:2, reward:15, check:{type:"膽識",dc:14,success:"tunnels",fail:"tunnels"} },
      { text:"爬回月台", next:"tunnels" },
    ]},
    tunnels:{ scene:"隧道口有微弱的光。隧道是通往下一站的捷徑，但中間完全黑暗，也沒有任何聲音。", choices:[
      { text:"進入隧道", danger:2, check:{type:"膽識",dc:13,success:"maintenance",fail:"maintenance"} },
      { text:"往另一個出口", next:"exit_stairs" },
      { text:"搜查隧道口附近", loot:true, next:"maintenance" },
    ]},
    maintenance:{ scene:"維修通道狹窄，牆壁上有人用指甲刻滿了路線圖，每一條都通向同一個地方。", choices:[
      { text:"按路線圖前進", next:"exit_stairs" },
      { text:"搜尋維修工具", loot:true, danger:1, check:{type:"搜查",dc:12,success:"exit_stairs",fail:"exit_stairs"} },
    ]},
    exit_stairs:{ scene:"你找到出口樓梯。就在這時，整座車站的燈同時熄滅，車輪聲從遠方轟隆傳來。", choices:[
      { text:"摸黑衝上樓梯", next:"last_train" },
      { text:"靠牆等燈光回來", danger:1, check:{type:"膽識",dc:11,success:"last_train",fail:"last_train"} },
    ]},
    last_train:{ climax:true, scene:"車燈從隧道口轟然出現——那列車的車廂沒有燈，沒有乘客，只有一個輪廓站在車門口，朝你看。\n\n出口就在旁邊，你只需要兩秒鐘。", choices:[
      { text:"衝向出口，不要回頭", danger:2, check:{type:"敏捷",dc:14,success:"cleared",fail:"dead"} },
      { text:"直視車門口的輪廓，命令它走", danger:3, reward:35, check:{type:"膽識",dc:16,success:"cleared",fail:"dead"} },
    ]},
    cleared:{ scene:"你衝上地面，街燈和車聲一起灌進來。身後，地鐵入口的鐵門緩緩關閉，裡面的一切消失在黑暗裡。", end:"cleared" },
    dead:{ scene:"那列車停下了。車門打開。你不記得之後發生的事，只知道你再也沒有離開那座車站。", end:"dead" },
  }
};
