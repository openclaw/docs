---
read_when:
    - 设计 macOS 新手引导助手
    - 实现身份验证或身份设置
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 首次运行设置流程（macOS 应用）
title: 新手引导（macOS 应用）
x-i18n:
    generated_at: "2026-07-11T20:59:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

macOS 应用的首次运行流程：选择 Gateway 网关的运行位置，连接已验证的 AI 后端，授予权限，然后交由智能体完成其自身的引导初始化流程。
有关 CLI 新手引导及两种方式的对比，请参阅[新手引导概览](/zh-CN/start/onboarding-overview)。

<Steps>
<Step title="批准 macOS 警告">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="批准查找本地网络">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="欢迎和安全通知">
<Frame caption="阅读显示的安全通知并据此决定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- 默认情况下，OpenClaw 是个人智能体：仅设一个可信操作员边界。
- 共享或多用户设置需要严格限制：拆分信任边界，尽可能减少工具访问权限，并遵循[安全指南](/zh-CN/gateway/security)。
- 本地新手引导会将新配置默认设为 `tools.profile: "coding"`，使全新设置保留文件系统和运行时工具，同时不启用不受限制的 `full` 配置文件。
- 如果启用了钩子、Webhooks 或其他不可信内容源，请使用能力强大的现代模型层级，并保持严格的工具策略和沙箱隔离。

</Step>
<Step title="本地与远程">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway 网关**在哪里运行？

- **此 Mac（仅本地）：**新手引导会配置身份验证并在本地写入凭据。
- **远程（通过 SSH/Tailnet）：**新手引导**不会**配置本地身份验证；凭据必须已存在于 Gateway 网关主机上。远程 Gateway 网关令牌字段存储 macOS 应用用于连接该 Gateway 网关的令牌；现有的 `gateway.remote.token` SecretRef 值会一直保留，直到你将其替换。
- **稍后配置：**跳过设置，让应用保持未配置状态。

<Tip>
**Gateway 网关身份验证提示：**

- 即使绑定到 local loopback，Gateway 网关的身份验证模式也默认为 `token`，因此本地 WS 客户端必须进行身份验证。
- 设置 `gateway.auth.mode: "none"` 会允许任何本地进程连接；仅应在完全可信的机器上使用此设置。
- 对于多机器访问或非 local loopback 绑定，请使用令牌。

</Tip>
</Step>
<Step title="CLI">
  本地设置会通过 npm、pnpm 或 bun 安装全局 `openclaw` CLI，并优先使用 npm。对于 Gateway 网关本身，Node 仍是推荐的运行时。现有的兼容安装会被复用。
</Step>
<Step title="连接你的 AI">
  如果已连接的 Gateway 网关已经配置了智能体模型，则会完全跳过此页面并打开常规智能体界面。Crestodian 和提供商设置仅在 Gateway 网关为全新或配置不完整时运行。

Gateway 网关准备就绪后，新手引导会查找你已有的 AI 访问方式：Claude Code 或 Codex 登录，或者 `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`。应用会通过真实补全测试最佳选项，并且仅在其成功响应后保存；测试失败时，应用会自动尝试下一个选项，并显示前一个选项失败的原因。如果找到多个选项，你可以在继续之前切换选择。

设置完成后，Gemini CLI 仍可供常规智能体使用，但此处不会提供该选项，因为它无法强制执行无工具推理探测。

你也可以通过提供商自己的 OAuth 或设备配对流程登录。内置选项包括 OpenAI/ChatGPT、OpenRouter、GitHub Copilot、Google Gemini CLI、xAI、MiniMax Global 和 CN，以及 Chutes。此列表来自 Gateway 网关当前启用的文本推理提供商插件，而非应用内的固定列表，因此其他提供商无需添加特定于 macOS 的代码即可选择加入。

手动密钥或令牌选择器使用相同的提供商注册表。无论采用哪种方式，提供商都会提供其初始模型和配置；OpenClaw 会先使用相同的实时测试验证凭据，再存储其身份验证配置文件。在任一后端通过测试之前，“下一步”会保持锁定状态，因此首次智能体聊天无法在推理功能不可用时启动。实时检查通过后，Crestodian 即可帮助配置其余工作区、Gateway 网关、渠道及其他可选功能；之后也可在“设置 → Crestodian”中使用它。
</Step>
<Step title="权限">

<Frame caption="选择要授予 OpenClaw 的权限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

新手引导会请求以下 TCC 权限：自动化（AppleScript）、通知、辅助功能、屏幕录制、麦克风、语音识别、摄像头和位置。

</Step>
<Step title="完成">
  推理测试通过后，Crestodian 会负责其余可选设置，并可将你转到常规智能体聊天。完成权限引导流程也会打开同一个聊天界面；在 Crestodian 之前，应用不会创建工作区，也不会启动单独的智能体设置对话。有关智能体首次实际轮次期间 Gateway 网关主机上发生的情况，请参阅[引导初始化](/zh-CN/start/bootstrapping)。
</Step>
</Steps>

## 相关内容

- [新手引导概览](/zh-CN/start/onboarding-overview)
- [入门指南](/zh-CN/start/getting-started)
