---
read_when:
    - 你需要了解 `openclaw onboard` 的详细行为
    - 你正在调试新手引导结果，或集成新手引导客户端
sidebarTitle: CLI reference
summary: CLI 设置流程、凭证/模型设置、输出和内部机制的完整参考
title: CLI 设置参考
x-i18n:
    generated_at: "2026-06-27T03:23:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6e46c81dd51ee9f1ce492dedc2911d449f507a136bd8805bc157915684a1941
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

本页是 `openclaw onboard` 的完整参考。
简短指南见 [新手引导（CLI）](/zh-CN/start/wizard)。

## 向导会做什么

本地模式（默认）会引导你完成：

- 模型和凭证设置（OpenAI Code 订阅 OAuth、Anthropic Claude CLI 或 API key，以及 MiniMax、GLM、Ollama、Moonshot、StepFun 和 AI Gateway 选项）
- 工作区位置和引导文件
- Gateway 网关设置（端口、绑定、凭证、Tailscale）
- 渠道和提供商（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、iMessage，以及其他内置渠道插件）
- 守护进程安装（LaunchAgent、systemd 用户单元，或原生 Windows Scheduled Task，并带 Startup 文件夹回退）
- 健康检查
- Skills 设置

远程模式会配置这台机器连接到其他位置的 Gateway 网关。
它不会在远程主机上安装或修改任何内容。

## 本地流程详情

