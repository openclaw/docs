---
read_when:
    - 使用者回報代理程式卡住，並反覆進行工具呼叫
    - 你需要調整重複呼叫保護
    - 你正在編輯代理程式工具／執行階段政策
summary: 如何啟用並調整可偵測重複工具呼叫迴圈的防護機制
title: 工具迴圈偵測
x-i18n:
    generated_at: "2026-05-05T01:49:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 可以防止代理陷入重複的工具呼叫模式。
此防護機制**預設為停用**。

只在需要的地方啟用，因為在嚴格設定下，它可能會阻擋合法的重複呼叫。

## 為什麼存在此功能

- 偵測沒有進展的重複序列。
- 偵測高頻率且沒有結果的迴圈（相同工具、相同輸入、重複錯誤）。
- 偵測已知輪詢工具的特定重複呼叫模式。

## 設定區塊

全域預設值：

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

每個代理的覆寫設定（選用）：

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

- `enabled`：主開關。`false` 表示不執行迴圈偵測。
- `historySize`：保留供分析的近期工具呼叫數量。
- `warningThreshold`：將模式分類為僅警告前的閾值。
- `criticalThreshold`：阻擋重複迴圈模式的閾值。
- `globalCircuitBreakerThreshold`：全域無進展斷路器閾值。
- `detectors.genericRepeat`：偵測重複的相同工具 + 相同參數模式。
- `detectors.knownPollNoProgress`：偵測沒有狀態變化的已知類輪詢模式。
- `detectors.pingPong`：偵測交替的乒乓模式。

對於 `exec`，無進展檢查會比較穩定的命令結果，並忽略易變的執行階段中繼資料，例如持續時間、PID、工作階段 ID 和工作目錄。
當可用執行 ID 時，近期工具呼叫歷史只會在該次執行內評估，因此排程的 Heartbeat 週期和新執行不會繼承較早執行中的過期迴圈計數。

## 建議設定

- 對於較小的模型，從 `enabled: true` 開始，並保持預設值不變。旗艦模型通常不需要迴圈偵測，可以保持停用。
- 保持閾值順序為 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果發生誤判：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`
  - （選用）提高 `globalCircuitBreakerThreshold`
  - 只停用造成問題的偵測器
  - 降低 `historySize` 以減少嚴格的歷史內容脈絡

## Compaction 後防護機制

當執行器完成自動 Compaction 重試（在內容脈絡溢位後）時，它會啟動一個短視窗防護機制，監看接下來幾次工具呼叫。如果代理在該視窗內多次發出_相同的_ `(toolName, args, result)` 三元組，防護機制會判定 Compaction 未能中斷迴圈，並以 `compaction_loop_persisted` 錯誤中止執行。

這是獨立於全域 `tools.loopDetection` 偵測器的另一條程式碼路徑。它可以獨立設定：

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`：Compaction 後工具呼叫的數量，在此期間防護機制會保持啟動，_並且_也是觸發中止所需的相同（工具、引數、結果）三元組計數。

當結果正在變化時，防護機制絕不會中止，只有在整個視窗中的結果逐位元組相同時才會中止。它刻意保持狹窄範圍：只會在 Compaction 重試後的立即階段觸發。

## 記錄與預期行為

偵測到迴圈時，OpenClaw 會回報迴圈事件，並依嚴重程度阻擋或緩和下一個工具週期。
這可在保留正常工具存取的同時，保護使用者免於失控的權杖花費和鎖死。

- 優先使用警告和暫時抑制。
- 只有在重複證據累積後才升級。

## 注意事項

- `tools.loopDetection` 會與代理層級覆寫設定合併。
- 每個代理的設定會完整覆寫或擴充全域值。
- 如果不存在設定，防護欄會保持關閉。

## 相關

- [Exec 核准](/zh-TW/tools/exec-approvals)
- [思考層級](/zh-TW/tools/thinking)
- [子代理](/zh-TW/tools/subagents)
