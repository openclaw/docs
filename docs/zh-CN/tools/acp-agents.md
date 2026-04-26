---
read_when:
    - 通过 ACP 运行编码 harness
    - 在消息渠道上设置绑定到会话的 ACP 会话
    - 将消息渠道会话绑定到持久化 ACP 会话
    - 排查 ACP 后端和插件连接问题
    - 调试 ACP 完成结果传递或智能体间循环问题
    - 从聊天中操作 /acp 命令
summary: 对 Claude Code、Cursor、Gemini CLI、显式 Codex ACP 回退、OpenClaw ACP 以及其他 harness 智能体使用 ACP 运行时会话
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-26T03:01:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17cff2c29c897da80ef44c4a9640a323eff595e2e960e72b085a09a690566a37
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol（ACP）](https://agentclientprotocol.com/) 会话让 OpenClaw 能够通过 ACP 后端插件运行外部编码 harness（例如 Pi、Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他受支持的 ACPX harness）。

如果你用自然语言要求 OpenClaw 在当前会话中绑定或控制 Codex，并且已启用内置的 `codex` 插件，OpenClaw 应使用原生 Codex app-server 插件（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`），而不是 ACP。如果你明确要求 `/acp`、ACP、acpx 或 ACP 适配器测试，OpenClaw 仍然可以通过 ACP 路由 Codex。每次 ACP 会话启动都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

如果你用自然语言要求 OpenClaw “在一个线程中启动 Claude Code”或使用其他外部 harness，OpenClaw 应将该请求路由到 ACP 运行时（而不是原生子智能体运行时）。

如果你希望 Codex 或 Claude Code 作为外部 MCP 客户端直接连接
到现有的 OpenClaw 渠道会话，请使用 [`openclaw mcp serve`](/zh-CN/cli/mcp)
而不是 ACP。

## 我想要哪个页面？

这里有三个相邻但很容易混淆的入口：

| 你想要…… | 使用这个 | 说明 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在当前会话中绑定或控制 Codex | `/codex bind`、`/codex threads` | 启用 `codex` 插件时使用原生 Codex app-server 路径；包括已绑定聊天回复、图片转发、模型 / 快速 / 权限控制、停止和引导控制。ACP 是显式回退方案 |
| 通过 OpenClaw 运行 Claude Code、Gemini CLI、显式 Codex ACP 或其他外部 harness | 本页：ACP 智能体 | 聊天绑定会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制 |
| 将一个 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端 | [`openclaw acp`](/zh-CN/cli/acp) | 桥接模式。IDE / 客户端通过 stdio / WebSocket 使用 ACP 与 OpenClaw 通信 |
| 将本地 AI CLI 复用为纯文本回退模型 | [CLI 后端](/zh-CN/gateway/cli-backends) | 不是 ACP。没有 OpenClaw 工具、没有 ACP 控制、没有 harness 运行时 |

## 开箱即用吗？

通常可以。全新安装默认启用内置的 `acpx` 运行时插件，并附带一个插件本地固定版本的 `acpx` 二进制文件，OpenClaw 会在启动时探测并自我修复。运行 `/acp doctor` 可进行就绪性检查。

首次运行的注意事项：

- 如果设置了 `plugins.allow`，它就是一个严格限制的插件清单，必须包含 `acpx`；否则内置默认项会被有意阻止，且 `/acp doctor` 会报告缺少 allowlist 条目。
- 目标 harness 适配器（Codex、Claude 等）可能会在你首次使用时按需通过 `npx` 获取。
- 该 harness 对应的厂商凭证仍然必须已存在于主机上。
- 如果主机没有 npm 或无法访问网络，首次运行时的适配器获取将失败，直到缓存被预热或通过其他方式安装该适配器。

## 支持的 harness 目标

使用内置 `acpx` 后端时，可将以下 harness id 用作 `/acp spawn <id>` 或
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` 的目标：

| Harness id | 典型后端 | 说明 |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adapter                        | 需要主机上存在 Claude Code 凭证。 |
| `codex`    | Codex ACP adapter                              | 仅当原生 `/codex` 不可用或明确请求 ACP 时，才作为显式 ACP 回退。 |
| `copilot`  | GitHub Copilot ACP adapter                     | 需要 Copilot CLI / 运行时凭证。 |
| `cursor`   | Cursor CLI ACP（`cursor-agent acp`）            | 如果本地安装暴露了不同的 ACP 入口点，请覆盖 acpx 命令。 |
| `droid`    | Factory Droid CLI                              | 需要 Factory / Droid 凭证，或在 harness 环境中设置 `FACTORY_API_KEY`。 |
| `gemini`   | Gemini CLI ACP adapter                         | 需要 Gemini CLI 凭证或 API 密钥设置。 |
| `opencode` | OpenCode ACP adapter                           | 需要 OpenCode CLI / 提供商凭证。 |
| `openclaw` | 通过 `openclaw acp` 实现的 OpenClaw Gateway 网关桥接 | 让支持 ACP 的 harness 能够回连到 OpenClaw Gateway 网关会话。 |
| `pi`       | Pi / 内嵌 OpenClaw 运行时                   | 用于 OpenClaw 原生 harness 实验。 |
| `iflow`    | iFlow CLI                                      | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `kilocode` | Kilo Code CLI                                  | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `kimi`     | Kimi / Moonshot CLI                             | 需要主机上存在 Kimi / Moonshot 凭证。 |
| `kiro`     | Kiro CLI                                       | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `qwen`     | Qwen Code / Qwen CLI                           | 需要主机上存在兼容 Qwen 的凭证。 |

自定义 acpx 智能体别名可以在 acpx 本身中配置，但 OpenClaw 策略
在分发前仍会检查 `acp.allowedAgents` 以及任何 `agents.list[].runtime.acp.agent`
映射。

## 运行时前提条件

ACP 会启动一个真实的外部 harness 进程。OpenClaw 负责路由、
后台任务状态、传递、绑定和策略；而 harness 负责其自身的
提供商登录、模型目录、文件系统行为和原生工具。

在责怪 OpenClaw 之前，请先确认：

- `/acp doctor` 报告后端已启用且健康。
- 设置了 allowlist 时，目标 id 已被 `acp.allowedAgents` 允许。
- harness 命令可以在 Gateway 网关主机上启动。
- 该 harness 的提供商凭证已存在（`claude`、`codex`、`gemini`、
  `opencode`、`droid` 等）。
- 所选模型对该 harness 可用。模型 id 不能在不同
  harness 之间通用。
- 请求的 `cwd` 存在且可访问，或者省略 `cwd` 让后端使用其默认值。
- 权限模式与工作内容匹配。非交互式会话无法点击
  原生权限提示，因此大量写入 / 执行的编码任务通常需要一个
  能够无头继续执行的 ACPX 权限配置。

OpenClaw 插件工具和内置 OpenClaw 工具默认不会暴露给 ACP
harness。只有在你希望 harness 直接调用这些工具时，才在
[ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup) 中启用显式 MCP 桥接。

## 运维手册

在聊天中使用 `/acp` 的快速流程：

1. **启动** — `/acp spawn claude --bind here`、`/acp spawn gemini --mode persistent --thread auto`，或显式使用 `/acp spawn codex --bind here`
2. 在已绑定的会话或线程中**工作**（或者显式指定会话键）。
3. **检查状态** — `/acp status`
4. **调整** — `/acp model <provider/model>`、`/acp permissions <profile>`、`/acp timeout <seconds>`
5. **引导**而不替换上下文 — `/acp steer tighten logging and continue`
6. **停止** — `/acp cancel`（当前轮次）或 `/acp close`（会话 + 绑定）

生命周期细节：

- 启动会创建或恢复一个 ACP 运行时会话，在
  OpenClaw 会话存储中记录 ACP 元数据，并且当运行由父级拥有时
  可能会创建一个后台任务。
- 绑定后的后续消息会直接发送到 ACP 会话，直到绑定被
  关闭、失焦、重置或过期。
- Gateway 网关命令保持在本地执行。`/acp ...`、`/status` 和 `/unfocus` 绝不会
  作为普通提示文本发送给已绑定的 ACP harness。
- `cancel` 会在后端支持取消时中止当前轮次；
  它不会删除绑定或会话元数据。
- `close` 会从 OpenClaw 的视角结束 ACP 会话并移除
  绑定。如果 harness 支持恢复，它仍可能保留自己的上游历史记录。
- 空闲运行时工作进程在 `acp.runtime.ttlMinutes` 之后符合清理条件；
  已存储的会话元数据仍可通过 `/acp sessions` 使用。

启用原生 Codex 插件时，应路由到该插件的自然语言触发示例：

- “将这个 Discord 渠道绑定到 Codex。”
- “把这个聊天附加到 Codex 线程 `<id>`。”
- “先显示 Codex 线程，然后绑定这个。”

原生 Codex 会话绑定是默认的聊天控制路径。OpenClaw
动态工具仍通过 OpenClaw 执行，而 Codex 原生工具（例如
shell / apply-patch）则在 Codex 内部执行。对于 Codex 原生工具事件，OpenClaw
会按轮次注入一个原生 hook 中继，以便插件钩子能够阻止
`before_tool_call`、观察 `after_tool_call`，并通过 OpenClaw 审批
路由 Codex `PermissionRequest` 事件。Codex `Stop` 钩子
会被中继到 OpenClaw `before_agent_finalize`，在此插件可以请求
在 Codex 最终生成答案之前再进行一次模型调用。该中继刻意保持保守：
它不会修改 Codex 原生工具参数，也不会重写 Codex
线程记录。只有当你想要 ACP 运行时 / 会话模型时，才使用显式 ACP。内嵌 Codex 支持边界记录在
[Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)
中。

应路由到 ACP 运行时的自然语言触发示例：

- “把这个作为一次性的 Claude Code ACP 会话运行，并总结结果。”
- “这个任务使用 Gemini CLI 在线程中处理，然后把后续消息保留在同一个线程里。”
- “在线程后台通过 ACP 运行 Codex。”

OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，在支持时绑定到当前会话或线程，并将后续消息路由到该会话，直到关闭 / 过期。只有在明确要求 ACP / acpx，或针对所请求操作原生 Codex 插件不可用时，Codex 才会走这一路径。

对于 `sessions_spawn`，只有在 ACP 已启用、
请求方未处于沙箱隔离状态，并且 ACP 运行时后端已加载时，才会公布 `runtime: "acp"`。
它面向 ACP harness id，例如 `codex`、`claude`、`droid`、`gemini` 或 `opencode`。不要传入来自 `agents_list` 的普通 OpenClaw 配置智能体 id，除非该条目
已显式配置 `agents.list[].runtime.type="acp"`；否则应使用
默认的子智能体运行时。当某个 OpenClaw 智能体配置了
`runtime.type="acp"` 时，OpenClaw 会将 `runtime.acp.agent` 用作底层
harness id。

## ACP 与子智能体的区别

如果你想使用外部 harness 运行时，请使用 ACP。启用 `codex` 插件时，如需进行 Codex 会话绑定 / 控制，请使用原生 Codex app-server。如果你想要 OpenClaw 原生的委派运行，请使用子智能体。

| 区域 | ACP 会话 | 子智能体运行 |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时 | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时 |
| 会话键 | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| 启动工具 | 使用 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（默认运行时） |

另请参阅[子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 运行 Claude Code，其栈如下：

1. OpenClaw ACP 会话控制平面
2. 内置的 `acpx` 运行时插件
3. Claude ACP adapter
4. Claude 侧运行时 / 会话机制

重要区别：

- ACP Claude 是一种 harness 会话，具有 ACP 控制、会话恢复、后台任务跟踪以及可选的会话 / 线程绑定。
- CLI 后端是单独的纯文本本地回退运行时。请参阅 [CLI 后端](/zh-CN/gateway/cli-backends)。

对运维人员来说，实用规则是：

- 如果你想要 `/acp spawn`、可绑定会话、运行时控制或持久化 harness 工作：使用 ACP
- 如果你只想通过原始 CLI 使用简单的本地文本回退：使用 CLI 后端

## 已绑定会话

### 当前会话绑定

`/acp spawn <harness> --bind here` 会将当前会话固定到已启动的 ACP 会话 —— 不创建子线程，使用同一个聊天界面。OpenClaw 继续负责传输、凭证、安全和传递；该会话中的后续消息会路由到同一个会话；`/new` 和 `/reset` 会就地重置该会话；`/acp close` 会移除绑定。

心智模型：

- **聊天界面** —— 用户持续交流的位置（Discord 频道、Telegram 话题、iMessage 聊天）。
- **ACP 会话** —— OpenClaw 路由到的持久化 Codex / Claude / Gemini 运行时状态。
- **子线程 / 话题** —— 仅在使用 `--thread ...` 时创建的可选附加消息界面。
- **运行时工作区** —— harness 运行所在的文件系统位置（`cwd`、仓库检出目录、后端工作区）。它独立于聊天界面。

示例：

- `/codex bind` —— 保留当前聊天，启动或附加原生 Codex app-server，并将未来消息路由到这里。
- `/codex model gpt-5.4`、`/codex fast on`、`/codex permissions yolo` —— 在聊天中调整已绑定的原生 Codex 线程。
- `/codex stop` 或 `/codex steer focus on the failing tests first` —— 控制当前活跃的原生 Codex 轮次。
- `/acp spawn codex --bind here` —— 显式使用 Codex 的 ACP 回退。
- `/acp spawn codex --thread auto` —— OpenClaw 可能会创建一个子线程 / 话题并绑定到那里。
- `/acp spawn codex --bind here --cwd /workspace/repo` —— 同样绑定当前聊天，但 Codex 在 `/workspace/repo` 中运行。

说明：

- `--bind here` 和 `--thread ...` 互斥。
- `--bind here` 仅适用于声明支持当前会话绑定的渠道；否则 OpenClaw 会返回清晰的不支持提示。绑定会在 gateway 重启后继续保留。
- 在 Discord 上，只有当 OpenClaw 需要为 `--thread auto|here` 创建子线程时，才需要 `spawnAcpSessions` —— 对 `--bind here` 不需要。
- 如果你启动到另一个 ACP 智能体且未指定 `--cwd`，OpenClaw 默认会继承**目标智能体的**工作区。缺失的继承路径（`ENOENT` / `ENOTDIR`）会回退到后端默认值；其他访问错误（例如 `EACCES`）会作为启动错误直接显示。
- Gateway 网关管理命令在已绑定会话中仍在本地处理。尤其是，`/acp ...` 命令由 OpenClaw 处理，即使普通后续文本会路由到已绑定的 ACP 会话；只要该界面启用了命令处理，`/status` 和 `/unfocus` 也始终在本地处理。

### 线程绑定会话

当渠道适配器启用了线程绑定时，ACP 会话可以绑定到线程：

- OpenClaw 将一个线程绑定到目标 ACP 会话。
- 该线程中的后续消息会路由到已绑定的 ACP 会话。
- ACP 输出会回传到同一个线程。
- 失焦 / 关闭 / 归档 / 空闲超时或最大存活时间到期会移除绑定。
- `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是
  Gateway 网关命令，而不是发给 ACP harness 的提示。

线程绑定支持取决于具体适配器。如果当前渠道适配器不支持线程绑定，OpenClaw 会返回清晰的不支持 / 不可用提示。

线程绑定 ACP 所需的功能标志：

- `acp.enabled=true`
- `acp.dispatch.enabled` 默认开启（设置为 `false` 可暂停 ACP 分发）
- 已启用渠道适配器的 ACP 线程启动标志（适配器相关）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

### 支持线程的渠道

- 任何公开会话 / 线程绑定能力的渠道适配器。
- 当前内置支持：
  - Discord 线程 / 频道
  - Telegram 话题（群组 / 超级群组中的论坛话题，以及私信话题）
- 插件渠道也可以通过同一绑定接口添加支持。

## 渠道特定设置

对于非临时性工作流，请在顶层 `bindings[]` 条目中配置持久化 ACP 绑定。

### 绑定模型

- `bindings[].type="acp"` 标记一个持久化 ACP 会话绑定。
- `bindings[].match` 标识目标会话：
  - Discord 频道或线程：`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram 论坛话题：`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles 私信 / 群聊：`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对于稳定的群组绑定，优先使用 `chat_id:*` 或 `chat_identifier:*`。
  - iMessage 私信 / 群聊：`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对于稳定的群组绑定，优先使用 `chat_id:*`。
- `bindings[].agentId` 是拥有该绑定的 OpenClaw 智能体 id。
- 可选的 ACP 覆盖项位于 `bindings[].acp` 下：
  - `mode`（`persistent` 或 `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### 每个智能体的运行时默认值

使用 `agents.list[].runtime` 为每个智能体一次性定义 ACP 默认值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness id，例如 `codex` 或 `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP 绑定会话的覆盖优先级：

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 全局 ACP 默认值（例如 `acp.backend`）

示例：

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

行为：

- OpenClaw 会确保配置的 ACP 会话在使用前已存在。
- 该频道或话题中的消息会路由到配置的 ACP 会话。
- 在已绑定会话中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的绑定）在存在时仍然适用。
- 对于未显式指定 `cwd` 的跨智能体 ACP 启动，OpenClaw 会从智能体配置中继承目标智能体工作区。
- 缺失的继承工作区路径会回退到后端默认 `cwd`；非缺失类访问失败会作为启动错误直接显示。

## 启动 ACP 会话（接口）

### 从 `sessions_spawn` 启动

使用 `runtime: "acp"` 可从智能体轮次或工具调用中启动 ACP 会话。

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

说明：

- `runtime` 默认为 `subagent`，因此对于 ACP 会话请显式设置 `runtime: "acp"`。
- 如果省略 `agentId`，配置后 OpenClaw 会使用 `acp.defaultAgent`。
- `mode: "session"` 需要 `thread: true` 才能保留一个持久化的已绑定会话。

接口细节：

- `task`（必填）：发送到 ACP 会话的初始提示。
- `runtime`（ACP 必填）：必须为 `"acp"`。
- `agentId`（可选）：ACP 目标 harness id。若已设置，则回退到 `acp.defaultAgent`。
- `thread`（可选，默认 `false`）：在支持时请求线程绑定流程。
- `mode`（可选）：`run`（单次运行）或 `session`（持久化）。
  - 默认值为 `run`
  - 如果 `thread: true` 且省略 `mode`，OpenClaw 可能会根据运行时路径默认采用持久化行为
  - `mode: "session"` 需要 `thread: true`
- `cwd`（可选）：请求的运行时工作目录（由后端 / 运行时策略校验）。如果省略，则在已配置时，ACP 启动会继承目标智能体工作区；缺失的继承路径会回退到后端默认值，而真实访问错误会直接返回。
- `label`（可选）：用于会话 / 横幅文本中的面向运维人员的标签。
- `resumeSessionId`（可选）：恢复现有 ACP 会话，而不是创建新会话。智能体会通过 `session/load` 重放其会话历史。需要 `runtime: "acp"`。
- `streamTo`（可选）：`"parent"` 会将初始 ACP 运行的进度摘要作为系统事件流式返回给请求方会话。
  - 可用时，接受的响应还会包含 `streamLogPath`，指向一个会话级 JSONL 日志（`<sessionId>.acp-stream.jsonl`），你可以对其执行 tail 以查看完整的中继历史。
- `runTimeoutSeconds`（可选）：在 N 秒后中止 ACP 子轮次。`0` 会让该轮次保持 gateway 的无超时路径。相同的值也会应用到 Gateway 运行和 ACP 运行时，因此卡住或配额耗尽的 harness 不会无限期占用父智能体通道。
- `model`（可选）：ACP 子会话的显式模型覆盖。Codex ACP 启动会在 `session/new` 之前，将 `openai-codex/gpt-5.4` 这样的 OpenClaw Codex 引用规范化为 Codex ACP 启动配置；像 `openai-codex/gpt-5.4/high` 这样的斜杠形式还会设置 Codex ACP 推理强度。其他 harness 必须声明 ACP `models` 并支持 `session/set_model`；否则 OpenClaw / acpx 会明确失败，而不是静默回退到目标智能体默认值。
- `thinking`（可选）：ACP 子会话的显式 thinking / 推理强度。对于 Codex ACP，`minimal` 会映射为低强度，`low` / `medium` / `high` / `xhigh` 会直接映射，`off` 则会省略推理强度启动覆盖。

## 传递模型

ACP 会话既可以是交互式工作区，也可以是由父级拥有的后台工作。传递路径取决于其形态。

### 交互式 ACP 会话

交互式会话旨在在一个可见的聊天界面中持续交流：

- `/acp spawn ... --bind here` 将当前会话绑定到 ACP 会话。
- `/acp spawn ... --thread ...` 将一个渠道线程 / 话题绑定到 ACP 会话。
- 持久化配置的 `bindings[].type="acp"` 会将匹配的会话路由到同一个 ACP 会话。

已绑定会话中的后续消息会直接路由到 ACP 会话，ACP 输出也会回传到同一个频道 / 线程 / 话题。

OpenClaw 发送给 harness 的内容：

- 普通的已绑定后续消息会作为提示文本发送，只有在
  harness / 后端支持时才会附带附件。
- `/acp` 管理命令和本地 Gateway 网关命令会在
  ACP 分发前被拦截。
- 运行时生成的完成事件会按目标进行具体化。OpenClaw
  智能体会收到 OpenClaw 的内部运行时上下文 envelope；外部 ACP
  harness 会收到包含子结果和指令的普通提示。原始
  `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` envelope 绝不应发送给
  外部 harness，也不应作为 ACP 用户转录文本持久化。
- ACP 转录条目使用用户可见的触发文本或普通
  完成提示。内部事件元数据会尽可能以结构化形式保留在 OpenClaw 中，
  而不会被视为用户撰写的聊天内容。

### 父级拥有的一次性 ACP 会话

由另一个智能体运行启动的一次性 ACP 会话是后台子任务，类似于子智能体：

- 父级通过 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求执行工作。
- 子级在其自己的 ACP harness 会话中运行。
- 子级轮次运行在与原生子智能体启动相同的后台通道上，因此缓慢的 ACP harness 不会阻塞无关的主会话工作。
- 完成结果会通过任务完成通知路径回传。OpenClaw 会先将内部完成元数据转换为普通 ACP 提示，再发送给外部 harness，因此 harness 看不到 OpenClaw 专用的运行时上下文标记。
- 当需要面向用户的回复时，父级会以普通助手语气重写子级结果。

不要将此路径视为父级与子级之间的点对点聊天。子级已经拥有一个回传给父级的完成通道。

### `sessions_send` 和 A2A 传递

`sessions_send` 可以在启动后以另一个会话为目标。对于普通对等会话，OpenClaw 会在注入消息后使用智能体到智能体（A2A）的后续路径：

- 等待目标会话的回复
- 可选地让请求方和目标方交换有限轮数的后续消息
- 要求目标生成一条通知消息
- 将该通知传递到可见频道或线程

该 A2A 路径是对等发送场景中的回退方案，用于发送方需要一个可见的后续回复时。当一个无关会话能够看到并向 ACP 目标发送消息时，它仍保持启用，例如在较宽松的 `tools.sessions.visibility` 设置下。

只有当请求方是其自身所拥有的一次性 ACP 子任务的父级时，OpenClaw 才会跳过 A2A 后续流程。在这种情况下，在任务完成之上再运行 A2A 可能会用子级结果唤醒父级，再将父级回复转发回子级，并造成父 / 子回声循环。对于这种自有子任务场景，`sessions_send` 结果会报告 `delivery.status="skipped"`，因为完成路径已经负责处理该结果。

### 恢复现有会话

使用 `resumeSessionId` 可继续先前的 ACP 会话，而不是重新开始。智能体会通过 `session/load` 重放其会话历史，因此它会带着之前的完整上下文继续。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

常见用例：

- 将一个 Codex 会话从你的笔记本交接到手机 —— 告诉你的智能体从你离开的地方继续
- 继续一个你最初在 CLI 中以交互方式启动、现在想通过智能体无头运行的编码会话
- 继续因 gateway 重启或空闲超时而中断的工作

说明：

- `resumeSessionId` 需要 `runtime: "acp"` —— 如果与子智能体运行时一起使用，会返回错误。
- `resumeSessionId` 会恢复上游 ACP 会话历史；`thread` 和 `mode` 仍会正常应用到你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍然需要 `thread: true`。
- 目标智能体必须支持 `session/load`（Codex 和 Claude Code 都支持）。
- 如果找不到该会话 ID，启动会以明确错误失败 —— 不会静默回退到新会话。

<Accordion title="部署后的冒烟测试">

在 gateway 部署后，请运行一次真实的端到端检查，而不是只相信单元测试：

1. 在目标主机上验证已部署的 gateway 版本和提交。
2. 打开一个临时的 ACPX 桥接会话，连接到一个在线智能体。
3. 要求该智能体调用 `sessions_spawn`，并设置 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，以及任务 `Reply with exactly LIVE-ACP-SPAWN-OK`。
4. 验证 `accepted=yes`、存在真实的 `childSessionKey`，并且没有校验器错误。
5. 清理该临时桥接会话。

将门槛保持在 `mode: "run"`，并跳过 `streamTo: "parent"` —— 线程绑定的 `mode: "session"` 和流式中继路径属于单独且更丰富的集成验证。

</Accordion>

## 沙箱兼容性

ACP 会话当前运行在主机运行时上，而不是 OpenClaw 沙箱内。

安全边界：

- 外部 harness 可以根据其自身 CLI 权限以及所选
  `cwd` 进行读取 / 写入。
- OpenClaw 的沙箱策略不会包裹 ACP harness 执行。
- OpenClaw 仍会强制执行 ACP 功能门控、允许的智能体、会话所有权、
  渠道绑定以及 Gateway 网关传递策略。
- 当你需要受沙箱强制约束的 OpenClaw 原生工作时，请使用 `runtime: "subagent"`。

当前限制：

- 如果请求方会话处于沙箱隔离状态，则 ACP 启动会被阻止，无论是 `sessions_spawn({ runtime: "acp" })` 还是 `/acp spawn`。
  - 错误：`Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- 带有 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。
  - 错误：`sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

当你需要受沙箱强制约束的执行时，请使用 `runtime: "subagent"`。

### 从 `/acp` 命令启动

在需要时，使用 `/acp spawn` 从聊天中进行显式运维控制。

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

请参阅[斜杠命令](/zh-CN/tools/slash-commands)。

## 会话目标解析

大多数 `/acp` 操作都接受一个可选的会话目标（`session-key`、`session-id` 或 `session-label`）。

解析顺序：

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 先尝试键
   - 然后尝试 UUID 形状的会话 id
   - 最后尝试标签
2. 当前线程绑定（如果此会话 / 线程已绑定到 ACP 会话）
3. 当前请求方会话回退

当前会话绑定和线程绑定都会参与步骤 2。

如果无法解析出目标，OpenClaw 会返回明确错误（`Unable to resolve session target: ...`）。

## 启动绑定模式

`/acp spawn` 支持 `--bind here|off`。

| 模式 | 行为 |
| ------ | ---------------------------------------------------------------------- |
| `here` | 就地绑定当前活动会话；如果当前没有活动会话则失败。 |
| `off`  | 不创建当前会话绑定。 |

说明：

- `--bind here` 是运维人员实现“让这个频道或聊天由 Codex 提供支持”的最简单路径。
- `--bind here` 不会创建子线程。
- `--bind here` 仅在公开当前会话绑定支持的渠道上可用。
- `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

## 启动线程模式

`/acp spawn` 支持 `--thread auto|here|off`。

| 模式 | 行为 |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | 在活动线程中：绑定该线程。在线程外：在支持时创建 / 绑定一个子线程。 |
| `here` | 要求当前处于活动线程中；如果不在线程中则失败。 |
| `off`  | 不绑定。会话以未绑定状态启动。 |

说明：

- 在非线程绑定界面上，默认行为实际上等同于 `off`。
- 线程绑定启动需要渠道策略支持：
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
- 当你想固定当前会话且不创建子线程时，请使用 `--bind here`。

## ACP 控制

| 命令 | 作用 | 示例 |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP 会话；可选当前绑定或线程绑定。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目标会话的进行中轮次。 | `/acp cancel agent:codex:acp:<uuid>`                          |
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
| `/acp sessions`      | 从存储中列出最近的 ACP 会话。 | `/acp sessions`                                               |
| `/acp doctor`        | 后端健康状态、能力和可执行修复建议。 | `/acp doctor`                                                 |
| `/acp install`       | 输出确定性的安装和启用步骤。 | `/acp install`                                                |

`/acp status` 会显示生效的运行时选项，以及运行时级和后端级的会话标识符。当某个后端缺少某项能力时，不支持控制的错误会被清晰地显示出来。`/acp sessions` 会读取当前已绑定会话或请求方会话的存储；目标令牌（`session-key`、`session-id` 或 `session-label`）会通过 gateway 会话发现进行解析，包括自定义的每智能体 `session.store` 根路径。

## 运行时选项映射

`/acp` 提供便捷命令和通用设置器。

等效操作：

- `/acp model <id>` 映射到运行时配置键 `model`。对于 Codex ACP，OpenClaw 会将 `openai-codex/<model>` 规范化为适配器模型 id，并将诸如 `openai-codex/gpt-5.4/high` 这样的斜杠推理后缀映射为 Codex ACP `reasoning_effort`。对于其他 harness，模型控制取决于适配器是否支持 ACP `models` 和 `session/set_model`。
- `/acp set thinking <level>` 映射到运行时配置键 `thinking`。对于 Codex ACP，当适配器支持时，OpenClaw 会发送对应的 `reasoning_effort`。
- `/acp permissions <profile>` 映射到运行时配置键 `approval_policy`。
- `/acp timeout <seconds>` 映射到运行时配置键 `timeout`。
- `/acp cwd <path>` 直接更新运行时 `cwd` 覆盖值。
- `/acp set <key> <value>` 是通用路径。
  - 特殊情况：`key=cwd` 使用 `cwd` 覆盖路径。
- `/acp reset-options` 会清除目标会话的所有运行时覆盖值。

## acpx harness、插件设置和权限

有关 acpx harness 配置（Claude Code / Codex / Gemini CLI 别名）、  
plugin-tools 和 OpenClaw-tools MCP 桥接，以及 ACP 权限模式，请参阅  
[ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)。

## 故障排除

| 症状 | 可能原因 | 修复方法 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 后端插件缺失、被禁用，或被 `plugins.allow` 阻止。 | 安装并启用后端插件；设置了该 allowlist 时，将 `acpx` 包含在 `plugins.allow` 中；然后运行 `/acp doctor`。 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已在全局范围被禁用。 | 设置 `acp.enabled=true`。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已禁用来自普通线程消息的分发。 | 设置 `acp.dispatch.enabled=true`。 |
| `ACP agent "<id>" is not allowed by policy`                                 | 智能体不在 allowlist 中。 | 使用被允许的 `agentId`，或更新 `acp.allowedAgents`。 |
| `/acp doctor` reports backend not ready right after startup                 | 插件依赖探测或自我修复仍在运行。 | 稍等片刻后重新运行 `/acp doctor`；如果仍然不健康，请检查后端安装错误以及插件允许 / 拒绝策略。 |
| Harness command not found                                                   | 适配器 CLI 未安装，或首次运行的 `npx` 获取失败。 | 在 Gateway 网关主机上安装 / 预热该适配器，或显式配置 acpx 智能体命令。 |
| Model-not-found from the harness                                            | 该模型 id 对另一个提供商 / harness 有效，但对这个 ACP 目标无效。 | 使用该 harness 列出的模型、在 harness 中配置该模型，或省略该覆盖值。 |
| Vendor auth error from the harness                                          | OpenClaw 正常，但目标 CLI / 提供商尚未登录。 | 在 Gateway 网关主机环境中登录，或提供所需的提供商密钥。 |
| `Unable to resolve session target: ...`                                     | 键 / id / 标签令牌错误。 | 运行 `/acp sessions`，复制精确的键 / 标签后重试。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活动且可绑定的会话中使用了 `--bind here`。 | 切换到目标聊天 / 频道后重试，或使用不绑定的启动方式。 |
| `Conversation bindings are unavailable for <channel>.`                      | 适配器缺少当前会话 ACP 绑定能力。 | 在支持时使用 `/acp spawn ... --thread ...`、配置顶层 `bindings[]`，或切换到受支持的渠道。 |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在线程上下文之外使用了 `--thread here`。 | 切换到目标线程，或使用 `--thread auto` / `off`。 |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 当前绑定目标归另一位用户所有。 | 由所有者重新绑定，或使用其他会话或线程。 |
| `Thread bindings are unavailable for <channel>.`                            | 适配器缺少线程绑定能力。 | 使用 `--thread off`，或切换到受支持的适配器 / 渠道。 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 运行时在主机侧运行；请求方会话处于沙箱隔离状态。 | 在沙箱隔离会话中使用 `runtime="subagent"`，或从非沙箱隔离会话启动 ACP。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 为 ACP 运行时请求了 `sandbox="require"`。 | 对需要沙箱隔离的场景使用 `runtime="subagent"`，或从非沙箱隔离会话以 `sandbox="inherit"` 使用 ACP。 |
| `Cannot apply --model ... did not advertise model support`                  | 目标 harness 未公开通用 ACP 模型切换能力。 | 使用公开 ACP `models` / `session/set_model` 的 harness、使用 Codex ACP 模型引用，或如果该 harness 有自己的启动标志，则直接在其中配置模型。 |
| Missing ACP metadata for bound session                                      | ACP 会话元数据已过时 / 被删除。 | 使用 `/acp spawn` 重新创建，然后重新绑定 / 聚焦线程。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 在非交互 ACP 会话中阻止写入 / 执行。 | 将 `plugins.entries.acpx.config.permissionMode` 设为 `approve-all` 并重启 gateway。请参阅[权限配置](/zh-CN/tools/acp-agents-setup#permission-configuration)。 |
| ACP session fails early with little output                                  | 权限提示被 `permissionMode` / `nonInteractivePermissions` 阻止。 | 检查 gateway 日志中的 `AcpRuntimeError`。若要完全开放权限，设置 `permissionMode=approve-all`；若要优雅降级，设置 `nonInteractivePermissions=deny`。 |
| ACP session stalls indefinitely after completing work                       | Harness 进程已结束，但 ACP 会话未报告完成。 | 使用 `ps aux \| grep acpx` 监控；手动杀掉陈旧进程。 |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 内部事件 envelope 泄露穿过了 ACP 边界。 | 更新 OpenClaw 并重新运行完成流程；外部 harness 应只接收到普通完成提示。 |

## 相关

- [子智能体](/zh-CN/tools/subagents)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [智能体发送](/zh-CN/tools/agent-send)
