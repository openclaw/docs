---
read_when:
    - 配置安全 bin 或自定义 safe-bin 配置文件
    - 将审批转发到 Slack/Discord/Telegram 或其他聊天渠道
    - 为渠道实现原生审批客户端
summary: 高级 exec 审批：安全二进制文件、解释器绑定、审批转发、原生交付
title: 执行审批 — 高级
x-i18n:
    generated_at: "2026-04-29T05:41:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8a72ca1d23e55dc198ae3c5ad55a57660c2111feebfb89f08d8fa9584e4337
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

高级 exec 审批主题：`safeBins` 快速路径、解释器/运行时绑定，以及向聊天渠道转发审批（包括原生投递）。关于核心策略和审批流程，请参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

## 安全二进制文件（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制文件（例如 `cut`），它们可以在允许列表模式下运行，而**不需要**显式允许列表条目。安全二进制文件会拒绝位置文件参数和类似路径的令牌，因此它们只能处理传入流。请把它视为面向流过滤器的狭窄快速路径，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）加入 `safeBins`。如果某个命令按设计可以求值代码、执行子命令或读取文件，请优先使用显式允许列表条目，并保持审批提示启用。自定义安全二进制文件必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式 profile。
</Warning>

默认安全二进制文件：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择加入，请为它们的非 stdin 工作流保留显式允许列表条目。对于 safe-bin 模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置模式形式会被拒绝，因此文件操作数无法伪装成有歧义的位置参数。

### Argv 验证和被拒绝的标志

验证仅基于 argv 形状确定（不会检查主机文件系统是否存在），这可以防止允许/拒绝差异带来的文件存在性 oracle 行为。默认安全二进制文件会拒绝面向文件的选项；长选项采用失败关闭方式验证（未知标志和有歧义的缩写都会被拒绝）。

按 safe-bin profile 列出的被拒绝标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二进制文件还会强制 argv 令牌在执行时被当作**字面文本**处理（不会进行 glob 展开，也不会展开 `$VARS`），仅限 stdin 段，因此类似 `*` 或 `$HOME/...` 的模式不能用来伪装文件读取。

### 受信任的二进制目录

安全二进制文件必须从受信任的二进制目录解析（系统默认目录加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会被自动信任。默认受信任目录有意保持最小化：`/bin`、`/usr/bin`。如果你的 safe-bin 可执行文件位于包管理器/用户路径中（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式加入 `tools.exec.safeBinTrustedDirs`。

### Shell 链接、包装器和多路复用器

当每个顶层段都满足允许列表（包括安全二进制文件或 Skills 自动允许）时，允许 shell 链接（`&&`、`||`、`;`）。允许列表模式仍不支持重定向。命令替换（`$()` / 反引号）会在允许列表解析期间被拒绝，包括在双引号内；如果需要字面 `$()` 文本，请使用单引号。

在 macOS 配套应用审批中，包含 shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文本会被视为允许列表未命中，除非 shell 二进制文件本身已被加入允许列表。

对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求作用域的 env 覆盖会被缩减为一个小型显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

在允许列表模式下，对于 `allow-always` 决策，已知的调度包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）会以相同方式为 shell applet（`sh`、`ash` 等）解包。如果包装器或多路复用器无法安全解包，则不会自动持久化任何允许列表条目。

如果你将 `python3` 或 `node` 等解释器加入允许列表，请优先设置 `tools.exec.strictInlineEval=true`，这样内联 eval 仍需要显式审批。在严格模式下，`allow-always` 仍可持久化良性的解释器/脚本调用，但内联 eval 载体不会自动持久化。

### 安全二进制文件与允许列表

