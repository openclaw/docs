---
read_when:
    - 整合預期使用 OpenAI Chat Completions 的工具
summary: 從閘道公開一個與 OpenAI 相容的 /v1/chat/completions HTTP 端點
title: OpenAI 聊天補全
x-i18n:
    generated_at: "2026-06-27T19:19:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw 的閘道可以提供小型、相容 OpenAI 的 Chat Completions 端點。

此端點**預設停用**。請先在設定中啟用。

- `POST /v1/chat/completions`
- 與閘道相同的連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/v1/chat/completions`

啟用閘道相容 OpenAI 的 HTTP 介面時，也會提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底層，請求會以一般閘道代理執行的方式執行（與 `openclaw agent` 相同的程式碼路徑），因此路由/權限/設定會與你的閘道一致。

## 驗證

使用閘道驗證設定。

常見 HTTP 驗證路徑：

- 共享密鑰驗證（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 帶有可信身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：
  透過已設定的身分感知 Proxy 路由，並讓它注入
  必要的身分標頭
- 私有入口開放驗證（`gateway.auth.mode="none"`）：
  不需要驗證標頭

注意：

- 當 `gateway.auth.mode="token"` 時，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 當 `gateway.auth.mode="password"` 時，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 當 `gateway.auth.mode="trusted-proxy"` 時，HTTP 請求必須來自
  已設定的可信 Proxy 來源；同主機 loopback Proxy 需要明確設定
  `gateway.auth.trustedProxy.allowLoopback = true`。
- 繞過 Proxy 的內部同主機呼叫端可以使用
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 作為本機直接
  後援。任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 標頭證據
  都會讓請求改走可信 Proxy 路徑。
- 如果已設定 `gateway.auth.rateLimit` 且發生太多驗證失敗，端點會回傳 `429` 並附上 `Retry-After`。

## 安全邊界（重要）

請將此端點視為閘道執行個體的**完整操作員存取**介面。

- 這裡的 HTTP bearer 驗證不是狹義的逐使用者範圍模型。
- 此端點的有效閘道 token/password 應視為擁有者/操作員憑證。
- 請求會透過與可信操作員動作相同的控制平面代理路徑執行。
- 此端點沒有獨立的非擁有者/逐使用者工具邊界；呼叫端一旦通過這裡的閘道驗證，OpenClaw 就會將該呼叫端視為此閘道的可信操作員。
- 對於共享密鑰驗證模式（`token` 和 `password`），即使呼叫端送出較窄的 `x-openclaw-scopes` 標頭，端點也會還原一般完整操作員預設值。
- 帶有可信身分的 HTTP 模式（例如可信 Proxy 驗證或 `gateway.auth.mode="none"`）會在存在 `x-openclaw-scopes` 時遵循它，否則會回退到一般操作員預設範圍集合。
- 如果目標代理政策允許敏感工具，此端點可以使用它們。
- 請只將此端點保留在 loopback/tailnet/私有入口上；不要直接暴露到公開網際網路。

驗證矩陣：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 證明持有共享閘道操作員密鑰
  - 忽略較窄的 `x-openclaw-scopes`
  - 還原完整的預設操作員範圍集合：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 將此端點上的聊天回合視為擁有者傳送者回合
- 帶有可信身分的 HTTP 模式（例如可信 Proxy 驗證，或私有入口上的 `gateway.auth.mode="none"`）
  - 驗證某個外層可信身分或部署邊界
  - 標頭存在時遵循 `x-openclaw-scopes`
  - 標頭不存在時回退到一般操作員預設範圍集合
  - 只有在呼叫端明確縮窄範圍並省略 `operator.admin` 時，才會失去擁有者語意
  - 對於擁有者層級請求控制（例如 `x-openclaw-model`）需要 `operator.admin`

請參閱[安全性](/zh-TW/gateway/security)和[遠端存取](/zh-TW/gateway/remote)。

## 何時使用此端點

當你要將工具或可信任的應用程式端後端與既有閘道整合，且可以安全持有閘道操作員憑證時，請使用 `/v1/chat/completions`。

- 如果你的整合只是同一個閘道的另一個操作員/用戶端介面，請優先使用此端點，而不是新增內建通道。
- 對於直接連線到遠端閘道的原生行動用戶端，請優先使用 [WebChat](/zh-TW/web/webchat) 或[閘道協定](/zh-TW/gateway/protocol)，並實作已配對裝置的啟動/裝置 token 流程，讓裝置不需要共享 HTTP token/password。
- 當你要整合具有自身使用者、聊天室、網路鉤子遞送或對外傳輸的外部訊息網路時，請改為建立通道外掛。請參閱[建立外掛](/zh-TW/plugins/building-plugins)。

## 代理優先模型合約

OpenClaw 會將 OpenAI `model` 欄位視為**代理目標**，而不是原始提供者模型 ID。

- `model: "openclaw"` 會路由到已設定的預設代理。
- `model: "openclaw/default"` 也會路由到已設定的預設代理。
- `model: "openclaw/<agentId>"` 會路由到特定代理。

選用請求標頭：

- `x-openclaw-model: <provider/model-or-bare-id>` 會覆寫所選代理的後端模型。共享密鑰 bearer 呼叫端可以使用此標頭。帶有身分的呼叫端，例如可信 Proxy 或帶有 `x-openclaw-scopes` 的私有免驗證入口請求，需要 `operator.admin`；僅寫入呼叫端會收到 `403 missing scope: operator.admin`。
- `x-openclaw-agent-id: <agentId>` 仍支援作為相容性覆寫。
- `x-openclaw-session-key: <sessionKey>` 明確控制工作階段路由。值不得使用保留的內部工作階段命名空間，例如 `subagent:`、`cron:` 或 `acp:`；這類請求會以 `400 invalid_request_error` 拒絕。
- `x-openclaw-message-channel: <channel>` 會為通道感知提示和政策設定合成入口通道內容。

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

預設情況下，端點是**每次請求無狀態**（每次呼叫都會產生新的工作階段金鑰）。

如果請求包含 OpenAI `user` 字串，閘道會從中衍生穩定的工作階段金鑰，因此重複呼叫可以共用代理工作階段。

對於自訂應用程式，最安全的預設做法是每個對話執行緒重複使用相同的 `user` 值。除非你明確希望多個對話或裝置共用同一個 OpenClaw 工作階段，否則請避免使用帳號層級識別碼。只有在需要跨多個用戶端或執行緒進行明確路由控制時，才使用 `x-openclaw-session-key`，並選擇應用程式擁有的金鑰，且不得以保留的內部命名空間開頭，例如 `subagent:`、`cron:` 或 `acp:`。

## 為什麼此介面重要

這是自託管前端和工具的最高槓桿相容性集合：

- 大多數 Open WebUI、LobeChat 和 LibreChat 設定都預期有 `/v1/models`。
- 許多 RAG 系統預期有 `/v1/embeddings`。
- 既有 OpenAI 聊天用戶端通常可以從 `/v1/chat/completions` 開始。
- 更多代理原生用戶端越來越偏好 `/v1/responses`。

## 模型清單與代理路由

<AccordionGroup>
  <Accordion title="`/v1/models` 會回傳什麼？">
    OpenClaw 代理目標清單。

    回傳的 ID 是 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>` 項目。
    請直接將它們作為 OpenAI `model` 值使用。

  </Accordion>
  <Accordion title="`/v1/models` 會列出代理還是子代理？">
    它會列出頂層代理目標，而不是後端提供者模型，也不是子代理。

    子代理仍然是內部執行拓撲。它們不會顯示為偽模型。

  </Accordion>
  <Accordion title="為什麼包含 `openclaw/default`？">
    `openclaw/default` 是已設定預設代理的穩定別名。

    這表示即使實際預設代理 ID 在不同環境之間變更，用戶端仍可持續使用一個可預測的 ID。

  </Accordion>
  <Accordion title="如何覆寫後端模型？">
    使用 `x-openclaw-model`。這是擁有者層級覆寫：它適用於閘道共享密鑰 bearer token/password 路徑，且在帶有身分的 HTTP 路徑（例如可信 Proxy 驗證）上需要 `operator.admin`。

    範例：
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    如果省略它，所選代理會使用其一般設定的模型選擇執行。

  </Accordion>
  <Accordion title="嵌入如何符合此合約？">
    `/v1/embeddings` 使用相同的代理目標 `model` ID。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    需要特定嵌入模型時，請從共享密鑰呼叫端或具有 `operator.admin` 的帶身分呼叫端，在 `x-openclaw-model` 中傳送。
    若沒有該標頭，請求會傳遞到所選代理的一般嵌入設定。

  </Accordion>
