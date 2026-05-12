---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入不兼容的配置变更
sidebarTitle: Doctor
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-05-12T08:45:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它会修复过时的配置/状态，检查健康状况，并提供可操作的修复步骤。

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

    不提示，接受默认值（适用时包括重启/服务/沙箱修复步骤）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示，应用推荐修复（在安全情况下执行修复 + 重启）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    同时应用激进修复（会覆盖自定义 supervisor 配置）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    不显示提示运行，并且只应用安全迁移（配置规范化 + 磁盘状态移动）。跳过需要人工确认的重启/服务/沙箱操作。检测到旧版状态迁移时会自动运行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    扫描系统服务，查找额外的 Gateway 网关安装（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果你想在写入前审查更改，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 它做什么（摘要）

<AccordionGroup>
  <Accordion title="健康、UI 和更新">
    - 对 git 安装执行可选的运行前更新（仅交互模式）。
    - UI 协议新鲜度检查（当协议 schema 更新时重建 Control UI）。
    - 健康检查 + 重启提示。
    - Skills 状态摘要（eligible/missing/blocked）和插件状态。

  </Accordion>
  <Accordion title="配置和迁移">
    - 对旧版值执行配置规范化。
    - 将旧版扁平 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>`。
    - 对旧版 Chrome 扩展配置和 Chrome MCP 就绪状态执行浏览器迁移检查。
    - OpenCode 提供商覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth 配置文件的 OAuth TLS 前置条件检查。
    - 当 `plugins.allow` 具有限制性但工具策略仍请求通配符或插件拥有的工具时，发出插件/工具 allowlist 警告。
    - 旧版磁盘状态迁移（会话/agent 目录/WhatsApp 凭证）。
    - 旧版插件清单合约键迁移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 旧版 cron 存储迁移（`jobId`, `schedule.cron`, 顶层 delivery/payload 字段、payload `provider`、简单的 `notify: true` webhook fallback 任务）。
    - 旧版整 agent 运行时策略清理；提供商/模型运行时策略是当前有效的路由选择器。
    - 插件启用时清理过时的插件配置；当 `plugins.enabled=false` 时，过时的插件引用会被视为惰性隔离配置并被保留。

  </Accordion>
  <Accordion title="状态和完整性">
    - 会话锁文件检查和过时锁清理。
    - 修复受影响的 2026.4.24 构建创建的重复 prompt-rewrite 分支的会话 transcript。
    - 检测卡住的 subagent 重启恢复 tombstone，并支持通过 `--fix` 清除过时的 aborted recovery 标记，避免启动时持续将该 child 视为 restart-aborted。
    - 状态完整性和权限检查（sessions、transcripts、state dir）。
    - 本地运行时进行配置文件权限检查（chmod 600）。
    - 模型凭证健康：检查 OAuth 过期时间，可刷新即将过期的 token，并报告 auth-profile cooldown/disabled 状态。
    - 检测额外 workspace 目录（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway 网关、服务和 supervisor">
    - 启用沙箱隔离时修复沙箱镜像。
    - 旧版服务迁移和额外 Gateway 网关检测。
    - Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式中）。
    - Gateway 网关运行时检查（服务已安装但未运行；缓存的 launchd label）。
    - 渠道状态警告（从正在运行的 Gateway 网关探测）。
    - 渠道特定权限检查位于 `openclaw channels capabilities` 下；例如，Discord 语音频道权限可通过 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 审计。
    - 针对 Gateway 网关事件循环健康状况降级但本地 TUI 客户端仍在运行的 WhatsApp 响应性检查；`--fix` 只会停止已验证的本地 TUI 客户端。
    - 修复主模型、fallback、heartbeat/subagent/compaction 覆盖、hook、渠道模型覆盖和会话路由 pin 中的旧版 `openai-codex/*` 模型引用；`--fix` 会将它们重写为 `openai/*`，移除过时的会话/整 agent 运行时 pin，并将规范的 OpenAI agent 引用保留在默认 Codex harness 上。
    - supervisor 配置审计（launchd/systemd/schtasks），可选择修复。
    - 清理 Gateway 网关服务的嵌入式代理环境，这些服务在安装或更新期间捕获了 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值。
    - Gateway 网关运行时最佳实践检查（Node vs Bun、version-manager 路径）。
    - Gateway 网关端口冲突诊断（默认 `18789`）。

  </Accordion>
  <Accordion title="凭证、安全和配对">
    - 针对开放私信策略的安全警告。
    - 本地 token 模式下的 Gateway 网关凭证检查（当不存在 token 来源时提供 token 生成；不会覆盖 token SecretRef 配置）。
    - 设备配对问题检测（待处理的首次配对请求、待处理的角色/范围升级、过时的本地 device-token 缓存漂移，以及 paired-record 凭证漂移）。

  </Accordion>
  <Accordion title="工作区和 shell">
    - Linux 上的 systemd linger 检查。
    - Workspace bootstrap 文件大小检查（针对上下文文件的截断/接近上限警告）。
    - 默认 agent 的 Skills 就绪状态检查；报告缺少 bin、环境变量、配置或操作系统要求的已允许 Skills，并且 `--fix` 可以在 `skills.entries` 中禁用不可用的 Skills。
    - shell completion 状态检查和自动安装/升级。
    - 记忆搜索 embedding 提供商就绪状态检查（本地模型、远程 API key 或 QMD 二进制）。
    - 源码安装检查（pnpm workspace 不匹配、缺少 UI 资产、缺少 tsx 二进制）。
    - 写入更新后的配置 + 向导元数据。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填和重置

Control UI Dreams 场景包含用于 grounded dreaming 工作流的 **Backfill**、**Reset** 和 **Clear Grounded** 操作。这些操作使用 Gateway 网关 doctor 风格的 RPC 方法，但它们**不**属于 `openclaw doctor` CLI 修复/迁移的一部分。

它们做什么：

- **Backfill** 扫描当前工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行 grounded REM diary pass，并将可逆的回填条目写入 `DREAMS.md`。
- **Reset** 只会从 `DREAMS.md` 中移除那些带标记的回填 diary 条目。
- **Clear Grounded** 只会移除来自历史 replay、且尚未积累 live recall 或 daily support 的已暂存 grounded-only 短期条目。

它们本身**不会**做什么：

- 它们不会编辑 `MEMORY.md`
- 它们不会运行完整的 doctor 迁移
- 它们不会自动将 grounded candidates 暂存到 live short-term promotion store，除非你先显式运行 staged CLI path

如果你想让 grounded historical replay 影响正常的 deep promotion lane，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这会将 grounded durable candidates 暂存到 short-term dreaming store，同时保持 `DREAMS.md` 作为审查界面。

## 详细行为和理由

<AccordionGroup>
  <Accordion title="0. 可选更新（git 安装）">
    如果这是 git checkout 且 doctor 以交互方式运行，它会在运行 doctor 前提供更新（fetch/rebase/build）选项。
  </Accordion>
  <Accordion title="1. 配置规范化">
    如果配置包含旧版值形状（例如没有渠道特定覆盖的 `messages.ackReaction`），doctor 会将其规范化为当前 schema。

    这包括旧版 Talk 扁平字段。当前公开的 Talk 语音配置是 `talk.provider` + `talk.providers.<provider>`，realtime voice 配置是 `talk.realtime.*`。Doctor 会将旧的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形状重写到提供商映射中，并将旧版顶层 realtime 选择器（`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`）重写到 `talk.realtime`。

    当 `plugins.allow` 非空且工具策略使用通配符或插件拥有的工具条目时，Doctor 也会发出警告。`tools.allow: ["*"]` 只匹配实际加载的插件中的工具；它不会绕过排他的插件 allowlist。Doctor 会为迁移后的旧版 allowlist 配置写入 `plugins.bundledDiscovery: "compat"`，以保留现有的内置提供商行为，然后指向更严格的 `"allowlist"` 设置。

  </Accordion>
  <Accordion title="2. 旧版配置键迁移">
    当配置包含已弃用键时，其他命令会拒绝运行，并要求你运行 `openclaw doctor`。

    Doctor 会：

    - 说明找到了哪些旧版键。
    - 显示它应用的迁移。
    - 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

    Gateway 网关启动会拒绝旧版配置格式，并要求你运行 `openclaw doctor --fix`；它不会在启动时重写 `openclaw.json`。Cron 任务存储迁移也由 `openclaw doctor --fix` 处理。

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
    - 对于带有命名 `accounts` 但仍残留单账号顶层渠道值的渠道，将这些账号作用域值移动到该渠道所选的提升账号中（多数渠道使用 `accounts.default`；Matrix 可以保留现有匹配的命名/默认目标）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（工具/提升权限/exec/沙箱/子智能体）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；对慢速提供商/模型超时使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（旧版扩展中继设置）
    - 旧版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 网关启动时也会跳过 `api` 设置为未来或未知枚举值的提供商，而不是保守失败）
    - 移除 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex 应用服务器始终保持 Codex 原生工作区工具为原生模式

    Doctor 警告还包含多账号渠道的账号默认值指导：

    - 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但没有配置 `channels.<channel>.defaultAccount` 或 `accounts.default`，Doctor 会警告回退路由可能选择意外账号。
    - 如果 `channels.<channel>.defaultAccount` 设置为未知账号 ID，Doctor 会警告并列出已配置的账号 ID。

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖来自 `@earendil-works/pi-ai` 的内置 OpenCode 目录。这可能会迫使模型使用错误 API，或将成本清零。Doctor 会发出警告，以便你移除该覆盖并恢复按模型的 API 路由和成本。
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，Doctor 会将其规范化为当前主机本地 Chrome MCP 挂接模型：

    - `browser.profiles.*.driver: "extension"` 变为 `"existing-session"`
    - `browser.relayBindHost` 会被移除

    当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` 配置文件时，Doctor 还会审计主机本地 Chrome MCP 路径：

    - 检查默认自动连接配置文件所用的同一主机上是否安装了 Google Chrome
    - 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
    - 提醒你在浏览器检查页面中启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 无法替你启用 Chrome 端设置。主机本地 Chrome MCP 仍然需要：

    - Gateway 网关/节点主机上有基于 Chromium 的浏览器 144+
    - 浏览器在本地运行
    - 在该浏览器中启用远程调试
    - 在浏览器中批准首次挂接同意提示

    这里的就绪状态只涉及本地挂接前置条件。Existing-session 保持当前 Chrome MCP 路由限制；`responsebody`、PDF 导出、下载拦截和批量操作等高级路由仍然需要托管浏览器或原始 CDP 配置文件。

    此检查**不**适用于 Docker、沙箱、remote-browser 或其他无头流程。它们会继续使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    配置 OpenAI Codex OAuth 配置文件后，Doctor 会探测 OpenAI 授权端点，验证本地 Node/OpenSSL TLS 栈能否校验证书链。如果探测因证书错误失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），Doctor 会打印平台特定的修复指导。在使用 Homebrew Node 的 macOS 上，修复通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关健康，也会运行该探测。
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    如果你之前在 `models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，它们可能会遮蔽新版会自动使用的内置 Codex OAuth 提供商路径。Doctor 在看到这些旧传输设置与 Codex OAuth 同时存在时会发出警告，以便你移除或重写过期的传输覆盖，并恢复内置路由/回退行为。自定义代理和仅标头覆盖仍受支持，且不会触发此警告。
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor 会检查旧版 `openai-codex/*` 模型引用。Native Codex plugins 路由使用规范的 `openai/*` 模型引用；OpenAI agent 轮次会通过 Codex 应用服务器 harness，而不是 OpenClaw PI OpenAI 路径。

    在 `--fix` / `--repair` 模式下，Doctor 会重写受影响的默认 agent 和按 agent 配置的引用，包括主模型、回退模型、Heartbeat/子智能体/压缩覆盖、钩子、渠道模型覆盖，以及过期的已持久化会话路由状态：

    - `openai-codex/gpt-*` 变为 `openai/gpt-*`。
    - Codex 意图会迁移到按提供商/模型作用域的 `agentRuntime.id: "codex"` 条目，用于已修复的 agent 模型引用，这样模型引用变为 `openai/*` 后仍可选择 `openai-codex:...` 认证配置文件。
    - 过期的整 agent 运行时配置和已持久化会话运行时固定项会被移除，因为运行时选择按提供商/模型作用域生效。
    - 除非修复后的旧版模型引用需要 Codex 路由来保留旧认证路径，否则现有提供商/模型运行时策略会保留。
    - 现有模型回退列表会保留，并重写其中的旧版条目；复制的按模型设置会从旧版键移动到规范 `openai/*` 键。
    - 会在所有发现的 agent 会话存储中修复已持久化会话的 `modelProvider`/`providerOverride`、`model`/`modelOverride`、回退通知和认证配置文件固定项。
    - `/codex ...` 表示“从聊天中控制或绑定原生 Codex 对话”。
    - `/acp ...` 或 `runtime: "acp"` 表示“使用外部 ACP/acpx 适配器”。

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    在你将已配置模型或运行时从 Codex 等插件拥有的路由移走后，Doctor 还会扫描发现的 agent 会话存储，查找过期的自动创建路由状态。

    `openclaw doctor --fix` 可以清理自动创建的过期状态，例如 `modelOverrideSource: "auto"` 模型固定项、运行时模型元数据、固定的 harness ID、CLI 会话绑定，以及当其所属路由不再配置时的自动认证配置文件覆盖。显式用户或旧版会话模型选择会报告给你手动审查并保持不变；当不再需要该路由时，使用 `/model ...`、`/new` 切换它们，或重置会话。

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor 可以将较旧的磁盘布局迁移到当前结构：

    - 会话存储 + 转录记录：
      - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent 目录：
      - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 认证状态（Baileys）：
      - 从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账号 ID：`default`）

    这些迁移会尽力执行且可幂等重复；当 Doctor 将任何旧版文件夹作为备份留下时，会发出警告。Gateway 网关/CLI 也会在启动时自动迁移旧版会话 + agent 目录，使历史记录/认证/模型落入按 agent 路径中，而无需手动运行 Doctor。WhatsApp 认证有意仅通过 `openclaw doctor` 迁移。Talk 提供商/提供商映射规范化现在按结构相等性比较，因此仅键顺序不同的差异不再触发重复的空操作 `doctor --fix` 更改。

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor 会扫描所有已安装插件清单，查找已弃用的顶层能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到后，它会提供将其移动到 `contracts` 对象并就地重写清单文件的操作。此迁移是幂等的；如果 `contracts` 键已有相同值，则会移除旧版键而不复制数据。
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor 还会检查 cron 作业存储（默认是 `~/.openclaw/cron/jobs.json`，或覆盖时使用 `cron.store`），查找调度器仍为兼容性接受的旧作业形态。

    当前 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 顶层有效载荷字段（`message`、`model`、`thinking`，...）→ `payload`
    - 顶层交付字段（`deliver`、`channel`、`to`、`provider`，...）→ `delivery`
    - 有效载荷 `provider` 交付别名 → 显式 `delivery.channel`
    - 简单旧版 `notify: true` 网络钩子回退任务 → 显式 `delivery.mode="webhook"`，并设置 `delivery.to=cron.webhook`

    Doctor 只会在不改变行为的情况下自动迁移 `notify: true` 任务。如果某个任务把旧版通知回退与现有的非网络钩子交付模式组合使用，Doctor 会发出警告，并将该任务留待手动审查。

    在 Linux 上，当用户的 crontab 仍调用旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，Doctor 也会发出警告。当前 OpenClaw 不维护这个主机本地脚本；当 cron 无法访问 systemd 用户总线时，它可能会向 `~/.openclaw/logs/whatsapp-health.log` 写入错误的 `Gateway inactive` 消息。使用 `crontab -e` 移除过时的 crontab 条目；使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status` 执行当前健康检查。

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor 会扫描每个智能体会话目录，查找过时的写入锁文件，也就是会话异常退出后留下的文件。对于找到的每个锁文件，它会报告：路径、PID、PID 是否仍然存活、锁的存在时长，以及是否被视为过时（PID 已死亡、超过 30 分钟，或可证明存活的 PID 属于非 OpenClaw 进程）。在 `--fix` / `--repair` 模式下，它会自动移除过时的锁文件；否则会打印提示，并指示你使用 `--fix` 重新运行。
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor 会扫描智能体会话 JSONL 文件，查找由 2026.4.24 提示词转录重写缺陷创建的重复分支形态：一个带有 OpenClaw 内部运行时上下文的废弃用户轮次，以及一个包含相同可见用户提示词的活动同级分支。在 `--fix` / `--repair` 模式下，Doctor 会在原文件旁备份每个受影响的文件，并将转录重写为活动分支，使 Gateway 网关历史记录和记忆读取器不再看到重复轮次。
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    状态目录是运行层面的脑干。如果它消失，你会丢失会话、凭证、日志和配置（除非你在其他位置有备份）。

    Doctor 会检查：

    - **状态目录缺失**：警告灾难性状态丢失，提示重新创建目录，并提醒你它无法恢复缺失的数据。
    - **状态目录权限**：验证可写性；提供修复权限的选项（并在检测到所有者/组不匹配时发出 `chown` 提示）。
    - **macOS 云同步状态目录**：当状态解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下时发出警告，因为由同步支持的路径可能导致 I/O 变慢以及锁/同步竞态。
    - **Linux SD 或 eMMC 状态目录**：当状态解析到 `mmcblk*` 挂载源时发出警告，因为 SD 或 eMMC 支持的随机 I/O 在会话和凭证写入下可能更慢且磨损更快。
    - **会话目录缺失**：`sessions/` 和会话存储目录是持久化历史记录并避免 `ENOENT` 崩溃所必需的。
    - **转录不匹配**：当最近的会话条目缺少转录文件时发出警告。
    - **主会话“1 行 JSONL”**：当主转录只有一行时标记（历史记录没有累积）。
    - **多个状态目录**：当多个 home 目录中存在多个 `~/.openclaw` 文件夹，或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史记录可能在安装之间分裂）。
    - **远程模式提醒**：如果 `gateway.mode=remote`，Doctor 会提醒你在远程主机上运行它（状态位于那里）。
    - **配置文件权限**：如果 `~/.openclaw/openclaw.json` 可被组/全局读取，则发出警告，并提供收紧到 `600` 的选项。

  </Accordion>
  <Accordion title="5. Model auth health (OAuth expiry)">
    Doctor 会检查凭证存储中的 OAuth 配置文件，在令牌即将过期/已过期时发出警告，并在安全时刷新它们。如果 Anthropic OAuth/令牌配置文件过时，它会建议使用 Anthropic API key 或 Anthropic 设置令牌路径。刷新提示只会在交互式运行（TTY）时出现；`--non-interactive` 会跳过刷新尝试。

    当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、`invalid_grant`，或提供商要求你重新登录），Doctor 会报告需要重新认证，并打印要运行的准确 `openclaw models auth login --provider ...` 命令。

    Doctor 还会报告由于以下原因而暂时不可用的凭证配置文件：

    - 短暂冷却（速率限制/超时/认证失败）
    - 更长时间停用（计费/额度失败）

  </Accordion>
  <Accordion title="6. Hooks model validation">
    如果设置了 `hooks.gmail.model`，Doctor 会根据目录和允许列表验证模型引用，并在无法解析或不被允许时发出警告。
  </Accordion>
  <Accordion title="7. Sandbox image repair">
    启用沙箱隔离时，Doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建或切换到旧版名称的选项。
  </Accordion>
  <Accordion title="7b. Plugin install cleanup">
    Doctor 会在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下移除旧版 OpenClaw 生成的插件依赖暂存状态。这包括过时的生成依赖根、旧安装阶段目录、早期内置插件依赖修复代码留下的包本地残留，以及可能遮蔽当前内置清单的孤立或已恢复的内置 `@openclaw/*` 插件托管 npm 副本。Doctor 还会把主机 `openclaw` 包重新链接到声明了 `peerDependencies.openclaw` 的托管 npm 插件中，使 `openclaw/plugin-sdk/*` 等包本地运行时导入在更新或 npm 修复后继续解析。

    当配置引用了可下载插件但本地插件注册表找不到它们时，Doctor 也可以重新安装缺失的可下载插件。示例包括实质性的 `plugins.entries`、已配置的渠道/提供商/搜索设置，以及已配置的 Agent Runtimes。在包更新期间，Doctor 会避免在核心包正在替换时运行包管理器插件修复；如果配置的插件仍需要恢复，请在更新后再次运行 `openclaw doctor --fix`。Gateway 网关启动和配置重新加载不会运行包管理器；插件安装仍然是显式的 Doctor/安装/更新工作。

  </Accordion>
  <Accordion title="8. Gateway service migrations and cleanup hints">
    Doctor 会检测旧版 Gateway 网关服务（launchd/systemd/schtasks），并提供移除它们并使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它也可以扫描额外的类似 Gateway 网关的服务，并打印清理提示。带配置文件名称的 OpenClaw Gateway 网关服务被视为一等服务，不会被标记为“额外”。

    在 Linux 上，如果用户级 Gateway 网关服务缺失，但存在系统级 OpenClaw Gateway 网关服务，Doctor 不会自动安装第二个用户级服务。使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 检查，然后移除重复项，或在系统级监督器拥有 Gateway 网关生命周期时设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. Startup Matrix migration">
    当 Matrix 渠道账号存在待处理或可执行的旧版状态迁移时，Doctor（在 `--fix` / `--repair` 模式下）会创建迁移前快照，然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。这两个步骤都是非致命的；错误会被记录，启动会继续。在只读模式（不带 `--fix` 的 `openclaw doctor`）下，此检查会被完全跳过。
  </Accordion>
  <Accordion title="8c. Device pairing and auth drift">
    Doctor 现在会在常规健康检查中检查设备配对状态。

    它会报告：

    - 待处理的首次配对请求
    - 已配对设备的待处理角色升级
    - 已配对设备的待处理作用域升级
    - 公钥不匹配修复，其中设备 ID 仍然匹配，但设备身份不再匹配已批准记录
    - 缺少已批准角色活动令牌的配对记录
    - 作用域偏离已批准配对基线的配对令牌
    - 当前机器的本地缓存设备令牌条目，其早于 Gateway 网关侧令牌轮换或携带过时的作用域元数据

    Doctor 不会自动批准配对请求，也不会自动轮换设备令牌。它会改为打印准确的后续步骤：

    - 使用 `openclaw devices list` 检查待处理请求
    - 使用 `openclaw devices approve <requestId>` 批准准确请求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新令牌
    - 使用 `openclaw devices remove <deviceId>` 移除并重新批准过时记录

    这弥补了常见的“已经配对但仍提示需要配对”缺口：Doctor 现在会区分首次配对、待处理的角色/作用域升级，以及过时令牌/设备身份漂移。

  </Accordion>
  <Accordion title="9. Security warnings">
    当提供商在没有允许列表的情况下向私信开放，或某项策略以危险方式配置时，Doctor 会发出警告。
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    如果作为 systemd 用户服务运行，Doctor 会确保已启用 linger，使 Gateway 网关在登出后仍保持运行。
  </Accordion>
  <Accordion title="11. Workspace status (skills, plugins, and legacy dirs)">
    Doctor 会为默认智能体打印工作区状态摘要：

    - **Skills 状态**：统计符合条件、缺少要求以及被允许列表阻止的 Skills。
    - **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录与当前工作区并存时发出警告。
    - **插件状态**：统计已启用/已禁用/出错的插件；列出任何错误的插件 ID；报告内置插件能力。
    - **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
    - **插件诊断**：展示插件注册表在加载时发出的任何警告或错误。

  </Accordion>
  <Accordion title="11b. Bootstrap file size">
    Doctor 会检查工作区引导文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过已配置的字符预算。它会按文件报告原始字符数与注入后字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及总注入字符数占总预算的比例。当文件被截断或接近限制时，Doctor 会打印用于调优 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. Stale channel plugin cleanup">
    当 `openclaw doctor --fix` 移除缺失的渠道插件时，它也会移除引用该插件的悬空渠道范围配置：`channels.<id>` 条目、命名该渠道的 Heartbeat 目标，以及 `agents.*.models["<channel>/*"]` 覆盖项。这可以防止渠道运行时已不存在但配置仍要求 Gateway 网关绑定到它而导致的 Gateway 网关启动循环。
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor 会检查当前 shell（zsh、bash、fish 或 PowerShell）是否已安装 Tab 补全：

    - 如果 shell 配置文件使用较慢的动态补全模式（`source <(openclaw completion ...)`），Doctor 会将其升级为更快的缓存文件变体。
    - 如果补全已在配置文件中配置但缓存文件缺失，Doctor 会自动重新生成缓存。
    - 如果完全没有配置补全，Doctor 会提示安装它（仅交互模式；使用 `--non-interactive` 时跳过）。

    运行 `openclaw completion --write-state` 可手动重新生成缓存。

  </Accordion>
  <Accordion title="12. Gateway 网关认证检查（本地令牌）">
    Doctor 检查本地 Gateway 网关令牌认证就绪状态。

    - 如果令牌模式需要令牌且不存在令牌来源，Doctor 会提示生成一个。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，Doctor 会发出警告，且不会用明文覆盖它。
    - `openclaw doctor --generate-gateway-token` 仅在未配置令牌 SecretRef 时强制生成。

  </Accordion>
  <Accordion title="12b. 感知只读 SecretRef 的修复">
    某些修复流程需要检查已配置的凭据，同时不削弱运行时快速失败行为。

    - `openclaw doctor --fix` 现在使用与状态类命令相同的只读 SecretRef 摘要模型，用于有针对性的配置修复。
    - 示例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修复会在可用时尝试使用已配置的 bot 凭据。
    - 如果 Telegram bot 令牌通过 SecretRef 配置，但在当前命令路径中不可用，Doctor 会报告该凭据已配置但不可用，并跳过自动解析，而不是崩溃或误报令牌缺失。

  </Accordion>
  <Accordion title="13. Gateway 网关健康检查 + 重启">
    Doctor 运行健康检查，并在 Gateway 网关看起来不健康时提示重启。
  </Accordion>
  <Accordion title="13b. 记忆搜索就绪状态">
    Doctor 检查已配置的记忆搜索嵌入提供商是否已为默认智能体就绪。行为取决于已配置的后端和提供商：

    - **QMD 后端**：探测 `qmd` 二进制文件是否可用且可启动。如果不可用，会打印修复指南，包括 npm 包和手动二进制路径选项。
    - **显式本地提供商**：检查本地模型文件或可识别的远程/可下载模型 URL。如果缺失，建议切换到远程提供商。
    - **显式远程提供商**（`openai`、`voyage` 等）：验证环境或认证存储中是否存在 API key。如果缺失，打印可执行的修复提示。
    - **自动提供商**：先检查本地模型可用性，然后按自动选择顺序尝试每个远程提供商。

    当存在缓存的 Gateway 网关探测结果（检查时 Gateway 网关健康）时，Doctor 会将其结果与 CLI 可见配置交叉比对，并标注任何差异。Doctor 不会在默认路径上启动新的嵌入 ping；如果你想进行实时提供商检查，请使用深度记忆状态命令。

    使用 `openclaw memory status --deep` 可在运行时验证嵌入就绪状态。

  </Accordion>
  <Accordion title="14. 渠道状态警告">
    如果 Gateway 网关健康，Doctor 会运行渠道状态探测，并报告警告和建议修复。
  </Accordion>
  <Accordion title="15. Supervisor 配置审计 + 修复">
    Doctor 检查已安装的 supervisor 配置（launchd/systemd/schtasks）是否缺少默认值或默认值过时（例如 systemd network-online 依赖和重启延迟）。发现不匹配时，它会建议更新，并可将 service 文件/任务重写为当前默认值。

    注意：

    - `openclaw doctor` 会在重写 supervisor 配置前提示。
    - `openclaw doctor --yes` 接受默认修复提示。
    - `openclaw doctor --repair` 无提示应用建议修复。
    - `openclaw doctor --repair --force` 覆盖自定义 supervisor 配置。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 让 Doctor 对 Gateway 网关 service 生命周期保持只读。它仍会报告 service 健康状态并运行非 service 修复，但会跳过 service 安装/启动/重启/bootstrap、supervisor 配置重写以及旧版 service 清理，因为该生命周期由外部 supervisor 拥有。
    - 在 Linux 上，当匹配的 systemd Gateway 网关 unit 处于活动状态时，Doctor 不会重写命令/入口点元数据。它还会在重复 service 扫描期间忽略非活动的非旧版额外 Gateway 网关类 unit，因此配套 service 文件不会产生清理噪音。
    - 如果令牌认证需要令牌且 `gateway.auth.token` 由 SecretRef 管理，Doctor service 安装/修复会验证 SecretRef，但不会将解析出的明文令牌值持久化到 supervisor service 环境元数据中。
    - Doctor 会检测旧版 LaunchAgent、systemd 或 Windows Scheduled Task 安装中以内联方式嵌入的托管 `.env`/SecretRef 后端 service 环境值，并重写 service 元数据，使这些值从运行时来源加载，而不是从 supervisor 定义加载。
    - Doctor 会检测 service 命令是否在 `gateway.port` 变更后仍固定旧的 `--port`，并将 service 元数据重写为当前端口。
    - 如果令牌认证需要令牌且已配置的令牌 SecretRef 未解析，Doctor 会阻止安装/修复路径，并提供可执行指南。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，Doctor 会阻止安装/修复，直到显式设置模式。
    - 对于 Linux user-systemd unit，Doctor 令牌漂移检查现在在比较 service 认证元数据时同时包含 `Environment=` 和 `EnvironmentFile=` 来源。
    - 当配置最后由较新版本写入时，Doctor service 修复会拒绝使用较旧的 OpenClaw 二进制文件重写、停止或重启 Gateway 网关 service。参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你始终可以通过 `openclaw gateway install --force` 强制完整重写。

  </Accordion>
  <Accordion title="16. Gateway 网关运行时 + 端口诊断">
    Doctor 检查 service 运行时（PID、上次退出状态），并在 service 已安装但未实际运行时发出警告。它还会检查 Gateway 网关端口（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已在运行、SSH 隧道）。
  </Accordion>
  <Accordion title="17. Gateway 网关运行时最佳实践">
    当 Gateway 网关 service 在 Bun 或版本管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上运行时，Doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，而版本管理器路径在升级后可能失效，因为 service 不会加载你的 shell init。Doctor 会在系统 Node 安装可用时提示迁移（Homebrew/apt/choco）。

    新安装或修复的 macOS LaunchAgent 使用规范的系统 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是复制交互式 shell PATH，因此 Homebrew 管理的系统二进制文件仍然可用，同时 Volta、asdf、fnm、pnpm 和其他版本管理器目录不会改变 Node 子进程的解析结果。Linux service 仍会保留显式环境根（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和稳定的用户 bin 目录，但猜测的版本管理器回退目录只有在磁盘上存在时才会写入 service PATH。

  </Accordion>
  <Accordion title="18. 配置写入 + 向导元数据">
    Doctor 会持久化任何配置更改，并标记向导元数据以记录本次 Doctor 运行。
  </Accordion>
  <Accordion title="19. 工作区提示（备份 + 记忆系统）">
    当缺少工作区记忆系统时，Doctor 会建议添加；如果工作区尚未置于 git 下，则打印备份提示。

    有关工作区结构和 git 备份（推荐私有 GitHub 或 GitLab）的完整指南，请参见 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)。

  </Accordion>
</AccordionGroup>

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
