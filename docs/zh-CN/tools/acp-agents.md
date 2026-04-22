---
read_when:
    - 通过 ACP 运行编码 harness
    - 在消息渠道上设置与对话绑定的 ACP 会话
    - 将消息渠道中的对话绑定到持久化的 ACP 会话
    - 排查 ACP 后端和插件接线问题
    - 调试 ACP 完成结果传递或智能体到智能体循环
    - 从聊天中操作 `/acp` 命令
summary: 对 Codex、Claude Code、Cursor、Gemini CLI、OpenClaw ACP 和其他 harness 智能体使用 ACP 运行时会话
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-22T00:34:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP 智能体

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 会话让 OpenClaw 能够通过 ACP 后端插件运行外部编码 harness（例如 Pi、Claude Code、Codex、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI，以及其他受支持的 ACPX harness）。

如果你用自然语言要求 OpenClaw “在 Codex 里运行这个”或“在线程中启动 Claude Code”，OpenClaw 应该将该请求路由到 ACP 运行时（而不是原生子智能体运行时）。每次 ACP 会话启动都会被跟踪为一个[后台任务](/zh-CN/automation/tasks)。

如果你想让 Codex 或 Claude Code 作为外部 MCP 客户端直接连接
到现有的 OpenClaw 渠道会话，请使用 [`openclaw mcp serve`](/cli/mcp)
而不是 ACP。

## 我该看哪个页面？

这里有三个容易混淆的相邻功能入口：

| 你想要…… | 使用这个 | 说明 |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 通过 OpenClaw 运行 Codex、Claude Code、Gemini CLI 或其他外部 harness | 本页：ACP 智能体 | 与聊天绑定的会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制 |
| 将一个 OpenClaw Gateway 网关会话暴露为供编辑器或客户端使用的 ACP 服务器 | [`openclaw acp`](/cli/acp) | 桥接模式。IDE/客户端 通过 stdio/WebSocket 用 ACP 与 OpenClaw 通信 |
| 将本地 AI CLI 复用为纯文本回退模型 | [CLI 后端](/zh-CN/gateway/cli-backends) | 不是 ACP。没有 OpenClaw 工具、没有 ACP 控制、没有 harness 运行时 |

## 开箱即用吗？

通常可以。

- 全新安装现在默认启用内置的 `acpx` 运行时插件。
- 内置的 `acpx` 插件会优先使用其插件本地固定版本的 `acpx` 二进制文件。
- 启动时，OpenClaw 会探测该二进制文件，并在需要时自行修复。
- 如果你想快速检查就绪状态，请先使用 `/acp doctor`。

首次使用时仍可能发生的情况：

- 某个目标 harness 适配器可能会在你第一次使用该 harness 时通过 `npx` 按需拉取。
- 该 harness 对应厂商的认证信息仍需已存在于主机上。
- 如果主机没有 npm/网络访问权限，首次运行时的适配器拉取可能会失败，直到缓存被预热或适配器通过其他方式安装。

示例：

- `/acp spawn codex`：OpenClaw 应该已经可以引导启动 `acpx`，但 Codex ACP 适配器仍可能需要首次运行拉取。
- `/acp spawn claude`：Claude ACP 适配器的情况相同，另外还需要该主机上存在 Claude 侧认证。

## 面向操作人员的快速流程

如果你想要一份实用的 `/acp` 操作手册，请使用这一节：

1. 启动一个会话：
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. 在绑定的会话或线程中工作（或者显式指定该会话键）。
3. 检查运行时状态：
   - `/acp status`
4. 根据需要调整运行时选项：
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. 在不替换上下文的情况下推动一个活动会话继续：
   - `/acp steer tighten logging and continue`
6. 停止工作：
   - `/acp cancel`（停止当前轮次），或
   - `/acp close`（关闭会话并移除绑定）

## 面向用户的快速开始

自然语言请求示例：

