---
read_when:
    - 调试 Mac 应用健康状态指示器
summary: macOS 应用如何报告 Gateway 网关/渠道健康状态
title: 健康检查（macOS）
x-i18n:
    generated_at: "2026-07-11T20:40:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# macOS 上的健康检查

如何从菜单栏应用读取已关联渠道的健康状态。

## 菜单栏

状态指示点：

- 绿色：已关联且探测健康。
- 橙色：已关联，但某个渠道探测报告状态降级或未连接。
- 红色：尚未关联。

次要信息行显示“已关联 · 身份验证 12 分钟”，或显示失败原因。
菜单中的“立即运行健康检查”会触发按需探测。

## 设置

- General 选项卡显示一张健康状态卡片：状态指示点、摘要行（关联状态和身份验证时长），以及可选的失败详情行，并提供 **Retry now** 和 **Open logs** 按钮。
- **Channels tab** 显示 WhatsApp 和 Telegram 各渠道的状态与控制项（登录二维码、退出登录、探测、最近一次断开连接或错误）。

## 探测的工作原理

应用通过现有的 WebSocket 连接（而非调用 CLI shell 命令）每隔约 60 秒以及按需调用 Gateway 网关的 `health` RPC。该 RPC 加载凭据并报告状态，不会发送消息。应用分别缓存最近一次正常快照和最近一次错误，因此 UI 可以立即加载，且离线时不会闪烁。

## 如有疑问

使用 [Gateway 健康](/zh-CN/gateway/health) 中的 CLI 流程（`openclaw status`、`openclaw status --deep`、`openclaw health --json`），并持续查看 `/tmp/openclaw/openclaw-*.log`，筛选 `web-heartbeat` / `web-reconnect`。

## 相关内容

- [Gateway 健康](/zh-CN/gateway/health)
- [macOS 应用](/zh-CN/platforms/macos)
