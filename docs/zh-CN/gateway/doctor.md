---
read_when:
    - 添加或修改 doctor 迁移
    - 引入破坏性配置变更
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-04-06T12:43:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f20637d373c3b1be7c4a3d5424228908b5639cfded8ad5acb9c29f882d0f8d2b
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它会修复过时的配置/状态，执行健康检查，并提供可操作的修复步骤。

## 快速开始

```bash
openclaw doctor
```

### 无头 / 自动化

```bash
openclaw doctor --yes
```

接受默认值而不提示（包括在适用时的重启/服务/沙箱修复步骤）。

```bash
openclaw doctor --repair
```

不经提示直接应用推荐修复（在安全的情况下进行修复 + 重启）。

```bash
openclaw doctor --repair --force
```

也应用激进修复（会覆盖自定义 supervisor 配置）。

```bash
openclaw doctor --non-interactive
```

在无提示的情况下运行，并且仅应用安全迁移（配置规范化 + 磁盘状态移动）。跳过需要人工确认的重启/服务/沙箱操作。
检测到旧状态迁移时会自动运行。

```bash
openclaw doctor --deep
```

扫描系统服务以查找额外的 Gateway 网关安装（`launchd`/`systemd`/`schtasks`）。

如果你想在写入前查看更改，先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 它会做什么（摘要）

- 针对 git 安装的可选飞行前更新（仅交互式）。
- UI 协议新鲜度检查（当协议 schema 更新时重建 Control UI）。
- 健康检查 + 重启提示。
- Skills 状态摘要（可用/缺失/被阻止）和插件状态。
- 对旧版值执行配置规范化。
- 将旧版扁平 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>` 的 Talk 配置迁移。
- 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪情况的浏览器迁移检查。
- OpenCode 提供商覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- 针对 OpenAI Codex OAuth 配置文件的 OAuth TLS 前置条件检查。
- 旧版磁盘状态迁移（会话/智能体目录/WhatsApp 认证）。
- 旧版插件清单 contract 键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
- 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层 delivery/payload 字段、payload `provider`、简单的 `notify: true` webhook 回退任务）。
- 会话锁文件检查和过期锁清理。
- 状态完整性和权限检查（会话、转录、状态目录）。
- 本地运行时的配置文件权限检查（`chmod 600`）。
- 模型认证健康状态：检查 OAuth 过期情况，可刷新即将过期的令牌，并报告认证配置文件的冷却/禁用状态。
- 额外工作区目录检测（`~/openclaw`）。
- 启用沙箱隔离时执行沙箱镜像修复。
- 旧版服务迁移和额外 Gateway 网关检测。
- Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式下）。
- Gateway 网关运行时检查（服务已安装但未运行；缓存的 `launchd` 标签）。
- 渠道状态警告（从正在运行的 Gateway 网关探测）。
- supervisor 配置审计（`launchd`/`systemd`/`schtasks`）及可选修复。
- Gateway 网关运行时最佳实践检查（Node 与 Bun、版本管理器路径）。
- Gateway 网关端口冲突诊断（默认 `18789`）。
- 针对开放私信策略的安全警告。
- 本地令牌模式下的 Gateway 网关认证检查（当不存在令牌来源时提供生成令牌；不会覆盖令牌 SecretRef 配置）。
- Linux 上的 `systemd linger` 检查。
- 工作区 bootstrap 文件大小检查（上下文文件的截断/接近上限警告）。
- Shell 补全状态检查和自动安装/升级。
- 内存搜索嵌入提供商就绪情况检查（本地模型、远程 API 密钥或 QMD 二进制文件）。
- 源码安装检查（`pnpm` 工作区不匹配、缺失 UI 资源、缺失 `tsx` 二进制文件）。
- 写入更新后的配置 + 向导元数据。

## 详细行为和原理说明

### 0）可选更新（git 安装）

如果这是一个 git 检出副本，并且 doctor 以交互方式运行，它会在运行 doctor 之前提供更新选项（fetch/rebase/build）。

### 1）配置规范化

如果配置包含旧版值形态（例如 `messages.ackReaction` 没有渠道特定覆盖），doctor 会将其规范化为当前 schema。

这也包括旧版扁平 Talk 字段。当前公开的 Talk 配置是
`talk.provider` + `talk.providers.<provider>`。Doctor 会将旧的
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` 形式重写到 provider 映射中。

