---
read_when:
    - 配置安全二进制文件或自定义安全二进制文件配置档案
    - 将批准转发到 Slack/Discord/Telegram 或其他聊天渠道
    - 为渠道实现原生批准客户端
summary: 高级 exec 批准：安全二进制文件、解释器绑定、批准转发、本地交付
title: exec 批准——高级
x-i18n:
    generated_at: "2026-04-23T23:21:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a24a3539126b0f0fd11696c31efc8a6a9a4262fe4cd89bf456ff92a4f05c36c
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

高级 exec 批准主题：`safeBins` 快速路径、解释器/运行时绑定，以及向聊天渠道转发批准（包括原生交付）。
有关核心策略和批准流程，请参见 [Exec approvals](/zh-CN/tools/exec-approvals)。

## 安全二进制文件（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制文件（例如 `cut`），它们在允许列表模式下**无需**显式允许列表条目即可运行。安全二进制文件会拒绝位置文件参数和类似路径的令牌，因此它们只能对输入流进行操作。请将其视为面向流过滤器的狭窄快速路径，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果某个命令能够按设计执行代码求值、执行子命令或读取文件，请优先使用显式允许列表条目，并保持启用批准提示。自定义安全二进制文件必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置档案。
</Warning>

默认安全二进制文件：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请为其非 stdin 工作流保留显式允许列表条目。对于安全二进制文件模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置模式形式会被拒绝，这样文件操作数就不能伪装成含糊的位置参数。

### Argv 验证与被拒绝的标志

验证仅基于 argv 形状进行确定性判断（不检查主机文件系统中的存在性），这可以防止通过允许/拒绝差异形成文件存在性预言机行为。面向文件的选项会被默认安全二进制文件拒绝；长选项采用失败即关闭的验证方式（未知标志和含糊缩写都会被拒绝）。

按安全二进制文件配置档案划分的被拒绝标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`：`--dereference-recursive`、`--directories`、`--exclude-from`、`--file`、`--recursive`、`-R`、`-d`、`-f`、`-r`
- `jq`：`--argfile`、`--from-file`、`--library-path`、`--rawfile`、`--slurpfile`、`-L`、`-f`
- `sort`：`--compress-program`、`--files0-from`、`--output`、`--random-source`、`--temporary-directory`、`-T`、`-o`
- `wc`：`--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二进制文件还会在执行时强制将 argv 令牌视为**字面文本**（不进行通配符展开，也不展开 `$VARS`），适用于仅 stdin 的命令段，因此像 `*` 或 `$HOME/...` 这样的模式不能被用来伪装文件读取。

### 受信任的二进制文件目录

安全二进制文件必须从受信任的二进制文件目录解析（系统默认目录，加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会被自动视为受信任。默认受信任目录刻意保持最小范围：`/bin`、`/usr/bin`。如果你的安全二进制文件可执行文件位于包管理器/用户路径中（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 链接、包装器与多路复用器

当每个顶层命令段都满足允许列表要求时，允许使用 shell 链接（`&&`、`||`、`;`），其中包括安全二进制文件或 Skills 自动允许。重定向在允许列表模式下仍然不受支持。命令替换（`$()` / 反引号）会在允许列表解析期间被拒绝，即使它位于双引号内部也是如此；如果你需要字面的 `$()` 文本，请使用单引号。

在 macOS 配套应用批准中，包含 shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文本会被视为允许列表未命中，除非 shell 二进制文件本身已被加入允许列表。

对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的环境变量覆盖会被缩减为一个小型显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

对于允许列表模式中的 `allow-always` 决策，已知的分发包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）对于 shell applet（`sh`、`ash` 等）也会以相同方式解包。如果某个包装器或多路复用器无法被安全解包，则不会自动持久化任何允许列表条目。

如果你将 `python3` 或 `node` 这样的解释器加入允许列表，建议启用 `tools.exec.strictInlineEval=true`，这样内联求值仍然需要显式批准。在严格模式下，`allow-always` 仍然可以持久化无害的解释器/脚本调用，但承载内联求值的调用不会被自动持久化。

### 安全二进制文件与允许列表

