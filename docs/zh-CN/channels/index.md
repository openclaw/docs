---
read_when:
    - 你想为 OpenClaw 选择一个聊天渠道
    - 你需要快速了解支持的消息平台
summary: OpenClaw 可以连接的消息平台
title: 聊天渠道
x-i18n:
    generated_at: "2026-04-28T11:45:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以通过你已经在用的任何聊天应用与你交流。每个渠道都通过 Gateway 网关连接。
文本在所有渠道均受支持；媒体和表情回应因渠道而异。

## 投递说明

- 包含 Markdown 图片语法（例如 `![alt](url)`）的 Telegram 回复，会在最终出站路径上尽可能转换为媒体回复。
- Slack 多人私信会按群聊路由，因此群组策略、提及行为和群组会话规则适用于 MPIM 对话。
- WhatsApp 设置按需安装：新手引导可以在暂存 Baileys 运行时依赖之前显示设置流程，Gateway 网关仅在该渠道实际启用时加载 WhatsApp 运行时。

## 支持的渠道

- [BlueBubbles](/zh-CN/channels/bluebubbles) — **推荐用于 iMessage**；使用 BlueBubbles macOS 服务器 REST API，具备完整功能支持（内置插件；编辑、撤回、效果、表情回应、群组管理 — 编辑目前在 macOS 26 Tahoe 上损坏）。
- [Discord](/zh-CN/channels/discord) — Discord Bot API + Gateway 网关；支持服务器、渠道和私信。
- [Feishu](/zh-CN/channels/feishu) — 通过 WebSocket 使用 Feishu/Lark bot（内置插件）。
- [Google Chat](/zh-CN/channels/googlechat) — 通过 HTTP webhook 使用 Google Chat API 应用。
- [iMessage（旧版）](/zh-CN/channels/imessage) — 通过 imsg CLI 的旧版 macOS 集成（已弃用，新设置请使用 BlueBubbles）。
- [IRC](/zh-CN/channels/irc) — 经典 IRC 服务器；支持带配对/允许列表控制的渠道 + 私信。
- [LINE](/zh-CN/channels/line) — LINE Messaging API bot（内置插件）。
- [Matrix](/zh-CN/channels/matrix) — Matrix 协议（内置插件）。
- [Mattermost](/zh-CN/channels/mattermost) — Bot API + WebSocket；渠道、群组、私信（内置插件）。
- [Microsoft Teams](/zh-CN/channels/msteams) — Bot Framework；企业支持（内置插件）。
- [Nextcloud Talk](/zh-CN/channels/nextcloud-talk) — 通过 Nextcloud Talk 使用自托管聊天（内置插件）。
- [Nostr](/zh-CN/channels/nostr) — 通过 NIP-04 的去中心化私信（内置插件）。
- [QQ Bot](/zh-CN/channels/qqbot) — QQ Bot API；私聊、群聊和富媒体（内置插件）。
- [Signal](/zh-CN/channels/signal) — signal-cli；注重隐私。
- [Slack](/zh-CN/channels/slack) — Bolt SDK；工作区应用。
- [Synology Chat](/zh-CN/channels/synology-chat) — 通过传出 + 传入 webhook 使用 Synology NAS Chat（内置插件）。
- [Telegram](/zh-CN/channels/telegram) — 通过 grammY 使用 Bot API；支持群组。
- [Tlon](/zh-CN/channels/tlon) — 基于 Urbit 的通讯工具（内置插件）。
- [Twitch](/zh-CN/channels/twitch) — 通过 IRC 连接使用 Twitch 聊天（内置插件）。
- [语音通话](/zh-CN/plugins/voice-call) — 通过 Plivo 或 Twilio 实现电话通信（插件，单独安装）。
- [WebChat](/zh-CN/web/webchat) — 通过 WebSocket 使用 Gateway 网关 WebChat 界面。
- [微信](/zh-CN/channels/wechat) — 通过二维码登录使用 Tencent iLink Bot 插件；仅支持私聊（外部插件）。
- [WhatsApp](/zh-CN/channels/whatsapp) — 最受欢迎；使用 Baileys，并需要二维码配对。
- [腾讯元宝](/zh-CN/channels/yuanbao) — 腾讯元宝 bot（外部插件）。
- [Zalo](/zh-CN/channels/zalo) — Zalo Bot API；越南流行的通讯工具（内置插件）。
- [Zalo Personal](/zh-CN/channels/zalouser) — 通过二维码登录使用 Zalo 个人账户（内置插件）。

## 说明

- 渠道可以同时运行；配置多个渠道后，OpenClaw 会按聊天路由。
- 最快的设置通常是 **Telegram**（简单的 bot token）。WhatsApp 需要二维码配对，并在磁盘上存储更多状态。
- 群组行为因渠道而异；请参阅[群组](/zh-CN/channels/groups)。
- 为了安全，会强制执行私信配对和允许列表；请参阅[安全](/zh-CN/gateway/security)。
- 故障排除：[渠道故障排除](/zh-CN/channels/troubleshooting)。
- 模型提供商单独记录；请参阅[模型提供商](/zh-CN/providers/models)。