### 2）旧版配置键迁移

当配置中包含已弃用键时，其他命令会拒绝运行，并要求你运行
`openclaw doctor`。

Doctor 将会：

- 说明发现了哪些旧版键。
- 显示它应用的迁移。
- 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

Gateway 网关 在启动时检测到旧版配置格式时，也会自动运行 doctor 迁移，因此过时配置无需手动干预即可被修复。
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
- 对于具有命名 `accounts` 但仍残留单账户顶层渠道值的渠道，将这些账户范围的值移动到该渠道所选的提升账户中（大多数渠道使用 `accounts.default`；Matrix 可保留现有匹配的命名/默认目标）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- 删除 `browser.relayBindHost`（旧版扩展 relay 设置）

Doctor 警告还包括针对多账户渠道的默认账户指导：

- 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但没有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 会警告回退路由可能会选择意外的账户。
- 如果 `channels.<channel>.defaultAccount` 设置为未知账户 ID，doctor 会发出警告并列出已配置的账户 ID。

### 2b）OpenCode 提供商覆盖

如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，
它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode 目录。
这可能会将模型强制路由到错误的 API，或将成本归零。Doctor 会发出警告，以便你删除该覆盖并恢复按模型的 API 路由 + 成本。

### 2c）浏览器迁移和 Chrome MCP 就绪情况

如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，doctor 会将其规范化为当前的主机本地 Chrome MCP 连接模型：

- `browser.profiles.*.driver: "extension"` 变为 `"existing-session"`
- 删除 `browser.relayBindHost`

当你使用 `defaultProfile:
"user"` 或已配置的 `existing-session` 配置文件时，doctor 还会审计主机本地的 Chrome MCP 路径：

- 检查默认自动连接配置文件是否在同一主机上安装了 Google Chrome
- 检查检测到的 Chrome 版本，并在其低于 Chrome 144 时发出警告
- 提醒你在浏览器检查页面中启用远程调试（例如
  `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`，
  或 `edge://inspect/#remote-debugging`）

Doctor 无法为你启用 Chrome 侧设置。主机本地 Chrome MCP
仍然需要：

- Gateway 网关/节点主机上的 Chromium 内核浏览器 144+
- 浏览器在本地运行
- 在该浏览器中启用远程调试
- 在浏览器中批准首次连接的同意提示

这里的就绪情况仅涉及本地连接前置条件。Existing-session 保留当前 Chrome MCP 路由限制；像 `responsebody`、PDF 导出、下载拦截和批处理操作这样的高级路由仍然需要受管浏览器或原始 CDP 配置文件。

此检查**不**适用于 Docker、沙箱、remote-browser 或其他无头流程。那些流程会继续使用原始 CDP。

### 2d）OAuth TLS 前置条件

配置了 OpenAI Codex OAuth 配置文件时，doctor 会探测 OpenAI
授权端点，以验证本地 Node/OpenSSL TLS 栈是否能够校验证书链。如果探测因证书错误失败（例如
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），doctor 会输出特定于平台的修复指导。在使用 Homebrew Node 的 macOS 上，
修复通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关健康，该探测也会运行。

### 3）旧版状态迁移（磁盘布局）

Doctor 可以将旧版磁盘布局迁移到当前结构：

- 会话存储 + 转录：
  - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
- 智能体目录：
  - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp 认证状态（Baileys）：
  - 从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
  - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 id：`default`）

这些迁移尽力而为且可幂等；如果留下任何旧版文件夹作为备份，doctor 会发出警告。
Gateway 网关/CLI 也会在启动时自动迁移旧版会话 + 智能体目录，因此历史记录/认证/模型会进入按智能体划分的路径，而无需手动运行 doctor。WhatsApp 认证则有意仅通过 `openclaw doctor` 迁移。Talk provider/provider-map 规范化现在按结构相等进行比较，因此仅键顺序不同的差异不再触发重复的无操作 `doctor --fix` 更改。

### 3a）旧版插件清单迁移

