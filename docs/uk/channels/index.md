---
read_when:
    - Ви хочете вибрати канал чату для OpenClaw
    - Вам потрібен короткий огляд підтримуваних платформ обміну повідомленнями
summary: Платформи обміну повідомленнями, до яких може підключатися OpenClaw
title: Канали чату
x-i18n:
    generated_at: "2026-05-10T19:21:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

OpenClaw може спілкуватися з вами в будь-якому чат-застосунку, яким ви вже користуєтеся. Кожен канал підключається через Gateway.
Текст підтримується всюди; медіа та реакції залежать від каналу.

## Примітки щодо доставки

- Відповіді Telegram, що містять markdown-синтаксис зображень, наприклад `![alt](url)`,
  перетворюються на медіавідповіді на фінальному вихідному шляху, коли це можливо.
- Багатокористувацькі DM у Slack маршрутизуються як групові чати, тому політика груп,
  поведінка згадок і правила групових сеансів застосовуються до MPIM-розмов.
- Налаштування WhatsApp виконується на вимогу: onboarding може показати потік налаштування до
  встановлення пакета плагіна, а Gateway завантажує runtime WhatsApp
  лише тоді, коли канал справді активний.

## Підтримувані канали

- [Discord](/uk/channels/discord) - Discord Bot API + Gateway; підтримує сервери, канали та DM.
- [Feishu](/uk/channels/feishu) - бот Feishu/Lark через WebSocket (вбудований плагін).
- [Google Chat](/uk/channels/googlechat) - застосунок Google Chat API через HTTP webhook (завантажуваний плагін).
- [iMessage](/uk/channels/imessage) - нативна інтеграція macOS через міст `imsg` на Mac із виконаним входом (або SSH-обгортку, коли Gateway працює деінде), зокрема приватні API-дії для відповідей, tapback-реакцій, ефектів, вкладень і керування групами. Рекомендовано для нових налаштувань OpenClaw iMessage, коли дозволи хоста та доступ до Messages підходять.
- [IRC](/uk/channels/irc) - класичні IRC-сервери; канали + DM з елементами керування сполученням/allowlist.
- [LINE](/uk/channels/line) - бот LINE Messaging API (завантажуваний плагін).
- [Matrix](/uk/channels/matrix) - протокол Matrix (завантажуваний плагін).
- [Mattermost](/uk/channels/mattermost) - Bot API + WebSocket; канали, групи, DM (завантажуваний плагін).
- [Microsoft Teams](/uk/channels/msteams) - Bot Framework; корпоративна підтримка (вбудований плагін).
- [Nextcloud Talk](/uk/channels/nextcloud-talk) - самостійно розміщений чат через Nextcloud Talk (вбудований плагін).
- [Nostr](/uk/channels/nostr) - децентралізовані DM через NIP-04 (вбудований плагін).
- [QQ Bot](/uk/channels/qqbot) - QQ Bot API; приватний чат, груповий чат і насичені медіа (вбудований плагін).
- [Signal](/uk/channels/signal) - signal-cli; орієнтований на приватність.
- [Slack](/uk/channels/slack) - Bolt SDK; застосунки робочого простору.
- [Synology Chat](/uk/channels/synology-chat) - Synology NAS Chat через вихідні+вхідні webhooks (вбудований плагін).
- [Telegram](/uk/channels/telegram) - Bot API через grammY; підтримує групи.
- [Tlon](/uk/channels/tlon) - месенджер на основі Urbit (вбудований плагін).
- [Twitch](/uk/channels/twitch) - чат Twitch через IRC-з’єднання (вбудований плагін).
- [Voice Call](/uk/plugins/voice-call) - телефонія через Plivo або Twilio (плагін, встановлюється окремо).
- [WebChat](/uk/web/webchat) - інтерфейс Gateway WebChat через WebSocket.
- [WeChat](/uk/channels/wechat) - плагін Tencent iLink Bot через QR-вхід; лише приватні чати (зовнішній плагін).
- [WhatsApp](/uk/channels/whatsapp) - найпопулярніший; використовує Baileys і потребує QR-сполучення.
- [Yuanbao](/uk/channels/yuanbao) - бот Tencent Yuanbao (зовнішній плагін).
- [Zalo](/uk/channels/zalo) - Zalo Bot API; популярний месенджер В’єтнаму (вбудований плагін).
- [Zalo Personal](/uk/channels/zalouser) - особистий обліковий запис Zalo через QR-вхід (вбудований плагін).

## Примітки

- Канали можуть працювати одночасно; налаштуйте кілька, і OpenClaw маршрутизуватиме повідомлення для кожного чату.
- Найшвидше налаштування зазвичай має **Telegram** (простий токен бота). WhatsApp потребує QR-сполучення та
  зберігає більше стану на диску.
- Поведінка груп залежить від каналу; див. [Групи](/uk/channels/groups).
- Сполучення DM та allowlists застосовуються для безпеки; див. [Безпека](/uk/gateway/security).
- Усунення несправностей: [Усунення несправностей каналів](/uk/channels/troubleshooting).
- Постачальники моделей задокументовані окремо; див. [Постачальники моделей](/uk/providers/models).
