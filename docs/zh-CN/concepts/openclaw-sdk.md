---
read_when:
    - 你正在设计或实现一个公开的 OpenClaw 应用 SDK
    - 你正在将 OpenClaw 智能体 API 与 Cursor、Claude Agent SDK、OpenAI Agents、Google ADK、OpenCode、Codex 或 ACP 进行比较
    - 你需要判断某项功能应归属于公共应用 SDK、插件 SDK、Gateway 网关协议、ACP 后端，还是托管环境层。
sidebarTitle: App SDK
summary: 面向外部应用、脚本、仪表板、CI 作业和 IDE 扩展的公共 OpenClaw 应用 SDK 设计
title: OpenClaw 应用 SDK
x-i18n:
    generated_at: "2026-04-30T00:51:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 227d3baf3aaf54bf35288214b051e2e284280165e1283d476594feda26d56bb9
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

本页是公开 **OpenClaw 应用 SDK** 的设计提案。它与现有的[插件 SDK](/zh-CN/plugins/sdk-overview) 分开。

<Note>
  当外部应用、脚本、仪表板、CI 作业或 IDE
  扩展想通过 Gateway 网关运行并观测 OpenClaw 智能体时，请使用 `@openclaw/sdk`。只有在编写运行于 OpenClaw 内部的插件时，才使用
  `openclaw/plugin-sdk/*`。
</Note>

插件 SDK 面向运行于 OpenClaw 内部并扩展提供商、渠道、工具、钩子和可信运行时的代码。应用 SDK 应面向希望通过稳定公开 API 运行并观测 OpenClaw 智能体的外部应用、脚本、仪表板、CI 作业、IDE 扩展和自动化系统。

## Status

架构草案。

本文档记录了对以下智能体 SDK 和运行时表面进行比较评审后形成的设计方向：

| 项目                | 有用经验                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cursor SDK cookbook | 最佳高级产品 API：`Agent`、`Run`、本地和云端运行时、流式传输、取消、模型发现、代码库、制品以及云端 pull request 流程。    |
| Claude Agent SDK    | 强大的双向会话客户端、中断和 Steering 支持、权限模式、钩子、自定义工具、会话存储以及可恢复转录。                        |
| OpenAI Agents SDK   | 强大的工作流概念：交接、护栏、人工审批、追踪、运行状态、流式结果对象以及中断后的恢复。                             |
| Google ADK          | 强大的内部架构：运行器、会话服务、记忆服务、制品服务、凭证服务、插件、事件操作以及长时间运行工具确认。  |
| OpenCode            | 强大的客户端/服务器形态：生成的 API 客户端、REST 加 SSE、会话、工作区、worktree、权限、问题、文件、VCS、PTY、工具、智能体、Skills 和 MCP。 |
| Codex               | 强大的本地运行时边界：审批、沙箱隔离、网络策略、本地和远程 exec 服务器、结构化协议事件以及线程感知的 app-server 会话。     |
| ACP and acpx        | 面向外部编码 harness 的强互操作层，支持命名会话、提示队列、协作式取消和运行时适配器。                            |

建议是在 OpenCode 风格生成式 Gateway 网关客户端之上构建一个像 Cursor 一样简单的公开门面，同时在适合的地方将 Claude、OpenAI Agents、ADK、Codex 和 ACP 概念保留为内部设计参考。

## 目标

- 为应用开发者提供一个小型高级 API，用于运行 OpenClaw 智能体。
- 保持本地优先的 OpenClaw 作为默认运行时。
- 将云端或托管环境作为增量式环境提供商，而不是不同的智能体 API。
- 保留现有 OpenClaw 边界：Gateway 网关拥有公开协议，插件 SDK 拥有进程内扩展，ACP 拥有外部 harness 互操作。
- 将 `stream`、`wait`、`cancel`、`resume`、`fork`、制品、审批和后台任务作为一等操作来支持。
- 暴露稳定的规范化事件，同时为高级消费者保留运行时原生原始事件。
- 明确 SDK 权限、密钥转发、审批、沙箱隔离和远程环境。
- 让公开契约足够小，便于文档化、测试、版本化和生成。

## 非目标

