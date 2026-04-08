---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置变更
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-04-08T21:51:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 673d8bc20447012646908dafcff6911dd8314ea85718dccc75c43a99d28ea5b1
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它会修复过时的配置/状态、检查健康状况，并提供可执行的修复步骤。

## 快速开始

```bash
openclaw doctor
```

### 无头 / 自动化

```bash
openclaw doctor --yes
```

接受默认选项而不提示（包括在适用时执行重启/服务/沙箱修复步骤）。

```bash
openclaw doctor --repair
```

不经提示应用推荐修复（在安全情况下执行修复 + 重启）。

```bash
openclaw doctor --repair --force
```

也应用激进修复（会覆盖自定义 supervisor 配置）。

```bash
openclaw doctor --non-interactive
```

在无提示模式下运行，并且只应用安全迁移（配置规范化 + 磁盘状态移动）。跳过需要人工确认的重启/服务/沙箱操作。
检测到旧版状态迁移时会自动运行。

```bash
openclaw doctor --deep
```

扫描系统服务以查找额外的 Gateway 网关安装（`launchd`/`systemd`/`schtasks`）。

如果你想在写入前先查看变更，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 它会做什么（摘要）

- 对 git 安装进行可选的飞行前更新（仅交互模式）。
- UI 协议新鲜度检查（当协议 schema 更新时重建 Control UI）。
- 健康检查 + 重启提示。
- Skills 状态摘要（可用/缺失/被阻止）和插件状态。
- 对旧版值进行配置规范化。
- 将旧版扁平 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>` 的 Talk 配置迁移。
- 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪情况的浏览器迁移检查。
- OpenCode 提供商覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
- OpenAI Codex OAuth 配置的 OAuth TLS 前置条件检查。
- 旧版磁盘状态迁移（sessions/agent 目录/WhatsApp 认证）。
- 旧版插件 manifest 合约键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
- 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层 delivery/payload 字段、payload `provider`、简单的 `notify: true` webhook 回退任务）。
- 会话锁文件检查与过期锁清理。
- 状态完整性和权限检查（sessions、transcripts、state 目录）。
- 本地运行时的配置文件权限检查（`chmod 600`）。
- 模型认证健康检查：检查 OAuth 过期情况，可刷新即将过期的 token，并报告 auth profile 的冷却/禁用状态。
- 额外工作区目录检测（`~/openclaw`）。
- 启用沙箱隔离时的沙箱镜像修复。
- 旧版服务迁移和额外 Gateway 网关检测。
- Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式下）。
- Gateway 网关运行时检查（服务已安装但未运行；缓存的 `launchd` 标签）。
- 渠道状态警告（从正在运行的 Gateway 网关探测）。
- Supervisor 配置审计（`launchd`/`systemd`/`schtasks`）及可选修复。
- Gateway 网关运行时最佳实践检查（Node 对比 Bun、版本管理器路径）。
- Gateway 网关端口冲突诊断（默认 `18789`）。
- 面向开放私信策略的安全警告。
- 针对本地 token 模式的 Gateway 网关认证检查（当没有 token 来源时提供生成 token；不会覆盖 token SecretRef 配置）。
- Linux 上的 `systemd linger` 检查。
- 工作区引导文件大小检查（上下文文件的截断/接近上限警告）。
- Shell 补全状态检查和自动安装/升级。
- Memory 搜索嵌入提供商就绪情况检查（本地模型、远程 API key 或 QMD 二进制）。
- 源码安装检查（`pnpm` workspace 不匹配、缺失 UI 资源、缺失 `tsx` 二进制）。
- 写入更新后的配置 + 向导元数据。

## Dreams UI 回填与重置

Control UI 的 Dreams 场景包含 **Backfill** 和 **Reset** 操作，用于 grounded diary 工作流。这些操作使用 Gateway 网关风格的 doctor RPC 方法，但它们**不是** `openclaw doctor` CLI 修复/迁移的一部分。

它们会做什么：

- **Backfill** 会扫描活动工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行 grounded REM diary 流程，并将可逆的回填条目写入 `DREAMS.md`。
- **Reset** 仅从 `DREAMS.md` 中移除那些带标记的回填日记条目。

它们**不会**自行执行以下操作：

- 不会编辑 `MEMORY.md`
- 不会运行完整的 Doctor 迁移
- 不会自动将 grounded 候选项暂存到实时短期提升存储中

如果你想让 grounded 历史回放影响正常的深度提升通道，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这会把 grounded 持久候选项暂存到短期 dreaming 存储中，同时将 `DREAMS.md` 作为审查界面保留。

## 详细行为和原因说明

### 0）可选更新（git 安装）

如果这是一个 git checkout，并且 Doctor 正在交互模式下运行，它会先提供更新（fetch/rebase/build）选项，然后再运行 Doctor。

### 1）配置规范化

如果配置包含旧版值形态（例如没有特定渠道覆盖的 `messages.ackReaction`），Doctor 会将其规范化为当前 schema。

其中包括旧版 Talk 扁平字段。当前公开的 Talk 配置为 `talk.provider` + `talk.providers.<provider>`。Doctor 会把旧的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形态重写到 provider 映射中。

### 2）旧版配置键迁移

当配置包含已弃用键时，其他命令会拒绝运行，并要求你运行 `openclaw doctor`。

Doctor 将会：

- 说明发现了哪些旧版键。
- 展示它应用的迁移。
- 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

当 Gateway 网关在启动时检测到旧版配置格式，也会自动运行 Doctor 迁移，因此过时配置无需人工干预即可修复。
Cron 任务存储迁移由 `openclaw doctor --fix` 处理。

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
- 对于配置了具名 `accounts` 但仍残留单账户顶层渠道值的渠道，将这些账户作用域的值移动到该渠道选定的提升账户中（大多数渠道使用 `accounts.default`；Matrix 可以保留现有匹配的具名/默认目标）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- 删除 `browser.relayBindHost`（旧版扩展 relay 设置）

Doctor 警告还包含多账户渠道的默认账户指引：

- 如果已配置两个或更多 `channels.<channel>.accounts` 条目，但没有设置 `channels.<channel>.defaultAccount` 或 `accounts.default`，Doctor 会警告回退路由可能会选到意外的账户。
- 如果 `channels.<channel>.defaultAccount` 被设置为未知账户 ID，Doctor 会发出警告并列出已配置的账户 ID。

### 2b）OpenCode 提供商覆盖

如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode 目录。
这可能会把模型强制路由到错误的 API，或者把成本清零。Doctor 会发出警告，以便你删除该覆盖并恢复按模型路由 API + 成本。

### 2c）浏览器迁移与 Chrome MCP 就绪情况

如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，Doctor 会将其规范化为当前基于主机本地的 Chrome MCP 连接模型：

- `browser.profiles.*.driver: "extension"` 变为 `"existing-session"`
- 删除 `browser.relayBindHost`

当你使用 `defaultProfile: "user"` 或配置了 `existing-session` profile 时，Doctor 还会审计主机本地 Chrome MCP 路径：

- 检查同一主机上是否已安装 Google Chrome，以支持默认自动连接 profile
- 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
- 提醒你在浏览器检查页面启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

Doctor 无法替你启用 Chrome 侧设置。主机本地 Chrome MCP 仍然要求：

- Gateway 网关/节点主机上安装 Chromium 内核浏览器 144+
- 浏览器在本地运行
- 在该浏览器中启用远程调试
- 在浏览器中批准首次连接的同意提示

这里的就绪情况仅涉及本地连接前置条件。Existing-session 仍保留当前 Chrome MCP 的路由限制；像 `responsebody`、PDF 导出、下载拦截和批量操作这样的高级路由仍需要托管浏览器或原始 CDP profile。

此检查**不**适用于 Docker、沙箱、remote-browser 或其他无头流程。这些流程将继续使用原始 CDP。

### 2d）OAuth TLS 前置条件

配置了 OpenAI Codex OAuth profile 时，Doctor 会探测 OpenAI 授权端点，以验证本地 Node/OpenSSL TLS 栈是否能够校验证书链。如果探测因证书错误失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），Doctor 会打印针对平台的修复指引。在 macOS 上，如果使用的是 Homebrew 安装的 Node，通常修复方法是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关健康，该探测也会运行。

### 2c）Codex OAuth 提供商覆盖

如果你之前在 `models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，它们可能会遮蔽较新版本自动使用的内置 Codex OAuth 提供商路径。Doctor 在看到这些旧传输设置与 Codex OAuth 同时存在时会发出警告，以便你移除或重写陈旧的传输覆盖，从而恢复内置路由/回退行为。自定义代理和仅 header 的覆盖仍然受支持，不会触发此警告。

