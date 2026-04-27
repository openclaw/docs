---
read_when:
    - 配置安全分组或自定义安全分组配置文件
    - 将审批转发到 Slack/Discord/Telegram 或其他聊天渠道
    - 为渠道实现原生审批客户端
summary: 高级 exec 审批：安全分组、解释器绑定、审批转发、原生交付
title: Exec 审批——高级
x-i18n:
    generated_at: "2026-04-27T18:55:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 188b94f604a50d67742ebbdbb0238aad9e3de28dc50fb6e5a6070f06ef0adfde
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

高级 exec 审批主题：`safeBins` 快速路径、解释器/运行时
绑定，以及向聊天渠道转发审批（包括原生交付）。
有关核心策略和审批流程，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

## 安全分组（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制程序（例如 `cut`），它们可以在允许列表模式下**无需**显式允许列表条目即可运行。安全分组会拒绝位置文件参数和类似路径的令牌，因此它们只能对传入流进行操作。请将其视为流过滤器的一个狭窄快速路径，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制程序（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果某个命令按设计可以求值代码、执行子命令或读取文件，请优先使用显式允许列表条目，并保持审批提示启用。自定义安全分组必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置文件。
</Warning>

默认安全分组：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请为其非 stdin 工作流保留显式允许列表条目。对于安全分组模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置模式形式会被拒绝，这样文件操作数就无法伪装成有歧义的位置参数。

### Argv 验证和被拒绝的标志

验证仅根据 argv 形状以确定性方式进行（不检查主机文件系统中的文件是否存在），这样可以防止因允许/拒绝差异而产生文件存在性预言机行为。面向文件的选项会被默认安全分组拒绝；长选项采用失败即关闭的验证方式（未知标志和有歧义的缩写都会被拒绝）。

按安全分组配置文件划分的被拒绝标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全分组还会在执行时强制将 argv 令牌视为**字面文本**（不进行 glob 展开，也不展开 `$VARS`）用于仅 stdin 的片段，因此像 `*` 或 `$HOME/...` 这样的模式不能被用来伪装文件读取。

### 受信任的二进制目录

安全分组必须从受信任的二进制目录解析（系统默认目录加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会被自动信任。默认受信任目录被有意保持在最小范围：`/bin`、`/usr/bin`。如果你的安全分组可执行文件位于包管理器/用户路径中（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 链接、包装器和多路复用器

当每个顶层片段都满足允许列表时（包括安全分组或 Skills 自动允许），允许使用 shell 链接（`&&`、`||`、`;`）。在允许列表模式下，重定向仍然不受支持。命令替换（`$()` / 反引号）会在允许列表解析期间被拒绝，包括在双引号内部；如果你需要字面的 `$()` 文本，请使用单引号。

在 macOS 配套应用审批中，包含 shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文本会被视为允许列表未命中，除非 shell 二进制程序本身已被加入允许列表。

对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的环境变量覆盖会被缩减为一个小型显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

对于允许列表模式下的 `allow-always` 决策，已知分发包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）也会以同样方式为 shell applet（`sh`、`ash` 等）进行解包。如果某个包装器或多路复用器无法被安全解包，则不会自动持久化任何允许列表条目。

如果你将 `python3` 或 `node` 这类解释器加入允许列表，建议启用 `tools.exec.strictInlineEval=true`，这样内联求值仍然需要显式审批。在严格模式下，`allow-always` 仍然可以持久化无害的解释器/脚本调用，但内联求值载体不会被自动持久化。

### 安全分组与允许列表

