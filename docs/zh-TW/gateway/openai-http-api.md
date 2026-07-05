---
read_when:
    - 整合預期使用 OpenAI Chat Completions 的工具
summary: 從閘道公開相容 OpenAI 的 /v1/chat/completions HTTP 端點
title: OpenAI chat completions
x-i18n:
    generated_at: "2026-07-05T11:21:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

閘道可以提供一個小型 OpenAI 相容的聊天完成介面。它**預設為停用**。

啟用後，它會在與閘道相同的連接埠上提供以下所有項目（WS + HTTP 多工）：

| 方法 | 路徑                   |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

要求會以一般閘道代理程式執行的方式執行（與 `openclaw agent` 相同的程式碼路徑），因此路由、權限和設定會與你的閘道一致。

## 啟用端點

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

設定 `enabled: false`（或省略它）即可停用。

## 安全邊界（重要）

請將此端點視為對閘道執行個體具有**完整操作員存取權**：

- 此端點的有效閘道權杖/密碼等同於擁有者/操作員憑證，而不是狹窄的單一使用者範圍。
- 要求會通過與受信任操作員動作相同的控制平面代理程式路徑，因此如果目標代理程式的政策允許敏感工具，此端點也能使用它們。
- 只將它放在 loopback/tailnet/私人入口上。不要將它暴露到公用網際網路。

驗證矩陣：

| 驗證路徑                                                                                            | 行為                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`                            | 證明持有共用閘道祕密。忽略任何 `x-openclaw-scopes` 標頭，並還原完整的預設操作員範圍集合：`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。將聊天回合視為擁有者傳送者回合。 |
| 攜帶受信任身分的 HTTP（受信任代理驗證，或私人入口上的 `gateway.auth.mode="none"`） | 當存在 `x-openclaw-scopes` 時會遵循它；不存在時則退回預設操作員範圍集合。只有在呼叫者明確縮小範圍並省略 `operator.admin` 時，才會失去擁有者語意。對 `x-openclaw-model` 等擁有者層級控制需要 `operator.admin`。                        |

請參閱[操作員範圍](/zh-TW/gateway/operator-scopes)、[安全性](/zh-TW/gateway/security)和[遠端存取](/zh-TW/gateway/remote)。

## 驗證

使用閘道驗證設定（該模式的詳細資訊請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）：

| 模式                                | 如何驗證                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`。透過 `gateway.auth.token` 或 `OPENCLAW_GATEWAY_TOKEN` 設定。                                                                                              |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`。透過 `gateway.auth.password` 或 `OPENCLAW_GATEWAY_PASSWORD` 設定。                                                                                     |
| `gateway.auth.mode="trusted-proxy"` | 透過已設定且知道身分的代理進行路由；它會注入必要的身分標頭。同主機 loopback 代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。 |
| `gateway.auth.mode="none"`          | 不需要驗證標頭（僅限私人入口）。                                                                                                                                         |

注意事項：

- 在 `trusted-proxy` 閘道上略過代理的同主機呼叫者，可以直接退回使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 標頭證據都會讓要求改走受信任代理路徑。
- 如果已設定 `gateway.auth.rateLimit` 且驗證嘗試失敗次數過多，端點會傳回 `429`，並附上 `Retry-After` 標頭。

## 何時使用此端點

- 當你的整合只是同一個閘道的另一個操作員/用戶端介面時，請優先使用此端點，而不是新增內建通道。
- 對於直接連線到遠端閘道的原生行動用戶端，請優先使用 [WebChat](/zh-TW/web/webchat) 或搭配已配對裝置啟動/裝置權杖流程的[閘道協定](/zh-TW/gateway/protocol)，如此裝置就不需要共用 HTTP 權杖/密碼。
- 當整合具有自己使用者、房間、網路鉤子傳遞或外送傳輸的外部訊息網路時，請改為建置通道外掛。請參閱[建置外掛](/zh-TW/plugins/building-plugins)。

## 代理程式優先模型合約

OpenClaw 會將 OpenAI `model` 欄位視為**代理程式目標**，而不是原始提供者模型 ID。

| `model` 值                                | 路由到                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                   | 已設定的預設代理程式                                                                                                 |
| `openclaw/default`                           | 已設定的預設代理程式（穩定別名；即使實際預設代理程式 ID 在環境之間變更，也可以安全硬編碼） |
| `openclaw/<agentId>` 或 `openclaw:<agentId>` | 特定代理程式                                                                                                           |
| `agent:<agentId>`                            | 特定代理程式（相容性別名）                                                                                     |

選用要求標頭：

