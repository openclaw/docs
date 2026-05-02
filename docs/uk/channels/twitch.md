---
read_when:
    - Налаштування інтеграції чату Twitch для OpenClaw
sidebarTitle: Twitch
summary: Конфігурація та налаштування чат-бота Twitch
title: Twitch
x-i18n:
    generated_at: "2026-05-02T21:58:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
---

Підтримка чату Twitch через IRC-з’єднання. OpenClaw підключається як користувач Twitch (обліковий запис бота), щоб отримувати й надсилати повідомлення в каналах.

## Вбудований Plugin

<Note>
Twitch постачається як вбудований Plugin у поточних випусках OpenClaw, тому звичайні пакетовані збірки не потребують окремого встановлення.
</Note>

Якщо ви використовуєте старішу збірку або кастомне встановлення, яке не включає Twitch, встановіть npm-пакет напряму:

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

Використовуйте пакет без версії, щоб стежити за поточним офіційним тегом випуску. Закріплюйте точну
версію лише тоді, коли вам потрібне відтворюване встановлення.

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

<Steps>
  <Step title="Переконайтеся, що Plugin доступний">
    Поточні пакетовані випуски OpenClaw вже включають його. У старіших або кастомних встановленнях його можна додати вручну командами вище.
  </Step>
  <Step title="Створіть обліковий запис бота Twitch">
    Створіть окремий обліковий запис Twitch для бота (або використайте наявний обліковий запис).
  </Step>
  <Step title="Згенеруйте облікові дані">
    Використайте [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Виберіть **Bot Token**
    - Перевірте, що вибрано області доступу `chat:read` і `chat:write`
    - Скопіюйте **Client ID** і **Access Token**

  </Step>
  <Step title="Знайдіть свій ідентифікатор користувача Twitch">
    Використайте [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), щоб перетворити ім’я користувача на ідентифікатор користувача Twitch.
  </Step>
  <Step title="Налаштуйте токен">
    - Змінна середовища: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (лише обліковий запис за замовчуванням)
    - Або конфігурація: `channels.twitch.accessToken`

    Якщо задано обидва варіанти, конфігурація має пріоритет (резервна змінна середовища діє лише для облікового запису за замовчуванням).

  </Step>
  <Step title="Запустіть Gateway">
    Запустіть Gateway із налаштованим каналом.
  </Step>
</Steps>

<Warning>
Додайте контроль доступу (`allowFrom` або `allowedRoles`), щоб запобігти запуску бота неавторизованими користувачами. Значення `requireMention` за замовчуванням — `true`.
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
- Кожен обліковий запис відповідає ізольованому ключу сеансу `agent:<agentId>:twitch:<accountName>`.
- `username` — це обліковий запис бота (який проходить автентифікацію), `channel` — це чат-кімната, до якої потрібно приєднатися.

## Налаштування (докладно)

### Згенеруйте облікові дані

Використайте [Twitch Token Generator](https://twitchtokengenerator.com/):

- Виберіть **Bot Token**
- Перевірте, що вибрано області доступу `chat:read` і `chat:write`
- Скопіюйте **Client ID** і **Access Token**

<Note>
Ручна реєстрація застосунку не потрібна. Токени спливають через кілька годин.
</Note>

### Налаштуйте бота

<Tabs>
  <Tab title="Змінна середовища (лише обліковий запис за замовчуванням)">
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

Якщо задано і змінну середовища, і конфігурацію, конфігурація має пріоритет.

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

Надавайте перевагу `allowFrom` для жорсткого списку дозволених. Використовуйте `allowedRoles` натомість, якщо вам потрібен доступ на основі ролей.

**Доступні ролі:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Чому ідентифікатори користувачів?** Імена користувачів можуть змінюватися, що дає змогу видавати себе за іншу особу. Ідентифікатори користувачів постійні.

Знайдіть свій ідентифікатор користувача Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (перетворіть своє ім’я користувача Twitch на ID)
</Note>

## Оновлення токена (необов’язково)

Токени з [Twitch Token Generator](https://twitchtokengenerator.com/) не можна автоматично оновлювати — згенеруйте новий після завершення строку дії.

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

Бот автоматично оновлює токени до завершення строку дії та записує події оновлення в журнали.

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

    `allowFrom` — це жорсткий список дозволених. Якщо його задано, дозволені лише ці ідентифікатори користувачів. Якщо вам потрібен доступ на основі ролей, не задавайте `allowFrom` і налаштуйте натомість `allowedRoles`.

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
    - **Перевірте контроль доступу:** Переконайтеся, що ваш ID користувача є в `allowFrom`, або тимчасово видаліть `allowFrom` і задайте `allowedRoles: ["all"]` для тестування.
    - **Перевірте, що бот у каналі:** Бот має приєднатися до каналу, указаного в `channel`.

  </Accordion>
  <Accordion title="Проблеми з токеном">
    "Failed to connect" або помилки автентифікації:

    - Перевірте, що `accessToken` — це значення токена доступу OAuth (зазвичай починається з префікса `oauth:`)
    - Перевірте, що токен має області доступу `chat:read` і `chat:write`
    - Якщо використовується оновлення токена, перевірте, що `clientSecret` і `refreshToken` задані

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
  Токен доступу OAuth із `chat:read` і `chat:write`.
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
  Строк дії токена в секундах.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Час отримання токена.
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
- `channels.twitch.accessToken` - Токен доступу OAuth (спрощена конфігурація одного облікового запису)
- `channels.twitch.clientId` - Twitch Client ID (спрощена конфігурація одного облікового запису)
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
- **Стежте за журналами** для подій оновлення токенів і стану з’єднання.
- **Мінімізуйте області доступу токенів** — запитуйте лише `chat:read` і `chat:write`.
- **Якщо застрягли**: перезапустіть Gateway після підтвердження, що жоден інший процес не володіє сеансом.

## Обмеження

- **500 символів** на повідомлення (автоматично розбивається на частини на межах слів).
- Markdown видаляється перед розбиттям на частини.
- Без обмеження частоти (використовуються вбудовані обмеження частоти Twitch).

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження за згадкою
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
