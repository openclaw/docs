---
read_when:
    - 使用或配置聊天命令
    - 调试命令路由或权限
summary: 斜杠命令：文本与原生、配置及支持的命令
title: 斜杠命令
x-i18n:
    generated_at: "2026-04-26T03:01:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd97db0918e9ca0de77034d9a3e522d8b250ea66b210fc5d16ebfd60d6f73002
    source_path: tools/slash-commands.md
    workflow: 15
---

命令由 Gateway 网关处理。大多数命令必须作为以 `/` 开头的**独立**消息发送。
仅主机可用的 bash 聊天命令使用 `! <cmd>`（`/bash <cmd>` 是其别名）。

当某个对话或线程绑定到 ACP 会话时，普通的后续文本
会路由到该 ACP harness。Gateway 网关管理命令仍然保持本地处理：
`/acp ...` 总是会到达 OpenClaw ACP 命令处理器，而 `/status` 和
`/unfocus` 在该界面启用命令处理时也始终保持本地处理。

这里有两个相关系统：

- **命令**：独立的 `/...` 消息。
- **指令**：`/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。
  - 指令会在模型看到消息之前从消息中剥离。
  - 在普通聊天消息中（不是纯指令消息），它们会被视为“内联提示”，并且**不会**持久化会话设置。
  - 在纯指令消息中（消息只包含指令），它们会持久化到会话，并回复确认信息。
  - 指令仅对**已授权发送者**生效。如果设置了 `commands.allowFrom`，它就是唯一使用的
    允许列表；否则授权来自渠道允许列表 / 配对以及 `commands.useAccessGroups`。
    未授权发送者看到的指令会被当作普通文本处理。

还有一些**内联快捷命令**（仅限列入允许列表 / 已授权的发送者）：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
它们会立即运行，在模型看到消息之前被剥离，剩余文本继续走正常流程。

## 配置

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text`（默认 `true`）启用在聊天消息中解析 `/...`。
  - 在不支持原生命令的界面上（WhatsApp / WebChat / Signal / iMessage / Google Chat / Microsoft Teams），即使你将其设置为 `false`，文本命令仍然可用。
- `commands.native`（默认 `"auto"`）注册原生命令。
  - Auto：对 Discord / Telegram 开启；对 Slack 关闭（直到你添加斜杠命令）；对不支持原生命令的提供商会被忽略。
  - 设置 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 可按提供商覆盖（布尔值或 `"auto"`）。
  - `false` 会在启动时清除之前在 Discord / Telegram 上注册的命令。Slack 命令在 Slack 应用中管理，不会自动移除。
- `commands.nativeSkills`（默认 `"auto"`）在支持时以原生方式注册 **Skills** 命令。
  - Auto：对 Discord / Telegram 开启；对 Slack 关闭（Slack 要求为每个 Skill 单独创建一个斜杠命令）。
  - 设置 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 可按提供商覆盖（布尔值或 `"auto"`）。
