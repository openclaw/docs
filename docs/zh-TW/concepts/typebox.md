---
read_when:
    - 更新協定結構描述或程式碼產生
summary: 以 TypeBox 結構描述作為 Gateway 協定的單一事實來源
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T09:08:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox 是以 TypeScript 為優先的結構描述函式庫。我們用它來定義 **Gateway
WebSocket 協定**（握手、請求/回應、伺服器事件）。這些結構描述會驅動 **執行階段驗證**、**JSON Schema 匯出**，以及 macOS app 的 **Swift 程式碼產生**。單一真實來源；其他一切都由它產生。

如果你想了解更高層次的協定脈絡，請從
[Gateway 架構](/zh-TW/concepts/architecture)開始。

## 心智模型（30 秒）

每個 Gateway WS 訊息都是三種框架之一：

- **請求**：`{ type: "req", id, method, params }`
- **回應**：`{ type: "res", id, ok, payload | error }`
- **事件**：`{ type: "event", event, payload, seq?, stateVersion? }`

第一個框架**必須**是 `connect` 請求。之後，用戶端可以呼叫
方法（例如 `health`、`send`、`chat.send`）並訂閱事件（例如
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

常用方法 + 事件：

| 類別       | 範例                                                       | 備註                               |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| 核心       | `connect`、`health`、`status`                              | `connect` 必須最先送出            |
| 訊息       | `send`、`agent`、`agent.wait`、`system-event`、`logs.tail` | 有副作用的操作需要 `idempotencyKey` |
| 聊天       | `chat.history`、`chat.send`、`chat.abort`                  | WebChat 會使用這些                 |
| 工作階段   | `sessions.list`、`sessions.patch`、`sessions.delete`       | 工作階段管理                       |
| 自動化     | `wake`、`cron.list`、`cron.run`、`cron.runs`               | 喚醒 + cron 控制                   |
| 節點       | `node.list`、`node.invoke`、`node.pair.*`                  | Gateway WS + 節點動作              |
| 事件       | `tick`、`presence`、`agent`、`chat`、`health`、`shutdown`  | 伺服器推送                         |

權威的公開 **discovery** 清單位於
`src/gateway/server-methods-list.ts`（`listGatewayMethods`、`GATEWAY_EVENTS`）。

## 結構描述的位置

- 來源：`src/gateway/protocol/schema.ts`
- 執行階段驗證器（AJV）：`src/gateway/protocol/index.ts`
- 公開的功能/discovery 登錄：`src/gateway/server-methods-list.ts`
- 伺服器握手 + 方法分派：`src/gateway/server.impl.ts`
- Node 用戶端：`src/gateway/client.ts`
- 產生的 JSON Schema：`dist/protocol.schema.json`
- 產生的 Swift 模型：`apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 目前的管線

- `pnpm protocol:gen`
  - 將 JSON Schema（draft-07）寫入 `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - 產生 Swift gateway 模型
- `pnpm protocol:check`
  - 執行兩個產生器，並驗證輸出已提交

## 結構描述在執行階段的使用方式

- **伺服器端**：每個傳入框架都會使用 AJV 驗證。握手只接受 params 符合 `ConnectParams` 的 `connect` 請求。
- **用戶端**：JS 用戶端會在使用事件與回應框架前先驗證。
- **功能 discovery**：Gateway 會在 `hello-ok` 中從 `listGatewayMethods()` 與
  `GATEWAY_EVENTS` 傳送保守的 `features.methods` 和 `features.events` 清單。
- 該 discovery 清單不是 `coreGatewayHandlers` 中每個可呼叫輔助函式的產生式傾印；部分輔助 RPC 實作在
  `src/gateway/server-methods/*.ts` 中，但未列舉於公開功能清單。

## 範例框架

Connect（第一則訊息）：

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

Hello-ok 回應：

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

請求 + 回應：

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

事件：

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## 最小用戶端（Node.js）

最小的實用流程：連線 + health。

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

## 實作範例：端到端新增方法

範例：新增一個 `system.echo` 請求，回傳 `{ ok: true, text }`。

1. **結構描述（真實來源）**

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

將兩者加入 `ProtocolSchemas` 並匯出型別：

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **驗證**

在 `src/gateway/protocol/index.ts` 中，匯出 AJV 驗證器：

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **伺服器行為**

在 `src/gateway/server-methods/system.ts` 中新增處理器：

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

在 `src/gateway/server-methods.ts` 中註冊它（已經合併 `systemHandlers`），
然後將 `"system.echo"` 加入
`src/gateway/server-methods-list.ts` 的 `listGatewayMethods` 輸入。

如果該方法可由 operator 或節點用戶端呼叫，也請在
`src/gateway/method-scopes.ts` 中分類，讓範圍強制執行與 `hello-ok` 功能公開保持一致。

4. **重新產生**

```bash
pnpm protocol:check
```

5. **測試 + 文件**

在 `src/gateway/server.*.test.ts` 中新增伺服器測試，並在文件中記錄該方法。

## Swift 程式碼產生行為

Swift 產生器會輸出：

- `GatewayFrame` enum，包含 `req`、`res`、`event` 和 `unknown` case
- 強型別 payload struct/enum
- `ErrorCode` 值與 `GATEWAY_PROTOCOL_VERSION`

未知框架型別會保留為原始 payload，以支援向前相容。

## 版本化 + 相容性

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/schema.ts`。
- 用戶端會傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕不相符的版本。
- Swift 模型會保留未知框架型別，以避免破壞較舊的用戶端。

## 結構描述模式與慣例

- 多數物件使用 `additionalProperties: false` 來提供嚴格 payload。
- `NonEmptyString` 是 ID 和方法/事件名稱的預設值。
- 最上層 `GatewayFrame` 會在 `type` 上使用 **discriminator**。
- 有副作用的方法通常需要 params 中的 `idempotencyKey`
  （範例：`send`、`poll`、`agent`、`chat.send`）。
- `agent` 接受選用的 `internalEvents`，用於執行階段產生的編排脈絡
  （例如 subagent/cron 工作完成交接）；請將其視為內部 API 介面。

## 即時結構描述 JSON

產生的 JSON Schema 位於 repo 的 `dist/protocol.schema.json`。發布的原始檔通常可在以下位置取得：

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## 變更結構描述時

1. 更新 TypeBox 結構描述。
2. 在 `src/gateway/server-methods-list.ts` 中註冊方法/事件。
3. 當新的 RPC 需要 operator 或節點範圍分類時，更新 `src/gateway/method-scopes.ts`。
4. 執行 `pnpm protocol:check`。
5. 提交重新產生的結構描述 + Swift 模型。

## 相關

- [豐富輸出協定](/zh-TW/reference/rich-output-protocol)
- [RPC 轉接器](/zh-TW/reference/rpc)
