---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置变更
sidebarTitle: Doctor
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-05-02T11:07:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d306099cda1d7f6079ab94ce8bd4a716b8ccf9ab3637e14743c8a1c83db35ca6
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它会修复过期配置/状态、检查健康状况，并提供可执行的修复步骤。

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

    不提示而接受默认值（包括适用时的重启/服务/沙箱修复步骤）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示而应用推荐修复（在安全情况下执行修复 + 重启）。

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

    不提示运行，并且只应用安全迁移（配置规范化 + 磁盘状态移动）。跳过需要人工确认的重启/服务/沙箱操作。检测到旧版状态迁移时会自动运行。

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

## 它会做什么（摘要）

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - 对 git 安装执行可选的预检更新（仅交互模式）。
    - UI 协议新鲜度检查（当协议 schema 更新时重建控制 UI）。
    - 健康检查 + 重启提示。
    - Skills 状态摘要（eligible/missing/blocked）和插件状态。

  </Accordion>
  <Accordion title="Config and migrations">
    - 对旧版值执行配置规范化。
    - 将 Talk 配置从旧版扁平 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>`。
    - 检查旧版 Chrome 扩展配置的浏览器迁移，以及 Chrome MCP 就绪状态。
    - OpenCode 提供商覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth 配置文件的 OAuth TLS 前置条件检查。
    - 当 `plugins.allow` 有限制但工具策略仍要求通配符或插件自有工具时，给出插件/工具允许列表警告。
    - 旧版磁盘状态迁移（会话/agent 目录/WhatsApp 凭证）。
    - 旧版插件 manifest 合同键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层 delivery/payload 字段、payload `provider`、简单的 `notify: true` webhook 回退任务）。
    - 将旧版 agent 运行时策略迁移到 `agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。
    - 启用插件时清理过期插件配置；当 `plugins.enabled=false` 时，过期插件引用会被视为惰性的隔离配置并保留。

  </Accordion>
  <Accordion title="State and integrity">
    - 检查会话锁文件并清理过期锁。
    - 修复受影响的 2026.4.24 构建创建的重复 prompt-rewrite 分支会话记录。
    - 检测卡住的 subagent 重启恢复 tombstone，并支持通过 `--fix` 清除过期的已中止恢复标记，避免启动时继续将子进程视为重启已中止。
    - 状态完整性和权限检查（会话、转录记录、状态目录）。
    - 本地运行时执行配置文件权限检查（chmod 600）。
    - 模型凭证健康检查：检查 OAuth 过期时间，可以刷新即将过期的令牌，并报告 auth-profile 冷却/禁用状态。
    - 检测额外工作区目录（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - 启用沙箱隔离时修复沙箱镜像。
    - 旧版服务迁移和额外 Gateway 网关检测。
    - Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式下）。
    - Gateway 网关运行时检查（服务已安装但未运行；缓存的 launchd label）。
    - 渠道状态警告（从正在运行的 Gateway 网关探测）。
    - supervisor 配置审计（launchd/systemd/schtasks），可选择修复。
    - 清理 Gateway 网关服务的嵌入式代理环境，这些服务在安装或更新期间捕获了 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值。
    - Gateway 网关运行时最佳实践检查（Node 与 Bun、版本管理器路径）。
    - Gateway 网关端口冲突诊断（默认 `18789`）。

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - 对开放私信策略给出安全警告。
    - 对本地令牌模式执行 Gateway 网关凭证检查（当没有令牌来源时提供令牌生成；不会覆盖令牌 SecretRef 配置）。
    - 检测设备配对问题（待处理的首次配对请求、待处理的角色/范围升级、过期本地 device-token 缓存漂移，以及 paired-record 凭证漂移）。

  </Accordion>
  <Accordion title="Workspace and shell">
    - Linux 上的 systemd linger 检查。
    - 工作区引导文件大小检查（上下文文件截断/接近限制警告）。
    - shell 补全状态检查和自动安装/升级。
    - 记忆搜索 embedding 提供商就绪检查（本地模型、远程 API key 或 QMD 二进制文件）。
    - 源码安装检查（pnpm 工作区不匹配、缺少 UI 资源、缺少 tsx 二进制文件）。
    - 写入更新后的配置 + 向导元数据。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填和重置

