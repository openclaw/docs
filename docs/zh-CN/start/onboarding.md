---
read_when:
    - 设计 macOS 新手引导助手
    - 实现身份验证或身份设置
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 首次运行设置流程（macOS 应用）
title: 新手引导（macOS 应用）
x-i18n:
    generated_at: "2026-07-12T14:46:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

macOS 应用的首次运行流程：选择 Gateway 网关的运行位置、连接经过验证的 AI 后端、授予权限，然后转交给智能体自身的引导初始化流程。
有关 CLI 新手引导及两种路径的比较，请参阅[新手引导概览](/zh-CN/start/onboarding-overview)。

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
<Frame caption="阅读显示的安全通知，并据此作出决定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- 默认情况下，OpenClaw 是个人智能体：只有一个受信任的操作员边界。
- 共享/多用户设置需要严格限制：拆分信任边界、尽量减少工具访问权限，并遵循[安全性](/zh-CN/gateway/security)指南。
- 本地新手引导默认将新配置设为 `tools.profile: "coding"`，以便全新设置在不使用不受限制的 `full` 配置文件的情况下，仍可使用文件系统/运行时工具。
- 如果启用了 hooks/webhooks 或其他不受信任的内容输入源，请使用强大的现代模型层级，并保持严格的工具策略/沙箱隔离。

</Step>
<Step title="本地与远程">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway 网关**在哪里运行？

- **这台 Mac（仅本地）：**新手引导会配置身份验证，并将凭据写入本地。
- **远程（通过 SSH/Tailnet）：**新手引导**不会**配置本地身份验证；
  凭据必须已存在于 Gateway 网关主机上。远程 Gateway 网关令牌
  字段存储 macOS 应用用于连接该 Gateway 网关的令牌；
  现有的 `gateway.remote.token` SecretRef 值会一直保留，直到你
  将其替换。
- **稍后配置：**跳过设置，并使应用保持未配置状态。

<Tip>
**Gateway 网关身份验证提示：**

- 即使绑定到环回地址，Gateway 网关的身份验证模式也默认为 `token`，因此本地 WS 客户端必须进行身份验证。
- 设置 `gateway.auth.mode: "none"` 可让任何本地进程连接；仅应在完全受信任的计算机上使用此设置。
- 对于多台计算机访问或非环回地址绑定，请使用令牌。

</Tip>
</Step>
<Step title="CLI">
  本地设置会通过 npm、pnpm 或 bun 安装全局 `openclaw` CLI，
  并优先使用 npm。对于 Gateway 网关本身，Node 仍是推荐的运行时。
  已有的兼容安装将被复用。
</Step>
<Step title="连接你的 AI">
  如果已连接的 Gateway 网关已经配置了智能体模型，则会完全跳过此
  页面并打开常规智能体 UI。Crestodian 和提供商设置
  仅针对全新或配置不完整的 Gateway 网关运行。

Gateway 网关准备就绪后，新手引导会查找你已有的 AI 访问方式：
Claude Code 或 Codex 登录，或者 `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`。系统会使用真实的补全请求测试最佳选项，
并仅在获得响应后保存；测试失败时，应用会自动尝试
下一个选项，并显示上一个选项失败的原因。如果找到了多个选项，
你可以在继续之前切换选择。

设置完成后，Gemini CLI 仍可供常规智能体使用，但此处不会
提供该选项，因为它无法强制执行不使用工具的推理探测。

你还可以通过提供商自身的 OAuth 或设备配对流程登录。
内置选项包括 OpenAI/ChatGPT、OpenRouter、GitHub Copilot、Google
Gemini CLI、xAI、MiniMax 国际版和中国版，以及 Chutes。此列表来自
Gateway 网关当前启用的文本推理提供商插件，而不是固定的应用列表，
因此其他提供商无需添加提供商专用的 macOS 代码即可选择加入。

手动密钥/令牌选择器使用相同的提供商注册表。在每条路径中，
提供商都会提供其初始模型和配置；OpenClaw 在存储其身份验证配置文件之前，
会使用同样的实时测试验证凭据。在某个后端通过测试之前，“下一步”
会保持锁定，因此首次智能体聊天无法在推理不可用的情况下
启动。实时检查通过后，Crestodian 即可协助配置其余工作区、Gateway 网关、渠道和
其他可选功能；之后也可在 Settings → Crestodian 下使用它。
</Step>
<Step title="权限">

<Frame caption="选择你要授予 OpenClaw 的权限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

新手引导会请求以下 TCC 权限：自动化（AppleScript）、通知、辅助功能、屏幕录制、麦克风、语音识别、摄像头和位置。

</Step>
<Step title="完成">
  推理测试通过后，Crestodian 将负责其余可选设置，并可
  将你转交到常规智能体聊天。完成权限引导流程
  会打开同一个聊天界面；在 Crestodian 之前，应用不会创建工作区或启动单独的
  智能体设置对话。有关智能体首次实际轮次期间 Gateway 网关主机上
  发生的情况，请参阅
  [引导初始化](/zh-CN/start/bootstrapping)。
</Step>
</Steps>

## 相关内容

- [新手引导概览](/zh-CN/start/onboarding-overview)
- [入门指南](/zh-CN/start/getting-started)
