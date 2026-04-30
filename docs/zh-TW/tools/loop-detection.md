---
read_when:
    - 使用者回報代理程式卡住，不斷重複工具呼叫
    - 你需要調整重複呼叫保護
    - 你正在編輯代理工具/執行階段政策
summary: 如何啟用並調整可偵測重複工具呼叫迴圈的護欄
title: 工具迴圈偵測
x-i18n:
    generated_at: "2026-04-30T03:46:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 可以防止代理程式陷入重複的工具呼叫模式。
此防護機制**預設停用**。

只在需要時啟用，因為在嚴格設定下，它可能會阻擋合法的重複呼叫。

## 為什麼需要這項功能

- 偵測沒有進展的重複序列。
- 偵測高頻率、無結果的迴圈（相同工具、相同輸入、重複錯誤）。
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

每個代理程式覆寫（選用）：

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
- `warningThreshold`：將模式分類為僅警告之前的閾值。
- `criticalThreshold`：阻擋重複迴圈模式的閾值。
- `globalCircuitBreakerThreshold`：全域無進展斷路器閾值。
- `detectors.genericRepeat`：偵測重複的相同工具 + 相同參數模式。
- `detectors.knownPollNoProgress`：偵測沒有狀態變更的已知類輪詢模式。
- `detectors.pingPong`：偵測交替的乒乓模式。

對於 `exec`，無進展檢查會比較穩定的命令結果，並忽略易變的執行階段中繼資料，例如持續時間、PID、工作階段 ID 和工作目錄。
當有可用的執行 ID 時，近期工具呼叫歷史只會在該次執行內評估，因此排程的 Heartbeat 週期和新的執行不會繼承先前執行中的過期迴圈計數。

## 建議設定

- 從 `enabled: true` 開始，保持預設值不變。
- 將閾值順序維持為 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果發生誤判：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`
  - （選用）提高 `globalCircuitBreakerThreshold`
  - 只停用造成問題的偵測器
  - 降低 `historySize`，以減少嚴格的歷史脈絡

## 記錄與預期行為

偵測到迴圈時，OpenClaw 會回報迴圈事件，並依嚴重程度阻擋或抑制下一個工具週期。
這可保護使用者避免失控的 token 花費和鎖死，同時保留正常的工具存取。

- 優先使用警告和暫時抑制。
- 只有在重複證據累積時才升級處理。

## 注意事項

- `tools.loopDetection` 會與代理程式層級覆寫合併。
- 每個代理程式設定會完整覆寫或擴充全域值。
- 如果沒有設定，防護機制會保持關閉。

## 相關

- [Exec 核准](/zh-TW/tools/exec-approvals)
- [思考層級](/zh-TW/tools/thinking)
- [子代理程式](/zh-TW/tools/subagents)
