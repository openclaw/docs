---
read_when:
    - 你需要了解 `openclaw onboard` 的详细行为
    - 你正在调试新手引导结果，或正在集成新手引导客户端
sidebarTitle: CLI reference
summary: CLI 设置流程、认证 / 模型设置、输出和内部机制的完整参考
title: CLI 设置参考
x-i18n:
    generated_at: "2026-04-24T19:58:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 951b8f0b0b6b70faaa6faafad998e74183f79aa8c4c50f622b24df786f1feea7
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

本页是 `openclaw onboard` 的完整参考。
如需简短指南，请参阅[设置向导（CLI）](/zh-CN/start/wizard)。

## 向导会做什么

本地模式（默认）会引导你完成以下内容：

- 模型和认证设置（OpenAI Code 订阅 OAuth、Anthropic Claude CLI 或 API 键，以及 MiniMax、GLM、Ollama、Moonshot、StepFun 和 AI Gateway 网关选项）
- 工作区位置和引导文件
- Gateway 网关设置（端口、绑定、认证、tailscale）
- 渠道和提供商（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、BlueBubbles，以及其他内置渠道插件）
- 守护进程安装（LaunchAgent、systemd 用户单元，或原生 Windows Scheduled Task，失败时回退到启动文件夹）
- 健康检查
- Skills 设置

远程模式会将这台机器配置为连接到另一处的 Gateway 网关。
它不会在远程主机上安装或修改任何内容。

## 本地流程详情

