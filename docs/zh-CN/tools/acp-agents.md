---
read_when:
    - 通过 ACP 运行编码运行框架
    - 在消息渠道上设置绑定到对话的 ACP 会话
    - 将消息渠道对话绑定到持久 ACP 会话
    - ACP 后端、插件接线或补全交付的故障排除
    - 从聊天中操作 /acp 命令
sidebarTitle: ACP agents
summary: 通过 ACP 后端运行外部编码运行框架（Claude Code、Cursor、Gemini CLI、显式 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 智能体
x-i18n:
    generated_at: "2026-06-30T13:49:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol（ACP）](https://agentclientprotocol.com/) 会话
让 OpenClaw 通过 ACP 后端插件运行外部编码 harness（例如 Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
受支持的 ACPX harness）。

每次 ACP 会话生成都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

<Note>
**ACP 是外部 harness 路径，不是默认的 Codex 路径。** 原生 Codex app-server 插件负责
`/codex ...` 控制，以及用于智能体轮次的默认 `openai/gpt-*` 嵌入式运行时；ACP 负责
`/acp ...` 控制和 `sessions_spawn({ runtime: "acp" })` 会话。

如果你希望 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到现有的 OpenClaw 渠道对话，
请使用 [`openclaw mcp serve`](/zh-CN/cli/mcp)，而不是 ACP。
</Note>

## 我应该看哪个页面？

| 你想要…                                                                                    | 使用                                  | 说明                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在当前对话中绑定或控制 Codex                                               | `/codex bind`, `/codex threads`       | 启用 `codex` 插件时使用原生 Codex app-server 路径；包括已绑定的聊天回复、图片转发、模型/快速/权限、停止和 Steer 控制。ACP 是显式回退 |
| 通过 OpenClaw 运行 Claude Code、Gemini CLI、显式 Codex ACP 或其他外部 harness | 本页面                             | 绑定到聊天的会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制                                                                                   |
| 将 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端                   | [`openclaw acp`](/zh-CN/cli/acp)            | 桥接模式。IDE/客户端通过 stdio/WebSocket 与 OpenClaw 进行 ACP 通信                                                                                                                            |
| 复用本地 AI CLI 作为纯文本回退模型                                              | [CLI 后端](/zh-CN/gateway/cli-backends) | 不是 ACP。没有 OpenClaw 工具，没有 ACP 控制，没有 harness 运行时                                                                                                                               |

## 这个能开箱即用吗？

可以，安装官方 ACP 运行时插件后即可：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

源码 checkout 可以在 `pnpm install` 后使用本地 `extensions/acpx` 工作区插件。
运行 `/acp doctor` 进行就绪检查。

只有当 ACP **真正可用**时，OpenClaw 才会告诉智能体 ACP 生成能力：
ACP 必须已启用，分发不得被禁用，当前会话不得被沙箱阻止，并且必须已加载运行时后端。
如果这些条件不满足，ACP 插件 Skills 和 `sessions_spawn` ACP 指引会保持隐藏，
这样智能体就不会建议一个不可用的后端。

<AccordionGroup>
  <Accordion title="首次运行注意事项">
    - 如果设置了 `plugins.allow`，它就是一个限制性的插件清单，并且**必须**包含 `acpx`；否则已安装的 ACP 后端会被有意阻止，`/acp doctor` 会报告缺少 allowlist 条目。
    - Codex ACP 适配器随 `acpx` 插件暂存，并会在可行时本地启动。
    - Codex ACP 使用隔离的 `CODEX_HOME` 运行；OpenClaw 会从主机 Codex 配置复制可信项目条目以及安全的模型/提供商路由配置，而凭证、通知和钩子保留在主机配置中。
    - 其他目标 harness 适配器在你第一次使用时，仍可能按需通过 `npx` 拉取。
    - 该 harness 的供应商凭证仍必须存在于主机上。
    - 如果主机没有 npm 或网络访问权限，首次运行的适配器拉取会失败，直到缓存被预热或以其他方式安装适配器。

  </Accordion>
  <Accordion title="运行时前置条件">
    ACP 会启动一个真实的外部 harness 进程。OpenClaw 负责路由、
    后台任务状态、投递、绑定和策略；harness 负责它自己的提供商登录、
    模型目录、文件系统行为和原生工具。

    在归咎于 OpenClaw 之前，请确认：

    - `/acp doctor` 报告后端已启用且健康。
    - 当设置了 `acp.allowedAgents` allowlist 时，目标 id 被允许。
    - harness 命令可以在 Gateway 网关主机上启动。
    - 该 harness 的提供商凭证存在（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 选定模型存在于该 harness 中 - 模型 id 不能跨 harness 通用。
    - 请求的 `cwd` 存在且可访问，或者省略 `cwd`，让后端使用其默认值。
    - 权限模式与工作匹配。非交互式会话无法点击原生权限提示，因此大量写入/执行的编码运行通常需要一个可以无头继续的 ACPX 权限配置。

  </Accordion>
</AccordionGroup>