控制 UI 的 Dreams 场景包含用于 grounded dreaming 工作流的 **回填**、**重置** 和 **清除 Grounded** 操作。这些操作使用 Gateway 网关 doctor 风格的 RPC 方法，但它们**不**属于 `openclaw doctor` CLI 修复/迁移。

它们会做什么：

- **回填**会扫描活动工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行 grounded REM diary pass，并将可逆回填条目写入 `DREAMS.md`。
- **重置**只会从 `DREAMS.md` 中移除这些已标记的回填 diary 条目。
- **清除 Grounded**只会移除来自历史 replay、且尚未积累实时 recall 或 daily support 的暂存 grounded-only 短期条目。

它们本身**不会**做什么：

- 它们不会编辑 `MEMORY.md`
- 它们不会运行完整的 Doctor 迁移
- 它们不会自动将 grounded candidates 暂存到实时短期 promotion store，除非你先显式运行暂存 CLI 路径

如果你想让 grounded 历史 replay 影响正常的深度 promotion lane，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这样会将 grounded durable candidates 暂存到短期 Dreaming 存储中，同时让 `DREAMS.md` 保持为审核界面。

## 详细行为和设计依据

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    如果这是 git checkout，并且 Doctor 正在交互式运行，它会在运行 Doctor 之前询问是否更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. Config normalization">
    如果配置包含旧版值形状（例如没有渠道特定覆盖的 `messages.ackReaction`），Doctor 会将它们规范化到当前 schema。

    这包括旧版 Talk 扁平字段。当前公开 Talk 配置是 `talk.provider` + `talk.providers.<provider>`。Doctor 会将旧的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形状重写到提供商映射中。

    当 `plugins.allow` 非空且工具策略使用通配符或插件自有工具条目时，Doctor 也会发出警告。`tools.allow: ["*"]` 只匹配实际加载的插件中的工具；它不会绕过排他性的插件允许列表。

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    当配置包含已弃用键时，其他命令会拒绝运行，并要求你运行 `openclaw doctor`。

    Doctor 会：

    - 说明发现了哪些旧版键。
    - 显示它应用的迁移。
    - 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

    Gateway 网关在启动时检测到旧版配置格式时，也会自动运行 Doctor 迁移，因此过期配置无需人工干预即可修复。Cron 任务存储迁移由 `openclaw doctor --fix` 处理。

    当前迁移：

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
    - 对于具有命名 `accounts` 但仍残留单账号顶层渠道值的渠道，将这些账号作用域的值移动到为该渠道选定的提升账号中（多数渠道使用 `accounts.default`；Matrix 可以保留现有匹配的命名/默认目标）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（工具/提权/执行/沙箱/子智能体）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；为较慢的提供商/模型超时使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（旧版扩展中继设置）
    - 旧版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 网关启动时也会跳过 `api` 设置为未来或未知枚举值的提供商，而不是失败关闭）

    Doctor 警告还包括多账号渠道的账号默认值指导：

    - 如果配置了两个或更多 `channels.<channel>.accounts` 条目，却没有配置 `channels.<channel>.defaultAccount` 或 `accounts.default`，Doctor 会警告后备路由可能选中意外账号。
    - 如果 `channels.<channel>.defaultAccount` 设置为未知账号 ID，Doctor 会发出警告并列出已配置的账号 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供商覆盖">
    如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode 目录。这可能会迫使模型使用错误的 API，或将费用清零。Doctor 会发出警告，以便你移除该覆盖并恢复按模型的 API 路由和费用。

  </Accordion>
  <Accordion title="2c. 浏览器迁移和 Chrome MCP 就绪状态">
    如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，Doctor 会将其规范化为当前主机本地的 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 变为 `"existing-session"`
    - `browser.relayBindHost` 会被移除

    当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` 配置文件时，Doctor 还会审计主机本地的 Chrome MCP 路径：

    - 检查默认自动连接配置文件所在的同一主机上是否已安装 Google Chrome
    - 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
    - 提醒你在浏览器检查页面中启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 无法替你启用 Chrome 侧的设置。主机本地 Chrome MCP 仍然需要：

    - Gateway 网关/节点主机上有基于 Chromium 的 144+ 浏览器
    - 浏览器在本地运行
    - 该浏览器已启用远程调试
    - 在浏览器中批准第一次附加同意提示

    这里的就绪状态只涉及本地附加前置条件。Existing-session 会保留当前 Chrome MCP 路由限制；`responsebody`、PDF 导出、下载拦截和批量操作等高级路由仍需要托管浏览器或原始 CDP 配置文件。

    此检查**不**适用于 Docker、沙箱、远程浏览器或其他无头流程。这些流程会继续使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置条件">
    配置 OpenAI Codex OAuth 配置文件后，Doctor 会探测 OpenAI 授权端点，以验证本地 Node/OpenSSL TLS 栈能否验证证书链。如果探测因证书错误而失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），Doctor 会打印平台特定的修复指导。在使用 Homebrew Node 的 macOS 上，修复通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关健康，也会运行该探测。

  </Accordion>
  <Accordion title="2e. Codex OAuth 提供商覆盖">
    如果你以前在 `models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，它们可能会遮蔽较新版本会自动使用的内置 Codex OAuth 提供商路径。当 Doctor 看到这些旧传输设置与 Codex OAuth 同时存在时，会发出警告，以便你移除或重写过期的传输覆盖，并恢复内置路由/后备行为。仍支持自定义代理和仅标头覆盖，并且不会触发此警告。

  </Accordion>
  <Accordion title="2f. Codex 插件路由警告">
    启用内置 Codex 插件时，Doctor 还会检查 `openai-codex/*` 主模型引用是否仍通过默认 PI runner 解析。当你希望通过 PI 使用 Codex OAuth/订阅身份验证时，这种组合是有效的，但它很容易与原生 Codex 应用服务器 harness 混淆。Doctor 会发出警告，并指向明确的应用服务器形态：`openai/*` 加 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。

    Doctor 不会自动修复此项，因为两种路由都有效：

    - `openai-codex/*` + PI 表示“通过普通 OpenClaw runner 使用 Codex OAuth/订阅身份验证”。
    - `openai/*` + `agentRuntime.id: "codex"` 表示“通过原生 Codex 应用服务器运行嵌入式回合”。
    - `/codex ...` 表示“从聊天中控制或绑定原生 Codex 对话”。
    - `/acp ...` 或 `runtime: "acp"` 表示“使用外部 ACP/acpx 适配器”。

    如果出现该警告，请选择你本来想使用的路由并手动编辑配置。当 PI Codex OAuth 是有意配置时，保留该警告不变。

  </Accordion>
  <Accordion title="3. 旧版状态迁移（磁盘布局）">
    Doctor 可以将较旧的磁盘布局迁移到当前结构：

    - 会话存储 + 转录：
      - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - 智能体目录：
      - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 身份验证状态（Baileys）：
      - 从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账号 ID：`default`）

    这些迁移是尽力而为且幂等的；当 Doctor 将任何旧版文件夹作为备份留下时，会发出警告。Gateway 网关/CLI 也会在启动时自动迁移旧版会话和智能体目录，以便历史记录/身份验证/模型进入每智能体路径，而无需手动运行 Doctor。WhatsApp 身份验证有意仅通过 `openclaw doctor` 迁移。现在，对话提供商/提供商映射规范化会按结构相等进行比较，因此仅键顺序不同的差异不再触发重复的空操作 `doctor --fix` 更改。

  </Accordion>
  <Accordion title="3a. 旧版插件清单迁移">
    Doctor 会扫描所有已安装插件清单，查找已弃用的顶层能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到后，它会提供将这些键移动到 `contracts` 对象并就地重写清单文件的操作。此迁移是幂等的；如果 `contracts` 键已经具有相同值，则会移除旧版键，而不会重复数据。

  </Accordion>
  <Accordion title="3b. 旧版 cron 存储迁移">
    Doctor 还会检查 cron 作业存储（默认是 `~/.openclaw/cron/jobs.json`，或覆盖后的 `cron.store`），查找调度器出于兼容性仍接受的旧作业形态。

    当前 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 顶层载荷字段（`message`、`model`、`thinking`、...）→ `payload`
    - 顶层投递字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - 载荷 `provider` 投递别名 → 显式 `delivery.channel`
    - 简单旧版 `notify: true` webhook 后备作业 → 显式 `delivery.mode="webhook"`，并设置 `delivery.to=cron.webhook`

    Doctor 只有在不改变行为的情况下，才会自动迁移 `notify: true` 作业。如果某个作业将旧版通知后备与现有非 webhook 投递模式组合使用，Doctor 会发出警告，并将该作业留待手动审查。

    在 Linux 上，当用户的 crontab 仍调用旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，Doctor 也会发出警告。该主机本地脚本不由当前 OpenClaw 维护，并且当 cron 无法访问 systemd 用户总线时，可能会向 `~/.openclaw/logs/whatsapp-health.log` 写入错误的 `Gateway inactive` 消息。使用 `crontab -e` 移除过期的 crontab 条目；当前健康检查请使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. 会话锁清理">
    Doctor 会扫描每个智能体会话目录，查找陈旧的写入锁文件，即会话异常退出后留下的文件。对于找到的每个锁文件，它会报告：路径、PID、PID 是否仍然存活、锁的年龄，以及它是否被视为陈旧（PID 已死或超过 30 分钟）。在 `--fix` / `--repair` 模式下，它会自动移除陈旧锁文件；否则会打印一条说明，并指示你使用 `--fix` 重新运行。
  </Accordion>
  <Accordion title="3d. 会话转录分支修复">
    Doctor 会扫描智能体会话 JSONL 文件，查找由 2026.4.24 提示词转录重写错误创建的重复分支形态：一个包含 OpenClaw 内部运行时上下文的废弃用户轮次，以及一个包含相同可见用户提示词的活跃同级分支。在 `--fix` / `--repair` 模式下，Doctor 会在原文件旁备份每个受影响文件，并将转录重写到活跃分支，使 Gateway 网关历史记录和记忆读取器不再看到重复轮次。
  </Accordion>
  <Accordion title="4. 状态完整性检查（会话持久化、路由和安全）">
    状态目录是运行层面的核心。如果它消失，你会丢失会话、凭证、日志和配置（除非你在其他地方有备份）。

    Doctor 检查：

    - **状态目录缺失**：警告灾难性状态丢失，提示重新创建目录，并提醒你它无法恢复缺失的数据。
    - **状态目录权限**：验证可写性；提供修复权限选项（在检测到所有者/组不匹配时发出 `chown` 提示）。
    - **macOS 云同步状态目录**：当状态解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下时发出警告，因为同步支持的路径可能导致更慢的 I/O 和锁/同步竞争。
    - **Linux SD 或 eMMC 状态目录**：当状态解析到 `mmcblk*` 挂载源时发出警告，因为 SD 或 eMMC 支持的随机 I/O 在会话和凭证写入下可能更慢且磨损更快。
    - **会话目录缺失**：`sessions/` 和会话存储目录是持久化历史记录并避免 `ENOENT` 崩溃所必需的。
    - **转录不匹配**：当最近的会话条目缺少转录文件时发出警告。
    - **主会话“1 行 JSONL”**：当主转录只有一行时标记（历史记录没有累积）。
    - **多个状态目录**：当多个 `~/.openclaw` 文件夹存在于各个主目录中，或 `OPENCLAW_STATE_DIR` 指向别处时发出警告（历史记录可能在多个安装之间分裂）。
    - **远程模式提醒**：如果 `gateway.mode=remote`，Doctor 会提醒你在远程主机上运行它（状态位于那里）。
    - **配置文件权限**：如果 `~/.openclaw/openclaw.json` 可被组/全局读取，则发出警告，并提供收紧到 `600` 的选项。

  </Accordion>
  <Accordion title="5. 模型认证健康（OAuth 过期）">
    Doctor 会检查认证存储中的 OAuth 配置文件，在令牌即将过期/已过期时发出警告，并在安全时刷新它们。如果 Anthropic OAuth/令牌配置文件已陈旧，它会建议使用 Anthropic API key 或 Anthropic 设置令牌路径。刷新提示只会在交互式运行（TTY）时出现；`--non-interactive` 会跳过刷新尝试。

    当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、`invalid_grant`，或提供商要求你重新登录），Doctor 会报告需要重新认证，并打印要运行的确切 `openclaw models auth login --provider ...` 命令。

    Doctor 还会报告因以下原因暂时不可用的认证配置文件：

    - 短冷却时间（速率限制/超时/认证失败）
    - 较长禁用时间（账单/额度失败）

  </Accordion>
  <Accordion title="6. 钩子模型验证">
    如果设置了 `hooks.gmail.model`，Doctor 会根据目录和允许列表验证模型引用，并在它无法解析或被禁止时发出警告。
  </Accordion>
  <Accordion title="7. 沙箱镜像修复">
    启用沙箱隔离时，Doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建或切换到旧名称的选项。
  </Accordion>
  <Accordion title="7b. 插件安装清理">
    Doctor 会在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下移除旧版 OpenClaw 生成的插件依赖暂存状态。这涵盖陈旧的生成依赖根目录、旧安装阶段目录，以及早期内置插件依赖修复代码留下的包本地残留。

    当配置引用了可下载插件但本地插件注册表找不到它们时，Doctor 也可以重新安装已配置的可下载插件。Gateway 网关启动和配置重载不会运行包管理器；插件安装仍然是显式的 Doctor/安装/更新工作。

  </Accordion>
  <Accordion title="8. Gateway 网关服务迁移和清理提示">
    Doctor 会检测旧版 Gateway 网关服务（launchd/systemd/schtasks），并提供移除它们以及使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它还可以扫描额外的类似 Gateway 网关服务并打印清理提示。带配置文件名称的 OpenClaw Gateway 网关服务被视为一等服务，不会被标记为“额外”。

    在 Linux 上，如果用户级 Gateway 网关服务缺失但存在系统级 OpenClaw Gateway 网关服务，Doctor 不会自动安装第二个用户级服务。使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 检查，然后移除重复项，或在系统监督器拥有 Gateway 网关生命周期时设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 启动 Matrix 迁移">
    当 Matrix 渠道账号有待处理或可操作的旧版状态迁移时，Doctor（在 `--fix` / `--repair` 模式下）会创建迁移前快照，然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。这两个步骤都不是致命的；错误会被记录，启动会继续。在只读模式（不带 `--fix` 的 `openclaw doctor`）下，此检查会被完全跳过。
  </Accordion>
  <Accordion title="8c. 设备配对和认证漂移">
    Doctor 现在会在常规健康检查中检查设备配对状态。

    它会报告：

    - 待处理的首次配对请求
    - 已配对设备的待处理角色升级
    - 已配对设备的待处理作用域升级
    - 设备 ID 仍然匹配但设备身份不再匹配已批准记录的公钥不匹配修复
    - 已配对记录缺少已批准角色的活跃令牌
    - 作用域漂移到已批准配对基线之外的已配对令牌
    - 当前机器的本地缓存设备令牌条目早于 Gateway 网关侧令牌轮换，或携带陈旧作用域元数据

    Doctor 不会自动批准配对请求，也不会自动轮换设备令牌。它会改为打印确切的下一步：

    - 使用 `openclaw devices list` 检查待处理请求
    - 使用 `openclaw devices approve <requestId>` 批准确切请求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新令牌
    - 使用 `openclaw devices remove <deviceId>` 移除并重新批准陈旧记录

    这弥补了常见的“已经配对但仍然收到需要配对提示”的缺口：Doctor 现在会区分首次配对、待处理的角色/作用域升级，以及陈旧的令牌/设备身份漂移。

  </Accordion>
  <Accordion title="9. 安全警告">
    当提供商在没有允许列表的情况下对私信开放，或策略以危险方式配置时，Doctor 会发出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果作为 systemd 用户服务运行，Doctor 会确保已启用 linger，使 Gateway 网关在登出后仍保持运行。
  </Accordion>
  <Accordion title="11. 工作区状态（Skills、插件和旧版目录）">
    Doctor 会打印默认智能体的工作区状态摘要：

    - **Skills 状态**：统计符合条件、缺少要求和被允许列表阻止的 Skills。
    - **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录与当前工作区并存时发出警告。
    - **插件状态**：统计已启用/已禁用/出错的插件；列出任何错误的插件 ID；报告捆绑插件能力。
    - **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
    - **插件诊断**：呈现插件注册表在加载时发出的任何警告或错误。

  </Accordion>
  <Accordion title="11b. 引导文件大小">
    Doctor 会检查工作区引导文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过配置的字符预算。它会报告每个文件的原始字符数与注入字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及总注入字符数占总预算的比例。当文件被截断或接近限制时，Doctor 会打印用于调整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 陈旧渠道插件清理">
    当 `openclaw doctor --fix` 移除缺失的渠道插件时，它还会移除引用该插件的悬挂渠道作用域配置：`channels.<id>` 条目、命名该渠道的 Heartbeat 目标，以及 `agents.*.models["<channel>/*"]` 覆盖项。这会防止渠道运行时已消失但配置仍要求 Gateway 网关绑定到它而导致的 Gateway 网关启动循环。
  </Accordion>
  <Accordion title="11c. Shell 补全">
    Doctor 会检查当前 Shell（zsh、bash、fish 或 PowerShell）是否安装了 Tab 补全：

    - 如果 Shell 配置文件使用较慢的动态补全模式（`source <(openclaw completion ...)`），Doctor 会将其升级为更快的缓存文件变体。
    - 如果补全已在配置文件中配置但缓存文件缺失，Doctor 会自动重新生成缓存。
    - 如果完全没有配置补全，Doctor 会提示安装它（仅交互模式；使用 `--non-interactive` 时跳过）。

    运行 `openclaw completion --write-state` 可手动重新生成缓存。

  </Accordion>
  <Accordion title="12. Gateway 网关认证检查（本地令牌）">
    Doctor 会检查本地 Gateway 网关令牌认证就绪状态。

    - 如果令牌模式需要令牌但不存在令牌来源，Doctor 会提供生成一个令牌的选项。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，Doctor 会发出警告，并且不会用明文覆盖它。
    - `openclaw doctor --generate-gateway-token` 只会在未配置令牌 SecretRef 时强制生成。

  </Accordion>
  <Accordion title="12b. 感知只读 SecretRef 的修复">
    某些修复流程需要检查已配置的凭证，同时不削弱运行时快速失败行为。

    - `openclaw doctor --fix` 现在会使用与 Status 系列命令相同的只读 SecretRef 摘要模型来进行有针对性的配置修复。
    - 示例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修复会在可用时尝试使用已配置的机器人凭证。
    - 如果 Telegram 机器人令牌通过 SecretRef 配置，但在当前命令路径中不可用，Doctor 会报告凭证已配置但不可用，并跳过自动解析，而不是崩溃或误报令牌缺失。

  </Accordion>
  <Accordion title="13. Gateway 网关健康检查 + 重启">
    Doctor 会运行健康检查，并在 Gateway 网关看起来不健康时提供重启选项。
  </Accordion>
  <Accordion title="13b. 记忆搜索就绪状态">
    Doctor 会检查已配置的记忆搜索嵌入提供商是否已为默认智能体准备就绪。行为取决于已配置的后端和提供商：

    - **QMD 后端**：探测 `qmd` 二进制文件是否可用且可启动。如果不可用，会打印修复指导，包括 npm 包和手动二进制路径选项。
    - **显式本地提供商**：检查本地模型文件或可识别的远程/可下载模型 URL。如果缺失，建议切换到远程提供商。
    - **显式远程提供商**（`openai`、`voyage` 等）：验证环境或凭证存储中是否存在 API key。如果缺失，会打印可操作的修复提示。
    - **自动提供商**：先检查本地模型可用性，然后按自动选择顺序尝试每个远程提供商。

    当缓存的 Gateway 网关探测结果可用时（检查时 Gateway 网关健康），Doctor 会将该结果与 CLI 可见配置交叉比对，并指出任何差异。Doctor 不会在默认路径上启动新的嵌入 ping；如果你想进行实时提供商检查，请使用深度记忆 Status 命令。

    使用 `openclaw memory status --deep` 在运行时验证嵌入就绪状态。

  </Accordion>
  <Accordion title="14. 渠道 Status 警告">
    如果 Gateway 网关健康，Doctor 会运行渠道 Status 探测，并报告警告和建议的修复方法。
  </Accordion>
  <Accordion title="15. Supervisor 配置审计 + 修复">
    Doctor 会检查已安装的 supervisor 配置（launchd/systemd/schtasks），查找缺失或过时的默认值（例如 systemd network-online 依赖和重启延迟）。发现不匹配时，它会建议更新，并可以将服务文件/任务重写为当前默认值。

    注意：

    - `openclaw doctor` 会在重写 supervisor 配置前提示。
    - `openclaw doctor --yes` 接受默认修复提示。
    - `openclaw doctor --repair` 无提示地应用建议的修复。
    - `openclaw doctor --repair --force` 覆盖自定义 supervisor 配置。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 会让 Doctor 对 Gateway 网关服务生命周期保持只读。它仍会报告服务健康状态并运行非服务修复，但会跳过服务安装/启动/重启/bootstrap、supervisor 配置重写和旧版服务清理，因为外部 supervisor 拥有该生命周期。
    - 在 Linux 上，当匹配的 systemd Gateway 网关单元处于活动状态时，Doctor 不会重写命令/入口点元数据。它还会在重复服务扫描期间忽略非活动的非旧版额外类 Gateway 网关单元，这样配套服务文件就不会产生清理噪声。
    - 如果令牌认证需要令牌且 `gateway.auth.token` 由 SecretRef 管理，Doctor 服务安装/修复会验证 SecretRef，但不会将解析后的明文令牌值持久化到 supervisor 服务环境元数据中。
    - Doctor 会检测旧版 LaunchAgent、systemd 或 Windows Scheduled Task 安装以内联方式嵌入的托管 `.env`/SecretRef 支持的服务环境值，并重写服务元数据，让这些值从运行时来源加载，而不是从 supervisor 定义加载。
    - Doctor 会检测服务命令是否在 `gateway.port` 变更后仍固定旧的 `--port`，并将服务元数据重写为当前端口。
    - 如果令牌认证需要令牌且配置的令牌 SecretRef 未解析，Doctor 会阻止安装/修复路径，并给出可操作的指导。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，Doctor 会阻止安装/修复，直到显式设置模式。
    - 对于 Linux user-systemd 单元，Doctor 令牌漂移检查现在会在比较服务认证元数据时同时包含 `Environment=` 和 `EnvironmentFile=` 来源。
    - 当配置最后由较新版本写入时，Doctor 服务修复会拒绝用较旧的 OpenClaw 二进制文件重写、停止或重启 Gateway 网关服务。参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你始终可以通过 `openclaw gateway install --force` 强制完整重写。

  </Accordion>
  <Accordion title="16. Gateway 网关运行时 + 端口诊断">
    Doctor 会检查服务运行时（PID、上次退出状态），并在服务已安装但实际未运行时发出警告。它还会检查 Gateway 网关端口（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已运行、SSH 隧道）。
  </Accordion>
  <Accordion title="17. Gateway 网关运行时最佳实践">
    当 Gateway 网关服务运行在 Bun 或版本管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上时，Doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，而版本管理器路径可能在升级后失效，因为服务不会加载你的 shell init。Doctor 会在可用时提供迁移到系统 Node 安装的选项（Homebrew/apt/choco）。

    新安装或修复的 macOS LaunchAgent 会使用规范的系统 PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是复制交互式 shell PATH，因此 Volta、asdf、fnm、pnpm 和其他版本管理器目录不会改变 Node 子进程解析到的内容。Linux 服务仍会保留显式环境根目录（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和稳定的用户 bin 目录，但推测出的版本管理器回退目录只有在磁盘上存在时才会写入服务 PATH。

  </Accordion>
  <Accordion title="18. 配置写入 + 向导元数据">
    Doctor 会持久化任何配置变更，并标记向导元数据以记录 Doctor 运行。
  </Accordion>
  <Accordion title="19. 工作区提示（备份 + 记忆系统）">
    当缺少工作区记忆系统时，Doctor 会建议添加；如果工作区尚未纳入 git，它会打印备份提示。

    有关工作区结构和 git 备份的完整指南，请参阅 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)（建议使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
