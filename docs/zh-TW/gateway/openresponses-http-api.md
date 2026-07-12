---
read_when:
    - 整合使用 OpenResponses API 通訊的用戶端
    - 你需要以項目為基礎的輸入、用戶端工具呼叫或 SSE 事件
summary: 從閘道公開與 OpenResponses 相容的 `/v1/responses` HTTP 端點
title: OpenResponses API
x-i18n:
    generated_at: "2026-07-11T21:22:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

閘道可以提供與 OpenResponses 相容的 `POST /v1/responses` 端點。此端點**預設停用**，並與閘道共用連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/v1/responses`。

請求會以一般的閘道代理程式執行方式運作（與 `openclaw agent` 使用相同的程式碼路徑），因此路由、權限與設定皆與你的閘道一致。

使用 `gateway.http.endpoints.responses.enabled` 啟用或停用。啟用後，同一相容介面也會提供 `GET /v1/models`、`GET /v1/models/{id}`、`POST /v1/embeddings` 與 `POST /v1/chat/completions`。

## 驗證、安全性與路由

運作行為與 [OpenAI Chat Completions](/zh-TW/gateway/openai-http-api) 一致：

- 驗證路徑與 `gateway.auth.mode` 一致：共用密鑰（`token`/`password`）使用 `Authorization: Bearer <token-or-password>`；受信任的 Proxy 使用具身分識別能力的 Proxy 標頭（同主機的 local loopback Proxy 需要設定 `gateway.auth.trustedProxy.allowLoopback = true`；若不存在 `Forwarded`/`X-Forwarded-*`/`X-Real-IP` 標頭，則可透過 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 進行同主機直接備援）；私人入口使用 `none` 時不需要驗證標頭。請參閱[受信任的 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。
- 請將此端點視為擁有該閘道執行個體的完整操作者存取權。
- 共用密鑰驗證模式會忽略 Bearer 宣告中較窄的 `x-openclaw-scopes`，並還原完整的預設操作者範圍集合：`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。此端點上的聊天輪次會視為擁有者傳送者的輪次。
- 帶有受信任身分的 HTTP 模式（受信任的 Proxy，或 `gateway.auth.mode="none"`）會在存在 `x-openclaw-scopes` 時採用其設定，否則回退至操作者預設範圍集合。只有在呼叫端明確縮小範圍並省略 `operator.admin` 時，才會失去擁有者語意。
- 使用 `model: "openclaw"`、`"openclaw/default"`、`"openclaw/<agentId>"` 或 `x-openclaw-agent-id` 標頭選取代理程式。
- 使用 `x-openclaw-model` 覆寫所選代理程式的後端模型（在帶有身分的驗證路徑上需要 `operator.admin`）。
- 使用 `x-openclaw-session-key` 進行明確的工作階段路由（若使用保留的命名空間 `subagent:`、`cron:`、`acp:`，將以 `400 invalid_request_error` 拒絕）。
- 使用 `x-openclaw-message-channel` 指定非預設的合成入口頻道情境。

如需代理程式目標模型、`openclaw/default`、嵌入直通與後端模型覆寫的標準說明，請參閱 [OpenAI Chat Completions](/zh-TW/gateway/openai-http-api#agent-first-model-contract)。

請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)與[安全性](/zh-TW/gateway/security)。

## 工作階段行為

此端點預設為**每個請求皆無狀態**（每次呼叫都會產生新的工作階段金鑰）。

如果請求包含 OpenResponses `user` 字串，閘道會從中衍生穩定的工作階段金鑰，讓重複呼叫可以共用代理程式工作階段。

當請求維持在相同的代理程式／使用者／所要求工作階段範圍內時（依驗證主體、代理程式 ID 與 `x-openclaw-session-key` 比對），`previous_response_id` 會重複使用先前回應的工作階段。

## 請求格式

| 欄位                                                             | 支援                                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | 字串或項目物件陣列。                                                                                                           |
| `instructions`                                                   | 合併至系統提示詞。                                                                                                             |
| `tools`                                                          | 用戶端工具定義（函式工具）。                                                                                                   |
| `tool_choice`                                                    | 使用 `"auto"`、`"none"`、`"required"` 或 `{ "type": "function", "name": "..." }` 篩選或要求用戶端工具。                         |
| `stream`                                                         | 啟用 SSE 串流。                                                                                                                 |
| `max_output_tokens`                                              | 盡力套用的輸出限制（取決於提供者）。                                                                                           |
| `temperature`                                                    | 盡力套用的取樣溫度。以 ChatGPT 為基礎的 Codex Responses 後端會忽略此值，因為它使用伺服器端固定取樣。                             |
| `top_p`                                                          | 盡力套用的核取樣。與 `temperature` 相同，Codex Responses 亦有上述限制。                                                        |
| `user`                                                           | 穩定的工作階段路由。                                                                                                           |
| `previous_response_id`                                           | 工作階段連續性（請參閱上文）。                                                                                                 |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | 接受這些欄位，但目前會忽略。                                                                                                   |

