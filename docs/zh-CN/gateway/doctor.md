---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置更改
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-04-05T08:24:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 119080ef6afe1b14382a234f844ea71336923355d991fe6d816fddc6c83cf88f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它会修复过期的
配置/状态、检查健康状况，并提供可执行的修复步骤。

## 快速开始

```bash
openclaw doctor
```

### 无头 / 自动化

```bash
openclaw doctor --yes
```

接受默认值而不进行提示（在适用时，包括重启/服务/沙箱修复步骤）。

```bash
openclaw doctor --repair
```

不经提示应用建议的修复（在安全的情况下执行修复 + 重启）。

```bash
openclaw doctor --repair --force
```

也应用激进修复（覆盖自定义 supervisor 配置）。

```bash
openclaw doctor --non-interactive
```

在无提示模式下运行，并且只应用安全迁移（配置规范化 + 磁盘状态移动）。会跳过需要人工确认的重启/服务/沙箱操作。
检测到旧版状态迁移时会自动运行。

```bash
openclaw doctor --deep
```

扫描系统服务以查找额外的 Gateway 网关安装（launchd/systemd/schtasks）。

如果你想在写入前先查看更改，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 它会做什么（摘要）

- 针对 git 安装的可选飞行前更新（仅交互式）。
- UI 协议新鲜度检查（当协议 schema 更新时重建 Control UI）。
- 健康检查 + 重启提示。
- Skills 状态摘要（符合条件/缺失/被阻止）和插件状态。
- 对旧版值进行配置规范化。
- 将旧版扁平 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>` 的 Talk 配置迁移。
- 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪情况的浏览器迁移检查。
- OpenCode 提供商覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- 用于 OpenAI Codex OAuth 配置档案的 OAuth TLS 前置条件检查。
- 旧版磁盘状态迁移（sessions/agent 目录/WhatsApp 认证）。
- 旧版插件清单契约键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
- 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层 delivery/payload 字段、payload `provider`、简单的 `notify: true` webhook 回退任务）。
- 会话锁文件检查和过期锁清理。
- 状态完整性和权限检查（sessions、transcripts、状态目录）。
- 在本地运行时检查配置文件权限（chmod 600）。
- 模型认证健康：检查 OAuth 过期情况，可刷新即将过期的令牌，并报告 auth-profile 的冷却/禁用状态。
- 检测额外工作区目录（`~/openclaw`）。
- 启用沙箱隔离时进行沙箱镜像修复。
- 旧版服务迁移和额外 Gateway 网关检测。
- Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式下）。
- Gateway 网关运行时检查（服务已安装但未运行；缓存的 launchd 标签）。
- 渠道状态警告（从运行中的 Gateway 网关探测）。
- Supervisor 配置审计（launchd/systemd/schtasks）并可选择修复。
- Gateway 网关运行时最佳实践检查（Node 与 Bun、版本管理器路径）。
- Gateway 网关端口冲突诊断（默认 `18789`）。
- 针对开放私信策略的安全警告。
- 本地 token 模式的 Gateway 网关认证检查（在没有 token 来源时提供 token 生成功能；不会覆盖 token SecretRef 配置）。
- Linux 上的 systemd linger 检查。
- 工作区引导文件大小检查（上下文文件的截断/接近上限警告）。
- Shell 自动补全状态检查和自动安装/升级。
- 记忆搜索 embedding 提供商就绪性检查（本地模型、远程 API key 或 QMD 二进制文件）。
- 源码安装检查（pnpm 工作区不匹配、缺失的 UI 资源、缺失的 tsx 二进制文件）。
- 写入更新后的配置 + 向导元数据。

## 详细行为和原理

### 0) 可选更新（git 安装）

如果这是一个 git 检出，并且 doctor 正在以交互方式运行，它会在运行 doctor 之前提供
更新（fetch/rebase/build）选项。

### 1) 配置规范化

如果配置包含旧版值形态（例如 `messages.ackReaction`
没有渠道特定覆盖），doctor 会将其规范化为当前
schema。

这也包括旧版 Talk 扁平字段。当前公开的 Talk 配置是
`talk.provider` + `talk.providers.<provider>`。Doctor 会将旧的
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` 形态重写到提供商映射中。

