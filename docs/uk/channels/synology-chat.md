---
read_when:
    - Налаштування Synology Chat з OpenClaw
    - Налагодження маршрутизації Webhook Synology Chat
summary: Налаштування Webhook Synology Chat і конфігурація OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T20:44:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

Стан: вбудований Plugin каналу приватних повідомлень, що використовує Webhook-и Synology Chat.
Plugin приймає вхідні повідомлення з вихідних Webhook-ів Synology Chat і надсилає відповіді
через вхідний Webhook Synology Chat.

## Вбудований Plugin

Synology Chat постачається як вбудований Plugin у поточних релізах OpenClaw, тому звичайні
пакетовані збірки не потребують окремого встановлення.

Якщо у вас старіша збірка або кастомне встановлення без Synology Chat,
встановіть його вручну:

Встановлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Докладніше: [Plugin-и](/uk/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що Plugin Synology Chat доступний.
   - У поточних пакетованих релізах OpenClaw він уже вбудований.
   - У старіших/кастомних встановленнях його можна додати вручну з source checkout командою вище.
   - `openclaw onboard` тепер показує Synology Chat у тому самому списку налаштування каналів, що й `openclaw channels add`.
   - Неінтерактивне налаштування: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. В інтеграціях Synology Chat:
   - Створіть вхідний Webhook і скопіюйте його URL.
   - Створіть вихідний Webhook зі своїм секретним токеном.
3. Спрямуйте URL вихідного Webhook до вашого Gateway OpenClaw:
   - `https://gateway-host/webhook/synology` типово.
   - Або ваш кастомний `channels.synology-chat.webhookPath`.
4. Завершіть налаштування в OpenClaw.
   - Покроково: `openclaw onboard`
   - Напряму: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Перезапустіть Gateway і надішліть DM боту Synology Chat.

Деталі автентифікації Webhook:

- OpenClaw приймає токен вихідного Webhook спочатку з `body.token`, потім
  з `?token=...`, а потім із заголовків.
- Прийняті форми заголовків:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Порожні або відсутні токени закривають доступ за замовчуванням.

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

Для типового акаунта можна використовувати env-змінні:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (через кому)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Значення конфігурації мають пріоритет над env-змінними.

`SYNOLOGY_CHAT_INCOMING_URL` не можна задавати з workspace `.env`; див. [Файли workspace `.env`](/uk/gateway/security).

## Політика DM і керування доступом

- `dmPolicy: "allowlist"` — рекомендоване типове значення.
- `allowedUserIds` приймає список (або рядок, розділений комами) Synology user ID.
- У режимі `allowlist` порожній список `allowedUserIds` вважається неправильною конфігурацією, і маршрут Webhook не буде запущено (використовуйте `dmPolicy: "open"` для дозволу всім).
- `dmPolicy: "open"` дозволяє будь-якого відправника.
- `dmPolicy: "disabled"` блокує DM.
- Прив’язка отримувача відповіді типово залишається на стабільному числовому `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який знову вмикає пошук за змінними username/nickname для доставки відповідей.
- Схвалення pairing працює з:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Вихідна доставка

Використовуйте числові Synology Chat user ID як цілі.

Приклади:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Надсилання медіа підтримується через доставку файлів за URL.
URL вихідних файлів мають використовувати `http` або `https`, а приватні чи іншим чином заблоковані мережеві цілі відхиляються до того, як OpenClaw передасть URL до Webhook NAS.

## Кілька акаунтів

Підтримується кілька акаунтів Synology Chat у `channels.synology-chat.accounts`.
Кожен акаунт може перевизначати токен, вхідний URL, шлях Webhook, політику DM і ліміти.
Сесії приватних повідомлень ізольовані для кожного акаунта та користувача, тому той самий числовий `user_id`
на двох різних акаунтах Synology не ділить спільний стан транскрипту.
Надайте кожному ввімкненому акаунту окремий `webhookPath`. OpenClaw тепер відхиляє дубльовані точні шляхи
і відмовляється запускати іменовані акаунти, які лише успадковують спільний шлях Webhook у конфігураціях із кількома акаунтами.
Якщо вам навмисно потрібне застаріле успадкування для іменованого акаунта, задайте
`dangerouslyAllowInheritedWebhookPath: true` для цього акаунта або в `channels.synology-chat`,
але дубльовані точні шляхи все одно відхиляються із закриттям доступу за замовчуванням. Надавайте перевагу явним шляхам для кожного акаунта.

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

- Тримайте `token` у секреті та змінюйте його, якщо він витік.
- Залишайте `allowInsecureSsl: false`, якщо тільки ви явно не довіряєте самопідписаному локальному сертифікату NAS.
- Вхідні запити Webhook перевіряються за токеном і обмежуються за частотою для кожного відправника.
- Перевірки некоректного токена використовують порівняння секретів за сталий час і закривають доступ за замовчуванням.
- Для production надавайте перевагу `dmPolicy: "allowlist"`.
- Тримайте `dangerouslyAllowNameMatching` вимкненим, якщо тільки вам явно не потрібна застаріла доставка відповідей за username.
- Тримайте `dangerouslyAllowInheritedWebhookPath` вимкненим, якщо тільки ви явно не приймаєте ризик маршрутизації зі спільним шляхом у конфігурації з кількома акаунтами.

## Усунення несправностей

- `Missing required fields (token, user_id, text)`:
  - у payload вихідного Webhook відсутнє одне з обов’язкових полів
  - якщо Synology надсилає токен у заголовках, переконайтеся, що gateway/проксі зберігає ці заголовки
- `Invalid token`:
  - секрет вихідного Webhook не збігається з `channels.synology-chat.token`
  - запит потрапляє не в той акаунт/шлях Webhook
  - reverse proxy прибрав заголовок токена до того, як запит дійшов до OpenClaw
- `Rate limit exceeded`:
  - забагато спроб із некоректним токеном з одного джерела можуть тимчасово заблокувати це джерело
  - для автентифікованих відправників також діє окремий ліміт частоти повідомлень для кожного користувача
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - увімкнено `dmPolicy="allowlist"`, але жодного користувача не налаштовано
- `User not authorized`:
  - числовий `user_id` відправника відсутній у `allowedUserIds`

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та шлюзування за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення безпеки
