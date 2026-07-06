---
read_when:
    - 设计 macOS 新手引导助手
    - 实现身份验证或身份设置
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 首次运行设置流程（macOS 应用）
title: 新手引导（macOS 应用）
x-i18n:
    generated_at: "2026-07-06T21:53:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1cdd8600b0d86ec598266671715cebbbe1c86e951b6a95b3e166f2309d2a9130
    source_path: start/onboarding.md
    workflow: 16
---

macOS 应用的首次运行流程：选择 Gateway 网关运行位置，连接一个
已验证的 AI 后端，授予权限，并交接给智能体自己的
引导流程。
如需了解 CLI 新手引导以及两种路径的对比，请参阅[新手引导概览](/zh-CN/start/onboarding-overview)。

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
<Step title="欢迎和安全提示">
<Frame caption="阅读显示的安全提示，并据此决定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- 默认情况下，OpenClaw 是个人智能体：一个受信任的操作员边界。
- 共享/多用户设置需要锁定：拆分信任边界，保持工具访问最小化，并遵循[安全](/zh-CN/gateway/security)。
- 本地新手引导会将新配置默认设置为 `tools.profile: "coding"`，因此全新设置会保留文件系统/运行时工具，而不会使用不受限制的 `full` 配置文件。
- 如果启用了 hooks/webhooks 或其他不受信任的内容源，请使用强大的现代模型层级，并保持严格的工具策略/沙箱隔离。

</Step>
<Step title="本地 vs 远程">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway 网关**在哪里运行？

- **这台 Mac（仅本地）：** 新手引导会在本地配置凭证并写入凭据。
- **远程（通过 SSH/Tailnet）：** 新手引导**不会**配置本地凭证；
  凭据必须已存在于网关主机上。远程网关令牌
  字段会存储 macOS 应用用于连接该 Gateway 网关的令牌；
  现有的 `gateway.remote.token` SecretRef 值会被保留，直到你
  替换它们。
- **稍后配置：** 跳过设置并让应用保持未配置状态。

<Tip>
**Gateway 网关凭证提示：**

- Gateway 网关凭证模式默认是 `token`，即使是 loopback 绑定也是如此，因此本地 WS 客户端必须进行身份验证。
- 设置 `gateway.auth.mode: "none"` 会允许任何本地进程连接；仅在完全受信任的机器上使用。
- 对于多机器访问或非 loopback 绑定，请使用令牌。

</Tip>
</Step>
<Step title="CLI">
  本地设置会通过 npm、pnpm 或 bun 安装全局 `openclaw` CLI，
  优先使用 npm。Node 仍然是 Gateway 网关
  本身的推荐运行时。会复用现有的兼容安装。
</Step>
<Step title="连接你的 AI">
  Gateway 网关就绪后，新手引导会查找你已有的 AI 访问方式：
  Claude Code、Codex 或 Gemini CLI 登录，或 `OPENAI_API_KEY` /
  `ANTHROPIC_API_KEY`。最佳选项会通过真实补全进行测试，并且
  只有在它成功应答后才会保存；当测试失败时，应用会自动尝试
  下一个选项，并显示上一个选项失败的原因。如果找到多个选项，
  你可以在继续之前切换它们。

如果未找到任何选项（或没有任何选项可用），手动密钥/令牌选择器会加载
Gateway 网关的当前文本推理提供商插件，而不是使用固定的应用
列表。所选提供商会提供其入门模型和配置；OpenClaw
会在存储其凭证配置文件之前，使用同样的实时测试验证凭据。下一步
会保持锁定，直到有一个后端通过测试，因此第一次智能体聊天无法
在推理不可用时开始。Crestodian 聊天仍可从此
页面使用（之后也可在设置 → Crestodian 下使用），以便用自然语言获得帮助。

稍后配置会跳过此步骤。
</Step>
<Step title="权限">

<Frame caption="选择你想授予 OpenClaw 的权限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

新手引导会请求以下 TCC 权限：自动化（AppleScript）、通知、辅助功能、屏幕录制、麦克风、语音识别、摄像头和位置。

</Step>
<Step title="新手引导聊天（专用会话）">
  设置完成后，应用会打开一个单独的智能体新手引导聊天，让智能体可以
  介绍自己并引导后续步骤，而不会把这次交流混入
  正常对话历史。这会接在 Crestodian 设置对话之后；
  它不会替代该对话。请参阅[引导启动](/zh-CN/start/bootstrapping)，了解
  智能体第一次真实轮次期间网关主机上会发生什么。
</Step>
</Steps>

## 相关

- [新手引导概览](/zh-CN/start/onboarding-overview)
- [入门指南](/zh-CN/start/getting-started)