</AccordionGroup>

## 串流（SSE）

設定 `stream: true` 以接收伺服器傳送事件（SSE）：

- `Content-Type: text/event-stream`
- 每個事件行為 `data: <json>`
- 串流以 `data: [DONE]` 結束

## 聊天工具合約

`/v1/chat/completions` 支援與常見 OpenAI Chat 用戶端相容的函式工具子集。

### 支援的請求欄位

- `tools`：`{ "type": "function", "function": { ... } }` 陣列
- `tool_choice`：`"auto"`、`"none"`、`"required"` 或 `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` 後續回合
- `messages[*].tool_call_id` 用於將工具結果繫結回先前的工具呼叫
- `max_completion_tokens`：數字；每次呼叫的總完成 token 上限（包含推理 token）。目前的 OpenAI Chat Completions 欄位名稱；同時傳送 `max_completion_tokens` 和 `max_tokens` 時優先使用。
- `max_tokens`：數字；為向後相容而接受的舊版別名。當也存在 `max_completion_tokens` 時會被忽略。
- `temperature`：數字；透過代理串流參數通道，盡力將取樣溫度轉送給上游提供者。
- `top_p`：數字；透過代理串流參數通道，盡力將 nucleus sampling 轉送給上游提供者。
- `frequency_penalty`：數字；透過代理串流參數通道，盡力將頻率懲罰轉送給上游提供者。驗證範圍：-2.0 到 2.0。超出範圍的值會回傳 `400 invalid_request_error`。
- `presence_penalty`：數字；透過代理串流參數通道，盡力將存在懲罰轉送給上游提供者。驗證範圍：-2.0 到 2.0。超出範圍的值會回傳 `400 invalid_request_error`。
- `seed`：數字（整數）；透過代理串流參數通道，盡力將 seed 轉送給上游提供者。非整數值會回傳 `400 invalid_request_error`。
- `stop`：字串或最多 4 個字串的陣列；透過代理串流參數通道，盡力將停止序列轉送給上游提供者。若超過 4 個序列或項目非字串/為空，會回傳 `400 invalid_request_error`。

