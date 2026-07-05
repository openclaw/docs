---
read_when:
    - 更新协议架构或代码生成
summary: TypeBox schema 作为 Gateway 网关协议的唯一事实来源
title: TypeBox
x-i18n:
    generated_at: "2026-07-05T11:14:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox 是一个 TypeScript 优先的架构库。OpenClaw 使用它来定义 **Gateway 网关 WebSocket 协议**（握手、请求/响应、服务器事件）。这些架构驱动 **运行时验证**（AJV）、**JSON Schema 导出**，以及面向 macOS 应用的 **Swift 代码生成**。单一事实来源；其他一切都由它生成。

如需了解更高层的协议背景，请从 [Gateway 网关架构](/zh-CN/concepts/architecture) 开始。

## 心智模型（30 秒）

每条 Gateway 网关 WS 消息都是以下三种帧之一：

- **请求**：`{ type: "req", id, method, params }`
- **响应**：`{ type: "res", id, ok, payload | error }`
- **事件**：`{ type: "event", event, payload, seq?, stateVersion? }`

第一帧**必须**是 `connect` 请求。之后，客户端调用方法（例如 `health`、`send`、`chat.send`）并订阅事件（例如 `presence`、`tick`、`agent`）。

连接流程（最小）：

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

常用方法和事件：

| 类别       | 示例                                                       | 说明                                         |
| ---------- | ---------------------------------------------------------- | -------------------------------------------- |
| 核心       | `connect`、`health`、`status`                              | `connect` 必须最先调用                      |
| 消息       | `send`、`agent`、`agent.wait`、`system-event`、`logs.tail` | 有副作用的方法需要 `idempotencyKey`          |
| 聊天       | `chat.history`、`chat.send`、`chat.abort`                  | WebChat 使用这些                            |
| 会话       | `sessions.list`、`sessions.patch`、`sessions.delete`       | 会话管理                                     |
| 自动化     | `wake`、`cron.list`、`cron.run`、`cron.runs`               | 唤醒和 cron 控制                            |
| 节点       | `node.list`、`node.invoke`、`node.pair.*`                  | Gateway 网关 WS 加节点操作                  |
| 事件       | `tick`、`presence`、`agent`、`chat`、`health`、`shutdown`  | 服务器推送                                   |

权威的已公布**设备发现**清单位于 `src/gateway/server-methods-list.ts`（`listGatewayMethods`、`GATEWAY_EVENTS`）。

## 架构所在位置

