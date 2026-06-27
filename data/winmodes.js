/* ========================= 特殊副本擴充：winMode 登記 =========================
   新增特殊副本：在此檔案尾端加一個 registerWinMode 呼叫，不動引擎主體。
   此檔必須在引擎主 <script> 之後載入（registerWinMode / WINMODE_HOOKS 須先存在）。
   WIN_CONDITIONS / computeAccumulatorBonus 定義於引擎主體（index.html），此處直接使用。
   ======================================================================== */

/* ── 通用 accumulate winMode（讀取 scenario.accumulator 設定驅動邏輯）── */
registerWinMode("accumulate", {
  get skipSteer()     { return curScn?.accumulator?.skipSteer     ?? false; },
  get skipTurnLimit() { return curScn?.accumulator?.skipTurnLimit ?? false; },

  onEnter(state){
    const cfg = curScn.accumulator;
    state[cfg.stateKey] = cfg.initValue ?? 0;
  },

  onChoiceMade(choice, state, ctx){
    const cfg = ctx.scenario.accumulator;
    if(choice[cfg.choiceKey]) state[cfg.stateKey] += choice[cfg.choiceKey];
    if(choice[cfg.finalChoiceKey]){
      const bonus = computeAccumulatorBonus(ctx.inventory, cfg.bonusFrom);
      const total = state[cfg.stateKey] + bonus;
      const { min, max } = cfg.roll;
      if(total >= max){
        if(cfg.overflow?.achievementRoll) triggerAchievementRoll(total - max);
        return { overrideNextId: choice.success };
      }
      const roll = min + Math.floor(Math.random() * (max - min + 1));
      const win = WIN_CONDITIONS[cfg.winIf]?.(roll, total) ?? false;
      return { overrideNextId: win ? choice.success : choice.fail };
    }
    return null;
  },

  onNodeEnter(nodeId, state, ctx){
    if(ctx.scenario.nodes[nodeId]?.end) return;
    if(ctx.scenario.accumulator?.autoDropPerNode && ctx.scenario.pool){
      rollAutoDrops(ctx.scenario.pool);
    }
  }
});
