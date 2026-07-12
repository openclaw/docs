---
read_when:
    - 你需要了解特定 `openclaw onboard` 步骤的详细行为
    - 你正在调试新手引导结果或集成新手引导客户端
sidebarTitle: CLI reference
summary: openclaw onboard 的逐步行为：每个步骤的作用、写入的配置及其内部机制
title: CLI 设置参考
x-i18n:
    generated_at: "2026-07-12T14:47:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 56b318b3c5fbaeb37e99871e10b35eae38b209f3a2f683ff85816aca87a4ee6e
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

本页介绍分步新手引导的行为、输出和内部机制。
如需操作演练，请参阅[新手引导（CLI）](/zh-CN/start/wizard)。如需完整的 CLI 标志
参考（每个 `--flag`、非交互式示例、提供商特定
命令），请参阅 [`openclaw onboard`](/zh-CN/cli/onboard)。

## 向导的作用

本地模式（默认）将引导你完成：

- 模型和身份验证设置（Anthropic、OpenAI Code 订阅 OAuth、xAI、OpenCode、自定义端点，以及更多由提供商负责的身份验证流程）
- 工作区位置和引导文件
- Gateway 网关设置（端口、绑定、身份验证、Tailscale）
- 渠道和提供商（Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp，以及其他内置或插件渠道）
- Web 搜索提供商（可选）
- 守护进程安装（LaunchAgent、systemd 用户单元，或原生 Windows 计划任务，并以启动文件夹作为回退方案）
- 健康检查
- Skills 设置

远程模式配置此计算机，使其连接到其他位置的 Gateway 网关。它
不会在远程主机上安装或修改任何内容。

## 本地流程详情

