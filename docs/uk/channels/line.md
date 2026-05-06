---
read_when:
    - Ви хочете підключити OpenClaw до LINE
    - Потрібно налаштувати Webhook LINE і облікові дані
    - Вам потрібні параметри повідомлень, специфічні для LINE
summary: Налаштування, конфігурація та використання Plugin для LINE Messaging API
title: РЯДОК
x-i18n:
    generated_at: "2026-05-06T06:59:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

LINE підключається до OpenClaw через LINE Messaging API. Plugin працює як отримувач Webhook
на Gateway і використовує ваш маркер доступу каналу + секрет каналу для
автентифікації.

Статус: Plugin, доступний для завантаження. Підтримуються прямі повідомлення, групові чати, медіа, локації, Flex
messages, template messages і quick replies. Реакції та гілки
не підтримуються.

## Встановлення

Установіть LINE перед налаштуванням каналу:

```bash
openclaw plugins install @openclaw/line
```

Локальна копія (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Налаштування

1. Створіть обліковий запис LINE Developers і відкрийте Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Створіть (або виберіть) Provider і додайте канал **Messaging API**.
3. Скопіюйте **Channel access token** і **Channel secret** з налаштувань каналу.
4. Увімкніть **Use webhook** у налаштуваннях Messaging API.
5. Укажіть URL Webhook як кінцеву точку вашого Gateway (потрібен HTTPS):

```
https://gateway-host/line/webhook
```

Gateway відповідає на перевірку Webhook від LINE (GET) і вхідні події (POST).
Якщо потрібен власний шлях, задайте `channels.line.webhookPath` або
`channels.line.accounts.<id>.webhookPath` і відповідно оновіть URL.

Примітка щодо безпеки:

- Перевірка підпису LINE залежить від тіла запиту (HMAC по сирому тілу), тому OpenClaw застосовує суворі обмеження розміру тіла до автентифікації та таймаут перед перевіркою.
- OpenClaw обробляє події Webhook з перевірених сирих байтів запиту. Значення `req.body`, змінені upstream middleware, ігноруються задля безпеки цілісності підпису.

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

Конфігурація публічних DM:

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

Змінні середовища (лише стандартний обліковий запис):

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

## Контроль доступу

Для прямих повідомлень за замовчуванням використовується спарювання. Невідомі відправники отримують код спарювання, а їхні
повідомлення ігноруються до схвалення.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Списки дозволених і політики:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: дозволені LINE user IDs для DM; `dmPolicy: "open"` потребує `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: дозволені LINE user IDs для груп
- Перевизначення для окремих груп: `channels.line.groups.<groupId>.allowFrom`
- Примітка щодо виконання: якщо `channels.line` повністю відсутній, під час перевірок груп runtime повертається до `groupPolicy="allowlist"` (навіть якщо задано `channels.defaults.groupPolicy`).

LINE IDs чутливі до регістру. Коректні IDs мають такий вигляд:

- Користувач: `U` + 32 шістнадцяткові символи
- Група: `C` + 32 шістнадцяткові символи
- Кімната: `R` + 32 шістнадцяткові символи

## Поведінка повідомлень

- Текст розбивається на частини по 5000 символів.
- Форматування Markdown видаляється; блоки коду й таблиці за можливості перетворюються на Flex
  cards.
- Потокові відповіді буферизуються; LINE отримує повні частини з анімацією завантаження,
  доки агент працює.
- Завантаження медіа обмежуються `channels.line.mediaMaxMb` (за замовчуванням 10).
- Вхідні медіа зберігаються в `~/.openclaw/media/inbound/`, перш ніж їх буде передано
  агенту, відповідно до спільного сховища медіа, яке використовують інші bundled channel
  plugins.

## Дані каналу (розширені повідомлення)

Використовуйте `channelData.line`, щоб надсилати quick replies, локації, Flex cards або template
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

LINE Plugin також постачається з командою `/card` для наборів Flex message:

```
/card info "Welcome" "Thanks for joining!"
```

## Підтримка ACP

LINE підтримує прив’язки розмов ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` прив’язує поточний чат LINE до сеансу ACP без створення дочірньої гілки.
- Налаштовані прив’язки ACP і активні сеанси ACP, прив’язані до розмови, працюють у LINE так само, як і в інших каналах розмов.

Докладніше див. [агенти ACP](/uk/tools/acp-agents).

## Вихідні медіа

LINE Plugin підтримує надсилання зображень, відео й аудіофайлів через інструмент повідомлень агента. Медіа надсилаються через специфічний для LINE шлях доставки з належною обробкою попереднього перегляду та відстеження:

- **Зображення**: надсилаються як повідомлення-зображення LINE з автоматичним створенням попереднього перегляду.
- **Відео**: надсилаються з явною обробкою попереднього перегляду й типу вмісту.
- **Аудіо**: надсилається як аудіоповідомлення LINE.

URL вихідних медіа мають бути публічними HTTPS URL. OpenClaw перевіряє цільове ім’я хоста перед передаванням URL до LINE і відхиляє local loopback, link-local і цілі в приватній мережі.

Загальне надсилання медіа повертається до наявного маршруту лише для зображень, коли специфічний для LINE шлях недоступний.

## Усунення несправностей

- **Перевірка Webhook завершується невдало:** переконайтеся, що URL Webhook використовує HTTPS, а
  `channelSecret` збігається з LINE console.
- **Немає вхідних подій:** підтвердьте, що шлях Webhook збігається з `channels.line.webhookPath`
  і що Gateway доступний для LINE.
- **Помилки завантаження медіа:** збільште `channels.line.mediaMaxMb`, якщо медіа перевищує
  стандартний ліміт.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Спарювання](/uk/channels/pairing) — автентифікація DM і процес спарювання
- [Групи](/uk/channels/groups) — поведінка групових чатів і контроль згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу й посилення захисту
