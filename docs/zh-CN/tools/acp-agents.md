---
read_when:
    - 通过 ACP 运行编码执行框架
    - 在消息渠道上设置绑定到对话的 ACP 会话
    - 将消息渠道对话绑定到持久 ACP 会话
    - ACP 后端、插件连接或补全结果投递的故障排除
    - 从聊天中操作 /acp 命令
sidebarTitle: ACP agents
summary: 通过 ACP 后端运行外部编码 harness（Claude Code、Cursor、Gemini CLI、显式 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 智能体
x-i18n:
    generated_at: "2026-05-01T20:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e5fdd4df58c6e15182ae068cb77f5b257e954e5e546014464f273c504463553
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 会话
让 OpenClaw 通过 ACP 后端插件运行外部编码 harness（例如 Pi、Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
受支持的 ACPX harness）。

每次 ACP 会话生成都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

<Note>
**ACP 是外部 harness 路径，不是默认的 Codex 路径。** 原生 Codex app-server 插件负责
`/codex ...` 控制和
`agentRuntime.id: "codex"` 嵌入式运行时；ACP 负责
`/acp ...` 控制和 `sessions_spawn({ runtime: "acp" })` 会话。

如果你想让 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到现有的 OpenClaw 渠道对话，请使用
[`openclaw mcp serve`](/zh-CN/cli/mcp)，而不是 ACP。
</Note>

## 我该看哪个页面？

| 你想要…                                                                                         | 使用                                  | 备注                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在当前对话中绑定或控制 Codex                                                                    | `/codex bind`、`/codex threads`       | 启用 `codex` 插件时的原生 Codex app-server 路径；包括已绑定聊天回复、图片转发、模型/快速模式/权限、停止和引导控制。ACP 是显式回退方案 |
| 通过 OpenClaw 运行 Claude Code、Gemini CLI、显式 Codex ACP 或其他外部 harness                   | 本页面                                | 聊天绑定会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制                                                                                                                |
| 将 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端                                 | [`openclaw acp`](/zh-CN/cli/acp)            | 桥接模式。IDE/客户端通过 stdio/WebSocket 与 OpenClaw 进行 ACP 通信                                                                                                                                    |
| 复用本地 AI CLI 作为纯文本回退模型                                                              | [CLI 后端](/zh-CN/gateway/cli-backends)     | 不是 ACP。没有 OpenClaw 工具、没有 ACP 控制、没有 harness 运行时                                                                                                                                      |

## 这能开箱即用吗？

通常可以。全新安装默认启用内置的 `acpx` 运行时插件，
并附带插件本地固定版本的 `acpx` 二进制文件；OpenClaw 会在
Gateway 网关 HTTP 监听器可用后立即探测并自我修复它。运行
`/acp doctor` 进行就绪检查。

只有当 ACP **真正可用**时，OpenClaw 才会告诉智能体可以生成 ACP：
必须启用 ACP，调度不得被禁用，当前会话不得被沙箱阻止，并且必须已加载运行时后端。
如果这些条件不满足，ACP 插件 Skills 和
`sessions_spawn` ACP 指引会保持隐藏，避免智能体建议不可用的后端。

<AccordionGroup>
  <Accordion title="首次运行注意事项">
    - 如果设置了 `plugins.allow`，它就是一个限制性的插件清单，且**必须**包含 `acpx`；否则内置默认插件会被有意阻止，`/acp doctor` 会报告缺少 allowlist 条目。
    - 内置 Codex ACP 适配器会随 `acpx` 插件一起预置，并在可能时本地启动。
    - 其他目标 harness 适配器可能仍会在你首次使用时通过 `npx` 按需获取。
    - 该 harness 的供应商凭证仍必须存在于主机上。
    - 如果主机没有 npm 或网络访问权限，首次运行的适配器获取会失败，直到缓存被预热或通过其他方式安装适配器。

  </Accordion>
  <Accordion title="运行时前置条件">
    ACP 会启动一个真实的外部 harness 进程。OpenClaw 负责路由、
    后台任务状态、交付、绑定和策略；harness 负责自己的提供商登录、
    模型目录、文件系统行为和原生工具。

    在归因于 OpenClaw 之前，请先验证：

    - `/acp doctor` 报告后端已启用且健康。
    - 设置了 `acp.allowedAgents` allowlist 时，目标 id 被允许。
    - harness 命令能在 Gateway 网关主机上启动。
    - 该 harness 的提供商凭证已存在（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所选模型对该 harness 存在 — 模型 id 不能跨 harness 移植。
    - 请求的 `cwd` 存在且可访问；或者省略 `cwd`，让后端使用其默认值。
    - 权限模式与工作匹配。非交互式会话无法点击原生权限提示，因此写入/执行密集型编码运行通常需要一个可以无头继续执行的 ACPX 权限配置文件。

  </Accordion>
