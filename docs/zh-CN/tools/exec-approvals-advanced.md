---
read_when:
    - 配置安全二进制目录或自定义安全二进制目录配置文件
    - 将审批转发到 Slack/Discord/Telegram 或其他聊天渠道
    - 为渠道实现原生审批客户端
summary: 高级 Exec 审批：安全二进制文件、解释器绑定、审批转发、原生交付
title: Exec 审批 — 高级
x-i18n:
    generated_at: "2026-07-05T11:44:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c3a4934b87c7b20f27439239bd1e02e7bcbd137b72624720da6aeb25dadc952
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

高级 Exec 审批主题：`safeBins` 快速路径、解释器/运行时绑定，以及将审批转发到聊天渠道（包括原生投递）。关于核心策略和审批流程，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

## 安全二进制（仅 stdin）

`tools.exec.safeBins` 指定**仅 stdin** 的二进制文件（例如 `cut`），它们可以在允许列表模式下运行，**无需**显式允许列表条目。安全二进制会拒绝位置文件参数和类似路径的令牌，因此只能处理传入流。请将其视为流过滤器的窄快速路径，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果命令按设计可以求值代码、执行子命令或读取文件，请优先使用显式允许列表条目，并保持审批提示启用。自定义安全二进制必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置文件。
</Warning>

默认安全二进制：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用，请为它们的非 stdin 工作流保留显式允许列表条目。对于安全二进制模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置模式形式会被拒绝，因此文件操作数不能作为有歧义的位置参数被夹带。

### Argv 校验和拒绝的标志

校验只根据 argv 形状确定（不检查主机文件系统是否存在），这会防止允许/拒绝差异造成文件存在性预言机行为。默认安全二进制会拒绝面向文件的选项；长选项按失败关闭方式校验（未知标志和有歧义的缩写会被拒绝）。

按安全二进制配置文件列出的拒绝标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二进制还会强制 argv 令牌在执行时被视为**字面文本**（不进行 glob 展开，也不展开 `$VARS`），适用于仅 stdin 片段，因此 `*` 或 `$HOME/...` 等模式不能用于夹带文件读取。`awk` 和 `sed` 始终会被拒绝作为安全二进制（其语义无法校验为仅 stdin）；`jq` 可以选择启用，但 OpenClaw 仍会在安全二进制模式下拒绝 `env` 风格的过滤器（例如 `jq env` 或 `jq -n env`），因此 `jq` 不能在没有显式允许列表路径或审批提示的情况下转储主机进程环境。

### 受信任的二进制目录

安全二进制必须从受信任的二进制目录解析（系统默认值加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目从不会自动受信任。默认受信任目录刻意保持最小：`/bin`、`/usr/bin`。如果你的安全二进制可执行文件位于包管理器/用户路径中（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 链接、包装器和多路复用器

当每个顶层片段都满足允许列表（包括安全二进制或 Skills 自动允许）时，允许 Shell 链接（`&&`、`||`、`;`）。允许列表模式仍不支持重定向。命令替换（`$()` / 反引号）会在允许列表解析期间被拒绝，包括在双引号内部；如果需要字面 `$()` 文本，请使用单引号。

在 macOS 配套应用审批中，包含 Shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 Shell 文本会被视为允许列表未命中，除非 Shell 二进制本身已列入允许列表。

对于 Shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围的环境覆盖会缩减为一个小型显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

