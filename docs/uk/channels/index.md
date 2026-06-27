---
read_when:
    - Ви хочете вибрати канал чату для OpenClaw
    - Вам потрібен короткий огляд підтримуваних платформ обміну повідомленнями
summary: Платформи обміну повідомленнями, до яких може підключатися OpenClaw
title: Канали чату
x-i18n:
    generated_at: "2026-06-27T17:11:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw може спілкуватися з вами в будь-якому чат-застосунку, яким ви вже користуєтеся. Кожен канал підключається через Gateway.
Текст підтримується всюди; медіа та реакції залежать від каналу.

## Нотатки щодо доставки

- Відповіді Telegram, які містять синтаксис markdown для зображень, як-от `![alt](url)`,
  за можливості перетворюються на медіавідповіді на фінальному вихідному шляху.
- Багатокористувацькі DM у Slack маршрутизуються як групові чати, тому групова політика, поведінка
  згадок і правила групових сесій застосовуються до розмов MPIM.
- Налаштування WhatsApp виконується як встановлення за потреби: onboarding може показати потік налаштування до
  встановлення пакета Plugin, а Gateway завантажує зовнішній
  Plugin ClawHub/npm лише тоді, коли канал фактично активний.
- Канали, які приймають вхідні повідомлення, створені ботом, можуть використовувати спільний
  [захист від циклів ботів](/uk/channels/bot-loop-protection), щоб запобігти нескінченним
  відповідям пар ботів один одному.
- Підтримувані постійно активні кімнати можуть використовувати [фонові події кімнат](/uk/channels/ambient-room-events),
  щоб незгадані розмови в кімнаті ставали тихим контекстом, якщо агент не надсилає через
  інструмент `message`.

## Підтримувані канали

- [Discord](/uk/channels/discord) - Discord Bot API + Gateway; підтримує сервери, канали та DM.
- [Feishu](/uk/channels/feishu) - бот Feishu/Lark через WebSocket (вбудований Plugin).
- [Google Chat](/uk/channels/googlechat) - застосунок Google Chat API через HTTP Webhook (завантажуваний Plugin).
- [iMessage](/uk/channels/imessage) - нативна інтеграція macOS через міст `imsg` на Mac із виконаним входом (або SSH-обгортка, коли Gateway працює деінде), включно з діями приватного API для відповідей, tapback, ефектів, вкладень і керування групами. Рекомендовано для нових налаштувань OpenClaw iMessage, коли дозволи хоста й доступ до Messages підходять.
- [IRC](/uk/channels/irc) - класичні сервери IRC; канали + DM з керуванням спарюванням і списками дозволених.
- [LINE](/uk/channels/line) - бот LINE Messaging API (завантажуваний Plugin).
- [Matrix](/uk/channels/matrix) - протокол Matrix (завантажуваний Plugin).
- [Mattermost](/uk/channels/mattermost) - Bot API + WebSocket; канали, групи, DM (завантажуваний Plugin).
- [Microsoft Teams](/uk/channels/msteams) - Bot Framework; корпоративна підтримка (вбудований Plugin).
- [Nextcloud Talk](/uk/channels/nextcloud-talk) - самостійно розміщений чат через Nextcloud Talk (вбудований Plugin).
- [Nostr](/uk/channels/nostr) - децентралізовані DM через NIP-04 (вбудований Plugin).
- [QQ Bot](/uk/channels/qqbot) - QQ Bot API; приватний чат, груповий чат і насичені медіа (вбудований Plugin).
- [Raft](/uk/channels/raft) - міст пробудження Raft CLI для співпраці людини й агента (зовнішній Plugin).
- [Signal](/uk/channels/signal) - signal-cli; орієнтований на приватність.
- [Slack](/uk/channels/slack) - Bolt SDK; застосунки робочого простору.
- [SMS](/uk/channels/sms) - SMS на базі Twilio через Gateway Webhook (офіційний Plugin).
- [Synology Chat](/uk/channels/synology-chat) - Synology NAS Chat через вихідні+вхідні Webhook (вбудований Plugin).
- [Telegram](/uk/channels/telegram) - Bot API через grammY; підтримує групи.
- [Tlon](/uk/channels/tlon) - месенджер на базі Urbit (вбудований Plugin).
- [Twitch](/uk/channels/twitch) - чат Twitch через IRC-з’єднання (вбудований Plugin).
- [Голосовий виклик](/uk/plugins/voice-call) - телефонія через Plivo або Twilio (Plugin, встановлюється окремо).
- [WebChat](/uk/web/webchat) - інтерфейс Gateway WebChat через WebSocket.
- [WeChat](/uk/channels/wechat) - Plugin Tencent iLink Bot через QR-вхід; лише приватні чати (зовнішній Plugin).
- [WhatsApp](/uk/channels/whatsapp) - найпопулярніший; використовує Baileys і потребує QR-спарювання.
- [Yuanbao](/uk/channels/yuanbao) - бот Tencent Yuanbao (зовнішній Plugin).
- [Zalo](/uk/channels/zalo) - Zalo Bot API; популярний месенджер В’єтнаму (вбудований Plugin).
- [Zalo ClawBot](/uk/channels/zaloclawbot) - персональний асистент Zalo через QR-вхід; прив’язаний до власника (зовнішній Plugin).
- [Zalo Personal](/uk/channels/zalouser) - персональний обліковий запис Zalo через QR-вхід (вбудований Plugin).

## Нотатки

- Канали можуть працювати одночасно; налаштуйте кілька, і OpenClaw маршрутизуватиме за чатом.
- Найшвидше налаштування зазвичай має **Telegram** (простий токен бота). WhatsApp потребує QR-спарювання та
  зберігає більше стану на диску.
- Поведінка груп залежить від каналу; див. [Групи](/uk/channels/groups).
- Спарювання DM і списки дозволених застосовуються для безпеки; див. [Безпека](/uk/gateway/security).
- Усунення несправностей: [усунення несправностей каналів](/uk/channels/troubleshooting).
- Постачальники моделей задокументовані окремо; див. [постачальники моделей](/uk/providers/models).
