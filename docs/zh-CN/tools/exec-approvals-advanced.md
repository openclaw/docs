---
read_when:
    - 配置安全命令集或自定义安全命令集配置文件
    - 将审批转发到 Slack/Discord/Telegram 或其他聊天渠道
    - 为渠道实现原生审批客户端
summary: 高级 Exec 审批：安全二进制文件、解释器绑定、审批转发、原生交付
title: Exec 审批 — 高级
x-i18n:
    generated_at: "2026-06-27T03:27:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

高级 Exec 审批主题：`safeBins` 快速路径、解释器/运行时绑定，以及向聊天渠道（包括原生投递）转发审批。核心策略和审批流程见 [Exec 审批](/zh-CN/tools/exec-approvals)。

## 安全二进制文件（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制文件（例如 `cut`），它们可以在允许列表模式下**无需**显式允许列表条目即可运行。安全二进制文件会拒绝位置型文件参数和类似路径的词元，因此它们只能处理传入流。请将其视为流过滤器的狭窄快速路径，而不是通用信任列表。

<Warning>
不要将解释器或运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果命令按设计可以求值代码、执行子命令或读取文件，请优先使用显式允许列表条目，并保持审批提示启用。自定义安全二进制文件必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置档。
</Warning>

默认安全二进制文件：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请为其非 stdin 工作流保留显式允许列表条目。对于安全二进制文件模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置型模式形式会被拒绝，这样文件操作数就无法作为含糊的位置参数被夹带。

### Argv 验证和被拒绝的标志

验证仅根据 argv 形状确定（不检查主机文件系统是否存在），这可以防止允许/拒绝差异造成文件存在性预言机行为。默认安全二进制文件会拒绝面向文件的选项；长选项采用失败关闭验证（未知标志和含糊缩写会被拒绝）。

按安全二进制文件配置档列出的被拒绝标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二进制文件还会强制 argv 词元在执行时被视为**字面文本**（不进行通配符展开，也不展开 `$VARS`），适用于仅 stdin 的片段，因此 `*` 或 `$HOME/...` 这样的模式无法用于夹带文件读取。

### 受信任的二进制文件目录

安全二进制文件必须从受信任的二进制文件目录解析（系统默认值加可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会自动受信任。默认受信任目录有意保持最小：`/bin`、`/usr/bin`。如果你的安全二进制文件可执行文件位于包管理器/用户路径中（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 链接、包装器和多路复用器

当每个顶层片段都满足允许列表（包括安全二进制文件或 Skills 自动允许）时，允许 Shell 链接（`&&`、`||`、`;`）。允许列表模式仍不支持重定向。命令替换（`$()` / 反引号）会在允许列表解析期间被拒绝，包括在双引号内部；如果需要字面 `$()` 文本，请使用单引号。

在 macOS 配套应用审批中，包含 Shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 Shell 文本会被视为允许列表未命中，除非 Shell 二进制文件本身已列入允许列表。

对于 Shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的环境覆盖会缩减为一小组显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

对于允许列表模式下的 `allow-always` 决策，已知分发包装器（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）会以同样方式为 Shell 小程序（`sh`、`ash` 等）解除包装。如果无法安全解除某个包装器或多路复用器，则不会自动持久化允许列表条目。

如果你将 `python3` 或 `node` 等解释器加入允许列表，请优先设置 `tools.exec.strictInlineEval=true`，这样内联求值仍需要显式审批。在严格模式下，`allow-always` 仍可持久化良性的解释器/脚本调用，但内联求值载体不会自动持久化。

### 安全二进制文件与允许列表

