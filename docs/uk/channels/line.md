---
read_when:
    - Ви хочете підключити OpenClaw до LINE
    - Вам потрібно налаштувати Webhook LINE та облікові дані
    - Вам потрібні специфічні для LINE параметри повідомлень
summary: Налаштування, конфігурація та використання Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-23T20:44:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

LINE підключається до OpenClaw через LINE Messaging API. Plugin працює як отримувач Webhook
на gateway і використовує ваш channel access token та channel secret для
автентифікації.

Статус: вбудований plugin. Підтримуються прямі повідомлення, групові чати, медіа, геолокації, Flex
повідомлення, template messages і quick replies. Reactions і threads
не підтримуються.

## Вбудований plugin

LINE постачається як вбудований plugin у поточних випусках OpenClaw, тому звичайним
пакетним збіркам не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або спеціальне встановлення без LINE, установіть його
вручну:

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
5. Установіть URL Webhook на кінцеву точку вашого gateway (потрібен HTTPS):

```
https://gateway-host/line/webhook
```

Gateway відповідає на перевірку Webhook від LINE (GET) і вхідні події (POST).
Якщо вам потрібен власний шлях, установіть `channels.line.webhookPath` або
`channels.line.accounts.<id>.webhookPath` і відповідно оновіть URL.

Примітка щодо безпеки:

- Перевірка підпису LINE залежить від тіла запиту (HMAC по сирому тілу), тому OpenClaw застосовує суворі обмеження на розмір тіла до автентифікації та тайм-аут перед перевіркою.
- OpenClaw обробляє події Webhook із перевірених сирих байтів запиту. Значення `req.body`, змінені проміжним middleware вище за ланцюгом, ігноруються задля безпеки цілісності підпису.

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

`tokenFile` і `secretFile` мають вказувати на звичайні файли. Symlink-и не допускаються.

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

Для прямих повідомлень за замовчуванням використовується pairing. Невідомі відправники отримують код
pairing, а їхні повідомлення ігноруються, доки не будуть схвалені.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Списки дозволу та політики:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: дозволені LINE user ID для DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: дозволені LINE user ID для груп
- Перевизначення для окремих груп: `channels.line.groups.<groupId>.allowFrom`
- Примітка щодо runtime: якщо `channels.line` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

LINE ID чутливі до регістру. Коректні ID мають такий вигляд:

- Користувач: `U` + 32 hex-символи
- Група: `C` + 32 hex-символи
- Room: `R` + 32 hex-символи

## Поведінка повідомлень

- Текст розбивається на частини по 5000 символів.
- Форматування Markdown видаляється; блоки коду й таблиці за можливості перетворюються на Flex
  cards.
- Потокові відповіді буферизуються; LINE отримує повні фрагменти з анімацією
  завантаження, поки агент працює.
- Завантаження медіа обмежуються `channels.line.mediaMaxMb` (за замовчуванням 10).

## Дані каналу (rich messages)

Використовуйте `channelData.line`, щоб надсилати quick replies, геолокації, Flex cards або template
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

Plugin LINE також постачається з командою `/card` для preset-ів Flex message:

```
/card info "Welcome" "Thanks for joining!"
```

## Підтримка ACP

LINE підтримує прив’язки розмов ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` прив’язує поточний чат LINE до сесії ACP без створення дочірнього thread.
- Налаштовані прив’язки ACP і активні ACP-сесії, прив’язані до розмови, працюють у LINE так само, як і в інших каналах розмов.

Докладніше див. у [ACP agents](/uk/tools/acp-agents).

## Вихідні медіа

Plugin LINE підтримує надсилання зображень, відео й аудіофайлів через інструмент повідомлень агента. Медіа надсилаються через специфічний для LINE шлях доставки з відповідною обробкою preview і відстеження:

- **Зображення**: надсилаються як повідомлення-зображення LINE з автоматичним створенням preview.
- **Відео**: надсилаються з явною обробкою preview і content-type.
- **Аудіо**: надсилаються як аудіоповідомлення LINE.

URL вихідних медіа мають бути публічними HTTPS URL. OpenClaw перевіряє цільове ім’я хоста перед передаванням URL до LINE і відхиляє цілі loopback, link-local і private-network.

Узагальнене надсилання медіа повертається до наявного маршруту лише для зображень, якщо специфічний для LINE шлях недоступний.

## Усунення несправностей

- **Перевірка Webhook не вдається:** переконайтеся, що URL Webhook використовує HTTPS і
  `channelSecret` збігається з налаштуваннями в console LINE.
- **Немає вхідних подій:** підтвердьте, що шлях Webhook збігається з `channels.line.webhookPath`
  і що gateway доступний із LINE.
- **Помилки завантаження медіа:** збільшіть `channels.line.mediaMaxMb`, якщо медіа перевищує
  стандартне обмеження.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Групи](/uk/channels/groups) — поведінка групових чатів і gating згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення захисту
