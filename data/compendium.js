// --- 圖鑑 manifest（以副本 id 為鍵）------------------------------------------
// 分母（總格數＝結局+道具+成就）由本檔宣告；分子（已解鎖）由持久層追蹤：
//   結局→seenEndings、道具→carriedItems、成就→unlockedAchievements。
// 蒐集率平攤計算（每格等權），全局率＝所有副本格＋共通道具格的總和之比，非各區率平均。
//
// 道具語意：只列「可帶出（carry:true 且非 internal）」道具；carry:false（碎片、echo 球棒、
// internal 標記、各種 quest 工具）依帶出語意結構上不可能蒐集，一律不列入。
// 道具名／註解於 UI 即時查 ITEMS[id] 取得，本檔不重複寫。
//
// ★ 共通 vs 專屬：
//   - 跨副本掉落的核心道具（domain:"core" 且 carry:true，如護身符、羅盤）＝共通道具，
//     統一收進 COMPENDIUM_COMMON，不掛在任一副本下（避免「帶一顆三個副本同時亮」）。
//   - 只屬於某副本的道具（domain 為該副本，如水族館的人臉魚、麵包店的法國麵包）＝專屬道具，
//     列在該副本 items。
//
// 條目結構：
//   scenario_id: {
//     name: "副本顯示名",
//     endings: [ { id:"ending_id", label:"結局名", hidden:true? }, ... ], // hidden:true 未解鎖遮為 ???
//     items: [ "item_id", ... ],       // 僅該副本「專屬」可帶出道具
//     achievements: [ "ach_id", ... ],
//   }
const COMPENDIUM = {};
Object.assign(COMPENDIUM, {
  "hospital_01": {
    name: "廢棄醫院",
    endings: [
      { id: "hospital_escape", label: "逃出廢棄醫院" },
      { id: "hospital_dead",   label: "消失在無盡走廊" },
    ],
    items: [],                    // 可帶出道具只有護身符（共通）→ 移至 COMPENDIUM_COMMON
    achievements: [],
  },
  "store_01": {
    name: "深夜便利商店",
    endings: [
      { id: "store_survive", label: "撐到天亮交班" },
      { id: "store_dead",    label: "「換你了。」" },
    ],
    items: [],
    achievements: [],
  },
  "metro_01": {
    name: "廢棄地鐵站",
    endings: [
      { id: "metro_escape", label: "衝出地鐵站" },
      { id: "metro_dead",   label: "末班車的乘客" },
    ],
    items: [],
    achievements: [],
  },
  "wreck_01": {
    name: "傾覆的沉船",
    endings: [
      { id: "wreck_escape", label: "浮出海面獲救" },
      { id: "wreck_dead",   label: "沉入深藍" },
    ],
    items: [],                    // 可帶出道具只有羅盤（共通）→ 移至 COMPENDIUM_COMMON
    achievements: [],
  },
  "aquarium": {                   // ★ scenario id 是 "aquarium"（非 aquarium_01）
    name: "閉館後的藍",
    endings: [
      { id: "aquarium_survive", label: "活著走出水族館" },
      { id: "aquarium_dead",    label: "回頭了" },
    ],
    items: [ "humanface_fish" ],  // 水族館專屬（domain:"aquarium"）
    achievements: [ "aquarium_perfect_clear" ],
  },
  "bakery_01": {
    name: "凌晨四點的麵包店",
    endings: [
      { id: "bakery_normal", label: "普通結局：凌晨四點的麵包店" },
      { id: "bakery_bad_1",  label: "Bad End：對不起，讓妳久等了" },
      { id: "bakery_bad_2",  label: "Bad End：繼續做夢" },
      { id: "bakery_true",   label: "真結局：《沒有如果》" },
      { id: "bakery_hidden", label: "真結局＋隱藏記憶：《沒有如果》", hidden: true },
    ],
    items: [ "baguette_bat", "baguette_bat_plain" ],   // 麵包店專屬（domain:"bakery"）
    achievements: [ "ach_1782663164619" ],   // 全壘打
  },
});

// --- 共通道具圖鑑（跨副本核心道具：domain:"core" 且 carry:true）---------------
// 獨立成區，不掛在任一副本下。分子同樣由 carriedItems 判定（以 id 為鍵，全域共用）。
// 只要玩家進過任一副本（圖鑑非空），此區即顯示。
//
// ★ 共通道具的專屬欄位（一般副本專屬道具沒有，因為它們只屬於單一副本）：
//   id    : 道具 id（名稱／註解仍由 UI 即時查 ITEMS[id]）
//   from  : 出沒來源——可掉落此道具的副本 id 清單；UI 解析為副本名顯示「出沒：A · B · C」。
//           即使尚未蒐集（？？？）也照常顯示來源，作為「去哪裡找」的線索，不算劇透。
//   note  : 選填，該道具在「共通收藏」脈絡下的補充說明（會優先於 ITEMS.effect 顯示）。
const COMPENDIUM_COMMON = {
  name: "共通道具",
  intro: "跨副本流通的收藏。可在多個記憶副本中帶出，集滿一次即永久記錄於此。",
  items: [
    { id: "amulet",  from: ["hospital_01", "store_01", "metro_01"],
      note: "在數座記憶副本的角落反覆出現的護身符，像是某種共通的低語。" },
    { id: "compass", from: ["wreck_01"] },
  ],
};