默认情况下，OpenClaw 插件工具和内置 OpenClaw 工具**不会**暴露给
ACP harness。只有当 harness 应该直接调用这些工具时，才在
[ACP Agents 设置](/zh-CN/tools/acp-agents-setup)中启用显式 MCP 桥接。

## 受支持的 harness 目标

使用 `acpx` 后端时，可以将这些 harness id 用作 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目标：

| Harness id | 典型后端                                | 说明                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 适配器                        | 需要主机上的 Claude Code 凭证。                                              |
| `codex`    | Codex ACP 适配器                              | 仅在原生 `/codex` 不可用或请求 ACP 时作为显式 ACP 回退。 |
| `copilot`  | GitHub Copilot ACP 适配器                     | 需要 Copilot CLI/运行时凭证。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | 如果本地安装暴露了不同的 ACP 入口点，请覆盖 acpx 命令。    |
| `droid`    | Factory Droid CLI                              | 需要 Factory/Droid 凭证，或 harness 环境中的 `FACTORY_API_KEY`。        |
| `gemini`   | Gemini CLI ACP 适配器                         | 需要 Gemini CLI 凭证或 API key 设置。                                          |
| `iflow`    | iFlow CLI                                      | 适配器可用性和模型控制取决于已安装的 CLI。                 |
| `kilocode` | Kilo Code CLI                                  | 适配器可用性和模型控制取决于已安装的 CLI。                 |
| `kimi`     | Kimi/Moonshot CLI                              | 需要主机上的 Kimi/Moonshot 凭证。                                            |
| `kiro`     | Kiro CLI                                       | 适配器可用性和模型控制取决于已安装的 CLI。                 |
| `opencode` | OpenCode ACP 适配器                           | 需要 OpenCode CLI/提供商凭证。                                                |
| `openclaw` | 通过 `openclaw acp` 的 OpenClaw Gateway 网关桥接 | 让支持 ACP 的 harness 回连到 OpenClaw Gateway 网关会话。                 |
| `qwen`     | Qwen Code / Qwen CLI                           | 需要主机上的 Qwen 兼容凭证。                                          |

可以在 acpx 自身中配置自定义 acpx 智能体别名，但 OpenClaw
策略在分发前仍会检查 `acp.allowedAgents` 以及任何
`agents.list[].runtime.acp.agent` 映射。

## 操作员运行手册

从聊天发起的快速 `/acp` 流程：

