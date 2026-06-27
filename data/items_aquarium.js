// --- 物品池：aquarium_01 專屬道具 -------------------------------------------
// domain:"aquarium" = 僅用於閉館後的藍，slot:null 不進裝備系統，提供 finalBonus
Object.assign(ITEMS, {
  "rusty_fish_knife": {
    "name": "生鏽的殺魚刀",
    "effect": "最終存活判定 +20%",
    "value": 40,
    "tier": 1,
    "carry": false,
    "drop": 0.3,
    "check": null,
    "bonus": 0,
    "slot": null,
    "icon": "🔪",
    "rarity": "blue",
    "finalBonus": 20,
    "domain": "aquarium"
  },
  "eye_hook": {
    "name": "勾著眼珠的魚鉤",
    "effect": "最終存活判定 +10%",
    "value": 25,
    "tier": 1,
    "carry": false,
    "drop": 0.35,
    "check": null,
    "bonus": 0,
    "slot": null,
    "icon": "🪝",
    "rarity": "green",
    "finalBonus": 10,
    "domain": "aquarium"
  },
  "humanface_fish": {
    "name": "長著人臉的魚",
    "effect": "最終存活判定 +50%",
    "value": 150,
    "tier": 1,
    "carry": true,
    "drop": 0.001,
    "check": null,
    "bonus": 0,
    "slot": null,
    "icon": "🐟",
    "rarity": "yellow",
    "finalBonus": 50,
    "domain": "aquarium"
  },
});
