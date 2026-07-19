---
read_when:
    - 你想要從指令碼執行一個代理程式回合（可選擇傳送回覆）
summary: '`openclaw agent` 的命令列介面參考（透過閘道傳送一輪代理程式互動）'
title: 代理程式
x-i18n:
    generated_at: "2026-07-19T13:38:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c057e8e1209442007b99bc9e27019e2d9c1d08c55390f6b3c2223c7a7c13d7f5
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

透過閘道執行一次代理程式回合。若閘道要求失敗，則退回使用內嵌代理程式；傳入 `--local` 可從一開始就強制執行內嵌代理程式。

至少傳入一個工作階段選擇器：`--to`、`--session-key`、`--session-id` 或 `--agent`。

相關內容：[代理程式傳送工具](/zh-TW/tools/agent-send)

## 選項

- `-m, --message <text>`：訊息本文
- `--message-file <path>`：從 UTF-8 檔案讀取訊息本文
- `-t, --to <dest>`：用於衍生工作階段金鑰的收件者
- `--session-key <key>`：用於路由的明確工作階段金鑰
- `--session-id <id>`：明確的工作階段 ID
- `--agent <id>`：代理程式 ID；覆寫路由繫結
- `--model <id>`：覆寫此次執行的模型（`provider/model` 或模型 ID）
- `--thinking <level>`：代理程式思考層級（`off`、`minimal`、`low`、`medium`、`high`，以及供應商支援的自訂層級，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：為工作階段保存詳細程度
- `--channel <channel>`：傳遞頻道；省略時使用主要工作階段頻道
- `--reply-to <target>`：覆寫傳遞目標
- `--reply-channel <channel>`：覆寫傳遞頻道
- `--reply-account <id>`：覆寫傳遞帳號
- `--local`：直接執行內嵌代理程式（預先載入外掛登錄檔後）
- `--deliver`：將回覆傳回所選頻道／目標
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

- 請恰好傳入 `--message` 或 `--message-file` 其中之一。`--message-file` 會移除開頭的 UTF-8 BOM 並保留多行內容；非有效 UTF-8 的檔案會遭到拒絕。大於 4 MiB 的檔案會在分派前遭到拒絕。
- 斜線命令（例如 `/compact`）無法透過 `--message` 執行。命令列介面會拒絕這類命令，並改為引導你使用對應的一級命令（壓縮使用 `openclaw sessions compact <key>`）。
- `--local` 與內嵌備援執行都是一次性的：為此次執行開啟的內建 MCP 回送資源與暖啟動 Claude stdio 工作階段會在回覆後停用，因此指令碼呼叫不會留下正在執行的本機子處理程序。由閘道支援的執行則會將閘道擁有的 MCP 回送資源保留在執行中的閘道處理程序下。
- 當重新啟動復原仍在等待處理時，獨立的內嵌執行（`--local` 與傳輸備援）會拒絕重複使用現有的主要工作階段。請透過運作正常的閘道執行該回合，或在閘道中使用 `/new` 或 `/reset` 重設；獨立的內嵌處理程序無法安全地與閘道掃描器協調該復原擁有者。
- 同時使用 `--agent`、`--channel` 與 `--to` 時，工作階段路由會依循頻道的標準收件者與 `session.dmScope`。具有穩定僅輸出收件者身分的頻道，會使用與代理程式主要工作階段隔離、由供應商擁有的工作階段。`--reply-channel` 與 `--reply-account` 僅影響傳遞。
- `--session-key` 會選取明確的工作階段金鑰。含代理程式前綴的金鑰必須使用 `agent:<agent-id>:<session-key>`；若同時提供兩者，`--agent` 必須符合金鑰的代理程式 ID。若有提供 `--agent`，不含哨兵值的裸金鑰會限定至該代理程式，否則限定至已設定的預設代理程式；例如 `--agent ops --session-key incident-42` 會路由至 `agent:ops:incident-42`。只有在未提供 `--agent` 時，常值金鑰 `global` 與 `unknown` 才會維持無範圍限定。
- `--json` 會保留 stdout 供 JSON 回應使用；閘道、外掛與內嵌備援診斷資訊會輸出至 stderr，讓指令碼能直接剖析 stdout。
- 內嵌備援 JSON 包含 `meta.transport: "embedded"` 與 `meta.fallbackFrom: "gateway"`，讓指令碼可偵測備援執行。
- 若閘道已接受執行，但命令列介面在等待最終回覆時逾時，內嵌備援會使用新的 `gateway-fallback-*` 工作階段／執行 ID，並回報 `meta.fallbackReason: "gateway_timeout"` 及備援工作階段欄位，而不會與閘道擁有的逐字稿產生競爭，也不會無聲地取代原始工作階段。
- `SIGTERM`/`SIGINT` 會中斷等待中的閘道支援要求；若閘道已接受該執行，命令列介面也會在結束前針對該執行 ID 傳送 `chat.abort`。`--local` 與內嵌備援執行會收到相同訊號，但不會傳送 `chat.abort`。若內部執行去重金鑰在此工作階段已有進行中的執行，回應會回報 `status: "in_flight"`，且非 JSON 命令列介面會將診斷資訊印至 stderr，而非輸出空白回覆。對於外部 cron/systemd 包裝程式，請保留如 `timeout -k 60 600 openclaw agent ...` 的強制終止備援，讓監督程式能在關閉程序無法排空時回收該處理程序。
- 當此命令觸發重新產生 `models.json` 時，由 SecretRef 管理的供應商認證資訊會保存為非機密標記（例如環境變數名稱、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），絕不會保存已解析的機密明文。標記寫入內容來自作用中的來源設定快照，而非已解析的執行階段機密值。

