---
read_when:
    - Ви хочете вибрати канал чату для OpenClaw
    - Вам потрібен короткий огляд підтримуваних платформ обміну повідомленнями
summary: Платформи обміну повідомленнями, до яких може підключатися OpenClaw
title: Канали чату
x-i18n:
    generated_at: "2026-04-28T11:04:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw може спілкуватися з вами в будь-якому чат-додатку, яким ви вже користуєтеся. Кожен канал підключається через Gateway.
Текст підтримується всюди; медіа й реакції залежать від каналу.

## Примітки щодо доставки

- Відповіді Telegram, що містять синтаксис зображень Markdown, як-от `![alt](url)`,
  за можливості перетворюються на медіавідповіді на фінальному вихідному шляху.
- Багатокористувацькі DM у Slack маршрутизуються як групові чати, тому до розмов MPIM застосовуються групова політика, поведінка згадок і правила групових сесій.
- Налаштування WhatsApp відбувається на вимогу: онбординг може показати потік налаштування до того, як runtime-залежності Baileys буде підготовлено, а Gateway завантажує runtime WhatsApp лише тоді, коли канал фактично активний.

## Підтримувані канали

- [BlueBubbles](/uk/channels/bluebubbles) — **Рекомендовано для iMessage**; використовує REST API macOS-сервера BlueBubbles із повною підтримкою функцій (вбудований Plugin; редагування, скасування надсилання, ефекти, реакції, керування групами — редагування наразі не працює в macOS 26 Tahoe).
- [Discord](/uk/channels/discord) — Discord Bot API + Gateway; підтримує сервери, канали та DM.
- [Feishu](/uk/channels/feishu) — бот Feishu/Lark через WebSocket (вбудований Plugin).
- [Google Chat](/uk/channels/googlechat) — застосунок Google Chat API через HTTP Webhook.
- [iMessage (legacy)](/uk/channels/imessage) — застаріла інтеграція macOS через imsg CLI (застаріло, для нових налаштувань використовуйте BlueBubbles).
- [IRC](/uk/channels/irc) — класичні сервери IRC; канали + DM із керуванням сполученням і allowlist.
- [LINE](/uk/channels/line) — бот LINE Messaging API (вбудований Plugin).
- [Matrix](/uk/channels/matrix) — протокол Matrix (вбудований Plugin).
- [Mattermost](/uk/channels/mattermost) — Bot API + WebSocket; канали, групи, DM (вбудований Plugin).
- [Microsoft Teams](/uk/channels/msteams) — Bot Framework; корпоративна підтримка (вбудований Plugin).
- [Nextcloud Talk](/uk/channels/nextcloud-talk) — самостійно розміщений чат через Nextcloud Talk (вбудований Plugin).
- [Nostr](/uk/channels/nostr) — децентралізовані DM через NIP-04 (вбудований Plugin).
- [QQ Bot](/uk/channels/qqbot) — QQ Bot API; приватний чат, груповий чат і мультимедіа з розширеними можливостями (вбудований Plugin).
- [Signal](/uk/channels/signal) — signal-cli; орієнтовано на приватність.
- [Slack](/uk/channels/slack) — Bolt SDK; застосунки робочого простору.
- [Synology Chat](/uk/channels/synology-chat) — Synology NAS Chat через вихідні+вхідні Webhook-и (вбудований Plugin).
- [Telegram](/uk/channels/telegram) — Bot API через grammY; підтримує групи.
- [Tlon](/uk/channels/tlon) — месенджер на базі Urbit (вбудований Plugin).
- [Twitch](/uk/channels/twitch) — чат Twitch через IRC-з'єднання (вбудований Plugin).
- [Voice Call](/uk/plugins/voice-call) — телефонія через Plivo або Twilio (Plugin, встановлюється окремо).
- [WebChat](/uk/web/webchat) — інтерфейс Gateway WebChat через WebSocket.
- [WeChat](/uk/channels/wechat) — Tencent iLink Bot Plugin через QR-вхід; лише приватні чати (зовнішній Plugin).
- [WhatsApp](/uk/channels/whatsapp) — найпопулярніший; використовує Baileys і потребує QR-сполучення.
- [Yuanbao](/uk/channels/yuanbao) — бот Tencent Yuanbao (зовнішній Plugin).
- [Zalo](/uk/channels/zalo) — Zalo Bot API; популярний месенджер В'єтнаму (вбудований Plugin).
- [Zalo Personal](/uk/channels/zalouser) — особистий обліковий запис Zalo через QR-вхід (вбудований Plugin).

## Примітки

- Канали можуть працювати одночасно; налаштуйте кілька, і OpenClaw маршрутизуватиме за чатом.
- Найшвидше налаштування зазвичай має **Telegram** (простий токен бота). WhatsApp потребує QR-сполучення та
  зберігає більше стану на диску.
- Поведінка груп залежить від каналу; див. [Групи](/uk/channels/groups).
- Сполучення DM і allowlist застосовуються для безпеки; див. [Безпека](/uk/gateway/security).
- Усунення несправностей: [Усунення несправностей каналів](/uk/channels/troubleshooting).
- Провайдери моделей документовані окремо; див. [Провайдери моделей](/uk/providers/models).