- “把这个 Discord 渠道绑定到 Codex。”
- “在这里的一个线程里启动一个持久化的 Codex 会话，并让它保持专注。”
- “把这个作为一次性的 Claude Code ACP 会话运行，并总结结果。”
- “把这个 iMessage 聊天绑定到 Codex，并让后续消息继续使用同一个工作区。”
- “这个任务用 Gemini CLI 在线程中处理，然后后续继续在同一个线程里跟进。”

OpenClaw 应该执行的操作：

1. 选择 `runtime: "acp"`。
2. 解析请求的 harness 目标（`agentId`，例如 `codex`）。
3. 如果请求绑定当前会话，并且当前活动渠道支持该功能，就把 ACP 会话绑定到该会话。
4. 否则，如果请求线程绑定，并且当前渠道支持该功能，就把 ACP 会话绑定到该线程。
5. 将后续绑定消息继续路由到同一个 ACP 会话，直到取消聚焦、关闭或过期。

## ACP 与子智能体的区别

如果你想使用外部 harness 运行时，请用 ACP。  
如果你想使用 OpenClaw 原生的委派执行，请用子智能体。

| 区域 | ACP 会话 | 子智能体运行 |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时 | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时 |
| 会话键 | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主要命令 | `/acp ...` | `/subagents ...` |
| 启动工具 | `sessions_spawn` 且使用 `runtime:"acp"` | `sessions_spawn`（默认运行时） |

