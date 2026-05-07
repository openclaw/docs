---
read_when:
    - 配置安全区或自定义安全区配置文件
    - 将审批转发到 Slack/Discord/Telegram 或其他聊天渠道
    - 为渠道实现原生审批客户端
summary: 高级 exec 审批：安全命令分组、解释器绑定、审批转发、原生交付
title: 执行审批 — 高级
x-i18n:
    generated_at: "2026-05-07T01:54:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

高级 exec 批准主题：`safeBins` 快速路径、解释器/运行时绑定，以及将批准转发到聊天渠道（包括原生投递）。核心策略和批准流程请参阅 [Exec approvals](/zh-CN/tools/exec-approvals)。

## 安全二进制程序（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制程序（例如 `cut`），它们可以在允许列表模式下运行，**无需**显式的允许列表条目。安全二进制程序会拒绝位置文件参数和类似路径的 token，因此它们只能处理传入流。请将其视为流过滤器的窄快速路径，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制程序（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果某个命令按设计可以求值代码、执行子命令或读取文件，请优先使用显式允许列表条目，并保持批准提示启用。自定义安全二进制程序必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置文件。
</Warning>

默认安全二进制程序：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请为其非 stdin 工作流保留显式允许列表条目。对于 safe-bin 模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置模式形式会被拒绝，这样文件操作数就不能作为有歧义的位置参数被夹带进来。

### Argv 校验和被拒绝的标志

校验仅根据 argv 形状确定（不做宿主文件系统存在性检查），这可以避免允许/拒绝差异产生文件存在性探测行为。默认安全二进制程序会拒绝面向文件的选项；长选项按失败关闭方式校验（未知标志和有歧义的缩写会被拒绝）。

按 safe-bin 配置文件列出的被拒绝标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二进制程序还会在执行时强制将 argv token 作为**字面文本**处理（对仅 stdin 段不做 glob 展开，也不展开 `$VARS`），因此不能用 `*` 或 `$HOME/...` 这样的模式夹带文件读取。

### 可信二进制目录

安全二进制程序必须从可信二进制目录解析（系统默认值加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会被自动信任。默认可信目录有意保持最小：`/bin`、`/usr/bin`。如果你的 safe-bin 可执行文件位于包管理器/用户路径（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 串联、包装器和多路复用器

当每个顶层段都满足允许列表（包括安全二进制程序或 Skills 自动允许）时，允许 shell 串联（`&&`、`||`、`;`）。允许列表模式仍不支持重定向。命令替换（`$()` / 反引号）会在允许列表解析期间被拒绝，包括在双引号内部；如果需要字面 `$()` 文本，请使用单引号。

在 macOS 配套应用批准中，包含 shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文本会被视为允许列表未命中，除非 shell 二进制程序本身已加入允许列表。

对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求级 env 覆盖会缩减为一个小型显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

对于允许列表模式下的 `allow-always` 决策，已知调度包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）会对 shell applet（`sh`、`ash` 等）以相同方式解包。如果无法安全地解包某个包装器或多路复用器，则不会自动持久化允许列表条目。

如果你将 `python3` 或 `node` 这样的解释器加入允许列表，建议使用 `tools.exec.strictInlineEval=true`，这样内联 eval 仍需要显式批准。在严格模式下，`allow-always` 仍可以持久化良性的解释器/脚本调用，但内联 eval 载体不会自动持久化。

### 安全二进制程序与允许列表

| 主题 | `tools.exec.safeBins` | 允许列表（`exec-approvals.json`） |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目标 | 自动允许窄范围 stdin 过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名 + safe-bin argv 策略 | 已解析的可执行文件路径 glob，或通过 PATH 调用的命令的裸命令名 glob |
| 参数范围 | 受 safe-bin 配置文件和字面 token 规则限制 | 默认按路径匹配；可选的 `argPattern` 可限制解析后的 argv |
| 常见示例 | `head`、`tail`、`tr`、`wc` | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI |
| 最佳用途 | 管道中的低风险文本转换 | 任何行为或副作用更广的工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体的配置文件键会覆盖全局键。
- 允许列表条目位于宿主本地的 `~/.openclaw/exec-approvals.json` 中的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器/运行时 bin 出现在 `safeBins` 中但没有显式配置文件时，`openclaw security audit` 会用 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以将缺失的自定义 `safeBinProfiles.<bin>` 条目搭建为 `{}`（之后请审查并收紧）。解释器/运行时 bin 不会自动搭建。

