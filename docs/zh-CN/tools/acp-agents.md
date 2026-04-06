---
read_when:
    - 通过 ACP 运行编码 harness
    - 在消息渠道上设置绑定到对话的 ACP 会话
    - 将一个消息渠道对话绑定到持久化 ACP 会话
    - 排查 ACP 后端和插件接线问题
    - 通过聊天操作 `/acp` 命令
summary: 将 ACP 运行时会话用于 Codex、Claude Code、Cursor、Gemini CLI、OpenClaw ACP 和其他 harness 智能体
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-06T12:46:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb651ab39b05e537398623ee06cb952a5a07730fc75d3f7e0de20dd3128e72c6
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP 智能体

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 会话让 OpenClaw 能够通过 ACP 后端插件运行外部编码 harness（例如 Pi、Claude Code、Codex、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI 以及其他受支持的 ACPX harness）。

如果你用自然语言要求 OpenClaw “在 Codex 里运行这个”或“在线程里启动 Claude Code”，OpenClaw 应该将该请求路由到 ACP 运行时（而不是原生子智能体运行时）。每次 ACP 会话启动都会被跟踪为一个[后台任务](/zh-CN/automation/tasks)。

如果你想让 Codex 或 Claude Code 作为外部 MCP 客户端直接连接
到现有 OpenClaw 渠道对话，请使用 [`openclaw mcp serve`](/cli/mcp)
而不是 ACP。

## 我该看哪个页面？

这里有三个相近但很容易混淆的界面：

| 你想要... | 使用这个 | 说明 |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 通过 OpenClaw 运行 Codex、Claude Code、Gemini CLI 或其他外部 harness | 本页：ACP 智能体 | 聊天绑定会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制 |
| 将一个 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端 | [`openclaw acp`](/cli/acp) | 桥接模式。IDE/客户端 通过 stdio/WebSocket 与 OpenClaw 使用 ACP 通信 |
| 将本地 AI CLI 复用为纯文本回退模型 | [CLI Backends](/gateway/cli-backends) | 不是 ACP。没有 OpenClaw 工具、没有 ACP 控制、没有 harness 运行时 |

## 开箱即用吗？

通常可以。

- 全新安装现在默认启用了内置的 `acpx` 运行时插件。
- 内置的 `acpx` 插件会优先使用其插件本地固定版本的 `acpx` 二进制文件。
- 启动时，OpenClaw 会探测该二进制文件，并在需要时自行修复。
- 如果你想快速检查是否就绪，请先运行 `/acp doctor`。

首次使用时仍然可能发生的情况：

- 目标 harness 适配器可能会在你第一次使用该 harness 时按需通过 `npx` 拉取。
- 该 harness 对应的厂商凭证仍然必须存在于主机上。
- 如果主机没有 npm/网络访问能力，首次运行的适配器拉取可能会失败，直到缓存预热完成或适配器通过其他方式安装。

示例：

- `/acp spawn codex`：OpenClaw 应该已经可以引导 `acpx`，但 Codex ACP 适配器仍可能需要首次运行时拉取。
- `/acp spawn claude`：Claude ACP 适配器也是同样情况，另外还需要该主机上存在 Claude 侧凭证。

## 面向操作者的快速流程

如果你想要一个实用的 `/acp` 操作手册，请使用这个流程：

1. 启动一个会话：
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. 在已绑定的对话或线程中工作（或者显式指定该会话键）。
3. 检查运行时状态：
   - `/acp status`
4. 按需调整运行时选项：
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. 在不替换上下文的情况下推动一个活动会话继续前进：
   - `/acp steer tighten logging and continue`
6. 停止工作：
   - `/acp cancel`（停止当前轮次），或者
   - `/acp close`（关闭会话并移除绑定）

## 面向普通用户的快速开始

自然语言请求示例：