另请参阅 [Sub-agents](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 运行的 Claude Code，其堆栈是：

1. OpenClaw ACP 会话控制平面
2. 内置的 `acpx` 运行时插件
3. Claude ACP 适配器
4. Claude 侧运行时/会话机制

重要区别：

- ACP Claude 是一种 harness 会话，具有 ACP 控制、会话恢复、后台任务跟踪以及可选的会话/线程绑定。
- CLI 后端是独立的、仅文本的本地回退运行时。参见 [CLI 后端](/zh-CN/gateway/cli-backends)。

对于操作人员，实用规则是：

- 想要 `/acp spawn`、可绑定会话、运行时控制或持久化 harness 工作：使用 ACP
- 想要通过原始 CLI 获得简单的本地文本回退：使用 CLI 后端

## 绑定会话

### 绑定当前会话

当你希望当前会话成为一个持久的 ACP 工作区，而不创建子线程时，请使用 `/acp spawn <harness> --bind here`。

行为如下：

- OpenClaw 继续负责渠道传输、认证、安全和消息投递。
- 当前会话会固定绑定到已启动的 ACP 会话键。
- 该会话中的后续消息会被路由到同一个 ACP 会话。
- `/new` 和 `/reset` 会在原地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭该会话并移除当前会话绑定。

这在实际中的含义：

- `--bind here` 会保留同一个聊天界面。在 Discord 上，当前渠道仍然是当前渠道。
- `--bind here` 仍然可以在你启动新的工作时创建一个新的 ACP 会话。这个绑定会将该会话附加到当前会话。
- `--bind here` 本身不会创建 Discord 子线程或 Telegram 话题。
- ACP 运行时仍然可以拥有自己的工作目录（`cwd`）或由后端管理的磁盘工作区。该运行时工作区独立于聊天界面，并不意味着会创建新的消息线程。
- 如果你启动到另一个 ACP 智能体，且没有传入 `--cwd`，OpenClaw 默认会继承**目标智能体的**工作区，而不是请求方的工作区。
- 如果继承的工作区路径不存在（`ENOENT`/`ENOTDIR`），OpenClaw 会回退到后端默认的 `cwd`，而不是静默复用错误的目录树。
- 如果继承的工作区存在但无法访问（例如 `EACCES`），启动会返回真实的访问错误，而不是丢弃 `cwd`。

理解模型：

- 聊天界面：人们持续交流的地方（`Discord channel`、`Telegram topic`、`iMessage chat`）
- ACP 会话：OpenClaw 路由到的持久化 Codex/Claude/Gemini 运行时状态
- 子线程/话题：一种可选的额外消息界面，仅在使用 `--thread ...` 时创建
- 运行时工作区：harness 运行所在的文件系统位置（`cwd`、仓库检出目录、后端工作区）

示例：

- `/acp spawn codex --bind here`：保留当前聊天，启动或附加一个 Codex ACP 会话，并将此后的消息路由到它
- `/acp spawn codex --thread auto`：OpenClaw 可能会创建一个子线程/话题，并在其中绑定该 ACP 会话
- `/acp spawn codex --bind here --cwd /workspace/repo`：与上面相同的聊天绑定，但 Codex 在 `/workspace/repo` 中运行

当前会话绑定支持：

- 宣告支持当前会话绑定的聊天/消息渠道，可以通过共享的会话绑定路径使用 `--bind here`。
- 具有自定义线程/话题语义的渠道，仍可在同一个共享接口之后提供渠道专用的规范化处理。
- `--bind here` 始终表示“原地绑定当前会话”。
- 通用的当前会话绑定使用共享的 OpenClaw 绑定存储，并且在常规 Gateway 网关重启后仍会保留。

说明：

- 在 `/acp spawn` 上，`--bind here` 与 `--thread ...` 互斥。
- 在 Discord 上，`--bind here` 会原地绑定当前渠道或线程。只有在 OpenClaw 需要为 `--thread auto|here` 创建子线程时，才需要 `spawnAcpSessions`。
- 如果当前活动渠道不暴露当前会话 ACP 绑定能力，OpenClaw 会返回清晰的“不支持”消息。
- `resume` 和“新会话”问题是 ACP 会话层面的问题，而不是渠道层面的问题。你可以在不改变当前聊天界面的情况下复用或替换运行时状态。

### 绑定到线程的会话

当某个渠道适配器启用了线程绑定时，ACP 会话可以绑定到线程：

- OpenClaw 将一个线程绑定到目标 ACP 会话。
- 该线程中的后续消息会被路由到已绑定的 ACP 会话。
- ACP 输出会被投递回同一个线程。
- 取消聚焦、关闭、归档、空闲超时或最长存活时间到期后，绑定会被移除。

线程绑定支持取决于适配器本身。如果当前活动渠道适配器不支持线程绑定，OpenClaw 会返回清晰的“不支持/不可用”消息。

线程绑定 ACP 所需的功能标志：

- `acp.enabled=true`
- `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停 ACP 分发）
- 启用渠道适配器的 ACP 线程启动标志（适配器专用）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

### 支持线程的渠道

- 任何暴露会话/线程绑定能力的渠道适配器。
- 当前内置支持：
  - Discord 线程/渠道
  - Telegram 话题（群组/超级群组中的论坛话题和私信话题）
- 插件渠道也可以通过相同的绑定接口添加支持。

## 渠道专用设置

对于非临时性工作流，请在顶层 `bindings[]` 条目中配置持久化 ACP 绑定。

### 绑定模型

- `bindings[].type="acp"` 表示一个持久化 ACP 会话绑定。
- `bindings[].match` 用于标识目标会话：
  - Discord 渠道或线程：`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram 论坛话题：`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles 私信/群聊：`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对于稳定的群组绑定，优先使用 `chat_id:*` 或 `chat_identifier:*`。
  - iMessage 私信/群聊：`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对于稳定的群组绑定，优先使用 `chat_id:*`。
- `bindings[].agentId` 是所属的 OpenClaw 智能体 id。
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

- OpenClaw 会在使用前确保已配置的 ACP 会话存在。
- 该渠道或话题中的消息会被路由到已配置的 ACP 会话。
- 在已绑定的会话中，`/new` 和 `/reset` 会在原地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的绑定）在存在时仍然适用。
- 对于未显式指定 `cwd` 的跨智能体 ACP 启动，OpenClaw 会从智能体配置继承目标智能体的工作区。
- 缺失的继承工作区路径会回退到后端默认 `cwd`；而非缺失的访问失败则会作为启动错误直接暴露。

## 启动 ACP 会话（接口）

### 从 `sessions_spawn` 启动

使用 `runtime: "acp"` 从智能体轮次或工具调用中启动 ACP 会话。

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
- 如果省略 `agentId`，OpenClaw 会在已配置时使用 `acp.defaultAgent`。
- `mode: "session"` 需要 `thread: true`，以保留一个持久化的已绑定会话。

接口细节：

- `task`（必需）：发送到 ACP 会话的初始提示。
- `runtime`（ACP 必需）：必须是 `"acp"`。
- `agentId`（可选）：ACP 目标 harness id。若已设置，则回退到 `acp.defaultAgent`。
- `thread`（可选，默认 `false`）：在支持时请求线程绑定流程。
- `mode`（可选）：`run`（一次性）或 `session`（持久化）。
  - 默认为 `run`
  - 如果 `thread: true` 且省略 `mode`，OpenClaw 可能会根据运行时路径默认使用持久化行为
  - `mode: "session"` 需要 `thread: true`
- `cwd`（可选）：请求的运行时工作目录（由后端/运行时策略校验）。如果省略，ACP 启动会在已配置时继承目标智能体的工作区；缺失的继承路径会回退到后端默认值，而真实访问错误会直接返回。
- `label`（可选）：用于会话/横幅文本中的、面向操作人员的标签。
- `resumeSessionId`（可选）：恢复一个现有的 ACP 会话，而不是创建新会话。智能体会通过 `session/load` 重放其会话历史。需要 `runtime: "acp"`。
- `streamTo`（可选）：`"parent"` 会将初始 ACP 运行的进度摘要作为系统事件流式返回给请求方会话。
  - 在可用时，接受的响应会包含 `streamLogPath`，指向会话范围内的 JSONL 日志（`<sessionId>.acp-stream.jsonl`），你可以对其执行 tail 以查看完整中继历史。

## 投递模型

ACP 会话既可以是交互式工作区，也可以是由父级拥有的后台工作。投递路径取决于其形态。

### 交互式 ACP 会话

交互式会话用于在可见的聊天界面上持续对话：

- `/acp spawn ... --bind here` 会将当前会话绑定到 ACP 会话。
- `/acp spawn ... --thread ...` 会将一个渠道线程/话题绑定到 ACP 会话。
- 持久化配置的 `bindings[].type="acp"` 会将匹配的会话路由到同一个 ACP 会话。

已绑定会话中的后续消息会直接路由到 ACP 会话，而 ACP 输出会被投递回同一个渠道/线程/话题。

### 父级拥有的一次性 ACP 会话

由另一个智能体运行启动的一次性 ACP 会话是后台子级，类似于子智能体：

- 父级通过 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求工作。
- 子级在它自己的 ACP harness 会话中运行。
- 完成结果会通过内部任务完成通知路径回报。
- 当需要面向用户的回复时，父级会以普通助手口吻重写子级结果。

不要把这条路径视为父级与子级之间的点对点聊天。子级已经拥有一个回传给父级的完成通道。

### `sessions_send` 与 A2A 投递

启动后，`sessions_send` 可以将消息发送到另一个会话。对于普通对等会话，OpenClaw 会在注入消息后使用智能体到智能体（A2A）的后续路径：

- 等待目标会话的回复
- 可选地让请求方和目标方交换有限轮数的后续消息
- 要求目标方生成一条通知消息
- 将该通知投递到可见渠道或线程

这条 A2A 路径是对等发送场景下的一种回退机制，适用于发送方需要一个可见后续回复的情况。当某个无关会话可以看到并向 ACP 目标发送消息时，它仍保持启用，例如在较宽泛的 `tools.sessions.visibility` 设置下。

仅当请求方是其自身所拥有的、父级拥有的一次性 ACP 子级的父级时，OpenClaw 才会跳过 A2A 后续处理。在这种情况下，如果在任务完成之上再运行 A2A，可能会用子级结果唤醒父级，再将父级回复转发回子级，并造成父/子回声循环。对于这种自有子级情形，`sessions_send` 结果会报告 `delivery.status="skipped"`，因为结果已经由完成路径负责处理。

### 恢复现有会话

使用 `resumeSessionId` 可继续之前的 ACP 会话，而不是重新开始。智能体会通过 `session/load` 重放其会话历史，因此它会带着此前的完整上下文继续执行。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

常见用例：

- 将一个 Codex 会话从你的笔记本电脑交接到手机 —— 告诉你的智能体从你上次中断处继续
- 继续你之前在 CLI 中交互式启动的编码会话，现在通过智能体以无头方式继续
- 接着处理因 Gateway 网关重启或空闲超时而中断的工作

说明：

- `resumeSessionId` 需要 `runtime: "acp"` —— 如果与子智能体运行时一起使用，会返回错误。
- `resumeSessionId` 会恢复上游 ACP 会话历史；`thread` 和 `mode` 仍会正常应用于你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍然需要 `thread: true`。
- 目标智能体必须支持 `session/load`（Codex 和 Claude Code 支持）。
- 如果找不到该会话 id，启动会以清晰的错误失败 —— 不会静默回退到新会话。

### 面向操作人员的冒烟测试

在 Gateway 网关部署之后，如果你想快速在线验证 ACP 启动
是否真正端到端可用，而不只是单元测试通过，请使用这个流程。

推荐检查项：

1. 验证目标主机上已部署的 Gateway 网关版本/提交。
2. 确认已部署源码包含
   `src/gateway/sessions-patch.ts` 中的 ACP 血缘验收（`subagent:* or acp:* sessions`）。
3. 打开一个到在线智能体的临时 ACPX 桥接会话（例如
   `jpclawhq` 上的 `razor(main)`）。
4. 要求该智能体调用 `sessions_spawn`，参数如下：
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task：`Reply with exactly LIVE-ACP-SPAWN-OK`
5. 验证该智能体报告：
   - `accepted=yes`
   - 一个真实的 `childSessionKey`
   - 没有校验器错误
6. 清理这个临时 ACPX 桥接会话。

发送给在线智能体的示例提示：

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

说明：

- 除非你有意测试绑定到线程的持久化 ACP 会话，否则请将此冒烟测试保持在 `mode: "run"`。
- 基础检查不要要求 `streamTo: "parent"`。这条路径依赖请求方/会话能力，是单独的集成检查项。
- 将绑定到线程的 `mode: "session"` 测试视为第二阶段、更加完整的集成验证，并从真实的 Discord 线程或 Telegram 话题中执行。

## 沙箱兼容性

ACP 会话当前运行在主机运行时上，而不是在 OpenClaw 沙箱中运行。

当前限制：

- 如果请求方会话处于沙箱中，则无论是 `sessions_spawn({ runtime: "acp" })` 还是 `/acp spawn`，ACP 启动都会被阻止。
  - 错误：`Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` 搭配 `runtime: "acp"` 不支持 `sandbox: "require"`。
  - 错误：`sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

当你需要由沙箱强制执行时，请使用 `runtime: "subagent"`。

### 从 `/acp` 命令启动

在需要从聊天中进行显式操作控制时，使用 `/acp spawn`。

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

参见 [Slash Commands](/zh-CN/tools/slash-commands)。

## 会话目标解析

大多数 `/acp` 操作都接受一个可选的会话目标（`session-key`、`session-id` 或 `session-label`）。

解析顺序：

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 先尝试 key
   - 然后尝试 UUID 形状的 session id
   - 再尝试 label
2. 当前线程绑定（如果此会话/线程已绑定到 ACP 会话）
3. 当前请求方会话回退

当前会话绑定和线程绑定都会参与步骤 2。

如果无法解析出目标，OpenClaw 会返回清晰错误（`Unable to resolve session target: ...`）。

## 启动绑定模式

`/acp spawn` 支持 `--bind here|off`。

| 模式 | 行为 |
| ------ | ---------------------------------------------------------------------- |
| `here` | 原地绑定当前活动会话；如果当前没有活动会话则失败。 |
| `off` | 不创建当前会话绑定。 |

说明：

- `--bind here` 是“让这个渠道或聊天由 Codex 提供支持”的最简单操作路径。
- `--bind here` 不会创建子线程。
- `--bind here` 仅在暴露当前会话绑定支持的渠道上可用。
- `--bind` 和 `--thread` 不能在同一次 `/acp spawn` 调用中组合使用。

## 启动线程模式

`/acp spawn` 支持 `--thread auto|here|off`。

| 模式 | 行为 |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | 在活动线程中：绑定该线程。在线程外：在支持时创建并绑定一个子线程。 |
| `here` | 要求当前处于活动线程中；如果不在则失败。 |
| `off`  | 不进行绑定。会话以未绑定状态启动。 |

说明：

- 在不支持线程绑定的界面上，默认行为实际上等同于 `off`。
- 绑定到线程的启动需要渠道策略支持：
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
- 当你希望固定当前会话且不创建子线程时，请使用 `--bind here`。

## ACP 控制

可用命令族：

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` 会显示生效中的运行时选项，并在可用时同时显示运行时级别和后端级别的会话标识符。

某些控制依赖后端能力。如果某个后端不支持某项控制，OpenClaw 会返回清晰的“不支持该控制”错误。

## ACP 命令手册

| 命令 | 作用 | 示例 |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | 创建 ACP 会话；可选择绑定当前会话或线程。 | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | 取消目标会话中正在进行的轮次。 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | 向运行中的会话发送引导指令。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | 关闭会话并解绑线程目标。 | `/acp close` |
| `/acp status` | 显示后端、模式、状态、运行时选项和能力。 | `/acp status` |
| `/acp set-mode` | 为目标会话设置运行时模式。 | `/acp set-mode plan` |
| `/acp set` | 通用运行时配置项写入。 | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | 设置运行时工作目录覆盖值。 | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | 设置审批策略配置文件。 | `/acp permissions strict` |
| `/acp timeout` | 设置运行时超时（秒）。 | `/acp timeout 120` |
| `/acp model` | 设置运行时模型覆盖值。 | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | 移除会话运行时选项覆盖值。 | `/acp reset-options` |
| `/acp sessions` | 列出存储中的最近 ACP 会话。 | `/acp sessions` |
| `/acp doctor` | 后端健康状态、能力、可执行修复建议。 | `/acp doctor` |
| `/acp install` | 打印确定性的安装与启用步骤。 | `/acp install` |

`/acp sessions` 会读取当前已绑定会话或请求方会话的存储。接受 `session-key`、`session-id` 或 `session-label` 标记的命令，会通过 Gateway 网关会话发现来解析目标，包括每个智能体自定义的 `session.store` 根路径。

## 运行时选项映射

`/acp` 提供便捷命令和一个通用设置器。

等价操作：

- `/acp model <id>` 映射到运行时配置键 `model`。
- `/acp permissions <profile>` 映射到运行时配置键 `approval_policy`。
- `/acp timeout <seconds>` 映射到运行时配置键 `timeout`。
- `/acp cwd <path>` 直接更新运行时 `cwd` 覆盖值。
- `/acp set <key> <value>` 是通用路径。
  - 特殊情况：`key=cwd` 使用 `cwd` 覆盖路径。
- `/acp reset-options` 会清除目标会话的所有运行时覆盖值。

## acpx harness 支持（当前）

当前 acpx 内置 harness 别名：

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor CLI：`cursor-agent acp`）
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

当 OpenClaw 使用 acpx 后端时，除非你的 acpx 配置定义了自定义智能体别名，否则优先将这些值用于 `agentId`。
如果你的本地 Cursor 安装仍然将 ACP 暴露为 `agent acp`，请在你的 acpx 配置中覆盖 `cursor` 智能体命令，而不是更改内置默认值。

直接使用 acpx CLI 也可以通过 `--agent <command>` 指向任意适配器，但这个原始逃生口是 acpx CLI 的功能（不是普通 OpenClaw `agentId` 路径的一部分）。

## 必需配置

核心 ACP 基线：

```json5
{
  acp: {
    enabled: true,
    // 可选。默认值为 true；设为 false 可在保留 /acp 控制的同时暂停 ACP 分发。
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

线程绑定配置取决于具体渠道适配器。Discord 示例：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

如果绑定到线程的 ACP 启动无法工作，请先验证适配器功能标志：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

当前会话绑定不需要创建子线程。它们需要一个活动会话上下文，以及一个暴露 ACP 会话绑定能力的渠道适配器。

参见 [Configuration Reference](/zh-CN/gateway/configuration-reference)。

## acpx 后端的插件设置

全新安装会默认启用内置的 `acpx` 运行时插件，因此 ACP
通常无需手动安装插件即可工作。

先从以下命令开始：

```text
/acp doctor
```

如果你禁用了 `acpx`、通过 `plugins.allow` / `plugins.deny` 拒绝了它，或者想
切换到本地开发检出版本，请使用显式插件路径：

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

开发期间的本地工作区安装：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

然后验证后端健康状态：

```text
/acp doctor
```

### acpx 命令和版本配置

默认情况下，内置的 acpx 后端插件（`acpx`）使用插件本地固定版本的二进制文件：

1. 命令默认指向 ACPX 插件包内插件本地的 `node_modules/.bin/acpx`。
2. 预期版本默认使用扩展固定版本。
3. 启动时会立即将 ACP 后端注册为未就绪。
4. 后台确保作业会验证 `acpx --version`。
5. 如果插件本地二进制文件缺失或版本不匹配，它会运行：
   `npm install --omit=dev --no-save acpx@<pinned>`，然后再次验证。

你可以在插件配置中覆盖命令/版本：

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

说明：

- `command` 接受绝对路径、相对路径或命令名（`acpx`）。
- 相对路径从 OpenClaw 工作区目录解析。
- `expectedVersion: "any"` 会禁用严格版本匹配。
- 当 `command` 指向自定义二进制文件/路径时，插件本地自动安装会被禁用。
- 在后端健康检查运行期间，OpenClaw 启动仍然是非阻塞的。

参见 [Plugins](/zh-CN/tools/plugin)。

### 自动依赖安装

当你通过 `npm install -g openclaw` 全局安装 OpenClaw 时，acpx
运行时依赖（平台特定二进制文件）会通过 postinstall 钩子自动安装。
如果自动安装失败，Gateway 网关仍会正常启动，
并通过 `openclaw acp doctor` 报告缺失的依赖项。

### 插件工具 MCP 桥接

默认情况下，ACPX 会话**不会**向
ACP harness 暴露 OpenClaw 插件注册的工具。

如果你希望 Codex 或 Claude Code 之类的 ACP 智能体调用已安装的
OpenClaw 插件工具（例如 memory recall/store），请启用这个专用桥接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

这会执行以下操作：

- 在 ACPX 会话引导过程中注入一个名为 `openclaw-plugin-tools` 的内置 MCP 服务器。
- 暴露已安装并启用的 OpenClaw
  插件已注册的插件工具。
- 让此功能保持显式开启且默认关闭。

安全与信任说明：

- 这会扩展 ACP harness 的工具暴露面。
- ACP 智能体只能访问 Gateway 网关中已激活的插件工具。
- 应将其视为与允许这些插件在
  OpenClaw 自身中执行相同的信任边界。
- 启用前请审查已安装插件。

自定义 `mcpServers` 仍然和以前一样有效。内置插件工具桥接只是一个
额外的显式启用便利功能，不是通用 MCP 服务器配置的替代品。

### 运行时超时配置

内置的 `acpx` 插件默认将嵌入式运行时轮次超时设置为 120 秒。
这为 Gemini CLI 之类较慢的 harness 提供了足够时间来完成
ACP 启动和初始化。如果你的主机需要不同的
运行时限制，请覆盖它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

修改此值后请重启 Gateway 网关。

### 健康探测智能体配置

内置的 `acpx` 插件在决定嵌入式运行时后端是否就绪时，
会探测一个 harness 智能体。默认值是 `codex`。如果你的部署
使用不同的默认 ACP 智能体，请将探测智能体设置为相同 id：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

修改此值后请重启 Gateway 网关。

## 权限配置

ACP 会话以非交互方式运行 —— 没有 TTY 可用于批准或拒绝文件写入和 shell 执行权限提示。acpx 插件提供了两个配置键，用于控制权限处理方式：

这些 ACPX harness 权限与 OpenClaw 执行审批是分开的，也与 CLI 后端厂商绕过标志分开，例如 Claude CLI `--permission-mode bypassPermissions`。ACPX `approve-all` 是 ACP 会话在 harness 级别的紧急放行开关。

### `permissionMode`

控制 harness 智能体在不提示的情况下可以执行哪些操作。

| 值 | 行为 |
| --------------- | --------------------------------------------------------- |
| `approve-all` | 自动批准所有文件写入和 shell 命令。 |
| `approve-reads` | 仅自动批准读取；写入和执行需要提示。 |
| `deny-all` | 拒绝所有权限提示。 |

### `nonInteractivePermissions`

控制在本应显示权限提示、但没有可交互 TTY 可用时会发生什么（ACP 会话始终属于这种情况）。

| 值 | 行为 |
| ------ | ----------------------------------------------------------------- |
| `fail` | 以 `AcpRuntimeError` 中止会话。**（默认）** |
| `deny` | 静默拒绝该权限并继续执行（平滑降级）。 |

### 配置

通过插件配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

修改这些值后请重启 Gateway 网关。

> **重要：** OpenClaw 当前默认使用 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP 会话中，任何触发权限提示的写入或执行操作都可能因 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` 而失败。
>
> 如果你需要限制权限，请将 `nonInteractivePermissions` 设置为 `deny`，这样会话会平滑降级，而不是直接崩溃。

## 故障排除

| 症状 | 可能原因 | 修复方法 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured` | 后端插件缺失或被禁用。 | 安装并启用后端插件，然后运行 `/acp doctor`。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP 在全局范围被禁用。 | 设置 `acp.enabled=true`。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 来自普通线程消息的分发被禁用。 | 设置 `acp.dispatch.enabled=true`。 |
| `ACP agent "<id>" is not allowed by policy` | 智能体不在允许列表中。 | 使用允许的 `agentId`，或更新 `acp.allowedAgents`。 |
| `Unable to resolve session target: ...` | key/id/label 标记错误。 | 运行 `/acp sessions`，复制精确的 key/label，然后重试。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活动且可绑定的会话中使用了 `--bind here`。 | 移动到目标聊天/渠道后重试，或使用未绑定启动。 |
| `Conversation bindings are unavailable for <channel>.` | 适配器缺少当前会话 ACP 绑定能力。 | 在支持时使用 `/acp spawn ... --thread ...`，配置顶层 `bindings[]`，或切换到受支持的渠道。 |
| `--thread here requires running /acp spawn inside an active ... thread` | 在线程上下文之外使用了 `--thread here`。 | 移动到目标线程，或使用 `--thread auto`/`off`。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 另一个用户拥有当前活动绑定目标。 | 由所有者重新绑定，或使用不同的会话或线程。 |
| `Thread bindings are unavailable for <channel>.` | 适配器缺少线程绑定能力。 | 使用 `--thread off`，或切换到受支持的适配器/渠道。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP 运行时位于主机侧；请求方会话处于沙箱中。 | 从沙箱会话中使用 `runtime="subagent"`，或从非沙箱会话中运行 ACP 启动。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | 为 ACP 运行时请求了 `sandbox="require"`。 | 对需要沙箱隔离的场景使用 `runtime="subagent"`，或者从非沙箱会话中使用带 `sandbox="inherit"` 的 ACP。 |
| 已绑定会话缺少 ACP 元数据 | ACP 会话元数据已过期/被删除。 | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦线程。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非交互式 ACP 会话中阻止了写入/执行。 | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway 网关。参见[权限配置](#permission-configuration)。 |
| ACP 会话很早失败且几乎没有输出 | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。 | 检查 Gateway 网关日志中的 `AcpRuntimeError`。如需完整权限，设置 `permissionMode=approve-all`；如需平滑降级，设置 `nonInteractivePermissions=deny`。 |
| ACP 会话在完成工作后无限期卡住 | harness 进程已结束，但 ACP 会话未报告完成。 | 使用 `ps aux \| grep acpx` 监控；手动终止陈旧进程。 |
