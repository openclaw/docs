---
read_when:
    - 整合預期使用 OpenAI Chat Completions 的工具
summary: 從 Gateway 對外公開相容於 OpenAI 的 /v1/chat/completions HTTP 端點
title: OpenAI 聊天補全
x-i18n:
    generated_at: "2026-04-30T03:08:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 可以提供一個小型、相容於 OpenAI 的 Chat Completions 端點。

此端點**預設停用**。請先在設定中啟用它。

- `POST /v1/chat/completions`
- 與 Gateway 使用相同連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/v1/chat/completions`

啟用 Gateway 的 OpenAI 相容 HTTP 介面後，它也會提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底層，請求會以一般 Gateway 代理執行的方式執行（與 `openclaw agent` 相同的程式路徑），因此路由/權限/設定會與你的 Gateway 相符。

## 身分驗證

使用 Gateway 驗證設定。

常見 HTTP 驗證路徑：

- 共用密鑰驗證（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 帶有可信身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：
  透過已設定、具身分感知能力的代理路由，並讓它注入
  必要的身分標頭
- 私有入口開放驗證（`gateway.auth.mode="none"`）：
  不需要驗證標頭

注意事項：

- 當 `gateway.auth.mode="token"` 時，請使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 當 `gateway.auth.mode="password"` 時，請使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 當 `gateway.auth.mode="trusted-proxy"` 時，HTTP 請求必須來自
  已設定的可信代理來源；同主機 loopback 代理需要明確設定
  `gateway.auth.trustedProxy.allowLoopback = true`。
- 如果已設定 `gateway.auth.rateLimit`，且發生過多驗證失敗，端點會回傳 `429` 並附上 `Retry-After`。

## 安全邊界（重要）

請將此端點視為 Gateway 執行個體的**完整操作者存取權限**介面。

- 此處的 HTTP bearer 驗證不是狹義的逐使用者範圍模型。
- 此端點的有效 Gateway 權杖/密碼應視為擁有者/操作者憑證。
- 請求會經由與可信操作者動作相同的控制平面代理路徑執行。
- 此端點沒有獨立的非擁有者/逐使用者工具邊界；一旦呼叫者在此通過 Gateway 驗證，OpenClaw 會將該呼叫者視為此 Gateway 的可信操作者。
- 對於共用密鑰驗證模式（`token` 和 `password`），即使呼叫者傳送較窄的 `x-openclaw-scopes` 標頭，此端點也會還原一般的完整操作者預設值。
- 帶有可信身分的 HTTP 模式（例如可信代理驗證或 `gateway.auth.mode="none"`）在存在 `x-openclaw-scopes` 時會遵循它，否則會退回一般操作者預設範圍集合。
- 如果目標代理政策允許敏感工具，此端點可以使用它們。
- 請僅將此端點保留在 loopback/tailnet/私有入口上；不要直接暴露到公用網際網路。

驗證矩陣：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 證明持有共用 Gateway 操作者密鑰
  - 忽略較窄的 `x-openclaw-scopes`
  - 還原完整預設操作者範圍集合：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 將此端點上的聊天輪次視為擁有者傳送者輪次
- 帶有可信身分的 HTTP 模式（例如可信代理驗證，或私有入口上的 `gateway.auth.mode="none"`）
  - 驗證某個外部可信身分或部署邊界
  - 當標頭存在時遵循 `x-openclaw-scopes`
  - 當標頭不存在時退回一般操作者預設範圍集合
  - 只有在呼叫者明確縮窄範圍並省略 `operator.admin` 時，才會失去擁有者語意

請參閱[安全性](/zh-TW/gateway/security)和[遠端存取](/zh-TW/gateway/remote)。

## 代理優先模型合約

OpenClaw 會將 OpenAI `model` 欄位視為**代理目標**，而不是原始供應商模型 ID。

- `model: "openclaw"` 路由至已設定的預設代理。
- `model: "openclaw/default"` 也會路由至已設定的預設代理。
- `model: "openclaw/<agentId>"` 路由至特定代理。

選用請求標頭：

- `x-openclaw-model: <provider/model-or-bare-id>` 會覆寫所選代理的後端模型。
- `x-openclaw-agent-id: <agentId>` 仍支援作為相容性覆寫。
- `x-openclaw-session-key: <sessionKey>` 完整控制工作階段路由。
- `x-openclaw-message-channel: <channel>` 設定用於通道感知提示與政策的合成入口通道情境。

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

預設情況下，此端點**每個請求皆為無狀態**（每次呼叫都會產生新的工作階段金鑰）。

如果請求包含 OpenAI `user` 字串，Gateway 會從中衍生穩定的工作階段金鑰，因此重複呼叫可以共用代理工作階段。

## 此介面的重要性

這是自架前端與工具最具效益的相容性集合：

- 多數 Open WebUI、LobeChat 和 LibreChat 設定都預期 `/v1/models`。
- 許多 RAG 系統預期 `/v1/embeddings`。
- 既有 OpenAI 聊天用戶端通常可以從 `/v1/chat/completions` 開始。
- 更多代理原生用戶端逐漸偏好 `/v1/responses`。

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

    這代表即使實際預設代理 ID 在不同環境之間變更，用戶端仍可持續使用一個可預測的 ID。

  </Accordion>
  <Accordion title="如何覆寫後端模型？">
    使用 `x-openclaw-model`。

    範例：
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    如果省略它，所選代理會使用其一般設定的模型選擇執行。

  </Accordion>
  <Accordion title="嵌入如何納入此合約？">
    `/v1/embeddings` 使用相同的代理目標 `model` ID。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    需要特定嵌入模型時，請在 `x-openclaw-model` 中傳送。
    若沒有該標頭，請求會傳遞至所選代理的一般嵌入設定。

  </Accordion>
</AccordionGroup>

## 串流（SSE）

設定 `stream: true` 以接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每個事件行都是 `data: <json>`
- 串流以 `data: [DONE]` 結束

## Open WebUI 快速設定

基本 Open WebUI 連線：

- 基底 URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的基底 URL：`http://host.docker.internal:18789/v1`
- API 金鑰：你的 Gateway bearer 權杖
- 模型：`openclaw/default`

預期行為：

- `GET /v1/models` 應列出 `openclaw/default`
- Open WebUI 應使用 `openclaw/default` 作為聊天模型 ID
- 如果你想要該代理使用特定後端供應商/模型，請設定代理的一般預設模型，或傳送 `x-openclaw-model`

快速冒煙測試：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果它回傳 `openclaw/default`，多數 Open WebUI 設定都可以使用相同的基底 URL 和權杖連線。

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

注意事項：

- `/v1/models` 會回傳 OpenClaw 代理目標，而不是原始供應商目錄。
- `openclaw/default` 一律存在，因此一個穩定 ID 可跨環境運作。
- 後端供應商/模型覆寫應放在 `x-openclaw-model`，而不是 OpenAI `model` 欄位。
- `/v1/embeddings` 支援 `input` 為字串或字串陣列。

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [OpenAI](/zh-TW/providers/openai)
