---
read_when:
    - 运行或配置 CLI 新手引导
    - 设置新机器
sidebarTitle: 'Onboarding: CLI'
summary: CLI 新手引导：Gateway 网关、工作区、频道和 Skills 的引导式设置
title: 新手引导（CLI）
x-i18n:
    generated_at: "2026-06-27T03:23:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

CLI 新手引导是 OpenClaw 在 macOS、Linux 或 Windows 上**推荐**的终端设置路径。Windows 桌面用户也可以从
[Windows Hub](/zh-CN/platforms/windows) 开始。
它会在一个引导流程中配置本地 Gateway 网关或远程 Gateway 网关连接，以及渠道、技能和工作区默认值。

```bash
openclaw onboard
```

## 语言区域

CLI 向导会本地化固定的新手引导文案。它会依次从
`OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG` 解析语言区域，并在无法解析时回退到英语。支持的向导语言区域为 `en`、`zh-CN` 和 `zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

名称和稳定标识符保持字面不变：`OpenClaw`、`Gateway`、`Tailscale`、
命令、配置键、URL、提供商 ID、模型 ID，以及插件/渠道标签
都不会被翻译。

<Info>
最快开始第一次聊天：打开 Control UI（无需设置渠道）。运行
`openclaw dashboard` 并在浏览器中聊天。文档：[仪表板](/zh-CN/web/dashboard)。
</Info>

稍后重新配置：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 并不表示非交互模式。脚本应使用 `--non-interactive`。
</Note>

<Tip>
CLI 新手引导包含一个 Web 搜索步骤，你可以选择 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、
Ollama Web 搜索、Perplexity、SearXNG 或 Tavily 等提供商。有些提供商需要
API key，其他则不需要密钥。你也可以稍后用
`openclaw configure --section web` 配置它。文档：[Web 工具](/zh-CN/tools/web)。
</Tip>

## 快速开始与高级

新手引导从**快速开始**（默认值）与**高级**（完全控制）开始。

<Tabs>
  <Tab title="QuickStart (defaults)">
    - 本地 Gateway 网关（loopback）
    - 工作区默认值（或现有工作区）
    - Gateway 网关端口 **18789**
    - Gateway 网关凭证 **Token**（自动生成，即使在 loopback 上也是如此）
    - 新本地设置的工具策略默认值：`tools.profile: "coding"`（保留现有的显式 profile）
    - 私信隔离默认值：未设置时，本地新手引导会写入 `session.dmScope: "per-channel-peer"`。详情：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露**关闭**
    - Telegram + WhatsApp 私信默认使用**allowlist**（系统会提示你输入手机号）

  </Tab>
  <Tab title="Advanced (full control)">
    - 暴露每个步骤（模式、工作区、Gateway 网关、渠道、守护进程、Skills）。

  </Tab>
</Tabs>

## 新手引导会配置什么

**本地模式（默认）**会引导你完成以下步骤：

1. **模型/凭证** — 选择任意受支持的提供商/凭证流程（API key、OAuth 或提供商专用手动凭证），包括自定义提供商
   （OpenAI 兼容、Anthropic 兼容或未知自动检测）。选择默认模型。
   安全提示：如果此智能体将运行工具或处理 webhook/hooks 内容，请优先使用可用的最强最新一代模型，并保持严格的工具策略。较弱/较旧的层级更容易受到提示注入。
   对于非交互运行，`--secret-input-mode ref` 会在凭证 profile 中存储由环境变量支持的引用，而不是明文 API key 值。
   在非交互 `ref` 模式下，必须设置提供商环境变量；如果没有该环境变量却传入内联 key 标志，会快速失败。
   在交互运行中，选择密钥引用模式后，你可以指向环境变量或已配置的提供商引用（`file` 或 `exec`），保存前会进行快速预检验证。
   对于 Anthropic，交互式新手引导/配置会提供 **Anthropic Claude CLI** 作为首选本地路径，并提供 **Anthropic API key** 作为推荐生产路径。Anthropic setup-token 也仍作为受支持的 token 凭证路径可用。
2. **工作区** — 智能体文件的位置（默认 `~/.openclaw/workspace`）。会预置引导文件。
3. **Gateway 网关** — 端口、绑定地址、凭证模式、Tailscale 暴露。
   在交互式 token 模式中，可以选择默认明文 token 存储，或选择使用 SecretRef。
   非交互式 token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
4. **渠道** — 内置和官方插件聊天渠道，例如 iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **守护进程** — 安装 LaunchAgent（macOS）、systemd 用户单元（Linux/WSL2），或原生 Windows Scheduled Task，并带有按用户 Startup-folder 回退。
   如果 token 凭证需要 token，且 `gateway.auth.token` 由 SecretRef 管理，守护进程安装会验证它，但不会把解析后的 token 持久化到 supervisor 服务环境元数据中。
   如果 token 凭证需要 token，且配置的 token SecretRef 未解析，守护进程安装会被阻止，并提供可执行的指导。
   如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，并且未设置 `gateway.auth.mode`，守护进程安装会被阻止，直到显式设置模式。
6. **健康检查** — 启动 Gateway 网关并验证它正在运行。
7. **Skills** — 安装推荐的 Skills 和可选依赖项。

<Note>
除非你明确选择**重置**（或传入 `--reset`），否则重新运行新手引导**不会**清除任何内容。
CLI `--reset` 默认会重置配置、凭据和会话；使用 `--reset-scope full` 可包含工作区。
如果配置无效或包含旧版键，新手引导会先要求你运行 `openclaw doctor`。
</Note>

**远程模式**只会配置本地客户端以连接到其他位置的 Gateway 网关。
它**不会**在远程主机上安装或更改任何内容。

## 添加另一个智能体

使用 `openclaw agents add <name>` 创建单独的智能体，它拥有自己的工作区、
会话和凭证 profile。未带 `--workspace` 运行时会启动新手引导。

它设置的内容：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

说明：

- 默认工作区遵循 `~/.openclaw/workspace-<agentId>`。
- 添加 `bindings` 可路由入站消息（新手引导可以完成此操作）。
- 非交互标志：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整参考

有关详细的逐步拆解和配置输出，请参阅
[CLI 设置参考](/zh-CN/start/wizard-cli-reference)。
有关非交互示例，请参阅 [CLI 自动化](/zh-CN/start/wizard-cli-automation)。
有关更深入的技术参考（包括 RPC 详情），请参阅
[新手引导参考](/zh-CN/reference/wizard)。

## 相关文档

- CLI 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)
- 新手引导概览：[新手引导概览](/zh-CN/start/onboarding-overview)
- macOS app 新手引导：[新手引导](/zh-CN/start/onboarding)
- Agent 首次运行仪式：[Agent 引导](/zh-CN/start/bootstrapping)
