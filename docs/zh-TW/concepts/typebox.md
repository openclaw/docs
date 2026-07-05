---
read_when:
    - 更新協定結構描述或程式碼產生
summary: TypeBox 結構描述作為閘道通訊協定的單一真實來源
title: TypeBox
x-i18n:
    generated_at: "2026-07-05T11:16:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox 是以 TypeScript 為優先的結構描述函式庫。OpenClaw 使用它定義 **閘道 WebSocket 協定**（握手、請求/回應、伺服器事件）。這些結構描述會驅動 **執行階段驗證**（AJV）、**JSON Schema 匯出**，以及 macOS 應用程式的 **Swift 程式碼產生**。單一事實來源；其他一切都由此產生。

若要了解較高層級的協定脈絡，請從[閘道架構](/zh-TW/concepts/architecture)開始。

## 心智模型（30 秒）

每一則閘道 WS 訊息都是下列三種框架之一：

- **請求**：`{ type: "req", id, method, params }`
- **回應**：`{ type: "res", id, ok, payload | error }`
- **事件**：`{ type: "event", event, payload, seq?, stateVersion? }`

第一個框架**必須**是 `connect` 請求。之後，用戶端會呼叫方法（例如 `health`、`send`、`chat.send`）並訂閱事件（例如 `presence`、`tick`、`agent`）。

連線流程（最小）：

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

常見方法和事件：

| 類別       | 範例                                                       | 備註                                         |
| ---------- | ---------------------------------------------------------- | -------------------------------------------- |
| 核心       | `connect`, `health`, `status`                              | `connect` 必須第一個送出                    |
| 訊息傳遞   | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | 具有副作用的方法需要 `idempotencyKey`       |
| 聊天       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat 使用這些                            |
| 工作階段   | `sessions.list`, `sessions.patch`, `sessions.delete`       | 工作階段管理                                |
| 自動化     | `wake`, `cron.list`, `cron.run`, `cron.runs`               | `wake` 與排程控制                           |
| 節點       | `node.list`, `node.invoke`, `node.pair.*`                  | 閘道 WS 加上節點動作                        |
| 事件       | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | 伺服器推送                                  |

權威的已公告 **探索** 清單位於 `src/gateway/server-methods-list.ts`（`listGatewayMethods`、`GATEWAY_EVENTS`）。

## 結構描述的位置

