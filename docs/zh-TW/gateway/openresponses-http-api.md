---
read_when:
    - 整合使用 OpenResponses API 的用戶端
    - 您想要以項目為基礎的輸入、用戶端工具呼叫或 SSE 事件
summary: 從閘道公開與 OpenResponses 相容的 /v1/responses HTTP 端點
title: OpenResponses API
x-i18n:
    generated_at: "2026-06-27T19:19:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw 的閘道可以提供相容於 OpenResponses 的 `POST /v1/responses` 端點。

此端點**預設停用**。請先在設定中啟用它。

- `POST /v1/responses`
- 與閘道相同的連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/v1/responses`

在底層，請求會以一般閘道代理執行的形式執行（與
`openclaw agent` 相同的程式碼路徑），因此路由／權限／設定會與你的閘道一致。

## 驗證、安全性與路由

操作行為與 [OpenAI Chat Completions](/zh-TW/gateway/openai-http-api) 相同：

- 使用相符的閘道 HTTP 驗證路徑：
  - 共享密鑰驗證（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
  - 受信任代理驗證（`gateway.auth.mode="trusted-proxy"`）：來自已設定受信任代理來源的身分感知代理標頭；同主機回環代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`
  - 受信任代理本機直接後備：同主機呼叫端若沒有 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 標頭，可使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  - 私有入口開放驗證（`gateway.auth.mode="none"`）：沒有驗證標頭
- 將此端點視為對閘道執行個體的完整操作員存取
- 對於共享密鑰驗證模式（`token` 和 `password`），忽略較窄的 bearer 宣告 `x-openclaw-scopes` 值，並恢復一般完整操作員預設值
- 對於帶有受信任身分的 HTTP 模式（例如受信任代理驗證或 `gateway.auth.mode="none"`），若存在 `x-openclaw-scopes` 則遵循其值，否則回退到一般操作員預設範圍集
- 使用 `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"` 或 `x-openclaw-agent-id` 選取代理
- 當你想覆寫所選代理的後端模型時，使用 `x-openclaw-model`
- 使用 `x-openclaw-session-key` 進行明確的工作階段路由
- 當你想使用非預設的合成入口通道脈絡時，使用 `x-openclaw-message-channel`

驗證矩陣：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 證明持有共享閘道操作員密鑰
  - 忽略較窄的 `x-openclaw-scopes`
  - 恢復完整預設操作員範圍集：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 將此端點上的聊天回合視為擁有者傳送者回合
- 帶有受信任身分的 HTTP 模式（例如受信任代理驗證，或私有入口上的 `gateway.auth.mode="none"`）
  - 當標頭存在時遵循 `x-openclaw-scopes`
  - 當標頭不存在時回退到一般操作員預設範圍集
  - 只有在呼叫端明確縮小範圍並省略 `operator.admin` 時，才會失去擁有者語義

使用 `gateway.http.endpoints.responses.enabled` 啟用或停用此端點。

相同的相容性表面也包含：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

