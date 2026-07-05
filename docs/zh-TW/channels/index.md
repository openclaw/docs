---
read_when:
    - 你想為 OpenClaw 選擇聊天通道
    - 你需要快速概覽支援的訊息平台
summary: OpenClaw 可連接的訊息平台
title: 聊天通道
x-i18n:
    generated_at: "2026-07-05T11:02:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw 可以在你已經使用的任何聊天應用程式上與你對話。每個頻道都透過閘道連線。
所有地方都支援文字；媒體和回應會依頻道而異。

iMessage、Telegram 和 WebChat UI 會隨核心安裝一起提供。標示為
「官方外掛」的頻道可用一個命令安裝（`openclaw plugins install @openclaw/<id>`），
或在 `openclaw onboard` / `openclaw channels add` 期間按需安裝，然後需要重新啟動閘道。
「外部外掛」頻道由 OpenClaw repo 之外維護。

## 支援的頻道

- [Discord](/zh-TW/channels/discord) - Discord Bot API + 閘道；支援伺服器、頻道和 DM（官方外掛）。
- [Feishu](/zh-TW/channels/feishu) - 透過 WebSocket 使用 Feishu/Lark Bot（官方外掛）。
- [Google Chat](/zh-TW/channels/googlechat) - 透過 HTTP 網路鉤子使用 Google Chat API 應用程式（官方外掛）。
- [iMessage](/zh-TW/channels/imessage) - 包含於核心。透過已登入 Mac 上的 `imsg` 橋接器進行原生 macOS 整合（或在閘道於其他位置執行時使用 SSH 包裝器），包含回覆、tapback、效果、附件和群組管理的私有 API 動作。
- [IRC](/zh-TW/channels/irc) - 傳統 IRC 伺服器；頻道 + DM，具備配對/允許清單控制（官方外掛）。
- [LINE](/zh-TW/channels/line) - LINE Messaging API Bot（官方外掛）。
- [Matrix](/zh-TW/channels/matrix) - Matrix 通訊協定（官方外掛）。
- [Mattermost](/zh-TW/channels/mattermost) - Bot API + WebSocket；頻道、群組、DM（官方外掛）。
- [Microsoft Teams](/zh-TW/channels/msteams) - Bot Framework；企業支援（官方外掛）。
- [Nextcloud Talk](/zh-TW/channels/nextcloud-talk) - 透過 Nextcloud Talk 的自託管聊天（官方外掛）。
- [Nostr](/zh-TW/channels/nostr) - 透過 NIP-04 的去中心化 DM（官方外掛）。
- [QQ Bot](/zh-TW/channels/qqbot) - QQ Bot API；私人聊天、群組聊天和豐富媒體（官方外掛）。
- [Raft](/zh-TW/channels/raft) - 用於人類與代理協作的 Raft 命令列介面喚醒橋接器（官方外掛）。
- [Signal](/zh-TW/channels/signal) - signal-cli；注重隱私（官方外掛）。
- [Slack](/zh-TW/channels/slack) - Bolt SDK；工作區應用程式（官方外掛）。
- [SMS](/zh-TW/channels/sms) - 透過閘道網路鉤子的 Twilio 支援 SMS（官方外掛）。
- [Synology Chat](/zh-TW/channels/synology-chat) - 透過傳出+傳入網路鉤子的 Synology NAS Chat（官方外掛）。
- [Telegram](/zh-TW/channels/telegram) - 包含於核心。透過 grammY 使用 Bot API；支援群組。
- [Tlon](/zh-TW/channels/tlon) - 基於 Urbit 的通訊程式（官方外掛）。
- [Twitch](/zh-TW/channels/twitch) - 透過 IRC 連線的 Twitch 聊天（官方外掛）。
- [Voice Call](/zh-TW/plugins/voice-call) - 透過 Plivo、Telnyx 或 Twilio 的電話通訊（官方外掛）。
- [WebChat](/zh-TW/web/webchat) - 包含於核心。透過 WebSocket 的閘道 WebChat UI。
- [WeChat](/zh-TW/channels/wechat) - 透過 QR 登入的騰訊 iLink Bot；僅限私人聊天（外部外掛）。
- [WhatsApp](/zh-TW/channels/whatsapp) - 最受歡迎；使用 Baileys 且需要 QR 配對（官方外掛）。
- [Yuanbao](/zh-TW/channels/yuanbao) - 騰訊元寶 Bot（外部外掛）。
- [Zalo](/zh-TW/channels/zalo) - Zalo Bot API；越南熱門通訊程式（官方外掛）。
- [Zalo ClawBot](/zh-TW/channels/zaloclawbot) - 透過 QR 登入的個人 Zalo 助理；綁定擁有者（外部外掛）。
- [Zalo Personal](/zh-TW/channels/zalouser) - 透過 QR 登入的 Zalo Personal 帳號（官方外掛）。

## 傳遞注意事項

- Telegram 回覆若包含 Markdown 圖片語法，例如 `![alt](url)`，
  會在可能時於最後的傳出路徑上轉換為媒體回覆。
- Slack 多人 DM 會路由為群組聊天，因此群組政策、提及
  行為和群組工作階段規則會套用到 MPIM 對話。
- WhatsApp 設定是按需安裝：onboarding 可以在
  外掛套件安裝前顯示設定流程，而閘道只會在頻道實際啟用時載入外部
  ClawHub/npm 外掛。
- 接受 Bot 所撰寫傳入訊息的頻道可以使用共用的
  [Bot 迴圈保護](/zh-TW/channels/bot-loop-protection)，防止 Bot 配對無限期
  互相回覆。
- 支援的 always-on 房間可以使用[環境房間事件](/zh-TW/channels/ambient-room-events)，
  讓未提及的房間閒聊成為安靜的脈絡，除非代理使用
  `message` 工具傳送。

## 附註

- 頻道可以同時執行；設定多個頻道後，OpenClaw 會按聊天路由。
- 最快的設定通常是 **Telegram**（簡單的 Bot token，無需安裝外掛）。WhatsApp
  需要 QR 配對，並在磁碟上儲存更多狀態。
- 群組行為因頻道而異；請參閱[群組](/zh-TW/channels/groups)。
- 為安全起見會強制執行 DM 配對和允許清單；請參閱[安全性](/zh-TW/gateway/security)。
- 疑難排解：[頻道疑難排解](/zh-TW/channels/troubleshooting)。
- 模型提供者另有文件說明；請參閱[模型提供者](/zh-TW/providers/models)。
