---
read_when:
    - 你想为 OpenClaw 选择一个聊天渠道
    - 你需要一个受支持消息平台的快速概览
summary: OpenClaw 可连接的消息平台
title: 聊天渠道
x-i18n:
    generated_at: "2026-04-05T08:15:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 246ee6f16aebe751241f00102bb435978ed21f6158385aff5d8e222e30567416
    source_path: channels/index.md
    workflow: 15
---

# 聊天渠道

OpenClaw 可以在你已经使用的任意聊天应用中与你交流。每个渠道都通过 Gateway 网关连接。
所有渠道都支持文本；媒体和 reactions 支持则因渠道而异。

## 支持的渠道

- [BlueBubbles](/channels/bluebubbles) — **iMessage 的推荐方案**；使用 BlueBubbles macOS 服务器 REST API，并提供完整功能支持（内置插件；编辑、撤回、特效、reactions、群组管理——编辑功能目前在 macOS 26 Tahoe 上损坏）。
- [Discord](/channels/discord) — Discord Bot API + Gateway 网关；支持服务器、渠道和私信。
- [Feishu](/channels/feishu) — 通过 WebSocket 连接的 Feishu/Lark 机器人（内置插件）。
- [Google Chat](/channels/googlechat) — 通过 HTTP webhook 连接的 Google Chat API 应用。
- [iMessage (legacy)](/channels/imessage) — 通过 imsg CLI 的旧版 macOS 集成（已弃用，新部署请使用 BlueBubbles）。
- [IRC](/channels/irc) — 经典 IRC 服务器；支持渠道和私信，并带有配对 / allowlist 控制。
- [LINE](/channels/line) — LINE Messaging API 机器人（内置插件）。
- [Matrix](/channels/matrix) — Matrix 协议（内置插件）。
- [Mattermost](/channels/mattermost) — Bot API + WebSocket；支持渠道、群组、私信（内置插件）。
- [Microsoft Teams](/channels/msteams) — Bot Framework；支持企业场景（内置插件）。
- [Nextcloud Talk](/channels/nextcloud-talk) — 通过 Nextcloud Talk 的自托管聊天（内置插件）。
- [Nostr](/channels/nostr) — 通过 NIP-04 的去中心化私信（内置插件）。
- [QQ Bot](/channels/qqbot) — QQ Bot API；支持私聊、群聊和富媒体（内置插件）。
- [Signal](/channels/signal) — signal-cli；注重隐私。
- [Slack](/channels/slack) — Bolt SDK；适用于工作区应用。
- [Synology Chat](/channels/synology-chat) — 通过 outgoing + incoming webhook 连接的 Synology NAS Chat（内置插件）。
- [Telegram](/channels/telegram) — 通过 grammY 的 Bot API；支持群组。
- [Tlon](/channels/tlon) — 基于 Urbit 的消息工具（内置插件）。
- [Twitch](/channels/twitch) — 通过 IRC 连接的 Twitch 聊天（内置插件）。
- [Voice Call](/plugins/voice-call) — 通过 Plivo 或 Twilio 提供电话能力（插件，需单独安装）。
- [WebChat](/web/webchat) — 通过 WebSocket 的 Gateway 网关 WebChat UI。
- [WeChat](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — 通过二维码登录的 Tencent iLink Bot 插件；仅支持私聊。
- [WhatsApp](/channels/whatsapp) — 最流行；使用 Baileys，并需要二维码配对。
- [Zalo](/channels/zalo) — Zalo Bot API；越南流行的消息工具（内置插件）。
- [Zalo Personal](/channels/zalouser) — 通过二维码登录的 Zalo 个人账号（内置插件）。

## 说明

- 渠道可以同时运行；你可以配置多个渠道，OpenClaw 会按聊天进行路由。
- 通常最快的设置方式是 **Telegram**（简单的 bot token）。WhatsApp 需要二维码配对，并且会在磁盘上存储更多状态。
- 群组行为因渠道而异；参见 [群组](/channels/groups)。
- 出于安全考虑，会强制执行私信配对和 allowlist；参见 [安全](/gateway/security)。
- 故障排除：[渠道故障排除](/channels/troubleshooting)。
- 模型提供商文档单独提供；参见 [模型提供商](/providers/models)。