### 2) 旧版配置键迁移

当配置中包含已弃用键时，其他命令会拒绝运行，并要求
你运行 `openclaw doctor`。

Doctor 将会：

- 解释发现了哪些旧版键。
- 显示它应用的迁移。
- 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

当 Gateway 网关检测到
旧版配置格式时，也会在启动时自动运行 doctor 迁移，因此过期配置无需人工干预即可修复。
Cron 作业存储迁移由 `openclaw doctor --fix` 处理。

当前迁移包括：

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → 顶层 `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- 旧版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- 对于具有命名 `accounts` 但仍残留单账号顶层渠道值的渠道，将这些账号作用域值移动到为该渠道选定的提升账号中（大多数渠道是 `accounts.default`；Matrix 可保留现有的匹配命名/默认目标）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- 移除 `browser.relayBindHost`（旧版扩展 relay 设置）

Doctor 警告还包括多账号渠道的默认账号指导：

- 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但没有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 会警告回退路由可能会选到意外的账号。
- 如果 `channels.<channel>.defaultAccount` 被设置为未知账号 ID，doctor 会发出警告并列出已配置的账号 ID。

### 2b) OpenCode 提供商覆盖

如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，
它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode 目录。
这可能会迫使模型走到错误的 API，或使成本归零。Doctor 会发出警告，以便你
移除该覆盖并恢复按模型区分的 API 路由 + 成本。

### 2c) 浏览器迁移和 Chrome MCP 就绪情况

如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，doctor
会将其规范化到当前的宿主机本地 Chrome MCP 附加模型：

- `browser.profiles.*.driver: "extension"` 会变为 `"existing-session"`
- `browser.relayBindHost` 会被移除

当你使用 `defaultProfile:
"user"` 或已配置的 `existing-session` 配置档案时，doctor 还会审计宿主机本地 Chrome MCP 路径：

- 检查同一主机上是否安装了 Google Chrome，供默认
  自动连接配置档案使用
- 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
- 提醒你在浏览器检查页面中启用远程调试（例如
  `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`，
  或 `edge://inspect/#remote-debugging`）

Doctor 无法替你启用 Chrome 侧设置。宿主机本地 Chrome MCP
仍然要求：

- 在 Gateway 网关/节点主机上有 Chromium 内核浏览器 144+
- 浏览器在本地运行
- 该浏览器中启用了远程调试
- 在浏览器中批准首次附加的同意提示

此处的就绪性仅与本地附加前置条件有关。Existing-session 会保留
当前 Chrome MCP 的路由限制；像 `responsebody`、PDF
导出、下载拦截和批量操作等高级路由仍然需要托管浏览器或原始 CDP 配置档案。

此检查**不适用于** Docker、沙箱、remote-browser 或其他
无头流程。那些流程会继续使用原始 CDP。

### 2d) OAuth TLS 前置条件

当配置了 OpenAI Codex OAuth 配置档案时，doctor 会探测 OpenAI
授权端点，以验证本地 Node/OpenSSL TLS 栈是否能够校验证书链。如果探测因证书错误失败（例如
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），
doctor 会输出特定于平台的修复指导。在 macOS 上使用 Homebrew Node 时，
修复通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，
即使 Gateway 网关健康，探测也会运行。

### 3) 旧版状态迁移（磁盘布局）

Doctor 可以将较旧的磁盘布局迁移到当前结构：

- Sessions 存储 + transcripts：
  - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
- Agent 目录：
  - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp 认证状态（Baileys）：
  - 从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
  - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账号 id：`default`）

这些迁移是尽力而为且幂等的；doctor 会在
它保留任何旧版文件夹作为备份时发出警告。Gateway 网关/CLI 也会在启动时自动迁移
旧版 sessions + agent 目录，因此历史记录/认证/模型会落到每智能体路径中，而无需手动运行 doctor。WhatsApp 认证有意只通过
`openclaw doctor` 迁移。Talk provider/provider-map 规范化现在
通过结构相等性进行比较，因此仅键顺序不同不再触发重复的
无操作 `doctor --fix` 更改。

### 3a) 旧版插件清单迁移