| 主题             | `tools.exec.safeBins`                                  | 允许列表（`exec-approvals.json`）                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目标             | 自动允许狭窄的 stdin 过滤器                           | 显式信任特定可执行文件                                                             |
| 匹配类型         | 可执行文件名称 + 安全二进制文件 argv 策略             | 已解析的可执行文件路径 glob，或对通过 PATH 调用的命令使用裸命令名 glob            |
| 参数范围         | 受安全二进制文件配置档和字面词元规则限制              | 默认按路径匹配；可选 `argPattern` 可限制解析后的 argv                              |
| 典型示例         | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, 自定义 CLI                                      |
| 最佳用途         | 管道中的低风险文本转换                                 | 任何具有更广行为或副作用的工具                                                     |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按 Agent 配置的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按 Agent 配置的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按 Agent 配置的 `agents.list[].tools.exec.safeBinProfiles`）。按 Agent 配置的配置档键会覆盖全局键。
- 允许列表条目位于主机本地审批文件的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...` 管理）。
- 当解释器/运行时 bin 出现在 `safeBins` 中但没有显式配置档时，`openclaw security audit` 会以 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以将缺失的自定义 `safeBinProfiles.<bin>` 条目搭建为 `{}`（之后请审查并收紧）。解释器/运行时 bin 不会自动搭建。

自定义配置档示例：
__OC_I18N_900000__
如果你显式将 `jq` 加入 `safeBins`，OpenClaw 仍会在安全二进制文件模式下拒绝 `env` 内建项，因此 `jq -n env` 无法在没有显式允许列表路径或审批提示的情况下转储主机进程环境。

## 解释器/运行时命令

由审批支持的解释器/运行时运行有意保持保守：

- 始终绑定精确的 argv/cwd/env 上下文。
- 直接 Shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地文件快照。
- 仍解析为一个直接本地文件的常见包管理器包装器形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前解除包装。
- 如果 OpenClaw 无法为解释器/运行时命令精确识别一个具体的本地文件（例如包脚本、求值形式、运行时特定加载器链或含糊的多文件形式），由审批支持的执行会被拒绝，而不是声称具备并不真实的语义覆盖。
- 对于这些工作流，请优先使用沙箱隔离、单独的主机边界，或显式受信任的允许列表/完整工作流，其中操作者接受更广的运行时语义。

当需要审批时，Exec 工具会立即返回一个审批 ID。使用该 ID 关联之后的已批准运行系统事件（`Exec finished`，以及配置时的 `Exec running`）。如果超时前没有收到决策，请求会被视为审批超时，并作为终端主机命令拒绝呈现。对于带来源会话的主 Agent 异步审批，OpenClaw 还会用内部后续消息恢复该会话，让智能体观察到命令没有运行，而不是之后修复缺失结果。

### 后续投递行为

已批准的异步 Exec 完成后，OpenClaw 会向同一会话发送后续 `agent` 轮次。被拒绝的异步审批会使用相同的主会话后续路径报告拒绝状态，但它们不会注册提升权限的运行时移交，也不会运行命令。没有可恢复主会话的拒绝要么被抑制，要么在存在安全直接路由时通过该路由报告。

- 如果存在有效的外部投递目标（可投递渠道加目标 `to`），后续投递会使用该渠道。
- 在仅 webchat 或没有外部目标的内部会话流程中，后续投递仅保留在会话内（`deliver: false`）。
- 如果调用方显式请求严格外部投递，但没有可解析的外部渠道，请求会以 `INVALID_REQUEST` 失败。
- 如果启用 `bestEffortDeliver` 且无法解析外部渠道，投递会降级为仅会话，而不是失败。

## 向聊天渠道转发审批

你可以将 Exec 审批提示转发到任何聊天渠道（包括插件渠道），并使用 `/approve` 批准它们。这会使用正常的出站投递管线。

配置：
__OC_I18N_900001__
在聊天中回复：
__OC_I18N_900002__
`/approve` 命令同时处理 Exec 审批和插件审批。如果 ID 不匹配待处理的 Exec 审批，它会自动改为检查插件审批。

### 插件审批转发

插件审批转发使用与 Exec 审批相同的投递管线，但在 `approvals.plugin` 下拥有自己的独立配置。启用或禁用其中一个不会影响另一个。关于插件创作行为、请求字段和决策语义，请参阅 [插件权限请求](/plugins/plugin-permission-requests)。
__OC_I18N_900003__
配置形状与 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的工作方式相同。

支持共享交互式回复的渠道会为 Exec 和插件审批渲染相同的审批按钮。没有共享交互式 UI 的渠道会回退为带 `/approve` 指令的纯文本。
插件审批请求可以限制可用决策。审批界面使用请求声明的决策集，Gateway 网关会拒绝提交未提供的决策。

### 任意渠道上的同聊天审批

当 Exec 或插件审批请求来自可投递的聊天界面时，默认情况下，同一聊天现在可以使用 `/approve` 批准它。这除了现有的 Web UI 和终端 UI 流程外，也适用于 Slack、Matrix 和 Microsoft Teams 等渠道。

此共享文本命令路径会使用该对话的常规渠道鉴权模型。如果发起聊天已能发送命令并接收回复，审批请求就不再需要单独的原生投递适配器来保持待处理状态。

Discord 和 Telegram 也支持同聊天 `/approve`，但即使原生审批投递被禁用，这些渠道仍会使用它们解析出的审批人列表进行授权。

对于直接调用 Gateway 网关的 Telegram 和其他原生审批客户端，此回退有意仅限于 “approval not found” 失败。真正的 exec 审批拒绝或错误不会静默重试为插件审批。

### 原生审批投递

有些渠道也可以充当原生审批客户端。原生客户端会在共享的同聊天 `/approve` 流程之上，增加审批人私信、源聊天扇出以及特定渠道的交互式审批 UX。

当原生审批卡片或按钮可用时，该原生 UI 是主要的面向智能体路径。除非工具结果表示聊天审批不可用，或手动审批是唯一剩余路径，否则智能体不应再回显重复的纯聊天 `/approve` 命令。

如果配置了原生审批客户端，但发起渠道没有活跃的原生运行时，OpenClaw 会保持本地确定性的 `/approve` 提示可见。如果原生运行时处于活跃状态并尝试投递，但没有任何目标收到卡片，OpenClaw 会发送同聊天回退通知，其中包含精确的 `/approve <id> <decision>` 命令，以便请求仍可被解决。

通用模型：

- 主机 exec 策略仍决定是否需要 exec 审批
- `approvals.exec` 控制将审批提示转发到其他聊天目的地
- `channels.<channel>.execApprovals` 控制是否启用 Discord、Slack、Telegram 以及类似的特定渠道原生客户端
- 当请求来自 Slack 且 Slack 插件审批人可解析时，Slack 插件审批可以使用 Slack 的原生审批客户端；即使 Slack exec 审批被禁用，`approvals.plugin` 也可以将插件审批路由到 Slack 会话或目标
- 当稳定的 `users/<id>` 审批人可从 `dm.allowFrom` 或 `defaultTo` 解析时，Google Chat 原生审批卡片会处理来自 Google Chat 空间或线程的 exec 和插件审批；它们不使用反应事件来作出决定
- WhatsApp 和 Signal 反应审批投递由 `approvals.exec` 和 `approvals.plugin` 控制；它们没有 `channels.<channel>.execApprovals` 块

当以下条件全部为真时，原生审批客户端会自动启用私信优先投递：

- 该渠道支持原生审批投递
- 可从显式 `execApprovals.approvers` 或所有者身份（如 `commands.ownerAllowFrom`）解析审批人
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

设置 `enabled: false` 可显式禁用原生审批客户端。设置 `enabled: true` 可在审批人可解析时强制启用。公开的源聊天投递仍通过 `channels.<channel>.execApprovals.target` 显式配置。

常见问题：[为什么聊天审批有两套 exec 审批配置？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`
- Google Chat：使用 `channels.googlechat.dm.allowFrom` 或 `channels.googlechat.defaultTo` 配置稳定审批人；不需要 `execApprovals` 块
- WhatsApp：使用 `approvals.exec` 和 `approvals.plugin` 将审批提示路由到 WhatsApp
- Signal：使用 `approvals.exec` 和 `approvals.plugin` 将审批提示路由到 Signal