自定义配置文件示例：
__OC_I18N_900000__
如果你显式选择将 `jq` 加入 `safeBins`，OpenClaw 仍会在 safe-bin 模式下拒绝 `env` 内建项，因此 `jq -n env` 不能在没有显式允许列表路径或批准提示的情况下转储宿主进程环境。

## 解释器/运行时命令

由批准支持的解释器/运行时运行有意保持保守：

- 始终绑定精确的 argv/cwd/env 上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地文件快照。
- 仍会解析为一个直接本地文件的常见包管理器包装器形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前解包。
- 如果 OpenClaw 无法为解释器/运行时命令准确识别一个具体的本地文件（例如包脚本、eval 形式、运行时特定加载器链，或有歧义的多文件形式），由批准支持的执行会被拒绝，而不是声称提供它并不具备的语义覆盖。
- 对于这些工作流，请优先使用沙箱隔离、单独的宿主边界，或显式可信的允许列表/完整工作流，由操作员接受更广泛的运行时语义。

当需要批准时，exec 工具会立即返回一个批准 id。使用该 id 关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有决策到达，请求会被视为批准超时，并作为拒绝原因展示。

### 后续投递行为

批准后的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 轮次。

- 如果存在有效的外部投递目标（可投递渠道加目标 `to`），后续投递会使用该渠道。
- 在仅 webchat 或没有外部目标的内部会话流程中，后续投递保持仅会话（`deliver: false`）。
- 如果调用方显式请求严格外部投递，但没有可解析的外部渠道，请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析外部渠道，投递会降级为仅会话，而不是失败。

## 将批准转发到聊天渠道

你可以将 exec 批准提示转发到任何聊天渠道（包括插件渠道），并用 `/approve` 批准它们。这使用正常的出站投递管线。

配置：
__OC_I18N_900001__
在聊天中回复：
__OC_I18N_900002__
`/approve` 命令同时处理 exec 批准和插件批准。如果 ID 不匹配任何待处理的 exec 批准，它会自动检查插件批准。

### 插件批准转发

插件批准转发使用与 exec 批准相同的投递管线，但在 `approvals.plugin` 下有独立配置。启用或停用其中一个不会影响另一个。
__OC_I18N_900003__
配置形状与 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的工作方式相同。

支持共享交互式回复的渠道会为 exec 和插件批准渲染相同的批准按钮。没有共享交互式 UI 的渠道会回退到带 `/approve` 指令的纯文本。
插件批准请求可以限制可用决策。批准界面使用请求声明的决策集，Gateway 网关会拒绝提交未提供的决策。

### 任意渠道上的同聊天批准

当 exec 或插件批准请求来自可投递的聊天界面时，默认情况下现在可以在同一聊天中用 `/approve` 批准它。除了现有的 Web UI 和终端 UI 流程外，这也适用于 Slack、Matrix 和 Microsoft Teams 等渠道。

此共享文本命令路径使用该对话的正常渠道身份验证模型。如果发起聊天已经可以发送命令并接收回复，批准请求不再需要单独的原生投递适配器就能保持待处理。

Discord 和 Telegram 也支持同聊天 `/approve`，但即使原生批准投递被禁用，这些渠道仍会使用其解析后的批准者列表进行授权。

对于 Telegram 和其他直接调用 Gateway 网关的原生批准客户端，此回退有意限制在“未找到批准”的失败场景。真正的 exec 批准拒绝/错误不会静默重试为插件批准。

### 原生批准投递

某些渠道也可以充当原生审批客户端。原生客户端会在共享的同一聊天 `/approve`
流程之上添加审批者私信、发起聊天扇出，以及特定渠道的交互式审批 UX。

当原生审批卡片/按钮可用时，该原生 UI 是面向
智能体的主要路径。除非工具结果说明聊天审批不可用，或
手动审批是唯一剩余路径，否则智能体不应再回显重复的纯聊天
`/approve` 命令。

