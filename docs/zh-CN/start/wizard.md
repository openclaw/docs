---
read_when:
    - 运行或配置 CLI 新手引导
    - 设置新机器
sidebarTitle: 'Onboarding: CLI'
summary: CLI 新手引导：验证推理，然后将剩余设置交给 Crestodian
title: 新手引导（CLI）
x-i18n:
    generated_at: "2026-07-14T14:07:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: d95e2a0803d2af9ac1f0d3790f023aad4371c6c86c2387ddc17e52e8774de9e8
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

CLI 新手引导是在 macOS、Linux 和 Windows（原生或 WSL2）上推荐使用的终端设置路径。默认情况下，它会检测计算机上已有的 AI 访问方式，通过一次真实补全进行验证，然后启动 Crestodian，以配置工作区、Gateway 网关和可选功能。`openclaw setup` 运行相同的流程（[设置](/zh-CN/cli/setup)介绍了仅配置的 `--baseline` 变体）。Windows 桌面用户也可以从 [Windows Hub](/zh-CN/platforms/windows) 开始。

引导式新手引导会先建立推理能力。它会检测可用的 AI 访问方式，要求成功完成一次真实补全，之后才启动 [Crestodian](/zh-CN/cli/crestodian)，以配置 OpenClaw 的其余部分。选择 **Skip for now** 会退出新手引导，而不启动 Crestodian。

经典向导仍可用于自定义提供商、远程 Gateway 网关设置、渠道配对、守护进程控制、Skills 和导入。使用 `openclaw onboard --classic` 显式运行它；引导式推理选择器不会转入该向导。推理通过后，Crestodian 可以使用 `open channel wizard for
<channel>`，将需要密钥的渠道设置交给对敏感信息进行掩码处理的终端向导。
要更改模型提供商或其身份验证，请退出 Crestodian 并运行 `openclaw onboard`；Crestodian 不会打开引导式或经典提供商流程。

<Info>
最快开始首次聊天的方法：完成引导式设置，运行 `openclaw dashboard`，然后通过 Control UI 在浏览器中聊天。文档：[仪表板](/zh-CN/web/dashboard)。
</Info>

## 区域设置

