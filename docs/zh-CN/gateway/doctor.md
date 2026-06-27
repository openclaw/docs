---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置变更
sidebarTitle: Doctor
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-06-27T02:00:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它会修复过时的配置/状态、检查健康状况，并提供可执行的修复步骤。

## 快速开始

```bash
openclaw doctor
```

### 无头模式和自动化模式

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    不提示而接受默认值（适用时包括重启/服务/沙箱修复步骤）。

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    不提示而应用推荐修复（在安全情况下执行修复 + 重启）。

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    为 CI 或预检自动化运行结构化健康检查。此模式为
    只读：它不会提示、修复、迁移配置、重启服务，或
    触碰状态。

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    同时应用激进修复（会覆盖自定义 supervisor 配置）。

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

    扫描系统服务以查找额外的 Gateway 网关安装（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果你想在写入前查看更改，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 只读 lint 模式

`openclaw doctor --lint` 是适合自动化的
`openclaw doctor --fix` 同级命令。两者都使用 Doctor 健康检查，但它们的姿态
不同：

| 模式                     | 提示   | 写入配置/状态     | 输出                 | 用途                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | 是       | 否                      | 友好的健康报告 | 人工检查状态         |
| `openclaw doctor --fix`  | 有时 | 是，遵循修复策略 | 友好的修复日志    | 应用已批准的修复       |
| `openclaw doctor --lint` | 否        | 否                      | 结构化发现    | CI、预检和审查门禁 |

现代化后的健康检查可以提供可选的 `repair()` 实现。
`doctor --fix` 会在这些修复存在时应用它们，并继续对尚未迁移的检查使用
现有 Doctor 修复流程。
结构化修复合约也会将修复报告与检测分离：
`detect()` 报告当前发现，而 `repair()` 可以报告更改、
配置/文件 diff，以及非文件副作用。这会让迁移路径保持开放，
以便未来支持 `doctor --fix --dry-run` 和 diff 输出，同时不让 lint 检查
规划变更。

示例：

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 输出包括：

- `ok`：是否有任何可见发现达到所选严重性阈值
- `checksRun`：已执行的健康检查数量
- `checksSkipped`：被所选配置文件、`--only` 或 `--skip` 跳过的检查
- `findings`：结构化诊断，包含 `checkId`、`severity`、`message`，以及
  可选的 `path`、`line`、`column`、`ocPath` 和 `fixHint`

退出代码：

- `0`：没有达到或高于所选阈值的发现
- `1`：一个或多个发现达到所选阈值
- `2`：在可发出 lint 发现之前发生命令/运行时失败

使用 `--severity-min info|warning|error` 同时控制打印内容以及哪些内容
会导致非零 lint 退出。使用 `--all` 运行完整 lint 清单，
包括从默认自动化集合中排除的更深层可选检查。使用 `--only <id>` 进行窄范围预检门禁，并
使用 `--skip <id>` 在保持其余
lint 运行活动的同时，临时排除嘈杂检查。
`--json`、`--severity-min`、`--all`、`--only` 和
`--skip` 等 lint 输出选项必须与 `--lint` 搭配使用；常规 Doctor 和修复运行会拒绝
它们。

