---
read_when:
    - 使用者回報代理程式卡在重複工具呼叫
    - 你需要調整重複呼叫保護
    - 您正在編輯代理工具/執行階段政策
    - 你在內容脈絡溢位重試後遇到 `compaction_loop_persisted` 中止
summary: 如何啟用並微調可偵測重複工具呼叫迴圈的防護機制
title: 工具迴圈偵測
x-i18n:
    generated_at: "2026-05-06T02:59:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 有兩道協同運作的防護機制，用於處理重複的工具呼叫模式：

1. **循環偵測** (`tools.loopDetection.enabled`) — 預設停用。監看滾動的工具呼叫歷史，尋找重複模式與未知工具重試。
2. **Compaction 後防護** (`tools.loopDetection.postCompactionGuard`) — 預設啟用，除非 `tools.loopDetection.enabled` 明確為 `false`。每次 Compaction 重試後會啟動，並在 agent 於視窗內發出相同的 `(tool, args, result)` 三元組時中止執行。

兩者都在同一個 `tools.loopDetection` 區塊下設定，但只要主開關未明確關閉，Compaction 後防護就會執行。設定 `tools.loopDetection.enabled: false` 可同時靜音這兩個介面。

## 為什麼需要這個機制

- 偵測沒有進展的重複序列。
- 偵測高頻率、無結果的循環（相同工具、相同輸入、重複錯誤）。
- 偵測已知輪詢工具的特定重複呼叫模式。
- 防止內容溢位、接著 Compaction、再進入相同循環的週期無限執行。

## 設定區塊

全域預設值，列出所有文件化欄位：

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

每個 agent 的覆寫設定（選用）：

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

| 欄位                             | 預設值  | 作用                                                                                                                            |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | 滾動歷史偵測器的主開關。設定為 `false` 也會停用 Compaction 後防護。                                                             |
| `historySize`                    | `30`    | 保留用於分析的近期工具呼叫數量。                                                                                                |
| `warningThreshold`               | `10`    | 模式被分類為僅警告前的門檻。                                                                                                    |
| `criticalThreshold`              | `20`    | 封鎖重複循環模式的門檻。                                                                                                        |
| `unknownToolThreshold`           | `10`    | 在這麼多次未命中後，封鎖對同一個不可用工具的重複呼叫。                                                                          |
| `globalCircuitBreakerThreshold`  | `30`    | 跨所有偵測器的全域無進展斷路器門檻。                                                                                            |
| `detectors.genericRepeat`        | `true`  | 偵測相同工具加相同參數的重複模式。                                                                                              |
| `detectors.knownPollNoProgress`  | `true`  | 偵測沒有狀態變化的已知類輪詢模式。                                                                                              |
| `detectors.pingPong`             | `true`  | 偵測交替往返的模式。                                                                                                            |
| `postCompactionGuard.windowSize` | `3`     | Compaction 後工具呼叫的數量；防護會在此期間保持啟動，也是會中止執行的相同三元組計數。                                          |

對於 `exec`，無進展檢查會比較穩定的命令結果，並忽略容易變動的執行階段中繼資料，例如持續時間、PID、工作階段 ID 和工作目錄。當可取得執行 ID 時，近期工具呼叫歷史只會在該次執行內評估，因此排程的 Heartbeat 週期和新的執行不會繼承先前執行留下的過期循環計數。

## 建議設定

- 對較小型模型，設定 `enabled: true` 並保留預設門檻。旗艦模型通常不需要滾動歷史偵測，可將主開關維持為 `false`，同時仍受益於 Compaction 後防護。
- 保持門檻順序為 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果發生誤判：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`。
  - 視需要提高 `globalCircuitBreakerThreshold`。
  - 只停用造成問題的特定偵測器（`detectors.<name>: false`）。
  - 降低 `historySize`，讓歷史內容判斷較不嚴格。
- 若要停用所有機制（包含 Compaction 後防護），請明確設定 `tools.loopDetection.enabled: false`。

## Compaction 後防護

當執行器在內容溢位後完成一次 Compaction 重試時，會啟動一個短視窗防護，監看接下來幾次工具呼叫。如果 agent 在視窗內多次發出相同的 `(toolName, argsHash, resultHash)` 三元組，防護會判定 Compaction 未打破循環，並以 `compaction_loop_persisted` 錯誤中止執行。

此防護受主 `tools.loopDetection.enabled` 旗標控管，但有一個差異：它在旗標未設定或為 `true` 時會保持**啟用**，只有在旗標明確為 `false` 時才停用。這是刻意設計。此防護用來脫離否則會消耗無上限 token 的 Compaction 循環，因此沒有設定的使用者仍會取得保護。

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

- 較低的 `windowSize` 較嚴格（中止前允許的嘗試次數較少）。
- 較高的 `windowSize` 會給 agent 更多復原嘗試。
- 當結果正在改變時，防護絕不會中止；只有在整個視窗中結果逐位元組相同時才會中止。
- 它刻意保持狹窄：只會在 Compaction 重試後的立即階段觸發。

<Note>
  只要主旗標未明確為 `false`，Compaction 後防護就會執行，即使你從未撰寫 `tools.loopDetection` 區塊也一樣。若要驗證，請在 Compaction 事件後立即查看 Gateway 記錄中是否有 `post-compaction guard armed for N attempts`。
</Note>

## 記錄與預期行為

偵測到循環時，OpenClaw 會回報循環事件，並根據嚴重程度抑制或封鎖下一個工具週期。這可保護使用者免於失控的 token 花費和鎖死，同時保留正常工具存取。

- 警告會先出現。
- 當模式持續超過警告門檻時，接著會進行抑制。
- 重大門檻會封鎖下一個工具週期，並在執行記錄中顯示清楚的循環偵測原因。
- Compaction 後防護會發出 `compaction_loop_persisted` 錯誤，並包含出問題的工具名稱與相同呼叫計數。

## 相關

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/zh-TW/tools/exec-approvals" icon="shield">
    Shell 執行的允許/拒絕政策。
  </Card>
  <Card title="Thinking levels" href="/zh-TW/tools/thinking" icon="brain">
    推理投入層級與供應商政策互動。
  </Card>
  <Card title="Sub-agents" href="/zh-TW/tools/subagents" icon="users">
    產生隔離的 agent，以限制失控行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 `tools.loopDetection` 結構描述與合併語意。
  </Card>
</CardGroup>
