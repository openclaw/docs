---
read_when:
    - 使用或配置聊天命令
    - 调试命令路由或权限
sidebarTitle: Slash commands
summary: 斜杠命令：文本与原生、配置和支持的命令
title: 斜杠命令
x-i18n:
    generated_at: "2026-04-27T21:49:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a18816842b5bbf2e1f16fd43c40fdfc81772cc0527ae61afefab73472844b00
    source_path: tools/slash-commands.md
    workflow: 15
---

命令由 Gateway 网关处理。大多数命令必须作为以 `/` 开头的**独立**消息发送。仅限主机的 bash 聊天命令使用 `! <cmd>`（`/bash <cmd>` 是其别名）。

当某个对话或线程绑定到 ACP 会话时，普通的后续文本会路由到该 ACP harness。Gateway 网关管理命令仍然保留在本地：`/acp ...` 始终会到达 OpenClaw ACP 命令处理器，而只要该界面启用了命令处理，`/status` 和 `/unfocus` 就始终保留在本地。

这里有两个相关系统：

<AccordionGroup>
  <Accordion title="命令">
    独立的 `/...` 消息。
  </Accordion>
  <Accordion title="指令">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。

    - 在模型看到消息之前，指令会从消息中移除。
    - 在普通聊天消息中（不是纯指令消息），它们会被视为“内联提示”，并且**不会**持久化为会话设置。
    - 在纯指令消息中（消息只包含指令），它们会持久化到会话中，并回复一条确认信息。
    - 指令仅适用于**已授权发送者**。如果设置了 `commands.allowFrom`，它就是唯一使用的允许名单；否则，授权来自渠道允许名单/配对以及 `commands.useAccessGroups`。未授权发送者会看到指令被当作普通文本处理。

  </Accordion>
  <Accordion title="内联快捷方式">
    仅限已列入允许名单/已授权的发送者：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。

    它们会立即运行，在模型看到消息之前被移除，其余文本则继续按正常流程处理。

  </Accordion>
</AccordionGroup>

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

