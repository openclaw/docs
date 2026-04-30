---
read_when:
    - 你正在构建一个与 OpenClaw 通信的外部应用、脚本、仪表板、CI 作业或 IDE 扩展
    - 你正在选择应用 SDK 还是插件 SDK
    - 你正在与 Gateway 网关的智能体运行、会话、事件、审批、模型或工具集成
sidebarTitle: App SDK
summary: 面向外部应用、脚本、仪表盘、CI 作业和 IDE 扩展的公开 OpenClaw 应用 SDK
title: OpenClaw 应用 SDK
x-i18n:
    generated_at: "2026-04-30T01:03:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw 应用 SDK** 是 OpenClaw 进程外应用的公开客户端 API。当脚本、仪表板、CI 作业、IDE 扩展或其他外部应用需要连接到 Gateway 网关、启动智能体运行、流式传输事件、等待结果、取消工作或检查 Gateway 网关资源时，请使用 `@openclaw/sdk`。

<Note>
  应用 SDK 不同于[插件 SDK](/zh-CN/plugins/sdk-overview)。
  `@openclaw/sdk` 从 OpenClaw 外部与 Gateway 网关通信。
  `openclaw/plugin-sdk/*` 仅用于在 OpenClaw 内部运行并注册提供商、渠道、工具、钩子或受信任运行时的插件。
</Note>

## 今天发布的内容

`@openclaw/sdk` 包含：

| 接口                      | Status     | 功能                                                                         |
| ------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | 就绪       | 主客户端入口点。负责传输、连接、请求和事件。                                 |
| `GatewayClientTransport`  | 就绪       | 由 Gateway 网关客户端支持的 WebSocket 传输。                                  |
| `oc.agents`               | 就绪       | 列出、创建、更新、删除和获取智能体句柄。                                     |
| `Agent.run()`             | 就绪       | 启动 Gateway 网关 `agent` 运行并返回 `Run`。                                  |
| `oc.runs`                 | 就绪       | 创建、获取、等待、取消和流式传输运行。                                       |
| `Run.events()`            | 就绪       | 流式传输标准化的逐运行事件，并为快速运行提供重放。                           |
| `Run.wait()`              | 就绪       | 调用 `agent.wait` 并返回稳定的 `RunResult`。                                  |
| `Run.cancel()`            | 就绪       | 按运行 ID 调用 `sessions.abort`，可用时附带会话键。                           |
| `oc.sessions`             | 就绪       | 创建、解析、发送到、修补、压缩和获取会话句柄。                               |
| `Session.send()`          | 就绪       | 调用 `sessions.send` 并返回 `Run`。                                           |
| `oc.models`               | 就绪       | 调用 `models.list` 和当前的 `models.authStatus` Status RPC。                  |
| `oc.tools`                | 部分支持   | 列出工具目录和有效工具；尚未接入直接工具调用。                               |
| `oc.approvals`            | 就绪       | 通过 Gateway 网关审批 RPC 列出和解析 exec 审批。                              |
| `oc.rawEvents()`          | 就绪       | 为高级使用者暴露原始 Gateway 网关事件。                                      |
| `normalizeGatewayEvent()` | 就绪       | 将原始 Gateway 网关事件转换为稳定的 SDK 事件形态。                            |

SDK 还导出这些接口使用的核心类型：
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` 以及相关结果类型。

## 连接到 Gateway 网关

使用显式 Gateway 网关 URL 创建客户端，或为测试和嵌入式应用运行时注入自定义传输。

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` 等同于 `url`。构造函数接受 `gateway: "auto"` 选项，但自动 Gateway 网关设备发现尚不是独立的 SDK 功能；当应用本身还不知道如何发现 Gateway 网关时，请传入 `url`。

对于测试，传入一个实现 `OpenClawTransport` 的对象：

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## 运行智能体

当应用需要智能体句柄时，使用 `oc.agents.get(id)`，然后调用 `agent.run()`。

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

像 `openai/gpt-5.5` 这样的提供商限定模型引用会拆分为 Gateway 网关的 `provider` 和 `model` 覆盖项。`timeoutMs` 在 SDK 中保持为毫秒，并会为 `agent` RPC 转换为 Gateway 网关超时秒数。

