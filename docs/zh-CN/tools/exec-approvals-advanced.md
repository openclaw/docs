---
read_when:
    - 配置安全二进制文件或自定义安全二进制文件配置文件
    - 将审批转发到 Slack、Discord、Telegram 或其他聊天渠道
    - 为渠道实现原生审批客户端
summary: 高级 Exec 审批：安全二进制文件、解释器绑定、审批转发、原生交付
title: Exec 审批 — 高级配置
x-i18n:
    generated_at: "2026-07-12T14:48:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

高级 Exec 审批主题：`safeBins` 快速路径、解释器/运行时绑定，以及将审批转发到聊天渠道（包括原生投递）。
有关核心策略和审批流程，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

## 安全二进制文件（仅限 stdin）

`tools.exec.safeBins` 指定**仅限 stdin** 的二进制文件（例如 `cut`），这些文件在允许列表模式下运行时**不需要**显式允许列表条目。安全二进制文件会拒绝位置文件参数和类似路径的令牌，因此它们只能处理传入流。应将其视为流过滤器的窄范围快速路径，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果命令按设计能够求值代码、执行子命令或读取文件，请优先使用显式允许列表条目，并保持启用审批提示。自定义安全二进制文件必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置文件。
</Warning>

默认安全二进制文件：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`、`uniq`、`head`、`tail`、`tr`、`wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果选择启用，请为其非 stdin 工作流保留显式允许列表条目。对于安全二进制文件模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；系统会拒绝位置模式形式，防止文件操作数伪装成含义不明确的位置参数。

### Argv 验证和拒绝的标志

验证仅根据 argv 结构以确定性方式执行（不检查主机文件系统中是否存在相应文件），从而防止通过允许/拒绝结果差异探测文件是否存在。默认安全二进制文件会拒绝面向文件的选项；长选项采用失败关闭验证（拒绝未知标志和含义不明确的缩写）。默认二进制文件中已识别的只读布尔标志（例如 `wc -l`、`tr -d`、`uniq -c`）会被接受，而未识别的短标志仍会失败关闭，并转入手动审批。

各安全二进制文件配置文件拒绝的标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`：`--dereference-recursive`、`--directories`、`--exclude-from`、`--file`、`--recursive`、`-R`、`-d`、`-f`、`-r`
- `jq`：`--argfile`、`--from-file`、`--library-path`、`--rawfile`、`--slurpfile`、`-L`、`-f`
- `sort`：`--compress-program`、`--files0-from`、`--output`、`--random-source`、`--temporary-directory`、`-T`、`-o`
- `tail`：`--follow`、`--retry`、`-F`、`-f`
- `wc`：`--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二进制文件还会在执行仅限 stdin 的片段时，强制将 argv 令牌视为**字面文本**（不执行通配符展开，也不展开 `$VARS`），因此无法利用 `*` 或 `$HOME/...` 等模式偷渡文件读取。`awk`、`sed` 和 `jq` 始终不得用作安全二进制文件，因为无法验证其语义是否仅限 stdin：`jq` 可以读取环境数据，并从模块或启动文件加载 jq 代码。对于这些工具，请使用显式允许列表条目或审批提示，而不是 `safeBins`。

### 受信任的二进制文件目录

安全二进制文件必须从受信任的二进制文件目录解析（系统默认目录以及可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会被自动信任。默认受信任目录有意保持最小范围：`/bin`、`/usr/bin`。如果你的安全二进制可执行文件位于包管理器/用户路径中（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将其显式添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 链式调用、包装器和多路复用器

当每个顶层片段都满足允许列表要求（包括安全二进制文件或 Skills 自动允许）时，可以使用 Shell 链式调用（`&&`、`||`、`;`）。允许列表模式仍不支持重定向。允许列表解析期间会拒绝命令替换（`$()` / 反引号），包括双引号内的命令替换；如果需要字面量 `$()` 文本，请使用单引号。