- 不将 `openclaw/plugin-sdk/*` 暴露为应用 SDK。
- 不让 ACP 成为唯一的运行时模型。
- 不要求必须有云服务后 SDK 才有用。
- 不精确克隆 Cursor、Claude、OpenAI、ADK、OpenCode、Codex 或 ACP API。
- 不将无界的 `any` 事件载荷作为唯一公开契约暴露。
- 除非所选环境确实可以强制执行，否则不承诺外部 harness 的沙箱或网络隔离。
- 不让插件作者在插件运行时代码中依赖应用 SDK 对象。

## OpenClaw 当前适配情况

OpenClaw 已经具备大部分基础：

| 现有表面                                            | 贡献内容                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Agent loop](/zh-CN/concepts/agent-loop)                  | `agent` 和 `agent.wait` 运行生命周期、流式传输、超时和会话序列化。                                     |
| [Agent Runtimes](/zh-CN/concepts/agent-runtimes)          | 提供商、模型、运行时和渠道分离。                                                                          |
| [ACP agents](/zh-CN/tools/acp-agents)                     | 面向 Claude Code、Cursor、Gemini CLI、OpenCode、显式 Codex ACP 以及类似工具的外部 harness 会话。            |
| [后台任务](/zh-CN/automation/tasks)                       | 面向 ACP、子智能体、cron、CLI 操作和异步媒体作业的分离式活动账本。                                   |
| [子智能体](/zh-CN/tools/subagents)                        | 隔离的后台智能体运行、可选的 fork 上下文，以及向请求方会话回传。                              |
| [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness) | 面向 Codex 等嵌入式 harness 的可信原生运行时注册。                                                  |
| Gateway 网关协议 schema                             | 当前用于智能体参数、会话、订阅、中止、压缩和检查点的类型化方法与事件定义。 |

缺口不是智能体执行。缺口是这些组件之上的稳定、友好的公开门面。

## 核心模型

应用 SDK 应使用一小组稳定名词。

| 名词          | 含义                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `OpenClaw`    | 客户端入口点。拥有 Gateway 网关发现、认证、低层客户端访问和命名空间工厂。                        |
| `Agent`       | 已配置的执行者。携带智能体 ID、默认模型、默认运行时、默认工具策略和面向应用的辅助方法。           |
| `Session`     | 持久转录、路由、工作区、上下文和运行时绑定。                                                      |
| `Run`         | 一次提交的轮次或任务。流式传输事件、等待结果、取消并暴露制品。                              |
| `Task`        | 分离式或后台活动账本条目。覆盖子智能体、ACP 派生、cron 作业、CLI 运行和异步作业。           |
| `Artifact`    | 文件、补丁、diff、媒体、日志、轨迹、pull request、截图和生成的 bundle。                       |
| `Environment` | 运行执行的位置：本地 Gateway 网关、本地工作区、节点主机、ACP harness、托管运行器或未来的云工作区。 |
| `ToolSpace`   | 有效工具表面：OpenClaw 工具、MCP 服务器、渠道工具、应用工具、审批规则和工具元数据。      |
| `Approval`    | 由运行、工具、环境或 harness 请求的人工或策略决策。                                                |

这些名词能够清晰映射到现有 OpenClaw 概念，同时避免泄露实现特定名称，例如 PI 运行器内部机制、插件 harness 注册或 ACP 适配器细节。

## 产品形态

高级 SDK 应该像这样使用：

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({ gateway: "auto" });
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
});

for await (const event of run.events()) {
  if (event.type === "assistant.delta") {
    process.stdout.write(event.text);
  }
}

