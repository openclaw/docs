---
read_when:
    - 你需要 openclaw onboard 的详细行为
    - 你正在调试新手引导结果或集成新手引导客户端
sidebarTitle: CLI reference
summary: CLI 设置流程、凭证/模型设置、输出和内部机制的完整参考
title: CLI 设置参考
x-i18n:
    generated_at: "2026-06-30T22:06:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

此页面是 `openclaw onboard` 的完整参考。
简短指南见 [新手引导（CLI）](/zh-CN/start/wizard)。

## 向导会做什么

本地模式（默认）会引导你完成：

- 模型和凭证设置（OpenAI Code 订阅 OAuth、Anthropic Claude CLI 或 API key，以及 MiniMax、GLM、Ollama、Moonshot、StepFun 和 AI Gateway 选项）
- 工作区位置和引导文件
- Gateway 网关设置（端口、绑定、认证、tailscale）
- 渠道和提供商（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、iMessage，以及其他内置渠道插件）
- 守护进程安装（LaunchAgent、systemd 用户单元，或原生 Windows 计划任务，并带有 Startup 文件夹回退）
- 健康检查
- Skills 设置

远程模式会配置此机器连接到其他位置的 Gateway 网关。
它不会在远程主机上安装或修改任何内容。

## 本地流程详情