| 標頭                                          | 作用                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | 覆寫所選代理程式的後端模型。共用祕密 bearer 呼叫者可以直接使用此標頭；攜帶身分的呼叫者（受信任代理，或帶有 `x-openclaw-scopes` 的私人無驗證入口）需要 `operator.admin`，否則會得到 `403 missing scope: operator.admin`。 |
| `x-openclaw-agent-id: <agentId>`                | 代理程式選擇的相容性覆寫。                                                                                                                                                                                                                                 |
| `x-openclaw-session-key: <sessionKey>`          | 明確的工作階段路由。如果使用保留的內部命名空間（`subagent:`、`cron:`、`acp:`），會以 `400 invalid_request_error` 拒絕。                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | 為通道感知的提示/政策設定合成入口通道內容。                                                                                                                                                                                              |

`/v1/models` 會列出頂層代理程式目標（`openclaw`、`openclaw/default`、`openclaw/<agentId>`），而不是後端提供者模型，也不是子代理程式；子代理程式會保留為內部執行拓撲。如果省略 `x-openclaw-model`，所選代理程式會使用其一般設定的模型執行。

`/v1/embeddings` 使用相同的代理程式目標 `model` ID。傳送 `x-openclaw-model`（來自共用祕密呼叫者，或具備 `operator.admin` 的攜帶身分呼叫者）以選擇特定嵌入模型；否則要求會使用所選代理程式的一般嵌入設定。

## 工作階段行為

預設情況下，端點會**每個要求都無狀態**（每次呼叫都會產生新的工作階段金鑰）。

如果要求包含 OpenAI `user` 字串，閘道會從中衍生穩定的工作階段金鑰，讓重複呼叫可以共用代理程式工作階段。對於自訂應用程式，請在每個對話執行緒重用相同的 `user` 值；除非你希望多個對話/裝置共用同一個 OpenClaw 工作階段，否則請避免使用帳戶層級識別碼。只有在需要跨多個用戶端/執行緒進行明確路由控制時，才使用 `x-openclaw-session-key`，並使用應用程式擁有且避開上述保留命名空間的金鑰。

## 要求限制（設定）

預設值可在 `gateway.http.endpoints.chatCompletions` 下調整：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

省略時的預設值：

| 鍵                   | 預設值                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20MB                                                                        |
| `maxImageParts`       | 8（從最新使用者訊息讀取的 `image_url` 部分上限）                 |
| `maxTotalImageBytes`  | 20MB（單一要求中所有 `image_url` 部分的累計解碼位元組） |
| `images.allowUrl`     | `false`（除非啟用，否則會拒絕來自 URL 的 `image_url` 部分）         |
| `images.maxBytes`     | 每張圖片 10MB                                                              |
| `images.maxRedirects` | 3                                                                           |
| `images.timeoutMs`    | 10s                                                                         |

HEIC/HEIF `image_url` 來源會被接受，並在透過共用 OpenClaw 影像處理器（Rastermill）交付給提供者之前正規化為 JPEG；對於需要外部轉碼器支援的格式，該處理器會退回使用系統轉換器（`sips`、ImageMagick、GraphicsMagick 或 ffmpeg）。

安全注意事項：允許清單中的主機名稱不會繞過私人/內部 IP 封鎖。對於暴露在網際網路上的閘道，除了應用程式層級的防護之外，也請套用網路輸出控制。請參閱[安全性](/zh-TW/gateway/security)。

## 聊天工具合約

`/v1/chat/completions` 支援與常見 OpenAI Chat 用戶端相容的函式工具子集。

### 支援的請求欄位

| 欄位                       | 備註                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | `{ "type": "function", "function": { ... } }` 的陣列                                                                                         |
| `tool_choice`              | `"auto"`、`"none"`、`"required"`，或 `{ "type": "function", "function": { "name": "..." } }`                                                  |
| `messages[*].role: "tool"` | 後續回合                                                                                                                                     |
| `messages[*].tool_call_id` | 將工具結果繫結回先前的工具呼叫                                                                                                               |
| `max_completion_tokens`    | 數字；每次呼叫的完成權杖總數上限（包含推理權杖）。目前欄位名稱；當它與 `max_tokens` 同時送出時會使用此欄位。                                 |
| `max_tokens`               | 數字；舊版別名，當同時存在 `max_completion_tokens` 時會被忽略。                                                                              |
| `temperature`              | 數字 0-2；盡力處理，轉送至上游提供者。若超出範圍，回傳 `400 invalid_request_error`。                                                         |
| `top_p`                    | 數字 0-1；盡力處理。若超出範圍，回傳 `400 invalid_request_error`。                                                                           |
| `frequency_penalty`        | 數字 -2.0 到 2.0；盡力處理。若超出範圍，回傳 `400 invalid_request_error`。                                                                    |
| `presence_penalty`         | 數字 -2.0 到 2.0；盡力處理。若超出範圍，回傳 `400 invalid_request_error`。                                                                    |
| `seed`                     | 整數；盡力處理。非整數值會回傳 `400 invalid_request_error`。                                                                                 |
| `stop`                     | 字串或最多 4 個字串的陣列；盡力處理。超過 4 個序列或非字串/空白項目會回傳 `400 invalid_request_error`。                                      |

