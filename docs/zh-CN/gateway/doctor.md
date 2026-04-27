---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置变更
sidebarTitle: Doctor
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-04-27T22:22:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5af15cf2f9616286d601518872b736c9e07d5aabb4943c483bd35aa9e3bdc77a
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它会修复过时的配置/状态，检查健康状况，并提供可执行的修复步骤。

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

    接受默认选项而不提示（在适用时，包括重启/服务/沙箱修复步骤）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不经提示应用建议的修复（在安全情况下执行修复 + 重启）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    也应用激进修复（会覆盖自定义 supervisor 配置）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    无提示运行，并且只应用安全迁移（配置规范化 + 磁盘状态移动）。会跳过需要人工确认的重启/服务/沙箱操作。检测到旧版状态时，会自动运行旧版状态迁移。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    扫描系统服务以查找额外的 Gateway 网关安装（`launchd`/`systemd`/`schtasks`）。

  </Tab>
</Tabs>

如果你想在写入前先查看更改，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 它会执行什么操作（摘要）

<AccordionGroup>
  <Accordion title="健康状况、UI 和更新">
    - 为 git 安装提供可选的预检更新（仅交互模式）。
    - UI 协议新鲜度检查（当协议 schema 更新时重建 Control UI）。
    - 健康检查 + 重启提示。
    - Skills 状态摘要（可用/缺失/被阻止）和插件状态。
  </Accordion>
  <Accordion title="配置和迁移">
    - 旧版值的配置规范化。
    - 将旧版扁平 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>` 的 Talk 配置迁移。
    - 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪状态的浏览器迁移检查。
    - OpenCode provider 覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth 配置的 OAuth TLS 前置条件检查。
    - 旧版磁盘状态迁移（会话/智能体目录/WhatsApp 认证）。
    - 旧版插件清单契约键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层 delivery/payload 字段、payload `provider`、简单的 `notify: true` webhook 回退任务）。
    - 将旧版智能体 runtime-policy 迁移到 `agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。
  </Accordion>
  <Accordion title="状态和完整性">
    - 会话锁文件检查和过时锁清理。
    - 修复受影响的 2026.4.24 构建创建的重复 prompt-rewrite 分支的会话转录。
    - 状态完整性和权限检查（会话、转录、状态目录）。
    - 本地运行时的配置文件权限检查（`chmod 600`）。
    - 模型认证健康状况：检查 OAuth 过期时间、可刷新即将过期的令牌，并报告 auth-profile 冷却/禁用状态。
    - 额外工作区目录检测（`~/openclaw`）。
  </Accordion>
  <Accordion title="Gateway 网关、服务和 supervisor">
    - 在启用沙箱隔离时执行沙箱镜像修复。
    - 旧版服务迁移和额外 Gateway 网关检测。
    - Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式下）。
    - Gateway 网关运行时检查（服务已安装但未运行；缓存的 `launchd` 标签）。
    - 渠道状态警告（从正在运行的 Gateway 网关探测）。
    - supervisor 配置审计（`launchd`/`systemd`/`schtasks`）并可选择修复。
    - 清理在安装或更新期间捕获 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值的 Gateway 网关服务中的嵌入式代理环境。
    - Gateway 网关运行时最佳实践检查（Node 与 Bun、版本管理器路径）。
    - Gateway 网关端口冲突诊断（默认 `18789`）。
  </Accordion>
  <Accordion title="认证、安全和配对">
    - 针对开放私信策略的安全警告。
    - 本地令牌模式的 Gateway 网关认证检查（当不存在令牌来源时提供令牌生成功能；不会覆盖 token SecretRef 配置）。
    - 设备配对问题检测（首次配对请求待处理、角色/作用域升级待处理、本地设备令牌缓存漂移过时，以及已配对记录的认证漂移）。
  </Accordion>
  <Accordion title="工作区和 shell">
    - Linux 上的 `systemd linger` 检查。
    - 工作区 bootstrap 文件大小检查（上下文文件的截断/接近上限警告）。
    - shell 补全状态检查和自动安装/升级。
    - Memory 搜索 embedding 提供商就绪状态检查（本地模型、远程 API 密钥或 QMD 二进制）。
    - 源码安装检查（`pnpm` 工作区不匹配、缺少 UI 资源、缺少 `tsx` 二进制）。
    - 写入更新后的配置 + 向导元数据。
  </Accordion>