Doctor 会扫描所有已安装插件的清单，查找已弃用的顶层能力
键（`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、
`webSearchProviders`）。发现后，它会提供将它们移动到 `contracts`
对象并原地重写清单文件的选项。该迁移是幂等的；
如果 `contracts` 键已经具有相同值，则会移除旧版键，
而不会复制数据。

### 3b) 旧版 cron 存储迁移

Doctor 还会检查 cron 作业存储（默认位于 `~/.openclaw/cron/jobs.json`，
或在覆盖时使用 `cron.store`）中是否存在调度器出于兼容性仍然接受的旧作业形态。

当前 cron 清理包括：

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- 顶层 payload 字段（`message`、`model`、`thinking`、...）→ `payload`
- 顶层 delivery 字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
- payload `provider` delivery 别名 → 显式 `delivery.channel`
- 简单的旧版 `notify: true` webhook 回退任务 → 显式 `delivery.mode="webhook"` 并设置 `delivery.to=cron.webhook`

Doctor 只会在能够确保
不改变行为时自动迁移 `notify: true` 作业。如果某个作业将旧版 notify 回退与现有
非 webhook delivery 模式结合，doctor 会发出警告，并将该作业留给人工审查。

### 3c) 会话锁清理

Doctor 会扫描每个智能体会话目录中的过期写锁文件——这些文件会在会话异常退出时残留。对于发现的每个锁文件，它会报告：
路径、PID、该 PID 是否仍然存活、锁年龄，以及它是否
被视为过期（PID 已死或超过 30 分钟）。在 `--fix` / `--repair`
模式下，它会自动移除过期锁文件；否则会输出说明，并
提示你重新运行并添加 `--fix`。

### 4) 状态完整性检查（会话持久化、路由与安全）

状态目录是运行上的中枢神经。如果它消失了，你就会失去
sessions、凭证、日志和配置（除非你在其他地方有备份）。

Doctor 会检查：

- **状态目录缺失**：警告灾难性状态丢失，提示重新创建
  目录，并提醒你它无法恢复缺失的数据。
- **状态目录权限**：验证可写性；提供修复权限选项
  （并在检测到所有者/组不匹配时给出 `chown` 提示）。
- **macOS 云同步状态目录**：当状态解析到 iCloud Drive
  （`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或
  `~/Library/CloudStorage/...` 下时发出警告，因为由同步支持的路径可能导致更慢的 I/O
  以及锁/同步竞争。
- **Linux SD 或 eMMC 状态目录**：当状态解析到 `mmcblk*`
  挂载源时发出警告，因为由 SD 卡或 eMMC 支持的随机 I/O 在会话和凭证写入下可能更慢且磨损更快。
- **会话目录缺失**：`sessions/` 和会话存储目录
  是持久化历史记录并避免 `ENOENT` 崩溃所必需的。
- **转录不匹配**：当最近的会话条目缺少
  transcript 文件时发出警告。
- **主会话 “1 行 JSONL”**：当主 transcript 只有一行时标记
  （历史记录未在累积）。
- **多个状态目录**：当多个 `~/.openclaw` 文件夹存在于不同
  主目录下，或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史记录可能在不同安装之间分裂）。
- **远程模式提醒**：如果 `gateway.mode=remote`，doctor 会提醒你在
  远程主机上运行它（状态存储在那里）。
- **配置文件权限**：如果 `~/.openclaw/openclaw.json` 对
  组/全体用户可读，则发出警告，并提供收紧到 `600` 的选项。

### 5) 模型认证健康（OAuth 过期）

Doctor 会检查认证存储中的 OAuth 配置档案，并在令牌
即将过期/已过期时发出警告，同时在安全时可进行刷新。如果 Anthropic
OAuth/token 配置档案已过期，它会建议迁移到 Claude CLI 或
Anthropic API key。
刷新提示仅会在交互式（TTY）运行时出现；`--non-interactive`
会跳过刷新尝试。

Doctor 还会报告因以下原因暂时不可用的认证配置档案：

- 短期冷却（限流/超时/认证失败）
- 较长期禁用（计费/额度失败）

### 6) Hooks 模型校验

如果设置了 `hooks.gmail.model`，doctor 会根据目录和 allowlist 校验该模型引用，并在其无法解析或不被允许时发出警告。

