---
read_when:
    - 整合支援 OpenResponses API 的用戶端
    - 你想要項目式輸入、用戶端工具呼叫或 SSE 事件
summary: 從閘道公開 OpenResponses 相容的 /v1/responses HTTP 端點
title: OpenResponses API
x-i18n:
    generated_at: "2026-07-05T11:21:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

閘道可以提供與 OpenResponses 相容的 `POST /v1/responses` 端點。它**預設停用**，並與閘道共用同一個連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/v1/responses`。

請求會作為一般閘道代理執行來運行（與 `openclaw agent` 相同的程式碼路徑），因此路由、權限與設定會符合你的閘道。

使用 `gateway.http.endpoints.responses.enabled` 啟用或停用。啟用時，同一個相容性介面也會提供 `GET /v1/models`、`GET /v1/models/{id}`、`POST /v1/embeddings` 與 `POST /v1/chat/completions`。

## 驗證、安全性與路由

操作行為符合 [OpenAI Chat Completions](/zh-TW/gateway/openai-http-api)：

- 驗證路徑符合 `gateway.auth.mode`：shared-secret（`token`/`password`）使用 `Authorization: Bearer <token-or-password>`；trusted-proxy 使用具身分感知的 Proxy 標頭（同主機 loopback Proxy 需要 `gateway.auth.trustedProxy.allowLoopback = true`，且在沒有 `Forwarded`/`X-Forwarded-*`/`X-Real-IP` 標頭時，會透過 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 使用同主機直接後援）；私有入口上的 `none` 不需要驗證標頭。請參閱[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。
- 請將此端點視為對閘道執行個體的完整操作員存取權。
- Shared-secret 驗證模式會忽略範圍較窄、由 Bearer 宣告的 `x-openclaw-scopes`，並還原完整預設操作員範圍集合：`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。此端點上的聊天回合會被視為擁有者傳送者回合。
- 帶有受信任身分的 HTTP 模式（trusted-proxy，或 `gateway.auth.mode="none"`）會在存在 `x-openclaw-scopes` 時遵循它，否則會退回到操作員預設範圍集合。只有在呼叫端明確縮窄範圍且省略 `operator.admin` 時，才會失去擁有者語意。
- 使用 `model: "openclaw"`、`"openclaw/default"`、`"openclaw/<agentId>"`，或 `x-openclaw-agent-id` 標頭來選取代理。
- 使用 `x-openclaw-model` 覆寫所選代理的後端模型（在帶有身分的驗證路徑上需要 `operator.admin`）。
- 使用 `x-openclaw-session-key` 進行明確工作階段路由（若使用保留命名空間，會以 `400 invalid_request_error` 拒絕：`subagent:`、`cron:`、`acp:`）。
- 使用 `x-openclaw-message-channel` 作為非預設的合成入口通道情境。