當任一 token-cap 欄位有設定時，該值會透過代理串流參數通道轉送給上游提供者。實際送往上游提供者的 wire 欄位名稱由提供者傳輸層選擇：OpenAI 系列端點使用 `max_completion_tokens`，而只接受舊名稱的提供者（例如 Mistral 和 Chutes）使用 `max_tokens`。取樣欄位（`temperature`、`top_p`、`frequency_penalty`、`presence_penalty`、`seed`）遵循相同的串流參數通道；基於 ChatGPT 的 Codex Responses 後端會在伺服器端移除這些欄位，因為它使用固定取樣。`stop` 也會走串流參數通道，並對應到傳輸層的停止欄位（Chat Completions 後端為 `stop`，Anthropic 為 `stop_sequences`）；OpenAI Responses API 沒有停止參數，因此 `stop` 不會套用在以 Responses 支援的模型上。

### 不支援的變體

端點會針對不支援的工具變體回傳 `400 invalid_request_error`，包括：

- 非陣列的 `tools`
- 非 function 的工具項目
- 缺少 `tool.function.name`
- `tool_choice` 變體，例如 `allowed_tools` 和 `custom`
- 與提供的 `tools` 不相符的 `tool_choice.function.name` 值

對於 `tool_choice: "required"` 和釘選 function 的 `tool_choice`，端點會縮小公開給用戶端的 function 工具集合，指示執行階段在回應前呼叫用戶端工具，並且在代理回應未包含相符的結構化用戶端工具呼叫時回傳錯誤。此契約適用於呼叫端提供的 HTTP `tools` 清單，而不是每一個內部 OpenClaw 代理工具。

### 非串流工具回應形狀

當代理決定呼叫工具時，回應會使用：

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` 項目包含：
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments`（JSON 字串）

工具呼叫前的助理註解會回傳在 `choices[0].message.content` 中（可能為空）。

### 串流工具回應形狀

當 `stream: true` 時，工具呼叫會以遞增 SSE 區塊發出：

- 初始助理角色 delta
- 可選的助理註解 delta
- 一個或多個 `delta.tool_calls` 區塊，攜帶工具身分與引數片段
- 帶有 `finish_reason: "tool_calls"` 的最後區塊
- `data: [DONE]`

如果 `stream_options.include_usage=true`，會在 `[DONE]` 前發出尾端 usage 區塊。

### 工具後續迴圈

收到 `tool_calls` 後，用戶端應執行要求的 function，並傳送包含以下內容的後續請求：

- 先前的助理工具呼叫訊息
- 一個或多個具有相符 `tool_call_id` 的 `role: "tool"` 訊息

這讓閘道代理執行能繼續相同的推理迴圈，並產生最終助理答案。

## Open WebUI 快速設定

基本 Open WebUI 連線：

- 基底 URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的基底 URL：`http://host.docker.internal:18789/v1`
- API 金鑰：你的閘道 bearer token
- 模型：`openclaw/default`

預期行為：

- `GET /v1/models` 應列出 `openclaw/default`
- Open WebUI 應使用 `openclaw/default` 作為聊天模型 id
- 如果你想為該代理指定特定後端提供者/模型，請設定代理的一般預設模型，或由 shared-secret 呼叫端或帶有 `operator.admin` 身分的呼叫端傳送 `x-openclaw-model`

快速 smoke：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果回傳 `openclaw/default`，大多數 Open WebUI 設定都能用相同的基底 URL 和 token 連線。

## 範例

一個應用程式對話的穩定工作階段：

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

在該對話的後續呼叫中重複使用相同的 `user` 值，以延續相同的代理工作階段。

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

擷取單一模型：

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

建立 embeddings：

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

備註：

- `/v1/models` 會回傳 OpenClaw 代理目標，而不是原始提供者 catalog。
- `openclaw/default` 一律存在，因此一個穩定 id 可跨環境運作。
- 後端提供者/模型覆寫應放在 `x-openclaw-model`，而不是 OpenAI `model` 欄位。在帶身分的 HTTP 驗證路徑上，此標頭需要 `operator.admin`。
- `/v1/embeddings` 支援 `input` 為字串或字串陣列。

## 相關

- [組態參考](/zh-TW/gateway/configuration-reference)
- [OpenAI](/zh-TW/providers/openai)
