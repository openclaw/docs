---
read_when:
    - Ви хочете вибрати чат-канал для OpenClaw
    - Потрібен короткий огляд підтримуваних платформ обміну повідомленнями
summary: Платформи обміну повідомленнями, до яких може підключатися OpenClaw
title: Канали чату
x-i18n:
    generated_at: "2026-05-02T07:07:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw може спілкуватися з вами в будь-якому чат-додатку, яким ви вже користуєтеся. Кожен канал підключається через Gateway.
Текст підтримується всюди; медіа й реакції залежать від каналу.

## Примітки щодо доставки

- Відповіді Telegram, що містять markdown-синтаксис зображення, як-от `![alt](url)`,
  за можливості перетворюються на медіавідповіді на фінальному вихідному шляху.
- Багатокористувацькі DM у Slack маршрутизуються як групові чати, тому політика груп,
  поведінка згадок і правила групових сеансів застосовуються до розмов MPIM.
- Налаштування WhatsApp виконується на вимогу: онбординг може показати потік налаштування до того,
  як пакет plugin буде встановлено, а Gateway завантажує середовище виконання WhatsApp
  лише тоді, коли канал фактично активний.

## Підтримувані канали

- [BlueBubbles](/uk/channels/bluebubbles) — **Рекомендовано для iMessage**; використовує REST API сервера BlueBubbles macOS із повною підтримкою функцій (вбудований plugin; редагування, скасування надсилання, ефекти, реакції, керування групами — редагування наразі зламане в macOS 26 Tahoe).
- [Discord](/uk/channels/discord) — Discord Bot API + Gateway; підтримує сервери, канали та DM.
- [Feishu](/uk/channels/feishu) — бот Feishu/Lark через WebSocket (вбудований plugin).
- [Google Chat](/uk/channels/googlechat) — додаток Google Chat API через HTTP webhook (завантажуваний plugin).
- [iMessage (застарілий)](/uk/channels/imessage) — застаріла інтеграція macOS через imsg CLI (застаріло, використовуйте BlueBubbles для нових налаштувань).
- [IRC](/uk/channels/irc) — класичні сервери IRC; канали + DM із керуванням спарюванням/списком дозволених.
- [LINE](/uk/channels/line) — бот LINE Messaging API (завантажуваний plugin).
- [Matrix](/uk/channels/matrix) — протокол Matrix (завантажуваний plugin).
- [Mattermost](/uk/channels/mattermost) — Bot API + WebSocket; канали, групи, DM (завантажуваний plugin).
- [Microsoft Teams](/uk/channels/msteams) — Bot Framework; корпоративна підтримка (вбудований plugin).
- [Nextcloud Talk](/uk/channels/nextcloud-talk) — чат із самостійним хостингом через Nextcloud Talk (вбудований plugin).
- [Nostr](/uk/channels/nostr) — децентралізовані DM через NIP-04 (вбудований plugin).
- [QQ Bot](/uk/channels/qqbot) — QQ Bot API; приватний чат, груповий чат і мультимедійні повідомлення (вбудований plugin).
- [Signal](/uk/channels/signal) — signal-cli; із фокусом на приватність.
- [Slack](/uk/channels/slack) — Bolt SDK; додатки робочих просторів.
- [Synology Chat](/uk/channels/synology-chat) — Synology NAS Chat через вихідні+вхідні webhooks (вбудований plugin).
- [Telegram](/uk/channels/telegram) — Bot API через grammY; підтримує групи.
- [Tlon](/uk/channels/tlon) — месенджер на базі Urbit (вбудований plugin).
- [Twitch](/uk/channels/twitch) — чат Twitch через IRC-з’єднання (вбудований plugin).
- [Voice Call](/uk/plugins/voice-call) — телефонія через Plivo або Twilio (plugin, встановлюється окремо).
- [WebChat](/uk/web/webchat) — інтерфейс Gateway WebChat через WebSocket.
- [WeChat](/uk/channels/wechat) — plugin Tencent iLink Bot через QR-вхід; лише приватні чати (зовнішній plugin).
- [WhatsApp](/uk/channels/whatsapp) — найпопулярніший; використовує Baileys і потребує QR-спарювання.
- [Yuanbao](/uk/channels/yuanbao) — бот Tencent Yuanbao (зовнішній plugin).
- [Zalo](/uk/channels/zalo) — Zalo Bot API; популярний месенджер В’єтнаму (вбудований plugin).
- [Zalo Personal](/uk/channels/zalouser) — особистий обліковий запис Zalo через QR-вхід (вбудований plugin).

## Примітки

- Канали можуть працювати одночасно; налаштуйте кілька, і OpenClaw маршрутизуватиме за чатом.
- Найшвидше налаштування зазвичай у **Telegram** (простий токен бота). WhatsApp потребує QR-спарювання та
  зберігає більше стану на диску.
- Поведінка груп залежить від каналу; див. [Групи](/uk/channels/groups).
- Спарювання DM і списки дозволених застосовуються для безпеки; див. [Безпека](/uk/gateway/security).
- Усунення несправностей: [Усунення несправностей каналів](/uk/channels/troubleshooting).
- Постачальники моделей документуються окремо; див. [Постачальники моделей](/uk/providers/models).
