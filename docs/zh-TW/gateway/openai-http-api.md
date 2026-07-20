---
read_when:
    - 整合預期使用 OpenAI Chat Completions 的工具
summary: 從閘道公開與 OpenAI 相容的 `/v1/chat/completions` HTTP 端點
title: OpenAI 聊天補全
x-i18n:
    generated_at: "2026-07-20T00:48:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc5a1a56972bb9070da0f8f60d6efd673cc1d1d516b730c55bc9d171fc7a5b3
    source_path: gateway/openai-http-api.md
    workflow: 16
---

閘道可以提供小型、與 OpenAI 相容的 Chat Completions 介面。此介面**預設為停用**。

啟用後，會在與閘道相同的連接埠上提供下列所有端點（WS + HTTP 多工）：

| 方法 | 路徑                   |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

請求會以一般閘道代理程式執行的方式運作（與 `openclaw agent` 使用相同的程式碼路徑），因此路由、權限和設定會與你的閘道一致。

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

將 `enabled: false` 設定為停用（或省略此項）。

## 安全性邊界（重要）

請將此端點視為對閘道執行個體的**完整操作員存取權**：

- 此端點的有效閘道權杖／密碼等同於擁有者／操作員認證資訊，而非範圍受限的個別使用者權限。
- 請求會經由與受信任操作員動作相同的控制平面代理程式路徑執行，因此若目標代理程式的原則允許敏感工具，此端點便可使用這些工具。
- 僅限在迴路介面／tailnet／私人入口上使用。請勿將其公開至公用網際網路。

驗證矩陣：

| 驗證路徑                                                                                            | 行為                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`                            | 證明持有共用閘道密鑰。忽略任何 `x-openclaw-scopes` 標頭，並還原完整的預設操作員權限範圍集合：`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。將聊天回合視為擁有者傳送者的回合。 |
| 攜帶受信任身分的 HTTP（受信任 Proxy 驗證，或私人入口上的 `gateway.auth.mode="none"`） | 若有 `x-openclaw-scopes` 則予以採用；若無則退回預設操作員權限範圍集合。只有在呼叫端明確縮小權限範圍且省略 `operator.admin` 時，才會失去擁有者語意。若要使用 `x-openclaw-model` 等擁有者層級控制功能，必須具備 `operator.admin`。                        |

請參閱[操作員權限範圍](/zh-TW/gateway/operator-scopes)、[安全性](/zh-TW/gateway/security)及[遠端存取](/zh-TW/gateway/remote)。

## 驗證

使用閘道驗證設定（如需該模式的詳細資訊，請參閱[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)）：

| 模式                                | 驗證方式                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`。透過 `gateway.auth.token` 或 `OPENCLAW_GATEWAY_TOKEN` 設定。                                                                                              |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`。透過 `gateway.auth.password` 或 `OPENCLAW_GATEWAY_PASSWORD` 設定。                                                                                     |
| `gateway.auth.mode="trusted-proxy"` | 經由已設定的身分感知 Proxy 路由；該 Proxy 會注入必要的身分標頭。同一主機上的迴路 Proxy 必須明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。 |
| `gateway.auth.mode="none"`          | 不需要驗證標頭（僅限私人入口）。                                                                                                                                         |

注意事項：

- 在 `trusted-proxy` 閘道上略過 Proxy 的同一主機呼叫端，可以直接退回使用 `gateway.auth.password`／`OPENCLAW_GATEWAY_PASSWORD`。只要有任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 標頭證據，請求就會繼續使用受信任 Proxy 路徑。
- 若已設定 `gateway.auth.rateLimit`，且驗證嘗試失敗次數過多，端點會傳回 `429`，並附上 `Retry-After` 標頭。

## 適合使用此端點的情況

- 若你的整合只是同一閘道的另一個操作員／用戶端介面，請優先使用此端點，而非新增內建頻道。
- 對於直接連線至遠端閘道的原生行動用戶端，請優先使用 [WebChat](/zh-TW/web/webchat) 或搭配已配對裝置啟動程序／裝置權杖流程的[閘道通訊協定](/zh-TW/gateway/protocol)，如此裝置便不需要共用 HTTP 權杖／密碼。
- 整合具有自身使用者、聊天室、網路鉤子傳遞或輸出傳輸的外部訊息網路時，請改為建置頻道外掛。請參閱[建置外掛](/zh-TW/plugins/building-plugins)。

## 代理程式優先的模型合約

OpenClaw 將 OpenAI 的 `model` 欄位視為**代理程式目標**，而非原始供應商模型 ID。

| `model` 值                                | 路由至                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                   | 已設定的預設代理程式                                                                                                 |
| `openclaw/default`                           | 已設定的預設代理程式（穩定別名；即使實際的預設代理程式 ID 在不同環境間有所變動，也可安全地寫死） |
| `openclaw/<agentId>` 或 `openclaw:<agentId>` | 特定代理程式                                                                                                           |
| `agent:<agentId>`                            | 特定代理程式（相容性別名）                                                                                     |