## 它做什么（摘要）

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - 对 git 安装执行可选的预检更新（仅交互式）。
    - UI 协议新鲜度检查（当协议 schema 更新时重建 Control UI）。
    - 健康检查 + 重启提示。
    - Skills 状态摘要（符合条件/缺失/被阻止）和插件状态。

  </Accordion>
  <Accordion title="Config and migrations">
    - 对旧版值进行配置规范化。
    - 将旧版扁平 `talk.*` 字段中的 Talk 配置迁移到 `talk.provider` + `talk.providers.<provider>`。
    - 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪状态的浏览器迁移检查。
    - OpenCode 提供商覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - 旧版 OpenAI Codex 提供商/配置文件迁移（`openai-codex` → `openai`），以及针对过时 `models.providers.openai-codex` 的遮蔽警告。
    - OpenAI Codex OAuth 配置文件的 OAuth TLS 前置条件检查。
    - 当 `plugins.allow` 受限但工具策略仍请求通配符或插件拥有的工具时，发出插件/工具允许列表警告。
    - 旧版磁盘状态迁移（会话/Agent 目录/WhatsApp 凭证）。
    - 旧版插件清单合约键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层 delivery/payload 字段、payload `provider`、`notify: true` webhook fallback 作业）。
    - 旧版全 Agent runtime-policy 清理；提供商/模型运行时策略是当前活动的路由选择器。
    - 插件启用时清理过时插件配置；当 `plugins.enabled=false` 时，过时插件引用会被视为惰性封存配置并保留。

  </Accordion>
  <Accordion title="State and integrity">
    - 会话锁文件检查和过时锁清理。
    - 修复受影响的 2026.4.24 构建创建的重复 prompt-rewrite 分支会话 transcript。
    - 卡住的子智能体重启恢复 tombstone 检测，支持通过 `--fix` 清除过时的已中止恢复标志，避免启动持续将子进程视为重启已中止。
    - 状态完整性和权限检查（会话、transcript、状态目录）。
    - 本地运行时的配置文件权限检查（chmod 600）。
    - 模型凭证健康：检查 OAuth 过期，可刷新即将过期的令牌，并报告 auth-profile cooldown/disabled 状态。

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - 启用沙箱隔离时修复沙箱镜像。
    - 旧版服务迁移和额外 Gateway 网关检测。
    - Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式中）。
    - Gateway 网关运行时检查（服务已安装但未运行；缓存的 launchd label）。
    - 频道状态警告（从正在运行的 Gateway 网关探测）。
    - 渠道特定权限检查位于 `openclaw channels capabilities` 下；例如，Discord 语音频道权限通过 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 审计。
    - 当本地 TUI 客户端仍在运行时，针对降级的 Gateway 网关 event-loop 健康进行 WhatsApp 响应性检查；`--fix` 只会停止已验证的本地 TUI 客户端。
    - 修复主要模型、fallback、图像/视频生成模型、heartbeat/子智能体/compaction 覆盖、钩子、频道模型覆盖和会话路由 pin 中旧版 `openai-codex/*` 模型引用的 Codex 路由；`--fix` 会将它们重写为 `openai/*`，将 `openai-codex:*` 凭证配置文件/顺序迁移到 `openai:*`，移除过时的会话/全 Agent 运行时 pin，并保留默认 Codex harness 上的规范 OpenAI Agent 引用。
    - Supervisor 配置审计（launchd/systemd/schtasks），可选修复。
    - 清理 Gateway 网关服务中嵌入的代理环境，这些环境是在安装或更新期间捕获的 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值。
    - Gateway 网关运行时最佳实践检查（Node vs Bun、版本管理器路径）。
    - Gateway 网关端口冲突诊断（默认 `18789`）。

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - 针对开放私信策略的安全警告。
    - local token 模式的 Gateway 网关凭证检查（当不存在令牌来源时提供令牌生成；不会覆盖 token SecretRef 配置）。
    - 设备配对问题检测（待处理的首次配对请求、待处理的角色/作用域升级、过时的本地 device-token 缓存漂移，以及 paired-record 凭证漂移）。

  </Accordion>
  <Accordion title="Workspace and shell">
    - Linux 上的 systemd linger 检查。
    - 工作区 bootstrap 文件大小检查（针对上下文文件的截断/接近限制警告）。
    - 默认 Agent 的 Skills 就绪检查；报告允许的 Skills 中缺失 bin、env、配置或 OS 要求的项，并且 `--fix` 可以在 `skills.entries` 中禁用不可用 Skills。
    - Shell 补全状态检查和自动安装/升级。
    - 记忆搜索 embedding 提供商就绪检查（本地模型、远程 API key 或 QMD 二进制）。
    - 源码安装检查（pnpm 工作区不匹配、缺少 UI 资产、缺少 tsx 二进制）。
    - 写入更新后的配置 + 向导元数据。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填和重置

Control UI Dreams 场景包含用于 grounded dreaming 工作流的 **Backfill**、**Reset** 和 **Clear Grounded** 操作。这些操作使用 Gateway 网关 Doctor 风格的 RPC 方法，但它们**不是** `openclaw doctor` CLI 修复/迁移的一部分。

它们会做什么：

- **Backfill** 会扫描活动工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行 grounded REM 日记 pass，并将可逆回填条目写入 `DREAMS.md`。
- **Reset** 只会从 `DREAMS.md` 中移除这些带标记的回填日记条目。
- **Clear Grounded** 只会移除来自历史 replay、且尚未累积实时 recall 或 daily support 的暂存 grounded-only 短期条目。

它们本身**不会**做什么：

- 它们不会编辑 `MEMORY.md`
- 它们不会运行完整 Doctor 迁移
- 除非你先显式运行 staged CLI 路径，否则它们不会自动将 grounded candidates 暂存到实时短期 promotion store 中

如果你希望 grounded 历史 replay 影响正常的 deep promotion 通道，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这会将 grounded durable candidates 暂存到短期 dreaming store 中，同时保留 `DREAMS.md` 作为审查界面。

