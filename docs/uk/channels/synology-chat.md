---
read_when:
    - Налаштування Synology Chat з OpenClaw
    - Налагодження маршрутизації Webhook для Synology Chat
summary: Налаштування Webhook для Synology Chat і конфігурація OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T13:00:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat підключається до OpenClaw через пару Webhook: вихідний Webhook Synology Chat надсилає вхідні прямі повідомлення до Gateway, а відповіді повертаються через вхідний Webhook Synology Chat.

Статус: офіційний Plugin, установлюється окремо. Підтримуються лише прямі повідомлення; підтримується надсилання тексту й файлів за URL-адресами.

## Установлення

```bash
openclaw plugins install @openclaw/synology-chat
```

Локальна робоча копія (під час запуску з репозиторію git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Докладніше: [Плагіни](/uk/tools/plugin)

## Швидке налаштування

1. Установіть Plugin (див. вище).
2. В інтеграціях Synology Chat:
   - Створіть вхідний Webhook і скопіюйте його URL-адресу.
   - Створіть вихідний Webhook із вашим секретним токеном.
3. Спрямуйте URL-адресу вихідного Webhook на ваш OpenClaw Gateway:
   - Типово: `https://gateway-host/webhook/synology`.
   - Або на власний шлях `channels.synology-chat.webhookPath`.
4. Завершіть налаштування в OpenClaw. Synology Chat відображається в одному списку налаштування каналів в обох сценаріях:
   - Покроково: `openclaw onboard` або `openclaw channels add`
   - Безпосередньо: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Перезапустіть Gateway і надішліть пряме повідомлення боту Synology Chat.

Відомості про автентифікацію Webhook:

- OpenClaw приймає токен вихідного Webhook спочатку з `body.token`, потім із
  `?token=...`, а потім із заголовків.
- Підтримувані форми заголовків:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Порожні або відсутні токени призводять до безпечної відмови.
- Корисне навантаження може мати тип `application/x-www-form-urlencoded` або `application/json`; поля `token`, `user_id` і `text` є обов’язковими.

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

`SYNOLOGY_CHAT_INCOMING_URL` і `SYNOLOGY_NAS_HOST` не можна задавати у файлі `.env` робочого простору; див. [Файли `.env` робочого простору](/uk/gateway/security#workspace-env-files).

## Політика прямих повідомлень і контроль доступу

- Підтримувані значення `dmPolicy`: `allowlist` (за замовчуванням), `open` і `disabled`. Synology Chat не має процесу спарювання; схвалюйте відправників, додаючи їхні числові ідентифікатори користувачів Synology до `allowedUserIds`.
- `allowedUserIds` приймає список (або рядок зі значеннями через кому) ідентифікаторів користувачів Synology.
- У режимі `allowlist` порожній список `allowedUserIds` вважається помилковою конфігурацією, і маршрут Webhook не запускається.
- `dmPolicy: "open"` дозволяє загальнодоступні прямі повідомлення лише тоді, коли `allowedUserIds` містить `"*"`; якщо вказано обмежувальні записи, спілкуватися можуть лише відповідні користувачі. Режим `open` із порожнім списком `allowedUserIds` також не дозволяє запустити маршрут.
- `dmPolicy: "disabled"` блокує прямі повідомлення.
- Прив’язка одержувача відповіді за замовчуванням залишається за стабільним числовим `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який повторно вмикає пошук за змінним іменем користувача або псевдонімом для доставлення відповідей.

## Вихідна доставка

Використовуйте числові ідентифікатори користувачів Synology Chat як адресатів. Підтримуються префікси `synology-chat:`, `synology_chat:` і `synology:`.

Приклади:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

Вихідний текст розбивається на частини по 2000 символів. Надсилання медіафайлів підтримується через доставлення файлів за URL-адресами: NAS завантажує та прикріплює файл (до 32 МБ). URL-адреси вихідних файлів мають використовувати `http` або `https`, а приватні чи іншим чином заблоковані мережеві адреси відхиляються до того, як OpenClaw передасть URL-адресу до Webhook NAS.

## Кілька облікових записів

У `channels.synology-chat.accounts` підтримується кілька облікових записів Synology Chat.
Кожен обліковий запис може перевизначати токен, URL-адресу вхідного Webhook, шлях Webhook, політику прямих повідомлень і обмеження.
Сеанси прямих повідомлень ізольовані для кожного облікового запису й користувача, тому однаковий числовий `user_id`
у двох різних облікових записах Synology не використовує спільний стан історії повідомлень.
Призначте кожному ввімкненому обліковому запису окремий `webhookPath`. OpenClaw відхиляє повністю однакові шляхи
та не запускає іменовані облікові записи, які в конфігурації з кількома обліковими записами лише успадковують спільний шлях Webhook.
Якщо іменованому обліковому запису навмисно потрібне успадкування для сумісності зі старою поведінкою, установіть
`dangerouslyAllowInheritedWebhookPath: true` для цього облікового запису або в `channels.synology-chat`,
але повністю однакові шляхи однаково відхиляються з безпечною відмовою. Надавайте перевагу явним шляхам для кожного облікового запису.

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

- Зберігайте `token` у таємниці та змініть його в разі витоку.
- Залишайте `allowInsecureSsl: false`, якщо ви явно не довіряєте самопідписаному локальному сертифікату NAS.
- Запити вхідного Webhook перевіряються за токеном і обмежуються за частотою для кожного відправника (`rateLimitPerMinute`, за замовчуванням 30).
- Перевірки недійсних токенів використовують порівняння секретів за сталий час і завершуються безпечною відмовою; повторні спроби з недійсним токеном тимчасово блокують вихідну IP-адресу.
- Текст вхідного повідомлення очищується від відомих шаблонів ін’єкції підказок і скорочується до 4000 символів.
- Для робочого середовища надавайте перевагу `dmPolicy: "allowlist"`.
- Не вмикайте `dangerouslyAllowNameMatching`, якщо вам явно не потрібне доставлення відповідей за іменами користувачів для сумісності зі старою поведінкою.
- Не вмикайте `dangerouslyAllowInheritedWebhookPath`, якщо ви явно не погоджуєтеся з ризиком маршрутизації через спільний шлях у конфігурації з кількома обліковими записами.

## Усунення несправностей

- `Missing required fields (token, user_id, text)`:
  - у корисному навантаженні вихідного Webhook відсутнє одне з обов’язкових полів
  - якщо Synology надсилає токен у заголовках, переконайтеся, що Gateway або проксі зберігає ці заголовки
- `Invalid token`:
  - секрет вихідного Webhook не відповідає `channels.synology-chat.token`
  - запит надходить до неправильного облікового запису або шляху Webhook
  - зворотний проксі видалив заголовок токена до того, як запит досяг OpenClaw
- `Rate limit exceeded`:
  - надто багато спроб із недійсним токеном з одного джерела можуть тимчасово заблокувати це джерело
  - для автентифікованих відправників також діє окреме обмеження частоти повідомлень для кожного користувача
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` увімкнено, але жодного користувача не налаштовано
- `User not authorized`:
  - числового `user_id` відправника немає в `allowedUserIds`

## Пов’язані матеріали

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