</AccordionGroup>

## Dreams UI 回填和重置

Control UI 的 Dreams 场景包含用于 grounded dreaming 工作流的 **Backfill**、**Reset** 和 **Clear Grounded** 操作。这些操作使用 Gateway 网关风格的 doctor RPC 方法，但它们**不是** `openclaw doctor` CLI 修复/迁移的一部分。

它们的作用：

- **Backfill** 会扫描活动工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行 grounded REM diary 过程，并将可逆的回填条目写入 `DREAMS.md`。
- **Reset** 仅从 `DREAMS.md` 中移除那些已标记的回填 diary 条目。
- **Clear Grounded** 仅移除来自历史回放、且尚未积累实时 recall 或每日支持的 staged grounded-only 短期条目。

它们**不会**自行执行的操作：

- 不会编辑 `MEMORY.md`
- 不会运行完整的 doctor 迁移
- 不会自动将 grounded 候选项暂存到实时短期提升存储中，除非你先明确运行 staged CLI 路径

如果你想让 grounded 历史回放影响正常的深度提升流程，请改用以下 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这会将 grounded 持久候选项暂存到短期 dreaming 存储中，同时将 `DREAMS.md` 作为审查界面。

## 详细行为和原因说明

<AccordionGroup>
  <Accordion title="0. 可选更新（git 安装）">
    如果这是一个 git 检出，并且 doctor 以交互模式运行，它会在运行 doctor 之前提供更新选项（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 配置规范化">
    如果配置包含旧版值结构（例如 `messages.ackReaction` 没有特定于渠道的覆盖），doctor 会将其规范化为当前 schema。

    这也包括旧版 Talk 扁平字段。当前公开的 Talk 配置为 `talk.provider` + `talk.providers.<provider>`。Doctor 会将旧的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 结构重写到提供商映射中。

  </Accordion>
  <Accordion title="2. 旧版配置键迁移">
    当配置包含已弃用的键时，其他命令会拒绝运行，并要求你运行 `openclaw doctor`。

    Doctor 将会：

    - 说明发现了哪些旧版键。
    - 显示它应用的迁移。
    - 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

    当 Gateway 网关在启动时检测到旧版配置格式，也会自动运行 doctor 迁移，因此过时配置无需手动干预即可修复。Cron 任务存储迁移由 `openclaw doctor --fix` 处理。

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
    - 对于配置了命名 `accounts` 但仍保留单账户顶层渠道值的渠道，将这些账户作用域的值移入该渠道选择的提升账户中（大多数渠道使用 `accounts.default`；Matrix 可以保留现有匹配的命名/默认目标）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 删除 `agents.defaults.llm`；慢速提供商/模型超时请使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 删除 `browser.relayBindHost`（旧版扩展 relay 设置）
    - 旧版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 网关启动时也会跳过 `api` 设置为未来或未知枚举值的提供商，而不是直接失败关闭）

    Doctor 警告还包括针对多账户渠道的默认账户指导：

    - 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但没有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 会警告回退路由可能选择意外账户。
    - 如果 `channels.<channel>.defaultAccount` 被设置为未知账户 ID，doctor 会发出警告并列出已配置的账户 ID。

  </Accordion>
  <Accordion title="2b. OpenCode provider 覆盖">
    如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode 目录。这可能会强制模型使用错误的 API，或将费用归零。Doctor 会发出警告，以便你移除该覆盖并恢复按模型路由的 API + 费用。
  </Accordion>
  <Accordion title="2c. 浏览器迁移和 Chrome MCP 就绪状态">
    如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，doctor 会将其规范化为当前基于主机本地的 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 会变为 `"existing-session"`
    - `browser.relayBindHost` 会被移除

    当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` 配置时，doctor 还会审查主机本地 Chrome MCP 路径：

    - 检查同一主机上是否已安装 Google Chrome，以用于默认自动连接配置
    - 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
    - 提醒你在浏览器检查页面启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 无法替你启用 Chrome 端设置。主机本地 Chrome MCP 仍然要求：

    - Gateway 网关/节点主机上存在 144+ 的 Chromium 内核浏览器
    - 浏览器在本地运行
    - 在该浏览器中启用远程调试
    - 在浏览器中批准首次附加同意提示

    此处的就绪状态仅与本地附加前置条件有关。Existing-session 会保留当前 Chrome MCP 路由限制；像 `responsebody`、PDF 导出、下载拦截和批处理操作这样的高级路由仍然需要托管浏览器或原始 CDP 配置。

    此检查**不**适用于 Docker、沙箱、remote-browser 或其他无头流程。那些流程仍继续使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置条件">
    当配置了 OpenAI Codex OAuth 配置时，doctor 会探测 OpenAI 授权端点，以验证本地 Node/OpenSSL TLS 栈是否能够校验证书链。如果探测因证书错误失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），doctor 会输出特定于平台的修复指导。在使用 Homebrew Node 的 macOS 上，修复通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关健康，该探测也会运行。
  </Accordion>
  <Accordion title="2e. Codex OAuth provider 覆盖">
    如果你之前在 `models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，它们可能会遮蔽新版本自动使用的内置 Codex OAuth provider 路径。当 doctor 在 Codex OAuth 旁边看到这些旧传输设置时，会发出警告，以便你移除或重写过时的传输覆盖，并恢复内置的路由/回退行为。自定义代理和仅标头覆盖仍受支持，不会触发此警告。
  </Accordion>
  <Accordion title="2f. Codex 插件路由警告">
    当启用内置 Codex 插件时，doctor 还会检查 `openai-codex/*` 主模型引用是否仍通过默认的 PI runner 解析。当你希望通过 PI 使用 Codex OAuth/订阅认证时，这种组合是有效的，但它很容易与原生 Codex app-server harness 混淆。Doctor 会发出警告，并指向明确的 app-server 形态：`openai/*` 加 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。

    Doctor 不会自动修复这一点，因为这两条路径都有效：

    - `openai-codex/*` + PI 表示“通过普通 OpenClaw runner 使用 Codex OAuth/订阅认证。”
    - `openai/*` + `runtime: "codex"` 表示“通过原生 Codex app-server 运行嵌入式轮次。”
    - `/codex ...` 表示“从聊天中控制或绑定原生 Codex 对话。”
    - `/acp ...` 或 `runtime: "acp"` 表示“使用外部 ACP/acpx 适配器。”

    如果出现此警告，请选择你原本想使用的路径并手动编辑配置。如果有意使用 PI Codex OAuth，请保持该警告原样不动。

  </Accordion>
  <Accordion title="3. 旧版状态迁移（磁盘布局）">
    Doctor 可以将较旧的磁盘布局迁移到当前结构：

    - 会话存储 + 转录：
      - 从 `~/.openclaw/sessions/` 迁移到 `~/.openclaw/agents/<agentId>/sessions/`
    - 智能体目录：
      - 从 `~/.openclaw/agent/` 迁移到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 认证状态（Baileys）：
      - 从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 迁移到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 ID：`default`）

    这些迁移尽力而为，并且是幂等的；如果 doctor 保留了任何旧版文件夹作为备份，它会发出警告。Gateway 网关/CLI 也会在启动时自动迁移旧版会话 + 智能体目录，因此历史记录/认证/模型会落到每个智能体的路径下，而无需手动运行 doctor。WhatsApp 认证有意仅通过 `openclaw doctor` 迁移。Talk provider/provider 映射规范化现在按结构相等性进行比较，因此仅键顺序不同将不再触发重复的无操作 `doctor --fix` 更改。

  </Accordion>
  <Accordion title="3a. 旧版插件清单迁移">
    Doctor 会扫描所有已安装的插件清单，查找已弃用的顶层能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。发现后，它会提供将它们移动到 `contracts` 对象中，并原地重写清单文件。此迁移是幂等的；如果 `contracts` 键中已经有相同的值，则会删除旧版键，而不会重复数据。
  </Accordion>
  <Accordion title="3b. 旧版 cron 存储迁移">
    Doctor 还会检查 cron 任务存储（默认是 `~/.openclaw/cron/jobs.json`，或覆盖时使用 `cron.store`）中调度器仍为兼容性而接受的旧任务结构。

    当前 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 顶层 payload 字段（`message`、`model`、`thinking`、...）→ `payload`
    - 顶层 delivery 字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` 交付别名 → 显式 `delivery.channel`
    - 简单旧版 `notify: true` webhook 回退任务 → 显式 `delivery.mode="webhook"` 且 `delivery.to=cron.webhook`

    只有在不改变行为的情况下，Doctor 才会自动迁移 `notify: true` 任务。如果某个任务将旧版 notify 回退与现有的非 webhook 交付模式组合使用，doctor 会发出警告，并将该任务留给你手动审查。

  </Accordion>
  <Accordion title="3c. 会话锁清理">
    Doctor 会扫描每个智能体会话目录中的过时写锁文件——即会话异常退出后遗留的文件。对于发现的每个锁文件，它会报告：路径、PID、该 PID 是否仍存活、锁的存在时长，以及它是否被视为过时（PID 已死或超过 30 分钟）。在 `--fix` / `--repair` 模式下，它会自动删除过时锁文件；否则它会输出说明，并指示你使用 `--fix` 重新运行。
  </Accordion>
  <Accordion title="3d. 会话转录分支修复">
    Doctor 会扫描智能体会话 JSONL 文件，查找由 2026.4.24 prompt transcript 重写 bug 产生的重复分支结构：一个被放弃的用户轮次包含 OpenClaw 内部运行时上下文，同时一个活跃的同级分支包含相同的可见用户提示。在 `--fix` / `--repair` 模式下，doctor 会在原文件旁边备份每个受影响的文件，并将转录重写为活跃分支，这样 Gateway 网关历史记录和 Memory 读取器就不会再看到重复轮次。
  </Accordion>
  <Accordion title="4. 状态完整性检查（会话持久化、路由和安全）">
    状态目录是运行层面的中枢。如果它消失了，你将丢失会话、凭证、日志和配置（除非你在其他地方有备份）。

    Doctor 会检查：

    - **状态目录缺失**：警告灾难性的状态丢失，提示重新创建目录，并提醒你它无法恢复丢失的数据。
    - **状态目录权限**：验证是否可写；提供修复权限的选项（并在检测到所有者/组不匹配时输出 `chown` 提示）。
    - **macOS 云同步状态目录**：当状态解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下时发出警告，因为基于同步的路径可能导致更慢的 I/O 以及锁/同步竞争。
    - **Linux SD 或 eMMC 状态目录**：当状态解析到 `mmcblk*` 挂载源时发出警告，因为由 SD 或 eMMC 支持的随机 I/O 在会话和凭证写入时可能更慢且磨损更快。
    - **会话目录缺失**：`sessions/` 和会话存储目录是持久化历史记录并避免 `ENOENT` 崩溃所必需的。
    - **转录不匹配**：当最近的会话条目缺少转录文件时发出警告。
    - **主会话“单行 JSONL”**：当主转录只有一行时标记出来（历史记录未持续累积）。
    - **多个状态目录**：当多个主目录下存在多个 `~/.openclaw` 文件夹，或 `OPENCLAW_STATE_DIR` 指向别处时发出警告（历史记录可能在不同安装之间分裂）。
    - **远程模式提醒**：如果 `gateway.mode=remote`，doctor 会提醒你在远程主机上运行它（状态保存在那里）。
    - **配置文件权限**：如果 `~/.openclaw/openclaw.json` 对组/全体用户可读，则发出警告，并提供将权限收紧到 `600` 的选项。

  </Accordion>
  <Accordion title="5. 模型认证健康状况（OAuth 过期）">
    Doctor 会检查认证存储中的 OAuth 配置，在令牌即将过期/已过期时发出警告，并可在安全时刷新它们。如果 Anthropic OAuth/令牌配置已过时，它会建议使用 Anthropic API 密钥或 Anthropic setup-token 路径。只有在交互模式（TTY）下运行时才会出现刷新提示；`--non-interactive` 会跳过刷新尝试。

    当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、`invalid_grant`，或提供商要求你重新登录），doctor 会报告需要重新认证，并打印确切的 `openclaw models auth login --provider ...` 命令供你运行。

    Doctor 还会报告因以下原因而暂时不可用的认证配置：

    - 短时间冷却（速率限制/超时/认证失败）
    - 较长时间禁用（账单/额度失败）

  </Accordion>
  <Accordion title="6. Hooks 模型验证">
    如果设置了 `hooks.gmail.model`，doctor 会根据目录和允许列表验证该模型引用，并在它无法解析或不被允许时发出警告。
  </Accordion>
  <Accordion title="7. 沙箱镜像修复">
    启用沙箱隔离时，doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建或切换到旧版名称的选项。
  </Accordion>
  <Accordion title="7b. 内置插件运行时依赖">
    Doctor 仅验证当前配置中处于活动状态或由其内置清单默认启用的内置插件的运行时依赖，例如 `plugins.entries.discord.enabled: true`、旧版 `channels.discord.enabled: true`，或默认启用的内置 provider。如果缺少任何依赖，doctor 会报告这些软件包，并在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下安装它们。外部插件仍使用 `openclaw plugins install` / `openclaw plugins update`；doctor 不会为任意插件路径安装依赖。

    在 doctor 修复期间，内置运行时依赖的 npm 安装会在 TTY 会话中报告旋转进度提示，并在管道/无头输出中定期输出逐行进度。Gateway 网关和本地 CLI 也可以在导入内置插件之前按需修复处于活动状态的内置插件运行时依赖。这些安装被限定在插件运行时安装根目录中，运行时禁用脚本，不会写入 package lock，并由安装根锁保护，因此并发的 CLI 或 Gateway 网关启动不会同时修改同一个 `node_modules` 树。

  </Accordion>
  <Accordion title="8. Gateway 网关服务迁移和清理提示">
    Doctor 会检测旧版 Gateway 网关服务（`launchd`/`systemd`/`schtasks`），并提供删除它们以及使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它还可以扫描额外的类 Gateway 网关服务，并输出清理提示。带有配置名的 OpenClaw Gateway 网关服务被视为一等公民，不会被标记为“额外”。

    在 Linux 上，如果用户级 Gateway 网关服务缺失，但存在系统级 OpenClaw Gateway 网关服务，doctor 不会自动安装第二个用户级服务。请使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 检查，然后删除重复项，或者在系统 supervisor 管理 Gateway 网关生命周期时设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 启动时 Matrix 迁移">
    当 Matrix 渠道账户存在待处理或可执行的旧版状态迁移时，doctor（在 `--fix` / `--repair` 模式下）会先创建迁移前快照，然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。这两个步骤都不是致命的；错误会被记录，启动会继续进行。在只读模式（不带 `--fix` 的 `openclaw doctor`）下，此检查会被完全跳过。
  </Accordion>
  <Accordion title="8c. 设备配对和认证漂移">
    Doctor 现在会将设备配对状态作为常规健康检查的一部分进行检查。

    它会报告：

    - 待处理的首次配对请求
    - 已配对设备待处理的角色升级
    - 已配对设备待处理的作用域升级
    - 当设备 ID 仍匹配但设备身份不再匹配已批准记录时的公钥不匹配修复
    - 已配对记录中缺少已批准角色的活动令牌
    - 作用域漂移超出已批准配对基线的已配对令牌
    - 当前机器上的本地缓存设备令牌条目早于 Gateway 网关侧令牌轮换，或携带过时作用域元数据

    Doctor 不会自动批准配对请求，也不会自动轮换设备令牌。它会改为输出精确的下一步操作：

    - 使用 `openclaw devices list` 检查待处理请求
    - 使用 `openclaw devices approve <requestId>` 批准精确请求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新的令牌
    - 使用 `openclaw devices remove <deviceId>` 删除并重新批准过时记录

    这样就堵住了常见的“明明已经配对但仍然提示需要配对”的漏洞：doctor 现在可以区分首次配对、待处理的角色/作用域升级，以及过时的令牌/设备身份漂移。

  </Accordion>
  <Accordion title="9. 安全警告">
    当某个 provider 对私信开放但没有允许列表，或者某项策略以危险方式配置时，doctor 会发出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果作为 systemd 用户服务运行，doctor 会确保已启用 lingering，以便 Gateway 网关在注销后仍保持运行。
  </Accordion>
  <Accordion title="11. 工作区状态（Skills、插件和旧版目录）">
    Doctor 会打印默认智能体的工作区状态摘要：

    - **Skills 状态**：统计可用、缺少要求和被允许列表阻止的 Skills 数量。
    - **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录与当前工作区同时存在时发出警告。
    - **插件状态**：统计已启用/已禁用/出错的插件数量；列出所有出错插件的插件 ID；报告 bundle 插件能力。
    - **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
    - **插件诊断**：显示插件注册表在加载时发出的任何警告或错误。

  </Accordion>
  <Accordion title="11b. Bootstrap 文件大小">
    Doctor 会检查工作区 bootstrap 文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过已配置的字符预算。它会报告每个文件的原始字符数与注入字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及总注入字符数占总预算的比例。当文件被截断或接近上限时，doctor 会输出关于调整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的建议。
  </Accordion>
  <Accordion title="11d. 过时渠道插件清理">
    当 `openclaw doctor --fix` 删除缺失的渠道插件时，它也会删除引用该插件的悬空渠道作用域配置：`channels.<id>` 条目、指定该渠道的心跳目标，以及 `agents.*.models["<channel>/*"]` 覆盖。这可以防止 Gateway 网关启动循环：渠道运行时已经不存在，但配置仍要求 Gateway 网关绑定到它。
  </Accordion>
  <Accordion title="11c. Shell 补全">
    Doctor 会检查当前 shell（zsh、bash、fish 或 PowerShell）是否已安装 tab 补全：

    - 如果 shell 配置文件使用了较慢的动态补全模式（`source <(openclaw completion ...)`），doctor 会将其升级为更快的缓存文件变体。
    - 如果补全已在配置文件中配置，但缓存文件缺失，doctor 会自动重新生成缓存。
    - 如果根本没有配置补全，doctor 会提示安装它（仅交互模式；使用 `--non-interactive` 时跳过）。

    运行 `openclaw completion --write-state` 可手动重新生成缓存。

  </Accordion>
  <Accordion title="12. Gateway 网关认证检查（本地令牌）">
    Doctor 会检查本地 Gateway 网关令牌认证的就绪状态。

    - 如果令牌模式需要令牌且不存在令牌来源，doctor 会提供生成令牌的选项。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，doctor 会发出警告，并且不会用明文覆盖它。
    - 仅当未配置 token SecretRef 时，`openclaw doctor --generate-gateway-token` 才会强制生成令牌。

  </Accordion>
  <Accordion title="12b. 只读 SecretRef 感知修复">
    某些修复流程需要检查已配置的凭证，同时又不能削弱运行时快速失败行为。

    - `openclaw doctor --fix` 现在对定向配置修复使用与 status 系列命令相同的只读 SecretRef 摘要模型。
    - 示例：Telegram `allowFrom` / `groupAllowFrom` 的 `@username` 修复会在可用时尝试使用已配置的机器人凭证。
    - 如果 Telegram 机器人令牌通过 SecretRef 配置，但在当前命令路径中不可用，doctor 会报告该凭证“已配置但不可用”，并跳过自动解析，而不是崩溃或错误地将令牌报告为缺失。

  </Accordion>
  <Accordion title="13. Gateway 网关健康检查 + 重启">
    Doctor 会运行健康检查，并在 Gateway 网关看起来不健康时提供重启选项。
  </Accordion>
  <Accordion title="13b. Memory 搜索就绪状态">
    Doctor 会检查为默认智能体配置的 Memory 搜索 embedding provider 是否已就绪。行为取决于配置的后端和 provider：

    - **QMD 后端**：探测 `qmd` 二进制是否可用且可启动。如果不可用，会输出修复指导，包括 npm 软件包和手动二进制路径选项。
    - **显式本地 provider**：检查本地模型文件或已识别的远程/可下载模型 URL 是否存在。如果缺失，会建议切换到远程 provider。
    - **显式远程 provider**（`openai`、`voyage` 等）：验证环境变量或认证存储中是否存在 API 密钥。如果缺失，会输出可执行的修复提示。
    - **自动 provider**：先检查本地模型可用性，然后按自动选择顺序依次尝试各个远程 provider。

    当存在缓存的 Gateway 网关探测结果时（检查时 Gateway 网关是健康的），doctor 会将其结果与 CLI 可见配置进行交叉比对，并标注任何不一致。Doctor 在默认路径上不会启动新的 embedding ping；如果你想进行实时 provider 检查，请使用深度 Memory 状态命令。

    使用 `openclaw memory status --deep` 可在运行时验证 embedding 就绪状态。

  </Accordion>
  <Accordion title="14. 渠道状态警告">
    如果 Gateway 网关健康，doctor 会运行渠道状态探测，并报告附带建议修复方案的警告。
  </Accordion>
  <Accordion title="15. supervisor 配置审计 + 修复">
    Doctor 会检查已安装的 supervisor 配置（`launchd`/`systemd`/`schtasks`）是否缺少或使用了过时默认值（例如 systemd 的 `network-online` 依赖和重启延迟）。当发现不匹配时，它会建议更新，并可将服务文件/任务重写为当前默认值。

    说明：

    - `openclaw doctor` 会在重写 supervisor 配置前提示确认。
    - `openclaw doctor --yes` 会接受默认修复提示。
    - `openclaw doctor --repair` 会在无提示的情况下应用建议修复。
    - `openclaw doctor --repair --force` 会覆盖自定义 supervisor 配置。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 会使 doctor 对 Gateway 网关服务生命周期保持只读。它仍会报告服务健康状况并运行非服务修复，但会跳过服务安装/启动/重启/bootstrap、supervisor 配置重写以及旧版服务清理，因为该生命周期由外部 supervisor 管理。
    - 如果令牌认证需要令牌且 `gateway.auth.token` 由 SecretRef 管理，doctor 服务安装/修复会验证 SecretRef，但不会将解析出的明文令牌值持久化到 supervisor 服务环境元数据中。
    - Doctor 会检测较旧的 LaunchAgent、systemd 或 Windows Scheduled Task 安装内联嵌入的托管 `.env`/SecretRef 支持的服务环境值，并重写服务元数据，使这些值从运行时来源加载，而不是从 supervisor 定义中加载。
    - 当 `gateway.port` 更改后，如果服务命令仍固定旧的 `--port`，doctor 会检测到这一点，并将服务元数据重写为当前端口。
    - 如果令牌认证需要令牌且配置的 token SecretRef 未解析，doctor 会阻止安装/修复路径，并提供可执行指导。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，doctor 会阻止安装/修复，直到显式设置模式。
    - 对于 Linux user-systemd 单元，doctor 的令牌漂移检查现在在比较服务认证元数据时同时包含 `Environment=` 和 `EnvironmentFile=` 来源。
    - 当配置最后一次由较新版本写入时，doctor 服务修复会拒绝重写、停止或重启来自较旧 OpenClaw 二进制的 Gateway 网关服务。参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你始终可以通过 `openclaw gateway install --force` 强制执行完整重写。

  </Accordion>
  <Accordion title="16. Gateway 网关运行时 + 端口诊断">
    Doctor 会检查服务运行时（PID、最近退出状态），并在服务已安装但实际上未运行时发出警告。它还会检查 Gateway 网关端口（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已在运行、SSH 隧道）。
  </Accordion>
  <Accordion title="17. Gateway 网关运行时最佳实践">
    当 Gateway 网关服务运行在 Bun 或版本管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上时，Doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，而版本管理器路径可能会在升级后失效，因为服务不会加载你的 shell 初始化。Doctor 会在可用时提供迁移到系统 Node 安装的选项（Homebrew/apt/choco）。

    新安装或修复后的服务会保留显式环境根目录（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和稳定的用户二进制目录，但推测得到的版本管理器回退目录只有在这些目录实际存在于磁盘上时，才会写入服务 PATH。这使生成的 supervisor PATH 与 doctor 后续运行的相同最小 PATH 审计保持一致。

  </Accordion>
  <Accordion title="18. 配置写入 + 向导元数据">
    Doctor 会持久化所有配置更改，并写入向导元数据以记录本次 doctor 运行。
  </Accordion>
  <Accordion title="19. 工作区提示（备份 + Memory 系统）">
    当工作区缺少 Memory 系统时，Doctor 会建议使用一个工作区 Memory 系统；如果工作区尚未置于 git 管理下，它还会输出备份提示。

    有关工作区结构和 git 备份（推荐使用私有 GitHub 或 GitLab）的完整指南，请参阅 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)。

  </Accordion>
</AccordionGroup>

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
