---
read_when:
    - 调试 mac 应用健康指示器
summary: macOS 应用如何报告 Gateway 网关 / Baileys 健康状态
title: 健康检查（macOS）
x-i18n:
    generated_at: "2026-04-24T04:05:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 15
---

# macOS 上的健康检查

如何在菜单栏应用中查看已连接渠道是否健康。

## 菜单栏

- 状态圆点现在会反映 Baileys 健康状态：
  - 绿色：已连接 + 最近已打开套接字。
  - 橙色：正在连接 / 重试。
  - 红色：已登出或探测失败。
- 次要一行会显示“linked · auth 12m”，或显示失败原因。
- “Run Health Check”菜单项会触发按需探测。

## 设置

- “General”标签页新增了一个 Health 卡片，显示：已连接认证时长、会话存储路径 / 数量、上次检查时间、上次错误 / 状态码，以及“Run Health Check” / “Reveal Logs”按钮。
- 使用缓存快照，因此 UI 可以即时加载，并在离线时优雅回退。
- **Channels 标签页**会显示 WhatsApp / Telegram 的渠道状态 + 控件（登录二维码、登出、探测、上次断开连接 / 错误）。

## 探测的工作方式

- 应用会通过 `ShellExecutor` 每约 60 秒运行一次 `openclaw health --json`，也可按需运行。该探测会加载凭证并报告状态，而不发送消息。
- 分别缓存最近一次成功快照和最近一次错误，以避免闪烁；并显示各自的时间戳。

## 如有疑问

- 你仍可以使用[Gateway 网关健康状态](/zh-CN/gateway/health)中的 CLI 流程（`openclaw status`、`openclaw status --deep`、`openclaw health --json`），并查看 `/tmp/openclaw/openclaw-*.log` 中的 `web-heartbeat` / `web-reconnect`。

## 相关内容

- [Gateway 网关健康状态](/zh-CN/gateway/health)
- [macOS 应用](/zh-CN/platforms/macos)
