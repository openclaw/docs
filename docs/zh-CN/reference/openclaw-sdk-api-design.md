---
read_when:
    - 你正在实现拟议的公开 OpenClaw 应用 SDK
    - 你需要应用 SDK 的草案命名空间、事件、结果、工件、审批或安全契约
    - 你正在比较 Gateway 网关协议资源和高级 OpenClaw 应用 SDK 封装器
sidebarTitle: App SDK API design
summary: 公共 OpenClaw 应用 SDK API、事件分类体系、工件、审批和包结构的参考设计
title: OpenClaw 应用 SDK API 设计
x-i18n:
    generated_at: "2026-04-30T00:51:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

本页是公共 [OpenClaw 应用 SDK](/zh-CN/concepts/openclaw-sdk) 的详细 API 参考设计。它有意与 [插件 SDK](/zh-CN/plugins/sdk-overview) 分开。

<Note>
  `@openclaw/sdk` 是用于与 Gateway 网关通信的外部应用/客户端包。`openclaw/plugin-sdk/*` 是进程内插件创作契约。不要从仅需要运行智能体的应用中导入插件 SDK 子路径。
</Note>

公共应用 SDK 应分两层构建：

1. 低层生成式 Gateway 网关客户端。
2. 高层易用封装，包含 `OpenClaw`、`Agent`、`Session`、`Run`、
   `Task`、`Artifact`、`Approval` 和 `Environment` 对象。

## 命名空间设计

低层命名空间应紧密遵循 Gateway 网关资源：

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

高层封装应返回让常见流程更顺手的对象：

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## 事件契约