## JSON 傳遞狀態

使用 `--json --deliver` 時，命令列介面的 JSON 回應會包含頂層 `deliveryStatus`，讓指令碼能區分已傳遞、已抑制、部分傳遞及傳送失敗：

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

由閘道支援的命令列介面回應也會在 `result.deliveryStatus` 保留原始閘道結果形狀。

`deliveryStatus.status` 為下列其中一項：

| 狀態           | 意義                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sent`           | 傳遞完成。                                                                                                                        |
| `suppressed`     | 已刻意不傳送（例如訊息傳送鉤子取消了傳遞，或沒有可見結果）。此為終止狀態，不會重試。 |
| `partial_failed` | 後續承載內容失敗前，至少已傳送一個承載內容。                                                                                   |
| `failed`         | 沒有完成任何持久傳送，或傳遞前置檢查失敗。                                                                                   |

常見欄位：

- `requested`：物件存在時一律為 `true`。
- `attempted`：持久傳送路徑執行後為 `true`；前置檢查失敗或沒有可見承載內容時為 `false`。
- `succeeded`：`true`、`false` 或 `"partial"`；`"partial"` 會與 `status: "partial_failed"` 搭配。
- `reason`：來自持久傳遞或前置驗證的全小寫蛇形命名原因。已知值包括 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 與 `no_delivery_target`；持久傳送失敗時也可能回報失敗階段。由於此集合可能擴充，請將未知值視為不透明值。
- `resultCount`：頻道傳送結果數量（若可取得）。
- `sentBeforeError`：部分失敗在發生錯誤前至少已傳送一個承載內容時為 `true`。
- `error`：傳送失敗或部分失敗時為 `true`。
- `errorMessage`：僅在擷取到底層傳遞錯誤訊息時存在。前置檢查失敗會帶有 `error`/`reason`，但不含 `errorMessage`。
- `payloadOutcomes`：選用的個別承載內容結果；若可取得，會包含 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError` 或鉤子中繼資料。

## 相關內容

- [命令列介面參考資料](/zh-TW/cli)
- [代理程式執行階段](/zh-TW/concepts/agent)