<Steps>
  <Step title="现有配置检测">
    - 如果 `~/.openclaw/openclaw.json` 存在，请选择保留、修改或重置。
    - 重新运行向导不会擦除任何内容，除非你明确选择重置（或传入 `--reset`）。
    - CLI `--reset` 默认值为 `config+creds+sessions`；使用 `--reset-scope full` 也会移除工作区。
    - 如果配置无效或包含旧版键，向导会停止并要求你先运行 `openclaw doctor`，然后再继续。
    - 重置使用 `trash`，并提供以下范围：
      - 仅配置
      - 配置 + 凭证 + 会话
      - 完全重置（也会移除工作区）

  </Step>
  <Step title="模型和凭证">
    - 完整选项矩阵见[凭证和模型选项](#auth-and-model-options)。

  </Step>
  <Step title="工作区">
    - 默认 `~/.openclaw/workspace`（可配置）。
    - 写入首次运行引导流程所需的工作区文件。
    - 工作区布局：[Agent 工作区](/zh-CN/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway 网关">
    - 提示输入端口、绑定、认证模式和 tailscale 暴露。
    - 推荐：即使是环回也保持令牌认证启用，这样本地 WS 客户端也必须认证。
    - 在令牌模式下，交互式设置提供：
      - **生成/存储明文令牌**（默认）
      - **使用 SecretRef**（选择启用）
    - 在密码模式下，交互式设置也支持明文或 SecretRef 存储。
    - 非交互式令牌 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求在新手引导进程环境中存在非空环境变量。
      - 不能与 `--gateway-token` 组合使用。
    - 只有在你完全信任每个本地进程时才禁用认证。
    - 非环回绑定仍然需要认证。

  </Step>
  <Step title="渠道">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选 QR 登录
    - [Telegram](/zh-CN/channels/telegram)：Bot 令牌
    - [Discord](/zh-CN/channels/discord)：Bot 令牌
    - [Google Chat](/zh-CN/channels/googlechat)：服务账号 JSON + webhook 受众
    - [Mattermost](/zh-CN/channels/mattermost)：Bot 令牌 + 基础 URL
    - [Signal](/zh-CN/channels/signal)：可选 `signal-cli` 安装 + 账号配置
    - [iMessage](/zh-CN/channels/imessage)：`imsg` CLI 路径 + Messages 数据库访问；当 Gateway 网关运行在非 Mac 上时，请使用 SSH 包装器
    - 私信安全：默认是配对。第一条私信会发送代码；通过
      `openclaw pairing approve <channel> <code>` 批准，或使用 allowlist。
  </Step>
  <Step title="守护进程安装">
    - macOS：LaunchAgent
      - 需要已登录的用户会话；对于无头环境，请使用自定义 LaunchDaemon（未随附）。
    - Linux 和通过 WSL2 的 Windows：systemd 用户单元
      - 向导会尝试 `loginctl enable-linger <user>`，让 Gateway 网关在登出后继续运行。
      - 可能提示 sudo（写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - 原生 Windows：优先使用计划任务
      - 如果任务创建被拒绝，OpenClaw 会回退到每用户 Startup 文件夹登录项，并立即启动 Gateway 网关。
      - 计划任务仍是首选，因为它们提供更好的监督器状态。
    - 运行时选择：Node（推荐；WhatsApp 和 Telegram 必需）。不推荐 Bun。

  </Step>
  <Step title="健康检查">
    - 启动 Gateway 网关（如有需要）并运行 `openclaw health`。
    - `openclaw status --deep` 会将实时 Gateway 网关健康探针添加到状态输出中，在支持时包括渠道探针。

  </Step>
  <Step title="Skills">
    - 读取可用 Skills 并检查要求。
    - 让你选择节点管理器：npm、pnpm 或 bun。
    - 安装可选依赖（有些在 macOS 上使用 Homebrew）。

  </Step>
  <Step title="完成">
    - 摘要和后续步骤，包括 iOS、Android 和 macOS 应用选项。

  </Step>
</Steps>

<Note>
如果未检测到 GUI，向导会打印 Control UI 的 SSH 端口转发说明，而不是打开浏览器。
如果缺少 Control UI 资源，向导会尝试构建它们；回退是 `pnpm ui:build`（自动安装 UI 依赖）。
</Note>

## 远程模式详情

远程模式会配置此机器连接到其他位置的 Gateway 网关。

<Info>
远程模式不会在远程主机上安装或修改任何内容。
</Info>

你需要设置：

- 远程 Gateway 网关 URL（`ws://...`）
- 如果远程 Gateway 网关需要认证，则设置令牌（推荐）

<Note>
- 如果 Gateway 网关仅限环回，请使用 SSH 隧道或 tailnet。
- 设备发现提示：
  - macOS：Bonjour（`dns-sd`）
  - Linux：Avahi（`avahi-browse`）

</Note>

## 凭证和模型选项

<AccordionGroup>
  <Accordion title="Anthropic API key">
    如果存在，则使用 `ANTHROPIC_API_KEY`；否则提示输入密钥，然后保存供守护进程使用。
  </Accordion>
  <Accordion title="OpenAI Code 订阅（OAuth）">
    浏览器流程；粘贴 `code#state`。

    当模型未设置或已属于 OpenAI 系列时，通过 Codex runtime 将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI Code 订阅（设备配对）">
    使用短期设备代码的浏览器配对流程。

    当模型未设置或已属于 OpenAI 系列时，通过 Codex runtime 将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI API key">
    如果存在，则使用 `OPENAI_API_KEY`；否则提示输入密钥，然后将凭证存储到凭证配置文件中。

    当模型未设置、为 `openai/*` 或旧版 Codex 模型引用时，将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="xAI（Grok）OAuth">
    面向符合条件的 SuperGrok 或 X Premium 账号的浏览器登录。这是大多数用户推荐的 xAI 路径。OpenClaw 会为 Grok 模型、Grok `web_search`、`x_search` 和 `code_execution` 存储生成的凭证配置文件。
  </Accordion>
  <Accordion title="xAI（Grok）设备代码">
    使用短代码而不是 localhost 回调的远程友好浏览器登录。可在 SSH、Docker 或 VPS 主机上使用。
  </Accordion>
  <Accordion title="xAI（Grok）API key">
    提示输入 `XAI_API_KEY`，并将 xAI 配置为模型提供商。当你想使用 xAI Console API key 而不是订阅 OAuth 时使用。
  </Accordion>
  <Accordion title="OpenCode">
    提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），并让你选择 Zen 或 Go 目录。
    设置 URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API key（通用）">
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
    会为中国或全球端点上的 StepFun 标准版或 Step Plan 自动写入配置。
    标准版目前包含 `step-3.5-flash`，Step Plan 还包含 `step-3.5-flash-2603`。
    更多详情：[StepFun](/zh-CN/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（兼容 Anthropic）">
    提示输入 `SYNTHETIC_API_KEY`。
    更多详情：[Synthetic](/zh-CN/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（云端和本地开放模型）">
    首先提示选择 `Cloud + Local`、`Cloud only` 或 `Local only`。
    `Cloud only` 使用 `OLLAMA_API_KEY` 和 `https://ollama.com`。
    主机后端模式会提示输入基础 URL（默认 `http://127.0.0.1:11434`）、发现可用模型并建议默认值。
    `Cloud + Local` 还会检查该 Ollama 主机是否已登录以访问云端。
    更多详情：[Ollama](/zh-CN/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 和 Kimi Coding">
    Moonshot（Kimi K2）和 Kimi Coding 配置会自动写入。
    更多详情：[Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)。
  </Accordion>
  <Accordion title="自定义提供商">
    适用于兼容 OpenAI 和兼容 Anthropic 的端点。

    交互式新手引导支持与其他提供商 API key 流程相同的 API key 存储选择：
    - **立即粘贴 API key**（明文）
    - **使用密钥引用**（环境引用或已配置的提供商引用，并进行预检验证）

    非交互式标志：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（可选；回退到 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（可选）
    - `--custom-compatibility <openai|openai-responses|anthropic>`（可选；默认 `openai`）
    - `--custom-image-input` / `--custom-text-input`（可选；覆盖推断的模型输入能力）

  </Accordion>
  <Accordion title="跳过">
    保持凭证未配置。
  </Accordion>
</AccordionGroup>

模型行为：

- 从检测到的选项中选择默认模型，或手动输入提供商和模型。
- 自定义提供商新手引导会为常见模型 ID 推断图像支持，并且只在模型名称未知时询问。
- 当新手引导从提供商凭证选择开始时，模型选择器会自动优先选择该提供商。对于 Volcengine 和 BytePlus，相同的偏好也会匹配它们的 coding-plan 变体（`volcengine-plan/*`、`byteplus-plan/*`）。
- 如果该首选提供商筛选结果为空，选择器会回退到完整目录，而不是不显示任何模型。
- 向导会运行模型检查，并在配置的模型未知或缺少凭证时发出警告。

凭证和配置文件路径：

- 凭证配置文件（API key + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版 OAuth 导入：`~/.openclaw/credentials/oauth.json`

凭证存储模式：

- 默认新手引导行为会将 API key 以明文值形式持久化到凭证配置文件中。
- `--secret-input-mode ref` 会启用引用模式，而不是明文 key 存储。
  在交互式设置中，你可以选择：
  - 环境变量引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已配置的提供商引用（`file` 或 `exec`），带提供商别名 + id
- 交互式引用模式会在保存前运行快速预检验证。
  - 环境变量引用：验证当前新手引导环境中的变量名 + 非空值。
  - 提供商引用：验证提供商配置，并解析请求的 id。
  - 如果预检失败，新手引导会显示错误并让你重试。
- 在非交互模式下，`--secret-input-mode ref` 仅由环境变量支持。
  - 在新手引导进程环境中设置提供商环境变量。
  - 内联 key 标志（例如 `--openai-api-key`）要求设置该环境变量；否则新手引导会快速失败。
  - 对于自定义提供商，非交互式 `ref` 模式会将 `models.providers.<id>.apiKey` 存储为 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在该自定义提供商场景中，`--custom-api-key` 要求设置 `CUSTOM_API_KEY`；否则新手引导会快速失败。
- Gateway 网关凭证在交互式设置中支持明文和 SecretRef 选项：
  - Token 模式：**生成/存储明文 token**（默认）或 **使用 SecretRef**。
  - 密码模式：明文或 SecretRef。
- 非交互式 token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
- 现有明文设置会继续原样工作。

<Note>
无头和服务器提示：在带浏览器的机器上完成 OAuth，然后复制
该智能体的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或匹配的
`$OPENCLAW_STATE_DIR/...` 路径）到 Gateway 网关主机。`credentials/oauth.json`
只是旧版导入来源。
</Note>

## 输出和内部机制

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- 传入 `--skip-bootstrap` 时的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果选择 Minimax）
- `tools.profile`（未设置时，本地新手引导默认设为 `"coding"`；现有显式值会保留）
- `gateway.*`（模式、绑定、凭证、tailscale）
- `session.dmScope`（未设置时，本地新手引导默认设为 `per-channel-peer`；现有显式值会保留）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 你在提示中选择加入时的频道允许列表（Slack、Discord、Matrix、Microsoft Teams）（可行时会将名称解析为 ID）
- `skills.install.nodeManager`
  - `setup --node-manager` 标志接受 `npm`、`pnpm` 或 `bun`。
  - 之后仍可通过手动配置设置 `skills.install.nodeManager: "yarn"`。
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
部分频道以插件形式交付。在设置期间选择这些频道时，向导
会在频道配置前提示安装插件（npm 或本地路径）。
</Note>

Gateway 网关向导 RPC：

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

客户端（macOS 应用和 Control UI）可以渲染步骤，而无需重新实现新手引导逻辑。

Signal 设置行为：

- 下载合适的发布资产
- 将其存储到 `~/.openclaw/tools/signal-cli/<version>/` 下
- 在配置中写入 `channels.signal.cliPath`
- JVM 构建需要 Java 21
- 可用时使用原生构建
- Windows 使用 WSL2，并在 WSL 内遵循 Linux signal-cli 流程

## 相关文档

- 新手引导中心：[新手引导（CLI）](/zh-CN/start/wizard)
- 自动化和脚本：[CLI 自动化](/zh-CN/start/wizard-cli-automation)
- 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)
