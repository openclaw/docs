---
read_when:
    - 使用者回報代理程式卡住並重複工具呼叫
    - 你需要調整重複呼叫保護
    - 你正在編輯代理程式工具／執行階段政策
summary: 如何啟用並調校可偵測重複工具呼叫迴圈的防護機制
title: 工具迴圈偵測
x-i18n:
    generated_at: "2026-05-03T21:43:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 可以避免代理程式卡在重複的工具呼叫模式中。
此防護機制**預設為停用**。

僅在需要時啟用，因為嚴格設定可能會封鎖合法的重複呼叫。

## 為何需要此功能

- 偵測沒有取得進展的重複序列。
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

每個代理程式的覆寫設定（選用）：

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
- `warningThreshold`：將模式分類為僅警告前的門檻。
- `criticalThreshold`：封鎖重複迴圈模式的門檻。
- `globalCircuitBreakerThreshold`：全域無進展斷路器門檻。
- `detectors.genericRepeat`：偵測重複的相同工具 + 相同參數模式。
- `detectors.knownPollNoProgress`：偵測沒有狀態變更的已知類輪詢模式。
- `detectors.pingPong`：偵測交替的 ping-pong 模式。

對於 `exec`，無進展檢查會比較穩定的命令結果，並忽略易變的執行階段中繼資料，例如持續時間、PID、工作階段 ID 和工作目錄。
當可用 run id 時，近期工具呼叫歷史只會在該次執行內評估，因此排程 Heartbeat 週期和新的執行不會繼承先前執行的過期迴圈計數。

## 建議設定

- 對於較小型模型，從 `enabled: true` 開始，並維持預設值不變。旗艦模型很少需要迴圈偵測，可以保持停用。
- 將門檻順序維持為 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果發生誤判：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`
  - （選用）提高 `globalCircuitBreakerThreshold`
  - 只停用造成問題的偵測器
  - 降低 `historySize`，以取得較不嚴格的歷史情境

## 記錄與預期行為

偵測到迴圈時，OpenClaw 會回報迴圈事件，並視嚴重程度封鎖或抑制下一個工具週期。
這可保護使用者免於失控的權杖花費和鎖死，同時保留正常的工具存取。

- 優先使用警告和暫時抑制。
- 只有在重複證據累積時才升級處理。

## 注意事項

- `tools.loopDetection` 會與代理程式層級的覆寫設定合併。
- 每個代理程式的設定會完整覆寫或延伸全域值。
- 如果沒有設定，防護機制會保持關閉。

## 相關

- [Exec 核准](/zh-TW/tools/exec-approvals)
- [思考等級](/zh-TW/tools/thinking)
- [子代理程式](/zh-TW/tools/subagents)
