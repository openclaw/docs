---
read_when:
    - 你想要為 OpenClaw 選擇聊天頻道
    - 需要快速概覽支援的訊息平台
summary: OpenClaw 可連接的訊息平台
title: 聊天頻道
x-i18n:
    generated_at: "2026-04-30T02:46:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以在你已經使用的任何聊天 App 上與你交談。每個頻道都透過 Gateway 連線。
所有地方都支援文字；媒體與反應則依頻道而異。

## 傳送注意事項

- 包含 Markdown 圖片語法的 Telegram 回覆，例如 `![alt](url)`，
  會在可行時於最終傳出路徑上轉換為媒體回覆。
- Slack 多人私訊會以群組聊天的方式路由，因此群組政策、提及
  行為與群組工作階段規則會套用到 MPIM 對話。
- WhatsApp 設定是按需安裝：新手導引可以在
  Baileys 執行階段相依套件完成部署前顯示設定流程，而 Gateway 只會在頻道實際啟用時載入 WhatsApp
  執行階段。

## 支援的頻道

- [BlueBubbles](/zh-TW/channels/bluebubbles) — **建議用於 iMessage**；使用 BlueBubbles macOS 伺服器 REST API，完整支援功能（內建 Plugin；編輯、收回、效果、反應、群組管理 — 編輯目前在 macOS 26 Tahoe 上故障）。
- [Discord](/zh-TW/channels/discord) — Discord Bot API + Gateway；支援伺服器、頻道與私訊。
- [Feishu](/zh-TW/channels/feishu) — 透過 WebSocket 使用 Feishu/Lark 機器人（內建 Plugin）。
- [Google Chat](/zh-TW/channels/googlechat) — 透過 HTTP Webhook 使用 Google Chat API App。
- [iMessage（舊版）](/zh-TW/channels/imessage) — 透過 imsg CLI 的舊版 macOS 整合（已棄用，新設定請使用 BlueBubbles）。
- [IRC](/zh-TW/channels/irc) — 傳統 IRC 伺服器；支援頻道與私訊，並提供配對／允許清單控制。
- [LINE](/zh-TW/channels/line) — LINE Messaging API 機器人（內建 Plugin）。
- [Matrix](/zh-TW/channels/matrix) — Matrix 協定（內建 Plugin）。
- [Mattermost](/zh-TW/channels/mattermost) — Bot API + WebSocket；頻道、群組、私訊（內建 Plugin）。
- [Microsoft Teams](/zh-TW/channels/msteams) — Bot Framework；企業支援（內建 Plugin）。
- [Nextcloud Talk](/zh-TW/channels/nextcloud-talk) — 透過 Nextcloud Talk 的自架聊天（內建 Plugin）。
- [Nostr](/zh-TW/channels/nostr) — 透過 NIP-04 的去中心化私訊（內建 Plugin）。
- [QQ Bot](/zh-TW/channels/qqbot) — QQ Bot API；私人聊天、群組聊天與豐富媒體（內建 Plugin）。
- [Signal](/zh-TW/channels/signal) — signal-cli；注重隱私。
- [Slack](/zh-TW/channels/slack) — Bolt SDK；工作區 App。
- [Synology Chat](/zh-TW/channels/synology-chat) — 透過傳出與傳入 Webhook 使用 Synology NAS Chat（內建 Plugin）。
- [Telegram](/zh-TW/channels/telegram) — 透過 grammY 使用 Bot API；支援群組。
- [Tlon](/zh-TW/channels/tlon) — 以 Urbit 為基礎的 Messenger（內建 Plugin）。
- [Twitch](/zh-TW/channels/twitch) — 透過 IRC 連線的 Twitch 聊天（內建 Plugin）。
- [Voice Call](/zh-TW/plugins/voice-call) — 透過 Plivo 或 Twilio 的電話通訊（Plugin，需另行安裝）。
- [WebChat](/zh-TW/web/webchat) — 透過 WebSocket 的 Gateway WebChat UI。
- [WeChat](/zh-TW/channels/wechat) — 透過 QR 登入的 Tencent iLink Bot Plugin；僅支援私人聊天（外部 Plugin）。
- [WhatsApp](/zh-TW/channels/whatsapp) — 最受歡迎；使用 Baileys，並需要 QR 配對。
- [Yuanbao](/zh-TW/channels/yuanbao) — Tencent Yuanbao 機器人（外部 Plugin）。
- [Zalo](/zh-TW/channels/zalo) — Zalo Bot API；越南熱門 Messenger（內建 Plugin）。
- [Zalo Personal](/zh-TW/channels/zalouser) — 透過 QR 登入的 Zalo 個人帳號（內建 Plugin）。

## 注意事項

- 頻道可以同時執行；設定多個頻道後，OpenClaw 會依聊天進行路由。
- 最快的設定通常是 **Telegram**（簡單的機器人權杖）。WhatsApp 需要 QR 配對，並且會在磁碟上儲存更多狀態。
- 群組行為因頻道而異；請參閱[群組](/zh-TW/channels/groups)。
- 為了安全，會強制執行私訊配對與允許清單；請參閱[安全性](/zh-TW/gateway/security)。
- 疑難排解：[頻道疑難排解](/zh-TW/channels/troubleshooting)。
- 模型提供者另有文件說明；請參閱[模型提供者](/zh-TW/providers/models)。
