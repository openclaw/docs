---
read_when:
    - 更新协议架构或代码生成
summary: 将 TypeBox 模式作为 Gateway 网关协议的唯一事实来源
title: TypeBox
x-i18n:
    generated_at: "2026-07-11T20:29:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox 是一个以 TypeScript 为先的模式库。OpenClaw 使用它定义 **Gateway WebSocket 协议**（握手、请求/响应、服务器事件）。这些模式用于驱动**运行时验证**（AJV）、**JSON Schema 导出**以及 macOS 应用的 **Swift 代码生成**。它是唯一的事实来源；其他所有内容均由此生成。

如需了解更高层次的协议背景，请从 [Gateway 架构](/zh-CN/concepts/architecture)开始。

## 心智模型（30 秒）

每条 Gateway 网关 WS 消息都是以下三种帧之一：

- **请求**：`{ type: "req", id, method, params }`
- **响应**：`{ type: "res", id, ok, payload | error }`
- **事件**：`{ type: "event", event, payload, seq?, stateVersion? }`

第一帧**必须**是 `connect` 请求。之后，客户端可以调用方法（例如 `health`、`send`、`chat.send`）并订阅事件（例如 `presence`、`tick`、`agent`）。

连接流程（最简）：

```text
客户端                    Gateway 网关
  |---- 请求：connect ------->|
  |<---- 响应：hello-ok -------|
  |<---- 事件：tick -----------|
  |---- 请求：health -------->|
  |<---- 响应：health ---------|
```

常用方法和事件：

| 类别     | 示例                                                       | 说明                                      |
| -------- | ---------------------------------------------------------- | ----------------------------------------- |
| 核心     | `connect`、`health`、`status`                              | `connect` 必须最先发送                    |
| 消息传递 | `send`、`agent`、`agent.wait`、`system-event`、`logs.tail` | 有副作用的方法需要 `idempotencyKey`       |
| 聊天     | `chat.history`、`chat.send`、`chat.abort`                  | WebChat 使用这些方法                      |
| 会话     | `sessions.list`、`sessions.patch`、`sessions.delete`       | 会话管理                                  |
| 自动化   | `wake`、`cron.list`、`cron.run`、`cron.runs`               | 唤醒和 cron 控制                          |
| 节点     | `node.list`、`node.invoke`、`node.pair.*`                  | Gateway 网关 WS 加节点操作                |
| 事件     | `tick`、`presence`、`agent`、`chat`、`health`、`shutdown`  | 服务器推送                                |

权威的已公布**设备发现**清单位于 `src/gateway/server-methods-list.ts`（`listGatewayMethods`、`GATEWAY_EVENTS`）。

## 模式所在位置

