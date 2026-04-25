---
read_when:
    - 通过 ACP 运行编码 harness
    - 在消息渠道上设置与会话绑定的 ACP 会话
    - 将消息渠道会话绑定到持久化 ACP 会话
    - ACP 后端和插件连接的故障排除
    - 调试 ACP 完成结果传递或智能体到智能体循环
    - 从聊天中操作 /acp 命令
summary: 对 Claude Code、Cursor、Gemini CLI 使用 ACP 运行时会话，并为 Codex ACP 显式回退、OpenClaw ACP 以及其他 harness 智能体使用 ACP 运行时会话
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-25T21:10:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61edab30cc8ae6ed1a88c46a2160224907c2969d76a36c0427871847fba3cc65
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol（ACP）](https://agentclientprotocol.com/) 会话让 OpenClaw 能够通过 ACP 后端插件运行外部编码 harness（例如 Pi、Claude Code、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI，以及其他受支持的 ACPX harness）。

如果你用自然语言要求 OpenClaw 在当前会话中绑定或控制 Codex，OpenClaw 应使用原生 Codex app-server 插件（`/codex bind`、`/codex threads`、`/codex resume`）。如果你要求使用 `/acp`、ACP、acpx，或 Codex 后台子会话，OpenClaw 仍然可以通过 ACP 路由 Codex。每个 ACP 会话启动都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

如果你用自然语言要求 OpenClaw “在一个线程中启动 Claude Code” 或使用其他外部 harness，OpenClaw 应将该请求路由到 ACP 运行时（而不是原生子智能体运行时）。

如果你希望 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到现有的 OpenClaw 渠道会话，请使用 [`openclaw mcp serve`](/zh-CN/cli/mcp) 而不是 ACP。

## 我想要哪个页面？

这里有三个相邻但很容易混淆的功能面：

| 你想要…… | 使用这个 | 说明 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在当前会话中绑定或控制 Codex | `/codex bind`、`/codex threads` | 原生 Codex app-server 路径；包括绑定聊天回复、图片转发、模型 / 快速 / 权限、停止和引导控制。ACP 是显式回退 |
| 通过 OpenClaw 运行 Claude Code、Gemini CLI、显式 Codex ACP 或其他外部 harness | 本页：ACP 智能体 | 绑定到聊天的会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制 |
| 将一个 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端 | [`openclaw acp`](/zh-CN/cli/acp) | 桥接模式。IDE / 客户端通过 stdio / WebSocket 向 OpenClaw 讲 ACP |
| 将本地 AI CLI 复用为纯文本回退模型 | [CLI 后端](/zh-CN/gateway/cli-backends) | 不是 ACP。没有 OpenClaw 工具、没有 ACP 控制、没有 harness 运行时 |

## 这是开箱即用的吗？

通常是的。全新安装会默认启用内置的 `acpx` 运行时插件，并带有插件本地固定版本的 `acpx` 二进制文件，OpenClaw 会在启动时探测并自修复它。运行 `/acp doctor` 可进行就绪性检查。

首次运行的注意事项：

- 目标 harness 适配器（Codex、Claude 等）可能会在你首次使用时通过 `npx` 按需获取。
- 该 harness 的供应商认证仍然必须已存在于宿主机上。
- 如果宿主机没有 npm 或没有网络访问，首次运行的适配器获取会失败，直到缓存被预热或适配器以其他方式安装完成。

## 运维操作手册

在聊天中快速执行 `/acp` 的流程：

1. **启动** — `/acp spawn claude --bind here`、`/acp spawn gemini --mode persistent --thread auto`，或显式使用 `/acp spawn codex --bind here`
2. 在绑定的会话或线程中**工作**（或者显式指定会话键）。
3. **检查状态** — `/acp status`
4. **调整** — `/acp model <provider/model>`、`/acp permissions <profile>`、`/acp timeout <seconds>`
5. **引导**而不替换上下文 — `/acp steer tighten logging and continue`
6. **停止** — `/acp cancel`（当前轮次）或 `/acp close`（会话 + 绑定）

应路由到原生 Codex 插件的自然语言触发词：

- “将这个 Discord 渠道绑定到 Codex。”
- “将这个聊天附加到 Codex 线程 `<id>`。”
- “显示 Codex 线程，然后绑定这个。”

原生 Codex 会话绑定是默认的聊天控制路径。OpenClaw 动态工具仍通过 OpenClaw 执行，而 Codex 原生工具（如 shell / apply-patch）则在 Codex 内部执行。对于 Codex 原生工具事件，OpenClaw 会注入一个按轮次生效的原生钩子中继，使插件钩子可以阻止 `before_tool_call`、观察 `after_tool_call`，并通过 OpenClaw 审批流程路由 Codex `PermissionRequest` 事件。v1 中继刻意保持保守：它不会修改 Codex 原生工具参数、不会重写 Codex 线程记录，也不会拦截最终答案 / Stop 钩子。只有当你想要 ACP 运行时 / 会话模型时，才应使用显式 ACP。嵌入式 Codex 支持边界记录在 [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract) 中。

应路由到 ACP 运行时的自然语言触发词：

- “把这个作为一次性的 Claude Code ACP 会话运行，并总结结果。”
- “对此任务使用 Gemini CLI 在线程中执行，然后在同一个线程中继续后续操作。”
- “通过 ACP 在后台线程中运行 Codex。”

OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，在支持时绑定到当前会话或线程，并将后续操作路由到该会话，直到关闭 / 过期。只有当 ACP 被显式指定，或者所请求的后台运行时仍然需要 ACP 时，Codex 才会走这条路径。

对于 `sessions_spawn`，`runtime: "acp"` 目标是 ACP harness id，例如 `codex`、`claude`、`gemini` 或 `opencode`。不要传入来自 `agents_list` 的普通 OpenClaw 配置智能体 id，除非该条目已显式配置 `agents.list[].runtime.type="acp"`；否则应使用默认子智能体运行时。当某个 OpenClaw 智能体配置了 `runtime.type="acp"` 时，OpenClaw 会使用 `runtime.acp.agent` 作为底层 harness id。

## ACP 与子智能体的区别

当你需要外部 harness 运行时时，请使用 ACP。对于 Codex 会话绑定 / 控制，请使用原生 Codex app-server。若你需要 OpenClaw 原生委派运行，则使用子智能体。

| 区域 | ACP 会话 | 子智能体运行 |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时 | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时 |
| 会话键 | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主要命令 | `/acp ...` | `/subagents ...` |
| 启动工具 | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn`（默认运行时） |

另请参见 [子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

通过 ACP 运行 Claude Code 时，栈结构如下：

1. OpenClaw ACP 会话控制平面
2. 内置 `acpx` 运行时插件
3. Claude ACP 适配器
4. Claude 侧运行时 / 会话机制

重要区别：

- ACP Claude 是一个 harness 会话，具有 ACP 控制、会话恢复、后台任务跟踪，以及可选的会话 / 线程绑定。
- CLI 后端是独立的纯文本本地回退运行时。参见 [CLI 后端](/zh-CN/gateway/cli-backends)。

对运维人员来说，实用规则如下：

- 如果你需要 `/acp spawn`、可绑定的会话、运行时控制或持久化 harness 工作：使用 ACP
- 如果你只需要通过原始 CLI 实现简单的本地文本回退：使用 CLI 后端

## 绑定会话

### 绑定到当前会话

`/acp spawn <harness> --bind here` 会将当前会话固定绑定到已启动的 ACP 会话——不创建子线程，仍在同一个聊天界面中。OpenClaw 继续负责传输、认证、安全和消息传递；该会话中的后续消息会路由到同一个会话；`/new` 和 `/reset` 会原地重置该会话；`/acp close` 会移除绑定。

心智模型：

- **聊天界面** — 人们持续交流的位置（Discord 渠道、Telegram 话题、iMessage 聊天）。
- **ACP 会话** — OpenClaw 路由到的持久化 Codex / Claude / Gemini 运行时状态。
- **子线程 / 话题** — 仅在使用 `--thread ...` 时创建的可选额外消息界面。
- **运行时工作区** — harness 运行所在的文件系统位置（`cwd`、仓库检出目录、后端工作区）。它独立于聊天界面。

示例：

- `/codex bind` — 保持此聊天不变，启动或附加原生 Codex app-server，并将未来消息路由到这里。
- `/codex model gpt-5.4`、`/codex fast on`、`/codex permissions yolo` — 从聊天中调整已绑定的原生 Codex 线程。
- `/codex stop` 或 `/codex steer focus on the failing tests first` — 控制当前活跃的原生 Codex 轮次。
- `/acp spawn codex --bind here` — 对 Codex 使用显式 ACP 回退。
- `/acp spawn codex --thread auto` — OpenClaw 可能会创建一个子线程 / 话题并绑定到那里。
- `/acp spawn codex --bind here --cwd /workspace/repo` — 同样绑定当前聊天，但 Codex 在 `/workspace/repo` 中运行。

说明：

- `--bind here` 与 `--thread ...` 互斥。
- `--bind here` 仅在声明支持当前会话绑定的渠道上可用；否则 OpenClaw 会返回清晰的“不支持”消息。绑定会在 Gateway 网关重启后继续保留。
- 在 Discord 上，只有当 OpenClaw 需要为 `--thread auto|here` 创建子线程时，才需要 `spawnAcpSessions`——对于 `--bind here` 不需要。
- 如果你在未指定 `--cwd` 的情况下启动到另一个 ACP 智能体，OpenClaw 默认会继承**目标智能体的**工作区。若继承的路径不存在（`ENOENT` / `ENOTDIR`），则会回退到后端默认值；其他访问错误（例如 `EACCES`）则会作为启动错误直接呈现。

### 绑定到线程的会话

当某个渠道适配器启用了线程绑定时，ACP 会话可以绑定到线程：

- OpenClaw 将一个线程绑定到目标 ACP 会话。
- 该线程中的后续消息会路由到已绑定的 ACP 会话。
- ACP 输出会回传到同一个线程。
- 取消聚焦 / 关闭 / 归档 / 空闲超时或最大时长到期时，绑定会被移除。

线程绑定支持取决于具体适配器。如果当前渠道适配器不支持线程绑定，OpenClaw 会返回清晰的“不支持 / 不可用”消息。

线程绑定 ACP 所需的功能标志：

- `acp.enabled=true`
- `acp.dispatch.enabled` 默认开启（设置为 `false` 可暂停 ACP 分发）
- 渠道适配器的 ACP 线程启动标志已启用（适配器特定）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

### 支持线程的渠道

- 任何暴露会话 / 线程绑定能力的渠道适配器。
- 当前内置支持：
  - Discord 线程 / 渠道
  - Telegram 话题（群组 / 超级群中的论坛话题，以及私信话题）
- 插件渠道也可以通过相同的绑定接口添加支持。

## 渠道特定设置

对于非临时性工作流，请在顶层 `bindings[]` 条目中配置持久化 ACP 绑定。

### 绑定模型

- `bindings[].type="acp"` 表示一个持久化 ACP 会话绑定。
- `bindings[].match` 标识目标会话：
  - Discord 渠道或线程：`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram 论坛话题：`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles 私信 / 群聊：`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    对于稳定的群组绑定，优先使用 `chat_id:*` 或 `chat_identifier:*`。
  - iMessage 私信 / 群聊：`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    对于稳定的群组绑定，优先使用 `chat_id:*`。
- `bindings[].agentId` 是所属的 OpenClaw 智能体 id。
- 可选 ACP 覆盖项位于 `bindings[].acp` 下：
  - `mode`（`persistent` 或 `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### 每个智能体的运行时默认值

使用 `agents.list[].runtime` 可为每个智能体一次性定义 ACP 默认值：

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

- OpenClaw 会确保配置的 ACP 会话在使用前已经存在。
- 该渠道或话题中的消息会被路由到已配置的 ACP 会话。
- 在已绑定的会话中，`/new` 和 `/reset` 会原地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的绑定）在存在时仍会生效。
- 对于未显式指定 `cwd` 的跨智能体 ACP 启动，OpenClaw 会从智能体配置中继承目标智能体的工作区。
- 缺失的继承工作区路径会回退到后端默认 `cwd`；非缺失的访问失败会作为启动错误直接返回。

## 启动 ACP 会话（接口）

### 从 `sessions_spawn`

使用 `runtime: "acp"` 可从智能体轮次或工具调用中启动一个 ACP 会话。

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

- `runtime` 默认为 `subagent`，因此对于 ACP 会话需要显式设置 `runtime: "acp"`。
- 如果省略 `agentId`，OpenClaw 会在已配置时使用 `acp.defaultAgent`。
- `mode: "session"` 需要 `thread: true` 才能保持一个持久化绑定会话。

接口详情：

- `task`（必填）：发送到 ACP 会话的初始提示词。
- `runtime`（ACP 必填）：必须为 `"acp"`。
- `agentId`（可选）：ACP 目标 harness id。如果设置了 `acp.defaultAgent`，则会回退到该值。
- `thread`（可选，默认 `false`）：在支持时请求线程绑定流程。
- `mode`（可选）：`run`（一次性）或 `session`（持久化）。
  - 默认值为 `run`
  - 如果 `thread: true` 且省略 `mode`，OpenClaw 可能会根据运行时路径默认采用持久化行为
  - `mode: "session"` 需要 `thread: true`
- `cwd`（可选）：请求的运行时工作目录（由后端 / 运行时策略校验）。如果省略，ACP 启动会在已配置时继承目标智能体的工作区；缺失的继承路径会回退到后端默认值，而真实访问错误会被返回。
- `label`（可选）：面向运维人员的标签，用于会话 / 横幅文本。
- `resumeSessionId`（可选）：恢复现有 ACP 会话而不是创建新会话。智能体会通过 `session/load` 回放其会话历史。需要 `runtime: "acp"`。
- `streamTo`（可选）：`"parent"` 会将初始 ACP 运行进度摘要作为系统事件流式返回给请求者会话。
  - 在可用时，接受的响应中会包含 `streamLogPath`，指向一个按会话划分的 JSONL 日志（`<sessionId>.acp-stream.jsonl`），你可以 tail 它以查看完整的中继历史。
- `runTimeoutSeconds`（可选）：在 N 秒后中止 ACP 子轮次。`0` 会让该轮次保持在 Gateway 网关的无超时路径上。相同的值会同时应用到 Gateway 运行和 ACP 运行时，这样卡住或额度耗尽的 harness 就不会无限期占用父智能体通道。
- `model`（可选）：ACP 子会话的显式模型覆盖。Codex ACP 启动会在 `session/new` 之前，将 OpenClaw Codex 引用（例如 `openai-codex/gpt-5.4`）标准化为 Codex ACP 启动配置；像 `openai-codex/gpt-5.4/high` 这样的斜杠形式还会设置 Codex ACP 推理强度。其他 harness 必须声明 ACP `models` 并支持 `session/set_model`；否则 OpenClaw / acpx 会清晰失败，而不是静默回退到目标智能体默认值。
- `thinking`（可选）：ACP 子会话的显式 thinking / 推理强度。对于 Codex ACP，`minimal` 会映射为低强度，`low` / `medium` / `high` / `xhigh` 会直接映射，而 `off` 会省略推理强度启动覆盖。

## 交付模型

ACP 会话既可以是交互式工作区，也可以是由父级拥有的后台任务。交付路径取决于这种形态。

### 交互式 ACP 会话

交互式会话用于在可见的聊天界面中持续对话：

- `/acp spawn ... --bind here` 会将当前会话绑定到 ACP 会话。
- `/acp spawn ... --thread ...` 会将某个渠道线程 / 话题绑定到 ACP 会话。
- 持久化配置的 `bindings[].type="acp"` 会将匹配的会话路由到同一个 ACP 会话。

已绑定会话中的后续消息会直接路由到 ACP 会话，ACP 输出也会回传到同一个渠道 / 线程 / 话题。

### 父级拥有的一次性 ACP 会话

由另一个智能体运行启动的一次性 ACP 会话是后台子任务，类似子智能体：

- 父级通过 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求工作。
- 子级在自己的 ACP harness 会话中运行。
- 子级轮次运行在与原生子智能体启动相同的后台通道上，因此一个缓慢的 ACP harness 不会阻塞其他无关的主会话工作。
- 完成后会通过内部任务完成公告路径回报。
- 当需要面向用户的回复时，父级会用普通助手语气重写子级结果。

不要把这条路径当作父子之间的点对点聊天。子级已经有一条回传给父级的完成通道。

### `sessions_send` 与 A2A 交付

`sessions_send` 可在启动后将目标指向另一个会话。对于普通对等会话，OpenClaw 会在注入消息后使用智能体到智能体（A2A）的后续路径：

- 等待目标会话的回复
- 可选地让请求者和目标进行有限轮数的后续交互
- 要求目标生成一条公告消息
- 将该公告投递到可见渠道或线程

这条 A2A 路径是对等发送时的一种回退方案，适用于发送方需要一个可见后续回复的场景。当一个无关会话可以看到并向 ACP 目标发送消息时，例如在较宽松的 `tools.sessions.visibility` 设置下，它仍会保持启用。

只有当请求者是其自身父级拥有的一次性 ACP 子级的父级时，OpenClaw 才会跳过 A2A 后续流程。在这种情况下，如果在任务完成之上再运行 A2A，可能会用子级结果唤醒父级，再把父级回复转发回子级，从而形成父子回声循环。对于这种自有子级场景，`sessions_send` 结果会报告 `delivery.status="skipped"`，因为结果已经由完成路径负责处理。

### 恢复现有会话

使用 `resumeSessionId` 可继续之前的 ACP 会话，而不是重新开始。智能体会通过 `session/load` 回放其会话历史，因此它会在完整上下文下接续之前的工作。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

常见用例：

- 将一个 Codex 会话从你的笔记本电脑移交到手机——告诉你的智能体接着你之前的位置继续
- 继续一个你先前在 CLI 中以交互方式启动、现在改为通过智能体无头运行的编码会话
- 接手因 Gateway 网关重启或空闲超时而中断的工作

说明：

- `resumeSessionId` 需要 `runtime: "acp"`——如果与子智能体运行时一起使用会返回错误。
- `resumeSessionId` 会恢复上游 ACP 会话历史；`thread` 和 `mode` 仍会正常应用于你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍然需要 `thread: true`。
- 目标智能体必须支持 `session/load`（Codex 和 Claude Code 都支持）。
- 如果找不到该会话 ID，启动会以清晰的错误失败——不会静默回退到新会话。

<Accordion title="部署后冒烟测试">

在 Gateway 网关部署之后，运行一次真实的端到端检查，而不要只依赖单元测试：

1. 验证目标宿主机上已部署的 Gateway 网关版本和提交。
2. 打开一个临时的 ACPX 桥接会话，连接到一个在线智能体。
3. 要求该智能体调用 `sessions_spawn`，并设置 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，任务为 `Reply with exactly LIVE-ACP-SPAWN-OK`。
4. 验证 `accepted=yes`、存在真实的 `childSessionKey`，且没有校验器错误。
5. 清理临时桥接会话。

将检查保持在 `mode: "run"`，并跳过 `streamTo: "parent"`——绑定到线程的 `mode: "session"` 和流式中继路径属于单独且更丰富的集成验证阶段。

</Accordion>

## 沙箱兼容性

ACP 会话当前运行在宿主机运行时上，而不是 OpenClaw 沙箱内。

当前限制：

- 如果请求者会话处于沙箱隔离状态，则 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 都会阻止 ACP 启动。
  - 错误：`Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` 与 `runtime: "acp"` 不支持 `sandbox: "require"`。
  - 错误：`sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

当你需要强制沙箱执行时，请使用 `runtime: "subagent"`。

### 从 `/acp` 命令

当需要在聊天中进行显式运维控制时，使用 `/acp spawn`。

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

## 会话目标解析

大多数 `/acp` 操作接受一个可选的会话目标（`session-key`、`session-id` 或 `session-label`）。

解析顺序：

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 先尝试键
   - 然后尝试 UUID 形式的会话 id
   - 最后尝试标签
2. 当前线程绑定（如果此会话 / 线程已绑定到某个 ACP 会话）
3. 当前请求者会话回退

绑定到当前会话和绑定到线程的两种情况都会参与第 2 步。

如果无法解析任何目标，OpenClaw 会返回清晰错误（`Unable to resolve session target: ...`）。

## 启动绑定模式

`/acp spawn` 支持 `--bind here|off`。

| 模式 | 行为 |
| ------ | ---------------------------------------------------------------------- |
| `here` | 原地绑定当前活跃会话；如果没有活跃会话则失败。 |
| `off`  | 不创建当前会话绑定。 |

说明：

- `--bind here` 是“让这个渠道或聊天由 Codex 提供支持”这一操作最简单的运维路径。
- `--bind here` 不会创建子线程。
- `--bind here` 仅适用于暴露当前会话绑定支持的渠道。
- `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

## 启动线程模式

`/acp spawn` 支持 `--thread auto|here|off`。

| 模式 | 行为 |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | 在活跃线程中：绑定该线程。在线程外：在支持时创建 / 绑定一个子线程。 |
| `here` | 要求当前有活跃线程；如果当前不在线程中则失败。 |
| `off`  | 不进行绑定。会话将以未绑定状态启动。 |

说明：

- 在不支持线程绑定的界面上，默认行为实际上等同于 `off`。
- 绑定到线程的启动需要渠道策略支持：
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
- 当你想固定当前会话而不创建子线程时，请使用 `--bind here`。

## ACP 控制

| 命令 | 作用 | 示例 |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | 创建 ACP 会话；可选绑定当前会话或线程。 | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | 取消目标会话当前正在进行的轮次。 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | 向运行中的会话发送引导指令。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | 关闭会话并解除线程目标绑定。 | `/acp close` |
| `/acp status` | 显示后端、模式、状态、运行时选项和能力。 | `/acp status` |
| `/acp set-mode` | 为目标会话设置运行时模式。 | `/acp set-mode plan` |
| `/acp set` | 通用运行时配置选项写入。 | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | 设置运行时工作目录覆盖值。 | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | 设置审批策略配置文件。 | `/acp permissions strict` |
| `/acp timeout` | 设置运行时超时（秒）。 | `/acp timeout 120` |
| `/acp model` | 设置运行时模型覆盖值。 | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | 移除会话运行时选项覆盖值。 | `/acp reset-options` |
| `/acp sessions` | 列出存储中的最近 ACP 会话。 | `/acp sessions` |
| `/acp doctor` | 后端健康状态、能力和可执行修复建议。 | `/acp doctor` |
| `/acp install` | 输出确定性的安装和启用步骤。 | `/acp install` |

`/acp status` 会显示生效中的运行时选项，以及运行时级别和后端级别的会话标识符。当某个后端缺少某项能力时，不支持控制的错误会清晰呈现。`/acp sessions` 会读取当前已绑定会话或请求者会话对应的存储；目标标记（`session-key`、`session-id` 或 `session-label`）会通过 Gateway 网关会话发现进行解析，包括自定义的每智能体 `session.store` 根目录。

## 运行时选项映射

`/acp` 提供便捷命令和一个通用设置器。

等效操作：

- `/acp model <id>` 映射到运行时配置键 `model`。对于 Codex ACP，OpenClaw 会将 `openai-codex/<model>` 标准化为适配器模型 id，并将诸如 `openai-codex/gpt-5.4/high` 这样的斜杠推理后缀映射为 Codex ACP 的 `reasoning_effort`。对于其他 harness，模型控制取决于适配器是否支持 ACP `models` 和 `session/set_model`。
- `/acp set thinking <level>` 映射到运行时配置键 `thinking`。对于 Codex ACP，如果适配器支持，OpenClaw 会发送对应的 `reasoning_effort`。
- `/acp permissions <profile>` 映射到运行时配置键 `approval_policy`。
- `/acp timeout <seconds>` 映射到运行时配置键 `timeout`。
- `/acp cwd <path>` 会直接更新运行时 `cwd` 覆盖值。
- `/acp set <key> <value>` 是通用途径。
  - 特殊情况：`key=cwd` 使用 `cwd` 覆盖路径。
- `/acp reset-options` 会清除目标会话的所有运行时覆盖值。

## acpx harness、插件设置与权限

关于 acpx harness 配置（Claude Code / Codex / Gemini CLI 别名）、plugin-tools 和 OpenClaw-tools MCP 桥接，以及 ACP 权限模式，请参见 [ACP 智能体——设置](/zh-CN/tools/acp-agents-setup)。

## 故障排除

| 症状 | 可能原因 | 修复方法 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | 后端插件缺失或已禁用。 | 安装并启用后端插件，然后运行 `/acp doctor`。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP 已被全局禁用。 | 设置 `acp.enabled=true`。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 来自普通线程消息的分发已被禁用。 | 设置 `acp.dispatch.enabled=true`。 |
| `ACP agent "<id>" is not allowed by policy` | 智能体不在允许列表中。 | 使用允许的 `agentId`，或更新 `acp.allowedAgents`。 |
| `Unable to resolve session target: ...` | 键 / id / 标签标记无效。 | 运行 `/acp sessions`，复制准确的键或标签，然后重试。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活动可绑定会话的情况下使用了 `--bind here`。 | 移动到目标聊天 / 渠道后重试，或使用未绑定启动。 |
| `Conversation bindings are unavailable for <channel>.` | 适配器缺少当前会话 ACP 绑定能力。 | 在支持时使用 `/acp spawn ... --thread ...`，配置顶层 `bindings[]`，或切换到受支持的渠道。 |
| `--thread here requires running /acp spawn inside an active ... thread` | 在线程上下文之外使用了 `--thread here`。 | 移动到目标线程，或使用 `--thread auto` / `off`。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 当前绑定目标由其他用户拥有。 | 由拥有者重新绑定，或使用其他会话或线程。 |
| `Thread bindings are unavailable for <channel>.` | 适配器缺少线程绑定能力。 | 使用 `--thread off`，或切换到受支持的适配器 / 渠道。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP 运行时位于宿主机侧；请求者会话处于沙箱隔离状态。 | 在沙箱隔离会话中使用 `runtime="subagent"`，或从非沙箱隔离会话启动 ACP。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | 为 ACP 运行时请求了 `sandbox="require"`。 | 对需要沙箱隔离的场景使用 `runtime="subagent"`，或从非沙箱隔离会话中以 `sandbox="inherit"` 使用 ACP。 |
| `Cannot apply --model ... did not advertise model support` | 目标 harness 未暴露通用 ACP 模型切换支持。 | 使用声明了 ACP `models` / `session/set_model` 的 harness，使用 Codex ACP 模型引用，或如果该 harness 具有自己的启动标志，则直接在其中配置模型。 |
| 绑定会话缺少 ACP 元数据 | ACP 会话元数据已过期或被删除。 | 使用 `/acp spawn` 重新创建，然后重新绑定 / 聚焦线程。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非交互式 ACP 会话中阻止了写入 / 执行。 | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway 网关。参见[权限配置](/zh-CN/tools/acp-agents-setup#permission-configuration)。 |
| ACP 会话很早失败且输出很少 | 权限提示被 `permissionMode` / `nonInteractivePermissions` 阻止。 | 检查 Gateway 网关日志中的 `AcpRuntimeError`。如需完整权限，将 `permissionMode=approve-all`；如需优雅降级，将 `nonInteractivePermissions=deny`。 |
| ACP 会话在完成工作后无限期卡住 | harness 进程已结束，但 ACP 会话未上报完成。 | 使用 `ps aux \| grep acpx` 监控；手动终止陈旧进程。 |

## 相关内容

- [子智能体](/zh-CN/tools/subagents)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [智能体发送](/zh-CN/tools/agent-send)