| 主题             | `tools.exec.safeBins`                                  | 允许列表（`exec-approvals.json`）                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目标             | 自动允许狭窄的 stdin 过滤器                            | 显式信任特定可执行文件                                                             |
| 匹配类型         | 可执行文件名称 + safe-bin argv 策略                    | 已解析的可执行文件路径 glob，或对 PATH 调用命令使用裸命令名 glob                  |
| 参数范围         | 受 safe-bin profile 和字面令牌规则限制                 | 只匹配路径；其他参数由你负责                                                       |
| 典型示例         | `head`、`tail`、`tr`、`wc`                             | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI                                      |
| 最佳用途         | 管道中的低风险文本转换                                 | 任何具备更广行为或副作用的工具                                                     |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或每个智能体的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或每个智能体的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或每个智能体的 `agents.list[].tools.exec.safeBinProfiles`）。每个智能体的 profile 键会覆盖全局键。
- 允许列表条目位于主机本地 `~/.openclaw/exec-approvals.json` 的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器/运行时二进制文件出现在 `safeBins` 中但没有显式 profile 时，`openclaw security audit` 会用 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以将缺失的自定义 `safeBinProfiles.<bin>` 条目搭建为 `{}`（之后请审查并收紧）。解释器/运行时二进制文件不会被自动搭建。

自定义 profile 示例：
__OC_I18N_900000__
如果你显式选择将 `jq` 加入 `safeBins`，OpenClaw 仍会在 safe-bin 模式下拒绝 `env` 内建命令，因此 `jq -n env` 不能在没有显式允许列表路径或审批提示的情况下转储主机进程环境。

## 解释器/运行时命令

由审批支持的解释器/运行时运行有意保持保守：

- 始终绑定精确的 argv/cwd/env 上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地文件快照。
- 仍可解析到一个直接本地文件的常见包管理器包装器形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前解包。
- 如果 OpenClaw 无法为解释器/运行时命令准确识别一个具体的本地文件（例如包脚本、eval 形式、运行时特定加载器链，或有歧义的多文件形式），由审批支持的执行会被拒绝，而不是声称拥有它实际没有的语义覆盖。
- 对于这些工作流，请优先使用沙箱隔离、单独的主机边界，或显式受信任的允许列表/完整工作流，由操作员接受更广泛的运行时语义。

需要审批时，exec 工具会立即返回一个审批 ID。使用该 ID 关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有收到决策，请求会被视为审批超时，并作为拒绝原因呈现。

### 后续投递行为

已批准的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 轮次。

- 如果存在有效的外部投递目标（可投递渠道加目标 `to`），后续投递会使用该渠道。
- 在只有 webchat 或没有外部目标的内部会话流中，后续投递保持仅会话（`deliver: false`）。
- 如果调用方显式请求严格外部投递，但没有可解析的外部渠道，请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析外部渠道，投递会降级为仅会话，而不是失败。

## 向聊天渠道转发审批

你可以将 exec 审批提示转发到任何聊天渠道（包括插件渠道），并用 `/approve` 批准它们。这会使用正常的出站投递管线。

配置：
__OC_I18N_900001__
在聊天中回复：
__OC_I18N_900002__
`/approve` 命令同时处理 exec 审批和插件审批。如果 ID 不匹配待处理的 exec 审批，它会自动改为检查插件审批。

### 插件审批转发

插件审批转发使用与 exec 审批相同的投递管线，但在 `approvals.plugin` 下拥有自己的独立配置。启用或停用其中一个不会影响另一个。
__OC_I18N_900003__
配置形状与 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的工作方式一致。

支持共享交互式回复的渠道会为 exec 和插件审批渲染相同的审批按钮。没有共享交互式 UI 的渠道会回退到带有 `/approve` 说明的纯文本。

### 任何渠道上的同一聊天审批

当 exec 或插件审批请求来自可投递的聊天界面时，同一个聊天现在默认可以用 `/approve` 批准它。这适用于 Slack、Matrix 和 Microsoft Teams 等渠道，以及现有的 Web UI 和终端 UI 流。

此共享文本命令路径使用该对话的正常渠道鉴权模型。如果发起聊天已经可以发送命令并接收回复，审批请求不再需要单独的原生投递适配器才能保持待处理状态。

Discord 和 Telegram 也支持同一聊天 `/approve`，但这些渠道即使在禁用原生审批投递时，仍会使用其解析出的审批人列表进行授权。

对于 Telegram 和其他直接调用 Gateway 网关的原生审批客户端，此回退有意限定在“未找到审批”的失败场景。真实的 exec 审批拒绝/错误不会静默重试为插件审批。

### 原生审批投递

某些渠道也可以充当原生审批客户端。原生客户端会在共享的同一聊天 `/approve` 流程之上，增加审批人私信、来源聊天扇出和渠道特定的交互式审批体验。

