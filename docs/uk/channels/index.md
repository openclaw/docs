---
read_when:
    - Ви хочете вибрати канал чату для OpenClaw
    - Вам потрібен короткий огляд підтримуваних платформ обміну повідомленнями
summary: Платформи обміну повідомленнями, до яких може підключатися OpenClaw
title: Канали чату
x-i18n:
    generated_at: "2026-05-06T02:29:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw може спілкуватися з вами в будь-якому чат-застосунку, яким ви вже користуєтеся. Кожен канал підключається через Gateway.
Текст підтримується всюди; медіа та реакції залежать від каналу.

## Примітки щодо доставки

- Відповіді Telegram, які містять Markdown-синтаксис зображень, наприклад `![alt](url)`,
  за можливості перетворюються на медіавідповіді на фінальному вихідному шляху.
- Багатокористувацькі DM у Slack маршрутизуються як групові чати, тому групова політика, поведінка
  згадок і правила групових сеансів застосовуються до MPIM-розмов.
- Налаштування WhatsApp виконується на вимогу: онбординг може показати потік налаштування до того,
  як пакет Plugin буде встановлено, а Gateway завантажує runtime WhatsApp
  лише тоді, коли канал фактично активний.

## Підтримувані канали

- [BlueBubbles](/uk/channels/bluebubbles) - **Рекомендовано для iMessage**; використовує REST API macOS-сервера BlueBubbles із повною підтримкою функцій (вбудований Plugin; редагування, скасування надсилання, ефекти, реакції, керування групами - редагування наразі не працює в macOS 26 Tahoe).
- [Discord](/uk/channels/discord) - Discord Bot API + Gateway; підтримує сервери, канали та DM.
- [Feishu](/uk/channels/feishu) - Бот Feishu/Lark через WebSocket (вбудований Plugin).
- [Google Chat](/uk/channels/googlechat) - Застосунок Google Chat API через HTTP Webhook (завантажуваний Plugin).
- [iMessage (legacy)](/uk/channels/imessage) - Застаріла інтеграція macOS через imsg CLI (застаріло, використовуйте BlueBubbles для нових налаштувань).
- [IRC](/uk/channels/irc) - Класичні IRC-сервери; канали + DM з елементами керування сполученням/allowlist.
- [LINE](/uk/channels/line) - Бот LINE Messaging API (завантажуваний Plugin).
- [Matrix](/uk/channels/matrix) - Протокол Matrix (завантажуваний Plugin).
- [Mattermost](/uk/channels/mattermost) - Bot API + WebSocket; канали, групи, DM (завантажуваний Plugin).
- [Microsoft Teams](/uk/channels/msteams) - Bot Framework; корпоративна підтримка (вбудований Plugin).
- [Nextcloud Talk](/uk/channels/nextcloud-talk) - Самостійно розгорнутий чат через Nextcloud Talk (вбудований Plugin).
- [Nostr](/uk/channels/nostr) - Децентралізовані DM через NIP-04 (вбудований Plugin).
- [QQ Bot](/uk/channels/qqbot) - QQ Bot API; приватний чат, груповий чат і розширені медіа (вбудований Plugin).
- [Signal](/uk/channels/signal) - signal-cli; орієнтований на приватність.
- [Slack](/uk/channels/slack) - Bolt SDK; застосунки для робочих просторів.
- [Synology Chat](/uk/channels/synology-chat) - Synology NAS Chat через вихідні+вхідні Webhook (вбудований Plugin).
- [Telegram](/uk/channels/telegram) - Bot API через grammY; підтримує групи.
- [Tlon](/uk/channels/tlon) - Месенджер на основі Urbit (вбудований Plugin).
- [Twitch](/uk/channels/twitch) - Чат Twitch через IRC-з’єднання (вбудований Plugin).
- [Voice Call](/uk/plugins/voice-call) - Телефонія через Plivo або Twilio (Plugin, встановлюється окремо).
- [WebChat](/uk/web/webchat) - Gateway WebChat UI через WebSocket.
- [WeChat](/uk/channels/wechat) - Plugin Tencent iLink Bot через QR-вхід; лише приватні чати (зовнішній Plugin).
- [WhatsApp](/uk/channels/whatsapp) - Найпопулярніший; використовує Baileys і потребує QR-сполучення.
- [Yuanbao](/uk/channels/yuanbao) - Бот Tencent Yuanbao (зовнішній Plugin).
- [Zalo](/uk/channels/zalo) - Zalo Bot API; популярний месенджер В’єтнаму (вбудований Plugin).
- [Zalo Personal](/uk/channels/zalouser) - Особистий обліковий запис Zalo через QR-вхід (вбудований Plugin).

## Примітки

- Канали можуть працювати одночасно; налаштуйте кілька, і OpenClaw маршрутизуватиме за чатом.
- Найшвидше налаштування зазвичай має **Telegram** (простий токен бота). WhatsApp потребує QR-сполучення та
  зберігає більше стану на диску.
- Поведінка груп залежить від каналу; див. [Групи](/uk/channels/groups).
- Сполучення DM та allowlist застосовуються для безпеки; див. [Безпека](/uk/gateway/security).
- Усунення несправностей: [Усунення несправностей каналів](/uk/channels/troubleshooting).
- Провайдери моделей задокументовані окремо; див. [Провайдери моделей](/uk/providers/models).
