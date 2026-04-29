---
read_when:
    - Налаштування інтеграції з чатом Twitch для OpenClaw
sidebarTitle: Twitch
summary: Конфігурація та налаштування чат-бота Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-29T05:37:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

Підтримка чату Twitch через IRC-з’єднання. OpenClaw підключається як користувач Twitch (обліковий запис бота), щоб отримувати й надсилати повідомлення в каналах.

## Вбудований plugin

<Note>
Twitch постачається як вбудований plugin у поточних випусках OpenClaw, тому звичайні пакетні збірки не потребують окремого встановлення.
</Note>

Якщо ви використовуєте старішу збірку або власне встановлення, яке виключає Twitch, установіть актуальний npm-пакет, коли його буде опубліковано:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Якщо npm повідомляє, що пакет, яким володіє OpenClaw, застарілий, використовуйте поточну пакетну збірку
OpenClaw або шлях до локального checkout, доки не буде опубліковано новіший npm-пакет.

Докладно: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

<Steps>
  <Step title="Ensure plugin is available">
    Поточні пакетні випуски OpenClaw уже містять його. Старіші або власні встановлення можуть додати його вручну за допомогою наведених вище команд.
  </Step>
  <Step title="Create a Twitch bot account">
    Створіть окремий обліковий запис Twitch для бота (або використайте наявний обліковий запис).
  </Step>
  <Step title="Generate credentials">
    Використайте [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Виберіть **Bot Token**
    - Переконайтеся, що вибрано scopes `chat:read` і `chat:write`
    - Скопіюйте **Client ID** і **Access Token**

  </Step>
  <Step title="Find your Twitch user ID">
    Використайте [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), щоб перетворити ім’я користувача на ID користувача Twitch.
  </Step>
  <Step title="Configure the token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (лише обліковий запис за замовчуванням)
    - Або config: `channels.twitch.accessToken`

    Якщо задано обидва варіанти, config має пріоритет (резервне env застосовується лише для облікового запису за замовчуванням).

  </Step>
  <Step title="Start the gateway">
    Запустіть Gateway із налаштованим каналом.
  </Step>
</Steps>

<Warning>
Додайте контроль доступу (`allowFrom` або `allowedRoles`), щоб неавторизовані користувачі не могли запускати бота. `requireMention` за замовчуванням має значення `true`.
</Warning>

Мінімальна config:

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
- Детермінована маршрутизація: відповіді завжди повертаються в Twitch.
- Кожен обліковий запис зіставляється з ізольованим ключем сеансу `agent:<agentId>:twitch:<accountName>`.
- `username` — це обліковий запис бота (який проходить автентифікацію), `channel` — чат-кімната, до якої потрібно приєднатися.

## Налаштування (детально)

### Згенеруйте облікові дані

Використайте [Twitch Token Generator](https://twitchtokengenerator.com/):

- Виберіть **Bot Token**
- Переконайтеся, що вибрано scopes `chat:read` і `chat:write`
- Скопіюйте **Client ID** і **Access Token**

<Note>
Ручна реєстрація застосунку не потрібна. Токени спливають через кілька годин.
</Note>

### Налаштуйте бота

<Tabs>
  <Tab title="Env var (default account only)">
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

Надавайте перевагу `allowFrom` для суворого списку дозволених. Натомість використовуйте `allowedRoles`, якщо потрібен доступ на основі ролей.

**Доступні ролі:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Чому ID користувачів?** Імена користувачів можуть змінюватися, що дає змогу видавати себе за інших. ID користувачів є постійними.

Знайдіть свій ID користувача Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Перетворіть своє ім’я користувача Twitch на ID)
</Note>

## Оновлення токена (необов’язково)

Токени з [Twitch Token Generator](https://twitchtokengenerator.com/) не можна автоматично оновлювати — згенеруйте їх повторно після спливання.

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

Бот автоматично оновлює токени до спливання терміну дії та записує події оновлення в журнали.

## Підтримка кількох облікових записів

Використовуйте `channels.twitch.accounts` із токенами для кожного облікового запису. Спільний шаблон див. у [Конфігурації](/uk/gateway/configuration).

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
  <Tab title="User ID allowlist (most secure)">
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
  <Tab title="Role-based">
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

    `allowFrom` — це суворий список дозволених. Коли його задано, дозволені лише ці ID користувачів. Якщо потрібен доступ на основі ролей, не задавайте `allowFrom` і натомість налаштуйте `allowedRoles`.

  </Tab>
  <Tab title="Disable @mention requirement">
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

Спочатку виконайте діагностичні команди:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot does not respond to messages">
    - **Перевірте контроль доступу:** Переконайтеся, що ваш ID користувача є в `allowFrom`, або тимчасово видаліть `allowFrom` і встановіть `allowedRoles: ["all"]` для тестування.
    - **Перевірте, що бот перебуває в каналі:** Бот має приєднатися до каналу, указаного в `channel`.

  </Accordion>
  <Accordion title="Token issues">
    "Failed to connect" або помилки автентифікації:

    - Переконайтеся, що `accessToken` є значенням OAuth access token (зазвичай починається з префікса `oauth:`)
    - Перевірте, що токен має scopes `chat:read` і `chat:write`
    - Якщо використовується оновлення токена, переконайтеся, що задано `clientSecret` і `refreshToken`

  </Accordion>
  <Accordion title="Token refresh not working">
    Перевірте журнали на наявність подій оновлення:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Якщо бачите "token refresh disabled (no refresh token)":

    - Переконайтеся, що надано `clientSecret`
    - Переконайтеся, що надано `refreshToken`

  </Accordion>
</AccordionGroup>

## Config

### Config облікового запису

<ParamField path="username" type="string">
  Ім’я користувача бота.
</ParamField>
<ParamField path="accessToken" type="string">
  OAuth access token із `chat:read` і `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (з Token Generator або вашого застосунку).
</ParamField>
<ParamField path="channel" type="string" required>
  Канал, до якого потрібно приєднатися.
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
  Часова позначка отримання токена.
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
- `channels.twitch.username` - Ім’я користувача бота (спрощена config для одного облікового запису)
- `channels.twitch.accessToken` - OAuth access token (спрощена config для одного облікового запису)
- `channels.twitch.clientId` - Twitch Client ID (спрощена config для одного облікового запису)
- `channels.twitch.channel` - Канал, до якого потрібно приєднатися (спрощена config для одного облікового запису)
- `channels.twitch.accounts.<accountName>` - Config для кількох облікових записів (усі поля облікового запису вище)

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

## Дії інструментів

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
- **Використовуйте списки дозволених ID користувачів** замість імен користувачів для контролю доступу.
- **Стежте за журналами** щодо подій оновлення токенів і стану з’єднання.
- **Мінімізуйте scopes токенів** — запитуйте лише `chat:read` і `chat:write`.
- **Якщо застрягли**: перезапустіть Gateway після підтвердження, що жоден інший процес не володіє сеансом.

## Обмеження

- **500 символів** на повідомлення (автоматично розбивається на фрагменти на межах слів).
- Markdown видаляється перед розбиттям на фрагменти.
- Без обмеження частоти (використовуються вбудовані обмеження Twitch).

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групового чату та фільтрація за згадками
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Безпека](/uk/gateway/security) — модель доступу та посилення безпеки
