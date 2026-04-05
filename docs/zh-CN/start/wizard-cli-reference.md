---
read_when:
    - 你需要了解 `openclaw onboard` 的详细行为
    - 你正在调试新手引导结果或集成新手引导客户端
sidebarTitle: CLI reference
summary: CLI 设置流程、认证/模型设置、输出和内部机制的完整参考
title: CLI 设置参考
x-i18n:
    generated_at: "2026-04-05T10:10:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ec4e685e3237e450d11c45826c2bb34b82c0bba1162335f8fbb07f51ba00a70
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# CLI 设置参考

本页是 `openclaw onboard` 的完整参考。
如需简短指南，请参阅 [设置向导（CLI）](/zh-CN/start/wizard)。

## 向导的作用

本地模式（默认）会引导你完成以下内容：

- 模型和认证设置（OpenAI Code 订阅 OAuth、Anthropic Claude CLI 或 API 密钥，以及 MiniMax、GLM、Ollama、Moonshot、StepFun 和 AI Gateway 网关选项）
- 工作区位置和引导文件
- Gateway 网关设置（端口、绑定、认证、tailscale）
- 渠道和 provider（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、BlueBubbles，以及其他内置渠道插件）
- 守护进程安装（LaunchAgent、systemd 用户单元，或原生 Windows Scheduled Task，失败时回退到 Startup 文件夹）
- 健康检查
- Skills 设置

远程模式会将这台机器配置为连接到别处的 gateway。
它不会在远程主机上安装或修改任何内容。

## 本地流程细节