- `commands.bash`（默认 `false`）启用 `! <cmd>` 来运行主机 shell 命令（`/bash <cmd>` 是别名；需要 `tools.elevated` 允许列表）。
- `commands.bashForegroundMs`（默认 `2000`）控制 bash 在切换到后台模式前等待多长时间（`0` 表示立即转入后台）。
- `commands.config`（默认 `false`）启用 `/config`（读取 / 写入 `openclaw.json`）。
- `commands.mcp`（默认 `false`）启用 `/mcp`（读取 / 写入 OpenClaw 管理的 `mcp.servers` 下的 MCP 配置）。
- `commands.plugins`（默认 `false`）启用 `/plugins`（插件发现 / 状态，以及安装与启用 / 禁用控制）。
- `commands.debug`（默认 `false`）启用 `/debug`（仅运行时覆盖）。
- `commands.restart`（默认 `true`）启用 `/restart` 以及 Gateway 网关重启工具操作。
- `commands.ownerAllowFrom`（可选）为仅限所有者的命令 / 工具界面设置显式的所有者允许列表。这与 `commands.allowFrom` 分开。
- 每个渠道的 `channels.<channel>.commands.enforceOwnerForCommands`（可选，默认 `false`）会让仅限所有者的命令在该界面上要求**所有者身份**才能运行。当为 `true` 时，发送者必须与已解析的所有者候选匹配（例如 `commands.ownerAllowFrom` 中的条目或提供商原生所有者元数据），或者在内部消息渠道上拥有内部 `operator.admin` 作用域。渠道 `allowFrom` 中的通配符条目，或空的 / 未解析的所有者候选列表，**都不足以**满足要求——仅限所有者的命令会在该渠道上以失败关闭方式处理。如果你希望仅限所有者的命令只受 `ownerAllowFrom` 和标准命令允许列表控制，请保持关闭。
- `commands.ownerDisplay` 控制所有者 ID 在系统提示中的显示方式：`raw` 或 `hash`。
- `commands.ownerDisplaySecret` 可选设置在 `commands.ownerDisplay="hash"` 时使用的 HMAC 密钥。
- `commands.allowFrom`（可选）为命令授权设置按提供商划分的允许列表。配置后，它会成为命令和指令的
  唯一授权来源（渠道允许列表 / 配对以及 `commands.useAccessGroups`
  会被忽略）。使用 `"*"` 作为全局默认值；提供商专用键会覆盖它。
- `commands.useAccessGroups`（默认 `true`）在未设置 `commands.allowFrom` 时，对命令强制执行允许列表 / 策略。

## 命令列表

当前事实来源：

- 核心内置命令来自 `src/auto-reply/commands-registry.shared.ts`
- 生成的 dock 命令来自 `src/auto-reply/commands-registry.data.ts`
- 插件命令来自插件的 `registerCommand()` 调用
- 你的 Gateway 网关上实际可用的命令仍取决于配置标志、渠道界面以及已安装 / 已启用的插件

### 核心内置命令

当前可用的内置命令：

