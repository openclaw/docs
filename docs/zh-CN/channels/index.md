---
read_when:
    - 你想为 OpenClaw 选择一个聊天渠道
    - 你需要快速了解支持的消息平台
summary: OpenClaw 可以连接的消息平台
title: 聊天渠道
x-i18n:
    generated_at: "2026-07-05T11:02:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以在你已经使用的任何聊天应用中与你对话。每个渠道都通过 Gateway 网关连接。
所有渠道都支持文本；媒体和表情回应因渠道而异。

iMessage、Telegram 和 WebChat UI 随核心安装一起提供。标记为
“官方插件”的渠道可通过一条命令（`openclaw plugins install @openclaw/<id>`）
安装，或在 `openclaw onboard` / `openclaw channels add` 期间按需安装，然后需要重启 Gateway 网关。“外部插件”渠道由 OpenClaw 仓库之外维护。

## 支持的渠道

- [Discord](/zh-CN/channels/discord) - Discord Bot API + Gateway 网关；支持服务器、频道和私信（官方插件）。
- [Feishu](/zh-CN/channels/feishu) - 通过 WebSocket 的 Feishu/Lark bot（官方插件）。
- [Google Chat](/zh-CN/channels/googlechat) - 通过 HTTP webhook 的 Google Chat API 应用（官方插件）。
- [iMessage](/zh-CN/channels/imessage) - 包含在核心中。在已登录的 Mac 上通过 `imsg` bridge 进行原生 macOS 集成（或在 Gateway 网关运行于其他位置时使用 SSH 包装器），包括用于回复、tapback、效果、附件和群组管理的私有 API 操作。
- [IRC](/zh-CN/channels/irc) - 经典 IRC 服务器；通过配对/允许列表控制支持频道 + 私信（官方插件）。
- [LINE](/zh-CN/channels/line) - LINE Messaging API bot（官方插件）。
- [Matrix](/zh-CN/channels/matrix) - Matrix 协议（官方插件）。
- [Mattermost](/zh-CN/channels/mattermost) - Bot API + WebSocket；频道、群组、私信（官方插件）。
- [Microsoft Teams](/zh-CN/channels/msteams) - Bot Framework；企业支持（官方插件）。
- [Nextcloud Talk](/zh-CN/channels/nextcloud-talk) - 通过 Nextcloud Talk 自托管聊天（官方插件）。
- [Nostr](/zh-CN/channels/nostr) - 通过 NIP-04 的去中心化私信（官方插件）。
- [QQ Bot](/zh-CN/channels/qqbot) - QQ Bot API；私聊、群聊和富媒体（官方插件）。
- [Raft](/zh-CN/channels/raft) - 用于人类和智能体协作的 Raft CLI 唤醒桥接（官方插件）。
- [Signal](/zh-CN/channels/signal) - signal-cli；注重隐私（官方插件）。
- [Slack](/zh-CN/channels/slack) - Bolt SDK；工作区应用（官方插件）。
- [SMS](/zh-CN/channels/sms) - 通过 Gateway 网关 webhook 使用 Twilio 支持的 SMS（官方插件）。
- [Synology Chat](/zh-CN/channels/synology-chat) - 通过 outgoing+incoming webhooks 使用 Synology NAS Chat（官方插件）。
- [Telegram](/zh-CN/channels/telegram) - 包含在核心中。通过 grammY 使用 Bot API；支持群组。
- [Tlon](/zh-CN/channels/tlon) - 基于 Urbit 的通讯工具（官方插件）。
- [Twitch](/zh-CN/channels/twitch) - 通过 IRC 连接使用 Twitch 聊天（官方插件）。
- [语音通话](/zh-CN/plugins/voice-call) - 通过 Plivo、Telnyx 或 Twilio 进行电话通信（官方插件）。
- [WebChat](/zh-CN/web/webchat) - 包含在核心中。通过 WebSocket 使用 Gateway 网关 WebChat UI。
- [微信](/zh-CN/channels/wechat) - 通过 QR 登录使用 Tencent iLink bot；仅支持私聊（外部插件）。
- [WhatsApp](/zh-CN/channels/whatsapp) - 最受欢迎；使用 Baileys，并需要 QR 配对（官方插件）。
- [腾讯元宝](/zh-CN/channels/yuanbao) - Tencent Yuanbao bot（外部插件）。
- [Zalo](/zh-CN/channels/zalo) - Zalo Bot API；越南流行通讯工具（官方插件）。
- [Zalo ClawBot](/zh-CN/channels/zaloclawbot) - 通过 QR 登录的个人 Zalo 助手；绑定所有者（外部插件）。
- [Zalo Personal](/zh-CN/channels/zalouser) - 通过 QR 登录使用 Zalo 个人账户（官方插件）。

## 交付说明

- 包含 markdown 图片语法（例如 `![alt](url)`）的 Telegram 回复，会在可行时于最终出站路径上转换为媒体回复。
- Slack 多人私信会按群聊路由，因此群组策略、提及行为和群组会话规则适用于 MPIM 对话。
- WhatsApp 设置是按需安装：新手引导可以在插件包安装前显示设置流程，Gateway 网关只在渠道实际处于活动状态时加载外部 ClawHub/npm 插件。
- 接受 bot 编写的入站消息的渠道可以使用共享的 [bot 循环保护](/zh-CN/channels/bot-loop-protection)，防止成对 bot 无限互相回复。
- 支持的常驻房间可以使用 [环境房间事件](/zh-CN/channels/ambient-room-events)，这样未提及智能体的房间闲聊会成为安静上下文，除非智能体使用 `message` 工具发送消息。

## 说明

- 渠道可以同时运行；配置多个渠道后，OpenClaw 会按聊天路由。
- 最快的设置通常是 **Telegram**（简单 bot token，无需安装插件）。WhatsApp
  需要 QR 配对，并在磁盘上存储更多状态。
- 群组行为因渠道而异；请参阅 [群组](/zh-CN/channels/groups)。
- 为了安全，会强制执行私信配对和允许列表；请参阅 [安全](/zh-CN/gateway/security)。
- 故障排除：[渠道故障排查](/zh-CN/channels/troubleshooting)。
- 模型提供商单独记录；请参阅 [模型提供商](/zh-CN/providers/models)。
