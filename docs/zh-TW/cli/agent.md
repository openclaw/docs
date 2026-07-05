---
read_when:
    - 你想要從指令碼執行一次代理回合（可選擇傳送回覆）
summary: '`openclaw agent` 的命令列介面參考（透過閘道傳送一個代理回合）'
title: 代理
x-i18n:
    generated_at: "2026-07-05T11:08:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a0e1dcf7fb08e592cadf99380dcf700c82685a74d6fda2883ac2fdbb79267e
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

透過閘道執行一次代理回合。如果閘道請求失敗，會回退到內嵌代理；傳入 `--local` 可一開始就強制使用內嵌執行。

至少傳入一個工作階段選擇器：`--to`、`--session-key`、`--session-id` 或 `--agent`。

相關：[代理傳送工具](/zh-TW/tools/agent-send)

## 選項

- `-m, --message <text>`：訊息內文
- `--message-file <path>`：從 UTF-8 檔案讀取訊息內文
- `-t, --to <dest>`：用於衍生工作階段鍵的收件者
- `--session-key <key>`：用於路由的明確工作階段鍵
- `--session-id <id>`：明確的工作階段 ID
- `--agent <id>`：代理 ID；覆寫路由繫結
- `--model <id>`：此執行的模型覆寫（`provider/model` 或模型 ID）
- `--thinking <level>`：代理思考層級（`off`、`minimal`、`low`、`medium`、`high`，加上提供者支援的自訂層級，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：為工作階段保存詳細程度
- `--channel <channel>`：傳遞通道；省略時使用主要工作階段通道
- `--reply-to <target>`：傳遞目標覆寫
- `--reply-channel <channel>`：傳遞通道覆寫
- `--reply-account <id>`：傳遞帳戶覆寫
- `--local`：直接執行內嵌代理（在外掛登錄檔預載後）
- `--deliver`：將回覆傳送回所選通道/目標
- `--timeout <seconds>`：覆寫代理逾時（預設 600，或 `agents.defaults.timeoutSeconds`）；`0` 會停用逾時
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

- 只能傳入 `--message` 或 `--message-file` 其中一個。`--message-file` 會移除開頭的 UTF-8 BOM 並保留多行內容；若檔案不是有效的 UTF-8，則會拒絕。
- 斜線命令（例如 `/compact`）不能透過 `--message` 執行。命令列介面會拒絕它們，並指向對應的一級命令（壓縮使用 `openclaw sessions compact <key>`）。
- `--local` 與內嵌回退執行都是一次性：為該次執行開啟的 bundled MCP loopback 資源與暖身 Claude stdio 工作階段，會在回覆後退役，因此腳本呼叫不會留下正在執行的本機子行程。以閘道為後端的執行，則會將閘道擁有的 MCP loopback 資源保留在正在執行的閘道行程底下。
- `--channel`、`--reply-channel` 與 `--reply-account` 會影響回覆傳遞，而不是工作階段路由。
- `--session-key` 會選取明確的工作階段鍵。以代理為前綴的鍵必須使用 `agent:<agent-id>:<session-key>`，且同時提供 `--agent` 時，必須符合該鍵的代理 ID。裸露的非哨兵鍵在提供 `--agent` 時會限定於該代理，否則會限定於設定的預設代理；例如 `--agent ops --session-key incident-42` 會路由到 `agent:ops:incident-42`。字面鍵 `global` 與 `unknown` 只有在未提供 `--agent` 時才維持不限定範圍。
- `--json` 會保留 stdout 給 JSON 回應；閘道、外掛與內嵌回退診斷會送到 stderr，讓腳本可直接剖析 stdout。
- 內嵌回退 JSON 會包含 `meta.transport: "embedded"` 與 `meta.fallbackFrom: "gateway"`，讓腳本可偵測回退執行。
- 如果閘道接受執行，但命令列介面在等待最終回覆時逾時，內嵌回退會使用新的 `gateway-fallback-*` 工作階段/執行 ID，並回報 `meta.fallbackReason: "gateway_timeout"` 加上回退工作階段欄位，而不是與閘道擁有的逐字稿競爭或靜默取代原始工作階段。
- `SIGTERM`/`SIGINT` 會中斷正在等待、以閘道為後端的請求；如果閘道已接受該次執行，命令列介面也會在結束前為該執行 ID 傳送 `chat.abort`。`--local` 與內嵌回退執行會收到相同訊號，但不會傳送 `chat.abort`。如果內部執行去重鍵已經有此工作階段的作用中執行，回應會回報 `status: "in_flight"`，而非 JSON 命令列介面會列印 stderr 診斷，而不是空回覆。對外部排程/systemd 包裝器，請保留硬性終止後援，例如 `timeout -k 60 600 openclaw agent ...`，讓監督程式可在關閉無法排空時回收該行程。
- 當此命令觸發 `models.json` 重新產生時，由 SecretRef 管理的提供者憑證會保存為非秘密標記（例如環境變數名稱、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），絕不解析為秘密明文。標記寫入來自作用中的來源設定快照，而不是已解析的執行階段秘密值。

## JSON 傳遞狀態

使用 `--json --deliver` 時，命令列介面 JSON 回應會包含最上層 `deliveryStatus`，讓腳本可區分已傳遞、已抑制、部分成功與失敗的傳送：

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

以閘道為後端的命令列介面回應也會在 `result.deliveryStatus` 保留原始閘道結果形狀。

`deliveryStatus.status` 是下列其中之一：

| 狀態             | 意義                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `sent`           | 傳遞已完成。                                                                                                     |
| `suppressed`     | 傳遞被刻意不傳送（例如訊息傳送鉤子取消了它，或沒有可見結果）。終端狀態，不重試。                               |
| `partial_failed` | 後續酬載失敗前，至少已有一個酬載送出。                                                                           |
| `failed`         | 沒有完成任何持久傳送，或傳遞預檢失敗。                                                                           |

常見欄位：

- `requested`：物件存在時一律為 `true`。
- `attempted`：持久傳送路徑執行後為 `true`；預檢失敗或沒有可見酬載時為 `false`。
- `succeeded`：`true`、`false` 或 `"partial"`；`"partial"` 會搭配 `status: "partial_failed"`。
- `reason`：來自持久傳遞或預檢驗證的小寫蛇形命名原因。已知值包含 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 與 `no_delivery_target`；失敗的持久傳送也可能回報失敗階段。請將未知值視為不透明，因為此集合可能擴充。
- `resultCount`：可用時，通道傳送結果的數量。
- `sentBeforeError`：部分失敗在出錯前至少送出一個酬載時為 `true`。
- `error`：失敗或部分失敗的傳送為 `true`。
- `errorMessage`：只有在擷取到基礎傳遞錯誤訊息時才存在。預檢失敗會帶有 `error`/`reason`，但沒有 `errorMessage`。
- `payloadOutcomes`：選用的逐酬載結果，包含可用時的 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError` 或鉤子中繼資料。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [代理執行階段](/zh-TW/concepts/agent)
