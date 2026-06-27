---
read_when:
    - 使用或配置聊天命令
    - 调试命令路由或权限
    - 了解技能命令的注册方式
sidebarTitle: Slash commands
summary: 所有可用的斜杠命令、指令和行内快捷方式——配置、路由以及按界面的行为。
title: 斜杠命令
x-i18n:
    generated_at: "2026-06-27T03:32:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway 网关会处理作为独立消息发送、并以 `/` 开头的命令。
仅主机 bash 命令使用 `! <cmd>`（`/bash <cmd>` 是它的别名）。

当会话绑定到 ACP 会话时，普通文本会路由到 ACP
harness。Gateway 网关管理命令仍保持本地处理：`/acp ...` 始终会到达
OpenClaw 命令处理器，并且只要该表面的命令处理已启用，`/status` 和 `/unfocus` 就会保持本地处理。

## 三种命令类型

<CardGroup cols={3}>
  <Card title="命令" icon="terminal">
    由 Gateway 网关处理的独立 `/...` 消息。必须作为消息中的唯一内容发送。
  </Card>
  <Card title="指令" icon="sliders">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、
    `/exec`、`/model`、`/queue` — 会在模型看到消息之前从消息中移除。
    单独发送时会持久化会话设置；与其他文本一起发送时会作为行内提示生效。
  </Card>
  <Card title="行内快捷方式" icon="bolt">
    `/help`、`/commands`、`/status`、`/whoami` — 会立即运行，并在模型看到剩余文本之前被移除。仅限已授权发送者。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="指令行为详情">
    - 指令会在模型看到消息之前从消息中移除。
    - 在**仅指令**消息中（消息只有指令），它们会持久化到会话并回复确认。
    - 在包含其他文本的**普通聊天**消息中，它们会作为行内提示生效，且**不会**持久化会话设置。
    - 指令仅适用于**已授权发送者**。如果设置了 `commands.allowFrom`，它就是唯一使用的允许列表；否则授权来自频道允许列表/配对以及 `commands.useAccessGroups`。未授权发送者的指令会被当作纯文本处理。
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
  启用对聊天消息中 `/...` 的解析。在没有原生命令的表面
  （WhatsApp、WebChat、Signal、iMessage、Google Chat、Microsoft Teams）上，
  即使设置为 `false`，文本命令也能工作。
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  注册原生命令。自动模式：对 Discord/Telegram 开启；对 Slack 关闭；
  对不支持原生命令的提供商忽略。可用
  `channels.<provider>.commands.native` 按频道覆盖。在 Discord 上，`false` 会跳过斜杠命令注册；先前注册的命令可能会保持可见，直到被移除。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  在受支持时原生注册 Skills 命令。自动模式：对
  Discord/Telegram 开启；对 Slack 关闭。可用
  `channels.<provider>.commands.nativeSkills` 覆盖。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  启用 `! <cmd>` 来运行主机 shell 命令（`/bash <cmd>` 别名）。需要
  `tools.elevated` 允许列表。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash 在切换到后台模式前等待的时长（`0` 表示立即后台运行）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  启用 `/config`（读取/写入 `openclaw.json`）。仅限所有者。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  启用 `/mcp`（读取/写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 配置）。仅限所有者。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  启用 `/plugins`（插件发现/状态以及安装 + 启用/禁用）。写入操作仅限所有者。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  启用 `/debug`（仅运行时配置覆盖）。仅限所有者。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  启用 `/restart` 和 Gateway 网关重启工具操作。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  面向仅所有者命令表面的显式所有者允许列表。独立于
  `commands.allowFrom` 和私信配对访问。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  按频道设置：要求仅所有者命令具备所有者身份。当为 `true` 时，
  发送者必须匹配 `commands.ownerAllowFrom` 或持有内部 `operator.admin`
  范围。通配符 `allowFrom` 条目**不足够**。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  控制所有者 ID 在系统提示词中的显示方式。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  当 `commands.ownerDisplay: "hash"` 时使用的 HMAC 密钥。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  用于命令授权的按提供商允许列表。配置后，它就是命令和指令的
  **唯一**授权来源。使用 `"*"` 作为全局默认值；提供商专用键会覆盖它。
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  在未设置 `commands.allowFrom` 时，为命令强制执行允许列表/策略。
</ParamField>

## 命令列表

命令来自三个来源：

- **核心内置命令：** `src/auto-reply/commands-registry.shared.ts`
- **生成的 dock 命令：** `src/auto-reply/commands-registry.data.ts`
- **插件命令：** 插件 `registerCommand()` 调用

可用性取决于配置标志、频道表面以及已安装/已启用的
插件。

### 核心命令

