---
read_when:
    - 你正在设计或实现一个公开的 OpenClaw 应用 SDK
    - 你正在将 OpenClaw 智能体 API 与 Cursor、Claude Agent SDK、OpenAI Agents、Google ADK、OpenCode、Codex 或 ACP 进行比较
    - 你需要判断某项功能应归属于公共应用 SDK、插件 SDK、Gateway 网关协议、ACP 后端，还是托管环境层。
summary: 面向智能体运行、会话、任务、构件和托管环境的公共 OpenClaw 应用 SDK 设计提案
title: OpenClaw SDK 设计
x-i18n:
    generated_at: "2026-04-29T23:55:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffd4380e556e0e2e1218acaa9e5934e8b308b3420aa25a6d2598d35c7f9a7ab2
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

此页面是一份面向未来公开 **OpenClaw 应用 SDK** 的设计提案。它独立于现有的 [插件 SDK](/zh-CN/plugins/sdk-overview)。

插件 SDK 用于在 OpenClaw 内部运行并扩展提供商、渠道、工具、钩子和受信任运行时的代码。应用 SDK 应面向希望通过稳定公开 API 运行和观察 OpenClaw 智能体的外部应用、脚本、仪表板、CI 作业、IDE 扩展和自动化系统。

## Status

架构草案。

本文档记录了对以下智能体 SDK 和运行时表面进行比较评审后得出的设计方向：

| 项目                | 有用经验                                                                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cursor SDK cookbook | 最佳高层产品 API：`Agent`、`Run`、本地和云端运行时、流式传输、取消、模型发现、仓库、产物，以及云端拉取请求流程。                                                                  |
| Claude Agent SDK    | 强大的双向会话客户端、中断和引导支持、权限模式、钩子、自定义工具、会话存储，以及可恢复的转录记录。                                                                                |
| OpenAI Agents SDK   | 强大的工作流概念：交接、护栏、人工审批、追踪、运行状态、流式结果对象，以及中断后恢复。                                                                                            |
| Google ADK          | 强大的内部架构：运行器、会话服务、记忆服务、产物服务、凭证服务、插件、事件动作，以及长时间运行工具确认。                                                                          |
| OpenCode            | 强大的客户端/服务器形态：生成的 API 客户端、REST 加 SSE、会话、工作区、工作树、权限、问题、文件、VCS、PTY、工具、智能体、Skills 和 MCP。                                           |
| Codex               | 强大的本地运行时边界：审批、沙箱隔离、网络策略、本地和远程执行服务器、结构化协议事件，以及线程感知的应用服务器会话。                                                              |
| ACP and acpx        | 面向外部编码 harness 的强互操作层，支持命名会话、提示队列、协作式取消和运行时适配器。                                                                                             |

建议是在 OpenCode 风格的生成式 Gateway 网关客户端之上构建一个像 Cursor 一样简洁的公开外观，同时在适用处将 Claude、OpenAI Agents、ADK、Codex 和 ACP 概念作为内部设计参考。

## 目标

- 为应用开发者提供一个用于运行 OpenClaw 智能体的极小高层 API。
- 保持本地优先的 OpenClaw 作为默认运行时。
- 将云端或托管环境作为一个附加的环境提供商，而不是不同的智能体 API。
- 保留现有 OpenClaw 边界：Gateway 网关拥有公开协议，插件 SDK 拥有进程内扩展，ACP 拥有外部 harness 互操作。
- 将 `stream`、`wait`、`cancel`、`resume`、`fork`、产物、审批和后台任务作为一等操作支持。
- 暴露稳定的标准化事件，同时为高级消费者保留运行时原生原始事件。
- 让 SDK 权限、密钥转发、审批、沙箱隔离和远程环境保持显式。
- 将公开契约保持在足够小的范围内，便于文档化、测试、版本化和生成。

## 非目标

- 不要将 `openclaw/plugin-sdk/*` 暴露为应用 SDK。
- 不要让 ACP 成为唯一的运行时模型。
- 不要要求先有云服务才能让 SDK 发挥作用。
- 不要精确克隆 Cursor、Claude、OpenAI、ADK、OpenCode、Codex 或 ACP API。
- 不要将无边界的 `any` 事件载荷作为唯一公开契约暴露。
- 除非所选环境确实能够强制执行，否则不要承诺外部 harness 具有沙箱或网络隔离。
- 不要让插件作者在插件运行时代码中依赖应用 SDK 对象。

## 当前 OpenClaw 契合度

OpenClaw 已经具备大部分底层基础：

