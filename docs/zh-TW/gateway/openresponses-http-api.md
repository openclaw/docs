---
read_when:
    - 整合使用 OpenResponses API 的用戶端
    - 你需要以項目為基礎的輸入、用戶端工具呼叫，或 SSE 事件
summary: 從 Gateway 公開一個與 OpenResponses 相容的 /v1/responses HTTP 端點
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-30T03:08:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 可以提供與 OpenResponses 相容的 `POST /v1/responses` 端點。

此端點**預設為停用**。請先在設定中啟用。

- `POST /v1/responses`
- 與 Gateway 相同的連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/v1/responses`

在底層，請求會以一般 Gateway agent 執行來處理（與
`openclaw agent` 相同的程式碼路徑），因此路由/權限/設定會與你的 Gateway 相符。

## 驗證、安全性與路由

操作行為與 [OpenAI Chat Completions](/zh-TW/gateway/openai-http-api) 相符：

- 使用相符的 Gateway HTTP 驗證路徑：
  - shared-secret 驗證（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
  - trusted-proxy 驗證（`gateway.auth.mode="trusted-proxy"`）：來自已設定受信任代理來源的身分感知代理標頭；同主機 loopback 代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`
  - private-ingress open auth（`gateway.auth.mode="none"`）：無驗證標頭
- 將此端點視為 gateway 執行個體的完整 operator 存取權
- 對於 shared-secret 驗證模式（`token` 和 `password`），忽略較窄的 bearer 宣告 `x-openclaw-scopes` 值，並還原一般完整 operator 預設值
- 對於帶有受信任身分的 HTTP 模式（例如 trusted proxy auth 或 `gateway.auth.mode="none"`），若存在 `x-openclaw-scopes` 則遵循它，否則回退至一般 operator 預設 scope 集合
- 使用 `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"` 或 `x-openclaw-agent-id` 選取 agent
- 當你想覆寫所選 agent 的後端模型時，使用 `x-openclaw-model`
- 使用 `x-openclaw-session-key` 進行明確的工作階段路由
- 當你想要非預設的合成 ingress 頻道情境時，使用 `x-openclaw-message-channel`

驗證矩陣：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 證明持有共用的 gateway operator 密鑰
  - 忽略較窄的 `x-openclaw-scopes`
  - 還原完整的預設 operator scope 集合：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 將此端點上的聊天回合視為 owner-sender 回合
- 帶有受信任身分的 HTTP 模式（例如 trusted proxy auth，或私有 ingress 上的 `gateway.auth.mode="none"`）
  - 當標頭存在時遵循 `x-openclaw-scopes`
  - 當標頭不存在時回退至一般 operator 預設 scope 集合
  - 只有在呼叫者明確縮窄 scope 並省略 `operator.admin` 時，才會失去 owner 語意

使用 `gateway.http.endpoints.responses.enabled` 啟用或停用此端點。

相同的相容性介面也包含：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

