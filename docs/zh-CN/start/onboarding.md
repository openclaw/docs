---
read_when:
    - 设计 macOS 新手引导助手
    - 实现认证或身份设置
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 的首次运行设置流程（macOS 应用）
title: 新手引导（macOS 应用）
x-i18n:
    generated_at: "2026-04-24T04:08:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 15
---

本文档描述了**当前**的首次运行设置流程。目标是提供顺畅的“第 0 天”体验：选择 Gateway 网关运行位置、连接认证、运行向导，然后让智能体自行完成初始化。
如需了解新手引导路径的总体概览，请参见 [Onboarding Overview](/zh-CN/start/onboarding-overview)。

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
<Step title="欢迎界面与安全提示">
<Frame caption="阅读显示的安全提示，并据此作出决定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- 默认情况下，OpenClaw 是个人智能体：单一可信操作员边界。
- 共享/多用户设置需要锁定配置（拆分信任边界、尽量减少工具访问，并遵循 [Security](/zh-CN/gateway/security)）。
- 本地新手引导现在默认将新配置设为 `tools.profile: "coding"`，这样全新的本地设置可以保留文件系统/运行时工具，而不必强制使用不受限制的 `full` 配置。
- 如果启用了 hooks/webhooks 或其他不受信任的内容输入源，请使用强力的现代模型层级，并保持严格的工具策略/沙箱隔离。

</Step>
<Step title="本地还是远程">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway 网关** 运行在哪里？

- **这台 Mac（仅本地）：** 新手引导可以在本地配置认证并写入凭证。
- **远程（通过 SSH/Tailnet）：** 新手引导**不会**配置本地认证；凭证必须已经存在于 Gateway 网关主机上。
- **稍后配置：** 跳过设置，让应用保持未配置状态。

<Tip>
**Gateway 网关认证提示：**

- 向导现在即使在 loopback 场景下也会生成一个 **token**，因此本地 WS 客户端也必须进行认证。
- 如果你禁用认证，任何本地进程都可以连接；仅在完全可信的机器上这样做。
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
  它会优先选择 npm，其次是 pnpm，最后才是 bun（仅当 bun 是唯一检测到的
  包管理器时）。对于 Gateway 网关运行时，Node 仍然是推荐路径。
</Step>
<Step title="新手引导聊天（专用会话）">
  设置完成后，应用会打开一个专用的新手引导聊天会话，让智能体
  进行自我介绍并引导后续步骤。这样可以将首次运行引导与
  你的日常对话分开。关于首次智能体运行时 Gateway 网关主机上会发生什么，请参见 [Bootstrapping](/zh-CN/start/bootstrapping)。
</Step>
</Steps>

## 相关内容

- [Onboarding 概览](/zh-CN/start/onboarding-overview)
- [入门指南](/zh-CN/start/getting-started)
