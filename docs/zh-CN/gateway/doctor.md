---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置变更
sidebarTitle: Doctor
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-07-14T13:39:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修复和迁移工具。它可以修复过时的配置/状态、检查健康状况，并提供可执行的修复步骤。

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

    无需提示即接受默认选项（包括适用时的重启/服务/沙箱修复步骤）。

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

    为 CI 或自动化预检运行结构化健康检查。只读：不进行
    提示、修复、迁移、重启或状态写入。

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    同时应用激进的修复（会覆盖自定义监管程序配置）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    无提示运行，仅应用安全迁移（配置规范化 +
    磁盘状态移动）。跳过需要人工
    确认的重启/服务/沙箱操作。检测到旧版状态时，仍会自动运行迁移。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    扫描系统服务，查找额外安装的 Gateway 网关（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

要在写入前查看更改，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 只读 lint 模式

`openclaw doctor --lint` 是 `openclaw doctor --fix` 面向自动化场景的对应工具。两者共享同一个 Doctor 规则注册表，但
选择和执行规则的方式并不相同：

| 模式                     | 提示   | 写入配置/状态     | 输出                 | 用途                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | 是       | 否                      | 易读的健康报告 | 人工检查状态         |
| `openclaw doctor --fix`  | 有时 | 是，遵循修复策略 | 易读的修复日志    | 应用已批准的修复       |
| `openclaw doctor --lint` | 否        | 否                      | 结构化发现    | CI、预检和审查门禁 |

默认的 `doctor --lint` 会运行广泛且安全的自动化配置：执行静态、本地且对 CI 或预检输出
有用的检查。它会跳过需要选择启用的检查，包括建议性检查、对环境敏感的检查、依赖实时服务的检查、账户/工作区
清单检查或历史清理检查。需要包含这些选择启用检查的
完整已注册 lint 审计时，请使用 `doctor --lint --all`；需要针对特定检查时，请使用 `--only <id>`。

`doctor --fix` 不使用 lint 默认配置，也不接受
`--all`。它会运行 Doctor 的有序修复路径：现代健康检查可以提供
可选的 `repair()` 实现，而较旧的区域仍使用其旧版
Doctor 修复流程。某些 lint 发现有意仅用于诊断，因此
`--lint --all` 中出现某项检查并不意味着 `--fix` 会修改该区域。
该契约将 `detect()`（报告发现）与 `repair()`（报告
更改/差异/副作用）分离，从而为未来的
`doctor --fix --dry-run` 留出实现路径，而无需将 lint 检查转变为变更规划器。

某些内置检查在内部默认禁用，以便继续供
`--all`、`--only` 和 Doctor 修复流程使用，同时不成为默认
`doctor --lint` 自动化配置的一部分。每项发现仍会输出其严重程度
（`info`、`warning` 或 `error`）；默认选择并不是严重程度
级别。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 输出字段：

- `ok`：是否有任何发现达到所选严重程度阈值
- `checksRun` / `checksSkipped`：计数（因配置、`--only` 或 `--skip` 而跳过）
- `findings`：结构化诊断，包含 `checkId`、`severity`、`message`，以及可选的 `path`、`line`、`column`、`ocPath`、`source`、`target`、`requirement`、`fixHint`

退出代码：

| 代码 | 含义                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | 没有达到或超过所选阈值的发现           |
| `1`  | 一项或多项发现达到所选阈值          |
| `2`  | 输出发现前命令/运行时失败 |

标志：

- `--severity-min info|warning|error`（默认为 `warning`）：同时控制输出内容以及哪些情况会导致非零退出码。
- `--all`：运行所有已注册的 lint 检查，包括默认自动化集合中排除的选择启用检查。
- `--only <id>`（可重复使用）：仅运行指定 ID 的检查；未知 ID 会报告为错误发现。
- `--skip <id>`（可重复使用）：排除某项检查，同时继续运行其余检查。
- `--json`、`--severity-min`、`--all`、`--only` 和 `--skip` 需要 `--lint`；普通的 `openclaw doctor` 和 `--fix` 运行会拒绝这些标志。

## 功能摘要