如需了解代理目標模型、`openclaw/default`、嵌入傳遞和後端模型覆寫如何搭配運作的權威說明，請參閱 [OpenAI Chat Completions](/zh-TW/gateway/openai-http-api#agent-first-model-contract) 和 [模型清單與代理路由](/zh-TW/gateway/openai-http-api#model-list-and-agent-routing)。

## 工作階段行為

預設情況下，此端點**每個請求都是無狀態**（每次呼叫都會產生新的工作階段金鑰）。

如果請求包含 OpenResponses `user` 字串，閘道會從中衍生穩定的工作階段金鑰，
因此重複呼叫可以共享代理工作階段。

## 請求形狀（支援）

請求遵循採用項目式輸入的 OpenResponses API。目前支援：

- `input`：字串或項目物件陣列。
- `instructions`：合併到系統提示。
- `tools`：用戶端工具定義（函式工具）。
- `tool_choice`：`"auto"`、`"none"`、`"required"`，或 `{ "type": "function", "name": "..." }`，用於篩選或要求用戶端工具。
- `stream`：啟用 SSE 串流。
- `max_output_tokens`：盡力而為的輸出限制（取決於提供者）。
- `temperature`：轉送給提供者的盡力而為取樣溫度。ChatGPT 型 Codex Responses 後端會忽略它，因為該後端使用固定的伺服器端取樣。
- `top_p`：轉送給提供者的盡力而為核心取樣。與 `temperature` 有相同的 Codex Responses 注意事項。
- `user`：穩定的工作階段路由。

接受但**目前忽略**：

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

支援：

- `previous_response_id`：當請求維持在同一代理／使用者／請求的工作階段範圍內時，OpenClaw 會重用先前回應的工作階段。

## 項目（輸入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 會附加到系統提示。
- 最近的 `user` 或 `function_call_output` 項目會成為「目前訊息」。
- 較早的使用者／助理訊息會作為脈絡歷史納入。

### `function_call_output`（回合式工具）

將工具結果傳回模型：

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 和 `item_reference`

為結構描述相容性而接受，但建立提示時會忽略。

## 工具（用戶端函式工具）

使用 `tools: [{ type: "function", name, description?, parameters? }]` 提供工具。

如果代理決定呼叫工具，回應會傳回 `function_call` 輸出項目。
接著你會傳送包含 `function_call_output` 的後續請求以繼續該回合。

對於 `tool_choice: "required"` 和釘選函式的 `tool_choice`，端點會縮小公開的用戶端函式工具集，指示執行階段在回應前呼叫用戶端工具，並在回合不包含相符的結構化用戶端工具呼叫時拒絕該回合。此合約適用於呼叫端提供的 HTTP `tools` 清單，而非每個內部 OpenClaw 代理工具。非串流請求會傳回帶有 `api_error` 的 `502`；串流請求會發出 `response.failed` 事件。這與 `/v1/chat/completions` 合約相符。

## 影像（`input_image`）

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

- 檔案內容會解碼並加入**系統提示**，而不是使用者訊息，
  因此它會保持暫時性（不會持久化到工作階段歷史）。
- 解碼後的檔案文字會在加入前包裝為**不受信任的外部內容**，
  因此檔案位元組會被視為資料，而不是受信任的指令。
- 注入的區塊使用明確的邊界標記，例如
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`，並包含
  `Source: External` 中繼資料行。
- 此檔案輸入路徑刻意省略較長的 `SECURITY NOTICE:` 橫幅，以
  保留提示預算；邊界標記與中繼資料仍會保留。
- PDF 會先解析文字。如果找到的文字很少，前幾頁會
  光柵化為影像並傳給模型，且注入的檔案區塊會使用
  佔位符 `[PDF content rendered to images]`。

PDF 解析由隨附的 `document-extract` 外掛提供，該外掛使用
`clawpdf` 及其封裝的 PDFium WebAssembly 執行階段進行文字擷取與
頁面算繪。

URL 擷取預設值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每個請求中基於 URL 的 `input_file` + `input_image` 部分總數）
- 請求受到防護（DNS 解析、封鎖私有 IP、重新導向上限、逾時）。
- 每種輸入類型都支援選用的主機名稱允許清單（`files.urlAllowlist`、`images.urlAllowlist`）。
  - 精確主機：`"cdn.example.com"`
  - 萬用字元子網域：`"*.assets.example.com"`（不符合 apex）
  - 空白或省略的允許清單表示沒有主機名稱允許清單限制。
- 若要完全停用基於 URL 的擷取，請設定 `files.allowUrl: false` 和／或 `images.allowUrl: false`。

## 檔案 + 影像限制（設定）

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
- 當系統轉換器可用時，會接受 HEIC/HEIF `input_image` 來源，並在交付給提供者前標準化為 JPEG。支援的轉換器為 macOS `sips`、ImageMagick、GraphicsMagick 或 ffmpeg。

安全性注意事項：

- URL 允許清單會在擷取前以及重新導向跳轉時強制執行。
- 允許清單中的主機名稱不會繞過私有／內部 IP 封鎖。
- 對於暴露於網際網路的閘道，除了應用程式層級防護，也應套用網路出口控制。
  請參閱 [安全性](/zh-TW/gateway/security)。

## 串流（SSE）

設定 `stream: true` 以接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每個事件行為 `event: <type>` 和 `data: <json>`
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

## 使用情況

當底層提供者回報權杖計數時，會填入 `usage`。
OpenClaw 會在這些計數器到達下游狀態／工作階段表面之前，標準化常見的 OpenAI 風格別名，包括 `input_tokens` / `output_tokens`
和 `prompt_tokens` / `completion_tokens`。

## 錯誤

錯誤使用如下 JSON 物件：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常見情況：

- `401` 缺少／無效驗證
- `400` 無效請求主體
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

- [OpenAI 聊天補全](/zh-TW/gateway/openai-http-api)
- [OpenAI](/zh-TW/providers/openai)