### 3）旧版状态迁移（磁盘布局）

Doctor 可以将较旧的磁盘布局迁移为当前结构：

- Sessions 存储 + transcripts：
  - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
- Agent 目录：
  - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp 认证状态（Baileys）：
  - 从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
  - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 ID：`default`）

这些迁移会尽力执行，并且是幂等的；如果保留任何旧版文件夹作为备份，Doctor 会发出警告。Gateway 网关/CLI 在启动时也会自动迁移旧版 sessions + agent 目录，因此历史/认证/模型会落到按 agent 划分的路径中，而无需手动运行 Doctor。WhatsApp 认证有意仅通过 `openclaw doctor` 迁移。Talk provider/provider-map 规范化现在通过结构相等性比较，因此仅键顺序不同的差异不再触发重复的无操作 `doctor --fix` 变更。

### 3a）旧版插件 manifest 迁移

Doctor 会扫描所有已安装插件的 manifest，查找已弃用的顶层能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。发现后，它会提议将它们移动到 `contracts` 对象中，并原地重写 manifest 文件。此迁移是幂等的；如果 `contracts` 键中已经有相同的值，则只会移除旧版键，而不会重复数据。

### 3b）旧版 cron 存储迁移

Doctor 还会检查 cron 任务存储（默认是 `~/.openclaw/cron/jobs.json`，或在覆盖时使用 `cron.store`）中调度器仍为兼容性接受的旧任务形态。

