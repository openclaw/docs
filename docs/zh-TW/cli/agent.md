---
read_when:
    - 你想要從指令碼執行一次代理程式回合（可選擇傳送回覆）
summary: '`openclaw agent` 的命令列介面參考（透過閘道傳送一輪代理程式對話）'
title: 代理程式
x-i18n:
    generated_at: "2026-07-11T21:13:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

透過閘道執行一次代理程式回合。如果閘道請求失敗，則回退至內嵌代理程式；傳入 `--local` 可從一開始就強制使用內嵌執行。

至少傳入一個工作階段選擇器：`--to`、`--session-key`、`--session-id` 或 `--agent`。

相關：[代理程式傳送工具](/zh-TW/tools/agent-send)

## 選項

- `-m, --message <text>`：訊息本文
- `--message-file <path>`：從 UTF-8 檔案讀取訊息本文
- `-t, --to <dest>`：用於衍生工作階段金鑰的收件者
- `--session-key <key>`：用於路由的明確工作階段金鑰
- `--session-id <id>`：明確的工作階段 ID
- `--agent <id>`：代理程式 ID；覆寫路由繫結
- `--model <id>`：覆寫本次執行使用的模型（`provider/model` 或模型 ID）
- `--thinking <level>`：代理程式思考層級（`off`、`minimal`、`low`、`medium`、`high`，以及供應商支援的自訂層級，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：持久化此工作階段的詳細輸出層級
- `--channel <channel>`：遞送頻道；省略時使用主要工作階段頻道
- `--reply-to <target>`：覆寫遞送目標
- `--reply-channel <channel>`：覆寫遞送頻道
- `--reply-account <id>`：覆寫遞送帳戶
- `--local`：直接執行內嵌代理程式（預先載入外掛登錄檔之後）
- `--deliver`：將回覆傳送至所選頻道／目標
- `--timeout <seconds>`：覆寫代理程式逾時時間（預設為 600，或使用 `agents.defaults.timeoutSeconds`）；`0` 會停用逾時
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

## 注意事項

- `--message` 和 `--message-file` 必須擇一傳入，且只能傳入其中一個。`--message-file` 會移除開頭的 UTF-8 BOM 並保留多行內容；不是有效 UTF-8 的檔案將被拒絕。
- 斜線命令（例如 `/compact`）無法透過 `--message` 執行。命令列介面會拒絕這些命令，並改為指向對應的一級命令（壓縮請使用 `openclaw sessions compact <key>`）。
- `--local` 和內嵌回退執行皆為一次性：為該次執行開啟的隨附 MCP loopback 資源與已預熱的 Claude stdio 工作階段，會在回覆後停用，因此指令碼呼叫不會留下仍在執行的本機子程序。由閘道支援的執行則會將閘道擁有的 MCP loopback 資源保留在執行中的閘道程序之下。
- 同時使用 `--agent`、`--channel` 和 `--to` 時，工作階段路由會依循頻道的標準收件者與 `session.dmScope`。具有穩定僅限輸出之收件者身分的頻道，會使用由供應商擁有、且與代理程式主要工作階段隔離的工作階段。`--reply-channel` 和 `--reply-account` 僅影響遞送。
- `--session-key` 會選取明確的工作階段金鑰。帶代理程式前綴的金鑰必須使用 `agent:<agent-id>:<session-key>`；若同時提供 `--agent`，其值必須符合金鑰中的代理程式 ID。未帶哨兵值的普通金鑰，在提供 `--agent` 時會限定於該代理程式，否則限定於已設定的預設代理程式；例如 `--agent ops --session-key incident-42` 會路由至 `agent:ops:incident-42`。字面金鑰 `global` 和 `unknown` 僅在未提供 `--agent` 時維持不限定範圍。
- `--json` 會保留 stdout 供 JSON 回應使用；閘道、外掛和內嵌回退診斷會輸出至 stderr，讓指令碼可直接解析 stdout。
- 內嵌回退 JSON 包含 `meta.transport: "embedded"` 和 `meta.fallbackFrom: "gateway"`，讓指令碼可以偵測回退執行。
- 如果閘道接受了執行，但命令列介面在等待最終回覆時逾時，內嵌回退會使用新的 `gateway-fallback-*` 工作階段／執行 ID，並回報 `meta.fallbackReason: "gateway_timeout"` 及回退工作階段欄位，而不會與閘道擁有的逐字記錄競爭或默默取代原始工作階段。
- `SIGTERM`／`SIGINT` 會中斷正在等待、由閘道支援的請求；若閘道已接受該次執行，命令列介面也會在結束前針對該執行 ID 傳送 `chat.abort`。`--local` 和內嵌回退執行會收到相同訊號，但不會傳送 `chat.abort`。如果內部執行去重金鑰在此工作階段已有進行中的執行，回應會回報 `status: "in_flight"`，且非 JSON 命令列介面會在 stderr 顯示診斷，而不是空白回覆。對於外部排程／systemd 包裝器，請保留硬性終止的後備措施，例如 `timeout -k 60 600 openclaw agent ...`，以便在關閉程序無法正常排空時，監督程式仍可回收該程序。
- 當此命令觸發重新產生 `models.json` 時，由 SecretRef 管理的供應商憑證會以非機密標記持久化（例如環境變數名稱、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），絕不會解析為機密明文。標記寫入來源是作用中的來源設定快照，而非已解析的執行階段機密值。

## JSON 遞送狀態

使用 `--json --deliver` 時，命令列介面的 JSON 回應會包含頂層 `deliveryStatus`，讓指令碼可以區分已遞送、已抑制、部分失敗與失敗的傳送：

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

由閘道支援的命令列介面回應也會在 `result.deliveryStatus` 保留原始閘道結果形狀。

`deliveryStatus.status` 為下列其中之一：

| 狀態             | 含義                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `sent`           | 遞送已完成。                                                                                                       |
| `suppressed`     | 刻意不傳送遞送內容（例如訊息傳送鉤子取消了遞送，或沒有可見結果）。此為終止狀態，不會重試。                         |
| `partial_failed` | 至少有一個承載內容成功傳送，但後續承載內容失敗。                                                                   |
| `failed`         | 沒有完成任何持久傳送，或遞送預檢失敗。                                                                             |

常見欄位：

- `requested`：物件存在時一律為 `true`。
- `attempted`：持久傳送路徑執行後為 `true`；預檢失敗或沒有可見承載內容時為 `false`。
- `succeeded`：可為 `true`、`false` 或 `"partial"`；`"partial"` 會與 `status: "partial_failed"` 搭配。
- `reason`：來自持久遞送或預檢驗證的小寫蛇形命名原因。已知值包括 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 和 `no_delivery_target`；持久傳送失敗也可能回報失敗階段。由於此集合可能擴充，請將未知值視為不透明值。
- `resultCount`：頻道傳送結果數量（若有）。
- `sentBeforeError`：部分失敗時，若在發生錯誤前已傳送至少一個承載內容，則為 `true`。
- `error`：傳送失敗或部分失敗時為 `true`。
- `errorMessage`：僅在擷取到底層遞送錯誤訊息時存在。預檢失敗會包含 `error`／`reason`，但不包含 `errorMessage`。
- `payloadOutcomes`：選用的逐承載內容結果；若有資料，可包含 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError` 或鉤子中繼資料。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [代理程式執行階段](/zh-TW/concepts/agent)
