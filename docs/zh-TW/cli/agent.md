---
read_when:
    - 你想要從指令碼執行一次代理程式回合（可選擇傳送回覆）
summary: '`openclaw agent` 的命令列介面參考（透過閘道傳送一個代理程式回合）'
title: 代理程式
x-i18n:
    generated_at: "2026-07-12T14:23:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

透過閘道執行一輪代理程式。如果閘道請求失敗，會改用內嵌代理程式；傳入 `--local` 可從一開始就強制使用內嵌執行。

至少傳入一個工作階段選擇器：`--to`、`--session-key`、`--session-id` 或 `--agent`。

相關內容：[代理程式傳送工具](/zh-TW/tools/agent-send)

## 選項

- `-m, --message <text>`：訊息本文
- `--message-file <path>`：從 UTF-8 檔案讀取訊息本文
- `-t, --to <dest>`：用於衍生工作階段鍵的收件者
- `--session-key <key>`：用於路由的明確工作階段鍵
- `--session-id <id>`：明確的工作階段 ID
- `--agent <id>`：代理程式 ID；覆寫路由繫結
- `--model <id>`：覆寫此輪執行的模型（`provider/model` 或模型 ID）
- `--thinking <level>`：代理程式思考層級（`off`、`minimal`、`low`、`medium`、`high`，以及供應商支援的自訂層級，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：為工作階段保留詳細輸出層級
- `--channel <channel>`：傳遞頻道；省略時使用主要工作階段頻道
- `--reply-to <target>`：覆寫傳遞目標
- `--reply-channel <channel>`：覆寫傳遞頻道
- `--reply-account <id>`：覆寫傳遞帳號
- `--local`：直接執行內嵌代理程式（預先載入外掛登錄檔後）
- `--deliver`：將回覆傳回所選的頻道／目標
- `--timeout <seconds>`：覆寫代理程式逾時時間（預設為 600，或 `agents.defaults.timeoutSeconds`）；`0` 會停用逾時
- `--json`：輸出 JSON

## 範例

```bash
openclaw agent --to +15555550123 --message "狀態更新" --deliver
openclaw agent --agent ops --message "摘要日誌"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "摘要日誌"
openclaw agent --session-key agent:ops:incident-42 --message "摘要狀態"
openclaw agent --agent ops --session-key incident-42 --message "摘要狀態"
openclaw agent --session-id 1234 --message "摘要收件匣" --thinking medium
openclaw agent --to +15555550123 --message "追蹤日誌" --verbose on --json
openclaw agent --agent ops --message "產生報告" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "在本機執行" --local
```

## 注意事項

