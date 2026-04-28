---
read_when:
    - 运行或配置 CLI 新手引导时
    - 设置新机器时ാരി to=final code  omitted
sidebarTitle: 'Onboarding: CLI'
summary: CLI 新手引导：用于 Gateway 网关、工作区、渠道和 Skills 的引导式设置
title: 新手引导（CLI）
x-i18n:
    generated_at: "2026-04-23T21:06:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

CLI 新手引导是在 macOS、
Linux 或 Windows（通过 WSL2；强烈推荐）上设置 OpenClaw 的**推荐**方式。
它会在一个引导流程中配置本地 Gateway 网关或远程 Gateway 网关连接，以及渠道、Skills
和工作区默认值。

```bash
openclaw onboard
```

<Info>
最快开始第一次聊天的方法：打开 Control UI（无需设置任何渠道）。运行
`openclaw dashboard` 并在浏览器中聊天。文档请参见：[Dashboard](/zh-CN/web/dashboard)。
</Info>

若要稍后重新配置：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 并不意味着非交互模式。对于脚本，请使用 `--non-interactive`。
</Note>

<Tip>
CLI 新手引导包含一个 Web 搜索步骤，你可以在其中选择提供商，
例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、
Ollama Web 搜索、Perplexity、SearXNG 或 Tavily。某些提供商需要
API 密钥，而另一些则无需密钥。你也可以稍后通过
`openclaw configure --section web` 进行配置。文档请参见：[Web tools](/zh-CN/tools/web)。
</Tip>

## 快速开始 vs 高级

新手引导一开始会让你选择 **QuickStart**（默认值）还是 **Advanced**（完全控制）。

<Tabs>
  <Tab title="QuickStart（默认值）">
    - 本地 gateway（loopback）
    - 工作区默认值（或现有工作区）
    - Gateway 网关端口 **18789**
    - Gateway 网关身份验证 **Token**（即使在 loopback 上也会自动生成）
    - 新本地设置的工具策略默认值：`tools.profile: "coding"`（现有显式 profile 会保留）
    - 私信隔离默认值：本地新手引导会在未设置时写入 `session.dmScope: "per-channel-peer"`。详情请参见：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露 **关闭**
    - Telegram + WhatsApp 私信默认使用 **allowlist**（会提示你输入电话号码）

  </Tab>
  <Tab title="Advanced（完全控制）">
    - 暴露每个步骤（模式、工作区、gateway、渠道、守护进程、Skills）。

  </Tab>
</Tabs>

## 新手引导会配置什么

**本地模式（默认）**会引导你完成以下步骤：

1. **模型/身份验证** —— 选择任意支持的提供商/身份验证流程（API 密钥、OAuth 或提供商特定手动身份验证），包括自定义提供商
   （OpenAI 兼容、Anthropic 兼容或未知自动检测）。选择一个默认模型。
   安全说明：如果该智能体将运行工具或处理 webhook/hooks 内容，请优先选择可用的最强最新一代模型，并保持工具策略严格。较弱/较旧层级更容易被提示词注入。
   对于非交互式运行，`--secret-input-mode ref` 会在 auth profile 中存储由环境变量支持的 ref，而不是明文 API 密钥值。
   在非交互式 `ref` 模式下，必须设置提供商环境变量；如果只传入内联密钥标志而没有该环境变量，则会快速失败。
   在交互式运行中，选择 secret reference 模式后，你可以指向环境变量，或已配置的 provider ref（`file` 或 `exec`），并在保存前执行快速预检验证。
   对于 Anthropic，交互式 onboarding/configure 会提供 **Anthropic Claude CLI** 作为首选本地路径，并提供 **Anthropic API 密钥** 作为推荐的生产路径。Anthropic setup-token 仍然作为受支持的 token 身份验证路径保留。
2. **工作区** —— 智能体文件所在位置（默认 `~/.openclaw/workspace`）。会初始化引导文件。
3. **Gateway 网关** —— 端口、绑定地址、身份验证模式、Tailscale 暴露。
   在交互式 token 模式下，可选择默认明文 token 存储，或选择 SecretRef。
   非交互式 token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
4. **渠道** —— 内置和内置发布的聊天渠道，例如 BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **守护进程** —— 安装 LaunchAgent（macOS）、systemd 用户单元（Linux/WSL2）或原生 Windows 计划任务，并带有按用户 Startup-folder 回退。
   如果 token 身份验证需要 token 且 `gateway.auth.token` 由 SecretRef 管理，则守护进程安装会验证它，但不会将解析后的 token 持久化到监管服务环境元数据中。
   如果 token 身份验证需要 token 且配置的 token SecretRef 无法解析，则守护进程安装会被阻止，并提供可执行的指导。
   如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，则守护进程安装会被阻止，直到显式设置 mode。
6. **健康检查** —— 启动 Gateway 网关并验证其是否正在运行。
7. **Skills** —— 安装推荐的 Skills 和可选依赖。

<Note>
重新运行新手引导**不会**清除任何内容，除非你明确选择 **Reset**（或传入 `--reset`）。
CLI `--reset` 默认作用于配置、凭证和会话；使用 `--reset-scope full` 可将工作区也包含在内。
如果配置无效或包含旧版键名，新手引导会要求你先运行 `openclaw doctor`。
</Note>

**远程模式**只会配置本地客户端，使其连接到其他地方的 Gateway 网关。
它**不会**在远程主机上安装或更改任何内容。

## 添加另一个智能体

使用 `openclaw agents add <name>` 创建一个具有独立工作区、
会话和 auth profile 的单独智能体。不带 `--workspace` 运行时会启动新手引导。

它会设置：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

说明：

- 默认工作区遵循 `~/.openclaw/workspace-<agentId>`。
- 添加 `bindings` 可路由入站消息（新手引导可以完成这一步）。
- 非交互式标志：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整参考

有关详细的逐步分解和配置输出，请参见
[CLI 设置参考](/zh-CN/start/wizard-cli-reference)。
有关非交互式示例，请参见 [CLI 自动化](/zh-CN/start/wizard-cli-automation)。
有关更深入的技术参考，包括 RPC 细节，请参见
[新手引导参考](/zh-CN/reference/wizard)。

## 相关文档

- CLI 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)
- 新手引导概览：[新手引导概览](/zh-CN/start/onboarding-overview)
- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 智能体首次运行仪式：[智能体引导](/zh-CN/start/bootstrapping)