这些原生审批客户端会在共享的同聊天 `/approve` 流程和共享审批按钮之上，增加私信路由以及可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可投递聊天使用常规渠道鉴权模型处理同聊天 `/approve`
- 当原生审批客户端自动启用时，默认的原生投递目标是审批人私信
- 对于 Discord 和 Telegram，只有解析出的审批人可以批准或拒绝
- Discord 审批人可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram 审批人可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 审批人可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 插件审批私信使用来自 `allowFrom` 和账户默认路由的 Slack 插件审批人，而不是 Slack exec 审批人
- Slack 原生按钮会保留审批 ID 类型，因此 `plugin:` ID 可以解析插件审批，而无需第二层 Slack 本地回退
- Google Chat 原生卡片会在消息文本中保留手动 `/approve` 回退，但卡片按钮回调只携带不透明动作令牌；审批 ID 和决定会从服务端待处理状态中恢复
- WhatsApp 表情审批仅在匹配的顶层转发系列已启用并路由到 WhatsApp 时，同时处理 exec 和插件提示；仅目标的 WhatsApp 转发会保留在共享转发路径上，除非它匹配相同的原生来源目标
- Signal 反应审批仅在匹配的顶层转发系列已启用并路由到 Signal 时，同时处理 exec 和插件提示。直接的同聊天 Signal exec 审批可以在没有显式审批人的情况下抑制本地 `/approve` 回退；Signal 反应解析仍需要来自 `channels.signal.allowFrom` 或 `defaultTo` 的显式 Signal 审批人。
- Matrix 原生私信/渠道路由和反应快捷方式会同时处理 exec 和插件审批；插件授权仍来自 `channels.matrix.dm.allowFrom`
- Matrix 原生提示会在第一个提示事件中包含 `com.openclaw.approval` 自定义事件内容，因此支持 OpenClaw 的 Matrix 客户端可以读取结构化审批状态，而标准客户端会保留纯文本 `/approve` 回退
- 请求者不需要是审批人
- 当发起聊天已支持命令和回复时，可以直接用 `/approve` 审批
- 原生 Discord 审批按钮按审批 ID 类型路由：`plugin:` ID 直接进入插件审批，其他所有内容进入 exec 审批
- 原生 Telegram 审批按钮遵循与 `/approve` 相同的有界 exec 到插件回退
- 当原生 `target` 启用源聊天投递时，审批提示会包含命令文本
- 待处理 exec 审批默认在 30 分钟后过期
- 如果没有操作员 UI 或已配置的审批客户端可以接受请求，提示会回退到 `askFallback`

