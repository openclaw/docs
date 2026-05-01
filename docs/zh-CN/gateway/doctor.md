---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置变更
sidebarTitle: Doctor
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-05-01T07:52:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 928f6854d5721e468e5edc01420fc911652f706ef24e47e8d47461bbe8998214
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

    不提示直接接受默认值（适用时包括重启/服务/沙箱修复步骤）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示直接应用推荐修复（在安全情况下执行修复 + 重启）。

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

    扫描系统服务以查找额外的 Gateway 网关安装（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果你想在写入前查看更改，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 它做什么（摘要）

<AccordionGroup>
  <Accordion title="健康状态、UI 和更新">
    - 针对 git 安装的可选预检更新（仅交互模式）。
    - UI 协议新鲜度检查（当协议 schema 更新时重建 Control UI）。
    - 健康检查 + 重启提示。
    - Skills 状态摘要（符合条件/缺失/被阻止）和插件状态。

  </Accordion>
  <Accordion title="配置和迁移">
    - 针对旧版值的配置规范化。
    - 将旧版扁平 `talk.*` 字段迁移为 `talk.provider` + `talk.providers.<provider>` 的 Talk 配置迁移。
    - 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪状态的浏览器迁移检查。
    - OpenCode provider 覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth 配置文件的 OAuth TLS 前置条件检查。
    - 当 `plugins.allow` 具有限制性但工具策略仍请求通配符或插件自有工具时，发出插件/工具允许列表警告。
    - 旧版磁盘状态迁移（会话/智能体目录/WhatsApp 凭证）。
    - 旧版插件清单合约键迁移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 旧版 cron 存储迁移（`jobId`, `schedule.cron`, 顶层 delivery/payload 字段、payload `provider`、简单 `notify: true` webhook 回退任务）。
    - 旧版智能体运行时策略迁移到 `agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。
    - 启用插件时清理过期插件配置；当 `plugins.enabled=false` 时，过期插件引用会被视为惰性隔离配置并保留。

  </Accordion>
  <Accordion title="状态和完整性">
    - 会话锁文件检查和过期锁清理。
    - 修复受影响的 2026.4.24 构建创建的重复 prompt-rewrite 分支的会话记录。
    - 卡住的子智能体重启恢复 tombstone 检测，支持用 `--fix` 清除过期的已中止恢复标记，避免启动持续将子进程视为重启已中止。
    - 状态完整性和权限检查（会话、记录、状态目录）。
    - 本地运行时的配置文件权限检查（chmod 600）。
    - 模型认证健康：检查 OAuth 过期情况，可刷新即将过期的令牌，并报告认证配置文件的冷却/禁用状态。
    - 额外工作区目录检测（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway 网关、服务和 supervisors">
    - 启用沙箱隔离时进行沙箱镜像修复。
    - 旧版服务迁移和额外 Gateway 网关检测。
    - Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式中）。
    - Gateway 网关运行时检查（服务已安装但未运行；缓存的 launchd 标签）。
    - 渠道状态警告（从正在运行的 Gateway 网关探测）。
    - Supervisor 配置审计（launchd/systemd/schtasks），可选修复。
    - 清理 Gateway 网关服务的嵌入式代理环境，这些服务在安装或更新期间捕获了 shell 的 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值。
    - Gateway 网关运行时最佳实践检查（Node 与 Bun、版本管理器路径）。
    - Gateway 网关端口冲突诊断（默认 `18789`）。

  </Accordion>
  <Accordion title="认证、安全和配对">
    - 针对开放私信策略的安全警告。
    - 针对本地令牌模式的 Gateway 网关认证检查（无令牌来源时提供令牌生成；不会覆盖令牌 SecretRef 配置）。
    - 设备配对问题检测（待处理的首次配对请求、待处理的角色/作用域升级、过期的本地设备令牌缓存漂移，以及已配对记录的认证漂移）。

  </Accordion>
  <Accordion title="工作区和 shell">
    - Linux 上的 systemd linger 检查。
    - 工作区 bootstrap 文件大小检查（针对上下文文件的截断/接近限制警告）。
    - Shell 补全状态检查和自动安装/升级。
    - 记忆搜索嵌入提供商就绪状态检查（本地模型、远程 API key 或 QMD 二进制）。
    - 源码安装检查（pnpm 工作区不匹配、缺少 UI 资产、缺少 tsx 二进制）。
    - 写入更新后的配置 + 向导元数据。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填和重置

Control UI Dreams 场景包含用于 grounded dreaming 工作流的 **回填**、**重置** 和 **清除 Grounded** 操作。这些操作使用 Gateway 网关 doctor 风格的 RPC 方法，但它们**不是** `openclaw doctor` CLI 修复/迁移的一部分。

它们会做什么：

- **回填**会扫描活动工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行 grounded REM 日记流程，并将可逆的回填条目写入 `DREAMS.md`。
- **重置**只会从 `DREAMS.md` 中移除那些已标记的回填日记条目。
- **清除 Grounded**只会移除通过历史回放产生、且尚未积累实时召回或每日支持的暂存 grounded-only 短期条目。

它们本身**不会**做什么：

- 它们不会编辑 `MEMORY.md`
- 它们不会运行完整的 doctor 迁移
- 除非你先显式运行暂存 CLI 路径，否则它们不会自动把 grounded 候选项暂存到实时短期提升存储中

如果你希望 grounded 历史回放影响正常的深度提升通道，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这会将 grounded 持久候选项暂存到短期 dreaming 存储中，同时将 `DREAMS.md` 保持为审查界面。

## 详细行为和理由

<AccordionGroup>
  <Accordion title="0. 可选更新（git 安装）">
    如果这是一个 git checkout 且 doctor 正在交互式运行，它会在运行 doctor 前提示更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 配置规范化">
    如果配置包含旧版值形态（例如没有渠道专属覆盖的 `messages.ackReaction`），doctor 会将它们规范化为当前 schema。

    这包括旧版 Talk 扁平字段。当前公开的 Talk 配置是 `talk.provider` + `talk.providers.<provider>`。Doctor 会把旧的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形态重写进提供商映射。

    当 `plugins.allow` 非空且工具策略使用通配符或插件自有工具条目时，Doctor 也会发出警告。`tools.allow: ["*"]` 只匹配实际加载的插件中的工具；它不会绕过排他性插件允许列表。

  </Accordion>
  <Accordion title="2. 旧版配置键迁移">
    当配置包含已弃用的键时，其他命令会拒绝运行，并要求你运行 `openclaw doctor`。

    Doctor 将会：

    - 说明发现了哪些旧版键。
    - 显示它应用的迁移。
    - 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

    Gateway 网关在启动时检测到旧版配置格式后也会自动运行 doctor 迁移，因此过期配置无需人工干预即可修复。Cron 任务存储迁移由 `openclaw doctor --fix` 处理。

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
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` 和 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 和 `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` 和 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 和 `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 对于带有命名 `accounts`、但仍残留单账号顶层渠道值的渠道，将这些账号作用域的值移动到为该渠道选定的提升账号中（大多数渠道使用 `accounts.default`；Matrix 可以保留现有匹配的命名/默认目标）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；对较慢的提供商/模型超时使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（旧版扩展中继设置）
    - 旧版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 网关启动时也会跳过 `api` 设置为未来或未知枚举值的提供商，而不是封闭失败）

    Doctor 警告还包含针对多账号渠道的账号默认值指导：

    - 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但没有配置 `channels.<channel>.defaultAccount` 或 `accounts.default`，Doctor 会警告备用路由可能选中意外账号。
    - 如果 `channels.<channel>.defaultAccount` 设置为未知账号 ID，Doctor 会警告并列出已配置的账号 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供商覆盖设置">
    如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode 目录。这可能会强制模型使用错误的 API，或将费用归零。Doctor 会发出警告，以便你移除覆盖设置并恢复按模型划分的 API 路由和费用。
  </Accordion>
  <Accordion title="2c. 浏览器迁移和 Chrome MCP 就绪状态">
    如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，Doctor 会将其规范化为当前的主机本地 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 变为 `"existing-session"`
    - `browser.relayBindHost` 会被移除

    当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` 配置文件时，Doctor 还会审计主机本地 Chrome MCP 路径：

    - 检查同一主机上是否安装了 Google Chrome，以用于默认自动连接配置文件
    - 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
    - 提醒你在浏览器检查页面中启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 无法替你启用 Chrome 侧设置。主机本地 Chrome MCP 仍需要：

    - Gateway 网关/节点主机上有基于 Chromium 的 144+ 浏览器
    - 浏览器在本地运行
    - 该浏览器中已启用远程调试
    - 在浏览器中批准首次附加同意提示

    这里的就绪状态只涉及本地附加前置条件。Existing-session 保持当前 Chrome MCP 路由限制；`responsebody`、PDF 导出、下载拦截和批量操作等高级路由仍需要托管浏览器或原始 CDP 配置文件。

    此检查**不**适用于 Docker、沙箱、远程浏览器或其他无头流程。这些流程继续使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置条件">
    配置了 OpenAI Codex OAuth 配置文件时，Doctor 会探测 OpenAI 授权端点，以验证本地 Node/OpenSSL TLS 栈能否校验证书链。如果探测因证书错误失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），Doctor 会打印特定平台的修复指导。在使用 Homebrew Node 的 macOS 上，修复通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关健康，也会运行该探测。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供商覆盖设置">
    如果你之前在 `models.providers.openai-codex` 下添加过旧版 OpenAI 传输设置，它们可能会遮蔽新版会自动使用的内置 Codex OAuth 提供商路径。Doctor 在看到这些旧传输设置与 Codex OAuth 同时存在时会发出警告，以便你移除或重写过时的传输覆盖设置，并恢复内置路由/备用行为。仍支持自定义代理和仅标头覆盖，且不会触发此警告。
  </Accordion>
  <Accordion title="2f. Codex 插件路由警告">
    启用内置 Codex 插件时，Doctor 还会检查 `openai-codex/*` 主模型引用是否仍通过默认 PI runner 解析。当你想通过 PI 使用 Codex OAuth/订阅凭证时，这种组合是有效的，但很容易与原生 Codex app-server harness 混淆。Doctor 会发出警告，并指向显式 app-server 形态：`openai/*` 加 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。

    Doctor 不会自动修复此项，因为两条路由都有效：

    - `openai-codex/*` + PI 表示“通过常规 OpenClaw runner 使用 Codex OAuth/订阅凭证。”
    - `openai/*` + `runtime: "codex"` 表示“通过原生 Codex app-server 运行嵌入式回合。”
    - `/codex ...` 表示“从聊天中控制或绑定原生 Codex 对话。”
    - `/acp ...` 或 `runtime: "acp"` 表示“使用外部 ACP/acpx 适配器。”

    如果出现此警告，请选择你想要的路由并手动编辑配置。当 PI Codex OAuth 是有意设置时，保持该警告不变。

  </Accordion>
  <Accordion title="3. 旧版状态迁移（磁盘布局）">
    Doctor 可以将较旧的磁盘布局迁移到当前结构：

    - 会话存储 + 转录记录：
      - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent 目录：
      - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 凭证状态（Baileys）：
      - 从旧版 `~/.openclaw/credentials/*.json`（不包括 `oauth.json`）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账号 ID：`default`）

    这些迁移是尽力而为且幂等的；当 Doctor 将任何旧版文件夹作为备份保留下来时，会发出警告。Gateway 网关/CLI 也会在启动时自动迁移旧版会话 + Agent 目录，因此历史记录/凭证/模型会落到每个 Agent 的路径中，无需手动运行 Doctor。WhatsApp 凭证有意只通过 `openclaw doctor` 迁移。Talk 提供商/provider-map 规范化现在按结构相等性进行比较，因此仅键顺序不同的 diff 不再触发重复的无操作 `doctor --fix` 更改。

  </Accordion>
  <Accordion title="3a. 旧版插件清单迁移">
    Doctor 会扫描所有已安装的插件清单，查找已弃用的顶层能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到后，它会提示将这些键移动到 `contracts` 对象中，并就地重写清单文件。此迁移是幂等的；如果 `contracts` 键已经有相同的值，则会移除旧版键，而不会复制数据。
  </Accordion>
  <Accordion title="3b. 旧版 cron 存储迁移">
    Doctor 还会检查 cron 任务存储（默认是 `~/.openclaw/cron/jobs.json`，或覆盖后使用 `cron.store`），查找调度器仍为兼容性接受的旧任务形态。

    当前 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 顶层 payload 字段（`message`、`model`、`thinking` 等）→ `payload`
    - 顶层 delivery 字段（`deliver`、`channel`、`to`、`provider` 等）→ `delivery`
    - payload `provider` delivery 别名 → 显式 `delivery.channel`
    - 简单旧版 `notify: true` webhook 备用任务 → 显式 `delivery.mode="webhook"`，并设置 `delivery.to=cron.webhook`

    Doctor 只会在不改变行为的情况下自动迁移 `notify: true` 任务。如果某个任务将旧版 notify 备用行为与现有非 webhook delivery 模式组合使用，Doctor 会发出警告，并将该任务留待手动审查。

  </Accordion>
  <Accordion title="3c. 会话锁清理">
    Doctor 会扫描每个 Agent 会话目录，查找过期写入锁文件，即会话异常退出后留下的文件。对于找到的每个锁文件，它会报告：路径、PID、PID 是否仍存活、锁龄，以及是否被视为过期（PID 已死或超过 30 分钟）。在 `--fix` / `--repair` 模式下，它会自动移除过期锁文件；否则会打印备注，并提示你用 `--fix` 重新运行。
  </Accordion>
  <Accordion title="3d. 会话转录分支修复">
    Doctor 会扫描 Agent 会话 JSONL 文件，查找由 2026.4.24 提示转录重写 bug 创建的重复分支形态：一个包含 OpenClaw 内部运行时上下文的废弃用户回合，以及一个包含相同可见用户提示的活跃同级分支。在 `--fix` / `--repair` 模式下，Doctor 会在原文件旁备份每个受影响文件，并将转录记录重写到活跃分支，使 Gateway 网关历史记录和记忆读取器不再看到重复回合。
  </Accordion>
  <Accordion title="4. 状态完整性检查（会话持久化、路由和安全）">
    状态目录是运行中的中枢。如果它消失，你会丢失会话、凭证、日志和配置（除非你在其他地方有备份）。

    Doctor 会检查：

    - **状态目录缺失**：警告可能发生灾难性状态丢失，提示重新创建目录，并提醒你它无法恢复缺失的数据。
    - **状态目录权限**：验证可写性；提供修复权限选项（并在检测到所有者/组不匹配时输出 `chown` 提示）。
    - **macOS 云同步状态目录**：当状态解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下时发出警告，因为同步支持的路径可能导致 I/O 更慢以及锁定/同步竞争。
    - **Linux SD 或 eMMC 状态目录**：当状态解析到 `mmcblk*` 挂载源时发出警告，因为 SD 或 eMMC 支持的随机 I/O 在写入会话和凭证时可能更慢且磨损更快。
    - **会话目录缺失**：`sessions/` 和会话存储目录是持久化历史记录并避免 `ENOENT` 崩溃所必需的。
    - **转录记录不匹配**：当最近的会话条目缺少转录记录文件时发出警告。
    - **主会话“1 行 JSONL”**：当主转录记录只有一行时标记（历史记录没有累积）。
    - **多个状态目录**：当多个主目录中存在多个 `~/.openclaw` 文件夹，或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史记录可能在多个安装之间拆分）。
    - **远程模式提醒**：如果 `gateway.mode=remote`，Doctor 会提醒你在远程主机上运行它（状态存储在那里）。
    - **配置文件权限**：如果 `~/.openclaw/openclaw.json` 对组/所有人可读，会发出警告并提供收紧到 `600` 的选项。

  </Accordion>
  <Accordion title="5. 模型认证健康状况（OAuth 过期）">
    Doctor 会检查认证存储中的 OAuth 配置文件，在令牌即将过期/已过期时发出警告，并在安全时刷新它们。如果 Anthropic OAuth/令牌配置文件已过期，它会建议使用 Anthropic API key 或 Anthropic 设置令牌路径。刷新提示仅在交互式运行（TTY）时出现；`--non-interactive` 会跳过刷新尝试。

    当 OAuth 刷新永久失败（例如 `refresh_token_reused`、`invalid_grant`，或提供商要求你重新登录）时，Doctor 会报告需要重新认证，并打印要运行的确切 `openclaw models auth login --provider ...` 命令。

    Doctor 还会报告因以下原因暂时不可用的认证配置文件：

    - 短暂冷却（速率限制/超时/认证失败）
    - 较长时间禁用（计费/额度失败）

  </Accordion>
  <Accordion title="6. 钩子模型验证">
    如果设置了 `hooks.gmail.model`，Doctor 会根据目录和允许列表验证模型引用，并在无法解析或被禁止时发出警告。
  </Accordion>
  <Accordion title="7. 沙箱镜像修复">
    启用沙箱隔离后，Doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建或切换到旧版名称的选项。
  </Accordion>
  <Accordion title="7b. 内置插件运行时依赖">
    Doctor 仅验证当前配置中处于活动状态或由其内置清单默认启用的内置插件的运行时依赖，例如 `plugins.entries.discord.enabled: true`、旧版 `channels.discord.enabled: true`、已配置的 `models.providers.*` / 智能体模型引用，或没有提供商所有权的默认启用内置插件。如果缺少任何依赖，Doctor 会报告这些包，并在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下安装它们。外部插件仍然使用 `openclaw plugins install` / `openclaw plugins update`；Doctor 不会为任意插件路径安装依赖。

    在 Doctor 修复期间，内置运行时依赖的 npm 安装会在 TTY 会话中报告 spinner 进度，并在管道/无头输出中定期输出行进度。Gateway 网关和本地 CLI 也可以在导入内置插件前按需修复活动内置插件的运行时依赖。这些安装限定在插件运行时安装根目录内运行，禁用脚本运行，不写入 package lock，并由安装根目录锁保护，确保并发 CLI 或 Gateway 网关启动不会同时修改同一个 `node_modules` 树。当来自被终止的 Docker/容器启动的旧版陈旧锁无法通过其所有者元数据证明当前进程实例且锁文件已陈旧时，会被回收。

  </Accordion>
  <Accordion title="8. Gateway 网关服务迁移和清理提示">
    Doctor 会检测旧版 Gateway 网关服务（launchd/systemd/schtasks），并提供移除它们并使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它还可以扫描额外的 Gateway 网关类服务并打印清理提示。带配置文件名称的 OpenClaw Gateway 网关服务被视为一等服务，不会被标记为“额外”。

    在 Linux 上，如果用户级 Gateway 网关服务缺失但存在系统级 OpenClaw Gateway 网关服务，Doctor 不会自动安装第二个用户级服务。使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 检查，然后移除重复项；或者在系统级 supervisor 拥有 Gateway 网关生命周期时设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 启动 Matrix 迁移">
    当 Matrix 渠道账号存在待处理或可执行的旧版状态迁移时，Doctor（在 `--fix` / `--repair` 模式下）会创建迁移前快照，然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。这两个步骤都不是致命错误；错误会被记录，启动会继续。在只读模式下（不带 `--fix` 的 `openclaw doctor`），此检查会被完全跳过。
  </Accordion>
  <Accordion title="8c. 设备配对和认证漂移">
    Doctor 现在会在常规健康检查中检查设备配对状态。

    它会报告：

    - 待处理的首次配对请求
    - 已配对设备的待处理角色升级
    - 已配对设备的待处理范围升级
    - 设备 id 仍匹配但设备身份不再匹配已批准记录的公钥不匹配修复
    - 缺少已批准角色的活动令牌的配对记录
    - 范围漂移到已批准配对基线之外的配对令牌
    - 当前机器上早于 Gateway 网关侧令牌轮换或携带陈旧范围元数据的本地缓存设备令牌条目

    Doctor 不会自动批准配对请求或自动轮换设备令牌。它会改为打印确切的后续步骤：

    - 使用 `openclaw devices list` 检查待处理请求
    - 使用 `openclaw devices approve <requestId>` 批准确切请求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新令牌
    - 使用 `openclaw devices remove <deviceId>` 移除并重新批准陈旧记录

    这堵住了常见的“已配对但仍收到需要配对提示”漏洞：Doctor 现在会区分首次配对、待处理的角色/范围升级，以及陈旧令牌/设备身份漂移。

  </Accordion>
  <Accordion title="9. 安全警告">
    当提供商对私信开放但没有允许列表，或策略以危险方式配置时，Doctor 会发出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果作为 systemd 用户服务运行，Doctor 会确保已启用 lingering，使 Gateway 网关在登出后仍保持运行。
  </Accordion>
  <Accordion title="11. 工作区状态（Skills、插件和旧版目录）">
    Doctor 会打印默认智能体的工作区状态摘要：

    - **Skills 状态**：统计符合条件、缺少要求以及被允许列表阻止的 Skills。
    - **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录与当前工作区并存时发出警告。
    - **插件状态**：统计已启用/已禁用/出错的插件；列出所有错误的插件 ID；报告捆绑插件能力。
    - **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
    - **插件诊断**：显示插件注册表在加载时输出的任何警告或错误。

  </Accordion>
  <Accordion title="11b. Bootstrap 文件大小">
    Doctor 会检查工作区 bootstrap 文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过配置的字符预算。它会报告每个文件的原始字符数与注入字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及总注入字符数占总预算的比例。当文件被截断或接近限制时，Doctor 会打印调优 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 陈旧渠道插件清理">
    当 `openclaw doctor --fix` 移除缺失的渠道插件时，它还会移除引用该插件的悬空渠道作用域配置：`channels.<id>` 条目、命名该渠道的 Heartbeat 目标，以及 `agents.*.models["<channel>/*"]` 覆盖项。这可以防止渠道运行时已消失但配置仍要求 Gateway 网关绑定到它而导致的 Gateway 网关启动循环。
  </Accordion>
  <Accordion title="11c. Shell 补全">
    Doctor 会检查当前 shell（zsh、bash、fish 或 PowerShell）是否已安装 Tab 补全：

    - 如果 shell 配置文件使用缓慢的动态补全模式（`source <(openclaw completion ...)`），Doctor 会将其升级为更快的缓存文件变体。
    - 如果配置文件中已配置补全但缓存文件缺失，Doctor 会自动重新生成缓存。
    - 如果完全未配置补全，Doctor 会提示安装它（仅交互模式；使用 `--non-interactive` 时跳过）。

    运行 `openclaw completion --write-state` 可手动重新生成缓存。

  </Accordion>
  <Accordion title="12. Gateway 网关认证检查（本地令牌）">
    Doctor 会检查本地 Gateway 网关令牌认证就绪状态。

    - 如果令牌模式需要令牌但没有令牌源，Doctor 会提供生成令牌的选项。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，Doctor 会发出警告，且不会用明文覆盖它。
    - `openclaw doctor --generate-gateway-token` 仅在未配置令牌 SecretRef 时强制生成。

  </Accordion>
  <Accordion title="12b. 支持只读 SecretRef 的修复">
    某些修复流程需要检查已配置的凭证，同时不削弱运行时快速失败行为。

    - `openclaw doctor --fix` 现在使用与状态类命令相同的只读 SecretRef 摘要模型进行目标配置修复。
    - 示例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修复会在可用时尝试使用已配置的 bot 凭证。
    - 如果 Telegram bot 令牌通过 SecretRef 配置但在当前命令路径中不可用，Doctor 会报告该凭证已配置但不可用，并跳过自动解析，而不是崩溃或误报令牌缺失。

  </Accordion>
  <Accordion title="13. Gateway 网关健康检查 + 重启">
    Doctor 会运行健康检查，并在 Gateway 网关看起来不健康时提供重启选项。
  </Accordion>
  <Accordion title="13b. 记忆搜索就绪状态">
    Doctor 会检查默认智能体已配置的记忆搜索嵌入提供商是否就绪。行为取决于已配置的后端和提供商：

    - **QMD 后端**：探测 `qmd` 二进制文件是否可用且可启动。如果不可用，会打印修复指导，包括 npm 包和手动二进制路径选项。
    - **显式本地提供商**：检查本地模型文件或可识别的远程/可下载模型 URL。如果缺失，建议切换到远程提供商。
    - **显式远程提供商**（`openai`、`voyage` 等）：验证环境或认证存储中是否存在 API key。如果缺失，会打印可执行的修复提示。
    - **自动提供商**：先检查本地模型可用性，然后按自动选择顺序尝试每个远程提供商。

    当有缓存的 Gateway 网关探测结果可用时（检查时 Gateway 网关是健康的），Doctor 会将其结果与 CLI 可见的配置交叉核对，并记录任何差异。Doctor 不会在默认路径上发起新的嵌入 ping；当你需要实时提供商检查时，请使用深度记忆 Status 命令。

    使用 `openclaw memory status --deep` 在运行时验证嵌入就绪状态。

  </Accordion>
  <Accordion title="14. 渠道状态警告">
    如果 Gateway 网关健康，Doctor 会运行渠道状态探测，并报告带有建议修复方式的警告。
  </Accordion>
  <Accordion title="15. 监督器配置审计 + 修复">
    Doctor 会检查已安装的监督器配置（launchd/systemd/schtasks）是否缺少默认值或使用了过时默认值（例如 systemd network-online 依赖和重启延迟）。当发现不匹配时，它会建议更新，并可将服务文件/任务重写为当前默认值。

    注意：

    - `openclaw doctor` 会在重写监督器配置前提示。
    - `openclaw doctor --yes` 接受默认修复提示。
    - `openclaw doctor --repair` 会在不提示的情况下应用建议修复。
    - `openclaw doctor --repair --force` 会覆盖自定义监督器配置。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 会让 Doctor 对 Gateway 网关服务生命周期保持只读。它仍会报告服务健康状态并运行非服务修复，但会跳过服务安装/启动/重启/引导、监督器配置重写以及旧版服务清理，因为该生命周期由外部监督器负责。
    - 在 Linux 上，当匹配的 systemd Gateway 网关单元处于活动状态时，Doctor 不会重写命令/入口点元数据。它还会在重复服务扫描期间忽略非活动的非旧版额外 Gateway 网关类似单元，因此配套服务文件不会产生清理噪声。
    - 如果令牌认证需要令牌，并且 `gateway.auth.token` 由 SecretRef 管理，Doctor 服务安装/修复会验证 SecretRef，但不会将解析后的明文令牌值持久化到监督器服务环境元数据中。
    - Doctor 会检测旧版 LaunchAgent、systemd 或 Windows 计划任务安装中内联嵌入的托管 `.env`/SecretRef 后备服务环境值，并重写服务元数据，使这些值从运行时来源加载，而不是从监督器定义加载。
    - Doctor 会检测服务命令是否在 `gateway.port` 更改后仍固定旧的 `--port`，并将服务元数据重写为当前端口。
    - 如果令牌认证需要令牌，而配置的令牌 SecretRef 未解析，Doctor 会阻止安装/修复路径，并提供可操作的指导。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，Doctor 会阻止安装/修复，直到显式设置模式。
    - 对于 Linux 用户 systemd 单元，Doctor 令牌漂移检查现在会在比较服务认证元数据时同时包含 `Environment=` 和 `EnvironmentFile=` 来源。
    - 当配置最后由较新版本写入时，Doctor 服务修复会拒绝使用旧版 OpenClaw 二进制文件重写、停止或重启 Gateway 网关服务。请参阅 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你始终可以通过 `openclaw gateway install --force` 强制完整重写。

  </Accordion>
  <Accordion title="16. Gateway 网关运行时 + 端口诊断">
    Doctor 会检查服务运行时（PID、最后退出状态），并在服务已安装但未实际运行时发出警告。它还会检查 Gateway 网关端口（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已在运行、SSH 隧道）。
  </Accordion>
  <Accordion title="17. Gateway 网关运行时最佳实践">
    当 Gateway 网关服务运行在 Bun 或版本管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上时，Doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，并且版本管理器路径可能在升级后失效，因为服务不会加载你的 shell 初始化。Doctor 会在系统 Node 安装可用时（Homebrew/apt/choco）提供迁移选项。

    新安装或修复的服务会保留显式环境根目录（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和稳定的用户 bin 目录，但推测出的版本管理器回退目录只有在这些目录存在于磁盘上时，才会写入服务 PATH。这会让生成的监督器 PATH 与 Doctor 稍后运行的相同最小 PATH 审计保持一致。

  </Accordion>
  <Accordion title="18. 配置写入 + 向导元数据">
    Doctor 会持久化任何配置更改，并标记向导元数据以记录本次 Doctor 运行。
  </Accordion>
  <Accordion title="19. 工作区提示（备份 + 记忆系统）">
    Doctor 会在缺少工作区记忆系统时提出建议，并在工作区尚未纳入 git 管理时打印备份提示。

    请参阅 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)，获取工作区结构和 git 备份的完整指南（推荐使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