<AccordionGroup>
  <Accordion title="会话和运行">
    | 命令 | 描述 |
    | --- | --- |
    | `/new [model]` | 归档当前会话并启动一个新会话 |
    | `/reset [soft [message]]` | 原地重置当前会话。`soft` 会保留转录内容、丢弃复用的 CLI 后端会话 ID，并重新运行启动流程 |
    | `/name <title>` | 命名或重命名当前会话。省略标题可查看当前名称和一个建议 |
    | `/compact [instructions]` | 压缩会话上下文。参见 [压缩](/zh-CN/concepts/compaction) |
    | `/stop` | 中止当前运行 |
    | `/session idle <duration\|off>` | 管理线程绑定的空闲过期 |
    | `/session max-age <duration\|off>` | 管理线程绑定的最长存活时间过期 |
    | `/export-session [path]` | 将当前会话导出为 HTML。别名：`/export` |
    | `/export-trajectory [path]` | 为当前会话导出 JSONL 轨迹包。别名：`/trajectory` |

    <Note>
      Control UI 会拦截键入的 `/new`，用于创建并切换到新的
      dashboard 会话；但当配置了 `session.dmScope: "main"` 且当前父级是智能体的主会话时除外，此时 `/new`
      会原地重置主会话。键入的 `/reset` 仍会运行 Gateway 网关的
      原地重置。当你想清除固定的会话模型选择时，请使用 `/model default`。
    </Note>

  </Accordion>

  <Accordion title="模型和运行控制">
    | 命令 | 描述 |
    | --- | --- |
    | `/think <level\|default>` | 设置思考级别或清除会话覆盖。别名：`/thinking`、`/t` |
    | `/verbose on\|off\|full` | 切换详细输出。别名：`/v` |
    | `/trace on\|off` | 切换当前会话的插件跟踪输出 |
    | `/fast [status\|auto\|on\|off\|default]` | 显示、设置或清除快速模式 |
    | `/reasoning [on\|off\|stream]` | 切换推理可见性。别名：`/reason` |
    | `/elevated [on\|off\|ask\|full]` | 切换提升权限模式。别名：`/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | 显示或设置 exec 默认值 |
    | `/model [name\|#\|status]` | 显示或设置模型 |
    | `/models [provider] [page] [limit=<n>\|all]` | 列出已配置/有可用凭证的提供商或模型 |
    | `/queue <mode>` | 管理活跃运行队列行为。参见 [队列](/zh-CN/concepts/queue) 和 [队列 Steering](/zh-CN/concepts/queue-steering) |
    | `/steer <message>` | 向活跃运行注入指导。别名：`/tell`。参见 [Steer](/zh-CN/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning 安全性">
        - `/verbose` 用于调试 — 正常使用时保持**关闭**。
        - `/trace` 只会显示插件拥有的跟踪/调试行；普通详细杂讯仍保持关闭。
        - `/fast auto|on|off` 会持久化会话覆盖；使用会话 UI 的 `inherit` 选项来清除它。
        - `/fast` 依赖提供商：OpenAI/Codex 会将它映射到 `service_tier=priority`；直接 Anthropic 请求会将它映射到 `service_tier=auto` 或 `standard_only`。
        - `/reasoning`、`/verbose` 和 `/trace` 在群组设置中有风险 — 它们可能暴露内部推理或插件诊断信息。在群聊中请保持关闭。

      </Accordion>
      <Accordion title="模型切换详情">
        - `/model` 会立即把新模型持久化到会话。
        - 如果智能体空闲，下一次运行会立刻使用它。
        - 如果有运行处于活跃状态，切换会被标记为待处理，并在下一个干净的重试点应用。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="设备发现和状态">
    | 命令 | 描述 |
    | --- | --- |
    | `/help` | 显示简短帮助摘要 |
    | `/commands` | 显示生成的命令目录 |
    | `/tools [compact\|verbose]` | 显示当前智能体现在可以使用什么 |
    | `/status` | 显示执行/运行时状态、Gateway 网关和系统正常运行时间、插件健康状态，以及提供商使用量/配额 |
    | `/status plugins` | 显示详细插件健康状态：加载错误、隔离、频道故障、依赖问题、兼容性通知 |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | 管理当前会话的持久 [目标](/zh-CN/tools/goal) |
    | `/diagnostics [note]` | 仅所有者支持报告流程。每次都会请求 exec 审批 |
    | `/crestodian <request>` | 从所有者私信运行 Crestodian 设置和修复助手 |
    | `/tasks` | 列出当前会话的活跃/近期后台任务 |
    | `/context [list\|detail\|map\|json]` | 解释上下文如何组装 |
    | `/whoami` | 显示你的发送者 ID。别名：`/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 控制每次响应的使用量页脚（`reset`/`inherit`/`clear`/`default` 会清除会话覆盖，以重新继承已配置的默认值）或打印本地成本摘要 |
  </Accordion>

  <Accordion title="Skills、允许列表、审批">
    | 命令 | 描述 |
    | --- | --- |
    | `/skill <name> [input]` | 按名称运行 Skill |
    | `/allowlist [list\|add\|remove] ...` | 管理允许列表条目。仅文本 |
    | `/approve <id> <decision>` | 处理 exec 或插件审批提示 |
    | `/btw <question>` | 在不更改会话上下文的情况下询问一个旁支问题。别名：`/side`。参见 [BTW](/zh-CN/tools/btw) |
  </Accordion>

  <Accordion title="子智能体和 ACP">
    | 命令 | 描述 |
    | --- | --- |
    | `/subagents list\|log\|info` | 检查当前会话的子智能体运行 |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | 管理 ACP 会话和运行时选项 |
    | `/focus <target>` | 将当前 Discord 线程或 Telegram 话题绑定到会话目标 |
    | `/unfocus` | 移除当前线程绑定 |
    | `/agents` | 列出当前会话中绑定到线程的智能体 |
  </Accordion>

  <Accordion title="仅所有者写入和管理">
    | 命令 | 要求 | 描述 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | 读取或写入 `openclaw.json`。仅所有者 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | 读取或写入由 OpenClaw 管理的 MCP 服务器配置。仅所有者 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | 检查或变更插件状态。写入仅限所有者。别名：`/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | 仅运行时配置覆盖。仅所有者 |
    | `/restart` | `commands.restart: true`（默认） | 重启 OpenClaw |
    | `/send on\|off\|inherit` | 所有者 | 设置发送策略 |
  </Accordion>

  <Accordion title="语音、TTS、渠道控制">
    | 命令 | 描述 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | 控制 TTS。参见 [TTS](/zh-CN/tools/tts) |
    | `/activation mention\|always` | 设置群组激活模式 |
    | `/bash <command>` | 运行主机 shell 命令。别名：`! <command>`。要求 `commands.bash: true` |
    | `!poll [sessionId]` | 检查后台 bash 作业 |
    | `!stop [sessionId]` | 停止后台 bash 作业 |
  </Accordion>
</AccordionGroup>

### 停靠命令

停靠命令会将活动会话的回复路由切换到另一个已链接的渠道。
设置和故障排除请参见[频道停靠](/zh-CN/concepts/channel-docking)。

由支持原生命令的渠道插件生成：

- `/dock-discord`（别名：`/dock_discord`）
- `/dock-mattermost`（别名：`/dock_mattermost`）
- `/dock-slack`（别名：`/dock_slack`）
- `/dock-telegram`（别名：`/dock_telegram`）

停靠命令要求 `session.identityLinks`。源发送者和目标对等端
必须位于同一个身份组中。

### 内置插件命令

| 命令                                                                                         | 描述                                                                            |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | 切换记忆 Dreaming。参见 [Dreaming](/zh-CN/concepts/dreaming)                          |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | 管理设备配对。参见 [配对](/zh-CN/channels/pairing)                                    |
| `/phone status\|arm ...\|disarm`                                                             | 临时启用高风险电话节点命令                                                      |
| `/voice status\|list\|set <voiceId>`                                                         | 管理 Talk 语音配置。Discord 原生名称：`/talkvoice`                              |
| `/card ...`                                                                                  | 发送 LINE 富卡片预设。参见 [LINE](/zh-CN/channels/line)                               |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | 控制 Codex 应用服务器 harness。参见 [Codex harness](/zh-CN/plugins/codex-harness)     |

仅 QQ Bot：`/bot-ping`、`/bot-version`、`/bot-help`、`/bot-upgrade`、`/bot-logs`

### Skill 命令

用户可调用的 Skills 会作为斜杠命令公开：

- `/skill <name> [input]` 始终可用，作为通用入口点。
- Skills 可以注册为直接命令（例如 OpenProse 的 `/prose`）。
- 原生 Skill 命令注册由 `commands.nativeSkills` 和
  `channels.<provider>.commands.nativeSkills` 控制。
- 名称会被清理为 `a-z0-9_`（最多 32 个字符）；冲突时会追加数字后缀。

<AccordionGroup>
  <Accordion title="Skill 命令分发">
    默认情况下，Skill 命令会像普通请求一样路由到模型。

    Skills 可以声明 `command-dispatch: tool`，以直接路由到工具
    （确定性，无模型参与）。示例：`/prose`（OpenProse 插件）
    — 参见 [OpenProse](/zh-CN/prose)。

  </Accordion>
  <Accordion title="原生命令参数">
    Discord 会在省略必需参数时，对动态选项和按钮菜单使用自动补全。
    Telegram 和 Slack 会为带有选项的命令显示按钮菜单。动态选项会按目标会话模型解析，因此像 `/think` 级别这样的模型特定选项会跟随会话的 `/model` 覆盖。
  </Accordion>
</AccordionGroup>

## `/tools` — 智能体现在可用的内容

`/tools` 回答的是运行时问题：**这个智能体现在在这段
对话中能使用什么**，而不是静态配置目录。

```text
/tools         # compact view
/tools verbose # with short descriptions
```

结果限定在会话范围内。更改智能体、渠道、线程、发送者
授权或模型都可能改变输出。要编辑配置文件和覆盖项，
请使用 Control UI 的工具面板或配置界面。

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

在 Discord 中，`/model` 和 `/models` 会打开一个带有提供商和
模型下拉菜单的交互式选择器。该选择器遵循 `agents.defaults.models`，
包括 `provider/*` 条目。

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

配置会在写入前验证。无效更改会被拒绝。`/config`
更新会在重启后保留。

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

`/mcp` 会将配置存储在 OpenClaw 配置中，而不是嵌入式智能体的项目设置中。

## `/debug` — 仅运行时覆盖

<Note>
  仅所有者。默认禁用 — 使用 `commands.debug: true` 启用。
  覆盖会立即应用到新的配置读取，但**不会**写入磁盘。
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
插件运行时。`/plugins install` 会自动重启受管理的
Gateway 网关，因为插件源模块已更改。

## `/trace` — 插件 trace 输出

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` 会显示会话范围内的插件 trace/debug 行，而不启用完整详细
模式。它不会取代 `/debug`（运行时覆盖）或 `/verbose`（普通
工具输出）。

## `/btw` — 旁路问题

`/btw` 是关于当前会话上下文的快速旁路问题。别名：`/side`。

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

与普通消息不同：

- 使用当前会话作为背景上下文。
- 在 Codex harness 会话中，作为临时 Codex 旁路线程运行。
- **不会**更改未来的会话上下文。
- 不会写入转录历史。

完整行为请参见 [BTW 旁路问题](/zh-CN/tools/btw)。

## 界面说明

<AccordionGroup>
  <Accordion title="按界面划分的会话范围">
    - **文本命令：**在普通聊天会话中运行（私信共享 `main`，群组拥有自己的会话）。
    - **Discord 原生命令：**`agent:<agentId>:discord:slash:<userId>`
    - **Slack 原生命令：**`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
    - **Telegram 原生命令：**`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 定位到聊天会话）
    - **`/stop`** 定位到活动聊天会话，以中止当前运行。

  </Accordion>
  <Accordion title="Slack 特定说明">
    `channels.slack.slashCommand` 支持单个 `/openclaw` 风格的命令。
    使用 `commands.native: true` 时，为每个内置
    命令创建一个 Slack 斜杠命令。注册 `/agentstatus`（不是 `/status`），因为 Slack 保留了
    `/status`。文本 `/status` 在 Slack 消息中仍然可用。
  </Accordion>
  <Accordion title="快速路径和内联快捷方式">
    - 来自允许列表发送者的纯命令消息会立即处理（绕过队列 + 模型）。
    - 内联快捷方式（`/help`、`/commands`、`/status`、`/whoami`）也可以嵌入普通消息中，并会在模型看到剩余文本前被移除。
    - 未授权的纯命令消息会被静默忽略；内联 `/...` 标记会被视为纯文本。

  </Accordion>
  <Accordion title="参数说明">
    - 命令和参数之间可接受可选的 `:`（`/think: high`、`/send: on`）。
    - `/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配）；如果没有匹配，文本会被视为消息正文。
    - `/allowlist add|remove` 要求 `commands.config: true`，并遵循渠道 `configWrites`。

  </Accordion>
</AccordionGroup>

## 提供商用量和状态

- **提供商用量/配额**（例如，“Claude 剩余 80%”）会在启用用量跟踪时，针对当前模型提供商显示在 `/status` 中。
- **Token/缓存行**在 `/status` 中可在实时会话快照较稀疏时，回退到最新的转录用量条目。
- **执行 vs 运行时：**`/status` 会针对有效沙箱路径报告 `Execution`，并针对运行会话的一方报告 `Runtime`：`OpenClaw Default`、`OpenAI Codex`、CLI 后端或 ACP 后端。
- **每次响应的 token/成本：**由 `/usage off|tokens|full` 控制。
- `/model status` 关注的是模型/认证/端点，而不是用量。

## 相关

<CardGroup cols={2}>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="puzzle-piece">
    Skill 斜杠命令如何注册和设门控。
  </Card>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    构建一个会注册自身斜杠命令的 Skill。
  </Card>
  <Card title="BTW" href="/zh-CN/tools/btw" icon="comments">
    不更改会话上下文的旁路问题。
  </Card>
  <Card title="Steer" href="/zh-CN/tools/steer" icon="compass">
    使用 `/steer` 在运行中途引导智能体。
  </Card>
</CardGroup>