<Steps>
  <Step title="现有配置检测">
    - 如果存在 `~/.openclaw/openclaw.json`，可选择保留、修改或重置。
    - 重新运行向导不会清除任何内容，除非你明确选择重置（或传入 `--reset`）。
    - CLI `--reset` 默认是 `config+creds+sessions`；使用 `--reset-scope full` 还会移除工作区。
    - 如果配置无效或包含旧版键，向导会停止并要求你先运行 `openclaw doctor` 再继续。
    - 重置使用 `trash`，并提供以下范围：
      - 仅配置
      - 配置 + 凭证 + 会话
      - 完全重置（也会移除工作区）
  </Step>
  <Step title="模型和认证">
    - 完整选项矩阵见[认证和模型选项](#auth-and-model-options)。
  </Step>
  <Step title="工作区">
    - 默认 `~/.openclaw/workspace`（可配置）。
    - 写入首次运行引导仪式所需的工作区文件。
    - 工作区布局：[智能体工作区](/zh-CN/concepts/agent-workspace)。
  </Step>
  <Step title="Gateway 网关">
    - 提示你设置端口、绑定、认证模式和 tailscale 暴露方式。
    - 建议：即使仅绑定到 loopback，也保持启用令牌认证，这样本地 WS 客户端仍必须认证。
    - 在令牌模式下，交互式设置提供：
      - **生成 / 存储明文令牌**（默认）
      - **使用 SecretRef**（可选启用）
    - 在密码模式下，交互式设置也支持明文或 SecretRef 存储。
    - 非交互式令牌 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求在新手引导进程环境中存在非空环境变量。
      - 不能与 `--gateway-token` 组合使用。
    - 只有在你完全信任每个本地进程时才禁用认证。
    - 非 loopback 绑定仍然必须启用认证。
  </Step>
  <Step title="渠道">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选 QR 登录
    - [Telegram](/zh-CN/channels/telegram)：机器人令牌
    - [Discord](/zh-CN/channels/discord)：机器人令牌
    - [Google Chat](/zh-CN/channels/googlechat)：服务账号 JSON + webhook audience
    - [Mattermost](/zh-CN/channels/mattermost)：机器人令牌 + 基础 URL
    - [Signal](/zh-CN/channels/signal)：可选 `signal-cli` 安装 + 账号配置
    - [BlueBubbles](/zh-CN/channels/bluebubbles)：推荐用于 iMessage；服务器 URL + 密码 + webhook
    - [iMessage](/zh-CN/channels/imessage)：旧版 `imsg` CLI 路径 + DB 访问
    - 私信安全：默认使用配对。首次私信会发送一个代码；通过
      `openclaw pairing approve <channel> <code>` 批准，或使用允许列表。
  </Step>
  <Step title="守护进程安装">
    - macOS：LaunchAgent
      - 需要已登录的用户会话；若为无头环境，请使用自定义 LaunchDaemon（未随产品提供）。
    - Linux 和通过 WSL2 的 Windows：systemd 用户单元
      - 向导会尝试执行 `loginctl enable-linger <user>`，以便 Gateway 网关在注销后仍保持运行。
      - 可能会提示使用 sudo（写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - 原生 Windows：优先使用 Scheduled Task
      - 如果任务创建被拒绝，OpenClaw 会回退到每用户启动文件夹登录项，并立即启动 Gateway 网关。
      - 仍然优先推荐 Scheduled Task，因为它们提供更好的监督器状态。
    - 运行时选择：Node（推荐；WhatsApp 和 Telegram 必需）。不推荐 Bun。
  </Step>
  <Step title="健康检查">
    - 启动 Gateway 网关（如有需要）并运行 `openclaw health`。
    - `openclaw status --deep` 会将实时 Gateway 网关健康探测加入状态输出，在支持时还包括渠道探测。
  </Step>
  <Step title="Skills">
    - 读取可用 Skills 并检查要求。
    - 让你选择节点管理器：npm、pnpm 或 bun。
    - 安装可选依赖（其中一些在 macOS 上使用 Homebrew）。
  </Step>
  <Step title="完成">
    - 显示摘要和后续步骤，包括 iOS、Android 和 macOS 应用选项。
  </Step>
</Steps>

<Note>
如果未检测到 GUI，向导会打印 Control UI 的 SSH 端口转发说明，而不是打开浏览器。
如果缺少 Control UI 资源，向导会尝试构建它们；回退方案是 `pnpm ui:build`（会自动安装 UI 依赖）。
</Note>

## 远程模式详情

远程模式会将这台机器配置为连接到另一处的 Gateway 网关。

<Info>
远程模式不会在远程主机上安装或修改任何内容。
</Info>

你需要设置：

- 远程 Gateway 网关 URL（`ws://...`）
- 如果远程 Gateway 网关要求认证，则设置令牌（推荐）

<Note>
- 如果 Gateway 网关仅限 loopback，请使用 SSH 隧道或 tailnet。
- 设备发现提示：
  - macOS：Bonjour（`dns-sd`）
  - Linux：Avahi（`avahi-browse`）
</Note>

## 认证和模型选项

<AccordionGroup>
  <Accordion title="Anthropic API 键">
    如果存在则使用 `ANTHROPIC_API_KEY`，否则提示输入键，然后保存以供守护进程使用。
  </Accordion>
  <Accordion title="OpenAI Code 订阅（OAuth）">
    浏览器流程；粘贴 `code#state`。

    当模型未设置，或已是 OpenAI 家族模型时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI Code 订阅（设备配对）">
    使用短期有效设备码的浏览器配对流程。

    当模型未设置，或已是 OpenAI 家族模型时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI API 键">
    如果存在则使用 `OPENAI_API_KEY`，否则提示输入键，然后将凭证存储到认证配置档案中。

    当模型未设置、为 `openai/*` 或 `openai-codex/*` 时，将 `agents.defaults.model` 设置为 `openai/gpt-5.4`。

  </Accordion>
  <Accordion title="xAI（Grok）API 键">
    提示输入 `XAI_API_KEY`，并将 xAI 配置为模型提供商。
  </Accordion>
  <Accordion title="OpenCode">
    提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），并让你选择 Zen 或 Go 目录。
    设置 URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API 键（通用）">
    为你存储该键。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    提示输入 `AI_GATEWAY_API_KEY`。
    更多详情：[Vercel AI Gateway](/zh-CN/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    提示输入账号 ID、gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多详情：[Cloudflare AI Gateway](/zh-CN/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    配置会自动写入。托管默认模型是 `MiniMax-M2.7`；API 键设置使用
    `minimax/...`，OAuth 设置使用 `minimax-portal/...`。
    更多详情：[MiniMax](/zh-CN/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    会自动写入 StepFun 标准版或 Step Plan 在中国或全球端点上的配置。
    标准版当前包含 `step-3.5-flash`，Step Plan 还包含 `step-3.5-flash-2603`。
    更多详情：[StepFun](/zh-CN/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（兼容 Anthropic）">
    提示输入 `SYNTHETIC_API_KEY`。
    更多详情：[Synthetic](/zh-CN/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（云端和本地开放模型）">
    首先提示选择 `Cloud + Local`、`Cloud only` 或 `Local only`。
    `Cloud only` 使用 `OLLAMA_API_KEY` 和 `https://ollama.com`。
    基于主机的模式会提示输入基础 URL（默认 `http://127.0.0.1:11434`），发现可用模型，并推荐默认值。
    `Cloud + Local` 还会检查该 Ollama 主机是否已登录以获取云访问。
    更多详情：[Ollama](/zh-CN/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 和 Kimi Coding">
    Moonshot（Kimi K2）和 Kimi Coding 配置会自动写入。
    更多详情：[Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)。
  </Accordion>
  <Accordion title="自定义提供商">
    适用于兼容 OpenAI 和兼容 Anthropic 的端点。

    交互式新手引导支持与其他提供商 API 键流程相同的 API 键存储选项：
    - **立即粘贴 API 键**（明文）
    - **使用 secret reference**（环境变量引用或已配置提供商引用，并带预检验证）

    非交互式标志：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（可选；回退到 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（可选）
    - `--custom-compatibility <openai|anthropic>`（可选；默认 `openai`）

  </Accordion>
  <Accordion title="跳过">
    保持认证未配置。
  </Accordion>
</AccordionGroup>

模型行为：

- 从检测到的选项中选择默认模型，或手动输入提供商和模型。
- 当新手引导从某个提供商认证选项开始时，模型选择器会自动优先
  该提供商。对于 Volcengine 和 BytePlus，这一优先级
  也会匹配它们的 coding-plan 变体（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果这个“优先提供商”筛选结果为空，模型选择器会回退到
  完整目录，而不是显示没有模型。
- 向导会运行模型检查，并在配置的模型未知或缺少认证时发出警告。

凭证和配置档案路径：

- 认证配置档案（API 键 + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版 OAuth 导入：`~/.openclaw/credentials/oauth.json`

凭证存储模式：

- 默认的新手引导行为会将 API 键作为明文值持久化到认证配置档案中。
- `--secret-input-mode ref` 启用引用模式，而不是明文键存储。
  在交互式设置中，你可以选择以下任一方式：
  - 环境变量引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已配置提供商引用（`file` 或 `exec`），带提供商别名 + id
- 交互式引用模式会在保存前运行快速预检验证。
  - 环境变量引用：验证变量名，以及当前新手引导环境中存在非空值。
  - 提供商引用：验证提供商配置并解析所请求的 id。
  - 如果预检失败，新手引导会显示错误并允许你重试。
- 在非交互式模式下，`--secret-input-mode ref` 仅支持环境变量后端。
  - 在新手引导进程环境中设置提供商环境变量。
  - 内联键标志（例如 `--openai-api-key`）要求对应环境变量已设置；否则新手引导会快速失败。
  - 对于自定义提供商，非交互式 `ref` 模式会将 `models.providers.<id>.apiKey` 存储为 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在该自定义提供商场景中，`--custom-api-key` 要求已设置 `CUSTOM_API_KEY`；否则新手引导会快速失败。
- Gateway 网关认证凭证在交互式设置中支持明文和 SecretRef 选择：
  - 令牌模式：**生成 / 存储明文令牌**（默认）或 **使用 SecretRef**。
  - 密码模式：明文或 SecretRef。
- 非交互式令牌 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
- 现有明文设置将继续保持不变并正常工作。

<Note>
无头环境和服务器提示：可先在有浏览器的机器上完成 OAuth，然后复制
该智能体的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或匹配的
`$OPENCLAW_STATE_DIR/...` 路径）到 Gateway 网关主机。`credentials/oauth.json`
只是一个旧版导入来源。
</Note>

## 输出和内部机制

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- 传入 `--skip-bootstrap` 时的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果选择了 MiniMax）
- `tools.profile`（本地新手引导在未设置时默认设为 `"coding"`；已有的显式值会保留）
- `gateway.*`（模式、绑定、认证、tailscale）
- `session.dmScope`（本地新手引导在未设置时默认设为 `per-channel-peer`；已有的显式值会保留）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 当你在提示中选择启用时的渠道允许列表（Slack、Discord、Matrix、Microsoft Teams）（名称会在可能时解析为 ID）
- `skills.install.nodeManager`
  - `setup --node-manager` 标志接受 `npm`、`pnpm` 或 `bun`。
  - 稍后手动配置时仍可将 `skills.install.nodeManager: "yarn"` 设为 `"yarn"`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 会写入 `agents.list[]` 和可选的 `bindings`。

WhatsApp 凭证位于 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

<Note>
某些渠道以插件形式提供。在设置期间选择它们时，向导会先提示安装该插件（npm 或本地路径），然后再进行渠道配置。
</Note>

Gateway 网关向导 RPC：

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

客户端（macOS 应用和 Control UI）可以渲染这些步骤，而无需重新实现新手引导逻辑。

Signal 设置行为：

- 下载相应的发布资源
- 将其存储在 `~/.openclaw/tools/signal-cli/<version>/`
- 在配置中写入 `channels.signal.cliPath`
- JVM 构建需要 Java 21
- 可用时使用原生构建
- Windows 使用 WSL2，并在 WSL 内遵循 Linux 的 signal-cli 流程

## 相关文档

- 新手引导中心：[设置向导（CLI）](/zh-CN/start/wizard)
- 自动化和脚本：[CLI 自动化](/zh-CN/start/wizard-cli-automation)
- 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)
