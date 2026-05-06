---
read_when:
    - 整合支援 OpenResponses API 的用戶端
    - 你想要以項目為基礎的輸入、用戶端工具呼叫或 SSE 事件
summary: 從 Gateway 公開一個相容於 OpenResponses 的 /v1/responses HTTP 端點
title: OpenResponses API
x-i18n:
    generated_at: "2026-05-06T09:10:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 可以提供相容 OpenResponses 的 `POST /v1/responses` 端點。

此端點**預設停用**。請先在設定中啟用。

- `POST /v1/responses`
- 與 Gateway 相同的連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/v1/responses`

在底層，請求會以一般 Gateway agent 執行來處理（與
`openclaw agent` 相同的程式路徑），因此路由／權限／設定都會符合你的 Gateway。

## 驗證、安全性與路由

操作行為與 [OpenAI Chat Completions](/zh-TW/gateway/openai-http-api) 相同：

- 使用對應的 Gateway HTTP 驗證路徑：
  - shared-secret 驗證（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
  - trusted-proxy 驗證（`gateway.auth.mode="trusted-proxy"`）：來自已設定受信任 proxy 來源的身分感知 proxy 標頭；同主機 loopback proxy 需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`
  - private-ingress 開放驗證（`gateway.auth.mode="none"`）：不需要驗證標頭
- 將此端點視為對 gateway 執行個體的完整 operator 存取權
- 對於 shared-secret 驗證模式（`token` 和 `password`），忽略較窄的 bearer 宣告 `x-openclaw-scopes` 值，並還原一般完整 operator 預設值
- 對於帶有受信任身分的 HTTP 模式（例如 trusted proxy 驗證或 `gateway.auth.mode="none"`），當 `x-openclaw-scopes` 存在時遵從該值，否則回退到一般 operator 預設 scope 集合
- 使用 `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"` 或 `x-openclaw-agent-id` 選擇 agent
- 當你想覆寫所選 agent 的後端模型時，使用 `x-openclaw-model`
- 使用 `x-openclaw-session-key` 進行明確的 session 路由
- 當你想使用非預設的 synthetic ingress channel context 時，使用 `x-openclaw-message-channel`

驗證矩陣：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 證明持有 shared gateway operator secret
  - 忽略較窄的 `x-openclaw-scopes`
  - 還原完整預設 operator scope 集合：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 將此端點上的對話回合視為 owner-sender 回合
- 帶有受信任身分的 HTTP 模式（例如 trusted proxy 驗證，或 private ingress 上的 `gateway.auth.mode="none"`）
  - 當標頭存在時遵從 `x-openclaw-scopes`
  - 當標頭不存在時，回退到一般 operator 預設 scope 集合
  - 只有在呼叫者明確縮窄 scope 且省略 `operator.admin` 時，才會失去 owner 語意

使用 `gateway.http.endpoints.responses.enabled` 啟用或停用此端點。

相同的相容性介面也包含：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