在 macOS 配套应用审批中，包含 Shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 Shell 文本会被视为未命中允许列表，除非 Shell 二进制文件本身已加入允许列表。

对于 Shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的环境变量覆盖会被缩减为一个小型显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

在允许列表模式下做出 `allow-always` 决定时，透明调度包装器（例如 `env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）中的 Shell 小程序（`sh`、`ash` 等）也会以相同方式解除包装。如果无法安全地解除包装器或多路复用器，则不会自动持久化允许列表条目。

如果将 `python3` 或 `node` 等解释器加入允许列表，建议使用 `tools.exec.strictInlineEval=true`，确保内联求值仍需显式审批。在严格模式下，`allow-always` 仍可持久化无害的解释器/脚本调用，但不会自动持久化内联求值载体。

### 安全二进制文件与允许列表的对比

| 主题             | `tools.exec.safeBins`                                  | 允许列表（`exec-approvals.json`）                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目标             | 自动允许窄范围的 stdin 过滤器                          | 显式信任特定可执行文件                                                             |
| 匹配类型         | 可执行文件名称 + 安全二进制文件 argv 策略             | 已解析可执行文件路径 glob，或通过 PATH 调用的命令所使用的裸命令名称 glob           |
| 参数范围         | 受安全二进制文件配置文件和字面令牌规则限制             | 默认按路径匹配；可选的 `argPattern` 可限制解析后的 argv                            |
| 典型示例         | `head`、`tail`、`tr`、`wc`                             | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI                                     |
| 最佳用途         | 流水线中的低风险文本转换                               | 任何行为范围更广或具有副作用的工具                                                 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体配置的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体配置的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体配置的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体配置的配置文件键会覆盖全局键。
- 允许列表条目位于主机本地审批文件的 `agents.<id>.allowlist` 下（也可通过 Control UI / `openclaw approvals allowlist ...` 管理）。
- 当解释器/运行时二进制文件出现在 `safeBins` 中但没有显式配置文件时，`openclaw security audit` 会以 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以将缺失的自定义 `safeBinProfiles.<bin>` 条目搭建为 `{}`（之后请审查并收紧配置）。解释器/运行时二进制文件不会被自动搭建。

自定义配置文件示例：
__OC_I18N_900000__
## 解释器/运行时命令

由审批支持的解释器/运行时执行有意采取保守策略：

- 始终绑定确切的 argv/cwd/env 上下文。
- 直接 Shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地文件快照。
- 对仍能解析到单个直接本地文件的常见包管理器包装器形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`），会先解除包装再进行绑定。
- 如果 OpenClaw 无法为解释器/运行时命令准确识别唯一一个具体本地文件（例如包脚本、求值形式、运行时特定的加载器链或含义不明确的多文件形式），由审批支持的执行会被拒绝，而不会声称具备实际并不存在的语义覆盖范围。
- 对于这些工作流，请优先使用沙箱隔离、独立的主机边界，或由操作员接受更广泛运行时语义的显式受信任允许列表/完整工作流。

需要审批时，Exec 工具会立即返回一个审批 ID。使用该 ID 关联之后已批准执行的系统事件（`Exec finished`，以及配置后出现的 `Exec running`）。如果在超时前未收到决定，该请求会被视为审批超时，并作为终止性的主机命令拒绝呈现。对于具有来源会话的主智能体异步审批，OpenClaw 还会通过内部后续消息恢复该会话，使智能体得知命令未执行，而不是稍后尝试修复缺失的结果。默认情况下，待处理的 Exec 审批会在 30 分钟后过期。

### 后续消息投递行为

批准的异步 Exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 轮次。被拒绝的异步审批会使用同一个主会话后续消息路径传递拒绝状态，但不会注册提升权限的运行时交接，也不会运行命令。对于没有可恢复主会话的拒绝，如果存在安全的直接路由，则会通过该路由报告；否则会被抑制。