- 來源 barrel：`packages/gateway-protocol/src/schema.ts` 重新匯出 `packages/gateway-protocol/src/schema/*.ts` 底下的領域模組（`frames.ts` 用於頂層信封與握手，`agent.ts`、`sessions.ts`、`cron.ts` 等則按功能區域劃分）。`protocol-schemas.ts` 是中央 `ProtocolSchemas` 登錄，將結構描述名稱對應到其 TypeBox 定義。
- 執行階段驗證器（AJV）：`packages/gateway-protocol/src/index.ts`
- 已公告的功能/探索登錄：`src/gateway/server-methods-list.ts`
- 伺服器握手與方法分派：`src/gateway/server.impl.ts`
- 節點用戶端：`src/gateway/client.ts`
- 產生的 JSON Schema：`dist/protocol.schema.json`（建置輸出，不提交）
- 產生的 Swift 模型：`apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## 目前管線

- `pnpm protocol:gen` 會將 JSON Schema（draft-07）寫入 `dist/protocol.schema.json`。
- `pnpm protocol:gen:swift` 會產生 Swift 閘道模型。
- `pnpm protocol:check` 會執行兩個產生器，並驗證 Swift 輸出已提交（JSON Schema 輸出是 gitignored 的建置成品）。

## 結構描述在執行階段的使用方式

- **伺服器端**：每個傳入框架都會使用 AJV 驗證。握手只接受參數符合 `ConnectParams` 的 `connect` 請求。
- **用戶端**：JS 用戶端會在使用事件和回應框架之前先驗證它們。
- **功能探索**：閘道會在 `hello-ok` 中傳送保守的 `features.methods` 和 `features.events` 清單，來源是 `listGatewayMethods()` 和 `GATEWAY_EVENTS`。
- 該探索清單不是 `coreGatewayHandlers` 中每個可呼叫輔助函式的產生式傾印；有些輔助 RPC 實作在 `src/gateway/server-methods/*.ts` 中，但不會列入已公告的功能清單。

## 範例框架

Connect（第一則訊息）：

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

請求與回應：

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

最小有用流程：連線 + 健康檢查。

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

範例：新增一個會傳回 `{ ok: true, text }` 的 `system.echo` 請求。

1. **結構描述（事實來源）**

新增到 `packages/gateway-protocol/src/schema/system.ts`（或最接近的相符功能模組）：

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

將兩者匯入 `packages/gateway-protocol/src/schema/protocol-schemas.ts`，加入 `ProtocolSchemas` 登錄，並匯出衍生型別：

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **驗證**

在 `packages/gateway-protocol/src/index.ts` 中，匯出 AJV 驗證器：

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **伺服器行為**

在 `src/gateway/server-methods/system.ts` 中新增處理常式：

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

在 `src/gateway/server-methods.ts` 中註冊它（已合併 `systemHandlers`），然後將 `"system.echo"` 加入 `src/gateway/server-methods-list.ts` 的 `listGatewayMethods` 輸入。

如果該方法可由操作員或節點用戶端呼叫，也請在 `src/gateway/method-scopes.ts` 中分類它，讓範圍強制執行與 `hello-ok` 功能公告保持一致。

4. **重新產生**

```bash
pnpm protocol:check
```

5. **測試與文件**

在 `src/gateway/server.*.test.ts` 中新增伺服器測試，並在文件中註明該方法。

## Swift 程式碼產生行為

Swift 產生器會輸出：

- 含有 `req`、`res`、`event` 和 `unknown` case 的 `GatewayFrame` enum
- 強型別 payload struct/enum
- `ErrorCode` 值、`GATEWAY_PROTOCOL_VERSION` 和 `GATEWAY_MIN_PROTOCOL_VERSION`

未知框架型別會以原始 payload 保留，以維持向前相容性。

## 版本化與相容性

- `PROTOCOL_VERSION` 位於 `packages/gateway-protocol/src/version.ts`（目前值：`4`）。
- 用戶端會傳送 `minProtocol` 和 `maxProtocol`；伺服器會拒絕未包含其目前協定的範圍。
- Swift 模型會保留未知框架型別，以避免破壞較舊的用戶端。

## 結構描述模式與慣例

- 多數物件使用 `additionalProperties: false` 來維持嚴格 payload。
- `NonEmptyString`（`Type.String({ minLength: 1 })`）是 ID 以及方法/事件名稱的預設值。
- 頂層 `GatewayFrame` 會在 `type` 上使用 **discriminator**。
- 具有副作用的方法通常需要在 params 中提供 `idempotencyKey`（範例：`send`、`poll`、`agent`、`chat.send`）。
- `agent` 接受選用的 `internalEvents`，用於執行階段產生的編排脈絡（例如子代理/排程任務完成交接）；請將其視為內部 API 表面。

## 即時結構描述 JSON

產生的 JSON Schema 是建置成品，不會提交到儲存庫。已發布的原始檔通常可在此取得：

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## 變更結構描述時

1. 在所屬的 `packages/gateway-protocol/src/schema/*.ts` 模組中更新 TypeBox 結構描述，並在 `protocol-schemas.ts` 中註冊它們。
2. 在 `src/gateway/server-methods-list.ts` 中註冊方法/事件。
3. 當新的 RPC 需要操作員或節點範圍分類時，更新 `src/gateway/method-scopes.ts`。
4. 執行 `pnpm protocol:check`。
5. 提交重新產生的 Swift 模型。

## 相關

- [豐富輸出協定](/zh-TW/reference/rich-output-protocol)
- [RPC 配接器](/zh-TW/reference/rpc)