<Steps>
  <Step title="现有配置检测">
    - 如果 `~/.openclaw/openclaw.json` 存在，选择保留、修改或重置。
    - 重新运行向导不会清除任何内容，除非你明确选择重置（或传入 `--reset`）。
    - CLI `--reset` 默认作用于 `config+creds+sessions`；使用 `--reset-scope full` 也会移除工作区。
    - 如果配置无效或包含旧版键名，向导会停止并要求你先运行 `openclaw doctor`，然后再继续。
    - 重置使用 `trash`，并提供这些范围：
      - 仅配置
      - 配置 + 凭证 + 会话
      - 完整重置（也会移除工作区）

  </Step>
  <Step title="模型和凭证">
    - 完整选项矩阵见 [凭证和模型选项](#auth-and-model-options)。

  </Step>
  <Step title="工作区">
    - 默认 `~/.openclaw/workspace`（可配置）。
    - 填充首次运行引导仪式所需的工作区文件。
    - 工作区布局：[Agent 工作区](/zh-CN/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway 网关">
    - 提示输入端口、绑定、凭证模式和 Tailscale 暴露。
    - 推荐：即使是 loopback，也保持令牌凭证启用，这样本地 WS 客户端必须进行身份验证。
    - 在令牌模式下，交互式设置提供：
      - **生成/存储明文令牌**（默认）
      - **使用 SecretRef**（选择启用）
    - 在密码模式下，交互式设置也支持明文或 SecretRef 存储。
    - 非交互式令牌 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求新手引导进程环境中有一个非空环境变量。
      - 不能与 `--gateway-token` 组合使用。
    - 仅当你完全信任每个本地进程时才禁用凭证。
    - 非 loopback 绑定仍然需要凭证。

  </Step>
  <Step title="渠道">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选 QR 登录
    - [Telegram](/zh-CN/channels/telegram)：Bot 令牌
    - [Discord](/zh-CN/channels/discord)：Bot 令牌
    - [Google Chat](/zh-CN/channels/googlechat)：服务账号 JSON + webhook audience
    - [Mattermost](/zh-CN/channels/mattermost)：Bot 令牌 + base URL
    - [Signal](/zh-CN/channels/signal)：可选 `signal-cli` 安装 + 账号配置
    - [iMessage](/zh-CN/channels/imessage)：`imsg` CLI 路径 + Messages DB 访问权限；当 Gateway 网关不在 Mac 上运行时，使用 SSH 包装器
    - 私信安全：默认是配对。第一条私信会发送一个代码；通过
      `openclaw pairing approve <channel> <code>` 批准，或使用 allowlist。
  </Step>
  <Step title="守护进程安装">
    - macOS：LaunchAgent
      - 要求已登录的用户会话；对于无头环境，使用自定义 LaunchDaemon（未随附）。
    - Linux 和通过 WSL2 的 Windows：systemd 用户单元
      - 向导会尝试 `loginctl enable-linger <user>`，让 Gateway 网关在登出后保持运行。
      - 可能会提示 sudo（写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - 原生 Windows：优先使用 Scheduled Task
      - 如果任务创建被拒绝，OpenClaw 会回退到每用户 Startup 文件夹登录项，并立即启动 Gateway 网关。
      - Scheduled Tasks 仍然是首选，因为它们提供更好的 supervisor 状态。
    - 运行时选择：Node（推荐；WhatsApp 和 Telegram 必需）。不推荐 Bun。

  </Step>
  <Step title="健康检查">
    - 启动 Gateway 网关（如有需要）并运行 `openclaw health`。
    - `openclaw status --deep` 会把实时 Gateway 网关健康探测添加到状态输出中，包括受支持时的渠道探测。

  </Step>
  <Step title="Skills">
    - 读取可用 Skills 并检查需求。
    - 让你选择 node 管理器：npm、pnpm 或 bun。
    - 安装可选依赖（有些在 macOS 上使用 Homebrew）。

  </Step>
  <Step title="完成">
    - 摘要和后续步骤，包括 iOS、Android 和 macOS 应用选项。

  </Step>
</Steps>

<Note>
如果未检测到 GUI，向导会打印用于 Control UI 的 SSH 端口转发说明，而不是打开浏览器。
如果缺少 Control UI 资源，向导会尝试构建它们；回退命令是 `pnpm ui:build`（自动安装 UI 依赖）。
</Note>

## 远程模式详情

远程模式会配置这台机器连接到其他位置的 Gateway 网关。

<Info>
远程模式不会在远程主机上安装或修改任何内容。
</Info>

你需要设置：

- 远程 Gateway 网关 URL（`ws://...`）
- 如果远程 Gateway 网关需要凭证，则设置令牌（推荐）

<Note>
- 如果 Gateway 网关仅限 loopback，使用 SSH 隧道或 tailnet。
- 设备发现提示：
  - macOS：Bonjour（`dns-sd`）
  - Linux：Avahi（`avahi-browse`）

</Note>

## 凭证和模型选项

<AccordionGroup>
  <Accordion title="Anthropic API key">
    如果存在则使用 `ANTHROPIC_API_KEY`，否则提示输入 key，然后保存供守护进程使用。
  </Accordion>
  <Accordion title="OpenAI Code 订阅（OAuth）">
    浏览器流程；粘贴 `code#state`。

    当模型未设置或已经是 OpenAI 系列时，通过 Codex runtime 将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI Code 订阅（设备配对）">
    使用短期设备代码的浏览器配对流程。

    当模型未设置或已经是 OpenAI 系列时，通过 Codex runtime 将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI API key">
    如果存在则使用 `OPENAI_API_KEY`，否则提示输入 key，然后将凭据存储到凭证档案中。

    当模型未设置、为 `openai/*` 或为旧版 Codex 模型引用时，将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    面向符合条件的 SuperGrok 或 X Premium 账号的浏览器登录。这是多数用户推荐的 xAI 路径。OpenClaw 会为 Grok 模型、Grok `web_search`、`x_search` 和 `code_execution` 存储生成的凭证档案。
  </Accordion>
  <Accordion title="xAI (Grok) device code">
    适合远程环境的浏览器登录，使用短代码而不是 localhost 回调。可在 SSH、Docker 或 VPS 主机上使用。
  </Accordion>
  <Accordion title="xAI (Grok) API key">
    提示输入 `XAI_API_KEY`，并将 xAI 配置为模型提供商。当你想使用 xAI Console API key 而不是订阅 OAuth 时使用。
  </Accordion>
  <Accordion title="OpenCode">
    提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），并让你选择 Zen 或 Go 目录。
    设置 URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API key（通用）">
    为你存储 key。
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
    配置会自动写入。托管默认值是 `MiniMax-M3`；API-key 设置使用
    `minimax/...`，OAuth 设置使用 `minimax-portal/...`。
    更多详情：[MiniMax](/zh-CN/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    配置会为中国或全球端点上的 StepFun standard 或 Step Plan 自动写入。
    Standard 当前包含 `step-3.5-flash`，Step Plan 还包含 `step-3.5-flash-2603`。
    更多详情：[StepFun](/zh-CN/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 兼容）">
    提示输入 `SYNTHETIC_API_KEY`。
    更多详情：[Synthetic](/zh-CN/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（Cloud 和本地开放模型）">
    首先提示选择 `Cloud + Local`、`Cloud only` 或 `Local only`。
    `Cloud only` 使用 `OLLAMA_API_KEY` 和 `https://ollama.com`。
    主机支持的模式会提示输入 base URL（默认 `http://127.0.0.1:11434`）、发现可用模型并建议默认值。
    `Cloud + Local` 还会检查该 Ollama 主机是否已登录以获得云访问权限。
    更多详情：[Ollama](/zh-CN/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 和 Kimi Coding">
    Moonshot（Kimi K2）和 Kimi Coding 配置会自动写入。
    更多详情：[Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)。
  </Accordion>
  <Accordion title="自定义提供商">
    适用于 OpenAI 兼容和 Anthropic 兼容端点。

    交互式新手引导支持与其他提供商 API key 流程相同的 API key 存储选择：
    - **立即粘贴 API key**（明文）
    - **使用密钥引用**（环境变量引用或已配置的提供商引用，并带预检验证）

    非交互式标志：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（可选；回退到 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（可选）
    - `--custom-compatibility <openai|openai-responses|anthropic>`（可选；默认 `openai`）
    - `--custom-image-input` / `--custom-text-input`（可选；覆盖推断出的模型输入能力）

  </Accordion>
  <Accordion title="跳过">
    保持凭证未配置。
  </Accordion>
</AccordionGroup>

模型行为：

- 从检测到的选项中选择默认模型，或手动输入提供商和模型。
- 自定义提供商新手引导会为常见模型 ID 推断图像支持，并且仅在模型名称未知时询问。
- 当新手引导从提供商凭证选择开始时，模型选择器会自动优先选择
  该提供商。对于 Volcengine 和 BytePlus，同一偏好
  也会匹配它们的 coding-plan 变体（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果该首选提供商过滤器会为空，选择器会回退到
  完整目录，而不是不显示任何模型。
- 向导会运行模型检查，并在已配置模型未知或缺少凭证时发出警告。

凭据和档案路径：

- 凭证档案（API keys + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版 OAuth 导入：`~/.openclaw/credentials/oauth.json`

凭据存储模式：

- 默认新手引导行为会将 API keys 作为纯文本值保存在凭证配置文件中。
- `--secret-input-mode ref` 启用引用模式，而不是纯文本 key 存储。
  在交互式设置中，你可以选择以下任一项：
  - 环境变量引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已配置的提供商引用（`file` 或 `exec`），带提供商别名 + id
- 交互式引用模式会在保存前运行快速预检验证。
  - 环境变量引用：验证当前新手引导环境中的变量名 + 非空值。
  - 提供商引用：验证提供商配置并解析请求的 id。
  - 如果预检失败，新手引导会显示错误并让你重试。
- 在非交互模式中，`--secret-input-mode ref` 仅由环境变量支持。
  - 在新手引导进程环境中设置提供商环境变量。
  - 内联 key 标志（例如 `--openai-api-key`）要求该环境变量已设置；否则新手引导会快速失败。
  - 对于自定义提供商，非交互式 `ref` 模式会将 `models.providers.<id>.apiKey` 存储为 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在该自定义提供商场景中，`--custom-api-key` 要求已设置 `CUSTOM_API_KEY`；否则新手引导会快速失败。
- Gateway 网关身份验证凭据在交互式设置中支持纯文本和 SecretRef 选择：
  - 令牌模式：**生成/存储纯文本令牌**（默认）或**使用 SecretRef**。
  - 密码模式：纯文本或 SecretRef。
- 非交互式令牌 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
- 现有纯文本设置会继续原样工作。

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
- `agents.defaults.model` / `models.providers`（如果选择 Minimax）
- `tools.profile`（未设置时，本地新手引导默认使用 `"coding"`；保留现有显式值）
- `gateway.*`（模式、绑定、身份验证、tailscale）
- `session.dmScope`（未设置时，本地新手引导默认使用 `per-channel-peer`；保留现有显式值）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 频道 allowlist（Slack、Discord、Matrix、Microsoft Teams），当你在提示中选择启用时使用（名称会在可能时解析为 ID）
- `skills.install.nodeManager`
  - `setup --node-manager` 标志接受 `npm`、`pnpm` 或 `bun`。
  - 之后仍可通过手动配置设置 `skills.install.nodeManager: "yarn"`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 会写入 `agents.list[]` 和可选的 `bindings`。

WhatsApp 凭据位于 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

<Note>
某些频道以插件形式交付。在设置期间选择时，向导会
在频道配置前提示安装插件（npm 或本地路径）。
</Note>

Gateway 网关向导 RPC：

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

客户端（macOS 应用和 Control UI）可以渲染步骤，而无需重新实现新手引导逻辑。

Signal 设置行为：

- 下载相应的发布资产
- 将其存储在 `~/.openclaw/tools/signal-cli/<version>/` 下
- 在配置中写入 `channels.signal.cliPath`
- JVM 构建需要 Java 21
- 可用时使用原生构建
- Windows 使用 WSL2，并在 WSL 内遵循 Linux signal-cli 流程

## 相关文档

- 新手引导中心：[新手引导（CLI）](/zh-CN/start/wizard)
- 自动化和脚本：[CLI 自动化](/zh-CN/start/wizard-cli-automation)
- 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)
