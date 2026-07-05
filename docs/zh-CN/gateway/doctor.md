---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置变更
sidebarTitle: Doctor
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-07-05T11:18:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f949b29dcede364149aead58b4117f1e0f16461de155061c0697abd823b95733
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修复和迁移工具。它会修复过期的配置/状态，检查健康状况，并提供可执行的修复步骤。

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
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    不提示直接应用推荐修复（`--repair` 是别名）。

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    为 CI 或预检自动化运行结构化健康检查。只读：不会
    提示、修复、迁移、重启或写入状态。

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

    无提示运行，仅应用安全迁移（配置规范化 +
    磁盘状态移动）。跳过需要人工
    确认的重启/服务/沙箱操作。检测到旧版状态迁移时仍会自动运行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    扫描系统服务以查找额外的 Gateway 网关安装（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

要在写入前查看更改，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 只读 lint 模式

`openclaw doctor --lint` 是适合自动化的 `openclaw doctor --fix` 同级命令。两者运行相同的健康检查；只有姿态不同：

| 模式                     | 提示   | 写入配置/状态     | 输出                 | 用途                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | 是       | 否                      | 友好的健康报告 | 人工检查状态         |
| `openclaw doctor --fix`  | 有时 | 是，遵循修复策略 | 友好的修复日志    | 应用已批准的修复       |
| `openclaw doctor --lint` | 否        | 否                      | 结构化发现    | CI、预检和审核门禁 |

健康检查可以提供可选的 `repair()` 实现；`doctor --fix` 会在存在时应用它，否则回退到旧版 Doctor 修复流程。该契约将 `detect()`（报告发现）与 `repair()`（报告更改/diff/副作用）分离，从而为未来的 `doctor --fix --dry-run` 保留路径，而不会把 lint 检查变成变更规划器。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 输出字段：

- `ok`：是否有任何发现达到所选严重性阈值
- `checksRun` / `checksSkipped`：计数（按配置文件、`--only` 或 `--skip` 跳过）
- `findings`：结构化诊断，包含 `checkId`、`severity`、`message`，以及可选的 `path`、`line`、`column`、`ocPath`、`source`、`target`、`requirement`、`fixHint`

退出代码：

| 代码 | 含义                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | 没有达到或超过所选阈值的发现           |
| `1`  | 一个或多个发现达到所选阈值          |
| `2`  | 在能够输出发现之前发生命令/运行时失败 |

标志：

- `--severity-min info|warning|error`（默认 `warning`）：同时控制打印内容和导致非零退出的条件。
- `--all`：运行每个已注册检查，包括默认自动化集合中排除的选择加入检查。
- `--only <id>`（可重复）：仅运行指定的检查 ID；未知 ID 会报告为错误发现。
- `--skip <id>`（可重复）：排除某个检查，同时保持其余运行处于活动状态。
- `--json`、`--severity-min`、`--all`、`--only` 和 `--skip` 需要 `--lint`；普通 `openclaw doctor` 和 `--fix` 运行会拒绝它们。

## 它做什么（摘要）