Doctor 会扫描所有已安装插件清单中的已弃用顶层 capability
键（`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、
`webSearchProviders`）。发现后，它会提供将它们移动到 `contracts`
对象并原地重写清单文件。此迁移是幂等的；
如果 `contracts` 键已经具有相同的值，则会删除旧版键，而不会重复数据。

### 3b）旧版 cron 存储迁移

Doctor 还会检查 cron 任务存储（默认是 `~/.openclaw/cron/jobs.json`，
或者在覆盖时使用 `cron.store`）中调度器仍为兼容性而接受的旧任务形态。

当前 cron 清理包括：

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- 顶层 payload 字段（`message`、`model`、`thinking`、...）→ `payload`
- 顶层 delivery 字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
- payload `provider` delivery 别名 → 显式 `delivery.channel`
- 简单旧版 `notify: true` webhook 回退任务 → 显式 `delivery.mode="webhook"` 并带有 `delivery.to=cron.webhook`

Doctor 仅会在能够不改变行为的情况下自动迁移 `notify: true` 任务。
如果某个任务将旧版 notify 回退与现有非 webhook delivery 模式组合使用，doctor 会发出警告并将该任务留给你手动审查。

### 3c）会话锁清理

Doctor 会扫描每个智能体会话目录中的过期写锁文件——即会话异常退出后遗留的文件。对于发现的每个锁文件，它会报告：
路径、PID、PID 是否仍存活、锁的年龄，以及它是否被视为过期（PID 已死亡或超过 30 分钟）。在 `--fix` / `--repair`
模式下，它会自动删除过期锁文件；否则会打印说明，并指示你使用 `--fix` 重新运行。

### 4）状态完整性检查（会话持久化、路由和安全）

状态目录是运行中的核心中枢。如果它消失了，你将失去
会话、凭证、日志和配置（除非你在别处有备份）。

Doctor 会检查：

- **状态目录缺失**：警告灾难性的状态丢失，提示重新创建
  目录，并提醒你它无法恢复丢失的数据。
- **状态目录权限**：验证可写性；提供修复权限选项
  （检测到所有者/组不匹配时会给出 `chown` 提示）。
- **macOS 云同步状态目录**：当状态路径解析到 iCloud Drive
  （`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或
  `~/Library/CloudStorage/...` 下时发出警告，因为由同步支持的路径可能导致更慢的 I/O
  和锁/同步竞争。
- **Linux SD 或 eMMC 状态目录**：当状态路径解析到 `mmcblk*`
  挂载源时发出警告，因为基于 SD 或 eMMC 的随机 I/O 在会话和凭证写入下可能更慢且磨损更快。
- **会话目录缺失**：`sessions/` 和会话存储目录是
  持久保存历史记录并避免 `ENOENT` 崩溃所必需的。
- **转录不匹配**：当最近的会话条目缺少
  转录文件时发出警告。
- **主会话“1 行 JSONL”**：当主转录文件只有一行时标记出来（历史没有持续累积）。
- **多个状态目录**：当不同 home 目录下存在多个 `~/.openclaw` 文件夹，
  或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史可能在多个安装之间分裂）。
- **远程模式提醒**：如果 `gateway.mode=remote`，doctor 会提醒你在
  远程主机上运行它（状态存储在那里）。
- **配置文件权限**：如果 `~/.openclaw/openclaw.json` 对
  组/所有人可读，则会发出警告并提供收紧到 `600` 的选项。

### 5）模型认证健康状态（OAuth 过期）

Doctor 会检查认证存储中的 OAuth 配置文件，在令牌
即将过期/已过期时发出警告，并在安全时进行刷新。如果 Anthropic
OAuth/令牌配置文件已过期，它会建议使用 Anthropic API 密钥或旧版
Anthropic setup-token 路径。
只有在交互式运行（TTY）时才会出现刷新提示；`--non-interactive`
会跳过刷新尝试。

Doctor 还会检测过时且已移除的 Anthropic Claude CLI 状态。如果旧的
`anthropic:claude-cli` 凭证字节仍存在于 `auth-profiles.json` 中，
doctor 会将其转换回 Anthropic 令牌/OAuth 配置文件，并重写过时的
`claude-cli/...` 模型引用以及 `agents.defaults.cliBackends.claude-cli`。
如果这些字节已不存在，doctor 会删除过时配置并输出恢复命令。

