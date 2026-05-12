---
read_when:
    - 整合需要 OpenAI Chat Completions 的工具
summary: 從 Gateway 公開與 OpenAI 相容的 /v1/chat/completions HTTP 端點
title: OpenAI 聊天補全
x-i18n:
    generated_at: "2026-05-12T15:43:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 可以提供一個小型、與 OpenAI 相容的 Chat Completions 端點。

此端點**預設停用**。請先在設定中啟用。

- `POST /v1/chat/completions`
- 與 Gateway 相同的連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/v1/chat/completions`

啟用 Gateway 的 OpenAI 相容 HTTP 介面後，它也會提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底層，請求會作為一般 Gateway 代理執行來處理（與 `openclaw agent` 相同的程式碼路徑），因此路由/權限/設定會與你的 Gateway 相符。

## 驗證

使用 Gateway 驗證設定。

常見的 HTTP 驗證路徑：

- 共享祕密驗證（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 帶有可信身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：
  透過已設定、可識別身分的代理路由，並讓它注入
  必要的身分標頭
- 私有入口開放驗證（`gateway.auth.mode="none"`）：
  不需要驗證標頭

注意事項：

- 當 `gateway.auth.mode="token"` 時，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 當 `gateway.auth.mode="password"` 時，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 當 `gateway.auth.mode="trusted-proxy"` 時，HTTP 請求必須來自
  已設定的可信代理來源；同主機 loopback 代理需要明確設定
  `gateway.auth.trustedProxy.allowLoopback = true`。
- 如果已設定 `gateway.auth.rateLimit`，且驗證失敗次數過多，端點會回傳帶有 `Retry-After` 的 `429`。

## 安全邊界（重要）

請將此端點視為 gateway 執行個體的**完整操作員存取**介面。

- 這裡的 HTTP bearer 驗證不是狹義的每使用者範圍模型。
- 此端點的有效 Gateway token/password 應視為擁有者/操作員憑證。
- 請求會透過與可信操作員動作相同的控制平面代理路徑執行。
- 此端點沒有獨立的非擁有者/每使用者工具邊界；一旦呼叫者在這裡通過 Gateway 驗證，OpenClaw 就會將該呼叫者視為此 gateway 的可信操作員。
- 對於共享祕密驗證模式（`token` 和 `password`），即使呼叫者傳送較窄的 `x-openclaw-scopes` 標頭，端點也會還原一般的完整操作員預設值。
- 帶有可信身分的 HTTP 模式（例如可信代理驗證或 `gateway.auth.mode="none"`）會在存在 `x-openclaw-scopes` 時遵循它，否則會退回一般操作員預設範圍集。
- 如果目標代理政策允許敏感工具，此端點可以使用它們。
- 請僅將此端點保留在 loopback/tailnet/私有入口上；不要直接暴露到公用網際網路。

驗證矩陣：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 證明持有共享 gateway 操作員祕密
  - 忽略較窄的 `x-openclaw-scopes`
  - 還原完整的預設操作員範圍集：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 將此端點上的聊天回合視為擁有者傳送者回合
- 帶有可信身分的 HTTP 模式（例如可信代理驗證，或私有入口上的 `gateway.auth.mode="none"`）
  - 驗證某個外部可信身分或部署邊界
  - 當標頭存在時遵循 `x-openclaw-scopes`
  - 當標頭不存在時退回一般操作員預設範圍集
  - 只有在呼叫者明確縮小範圍並省略 `operator.admin` 時，才會失去擁有者語意

請參閱[安全性](/zh-TW/gateway/security)與[遠端存取](/zh-TW/gateway/remote)。

## 代理優先模型合約

OpenClaw 會將 OpenAI `model` 欄位視為**代理目標**，而不是原始供應商模型 ID。

- `model: "openclaw"` 會路由到已設定的預設代理。
- `model: "openclaw/default"` 也會路由到已設定的預設代理。
- `model: "openclaw/<agentId>"` 會路由到特定代理。

選用請求標頭：

- `x-openclaw-model: <provider/model-or-bare-id>` 會覆寫所選代理的後端模型。
- `x-openclaw-agent-id: <agentId>` 仍支援作為相容性覆寫。
- `x-openclaw-session-key: <sessionKey>` 會完整控制工作階段路由。
- `x-openclaw-message-channel: <channel>` 會為通道感知提示與政策設定合成入口通道情境。

仍接受的相容性別名：

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## 啟用端點

將 `gateway.http.endpoints.chatCompletions.enabled` 設為 `true`：

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

## 停用端點

將 `gateway.http.endpoints.chatCompletions.enabled` 設為 `false`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## 工作階段行為

此端點預設為**每個請求無狀態**（每次呼叫都會產生新的工作階段金鑰）。

如果請求包含 OpenAI `user` 字串，Gateway 會從中衍生穩定的工作階段金鑰，因此重複呼叫可以共用代理工作階段。

## 此介面為何重要

這是自託管前端與工具最高槓桿的相容性組合：

- 多數 Open WebUI、LobeChat 和 LibreChat 設定都預期有 `/v1/models`。
- 許多 RAG 系統都預期有 `/v1/embeddings`。
- 現有 OpenAI 聊天用戶端通常可以從 `/v1/chat/completions` 開始。
- 更偏向原生代理的用戶端越來越偏好 `/v1/responses`。

## 模型清單與代理路由

<AccordionGroup>
  <Accordion title="`/v1/models` 會回傳什麼？">
    OpenClaw 代理目標清單。

    回傳的 ID 是 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>` 項目。
    請直接將它們作為 OpenAI `model` 值使用。

  </Accordion>
  <Accordion title="`/v1/models` 會列出代理還是子代理？">
    它會列出頂層代理目標，而不是後端供應商模型，也不是子代理。

    子代理仍是內部執行拓撲。它們不會以偽模型形式出現。

  </Accordion>
  <Accordion title="為什麼包含 `openclaw/default`？">
    `openclaw/default` 是已設定預設代理的穩定別名。

    這表示即使真實的預設代理 ID 在不同環境之間變更，用戶端仍可持續使用一個可預測的 ID。

  </Accordion>
  <Accordion title="我要如何覆寫後端模型？">
    使用 `x-openclaw-model`。

    範例：
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    如果省略它，所選代理會使用其一般設定的模型選擇來執行。

  </Accordion>
  <Accordion title="嵌入如何符合此合約？">
    `/v1/embeddings` 使用相同的代理目標 `model` ID。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    當你需要特定嵌入模型時，請在 `x-openclaw-model` 中傳送它。
    若沒有該標頭，請求會傳遞到所選代理的一般嵌入設定。

  </Accordion>