選用請求標頭：

| 標頭                                          | 效果                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | 覆寫所選代理程式的後端模型。共用密鑰持有者呼叫端可直接使用此功能；攜帶身分的呼叫端（受信任 Proxy，或具有 `x-openclaw-scopes` 的私人免驗證入口）必須具備 `operator.admin`，否則為 `403 missing scope: operator.admin`。 |
| `x-openclaw-agent-id: <agentId>`                | 用於代理程式選擇的相容性覆寫。                                                                                                                                                                                                                                 |
| `x-openclaw-session-key: <sessionKey>`          | 明確的工作階段路由。若使用保留的內部命名空間（`subagent:`、`cron:`、`acp:`），將以 `400 invalid_request_error` 拒絕。                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | 設定合成入口頻道情境，供可感知頻道的提示／原則使用。                                                                                                                                                                                              |

`/v1/models` 會列出頂層代理程式目標（`openclaw`、`openclaw/default`、`openclaw/<agentId>`），而非後端供應商模型或子代理程式；子代理程式會維持為內部執行拓撲。若省略 `x-openclaw-model`，所選代理程式會使用其一般設定的模型執行。

`/v1/embeddings` 使用相同的代理程式目標 `model` ID。傳送 `x-openclaw-model`（來自共用密鑰呼叫端，或具備 `operator.admin` 的攜帶身分呼叫端）以選擇特定嵌入模型；否則請求會使用所選代理程式的一般嵌入設定。

## 工作階段行為

端點預設為**每個請求皆無狀態**（每次呼叫都會產生新的工作階段金鑰）。

若請求包含 OpenAI `user` 字串，閘道會據此衍生穩定的工作階段金鑰，讓重複呼叫可共用代理程式工作階段。對於自訂應用程式，每個對話討論串請重複使用相同的 `user` 值；除非你想讓多個對話／裝置共用同一個 OpenClaw 工作階段，否則請避免使用帳戶層級識別碼。只有在需要跨多個用戶端／討論串明確控制路由時，才使用 `x-openclaw-session-key`，並使用由應用程式擁有且避開上述保留命名空間的金鑰。

## 請求限制

此端點使用下列內建限制：每個請求本文 20 MB、最新使用者訊息中 8 個 `image_url`
部分，以及累計 20 MB 的已解碼圖片
資料。圖片來源原則仍可在
`gateway.http.endpoints.chatCompletions.images` 下設定：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
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

圖片設定預設值如下：

| 金鑰                   | 預設值                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `images.allowUrl`     | `false`（除非啟用，否則會拒絕來源為 URL 的 `image_url` 部分） |
| `images.maxBytes`     | 每張圖片 10MB                                                      |
| `images.maxRedirects` | 3                                                                   |
| `images.timeoutMs`    | 10s                                                                 |

系統接受 HEIC/HEIF `image_url` 來源，並在傳送給供應商之前，透過共用的 OpenClaw 圖片處理器（Rastermill）將其正規化為 JPEG；對於需要外部編解碼器支援的格式，該處理器會退回使用系統轉換器（`sips`、ImageMagick、GraphicsMagick 或 ffmpeg）。

安全性注意事項：將主機名稱加入允許清單並不會略過私人／內部 IP 封鎖。對於暴露於網際網路的閘道，除了應用程式層級的防護措施外，也請套用網路輸出控制。請參閱[安全性](/zh-TW/gateway/security)。

## 聊天工具合約

`/v1/chat/completions` 支援與常見 OpenAI Chat 用戶端相容的函式工具子集。

### 支援的請求欄位

| 欄位                      | 備註                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | `{ "type": "function", "function": { ... } }` 的陣列                                                                                        |
| `tool_choice`              | `"auto"`、`"none"`、`"required"` 或 `{ "type": "function", "function": { "name": "..." } }`                                                  |
| `messages[*].role: "tool"` | 後續輪次                                                                                                                               |
| `messages[*].tool_call_id` | 將工具結果繫結回先前的工具呼叫                                                                                                 |
| `max_completion_tokens`    | 數字；每次呼叫的完成權杖總數上限（包括推理權杖）。目前的欄位名稱；當它與 `max_tokens` 同時傳送時使用。 |
| `max_tokens`               | 數字；舊版別名，當 `max_completion_tokens` 也存在時忽略。                                                                   |
| `temperature`              | 0-2 的數字；盡力而為，轉送至上游提供者。超出範圍時為 `400 invalid_request_error`。                                     |
| `top_p`                    | 0-1 的數字；盡力而為。超出範圍時為 `400 invalid_request_error`。                                                                         |
| `frequency_penalty`        | -2.0 至 2.0 的數字；盡力而為。超出範圍時為 `400 invalid_request_error`。                                                                 |
| `presence_penalty`         | -2.0 至 2.0 的數字；盡力而為。超出範圍時為 `400 invalid_request_error`。                                                                 |
| `seed`                     | 整數；盡力而為。非整數值為 `400 invalid_request_error`。                                                                     |
| `stop`                     | 字串或最多包含 4 個字串的陣列；盡力而為。超過 4 個序列或項目不是字串／為空時為 `400 invalid_request_error`。           |