如需代理目標模型、`openclaw/default`、嵌入向量透傳與後端模型覆寫的標準說明，請參閱 [OpenAI Chat Completions](/zh-TW/gateway/openai-http-api#agent-first-model-contract)。

請參閱[操作員範圍](/zh-TW/gateway/operator-scopes)與[安全性](/zh-TW/gateway/security)。

## 工作階段行為

預設情況下，此端點是**每個請求無狀態**（每次呼叫都會產生新的工作階段金鑰）。

如果請求包含 OpenResponses `user` 字串，閘道會從中衍生穩定的工作階段金鑰，讓重複呼叫可以共用代理工作階段。

當請求保持在相同的代理/使用者/請求工作階段範圍內時，`previous_response_id` 會重用先前回應的工作階段（依驗證主體、代理 ID 與 `x-openclaw-session-key` 比對）。

## 請求形狀

| 欄位                                                            | 支援                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | 字串或項目物件陣列。                                                                                               |
| `instructions`                                                   | 併入系統提示。                                                                                                 |
| `tools`                                                          | 用戶端工具定義（函式工具）。                                                                                      |
| `tool_choice`                                                    | `"auto"`、`"none"`、`"required"`，或 `{ "type": "function", "name": "..." }`，用來篩選或要求用戶端工具。                |
| `stream`                                                         | 啟用 SSE 串流。                                                                                                         |
| `max_output_tokens`                                              | 盡力而為的輸出限制（取決於提供者）。                                                                                 |
| `temperature`                                                    | 盡力而為的取樣溫度。會被以 ChatGPT 為基礎的 Codex Responses 後端忽略，該後端使用固定的伺服器端取樣。 |
| `top_p`                                                          | 盡力而為的 nucleus 取樣。與 `temperature` 有相同的 Codex Responses 注意事項。                                                    |
| `user`                                                           | 穩定工作階段路由。                                                                                                        |
| `previous_response_id`                                           | 工作階段連續性（見上方）。                                                                                                |
| `max_tool_calls`、`reasoning`、`metadata`、`store`、`truncation` | 會接受，但目前忽略。                                                                                                |

## 項目（輸入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 與 `developer` 會附加到系統提示。
- 最近的 `user` 或 `function_call_output` 項目會成為「目前訊息」。
- 較早的 user/assistant 訊息會作為脈絡歷史納入。

### `function_call_output`（以回合為基礎的工具）

將工具結果傳回模型：

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 與 `item_reference`

為結構描述相容性而接受，但在建構提示時忽略。

## 工具（用戶端函式工具）

使用 `tools: [{ type: "function", name, description?, parameters? }]` 提供工具。

如果代理呼叫工具，回應會傳回 `function_call` 輸出項目。傳送包含 `function_call_output` 的後續請求以繼續該回合。

對於 `tool_choice: "required"` 與釘選函式的 `tool_choice`，端點會縮窄公開的用戶端函式工具集合，指示執行階段在回應前呼叫用戶端工具，並在回合未包含相符的結構化用戶端工具呼叫時拒絕該回合，符合 `/v1/chat/completions` 合約。非串流請求會回傳帶有 `api_error` 的 `502`；串流請求會發出 `response.failed` 事件。

## 圖片（`input_image`）

支援 base64 或 URL 來源：

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

允許的 MIME 類型（預設）：`image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。大小上限（預設）：10MB。

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

允許的 MIME 類型（預設）：`text/plain`、`text/markdown`、`text/html`、`text/csv`、`application/json`、`application/pdf`。大小上限（預設）：5MB。

目前行為：

- 檔案內容會解碼並加入**系統提示**，而不是使用者訊息，因此會保持暫時性（不會保存在工作階段歷史中）。
- 解碼後的檔案文字在加入前會包裝為**不受信任的外部內容**，因此檔案位元組會被視為資料，而不是受信任的指示。注入的區塊使用明確邊界標記（`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`）與一行 `Source: External` 中繼資料。它刻意省略冗長的 `SECURITY NOTICE:` 橫幅以保留提示預算；邊界標記與中繼資料仍然適用。
- PDF 會先解析文字。如果找到的文字很少，前幾頁會被點陣化為圖片並傳給模型，注入的檔案區塊會使用預留位置 `[PDF content rendered to images]`。

PDF 解析由隨附的 `document-extract` 外掛提供，該外掛使用 `clawpdf` 及其封裝的 PDFium WebAssembly 執行階段來進行文字擷取與頁面算繪。

URL 擷取預設值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每個請求中 URL 型 `input_file` + `input_image` 部分的總數）
- 請求受到保護（DNS 解析、私有 IP 封鎖、重新導向上限、逾時）。
- 每種輸入類型都支援選用的主機名稱允許清單（`files.urlAllowlist`、`images.urlAllowlist`）：精確主機（`"cdn.example.com"`）或萬用字元子網域（`"*.assets.example.com"`，不符合根網域）。空白或省略的允許清單表示沒有主機名稱允許清單限制。
- 若要完全停用 URL 型擷取，請設定 `files.allowUrl: false` 和/或 `images.allowUrl: false`。

## 檔案 + 圖片限制（設定）

可在 `gateway.http.endpoints.responses` 下調整預設值：

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
            maxChars: 60000,
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

| 鍵                      | 預設值   |
| ------------------------ | --------- |
| `maxBodyBytes`           | 20MB      |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5MB       |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10s       |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4,000,000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10MB      |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10s       |

HEIC/HEIF `input_image` 來源在透過共享 OpenClaw 圖片處理器（Rastermill）交付給提供者前，會正規化為 JPEG；對於需要外部 codec 支援的格式，該處理器會退回使用系統轉換器（`sips`、ImageMagick、GraphicsMagick 或 ffmpeg）。

安全性注意事項：URL 允許清單會在擷取前以及重新導向跳轉時強制執行。將主機名稱加入允許清單不會繞過私有/內部 IP 封鎖。對於暴露在網際網路上的閘道，除了應用程式層級的保護外，也請套用網路出口控制。請參閱[安全性](/zh-TW/gateway/security)。

## 串流（SSE）

設定 `stream: true` 以接收 Server-Sent Events：

- `Content-Type: text/event-stream`
- 每個事件行都是 `event: <type>` 和 `data: <json>`
- 串流以 `data: [DONE]` 結束

目前發出的事件類型：`response.created`、`response.in_progress`、`response.output_item.added`、`response.content_part.added`、`response.output_text.delta`、`response.output_text.done`、`response.content_part.done`、`response.output_item.done`、`response.completed`、`response.failed`（發生錯誤時）。

## 用法

當底層供應商回報權杖計數時，會填入 `usage`。OpenClaw 會先正規化常見的 OpenAI 風格別名，再讓這些計數器到達下游狀態/工作階段介面，包括 `input_tokens` / `output_tokens` 和 `prompt_tokens` / `completion_tokens`。

## 錯誤

錯誤使用如下的 JSON 物件：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常見情況：`400` 無效的請求主體、`401` 缺少/無效的驗證、`403` 缺少操作員範圍、`405` 方法錯誤、`429` 驗證失敗嘗試次數過多（含 `Retry-After`）。

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
- [操作員範圍](/zh-TW/gateway/operator-scopes)
- [OpenAI](/zh-TW/providers/openai)