敏感的仅所有者群组命令（如 `/diagnostics` 和 `/export-trajectory`）会为审批提示和最终结果使用私有所有者路由。OpenClaw 首先会尝试在所有者运行命令的同一界面上使用私有路由。如果该界面没有私有所有者路由，它会回退到 `commands.ownerAllowFrom` 中第一个可用的所有者路由，因此当 Telegram 是已配置的主要私有界面时，Discord 群组命令仍可以将审批和结果发送到所有者的 Telegram 私信。群聊只会收到一条简短确认。

Telegram 默认使用审批人私信（`target: "dm"`）。当你希望审批提示也出现在发起的 Telegram 聊天/话题中时，可以切换到 `channel` 或 `both`。对于 Telegram 论坛话题，OpenClaw 会为审批提示和审批后的后续消息保留该话题。

另请参阅：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全说明：

- Unix 套接字模式 `0600`，令牌存储在 `exec-approvals.json` 中。
- 同 UID 对端检查。
- 质询/响应（nonce + HMAC 令牌 + 请求哈希）+ 短 TTL。

## 常见问题

### 审批目标上的 `accountId` 和 `threadId` 何时会被使用？

当渠道配置了多个身份，且审批提示必须通过某个特定账户发出时，使用 `accountId`。当目的地支持话题或线程，并且提示应留在该线程内而不是顶层聊天时，使用 `threadId`。

一个具体的 Telegram 场景是包含论坛话题和两个 Telegram Bot 账户的运维超级群组。`to` 值指定超级群组，`accountId` 选择 Bot 账户，`threadId` 选择论坛话题：
__OC_I18N_900005__
在该设置下，转发的 exec 审批会由 `ops-bot` Telegram 账户发布到聊天 `-1001234567890` 的话题 `77` 中。没有 `accountId` 的目标会使用渠道的默认账户，没有 `threadId` 的目标会发布到顶层目的地。

### 当审批发送到某个会话时，该会话中的任何人都能批准吗？

不能。会话投递只控制提示出现的位置。它本身不会授权该聊天中的每个参与者批准。

对于通用的同聊天 `/approve`，发送者必须已在该渠道会话中获得命令授权。如果渠道暴露显式审批人，这些审批人即使在该会话中未被授权执行其他命令，也可以授权 `/approve` 操作。

有些渠道更严格。Discord、Telegram、Matrix、Slack 原生审批私信以及类似的原生审批客户端会使用它们解析出的审批人列表进行审批授权。例如，Telegram 论坛话题审批提示可以对话题中的所有人可见，但只有从 `channels.telegram.execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出的数字 Telegram 用户 ID 可以批准或拒绝它。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) — 核心策略和审批流程
- [Exec 工具](/zh-CN/tools/exec)
- [提升权限模式](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills) — 由技能支持的自动允许行为
