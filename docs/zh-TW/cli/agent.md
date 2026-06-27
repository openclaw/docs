---
read_when:
    - 你想要從指令碼執行一次代理程式回合（可選擇傳送回覆）
summary: '`openclaw agent` 的命令列介面參考（透過閘道傳送一個代理程式回合）'
title: 代理
x-i18n:
    generated_at: "2026-06-27T19:03:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

透過閘道執行一次代理回合（使用 `--local` 進行嵌入式執行）。
使用 `--agent <id>` 直接指定已設定的代理。

至少傳入一個工作階段選擇器：

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

相關：

- 代理傳送工具：[代理傳送](/zh-TW/tools/agent-send)

## 選項

- `-m, --message <text>`：訊息本文
- `--message-file <path>`：從 UTF-8 檔案讀取訊息本文
- `-t, --to <dest>`：用來推導工作階段鍵的收件者
- `--session-key <key>`：用於路由的明確工作階段鍵
- `--session-id <id>`：明確工作階段 ID
- `--agent <id>`：代理 ID；覆寫路由繫結
- `--model <id>`：此執行的模型覆寫（`provider/model` 或模型 ID）
- `--thinking <level>`：代理思考層級（`off`、`minimal`、`low`、`medium`、`high`，以及供應商支援的自訂層級，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：為工作階段保留詳細層級
- `--channel <channel>`：傳遞頻道；省略時使用主要工作階段頻道
- `--reply-to <target>`：傳遞目標覆寫
- `--reply-channel <channel>`：傳遞頻道覆寫
- `--reply-account <id>`：傳遞帳號覆寫
- `--local`：直接執行嵌入式代理（在外掛登錄預載之後）
- `--deliver`：將回覆傳回所選頻道/目標
- `--timeout <seconds>`：覆寫代理逾時（預設 600 或設定值）
- `--json`：輸出 JSON

## 範例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 備註

- `--message` 或 `--message-file` 必須且只能傳入其中一個。`--message-file` 會在移除選用的 UTF-8 BOM 後保留多行檔案內容，並拒絕非有效 UTF-8 的檔案。
- 當閘道請求失敗時，閘道模式會退回嵌入式代理。使用 `--local` 可一開始就強制嵌入式執行。
- `--local` 仍會先預載外掛登錄，因此外掛提供的供應商、工具與頻道在嵌入式執行期間仍可使用。
- `--local` 與嵌入式後援執行會被視為一次性執行。為該本機行程開啟的 bundled MCP loopback 資源與 warmed Claude stdio 工作階段會在回覆後退役，因此腳本化呼叫不會讓本機子行程保持存活。
- 閘道支援的執行會將閘道擁有的 MCP loopback 資源保留在執行中的閘道行程下；較舊的用戶端仍可能傳送歷史清理旗標，但閘道會將其作為相容性無動作接受。
- `--channel`、`--reply-channel` 與 `--reply-account` 影響回覆傳遞，而非工作階段路由。
- `--session-key` 會選取明確的工作階段鍵。代理前綴鍵必須使用 `agent:<agent-id>:<session-key>`，且同時提供兩者時，`--agent` 必須符合該鍵的代理 ID。裸露的非哨兵鍵會在提供 `--agent` 時限定於 `--agent`，否則限定於已設定的預設代理；例如，`--agent ops --session-key incident-42` 會路由至 `agent:ops:incident-42`。只有在未提供 `--agent` 時，字面值 `global` 與 `unknown` 才會維持不限定範圍；在該情況下，嵌入式後援與儲存擁有權會使用已設定的預設代理。
- `--json` 會保留 stdout 專供 JSON 回應使用。閘道、外掛與嵌入式後援診斷會路由至 stderr，因此腳本可以直接剖析 stdout。
- 嵌入式後援 JSON 會包含 `meta.transport: "embedded"` 與 `meta.fallbackFrom: "gateway"`，因此腳本可將後援執行與閘道執行區分開來。
- 如果閘道接受代理執行，但命令列介面在等待最終回覆時逾時，嵌入式後援會使用全新的明確 `gateway-fallback-*` 工作階段/執行 ID，並回報 `meta.fallbackReason: "gateway_timeout"` 加上後援工作階段欄位。這可避免與閘道擁有的轉錄鎖競爭，或靜默取代原本路由的對話工作階段。
- 對於閘道支援的執行，`SIGTERM` 與 `SIGINT` 會中斷等待中的命令列介面請求。如果閘道已接受該執行，命令列介面也會在結束前針對該已接受的執行 ID 傳送 `chat.abort`。本機 `--local` 執行與嵌入式後援執行會收到相同的中止訊號，但不會傳送 `chat.abort`。如果重複的 `--run-id` 在原始代理執行仍在進行時到達閘道，重複回應會回報 `status: "in_flight"`，且非 JSON 命令列介面會列印 stderr 診斷，而不是空回覆。對於外部 cron/systemd 包裝器，請保留外層強制終止後備措施，例如 `timeout -k 60 600 openclaw agent ...`，讓監督程式在關機無法排空時仍可收割該行程。
- 當此命令觸發 `models.json` 重新產生時，由 SecretRef 管理的供應商憑證會以非機密標記持久化（例如 env var 名稱、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），而不是解析後的機密明文。
- 標記寫入以來源為權威：OpenClaw 會從作用中的來源設定快照持久化標記，而非從解析後的執行階段機密值。

## JSON 傳遞狀態

使用 `--json --deliver` 時，命令列介面 JSON 回應可能包含頂層 `deliveryStatus`，讓腳本可區分已傳遞、已抑制、部分與失敗的傳送：

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

`deliveryStatus.status` 是 `sent`、`suppressed`、`partial_failed` 或 `failed` 之一。`suppressed` 表示傳遞被刻意不送出，例如訊息傳送鉤子取消了它，或沒有可見結果；它仍是終止且不重試的結果。`partial_failed` 表示至少一個酬載已送出，之後的酬載失敗。`failed` 表示沒有完成任何持久傳送，或傳遞預檢失敗。

閘道支援的命令列介面回應也會保留原始閘道結果形狀，其中相同物件可在 `result.deliveryStatus` 取得。

常見欄位：

- `requested`：物件存在時一律為 `true`。
- `attempted`：持久傳送路徑執行後為 `true`；預檢失敗或沒有可見酬載時為 `false`。
- `succeeded`：`true`、`false` 或 `"partial"`；`"partial"` 會與 `status: "partial_failed"` 搭配。
- `reason`：來自持久傳遞或預檢驗證的小寫蛇形原因。已知原因包含 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 與 `no_delivery_target`；失敗的持久傳送也可能回報失敗階段。請將未知值視為不透明，因為集合可能擴充。
- `resultCount`：可用時為頻道傳送結果數量。
- `sentBeforeError`：部分失敗在錯誤前已送出至少一個酬載時為 `true`。
- `error`：失敗或部分失敗傳送時的布林值 `true`。
- `errorMessage`：僅在擷取到基礎傳遞錯誤訊息時包含。預檢失敗會帶有 `error` 與 `reason`，但沒有 `errorMessage`。
- `payloadOutcomes`：選用的每酬載結果，包含 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError`，或可用時的鉤子中繼資料。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [代理執行階段](/zh-TW/concepts/agent)
