---
read_when:
    - 使用者回報代理程式卡住並重複呼叫工具
    - 你需要控制重複呼叫保護機制
    - 你正在編輯代理工具／執行階段政策
    - 你在內容超出上限並重試後遇到 `compaction_loop_persisted` 中止錯誤
summary: 如何啟用可偵測重複工具呼叫迴圈的防護機制
title: 工具迴圈偵測
x-i18n:
    generated_at: "2026-07-20T01:01:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e03691eaa2148b2843003d8a6d04f21b6552a8d058b95df8cfa95938a3922c56
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 有兩道相互配合的防護機制，可防止重複的工具呼叫模式，
兩者皆在 `tools.loopDetection` 下設定：

1. **迴圈偵測**（`enabled`）— 預設停用。監看滾動式
   工具呼叫歷史記錄，以找出重複模式及對未知工具的重試。
2. **壓縮後防護機制** — 只要
   `enabled` 未明確設為 `false`，便會啟用。每次壓縮重試後會進入戒備狀態，且若代理程式在時間範圍內重複相同的 `(tool, args, result)` 三元組，
   就會中止執行。

將 `tools.loopDetection.enabled: false` 設為停用這兩道防護機制。

## 為何需要此機制

- 偵測毫無進展的重複序列。
- 偵測高頻率且無結果的迴圈（相同工具、相同輸入、重複
  錯誤）。
- 偵測已知輪詢工具的特定重複呼叫模式。
- 中斷「內容超出限制 -> 壓縮 -> 相同迴圈」的循環，而不是任由
  它們無限執行。

## 設定區塊

全域設定：

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // 滾動歷史記錄偵測器的主開關
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
| `enabled` | `false` | 滾動歷史記錄偵測器的主開關。`false` 也會停用壓縮後防護機制。 |

對於 `exec`，無進展雜湊會比較穩定的命令結果（狀態、
結束代碼、逾時旗標、輸出），並忽略持續時間、PID、工作階段 ID
及工作目錄等易變的執行階段中繼資料。傳出訊息的傳送結果在進行雜湊前，
會移除每次呼叫都會變動的 ID（訊息 ID、檔案 ID、時間戳記），因此某個「已傳送」結果
不會看似與另一個不同的「已傳送」結果完全相同。若有執行 ID，
則只會評估該次執行中的歷史記錄，因此排定的心跳偵測週期及全新執行，
不會繼承先前執行中過時的迴圈計數。

## 建議設定

- 對於較小的模型，請設定 `enabled: true`。旗艦模型很少需要滾動歷史記錄偵測，因此可以
  將主開關維持為 `false`，同時仍受益於
  壓縮後防護機制。
- 若要停用所有機制（包括壓縮後防護機制），請明確設定
  `tools.loopDetection.enabled: false`。

## 壓縮後防護機制

因內容超出限制而進行壓縮重試後，執行器會針對接下來幾次工具呼叫，
啟動一個短時間範圍的防護機制。若代理程式在該時間範圍內多次發出相同的
`(toolName, argsHash, resultHash)` 三元組，防護機制便會判定壓縮未能中斷
迴圈，並以 `compaction_loop_persisted` 錯誤中止執行。

此防護機制受主 `tools.loopDetection.enabled` 旗標控制，但有一項
特殊之處：當旗標未設定或為 `true` 時，它會保持**啟用**，只有在旗標
明確設為 `false` 時才會停用。這是刻意設計的行為 — 此防護機制
旨在跳出原本會無限制消耗權杖的壓縮迴圈，
因此未進行任何設定的使用者仍能獲得保護。

```json5
{
  tools: {
    loopDetection: {
      // 主開關；設為 false 會同時停用此防護機制與滾動偵測器
      enabled: true,
    },
  },
}
```

- 當結果仍在變化時，此防護機制絕不會中止執行；只有時間範圍內
  位元組完全相同的結果才會觸發。
- 它只會在壓縮重試後立即進入戒備狀態，不會在執行中的其他
  時點啟動。

<Note>
  只要主旗標未明確設為 `false`，壓縮後防護機制就會執行，即使你從未編寫 `tools.loopDetection` 區塊亦然。若要驗證，請在壓縮事件後立即查看閘道日誌中是否出現 `post-compaction guard armed for N attempts`。
</Note>

## 日誌與預期行為

偵測到迴圈時，OpenClaw 會記錄迴圈事件，並依嚴重程度對下一個
工具週期發出警告或加以封鎖，防止權杖支出失控及系統鎖死，
同時保留正常的工具存取權。

- 會先發出警告。
- 模式持續超過警告閾值後便會封鎖。
- 達到嚴重閾值時，會封鎖下一個工具週期，並在執行記錄中顯示明確的
  迴圈偵測原因。
- 壓縮後防護機制會發出 `compaction_loop_persisted` 錯誤，並列出
  造成問題的工具及相同呼叫次數。

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
