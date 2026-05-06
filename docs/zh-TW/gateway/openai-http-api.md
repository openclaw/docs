---
read_when:
    - 整合預期使用 OpenAI Chat Completions 的工具
summary: 從 Gateway 公開一個與 OpenAI 相容的 /v1/chat/completions HTTP 端點
title: OpenAI 聊天補全
x-i18n:
    generated_at: "2026-05-06T09:09:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8cd0995cf5f897ae8f99f35fc4b8ea28ebde3cba41da0f3e768ec1de7874b2f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 可以提供一個小型、相容 OpenAI 的 Chat Completions 端點。

此端點**預設停用**。請先在設定中啟用。

- `POST /v1/chat/completions`
- 與 Gateway 相同的連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/v1/chat/completions`

啟用 Gateway 的相容 OpenAI HTTP 介面後，它也會提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底層，請求會以一般 Gateway agent 執行來處理（與 `openclaw agent` 相同的程式碼路徑），因此路由、權限與設定都會符合你的 Gateway。

## 驗證

使用 Gateway 驗證設定。

常見 HTTP 驗證路徑：

- shared-secret 驗證（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 帶有受信任身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：
  透過已設定、具備身分感知能力的 proxy 路由，並讓它注入
  必要的身分標頭
- private-ingress 開放驗證（`gateway.auth.mode="none"`）：
  不需要驗證標頭

注意事項：

- 當 `gateway.auth.mode="token"` 時，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 當 `gateway.auth.mode="password"` 時，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 當 `gateway.auth.mode="trusted-proxy"` 時，HTTP 請求必須來自
  已設定的受信任 proxy 來源；同主機 loopback proxy 需要明確設定
  `gateway.auth.trustedProxy.allowLoopback = true`。
- 如果已設定 `gateway.auth.rateLimit` 且驗證失敗次數過多，端點會回傳含有 `Retry-After` 的 `429`。

## 安全邊界（重要）

請將此端點視為 gateway 執行個體的**完整操作員存取權**介面。

- 這裡的 HTTP bearer 驗證不是狹義的每使用者 scope 模型。
- 此端點的有效 Gateway token/password 應視為 owner/operator 憑證。
- 請求會透過與受信任操作員動作相同的 control-plane agent 路徑執行。
- 此端點沒有獨立的非 owner/每使用者工具邊界；一旦呼叫者在這裡通過 Gateway 驗證，OpenClaw 就會將該呼叫者視為此 gateway 的受信任操作員。
- 對於 shared-secret 驗證模式（`token` 與 `password`），即使呼叫者傳送較窄的 `x-openclaw-scopes` 標頭，端點也會還原一般完整操作員預設值。
- 帶有受信任身分的 HTTP 模式（例如 trusted proxy 驗證或 `gateway.auth.mode="none"`）會在 `x-openclaw-scopes` 存在時採用它，否則會退回到一般操作員預設 scope 集合。
- 如果目標 agent 政策允許敏感工具，此端點可以使用它們。
- 請只將此端點保留在 loopback/tailnet/private ingress 上；不要直接暴露到公用網際網路。

驗證矩陣：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 證明持有共用 gateway 操作員祕密
  - 忽略較窄的 `x-openclaw-scopes`
  - 還原完整預設操作員 scope 集合：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 將此端點上的 chat 回合視為 owner-sender 回合
- 帶有受信任身分的 HTTP 模式（例如 trusted proxy 驗證，或 private ingress 上的 `gateway.auth.mode="none"`）
  - 驗證某個外部受信任身分或部署邊界
  - 當標頭存在時採用 `x-openclaw-scopes`
  - 當標頭不存在時退回到一般操作員預設 scope 集合
  - 只有在呼叫者明確縮窄 scope 並省略 `operator.admin` 時，才會失去 owner 語意

請參閱[安全性](/zh-TW/gateway/security)與[遠端存取](/zh-TW/gateway/remote)。

## Agent 優先模型合約

OpenClaw 將 OpenAI 的 `model` 欄位視為 **agent 目標**，而不是原始 provider model id。

- `model: "openclaw"` 會路由到已設定的預設 agent。
- `model: "openclaw/default"` 也會路由到已設定的預設 agent。
- `model: "openclaw/<agentId>"` 會路由到特定 agent。

選用請求標頭：

- `x-openclaw-model: <provider/model-or-bare-id>` 會覆寫所選 agent 的後端模型。
- `x-openclaw-agent-id: <agentId>` 仍支援作為相容性覆寫。
- `x-openclaw-session-key: <sessionKey>` 會完整控制 session 路由。
- `x-openclaw-message-channel: <channel>` 會為 channel-aware prompt 與政策設定合成 ingress channel context。

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

端點預設為**每個請求無狀態**（每次呼叫都會產生新的 session key）。

如果請求包含 OpenAI `user` 字串，Gateway 會由它衍生穩定的 session key，因此重複呼叫可以共用 agent session。

## 為什麼這個介面很重要

這是自架 frontend 與工具最具槓桿效益的相容性集合：

- 大多數 Open WebUI、LobeChat 與 LibreChat 設定都預期有 `/v1/models`。
- 許多 RAG 系統預期有 `/v1/embeddings`。
- 既有 OpenAI chat client 通常可以從 `/v1/chat/completions` 開始。
- 更多 agent-native client 越來越偏好 `/v1/responses`。

## 模型清單與 agent 路由

<AccordionGroup>
  <Accordion title="`/v1/models` 會回傳什麼？">
    一份 OpenClaw agent 目標清單。

    回傳的 id 是 `openclaw`、`openclaw/default` 與 `openclaw/<agentId>` 項目。
    直接將它們作為 OpenAI `model` 值使用。

  </Accordion>
  <Accordion title="`/v1/models` 會列出 agent 還是 sub-agent？">
    它會列出頂層 agent 目標，不是後端 provider model，也不是 sub-agent。

    Sub-agent 仍是內部執行拓撲。它們不會作為 pseudo-model 出現。

  </Accordion>
  <Accordion title="為什麼包含 `openclaw/default`？">
    `openclaw/default` 是已設定預設 agent 的穩定別名。

    這表示即使實際預設 agent id 在不同環境之間改變，client 仍可持續使用一個可預期的 id。

  </Accordion>
  <Accordion title="我要如何覆寫後端模型？">
    使用 `x-openclaw-model`。

    範例：
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    如果省略它，所選 agent 會使用其一般設定的模型選擇執行。

  </Accordion>
  <Accordion title="Embeddings 如何套用這個合約？">
    `/v1/embeddings` 使用相同的 agent 目標 `model` id。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    需要特定 embedding model 時，請在 `x-openclaw-model` 中傳送。
    沒有該標頭時，請求會傳遞到所選 agent 的一般 embedding 設定。

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

設定 `stream: true` 以接收 Server-Sent Events (SSE)：

- `Content-Type: text/event-stream`
- 每個事件行是 `data: <json>`
- Stream 會以 `data: [DONE]` 結束

## Open WebUI 快速設定

基本 Open WebUI 連線：

- Base URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的 base URL：`http://host.docker.internal:18789/v1`
- API key：你的 Gateway bearer token
- Model：`openclaw/default`

預期行為：

- `GET /v1/models` 應列出 `openclaw/default`
- Open WebUI 應使用 `openclaw/default` 作為 chat model id
- 如果你想為該 agent 指定特定後端 provider/model，請設定 agent 的一般預設模型，或傳送 `x-openclaw-model`

快速 smoke：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果它回傳 `openclaw/default`，大多數 Open WebUI 設定都可以使用相同的 base URL 與 token 連線。

## 範例

非 streaming：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming：

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

注意事項：

- `/v1/models` 回傳 OpenClaw agent 目標，而非原始 provider catalog。
- `openclaw/default` 一律存在，因此一個穩定 id 可跨環境運作。
- 後端 provider/model 覆寫應放在 `x-openclaw-model`，而不是 OpenAI `model` 欄位。
- `/v1/embeddings` 支援將 `input` 作為字串或字串陣列。

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [OpenAI](/zh-TW/providers/openai)