公共 SDK 应暴露带版本、可重放、已规范化的事件。

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
  raw?: unknown;
};
```

`id` 是重放游标。消费者应能通过 `events({ after: id })` 重新连接，并在保留策略允许时接收错过的事件。

建议的规范化事件族：

| 事件                  | 含义                                               |
| --------------------- | -------------------------------------------------- |
| `run.created`         | Run 已接受。                                      |
| `run.queued`          | Run 正在等待会话通道、运行时或环境。              |
| `run.started`         | 运行时已开始执行。                                |
| `run.completed`       | Run 已成功完成。                                  |
| `run.failed`          | Run 以错误结束。                                  |
| `run.cancelled`       | Run 已取消。                                      |
| `run.timed_out`       | Run 超过了超时时间。                              |
| `assistant.delta`     | Assistant 文本增量。                              |
| `assistant.message`   | 完整的 assistant 消息或替换内容。                 |
| `thinking.delta`      | 在策略允许暴露时的推理或计划增量。               |
| `tool.call.started`   | 工具调用已开始。                                  |
| `tool.call.delta`     | 工具调用流式传输了进度或部分输出。               |
| `tool.call.completed` | 工具调用已成功返回。                              |
| `tool.call.failed`    | 工具调用失败。                                    |
| `approval.requested`  | Run 或工具需要审批。                              |
| `approval.resolved`   | 审批已获准、被拒绝、已过期或已取消。             |
| `question.requested`  | 运行时向用户或宿主应用请求输入。                 |
| `question.answered`   | 宿主应用提供了答案。                              |
| `artifact.created`    | 新工件可用。                                      |
| `artifact.updated`    | 现有工件已更改。                                  |
| `session.created`     | 会话已创建。                                      |
| `session.updated`     | 会话元数据已更改。                                |
| `session.compacted`   | 会话压缩已发生。                                  |
| `task.updated`        | 后台任务状态已更改。                              |
| `git.branch`          | 运行时观察到或更改了分支状态。                   |
| `git.diff`            | 运行时生成或更改了 diff。                         |
| `git.pr`              | 运行时打开、更新或关联了拉取请求。               |

运行时原生载荷应可通过 `raw` 获取，但应用不应为了普通 UI 而解析 `raw`。

## 结果契约

`Run.wait()` 应返回稳定的结果信封：

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

结果应朴素且稳定。时间戳值保留 Gateway 网关形态，因此当前由生命周期支持的 run 通常报告 epoch 毫秒数字，而适配器可能仍会暴露 ISO 字符串。富 UI、工具轨迹和运行时原生细节属于事件和工件。

`accepted` 是非终止等待结果：它表示 Gateway 网关等待截止时间在 run 产生生命周期结束/错误之前到期。不得将其视为 `timed_out`；`timed_out` 仅保留给超过自身运行时超时的 run。

## 审批和问题

审批必须是一等能力，因为编码智能体会不断跨越安全边界。

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

审批事件应携带：

- 审批 ID
- run ID 和会话 ID
- 请求类型
- 请求操作摘要
- 工具名称或环境操作
- 风险级别
- 可用决策
- 过期时间
- 决策是否可以复用

问题与审批分开。问题向用户或宿主应用请求信息。审批请求执行某个操作的权限。

## ToolSpace 模型

应用需要在不导入插件内部机制的情况下理解工具表面。

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK 应暴露：

- 规范化工具元数据
- 来源：OpenClaw、MCP、插件、渠道、运行时或应用
- schema 摘要
- 审批策略
- 运行时兼容性
- 工具是否隐藏、只读、具备写能力或具备宿主能力

通过 SDK 调用工具应是显式且限定范围的。大多数应用应运行智能体，而不是直接调用任意工具。

## 工件模型

工件应覆盖的不只是文件。

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

常见示例：

- 文件编辑和生成文件
- patch 包
- VCS diff
- 截图和媒体输出
- 日志和跟踪包
- 拉取请求链接
- 运行时轨迹
- 托管环境工作区快照

工件访问应支持脱敏、保留策略和下载 URL，而不假设每个工件都是普通本地文件。

## 安全模型

应用 SDK 必须明确权限。

建议的令牌作用域：

| 作用域              | 允许                                               |
| ------------------- | -------------------------------------------------- |
| `agent.read`        | 列出并检查智能体。                                 |
| `agent.run`         | 启动 run。                                         |
| `session.read`      | 读取会话元数据和消息。                             |
| `session.write`     | 创建会话、发送到会话、派生会话、压缩会话和中止会话。 |
| `task.read`         | 读取后台任务状态。                                 |
| `task.write`        | 取消或修改任务通知策略。                           |
| `approval.respond`  | 批准或拒绝请求。                                   |
| `tools.invoke`      | 直接调用已暴露工具。                               |
| `artifacts.read`    | 列出并下载工件。                                   |
| `environment.write` | 创建或销毁托管环境。                               |
| `admin`             | 管理操作。                                         |

默认值：

- 默认不转发密钥
- 不允许不受限制的环境变量透传
- 使用密钥引用而不是密钥值
- 显式沙箱和网络策略
- 显式远程环境保留策略
- 除非策略能证明无需审批，否则宿主执行需要审批
- 原始运行时事件在离开 Gateway 网关之前会被脱敏，除非调用方拥有更强的诊断作用域

## 托管环境提供商

托管智能体应实现为环境提供商。

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

第一个实现不需要是托管 SaaS。它可以面向现有节点主机、临时工作区、CI 风格的 runner 或 Testbox 风格的环境。重要契约是：

1. 准备工作区
2. 绑定安全环境和密钥
3. 启动 run
4. 流式传输事件
5. 收集工件
6. 按策略清理或保留

一旦这稳定下来，托管云服务就可以实现相同的提供商契约。

## 包结构

建议的包：

| 包                      | 用途                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `@openclaw/sdk`         | 公共高层 SDK 和生成式低层 Gateway 网关客户端。              |
| `@openclaw/sdk-react`   | 面向仪表板和应用构建者的可选 React hooks。                  |
| `@openclaw/sdk-testing` | 面向应用集成的测试助手和假 Gateway 网关服务器。             |

仓库已经有用于插件的 `openclaw/plugin-sdk/*`。保持该命名空间分离，以免让插件作者和应用开发者混淆。

## 生成客户端策略

低层客户端应从版本化的 Gateway 网关协议 schema 生成，然后由手写的易用类进行包装。

分层：

1. Gateway 网关 schema 作为事实来源。
2. 生成的低层 TypeScript 客户端。
3. 用于外部输入和事件 payload 的运行时验证器。
4. 高层 `OpenClaw`、`Agent`、`Session`、`Run`、`Task` 和 `Artifact`
   包装器。
5. 能力扩展手册示例和集成测试。

好处：

- 协议漂移清晰可见
- 测试可以将生成的方法与 Gateway 网关导出进行比较
- 应用 SDK 保持独立于插件 SDK 内部机制
- 低层消费者仍可完整访问协议
- 高层消费者获得小而精的产品 API

## 相关文档

- [OpenClaw 应用 SDK](/zh-CN/concepts/openclaw-sdk)
- [Gateway 网关 RPC 参考](/zh-CN/reference/rpc)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [后台任务](/zh-CN/automation/tasks)
- [ACP 智能体](/zh-CN/tools/acp-agents)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