| 主题 | `tools.exec.safeBins` | 允许列表（`exec-approvals.json`） |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 目标 | 自动允许狭窄的 stdin 过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名称 + 安全二进制文件 argv 策略 | 已解析可执行文件路径 glob 模式 |
| 参数范围 | 受安全二进制文件配置档案和字面令牌规则限制 | 仅匹配路径；参数的其他部分由你自行负责 |
| 典型示例 | `head`、`tail`、`tr`、`wc` | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI |
| 最佳用途 | 管道中的低风险文本转换 | 任何具有更广泛行为或副作用的工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体设置的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体设置的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体设置的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体设置的配置档案键会覆盖全局键。
- 允许列表条目存放在主机本地的 `~/.openclaw/exec-approvals.json` 中的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器/运行时二进制文件出现在 `safeBins` 中且没有显式配置档案时，`openclaw security audit` 会给出 `tools.exec.safe_bins_interpreter_unprofiled` 警告。
- `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles.<bin>` 条目搭建 `{}` 骨架（之后请审查并收紧）。解释器/运行时二进制文件不会被自动搭建骨架。

自定义配置档案示例：
__OC_I18N_900000__
如果你显式选择将 `jq` 加入 `safeBins`，OpenClaw 在安全二进制文件模式下仍会拒绝 `env` 内建，因此 `jq -n env` 不能在没有显式允许列表路径或批准提示的情况下导出主机进程环境。

## 解释器/运行时命令

基于批准的解释器/运行时执行有意采取保守策略：

- 始终绑定精确的 argv/cwd/env 上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地文件快照。
- 仍然能够解析为单个直接本地文件的常见包管理器包装形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前被解包。
- 如果 OpenClaw 无法为解释器/运行时命令精确识别唯一一个具体本地文件（例如包脚本、eval 形式、运行时特定加载器链或含糊的多文件形式），则基于批准的执行会被拒绝，而不是声称自己覆盖了实际上并不具备的语义范围。
- 对于这些工作流，请优先考虑沙箱隔离、单独的主机边界，或显式受信任的允许列表/完整工作流，在这些场景中由操作员接受更广泛的运行时语义。

当需要批准时，exec 工具会立即返回一个批准 id。使用该 id 关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时之前没有收到决策，请求会被视为批准超时，并作为拒绝原因呈现。

### 后续交付行为

在已批准的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 回合。

- 如果存在有效的外部交付目标（可交付渠道加上目标 `to`），后续交付会使用该渠道。
- 在仅 webchat 或仅内部会话流程中，如果没有外部目标，后续交付会保持为仅会话（`deliver: false`）。
- 如果调用方显式请求严格的外部交付，但没有可解析的外部渠道，请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析任何外部渠道，交付会降级为仅会话，而不是失败。

## 向聊天渠道转发批准

你可以将 exec 批准提示转发到任何聊天渠道（包括渠道插件），并使用 `/approve` 进行批准。这会使用正常的出站交付管道。

配置：
__OC_I18N_900001__
在聊天中回复：
__OC_I18N_900002__
`/approve` 命令同时处理 exec 批准和插件批准。如果该 ID 与待处理的 exec 批准不匹配，它会自动改为检查插件批准。

### 插件批准转发

插件批准转发使用与 exec 批准相同的交付管道，但它在 `approvals.plugin` 下拥有自己独立的配置。启用或禁用其中一个不会影响另一个。
__OC_I18N_900003__
该配置结构与 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的工作方式完全一致。

支持共享交互式回复的渠道会为 exec 批准和插件批准渲染相同的批准按钮。不支持共享交互式 UI 的渠道会回退为纯文本，并附带 `/approve` 说明。

### 任意渠道中的同聊天批准

当 exec 或插件批准请求来自可交付的聊天界面时，现在默认可以在同一聊天中通过 `/approve` 进行批准。这适用于 Slack、Matrix 和 Microsoft Teams 等渠道，也适用于现有的 Web UI 和终端 UI 流程。

这一路径共享的文本命令使用该会话的正常渠道身份验证模型。如果发起请求的聊天本来就能够发送命令并接收回复，那么批准请求不再需要单独的原生交付适配器才能保持待处理状态。

