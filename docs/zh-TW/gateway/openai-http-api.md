---
read_when:
    - 整合預期使用 OpenAI Chat Completions 的工具
summary: 從 Gateway 公開與 OpenAI 相容的 /v1/chat/completions HTTP 端點
title: OpenAI 聊天補全
x-i18n:
    generated_at: "2026-05-11T20:29:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 可以提供小型、相容於 OpenAI 的 Chat Completions 端點。

此端點**預設停用**。請先在設定中啟用。

- `POST /v1/chat/completions`
- 與 Gateway 相同的連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/v1/chat/completions`

啟用 Gateway 的 OpenAI 相容 HTTP 介面後，它也會提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底層，請求會以一般 Gateway agent run 執行（與 `openclaw agent` 相同的程式碼路徑），因此路由/權限/設定會與你的 Gateway 相符。

## 驗證

使用 Gateway 驗證設定。

常見的 HTTP 驗證路徑：

- shared-secret 驗證（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 帶有受信任身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：
  透過已設定的身分感知 Proxy 路由，並讓它注入
  必要的身分標頭
- private-ingress 開放驗證（`gateway.auth.mode="none"`）：
  不需要驗證標頭

注意事項：

- 當 `gateway.auth.mode="token"` 時，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 當 `gateway.auth.mode="password"` 時，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 當 `gateway.auth.mode="trusted-proxy"` 時，HTTP 請求必須來自
  已設定的受信任 Proxy 來源；同主機 loopback Proxy 需要明確設定
  `gateway.auth.trustedProxy.allowLoopback = true`。
- 如果已設定 `gateway.auth.rateLimit` 且發生太多驗證失敗，端點會回傳 `429` 和 `Retry-After`。

## 安全邊界（重要）

請將此端點視為 Gateway 執行個體的**完整操作員存取**介面。

- 這裡的 HTTP Bearer 驗證不是狹義的逐使用者 Scope 模型。
- 此端點的有效 Gateway token/password 應視為擁有者/操作員憑證。
- 請求會透過與受信任操作員動作相同的 control-plane agent 路徑執行。
- 此端點沒有獨立的非擁有者/逐使用者工具邊界；呼叫端一旦通過這裡的 Gateway 驗證，OpenClaw 就會將該呼叫端視為此 Gateway 的受信任操作員。
- 對於 shared-secret 驗證模式（`token` 和 `password`），即使呼叫端傳送較窄的 `x-openclaw-scopes` 標頭，端點仍會還原一般完整操作員預設值。
- 帶有受信任身分的 HTTP 模式（例如受信任 Proxy 驗證或 `gateway.auth.mode="none"`）會在 `x-openclaw-scopes` 存在時遵循它，否則退回一般操作員預設 Scope 集合。
- 如果目標 Agent 政策允許敏感工具，此端點可以使用它們。
- 只將此端點保留在 loopback/tailnet/private ingress；不要直接暴露到公開網際網路。

驗證矩陣：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 證明持有共享的 Gateway 操作員 Secret
  - 忽略較窄的 `x-openclaw-scopes`
  - 還原完整的預設操作員 Scope 集合：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 將此端點上的聊天回合視為擁有者傳送者回合
- 帶有受信任身分的 HTTP 模式（例如受信任 Proxy 驗證，或 private ingress 上的 `gateway.auth.mode="none"`）
  - 驗證某個外層受信任身分或部署邊界
  - 當標頭存在時遵循 `x-openclaw-scopes`
  - 當標頭不存在時退回一般操作員預設 Scope 集合
  - 只有在呼叫端明確縮窄 Scope 並省略 `operator.admin` 時，才會失去擁有者語意

請參閱 [安全性](/zh-TW/gateway/security) 和 [遠端存取](/zh-TW/gateway/remote)。

## Agent 優先模型合約

OpenClaw 會將 OpenAI `model` 欄位視為**Agent 目標**，而不是原始 Provider 模型 ID。

- `model: "openclaw"` 會路由到已設定的預設 Agent。
- `model: "openclaw/default"` 也會路由到已設定的預設 Agent。
- `model: "openclaw/<agentId>"` 會路由到特定 Agent。

選用請求標頭：

- `x-openclaw-model: <provider/model-or-bare-id>` 會覆寫所選 Agent 的後端模型。
- `x-openclaw-agent-id: <agentId>` 仍支援作為相容性覆寫。
- `x-openclaw-session-key: <sessionKey>` 完全控制 Session 路由。
- `x-openclaw-message-channel: <channel>` 設定供 Channel 感知 Prompt 和政策使用的合成 ingress Channel 情境。

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

## Session 行為

預設情況下，此端點是**每個請求無狀態**（每次呼叫都會產生新的 Session key）。

如果請求包含 OpenAI `user` 字串，Gateway 會從中推導出穩定的 Session key，因此重複呼叫可以共享 Agent Session。

## 為什麼此介面很重要

這是自架前端和工具最具槓桿效益的相容性集合：

- 多數 Open WebUI、LobeChat 和 LibreChat 設定都預期 `/v1/models`。
- 許多 RAG 系統都預期 `/v1/embeddings`。
- 現有 OpenAI 聊天用戶端通常可以從 `/v1/chat/completions` 開始。
- 更多 Agent 原生用戶端越來越偏好 `/v1/responses`。

## 模型清單與 Agent 路由

<AccordionGroup>
  <Accordion title="`/v1/models` 會回傳什麼？">
    OpenClaw Agent 目標清單。

    回傳的 ID 是 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>` 項目。
    直接將它們作為 OpenAI `model` 值使用。

  </Accordion>
  <Accordion title="`/v1/models` 會列出 Agent 還是 Sub-agent？">
    它列出頂層 Agent 目標，而不是後端 Provider 模型，也不是 Sub-agent。

    Sub-agent 仍然是內部執行拓撲。它們不會顯示為 pseudo-model。

  </Accordion>
  <Accordion title="為什麼包含 `openclaw/default`？">
    `openclaw/default` 是已設定預設 Agent 的穩定別名。

    這表示即使實際預設 Agent ID 在不同環境之間變更，用戶端仍可繼續使用一個可預測的 ID。

  </Accordion>
  <Accordion title="如何覆寫後端模型？">
    使用 `x-openclaw-model`。

    範例：
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    如果省略它，所選 Agent 會使用其一般設定的模型選擇執行。

  </Accordion>
  <Accordion title="Embeddings 如何適用於此合約？">
    `/v1/embeddings` 使用相同的 Agent 目標 `model` ID。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    當你需要特定 embedding 模型時，請在 `x-openclaw-model` 中傳送。
    若沒有該標頭，請求會傳遞到所選 Agent 的一般 embedding 設定。

  </Accordion>
