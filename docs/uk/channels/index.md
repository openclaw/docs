---
read_when:
    - Ви хочете обрати канал чату для OpenClaw
    - Вам потрібен короткий огляд підтримуваних платформ обміну повідомленнями
summary: Платформи обміну повідомленнями, до яких може підключатися OpenClaw
title: Чат-канали
x-i18n:
    generated_at: "2026-05-07T01:50:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw може спілкуватися з вами в будь-якому чат-додатку, яким ви вже користуєтеся. Кожен канал підключається через Gateway.
Текст підтримується всюди; медіа та реакції залежать від каналу.

## Примітки щодо доставки

- Відповіді Telegram, що містять markdown-синтаксис зображень, як-от `![alt](url)`,
  за можливості перетворюються на медіавідповіді на фінальному вихідному шляху.
- Багатокористувацькі DM у Slack маршрутизуються як групові чати, тому групова політика, поведінка
  згадок і правила групових сесій застосовуються до розмов MPIM.
- Налаштування WhatsApp виконується з установленням за потреби: онбординг може показати потік налаштування до
  встановлення пакета Plugin, а Gateway завантажує середовище виконання WhatsApp
  лише тоді, коли канал фактично активний.

## Підтримувані канали

- [BlueBubbles](/uk/channels/bluebubbles) - Застарілий міст iMessage через REST API macOS-сервера BlueBubbles; застарілий для нових налаштувань OpenClaw, але все ще підтримується для наявних конфігурацій і ширших дій приватного API.
- [Discord](/uk/channels/discord) - Discord Bot API + Gateway; підтримує сервери, канали та DM.
- [Feishu](/uk/channels/feishu) - бот Feishu/Lark через WebSocket (вбудований Plugin).
- [Google Chat](/uk/channels/googlechat) - додаток Google Chat API через HTTP Webhook (завантажуваний Plugin).
- [iMessage](/uk/channels/imessage) - Нативна інтеграція macOS через imsg CLI; рекомендовано для нових налаштувань iMessage в OpenClaw, коли дозволи хоста й доступ до Messages підходять.
- [IRC](/uk/channels/irc) - Класичні сервери IRC; канали + DM з керуванням паруванням/списком дозволених.
- [LINE](/uk/channels/line) - бот LINE Messaging API (завантажуваний Plugin).
- [Matrix](/uk/channels/matrix) - Протокол Matrix (завантажуваний Plugin).
- [Mattermost](/uk/channels/mattermost) - Bot API + WebSocket; канали, групи, DM (завантажуваний Plugin).
- [Microsoft Teams](/uk/channels/msteams) - Bot Framework; корпоративна підтримка (вбудований Plugin).
- [Nextcloud Talk](/uk/channels/nextcloud-talk) - Самостійно розміщений чат через Nextcloud Talk (вбудований Plugin).
- [Nostr](/uk/channels/nostr) - Децентралізовані DM через NIP-04 (вбудований Plugin).
- [QQ Bot](/uk/channels/qqbot) - QQ Bot API; приватний чат, груповий чат і багаті медіа (вбудований Plugin).
- [Signal](/uk/channels/signal) - signal-cli; з акцентом на приватність.
- [Slack](/uk/channels/slack) - Bolt SDK; додатки робочого простору.
- [Synology Chat](/uk/channels/synology-chat) - Synology NAS Chat через вихідні+вхідні Webhook-и (вбудований Plugin).
- [Telegram](/uk/channels/telegram) - Bot API через grammY; підтримує групи.
- [Tlon](/uk/channels/tlon) - Месенджер на базі Urbit (вбудований Plugin).
- [Twitch](/uk/channels/twitch) - Чат Twitch через IRC-з'єднання (вбудований Plugin).
- [Voice Call](/uk/plugins/voice-call) - Телефонія через Plivo або Twilio (Plugin, установлюється окремо).
- [WebChat](/uk/web/webchat) - Інтерфейс Gateway WebChat через WebSocket.
- [WeChat](/uk/channels/wechat) - Plugin Tencent iLink Bot через QR-вхід; лише приватні чати (зовнішній Plugin).
- [WhatsApp](/uk/channels/whatsapp) - Найпопулярніший; використовує Baileys і потребує QR-парування.
- [Yuanbao](/uk/channels/yuanbao) - бот Tencent Yuanbao (зовнішній Plugin).
- [Zalo](/uk/channels/zalo) - Zalo Bot API; популярний месенджер В'єтнаму (вбудований Plugin).
- [Zalo Personal](/uk/channels/zalouser) - Особистий обліковий запис Zalo через QR-вхід (вбудований Plugin).

## Примітки

- Канали можуть працювати одночасно; налаштуйте кілька, і OpenClaw маршрутизуватиме за чатом.
- Найшвидше налаштування зазвичай **Telegram** (простий токен бота). WhatsApp потребує QR-парування і
  зберігає більше стану на диску.
- Поведінка груп залежить від каналу; див. [Групи](/uk/channels/groups).
- Парування DM і списки дозволених застосовуються для безпеки; див. [Безпека](/uk/gateway/security).
- Усунення несправностей: [Усунення несправностей каналів](/uk/channels/troubleshooting).
- Провайдери моделей задокументовані окремо; див. [Провайдери моделей](/uk/providers/models).