- `/new [model]` 启动一个新会话；`/reset` 是重置别名。
- `/reset soft [message]` 保留当前对话记录，丢弃复用的 CLI 后端会话 ID，并在原位重新运行启动 / 系统提示加载。
- `/compact [instructions]` 压缩会话上下文。参见 [/concepts/compaction](/zh-CN/concepts/compaction)。
- `/stop` 中止当前运行。
- `/session idle <duration|off>` 和 `/session max-age <duration|off>` 管理线程绑定过期时间。
- `/think <level>` 设置 thinking 级别。可选项来自当前模型的提供商配置；常见级别包括 `off`、`minimal`、`low`、`medium` 和 `high`，也包括仅在支持时可用的自定义级别，如 `xhigh`、`adaptive`、`max` 或二元 `on`。别名：`/thinking`、`/t`。
- `/verbose on|off|full` 切换详细输出。别名：`/v`。
- `/trace on|off` 为当前会话切换插件跟踪输出。
- `/fast [status|on|off]` 显示或设置快速模式。
- `/reasoning [on|off|stream]` 切换推理可见性。别名：`/reason`。
- `/elevated [on|off|ask|full]` 切换 elevated 模式。别名：`/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` 显示或设置 exec 默认值。
- `/model [name|#|status]` 显示或设置模型。
- `/models [provider] [page] [limit=<n>|size=<n>|all]` 列出提供商或某个提供商的模型。
- `/queue <mode>` 管理队列行为（`steer`、`interrupt`、`followup`、`collect`、`steer-backlog`），以及如 `debounce:2s cap:25 drop:summarize` 之类的选项。
- `/help` 显示简短帮助摘要。
- `/commands` 显示生成的命令目录。
- `/tools [compact|verbose]` 显示当前智能体此刻可以使用的内容。
- `/status` 显示执行 / 运行时状态，包括 `Execution` / `Runtime` 标签，以及可用时的提供商使用量 / 配额。
- `/crestodian <request>` 从所有者私信中运行 Crestodian 设置与修复助手。
- `/tasks` 列出当前会话的活动 / 最近后台任务。
- `/context [list|detail|json]` 说明上下文是如何组装的。
- `/export-session [path]` 将当前会话导出为 HTML。别名：`/export`。
- `/export-trajectory [path]` 为当前会话导出 JSONL [trajectory bundle](/zh-CN/tools/trajectory)。别名：`/trajectory`。
- `/whoami` 显示你的发送者 ID。别名：`/id`。
- `/skill <name> [input]` 按名称运行一个 Skill。
- `/allowlist [list|add|remove] ...` 管理允许列表条目。仅文本。
- `/approve <id> <decision>` 处理 exec 审批提示。
- `/btw <question>` 提出一个旁支问题，而不改变未来的会话上下文。参见 [/tools/btw](/zh-CN/tools/btw)。
- `/subagents list|kill|log|info|send|steer|spawn` 管理当前会话的子智能体运行。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` 管理 ACP 会话和运行时选项。
- `/focus <target>` 将当前 Discord 线程或 Telegram 话题 / 对话绑定到一个会话目标。
- `/unfocus` 移除当前绑定。
- `/agents` 列出当前会话中线程绑定的智能体。
- `/kill <id|#|all>` 中止一个或全部正在运行的子智能体。
- `/steer <id|#> <message>` 向正在运行的子智能体发送引导。别名：`/tell`。
- `/config show|get|set|unset` 读取或写入 `openclaw.json`。仅限所有者。需要 `commands.config: true`。
- `/mcp show|get|set|unset` 读取或写入 OpenClaw 管理的 `mcp.servers` 下的 MCP 服务器配置。仅限所有者。需要 `commands.mcp: true`。
- `/plugins list|inspect|show|get|install|enable|disable` 检查或修改插件状态。`/plugin` 是别名。写操作仅限所有者。需要 `commands.plugins: true`。
- `/debug show|set|unset|reset` 管理仅运行时的配置覆盖。仅限所有者。需要 `commands.debug: true`。
- `/usage off|tokens|full|cost` 控制每次响应的使用量页脚，或打印本地成本摘要。
- `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` 控制 TTS。参见 [/tools/tts](/zh-CN/tools/tts)。
- `/restart` 在启用时重启 OpenClaw。默认：启用；设置 `commands.restart: false` 可禁用。
- `/activation mention|always` 设置群组激活模式。
- `/send on|off|inherit` 设置发送策略。仅限所有者。
- `/bash <command>` 运行主机 shell 命令。仅文本。别名：`! <command>`。需要 `commands.bash: true` 以及 `tools.elevated` 允许列表。
- `!poll [sessionId]` 检查后台 bash 作业。
- `!stop [sessionId]` 停止后台 bash 作业。

### 生成的 dock 命令

Dock 命令由支持原生命令的渠道插件生成。当前内置集合：

- `/dock-discord`（别名：`/dock_discord`）
- `/dock-mattermost`（别名：`/dock_mattermost`）
- `/dock-slack`（别名：`/dock_slack`）
- `/dock-telegram`（别名：`/dock_telegram`）

### 内置插件命令

内置插件可以添加更多斜杠命令。此仓库中当前内置的命令：

- `/dreaming [on|off|status|help]` 切换 Memory Wiki dreaming。参见 [Dreaming](/zh-CN/concepts/dreaming)。
- `/pair [qr|status|pending|approve|cleanup|notify]` 管理设备配对 / 设置流程。参见 [Pairing](/zh-CN/channels/pairing)。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` 临时启用高风险手机节点命令。
- `/voice status|list [limit]|set <voiceId|name>` 管理 Talk 语音配置。在 Discord 上，原生命令名称是 `/talkvoice`。
- `/card ...` 发送 LINE 富卡片预设。参见 [LINE](/zh-CN/channels/line)。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` 检查并控制内置的 Codex app-server harness。参见 [Codex harness](/zh-CN/plugins/codex-harness)。
- 仅限 QQ Bot 的命令：
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 动态 Skill 命令