</AccordionGroup>

默认情况下，OpenClaw 插件工具和内置 OpenClaw 工具**不会**暴露给
ACP harness。只有当 harness 应直接调用这些工具时，才在
[ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)中启用显式 MCP 桥接。

## 支持的 harness 目标

使用内置 `acpx` 后端时，将这些 harness id 作为 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目标：

| Harness id | 典型后端                                       | 备注                                                                               |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 适配器                         | 需要主机上有 Claude Code 凭证。                                                    |
| `codex`    | Codex ACP 适配器                               | 仅在原生 `/codex` 不可用或明确请求 ACP 时作为显式 ACP 回退。                       |
| `copilot`  | GitHub Copilot ACP 适配器                      | 需要 Copilot CLI/运行时凭证。                                                      |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | 如果本地安装暴露的是不同 ACP 入口点，请覆盖 acpx 命令。                            |
| `droid`    | Factory Droid CLI                              | 需要 Factory/Droid 凭证，或 harness 环境中有 `FACTORY_API_KEY`。                   |
| `gemini`   | Gemini CLI ACP 适配器                          | 需要 Gemini CLI 凭证或 API key 设置。                                               |
| `iflow`    | iFlow CLI                                      | 适配器可用性和模型控制取决于已安装的 CLI。                                         |
| `kilocode` | Kilo Code CLI                                  | 适配器可用性和模型控制取决于已安装的 CLI。                                         |
| `kimi`     | Kimi/Moonshot CLI                              | 需要主机上有 Kimi/Moonshot 凭证。                                                  |
| `kiro`     | Kiro CLI                                       | 适配器可用性和模型控制取决于已安装的 CLI。                                         |
| `opencode` | OpenCode ACP 适配器                            | 需要 OpenCode CLI/提供商凭证。                                                     |
| `openclaw` | 通过 `openclaw acp` 的 OpenClaw Gateway 网关桥接 | 让支持 ACP 的 harness 回连到 OpenClaw Gateway 网关会话。                           |
| `pi`       | Pi/嵌入式 OpenClaw 运行时                     | 用于 OpenClaw 原生 harness 实验。                                                   |
| `qwen`     | Qwen Code / Qwen CLI                           | 需要主机上有 Qwen 兼容凭证。                                                       |

自定义 acpx 智能体别名可以在 acpx 自身中配置，但 OpenClaw
策略在调度前仍会检查 `acp.allowedAgents` 以及任何
`agents.list[].runtime.acp.agent` 映射。

## 操作员运行手册

从聊天中快速使用 `/acp` 的流程：

