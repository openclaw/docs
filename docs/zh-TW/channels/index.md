---
read_when:
    - 你想為 OpenClaw 選擇聊天頻道
    - 你需要快速了解支援的訊息平台
summary: OpenClaw 可連接的訊息平台
title: 聊天頻道
x-i18n:
    generated_at: "2026-06-27T18:55:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以在你已經使用的任何聊天應用程式上與你交談。每個頻道都透過閘道連線。
文字在所有地方都受支援；媒體和反應則因頻道而異。

## 傳遞注意事項

- Telegram 回覆若包含 markdown 圖片語法，例如 `![alt](url)`，
  會在可行時於最後的傳出路徑轉換為媒體回覆。
- Slack 多人私訊會以群組聊天方式路由，因此群組政策、提及
  行為與群組工作階段規則都適用於 MPIM 對話。
- WhatsApp 設定採用按需安裝：導覽流程可以在
  外掛套件安裝前顯示設定流程，而閘道只會在該頻道實際啟用時
  載入外部 ClawHub/npm 外掛。
- 接受機器人撰寫之傳入訊息的頻道，可以使用共用的
  [機器人迴圈保護](/zh-TW/channels/bot-loop-protection)，防止機器人彼此無限回覆。
- 受支援的常駐聊天室可以使用[環境聊天室事件](/zh-TW/channels/ambient-room-events)，
  讓未提及的聊天室閒聊成為安靜的脈絡，除非代理程式使用
  `message` 工具傳送。

## 支援的頻道

- [Discord](/zh-TW/channels/discord) - Discord Bot API + 閘道；支援伺服器、頻道和私訊。
- [Feishu](/zh-TW/channels/feishu) - 透過 WebSocket 使用 Feishu/Lark 機器人（捆綁外掛）。
- [Google Chat](/zh-TW/channels/googlechat) - 透過 HTTP 網路鉤子使用 Google Chat API 應用程式（可下載外掛）。
- [iMessage](/zh-TW/channels/imessage) - 在已登入的 Mac 上透過 `imsg` 橋接器進行原生 macOS 整合（或在閘道於其他位置執行時使用 SSH 包裝器），包含回覆、tapback、效果、附件與群組管理的私有 API 動作。當主機權限和 Messages 存取權適合時，這是新 OpenClaw iMessage 設定的首選。
- [IRC](/zh-TW/channels/irc) - 經典 IRC 伺服器；支援頻道 + 私訊，並提供配對/允許清單控制。
- [LINE](/zh-TW/channels/line) - LINE Messaging API 機器人（可下載外掛）。
- [Matrix](/zh-TW/channels/matrix) - Matrix 通訊協定（可下載外掛）。
- [Mattermost](/zh-TW/channels/mattermost) - Bot API + WebSocket；支援頻道、群組、私訊（可下載外掛）。
- [Microsoft Teams](/zh-TW/channels/msteams) - Bot Framework；企業支援（捆綁外掛）。
- [Nextcloud Talk](/zh-TW/channels/nextcloud-talk) - 透過 Nextcloud Talk 使用自託管聊天（捆綁外掛）。
- [Nostr](/zh-TW/channels/nostr) - 透過 NIP-04 使用去中心化私訊（捆綁外掛）。
- [QQ Bot](/zh-TW/channels/qqbot) - QQ Bot API；私人聊天、群組聊天與豐富媒體（捆綁外掛）。
- [Raft](/zh-TW/channels/raft) - 用於人類與代理程式協作的 Raft 命令列介面喚醒橋接器（外部外掛）。
- [Signal](/zh-TW/channels/signal) - signal-cli；重視隱私。
- [Slack](/zh-TW/channels/slack) - Bolt SDK；工作區應用程式。
- [SMS](/zh-TW/channels/sms) - 透過閘道網路鉤子使用 Twilio 支援的 SMS（官方外掛）。
- [Synology Chat](/zh-TW/channels/synology-chat) - 透過傳出+傳入網路鉤子使用 Synology NAS Chat（捆綁外掛）。
- [Telegram](/zh-TW/channels/telegram) - 透過 grammY 使用 Bot API；支援群組。
- [Tlon](/zh-TW/channels/tlon) - 基於 Urbit 的即時通訊工具（捆綁外掛）。
- [Twitch](/zh-TW/channels/twitch) - 透過 IRC 連線使用 Twitch 聊天（捆綁外掛）。
- [語音通話](/zh-TW/plugins/voice-call) - 透過 Plivo 或 Twilio 使用電話通訊（外掛，需另行安裝）。
- [WebChat](/zh-TW/web/webchat) - 透過 WebSocket 使用閘道 WebChat 使用者介面。
- [WeChat](/zh-TW/channels/wechat) - 透過 QR 登入使用騰訊 iLink Bot 外掛；僅限私人聊天（外部外掛）。
- [WhatsApp](/zh-TW/channels/whatsapp) - 最受歡迎；使用 Baileys，並需要 QR 配對。
- [Yuanbao](/zh-TW/channels/yuanbao) - 騰訊元寶機器人（外部外掛）。
- [Zalo](/zh-TW/channels/zalo) - Zalo Bot API；越南熱門即時通訊工具（捆綁外掛）。
- [Zalo ClawBot](/zh-TW/channels/zaloclawbot) - 透過 QR 登入的個人 Zalo 助理；綁定擁有者（外部外掛）。
- [Zalo Personal](/zh-TW/channels/zalouser) - 透過 QR 登入使用 Zalo 個人帳號（捆綁外掛）。

## 注意事項

- 頻道可以同時執行；設定多個頻道後，OpenClaw 會依聊天路由。
- 最快的設定通常是 **Telegram**（簡單的機器人權杖）。WhatsApp 需要 QR 配對，
  並且會在磁碟上儲存更多狀態。
- 群組行為因頻道而異；請參閱[群組](/zh-TW/channels/groups)。
- 為了安全，會強制執行私訊配對和允許清單；請參閱[安全性](/zh-TW/gateway/security)。
- 疑難排解：[頻道疑難排解](/zh-TW/channels/troubleshooting)。
- 模型提供者另有文件說明；請參閱[模型提供者](/zh-TW/providers/models)。