对于允许列表模式中的 `allow-always` 决策，透明分发包装器（例如 `env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）会以相同方式为 Shell 小程序（`sh`、`ash` 等）解包。如果包装器或多路复用器无法安全解包，则不会自动持久化允许列表条目。

如果你将 `python3` 或 `node` 等解释器加入允许列表，建议使用 `tools.exec.strictInlineEval=true`，以便内联求值仍然需要显式审批。在严格模式下，`allow-always` 仍可持久化良性的解释器/脚本调用，但内联求值载体不会自动持久化。

### 安全二进制与允许列表

| 主题 | `tools.exec.safeBins` | 允许列表（`exec-approvals.json`） |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目标 | 自动允许窄 stdin 过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名称 + 安全二进制 argv 策略 | 已解析的可执行文件路径 glob，或通过 PATH 调用命令的裸命令名 glob |
| 参数范围 | 受安全二进制配置文件和字面令牌规则限制 | 默认按路径匹配；可选 `argPattern` 可限制已解析的 argv |
| 常见示例 | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, 自定义 CLI |
| 最佳用途 | 管道中的低风险文本转换 | 任何行为或副作用更广的工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按 Agent 配置的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按 Agent 配置的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按 Agent 配置的 `agents.list[].tools.exec.safeBinProfiles`）。按 Agent 配置的配置文件键会覆盖全局键。
- 允许列表条目位于主机本地审批文件的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器/运行时二进制出现在 `safeBins` 中但没有显式配置文件时，`openclaw security audit` 会以 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以将缺失的自定义 `safeBinProfiles.<bin>` 条目搭建为 `{}`（之后请审查并收紧）。解释器/运行时二进制不会自动搭建。

自定义配置文件示例：
__OC_I18N_900000__
## 解释器/运行时命令

基于审批的解释器/运行时运行有意保持保守：

- 始终绑定精确的 argv/cwd/env 上下文。
- 直接 Shell 脚本和直接运行时文件形式会尽力绑定到一个具体本地文件快照。
- 仍会解析到一个直接本地文件的常见包管理器包装器形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前解包。
- 如果 OpenClaw 无法为解释器/运行时命令识别出恰好一个具体本地文件（例如包脚本、eval 形式、运行时特定加载器链，或有歧义的多文件形式），基于审批的执行会被拒绝，而不是声称拥有实际上没有的语义覆盖。
- 对于这些工作流，请优先使用沙箱隔离、单独的主机边界，或显式受信任的允许列表/完整工作流，由操作员接受更广泛的运行时语义。

需要审批时，Exec 工具会立即返回一个审批 ID。使用该 ID 关联后续已审批运行的系统事件（`Exec finished`，以及配置时的 `Exec running`）。如果超时前没有决策到达，请求会被视为审批超时，并作为终端主机命令拒绝呈现。对于带来源会话的主 Agent 异步审批，OpenClaw 还会用内部后续消息恢复该会话，让智能体观察到命令未运行，而不是稍后修复缺失结果。待处理的 Exec 审批默认在 30 分钟后过期。

### 后续投递行为

已审批的异步 Exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 轮次。被拒绝的异步审批会使用相同的主会话后续路径传递拒绝状态，但不会注册提升权限的运行时交接，也不会运行命令。没有可恢复主会话的拒绝会被抑制，或在存在安全直接路径时通过该路径报告。

- 如果存在有效的外部投递目标（可投递渠道加目标 `to`），后续投递会使用该渠道。
- 在仅 webchat 或没有外部目标的内部会话流程中，后续投递保持仅会话（`deliver: false`）。
- 如果调用方显式请求严格外部投递但没有可解析的外部渠道，请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析外部渠道，投递会降级为仅会话，而不是失败。

## 将审批转发到聊天渠道

你可以将 Exec 审批提示转发到任意聊天渠道（包括插件渠道），并用 `/approve` 批准。这会使用普通的出站投递流水线。

配置：
__OC_I18N_900001__
在聊天中回复：
__OC_I18N_900002__
`/approve` 命令同时处理 Exec 审批和插件审批。如果 ID 不匹配待处理的 Exec 审批，它会自动改为检查插件审批。此回退仅限于“找不到审批”失败；真实的 Exec 审批拒绝/错误不会静默重试为插件审批。

### 插件审批转发

插件审批转发使用与 Exec 审批相同的投递流水线，但在 `approvals.plugin` 下有自己的独立配置。启用或禁用其中一个不会影响另一个。关于插件编写行为、请求字段和决策语义，请参阅 [插件权限请求](/plugins/plugin-permission-requests)。
__OC_I18N_900003__
配置形状与 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的工作方式相同。

支持共享交互式回复的渠道会为 Exec 和插件审批渲染相同的审批按钮。没有共享交互式 UI 的渠道会回退为带 `/approve` 说明的纯文本。插件审批请求可以限制可用决策：审批界面使用请求声明的决策集，并且 Gateway 网关会拒绝提交未提供的决策。

### 任意渠道上的同一聊天审批

当 exec 或插件审批请求来自可投递聊天界面时，默认情况下，同一个聊天可以使用 `/approve` 批准它。这适用于 Slack、Matrix、Microsoft Teams 以及类似的可投递聊天，也适用于现有的 Web UI 和终端 UI 流程，并使用该对话的常规渠道认证模型。如果来源聊天已经可以发送命令并接收回复，审批请求就不再需要单独的原生投递适配器来保持待处理状态。

Discord、Telegram 和 QQ Bot 也支持同一聊天中的 `/approve`，但即使禁用了原生审批投递，这些渠道仍使用其解析出的审批人列表进行授权。

### 原生审批投递

某些渠道也可以充当原生审批客户端：Discord、Slack、Telegram、Matrix 和 QQ Bot。原生客户端会在共享的同一聊天 `/approve` 流程之上，增加审批人私信、来源聊天扇出以及特定渠道的交互式审批 UX。

当原生审批卡片/按钮可用时，该原生 UI 是面向智能体的主要路径。除非工具结果说明聊天审批不可用，或手动审批是唯一剩余路径，否则智能体不应同时回显重复的纯聊天 `/approve` 命令。

如果配置了原生审批客户端，但来源渠道没有活跃的原生运行时，OpenClaw 会保持本地确定性的 `/approve` 提示可见。如果原生运行时处于活跃状态并尝试投递，但没有任何目标收到卡片，OpenClaw 会发送一条同一聊天回退通知，其中包含确切的 `/approve <id> <decision>` 命令，以便请求仍可被处理。

通用模型：

- 主机 exec 策略仍决定是否需要 exec 审批
- `approvals.exec` 控制将审批提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制是否启用 Discord、Slack、Telegram、QQ Bot 以及类似的渠道特定原生客户端
- 当请求来自 Slack 且 Slack 插件审批人可解析时，Slack 插件审批可以使用 Slack 的原生审批客户端；即使 Slack exec 审批被禁用，`approvals.plugin` 也可以将插件审批路由到 Slack 会话或目标
- Google Chat 原生审批卡片会处理来自 Google Chat 空间或线程的 exec 和插件审批，前提是稳定的 `users/<id>` 审批人可从 `dm.allowFrom` 或 `defaultTo` 解析；它们不使用表情回应事件来做决定
- WhatsApp 和 Signal 表情回应审批投递受 `approvals.exec` 和 `approvals.plugin` 控制；它们没有 `channels.<channel>.execApprovals` 配置块

当以下条件全部为真时，原生审批客户端会自动启用私信优先投递：

- 渠道支持原生审批投递
- 审批人可以从显式 `execApprovals.approvers` 或所有者身份（例如 `commands.ownerAllowFrom`）解析
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

设置 `enabled: false` 可显式禁用原生审批客户端。设置 `enabled: true` 可在审批人可解析时强制启用它。公开的来源聊天投递仍通过 `channels.<channel>.execApprovals.target` 显式配置。当原生 `target` 启用来源聊天投递时，审批提示会包含命令文本。

常见问题：[为什么聊天审批有两套 exec 审批配置？](/help/faq-first-run)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`
- QQ Bot：`channels.qqbot.execApprovals.*`
- Google Chat：使用 `channels.googlechat.dm.allowFrom` 或 `channels.googlechat.defaultTo` 配置稳定审批人；不需要 `execApprovals` 配置块
- WhatsApp：使用 `approvals.exec` 和 `approvals.plugin` 将审批提示路由到 WhatsApp
- Signal：使用 `approvals.exec` 和 `approvals.plugin` 将审批提示路由到 Signal

