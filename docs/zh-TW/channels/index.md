---
read_when:
    - 您想為 OpenClaw 選擇聊天頻道
    - 你需要快速概覽支援的訊息平台
summary: OpenClaw 可連接的訊息平台
title: 聊天頻道
x-i18n:
    generated_at: "2026-05-02T20:41:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以在你已使用的任何聊天應用程式上與你對話。每個通道都透過 Gateway 連接。
所有通道都支援文字；媒體和回應則依通道而異。

## 傳送注意事項

- 包含 markdown 圖片語法的 Telegram 回覆，例如 `![alt](url)`，
  在可行情況下會於最終傳出路徑轉換成媒體回覆。
- Slack 多人私訊會以群組聊天路由，因此群組政策、提及
  行為，以及群組工作階段規則會套用到 MPIM 對話。
- WhatsApp 設定為按需安裝：入門流程可在
  Plugin 套件安裝前顯示設定流程，而 Gateway 只有在通道實際啟用時
  才會載入 WhatsApp 執行階段。

## 支援的通道

- [BlueBubbles](/zh-TW/channels/bluebubbles) — **建議用於 iMessage**；使用 BlueBubbles macOS 伺服器 REST API，並具備完整功能支援（隨附 Plugin；編輯、收回、效果、回應、群組管理 — 編輯目前在 macOS 26 Tahoe 上故障）。
- [Discord](/zh-TW/channels/discord) — Discord Bot API + Gateway；支援伺服器、頻道和私訊。
- [Feishu](/zh-TW/channels/feishu) — 透過 WebSocket 使用 Feishu/Lark 機器人（隨附 Plugin）。
- [Google Chat](/zh-TW/channels/googlechat) — 透過 HTTP webhook 使用 Google Chat API 應用程式（可下載 Plugin）。
- [iMessage（舊版）](/zh-TW/channels/imessage) — 透過 imsg CLI 的舊版 macOS 整合（已棄用，新設定請使用 BlueBubbles）。
- [IRC](/zh-TW/channels/irc) — 傳統 IRC 伺服器；具備配對/允許清單控制的頻道 + 私訊。
- [LINE](/zh-TW/channels/line) — LINE Messaging API 機器人（可下載 Plugin）。
- [Matrix](/zh-TW/channels/matrix) — Matrix 協定（可下載 Plugin）。
- [Mattermost](/zh-TW/channels/mattermost) — Bot API + WebSocket；頻道、群組、私訊（可下載 Plugin）。
- [Microsoft Teams](/zh-TW/channels/msteams) — Bot Framework；企業支援（隨附 Plugin）。
- [Nextcloud Talk](/zh-TW/channels/nextcloud-talk) — 透過 Nextcloud Talk 自行託管的聊天（隨附 Plugin）。
- [Nostr](/zh-TW/channels/nostr) — 透過 NIP-04 的去中心化私訊（隨附 Plugin）。
- [QQ Bot](/zh-TW/channels/qqbot) — QQ Bot API；私人聊天、群組聊天和豐富媒體（隨附 Plugin）。
- [Signal](/zh-TW/channels/signal) — signal-cli；以隱私為重點。
- [Slack](/zh-TW/channels/slack) — Bolt SDK；工作區應用程式。
- [Synology Chat](/zh-TW/channels/synology-chat) — 透過傳出+傳入 webhook 使用 Synology NAS Chat（隨附 Plugin）。
- [Telegram](/zh-TW/channels/telegram) — 透過 grammY 使用 Bot API；支援群組。
- [Tlon](/zh-TW/channels/tlon) — 基於 Urbit 的通訊程式（隨附 Plugin）。
- [Twitch](/zh-TW/channels/twitch) — 透過 IRC 連線使用 Twitch 聊天（隨附 Plugin）。
- [Voice Call](/zh-TW/plugins/voice-call) — 透過 Plivo 或 Twilio 的電話通訊（Plugin，需另行安裝）。
- [WebChat](/zh-TW/web/webchat) — 透過 WebSocket 的 Gateway WebChat UI。
- [WeChat](/zh-TW/channels/wechat) — 透過 QR 登入使用 Tencent iLink Bot Plugin；僅限私人聊天（外部 Plugin）。
- [WhatsApp](/zh-TW/channels/whatsapp) — 最受歡迎；使用 Baileys 並需要 QR 配對。
- [Yuanbao](/zh-TW/channels/yuanbao) — Tencent Yuanbao 機器人（外部 Plugin）。
- [Zalo](/zh-TW/channels/zalo) — Zalo Bot API；越南熱門通訊程式（隨附 Plugin）。
- [Zalo Personal](/zh-TW/channels/zalouser) — 透過 QR 登入使用 Zalo 個人帳號（隨附 Plugin）。

## 注意事項

- 通道可以同時執行；設定多個通道後，OpenClaw 會依聊天路由。
- 最快的設定通常是 **Telegram**（簡單的機器人權杖）。WhatsApp 需要 QR 配對，且
  會在磁碟上儲存更多狀態。
- 群組行為依通道而異；請參閱 [群組](/zh-TW/channels/groups)。
- 為安全起見會強制執行私訊配對和允許清單；請參閱 [安全性](/zh-TW/gateway/security)。
- 疑難排解：[通道疑難排解](/zh-TW/channels/troubleshooting)。
- 模型提供者另有文件說明；請參閱 [模型提供者](/zh-TW/providers/models)。