| 主题 | `tools.exec.safeBins` | 允许列表（`exec-approvals.json`） |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目标 | 自动允许狭窄的 stdin 过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名 + 安全分组 argv 策略 | 已解析的可执行文件路径 glob，或用于通过 PATH 调用命令的裸命令名 glob |
| 参数范围 | 受安全分组配置文件和字面令牌规则限制 | 仅匹配路径；参数的其他部分由你自行负责 |
| 典型示例 | `head`、`tail`、`tr`、`wc` | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI |
| 最佳用途 | 管道中的低风险文本转换 | 任何行为更广泛或具有副作用的工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或每个智能体的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或每个智能体的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或每个智能体的 `agents.list[].tools.exec.safeBinProfiles`）。每个智能体的配置文件键会覆盖全局键。
- 允许列表条目位于主机本地的 `~/.openclaw/exec-approvals.json` 的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器/运行时二进制程序出现在 `safeBins` 中但没有显式配置文件时，`openclaw security audit` 会发出 `tools.exec.safe_bins_interpreter_unprofiled` 警告。
- `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles.<bin>` 条目生成 `{}` 骨架（之后请审查并收紧）。解释器/运行时二进制程序不会被自动生成骨架。

自定义配置文件示例：
__OC_I18N_900000__
如果你显式选择将 `jq` 加入 `safeBins`，OpenClaw 在安全分组模式下仍会拒绝 `env` 内建，因此 `jq -n env` 无法在没有显式允许列表路径或审批提示的情况下转储主机进程环境。

## 解释器/运行时命令

由审批支持的解释器/运行时执行被有意设计得较为保守：

- 始终会绑定精确的 argv/cwd/env 上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地文件快照。
- 仍可解析为一个直接本地文件的常见包管理器包装形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前解包。
- 如果 OpenClaw 无法为解释器/运行时命令准确识别出**恰好一个**具体的本地文件（例如包脚本、eval 形式、运行时特定的加载器链，或有歧义的多文件形式），则会拒绝基于审批的执行，而不是声称它具备实际上没有的语义覆盖范围。
- 对于这些工作流，请优先使用沙箱隔离、独立的主机边界，或者显式受信任的允许列表/完整工作流，由操作员接受更广泛的运行时语义。

当需要审批时，exec 工具会立即返回一个审批 id。请使用该 id 关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有收到决定，请求会被视为审批超时，并作为拒绝原因呈现。

### 后续交付行为

在获批的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 轮次。

- 如果存在有效的外部交付目标（可交付的渠道以及目标 `to`），后续交付会使用该渠道。
- 在仅 webchat 或无外部目标的内部会话流程中，后续交付会保持为仅会话（`deliver: false`）。
- 如果调用方在没有可解析外部渠道的情况下显式请求严格外部交付，请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析任何外部渠道，交付会降级为仅会话，而不是失败。

## 向聊天渠道转发审批

你可以将 exec 审批提示转发到任何聊天渠道（包括插件渠道），并通过 `/approve` 进行审批。这使用正常的出站交付流水线。

配置：
__OC_I18N_900001__
在聊天中回复：
__OC_I18N_900002__
`/approve` 命令同时处理 exec 审批和插件审批。如果该 ID 与待处理的 exec 审批不匹配，它会自动继续检查插件审批。

### 插件审批转发

插件审批转发使用与 exec 审批相同的交付流水线，但它在 `approvals.plugin` 下拥有独立配置。启用或禁用其中一个不会影响另一个。
__OC_I18N_900003__
配置结构与 `approvals.exec` 完全相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的工作方式一致。

支持共享交互式回复的渠道会为 exec 和插件审批渲染相同的审批按钮。不支持共享交互式 UI 的渠道会回退为带有 `/approve` 说明的纯文本。

### 任意渠道中的同一聊天审批

当 exec 或插件审批请求来自可交付的聊天界面时，默认情况下现在可以在同一聊天中通过 `/approve` 进行审批。这适用于 Slack、Matrix 和 Microsoft Teams 等渠道，以及现有的 Web UI 和终端 UI 流程。

这一路径共享的文本命令使用该会话的正常渠道认证模型。如果发起聊天本身已经能够发送命令并接收回复，那么审批请求不再需要单独的原生交付适配器来保持待处理状态。

Discord 和 Telegram 也支持在同一聊天中使用 `/approve`，但即使禁用了原生审批交付，这些渠道在授权时仍会使用其已解析的 approver 列表。

