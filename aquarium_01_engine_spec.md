# aquarium_01 引擎機制改造規格書

> 給 Claude Code 看的交接文件。
> 副本《閉館後的藍》(`aquarium_01.js`) 用到 5 個現有引擎尚未支援的機制。
> 請依本規格實作，**不要自行更動既有副本的行為**，所有新邏輯要做到「舊副本不受影響」。

---

## 0. 背景：這個副本和一般副本哪裡不一樣？

一般副本的勝負是「走到 `end:"cleared"` 就贏」。
本副本不是——它的勝負由**第 15 回合的一次機率判定**決定：

- 玩家全程累積一個「存活率」變數（解對謎 +20%）。
- 身上的特定道具會在最終判定額外加成（+10 / +20 / +50%）。
- 第 15 回合 `node_climax` 用這個總機率擲一次骰，決定去 `node_cleared` 還是 `node_dead`。

所以核心是要新增兩個 run-time 變數，並改寫最終判定邏輯。

---

## 1. 累積存活率　`state.survivalRate`

**需求**
- 進入副本時初始化 `state.survivalRate = 0`。
- 當玩家選擇的 choice 帶有 `survival` 欄位（例如 `survival: 20`），結算時 `state.survivalRate += choice.survival`。
- 本副本共有 4 個謎、各一個正確選項帶 `survival: 20`，全對 = 80%。
- 沒有上限（可超過 100，溢出處理見第 3 節）。

**資料來源**：`aquarium_01.js` 中標了 `// 正確` 的 choice。

**邊界**
- 選錯的 choice 沒有 `survival` 欄位 → 不加分，正常前往該關的 fail 節點。
- 同一謎不會被重複結算（玩家走完一關就前進，不會回頭重刷）。

---

## 2. 額外掉落率　`state.lootRate`

**需求**
- 進入副本時初始化 `state.lootRate = 0`（單位：百分點）。
- 當玩家選的 choice 通過 `check` 判定，且該 choice 帶有 `onSuccess.lootRateBonus`，則 `state.lootRate += onSuccess.lootRateBonus`（本副本每次 +5）。
- 這個值會疊加到第 5 節「每回合掉落」的機率上。

**資料來源**：四個過場節點（`node_hall_1`~`node_hall_4`）的第一個 choice。

**注意**
- 目前這些過場 choice 的 `check.success` 和 `check.fail` 指向**同一個節點**（判定成敗都會前進，差別只在成功才加掉落率）。這是刻意的，請保留。

---

## 3. 最終存活判定（重點）

`node_climax` 的三個 choice 都帶 `finalRoll: true`，行為相同。觸發時：

```
總成功率 = state.survivalRate + Σ(持有道具的 finalBonus)
```

**道具加成規則**
- 只計算「玩家當前持有」的道具。
- finalBonus：殺魚刀 +20、魚鉤 +10、人臉魚 +50。
- **不重複堆疊**：同一種道具就算有多個也只算一次（理論上不會發生，但請防呆）。
- **無上限**：總成功率可以超過 100。

**判定**
- 若 `總成功率 >= 100`：**必定存活** → `node_cleared`。
- 否則 roll 一個 1~100 的整數，`roll <= 總成功率` → `node_cleared`，反之 → `node_dead`。

**溢出 → 成就系統（先留接口，本期不實作）**
- 若 `總成功率 > 100`，計算 `overflow = 總成功率 - 100`。
- 預留呼叫：`triggerAchievementRoll(overflow)`，意義是「以 overflow% 的機率抽中隱藏成就」。
- 本期請先寫成空函式或 `console.log("achievement roll:", overflow)`，等成就系統做好再接。

**範例**（驗收用）
| 情境 | survivalRate | 道具 | 總成功率 | 結果 |
|---|---|---|---|---|
| 四關全對、無道具 | 80 | — | 80% | roll ≤ 80 存活 |
| 四關全對、三道具齊 | 80 | 20+10+50 | 160% | 必定存活，overflow 60 進成就 |
| 只對一關、有人臉魚 | 20 | 50 | 70% | roll ≤ 70 存活 |
| 全錯、無道具 | 0 | — | 0% | 必定死亡 |

---

## 4. 自訂欄位總表（引擎要能讀）

| 欄位 | 位置 | 型別 | 意義 |
|---|---|---|---|
| `winMode: "final_roll"` | 副本根層 | string | 標記本副本走最終判定流程 |
| `choice.survival` | 謎題正解 choice | number | 結算時 `survivalRate += 值` |
| `choice.onSuccess.lootRateBonus` | 過場 choice | number | check 成功時 `lootRate += 值` |
| `choice.finalRoll` | climax choice | bool | 觸發第 3 節的最終判定 |

> 既有副本沒有這些欄位，所以只要「欄位存在才處理」，就不會影響舊內容。

---

## 5. 每回合自動掉落（需要討論的設計取捨）

**諾茲托特的需求**：「每一個回合都有機會抽掉落」。

**現況**：引擎目前只支援把 `loot: true` 綁在 choice 上，玩家選了那個選項才擲掉落。

**建議實作**
- 在每次進入新節點（= 每回合）時，對 `pool` 內**尚未持有**的每件道具各擲一次：
  - 命中機率 = `item.drop + state.lootRate/100`
  - 例：人臉魚 `drop:0.001`，即 0.1%；若已累積 lootRate 10，則為 0.1% + 10% ≈ 10.1%（請確認這是你要的疊加方式，或改成只對 drop 做加法上限）。
- 命中就把道具加入背包。

**⚠️ 取捨（請 Claude Code 先問諾茲托特再動手）**
1. 若改成「每回合自動掉落」，那些 choice 上的 `loot: true` 是否要**移除**？否則同一回合會擲兩次（自動一次＋選項一次）。建議二選一：
   - (a) 保留每回合自動掉落，移除 choice 的 `loot:true`；或
   - (b) 每回合自動掉落＝基礎掉落，`loot:true` 選項＝額外再擲一次（獎勵搜刮）。
2. `lootRate` 與 `item.drop` 的疊加是「加法」還是「各自獨立擲」？上面假設加法，需確認。

---

## 6. 實作順序建議

1. 先做 §1 `survivalRate` 與 §3 最終判定（這兩個不做，副本根本無法分勝負）。
2. 再做 §2 `lootRate`。
3. 最後做 §5 每回合自動掉落（牽涉設計取捨，先跟諾茲托特確認 §5 的兩個問題）。
4. §3 的成就溢出先留空接口，等成就系統。

每做完一項，請用 §3 的範例表自測，確認四種情境的結果正確再交付。