<Steps>
  <Step title="检测现有配置">
    - 如果 `~/.openclaw/openclaw.json` 已存在，可选择保留、修改或重置。
    - 重新运行向导不会清除任何内容，除非你明确选择重置（或传入 `--reset`）。
    - CLI `--reset` 默认作用于 `config+creds+sessions`；使用 `--reset-scope full` 还会删除工作区。
    - 如果配置无效或包含旧版键名，向导会停止，并要求你先运行 `openclaw doctor` 再继续。
    - 重置使用 `trash`，并提供以下范围：
      - 仅配置
      - 配置 + 凭证 + 会话
      - 完整重置（也会移除工作区）
  </Step>
  <Step title="模型和认证">
    - 完整选项矩阵见 [认证和模型选项](#auth-and-model-options)。
  </Step>
  <Step title="工作区">
    - 默认值为 `~/.openclaw/workspace`（可配置）。
    - 会填充首次运行引导流程所需的工作区文件。
    - 工作区布局： [智能体工作区](/zh-CN/concepts/agent-workspace)。
  </Step>
  <Step title="Gateway 网关">
    - 会提示你输入端口、绑定、认证模式和 tailscale 暴露方式。
    - 推荐：即使仅绑定到 loopback，也保持启用 token 认证，这样本地 WS 客户端仍必须进行认证。
    - 在 token 模式下，交互式设置提供：
      - **生成/存储明文 token**（默认）
      - **使用 SecretRef**（选择启用）
    - 在密码模式下，交互式设置同样支持明文或 SecretRef 存储。
    - 非交互式 token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求新手引导进程环境中存在非空环境变量。
      - 不能与 `--gateway-token` 同时使用。
    - 仅当你完全信任所有本地进程时，才禁用认证。
    - 非 loopback 绑定仍然要求认证。
  </Step>
  <Step title="渠道">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选二维码登录
    - [Telegram](/zh-CN/channels/telegram)：机器人 token
    - [Discord](/zh-CN/channels/discord)：机器人 token
    - [Google Chat](/zh-CN/channels/googlechat)：服务账户 JSON + webhook audience
    - [Mattermost](/zh-CN/channels/mattermost)：机器人 token + 基础 URL
    - [Signal](/zh-CN/channels/signal)：可选 `signal-cli` 安装 + 账户配置
    - [BlueBubbles](/zh-CN/channels/bluebubbles)：推荐用于 iMessage；服务器 URL + 密码 + webhook
    - [iMessage](/zh-CN/channels/imessage)：旧版 `imsg` CLI 路径 + DB 访问
    - 私信安全：默认使用配对。首次私信会发送一个代码；通过
      `openclaw pairing approve <channel> <code>` 批准，或使用 allowlist。
  </Step>
  <Step title="守护进程安装">
    - macOS：LaunchAgent
      - 需要已登录的用户会话；对于无头环境，请使用自定义 LaunchDaemon（未内置）。
    - Linux 和 Windows 通过 WSL2：systemd 用户单元
      - 向导会尝试执行 `loginctl enable-linger <user>`，以便 gateway 在注销后继续运行。
      - 可能会提示 sudo（写入 `/var/lib/systemd/linger`）；会先尝试无 sudo。
    - 原生 Windows：优先 Scheduled Task
      - 如果任务创建被拒绝，OpenClaw 会回退到每用户 Startup 文件夹登录项，并立即启动 gateway。
      - 仍然优先推荐 Scheduled Tasks，因为它们能提供更好的监督状态。
    - 运行时选择：Node（推荐；WhatsApp 和 Telegram 必需）。不推荐 Bun。
  </Step>
  <Step title="健康检查">
    - 启动 gateway（如果需要）并运行 `openclaw health`。
    - `openclaw status --deep` 会将 live gateway 健康探针添加到状态输出中，并在支持时包含渠道探针。
  </Step>
  <Step title="Skills">
    - 读取可用 Skills 并检查要求。
    - 让你选择节点管理器：npm、pnpm 或 bun。
    - 安装可选依赖（其中一些在 macOS 上会使用 Homebrew）。
  </Step>
  <Step title="完成">
    - 显示摘要和后续步骤，包括 iOS、Android 和 macOS 应用选项。
  </Step>
</Steps>

<Note>
如果未检测到 GUI，向导会打印用于 Control UI 的 SSH 端口转发说明，而不是打开浏览器。
如果缺少 Control UI 资源，向导会尝试构建它们；回退命令为 `pnpm ui:build`（会自动安装 UI 依赖）。
</Note>

## 远程模式细节

远程模式会将这台机器配置为连接到别处的 gateway。

<Info>
远程模式不会在远程主机上安装或修改任何内容。
</Info>

你需要设置：

- 远程 gateway URL（`ws://...`）
- 如果远程 gateway 需要认证，则设置 token（推荐）

<Note>
- 如果 gateway 仅绑定到 loopback，请使用 SSH 隧道或 tailnet。
- 设备发现提示：
  - macOS：Bonjour（`dns-sd`）
  - Linux：Avahi（`avahi-browse`）
</Note>

## 认证和模型选项

<AccordionGroup>
  <Accordion title="Anthropic API 密钥">
    如果存在则使用 `ANTHROPIC_API_KEY`，否则提示输入密钥，然后将其保存以供守护进程使用。
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    复用 gateway 主机上的本地 Claude CLI 登录，并将模型
    选择切换为规范的 `claude-cli/claude-*` 引用。

    这是 `openclaw onboard` 和
    `openclaw configure` 中可用的本地回退路径。对于生产环境，推荐使用 Anthropic API 密钥。

    - macOS：检查 Keychain 条目 “Claude Code-credentials”
    - Linux 和 Windows：如果存在，则复用 `~/.claude/.credentials.json`

    在 macOS 上，请选择 “Always Allow”，这样 launchd 启动时不会被阻塞。

  </Accordion>
  <Accordion title="OpenAI Code 订阅（复用 Codex CLI）">
    如果存在 `~/.codex/auth.json`，向导可以复用它。
    被复用的 Codex CLI 凭证仍由 Codex CLI 管理；过期时，OpenClaw
    会优先重新读取该来源，并且当 provider 能够刷新它时，会
    将刷新后的凭证写回 Codex 存储，而不是自行接管
    该凭证。
  </Accordion>
  <Accordion title="OpenAI Code 订阅（OAuth）">
    浏览器流程；粘贴 `code#state`。

    当模型未设置或为 `openai/*` 时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.4`。

  </Accordion>
  <Accordion title="OpenAI API 密钥">
    如果存在则使用 `OPENAI_API_KEY`，否则提示输入密钥，然后将该凭证存储在认证配置文件中。

    当模型未设置、为 `openai/*` 或为 `openai-codex/*` 时，将 `agents.defaults.model` 设置为 `openai/gpt-5.4`。

  </Accordion>
  <Accordion title="xAI（Grok）API 密钥">
    提示输入 `XAI_API_KEY` 并将 xAI 配置为模型 provider。
  </Accordion>
  <Accordion title="OpenCode">
    提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），并允许你选择 Zen 或 Go 目录。
    设置 URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API 密钥（通用）">
    为你存储该密钥。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    提示输入 `AI_GATEWAY_API_KEY`。
    更多详情： [Vercel AI Gateway](/zh-CN/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    提示输入账户 ID、gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多详情： [Cloudflare AI Gateway](/zh-CN/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    配置会自动写入。托管默认值为 `MiniMax-M2.7`；API 密钥设置使用
    `minimax/...`，OAuth 设置使用 `minimax-portal/...`。
    更多详情： [MiniMax](/zh-CN/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    会自动为中国或全球端点上的 StepFun standard 或 Step Plan 写入配置。
    当前 standard 包含 `step-3.5-flash`，Step Plan 还包含 `step-3.5-flash-2603`。
    更多详情： [StepFun](/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（兼容 Anthropic）">
    提示输入 `SYNTHETIC_API_KEY`。
    更多详情： [Synthetic](/zh-CN/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（云端和本地开放模型）">
    提示输入基础 URL（默认 `http://127.0.0.1:11434`），然后提供 Cloud + Local 或 Local 模式。
    会发现可用模型并建议默认值。
    更多详情： [Ollama](/zh-CN/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 和 Kimi Coding">
    Moonshot（Kimi K2）和 Kimi Coding 配置会自动写入。
    更多详情： [Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)。
  </Accordion>
  <Accordion title="自定义 provider">
    可与兼容 OpenAI 和兼容 Anthropic 的端点配合使用。

    交互式新手引导支持与其他 provider API 密钥流程相同的 API 密钥存储选择：
    - **立即粘贴 API 密钥**（明文）
    - **使用 secret 引用**（env 引用或已配置 provider 引用，带预检校验）

    非交互式标志：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（可选；默认回退到 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（可选）
    - `--custom-compatibility <openai|anthropic>`（可选；默认 `openai`）

  </Accordion>
  <Accordion title="跳过">
    不配置认证。
  </Accordion>
</AccordionGroup>

模型行为：

- 从检测到的选项中选择默认模型，或手动输入 provider 和模型。
- 当新手引导从某个 provider 认证选项启动时，模型选择器会自动优先
  该 provider。对于 Volcengine 和 BytePlus（国际版），相同的优先级
  也会匹配它们的 coding-plan 变体（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果该优先 provider 过滤结果为空，选择器会回退到完整目录，而不是显示没有模型。
- 向导会执行模型检查，并在已配置模型未知或缺少认证时发出警告。

凭证和配置文件路径：

- 认证配置文件（API 密钥 + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版 OAuth 导入：`~/.openclaw/credentials/oauth.json`

凭证存储模式：

- 默认的新手引导行为会将 API 密钥以明文值持久化到认证配置文件中。
- `--secret-input-mode ref` 会启用引用模式，而不是明文密钥存储。
  在交互式设置中，你可以选择以下任一方式：
  - 环境变量引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已配置 provider 引用（`file` 或 `exec`），带 provider 别名 + id
- 交互式引用模式会在保存前执行快速预检校验。
  - Env 引用：校验变量名，以及当前新手引导环境中的非空值。
  - Provider 引用：校验 provider 配置并解析所请求的 id。
  - 如果预检失败，新手引导会显示错误并允许你重试。
- 在非交互模式下，`--secret-input-mode ref` 仅支持基于 env。
  - 在新手引导进程环境中设置 provider 环境变量。
  - 内联密钥标志（例如 `--openai-api-key`）要求该环境变量已设置；否则新手引导会快速失败。
  - 对于自定义 provider，非交互式 `ref` 模式会将 `models.providers.<id>.apiKey` 存储为 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在该自定义 provider 场景下，`--custom-api-key` 要求设置 `CUSTOM_API_KEY`；否则新手引导会快速失败。
- Gateway 网关认证凭证在交互式设置中支持明文和 SecretRef 选择：
  - Token 模式：**生成/存储明文 token**（默认）或 **使用 SecretRef**。
  - 密码模式：明文或 SecretRef。
- 非交互式 token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
- 现有明文设置会继续照常工作。

<Note>
无头和服务器提示：在有浏览器的机器上完成 OAuth，然后复制
该智能体的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或对应的
`$OPENCLAW_STATE_DIR/...` 路径）到 gateway 主机。`credentials/oauth.json`
只是旧版导入来源。
</Note>

## 输出和内部机制

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果选择了 Minimax）
- `tools.profile`（本地新手引导在未设置时默认设为 `"coding"`；现有显式值会被保留）
- `gateway.*`（模式、绑定、认证、tailscale）
- `session.dmScope`（本地新手引导在未设置时默认设为 `per-channel-peer`；现有显式值会被保留）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 当你在提示中选择启用时的渠道 allowlist（Slack、Discord、Matrix、Microsoft Teams）（如果可能，名称会解析为 ID）
- `skills.install.nodeManager`
  - `setup --node-manager` 标志接受 `npm`、`pnpm` 或 `bun`。
  - 手动配置之后仍可将 `skills.install.nodeManager: "yarn"` 设置进去。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 会写入 `agents.list[]` 以及可选的 `bindings`。

WhatsApp 凭证存放在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存放在 `~/.openclaw/agents/<agentId>/sessions/` 下。

<Note>
某些渠道以插件形式交付。在设置期间选择它们时，向导
会先提示安装该插件（npm 或本地路径），然后再进行渠道配置。
</Note>

Gateway 网关向导 RPC：

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

客户端（macOS 应用和 Control UI）可以在不重新实现新手引导逻辑的情况下渲染步骤。

Signal 设置行为：

- 下载合适的发布产物
- 将其存储到 `~/.openclaw/tools/signal-cli/<version>/`
- 在配置中写入 `channels.signal.cliPath`
- JVM 构建需要 Java 21
- 在可用时使用原生构建
- Windows 使用 WSL2，并在 WSL 内遵循 Linux signal-cli 流程

## 相关文档

- 新手引导中心：[设置向导（CLI）](/zh-CN/start/wizard)
- 自动化和脚本：[CLI 自动化](/zh-CN/start/wizard-cli-automation)
- 命令参考：[`openclaw onboard`](/cli/onboard)