对于 Telegram 和其他直接调用 Gateway 网关的原生审批客户端，这种回退被有意限制在“未找到审批”失败上。真正的 exec 审批拒绝/错误不会被静默重试为插件审批。

### 原生审批交付

某些渠道还可以充当原生审批客户端。原生客户端会在共享的同一聊天 `/approve` 流程基础上，增加 approver 私信、原始聊天扇出，以及渠道特定的交互式审批 UX。

当原生审批卡片/按钮可用时，该原生 UI 是面向智能体的主要路径。除非工具结果表明聊天审批不可用，或者手动审批是唯一剩余路径，否则智能体不应再额外回显重复的纯聊天 `/approve` 命令。

通用模型：

- 主机 exec 策略仍然决定是否需要 exec 审批
- `approvals.exec` 控制将审批提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否充当原生审批客户端

当以下条件全部满足时，原生审批客户端会自动启用 approver 私信优先交付：

- 该渠道支持原生审批交付
- 可以从显式的 `execApprovals.approvers` 或该渠道文档说明的回退来源解析 approver
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

将 `enabled: false` 设置为显式禁用原生审批客户端。将 `enabled: true` 设置为在 approver 可解析时强制启用。公开的原始聊天交付仍通过 `channels.<channel>.execApprovals.target` 显式控制。

常见问题：[为什么聊天审批会有两个 exec 审批配置？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

这些原生审批客户端会在共享的同一聊天 `/approve` 流程和共享审批按钮之上，增加私信路由和可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可交付聊天使用该会话的正常渠道认证模型来处理同一聊天中的 `/approve`
- 当原生审批客户端自动启用时，默认的原生交付目标是 approver 私信
- 对于 Discord 和 Telegram，只有已解析的 approver 才能批准或拒绝
- Discord approver 可以显式指定（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram approver 可以显式指定（`execApprovals.approvers`），也可以从现有 owner 配置推断（`allowFrom`，以及在支持时的私信 `defaultTo`）
- Slack approver 可以显式指定（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留审批 id 类型，因此 `plugin:` id 可以解析到插件审批，而无需第二层 Slack 本地回退
- Matrix 原生私信/渠道路由和 reaction 快捷方式同时处理 exec 和插件审批；插件授权仍然来自 `channels.matrix.dm.allowFrom`
- Matrix 原生提示会在首个提示事件中包含 `com.openclaw.approval` 自定义事件内容，因此支持 OpenClaw 的 Matrix 客户端可以读取结构化审批状态，而标准客户端仍保留纯文本 `/approve` 回退
- 请求方不需要是 approver
- 当原始聊天已支持命令和回复时，原始聊天可以直接通过 `/approve` 进行审批
- 原生 Discord 审批按钮会按审批 id 类型进行路由：`plugin:` id 直接进入插件审批，其他一切都进入 exec 审批
- 原生 Telegram 审批按钮遵循与 `/approve` 相同的受限 exec 到插件回退
- 当原生 `target` 启用原始聊天交付时，审批提示会包含命令文本
- 待处理的 exec 审批默认在 30 分钟后过期
- 如果没有任何操作员 UI 或已配置的审批客户端可以接受该请求，提示会回退到 `askFallback`

Telegram 默认使用 approver 私信（`target: "dm"`）。如果你希望审批提示也出现在原始 Telegram 聊天/话题中，可以切换为 `channel` 或 `both`。对于 Telegram forum 话题，OpenClaw 会为审批提示和审批后的后续消息保留该话题。

请参阅：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全说明：

- Unix socket 模式为 `0600`，token 存储在 `exec-approvals.json` 中。
- 同一 UID 对等方检查。
- 质询/响应（nonce + HMAC token + 请求哈希）+ 短 TTL。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) —— 核心策略和审批流程
- [Exec 工具](/zh-CN/tools/exec)
- [提升模式](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills) —— 由 Skills 支持的自动允许行为
