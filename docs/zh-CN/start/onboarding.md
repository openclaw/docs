---
read_when:
    - 设计 macOS 新手引导助手
    - 实现身份验证或身份设置
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw（macOS 应用）的首次运行设置流程
title: 新手引导（macOS 应用）
x-i18n:
    generated_at: "2026-07-05T11:42:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc363e013ae9921e9fde489ca856739037dd8b19bdcef55cf0466171968159af
    source_path: start/onboarding.md
    workflow: 16
---

macOS 应用的首次运行流程：选择 Gateway 网关的运行位置，通过 Crestodian 对话完成本地
设置，授予权限，并交接给智能体自己的引导启动仪式。
有关 CLI 新手引导以及两条路径的对比，请参阅[新手引导概览](/zh-CN/start/onboarding-overview)。

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

- 默认情况下，OpenClaw 是个人智能体：一个受信任的操作员边界。
- 共享/多用户设置需要锁定：拆分信任边界，保持工具访问最小化，并遵循[安全](/zh-CN/gateway/security)。
- 本地新手引导默认将新配置设为 `tools.profile: "coding"`，因此全新设置会保留文件系统/运行时工具，而不使用不受限制的 `full` 配置档。
- 如果启用了 hooks/webhooks 或其他不受信任的内容输入，请使用强大的现代模型层级，并保持严格的工具策略/沙箱隔离。

</Step>
<Step title="本地 vs 远程">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway 网关**在哪里运行？

- **这台 Mac（仅本地）：** 新手引导会在本地配置身份验证并写入凭证。
- **远程（通过 SSH/Tailnet）：** 新手引导**不会**配置本地身份验证；
  凭证必须已存在于 Gateway 网关主机上。远程 Gateway 网关令牌
  字段会存储 macOS 应用用来连接该 Gateway 网关的令牌；
  现有的 `gateway.remote.token` SecretRef 值会保留，直到你
  替换它们。
- **稍后配置：** 跳过设置，让应用保持未配置状态。

<Tip>
**Gateway 网关身份验证提示：**

- 即使绑定到 loopback，Gateway 网关身份验证模式也默认是 `token`，因此本地 WS 客户端必须进行身份验证。
- 设置 `gateway.auth.mode: "none"` 会允许任何本地进程连接；仅在完全受信任的机器上使用它。
- 多机器访问或非 loopback 绑定请使用令牌。

</Tip>
</Step>
<Step title="CLI">
  本地设置会通过 npm、pnpm 或 bun 安装全局 `openclaw` CLI，
  优先使用 npm。Node 仍然是 Gateway 网关本身推荐的运行时。
  现有的兼容安装会被复用。
</Step>
<Step title="与 Crestodian 对话">
  本地设置会在 Gateway 网关准备就绪后打开一个与 Crestodian 的专用对话。
  Crestodian 会检测现有 Claude Code 或 Codex 登录以及
  支持的 API keys，提出工作区和配置方案，然后在写入任何内容之前等待
  批准。只有该对话已生成设置状态后，“下一步”才会解锁。凭证提示使用
  掩码输入；在出现模糊的传输失败后，请重启设置对话，而不是
  重放上一轮。

远程和稍后配置流程会跳过此本地设置对话。
</Step>
<Step title="权限">

<Frame caption="选择你想授予 OpenClaw 的权限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

新手引导会请求以下 TCC 权限：自动化（AppleScript）、通知、辅助功能、屏幕录制、麦克风、语音识别、摄像头和位置。

</Step>
<Step title="新手引导聊天（专用会话）">
  设置完成后，应用会打开一个单独的智能体新手引导聊天，让智能体可以
  介绍自己并引导后续步骤，而不会把这段交流混入普通对话历史。
  这发生在 Crestodian 设置对话之后；它不会取代该对话。请参阅[引导启动](/zh-CN/start/bootstrapping)，了解智能体首次真实轮次期间
  Gateway 网关主机上会发生什么。
</Step>
</Steps>

## 相关

- [新手引导概览](/zh-CN/start/onboarding-overview)
- [入门指南](/zh-CN/start/getting-started)
