---
read_when:
    - 通过 ACP 运行编码 harness
    - 在消息渠道上设置绑定到会话的 ACP 会话
    - 将消息渠道会话绑定到持久化 ACP 会话
    - 排查 ACP 后端、插件接线或补全交付问题
    - 在聊天中使用 /acp 命令
sidebarTitle: ACP agents
summary: 通过 ACP 后端运行外部编码 harness（Claude Code、Cursor、Gemini CLI、显式 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-27T13:49:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 399aed931ad19c681049e1345d4636e73a47dfd0448e2699d95e8ce0184f60ed
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol（ACP）](https://agentclientprotocol.com/) 会话

让 OpenClaw 通过 ACP 后端插件运行外部编码 harness（例如 Pi、Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
受支持的 ACPX harness）。

每次 ACP 会话启动都会被跟踪为一个[后台任务](/zh-CN/automation/tasks)。

<Note>
**ACP 是外部 harness 路径，不是默认的 Codex 路径。** 原生 Codex app-server 插件负责 `/codex ...` 控制以及
`agentRuntime.id: "codex"` 内嵌运行时；ACP 负责
`/acp ...` 控制以及 `sessions_spawn({ runtime: "acp" })` 会话。

如果你想让 Codex 或 Claude Code 作为外部 MCP 客户端
直接连接到现有的 OpenClaw 渠道会话，请使用
[`openclaw mcp serve`](/zh-CN/cli/mcp) 而不是 ACP。
</Note>

## 我该看哪个页面？

| 你想要… | 使用这个 | 说明 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在当前会话中绑定或控制 Codex | `/codex bind`、`/codex threads` | 当启用 `codex` 插件时使用原生 Codex app-server 路径；包括绑定聊天回复、图片转发、模型/快速/权限、停止和引导控制。ACP 是显式回退方案 |
| 通过 OpenClaw 运行 Claude Code、Gemini CLI、显式 Codex ACP 或其他外部 harness | 本页 | 聊天绑定会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制 |
| 将 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端 | [`openclaw acp`](/zh-CN/cli/acp) | 桥接模式。IDE/客户端通过 stdio/WebSocket 向 OpenClaw 发送 ACP |
| 复用本地 AI CLI 作为纯文本回退模型 | [CLI 后端](/zh-CN/gateway/cli-backends) | 不是 ACP。没有 OpenClaw 工具、没有 ACP 控制、没有 harness 运行时 |

## 这能开箱即用吗？

通常可以。全新安装默认启用内置的 `acpx` 运行时插件，
并带有插件本地固定版本的 `acpx` 二进制文件，OpenClaw 会在启动时探测它
并自行修复。运行 `/acp doctor` 可进行就绪检查。

只有在 ACP **确实可用** 时，OpenClaw 才会向智能体介绍 ACP 启动功能：
ACP 必须已启用、分发不能被禁用、当前
会话不能被沙箱隔离阻止，并且必须已加载运行时后端。
如果这些条件不满足，ACP 插件 Skills 和
`sessions_spawn` ACP 指引会保持隐藏，这样智能体就不会建议
一个不可用的后端。

<AccordionGroup>
  <Accordion title="首次运行常见问题">
    - 如果设置了 `plugins.allow`，它就是一个限制性的插件清单，并且**必须**包含 `acpx`；否则内置默认项会被有意阻止，`/acp doctor` 会报告缺少 allowlist 条目。
    - 目标 harness 适配器（Codex、Claude 等）可能会在你首次使用时通过 `npx` 按需拉取。
    - 该 harness 对应的供应商认证仍然必须存在于主机上。
    - 如果主机没有 npm 或网络访问能力，首次运行时的适配器拉取会失败，直到预热缓存或通过其他方式安装适配器。
  </Accordion>
  <Accordion title="运行时前提条件">
    ACP 会启动一个真实的外部 harness 进程。OpenClaw 负责路由、
    后台任务状态、交付、绑定和策略；harness
    负责它自己的提供商登录、模型目录、文件系统行为以及
    原生工具。

    在责怪 OpenClaw 之前，请先确认：

    - `/acp doctor` 报告后端已启用且健康。
    - 当设置了 `acp.allowedAgents` allowlist 时，目标 id 在允许范围内。
    - harness 命令可以在 Gateway 网关主机上启动。
    - 该 harness 所需的提供商认证已存在（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所选模型对该 harness 确实存在——模型 id 不能在不同 harness 之间通用。
    - 请求的 `cwd` 存在且可访问，或者省略 `cwd` 让后端使用其默认值。
    - 权限模式与工作内容相匹配。非交互式会话无法点击原生权限提示，因此大量写入/执行的编码运行通常需要一个能够无头继续执行的 ACPX 权限配置。

  </Accordion>
</AccordionGroup>

默认情况下，OpenClaw 插件工具和内置 OpenClaw 工具**不会**暴露给
ACP harness。只有在 harness
应该直接调用这些工具时，才在
[ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup) 中启用显式 MCP 桥接。

## 支持的 harness 目标

使用内置 `acpx` 后端时，可将以下 harness id 用作 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目标：

| Harness id | 典型后端 | 说明 |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 适配器 | 需要主机上有 Claude Code 认证。 |
| `codex`    | Codex ACP 适配器 | 仅当原生 `/codex` 不可用或明确请求 ACP 时，才作为显式 ACP 回退。 |
| `copilot`  | GitHub Copilot ACP 适配器 | 需要 Copilot CLI/运行时认证。 |
| `cursor`   | Cursor CLI ACP（`cursor-agent acp`） | 如果本地安装暴露的是不同的 ACP 入口点，请覆盖 acpx 命令。 |
| `droid`    | Factory Droid CLI | 需要 Factory/Droid 认证，或在 harness 环境中设置 `FACTORY_API_KEY`。 |
| `gemini`   | Gemini CLI ACP 适配器 | 需要 Gemini CLI 认证或 API 密钥设置。 |
| `iflow`    | iFlow CLI | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `kilocode` | Kilo Code CLI | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `kimi`     | Kimi/Moonshot CLI | 需要主机上有 Kimi/Moonshot 认证。 |
| `kiro`     | Kiro CLI | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `opencode` | OpenCode ACP 适配器 | 需要 OpenCode CLI/提供商认证。 |
| `openclaw` | 通过 `openclaw acp` 实现的 OpenClaw Gateway 网关桥接 | 让支持 ACP 的 harness 回连到 OpenClaw Gateway 网关会话。 |
| `pi`       | Pi/内嵌 OpenClaw 运行时 | 用于 OpenClaw 原生 harness 实验。 |
| `qwen`     | Qwen Code / Qwen CLI | 需要主机上有兼容 Qwen 的认证。 |

可以在 acpx 本身中配置自定义 acpx 智能体别名，但 OpenClaw
策略仍会在分发前检查 `acp.allowedAgents` 以及任何
`agents.list[].runtime.acp.agent` 映射。

## 运维操作手册

在聊天中快速使用 `/acp` 的流程：

<Steps>
  <Step title="启动">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或显式使用
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    继续在已绑定的会话或线程中工作（或者显式
    指定会话 key）。
  </Step>
  <Step title="检查状态">
    `/acp status`
  </Step>
  <Step title="调整">
    `/acp model <provider/model>`、
    `/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="引导">
    在不替换上下文的情况下：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（当前轮次）或 `/acp close`（会话 + 绑定）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命周期细节">
    - 启动会创建或恢复一个 ACP 运行时会话，在 OpenClaw 会话存储中记录 ACP 元数据，并且当该运行由父级拥有时，可能会创建一个后台任务。
    - 绑定后的后续消息会直接发送到 ACP 会话，直到绑定被关闭、失焦、重置或过期。
    - Gateway 网关命令会保留在本地。`/acp ...`、`/status` 和 `/unfocus` 永远不会作为普通提示文本发送给已绑定的 ACP harness。
    - 当后端支持取消时，`cancel` 会中止当前活动轮次；它不会删除绑定或会话元数据。
    - `close` 会从 OpenClaw 的视角结束 ACP 会话并移除绑定。如果 harness 支持恢复，它仍可能保留自己的上游历史记录。
    - 空闲运行时工作进程在 `acp.runtime.ttlMinutes` 之后可能会被清理；存储的会话元数据仍可通过 `/acp sessions` 使用。
  </Accordion>
  <Accordion title="原生 Codex 路由规则">
    当 **原生 Codex 插件** 已启用时，应路由到它的自然语言触发词：

    - “把这个 Discord 渠道绑定到 Codex。”
    - “把这个聊天附加到 Codex 线程 `<id>`。”
    - “显示 Codex 线程，然后绑定这一条。”

    原生 Codex 会话绑定是默认的聊天控制路径。
    OpenClaw 动态工具仍通过 OpenClaw 执行，而
    Codex 原生工具（如 shell/apply-patch）则在 Codex 内部执行。
    对于 Codex 原生工具事件，OpenClaw 会注入每轮次的原生
    hook 中继，这样插件钩子就可以阻止 `before_tool_call`、
    观察 `after_tool_call`，并通过
    OpenClaw 审批来路由 Codex `PermissionRequest` 事件。Codex `Stop` 钩子会被中继到
    OpenClaw `before_agent_finalize`，在这里插件可以请求
    在 Codex 最终生成答案之前再进行一次模型调用。该中继机制
    刻意保持保守：它不会修改 Codex 原生工具
    参数，也不会重写 Codex 线程记录。仅当你想使用 ACP 运行时/会话模型时，
    才使用显式 ACP。内嵌 Codex 支持边界记录于
    [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

  </Accordion>
  <Accordion title="模型 / 提供商 / 运行时选择速查表">
    - `openai-codex/*` — PI Codex OAuth/订阅路径。
    - `openai/*` 加上 `agentRuntime.id: "codex"` — 原生 Codex app-server 内嵌运行时。
    - `/codex ...` — 原生 Codex 会话控制。
    - `/acp ...` 或 `runtime: "acp"` — 显式 ACP/acpx 控制。
  </Accordion>
  <Accordion title="ACP 路由自然语言触发词">
    应路由到 ACP 运行时的触发词：

    - “把这个任务作为一次性 Claude Code ACP 会话运行，并总结结果。”
    - “针对这个任务使用 Gemini CLI 在线程中运行，然后把后续跟进保留在同一线程里。”
    - “通过 ACP 在线程后台运行 Codex。”

    OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，
    在支持时绑定到当前会话或线程，并
    将后续消息路由到该会话，直到关闭/过期。只有当明确指定 ACP/acpx
    或所请求操作的原生 Codex
    插件不可用时，Codex 才会走这一路径。

    对于 `sessions_spawn`，只有在 ACP
    已启用、请求方未被沙箱隔离，并且已加载 ACP 运行时
    后端时，才会公布 `runtime: "acp"`。`acp.dispatch.enabled=false`
    会暂停自动 ACP 线程分发，但不会隐藏或阻止显式的
    `sessions_spawn({ runtime: "acp" })` 调用。它面向诸如 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode` 这样的 ACP harness id。不要传入普通的
    来自 `agents_list` 的 OpenClaw 配置智能体 id，除非该条目
    已明确配置为 `agents.list[].runtime.type="acp"`；
    否则请使用默认的子智能体运行时。当某个 OpenClaw 智能体
    配置了 `runtime.type="acp"` 时，OpenClaw 会使用
    `runtime.acp.agent` 作为底层 harness id。

  </Accordion>
</AccordionGroup>

## ACP 与子智能体

当你需要外部 harness 运行时时，请使用 ACP。当启用 `codex`
插件时，如需 Codex 会话绑定/控制，请使用**原生 Codex
app-server**。当你需要 OpenClaw 原生的
委派运行时，请使用**子智能体**。

| 区域 | ACP 会话 | 子智能体运行 |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时 | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时 |
| 会话键 | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主要命令 | `/acp ...` | `/subagents ...` |
| 启动工具 | 带 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（默认运行时） |

另请参阅[子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 运行的 Claude Code，栈结构如下：

1. OpenClaw ACP 会话控制平面。
2. 内置 `acpx` 运行时插件。
3. Claude ACP 适配器。
4. Claude 侧运行时/会话机制。

ACP Claude 是一个**harness 会话**，具有 ACP 控制、会话恢复、
后台任务跟踪以及可选的会话/线程绑定。

CLI 后端是独立的纯文本本地回退运行时——请参见
[CLI 后端](/zh-CN/gateway/cli-backends)。

对运维人员来说，实际规则是：

- **想要 `/acp spawn`、可绑定会话、运行时控制或持久化 harness 工作？** 使用 ACP。
- **想要通过原始 CLI 获得简单的本地文本回退？** 使用 CLI 后端。

## 绑定会话

### 心智模型

- **聊天界面**——人们持续交流的地方（Discord 渠道、Telegram 话题、iMessage 聊天）。
- **ACP 会话**——OpenClaw 路由到的持久 Codex/Claude/Gemini 运行时状态。
- **子线程/话题**——仅在使用 `--thread ...` 时创建的可选附加消息界面。
- **运行时工作区**——harness 运行所在的文件系统位置（`cwd`、仓库检出目录、后端工作区）。它独立于聊天界面。

### 当前会话绑定

`/acp spawn <harness> --bind here` 会将当前会话固定到
已启动的 ACP 会话——不创建子线程，使用相同的聊天界面。OpenClaw 继续
负责传输、认证、安全和交付。该会话中的后续消息
会路由到同一个会话；`/new` 和 `/reset` 会就地重置该
会话；`/acp close` 会移除绑定。

示例：

```text
/codex bind                                              # 原生 Codex 绑定，将后续消息路由到这里
/codex model gpt-5.4                                     # 调整已绑定的原生 Codex 线程
/codex stop                                              # 控制当前活动的原生 Codex 轮次
/acp spawn codex --bind here                             # 为 Codex 显式使用 ACP 回退
/acp spawn codex --thread auto                           # 可能会创建子线程/话题并绑定到那里
/acp spawn codex --bind here --cwd /workspace/repo       # 相同聊天绑定，Codex 在 /workspace/repo 中运行
```

<AccordionGroup>
  <Accordion title="绑定规则与互斥性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 仅适用于声明支持当前会话绑定的渠道；否则 OpenClaw 会返回清晰的不支持消息。绑定会在 Gateway 网关重启后持续存在。
    - 在 Discord 上，仅当 OpenClaw 需要为 `--thread auto|here` 创建子线程时，才要求 `spawnAcpSessions`——对于 `--bind here` 则不需要。
    - 如果你在未指定 `--cwd` 的情况下启动到不同的 ACP 智能体，OpenClaw 默认会继承**目标智能体的**工作区。缺失的继承路径（`ENOENT`/`ENOTDIR`）会回退到后端默认值；其他访问错误（例如 `EACCES`）会作为启动错误直接显示。
    - Gateway 网关管理命令在已绑定会话中仍保留在本地——即使普通后续文本会路由到已绑定的 ACP 会话，`/acp ...` 命令仍由 OpenClaw 处理；只要该界面启用了命令处理，`/status` 和 `/unfocus` 也始终保留在本地。
  </Accordion>
  <Accordion title="线程绑定会话">
    当某个渠道适配器启用了线程绑定时：

    - OpenClaw 会将一个线程绑定到目标 ACP 会话。
    - 该线程中的后续消息会路由到已绑定的 ACP 会话。
    - ACP 输出会回传到同一个线程。
    - 失焦/关闭/归档/空闲超时或最大时长到期时，会移除该绑定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 网关命令，不会作为提示发送给 ACP harness。

    线程绑定 ACP 所需的功能标志：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 默认开启（设置为 `false` 可暂停自动 ACP 线程分发；显式的 `sessions_spawn({ runtime: "acp" })` 调用仍可使用）。
    - 已启用渠道适配器的 ACP 线程启动标志（适配器专属）：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

    线程绑定支持取决于具体适配器。如果当前渠道
    适配器不支持线程绑定，OpenClaw 会返回清晰的
    不支持/不可用消息。

  </Accordion>
  <Accordion title="支持线程的渠道">
    - 任何暴露会话/线程绑定能力的渠道适配器。
    - 当前内置支持：**Discord** 线程/渠道、**Telegram** 话题（群组/超级群组中的论坛话题以及私信话题）。
    - 插件渠道也可通过相同的绑定接口添加支持。
  </Accordion>
</AccordionGroup>

## 持久化渠道绑定

对于非临时工作流，请在顶层 `bindings[]` 条目中
配置持久化 ACP 绑定。

### 绑定模型

<ParamField path="bindings[].type" type='"acp"'>
  标记一个持久化 ACP 会话绑定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  标识目标会话。按渠道区分的结构如下：

- **Discord 渠道/线程：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 论坛话题：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles 私信/群组：** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。稳定的群组绑定优先使用 `chat_id:*` 或 `chat_identifier:*`。
- **iMessage 私信/群组：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。稳定的群组绑定优先使用 `chat_id:*`。
  </ParamField>
  <ParamField path="bindings[].agentId" type="string">
  所属的 OpenClaw 智能体 id。
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  可选的 ACP 覆盖设置。
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  面向运维人员的可选标签。
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  可选的运行时工作目录。
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  可选的后端覆盖设置。
  </ParamField>

### 每个智能体的运行时默认值

使用 `agents.list[].runtime` 为每个智能体一次性定义 ACP 默认值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness id，例如 `codex` 或 `claude`）
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

- OpenClaw 会在使用前确保已配置的 ACP 会话存在。
- 该渠道或话题中的消息会路由到已配置的 ACP 会话。
- 在已绑定的会话中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的绑定）在存在时仍然适用。
- 对于没有显式 `cwd` 的跨智能体 ACP 启动，OpenClaw 会从智能体配置继承目标智能体的工作区。
- 缺失的继承工作区路径会回退到后端默认 `cwd`；非缺失类访问失败则会作为启动错误直接显示。

## 启动 ACP 会话

有两种方式可以启动 ACP 会话：

<Tabs>
  <Tab title="从 sessions_spawn">
    使用 `runtime: "acp"` 从智能体轮次或
    工具调用中启动 ACP 会话。

    ```json
    {
      "task": "打开仓库并总结失败的测试",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` 默认是 `subagent`，因此对于 ACP 会话需要显式设置
    `runtime: "acp"`。如果省略 `agentId`，OpenClaw 会在已配置时使用
    `acp.defaultAgent`。`mode: "session"` 需要
    `thread: true` 才能保持持久化的绑定会话。
    </Note>

  </Tab>
  <Tab title="从 /acp 命令">
    使用 `/acp spawn` 在聊天中进行显式运维控制。

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

    参见[斜杠命令](/zh-CN/tools/slash-commands)。

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
  ACP 目标 harness id。如果已设置，则回退到 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支持时请求线程绑定流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性运行；`"session"` 是持久化会话。如果 `thread: true` 且
  省略了 `mode`，OpenClaw 可能会根据
  运行时路径默认使用持久化行为。`mode: "session"` 要求 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  请求的运行时工作目录（由后端/运行时
  策略验证）。如果省略，ACP 启动会在已配置时继承目标智能体工作区；
  缺失的继承路径会回退到后端
  默认值，而真实的访问错误会直接返回。
</ParamField>
<ParamField path="label" type="string">
  用于会话/横幅文本中的面向运维人员标签。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  恢复现有 ACP 会话，而不是创建新会话。该
  智能体会通过 `session/load` 重放其会话历史。
  需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 会将初始 ACP 运行进度摘要作为系统事件
  回传到请求方会话。接受的响应可能包含
  指向会话级 JSONL 日志的 `streamLogPath`
  （`<sessionId>.acp-stream.jsonl`），你可以跟踪它以查看完整的中继历史。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  在 N 秒后中止 ACP 子轮次。`0` 会让该轮次保持在
  Gateway 网关的无超时路径上。相同的值会同时应用到 Gateway 网关
  运行和 ACP 运行时，因此卡住或配额耗尽的 harness 不会
  无限期占用父智能体通道。
</ParamField>
<ParamField path="model" type="string">
  对 ACP 子会话的显式模型覆盖。Codex ACP 启动
  会在 `session/new` 之前，将 OpenClaw Codex 引用（例如 `openai-codex/gpt-5.4`）
  规范化为 Codex ACP 启动配置；诸如
  `openai-codex/gpt-5.4/high` 这样的斜杠形式
  还会设置 Codex ACP 推理强度。
  其他 harness 必须公布 ACP `models` 并支持
  `session/set_model`；否则 OpenClaw/acpx 会明确失败，而不是
  静默回退到目标智能体默认值。
</ParamField>
<ParamField path="thinking" type="string">
  显式思考/推理强度。对于 Codex ACP，`minimal` 会映射为
  低强度，`low`/`medium`/`high`/`xhigh` 会直接映射，而 `off`
  会省略推理强度启动覆盖。
</ParamField>

## 启动绑定和线程模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式 | 行为 |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地绑定当前活动会话；如果当前没有活动会话则失败。 |
    | `off`  | 不创建当前会话绑定。 |

    说明：

    - `--bind here` 是运维人员实现“让这个渠道或聊天由 Codex 支持”的最简单路径。
    - `--bind here` 不会创建子线程。
    - `--bind here` 仅适用于暴露当前会话绑定支持的渠道。
    - `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式 | 行为 |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在活动线程中：绑定该线程。在线程外：在支持时创建/绑定一个子线程。 |
    | `here` | 要求当前处于活动线程中；否则失败。 |
    | `off`  | 不绑定。会话以未绑定状态启动。 |

    说明：

    - 在不支持线程绑定的界面上，默认行为实际上等同于 `off`。
    - 线程绑定启动需要渠道策略支持：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
    - 当你想固定当前会话而不创建子线程时，请使用 `--bind here`。

  </Tab>
</Tabs>

## 交付模型

ACP 会话既可以是交互式工作区，也可以是由父级拥有的
后台工作。交付路径取决于其形态。

<AccordionGroup>
  <Accordion title="交互式 ACP 会话">
    交互式会话旨在持续在可见聊天
    界面上交流：

    - `/acp spawn ... --bind here` 会将当前会话绑定到 ACP 会话。
    - `/acp spawn ... --thread ...` 会将渠道线程/话题绑定到 ACP 会话。
    - 持久化配置的 `bindings[].type="acp"` 会将匹配的会话路由到同一个 ACP 会话。

    已绑定会话中的后续消息会直接路由到
    ACP 会话，ACP 输出也会回传到同一个
    渠道/线程/话题。

    OpenClaw 发送给 harness 的内容：

    - 普通的已绑定后续消息会作为提示文本发送，附件仅在 harness/后端支持时一并发送。
    - `/acp` 管理命令和本地 Gateway 网关命令会在 ACP 分发前被拦截。
    - 运行时生成的 completion 事件会按目标具体实现。OpenClaw 智能体会收到 OpenClaw 的内部运行时上下文 envelope；外部 ACP harness 会收到带有子结果和指令的纯提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` envelope 绝不能发送给外部 harness，也不能作为 ACP 用户 transcript 文本持久化。
    - ACP transcript 条目使用用户可见的触发文本或纯 completion 提示。内部事件元数据会尽可能以结构化形式保留在 OpenClaw 中，不会被视为用户编写的聊天内容。

  </Accordion>
  <Accordion title="父级拥有的一次性 ACP 会话">
    由另一个智能体运行启动的一次性 ACP 会话属于后台
    子项，类似于子智能体：

    - 父级通过 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求工作。
    - 子项在它自己的 ACP harness 会话中运行。
    - 子轮次运行在与原生子智能体启动相同的后台通道上，因此缓慢的 ACP harness 不会阻塞无关的主会话工作。
    - 完成情况会通过任务完成通告路径回报。OpenClaw 会在发送到外部 harness 之前，将内部完成元数据转换为纯 ACP 提示，因此 harness 不会看到 OpenClaw 专用的运行时上下文标记。
    - 当需要面向用户的回复时，父级会以普通 assistant 语气重写子结果。

    **不要**将此路径视为父级
    与子项之间的点对点聊天。子项已经有一个回传到
    父级的完成通道。

  </Accordion>
  <Accordion title="sessions_send 和 A2A 交付">
    `sessions_send` 可以在启动后以另一个会话为目标。对于普通
    对等会话，OpenClaw 在注入消息后会使用
    agent-to-agent（A2A）后续路径：

    - 等待目标会话的回复。
    - 可选地让请求方和目标交换有限轮数的后续消息。
    - 要求目标生成一条通告消息。
    - 将该通告投递到可见渠道或线程。

    该 A2A 路径是对等发送时的一种回退方案，适用于发送方需要一个
    可见后续回复的情况。当一个无关会话能够
    查看并向 ACP 目标发送消息时，它仍然保持启用，例如在宽松的
    `tools.sessions.visibility` 设置下。

    仅当请求方是其自有的父级拥有的一次性 ACP 子项的
    父级时，OpenClaw 才会跳过 A2A 后续路径。在这种情况下，
    如果在任务完成之上再运行 A2A，可能会用
    子项结果唤醒父级，再将父级回复转发回子项，
    从而形成父级/子项回声循环。对于该自有子项情况，`sessions_send` 结果会报告
    `delivery.status="skipped"`，
    因为完成路径已经负责处理结果。

  </Accordion>
  <Accordion title="恢复现有会话">
    使用 `resumeSessionId` 可以继续之前的 ACP 会话，而不是
    从头开始。该智能体会通过
    `session/load` 重放其会话历史，因此它会带着此前全部上下文继续工作。

    ```json
    {
      "task": "从上次停下的地方继续——修复剩余的测试失败",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常见用例：

    - 将一个 Codex 会话从你的笔记本电脑交接到手机——告诉你的智能体从你停下的地方继续。
    - 继续一个你先前在 CLI 中以交互方式启动、现在想通过智能体以无头方式继续的编码会话。
    - 继续处理因 Gateway 网关重启或空闲超时而中断的工作。

    说明：

    - `resumeSessionId` 需要 `runtime: "acp"`——如果与子智能体运行时一起使用，会返回错误。
    - `resumeSessionId` 会恢复上游 ACP 会话历史；`thread` 和 `mode` 仍会正常应用到你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍要求 `thread: true`。
    - 目标智能体必须支持 `session/load`（Codex 和 Claude Code 支持）。
    - 如果找不到该会话 id，启动会以清晰错误失败——不会静默回退到新会话。

  </Accordion>
  <Accordion title="部署后冒烟测试">
    Gateway 网关部署后，请运行一次真实的端到端检查，而不是
    只相信单元测试：

    1. 验证目标主机上已部署的 Gateway 网关版本和提交。
    2. 打开一个临时 ACPX 桥接会话，连接到一个在线智能体。
    3. 要求该智能体调用 `sessions_spawn`，并设置 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，任务内容为 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 验证 `accepted=yes`、存在真实的 `childSessionKey`，并且没有校验器错误。
    5. 清理该临时桥接会话。

    将门槛保持在 `mode: "run"`，并跳过 `streamTo: "parent"`——
    线程绑定的 `mode: "session"` 和流中继路径属于单独的、
    更丰富的集成验证流程。

  </Accordion>
</AccordionGroup>

## 沙箱兼容性

ACP 会话当前运行在主机运行时上，**不会**在
OpenClaw 沙箱中运行。

<Warning>
**安全边界：**

- 外部 harness 可以根据其自身 CLI 权限和所选 `cwd` 进行读写。
- OpenClaw 的沙箱策略**不会**包装 ACP harness 执行。
- OpenClaw 仍会强制执行 ACP 功能门禁、允许的智能体、会话所有权、渠道绑定以及 Gateway 网关交付策略。
- 对于受沙箱强制约束的 OpenClaw 原生工作，请使用 `runtime: "subagent"`。
  </Warning>

当前限制：

- 如果请求方会话处于沙箱隔离状态，ACP 启动会被阻止，这同时适用于 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn`。
- 带 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。

## 会话目标解析

大多数 `/acp` 操作都接受一个可选会话目标（`session-key`、
`session-id` 或 `session-label`）。

**解析顺序：**

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 先尝试 key
   - 再尝试 UUID 形状的 session id
   - 然后尝试 label
2. 当前线程绑定（如果此会话/线程已绑定到某个 ACP 会话）。
3. 当前请求方会话回退。

当前会话绑定和线程绑定都会参与
步骤 2。

如果无法解析任何目标，OpenClaw 会返回清晰错误
（`Unable to resolve session target: ...`）。

## ACP 控制

| 命令 | 作用 | 示例 |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP 会话；可选当前会话绑定或线程绑定。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目标会话中正在进行的轮次。 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 向运行中的会话发送引导指令。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 关闭会话并解绑线程目标。 | `/acp close`                                                  |
| `/acp status`        | 显示后端、模式、状态、运行时选项和能力。 | `/acp status`                                                 |
| `/acp set-mode`      | 为目标会话设置运行时模式。 | `/acp set-mode plan`                                          |
| `/acp set`           | 通用运行时配置选项写入。 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 设置运行时工作目录覆盖。 | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 设置审批策略配置。 | `/acp permissions strict`                                     |
| `/acp timeout`       | 设置运行时超时（秒）。 | `/acp timeout 120`                                            |
| `/acp model`         | 设置运行时模型覆盖。 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除会话运行时选项覆盖。 | `/acp reset-options`                                          |
| `/acp sessions`      | 列出存储中的近期 ACP 会话。 | `/acp sessions`                                               |
| `/acp doctor`        | 后端健康状态、能力和可执行修复建议。 | `/acp doctor`                                                 |
| `/acp install`       | 打印确定性的安装和启用步骤。 | `/acp install`                                                |

`/acp status` 会显示生效中的运行时选项，以及运行时级别和
后端级别的会话标识符。当某个后端缺少某项能力时，不支持控制的错误会清晰显示。`/acp sessions` 会为当前已绑定或请求方会话读取
存储；目标令牌
（`session-key`、`session-id` 或 `session-label`）会通过
Gateway 网关会话发现机制解析，包括自定义的每智能体 `session.store`
根目录。

### 运行时选项映射

`/acp` 提供便捷命令和一个通用设置器。等价
操作如下：

| 命令 | 映射到 | 说明 |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | 运行时配置键 `model` | 对于 Codex ACP，OpenClaw 会将 `openai-codex/<model>` 规范化为适配器模型 id，并将斜杠推理后缀（例如 `openai-codex/gpt-5.4/high`）映射为 `reasoning_effort`。 |
| `/acp set thinking <level>`  | 运行时配置键 `thinking` | 对于 Codex ACP，在适配器支持时，OpenClaw 会发送对应的 `reasoning_effort`。 |
| `/acp permissions <profile>` | 运行时配置键 `approval_policy` | — |
| `/acp timeout <seconds>`     | 运行时配置键 `timeout` | — |
| `/acp cwd <path>`            | 运行时 `cwd` 覆盖 | 直接更新。 |
| `/acp set <key> <value>`     | 通用 | `key=cwd` 使用 `cwd` 覆盖路径。 |
| `/acp reset-options`         | 清除所有运行时覆盖 | — |

## acpx harness、插件设置和权限

关于 acpx harness 配置（Claude Code / Codex / Gemini CLI
别名）、plugin-tools 和 OpenClaw-tools MCP 桥接，以及 ACP
权限模式，请参见
[ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)。

## 故障排除

| 症状 | 可能原因 | 修复方法 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | 后端插件缺失、被禁用，或被 `plugins.allow` 阻止。 | 安装并启用后端插件；如果设置了 `plugins.allow` allowlist，请将 `acpx` 包含在内，然后运行 `/acp doctor`。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP 已被全局禁用。 | 设置 `acp.enabled=true`。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 已禁用来自普通线程消息的自动分发。 | 设置 `acp.dispatch.enabled=true` 以恢复自动线程路由；显式的 `sessions_spawn({ runtime: "acp" })` 调用仍然可用。 |
| `ACP agent "<id>" is not allowed by policy` | 智能体不在 allowlist 中。 | 使用允许的 `agentId`，或更新 `acp.allowedAgents`。 |
| 启动后立刻运行 `/acp doctor` 报告后端未就绪 | 插件依赖探测或自修复仍在运行。 | 稍等片刻后重新运行 `/acp doctor`；如果仍然不健康，请检查后端安装错误以及插件 allow/deny 策略。 |
| 找不到 harness 命令 | 适配器 CLI 未安装，或首次运行时的 `npx` 拉取失败。 | 在 Gateway 网关主机上安装/预热该适配器，或显式配置 acpx 智能体命令。 |
| harness 报告找不到模型 | 该模型 id 对其他提供商/harness 有效，但对当前 ACP 目标无效。 | 使用该 harness 列出的模型，在 harness 中配置该模型，或省略该覆盖项。 |
| harness 返回提供商认证错误 | OpenClaw 本身健康，但目标 CLI/提供商未登录。 | 在 Gateway 网关主机环境中登录，或提供所需的提供商密钥。 |
| `Unable to resolve session target: ...` | key/id/label 令牌错误。 | 运行 `/acp sessions`，复制准确的 key/label，然后重试。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活动且可绑定会话的情况下使用了 `--bind here`。 | 移动到目标聊天/渠道后重试，或使用不绑定的启动方式。 |
| `Conversation bindings are unavailable for <channel>.` | 适配器缺少当前会话 ACP 绑定能力。 | 在支持时使用 `/acp spawn ... --thread ...`，配置顶层 `bindings[]`，或切换到受支持的渠道。 |
| `--thread here requires running /acp spawn inside an active ... thread` | 在线程上下文之外使用了 `--thread here`。 | 移动到目标线程，或使用 `--thread auto`/`off`。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 当前绑定目标属于其他用户。 | 由所有者重新绑定，或使用其他会话或线程。 |
| `Thread bindings are unavailable for <channel>.` | 适配器缺少线程绑定能力。 | 使用 `--thread off`，或切换到受支持的适配器/渠道。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP 运行时位于主机侧；请求方会话处于沙箱隔离状态。 | 在沙箱会话中使用 `runtime="subagent"`，或从非沙箱会话发起 ACP 启动。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | 为 ACP 运行时请求了 `sandbox="require"`。 | 对需要强制沙箱隔离的情况使用 `runtime="subagent"`，或从非沙箱会话中以 `sandbox="inherit"` 使用 ACP。 |
| `Cannot apply --model ... did not advertise model support` | 目标 harness 未暴露通用 ACP 模型切换能力。 | 使用公布了 ACP `models`/`session/set_model` 的 harness，使用 Codex ACP 模型引用，或如果该 harness 有自己的启动标志，则直接在其中配置模型。 |
| 已绑定会话缺少 ACP 元数据 | ACP 会话元数据已过期/被删除。 | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦线程。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非交互式 ACP 会话中阻止了写入/执行。 | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway 网关。参见[权限配置](/zh-CN/tools/acp-agents-setup#permission-configuration)。 |
| ACP 会话很早失败且输出很少 | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。 | 检查 Gateway 网关日志中的 `AcpRuntimeError`。如需完全权限，设置 `permissionMode=approve-all`；如需优雅降级，设置 `nonInteractivePermissions=deny`。 |
| ACP 会话在完成工作后无限期卡住 | harness 进程已结束，但 ACP 会话未报告完成。 | 使用 `ps aux \| grep acpx` 监控；手动杀掉陈旧进程。 |
| harness 看到了 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` | 内部事件 envelope 泄漏到了 ACP 边界之外。 | 更新 OpenClaw 并重新运行 completion 流程；外部 harness 应只接收纯 completion 提示。 |

## 相关内容

- [ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)
- [智能体发送](/zh-CN/tools/agent-send)
- [CLI 后端](/zh-CN/gateway/cli-backends)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（桥接模式）](/zh-CN/cli/acp)
- [子智能体](/zh-CN/tools/subagents)