原生客户端特定路由：

- Telegram 默认使用审批人私信（`target: "dm"`）。切换为 `channel` 或 `both`，也会在来源 Telegram 聊天/话题中显示审批提示。对于 Telegram 论坛话题，OpenClaw 会为审批提示和审批后的后续消息保留该话题。
- Discord 和 Telegram 审批人可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断；只有解析出的审批人可以批准或拒绝。
- Slack 审批人可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断。Slack 插件审批私信使用来自 `allowFrom` 和账户默认路由的 Slack 插件审批人，而不是 Slack exec 审批人。Slack 原生按钮会保留审批 ID 类型，因此 `plugin:` ID 可以解析插件审批，而不需要第二层 Slack 本地回退。
- Google Chat 原生卡片会在消息文本中保留手动 `/approve` 回退，但卡片按钮回调只携带不透明的操作令牌；审批 ID 和决定会从服务端待处理状态中恢复。
- WhatsApp 表情符号审批仅在匹配的顶层转发族已启用且路由到 WhatsApp 时处理 exec 和插件提示；仅目标 WhatsApp 转发会继续走共享转发路径，除非它匹配相同的原生来源目标。
- Signal 表情回应审批仅在匹配的顶层转发族已启用且路由到 Signal 时处理 exec 和插件提示。直接同一聊天 Signal exec 审批可以在没有显式审批人的情况下抑制本地 `/approve` 回退；Signal 表情回应解析仍需要来自 `channels.signal.allowFrom` 或 `defaultTo` 的显式 Signal 审批人。
- Matrix 原生私信/渠道路由和表情回应快捷操作会处理 exec 和插件审批；插件授权仍来自 `channels.matrix.dm.allowFrom`。Matrix 原生提示会在第一个提示事件上包含 `com.openclaw.approval` 自定义事件内容，以便支持 OpenClaw 的 Matrix 客户端读取结构化审批状态，而标准客户端仍保留纯文本 `/approve` 回退。
- 原生 Discord 审批按钮按审批 ID 类型路由：`plugin:` ID 直接进入插件审批，其他所有 ID 进入 exec 审批。原生 Telegram 审批按钮遵循与 `/approve` 相同的有界 exec 到插件回退。
- 请求者不需要是审批人。
- 如果没有任何操作员 UI 或已配置的审批客户端可以接受请求，提示会回退到 `askFallback`。

