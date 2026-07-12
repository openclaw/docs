---
read_when:
    - 更新通訊協定結構描述或程式碼產生器
summary: 以 TypeBox 結構描述作為閘道通訊協定的唯一真實來源
title: TypeBox
x-i18n:
    generated_at: "2026-07-11T21:17:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox 是一個以 TypeScript 為優先的結構描述函式庫。OpenClaw 使用它來定義 **閘道 WebSocket 協定**（交握、請求／回應、伺服器事件）。這些結構描述用於**執行階段驗證**（AJV）、**JSON Schema 匯出**，以及為 macOS 應用程式進行 **Swift 程式碼產生**。只有一個事實來源；其餘內容皆由此產生。

若要了解更高階的協定脈絡，請先閱讀[閘道架構](/zh-TW/concepts/architecture)。

## 心智模型（30 秒）

每則閘道 WS 訊息都是下列三種框架之一：

- **請求**：`{ type: "req", id, method, params }`
- **回應**：`{ type: "res", id, ok, payload | error }`
- **事件**：`{ type: "event", event, payload, seq?, stateVersion? }`

第一個框架**必須**是 `connect` 請求。之後，用戶端可呼叫方法（例如 `health`、`send`、`chat.send`）並訂閱事件（例如 `presence`、`tick`、`agent`）。

連線流程（最精簡）：

```text
用戶端                    閘道
  |---- 請求：connect ------->|
  |<---- 回應：hello-ok -------|
  |<---- 事件：tick -----------|
  |---- 請求：health -------->|
  |<---- 回應：health ---------|
```

常見方法與事件：

| 類別       | 範例                                                       | 備註                                      |
| ---------- | ---------------------------------------------------------- | ----------------------------------------- |
| 核心       | `connect`、`health`、`status`                              | `connect` 必須最先執行                    |
| 訊息傳遞   | `send`、`agent`、`agent.wait`、`system-event`、`logs.tail` | 有副作用的方法需要 `idempotencyKey`       |
| 聊天       | `chat.history`、`chat.send`、`chat.abort`                  | WebChat 使用這些方法                      |
| 工作階段   | `sessions.list`、`sessions.patch`、`sessions.delete`       | 工作階段管理                              |
| 自動化     | `wake`、`cron.list`、`cron.run`、`cron.runs`               | 喚醒與排程控制                            |
| 節點       | `node.list`、`node.invoke`、`node.pair.*`                  | 閘道 WS 加上節點操作                      |
| 事件       | `tick`、`presence`、`agent`、`chat`、`health`、`shutdown`  | 伺服器推送                                |

具權威性的對外公告**探索**清單位於 `src/gateway/server-methods-list.ts`（`listGatewayMethods`、`GATEWAY_EVENTS`）。

## 結構描述的位置