所有取樣與權杖上限欄位都走相同的 agent 串流參數通道，並盡力轉送：

- 權杖上限：線路欄位名稱由提供者傳輸層選擇：OpenAI 家族端點使用 `max_completion_tokens`，只接受舊版名稱的提供者（Mistral、Chutes）使用 `max_tokens`。
- `stop` 對應至傳輸層的停止欄位：Chat Completions 後端使用 `stop`，Anthropic 使用 `stop_sequences`。OpenAI Responses API 沒有停止參數，因此 `stop` 不會套用在 Responses 後端模型上。
- 以 ChatGPT 為基礎的 Codex Responses 後端使用固定的伺服器端取樣，並會在請求抵達該後端之前移除 `temperature`/`top_p`（連同 `max_output_tokens`、`metadata`、`prompt_cache_retention`、`service_tier`）。

### 不支援的變體

以下情況會回傳 `400 invalid_request_error`：

- 非陣列的 `tools`、非函式工具項目，或缺少 `tool.function.name`
- `tool_choice` 變體，例如 `allowed_tools` 和 `custom`
- 與所提供工具不相符的 `tool_choice.function.name` 值

對於 `tool_choice: "required"` 和釘選函式的 `tool_choice`，端點會縮小暴露給用戶端的函式工具集，指示執行階段在回應前呼叫用戶端工具，並在 agent 回應沒有相符的結構化用戶端工具呼叫時出錯。這適用於呼叫端提供的 HTTP `tools` 清單，而不是每個 OpenClaw 內部 agent 工具。

### 非串流工具回應形狀

當 agent 呼叫工具時，回應會使用：

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` 項目，包含 `id`、`type: "function"`、`function.name`、`function.arguments`（JSON 字串）
- 工具呼叫前的助理評註，位於 `choices[0].message.content`（可能為空）

### 串流工具回應形狀

當 `stream: true` 時，工具呼叫會以遞增的 SSE 區塊抵達：初始助理角色 delta、選用的助理評註 delta、一個或多個帶有工具識別與引數片段的 `delta.tool_calls` 區塊，接著是最終區塊，其中包含 `finish_reason: "tool_calls"` 和 `data: [DONE]`。

如果 `stream_options.include_usage=true`，會在 `[DONE]` 前發出尾隨的用量區塊。

### 工具後續迴圈

收到 `tool_calls` 後，執行要求的函式，並傳送後續請求，其中包含先前的助理工具呼叫訊息，以及一個或多個具有相符 `tool_call_id` 的 `role: "tool"` 訊息。這會延續相同的 agent 推理迴圈以產生最終答案。

## 串流 (SSE)

設定 `stream: true` 以接收 Server-Sent Events：

- `Content-Type: text/event-stream`
- 每個事件行都是 `data: <json>`
- 串流以 `data: [DONE]` 結束

## Open WebUI 快速設定

- 基底 URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的基底 URL：`http://host.docker.internal:18789/v1`
- API 金鑰：你的閘道 bearer token
- 模型：`openclaw/default`

預期行為：`GET /v1/models` 會列出 `openclaw/default`，且 Open WebUI 會將其用作聊天模型 ID。若要使用特定後端提供者/模型，請設定 agent 的一般預設模型，或傳送 `x-openclaw-model`（共享密鑰呼叫端，或具備身分且擁有 `operator.admin` 的呼叫端）。

快速煙霧測試：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果回傳 `openclaw/default`，大多數 Open WebUI 設定都可以使用相同的基底 URL 和權杖連線。

## 範例

單一應用程式對話的穩定工作階段：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

在該對話的後續呼叫中重複使用相同的 `user` 值，以繼續相同的 agent 工作階段。

非串流：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

串流：

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

列出模型：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

擷取一個模型：

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

建立嵌入：

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

`/v1/embeddings` 支援將 `input` 作為字串或字串陣列。

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [操作者範圍](/zh-TW/gateway/operator-scopes)
- [OpenAI](/zh-TW/providers/openai)
