---
read_when:
    - 你需要某个特定 OpenClaw 引导设置步骤的详细行为
    - 你正在调试新手引导结果或集成新手引导客户端
sidebarTitle: CLI reference
summary: openclaw onboard 的逐步行为：每一步的作用、写入的配置以及内部机制
title: CLI 设置参考
x-i18n:
    generated_at: "2026-07-05T11:42:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ac01078241e0dfdbadf065bbe3c42b543c76596ed63af12e47af683e5f6691f8
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

本页介绍逐步新手引导行为、输出和内部机制。
如需演练，请参阅 [新手引导（CLI）](/zh-CN/start/wizard)。如需完整 CLI 标志
参考（每个 `--flag`、非交互式示例、提供商特定
命令），请参阅 [`openclaw onboard`](/zh-CN/cli/onboard)。

## 向导会做什么

本地模式（默认）会引导你完成：

- 模型和凭证设置（Anthropic、OpenAI Code 订阅 OAuth、xAI、OpenCode、自定义端点，以及更多由提供商拥有的凭证流程）
- 工作区位置和引导文件
- Gateway 网关设置（端口、绑定、凭证、Tailscale）
- 渠道和提供商（Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp，以及其他内置或插件渠道）
- Web 搜索提供商（可选）
- 守护进程安装（LaunchAgent、systemd 用户单元，或原生 Windows 计划任务，并带 Startup 文件夹回退）
- 健康检查
- Skills 设置

远程模式会配置此机器连接到其他位置的 Gateway 网关。它
不会在远程主机上安装或修改任何内容。

## 本地流程详情

