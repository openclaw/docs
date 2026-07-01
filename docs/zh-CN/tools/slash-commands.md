---
read_when:
    - 使用或配置聊天命令
    - 调试命令路由或权限
    - 了解技能命令是如何注册的
sidebarTitle: Slash commands
summary: 所有可用的斜杠命令、指令和内联快捷方式 —— 配置、路由以及按界面的行为。
title: 斜杠命令
x-i18n:
    generated_at: "2026-07-01T20:12:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway 网关会处理以 `/` 开头、作为独立消息发送的命令。
仅主机 bash 命令使用 `! <cmd>`（`/bash <cmd>` 作为别名）。

当对话绑定到 ACP 会话时，普通文本会路由到 ACP 运行框架。
Gateway 网关管理命令仍保留在本地：`/acp ...` 始终会到达
OpenClaw 命令处理程序；只要该界面启用了命令处理，`/status` 和
`/unfocus` 也会保留在本地。

## 三种命令类型

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    由 Gateway 网关处理的独立 `/...` 消息。必须作为消息中的唯一内容发送。
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、
    `/exec`、`/model`、`/queue`——会在模型看到消息前从消息中剥离。
    单独发送时会持久化会话设置；与其他文本一起发送时作为内联提示生效。
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`、`/commands`、`/status`、`/whoami`——立即运行，并在模型看到剩余文本前被剥离。
    仅限已授权发送者。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - 指令会在模型看到消息前从消息中剥离。
    - 在**仅指令**消息中（消息只包含指令），它们会持久化到会话，并回复确认。
    - 在包含其他文本的**普通聊天**消息中，它们作为内联提示生效，并且**不会**持久化会话设置。
    - 指令仅适用于**已授权发送者**。如果设置了 `commands.allowFrom`，
      它就是唯一使用的允许列表；否则授权来自渠道允许列表/配对以及
      `commands.useAccessGroups`。未授权发送者的指令会按纯文本处理。
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
  启用聊天消息中的 `/...` 解析。在没有原生命令的界面上
  （WhatsApp、WebChat、Signal、iMessage、Google Chat、Microsoft Teams），即使设置为 `false`，
  文本命令也会工作。
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  注册原生命令。自动：Discord/Telegram 开启；Slack 关闭；
  对没有原生支持的提供商忽略。可用
  `channels.<provider>.commands.native` 按渠道覆盖。在 Discord 上，`false` 会跳过斜杠命令注册；
  之前注册的命令可能会一直可见，直到被移除。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  在支持时以原生方式注册 Skills 命令。自动：Discord/Telegram 开启；
  Slack 关闭。可用 `channels.<provider>.commands.nativeSkills` 覆盖。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  启用 `! <cmd>` 来运行主机 shell 命令（`/bash <cmd>` 别名）。需要
  `tools.elevated` 允许列表。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash 在切换到后台模式前等待的时长（`0` 表示立即转入后台）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  启用 `/config`（读取/写入 `openclaw.json`）。仅限所有者。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  启用 `/mcp`（读取/写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 配置）。仅限所有者。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  启用 `/plugins`（插件发现/状态，以及安装 + 启用/禁用）。写入仅限所有者。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  启用 `/debug`（仅运行时配置覆盖）。仅限所有者。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  启用 `/restart` 和 Gateway 网关重启工具操作。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  用于仅所有者命令界面的显式所有者允许列表。独立于
  `commands.allowFrom` 和私信配对访问。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  按渠道：仅所有者命令需要所有者身份。当为 `true` 时，
  发送者必须匹配 `commands.ownerAllowFrom`，或持有内部 `operator.admin`
  作用域。通配符 `allowFrom` 条目**不足以**满足要求。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  控制所有者 ID 在系统提示中的显示方式。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  当 `commands.ownerDisplay: "hash"` 时使用的 HMAC 密钥。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  按提供商配置的命令授权允许列表。配置后，它就是命令和指令的
  **唯一**授权来源。使用 `"*"` 作为全局默认值；提供商专用键会覆盖它。
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  当未设置 `commands.allowFrom` 时，对命令强制执行允许列表/策略。
</ParamField>

## 命令列表

命令来自三个来源：

- **核心内置项：** `src/auto-reply/commands-registry.shared.ts`
- **生成的 dock 命令：** `src/auto-reply/commands-registry.data.ts`
- **插件命令：** 插件 `registerCommand()` 调用

可用性取决于配置标志、渠道界面，以及已安装/启用的插件。

### 核心命令

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | 命令 | 说明 |
    | --- | --- |
    | `/new [model]` | 归档当前会话并启动一个新会话 |
    | `/reset [soft [message]]` | 就地重置当前会话。`soft` 会保留转录内容，丢弃复用的 CLI 后端会话 ID，并重新运行启动流程 |
    | `/name <title>` | 命名或重命名当前会话。省略标题可查看当前名称和建议 |
    | `/compact [instructions]` | 压缩会话上下文。参见[压缩](/zh-CN/concepts/compaction) |
    | `/stop` | 中止当前运行 |
    | `/session idle <duration\|off>` | 管理线程绑定的空闲过期时间 |
    | `/session max-age <duration\|off>` | 管理线程绑定的最大生命周期过期时间 |
    | `/export-session [path]` | 将当前会话导出为 HTML。别名：`/export` |
    | `/export-trajectory [path]` | 为当前会话导出 JSONL 轨迹包。别名：`/trajectory` |

    <Note>
      Control UI 会拦截输入的 `/new`，以创建并切换到新的 dashboard 会话；
      但当配置了 `session.dmScope: "main"` 且当前父级是智能体的主会话时除外，
      这种情况下 `/new` 会就地重置主会话。输入的 `/reset` 仍会运行 Gateway 网关的就地重置。
      当你想清除固定的会话模型选择时，请使用 `/model default`。
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | 命令 | 说明 |
    | --- | --- |
    | `/think <level\|default>` | 设置思考级别，或清除会话覆盖。别名：`/thinking`、`/t` |
    | `/verbose on\|off\|full` | 切换详细输出。别名：`/v` |
    | `/trace on\|off` | 切换当前会话的插件 trace 输出 |
    | `/fast [status\|auto\|on\|off\|default]` | 显示、设置或清除快速模式 |
    | `/reasoning [on\|off\|stream]` | 切换推理可见性。别名：`/reason` |
    | `/elevated [on\|off\|ask\|full]` | 切换提升权限模式。别名：`/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | 显示或设置 exec 默认值 |
    | `/login [codex\|openai\|openai-codex]` | 从私聊或 Web UI 会话配对 Codex/OpenAI 登录。仅限所有者/管理员 |
    | `/model [name\|#\|status]` | 显示或设置模型 |
    | `/models [provider] [page] [limit=<n>\|all]` | 列出已配置/有可用凭证的提供商或模型 |
    | `/queue <mode>` | 管理活动运行的队列行为。参见[队列](/zh-CN/concepts/queue)和[队列 Steering](/zh-CN/concepts/queue-steering) |
    | `/steer <message>` | 向活动运行注入指导。别名：`/tell`。参见 [Steer](/zh-CN/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` 用于调试——正常使用时保持**关闭**。
        - `/trace` 只会显示插件拥有的 trace/debug 行；普通详细杂讯仍保持关闭。
        - `/fast auto|on|off` 会持久化会话覆盖；使用 Sessions UI 的 `inherit` 选项清除它。
        - `/fast` 是提供商特定的：OpenAI/Codex 会将其映射为 `service_tier=priority`；直接 Anthropic 请求会将其映射为 `service_tier=auto` 或 `standard_only`。
        - `/reasoning`、`/verbose` 和 `/trace` 在群组场景中有风险——它们可能暴露内部推理或插件诊断信息。在群聊中保持关闭。

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` 会立即将新模型持久化到会话。
        - 如果智能体处于空闲状态，下一次运行会立即使用它。
        - 如果有运行正在活动中，切换会标记为待处理，并在下一个干净的重试点应用。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | 命令 | 说明 |
    | --- | --- |
    | `/help` | 显示简短帮助摘要 |
    | `/commands` | 显示生成的命令目录 |
    | `/tools [compact\|verbose]` | 显示当前智能体此刻可用的内容 |
    | `/status` | 显示执行/运行时状态、Gateway 网关和系统运行时间、插件健康状况，以及提供商使用量/配额 |
    | `/status plugins` | 显示详细插件健康状况：加载错误、隔离、渠道故障、依赖问题、兼容性通知 |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | 管理当前会话的持久[目标](/zh-CN/tools/goal) |
    | `/diagnostics [note]` | 仅所有者支持报告流程。每次都会请求 exec 审批 |
    | `/crestodian <request>` | 从所有者私信运行 Crestodian 设置和修复助手 |
    | `/tasks` | 列出当前会话的活动/近期后台任务 |
    | `/context [list\|detail\|map\|json]` | 说明上下文如何组装 |
    | `/whoami` | 显示你的发送者 ID。别名：`/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 控制每条响应的用量页脚（`reset`/`inherit`/`clear`/`default` 会清除会话覆盖，以重新继承已配置默认值），或打印本地成本摘要 |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | 命令 | 说明 |
    | --- | --- |
    | `/skill <name> [input]` | 按名称运行一个 Skills |
    | `/allowlist [list\|add\|remove] ...` | 管理允许列表条目。仅文本 |
    | `/approve <id> <decision>` | 处理 exec 或插件审批提示 |
    | `/btw <question>` | 提出一个不会改变会话上下文的附带问题。别名：`/side`。参见 [BTW](/zh-CN/tools/btw) |
  </Accordion>

  <Accordion title="子智能体和 ACP">
    | 命令 | 描述 |
    | --- | --- |
    | `/subagents list\|log\|info` | 查看当前会话的子智能体运行 |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | 管理 ACP 会话和运行时选项。运行时控制需要外部所有者或内部 Gateway 网关管理员身份 |
    | `/focus <target>` | 将当前 Discord 线程或 Telegram 主题绑定到会话目标 |
    | `/unfocus` | 移除当前线程绑定 |
    | `/agents` | 列出当前会话中绑定到线程的智能体 |
  </Accordion>

  <Accordion title="仅所有者写入和管理">
    | 命令 | 要求 | 描述 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | 读取或写入 `openclaw.json`。仅所有者 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | 读取或写入 OpenClaw 管理的 MCP 服务器配置。仅所有者 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | 查看或变更插件状态。写入仅限所有者。别名：`/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | 仅运行时配置覆盖。仅所有者 |
    | `/restart` | `commands.restart: true`（默认） | 重启 OpenClaw |
    | `/send on\|off\|inherit` | 所有者 | 设置发送策略 |
  </Accordion>

  <Accordion title="语音、TTS、渠道控制">
    | 命令 | 描述 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | 控制 TTS。见 [TTS](/zh-CN/tools/tts) |
    | `/activation mention\|always` | 设置群组激活模式 |
    | `/bash <command>` | 运行主机 shell 命令。别名：`! <command>`。需要 `commands.bash: true` |
    | `!poll [sessionId]` | 检查后台 bash 任务 |
    | `!stop [sessionId]` | 停止后台 bash 任务 |
  </Accordion>
</AccordionGroup>

### Dock 命令

Dock 命令会将活动会话的回复路由切换到另一个已链接渠道。
关于设置和故障排除，见 [渠道停靠](/zh-CN/concepts/channel-docking)。

由支持本生命令的渠道插件生成：

- `/dock-discord`（别名：`/dock_discord`）
- `/dock-mattermost`（别名：`/dock_mattermost`）
- `/dock-slack`（别名：`/dock_slack`）
- `/dock-telegram`（别名：`/dock_telegram`）

Dock 命令需要 `session.identityLinks`。来源发送者和目标对等方
必须位于同一身份组中。

### 内置插件命令

| 命令                                                                                         | 描述                                                                                   |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | 切换记忆 Dreaming（所有者或 Gateway 网关管理员）。见 [Dreaming](/zh-CN/concepts/dreaming)    |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | 管理设备配对。见 [配对](/zh-CN/channels/pairing)                                             |
| `/phone status\|arm ...\|disarm`                                                             | 临时启用高风险手机节点命令                                                             |
| `/voice status\|list\|set <voiceId>`                                                         | 管理 Talk 语音配置。Discord 本机名称：`/talkvoice`                                     |
| `/card ...`                                                                                  | 发送 LINE 富卡片预设。见 [LINE](/zh-CN/channels/line)                                        |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | 控制 Codex 应用服务器 harness。见 [Codex harness](/zh-CN/plugins/codex-harness)              |

仅 QQ Bot：`/bot-ping`、`/bot-version`、`/bot-help`、`/bot-upgrade`、`/bot-logs`

### 技能命令

用户可调用的 Skills 会作为斜杠命令暴露：

- `/skill <name> [input]` 始终可作为通用入口点使用。
- Skills 可以注册为直接命令（例如 OpenProse 的 `/prose`）。
- 本机技能命令注册由 `commands.nativeSkills` 和
  `channels.<provider>.commands.nativeSkills` 控制。
- 名称会清理为 `a-z0-9_`（最多 32 个字符）；冲突会获得数字后缀。

<AccordionGroup>
  <Accordion title="技能命令分发">
    默认情况下，技能命令会作为普通请求路由到模型。

    Skills 可以声明 `command-dispatch: tool`，以便直接路由到工具
    （确定性，无模型参与）。示例：`/prose`（OpenProse 插件）
    — 见 [OpenProse](/zh-CN/prose)。

  </Accordion>
  <Accordion title="本生命令参数">
    Discord 会在省略必需参数时，对动态选项和按钮菜单使用自动补全。
    Telegram 和 Slack 会为带有选项的命令显示按钮菜单。
    动态选项会根据目标会话模型解析，因此像 `/think` 级别这样的模型特定选项会遵循会话的 `/model` 覆盖。
  </Accordion>
</AccordionGroup>

## `/tools` — 当前智能体可以使用什么

`/tools` 回答一个运行时问题：**此智能体在当前
对话中现在可以使用什么** — 而不是静态配置目录。

```text
/tools         # compact view
/tools verbose # with short descriptions
```

结果限定在会话范围内。更改智能体、渠道、线程、发送者授权或模型都可能改变输出。若要编辑配置文件和覆盖项，请使用 Control UI 工具面板或配置界面。

## `/model` — 模型选择

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，其中包含提供商和
模型下拉框。该选择器遵循 `agents.defaults.models`，包括
`provider/*` 条目。

## `/config` — 磁盘上的配置写入

<Note>
  仅所有者。默认禁用 — 使用 `commands.config: true` 启用。
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

写入前会验证配置。无效更改会被拒绝。`/config`
更新会在重启后保持。

## `/mcp` — MCP 服务器配置

<Note>
  仅所有者。默认禁用 — 使用 `commands.mcp: true` 启用。
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` 会将配置存储在 OpenClaw 配置中，而不是嵌入式智能体项目设置中。

## `/debug` — 仅运行时覆盖

<Note>
  仅所有者。默认禁用 — 使用 `commands.debug: true` 启用。
  覆盖会立即应用于新的配置读取，但**不会**写入磁盘。
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — 插件管理

<Note>
  写入仅限所有者。默认禁用 — 使用 `commands.plugins: true` 启用。
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` 会更新插件配置，并为新的智能体轮次热重载 Gateway 网关
插件运行时。`/plugins install` 会自动重启托管的
Gateway 网关，因为插件源模块发生了变化。

## `/trace` — 插件跟踪输出

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` 会显示会话范围的插件跟踪/调试行，而无需完整详细
模式。它不会替代 `/debug`（运行时覆盖）或 `/verbose`（普通
工具输出）。

## `/btw` — 旁支问题

`/btw` 是关于当前会话上下文的快速旁支问题。别名：`/side`。

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

与普通消息不同：

- 使用当前会话作为背景上下文。
- 在 Codex harness 会话中，作为临时 Codex 旁支线程运行。
- **不会**改变未来的会话上下文。
- 不会写入转录历史。

完整行为见 [BTW 旁支问题](/zh-CN/tools/btw)。

## 界面说明

<AccordionGroup>
  <Accordion title="按界面划分的会话范围">
    - **文本命令：**在普通聊天会话中运行（私信共享 `main`，群组有自己的会话）。
    - **本机 Discord 命令：**`agent:<agentId>:discord:slash:<userId>`
    - **本机 Slack 命令：**`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
    - **本机 Telegram 命令：**`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 指向聊天会话）
    - **`/login codex`** 只通过私聊或 Web UI 响应路径发送设备配对码。Telegram 群组/主题调用会要求所有者改为私信该 bot。
    - **`/stop`** 指向活动聊天会话，以中止当前运行。

  </Accordion>
  <Accordion title="Slack 细节">
    `channels.slack.slashCommand` 支持单个 `/openclaw` 风格命令。
    当 `commands.native: true` 时，为每个内置
    命令创建一个 Slack 斜杠命令。注册 `/agentstatus`（而不是 `/status`），因为 Slack 保留
    `/status`。文本 `/status` 在 Slack 消息中仍然有效。
  </Accordion>
  <Accordion title="快速路径和内联快捷方式">
    - 来自允许列表发送者的纯命令消息会立即处理（绕过队列和模型）。
    - 内联快捷方式（`/help`、`/commands`、`/status`、`/whoami`）也可以嵌入普通消息中，并会在模型看到剩余文本之前被剥离。
    - 未授权的纯命令消息会被静默忽略；内联 `/...` token 会被视为纯文本。

  </Accordion>
  <Accordion title="参数说明">
    - 命令接受命令和参数之间可选的 `:`（`/think: high`、`/send: on`）。
    - `/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配）；如果没有匹配，文本会被视为消息正文。
    - `/allowlist add|remove` 需要 `commands.config: true`，并遵循渠道 `configWrites`。

  </Accordion>
</AccordionGroup>

## 提供商用量和状态

- **提供商用量/配额**（例如，“Claude 剩余 80%”）会在启用用量跟踪时，针对当前模型提供商显示在 `/status` 中。
- `/status` 中的 **token/缓存行** 可在实时会话快照稀疏时回退到最新的转录用量条目。
- **执行与运行时：**`/status` 会为有效沙箱路径报告 `Execution`，并为运行会话的一方报告 `Runtime`：`OpenClaw Default`、`OpenAI Codex`、CLI 后端或 ACP 后端。
- **每次响应的 token/成本：**由 `/usage off|tokens|full` 控制。
- `/model status` 关注模型/认证/端点，而不是用量。

## 相关

<CardGroup cols={2}>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="puzzle-piece">
    技能斜杠命令如何注册和门控。
  </Card>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    构建一个注册自己斜杠命令的技能。
  </Card>
  <Card title="BTW" href="/zh-CN/tools/btw" icon="comments">
    不改变会话上下文的旁支问题。
  </Card>
  <Card title="Steer" href="/zh-CN/tools/steer" icon="compass">
    在运行中使用 `/steer` 引导智能体。
  </Card>
</CardGroup>