- 源 barrel：`packages/gateway-protocol/src/schema.ts` 会重新导出 `packages/gateway-protocol/src/schema/*.ts` 下的领域模块（顶层信封和握手在 `frames.ts`，每个功能领域分别在 `agent.ts`、`sessions.ts`、`cron.ts` 等）。`protocol-schemas.ts` 是中央 `ProtocolSchemas` 注册表，将架构名称映射到其 TypeBox 定义。
- 运行时验证器（AJV）：`packages/gateway-protocol/src/index.ts`
- 已公布的功能/设备发现注册表：`src/gateway/server-methods-list.ts`
- 服务器握手和方法分发：`src/gateway/server.impl.ts`
- Node 客户端：`src/gateway/client.ts`
- 生成的 JSON Schema：`dist/protocol.schema.json`（构建输出，不提交）
- 生成的 Swift 模型：`apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## 当前流水线

- `pnpm protocol:gen` 将 JSON Schema（draft-07）写入 `dist/protocol.schema.json`。
- `pnpm protocol:gen:swift` 生成 Swift Gateway 网关模型。
- `pnpm protocol:check` 运行两个生成器，并验证 Swift 输出已提交（JSON Schema 输出是被 git 忽略的构建产物）。

## 运行时如何使用架构

- **服务器端**：每个入站帧都会用 AJV 验证。握手只接受参数匹配 `ConnectParams` 的 `connect` 请求。
- **客户端端**：JS 客户端会先验证事件帧和响应帧，然后再使用它们。
- **功能设备发现**：Gateway 网关 会在 `hello-ok` 中发送保守的 `features.methods` 和 `features.events` 列表，来源于 `listGatewayMethods()` 和 `GATEWAY_EVENTS`。
- 该设备发现列表不是 `coreGatewayHandlers` 中每个可调用 helper 的生成转储；一些 helper RPC 在 `src/gateway/server-methods/*.ts` 中实现，但未被枚举到已公布的功能列表中。

## 示例帧

连接（第一条消息）：

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

Hello-ok 响应：

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

请求和响应：

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

最小有用流程：连接 + 健康检查。

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

## 完整示例：端到端添加一个方法

示例：添加一个新的 `system.echo` 请求，返回 `{ ok: true, text }`。

1. **架构（事实来源）**

添加到 `packages/gateway-protocol/src/schema/system.ts`（或最接近的匹配功能模块）：

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

将二者导入 `packages/gateway-protocol/src/schema/protocol-schemas.ts`，添加到 `ProtocolSchemas` 注册表，并导出派生类型：

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **验证**

在 `packages/gateway-protocol/src/index.ts` 中，导出一个 AJV 验证器：

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **服务器行为**

在 `src/gateway/server-methods/system.ts` 中添加 handler：

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

在 `src/gateway/server-methods.ts` 中注册它（已经合并 `systemHandlers`），然后将 `"system.echo"` 添加到 `src/gateway/server-methods-list.ts` 中的 `listGatewayMethods` 输入。

如果该方法可由操作员或节点客户端调用，也要在 `src/gateway/method-scopes.ts` 中对它进行分类，以便权限范围强制执行和 `hello-ok` 功能公布保持一致。

4. **重新生成**

```bash
pnpm protocol:check
```

5. **测试和文档**

在 `src/gateway/server.*.test.ts` 中添加服务器测试，并在文档中说明该方法。

## Swift 代码生成行为

Swift 生成器会生成：

- 一个包含 `req`、`res`、`event` 和 `unknown` case 的 `GatewayFrame` 枚举
- 强类型 payload 结构体/枚举
- `ErrorCode` 值、`GATEWAY_PROTOCOL_VERSION` 和 `GATEWAY_MIN_PROTOCOL_VERSION`

未知帧类型会作为原始 payload 保留，以实现前向兼容。

## 版本控制和兼容性

- `PROTOCOL_VERSION` 位于 `packages/gateway-protocol/src/version.ts`（当前值：`4`）。
- 客户端发送 `minProtocol` 和 `maxProtocol`；服务器会拒绝不包含其当前协议版本的范围。
- Swift 模型会保留未知帧类型，以避免破坏较旧客户端。

## 架构模式和约定

- 大多数对象使用 `additionalProperties: false` 来实现严格 payload。
- `NonEmptyString`（`Type.String({ minLength: 1 })`）是 ID 和方法/事件名称的默认类型。
- 顶层 `GatewayFrame` 在 `type` 上使用**判别器**。
- 有副作用的方法通常要求参数中包含 `idempotencyKey`（示例：`send`、`poll`、`agent`、`chat.send`）。
- `agent` 接受可选的 `internalEvents`，用于运行时生成的编排上下文（例如子智能体/cron 任务完成移交）；将其视为内部 API 表面。

## 实时架构 JSON

生成的 JSON Schema 是构建产物，不提交到仓库。已发布的原始文件通常可在以下位置获取：

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## 更改架构时

1. 更新所属 `packages/gateway-protocol/src/schema/*.ts` 模块中的 TypeBox 架构，并在 `protocol-schemas.ts` 中注册它们。
2. 在 `src/gateway/server-methods-list.ts` 中注册方法/事件。
3. 当新的 RPC 需要操作员或节点权限范围分类时，更新 `src/gateway/method-scopes.ts`。
4. 运行 `pnpm protocol:check`。
5. 提交重新生成的 Swift 模型。

## 相关

- [富输出协议](/zh-CN/reference/rich-output-protocol)
- [RPC 适配器](/zh-CN/reference/rpc)