| 现有表面                                            | 它提供的能力                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Agent loop](/zh-CN/concepts/agent-loop)                  | `agent` 和 `agent.wait` 运行生命周期、流式传输、超时和会话序列化。                                                       |
| [Agent Runtimes](/zh-CN/concepts/agent-runtimes)          | 提供商、模型、运行时和渠道分离。                                                                                         |
| [ACP 智能体](/zh-CN/tools/acp-agents)                     | 面向 Claude Code、Cursor、Gemini CLI、OpenCode、显式 Codex ACP 以及类似工具的外部 harness 会话。                         |
| [后台任务](/zh-CN/automation/tasks)                       | 面向 ACP、子智能体、cron、CLI 操作和异步媒体作业的分离式活动账本。                                                       |
| [子智能体](/zh-CN/tools/subagents)                        | 隔离的后台智能体运行、可选的分叉上下文，以及回传到请求者会话。                                                           |
| [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness) | 面向 Codex 等嵌入式 harness 的受信任原生运行时注册。                                                                     |
| Gateway 网关协议 schema                             | 当前用于智能体参数、会话、订阅、中止、压缩和检查点的类型化方法与事件定义。                                               |

缺口不是智能体执行。缺口是为这些组件提供一个稳定、友好的公开外观。

## 核心模型

应用 SDK 应使用一小组持久名词。

| 名词          | 含义                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `OpenClaw`    | 客户端入口点。拥有 Gateway 网关发现、认证、低层客户端访问和命名空间工厂。                                                |
| `Agent`       | 已配置的执行者。携带智能体 ID、默认模型、默认运行时、默认工具策略和面向应用的帮助函数。                                  |
| `Session`     | 持久转录记录、路由、工作区、上下文和运行时绑定。                                                                         |
| `Run`         | 一次提交的回合或任务。流式输出事件、等待结果、取消，并暴露产物。                                                         |
| `Task`        | 分离式或后台活动账本条目。涵盖子智能体、ACP 派生、cron 作业、CLI 运行和异步作业。                                        |
| `Artifact`    | 文件、补丁、Diffs、媒体、日志、轨迹、拉取请求、截图和生成的包。                                                          |
| `Environment` | 运行执行的位置：本地 Gateway 网关、本地工作区、节点主机、ACP harness、托管运行器，或未来的云工作区。                     |
| `ToolSpace`   | 生效的工具表面：OpenClaw 工具、MCP 服务器、渠道工具、应用工具、审批规则和工具元数据。                                    |
| `Approval`    | 运行、工具、环境或 harness 请求的人工或策略决策。                                                                        |

这些名词可以清晰映射到现有 OpenClaw 概念，但避免泄露 PI runner 内部机制、插件 harness 注册或 ACP 适配器细节等实现特定名称。

## 产品形态

高层 SDK 应具有如下使用体验：

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

同一个应用也应能够使用持久会话：

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

当前实现说明：`@openclaw/sdk` 从目前已有的 Gateway 网关支撑表面开始。提供商限定的模型引用（如 `openai/gpt-5.5`）会被拆分为 Gateway 网关的 `provider` 和 `model` 覆盖项。每次运行的 `workspace`、`runtime`、`environment` 和 `approvals` 选择仍是设计目标；当调用者设置它们时，客户端会抛出错误，避免请求静默使用默认值执行。任务、产物、环境和通用工具调用帮助函数也已作为未来 API 形态搭建脚手架，并会在 Gateway 网关 RPC 存在之前抛出明确的不支持错误。

同一个 API 也应能够使用外部 ACP harness：

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

应用 SDK 应将运行时选择暴露为标准化联合类型：

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
- `embedded` 面向通过插件 SDK 注册的受信任进程内 harness，例如 `pi` 或 `codex`。
- `cli` 面向可用的 OpenClaw 自有 CLI 后端执行。
- `acp` 通过 ACP/acpx 面向外部 harness。
- `managed` 面向环境提供商，并且仍可能在该环境内部运行嵌入式、CLI 或 ACP 运行时。

运行时选择对象应具有描述性。它不应成为隐藏密钥处理、沙箱策略或工作区预配的位置。

## 环境模型

环境是执行底座。它应保持显式，因为本地 CLI 运行、外部 harness、节点主机和云工作区具有不同的安全与生命周期属性。

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
- 沙箱与网络强制执行
- 环境变量和密钥引用
- 日志、追踪和产物
- 清理和保留
- 运行时可用性

这种分离让托管智能体成为 SDK 的自然扩展。托管智能体是在托管环境中的一次普通运行，而不是特殊的产品分支。

详细的命名空间、事件、结果、审批、产物、安全、包和环境提供商契约位于 [OpenClaw SDK API 设计](/zh-CN/reference/openclaw-sdk-api-design)。

## Cookbook 计划

SDK 应随附 cookbook，而不只是参考文档。

推荐示例：

| 示例                         | 展示内容                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| 快速开始                     | 创建客户端、运行智能体、流式传输输出、等待结果。                                             |
| 编码智能体 CLI               | 本地工作区、模型选择器、取消、审批、JSON 输出。                                              |
| 智能体仪表盘                 | 会话、运行、后台任务、制品、事件重放、Status 过滤器。                                        |
| 应用构建器                   | 智能体在预览服务器旁运行时编辑工作区。                                                       |
| 拉取请求审查器               | 针对仓库引用运行，收集 diff 评论和制品。                                                     |
| 审批控制台                   | 订阅审批并从 UI 回复它们。                                                                   |
| ACP harness 运行器           | 使用同一个 `Run` API 通过 ACP 运行 Claude Code、Cursor、Gemini CLI 或 OpenCode。             |
| 托管环境提供商               | 准备工作区、流式传输事件、保存制品并清理的最小提供商。                                       |
| Slack 或 Discord 桥接        | 外部应用接收事件并发布进度摘要，而无需成为渠道插件。                                         |
| 多智能体研究                 | 生成并行运行，收集制品，并综合成最终报告。                                                   |