<AccordionGroup>
  <Accordion title="健康、UI 和更新">
    - git 安装的可选预检更新（仅交互式）。
    - UI 协议新鲜度检查（当协议 schema 更新时重建 Control UI）。
    - 健康检查 + 重启提示。
    - Skills 状态摘要（符合条件/缺失/被阻止）和插件状态。

  </Accordion>
  <Accordion title="配置和迁移">
    - 针对旧版值形状的配置规范化。
    - Talk 配置迁移：从旧版扁平 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>`。
    - 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪性的浏览器迁移检查。
    - OpenCode 提供商覆盖警告（`models.providers.opencode` / `opencode-zen` / `opencode-go`）。
    - 旧版 OpenAI Codex 提供商/配置文件迁移（`openai-codex` → `openai`），以及过期 `models.providers.openai-codex` 的遮蔽警告。
    - OpenAI Codex OAuth 配置文件的 OAuth TLS 前置条件检查。
    - 当 `plugins.allow` 受限但工具策略仍要求通配符或插件拥有的工具时，发出插件/工具 allowlist 警告。
    - 旧版磁盘状态迁移（会话/Agent 目录/WhatsApp 凭证）。
    - 旧版插件清单契约键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层 delivery/payload 字段、payload `provider`、`notify: true` webhook 回退任务）。
    - Codex CLI 运行时固定值修复（`agentRuntime.id: "codex-cli"` → `"codex"`），覆盖 `agents.defaults`、`agents.list[]` 和 `models.providers.*`（包括逐模型条目）。
    - 插件启用时清理过期插件配置；当 `plugins.enabled=false` 时，过期插件引用会作为惰性隔离配置保留。

  </Accordion>
  <Accordion title="状态和完整性">
    - 会话锁文件检查和过期锁清理。
    - 修复受影响 2026.4.24 构建创建的重复提示重写分支的会话转录。
    - 检测卡住的子智能体重启恢复 tombstone，并通过 `--fix` 支持清除过期的已中止恢复标志，避免启动时继续将子项视为重启中止。
    - 状态完整性和权限检查（会话、转录、状态目录）。
    - 本地运行时的配置文件权限检查（chmod 600）。
    - 模型凭证健康：检查 OAuth 过期情况，可以刷新即将过期的令牌，并报告凭证配置文件的冷却/禁用状态。

  </Accordion>
  <Accordion title="Gateway 网关、服务和 supervisor">
    - 启用沙箱隔离时修复沙箱镜像。
    - 旧版服务迁移和额外 Gateway 网关检测。
    - Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式中）。
    - Gateway 网关运行时检查（服务已安装但未运行；缓存的 launchd 标签）。
    - 渠道状态警告（从正在运行的 Gateway 网关探测）。
    - 渠道特定权限检查位于 `openclaw channels capabilities` 下；例如，Discord 语音渠道权限通过 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 审计。
    - 当本地 TUI 客户端仍在运行且 Gateway 网关事件循环健康下降时，检查 WhatsApp 响应性；`--fix` 只会停止已验证的本地 TUI 客户端。
    - 修复主模型、回退、图像/视频生成模型、heartbeat/子智能体/压缩覆盖、Hooks、渠道模型覆盖和会话路由固定中的旧版 `openai-codex/*` 模型引用；`--fix` 会将它们重写为 `openai/*`，将 `openai-codex:*` 凭证配置文件/顺序迁移为 `openai:*`，移除过期的会话/整 Agent 运行时固定值，并在默认 Codex harness 上保留规范的 OpenAI Agent 引用。
    - supervisor 配置审计（launchd/systemd/schtasks），可选修复。
    - 清理安装或更新期间捕获 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值的 Gateway 网关服务中的嵌入式代理环境。
    - Gateway 网关运行时最佳实践检查（Node 与 Bun、版本管理器路径）。
    - Gateway 网关端口冲突诊断（默认 `18789`）。

  </Accordion>
  <Accordion title="凭证、安全和配对">
    - 开放私信策略的安全警告。
    - local token 模式的 Gateway 网关凭证检查（当不存在令牌来源时提供令牌生成；不会覆盖令牌 SecretRef 配置）。
    - 设备配对问题检测（待处理的首次配对请求、待处理的角色/权限范围升级、过期本地设备令牌缓存漂移，以及已配对记录的凭证漂移）。

  </Accordion>
  <Accordion title="工作区和 shell">
    - Linux 上的 systemd linger 检查。
    - 工作区 bootstrap 文件大小检查（上下文文件截断/接近限制警告）。
    - 默认 Agent 的 Skills 就绪检查；报告因缺少二进制文件、环境变量、配置或 OS 要求而不可用的允许技能，并且 `--fix` 可以在 `skills.entries` 中禁用不可用技能。
    - shell 补全状态检查和自动安装/升级。
    - 记忆搜索 embedding 提供商就绪检查（本地模型、远程 API key 或 QMD 二进制文件）。
    - 源码安装检查（pnpm 工作区不匹配、缺少 UI 资源、缺少 tsx 二进制文件）。
    - 写入更新后的配置 + 向导元数据。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填和重置

Control UI Dreams 场景包含面向 grounded dreaming 工作流的 **回填**、**重置** 和 **清除 Grounded** 操作。这些操作使用 Gateway 网关 Doctor 风格的 RPC 方法，但**不**属于 `openclaw doctor` CLI 修复/迁移的一部分。

| 操作         | 作用                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 回填       | 扫描活动工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行 grounded REM 日记 pass，并将可逆的回填条目写入 `DREAMS.md`。 |
| 重置          | 仅从 `DREAMS.md` 中移除标记的回填日记条目。                                                                                                  |
| 清除 Grounded | 仅移除来自历史回放、尚未累积实时召回或每日支持的暂存 grounded-only 短期条目。                           |

这些操作都不会编辑 `MEMORY.md`、运行完整 Doctor 迁移，或自行将 grounded 候选项暂存到实时短期提升存储中。要将 grounded 历史回放送入正常的深度提升通道，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这会将 grounded 持久候选项暂存到短期 dreaming 存储中，同时让 `DREAMS.md` 保持为审核界面。

## 详细行为和理由

  <AccordionGroup>
  <Accordion title="0. 可选更新（git 安装）">
    如果这是一个 git checkout 且 Doctor 正在交互式运行，它会在运行 Doctor 前提供更新（fetch/rebase/build）选项。
  </Accordion>
  <Accordion title="1. 配置规范化">
    Doctor 会把旧版值形状规范化为当前 schema。当前 Talk 语音配置是 `talk.provider` + `talk.providers.<provider>`，实时语音配置位于 `talk.realtime.*` 下。Doctor 会把旧的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形状重写到提供商映射中，并把旧版顶层实时选择器（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）重写到 `talk.realtime`。

    当 `plugins.allow` 非空且工具策略使用通配符或插件拥有的工具条目时，Doctor 也会警告。`tools.allow: ["*"]` 只匹配实际加载的插件中的工具；它不会绕过独占插件允许列表。

  </Accordion>
  <Accordion title="2. 旧版配置键迁移">
    当配置包含带有有效迁移的弃用键时，其他命令会拒绝运行，并要求你运行 `openclaw doctor`。Doctor 会说明发现了哪些旧版键，展示它应用的迁移，并使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。Gateway 网关启动会拒绝旧版配置格式，并要求你运行 `openclaw doctor --fix`；它不会在启动时重写 `openclaw.json`。Cron 作业存储迁移也由 `openclaw doctor --fix` 处理。

    <Note>
      Doctor 只会在某个键退役后大约两个月内携带自动迁移。
      更旧的旧版键（例如最初的
      `routing.queue`、`routing.bindings`、`routing.agents`/`defaultAgentId`、
      `routing.transcribeAudio`、顶层 `agent.*`，或来自多 Agent 前配置形状的顶层 `identity`）
      不再有迁移路径；现在使用它们的配置会验证失败，而不是被重写。
      在 Doctor 可以继续之前，请根据当前配置参考手动修复这些键。
    </Note>

    有效迁移：

    | 旧版键                                                                                        | 当前键                                                                       |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | 已移除（WebChat 已退役）                                                     |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours`（以及按账号配置）      | `...threadBindings.idleHours`                                               |
    | 旧版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`          | `talk.provider` + `talk.providers.<provider>`                               |
    | 旧版顶层实时 Talk 选择器（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`） | `talk.realtime`                                                              |
    | `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）                            | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | TTS 说话人字段 `voice`/`voiceName`/`voiceId`                                                     | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>`（除 Discord 外的所有渠道）                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>`（所有渠道，包括 Discord）                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）    | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"`（Gateway 网关启动也会跳过 `api` 为未来/未知枚举值的提供商，而不是失败关闭） |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | 已移除（旧版 Chrome 扩展中继设置）                                           |
    | `mcp.servers.*.type`（CLI 原生别名）                                                             | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | 已移除（Codex app-server 始终保持 Codex 原生工作区工具为原生）              |
    | `commands.modelsWrite`                                                                           | 已移除（`/models add` 已弃用）                                               |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | 已移除（精确的 `NO_REPLY` 不再被重写为可见的回退文本）                      |
    | `agents.defaults/list[].systemPromptOverride`                                                    | 已移除（OpenClaw 拥有生成的系统提示）                                       |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | 已移除（对慢模型/提供商超时使用 `models.providers.<id>.timeoutSeconds`，并保持低于 Agent/运行超时上限） |
    | 顶层 `memorySearch`                                                                              | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path`（任何层级）                                                            | 已移除（记忆索引位于每个 Agent 数据库中）                                  |
    | 顶层 `heartbeat`                                                                                 | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex` 策略 ID                                                                   | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | 已移除（已弃用）                                                            |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      上面的 `plugins.entries.voice-call.config.*` 行由
      Voice Call 插件自身在每次配置加载时规范化，而不是由 `openclaw
      doctor` 规范化。该插件也会记录一条启动警告，指向 `openclaw
      doctor --fix`，但 Doctor 目前不会为这些键重写
      `openclaw.json`；插件自身的规范化会在运行时应用该更改。
    </Note>

    多账号渠道的账号默认值指导：

    - 如果配置了两个或更多 `channels.<channel>.accounts` 条目，却没有配置 `channels.<channel>.defaultAccount` 或 `accounts.default`，Doctor 会警告回退路由可能选中意外账号。
    - 如果 `channels.<channel>.defaultAccount` 被设置为未知账号 ID，Doctor 会警告并列出已配置的账号 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供商覆盖">
    如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖来自 `openclaw/plugin-sdk/llm` 的内置 OpenCode 目录。这可能会迫使模型使用错误的 API，或把成本清零。Doctor 会警告，以便你移除该覆盖并恢复按模型划分的 API 路由 + 成本。
  </Accordion>
  <Accordion title="2c. 浏览器迁移和 Chrome MCP 就绪状态">
    如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，Doctor 会将其规范化为当前的主机本地 Chrome MCP 附加模型（`browser.profiles.*.driver: "extension"` → `"existing-session"`；移除 `browser.relayBindHost`）。

    当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` 配置文件时，Doctor 也会审计主机本地 Chrome MCP 路径：

    - 检查同一主机上是否安装了 Google Chrome，以用于默认自动连接配置
    - 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
    - 提醒你在浏览器检查页面中启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 无法替你启用 Chrome 端设置。主机本地 Chrome MCP 仍然要求 Gateway 网关/节点主机上有本地运行的基于 Chromium 的浏览器 144+，并且已启用远程调试，还要在浏览器中批准首次附加同意提示。

    这里的就绪检查只覆盖本地附加前置条件。Existing-session 保留当前 Chrome MCP 路由限制；`responsebody`、PDF 导出、下载拦截和批量操作等高级路由仍然需要托管浏览器或原始 CDP 配置。此检查不适用于 Docker、沙箱、远程浏览器或其他无头流程，这些流程继续使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置条件">
    配置 OpenAI Codex OAuth 配置后，Doctor 会探测 OpenAI 授权端点，以验证本地 Node/OpenSSL TLS 栈能否验证证书链。如果探测因证书错误而失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），Doctor 会输出特定平台的修复指导。在使用 Homebrew Node 的 macOS 上，修复通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关健康，也会运行该探测。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供商覆盖">
    如果你之前在 `models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，它们可能会遮蔽较新版本自动使用的内置 Codex OAuth 提供商路径。Doctor 在看到这些旧传输设置与 Codex OAuth 同时存在时会发出警告，这样你就可以移除或重写过时的传输覆盖，并恢复内置路由/回退行为。自定义代理和仅标头覆盖仍受支持，并且不会触发此警告。
  </Accordion>
  <Accordion title="2f. Codex 路由修复">
    Doctor 会检查旧版 `openai-codex/*` 模型引用。Native Codex harness 路由使用规范的 `openai/*` 模型引用；OpenAI 智能体轮次会经过 Codex app-server harness，而不是 OpenClaw OpenAI provider 路径。

    在 `--fix` / `--repair` 模式下，Doctor 会重写受影响的默认智能体和每个智能体的引用，包括主模型、回退、图像/视频生成模型、Heartbeat/子智能体/压缩覆盖、Hooks、渠道模型覆盖，以及过时的持久化会话路由状态：

    - `openai-codex/gpt-*` 会变为 `openai/gpt-*`。
    - Codex 意图会移动到已修复智能体模型引用的按提供商/模型限定的 `agentRuntime.id: "codex"` 条目。
    - 过时的整智能体运行时配置和持久化会话运行时固定项会被移除，因为运行时选择按提供商/模型限定。
    - 除非修复后的旧版模型引用需要 Codex 路由来保留旧凭证路径，否则会保留现有的提供商/模型运行时策略。
    - 现有模型回退列表会保留，并重写其中的旧版条目；复制的按模型设置会从旧版键移动到规范的 `openai/*` 键。
    - 持久化会话 `modelProvider`/`providerOverride`、`model`/`modelOverride`、回退通知和凭证配置固定项会在所有发现的智能体会话存储中修复。
    - Doctor 还会分别将过时的 `agentRuntime.id: "codex-cli"` 固定项（一个不同的旧版运行时 ID）修复为 `"codex"`，范围包括 `agents.defaults`、`agents.list[]` 和 `models.providers.*` 模型条目。
    - `/codex ...` 表示“从聊天中控制或绑定原生 Codex 对话。”
    - `/acp ...` 或 `runtime: "acp"` 表示“使用外部 ACP/acpx 适配器。”

  </Accordion>
  <Accordion title="2g. 会话路由清理">
    在你把配置的模型或运行时从 Codex 等插件拥有的路由移走后，Doctor 还会扫描发现的智能体会话存储，查找过时的自动创建路由状态。

    `openclaw doctor --fix` 可以清除自动创建的过时状态，例如 `modelOverrideSource: "auto"` 模型固定项、运行时模型元数据、固定的 harness ID、CLI 会话绑定，以及当其所属路由不再配置时的自动凭证配置覆盖。显式用户或旧版会话模型选择会被报告以供手动审查，并保持不变；当不再希望使用该路由时，可用 `/model ...`、`/new` 切换它们，或重置会话。

  </Accordion>
  <Accordion title="3. 旧版状态迁移（磁盘布局）">
    Doctor 可以将较旧的磁盘布局迁移到当前结构：

    - 会话存储 + 转录稿：从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - 智能体目录：从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 凭证状态（Baileys）：从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 ID：`default`）

    这些迁移是尽力而为且幂等的；当 Doctor 将任何旧版文件夹作为备份留下时，会发出警告。Gateway 网关/CLI 也会在启动时自动迁移旧版会话 + 智能体目录，让历史记录/凭证/模型无需手动运行 Doctor 就落到按智能体划分的路径中。WhatsApp 凭证有意只通过 `openclaw doctor` 迁移。Talk 提供商/提供商映射规范化会按结构相等性比较，因此仅键顺序不同的差异不再触发重复的空操作 `doctor --fix` 更改。

  </Accordion>
  <Accordion title="3a. 旧版插件清单迁移">
    Doctor 会扫描所有已安装的插件清单，查找已弃用的顶层能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到后，它会提议把它们移动到 `contracts` 对象，并就地重写清单文件。此迁移是幂等的；如果 `contracts` 已有相同值，则会移除旧版键而不复制数据。
  </Accordion>
  <Accordion title="3b. 旧版 cron 存储迁移">
    Doctor 还会检查 cron 任务存储（默认是 `~/.openclaw/cron/jobs.json`，或覆盖时的 `cron.store`），查找调度器仍为兼容性而接受的旧任务形状。

    当前 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 顶层载荷字段（`message`、`model`、`thinking`、...）→ `payload`
    - 顶层投递字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - 载荷 `provider` 投递别名 → 显式 `delivery.channel`
    - 旧版 `notify: true` webhook 回退任务 → 设置了 `cron.webhook` 时，改为显式 webhook 投递；公告任务保留其聊天投递，并获得 `delivery.completionDestination`。未设置 `cron.webhook` 时，会为无目标任务移除惰性的顶层 `notify` 标记（现有投递，包括公告，会保留），因为运行时投递从不读取它。

    Gateway 网关还会在加载时清理格式错误的 cron 行，让有效任务继续运行。原始格式错误行会在从 `jobs.json` 移除前复制到活动存储旁边的 `jobs-quarantine.json`；Doctor 会报告已隔离的行，方便你手动审查或修复。

    Gateway 网关启动会规范化运行时投影并忽略顶层 `notify` 标记，但会保留持久化的 cron 配置以供 Doctor 修复。未设置 `cron.webhook` 时，Doctor 会移除没有迁移目标的任务中的惰性标记（`delivery.mode` 为 none/缺失、webhook 目标不可用，或已有公告/聊天投递），并保持现有投递不变，因此重复运行 `doctor --fix` 不再对同一任务重复警告。如果设置了 `cron.webhook` 但不是有效的 HTTP(S) URL，Doctor 仍会发出警告并保留该标记，以便你修复 URL。

    在 Linux 上，当用户的 crontab 仍调用旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，Doctor 也会发出警告。当前 OpenClaw 不维护这个主机本地脚本，并且当 cron 无法访问 systemd 用户总线时，它可能会向 `~/.openclaw/logs/whatsapp-health.log` 写入错误的 `Gateway inactive` 消息。用 `crontab -e` 移除过时的 crontab 条目；使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status` 执行当前健康检查。

  </Accordion>
  <Accordion title="3c. 会话锁清理">
    Doctor 会扫描每个智能体会话目录，查找会话异常退出时留下的过时写锁文件。对找到的每个锁文件，它会报告：路径、PID、该 PID 是否仍存活、锁龄，以及是否被视为过时（PID 已死、所有者元数据格式错误、超过 30 分钟，或已证明存活 PID 属于非 OpenClaw 进程）。在 `--fix` / `--repair` 模式下，它会自动移除所有者已死、孤立、已回收、格式错误且较旧，或属于非 OpenClaw 的锁。仍由存活 OpenClaw 进程拥有的旧锁会被报告但保留原位，这样 Doctor 不会切断活动的转录稿写入器。
  </Accordion>
  <Accordion title="3d. 会话转录稿分支修复">
    Doctor 会扫描智能体会话 JSONL 文件，查找由 2026.4.24 提示转录稿重写 bug 创建的重复分支形状：一个带有 OpenClaw 内部运行时上下文的已废弃用户轮次，以及一个包含相同可见用户提示的活动同级分支。在 `--fix` / `--repair` 模式下，Doctor 会把每个受影响文件备份到原文件旁边，并将转录稿重写为活动分支，使 Gateway 网关历史记录和记忆读取器不再看到重复轮次。
  </Accordion>
  <Accordion title="4. 状态完整性检查（会话持久化、路由和安全）">
    状态目录是运维中枢。如果它消失，除非你在其他地方有备份，否则会丢失会话、凭证、日志和配置。

    Doctor 检查：

    - **状态目录缺失**：警告灾难性状态丢失，提示重新创建目录，并提醒你它无法恢复缺失的数据。
    - **状态目录权限**：验证可写性；提议修复权限（并在检测到所有者/组不匹配时发出 `chown` 提示）。
    - **macOS 云同步状态目录**：当状态解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下时发出警告，因为同步支持的路径可能导致更慢的 I/O 和锁/同步竞争。
    - **Linux SD 或 eMMC 状态目录**：当状态解析到 `mmcblk*` 挂载源时发出警告，因为 SD/eMMC 支持的随机 I/O 在会话和凭证写入下可能更慢且磨损更快。
    - **Linux 易失性状态目录**：当状态解析到 `tmpfs` 或 `ramfs` 时发出警告，因为会话、凭证、配置和 SQLite 状态（带 WAL/journal 旁文件）会在重启时消失。Docker `overlay` 挂载有意不被标记，因为只要容器保留，其可写层就会在主机重启后继续存在。
    - **会话目录缺失**：`sessions/` 和会话存储目录是持久化历史记录并避免 `ENOENT` 崩溃所必需的。
    - **转录稿不匹配**：当最近会话条目缺少转录稿文件时发出警告。
    - **主会话“1 行 JSONL”**：当主转录稿只有一行时标记（历史记录没有累积）。
    - **多个状态目录**：当多个主目录中存在多个 `~/.openclaw` 文件夹，或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史记录可能在安装之间分裂）。
    - **远程模式提醒**：如果 `gateway.mode=remote`，Doctor 会提醒你在远程主机上运行它（状态位于那里）。
    - **配置文件权限**：如果 `~/.openclaw/openclaw.json` 可被组/全局读取，则发出警告并提议收紧到 `600`。

  </Accordion>
  <Accordion title="5. 模型凭证健康（OAuth 过期）">
    Doctor 会检查凭证存储中的 OAuth 配置文件，在令牌即将过期或已过期时发出警告，并在安全时刷新它们。如果 Anthropic OAuth/令牌配置文件已过期，它会建议使用 Anthropic API 密钥或 Anthropic setup-token 路径。刷新提示只会在交互式运行（TTY）时出现；`--non-interactive` 会跳过刷新尝试。

    当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、`invalid_grant`，或提供商要求你重新登录），Doctor 会报告需要重新认证，并打印要运行的确切 `openclaw models auth login --provider ...` 命令。

    Doctor 还会报告因短暂冷却（速率限制/超时/认证失败）或较长时间禁用（计费/额度失败）而暂时不可用的凭证配置文件。

    对于令牌位于 macOS Keychain 中的旧版 Codex OAuth 配置文件（基于文件的 sidecar 布局之前的旧版新手引导），只由 Doctor 修复。从交互式终端运行一次 `openclaw doctor --fix`，将 Keychain 支持的旧版令牌内联迁移到 `auth-profiles.json`；之后，嵌入式轮次（Telegram、cron、子智能体分发）会将它们解析为规范的 OpenAI OAuth 配置文件。

  </Accordion>
  <Accordion title="6. Hooks 模型验证">
    如果设置了 `hooks.gmail.model`，Doctor 会根据目录和允许列表验证模型引用，并在它无法解析或被禁止时发出警告。
  </Accordion>
  <Accordion title="7. 沙箱镜像修复">
    启用沙箱隔离时，Doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建镜像或切换到旧版名称的选项。
  </Accordion>
  <Accordion title="7b. 插件安装清理">
    Doctor 会在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下移除旧版 OpenClaw 生成的插件依赖暂存状态：过期的生成依赖根目录、旧的安装阶段目录、早期内置插件依赖修复代码留下的包内残留，以及可能遮蔽当前内置清单的孤立或已恢复的托管 npm 内置 `@openclaw/*` 插件副本。Doctor 还会将宿主 `openclaw` 包重新链接到声明了 `peerDependencies.openclaw` 的托管 npm 插件中，这样 `openclaw/plugin-sdk/*` 等包内运行时导入在更新或 npm 修复后仍能继续解析。

    当配置引用了可下载插件但本地插件注册表找不到它们时，Doctor 也可以重新安装缺失的可下载插件（物化的 `plugins.entries`、已配置的渠道/提供商/搜索设置、已配置的 Agent Runtimes）。在包更新期间，Doctor 会避免在核心包被替换时运行包管理器插件修复；如果更新后某个已配置插件仍需要恢复，请再次运行 `openclaw doctor --fix`。Gateway 网关启动和配置重载不会运行包管理器；插件安装仍然是显式的 Doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. Gateway 网关服务迁移和清理提示">
    Doctor 会检测旧版 Gateway 网关服务（launchd/systemd/schtasks），并提供移除它们以及使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它还可以扫描额外的 Gateway 网关类服务并打印清理提示。以配置文件命名的 OpenClaw Gateway 网关服务被视为一等服务，不会被标记为“额外”。

    在 Linux 上，如果缺少用户级 Gateway 网关服务但存在系统级 OpenClaw Gateway 网关服务，Doctor 不会自动安装第二个用户级服务。请使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 检查，然后移除重复项；如果 Gateway 网关生命周期由系统 supervisor 管理，请设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 启动时 Matrix 迁移">
    当 Matrix 渠道账户存在待处理或可执行的旧版状态迁移时，Doctor 会在 `--fix` / `--repair` 模式下创建迁移前快照，然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。这两个步骤都不是致命错误；错误会被记录，启动会继续。在只读模式（不带 `--fix` 的 `openclaw doctor`）下，此检查会被完全跳过。
  </Accordion>
  <Accordion title="8c. 设备配对和凭证漂移">
    Doctor 会在正常健康检查过程中检查设备配对状态，并报告：

    - 待处理的首次配对请求
    - 已配对设备的待处理角色或权限范围升级
    - 设备 ID 仍匹配但设备身份不再匹配已批准记录的公钥不匹配修复
    - 已配对记录缺少已批准角色的有效令牌
    - 权限范围漂移到已批准配对基线之外的已配对令牌
    - 当前机器上早于 Gateway 网关侧令牌轮换，或携带过期权限范围元数据的本地缓存设备令牌条目

    Doctor 不会自动批准配对请求，也不会自动轮换设备令牌。它会打印确切的后续步骤：

    - 使用 `openclaw devices list` 检查待处理请求
    - 使用 `openclaw devices approve <requestId>` 批准确切请求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新令牌
    - 使用 `openclaw devices remove <deviceId>` 移除并重新批准过期记录

    这会区分首次配对、待处理的角色/权限范围升级，以及过期令牌/设备身份漂移，从而堵住常见的“已经配对但仍然提示需要配对”漏洞。

  </Accordion>
  <Accordion title="9. 安全警告">
    当提供商在没有允许列表的情况下对私信开放，或策略以危险方式配置时，Doctor 会发出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果作为 systemd 用户服务运行，Doctor 会确保已启用 lingering，以便 Gateway 网关在登出后保持运行。
  </Accordion>
  <Accordion title="11. 工作区状态（Skills、插件和 TaskFlows）">
    Doctor 会打印默认智能体的工作区状态摘要：

    - **Skills 状态**：统计符合条件、缺少要求以及被允许列表阻止的 Skills。
    - **插件状态**：统计已启用/已禁用/出错的插件；列出所有错误的插件 ID；报告内置插件能力。
    - **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
    - **插件诊断**：显示插件注册表在加载时发出的任何警告或错误。
    - **TaskFlow 恢复**：显示需要手动检查或取消的可疑托管 TaskFlows。

  </Accordion>
  <Accordion title="11b. Bootstrap 文件大小">
    Doctor 会检查工作区 bootstrap 文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过已配置的字符预算。它会报告每个文件的原始字符数与注入字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及总注入字符数占总预算的比例。当文件被截断或接近限制时，Doctor 会打印用于调整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11c. Shell 补全">
    Doctor 会检查当前 shell（zsh、bash、fish 或 PowerShell）是否已安装 Tab 补全：

    - 如果 shell 配置文件使用较慢的动态补全模式（`source <(openclaw completion ...)`），Doctor 会将其升级为更快的缓存文件变体。
    - 如果配置文件中已配置补全但缓存文件缺失，Doctor 会自动重新生成缓存。
    - 如果完全没有配置补全，Doctor 会提示安装它（仅限交互模式；使用 `--non-interactive` 时跳过）。

    运行 `openclaw completion --write-state` 可手动重新生成缓存。

  </Accordion>
  <Accordion title="11d. 过期渠道插件清理">
    当 `openclaw doctor --fix` 移除缺失的渠道插件时，它还会移除引用该插件的悬空渠道范围配置：`channels.<id>` 条目、命名该渠道的 Heartbeat 目标，以及 `agents.*.models["<channel>/*"]` 覆盖项。这可以防止渠道运行时已消失但配置仍要求 Gateway 网关绑定到它而导致的 Gateway 网关启动循环。
  </Accordion>
  <Accordion title="12. Gateway 网关凭证检查（本地令牌）">
    Doctor 会检查本地 Gateway 网关令牌凭证就绪状态。

    - 如果令牌模式需要令牌且不存在令牌来源，Doctor 会提供生成一个令牌的选项。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，Doctor 会发出警告，并且不会用明文覆盖它。
    - `openclaw doctor --generate-gateway-token` 只会在未配置令牌 SecretRef 时强制生成。

  </Accordion>
  <Accordion title="12b. 感知 SecretRef 的只读修复">
    某些修复流程需要检查已配置的凭证，同时不削弱运行时快速失败行为。

    - `openclaw doctor --fix` 会使用与状态类命令相同的只读 SecretRef 摘要模型进行定向配置修复。
    - 示例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修复会在可用时尝试使用已配置的 Bot 凭证。
    - 如果 Telegram Bot 令牌通过 SecretRef 配置，但在当前命令路径中不可用，Doctor 会报告该凭证已配置但不可用，并跳过自动解析，而不是崩溃或误报令牌缺失。

  </Accordion>
  <Accordion title="13. Gateway 健康检查 + 重启">
    Doctor 会运行健康检查，并在 Gateway 网关看起来不健康时提供重启选项。
  </Accordion>
  <Accordion title="13b. 记忆搜索就绪状态">
    Doctor 会检查默认智能体配置的记忆搜索嵌入提供商是否就绪。具体行为取决于配置的后端和提供商：

    - **QMD 后端**：探测 `qmd` 二进制文件是否可用且可启动。如果不可用，会打印修复指导，包括 `npm install -g @tobilu/qmd`（或 Bun 等效命令）以及手动二进制路径选项。
    - **显式本地提供商**：检查本地模型文件或可识别的远程/可下载模型 URL。如果缺失，建议切换到远程提供商。
    - **显式远程提供商**（`openai`、`voyage` 等）：验证环境或凭证存储中是否存在 API 密钥。如果缺失，会打印可执行的修复提示。
    - **旧版自动提供商**：将 `memorySearch.provider: "auto"` 视为 OpenAI，检查 OpenAI 就绪状态，并由 `doctor --fix` 将其重写为 `provider: "openai"`。

    当缓存的 Gateway 网关探测结果可用时（检查时 Gateway 网关健康），Doctor 会将其结果与 CLI 可见配置交叉引用，并指出任何差异。Doctor 不会在默认路径上启动新的嵌入 ping；当你需要实时提供商检查时，请使用深度记忆状态命令。

    使用 `openclaw memory status --deep` 在运行时验证嵌入就绪状态。

  </Accordion>
  <Accordion title="14. 渠道状态警告">
    如果 Gateway 网关健康，Doctor 会运行渠道状态探测，并报告警告及建议修复。
  </Accordion>
  <Accordion title="15. Supervisor 配置审计 + 修复">
    Doctor 会检查已安装的 supervisor 配置（launchd/systemd/schtasks）是否缺少默认值或默认值过期（例如 systemd network-online 依赖和重启延迟）。发现不匹配时，它会建议更新，并且可以将服务文件/任务重写为当前默认值。

    说明：

    - `openclaw doctor` 在重写 supervisor 配置前会提示。
    - `openclaw doctor --yes` 接受默认修复提示。
    - `openclaw doctor --fix` 无需提示即可应用推荐修复（`--repair` 是别名）。
    - `openclaw doctor --fix --force` 覆盖自定义 supervisor 配置。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 让 doctor 对 Gateway 网关服务生命周期保持只读。它仍会报告服务健康状态并运行非服务修复，但会跳过服务安装/启动/重启/引导、supervisor 配置重写以及旧版服务清理，因为外部 supervisor 拥有该生命周期。
    - 在 Linux 上，当匹配的 systemd Gateway 网关单元处于活动状态时，doctor 不会重写命令/入口点元数据。它还会在重复服务扫描期间忽略处于非活动状态且非旧版的额外类似 Gateway 网关的单元，因此配套服务文件不会产生清理噪音。
    - 如果 token auth 需要 token 且 `gateway.auth.token` 由 SecretRef 管理，doctor 服务安装/修复会验证 SecretRef，但不会将解析出的明文 token 值持久化到 supervisor 服务环境元数据中。
    - Doctor 会检测旧版 LaunchAgent、systemd 或 Windows Scheduled Task 安装以内联方式嵌入的托管 `.env`/SecretRef 支持的服务环境值，并重写服务元数据，使这些值从运行时来源加载，而不是从 supervisor 定义加载。
    - Doctor 会检测服务命令在 `gateway.port` 变更后是否仍固定旧的 `--port`，并将服务元数据重写为当前端口。
    - 如果 token auth 需要 token 且配置的 token SecretRef 未解析，doctor 会阻止安装/修复路径，并提供可操作的指导。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，doctor 会阻止安装/修复，直到显式设置 mode。
    - 对于 Linux 用户 systemd 单元，doctor token 漂移检查在比较服务 auth 元数据时同时包含 `Environment=` 和 `EnvironmentFile=` 来源。
    - 当配置最后由较新版本写入时，Doctor 服务修复会拒绝从较旧的 OpenClaw 二进制文件重写、停止或重启 Gateway 网关服务。请参阅 [Gateway 故障排查](/zh-CN/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你始终可以通过 `openclaw gateway install --force` 强制进行完整重写。

  </Accordion>
  <Accordion title="16. Gateway 网关运行时 + 端口诊断">
    Doctor 会检查服务运行时（PID、上次退出状态），并在服务已安装但实际未运行时发出警告。它还会检查 Gateway 网关端口（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已在运行、SSH 隧道）。
  </Accordion>
  <Accordion title="17. Gateway 网关运行时最佳实践">
    当 Gateway 网关服务运行在 Bun 或版本管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上时，Doctor 会发出警告。WhatsApp 和 Telegram 渠道需要 Node，而版本管理器路径在升级后可能会失效，因为服务不会加载你的 shell 初始化配置。Doctor 会在可用时提供迁移到系统 Node 安装的选项（Homebrew/apt/choco）。

    新安装或修复的 macOS LaunchAgent 使用规范的系统 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是复制交互式 shell PATH，因此 Homebrew 管理的系统二进制文件仍然可用，同时 Volta、asdf、fnm、pnpm 和其他版本管理器目录不会改变 Node 子进程解析的内容。Linux 服务仍会保留显式环境根目录（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和稳定的用户 bin 目录，但推测的版本管理器回退目录只有在这些目录存在于磁盘上时才会写入服务 PATH。

  </Accordion>
  <Accordion title="18. 配置写入 + 向导元数据">
    Doctor 会持久化任何配置更改，并标记向导元数据以记录 doctor 运行。
  </Accordion>
  <Accordion title="19. 工作区提示（备份 + 记忆系统）">
    Doctor 会在缺失时建议工作区记忆系统，并在工作区尚未纳入 git 时打印备份提示。

    请参阅 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)，获取有关工作区结构和 git 备份的完整指南（推荐使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 故障排查](/zh-CN/gateway/troubleshooting)
