---
read_when:
    - 你想為 OpenClaw 選擇聊天頻道
    - 您需要快速了解支援的訊息平台
summary: OpenClaw 可連線的訊息平台
title: 聊天頻道
x-i18n:
    generated_at: "2026-05-06T02:44:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以在你已使用的任何聊天應用程式上與你對話。每個頻道都會透過 Gateway 連線。
所有地方都支援文字；媒體與回應則依頻道而異。

## 傳送注意事項

- Telegram 回覆若包含 markdown 圖片語法，例如 `![alt](url)`，
  在可行情況下，最終送出路徑會將其轉換為媒體回覆。
- Slack 多人私訊會以群組聊天路由，因此群組政策、提及
  行為與群組工作階段規則都適用於 MPIM 對話。
- WhatsApp 設定採用按需安裝：新手導引可以在
  Plugin 套件安裝前顯示設定流程，而 Gateway 只會在該頻道實際啟用時
  載入 WhatsApp 執行階段。

## 支援的頻道

- [BlueBubbles](/zh-TW/channels/bluebubbles) - **建議用於 iMessage**；使用 BlueBubbles macOS 伺服器 REST API，並提供完整功能支援（內建 Plugin；編輯、收回、效果、回應、群組管理 - 編輯目前在 macOS 26 Tahoe 上故障）。
- [Discord](/zh-TW/channels/discord) - Discord Bot API + Gateway；支援伺服器、頻道與私訊。
- [Feishu](/zh-TW/channels/feishu) - 透過 WebSocket 使用 Feishu/Lark 機器人（內建 Plugin）。
- [Google Chat](/zh-TW/channels/googlechat) - 透過 HTTP Webhook 使用 Google Chat API 應用程式（可下載 Plugin）。
- [iMessage（舊版）](/zh-TW/channels/imessage) - 透過 imsg CLI 的舊版 macOS 整合（已棄用，新的設定請使用 BlueBubbles）。
- [IRC](/zh-TW/channels/irc) - 傳統 IRC 伺服器；頻道 + 私訊，具備配對/允許清單控制。
- [LINE](/zh-TW/channels/line) - LINE Messaging API 機器人（可下載 Plugin）。
- [Matrix](/zh-TW/channels/matrix) - Matrix 協定（可下載 Plugin）。
- [Mattermost](/zh-TW/channels/mattermost) - Bot API + WebSocket；頻道、群組、私訊（可下載 Plugin）。
- [Microsoft Teams](/zh-TW/channels/msteams) - Bot Framework；企業支援（內建 Plugin）。
- [Nextcloud Talk](/zh-TW/channels/nextcloud-talk) - 透過 Nextcloud Talk 的自託管聊天（內建 Plugin）。
- [Nostr](/zh-TW/channels/nostr) - 透過 NIP-04 的去中心化私訊（內建 Plugin）。
- [QQ Bot](/zh-TW/channels/qqbot) - QQ Bot API；私人聊天、群組聊天與豐富媒體（內建 Plugin）。
- [Signal](/zh-TW/channels/signal) - signal-cli；注重隱私。
- [Slack](/zh-TW/channels/slack) - Bolt SDK；工作區應用程式。
- [Synology Chat](/zh-TW/channels/synology-chat) - 透過外送+內送 Webhook 使用 Synology NAS Chat（內建 Plugin）。
- [Telegram](/zh-TW/channels/telegram) - 透過 grammY 使用 Bot API；支援群組。
- [Tlon](/zh-TW/channels/tlon) - 基於 Urbit 的通訊程式（內建 Plugin）。
- [Twitch](/zh-TW/channels/twitch) - 透過 IRC 連線使用 Twitch 聊天（內建 Plugin）。
- [語音通話](/zh-TW/plugins/voice-call) - 透過 Plivo 或 Twilio 的電話服務（Plugin，需另外安裝）。
- [WebChat](/zh-TW/web/webchat) - 透過 WebSocket 的 Gateway WebChat UI。
- [WeChat](/zh-TW/channels/wechat) - 透過 QR 登入的 Tencent iLink Bot Plugin；僅支援私人聊天（外部 Plugin）。
- [WhatsApp](/zh-TW/channels/whatsapp) - 最受歡迎；使用 Baileys，並需要 QR 配對。
- [Yuanbao](/zh-TW/channels/yuanbao) - Tencent Yuanbao 機器人（外部 Plugin）。
- [Zalo](/zh-TW/channels/zalo) - Zalo Bot API；越南熱門通訊程式（內建 Plugin）。
- [Zalo Personal](/zh-TW/channels/zalouser) - 透過 QR 登入的 Zalo 個人帳號（內建 Plugin）。

## 注意事項

- 頻道可以同時執行；設定多個頻道後，OpenClaw 會依聊天路由。
- 最快的設定通常是 **Telegram**（簡單的機器人權杖）。WhatsApp 需要 QR 配對，並且
  會在磁碟上儲存更多狀態。
- 群組行為依頻道而異；請參閱[群組](/zh-TW/channels/groups)。
- 為了安全，會強制執行私訊配對與允許清單；請參閱[安全性](/zh-TW/gateway/security)。
- 疑難排解：[頻道疑難排解](/zh-TW/channels/troubleshooting)。
- 模型供應商另有文件說明；請參閱[模型供應商](/zh-TW/providers/models)。
