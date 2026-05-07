---
read_when:
    - 你想为 OpenClaw 选择一个聊天渠道
    - 你需要快速了解支持的消息平台
summary: OpenClaw 可连接的消息平台
title: 聊天渠道
x-i18n:
    generated_at: "2026-05-07T01:50:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以在你已经使用的任何聊天应用中与你对话。每个渠道都通过 Gateway 网关连接。
文本在所有地方都受支持；媒体和表情回应因渠道而异。

## 交付说明

- 包含 markdown 图片语法的 Telegram 回复，例如 `![alt](url)`，
  会在可行时于最终出站路径转换为媒体回复。
- Slack 多人私信会按群聊路由，因此群组策略、提及
  行为和群组会话规则适用于 MPIM 对话。
- WhatsApp 设置是按需安装：新手引导可以在
  插件包安装前显示设置流程，而 Gateway 网关只会在渠道实际处于活动状态时
  加载 WhatsApp 运行时。

## 支持的渠道

- [BlueBubbles](/zh-CN/channels/bluebubbles) - 通过 BlueBubbles macOS server REST API 的旧版 iMessage 桥接；不建议用于新的 OpenClaw 设置，但仍支持现有配置和更丰富的私有 API 操作。
- [Discord](/zh-CN/channels/discord) - Discord Bot API + Gateway 网关；支持服务器、频道和私信。
- [Feishu](/zh-CN/channels/feishu) - 通过 WebSocket 使用的 Feishu/Lark 机器人（内置插件）。
- [Google Chat](/zh-CN/channels/googlechat) - 通过 HTTP webhook 使用的 Google Chat API 应用（可下载插件）。
- [iMessage](/zh-CN/channels/imessage) - 通过 imsg CLI 的原生 macOS 集成；当主机权限和 Messages 访问条件满足时，推荐用于新的 OpenClaw iMessage 设置。
- [IRC](/zh-CN/channels/irc) - 经典 IRC 服务器；支持带配对/允许列表控制的频道 + 私信。
- [LINE](/zh-CN/channels/line) - LINE Messaging API 机器人（可下载插件）。
- [Matrix](/zh-CN/channels/matrix) - Matrix 协议（可下载插件）。
- [Mattermost](/zh-CN/channels/mattermost) - Bot API + WebSocket；频道、群组、私信（可下载插件）。
- [Microsoft Teams](/zh-CN/channels/msteams) - Bot Framework；企业支持（内置插件）。
- [Nextcloud Talk](/zh-CN/channels/nextcloud-talk) - 通过 Nextcloud Talk 的自托管聊天（内置插件）。
- [Nostr](/zh-CN/channels/nostr) - 通过 NIP-04 的去中心化私信（内置插件）。
- [QQ Bot](/zh-CN/channels/qqbot) - QQ Bot API；私聊、群聊和富媒体（内置插件）。
- [Signal](/zh-CN/channels/signal) - signal-cli；注重隐私。
- [Slack](/zh-CN/channels/slack) - Bolt SDK；工作区应用。
- [Synology Chat](/zh-CN/channels/synology-chat) - 通过 outgoing+incoming webhooks 使用的 Synology NAS Chat（内置插件）。
- [Telegram](/zh-CN/channels/telegram) - 通过 grammY 使用的 Bot API；支持群组。
- [Tlon](/zh-CN/channels/tlon) - 基于 Urbit 的消息工具（内置插件）。
- [Twitch](/zh-CN/channels/twitch) - 通过 IRC 连接的 Twitch 聊天（内置插件）。
- [Voice Call](/zh-CN/plugins/voice-call) - 通过 Plivo 或 Twilio 的电话通信（插件，单独安装）。
- [WebChat](/zh-CN/web/webchat) - 通过 WebSocket 运行的 Gateway 网关 WebChat UI。
- [WeChat](/zh-CN/channels/wechat) - 通过二维码登录的 Tencent iLink Bot 插件；仅支持私聊（外部插件）。
- [WhatsApp](/zh-CN/channels/whatsapp) - 最受欢迎；使用 Baileys，并且需要二维码配对。
- [Yuanbao](/zh-CN/channels/yuanbao) - 腾讯元宝机器人（外部插件）。
- [Zalo](/zh-CN/channels/zalo) - Zalo Bot API；越南流行的消息工具（内置插件）。
- [Zalo Personal](/zh-CN/channels/zalouser) - 通过二维码登录的 Zalo 个人账号（内置插件）。

## 说明

- 渠道可以同时运行；配置多个渠道后，OpenClaw 会按聊天路由。
- 最快的设置通常是 **Telegram**（简单的机器人令牌）。WhatsApp 需要二维码配对，并且
  会在磁盘上存储更多状态。
- 群组行为因渠道而异；请参阅 [Groups](/zh-CN/channels/groups)。
- 为了安全，会强制执行私信配对和允许列表；请参阅 [Security](/zh-CN/gateway/security)。
- 故障排除：[渠道故障排除](/zh-CN/channels/troubleshooting)。
- 模型提供商单独记录；请参阅 [模型提供商](/zh-CN/providers/models)。
