---
read_when:
    - 使用或配置聊天命令
    - 调试命令路由或权限
sidebarTitle: Slash commands
summary: 斜杠命令：文本与原生形式、配置和支持的命令
title: 斜杠命令
x-i18n:
    generated_at: "2026-05-02T02:49:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a00619cc0eff25b81b475eab5b0b3d808bf067e6e004a491a90ec3982149b7
    source_path: tools/slash-commands.md
    workflow: 16
---

命令由 Gateway 网关处理。大多数命令必须作为以 `/` 开头的**独立**消息发送。仅主机的 bash 聊天命令使用 `! <cmd>`（`/bash <cmd>` 是其别名）。

当对话或线程绑定到 ACP 会话时，普通后续文本会路由到该 ACP harness。Gateway 网关管理命令仍保留在本地：`/acp ...` 始终到达 OpenClaw ACP 命令处理器；只要该表面的命令处理已启用，`/status` 和 `/unfocus` 也会保留在本地。

有两个相关系统：

<AccordionGroup>
  <Accordion title="命令">
    独立的 `/...` 消息。
  </Accordion>
  <Accordion title="指令">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。

    - 指令会在模型看到消息前从消息中移除。
    - 在普通聊天消息（非纯指令消息）中，它们会被视为“行内提示”，并且**不会**持久化会话设置。
    - 在纯指令消息（消息只包含指令）中，它们会持久化到会话，并回复确认。
    - 指令只会应用于**已授权发送者**。如果设置了 `commands.allowFrom`，它就是唯一使用的允许列表；否则授权来自渠道允许列表/配对以及 `commands.useAccessGroups`。未授权发送者的指令会被视为纯文本。

  </Accordion>
  <Accordion title="行内快捷方式">
    仅限允许列表内/已授权发送者：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。

    它们会立即运行，在模型看到消息前被移除，剩余文本会继续走正常流程。

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
  启用聊天消息中的 `/...` 解析。在没有原生命令的表面（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）上，即使你将此项设置为 `false`，文本命令仍然可用。
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  注册原生命令。Auto：对 Discord/Telegram 启用；对 Slack 关闭（直到你添加斜杠命令）；对不支持原生命令的提供商忽略。设置 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 可按提供商覆盖（布尔值或 `"auto"`）。`false` 会在启动时清除 Discord/Telegram 上先前注册的命令。Slack 命令在 Slack 应用中管理，不会自动移除。
</ParamField>
在 Discord 上，原生命令规范可以包含 `descriptionLocalizations`，OpenClaw 会将其发布为 Discord `description_localizations`，并纳入协调比较。
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  在支持时以原生方式注册 **Skills** 命令。Auto：对 Discord/Telegram 启用；对 Slack 关闭（Slack 要求为每个 Skills 创建一个斜杠命令）。设置 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 可按提供商覆盖（布尔值或 `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  启用 `! <cmd>` 以运行主机 shell 命令（`/bash <cmd>` 是别名；需要 `tools.elevated` 允许列表）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  控制 bash 在切换到后台模式前等待多久（`0` 表示立即后台运行）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  启用 `/config`（读取/写入 `openclaw.json`）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  启用 `/mcp`（读取/写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 配置）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  启用 `/plugins`（插件发现/Status 以及安装 + 启用/禁用控件）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  启用 `/debug`（仅运行时覆盖）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  启用 `/restart` 以及 Gateway 网关重启工具操作。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  为仅所有者命令/工具表面设置显式所有者允许列表。这是可以批准危险操作并运行 `/diagnostics`、`/export-trajectory` 和 `/config` 等命令的人类操作员账号。它独立于 `commands.allowFrom`，也独立于私信配对访问。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  按渠道设置：要求仅所有者命令必须以**所有者身份**在该表面运行。当为 `true` 时，发送者必须匹配已解析的所有者候选项（例如 `commands.ownerAllowFrom` 中的条目或提供商原生所有者元数据），或者在内部消息渠道上拥有内部 `operator.admin` 作用域。渠道 `allowFrom` 中的通配符条目，或空的/未解析的所有者候选列表，**不足以**满足要求——仅所有者命令会在该渠道上默认关闭。如果你希望仅所有者命令只受 `ownerAllowFrom` 和标准命令允许列表保护，请保持此项关闭。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  控制所有者 ID 在系统提示中的显示方式。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  可选设置在 `commands.ownerDisplay="hash"` 时使用的 HMAC 密钥。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  用于命令授权的按提供商允许列表。配置后，它就是命令和指令唯一的授权来源（渠道允许列表/配对以及 `commands.useAccessGroups` 会被忽略）。使用 `"*"` 作为全局默认值；提供商特定键会覆盖它。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  在未设置 `commands.allowFrom` 时，对命令强制执行允许列表/策略。
</ParamField>

## 命令列表

当前事实来源：

- 核心内置命令来自 `src/auto-reply/commands-registry.shared.ts`
- 生成的 dock 命令来自 `src/auto-reply/commands-registry.data.ts`
- 插件命令来自插件的 `registerCommand()` 调用
- 你 Gateway 网关上的实际可用性仍取决于配置标志、渠道表面以及已安装/已启用的插件

### 核心内置命令

<AccordionGroup>
  <Accordion title="会话和运行">
    - `/new [model]` 启动新会话；`/reset` 是重置别名。
    - `/reset soft [message]` 保留当前转录记录，丢弃复用的 CLI 后端会话 ID，并在原地重新运行启动/系统提示加载。
    - `/compact [instructions]` 压缩会话上下文。参见 [Compaction](/zh-CN/concepts/compaction)。
    - `/stop` 中止当前运行。
    - `/session idle <duration|off>` 和 `/session max-age <duration|off>` 管理线程绑定过期时间。
    - `/export-session [path]` 将当前会话导出为 HTML。别名：`/export`。
    - `/export-trajectory [path]` 请求 exec 批准，然后为当前会话导出 JSONL [轨迹包](/zh-CN/tools/trajectory)。当你需要一个 OpenClaw 会话的提示、工具和转录时间线时使用它。在群聊中，批准提示和导出结果会私下发送给所有者。别名：`/trajectory`。

  </Accordion>
  <Accordion title="模型和运行控件">
    - `/think <level>` 设置思考级别。选项来自活动模型的提供商配置文件；常见级别包括 `off`、`minimal`、`low`、`medium` 和 `high`，而 `xhigh`、`adaptive`、`max` 等自定义级别或二进制 `on` 只在受支持的位置可用。别名：`/thinking`、`/t`。
    - `/verbose on|off|full` 切换详细输出。别名：`/v`。
    - `/trace on|off` 切换当前会话的插件 trace 输出。
    - `/fast [status|on|off]` 显示或设置快速模式。
    - `/reasoning [on|off|stream]` 切换推理可见性。别名：`/reason`。
    - `/elevated [on|off|ask|full]` 切换提升模式。别名：`/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` 显示或设置 exec 默认值。
    - `/model [name|#|status]` 显示或设置模型。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` 列出已配置/可用凭证的提供商，或某个提供商的模型；添加 `all` 可浏览该提供商的完整目录。
    - `/queue <mode>` 管理队列行为（`steer`、旧版 `queue`、`followup`、`collect`、`steer-backlog`、`interrupt`）以及 `debounce:0.5s cap:25 drop:summarize` 等选项；`/queue default` 或 `/queue reset` 会清除会话覆盖。参见 [命令队列](/zh-CN/concepts/queue) 和 [Steering queue](/zh-CN/concepts/queue-steering)。

  </Accordion>
  <Accordion title="设备发现和 Status">
    - `/help` 显示简短帮助摘要。
    - `/commands` 显示生成的命令目录。
    - `/tools [compact|verbose]` 显示当前智能体现在可以使用的内容。
    - `/status` 显示执行/运行时 Status，包括可用时的 `Execution`/`Runtime` 标签以及提供商用量/配额。
    - `/diagnostics [note]` 是 Gateway 网关 bug 和 Codex harness 运行的仅所有者支持报告流程。它每次都会在运行 `openclaw gateway diagnostics export --json` 前请求明确的 exec 批准；不要使用允许所有的规则批准诊断。批准后，它会发送一份可粘贴的报告，其中包含本地包路径、清单摘要、隐私说明和相关会话 ID。在群聊中，批准提示和报告会私下发送给所有者。当活动会话使用 OpenAI Codex harness 时，同一个批准也会将相关 Codex 反馈发送到 OpenAI 服务器，完成后的回复会列出 OpenClaw 会话 ID、Codex 线程 ID 和 `codex resume <thread-id>` 命令。参见 [诊断导出](/zh-CN/gateway/diagnostics)。
    - `/crestodian <request>` 从所有者私信运行 Crestodian 设置和修复助手。
    - `/tasks` 列出当前会话的活动/最近后台任务。
    - `/context [list|detail|json]` 说明上下文如何组装。
    - `/whoami` 显示你的发送者 ID。别名：`/id`。
    - `/usage off|tokens|full|cost` 控制每条回复的用量页脚，或打印本地成本摘要。

  </Accordion>
  <Accordion title="Skills、允许列表、批准">
    - `/skill <name> [input]` 按名称运行一个 Skills。
    - `/allowlist [list|add|remove] ...` 管理允许列表条目。仅文本。
    - `/approve <id> <decision>` 解决 exec 批准提示。
    - `/btw <question>` 提出一个旁路问题，而不会更改未来会话上下文。参见 [BTW](/zh-CN/tools/btw)。

  </Accordion>
  <Accordion title="子智能体和 ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` 管理当前会话的子智能体运行。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` 管理 ACP 会话和运行时选项。
    - `/focus <target>` 将当前 Discord 线程或 Telegram 主题/对话绑定到会话目标。
    - `/unfocus` 移除当前绑定。
    - `/agents` 列出当前会话的线程绑定智能体。
    - `/kill <id|#|all>` 中止一个或所有正在运行的子智能体。
    - `/steer <id|#> <message>` 向正在运行的子智能体发送 steering。别名：`/tell`。

  </Accordion>
  <Accordion title="仅所有者写入和管理">
    - `/config show|get|set|unset` 读取或写入 `openclaw.json`。仅所有者可用。需要 `commands.config: true`。
    - `/mcp show|get|set|unset` 读取或写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器配置。仅所有者可用。需要 `commands.mcp: true`。
    - `/plugins list|inspect|show|get|install|enable|disable` 检查或更改插件状态。`/plugin` 是别名。写入仅所有者可用。需要 `commands.plugins: true`。
    - `/debug show|set|unset|reset` 管理仅运行时的配置覆盖。仅所有者可用。需要 `commands.debug: true`。
    - `/restart` 在启用时重启 OpenClaw。默认：启用；设置 `commands.restart: false` 可禁用它。
    - `/send on|off|inherit` 设置发送策略。仅所有者可用。

  </Accordion>
  <Accordion title="语音、TTS、渠道控制">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` 控制 TTS。参见 [TTS](/zh-CN/tools/tts)。
    - `/activation mention|always` 设置群组激活模式。
    - `/bash <command>` 运行主机 shell 命令。仅文本。别名：`! <command>`。需要 `commands.bash: true` 以及 `tools.elevated` 允许列表。
    - `!poll [sessionId]` 检查后台 bash 任务。
    - `!stop [sessionId]` 停止后台 bash 任务。

  </Accordion>
</AccordionGroup>

### 生成的 dock 命令

Dock 命令会将当前会话的回复路由切换到另一个已关联的渠道。设置、示例和故障排除见[渠道 dock](/zh-CN/concepts/channel-docking)。

Dock 命令由支持原生命令的渠道插件生成。当前内置集合：

- `/dock-discord`（别名：`/dock_discord`）
- `/dock-mattermost`（别名：`/dock_mattermost`）
- `/dock-slack`（别名：`/dock_slack`）
- `/dock-telegram`（别名：`/dock_telegram`）

在直接聊天中使用 dock 命令，将当前会话的回复路由切换到另一个已关联的渠道。智能体保持相同的会话上下文，但该会话之后的回复会发送到所选的渠道对端。

Dock 命令需要 `session.identityLinks`。来源发送者和目标对端必须位于同一个身份组中，例如 `["telegram:123", "discord:456"]`。如果 id 为 `123` 的 Telegram 用户发送 `/dock_discord`，OpenClaw 会在活动会话上存储 `lastChannel: "discord"` 和 `lastTo: "456"`。如果发送者未关联到 Discord 对端，该命令会回复设置提示，而不是落入普通聊天。

Dock 只会更改活动会话路由。它不会创建渠道账号、授予访问权限、绕过渠道允许列表，或将转录历史移动到另一个会话。使用 `/dock-telegram`、`/dock-slack`、`/dock-mattermost` 或另一个生成的 dock 命令再次切换路由。

### 内置插件命令

内置插件可以添加更多斜杠命令。此仓库中的当前内置命令：

- `/dreaming [on|off|status|help]` 切换记忆 Dreaming。参见 [Dreaming](/zh-CN/concepts/dreaming)。
- `/pair [qr|status|pending|approve|cleanup|notify]` 管理设备配对/设置流程。参见[配对](/zh-CN/channels/pairing)。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` 临时武装高风险手机节点命令。
- `/voice status|list [limit]|set <voiceId|name>` 管理 Talk 语音配置。在 Discord 上，原生命令名称是 `/talkvoice`。
- `/card ...` 发送 LINE 富卡片预设。参见 [LINE](/zh-CN/channels/line)。
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` 检查并控制内置 Codex 应用服务器 harness。参见 [Codex harness](/zh-CN/plugins/codex-harness)。
- 仅 QQBot 的命令：
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 动态 skill 命令

用户可调用的 Skills 也会作为斜杠命令公开：

- `/skill <name> [input]` 始终可用，作为通用入口点。
- 当 skill/插件注册直接命令时，Skills 也可能显示为 `/prose` 这样的直接命令。
- 原生 skill 命令注册由 `commands.nativeSkills` 和 `channels.<provider>.commands.nativeSkills` 控制。
- 命令规格可以为支持本地化描述的原生界面提供 `descriptionLocalizations`，包括 Discord。

<AccordionGroup>
  <Accordion title="参数和解析器说明">
    - 命令和参数之间可接受可选的 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
    - `/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配）；如果没有匹配，文本会被视为消息正文。
    - 要查看完整提供商用量明细，请使用 `openclaw status --usage`。
    - `/allowlist add|remove` 需要 `commands.config=true`，并遵循渠道 `configWrites`。
    - 在多账号渠道中，面向配置的 `/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 也遵循目标账号的 `configWrites`。
    - `/usage` 控制每条回复的用量页脚；`/usage cost` 会从 OpenClaw 会话日志打印本地成本摘要。
    - `/restart` 默认启用；设置 `commands.restart: false` 可禁用它。
    - `/plugins install <spec>` 接受与 `openclaw plugins install` 相同的插件规格：本地路径/归档、npm 包、`git:<repo>` 或 `clawhub:<pkg>`。
    - `/plugins enable|disable` 会更新插件配置，并可能提示重启。

  </Accordion>
  <Accordion title="渠道特定行为">
    - 仅 Discord 的原生命令：`/vc join|leave|status` 控制语音渠道（不能作为文本使用）。`join` 需要一个 guild 和已选择的语音/舞台渠道。需要 `channels.discord.voice` 和原生命令。
    - Discord 线程绑定命令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）需要启用有效的线程绑定（`session.threadBindings.enabled` 和/或 `channels.discord.threadBindings.enabled`）。
    - ACP 命令参考和运行时行为：[ACP 智能体](/zh-CN/tools/acp-agents)。

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning 安全性">
    - `/verbose` 用于调试和提供额外可见性；正常使用时保持**关闭**。
    - `/trace` 比 `/verbose` 范围更窄：它只显示插件拥有的 trace/debug 行，并保持普通详细工具噪声关闭。
    - `/fast on|off` 会持久化会话覆盖。使用会话 UI 的 `inherit` 选项清除它并回退到配置默认值。
    - `/fast` 是提供商特定的：OpenAI/OpenAI Codex 会在原生 Responses 端点上将其映射到 `service_tier=priority`，而直接的公共 Anthropic 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，会将其映射到 `service_tier=auto` 或 `standard_only`。参见 [OpenAI](/zh-CN/providers/openai) 和 [Anthropic](/zh-CN/providers/anthropic)。
    - 相关时仍会显示工具失败摘要，但详细失败文本只会在 `/verbose` 为 `on` 或 `full` 时包含。
    - `/reasoning`、`/verbose` 和 `/trace` 在群组环境中有风险：它们可能暴露你无意公开的内部推理、工具输出或插件诊断。建议保持关闭，尤其是在群聊中。

  </Accordion>
  <Accordion title="模型切换">
    - `/model` 会立即持久化新的会话模型。
    - 如果智能体处于空闲状态，下一次运行会立即使用它。
    - 如果运行已经活动，OpenClaw 会将实时切换标记为待处理，并且只会在干净的重试点重启到新模型。
    - 如果工具活动或回复输出已经开始，待处理切换可能会一直排队，直到之后的重试机会或下一次用户轮次。
    - 在本地 TUI 中，`/crestodian [request]` 会从普通智能体 TUI 返回 Crestodian。这与消息渠道救援模式分开，并且不会授予远程配置权限。

  </Accordion>
  <Accordion title="快速路径和内联快捷方式">
    - **快速路径：** 来自允许列表发送者的纯命令消息会立即处理（绕过队列 + 模型）。
    - **群组提及门控：** 来自允许列表发送者的纯命令消息会绕过提及要求。
    - **内联快捷方式（仅限允许列表发送者）：** 某些命令嵌入普通消息时也能工作，并会在模型看到剩余文本之前被剥离。
      - 示例：`hey /status` 触发状态回复，剩余文本继续走普通流程。
    - 当前：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
    - 未授权的纯命令消息会被静默忽略，内联 `/...` token 会被视为纯文本。

  </Accordion>
  <Accordion title="Skill 命令和原生参数">
    - **Skill 命令：** `user-invocable` Skills 会作为斜杠命令公开。名称会被规范化为 `a-z0-9_`（最多 32 个字符）；冲突会获得数字后缀（例如 `_2`）。
      - `/skill <name> [input]` 按名称运行 skill（当原生命令限制阻止为每个 skill 创建命令时很有用）。
      - 默认情况下，skill 命令会作为普通请求转发给模型。
      - Skills 可以选择声明 `command-dispatch: tool`，将命令直接路由到工具（确定性，无模型）。
      - 示例：`/prose`（OpenProse 插件）— 参见 [OpenProse](/zh-CN/prose)。
    - **原生命令参数：** Discord 对动态选项使用自动补全（当你省略必需参数时使用按钮菜单）。Telegram 和 Slack 在命令支持选择项且你省略参数时显示按钮菜单。动态选择项会根据目标会话模型解析，因此 `/think` 级别等模型特定选项会遵循该会话的 `/model` 覆盖。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` 回答的是运行时问题，而不是配置问题：**这个智能体在当前对话中现在可以使用什么**。

- 默认 `/tools` 很紧凑，并为快速扫描优化。
- `/tools verbose` 添加简短描述。
- 支持参数的原生命令界面会公开相同的模式开关：`compact|verbose`。
- 结果限定于会话范围，因此更改智能体、渠道、线程、发送者授权或模型都可能改变输出。
- `/tools` 包括运行时实际可达的工具，包括核心工具、已连接插件工具和渠道拥有的工具。

要编辑 profile 和覆盖，请使用 Control UI Tools 面板或配置/catalog 界面，而不是把 `/tools` 当作静态 catalog。

## 用量界面（哪里显示什么）

- **提供商用量/配额**（示例：“Claude 剩余 80%”）会在启用用量跟踪时显示在当前模型提供商的 `/status` 中。OpenClaw 会将提供商窗口标准化为 `% left`；对于 MiniMax，仅剩余的百分比字段会在显示前反转，`model_remains` 响应优先使用聊天模型条目以及带模型标签的 plan 标签。
- **Token/缓存行**在 `/status` 中可以在实时会话快照稀疏时回退到最新的转录用量条目。现有的非零实时值仍然优先，转录回退还可以恢复活动运行时模型标签，以及在存储总数缺失或更小时恢复更大的面向提示词的总数。
- **执行 vs 运行时：** `/status` 会为有效的沙箱路径报告 `Execution`，并为实际运行会话的一方报告 `Runtime`：`OpenClaw Pi Default`、`OpenAI Codex`、CLI 后端或 ACP 后端。
- **每条回复的 token/成本**由 `/usage off|tokens|full` 控制（追加到普通回复）。
- `/model status` 关注的是**模型/认证/端点**，不是用量。

## 模型选择（`/model`）

`/model` 实现为 directive。

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

- `/model` 和 `/model list` 会显示一个紧凑的编号选择器（模型系列 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，其中包含提供商和模型下拉菜单，以及一个提交步骤。
- `/model <#>` 会从该选择器中选择（并在可能时优先使用当前提供商）。
- `/model status` 会显示详细视图，包括已配置的提供商端点（`baseUrl`）和 API 模式（`api`，如果可用）。

## 调试覆盖

`/debug` 允许你设置**仅运行时**配置覆盖（存于内存，而非磁盘）。仅限所有者。默认禁用；使用 `commands.debug: true` 启用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
覆盖会立即应用到新的配置读取，但**不会**写入 `openclaw.json`。使用 `/debug reset` 清除所有覆盖并返回磁盘上的配置。
</Note>

## 插件跟踪输出

`/trace` 允许你切换**会话范围的插件跟踪/调试行**，而无需开启完整详细模式。

示例：

```text
/trace
/trace on
/trace off
```

注意：

- 不带参数的 `/trace` 会显示当前会话的跟踪状态。
- `/trace on` 会为当前会话启用插件跟踪行。
- `/trace off` 会再次禁用它们。
- 插件跟踪行可以出现在 `/status` 中，也可以在普通助手回复后作为后续诊断消息出现。
- `/trace` 不会替代 `/debug`；`/debug` 仍然管理仅运行时的配置覆盖。
- `/trace` 不会替代 `/verbose`；普通详细工具/Status 输出仍然属于 `/verbose`。

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

<Note>
写入前会验证配置；无效更改会被拒绝。`/config` 更新会在重启后保留。
</Note>

## MCP 更新

`/mcp` 会在 `mcp.servers` 下写入由 OpenClaw 管理的 MCP 服务器定义。仅限所有者。默认禁用；使用 `commands.mcp: true` 启用。

示例：

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` 将配置存储在 OpenClaw 配置中，而不是 Pi 所属的项目设置中。运行时适配器决定哪些传输协议实际可执行。
</Note>

## 插件更新

`/plugins` 允许操作员检查已发现的插件，并在配置中切换启用状态。只读流程可以使用 `/plugin` 作为别名。默认禁用；使用 `commands.plugins: true` 启用。

示例：

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` 和 `/plugins show` 会针对当前工作区以及磁盘上的配置执行真实的插件发现。
- `/plugins enable|disable` 只会更新插件配置；它不会安装或卸载插件。
- 启用/禁用更改后，请重启 Gateway 网关以应用它们。

</Note>

## 界面说明

<AccordionGroup>
  <Accordion title="每个界面的会话">
    - **文本命令**会在普通聊天会话中运行（私信共享 `main`，群组有自己的会话）。
    - **原生命令**使用隔离会话：
      - Discord：`agent:<agentId>:discord:slash:<userId>`
      - Slack：`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
      - Telegram：`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 定位聊天会话）
    - **`/stop`** 会定位到活动聊天会话，因此它可以中止当前运行。

  </Accordion>
  <Accordion title="Slack 细节">
    `channels.slack.slashCommand` 仍支持单个 `/openclaw` 风格命令。如果启用 `commands.native`，你必须为每个内置命令创建一个 Slack slash command（名称与 `/help` 相同）。Slack 的命令参数菜单会以临时 Block Kit 按钮形式发送。

    Slack 原生例外：注册 `/agentstatus`（而不是 `/status`），因为 Slack 保留了 `/status`。文本 `/status` 在 Slack 消息中仍然有效。

  </Accordion>
</AccordionGroup>

## BTW 旁路问题

`/btw` 是关于当前会话的快速**旁路问题**。

与普通聊天不同：

- 它使用当前会话作为背景上下文，
- 它作为单独的**无工具**一次性调用运行，
- 它不会改变未来的会话上下文，
- 它不会写入转录历史，
- 它会作为实时旁路结果发送，而不是普通助手消息。

这使得 `/btw` 在你想要临时澄清，同时让主任务继续进行时很有用。

示例：

```text
/btw what are we doing right now?
```

请参阅 [BTW 旁路问题](/zh-CN/tools/btw)，了解完整行为和客户端 UX 细节。

## 相关内容

- [创建 Skills](/zh-CN/tools/creating-skills)
- [Skills](/zh-CN/tools/skills)
- [Skills 配置](/zh-CN/tools/skills-config)
