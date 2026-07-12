---
read_when:
    - 使用者回報代理程式卡住並重複呼叫工具
    - 你需要調整重複呼叫保護機制
    - 您正在編輯代理程式工具／執行階段政策
    - 在內容溢位重試後，你遇到 `compaction_loop_persisted` 中止錯誤
summary: 如何啟用及調整用於偵測重複工具呼叫迴圈的防護機制
title: 工具迴圈偵測
x-i18n:
    generated_at: "2026-07-11T21:54:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 有兩項互相配合的防護機制，用於防止重複的工具呼叫模式，
兩者皆在 `tools.loopDetection` 下設定：

1. **迴圈偵測**（`enabled`）——預設停用。監看滾動式
   工具呼叫歷史記錄，以找出重複模式及對未知工具的重試。
2. **壓縮後防護**（`postCompactionGuard`）——只要
   `enabled` 未明確設為 `false`，便會啟用。每次壓縮重試後進入待命，
   若代理程式在視窗內重複相同的 `(tool, args, result)` 三元組，
   便會中止該次執行。

設定 `tools.loopDetection.enabled: false` 可停用這兩項防護機制。

## 為何需要此機制

- 偵測無法取得進展的重複序列。
- 偵測高頻率且無結果的迴圈（相同工具、相同輸入、重複
  發生錯誤）。
- 偵測已知輪詢工具的特定重複呼叫模式。
- 中斷「內容超出上限 -> 壓縮 -> 相同迴圈」的循環，而非任其
  無限執行。

## 設定區塊