当前 cron 清理包括：

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- 顶层 payload 字段（`message`、`model`、`thinking`、...）→ `payload`
- 顶层 delivery 字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
- payload `provider` delivery 别名 → 显式 `delivery.channel`
- 简单的旧版 `notify: true` webhook 回退任务 → 显式 `delivery.mode="webhook"` 且 `delivery.to=cron.webhook`

Doctor 只会在能够保证行为不变时自动迁移 `notify: true` 任务。如果某个任务把旧版 notify 回退与现有非 webhook delivery 模式组合在一起，Doctor 会发出警告，并将该任务留给人工审查。

### 3c）会话锁清理

Doctor 会扫描每个 agent 的会话目录，查找过期写锁文件——即会话异常退出后遗留的文件。对于找到的每个锁文件，它会报告：
路径、PID、PID 是否仍在存活、锁龄，以及它是否被视为过期（PID 已死亡或超过 30 分钟）。在 `--fix` / `--repair` 模式下，它会自动移除过期锁文件；否则它会打印说明，并提示你用 `--fix` 重新运行。

### 4）状态完整性检查（会话持久化、路由和安全）

状态目录是运行中的核心中枢。如果它消失了，你会丢失 sessions、凭证、日志和配置（除非你在别处有备份）。

Doctor 会检查：

