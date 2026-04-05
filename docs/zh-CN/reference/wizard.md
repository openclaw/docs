---
read_when:
    - 查找某个特定的新手引导步骤或标志时
    - 使用非交互模式自动化新手引导时
    - 调试新手引导行为时
sidebarTitle: Onboarding Reference
summary: CLI 新手引导的完整参考：每一步、每个标志和每个配置字段
title: 新手引导参考
x-i18n:
    generated_at: "2026-04-05T10:09:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae6c76a31885c0678af2ac71254c5baf08f6de5481f85f6cfdf44d473946fdb8
    source_path: reference/wizard.md
    workflow: 15
---

# 新手引导参考

这是 `openclaw onboard` 的完整参考。
如需高层概览，请参见 [设置向导（CLI）](/zh-CN/start/wizard)。

## 流程详情（本地模式）

<Steps>
  <Step title="现有配置检测">
    - 如果 `~/.openclaw/openclaw.json` 已存在，请选择**保留 / 修改 / 重置**。
    - 重新运行新手引导**不会**清除任何内容，除非你明确选择**重置**
      （或传入 `--reset`）。
    - CLI `--reset` 默认使用 `config+creds+sessions`；使用 `--reset-scope full`
      还会移除工作区。
    - 如果配置无效或包含旧版键，向导会停止并要求
      你先运行 `openclaw doctor`，然后才能继续。
    - 重置使用 `trash`（绝不使用 `rm`），并提供以下范围：
      - 仅配置
      - 配置 + 凭证 + 会话
      - 完全重置（也会移除工作区）
  </Step>
  <Step title="模型/认证">
    - **Anthropic API 密钥**：如果存在则使用 `ANTHROPIC_API_KEY`，否则提示输入密钥，然后保存以供守护进程使用。
    - **Anthropic Claude CLI**：这是在新手引导/配置中首选的 Anthropic 助手选项。在 macOS 上，新手引导会检查 Keychain 条目 “Claude Code-credentials”（请选择 “Always Allow”，以免 launchd 启动被阻塞）；在 Linux/Windows 上，如果存在，则会复用 `~/.claude/.credentials.json`，并将模型选择切换为规范的 `claude-cli/claude-*` 引用。
    - **Anthropic setup-token（旧版/手动）**：现已重新在新手引导/配置中提供，但 Anthropic 已告知 OpenClaw 用户，OpenClaw Claude 登录路径属于第三方 harness 用法，并且 Claude 账户需要启用 **Extra Usage**。
    - **OpenAI Code（Codex）订阅（Codex CLI）**：如果存在 `~/.codex/auth.json`，新手引导可以复用它。复用的 Codex CLI 凭证仍由 Codex CLI 管理；过期后，OpenClaw 会优先重新读取该来源，并且当提供商可以刷新它时，会将刷新后的凭证写回 Codex 存储，而不是自行接管。
    - **OpenAI Code（Codex）订阅（OAuth）**：浏览器流程；粘贴 `code#state`。
      - 当模型未设置或为 `openai/*` 时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.4`。
    - **OpenAI API 密钥**：如果存在则使用 `OPENAI_API_KEY`，否则提示输入密钥，然后将其存储到认证配置文件中。
      - 当模型未设置、为 `openai/*` 或为 `openai-codex/*` 时，将 `agents.defaults.model` 设置为 `openai/gpt-5.4`。
    - **xAI（Grok）API 密钥**：提示输入 `XAI_API_KEY` 并将 xAI 配置为模型提供商。
    - **OpenCode**：提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可在 https://opencode.ai/auth 获取），并让你选择 Zen 或 Go 目录。
    - **Ollama**：提示输入 Ollama 基础 URL，提供 **Cloud + Local** 或 **Local** 模式，发现可用模型，并在需要时自动拉取所选本地模型。
    - 更多详情：[Ollama](/zh-CN/providers/ollama)
    - **API 密钥**：为你存储该密钥。
    - **Vercel AI Gateway 网关（多模型代理）**：提示输入 `AI_GATEWAY_API_KEY`。
    - 更多详情：[Vercel AI Gateway 网关](/zh-CN/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway 网关**：提示输入 Account ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多详情：[Cloudflare AI Gateway 网关](/zh-CN/providers/cloudflare-ai-gateway)
    - **MiniMax**：会自动写入配置；托管默认值为 `MiniMax-M2.7`。
      API 密钥设置使用 `minimax/...`，而 OAuth 设置使用
      `minimax-portal/...`。
    - 更多详情：[MiniMax](/zh-CN/providers/minimax)
    - **StepFun**：会为中国或全球端点上的 StepFun standard 或 Step Plan 自动写入配置。
    - Standard 当前包括 `step-3.5-flash`，而 Step Plan 还包括 `step-3.5-flash-2603`。
    - 更多详情：[StepFun](/providers/stepfun)
    - **Synthetic（Anthropic 兼容）**：提示输入 `SYNTHETIC_API_KEY`。
    - 更多详情：[Synthetic](/zh-CN/providers/synthetic)
    - **Moonshot（Kimi K2）**：会自动写入配置。
    - **Kimi Coding**：会自动写入配置。
    - 更多详情：[Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)
    - **Skip**：尚未配置认证。
    - 从检测到的选项中选择一个默认模型（或手动输入 provider/model）。为了获得最佳质量并降低 prompt injection 风险，请选择你提供商栈中可用的最强最新一代模型。
    - 新手引导会运行模型检查，并在已配置模型未知或缺少认证时发出警告。
    - API 密钥存储模式默认使用明文 auth-profile 值。使用 `--secret-input-mode ref` 可改为存储由环境变量支持的 refs（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - 认证配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API 密钥 + OAuth）。`~/.openclaw/credentials/oauth.json` 仅用于旧版导入。
    - 更多详情：[/concepts/oauth](/zh-CN/concepts/oauth)
    <Note>
    无头/服务器提示：请在有浏览器的机器上完成 OAuth，然后将
    该智能体的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或对应的
    `$OPENCLAW_STATE_DIR/...` 路径）复制到 gateway host。`credentials/oauth.json`
    只是旧版导入来源。
    </Note>
  </Step>
  <Step title="工作区">
    - 默认为 `~/.openclaw/workspace`（可配置）。
    - 会初始化智能体 bootstrap 流程所需的工作区文件。
    - 完整的工作区布局和备份指南：[智能体工作区](/zh-CN/concepts/agent-workspace)
  </Step>
  <Step title="Gateway 网关">
    - 端口、绑定、认证模式、Tailscale 暴露。
    - 认证建议：即使是 loopback，也请保留**令牌**，这样本地 WS 客户端也必须认证。
    - 在令牌模式下，交互式设置提供：
      - **生成/存储明文令牌**（默认）
      - **使用 SecretRef**（可选启用）
      - 快速开始会在新手引导探测/dashboard bootstrap 中复用现有的 `gateway.auth.token` SecretRef，包括 `env`、`file` 和 `exec` 提供商。
      - 如果该 SecretRef 已配置但无法解析，新手引导会尽早失败，并显示清晰的修复消息，而不是静默降级运行时认证。
    - 在密码模式下，交互式设置也支持明文或 SecretRef 存储。
    - 非交互式令牌 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求在新手引导进程环境中存在非空环境变量。
      - 不能与 `--gateway-token` 一起使用。
    - 只有在你完全信任每个本地进程时才禁用认证。
    - 非 loopback 绑定仍然要求认证。
  </Step>
  <Step title="渠道">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选 QR 登录。
    - [Telegram](/zh-CN/channels/telegram)：机器人令牌。
    - [Discord](/zh-CN/channels/discord)：机器人令牌。
    - [Google Chat](/zh-CN/channels/googlechat)：服务账号 JSON + webhook audience。
    - [Mattermost](/zh-CN/channels/mattermost)（插件）：机器人令牌 + 基础 URL。
    - [Signal](/zh-CN/channels/signal)：可选 `signal-cli` 安装 + 账号配置。
    - [BlueBubbles](/zh-CN/channels/bluebubbles)：**iMessage 的推荐方案**；服务器 URL + 密码 + webhook。
    - [iMessage](/zh-CN/channels/imessage)：旧版 `imsg` CLI 路径 + DB 访问。
    - 私信安全：默认使用配对。首次私信会发送一个代码；通过 `openclaw pairing approve <channel> <code>` 批准，或使用 allowlists。
  </Step>
  <Step title="Web 搜索">
    - 选择受支持的提供商，例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG 或 Tavily（或跳过）。
    - 基于 API 的提供商可以使用环境变量或现有配置来快速设置；无密钥提供商则使用其提供商特定的前置条件。
    - 使用 `--skip-search` 跳过。
    - 稍后配置：`openclaw configure --section web`。
  </Step>
  <Step title="守护进程安装">
    - macOS：LaunchAgent
      - 需要已登录的用户会话；对于无头场景，请使用自定义 LaunchDaemon（未内置提供）。
    - Linux（以及通过 WSL2 的 Windows）：systemd 用户单元
      - 新手引导会尝试通过 `loginctl enable-linger <user>` 启用 lingering，以便 Gateway 网关在注销后仍保持运行。
      - 可能会提示 sudo（会写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - **运行时选择：** Node（推荐；WhatsApp/Telegram 必需）。**不推荐**使用 Bun。
    - 如果令牌认证需要令牌，且 `gateway.auth.token` 由 SecretRef 管理，守护进程安装会验证它，但不会把解析后的明文令牌值持久化到 supervisor 服务环境元数据中。
    - 如果令牌认证需要令牌，而已配置的令牌 SecretRef 未解析，守护进程安装会被阻止，并提供可操作的指导。
    - 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置，而 `gateway.auth.mode` 未设置，守护进程安装会被阻止，直到显式设置 mode。
  </Step>
  <Step title="健康检查">
    - 启动 Gateway 网关（如果需要）并运行 `openclaw health`。
    - 提示：`openclaw status --deep` 会在状态输出中添加实时 Gateway 网关健康探测，包括在支持时的渠道探测（需要可达的 Gateway 网关）。
  </Step>
  <Step title="Skills（推荐）">
    - 读取可用的 Skills 并检查要求。
    - 让你选择一个 node 管理器：**npm / pnpm**（不推荐 bun）。
    - 安装可选依赖（有些在 macOS 上使用 Homebrew）。
  </Step>
  <Step title="完成">
    - 摘要 + 后续步骤，包括 iOS/Android/macOS 应用以启用更多功能。
  </Step>
</Steps>

<Note>
如果未检测到 GUI，新手引导会打印用于控制 UI 的 SSH 端口转发说明，而不是打开浏览器。
如果控制 UI 资源缺失，新手引导会尝试构建它们；回退命令为 `pnpm ui:build`（会自动安装 UI 依赖）。
</Note>

## 非交互模式

使用 `--non-interactive` 来自动化或脚本化新手引导：

```bash
openclaw onboard --non-interactive \
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

在非交互模式中使用 Gateway 网关令牌 SecretRef：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` 和 `--gateway-token-ref-env` 互斥。

<Note>
`--json` **不**意味着非交互模式。对于脚本，请使用 `--non-interactive`（以及 `--workspace`）。
</Note>

特定提供商的命令示例位于 [CLI 自动化](/zh-CN/start/wizard-cli-automation#provider-specific-examples)。
此参考页用于说明标志语义和步骤顺序。

### 添加智能体（非交互）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway 网关向导 RPC

Gateway 网关通过 RPC 暴露新手引导流程（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）。
客户端（macOS 应用、控制 UI）可以渲染这些步骤，而无需重新实现新手引导逻辑。

## Signal 设置（signal-cli）

新手引导可以从 GitHub releases 安装 `signal-cli`：

- 下载相应的发布资源。
- 将其存储到 `~/.openclaw/tools/signal-cli/<version>/` 下。
- 将 `channels.signal.cliPath` 写入你的配置。

说明：

- JVM 构建需要 **Java 21**。
- 如果可用，会使用原生构建。
- Windows 使用 WSL2；`signal-cli` 安装会在 WSL 内遵循 Linux 流程。

## 向导会写入什么

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果选择了 Minimax）
- `tools.profile`（本地新手引导在未设置时默认为 `"coding"`；现有显式值会被保留）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（行为细节：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 当你在提示中选择启用时的渠道 allowlists（Slack/Discord/Matrix/Microsoft Teams）（名称会在可能时解析为 ID）。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手动配置仍可以通过直接设置 `skills.install.nodeManager` 来使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 会写入 `agents.list[]` 和可选的 `bindings`。

WhatsApp 凭证位于 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

有些渠道以插件形式提供。当你在设置期间选择它时，新手引导
会先提示安装它（npm 或本地路径），然后才能配置。

## 相关文档

- 新手引导概览：[设置向导（CLI）](/zh-CN/start/wizard)
- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 配置参考：[Gateway 网关配置](/zh-CN/gateway/configuration)
- 提供商：[WhatsApp](/zh-CN/channels/whatsapp)、[Telegram](/zh-CN/channels/telegram)、[Discord](/zh-CN/channels/discord)、[Google Chat](/zh-CN/channels/googlechat)、[Signal](/zh-CN/channels/signal)、[BlueBubbles](/zh-CN/channels/bluebubbles)（iMessage）、[iMessage](/zh-CN/channels/imessage)（旧版）
- Skills：[Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config)
