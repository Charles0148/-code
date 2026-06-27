// --- 裝備槽定義 ---------------------------------------------------------------
const SLOTS = {
  head:   { label:"頭部",   hint:"頭盔・頭飾" },
  body:   { label:"身體",   hint:"護甲・外套" },
  feet:   { label:"腳部",   hint:"靴子・護腳" },
  weapon: { label:"武器",   hint:"主要武器或工具" },
  amulet: { label:"護身符", hint:"神祕力量加護" },
  acc1:   { label:"飾品①", hint:"附加效果飾品" },
  acc2:   { label:"飾品②", hint:"附加效果飾品" },
};

// --- 稀有度中繼資料（label 顯示文字、cls CSS class 名）-----------------------
const RARITY_META = {
  white:  { label:"普通", cls:"rar-white"   },
  green:  { label:"稀有", cls:"rar-green"   },
  blue:   { label:"精良", cls:"rar-blue"    },
  yellow: { label:"史詩", cls:"rar-yellow"  },
  red:    { label:"傳說", cls:"rar-red"     },
  gold:   { label:"神器", cls:"rar-gold"    },
  rainbow:{ label:"彩虹", cls:"rar-rainbow" },
};