用户可调用的 Skills 也会暴露为斜杠命令：

- `/skill <name> [input]` 始终可用，作为通用入口点。
- 当 Skill / 插件注册它们时，Skills 也可能直接显示为诸如 `/prose` 之类的命令。
- 原生 Skill 命令注册由 `commands.nativeSkills` 和 `channels.<provider>.commands.nativeSkills` 控制。

注意：

- 命令在命令与参数之间可选接受一个 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
- `/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配）；如果没有匹配，文本会被当作消息正文。
- 如需完整的提供商使用量明细，请使用 `openclaw status --usage`。
- `/allowlist add|remove` 需要 `commands.config=true`，并遵循渠道的 `configWrites`。
- 在多账号渠道中，面向配置目标的 `/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 也遵循目标账号的 `configWrites`。
- `/usage` 控制每次响应的使用量页脚；`/usage cost` 会根据 OpenClaw 会话日志打印本地成本摘要。
- `/restart` 默认启用；设置 `commands.restart: false` 可禁用。
- `/plugins install <spec>` 接受与 `openclaw plugins install` 相同的插件规格：本地路径 / 压缩包、npm 包，或 `clawhub:<pkg>`。
- `/plugins enable|disable` 会更新插件配置，并可能提示重启。
- 仅限 Discord 的原生命令：`/vc join|leave|status` 用于控制语音频道（不提供文本形式）。`join` 需要 guild 和已选择的语音 / Stage 频道。需要 `channels.discord.voice` 和原生命令。
- Discord 线程绑定命令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）要求有效线程绑定已启用（`session.threadBindings.enabled` 和 / 或 `channels.discord.threadBindings.enabled`）。
- ACP 命令参考与运行时行为：参见 [ACP Agents](/zh-CN/tools/acp-agents)。
- `/verbose` 用于调试和额外可见性；在正常使用中请保持**关闭**。
- `/trace` 比 `/verbose` 更窄：它只显示插件拥有的 trace / debug 行，并保持普通详细工具输出关闭。
- `/fast on|off` 会持久化一个会话覆盖。使用 Sessions UI 中的 `inherit` 选项可清除它，并回退到配置默认值。
- `/fast` 是提供商特定的：OpenAI / OpenAI Codex 会在原生 Responses 端点上将其映射为 `service_tier=priority`，而直接向公开 Anthropic 发出的请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，则会将其映射为 `service_tier=auto` 或 `standard_only`。参见 [OpenAI](/zh-CN/providers/openai) 和 [Anthropic](/zh-CN/providers/anthropic)。
- 相关时仍会显示工具失败摘要，但详细失败文本仅在 `/verbose` 为 `on` 或 `full` 时包含。
- `/reasoning`、`/verbose` 和 `/trace` 在群组场景中有风险：它们可能泄露你原本无意暴露的内部推理、工具输出或插件诊断信息。建议保持关闭，尤其是在群聊中。
- `/model` 会立即持久化新的会话模型。
- 如果智能体处于空闲状态，下一次运行会立即使用它。
- 如果某次运行已经处于活动状态，OpenClaw 会将实时切换标记为待处理，并仅在一个干净的重试点重启到新模型。
- 如果工具活动或回复输出已经开始，待处理的切换可能会一直排队，直到稍后的重试机会或下一个用户轮次。
- 在本地 TUI 中，`/crestodian [request]` 会从普通智能体 TUI 返回到
  Crestodian。这与消息渠道救援模式是分开的，并且不会
  授予远程配置权限。
