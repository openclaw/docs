---
read_when:
    - 调试 mac 应用健康指示器时
summary: macOS 应用如何报告 Gateway 网关 / Baileys 健康状态
title: 健康检查（macOS）
x-i18n:
    generated_at: "2026-04-05T08:37:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9223b2bbe272b32526f79cf878510ac5104e788402d94a1b1627e72c5fbebf5
    source_path: platforms/mac/health.md
    workflow: 15
---

# macOS 上的健康检查

如何从菜单栏应用中查看已链接渠道是否健康。

## 菜单栏

- 状态点现在会反映 Baileys 健康状态：
  - 绿色：已链接 + 最近已打开 socket。
  - 橙色：正在连接/重试。
  - 红色：已登出或探测失败。
- 次要行显示“已链接 · 认证 12 分钟”，或显示失败原因。
- “运行健康检查”菜单项会触发按需探测。

## 设置

- “常规”标签页新增了一个健康卡片，显示：已链接认证时长、session 存储路径/数量、上次检查时间、上次错误/状态码，以及“运行健康检查”/“显示日志”按钮。
- 使用缓存快照，因此 UI 可即时加载，并在离线时优雅回退。
- **渠道**标签页会显示 WhatsApp/Telegram 的渠道状态 + 控件（登录 QR、登出、探测、最近一次断开连接/错误）。

## 探测如何工作

- 应用每约 60 秒以及按需通过 `ShellExecutor` 运行一次 `openclaw health --json`。探测会加载凭证并报告状态，但不会发送消息。
- 分别缓存最近一次成功快照和最近一次错误，以避免闪烁；并显示各自的时间戳。

## 如有疑问

- 你仍然可以使用 [Gateway health](/gateway/health) 中的 CLI 流程（`openclaw status`、`openclaw status --deep`、`openclaw health --json`），并跟踪 `/tmp/openclaw/openclaw-*.log` 中的 `web-heartbeat` / `web-reconnect`。
