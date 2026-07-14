---
read_when:
    - 你想為 OpenClaw 選擇聊天頻道
    - 你需要快速概覽支援的訊息平台
summary: OpenClaw 可連線的訊息平台
title: 聊天頻道
x-i18n:
    generated_at: "2026-07-14T13:27:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以透過你已在使用的任何聊天應用程式與你交談。每個頻道皆透過閘道連線。
所有頻道都支援文字；媒體與表情回應支援則依頻道而異。

iMessage、Telegram 與 WebChat 使用者介面隨核心安裝提供。標示為
「官方外掛」的頻道可透過一個命令安裝（`openclaw plugins install @openclaw/<id>`），
也可在 `openclaw onboard` / `openclaw channels add` 期間視需要安裝，之後需要重新啟動閘道。
「外部外掛」頻道由 OpenClaw 儲存庫以外的維護者維護。

## 支援的頻道

- [Discord](/zh-TW/channels/discord) - Discord Bot API + 閘道；支援伺服器、頻道與私訊（官方外掛）。
- [Feishu](/zh-TW/channels/feishu) - 透過 WebSocket 使用 Feishu/Lark 機器人（官方外掛）。
- [Google Chat](/zh-TW/channels/googlechat) - 透過 HTTP 網路鉤子使用 Google Chat API 應用程式（官方外掛）。
- [iMessage](/zh-TW/channels/imessage) - 內含於核心。透過已登入的 Mac 上的 `imsg` 橋接器進行原生 macOS 整合（若閘道在其他位置執行，則使用 SSH 包裝程式），包括回覆、Tapback、效果、附件及群組管理等私有 API 動作。
- [IRC](/zh-TW/channels/irc) - 傳統 IRC 伺服器；支援頻道與私訊，並提供配對／允許清單控制（官方外掛）。
- [LINE](/zh-TW/channels/line) - LINE Messaging API 機器人（官方外掛）。
- [Matrix](/zh-TW/channels/matrix) - Matrix 通訊協定（官方外掛）。
- [Mattermost](/zh-TW/channels/mattermost) - Bot API + WebSocket；支援頻道、群組與私訊（官方外掛）。
- [Microsoft Teams](/zh-TW/channels/msteams) - Bot Framework；支援企業環境（官方外掛）。
- [Nextcloud Talk](/zh-TW/channels/nextcloud-talk) - 透過 Nextcloud Talk 使用自行託管的聊天服務（官方外掛）。
- [Nostr](/zh-TW/channels/nostr) - 透過 NIP-04 傳送去中心化私訊（官方外掛）。
- [QQ Bot](/zh-TW/channels/qqbot) - QQ Bot API；支援私人聊天、群組聊天與豐富媒體（官方外掛）。
- [Reef](/channels/reef) - 在不同使用者的 OpenClaw 代理程式之間，提供受防護的端對端加密 claw 對 claw 訊息傳遞（隨附外掛）。
- [Raft](/zh-TW/channels/raft) - 用於人類與代理程式協作的 Raft 命令列介面喚醒橋接器（官方外掛）。
- [Signal](/zh-TW/channels/signal) - signal-cli；注重隱私（官方外掛）。
- [Slack](/zh-TW/channels/slack) - Bolt SDK；工作區應用程式（官方外掛）。
- [SMS](/zh-TW/channels/sms) - 透過閘道網路鉤子使用 Twilio 支援的 SMS（官方外掛）。
- [Synology Chat](/zh-TW/channels/synology-chat) - 透過傳出及傳入網路鉤子使用 Synology NAS Chat（官方外掛）。
- [Telegram](/zh-TW/channels/telegram) - 內含於核心。透過 grammY 使用 Bot API；支援群組。
- [Tlon](/zh-TW/channels/tlon) - 以 Urbit 為基礎的即時通訊工具（官方外掛）。
- [Twitch](/zh-TW/channels/twitch) - 透過 IRC 連線使用 Twitch 聊天（官方外掛）。
- [語音通話](/zh-TW/plugins/voice-call) - 透過 Plivo、Telnyx 或 Twilio 使用電話服務（官方外掛）。
- [WebChat](/zh-TW/web/webchat) - 內含於核心。透過 WebSocket 使用閘道 WebChat 使用者介面。
- [微信](/zh-TW/channels/wechat) - 透過 QR 登入使用 Tencent iLink 機器人；僅支援私人聊天（外部外掛）。
- [WhatsApp](/zh-TW/channels/whatsapp) - 最受歡迎；使用 Baileys 並需要 QR 配對（官方外掛）。
- [騰訊元寶](/zh-TW/channels/yuanbao) - Tencent Yuanbao 機器人（外部外掛）。
- [Zalo](/zh-TW/channels/zalo) - Zalo Bot API；越南熱門的即時通訊工具（官方外掛）。
- [Zalo ClawBot](/zh-TW/channels/zaloclawbot) - 透過 QR 登入使用的個人 Zalo 助理；綁定擁有者（外部外掛）。
- [Zalo Personal](/zh-TW/channels/zalouser) - 透過 QR 登入使用 Zalo 個人帳號（官方外掛）。

## 傳遞注意事項

- Telegram 回覆若包含 Markdown 圖片語法（例如 `![alt](url)`），
  會在可行時於最終傳出路徑上轉換成媒體回覆。
- Slack 多人私訊會以群組聊天方式路由，因此群組政策、提及
  行為與群組工作階段規則都適用於 MPIM 對話。
- WhatsApp 設定採視需要安裝：新手引導可在
  外掛套件安裝前顯示設定流程，而閘道僅會在頻道實際啟用時
  載入外部 ClawHub/npm 外掛。
- 接受機器人撰寫之傳入訊息的頻道可以使用共用的
  [機器人迴圈保護](/zh-TW/channels/bot-loop-protection)，以防止成對的機器人
  無限期互相回覆。
- 受支援的常駐聊天室可以使用[環境聊天室事件](/zh-TW/channels/ambient-room-events)，
  讓未提及代理程式的聊天室閒聊成為低干擾的上下文，除非代理程式使用
  `message` 工具傳送訊息。

## 注意事項

- 頻道可以同時執行；設定多個頻道後，OpenClaw 會依各聊天進行路由。
- 最快的設定方式通常是 **Telegram**（只需簡單的機器人權杖，無須安裝外掛）。WhatsApp
  需要 QR 配對，並會在磁碟上儲存更多狀態。
- 群組行為依頻道而異；請參閱[群組](/zh-TW/channels/groups)。
- 基於安全考量，系統會強制執行私訊配對與允許清單；請參閱[安全性](/zh-TW/gateway/security)。
- 疑難排解：[頻道疑難排解](/zh-TW/channels/troubleshooting)。
- 模型提供者另有文件說明；請參閱[模型提供者](/zh-TW/providers/models)。