- **快速路径：** 来自允许列表发送者的纯命令消息会被立即处理（绕过队列 + 模型）。
- **群组提及门控：** 来自允许列表发送者的纯命令消息会绕过提及要求。
- **内联快捷命令（仅限允许列表发送者）：** 某些命令也可嵌入普通消息中使用，并会在模型看到剩余文本前被剥离。
  - 示例：`hey /status` 会触发状态回复，剩余文本继续走正常流程。
- 当前包括：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
- 未授权的纯命令消息会被静默忽略，而内联 `/...` 标记会被当作普通文本。
- **Skill 命令：** `user-invocable` Skills 会暴露为斜杠命令。名称会被清洗为 `a-z0-9_`（最多 32 个字符）；冲突时会添加数字后缀（例如 `_2`）。
  - `/skill <name> [input]` 按名称运行一个 Skill（当原生命令限制阻止按 Skill 单独建命令时很有用）。
  - 默认情况下，Skill 命令会作为普通请求转发给模型。
  - Skills 也可以选择声明 `command-dispatch: tool`，将命令直接路由给工具（确定性，无模型）。
  - 示例：`/prose`（OpenProse 插件）——参见 [OpenProse](/zh-CN/prose)。
- **原生命令参数：** Discord 对动态选项使用自动补全（以及在你省略必需参数时使用按钮菜单）。Telegram 和 Slack 会在命令支持可选项且你省略参数时显示按钮菜单。动态选项会针对目标会话模型解析，因此诸如 `/think` 级别之类的模型特定选项会遵循该会话的 `/model` 覆盖。

## `/tools`

`/tools` 回答的是运行时问题，而不是配置问题：**这个智能体现在在
此对话中可以使用什么**。

- 默认 `/tools` 为紧凑模式，并针对快速扫描进行了优化。
- `/tools verbose` 会添加简短说明。
- 支持参数的原生命令界面也会暴露相同的 `compact|verbose` 模式切换。
- 结果是会话作用域的，因此更改智能体、渠道、线程、发送者授权或模型都可能
  改变输出。
- `/tools` 包括在运行时实际可达的工具，包括核心工具、已连接的
  插件工具和渠道拥有的工具。

如需编辑配置文件和覆盖项，请使用 Control UI 的 Tools 面板或配置 / 目录界面，
而不要把 `/tools` 当作静态目录。

## 使用量界面（各处显示什么）

- **提供商使用量 / 配额**（例如：“Claude 还剩 80%”）会在 `/status` 中针对当前模型提供商显示，前提是已启用使用量跟踪。OpenClaw 会将提供商窗口标准化为“剩余 %”；对于 MiniMax，显示前会先对仅剩余百分比字段取反，而 `model_remains` 响应会优先选择聊天模型条目以及带模型标签的套餐标签。
- `/status` 中的**令牌 / 缓存行**在实时会话快照较稀疏时，可以回退到最近一次对话记录使用量条目。现有的非零实时值仍然优先，而对话记录回退还可以在存储总量缺失或较小时，恢复当前活动运行时模型标签以及更大的面向提示的总量。
- **Execution 与 Runtime：** `/status` 用 `Execution` 报告实际生效的沙箱路径，用 `Runtime` 报告实际运行会话的是谁：`OpenClaw Pi Default`、`OpenAI Codex`、某个 CLI 后端或某个 ACP 后端。
- **每次响应的令牌 / 成本** 由 `/usage off|tokens|full` 控制（附加到普通回复）。
- `/model status` 关注的是**模型 / 认证 / 端点**，而不是使用量。

## 模型选择（`/model`）

`/model` 被实现为一个指令。

示例：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

注意：

- `/model` 和 `/model list` 会显示一个紧凑的编号选择器（模型家族 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，其中包含提供商和模型下拉菜单以及 Submit 步骤。
- `/model <#>` 会从该选择器中进行选择（并在可能时优先使用当前提供商）。
- `/model status` 会显示详细视图，包括已配置的提供商端点（`baseUrl`）和 API 模式（`api`），如果可用的话。

## 调试覆盖