### 7) 沙箱镜像修复

启用沙箱隔离时，doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建或
切换到旧版名称的选项。

### 7b) 内置插件运行时依赖

Doctor 会验证内置插件的运行时依赖（例如
Discord 插件运行时包）是否存在于 OpenClaw 安装根目录中。
如果缺失，doctor 会报告相关包，并在
`openclaw doctor --fix` / `openclaw doctor --repair` 模式下安装它们。

### 8) Gateway 网关服务迁移和清理提示

Doctor 会检测旧版 Gateway 网关服务（launchd/systemd/schtasks），并
提供移除它们并使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它还可以扫描额外的类 Gateway 网关服务并打印清理提示。
以配置档案命名的 OpenClaw Gateway 网关服务被视为一等公民，不会被标记为“额外”。

### 8b) 启动时 Matrix 迁移

当某个 Matrix 渠道账号存在待处理或可执行的旧版状态迁移时，
doctor（在 `--fix` / `--repair` 模式下）会创建一个迁移前快照，然后
运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版
加密状态准备。这两个步骤都不是致命性的；错误会被记录，启动会继续。在只读模式下（不带 `--fix` 的 `openclaw doctor`），此检查
会被完全跳过。

### 9) 安全警告

当某个提供商在没有允许列表的情况下向私信开放时，或者
当某项策略以危险方式配置时，doctor 会发出警告。

### 10) systemd linger（Linux）

如果作为 systemd 用户服务运行，doctor 会确保启用了 lingering，以便
Gateway 网关在注销后仍能保持运行。

### 11) 工作区状态（Skills、插件和旧版目录）

Doctor 会打印默认智能体的工作区状态摘要：

- **Skills 状态**：统计符合条件、缺少要求和被 allowlist 阻止的 Skills 数量。
- **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录
  与当前工作区并存时发出警告。
- **插件状态**：统计已加载/已禁用/报错的插件；列出所有
  报错插件的插件 ID；报告内置插件能力。
- **插件兼容性警告**：标记与
  当前运行时存在兼容性问题的插件。
- **插件诊断**：展示插件注册表在加载时发出的所有警告或错误。

### 11b) 引导文件大小

