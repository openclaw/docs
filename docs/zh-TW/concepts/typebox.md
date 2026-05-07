---
read_when:
    - 更新通訊協定結構描述或程式碼產生
summary: TypeBox 結構描述作為 Gateway 通訊協定的單一真實來源
title: TypeBox
x-i18n:
    generated_at: "2026-05-07T13:15:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95baccfdfa6f77ba57f6ac8502d502084289a84cfd03a450dd1e9422931706dd
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox 是以 TypeScript 優先的結構描述函式庫。我們用它定義 **Gateway
WebSocket 通訊協定**（交握、請求/回應、伺服器事件）。這些結構描述會驅動**執行階段驗證**、**JSON Schema 匯出**，以及 macOS 應用程式的 **Swift 程式碼生成**。單一事實來源；其他一切皆由此產生。

如果你想了解較高層級的通訊協定背景，請從
[Gateway 架構](/zh-TW/concepts/architecture)開始。

## 心智模型（30 秒）

每個 Gateway WS 訊息都是以下三種框架之一：

- **請求**：`{ type: "req", id, method, params }`
- **回應**：`{ type: "res", id, ok, payload | error }`
- **事件**：`{ type: "event", event, payload, seq?, stateVersion? }`

第一個框架**必須**是 `connect` 請求。之後，客戶端可以呼叫方法（例如 `health`、`send`、`chat.send`）並訂閱事件（例如 `presence`、`tick`、`agent`）。

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
| 核心       | `connect`、`health`、`status`                              | `connect` 必須是第一個             |
| 訊息傳遞   | `send`、`agent`、`agent.wait`、`system-event`、`logs.tail` | 有副作用的操作需要 `idempotencyKey` |
| 聊天       | `chat.history`、`chat.send`、`chat.abort`                  | WebChat 使用這些                   |
| 工作階段   | `sessions.list`、`sessions.patch`、`sessions.delete`       | 工作階段管理                       |
| 自動化     | `wake`、`cron.list`、`cron.run`、`cron.runs`               | 喚醒 + cron 控制                   |
| 節點       | `node.list`、`node.invoke`、`node.pair.*`                  | Gateway WS + 節點動作              |
| 事件       | `tick`、`presence`、`agent`、`chat`、`health`、`shutdown`  | 伺服器推送                         |

權威的公告式**探索**清單位於
`src/gateway/server-methods-list.ts`（`listGatewayMethods`、`GATEWAY_EVENTS`）。

## 結構描述的位置

- 來源：`src/gateway/protocol/schema.ts`
- 執行階段驗證器（AJV）：`src/gateway/protocol/index.ts`
- 公告式功能/探索登錄檔：`src/gateway/server-methods-list.ts`
- 伺服器交握 + 方法分派：`src/gateway/server.impl.ts`
- Node 客戶端：`src/gateway/client.ts`
- 產生的 JSON Schema：`dist/protocol.schema.json`
- 產生的 Swift 模型：`apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 目前的管線

- `pnpm protocol:gen`
  - 將 JSON Schema（draft-07）寫入 `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - 產生 Swift gateway 模型
- `pnpm protocol:check`
  - 執行兩個生成器並驗證輸出已提交

## 結構描述在執行階段如何使用

- **伺服器端**：每個傳入框架都會用 AJV 驗證。交握只接受 params 符合 `ConnectParams` 的 `connect` 請求。
- **客戶端**：JS 客戶端會在使用事件與回應框架前先驗證它們。
- **功能探索**：Gateway 會在來自 `listGatewayMethods()` 和 `GATEWAY_EVENTS` 的 `hello-ok` 中傳送保守的 `features.methods` 與 `features.events` 清單。
- 該探索清單不是 `coreGatewayHandlers` 中每個可呼叫輔助函式的生成傾印；有些輔助 RPC 實作在
  `src/gateway/server-methods/*.ts` 中，但未列舉在公告的功能清單內。

## 範例框架

Connect（第一個訊息）：

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
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
    "protocol": 4,
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

## 最小客戶端（Node.js）

最小有用流程：connect + health。

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
        minProtocol: 4,
        maxProtocol: 4,
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

1. **結構描述（事實來源）**

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

將兩者新增至 `ProtocolSchemas` 並匯出型別：

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

在 `src/gateway/server-methods.ts` 中註冊它（已合併 `systemHandlers`），
然後將 `"system.echo"` 新增至
`src/gateway/server-methods-list.ts` 中的 `listGatewayMethods` 輸入。

如果該方法可由操作員或節點客戶端呼叫，也請在
`src/gateway/method-scopes.ts` 中分類它，讓範圍強制執行與 `hello-ok` 功能公告保持一致。

4. **重新產生**

```bash
pnpm protocol:check
```

5. **測試 + 文件**

在 `src/gateway/server.*.test.ts` 中新增伺服器測試，並在文件中記錄該方法。

## Swift 程式碼生成行為

Swift 生成器會發出：

- 具有 `req`、`res`、`event` 與 `unknown` case 的 `GatewayFrame` enum
- 強型別 payload struct/enum
- `ErrorCode` 值與 `GATEWAY_PROTOCOL_VERSION`

未知框架型別會保留為原始 payload，以維持向前相容性。

## 版本控制 + 相容性

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/version.ts`。
- 客戶端傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕不相符的版本。
- Swift 模型保留未知框架型別，以避免破壞較舊的客戶端。

## 結構描述模式與慣例

- 大多數物件使用 `additionalProperties: false` 以提供嚴格 payload。
- `NonEmptyString` 是 ID 與方法/事件名稱的預設值。
- 頂層 `GatewayFrame` 在 `type` 上使用**鑑別器**。
- 有副作用的方法通常需要 params 中的 `idempotencyKey`
  （範例：`send`、`poll`、`agent`、`chat.send`）。
- `agent` 接受選用的 `internalEvents`，用於執行階段產生的協調情境
  （例如 subagent/cron 任務完成交接）；請將此視為內部 API 介面。

## 即時結構描述 JSON

產生的 JSON Schema 位於 repo 中的 `dist/protocol.schema.json`。已發布的原始檔通常可於以下位置取得：

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## 變更結構描述時

1. 更新 TypeBox 結構描述。
2. 在 `src/gateway/server-methods-list.ts` 中註冊方法/事件。
3. 當新的 RPC 需要操作員或節點範圍分類時，更新 `src/gateway/method-scopes.ts`。
4. 執行 `pnpm protocol:check`。
5. 提交重新產生的結構描述 + Swift 模型。

## 相關

- [豐富輸出通訊協定](/zh-TW/reference/rich-output-protocol)
- [RPC 轉接器](/zh-TW/reference/rpc)
