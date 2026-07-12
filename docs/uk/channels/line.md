---
read_when:
    - Ви хочете підключити OpenClaw до LINE
    - Вам потрібно налаштувати Webhook LINE та облікові дані
    - Вам потрібні параметри повідомлень, специфічні для LINE
summary: Налаштування, конфігурація та використання Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-12T12:59:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE підключається до OpenClaw через LINE Messaging API. Plugin працює на Gateway як
отримувач Webhook і використовує токен доступу до каналу та секрет каналу для
автентифікації.

Статус: офіційний Plugin, що встановлюється окремо. Підтримуються особисті повідомлення,
групові чати, медіафайли, геопозиції, повідомлення Flex, шаблонні повідомлення та швидкі відповіді.
Реакції та гілки не підтримуються.

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
3. Скопіюйте **Channel access token** і **Channel secret** із налаштувань каналу.
4. Увімкніть **Use webhook** у налаштуваннях Messaging API.
5. Укажіть як URL-адресу Webhook кінцеву точку вашого Gateway (потрібен HTTPS):

```text
https://gateway-host/line/webhook
```

Gateway відповідає на перевірку Webhook від LINE (GET) і негайно підтверджує підписані
вхідні події (POST) після перевірки підпису та корисного навантаження; обробка агентом
продовжується асинхронно.
Якщо потрібен власний шлях, задайте `channels.line.webhookPath` або
`channels.line.accounts.<id>.webhookPath` і відповідно оновіть URL-адресу.

Примітки щодо безпеки:

- Перевірка підпису LINE залежить від тіла запиту (HMAC над необробленим тілом), тому OpenClaw застосовує суворе обмеження розміру тіла до автентифікації (64 КБ) і тайм-аут читання перед перевіркою.
- OpenClaw обробляє події Webhook із перевірених необроблених байтів запиту. Значення `req.body`, перетворені проміжним ПЗ вище за стеком, ігноруються для захисту цілісності підпису.

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

Конфігурація загальнодоступних особистих повідомлень:

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

Змінні середовища (лише для облікового запису за замовчуванням):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Файли токена та секрету:

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
Вбудовані значення конфігурації мають пріоритет над файлами; змінні середовища є останнім резервним варіантом для облікового запису за замовчуванням.

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

Для особистих повідомлень за замовчуванням використовується сполучення. Невідомі відправники отримують код сполучення, а їхні
повідомлення ігноруються до схвалення:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Списки дозволених користувачів і політики:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням `pairing`)
- `channels.line.allowFrom`: дозволені ідентифікатори користувачів LINE для особистих повідомлень; `dmPolicy: "open"` потребує `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (за замовчуванням `allowlist`)
- `channels.line.groupAllowFrom`: дозволені ідентифікатори користувачів LINE для груп
- Перевизначення для окремих груп: `channels.line.groups.<groupId>.allowFrom` (а також `enabled`, `requireMention`, `systemPrompt`, `skills`)
- На статичні групи доступу відправників можна посилатися з `allowFrom`, `groupAllowFrom` і групового `allowFrom` за допомогою `accessGroup:<name>`; див. [Групи доступу](/uk/channels/access-groups).
- Примітка щодо середовища виконання: якщо `channels.line` повністю відсутній, під час перевірок груп середовище виконання використовує резервне значення `groupPolicy="allowlist"` (навіть якщо задано `channels.defaults.groupPolicy`).

Ідентифікатори LINE чутливі до регістру. Допустимі ідентифікатори мають такий вигляд:

- Користувач: `U` + 32 шістнадцяткові символи
- Група: `C` + 32 шістнадцяткові символи
- Кімната: `R` + 32 шістнадцяткові символи

## Поведінка повідомлень

- Текст розбивається на фрагменти по 5000 символів.
- Форматування Markdown видаляється; блоки коду й таблиці за можливості перетворюються на картки Flex.
- Потокові відповіді буферизуються; LINE отримує повні фрагменти з анімацією завантаження, поки агент працює.
- Розмір завантажуваних медіафайлів обмежується параметром `channels.line.mediaMaxMb` (за замовчуванням 10).
- Вхідні медіафайли зберігаються в `~/.openclaw/media/inbound/` перед передаванням
  агенту відповідно до спільного сховища медіафайлів, яке використовують інші Plugin каналів.

## Дані каналу (розширені повідомлення)

Використовуйте `channelData.line`, щоб надсилати швидкі відповіді, геопозиції, картки Flex або шаблонні
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
        contents: {/* Flex payload */},
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

Plugin LINE також постачається з командою `/card` для заготовок повідомлень Flex:

```text
/card info "Welcome" "Thanks for joining!"
```

## Підтримка ACP

LINE підтримує прив’язування розмов ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` прив’язує поточний чат LINE до сеансу ACP без створення дочірньої гілки.
- Налаштовані прив’язування ACP та активні сеанси ACP, прив’язані до розмов, працюють у LINE так само, як в інших каналах розмов.

Докладніше див. у розділі [Агенти ACP](/uk/tools/acp-agents).

## Вихідні медіафайли

Plugin LINE надсилає зображення, відео й аудіо через інструмент повідомлень агента:

- **Зображення**: надсилаються як повідомлення LINE із зображеннями; за замовчуванням для попереднього перегляду використовується URL-адреса медіафайлу.
- **Відео**: потребують зображення для попереднього перегляду; задайте для `channelData.line.previewImageUrl` URL-адресу зображення.
- **Аудіо**: надсилається як аудіоповідомлення LINE; тривалість за замовчуванням становить 60 секунд, якщо не задано `channelData.line.durationMs`.

Тип медіафайлу береться з `channelData.line.mediaKind`, якщо це значення задано; інакше він визначається
за іншими параметрами LINE або розширенням файлу в URL-адресі, а резервним типом є зображення.

URL-адреси вихідних медіафайлів мають бути загальнодоступними URL-адресами HTTPS завдовжки не більше 2000 символів. OpenClaw
перевіряє ім’я цільового хоста перед передаванням URL-адреси до LINE і відхиляє цілі local loopback,
локального каналу та приватної мережі.

Для загального надсилання медіафайлів без параметрів, специфічних для LINE, використовується маршрут зображень.

## Усунення несправностей

- **Не вдається перевірити Webhook:** переконайтеся, що URL-адреса Webhook використовує HTTPS, а
  `channelSecret` відповідає значенню в консолі LINE.
- **Немає вхідних подій:** переконайтеся, що шлях Webhook відповідає `channels.line.webhookPath`
  і що Gateway доступний із LINE.
- **Помилки завантаження медіафайлів:** збільште `channels.line.mediaMaxMb`, якщо розмір медіафайлу перевищує
  стандартне обмеження.

## Пов’язані матеріали

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація особистих повідомлень і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
