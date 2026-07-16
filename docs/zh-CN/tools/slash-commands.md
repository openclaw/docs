---
read_when:
    - 使用或配置聊天命令
    - 调试命令路由或权限
    - 了解 Skills 命令的注册方式
sidebarTitle: Slash commands
summary: 所有可用的斜杠命令、指令和行内快捷方式——包括配置、路由和各界面的行为。
title: 斜杠命令
x-i18n:
    generated_at: "2026-07-16T11:58:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway 网关处理作为独立消息发送且以 `/` 开头的命令。
仅限主机的 bash 命令使用 `! <cmd>`（`/bash <cmd>` 是其别名）。

当对话绑定到 ACP 会话时，普通文本会路由到 ACP
harness。Gateway 网关管理命令仍在本地处理：`/acp ...` 始终会到达
OpenClaw 命令处理程序；只要该界面启用了命令处理，`/status` 和 `/unfocus` 也会始终在本地处理。

## 三种命令类型

<CardGroup cols={3}>
  <Card title="命令" icon="terminal">
    由 Gateway 网关处理的独立 `/...` 消息。必须作为消息中的
    唯一内容发送。
  </Card>
  <Card title="指令" icon="sliders">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、
    `/exec`、`/model`、`/queue` — 在模型看到消息前从中移除。单独发送时
    持久化会话设置；与其他文本一起发送时
    作为内联提示。
  </Card>
  <Card title="内联快捷方式" icon="bolt">
    `/help`、`/commands`、`/status`、`/whoami` — 立即运行，并在模型看到
    剩余文本前从中移除。仅限已授权的发送者。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="指令行为详情">
    - 指令会在模型看到消息前从中移除。
    - 在**仅含指令**的消息中（消息中只有指令），它们会
      持久化到会话，并回复确认信息。
    - 在包含其他文本的**普通聊天**消息中，它们充当内联提示，并且
      **不会**持久化会话设置。
    - 指令仅适用于**已授权的发送者**。如果设置了 `commands.allowFrom`，
      它将是唯一使用的允许列表；否则，授权来自
      渠道允许列表/配对以及 `commands.useAccessGroups`。对于未授权的
      发送者，指令会被视为纯文本。
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
  启用对聊天消息中 `/...` 的解析。在不支持原生命令的界面
  （WhatsApp、WebChat、Signal、iMessage、Google Chat、Microsoft Teams）上，即使设置为 `false`，
  文本命令仍然有效。
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  注册原生命令。自动模式：Discord/Telegram 开启；Slack 关闭；
  对不支持原生命令的提供商忽略。可通过
  `channels.<provider>.commands.native` 按渠道覆盖。在 Discord 上，`false` 会跳过斜杠命令
  注册；此前注册的命令可能会一直显示，直到被移除。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  在支持时将技能命令注册为原生命令。自动模式：
  Discord/Telegram 开启；Slack 关闭。可通过
  `channels.<provider>.commands.nativeSkills` 覆盖。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  启用 `! <cmd>` 以运行主机 shell 命令（`/bash <cmd>` 是其别名）。需要
  `tools.elevated` 允许列表。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash 切换到后台模式前等待的时长（`0` 会立即转入
  后台）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  启用 `/config`（读取/写入 `openclaw.json`）。仅限所有者。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  启用 `/mcp`（读取/写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 配置）。仅限所有者。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  启用 `/plugins`（插件发现/状态，以及安装和启用/禁用）。写入操作仅限所有者。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  启用 `/debug`（仅运行时的配置覆盖）。仅限所有者。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  启用 `/restart` 和外部 `SIGUSR1` 重启请求。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  所有者专用命令界面的显式所有者允许列表。与
  `commands.allowFrom` 和私信配对访问权限分开。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  按渠道设置：要求所有者专用命令具备所有者身份。当 `true` 时，
  发送者必须与 `commands.ownerAllowFrom` 匹配，或拥有内部 `operator.admin`
  权限范围。通配符 `allowFrom` 条目**并不足够**。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  控制所有者 ID 在系统提示词中的显示方式。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  当 `commands.ownerDisplay: "hash"` 时使用的 HMAC 密钥。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  用于命令授权的按提供商允许列表。配置后，它将成为命令和指令的
  **唯一**授权来源。使用 `"*"` 设置
  全局默认值；提供商专用键会覆盖它。
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  未设置 `commands.allowFrom` 时，对命令强制执行允许列表/策略。
</ParamField>