全域預設值，以下顯示所有已記載的欄位：

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // 滾動歷史記錄偵測器的總開關
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
        windowSize: 3, // 壓縮重試後進入待命；除非 enabled 明確為 false，否則會執行
      },
    },
  },
}
```

個別代理程式覆寫（選用，位於 `agents.list[].tools.loopDetection`）：

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

個別代理程式的設定會逐欄位覆蓋全域區塊（包括巢狀的
`detectors` 與 `postCompactionGuard`），因此代理程式只需設定
想要變更的欄位。

### 欄位行為

| 欄位                             | 預設值  | 效果                                                                                                                                       |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                        | `false` | 滾動歷史記錄偵測器的總開關。`false` 也會停用壓縮後防護。                                                                                   |
| `historySize`                    | `30`    | 保留供分析使用的最近工具呼叫數量。                                                                                                         |
| `warningThreshold`               | `10`    | 模式被分類為僅警告前的重複次數。                                                                                                           |
| `criticalThreshold`              | `20`    | 阻擋無進展迴圈模式的重複次數。若設定錯誤，執行階段會將其限制為高於 `warningThreshold` 的值。                                                |
| `unknownToolThreshold`           | `10`    | 對同一個無法使用的工具呼叫失敗達此次數後，阻擋後續重複呼叫。不受 `detectors` 控制。                                                        |
| `globalCircuitBreakerThreshold`  | `30`    | 套用於所有偵測器的全域無進展斷路器。若設定錯誤，執行階段會將其限制為高於 `criticalThreshold` 的值。不受 `detectors` 控制。                  |
| `detectors.genericRepeat`        | `true`  | 對重複使用相同工具與相同引數的呼叫發出警告；若這些呼叫也傳回相同結果，便會加以阻擋。                                                       |
| `detectors.knownPollNoProgress`  | `true`  | 偵測已知的無進展輪詢模式（`process` 搭配 `action: "poll"`/`"log"`、`command_status`）。                                                     |
| `detectors.pingPong`             | `true`  | 偵測兩個呼叫之間交替出現的無進展乒乓模式。                                                                                                 |
| `postCompactionGuard.windowSize` | `3`     | 壓縮後防護維持待命的嘗試次數，以及會導致執行中止的相同三元組次數。                                                                         |

對於 `exec`，無進展雜湊會比較穩定的命令結果（狀態、
結束代碼、逾時旗標、輸出），並忽略易變動的執行階段中繼資料，例如
持續時間、PID、工作階段 ID 與工作目錄。外送訊息的傳送
結果在雜湊前會移除每次呼叫都會變動的 ID（訊息 ID、檔案 ID、時間戳記），
因此某次「已傳送」結果不會看似與另一次不同的「已傳送」
結果相同。若有執行 ID，則只會在該次執行內評估歷史記錄，
因此排程的心跳偵測週期及新的執行不會繼承
先前執行所留下的過時迴圈計數。

## 建議設定

- 對於較小的模型，設定 `enabled: true` 並保留預設
  閾值。旗艦模型通常不需要滾動歷史記錄偵測，
  可將總開關維持為 `false`，同時仍受益於
  壓縮後防護。
- 請保持閾值順序為 `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`；若將 `criticalThreshold` 或
  `globalCircuitBreakerThreshold` 設為小於或等於其必須超越的
  閾值，執行階段會將其向上調整。
- 若發生誤判：
  - 提高 `warningThreshold` 和／或 `criticalThreshold`。
  - 可選擇提高 `globalCircuitBreakerThreshold`。
  - 僅停用造成問題的特定偵測器（`detectors.<name>: false`）。
  - 減少 `historySize`，以縮短歷史記錄視窗。
- 若要停用所有機制，包括壓縮後防護，請明確設定
  `tools.loopDetection.enabled: false`。

## 壓縮後防護

內容超出上限並進行壓縮重試後，執行器會針對接下來幾次
工具呼叫啟用短視窗防護。若代理程式在該視窗內產生相同的
`(toolName, argsHash, resultHash)` 三元組達
`postCompactionGuard.windowSize` 次，防護機制便會判定壓縮未能中斷
迴圈，並以 `compaction_loop_persisted` 錯誤中止執行。

此防護受總開關 `tools.loopDetection.enabled` 控制，但有一項
特殊規則：旗標未設定或為 `true` 時，防護會保持**啟用**，
只有在旗標明確設為 `false` 時才會停用。這是刻意的設計——此防護
旨在擺脫可能無限制消耗權杖的壓縮迴圈，
因此即使使用者未進行設定，也能獲得保護。

```json5
{
  tools: {
    loopDetection: {
      // 總開關；設為 false 可連同滾動歷史記錄偵測器一起停用此防護
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // 預設值
      },
    },
  },
}
```

- 較低的 `windowSize` 更為嚴格（中止前允許的嘗試次數較少）。
- 較高的 `windowSize` 可給予代理程式更多復原嘗試。
- 結果持續變化時，防護絕不會中止執行；只有視窗內
  位元組完全相同的結果才會觸發。
- 它只會在壓縮重試後立即進入待命，不會在執行的其他
  時點啟用。

<Note>
  只要總開關未明確設為 `false`，壓縮後防護就會執行，即使您從未寫入 `tools.loopDetection` 區塊也是如此。若要驗證，請在壓縮事件後立即查看閘道記錄中的 `post-compaction guard armed for N attempts`。
</Note>

## 記錄與預期行為

偵測到迴圈時，OpenClaw 會記錄迴圈事件，並依嚴重程度
發出警告或阻擋下一個工具週期，在保留正常工具存取能力的同時，
防止權杖失控消耗及系統鎖死。

- 會先發出警告。
- 模式持續超過警告閾值後，便會開始阻擋。
- 達到重大閾值時，會阻擋下一個工具週期，並在執行記錄中顯示明確的
  迴圈偵測原因。
- 壓縮後防護會發出 `compaction_loop_persisted` 錯誤，並指出
  造成問題的工具及相同呼叫次數。

## 相關內容

<CardGroup cols={2}>
  <Card title="Exec 核准" href="/zh-TW/tools/exec-approvals" icon="shield">
    Shell 執行的允許／拒絕政策。
  </Card>
  <Card title="思考層級" href="/zh-TW/tools/thinking" icon="brain">
    推理投入程度及其與供應商政策的互動。
  </Card>
  <Card title="子代理程式" href="/zh-TW/tools/subagents" icon="users">
    產生隔離的代理程式，以限制失控行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-tools#toolsloopdetection" icon="gear">
    完整的 `tools.loopDetection` 結構描述與合併語意。
  </Card>
</CardGroup>