当原生审批卡片/按钮可用时，该原生 UI 是主要的面向智能体路径。除非工具结果表明聊天审批不可用，或手动审批是唯一剩余路径，否则智能体不应再回显重复的纯聊天 `/approve` 命令。

如果已配置原生审批客户端，但发起渠道没有活跃的原生运行时，OpenClaw 会保持本地确定性的 `/approve` 提示可见。如果原生运行时处于活跃状态并尝试投递，但没有目标收到卡片，OpenClaw 会在同一聊天中发送回退通知，包含准确的 `/approve <id> <decision>` 命令，以便该请求仍可被处理。

通用模型：

- 主机 exec 策略仍决定是否需要 exec 审批
- `approvals.exec` 控制将审批提示转发到其他聊天目的地
- `channels.<channel>.execApprovals` 控制该渠道是否作为原生审批客户端

当以下条件全部为真时，原生审批客户端会自动启用私信优先投递：

- 渠道支持原生审批投递
- 审批人可以从显式的 `execApprovals.approvers` 或所有者身份（例如 `commands.ownerAllowFrom`）解析出来
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

设置 `enabled: false` 可显式禁用原生审批客户端。设置 `enabled: true` 可在审批人可解析时强制启用它。公共来源聊天投递仍通过 `channels.<channel>.execApprovals.target` 显式配置。

常见问题：[为什么聊天审批有两套 exec 审批配置？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生审批客户端在共享的同一聊天 `/approve` 流程和共享审批按钮之上，增加了私信路由和可选渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可投递聊天使用常规渠道认证模型来处理同一聊天中的 `/approve`
- 当原生审批客户端自动启用时，默认原生投递目标是审批人私信
- 对于 Discord 和 Telegram，只有已解析的审批人可以批准或拒绝
- Discord 审批人可以显式配置（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram 审批人可以显式配置（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 审批人可以显式配置（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留审批 id 类型，因此 `plugin:` id 可以解析为插件审批，而无需第二层 Slack 本地回退
- Matrix 原生私信/渠道路由和回应快捷操作同时处理 exec 和插件审批；插件授权仍来自 `channels.matrix.dm.allowFrom`
- Matrix 原生提示会在第一个提示事件中包含 `com.openclaw.approval` 自定义事件内容，使支持 OpenClaw 的 Matrix 客户端可以读取结构化审批状态，而标准客户端仍保留纯文本 `/approve` 回退
- 请求者不需要是审批人
- 当发起聊天已支持命令和回复时，可以直接用 `/approve` 审批
- 原生 Discord 审批按钮按审批 id 类型路由：`plugin:` id 会直接进入插件审批，其他所有 id 进入 exec 审批
- 原生 Telegram 审批按钮遵循与 `/approve` 相同的有界 exec 到插件回退
- 当原生 `target` 启用来源聊天投递时，审批提示会包含命令文本
- 默认情况下，待处理的 exec 审批会在 30 分钟后过期
- 如果没有操作员 UI 或已配置的审批客户端能够接受请求，提示会回退到 `askFallback`

敏感的仅限所有者的群组命令（例如 `/diagnostics` 和 `/export-trajectory`）会使用私有所有者路由发送审批提示和最终结果。OpenClaw 会先尝试在所有者运行命令的同一表面上使用私有路由。如果该表面没有私有所有者路由，则会回退到 `commands.ownerAllowFrom` 中第一个可用的所有者路由，因此当 Telegram 是已配置的主要私有界面时，Discord 群组命令仍可以将审批和结果发送到所有者的 Telegram 私信。群组聊天只会收到一条简短确认。

Telegram 默认使用审批人私信（`target: "dm"`）。当你希望审批提示也出现在发起的 Telegram 聊天/话题中时，可以切换到 `channel` 或 `both`。对于 Telegram 论坛话题，OpenClaw 会为审批提示和审批后跟进保留该话题。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全说明：

- Unix socket 模式 `0600`，令牌存储在 `exec-approvals.json` 中。
- 同 UID 对等端检查。
- 挑战/响应（nonce + HMAC 令牌 + 请求哈希）+ 短 TTL。

## 相关

- [Exec 审批](/zh-CN/tools/exec-approvals) — 核心策略和审批流程
- [Exec 工具](/zh-CN/tools/exec)
- [提权模式](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills) — 基于 skill 的自动允许行为