<Steps>
  <Step title="生成">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或显式
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在已绑定的对话或线程中继续（或显式指定会话键）。
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
    - 生成会创建或恢复一个 ACP 运行时会话，在 OpenClaw 会话存储中记录 ACP 元数据，并且当运行由父级拥有时可能会创建后台任务。
    - 父级拥有的 ACP 会话会被视为后台工作，即使运行时会话是持久的；完成和跨界面交付会通过父任务通知器进行，而不是表现得像普通的面向用户聊天会话。
    - 任务维护会关闭终态或孤立的父级拥有一次性 ACP 会话。只要仍有活跃对话绑定，持久 ACP 会话就会被保留；没有活跃绑定的陈旧持久会话会被关闭，避免在拥有任务完成或任务记录消失后被静默恢复。
    - 已绑定的后续消息会直接发送到 ACP 会话，直到绑定被关闭、取消聚焦、重置或过期。
    - Gateway 网关命令保持本地处理。`/acp ...`、`/status` 和 `/unfocus` 永远不会作为普通提示文本发送给已绑定的 ACP harness。
    - 当后端支持取消时，`cancel` 会中止当前轮次；它不会删除绑定或会话元数据。
    - 从 OpenClaw 的角度看，`close` 会结束 ACP 会话并移除绑定。如果 harness 支持恢复，它可能仍会保留自己的上游历史。
    - 空闲运行时 worker 在 `acp.runtime.ttlMinutes` 后可被清理；已存储的会话元数据仍可用于 `/acp sessions`。

  </Accordion>
  <Accordion title="原生 Codex 路由规则">
    当**原生 Codex 插件**已启用时，应路由到它的自然语言触发示例：

    - “将这个 Discord 渠道绑定到 Codex。”
    - “将此聊天附加到 Codex 线程 `<id>`。”
    - “显示 Codex 线程，然后绑定这个。”

    原生 Codex 对话绑定是默认聊天控制路径。
    OpenClaw 动态工具仍通过 OpenClaw 执行，而 shell/apply-patch 等
    Codex 原生工具在 Codex 内执行。
    对于 Codex 原生工具事件，OpenClaw 会注入逐轮原生
    hook 中继，使插件钩子可以阻止 `before_tool_call`、观察
    `after_tool_call`，并通过 OpenClaw 审批路由 Codex `PermissionRequest` 事件。
    Codex `Stop` 钩子会中继到
    OpenClaw `before_agent_finalize`，插件可在 Codex 最终确定答案之前请求再进行一次
    模型传递。该中继保持有意保守：它不会修改 Codex 原生工具
    参数，也不会重写 Codex 线程记录。只有当你需要 ACP 运行时/会话模型时，
    才使用显式 ACP。嵌入式 Codex
    支持边界记录在
    [Codex harness v1 支持合约](/zh-CN/plugins/codex-harness#v1-support-contract)中。

  </Accordion>
  <Accordion title="模型 / 提供商 / 运行时选择速查表">
    - `openai-codex/*` — PI Codex OAuth/订阅路由。
    - `openai/*` 加 `agentRuntime.id: "codex"` — 原生 Codex 应用服务器嵌入式运行时。
    - `/codex ...` — 原生 Codex 会话控制。
    - `/acp ...` 或 `runtime: "acp"` — 显式 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由的自然语言触发语">
    应路由到 ACP 运行时的触发语：

    - “Run this as a one-shot Claude Code ACP session and summarize the result.”
    - “Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread.”
    - “Run Codex through ACP in a background thread.”

    OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，
    在支持时绑定到当前会话或话题串，并将后续消息路由到该会话，直到关闭或过期。Codex 只有在明确指定 ACP/acpx，或原生 Codex
    插件不支持请求的操作时，才会走这条路径。

    对于 `sessions_spawn`，只有在 ACP
    已启用、请求方未被沙箱隔离，并且 ACP 运行时后端已加载时，才会公布 `runtime: "acp"`。`acp.dispatch.enabled=false` 会暂停自动
    ACP 话题串分发，但不会隐藏或阻止显式
    `sessions_spawn({ runtime: "acp" })` 调用。它面向 ACP harness id，例如 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode`。不要传入来自 `agents_list` 的普通
    OpenClaw 配置智能体 id，除非该条目已显式配置 `agents.list[].runtime.type="acp"`；
    否则请使用默认的子智能体运行时。当 OpenClaw 智能体
    配置了 `runtime.type="acp"` 时，OpenClaw 会使用
    `runtime.acp.agent` 作为底层 harness id。

  </Accordion>
</AccordionGroup>

## ACP 与子智能体对比

当你需要外部 harness 运行时时，使用 ACP。当 `codex`
插件已启用且你需要 Codex 会话绑定/控制时，使用**原生 Codex
应用服务器**。当你需要 OpenClaw 原生
委派运行时，使用**子智能体**。

| 领域          | ACP 会话                           | 子智能体运行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时       | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时  |
| 会话键   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| 启动工具    | 带 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（默认运行时） |

另请参阅[子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 运行的 Claude Code，技术栈如下：

1. OpenClaw ACP 会话控制平面。
2. 内置 `acpx` 运行时插件。
3. Claude ACP 适配器。
4. Claude 侧运行时/会话机制。

ACP Claude 是带有 ACP 控制、会话恢复、
后台任务跟踪以及可选会话/话题串绑定的 **harness 会话**。

CLI 后端是独立的纯文本本地回退运行时，参见
[CLI 后端](/zh-CN/gateway/cli-backends)。

对运维者来说，实用规则是：

- **想要 `/acp spawn`、可绑定会话、运行时控制或持久 harness 工作？** 使用 ACP。
- **想通过原始 CLI 获得简单的本地文本回退？** 使用 CLI 后端。

## 绑定会话

### 心智模型

- **聊天界面** — 人们持续对话的位置（Discord 渠道、Telegram 话题、iMessage 聊天）。
- **ACP 会话** — OpenClaw 路由到的持久 Codex/Claude/Gemini 运行时状态。
- **子话题串/话题** — 仅由 `--thread ...` 创建的可选额外消息界面。
- **运行时工作区** — harness 运行所在的文件系统位置（`cwd`、仓库检出、后端工作区）。它独立于聊天界面。

### 当前会话绑定

`/acp spawn <harness> --bind here` 会将当前会话固定到
新启动的 ACP 会话上：不创建子话题串，仍使用同一个聊天界面。OpenClaw 继续
负责传输、认证、安全和投递。该会话中的后续消息会路由到
同一个会话；`/new` 和 `/reset` 会就地重置
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
    - `--bind here` 仅适用于声明支持当前会话绑定的渠道；否则 OpenClaw 会返回明确的不支持消息。绑定会在 Gateway 网关重启后保留。
    - 在 Discord 上，只有当 OpenClaw 需要为 `--thread auto|here` 创建子话题串时，才需要 `spawnAcpSessions`，`--bind here` 不需要。
    - 如果你在没有 `--cwd` 的情况下启动到另一个 ACP 智能体，OpenClaw 默认继承**目标智能体的**工作区。缺失的继承路径（`ENOENT`/`ENOTDIR`）会回退到后端默认值；其他访问错误（例如 `EACCES`）会作为启动错误暴露。
    - Gateway 网关管理命令在绑定会话中保持本地处理：即使普通后续文本会路由到绑定的 ACP 会话，`/acp ...` 命令仍由 OpenClaw 处理；只要该界面启用了命令处理，`/status` 和 `/unfocus` 也会保持本地处理。

  </Accordion>
  <Accordion title="话题串绑定会话">
    当某个渠道适配器启用话题串绑定时：

    - OpenClaw 会将一个话题串绑定到目标 ACP 会话。
    - 该话题串中的后续消息会路由到绑定的 ACP 会话。
    - ACP 输出会投递回同一个话题串。
    - 取消聚焦/关闭/归档/空闲超时或最大存活时间到期会移除绑定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 网关命令，不是发给 ACP harness 的提示词。

    话题串绑定 ACP 所需的功能标志：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停自动 ACP 话题串分发；显式 `sessions_spawn({ runtime: "acp" })` 调用仍可工作）。
    - 启用渠道适配器的 ACP 话题串启动标志（因适配器而异）：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

    话题串绑定支持因适配器而异。如果当前活动渠道
    适配器不支持话题串绑定，OpenClaw 会返回明确的
    不支持/不可用消息。

  </Accordion>
  <Accordion title="支持话题串的渠道">
    - 任何公开会话/话题串绑定能力的渠道适配器。
    - 当前内置支持：**Discord** 话题串/渠道、**Telegram** 话题（群组/超级群组中的论坛话题，以及私信话题）。
    - 插件渠道可以通过相同的绑定接口添加支持。

  </Accordion>
</AccordionGroup>

## 持久渠道绑定

对于非临时工作流，请在
顶层 `bindings[]` 条目中配置持久 ACP 绑定。

### 绑定模型

<ParamField path="bindings[].type" type='"acp"'>
  标记持久 ACP 会话绑定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  标识目标会话。各渠道形状：

- **Discord 渠道/话题串：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 论坛话题：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles 私信/群组：** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。稳定的群组绑定优先使用 `chat_id:*` 或 `chat_identifier:*`。
- **iMessage 私信/群组：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。稳定的群组绑定优先使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所属 OpenClaw 智能体 id。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  可选 ACP 覆盖项。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  可选的面向运维者标签。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  可选的运行时工作目录。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  可选的后端覆盖项。
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

- OpenClaw 会确保配置的 ACP 会话在使用前存在。
- 该渠道或话题中的消息会路由到配置的 ACP 会话。
- 在绑定会话中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由话题串聚焦流程创建的绑定）仍会在存在时生效。
- 对于没有显式 `cwd` 的跨智能体 ACP 启动，OpenClaw 会从智能体配置继承目标智能体工作区。
- 缺失的继承工作区路径会回退到后端默认 cwd；非缺失的访问失败会作为启动错误暴露。

## 启动 ACP 会话

启动 ACP 会话有两种方式：

<Tabs>
  <Tab title="从 sessions_spawn">
    使用 `runtime: "acp"` 从智能体轮次或
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
    `runtime` 默认为 `subagent`，因此请为 ACP 会话显式设置
    `runtime: "acp"`。如果省略 `agentId`，OpenClaw 会在已配置时使用
    `acp.defaultAgent`。`mode: "session"` 需要
    `thread: true` 才能保持持久绑定的对话。
    </Note>

  </Tab>
  <Tab title="来自 /acp 命令">
    使用 `/acp spawn` 从聊天中进行显式的操作员控制。

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

    参见 [斜杠命令](/zh-CN/tools/slash-commands)。

  </Tab>
</Tabs>

### `sessions_spawn` 参数

<ParamField path="task" type="string" required>
  发送给 ACP 会话的初始提示。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 会话必须为 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目标运行框架 ID。如果已设置，则回退到 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支持的位置请求线程绑定流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性的；`"session"` 是持久的。如果 `thread: true` 且
  省略 `mode`，OpenClaw 可能会根据运行时路径默认使用持久行为。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  请求的运行时工作目录（由后端/运行时策略验证）。如果省略，ACP 启动会在已配置时继承目标智能体工作区；继承路径缺失时会回退到后端默认值，而真实的访问错误会被返回。
</ParamField>
<ParamField path="label" type="string">
  在会话/横幅文本中显示给操作员的标签。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  恢复现有 ACP 会话，而不是创建新会话。智能体会通过 `session/load` 重放其对话历史。需要
  `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 会将初始 ACP 运行进度摘要作为系统事件流式传回请求方会话。接受的响应包括
  `streamLogPath`，它指向一个会话作用域的 JSONL 日志
  (`<sessionId>.acp-stream.jsonl`)，你可以持续跟踪该日志以查看完整中继历史。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N 秒后中止 ACP 子轮次。`0` 会让该轮次走 Gateway 网关的无超时路径。同一个值会应用到 Gateway 网关运行和 ACP 运行时，以免停滞或配额耗尽的运行框架无限期占用父智能体执行通道。
</ParamField>
<ParamField path="model" type="string">
  ACP 子会话的显式模型覆盖。Codex ACP 启动会在 `session/new` 之前，将 `openai-codex/gpt-5.4` 这类 OpenClaw Codex 引用规范化为 Codex ACP 启动配置；`openai-codex/gpt-5.4/high` 这类斜杠形式也会设置 Codex ACP 推理强度。其他运行框架必须公布 ACP `models` 并支持
  `session/set_model`；否则 OpenClaw/acpx 会明确失败，而不是静默回退到目标智能体默认值。
</ParamField>
<ParamField path="thinking" type="string">
  显式的思考/推理强度。对于 Codex ACP，`minimal` 映射为低强度，`low`/`medium`/`high`/`xhigh` 直接映射，`off`
  则省略推理强度启动覆盖。
</ParamField>

## 启动绑定和线程模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行为                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地绑定当前活跃对话；如果没有活跃对话则失败。 |
    | `off`  | 不创建当前对话绑定。                          |

    说明：

    - `--bind here` 是操作员实现“让此渠道或聊天由 Codex 支持”的最简单路径。
    - `--bind here` 不会创建子线程。
    - `--bind here` 仅在暴露当前对话绑定支持的渠道上可用。
    - `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行为                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在活跃线程中：绑定该线程。在线程之外：在支持时创建/绑定子线程。 |
    | `here` | 要求当前存在活跃线程；如果不在线程中则失败。                                                  |
    | `off`  | 不绑定。会话以未绑定状态启动。                                                                 |

    说明：

    - 在不支持线程绑定的界面上，默认行为实际上是 `off`。
    - 线程绑定启动需要渠道策略支持：
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - 当你想固定当前对话且不创建子线程时，使用 `--bind here`。

  </Tab>
</Tabs>

## 交付模型

ACP 会话可以是交互式工作区，也可以是父级拥有的后台工作。交付路径取决于这种形态。

<AccordionGroup>
  <Accordion title="交互式 ACP 会话">
    交互式会话用于在可见的聊天界面上持续对话：

    - `/acp spawn ... --bind here` 将当前对话绑定到 ACP 会话。
    - `/acp spawn ... --thread ...` 将渠道线程/主题绑定到 ACP 会话。
    - 已配置的持久 `bindings[].type="acp"` 会把匹配的对话路由到同一个 ACP 会话。

    绑定对话中的后续消息会直接路由到 ACP 会话，ACP 输出会送回同一个渠道/线程/主题。

    OpenClaw 发送给运行框架的内容：

    - 常规绑定后续消息会作为提示文本发送；仅当运行框架/后端支持时，才会附带附件。
    - `/acp` 管理命令和本地 Gateway 网关命令会在分发到 ACP 前被拦截。
    - 运行时生成的完成事件会按目标具体化。OpenClaw 智能体会收到 OpenClaw 的内部运行时上下文封套；外部 ACP 运行框架会收到包含子结果和指令的普通提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 封套绝不应发送给外部运行框架，也不应作为 ACP 用户会话记录文本持久化。
    - ACP 会话记录条目使用用户可见的触发文本或普通完成提示。内部事件元数据会尽可能在 OpenClaw 中保持结构化，不会被视为用户创作的聊天内容。

  </Accordion>
  <Accordion title="父级拥有的一次性 ACP 会话">
    由另一个智能体运行启动的一次性 ACP 会话是后台子级，类似于子智能体：

    - 父级通过 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求工作。
    - 子级在自己的 ACP 运行框架会话中运行。
    - 子级轮次运行在原生子智能体启动所用的同一后台通道上，因此缓慢的 ACP 运行框架不会阻塞无关的主会话工作。
    - 完成结果会通过任务完成公告路径回报。OpenClaw 在发送给外部运行框架之前，会把内部完成元数据转换为普通 ACP 提示，因此运行框架不会看到仅 OpenClaw 使用的运行时上下文标记。
    - 当需要面向用户的回复时，父级会用正常的助手语气改写子级结果。

    **不要** 将此路径视为父级和子级之间的点对点聊天。子级已经有返回父级的完成通道。

  </Accordion>
  <Accordion title="sessions_send 与 A2A 交付">
    `sessions_send` 可以在启动后以另一个会话为目标。对于普通对等会话，OpenClaw 在注入消息后会使用智能体到智能体（A2A）的后续路径：

    - 等待目标会话回复。
    - 可选地让请求方和目标交换有限数量的后续轮次。
    - 要求目标生成公告消息。
    - 将该公告交付到可见的渠道或线程。

    该 A2A 路径是对等发送的回退路径，适用于发送方需要可见后续回复的情况。当无关会话可以看到 ACP 目标并向其发送消息时，它会保持启用，例如在宽泛的
    `tools.sessions.visibility` 设置下。

    仅当请求方正是它自己启动并拥有的父级拥有型一次性 ACP 子级的父级时，OpenClaw 才会跳过 A2A 后续路径。在这种情况下，在任务完成之上再运行 A2A，可能会用子级结果唤醒父级，将父级回复转发回子级，并创建父/子回声循环。`sessions_send` 结果会在这种所属子级场景中报告
    `delivery.status="skipped"`，因为完成路径已经负责该结果。

  </Accordion>
  <Accordion title="恢复现有会话">
    使用 `resumeSessionId` 继续先前的 ACP 会话，而不是重新开始。智能体会通过
    `session/load` 重放其对话历史，因此会带着此前完整上下文继续。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常见用例：

    - 将 Codex 会话从你的笔记本电脑交接到手机：告诉你的智能体从上次停止的位置继续。
    - 继续你在 CLI 中以交互方式启动的编码会话，现在通过你的智能体以无头方式运行。
    - 接续因 Gateway 网关重启或空闲超时而中断的工作。

    说明：

    - `resumeSessionId` 仅在 `runtime: "acp"` 时适用；默认子智能体运行时会忽略这个仅 ACP 使用的字段。
    - `streamTo` 仅在 `runtime: "acp"` 时适用；默认子智能体运行时会忽略这个仅 ACP 使用的字段。
    - `resumeSessionId` 是主机本地的 ACP/运行框架恢复 ID，不是 OpenClaw 渠道会话键；OpenClaw 在分发前仍会检查 ACP 启动策略和目标智能体策略，而加载该上游 ID 的授权由 ACP 后端或运行框架负责。
    - `resumeSessionId` 会恢复上游 ACP 对话历史；`thread` 和 `mode` 仍会正常应用到你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍然需要 `thread: true`。
    - 目标智能体必须支持 `session/load`（Codex 和 Claude Code 支持）。
    - 如果找不到会话 ID，启动会以明确错误失败，不会静默回退到新会话。

  </Accordion>
  <Accordion title="部署后冒烟测试">
    Gateway 网关部署后，请运行实时端到端检查，而不是只信任单元测试：

    1. 验证目标主机上已部署的 Gateway 网关版本和提交。
    2. 打开到实时智能体的临时 ACPX 桥接会话。
    3. 要求该智能体调用 `sessions_spawn`，并使用 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"` 以及任务 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 验证 accepted=yes、真实的 `childSessionKey`，并确认没有验证器错误。
    5. 清理临时桥接会话。

    将该检查保持在 `mode: "run"`，并跳过 `streamTo: "parent"`；线程绑定的 `mode: "session"` 和流式中继路径属于单独、更完整的集成验证。

  </Accordion>
</AccordionGroup>

## 沙箱兼容性

ACP 会话目前运行在主机运行时上，**不** 在 OpenClaw 沙箱内运行。

<Warning>
**安全边界：**

- 外部执行框架可以根据自身 CLI 权限和所选 `cwd` 进行读写。
- OpenClaw 的沙箱策略**不会**包裹 ACP 执行框架的执行。
- OpenClaw 仍会强制执行 ACP 功能门控、允许的智能体、会话所有权、渠道绑定和 Gateway 网关投递策略。
- 使用 `runtime: "subagent"` 执行由沙箱强制约束的 OpenClaw 原生工作。

</Warning>

当前限制：

- 如果请求方会话处于沙箱隔离状态，则 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP 生成都会被阻止。
- 带有 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。

## 会话目标解析

大多数 `/acp` 操作都接受可选的会话目标（`session-key`、
`session-id` 或 `session-label`）。

**解析顺序：**

1. 显式目标参数（或用于 `/acp steer` 的 `--session`）
   - 尝试 key
   - 然后尝试 UUID 形状的会话 id
   - 然后尝试 label
2. 当前线程绑定（如果此对话/线程已绑定到 ACP 会话）。
3. 当前请求方会话回退。

当前对话绑定和线程绑定都会参与
第 2 步。

如果没有解析出目标，OpenClaw 会返回清晰的错误
（`Unable to resolve session target: ...`）。

## ACP 控制

| 命令                 | 作用                                                  | 示例                                                          |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP 会话；可选当前绑定或线程绑定。              | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目标会话正在进行的 turn。                        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 向正在运行的会话发送 steer 指令。                    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 关闭会话并解除线程目标绑定。                         | `/acp close`                                                  |
| `/acp status`        | 显示后端、模式、状态、运行时选项和能力。             | `/acp status`                                                 |
| `/acp set-mode`      | 设置目标会话的运行时模式。                           | `/acp set-mode plan`                                          |
| `/acp set`           | 写入通用运行时配置选项。                             | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 设置运行时工作目录覆盖。                             | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 设置审批策略配置文件。                               | `/acp permissions strict`                                     |
| `/acp timeout`       | 设置运行时超时（秒）。                               | `/acp timeout 120`                                            |
| `/acp model`         | 设置运行时模型覆盖。                                 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除会话运行时选项覆盖。                             | `/acp reset-options`                                          |
| `/acp sessions`      | 从存储中列出最近的 ACP 会话。                        | `/acp sessions`                                               |
| `/acp doctor`        | 后端健康状况、能力和可操作修复。                     | `/acp doctor`                                                 |
| `/acp install`       | 打印确定性的安装和启用步骤。                         | `/acp install`                                                |

`/acp status` 会显示有效的运行时选项，以及运行时级别和
后端级别的会话标识符。当后端缺少某项能力时，不受支持的控制错误会
清晰呈现。`/acp sessions` 会读取当前已绑定会话或请求方会话的
存储；目标令牌（`session-key`、`session-id` 或 `session-label`）
会通过 Gateway 网关会话发现进行解析，包括自定义的按智能体 `session.store`
根目录。

### 运行时选项映射

`/acp` 提供便捷命令和通用 setter。等效
操作如下：

| 命令                         | 映射到                               | 说明                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 运行时配置键 `model`                 | 对于 Codex ACP，OpenClaw 会将 `openai-codex/<model>` 规范化为适配器模型 id，并将斜杠 reasoning 后缀（例如 `openai-codex/gpt-5.4/high`）映射到 `reasoning_effort`。 |
| `/acp set thinking <level>`  | 运行时配置键 `thinking`              | 对于 Codex ACP，在适配器支持时，OpenClaw 会发送对应的 `reasoning_effort`。                                                                                                   |
| `/acp permissions <profile>` | 运行时配置键 `approval_policy`       | —                                                                                                                                                                             |
| `/acp timeout <seconds>`     | 运行时配置键 `timeout`               | —                                                                                                                                                                             |
| `/acp cwd <path>`            | 运行时 cwd 覆盖                      | 直接更新。                                                                                                                                                                    |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 使用 cwd 覆盖路径。                                                                                                                                                 |
| `/acp reset-options`         | 清除所有运行时覆盖                   | —                                                                                                                                                                             |

## acpx 执行框架、插件设置和权限

有关 acpx 执行框架配置（Claude Code / Codex / Gemini CLI
别名）、plugin-tools 和 OpenClaw-tools MCP 桥接，以及 ACP
权限模式，请参阅
[ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)。

## 故障排除

| 症状                                                                        | 可能原因                                                                                                               | 修复方法                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 后端插件缺失、被禁用，或被 `plugins.allow` 阻止。                                                                      | 安装并启用后端插件；如果设置了该允许列表，请在 `plugins.allow` 中包含 `acpx`，然后运行 `/acp doctor`。                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已被全局禁用。                                                                                                     | 设置 `acp.enabled=true`。                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已禁用从普通线程消息自动分派。                                                                                         | 设置 `acp.dispatch.enabled=true` 以恢复自动线程路由；显式的 `sessions_spawn({ runtime: "acp" })` 调用仍可工作。                                                          |
| `ACP agent "<id>" is not allowed by policy`                                 | 智能体不在允许列表中。                                                                                                 | 使用允许的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                       |
| `/acp doctor` 报告启动后后端未就绪                                          | 后端插件缺失、被禁用、被允许/拒绝策略阻止，或其配置的可执行文件不可用。                                                | 安装/启用后端插件，重新运行 `/acp doctor`；如果仍不健康，请检查后端安装或策略错误。                                                                                     |
| 找不到 harness 命令                                                         | 适配器 CLI 未安装、外部插件缺失，或非 Codex 适配器首次运行时的 `npx` 拉取失败。                                        | 运行 `/acp doctor`，在 Gateway 网关主机上安装/预热适配器，或显式配置 acpx 智能体命令。                                                                                  |
| harness 返回模型未找到                                                      | 模型 ID 对另一个提供商/harness 有效，但对这个 ACP 目标无效。                                                          | 使用该 harness 列出的模型，在 harness 中配置该模型，或省略覆盖项。                                                                                                      |
| harness 返回供应商凭证错误                                                  | OpenClaw 正常，但目标 CLI/提供商未登录。                                                                               | 在 Gateway 网关主机环境中登录，或提供所需的提供商密钥。                                                                                                                 |
| `Unable to resolve session target: ...`                                     | 键/ID/标签令牌错误。                                                                                                   | 运行 `/acp sessions`，复制准确的键/标签，然后重试。                                                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活动可绑定对话的情况下使用了 `--bind here`。                                                                     | 移动到目标聊天/渠道后重试，或使用未绑定的 spawn。                                                                                                                       |
| `Conversation bindings are unavailable for <channel>.`                      | 适配器缺少当前对话 ACP 绑定能力。                                                                                      | 在支持的位置使用 `/acp spawn ... --thread ...`，配置顶层 `bindings[]`，或移动到受支持的渠道。                                                                            |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在线程上下文之外使用了 `--thread here`。                                                                               | 移动到目标线程，或使用 `--thread auto`/`off`。                                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一个用户拥有活动绑定目标。                                                                                           | 以所有者身份重新绑定，或使用其他对话或线程。                                                                                                                            |
| `Thread bindings are unavailable for <channel>.`                            | 适配器缺少线程绑定能力。                                                                                               | 使用 `--thread off`，或移动到受支持的适配器/渠道。                                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 运行时位于主机侧；请求方会话处于沙箱隔离状态。                                                                     | 从沙箱隔离会话中使用 `runtime="subagent"`，或从非沙箱隔离会话运行 ACP spawn。                                                                                           |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 为 ACP 运行时请求了 `sandbox="require"`。                                                                              | 对必需的沙箱隔离使用 `runtime="subagent"`，或从非沙箱隔离会话使用带 `sandbox="inherit"` 的 ACP。                                                                         |
| `Cannot apply --model ... did not advertise model support`                  | 目标 harness 未暴露通用 ACP 模型切换。                                                                                 | 使用声明支持 ACP `models`/`session/set_model` 的 harness，使用 Codex ACP 模型引用，或在 harness 有自己的启动标志时直接在其中配置模型。                                  |
| 绑定会话缺少 ACP 元数据                                                     | 过期/已删除的 ACP 会话元数据。                                                                                         | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦线程。                                                                                                                     |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 阻止非交互式 ACP 会话中的写入/执行。                                                                  | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all`，然后重启 gateway。参见[权限配置](/zh-CN/tools/acp-agents-setup#permission-configuration)。              |
| ACP 会话很早失败且几乎没有输出                                              | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。                                                         | 检查 gateway 日志中的 `AcpRuntimeError`。如需完整权限，设置 `permissionMode=approve-all`；如需优雅降级，设置 `nonInteractivePermissions=deny`。                         |
| ACP 会话在完成工作后无限期停滞                                              | harness 进程已完成，但 ACP 会话未报告完成。                                                                           | 使用 `ps aux \| grep acpx` 监控；手动终止过期进程。                                                                                                                     |
| harness 看到 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 内部事件信封泄漏到了 ACP 边界之外。                                                                                    | 更新 OpenClaw 并重新运行完成流程；外部 harness 应该只接收纯完成提示。                                                                                                  |

## 相关内容

- [ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)
- [智能体发送](/zh-CN/tools/agent-send)
- [CLI 后端](/zh-CN/gateway/cli-backends)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（桥接模式）](/zh-CN/cli/acp)
- [子智能体](/zh-CN/tools/subagents)
