---
read_when:
    - Ви хочете вибрати чат-канал для OpenClaw
    - Вам потрібен короткий огляд підтримуваних платформ для обміну повідомленнями
summary: Платформи обміну повідомленнями, до яких може підключатися OpenClaw
title: Канали чату
x-i18n:
    generated_at: "2026-05-01T21:34:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5937761c0aebc17e8633449d467219ea564b8b00a4a99f327aba7d73afe0c810
    source_path: channels/index.md
    workflow: 16
---

OpenClaw може спілкуватися з вами в будь-якому чат-застосунку, яким ви вже користуєтеся. Кожен канал підключається через Gateway.
Текст підтримується всюди; медіа та реакції залежать від каналу.

## Нотатки щодо доставлення

- Відповіді Telegram, що містять синтаксис markdown для зображень, як-от `![alt](url)`,
  перетворюються на медіавідповіді на фінальному вихідному шляху, коли це можливо.
- Багатокористувацькі DM у Slack маршрутизуються як групові чати, тому групова політика, поведінка
  згадок і правила групових сеансів застосовуються до розмов MPIM.
- Налаштування WhatsApp виконується на вимогу: онбординг може показати потік налаштування до
  встановлення пакета Plugin, а Gateway завантажує runtime WhatsApp
  лише тоді, коли канал фактично активний.

## Підтримувані канали

- [BlueBubbles](/uk/channels/bluebubbles) — **Рекомендовано для iMessage**; використовує REST API macOS-сервера BlueBubbles із повною підтримкою функцій (вбудований Plugin; редагування, скасування надсилання, ефекти, реакції, керування групами — редагування наразі не працює в macOS 26 Tahoe).
- [Discord](/uk/channels/discord) — Discord Bot API + Gateway; підтримує сервери, канали та DM.
- [Feishu](/uk/channels/feishu) — бот Feishu/Lark через WebSocket (вбудований Plugin).
- [Google Chat](/uk/channels/googlechat) — застосунок Google Chat API через HTTP Webhook.
- [iMessage (застаріле)](/uk/channels/imessage) — застаріла інтеграція macOS через imsg CLI (знецінено, для нових налаштувань використовуйте BlueBubbles).
- [IRC](/uk/channels/irc) — класичні IRC-сервери; канали + DM із керуванням сполученням/списком дозволених.
- [LINE](/uk/channels/line) — бот LINE Messaging API (вбудований Plugin).
- [Matrix](/uk/channels/matrix) — протокол Matrix (вбудований Plugin).
- [Mattermost](/uk/channels/mattermost) — Bot API + WebSocket; канали, групи, DM (вбудований Plugin).
- [Microsoft Teams](/uk/channels/msteams) — Bot Framework; корпоративна підтримка (вбудований Plugin).
- [Nextcloud Talk](/uk/channels/nextcloud-talk) — самостійно розгорнутий чат через Nextcloud Talk (вбудований Plugin).
- [Nostr](/uk/channels/nostr) — децентралізовані DM через NIP-04 (вбудований Plugin).
- [QQ Bot](/uk/channels/qqbot) — QQ Bot API; приватний чат, груповий чат і розширені медіа (вбудований Plugin).
- [Signal](/uk/channels/signal) — signal-cli; орієнтовано на приватність.
- [Slack](/uk/channels/slack) — Bolt SDK; застосунки робочого простору.
- [Synology Chat](/uk/channels/synology-chat) — Synology NAS Chat через вихідні+вхідні Webhook (вбудований Plugin).
- [Telegram](/uk/channels/telegram) — Bot API через grammY; підтримує групи.
- [Tlon](/uk/channels/tlon) — месенджер на основі Urbit (вбудований Plugin).
- [Twitch](/uk/channels/twitch) — чат Twitch через IRC-з'єднання (вбудований Plugin).
- [Голосовий виклик](/uk/plugins/voice-call) — телефонія через Plivo або Twilio (Plugin, встановлюється окремо).
- [WebChat](/uk/web/webchat) — інтерфейс WebChat Gateway через WebSocket.
- [WeChat](/uk/channels/wechat) — Plugin Tencent iLink Bot через QR-вхід; лише приватні чати (зовнішній Plugin).
- [WhatsApp](/uk/channels/whatsapp) — найпопулярніший; використовує Baileys і потребує QR-сполучення.
- [Yuanbao](/uk/channels/yuanbao) — бот Tencent Yuanbao (зовнішній Plugin).
- [Zalo](/uk/channels/zalo) — Zalo Bot API; популярний месенджер В'єтнаму (вбудований Plugin).
- [Zalo Personal](/uk/channels/zalouser) — особистий обліковий запис Zalo через QR-вхід (вбудований Plugin).

## Нотатки

- Канали можуть працювати одночасно; налаштуйте кілька, і OpenClaw маршрутизуватиме повідомлення для кожного чату.
- Найшвидше налаштування зазвичай має **Telegram** (простий токен бота). WhatsApp потребує QR-сполучення та
  зберігає більше стану на диску.
- Поведінка груп залежить від каналу; див. [Групи](/uk/channels/groups).
- Сполучення DM і списки дозволених застосовуються для безпеки; див. [Безпека](/uk/gateway/security).
- Усунення несправностей: [Усунення несправностей каналів](/uk/channels/troubleshooting).
- Постачальники моделей задокументовані окремо; див. [Постачальники моделей](/uk/providers/models).