如果已配置原生审批客户端，但发起渠道没有活动的原生运行时，
OpenClaw 会保持本地确定性的 `/approve` 提示可见。如果原生运行时处于活动状态并尝试投递，但没有任何
目标收到卡片，OpenClaw 会发送同一聊天的回退通知，其中包含
确切的 `/approve <id> <decision>` 命令，以便请求仍可被处理。

通用模型：

- 主机 exec 策略仍决定是否需要 exec 审批
- `approvals.exec` 控制将审批提示转发到其他聊天目的地
- `channels.<channel>.execApprovals` 控制该渠道是否充当原生审批客户端

当以下条件全部为真时，原生审批客户端会自动启用优先私信投递：

- 该渠道支持原生审批投递
- 可以从显式的 `execApprovals.approvers` 或所有者
  身份（如 `commands.ownerAllowFrom`）解析审批者
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

设置 `enabled: false` 可显式禁用原生审批客户端。当可以解析审批者时，设置 `enabled: true` 可强制
启用它。公开的发起聊天投递仍通过
`channels.<channel>.execApprovals.target` 显式配置。

常见问题：[为什么聊天审批有两个 exec 审批配置？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

这些原生审批客户端会在共享的同一聊天 `/approve` 流程和共享审批按钮之上，添加私信路由和可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 和类似可投递的聊天使用常规渠道鉴权模型
  来处理同一聊天 `/approve`
- 当原生审批客户端自动启用时，默认原生投递目标是审批者私信
- 对于 Discord 和 Telegram，只有已解析的审批者可以批准或拒绝
- Discord 审批者可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram 审批者可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 审批者可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留审批 ID 类型，因此 `plugin:` ID 可以解析插件审批，
  不需要第二层 Slack 本地回退
- Matrix 原生私信/渠道路由和回应快捷方式同时处理 exec 与插件审批；
  插件授权仍来自 `channels.matrix.dm.allowFrom`
- Matrix 原生提示会在第一个提示事件中包含 `com.openclaw.approval` 自定义事件内容，
  因此支持 OpenClaw 的 Matrix 客户端可以读取结构化审批状态，而普通客户端
  会保留纯文本 `/approve` 回退
- 请求者不需要是审批者
- 当发起聊天已支持命令和回复时，可以直接用 `/approve` 审批
- 原生 Discord 审批按钮按审批 ID 类型路由：`plugin:` ID 会
  直接进入插件审批，其他全部进入 exec 审批
- 原生 Telegram 审批按钮遵循与 `/approve` 相同的有界 exec 到插件回退
- 当原生 `target` 启用发起聊天投递时，审批提示会包含命令文本
- 待处理的 exec 审批默认在 30 分钟后过期
- 如果没有操作员 UI 或已配置的审批客户端可以接受请求，提示会回退到 `askFallback`

敏感的仅所有者群组命令（如 `/diagnostics` 和 `/export-trajectory`）会为审批提示和最终结果使用私有
所有者路由。OpenClaw 会先在所有者运行命令的同一界面上尝试私有路由。如果该界面没有私有所有者路由，则会
回退到 `commands.ownerAllowFrom` 中第一个可用的所有者路由，因此当 Telegram 是已配置的
主要私有界面时，Discord 群组命令仍可以把审批和结果发送到所有者的 Telegram 私信。
群聊只会收到简短确认。

Telegram 默认发送到审批者私信（`target: "dm"`）。当你希望
审批提示也出现在发起的 Telegram 聊天/话题中时，可以切换到 `channel` 或 `both`。对于 Telegram 论坛
话题，OpenClaw 会为审批提示和审批后的后续消息保留该话题。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全说明：

- Unix 套接字模式 `0600`，token 存储在 `exec-approvals.json` 中。
- 同 UID 对等方检查。
- 质询/响应（nonce + HMAC token + request hash）+ 短 TTL。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) — 核心策略和审批流程
- [Exec 工具](/zh-CN/tools/exec)
- [提升模式](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills) — 由技能支持的自动允许行为
