---
read_when:
    - 配置安全 bin 或自定义安全 bin 配置文件
    - 将审批转发到 Slack/Discord/Telegram 或其他聊天渠道
    - 为某个渠道实现原生审批客户端
summary: 高级 exec 审批：安全 bin、解释器绑定、审批转发、原生投递
title: Exec 审批 — 高级内容
x-i18n:
    generated_at: "2026-04-24T03:43:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

高级 exec 审批主题：`safeBins` 快速路径、解释器/运行时绑定，以及将审批转发到聊天渠道（包括原生投递）。
有关核心策略和审批流程，请参阅 [Exec approvals](/zh-CN/tools/exec-approvals)。

## 安全 bin（仅 stdin）

`tools.exec.safeBins` 定义了一个小型的**仅 stdin** 二进制列表（例如 `cut`），这些二进制在 allowlist 模式下**无需**显式 allowlist 条目即可运行。安全 bin 会拒绝位置文件参数和类似路径的 token，因此它们只能处理传入流。请将其视为面向流过滤器的狭义快速路径，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制（例如 `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果某个命令按设计可以执行代码、运行子命令或读取文件，请优先使用显式 allowlist 条目，并保持审批提示启用。自定义安全 bin 必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置文件。
</Warning>

默认安全 bin：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`、`uniq`、`head`、`tail`、`tr`、`wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请为其非 stdin 工作流保留显式 allowlist 条目。对于处于安全 bin 模式的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置模式形式会被拒绝，以防文件操作数伪装成有歧义的位置参数。

### Argv 校验和被拒绝的标志

校验仅根据 argv 形状以确定性方式进行（不检查主机文件系统是否存在），从而防止 allow/deny 差异导致文件存在性预言机行为。默认安全 bin 的面向文件选项会被拒绝；长选项使用 fail-closed 方式校验（未知标志和有歧义的缩写会被拒绝）。

按安全 bin 配置文件划分的拒绝标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`：`--dereference-recursive`、`--directories`、`--exclude-from`、`--file`、`--recursive`、`-R`、`-d`、`-f`、`-r`
- `jq`：`--argfile`、`--from-file`、`--library-path`、`--rawfile`、`--slurpfile`、`-L`、`-f`
- `sort`：`--compress-program`、`--files0-from`、`--output`、`--random-source`、`--temporary-directory`、`-T`、`-o`
- `wc`：`--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全 bin 在执行时还会强制将 argv token 视为**字面文本**（无 glob 展开，也无 `$VARS` 扩展），适用于仅 stdin 的分段，因此像 `*` 或 `$HOME/...` 这样的模式无法被用来伪装文件读取。

### 受信任的二进制目录

安全 bin 必须从受信任的二进制目录解析（系统默认目录加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目永远不会自动受信任。默认受信任目录有意保持最小化：`/bin`、`/usr/bin`。如果你的安全 bin 可执行文件位于包管理器/用户路径中（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请显式将其添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 链接、包装器和多路复用器

只要每个顶层分段都满足 allowlist（包括安全 bin 或 Skills 自动允许），就允许使用 shell 链接（`&&`、`||`、`;`）。在 allowlist 模式下，重定向仍不受支持。命令替换（`$()` / 反引号）在 allowlist 解析期间会被拒绝，即使位于双引号内也是如此；如果你需要字面量 `$()` 文本，请使用单引号。

在 macOS 配套应用审批中，包含 shell 控制或扩展语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文本会被视为 allowlist miss，除非 shell 二进制本身已在 allowlist 中。

对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求作用域的环境变量覆盖会被缩减为一个小型显式 allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

对于 allowlist 模式下的 `allow-always` 决策，已知分发包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。shell 多路复用器（`busybox`、`toybox`）对于 shell applet（`sh`、`ash` 等）也会以相同方式解包。如果某个包装器或多路复用器无法安全解包，则不会自动持久化任何 allowlist 条目。

如果你将 `python3` 或 `node` 这类解释器加入 allowlist，建议启用
`tools.exec.strictInlineEval=true`，这样内联求值仍然需要显式审批。在严格模式下，`allow-always` 仍可持久化无害的解释器/脚本调用，但内联求值载体不会自动持久化。

### 安全 bin 与 allowlist 的区别

| 主题             | `tools.exec.safeBins`                               | allowlist（`exec-approvals.json`）                          |
| ---------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| 目标             | 自动允许狭义 stdin 过滤器                           | 显式信任特定可执行文件                                      |
| 匹配类型         | 可执行文件名 + 安全 bin argv 策略                   | 已解析可执行文件路径 glob 模式                              |
| 参数范围         | 受安全 bin 配置文件和字面 token 规则限制            | 仅做路径匹配；参数的其他责任由你自行承担                    |
| 典型示例         | `head`、`tail`、`tr`、`wc`                          | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI               |
| 最佳用途         | 管道中的低风险文本转换                              | 任何行为更广或带副作用的工具                                |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或每智能体 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或每智能体 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或每智能体 `agents.list[].tools.exec.safeBinProfiles`）。每智能体配置文件键会覆盖全局键。
- allowlist 条目存储在主机本地 `~/.openclaw/exec-approvals.json` 的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器/运行时 bin 出现在 `safeBins` 中但没有显式配置文件时，`openclaw security audit` 会发出 `tools.exec.safe_bins_interpreter_unprofiled` 警告。
- `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles.<bin>` 条目生成 `{}` 脚手架（之后请审查并收紧）。解释器/运行时 bin 不会自动生成脚手架。

自定义配置文件示例：
__OC_I18N_900000__
如果你显式将 `jq` 选择加入 `safeBins`，OpenClaw 在安全 bin 模式下仍会拒绝 `env` 内建，因此 `jq -n env` 无法在没有显式 allowlist 路径或审批提示的情况下转储主机进程环境。

## 解释器/运行时命令

带审批支持的解释器/运行时执行有意采用保守策略：

- 始终绑定精确的 argv/cwd/env 上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地文件快照。
- 仍可解析为一个直接本地文件的常见包管理器包装形式（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前解包。
- 如果 OpenClaw 无法为某个解释器/运行时命令精确识别一个具体的本地文件（例如 package scripts、eval 形式、运行时特定 loader 链，或有歧义的多文件形式），则会拒绝带审批支持的执行，而不是声称覆盖了它并不具备的语义范围。
- 对于这些工作流，请优先考虑沙箱隔离、单独的主机边界，或显式的受信任 allowlist / 完整工作流，由操作员接受更广泛的运行时语义。

当需要审批时，exec 工具会立即返回一个审批 id。使用该 id 可以关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有收到决策，该请求会被视为审批超时，并作为拒绝原因呈现。

### 后续投递行为

批准的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 轮次。

- 如果存在有效的外部投递目标（可投递渠道加目标 `to`），后续投递会使用该渠道。
- 在仅 webchat 或内部会话流中，如果没有外部目标，则后续投递保持为仅会话（`deliver: false`）。
- 如果调用方显式请求严格的外部投递，但没有可解析的外部渠道，则请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析出外部渠道，则投递会降级为仅会话，而不是失败。

## 将审批转发到聊天渠道

你可以将 exec 审批提示转发到任何聊天渠道（包括插件渠道），并使用 `/approve` 进行批准。这使用的是常规的出站投递管道。

配置：
__OC_I18N_900001__
在聊天中回复：
__OC_I18N_900002__
`/approve` 命令同时处理 exec 审批和插件审批。如果该 ID 与待处理的 exec 审批不匹配，它会自动检查插件审批。

### 插件审批转发

插件审批转发使用与 exec 审批相同的投递管道，但它拥有自己独立的 `approvals.plugin` 配置。启用或禁用其中一个不会影响另一个。
__OC_I18N_900003__
配置结构与 `approvals.exec` 完全相同：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的工作方式都一样。

支持共享交互式回复的渠道会为 exec 审批和插件审批渲染相同的审批按钮。不支持共享交互式 UI 的渠道会回退为纯文本，并附带 `/approve` 说明。

### 任意渠道中的同聊审批

当 exec 或插件审批请求源自一个可投递的聊天表面时，默认情况下，同一聊天现在可以直接使用 `/approve` 进行审批。这适用于 Slack、Matrix 和 Microsoft Teams 等渠道，以及现有的 Web UI 和终端 UI 流。

这条共享文本命令路径使用该会话的常规渠道认证模型。如果发起聊天已经能够发送命令并接收回复，那么审批请求不再需要单独的原生投递适配器才能保持待处理状态。

Discord 和 Telegram 也支持同聊 `/approve`，但即使禁用了原生审批投递，这些渠道在授权时仍会使用其已解析审批人列表。

对于 Telegram 和其他直接调用 Gateway 网关的原生审批客户端，这一回退被有意限制在“approval not found”失败场景中。真正的 exec 审批拒绝/错误不会被静默重试为插件审批。

### 原生审批投递

某些渠道还可以充当原生审批客户端。原生客户端在共享的同聊 `/approve`
流程之上，增加了审批人私信、源聊天扇出以及渠道特定的交互式审批 UX。

当可用原生审批卡片/按钮时，该原生 UI 是面向智能体的主要路径。除非工具结果表明聊天审批不可用，或者手动审批是唯一剩余路径，否则智能体不应再额外回显一个重复的纯聊天 `/approve` 命令。

通用模型：

- 主机 exec 策略仍然决定是否需要 exec 审批
- `approvals.exec` 控制是否将审批提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否充当原生审批客户端

当以下条件全部满足时，原生审批客户端会自动启用“审批人私信优先”投递：

- 该渠道支持原生审批投递
- 可以从显式 `execApprovals.approvers` 或该渠道文档化的回退来源中解析出审批人
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

设置 `enabled: false` 可显式禁用某个原生审批客户端。设置 `enabled: true` 可在审批人可解析时强制启用它。公共源聊天投递仍通过 `channels.<channel>.execApprovals.target` 显式控制。

常见问题：[为什么聊天审批会有两个 exec 审批配置？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生审批客户端在共享的同聊 `/approve` 流程和共享审批按钮之上，增加了私信路由和可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 及类似的可投递聊天使用常规渠道认证模型处理同聊 `/approve`
- 当原生审批客户端自动启用时，默认原生投递目标是审批人私信
- 对于 Discord 和 Telegram，只有已解析的审批人可以批准或拒绝
- Discord 审批人可以是显式配置（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram 审批人可以是显式配置（`execApprovals.approvers`），也可以从现有所有者配置推断（`allowFrom`，以及在支持时的直接消息 `defaultTo`）
- Slack 审批人可以是显式配置（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留审批 id 类型，因此 `plugin:` id 可以解析到插件审批，而无需第二层 Slack 本地回退
- Matrix 原生私信/渠道路由和反应快捷方式同时处理 exec 审批和插件审批；插件授权仍来自 `channels.matrix.dm.allowFrom`
- 请求方不需要是审批人
- 当源聊天本身已支持命令和回复时，它可以直接使用 `/approve` 进行审批
- 原生 Discord 审批按钮按审批 id 类型路由：`plugin:` id 直接进入插件审批，其他一切都进入 exec 审批
- 原生 Telegram 审批按钮遵循与 `/approve` 相同的有界 exec 到插件回退
- 当原生 `target` 启用源聊天投递时，审批提示会包含命令文本
- 待处理的 exec 审批默认会在 30 分钟后过期
- 如果没有操作员 UI 或已配置的审批客户端可以接收请求，提示会回退到 `askFallback`

Telegram 默认投递到审批人私信（`target: "dm"`）。如果你希望审批提示也出现在源 Telegram 聊天/话题中，可以切换为 `channel` 或 `both`。对于 Telegram 论坛话题，OpenClaw 会保留审批提示和审批后后续消息所属的话题。

请参阅：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全说明：

- Unix socket 模式 `0600`，令牌存储在 `exec-approvals.json` 中。
- 同一 UID 对等方检查。
- 挑战/响应（nonce + HMAC token + 请求哈希）+ 短 TTL。

## 相关

- [Exec approvals](/zh-CN/tools/exec-approvals) — 核心策略和审批流程
- [Exec 工具](/zh-CN/tools/exec)
- [增强模式](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills) — 基于 Skills 的自动允许行为
