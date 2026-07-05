---
read_when:
    - 运行或配置 CLI 新手引导
    - 设置新机器
sidebarTitle: 'Onboarding: CLI'
summary: CLI 新手引导：用于 Gateway 网关、工作区、渠道和 Skills 的引导式设置
title: 新手引导（CLI）
x-i18n:
    generated_at: "2026-07-05T11:43:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd88690ba0b2be207299afece73eac465b528f4e97f4f5a0f889f69a97fb0e47
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

CLI 新手引导是 macOS、Linux 和 Windows（原生或 WSL2）上推荐的终端设置路径。它会在一个引导式流程中配置本地 Gateway 网关（或连接到远程 Gateway 网关）、渠道、Skills 和工作区默认值。`openclaw setup` 会运行同一流程（[设置](/zh-CN/cli/setup) 介绍仅配置 `--baseline` 的变体）。Windows 桌面用户也可以从 [Windows Hub](/zh-CN/platforms/windows) 开始。

提供商登录、渠道配对、守护进程安装和技能下载可能会延长快速设置时间；可选步骤可以跳过，之后再用 `openclaw configure` 重新处理。

<Info>
最快开始第一次聊天：完全跳过渠道设置。运行 `openclaw dashboard`，并通过 Control UI 在浏览器中聊天。文档：[仪表板](/zh-CN/web/dashboard)。
</Info>

## 区域设置

向导会本地化固定的新手引导文案。解析顺序：`OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG`，然后是英语。支持的区域设置：`en`、`zh-CN`、`zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

无论区域设置如何，产品名称、命令、配置键、URL、提供商 ID、模型 ID，以及插件/渠道标签都保持英文。

之后如需重新配置：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不表示非交互模式。用于脚本时，请使用 `--non-interactive`（参见 [CLI 自动化](/zh-CN/start/wizard-cli-automation)）。
</Note>

<Tip>
新手引导包含一个 Web 搜索步骤，你可以在其中选择提供商：Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG 或 Tavily。有些需要 API key；有些无需密钥。之后可用 `openclaw configure --section web` 配置。文档：[Web 工具](/zh-CN/tools/web)。
</Tip>

## 快速开始与高级

新手引导开始时会让你在**快速开始**（默认值）和**高级**（完全控制）之间选择。传入 `--flow quickstart` 或 `--flow advanced`（别名 `manual`）可跳过提示。

<Tabs>
  <Tab title="快速开始（默认值）">
    - 本地 Gateway 网关，loopback 绑定
    - 工作区默认值（或现有工作区）
    - Gateway 网关端口 **18789**
    - Gateway 网关认证 **令牌**（自动生成，即使在 loopback 上也是如此）
    - 工具策略：新设置使用 `tools.profile: "coding"`（保留现有的显式配置文件）
    - 私信隔离：新设置使用 `session.dmScope: "per-channel-peer"`。详情：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露**关闭**
    - Telegram 和 WhatsApp 私信默认使用**允许列表**：Telegram 会要求输入数字 Telegram 用户 ID，WhatsApp 会要求输入电话号码

  </Tab>
  <Tab title="高级（完全控制）">
    - 展示每个步骤：模式、工作区、Gateway 网关、渠道、守护进程、Skills

  </Tab>
</Tabs>

远程模式（`--mode remote`）始终使用高级流程；它只会配置这台机器连接到其他位置的 Gateway 网关，绝不会在远程主机上安装或更改任何内容。

## 新手引导会配置什么

本地模式（默认）会引导完成以下步骤：

1. **模型/认证** - 选择提供商认证流程（API key、OAuth 或提供商专用手动认证），包括自定义提供商（兼容 OpenAI、兼容 OpenAI Responses、兼容 Anthropic，或 Unknown 自动检测）。选择默认模型。
   安全说明：如果此智能体将运行工具或处理 webhook/hook 内容，请优先使用可用的最强最新一代模型，并保持严格的工具策略 - 较弱或较旧的层级更容易受到提示注入。
   对于非交互运行，`--secret-input-mode ref` 会存储由环境变量支持的引用，而不是明文 API key 值；被引用的环境变量必须已经设置，否则新手引导会快速失败。交互式密钥引用模式可以指向环境变量或已配置的提供商引用（`file` 或 `exec`），保存前会进行快速预检。
2. **工作区** - 智能体文件目录（默认 `~/.openclaw/workspace`）。会播种启动文件。
3. **Gateway 网关** - 端口、绑定地址、认证模式、Tailscale 暴露。在交互式令牌模式下，选择明文令牌存储（默认）或选择使用 SecretRef。非交互式 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
4. **渠道** - 内置和官方插件聊天渠道，包括 Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **守护进程** - 安装 LaunchAgent（macOS）、systemd 用户单元（Linux/WSL2），或原生 Windows 计划任务，并带有按用户的启动文件夹回退。
   如果需要令牌认证且 `gateway.auth.token` 由 SecretRef 管理，守护进程安装会验证它，但不会将解析后的令牌持久化到监督服务环境元数据中；未解析的 SecretRef 会阻止安装并给出指引。如果在 `gateway.auth.mode` 未设置时同时设置了 `gateway.auth.token` 和 `gateway.auth.password`，安装会被阻止，直到你显式设置模式。
6. **健康检查** - 启动 Gateway 网关并验证它可访问。
7. **Skills** - 安装推荐 Skills 及其可选依赖项。

<Note>
重新运行新手引导**不会**清除任何内容，除非你明确选择**重置**（或传入 `--reset`）。CLI `--reset` 默认重置配置、凭证和会话；使用 `--reset-scope full` 还会删除工作区。如果配置无效或包含旧版键，新手引导会要求你先运行 `openclaw doctor`。
</Note>

`--flow import` 会运行检测到的迁移流程（例如 Hermes），而不是全新设置；请参见[迁移](/zh-CN/cli/migrate)以及[安装](/zh-CN/install/migrating-hermes)下的迁移指南。`openclaw onboard --modern` 会启动 [Crestodian](/zh-CN/cli/crestodian)，这是一个对话式设置/修复助手，用来替代经典向导。

## 添加另一个智能体

使用 `openclaw agents add <name>` 创建一个拥有自己的工作区、会话和认证配置文件的独立智能体。不带 `--workspace` 运行时，会启动一个交互式流程来设置名称、工作区、认证、渠道和绑定 - 它不是完整的 `openclaw onboard` 向导。

它会设置：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

说明：

- 默认工作区：`~/.openclaw/workspace-<agentId>`（如果设置了 `agents.defaults.workspace`，则位于其下）。
- 添加 `bindings` 可将入站消息路由到此智能体（新手引导可以为你执行此操作）。
- 非交互标志：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整参考

有关详细的逐步行为和配置输出，请参见
[CLI 设置参考](/zh-CN/start/wizard-cli-reference)。
有关非交互示例，请参见 [CLI 自动化](/zh-CN/start/wizard-cli-automation)。
有关完整标志参考，请参见 [`openclaw onboard`](/zh-CN/cli/onboard)。

## 相关文档

- CLI 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)
- 新手引导概览：[新手引导概览](/zh-CN/start/onboarding-overview)
- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- Agent 首次运行仪式：[Agent 启动引导](/zh-CN/start/bootstrapping)
