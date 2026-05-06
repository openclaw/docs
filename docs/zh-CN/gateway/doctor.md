---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置变更
sidebarTitle: Doctor
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-05-06T01:50:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cee2793b1a0665a3a816586fcb597de1fd3133819d34480aa420346f4d7a78d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它会修复过期的配置/状态、检查健康状况，并提供可执行的修复步骤。

## 快速开始

```bash
openclaw doctor
```

### 无头和自动化模式

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    不提示直接接受默认值（包括适用时的重启/服务/沙箱修复步骤）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示直接应用推荐修复（在安全时执行修复 + 重启）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    同时应用激进修复（覆盖自定义 supervisor 配置）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    无提示运行，并且只应用安全迁移（配置规范化 + 磁盘状态移动）。跳过需要人工确认的重启/服务/沙箱操作。检测到旧版状态迁移时会自动运行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    扫描系统服务，查找额外的 Gateway 网关安装（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果你想在写入前查看变更，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 它会做什么（摘要）

<AccordionGroup>
  <Accordion title="健康状况、UI 和更新">
    - 对 git 安装执行可选的预检更新（仅交互模式）。
    - UI 协议新鲜度检查（当协议架构更新时重建 Control UI）。
    - 健康检查 + 重启提示。
    - Skills 状态摘要（符合条件/缺失/阻塞）和插件状态。

  </Accordion>
  <Accordion title="配置和迁移">
    - 对旧版值进行配置规范化。
    - 将旧版扁平 `talk.*` 字段迁移为 `talk.provider` + `talk.providers.<provider>`。
    - 检查旧版 Chrome 扩展配置和 Chrome MCP 就绪状态的浏览器迁移。
    - OpenCode 提供商覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth 配置文件的 OAuth TLS 前置条件检查。
    - 当 `plugins.allow` 具有限制性，但工具策略仍要求通配符或插件拥有的工具时发出插件/工具 allowlist 警告。
    - 旧版磁盘状态迁移（会话/智能体目录/WhatsApp 凭证）。
    - 旧版插件清单契约键迁移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 旧版 cron 存储迁移（`jobId`, `schedule.cron`, 顶层 delivery/payload 字段、payload `provider`、简单 `notify: true` webhook 回退任务）。
    - 将旧版智能体运行时策略迁移到 `agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。
    - 启用插件时清理过期插件配置；当 `plugins.enabled=false` 时，过期插件引用会被视为惰性隔离配置并保留。

  </Accordion>
  <Accordion title="状态和完整性">
    - 检查会话锁文件并清理过期锁。
    - 修复受 2026.4.24 构建影响而创建的重复 prompt-rewrite 分支会话 transcript。
    - 检测卡住的子智能体重启恢复 tombstone，支持用 `--fix` 清理过期的 aborted recovery 标志，避免启动时继续将子进程视为 restart-aborted。
    - 状态完整性和权限检查（会话、transcript、状态目录）。
    - 本地运行时检查配置文件权限（chmod 600）。
    - 模型凭证健康状况：检查 OAuth 过期时间，可刷新即将过期的 token，并报告 auth-profile cooldown/disabled 状态。
    - 检测额外的工作区目录（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway 网关、服务和 supervisor">
    - 启用沙箱隔离时修复沙箱镜像。
    - 旧版服务迁移和额外 Gateway 网关检测。
    - Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式下）。
    - Gateway 网关运行时检查（服务已安装但未运行；缓存的 launchd label）。
    - 渠道状态警告（从正在运行的 Gateway 网关探测）。
    - 当本地 TUI 客户端仍在运行时，检查 WhatsApp 响应能力，以发现退化的 Gateway 网关 event-loop 健康状况；`--fix` 只会停止已验证的本地 TUI 客户端。
    - 修复主要模型、fallback、heartbeat/subagent/compaction 覆盖、钩子、渠道模型覆盖以及会话 route pin 中旧版 `openai-codex/*` 模型引用的 Codex route；`--fix` 会将它们重写为 `openai/*`，并且只有在 Codex 插件已安装、已启用、提供 `codex` harness 且具备可用 OAuth 时，才选择 `agentRuntime.id: "codex"`。否则选择 `agentRuntime.id: "pi"`。
    - Supervisor 配置审计（launchd/systemd/schtasks），可选择修复。
    - 为安装或更新期间捕获 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值的 Gateway 网关服务清理嵌入式代理环境。
    - Gateway 网关运行时最佳实践检查（Node vs Bun、版本管理器路径）。
    - Gateway 网关端口冲突诊断（默认 `18789`）。

  </Accordion>
  <Accordion title="凭证、安全和配对">
    - 针对开放私信策略的安全警告。
    - 检查 local token 模式下的 Gateway 网关凭证（当不存在 token 来源时提供 token 生成；不会覆盖 token SecretRef 配置）。
    - 设备配对故障检测（待处理的首次配对请求、待处理的角色/scope 升级、过期的本地 device-token 缓存漂移，以及 paired-record 凭证漂移）。

  </Accordion>
  <Accordion title="工作区和 shell">
    - Linux 上的 systemd linger 检查。
    - 工作区 bootstrap 文件大小检查（针对上下文文件的截断/接近限制警告）。
    - 默认智能体的 Skills 就绪状态检查；报告允许但缺少 bin、环境变量、配置或 OS 要求的技能，且 `--fix` 可以在 `skills.entries` 中禁用不可用技能。
    - Shell completion 状态检查和自动安装/升级。
    - 记忆搜索 embedding 提供商就绪状态检查（本地模型、远程 API key 或 QMD binary）。
    - 源码安装检查（pnpm workspace 不匹配、缺少 UI 资源、缺少 tsx binary）。
    - 写入更新后的配置 + 向导元数据。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填和重置

Control UI 的 Dreams 场景包含用于 grounded dreaming 工作流的 **Backfill**、**Reset** 和 **Clear Grounded** 操作。这些操作使用 Gateway 网关 doctor 风格的 RPC 方法，但它们**不是** `openclaw doctor` CLI 修复/迁移的一部分。

它们会做什么：

- **Backfill** 扫描活动工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行 grounded REM diary pass，并将可逆的回填条目写入 `DREAMS.md`。
- **Reset** 只从 `DREAMS.md` 中移除这些带标记的回填 diary 条目。
- **Clear Grounded** 只移除来自历史重放、且尚未积累 live recall 或 daily support 的已暂存 grounded-only 短期条目。

它们本身**不会**做什么：

- 它们不会编辑 `MEMORY.md`
- 它们不会运行完整的 doctor 迁移
- 它们不会自动将 grounded candidates 暂存到 live short-term promotion store，除非你先显式运行 staged CLI path

如果你想让 grounded 历史重放影响正常的 deep promotion lane，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这会将 grounded durable candidates 暂存到 short-term dreaming store，同时保留 `DREAMS.md` 作为 review surface。

## 详细行为和理由

<AccordionGroup>
  <Accordion title="0. 可选更新（git 安装）">
    如果这是一个 git checkout 且 doctor 以交互方式运行，它会在运行 doctor 前提供更新（fetch/rebase/build）选项。
  </Accordion>
  <Accordion title="1. 配置规范化">
    如果配置包含旧版值形状（例如没有特定渠道覆盖的 `messages.ackReaction`），doctor 会将它们规范化为当前架构。

    这包括旧版 Talk 扁平字段。当前公开的 Talk 语音配置是 `talk.provider` + `talk.providers.<provider>`，实时语音配置是 `talk.realtime.*`。Doctor 会将旧的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形状重写到提供商映射中，并将旧版顶层实时选择器（`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`）重写到 `talk.realtime`。

    当 `plugins.allow` 非空且工具策略使用
    通配符或插件拥有的工具条目时，Doctor 也会发出警告。`tools.allow: ["*"]` 只匹配
    实际加载的插件中的工具；它不会绕过排他性的插件
    allowlist。Doctor 会为迁移后的
    旧版 allowlist 配置写入 `plugins.bundledDiscovery: "compat"`，以保留现有的内置提供商行为，
    然后指向更严格的 `"allowlist"` 设置。

  </Accordion>
  <Accordion title="2. 旧版配置键迁移">
    当配置包含已弃用的键时，其他命令会拒绝运行并要求你运行 `openclaw doctor`。

    Doctor 会：

    - 说明发现了哪些旧版键。
    - 显示它应用的迁移。
    - 使用更新后的架构重写 `~/.openclaw/openclaw.json`。

    Gateway 网关在启动时如果检测到旧版配置格式，也会自动运行 doctor 迁移，因此过期配置无需人工干预即可修复。Cron job store 迁移由 `openclaw doctor --fix` 处理。

    当前迁移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 缺少可见回复策略的已配置渠道配置 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → 顶层 `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 旧版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - 旧版顶层实时 Talk 选择器（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` 和 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 和 `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` 和 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 和 `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 对于带有具名 `accounts` 但仍残留单账号顶层渠道值的渠道，将这些账号作用域的值移入为该渠道选择的提升账号（多数渠道使用 `accounts.default`；Matrix 可以保留现有匹配的具名/默认目标）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；对较慢的提供商/模型超时使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（旧版扩展中继设置）
    - 旧版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 网关启动时也会跳过 `api` 被设置为未来或未知枚举值的提供商，而不是以关闭方式失败）

    Doctor 警告还包括多账号渠道的账号默认值指导：

    - 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但没有配置 `channels.<channel>.defaultAccount` 或 `accounts.default`，Doctor 会警告回退路由可能选中非预期账号。
    - 如果 `channels.<channel>.defaultAccount` 被设置为未知账号 ID，Doctor 会警告并列出已配置的账号 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供商覆盖项">
    如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode 目录。这可能会强制模型走错误的 API，或将成本清零。Doctor 会警告，以便你移除覆盖项并恢复逐模型 API 路由 + 成本。
  </Accordion>
  <Accordion title="2c. 浏览器迁移和 Chrome MCP 就绪状态">
    如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，Doctor 会将其规范化为当前的主机本地 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 变为 `"existing-session"`
    - `browser.relayBindHost` 会被移除

    当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` 配置文件时，Doctor 还会审查主机本地 Chrome MCP 路径：

    - 检查默认自动连接配置文件的同一主机上是否安装了 Google Chrome
    - 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
    - 提醒你在浏览器检查页面中启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 无法替你启用 Chrome 端设置。主机本地 Chrome MCP 仍然要求：

    - Gateway 网关/节点主机上有基于 Chromium 的浏览器 144+
    - 浏览器在本地运行
    - 该浏览器中已启用远程调试
    - 在浏览器中批准首次附加同意提示

    这里的就绪状态仅涉及本地附加前置条件。Existing-session 会保留当前 Chrome MCP 路由限制；`responsebody`、PDF 导出、下载拦截和批量操作等高级路由仍需要托管浏览器或原始 CDP 配置文件。

    此检查**不**适用于 Docker、沙箱、remote-browser 或其他无头流程。它们会继续使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置条件">
    配置 OpenAI Codex OAuth 配置文件后，Doctor 会探测 OpenAI 授权端点，以验证本地 Node/OpenSSL TLS 栈是否能校验证书链。如果探测因证书错误失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、过期证书或自签名证书），Doctor 会打印平台特定的修复指导。在使用 Homebrew Node 的 macOS 上，修复方式通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关处于健康状态，也会运行该探测。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供商覆盖项">
    如果你之前在 `models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，它们可能会遮蔽较新版本自动使用的内置 Codex OAuth 提供商路径。Doctor 在看到这些旧传输设置与 Codex OAuth 同时存在时会警告，以便你移除或重写过期的传输覆盖项，并恢复内置路由/回退行为。仍然支持自定义代理和仅标头覆盖项，并且不会触发此警告。
  </Accordion>
  <Accordion title="2f. Codex 路由修复">
    Doctor 会检查旧版 `openai-codex/*` 模型引用。原生 Codex harness 路由使用规范的 `openai/*` 模型引用以及 `agentRuntime.id: "codex"`，这样轮次会经过 Codex app-server harness，而不是 OpenClaw PI OpenAI 路径。

    在 `--fix` / `--repair` 模式下，Doctor 会重写受影响的默认智能体和逐智能体引用，包括主模型、回退、heartbeat/subagent/compaction 覆盖项、钩子、渠道模型覆盖项，以及过期的持久化会话路由状态：

    - `openai-codex/gpt-*` 变为 `openai/gpt-*`。
    - 仅当 Codex 已安装、已启用、提供 `codex` harness 且拥有可用 OAuth 时，匹配的智能体运行时才会变为 `agentRuntime.id: "codex"`。
    - 否则，匹配的智能体运行时会变为 `agentRuntime.id: "pi"`。
    - 现有模型回退列表会被保留，并重写其中的旧版条目；复制的逐模型设置会从旧版键移动到规范的 `openai/*` 键。
    - 持久化会话中的 `modelProvider`/`providerOverride`、`model`/`modelOverride`、回退通知、auth-profile 固定项和 Codex harness 固定项会在所有发现的智能体会话存储中被修复。
    - `/codex ...` 表示“从聊天中控制或绑定原生 Codex 对话”。
    - `/acp ...` 或 `runtime: "acp"` 表示“使用外部 ACP/acpx 适配器”。

  </Accordion>
  <Accordion title="2g. 会话路由清理">
    在你将配置的模型或运行时从 Codex 等插件拥有的路由移开后，Doctor 还会扫描发现的智能体会话存储，查找过期的自动创建路由状态。

    `openclaw doctor --fix` 可以清除自动创建的过期状态，例如 `modelOverrideSource: "auto"` 模型固定项、运行时模型元数据、固定的 harness ID、CLI 会话绑定，以及当其所属路由不再配置时的自动 auth-profile 覆盖项。显式用户或旧版会话模型选择会被报告以供手动审查，并保持不变；当不再需要该路由时，使用 `/model ...`、`/new` 切换它们，或重置会话。

  </Accordion>
  <Accordion title="3. 旧版状态迁移（磁盘布局）">
    Doctor 可以将较旧的磁盘布局迁移到当前结构：

    - 会话存储 + transcripts：
      - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - 智能体目录：
      - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 认证状态（Baileys）：
      - 从旧版 `~/.openclaw/credentials/*.json`（不包括 `oauth.json`）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账号 ID：`default`）

    这些迁移会尽力执行且幂等；当 Doctor 将任何旧版文件夹作为备份留下时，会发出警告。Gateway 网关/CLI 也会在启动时自动迁移旧版会话 + 智能体目录，这样历史记录/认证/模型会落到逐智能体路径下，无需手动运行 Doctor。WhatsApp 认证有意只通过 `openclaw doctor` 迁移。Talk 提供商/提供商映射规范化现在通过结构相等性进行比较，因此仅键顺序不同的差异不再触发重复的空操作 `doctor --fix` 更改。

  </Accordion>
  <Accordion title="3a. 旧版插件清单迁移">
    Doctor 会扫描所有已安装的插件清单，查找已弃用的顶层能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。发现后，它会提议将它们移动到 `contracts` 对象中，并就地重写清单文件。此迁移是幂等的；如果 `contracts` 键已包含相同值，旧版键会被移除，而不会重复数据。
  </Accordion>
  <Accordion title="3b. 旧版 cron 存储迁移">
    Doctor 还会检查 cron 作业存储（默认是 `~/.openclaw/cron/jobs.json`，或在覆盖时使用 `cron.store`），查找调度器仍为兼容性接受的旧作业形态。

    当前 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 顶层 payload 字段（`message`、`model`、`thinking`、...）→ `payload`
    - 顶层 delivery 字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` 投递别名 → 显式 `delivery.channel`
    - 简单旧版 `notify: true` webhook 回退作业 → 显式 `delivery.mode="webhook"`，并带有 `delivery.to=cron.webhook`

    Doctor 只有在不改变行为的情况下，才会自动迁移 `notify: true` 作业。如果某个作业将旧版 notify 回退与现有的非 webhook 投递模式结合使用，Doctor 会发出警告，并将该作业留给人工审查。

    在 Linux 上，如果用户的 crontab 仍调用旧版 `~/.openclaw/bin/ensure-whatsapp.sh`，Doctor 也会发出警告。该主机本地脚本不再由当前 OpenClaw 维护，并且当 cron 无法访问 systemd user bus 时，可能会向 `~/.openclaw/logs/whatsapp-health.log` 写入错误的 `Gateway inactive` 消息。用 `crontab -e` 移除过时的 crontab 条目；使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status` 进行当前健康检查。

  </Accordion>
  <Accordion title="3c. 会话锁清理">
    Doctor 会扫描每个智能体会话目录，查找陈旧的写入锁文件，也就是会话异常退出时留下的文件。对找到的每个锁文件，它会报告：路径、PID、该 PID 是否仍然存活、锁的存在时间，以及是否被视为陈旧（PID 已死亡或超过 30 分钟）。在 `--fix` / `--repair` 模式下，它会自动移除陈旧锁文件；否则会打印一条说明，并指示你使用 `--fix` 重新运行。
  </Accordion>
  <Accordion title="3d. 会话 transcript 分支修复">
    Doctor 会扫描智能体会话 JSONL 文件，查找由 2026.4.24 prompt transcript 重写错误创建的重复分支形态：一个包含 OpenClaw 内部运行时上下文的废弃用户轮次，以及一个包含相同可见用户 prompt 的活跃 sibling。在 `--fix` / `--repair` 模式下，Doctor 会在原文件旁备份每个受影响文件，并将 transcript 重写到活跃分支，这样 Gateway 网关历史记录和记忆读取器就不再看到重复轮次。
  </Accordion>
  <Accordion title="4. 状态完整性检查（会话持久化、路由和安全）">
    状态目录是运行时的核心枢纽。如果它消失，你会丢失会话、凭证、日志和配置（除非你在别处有备份）。

    Doctor 检查：

    - **状态目录缺失**：警告灾难性状态丢失，提示重新创建目录，并提醒你它无法恢复缺失数据。
    - **状态目录权限**：验证可写性；提供修复权限的选项（并在检测到 owner/group 不匹配时发出 `chown` 提示）。
    - **macOS 云同步状态目录**：当状态解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下时发出警告，因为同步托管路径可能导致更慢的 I/O 和锁/同步竞争。
    - **Linux SD 或 eMMC 状态目录**：当状态解析到 `mmcblk*` 挂载源时发出警告，因为基于 SD 或 eMMC 的随机 I/O 在会话和凭证写入下可能更慢且磨损更快。
    - **会话目录缺失**：需要 `sessions/` 和会话存储目录来持久化历史记录并避免 `ENOENT` 崩溃。
    - **Transcript 不匹配**：当最近的会话条目缺少 transcript 文件时发出警告。
    - **主会话“1 行 JSONL”**：当主 transcript 只有一行时标记（历史记录没有累积）。
    - **多个状态目录**：当多个主目录中存在多个 `~/.openclaw` 文件夹，或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史记录可能在安装之间分裂）。
    - **远程模式提醒**：如果 `gateway.mode=remote`，Doctor 会提醒你在远程主机上运行它（状态位于那里）。
    - **配置文件权限**：如果 `~/.openclaw/openclaw.json` 对组/其他用户可读，则发出警告，并提供收紧到 `600` 的选项。

  </Accordion>
  <Accordion title="5. 模型身份验证健康状态（OAuth 过期）">
    Doctor 会检查 auth 存储中的 OAuth profiles，在 tokens 即将过期/已过期时发出警告，并在安全时刷新它们。如果 Anthropic OAuth/token profile 过期，它会建议使用 Anthropic API key 或 Anthropic setup-token 路径。刷新提示只会在交互式运行（TTY）时出现；`--non-interactive` 会跳过刷新尝试。

    当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、`invalid_grant`，或提供商要求你重新登录），Doctor 会报告需要重新认证，并打印要运行的准确 `openclaw models auth login --provider ...` 命令。

    Doctor 还会报告由于以下原因暂时不可用的 auth profiles：

    - 短暂冷却（速率限制/超时/身份验证失败）
    - 较长时间禁用（账单/额度失败）

  </Accordion>
  <Accordion title="6. 钩子模型验证">
    如果设置了 `hooks.gmail.model`，Doctor 会根据 catalog 和 allowlist 验证模型引用，并在无法解析或不允许时发出警告。
  </Accordion>
  <Accordion title="7. 沙箱镜像修复">
    启用沙箱隔离时，Doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建或切换到旧版名称的选项。
  </Accordion>
  <Accordion title="7b. 插件安装清理">
    Doctor 会在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下移除旧版 OpenClaw 生成的插件依赖 staging 状态。这包括陈旧的生成依赖根目录、旧的安装阶段目录、早期内置插件依赖修复代码留下的包本地碎片，以及可能遮蔽当前内置清单的孤立或已恢复的托管 npm 版内置 `@openclaw/*` 插件副本。

    当配置引用了可下载插件但本地插件注册表找不到它们时，Doctor 也可以重新安装缺失的可下载插件。示例包括实际的 `plugins.entries`、已配置的渠道/提供商/搜索设置，以及已配置的 Agent Runtimes。在包更新期间，Doctor 会避免在核心包正在替换时运行包管理器插件修复；如果已配置的插件在更新后仍需要恢复，请再次运行 `openclaw doctor --fix`。Gateway 网关启动和配置重载不会运行包管理器；插件安装仍然是显式的 Doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. Gateway 网关服务迁移和清理提示">
    Doctor 会检测旧版 Gateway 网关服务（launchd/systemd/schtasks），并提供移除它们并使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它还可以扫描额外的类似 Gateway 网关的服务并打印清理提示。带 profile 名称的 OpenClaw Gateway 网关服务被视为一等服务，不会被标记为“额外”。

    在 Linux 上，如果缺少用户级 Gateway 网关服务，但存在系统级 OpenClaw Gateway 网关服务，Doctor 不会自动安装第二个用户级服务。使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 检查，然后移除重复项，或在系统 supervisor 拥有 Gateway 网关生命周期时设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 启动 Matrix 迁移">
    当 Matrix 渠道账号存在待处理或可操作的旧版状态迁移时，Doctor（在 `--fix` / `--repair` 模式下）会创建迁移前快照，然后运行 best-effort 迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。这两个步骤都是非致命的；错误会被记录，启动会继续。在只读模式（不带 `--fix` 的 `openclaw doctor`）下，此检查会被完全跳过。
  </Accordion>
  <Accordion title="8c. 设备配对和身份验证漂移">
    Doctor 现在会将设备配对状态作为正常健康检查的一部分进行检查。

    它会报告：

    - 待处理的首次配对请求
    - 已配对设备的待处理角色升级
    - 已配对设备的待处理 scope 升级
    - 设备 id 仍匹配但设备身份不再匹配已批准记录时的公钥不匹配修复
    - 已配对记录缺少已批准角色的活跃 token
    - scope 漂移到已批准配对基线之外的已配对 tokens
    - 当前机器上早于 Gateway 网关侧 token 轮换或携带陈旧 scope 元数据的本地缓存设备 token 条目

    Doctor 不会自动批准配对请求，也不会自动轮换设备 tokens。它会改为打印准确的后续步骤：

    - 使用 `openclaw devices list` 检查待处理请求
    - 使用 `openclaw devices approve <requestId>` 批准准确的请求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新的 token
    - 使用 `openclaw devices remove <deviceId>` 移除并重新批准陈旧记录

    这补上了常见的“已配对但仍收到需要配对提示”漏洞：Doctor 现在会区分首次配对、待处理的角色/scope 升级，以及陈旧 token/设备身份漂移。

  </Accordion>
  <Accordion title="9. 安全警告">
    当某个提供商在没有 allowlist 的情况下对私信开放，或策略以危险方式配置时，Doctor 会发出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果作为 systemd user service 运行，Doctor 会确保已启用 lingering，以便 Gateway 网关在登出后保持存活。
  </Accordion>
  <Accordion title="11. 工作区状态（Skills、插件和旧版目录）">
    Doctor 会打印默认智能体的工作区状态摘要：

    - **Skills 状态**：统计符合条件、缺少需求和被 allowlist 阻止的 Skills。
    - **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录与当前工作区并存时发出警告。
    - **插件状态**：统计已启用/已禁用/出错的插件；列出任何错误的插件 ID；报告 bundle 插件能力。
    - **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
    - **插件诊断**：呈现插件注册表在加载时发出的任何警告或错误。

  </Accordion>
  <Accordion title="11b. Bootstrap 文件大小">
    Doctor 会检查工作区 bootstrap 文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过配置的字符预算。它会报告每个文件的原始字符数与注入字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及总注入字符数占总预算的比例。当文件被截断或接近限制时，Doctor 会打印调优 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 陈旧渠道插件清理">
    当 `openclaw doctor --fix` 移除缺失的渠道插件时，它也会移除引用该插件的悬空渠道作用域配置：`channels.<id>` 条目、命名该渠道的 heartbeat targets，以及 `agents.*.models["<channel>/*"]` overrides。这可以防止渠道运行时已消失但配置仍要求 Gateway 网关绑定到它而导致的 Gateway 网关启动循环。
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor 会检查当前 shell（zsh、bash、fish 或 PowerShell）是否已安装 tab 补全：

    - 如果 shell profile 使用慢速动态补全模式（`source <(openclaw completion ...)`），Doctor 会将其升级为更快的缓存文件变体。
    - 如果补全已在 profile 中配置但缓存文件缺失，Doctor 会自动重新生成缓存。
    - 如果完全没有配置补全，Doctor 会提示安装（仅交互模式；使用 `--non-interactive` 时跳过）。

    运行 `openclaw completion --write-state` 可手动重新生成缓存。

  </Accordion>
  <Accordion title="12. Gateway 网关身份验证检查（本地 token）">
    Doctor 会检查本地 Gateway 网关 token 身份验证就绪状态。

    - 如果 token 模式需要 token 但不存在 token 来源，Doctor 会提供生成一个的选项。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，Doctor 会发出警告，并且不会用明文覆盖它。
    - `openclaw doctor --generate-gateway-token` 仅在没有配置 token SecretRef 时强制生成。

  </Accordion>
  <Accordion title="12b. 支持 SecretRef 的只读修复">
    某些修复流程需要检查已配置的凭证，同时不削弱运行时快速失败行为。

    - `openclaw doctor --fix` 现在会使用与 Status 系列命令相同的只读 SecretRef 摘要模型来执行定向配置修复。
    - 示例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修复会在可用时尝试使用已配置的机器人凭证。
    - 如果 Telegram 机器人令牌通过 SecretRef 配置，但在当前命令路径中不可用，Doctor 会报告该凭证已配置但不可用，并跳过自动解析，而不是崩溃或误报令牌缺失。

  </Accordion>
  <Accordion title="13. Gateway 网关健康检查 + 重启">
    Doctor 会运行健康检查，并在 Gateway 网关看起来不健康时提示重启。
  </Accordion>
  <Accordion title="13b. 记忆搜索就绪状态">
    Doctor 会检查已配置的记忆搜索嵌入提供商是否已为默认智能体准备就绪。行为取决于已配置的后端和提供商：

    - **QMD 后端**：探测 `qmd` 二进制文件是否可用且可启动。如果不可用，会输出修复指导，包括 npm 包和手动二进制路径选项。
    - **显式本地提供商**：检查本地模型文件或可识别的远程/可下载模型 URL。如果缺失，建议切换到远程提供商。
    - **显式远程提供商**（`openai`、`voyage` 等）：验证环境或认证存储中是否存在 API 密钥。如果缺失，会输出可操作的修复提示。
    - **自动提供商**：先检查本地模型可用性，然后按自动选择顺序尝试每个远程提供商。

    当有缓存的 Gateway 网关探测结果可用时（检查时 Gateway 网关健康），Doctor 会将其结果与 CLI 可见的配置交叉比对，并标注任何差异。Doctor 不会在默认路径上启动新的嵌入 ping；需要实时提供商检查时，请使用深度记忆状态命令。

    使用 `openclaw memory status --deep` 在运行时验证嵌入就绪状态。

  </Accordion>
  <Accordion title="14. 渠道状态警告">
    如果 Gateway 网关健康，Doctor 会运行渠道状态探测，并报告警告及建议修复方式。
  </Accordion>
  <Accordion title="15. Supervisor 配置审计 + 修复">
    Doctor 会检查已安装的 supervisor 配置（launchd/systemd/schtasks）是否缺少默认值或默认值过旧（例如 systemd network-online 依赖和重启延迟）。当发现不匹配时，它会建议更新，并可以将服务文件/任务重写为当前默认值。

    注意：

    - `openclaw doctor` 会在重写 supervisor 配置前提示确认。
    - `openclaw doctor --yes` 接受默认修复提示。
    - `openclaw doctor --repair` 会在不提示的情况下应用建议修复。
    - `openclaw doctor --repair --force` 会覆盖自定义 supervisor 配置。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 会让 Doctor 对 Gateway 网关服务生命周期保持只读。它仍会报告服务健康状态并运行非服务修复，但会跳过服务安装/启动/重启/bootstrap、supervisor 配置重写和旧版服务清理，因为外部 supervisor 拥有该生命周期。
    - 在 Linux 上，当匹配的 systemd Gateway 网关单元处于活动状态时，Doctor 不会重写命令/入口点元数据。它还会在重复服务扫描期间忽略非活动的非旧版额外 Gateway 网关类单元，因此配套服务文件不会产生清理噪声。
    - 如果令牌认证需要令牌，并且 `gateway.auth.token` 由 SecretRef 管理，Doctor 服务安装/修复会验证 SecretRef，但不会将已解析的明文令牌值持久化到 supervisor 服务环境元数据中。
    - Doctor 会检测旧版 LaunchAgent、systemd 或 Windows Scheduled Task 安装中以内联方式嵌入的托管 `.env`/SecretRef 支持的服务环境值，并重写服务元数据，使这些值从运行时来源加载，而不是从 supervisor 定义加载。
    - Doctor 会检测服务命令是否在 `gateway.port` 变更后仍固定旧 `--port`，并将服务元数据重写为当前端口。
    - 如果令牌认证需要令牌，并且配置的令牌 SecretRef 未解析，Doctor 会阻止安装/修复路径并提供可操作的指导。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，Doctor 会阻止安装/修复，直到显式设置模式。
    - 对于 Linux 用户级 systemd 单元，Doctor 令牌漂移检查现在会在比较服务认证元数据时同时包含 `Environment=` 和 `EnvironmentFile=` 来源。
    - 当配置最后由较新版本写入时，Doctor 服务修复会拒绝从较旧的 OpenClaw 二进制重写、停止或重启 Gateway 网关服务。参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你始终可以通过 `openclaw gateway install --force` 强制完整重写。

  </Accordion>
  <Accordion title="16. Gateway 网关运行时 + 端口诊断">
    Doctor 会检查服务运行时（PID、上次退出状态），并在服务已安装但实际未运行时发出警告。它还会检查 Gateway 网关端口（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已在运行、SSH 隧道）。
  </Accordion>
  <Accordion title="17. Gateway 网关运行时最佳实践">
    当 Gateway 网关服务运行在 Bun 或版本管理器管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上时，Doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，而版本管理器路径可能会在升级后失效，因为服务不会加载你的 shell 初始化。Doctor 会在可用时提示迁移到系统 Node 安装（Homebrew/apt/choco）。

    新安装或已修复的 macOS LaunchAgent 会使用规范的系统 PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是复制交互式 shell PATH，因此 Volta、asdf、fnm、pnpm 和其他版本管理器目录不会改变 Node 子进程的解析位置。Linux 服务仍会保留显式环境根目录（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和稳定的用户 bin 目录，但猜测得到的版本管理器备用目录只有在这些目录实际存在于磁盘上时才会写入服务 PATH。

  </Accordion>
  <Accordion title="18. 配置写入 + 向导元数据">
    Doctor 会持久化任何配置变更，并写入向导元数据以记录 Doctor 运行。
  </Accordion>
  <Accordion title="19. 工作区提示（备份 + 记忆系统）">
    当缺少工作区记忆系统时，Doctor 会建议添加；如果工作区尚未纳入 git，则会输出备份提示。

    查看 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)，获取工作区结构和 git 备份的完整指南（建议使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