Doctor 会检查工作区引导文件（例如 `AGENTS.md`、
`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过已配置的
字符预算。它会报告每个文件的原始字符数与注入字符数、截断
百分比、截断原因（`max/file` 或 `max/total`），以及总注入
字符数占总预算的比例。当文件被截断或接近上限时，doctor 会输出调整 `agents.defaults.bootstrapMaxChars`
和 `agents.defaults.bootstrapTotalMaxChars` 的建议。

### 11c) Shell 自动补全

Doctor 会检查当前 shell
（zsh、bash、fish 或 PowerShell）是否已安装 Tab 自动补全：

- 如果 shell 配置文件使用了较慢的动态补全模式
  （`source <(openclaw completion ...)`），doctor 会将其升级为更快的
  缓存文件变体。
- 如果自动补全已在配置文件中配置，但缓存文件缺失，
  doctor 会自动重新生成缓存。
- 如果完全没有配置自动补全，它会提示安装
  （仅交互模式；使用 `--non-interactive` 时跳过）。

运行 `openclaw completion --write-state` 可手动重新生成缓存。

### 12) Gateway 网关认证检查（本地 token）

Doctor 会检查本地 Gateway 网关 token 认证的就绪情况。

- 如果 token 模式需要 token 且不存在 token 来源，doctor 会提供生成一个 token 的选项。
- 如果 `gateway.auth.token` 由 SecretRef 管理但当前不可用，doctor 会发出警告，且不会用明文覆盖它。
- `openclaw doctor --generate-gateway-token` 仅在未配置 token SecretRef 时才会强制生成。

### 12b) 只读、具备 SecretRef 感知的修复

某些修复流程需要检查已配置的凭证，同时又不削弱运行时的失败即关闭行为。

- `openclaw doctor --fix` 现在对定向配置修复使用与 status 系列命令相同的只读 SecretRef 摘要模型。
- 示例：Telegram `allowFrom` / `groupAllowFrom` 的 `@username` 修复会在可用时尝试使用已配置的 bot 凭证。
- 如果 Telegram bot token 通过 SecretRef 配置，但在当前命令路径中不可用，doctor 会报告该凭证处于“已配置但不可用”状态，并跳过自动解析，而不是崩溃或误报 token 缺失。

### 13) Gateway 网关健康检查 + 重启

Doctor 会运行健康检查，并在 Gateway 网关看起来
不健康时提供重启选项。

### 13b) 记忆搜索就绪性

Doctor 会检查为默认智能体配置的记忆搜索 embedding 提供商是否已就绪。
行为取决于已配置的后端和提供商：

- **QMD 后端**：探测 `qmd` 二进制文件是否可用且可启动。
  如果不可用，会输出修复指导，包括 npm 包和手动二进制路径选项。
- **显式本地提供商**：检查本地模型文件或可识别的
  远程/可下载模型 URL 是否存在。如果缺失，会建议切换到远程提供商。
- **显式远程提供商**（`openai`、`voyage` 等）：验证环境变量或认证存储中是否存在 API key。
  如果缺失，会输出可执行的修复提示。
- **自动提供商**：先检查本地模型可用性，然后按自动选择顺序尝试每个远程
  提供商。

当 Gateway 网关探测结果可用时（检查时 Gateway 网关健康），doctor 会将其结果与 CLI 可见配置交叉比对，并说明
任何差异。

使用 `openclaw memory status --deep` 可在运行时验证 embedding 就绪性。

### 14) 渠道状态警告

如果 Gateway 网关健康，doctor 会运行渠道状态探测，并报告
带有建议修复方案的警告。

### 15) Supervisor 配置审计 + 修复

Doctor 会检查已安装的 supervisor 配置（launchd/systemd/schtasks）中是否存在
缺失或过期的默认值（例如 systemd 的 network-online 依赖项和
重启延迟）。发现不匹配时，它会建议更新，并且可以
将服务文件/任务重写为当前默认值。

说明：

- `openclaw doctor` 会在重写 supervisor 配置前进行提示。
- `openclaw doctor --yes` 会接受默认修复提示。
- `openclaw doctor --repair` 会在无提示情况下应用建议修复。
- `openclaw doctor --repair --force` 会覆盖自定义 supervisor 配置。
- 如果 token 认证需要 token 且 `gateway.auth.token` 由 SecretRef 管理，doctor 服务安装/修复会验证该 SecretRef，但不会将解析出的明文 token 值持久化到 supervisor 服务环境元数据中。
- 如果 token 认证需要 token 且已配置的 token SecretRef 无法解析，doctor 会阻止安装/修复路径，并提供可执行指导。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password` 且 `gateway.auth.mode` 未设置，doctor 会阻止安装/修复，直到明确设置 mode。
- 对于 Linux user-systemd 单元，doctor 的 token 漂移检查现在在比较服务认证元数据时会同时包含 `Environment=` 和 `EnvironmentFile=` 来源。
- 你始终可以通过 `openclaw gateway install --force` 强制执行完整重写。

### 16) Gateway 网关运行时 + 端口诊断

Doctor 会检查服务运行时（PID、最近退出状态），并在
服务已安装但实际上未运行时发出警告。它还会检查
Gateway 网关端口（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已运行、
SSH 隧道）。

### 17) Gateway 网关运行时最佳实践

当 Gateway 网关服务运行在 Bun 上或使用版本管理器的 Node 路径
（`nvm`、`fnm`、`volta`、`asdf` 等）时，doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，
而版本管理器路径在升级后可能会出问题，因为服务不会
加载你的 shell 初始化。Doctor 会在可用时提供迁移到系统 Node 安装的选项
（Homebrew/apt/choco）。

### 18) 配置写入 + 向导元数据

Doctor 会持久化任何配置更改，并写入向导元数据以记录
此次 doctor 运行。

### 19) 工作区提示（备份 + 记忆系统）

当工作区缺少记忆系统时，doctor 会建议一个工作区记忆系统；如果工作区尚未置于 git 管理下，它还会打印备份提示。

参见 [/concepts/agent-workspace](/concepts/agent-workspace) 了解
工作区结构和 git 备份的完整指南（推荐使用私有 GitHub 或 GitLab）。
