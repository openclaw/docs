---
read_when:
    - Ви хочете підключити OpenClaw до LINE
    - Потрібне налаштування LINE Webhook + облікових даних
    - Вам потрібні параметри повідомлень, специфічні для LINE
summary: Налаштування, конфігурація та використання Plugin LINE Messaging API
title: РЯДОК
x-i18n:
    generated_at: "2026-04-29T05:36:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE підключається до OpenClaw через LINE Messaging API. Plugin працює як приймач Webhook
на Gateway і використовує ваш маркер доступу каналу + секрет каналу для
автентифікації.

Стан: комплектний Plugin. Підтримуються прямі повідомлення, групові чати, медіа, локації, Flex
messages, template messages і quick replies. Реакції та потоки
не підтримуються.

## Комплектний Plugin

LINE постачається як комплектний Plugin у поточних випусках OpenClaw, тому звичайні
пакетовані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення, що виключає LINE, установіть
поточний npm-пакет, коли його буде опубліковано:

```bash
openclaw plugins install @openclaw/line
```

Якщо npm повідомляє, що пакет, який належить OpenClaw, застарілий або відсутній, використовуйте
поточну пакетовану збірку OpenClaw або локальний checkout, доки лінійка npm-пакетів
не наздожене її.

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
5. Установіть URL Webhook на endpoint вашого Gateway (потрібен HTTPS):

```
https://gateway-host/line/webhook
```

Gateway відповідає на перевірку Webhook від LINE (GET) і вхідні події (POST).
Якщо вам потрібен власний шлях, задайте `channels.line.webhookPath` або
`channels.line.accounts.<id>.webhookPath` і відповідно оновіть URL.

Примітка щодо безпеки:

- Перевірка підпису LINE залежить від тіла запиту (HMAC над сирим тілом), тому OpenClaw застосовує суворі обмеження тіла до автентифікації та timeout перед перевіркою.
- OpenClaw обробляє події Webhook з перевірених сирих байтів запиту. Значення `req.body`, трансформовані upstream middleware, ігноруються задля цілісності підпису.

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

`tokenFile` і `secretFile` мають указувати на звичайні файли. Символьні посилання відхиляються.

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

Для прямих повідомлень стандартно використовується pairing. Невідомі відправники отримують код pairing, а їхні
повідомлення ігноруються до схвалення.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Списки дозволених і політики:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: дозволені LINE user IDs для DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: дозволені LINE user IDs для груп
- Перевизначення для окремих груп: `channels.line.groups.<groupId>.allowFrom`
- Примітка щодо runtime: якщо `channels.line` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

LINE IDs чутливі до регістру. Дійсні IDs мають такий вигляд:

- Користувач: `U` + 32 hex chars
- Група: `C` + 32 hex chars
- Кімната: `R` + 32 hex chars

## Поведінка повідомлень

- Текст розбивається на фрагменти по 5000 символів.
- Markdown-форматування видаляється; блоки коду й таблиці за можливості перетворюються на Flex
  cards.
- Потокові відповіді буферизуються; LINE отримує повні фрагменти з анімацією завантаження,
  поки агент працює.
- Завантаження медіа обмежені `channels.line.mediaMaxMb` (за замовчуванням 10).
- Вхідні медіа зберігаються в `~/.openclaw/media/inbound/` перед передаванням
  агенту, відповідно до спільного сховища медіа, яке використовують інші комплектні канальні
  Plugins.

## Дані каналу (насичені повідомлення)

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

LINE Plugin також постачається з командою `/card` для пресетів Flex-повідомлень:

```
/card info "Welcome" "Thanks for joining!"
```

## Підтримка ACP

LINE підтримує прив’язки розмов ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` прив’язує поточний чат LINE до сесії ACP без створення дочірнього потоку.
- Налаштовані прив’язки ACP і активні сесії ACP, прив’язані до розмови, працюють у LINE так само, як в інших каналах розмов.

Докладніше див. [агенти ACP](/uk/tools/acp-agents).

## Вихідні медіа

LINE Plugin підтримує надсилання зображень, відео й аудіофайлів через інструмент повідомлень агента. Медіа надсилаються через специфічний для LINE шлях доставки з належною обробкою попереднього перегляду та відстеження:

- **Зображення**: надсилаються як повідомлення-зображення LINE з автоматичною генерацією попереднього перегляду.
- **Відео**: надсилаються з явною обробкою попереднього перегляду та content-type.
- **Аудіо**: надсилаються як аудіоповідомлення LINE.

URL вихідних медіа мають бути публічними HTTPS URL. OpenClaw перевіряє цільове ім’я хоста перед передаванням URL до LINE і відхиляє local loopback, link-local та цілі приватної мережі.

Загальні надсилання медіа повертаються до наявного маршруту лише для зображень, коли специфічний для LINE шлях недоступний.

## Усунення несправностей

- **Перевірка Webhook не проходить:** переконайтеся, що URL Webhook використовує HTTPS і
  `channelSecret` відповідає LINE console.
- **Немає вхідних подій:** підтвердьте, що шлях Webhook відповідає `channels.line.webhookPath`
  і що Gateway доступний для LINE.
- **Помилки завантаження медіа:** збільште `channels.line.mediaMaxMb`, якщо медіа перевищують
  стандартний ліміт.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та gating за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення безпеки
