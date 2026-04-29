---
read_when:
    - 配置 safe bins 或自定义 safe-bin 配置文件
    - 将审批转发到 Slack/Discord/Telegram 或其他聊天渠道
    - 为渠道实现原生审批客户端
summary: 高级 exec 审批：安全二进制文件、解释器绑定、审批转发、原生交付
title: 执行审批 — 高级
x-i18n:
    generated_at: "2026-04-29T00:30:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad31e606eb8d0a5d99c59a53feee82212ee7d4fad7346c183315d6257a41cf43
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

高级 exec 批准主题：`safeBins` 快速路径、解释器/运行时绑定，以及将批准转发到聊天渠道（包括原生投递）。关于核心策略和批准流程，请参阅 [Exec 批准](/zh-CN/tools/exec-approvals)。

## 安全二进制文件（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制文件（例如 `cut`），它们可以在允许列表模式下运行，**无需**显式允许列表条目。安全二进制文件会拒绝位置文件参数和类似路径的 token，因此它们只能处理传入流。请将其视为流过滤器的窄范围快速路径，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果某个命令按设计可以求值代码、执行子命令或读取文件，请优先使用显式允许列表条目，并保持批准提示启用。自定义安全二进制文件必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置档案。
</Warning>

默认安全二进制文件：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择加入，请为它们的非 stdin 工作流保留显式允许列表条目。对于安全二进制文件模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置模式形式会被拒绝，因此文件操作数不能伪装成含糊的位置参数。

### Argv 验证和被拒绝的标志

验证仅根据 argv 形状确定（不检查主机文件系统是否存在），这可以防止通过允许/拒绝差异产生文件存在性探测行为。面向文件的选项会被默认安全二进制文件拒绝；长选项以失败关闭方式验证（未知标志和含糊缩写会被拒绝）。

按安全二进制文件配置档案划分的被拒绝标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二进制文件还会强制 argv token 在执行时被视为**字面文本**（不进行 glob 展开，也不展开 `$VARS`），用于仅 stdin 的片段，因此不能用 `*` 或 `$HOME/...` 这类模式来夹带文件读取。

### 受信任的二进制文件目录

安全二进制文件必须从受信任的二进制文件目录解析（系统默认值加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会被自动信任。默认受信任目录刻意保持最小：`/bin`、`/usr/bin`。如果你的安全二进制文件可执行文件位于包管理器/用户路径中（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 链接、包装器和多路复用器

当每个顶层片段都满足允许列表（包括安全二进制文件或 Skills 自动允许）时，允许 shell 链接（`&&`、`||`、`;`）。允许列表模式仍不支持重定向。命令替换（`$()` / 反引号）会在允许列表解析期间被拒绝，包括在双引号内部；如果你需要字面 `$()` 文本，请使用单引号。

在 macOS 配套应用批准中，包含 shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文本会被视为允许列表未命中，除非 shell 二进制文件本身已被加入允许列表。

对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围的环境覆盖会缩减为一小组显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

对于允许列表模式下的 `allow-always` 决策，已知分发包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）会以相同方式对 shell applet（`sh`、`ash` 等）进行解包。如果无法安全解包包装器或多路复用器，则不会自动持久化允许列表条目。

如果你将 `python3` 或 `node` 这类解释器加入允许列表，请优先设置 `tools.exec.strictInlineEval=true`，这样内联求值仍需要显式批准。在严格模式下，`allow-always` 仍可持久化良性的解释器/脚本调用，但内联求值载体不会自动持久化。

### 安全二进制文件与允许列表