## 命令列表

命令来自三个来源：

- **核心内置命令：** `src/auto-reply/commands-registry.shared.ts`
- **生成的 dock 命令：** `src/auto-reply/commands-registry.data.ts`
- **插件命令：** 插件 `registerCommand()` 调用

可用性取决于配置标志、渠道界面以及已安装/启用的
插件。

### 核心命令

<AccordionGroup>
  <Accordion title="会话和运行">
    | 命令 | 说明 |
    | --- | --- |
    | `/new [model]` | 归档当前会话并启动一个新会话 |
    | `/reset [soft [message]]` | 原地重置当前会话。`soft` 会保留对话记录、丢弃复用的 CLI 后端会话 ID，并重新运行启动流程 |
    | `/name <title>` | 命名或重命名当前会话。省略标题可查看当前名称和建议名称 |
    | `/compact [instructions]` | 压缩会话上下文。参阅[压缩](/zh-CN/concepts/compaction) |
    | `/stop` | 中止当前运行 |
    | `/session idle <duration\|off>` | 管理线程绑定的空闲过期时间 |
    | `/session max-age <duration\|off>` | 管理线程绑定的最长存续期 |
    | `/export-session [path]` | 仅限所有者。在工作区内将当前会话导出为 HTML。别名：`/export` |
    | `/export-trajectory [path]` | 为当前会话导出 JSONL 轨迹包。别名：`/trajectory` |

    显式指定的 `/export-session` 路径会替换工作区内的现有文件。
    省略路径可生成避免名称冲突的文件名。

    <Note>
      Control UI 会拦截键入的 `/new`，以创建并切换到新的
      仪表板会话；但如果配置了 `session.dmScope: "main"`，
      且当前父会话是智能体的主会话，则 `/new`
      会原地重置主会话。键入的 `/reset` 仍会执行 Gateway 网关的
      原地重置。当你想清除固定的
      会话模型选择时，请使用 `/model default`。
    </Note>

  </Accordion>

  <Accordion title="模型和运行控制">
    | 命令 | 说明 |
    | --- | --- |
    | `/think <level\|default>` | 设置思考级别或清除会话覆盖。别名：`/thinking`、`/t` |
    | `/verbose on\|off\|full` | 切换详细输出。别名：`/v` |
    | `/trace on\|off` | 切换当前会话的插件跟踪输出 |
    | `/fast [status\|auto\|on\|off\|default]` | 显示、设置或清除快速模式 |
    | `/reasoning [on\|off\|stream]` | 切换推理可见性。别名：`/reason` |
    | `/elevated [on\|off\|ask\|full]` | 切换提升权限模式。别名：`/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | 显示或设置 Exec 默认值 |
    | `/login [codex\|openai\|openai-codex]` | 从私聊或 Web UI 会话配对 Codex/OpenAI 登录。仅限所有者/管理员 |
    | `/model [name\|#\|status]` | 显示或设置模型 |
    | `/models [provider] [page] [limit=<n>\|all]` | 列出已配置或身份验证可用的提供商或模型 |
    | `/queue <mode>` | 管理活动运行的队列行为。参阅[队列](/zh-CN/concepts/queue)和[队列引导](/zh-CN/concepts/queue-steering) |
    | `/steer <message>` | 将引导信息注入活动运行。别名：`/tell`。参阅 [Steer](/zh-CN/tools/steer) |

    <AccordionGroup>
      <Accordion title="详细输出 / 跟踪 / 快速模式 / 推理安全">
        - `/verbose` 用于调试 — 正常使用时请保持**关闭**。
        - `/trace` 仅显示插件自身的跟踪/调试行；普通的详细信息输出仍保持关闭。
        - `/fast auto|on|off` 会持久化会话覆盖；使用会话 UI 的 `inherit` 选项将其清除。
        - `/fast` 因提供商而异：OpenAI/Codex 将其映射到 `service_tier=priority`；直接 Anthropic 请求将其映射到 `service_tier=auto` 或 `standard_only`。
        - `/reasoning`、`/verbose` 和 `/trace` 在群组环境中存在风险 — 它们可能泄露内部推理或插件诊断信息。请在群聊中保持关闭。

      </Accordion>
      <Accordion title="模型切换详情">
        - `/model` 会立即将新模型持久化到会话。
        - 如果智能体处于空闲状态，下次运行会立即使用该模型。
        - 如果当前有活动运行，切换会被标记为待处理，并在下一个干净的重试点应用。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="设备发现和状态">
    | 命令 | 说明 |
    | --- | --- |
    | `/help` | 显示简短的帮助摘要 |
    | `/commands` | 显示生成的命令目录 |
    | `/tools [compact\|verbose]` | 显示当前智能体此刻可使用的内容 |
    | `/status` | 显示执行/运行时状态、Gateway 网关和系统运行时间、插件健康状况，以及提供商用量/配额 |
    | `/status plugins` | 显示详细的插件健康状况：加载错误、隔离状态、渠道插件故障、依赖问题、兼容性通知。需要 `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | 管理当前会话的持久[目标](/zh-CN/tools/goal) |
    | `/diagnostics [note]` | 仅限所有者的支持报告流程。每次都会请求 Exec 审批 |
    | `/openclaw <request>` | 从所有者私信运行 OpenClaw 设置和修复助手 |
    | `/tasks` | 列出当前会话的活动/近期后台任务 |
    | `/context [list\|detail\|map\|json]` | 说明上下文的组装方式 |
    | `/whoami` | 显示你的发送者 ID。别名：`/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 控制每次响应的用量页脚（`reset`/`inherit`/`clear`/`default` 会清除会话覆盖，以重新继承已配置的默认值），或输出本地成本摘要 |
  </Accordion>

  <Accordion title="Skills、允许列表和审批">
    | 命令 | 描述 |
    | --- | --- |
    | `/skill <name> [input]` | 按名称运行 Skills |
    | `/learn [request]` | 根据当前对话或指定来源，通过 [Skill Workshop](/zh-CN/tools/skill-workshop) 起草一个可供审查的 Skills |
    | `/allowlist [list\|add\|remove] ...` | 管理允许列表条目。仅限文本 |
    | `/approve <id> <decision>` | 处理 Exec 或插件审批提示 |
    | `/btw <question>` | 在不更改会话上下文的情况下询问附带问题。别名：`/side`。参见 [BTW](/zh-CN/tools/btw) |
  </Accordion>

  <Accordion title="子智能体和 ACP">
    | 命令 | 描述 |
    | --- | --- |
    | `/subagents list\|log\|info` | 检查当前会话的子智能体运行记录 |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | 管理 ACP 会话和运行时选项。运行时控制需要外部所有者身份或内部 Gateway 网关管理员身份 |
    | `/focus <target>` | 将当前 Discord 线程或 Telegram 话题绑定到会话目标 |
    | `/unfocus` | 移除当前线程绑定 |
    | `/agents` | 列出当前会话中绑定到线程的智能体 |
  </Accordion>

  <Accordion title="仅所有者可写和管理">
    | 命令 | 要求 | 描述 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | 读取或写入 `openclaw.json`。仅限所有者 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | 读取或写入 OpenClaw 管理的 MCP 服务器配置。仅限所有者 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | 检查或更改插件状态。写入仅限所有者。别名：`/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | 仅限运行时的配置覆盖。仅限所有者 |
    | `/restart` | `commands.restart: true`（默认） | 重启 OpenClaw |
    | `/send on\|off\|inherit` | 所有者 | 设置发送策略 |
  </Accordion>

  <Accordion title="语音、TTS 和渠道控制">
    | 命令 | 描述 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | 控制 TTS。参见 [TTS](/zh-CN/tools/tts) |
    | `/activation mention\|always` | 设置群组激活模式 |
    | `/bash <command>` | 运行主机 shell 命令。别名：`! <command>`。需要 `commands.bash: true` |
    | `!poll [sessionId]` | 检查后台 bash 任务 |
    | `!stop [sessionId]` | 停止后台 bash 任务 |
  </Accordion>
</AccordionGroup>

### 停靠命令

停靠命令将活动会话的回复路由切换到另一个已关联的渠道。
有关设置和故障排除，请参见[渠道停靠](/zh-CN/concepts/channel-docking)。

由支持原生命令的渠道插件生成：

- `/dock-discord`（别名：`/dock_discord`）
- `/dock-mattermost`（别名：`/dock_mattermost`）
- `/dock-slack`（别名：`/dock_slack`）
- `/dock-telegram`（别名：`/dock_telegram`）

停靠命令需要 `session.identityLinks`。来源发送者和目标对等方
必须位于同一身份组中。

### 内置插件命令

| 命令                                                 | 描述                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | 切换记忆 Dreaming（所有者或 Gateway 网关管理员）。参见 [Dreaming](/zh-CN/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | 管理设备配对。参见[配对](/zh-CN/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | 临时启用高风险节点命令（相机/屏幕/计算机/写入）。参见[计算机使用](/zh-CN/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | 管理 Talk 语音配置。Discord 原生名称：`/talkvoice`                                                                                                                                    |
| `/card ...`                                             | 发送 LINE 富卡片预设。参见 [LINE](/zh-CN/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | 绑定、引导和检查 Codex app-server harness（状态、线程、恢复、模型、快速模式、权限、压缩、审查、MCP、Skills 等）。参见 [Codex harness](/zh-CN/plugins/codex-harness) |

仅限 QQ Bot：`/bot-ping`、`/bot-version`、`/bot-help`、`/bot-upgrade`、`/bot-logs`

### Skills 命令

可由用户调用的 Skills 会公开为斜杠命令：

- `/skill <name> [input]` 始终可用作通用入口点。
- Skills 可以注册为直接命令（例如 OpenProse 的 `/prose`）。
- 原生 Skills 命令注册由 `commands.nativeSkills` 和
  `channels.<provider>.commands.nativeSkills` 控制。
- 名称会清理为 `a-z0-9_`（最多 32 个字符）；发生冲突时会添加数字后缀。

<AccordionGroup>
  <Accordion title="Skills 命令分派">
    默认情况下，Skills 命令会作为普通请求路由到模型。

    Skills 可以声明 `command-dispatch: tool`，以便直接路由到工具
    （确定性执行，不涉及模型）。示例：`/prose`（OpenProse 插件）
    — 参见 [OpenProse](/zh-CN/prose)。

  </Accordion>
  <Accordion title="原生命令参数">
    当省略必填参数时，Discord 对动态选项使用自动补全和按钮菜单。
    对于包含选项的命令，Telegram 和 Slack 会显示按钮菜单。
    动态选项根据目标会话模型解析，因此 `/think` 级别等模型
    特定选项会遵循会话的 `/model` 覆盖设置。
  </Accordion>
</AccordionGroup>

## `/tools`：智能体当前可以使用什么

`/tools` 回答的是一个运行时问题：**在当前
对话中，这个智能体现在可以使用什么**，而不是静态配置目录。

```text
/tools         # 紧凑视图
/tools verbose # 包含简短描述
```

结果以会话为作用域。更改智能体、渠道、线程、发送者
授权或模型都可能改变输出。要编辑配置文件和覆盖设置，
请使用 Control UI 的工具面板或配置界面。

## `/model`：模型选择

```text
/model             # 显示模型选择器
/model list        # 同上
/model 3           # 按选择器中的编号选择
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # 清除会话模型选择
/model status      # 包含端点和 API 模式的详细视图
```

在 Discord 上，`/model` 和 `/models` 会打开带有提供商和
模型下拉列表的交互式选择器。该选择器遵循 `agents.defaults.models`，包括
`provider/*` 条目。

## `/config`：磁盘配置写入

<Note>
  仅限所有者。默认禁用——通过 `commands.config: true` 启用。
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

配置会在写入前进行验证。无效更改会被拒绝。`/config`
更新在重启后仍会保留。

## `/mcp`：MCP 服务器配置

<Note>
  仅限所有者。默认禁用——通过 `commands.mcp: true` 启用。
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` 将配置存储在 OpenClaw 配置中，而不是嵌入式智能体的项目设置中。
`/mcp show` 会遮盖包含凭据的字段、可识别的凭据标志
值以及已知具有密钥形式的参数。从群组中运行时，
配置会私下发送给所有者；如果没有可用的所有者私聊路由，
命令会以安全方式失败，并要求所有者在私聊中重试。

## `/debug`：仅限运行时的覆盖设置

<Note>
  仅限所有者。默认禁用——通过 `commands.debug: true` 启用。
  覆盖设置会立即应用于新的配置读取，但**不会**写入磁盘。
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`：插件管理

<Note>
  写入仅限所有者。默认禁用——通过 `commands.plugins: true` 启用。
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` 会更新插件配置，并热重载 Gateway 网关
插件运行时，以供新的智能体轮次使用。`/plugins install` 会自动重启托管的
Gateway 网关，因为插件源模块已发生更改。受信任的 ClawHub
安装和官方目录安装无需额外确认。任意 npm、
git、归档、`npm-pack:` 和本地路径来源会显示来源警告，并且在你审查来源后，
需要在末尾添加 `--force`。此标志表示确认该来源，并允许
替换现有安装；它不会绕过 `security.installPolicy` 或安装程序的安全检查。
带有风险警告的 ClawHub 版本仍需要单独的仅限 shell 的
`--acknowledge-clawhub-risk` 标志。应用市场安装、链接安装和固定版本安装也
仍然只能通过 shell 执行。

## `/trace`：插件跟踪输出

```text
/trace          # 显示当前跟踪状态
/trace on
/trace off
```

`/trace` 会显示以会话为作用域的插件跟踪/调试行，而无需启用完整详细
模式。它不能替代 `/debug`（运行时覆盖设置）或 `/verbose`（普通
工具输出）。

## `/btw`：附带问题

`/btw` 用于快速询问有关当前会话上下文的附带问题。别名：`/side`。

```text
/btw 我们现在正在做什么？
/side 主运行继续期间发生了什么变化？
```

与普通消息不同：

- 使用当前会话作为背景上下文。
- 在 Codex harness 会话中，作为临时 Codex 旁路线程运行。
- **不会**更改未来的会话上下文。
- 不会写入会话记录历史。

有关完整行为，请参见 [BTW 附带问题](/zh-CN/tools/btw)。

## 界面说明

<AccordionGroup>
  <Accordion title="各界面的会话作用域">
    - **文本命令：**在普通聊天会话中运行（私信共享 `main`，群组拥有各自的会话）。
    - **Discord 原生命令：**`agent:<agentId>:discord:slash:<userId>`
    - **Slack 原生命令：**`agent:<agentId>:slack:slash:<userId>`（可通过 `channels.slack.slashCommand.sessionPrefix` 配置前缀）
    - **Telegram 原生命令：**`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 定位聊天会话）
    - **`/login codex`** 仅通过私聊或 Web UI 响应路径发送设备配对码。Telegram 群组/话题中的调用会要求所有者改为私信机器人。
    - **`/stop`** 以活动聊天会话为目标，用于中止当前运行。

  </Accordion>
  <Accordion title="Slack 详情">
    `channels.slack.slashCommand` 支持单个 `/openclaw` 风格的命令。
    使用 `commands.native: true` 时，请为每个内置命令创建一个 Slack 斜杠命令。
    注册 `/agentstatus`（而不是 `/status`），因为 Slack 保留了
    `/status`。文本 `/status` 在 Slack 消息中仍然有效。
  </Accordion>
  <Accordion title="快速路径和内联快捷方式">
    - 来自允许列表中发送者的纯命令消息会立即处理（绕过队列和模型）。
    - 内联快捷方式（`/help`、`/commands`、`/status`、`/whoami`）也可以嵌入普通消息中，并会在模型看到剩余文本之前被移除。
    - 未经授权的纯命令消息会被静默忽略；内联 `/...` 词元会被视为纯文本。

  </Accordion>
  <Accordion title="参数说明">
    - 命令与参数之间可以包含可选的 `:`（`/think: high`、`/send: on`）。
    - `/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配）；如果没有匹配项，该文本将被视为消息正文。
    - `/allowlist add|remove` 需要 `commands.config: true`，并遵循渠道 `configWrites`。

  </Accordion>
</AccordionGroup>

## 提供商用量和状态

- 启用用量跟踪后，当前模型提供商的**提供商用量/配额**（例如“Claude 剩余 80%”）会显示在 `/status` 中。
- 当实时会话快照信息不足时，`/status` 中的**词元/缓存行**可以回退到最新的转录用量条目。
- **执行与运行时：**`/status` 会报告有效沙箱路径的 `Execution`，以及会话的运行者 `Runtime`：`OpenClaw Default`、`OpenAI Codex`、CLI 后端或 ACP 后端。
- **每次响应的词元数/成本：**由 `/usage off|tokens|full` 控制。
- `/model status` 涉及模型、身份验证和端点，而非用量。

## 相关内容

<CardGroup cols={2}>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="puzzle-piece">
    Skill 斜杠命令的注册和限制方式。
  </Card>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    构建一个注册自身斜杠命令的 Skill。
  </Card>
  <Card title="BTW" href="/zh-CN/tools/btw" icon="comments">
    在不更改会话上下文的情况下提出附带问题。
  </Card>
  <Card title="Steer" href="/zh-CN/tools/steer" icon="compass">
    在智能体运行过程中使用 `/steer` 进行引导。
  </Card>
</CardGroup>