- 如果存在有效的外部投递目标（可投递渠道以及目标 `to`），后续消息会使用该渠道投递。
- 在仅限 Webchat 或没有外部目标的内部会话流程中，后续消息仅在会话内投递（`deliver: false`）。
- 如果调用方显式请求严格外部投递，但无法解析外部渠道，请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析外部渠道，则投递会降级为仅限会话，而不是失败。

## 将审批转发到聊天渠道

你可以将 Exec 审批提示转发到任何聊天渠道（包括插件渠道），并使用 `/approve` 批准。这会使用常规出站投递流水线。

配置：
__OC_I18N_900001__
在聊天中回复：
__OC_I18N_900002__
`/approve` 命令同时处理 Exec 审批和插件审批。如果 ID 与任何待处理的 Exec 审批均不匹配，它会自动改为检查插件审批。此回退仅限于“找不到审批”的失败情况；真正的 Exec 审批拒绝/错误不会静默重试为插件审批。

### 插件审批转发

插件审批转发与 Exec 审批使用相同的投递流水线，但在 `approvals.plugin` 下拥有独立配置。启用或禁用其中一个不会影响另一个。有关插件编写行为、请求字段和决定语义，请参阅[插件权限请求](/plugins/plugin-permission-requests)。
__OC_I18N_900003__
其配置结构与 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的工作方式完全一致。

支持共享交互式回复的渠道会为 Exec 审批和插件审批呈现相同的审批按钮。不支持共享交互式 UI 的渠道会回退到纯文本 `/approve` 指令。插件审批请求可能会限制可用的决定：审批界面使用请求声明的决定集，而 Gateway 网关会拒绝提交未提供的决定。

### 任何渠道中的同一聊天审批

当 Exec 或插件审批请求源自可投递的聊天界面时，默认可以在同一聊天中使用 `/approve` 进行审批。除了现有的 Web UI 和终端 UI 流程外，这也适用于 Slack、Matrix、Microsoft Teams 以及类似的可投递聊天，并使用该会话的常规渠道身份验证模型。如果来源聊天已经能够发送命令和接收回复，审批请求不再仅仅为了保持待处理状态而需要单独的原生投递适配器。

Discord、Telegram 和 QQ Bot 也支持同一聊天中的 `/approve`，但即使禁用了原生审批投递，这些渠道仍使用其解析出的审批人列表进行授权。

### 原生审批投递

某些渠道还可以充当原生审批客户端：Discord、Slack、Telegram、Matrix 和 QQ Bot。除了共享的同一聊天 `/approve` 流程外，原生客户端还会添加审批人私信、来源聊天扇出以及特定于渠道的交互式审批体验。

当原生审批卡片/按钮可用时，该原生 UI 是面向智能体的主要路径。除非工具结果表明聊天审批不可用，或手动审批是唯一剩余路径，否则智能体不应再重复发送纯聊天 `/approve` 命令。

如果配置了原生审批客户端，但来源渠道没有处于活动状态的原生运行时，OpenClaw 会继续显示本地确定性的 `/approve` 提示。如果原生运行时处于活动状态并尝试投递，但没有任何目标收到卡片，OpenClaw 会在同一聊天中发送回退通知，其中包含准确的 `/approve <id> <decision>` 命令，以便仍可处理该请求。

通用模型：

- 主机 Exec 策略仍决定是否需要 Exec 审批
- `approvals.exec` 控制是否将审批提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制是否启用 Discord、Slack、Telegram、QQ Bot 及类似的特定渠道原生客户端
- 当请求来自 Slack 且能够解析 Slack 插件审批人时，Slack 插件审批可以使用 Slack 的原生审批客户端；即使禁用了 Slack Exec 审批，`approvals.plugin` 也可以将插件审批路由到 Slack 会话或目标
- 当能够从 `dm.allowFrom` 或 `defaultTo` 解析出稳定的 `users/<id>` 审批人时，Google Chat 原生审批卡片会处理源自 Google Chat 空间或话题串的 Exec 和插件审批；它们不使用表情回应事件作出决定
- WhatsApp 和 Signal 的表情回应审批投递受 `approvals.exec` 和 `approvals.plugin` 控制；它们没有 `channels.<channel>.execApprovals` 配置块