- 來源彙總入口：`packages/gateway-protocol/src/schema.ts` 會重新匯出 `packages/gateway-protocol/src/schema/*.ts` 下的領域模組（`frames.ts` 負責頂層封套與交握，而 `agent.ts`、`sessions.ts`、`cron.ts` 等則分別對應各功能領域）。`protocol-schemas.ts` 是中央 `ProtocolSchemas` 登錄表，將結構描述名稱對應至其 TypeBox 定義。
- 執行階段驗證器（AJV）：`packages/gateway-protocol/src/index.ts`
- 對外公告的功能／探索登錄表：`src/gateway/server-methods-list.ts`
- 伺服器交握與方法分派：`src/gateway/server.impl.ts`
- 節點用戶端：`src/gateway/client.ts`
- 產生的 JSON Schema：`dist/protocol.schema.json`（建置輸出，不提交）
- 產生的 Swift 模型：`apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## 目前的處理流程

- `pnpm protocol:gen` 會將 JSON Schema（draft-07）寫入 `dist/protocol.schema.json`。
- `pnpm protocol:gen:swift` 會產生 Swift 閘道模型。
- `pnpm protocol:check` 會執行兩個產生器，並驗證 Swift 輸出已提交（JSON Schema 輸出是被 git 忽略的建置成品）。

## 結構描述在執行階段的使用方式

- **伺服器端**：每個傳入框架都會使用 AJV 驗證。交握僅接受參數符合 `ConnectParams` 的 `connect` 請求。
- **用戶端**：JS 用戶端會先驗證事件與回應框架，再加以使用。
- **功能探索**：閘道會在 `hello-ok` 中傳送保守列舉的 `features.methods` 與 `features.events` 清單，其內容來自 `listGatewayMethods()` 與 `GATEWAY_EVENTS`。
- 該探索清單不是 `coreGatewayHandlers` 中所有可呼叫輔助函式的自動產生清單；部分輔助 RPC 實作於 `src/gateway/server-methods/*.ts`，但未列入對外公告的功能清單。

## 框架範例

連線（第一則訊息）：

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

## 最小化用戶端（Node.js）

最精簡的實用流程：連線並檢查健康狀態。

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

## 完整範例：端對端新增方法

範例：新增 `system.echo` 請求，並傳回 `{ ok: true, text }`。

1. **結構描述（事實來源）**

新增至 `packages/gateway-protocol/src/schema/system.ts`（或最相符的功能模組）：

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

將兩者匯入 `packages/gateway-protocol/src/schema/protocol-schemas.ts`，加入 `ProtocolSchemas` 登錄表，並匯出衍生型別：

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **驗證**

在 `packages/gateway-protocol/src/index.ts` 中匯出 AJV 驗證器：

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

在 `src/gateway/server-methods.ts` 中登錄它（該檔案已合併 `systemHandlers`），然後將 `"system.echo"` 加入 `src/gateway/server-methods-list.ts` 中的 `listGatewayMethods` 輸入。

如果操作員或節點用戶端可以呼叫此方法，也請在 `src/gateway/method-scopes.ts` 中將其分類，使範圍強制執行與 `hello-ok` 功能公告保持一致。

4. **重新產生**

```bash
pnpm protocol:check
```

5. **測試與文件**

在 `src/gateway/server.*.test.ts` 中新增伺服器測試，並在文件中記載此方法。

## Swift 程式碼產生行為

Swift 產生器會產生：

- 包含 `req`、`res`、`event` 與 `unknown` 案例的 `GatewayFrame` 列舉
- 強型別酬載結構與列舉
- `ErrorCode` 值、`GATEWAY_PROTOCOL_VERSION` 與 `GATEWAY_MIN_PROTOCOL_VERSION`

未知的框架型別會保留為原始酬載，以維持向前相容性。

## 版本控制與相容性

- `PROTOCOL_VERSION` 位於 `packages/gateway-protocol/src/version.ts`（目前值：`4`）。
- 用戶端會傳送 `minProtocol` 與 `maxProtocol`；如果範圍未包含伺服器目前的協定版本，伺服器會拒絕該範圍。
- Swift 模型會保留未知的框架型別，以免破壞較舊的用戶端。

## 結構描述模式與慣例

- 大多數物件會使用 `additionalProperties: false` 來強制採用嚴格酬載。
- `NonEmptyString`（`Type.String({ minLength: 1 })`）是 ID 與方法／事件名稱的預設型別。
- 頂層 `GatewayFrame` 會對 `type` 使用**鑑別器**。
- 具有副作用的方法通常要求參數中包含 `idempotencyKey`（例如 `send`、`poll`、`agent`、`chat.send`）。
- `agent` 接受選用的 `internalEvents`，供執行階段產生的協調脈絡使用（例如子代理程式／排程工作完成後的移交）；請將其視為內部 API 介面。

## 即時結構描述 JSON

產生的 JSON Schema 是建置成品，不會提交至儲存庫。已發布的原始檔案通常位於：

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## 變更結構描述時

1. 更新所屬 `packages/gateway-protocol/src/schema/*.ts` 模組中的 TypeBox 結構描述，並在 `protocol-schemas.ts` 中登錄。
2. 在 `src/gateway/server-methods-list.ts` 中登錄方法／事件。
3. 當新的 RPC 需要操作員或節點範圍分類時，更新 `src/gateway/method-scopes.ts`。
4. 執行 `pnpm protocol:check`。
5. 提交重新產生的 Swift 模型。

## 相關內容

- [豐富輸出協定](/zh-TW/reference/rich-output-protocol)
- [RPC 配接器](/zh-TW/reference/rpc)