const result = await run.wait();
console.log(result.status);
```

同一个应用应该能够使用持久会话：

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

当前实现说明：`@openclaw/sdk` 从现有的 Gateway 网关后端表面开始。像 `openai/gpt-5.5` 这样的提供商限定模型引用会拆分为 Gateway 网关 `provider` 和 `model` 覆盖项。按运行指定的 `workspace`、`runtime`、`environment` 和 `approvals` 选择仍是设计目标；当调用方设置这些选项时，客户端会抛出错误，以免请求静默地使用默认值执行。任务、制品、环境和通用工具调用辅助方法也已搭建为未来 API 形态，并会在 Gateway 网关 RPC 存在前抛出明确的不支持错误。

同一个 API 还应该能够使用外部 ACP harness：

```typescript
const run = await oc.runs.create({
  input: "Deep review this repository and return only high-risk findings.",
  workspace: { cwd: process.cwd() },
  runtime: { type: "acp", harness: "claude" },
  mode: "task",
});
```

托管环境不应改变顶层 API：

```typescript
const run = await agent.run({
  input: "Run the full changed gate and summarize failures.",
  workspace: { repo: "openclaw/openclaw", ref: "main" },
  runtime: {
    type: "managed",
    provider: "testbox",
    timeoutMinutes: 90,
  },
});
```

## 运行时选择

应用 SDK 应将运行时选择暴露为规范化 union：

```typescript
type RuntimeSelection =
  | "auto"
  | { type: "embedded"; id: "pi" | "codex" | string }
  | { type: "cli"; id: "claude-cli" | string }
  | { type: "acp"; harness: "claude" | "cursor" | "gemini" | "opencode" | string }
  | { type: "managed"; provider: "local" | "node" | "testbox" | "cloud" | string };
```

规则：

- `auto` 遵循 OpenClaw 运行时选择规则。
- `embedded` 指向通过插件 SDK 注册的可信进程内 harness，例如 `pi` 或 `codex`。
- `cli` 在可用时指向 OpenClaw 拥有的 CLI 后端执行。
- `acp` 通过 ACP/acpx 指向外部 harness。
- `managed` 指向环境提供商，并且仍可能在该环境内运行嵌入式、CLI 或 ACP 运行时。

运行时选择对象应该是描述性的。它不应该成为隐藏密钥处理、沙箱策略或工作区预配的地方。

## 环境模型

环境是执行基础层。它应该是显式的，因为本地 CLI 运行、外部 harness、节点主机和云工作区具有不同的安全性与生命周期属性。

```typescript
type EnvironmentSelection =
  | { type: "local"; cwd?: string }
  | { type: "gateway"; url?: string; cwd?: string }
  | { type: "node"; nodeId: string; cwd?: string }
  | { type: "managed"; provider: string; repo?: string; ref?: string }
  | { type: "ephemeral"; provider: string; repo?: string; ref?: string };
