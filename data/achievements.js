// --- 成就池（以 id 為鍵）。每個劇本的成就在此統一定義 ----------------------
// TODO: 成就累積到一定數量後解鎖「寶物庫」系統
const ACHIEVEMENTS = {
  aquarium_perfect_clear: {
    name:     "[隱藏成就] 過於完美的通關",
    hint:     "超過100分!! 真的假的~",
    icon:     "🌊",
    rarity:   "red",
    scenario: "aquarium",
    type:     "collect",   // collect / title / points / unlock
    visible:  false,       // false = 未解鎖時顯示「???」
    reward:   null,        // { points:N } / { title:"稱號" } / { unlockScenario:"id" }
  },
};
