---
read_when:
    - Ви хочете підключити OpenClaw до LINE
    - Потрібно налаштувати LINE Webhook і облікові дані
    - Вам потрібні параметри повідомлень, специфічні для LINE
summary: Налаштування, конфігурація та використання Plugin LINE Messaging API
title: РЯДОК
x-i18n:
    generated_at: "2026-05-02T07:07:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a42afc437140185415347f66a8c0b8eaf7d623a6cc08aedf274121e89cdc3b7
    source_path: channels/line.md
    workflow: 16
---

LINE підключається до OpenClaw через LINE Messaging API. Plugin працює як приймач Webhook
на Gateway і використовує ваш токен доступу каналу + секрет каналу для
автентифікації.

Статус: завантажуваний Plugin. Підтримуються прямі повідомлення, групові чати, медіа, локації, Flex
повідомлення, шаблонні повідомлення та швидкі відповіді. Реакції та гілки
не підтримуються.

## Встановлення

Установіть LINE перед налаштуванням каналу:

```bash
openclaw plugins install @openclaw/line
```

Локальна робоча копія (коли запускаєте з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Налаштування

1. Створіть обліковий запис LINE Developers і відкрийте консоль:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Створіть (або виберіть) провайдера й додайте канал **Messaging API**.
3. Скопіюйте **токен доступу каналу** і **секрет каналу** з налаштувань каналу.
4. Увімкніть **використання Webhook** у налаштуваннях Messaging API.
5. Установіть URL Webhook на кінцеву точку вашого Gateway (потрібен HTTPS):

```
https://gateway-host/line/webhook
```

Gateway відповідає на перевірку Webhook від LINE (GET) і вхідні події (POST).
Якщо вам потрібен власний шлях, задайте `channels.line.webhookPath` або
`channels.line.accounts.<id>.webhookPath` і відповідно оновіть URL.

Примітка щодо безпеки:

- Перевірка підпису LINE залежить від тіла запиту (HMAC над необробленим тілом), тому OpenClaw застосовує суворі обмеження тіла перед автентифікацією та тайм-аут до перевірки.
- OpenClaw обробляє події Webhook з перевірених необроблених байтів запиту. Значення `req.body`, змінені проміжним ПЗ вище за потоком, ігноруються задля безпеки цілісності підпису.

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

Змінні середовища (лише типовий обліковий запис):

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

Для прямих повідомлень типово використовується сполучення. Невідомі відправники отримують код сполучення, а їхні
повідомлення ігноруються до схвалення.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Списки дозволених і політики:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: дозволені LINE ID користувачів для прямих повідомлень
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: дозволені LINE ID користувачів для груп
- Перевизначення для окремих груп: `channels.line.groups.<groupId>.allowFrom`
- Примітка щодо часу виконання: якщо `channels.line` повністю відсутній, час виконання повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

LINE ID чутливі до регістру. Дійсні ID мають такий вигляд:

- Користувач: `U` + 32 шістнадцяткові символи
- Група: `C` + 32 шістнадцяткові символи
- Кімната: `R` + 32 шістнадцяткові символи

## Поведінка повідомлень

- Текст розбивається на фрагменти по 5000 символів.
- Форматування Markdown вилучається; блоки коду й таблиці за можливості перетворюються на Flex
  картки.
- Потокові відповіді буферизуються; LINE отримує повні фрагменти з анімацією
  завантаження, поки агент працює.
- Завантаження медіа обмежуються `channels.line.mediaMaxMb` (типово 10).
- Вхідні медіа зберігаються в `~/.openclaw/media/inbound/` перед передаванням
  агенту, відповідно до спільного сховища медіа, яке використовують інші вбудовані канальні
  plugins.

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

LINE plugin також постачається з командою `/card` для наборів Flex повідомлень:

```
/card info "Welcome" "Thanks for joining!"
```

## Підтримка ACP

LINE підтримує прив’язки розмов ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` прив’язує поточний чат LINE до сеансу ACP без створення дочірньої гілки.
- Налаштовані прив’язки ACP і активні сеанси ACP, прив’язані до розмов, працюють у LINE так само, як в інших каналах розмов.

Докладніше див. [агенти ACP](/uk/tools/acp-agents).

## Вихідні медіа

LINE plugin підтримує надсилання зображень, відео й аудіофайлів через інструмент повідомлень агента. Медіа надсилаються через специфічний для LINE шлях доставки з належною обробкою попереднього перегляду та відстеження:

- **Зображення**: надсилаються як повідомлення-зображення LINE з автоматичним створенням попереднього перегляду.
- **Відео**: надсилаються з явною обробкою попереднього перегляду та типу вмісту.
- **Аудіо**: надсилаються як аудіоповідомлення LINE.

URL вихідних медіа мають бути публічними HTTPS URL. OpenClaw перевіряє цільове ім’я хоста перед передаванням URL до LINE і відхиляє loopback, link-local та цілі приватної мережі.

Загальне надсилання медіа повертається до наявного маршруту лише для зображень, коли специфічний для LINE шлях недоступний.

## Усунення несправностей

- **Перевірка Webhook не вдається:** переконайтеся, що URL Webhook використовує HTTPS і
  `channelSecret` збігається з LINE console.
- **Немає вхідних подій:** підтвердьте, що шлях Webhook відповідає `channels.line.webhookPath`
  і що Gateway доступний з LINE.
- **Помилки завантаження медіа:** збільште `channels.line.mediaMaxMb`, якщо медіа перевищують
  типове обмеження.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація прямих повідомлень і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і фільтрація за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
