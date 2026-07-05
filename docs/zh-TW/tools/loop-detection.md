---
read_when:
    - 使用者回報代理程式卡住並重複進行工具呼叫
    - 你需要調整重複呼叫保護
    - 你正在編輯代理工具／執行階段政策
    - 你在內容脈絡溢位重試後遇到 `compaction_loop_persisted` 中止
summary: 如何啟用並調校可偵測重複工具呼叫迴圈的防護機制
title: 工具迴圈偵測
x-i18n:
    generated_at: "2026-07-05T11:46:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 有兩個相互配合的防護機制，用來防止重複的工具呼叫模式，
兩者都在 `tools.loopDetection` 下設定：

1. **迴圈偵測**（`enabled`）- 預設停用。監看滾動式
   工具呼叫歷史，找出重複模式與未知工具重試。
2. **壓縮後防護**（`postCompactionGuard`）- 只要
   `enabled` 未明確設為 `false` 就會啟用。每次壓縮重試後啟動，
   如果代理在視窗內重複相同的 `(tool, args, result)` 三元組，
   就會中止執行。

設定 `tools.loopDetection.enabled: false` 可關閉這兩個防護機制。

## 為什麼需要這個機制

- 偵測沒有進展的重複序列。
- 偵測高頻率、無結果的迴圈（相同工具、相同輸入、重複錯誤）。
- 偵測已知輪詢工具的特定重複呼叫模式。
- 中斷「上下文溢位 -> 壓縮 -> 相同迴圈」循環，而不是讓它無限執行。

## 設定區塊

全域預設值，以下顯示所有已文件化欄位：

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

每個代理的覆寫設定（選用，位於 `agents.list[].tools.loopDetection`）：

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

每個代理的設定會逐欄覆蓋全域區塊（包含巢狀的
`detectors` 和 `postCompactionGuard`），因此代理只需要設定
想要變更的欄位。

### 欄位行為

| 欄位                             | 預設值  | 效果                                                                                                                                     |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                        | `false` | 滾動歷史偵測器的主開關。`false` 也會停用壓縮後防護。                                          |
| `historySize`                    | `30`    | 保留用於分析的近期工具呼叫數量。                                                                                             |
| `warningThreshold`               | `10`    | 模式被分類為僅警告前的重複次數。                                                                               |
| `criticalThreshold`              | `20`    | 阻擋無進展迴圈模式的重複次數。如果設定錯誤，執行階段會將此值限制為高於 `warningThreshold`。                       |
| `unknownToolThreshold`           | `10`    | 在發生這麼多次未命中後，阻擋對同一個不可用工具的重複呼叫。不受 `detectors` 控制。                                       |
| `globalCircuitBreakerThreshold`  | `30`    | 跨所有偵測器的全域無進展斷路器。如果設定錯誤，執行階段會將此值限制為高於 `criticalThreshold`。不受 `detectors` 控制。 |
| `detectors.genericRepeat`        | `true`  | 對重複的相同工具 + 相同參數呼叫發出警告；一旦這些呼叫也回傳相同結果，就會阻擋。                                     |
| `detectors.knownPollNoProgress`  | `true`  | 偵測已知的無進展輪詢模式（`process` 搭配 `action: "poll"`/`"log"`、`command_status`）。                                    |
| `detectors.pingPong`             | `true`  | 偵測兩個呼叫之間交替出現的無進展 ping-pong 模式。                                                                      |
| `postCompactionGuard.windowSize` | `3`     | 壓縮後防護保持啟動的嘗試次數，以及會中止執行的相同三元組數量。                                   |

