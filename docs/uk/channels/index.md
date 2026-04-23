---
read_when:
    - Ви хочете вибрати чат-канал для OpenClaw
    - Вам потрібен короткий огляд підтримуваних платформ обміну повідомленнями
summary: Платформи обміну повідомленнями, до яких може підключатися OpenClaw
title: Чат-канали
x-i18n:
    generated_at: "2026-04-23T20:44:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

OpenClaw може спілкуватися з вами в будь-якому чат-застосунку, яким ви вже користуєтеся. Кожен канал підключається через Gateway.
Текст підтримується всюди; підтримка медіа та реакцій залежить від каналу.

## Підтримувані канали

- [BlueBubbles](/uk/channels/bluebubbles) — **Рекомендовано для iMessage**; використовує REST API сервера BlueBubbles для macOS із повною підтримкою функцій (вбудований Plugin; редагування, скасування надсилання, ефекти, реакції, керування групами — редагування наразі не працює в macOS 26 Tahoe).
- [Discord](/uk/channels/discord) — Discord Bot API + Gateway; підтримує сервери, канали та DM.
- [Feishu](/uk/channels/feishu) — бот Feishu/Lark через WebSocket (вбудований Plugin).
- [Google Chat](/uk/channels/googlechat) — застосунок Google Chat API через HTTP Webhook.
- [iMessage (legacy)](/uk/channels/imessage) — застаріла інтеграція з macOS через CLI imsg (застаріло, для нових налаштувань використовуйте BlueBubbles).
- [IRC](/uk/channels/irc) — класичні IRC-сервери; канали та DM з керуванням pairing/allowlist.
- [LINE](/uk/channels/line) — бот LINE Messaging API (вбудований Plugin).
- [Matrix](/uk/channels/matrix) — протокол Matrix (вбудований Plugin).
- [Mattermost](/uk/channels/mattermost) — Bot API + WebSocket; канали, групи, DM (вбудований Plugin).
- [Microsoft Teams](/uk/channels/msteams) — Bot Framework; підтримка для підприємств (вбудований Plugin).
- [Nextcloud Talk](/uk/channels/nextcloud-talk) — self-hosted чат через Nextcloud Talk (вбудований Plugin).
- [Nostr](/uk/channels/nostr) — децентралізовані DM через NIP-04 (вбудований Plugin).
- [QQ Bot](/uk/channels/qqbot) — QQ Bot API; приватний чат, груповий чат і багаті медіа (вбудований Plugin).
- [Signal](/uk/channels/signal) — signal-cli; орієнтований на приватність.
- [Slack](/uk/channels/slack) — Bolt SDK; застосунки робочого простору.
- [Synology Chat](/uk/channels/synology-chat) — Synology NAS Chat через вихідні та вхідні Webhook (вбудований Plugin).
- [Telegram](/uk/channels/telegram) — Bot API через grammY; підтримує групи.
- [Tlon](/uk/channels/tlon) — месенджер на базі Urbit (вбудований Plugin).
- [Twitch](/uk/channels/twitch) — чат Twitch через IRC-з’єднання (вбудований Plugin).
- [Voice Call](/uk/plugins/voice-call) — телефонія через Plivo або Twilio (Plugin, встановлюється окремо).
- [WebChat](/uk/web/webchat) — інтерфейс Gateway WebChat через WebSocket.
- [WeChat](/uk/channels/wechat) — Plugin Tencent iLink Bot через вхід за QR-кодом; лише приватні чати (зовнішній Plugin).
- [WhatsApp](/uk/channels/whatsapp) — найпопулярніший; використовує Baileys і потребує pairing через QR-код.
- [Zalo](/uk/channels/zalo) — Zalo Bot API; популярний месенджер у В’єтнамі (вбудований Plugin).
- [Zalo Personal](/uk/channels/zalouser) — особистий обліковий запис Zalo через вхід за QR-кодом (вбудований Plugin).

## Примітки

- Канали можуть працювати одночасно; налаштуйте кілька, і OpenClaw виконуватиме маршрутизацію для кожного чату.
- Найшвидше зазвичай налаштовується **Telegram** (простий токен бота). WhatsApp вимагає pairing через QR-код і
  зберігає більше стану на диску.
- Поведінка груп залежить від каналу; див. [Groups](/uk/channels/groups).
- DM pairing і allowlist застосовуються з міркувань безпеки; див. [Security](/uk/gateway/security).
- Усунення проблем: [Channel troubleshooting](/uk/channels/troubleshooting).
- Постачальники моделей задокументовані окремо; див. [Model Providers](/uk/providers/models).