如需了解 agent 目標模型、`openclaw/default`、embeddings pass-through，以及後端模型覆寫如何互相配合的權威說明，請參閱 [OpenAI Chat Completions](/zh-TW/gateway/openai-http-api#agent-first-model-contract) 與[模型清單與 agent 路由](/zh-TW/gateway/openai-http-api#model-list-and-agent-routing)。

## 工作階段行為

預設情況下，此端點是**每次請求無狀態**（每次呼叫都會產生新的工作階段金鑰）。

如果請求包含 OpenResponses `user` 字串，Gateway 會從中衍生穩定的工作階段金鑰，因此重複呼叫可以共用 agent 工作階段。

## 請求形狀（支援）

請求遵循 OpenResponses API，使用以項目為基礎的輸入。目前支援：

- `input`：字串或項目物件陣列。
- `instructions`：合併至系統提示。
- `tools`：用戶端工具定義（function tools）。
- `tool_choice`：篩選或要求用戶端工具。
- `stream`：啟用 SSE 串流。
- `max_output_tokens`：盡力而為的輸出限制（取決於 provider）。
- `user`：穩定的工作階段路由。

可接受但**目前會忽略**：

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

支援：

- `previous_response_id`：當請求維持在相同 agent/user/請求的工作階段範圍內時，OpenClaw 會重用先前的回應工作階段。

## 項目（輸入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 會附加到系統提示。
- 最新的 `user` 或 `function_call_output` 項目會成為「目前訊息」。
- 較早的 user/assistant 訊息會作為脈絡歷史包含在內。

### `function_call_output`（以回合為基礎的工具）

將工具結果傳回模型：

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 和 `item_reference`

為了 schema 相容性而接受，但在建構提示時會忽略。

## 工具（用戶端 function tools）

使用 `tools: [{ type: "function", function: { name, description?, parameters? } }]` 提供工具。

如果 agent 決定呼叫工具，回應會傳回 `function_call` 輸出項目。
接著你要傳送含有 `function_call_output` 的後續請求，以繼續該回合。

## 圖片（`input_image`）

支援 base64 或 URL 來源：

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

允許的 MIME 類型（目前）：`image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。
最大大小（目前）：10MB。

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

最大大小（目前）：5MB。

目前行為：

- 檔案內容會被解碼並加入**系統提示**，而不是使用者訊息，
  因此它會保持短暫存在（不會持久化到工作階段歷史中）。
- 解碼後的檔案文字會先包裝為**不受信任的外部內容**，再加入提示，
  因此檔案位元組會被視為資料，而不是受信任的指令。
- 注入區塊會使用明確的邊界標記，例如
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`，並包含
  `Source: External` 中繼資料行。
- 此檔案輸入路徑有意省略冗長的 `SECURITY NOTICE:` 橫幅，以保留提示預算；邊界標記和中繼資料仍會保留。
- PDF 會先解析文字。如果找到的文字很少，前幾頁會被光柵化為圖片並傳給模型，且注入的檔案區塊會使用
  `[PDF content rendered to images]` 佔位符。

PDF 解析由內建的 `document-extract` Plugin 提供，它使用適合 Node 的 `pdfjs-dist` legacy build（無 worker）。現代 PDF.js build 預期瀏覽器 worker/DOM 全域物件，因此 Gateway 不使用它。

URL 擷取預設值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每個請求中基於 URL 的 `input_file` + `input_image` 部分總數）
- 請求會受到防護（DNS 解析、私人 IP 封鎖、重新導向上限、逾時）。
- 每種輸入類型都支援選用的主機名稱允許清單（`files.urlAllowlist`、`images.urlAllowlist`）。
  - 精確主機：`"cdn.example.com"`
  - 萬用字元子網域：`"*.assets.example.com"`（不符合 apex）
  - 空白或省略的允許清單表示沒有主機名稱允許清單限制。
- 若要完全停用基於 URL 的擷取，請設定 `files.allowUrl: false` 和/或 `images.allowUrl: false`。

## 檔案 + 圖片限制（設定）

預設值可在 `gateway.http.endpoints.responses` 下調整：

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
- HEIC/HEIF `input_image` 來源會被接受，並在傳送給 provider 前正規化為 JPEG。

安全性注意事項：

- URL 允許清單會在擷取前與重新導向跳轉時強制執行。
- 將主機名稱加入允許清單並不會繞過私人/內部 IP 封鎖。
- 對於暴露在網際網路上的 gateway，除了應用程式層級防護外，也請套用網路輸出控制。
  請參閱[安全性](/zh-TW/gateway/security)。

## 串流（SSE）

設定 `stream: true` 以接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每一行事件為 `event: <type>` 與 `data: <json>`
- 串流以 `data: [DONE]` 結束

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
- `response.failed`（發生錯誤時）

## 使用量

當底層 provider 回報 token 數量時，會填入 `usage`。
OpenClaw 會在這些計數器到達下游狀態/工作階段介面前，正規化常見的 OpenAI 風格別名，包括 `input_tokens` / `output_tokens`
和 `prompt_tokens` / `completion_tokens`。

## 錯誤

錯誤使用如下 JSON 物件：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常見情況：

- `401` 遺漏/無效驗證
- `400` 無效請求本文
- `405` 方法錯誤

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
