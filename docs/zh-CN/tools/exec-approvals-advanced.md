---
read_when:
    - 配置安全二进制或自定义安全二进制配置档案
    - 将审批转发到 Slack/Discord/Telegram 或其他聊天渠道
    - 为渠道实现原生审批客户端
summary: 高级执行审批：安全二进制、解释器绑定、审批转发、本地原生交付
title: 执行审批——高级版
x-i18n:
    generated_at: "2026-04-25T03:24:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

高级执行审批主题：`safeBins` 快速路径、解释器/运行时绑定，以及将审批转发到聊天渠道（包括原生交付）。
有关核心策略和审批流程，请参阅 [执行审批](/zh-CN/tools/exec-approvals)。

## 安全二进制（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制程序（例如 `cut`），它们可以在允许列表模式下**无需**显式允许列表条目即可运行。安全二进制会拒绝位置文件参数和类似路径的令牌，因此它们只能对传入的数据流进行操作。请将其视为面向流过滤器的一条狭窄快速路径，而不是通用的信任列表。

<Warning>
**不要**将解释器或运行时二进制程序（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins` 中。如果某个命令按设计可以求值代码、执行子命令或读取文件，请优先使用显式允许列表条目，并保持审批提示启用。自定义安全二进制必须在 `tools.exec.safeBinProfiles.<bin>` 中定义一个显式配置档案。
</Warning>

默认安全二进制：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`、`uniq`、`head`、`tail`、`tr`、`wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请为其非 stdin 工作流保留显式允许列表条目。对于处于安全二进制模式的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置模式形式会被拒绝，以防文件操作数伪装成含义不明确的位置参数。

### Argv 验证与被拒绝的标志

验证仅根据 argv 形状以确定性方式进行（不检查主机文件系统中的存在性），这样可以防止因允许/拒绝差异而形成文件存在性探测行为。面向文件的选项会被默认安全二进制拒绝；长选项会以失败即关闭的方式验证（未知标志和含义不明确的缩写都会被拒绝）。

按安全二进制配置档案划分的被拒绝标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`：`--dereference-recursive`、`--directories`、`--exclude-from`、`--file`、`--recursive`、`-R`、`-d`、`-f`、`-r`
- `jq`：`--argfile`、`--from-file`、`--library-path`、`--rawfile`、`--slurpfile`、`-L`、`-f`
- `sort`：`--compress-program`、`--files0-from`、`--output`、`--random-source`、`--temporary-directory`、`-T`、`-o`
- `wc`：`--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二进制还会强制在执行时将 argv 令牌视为**字面文本**（不进行 glob 展开，也不进行 `$VARS` 展开）用于仅 stdin 的命令片段，因此像 `*` 或 `$HOME/...` 这样的模式无法被用来伪装文件读取。

### 受信任的二进制目录

安全二进制必须从受信任的二进制目录中解析（系统默认目录加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会被自动视为受信任。默认受信任目录被有意保持在最小范围：`/bin`、`/usr/bin`。如果你的安全二进制可执行文件位于包管理器/用户路径中（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 链接、包装器与多路复用器

当每个顶层片段都满足允许列表要求（包括安全二进制或 Skills 自动允许）时，允许使用 shell 链接（`&&`、`||`、`;`）。在允许列表模式下，重定向仍不受支持。命令替换（`$()` / 反引号）会在允许列表解析期间被拒绝，包括双引号内的命令替换；如果你需要字面的 `$()` 文本，请使用单引号。

在 macOS 配套应用审批中，包含 shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文本会被视为不匹配允许列表，除非 shell 二进制本身已在允许列表中。

对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求作用域的环境变量覆盖会被收缩为一个小型显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

对于允许列表模式下的 `allow-always` 决策，已知的分发包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）也会对 shell applet（`sh`、`ash` 等）以同样方式进行拆包。如果某个包装器或多路复用器无法被安全拆包，则不会自动持久化任何允许列表条目。

如果你将 `python3` 或 `node` 之类的解释器加入允许列表，建议启用 `tools.exec.strictInlineEval=true`，这样内联求值仍然需要显式审批。在严格模式下，`allow-always` 仍然可以持久化无害的解释器/脚本调用，但内联求值载体不会被自动持久化。

### 安全二进制与允许列表的区别

| 主题 | `tools.exec.safeBins` | 允许列表（`exec-approvals.json`） |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目标 | 自动允许范围狭窄的 stdin 过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名称 + 安全二进制 argv 策略 | 已解析的可执行文件路径 glob，或针对通过 `PATH` 调用命令的裸命令名 glob |
| 参数范围 | 受安全二进制配置档案和字面令牌规则限制 | 仅匹配路径；参数方面的责任由你自行承担 |
| 典型示例 | `head`、`tail`、`tr`、`wc` | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI |
| 最佳用途 | 管道中的低风险文本转换 | 任何行为更广泛或具有副作用的工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体设置的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体设置的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体设置的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体设置的配置档案键会覆盖全局键。
- 允许列表条目位于主机本地的 `~/.openclaw/exec-approvals.json` 中的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器/运行时二进制出现在 `safeBins` 中但没有显式配置档案时，`openclaw security audit` 会发出 `tools.exec.safe_bins_interpreter_unprofiled` 警告。
- `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles.<bin>` 条目生成 `{}` 脚手架（之后请审查并收紧）。解释器/运行时二进制不会被自动生成脚手架。

自定义配置档案例子：
__OC_I18N_900000__
如果你显式将 `jq` 选择加入 `safeBins`，OpenClaw 在安全二进制模式下仍会拒绝 `env` 内建项，因此 `jq -n env` 不能在没有显式允许列表路径或审批提示的情况下转储主机进程环境。

## 解释器/运行时命令

由审批支持的解释器/运行时执行会刻意保持保守：

- 始终会绑定精确的 argv/cwd/env 上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地文件快照。
- 仍然能解析为单个直接本地文件的常见包管理器包装形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前被拆包。
- 如果 OpenClaw 无法为解释器/运行时命令准确识别出**唯一一个**具体的本地文件（例如包脚本、求值形式、运行时特定的加载器链，或含义不明确的多文件形式），则会拒绝基于审批的执行，而不是声称自己覆盖了实际并未覆盖的语义。
- 对于这些工作流，请优先考虑沙箱隔离、单独的主机边界，或显式受信任的允许列表/完整工作流，在这些情况下由操作员接受更广泛的运行时语义。

当需要审批时，exec 工具会立即返回一个审批 id。请使用该 id 关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有收到决策，请求会被视为审批超时，并作为拒绝原因显示出来。

### 后续交付行为

在已批准的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 回合。

- 如果存在有效的外部交付目标（可交付的渠道加目标 `to`），后续交付会使用该渠道。
- 在仅 webchat 或仅内部会话、且没有外部目标的流程中，后续交付会保持仅会话模式（`deliver: false`）。
- 如果调用方显式请求严格的外部交付，但无法解析出外部渠道，则请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析出外部渠道，交付会降级为仅会话模式，而不是直接失败。

## 将审批转发到聊天渠道

你可以将 exec 审批提示转发到任何聊天渠道（包括渠道插件），并通过 `/approve` 进行审批。这会使用正常的出站交付流水线。

配置：
__OC_I18N_900001__
在聊天中回复：
__OC_I18N_900002__
`/approve` 命令同时处理 exec 审批和插件审批。如果该 ID 与待处理的 exec 审批不匹配，它会自动继续检查插件审批。

### 插件审批转发

插件审批转发使用与 exec 审批相同的交付流水线，但它在 `approvals.plugin` 下拥有自己独立的配置。启用或禁用其中一个不会影响另一个。
__OC_I18N_900003__
配置结构与 `approvals.exec` 完全一致：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的工作方式都相同。

支持共享交互式回复的渠道会为 exec 和插件审批都渲染相同的审批按钮。没有共享交互式 UI 的渠道会回退为带有 `/approve` 说明的纯文本。

### 在任意渠道中于同一聊天内完成审批

当某个 exec 或插件审批请求来自可交付的聊天界面时，现在默认可以在同一聊天中通过 `/approve` 进行审批。这适用于 Slack、Matrix 和 Microsoft Teams 等渠道，也适用于现有的 Web UI 和终端 UI 流程。

这条共享的文本命令路径会使用该对话的正常渠道认证模型。如果发起聊天本身已经可以发送命令并接收回复，那么审批请求就不再需要单独的原生交付适配器来维持待处理状态。

Discord 和 Telegram 也支持同一聊天内的 `/approve`，但即使禁用了原生审批交付，这些渠道在授权时仍会使用其已解析的审批人列表。

对于 Telegram 和其他直接调用 Gateway 网关的原生审批客户端，这一回退机制会被有意限制在“未找到审批”失败这一类情况。真正的 exec 审批拒绝/错误不会被静默重试为插件审批。

### 原生审批交付

某些渠道还可以充当原生审批客户端。原生客户端会在共享的同一聊天 `/approve` 流程之上，增加审批人私信、来源聊天扇出，以及渠道特定的交互式审批 UX。

当原生审批卡片/按钮可用时，该原生 UI 是面向智能体的主要路径。除非工具结果表明聊天审批不可用，或者手动审批是唯一剩余路径，否则智能体不应另外回显重复的纯聊天 `/approve` 命令。

通用模型：

- 是否需要 exec 审批，仍由主机 exec 策略决定
- `approvals.exec` 控制是否将审批提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否充当原生审批客户端

当以下条件全部满足时，原生审批客户端会自动启用“审批人私信优先”交付：

- 该渠道支持原生审批交付
- 可以从显式的 `execApprovals.approvers` 或该渠道文档化的后备来源中解析出审批人
- `channels.<channel>.execApprovals.enabled` 未设置，或设置为 `"auto"`

设置 `enabled: false` 可显式禁用原生审批客户端。设置 `enabled: true` 可在审批人可解析时强制启用。公开的来源聊天交付仍通过 `channels.<channel>.execApprovals.target` 显式控制。

常见问题：[为什么聊天审批会有两套 exec 审批配置？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生审批客户端在共享的同一聊天 `/approve` 流程和共享审批按钮之上，增加了私信路由和可选的渠道扇出功能。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可交付聊天使用正常的渠道认证模型来处理同一聊天内的 `/approve`
- 当原生审批客户端自动启用时，默认原生交付目标是审批人私信
- 对于 Discord 和 Telegram，只有已解析的审批人可以批准或拒绝
- Discord 审批人可以显式指定（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram 审批人可以显式指定（`execApprovals.approvers`），也可以从现有的 owner 配置推断（`allowFrom`，以及在支持时的私信 `defaultTo`）
- Slack 审批人可以显式指定（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留审批 id 类型，因此 `plugin:` id 可以解析到插件审批，而无需第二层 Slack 本地后备逻辑
- Matrix 原生私信/渠道路由和表情回应快捷方式同时处理 exec 与插件审批；插件授权仍来自 `channels.matrix.dm.allowFrom`
- 请求发起者不需要是审批人
- 当来源聊天本身已经支持命令和回复时，来源聊天可以直接使用 `/approve` 进行审批
- 原生 Discord 审批按钮按审批 id 类型路由：`plugin:` id 会直接进入插件审批，其他所有情况都会进入 exec 审批
- 原生 Telegram 审批按钮遵循与 `/approve` 相同的、受限的从 exec 到插件的回退逻辑
- 当原生 `target` 启用来源聊天交付时，审批提示会包含命令文本
- 待处理的 exec 审批默认在 30 分钟后过期
- 如果没有任何操作员 UI 或已配置的审批客户端可以接受该请求，提示会回退到 `askFallback`

Telegram 默认使用审批人私信（`target: "dm"`）。如果你希望审批提示也出现在来源 Telegram 聊天/话题中，可以切换为 `channel` 或 `both`。对于 Telegram 论坛话题，OpenClaw 会在审批提示和审批后的后续消息中保留该话题。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全说明：

- Unix socket 模式为 `0600`，token 存储在 `exec-approvals.json` 中。
- 同一 UID 对等方检查。
- 挑战/响应（nonce + HMAC token + 请求哈希）+ 短 TTL。

## 相关内容

- [执行审批](/zh-CN/tools/exec-approvals) —— 核心策略与审批流程
- [Exec 工具](/zh-CN/tools/exec)
- [提权模式](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills) —— 由 Skills 支持的自动允许行为