<Steps>
  <Step title="检测现有配置">
    - 如果 `~/.openclaw/openclaw.json` 存在，请选择**保留当前值**、**检查并更新**或**设置前重置**。
    - 重新运行向导不会清除任何内容，除非你明确选择重置（或传递 `--reset`）。
    - CLI `--reset` 默认为 `config+creds+sessions`；使用 `--reset-scope full` 还可移除工作区。
    - 如果配置无效或包含旧版键，向导会停止并要求你先运行 `openclaw doctor`，然后再继续。
    - 重置会将状态移至废纸篓（绝不会直接删除），并提供以下范围：
      - 仅配置
      - 配置 + 凭据 + 会话
      - 完全重置（也会移除工作区）

  </Step>
  <Step title="模型和身份验证">
    - 完整选项矩阵参见[身份验证和模型选项](#auth-and-model-options)。

  </Step>
  <Step title="工作区">
    - 默认为 `~/.openclaw/workspace`（可配置）。
    - 创建首次运行引导所需的工作区文件。
    - 工作区布局：[Agent 工作区](/zh-CN/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway 网关">
    - 提示输入端口、绑定、身份验证模式和 Tailscale 暴露方式。
    - 建议：即使使用环回地址，也应保持令牌身份验证启用，以便本地 WS 客户端必须进行身份验证。
    - 在令牌模式下，交互式设置提供：
      - **生成/存储明文令牌**（默认）
      - **使用 SecretRef**（选择启用）
    - 在密码模式下，交互式设置也支持明文或 SecretRef 存储。
    - 非交互式令牌 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求新手引导进程的环境中存在非空环境变量。
      - 不能与 `--gateway-token` 结合使用。
    - 仅当你完全信任每个本地进程时，才禁用身份验证。
    - 非环回绑定仍然要求身份验证。

  </Step>
  <Step title="渠道">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选的二维码登录
    - [Telegram](/zh-CN/channels/telegram)：Bot 令牌
    - [Discord](/zh-CN/channels/discord)：Bot 令牌
    - [Google Chat](/zh-CN/channels/googlechat)：服务账号 JSON + Webhook 受众
    - [Mattermost](/zh-CN/channels/mattermost)：Bot 令牌 + 基础 URL
    - [Signal](/zh-CN/channels/signal)：可选安装 `signal-cli` + 账号配置
    - [iMessage](/zh-CN/channels/imessage)：`imsg` CLI 路径 + Messages 数据库访问权限；当 Gateway 网关不在 Mac 上运行时，请使用 SSH 包装器
    - 私信安全：默认为配对。第一条私信会发送一个代码；通过
      `openclaw pairing approve <channel> <code>` 批准，或使用允许列表。
  </Step>
  <Step title="Web 搜索">
    - 选择一个提供商（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG、Tavily）或跳过。
    - 使用 `--skip-search` 跳过此步骤；之后可使用 `openclaw configure --section web` 重新配置。

  </Step>
  <Step title="安装守护进程">
    - macOS：LaunchAgent
      - 要求用户已登录会话；对于无头环境，请使用自定义 LaunchDaemon（未随附）。
    - Linux 和通过 WSL2 运行的 Windows：systemd 用户单元
      - 向导会尝试执行 `loginctl enable-linger <user>`，使 Gateway 网关在注销后继续运行。
      - 可能会提示使用 sudo（写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - 原生 Windows：优先使用计划任务
      - 如果创建任务遭拒，OpenClaw 会回退到每用户启动文件夹中的登录项，并立即启动 Gateway 网关。
      - 计划任务仍是首选，因为它能提供更好的监督程序状态。
    - 运行时选择：交互模式仅提供 Node。Bun 可能在 WhatsApp/Telegram 重新连接时损坏内存，因此不是这些渠道支持的守护进程运行时；只有不与这些渠道组合使用时，才能传递 `--daemon-runtime bun`。

  </Step>
  <Step title="健康检查">
    - 启动 Gateway 网关（如有需要）并运行 `openclaw health`。
    - `openclaw status --deep` 会将实时 Gateway 健康探测添加到状态输出中，并在支持时包含渠道探测。

  </Step>
  <Step title="Skills">
    - 读取可用的 Skills 并检查要求。
    - 允许你选择 Node 管理器：npm、pnpm 或 bun。
    - 当所需的安装程序可用时，为受信任的内置 Skills 安装可选依赖项。
    - 跳过不可用的 Homebrew、uv 和 Go 安装程序，然后将受影响的
      Skills 分组，并提供手动设置指导。安装缺失的前置条件后，运行
      `openclaw doctor`。

  </Step>
  <Step title="完成">
    - 显示摘要和后续步骤，包括 iOS、Android 和 macOS 应用选项。

  </Step>
</Steps>

<Note>
如果未检测到 GUI，向导会输出用于 Control UI 的 SSH 端口转发说明，而不是打开浏览器。
如果缺少 Control UI 资源，向导会尝试构建它们；回退命令为 `pnpm ui:build`（自动安装 UI 依赖项）。
</Note>

## 远程模式详情

远程模式配置此计算机，使其连接到其他位置的 Gateway 网关。它
不会在远程主机上安装或修改任何内容。

你需要设置：

- 远程 Gateway 网关 URL（`ws://...` 或 `wss://...`）
- 与远程 Gateway 网关配置匹配的令牌、密码或无身份验证

<Steps>
  <Step title="设备发现（可选）">
    如果 `dns-sd`（macOS）或 `avahi-browse`（Linux）可用，新手引导
    会先提供搜索 Bonjour/mDNS Gateway 网关信标的选项，然后再回退到
    手动输入 URL。配置后还会尝试广域 DNS-SD 设备发现。
    文档：[Gateway 网关设备发现](/zh-CN/gateway/discovery)、[Bonjour](/zh-CN/gateway/bonjour)。
  </Step>
  <Step title="连接方式">
    选择信标后，请选择直接 WebSocket 或 SSH 隧道：
    - **直接连接**：通过 `wss://` 连接，并提示信任发现的
      TLS 指纹（首次使用时信任固定；仅在你接受后才会固定）。
    - **SSH 隧道**：输出一条需先运行的 `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      命令，然后连接到本地隧道端点。
  </Step>
  <Step title="身份验证">
    选择令牌（推荐）、密码或无身份验证，然后可以选择将其存储为
    SecretRef，而不是明文。
  </Step>
</Steps>

<Note>
如果 Gateway 网关仅使用环回地址且无法被发现，请手动使用 SSH 隧道或 tailnet。
对于环回地址、私有 IP 字面量、`.local` 和 Tailnet `*.ts.net` URL，允许使用明文 `ws://`；其他私有 DNS 名称需要 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。
</Note>

## 身份验证和模型选项

如果交互式新手引导中的提供商设置步骤失败（例如在本地未登录的情况下
选择复用 CLI），向导会显示错误并返回提供商选择器，而不是退出。
显式的 `--auth-choice` 运行仍会快速失败，以便用于自动化。

<AccordionGroup>
  <Accordion title="Anthropic API 密钥">
    如果存在 `ANTHROPIC_API_KEY`，则使用它；否则提示输入密钥，然后保存该密钥供守护进程使用。
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    交互式新手引导/配置中的首选本地路径；如果已有 Claude CLI 登录，则复用该登录。
  </Accordion>
  <Accordion title="OpenAI Code 订阅（OAuth）">
    浏览器流程；粘贴 `code#state`。

    在没有主要模型的全新设置中，通过 Codex 运行时将 `agents.defaults.model`
    设置为 `openai/gpt-5.6-sol`。

  </Accordion>
  <Accordion title="OpenAI Code 订阅（设备配对）">
    使用短期设备代码的浏览器配对流程。

    在没有主要模型的全新设置中，通过 Codex 运行时将 `agents.defaults.model`
    设置为 `openai/gpt-5.6-sol`。

  </Accordion>
  <Accordion title="OpenAI API 密钥">
    如果存在 `OPENAI_API_KEY`，则使用它；否则提示输入密钥，然后将凭据存储在身份验证配置文件中。

    在没有主要模型的全新设置中，将 `agents.defaults.model` 设置为
    `openai/gpt-5.6`；不带限定的直接 API 模型 ID 会解析到 Sol 层级。

    添加 OpenAI 或重新进行 OpenAI 身份验证时，会保留现有的显式主要
    模型，包括 `openai/gpt-5.5`。如果账号未提供 GPT-5.6，
    请显式选择 `openai/gpt-5.5`；OpenClaw 不会静默降级。

  </Accordion>
  <Accordion title="xAI（Grok）OAuth">
    面向符合条件的 SuperGrok 或 X Premium 账号的浏览器登录。这是大多数
    用户推荐使用的 xAI 路径。OpenClaw 会存储生成的身份验证
    配置文件，供 Grok 模型以及 Grok `web_search`、`x_search` 和 `code_execution` 使用。
  </Accordion>
  <Accordion title="xAI（Grok）设备代码">
    适合远程使用的浏览器登录，以短代码代替 localhost
    回调。通过 SSH、Docker 或 VPS 主机操作时，请使用此方式。
  </Accordion>
  <Accordion title="xAI（Grok）API 密钥">
    提示输入 `XAI_API_KEY`，并将 xAI 配置为模型提供商。如果你希望使用
    xAI Console API 密钥而不是订阅 OAuth，请使用此方式。
  </Accordion>
  <Accordion title="OpenCode">
    提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），并允许你选择 Zen 或 Go 目录（一个 API 密钥可同时用于两者）。
    设置 URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API 密钥（通用）">
    为你存储密钥。
  </Accordion>
  <Accordion title="Vercel AI Gateway 网关">
    提示输入 `AI_GATEWAY_API_KEY`。
    了解详情：[Vercel AI Gateway 网关](/zh-CN/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway 网关">
    提示输入账号 ID、Gateway 网关 ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    了解详情：[Cloudflare AI Gateway 网关](/zh-CN/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    自动写入配置。托管服务默认使用 `MiniMax-M3`；API 密钥设置使用
    `minimax/...`，OAuth 设置使用 `minimax-portal/...`。
    了解详情：[MiniMax](/zh-CN/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    自动为中国或全球端点上的 StepFun 标准版或 Step Plan 写入配置。
    标准版目前包含 `step-3.5-flash`，Step Plan 还包含 `step-3.5-flash-2603`。
    了解详情：[StepFun](/zh-CN/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（兼容 Anthropic）">
    提示输入 `SYNTHETIC_API_KEY`。
    了解详情：[Synthetic](/zh-CN/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（云端和本地开放模型）">
    首先提示选择 `Cloud + Local`、`Cloud only` 或 `Local only`。
    `Cloud only` 使用 `OLLAMA_API_KEY` 和 `https://ollama.com`。
    基于主机的模式会提示输入基础 URL（默认为 `http://127.0.0.1:11434`）、发现可用模型并建议默认值。
    `Cloud + Local` 还会检查该 Ollama 主机是否已登录以访问云端。
    了解详情：[Ollama](/zh-CN/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 和 Kimi Coding">
    自动写入 Moonshot（Kimi K2）和 Kimi Coding 配置。
    了解详情：[Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)。
  </Accordion>
  <Accordion title="自定义提供商">
    适用于兼容 OpenAI、兼容 OpenAI Responses 和兼容 Anthropic 的端点。

    交互式新手引导支持与其他提供商 API key 流程相同的 API key 存储方式：
    - **立即粘贴 API key**（明文）
    - **使用密钥引用**（环境变量引用或已配置的提供商引用，并进行预检验证）

    新手引导会推断常见视觉模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 及类似模型）的图像支持能力，仅在模型名称未知时询问。

    非交互式标志：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（可选；回退到 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（可选）
    - `--custom-compatibility <openai|openai-responses|anthropic>`（可选；默认为 `openai`）
    - `--custom-image-input` / `--custom-text-input`（可选；覆盖推断出的模型输入能力）

  </Accordion>
  <Accordion title="跳过">
    不配置身份验证。
  </Accordion>
</AccordionGroup>

模型行为：

- 从检测到的选项中选择默认模型，或手动输入提供商和模型。
- 当新手引导从提供商身份验证选项启动时，模型选择器会自动优先显示
  该提供商。对于 Volcengine 和 BytePlus，同一偏好设置
  还会匹配其编程套餐变体（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果按首选提供商筛选后结果为空，选择器会回退到
  完整目录，而不会显示没有模型。
- 向导会执行模型检查，并在配置的模型未知或缺少身份验证时发出警告。

凭据和配置文件路径：

- 身份验证配置文件（API key + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版 OAuth 导入：`~/.openclaw/credentials/oauth.json`

凭据存储模式：

- 默认新手引导行为会将 API key 作为明文值持久化到身份验证配置文件中。
- `--secret-input-mode ref` 启用引用模式，而不是以明文存储密钥。
  在交互式设置中，你可以选择：
  - 环境变量引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已配置的提供商引用（`file` 或 `exec`），包含提供商别名和 ID
- 交互式引用模式会在保存前执行快速预检验证。
  - 环境变量引用：验证当前新手引导环境中的变量名和非空值。
  - 提供商引用：验证提供商配置并解析请求的 ID。
  - 如果预检失败，新手引导会显示错误并允许你重试。
- 在非交互式模式下，`--secret-input-mode ref` 仅支持环境变量。
  - 在新手引导进程的环境中设置提供商环境变量。
  - 内联密钥标志（例如 `--openai-api-key`）要求设置该环境变量；否则新手引导会立即失败。
  - 对于自定义提供商，非交互式 `ref` 模式会将 `models.providers.<id>.apiKey` 存储为 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在该自定义提供商场景中，`--custom-api-key` 要求设置 `CUSTOM_API_KEY`；否则新手引导会立即失败。
- Gateway 网关身份验证凭据在交互式设置中支持明文和 SecretRef 选项：
  - 令牌模式：**生成/存储明文令牌**（默认）或**使用 SecretRef**。
  - 密码模式：明文或 SecretRef。
- 非交互式令牌 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
- 现有明文设置继续保持不变。

<Note>
无头环境和服务器提示：在带浏览器的计算机上完成 OAuth，然后将
该智能体的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或对应的
`$OPENCLAW_STATE_DIR/...` 路径）复制到 Gateway 网关主机。`credentials/oauth.json`
仅作为旧版导入源。
</Note>

## 输出和内部机制

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- 传递 `--skip-bootstrap` 时的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果选择 Minimax）
- `tools.profile`（本地新手引导在未设置时默认为 `"coding"`；现有显式值会予以保留）
- `gateway.*`（模式、绑定、身份验证、Tailscale）
- `session.dmScope`（本地新手引导在未设置时默认为 `per-channel-peer`；现有显式值会予以保留）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 当你在提示中选择启用时的渠道允许列表（Discord、iMessage、Signal、Slack、Telegram、WhatsApp）；Discord 和 Slack 还会将输入的名称解析为 ID
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

WhatsApp 凭据存放在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
活动会话和转录内容存储在
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` 中。
`~/.openclaw/agents/<agentId>/sessions/` 目录用于旧版迁移
输入和归档/支持工件。

<Note>
部分渠道以插件形式提供。在设置期间选中此类渠道时，向导会
在配置渠道之前提示安装插件（npm 或本地路径）。
</Note>

## 非交互式设置

`--non-interactive` 要求同时使用 `--accept-risk`（确认智能体
功能强大，拥有完整系统访问权限存在风险）：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

完整标志参考和提供商特定示例：[`openclaw onboard`](/zh-CN/cli/onboard)、[CLI 自动化](/zh-CN/start/wizard-cli-automation)。

## Gateway 网关向导 RPC

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

客户端（macOS 应用和 Control UI）无需重新实现新手引导逻辑即可呈现各个步骤。

## Signal 设置行为

- 从官方 `signal-cli` GitHub 发行版下载适用的发布工件（原生构建，仅限 Linux x86-64）
- 在其他平台（macOS、非 x64 Linux）上，改为通过 Homebrew 安装
- 将发布工件安装到 `~/.openclaw/tools/signal-cli/<version>/` 下
- 在配置中写入 `channels.signal.cliPath`
- 尚不支持原生 Windows；请在 WSL2 内运行新手引导以获得 Linux 安装路径

## 相关文档

- 新手引导中心：[新手引导（CLI）](/zh-CN/start/wizard)
- 自动化和脚本：[CLI 自动化](/zh-CN/start/wizard-cli-automation)
- 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)
