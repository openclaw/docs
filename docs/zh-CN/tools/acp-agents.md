---
read_when:
    - 通过 ACP 运行编码执行框架
    - 在消息渠道上设置绑定到对话的 ACP 会话
    - 将消息渠道对话绑定到持久 ACP 会话
    - ACP 后端、插件连接或补全交付的故障排除
    - 在聊天中操作 /acp 命令
sidebarTitle: ACP agents
summary: 通过 ACP 后端运行外部编码框架（Claude Code、Cursor、Gemini CLI、显式 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-29T03:44:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol（ACP）](https://agentclientprotocol.com/) 会话让 OpenClaw 可以通过 ACP 后端插件运行外部编码运行框架（例如 Pi、Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI 以及其他受支持的 ACPX 运行框架）。

每次 ACP 会话生成都会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。

<Note>
**ACP 是外部运行框架路径，不是默认 Codex 路径。** 原生 Codex app-server 插件拥有 `/codex ...` 控制和 `agentRuntime.id: "codex"` 嵌入式运行时；ACP 拥有 `/acp ...` 控制和 `sessions_spawn({ runtime: "acp" })` 会话。

如果你希望 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到现有 OpenClaw 渠道对话，请使用 [`openclaw mcp serve`](/zh-CN/cli/mcp)，而不是 ACP。
</Note>

## 我应该看哪个页面？

| 你想要…                                                                                         | 使用                                  | 备注                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在当前对话中绑定或控制 Codex                                                                    | `/codex bind`、`/codex threads`       | 启用 `codex` 插件时的原生 Codex app-server 路径；包括绑定聊天回复、图片转发、模型/快速/权限、停止和引导控制。ACP 是显式备用方案 |
| 通过 OpenClaw 运行 Claude Code、Gemini CLI、显式 Codex ACP 或其他外部运行框架                  | 本页                                  | 聊天绑定会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制                                                                                                                |
| 将 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端                                | [`openclaw acp`](/zh-CN/cli/acp)            | 桥接模式。IDE/客户端通过 stdio/WebSocket 与 OpenClaw 进行 ACP 通信                                                                                                                                   |
| 将本地 AI CLI 复用为纯文本备用模型                                                             | [CLI 后端](/zh-CN/gateway/cli-backends)     | 不是 ACP。没有 OpenClaw 工具，没有 ACP 控制，没有运行框架运行时                                                                                                                                       |

## 这能开箱即用吗？

通常可以。全新安装默认启用内置的 `acpx` 运行时插件，并附带插件本地固定版本的 `acpx` 二进制文件，OpenClaw 会在启动时探测并自修复。运行 `/acp doctor` 执行就绪检查。

OpenClaw 只会在 ACP **确实可用**时教智能体使用 ACP 生成：ACP 必须已启用，分发不得被禁用，当前会话不得被沙箱阻止，并且必须已加载运行时后端。如果不满足这些条件，ACP 插件 Skills 和 `sessions_spawn` ACP 指引会保持隐藏，以免智能体建议不可用的后端。

<AccordionGroup>
  <Accordion title="首次运行注意事项">
    - 如果设置了 `plugins.allow`，它就是限制性的插件清单，并且**必须**包含 `acpx`；否则内置默认插件会被有意阻止，`/acp doctor` 会报告缺少允许列表条目。
    - 内置 Codex ACP 适配器随 `acpx` 插件一起暂存，并在可行时本地启动。
    - 其他目标运行框架适配器可能仍会在你首次使用时通过 `npx` 按需获取。
    - 该运行框架的供应商凭证仍必须存在于主机上。
    - 如果主机没有 npm 或网络访问权限，首次运行的适配器获取会失败，直到缓存预热或通过其他方式安装适配器。

  </Accordion>
  <Accordion title="运行时先决条件">
    ACP 会启动一个真实的外部运行框架进程。OpenClaw 负责路由、后台任务状态、投递、绑定和策略；运行框架负责自己的提供商登录、模型目录、文件系统行为和原生工具。

    在归因于 OpenClaw 之前，请验证：

    - `/acp doctor` 报告后端已启用且健康。
    - 设置 `acp.allowedAgents` 允许列表时，目标 ID 被该允许列表允许。
    - 运行框架命令可以在 Gateway 网关主机上启动。
    - 该运行框架存在提供商凭证（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所选模型存在于该运行框架中 —— 模型 ID 不能跨运行框架移植。
    - 请求的 `cwd` 存在且可访问，或者省略 `cwd` 并让后端使用其默认值。
    - 权限模式与工作匹配。非交互式会话无法点击原生权限提示，因此写入/执行密集的编码运行通常需要能无界面继续执行的 ACPX 权限配置文件。

  </Accordion>
</AccordionGroup>

OpenClaw 插件工具和内置 OpenClaw 工具默认**不会**暴露给 ACP 运行框架。仅当运行框架应直接调用这些工具时，才在 [ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)中启用显式 MCP 桥接。

## 支持的运行框架目标

使用内置 `acpx` 后端时，请将这些运行框架 ID 作为 `/acp spawn <id>` 或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目标：

| 运行框架 ID | 典型后端                                       | 备注                                                                                |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 适配器                         | 需要主机上有 Claude Code 凭证。                                                     |
| `codex`    | Codex ACP 适配器                               | 仅当原生 `/codex` 不可用或明确请求 ACP 时，作为显式 ACP 备用方案。                 |
| `copilot`  | GitHub Copilot ACP 适配器                      | 需要 Copilot CLI/运行时凭证。                                                       |
| `cursor`   | Cursor CLI ACP（`cursor-agent acp`）           | 如果本地安装暴露了不同的 ACP 入口点，请覆盖 acpx 命令。                            |
| `droid`    | Factory Droid CLI                              | 需要运行框架环境中有 Factory/Droid 凭证或 `FACTORY_API_KEY`。                       |
| `gemini`   | Gemini CLI ACP 适配器                          | 需要 Gemini CLI 凭证或 API 密钥设置。                                               |
| `iflow`    | iFlow CLI                                      | 适配器可用性和模型控制取决于已安装的 CLI。                                          |
| `kilocode` | Kilo Code CLI                                  | 适配器可用性和模型控制取决于已安装的 CLI。                                          |
| `kimi`     | Kimi/Moonshot CLI                              | 需要主机上有 Kimi/Moonshot 凭证。                                                   |
| `kiro`     | Kiro CLI                                       | 适配器可用性和模型控制取决于已安装的 CLI。                                          |
| `opencode` | OpenCode ACP 适配器                            | 需要 OpenCode CLI/提供商凭证。                                                      |
| `openclaw` | 通过 `openclaw acp` 的 OpenClaw Gateway 网关桥接 | 让支持 ACP 的运行框架回连到 OpenClaw Gateway 网关会话。                            |
| `pi`       | Pi/嵌入式 OpenClaw 运行时                     | 用于 OpenClaw 原生运行框架实验。                                                    |
| `qwen`     | Qwen Code / Qwen CLI                           | 需要主机上有兼容 Qwen 的凭证。                                                      |

自定义 acpx 智能体别名可以在 acpx 自身中配置，但 OpenClaw 策略在分发前仍会检查 `acp.allowedAgents` 以及任何 `agents.list[].runtime.acp.agent` 映射。

## 操作员运行手册

从聊天中快速使用 `/acp` 的流程：

<Steps>
  <Step title="生成">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或显式
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在绑定的对话或线程中继续（或显式指定会话键）。
  </Step>
  <Step title="检查状态">
    `/acp status`
  </Step>
  <Step title="调优">
    `/acp model <provider/model>`、
    `/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="引导">
    不替换上下文：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（当前轮次）或 `/acp close`（会话 + 绑定）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命周期详情">
    - 生成会创建或恢复 ACP 运行时会话，在 OpenClaw 会话存储中记录 ACP 元数据，并且当运行由父级拥有时可能会创建后台任务。
    - 父级拥有的 ACP 会话会被视为后台工作，即使运行时会话是持久的；完成和跨界面投递会通过父任务通知器，而不是像普通面向用户的聊天会话那样处理。
    - 任务维护会关闭终态或孤立的父级拥有一次性 ACP 会话。持久 ACP 会话会在仍有活动对话绑定时保留；没有活动绑定的陈旧持久会话会被关闭，以免在拥有任务完成或其任务记录消失后被静默恢复。
    - 绑定的后续消息会直接发送到 ACP 会话，直到绑定被关闭、取消聚焦、重置或过期。
    - Gateway 网关命令保持本地执行。`/acp ...`、`/status` 和 `/unfocus` 永远不会作为普通提示文本发送给绑定的 ACP 运行框架。
    - 当后端支持取消时，`cancel` 会中止当前轮次；它不会删除绑定或会话元数据。
    - 从 OpenClaw 视角看，`close` 会结束 ACP 会话并移除绑定。如果运行框架支持恢复，它可能仍会保留自己的上游历史。
    - 空闲运行时工作进程可在 `acp.runtime.ttlMinutes` 之后被清理；已存储的会话元数据仍可用于 `/acp sessions`。

  </Accordion>
  <Accordion title="原生 Codex 路由规则">
    当**原生 Codex 插件**启用时，应路由到它的自然语言触发：

    - “将这个 Discord 渠道绑定到 Codex。”
    - “将这个聊天附加到 Codex 线程 `<id>`。”
    - “显示 Codex 线程，然后绑定这个线程。”

    原生 Codex 对话绑定是默认聊天控制路径。OpenClaw 动态工具仍通过 OpenClaw 执行，而 Codex 原生工具（例如 shell/apply-patch）在 Codex 内部执行。对于 Codex 原生工具事件，OpenClaw 会注入按轮次的原生钩子中继，使插件钩子能够阻止 `before_tool_call`、观察 `after_tool_call`，并通过 OpenClaw 审批路由 Codex `PermissionRequest` 事件。Codex `Stop` 钩子会中继到 OpenClaw `before_agent_finalize`，插件可在其中请求 Codex 完成答案前再进行一次模型传递。该中继刻意保持保守：它不会修改 Codex 原生工具参数，也不会重写 Codex 线程记录。仅当你需要 ACP 运行时/会话模型时，才使用显式 ACP。嵌入式 Codex 支持边界记录在 [Codex 运行框架 v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)中。

  </Accordion>
  <Accordion title="模型 / 提供商 / 运行时选择速查表">
    - `openai-codex/*` — PI Codex OAuth/订阅路由。
    - `openai/*` 加 `agentRuntime.id: "codex"` — 原生 Codex app-server 嵌入式运行时。
    - `/codex ...` — 原生 Codex 对话控制。
    - `/acp ...` 或 `runtime: "acp"` — 显式 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然语言触发器">
    应路由到 ACP 运行时的触发器：

    - “Run this as a one-shot Claude Code ACP session and summarize the result.”
    - “Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread.”
    - “Run Codex through ACP in a background thread.”

    OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，
    在支持时绑定到当前对话或话题，
    并将后续消息路由到该会话，直到关闭/过期。只有当 ACP/acpx 明确指定，
    或原生 Codex 插件不适用于请求的操作时，Codex 才会走这条路径。

    对于 `sessions_spawn`，只有在 ACP 已启用、请求者未被沙箱隔离、
    且已加载 ACP 运行时后端时，才会声明 `runtime: "acp"`。`acp.dispatch.enabled=false` 会暂停自动
    ACP 话题分发，但不会隐藏或阻止显式
    `sessions_spawn({ runtime: "acp" })` 调用。它面向 ACP harness ID，例如 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode`。不要传入来自 `agents_list` 的普通
    OpenClaw 配置智能体 ID，除非该条目已显式配置为
    `agents.list[].runtime.type="acp"`；
    否则使用默认子智能体运行时。当 OpenClaw 智能体
    配置了 `runtime.type="acp"` 时，OpenClaw 会使用
    `runtime.acp.agent` 作为底层 harness ID。

  </Accordion>
</AccordionGroup>

## ACP 与子智能体

当你需要外部 harness 运行时时使用 ACP。当启用 `codex`
插件并需要 Codex 对话绑定/控制时，使用**原生 Codex
app-server**。当你需要 OpenClaw 原生委派运行时，使用**子智能体**。

| 范围          | ACP 会话                           | 子智能体运行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时       | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时  |
| 会话键   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| 启动工具    | 带 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（默认运行时） |

另见[子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

通过 ACP 运行 Claude Code 时，技术栈是：

1. OpenClaw ACP 会话控制平面。
2. 内置 `acpx` 运行时插件。
3. Claude ACP 适配器。
4. Claude 侧运行时/会话机制。

ACP Claude 是一个带有 ACP 控制、会话恢复、后台任务跟踪，
以及可选对话/话题绑定的 **harness 会话**。

CLI 后端是独立的纯文本本地回退运行时 — 见
[CLI 后端](/zh-CN/gateway/cli-backends)。

对于操作者，实用规则是：

- **需要 `/acp spawn`、可绑定会话、运行时控制或持久 harness 工作？** 使用 ACP。
- **需要通过原始 CLI 进行简单本地文本回退？** 使用 CLI 后端。

## 绑定会话

### 心智模型

- **聊天表面** — 人们持续对话的位置（Discord 渠道、Telegram 话题、iMessage 聊天）。
- **ACP 会话** — OpenClaw 路由到的持久 Codex/Claude/Gemini 运行时状态。
- **子话题/主题** — 仅由 `--thread ...` 创建的可选额外消息表面。
- **运行时工作区** — harness 运行所在的文件系统位置（`cwd`、仓库检出、后端工作区）。独立于聊天表面。

### 当前对话绑定

`/acp spawn <harness> --bind here` 会将当前对话固定到
生成的 ACP 会话 — 不创建子话题，使用同一聊天表面。OpenClaw 继续
负责传输、凭证、安全和投递。该对话中的后续消息会路由到
同一会话；`/new` 和 `/reset` 会原地重置
会话；`/acp close` 会移除绑定。

示例：

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="绑定规则和排他性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 仅适用于声明支持当前对话绑定的渠道；否则 OpenClaw 会返回明确的不支持消息。绑定会在 gateway 重启后保留。
    - 在 Discord 上，只有当 OpenClaw 需要为 `--thread auto|here` 创建子话题时，才需要 `spawnAcpSessions`，`--bind here` 不需要。
    - 如果你在没有 `--cwd` 的情况下生成到另一个 ACP 智能体，OpenClaw 默认会继承**目标智能体的**工作区。缺失的继承路径（`ENOENT`/`ENOTDIR`）会回退到后端默认值；其他访问错误（例如 `EACCES`）会作为生成错误显示。
    - Gateway 网关管理命令在绑定对话中保持本地处理 — 即使普通后续文本会路由到绑定的 ACP 会话，`/acp ...` 命令也由 OpenClaw 处理；只要该表面启用了命令处理，`/status` 和 `/unfocus` 也会保持本地处理。

  </Accordion>
  <Accordion title="话题绑定会话">
    当渠道适配器启用话题绑定时：

    - OpenClaw 将话题绑定到目标 ACP 会话。
    - 该话题中的后续消息会路由到绑定的 ACP 会话。
    - ACP 输出会投递回同一话题。
    - 取消聚焦/关闭/归档/空闲超时或最大时长过期会移除绑定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 网关命令，不是发给 ACP harness 的提示词。

    话题绑定 ACP 所需的功能标志：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停自动 ACP 话题分发；显式 `sessions_spawn({ runtime: "acp" })` 调用仍可工作）。
    - 已启用渠道适配器 ACP 话题生成标志（适配器特定）：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

    话题绑定支持因适配器而异。如果当前活跃的渠道
    适配器不支持话题绑定，OpenClaw 会返回明确的
    不支持/不可用消息。

  </Accordion>
  <Accordion title="支持话题的渠道">
    - 任何公开会话/话题绑定能力的渠道适配器。
    - 当前内置支持：**Discord** 话题/渠道、**Telegram** 主题（群组/超级群组中的论坛主题和私信主题）。
    - 插件渠道可以通过同一绑定接口添加支持。

  </Accordion>
</AccordionGroup>

## 持久渠道绑定

对于非临时工作流，请在顶层 `bindings[]` 条目中
配置持久 ACP 绑定。

### 绑定模型

<ParamField path="bindings[].type" type='"acp"'>
  标记持久 ACP 对话绑定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  标识目标对话。各渠道形态：

- **Discord 渠道/话题：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 论坛主题：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles 私信/群组：** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。稳定群组绑定首选 `chat_id:*` 或 `chat_identifier:*`。
- **iMessage 私信/群组：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。稳定群组绑定首选 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所属 OpenClaw 智能体 ID。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  可选 ACP 覆盖。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  可选的面向操作者标签。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  可选运行时工作目录。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  可选后端覆盖。
</ParamField>

### 每个智能体的运行时默认值

使用 `agents.list[].runtime` 为每个智能体定义一次 ACP 默认值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness ID，例如 `codex` 或 `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP 绑定会话的覆盖优先级：**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 全局 ACP 默认值（例如 `acp.backend`）

### 示例

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### 行为

- OpenClaw 会确保配置的 ACP 会话在使用前存在。
- 该渠道或主题中的消息会路由到配置的 ACP 会话。
- 在绑定对话中，`/new` 和 `/reset` 会原地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由话题聚焦流程创建的绑定）在存在时仍会生效。
- 对于未显式指定 `cwd` 的跨智能体 ACP 生成，OpenClaw 会从智能体配置继承目标智能体工作区。
- 缺失的继承工作区路径会回退到后端默认 cwd；非缺失的访问失败会作为生成错误显示。

## 启动 ACP 会话

启动 ACP 会话有两种方式：

<Tabs>
  <Tab title="来自 sessions_spawn">
    使用 `runtime: "acp"` 从智能体回合或
    工具调用启动 ACP 会话。

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` 默认为 `subagent`，因此请为 ACP 会话显式设置 `runtime: "acp"`。如果省略 `agentId`，OpenClaw 会在已配置时使用 `acp.defaultAgent`。`mode: "session"` 需要 `thread: true`，以保持持久绑定的对话。
    </Note>

  </Tab>
  <Tab title="来自 /acp 命令">
    使用 `/acp spawn` 从聊天中进行显式操作员控制。

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    关键标志：

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    请参阅 [Slash commands](/zh-CN/tools/slash-commands)。

  </Tab>
</Tabs>

### `sessions_spawn` 参数

<ParamField path="task" type="string" required>
  发送到 ACP 会话的初始提示。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  对于 ACP 会话，必须是 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目标 harness ID。如果已设置，则回退到 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支持的地方请求线程绑定流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性模式；`"session"` 是持久模式。如果 `thread: true` 且省略了 `mode`，OpenClaw 可能会根据运行时路径默认采用持久行为。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  请求的运行时工作目录（由后端/运行时策略验证）。如果省略，ACP spawn 会在已配置时继承目标 Agent 工作区；缺失的继承路径会回退到后端默认值，而真实的访问错误会被返回。
</ParamField>
<ParamField path="label" type="string">
  用于会话/横幅文本的面向操作员标签。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  恢复现有 ACP 会话，而不是创建新会话。智能体会通过 `session/load` 重放其对话历史。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 会将初始 ACP 运行进度摘要作为系统事件流式传回请求者会话。接受的响应包括 `streamLogPath`，指向会话作用域的 JSONL 日志（`<sessionId>.acp-stream.jsonl`），你可以 tail 它来查看完整中继历史。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  在 N 秒后中止 ACP 子回合。`0` 会让该回合走 Gateway 网关的无超时路径。相同的值会应用到 Gateway 网关运行和 ACP 运行时，因此停滞或配额耗尽的 harness 不会无限期占用父智能体通道。
</ParamField>
<ParamField path="model" type="string">
  ACP 子会话的显式模型覆盖。Codex ACP spawn 会在 `session/new` 之前，将 OpenClaw Codex 引用（例如 `openai-codex/gpt-5.4`）规范化为 Codex ACP 启动配置；`openai-codex/gpt-5.4/high` 等斜杠形式也会设置 Codex ACP 推理强度。其他 harness 必须公布 ACP `models` 并支持 `session/set_model`；否则 OpenClaw/acpx 会明确失败，而不是静默回退到目标智能体默认值。
</ParamField>
<ParamField path="thinking" type="string">
  显式思考/推理强度。对于 Codex ACP，`minimal` 映射到低强度，`low`/`medium`/`high`/`xhigh` 直接映射，`off` 则省略推理强度启动覆盖。
</ParamField>

## Spawn 绑定和线程模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行为                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地绑定当前活动对话；如果没有活动对话则失败。 |
    | `off`  | 不创建当前对话绑定。                          |

    注意：

    - `--bind here` 是“让此渠道或聊天由 Codex 支持”的最简单操作员路径。
    - `--bind here` 不会创建子线程。
    - `--bind here` 仅适用于公开当前对话绑定支持的渠道。
    - `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行为                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在活动线程中：绑定该线程。在线程外：在支持时创建/绑定子线程。 |
    | `here` | 要求当前活动线程；如果不在线程中则失败。                                                  |
    | `off`  | 不绑定。会话以未绑定状态启动。                                                                 |

    注意：

    - 在非线程绑定表面上，默认行为实际上是 `off`。
    - 线程绑定的 spawn 需要渠道策略支持：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
    - 当你想固定当前对话而不创建子线程时，请使用 `--bind here`。

  </Tab>
</Tabs>

## 交付模型

ACP 会话可以是交互式工作区，也可以是父级拥有的后台工作。交付路径取决于这种形态。

<AccordionGroup>
  <Accordion title="交互式 ACP 会话">
    交互式会话旨在持续在可见聊天表面上对话：

    - `/acp spawn ... --bind here` 将当前对话绑定到 ACP 会话。
    - `/acp spawn ... --thread ...` 将渠道线程/话题绑定到 ACP 会话。
    - 持久配置的 `bindings[].type="acp"` 会将匹配的对话路由到同一个 ACP 会话。

    绑定对话中的后续消息会直接路由到 ACP 会话，ACP 输出也会交付回同一个渠道/线程/话题。

    OpenClaw 发送给 harness 的内容：

    - 正常的绑定后续消息会作为提示文本发送，只有在 harness/后端支持时才包含附件。
    - `/acp` 管理命令和本地 Gateway 网关命令会在 ACP 分发前被拦截。
    - 运行时生成的完成事件会按目标实体化。OpenClaw 智能体会收到 OpenClaw 的内部运行时上下文信封；外部 ACP harness 会收到包含子结果和指令的普通提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 信封绝不应发送给外部 harness，也不应作为 ACP 用户转录文本持久化。
    - ACP 转录条目使用用户可见的触发文本或普通完成提示。内部事件元数据会尽可能以结构化形式保留在 OpenClaw 中，并且不会被视为用户编写的聊天内容。

  </Accordion>
  <Accordion title="父级拥有的一次性 ACP 会话">
    由另一个智能体运行 spawn 的一次性 ACP 会话是后台子会话，类似于子智能体：

    - 父级使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求工作。
    - 子级在自己的 ACP harness 会话中运行。
    - 子回合运行在原生子智能体 spawn 使用的同一个后台通道上，因此缓慢的 ACP harness 不会阻塞无关的主会话工作。
    - 完成结果会通过任务完成公告路径报告回来。OpenClaw 会先将内部完成元数据转换为普通 ACP 提示，再发送给外部 harness，因此 harness 不会看到仅限 OpenClaw 的运行时上下文标记。
    - 当面向用户的回复有用时，父级会用普通助手语气重写子结果。

    不要将此路径视为父级和子级之间的点对点聊天。子级已经有回到父级的完成渠道。

  </Accordion>
  <Accordion title="sessions_send 和 A2A 交付">
    `sessions_send` 可以在 spawn 后指向另一个会话。对于普通对等会话，OpenClaw 会在注入消息后使用智能体到智能体（A2A）后续路径：

    - 等待目标会话的回复。
    - 可选地允许请求者和目标交换有限数量的后续回合。
    - 要求目标生成公告消息。
    - 将该公告交付到可见渠道或线程。

    该 A2A 路径是对等发送的回退方案，适用于发送方需要可见后续回复的场景。当无关会话可以看到并向 ACP 目标发消息时，它会保持启用，例如在宽泛的 `tools.sessions.visibility` 设置下。

    只有当请求者是其自身父级拥有的一次性 ACP 子级的父级时，OpenClaw 才会跳过 A2A 后续。在这种情况下，在任务完成之上运行 A2A 可能会用子级结果唤醒父级，将父级的回复转发回子级，并创建父级/子级回声循环。对于这种拥有的子级情况，`sessions_send` 结果会报告 `delivery.status="skipped"`，因为完成路径已经负责处理结果。

  </Accordion>
  <Accordion title="恢复现有会话">
    使用 `resumeSessionId` 继续之前的 ACP 会话，而不是重新开始。智能体会通过 `session/load` 重放其对话历史，因此会带着之前内容的完整上下文继续。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常见用例：

    - 将 Codex 会话从你的笔记本电脑移交到你的手机，告诉你的智能体从你离开的地方继续。
    - 继续你在 CLI 中交互式启动的编码会话，现在通过你的智能体以无头方式继续。
    - 接手因 Gateway 网关重启或空闲超时而中断的工作。

    注意：

    - `resumeSessionId` 仅在 `runtime: "acp"` 时适用；默认子智能体运行时会忽略这个仅限 ACP 的字段。
    - `streamTo` 仅在 `runtime: "acp"` 时适用；默认子智能体运行时会忽略这个仅限 ACP 的字段。
    - `resumeSessionId` 是主机本地的 ACP/harness 恢复 ID，而不是 OpenClaw 渠道会话键；OpenClaw 仍会在分发前检查 ACP spawn 策略和目标智能体策略，而 ACP 后端或 harness 拥有加载该上游 ID 的授权。
    - `resumeSessionId` 会恢复上游 ACP 对话历史；`thread` 和 `mode` 仍会正常应用到你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍然需要 `thread: true`。
    - 目标智能体必须支持 `session/load`（Codex 和 Claude Code 支持）。
    - 如果找不到会话 ID，spawn 会明确失败，不会静默回退到新会话。

  </Accordion>
  <Accordion title="部署后冒烟测试">
    Gateway 网关部署后，请运行实时端到端检查，而不是信任单元测试：

    1. 验证目标主机上已部署的 Gateway 网关版本和提交。
    2. 打开到实时智能体的临时 ACPX bridge 会话。
    3. 要求该智能体调用 `sessions_spawn`，并使用 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，以及任务 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 验证 `accepted=yes`、真实的 `childSessionKey`，且没有验证器错误。
    5. 清理临时 bridge 会话。

    保持门禁使用 `mode: "run"`，并跳过 `streamTo: "parent"`，因为线程绑定的 `mode: "session"` 和流式中继路径是单独的、更丰富的集成轮次。

  </Accordion>
</AccordionGroup>

## 沙箱兼容性

ACP 会话目前在主机运行时上运行，**不是**在 OpenClaw 沙箱内运行。

<Warning>
**安全边界：**

- 外部执行框架可以根据其自身的 CLI 权限和选定的 `cwd` 进行读取/写入。
- OpenClaw 的沙箱策略**不会**包裹 ACP 执行框架的执行。
- OpenClaw 仍会强制执行 ACP 功能门控、允许的智能体、会话所有权、渠道绑定和 Gateway 网关投递策略。
- 对需要强制沙箱隔离的 OpenClaw 原生工作，使用 `runtime: "subagent"`。

</Warning>

当前限制：

- 如果请求方会话处于沙箱隔离状态，则 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP 派生都会被阻止。
- 带有 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。

## 会话目标解析

大多数 `/acp` 操作接受一个可选的会话目标（`session-key`、`session-id` 或 `session-label`）。

**解析顺序：**

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 尝试 key
   - 然后尝试 UUID 形态的会话 ID
   - 然后尝试标签
2. 当前线程绑定（如果此对话/线程绑定到 ACP 会话）。
3. 当前请求方会话回退。

当前对话绑定和线程绑定都会参与第 2 步。

如果没有解析出目标，OpenClaw 会返回明确错误（`Unable to resolve session target: ...`）。

## ACP 控制命令

| 命令                 | 作用                                                      | 示例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP 会话；可选当前绑定或线程绑定。                   | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目标会话正在进行的轮次。                              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 向运行中的会话发送引导指令。                              | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 关闭会话并解除线程目标绑定。                              | `/acp close`                                                  |
| `/acp status`        | 显示后端、模式、状态、运行时选项和能力。                  | `/acp status`                                                 |
| `/acp set-mode`      | 设置目标会话的运行时模式。                                | `/acp set-mode plan`                                          |
| `/acp set`           | 写入通用运行时配置选项。                                  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 设置运行时工作目录覆盖。                                  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 设置审批策略配置档。                                      | `/acp permissions strict`                                     |
| `/acp timeout`       | 设置运行时超时（秒）。                                    | `/acp timeout 120`                                            |
| `/acp model`         | 设置运行时模型覆盖。                                      | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除会话运行时选项覆盖。                                  | `/acp reset-options`                                          |
| `/acp sessions`      | 从存储中列出最近的 ACP 会话。                             | `/acp sessions`                                               |
| `/acp doctor`        | 后端健康状况、能力和可操作的修复建议。                    | `/acp doctor`                                                 |
| `/acp install`       | 打印确定性的安装与启用步骤。                              | `/acp install`                                                |

`/acp status` 会显示有效的运行时选项，以及运行时级别和后端级别的会话标识符。当后端缺少某项能力时，不受支持的控制错误会清晰呈现。`/acp sessions` 会读取当前已绑定会话或请求方会话的存储；目标 token（`session-key`、`session-id` 或 `session-label`）会通过 Gateway 网关会话发现进行解析，包括每个智能体自定义的 `session.store` 根目录。

### 运行时选项映射

`/acp` 提供便捷命令和通用设置器。等效操作：

| 命令                         | 映射到                               | 说明                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 运行时配置键 `model`                 | 对于 Codex ACP，OpenClaw 会将 `openai-codex/<model>` 规范化为适配器模型 ID，并将斜杠推理后缀（例如 `openai-codex/gpt-5.4/high`）映射到 `reasoning_effort`。 |
| `/acp set thinking <level>`  | 运行时配置键 `thinking`              | 对于 Codex ACP，OpenClaw 会在适配器支持时发送对应的 `reasoning_effort`。                                                                                                                  |
| `/acp permissions <profile>` | 运行时配置键 `approval_policy`       | —                                                                                                                                                                                         |
| `/acp timeout <seconds>`     | 运行时配置键 `timeout`               | —                                                                                                                                                                                         |
| `/acp cwd <path>`            | 运行时 cwd 覆盖                      | 直接更新。                                                                                                                                                                                |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 使用 cwd 覆盖路径。                                                                                                                                                             |
| `/acp reset-options`         | 清除所有运行时覆盖                   | —                                                                                                                                                                                         |

## acpx 执行框架、插件设置和权限

有关 acpx 执行框架配置（Claude Code / Codex / Gemini CLI 别名）、plugin-tools 和 OpenClaw-tools MCP 桥接，以及 ACP 权限模式，请参阅 [ACP agents — 设置](/zh-CN/tools/acp-agents-setup)。

## 故障排除

| 症状                                                                        | 可能原因                                                                                                               | 修复方法                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 后端插件缺失、已禁用，或被 `plugins.allow` 阻止。                                                                      | 安装并启用后端插件；设置该允许列表时，将 `acpx` 加入 `plugins.allow`，然后运行 `/acp doctor`。                                                                           |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已全局禁用。                                                                                                       | 设置 `acp.enabled=true`。                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已禁用普通线程消息的自动分发。                                                                                         | 设置 `acp.dispatch.enabled=true` 以恢复自动线程路由；显式 `sessions_spawn({ runtime: "acp" })` 调用仍可工作。                                                            |
| `ACP agent "<id>" is not allowed by policy`                                 | 智能体不在允许列表中。                                                                                                 | 使用允许的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | 插件依赖探测或自修复仍在运行。                                                                                         | 稍等片刻并重新运行 `/acp doctor`；如果仍不健康，请检查后端安装错误以及插件允许/拒绝策略。                                                                                |
| 找不到运行框架命令                                                          | 未安装适配器 CLI、暂存的插件依赖缺失，或非 Codex 适配器的首次运行 `npx` 拉取失败。                                     | 运行 `/acp doctor`，修复插件依赖，在 Gateway 网关主机上安装/预热适配器，或显式配置 acpx 智能体命令。                                                                     |
| 运行框架返回模型未找到                                                      | 模型 ID 对另一个提供商/运行框架有效，但不适用于此 ACP 目标。                                                          | 使用该运行框架列出的模型，在运行框架中配置模型，或省略覆盖项。                                                                                                          |
| 运行框架返回厂商凭证错误                                                    | OpenClaw 正常，但目标 CLI/提供商尚未登录。                                                                             | 在 Gateway 网关主机环境中登录或提供所需的提供商密钥。                                                                                                                   |
| `Unable to resolve session target: ...`                                     | 键/ID/标签令牌错误。                                                                                                   | 运行 `/acp sessions`，复制准确的键/标签，然后重试。                                                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有可绑定活跃对话的情况下使用了 `--bind here`。                                                                     | 移动到目标聊天/渠道并重试，或使用未绑定的生成。                                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | 适配器缺少当前对话 ACP 绑定能力。                                                                                      | 在支持的情况下使用 `/acp spawn ... --thread ...`，配置顶层 `bindings[]`，或移动到支持的渠道。                                                                            |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在非线程上下文中使用了 `--thread here`。                                                                               | 移动到目标线程，或使用 `--thread auto`/`off`。                                                                                                                           |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一个用户拥有活跃绑定目标。                                                                                           | 以所有者身份重新绑定，或使用其他对话或线程。                                                                                                                            |
| `Thread bindings are unavailable for <channel>.`                            | 适配器缺少线程绑定能力。                                                                                               | 使用 `--thread off`，或移动到支持的适配器/渠道。                                                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 运行时位于主机端；请求方会话处于沙箱隔离。                                                                         | 从沙箱隔离会话使用 `runtime="subagent"`，或从非沙箱隔离会话运行 ACP 生成。                                                                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 为 ACP 运行时请求了 `sandbox="require"`。                                                                              | 对必需的沙箱隔离使用 `runtime="subagent"`，或从非沙箱隔离会话使用带 `sandbox="inherit"` 的 ACP。                                                                         |
| `Cannot apply --model ... did not advertise model support`                  | 目标运行框架未公开通用 ACP 模型切换。                                                                                  | 使用声明支持 ACP `models`/`session/set_model` 的运行框架，使用 Codex ACP 模型引用，或在运行框架拥有自己的启动标志时直接在其中配置模型。                                  |
| 已绑定会话缺少 ACP 元数据                                                   | ACP 会话元数据已过期/已删除。                                                                                         | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦线程。                                                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 在非交互式 ACP 会话中阻止写入/执行。                                                                  | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway 网关。请参阅[权限配置](/zh-CN/tools/acp-agents-setup#permission-configuration)。           |
| ACP 会话很早失败且输出很少                                                  | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。                                                         | 检查 Gateway 网关日志中的 `AcpRuntimeError`。若要授予完整权限，请设置 `permissionMode=approve-all`；若要优雅降级，请设置 `nonInteractivePermissions=deny`。              |
| ACP 会话完成工作后无限期卡住                                                | 运行框架进程已完成，但 ACP 会话未报告完成。                                                                            | 使用 `ps aux \| grep acpx` 监控；手动终止过期进程。                                                                                                                     |
| 运行框架看到 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 内部事件信封泄漏到了 ACP 边界之外。                                                                                    | 更新 OpenClaw 并重新运行完成流程；外部运行框架应只接收普通完成提示。                                                                                                    |

## 相关内容

- [ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)
- [智能体发送](/zh-CN/tools/agent-send)
- [CLI 后端](/zh-CN/gateway/cli-backends)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（桥接模式）](/zh-CN/cli/acp)
- [子智能体](/zh-CN/tools/subagents)
