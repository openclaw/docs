---
read_when:
    - Налаштування Synology Chat з OpenClaw
    - Налагодження маршрутизації Webhook Synology Chat
summary: Налаштування Webhook Synology Chat і конфігурація OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-29T05:57:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

Стан: вбудований Plugin каналу прямих повідомлень, що використовує webhooks Synology Chat.
Plugin приймає вхідні повідомлення від вихідних webhooks Synology Chat і надсилає відповіді
через вхідний webhook Synology Chat.

## Вбудований Plugin

Synology Chat постачається як вбудований Plugin у поточних випусках OpenClaw, тому звичайні
пакетні збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або кастомне встановлення, яке виключає Synology Chat,
встановіть його вручну:

Встановлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що Plugin Synology Chat доступний.
   - Поточні пакетні випуски OpenClaw вже включають його.
   - Старіші/кастомні встановлення можуть додати його вручну з checkout вихідного коду за допомогою команди вище.
   - `openclaw onboard` тепер показує Synology Chat у тому самому списку налаштування каналів, що й `openclaw channels add`.
   - Неінтерактивне налаштування: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. В інтеграціях Synology Chat:
   - Створіть вхідний webhook і скопіюйте його URL.
   - Створіть вихідний webhook із вашим секретним токеном.
3. Спрямуйте URL вихідного webhook до вашого OpenClaw gateway:
   - `https://gateway-host/webhook/synology` за замовчуванням.
   - Або ваш кастомний `channels.synology-chat.webhookPath`.
4. Завершіть налаштування в OpenClaw.
   - Інтерактивно: `openclaw onboard`
   - Напряму: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Перезапустіть gateway і надішліть DM боту Synology Chat.

Деталі автентифікації webhook:

- OpenClaw приймає токен вихідного webhook з `body.token`, потім
  `?token=...`, потім із заголовків.
- Прийнятні форми заголовків:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Порожні або відсутні токени закривають доступ.

Мінімальна конфігурація:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Змінні середовища

Для типового облікового запису можна використовувати змінні середовища:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (через кому)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Значення конфігурації перевизначають змінні середовища.

`SYNOLOGY_CHAT_INCOMING_URL` не можна встановити з workspace `.env`; див. [Файли workspace `.env`](/uk/gateway/security).

## Політика DM і контроль доступу

- `dmPolicy: "allowlist"` є рекомендованим типовим значенням.
- `allowedUserIds` приймає список (або рядок, розділений комами) ідентифікаторів користувачів Synology.
- У режимі `allowlist` порожній список `allowedUserIds` вважається помилковою конфігурацією, і маршрут webhook не запуститься (використовуйте `dmPolicy: "open"` з `allowedUserIds: ["*"]` для дозволу всім).
- `dmPolicy: "open"` дозволяє публічні DM лише коли `allowedUserIds` містить `"*"`; з обмежувальними записами спілкуватися можуть лише відповідні користувачі.
- `dmPolicy: "disabled"` блокує DM.
- Прив’язка одержувача відповіді за замовчуванням лишається на стабільному числовому `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` — це режим сумісності на крайній випадок, який повторно вмикає пошук за змінюваним username/nickname для доставки відповідей.
- Схвалення сполучення працюють із:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Вихідна доставка

Використовуйте числові ідентифікатори користувачів Synology Chat як цілі.

Приклади:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Надсилання медіа підтримується через доставку файлів за URL.
Вихідні URL файлів мають використовувати `http` або `https`, а приватні або інакше заблоковані мережеві цілі відхиляються до того, як OpenClaw передасть URL до webhook NAS.

## Кілька облікових записів

Кілька облікових записів Synology Chat підтримуються в `channels.synology-chat.accounts`.
Кожен обліковий запис може перевизначати токен, вхідний URL, шлях webhook, політику DM і ліміти.
Сесії прямих повідомлень ізольовані за обліковим записом і користувачем, тому той самий числовий `user_id`
у двох різних облікових записах Synology не спільно використовує стан transcript.
Надайте кожному ввімкненому обліковому запису окремий `webhookPath`. OpenClaw тепер відхиляє дублікати точних шляхів
і відмовляється запускати іменовані облікові записи, які лише успадковують спільний шлях webhook у налаштуваннях із кількома обліковими записами.
Якщо вам навмисно потрібне застаріле успадкування для іменованого облікового запису, встановіть
`dangerouslyAllowInheritedWebhookPath: true` для цього облікового запису або в `channels.synology-chat`,
але дублікати точних шляхів усе одно відхиляються із закриттям доступу. Надавайте перевагу явним шляхам для кожного облікового запису.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Нотатки щодо безпеки

- Зберігайте `token` у секреті та ротуйте його в разі витоку.
- Залишайте `allowInsecureSsl: false`, якщо ви явно не довіряєте самопідписаному локальному сертифікату NAS.
- Вхідні запити webhook перевіряються за токеном і обмежуються за частотою для кожного відправника.
- Перевірки недійсного токена використовують порівняння секретів зі сталим часом виконання та закривають доступ.
- Для production надавайте перевагу `dmPolicy: "allowlist"`.
- Тримайте `dangerouslyAllowNameMatching` вимкненим, якщо вам явно не потрібна застаріла доставка відповідей на основі username.
- Тримайте `dangerouslyAllowInheritedWebhookPath` вимкненим, якщо ви явно не приймаєте ризик маршрутизації через спільний шлях у налаштуванні з кількома обліковими записами.

## Усунення несправностей

- `Missing required fields (token, user_id, text)`:
  - у payload вихідного webhook бракує одного з обов’язкових полів
  - якщо Synology надсилає токен у заголовках, переконайтеся, що gateway/proxy зберігає ці заголовки
- `Invalid token`:
  - секрет вихідного webhook не відповідає `channels.synology-chat.token`
  - запит потрапляє в неправильний обліковий запис/шлях webhook
  - reverse proxy видалив заголовок токена до того, як запит досяг OpenClaw
- `Rate limit exceeded`:
  - забагато спроб із недійсним токеном з одного джерела можуть тимчасово заблокувати це джерело
  - автентифіковані відправники також мають окремий ліміт повідомлень для кожного користувача
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` увімкнено, але користувачів не налаштовано
- `User not authorized`:
  - числовий `user_id` відправника не входить до `allowedUserIds`

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та gating згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення безпеки
