---
read_when:
    - 使用者回報代理程式卡住並反覆進行工具呼叫
    - 你需要調校重複呼叫保護
    - 你正在編輯代理工具/執行階段政策
    - 在上下文溢位重試後，你遇到 `compaction_loop_persisted` 中止
summary: 如何啟用並調整可偵測重複工具呼叫迴圈的防護機制
title: 工具迴圈偵測
x-i18n:
    generated_at: "2026-05-11T20:37:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc261bebc0e3138a98ea8be166edbaf4e133c8f582429c5380fe2954196a6fc5
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 有兩道相互配合的防護機制，用於處理重複的工具呼叫模式：

1. **迴圈偵測**（`tools.loopDetection.enabled`）— 預設停用。監看滾動的工具呼叫歷史，以偵測重複模式與未知工具重試。
2. **Compaction 後防護**（`tools.loopDetection.postCompactionGuard`）— 預設啟用，除非 `tools.loopDetection.enabled` 明確設為 `false`。會在每次 Compaction 重試後進入待命，並在代理程式於視窗內發出相同的 `(tool, args, result)` 三元組時中止執行。

兩者都在相同的 `tools.loopDetection` 區塊下設定，但只要主開關未明確關閉，Compaction 後防護就會執行。將 `tools.loopDetection.enabled: false` 設定為明確值，可同時關閉兩個表面。

## 為什麼需要這項機制

- 偵測沒有取得進展的重複序列。
- 偵測高頻率的無結果迴圈（相同工具、相同輸入、重複錯誤）。
- 偵測已知輪詢工具的特定重複呼叫模式。
- 防止內容溢位、接著 Compaction、接著又回到相同迴圈的週期無限執行。

## 設定區塊

全域預設值，以下顯示所有已文件化的欄位：

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
      },
    },
  },
}
```

各代理程式覆寫（選用）：

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### 欄位行為

| 欄位                             | 預設值  | 效果                                                                                                                            |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | 滾動歷史偵測器的主開關。設定為 `false` 也會停用 Compaction 後防護。                                                            |
| `historySize`                    | `30`    | 保留用於分析的近期工具呼叫數量。                                                                                                |
| `warningThreshold`               | `10`    | 模式被歸類為僅警告之前的閾值。                                                                                                  |
| `criticalThreshold`              | `20`    | 封鎖重複且無進展迴圈模式的閾值。                                                                                                |
| `unknownToolThreshold`           | `10`    | 對相同不可用工具的重複呼叫，在達到此遺漏次數後封鎖。                                                                            |
| `globalCircuitBreakerThreshold`  | `30`    | 跨所有偵測器的全域無進展斷路器閾值。                                                                                            |
| `detectors.genericRepeat`        | `true`  | 對重複的相同工具 + 相同參數模式發出警告，並在相同呼叫也回傳相同結果時封鎖。                                                   |
| `detectors.knownPollNoProgress`  | `true`  | 偵測沒有狀態變化的已知類輪詢模式。                                                                                              |
| `detectors.pingPong`             | `true`  | 偵測交替的來回模式。                                                                                                            |
| `postCompactionGuard.windowSize` | `3`     | Compaction 後工具呼叫期間防護保持待命的次數，也是會中止執行的相同三元組計數。                                                  |

對於 `exec`，無進展檢查會比較穩定的命令結果，並忽略易變的執行階段中繼資料，例如持續時間、PID、工作階段 ID 與工作目錄。當有可用的執行 ID 時，近期工具呼叫歷史只會在該次執行內評估，因此排程的 Heartbeat 週期與新的執行不會繼承先前執行留下的過期迴圈計數。

## 建議設定

- 對於較小的模型，設定 `enabled: true` 並保留預設閾值。旗艦模型通常不需要滾動歷史偵測，可以讓主開關維持 `false`，同時仍受益於 Compaction 後防護。
- 保持閾值順序為 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 若發生誤判：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`。
  - 視需要提高 `globalCircuitBreakerThreshold`。
  - 只停用造成問題的特定偵測器（`detectors.<name>: false`）。
  - 降低 `historySize`，讓歷史脈絡限制較寬鬆。
- 若要停用所有功能（包括 Compaction 後防護），請明確設定 `tools.loopDetection.enabled: false`。

## Compaction 後防護

當執行器在內容溢位後完成一次 Compaction 重試時，會啟動一個短視窗防護來監看接下來的幾次工具呼叫。若代理程式在視窗內多次發出相同的 `(toolName, argsHash, resultHash)` 三元組，防護會判定 Compaction 未能中斷迴圈，並以 `compaction_loop_persisted` 錯誤中止執行。

此防護由主控的 `tools.loopDetection.enabled` 旗標控制，但有一個差異：它在旗標未設定或為 `true` 時會保持**啟用**，只有在旗標明確為 `false` 時才會停用。這是刻意設計。防護的目的，是避開原本會無限制消耗權杖的 Compaction 迴圈，因此未設定任何組態的使用者仍會受到保護。

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- 較低的 `windowSize` 較嚴格（中止前允許較少嘗試）。
- 較高的 `windowSize` 會給代理程式更多恢復嘗試。
- 只要結果正在變化，防護就永遠不會中止；只有在整個視窗內結果的位元組完全相同時才會中止。
- 它刻意保持範圍狹窄：只會在 Compaction 重試剛完成後立即觸發。

<Note>
  只要主旗標未明確設為 `false`，Compaction 後防護就會執行，即使你從未寫過 `tools.loopDetection` 區塊也一樣。若要驗證，請在 Compaction 事件後立即查看 gateway 記錄中的 `post-compaction guard armed for N attempts`。
</Note>

## 記錄與預期行為

偵測到迴圈時，OpenClaw 會回報迴圈事件，並依嚴重性抑制或封鎖下一個工具週期。這可保護使用者免於失控的權杖花費與鎖死，同時保留正常的工具存取。

- 會先出現警告。
- 當模式持續超過警告閾值時，接著會進行抑制。
- 臨界閾值會封鎖下一個工具週期，並在執行記錄中顯示清楚的迴圈偵測原因。
- Compaction 後防護會發出 `compaction_loop_persisted` 錯誤，並包含造成問題的工具名稱與相同呼叫計數。

## 相關

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/zh-TW/tools/exec-approvals" icon="shield">
    Shell 執行的允許/拒絕政策。
  </Card>
  <Card title="Thinking levels" href="/zh-TW/tools/thinking" icon="brain">
    推理投入層級與提供者政策互動。
  </Card>
  <Card title="Sub-agents" href="/zh-TW/tools/subagents" icon="users">
    產生隔離的代理程式，以限制失控行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 `tools.loopDetection` schema 與合併語意。
  </Card>
</CardGroup>
