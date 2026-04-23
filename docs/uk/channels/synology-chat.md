---
read_when:
    - Налаштування Synology Chat з OpenClaw
    - Налагодження маршрутизації Webhook Synology Chat
summary: Налаштування Webhook Synology Chat і конфігурація OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T07:25:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Статус: bundled Plugin каналу прямих повідомлень, що використовує Webhook Synology Chat.
Plugin приймає вхідні повідомлення з вихідних Webhook Synology Chat і надсилає відповіді
через вхідний Webhook Synology Chat.

## Bundled Plugin

Synology Chat постачається як bundled Plugin у поточних випусках OpenClaw, тому звичайні
паковані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення без Synology Chat,
встановіть його вручну:

Встановлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Деталі: [Plugins](/uk/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що Plugin Synology Chat доступний.
   - Поточні паковані випуски OpenClaw вже містять його.
   - У старіших/власних встановленнях його можна додати вручну з checkout вихідного коду за допомогою наведеної вище команди.
   - `openclaw onboard` тепер показує Synology Chat у тому самому списку налаштування каналів, що й `openclaw channels add`.
   - Неінтерактивне налаштування: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. В інтеграціях Synology Chat:
   - Створіть вхідний Webhook і скопіюйте його URL.
   - Створіть вихідний Webhook із вашим секретним токеном.
3. Спрямуйте URL вихідного Webhook на ваш Gateway OpenClaw:
   - `https://gateway-host/webhook/synology` за замовчуванням.
   - Або ваш власний `channels.synology-chat.webhookPath`.
4. Завершіть налаштування в OpenClaw.
   - Покроково: `openclaw onboard`
   - Напряму: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Перезапустіть Gateway і надішліть DM боту Synology Chat.

Деталі автентифікації Webhook:

- OpenClaw приймає токен вихідного Webhook з `body.token`, потім
  `?token=...`, а потім із заголовків.
- Прийнятні форми заголовків:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Порожні або відсутні токени призводять до закритої відмови.

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

`SYNOLOGY_CHAT_INCOMING_URL` не можна встановити з `.env` робочого простору; див. [Файли `.env` робочого простору](/uk/gateway/security).

## Політика DM і контроль доступу

- `dmPolicy: "allowlist"` — рекомендоване значення за замовчуванням.
- `allowedUserIds` приймає список (або рядок, розділений комами) ідентифікаторів користувачів Synology.
- У режимі `allowlist` порожній список `allowedUserIds` вважається помилкою конфігурації, і маршрут Webhook не буде запущено (для дозволу всім використовуйте `dmPolicy: "open"`).
- `dmPolicy: "open"` дозволяє будь-якого відправника.
- `dmPolicy: "disabled"` блокує DM.
- Прив’язка отримувача відповіді за замовчуванням зберігається за стабільним числовим `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який знову вмикає пошук за змінним ім’ям користувача/псевдонімом для доставки відповідей.
- Підтвердження pairing працює з:
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
URL вихідних файлів мають використовувати `http` або `https`, а приватні чи іншим чином заблоковані мережеві адреси відхиляються до того, як OpenClaw передасть URL до Webhook NAS.

## Кілька облікових записів

Кілька облікових записів Synology Chat підтримуються в `channels.synology-chat.accounts`.
Кожен обліковий запис може перевизначати token, incoming URL, webhook path, політику DM і ліміти.
Сеанси прямих повідомлень ізольовані для кожного облікового запису та користувача, тому той самий числовий `user_id`
у двох різних облікових записах Synology не має спільного стану транскрипту.
Призначте кожному увімкненому обліковому запису окремий `webhookPath`. OpenClaw тепер відхиляє дубльовані точні шляхи
і відмовляється запускати іменовані облікові записи, які лише успадковують спільний webhook path у конфігураціях з кількома обліковими записами.
Якщо вам навмисно потрібне застаріле успадкування для іменованого облікового запису, встановіть
`dangerouslyAllowInheritedWebhookPath: true` у цьому обліковому записі або в `channels.synology-chat`,
але дубльовані точні шляхи все одно відхиляються із закритою відмовою. Надавайте перевагу явним шляхам для кожного облікового запису.

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

- Зберігайте `token` у таємниці та замініть його, якщо він витік.
- Залишайте `allowInsecureSsl: false`, якщо тільки ви явно не довіряєте локальному самопідписаному сертифікату NAS.
- Вхідні запити Webhook перевіряються за токеном і обмежуються за частотою для кожного відправника.
- Перевірки недійсного токена використовують порівняння секретів у сталий час і завершуються закритою відмовою.
- Для production надавайте перевагу `dmPolicy: "allowlist"`.
- Не вмикайте `dangerouslyAllowNameMatching`, якщо тільки вам явно не потрібна застаріла доставка відповідей на основі імен користувачів.
- Не вмикайте `dangerouslyAllowInheritedWebhookPath`, якщо тільки ви явно не приймаєте ризик маршрутизації через спільний шлях у конфігурації з кількома обліковими записами.

## Усунення несправностей

- `Missing required fields (token, user_id, text)`:
  - у payload вихідного Webhook відсутнє одне з обов’язкових полів
  - якщо Synology надсилає токен у заголовках, переконайтеся, що Gateway/проксі зберігає ці заголовки
- `Invalid token`:
  - секрет вихідного Webhook не збігається з `channels.synology-chat.token`
  - запит надходить до неправильного облікового запису/шляху Webhook
  - зворотний проксі видалив заголовок токена до того, як запит досяг OpenClaw
- `Rate limit exceeded`:
  - надто багато спроб із недійсним токеном з одного джерела можуть тимчасово заблокувати це джерело
  - для автентифікованих відправників також діє окреме обмеження частоти повідомлень для кожного користувача
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - увімкнено `dmPolicy="allowlist"`, але не налаштовано жодного користувача
- `User not authorized`:
  - числовий `user_id` відправника відсутній у `allowedUserIds`

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Групи](/uk/channels/groups) — поведінка групових чатів і фільтрація згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення захисту