## 項目（輸入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 與 `developer` 會附加至系統提示詞。
- 最近的 `user` 或 `function_call_output` 項目會成為「目前訊息」。
- 較早的使用者／助理訊息會作為歷史記錄納入，以提供情境。

### `function_call_output`（以輪次為基礎的工具）

將工具結果傳回模型：

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 與 `item_reference`

為了結構描述相容性而接受，但建立提示詞時會忽略。

## 工具（用戶端函式工具）

使用 `tools: [{ type: "function", name, description?, parameters? }]` 提供工具。

如果代理程式呼叫工具，回應會傳回 `function_call` 輸出項目。傳送包含 `function_call_output` 的後續請求以繼續該輪次。

對於 `tool_choice: "required"` 與固定函式的 `tool_choice`，此端點會縮小公開的用戶端函式工具集合、指示執行階段在回應前呼叫用戶端工具，並在該輪次未包含相符的結構化用戶端工具呼叫時拒絕請求，與 `/v1/chat/completions` 合約一致。非串流請求會傳回含有 `api_error` 的 `502`；串流請求則會發出 `response.failed` 事件。

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

- 檔案內容會解碼並新增至**系統提示詞**，而非使用者訊息，因此只會暫時存在（不會保存在工作階段歷史記錄中）。
- 解碼後的檔案文字在新增前會包裝為**不受信任的外部內容**，因此檔案位元組會視為資料，而非受信任的指示。注入的區塊使用明確的邊界標記（`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`）與 `Source: External` 中繼資料行。為保留提示詞額度，它刻意省略冗長的 `SECURITY NOTICE:` 橫幅；邊界標記與中繼資料仍會套用。
- 會先剖析 PDF 以擷取文字。若找到的文字很少，則將前幾頁柵格化為圖片並傳遞給模型，而注入的檔案區塊會使用預留位置 `[PDF content rendered to images]`。

PDF 剖析由隨附的 `document-extract` 外掛提供；該外掛使用 `clawpdf` 及其封裝的 PDFium WebAssembly 執行階段進行文字擷取與頁面呈現。

URL 擷取預設值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每個請求中以 URL 為基礎的 `input_file` + `input_image` 部分總數）
- 請求受到防護（DNS 解析、封鎖私人 IP、重新導向次數上限、逾時）。
- 每種輸入類型皆支援選用的主機名稱允許清單（`files.urlAllowlist`、`images.urlAllowlist`）：完整主機名稱（`"cdn.example.com"`）或萬用字元子網域（`"*.assets.example.com"`，不符合頂層網域本身）。允許清單為空或省略時，表示不限制主機名稱。
- 若要完全停用以 URL 為基礎的擷取，請設定 `files.allowUrl: false` 及／或 `images.allowUrl: false`。

## 檔案與圖片限制（設定）

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

| 金鑰                     | 預設值    |
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

HEIC/HEIF `input_image` 來源在傳送給提供者之前，會透過共用的 OpenClaw 圖片處理器（Rastermill）正規化為 JPEG；對於需要外部轉碼器支援的格式，該處理器會回退至系統轉換器（`sips`、ImageMagick、GraphicsMagick 或 ffmpeg）。

安全性注意事項：URL 允許清單會在擷取前與每次重新導向時強制執行。將主機名稱加入允許清單不會略過私人／內部 IP 封鎖。對於暴露於網際網路的閘道，除了應用程式層級的防護之外，也請套用網路輸出流量控制。請參閱[安全性](/zh-TW/gateway/security)。

## 串流（SSE）

設定 `stream: true` 以接收伺服器傳送事件：

- `Content-Type: text/event-stream`
- 每個事件行的格式為 `event: <type>` 和 `data: <json>`
- 串流以 `data: [DONE]` 結束

目前發出的事件類型：`response.created`、`response.in_progress`、`response.output_item.added`、`response.content_part.added`、`response.output_text.delta`、`response.output_text.done`、`response.content_part.done`、`response.output_item.done`、`response.completed`、`response.failed`（發生錯誤時）。

## 使用量

當底層提供者回報權杖計數時，`usage` 會填入相關資料。在這些計數器送達下游的狀態／工作階段介面前，OpenClaw 會正規化常見的 OpenAI 風格別名，包括 `input_tokens`／`output_tokens` 和 `prompt_tokens`／`completion_tokens`。

## 錯誤

錯誤使用如下的 JSON 物件：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常見情況：`400` 請求本文無效、`401` 缺少驗證或驗證無效、`403` 缺少操作者範圍、`405` 方法錯誤、`429` 驗證失敗次數過多（附帶 `Retry-After`）。

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

## 相關內容

- [OpenAI 聊天補全](/zh-TW/gateway/openai-http-api)
- [操作者範圍](/zh-TW/gateway/operator-scopes)
- [OpenAI](/zh-TW/providers/openai)
