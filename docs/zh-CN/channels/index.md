---
read_when:
    - 你想为 OpenClaw 选择一个聊天渠道
    - 你需要快速了解受支持的消息平台
summary: OpenClaw 可以连接的消息平台
title: 聊天渠道
x-i18n:
    generated_at: "2026-07-14T13:27:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以通过你已在使用的任何聊天应用与你交流。每个渠道都通过 Gateway 网关连接。
所有渠道均支持文本；媒体和表情回应的支持情况因渠道而异。

iMessage、Telegram 和 WebChat UI 随核心安装一同提供。标记为
“官方插件”的渠道可通过一条命令安装（`openclaw plugins install @openclaw/<id>`），
也可以在 `openclaw onboard` / `openclaw channels add` 期间按需安装，之后需要重启 Gateway 网关。
“外部插件”渠道由 OpenClaw 仓库之外的维护者维护。

## 支持的渠道

- [Discord](/zh-CN/channels/discord) - Discord Bot API + Gateway 网关；支持服务器、频道和私信（官方插件）。
- [Feishu](/zh-CN/channels/feishu) - 通过 WebSocket 使用 Feishu/Lark 机器人（官方插件）。
- [Google Chat](/zh-CN/channels/googlechat) - 通过 HTTP webhook 使用 Google Chat API 应用（官方插件）。
- [iMessage](/zh-CN/channels/imessage) - 包含在核心中。在已登录的 Mac 上通过 `imsg` 桥接器实现原生 macOS 集成（当 Gateway 网关在其他位置运行时也可使用 SSH 封装器），包括用于回复、Tapback、特效、附件和群组管理的私有 API 操作。
- [IRC](/zh-CN/channels/irc) - 经典 IRC 服务器；通过配对/允许列表控制支持频道和私信（官方插件）。
- [LINE](/zh-CN/channels/line) - LINE Messaging API 机器人（官方插件）。
- [Matrix](/zh-CN/channels/matrix) - Matrix 协议（官方插件）。
- [Mattermost](/zh-CN/channels/mattermost) - Bot API + WebSocket；支持频道、群组和私信（官方插件）。
- [Microsoft Teams](/zh-CN/channels/msteams) - Bot Framework；支持企业使用场景（官方插件）。
- [Nextcloud Talk](/zh-CN/channels/nextcloud-talk) - 通过 Nextcloud Talk 使用自托管聊天（官方插件）。
- [Nostr](/zh-CN/channels/nostr) - 通过 NIP-04 实现去中心化私信（官方插件）。
- [QQ Bot](/zh-CN/channels/qqbot) - QQ Bot API；支持私聊、群聊和富媒体（官方插件）。
- [Reef](/channels/reef) - 在不同用户的 OpenClaw 智能体之间提供受保护的端到端加密 claw-to-claw 消息传递（内置插件）。
- [Raft](/zh-CN/channels/raft) - 用于人类与智能体协作的 Raft CLI 唤醒桥接器（官方插件）。
- [Signal](/zh-CN/channels/signal) - signal-cli；注重隐私（官方插件）。
- [Slack](/zh-CN/channels/slack) - Bolt SDK；工作区应用（官方插件）。
- [SMS](/zh-CN/channels/sms) - 通过 Gateway 网关 webhook 使用由 Twilio 支持的 SMS（官方插件）。
- [Synology Chat](/zh-CN/channels/synology-chat) - 通过传出和传入 webhook 使用 Synology NAS Chat（官方插件）。
- [Telegram](/zh-CN/channels/telegram) - 包含在核心中。通过 grammY 使用 Bot API；支持群组。
- [Tlon](/zh-CN/channels/tlon) - 基于 Urbit 的消息应用（官方插件）。
- [Twitch](/zh-CN/channels/twitch) - 通过 IRC 连接使用 Twitch 聊天（官方插件）。
- [语音通话](/zh-CN/plugins/voice-call) - 通过 Plivo、Telnyx 或 Twilio 实现电话通信（官方插件）。
- [WebChat](/zh-CN/web/webchat) - 包含在核心中。通过 WebSocket 使用 Gateway 网关 WebChat UI。
- [微信](/zh-CN/channels/wechat) - 通过二维码登录使用腾讯 iLink 机器人；仅支持私聊（外部插件）。
- [WhatsApp](/zh-CN/channels/whatsapp) - 最受欢迎；使用 Baileys，并且需要二维码配对（官方插件）。
- [腾讯元宝](/zh-CN/channels/yuanbao) - 腾讯元宝机器人（外部插件）。
- [Zalo](/zh-CN/channels/zalo) - Zalo Bot API；越南流行的消息应用（官方插件）。
- [Zalo ClawBot](/zh-CN/channels/zaloclawbot) - 通过二维码登录使用的个人 Zalo 助手；与所有者绑定（外部插件）。
- [Zalo Personal](/zh-CN/channels/zalouser) - 通过二维码登录使用 Zalo 个人账户（官方插件）。

## 传递说明

- 包含 Markdown 图片语法（例如 `![alt](url)`）的 Telegram 回复，
  会在最终出站路径中尽可能转换为媒体回复。
- Slack 多人私信会按群聊路由，因此群组策略、提及行为和群组会话规则
  适用于 MPIM 对话。
- WhatsApp 设置采用按需安装方式：在插件包安装之前，新手引导即可显示设置流程，
  而 Gateway 网关仅在该渠道实际启用时才会加载外部
  ClawHub/npm 插件。
- 接受机器人发出的入站消息的渠道可以使用共享的
  [机器人循环保护](/zh-CN/channels/bot-loop-protection)，以防止机器人双方无限期地
  相互回复。
- 受支持的常驻房间可以使用[环境房间事件](/zh-CN/channels/ambient-room-events)，
  这样未提及智能体的房间聊天只会成为安静的上下文，除非智能体使用
  `message` 工具发送消息。

## 注意事项

- 多个渠道可以同时运行；配置多个渠道后，OpenClaw 会按聊天进行路由。
- 通常设置最快的是 **Telegram**（使用简单的机器人令牌，无需安装插件）。WhatsApp
  需要二维码配对，并且会在磁盘上存储更多状态。
- 群组行为因渠道而异；请参阅[群组](/zh-CN/channels/groups)。
- 出于安全考虑，系统会强制执行私信配对和允许列表；请参阅[安全性](/zh-CN/gateway/security)。
- 故障排查：[渠道故障排查](/zh-CN/channels/troubleshooting)。
- 模型提供商另有专门文档；请参阅[模型提供商](/zh-CN/providers/models)。
