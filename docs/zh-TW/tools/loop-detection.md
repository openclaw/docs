---
read_when:
    - 使用者回報代理程式卡住並重複呼叫工具
    - 你需要控制重複呼叫保護機制
    - 你正在編輯代理程式工具／執行階段政策
    - 在內容溢位重試後遇到 `compaction_loop_persisted` 次中止
summary: 如何啟用可偵測重複工具呼叫迴圈的防護機制
title: 工具迴圈偵測
x-i18n:
    generated_at: "2026-07-22T10:52:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 79b5aa1d85e02b8cf46a95b3bcebb255178b91456517cab804cce77b8f3b818e
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 有兩道相互配合的防護機制，用於防止重複的工具呼叫模式，
兩者皆在 `tools.loopDetection` 下設定：

1. **迴圈偵測**（`enabled`）- 預設停用。監看滾動式
   工具呼叫歷史記錄，以找出重複模式及對未知工具的重試。
2. **壓縮後防護** - 只要
   `enabled` 未明確設為 `false`，即會啟用。每次壓縮重試後都會進入防護狀態；若代理程式在時間窗內重複相同的 `(tool, args, result)` 三元組，
   便會中止該次執行。

將 `tools.loopDetection.enabled: false` 設定為停用這兩道防護機制。

## 為何需要此功能

- 偵測毫無進展的重複序列。
- 偵測高頻率且沒有結果的迴圈（相同工具、相同輸入、重複
  錯誤）。
- 偵測已知輪詢工具的特定重複呼叫模式。
- 中斷內容溢位 -> 壓縮 -> 相同迴圈的循環，而非任其
  無限執行。

## 設定區塊

全域設定：

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // 滾動歷史記錄偵測器的總開關
    },
  },
}
```

個別代理程式覆寫（選用，位於 `agents.entries.*.tools.loopDetection`）：

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
          },
        },
      },
    ],
  },
}
```

個別代理程式設定會覆寫全域設定。

### 欄位行為

| 欄位     | 預設值 | 效果                                                                                            |
| --------- | ------- | ------------------------------------------------------------------------------------------------- |
| `enabled` | `false` | 滾動歷史記錄偵測器的總開關。`false` 也會停用壓縮後防護。 |

對於 `exec`，無進展雜湊會比較穩定的命令結果（狀態、
結束代碼、逾時旗標、輸出），並忽略執行時間、PID、工作階段 ID
及工作目錄等易變動的執行階段中繼資料。外送訊息的傳送結果在雜湊前
會移除每次呼叫都會變動的 ID（訊息 ID、檔案 ID、時間戳記），因此一個「已傳送」結果不會看起來與另一個不同的「已傳送」
結果完全相同。當執行 ID 可用時，只會在該次執行內評估歷史記錄，
因此排程的心跳偵測週期與全新執行不會繼承先前執行中的過時迴圈計數。

## 建議設定

- 若使用較小的模型，請設定 `enabled: true`。旗艦模型通常不需要滾動歷史記錄偵測，並可
  讓總開關維持 `false`，同時仍受益於
  壓縮後防護。
- 若要停用所有功能，包括壓縮後防護，請明確設定
  `tools.loopDetection.enabled: false`。

## 壓縮後防護

內容溢位後進行壓縮重試時，執行器會針對接下來數次工具呼叫啟動
短時間窗防護。若代理程式在該時間窗內多次發出相同的
`(toolName, argsHash, resultHash)` 三元組，防護機制便會判定壓縮未能中斷
迴圈，並以 `compaction_loop_persisted` 錯誤中止執行。

此防護由總開關 `tools.loopDetection.enabled` 旗標控制，但有一項
特殊之處：當旗標未設定或為 `true` 時，防護會維持**啟用**；只有在旗標明確設為 `false` 時才會
停用。這是刻意的設計——此防護旨在跳脫原本會無限制消耗權杖的壓縮迴圈，
因此即使使用者未進行任何設定，仍可獲得這項保護。

```json5
{
  tools: {
    loopDetection: {
      // 總開關；設為 false 可連同滾動偵測器一起停用此防護
      enabled: true,
    },
  },
}
```

- 當結果持續變化時，防護絕不會中止執行；只有時間窗內
  位元組完全相同的結果才會觸發。
- 它只會在壓縮重試後立即啟動，不會在執行中的其他
  時點啟動。

<Note>
  只要總開關旗標未明確設為 `false`，壓縮後防護就會執行，即使你從未撰寫 `tools.loopDetection` 區塊亦然。若要驗證，請在壓縮事件發生後立即查看閘道記錄中的 `post-compaction guard armed for N attempts`。
</Note>

## 記錄與預期行為

偵測到迴圈時，OpenClaw 會記錄迴圈事件，並依嚴重程度警告或封鎖
下一個工具週期，在保留正常工具存取能力的同時，防止權杖消耗失控
及系統鎖死。

- 會先發出警告。
- 模式持續超過警告門檻後，便會進行封鎖。
- 達到重大門檻時會封鎖下一個工具週期，並在執行記錄中顯示明確的
  迴圈偵測原因。
- 壓縮後防護會發出 `compaction_loop_persisted` 錯誤，指出
  導致問題的工具及相同呼叫的次數。

## 相關內容

<CardGroup cols={2}>
  <Card title="執行核准" href="/zh-TW/tools/exec-approvals" icon="shield">
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