向导会本地化固定的新手引导文案。解析顺序：`OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG`，最后是英语。支持的区域设置：`en`、`zh-CN`、`zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

无论区域设置如何，产品名称、命令、配置键、URL、提供商 ID、模型 ID 以及插件/渠道标签都保持英文。

以后要重新配置非推理设置：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 并不表示非交互模式。对于脚本，请使用 `--non-interactive`（参见 [CLI 自动化](/zh-CN/start/wizard-cli-automation)）。
</Note>

<Tip>
经典向导包含一个 Web 搜索步骤，可在其中选择提供商：Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG 或 Tavily。部分提供商需要 API key，其他提供商无需密钥。以后可使用 `openclaw configure --section web` 进行配置。文档：
[Web 工具](/zh-CN/tools/web)。
</Tip>

## 引导式默认流程

直接运行 `openclaw onboard` 会遵循以下流程：

1. 接受安全声明。
2. 检测已配置的模型、API-key 环境变量以及受支持的本地 AI CLI。
3. 通过一次真实补全测试第一个检测到的候选项。如果失败，则显示原因并继续测试下一个可用候选项。
4. 如果所有检测项均已尝试完毕，则选择 OpenAI、Anthropic、xAI (Grok)、Google 或 OpenRouter，也可以选择 **More…** 查看其余提供商。每个提供商的区域、套餐以及受支持的浏览器、设备、API-key 或令牌方式会显示在第二个菜单中，并使用相同的真实补全进行测试。
   选择 **Skip for now** 可退出，而不启动 Crestodian。
5. 仅持久化已验证的模型路由及其所需的任何凭据/插件状态。工作区和 Gateway 网关设置保持不变。
6. 使用已验证的模型启动 Crestodian，以便配置工作区、Gateway 网关、渠道、智能体、插件和其余可选设置。

在已配置的安装环境中重新运行该命令时，会先测试当前默认模型，使引导式流程同时成为验证和修复流程。检查失败时绝不会自动替换已配置的模型；新手引导会停止并询问如何继续。对于后续的非推理功能添加，请运行 `openclaw channels add` 或 `openclaw configure`；如需更改提供商或身份验证路由，请使用 `openclaw onboard`。

## 经典向导：QuickStart 与 Advanced

运行 `openclaw onboard --classic` 以打开完整向导。首先需要在 **QuickStart**（默认设置）与 **Advanced**（完全控制）之间进行选择。传入 `--flow quickstart` 或 `--flow advanced`（别名为 `manual`）可选择经典流程并跳过该提示。

<Tabs>
  <Tab title="QuickStart（默认设置）">
    - 本地 Gateway 网关，绑定 local loopback
    - 默认工作区（或现有工作区）
    - Gateway 网关端口 **18789**
    - Gateway 网关身份验证 **Token**（自动生成，即使使用 local loopback 也是如此）
    - 工具策略：新设置使用 `tools.profile: "coding"`（保留现有的显式配置文件）
    - 私信隔离：新设置使用 `session.dmScope: "per-channel-peer"`。详情：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露 **Off**
    - Telegram 和 WhatsApp 私信默认为 **allowlist**：Telegram 会要求提供数字形式的 Telegram 用户 ID，WhatsApp 会要求提供电话号码

  </Tab>
  <Tab title="Advanced（完全控制）">
    - 显示每个步骤：模式、工作区、Gateway 网关、渠道、守护进程、Skills

  </Tab>
</Tabs>

远程模式（`--mode remote`）始终使用高级流程；它只会配置本机连接到其他位置的 Gateway 网关，绝不会在远程主机上安装或更改任何内容。

## 经典新手引导的配置内容

本地模式（默认）会依次执行以下步骤：

1. **模型/身份验证** - 选择提供商身份验证流程（API key、OAuth 或提供商专用的手动身份验证），包括自定义提供商（兼容 OpenAI、兼容 OpenAI Responses、兼容 Anthropic 或未知自动检测）。选择默认模型。
   全新的 OpenAI API-key 设置默认为 `openai/gpt-5.6`（不带其他限定的直接 API ID 会解析为 Sol）；全新的 ChatGPT/Codex 设置默认为 `openai/gpt-5.6-sol`。重新运行设置会保留现有的显式模型，包括 `openai/gpt-5.5`。如果账户未提供 GPT-5.6，请显式选择 `openai/gpt-5.5`。
   安全提示：如果此智能体将运行工具或处理 webhook/hook 内容，请优先使用可用的最强最新一代模型，并保持严格的工具策略——较弱或较旧的层级更容易受到提示注入攻击。
   对于非交互式运行，`--secret-input-mode ref` 会存储由环境变量支持的引用，而不是明文 API key 值；引用的环境变量必须已经设置，否则新手引导会立即失败。交互式密钥引用模式可以指向环境变量或已配置的提供商引用（`file` 或 `exec`），并会在保存前执行快速预检。完成模型/身份验证设置后，向导会提供可选的实时补全测试；如果失败，可以返回模型/身份验证设置一次，也可以忽略失败并继续经典向导的其余部分。忽略失败不会解锁 Crestodian；对话式设置仍要求推理检查通过。
2. **工作区** - 智能体文件所在的目录（默认为 `~/.openclaw/workspace`）。植入引导文件。
3. **Gateway 网关** - 端口、绑定地址、身份验证模式、Tailscale 暴露。在交互式令牌模式下，选择明文令牌存储（默认），或选择使用 SecretRef。非交互式 SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
4. **渠道** - 内置及官方插件聊天渠道，包括 Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **守护进程** - 安装 LaunchAgent（macOS）、systemd 用户单元（Linux/WSL2），或带有每用户启动文件夹回退方案的原生 Windows 计划任务。
   如果要求令牌身份验证且 `gateway.auth.token` 由 SecretRef 管理，守护进程安装会验证它，但不会将解析后的令牌持久化到监管服务的环境元数据中；无法解析的 SecretRef 会阻止安装并提供指导。如果 `gateway.auth.token` 和 `gateway.auth.password` 均已设置，而 `gateway.auth.mode` 未设置，则安装会被阻止，直到显式设置模式。
6. **健康检查** - 启动 Gateway 网关并验证其可访问。
7. **Skills** - 安装推荐的 Skills 及其可选依赖项。

<Note>
重新运行新手引导**不会**清除任何内容，除非显式选择 **Reset**（或传入 `--reset`）。CLI `--reset` 默认清除配置、凭据和会话；使用 `--reset-scope full` 还可移除工作区。如果配置无效或包含旧版键，新手引导会要求先运行 `openclaw doctor`。
</Note>

`--flow import` 会在经典向导中运行检测到的迁移流程（例如 Hermes），而不是进行全新设置；参见[迁移](/zh-CN/cli/migrate)以及[安装](/zh-CN/install/migrating-hermes)下的迁移指南。`openclaw onboard --modern` 是 [Crestodian](/zh-CN/cli/crestodian) 的兼容性别名。它使用与 `openclaw crestodian` 相同的推理门槛：推理验证通过后启动助手，而交互式验证失败则返回引导式推理设置。

## 添加另一个智能体

使用 `openclaw agents add <name>` 创建一个独立的智能体，该智能体拥有自己的工作区、会话和身份验证配置文件。不带 `--workspace` 运行时，会启动用于设置名称、工作区、身份验证、渠道和绑定的交互式流程——它并不是完整的 `openclaw onboard` 向导。

设置内容：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意：

- 默认工作区：`~/.openclaw/workspace-<agentId>`（如果设置了 `agents.defaults.workspace`，则位于该目录下）。
- 添加 `bindings`，将入站消息路由到此智能体（新手引导可以代为完成）。
- 非交互式标志：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整参考

有关详细的分步行为和配置输出，请参见 [CLI 设置参考](/zh-CN/start/wizard-cli-reference)。
有关非交互式示例，请参见 [CLI 自动化](/zh-CN/start/wizard-cli-automation)。
有关完整的标志参考，请参见 [`openclaw onboard`](/zh-CN/cli/onboard)。

## 相关文档

- CLI 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)
- 新手引导概览：[新手引导概览](/zh-CN/start/onboarding-overview)
- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 智能体首次运行仪式：[智能体引导初始化](/zh-CN/start/bootstrapping)