`/debug` 允许你设置**仅运行时**配置覆盖（内存中，不写磁盘）。仅限所有者。默认禁用；使用 `commands.debug: true` 启用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注意：

- 覆盖会立即应用于新的配置读取，但**不会**写入 `openclaw.json`。
- 使用 `/debug reset` 清除所有覆盖，并返回磁盘上的配置。

## 插件跟踪输出

`/trace` 允许你切换**会话作用域的插件 trace / debug 行**，而无需开启完整详细模式。

示例：

```text
/trace
/trace on
/trace off
```

注意：

- 不带参数的 `/trace` 会显示当前会话 trace 状态。
- `/trace on` 会为当前会话启用插件 trace 行。
- `/trace off` 会再次禁用它们。
- 插件 trace 行可能出现在 `/status` 中，也可能作为普通助手回复之后的后续诊断消息出现。
- `/trace` 不能替代 `/debug`；`/debug` 仍用于管理仅运行时配置覆盖。
- `/trace` 不能替代 `/verbose`；普通详细工具 / 状态输出仍属于 `/verbose`。

## 配置更新

`/config` 会写入你的磁盘配置（`openclaw.json`）。仅限所有者。默认禁用；使用 `commands.config: true` 启用。

示例：

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

注意：

- 写入前会验证配置；无效变更会被拒绝。
- `/config` 更新会在重启后保留。

## MCP 更新

`/mcp` 会写入 OpenClaw 管理的 `mcp.servers` 下的 MCP 服务器定义。仅限所有者。默认禁用；使用 `commands.mcp: true` 启用。

示例：

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

注意：

- `/mcp` 将配置存储在 OpenClaw 配置中，而不是 Pi 拥有的项目设置中。
- 运行时适配器决定哪些传输实际上可执行。

## 插件更新

`/plugins` 允许操作员检查已发现的插件，并在配置中切换启用状态。只读流程可使用 `/plugin` 作为别名。默认禁用；使用 `commands.plugins: true` 启用。

示例：

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

注意：

- `/plugins list` 和 `/plugins show` 会针对当前工作区以及磁盘配置执行真实插件发现。
- `/plugins enable|disable` 只更新插件配置；不会安装或卸载插件。
- 在启用 / 禁用变更后，重启 Gateway 网关以应用它们。

## 界面说明

- **文本命令** 在普通聊天会话中运行（私信共享 `main`，群组有各自的会话）。
- **原生命令** 使用隔离会话：
  - Discord：`agent:<agentId>:discord:slash:<userId>`
  - Slack：`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
  - Telegram：`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 定向到聊天会话）
- **`/stop`** 针对活动聊天会话，因此它可以中止当前运行。
- **Slack：** 仍支持 `channels.slack.slashCommand` 用于单个 `/openclaw` 风格命令。如果你启用了 `commands.native`，则必须为每个内置命令创建一个 Slack 斜杠命令（名称与 `/help` 相同）。Slack 的命令参数菜单会以临时 Block Kit 按钮形式发送。
  - Slack 原生命令例外：注册 `/agentstatus`（而不是 `/status`），因为 Slack 保留了 `/status`。文本 `/status` 在 Slack 消息中仍然可用。

## BTW 旁支问题

`/btw` 是一个关于当前会话的快速**旁支问题**。

与普通聊天不同：

- 它使用当前会话作为背景上下文，
- 它以一个独立的**无工具**单次调用运行，
- 它不会改变未来的会话上下文，
- 它不会写入对话记录历史，
- 它会作为实时旁支结果交付，而不是普通助手消息。

这使得 `/btw` 在你希望主任务继续进行的同时获得临时澄清时非常有用。

示例：

```text
/btw 我们现在在做什么？
```

完整行为和客户端 UX 细节请参见 [BTW Side Questions](/zh-CN/tools/btw)。

## 相关

- [Skills](/zh-CN/tools/skills)
- [Skills 配置](/zh-CN/tools/skills-config)
- [创建 Skills](/zh-CN/tools/creating-skills)
