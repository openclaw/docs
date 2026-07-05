---
read_when:
    - 调试 Mac 应用健康状态指示器
summary: macOS 应用如何报告 Gateway 网关/渠道健康状态
title: 健康检查（macOS）
x-i18n:
    generated_at: "2026-07-05T11:30:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# macOS 上的健康检查

如何从菜单栏应用读取已链接频道的健康状态。

## 菜单栏

状态点：

- 绿色：已链接 + 探测健康。
- 橙色：已链接，但某个渠道探测报告降级/未连接。
- 红色：尚未链接。

次要行显示 “linked · auth 12m” 或显示失败原因。
菜单中的 “Run Health Check Now” 会触发按需探测。

## 设置

- General 标签页显示一张健康卡片：状态点、摘要行（链接状态 +
  凭证时长）以及可选的失败详情行，并带有 **Retry now** 和
  **Open logs** 按钮。
- **Channels 标签页** 会展示 WhatsApp 和 Telegram 的每渠道状态与控制项（登录二维码、
  登出、探测、上次断开连接/错误）。

## 探测如何工作

应用通过现有的 WebSocket 连接（不是 CLI shell-out）每约 60 秒以及按需调用 Gateway 网关的 `health` RPC。该 RPC 会加载凭证并报告状态，而不会发送消息。应用会分别缓存上一次良好的快照和上一次错误，因此 UI 可以即时加载，并且离线时不会闪烁。

## 不确定时

使用 [Gateway 健康](/zh-CN/gateway/health) 中的 CLI 流程（`openclaw status`、
`openclaw status --deep`、`openclaw health --json`），并 tail
`/tmp/openclaw/openclaw-*.log`，筛选 `web-heartbeat` / `web-reconnect`。

## 相关

- [Gateway 健康](/zh-CN/gateway/health)
- [macOS app](/zh-CN/platforms/macos)
