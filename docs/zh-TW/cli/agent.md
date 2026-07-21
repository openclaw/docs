---
read_when:
    - 你想要從指令碼執行一次代理程式回合（可選擇傳送回覆）
summary: '`openclaw agent` 的命令列介面參考（透過閘道傳送一個代理程式回合）'
title: 代理程式
x-i18n:
    generated_at: "2026-07-21T08:57:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1a4c139a3b235d6a56ba63063737b80f93448c2dbb7a92c6d0756fb19a9f95e4
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

透過閘道執行一次代理程式回合。明確的 `--local` 旗標是唯一的內嵌執行路徑。

至少傳入一個工作階段選擇器：`--to`、`--session-key`、`--session-id` 或 `--agent`。

相關內容：[代理程式傳送工具](/zh-TW/tools/agent-send)

## 選項

- `-m, --message <text>`：訊息本文
- `--message-file <path>`：從 UTF-8 檔案讀取訊息本文
- `-t, --to <dest>`：用於衍生工作階段金鑰的收件者
- `--session-key <key>`：用於路由的明確工作階段金鑰
- `--session-id <id>`：明確的工作階段 ID
- `--agent <id>`：代理程式 ID；覆寫路由繫結
- `--model <id>`：覆寫本次執行的模型（`provider/model` 或模型 ID）
- `--thinking <level>`：代理程式思考層級（`off`、`minimal`、`low`、`medium`、`high`，以及供應商支援的自訂層級，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：為工作階段保存詳細程度
- `--channel <channel>`：傳遞頻道；省略時使用主要工作階段頻道
- `--reply-to <target>`：覆寫傳遞目標
- `--reply-channel <channel>`：覆寫傳遞頻道
- `--reply-account <id>`：覆寫傳遞帳號
- `--local`：直接執行內嵌代理程式（預先載入外掛登錄檔後）
- `--deliver`：將回覆傳回選定的頻道／目標
- `--timeout <seconds>`：覆寫此命令的代理程式回合期限（預設為 600，或 `agents.defaults.timeoutSeconds`）；`0` 會停用整體期限。600 秒的備援值屬於此命令列介面命令，而非一般閘道回合；後者的預設值為 48 小時。
- `--json`：輸出 JSON

## 範例

```bash
openclaw agent --to +15555550123 --message "狀態更新" --deliver
openclaw agent --agent ops --message "摘要記錄"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "摘要記錄"
openclaw agent --session-key agent:ops:incident-42 --message "摘要狀態"
openclaw agent --agent ops --session-key incident-42 --message "摘要狀態"
openclaw agent --session-id 1234 --message "摘要收件匣" --thinking medium
openclaw agent --to +15555550123 --message "追蹤記錄" --verbose on --json
openclaw agent --agent ops --message "產生報告" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "在本機執行" --local
```

## 注意事項

