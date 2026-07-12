---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置变更
sidebarTitle: Doctor
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-07-12T14:27:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e6be1fa29f2cc0e9832a4c8e5b0ae3dd2e7de43e2466df20f7067ef5ddf0a8
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修复和迁移工具。它可修复过时的配置/状态、检查健康状况，并提供可执行的修复步骤。

## 快速开始

```bash
openclaw doctor
```

### 无界面和自动化模式

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    无需提示即接受默认选项（适用时包括重启/服务/沙箱修复步骤）。

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    无需提示即应用建议的修复（`--repair` 是其别名）。

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    为 CI 或预检自动化运行结构化健康检查。只读：不会进行
    提示、修复、迁移、重启或状态写入。

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    同时应用激进修复（会覆盖自定义监管程序配置）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    无提示运行，仅应用安全迁移（配置规范化 +
    磁盘状态移动）。跳过需要人工确认的重启/服务/沙箱操作。
    检测到旧版状态迁移时，仍会自动执行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    扫描系统服务以查找额外的 Gateway 网关安装（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

若要在写入前审查更改，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 只读 lint 模式

`openclaw doctor --lint` 是适用于自动化场景的
`openclaw doctor --fix` 同类命令。二者共享同一个 Doctor 规则注册表，但
选择和处理规则的方式并不相同：

| 模式                     | 提示      | 写入配置/状态           | 输出               | 用途                         |
| ------------------------ | --------- | ----------------------- | ------------------ | ---------------------------- |
| `openclaw doctor`        | 是        | 否                      | 易读的健康报告     | 人工检查状态                 |
| `openclaw doctor --fix`  | 有时      | 是，遵循修复策略        | 易读的修复日志     | 应用已批准的修复             |
| `openclaw doctor --lint` | 否        | 否                      | 结构化发现         | CI、预检和审查门禁           |

默认的 `doctor --lint` 运行广泛且安全的自动化配置文件：执行
静态、本地且对 CI 或预检输出有用的检查。它会跳过需要主动启用的检查，包括
建议性检查、对环境敏感的检查、依赖实时服务的检查、账号/工作区
清单检查或历史清理检查。若要运行完整的已注册 lint 审计（包括这些需要主动启用的检查），
请使用 `doctor --lint --all`；若要运行目标检查，请使用 `--only <id>`。

`doctor --fix` 不使用 lint 默认配置文件，也不接受
`--all`。它运行 Doctor 的有序修复路径：现代健康检查可以提供
可选的 `repair()` 实现，较旧的区域仍使用其旧版
Doctor 修复流程。部分 lint 发现有意仅用于诊断，因此某项检查
出现在 `--lint --all` 中，并不表示 `--fix` 会修改该区域。
该契约将 `detect()`（报告发现）与 `repair()`（报告
更改/差异/副作用）分离，从而为未来的
`doctor --fix --dry-run` 保留实现路径，而无需将 lint 检查变成变更规划器。

部分内置检查在内部默认禁用，以便继续供
`--all`、`--only` 和 Doctor 修复流程使用，同时不会成为默认
`doctor --lint` 自动化配置文件的一部分。每项发现仍会输出严重级别
（`info`、`warning` 或 `error`）；默认选择并不是严重级别。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 输出字段：

- `ok`：是否有任何发现达到所选严重级别阈值
- `checksRun` / `checksSkipped`：数量（因配置文件、`--only` 或 `--skip` 而跳过）
- `findings`：结构化诊断，包含 `checkId`、`severity`、`message`，以及可选的 `path`、`line`、`column`、`ocPath`、`source`、`target`、`requirement`、`fixHint`

退出码：

| 代码 | 含义                                                     |
| ---- | -------------------------------------------------------- |
| `0`  | 没有达到或超过所选阈值的发现                             |
| `1`  | 一个或多个发现达到所选阈值                               |
| `2`  | 尚未输出发现时命令/运行时即发生故障                       |

标志：

- `--severity-min info|warning|error`（默认值为 `warning`）：同时控制打印哪些内容以及哪些内容会导致非零退出码。
- `--all`：运行每项已注册的 lint 检查，包括默认自动化集合中排除的主动启用检查。
- `--only <id>`（可重复）：仅运行指定检查 ID；未知 ID 会报告为错误发现。
- `--skip <id>`（可重复）：排除某项检查，同时继续运行其余检查。
- `--json`、`--severity-min`、`--all`、`--only` 和 `--skip` 需要与 `--lint` 一起使用；普通的 `openclaw doctor` 和 `--fix` 运行会拒绝这些标志。

## 功能摘要