手册示例应优先使用高层 API。低层生成的客户端示例属于高级章节。

## 分阶段实现

### 第 0 阶段：RFC 和词汇

- 就公开名词和名称达成一致。
- 决定包名称。
- 定义第一版事件分类。
- 在文档中标明当前插件 SDK 有意保持独立。

### 第 1 阶段：低层生成客户端

- 从 Gateway 网关协议 schema 生成 TypeScript 客户端。
- 优先覆盖 `agent`、`agent.wait`、会话、订阅、中止和任务。
- 添加冒烟测试，验证生成的方法与 Gateway 网关方法名称和 schema 形状匹配。
- 作为实验性或内部包发布。

### 第 2 阶段：高层运行 API

- 添加 `OpenClaw`、`Agent`、`Session` 和 `Run`。
- 支持 `run.events()`、`run.wait()` 和 `run.cancel()`。
- 支持本地 Gateway 网关发现和显式 Gateway 网关 URL。
- 支持持久会话和会话发送。

### 第 3 阶段：规范化事件投影

- 在 Gateway 网关侧现有原始事件旁添加规范化事件投影。
- 在策略允许的地方保留原始运行时事件。
- 添加重放游标和重连行为。
- 将 PI、Codex、ACP 和任务事件映射到稳定的分类中。

### 第 4 阶段：制品和审批

- 添加制品列表和下载。
- 添加审批订阅和响应辅助函数。
- 添加问题订阅和响应辅助函数。
- 添加手册审批控制台。

### 第 5 阶段：环境提供商

- 引入本地、节点和托管环境提供商契约。
- 从已经在运维中存在的环境开始。
- 添加工作区准备、日志、制品、超时、清理和保留。

### 第 6 阶段：云风格工作流

- 添加面向仓库和分支的运行。
- 添加拉取请求制品。
- 添加按仓库、分支、Status 和负责人分组的运行看板。
- 添加长期运行的托管会话和保留策略。

## 可借鉴的设计选择

借鉴这些思路：

- 来自 Cursor：`Agent` 加 `Run`、本地和云端对称、模型发现、制品，以及由手册驱动的新手引导。
- 来自 Claude Agent SDK：双向客户端、中断、权限、钩子、自定义工具、会话存储和恢复语义。
- 来自 OpenAI Agents：交接、护栏、人工审批恢复、追踪，以及结构化流式结果对象。
- 来自 Google ADK：runner 后面的服务、事件动作、记忆、制品、凭证服务，以及围绕运行生命周期的插件拦截。
- 来自 OpenCode：生成的协议客户端、REST 加 SSE、会话、工作区、问题、权限、文件、VCS、PTY、MCP、智能体和 Skills。
- 来自 Codex：显式沙箱、审批、网络、本地和远程 exec，以及应用服务器线程边界。
- 来自 ACP 和 acpx：基于适配器的外部 harness 互操作性和具名提示队列。

## 应避免的设计选择

避免这些陷阱：

- 只是 Gateway 网关内部机制浅层转储的公开 SDK。
- 导入插件 SDK 子路径的公开 SDK。
- 事件只有 `stream` 加 `data` 的公开 SDK。
- 让本地 OpenClaw 感觉像旧版模式的云优先 API。
- 隐藏在模型 ID 前缀中的运行时选择。
- 隐藏在环境映射中的密钥转发。
- 每次运行的顶层都有 ACP 特定选项。
- 所选运行时无法强制执行的沙箱标志。
- 一个 SDK 对象试图同时充当提供商插件、渠道插件、应用客户端和托管 runner。

## 未决问题

- 初始包应该放在这个仓库中，还是放在单独的 SDK 仓库中？
- 生成的低层客户端是否应在高层包装器稳定之前公开发布？
- 第一个受支持的应用认证机制是什么：本地令牌、管理员令牌、OAuth 设备流，还是签名应用注册？
- SDK 默认应暴露多少会话消息历史？
- 托管环境是否只能在 Gateway 网关配置中配置，还是 SDK 调用方可以使用有作用域的令牌直接请求？
- 本地运行生成的制品适用哪些保留规则？
- 哪些事件载荷在交付给应用之前需要脱敏？
- `Run` 应该覆盖普通聊天轮次和分离任务，还是分离的后台工作应始终返回带有嵌套 `Run` 的 `Task` 包装器？

## 相关文档

- [Agent loop](/zh-CN/concepts/agent-loop)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [会话](/zh-CN/concepts/session)
- [子智能体](/zh-CN/tools/subagents)
- [后台任务](/zh-CN/automation/tasks)
- [ACP 智能体](/zh-CN/tools/acp-agents)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