| 主题             | `tools.exec.safeBins`                                  | 允许列表（`exec-approvals.json`）                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目标             | 自动允许窄范围 stdin 过滤器                            | 显式信任特定可执行文件                                                             |
| 匹配类型         | 可执行文件名称 + 安全二进制文件 argv 策略              | 已解析可执行文件路径 glob，或 PATH 调用命令的裸命令名 glob                         |
| 参数范围         | 受安全二进制文件配置档案和字面 token 规则限制          | 仅路径匹配；参数在其他方面由你负责                                                 |
| 典型示例         | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, 自定义 CLI                                      |
| 最佳用途         | 管道中的低风险文本转换                                 | 任何具有更广行为或副作用的工具                                                     |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体设置的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体设置的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体设置的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体设置的配置档案键会覆盖全局键。
- 允许列表条目位于主机本地 `~/.openclaw/exec-approvals.json` 的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器/运行时二进制文件出现在 `safeBins` 中但没有显式配置档案时，`openclaw security audit` 会用 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以将缺失的自定义 `safeBinProfiles.<bin>` 条目脚手架生成为 `{}`（之后请审查并收紧）。解释器/运行时二进制文件不会被自动脚手架生成。

自定义配置档案示例：
__OC_I18N_900000__
如果你显式将 `jq` 加入 `safeBins`，OpenClaw 仍会在安全二进制文件模式下拒绝 `env` 内建命令，因此 `jq -n env` 不能在没有显式允许列表路径或批准提示的情况下转储主机进程环境。

## 解释器/运行时命令

由批准支持的解释器/运行时运行刻意保持保守：

- 始终绑定精确的 argv/cwd/env 上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地文件快照。
- 仍解析到一个直接本地文件的常见包管理器包装器形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前解包。
- 如果 OpenClaw 无法为解释器/运行时命令准确识别一个具体的本地文件（例如包脚本、eval 形式、运行时特定加载器链，或含糊的多文件形式），由批准支持的执行会被拒绝，而不是声称拥有它并不具备的语义覆盖。
- 对于这些工作流，请优先使用沙箱隔离、单独的主机边界，或显式受信任的允许列表/完整工作流，由操作者接受更宽泛的运行时语义。

需要批准时，exec 工具会立即返回一个批准 id。使用该 id 关联后续系统事件（`Exec finished` / `Exec denied`）。如果超时前没有决策到达，请求会被视为批准超时，并作为拒绝原因呈现。

### 后续投递行为

批准的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 轮次。

- 如果存在有效的外部投递目标（可投递渠道加目标 `to`），后续投递会使用该渠道。
- 在仅 webchat 或没有外部目标的内部会话流程中，后续投递会保持仅会话（`deliver: false`）。
- 如果调用方显式请求严格外部投递，但没有可解析的外部渠道，请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析外部渠道，投递会降级为仅会话，而不是失败。

## 将批准转发到聊天渠道

你可以将 exec 批准提示转发到任何聊天渠道（包括插件渠道），并用 `/approve` 批准它们。这会使用正常的出站投递管道。

配置：
__OC_I18N_900001__
在聊天中回复：
__OC_I18N_900002__
`/approve` 命令同时处理 exec 批准和插件批准。如果 ID 不匹配任何待处理的 exec 批准，它会自动改为检查插件批准。

### 插件批准转发

插件批准转发使用与 exec 批准相同的投递管道，但在 `approvals.plugin` 下拥有独立配置。启用或禁用其中一个不会影响另一个。
__OC_I18N_900003__
配置形状与 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的工作方式相同。

支持共享交互式回复的渠道会为 exec 和插件批准呈现相同的批准按钮。没有共享交互式 UI 的渠道会回退为带 `/approve` 说明的纯文本。

### 任意渠道上的同聊天批准

当 exec 或插件批准请求源自可投递聊天表面时，默认情况下，同一聊天现在可以用 `/approve` 批准它。除现有的 Web UI 和终端 UI 流程外，这也适用于 Slack、Matrix 和 Microsoft Teams 等渠道。

这个共享文本命令路径使用该会话的正常渠道认证模型。如果发起聊天已经可以发送命令并接收回复，批准请求就不再需要单独的原生投递适配器来保持待处理状态。

Discord 和 Telegram 也支持同聊天 `/approve`，但即使原生批准投递已禁用，这些渠道仍会使用其已解析的批准者列表进行授权。

对于 Telegram 和其他直接调用 Gateway 网关的原生批准客户端，此回退刻意限定为“未找到批准”失败。真实的 exec 批准拒绝/错误不会静默重试为插件批准。