<AccordionGroup>
  <Accordion title="健康状况、UI 和更新">
    - 可选的 Git 安装预检更新（仅交互模式）。
    - UI 协议新鲜度检查（当协议架构更新时重新构建 Control UI）。
    - 健康检查 + 重启提示。
    - Skills 状态摘要（符合条件/缺失/受阻）和插件状态。

  </Accordion>
  <Accordion title="配置和迁移">
    - 旧版值结构的配置规范化。
    - 将旧版扁平 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>` 的 Talk 配置迁移。
    - 旧版 Chrome 扩展配置和 Chrome MCP 就绪状态的浏览器迁移检查。
    - OpenCode 提供商覆盖警告（`models.providers.opencode` / `opencode-zen` / `opencode-go`）。
    - 旧版 OpenAI Codex 提供商/配置文件迁移（`openai-codex` → `openai`），以及过时 `models.providers.openai-codex` 的遮蔽警告。
    - OpenAI Codex OAuth 配置文件的 OAuth TLS 前提条件检查。
    - 当 `plugins.allow` 受限，但工具策略仍请求通配符或插件自有工具时，发出插件/工具允许列表警告。
    - 旧版磁盘状态迁移（会话/智能体目录/WhatsApp 身份验证）。
    - 旧版插件清单契约键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层投递/有效负载字段、有效负载 `provider`、`notify: true` webhook 回退作业）。
    - 在 `agents.defaults`、`agents.list[]` 和 `models.providers.*`（包括各模型条目）中修复 Codex CLI 运行时固定设置（`agentRuntime.id: "codex-cli"` → `"codex"`）。
    - 启用插件时清理过时的插件配置；当 `plugins.enabled=false` 时，过时的插件引用会作为非活动的隔离配置保留。

  </Accordion>
  <Accordion title="状态和完整性">
    - 会话锁文件检查和过时锁清理。
    - 修复受影响的 2026.4.24 构建所创建的重复提示重写分支会话记录。
    - 检测卡死子智能体的重启恢复墓碑；支持通过 `--fix` 清除过时的已中止恢复标志，避免启动时继续将子智能体视为因重启而中止。
    - 状态完整性和权限检查（会话、记录、状态目录）。
    - 本地运行时检查配置文件权限（chmod 600）。
    - 模型身份验证健康状况：检查 OAuth 到期时间、可刷新即将到期的令牌，并报告身份验证配置文件的冷却/禁用状态。

  </Accordion>
  <Accordion title="Gateway 网关、服务和监管程序">
    - 启用沙箱隔离时修复沙箱镜像。
    - 旧版服务迁移和额外 Gateway 网关检测。
    - Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式下）。
    - Gateway 网关运行时检查（服务已安装但未运行；缓存的 launchd 标签）。
    - 渠道状态警告（通过运行中的 Gateway 网关探测）。
    - 渠道特定的权限检查位于 `openclaw channels capabilities` 下；例如，使用 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 审核 Discord 语音渠道权限。
    - 当 Gateway 网关事件循环健康状况下降且本地 TUI 客户端仍在运行时，执行 WhatsApp 响应性检查；`--fix` 仅停止经过验证的本地 TUI 客户端。
    - 修复主模型、回退模型、图像/视频生成模型、Heartbeat/子智能体/压缩覆盖、Hooks、渠道模型覆盖和会话路由固定设置中的旧版 `openai-codex/*` 模型引用；`--fix` 会将其重写为 `openai/*`，将 `openai-codex:*` 身份验证配置文件/顺序迁移到 `openai:*`，移除过时的会话/整个智能体运行时固定设置，并由修复后的有效路由确定 Codex 是否兼容。
    - 监管程序配置审计（launchd/systemd/schtasks），可选择修复。
    - 清理 Gateway 网关服务在安装或更新期间捕获的 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值所形成的嵌入式代理环境。
    - Gateway 网关运行时最佳实践检查（Node 与 Bun、版本管理器路径）。
    - Gateway 网关端口冲突诊断（默认值为 `18789`）。

  </Accordion>
  <Accordion title="身份验证、安全和配对">
    - 针对开放私信策略的安全警告。
    - 本地令牌模式的 Gateway 网关身份验证检查（不存在令牌来源时提供令牌生成选项；不会覆盖令牌 SecretRef 配置）。
    - 设备配对问题检测（待处理的首次配对请求、待处理的角色/权限范围升级、过时的本地设备令牌缓存偏移，以及已配对记录的身份验证偏移）。

  </Accordion>
  <Accordion title="工作区和 shell">
    - Linux 上的 systemd linger 检查。
    - 工作区引导文件大小检查（上下文文件截断/接近限制警告）。
    - 默认智能体的 Skills 就绪状态检查；报告允许但缺少二进制文件、环境变量、配置或操作系统要求的 Skills，`--fix` 可在 `skills.entries` 中禁用不可用的 Skills。
    - Shell 补全状态检查和自动安装/升级。
    - 记忆搜索嵌入提供商就绪状态检查（本地模型、远程 API key 或 QMD 二进制文件）。
    - 源码安装检查（pnpm 工作区不匹配、缺少 UI 资源、缺少 tsx 二进制文件）。
    - 写入更新后的配置 + 向导元数据。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填和重置

Control UI Dreams 场景为基于事实的梦境工作流提供 **Backfill**、**Reset** 和 **Clear Grounded** 操作。这些操作使用 Gateway 网关的 Doctor 风格 RPC 方法，但**不**属于 `openclaw doctor` CLI 的修复/迁移功能。

| 操作           | 功能                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backfill       | 扫描活动工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行基于事实的 REM 日记流程，并将可逆的回填条目写入 `DREAMS.md`。                                              |
| Reset          | 仅从 `DREAMS.md` 中移除带标记的回填日记条目。                                                                                                                       |
| Clear Grounded | 仅移除历史重放中暂存的、仅基于事实的短期条目，这些条目尚未积累实时召回或每日支持。                                                                                  |

  这些操作都不会自行编辑 `MEMORY.md`、运行完整的 Doctor 迁移，也不会将有依据的候选项暂存到实时短期晋升存储中。要将有依据的历史回放送入常规的深度晋升通道，请改用以下 CLI 流程：

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  这会将有依据的持久候选项暂存到短期 Dreaming 存储中，同时 `DREAMS.md` 仍作为审核界面。

  ## 详细行为和设计原理

  <AccordionGroup>
  <Accordion title="0. 可选更新（git 安装）">
    如果这是 git 检出，并且 Doctor 正在以交互方式运行，它会在运行 Doctor 之前提供更新选项（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 配置规范化">
    Doctor 会将旧版值结构规范化为当前 schema。当前的 Talk 语音配置为 `talk.provider` + `talk.providers.<provider>`，实时语音配置位于 `talk.realtime.*` 下。Doctor 会将旧的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 结构重写到提供商映射中，并将旧版顶层实时选择器（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）重写到 `talk.realtime` 中。

    当 `plugins.allow` 非空，并且工具策略使用通配符或插件自有的工具条目时，Doctor 也会发出警告。`tools.allow: ["*"]` 仅匹配实际加载的插件所提供的工具；它不会绕过排他性的插件允许列表。

  </Accordion>
  <Accordion title="2. 旧版配置键迁移">
    当配置包含具有有效迁移规则的已弃用键时，其他命令会拒绝运行，并要求你运行 `openclaw doctor`。Doctor 会说明发现了哪些旧版键，显示所应用的迁移，并使用更新后的架构重写 `~/.openclaw/openclaw.json`。Gateway 网关启动时会拒绝旧版配置格式，并要求你运行 `openclaw doctor --fix`；它不会在启动时重写 `openclaw.json`。Cron 作业存储迁移也由 `openclaw doctor --fix` 处理。

    <Note>
      Doctor 只会在某个键停用后的大约两个月内保留其自动迁移规则。更早的旧版键（例如最初的
      `routing.queue`、`routing.bindings`、`routing.agents`/`defaultAgentId`、
      `routing.transcribeAudio`、顶层 `agent.*`，或多 Agent 配置形态出现之前的顶层 `identity`）
      不再有迁移路径；现在，使用这些键的配置将无法通过验证，而不会被重写。在 Doctor
      可以继续处理之前，请参照当前配置参考手动修正这些键。
    </Note>

    有效迁移：

    | 旧键                                                                                             | 当前键                                                                        |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                             | `channels.whatsapp.allowFrom`                                                 |
    | `routing.groupChat.requireMention`                                                              | `channels.whatsapp/telegram/imessage.groups."*".requireMention`               |
    | `routing.groupChat.historyLimit`                                                                | `messages.groupChat.historyLimit`                                             |
    | `routing.groupChat.mentionPatterns`                                                             | `messages.groupChat.mentionPatterns`                                          |
    | `channels.telegram.requireMention`                                                              | `channels.telegram.groups."*".requireMention`                                 |
    | `channels.webchat`, `gateway.webchat`                                                           | 已移除（WebChat 已停用）                                                       |
    | `channels.feishu.accounts.<accountId>.botName`                                                  | `channels.feishu.accounts.<accountId>.name`                                   |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours`（以及每账户设置）     | `...threadBindings.idleHours`                                                 |
    | 旧版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`          | `talk.provider` + `talk.providers.<provider>`                                 |
    | 旧版顶层实时 Talk 选择器（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）   | `talk.realtime`                                                               |
    | `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）                            | `messages.tts.providers.<provider>`                                           |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                 | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`    |
    | TTS 说话人字段 `voice`/`voiceName`/`voiceId`                                                    | `speakerVoice`/`speakerVoiceId`                                               |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>`（除 Discord 外的所有渠道）                                          | `...tts.providers.<provider>`                                                 |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>`（包括 Discord 在内的所有渠道）                          | `...voice.tts.providers.<provider>`                                           |
    | `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）   | `plugins.entries.voice-call.config.tts.providers.<provider>`                  |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`              | `provider: "microsoft"` / `...tts.providers.microsoft`                       |
    | `plugins.entries.voice-call.config.provider: "log"`                                             | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                 | `plugins.entries.voice-call.config.fromNumber`                               |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                       | `plugins.entries.voice-call.config.streaming.provider`                       |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                              | `"openai-completions"`（Gateway 网关启动时还会跳过 `api` 为未来或未知枚举值的提供商，而不是以失败关闭方式终止） |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                        | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                           |
    | `browser.profiles.*.driver: "extension"`                                                        | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                         | 已移除（旧版 Chrome 扩展中继设置）                                            |
    | `mcp.servers.*.type`（CLI 原生别名）                                                            | `mcp.servers.*.transport`                                                     |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                         | 已移除（Codex app-server 始终将 Codex 原生工作区工具保留为原生工具）           |
    | `commands.modelsWrite`                                                                          | 已移除（`/models add` 已弃用）                                                |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                    | 已移除（不再将完全匹配的 `NO_REPLY` 重写为可见的后备文本）                    |
    | `agents.defaults/list[].systemPromptOverride`                                                   | 已移除（OpenClaw 负责生成系统提示词）                                         |
    | `agents.defaults/list[].embeddedPi`                                                             | `embeddedAgent`                                                               |
    | `agents.defaults/list[].sandbox.perSession`                                                     | `sandbox.scope`                                                               |
    | `agents.defaults.llm`                                                                           | 已移除（对于较慢的模型/提供商超时，请使用 `models.providers.<id>.timeoutSeconds`，该值须低于智能体/运行超时上限） |
    | 顶层 `memorySearch`                                                                             | `agents.defaults.memorySearch`                                                |
    | `memorySearch.provider: "auto"`                                                                 | `"openai"`                                                                    |
    | `memorySearch.store.path`（任意层级）                                                           | 已移除（记忆索引存储在每个智能体的数据库中）                                  |
    | 顶层 `heartbeat`                                                                                | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                   |
    | `plugins.openai-codex` 策略 ID                                                                 | `plugins.openai`                                                              |
    | `tools.web.x_search.apiKey`                                                                     | `plugins.entries.xai.config.webSearch.apiKey`                                 |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                | 已移除（已弃用）                                                              |
    | `diagnostics.memoryPressureBundle`                                                              | `diagnostics.memoryPressureSnapshot`                                         |

    <Note>
      上述 `plugins.entries.voice-call.config.*` 行由
      Voice Call 插件自身在每次加载配置时规范化，而不是由 `openclaw
      doctor` 处理。该插件还会记录一条启动警告，指向 `openclaw
      doctor --fix`，但 doctor 当前不会为这些键重写
      `openclaw.json`；运行时实际应用此变更的是插件自身的规范化。
    </Note>

    多账户渠道的默认账户指南：

    - 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但未配置 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 会警告后备路由可能会选择非预期的账户。
    - 如果将 `channels.<channel>.defaultAccount` 设置为未知账户 ID，doctor 会发出警告并列出已配置的账户 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供商覆盖">
    如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖来自 `openclaw/plugin-sdk/llm` 的内置 OpenCode 目录。这可能会强制模型使用错误的 API，或将费用清零。Doctor 会发出警告，以便你移除该覆盖并恢复按模型划分的 API 路由和费用。
  </Accordion>
  <Accordion title="2c. 浏览器迁移和 Chrome MCP 就绪状态">
    如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，Doctor 会将其规范化为当前主机本地的 Chrome MCP 附加模型（`browser.profiles.*.driver: "extension"` → `"existing-session"`；移除 `browser.relayBindHost`）。

    当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` 配置文件时，Doctor 还会审查主机本地的 Chrome MCP 路径：

    - 检查对于默认自动连接配置文件，同一主机上是否安装了 Google Chrome
    - 检查检测到的 Chrome 版本，并在其低于 Chrome 144 时发出警告
    - 提醒你在浏览器检查页面中启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 无法代你启用 Chrome 端的设置。主机本地的 Chrome MCP 仍要求 Gateway 网关/节点主机上本地运行基于 Chromium 的 144+ 浏览器、已启用远程调试，并且已在浏览器中批准首次附加同意提示。

    此处的就绪状态仅涵盖本地附加的先决条件。Existing-session 保留当前 Chrome MCP 路由限制；`responsebody`、PDF 导出、下载拦截和批量操作等高级路由仍需要托管浏览器或原始 CDP 配置文件。此检查不适用于 Docker、沙箱、远程浏览器或其他无头流程，这些流程继续使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 先决条件">
    配置 OpenAI Codex OAuth 配置文件后，Doctor 会探测 OpenAI 授权端点，以验证本地 Node/OpenSSL TLS 栈能否验证证书链。如果探测因证书错误而失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书已过期或自签名证书），Doctor 会输出针对具体平台的修复指导。在使用 Homebrew Node 的 macOS 上，修复命令通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关健康，也会运行该探测。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供商覆盖">
    如果你之前在 `models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，它们可能会遮蔽内置的 Codex OAuth 提供商路径。当 Doctor 发现这些旧传输设置与 Codex OAuth 同时存在时，会发出警告，以便你移除或重写过时的传输覆盖，并恢复当前的路由行为。仍然支持自定义代理和仅标头覆盖，且它们不会触发此警告，但这些用户定义的请求路由不符合隐式选择 Codex 的条件。
  </Accordion>
  <Accordion title="2f. Codex 路由修复">
    Doctor 会检查旧版 `openai-codex/*` 模型引用。Native Codex plugins 路由使用规范的 `openai/*` 模型引用，但仅凭前缀永远不会选择 Codex。当运行时策略未设置或为 `auto` 时，只有不存在用户定义请求覆盖且完全匹配官方 HTTPS Platform Responses 或 ChatGPT Responses 的路由才符合条件。请参阅 [OpenAI 隐式智能体运行时](/zh-CN/providers/openai#implicit-agent-runtime)。

    在 `--fix` / `--repair` 模式下，Doctor 会重写受影响的默认智能体和各智能体引用，包括主模型、回退模型、图像/视频生成模型、Heartbeat/子智能体/压缩覆盖、Hooks、渠道模型覆盖，以及过时的持久化会话路由状态：

    - `openai-codex/gpt-*` 会变为 `openai/gpt-*`。
    - 对于已修复的智能体模型引用，Codex 意图会迁移到提供商/模型范围的 `agentRuntime.id: "codex"` 条目。
    - 由于运行时选择以提供商/模型为作用域，过时的整个智能体运行时配置和持久化会话运行时固定项会被移除。
    - 除非已修复的旧版模型引用需要 Codex 路由才能保留旧身份验证路径，否则会保留现有的提供商/模型运行时策略。
    - 会保留现有模型回退列表并重写其中的旧版条目；复制的按模型设置会从旧版键移至规范的 `openai/*` 键。
    - 会修复所有已发现智能体会话存储中的持久化会话 `modelProvider`/`providerOverride`、`model`/`modelOverride`、回退通知和身份验证配置文件固定项。
    - Doctor 还会单独修复过时的 `agentRuntime.id: "codex-cli"` 固定项（一个不同的旧版运行时 ID），将 `agents.defaults`、`agents.list[]` 和 `models.providers.*` 模型条目中的该值改为 `"codex"`。
    - `/codex ...` 表示“从聊天中控制或绑定原生 Codex 对话”。
    - `/acp ...` 或 `runtime: "acp"` 表示“使用外部 ACP/acpx 适配器”。

  </Accordion>
  <Accordion title="2g. 会话路由清理">
    当你将已配置的模型或运行时从 Codex 等插件所有的路由中移出后，Doctor 还会扫描已发现的智能体会话存储，查找过时的自动创建路由状态。

    当所属路由不再配置时，`openclaw doctor --fix` 可以清除自动创建的过时状态，例如 `modelOverrideSource: "auto"` 模型固定项、运行时模型元数据、固定的 harness ID、CLI 会话绑定和自动身份验证配置文件覆盖。显式的用户或旧版会话模型选择会被报告以供人工审查，并保持不变；当不再需要该路由时，请使用 `/model ...`、`/new` 切换它们，或重置会话。

  </Accordion>
  <Accordion title="3. 旧版状态迁移（磁盘布局）">
    Doctor 可以将较旧的磁盘布局迁移到当前结构：

    - 会话存储和转录记录：从 `~/.openclaw/sessions/` 迁移到 `~/.openclaw/agents/<agentId>/sessions/`
    - 智能体目录：从 `~/.openclaw/agent/` 迁移到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 身份验证状态（Baileys）：从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）迁移到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 ID：`default`）

    这些迁移采用尽力而为的方式且具有幂等性；当 Doctor 将任何旧版文件夹作为备份保留时，会发出警告。Gateway 网关/CLI 也会在启动时自动迁移旧版会话和智能体目录，使历史记录、身份验证信息和模型进入按智能体划分的路径，无需手动运行 Doctor。WhatsApp 身份验证有意仅通过 `openclaw doctor` 迁移。Talk 提供商/提供商映射规范化按结构相等性进行比较，因此仅键顺序不同的差异不再触发重复的无操作 `doctor --fix` 更改。

  </Accordion>
  <Accordion title="3a. 旧版插件清单迁移">
    Doctor 会扫描所有已安装插件的清单，查找已弃用的顶层能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。发现后，它会提议将这些键移入 `contracts` 对象，并原地重写清单文件。此迁移具有幂等性；如果 `contracts` 已包含相同值，则会移除旧版键，而不会重复数据。
  </Accordion>
  <Accordion title="3b. 旧版 cron 存储迁移">
    Doctor 还会检查 cron 作业存储（默认为 `~/.openclaw/cron/jobs.json`，覆盖后则为 `cron.store`），查找调度程序出于兼容性仍接受的旧作业结构。

    当前 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 顶层有效负载字段（`message`、`model`、`thinking`、...）→ `payload`
    - 顶层交付字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - 有效负载中的 `provider` 交付别名 → 显式的 `delivery.channel`
    - 旧版 `notify: true` webhook 回退作业 → 设置 `cron.webhook` 时，从中生成显式 webhook 交付；公告作业会保留其聊天交付并获得 `delivery.completionDestination`。未设置 `cron.webhook` 时，会移除无目标作业中无效的顶层 `notify` 标记（保留现有交付，包括公告），因为运行时交付从不读取该标记。

    Gateway 网关还会在加载时清理格式错误的 cron 行，使有效作业继续运行。原始格式错误的行会先复制到活动存储旁的 `jobs-quarantine.json`，再从 `jobs.json` 中移除；Doctor 会报告已隔离的行，以便你手动审查或修复。

    Gateway 网关启动时会规范化运行时投影并忽略顶层 `notify` 标记，但会保留持久化 cron 配置以供 Doctor 修复。未设置 `cron.webhook` 时，Doctor 会移除没有迁移目标的作业中的无效标记（`delivery.mode` 为 none/不存在、webhook 目标不可用，或已有公告/聊天交付），同时保持现有交付不变，因此重复运行 `doctor --fix` 时不会再对同一作业发出警告。如果设置了 `cron.webhook`，但它不是有效的 HTTP(S) URL，Doctor 仍会发出警告并保留该标记，以便你修复 URL。

    在 Linux 上，当用户的 crontab 仍调用旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，Doctor 也会发出警告。当前 OpenClaw 不维护该主机本地脚本；当 cron 无法访问 systemd 用户总线时，该脚本可能会向 `~/.openclaw/logs/whatsapp-health.log` 写入错误的 `Gateway inactive` 消息。使用 `crontab -e` 移除过时的 crontab 条目；使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status` 执行当前的健康检查。

  </Accordion>
  <Accordion title="3c. 会话锁清理">
    Doctor 会扫描每个智能体会话目录，查找会话异常退出后遗留的过时写锁文件。对于找到的每个锁文件，它会报告：路径、PID、PID 是否仍存活、锁的存在时长，以及是否被视为过时（PID 已终止、所有者元数据格式错误、超过 30 分钟，或已证实存活的 PID 属于非 OpenClaw 进程）。在 `--fix` / `--repair` 模式下，它会自动移除所有者已终止、孤立、被回收、旧且格式错误或非 OpenClaw 的锁。仍由存活 OpenClaw 进程拥有的旧锁会被报告但保留，以免 Doctor 中断正在写入的转录记录。
  </Accordion>
  <Accordion title="3d. 会话转录记录分支修复">
    Doctor 会扫描智能体会话 JSONL 文件，查找由 2026.4.24 提示词转录记录重写缺陷造成的重复分支结构：一个包含 OpenClaw 内部运行时上下文、已放弃的用户轮次，以及一个包含相同可见用户提示词的活动同级分支。在 `--fix` / `--repair` 模式下，Doctor 会在每个受影响文件的原文件旁创建备份，并将转录记录重写为活动分支，使 Gateway 网关历史记录和记忆读取器不再看到重复轮次。
  </Accordion>
  <Accordion title="4. 状态完整性检查（会话持久化、路由和安全）">
    状态目录是系统运行的脑干。如果它消失，而你又没有在其他位置保存备份，就会丢失会话、凭据、日志和配置。

    Doctor 会检查：

    - **状态目录缺失**：警告灾难性状态丢失，提示重新创建该目录，并提醒你无法恢复缺失的数据。
    - **状态目录权限**：验证是否可写；提供修复权限的选项（检测到所有者/组不匹配时还会给出 `chown` 提示）。
    - **macOS 云同步状态目录**：当状态目录解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下时发出警告，因为由同步服务支持的路径可能导致 I/O 速度变慢以及锁定/同步竞争。
    - **Linux SD 或 eMMC 状态目录**：当状态目录解析到 `mmcblk*` 挂载源时发出警告，因为由 SD/eMMC 支持的随机 I/O 可能较慢，并会在写入会话和凭据时更快磨损。
    - **Linux 易失性状态目录**：当状态目录解析到 `tmpfs` 或 `ramfs` 时发出警告，因为会话、凭据、配置和 SQLite 状态（包括 WAL/日志边车文件）会在重启后消失。Docker `overlay` 挂载特意不会被标记，因为只要容器仍然存在，其可写层就会在主机重启后持久保留。
    - **会话目录缺失**：必须存在 `sessions/` 和会话存储目录，才能持久保存历史记录并避免 `ENOENT` 崩溃。
    - **转录记录不匹配**：当最近的会话条目缺少转录文件时发出警告。
    - **主会话“单行 JSONL”**：当主转录记录只有一行时进行标记（历史记录未累积）。
    - **多个状态目录**：当不同主目录中存在多个 `~/.openclaw` 文件夹，或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史记录可能分散在不同安装中）。
    - **远程模式提醒**：如果 `gateway.mode=remote`，Doctor 会提醒你在远程主机上运行它（状态存储在那里）。
    - **配置文件权限**：如果 `~/.openclaw/openclaw.json` 对组/所有人可读，则发出警告，并提供将权限收紧为 `600` 的选项。

  </Accordion>
  <Accordion title="5. 模型身份验证健康状况（OAuth 过期）">
    Doctor 会检查身份验证存储中的 OAuth 配置文件，在令牌即将过期/已过期时发出警告，并在安全的情况下刷新令牌。如果 Anthropic OAuth/令牌配置文件已过期，它会建议使用 Anthropic API 密钥或 Anthropic setup-token 路径。仅在交互式运行（TTY）时才会显示刷新提示；`--non-interactive` 会跳过刷新尝试。

    当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、`invalid_grant`，或提供商要求你重新登录），Doctor 会报告需要重新进行身份验证，并输出需要运行的完整 `openclaw models auth login --provider ...` 命令。

    Doctor 还会报告因短暂冷却期（速率限制/超时/身份验证失败）或较长时间禁用（账单/额度失败）而暂时不可用的身份验证配置文件。

    令牌存储在 macOS Keychain 中的旧版 Codex OAuth 配置文件（采用基于文件的边车布局之前的旧版新手引导）只能由 Doctor 修复。从交互式终端运行一次 `openclaw doctor --fix`，将 Keychain 支持的旧版令牌原地迁移到 `auth-profiles.json`；此后，嵌入式轮次（Telegram、cron、子智能体分派）会将它们解析为规范的 OpenAI OAuth 配置文件。

  </Accordion>
  <Accordion title="6. Hooks 模型验证">
    如果设置了 `hooks.gmail.model`，Doctor 会根据目录和允许列表验证模型引用，并在其无法解析或不被允许时发出警告。
  </Accordion>
  <Accordion title="7. 沙箱镜像修复">
    启用沙箱隔离后，Doctor 会检查 Docker 镜像；如果当前镜像缺失，则提供构建镜像或切换到旧版名称的选项。
  </Accordion>
  <Accordion title="7b. 插件安装清理">
    在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下，Doctor 会移除由 OpenClaw 生成的旧版插件依赖暂存状态：陈旧的生成依赖根目录、旧的安装阶段目录、早期内置插件依赖修复代码留下的软件包本地残余，以及可能遮蔽当前内置清单的孤立或已恢复的内置 `@openclaw/*` 插件托管 npm 副本。Doctor 还会将主机 `openclaw` 软件包重新链接到声明了 `peerDependencies.openclaw` 的托管 npm 插件中，以便更新或 npm 修复后，`openclaw/plugin-sdk/*` 等软件包本地运行时导入仍能正常解析。

    当配置引用可下载插件，但本地插件注册表无法找到它们时（实质性的 `plugins.entries`、已配置的渠道/提供商/搜索设置、已配置的 Agent Runtimes），Doctor 还可以重新安装缺失的插件。在软件包更新期间，Doctor 会避免在替换核心软件包时重新安装插件包；如果更新后已配置的插件仍需恢复，请再次运行 `openclaw doctor --fix`。除下述容器镜像启动例外外，Gateway 网关启动和配置重新加载不会执行软件包修复；插件安装仍须通过明确的 Doctor/安装/更新操作完成。

    容器化 Gateway 网关启动有一个范围严格的升级例外：当 `openclaw gateway run` 在新的 OpenClaw 版本上启动时，它会在就绪前运行安全状态迁移和现有的核心更新后插件收敛，然后记录每个版本的检查点。此启动流程可以清理陈旧的内置插件记录、修复本地插件链接、在收敛路径需要时重新安装已配置的插件包，并检查活跃插件载荷。如果启动时无法安全修复，请先使用同一镜像针对相同的已挂载状态/配置运行一次 `openclaw doctor --fix`，然后再正常重启容器。

  </Accordion>
  <Accordion title="8. Gateway 网关服务迁移和清理提示">
    Doctor 会检测旧版 Gateway 网关服务（launchd/systemd/schtasks），并提供移除这些服务以及使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它还可以扫描其他类似 Gateway 网关的服务并输出清理提示。以配置文件命名的 OpenClaw Gateway 网关服务被视为一等服务，不会标记为“额外”服务。

    在 Linux 上，如果缺少用户级 Gateway 网关服务，但存在系统级 OpenClaw Gateway 网关服务，Doctor 不会自动安装第二个用户级服务。请使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 检查，然后移除重复服务；如果 Gateway 网关生命周期由系统监督程序管理，则设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 启动时 Matrix 迁移">
    当 Matrix 渠道账户存在待处理或可执行的旧版状态迁移时，Doctor（在 `--fix` / `--repair` 模式下）会创建迁移前快照，然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。这两个步骤均非致命；错误会被记录，启动会继续。在只读模式下（不带 `--fix` 的 `openclaw doctor`），会完全跳过此检查。
  </Accordion>
  <Accordion title="8c. 设备配对和身份验证漂移">
    Doctor 会在常规健康检查流程中检查设备配对状态，并报告：

    - 待处理的首次配对请求
    - 已配对设备待处理的角色或权限范围升级
    - 设备 ID 仍然匹配，但设备身份不再与已批准记录匹配时的公钥不匹配修复
    - 缺少已批准角色有效令牌的配对记录
    - 权限范围偏离已批准配对基线的配对令牌
    - 当前机器上早于 Gateway 网关侧令牌轮换或包含陈旧权限范围元数据的本地缓存设备令牌条目

    Doctor 不会自动批准配对请求或自动轮换设备令牌。它会输出完整的后续步骤：

    - 使用 `openclaw devices list` 检查待处理请求
    - 使用 `openclaw devices approve <requestId>` 批准确切请求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新令牌
    - 使用 `openclaw devices remove <deviceId>` 移除陈旧记录并重新批准

    这可以区分首次配对、待处理的角色/权限范围升级以及陈旧令牌/设备身份漂移，从而堵住常见的“已经配对但仍提示需要配对”漏洞。

  </Accordion>
  <Accordion title="9. 安全警告">
    当提供商允许不受允许列表限制的私信，或策略配置方式存在危险时，Doctor 会发出警告。
  </Accordion>
  <Accordion title="10. systemd lingering（Linux）">
    如果以 systemd 用户服务运行，Doctor 会确保启用 lingering，使 Gateway 网关在注销后仍保持运行。
  </Accordion>
  <Accordion title="11. 工作区状态（Skills、插件和 TaskFlows）">
    Doctor 会输出默认智能体的工作区状态摘要：

    - **Skills 状态**：统计符合条件、缺少要求和被允许列表阻止的技能数量。
    - **插件状态**：统计已启用/已禁用/出错的插件数量；列出所有错误对应的插件 ID；报告内置插件能力。
    - **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
    - **插件诊断**：呈现插件注册表发出的所有加载时警告或错误。
    - **TaskFlow 恢复**：呈现需要手动检查或取消的可疑托管 TaskFlow。

  </Accordion>
  <Accordion title="11b. 引导文件大小">
    Doctor 会检查工作区引导文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过已配置的字符预算。它会报告各文件的原始字符数与注入字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及总注入字符数占总预算的比例。当文件被截断或接近限制时，Doctor 会输出调整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11c. Shell 补全">
    Doctor 会检查当前 shell（zsh、bash、fish 或 PowerShell）是否已安装 Tab 补全：

    - 如果 shell 配置文件使用缓慢的动态补全模式（`source <(openclaw completion ...)`），Doctor 会将其升级为速度更快的缓存文件变体。
    - 如果配置文件中已配置补全，但缓存文件缺失，Doctor 会自动重新生成缓存。
    - 如果完全未配置补全，Doctor 会提示安装（仅限交互模式；使用 `--non-interactive` 时跳过）。

    运行 `openclaw completion --write-state` 可手动重新生成缓存。

  </Accordion>
  <Accordion title="11d. 陈旧渠道插件清理">
    当 `openclaw doctor --fix` 移除缺失的渠道插件时，还会移除引用该插件的悬空渠道作用域配置：`channels.<id>` 条目、以该渠道为目标的 Heartbeat 目标，以及 `agents.*.models["<channel>/*"]` 覆盖。这可以防止渠道运行时已经不存在，但配置仍要求 Gateway 网关绑定该渠道而导致的 Gateway 网关启动循环。
  </Accordion>
  <Accordion title="12. Gateway 网关身份验证检查（本地令牌）">
    Doctor 会检查本地 Gateway 网关令牌身份验证的就绪状态。

    - 如果令牌模式需要令牌但不存在令牌来源，Doctor 会提供生成令牌的选项。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，Doctor 会发出警告，并且不会用明文覆盖它。
    - 仅当未配置令牌 SecretRef 时，`openclaw doctor --generate-gateway-token` 才会强制生成令牌。

  </Accordion>
  <Accordion title="12b. 感知 SecretRef 的只读修复">
    某些修复流程需要检查已配置的凭据，同时不削弱运行时快速失败行为。

    - `openclaw doctor --fix` 对定向配置修复使用与状态系列命令相同的只读 SecretRef 摘要模型。
    - 示例：Telegram `allowFrom` / `groupAllowFrom` 的 `@username` 修复会尝试使用已配置且可用的 Bot 凭据。
    - 如果 Telegram Bot 令牌通过 SecretRef 配置，但在当前命令路径中不可用，Doctor 会报告该凭据“已配置但不可用”，并跳过自动解析，而不是崩溃或错误地将令牌报告为缺失。

  </Accordion>
  <Accordion title="13. Gateway 网关健康检查和重启">
    Doctor 会运行健康检查，并在 Gateway 网关看起来不健康时提示重启。
  </Accordion>
  <Accordion title="13b. 记忆搜索就绪状态">
    Doctor 会检查为默认智能体配置的记忆搜索嵌入提供商是否就绪。具体行为取决于所配置的后端和提供商：

    - **QMD 后端**：探测 `qmd` 二进制文件是否可用并可启动。如果不可用，则输出修复指南，包括 `npm install -g @tobilu/qmd`（或对应的 Bun 命令）和手动指定二进制文件路径的选项。
    - **显式本地提供商**：检查本地模型文件或可识别的远程/可下载模型 URL。如果缺失，则建议切换到远程提供商。
    - **显式远程提供商**（`openai`、`voyage` 等）：验证环境或身份验证存储中是否存在 API key。如果缺失，则输出可操作的修复提示。
    - **旧版自动提供商**：将 `memorySearch.provider: "auto"` 视为 OpenAI，检查 OpenAI 就绪状态，并由 `doctor --fix` 将其重写为 `provider: "openai"`。

    当存在缓存的 Gateway 网关探测结果（检查时 Gateway 网关处于健康状态）时，Doctor 会将其结果与 CLI 可见的配置交叉比对，并指出任何差异。Doctor 不会在默认路径上发起新的嵌入探测；如需实时检查提供商，请使用深度记忆状态命令。

    使用 `openclaw memory status --deep` 验证运行时的嵌入就绪状态。

  </Accordion>
  <Accordion title="14. 渠道状态警告">
    如果 Gateway 网关健康，Doctor 会运行渠道状态探测，并报告警告及建议的修复方法。
  </Accordion>
  <Accordion title="15. 监督程序配置审计和修复">
    Doctor 会检查已安装的监督程序配置（launchd/systemd/schtasks）是否缺少默认设置或使用了过时的默认设置（例如 systemd 的网络联机依赖项和重启延迟）。发现不匹配时，它会建议更新，并可将服务文件/任务重写为当前默认设置。

    注意：

    - `openclaw doctor` 在重写监督程序配置前会提示确认。
    - `openclaw doctor --yes` 接受默认修复提示。
    - `openclaw doctor --fix` 无需提示即可应用建议的修复（`--repair` 是其别名）。
    - `openclaw doctor --fix --force` 会覆盖自定义监督程序配置。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 使 Doctor 对 Gateway 网关服务生命周期保持只读。它仍会报告服务健康状况并执行非服务修复，但会跳过服务安装/启动/重启/引导、监督程序配置重写和旧版服务清理，因为该生命周期由外部监督程序负责。
    - 在 Linux 上，当匹配的 systemd Gateway 网关单元处于活动状态时，Doctor 不会重写命令/入口点元数据。在重复服务扫描期间，它还会忽略处于非活动状态的非旧版额外 Gateway 网关类单元，以免配套服务文件产生清理噪声。
    - 如果令牌身份验证需要令牌，且 `gateway.auth.token` 由 SecretRef 管理，Doctor 的服务安装/修复会验证 SecretRef，但不会将解析后的明文令牌值持久化到监督程序服务的环境元数据中。
    - Doctor 会检测旧版 LaunchAgent、systemd 或 Windows 计划任务安装中以内联方式嵌入的托管 `.env`/SecretRef 支持的服务环境值，并重写服务元数据，使这些值从运行时源加载，而不是从监督程序定义加载。
    - Doctor 会检测服务命令是否在 `gateway.port` 更改后仍固定使用旧的 `--port`，并将服务元数据重写为当前端口。
    - 如果令牌身份验证需要令牌，而配置的令牌 SecretRef 无法解析，Doctor 会阻止安装/修复路径并提供可操作的指导。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，Doctor 会阻止安装/修复，直到显式设置模式。
    - 对于 Linux 用户级 systemd 单元，Doctor 在比较服务身份验证元数据时，会同时检查 `Environment=` 和 `EnvironmentFile=` 来源中的令牌漂移。
    - 当配置最后由较新版本写入时，Doctor 服务修复会拒绝使用较旧的 OpenClaw 二进制文件重写、停止或重启 Gateway 网关服务。请参阅 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你始终可以通过 `openclaw gateway install --force` 强制执行完整重写。

  </Accordion>
  <Accordion title="16. Gateway 网关运行时和端口诊断">
    Doctor 会检查服务运行时（PID、上次退出状态），并在服务已安装但实际未运行时发出警告。它还会检查 Gateway 网关端口（默认 `18789`）是否存在端口冲突，并报告可能的原因（Gateway 网关已在运行、SSH 隧道）。
  </Accordion>
  <Accordion title="17. Gateway 网关运行时最佳实践">
    当 Gateway 网关服务在 Bun 或由版本管理器管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上运行时，Doctor 会发出警告。WhatsApp 和 Telegram 渠道需要 Node，而版本管理器路径可能在升级后失效，因为服务不会加载你的 shell 初始化配置。如果系统中存在可用的 Node 安装（Homebrew/apt/choco），Doctor 会提示迁移到该安装。

    新安装或修复的 macOS LaunchAgent 使用规范的系统 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是复制交互式 shell 的 PATH。这样可确保 Homebrew 管理的系统二进制文件保持可用，同时 Volta、asdf、fnm、pnpm 和其他版本管理器目录不会改变 Node 子进程解析到的版本。Linux 服务仍会保留显式的环境根目录（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和稳定的用户二进制目录，但仅当推测的版本管理器后备目录实际存在于磁盘上时，才会将其写入服务 PATH。

  </Accordion>
  <Accordion title="18. 配置写入和向导元数据">
    Doctor 会持久化所有配置更改，并写入向导元数据以记录本次 Doctor 运行。
  </Accordion>
  <Accordion title="19. 工作区提示（备份和记忆系统）">
    当缺少工作区记忆系统时，Doctor 会给出建议；如果工作区尚未纳入 git 管理，则会输出备份提示。

    有关工作区结构和 git 备份的完整指南（建议使用私有 GitHub 或 GitLab），请参阅 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)。

  </Accordion>
</AccordionGroup>

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