</AccordionGroup>

## 串流（SSE）

設定 `stream: true` 以接收伺服器傳送事件（SSE）：

- `Content-Type: text/event-stream`
- 每個事件行都是 `data: <json>`
- 串流以 `data: [DONE]` 結束

## 聊天工具合約

`/v1/chat/completions` 支援與常見 OpenAI Chat 用戶端相容的 function-tool 子集。

### 支援的請求欄位

- `tools`：`{ "type": "function", "function": { ... } }` 的陣列
- `tool_choice`：`"auto"`、`"none"`
- `messages[*].role: "tool"` 後續回合
- `messages[*].tool_call_id`，用於將工具結果綁定回先前的工具呼叫

### 不支援的變體

端點會對不支援的工具變體回傳 `400 invalid_request_error`，包括：

- 非陣列 `tools`
- 非 function 工具項目
- 缺少 `tool.function.name`
- `tool_choice` 變體，例如 `allowed_tools` 和 `custom`
- `tool_choice: "required"`（尚未在執行階段強制執行；待硬性強制執行實作後將會支援）
- `tool_choice: { "type": "function", "function": { "name": "..." } }`（理由與 `required` 相同）
- 與提供的 `tools` 不相符的 `tool_choice.function.name` 值

### 非串流工具回應形狀

當 Agent 決定呼叫工具時，回應會使用：

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` 項目包含：
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments`（JSON 字串）

工具呼叫前的 Assistant 評論會在 `choices[0].message.content` 中回傳（可能為空）。

### 串流工具回應形狀

當 `stream: true` 時，工具呼叫會以增量 SSE Chunk 發出：

- 初始 Assistant role delta
- 選用的 Assistant 評論 delta
- 一個或多個 `delta.tool_calls` Chunk，攜帶工具身分與引數片段
- 最終 Chunk，包含 `finish_reason: "tool_calls"`
- `data: [DONE]`

如果 `stream_options.include_usage=true`，會在 `[DONE]` 前發出尾端 usage Chunk。

### 工具後續迴圈

收到 `tool_calls` 後，用戶端應執行要求的 function，並傳送包含下列內容的後續請求：

- 先前的 Assistant 工具呼叫訊息
- 一個或多個 `role: "tool"` 訊息，且具有相符的 `tool_call_id`

這允許 Gateway Agent run 繼續相同的推理迴圈，並產生最終 Assistant 回答。

## Open WebUI 快速設定

對於基本 Open WebUI 連線：

- Base URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的 Base URL：`http://host.docker.internal:18789/v1`
- API key：你的 Gateway Bearer Token
- Model：`openclaw/default`

預期行為：

- `GET /v1/models` 應列出 `openclaw/default`
- Open WebUI 應使用 `openclaw/default` 作為聊天模型 ID
- 如果你想要該 Agent 的特定後端 Provider/模型，請設定 Agent 的一般預設模型，或傳送 `x-openclaw-model`

快速 Smoke：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果回傳 `openclaw/default`，多數 Open WebUI 設定都可以使用相同的 Base URL 和 Token 連線。

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

建立 Embeddings：

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

- `/v1/models` 會回傳 OpenClaw Agent 目標，而不是原始 Provider 目錄。
- `openclaw/default` 一律存在，因此一個穩定 ID 可跨環境運作。
- 後端 Provider/模型覆寫應放在 `x-openclaw-model`，而不是 OpenAI `model` 欄位。
- `/v1/embeddings` 支援將 `input` 作為字串或字串陣列。

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [OpenAI](/zh-TW/providers/openai)