`run.wait()` 使用 Gateway 网关的 `agent.wait` RPC。当等待截止时间到期但运行仍处于活动状态时，会返回 `status: "accepted"`，而不是假装运行本身已超时。运行时超时、中止的运行和取消的运行会标准化为 `timed_out` 或 `cancelled`。

## 创建和复用会话

当应用需要持久的转录状态时，请使用会话。

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` 调用 `sessions.send` 并返回 `Run`。会话句柄还支持：

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## 流式传输事件

SDK 会将原始 Gateway 网关事件标准化为稳定的 `OpenClawEvent` 信封：

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: GatewayEvent;
};
```

常见事件类型包括：

| 事件类型              | 来源 Gateway 网关事件                     |
| --------------------- | ----------------------------------------- |
| `run.started`         | `agent` 生命周期开始                      |
| `run.completed`       | `agent` 生命周期结束                      |
| `run.failed`          | `agent` 生命周期错误                      |
| `run.cancelled`       | 已中止/已取消的生命周期结束              |
| `run.timed_out`       | 超时生命周期结束                          |
| `assistant.delta`     | Assistant 流式传输增量                    |
| `assistant.message`   | Assistant 消息                            |
| `thinking.delta`      | 思考或计划流                              |
| `tool.call.started`   | 工具/项目/命令开始                        |
| `tool.call.delta`     | 工具/项目/命令更新                        |
| `tool.call.completed` | 工具/项目/命令完成                        |
| `tool.call.failed`    | 工具/项目/命令失败或被阻止状态            |
| `approval.requested`  | Exec 或插件审批请求                       |
| `approval.resolved`   | Exec 或插件审批解析                       |
| `session.created`     | `sessions.changed` 创建                   |
| `session.updated`     | `sessions.changed` 更新                   |
| `session.compacted`   | `sessions.changed` 压缩                   |
| `task.updated`        | 任务更新事件                              |
| `artifact.updated`    | 补丁流事件                                |
| `raw`                 | 尚未有稳定 SDK 映射的任意事件             |

`Run.events()` 会将事件筛选到一个运行 ID，并为快速运行重放已看到的事件。这意味着以下记录的流程是安全的：

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

对于应用范围的流，请使用 `oc.events()`。对于原始 Gateway 网关帧，请使用 `oc.rawEvents()`。

## 模型、工具和审批

模型助手映射到当前 Gateway 网关方法：

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

工具助手暴露 Gateway 网关目录和有效工具视图：

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

审批助手使用 exec 审批 RPC：

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## 今天明确不支持的内容

SDK 包含我们想要的产品模型名称，但不会静默假装 Gateway 网关 RPC 存在。这些调用目前会抛出明确的不支持错误：

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

逐运行的 `workspace`、`runtime`、`environment` 和 `approvals` 字段已按未来形态进行类型定义，但当前 Gateway 网关不支持在 `agent` RPC 上使用这些覆盖项。如果调用方传入它们，SDK 会在提交运行前抛出错误，避免工作意外使用默认工作区、运行时、环境或审批行为执行。

## 应用 SDK 与插件 SDK

当代码位于 OpenClaw 外部时，使用应用 SDK：

- 启动或观察智能体运行的 Node 脚本
- 调用 Gateway 网关的 CI 作业
- 仪表板和管理面板
- IDE 扩展
- 不需要成为渠道插件的外部桥接
- 使用假的或真实 Gateway 网关传输的集成测试

当代码在 OpenClaw 内部运行时，使用插件 SDK：

- 提供商插件
- 渠道插件
- 工具或生命周期钩子
- Agent harness plugins
- 受信任运行时助手

应用 SDK 代码应从 `@openclaw/sdk` 导入。插件代码应从记录在文档中的 `openclaw/plugin-sdk/*` 子路径导入。不要混用这两种契约。

## 相关文档

- [OpenClaw 应用 SDK API 设计](/zh-CN/reference/openclaw-sdk-api-design)
- [Gateway RPC 参考](/zh-CN/reference/rpc)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [会话](/zh-CN/concepts/session)
- [后台任务](/zh-CN/automation/tasks)
- [ACP agents](/zh-CN/tools/acp-agents)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
