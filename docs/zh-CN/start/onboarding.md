---
read_when:
    - 设计 macOS 新手引导助手
    - 实现鉴权或身份设置
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 首次运行设置流程（macOS 应用）
title: 新手引导（macOS 应用）
x-i18n:
    generated_at: "2026-04-05T10:09:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c5f313a8e5c3a2e68a9488f07c40fcdf75b170dc868c7614565ad9f67755d6
    source_path: start/onboarding.md
    workflow: 15
---

# 新手引导（macOS 应用）

本文档描述了 **当前** 的首次运行设置流程。目标是提供流畅的“第 0 天”体验：选择 Gateway 网关运行位置、连接鉴权、运行向导，并让智能体自行完成引导。
有关新手引导路径的总体概览，请参阅 [新手引导概览](/zh-CN/start/onboarding-overview)。

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
<Step title="欢迎界面和安全提示">
<Frame caption="阅读显示的安全提示，并据此决定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- 默认情况下，OpenClaw 是个人智能体：一个受信任的操作员边界。
- 共享/多用户设置需要锁紧配置（拆分信任边界、将工具访问保持在最小范围，并遵循[安全](/zh-CN/gateway/security)）。
- 本地新手引导现在默认将新配置设置为 `tools.profile: "coding"`，这样新的本地设置可保留文件系统/运行时工具，而无需强制使用不受限制的 `full` 配置文件。
- 如果启用了 hooks/webhooks 或其他不受信任的内容源，请使用强大的现代模型层级，并保持严格的工具策略/沙箱隔离。

</Step>
<Step title="本地还是远程">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway 网关** 在哪里运行？

- **这台 Mac（仅本地）：** 新手引导可以在本地配置鉴权并写入凭证。
- **远程（通过 SSH/Tailnet）：** 新手引导**不会**配置本地鉴权；凭证必须存在于 Gateway 网关主机上。
- **稍后配置：** 跳过设置，并让应用保持未配置状态。

<Tip>
**Gateway 网关鉴权提示：**

- 向导现在即使在 loopback 上也会生成一个 **token**，因此本地 WS 客户端也必须进行身份验证。
- 如果你禁用鉴权，任何本地进程都可以连接；仅应在完全受信任的机器上这样做。
- 对于多机器访问或非 loopback 绑定，请使用 **token**。

</Tip>
</Step>
<Step title="权限">
<Frame caption="选择你想授予 OpenClaw 的权限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

新手引导会请求以下所需的 TCC 权限：

- 自动化（AppleScript）
- 通知
- 辅助功能
- 屏幕录制
- 麦克风
- 语音识别
- 摄像头
- 位置

</Step>
<Step title="CLI">
  <Info>此步骤为可选</Info>
  该应用可以通过 npm、pnpm 或 bun 安装全局 `openclaw` CLI。
  它会优先选择 npm，然后是 pnpm，只有在检测到的包管理器中仅有 bun 时才会使用 bun。
  对于 Gateway 网关运行时，Node 仍然是推荐路径。
</Step>
<Step title="新手引导聊天（专用会话）">
  设置完成后，应用会打开一个专用的新手引导聊天会话，以便智能体自我介绍并引导后续步骤。这会将首次运行指导与你的常规对话分开。请参阅 [引导](/zh-CN/start/bootstrapping)，了解智能体首次运行期间 Gateway 网关主机上会发生什么。
</Step>
</Steps>
