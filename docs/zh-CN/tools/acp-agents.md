---
read_when:
    - 通过 ACP 运行编码执行框架
    - 在消息渠道上设置对话绑定的 ACP 会话
    - 将消息渠道对话绑定到持久 ACP 会话
    - ACP 后端、插件接入或补全结果递送故障排除
    - 在聊天中操作 /acp 命令
sidebarTitle: ACP agents
summary: 通过 ACP 后端运行外部编码执行框架（Claude Code、Cursor、Gemini CLI、显式 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-28T19:52:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 754aea24b6e050894b8e954350c148bf84f399b445a85ff4a66a2d5b3453157f
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol（ACP）](https://agentclientprotocol.com/) 会话
让 OpenClaw 通过 ACP 后端插件运行外部编码运行框架（例如 Pi、Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
受支持的 ACPX 运行框架）。

每次 ACP 会话生成都会作为[后台任务](/zh-CN/automation/tasks)跟踪。

<Note>
**ACP 是外部运行框架路径，不是默认 Codex 路径。** 原生 Codex app-server 插件拥有 `/codex ...` 控制和
`agentRuntime.id: "codex"` 嵌入式运行时；ACP 拥有
`/acp ...` 控制和 `sessions_spawn({ runtime: "acp" })` 会话。

如果你想让 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到现有 OpenClaw 渠道会话，请使用
[`openclaw mcp serve`](/zh-CN/cli/mcp)，而不是 ACP。
</Note>

## 我该看哪个页面？

| 你想要…                                                                                         | 使用                                  | 备注                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在当前会话中绑定或控制 Codex                                                                    | `/codex bind`, `/codex threads`       | 启用 `codex` 插件时的原生 Codex app-server 路径；包括绑定的聊天回复、图片转发、模型/快速/权限、停止和引导控制。ACP 是显式后备方案 |
| 通过 OpenClaw 运行 Claude Code、Gemini CLI、显式 Codex ACP 或其他外部运行框架                   | 本页面                                | 绑定到聊天的会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制                                                                                   |
| 将 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端                                 | [`openclaw acp`](/zh-CN/cli/acp)            | 桥接模式。IDE/客户端通过 stdio/WebSocket 与 OpenClaw 进行 ACP 通信                                                                                                                            |
| 复用本地 AI CLI 作为纯文本后备模型                                                              | [CLI 后端](/zh-CN/gateway/cli-backends)     | 不是 ACP。没有 OpenClaw 工具、没有 ACP 控制、没有运行框架运行时                                                                                                                               |

## 这个开箱即用吗？

通常可以。全新安装默认会启用内置的 `acpx` 运行时插件，并附带一个插件本地固定版本的 `acpx` 二进制文件，OpenClaw 会在启动时探测并自修复它。运行 `/acp doctor` 进行就绪检查。

OpenClaw 只会在 ACP **真正可用**时才教智能体使用 ACP 生成会话：ACP 必须已启用，分发不得被禁用，当前会话不得被沙箱阻止，并且必须已加载运行时后端。如果这些条件不满足，ACP 插件 Skills 和 `sessions_spawn` ACP 指引会保持隐藏，这样智能体就不会建议一个不可用的后端。

<AccordionGroup>
  <Accordion title="首次运行注意事项">
    - 如果设置了 `plugins.allow`，它就是一个限制性的插件清单，并且**必须**包含 `acpx`；否则内置默认项会被有意阻止，`/acp doctor` 会报告缺失的允许列表条目。
    - 内置 Codex ACP 适配器会随 `acpx` 插件预置，并在可行时本地启动。
    - 其他目标运行框架适配器在首次使用时可能仍会按需通过 `npx` 获取。
    - 该运行框架的厂商凭证仍必须存在于主机上。
    - 如果主机没有 npm 或网络访问权限，首次运行的适配器获取会失败，直到缓存被预热，或适配器通过其他方式安装。

  </Accordion>
  <Accordion title="运行时前置条件">
    ACP 会启动一个真实的外部运行框架进程。OpenClaw 负责路由、
    后台任务状态、交付、绑定和策略；运行框架负责其提供商登录、
    模型目录、文件系统行为和原生工具。

    在归因于 OpenClaw 之前，请确认：

    - `/acp doctor` 报告一个已启用且健康的后端。
    - 设置 `acp.allowedAgents` 允许列表时，目标 id 被该允许列表允许。
    - 运行框架命令可以在 Gateway 网关主机上启动。
    - 该运行框架的提供商凭证已存在（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所选模型存在于该运行框架中 —— 模型 id 不能跨运行框架移植。
    - 请求的 `cwd` 存在且可访问，或者省略 `cwd` 并让后端使用其默认值。
    - 权限模式与工作相匹配。非交互式会话无法点击原生权限提示，因此写入/执行密集型的编码运行通常需要一个可以无头继续执行的 ACPX 权限配置文件。

  </Accordion>
</AccordionGroup>

默认情况下，OpenClaw 插件工具和内置 OpenClaw 工具**不会**暴露给 ACP 运行框架。仅当运行框架应直接调用这些工具时，才在
[ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)中启用显式 MCP 桥接。

## 支持的运行框架目标

使用内置 `acpx` 后端时，将这些运行框架 id 用作 `/acp spawn <id>` 或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目标：

| 运行框架 id | 典型后端                                       | 备注                                                                                |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 适配器                         | 需要主机上的 Claude Code 凭证。                                                     |
| `codex`    | Codex ACP 适配器                               | 仅在原生 `/codex` 不可用或请求 ACP 时作为显式 ACP 后备。                            |
| `copilot`  | GitHub Copilot ACP 适配器                      | 需要 Copilot CLI/运行时凭证。                                                       |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | 如果本地安装暴露了不同的 ACP 入口点，请覆盖 acpx 命令。                             |
| `droid`    | Factory Droid CLI                              | 需要 Factory/Droid 凭证，或运行框架环境中的 `FACTORY_API_KEY`。                     |
| `gemini`   | Gemini CLI ACP 适配器                          | 需要 Gemini CLI 凭证或 API key 设置。                                               |
| `iflow`    | iFlow CLI                                      | 适配器可用性和模型控制取决于已安装的 CLI。                                          |
| `kilocode` | Kilo Code CLI                                  | 适配器可用性和模型控制取决于已安装的 CLI。                                          |
| `kimi`     | Kimi/Moonshot CLI                              | 需要主机上的 Kimi/Moonshot 凭证。                                                   |
| `kiro`     | Kiro CLI                                       | 适配器可用性和模型控制取决于已安装的 CLI。                                          |
| `opencode` | OpenCode ACP 适配器                            | 需要 OpenCode CLI/提供商凭证。                                                      |
| `openclaw` | 通过 `openclaw acp` 的 OpenClaw Gateway 网关桥接 | 让支持 ACP 的运行框架回连到 OpenClaw Gateway 网关会话。                             |
| `pi`       | Pi/嵌入式 OpenClaw 运行时                      | 用于 OpenClaw 原生运行框架实验。                                                    |
| `qwen`     | Qwen Code / Qwen CLI                           | 需要主机上的 Qwen 兼容凭证。                                                        |

可以在 acpx 本身中配置自定义 acpx 智能体别名，但 OpenClaw 策略在分发前仍会检查 `acp.allowedAgents` 和任何 `agents.list[].runtime.acp.agent` 映射。

## 操作员运行手册

从聊天开始的快速 `/acp` 流程：

<Steps>
  <Step title="生成">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或显式
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在绑定的会话或线程中继续（或显式指定会话
    key）。
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
    - 生成会创建或恢复一个 ACP 运行时会话，在 OpenClaw 会话存储中记录 ACP 元数据，并且当运行由父级拥有时可能会创建一个后台任务。
    - 父级拥有的 ACP 会话会被视为后台工作，即使运行时会话是持久的；完成和跨界面交付会通过父任务通知器完成，而不是像普通面向用户的聊天会话一样处理。
    - 绑定的后续消息会直接发送到 ACP 会话，直到绑定被关闭、失焦、重置或过期。
    - Gateway 网关命令保持本地处理。`/acp ...`、`/status` 和 `/unfocus` 永远不会作为普通提示文本发送给绑定的 ACP 运行框架。
    - 当后端支持取消时，`cancel` 会中止活动轮次；它不会删除绑定或会话元数据。
    - 从 OpenClaw 的角度看，`close` 会结束 ACP 会话并移除绑定。如果运行框架支持恢复，它可能仍会保留自己的上游历史。
    - 空闲运行时 worker 在 `acp.runtime.ttlMinutes` 后可被清理；存储的会话元数据仍可用于 `/acp sessions`。

  </Accordion>
  <Accordion title="原生 Codex 路由规则">
    应该在启用时路由到**原生 Codex
    插件**的自然语言触发语：

    - “将这个 Discord 渠道绑定到 Codex。”
    - “将这个聊天附加到 Codex 线程 `<id>`。”
    - “显示 Codex 线程，然后绑定这个。”

    原生 Codex 会话绑定是默认聊天控制路径。
    OpenClaw 动态工具仍通过 OpenClaw 执行，而
    shell/apply-patch 等 Codex 原生工具在 Codex 内部执行。
    对于 Codex 原生工具事件，OpenClaw 会注入每轮原生
    钩子中继，让插件钩子可以阻止 `before_tool_call`、观察
    `after_tool_call`，并通过 OpenClaw 审批路由 Codex `PermissionRequest` 事件。Codex `Stop` 钩子会被中继到
    OpenClaw `before_agent_finalize`，插件可在此请求再进行一次
    模型轮次，然后 Codex 再最终确定其回答。该中继刻意保持保守：它不会修改 Codex 原生工具参数，也不会重写 Codex 线程记录。仅当你想要 ACP 运行时/会话模型时，才使用显式 ACP。嵌入式 Codex 支持边界记录在
    [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)中。

  </Accordion>
  <Accordion title="模型 / 提供商 / 运行时选择速查表">
    - `openai-codex/*` — PI Codex OAuth/订阅路由。
    - `openai/*` 加 `agentRuntime.id: "codex"` — 原生 Codex app-server 嵌入式运行时。
    - `/codex ...` — 原生 Codex 会话控制。
    - `/acp ...` 或 `runtime: "acp"` — 显式 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然语言触发语">
    应该路由到 ACP 运行时的触发语：

    - “以一次性 Claude Code ACP 会话运行此任务，并总结结果。”
    - “在一个线程中用 Gemini CLI 完成此任务，然后将后续跟进保留在同一线程中。”
    - “通过 ACP 在后台线程中运行 Codex。”

    OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，
    在支持时绑定到当前对话或线程，并将后续跟进路由到该会话，
    直到会话关闭或过期。只有在明确指定 ACP/acpx，或原生 Codex
    插件不可用于所请求操作时，Codex 才会走这条路径。

    对于 `sessions_spawn`，只有在 ACP 已启用、请求方未被沙箱隔离，
    且已加载 ACP 运行时后端时，才会公布 `runtime: "acp"`。
    `acp.dispatch.enabled=false` 会暂停自动 ACP 线程分派，但不会隐藏或阻止显式的
    `sessions_spawn({ runtime: "acp" })` 调用。它面向 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode` 等 ACP harness ID。
    除非某个普通 OpenClaw 配置智能体 ID 来自 `agents_list` 的条目
    已明确配置为 `agents.list[].runtime.type="acp"`，否则不要传入该 ID；
    请改用默认子智能体运行时。当某个 OpenClaw 智能体配置了
    `runtime.type="acp"` 时，OpenClaw 会使用
    `runtime.acp.agent` 作为底层 harness ID。

  </Accordion>
</AccordionGroup>

## ACP 与子智能体

如果你需要外部 harness 运行时，请使用 ACP。如果启用了 `codex`
插件，并且你需要 Codex 对话绑定/控制，请使用**原生 Codex
app-server**。如果你需要 OpenClaw 原生委派运行，请使用**子智能体**。

| 领域          | ACP 会话                              | 子智能体运行                       |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时        | ACP 后端插件（例如 acpx）             | OpenClaw 原生子智能体运行时        |
| 会话键        | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令      | `/acp ...`                            | `/subagents ...`                   |
| 生成工具      | 带 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（默认运行时）     |

另请参阅[子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 使用 Claude Code，堆栈为：

1. OpenClaw ACP 会话控制平面。
2. 内置的 `acpx` 运行时插件。
3. Claude ACP 适配器。
4. Claude 侧运行时/会话机制。

ACP Claude 是一个**harness 会话**，具备 ACP 控制、会话恢复、
后台任务跟踪，以及可选的对话/线程绑定。

CLI 后端是独立的纯文本本地后备运行时，参见
[CLI 后端](/zh-CN/gateway/cli-backends)。

对操作员来说，实用规则是：

- **需要 `/acp spawn`、可绑定会话、运行时控制或持久 harness 工作？** 使用 ACP。
- **只需要通过原始 CLI 进行简单本地文本后备？** 使用 CLI 后端。

## 绑定会话

### 心智模型

- **聊天表面** — 人们持续对话的位置（Discord 渠道、Telegram 主题、iMessage 聊天）。
- **ACP 会话** — OpenClaw 路由到的持久 Codex/Claude/Gemini 运行时状态。
- **子线程/主题** — 仅由 `--thread ...` 创建的可选额外消息表面。
- **运行时工作区** — harness 运行的文件系统位置（`cwd`、仓库 checkout、后端工作区）。它独立于聊天表面。

### 当前对话绑定

`/acp spawn <harness> --bind here` 会将当前对话固定到生成的
ACP 会话，没有子线程，仍使用同一聊天表面。OpenClaw 继续负责
传输、鉴权、安全和投递。该对话中的后续消息会路由到同一会话；
`/new` 和 `/reset` 会就地重置该会话；`/acp close` 会移除绑定。

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
  <Accordion title="绑定规则与排他性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 只适用于声明支持当前对话绑定的渠道；否则 OpenClaw 会返回清晰的不支持消息。绑定会在 Gateway 网关重启后保留。
    - 在 Discord 上，只有当 OpenClaw 需要为 `--thread auto|here` 创建子线程时，才需要 `spawnAcpSessions`；`--bind here` 不需要。
    - 如果你生成到另一个 ACP 智能体且未指定 `--cwd`，OpenClaw 默认继承**目标智能体的**工作区。缺失的继承路径（`ENOENT`/`ENOTDIR`）会回退到后端默认值；其他访问错误（例如 `EACCES`）会作为生成错误暴露。
    - Gateway 网关管理命令在绑定对话中保持本地处理：即使普通后续文本路由到绑定的 ACP 会话，`/acp ...` 命令也由 OpenClaw 处理；只要该表面启用了命令处理，`/status` 和 `/unfocus` 也会保持本地处理。

  </Accordion>
  <Accordion title="线程绑定会话">
    当渠道适配器启用线程绑定时：

    - OpenClaw 会将线程绑定到目标 ACP 会话。
    - 该线程中的后续消息会路由到绑定的 ACP 会话。
    - ACP 输出会投递回同一线程。
    - 取消聚焦/关闭/归档/空闲超时或最大存活期过期会移除绑定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 网关命令，不是发送给 ACP harness 的提示词。

    线程绑定 ACP 所需的功能标志：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 默认开启（设置为 `false` 可暂停自动 ACP 线程分派；显式的 `sessions_spawn({ runtime: "acp" })` 调用仍然可用）。
    - 已启用渠道适配器 ACP 线程生成标志（适配器特定）：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

    线程绑定支持因适配器而异。如果活动渠道适配器不支持线程绑定，
    OpenClaw 会返回清晰的不支持/不可用消息。

  </Accordion>
  <Accordion title="支持线程的渠道">
    - 任何暴露会话/线程绑定能力的渠道适配器。
    - 当前内置支持：**Discord** 线程/渠道，**Telegram** 主题（群组/超级群组中的论坛主题，以及私信主题）。
    - 插件渠道可以通过同一绑定接口添加支持。

  </Accordion>
</AccordionGroup>

## 持久渠道绑定

对于非临时工作流，请在顶层 `bindings[]` 条目中配置持久 ACP 绑定。

### 绑定模型

<ParamField path="bindings[].type" type='"acp"'>
  标记一个持久 ACP 对话绑定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  标识目标对话。各渠道形状如下：

- **Discord 渠道/线程：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 论坛主题：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles 私信/群组：** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。稳定的群组绑定优先使用 `chat_id:*` 或 `chat_identifier:*`。
- **iMessage 私信/群组：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。稳定的群组绑定优先使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  拥有该绑定的 OpenClaw 智能体 ID。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  可选的 ACP 覆盖项。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  可选的面向操作员标签。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  可选的运行时工作目录。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  可选的后端覆盖项。
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
- 在绑定对话中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的绑定）在存在时仍然适用。
- 对于未显式指定 `cwd` 的跨智能体 ACP 生成，OpenClaw 会从智能体配置继承目标智能体工作区。
- 缺失的继承工作区路径会回退到后端默认 cwd；非缺失的访问失败会作为生成错误暴露。

## 启动 ACP 会话

启动 ACP 会话有两种方式：

<Tabs>
  <Tab title="从 sessions_spawn">
    使用 `runtime: "acp"` 从智能体回合或工具调用启动 ACP 会话。

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
    `acp.defaultAgent`。`mode: "session"` 要求
    `thread: true`，以保留持久绑定对话。
    </Note>

  </Tab>
  <Tab title="从 /acp 命令">
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

    请参阅 [斜杠命令](/zh-CN/tools/slash-commands)。

  </Tab>
</Tabs>

### `sessions_spawn` 参数

<ParamField path="task" type="string" required>
  发送给 ACP 会话的初始提示词。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  对于 ACP 会话，必须为 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目标执行框架 ID。如果已设置，则回退到 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支持的位置请求线程绑定流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性运行；`"session"` 是持久会话。如果 `thread: true` 且
  省略了 `mode`，OpenClaw 可能会根据运行时路径默认使用持久行为。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  请求的运行时工作目录（由后端/运行时策略验证）。如果省略，ACP 生成会在已配置时继承目标 Agent 工作区；缺失的继承路径会回退到后端默认值，而真实访问错误会返回。
</ParamField>
<ParamField path="label" type="string">
  用于会话/横幅文本的面向操作员的标签。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  恢复现有 ACP 会话，而不是创建新会话。智能体会通过 `session/load` 重放其对话历史。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 会将初始 ACP 运行进度摘要作为系统事件流式传回请求方会话。接受的响应包括 `streamLogPath`，它指向会话范围的 JSONL 日志（`<sessionId>.acp-stream.jsonl`），你可以跟踪它以查看完整中继历史。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N 秒后中止 ACP 子轮次。`0` 会让该轮次走 Gateway 网关的无超时路径。同一值会应用到 Gateway 网关运行和 ACP 运行时，避免停滞或配额耗尽的执行框架无限期占用父智能体通道。
</ParamField>
<ParamField path="model" type="string">
  ACP 子会话的显式模型覆盖。Codex ACP 生成会在 `session/new` 之前，将 OpenClaw Codex 引用（例如 `openai-codex/gpt-5.4`）规范化为 Codex ACP 启动配置；斜杠形式（例如 `openai-codex/gpt-5.4/high`）也会设置 Codex ACP 推理强度。其他执行框架必须声明 ACP `models` 并支持 `session/set_model`；否则 OpenClaw/acpx 会清晰失败，而不是静默回退到目标智能体默认值。
</ParamField>
<ParamField path="thinking" type="string">
  显式思考/推理强度。对于 Codex ACP，`minimal` 映射到低强度，`low`/`medium`/`high`/`xhigh` 直接映射，`off` 会省略推理强度启动覆盖。
</ParamField>

## 生成绑定和线程模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行为                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地绑定当前活动对话；如果没有活动对话则失败。 |
    | `off`  | 不创建当前对话绑定。                          |

    注意：

    - `--bind here` 是“让这个渠道或聊天由 Codex 支持”的最简单操作员路径。
    - `--bind here` 不会创建子线程。
    - `--bind here` 仅适用于暴露当前对话绑定支持的渠道。
    - `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行为                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在活动线程中：绑定该线程。在线程外：在支持时创建/绑定子线程。 |
    | `here` | 要求当前存在活动线程；如果不在线程中则失败。                                                  |
    | `off`  | 不绑定。会话以未绑定状态启动。                                                                 |

    注意：

    - 在非线程绑定表面上，默认行为实际上是 `off`。
    - 线程绑定生成需要渠道策略支持：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
    - 当你想固定当前对话而不创建子线程时，请使用 `--bind here`。

  </Tab>
</Tabs>

## 交付模型

ACP 会话可以是交互式工作区，也可以是父级拥有的后台工作。交付路径取决于这种形态。

<AccordionGroup>
  <Accordion title="交互式 ACP 会话">
    交互式会话用于在可见聊天表面上持续对话：

    - `/acp spawn ... --bind here` 将当前对话绑定到 ACP 会话。
    - `/acp spawn ... --thread ...` 将渠道线程/主题绑定到 ACP 会话。
    - 持久配置的 `bindings[].type="acp"` 会将匹配的对话路由到同一个 ACP 会话。

    绑定对话中的后续消息会直接路由到 ACP 会话，ACP 输出也会交付回同一个渠道/线程/主题。

    OpenClaw 发送给执行框架的内容：

    - 普通绑定后续消息会作为提示词文本发送，只有在执行框架/后端支持时才附带附件。
    - `/acp` 管理命令和本地 Gateway 网关命令会在 ACP 分发之前被拦截。
    - 运行时生成的完成事件会按目标物化。OpenClaw 智能体会获得 OpenClaw 的内部运行时上下文信封；外部 ACP 执行框架会获得带有子结果和指令的普通提示词。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 信封不应发送给外部执行框架，也不应作为 ACP 用户转录文本持久化。
    - ACP 转录条目使用用户可见的触发文本或普通完成提示词。在可能的情况下，内部事件元数据在 OpenClaw 中保持结构化，并且不会被视为用户撰写的聊天内容。

  </Accordion>
  <Accordion title="父级拥有的一次性 ACP 会话">
    由另一个智能体运行生成的一次性 ACP 会话是后台子项，类似于子智能体：

    - 父级使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求工作。
    - 子项在自己的 ACP 执行框架会话中运行。
    - 子轮次会运行在原生子智能体生成所用的同一后台通道上，因此缓慢的 ACP 执行框架不会阻塞无关的主会话工作。
    - 完成结果会通过任务完成公告路径回报。OpenClaw 会在发送给外部执行框架之前，将内部完成元数据转换为普通 ACP 提示词，因此执行框架不会看到仅限 OpenClaw 的运行时上下文标记。
    - 当面向用户的回复有用时，父级会用正常助手口吻重写子项结果。

    **不要**将此路径视为父级和子项之间的点对点聊天。子项已经有一个返回父级的完成渠道。

  </Accordion>
  <Accordion title="sessions_send 和 A2A 交付">
    `sessions_send` 可以在生成后定位另一个会话。对于普通对等会话，OpenClaw 会在注入消息后使用智能体到智能体（A2A）后续路径：

    - 等待目标会话的回复。
    - 可选地允许请求方和目标交换有限数量的后续轮次。
    - 要求目标生成一条公告消息。
    - 将该公告交付到可见渠道或线程。

    该 A2A 路径是对等发送的回退方案，用于发送方需要可见后续回复的情况。当无关会话可以看到并向 ACP 目标发消息时，它仍会启用，例如在宽泛的 `tools.sessions.visibility` 设置下。

    只有当请求方是自己父级拥有的一次性 ACP 子项的父级时，OpenClaw 才会跳过 A2A 后续。在这种情况下，在任务完成之上运行 A2A 可能会用子项结果唤醒父级，将父级回复转发回子项，并创建父级/子项回声循环。对于这种拥有的子项情况，`sessions_send` 结果会报告 `delivery.status="skipped"`，因为完成路径已经负责处理结果。

  </Accordion>
  <Accordion title="恢复现有会话">
    使用 `resumeSessionId` 继续之前的 ACP 会话，而不是重新开始。智能体会通过 `session/load` 重放其对话历史，因此会带着之前的完整上下文继续。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常见用例：

    - 将 Codex 会话从你的笔记本电脑交接到手机，让你的智能体从你离开的地方继续。
    - 继续你之前在 CLI 中交互式启动的编码会话，现在通过你的智能体无头运行。
    - 接续因 Gateway 网关重启或空闲超时而中断的工作。

    注意：

    - `resumeSessionId` 仅在 `runtime: "acp"` 时适用；默认子智能体运行时会忽略这个仅限 ACP 的字段。
    - `streamTo` 仅在 `runtime: "acp"` 时适用；默认子智能体运行时会忽略这个仅限 ACP 的字段。
    - `resumeSessionId` 是主机本地 ACP/执行框架恢复 ID，而不是 OpenClaw 渠道会话键；OpenClaw 在分发前仍会检查 ACP 生成策略和目标智能体策略，而 ACP 后端或执行框架负责加载该上游 ID 的授权。
    - `resumeSessionId` 会恢复上游 ACP 对话历史；`thread` 和 `mode` 仍会正常应用到你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目标智能体必须支持 `session/load`（Codex 和 Claude Code 支持）。
    - 如果找不到会话 ID，生成会以清晰错误失败，不会静默回退到新会话。

  </Accordion>
  <Accordion title="部署后冒烟测试">
    Gateway 网关部署后，请运行实时端到端检查，而不是仅信任单元测试：

    1. 验证目标主机上的已部署 Gateway 网关版本和提交。
    2. 打开一个临时 ACPX 桥接会话连接到实时智能体。
    3. 要求该智能体调用 `sessions_spawn`，并使用 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，以及任务 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 验证 `accepted=yes`、真实的 `childSessionKey`，且没有验证器错误。
    5. 清理临时桥接会话。

    将门禁保持在 `mode: "run"`，并跳过 `streamTo: "parent"`，线程绑定的 `mode: "session"` 和流中继路径是独立的、更丰富的集成检查。

  </Accordion>
</AccordionGroup>

## 沙箱兼容性

ACP 会话目前运行在主机运行时上，**不**在 OpenClaw 沙箱内运行。

<Warning>
**安全边界：**

- 外部执行框架可以按照自己的 CLI 权限和所选 `cwd` 读写。
- OpenClaw 的沙箱策略**不会**包装 ACP 执行框架执行。
- OpenClaw 仍会强制执行 ACP 功能门禁、允许的智能体、会话所有权、渠道绑定和 Gateway 网关交付策略。
- 对于由沙箱强制执行的 OpenClaw 原生工作，请使用 `runtime: "subagent"`。

</Warning>

当前限制：

- 如果请求方会话处于沙箱隔离状态，则 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP 生成都会被阻止。
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。

## 会话目标解析

大多数 `/acp` 操作接受可选会话目标（`session-key`、`session-id` 或 `session-label`）。

**解析顺序：**

1. 显式目标参数（或用于 `/acp steer` 的 `--session`）
   - 先尝试键名
   - 再尝试 UUID 形式的会话 ID
   - 再尝试标签
2. 当前线程绑定（如果此对话/线程绑定到 ACP 会话）。
3. 当前请求者会话回退。

当前对话绑定和线程绑定都会参与
步骤 2。

如果没有解析出目标，OpenClaw 会返回清晰的错误
（`Unable to resolve session target: ...`）。

## ACP 控制

| 命令                 | 作用                                                      | 示例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP 会话；可选当前绑定或线程绑定。                  | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目标会话中正在进行的轮次。                           | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 向正在运行的会话发送引导指令。                           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 关闭会话并解除线程目标绑定。                             | `/acp close`                                                  |
| `/acp status`        | 显示后端、模式、状态、运行时选项和能力。                 | `/acp status`                                                 |
| `/acp set-mode`      | 为目标会话设置运行时模式。                               | `/acp set-mode plan`                                          |
| `/acp set`           | 写入通用运行时配置选项。                                 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 设置运行时工作目录覆盖。                                 | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 设置审批策略配置文件。                                   | `/acp permissions strict`                                     |
| `/acp timeout`       | 设置运行时超时（秒）。                                   | `/acp timeout 120`                                            |
| `/acp model`         | 设置运行时模型覆盖。                                     | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除会话运行时选项覆盖。                                 | `/acp reset-options`                                          |
| `/acp sessions`      | 从存储中列出最近的 ACP 会话。                            | `/acp sessions`                                               |
| `/acp doctor`        | 后端健康状态、能力和可执行修复建议。                     | `/acp doctor`                                                 |
| `/acp install`       | 打印确定性的安装和启用步骤。                             | `/acp install`                                                |

`/acp status` 显示有效的运行时选项，以及运行时级别和
后端级别的会话标识符。当后端缺少某项能力时，不支持的控制错误会
清晰呈现。`/acp sessions` 会读取当前绑定会话或请求者会话的
存储；目标令牌
（`session-key`、`session-id` 或 `session-label`）会通过
Gateway 网关会话发现进行解析，包括自定义的按智能体 `session.store`
根目录。

### 运行时选项映射

`/acp` 提供便捷命令和通用设置器。等价
操作：

| 命令                         | 映射到                               | 备注                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 运行时配置键 `model`                 | 对于 Codex ACP，OpenClaw 会将 `openai-codex/<model>` 规范化为适配器模型 ID，并将诸如 `openai-codex/gpt-5.4/high` 的斜杠 reasoning 后缀映射到 `reasoning_effort`。 |
| `/acp set thinking <level>`  | 运行时配置键 `thinking`              | 对于 Codex ACP，OpenClaw 会在适配器支持时发送对应的 `reasoning_effort`。                                                                             |
| `/acp permissions <profile>` | 运行时配置键 `approval_policy`       | —                                                                                                                                                                             |
| `/acp timeout <seconds>`     | 运行时配置键 `timeout`               | —                                                                                                                                                                             |
| `/acp cwd <path>`            | 运行时 cwd 覆盖                      | 直接更新。                                                                                                                                                                    |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 使用 cwd 覆盖路径。                                                                                                                                                 |
| `/acp reset-options`         | 清除所有运行时覆盖                   | —                                                                                                                                                                             |

## acpx harness、插件设置和权限

有关 acpx harness 配置（Claude Code / Codex / Gemini CLI
别名）、plugin-tools 和 OpenClaw-tools MCP bridge，以及 ACP
权限模式，请参阅
[ACP agents — 设置](/zh-CN/tools/acp-agents-setup)。

## 故障排除

| 症状 | 可能原因 | 修复 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | 后端插件缺失、已禁用，或被 `plugins.allow` 阻止。 | 安装并启用后端插件；当设置了该允许列表时，在 `plugins.allow` 中包含 `acpx`，然后运行 `/acp doctor`。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP 已全局禁用。 | 设置 `acp.enabled=true`。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 已禁用从普通线程消息自动调度。 | 设置 `acp.dispatch.enabled=true` 以恢复自动线程路由；显式的 `sessions_spawn({ runtime: "acp" })` 调用仍然可用。 |
| `ACP agent "<id>" is not allowed by policy` | 智能体不在允许列表中。 | 使用允许的 `agentId`，或更新 `acp.allowedAgents`。 |
| `/acp doctor` reports backend not ready right after startup | 插件依赖探测或自修复仍在运行。 | 稍等片刻后重新运行 `/acp doctor`；如果仍不健康，请检查后端安装错误以及插件允许/拒绝策略。 |
| Harness command not found | 适配器 CLI 未安装、暂存的插件依赖缺失，或非 Codex 适配器的首次运行 `npx` 拉取失败。 | 运行 `/acp doctor`，修复插件依赖，在 Gateway 网关主机上安装/预热适配器，或显式配置 acpx 智能体命令。 |
| Model-not-found from the harness | 模型 ID 对另一个提供商/harness 有效，但对此 ACP 目标无效。 | 使用该 harness 列出的模型，在 harness 中配置模型，或省略覆盖项。 |
| Vendor auth error from the harness | OpenClaw 状态正常，但目标 CLI/提供商未登录。 | 在 Gateway 网关主机环境中登录，或提供所需的提供商密钥。 |
| `Unable to resolve session target: ...` | 键/ID/标签令牌错误。 | 运行 `/acp sessions`，复制准确的键/标签，然后重试。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活动可绑定对话的情况下使用了 `--bind here`。 | 移动到目标聊天/渠道后重试，或使用未绑定的生成。 |
| `Conversation bindings are unavailable for <channel>.` | 适配器缺少当前对话 ACP 绑定能力。 | 在受支持的位置使用 `/acp spawn ... --thread ...`，配置顶层 `bindings[]`，或移动到受支持的渠道。 |
| `--thread here requires running /acp spawn inside an active ... thread` | 在非线程上下文中使用了 `--thread here`。 | 移动到目标线程，或使用 `--thread auto`/`off`。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 另一个用户拥有活动绑定目标。 | 以所有者身份重新绑定，或使用其他对话或线程。 |
| `Thread bindings are unavailable for <channel>.` | 适配器缺少线程绑定能力。 | 使用 `--thread off`，或移动到受支持的适配器/渠道。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP 运行时位于主机侧；请求方会话已沙箱隔离。 | 从沙箱隔离会话使用 `runtime="subagent"`，或从非沙箱隔离会话运行 ACP 生成。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | 为 ACP 运行时请求了 `sandbox="require"`。 | 对必需的沙箱隔离使用 `runtime="subagent"`，或从非沙箱隔离会话使用带 `sandbox="inherit"` 的 ACP。 |
| `Cannot apply --model ... did not advertise model support` | 目标 harness 未暴露通用 ACP 模型切换。 | 使用声明 ACP `models`/`session/set_model` 的 harness，使用 Codex ACP 模型引用，或如果该 harness 有自己的启动标志，则直接在其中配置模型。 |
| Missing ACP metadata for bound session | ACP 会话元数据已过期/已删除。 | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦线程。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 阻止非交互式 ACP 会话中的写入/执行。 | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway 网关。请参阅[权限配置](/zh-CN/tools/acp-agents-setup#permission-configuration)。 |
| ACP session fails early with little output | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。 | 检查 Gateway 网关日志中的 `AcpRuntimeError`。对于完整权限，设置 `permissionMode=approve-all`；对于优雅降级，设置 `nonInteractivePermissions=deny`。 |
| ACP session stalls indefinitely after completing work | Harness 进程已完成，但 ACP 会话未报告完成。 | 使用 `ps aux \| grep acpx` 监控；手动终止过期进程。 |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` | 内部事件信封泄漏跨过了 ACP 边界。 | 更新 OpenClaw 并重新运行完成流程；外部 harness 应只接收纯完成提示。 |

## 相关内容

- [ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)
- [智能体发送](/zh-CN/tools/agent-send)
- [CLI 后端](/zh-CN/gateway/cli-backends)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（桥接模式）](/zh-CN/cli/acp)
- [子智能体](/zh-CN/tools/subagents)
