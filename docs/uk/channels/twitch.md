---
read_when:
    - Налаштування інтеграції чату Twitch для OpenClaw
sidebarTitle: Twitch
summary: Конфігурація та налаштування чат-бота Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-26T09:05:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

Підтримка чату Twitch через підключення IRC. OpenClaw підключається як користувач Twitch (обліковий запис бота), щоб отримувати та надсилати повідомлення в каналах.

## Вбудований Plugin

<Note>
Twitch постачається як вбудований Plugin у поточних релізах OpenClaw, тому звичайним пакетним збіркам не потрібне окреме встановлення.
</Note>

Якщо ви використовуєте старішу збірку або власне встановлення без Twitch, установіть його вручну:

<Tabs>
  <Tab title="реєстр npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Локальний checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

<Steps>
  <Step title="Переконайтеся, що Plugin доступний">
    У поточних пакетних релізах OpenClaw він уже вбудований. У старіших/власних встановленнях його можна додати вручну наведеними вище командами.
  </Step>
  <Step title="Створіть обліковий запис Twitch для бота">
    Створіть окремий обліковий запис Twitch для бота (або використайте наявний обліковий запис).
  </Step>
  <Step title="Згенеруйте облікові дані">
    Скористайтеся [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Виберіть **Bot Token**
    - Переконайтеся, що вибрано області доступу `chat:read` і `chat:write`
    - Скопіюйте **Client ID** і **Access Token**

  </Step>
  <Step title="Знайдіть свій Twitch user ID">
    Використайте [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), щоб перетворити ім’я користувача на Twitch user ID.
  </Step>
  <Step title="Налаштуйте токен">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (лише для облікового запису за замовчуванням)
    - Або config: `channels.twitch.accessToken`

    Якщо задано обидва варіанти, пріоритет має config (env використовується як резервне джерело лише для облікового запису за замовчуванням).

  </Step>
  <Step title="Запустіть Gateway">
    Запустіть Gateway з налаштованим каналом.
  </Step>
</Steps>

<Warning>
Додайте керування доступом (`allowFrom` або `allowedRoles`), щоб запобігти запуску бота неавторизованими користувачами. Для `requireMention` типовим значенням є `true`.
</Warning>

Мінімальна конфігурація:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Обліковий запис Twitch бота
      accessToken: "oauth:abc123...", // OAuth Access Token (або використайте змінну середовища OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID з Token Generator
      channel: "vevisk", // До якого чату каналу Twitch підключатися (обов’язково)
      allowFrom: ["123456789"], // (рекомендовано) Лише ваш Twitch user ID — отримайте його на https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Що це таке

- Канал Twitch, яким володіє Gateway.
- Детермінована маршрутизація: відповіді завжди повертаються в Twitch.
- Кожен обліковий запис зіставляється з ізольованим ключем сесії `agent:<agentId>:twitch:<accountName>`.
- `username` — це обліковий запис бота (який проходить автентифікацію), а `channel` — це чат-кімната, до якої треба підключитися.

## Налаштування (докладно)

### Згенеруйте облікові дані

Скористайтеся [Twitch Token Generator](https://twitchtokengenerator.com/):

- Виберіть **Bot Token**
- Переконайтеся, що вибрано області доступу `chat:read` і `chat:write`
- Скопіюйте **Client ID** і **Access Token**

<Note>
Ручна реєстрація застосунку не потрібна. Термін дії токенів спливає через кілька годин.
</Note>

### Налаштуйте бота

<Tabs>
  <Tab title="Змінна середовища (лише для облікового запису за замовчуванням)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

Якщо задано і env, і config, пріоритет має config.

### Керування доступом (рекомендовано)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (рекомендовано) Лише ваш Twitch user ID
    },
  },
}
```

Для жорсткого списку дозволених користувачів надавайте перевагу `allowFrom`. Якщо потрібен доступ на основі ролей, натомість використовуйте `allowedRoles`.

**Доступні ролі:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Чому саме user ID?** Імена користувачів можуть змінюватися, що відкриває можливість для видавання себе за іншу особу. User ID є постійними.

Знайдіть свій Twitch user ID: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Перетворення імені користувача Twitch на ID)
</Note>

## Оновлення токена (необов’язково)

Токени з [Twitch Token Generator](https://twitchtokengenerator.com/) не можна автоматично оновлювати — згенеруйте їх повторно після завершення терміну дії.

Щоб увімкнути автоматичне оновлення токена, створіть власний застосунок Twitch у [Twitch Developer Console](https://dev.twitch.tv/console) і додайте в config:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Бот автоматично оновлює токени до завершення їхнього терміну дії та записує події оновлення в журнали.

## Підтримка кількох облікових записів

Використовуйте `channels.twitch.accounts` із токенами для кожного облікового запису. Загальний шаблон див. у [Configuration](/uk/gateway/configuration).

Приклад (один обліковий запис бота в двох каналах):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
Кожному обліковому запису потрібен власний токен (один токен на канал).
</Note>

## Керування доступом

<Tabs>
  <Tab title="Список дозволених user ID (найбезпечніше)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="На основі ролей">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom` — це жорсткий список дозволених користувачів. Якщо його задано, дозволено лише зазначені user ID. Якщо вам потрібен доступ на основі ролей, не задавайте `allowFrom`, а натомість налаштуйте `allowedRoles`.

  </Tab>
  <Tab title="Вимкнути вимогу @mention">
    Типово `requireMention` має значення `true`. Щоб вимкнути це й відповідати на всі повідомлення:

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Усунення несправностей