- “把这个 Discord 渠道绑定到 Codex。”
- “在这里的一个线程里启动一个持久的 Codex 会话，并保持它专注。”
- “把这个作为一次性 Claude Code ACP 会话运行，并总结结果。”
- “把这个 iMessage 聊天绑定到 Codex，并让后续消息继续在同一个工作区中处理。”
- “在这个任务中使用 Gemini CLI 并放在线程里，然后让后续消息继续在同一个线程中处理。”

OpenClaw 应该执行的操作：

1. 选择 `runtime: "acp"`。
2. 解析所请求的 harness 目标（`agentId`，例如 `codex`）。
3. 如果请求了当前对话绑定，且当前活动渠道支持该能力，则将 ACP 会话绑定到该对话。
4. 否则，如果请求了线程绑定，且当前渠道支持该能力，则将 ACP 会话绑定到该线程。
5. 将后续已绑定消息路由到同一个 ACP 会话，直到取消聚焦、关闭或过期。

## ACP 与子智能体的区别

如果你想要外部 harness 运行时，请使用 ACP。如果你想要 OpenClaw 原生委派运行，请使用子智能体。

| 区域 | ACP 会话 | 子智能体运行 |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时 | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时 |
| 会话键 | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主要命令 | `/acp ...` | `/subagents ...` |
| 启动工具 | `sessions_spawn` 搭配 `runtime:"acp"` | `sessions_spawn`（默认运行时） |