- `--message` 和 `--message-file` 必須且只能傳入其中一個。`--message-file` 會移除開頭的 UTF-8 BOM 並保留多行內容；若檔案不是有效的 UTF-8，則會拒絕該檔案。
- 斜線命令（例如 `/compact`）無法透過 `--message` 執行。命令列介面會拒絕這類命令，並改為引導你使用一級命令（壓縮請使用 `openclaw sessions compact <key>`）。
- `--local` 和內嵌後援執行都是單次性的：為該輪執行開啟的隨附 MCP 迴送資源與暖啟動 Claude stdio 工作階段，會在回覆後關閉，因此指令碼呼叫不會留下本機子程序持續執行。由閘道支援的執行則會將閘道擁有的 MCP 迴送資源保留在執行中的閘道程序下。
- 同時使用 `--agent`、`--channel` 和 `--to` 時，工作階段路由會依循頻道的標準收件者和 `session.dmScope`。具有穩定僅外送收件者身分的頻道，會使用供應商擁有且與代理程式主要工作階段隔離的工作階段。`--reply-channel` 和 `--reply-account` 只會影響傳遞。
- `--session-key` 會選取明確的工作階段鍵。帶有代理程式前綴的鍵必須使用 `agent:<agent-id>:<session-key>`；若同時指定 `--agent`，其值必須與鍵中的代理程式 ID 相符。未使用特殊值的裸鍵，在提供 `--agent` 時會歸屬於該代理程式，否則歸屬於已設定的預設代理程式；例如 `--agent ops --session-key incident-42` 會路由至 `agent:ops:incident-42`。字面鍵 `global` 和 `unknown` 只有在未提供 `--agent` 時才會維持無範圍狀態。
- `--json` 會保留 stdout 供 JSON 回應使用；閘道、外掛及內嵌後援的診斷資訊會輸出至 stderr，讓指令碼可以直接剖析 stdout。
- 內嵌後援 JSON 包含 `meta.transport: "embedded"` 和 `meta.fallbackFrom: "gateway"`，讓指令碼可以偵測後援執行。
- 如果閘道接受了執行，但命令列介面在等待最終回覆時逾時，內嵌後援會使用全新的 `gateway-fallback-*` 工作階段／執行 ID，並回報 `meta.fallbackReason: "gateway_timeout"` 及後援工作階段欄位，而不是與閘道擁有的對話記錄競爭或無聲地取代原始工作階段。
- `SIGTERM`／`SIGINT` 會中斷正在等待、由閘道支援的請求；若閘道已接受該輪執行，命令列介面也會在結束前針對該執行 ID 傳送 `chat.abort`。`--local` 和內嵌後援執行會收到相同訊號，但不會傳送 `chat.abort`。如果內部執行去重鍵在此工作階段已有進行中的執行，回應會回報 `status: "in_flight"`，而非 JSON 命令列介面會在 stderr 印出診斷資訊，而不是空白回覆。對於外部排程／systemd 包裝器，請保留硬式終止的後備措施，例如 `timeout -k 60 600 openclaw agent ...`，讓監督程序能在關閉作業無法排空時回收該程序。
- 當此命令觸發重新產生 `models.json` 時，由 SecretRef 管理的供應商認證資訊會以非機密標記保存（例如環境變數名稱、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），絕不會保存已解析的機密純文字。標記寫入內容來自作用中的來源設定快照，而非已解析的執行階段機密值。

## JSON 傳遞狀態

使用 `--json --deliver` 時，命令列介面的 JSON 回應會包含頂層 `deliveryStatus`，讓指令碼可以區分已傳遞、已抑制、部分失敗和失敗的傳送：

```json
{
  "payloads": [{ "text": "報告已就緒", "mediaUrl": null }],
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

由閘道支援的命令列介面回應，也會在 `result.deliveryStatus` 保留原始閘道結果的結構。

`deliveryStatus.status` 是下列值之一：

| 狀態             | 意義                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `sent`           | 傳遞已完成。                                                                                                       |
| `suppressed`     | 刻意未傳送（例如訊息傳送鉤子取消了傳送，或沒有可見結果）。這是終止狀態，不會重試。                                 |
| `partial_failed` | 在後續承載資料失敗前，至少已傳送一個承載資料。                                                                     |
| `failed`         | 沒有完成任何持久傳送，或傳遞預檢失敗。                                                                             |

常見欄位：

- `requested`：物件存在時一律為 `true`。
- `attempted`：持久傳送路徑執行後為 `true`；預檢失敗或沒有可見承載資料時為 `false`。
- `succeeded`：`true`、`false` 或 `"partial"`；`"partial"` 會與 `status: "partial_failed"` 搭配。
- `reason`：來自持久傳遞或預檢驗證的小寫蛇形命名原因。已知值包括 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 和 `no_delivery_target`；持久傳送失敗時也可能回報失敗階段。由於此集合可能擴充，請將未知值視為不透明值。
- `resultCount`：頻道傳送結果數量（若可取得）。
- `sentBeforeError`：部分失敗在發生錯誤前已傳送至少一個承載資料時為 `true`。
- `error`：傳送失敗或部分失敗時為 `true`。
- `errorMessage`：只有在擷取到底層傳遞錯誤訊息時才會出現。預檢失敗會包含 `error`／`reason`，但不包含 `errorMessage`。
- `payloadOutcomes`：選用的各承載資料結果，可能包含 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError`，或可用的鉤子中繼資料。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [代理程式執行階段](/zh-TW/concepts/agent)