## 详细行为和原理

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    如果这是一个 git checkout 且 Doctor 正在交互式运行，它会在运行 Doctor 之前提供更新（fetch/rebase/build）选项。
  </Accordion>
  <Accordion title="1. Config normalization">
    如果配置包含旧版值形状（例如没有渠道特定覆盖的 `messages.ackReaction`），Doctor 会将它们规范化为当前 schema。

    这包括旧版 Talk 扁平字段。当前公开的 Talk 语音配置是 `talk.provider` + `talk.providers.<provider>`，实时语音配置是 `talk.realtime.*`。Doctor 会将旧的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形状重写到提供商映射中，并将旧版顶层实时选择器（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）重写到 `talk.realtime`。

    当 `plugins.allow` 非空且工具策略使用通配符或插件所有的工具条目时，Doctor 也会发出警告。`tools.allow: ["*"]` 只匹配实际加载的插件中的工具；它不会绕过专属插件允许列表。

  </Accordion>
  <Accordion title="2. 旧版配置键迁移">
    当配置包含已弃用的键时，其他命令会拒绝运行，并要求你运行 `openclaw doctor`。

    Doctor 将：

    - 说明发现了哪些旧版键。
    - 显示它应用的迁移。
    - 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

    Gateway 网关启动会拒绝旧版配置格式，并要求你运行 `openclaw doctor --fix`；它不会在启动时重写 `openclaw.json`。Cron 作业存储迁移也由 `openclaw doctor --fix` 处理。

    当前迁移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 移除已退役的 `channels.webchat` 和 `gateway.webchat`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → 顶层 `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 旧版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - 旧版顶层实时 Talk 选择器（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` 和 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 和 `messages.tts.providers.microsoft`
    - TTS 说话人选择字段（`voice`/`voiceName`/`voiceId`）→ `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` 和 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 和 `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 对于带有命名 `accounts` 但仍残留单账号顶层渠道值的渠道，将这些账号作用域的值移动到为该渠道选定的提升账号中（大多数渠道使用 `accounts.default`；Matrix 可以保留现有匹配的命名/默认目标）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；对较慢提供商/模型的超时使用 `models.providers.<id>.timeoutSeconds`，并在整个运行必须持续更久时，将智能体/运行超时保持在该值之上
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（旧版扩展中继设置）
    - 旧版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 网关启动也会跳过 `api` 被设置为未来或未知枚举值的提供商，而不是失败关闭）
    - 移除 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 始终将 Codex 原生工作区工具保持为原生

    Doctor 警告还包括多账号渠道的账号默认值指引：

    - 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但没有 `channels.<channel>.defaultAccount` 或 `accounts.default`，Doctor 会警告回退路由可能选择意外账号。
    - 如果 `channels.<channel>.defaultAccount` 被设置为未知账号 ID，Doctor 会警告并列出已配置的账号 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供商覆盖">
    如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖来自 `openclaw/plugin-sdk/llm` 的内置 OpenCode 目录。这可能迫使模型使用错误的 API，或将成本清零。Doctor 会发出警告，以便你移除该覆盖并恢复按模型的 API 路由和成本。
  </Accordion>
  <Accordion title="2c. 浏览器迁移和 Chrome MCP 就绪状态">
    如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，Doctor 会将其规范化为当前的主机本地 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 变为 `"existing-session"`
    - `browser.relayBindHost` 被移除

    当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` 配置文件时，Doctor 也会审计主机本地 Chrome MCP 路径：

    - 检查默认自动连接配置文件所用的同一主机上是否安装了 Google Chrome
    - 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
    - 提醒你在浏览器检查页面中启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 不能替你启用 Chrome 端设置。主机本地 Chrome MCP 仍需要：

    - Gateway 网关/节点主机上有基于 Chromium 的浏览器 144+
    - 浏览器在本地运行
    - 该浏览器中已启用远程调试
    - 在浏览器中批准第一次附加同意提示

    这里的就绪状态只涉及本地附加前置条件。Existing-session 会保留当前的 Chrome MCP 路由限制；`responsebody`、PDF 导出、下载拦截和批量操作等高级路由仍需要托管浏览器或原始 CDP 配置文件。

    此检查**不**适用于 Docker、沙箱、远程浏览器或其他无头流程。这些流程继续使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置条件">
    配置 OpenAI Codex OAuth 配置文件后，Doctor 会探测 OpenAI 授权端点，以验证本地 Node/OpenSSL TLS 栈能否验证证书链。如果探测因证书错误失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），Doctor 会输出特定平台的修复指引。在使用 Homebrew Node 的 macOS 上，修复通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关健康，探测也会运行。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供商覆盖">
    如果你之前在 `models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，它们可能会遮蔽较新版本自动使用的内置 Codex OAuth 提供商路径。当 Doctor 发现这些旧传输设置与 Codex OAuth 同时存在时，会发出警告，以便你移除或重写过期传输覆盖，并恢复内置路由/回退行为。自定义代理和仅标头覆盖仍受支持，并且不会触发此警告。
  </Accordion>
  <Accordion title="2f. Codex 路由修复">
    Doctor 会检查旧版 `openai-codex/*` 模型引用。Native Codex plugins 路由使用规范的 `openai/*` 模型引用；OpenAI 智能体轮次会通过 Codex app-server harness，而不是 OpenClaw OpenAI provider 路径。

    在 `--fix` / `--repair` 模式下，Doctor 会重写受影响的默认智能体和每智能体引用，包括主模型、回退、图像/视频生成模型、Heartbeat/子智能体/压缩覆盖、钩子、渠道模型覆盖，以及过期的持久化会话路由状态：

    - `openai-codex/gpt-*` 变为 `openai/gpt-*`。
    - Codex 意图移动到已修复智能体模型引用的提供商/模型作用域 `agentRuntime.id: "codex"` 条目。
    - 过期的整智能体运行时配置和持久化会话运行时固定会被移除，因为运行时选择是提供商/模型作用域的。
    - 除非修复后的旧版模型引用需要 Codex 路由来保持旧凭证路径，否则会保留现有提供商/模型运行时策略。
    - 现有模型回退列表会被保留，并重写其中的旧版条目；复制的每模型设置会从旧版键移动到规范的 `openai/*` 键。
    - 持久化会话 `modelProvider`/`providerOverride`、`model`/`modelOverride`、回退通知和凭证配置文件固定会在所有发现的智能体会话存储中修复。
    - `/codex ...` 表示“从聊天中控制或绑定原生 Codex 对话。”
    - `/acp ...` 或 `runtime: "acp"` 表示“使用外部 ACP/acpx 适配器。”

  </Accordion>
  <Accordion title="2g. 会话路由清理">
    在你将配置的模型或运行时从 Codex 等插件所有的路由移走后，Doctor 还会扫描发现的智能体会话存储，查找过期的自动创建路由状态。

    当其所属路由不再配置时，`openclaw doctor --fix` 可以清除自动创建的过期状态，例如 `modelOverrideSource: "auto"` 模型固定、运行时模型元数据、固定 harness id、CLI 会话绑定，以及自动凭证配置文件覆盖。显式用户或旧版会话模型选择会被报告以供手动审查并保持不变；当不再打算使用该路由时，可使用 `/model ...`、`/new` 切换它们，或重置会话。

  </Accordion>
  <Accordion title="3. 旧版状态迁移（磁盘布局）">
    Doctor 可以将较旧的磁盘布局迁移到当前结构：

    - 会话存储 + 转录：
      - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - 智能体目录：
      - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 凭证状态（Baileys）：
      - 从旧版 `~/.openclaw/credentials/*.json`（不包括 `oauth.json`）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账号 id：`default`）

    这些迁移会尽力执行且是幂等的；当 Doctor 将任何旧版文件夹作为备份留下时，会发出警告。Gateway 网关/CLI 也会在启动时自动迁移旧版会话和智能体目录，使历史记录/凭证/模型落到每智能体路径中，而无需手动运行 Doctor。WhatsApp 凭证有意只通过 `openclaw doctor` 迁移。Talk 提供商/提供商映射规范化现在按结构相等性比较，因此仅键顺序不同的差异不再触发重复的空操作 `doctor --fix` 更改。

  </Accordion>
  <Accordion title="3a. 旧版插件清单迁移">
    Doctor 会扫描所有已安装插件清单，查找已弃用的顶层能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到后，它会提示将这些键移入 `contracts` 对象，并就地重写清单文件。此迁移是幂等的；如果 `contracts` 键已经有相同值，则会移除旧版键，而不会重复数据。
  </Accordion>
  <Accordion title="3b. 旧版 cron 存储迁移">
    Doctor 还会检查 cron 作业存储（默认是 `~/.openclaw/cron/jobs.json`，被覆盖时为 `cron.store`），查找调度器为了兼容性仍会接受的旧作业形态。

    当前 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 顶层载荷字段（`message`、`model`、`thinking`、...）→ `payload`
    - 顶层投递字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - 载荷中的 `provider` 投递别名 → 显式的 `delivery.channel`
    - 旧版 `notify: true` webhook 回退作业 → 当设置 `cron.webhook` 时，转换为显式 webhook 投递；公告作业保留其聊天投递并获得 `delivery.completionDestination`。当未设置 `cron.webhook` 时，会移除无目标作业的惰性顶层 `notify` 标记（保留现有投递，包括公告），因为运行时投递从不读取它

    Gateway 网关还会在加载时清理格式异常的 cron 行，以便有效作业继续运行。原始格式异常行会在从 `jobs.json` 移除之前，复制到活动存储旁边的 `jobs-quarantine.json`；Doctor 会报告被隔离的行，方便你手动审查或修复。

    Gateway 网关启动会规范化运行时投影，并忽略顶层 `notify` 标记，但会保留持久化 cron 配置供 Doctor 修复。当未设置 `cron.webhook` 时，Doctor 会移除没有迁移目标的作业的惰性标记（`delivery.mode` 为 none/缺失、不可用的 webhook 目标，或现有公告/聊天投递），并保持现有投递不变，因此重复运行 `doctor --fix` 不会再对同一作业重复警告。如果已设置 `cron.webhook` 但不是有效的 HTTP(S) URL，Doctor 仍会警告并保留该标记，以便你修复 URL。

    在 Linux 上，如果用户的 crontab 仍调用旧版 `~/.openclaw/bin/ensure-whatsapp.sh`，Doctor 也会发出警告。当前 OpenClaw 不维护这个主机本地脚本，并且当 cron 无法访问 systemd 用户总线时，它可能向 `~/.openclaw/logs/whatsapp-health.log` 写入错误的 `Gateway inactive` 消息。使用 `crontab -e` 移除过期的 crontab 条目；使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status` 进行当前健康检查。

  </Accordion>
  <Accordion title="3c. 会话锁清理">
    Doctor 会扫描每个智能体会话目录，查找陈旧的写锁文件，即会话异常退出后遗留的文件。对于找到的每个锁文件，它会报告：路径、PID、PID 是否仍存活、锁年龄，以及是否被视为陈旧（PID 已死、所有者元数据格式异常、超过 30 分钟，或可证明属于非 OpenClaw 进程的存活 PID）。在 `--fix` / `--repair` 模式下，它会自动移除所有者为已死、孤立、被复用、旧且格式异常，或非 OpenClaw 的锁。仍由存活 OpenClaw 进程拥有的旧锁会被报告但保留原位，这样 Doctor 不会中断活动的转录写入器。
  </Accordion>
  <Accordion title="3d. 会话转录分支修复">
    Doctor 会扫描智能体会话 JSONL 文件，查找由 2026.4.24 提示词转录重写缺陷创建的重复分支形态：一个废弃的用户轮次包含 OpenClaw 内部运行时上下文，同时有一个活动的兄弟分支包含相同的可见用户提示。在 `--fix` / `--repair` 模式下，Doctor 会将每个受影响文件备份到原文件旁边，并将转录重写为活动分支，使 Gateway 网关历史和记忆读取器不再看到重复轮次。
  </Accordion>
  <Accordion title="4. 状态完整性检查（会话持久化、路由和安全）">
    状态目录是运行时的中枢。如果它消失，你会丢失会话、凭证、日志和配置（除非你在其他位置有备份）。

    Doctor 会检查：

    - **状态目录缺失**：警告灾难性状态丢失，提示重新创建目录，并提醒你它无法恢复缺失数据。
    - **状态目录权限**：验证可写性；提示修复权限（检测到所有者/组不匹配时发出 `chown` 提示）。
    - **macOS 云同步状态目录**：当状态解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下时发出警告，因为同步支撑的路径可能导致更慢的 I/O 和锁/同步竞争。
    - **Linux SD 或 eMMC 状态目录**：当状态解析到 `mmcblk*` 挂载源时发出警告，因为由 SD 或 eMMC 支撑的随机 I/O 在会话和凭证写入下可能更慢且磨损更快。
    - **Linux 易失状态目录**：当状态解析到 `tmpfs` 或 `ramfs` 时发出警告，因为会话、凭证、配置和带有 WAL/日志边车文件的 SQLite 状态会在重启时消失。Docker `overlay` 挂载有意不标记，因为只要容器仍然存在，其可写层会在主机重启后继续保留。
    - **会话目录缺失**：`sessions/` 和会话存储目录是持久化历史并避免 `ENOENT` 崩溃所必需的。
    - **转录不匹配**：当最近的会话条目缺少转录文件时发出警告。
    - **主会话“1 行 JSONL”**：当主转录只有一行时标记（历史没有累积）。
    - **多个状态目录**：当多个主目录中存在多个 `~/.openclaw` 文件夹，或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史可能在不同安装之间分裂）。
    - **远程模式提醒**：如果 `gateway.mode=remote`，Doctor 会提醒你在远程主机上运行它（状态位于那里）。
    - **配置文件权限**：如果 `~/.openclaw/openclaw.json` 可被组/全局读取，则发出警告，并提示收紧到 `600`。

  </Accordion>
  <Accordion title="5. 模型认证健康（OAuth 过期）">
    Doctor 会检查认证存储中的 OAuth 配置档，在令牌即将过期/已过期时发出警告，并在安全时刷新它们。如果 Anthropic OAuth/令牌配置档已过期，它会建议使用 Anthropic API key 或 Anthropic 设置令牌路径。刷新提示只会在交互式运行（TTY）时出现；`--non-interactive` 会跳过刷新尝试。

    当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、`invalid_grant`，或提供商告知你需要重新登录），Doctor 会报告需要重新认证，并打印要运行的准确 `openclaw models auth login --provider ...` 命令。

    Doctor 还会报告由于以下原因暂时不可用的认证配置档：

    - 短冷却期（速率限制/超时/认证失败）
    - 较长时间禁用（账单/额度失败）

    令牌位于 macOS Keychain 的旧版 Codex OAuth 配置档（基于文件的边车布局之前的旧新手引导）只能由 Doctor 修复。从交互式终端运行一次 `openclaw doctor --fix`，即可将 Keychain 支撑的旧版令牌内联迁移到 `auth-profiles.json`；之后，嵌入式轮次（Telegram、cron、子智能体分发）会将它们解析为规范的 OpenAI OAuth 配置档。

  </Accordion>
  <Accordion title="6. 钩子模型验证">
    如果设置了 `hooks.gmail.model`，Doctor 会根据目录和允许列表验证模型引用，并在其无法解析或被禁止时发出警告。
  </Accordion>
  <Accordion title="7. 沙箱镜像修复">
    启用沙箱隔离时，Doctor 会检查 Docker 镜像，并在当前镜像缺失时提示构建或切换到旧版名称。
  </Accordion>
  <Accordion title="7b. 插件安装清理">
    Doctor 会在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下移除旧版 OpenClaw 生成的插件依赖暂存状态。这涵盖陈旧的生成依赖根、旧安装阶段目录、早期内置插件依赖修复代码留下的包本地碎片，以及孤立或已恢复的托管 npm 内置 `@openclaw/*` 插件副本，这些副本可能遮蔽当前内置清单。Doctor 还会把主机 `openclaw` 包重新链接到声明了 `peerDependencies.openclaw` 的托管 npm 插件中，因此更新或 npm 修复后，包本地运行时导入（如 `openclaw/plugin-sdk/*`）仍能继续解析。

    当配置引用了可下载插件但本地插件注册表找不到它们时，Doctor 也可以重新安装缺失的可下载插件。示例包括实际的 `plugins.entries`、已配置的渠道/提供商/搜索设置，以及已配置的 Agent Runtimes。在包更新期间，Doctor 会避免在核心包正在替换时运行包管理器插件修复；如果更新后已配置插件仍需恢复，请再次运行 `openclaw doctor --fix`。Gateway 网关启动和配置重载不会运行包管理器；插件安装仍然是显式的 Doctor/安装/更新工作。

  </Accordion>
  <Accordion title="8. Gateway 网关服务迁移和清理提示">
    Doctor 会检测旧版 Gateway 网关服务（launchd/systemd/schtasks），并提示移除它们，然后使用当前 Gateway 网关端口安装 OpenClaw 服务。它还可以扫描额外的类似 Gateway 网关的服务并打印清理提示。带配置档名称的 OpenClaw Gateway 网关服务被视为一等对象，不会被标记为“额外”。

    在 Linux 上，如果用户级 Gateway 网关服务缺失但存在系统级 OpenClaw Gateway 网关服务，Doctor 不会自动安装第二个用户级服务。使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 检查，然后移除重复项，或者当系统监督器拥有 Gateway 网关生命周期时设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 启动 Matrix 迁移">
    当 Matrix 渠道账号存在待处理或可操作的旧版状态迁移时，Doctor（在 `--fix` / `--repair` 模式下）会创建迁移前快照，然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。这两个步骤都是非致命的；错误会被记录，启动会继续。在只读模式（不带 `--fix` 的 `openclaw doctor`）下，此检查会被完全跳过。
  </Accordion>
  <Accordion title="8c. 设备配对和认证漂移">
    Doctor 现在会将设备配对状态作为常规健康检查的一部分进行检查。

    它报告的内容：

    - 待处理的首次配对请求
    - 已配对设备的待处理角色升级
    - 已配对设备的待处理范围升级
    - 设备 ID 仍匹配但设备身份不再匹配已批准记录的公钥不匹配修复
    - 缺少已批准角色活动令牌的配对记录
    - 范围漂移到已批准配对基线之外的配对令牌
    - 当前机器上早于 Gateway 网关侧令牌轮换或携带陈旧范围元数据的本地缓存设备令牌条目

    Doctor 不会自动批准配对请求或自动轮换设备令牌。它会改为打印准确的后续步骤：

    - 使用 `openclaw devices list` 检查待处理请求
    - 使用 `openclaw devices approve <requestId>` 批准确切请求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新令牌
    - 使用 `openclaw devices remove <deviceId>` 移除并重新批准陈旧记录

    这修复了常见的“已经配对但仍然提示需要配对”缺口：Doctor 现在会区分首次配对、待处理的角色/作用域升级，以及过期 token/设备身份漂移。

  </Accordion>
  <Accordion title="9. 安全警告">
    当某个提供商在没有 allowlist 的情况下向私信开放，或某项策略以危险方式配置时，Doctor 会发出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果作为 systemd 用户服务运行，Doctor 会确保已启用 lingering，让 Gateway 网关在登出后保持运行。
  </Accordion>
  <Accordion title="11. 工作区状态（Skills、插件和 TaskFlows）">
    Doctor 会打印默认智能体的工作区状态摘要：

    - **Skills 状态**：统计符合条件、缺少需求和被 allowlist 阻止的 skills。
    - **插件状态**：统计已启用/已禁用/出错的插件；列出所有错误的插件 ID；报告 bundle 插件能力。
    - **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
    - **插件诊断**：显示插件注册表在加载时发出的任何警告或错误。
    - **TaskFlow 恢复**：显示需要手动检查或取消的可疑托管 TaskFlows。

  </Accordion>
  <Accordion title="11b. Bootstrap 文件大小">
    Doctor 会检查工作区 bootstrap 文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过配置的字符预算。它会按文件报告原始字符数与注入字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及总注入字符数占总预算的比例。当文件被截断或接近限制时，Doctor 会打印调优 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 过期渠道插件清理">
    当 `openclaw doctor --fix` 移除缺失的渠道插件时，它也会移除引用该插件的悬空渠道作用域配置：`channels.<id>` 条目、命名该渠道的 heartbeat 目标，以及 `agents.*.models["<channel>/*"]` 覆盖。这可以防止渠道运行时已消失但配置仍要求 Gateway 网关绑定到它而导致的 Gateway 网关启动循环。
  </Accordion>
  <Accordion title="11c. Shell 补全">
    Doctor 会检查当前 shell（zsh、bash、fish 或 PowerShell）是否已安装 tab 补全：

    - 如果 shell profile 使用较慢的动态补全模式（`source <(openclaw completion ...)`），Doctor 会将其升级为更快的缓存文件变体。
    - 如果 profile 中配置了补全但缓存文件缺失，Doctor 会自动重新生成缓存。
    - 如果完全未配置补全，Doctor 会提示安装（仅交互模式；使用 `--non-interactive` 时跳过）。

    运行 `openclaw completion --write-state` 可手动重新生成缓存。

  </Accordion>
  <Accordion title="12. Gateway 网关鉴权检查（本地 token）">
    Doctor 会检查本地 Gateway 网关 token 鉴权是否就绪。

    - 如果 token 模式需要 token 且不存在 token 来源，Doctor 会提议生成一个。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，Doctor 会发出警告，且不会用明文覆盖它。
    - `openclaw doctor --generate-gateway-token` 只会在未配置 token SecretRef 时强制生成。

  </Accordion>
  <Accordion title="12b. 支持 SecretRef 的只读修复">
    某些修复流程需要在不削弱运行时快速失败行为的前提下检查已配置的凭证。

    - `openclaw doctor --fix` 现在会使用与 status 系列命令相同的只读 SecretRef 摘要模型来执行有针对性的配置修复。
    - 示例：Telegram `allowFrom` / `groupAllowFrom` 的 `@username` 修复会在可用时尝试使用已配置的 bot 凭证。
    - 如果 Telegram bot token 通过 SecretRef 配置，但在当前命令路径中不可用，Doctor 会报告该凭证已配置但不可用，并跳过自动解析，而不是崩溃或误报 token 缺失。

  </Accordion>
  <Accordion title="13. Gateway 网关健康检查 + 重启">
    Doctor 会运行健康检查，并在 Gateway 网关看起来不健康时提议重启。
  </Accordion>
  <Accordion title="13b. 记忆搜索就绪状态">
    Doctor 会检查已配置的记忆搜索 embedding 提供商是否已为默认智能体准备就绪。行为取决于配置的后端和提供商：

    - **QMD 后端**：探测 `qmd` 二进制文件是否可用且可启动。如果不可用，会打印修复指引，包括 npm 包和手动二进制路径选项。
    - **显式本地提供商**：检查本地模型文件，或可识别的远程/可下载模型 URL。如果缺失，会建议切换到远程提供商。
    - **显式远程提供商**（`openai`、`voyage` 等）：验证环境或 auth store 中是否存在 API key。缺失时会打印可操作的修复提示。
    - **旧版 auto 提供商**：将 `memorySearch.provider: "auto"` 视为 OpenAI，检查 OpenAI 就绪状态，并且 `doctor --fix` 会将其改写为 `provider: "openai"`。

    当有缓存的 Gateway 网关探测结果可用时（检查时 Gateway 网关健康），Doctor 会将其结果与 CLI 可见配置交叉比对，并指出任何差异。Doctor 不会在默认路径上启动新的 embedding ping；需要实时提供商检查时，请使用深度记忆状态命令。

    使用 `openclaw memory status --deep` 在运行时验证 embedding 就绪状态。

  </Accordion>
  <Accordion title="14. 渠道状态警告">
    如果 Gateway 网关健康，Doctor 会运行渠道状态探测，并报告警告和建议修复方式。
  </Accordion>
  <Accordion title="15. Supervisor 配置审计 + 修复">
    Doctor 会检查已安装的 supervisor 配置（launchd/systemd/schtasks）是否缺少默认值或默认值过期（例如 systemd network-online 依赖和重启延迟）。当发现不匹配时，它会建议更新，并可以将服务文件/任务改写为当前默认值。

    注意：

    - `openclaw doctor` 会在改写 supervisor 配置前提示。
    - `openclaw doctor --yes` 会接受默认修复提示。
    - `openclaw doctor --fix` 会在不提示的情况下应用推荐修复（`--repair` 是别名）。
    - `openclaw doctor --fix --force` 会覆盖自定义 supervisor 配置。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 会让 Doctor 对 Gateway 网关服务生命周期保持只读。它仍会报告服务健康并运行非服务修复，但会跳过服务安装/启动/重启/bootstrap、supervisor 配置改写，以及旧版服务清理，因为该生命周期由外部 supervisor 拥有。
    - 在 Linux 上，当匹配的 systemd Gateway 网关单元处于活动状态时，Doctor 不会改写命令/入口点元数据。它也会在重复服务扫描期间忽略非活动的非旧版额外 Gateway 网关类似单元，因此配套服务文件不会产生清理噪声。
    - 如果 token 鉴权需要 token 且 `gateway.auth.token` 由 SecretRef 管理，Doctor 服务安装/修复会验证 SecretRef，但不会将解析出的明文 token 值持久化到 supervisor 服务环境元数据中。
    - Doctor 会检测旧版 LaunchAgent、systemd 或 Windows Scheduled Task 安装中以内联方式嵌入的托管 `.env`/SecretRef 支持的服务环境值，并改写服务元数据，使这些值从运行时来源加载，而不是从 supervisor 定义加载。
    - Doctor 会检测服务命令是否在 `gateway.port` 变更后仍固定旧的 `--port`，并将服务元数据改写为当前端口。
    - 如果 token 鉴权需要 token 且配置的 token SecretRef 未解析，Doctor 会阻止安装/修复路径并提供可操作指引。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，Doctor 会阻止安装/修复，直到显式设置 mode。
    - 对于 Linux user-systemd 单元，Doctor token 漂移检查现在会在比较服务鉴权元数据时同时包含 `Environment=` 和 `EnvironmentFile=` 来源。
    - 当配置最后由较新版本写入时，Doctor 服务修复会拒绝使用较旧 OpenClaw 二进制文件改写、停止或重启 Gateway 网关服务。请参阅 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你始终可以通过 `openclaw gateway install --force` 强制完整改写。

  </Accordion>
  <Accordion title="16. Gateway 网关运行时 + 端口诊断">
    Doctor 会检查服务运行时（PID、最后退出状态），并在服务已安装但实际未运行时发出警告。它还会检查 Gateway 网关端口（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已在运行、SSH tunnel）。
  </Accordion>
  <Accordion title="17. Gateway 网关运行时最佳实践">
    当 Gateway 网关服务运行在 Bun 或版本管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上时，Doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，而版本管理器路径可能在升级后失效，因为服务不会加载你的 shell init。Doctor 会在系统 Node 安装可用时提议迁移到系统 Node 安装（Homebrew/apt/choco）。

    新安装或修复的 macOS LaunchAgents 会使用规范的系统 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是复制交互式 shell PATH，因此 Homebrew 管理的系统二进制文件仍可用，同时 Volta、asdf、fnm、pnpm 和其他版本管理器目录不会改变 Node 子进程解析到的内容。Linux 服务仍会保留显式环境根目录（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和稳定的用户 bin 目录，但猜测得到的版本管理器 fallback 目录只有在这些目录实际存在于磁盘上时才会写入服务 PATH。

  </Accordion>
  <Accordion title="18. 配置写入 + 向导元数据">
    Doctor 会持久化任何配置变更，并写入向导元数据以记录 Doctor 运行。
  </Accordion>
  <Accordion title="19. 工作区提示（备份 + 记忆系统）">
    当缺少工作区记忆系统时，Doctor 会建议添加，并在工作区尚未纳入 git 时打印备份提示。

    请参阅 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)，获取工作区结构和 git 备份的完整指南（推荐使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
