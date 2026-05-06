---
read_when:
    - 设计 macOS 新手引导助手
    - 实现认证或身份设置
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 的首次运行设置流程（macOS 应用）
title: 新手引导（macOS 应用）
x-i18n:
    generated_at: "2026-05-06T05:21:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

本文档描述了**当前**首次运行设置流程。目标是提供顺畅的“第 0 天”体验：选择 Gateway 网关运行位置、连接凭证、运行向导，并让智能体完成自举。
有关新手引导路径的总体概览，请参阅[新手引导概览](/zh-CN/start/onboarding-overview)。

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
<Frame caption="阅读显示的安全提示并据此决定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- 默认情况下，OpenClaw 是个人智能体：单个受信任操作者边界。
- 共享/多用户设置需要锁定（拆分信任边界、尽量减少工具访问权限，并遵循[安全](/zh-CN/gateway/security)）。
- 本地新手引导现在会将新配置默认设为 `tools.profile: "coding"`，因此新的本地设置会保留文件系统/运行时工具，而无需强制使用无限制的 `full` 配置文件。
- 如果启用了钩子/webhook 或其他不受信任的内容源，请使用强大的现代模型档位，并保持严格的工具策略/沙箱隔离。

</Step>
<Step title="本地与远程">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway 网关**在哪里运行？

- **这台 Mac（仅本地）：** 新手引导可以在本地配置凭证并写入凭证。
- **远程（通过 SSH/Tailnet）：** 新手引导**不会**配置本地凭证；凭证必须已存在于 Gateway 网关主机上。
- **稍后配置：** 跳过设置，并让应用保持未配置状态。

<Tip>
**Gateway 网关凭证提示：**

- 向导现在即使对 loopback 也会生成一个 **token**，因此本地 WS 客户端必须进行身份验证。
- 如果你禁用凭证，任何本地进程都可以连接；仅在完全受信任的机器上这样做。
- 对多机器访问或非 loopback 绑定使用 **token**。

</Tip>
</Step>
<Step title="权限">
<Frame caption="选择你要授予 OpenClaw 的权限">
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
  应用可以通过 npm、pnpm 或 bun 安装全局 `openclaw` CLI。
  它会优先使用 npm，然后是 pnpm；只有在检测到 bun 是唯一的
  包管理器时才会使用 bun。对于 Gateway 网关运行时，Node 仍然是推荐路径。
</Step>
<Step title="新手引导聊天（专用会话）">
  设置完成后，应用会打开一个专用的新手引导聊天会话，让智能体可以
  介绍自己并指导后续步骤。这会将首次运行指导与你的常规对话分开。
  有关首次智能体运行期间 Gateway 网关主机上发生的事情，请参阅[自举](/zh-CN/start/bootstrapping)。
</Step>
</Steps>

## 相关

- [新手引导概览](/zh-CN/start/onboarding-overview)
- [入门指南](/zh-CN/start/getting-started)