```

环境拥有：

- checkout 或工作区准备
- 进程和文件访问
- 沙箱和网络强制执行
- 环境变量和密钥引用
- 日志、追踪和制品
- 清理和保留
- 运行时可用性

这种分离让托管智能体成为 SDK 的自然扩展。托管智能体是在托管环境中的普通运行，而不是特殊的产品分支。

详细的命名空间、事件、结果、审批、制品、安全、包和环境提供商契约位于
[OpenClaw 应用 SDK API 设计](/zh-CN/reference/openclaw-sdk-api-design)。

## 实践手册计划

SDK 应随附能力扩展手册，而不只是参考文档。

推荐示例：

| 示例                         | 展示内容                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| 快速开始                     | 创建客户端、运行智能体、流式传输输出、等待结果。                                             |
| 编码智能体 CLI               | 本地工作区、模型选择器、取消、审批、JSON 输出。                                              |
| 智能体仪表盘                 | 会话、运行、后台任务、工件、事件回放、Status 筛选器。                                        |
| 应用构建器                   | 智能体在预览服务器并行运行时编辑工作区。                                                     |
| 拉取请求审查器               | 针对仓库引用运行，收集 diff 评论和工件。                                                     |
| 审批控制台                   | 订阅审批，并从 UI 回答审批。                                                                |
| ACP harness 运行器           | 使用同一个 `Run` API 通过 ACP 运行 Claude Code、Cursor、Gemini CLI 或 OpenCode。             |
| 托管环境提供商               | 最小提供商，用于准备工作区、流式传输事件、保存工件并清理。                                   |
| Slack 或 Discord 桥接        | 外部应用接收事件并发布进度摘要，而不成为渠道插件。                                           |
| 多智能体研究                 | 生成并行运行、收集工件，并综合生成最终报告。                                                 |

能力扩展手册示例应优先使用高级 API。低级生成式
客户端示例应放在高级章节中。

## 分阶段实现

### 阶段 0：RFC 与词汇

- 就公开名词和名称达成一致。
- 决定包名。
- 定义第一版事件分类法。
- 在文档中标记当前 Plugin SDK 是有意分离的。

### 阶段 1：低级生成式客户端

- 从 Gateway 网关协议 schema 生成 TypeScript 客户端。
- 优先覆盖 `agent`、`agent.wait`、会话、订阅、中止和任务。
- 添加冒烟测试，确保生成的方法匹配 Gateway 网关方法名称和 schema
  形状。
- 以实验性或内部包发布。

### 阶段 2：高级运行 API

- 添加 `OpenClaw`、`Agent`、`Session` 和 `Run`。
- 支持 `run.events()`、`run.wait()` 和 `run.cancel()`。
- 支持本地 Gateway 网关发现和显式 Gateway 网关 URL。
- 支持持久会话和会话发送。

### 阶段 3：规范化事件投影

- 在现有原始事件旁边添加 Gateway 网关侧的规范化事件投影。
- 在策略允许的情况下保留原始运行时事件。
- 添加回放游标和重连行为。
- 将 PI、Codex、ACP 和任务事件映射到稳定分类法。

### 阶段 4：工件与审批

- 添加工件列表和下载。
- 添加审批订阅和响应辅助函数。
- 添加问题订阅和响应辅助函数。
- 添加能力扩展手册审批控制台。

### 阶段 5：环境提供商

- 引入本地、节点和托管环境提供商契约。
- 从一个操作上已存在的环境开始。
- 添加工作区准备、日志、工件、超时、清理和保留。

### 阶段 6：云风格工作流

- 添加面向仓库和分支的运行。
- 添加拉取请求工件。
- 添加按仓库、分支、Status 和负责人分组的运行看板。
- 添加长期运行的托管会话和保留策略。

## 可借鉴的设计选择

借鉴这些思路：

- 来自 Cursor：`Agent` 加 `Run`、本地与云端对称、模型发现、
  工件，以及由能力扩展手册驱动的新手引导。
- 来自 Claude Agent SDK：双向客户端、中断、权限、钩子、
  自定义工具、会话存储和恢复语义。
- 来自 OpenAI Agents：交接、防护栏、人工审批恢复、追踪，以及
  结构化的流式传输结果对象。
- 来自 Google ADK：runner 背后的服务、事件动作、记忆、工件、
  凭证服务，以及围绕运行生命周期的插件拦截。
- 来自 OpenCode：生成式协议客户端、REST 加 SSE、会话、
  工作区、问题、权限、文件、VCS、PTY、MCP、智能体和 Skills。
- 来自 Codex：显式沙箱、审批、网络、本地和远程执行，以及
  应用服务器线程边界。
- 来自 ACP 和 acpx：基于适配器的外部 harness 互操作性和命名
  prompt 队列。

## 应避免的设计选择

避免这些陷阱：

- 只是 Gateway 网关内部机制的薄封装公开 SDK。
- 导入 Plugin SDK 子路径的公开 SDK。
- 事件只有 `stream` 加 `data` 的公开 SDK。
- 让本地 OpenClaw 感觉像旧版模式的云优先 API。
- 隐藏在模型 ID 前缀中的运行时选择。
- 隐藏在环境映射中的密钥转发。
- 每次运行顶层都有 ACP 特定选项。
- 所选运行时无法强制执行的沙箱标志。
- 一个 SDK 对象同时试图成为提供商插件、渠道插件、应用客户端
  和托管 runner。

## 未决问题

- 初始包应放在此仓库中，还是单独的 SDK 仓库中？
- 低级生成式客户端是否应在高级包装器稳定之前公开发布？
- 第一个受支持的应用认证机制是什么：本地令牌、管理员令牌、
  OAuth 设备流，还是已签名的应用注册？
- SDK 默认应暴露多少会话消息历史？
- 托管环境应仅在 Gateway 网关配置中配置，还是 SDK
  调用方也可以使用作用域令牌直接请求？
- 本地运行生成的工件适用哪些保留规则？
- 哪些事件载荷在交付给应用之前需要脱敏？
- `Run` 应覆盖普通聊天轮次和分离任务，还是分离的后台工作应始终返回
  一个带有嵌套 `Run` 的 `Task` 包装器？

## 相关文档

- [Agent loop](/zh-CN/concepts/agent-loop)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [会话](/zh-CN/concepts/session)
- [子智能体](/zh-CN/tools/subagents)
- [后台任务](/zh-CN/automation/tasks)
- [ACP 智能体](/zh-CN/tools/acp-agents)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