当以下所有条件均成立时，原生审批客户端会自动启用私信优先投递：

- 渠道支持原生审批投递
- 可以从显式的 `execApprovals.approvers` 或 `commands.ownerAllowFrom` 等所有者身份中解析审批人
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

设置 `enabled: false` 可显式禁用原生审批客户端。设置 `enabled: true` 可在解析出审批人时强制启用。公开的来源聊天投递仍需通过 `channels.<channel>.execApprovals.target` 显式配置。当原生 `target` 启用来源聊天投递时，审批提示会包含命令文本。

常见问题：[为什么聊天审批有两项 Exec 审批配置？](/help/faq-first-run)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`
- QQ Bot：`channels.qqbot.execApprovals.*`
- Google Chat：使用 `channels.googlechat.dm.allowFrom` 或 `channels.googlechat.defaultTo` 配置稳定的审批人；无需 `execApprovals` 配置块
- WhatsApp：使用 `approvals.exec` 和 `approvals.plugin` 将审批提示路由到 WhatsApp
- Signal：使用 `approvals.exec` 和 `approvals.plugin` 将审批提示路由到 Signal

特定于原生客户端的路由：

- Telegram 默认向审批人发送私信（`target: "dm"`）。切换为 `channel` 或 `both`，还可在来源 Telegram 聊天/话题中显示审批提示。对于 Telegram 论坛话题，OpenClaw 会为审批提示和审批后的后续消息保留该话题。
- Discord 和 Telegram 审批人可以显式指定（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断；只有解析出的审批人才能批准或拒绝。
- Slack 审批人可以显式指定（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断。Slack 插件审批私信使用来自 `allowFrom` 和账户默认路由的 Slack 插件审批人，而不是 Slack Exec 审批人。Slack 原生按钮会保留审批 ID 种类，因此 `plugin:` ID 可以处理插件审批，而无需第二层 Slack 本地回退。
- Google Chat 原生卡片会在消息文本中保留手动 `/approve` 回退，但卡片按钮回调仅携带不透明的操作令牌；审批 ID 和决定从服务端待处理状态中恢复。
- 当匹配的顶层转发系列路由到 WhatsApp 时，WhatsApp 表情符号审批会同时处理 Exec 和插件提示。原生来源提示会直接绑定；共享目标模式投递会将相同的类型化审批元数据绑定到已接受的 WhatsApp 消息回执。
- 仅当匹配的顶层转发系列已启用并路由到 Signal 时，Signal 表情回应审批才会同时处理 Exec 和插件提示。Signal 中直接在同一聊天进行的 Exec 审批可以在没有显式审批人的情况下抑制本地 `/approve` 回退；Signal 表情回应的处理仍需要来自 `channels.signal.allowFrom` 或 `defaultTo` 的显式 Signal 审批人。
- Matrix 原生私信/渠道路由和表情回应快捷方式会同时处理 Exec 和插件审批；插件授权仍来自 `channels.matrix.dm.allowFrom`。Matrix 原生提示会在第一个提示事件中包含 `com.openclaw.approval` 自定义事件内容，使支持 OpenClaw 的 Matrix 客户端能够读取结构化审批状态，同时标准客户端仍保留纯文本 `/approve` 回退。
- 原生 Discord 和 Telegram 审批按钮会在传输层私有回调数据中携带显式的 Exec 或插件所有者种类，并且仅处理该所有者。缺少种类的旧版 `/approve` 控件仍作为有限的兼容路径：它们只尝试操作方可能审批的所有者种类，仅在收到“未找到审批”结果后继续，并且绝不根据审批 ID 推断所有权。
- 请求者不需要是审批人。
- 如果没有任何操作员 UI 或已配置的审批客户端能够接受请求，提示会回退到 `askFallback`。

仅限所有者的敏感群组命令（例如 `/diagnostics` 和 `/export-trajectory`）会对审批提示和最终结果使用私有所有者路由。OpenClaw 首先尝试在所有者运行命令的同一界面上使用私有路由。如果该界面没有私有所有者路由，则会回退到 `commands.ownerAllowFrom` 中第一个可用的所有者路由，因此当 Telegram 是已配置的主要私有界面时，Discord 群组命令仍可将审批和结果发送到所有者的 Telegram 私信。群聊中只会收到一条简短的确认消息。

另请参阅：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ Bot](/channels/qqbot)

### 官方移动端操作员应用

当使用 `operator.admin` 连接，或请求显式指定了其已配对的 `operator.approvals` 设备时，官方 iOS 和 Android 应用也可以审核由 Gateway 网关拥有的待处理 Exec 审批。它们读取与 Control UI 相同的经过清理的持久记录，提交能够识别种类的决定，并显示 Gateway 网关规范的首次回答结果。Apple Watch 会通过已配对的 iPhone 镜像这些审批提示，并提供仅允许一次和拒绝操作。Watch 直连 Gateway 网关模式不会审核审批。

解析确认丢失并不会使已提交的选择成为权威结果：应用会禁用控件并再次读取记录。如果其他界面先完成了审批，应用会显示该界面记录的决定。待处理提示会继续绑定到发出它们的 Gateway 网关，因此切换当前活动的 Gateway 网关无法重定向旧的审批 ID。

### macOS IPC 流程
__OC_I18N_900004__
安全说明：

- Unix 套接字模式为 `0600`，令牌存储在 `exec-approvals.json` 中。
- 同一 UID 对等方检查。
- 质询/响应（随机数 + HMAC 令牌 + 请求哈希）+ 较短的 TTL。

## 常见问题

### 审批目标中的 `accountId` 和 `threadId` 会在什么情况下使用？

当渠道配置了多个身份，并且审批提示必须通过某个特定账户发出时，使用 `accountId`。当目标支持话题或话题串，并且提示应保留在该话题串内而不是顶层聊天中时，使用 `threadId`。

一个具体的 Telegram 场景是：一个启用了论坛话题并配置了两个 Telegram Bot 账户的运维超级群组。`to` 值指定超级群组，`accountId` 选择 Bot 账户，`threadId` 选择论坛话题：
__OC_I18N_900005__
采用此设置后，转发的 Exec 审批会由 `ops-bot` Telegram 账户发布到聊天 `-1001234567890` 的话题 `77` 中。未设置 `accountId` 的目标使用渠道的默认账户，未设置 `threadId` 的目标则发布到顶层目标。

### 将审批发送到会话时，该会话中的任何人都能批准吗？

不能。会话投递仅控制提示出现的位置。它本身并不会授权该聊天中的每位参与者进行审批。

对于通用的同一聊天 `/approve`，发送者必须已获得在该渠道会话中使用命令的授权。如果渠道公开了显式的审批人，即使这些审批人在该会话中没有其他命令授权，他们也可以授权 `/approve` 操作。

某些渠道更严格。Discord、Telegram、Matrix、Slack 原生审批私信以及类似的原生审批客户端会使用其解析出的审批人列表进行审批授权。例如，Telegram 论坛话题中的审批提示可能对该话题中的所有人可见，但只有从 `channels.telegram.execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出的数字 Telegram 用户 ID 才能批准或拒绝。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) — 核心策略和审批流程
- [Exec 工具](/zh-CN/tools/exec)
- [提升权限模式](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills) — 由技能支持的自动允许行为
