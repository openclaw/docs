---
read_when:
    - Налаштування інтеграції чату Twitch для OpenClaw
sidebarTitle: Twitch
summary: Конфігурація та налаштування чат-бота Twitch
title: Twitch
x-i18n:
    generated_at: "2026-05-02T21:04:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0738d0a2095370f771fa5a1967c8bbcb88e052648c6da8c0d9f8367600e101e0
    source_path: channels/twitch.md
    workflow: 16
---

Підтримка чату Twitch через IRC-з’єднання. OpenClaw підключається як користувач Twitch (обліковий запис бота), щоб отримувати й надсилати повідомлення в каналах.

## Вбудований plugin

<Note>
Twitch постачається як вбудований plugin у поточних випусках OpenClaw, тому звичайні пакетовані збірки не потребують окремого встановлення.
</Note>

Якщо ви використовуєте старішу збірку або власне встановлення без Twitch, установіть npm-пакет напряму:

<Tabs>
  <Tab title="npm-реєстр">
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

Використовуйте `@openclaw/twitch@beta`, коли стежите за beta-каналом OpenClaw і npmjs
показує `beta` попереду `latest`.

Докладно: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

<Steps>
  <Step title="Переконайтеся, що plugin доступний">
    Поточні пакетовані випуски OpenClaw уже містять його. Старіші або власні встановлення можуть додати його вручну командами вище.
  </Step>
  <Step title="Створіть обліковий запис бота Twitch">
    Створіть окремий обліковий запис Twitch для бота (або використайте наявний обліковий запис).
  </Step>
  <Step title="Згенеруйте облікові дані">
    Використайте [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Виберіть **Bot Token**
    - Переконайтеся, що вибрано області доступу `chat:read` і `chat:write`
    - Скопіюйте **Client ID** і **Access Token**

  </Step>
  <Step title="Знайдіть свій ID користувача Twitch">
    Використайте [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), щоб перетворити ім’я користувача на ID користувача Twitch.
  </Step>
  <Step title="Налаштуйте токен">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (лише обліковий запис за замовчуванням)
    - Або config: `channels.twitch.accessToken`

    Якщо задано обидва варіанти, config має пріоритет (env fallback діє лише для облікового запису за замовчуванням).

  </Step>
  <Step title="Запустіть gateway">
    Запустіть gateway із налаштованим каналом.
  </Step>
</Steps>

<Warning>
Додайте контроль доступу (`allowFrom` або `allowedRoles`), щоб запобігти запуску бота неавторизованими користувачами. `requireMention` за замовчуванням має значення `true`.
</Warning>

Мінімальна конфігурація:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Що це таке

- Канал Twitch, яким володіє Gateway.
- Детермінована маршрутизація: відповіді завжди повертаються до Twitch.
- Кожен обліковий запис зіставляється з ізольованим ключем сесії `agent:<agentId>:twitch:<accountName>`.
- `username` — це обліковий запис бота (який автентифікується), `channel` — це чат-кімната, до якої треба приєднатися.

## Налаштування (докладно)

### Згенеруйте облікові дані

Використайте [Twitch Token Generator](https://twitchtokengenerator.com/):

- Виберіть **Bot Token**
- Переконайтеся, що вибрано області доступу `chat:read` і `chat:write`
- Скопіюйте **Client ID** і **Access Token**

<Note>
Ручна реєстрація застосунку не потрібна. Токени спливають через кілька годин.
</Note>

### Налаштуйте бота

<Tabs>
  <Tab title="Env var (лише обліковий запис за замовчуванням)">
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

Якщо задано і env, і config, config має пріоритет.

### Контроль доступу (рекомендовано)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Надавайте перевагу `allowFrom` для суворого списку дозволених. Використовуйте натомість `allowedRoles`, якщо потрібен доступ на основі ролей.

**Доступні ролі:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Чому ID користувачів?** Імена користувачів можуть змінюватися, що дає змогу видавати себе за інших. ID користувачів є постійними.

Знайдіть свій ID користувача Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (перетворіть своє ім’я користувача Twitch на ID)
</Note>

## Оновлення токена (необов’язково)

Токени з [Twitch Token Generator](https://twitchtokengenerator.com/) не можна автоматично оновлювати — згенеруйте їх повторно після завершення строку дії.

Для автоматичного оновлення токена створіть власний застосунок Twitch у [Twitch Developer Console](https://dev.twitch.tv/console) і додайте до config:

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

Бот автоматично оновлює токени перед завершенням строку дії та записує події оновлення в журнал.

## Підтримка кількох облікових записів

Використовуйте `channels.twitch.accounts` із токенами для кожного облікового запису. Див. [Конфігурація](/uk/gateway/configuration) для спільного шаблону.

Приклад (один обліковий запис бота у двох каналах):

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

## Контроль доступу

<Tabs>
  <Tab title="Список дозволених ID користувачів (найбезпечніше)">
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

    `allowFrom` — це суворий список дозволених. Якщо його задано, дозволені лише ці ID користувачів. Якщо потрібен доступ на основі ролей, не задавайте `allowFrom` і натомість налаштуйте `allowedRoles`.

  </Tab>
  <Tab title="Вимкнути вимогу @mention">
    За замовчуванням `requireMention` має значення `true`. Щоб вимкнути це й відповідати на всі повідомлення:

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

Спочатку запустіть діагностичні команди:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення">
    - **Перевірте контроль доступу:** переконайтеся, що ваш ID користувача є в `allowFrom`, або тимчасово видаліть `allowFrom` і задайте `allowedRoles: ["all"]` для тестування.
    - **Перевірте, що бот у каналі:** бот має приєднатися до каналу, указаного в `channel`.

  </Accordion>
  <Accordion title="Проблеми з токеном">
    "Не вдалося підключитися" або помилки автентифікації:

    - Переконайтеся, що `accessToken` є значенням OAuth-токена доступу (зазвичай починається з префікса `oauth:`)
    - Перевірте, що токен має області доступу `chat:read` і `chat:write`
    - Якщо використовується оновлення токена, переконайтеся, що `clientSecret` і `refreshToken` задано

  </Accordion>
  <Accordion title="Оновлення токена не працює">
    Перевірте журнали на наявність подій оновлення:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Якщо ви бачите "token refresh disabled (no refresh token)":

    - Переконайтеся, що `clientSecret` надано
    - Переконайтеся, що `refreshToken` надано

  </Accordion>
</AccordionGroup>

## Конфігурація

### Конфігурація облікового запису

<ParamField path="username" type="string">
  Ім’я користувача бота.
</ParamField>
<ParamField path="accessToken" type="string">
  OAuth-токен доступу з `chat:read` і `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (з Token Generator або вашого застосунку).
</ParamField>
<ParamField path="channel" type="string" required>
  Канал для приєднання.
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
  Строк дії токена в секундах.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Позначка часу отримання токена.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Список дозволених ID користувачів.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Контроль доступу на основі ролей.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Вимагати @mention.
</ParamField>

### Параметри провайдера

- `channels.twitch.enabled` - Увімкнути/вимкнути запуск каналу
- `channels.twitch.username` - Ім’я користувача бота (спрощена конфігурація одного облікового запису)
- `channels.twitch.accessToken` - OAuth-токен доступу (спрощена конфігурація одного облікового запису)
- `channels.twitch.clientId` - Twitch Client ID (спрощена конфігурація одного облікового запису)
- `channels.twitch.channel` - Канал для приєднання (спрощена конфігурація одного облікового запису)
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

- `send` - Надіслати повідомлення до каналу

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
- **Використовуйте автоматичне оновлення токенів** для ботів, що працюють довго.
- **Використовуйте списки дозволених ID користувачів** замість імен користувачів для контролю доступу.
- **Відстежуйте журнали** щодо подій оновлення токенів і стану з’єднання.
- **Мінімізуйте області доступу токенів** — запитуйте лише `chat:read` і `chat:write`.
- **Якщо застрягли**: перезапустіть gateway після підтвердження, що жоден інший процес не володіє сесією.

## Обмеження

- **500 символів** на повідомлення (автоматично розбивається на частини за межами слів).
- Markdown видаляється перед розбиттям.
- Без обмеження частоти (використовуються вбудовані обмеження частоти Twitch).

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групових чатів і блокування без згадки
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Безпека](/uk/gateway/security) — модель доступу та посилення безпеки