### 原生批准投递

某些渠道也可以充当原生批准客户端。原生客户端会在共享的同聊天 `/approve` 流程之上，添加批准者私信、源聊天扇出和渠道特定的交互式批准 UX。

当原生批准卡片/按钮可用时，该原生 UI 是面向智能体的主要路径。除非工具结果说明聊天批准不可用，或手动批准是唯一剩余路径，否则智能体不应再回显重复的纯聊天
`/approve` 命令。

通用模型：

- 主机 exec 策略仍决定是否需要 exec 批准
- `approvals.exec` 控制将批准提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否作为原生批准客户端

当以下条件全部为真时，原生批准客户端会自动启用私信优先投递：

- 该渠道支持原生批准投递
- 可以从显式的 `execApprovals.approvers` 或所有者身份（例如 `commands.ownerAllowFrom`）解析批准者
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

设置 `enabled: false` 可显式禁用原生批准客户端。设置 `enabled: true` 可在批准者可解析时强制启用它。公开的原始聊天投递仍通过
`channels.<channel>.execApprovals.target` 显式配置。

常见问题：[为什么聊天批准有两个 exec 批准配置？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生批准客户端在共享的同一聊天 `/approve` 流程和共享批准按钮之上，添加了私信路由和可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可投递聊天，会对同一聊天 `/approve` 使用普通渠道认证模型
- 当原生批准客户端自动启用时，默认的原生投递目标是批准者私信
- 对于 Discord 和 Telegram，只有已解析的批准者可以批准或拒绝
- Discord 批准者可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram 批准者可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 批准者可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留批准 ID 类型，因此 `plugin:` ID 可以解析插件批准，而无需第二层 Slack 本地回退
- Matrix 原生私信/渠道路由和回应快捷方式同时处理 exec 和插件批准；插件授权仍来自 `channels.matrix.dm.allowFrom`
- Matrix 原生提示会在第一个提示事件中包含 `com.openclaw.approval` 自定义事件内容，因此支持 OpenClaw 的 Matrix 客户端可以读取结构化批准状态，而普通客户端仍保留纯文本 `/approve` 回退
- 请求者不需要是批准者
- 当发起聊天已经支持命令和回复时，可以直接用 `/approve` 批准
- 原生 Discord 批准按钮会按批准 ID 类型路由：`plugin:` ID 直接进入插件批准，其他所有内容进入 exec 批准
- 原生 Telegram 批准按钮遵循与 `/approve` 相同的有界 exec 到插件回退
- 当原生 `target` 启用原始聊天投递时，批准提示会包含命令文本
- 待处理的 exec 批准默认会在 30 分钟后过期
- 如果没有任何操作员 UI 或已配置的批准客户端可以接收请求，提示会回退到 `askFallback`

敏感的仅限所有者的群组命令（例如 `/diagnostics` 和 `/export-trajectory`）会对批准提示和最终结果使用私有所有者路由。OpenClaw 会先尝试在所有者运行命令的同一界面上使用私有路由。如果该界面没有私有所有者路由，则回退到 `commands.ownerAllowFrom` 中第一个可用的所有者路由，因此当 Telegram 是已配置的主要私有界面时，Discord 群组命令仍可将批准和结果发送到所有者的 Telegram 私信。群聊只会收到一条简短确认。

Telegram 默认使用批准者私信（`target: "dm"`）。当你希望批准提示也显示在发起的 Telegram 聊天/话题中时，可以切换到 `channel` 或 `both`。对于 Telegram 论坛话题，OpenClaw 会为批准提示和批准后的后续消息保留该话题。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全说明：

- Unix 套接字模式 `0600`，令牌存储在 `exec-approvals.json` 中。
- 同一 UID 对端检查。
- 质询/响应（nonce + HMAC 令牌 + 请求哈希）+ 短 TTL。

## 相关内容

- [Exec 批准](/zh-CN/tools/exec-approvals) — 核心策略和批准流程
- [Exec 工具](/zh-CN/tools/exec)
- [提权模式](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills) — 由 Skills 支持的自动允许行为
