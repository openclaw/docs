---
read_when:
    - Налаштування Synology Chat з OpenClaw
    - Налагодження маршрутизації Webhook Synology Chat
summary: Налаштування Webhook Synology Chat і конфігурація OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-21T18:02:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7288e2aa873ee1a1f57861d839cfb44ff324e3d40a7f36da07c6ba43cbe1e6e6
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Статус: вбудований plugin каналу прямих повідомлень, що використовує Webhook Synology Chat.
Plugin приймає вхідні повідомлення з вихідних Webhook Synology Chat і надсилає відповіді
через вхідний Webhook Synology Chat.

## Вбудований plugin

Synology Chat постачається як вбудований plugin у поточних релізах OpenClaw, тому звичайні
пакетні збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення без Synology Chat,
встановіть його вручну:

Встановлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що plugin Synology Chat доступний.
   - Поточні пакетні релізи OpenClaw вже містять його вбудованим.
   - У старіших/власних встановленнях його можна додати вручну з checkout вихідного коду командою вище.
   - `openclaw onboard` тепер показує Synology Chat у тому самому списку налаштування каналів, що й `openclaw channels add`.
   - Неінтерактивне налаштування: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. В інтеграціях Synology Chat:
   - Створіть вхідний Webhook і скопіюйте його URL.
   - Створіть вихідний Webhook зі своїм секретним token.
3. Спрямуйте URL вихідного Webhook на ваш Gateway OpenClaw:
   - `https://gateway-host/webhook/synology` за замовчуванням.
   - Або ваш власний `channels.synology-chat.webhookPath`.
4. Завершіть налаштування в OpenClaw.
   - Покроково: `openclaw onboard`
   - Напряму: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Перезапустіть Gateway і надішліть DM боту Synology Chat.

Деталі автентифікації Webhook:

- OpenClaw приймає token вихідного Webhook з `body.token`, потім
  `?token=...`, потім із заголовків.
- Підтримувані форми заголовків:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Порожні або відсутні token блокуються за замовчуванням.

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
- `SYNOLOGY_ALLOWED_USER_IDS` (через кому)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Значення конфігурації мають пріоритет над змінними середовища.

## Політика DM і контроль доступу

- `dmPolicy: "allowlist"` — рекомендоване значення за замовчуванням.
- `allowedUserIds` приймає список (або рядок із розділенням комами) ID користувачів Synology.
- У режимі `allowlist` порожній список `allowedUserIds` вважається помилкою конфігурації, і маршрут Webhook не буде запущено (використовуйте `dmPolicy: "open"` для дозволу всім).
- `dmPolicy: "open"` дозволяє будь-якого відправника.
- `dmPolicy: "disabled"` блокує DM.
- Прив’язка отримувача відповіді за замовчуванням зберігається до стабільного числового `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який знову вмикає пошук за змінюваними username/nickname для доставки відповідей.
- Підтвердження pairing працює з:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Вихідна доставка

Використовуйте числові ID користувачів Synology Chat як цілі.

Приклади:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Надсилання медіа підтримується через доставку файлів за URL.
Вихідні URL файлів мають використовувати `http` або `https`, а приватні чи іншим чином заблоковані мережеві цілі відхиляються ще до того, як OpenClaw передасть URL до Webhook NAS.

## Кілька облікових записів

Кілька облікових записів Synology Chat підтримуються в `channels.synology-chat.accounts`.
Кожен обліковий запис може перевизначати token, вхідний URL, шлях Webhook, політику DM та ліміти.
Сеанси прямих повідомлень ізольовані для кожного облікового запису й користувача, тому той самий числовий `user_id`
у двох різних облікових записах Synology не використовує спільний стан транскрипту.
Для кожного ввімкненого облікового запису задайте окремий `webhookPath`. OpenClaw тепер відхиляє дубльовані точні шляхи
і відмовляється запускати іменовані облікові записи, які лише успадковують спільний шлях Webhook у конфігураціях з кількома обліковими записами.
Якщо вам навмисно потрібне застаріле успадкування для іменованого облікового запису, задайте
`dangerouslyAllowInheritedWebhookPath: true` для цього облікового запису або в `channels.synology-chat`,
але дубльовані точні шляхи все одно відхиляються з блокуванням за замовчуванням. Надавайте перевагу явним шляхам для кожного облікового запису.

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

## Примітки щодо безпеки

- Тримайте `token` у таємниці та змініть його, якщо він витік.
- Залишайте `allowInsecureSsl: false`, якщо тільки ви явно не довіряєте локальному самопідписаному сертифікату NAS.
- Вхідні запити Webhook перевіряються за token і обмежуються за частотою для кожного відправника.
- Перевірки недійсних token використовують порівняння секретів із постійним часом виконання та блокуються за замовчуванням.
- Для production надавайте перевагу `dmPolicy: "allowlist"`.
- Не вмикайте `dangerouslyAllowNameMatching`, якщо вам явно не потрібна застаріла доставка відповідей на основі username.
- Не вмикайте `dangerouslyAllowInheritedWebhookPath`, якщо тільки ви явно не приймаєте ризик маршрутизації спільного шляху в конфігурації з кількома обліковими записами.

## Усунення несправностей

- `Missing required fields (token, user_id, text)`:
  - у payload вихідного Webhook відсутнє одне з обов’язкових полів
  - якщо Synology надсилає token у заголовках, переконайтеся, що Gateway/proxy зберігає ці заголовки
- `Invalid token`:
  - секрет вихідного Webhook не збігається з `channels.synology-chat.token`
  - запит надходить не до того облікового запису/шляху Webhook
  - reverse proxy видалив заголовок token до того, як запит досяг OpenClaw
- `Rate limit exceeded`:
  - занадто багато спроб із недійсним token з одного джерела можуть тимчасово заблокувати це джерело
  - для автентифікованих відправників також діє окреме обмеження частоти повідомлень для кожного користувача
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - увімкнено `dmPolicy="allowlist"`, але не налаштовано жодного користувача
- `User not authorized`:
  - числовий `user_id` відправника відсутній у `allowedUserIds`

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та фільтрація згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
