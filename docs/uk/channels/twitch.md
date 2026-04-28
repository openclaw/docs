---
read_when:
    - Налаштування інтеграції чату Twitch для OpenClaw
sidebarTitle: Twitch
summary: Конфігурація та налаштування чат-бота Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-28T11:05:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f762cb1e3de2b81eeac4832ba47690961f0497e95a9cd67b60488b61df50a6e
    source_path: channels/twitch.md
    workflow: 16
---

Підтримка чату Twitch через IRC-з’єднання. OpenClaw підключається як користувач Twitch (обліковий запис бота), щоб отримувати й надсилати повідомлення в каналах.

## Вбудований Plugin

<Note>
Twitch постачається як вбудований Plugin у поточних випусках OpenClaw, тому звичайні пакетовані збірки не потребують окремого встановлення.
</Note>

Якщо ви використовуєте старішу збірку або кастомне встановлення, яке не включає Twitch, встановіть його вручну:

<Tabs>
  <Tab title="npm registry">
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
    Поточні пакетовані випуски OpenClaw уже включають його. Старіші або кастомні встановлення можуть додати його вручну командами вище.
  </Step>
  <Step title="Створіть обліковий запис Twitch-бота">
    Створіть окремий обліковий запис Twitch для бота (або використайте наявний обліковий запис).
  </Step>
  <Step title="Згенеруйте облікові дані">
    Використайте [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Виберіть **Bot Token**
    - Переконайтеся, що вибрано scope `chat:read` і `chat:write`
    - Скопіюйте **Client ID** і **Access Token**

  </Step>
  <Step title="Знайдіть свій ідентифікатор користувача Twitch">
    Використайте [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), щоб перетворити ім’я користувача на ідентифікатор користувача Twitch.
  </Step>
  <Step title="Налаштуйте токен">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (лише обліковий запис за замовчуванням)
    - Або конфігурація: `channels.twitch.accessToken`

    Якщо задано обидва, конфігурація має пріоритет (резервне значення з env працює лише для облікового запису за замовчуванням).

  </Step>
  <Step title="Запустіть Gateway">
    Запустіть Gateway із налаштованим каналом.
  </Step>
</Steps>

<Warning>
Додайте контроль доступу (`allowFrom` або `allowedRoles`), щоб неавторизовані користувачі не могли запускати бота. `requireMention` за замовчуванням має значення `true`.
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
- Детермінізована маршрутизація: відповіді завжди повертаються в Twitch.
- Кожен обліковий запис зіставляється з ізольованим ключем сесії `agent:<agentId>:twitch:<accountName>`.
- `username` — це обліковий запис бота (який автентифікується), `channel` — це чат-кімната, до якої потрібно приєднатися.

## Налаштування (докладно)

### Згенеруйте облікові дані

Використайте [Twitch Token Generator](https://twitchtokengenerator.com/):

- Виберіть **Bot Token**
- Переконайтеся, що вибрано scope `chat:read` і `chat:write`
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
  <Tab title="Конфігурація">
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

Якщо задано і env, і конфігурацію, конфігурація має пріоритет.

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

Надавайте перевагу `allowFrom` як жорсткому списку дозволених користувачів. Натомість використовуйте `allowedRoles`, якщо потрібен доступ на основі ролей.

**Доступні ролі:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Чому ідентифікатори користувачів?** Імена користувачів можуть змінюватися, що дає змогу видавати себе за іншого. Ідентифікатори користувачів є постійними.

Знайдіть свій ідентифікатор користувача Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (перетворіть своє ім’я користувача Twitch на ID)
</Note>

## Оновлення токена (опційно)

Токени з [Twitch Token Generator](https://twitchtokengenerator.com/) не можна оновлювати автоматично — згенеруйте їх повторно після спливання.

Для автоматичного оновлення токена створіть власний застосунок Twitch у [Twitch Developer Console](https://dev.twitch.tv/console) і додайте до конфігурації:

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

Бот автоматично оновлює токени до спливання строку дії та записує події оновлення в журнали.

## Підтримка кількох облікових записів

Використовуйте `channels.twitch.accounts` з окремими токенами для кожного облікового запису. Спільний шаблон див. у [Конфігурації](/uk/gateway/configuration).

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

    `allowFrom` — це жорсткий список дозволених користувачів. Якщо його задано, дозволено лише ці ідентифікатори користувачів. Якщо потрібен доступ на основі ролей, не задавайте `allowFrom` і натомість налаштуйте `allowedRoles`.

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

Спочатку виконайте діагностичні команди:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення">
    - **Перевірте контроль доступу:** переконайтеся, що ваш ідентифікатор користувача є в `allowFrom`, або тимчасово видаліть `allowFrom` і задайте `allowedRoles: ["all"]` для тестування.
    - **Перевірте, що бот перебуває в каналі:** бот має приєднатися до каналу, указаного в `channel`.

  </Accordion>
  <Accordion title="Проблеми з токеном">
    "Failed to connect" або помилки автентифікації:

    - Переконайтеся, що `accessToken` є значенням токена доступу OAuth (зазвичай починається з префікса `oauth:`)
    - Перевірте, що токен має scope `chat:read` і `chat:write`
    - Якщо використовується оновлення токена, переконайтеся, що задано `clientSecret` і `refreshToken`

  </Accordion>
  <Accordion title="Оновлення токена не працює">
    Перевірте журнали на наявність подій оновлення:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Якщо бачите "token refresh disabled (no refresh token)":

    - Переконайтеся, що вказано `clientSecret`
    - Переконайтеся, що вказано `refreshToken`

  </Accordion>
</AccordionGroup>

## Конфігурація

### Конфігурація облікового запису

<ParamField path="username" type="string">
  Ім’я користувача бота.
</ParamField>
<ParamField path="accessToken" type="string">
  Токен доступу OAuth із `chat:read` і `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Client ID Twitch (з Token Generator або вашого застосунку).
</ParamField>
<ParamField path="channel" type="string" required>
  Канал, до якого потрібно приєднатися.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Увімкнути цей обліковий запис.
</ParamField>
<ParamField path="clientSecret" type="string">
  Опційно: для автоматичного оновлення токена.
</ParamField>
<ParamField path="refreshToken" type="string">
  Опційно: для автоматичного оновлення токена.
</ParamField>
<ParamField path="expiresIn" type="number">
  Строк дії токена в секундах.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Мітка часу отримання токена.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Список дозволених ідентифікаторів користувачів.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Контроль доступу на основі ролей.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Вимагати @mention.
</ParamField>

### Опції провайдера

- `channels.twitch.enabled` - Увімкнути/вимкнути запуск каналу
- `channels.twitch.username` - Ім’я користувача бота (спрощена конфігурація одного облікового запису)
- `channels.twitch.accessToken` - Токен доступу OAuth (спрощена конфігурація одного облікового запису)
- `channels.twitch.clientId` - Client ID Twitch (спрощена конфігурація одного облікового запису)
- `channels.twitch.channel` - Канал, до якого потрібно приєднатися (спрощена конфігурація одного облікового запису)
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

## Безпека й експлуатація

- **Ставтеся до токенів як до паролів** — ніколи не комітьте токени в git.
- **Використовуйте автоматичне оновлення токенів** для ботів, що працюють тривалий час.
- **Використовуйте списки дозволених ID користувачів** замість імен користувачів для контролю доступу.
- **Відстежуйте журнали** щодо подій оновлення токенів і стану з’єднання.
- **Мінімізуйте scope токенів** — запитуйте лише `chat:read` і `chat:write`.
- **Якщо застрягли**: перезапустіть Gateway після підтвердження, що жоден інший процес не володіє сесією.

## Обмеження

- **500 символів** на повідомлення (автоматично розбивається на частини на межах слів).
- Markdown видаляється перед розбиттям на частини.
- Без обмеження частоти (використовує вбудовані обмеження частоти Twitch).

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групового чату та шлюз згадок
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