<Steps>
  <Step title="Existing config detection">
    - 如果 `~/.openclaw/openclaw.json` 存在，请选择 **保留当前值**、**审查并更新** 或 **设置前重置**。
    - 重新运行向导不会清除任何内容，除非你明确选择重置（或传入 `--reset`）。
    - CLI `--reset` 默认使用 `config+creds+sessions`；使用 `--reset-scope full` 也会移除工作区。
    - 如果配置无效或包含旧版键，向导会停止并要求你先运行 `openclaw doctor` 再继续。
    - 重置会将状态移到废纸篓（绝不直接删除），并提供以下范围：
      - 仅配置
      - 配置 + 凭据 + 会话
      - 完全重置（也会移除工作区）

  </Step>
  <Step title="Model and auth">
    - 完整选项矩阵位于 [凭证和模型选项](#auth-and-model-options)。

  </Step>
  <Step title="Workspace">
    - 默认 `~/.openclaw/workspace`（可配置）。
    - 写入首次运行引导所需的工作区文件。
    - 工作区布局：[Agent 工作区](/zh-CN/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway">
    - 提示输入端口、绑定、凭证模式和 Tailscale 暴露。
    - 建议：即使对 loopback，也保持令牌凭证启用，这样本地 WS 客户端必须进行身份验证。
    - 在令牌模式下，交互式设置提供：
      - **生成/存储明文令牌**（默认）
      - **使用 SecretRef**（选择启用）
    - 在密码模式下，交互式设置也支持明文或 SecretRef 存储。
    - 非交互式令牌 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求新手引导进程环境中存在非空环境变量。
      - 不能与 `--gateway-token` 组合使用。
    - 只有在你完全信任每个本地进程时，才禁用凭证。
    - 非 loopback 绑定仍然需要凭证。

  </Step>
  <Step title="Channels">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选二维码登录
    - [Telegram](/zh-CN/channels/telegram)：Bot 令牌
    - [Discord](/zh-CN/channels/discord)：Bot 令牌
    - [Google Chat](/zh-CN/channels/googlechat)：服务账号 JSON + webhook audience
    - [Mattermost](/zh-CN/channels/mattermost)：Bot 令牌 + 基础 URL
    - [Signal](/zh-CN/channels/signal)：可选 `signal-cli` 安装 + 账号配置
    - [iMessage](/zh-CN/channels/imessage)：`imsg` CLI 路径 + Messages 数据库访问；当 Gateway 网关不在 Mac 上运行时，使用 SSH 包装器
    - 私信安全：默认是配对。第一条私信会发送代码；通过
      `openclaw pairing approve <channel> <code>` 批准，或使用允许列表。
  </Step>
  <Step title="Web search">
    - 选择提供商（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG、Tavily）或跳过。
    - 使用 `--skip-search` 跳过此步骤；稍后可用 `openclaw configure --section web` 重新配置。

  </Step>
  <Step title="Daemon install">
    - macOS：LaunchAgent
      - 需要已登录的用户会话；对于无头环境，请使用自定义 LaunchDaemon（未随附）。
    - Linux 和通过 WSL2 的 Windows：systemd 用户单元
      - 向导会尝试 `loginctl enable-linger <user>`，让 Gateway 网关在注销后继续运行。
      - 可能会提示 sudo（写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - 原生 Windows：优先使用计划任务
      - 如果任务创建被拒绝，OpenClaw 会回退到每用户 Startup 文件夹登录项，并立即启动 Gateway 网关。
      - 计划任务仍然是首选，因为它们提供更好的监督状态。
    - 运行时选择：交互式只提供 Node。Bun 可能在 WhatsApp/Telegram 重连时损坏内存，并且不是这些渠道支持的守护进程运行时；仅在不涉及该组合时传入 `--daemon-runtime bun`。

  </Step>
  <Step title="Health check">
    - 启动 Gateway 网关（如需要）并运行 `openclaw health`。
    - `openclaw status --deep` 会将实时 Gateway 网关健康探测加入状态输出，包括受支持渠道的探测。

  </Step>
  <Step title="Skills">
    - 读取可用 Skills 并检查要求。
    - 让你选择节点管理器：npm、pnpm 或 bun。
    - 当所需安装器可用时，为受信任的内置 Skills 安装可选依赖。
    - 跳过不可用的 Homebrew、uv 和 Go 安装器，然后按受影响的
      Skills 分组并提供手动设置指南。安装缺失的先决条件后运行 `openclaw doctor`。

  </Step>
  <Step title="Finish">
    - 摘要和后续步骤，包括 iOS、Android 和 macOS 应用选项。

  </Step>
</Steps>

<Note>
如果未检测到 GUI，向导会打印 Control UI 的 SSH 端口转发说明，而不是打开浏览器。
如果 Control UI 资产缺失，向导会尝试构建它们；回退方式是 `pnpm ui:build`（自动安装 UI 依赖）。
</Note>

## 远程模式详情

远程模式会配置此机器连接到其他位置的 Gateway 网关。它
不会在远程主机上安装或修改任何内容。

你需要设置：

- 远程 Gateway 网关 URL（`ws://...` 或 `wss://...`）
- 令牌、密码或无凭证，需匹配远程 Gateway 网关的配置

<Steps>
  <Step title="Discovery (optional)">
    如果 `dns-sd`（macOS）或 `avahi-browse`（Linux）可用，新手引导
    会在回退到手动输入 URL 之前，提供搜索 Bonjour/mDNS Gateway 网关信标的选项。
    配置后也会尝试广域 DNS-SD 设备发现。文档：[Gateway 网关设备发现](/zh-CN/gateway/discovery)、[Bonjour](/zh-CN/gateway/bonjour)。
  </Step>
  <Step title="Connection method">
    选择信标后，选择直接 WebSocket 或 SSH 隧道：
    - **直接**：通过 `wss://` 连接，并提示信任发现的
      TLS 指纹（首次使用时信任固定；只有接受后才会固定）。
    - **SSH 隧道**：打印一个 `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      命令供你先运行，然后连接到本地隧道端点。
  </Step>
  <Step title="Auth">
    选择令牌（推荐）、密码或无凭证，然后可选择将其作为 SecretRef 存储，而不是明文存储。
  </Step>
</Steps>

<Note>
如果 Gateway 网关仅限 loopback 且不可发现，请手动使用 SSH 隧道或 tailnet。
明文 `ws://` 可用于 loopback、私有 IP 字面量、`.local` 和 Tailnet `*.ts.net` URL；其他私有 DNS 名称需要 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。
</Note>

## 凭证和模型选项

<AccordionGroup>
  <Accordion title="Anthropic API key">
    如果存在，则使用 `ANTHROPIC_API_KEY`，否则提示输入密钥，然后保存以供守护进程使用。
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    在交互式新手引导/配置中优先使用本地路径；可用时复用现有 Claude CLI 登录。
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    浏览器流程；粘贴 `code#state`。

    当模型未设置或已是 OpenAI 系列时，通过 Codex 运行时将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    使用短期设备代码的浏览器配对流程。

    当模型未设置或已是 OpenAI 系列时，通过 Codex 运行时将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI API key">
    如果存在，则使用 `OPENAI_API_KEY`，否则提示输入密钥，然后将凭据存储在凭证配置文件中。

    当模型未设置、为 `openai/*` 或旧版 Codex 模型引用时，将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    面向符合条件的 SuperGrok 或 X Premium 账号的浏览器登录。对于大多数用户，这是
    推荐的 xAI 路径。OpenClaw 会存储生成的凭证
    配置文件，用于 Grok 模型、Grok `web_search`、`x_search` 和 `code_execution`。
  </Accordion>
  <Accordion title="xAI (Grok) device code">
    远程友好的浏览器登录，使用短代码而不是 localhost
    回调。可从 SSH、Docker 或 VPS 主机使用。
  </Accordion>
  <Accordion title="xAI (Grok) API key">
    提示输入 `XAI_API_KEY`，并将 xAI 配置为模型提供商。当你希望使用 xAI Console API key 而不是订阅 OAuth 时使用。
  </Accordion>
  <Accordion title="OpenCode">
    提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），并让你选择 Zen 或 Go 目录（一个 API key 覆盖两者）。
    设置 URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API key (generic)">
    为你存储密钥。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    提示输入 `AI_GATEWAY_API_KEY`。
    更多详情：[Vercel AI Gateway](/zh-CN/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    提示输入账号 ID、Gateway 网关 ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多详情：[Cloudflare AI Gateway](/zh-CN/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    配置会自动写入。托管默认值为 `MiniMax-M3`；API key 设置使用
    `minimax/...`，OAuth 设置使用 `minimax-portal/...`。
    更多详情：[MiniMax](/zh-CN/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    会为中国或全球端点上的 StepFun standard 或 Step Plan 自动写入配置。
    Standard 当前包含 `step-3.5-flash`，Step Plan 也包含 `step-3.5-flash-2603`。
    更多详情：[StepFun](/zh-CN/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    提示输入 `SYNTHETIC_API_KEY`。
    更多详情：[Synthetic](/zh-CN/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    首先提示选择 `Cloud + Local`、`Cloud only` 或 `Local only`。
    `Cloud only` 使用 `OLLAMA_API_KEY` 和 `https://ollama.com`。
    主机支持的模式会提示输入基础 URL（默认 `http://127.0.0.1:11434`）、发现可用模型并建议默认值。
    `Cloud + Local` 还会检查该 Ollama 主机是否已登录以获得云访问。
    更多详情：[Ollama](/zh-CN/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Moonshot（Kimi K2）和 Kimi Coding 配置会自动写入。
    更多详情：[Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)。
  </Accordion>
  <Accordion title="Custom provider">
    适用于 OpenAI-compatible、OpenAI Responses-compatible 和 Anthropic-compatible 端点。

    交互式新手引导支持与其他提供商 API key 流程相同的 API key 存储选项：
    - **立即粘贴 API key**（明文）
    - **使用密钥引用**（环境变量引用或已配置的提供商引用，带预检验证）

    新手引导会推断常见视觉模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 及类似模型）的图像支持能力，并且仅在模型名称未知时询问。

    非交互式标志：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（可选；回退到 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（可选）
    - `--custom-compatibility <openai|openai-responses|anthropic>`（可选；默认 `openai`）
    - `--custom-image-input` / `--custom-text-input`（可选；覆盖推断出的模型输入能力）

  </Accordion>
  <Accordion title="Skip">
    保持凭证未配置。
  </Accordion>
</AccordionGroup>

模型行为：

- 从检测到的选项中选择默认模型，或手动输入提供商和模型。
- 当新手引导从提供商凭证选择开始时，模型选择器会自动优先选择
  该提供商。对于 Volcengine 和 BytePlus，同一偏好
  也会匹配它们的编码计划变体（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果该首选提供商筛选结果为空，选择器会回退到
  完整目录，而不是显示无模型。
- 向导会运行模型检查，并在配置的模型未知或缺少凭证时发出警告。

凭证和配置文件路径：

- 凭证配置文件（API keys + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版 OAuth 导入：`~/.openclaw/credentials/oauth.json`

凭证存储模式：

- 默认新手引导行为会将 API keys 作为明文值持久化到凭证配置文件中。
- `--secret-input-mode ref` 启用引用模式，而不是明文密钥存储。
  在交互式设置中，你可以选择以下任一方式：
  - 环境变量引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已配置的提供商引用（`file` 或 `exec`），带提供商别名 + ID
- 交互式引用模式会在保存前运行快速预检验证。
  - 环境变量引用：验证当前新手引导环境中的变量名 + 非空值。
  - 提供商引用：验证提供商配置并解析请求的 ID。
  - 如果预检失败，新手引导会显示错误并让你重试。
- 在非交互式模式下，`--secret-input-mode ref` 仅由环境变量支持。
  - 在新手引导进程环境中设置提供商环境变量。
  - 内联密钥标志（例如 `--openai-api-key`）要求设置该环境变量；否则新手引导会快速失败。
  - 对于自定义提供商，非交互式 `ref` 模式会将 `models.providers.<id>.apiKey` 存储为 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在该自定义提供商场景下，`--custom-api-key` 要求设置 `CUSTOM_API_KEY`；否则新手引导会快速失败。
- Gateway 网关凭证在交互式设置中支持明文和 SecretRef 选择：
  - 令牌模式：**生成/存储明文令牌**（默认）或 **使用 SecretRef**。
  - 密码模式：明文或 SecretRef。
- 非交互式令牌 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
- 现有明文设置会继续原样工作。

<Note>
无头和服务器提示：在有浏览器的机器上完成 OAuth，然后复制
该智能体的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或匹配的
`$OPENCLAW_STATE_DIR/...` 路径）到 Gateway 网关主机。`credentials/oauth.json`
仅是旧版导入来源。
</Note>

## 输出和内部机制

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- 传入 `--skip-bootstrap` 时的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果选择了 Minimax）
- `tools.profile`（未设置时，本地新手引导默认为 `"coding"`；现有显式值会保留）
- `gateway.*`（模式、绑定、凭证、tailscale）
- `session.dmScope`（未设置时，本地新手引导将其默认为 `per-channel-peer`；现有显式值会保留）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 你在提示中选择加入时的渠道允许列表（Discord、iMessage、Signal、Slack、Telegram、WhatsApp）；Discord 和 Slack 还会将输入的名称解析为 ID
- `skills.install.nodeManager`
  - `setup --node-manager` 标志接受 `npm`、`pnpm` 或 `bun`。
  - 手动配置之后仍可设置 `skills.install.nodeManager: "yarn"`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` 会写入 `agents.list[]` 和可选的 `bindings`。

WhatsApp 凭证位于 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

<Note>
某些渠道以插件形式交付。在设置期间选择它们时，向导
会先提示安装插件（npm 或本地路径），然后再进行渠道配置。
</Note>

## 非交互式设置

`--non-interactive` 需要 `--accept-risk`（确认智能体
功能强大，完整系统访问存在风险）：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

完整标志参考和提供商专用示例：[`openclaw onboard`](/zh-CN/cli/onboard)、[CLI 自动化](/zh-CN/start/wizard-cli-automation)。

## Gateway 网关向导 RPC

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

客户端（macOS 应用和 Control UI）可以渲染步骤，而无需重新实现新手引导逻辑。

## Signal 设置行为

- 从官方 `signal-cli` GitHub releases 下载合适的发布资产（原生构建，仅 Linux x86-64）
- 在其他平台（macOS、非 x64 Linux）上，改为通过 Homebrew 安装
- 将发布资产安装存储在 `~/.openclaw/tools/signal-cli/<version>/` 下
- 在配置中写入 `channels.signal.cliPath`
- 暂不支持原生 Windows；请在 WSL2 内运行新手引导以获取 Linux 安装路径

## 相关文档

- 新手引导中心：[新手引导（CLI）](/zh-CN/start/wizard)
- 自动化和脚本：[CLI 自动化](/zh-CN/start/wizard-cli-automation)
- 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)
