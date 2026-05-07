---
read_when:
    - 你想為 OpenClaw 選擇聊天頻道
    - 你需要快速概覽支援的訊息平台
summary: OpenClaw 可連接的訊息平台
title: 聊天頻道
x-i18n:
    generated_at: "2026-05-07T01:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以透過你已在使用的任何聊天應用程式與你對話。每個通道都透過 Gateway 連線。
所有通道都支援文字；媒體和回應則依通道而異。

## 傳送注意事項

- Telegram 回覆若包含 markdown 圖片語法，例如 `![alt](url)`，
  在可行時會於最終傳出路徑轉換為媒體回覆。
- Slack 多人 DM 會以群組聊天路由，因此群組政策、提及
  行為，以及群組工作階段規則都適用於 MPIM 對話。
- WhatsApp 設定採用按需安裝：上線導引可在
  Plugin 套件安裝前顯示設定流程，且 Gateway 只會在通道
  實際啟用時載入 WhatsApp 執行階段。

## 支援的通道

- [BlueBubbles](/zh-TW/channels/bluebubbles) - 透過 BlueBubbles macOS 伺服器 REST API 的舊版 iMessage 橋接；不建議用於新的 OpenClaw 設定，但仍支援既有設定和較豐富的私有 API 動作。
- [Discord](/zh-TW/channels/discord) - Discord Bot API + Gateway；支援伺服器、通道和 DM。
- [Feishu](/zh-TW/channels/feishu) - 透過 WebSocket 的 Feishu/Lark 機器人（內建 Plugin）。
- [Google Chat](/zh-TW/channels/googlechat) - 透過 HTTP webhook 的 Google Chat API 應用程式（可下載 Plugin）。
- [iMessage](/zh-TW/channels/imessage) - 透過 imsg CLI 的原生 macOS 整合；當主機權限和 Messages 存取符合需求時，這是新 OpenClaw iMessage 設定的首選。
- [IRC](/zh-TW/channels/irc) - 傳統 IRC 伺服器；通道 + DM，具備配對/允許清單控制。
- [LINE](/zh-TW/channels/line) - LINE Messaging API 機器人（可下載 Plugin）。
- [Matrix](/zh-TW/channels/matrix) - Matrix 協定（可下載 Plugin）。
- [Mattermost](/zh-TW/channels/mattermost) - Bot API + WebSocket；通道、群組、DM（可下載 Plugin）。
- [Microsoft Teams](/zh-TW/channels/msteams) - Bot Framework；企業支援（內建 Plugin）。
- [Nextcloud Talk](/zh-TW/channels/nextcloud-talk) - 透過 Nextcloud Talk 的自架聊天（內建 Plugin）。
- [Nostr](/zh-TW/channels/nostr) - 透過 NIP-04 的去中心化 DM（內建 Plugin）。
- [QQ Bot](/zh-TW/channels/qqbot) - QQ Bot API；私人聊天、群組聊天和豐富媒體（內建 Plugin）。
- [Signal](/zh-TW/channels/signal) - signal-cli；注重隱私。
- [Slack](/zh-TW/channels/slack) - Bolt SDK；工作區應用程式。
- [Synology Chat](/zh-TW/channels/synology-chat) - 透過傳出+傳入 webhook 的 Synology NAS Chat（內建 Plugin）。
- [Telegram](/zh-TW/channels/telegram) - 透過 grammY 的 Bot API；支援群組。
- [Tlon](/zh-TW/channels/tlon) - 以 Urbit 為基礎的通訊程式（內建 Plugin）。
- [Twitch](/zh-TW/channels/twitch) - 透過 IRC 連線的 Twitch 聊天（內建 Plugin）。
- [Voice Call](/zh-TW/plugins/voice-call) - 透過 Plivo 或 Twilio 的電話通訊（Plugin，需另行安裝）。
- [WebChat](/zh-TW/web/webchat) - 透過 WebSocket 的 Gateway WebChat UI。
- [WeChat](/zh-TW/channels/wechat) - 透過 QR 登入的 Tencent iLink Bot Plugin；僅限私人聊天（外部 Plugin）。
- [WhatsApp](/zh-TW/channels/whatsapp) - 最受歡迎；使用 Baileys 並需要 QR 配對。
- [Yuanbao](/zh-TW/channels/yuanbao) - Tencent Yuanbao 機器人（外部 Plugin）。
- [Zalo](/zh-TW/channels/zalo) - Zalo Bot API；越南熱門通訊程式（內建 Plugin）。
- [Zalo Personal](/zh-TW/channels/zalouser) - 透過 QR 登入的 Zalo 個人帳號（內建 Plugin）。

## 注意事項

- 通道可以同時執行；設定多個通道後，OpenClaw 會依聊天路由。
- 最快的設定通常是 **Telegram**（簡單的機器人權杖）。WhatsApp 需要 QR 配對，並且
  會在磁碟上儲存更多狀態。
- 群組行為依通道而異；請參閱[群組](/zh-TW/channels/groups)。
- 為了安全性，會強制執行 DM 配對和允許清單；請參閱[安全性](/zh-TW/gateway/security)。
- 疑難排解：[通道疑難排解](/zh-TW/channels/troubleshooting)。
- 模型提供者另有文件說明；請參閱[模型提供者](/zh-TW/providers/models)。