- 請只傳入 `--message` 或 `--message-file` 其中一個。`--message-file` 會移除開頭的 UTF-8 BOM 並保留多行內容；若檔案不是有效的 UTF-8，則會拒絕。大於 4 MiB 的檔案會在分派前被拒絕。
- 斜線命令（例如 `/compact`）無法透過 `--message` 執行。命令列介面會拒絕它們，並改為指向對應的一級命令（壓縮使用 `openclaw sessions compact <key>`）。
- `--local` 執行是一次性的：為此次執行開啟的隨附 MCP 回送資源與暖機 Claude stdio 工作階段，會在回覆後停用，因此指令碼叫用不會留下仍在執行的本機子處理程序。由閘道支援的執行則會將閘道擁有的 MCP 回送資源保留在執行中的閘道處理程序下。
- 當重新啟動復原尚待處理時，使用 `--local` 的獨立內嵌執行會拒絕重複使用現有的主要工作階段。請透過運作正常的閘道執行該回合，或在該處使用 `/new` 或 `/reset` 重設；獨立的內嵌處理程序無法安全地與閘道掃描器協調該復原擁有者。
- 同時使用 `--agent`、`--channel` 和 `--to` 時，工作階段路由會遵循頻道的標準收件者和 `session.dmScope`。具有穩定僅限外送收件者身分的頻道，會使用供應商擁有且與代理程式主要工作階段隔離的工作階段。`--reply-channel` 和 `--reply-account` 僅影響傳遞。
- `--session-key` 會選取明確的工作階段金鑰。帶有代理程式前綴的金鑰必須使用 `agent:<agent-id>:<session-key>`，而同時提供兩者時，`--agent` 必須符合金鑰中的代理程式 ID。未帶前綴且非哨兵值的金鑰，在提供 `--agent` 時會限定於該代理程式，否則限定於已設定的預設代理程式；例如，`--agent ops --session-key incident-42` 會路由至 `agent:ops:incident-42`。只有在未提供 `--agent` 時，字面金鑰 `global` 和 `unknown` 才會維持不限定範圍。
- `--json` 會保留 stdout 供 JSON 回應使用；閘道、外掛和 `--local` 的診斷資訊會輸出至 stderr，讓指令碼可直接剖析 stdout。
- 暫時性握手重試次數用盡後，閘道逾時或連線關閉會導致命令失敗；命令列介面絕不會默默改以內嵌方式重新執行該回合。傳輸中斷的結果並不明確——閘道可能已接受且仍可能完成該回合——因此 stderr 提示會要求先檢查 `openclaw gateway status` 和工作階段逐字記錄，再重試或使用 `--local` 重新執行，以避免執行該回合兩次。
- `SIGTERM`/`SIGINT` 會中斷等待中的閘道支援要求；若閘道已接受該次執行，命令列介面還會在結束前，針對該執行 ID 傳送 `chat.abort`。`--local` 執行會收到相同訊號，但不會傳送 `chat.abort`。啟動器子處理程序若因第一次轉送的 `SIGINT` 或 `SIGTERM` 而終止，會分別以狀態碼 130 或 143 結束。若內部執行去重金鑰在此工作階段已有作用中的執行，回應會回報 `status: "in_flight"`，非 JSON 命令列介面則會印出 stderr 診斷資訊，而非空白回覆。對於外部排程／systemd 包裝器，請保留像 `timeout -k 60 600 openclaw agent ...` 這樣的強制終止後備措施，讓監督程式可在關機程序無法排空時回收該處理程序。
- 此命令觸發 `models.json` 重新產生時，由 SecretRef 管理的供應商認證資訊會以非機密標記保存（例如環境變數名稱、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），絕不會解析成機密純文字。標記寫入來源是作用中的來源設定快照，而非已解析的執行階段機密值。

## JSON 傳遞狀態

使用 `--json --deliver` 時，命令列介面 JSON 回應會包含頂層的 `deliveryStatus`，讓指令碼可區分已傳遞、已抑制、部分成功和失敗的傳送：

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

由閘道支援的命令列介面回應也會在 `result.deliveryStatus` 保留原始閘道結果結構。

`deliveryStatus.status` 是下列其中一個：

| 狀態           | 意義                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sent`           | 傳遞已完成。                                                                                                                        |
| `suppressed`     | 刻意不傳送（例如訊息傳送掛鉤取消了傳送，或沒有可見結果）。終止狀態，不重試。 |
| `partial_failed` | 後續承載內容失敗前，至少已傳送一個承載內容。                                                                                   |
| `failed`         | 沒有完成持久傳送，或傳遞預先檢查失敗。                                                                                   |

常見欄位：

- `requested`：物件存在時一律為 `true`。
- `attempted`：持久傳送路徑執行後為 `true`；預先檢查失敗或沒有可見承載內容時為 `false`。
- `succeeded`：`true`、`false` 或 `"partial"`；`"partial"` 會與 `status: "partial_failed"` 搭配。
- `reason`：來自持久傳遞或預先檢查驗證的小寫 snake_case 原因。已知值包括 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 和 `no_delivery_target`；失敗的持久傳送也可能回報失敗階段。由於此集合可能擴充，請將未知值視為不透明值。
- `resultCount`：頻道傳送結果數量（若可取得）。
- `sentBeforeError`：部分失敗在發生錯誤前至少已傳送一個承載內容時為 `true`。
- `error`：傳送失敗或部分失敗時為 `true`。
- `errorMessage`：僅在擷取到基礎傳遞錯誤訊息時存在。預先檢查失敗會帶有 `error`/`reason`，但沒有 `errorMessage`。
- `payloadOutcomes`：選用的各承載內容結果，可包含 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError`，或可用的掛鉤中繼資料。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [代理程式執行階段](/zh-TW/concepts/agent)
