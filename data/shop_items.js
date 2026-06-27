// --- 商店裝備（以 id 為鍵）。買了加進永久背包，check/bonus 在判定時生效 -------
const SHOP_ITEMS = {
  medkit:     { name:"急救包",       effect:"【裝備】敏捷 +2，危急時穩定身體狀態",     price:60,  check:"敏捷", bonus:2, slot:"body",   icon:"🩺", rarity:"green" },
  grimoire:   { name:"術法殘卷",     effect:"【裝備】膽識 +3，閱讀過的人都有點不一樣", price:90,  check:"膽識", bonus:3, slot:"body",   icon:"📜", rarity:"blue"  },
  lockpick:   { name:"開鎖工具組",   effect:"【裝備】搜查 +2，沒有開不了的鎖",         price:60,  check:"搜查", bonus:2, slot:"acc2",   icon:"🔓", rarity:"green" },
  irongloves: { name:"重型手套",     effect:"【裝備】蠻力 +3，打穿任何障礙",           price:90,  check:"蠻力", bonus:3, slot:"weapon", icon:"🥊", rarity:"blue"  },
  notebook:   { name:"調查員筆記本", effect:"【裝備】搜查 +1，記錄一切細節",           price:30,  check:"搜查", bonus:1, slot:"acc1",   icon:"📓", rarity:"white" },
};