所有取樣與權杖上限欄位都經由相同的代理程式串流參數通道傳送，並採盡力而為方式轉送：

- 權杖上限：傳輸欄位名稱由提供者傳輸層選擇：OpenAI 系列端點使用 `max_completion_tokens`，僅接受舊版名稱的提供者（Mistral、Chutes）使用 `max_tokens`。
- `stop` 會對應至傳輸層的停止欄位：Chat Completions 後端使用 `stop`，Anthropic 使用 `stop_sequences`。OpenAI Responses API 沒有停止參數，因此 `stop` 不會套用至由 Responses 支援的模型。
- 以 ChatGPT 為基礎的 Codex Responses 後端使用固定的伺服器端取樣，並在要求到達該後端之前移除 `temperature`/`top_p`（以及 `max_output_tokens`、`metadata`、`prompt_cache_retention`、`service_tier`）。

### 不支援的變體

下列情況會傳回 `400 invalid_request_error`：

- `tools` 不是陣列、工具項目不是函式，或缺少 `tool.function.name`
- `tool_choice` 變體，例如 `allowed_tools` 和 `custom`
- `tool_choice.function.name` 值與所提供的工具不符

對於 `tool_choice: "required"` 和固定函式的 `tool_choice`，端點會縮小對外提供的用戶端函式工具集、指示執行階段在回應前呼叫用戶端工具，並在代理程式回應中沒有相符的結構化用戶端工具呼叫時回報錯誤。這適用於呼叫端提供的 HTTP `tools` 清單，而非每個 OpenClaw 內部代理程式工具。

### 非串流工具回應格式

當代理程式呼叫工具時，回應會使用：

- `choices[0].finish_reason = "tool_calls"`
- 包含 `id`、`type: "function"`、`function.name`、`function.arguments`（JSON 字串）的 `choices[0].message.tool_calls[]` 項目
- 工具呼叫前的助理解說，位於 `choices[0].message.content` 中（可能為空）

### 串流工具回應格式

當 `stream: true` 時，工具呼叫會以遞增的 SSE 區塊抵達：首先是助理角色差異內容，接著是可選的助理解說差異內容、一或多個攜帶工具識別資訊與引數片段的 `delta.tool_calls` 區塊，最後是包含 `finish_reason: "tool_calls"` 和 `data: [DONE]` 的區塊。

如果 `stream_options.include_usage=true`，則會在 `[DONE]` 之前送出最後一個用量區塊。

### 工具後續迴圈

收到 `tool_calls` 後，執行要求的函式，並傳送後續要求，其中包含先前的助理工具呼叫訊息，以及一或多個具有相符 `tool_call_id` 的 `role: "tool"` 訊息。這會繼續相同的代理程式推理迴圈，以產生最終答案。

## 串流（SSE）

設定 `stream: true` 以接收伺服器傳送事件：

- `Content-Type: text/event-stream`
- 每個事件行皆為 `data: <json>`
- 串流以 `data: [DONE]` 結束

## Open WebUI 快速設定

- 基底 URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的基底 URL：`http://host.docker.internal:18789/v1`
- API 金鑰：你的閘道持有者權杖
- 模型：`openclaw/default`

預期行為：`GET /v1/models` 會列出 `openclaw/default`，而 Open WebUI 會將其用作聊天模型 ID。若要使用特定的後端提供者／模型，請設定代理程式的一般預設模型，或傳送 `x-openclaw-model`（共用密鑰呼叫端，或具有 `operator.admin` 的身分識別呼叫端）。

快速冒煙測試：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果傳回 `openclaw/default`，大多數 Open WebUI 設定都可使用相同的基底 URL 和權杖連線。

## 範例

單一應用程式對話的穩定工作階段：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"彙整我今天的工作"}]
  }'
```

在該對話後續呼叫中重複使用相同的 `user` 值，以繼續同一個代理程式工作階段。

非串流：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"你好"}]
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
    "messages": [{"role":"user","content":"你好"}]
  }'
```

列出模型：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

擷取單一模型：

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

`/v1/embeddings` 支援字串或字串陣列形式的 `input`。

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference)
- [操作者範圍](/zh-TW/gateway/operator-scopes)
- [OpenAI](/zh-TW/providers/openai)
