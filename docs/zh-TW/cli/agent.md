---
read_when:
    - 您想要從 scripts 執行一個代理程式回合（可選擇傳遞回覆）
summary: CLI 參考：`openclaw agent`（透過 Gateway 傳送一個代理回合）
title: 代理程式
x-i18n:
    generated_at: "2026-05-10T19:27:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

透過 Gateway 執行一次 agent 回合（內嵌模式使用 `--local`）。
使用 `--agent <id>` 可直接指定已設定的 agent。

請至少傳入一個工作階段選擇器：

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

相關：

- Agent 傳送工具：[Agent 傳送](/zh-TW/tools/agent-send)

## 選項

- `-m, --message <text>`：必填的訊息內容
- `-t, --to <dest>`：用來推導工作階段金鑰的收件者
- `--session-id <id>`：明確的工作階段 id
- `--agent <id>`：agent id；會覆寫路由繫結
- `--model <id>`：此次執行的模型覆寫（`provider/model` 或模型 id）
- `--thinking <level>`：agent 思考等級（`off`、`minimal`、`low`、`medium`、`high`，以及供應商支援的自訂等級，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：保存此工作階段的詳細程度
- `--channel <channel>`：遞送通道；省略時使用主要工作階段通道
- `--reply-to <target>`：遞送目標覆寫
- `--reply-channel <channel>`：遞送通道覆寫
- `--reply-account <id>`：遞送帳戶覆寫
- `--local`：直接執行內嵌 agent（在 Plugin 登錄檔預載之後）
- `--deliver`：將回覆傳回所選通道/目標
- `--timeout <seconds>`：覆寫 agent 逾時時間（預設 600 或設定值）
- `--json`：輸出 JSON

## 範例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 備註

- 當 Gateway 請求失敗時，Gateway 模式會退回使用內嵌 agent。使用 `--local` 可一開始就強制採用內嵌執行。
- `--local` 仍會先預載 Plugin 登錄檔，因此由 plugin 提供的供應商、工具與通道在內嵌執行期間仍可使用。
- `--local` 與內嵌備援執行會被視為一次性執行。為該本機程序開啟的 bundled MCP loopback 資源與暖機 Claude stdio 工作階段，會在回覆後退役，因此腳本化呼叫不會讓本機子程序持續存活。
- Gateway 支援的執行會將 Gateway 擁有的 MCP loopback 資源留在執行中的 Gateway 程序下；較舊的用戶端可能仍會送出歷史清理旗標，但 Gateway 會將其接受為相容性 no-op。
- `--channel`、`--reply-channel` 與 `--reply-account` 會影響回覆遞送，而非工作階段路由。
- `--json` 會保留 stdout 專供 JSON 回應使用。Gateway、plugin 與內嵌備援診斷會路由到 stderr，讓腳本可以直接剖析 stdout。
- 內嵌備援 JSON 會包含 `meta.transport: "embedded"` 與 `meta.fallbackFrom: "gateway"`，讓腳本可區分備援執行與 Gateway 執行。
- 如果 Gateway 接受 agent 執行，但 CLI 在等待最終回覆時逾時，內嵌備援會使用全新的明確 `gateway-fallback-*` 工作階段/執行 id，並回報 `meta.fallbackReason: "gateway_timeout"` 加上備援工作階段欄位。這可避免與 Gateway 擁有的逐字稿鎖競爭，或靜默取代原始路由對話工作階段。
- 當此命令觸發 `models.json` 重新產生時，由 SecretRef 管理的供應商憑證會保存為非機密標記（例如 env var 名稱、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），而不是解析後的機密明文。
- 標記寫入以來源為權威：OpenClaw 會保存來自作用中來源設定快照的標記，而不是來自已解析執行階段機密值。

## JSON 遞送狀態

使用 `--json --deliver` 時，CLI JSON 回應可能包含頂層 `deliveryStatus`，讓腳本可以區分已遞送、已抑制、部分與失敗的傳送：

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

`deliveryStatus.status` 是 `sent`、`suppressed`、`partial_failed` 或 `failed` 之一。`suppressed` 表示遞送被有意不傳送，例如訊息傳送 hook 取消了它，或沒有可見結果；它仍是終止且不重試的結果。`partial_failed` 表示在後續 payload 失敗前，至少已傳送一個 payload。`failed` 表示沒有完成任何持久傳送，或遞送預檢失敗。

Gateway 支援的 CLI 回應也會保留原始 Gateway 結果形狀，其中同一物件可在 `result.deliveryStatus` 取得。

常見欄位：

- `requested`：物件存在時一律為 `true`。
- `attempted`：持久傳送路徑執行後為 `true`；預檢失敗或沒有可見 payload 時為 `false`。
- `succeeded`：`true`、`false` 或 `"partial"`；`"partial"` 會搭配 `status: "partial_failed"`。
- `reason`：來自持久遞送或預檢驗證的小寫 snake-case 原因。已知原因包括 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 與 `no_delivery_target`；失敗的持久傳送也可能回報失敗階段。請將未知值視為不透明，因為此集合可能擴充。
- `resultCount`：可用時的通道傳送結果數量。
- `sentBeforeError`：部分失敗在錯誤前已至少傳送一個 payload 時為 `true`。
- `error`：失敗或部分失敗傳送時為布林值 `true`。
- `errorMessage`：僅在擷取到底層遞送錯誤訊息時包含。預檢失敗會帶有 `error` 與 `reason`，但沒有 `errorMessage`。
- `payloadOutcomes`：選用的逐 payload 結果；可用時包含 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError` 或 hook 中繼資料。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Agent 執行階段](/zh-TW/concepts/agent)
