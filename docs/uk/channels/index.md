---
read_when:
    - Ви хочете вибрати канал чату для OpenClaw
    - Вам потрібен короткий огляд підтримуваних платформ обміну повідомленнями
summary: Платформи обміну повідомленнями, до яких може підключатися OpenClaw
title: Канали чату
x-i18n:
    generated_at: "2026-04-24T16:58:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

OpenClaw може спілкуватися з вами в будь-якому чат-застосунку, яким ви вже користуєтеся. Кожен канал підключається через Gateway.
Текст підтримується всюди; підтримка медіа та реакцій залежить від каналу.

## Примітки щодо доставки

- Відповіді Telegram, що містять синтаксис зображень markdown, наприклад `![alt](url)`,
  за можливості перетворюються на медіавідповіді на фінальному вихідному етапі.
- Групові приватні повідомлення Slack маршрутизуються як групові чати, тому для розмов MPIM застосовуються
  політика груп, поведінка згадок і правила групових сесій.
- Налаштування WhatsApp виконується за потреби під час інсталяції: онбординг може показати потік налаштування до того,
  як буде підготовлено залежності середовища виконання Baileys, а Gateway завантажує середовище виконання WhatsApp
  лише тоді, коли канал справді активний.

## Підтримувані канали

- [BlueBubbles](/uk/channels/bluebubbles) — **Рекомендовано для iMessage**; використовує REST API сервера BlueBubbles для macOS із повною підтримкою функцій (вбудований Plugin; редагування, скасування надсилання, ефекти, реакції, керування групами — редагування наразі не працює в macOS 26 Tahoe).
- [Discord](/uk/channels/discord) — Discord Bot API + Gateway; підтримує сервери, канали та DM.
- [Feishu](/uk/channels/feishu) — бот Feishu/Lark через WebSocket (вбудований Plugin).
- [Google Chat](/uk/channels/googlechat) — застосунок Google Chat API через HTTP Webhook.
- [iMessage (legacy)](/uk/channels/imessage) — застаріла інтеграція з macOS через CLI imsg (застаріло, для нових налаштувань використовуйте BlueBubbles).
- [IRC](/uk/channels/irc) — класичні IRC-сервери; канали й DM з елементами керування сполученням/списком дозволених.
- [LINE](/uk/channels/line) — бот LINE Messaging API (вбудований Plugin).
- [Matrix](/uk/channels/matrix) — протокол Matrix (вбудований Plugin).
- [Mattermost](/uk/channels/mattermost) — Bot API + WebSocket; канали, групи, DM (вбудований Plugin).
- [Microsoft Teams](/uk/channels/msteams) — Bot Framework; корпоративна підтримка (вбудований Plugin).
- [Nextcloud Talk](/uk/channels/nextcloud-talk) — самостійно розміщений чат через Nextcloud Talk (вбудований Plugin).
- [Nostr](/uk/channels/nostr) — децентралізовані DM через NIP-04 (вбудований Plugin).
- [QQ Bot](/uk/channels/qqbot) — QQ Bot API; приватний чат, груповий чат і насичені медіа (вбудований Plugin).
- [Signal](/uk/channels/signal) — signal-cli; орієнтований на приватність.
- [Slack](/uk/channels/slack) — Bolt SDK; застосунки робочого простору.
- [Synology Chat](/uk/channels/synology-chat) — Synology NAS Chat через вихідні та вхідні Webhook (вбудований Plugin).
- [Telegram](/uk/channels/telegram) — Bot API через grammY; підтримує групи.
- [Tlon](/uk/channels/tlon) — месенджер на базі Urbit (вбудований Plugin).
- [Twitch](/uk/channels/twitch) — чат Twitch через IRC-підключення (вбудований Plugin).
- [Voice Call](/uk/plugins/voice-call) — телефонія через Plivo або Twilio (Plugin, встановлюється окремо).
- [WebChat](/uk/web/webchat) — інтерфейс Gateway WebChat через WebSocket.
- [WeChat](/uk/channels/wechat) — Plugin Tencent iLink Bot через вхід за QR-кодом; лише приватні чати (зовнішній Plugin).
- [WhatsApp](/uk/channels/whatsapp) — найпопулярніший; використовує Baileys і потребує сполучення через QR-код.
- [Zalo](/uk/channels/zalo) — Zalo Bot API; популярний месенджер у Вʼєтнамі (вбудований Plugin).
- [Zalo Personal](/uk/channels/zalouser) — особистий обліковий запис Zalo через вхід за QR-кодом (вбудований Plugin).

## Примітки

- Канали можуть працювати одночасно; налаштуйте кілька, і OpenClaw виконуватиме маршрутизацію для кожного чату.
- Найшвидше зазвичай налаштовується **Telegram** (простий токен бота). WhatsApp потребує сполучення через QR-код і
  зберігає більше стану на диску.
- Поведінка груп залежить від каналу; див. [Groups](/uk/channels/groups).
- Для безпеки застосовуються сполучення DM і списки дозволених; див. [Security](/uk/gateway/security).
- Усунення несправностей: [Усунення несправностей каналів](/uk/channels/troubleshooting).
- Постачальники моделей документовані окремо; див. [Model Providers](/uk/providers/models).
