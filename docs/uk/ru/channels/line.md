---
read_when:
    - Ви хочете підключити OpenClaw до LINE
    - Вам потрібно налаштувати Webhook LINE і облікові дані
    - Вам потрібні параметри повідомлень, специфічні для LINE
summary: Налаштування, конфігурація та використання Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE підключається до OpenClaw через LINE Messaging API. Plugin працює як приймач Webhook
на Gateway і використовує ваш маркер доступу каналу + секрет каналу для
автентифікації.

Статус: завантажуваний Plugin. Підтримуються особисті повідомлення, групові чати, медіа, місцезнаходження, Flex
messages, template messages і швидкі відповіді. Реакції та треди
не підтримуються.

## Встановлення

Установіть LINE перед налаштуванням каналу:

```bash
openclaw plugins install @openclaw/line
```

Локальна робоча копія (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Налаштування

1. Створіть обліковий запис LINE Developers і відкрийте Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Створіть (або виберіть) Provider і додайте канал **Messaging API**.
3. Скопіюйте **маркер доступу каналу** і **секрет каналу** з налаштувань каналу.
4. Увімкніть **Використовувати Webhook** у налаштуваннях Messaging API.
5. Задайте URL Webhook для вашої кінцевої точки Gateway (потрібен HTTPS):

```
https://gateway-host/line/webhook
```

Gateway відповідає на перевірку Webhook від LINE (GET) і підтверджує підписані
вхідні події (POST) одразу після перевірки підпису й корисного навантаження; обробка
агентом триває асинхронно.
Якщо потрібен користувацький шлях, задайте `channels.line.webhookPath` або
`channels.line.accounts.<id>.webhookPath` і відповідно оновіть URL.

Примітка щодо безпеки:

- Перевірка підпису LINE залежить від тіла запиту (HMAC за необробленим тілом), тому OpenClaw застосовує суворі обмеження розміру тіла й тайм-аут до автентифікації перед перевіркою.
- OpenClaw обробляє події Webhook із перевірених необроблених байтів запиту. Значення `req.body`, перетворені проміжним ПЗ вище за ланцюжком, ігноруються для збереження цілісності підпису.

## Конфігурація

Мінімальна конфігурація:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Конфігурація відкритих особистих повідомлень:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Змінні середовища (лише обліковий запис за замовчуванням):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Файли маркера/секрету:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` і `secretFile` мають указувати на звичайні файли. Символічні посилання відхиляються.

Кілька облікових записів:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Керування доступом

Особисті повідомлення за замовчуванням потребують спряження. Невідомі відправники отримують код спряження, а їхні
повідомлення ігноруються до схвалення.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Списки дозволів і політики:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: дозволені ID користувачів LINE для особистих повідомлень; `dmPolicy: "open"` вимагає `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: дозволені ID користувачів LINE для груп
- Перевизначення для окремих груп: `channels.line.groups.<groupId>.allowFrom`
- Статичні групи доступу відправників можна посилально вказувати з `allowFrom`, `groupAllowFrom` і групового `allowFrom` через `accessGroup:<name>`.
- Примітка щодо runtime: якщо `channels.line` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

ID LINE чутливі до регістру. Допустимі ID мають такий вигляд:

- Користувач: `U` + 32 шістнадцяткові символи
- Група: `C` + 32 шістнадцяткові символи
- Кімната: `R` + 32 шістнадцяткові символи

## Поведінка повідомлень

- Текст розбивається на фрагменти по 5000 символів.
- Форматування Markdown видаляється; блоки коду й таблиці за можливості перетворюються на Flex
  cards.
- Потокові відповіді буферизуються; LINE отримує повні фрагменти з анімацією завантаження,
  доки агент працює.
- Завантаження медіа обмежене `channels.line.mediaMaxMb` (за замовчуванням 10).
- Вхідні медіа зберігаються в `~/.openclaw/media/inbound/` перед передаванням
  агенту, що відповідає спільному сховищу медіа, яке використовують інші вбудовані Plugin
  каналів.

## Дані каналу (розширені повідомлення)

Використовуйте `channelData.line` для надсилання швидких відповідей, місцезнаходжень, Flex cards або template
messages.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE також постачається з командою `/card` для пресетів Flex messages:

```
/card info "Welcome" "Thanks for joining!"
```

## Підтримка ACP

LINE підтримує прив’язки бесід ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` прив’язує поточний чат LINE до сесії ACP без створення дочірнього треду.
- Налаштовані прив’язки ACP і активні сесії ACP, прив’язані до бесіди, працюють у LINE так само, як і в інших каналах бесід.

Див. [агенти ACP](/uk/tools/acp-agents) для подробиць.

## Вихідні медіа

Plugin LINE підтримує надсилання зображень, відео й аудіофайлів через інструмент повідомлень агента. Медіа надсилаються через специфічний для LINE шлях доставки з відповідною обробкою попереднього перегляду та відстеження:

- **Зображення**: надсилаються як повідомлення із зображеннями LINE з автоматичною генерацією попереднього перегляду.
- **Відео**: надсилаються з явною обробкою попереднього перегляду й типу вмісту.
- **Аудіо**: надсилається як аудіоповідомлення LINE.

URL вихідних медіа мають бути публічними HTTPS URL. OpenClaw перевіряє цільове ім’я хоста перед передаванням URL у LINE і відхиляє local loopback, link-local і цілі в приватних мережах.

Загальні надсилання медіа повертаються до наявного маршруту лише для зображень, коли специфічний для LINE шлях недоступний.

## Усунення несправностей

- **Перевірка webhook не проходить:** переконайтеся, що URL webhook використовує HTTPS і
  `channelSecret` збігається з LINE console.
- **Немає вхідних подій:** підтвердьте, що шлях webhook збігається з `channels.line.webhookPath`
  і що gateway доступний із LINE.
- **Помилки завантаження медіа:** збільште `channels.line.mediaMaxMb`, якщо медіа перевищує
  ліміт за замовчуванням.

## Див. також

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Спряження](/uk/channels/pairing) — автентифікація особистих повідомлень і потік спряження
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу й посилення захисту