Спочатку виконайте команди діагностики:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення">
    - **Перевірте керування доступом:** Переконайтеся, що ваш user ID є в `allowFrom`, або тимчасово приберіть `allowFrom` і задайте `allowedRoles: ["all"]` для перевірки.
    - **Перевірте, що бот перебуває в каналі:** Бот має приєднатися до каналу, заданого в `channel`.
  </Accordion>
  <Accordion title="Проблеми з токеном">
    "Failed to connect" або помилки автентифікації:

    - Переконайтеся, що `accessToken` — це значення OAuth access token (зазвичай починається з префікса `oauth:`)
    - Перевірте, що токен має області доступу `chat:read` і `chat:write`
    - Якщо використовується оновлення токена, переконайтеся, що задано `clientSecret` і `refreshToken`

  </Accordion>
  <Accordion title="Оновлення токена не працює">
    Перевірте журнали на наявність подій оновлення:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Якщо ви бачите "token refresh disabled (no refresh token)":

    - Переконайтеся, що вказано `clientSecret`
    - Переконайтеся, що вказано `refreshToken`

  </Accordion>
</AccordionGroup>

## Config

### Конфігурація облікового запису

<ParamField path="username" type="string">
  Ім’я користувача бота.
</ParamField>
<ParamField path="accessToken" type="string">
  OAuth access token з `chat:read` і `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (із Token Generator або вашого застосунку).
</ParamField>
<ParamField path="channel" type="string" required>
  Канал для підключення.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Увімкнути цей обліковий запис.
</ParamField>
<ParamField path="clientSecret" type="string">
  Необов’язково: для автоматичного оновлення токена.
</ParamField>
<ParamField path="refreshToken" type="string">
  Необов’язково: для автоматичного оновлення токена.
</ParamField>
<ParamField path="expiresIn" type="number">
  Термін дії токена в секундах.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Час отримання токена.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Список дозволених user ID.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Керування доступом на основі ролей.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Вимагати @mention.
</ParamField>

### Параметри провайдера

- `channels.twitch.enabled` - Увімкнути/вимкнути запуск каналу
- `channels.twitch.username` - Ім’я користувача бота (спрощена конфігурація одного облікового запису)
- `channels.twitch.accessToken` - OAuth access token (спрощена конфігурація одного облікового запису)
- `channels.twitch.clientId` - Twitch Client ID (спрощена конфігурація одного облікового запису)
- `channels.twitch.channel` - Канал для підключення (спрощена конфігурація одного облікового запису)
- `channels.twitch.accounts.<accountName>` - Конфігурація кількох облікових записів (усі поля облікового запису вище)

Повний приклад:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Дії інструмента

Агент може викликати `twitch` з дією:

- `send` - Надіслати повідомлення в канал

Приклад:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Безпека та експлуатація

- **Ставтеся до токенів як до паролів** — ніколи не комітьте токени в git.
- **Використовуйте автоматичне оновлення токенів** для довготривалих ботів.
- **Використовуйте списки дозволених user ID** замість імен користувачів для керування доступом.
- **Відстежуйте журнали** на предмет подій оновлення токенів і стану підключення.
- **Надавайте токенам мінімально необхідні області доступу** — запитуйте лише `chat:read` і `chat:write`.
- **Якщо застрягли**: перезапустіть Gateway після підтвердження, що жоден інший процес не володіє сесією.

## Обмеження

- **500 символів** на повідомлення (автоматично розбивається на частини на межах слів).
- Markdown видаляється перед розбиттям на частини.
- Обмеження швидкості відсутнє (використовуються вбудовані обмеження Twitch).

## Пов’язане

- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Groups](/uk/channels/groups) — поведінка групового чату та фільтрація за згадуваннями
- [Pairing](/uk/channels/pairing) — автентифікація в DM і процес прив’язування
- [Security](/uk/gateway/security) — модель доступу та посилення безпеки
