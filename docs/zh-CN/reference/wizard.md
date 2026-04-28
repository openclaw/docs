---
read_when:
    - 查找特定的新手引导步骤或标志
    - 使用非交互模式自动化新手引导
    - 调试新手引导行为
sidebarTitle: Onboarding Reference
summary: CLI 新手引导的完整参考：每个步骤、标志和配置字段
title: 新手引导参考
x-i18n:
    generated_at: "2026-04-28T12:04:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

这是 `openclaw onboard` 的完整参考。
如需高层概览，请参阅[新手引导（CLI）](/zh-CN/start/wizard)。

## 流程详情（本地模式）

<Steps>
  <Step title="现有配置检测">
    - 如果 `~/.openclaw/openclaw.json` 存在，请选择**保留 / 修改 / 重置**。
    - 重新运行新手引导**不会**清除任何内容，除非你明确选择**重置**
      （或传入 `--reset`）。
    - CLI `--reset` 默认作用于 `config+creds+sessions`；使用 `--reset-scope full`
      还会移除工作区。
    - 如果配置无效或包含旧版键名，向导会停止并要求你先运行
      `openclaw doctor`，然后再继续。
    - 重置使用 `trash`（绝不使用 `rm`）并提供以下范围：
      - 仅配置
      - 配置 + 凭证 + 会话
      - 完整重置（同时移除工作区）

  </Step>
  <Step title="模型/认证">
    - **Anthropic API 密钥**：如果存在则使用 `ANTHROPIC_API_KEY`，否则提示输入密钥，然后保存以供守护进程使用。
    - **Anthropic API 密钥**：新手引导/配置中的首选 Anthropic 助手选项。
    - **Anthropic setup-token**：仍可在新手引导/配置中使用，不过 OpenClaw 现在会在可用时优先复用 Claude CLI。
    - **OpenAI Code（Codex）订阅（OAuth）**：浏览器流程；粘贴 `code#state`。
      - 当模型未设置或已是 OpenAI 系列时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.5`。
    - **OpenAI Code（Codex）订阅（设备配对）**：使用短期设备代码的浏览器配对流程。
      - 当模型未设置或已是 OpenAI 系列时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.5`。
    - **OpenAI API 密钥**：如果存在则使用 `OPENAI_API_KEY`，否则提示输入密钥，然后将其存储到认证配置文件中。
      - 当模型未设置、为 `openai/*` 或 `openai-codex/*` 时，将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。
    - **xAI（Grok）API 密钥**：提示输入 `XAI_API_KEY`，并将 xAI 配置为模型提供商。
    - **OpenCode**：提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可在 https://opencode.ai/auth 获取），并让你选择 Zen 或 Go 目录。
    - **Ollama**：先提供**云端 + 本地**、**仅云端**或**仅本地**。`Cloud only` 会提示输入 `OLLAMA_API_KEY` 并使用 `https://ollama.com`；由主机支持的模式会提示输入 Ollama 基础 URL、发现可用模型，并在需要时自动拉取选定的本地模型；`Cloud + Local` 还会检查该 Ollama 主机是否已登录以获得云端访问权限。
    - 更多详情：[Ollama](/zh-CN/providers/ollama)
    - **API 密钥**：为你存储密钥。
    - **Vercel AI Gateway（多模型代理）**：提示输入 `AI_GATEWAY_API_KEY`。
    - 更多详情：[Vercel AI Gateway](/zh-CN/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**：提示输入账户 ID、Gateway 网关 ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多详情：[Cloudflare AI Gateway](/zh-CN/providers/cloudflare-ai-gateway)
    - **MiniMax**：会自动写入配置；托管默认值为 `MiniMax-M2.7`。
      API 密钥设置使用 `minimax/...`，OAuth 设置使用
      `minimax-portal/...`。
    - 更多详情：[MiniMax](/zh-CN/providers/minimax)
    - **StepFun**：会为中国或全球端点上的 StepFun 标准版或 Step Plan 自动写入配置。
    - 标准版目前包含 `step-3.5-flash`，Step Plan 还包含 `step-3.5-flash-2603`。
    - 更多详情：[StepFun](/zh-CN/providers/stepfun)
    - **Synthetic（兼容 Anthropic）**：提示输入 `SYNTHETIC_API_KEY`。
    - 更多详情：[Synthetic](/zh-CN/providers/synthetic)
    - **Moonshot（Kimi K2）**：会自动写入配置。
    - **Kimi Coding**：会自动写入配置。
    - 更多详情：[Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)
    - **跳过**：暂不配置认证。
    - 从检测到的选项中选择默认模型（或手动输入提供商/模型）。为获得最佳质量并降低提示注入风险，请选择你的提供商栈中可用的最强最新一代模型。
    - 新手引导会运行模型检查，并在配置的模型未知或缺少认证时发出警告。
    - API 密钥存储模式默认使用明文 auth-profile 值。使用 `--secret-input-mode ref` 可改为存储由环境变量支持的引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - 认证配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API 密钥 + OAuth）。`~/.openclaw/credentials/oauth.json` 仅用于旧版导入。
    - 更多详情：[/concepts/oauth](/zh-CN/concepts/oauth)
    <Note>
    无头/服务器提示：在有浏览器的机器上完成 OAuth，然后将
    该智能体的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或匹配的
    `$OPENCLAW_STATE_DIR/...` 路径）复制到 Gateway 网关主机。`credentials/oauth.json`
    仅是旧版导入来源。
    </Note>
  </Step>
  <Step title="工作区">
    - 默认 `~/.openclaw/workspace`（可配置）。
    - 播种智能体引导初始化流程所需的工作区文件。
    - 完整工作区布局 + 备份指南：[Agent 工作区](/zh-CN/concepts/agent-workspace)

  </Step>
  <Step title="Gateway 网关">
    - 端口、绑定、认证模式、Tailscale 暴露。
    - 认证建议：即使对 loopback 也保留 **Token**，这样本地 WS 客户端必须认证。
    - 在 token 模式下，交互式设置提供：
      - **生成/存储明文 token**（默认）
      - **使用 SecretRef**（选择启用）
      - 快速开始会跨 `env`、`file` 和 `exec` 提供商复用现有 `gateway.auth.token` SecretRef，用于新手引导探测/仪表盘引导初始化。
      - 如果该 SecretRef 已配置但无法解析，新手引导会尽早失败并给出明确修复消息，而不是静默降级运行时认证。
    - 在密码模式下，交互式设置也支持明文或 SecretRef 存储。
    - 非交互式 token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求新手引导进程环境中存在非空环境变量。
      - 不能与 `--gateway-token` 组合使用。
    - 仅在你完全信任每个本地进程时才禁用认证。
    - 非 loopback 绑定仍需要认证。

  </Step>
  <Step title="渠道">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选二维码登录。
    - [Telegram](/zh-CN/channels/telegram)：bot token。
    - [Discord](/zh-CN/channels/discord)：bot token。
    - [Google Chat](/zh-CN/channels/googlechat)：服务账号 JSON + webhook audience。
    - [Mattermost](/zh-CN/channels/mattermost)（插件）：bot token + 基础 URL。
    - [Signal](/zh-CN/channels/signal)：可选 `signal-cli` 安装 + 账号配置。
    - [BlueBubbles](/zh-CN/channels/bluebubbles)：**推荐用于 iMessage**；服务器 URL + 密码 + webhook。
    - [iMessage](/zh-CN/channels/imessage)：旧版 `imsg` CLI 路径 + 数据库访问。
    - 私信安全：默认是配对。第一条私信会发送代码；通过 `openclaw pairing approve <channel> <code>` 批准，或使用允许列表。

  </Step>
  <Step title="Web 搜索">
    - 选择受支持的提供商，例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG 或 Tavily（或跳过）。
    - 由 API 支持的提供商可使用环境变量或现有配置进行快速设置；无需密钥的提供商则改用其提供商特定的前置条件。
    - 使用 `--skip-search` 跳过。
    - 稍后配置：`openclaw configure --section web`。

  </Step>
  <Step title="守护进程安装">
    - macOS：LaunchAgent
      - 需要已登录的用户会话；对于无头环境，请使用自定义 LaunchDaemon（未随附）。
    - Linux（以及通过 WSL2 的 Windows）：systemd 用户单元
      - 新手引导会尝试通过 `loginctl enable-linger <user>` 启用 lingering，使 Gateway 网关在注销后保持运行。
      - 可能提示输入 sudo（写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - **运行时选择：** Node（推荐；WhatsApp/Telegram 必需）。Bun **不推荐**。
    - 如果 token 认证需要 token，且 `gateway.auth.token` 由 SecretRef 管理，守护进程安装会验证它，但不会把解析后的明文 token 值持久化到 supervisor 服务环境元数据中。
    - 如果 token 认证需要 token，且配置的 token SecretRef 未解析，守护进程安装会被阻止，并给出可执行的指引。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，守护进程安装会被阻止，直到明确设置模式。

  </Step>
  <Step title="健康检查">
    - 启动 Gateway 网关（如需要）并运行 `openclaw health`。
    - 提示：`openclaw status --deep` 会将实时 Gateway 网关健康探测添加到 Status 输出中，包括受支持时的渠道探测（需要可访问的 Gateway 网关）。

  </Step>
  <Step title="Skills（推荐）">
    - 读取可用 Skills 并检查要求。
    - 让你选择 Node 管理器：**npm / pnpm**（不推荐 bun）。
    - 安装可选依赖项（某些在 macOS 上使用 Homebrew）。

  </Step>
  <Step title="完成">
    - 摘要 + 后续步骤，包括用于额外功能的 iOS/Android/macOS 应用。

  </Step>
</Steps>

<Note>
如果未检测到 GUI，新手引导会打印 Control UI 的 SSH 端口转发说明，而不是打开浏览器。
如果缺少 Control UI 资源，新手引导会尝试构建它们；回退方式是 `pnpm ui:build`（自动安装 UI 依赖项）。
</Note>

## 非交互模式

使用 `--non-interactive` 自动化或脚本化新手引导：

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

非交互模式下的 Gateway 网关 token SecretRef：

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
`--json` **不**意味着非交互模式。脚本请使用 `--non-interactive`（以及 `--workspace`）。
</Note>

提供商特定命令示例位于 [CLI 自动化](/zh-CN/start/wizard-cli-automation#provider-specific-examples)。
使用此参考页了解标志语义和步骤顺序。

### 添加智能体（非交互）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway 网关向导 RPC

Gateway 网关通过 RPC 暴露新手引导流程（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）。
客户端（macOS 应用、Control UI）可以渲染步骤，而无需重新实现新手引导逻辑。

## Signal 设置（signal-cli）

新手引导可以从 GitHub releases 安装 `signal-cli`：

- 下载合适的发布资源。
- 将其存储在 `~/.openclaw/tools/signal-cli/<version>/` 下。
- 将 `channels.signal.cliPath` 写入你的配置。

注意：

- JVM 构建需要 **Java 21**。
- 可用时会使用 Native 构建。
- Windows 使用 WSL2；signal-cli 安装遵循 WSL 内部的 Linux 流程。

## 向导写入的内容

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果选择了 Minimax）
- `tools.profile`（本地新手引导未设置时默认使用 `"coding"`；已有的显式值会保留）
- `gateway.*`（mode, bind, auth, tailscale）
- `session.dmScope`（行为详情：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 当你在提示中选择启用时的渠道允许列表（Slack/Discord/Matrix/Microsoft Teams）（可行时名称会解析为 ID）。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手动配置仍可通过直接设置 `skills.install.nodeManager` 来使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 会写入 `agents.list[]` 和可选的 `bindings`。

WhatsApp 凭证存放在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

部分渠道以插件形式交付。当你在设置期间选择其中一个时，新手引导会先提示安装它（npm 或本地路径），然后才能配置它。

## 相关文档

- 新手引导概览：[新手引导（CLI）](/zh-CN/start/wizard)
- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 配置参考：[Gateway 网关配置](/zh-CN/gateway/configuration)
- 提供商：[WhatsApp](/zh-CN/channels/whatsapp)、[Telegram](/zh-CN/channels/telegram)、[Discord](/zh-CN/channels/discord)、[Google Chat](/zh-CN/channels/googlechat)、[Signal](/zh-CN/channels/signal)、[BlueBubbles](/zh-CN/channels/bluebubbles)（iMessage）、[iMessage](/zh-CN/channels/imessage)（旧版）
- Skills：[Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config)