</AccordionGroup>

## 串流（SSE）

設定 `stream: true` 以接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每個事件列為 `data: <json>`
- 串流以 `data: [DONE]` 結束

## 聊天工具合約

`/v1/chat/completions` 支援與常見 OpenAI Chat 用戶端相容的函式工具子集。

### 支援的請求欄位

- `tools`：`{ "type": "function", "function": { ... } }` 的陣列
- `tool_choice`：`"auto"`、`"none"`
- `messages[*].role: "tool"` 後續回合
- `messages[*].tool_call_id` 用於將工具結果繫結回先前的工具呼叫
- `max_completion_tokens`：數字；每次呼叫的完成權杖總上限（包含推理權杖）。目前的 OpenAI Chat Completions 欄位名稱；同時傳送 `max_completion_tokens` 和 `max_tokens` 時優先使用。
- `max_tokens`：數字；為向後相容而接受的舊版別名。當也存在 `max_completion_tokens` 時會被忽略。

設定任一欄位時，該值會透過代理串流參數通道轉送給上游供應商。傳送給上游供應商的實際 wire 欄位名稱由供應商傳輸層選擇：OpenAI 系列端點使用 `max_completion_tokens`，而僅接受舊版名稱的供應商（例如 Mistral 和 Chutes）使用 `max_tokens`。

### 不支援的變體

端點會對不支援的工具變體回傳 `400 invalid_request_error`，包括：

- 非陣列的 `tools`
- 非函式工具項目
- 缺少 `tool.function.name`
- `tool_choice` 變體，例如 `allowed_tools` 和 `custom`
- `tool_choice: "required"`（尚未在執行階段強制執行；一旦實作硬性強制執行後將會支援）
- `tool_choice: { "type": "function", "function": { "name": "..." } }`（理由同 `required`）
- 與提供的 `tools` 不相符的 `tool_choice.function.name` 值

### 非串流工具回應形狀

當代理決定呼叫工具時，回應會使用：

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` 項目包含：
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments`（JSON 字串）

工具呼叫前的助理評論會在 `choices[0].message.content` 中回傳（可能為空）。

### 串流工具回應形狀

當 `stream: true` 時，工具呼叫會作為增量 SSE 區塊發出：

- 初始助理角色 delta
- 選用的助理評論 delta
- 一個或多個 `delta.tool_calls` 區塊，攜帶工具身分與引數片段
- 帶有 `finish_reason: "tool_calls"` 的最終區塊
- `data: [DONE]`

如果 `stream_options.include_usage=true`，會在 `[DONE]` 前發出尾端用量區塊。

### 工具後續迴圈

收到 `tool_calls` 後，用戶端應執行請求的函式，並傳送包含以下內容的後續請求：

- 先前的助理工具呼叫訊息
- 一個或多個帶有相符 `tool_call_id` 的 `role: "tool"` 訊息

這可讓 gateway 代理執行繼續相同的推理迴圈，並產生最終助理答案。

## Open WebUI 快速設定

對於基本 Open WebUI 連線：

- 基底 URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的基底 URL：`http://host.docker.internal:18789/v1`
- API 金鑰：你的 Gateway bearer token
- 模型：`openclaw/default`

預期行為：

- `GET /v1/models` 應列出 `openclaw/default`
- Open WebUI 應使用 `openclaw/default` 作為聊天模型 ID
- 如果你想要該代理使用特定後端供應商/模型，請設定代理的一般預設模型，或傳送 `x-openclaw-model`

快速煙霧測試：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果它回傳 `openclaw/default`，多數 Open WebUI 設定即可使用相同的基底 URL 與 token 連線。

## 範例

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

注意事項：

- `/v1/models` 會傳回 OpenClaw agent 目標，而不是原始提供者目錄。
- `openclaw/default` 一律存在，因此單一穩定 ID 可跨環境運作。
- 後端提供者/模型覆寫應放在 `x-openclaw-model`，而不是 OpenAI 的 `model` 欄位。
- `/v1/embeddings` 支援將 `input` 設為字串或字串陣列。

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [OpenAI](/zh-TW/providers/openai)
