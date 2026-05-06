---
read_when:
    - 运行或配置 CLI 新手引导
    - 设置新机器
sidebarTitle: 'Onboarding: CLI'
summary: CLI 新手引导：Gateway 网关、工作区、渠道和 Skills 的引导式设置
title: 新手引导（CLI）
x-i18n:
    generated_at: "2026-05-06T06:20:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI 新手引导是在 macOS、Linux 或 Windows（通过 WSL2；强烈推荐）上设置 OpenClaw 的**推荐**方式。
它会在一个引导流程中配置本地 Gateway 网关或远程 Gateway 网关连接，以及渠道、Skills 和工作区默认值。

```bash
openclaw onboard
```

<Info>
最快开始第一次聊天：打开 Control UI（无需设置渠道）。运行
`openclaw dashboard` 并在浏览器中聊天。文档：[Dashboard](/zh-CN/web/dashboard)。
</Info>

稍后重新配置：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 并不表示非交互模式。对于脚本，请使用 `--non-interactive`。
</Note>

<Tip>
CLI 新手引导包含一个 Web 搜索步骤，你可以在其中选择 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG 或 Tavily 等提供商。有些提供商需要 API key，其他则无需密钥。你也可以稍后用
`openclaw configure --section web` 配置此项。文档：[Web 工具](/zh-CN/tools/web)。
</Tip>

## 快速开始与高级

新手引导从**快速开始**（默认值）与**高级**（完全控制）开始。

<Tabs>
  <Tab title="快速开始（默认值）">
    - 本地 Gateway 网关（local loopback）
    - 工作区默认值（或现有工作区）
    - Gateway 网关端口 **18789**
    - Gateway 网关认证 **Token**（自动生成，即使在 loopback 上也是如此）
    - 新本地设置的工具策略默认值：`tools.profile: "coding"`（会保留现有的显式 profile）
    - 私信隔离默认值：未设置时，本地新手引导会写入 `session.dmScope: "per-channel-peer"`。详情：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露**关闭**
    - Telegram + WhatsApp 私信默认使用**允许列表**（系统会提示你输入电话号码）

  </Tab>
  <Tab title="高级（完全控制）">
    - 暴露每个步骤（模式、工作区、Gateway 网关、渠道、守护进程、Skills）。

  </Tab>
</Tabs>

## 新手引导会配置什么

**本地模式（默认）**会引导你完成以下步骤：

1. **模型/凭证** — 选择任何受支持的提供商/凭证流程（API key、OAuth 或提供商特定的手动凭证），包括自定义提供商
   （兼容 OpenAI、兼容 Anthropic 或未知自动检测）。选择默认模型。
   安全注意事项：如果此智能体将运行工具或处理 webhook/hooks 内容，请优先使用可用的最强最新一代模型，并保持严格的工具策略。较弱/较旧的层级更容易受到提示注入攻击。
   对于非交互运行，`--secret-input-mode ref` 会在凭证 profile 中存储由环境变量支持的 ref，而不是明文 API key 值。
   在非交互 `ref` 模式中，必须设置提供商环境变量；如果未设置该环境变量却传入内联密钥 flag，会快速失败。
   在交互运行中，选择密钥引用模式后，你可以指向环境变量或已配置的提供商 ref（`file` 或 `exec`），并在保存前进行快速预检验证。
   对于 Anthropic，交互式新手引导/配置会将 **Anthropic Claude CLI** 作为首选本地路径，并将 **Anthropic API key** 作为推荐生产路径。Anthropic setup-token 也仍作为受支持的 token 认证路径提供。
2. **工作区** — 智能体文件的位置（默认 `~/.openclaw/workspace`）。会植入引导文件。
3. **Gateway 网关** — 端口、绑定地址、认证模式、Tailscale 暴露。
   在交互式 token 模式中，选择默认明文 token 存储，或选择使用 SecretRef。
   非交互 token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
4. **渠道** — 内置和捆绑的聊天渠道，例如 BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **守护进程** — 安装 LaunchAgent（macOS）、systemd 用户单元（Linux/WSL2），或原生 Windows Scheduled Task，并带有每用户 Startup 文件夹回退。
   如果 token 认证需要 token，且 `gateway.auth.token` 由 SecretRef 管理，守护进程安装会验证它，但不会将解析后的 token 持久化到 supervisor 服务环境元数据中。
   如果 token 认证需要 token，且配置的 token SecretRef 未解析，守护进程安装会被阻止，并给出可执行的指导。
   如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，守护进程安装会被阻止，直到显式设置模式。
6. **健康检查** — 启动 Gateway 网关并验证它正在运行。
7. **Skills** — 安装推荐 Skills 和可选依赖项。

<Note>
重新运行新手引导**不会**清除任何内容，除非你显式选择**重置**（或传入 `--reset`）。
CLI `--reset` 默认会重置配置、凭据和会话；使用 `--reset-scope full` 可包括工作区。
如果配置无效或包含旧版键名，新手引导会要求你先运行 `openclaw doctor`。
</Note>

**远程模式**只会配置本地客户端以连接到其他位置的 Gateway 网关。
它**不会**在远程主机上安装或更改任何内容。

## 添加另一个智能体

使用 `openclaw agents add <name>` 创建一个单独的智能体，它拥有自己的工作区、
会话和凭证 profile。不带 `--workspace` 运行会启动新手引导。

它会设置：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意事项：

- 默认工作区遵循 `~/.openclaw/workspace-<agentId>`。
- 添加 `bindings` 以路由入站消息（新手引导可以完成此操作）。
- 非交互 flag：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整参考

有关详细的分步骤拆解和配置输出，请参阅
[CLI 设置参考](/zh-CN/start/wizard-cli-reference)。
有关非交互示例，请参阅 [CLI Automation](/zh-CN/start/wizard-cli-automation)。
有关更深入的技术参考（包括 RPC 详情），请参阅
[Onboarding Reference](/zh-CN/reference/wizard)。

## 相关文档

- CLI 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)
- 新手引导概览：[Onboarding Overview](/zh-CN/start/onboarding-overview)
- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 智能体首次运行仪式：[Agent Bootstrapping](/zh-CN/start/bootstrapping)