另请参见 [Sub-agents](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 运行的 Claude Code，栈结构如下：

1. OpenClaw ACP 会话控制平面
2. 内置的 `acpx` 运行时插件
3. Claude ACP 适配器
4. Claude 侧运行时/会话机制

重要区别：

- ACP Claude 是一个具有 ACP 控制、会话恢复、后台任务跟踪以及可选对话/线程绑定的 harness 会话。
- CLI 后端是独立的纯文本本地回退运行时。请参见 [CLI Backends](/gateway/cli-backends)。

对于操作者来说，实用规则如下：

- 如果你想要 `/acp spawn`、可绑定会话、运行时控制或持久化 harness 工作：使用 ACP
- 如果你只想通过原始 CLI 获得简单的本地文本回退：使用 CLI 后端

## 已绑定会话

### 当前对话绑定

当你希望当前对话成为一个持久的 ACP 工作区，而不创建子线程时，请使用 `/acp spawn <harness> --bind here`。

行为如下：

- OpenClaw 继续负责渠道传输、凭证、安全和消息投递。
- 当前对话会固定到已启动的 ACP 会话键。
- 该对话中的后续消息会路由到同一个 ACP 会话。
- `/new` 和 `/reset` 会就地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭会话并移除当前对话绑定。

其实际含义：

- `--bind here` 会保留相同的聊天界面。在 Discord 上，当前渠道仍然是当前渠道。
- `--bind here` 在你启动新工作时仍然可以创建一个新的 ACP 会话。该绑定会将该会话附加到当前对话。
- `--bind here` 本身不会创建子 Discord 线程或 Telegram 主题。
- ACP 运行时仍然可以拥有自己的工作目录（`cwd`）或由后端管理的磁盘工作区。该运行时工作区与聊天界面分离，并不意味着会创建新的消息线程。
- 如果你启动到另一个 ACP 智能体，并且没有传入 `--cwd`，OpenClaw 默认会继承**目标智能体的**工作区，而不是请求方的工作区。
- 如果继承的工作区路径不存在（`ENOENT`/`ENOTDIR`），OpenClaw 会回退到后端默认 cwd，而不是静默复用错误的目录树。
- 如果继承的工作区存在但无法访问（例如 `EACCES`），启动会返回真实的访问错误，而不是丢弃 `cwd`。

思维模型：

- 聊天界面：人们继续交流的地方（`Discord channel`、`Telegram topic`、`iMessage chat`）
- ACP 会话：OpenClaw 路由到的持久 Codex/Claude/Gemini 运行时状态
- 子线程/主题：仅在使用 `--thread ...` 时创建的可选额外消息界面
- 运行时工作区：harness 运行所在的文件系统位置（`cwd`、仓库检出目录、后端工作区）

示例：

- `/acp spawn codex --bind here`：保留当前聊天，启动或附加一个 Codex ACP 会话，并将未来消息路由给它
- `/acp spawn codex --thread auto`：OpenClaw 可能会创建一个子线程/主题，并将 ACP 会话绑定到那里
- `/acp spawn codex --bind here --cwd /workspace/repo`：与上面相同的聊天绑定，但 Codex 在 `/workspace/repo` 中运行

当前对话绑定支持：

- 声明支持当前对话绑定的聊天/消息渠道可以通过共享对话绑定路径使用 `--bind here`。
- 具有自定义线程/主题语义的渠道仍然可以在同一共享接口后提供渠道特定的规范化。
- `--bind here` 始终表示“就地绑定当前对话”。
- 通用的当前对话绑定使用共享的 OpenClaw 绑定存储，并且在 Gateway 网关正常重启后仍然保留。

说明：

- 在 `/acp spawn` 上，`--bind here` 与 `--thread ...` 互斥。
- 在 Discord 上，`--bind here` 会就地绑定当前渠道或线程。只有当 OpenClaw 需要为 `--thread auto|here` 创建子线程时，才需要 `spawnAcpSessions`。
- 如果当前活动渠道不支持当前对话 ACP 绑定，OpenClaw 会返回明确的不支持消息。
- `resume` 和“新会话”问题是 ACP 会话问题，而不是渠道问题。你可以在不改变当前聊天界面的前提下复用或替换运行时状态。

### 线程绑定会话

当某个渠道适配器启用了线程绑定时，ACP 会话可以绑定到线程：

- OpenClaw 将一个线程绑定到目标 ACP 会话。
- 该线程中的后续消息会路由到已绑定的 ACP 会话。
- ACP 输出会回传到同一个线程。
- 取消聚焦/关闭/归档/空闲超时或最大时长到期后，绑定会被移除。

线程绑定支持是适配器特定的。如果当前渠道适配器不支持线程绑定，OpenClaw 会返回明确的不支持/不可用消息。

线程绑定 ACP 所需的功能开关：

- `acp.enabled=true`
- `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停 ACP 分发）
- 启用渠道适配器的 ACP 线程启动开关（适配器特定）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

### 支持线程的渠道

- 任何暴露会话/线程绑定能力的渠道适配器。
- 当前内置支持：
  - Discord 线程/渠道
  - Telegram 主题（群组/超级群组中的论坛主题和私信主题）
- 渠道插件可以通过同一绑定接口添加支持。

## 渠道特定设置

对于非临时工作流，请在顶层 `bindings[]` 条目中配置持久化 ACP 绑定。

### 绑定模型

- `bindings[].type="acp"` 将其标记为一个持久化 ACP 对话绑定。
- `bindings[].match` 用于标识目标对话：
  - Discord 渠道或线程：`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram 论坛主题：`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles 私信/群聊：`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    对于稳定的群组绑定，优先使用 `chat_id:*` 或 `chat_identifier:*`。
  - iMessage 私信/群聊：`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    对于稳定的群组绑定，优先使用 `chat_id:*`。
- `bindings[].agentId` 是拥有该绑定的 OpenClaw 智能体 id。
- 可选的 ACP 覆盖位于 `bindings[].acp` 下：
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
- 该渠道或主题中的消息会路由到已配置的 ACP 会话。
- 在已绑定对话中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的绑定）在存在时仍会生效。
- 对于未显式指定 `cwd` 的跨智能体 ACP 启动，OpenClaw 会从智能体配置继承目标智能体工作区。
- 缺失的继承工作区路径会回退到后端默认 cwd；非缺失的访问失败则会作为启动错误暴露出来。

## 启动 ACP 会话（接口）

### 从 `sessions_spawn` 启动

使用 `runtime: "acp"` 从一个智能体轮次或工具调用中启动 ACP 会话。

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
- `mode: "session"` 需要 `thread: true` 才能保留一个持久的已绑定对话。

接口细节：

- `task`（必需）：发送到 ACP 会话的初始提示词。
- `runtime`（ACP 必需）：必须为 `"acp"`。
- `agentId`（可选）：ACP 目标 harness id。如果已设置，则会回退到 `acp.defaultAgent`。
- `thread`（可选，默认 `false`）：在支持时请求线程绑定流程。
- `mode`（可选）：`run`（一次性）或 `session`（持久化）。
  - 默认为 `run`
  - 如果 `thread: true` 且省略 `mode`，OpenClaw 可能会根据运行时路径默认采用持久化行为
  - `mode: "session"` 需要 `thread: true`
- `cwd`（可选）：请求的运行时工作目录（由后端/运行时策略校验）。如果省略，在已配置时 ACP 启动会继承目标智能体工作区；缺失的继承路径会回退到后端默认值，而真实访问错误会被返回。
- `label`（可选）：用于会话/横幅文本中的面向操作者的标签。
- `resumeSessionId`（可选）：恢复一个现有 ACP 会话，而不是创建新会话。智能体会通过 `session/load` 重放其对话历史。需要 `runtime: "acp"`。
- `streamTo`（可选）：`"parent"` 会将初始 ACP 运行进度摘要以系统事件形式流式返回给请求方会话。
  - 在可用时，接受的响应中会包含 `streamLogPath`，指向一个按会话划分的 JSONL 日志（`<sessionId>.acp-stream.jsonl`），你可以对其执行 tail 以查看完整中继历史。

### 恢复现有会话

使用 `resumeSessionId` 可以继续之前的 ACP 会话，而不是重新开始。智能体会通过 `session/load` 重放其对话历史，因此它会带着之前的完整上下文继续执行。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

常见使用场景：

- 将一个 Codex 会话从你的笔记本电脑交接到手机上 —— 告诉你的智能体从上次中断处继续
- 继续一个你之前在 CLI 中交互式启动、现在要通过智能体无头运行的编码会话
- 继续因 Gateway 网关重启或空闲超时而中断的工作

说明：

- `resumeSessionId` 需要 `runtime: "acp"` —— 如果与子智能体运行时一起使用，会返回错误。
- `resumeSessionId` 会恢复上游 ACP 对话历史；`thread` 和 `mode` 仍会正常应用于你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍然需要 `thread: true`。
- 目标智能体必须支持 `session/load`（Codex 和 Claude Code 支持）。
- 如果找不到该会话 id，启动会返回明确错误 —— 不会静默回退为新会话。

### 面向操作者的冒烟测试

当你在 Gateway 网关部署后想快速进行一次在线检查，以确认 ACP 启动
在端到端上确实可用，而不仅仅是通过了单元测试时，请使用这个方法。

推荐 gate：

1. 在目标主机上验证已部署的 Gateway 网关版本/提交。
2. 确认已部署源码在
   `src/gateway/sessions-patch.ts` 中包含 ACP 血缘接受逻辑（`subagent:* or acp:* sessions`）。
3. 打开一个临时 ACPX 桥接会话，连接到一个在线智能体（例如
   `jpclawhq` 上的 `razor(main)`）。
4. 要求该智能体使用以下参数调用 `sessions_spawn`：
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task：`Reply with exactly LIVE-ACP-SPAWN-OK`
5. 验证该智能体报告了：
   - `accepted=yes`
   - 一个真实的 `childSessionKey`
   - 没有校验器错误
6. 清理该临时 ACPX 桥接会话。

给在线智能体的示例提示词：

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

说明：

- 除非你是有意测试
  线程绑定的持久化 ACP 会话，否则请将这个冒烟测试保持在 `mode: "run"`。
- 对于基础 gate，不要要求 `streamTo: "parent"`。该路径依赖于
  请求方/会话能力，是一个单独的集成检查。
- 将线程绑定的 `mode: "session"` 测试视为第二阶段、更丰富的集成
  检查，并从真实 Discord 线程或 Telegram 主题中进行。

## 沙箱兼容性

ACP 会话当前运行在主机运行时上，而不是 OpenClaw 沙箱内部。

当前限制：

- 如果请求方会话处于沙箱隔离状态，那么对于 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn`，ACP 启动都会被阻止。
  - 错误：`Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。
  - 错误：`sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

当你需要强制沙箱执行时，请使用 `runtime: "subagent"`。

### 从 `/acp` 命令启动

在需要时，使用 `/acp spawn` 从聊天中进行显式操作者控制。

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

请参见 [Slash Commands](/zh-CN/tools/slash-commands)。

## 会话目标解析

大多数 `/acp` 操作都接受一个可选的会话目标（`session-key`、`session-id` 或 `session-label`）。

解析顺序：

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 先尝试键
   - 再尝试 UUID 形状的会话 id
   - 然后尝试标签
2. 当前线程绑定（如果这个对话/线程已绑定到某个 ACP 会话）
3. 当前请求方会话回退

当前对话绑定和线程绑定都会参与第 2 步。

如果无法解析任何目标，OpenClaw 会返回明确错误（`Unable to resolve session target: ...`）。

## 启动绑定模式

`/acp spawn` 支持 `--bind here|off`。

| 模式 | 行为 |
| ------ | ---------------------------------------------------------------------- |
| `here` | 就地绑定当前活动对话；如果当前没有活动对话则失败。 |
| `off` | 不创建当前对话绑定。 |

说明：

- `--bind here` 是“让这个渠道或聊天由 Codex 驱动”的最简单操作者路径。
- `--bind here` 不会创建子线程。
- `--bind here` 仅适用于暴露当前对话绑定支持的渠道。
- `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

## 启动线程模式

`/acp spawn` 支持 `--thread auto|here|off`。

| 模式 | 行为 |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | 如果当前在一个活动线程中：绑定该线程。如果不在线程中：在支持时创建/绑定一个子线程。 |
| `here` | 要求当前处于活动线程中；如果不在线程中则失败。 |
| `off` | 不绑定。会话以未绑定状态启动。 |

说明：

- 在不支持线程绑定的界面上，默认行为实际上等同于 `off`。
- 线程绑定启动需要渠道策略支持：
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
- 如果你想固定当前对话而不创建子线程，请使用 `--bind here`。

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

`/acp status` 会显示实际运行时选项，并在可用时显示运行时级别和后端级别的会话标识符。

某些控制取决于后端能力。如果某个后端不支持某项控制，OpenClaw 会返回明确的不支持控制错误。

## ACP 命令手册

| 命令 | 作用 | 示例 |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | 创建 ACP 会话；可选当前绑定或线程绑定。 | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | 取消目标会话当前进行中的轮次。 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | 向正在运行的会话发送引导指令。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | 关闭会话并解除线程目标绑定。 | `/acp close` |
| `/acp status` | 显示后端、模式、状态、运行时选项、能力。 | `/acp status` |
| `/acp set-mode` | 为目标会话设置运行时模式。 | `/acp set-mode plan` |
| `/acp set` | 通用运行时配置选项写入。 | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | 设置运行时工作目录覆盖值。 | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | 设置批准策略配置。 | `/acp permissions strict` |
| `/acp timeout` | 设置运行时超时（秒）。 | `/acp timeout 120` |
| `/acp model` | 设置运行时模型覆盖值。 | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | 移除会话运行时选项覆盖值。 | `/acp reset-options` |
| `/acp sessions` | 从存储中列出最近的 ACP 会话。 | `/acp sessions` |
| `/acp doctor` | 后端健康状态、能力、可操作修复。 | `/acp doctor` |
| `/acp install` | 打印确定性的安装和启用步骤。 | `/acp install` |

`/acp sessions` 会读取当前已绑定会话或请求方会话的存储。接受 `session-key`、`session-id` 或 `session-label` 令牌的命令，会通过 Gateway 网关会话发现来解析目标，其中包括自定义的按智能体划分的 `session.store` 根路径。

## 运行时选项映射

`/acp` 同时提供便捷命令和通用设置器。

等价操作：

- `/acp model <id>` 映射到运行时配置键 `model`。
- `/acp permissions <profile>` 映射到运行时配置键 `approval_policy`。
- `/acp timeout <seconds>` 映射到运行时配置键 `timeout`。
- `/acp cwd <path>` 直接更新运行时 cwd 覆盖值。
- `/acp set <key> <value>` 是通用路径。
  - 特例：`key=cwd` 使用 cwd 覆盖路径。
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
如果你的本地 Cursor 安装仍然将 ACP 暴露为 `agent acp`，请在你的 acpx 配置中覆盖 `cursor` 智能体命令，而不是修改内置默认值。

直接使用 acpx CLI 也可以通过 `--agent <command>` 指向任意适配器，但这个原始逃生口是 acpx CLI 功能（不是正常的 OpenClaw `agentId` 路径）。

## 必需配置

核心 ACP 基线：

```json5
{
  acp: {
    enabled: true,
    // 可选。默认为 true；设为 false 可暂停 ACP 分发，同时保留 /acp 控制。
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

线程绑定配置是渠道适配器特定的。Discord 示例：

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

如果线程绑定 ACP 启动不起作用，请先验证适配器功能开关：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

当前对话绑定不需要创建子线程。它们需要一个活动对话上下文，以及一个暴露 ACP 对话绑定能力的渠道适配器。

请参见 [Configuration Reference](/zh-CN/gateway/configuration-reference)。

## acpx 后端的插件设置

全新安装默认启用了内置的 `acpx` 运行时插件，因此 ACP
通常无需手动安装插件即可使用。

先从这里开始：

```text
/acp doctor
```

如果你禁用了 `acpx`、通过 `plugins.allow` / `plugins.deny` 拒绝了它，或者
想切换到本地开发检出版本，请使用显式插件路径：

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
4. 一个后台确保任务会验证 `acpx --version`。
5. 如果插件本地二进制文件缺失或版本不匹配，它会运行：
   `npm install --omit=dev --no-save acpx@<pinned>`，然后重新验证。

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
- 相对路径相对于 OpenClaw 工作区目录解析。
- `expectedVersion: "any"` 会禁用严格版本匹配。
- 当 `command` 指向自定义二进制文件/路径时，插件本地自动安装会被禁用。
- 后端健康检查运行期间，OpenClaw 启动仍然是非阻塞的。

请参见 [Plugins](/zh-CN/tools/plugin)。

### 自动安装依赖

当你通过 `npm install -g openclaw` 全局安装 OpenClaw 时，acpx
运行时依赖（与平台相关的二进制文件）会通过 postinstall hook 自动安装。
如果自动安装失败，Gateway 网关 仍会正常启动，并通过 `openclaw acp doctor` 报告缺失依赖。

### 插件工具 MCP 桥接

默认情况下，ACPX 会话**不会**向
ACP harness 暴露由 OpenClaw 插件注册的工具。

如果你希望 Codex 或 Claude Code 等 ACP 智能体能够调用已安装的
OpenClaw 插件工具（例如 memory recall/store），请启用专用桥接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

作用如下：

- 在 ACPX 会话
  bootstrap 中注入一个名为 `openclaw-plugin-tools` 的内置 MCP 服务器。
- 暴露已安装并启用的 OpenClaw
  插件已经注册的插件工具。
- 使该功能保持为显式启用，且默认关闭。

安全和信任说明：

- 这会扩展 ACP harness 的工具界面。
- ACP 智能体只能访问 Gateway 网关中已激活的插件工具。
- 应将这视为与你允许这些插件在
  OpenClaw 本身中执行相同的信任边界。
- 在启用前，请检查已安装的插件。

自定义 `mcpServers` 仍然照常可用。内置插件工具桥接是一个
额外的可选便利功能，而不是通用 MCP 服务器配置的替代品。

## 权限配置

ACP 会话以非交互方式运行 —— 没有 TTY 可用于批准或拒绝文件写入和 shell 执行权限提示。acpx 插件提供两个配置键来控制权限处理方式：

这些 ACPX harness 权限与 OpenClaw exec 批准是分离的，也与 CLI 后端的厂商绕过标志（例如 Claude CLI `--permission-mode bypassPermissions`）分离。ACPX 的 `approve-all` 是 ACP 会话在 harness 层面的紧急放开开关。

### `permissionMode`

控制 harness 智能体在不提示的情况下可以执行哪些操作。

| 值 | 行为 |
| --------------- | --------------------------------------------------------- |
| `approve-all` | 自动批准所有文件写入和 shell 命令。 |
| `approve-reads` | 仅自动批准读取；写入和执行需要提示。 |
| `deny-all` | 拒绝所有权限提示。 |

### `nonInteractivePermissions`

控制当本应显示权限提示、但没有可交互 TTY 可用时会发生什么（ACP 会话始终如此）。

| 值 | 行为 |
| ------ | ----------------------------------------------------------------- |
| `fail` | 以 `AcpRuntimeError` 中止会话。**（默认）** |
| `deny` | 静默拒绝该权限并继续（优雅降级）。 |

### 配置

通过插件配置进行设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

修改这些值后，重启 Gateway 网关。

> **重要：** OpenClaw 当前默认使用 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互 ACP 会话中，任何触发权限提示的写入或执行操作都可能失败，并报错 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`。
>
> 如果你需要限制权限，请将 `nonInteractivePermissions` 设为 `deny`，这样会话会优雅降级，而不是直接崩溃。

## 故障排除

| 症状 | 可能原因 | 修复方法 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured` | 后端插件缺失或已禁用。 | 安装并启用后端插件，然后运行 `/acp doctor`。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP 被全局禁用。 | 设置 `acp.enabled=true`。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 来自普通线程消息的分发已禁用。 | 设置 `acp.dispatch.enabled=true`。 |
| `ACP agent "<id>" is not allowed by policy` | 智能体不在允许列表中。 | 使用允许的 `agentId` 或更新 `acp.allowedAgents`。 |
| `Unable to resolve session target: ...` | 键/id/标签令牌错误。 | 运行 `/acp sessions`，复制精确的键/标签，然后重试。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活动可绑定对话的情况下使用了 `--bind here`。 | 移动到目标聊天/渠道后重试，或使用不绑定的启动。 |
| `Conversation bindings are unavailable for <channel>.` | 适配器缺少当前对话 ACP 绑定能力。 | 在支持时使用 `/acp spawn ... --thread ...`、配置顶层 `bindings[]`，或切换到受支持的渠道。 |
| `--thread here requires running /acp spawn inside an active ... thread` | 在线程上下文之外使用了 `--thread here`。 | 切换到目标线程，或使用 `--thread auto`/`off`。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 另一个用户拥有当前活动绑定目标。 | 由拥有者重新绑定，或使用其他对话或线程。 |
| `Thread bindings are unavailable for <channel>.` | 适配器缺少线程绑定能力。 | 使用 `--thread off`，或切换到受支持的适配器/渠道。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP 运行时在主机侧运行；请求方会话处于沙箱隔离状态。 | 从沙箱隔离会话中使用 `runtime="subagent"`，或从非沙箱会话中执行 ACP 启动。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | 对 ACP 运行时请求了 `sandbox="require"`。 | 对必需沙箱隔离使用 `runtime="subagent"`，或从非沙箱会话中将 ACP 与 `sandbox="inherit"` 一起使用。 |
| 已绑定会话缺少 ACP 元数据 | ACP 会话元数据过期/被删除。 | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦线程。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 阻止了非交互 ACP 会话中的写入/执行。 | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway 网关。请参见 [权限配置](#permission-configuration)。 |
| ACP 会话很早失败且输出很少 | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。 | 检查 Gateway 网关日志中的 `AcpRuntimeError`。如需完整权限，设置 `permissionMode=approve-all`；如需优雅降级，设置 `nonInteractivePermissions=deny`。 |
| ACP 会话在完成工作后无限期停滞 | harness 进程已结束，但 ACP 会话未报告完成。 | 使用 `ps aux \| grep acpx` 监控；手动杀掉陈旧进程。 |
