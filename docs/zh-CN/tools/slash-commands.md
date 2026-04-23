---
read_when:
    - 使用或配置聊天命令
    - 调试命令路由或权限
summary: 斜杠命令：文本与原生、配置以及支持的命令
title: 斜杠命令
x-i18n:
    generated_at: "2026-04-23T19:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62af79d351db2ef6a62df570300bb191c7d5078ef5da2308b4a9d99a56ca7863
    source_path: tools/slash-commands.md
    workflow: 15
---

# 斜杠命令

命令由 Gateway 网关处理。大多数命令必须作为**独立**消息发送，并且以 `/` 开头。
仅主机可用的 bash 聊天命令使用 `! <cmd>`（`/bash <cmd>` 是其别名）。

这里有两个相关系统：

- **命令**：独立的 `/...` 消息。
- **指令**：`/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。
  - 指令会在模型看到消息前被剥离。
  - 在普通聊天消息中（不是仅包含指令的消息），它们会被视为“内联提示”，并且**不会**持久化会话设置。
  - 在仅包含指令的消息中（消息只包含指令），它们会持久化到会话中，并回复一个确认消息。
  - 指令仅对**已授权发送者**生效。如果设置了 `commands.allowFrom`，它就是唯一使用的 allowlist；否则，授权来自渠道 allowlist/配对以及 `commands.useAccessGroups`。
    未授权发送者发送的指令会被当作普通文本处理。

还有少量**内联快捷命令**（仅限 allowlist/已授权发送者）：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
它们会立即运行，并在模型看到消息前被剥离，剩余文本继续走正常流程。

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
  - 在不支持原生命令的界面上（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams），即使你将其设为 `false`，文本命令仍然可用。
- `commands.native`（默认 `"auto"`）注册原生命令。
  - 自动：在 Discord/Telegram 上开启；在 Slack 上关闭（直到你添加 slash commands）；对于不支持原生命令的提供商则忽略。
  - 设置 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 可按提供商覆盖（布尔值或 `"auto"`）。
  - `false` 会在启动时清除之前在 Discord/Telegram 上注册的命令。Slack 命令由 Slack 应用管理，不会自动移除。
- `commands.nativeSkills`（默认 `"auto"`）在支持时以原生方式注册**技能**命令。
  - 自动：在 Discord/Telegram 上开启；在 Slack 上关闭（Slack 需要为每个技能单独创建一个 slash 命令）。
  - 设置 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 可按提供商覆盖（布尔值或 `"auto"`）。
- `commands.bash`（默认 `false`）启用 `! <cmd>` 来运行主机 shell 命令（`/bash <cmd>` 是别名；需要 `tools.elevated` allowlist）。
- `commands.bashForegroundMs`（默认 `2000`）控制 bash 在切换到后台模式前等待多久（`0` 表示立即转入后台）。
- `commands.config`（默认 `false`）启用 `/config`（读取/写入 `openclaw.json`）。
- `commands.mcp`（默认 `false`）启用 `/mcp`（读取/写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 配置）。
- `commands.plugins`（默认 `false`）启用 `/plugins`（插件发现/状态，以及安装 + 启用/禁用控制）。
- `commands.debug`（默认 `false`）启用 `/debug`（仅运行时覆盖）。
- `commands.restart`（默认 `true`）启用 `/restart` 以及 Gateway 网关重启工具操作。
- `commands.ownerAllowFrom`（可选）为仅限 owner 的命令/工具界面设置显式 owner allowlist。这与 `commands.allowFrom` 分开。
- 每个渠道的 `channels.<channel>.commands.enforceOwnerForCommands`（可选，默认 `false`）会使该界面上的仅限 owner 命令必须由**owner 身份**执行。当其为 `true` 时，发送者必须匹配某个已解析的 owner 候选者（例如 `commands.ownerAllowFrom` 中的某个条目，或提供商原生 owner 元数据），或者在内部消息渠道上持有内部 `operator.admin` 范围。渠道 `allowFrom` 中的通配符条目，或空的/无法解析的 owner 候选列表，**都不足以**满足要求——该渠道上的仅限 owner 命令会以封闭方式失败。如果你希望仅限 owner 的命令只由 `ownerAllowFrom` 和标准命令 allowlist 控制，请保持关闭。
- `commands.ownerDisplay` 控制 owner id 在系统提示词中的显示方式：`raw` 或 `hash`。
- `commands.ownerDisplaySecret` 可选设置在 `commands.ownerDisplay="hash"` 时使用的 HMAC 密钥。
- `commands.allowFrom`（可选）为命令授权设置按提供商划分的 allowlist。配置后，它将成为命令和指令的唯一授权来源（渠道 allowlist/配对及 `commands.useAccessGroups` 将被忽略）。全局默认值使用 `"*"`；提供商专用键会覆盖它。
- `commands.useAccessGroups`（默认 `true`）在未设置 `commands.allowFrom` 时，对命令强制执行 allowlist/策略。

## 命令列表

当前事实来源：

- 核心内置命令来自 `src/auto-reply/commands-registry.shared.ts`
- 生成的 dock 命令来自 `src/auto-reply/commands-registry.data.ts`
- 插件命令来自插件中的 `registerCommand()` 调用
- 你的 Gateway 网关上实际可用的命令仍取决于配置标志、渠道界面，以及已安装/启用的插件

### 核心内置命令

当前可用的内置命令：

- `/new [model]` 启动一个新会话；`/reset` 是重置别名。
- `/reset soft [message]` 保留当前转录，丢弃复用的 CLI 后端会话 id，并原地重新运行 startup/system-prompt 加载。
- `/compact [instructions]` 压缩会话上下文。参见 [/concepts/compaction](/zh-CN/concepts/compaction)。
- `/stop` 中止当前运行。
- `/session idle <duration|off>` 和 `/session max-age <duration|off>` 管理线程绑定过期。
- `/think <level>` 设置 thinking 级别。可选项来自活动模型的提供商配置档；常见级别有 `off`、`minimal`、`low`、`medium` 和 `high`，而 `xhigh`、`adaptive`、`max` 或二元 `on` 等自定义级别仅在支持时可用。别名：`/thinking`、`/t`。
- `/verbose on|off|full` 切换详细输出。别名：`/v`。
- `/trace on|off` 切换当前会话的插件追踪输出。
- `/fast [status|on|off]` 显示或设置快速模式。
- `/reasoning [on|off|stream]` 切换推理可见性。别名：`/reason`。
- `/elevated [on|off|ask|full]` 切换 elevated 模式。别名：`/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` 显示或设置 exec 默认值。
- `/model [name|#|status]` 显示或设置模型。
- `/models [provider] [page] [limit=<n>|size=<n>|all]` 列出提供商，或列出某个提供商的模型。
- `/queue <mode>` 管理队列行为（`steer`、`interrupt`、`followup`、`collect`、`steer-backlog`），以及如 `debounce:2s cap:25 drop:summarize` 之类的选项。
- `/help` 显示简要帮助摘要。
- `/commands` 显示生成的命令目录。
- `/tools [compact|verbose]` 显示当前智能体此刻可以使用的内容。
- `/status` 显示运行时状态，包括 `Runtime`/`Runner` 标签，以及可用时的提供商用量/配额。
- `/tasks` 列出当前会话的活动/最近后台任务。
- `/context [list|detail|json]` 解释上下文是如何组装的。
- `/export-session [path]` 将当前会话导出为 HTML。别名：`/export`。
- `/export-trajectory [path]` 为当前会话导出一个 JSONL [trajectory bundle](/zh-CN/tools/trajectory)。别名：`/trajectory`。
- `/whoami` 显示你的发送者 id。别名：`/id`。
- `/skill <name> [input]` 按名称运行一个 Skills。
- `/allowlist [list|add|remove] ...` 管理 allowlist 条目。仅文本。
- `/approve <id> <decision>` 处理 exec 审批提示。
- `/btw <question>` 在不改变未来会话上下文的情况下提出一个旁支问题。参见 [/tools/btw](/zh-CN/tools/btw)。
- `/subagents list|kill|log|info|send|steer|spawn` 管理当前会话的子智能体运行。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` 管理 ACP 会话和运行时选项。
- `/focus <target>` 将当前 Discord 线程或 Telegram topic/conversation 绑定到一个会话目标。
- `/unfocus` 移除当前绑定。
- `/agents` 列出当前会话中绑定到线程的智能体。
- `/kill <id|#|all>` 中止一个或所有正在运行的子智能体。
- `/steer <id|#> <message>` 向一个正在运行的子智能体发送引导。别名：`/tell`。
- `/config show|get|set|unset` 读取或写入 `openclaw.json`。仅限 owner。需要 `commands.config: true`。
- `/mcp show|get|set|unset` 读取或写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器配置。仅限 owner。需要 `commands.mcp: true`。
- `/plugins list|inspect|show|get|install|enable|disable` 检查或修改插件状态。`/plugin` 是别名。写入操作仅限 owner。需要 `commands.plugins: true`。
- `/debug show|set|unset|reset` 管理仅运行时的配置覆盖。仅限 owner。需要 `commands.debug: true`。
- `/usage off|tokens|full|cost` 控制每次响应的用量页脚，或输出本地成本摘要。
- `/tts on|off|status|provider|limit|summary|audio|help` 控制 TTS。参见 [/tools/tts](/zh-CN/tools/tts)。
- `/restart` 在启用时重启 OpenClaw。默认启用；设置 `commands.restart: false` 可禁用。
- `/activation mention|always` 设置群组激活模式。
- `/send on|off|inherit` 设置发送策略。仅限 owner。
- `/bash <command>` 运行主机 shell 命令。仅文本。别名：`! <command>`。需要 `commands.bash: true`，以及 `tools.elevated` allowlist。
- `!poll [sessionId]` 检查后台 bash 作业。
- `!stop [sessionId]` 停止后台 bash 作业。

### 生成的 dock 命令

Dock 命令由支持原生命令的渠道插件生成。当前内置集合：

- `/dock-discord`（别名：`/dock_discord`）
- `/dock-mattermost`（别名：`/dock_mattermost`）
- `/dock-slack`（别名：`/dock_slack`）
- `/dock-telegram`（别名：`/dock_telegram`）

### 内置插件命令

内置插件可以添加更多 slash commands。此仓库中当前的内置命令：

- `/dreaming [on|off|status|help]` 切换 Dreaming。参见 [Dreaming](/zh-CN/concepts/dreaming)。
- `/pair [qr|status|pending|approve|cleanup|notify]` 管理设备配对/设置流程。参见 [Pairing](/zh-CN/channels/pairing)。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` 临时启用高风险手机节点命令。
- `/voice status|list [limit]|set <voiceId|name>` 管理 Talk 语音配置。在 Discord 上，原生命令名称为 `/talkvoice`。
- `/card ...` 发送 LINE 富卡片预设。参见 [LINE](/zh-CN/channels/line)。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` 检查并控制内置 Codex app-server Harness。参见 [Codex Harness](/zh-CN/plugins/codex-harness)。
- 仅 QQ Bot 命令：
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 动态 Skills 命令

可由用户调用的 Skills 也会作为 slash commands 暴露：

- `/skill <name> [input]` 始终可作为通用入口点使用。
- 当 Skills/插件注册它们时，Skills 也可能直接显示为 `/prose` 这样的命令。
- 原生 Skills 命令注册由 `commands.nativeSkills` 和 `channels.<provider>.commands.nativeSkills` 控制。

说明：

- 命令接受命令与参数之间可选的 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
- `/new <model>` 接受模型别名、`provider/model`，或提供商名称（模糊匹配）；如果没有匹配项，则该文本会被视为消息正文。
- 如需完整的提供商用量明细，请使用 `openclaw status --usage`。
- `/allowlist add|remove` 需要 `commands.config=true`，并遵循渠道的 `configWrites`。
- 在多账号渠道中，面向配置目标的 `/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 也遵循目标账号的 `configWrites`。
- `/usage` 控制每次响应的用量页脚；`/usage cost` 会根据 OpenClaw 会话日志输出本地成本摘要。
- `/restart` 默认启用；设置 `commands.restart: false` 可禁用。
- `/plugins install <spec>` 接受与 `openclaw plugins install` 相同的插件规格：本地路径/压缩包、npm 包，或 `clawhub:<pkg>`。
- `/plugins enable|disable` 会更新插件配置，并且可能提示你重启。
- 仅 Discord 原生命令：`/vc join|leave|status` 用于控制语音频道（需要 `channels.discord.voice` 和原生命令；不提供文本形式）。
- Discord 线程绑定命令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）要求有效启用线程绑定（`session.threadBindings.enabled` 和/或 `channels.discord.threadBindings.enabled`）。
- ACP 命令参考和运行时行为： [ACP Agents](/zh-CN/tools/acp-agents)。
- `/verbose` 用于调试和额外可见性；在正常使用中请保持**关闭**。
- `/trace` 比 `/verbose` 更窄：它只显示插件拥有的 trace/debug 行，并保持普通详细工具输出关闭。
- `/fast on|off` 会持久化一个会话覆盖。使用 Sessions UI 的 `inherit` 选项可清除该覆盖并回退到配置默认值。
- `/fast` 是提供商相关的：OpenAI/OpenAI Codex 会在原生 Responses 端点上将其映射为 `service_tier=priority`，而直接的公共 Anthropic 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，则会将其映射为 `service_tier=auto` 或 `standard_only`。参见 [OpenAI](/zh-CN/providers/openai) 和 [Anthropic](/zh-CN/providers/anthropic)。
- 工具失败摘要在相关时仍会显示，但详细失败文本仅会在 `/verbose` 为 `on` 或 `full` 时包含。
- `/reasoning`、`/verbose` 和 `/trace` 在群组场景中有风险：它们可能暴露你本无意公开的内部推理、工具输出或插件诊断信息。建议保持关闭，尤其是在群聊中。
- `/model` 会立即持久化新的会话模型。
- 如果智能体处于空闲状态，下一次运行会立即使用它。
- 如果某次运行已经处于活动状态，OpenClaw 会将实时切换标记为待处理，并仅在一个干净的重试点重启到新模型。
- 如果工具活动或回复输出已经开始，则待处理切换可能会一直排队，直到之后出现重试机会或下一个用户轮次。
- **快速路径：** 来自 allowlist 发送者的纯命令消息会被立即处理（绕过队列 + 模型）。
- **群组提及门控：** 来自 allowlist 发送者的纯命令消息会绕过提及要求。
- **内联快捷命令（仅限 allowlist 发送者）：** 某些命令在嵌入普通消息时也能工作，并会在模型看到剩余文本前被剥离。
  - 示例：`hey /status` 会触发状态回复，而剩余文本继续经过正常流程。
- 当前包括：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
- 未授权的纯命令消息会被静默忽略，而内联 `/...` 令牌会被当作普通文本处理。
- **Skills 命令：** `user-invocable` Skills 也会作为 slash commands 暴露。名称会被规范化为 `a-z0-9_`（最大 32 个字符）；发生冲突时会加数字后缀（例如 `_2`）。
  - `/skill <name> [input]` 按名称运行一个 Skills（当原生命令限制阻止为每个技能创建命令时，这很有用）。
  - 默认情况下，Skills 命令会作为普通请求转发给模型。
  - Skills 可选择声明 `command-dispatch: tool`，将该命令直接路由到工具（确定性，无需模型）。
  - 示例：`/prose`（OpenProse 插件）——参见 [OpenProse](/zh-CN/prose)。
- **原生命令参数：** Discord 对动态选项使用自动补全（当你省略必填参数时，也会显示按钮菜单）。Telegram 和 Slack 会在某个命令支持选项且你省略参数时显示按钮菜单。

## `/tools`

`/tools` 回答的是运行时问题，而不是配置问题：**这个智能体现在在此对话中可以使用什么**。

- 默认的 `/tools` 是紧凑模式，针对快速浏览进行了优化。
- `/tools verbose` 会添加简短说明。
- 支持参数的原生命令界面会暴露同样的模式切换，即 `compact|verbose`。
- 结果是按会话作用域计算的，因此更改智能体、渠道、线程、发送者授权或模型，都可能改变输出。
- `/tools` 包含运行时实际可访问的工具，包括核心工具、已连接的插件工具以及渠道自有工具。

对于配置档和覆盖编辑，请使用控制 UI 的 Tools 面板或配置/目录界面，而不要把 `/tools` 当作静态目录。

## 用量界面（哪些内容显示在哪里）

- **提供商用量/配额**（例如：“Claude 剩余 80%”）会在启用用量跟踪时出现在当前模型提供商的 `/status` 中。OpenClaw 会将提供商窗口统一标准化为“剩余百分比”；对于 MiniMax，会在显示前反转仅剩余百分比字段，而 `model_remains` 响应会优先使用聊天模型条目和带模型标签的计划标签。
- 当实时会话快照信息稀疏时，`/status` 中的 **token/cache 行** 可以回退到最近的转录用量条目。已有的非零实时值仍然优先，而转录回退也可以在已存储总量缺失或更小时恢复活动运行时模型标签以及更大的、面向提示词的总量。
- **Runtime 与 runner：** `/status` 使用 `Runtime` 表示有效执行路径和沙箱状态，使用 `Runner` 表示实际运行该会话的是谁：嵌入式 Pi、由 CLI 支持的提供商，还是 ACP Harness/后端。
- **每次响应的 token/cost** 由 `/usage off|tokens|full` 控制（追加在普通回复后面）。
- `/model status` 关注的是**模型/认证/端点**，而不是用量。

## 模型选择（`/model`）

`/model` 被实现为一个指令。

示例：

```
/model
/model list
/model 3
/model openai/gpt-5.5
/model opus@anthropic:default
/model status
```

说明：

- `/model` 和 `/model list` 会显示一个紧凑的、带编号的选择器（模型家族 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，其中包含提供商和模型下拉框以及一个提交步骤。
- `/model <#>` 会从该选择器中选择（并在可能时优先当前提供商）。
- `/model status` 会显示详细视图，包括配置的提供商端点（`baseUrl`）和 API 模式（`api`），如果可用的话。

## 调试覆盖

`/debug` 允许你设置**仅运行时**配置覆盖（存于内存，不写磁盘）。仅限 owner。默认禁用；使用 `commands.debug: true` 启用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

说明：

- 覆盖会立即应用于新的配置读取，但**不会**写入 `openclaw.json`。
- 使用 `/debug reset` 可清除所有覆盖，并返回磁盘上的配置。

## 插件追踪输出

`/trace` 允许你切换**按会话作用域**的插件 trace/debug 行，而无需开启完整详细模式。

示例：

```text
/trace
/trace on
/trace off
```

说明：

- 不带参数的 `/trace` 会显示当前会话的追踪状态。
- `/trace on` 会为当前会话启用插件追踪行。
- `/trace off` 会再次将其禁用。
- 插件追踪行可能出现在 `/status` 中，也可能作为普通助手回复之后的附加诊断消息出现。
- `/trace` 不能替代 `/debug`；`/debug` 仍用于管理仅运行时的配置覆盖。
- `/trace` 也不能替代 `/verbose`；普通的详细工具/状态输出仍属于 `/verbose`。

## 配置更新

`/config` 会写入你的磁盘配置（`openclaw.json`）。仅限 owner。默认禁用；使用 `commands.config: true` 启用。

示例：

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

说明：

- 写入前会对配置进行验证；无效更改会被拒绝。
- `/config` 更新会在重启后保持生效。

## MCP 更新

`/mcp` 会在 `mcp.servers` 下写入由 OpenClaw 管理的 MCP 服务器定义。仅限 owner。默认禁用；使用 `commands.mcp: true` 启用。

示例：

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

说明：

- `/mcp` 将配置存储在 OpenClaw 配置中，而不是存储在由 Pi 拥有的项目设置中。
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

说明：

- `/plugins list` 和 `/plugins show` 会根据当前工作区和磁盘配置执行真实的插件发现。
- `/plugins enable|disable` 只更新插件配置；它不会安装或卸载插件。
- 在启用/禁用变更后，请重启 Gateway 网关以应用它们。

## 界面说明

- **文本命令** 在正常聊天会话中运行（私信共享 `main`，群组拥有各自独立会话）。
- **原生命令** 使用隔离会话：
  - Discord：`agent:<agentId>:discord:slash:<userId>`
  - Slack：`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
  - Telegram：`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 指向聊天会话）
- **`/stop`** 会指向活动聊天会话，以便中止当前运行。
- **Slack：** `channels.slack.slashCommand` 仍支持单个 `/openclaw` 风格命令。如果启用 `commands.native`，则必须为每个内置命令创建一个 Slack slash 命令（名称与 `/help` 相同）。Slack 的命令参数菜单会以临时 Block Kit 按钮形式投递。
  - Slack 原生例外：请注册 `/agentstatus`（而不是 `/status`），因为 Slack 保留了 `/status`。文本 `/status` 在 Slack 消息中仍然可用。

## BTW 旁支问题

`/btw` 是一个关于当前会话的快捷**旁支问题**。

与普通聊天不同：

- 它会使用当前会话作为背景上下文，
- 它以一个独立的**无工具**一次性调用运行，
- 它不会改变未来的会话上下文，
- 它不会写入转录历史，
- 它会以实时旁支结果的形式投递，而不是普通助手消息。

这使得 `/btw` 在你希望获得临时澄清、同时主任务继续进行时非常有用。

示例：

```text
/btw what are we doing right now?
```

完整行为和客户端 UX 细节请参见 [BTW Side Questions](/zh-CN/tools/btw)。