Discord 和 Telegram 也支持在同一聊天中使用 `/approve`，但即使禁用了原生批准交付，这些渠道在授权时仍然会使用其已解析的批准人列表。

对于 Telegram 和其他直接调用 Gateway 网关的原生批准客户端，这个回退有意被限制在“找不到批准”失败场景。真正的 exec 批准拒绝/错误不会被静默重试为插件批准。

### 原生批准交付

某些渠道还可以充当原生批准客户端。原生客户端会在共享的同聊天 `/approve` 流程之上增加批准人私信、原始聊天扇出以及渠道特定的交互式批准 UX。

当原生批准卡片/按钮可用时，该原生 UI 是面向智能体的主要路径。除非工具结果表明聊天批准不可用，或手动批准是唯一剩余路径，否则智能体不应再额外回显重复的纯聊天 `/approve` 命令。

通用模型：

- 主机 exec 策略仍然决定 exec 是否需要批准
- `approvals.exec` 控制将批准提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否充当原生批准客户端

当以下条件全部满足时，原生批准客户端会自动启用优先发送到私信的交付方式：

- 该渠道支持原生批准交付
- 可以从显式的 `execApprovals.approvers` 或该渠道文档记录的回退来源中解析出批准人
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

设置 `enabled: false` 可以显式禁用原生批准客户端。设置 `enabled: true` 可以在批准人可解析时强制启用它。公开的原始聊天交付仍通过 `channels.<channel>.execApprovals.target` 显式控制。

常见问题：[为什么聊天批准会有两个 exec 批准配置？](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生批准客户端在共享的同聊天 `/approve` 流程和共享批准按钮的基础上，增加了私信路由和可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可交付聊天，都会对同聊天 `/approve` 使用正常的渠道身份验证模型
- 当原生批准客户端自动启用时，默认的原生交付目标是批准人私信
- 对于 Discord 和 Telegram，只有已解析的批准人才能批准或拒绝
- Discord 批准人可以是显式指定的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断得出
- Telegram 批准人可以是显式指定的（`execApprovals.approvers`），也可以从现有的所有者配置推断得出（`allowFrom`，以及在支持时的私信 `defaultTo`）
- Slack 批准人可以是显式指定的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断得出
- Slack 原生按钮会保留批准 id 类型，因此 `plugin:` id 可以解析为插件批准，而无需第二层 Slack 本地回退逻辑
- Matrix 原生私信/渠道路由和 reaction 快捷方式同时处理 exec 批准和插件批准；插件授权仍然来自 `channels.matrix.dm.allowFrom`
- 请求者不需要是批准人
- 当原始聊天本身已支持命令和回复时，可以直接通过 `/approve` 在该聊天中完成批准
- 原生 Discord 批准按钮按批准 id 类型进行路由：`plugin:` id 会直接进入插件批准，其余所有情况都会进入 exec 批准
- 原生 Telegram 批准按钮遵循与 `/approve` 相同的受限 exec 到插件回退逻辑
- 当原生 `target` 启用原始聊天交付时，批准提示会包含命令文本
- 待处理的 exec 批准默认会在 30 分钟后过期
- 如果没有操作员 UI 或已配置的批准客户端可以接受请求，提示会回退到 `askFallback`

Telegram 默认发送到批准人私信（`target: "dm"`）。如果你希望批准提示也出现在发起请求的 Telegram 聊天/话题中，可以切换为 `channel` 或 `both`。对于 Telegram 论坛话题，OpenClaw 会在批准提示和批准后的后续消息中保留该话题。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全说明：

- Unix socket 模式为 `0600`，token 存储在 `exec-approvals.json` 中。
- 同一 UID 对等方检查。
- 质询/响应（nonce + HMAC token + 请求哈希）+ 短 TTL。

## 相关内容

- [Exec approvals](/zh-CN/tools/exec-approvals) —— 核心策略和批准流程
- [Exec tool](/zh-CN/tools/exec)
- [Elevated mode](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills) —— 基于 Skills 的自动允许行为
