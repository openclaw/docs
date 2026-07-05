---
read_when:
    - 查询特定的新手引导步骤或标志
    - 使用非交互模式自动化新手引导
    - 调试新手引导行为
sidebarTitle: Onboarding Reference
summary: CLI 新手引导的完整参考：每个步骤、标志和配置字段
title: 新手引导参考
x-i18n:
    generated_at: "2026-07-05T11:41:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1f85ca510c55ad572ce7595faebe4461567785b18851914a5f7818615c517a3
    source_path: reference/wizard.md
    workflow: 16
---

这是 `openclaw onboard` 的完整参考。
如需高层概览，请参阅 [新手引导（CLI）](/zh-CN/start/wizard)。如需逐步
行为和输出，请参阅 [CLI 设置参考](/zh-CN/start/wizard-cli-reference)。

## 流程详情（本地模式）

<Steps>
  <Step title="重置（可选）">
    - `--reset` 会在设置运行前重置状态；如果未使用它，重新运行新手引导
      会保留现有配置，并将其复用为默认值。
    - `--reset-scope` 控制 `--reset` 移除的内容：`config`（仅配置文件）、`config+creds+sessions`（默认），或 `full`（也会移除
      工作区）。
    - 如果配置文件无效，新手引导会停止，并提示你先运行
      `openclaw doctor`，然后重新运行设置。
    - 重置会将状态移到废纸篓（绝不会直接删除）。

  </Step>
  <Step title="风险确认">
    - 首次运行（或在设置 `wizard.securityAcknowledgedAt` 前的任何运行）
      会要求你确认自己理解智能体能力很强，完整
      系统访问权限有风险。
    - `--non-interactive` 明确要求 `--accept-risk`；如果没有它，
      新手引导会报错退出，而不是提示输入。
    - 交互式运行会显示确认提示，而不是使用该标志；拒绝
      会取消设置。

  </Step>
  <Step title="模型/凭证">
    - **Anthropic API key**：如果存在则使用 `ANTHROPIC_API_KEY`，否则提示输入密钥，然后保存它供守护进程使用。
    - **Anthropic Claude CLI**：当已存在 Claude CLI 登录时，这是首选本地路径；OpenClaw 仍支持 Anthropic setup-token 凭证作为替代方式。
    - **OpenAI Code (Codex) subscription (OAuth)**：浏览器流程；粘贴 `code#state`。
      - 当模型未设置或已是 OpenAI 系列时，通过 Codex runtime 将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。
    - **OpenAI Code (Codex) subscription (device pairing)**：使用短期设备代码的浏览器配对流程。
      - 当模型未设置或已是 OpenAI 系列时，通过 Codex runtime 将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。
    - **OpenAI API key**：如果存在则使用 `OPENAI_API_KEY`，否则提示输入密钥，然后将其存储到凭证配置文件中。
      - 当模型未设置、为 `openai/*` 或旧版 Codex 模型引用时，将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。
    - **xAI OAuth**：设备代码浏览器登录，无需 localhost 回调，因此也可通过 SSH/Docker/VPS 使用（`--auth-choice xai-oauth`）。
    - **xAI API key**：提示输入 `XAI_API_KEY`（`--auth-choice xai-api-key`）。
    - `--auth-choice xai-device-code` 仍可作为同一 xAI OAuth 设备代码流程的手动专用兼容别名；新脚本请使用 `xai-oauth`。
    - **OpenCode**：提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可在 https://opencode.ai/auth 获取），并让你选择 Zen 或 Go 目录。
    - **Ollama**：首先提供 **Cloud + Local**、**Cloud only** 或 **Local only**。`Cloud only` 会提示输入 `OLLAMA_API_KEY` 并使用 `https://ollama.com`；主机支撑的模式会提示输入 Ollama 基础 URL（默认 `http://127.0.0.1:11434`）、发现可用模型，并在需要时自动拉取选定的本地模型；`Cloud + Local` 还会检查该 Ollama 主机是否已登录以访问云端。
    - 更多详情：[Ollama](/zh-CN/providers/ollama)
    - **API key**：为你存储密钥。
    - **Vercel AI Gateway（多模型代理）**：提示输入 `AI_GATEWAY_API_KEY`。
    - 更多详情：[Vercel AI Gateway](/zh-CN/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**：提示输入 Account ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多详情：[Cloudflare AI Gateway](/zh-CN/providers/cloudflare-ai-gateway)
    - **MiniMax**：配置会自动写入；托管默认值为 `MiniMax-M3`。
      API-key 设置使用 `minimax/...`，OAuth 设置使用
      `minimax-portal/...`。
    - 更多详情：[MiniMax](/zh-CN/providers/minimax)
    - **StepFun**：会为中国或全球端点上的 StepFun 标准版或 Step Plan 自动写入配置。
    - 标准版当前默认使用 `step-3.5-flash`；Step Plan 还包含 `step-3.5-flash-2603`。
    - 更多详情：[StepFun](/zh-CN/providers/stepfun)
    - **Synthetic（Anthropic 兼容）**：提示输入 `SYNTHETIC_API_KEY`。
    - 更多详情：[Synthetic](/zh-CN/providers/synthetic)
    - **Moonshot（Kimi K2）**：配置会自动写入。
    - **Kimi Coding**：配置会自动写入。
    - 更多详情：[Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)
    - **自定义提供商**：适用于 OpenAI 兼容、OpenAI Responses 兼容或 Anthropic 兼容端点。非交互标志：`--auth-choice custom-api-key`、`--custom-base-url`、`--custom-model-id`、`--custom-api-key`（可选；回退到 `CUSTOM_API_KEY`）、`--custom-provider-id`（可选；从基础 URL 自动派生）、`--custom-compatibility openai|openai-responses|anthropic`（默认 `openai`）、`--custom-image-input` / `--custom-text-input`（覆盖推断的视觉模型检测）。
    - **跳过**：尚未配置凭证。
    - 从检测到的选项中选择默认模型（或手动输入提供商/模型）。为获得最佳质量并降低提示注入风险，请选择你的提供商栈中可用的最强最新一代模型。
    - 新手引导会运行模型检查，并在配置的模型未知或缺少凭证时发出警告。
    - API key 存储模式默认使用明文凭证配置文件值。使用 `--secret-input-mode ref` 可改为存储由环境变量支撑的引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）；引用的环境变量必须已设置，否则新手引导会快速失败。
    - 凭证配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API keys + OAuth）。`~/.openclaw/credentials/oauth.json` 仅用于旧版导入。
    - 更多详情：[OAuth](/zh-CN/concepts/oauth)
    <Note>
    无头/服务器提示：在带浏览器的机器上完成 OAuth，然后复制
    该智能体的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或匹配的
    `$OPENCLAW_STATE_DIR/...` 路径）到 Gateway 网关主机。`credentials/oauth.json`
    仅是旧版导入来源。
    </Note>
  </Step>
  <Step title="工作区">
    - 默认 `~/.openclaw/workspace`（可配置）。
    - 播种智能体启动仪式所需的工作区文件。
    - 完整工作区布局 + 备份指南：[Agent 工作区](/zh-CN/concepts/agent-workspace)

  </Step>
  <Step title="Gateway 网关">
    - 端口（默认 **18789**）、绑定、凭证模式、Tailscale 暴露。
    - 凭证建议：即使对 loopback，也保持 **Token**，这样本地 WS 客户端必须进行身份验证。
    - 在 token 模式下，交互式设置会提供：
      - **生成/存储明文 token**（默认）
      - **使用 SecretRef**（选择启用）
      - Quickstart 会在 `env`、`file` 和 `exec` 提供商之间复用现有 `gateway.auth.token` SecretRefs，用于新手引导探测/仪表板启动。
      - 如果该 SecretRef 已配置但无法解析，新手引导会提前失败，并显示清晰的修复消息，而不是静默降低运行时凭证保护。
    - 在密码模式下，交互式设置也支持明文或 SecretRef 存储。
    - 非交互 token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求新手引导进程环境中存在非空环境变量。
      - 不能与 `--gateway-token` 组合使用。
    - 仅当你完全信任每个本地进程时才禁用凭证。
    - 非 loopback 绑定仍要求凭证。

  </Step>
  <Step title="渠道">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选 QR 登录。
    - [Telegram](/zh-CN/channels/telegram)：bot token。
    - [Discord](/zh-CN/channels/discord)：bot token。
    - [Google Chat](/zh-CN/channels/googlechat)：服务账号 JSON + webhook audience。
    - [Mattermost](/zh-CN/channels/mattermost)（插件）：bot token + 基础 URL。
    - [Signal](/zh-CN/channels/signal)（插件）：可选 `signal-cli` 安装 + 账号配置。
    - [iMessage](/zh-CN/channels/imessage)：`imsg` CLI 路径 + Messages DB 访问权限；当 Gateway 网关运行在非 Mac 上时，请使用 SSH 包装器。
    - Discord、Feishu、Microsoft Teams、QQ Bot、Slack 和其他渠道以
      插件形式提供，新手引导可以为你安装。完整目录：[Channels](/zh-CN/channels)。
    - 私信安全：默认使用配对。第一条私信会发送代码；通过 `openclaw pairing approve <channel> <code>` 批准，或使用 allowlists。

  </Step>
  <Step title="Web 搜索">
    - 选择支持的提供商，例如 Brave、Codex（Hosted Search）、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Parallel、Perplexity、SearXNG 或 Tavily（或跳过）。
    - API 支撑的提供商可以使用环境变量或现有配置进行快速设置；免密钥提供商则使用其提供商特定的先决条件。
    - 使用 `--skip-search` 跳过。
    - 稍后配置：`openclaw configure --section web`。

  </Step>
  <Step title="守护进程安装">
    - macOS：LaunchAgent
      - 要求已登录的用户会话；对于无头环境，请使用自定义 LaunchDaemon（未随附）。
    - Linux（以及通过 WSL2 的 Windows）：systemd 用户单元
      - 新手引导会尝试通过 `loginctl enable-linger <user>` 启用 linger，使 Gateway 网关在登出后保持运行。
      - 可能提示输入 sudo（写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - 原生 Windows：优先使用 Scheduled Task；如果任务创建被拒绝，OpenClaw 会回退到每用户 Startup-folder 登录项，并立即启动 Gateway 网关。
    - **运行时选择：**Node（推荐；WhatsApp/Telegram 必需 - Bun 在重新连接时可能损坏内存）。交互式流程仅提供 Node；`--daemon-runtime bun` 仅限 CLI 使用。
    - 如果 token 凭证需要 token 且 `gateway.auth.token` 由 SecretRef 管理，守护进程安装会验证它，但不会将解析出的明文 token 值持久化到 supervisor 服务环境元数据中。
    - 如果 token 凭证需要 token 且配置的 token SecretRef 未解析，守护进程安装会被阻止，并提供可执行的指导。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，守护进程安装会被阻止，直到显式设置模式。

  </Step>
  <Step title="健康检查">
    - 启动 Gateway 网关（如需要）并运行 `openclaw health`。
    - 提示：`openclaw status --deep` 会将实时 Gateway 网关健康探测添加到状态输出中，包括受支持时的渠道探测（要求 Gateway 网关可访问）。

  </Step>
  <Step title="Skills（推荐）">
    - 读取可用 Skills 并检查要求。
    - 让你选择节点管理器：**npm / pnpm / bun**。
    - 自动为受信任的内置 Skills 安装可选依赖（部分在 macOS 上使用 Homebrew）。
    - 跳过 Homebrew、uv 或 Go 安装器先决条件不可用的 Skills，将它们与手动设置指导分组，并在先决条件安装后指引你运行 `openclaw doctor`。

  </Step>
  <Step title="完成">
    - 摘要 + 后续步骤，包括面向 Terminal、Browser 或稍后操作的 **你想如何孵化你的智能体？** 提示。

  </Step>
</Steps>

<Note>
如果未检测到 GUI，新手引导会打印 Control UI 的 SSH 端口转发说明，而不是打开浏览器。
如果缺少 Control UI 资产，新手引导会尝试构建它们；回退方式是 `pnpm ui:build`（自动安装 UI 依赖）。
</Note>

## 非交互模式

使用 `--non-interactive --accept-risk` 自动化或脚本化新手引导（该
标志是必需的风险确认；没有它，新手引导会报错
退出）：

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

添加 `--json` 可获得机器可读摘要。

非交互模式下的 Gateway 网关 token SecretRef：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` 和 `--gateway-token-ref-env` 互斥。

<Note>
`--json` **不会**隐含非交互模式。脚本请使用 `--non-interactive --accept-risk`（以及 `--workspace`）。
</Note>

提供商专用命令示例位于 [CLI 自动化](/zh-CN/start/wizard-cli-automation#provider-specific-examples)。
使用本参考页了解标志语义和步骤顺序。

### 添加智能体（非交互）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` 是保留的智能体 ID，不能用于 `openclaw agents add`。

## Gateway 网关向导 RPC

Gateway 网关通过 RPC（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）暴露新手引导流程。
客户端（macOS 应用、Control UI）可以渲染步骤，而无需重新实现新手引导逻辑。

## Signal 设置（signal-cli）

新手引导会检测 `signal-cli` 是否在 `PATH` 上；如果缺失，会提供安装：

- Linux x86-64：从 `signal-cli` GitHub releases 下载官方原生 GraalVM 构建，并将其存储在 `~/.openclaw/tools/signal-cli/<version>/` 下。
- macOS 和其他架构：改为通过 Homebrew 安装。
- 原生 Windows：尚不支持；请在 WSL2 内运行新手引导，以获得 Linux 安装路径。
- 无论哪种方式，都会将 `channels.signal.cliPath` 写入你的配置。

## 向导写入的内容

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- 传入 `--skip-bootstrap` 时的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果选择了 Minimax）
- `tools.profile`（本地新手引导在未设置时默认为 `"coding"`；会保留现有显式值）
- `gateway.*`（模式、绑定、凭证、Tailscale）
- `session.dmScope`（本地新手引导在未设置时默认为 `"per-channel-peer"`；会保留现有显式值。详情：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 当你在渠道提示中选择启用时，会写入渠道私信允许列表。Discord、Matrix、Microsoft Teams 和 Slack 会尽可能将名称解析为 ID；其他渠道直接接受 ID（例如数字 Telegram 发送者 ID 或 WhatsApp 电话号码）。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手动配置仍可通过直接设置 `skills.install.nodeManager` 来使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` 会写入 `agents.list[]` 和可选的 `bindings`。

WhatsApp 凭证位于 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

部分渠道以插件形式交付。当你在设置期间选择其中一个渠道时，新手引导
会在配置前提示安装它（npm 或本地路径）。

## 相关文档

- 新手引导概览：[新手引导（CLI）](/zh-CN/start/wizard)
- CLI 设置参考：[CLI 设置参考](/zh-CN/start/wizard-cli-reference)
- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 配置参考：[Gateway 配置](/zh-CN/gateway/configuration)
- 提供商：[WhatsApp](/zh-CN/channels/whatsapp)、[Telegram](/zh-CN/channels/telegram)、[Discord](/zh-CN/channels/discord)、[Google Chat](/zh-CN/channels/googlechat)、[Signal](/zh-CN/channels/signal)、[iMessage](/zh-CN/channels/imessage)
- Skills：[Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config)