<AccordionGroup>
  <Accordion title="健康、UI 和更新">
    - 针对 git 安装的可选更新预检（仅限交互模式）。
    - UI 协议新鲜度检查（当协议架构更新时重新构建 Control UI）。
    - 健康检查 + 重启提示。
    - 仅显示有问题的技能和插件说明；健康的清单保留在 `openclaw skills check` 和 `openclaw plugins list` 中。

  </Accordion>
  <Accordion title="配置和迁移">
    - 对旧版值结构进行配置规范化。
    - 将 Talk 旧版扁平 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>`。
    - 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪状态的浏览器迁移检查。
    - OpenCode 提供商覆盖警告（`models.providers.opencode` / `opencode-zen` / `opencode-go`）。
    - 旧版 OpenAI Codex 提供商/配置文件迁移（`openai-codex` → `openai`），以及过时 `models.providers.openai-codex` 的遮蔽警告。
    - OpenAI Codex OAuth 配置文件的 OAuth TLS 前置条件检查。
    - 当 `plugins.allow` 具有严格限制，但工具策略仍请求通配符或插件自有工具时，发出插件/工具允许列表警告。
    - 旧版磁盘状态迁移（会话/智能体目录/WhatsApp 身份验证）。
    - 旧版插件清单契约键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层投递/负载字段、负载 `provider`、`notify: true` webhook 回退任务）。
    - 在 `agents.defaults`、`agents.list[]` 和 `models.providers.*` 中修复 Codex CLI 运行时固定版本（`agentRuntime.id: "codex-cli"` → `"codex"`），包括每个模型的条目。
    - 启用插件时清理过时的插件配置；当 `plugins.enabled=false` 时，过时的插件引用会保留为惰性隔离配置。

  </Accordion>
  <Accordion title="状态和完整性">
    - 检查会话锁文件并清理过时的锁。
    - 修复受影响的 2026.4.24 构建所创建的重复提示词重写分支对应的会话转录。
    - 检测卡死的子智能体重启恢复墓碑，并支持通过 `--fix` 清除过时的已中止恢复标志，避免启动时一直将子智能体视为因重启而中止。
    - 状态完整性和权限检查（会话、转录、状态目录）。
    - 本地运行时检查配置文件权限（chmod 600）。
    - 模型身份验证健康状况：检查 OAuth 到期情况、可刷新即将到期的令牌，并报告身份验证配置文件的冷却/禁用状态。

  </Accordion>
  <Accordion title="Gateway 网关、服务和监管程序">
    - 启用沙箱隔离时修复沙箱镜像。
    - 迁移旧版服务并检测额外的 Gateway 网关。
    - Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式下）。
    - Gateway 网关运行时检查（服务已安装但未运行；缓存的 launchd 标签）。
    - 渠道状态警告（从正在运行的 Gateway 网关探测）。
    - 渠道特定的权限检查位于 `openclaw channels capabilities` 下；例如，使用 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 审计 Discord 语音频道权限。
    - 当本地 TUI 客户端仍在运行且 Gateway 网关事件循环健康状况下降时，执行 WhatsApp 响应性检查；`--fix` 只会停止已经过验证的本地 TUI 客户端。
    - 修复主模型、回退模型、图像/视频生成模型、Heartbeat/子智能体/压缩覆盖项、Hooks、渠道模型覆盖项和会话路由固定项中的旧版 `openai-codex/*` 模型引用；`--fix` 会将其重写为 `openai/*`，将 `openai-codex:*` 身份验证配置文件/顺序迁移到 `openai:*`，删除过时的会话/整个智能体运行时固定项，并由修复后的有效路由确定是否与 Codex 兼容。
    - 监管程序配置审计（launchd/systemd/schtasks），可选择修复。
    - 清理 Gateway 网关服务中嵌入的代理环境，这些服务在安装或更新期间捕获了 shell 的 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值。
    - Gateway 网关运行时检查（不受支持的旧版 Bun 服务、版本管理器路径）。
    - Gateway 网关端口冲突诊断（默认为 `18789`）。

  </Accordion>
  <Accordion title="身份验证、安全和配对">
    - 针对开放式私信策略的安全警告。
    - 本地令牌模式下的 Gateway 网关身份验证检查（没有令牌来源时会提供令牌生成功能；不会覆盖令牌 SecretRef 配置）。
    - 检测设备配对问题（待处理的首次配对请求、待处理的角色/权限范围升级、过时的本地设备令牌缓存偏差以及已配对记录的身份验证偏差）。

  </Accordion>
  <Accordion title="工作区和 shell">
    - Linux 上的 systemd linger 检查。
    - 工作区引导文件大小检查（上下文文件的截断/接近上限警告）。
    - 默认智能体的 Skills 就绪状态检查；报告已允许但缺少二进制文件、环境变量、配置或操作系统要求的 Skills，`--fix` 可以在 `skills.entries` 中禁用不可用的 Skills。
    - shell 补全状态检查和自动安装/升级。
    - 记忆搜索嵌入提供商就绪状态检查（本地模型、远程 API key 或 QMD 二进制文件）。
    - 源码安装检查（pnpm 工作区不匹配、缺少 UI 资源、缺少 tsx 二进制文件）。
    - 写入更新后的配置 + 向导元数据。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填和重置

Control UI 的 Dreams 场景包含用于接地梦境工作流的 **回填**、**重置** 和 **清除接地内容** 操作。这些操作使用 Gateway 网关 Doctor 风格的 RPC 方法，但**不**属于 `openclaw doctor` CLI 修复/迁移的一部分。

| 操作         | 功能                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 回填       | 扫描活动工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行接地 REM 日记处理，并将可逆的回填条目写入 `DREAMS.md`。 |
| 重置          | 仅从 `DREAMS.md` 中移除带标记的回填日记条目。                                                                                                  |
| 清除接地内容 | 仅移除历史重放中暂存的仅接地短期条目，这些条目尚未积累实时回忆或每日支持。                           |

这些操作都不会编辑 `MEMORY.md`、运行完整的 Doctor 迁移，也不会自行将接地候选项暂存到实时短期晋升存储中。要将接地历史重放送入常规的深度晋升通道，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这会将接地的持久候选项暂存到短期梦境存储中，同时 `DREAMS.md` 仍作为审查界面。

## 详细行为和设计理由

<AccordionGroup>
  <Accordion title="0. 可选更新（git 安装）">
    如果这是 git 检出，并且 Doctor 正以交互方式运行，它会在运行 Doctor 之前提供更新选项（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 配置规范化">
    Doctor 会将旧版值结构规范化为当前 schema。当前的 Talk 语音配置为 `talk.provider` + `talk.providers.<provider>`，实时语音配置位于 `talk.realtime.*` 下。Doctor 会将旧的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 结构重写到提供商映射中，并将旧版顶层实时选择器（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）重写到 `talk.realtime` 中。

    当 `plugins.allow` 非空，且工具策略使用通配符或插件所有的工具条目时，Doctor 也会发出警告。`tools.allow: ["*"]` 仅匹配实际加载的插件所提供的工具；它不会绕过排他性插件允许列表。

  </Accordion>
  <Accordion title="2. 旧版配置键迁移">
    当配置包含具有有效迁移路径的已弃用键时，其他命令会拒绝运行，并要求你运行 `openclaw doctor`。Doctor 会说明发现了哪些旧版键、显示已应用的迁移，并使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。Gateway 网关启动时会拒绝旧版配置格式，并要求你运行 `openclaw doctor --fix`；它不会在启动时重写 `openclaw.json`。Cron 作业存储迁移也由 `openclaw doctor --fix` 处理。

    <Note>
      Doctor 仅在某个键停用后的大约两个月内提供自动迁移。
      更早的旧版键（例如最初的
      `routing.queue`、`routing.bindings`、`routing.agents`/`defaultAgentId`、
      `routing.transcribeAudio`、顶层 `agent.*`，或多智能体配置结构出现之前的顶层 `identity`）
      不再具有迁移路径；现在使用这些键的配置会验证失败，而不会被重写。
      请根据当前配置参考手动修复这些键，之后 Doctor
      才能继续运行。
    </Note>

    有效迁移：

    | 旧版键                                                                                    | 当前键                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`、`gateway.webchat`                                                            | 已移除（WebChat 已停用）                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`、`channels.<id>.threadBindings.ttlHours`（以及每个账户下的对应键）      | `...threadBindings.idleHours`                                               |
    | 旧版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`        | `talk.provider` + `talk.providers.<provider>`                               |
    | 旧版顶层实时 Talk 选择器（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`） | `talk.realtime`                                                              |
    | `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | TTS 说话人字段 `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>`（除 Discord 外的所有渠道）                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>`（所有渠道，包括 Discord）                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"`（如果提供商的 `api` 是未来或未知的枚举值，Gateway 网关启动时也会跳过该提供商，而不是以失败关闭） |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | 已移除（旧版 Chrome 扩展中继设置）                             |
    | `mcp.servers.*.type`（CLI 原生别名）                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | 已移除（Codex app-server 始终将 Codex 原生工作区工具保持为原生工具） |
    | `commands.modelsWrite`                                                                           | 已移除（`/models add` 已弃用）                                       |
    | `agents.defaults/list[].silentReplyRewrite`、`surfaces.*.silentReplyRewrite`                     | 已移除（完全匹配的 `NO_REPLY` 不再重写为可见的回退文本）  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | 已移除（OpenClaw 负责生成系统提示词）                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | 已移除（对速度较慢的模型/提供商超时使用 `models.providers.<id>.timeoutSeconds`，并将其保持在智能体/运行超时上限以下） |
    | 顶层 `memorySearch`                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path`（任意层级）                                                            | 已移除（记忆索引位于各智能体数据库中）                       |
    | 顶层 `heartbeat`                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex` 策略 ID                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`、`session.parentForkMaxTokens`                                 | 已移除（已弃用）                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      上述 `plugins.entries.voice-call.config.*` 行由
      Voice Call 插件在每次加载配置时自行规范化，而不是由 `openclaw
      doctor` 处理。该插件还会记录一条指向 `openclaw
      doctor --fix` 的启动警告，但 Doctor 当前不会针对这些键重写
      `openclaw.json`；运行时应用此变更的是插件自身的规范化逻辑。
    </Note>

    多账户渠道的账户默认值指导：

    - 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但未配置 `channels.<channel>.defaultAccount` 或 `accounts.default`，Doctor 会警告回退路由可能会选中意外的账户。
    - 如果将 `channels.<channel>.defaultAccount` 设置为未知账户 ID，Doctor 会发出警告并列出已配置的账户 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供商覆盖设置">
    如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖 `openclaw/plugin-sdk/llm` 中的内置 OpenCode 目录。这可能会迫使模型使用错误的 API，或将费用归零。Doctor 会发出警告，以便你删除覆盖设置并恢复按模型配置的 API 路由和费用。
  </Accordion>
  <Accordion title="2c. 浏览器迁移和 Chrome MCP 就绪状态">
    如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，Doctor 会将其规范化为当前主机本地的 Chrome MCP 附加模型（`browser.profiles.*.driver: "extension"` → `"existing-session"`；`browser.relayBindHost` 已移除）。

    当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` 配置文件时，Doctor 还会检查主机本地的 Chrome MCP 路径：

    - 检查默认自动连接配置文件所在的同一主机上是否安装了 Google Chrome
    - 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
    - 提醒你在浏览器检查页面中启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 无法替你启用 Chrome 端的设置。主机本地 Chrome MCP 仍要求 Gateway 网关/节点主机上本地运行基于 Chromium 的 144+ 浏览器、启用远程调试，并在浏览器中批准首次附加同意提示。

    此处的就绪状态仅涵盖本地附加的先决条件。现有会话会保持当前 Chrome MCP 的路由限制；`responsebody`、PDF 导出、下载拦截和批量操作等高级路由仍需要托管浏览器或原始 CDP 配置文件。此检查不适用于 Docker、沙箱、远程浏览器或其他无头流程，这些流程继续使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 先决条件">
    配置 OpenAI Codex OAuth 配置文件后，Doctor 会探测 OpenAI 授权端点，以验证本地 Node/OpenSSL TLS 栈能否验证证书链。如果探测因证书错误而失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），Doctor 会输出特定于平台的修复指导。在使用 Homebrew Node 的 macOS 上，修复方法通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关健康，也会运行该探测。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供商覆盖设置">
    如果你之前在 `models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，它们可能会遮蔽内置的 Codex OAuth 提供商路径。当 Doctor 发现这些旧传输设置与 Codex OAuth 并存时，会发出警告，以便你删除或重写过时的传输覆盖设置并恢复当前路由行为。自定义代理和仅标头覆盖仍受支持，不会触发此警告，但这些手动定义的请求路由不符合隐式选择 Codex 的条件。
  </Accordion>
  <Accordion title="2f. Codex 路由修复">
    Doctor 会检查旧版 `openai-codex/*` 模型引用。原生 Codex harness 路由使用规范的 `openai/*` 模型引用，但仅凭前缀绝不会选择 Codex。当运行时策略未设置或为 `auto` 时，只有没有手动请求覆盖设置、且与官方 HTTPS Platform Responses 或 ChatGPT Responses 路由完全匹配的路由才符合条件。参阅 [OpenAI 隐式 Agent runtime](/zh-CN/providers/openai#implicit-agent-runtime)。

    在 `--fix` / `--repair` 模式下，Doctor 会重写受影响的默认智能体和各智能体引用，包括主模型、回退模型、图像/视频生成模型、Heartbeat/子智能体/压缩覆盖设置、Hooks、渠道模型覆盖设置，以及过时的持久化会话路由状态：

    - `openai-codex/gpt-*` 变为 `openai/gpt-*`。
    - Codex 意图会迁移到为修复后的智能体模型引用设置的、限定提供商/模型范围的 `agentRuntime.id: "codex"` 条目。
    - 过时的智能体整体运行时配置和持久化会话运行时固定设置会被移除，因为运行时选择的作用域是提供商/模型。
    - 现有的提供商/模型运行时策略会被保留，除非修复后的旧版模型引用需要 Codex 路由来保留旧身份验证路径。
    - 现有模型回退列表会保留，其中的旧版条目会被重写；复制的按模型设置会从旧版键迁移到规范的 `openai/*` 键。
    - 持久化会话中的 `modelProvider`/`providerOverride`、`model`/`modelOverride`、回退通知和身份验证配置文件固定设置，会在所有已发现的智能体会话存储中得到修复。
    - Doctor 还会单独修复过时的 `agentRuntime.id: "codex-cli"` 固定设置（一个不同的旧版运行时 ID），将 `agents.defaults`、`agents.list[]` 和 `models.providers.*` 模型条目中的值改为 `"codex"`。
    - `/codex ...` 表示“从聊天中控制原生 Codex 对话或与之绑定。”
    - `/acp ...` 或 `runtime: "acp"` 表示“使用外部 ACP/acpx 适配器。”

  </Accordion>
  <Accordion title="2g. 会话路由清理">
    当你将已配置的模型或运行时从 Codex 等插件拥有的路由迁移出去后，Doctor 还会扫描已发现的智能体会话存储，查找过时的自动创建路由状态。

    当其所属路由已不再配置时，`openclaw doctor --fix` 可以清除自动创建的过时状态，例如 `modelOverrideSource: "auto"` 模型固定设置、运行时模型元数据、固定的 harness ID、CLI 会话绑定和自动身份验证配置文件覆盖设置。显式的用户或旧版会话模型选择会被报告以供手动检查，并保持不变；当不再需要该路由时，请使用 `/model ...`、`/new` 切换它们，或重置会话。

  </Accordion>
  <Accordion title="3. 旧版状态迁移（磁盘布局）">
    Doctor 可以将较旧的磁盘布局迁移到当前结构：

    - 会话存储和转录记录：从 `~/.openclaw/sessions/` 迁移到 `~/.openclaw/agents/<agentId>/sessions/`
    - 智能体目录：从 `~/.openclaw/agent/` 迁移到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 身份验证状态（Baileys）：从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）迁移到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 ID：`default`）

    这些迁移采用尽力而为的方式并且具有幂等性；当 Doctor 将任何旧版文件夹留作备份时，会发出警告。Gateway 网关/CLI 还会在启动时自动迁移旧版会话和智能体目录，使历史记录、身份验证信息和模型无需手动运行 Doctor 即可归入各智能体路径。WhatsApp 身份验证有意仅通过 `openclaw doctor` 迁移。Talk 提供商/提供商映射规范化会按结构相等性进行比较，因此仅键顺序不同的差异不再反复触发无实际效果的 `doctor --fix` 更改。

  </Accordion>
  <Accordion title="3a. 旧版插件清单迁移">
    Doctor 会扫描所有已安装插件的清单，查找已弃用的顶层能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。发现后，它会提议将这些键移入 `contracts` 对象，并原地重写清单文件。此迁移具有幂等性；如果 `contracts` 中已有相同值，则会移除旧版键而不重复数据。
  </Accordion>
  <Accordion title="3b. 旧版 cron 存储迁移">
    Doctor 还会检查 cron 作业存储（默认为 `~/.openclaw/cron/jobs.json`，覆盖后为 `cron.store`），查找调度器出于兼容性仍接受的旧作业结构。

    当前 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 顶层有效负载字段（`message`、`model`、`thinking` 等）→ `payload`
    - 顶层投递字段（`deliver`、`channel`、`to`、`provider` 等）→ `delivery`
    - 有效负载中的 `provider` 投递别名 → 显式 `delivery.channel`
    - 旧版 `notify: true` webhook 回退作业 → 设置 `cron.webhook` 时使用其进行显式 webhook 投递；公告作业保留其聊天投递并获得 `delivery.completionDestination`。未设置 `cron.webhook` 时，对于无目标作业会移除不起作用的顶层 `notify` 标记（保留现有投递，包括公告），因为运行时投递绝不会读取该标记。

    Gateway 网关还会在加载时清理格式错误的 cron 行，以便有效作业继续运行。原始的格式错误行会复制到活动存储旁的 `jobs-quarantine.json`，然后从 `jobs.json` 中移除；Doctor 会报告已隔离的行，以便你手动检查或修复。

    Gateway 网关启动时会规范化运行时投影并忽略顶层 `notify` 标记，但会保留持久化的 cron 配置供 Doctor 修复。未设置 `cron.webhook` 时，Doctor 会移除没有迁移目标的作业中不起作用的标记（`delivery.mode` 为 none/缺失、webhook 目标不可用，或已有公告/聊天投递），同时保持现有投递不变，因此重复运行 `doctor --fix` 时不会再针对同一作业发出警告。如果已设置 `cron.webhook`，但它不是有效的 HTTP(S) URL，Doctor 仍会发出警告并保留该标记，以便你修复 URL。

    在 Linux 上，当用户的 crontab 仍调用旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，Doctor 也会发出警告。当前 OpenClaw 不再维护该主机本地脚本；当 cron 无法连接到 systemd 用户总线时，它可能会向 `~/.openclaw/logs/whatsapp-health.log` 写入错误的 `Gateway inactive` 消息。使用 `crontab -e` 移除过时的 crontab 条目；使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status` 执行当前的健康检查。

  </Accordion>
  <Accordion title="3c. 会话锁清理">
    Doctor 会扫描每个智能体会话目录，查找会话异常退出后遗留的过时写入锁文件。对于找到的每个锁文件，它会报告：路径、PID、PID 是否仍存活、锁的存在时长，以及是否将其视为过时（PID 已终止、所有者元数据格式错误、超过 30 分钟，或已证明仍存活的 PID 属于非 OpenClaw 进程）。在 `--fix` / `--repair` 模式下，它会自动移除所有者已终止、已孤立、已循环复用、元数据格式错误且陈旧，或属于非 OpenClaw 进程的锁。仍由存活的 OpenClaw 进程持有的旧锁会被报告，但保留在原处，避免 Doctor 中断活跃的转录记录写入进程。
  </Accordion>
  <Accordion title="3d. 会话转录记录分支修复">
    Doctor 会扫描智能体会话 JSONL 文件，查找由 2026.4.24 提示词转录记录重写错误创建的重复分支结构：一个已放弃的用户轮次包含 OpenClaw 内部运行时上下文，同时活跃的同级分支中包含相同的可见用户提示词。在 `--fix` / `--repair` 模式下，Doctor 会在每个受影响文件的原文件旁创建备份，并将转录记录重写为活跃分支，使 Gateway 网关历史记录和记忆读取器不再看到重复轮次。
  </Accordion>
  <Accordion title="4. 状态完整性检查（会话持久化、路由和安全性）">
    状态目录是操作系统的脑干。如果它消失，而你又没有在其他位置保存备份，就会丢失会话、凭据、日志和配置。

    Doctor 会检查：

    - **状态目录缺失**：警告灾难性状态丢失，提示重新创建该目录，并提醒你它无法恢复缺失的数据。
    - **状态目录权限**：验证是否可写；提供修复权限的选项（检测到所有者/组不匹配时会发出 `chown` 提示）。
    - **macOS 云同步状态目录**：当状态目录解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下时发出警告，因为由同步服务支持的路径可能导致 I/O 变慢以及锁定/同步竞态。
    - **Linux SD 或 eMMC 状态目录**：当状态目录解析到 `mmcblk*` 挂载源时发出警告，因为在写入会话和凭据时，基于 SD/eMMC 的随机 I/O 可能更慢且磨损更快。
    - **Linux 易失性状态目录**：当状态目录解析到 `tmpfs` 或 `ramfs` 时发出警告，因为会话、凭据、配置和 SQLite 状态（包括 WAL/日志侧文件）会在重启时消失。Docker `overlay` 挂载有意不标记，因为只要容器仍然存在，其可写层就会在宿主机重启后保留。
    - **会话目录缺失**：必须存在 `sessions/` 和会话存储目录，才能持久保存历史记录并避免 `ENOENT` 崩溃。
    - **转录记录不匹配**：当最近的会话条目缺少转录文件时发出警告。
    - **主会话“单行 JSONL”**：当主转录记录只有一行时进行标记（历史记录未累积）。
    - **多个状态目录**：当多个主目录中存在多个 `~/.openclaw` 文件夹，或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史记录可能分散在不同安装中）。
    - **远程模式提醒**：如果 `gateway.mode=remote`，Doctor 会提醒你在远程主机上运行它（状态存储在那里）。
    - **配置文件权限**：如果 `~/.openclaw/openclaw.json` 可由组/所有人读取，则发出警告，并提供将权限收紧为 `600` 的选项。

  </Accordion>
  <Accordion title="5. 模型身份验证健康状况（OAuth 过期）">
    Doctor 会检查身份验证存储中的 OAuth 配置文件，在令牌即将过期/已过期时发出警告，并在安全的情况下刷新令牌。如果 Anthropic OAuth/令牌配置文件已过期，它会建议使用 Anthropic API key 或 Anthropic setup-token 路径。刷新提示仅在交互式运行（TTY）时显示；`--non-interactive` 会跳过刷新尝试。

    当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、`invalid_grant`，或提供商要求你重新登录），Doctor 会报告需要重新进行身份验证，并输出要运行的确切 `openclaw models auth login --provider ...` 命令。

    Doctor 还会报告因短期冷却（速率限制/超时/身份验证失败）或较长期禁用（账单/额度失败）而暂时不可用的身份验证配置文件。

    令牌存储在 macOS 钥匙串中的旧版 Codex OAuth 配置文件（基于文件的侧文件布局之前的旧版新手引导）只能由 Doctor 修复。在交互式终端中运行一次 `openclaw doctor --fix`，将由钥匙串支持的旧版令牌原地迁移到 `auth-profiles.json`；之后，嵌入式轮次（Telegram、cron、子智能体分派）会将其解析为规范的 OpenAI OAuth 配置文件。

  </Accordion>
  <Accordion title="6. Hooks 模型验证">
    如果设置了 `hooks.gmail.model`，Doctor 会根据目录和允许列表验证模型引用，并在其无法解析或不被允许时发出警告。
  </Accordion>
  <Accordion title="7. 沙箱镜像修复">
    启用沙箱隔离后，Doctor 会检查 Docker 镜像；如果当前镜像缺失，则提供构建镜像或切换到旧版名称的选项。
  </Accordion>
  <Accordion title="7b. 插件安装清理">
    在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下，Doctor 会移除由 OpenClaw 生成的旧版插件依赖暂存状态：过时的生成依赖根目录、旧安装暂存目录、早期内置插件依赖修复代码遗留的包内碎片，以及内置 `@openclaw/*` 插件的孤立或已恢复的托管 npm 副本（这些副本可能遮蔽当前的内置清单）。Doctor 还会将宿主机的 `openclaw` 包重新链接到声明了 `peerDependencies.openclaw` 的托管 npm 插件中，以便更新或 npm 修复后，`openclaw/plugin-sdk/*` 等包内运行时导入仍可正常解析。

    当配置引用了缺失的可下载插件，而本地插件注册表找不到它们时，Doctor 也可以重新安装这些插件（实质性的 `plugins.entries`、已配置的渠道/提供商/搜索设置、已配置的 Agent Runtimes）。在包更新期间，Doctor 会避免在核心包正在替换时重新安装插件包；如果更新后某个已配置插件仍需恢复，请再次运行 `openclaw doctor --fix`。除下述容器镜像启动例外情况外，Gateway 网关启动和配置重新加载不会执行包修复；插件安装仍需通过明确的 Doctor/安装/更新操作完成。

    容器化 Gateway 网关启动有一个范围有限的升级例外：当 `openclaw gateway run` 在新版 OpenClaw 上启动时，它会在就绪前运行安全的状态迁移和现有的核心更新后插件收敛流程，然后记录每版本检查点。此启动流程可以清理过时的内置插件记录、修复本地插件链接、在收敛路径需要时重新安装已配置的插件包，以及检查活跃插件载荷。如果启动过程无法安全修复，请针对同一挂载的状态/配置，使用 `openclaw doctor --fix` 运行同一镜像一次，然后再正常重启容器。

  </Accordion>
  <Accordion title="8. Gateway 网关服务迁移和清理提示">
    Doctor 会检测旧版 Gateway 网关服务（launchd/systemd/schtasks），提供移除这些服务并使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它还可以扫描其他类似 Gateway 网关的服务并输出清理提示。具有配置文件名称的 OpenClaw Gateway 网关服务被视为一等服务，不会标记为“额外”。

    在 Linux 上，如果用户级 Gateway 网关服务缺失，但存在系统级 OpenClaw Gateway 网关服务，Doctor 不会自动安装第二个用户级服务。使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 检查，然后移除重复项；如果 Gateway 网关生命周期由系统监控程序管理，则设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 启动时 Matrix 迁移">
    当 Matrix 渠道账户存在待处理或可执行的旧版状态迁移时，Doctor（在 `--fix` / `--repair` 模式下）会创建迁移前快照，然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。这两个步骤都不是致命步骤；错误会被记录，启动会继续。在只读模式下（使用 `openclaw doctor` 且不使用 `--fix`），将完全跳过此检查。
  </Accordion>
  <Accordion title="8c. 设备配对和身份验证漂移">
    Doctor 会在常规健康检查过程中检查设备配对状态，并报告：

    - 待处理的首次配对请求
    - 已配对设备待处理的角色或权限范围升级
    - 设备 ID 仍然匹配、但设备身份与已批准记录不再匹配时的公钥不匹配修复
    - 已配对记录缺少已批准角色的活跃令牌
    - 权限范围偏离已批准配对基线的已配对令牌
    - 当前机器上早于 Gateway 网关侧令牌轮换或包含过时权限范围元数据的本地缓存设备令牌条目

    Doctor 不会自动批准配对请求或自动轮换设备令牌。它会输出确切的后续步骤：

    - 使用 `openclaw devices list` 检查待处理请求
    - 使用 `openclaw devices approve <requestId>` 批准确切的请求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换出新令牌
    - 使用 `openclaw devices remove <deviceId>` 移除并重新批准过时记录

    这可以区分首次配对、待处理的角色/权限范围升级以及过时的令牌/设备身份漂移，从而解决常见的“已配对但仍提示需要配对”问题。

  </Accordion>
  <Accordion title="9. 安全警告">
    Doctor 仅在发现警告时才会发出安全说明，例如提供商在没有允许列表的情况下向私信开放，或策略配置存在危险。使用 `openclaw security audit` 查看完整的安全清单。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果作为 systemd 用户服务运行，Doctor 会确保启用 lingering，使 Gateway 网关在注销后继续运行。
  </Accordion>
  <Accordion title="11. 工作区状态（Skills、插件和 TaskFlows）">
    Doctor 会输出默认智能体的问题和操作，而不是健康状态清单：

    - **Skills**：列出已允许但无法使用的技能名称；使用 `openclaw skills check` 查看要求详情和完整计数。
    - **插件**：仅报告出错的插件 ID；使用 `openclaw plugins list` 查看已加载、已导入、已禁用和内置插件清单。
    - **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
    - **插件诊断**：显示插件注册表在加载时发出的所有警告或错误。
    - **TaskFlow 恢复**：显示需要手动检查或取消的可疑托管 TaskFlow。
    - **Claude CLI**：仅报告二进制文件、身份验证、配置文件、工作区或项目目录问题；省略健康探测详情。

  </Accordion>
  <Accordion title="11b. 引导文件大小">
    Doctor 会检查工作区引导文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过配置的字符预算。它会按文件报告原始字符数与注入字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及注入字符总数占总预算的比例。文件被截断或接近限制时，Doctor 会输出调整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11c. Shell 补全">
    Doctor 会检查当前 Shell（zsh、bash、fish 或 PowerShell）是否安装了 Tab 补全：

    - 如果 Shell 配置文件使用缓慢的动态补全模式（`source <(openclaw completion ...)`），Doctor 会将其升级为更快的缓存文件变体。
    - 如果配置文件中配置了补全，但缓存文件缺失，Doctor 会自动重新生成缓存。
    - 如果完全未配置补全，Doctor 会提示安装（仅限交互模式；使用 `--non-interactive` 时跳过）。

    运行 `openclaw completion --write-state` 可手动重新生成缓存。

  </Accordion>
  <Accordion title="11d. 过时渠道插件清理">
    当 `openclaw doctor --fix` 移除缺失的渠道插件时，它还会移除引用该插件的悬空渠道范围配置：`channels.<id>` 条目、指定该渠道的 Heartbeat 目标，以及 `agents.*.models["<channel>/*"]` 覆盖项。这可以防止渠道运行时已消失、但配置仍要求 Gateway 网关绑定到该渠道而造成的 Gateway 网关启动循环。
  </Accordion>
  <Accordion title="12. Gateway 网关身份验证检查（本地令牌）">
    Doctor 会检查本地 Gateway 网关令牌身份验证是否就绪。

    - 如果令牌模式需要令牌但不存在令牌来源，Doctor 会提供生成令牌的选项。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，Doctor 会发出警告，并且不会使用明文覆盖它。
    - `openclaw doctor --generate-gateway-token` 仅在未配置令牌 SecretRef 时强制生成令牌。

  </Accordion>
  <Accordion title="12b. 感知 SecretRef 的只读修复">
    某些修复流程需要检查已配置的凭据，同时不削弱运行时的快速失败行为。

    - `openclaw doctor --fix` 使用与状态系列命令相同的只读 SecretRef 摘要模型进行针对性的配置修复。
    - 示例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修复会尝试使用已配置的 Bot 凭据（如果可用）。
    - 如果 Telegram Bot 令牌通过 SecretRef 配置，但在当前命令路径中不可用，Doctor 会报告该凭据已配置但不可用，并跳过自动解析，而不会崩溃或误报令牌缺失。

  </Accordion>
  <Accordion title="13. Gateway 健康检查 + 重启">
    Doctor 会运行健康检查，并在 Gateway 网关看起来不健康时提议重启。
  </Accordion>
  <Accordion title="13b. 记忆搜索就绪状态">
    Doctor 会检查为默认智能体配置的记忆搜索嵌入提供商是否就绪。其行为取决于配置的后端和提供商：

    - **QMD 后端**：探测 `qmd` 二进制文件是否可用且可启动。若不可用，则输出修复指导，包括 `npm install -g @tobilu/qmd`（或对应的 Bun 命令）以及手动指定二进制文件路径的选项。
    - **显式本地提供商**：检查本地模型文件或可识别的远程/可下载模型 URL。如果缺失，则建议切换到远程提供商。
    - **显式远程提供商**（`openai`、`voyage` 等）：验证环境或身份验证存储中是否存在 API 密钥。如果缺失，则输出可操作的修复提示。
    - **旧版自动提供商**：将 `memorySearch.provider: "auto"` 视为 OpenAI，检查 OpenAI 就绪状态，并且 `doctor --fix` 会将其重写为 `provider: "openai"`。

    当缓存的 Gateway 网关探测结果可用时（检查时 Gateway 网关处于健康状态），Doctor 会将该结果与 CLI 可见的配置进行交叉核对，并指出任何差异。Doctor 不会在默认路径上启动新的嵌入探测；如需实时检查提供商，请使用深度记忆状态命令。

    使用 `openclaw memory status --deep` 验证运行时的嵌入就绪状态。

  </Accordion>
  <Accordion title="14. 渠道状态警告">
    如果 Gateway 网关健康，Doctor 会运行渠道状态探测，并报告警告及建议的修复方法。
  </Accordion>
  <Accordion title="15. 监督程序配置审计 + 修复">
    Doctor 会检查已安装的监督程序配置（launchd/systemd/schtasks）是否缺少默认设置或使用了过时的默认设置（例如 systemd 的 network-online 依赖项和重启延迟）。发现不匹配时，它会建议更新，并可将服务文件/任务重写为当前默认设置。

    注意：

    - `openclaw doctor` 会在重写监督程序配置前提示确认。
    - `openclaw doctor --yes` 接受默认修复提示。
    - `openclaw doctor --fix` 无需提示即可应用建议的修复（`--repair` 是其别名）。
    - `openclaw doctor --fix --force` 会覆盖自定义监督程序配置。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 使 Doctor 对 Gateway 网关服务生命周期保持只读。它仍会报告服务健康状态并执行非服务修复，但会跳过服务安装/启动/重启/引导、监督程序配置重写和旧版服务清理，因为该生命周期由外部监督程序负责。
    - 在 Linux 上，当匹配的 systemd Gateway 网关单元处于活动状态时，Doctor 不会重写命令/入口点元数据。在扫描重复服务时，它还会忽略处于非活动状态且非旧版的额外类 Gateway 网关单元，以免配套服务文件产生清理噪声。
    - 如果令牌身份验证需要令牌，并且 `gateway.auth.token` 由 SecretRef 管理，则 Doctor 的服务安装/修复会验证 SecretRef，但不会将解析后的明文令牌值持久化到监督程序服务环境元数据中。
    - Doctor 会检测旧版 LaunchAgent、systemd 或 Windows 计划任务安装以内联方式嵌入的、由 `.env`/SecretRef 支持的托管服务环境值，并重写服务元数据，使这些值从运行时来源加载，而不是从监督程序定义加载。
    - Doctor 会检测在 `gateway.port` 更改后，服务命令是否仍固定使用旧的 `--port`，并将服务元数据重写为当前端口。
    - 如果令牌身份验证需要令牌，而配置的令牌 SecretRef 未解析，Doctor 会阻止安装/修复路径并提供可操作的指导。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，Doctor 会阻止安装/修复，直到显式设置模式。
    - 对于 Linux 用户 systemd 单元，Doctor 在比较服务身份验证元数据时，其令牌漂移检查会同时包括 `Environment=` 和 `EnvironmentFile=` 来源。
    - 当配置最后由较新版本写入时，Doctor 服务修复会拒绝使用较旧的 OpenClaw 二进制文件重写、停止或重启 Gateway 网关服务。请参阅 [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你始终可以通过 `openclaw gateway install --force` 强制完整重写。

  </Accordion>
  <Accordion title="16. Gateway 网关运行时 + 端口诊断">
    Doctor 会检查服务运行时（PID、上次退出状态），并在服务已安装但实际上未运行时发出警告。它还会检查 Gateway 网关端口（默认 `18789`）是否存在端口冲突，并报告可能的原因（Gateway 网关已在运行、SSH 隧道）。
  </Accordion>
  <Accordion title="17. Gateway 网关运行时最佳实践">
    当 Gateway 网关服务在 Bun 或由版本管理器管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上运行时，Doctor 会发出警告。Bun 无法打开 OpenClaw 的 `node:sqlite` 状态存储，因此修复操作会将旧版 Bun 服务迁移到 Node。版本管理器路径可能在升级后失效，因为服务不会加载你的 shell 初始化配置。当系统 Node 安装可用时（Homebrew/apt/choco），Doctor 会提议迁移到该安装。

    新安装或修复的 macOS LaunchAgent 使用规范的系统 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是复制交互式 shell 的 PATH。这样既能保持 Homebrew 管理的系统二进制文件可用，又能避免 Volta、asdf、fnm、pnpm 和其他版本管理器目录改变 Node 子进程解析到的版本。Linux 服务仍会保留显式环境根目录（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和稳定的用户二进制文件目录，但仅当推测的版本管理器后备目录确实存在于磁盘上时，才会将其写入服务 PATH。

  </Accordion>
  <Accordion title="18. 配置写入 + 向导元数据">
    Doctor 会持久化所有配置更改，并写入向导元数据以记录此次 Doctor 运行。
  </Accordion>
  <Accordion title="19. 工作区提示（备份 + 记忆系统）">
    如果缺少工作区记忆系统，Doctor 会建议添加；如果工作区尚未纳入 git 管理，则会输出备份提示。

    有关工作区结构和 git 备份的完整指南，请参阅 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)（建议使用私有 GitHub 或 GitLab 仓库）。

  </Accordion>
</AccordionGroup>

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)