- 源导出入口：`packages/gateway-protocol/src/schema.ts` 重新导出 `packages/gateway-protocol/src/schema/*.ts` 下的领域模块（`frames.ts` 包含顶层封装和握手，`agent.ts`、`sessions.ts`、`cron.ts` 等文件分别对应各功能领域）。`protocol-schemas.ts` 是中央 `ProtocolSchemas` 注册表，将模式名称映射到对应的 TypeBox 定义。
- 运行时验证器（AJV）：`packages/gateway-protocol/src/index.ts`
- 已公布的功能/设备发现注册表：`src/gateway/server-methods-list.ts`
- 服务器握手和方法分发：`src/gateway/server.impl.ts`
- 节点客户端：`src/gateway/client.ts`
- 生成的 JSON Schema：`dist/protocol.schema.json`（构建输出，不提交）
- 生成的 Swift 模型：`apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## 当前流水线

- `pnpm protocol:gen` 将 JSON Schema（draft-07）写入 `dist/protocol.schema.json`。
- `pnpm protocol:gen:swift` 生成 Swift Gateway 网关模型。
- `pnpm protocol:check` 运行两个生成器，并验证 Swift 输出已提交（JSON Schema 输出是被 git 忽略的构建产物）。

## 运行时如何使用模式

- **服务器端**：每个入站帧都使用 AJV 验证。握手只接受参数与 `ConnectParams` 匹配的 `connect` 请求。
- **客户端**：JS 客户端会先验证事件帧和响应帧，再使用它们。
- **功能发现**：Gateway 网关在 `hello-ok` 中发送保守的 `features.methods` 和 `features.events` 列表，这些列表来自 `listGatewayMethods()` 和 `GATEWAY_EVENTS`。
- 该设备发现列表并非 `coreGatewayHandlers` 中所有可调用辅助函数的自动生成转储；部分辅助 RPC 实现在 `src/gateway/server-methods/*.ts` 中，但未列入已公布的功能列表。

## 帧示例

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

## 最简客户端（Node.js）

最小可用流程：连接并检查健康状态。

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

## 完整示例：端到端添加方法

示例：添加一个新的 `system.echo` 请求，返回 `{ ok: true, text }`。

1. **模式（事实来源）**

添加到 `packages/gateway-protocol/src/schema/system.ts`（或最匹配的功能模块）：

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

将两者导入 `packages/gateway-protocol/src/schema/protocol-schemas.ts`，添加到 `ProtocolSchemas` 注册表，并导出派生类型：

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **验证**

在 `packages/gateway-protocol/src/index.ts` 中导出 AJV 验证器：

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **服务器行为**

在 `src/gateway/server-methods/system.ts` 中添加处理程序：

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

在 `src/gateway/server-methods.ts` 中注册它（该文件已合并 `systemHandlers`），然后将 `"system.echo"` 添加到 `src/gateway/server-methods-list.ts` 中的 `listGatewayMethods` 输入。

如果操作员或节点客户端可以调用该方法，还应在 `src/gateway/method-scopes.ts` 中对其分类，确保权限范围强制执行与 `hello-ok` 功能公布保持一致。

4. **重新生成**

```bash
pnpm protocol:check
```

5. **测试和文档**

在 `src/gateway/server.*.test.ts` 中添加服务器测试，并在文档中说明该方法。

## Swift 代码生成行为

Swift 生成器会生成：

- 一个 `GatewayFrame` 枚举，包含 `req`、`res`、`event` 和 `unknown` 分支
- 强类型的载荷结构体/枚举
- `ErrorCode` 值、`GATEWAY_PROTOCOL_VERSION` 和 `GATEWAY_MIN_PROTOCOL_VERSION`

未知帧类型会保留为原始载荷，以实现向前兼容。

## 版本控制与兼容性

- `PROTOCOL_VERSION` 位于 `packages/gateway-protocol/src/version.ts`（当前值：`4`）。
- 客户端发送 `minProtocol` 和 `maxProtocol`；如果范围不包含服务器的当前协议版本，服务器会拒绝连接。
- Swift 模型保留未知帧类型，以免破坏旧客户端。

## 模式惯例与约定

- 大多数对象对严格载荷使用 `additionalProperties: false`。
- `NonEmptyString`（`Type.String({ minLength: 1 })`）是 ID 以及方法/事件名称的默认类型。
- 顶层 `GatewayFrame` 在 `type` 上使用**判别字段**。
- 有副作用的方法通常要求参数中包含 `idempotencyKey`（例如 `send`、`poll`、`agent`、`chat.send`）。
- `agent` 接受可选的 `internalEvents`，用于运行时生成的编排上下文（例如子智能体/cron 任务完成交接）；应将其视为内部 API 表面。

## 实时模式 JSON

生成的 JSON Schema 是构建产物，不会提交到仓库。已发布的原始文件通常可在以下位置获取：

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## 更改模式时

1. 更新所属 `packages/gateway-protocol/src/schema/*.ts` 模块中的 TypeBox 模式，并在 `protocol-schemas.ts` 中注册它们。
2. 在 `src/gateway/server-methods-list.ts` 中注册方法/事件。
3. 当新 RPC 需要操作员或节点权限范围分类时，更新 `src/gateway/method-scopes.ts`。
4. 运行 `pnpm protocol:check`。
5. 提交重新生成的 Swift 模型。

## 相关内容

- [富输出协议](/zh-CN/reference/rich-output-protocol)
- [RPC 适配器](/zh-CN/reference/rpc)
