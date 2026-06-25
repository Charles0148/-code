SCENARIOS["store_01"] = {
  title:"深夜便利商店", theme:"恐怖", tier:1, objective:"撐到天亮交班",
  win:"survive", turnLimit:15, steerAt:10, climaxNode:"final_ritual",
  pool:["flashlight","scalpel","candle","amulet"],
  nodes:{
    start:{ scene:"凌晨三點，你顧著一間沒有客人的便利商店。自動門忽然「叮咚」一聲開了，卻沒有人進來。\n監視器畫面裡，店內站著第二個你，朝鏡頭看。", choices:[
      { text:"假裝沒看到，繼續補貨", loot:true, next:"aisle" },
      { text:"盯著監視器看清楚", danger:1, check:{type:"膽識",dc:12,success:"counter",fail:"aisle"} },
      { text:"鎖上後門", next:"counter" },
    ]},
    aisle:{ scene:"貨架間的燈管一根接一根熄滅。腳步聲從泡麵區傳來，不疾不徐，朝你走近。", choices:[
      { text:"抓貨架上的東西", loot:true, next:"counter" },
      { text:"衝回收銀台", next:"counter" },
      { text:"躲進儲藏室", next:"storage" },
    ]},
    storage:{ scene:"儲藏室堆滿紙箱，外面的腳步聲隔著鐵門悶下去了。你有一點時間。", choices:[
      { text:"搜尋有用的物品", loot:true, danger:1, check:{type:"搜查",dc:12,success:"counter",fail:"counter"} },
      { text:"等聲音消失再出去", next:"counter" },
    ]},
    counter:{ scene:"你回到收銀台。牆上的時鐘停在三點整，秒針一動也不動。監視器畫面裡，那個「你」現在站在貨架和櫃台之間。", choices:[
      { text:"找總電源重啟", danger:2, check:{type:"搜查",dc:14,success:"breaker",fail:"aisle"} },
      { text:"查監視器錄影", danger:1, check:{type:"搜查",dc:12,success:"cctv",fail:"counter2"} },
      { text:"拿起店內電話打 119", next:"counter2" },
    ]},
    counter2:{ scene:"電話沒有撥號音，只有靜電。那個「你」已移到收銀台正前方，距離不到三公尺。", choices:[
      { text:"喊話：「你不是真實的，離開」", danger:2, reward:20, check:{type:"膽識",dc:15,success:"cctv",fail:"aisle"} },
      { text:"繞過它去儲藏室", next:"storage" },
    ]},
    cctv:{ scene:"錄影顯示過去三小時裡，你一直在睡覺。但店裡一直有第二個人影在走動，從未停下。", choices:[
      { text:"找鹽或護身符", loot:true, next:"ritual_prep" },
      { text:"直接去找配電箱", next:"breaker" },
    ]},
    breaker:{ scene:"配電箱在後場倉庫深處，面板標籤字跡模糊。你不確定哪個開關是主電源。", choices:[
      { text:"強行全部重啟", danger:2, check:{type:"蠻力",dc:13,success:"ritual_prep",fail:"counter"} },
      { text:"仔細找正確的開關", danger:2, reward:15, check:{type:"搜查",dc:14,success:"ritual_prep",fail:"counter"} },
    ]},
    ritual_prep:{ scene:"你把能找到的東西擺在收銀台上。時鐘的秒針微微顫動了一下，像是什麼正在被推開。", choices:[
      { text:"鎖好所有門窗，準備最後一搏", next:"final_ritual" },
      { text:"再仔細聽一聽廣播的內容", danger:1, check:{type:"搜查",dc:11,success:"final_ritual",fail:"final_ritual"} },
    ]},
    final_ritual:{ climax:true, scene:"時鐘指針緩緩開始移動，走了一格，又停下。那個「你」就站在門口，頭微微歪著。\n天空的邊緣透出一絲灰白——天就要亮了。", choices:[
      { text:"在黎明前重啟主電源", danger:2, check:{type:"敏捷",dc:14,success:"win",fail:"dead"} },
      { text:"直視它，命令它離開這裡", danger:3, reward:40, check:{type:"膽識",dc:17,success:"win",fail:"dead"} },
    ]},
    win:{ scene:"電源重啟的瞬間，時鐘「喀」地跳到三點零一分。叮咚——真正的早班店員推門進來，陽光跟著灑進店裡。那個「你」消失了。", end:"cleared" },
    dead:{ scene:"時鐘永遠停在三點。那第二個你，慢慢走向收銀台，伸出手——「換你了。」", end:"dead" },
  }
};