對於 `exec`，無進度雜湊會比較穩定的命令結果（狀態、
退出碼、逾時旗標、輸出），並忽略易變的執行階段中繼資料，例如
持續時間、PID、工作階段 ID 和工作目錄。對外傳送訊息的結果會在雜湊時移除
易變的每次呼叫 ID（訊息 ID、檔案 ID、時間戳記），因此一個「已傳送」結果
不會看起來與另一個不同的「已傳送」結果完全相同。當可取得執行 ID 時，歷史記錄
只會在該次執行內評估，因此排程心跳偵測週期和新的執行不會繼承
先前執行的過時迴圈計數。

## 建議設定

- 對於較小的模型，請設定 `enabled: true`，並將臨界值保留為其
  預設值。旗艦模型很少需要滾動歷史偵測，並且可以
  將主開關 `false` 保持關閉，同時仍受益於
  壓縮後防護。
- 保持臨界值順序為 `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`；如果你將 `criticalThreshold` 和
  `globalCircuitBreakerThreshold` 設定為等於或低於它們
  必須超過的臨界值，執行階段會將它們向上調整。
- 如果出現誤判：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`。
  - 可選擇提高 `globalCircuitBreakerThreshold`。
  - 只停用造成問題的特定偵測器（`detectors.<name>: false`）。
  - 降低 `historySize` 以縮短歷史視窗。
- 若要停用所有功能，包括壓縮後防護，請明確設定
  `tools.loopDetection.enabled: false`。

## 壓縮後防護

在內容溢位後進行壓縮重試之後，執行器會在接下來幾次工具呼叫上啟動
短視窗防護。如果代理在該視窗內發出相同的
`(toolName, argsHash, resultHash)` 三元組達 `postCompactionGuard.windowSize`
次，防護就會判定壓縮沒有打破
迴圈，並以 `compaction_loop_persisted` 錯誤中止執行。

此防護由主 `tools.loopDetection.enabled` 旗標控制，但有一個
差異：它會在旗標未設定或為 `true` 時保持**啟用**，並且只在
旗標明確為 `false` 時關閉。這是刻意設計的 - 此防護
用於脫離否則會耗盡無上限權杖的壓縮迴圈，
因此未設定組態的使用者仍會獲得保護。

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

- 較低的 `windowSize` 較嚴格（中止前的嘗試次數較少）。
- 較高的 `windowSize` 會給代理更多恢復嘗試。
- 防護永遠不會在結果正在變化時中止；只有整個視窗中
  位元組完全相同的結果才會觸發它。
- 它只會在壓縮重試後立即啟動，不會在執行中的其他
  時點啟動。

<Note>
  只要主旗標未明確設為 `false`，壓縮後防護就會執行，即使你從未撰寫 `tools.loopDetection` 區塊。若要驗證，請在壓縮事件後立即於閘道記錄中尋找 `post-compaction guard armed for N attempts`。
</Note>

## 記錄與預期行為

當偵測到迴圈時，OpenClaw 會記錄迴圈事件，並依嚴重程度警告或封鎖
下一個工具週期，在保留正常工具存取的同時，防止權杖
失控花費和鎖死。

- 警告會先出現。
- 當模式持續超過警告臨界值後，就會進行封鎖。
- 重大臨界值會封鎖下一個工具週期，並在執行記錄中呈現清楚的
  迴圈偵測原因。
- 壓縮後防護會發出 `compaction_loop_persisted` 錯誤，指出
  違規工具與相同呼叫計數。

## 相關

<CardGroup cols={2}>
  <Card title="Exec 核准" href="/zh-TW/tools/exec-approvals" icon="shield">
    Shell 執行的允許/拒絕政策。
  </Card>
  <Card title="思考層級" href="/zh-TW/tools/thinking" icon="brain">
    推理努力層級與提供者政策互動。
  </Card>
  <Card title="子代理" href="/zh-TW/tools/subagents" icon="users">
    產生隔離的代理以限制失控行為。
  </Card>
  <Card title="組態參考" href="/zh-TW/gateway/config-tools#toolsloopdetection" icon="gear">
    完整的 `tools.loopDetection` 架構與合併語意。
  </Card>
</CardGroup>
