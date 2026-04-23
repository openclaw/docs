---
read_when:
    - Налаштування інтеграції чату Twitch для OpenClaw
summary: Налаштування та конфігурація чат-бота Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-23T20:45:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

Підтримка чату Twitch через IRC-з’єднання. OpenClaw підключається як користувач Twitch (обліковий запис бота), щоб отримувати та надсилати повідомлення в каналах.

## Вбудований Plugin

Twitch постачається як вбудований Plugin у поточних випусках OpenClaw, тому звичайні
пакетовані збірки не потребують окремого встановлення.

Якщо у вас старіша збірка або нестандартне встановлення без Twitch, установіть
його вручну:

Установлення через CLI (реєстр npm):

```bash
openclaw plugins install @openclaw/twitch
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Twitch доступний.
   - Поточні пакетовані випуски OpenClaw уже містять його.
   - У старіших/нестандартних встановленнях його можна додати вручну командами вище.
2. Створіть окремий обліковий запис Twitch для бота (або використайте наявний обліковий запис).
3. Згенеруйте облікові дані: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Виберіть **Bot Token**
   - Переконайтеся, що вибрано області доступу `chat:read` і `chat:write`
   - Скопіюйте **Client ID** і **Access Token**
4. Знайдіть свій ідентифікатор користувача Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Налаштуйте токен:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (лише для типового облікового запису)
   - Або конфігурація: `channels.twitch.accessToken`
   - Якщо задано і те, і інше, конфігурація має пріоритет (резервний варіант env працює лише для типового облікового запису).
6. Запустіть gateway.

**⚠️ Важливо:** Додайте керування доступом (`allowFrom` або `allowedRoles`), щоб неавторизовані користувачі не могли активувати бота. Типове значення `requireMention` — `true`.

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
- Детермінована маршрутизація: відповіді завжди повертаються в Twitch.
- Кожен обліковий запис зіставляється з ізольованим ключем сесії `agent:<agentId>:twitch:<accountName>`.
- `username` — це обліковий запис бота (хто проходить автентифікацію), `channel` — це чат-кімната, до якої потрібно приєднатися.

## Налаштування (докладно)

### Згенеруйте облікові дані

Скористайтеся [Twitch Token Generator](https://twitchtokengenerator.com/):

- Виберіть **Bot Token**
- Переконайтеся, що вибрано області доступу `chat:read` і `chat:write`
- Скопіюйте **Client ID** і **Access Token**

Ручна реєстрація застосунку не потрібна. Термін дії токенів спливає через кілька годин.

### Налаштуйте бота

**Змінна середовища (лише для типового облікового запису):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Або конфігурація:**

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

Якщо задано і env, і конфігурацію, пріоритет має конфігурація.

### Керування доступом (рекомендовано)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Надавайте перевагу `allowFrom` для жорсткого allowlist. Використовуйте `allowedRoles`, якщо хочете доступ на основі ролей.

**Доступні ролі:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Чому ідентифікатори користувачів?** Імена користувачів можуть змінюватися, що дозволяє видавати себе за іншу особу. Ідентифікатори користувачів є постійними.

Знайдіть свій ідентифікатор користувача Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (перетворення вашого імені користувача Twitch на ID)

## Оновлення токена (необов’язково)

Токени з [Twitch Token Generator](https://twitchtokengenerator.com/) не можна автоматично оновлювати — згенеруйте нові після завершення строку дії.

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

Бот автоматично оновлює токени до завершення строку дії та записує події оновлення в логи.

## Підтримка кількох облікових записів

Використовуйте `channels.twitch.accounts` із токенами для кожного облікового запису. Див. [`gateway/configuration`](/uk/gateway/configuration) для спільного шаблону.

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

**Примітка:** Кожному обліковому запису потрібен власний токен (один токен на канал).

## Керування доступом

### Обмеження на основі ролей

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

### Allowlist за User ID (найбезпечніше)

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

### Доступ на основі ролей (альтернатива)

`allowFrom` — це жорсткий allowlist. Якщо його задано, дозволено лише цим ідентифікаторам користувачів.
Якщо ви хочете доступ на основі ролей, не задавайте `allowFrom`, а натомість налаштуйте `allowedRoles`:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### Вимкнути вимогу @mention

Типове значення `requireMention` — `true`. Щоб вимкнути її та відповідати на всі повідомлення:

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

## Усунення проблем

Спочатку виконайте діагностичні команди:

```bash
openclaw doctor
openclaw channels status --probe
```

### Бот не відповідає на повідомлення

**Перевірте керування доступом:** Переконайтеся, що ваш ідентифікатор користувача є в `allowFrom`, або тимчасово приберіть
`allowFrom` і задайте `allowedRoles: ["all"]` для перевірки.

**Перевірте, що бот перебуває в каналі:** Бот має приєднатися до каналу, указаного в `channel`.

### Проблеми з токеном

**"Failed to connect" або помилки автентифікації:**

- Переконайтеся, що `accessToken` — це значення токена доступу OAuth (зазвичай починається з префікса `oauth:`)
- Переконайтеся, що токен має області доступу `chat:read` і `chat:write`
- Якщо використовується оновлення токена, переконайтеся, що задано `clientSecret` і `refreshToken`

### Оновлення токена не працює

**Перевірте логи на події оновлення:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Якщо ви бачите "token refresh disabled (no refresh token)":

- Переконайтеся, що надано `clientSecret`
- Переконайтеся, що надано `refreshToken`

## Конфігурація

**Конфігурація облікового запису:**

- `username` - Ім’я користувача бота
- `accessToken` - Токен доступу OAuth з `chat:read` і `chat:write`
- `clientId` - Twitch Client ID (із Token Generator або вашого застосунку)
- `channel` - Канал для приєднання (обов’язково)
- `enabled` - Увімкнути цей обліковий запис (типово: `true`)
- `clientSecret` - Необов’язково: для автоматичного оновлення токена
- `refreshToken` - Необов’язково: для автоматичного оновлення токена
- `expiresIn` - Строк дії токена в секундах
- `obtainmentTimestamp` - Час отримання токена
- `allowFrom` - allowlist ідентифікаторів користувачів
- `allowedRoles` - Керування доступом на основі ролей (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - Вимагати @mention (типово: `true`)

**Параметри провайдера:**

- `channels.twitch.enabled` - Увімкнути/вимкнути запуск каналу
- `channels.twitch.username` - Ім’я користувача бота (спрощена конфігурація одного облікового запису)
- `channels.twitch.accessToken` - Токен доступу OAuth (спрощена конфігурація одного облікового запису)
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

- **Ставтеся до токенів як до паролів** — ніколи не комітьте токени в git
- **Використовуйте автоматичне оновлення токена** для ботів, що працюють довго
- **Використовуйте allowlist ідентифікаторів користувачів** замість імен користувачів для керування доступом
- **Стежте за логами** подій оновлення токена та стану підключення
- **Запитуйте мінімально необхідні області доступу** — лише `chat:read` і `chat:write`
- **Якщо застрягли**: Перезапустіть gateway після підтвердження, що жоден інший процес не володіє сесією

## Обмеження

- **500 символів** на повідомлення (автоматичне розбиття на межах слів)
- Markdown видаляється перед розбиттям
- Без обмеження частоти (використовуються вбудовані обмеження Twitch)

## Пов’язані матеріали

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Groups](/uk/channels/groups) — поведінка групових чатів і шлюз згадок
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення безпеки
