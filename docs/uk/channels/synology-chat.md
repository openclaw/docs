---
read_when:
    - Налаштування Synology Chat з OpenClaw
    - Налагодження маршрутизації Webhook Synology Chat
summary: Налаштування Webhook Synology Chat і конфігурація OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T04:47:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

Стан: bundled Plugin для каналу прямих повідомлень із використанням Synology Chat webhooks.
Plugin приймає вхідні повідомлення від Synology Chat outgoing webhooks і надсилає відповіді
через Synology Chat incoming webhook.

## Bundled plugin

Synology Chat постачається як bundled Plugin у поточних випусках OpenClaw, тому звичайні
пакетні збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення, яке не містить Synology Chat,
встановіть його вручну:

Встановлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що Plugin Synology Chat доступний.
   - Поточні пакетні випуски OpenClaw вже містять його.
   - У старіших/власних встановленнях його можна додати вручну з source checkout за допомогою наведеної вище команди.
   - `openclaw onboard` тепер показує Synology Chat у тому самому списку налаштування каналів, що й `openclaw channels add`.
   - Неінтерактивне налаштування: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. В інтеграціях Synology Chat:
   - Створіть incoming webhook і скопіюйте його URL.
   - Створіть outgoing webhook із вашим секретним токеном.
3. Спрямуйте URL outgoing webhook на ваш OpenClaw gateway:
   - `https://gateway-host/webhook/synology` за замовчуванням.
   - Або ваш власний `channels.synology-chat.webhookPath`.
4. Завершіть налаштування в OpenClaw.
   - З майстром: `openclaw onboard`
   - Напряму: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Перезапустіть gateway і надішліть DM боту Synology Chat.

Подробиці автентифікації webhook:

- OpenClaw приймає токен outgoing webhook з `body.token`, потім
  `?token=...`, потім із заголовків.
- Прийняті форми заголовків:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Порожні або відсутні токени завершуються закритою відмовою.

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

Для облікового запису за замовчуванням можна використовувати змінні середовища:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (розділені комами)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Значення конфігурації перевизначають змінні середовища.

`SYNOLOGY_CHAT_INCOMING_URL` не можна встановити з workspace `.env`; див. [Workspace `.env` files](/uk/gateway/security).

## Політика DM і контроль доступу

- `dmPolicy: "allowlist"` є рекомендованим значенням за замовчуванням.
- `allowedUserIds` приймає список (або рядок, розділений комами) ідентифікаторів користувачів Synology.
- У режимі `allowlist` порожній список `allowedUserIds` вважається помилковою конфігурацією, і маршрут webhook не запуститься (використовуйте `dmPolicy: "open"` з `allowedUserIds: ["*"]` для дозволу всім).
- `dmPolicy: "open"` дозволяє публічні DM лише коли `allowedUserIds` містить `"*"`; з обмежувальними записами спілкуватися можуть лише відповідні користувачі.
- `dmPolicy: "disabled"` блокує DM.
- Прив’язка отримувача відповіді за замовчуванням залишається на стабільному числовому `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` — це режим сумісності на випадок аварійного відновлення, який знову вмикає пошук за змінним іменем користувача/нікнеймом для доставлення відповідей.
- Схвалення pairing працюють із:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Вихідне доставлення

Використовуйте числові ідентифікатори користувачів Synology Chat як цілі.

Приклади:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

Надсилання медіа підтримується через доставлення файлів на основі URL.
Вихідні URL файлів мають використовувати `http` або `https`, а приватні чи інакше заблоковані мережеві цілі відхиляються до того, як OpenClaw переспрямує URL до NAS webhook.

## Кілька облікових записів

Кілька облікових записів Synology Chat підтримуються в `channels.synology-chat.accounts`.
Кожен обліковий запис може перевизначати токен, incoming URL, шлях webhook, політику DM і ліміти.
Сеанси прямих повідомлень ізольовані за обліковим записом і користувачем, тому той самий числовий `user_id`
у двох різних облікових записах Synology не має спільного стану transcript.
Надайте кожному ввімкненому обліковому запису окремий `webhookPath`. OpenClaw тепер відхиляє точні дублікати шляхів
і відмовляється запускати іменовані облікові записи, які лише успадковують спільний шлях webhook у конфігураціях із кількома обліковими записами.
Якщо вам навмисно потрібне застаріле успадкування для іменованого облікового запису, встановіть
`dangerouslyAllowInheritedWebhookPath: true` для цього облікового запису або в `channels.synology-chat`,
але точні дублікати шляхів усе одно відхиляються закритою відмовою. Надавайте перевагу явним шляхам для кожного облікового запису.

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

## Примітки з безпеки

- Тримайте `token` у секреті та ротируйте його в разі витоку.
- Залишайте `allowInsecureSsl: false`, якщо ви явно не довіряєте самопідписаному локальному сертифікату NAS.
- Вхідні запити webhook перевіряються за токеном і обмежуються за частотою для кожного відправника.
- Перевірки недійсних токенів використовують порівняння секретів зі сталим часом і завершуються закритою відмовою.
- Надавайте перевагу `dmPolicy: "allowlist"` для production.
- Тримайте `dangerouslyAllowNameMatching` вимкненим, якщо вам явно не потрібне застаріле доставлення відповідей на основі імен користувачів.
- Тримайте `dangerouslyAllowInheritedWebhookPath` вимкненим, якщо ви явно не приймаєте ризик маршрутизації через спільний шлях у конфігурації з кількома обліковими записами.

## Усунення несправностей

- `Missing required fields (token, user_id, text)`:
  - у payload outgoing webhook відсутнє одне з обов’язкових полів
  - якщо Synology надсилає токен у заголовках, переконайтеся, що gateway/proxy зберігає ці заголовки
- `Invalid token`:
  - секрет outgoing webhook не збігається з `channels.synology-chat.token`
  - запит потрапляє до неправильного облікового запису/шляху webhook
  - reverse proxy видалив заголовок токена до того, як запит дістався OpenClaw
- `Rate limit exceeded`:
  - забагато спроб із недійсним токеном з одного джерела можуть тимчасово заблокувати це джерело
  - автентифіковані відправники також мають окремий ліміт повідомлень на користувача
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` увімкнено, але користувачів не налаштовано
- `User not authorized`:
  - числовий `user_id` відправника відсутній у `allowedUserIds`

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