- **状态目录缺失**：警告灾难性的状态丢失，提示重新创建目录，并提醒你它无法恢复已丢失的数据。
- **状态目录权限**：验证可写性；提供修复权限选项（当检测到所有者/组不匹配时还会给出 `chown` 提示）。
- **macOS 云同步状态目录**：当状态解析到 iCloud Drive
  （`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或
  `~/Library/CloudStorage/...` 下时发出警告，因为基于同步的路径可能会导致更慢的 I/O 以及锁/同步竞争。
- **Linux SD 或 eMMC 状态目录**：当状态解析到 `mmcblk*`
  挂载源时发出警告，因为基于 SD 或 eMMC 的随机 I/O 在 sessions 和凭证写入场景下可能更慢且磨损更快。
- **Session 目录缺失**：`sessions/` 和 session 存储目录是持久化历史、避免 `ENOENT` 崩溃所必需的。
- **Transcript 不匹配**：当最近的 session 条目缺少 transcript 文件时发出警告。
- **主 session “1 行 JSONL”**：当主 transcript 只有一行时标记出来（历史没有持续累积）。
- **多个状态目录**：当多个主目录中存在多个 `~/.openclaw` 文件夹，或 `OPENCLAW_STATE_DIR` 指向别处时发出警告（历史可能会在不同安装之间分裂）。
- **远程模式提醒**：如果 `gateway.mode=remote`，Doctor 会提醒你在远程主机上运行它（状态存储在那里）。
- **配置文件权限**：如果 `~/.openclaw/openclaw.json` 对组/所有人可读，则发出警告，并提供收紧到 `600` 的选项。

### 5）模型认证健康状况（OAuth 过期）

Doctor 会检查 auth 存储中的 OAuth profile，在 token 即将过期/已过期时发出警告，并在安全时刷新它们。如果 Anthropic OAuth/token profile 已陈旧，它会建议使用 Anthropic API key 或 Anthropic setup-token 路径。
只有在交互模式（TTY）下运行时才会出现刷新提示；`--non-interactive` 会跳过刷新尝试。

当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、`invalid_grant`，或提供商告诉你需要重新登录），Doctor 会报告需要重新认证，并打印精确的 `openclaw models auth login --provider ...` 命令供你运行。

Doctor 还会报告因以下原因暂时不可用的 auth profile：

- 短期冷却（速率限制/超时/认证失败）
- 较长时间的禁用（计费/额度失败）

### 6）Hooks 模型校验

如果设置了 `hooks.gmail.model`，Doctor 会根据目录和 allowlist 校验模型引用，并在它无法解析或不被允许时发出警告。

### 7）沙箱镜像修复

当启用沙箱隔离时，Doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建或切换到旧版名称的选项。

### 7b）内置插件运行时依赖

Doctor 会验证内置插件的运行时依赖（例如 Discord 插件运行时包）是否存在于 OpenClaw 安装根目录中。
如果缺失，Doctor 会报告相关包，并在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下安装它们。

### 8）Gateway 网关服务迁移和清理提示

Doctor 会检测旧版 Gateway 网关服务（`launchd`/`systemd`/`schtasks`），并提供移除它们以及使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它还可以扫描额外的类 Gateway 网关服务并打印清理提示。
以 profile 命名的 OpenClaw Gateway 网关服务被视为一等服务，不会被标记为“额外”。

### 8b）启动 Matrix 迁移

当 Matrix 渠道账户存在待处理或可执行的旧版状态迁移时，Doctor（在 `--fix` / `--repair` 模式下）会先创建迁移前快照，然后再运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。这两个步骤都不是致命的；错误会被记录，启动会继续进行。在只读模式下（不带 `--fix` 的 `openclaw doctor`），此检查会被完全跳过。

### 9）安全警告

当某个提供商对私信开放但没有 allowlist，或策略配置存在危险方式时，Doctor 会发出警告。

### 10）`systemd linger`（Linux）

如果作为 `systemd` 用户服务运行，Doctor 会确保已启用 lingering，以便 Gateway 网关在你注销后仍保持运行。

### 11）工作区状态（Skills、插件和旧版目录）

Doctor 会打印默认智能体的工作区状态摘要：

- **Skills 状态**：统计可用、要求缺失和被 allowlist 阻止的 Skills 数量。
- **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录与当前工作区并存时发出警告。
- **插件状态**：统计已加载/已禁用/出错的插件；列出发生错误的插件 ID；报告 bundle 插件能力。
- **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
- **插件诊断**：显示插件注册表发出的所有加载时警告或错误。

### 11b）引导文件大小

Doctor 会检查工作区引导文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过配置的字符预算。它会报告每个文件的原始字符数与注入后字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及总注入字符数占总预算的比例。当文件被截断或接近限制时，Doctor 会打印调优 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的建议。

### 11c）Shell 补全

Doctor 会检查当前 shell 的 Tab 补全是否已安装（zsh、bash、fish 或 PowerShell）：

- 如果 shell profile 使用较慢的动态补全模式
  （`source <(openclaw completion ...)`），Doctor 会将其升级为更快的缓存文件变体。
- 如果 profile 中已配置补全，但缓存文件缺失，Doctor 会自动重新生成缓存。
- 如果完全没有配置补全，它会提示你安装
  （仅交互模式；使用 `--non-interactive` 时跳过）。

运行 `openclaw completion --write-state` 可手动重新生成缓存。

### 12）Gateway 网关认证检查（本地 token）

Doctor 会检查本地 Gateway 网关 token 认证就绪情况。

- 如果 token 模式需要 token 且不存在 token 来源，Doctor 会提供生成选项。
- 如果 `gateway.auth.token` 由 SecretRef 管理但当前不可用，Doctor 会发出警告，并且不会用明文覆盖它。
- 只有在未配置 token SecretRef 时，`openclaw doctor --generate-gateway-token` 才会强制生成。

### 12b）只读的 SecretRef 感知修复

某些修复流程需要检查已配置的凭证，但又不能削弱运行时快速失败行为。

- `openclaw doctor --fix` 现在使用与状态类命令相同的只读 SecretRef 摘要模型来执行定向配置修复。
- 例如：Telegram `allowFrom` / `groupAllowFrom` 的 `@username` 修复会在可用时尝试使用已配置的机器人凭证。
- 如果 Telegram 机器人 token 通过 SecretRef 配置，但在当前命令路径中不可用，Doctor 会报告该凭证“已配置但不可用”，并跳过自动解析，而不是崩溃或误报 token 缺失。

### 13）Gateway 网关健康检查 + 重启

Doctor 会运行健康检查，并在 Gateway 网关看起来不健康时提供重启选项。

### 13b）Memory 搜索就绪情况

Doctor 会检查默认智能体所配置的 Memory 搜索嵌入提供商是否就绪。具体行为取决于配置的后端和提供商：

- **QMD 后端**：探测 `qmd` 二进制是否可用并可启动。
  如果不可用，会打印修复指引，包括 npm 包以及手动二进制路径选项。
- **显式本地提供商**：检查是否存在本地模型文件，或可识别的远程/可下载模型 URL。如果缺失，会建议切换到远程提供商。
- **显式远程提供商**（`openai`、`voyage` 等）：验证环境中或 auth 存储中是否存在 API key。如果缺失，会打印可执行的修复提示。
- **自动提供商**：先检查本地模型可用性，然后按照自动选择顺序依次尝试每个远程提供商。

当 Gateway 网关探测结果可用时（检查时 Gateway 网关处于健康状态），Doctor 会将其结果与 CLI 可见配置交叉对照，并指出任何差异。

使用 `openclaw memory status --deep` 可在运行时验证嵌入就绪情况。

### 14）渠道状态警告

如果 Gateway 网关健康，Doctor 会运行渠道状态探测，并报告附带建议修复方法的警告。

### 15）Supervisor 配置审计 + 修复

Doctor 会检查已安装的 supervisor 配置（`launchd`/`systemd`/`schtasks`）是否缺失或落后于当前默认值（例如 `systemd` 的 `network-online` 依赖和重启延迟）。发现不匹配时，它会建议更新，并可将服务文件/任务重写为当前默认值。

说明：

- `openclaw doctor` 会在重写 supervisor 配置前提示确认。
- `openclaw doctor --yes` 会接受默认修复提示。
- `openclaw doctor --repair` 会在无提示的情况下应用推荐修复。
- `openclaw doctor --repair --force` 会覆盖自定义 supervisor 配置。
- 如果 token 认证需要 token 且 `gateway.auth.token` 由 SecretRef 管理，Doctor 在服务安装/修复时会校验 SecretRef，但不会将解析出的明文 token 值持久化到 supervisor 服务环境元数据中。
- 如果 token 认证需要 token 且配置的 token SecretRef 无法解析，Doctor 会阻止安装/修复路径，并提供可执行的指引。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，Doctor 会阻止安装/修复，直到明确设置 mode。
- 对于 Linux user-systemd 单元，Doctor 的 token 漂移检查现在同时包含 `Environment=` 和 `EnvironmentFile=` 来源，以比较服务认证元数据。
- 你始终可以通过 `openclaw gateway install --force` 强制完整重写。

### 16）Gateway 网关运行时 + 端口诊断

Doctor 会检查服务运行时（PID、最近退出状态），并在服务已安装但实际上未运行时发出警告。它还会检查 Gateway 网关端口（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已在运行、SSH 隧道）。

### 17）Gateway 网关运行时最佳实践

当 Gateway 网关服务运行在 Bun 上，或运行于由版本管理器管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上时，Doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，而版本管理器路径在升级后可能会失效，因为服务不会加载你的 shell 初始化。Doctor 会在可用时提供迁移到系统 Node 安装的选项（Homebrew/apt/choco）。

### 18）配置写入 + 向导元数据

Doctor 会持久化所有配置变更，并写入向导元数据以记录本次 Doctor 运行。

### 19）工作区提示（备份 + Memory 系统）

当工作区缺少 Memory 系统时，Doctor 会给出建议；如果工作区尚未纳入 git 管理，它还会打印备份提示。

完整的工作区结构与 git 备份指南，请参见 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)（推荐使用私有 GitHub 或 GitLab）。
