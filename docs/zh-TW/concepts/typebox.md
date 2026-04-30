---
read_when:
    - 更新通訊協定結構描述或程式碼產生
summary: TypeBox 結構描述作為 Gateway 協定的單一真實來源
title: TypeBox
x-i18n:
    generated_at: "2026-04-30T03:03:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0496db919ee5c50a5932aa9e51eb54e1f54791bc0a271f39d6fb9e6fe17a2a28
    source_path: concepts/typebox.md
    workflow: 16
---

# TypeBox 作為協定的單一真相來源

最後更新：2026-01-10

TypeBox 是 TypeScript 優先的結構描述函式庫。我們用它定義 **Gateway
WebSocket 協定**（handshake、request/response、server events）。這些結構描述
驅動**執行階段驗證**、**JSON Schema 匯出**，以及 macOS 應用程式的 **Swift 程式碼產生**。
一個單一真相來源；其餘全部產生而來。

如果你想了解較高層次的協定脈絡，請從
[Gateway 架構](/zh-TW/concepts/architecture)開始。

## 心智模型（30 秒）

每個 Gateway WS 訊息都是下列三種框架之一：

- **Request**：`{ type: "req", id, method, params }`
- **Response**：`{ type: "res", id, ok, payload | error }`
- **Event**：`{ type: "event", event, payload, seq?, stateVersion? }`

第一個框架**必須**是 `connect` request。之後，clients 可以呼叫
methods（例如 `health`、`send`、`chat.send`）並訂閱 events（例如
`presence`、`tick`、`agent`）。

連線流程（最小）：

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

常見 methods + events：

| 類別       | 範例                                                       | 備註                               |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| 核心       | `connect`、`health`、`status`                              | `connect` 必須是第一個             |
| 訊息       | `send`、`agent`、`agent.wait`、`system-event`、`logs.tail` | 副作用需要 `idempotencyKey`        |
| 聊天       | `chat.history`、`chat.send`、`chat.abort`                  | WebChat 使用這些                   |
| 工作階段   | `sessions.list`、`sessions.patch`、`sessions.delete`       | 工作階段管理                       |
| 自動化     | `wake`、`cron.list`、`cron.run`、`cron.runs`               | 喚醒 + Cron 控制                   |
| Node       | `node.list`、`node.invoke`、`node.pair.*`                  | Gateway WS + Node 動作             |
| 事件       | `tick`、`presence`、`agent`、`chat`、`health`、`shutdown`  | server push                        |

權威宣告的 **discovery** 清單位於
`src/gateway/server-methods-list.ts`（`listGatewayMethods`、`GATEWAY_EVENTS`）。

## 結構描述所在位置

- 來源：`src/gateway/protocol/schema.ts`
- 執行階段驗證器（AJV）：`src/gateway/protocol/index.ts`
- 已宣告的功能/discovery 登錄檔：`src/gateway/server-methods-list.ts`
- Server handshake + method dispatch：`src/gateway/server.impl.ts`
- Node client：`src/gateway/client.ts`
- 產生的 JSON Schema：`dist/protocol.schema.json`
- 產生的 Swift models：`apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 目前管線

- `pnpm protocol:gen`
  - 將 JSON Schema（draft‑07）寫入 `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - 產生 Swift gateway models
- `pnpm protocol:check`
  - 執行兩個產生器並驗證輸出已提交

## 結構描述在執行階段如何使用

- **Server 端**：每個傳入框架都會以 AJV 驗證。handshake 只接受 params 符合
  `ConnectParams` 的 `connect` request。
- **Client 端**：JS client 會在使用前驗證 event 與 response 框架。
- **功能 discovery**：Gateway 會在 `hello-ok` 中，從 `listGatewayMethods()` 和
  `GATEWAY_EVENTS` 傳送保守的 `features.methods` 與 `features.events` 清單。
- 該 discovery 清單不是 `coreGatewayHandlers` 中每個可呼叫 helper 的產生式傾印；
  有些 helper RPC 實作在 `src/gateway/server-methods/*.ts` 中，但未列舉於已宣告的
  功能清單。

## 範例框架

Connect（第一個訊息）：

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Hello-ok response：

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Request + response：

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Event：

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## 最小 client（Node.js）

最小可用流程：connect + health。

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## 實作範例：端到端新增 method

範例：新增一個 `system.echo` request，回傳 `{ ok: true, text }`。

1. **結構描述（單一真相來源）**

新增至 `src/gateway/protocol/schema.ts`：

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

將兩者加入 `ProtocolSchemas` 並匯出 types：

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **驗證**

在 `src/gateway/protocol/index.ts` 中，匯出 AJV validator：

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Server 行為**

在 `src/gateway/server-methods/system.ts` 中新增 handler：

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

在 `src/gateway/server-methods.ts` 中註冊它（已經合併 `systemHandlers`），
然後將 `"system.echo"` 加到
`src/gateway/server-methods-list.ts` 的 `listGatewayMethods` 輸入。

如果該 method 可由 operator 或 Node clients 呼叫，也請在
`src/gateway/method-scopes.ts` 中分類它，讓 scope enforcement 與 `hello-ok` 功能
宣告保持一致。

4. **重新產生**

```bash
pnpm protocol:check
```

5. **測試 + 文件**

在 `src/gateway/server.*.test.ts` 中新增 server test，並在文件中註記該 method。

## Swift 程式碼產生行為

Swift 產生器會輸出：

- 含有 `req`、`res`、`event` 和 `unknown` cases 的 `GatewayFrame` enum
- 強型別 payload structs/enums
- `ErrorCode` values 與 `GATEWAY_PROTOCOL_VERSION`

未知框架類型會保留為原始 payload，以支援向前相容性。

## 版本化 + 相容性

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/schema.ts`。
- Clients 會傳送 `minProtocol` + `maxProtocol`；server 會拒絕不相符者。
- Swift models 會保留未知框架類型，以避免破壞較舊的 clients。

## 結構描述模式與慣例

- 多數 objects 使用 `additionalProperties: false` 來實作嚴格 payloads。
- `NonEmptyString` 是 IDs 與 method/event 名稱的預設值。
- 最上層的 `GatewayFrame` 在 `type` 上使用 **discriminator**。
- 具有副作用的 methods 通常要求 params 中有 `idempotencyKey`
  （範例：`send`、`poll`、`agent`、`chat.send`）。
- `agent` 接受選用的 `internalEvents`，用於執行階段產生的 orchestration context
  （例如 subagent/Cron task completion handoff）；請將此視為內部 API surface。

## 即時 schema JSON

產生的 JSON Schema 位於 repo 的 `dist/protocol.schema.json`。已發布的原始檔通常可在：

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## 變更結構描述時

1. 更新 TypeBox schemas。
2. 在 `src/gateway/server-methods-list.ts` 中註冊 method/event。
3. 當新的 RPC 需要 operator 或 Node scope 分類時，更新 `src/gateway/method-scopes.ts`。
4. 執行 `pnpm protocol:check`。
5. 提交重新產生的 schema + Swift models。

## 相關

- [豐富輸出協定](/zh-TW/reference/rich-output-protocol)
- [RPC adapters](/zh-TW/reference/rpc)
