---
read_when:
    - 更新协议 schema 或代码生成
summary: 将 TypeBox schema 作为 Gateway 网关协议的单一真实来源
title: TypeBox
x-i18n:
    generated_at: "2026-04-05T08:22:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f508523998f94d12fbd6ce98d8a7d49fa641913196a4ab7b01f91f83c01c7eb
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox 作为协议的单一真实来源

最后更新：2026-01-10

TypeBox 是一个 TypeScript 优先的 schema 库。我们用它来定义 **Gateway 网关 WebSocket 协议**（握手、请求/响应、服务器事件）。这些 schema 驱动 **运行时验证**、**JSON Schema 导出** 和 macOS 应用的 **Swift 代码生成**。一个真实来源；其他一切都由此生成。

如果你想先了解更高层的协议上下文，请从
[Gateway 网关架构](/concepts/architecture) 开始。

## 心智模型（30 秒）

每条 Gateway 网关 WS 消息都属于以下三种帧之一：

- **请求**：`{ type: "req", id, method, params }`
- **响应**：`{ type: "res", id, ok, payload | error }`
- **事件**：`{ type: "event", event, payload, seq?, stateVersion? }`

第一帧**必须**是 `connect` 请求。之后，客户端可以调用方法（例如 `health`、`send`、`chat.send`）并订阅事件（例如 `presence`、`tick`、`agent`）。

连接流程（最简）：

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

常见方法 + 事件：

| 类别     | 示例                                                       | 说明                             |
| -------- | ---------------------------------------------------------- | -------------------------------- |
| 核心     | `connect`, `health`, `status`                              | `connect` 必须首先发送           |
| 消息     | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | 有副作用的操作需要 `idempotencyKey` |
| 聊天     | `chat.history`, `chat.send`, `chat.abort`                  | WebChat 使用这些                 |
| 会话     | `sessions.list`, `sessions.patch`, `sessions.delete`       | 会话管理                         |
| 自动化   | `wake`, `cron.list`, `cron.run`, `cron.runs`               | wake + cron 控制                 |
| 节点     | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway 网关 WS + 节点操作       |
| 事件     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | 服务器推送                       |

权威的公开 **设备发现** 清单位于
`src/gateway/server-methods-list.ts`（`listGatewayMethods`、`GATEWAY_EVENTS`）。

## schema 存放位置

- 源文件：`src/gateway/protocol/schema.ts`
- 运行时验证器（AJV）：`src/gateway/protocol/index.ts`
- 公开的功能/设备发现注册表：`src/gateway/server-methods-list.ts`
- 服务器握手 + 方法分发：`src/gateway/server.impl.ts`
- 节点客户端：`src/gateway/client.ts`
- 生成的 JSON Schema：`dist/protocol.schema.json`
- 生成的 Swift 模型：`apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 当前流水线

- `pnpm protocol:gen`
  - 将 JSON Schema（draft‑07）写入 `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - 生成 Swift Gateway 网关模型
- `pnpm protocol:check`
  - 运行上述两个生成器并验证输出已提交

## 这些 schema 在运行时如何使用

- **服务器端**：每个入站帧都会用 AJV 验证。握手阶段只接受参数符合 `ConnectParams` 的 `connect` 请求。
- **客户端**：JS 客户端在使用事件帧和响应帧之前会先验证它们。
- **功能发现**：Gateway 网关会在 `hello-ok` 中根据 `listGatewayMethods()` 和 `GATEWAY_EVENTS` 发送保守的 `features.methods` 和 `features.events` 列表。
- 该设备发现列表不是对 `coreGatewayHandlers` 中每个可调用辅助函数的自动生成转储；某些辅助 RPC 是在
  `src/gateway/server-methods/*.ts` 中实现的，但并未枚举进公开功能列表中。

## 示例帧

Connect（第一条消息）：

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

Hello-ok 响应：

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

请求 + 响应：

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

## 最小客户端（Node.js）

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

## 完整示例：端到端添加一个方法

示例：添加一个新的 `system.echo` 请求，返回 `{ ok: true, text }`。

1. **Schema（真实来源）**

添加到 `src/gateway/protocol/schema.ts`：

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

将两者添加到 `ProtocolSchemas`，并导出类型：

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **验证**

在 `src/gateway/protocol/index.ts` 中，导出一个 AJV 验证器：

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **服务器行为**

在 `src/gateway/server-methods/system.ts` 中添加处理器：

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

在 `src/gateway/server-methods.ts` 中注册它（该文件已经合并 `systemHandlers`），然后将 `"system.echo"` 添加到
`src/gateway/server-methods-list.ts` 中 `listGatewayMethods` 的输入里。

如果该方法可供 operator 或节点客户端调用，还需要在
`src/gateway/method-scopes.ts` 中对其进行分类，以保持作用域强制执行与 `hello-ok` 功能公开一致。

4. **重新生成**

```bash
pnpm protocol:check
```

5. **测试 + 文档**

在 `src/gateway/server.*.test.ts` 中添加服务器测试，并在文档中说明该方法。

## Swift 代码生成行为

Swift 生成器会输出：

- 带有 `req`、`res`、`event` 和 `unknown` 分支的 `GatewayFrame` 枚举
- 强类型的负载 struct/enum
- `ErrorCode` 值和 `GATEWAY_PROTOCOL_VERSION`

未知帧类型会以原始负载形式保留，以实现向前兼容。

## 版本控制 + 兼容性

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器会拒绝不匹配的版本。
- Swift 模型会保留未知帧类型，以避免破坏旧客户端。

## Schema 模式和约定

- 大多数对象都使用 `additionalProperties: false`，以确保负载严格。
- `NonEmptyString` 是 ID 和方法/事件名称的默认类型。
- 顶层 `GatewayFrame` 在 `type` 上使用**判别字段**。
- 有副作用的方法通常要求参数中带有 `idempotencyKey`
  （例如：`send`、`poll`、`agent`、`chat.send`）。
- `agent` 接受可选的 `internalEvents`，用于运行时生成的编排上下文
  （例如子智能体/cron 任务完成交接）；请将其视为内部 API 表面。

## 在线 schema JSON

生成的 JSON Schema 位于仓库中的 `dist/protocol.schema.json`。已发布的原始文件通常可在以下地址获取：

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## 当你更改 schema 时

1. 更新 TypeBox schema。
2. 在 `src/gateway/server-methods-list.ts` 中注册该方法/事件。
3. 当新的 RPC 需要 operator 或节点作用域分类时，更新 `src/gateway/method-scopes.ts`。
4. 运行 `pnpm protocol:check`。
5. 提交重新生成的 schema + Swift 模型。
