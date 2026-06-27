---
read_when:
    - Ви хочете підключити OpenClaw до LINE
    - Потрібне налаштування Webhook LINE та облікових даних
    - Вам потрібні параметри повідомлень, специфічні для LINE
summary: Налаштування, конфігурація та використання Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-27T17:11:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE підключається до OpenClaw через LINE Messaging API. Plugin працює як приймач Webhook
на Gateway і використовує ваш channel access token + channel secret для
автентифікації.

Статус: завантажуваний Plugin. Підтримуються прямі повідомлення, групові чати, медіа, локації, повідомлення Flex,
шаблонні повідомлення та швидкі відповіді. Реакції та гілки
не підтримуються.

## Встановлення

Встановіть LINE перед налаштуванням каналу:

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
5. Установіть URL Webhook на кінцеву точку вашого Gateway (потрібен HTTPS):

```
https://gateway-host/line/webhook
```

Gateway відповідає на перевірку Webhook від LINE (GET) і підтверджує підписані
вхідні події (POST) одразу після перевірки підпису та payload; обробка агентом
продовжується асинхронно.
Якщо вам потрібен власний шлях, задайте `channels.line.webhookPath` або
`channels.line.accounts.<id>.webhookPath` і відповідно оновіть URL.

Примітка щодо безпеки:

- Перевірка підпису LINE залежить від тіла запиту (HMAC над raw body), тому OpenClaw застосовує суворі ліміти тіла до автентифікації та timeout перед перевіркою.
- OpenClaw обробляє події Webhook з перевірених raw bytes запиту. Значення `req.body`, перетворені upstream middleware, ігноруються для безпеки цілісності підпису.

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

Публічна конфігурація DM:

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

Змінні env (лише обліковий запис за замовчуванням):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Файли token/secret:

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

`tokenFile` і `secretFile` мають вказувати на звичайні файли. Symlinks відхиляються.

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

Прямі повідомлення за замовчуванням використовують сполучення. Невідомі відправники отримують код сполучення, а їхні
повідомлення ігноруються, доки їх не буде схвалено.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Списки дозволених і політики:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: дозволені ідентифікатори користувачів LINE для приватних повідомлень; `dmPolicy: "open"` вимагає `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: дозволені ідентифікатори користувачів LINE для груп
- Перевизначення для окремих груп: `channels.line.groups.<groupId>.allowFrom`
- Статичні групи доступу відправників можна посилатися з `allowFrom`, `groupAllowFrom` і групового `allowFrom` через `accessGroup:<name>`.
- Примітка щодо runtime: якщо `channels.line` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

Ідентифікатори LINE чутливі до регістру. Коректні ідентифікатори мають такий вигляд:

- Користувач: `U` + 32 шістнадцяткові символи
- Група: `C` + 32 шістнадцяткові символи
- Кімната: `R` + 32 шістнадцяткові символи

## Поведінка повідомлень

- Текст розбивається на фрагменти по 5000 символів.
- Форматування Markdown вилучається; блоки коду й таблиці за можливості перетворюються на Flex
  картки.
- Потокові відповіді буферизуються; LINE отримує повні фрагменти з анімацією
  завантаження, поки агент працює.
- Завантаження медіа обмежуються `channels.line.mediaMaxMb` (за замовчуванням 10).
- Вхідні медіа зберігаються в `~/.openclaw/media/inbound/` перед передаванням
  агенту, відповідно до спільного сховища медіа, яке використовують інші вбудовані
  plugins каналів.

## Дані каналу (розширені повідомлення)

Використовуйте `channelData.line`, щоб надсилати швидкі відповіді, локації, Flex картки або шаблонні
повідомлення.

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

LINE plugin також постачається з командою `/card` для пресетів Flex повідомлень:

```
/card info "Welcome" "Thanks for joining!"
```

## Підтримка ACP

LINE підтримує прив’язки розмов ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` прив’язує поточний чат LINE до сесії ACP без створення дочірньої гілки.
- Налаштовані прив’язки ACP й активні сесії ACP, прив’язані до розмов, працюють у LINE так само, як в інших розмовних каналах.

Докладніше див. [агенти ACP](/uk/tools/acp-agents).

## Вихідні медіа

LINE plugin підтримує надсилання зображень, відео й аудіофайлів через інструмент повідомлень агента. Медіа надсилаються через специфічний для LINE шлях доставки з відповідною обробкою попереднього перегляду й відстеження:

- **Зображення**: надсилаються як повідомлення із зображеннями LINE з автоматичним створенням попереднього перегляду.
- **Відео**: надсилаються з явною обробкою попереднього перегляду й типу вмісту.
- **Аудіо**: надсилаються як аудіоповідомлення LINE.

URL-адреси вихідних медіа мають бути публічними HTTPS URL-адресами. OpenClaw перевіряє цільове ім’я хоста перед передаванням URL-адреси до LINE і відхиляє loopback, link-local і цілі в приватних мережах.

Універсальне надсилання медіа повертається до наявного маршруту лише для зображень, коли специфічний для LINE шлях недоступний.

## Усунення несправностей

- **Перевірка Webhook не вдається:** переконайтеся, що URL-адреса webhook використовує HTTPS і що
  `channelSecret` збігається з консоллю LINE.
- **Немає вхідних подій:** підтвердьте, що шлях webhook збігається з `channels.line.webhookPath`
  і що gateway доступний із LINE.
- **Помилки завантаження медіа:** збільште `channels.line.mediaMaxMb`, якщо медіа перевищує
  стандартний ліміт.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація приватних повідомлень і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату й обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу й посилення захисту