若要了解 agent 目標模型、`openclaw/default`、embeddings 傳遞，以及後端模型覆寫如何搭配運作的權威說明，請參閱 [OpenAI Chat Completions](/zh-TW/gateway/openai-http-api#agent-first-model-contract) 和[模型清單與 agent 路由](/zh-TW/gateway/openai-http-api#model-list-and-agent-routing)。

## Session 行為

預設情況下，此端點**每個請求都是無狀態**（每次呼叫都會產生新的 session key）。

如果請求包含 OpenResponses `user` 字串，Gateway 會從中衍生穩定的 session key，
因此重複呼叫可以共用同一個 agent session。

## 請求形狀（支援）

請求遵循 OpenResponses API，並使用以項目為基礎的輸入。目前支援：

- `input`：字串或項目物件陣列。
- `instructions`：合併到 system prompt。
- `tools`：client tool 定義（function tools）。
- `tool_choice`：篩選或要求 client tools。
- `stream`：啟用 SSE 串流。
- `max_output_tokens`：盡力而為的輸出限制（依 provider 而定）。
- `user`：穩定 session 路由。

接受但**目前會忽略**：

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

支援：

- `previous_response_id`：當請求仍在相同 agent／user／requested-session 範圍內時，OpenClaw 會重用先前 response session。

## 項目（輸入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 會附加到 system prompt。
- 最新的 `user` 或 `function_call_output` 項目會成為「current message」。
- 較早的 user／assistant 訊息會作為 context 的 history 包含進來。

### `function_call_output`（以回合為基礎的 tools）

將 tool 結果傳回模型：

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 和 `item_reference`

為了 schema 相容性而接受，但在建立 prompt 時會忽略。

## Tools（client-side function tools）

使用 `tools: [{ type: "function", function: { name, description?, parameters? } }]` 提供 tools。

如果 agent 決定呼叫 tool，response 會回傳 `function_call` output item。
接著你可以傳送包含 `function_call_output` 的後續請求來繼續此回合。

## 圖片（`input_image`）

支援 base64 或 URL 來源：

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

允許的 MIME 類型（目前）：`image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。
大小上限（目前）：10MB。

## 檔案（`input_file`）

支援 base64 或 URL 來源：

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

允許的 MIME 類型（目前）：`text/plain`、`text/markdown`、`text/html`、`text/csv`、
`application/json`、`application/pdf`。

大小上限（目前）：5MB。

目前行為：

- 檔案內容會被解碼並加入**system prompt**，而不是 user message，
  因此會保持臨時性（不會持久化到 session history）。
- 解碼後的檔案文字會在加入前包裝為**不受信任的外部內容**，
  因此檔案位元組會被視為資料，而不是受信任的指令。
- 注入的區塊會使用明確的邊界標記，例如
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`，並包含
  `Source: External` metadata 行。
- 此檔案輸入路徑刻意省略較長的 `SECURITY NOTICE:` 橫幅，以
  保留 prompt 預算；邊界標記和 metadata 仍會保留。
- PDF 會先被解析為文字。如果找到的文字很少，前幾頁會被
  rasterized 成圖片並傳給模型，而注入的檔案區塊會使用
  `[PDF content rendered to images]` placeholder。

PDF 解析由內建的 `document-extract` plugin 提供，它使用
Node 友善的 `pdfjs-dist` legacy build（無 worker）。現代 PDF.js build
預期 browser workers／DOM globals，因此不會在 Gateway 中使用。

URL 擷取預設值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每個請求中 URL-based `input_file` + `input_image` parts 的總數）
- 請求會受到保護（DNS resolution、private IP blocking、redirect caps、timeouts）。
- 每種輸入類型都支援選用的 hostname allowlists（`files.urlAllowlist`、`images.urlAllowlist`）。
  - Exact host：`"cdn.example.com"`
  - Wildcard subdomains：`"*.assets.example.com"`（不符合 apex）
  - 空白或省略的 allowlists 表示沒有 hostname allowlist 限制。
- 若要完全停用 URL-based fetches，請設定 `files.allowUrl: false` 和／或 `images.allowUrl: false`。

## 檔案 + 圖片限制（設定）

預設值可以在 `gateway.http.endpoints.responses` 下調整：

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
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

- `maxBodyBytes`：20MB
- `maxUrlParts`：8
- `files.maxBytes`：5MB
- `files.maxChars`：200k
- `files.maxRedirects`：3
- `files.timeoutMs`：10s
- `files.pdf.maxPages`：4
- `files.pdf.maxPixels`：4,000,000
- `files.pdf.minTextChars`：200
- `images.maxBytes`：10MB
- `images.maxRedirects`：3
- `images.timeoutMs`：10s
- HEIC/HEIF `input_image` 來源會被接受，並在傳遞給 provider 前正規化為 JPEG。

安全性注意事項：

- URL allowlists 會在 fetch 前和 redirect hops 上強制執行。
- Allowlist 中的 hostname 不會繞過 private/internal IP blocking。
- 對於暴露在網際網路上的 gateways，除了應用程式層級的防護外，也請套用網路 egress controls。
  請參閱[安全性](/zh-TW/gateway/security)。

## 串流（SSE）

設定 `stream: true` 以接收伺服器傳送事件（SSE）：

- `Content-Type: text/event-stream`
- 每個事件行為 `event: <type>` 和 `data: <json>`
- Stream 以 `data: [DONE]` 結束

目前發出的事件類型：

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed`（錯誤時）

## 使用量

當底層 provider 回報 token counts 時，`usage` 會被填入。
OpenClaw 會在這些 counters 到達下游 status／session 介面前，先正規化常見的 OpenAI-style aliases，
包括 `input_tokens` / `output_tokens`
和 `prompt_tokens` / `completion_tokens`。

## 錯誤

錯誤會使用如下的 JSON 物件：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常見情況：

- `401` 缺少／無效的驗證
- `400` 無效的請求 body
- `405` 錯誤的方法

## 範例

非串流：

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

串流：

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## 相關

- [OpenAI chat completions](/zh-TW/gateway/openai-http-api)
- [OpenAI](/zh-TW/providers/openai)
