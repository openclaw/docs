---
read_when:
    - 查找特定的新手引导步骤或标志
    - 使用非交互模式自动化新手引导
    - 调试新手引导行为
sidebarTitle: Onboarding Reference
summary: CLI 新手引导完整参考：每个步骤、标志和配置字段
title: 新手引导参考
x-i18n:
    generated_at: "2026-04-25T17:31:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 729a12bac6b67b32ba4b2b2068a30240d2118f5afe3812c701ee65d7b7e13018
    source_path: reference/wizard.md
    workflow: 15
---

这是 `openclaw onboard` 的完整参考。
有关高层概览，请参见 [设置向导（CLI）](/zh-CN/start/wizard)。

## 流程详情（本地模式）

<Steps>
  <Step title="现有配置检测">
    - 如果 `~/.openclaw/openclaw.json` 已存在，可选择**保留 / 修改 / 重置**。
    - 重新运行新手引导**不会**清除任何内容，除非你明确选择**重置**
      （或传入 `--reset`）。
    - CLI `--reset` 默认作用于 `config+creds+sessions`；使用 `--reset-scope full`
      还会移除工作区。
    - 如果配置无效或包含旧版键名，向导会停止，并要求
      你先运行 `openclaw doctor` 再继续。
    - 重置使用 `trash`（绝不使用 `rm`），并提供以下范围：
      - 仅配置
      - 配置 + 凭证 + 会话
      - 完整重置（还会移除工作区）
  </Step>
  <Step title="模型/认证">
    - **Anthropic API key**：如果存在 `ANTHROPIC_API_KEY` 则直接使用，否则提示输入 key，然后保存以供守护进程使用。
    - **Anthropic API key**：在新手引导/配置中是首选的 Anthropic 助手选项。
    - **Anthropic setup-token**：在新手引导/配置中仍可用，不过当可用时，OpenClaw 现在更倾向于复用 Claude CLI。
    - **OpenAI Code（Codex）订阅（OAuth）**：浏览器流程；粘贴 `code#state`。
      - 当模型未设置或已经属于 OpenAI 家族时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.5`。
    - **OpenAI Code（Codex）订阅（设备配对）**：浏览器配对流程，使用短期有效的设备代码。
      - 当模型未设置或已经属于 OpenAI 家族时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.5`。
    - **OpenAI API key**：如果存在 `OPENAI_API_KEY` 则直接使用，否则提示输入 key，然后将其存储在认证配置文件中。
      - 当模型未设置、为 `openai/*` 或 `openai-codex/*` 时，将 `agents.defaults.model` 设置为 `openai/gpt-5.5`。
    - **xAI（Grok）API key**：提示输入 `XAI_API_KEY`，并将 xAI 配置为模型提供商。
    - **OpenCode**：提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可在 https://opencode.ai/auth 获取），并允许你选择 Zen 或 Go 目录。
    - **Ollama**：先提供 **Cloud + Local**、**仅 Cloud** 或 **仅 Local**。`仅 Cloud` 会提示输入 `OLLAMA_API_KEY` 并使用 `https://ollama.com`；基于主机的模式会提示输入 Ollama base URL、发现可用模型，并在需要时自动拉取所选本地模型；`Cloud + Local` 还会检查该 Ollama 主机是否已登录以访问云端。
    - 更多细节： [Ollama](/zh-CN/providers/ollama)
    - **API key**：会为你存储该 key。
    - **Vercel AI Gateway（多模型代理）**：提示输入 `AI_GATEWAY_API_KEY`。
    - 更多细节： [Vercel AI Gateway](/zh-CN/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**：提示输入 Account ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多细节： [Cloudflare AI Gateway](/zh-CN/providers/cloudflare-ai-gateway)
    - **MiniMax**：配置会自动写入；托管默认值是 `MiniMax-M2.7`。
      API key 设置使用 `minimax/...`，OAuth 设置使用
      `minimax-portal/...`。
    - 更多细节： [MiniMax](/zh-CN/providers/minimax)
    - **StepFun**：会自动写入 StepFun 标准版或 Step Plan 的配置，可选中国或全球端点。
    - 标准版当前包括 `step-3.5-flash`，Step Plan 还包括 `step-3.5-flash-2603`。
    - 更多细节： [StepFun](/zh-CN/providers/stepfun)
    - **Synthetic（Anthropic 兼容）**：提示输入 `SYNTHETIC_API_KEY`。
    - 更多细节： [Synthetic](/zh-CN/providers/synthetic)
    - **Moonshot（Kimi K2）**：配置会自动写入。
    - **Kimi Coding**：配置会自动写入。
    - 更多细节： [Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)
    - **跳过**：暂不配置认证。
    - 从检测到的选项中选择一个默认模型（或手动输入 provider/model）。为了获得最佳质量并降低 prompt injection 风险，请选择你的 provider 栈中可用的最新一代最强模型。
    - 新手引导会运行模型检查，并在配置的模型未知或缺少认证时发出警告。
    - API key 存储模式默认使用明文 auth-profile 值。使用 `--secret-input-mode ref` 可改为存储基于环境变量的引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - 认证配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API key + OAuth）。`~/.openclaw/credentials/oauth.json` 仅用于旧版导入。
    - 更多细节： [/concepts/oauth](/zh-CN/concepts/oauth)
    <Note>
    无头/服务器提示：请先在有浏览器的机器上完成 OAuth，然后复制
    该智能体的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或对应的
    `$OPENCLAW_STATE_DIR/...` 路径）到 Gateway 网关主机上。`credentials/oauth.json`
    只是旧版导入来源。
    </Note>
  </Step>
  <Step title="工作区">
    - 默认是 `~/.openclaw/workspace`（可配置）。
    - 会为智能体 bootstrap ritual 初始化所需的工作区文件。
    - 完整工作区布局 + 备份指南： [智能体工作区](/zh-CN/concepts/agent-workspace)
  </Step>
  <Step title="Gateway 网关">
    - 端口、绑定、认证模式、Tailscale 暴露。
    - 认证建议：即使是 loopback，也保留 **Token**，这样本地 WS 客户端仍必须进行认证。
    - 在 token 模式下，交互式设置提供：
      - **生成/存储明文 token**（默认）
      - **使用 SecretRef**（可选）
      - 快速开始会在新手引导探测/仪表板 bootstrap 中复用跨 `env`、`file` 和 `exec` provider 的现有 `gateway.auth.token` SecretRef。
      - 如果该 SecretRef 已配置但无法解析，新手引导会尽早失败并给出清晰的修复提示，而不是静默降级运行时认证。
    - 在 password 模式下，交互式设置也支持明文或 SecretRef 存储。
    - 非交互 token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求新手引导进程环境中存在非空环境变量。
      - 不能与 `--gateway-token` 同时使用。
    - 仅当你完全信任所有本地进程时才禁用认证。
    - 非 loopback 绑定仍然要求认证。
  </Step>
  <Step title="渠道">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选 QR 登录。
    - [Telegram](/zh-CN/channels/telegram)：机器人 token。
    - [Discord](/zh-CN/channels/discord)：机器人 token。
    - [Google Chat](/zh-CN/channels/googlechat)：服务账号 JSON + webhook audience。
    - [Mattermost](/zh-CN/channels/mattermost)（插件）：机器人 token + base URL。
    - [Signal](/zh-CN/channels/signal)：可选安装 `signal-cli` + 账号配置。
    - [BlueBubbles](/zh-CN/channels/bluebubbles)：**iMessage 推荐方案**；服务器 URL + 密码 + webhook。
    - [iMessage](/zh-CN/channels/imessage)：旧版 `imsg` CLI 路径 + DB 访问。
    - 私信安全：默认使用配对。第一条私信会发送一个代码；通过 `openclaw pairing approve <channel> <code>` 批准，或使用 allowlist。
  </Step>
  <Step title="Web 搜索">
    - 选择一个受支持的 provider，例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG 或 Tavily（也可以跳过）。
    - 基于 API 的 provider 可以使用环境变量或现有配置进行快速设置；无需 key 的 provider 则使用各自 provider 特定的前置条件。
    - 使用 `--skip-search` 跳过。
    - 稍后配置：`openclaw configure --section web`。
  </Step>
  <Step title="守护进程安装">
    - macOS：LaunchAgent
      - 需要已登录的用户会话；对于无头场景，请使用自定义 LaunchDaemon（未随产品提供）。
    - Linux（以及通过 WSL2 的 Windows）：systemd 用户单元
      - 新手引导会尝试通过 `loginctl enable-linger <user>` 启用 lingering，这样 Gateway 网关在登出后仍可保持运行。
      - 可能会提示 sudo（写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - **运行时选择：** Node（推荐；WhatsApp/Telegram 必需）。**不推荐** Bun。
    - 如果 token 认证需要 token 且 `gateway.auth.token` 由 SecretRef 管理，守护进程安装会校验它，但不会将已解析出的明文 token 值持久化到 supervisor 服务环境元数据中。
    - 如果 token 认证需要 token 且配置的 token SecretRef 无法解析，守护进程安装会被阻止，并给出可操作的指引。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password` 且未设置 `gateway.auth.mode`，守护进程安装会被阻止，直到显式设置 mode。
  </Step>
  <Step title="健康检查">
    - 启动 Gateway 网关（如果需要）并运行 `openclaw health`。
    - 提示：`openclaw status --deep` 会在状态输出中加入实时 Gateway 网关健康探测，包括支持时的渠道探测（需要 Gateway 网关可访问）。
  </Step>
  <Step title="Skills（推荐）">
    - 读取可用的 Skills 并检查依赖要求。
    - 让你选择一个 node 管理器：**npm / pnpm**（不推荐 bun）。
    - 安装可选依赖（其中一些在 macOS 上使用 Homebrew）。
  </Step>
  <Step title="完成">
    - 显示摘要 + 后续步骤，包括 iOS/Android/macOS 应用以获得更多功能。
  </Step>
</Steps>

<Note>
如果未检测到 GUI，新手引导会打印用于 Control UI 的 SSH 端口转发说明，而不是打开浏览器。
如果缺少 Control UI 资源，新手引导会尝试构建它们；回退方式是 `pnpm ui:build`（会自动安装 UI 依赖）。
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
`--json` **不**意味着非交互模式。脚本中请使用 `--non-interactive`（以及 `--workspace`）。
</Note>

provider 特定命令示例位于 [CLI 自动化](/zh-CN/start/wizard-cli-automation#provider-specific-examples)。
本参考页用于说明标志语义和步骤顺序。

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
客户端（macOS 应用、Control UI）无需重新实现新手引导逻辑即可渲染各步骤。

## Signal 设置（signal-cli）

新手引导可以从 GitHub Releases 安装 `signal-cli`：

- 下载相应的发布资源。
- 将其存储在 `~/.openclaw/tools/signal-cli/<version>/` 下。
- 将 `channels.signal.cliPath` 写入你的配置。

说明：

- JVM 构建需要 **Java 21**。
- 可用时优先使用原生构建。
- Windows 使用 WSL2；`signal-cli` 安装会在 WSL 内按照 Linux 流程进行。

## 向导会写入什么

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果选择了 MiniMax）
- `tools.profile`（本地新手引导在未设置时默认设为 `"coding"`；现有显式值会被保留）
- `gateway.*`（模式、绑定、认证、Tailscale）
- `session.dmScope`（行为细节： [CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 当你在提示中选择启用时，会写入渠道 allowlist（Slack/Discord/Matrix/Microsoft Teams）；如有可能，名称会解析为 ID。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手动配置仍可通过直接设置 `skills.install.nodeManager` 来使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 会写入 `agents.list[]` 和可选的 `bindings`。

WhatsApp 凭证位于 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

某些渠道以插件形式交付。当你在设置期间选择其中一个时，新手引导会先提示安装它（npm 或本地路径），然后才能进行配置。

## 相关文档

- 新手引导概览： [设置向导（CLI）](/zh-CN/start/wizard)
- macOS 应用新手引导： [新手引导](/zh-CN/start/onboarding)
- 配置参考： [Gateway 网关配置](/zh-CN/gateway/configuration)
- Providers： [WhatsApp](/zh-CN/channels/whatsapp)、[Telegram](/zh-CN/channels/telegram)、[Discord](/zh-CN/channels/discord)、[Google Chat](/zh-CN/channels/googlechat)、[Signal](/zh-CN/channels/signal)、[BlueBubbles](/zh-CN/channels/bluebubbles)（iMessage）、[iMessage](/zh-CN/channels/imessage)（旧版）
- Skills： [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config)