敏感的仅所有者群组命令（例如 `/diagnostics` 和 `/export-trajectory`）会对审批提示和最终结果使用私有所有者路由。OpenClaw 首先会尝试在所有者运行命令的同一界面上使用私有路由。如果该界面没有私有所有者路由，则会回退到 `commands.ownerAllowFrom` 中第一个可用的所有者路由，因此当 Telegram 是配置的主要私有界面时，Discord 群组命令仍可将审批和结果发送到所有者的 Telegram 私信。群聊只会收到一条简短确认。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ Bot](/channels/qqbot)

### macOS IPC 流程
__OC_I18N_900004__
安全说明：

- Unix socket 模式 `0600`，令牌存储在 `exec-approvals.json` 中。
- 同 UID 对端检查。
- 挑战/响应（nonce + HMAC 令牌 + 请求哈希）+ 短 TTL。

## 常见问题

### 什么时候会在审批目标上使用 `accountId` 和 `threadId`？

当渠道配置了多个身份，并且审批提示必须通过某个特定账户发出时，使用 `accountId`。当目标支持话题或线程，并且提示应留在该线程中而不是顶层聊天中时，使用 `threadId`。

一个具体的 Telegram 场景是带论坛话题的运维超级群组，并配置了两个 Telegram Bot 账户。`to` 值指定超级群组，`accountId` 选择 Bot 账户，`threadId` 选择论坛话题：
__OC_I18N_900005__
通过该设置，转发的 exec 审批会由 `ops-bot` Telegram 账户发布到聊天 `-1001234567890` 的话题 `77` 中。没有 `accountId` 的目标会使用渠道的默认账户，没有 `threadId` 的目标会发布到顶层目标。

### 当审批发送到会话时，该会话中的任何人都能批准吗？

不能。会话投递只控制提示出现在哪里。它本身不会授权该聊天中的每个参与者批准。

对于通用的同一聊天 `/approve`，发送者必须已经在该渠道会话中获得命令授权。如果渠道暴露了显式审批人，这些审批人可以授权 `/approve` 操作，即使他们在该会话中没有其他命令授权。

某些渠道更严格。Discord、Telegram、Matrix、Slack 原生审批私信以及类似的原生审批客户端会使用其解析出的审批人列表进行审批授权。例如，Telegram 论坛话题审批提示可以对话题中的所有人可见，但只有从 `channels.telegram.execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出的数字 Telegram 用户 ID 可以批准或拒绝它。

## 相关

- [Exec 审批](/zh-CN/tools/exec-approvals) — 核心策略和审批流程
- [Exec 工具](/zh-CN/tools/exec)
- [提升权限模式](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills) — 由技能支持的自动允许行为