Doctor 还会报告由于以下原因而暂时不可用的认证配置文件：

- 短暂冷却（速率限制/超时/认证失败）
- 较长时间禁用（计费/额度失败）

### 6）Hooks 模型验证

如果设置了 `hooks.gmail.model`，doctor 会根据
目录和 allowlist 验证该模型引用，并在无法解析或被禁止时发出警告。

### 7）沙箱镜像修复

启用沙箱隔离时，doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建或切换到旧版名称的选项。

### 7b）内置插件运行时依赖

Doctor 会验证内置插件运行时依赖（例如
Discord 插件运行时包）是否存在于 OpenClaw 安装根目录中。
如果有任何缺失，doctor 会报告这些包，并在
`openclaw doctor --fix` / `openclaw doctor --repair` 模式下安装它们。

### 8）Gateway 网关服务迁移和清理提示

Doctor 会检测旧版 Gateway 网关服务（`launchd`/`systemd`/`schtasks`），
并提供移除它们以及使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。
它还可以扫描额外的类 Gateway 网关服务并输出清理提示。
带有配置文件名称的 OpenClaw Gateway 网关服务被视为一等公民，不会
被标记为“额外”。

### 8b）启动 Matrix 迁移

当 Matrix 渠道账户存在待处理或可执行的旧版状态迁移时，
doctor（在 `--fix` / `--repair` 模式下）会先创建迁移前快照，
然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版
加密状态准备。这两个步骤都不是致命的；错误会被记录，启动会继续进行。在只读模式下（`openclaw doctor` 不带 `--fix`）此检查会被完全跳过。

### 9）安全警告

当某个提供商对私信开放但没有 allowlist，或
当某个策略以危险方式配置时，doctor 会发出警告。

### 10）systemd linger（Linux）

如果作为 `systemd` 用户服务运行，doctor 会确保启用 lingering，以便
Gateway 网关在注销后仍保持运行。

### 11）工作区状态（Skills、插件和旧版目录）

Doctor 会输出默认智能体的工作区状态摘要：

- **Skills 状态**：统计可用、缺少要求和被 allowlist 阻止的 Skills 数量。
- **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录
  与当前工作区并存时发出警告。
- **插件状态**：统计已加载/已禁用/出错的插件；列出任意
  错误对应的插件 ID；报告 bundle 插件 capability。
- **插件兼容性警告**：标记与
  当前运行时存在兼容性问题的插件。
- **插件诊断**：展示由
  插件注册表在加载时发出的任何警告或错误。

### 11b）Bootstrap 文件大小

