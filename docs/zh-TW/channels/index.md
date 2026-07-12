---
read_when:
    - 你想為 OpenClaw 選擇聊天頻道
    - 您需要快速概覽支援的訊息平台
summary: OpenClaw 可連接的訊息平台
title: 聊天頻道
x-i18n:
    generated_at: "2026-07-11T21:08:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以透過你已在使用的任何聊天應用程式與你交談。每個頻道都透過閘道連線。
所有頻道都支援文字；媒體與回應功能則因頻道而異。

iMessage、Telegram 與 WebChat 使用者介面隨核心安裝提供。標示為
「官方外掛」的頻道可使用一行命令（`openclaw plugins install @openclaw/<id>`）
安裝，或在執行 `openclaw onboard` / `openclaw channels add` 時按需安裝，之後需要重新啟動
閘道。「外部外掛」頻道則由 OpenClaw 儲存庫之外的維護者負責維護。

## 支援的頻道

- [Discord](/zh-TW/channels/discord) - Discord Bot API + 閘道；支援伺服器、頻道與私訊（官方外掛）。
- [Feishu](/zh-TW/channels/feishu) - 透過 WebSocket 使用 Feishu/Lark 機器人（官方外掛）。
- [Google Chat](/zh-TW/channels/googlechat) - 透過 HTTP 網路鉤子使用 Google Chat API 應用程式（官方外掛）。
- [iMessage](/zh-TW/channels/imessage) - 包含於核心中。透過已登入的 Mac 上的 `imsg` 橋接器（或閘道在其他位置執行時使用 SSH 包裝器）提供原生 macOS 整合，包括回覆、Tapback、特效、附件與群組管理等私有 API 操作。
- [IRC](/zh-TW/channels/irc) - 傳統 IRC 伺服器；支援頻道與私訊，並提供配對／允許清單控制（官方外掛）。
- [LINE](/zh-TW/channels/line) - LINE Messaging API 機器人（官方外掛）。
- [Matrix](/zh-TW/channels/matrix) - Matrix 通訊協定（官方外掛）。
- [Mattermost](/zh-TW/channels/mattermost) - Bot API + WebSocket；支援頻道、群組與私訊（官方外掛）。
- [Microsoft Teams](/zh-TW/channels/msteams) - Bot Framework；支援企業使用（官方外掛）。
- [Nextcloud Talk](/zh-TW/channels/nextcloud-talk) - 透過 Nextcloud Talk 提供自架聊天服務（官方外掛）。
- [Nostr](/zh-TW/channels/nostr) - 透過 NIP-04 提供去中心化私訊（官方外掛）。
- [QQ Bot](/zh-TW/channels/qqbot) - QQ Bot API；支援私聊、群聊與多媒體內容（官方外掛）。
- [Raft](/zh-TW/channels/raft) - 用於人類與代理協作的 Raft 命令列介面喚醒橋接器（官方外掛）。
- [Signal](/zh-TW/channels/signal) - signal-cli；注重隱私（官方外掛）。
- [Slack](/zh-TW/channels/slack) - Bolt SDK；工作區應用程式（官方外掛）。
- [SMS](/zh-TW/channels/sms) - 透過閘道網路鉤子提供由 Twilio 支援的 SMS（官方外掛）。
- [Synology Chat](/zh-TW/channels/synology-chat) - 透過傳出與傳入網路鉤子使用 Synology NAS Chat（官方外掛）。
- [Telegram](/zh-TW/channels/telegram) - 包含於核心中。透過 grammY 使用 Bot API；支援群組。
- [Tlon](/zh-TW/channels/tlon) - 基於 Urbit 的通訊工具（官方外掛）。
- [Twitch](/zh-TW/channels/twitch) - 透過 IRC 連線使用 Twitch 聊天（官方外掛）。
- [語音通話](/zh-TW/plugins/voice-call) - 透過 Plivo、Telnyx 或 Twilio 提供電話通訊（官方外掛）。
- [WebChat](/zh-TW/web/webchat) - 包含於核心中。透過 WebSocket 提供閘道 WebChat 使用者介面。
- [微信](/zh-TW/channels/wechat) - 透過 QR 碼登入使用騰訊 iLink 機器人；僅支援私聊（外部外掛）。
- [WhatsApp](/zh-TW/channels/whatsapp) - 最受歡迎；使用 Baileys，且需要 QR 碼配對（官方外掛）。
- [騰訊元寶](/zh-TW/channels/yuanbao) - 騰訊元寶機器人（外部外掛）。
- [Zalo](/zh-TW/channels/zalo) - Zalo Bot API；越南熱門的通訊工具（官方外掛）。
- [Zalo ClawBot](/zh-TW/channels/zaloclawbot) - 透過 QR 碼登入的個人 Zalo 助理；綁定擁有者（外部外掛）。
- [Zalo Personal](/zh-TW/channels/zalouser) - 透過 QR 碼登入使用 Zalo 個人帳號（官方外掛）。

## 傳遞注意事項

- 當 Telegram 回覆包含 Markdown 圖片語法（例如 `![alt](url)`）時，
  最終傳出路徑會在可行時將其轉換為媒體回覆。
- Slack 多人私訊會以群組聊天方式路由，因此 MPIM 對話會套用群組政策、提及
  行為與群組工作階段規則。
- WhatsApp 設定採按需安裝：即使外掛套件尚未安裝，新手引導也可先顯示設定流程；
  而閘道僅會在該頻道實際啟用時載入外部
  ClawHub/npm 外掛。
- 接受機器人所建立傳入訊息的頻道，可以使用共用的
  [機器人迴圈保護](/zh-TW/channels/bot-loop-protection)，防止成對機器人無限互相回覆。
- 支援的常駐聊天室可以使用[環境聊天室事件](/zh-TW/channels/ambient-room-events)，
  讓未提及代理的聊天室閒聊成為安靜的情境資訊，除非代理透過
  `message` 工具傳送訊息。

## 注意事項

- 各頻道可同時執行；設定多個頻道後，OpenClaw 會依各聊天路由。
- 通常最快的設定方式是 **Telegram**（僅需簡單的機器人權杖，無須安裝外掛）。WhatsApp
  需要 QR 碼配對，且會在磁碟上儲存較多狀態。
- 群組行為因頻道而異；請參閱[群組](/zh-TW/channels/groups)。
- 為確保安全，系統會強制執行私訊配對與允許清單；請參閱[安全性](/zh-TW/gateway/security)。
- 疑難排解：[頻道疑難排解](/zh-TW/channels/troubleshooting)。
- 模型供應商另有專門文件；請參閱[模型供應商](/zh-TW/providers/models)。
