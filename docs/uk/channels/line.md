---
read_when:
    - Ви хочете підключити OpenClaw до LINE
    - Потрібне налаштування LINE Webhook + облікових даних
    - Вам потрібні параметри повідомлень, специфічні для LINE
summary: Налаштування, конфігурація та використання Plugin LINE Messaging API
title: РЯДОК
x-i18n:
    generated_at: "2026-04-28T11:05:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 12afbb8d4e85a7865e25d916c8c46b374333c9583dca1e9063f6f393ed7f7e1a
    source_path: channels/line.md
    workflow: 16
---

LINE підключається до OpenClaw через LINE Messaging API. Plugin працює як приймач webhook на Gateway і використовує ваш channel access token + channel secret для автентифікації.

Статус: вбудований Plugin. Підтримуються прямі повідомлення, групові чати, медіа, локації, Flex-повідомлення, шаблонні повідомлення та швидкі відповіді. Реакції й потоки не підтримуються.

## Вбудований Plugin

LINE постачається як вбудований Plugin у поточних випусках OpenClaw, тому звичайні пакетні збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення, яке не містить LINE, установіть його вручну:

```bash
openclaw plugins install @openclaw/line
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Налаштування

1. Створіть обліковий запис LINE Developers і відкрийте Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Створіть (або виберіть) Provider і додайте канал **Messaging API**.
3. Скопіюйте **Channel access token** і **Channel secret** з налаштувань каналу.
4. Увімкніть **Use webhook** у налаштуваннях Messaging API.
5. Установіть URL webhook на endpoint вашого Gateway (потрібен HTTPS):

```
https://gateway-host/line/webhook
```

Gateway відповідає на перевірку webhook від LINE (GET) і вхідні події (POST).
Якщо вам потрібен власний шлях, задайте `channels.line.webhookPath` або
`channels.line.accounts.<id>.webhookPath` і відповідно оновіть URL.

Примітка щодо безпеки:

- Перевірка підпису LINE залежить від тіла запиту (HMAC над сирим тілом), тому OpenClaw застосовує суворі обмеження тіла перед автентифікацією та timeout до перевірки.
- OpenClaw обробляє події webhook із перевірених сирих байтів запиту. Значення `req.body`, змінені upstream middleware, ігноруються задля безпеки цілісності підпису.

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

Змінні середовища (лише обліковий запис за замовчуванням):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Файли токена/секрету:

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

`tokenFile` і `secretFile` мають указувати на звичайні файли. Symlink відхиляються.

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

Прямі повідомлення за замовчуванням використовують pairing. Невідомі відправники отримують код pairing, а їхні повідомлення ігноруються, доки їх не схвалено.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Списки дозволених і політики:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: дозволені LINE user ID для DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: дозволені LINE user ID для груп
- Перевизначення для окремих груп: `channels.line.groups.<groupId>.allowFrom`
- Примітка щодо runtime: якщо `channels.line` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

LINE ID чутливі до регістру. Коректні ID мають такий вигляд:

- Користувач: `U` + 32 hex chars
- Група: `C` + 32 hex chars
- Кімната: `R` + 32 hex chars

## Поведінка повідомлень

- Текст ділиться на фрагменти по 5000 символів.
- Форматування Markdown видаляється; code blocks і таблиці за можливості перетворюються на Flex-картки.
- Потокові відповіді буферизуються; LINE отримує повні фрагменти з анімацією завантаження, поки агент працює.
- Завантаження медіа обмежені `channels.line.mediaMaxMb` (за замовчуванням 10).
- Вхідні медіа зберігаються в `~/.openclaw/media/inbound/`, перш ніж передаються агенту, відповідно до спільного сховища медіа, яке використовують інші вбудовані канальні plugins.

## Дані каналу (розширені повідомлення)

Використовуйте `channelData.line`, щоб надсилати швидкі відповіді, локації, Flex-картки або шаблонні повідомлення.

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

Plugin LINE також постачається з командою `/card` для пресетів Flex-повідомлень:

```
/card info "Welcome" "Thanks for joining!"
```

## Підтримка ACP

LINE підтримує прив’язки розмов ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` прив’язує поточний чат LINE до сесії ACP без створення дочірнього потоку.
- Налаштовані прив’язки ACP і активні сесії ACP, прив’язані до розмови, працюють у LINE так само, як в інших каналах розмов.

Докладніше див. [агенти ACP](/uk/tools/acp-agents).

## Вихідні медіа

Plugin LINE підтримує надсилання зображень, відео й аудіофайлів через інструмент повідомлень агента. Медіа надсилаються через специфічний для LINE шлях доставлення з належною обробкою preview і tracking:

- **Зображення**: надсилаються як повідомлення із зображеннями LINE з автоматичним створенням preview.
- **Відео**: надсилаються з явною обробкою preview і content-type.
- **Аудіо**: надсилаються як аудіоповідомлення LINE.

URL вихідних медіа мають бути публічними HTTPS URL. OpenClaw перевіряє цільове hostname перед передаванням URL до LINE і відхиляє loopback, link-local та private-network цілі.

Загальні надсилання медіа повертаються до наявного маршруту лише для зображень, якщо специфічний для LINE шлях недоступний.

## Усунення несправностей

- **Перевірка webhook не вдається:** переконайтеся, що URL webhook використовує HTTPS, а `channelSecret` відповідає LINE console.
- **Немає вхідних подій:** підтвердьте, що шлях webhook відповідає `channels.line.webhookPath` і що Gateway доступний із LINE.
- **Помилки завантаження медіа:** збільште `channels.line.mediaMaxMb`, якщо медіа перевищує ліміт за замовчуванням.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та mention gating
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