Doctor 会检查工作区 bootstrap 文件（例如 `AGENTS.md`、
`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过已配置的
字符预算。它会报告每个文件的原始字符数与注入后字符数、截断
百分比、截断原因（`max/file` 或 `max/total`），以及总注入
字符数占总预算的比例。当文件被截断或接近限制时，doctor 会输出调优 `agents.defaults.bootstrapMaxChars`
和 `agents.defaults.bootstrapTotalMaxChars` 的建议。

### 11c）Shell 补全

Doctor 会检查当前 shell
（zsh、bash、fish 或 PowerShell）是否已安装 Tab 补全：

- 如果 shell 配置文件使用较慢的动态补全模式
  （`source <(openclaw completion ...)`），doctor 会将其升级为更快的
  缓存文件变体。
- 如果补全已在配置文件中配置，但缓存文件缺失，
  doctor 会自动重新生成缓存。
- 如果完全未配置补全，
  doctor 会提示安装它
  （仅交互模式；使用 `--non-interactive` 时跳过）。

运行 `openclaw completion --write-state` 可手动重新生成缓存。

### 12）Gateway 网关认证检查（本地令牌）

Doctor 会检查本地 Gateway 网关令牌认证就绪情况。

- 如果令牌模式需要令牌但不存在令牌来源，doctor 会提供生成令牌的选项。
- 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，doctor 会发出警告，并且不会用明文覆盖它。
- `openclaw doctor --generate-gateway-token` 仅会在未配置令牌 SecretRef 时强制生成。

### 12b）只读且感知 SecretRef 的修复

某些修复流程需要检查已配置的凭证，同时又不能削弱运行时快速失败行为。

- `openclaw doctor --fix` 现在使用与 status 系列命令相同的只读 SecretRef 摘要模型来执行有针对性的配置修复。
- 示例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修复会在可用时尝试使用已配置的机器人凭证。
- 如果 Telegram 机器人令牌通过 SecretRef 配置，但在当前命令路径中不可用，doctor 会报告该凭证“已配置但不可用”，并跳过自动解析，而不是崩溃或误报令牌缺失。

### 13）Gateway 网关健康检查 + 重启

Doctor 会运行健康检查，并在 Gateway 网关看起来
不健康时提供重启选项。

### 13b）内存搜索就绪情况

Doctor 会检查为默认智能体配置的内存搜索嵌入提供商是否已就绪。
行为取决于已配置的 backend 和 provider：

- **QMD backend**：探测 `qmd` 二进制文件是否可用且可启动。
  如果不可用，会输出修复指导，包括 npm 包和手动二进制路径选项。
- **显式本地 provider**：检查本地模型文件或可识别的
  远程/可下载模型 URL 是否存在。如果缺失，会建议切换到远程提供商。
- **显式远程 provider**（`openai`、`voyage` 等）：验证 API 密钥是否
  存在于环境或认证存储中。如果缺失，会输出可操作的修复提示。
- **自动 provider**：先检查本地模型可用性，然后按自动选择顺序尝试每个远程
  provider。

当 Gateway 网关探测结果可用时（即检查时 Gateway 网关健康），doctor 会将其结果与 CLI 可见配置进行交叉比对，并注明
任何差异。

使用 `openclaw memory status --deep` 可在运行时验证嵌入就绪情况。

### 14）渠道状态警告

如果 Gateway 网关健康，doctor 会运行渠道状态探测，并报告
带有建议修复方式的警告。

### 15）supervisor 配置审计 + 修复

Doctor 会检查已安装的 supervisor 配置（`launchd`/`systemd`/`schtasks`）是否存在
缺失或过时的默认值（例如 systemd 的 network-online 依赖项和
重启延迟）。发现不匹配时，它会建议更新，并可以
将服务文件/任务重写为当前默认值。

说明：

- `openclaw doctor` 会在重写 supervisor 配置前进行提示。
- `openclaw doctor --yes` 会接受默认修复提示。
- `openclaw doctor --repair` 会不经提示应用推荐修复。
- `openclaw doctor --repair --force` 会覆盖自定义 supervisor 配置。
- 如果令牌认证需要令牌，并且 `gateway.auth.token` 由 SecretRef 管理，doctor 在服务安装/修复时会验证 SecretRef，但不会将解析后的明文令牌值持久化到 supervisor 服务环境元数据中。
- 如果令牌认证需要令牌，而已配置的令牌 SecretRef 无法解析，doctor 会阻止安装/修复路径，并给出可操作的指导。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，doctor 会阻止安装/修复，直到明确设置模式。
- 对于 Linux 用户级 systemd 单元，doctor 的令牌漂移检查现在会同时包含 `Environment=` 和 `EnvironmentFile=` 来源，以便比较服务认证元数据。
- 你始终可以通过 `openclaw gateway install --force` 强制完整重写。

### 16）Gateway 网关运行时 + 端口诊断

Doctor 会检查服务运行时（PID、上次退出状态），并在
服务已安装但实际上未运行时发出警告。它还会检查
Gateway 网关端口（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已在运行、SSH 隧道）。

### 17）Gateway 网关运行时最佳实践

当 Gateway 网关服务运行在 Bun 上，或运行在版本管理的 Node 路径
（`nvm`、`fnm`、`volta`、`asdf` 等）上时，doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，
而版本管理器路径可能会在升级后失效，因为服务不会
加载你的 shell 初始化。Doctor 会在系统 Node 安装可用时提供迁移到它的选项（Homebrew/apt/choco）。

### 18）配置写入 + 向导元数据

Doctor 会持久化任何配置更改，并写入向导元数据以记录此次
doctor 运行。

### 19）工作区提示（备份 + 内存系统）

Doctor 会在缺失时建议设置工作区内存系统，并在工作区尚未纳入 git 管理时输出备份提示。

参见 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)，获取有关
工作区结构和 git 备份（推荐使用私有 GitHub 或 GitLab）的完整指南。
