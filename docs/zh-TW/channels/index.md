---
read_when:
    - 您想為 OpenClaw 選擇聊天頻道
    - 你需要快速概覽支援的訊息平台
summary: OpenClaw 可連接的通訊平台
title: 聊天頻道
x-i18n:
    generated_at: "2026-05-02T02:43:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5937761c0aebc17e8633449d467219ea564b8b00a4a99f327aba7d73afe0c810
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可在你已使用的任何聊天應用程式中與你對話。每個通道都透過 Gateway 連線。
所有通道皆支援文字；媒體與表情回應則依通道而異。

## 傳送注意事項

- Telegram 回覆若包含 markdown 圖片語法，例如 `![alt](url)`，
  會在可行時於最終傳出路徑轉換為媒體回覆。
- Slack 多人 DM 會以群組聊天路由，因此群組政策、提及
  行為與群組工作階段規則會套用至 MPIM 對話。
- WhatsApp 設定為按需安裝：onboarding 可在
  Plugin 套件安裝前顯示設定流程，而 Gateway 只會在通道實際啟用時載入 WhatsApp runtime。

## 支援的通道

- [BlueBubbles](/zh-TW/channels/bluebubbles) — **iMessage 建議使用**；使用 BlueBubbles macOS server REST API，提供完整功能支援（隨附 Plugin；編輯、收回、效果、表情回應、群組管理 — 編輯目前在 macOS 26 Tahoe 上無法正常運作）。
- [Discord](/zh-TW/channels/discord) — Discord Bot API + Gateway；支援伺服器、通道與 DM。
- [Feishu](/zh-TW/channels/feishu) — 透過 WebSocket 的 Feishu/Lark bot（隨附 Plugin）。
- [Google Chat](/zh-TW/channels/googlechat) — 透過 HTTP Webhook 的 Google Chat API 應用程式。
- [iMessage（舊版）](/zh-TW/channels/imessage) — 透過 imsg CLI 的舊版 macOS 整合（已棄用，新設定請使用 BlueBubbles）。
- [IRC](/zh-TW/channels/irc) — 傳統 IRC 伺服器；具配對/允許清單控制的通道 + DM。
- [LINE](/zh-TW/channels/line) — LINE Messaging API bot（隨附 Plugin）。
- [Matrix](/zh-TW/channels/matrix) — Matrix 協定（隨附 Plugin）。
- [Mattermost](/zh-TW/channels/mattermost) — Bot API + WebSocket；通道、群組、DM（隨附 Plugin）。
- [Microsoft Teams](/zh-TW/channels/msteams) — Bot Framework；企業支援（隨附 Plugin）。
- [Nextcloud Talk](/zh-TW/channels/nextcloud-talk) — 透過 Nextcloud Talk 的自架聊天（隨附 Plugin）。
- [Nostr](/zh-TW/channels/nostr) — 透過 NIP-04 的去中心化 DM（隨附 Plugin）。
- [QQ Bot](/zh-TW/channels/qqbot) — QQ Bot API；私訊、群組聊天與豐富媒體（隨附 Plugin）。
- [Signal](/zh-TW/channels/signal) — signal-cli；著重隱私。
- [Slack](/zh-TW/channels/slack) — Bolt SDK；工作區應用程式。
- [Synology Chat](/zh-TW/channels/synology-chat) — 透過傳出+傳入 Webhook 的 Synology NAS Chat（隨附 Plugin）。
- [Telegram](/zh-TW/channels/telegram) — 透過 grammY 的 Bot API；支援群組。
- [Tlon](/zh-TW/channels/tlon) — 基於 Urbit 的通訊工具（隨附 Plugin）。
- [Twitch](/zh-TW/channels/twitch) — 透過 IRC 連線的 Twitch 聊天（隨附 Plugin）。
- [Voice Call](/zh-TW/plugins/voice-call) — 透過 Plivo 或 Twilio 的電話通訊（Plugin，另行安裝）。
- [WebChat](/zh-TW/web/webchat) — 透過 WebSocket 的 Gateway WebChat UI。
- [WeChat](/zh-TW/channels/wechat) — 透過 QR 登入的 Tencent iLink Bot Plugin；僅限私訊（外部 Plugin）。
- [WhatsApp](/zh-TW/channels/whatsapp) — 最受歡迎；使用 Baileys，且需要 QR 配對。
- [Yuanbao](/zh-TW/channels/yuanbao) — Tencent Yuanbao bot（外部 Plugin）。
- [Zalo](/zh-TW/channels/zalo) — Zalo Bot API；越南熱門通訊工具（隨附 Plugin）。
- [Zalo Personal](/zh-TW/channels/zalouser) — 透過 QR 登入的 Zalo 個人帳號（隨附 Plugin）。

## 備註

- 通道可同時執行；設定多個通道後，OpenClaw 會依聊天路由。
- 最快的設定通常是 **Telegram**（簡單的 bot token）。WhatsApp 需要 QR 配對，且
  會在磁碟上儲存更多狀態。
- 群組行為依通道而異；請參閱[群組](/zh-TW/channels/groups)。
- 基於安全考量，會強制執行 DM 配對與允許清單；請參閱[安全性](/zh-TW/gateway/security)。
- 疑難排解：[通道疑難排解](/zh-TW/channels/troubleshooting)。
- 模型提供者另有文件說明；請參閱[模型提供者](/zh-TW/providers/models)。