<ParamField path="commands.text" type="boolean" default="true">
  启用在聊天消息中解析 `/...`。在没有原生命令的界面上（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams），即使你将其设置为 `false`，文本命令仍然有效。
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  注册原生命令。自动：对 Discord/Telegram 启用；对 Slack 关闭（直到你添加斜杠命令）；对不支持原生命令的提供商忽略。设置 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 可按提供商覆盖（布尔值或 `"auto"`）。`false` 会在启动时清除之前在 Discord/Telegram 上注册的命令。Slack 命令在 Slack 应用中管理，不会自动移除。
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  在支持时原生注册 **skill** 命令。自动：对 Discord/Telegram 启用；对 Slack 关闭（Slack 需要为每个 skill 创建一个斜杠命令）。设置 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 可按提供商覆盖（布尔值或 `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  启用 `! <cmd>` 以运行主机 shell 命令（`/bash <cmd>` 是别名；需要 `tools.elevated` 允许名单）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  控制 bash 在切换到后台模式前等待多长时间（`0` 表示立即转入后台）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  启用 `/config`（读取/写入 `openclaw.json`）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  启用 `/mcp`（读取/写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 配置）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  启用 `/plugins`（插件发现/状态，以及安装 + 启用/禁用控制）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  启用 `/debug`（仅运行时覆盖）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  启用 `/restart` 以及 Gateway 网关重启工具操作。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  为仅限所有者的命令/工具界面设置显式的所有者允许名单。与 `commands.allowFrom` 分开。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  按渠道设置：使仅限所有者的命令在该界面上运行时必须具备**所有者身份**。当为 `true` 时，发送者必须匹配已解析出的所有者候选项（例如 `commands.ownerAllowFrom` 中的某一项或提供商原生所有者元数据），或者在内部消息渠道上拥有内部 `operator.admin` 范围。渠道 `allowFrom` 中的通配符项，或空的/无法解析的所有者候选列表，**都不足够**——仅限所有者的命令会在该渠道上以关闭方式失败。如果你希望仅限所有者的命令只由 `ownerAllowFrom` 和标准命令允许名单控制，请保持关闭。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  控制所有者 ID 在系统提示中如何显示。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  当 `commands.ownerDisplay="hash"` 时，可选择设置所使用的 HMAC 密钥。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  用于命令授权的按提供商划分的允许名单。配置后，它将成为命令和指令唯一的授权来源（渠道允许名单/配对以及 `commands.useAccessGroups` 会被忽略）。使用 `"*"` 作为全局默认值；提供商专用键会覆盖它。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  当未设置 `commands.allowFrom` 时，对命令强制执行允许名单/策略。
</ParamField>

## 命令列表

当前事实来源：

- 核心内置命令来自 `src/auto-reply/commands-registry.shared.ts`
- 生成的 dock 命令来自 `src/auto-reply/commands-registry.data.ts`
- 插件命令来自插件的 `registerCommand()` 调用
- 你的 Gateway 网关上的实际可用性仍取决于配置标志、渠道界面以及已安装/已启用的插件

### 核心内置命令

<AccordionGroup>
  <Accordion title="会话和运行">
    - `/new [model]` 启动一个新会话；`/reset` 是重置别名。
    - `/reset soft [message]` 保留当前对话记录，丢弃复用的 CLI 后端会话 ID，并就地重新运行启动/系统提示加载。
    - `/compact [instructions]` 压缩会话上下文。参见 [Compaction](/zh-CN/concepts/compaction)。
    - `/stop` 中止当前运行。
    - `/session idle <duration|off>` 和 `/session max-age <duration|off>` 管理线程绑定过期时间。
    - `/export-session [path]` 将当前会话导出为 HTML。别名：`/export`。
    - `/export-trajectory [path]` 为当前会话导出 JSONL [trajectory bundle](/zh-CN/tools/trajectory)。别名：`/trajectory`。
  </Accordion>
  <Accordion title="模型和运行控制">
    - `/think <level>` 设置思考级别。可选项来自活动模型的提供商配置；常见级别为 `off`、`minimal`、`low`、`medium` 和 `high`，而 `xhigh`、`adaptive`、`max` 或二元 `on` 等自定义级别仅在支持时可用。别名：`/thinking`、`/t`。
    - `/verbose on|off|full` 切换详细输出。别名：`/v`。
    - `/trace on|off` 为当前会话切换插件跟踪输出。
    - `/fast [status|on|off]` 显示或设置快速模式。
    - `/reasoning [on|off|stream]` 切换 reasoning 可见性。别名：`/reason`。
    - `/elevated [on|off|ask|full]` 切换 elevated 模式。别名：`/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` 显示或设置 exec 默认值。
    - `/model [name|#|status]` 显示或设置模型。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` 列出提供商，或列出某个提供商的模型。
    - `/queue <mode>` 管理队列行为（`steer`、`interrupt`、`followup`、`collect`、`steer-backlog`），以及如 `debounce:2s cap:25 drop:summarize` 之类的选项。
  </Accordion>
  <Accordion title="发现和状态">
    - `/help` 显示简要帮助摘要。
    - `/commands` 显示生成的命令目录。
    - `/tools [compact|verbose]` 显示当前智能体现在可以使用什么。
    - `/status` 显示执行/运行时状态，包括 `Execution`/`Runtime` 标签，以及可用时的提供商使用情况/配额。
    - `/crestodian <request>` 从所有者私信中运行 Crestodian 设置和修复助手。
    - `/tasks` 列出当前会话的活动/最近后台任务。
    - `/context [list|detail|json]` 说明上下文是如何组装的。
    - `/whoami` 显示你的发送者 ID。别名：`/id`。
    - `/usage off|tokens|full|cost` 控制每次响应的使用情况页脚，或打印本地成本摘要。
  </Accordion>
  <Accordion title="Skills、允许名单、批准">
    - `/skill <name> [input]` 按名称运行一个 skill。
    - `/allowlist [list|add|remove] ...` 管理允许名单条目。仅文本。
    - `/approve <id> <decision>` 处理 exec 批准提示。
    - `/btw <question>` 在不改变未来会话上下文的情况下提出一个附带问题。参见 [BTW](/zh-CN/tools/btw)。
  </Accordion>
  <Accordion title="子智能体和 ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` 管理当前会话的子智能体运行。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` 管理 ACP 会话和运行时选项。
    - `/focus <target>` 将当前 Discord 线程或 Telegram 话题/对话绑定到一个会话目标。
    - `/unfocus` 移除当前绑定。
    - `/agents` 列出当前会话中线程绑定的智能体。
    - `/kill <id|#|all>` 中止一个或所有正在运行的子智能体。
    - `/steer <id|#> <message>` 向正在运行的子智能体发送引导。别名：`/tell`。
  </Accordion>
  <Accordion title="仅限所有者的写入和管理">
    - `/config show|get|set|unset` 读取或写入 `openclaw.json`。仅限所有者。需要 `commands.config: true`。
    - `/mcp show|get|set|unset` 读取或写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器配置。仅限所有者。需要 `commands.mcp: true`。
    - `/plugins list|inspect|show|get|install|enable|disable` 检查或修改插件状态。`/plugin` 是别名。写操作仅限所有者。需要 `commands.plugins: true`。
    - `/debug show|set|unset|reset` 管理仅运行时的配置覆盖。仅限所有者。需要 `commands.debug: true`。
    - `/restart` 在启用时重启 OpenClaw。默认：启用；设置 `commands.restart: false` 可禁用。
    - `/send on|off|inherit` 设置发送策略。仅限所有者。
  </Accordion>
  <Accordion title="语音、TTS、渠道控制">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` 控制 TTS。参见 [TTS](/zh-CN/tools/tts)。
    - `/activation mention|always` 设置群组激活模式。
    - `/bash <command>` 运行主机 shell 命令。仅文本。别名：`! <command>`。需要 `commands.bash: true` 以及 `tools.elevated` 允许名单。
    - `!poll [sessionId]` 检查后台 bash 作业。
    - `!stop [sessionId]` 停止后台 bash 作业。
  </Accordion>
</AccordionGroup>

### 生成的 dock 命令

Dock 命令会将当前会话的回复路由切换到另一个已链接的
渠道。有关设置、示例和故障排除，请参见 [Channel docking](/zh-CN/concepts/channel-docking)。

Dock 命令由支持原生命令的渠道插件生成。当前内置集合：

- `/dock-discord`（别名：`/dock_discord`）
- `/dock-mattermost`（别名：`/dock_mattermost`）
- `/dock-slack`（别名：`/dock_slack`）
- `/dock-telegram`（别名：`/dock_telegram`）

从私聊中使用 dock 命令，将当前会话的回复路由切换到另一个已链接的渠道。智能体会保持相同的会话上下文，但该会话今后的回复将发送到所选渠道对端。

Dock 命令需要 `session.identityLinks`。源发送者和目标对端必须位于同一个身份组中，例如 `["telegram:123", "discord:456"]`。如果一个 ID 为 `123` 的 Telegram 用户发送 `/dock_discord`，OpenClaw 会在活动会话上存储 `lastChannel: "discord"` 和 `lastTo: "456"`。如果该发送者没有链接到 Discord 对端，命令会回复一个设置提示，而不是回退到普通聊天流程。

Docking 只会更改活动会话路由。它不会创建渠道账号、授予访问权限、绕过渠道允许名单，也不会将对话记录历史移动到另一个会话。使用 `/dock-telegram`、`/dock-slack`、`/dock-mattermost` 或其他生成的 dock 命令可再次切换路由。

### 内置插件命令

内置插件还可以添加更多斜杠命令。此仓库中当前内置的命令：

- `/dreaming [on|off|status|help]` 切换 memory dreaming。参见 [Dreaming](/zh-CN/concepts/dreaming)。
- `/pair [qr|status|pending|approve|cleanup|notify]` 管理设备配对/设置流程。参见 [Pairing](/zh-CN/channels/pairing)。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` 临时启用高风险手机节点命令。
- `/voice status|list [limit]|set <voiceId|name>` 管理 Talk 语音配置。在 Discord 上，原生命令名称为 `/talkvoice`。
- `/card ...` 发送 LINE 富卡片预设。参见 [LINE](/zh-CN/channels/line)。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` 检查并控制内置的 Codex app-server harness。参见 [Codex harness](/zh-CN/plugins/codex-harness)。
- 仅 QQBot 命令：
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 动态 skill 命令

可由用户调用的 Skills 也会作为斜杠命令暴露：

- `/skill <name> [input]` 始终可作为通用入口点使用。
- 当 skill/插件注册了它们时，skills 也可能显示为直接命令，例如 `/prose`。
- 原生 skill 命令注册由 `commands.nativeSkills` 和 `channels.<provider>.commands.nativeSkills` 控制。

<AccordionGroup>
  <Accordion title="参数和解析器说明">
    - 命令在命令与参数之间可接受一个可选的 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
    - `/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配）；如果没有匹配项，则该文本会被视为消息正文。
    - 如需完整的提供商使用情况明细，请使用 `openclaw status --usage`。
    - `/allowlist add|remove` 需要 `commands.config=true`，并遵循渠道 `configWrites`。
    - 在多账号渠道中，面向配置目标的 `/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 也会遵循目标账号的 `configWrites`。
    - `/usage` 控制每次响应的使用情况页脚；`/usage cost` 会根据 OpenClaw 会话日志打印本地成本摘要。
    - `/restart` 默认启用；设置 `commands.restart: false` 可禁用。
    - `/plugins install <spec>` 接受与 `openclaw plugins install` 相同的插件规格：本地路径/归档、npm 包，或 `clawhub:<pkg>`。
    - `/plugins enable|disable` 会更新插件配置，并可能提示需要重启。
  </Accordion>
  <Accordion title="渠道特定行为">
    - 仅 Discord 的原生命令：`/vc join|leave|status` 控制语音频道（不提供文本形式）。`join` 需要 guild 和选定的语音/舞台频道。需要 `channels.discord.voice` 和原生命令。
    - Discord 线程绑定命令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）要求有效启用线程绑定（`session.threadBindings.enabled` 和/或 `channels.discord.threadBindings.enabled`）。
    - ACP 命令参考和运行时行为：参见 [ACP agents](/zh-CN/tools/acp-agents)。
  </Accordion>
  <Accordion title="verbose / trace / fast / reasoning 安全性">
    - `/verbose` 用于调试和提供额外可见性；在正常使用中请保持**关闭**。
    - `/trace` 比 `/verbose` 更窄：它只显示插件拥有的 trace/debug 行，并保持普通的详细工具输出关闭。
    - `/fast on|off` 会持久化一个会话覆盖项。使用 Sessions UI 中的 `inherit` 选项可清除它并回退到配置默认值。
    - `/fast` 是提供商特定的：OpenAI/OpenAI Codex 会将其映射到原生 Responses 端点上的 `service_tier=priority`，而直接向公共 Anthropic 发起的请求，包括发送到 `api.anthropic.com` 的 OAuth 身份验证流量，则会映射为 `service_tier=auto` 或 `standard_only`。参见 [OpenAI](/zh-CN/providers/openai) 和 [Anthropic](/zh-CN/providers/anthropic)。
    - 相关时仍会显示工具失败摘要，但详细失败文本仅在 `/verbose` 为 `on` 或 `full` 时包含。
    - `/reasoning`、`/verbose` 和 `/trace` 在群组场景中存在风险：它们可能暴露你本不打算公开的内部推理、工具输出或插件诊断信息。建议保持关闭，尤其是在群聊中。
  </Accordion>
  <Accordion title="模型切换">
    - `/model` 会立即持久化新的会话模型。
    - 如果智能体处于空闲状态，下一次运行会立即使用它。
    - 如果某次运行已经处于活动状态，OpenClaw 会将实时切换标记为待处理，并仅在一个干净的重试点重启到新模型。
    - 如果工具活动或回复输出已经开始，则待处理切换可能会一直排队，直到稍后的重试机会或下一次用户轮次。
    - 在本地 TUI 中，`/crestodian [request]` 会从普通智能体 TUI 返回到 Crestodian。这与消息渠道救援模式分开，也不会授予远程配置权限。
  </Accordion>
  <Accordion title="快速路径和内联快捷方式">
    - **快速路径：** 来自允许名单发送者的纯命令消息会被立即处理（绕过队列 + 模型）。
    - **群组提及门控：** 来自允许名单发送者的纯命令消息会绕过提及要求。
    - **内联快捷方式（仅限允许名单发送者）：** 某些命令在嵌入普通消息时也可生效，并会在模型看到其余内容之前被移除。
      - 示例：`hey /status` 会触发一条状态回复，而剩余文本会继续经过正常流程。
    - 当前包括：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
    - 未授权的纯命令消息会被静默忽略，内联 `/...` 标记则会被当作普通文本处理。
  </Accordion>
  <Accordion title="Skill 命令和原生参数">
    - **Skill 命令：** `user-invocable` Skills 会作为斜杠命令暴露。名称会被清洗为 `a-z0-9_`（最多 32 个字符）；冲突会附加数字后缀（例如 `_2`）。
      - `/skill <name> [input]` 按名称运行一个 skill（当原生命令限制阻止按 skill 单独建命令时很有用）。
      - 默认情况下，skill 命令会作为普通请求转发给模型。
      - Skills 可选择声明 `command-dispatch: tool`，以将命令直接路由到某个工具（确定性，无模型参与）。
      - 示例：`/prose`（OpenProse 插件）——参见 [OpenProse](/zh-CN/prose)。
    - **原生命令参数：** Discord 对动态选项使用自动补全（当你省略必填参数时也会使用按钮菜单）。当某条命令支持可选值且你省略参数时，Telegram 和 Slack 会显示按钮菜单。动态选项会根据目标会话模型解析，因此像 `/think` 级别这样的模型特定选项会遵循该会话的 `/model` 覆盖项。
  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` 回答的是一个运行时问题，而不是配置问题：**这个智能体此刻在这个对话中可以使用什么**。

- 默认的 `/tools` 是紧凑格式，并针对快速浏览进行了优化。
- `/tools verbose` 会添加简短说明。
- 支持带参数的原生命令界面也会暴露相同的模式切换：`compact|verbose`。
- 结果是会话作用域的，因此更改智能体、渠道、线程、发送者授权或模型都可能改变输出。
- `/tools` 包括在运行时实际可达的工具，包括核心工具、已连接的插件工具和渠道拥有的工具。

如需编辑配置文件和覆盖项，请使用 Control UI Tools 面板或配置/目录界面，而不要将 `/tools` 视为静态目录。

## 使用情况界面（不同位置显示什么）

- **提供商使用量/配额**（例如：“Claude 还剩 80%”）会在启用使用情况跟踪时显示在当前模型提供商的 `/status` 中。OpenClaw 会将提供商窗口统一规范为“剩余百分比”；对于 MiniMax，只有剩余值的百分比字段会在显示前取反，而 `model_remains` 响应会优先使用 chat-model 条目以及带模型标记的套餐标签。
- `/status` 中的**令牌/缓存行**在实时会话快照信息不足时，可以回退到最新的对话记录使用情况条目。现有的非零实时值仍然优先，且对话记录回退还可以在存储总量缺失或更小时恢复活动运行时模型标签以及一个更偏向提示词的更大总量。
- **Execution 与 Runtime：** `/status` 会为有效的沙箱路径报告 `Execution`，并为实际运行该会话的对象报告 `Runtime`：`OpenClaw Pi Default`、`OpenAI Codex`、某个 CLI 后端，或 ACP 后端。
- **每次响应的令牌/成本** 由 `/usage off|tokens|full` 控制（附加到普通回复末尾）。
- `/model status` 关注的是**模型/凭证/端点**，而不是使用情况。

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

说明：

- `/model` 和 `/model list` 会显示一个紧凑的编号选择器（模型家族 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，其中包含提供商和模型下拉菜单，以及一个提交步骤。
- `/model <#>` 会从该选择器中进行选择（并在可能时优先使用当前提供商）。
- `/model status` 会显示详细视图，包括已配置的提供商端点（`baseUrl`）和 API 模式（`api`），如果可用。

## 调试覆盖项

`/debug` 允许你设置**仅运行时**的配置覆盖项（存储在内存中，不写磁盘）。仅限所有者。默认禁用；用 `commands.debug: true` 启用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
覆盖项会立即应用于新的配置读取，但**不会**写入 `openclaw.json`。使用 `/debug reset` 可清除所有覆盖项并返回到磁盘上的配置。
</Note>

## 插件 trace 输出

`/trace` 允许你切换**会话作用域的插件 trace/debug 行**，而无需开启完整的详细模式。

示例：

```text
/trace
/trace on
/trace off
```

说明：

- 不带参数的 `/trace` 会显示当前会话的 trace 状态。
- `/trace on` 会为当前会话启用插件 trace 行。
- `/trace off` 会再次将其禁用。
- 插件 trace 行可能出现在 `/status` 中，也可能作为普通助手回复之后的一条后续诊断消息出现。
- `/trace` 不能替代 `/debug`；`/debug` 仍用于管理仅运行时的配置覆盖项。
- `/trace` 也不能替代 `/verbose`；普通的详细工具/状态输出仍属于 `/verbose`。

## 配置更新

`/config` 会写入你磁盘上的配置（`openclaw.json`）。仅限所有者。默认禁用；用 `commands.config: true` 启用。

示例：

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
配置会在写入前进行验证；无效更改会被拒绝。`/config` 更新会在重启后保留。
</Note>

## MCP 更新

`/mcp` 会将由 OpenClaw 管理的 MCP 服务器定义写入 `mcp.servers` 下。仅限所有者。默认禁用；用 `commands.mcp: true` 启用。

示例：

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` 将配置存储在 OpenClaw 配置中，而不是 Pi 拥有的项目设置中。运行时适配器决定哪些传输实际上可执行。
</Note>

## 插件更新

`/plugins` 允许操作员检查已发现的插件，并在配置中切换启用状态。只读流程可使用 `/plugin` 作为别名。默认禁用；用 `commands.plugins: true` 启用。

示例：

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` 和 `/plugins show` 会基于当前工作区和磁盘上的配置执行真实的插件发现。
- `/plugins enable|disable` 仅更新插件配置；它不会安装或卸载插件。
- 在启用/禁用更改后，请重启 Gateway 网关以应用这些更改。
</Note>

## 界面说明

<AccordionGroup>
  <Accordion title="每个界面的会话">
    - **文本命令** 在普通聊天会话中运行（私信共享 `main`，群组有各自独立的会话）。
    - **原生命令** 使用隔离会话：
      - Discord：`agent:<agentId>:discord:slash:<userId>`
      - Slack：`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
      - Telegram：`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 定位到聊天会话）
    - **`/stop`** 以当前活动聊天会话为目标，因此它可以中止当前运行。
  </Accordion>
  <Accordion title="Slack 细节">
    `channels.slack.slashCommand` 仍然支持单个 `/openclaw` 风格命令。如果你启用了 `commands.native`，则必须为每个内置命令在 Slack 中创建一个斜杠命令（名称与 `/help` 中的一致）。Slack 的命令参数菜单以临时的 Block Kit 按钮形式提供。

    Slack 原生命令例外：请注册 `/agentstatus`（而不是 `/status`），因为 Slack 保留了 `/status`。文本形式的 `/status` 在 Slack 消息中仍然有效。

  </Accordion>
</AccordionGroup>

## BTW 附带问题

`/btw` 是关于当前会话的一个快速**附带问题**。

与普通聊天不同：

- 它使用当前会话作为背景上下文，
- 它作为一个独立的**无工具**单次调用运行，
- 它不会改变未来的会话上下文，
- 它不会写入对话记录历史，
- 它会作为实时的附带结果交付，而不是普通的助手消息。

这使得 `/btw` 在你想要临时澄清某件事、同时主任务继续进行时非常有用。

示例：

```text
/btw what are we doing right now?
```

完整行为和客户端 UX 细节请参见 [BTW Side Questions](/zh-CN/tools/btw)。

## 相关内容

- [Creating skills](/zh-CN/tools/creating-skills)
- [Skills](/zh-CN/tools/skills)
- [Skills 配置](/zh-CN/tools/skills-config)