<Steps>
  <Step title="生成">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`，或显式
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在已绑定的对话或线程中继续（或显式指定会话
    key）。
  </Step>
  <Step title="检查状态">
    `/acp status`
  </Step>
  <Step title="调优">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`。
  </Step>
  <Step title="Steer">
    不替换上下文：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（当前轮次）或 `/acp close`（会话 + 绑定）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命周期详情">
    - 生成会创建或恢复一个 ACP 运行时会话，在 OpenClaw 会话存储中记录 ACP 元数据，并且当运行归父级所有时可能创建一个后台任务。
    - 父级所有的 ACP 会话会被视为后台工作，即使运行时会话是持久的；完成和跨界面投递会通过父任务通知器进行，而不是像普通面向用户的聊天会话那样处理。
    - 任务维护会关闭终止或孤立的父级所有一次性 ACP 会话。持久 ACP 会话会在仍有活动对话绑定时保留；没有活动绑定的过期持久会话会被关闭，以免在所属任务完成或任务记录消失后被静默恢复。
    - 已绑定的后续消息会直接发送到 ACP 会话，直到绑定被关闭、取消聚焦、重置或过期。
    - Gateway 网关命令保持本地执行。`/acp ...`、`/status` 和 `/unfocus` 永远不会作为普通提示文本发送给已绑定的 ACP harness。
    - 当后端支持取消时，`cancel` 会中止活动轮次；它不会删除绑定或会话元数据。
    - 从 OpenClaw 的视角看，`close` 会结束 ACP 会话并移除绑定。如果 harness 支持恢复，它仍可能保留自己的上游历史。
    - `close` 后，acpx 插件会清理 OpenClaw 所有的包装器和适配器进程树，并在 Gateway 网关启动期间回收过期的 OpenClaw 所有 ACPX 孤儿进程。
    - 空闲运行时 worker 可在 `acp.runtime.ttlMinutes` 后被清理；已存储的会话元数据仍可用于 `/acp sessions`。

  </Accordion>
  <Accordion title="原生 Codex 路由规则">
    当原生 Codex
    插件启用时，应路由到它的自然语言触发语：

    - “将这个 Discord 渠道绑定到 Codex。”
    - “将这个聊天附加到 Codex 线程 `<id>`。”
    - “显示 Codex 线程，然后绑定这个。”

    原生 Codex 对话绑定是默认的聊天控制路径。
    OpenClaw 动态工具仍然通过 OpenClaw 执行，而
    Codex 原生工具（例如 shell/apply-patch）在 Codex 内部执行。
    对于 Codex 原生工具事件，OpenClaw 会注入一个按轮次的原生
    钩子中继，使插件钩子可以阻止 `before_tool_call`、观察
    `after_tool_call`，并通过 OpenClaw 审批路由 Codex `PermissionRequest` 事件。
    Codex `Stop` 钩子会被中继到
    OpenClaw `before_agent_finalize`，插件可在此请求再进行一次
    模型传递，然后 Codex 才最终生成答案。该中继保持
    刻意保守：它不会变更 Codex 原生工具
    参数，也不会重写 Codex 线程记录。仅在你需要 ACP 运行时/会话模型时
    使用显式 ACP。嵌入式 Codex
    支持边界记录在
    [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness-runtime#v1-support-contract)中。

  </Accordion>
  <Accordion title="模型 / 提供商 / 运行时选择速查表">
    - 旧版 Codex 模型引用 - 由 Doctor 修复的旧版 Codex OAuth/订阅模型路由。
    - `openai/*` - 用于 OpenAI 智能体轮次的原生 Codex 应用服务器嵌入式运行时。
    - `/codex ...` - 原生 Codex 对话控制。
    - `/acp ...` 或 `runtime: "acp"` - 显式 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然语言触发器">
    应路由到 ACP 运行时的触发器：

    - “将这个作为一次性的 Claude Code ACP 会话运行，并总结结果。”
    - “为这个任务在线程中使用 Gemini CLI，然后将后续跟进保留在同一个线程中。”
    - “通过 ACP 在后台线程中运行 Codex。”

    OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，
    在受支持时绑定到当前对话或线程，并
    将后续跟进路由到该会话，直到关闭/过期。仅当显式指定 ACP/acpx，
    或请求的操作无法使用原生 Codex
    插件时，Codex 才会走这条路径。

    对于 `sessions_spawn`，只有在 ACP
    已启用、请求者未被沙箱隔离且已加载 ACP 运行时
    后端时，才会公布 `runtime: "acp"`。`acp.dispatch.enabled=false` 会暂停自动
    ACP 线程分发，但不会隐藏或阻止显式
    `sessions_spawn({ runtime: "acp" })` 调用。它面向 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode` 等 ACP harness id。除非该条目
    已用 `agents.list[].runtime.type="acp"` 显式配置，
    否则不要传入来自 `agents_list` 的普通
    OpenClaw 配置智能体 id；应改用默认子智能体运行时。当 OpenClaw 智能体
    配置为 `runtime.type="acp"` 时，OpenClaw 会使用
    `runtime.acp.agent` 作为底层 harness id。

  </Accordion>
</AccordionGroup>

## ACP 与子智能体

当你需要外部 harness 运行时时使用 ACP。当 `codex`
插件已启用时，对 Codex 对话绑定/控制使用 **原生 Codex
应用服务器**。当你需要 OpenClaw 原生
委托运行时使用 **子智能体**。

| 区域          | ACP 会话                           | 子智能体运行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时       | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时  |
| 会话键   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主命令 | `/acp ...`                            | `/subagents ...`                   |
| 生成工具    | 带 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（默认运行时） |

另请参阅 [子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 运行的 Claude Code，栈如下：

1. OpenClaw ACP 会话控制平面。
2. 官方 `@openclaw/acpx` 运行时插件。
3. Claude ACP 适配器。
4. Claude 侧运行时/会话机制。

ACP Claude 是一个带 ACP 控制、会话恢复、
后台任务跟踪和可选对话/线程绑定的 **harness 会话**。

CLI 后端是独立的纯文本本地回退运行时 - 请参阅
[CLI 后端](/zh-CN/gateway/cli-backends)。

对操作者而言，实用规则是：

- **需要 `/acp spawn`、可绑定会话、运行时控制或持久 harness 工作？** 使用 ACP。
- **需要通过原始 CLI 做简单的本地文本回退？** 使用 CLI 后端。

## 绑定会话

### 心智模型

- **聊天界面** - 人们持续对话的地方（Discord 频道、Telegram 话题、iMessage 聊天）。
- **ACP 会话** - OpenClaw 路由到的持久 Codex/Claude/Gemini 运行时状态。
- **子线程/话题** - 仅由 `--thread ...` 创建的可选额外消息界面。
- **运行时工作区** - harness 运行所在的文件系统位置（`cwd`、仓库 checkout、后端工作区）。它独立于聊天界面。

### 当前对话绑定

`/acp spawn <harness> --bind here` 会将当前对话固定到
生成的 ACP 会话 - 不创建子线程，使用同一个聊天界面。OpenClaw 继续
负责传输、凭证、安全和投递。该
对话中的后续消息会路由到同一个会话；`/new` 和 `/reset` 会在原位置重置
会话；`/acp close` 会移除绑定。

示例：

```text
/codex bind                                              # 原生 Codex 绑定，将未来消息路由到这里
/codex model gpt-5.4                                     # 调整已绑定的原生 Codex 线程
/codex stop                                              # 控制当前活跃的原生 Codex 轮次
/acp spawn codex --bind here                             # Codex 的显式 ACP 回退
/acp spawn codex --thread auto                           # 可能创建子线程/话题并在那里绑定
/acp spawn codex --bind here --cwd /workspace/repo       # 同一聊天绑定，Codex 在 /workspace/repo 中运行
```

<AccordionGroup>
  <Accordion title="绑定规则和互斥性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 仅适用于声明支持当前对话绑定的渠道；否则 OpenClaw 会返回清晰的不支持消息。绑定会在 Gateway 网关重启后保留。
    - 在 Discord 上，`spawnSessions` 控制 `--thread auto|here` 的子线程创建 - 不控制 `--bind here`。
    - 如果你生成到不同的 ACP 智能体且未指定 `--cwd`，OpenClaw 默认继承**目标智能体的**工作区。缺失的继承路径（`ENOENT`/`ENOTDIR`）会回退到后端默认值；其他访问错误（例如 `EACCES`）会作为生成错误暴露。
    - Gateway 网关管理命令在绑定对话中保持本地处理 - 即使普通后续文本路由到已绑定的 ACP 会话，`/acp ...` 命令也由 OpenClaw 处理；只要该界面已启用命令处理，`/status` 和 `/unfocus` 也始终保持本地处理。

  </Accordion>
  <Accordion title="线程绑定会话">
    当某个渠道适配器启用线程绑定时：

    - OpenClaw 会将线程绑定到目标 ACP 会话。
    - 该线程中的后续消息会路由到已绑定的 ACP 会话。
    - ACP 输出会送回同一个线程。
    - 取消聚焦/关闭/归档/空闲超时或最大年龄过期会移除绑定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 网关命令，而不是给 ACP harness 的提示词。

    线程绑定 ACP 所需的功能标志：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停自动 ACP 线程分发；显式 `sessions_spawn({ runtime: "acp" })` 调用仍可工作）。
    - 已启用渠道适配器线程会话生成（默认值：`true`）：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`

    线程绑定支持因适配器而异。如果当前活跃的渠道
    适配器不支持线程绑定，OpenClaw 会返回清晰的
    不支持/不可用消息。

  </Accordion>
  <Accordion title="支持线程的渠道">
    - 任何暴露会话/线程绑定能力的渠道适配器。
    - 当前内置支持：**Discord** 线程/频道、**Telegram** 话题（群组/超级群组中的论坛话题和私信话题）。
    - 插件渠道可以通过同一个绑定接口添加支持。

  </Accordion>
</AccordionGroup>

## 持久渠道绑定

对于非临时工作流，请在
顶层 `bindings[]` 条目中配置持久 ACP 绑定。

### 绑定模型

<ParamField path="bindings[].type" type='"acp"'>
  标记一个持久 ACP 对话绑定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  标识目标对话。各渠道形状：

- **Discord 频道/线程：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack 频道/私信：** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。优先使用稳定的 Slack id；频道绑定也会匹配该频道线程内的回复。
- **Telegram 论坛话题：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp 私信/群组：** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。对直接聊天使用 E.164 号码，例如 `+15555550123`；对群组使用 WhatsApp 群组 JID，例如 `120363424282127706@g.us`。
- **iMessage 私信/群组：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。稳定群组绑定优先使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所属 OpenClaw 智能体 id。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  可选 ACP 覆盖。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  可选的面向操作者标签。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  可选的运行时工作目录。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  可选的后端覆盖。
</ParamField>

### 每个智能体的运行时默认值

使用 `agents.list[].runtime` 为每个智能体定义一次 ACP 默认值：

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

- OpenClaw 会在特定渠道的准入之后、使用之前，确保配置的 ACP 会话存在。
- 该渠道、话题或聊天中的消息会路由到配置的 ACP 会话。
- 已配置的 ACP 绑定拥有自己的会话路由。渠道广播扇出不会替换匹配绑定所配置的 ACP 会话。
- 在已绑定的对话中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的绑定）在存在时仍然适用。
- 对于没有显式 `cwd` 的跨智能体 ACP 生成，OpenClaw 会从智能体配置继承目标智能体工作区。
- 缺失的继承工作区路径会回退到后端默认 cwd；非缺失路径的访问失败会作为生成错误暴露。

## 启动 ACP 会话

启动 ACP 会话有两种方式：

<Tabs>
  <Tab title="From sessions_spawn">
    使用 `runtime: "acp"` 从智能体轮次或工具调用启动 ACP 会话。

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
    `runtime` 默认是 `subagent`，因此 ACP 会话需要显式设置 `runtime: "acp"`。如果省略 `agentId`，OpenClaw 会在已配置时使用 `acp.defaultAgent`。`mode: "session"` 需要 `thread: true` 才能保持持久的绑定对话。
    </Note>

  </Tab>
  <Tab title="From /acp command">
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

    参见[斜杠命令](/zh-CN/tools/slash-commands)。

  </Tab>
</Tabs>

### `sessions_spawn` 参数

<ParamField path="task" type="string" required>
  发送给 ACP 会话的初始提示词。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 会话必须为 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目标 harness id。如果设置了 `acp.defaultAgent`，则回退到该值。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支持的位置请求线程绑定流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性；`"session"` 是持久的。如果 `thread: true` 且省略了 `mode`，OpenClaw 可能会根据运行时路径默认使用持久行为。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  请求的运行时工作目录（由后端/运行时策略验证）。如果省略，ACP 生成会在已配置时继承目标智能体工作区；缺失的继承路径会回退到后端默认值，而真实访问错误会被返回。
</ParamField>
<ParamField path="label" type="string">
  在会话/banner 文本中使用的面向操作员的标签。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  恢复现有 ACP 会话，而不是创建新会话。智能体通过 `session/load` 重放其对话历史。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 会将初始 ACP 运行进度摘要作为系统事件流式传回请求者会话。接受的响应包括指向会话作用域 JSONL 日志（`<sessionId>.acp-stream.jsonl`）的 `streamLogPath`，你可以 tail 该日志以查看完整中继历史。默认情况下，父进度流会显示助手评论和 ACP 状态进度，除非 `streaming.progress.commentary=false`。Discord 在未配置流模式时，也默认将父预览设为进度模式。状态进度仍会遵循 `acp.stream.tagVisibility`，因此 `plan` 等标签会保持隐藏，除非显式启用。
</ParamField>

ACP `sessions_spawn` 运行会使用 `agents.defaults.subagents.runTimeoutSeconds` 作为默认子轮次限制。该工具不接受每次调用的超时覆盖。

<ParamField path="model" type="string">
  ACP 子会话的显式模型覆盖。Codex ACP 生成会在 `session/new` 之前，将 `openai/gpt-5.4` 等 OpenAI 引用规范化为 Codex ACP 启动配置；`openai/gpt-5.4/high` 等斜杠形式也会设置 Codex ACP 推理强度。
  省略时，`sessions_spawn({ runtime: "acp" })` 会在已配置时使用现有子智能体模型默认值（`agents.defaults.subagents.model` 或 `agents.list[].subagents.model`）；否则让 ACP harness 使用自己的默认模型。
  其他 harness 必须声明 ACP `models` 并支持 `session/set_model`；否则 OpenClaw/acpx 会明确失败，而不是静默回退到目标智能体默认值。
</ParamField>
<ParamField path="thinking" type="string">
  显式思考/推理强度。对于 Codex ACP，`minimal` 映射到低强度，`low`/`medium`/`high`/`xhigh` 直接映射，`off` 会省略推理强度启动覆盖。
  省略时，ACP 生成会使用现有子智能体思考默认值，以及所选模型的按模型配置 `agents.defaults.models["provider/model"].params.thinking`。
</ParamField>

## 生成绑定和线程模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行为                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地绑定当前活跃对话；如果没有活跃对话则失败。 |
    | `off`  | 不创建当前对话绑定。                          |

    注意：

    - `--bind here` 是“让此渠道或聊天由 Codex 支持”的最简单操作员路径。
    - `--bind here` 不会创建子线程。
    - `--bind here` 仅在公开当前对话绑定支持的渠道上可用。
    - `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行为                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在活跃线程中：绑定该线程。在线程外：在支持时创建/绑定子线程。 |
    | `here` | 要求当前存在活跃线程；如果不在线程中则失败。                                                  |
    | `off`  | 不绑定。会话以未绑定状态启动。                                                                 |

    注意：

    - 在非线程绑定表面上，默认行为实际上是 `off`。
    - 线程绑定生成需要渠道策略支持：
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 当你想固定当前对话而不创建子线程时，使用 `--bind here`。

  </Tab>
</Tabs>

## 投递模型

ACP 会话可以是交互式工作区，也可以是父级拥有的后台工作。投递路径取决于该形态。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    交互式会话用于在可见聊天表面上持续对话：

    - `/acp spawn ... --bind here` 会将当前对话绑定到 ACP 会话。
    - `/acp spawn ... --thread ...` 会将渠道线程/话题绑定到 ACP 会话。
    - 持久配置的 `bindings[].type="acp"` 会将匹配的对话路由到同一个 ACP 会话。

    已绑定对话中的后续消息会直接路由到 ACP 会话，ACP 输出会投递回同一个渠道/线程/话题。

    OpenClaw 发送给 harness 的内容：

    - 普通的绑定后续消息会作为提示文本发送，并且仅在 harness/后端支持时附带附件。
    - `/acp` 管理命令和本地 Gateway 网关命令会在 ACP 派发前被拦截。
    - 运行时生成的完成事件会按目标实体化。OpenClaw 智能体会获得 OpenClaw 的内部运行时上下文信封；外部 ACP harness 会获得包含子结果和指令的普通提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 信封绝不应发送给外部 harness，也不应作为 ACP 用户转录文本持久化。
    - ACP 转录条目会使用用户可见的触发文本或普通完成提示。内部事件元数据会尽可能在 OpenClaw 中保持结构化，而不会被视为用户编写的聊天内容。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    由另一个智能体运行生成的一次性 ACP 会话是后台子项，类似于子智能体：

    - 父级使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求工作。
    - 子项在自己的 ACP harness 会话中运行。
    - 子轮次会在原生子智能体生成使用的同一后台通道上运行，因此缓慢的 ACP harness 不会阻塞无关的主会话工作。
    - 完成会通过任务完成公告路径报告回来。OpenClaw 会在将内部完成元数据发送给外部 harness 之前，把它转换为普通 ACP 提示，因此 harness 不会看到 OpenClaw 专用运行时上下文标记。
    - 当面向用户的回复有用时，父级会用普通助手语气重写子结果。

    **不要**将此路径视为父级与子项之间的点对点聊天。子项已经有返回父级的完成渠道。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` 可以在生成后以另一个会话为目标。对于普通对等会话，OpenClaw 会在注入消息后使用智能体到智能体（A2A）后续路径：

    - 等待目标会话的回复。
    - 可选地允许请求者和目标交换有界数量的后续轮次。
    - 请求目标生成一条公告消息。
    - 将该公告投递到可见渠道或线程。

    该 A2A 路径是对等发送的回退方案，适用于发送方需要可见后续回复的情况。当无关会话可以查看并向 ACP 目标发送消息时（例如在宽泛的 `tools.sessions.visibility` 设置下），它会保持启用。

    OpenClaw 仅在请求者是其自身父级所拥有的一次性 ACP 子级的
    父级时，才会跳过 A2A 跟进。在这种情况下，
    在任务完成之上运行 A2A 可能会用子级结果唤醒父级，
    将父级回复转发回子级，并
    造成父/子回声循环。`sessions_send` 结果会为这种自有子级情况报告
    `delivery.status="skipped"`，因为
    完成路径已经负责传递结果。

  </Accordion>
  <Accordion title="恢复现有会话">
    使用 `resumeSessionId` 继续之前的 ACP 会话，而不是
    重新开始。该智能体会通过
    `session/load` 重放其对话历史，因此会带着先前内容的完整上下文继续。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常见使用场景：

    - 将 Codex 会话从你的笔记本交接到你的手机 - 告诉你的智能体从你离开的地方继续。
    - 继续你之前在 CLI 中以交互方式启动的编码会话，现在通过你的智能体以无头方式继续。
    - 接着处理因 Gateway 网关重启或空闲超时而中断的工作。

    注意事项：

    - `resumeSessionId` 仅在 `runtime: "acp"` 时适用；默认子智能体运行时会忽略这个仅限 ACP 的字段。
    - `streamTo` 仅在 `runtime: "acp"` 时适用；默认子智能体运行时会忽略这个仅限 ACP 的字段。
    - `resumeSessionId` 是主机本地 ACP/harness 恢复 ID，而不是 OpenClaw 渠道会话键；OpenClaw 仍会在分发前检查 ACP spawn 策略和目标智能体策略，而 ACP 后端或 harness 负责加载该上游 ID 的授权。
    - `resumeSessionId` 会恢复上游 ACP 对话历史；`thread` 和 `mode` 仍会正常应用于你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍要求 `thread: true`。
    - 目标智能体必须支持 `session/load`（Codex 和 Claude Code 支持）。
    - 如果找不到会话 ID，spawn 会失败并给出明确错误 - 不会静默回退到新会话。

  </Accordion>
  <Accordion title="部署后冒烟测试">
    Gateway 网关部署后，运行一次真实的端到端检查，而不是
    信任单元测试：

    1. 在目标主机上验证已部署的 Gateway 网关版本和提交。
    2. 打开一个到真实智能体的临时 ACPX bridge 会话。
    3. 要求该智能体调用 `sessions_spawn`，并使用 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，以及任务 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 验证 `accepted=yes`、真实的 `childSessionKey`，并且没有 validator 错误。
    5. 清理临时 bridge 会话。

    将门禁保持在 `mode: "run"`，并跳过 `streamTo: "parent"` -
    绑定线程的 `mode: "session"` 和流中继路径属于单独的
    更丰富的集成测试轮次。

  </Accordion>
</AccordionGroup>

## 沙箱兼容性

ACP 会话目前运行在主机运行时上，**不**在
OpenClaw 沙箱内运行。

<Warning>
**安全边界：**

- 外部 harness 可根据自身 CLI 权限和选定的 `cwd` 进行读写。
- OpenClaw 的沙箱策略**不会**包装 ACP harness 执行。
- OpenClaw 仍会强制执行 ACP 功能门控、允许的智能体、会话所有权、渠道绑定和 Gateway 网关投递策略。
- 对需要沙箱强制执行的 OpenClaw 原生工作，使用 `runtime: "subagent"`。

</Warning>

当前限制：

- 如果请求者会话是沙箱隔离的，则 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP spawn 都会被阻止。
- 带有 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。

## 会话目标解析

大多数 `/acp` 操作接受一个可选会话目标（`session-key`、
`session-id` 或 `session-label`）。

**解析顺序：**

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 尝试键
   - 然后尝试 UUID 形状的会话 ID
   - 然后尝试标签
2. 当前线程绑定（如果此对话/线程已绑定到 ACP 会话）。
3. 当前请求者会话回退。

当前对话绑定和线程绑定都会参与
第 2 步。

如果无法解析任何目标，OpenClaw 会返回明确错误
（`Unable to resolve session target: ...`）。

## ACP 控制

| 命令              | 作用                                              | 示例                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP 会话；可选当前绑定或线程绑定。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目标会话的进行中轮次。                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 向运行中的会话发送 steer 指令。                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 关闭会话并解除线程目标绑定。                  | `/acp close`                                                  |
| `/acp status`        | 显示后端、模式、状态、运行时选项和能力。 | `/acp status`                                                 |
| `/acp set-mode`      | 设置目标会话的运行时模式。                      | `/acp set-mode plan`                                          |
| `/acp set`           | 写入通用运行时配置选项。                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 设置运行时工作目录覆盖。                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 设置审批策略配置档。                              | `/acp permissions strict`                                     |
| `/acp timeout`       | 设置运行时超时（秒）。                            | `/acp timeout 120`                                            |
| `/acp model`         | 设置运行时模型覆盖。                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除会话运行时选项覆盖。                  | `/acp reset-options`                                          |
| `/acp sessions`      | 从存储中列出最近的 ACP 会话。                      | `/acp sessions`                                               |
| `/acp doctor`        | 后端健康、能力和可执行修复。           | `/acp doctor`                                                 |
| `/acp install`       | 打印确定性的安装和启用步骤。             | `/acp install`                                                |

运行时控制（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、
`set`、`cwd`、`permissions`、`timeout`、`model` 和 `reset-options`）需要
来自外部渠道的所有者身份，以及来自内部 Gateway 网关
客户端的 `operator.admin`。已授权的非所有者发送者仍可使用 `sessions`、`doctor`、
`install` 和 `help`。

`/acp status` 会显示有效运行时选项以及运行时级和
后端级会话标识符。当后端缺少某项能力时，不支持的控制错误会
清晰呈现。`/acp sessions` 会读取
当前已绑定会话或请求者会话的存储；目标令牌
（`session-key`、`session-id` 或 `session-label`）会通过
Gateway 网关会话发现来解析，包括自定义的按智能体 `session.store`
根目录。

### 运行时选项映射

`/acp` 提供便利命令和通用 setter。等效
操作：

| 命令                      | 映射到                              | 备注                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 运行时配置键 `model`           | 对于 Codex ACP，OpenClaw 会将 `openai/<model>` 规范化为 adapter 模型 ID，并将诸如 `openai/gpt-5.4/high` 的斜杠 reasoning 后缀映射到 `reasoning_effort`。                                         |
| `/acp set thinking <level>`  | 规范选项 `thinking`          | 当存在时，OpenClaw 会发送后端通告的等效项，优先使用 `thinking`，然后是 `effort`、`reasoning_effort` 或 `thought_level`。对于 Codex ACP，adapter 会将值映射到 `reasoning_effort`。 |
| `/acp permissions <profile>` | 规范选项 `permissionProfile` | 当存在时，OpenClaw 会发送后端通告的等效项，例如 `approval_policy`、`permission_profile`、`permissions` 或 `permission_mode`。                                                       |
| `/acp timeout <seconds>`     | 规范选项 `timeoutSeconds`    | 当存在时，OpenClaw 会发送后端通告的等效项，例如 `timeout` 或 `timeout_seconds`。                                                                                                     |
| `/acp cwd <path>`            | 运行时 cwd 覆盖                 | 直接更新。                                                                                                                                                                                             |
| `/acp set <key> <value>`     | 通用                              | `key=cwd` 使用 cwd 覆盖路径。                                                                                                                                                                      |
| `/acp reset-options`         | 清除所有运行时覆盖         | -                                                                                                                                                                                                          |

## acpx harness、插件设置和权限

有关 acpx harness 配置（Claude Code / Codex / Gemini CLI
别名）、plugin-tools 和 OpenClaw-tools MCP bridge，以及 ACP
权限模式，请参阅
[ACP 智能体 - 设置](/zh-CN/tools/acp-agents-setup)。

## 故障排除

| 症状                                                                        | 可能原因                                                                                                               | 修复                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 后端插件缺失、已禁用，或被 `plugins.allow` 阻止。                                                                      | 安装并启用后端插件；如果设置了该允许列表，请在 `plugins.allow` 中包含 `acpx`，然后运行 `/acp doctor`。                                                                  |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已全局禁用。                                                                                                       | 设置 `acp.enabled=true`。                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已禁用来自普通线程消息的自动分发。                                                                                     | 设置 `acp.dispatch.enabled=true` 以恢复自动线程路由；显式的 `sessions_spawn({ runtime: "acp" })` 调用仍然可用。                                                        |
| `ACP agent "<id>" is not allowed by policy`                                 | 智能体不在允许列表中。                                                                                                 | 使用允许的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | 后端插件缺失、已禁用、被允许/拒绝策略阻止，或其配置的可执行文件不可用。                                                | 安装/启用后端插件，重新运行 `/acp doctor`；如果仍不健康，请检查后端安装或策略错误。                                                                                     |
| Harness command not found                                                   | 适配器 CLI 未安装、外部插件缺失，或非 Codex 适配器的首次运行 `npx` 拉取失败。                                          | 运行 `/acp doctor`，在 Gateway 网关主机上安装/预热适配器，或显式配置 acpx 智能体命令。                                                                                  |
| Model-not-found from the harness                                            | 模型 ID 对另一个提供商/harness 有效，但对此 ACP 目标无效。                                                            | 使用该 harness 列出的模型，在 harness 中配置模型，或省略覆盖项。                                                                                                        |
| Vendor auth error from the harness                                          | OpenClaw 正常，但目标 CLI/提供商尚未登录。                                                                             | 在 Gateway 网关主机环境中登录，或提供所需的提供商密钥。                                                                                                                 |
| `Unable to resolve session target: ...`                                     | 键/ID/标签令牌错误。                                                                                                   | 运行 `/acp sessions`，复制精确键/标签，然后重试。                                                                                                                       |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活动的可绑定对话时使用了 `--bind here`。                                                                         | 切换到目标聊天/渠道后重试，或使用未绑定的 spawn。                                                                                                                       |
| `Conversation bindings are unavailable for <channel>.`                      | 适配器缺少当前对话 ACP 绑定能力。                                                                                      | 在支持时使用 `/acp spawn ... --thread ...`，配置顶层 `bindings[]`，或切换到受支持的渠道。                                                                                |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在非线程上下文中使用了 `--thread here`。                                                                               | 切换到目标线程，或使用 `--thread auto`/`off`。                                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一个用户拥有活动绑定目标。                                                                                           | 以所有者身份重新绑定，或使用其他对话或线程。                                                                                                                            |
| `Thread bindings are unavailable for <channel>.`                            | 适配器缺少线程绑定能力。                                                                                               | 使用 `--thread off`，或切换到受支持的适配器/渠道。                                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 运行时位于主机端；请求方会话已沙箱隔离。                                                                           | 从沙箱隔离会话使用 `runtime="subagent"`，或从非沙箱隔离会话运行 ACP spawn。                                                                                             |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 为 ACP 运行时请求了 `sandbox="require"`。                                                                              | 对必需的沙箱隔离使用 `runtime="subagent"`，或从非沙箱隔离会话使用带 `sandbox="inherit"` 的 ACP。                                                                         |
| `Cannot apply --model ... did not advertise model support`                  | 目标 harness 未暴露通用 ACP 模型切换。                                                                                 | 使用声明支持 ACP `models`/`session/set_model` 的 harness，使用 Codex ACP 模型引用，或在该 harness 有自己的启动标志时直接在 harness 中配置模型。                         |
| Missing ACP metadata for bound session                                      | ACP 会话元数据已过时/已删除。                                                                                          | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦线程。                                                                                                                     |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 在非交互式 ACP 会话中阻止写入/exec。                                                                  | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway 网关。参见[权限配置](/zh-CN/tools/acp-agents-setup#permission-configuration)。           |
| ACP session fails early with little output                                  | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。                                                         | 检查 Gateway 网关日志中的 `AcpRuntimeError`。若需要完整权限，设置 `permissionMode=approve-all`；若需要优雅降级，设置 `nonInteractivePermissions=deny`。                 |
| ACP session stalls indefinitely after completing work                       | Harness 进程已完成，但 ACP 会话未报告完成。                                                                            | 更新 OpenClaw；当前 acpx 清理会在关闭和 Gateway 网关启动时回收 OpenClaw 所拥有的陈旧包装器和适配器进程。                                                               |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 内部事件信封泄漏到了 ACP 边界之外。                                                                                    | 更新 OpenClaw 并重新运行完成流程；外部 harness 应仅收到纯完成提示。                                                                                                     |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` 属于原生 Codex hook relay，而不是 ACP/acpx。在已绑定的 Codex 聊天中，使用 `/new` 或 `/reset` 启动一个新会话；如果它第一次可用，但在下一次原生工具调用时再次返回，请重启 Codex app-server 或 OpenClaw Gateway 网关，而不是重复执行 `/new`。参见 [Codex harness 故障排除](/zh-CN/plugins/codex-harness#troubleshooting)。
</Note>

## 相关内容

- [ACP 智能体 - 设置](/zh-CN/tools/acp-agents-setup)
- [Agent 发送](/zh-CN/tools/agent-send)
- [CLI 后端](/zh-CN/gateway/cli-backends)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [多 Agent 沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（桥接模式）](/zh-CN/cli/acp)
- [子智能体](/zh-CN/tools/subagents)
