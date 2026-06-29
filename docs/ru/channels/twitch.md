---
read_when:
    - Настройка интеграции чата Twitch для OpenClaw
sidebarTitle: Twitch
summary: Конфигурация и настройка бота чата Twitch
title: Twitch
x-i18n:
    generated_at: "2026-06-28T22:37:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
---

Поддержка чата Twitch через IRC-соединение. OpenClaw подключается как пользователь Twitch (аккаунт бота), чтобы получать и отправлять сообщения в каналах.

## Встроенный Plugin

<Note>
Twitch поставляется как встроенный Plugin в текущих релизах OpenClaw, поэтому обычным пакетным сборкам не требуется отдельная установка.
</Note>

Если вы используете более старую сборку или пользовательскую установку, которая исключает Twitch, установите npm-пакет напрямую:

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

Используйте пакет без версии, чтобы следовать текущему официальному тегу релиза. Закрепляйте точную
версию только тогда, когда вам нужна воспроизводимая установка.

Подробности: [Plugins](/ru/tools/plugin)

## Быстрая настройка (для начинающих)

<Steps>
  <Step title="Ensure plugin is available">
    Текущие пакетные релизы OpenClaw уже включают его. Более старые или пользовательские установки могут добавить его вручную командами выше.
  </Step>
  <Step title="Create a Twitch bot account">
    Создайте отдельный аккаунт Twitch для бота (или используйте существующий аккаунт).
  </Step>
  <Step title="Generate credentials">
    Используйте [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Выберите **Bot Token**
    - Убедитесь, что выбраны области доступа `chat:read` и `chat:write`
    - Скопируйте **Client ID** и **Access Token**

  </Step>
  <Step title="Find your Twitch user ID">
    Используйте [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), чтобы преобразовать имя пользователя в ID пользователя Twitch.
  </Step>
  <Step title="Configure the token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (только аккаунт по умолчанию)
    - Или конфиг: `channels.twitch.accessToken`

    Если заданы оба варианта, конфиг имеет приоритет (резервный env-вариант работает только для аккаунта по умолчанию).

  </Step>
  <Step title="Start the gateway">
    Запустите Gateway с настроенным каналом.
  </Step>
</Steps>

<Warning>
Добавьте контроль доступа (`allowFrom` или `allowedRoles`), чтобы предотвратить запуск бота неавторизованными пользователями. Значение `requireMention` по умолчанию — `true`.
</Warning>

Минимальный конфиг:

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

## Что это такое

- Канал Twitch, принадлежащий Gateway.
- Детерминированная маршрутизация: ответы всегда возвращаются в Twitch.
- Каждый аккаунт сопоставляется с изолированным ключом сессии `agent:<agentId>:twitch:<accountName>`.
- `username` — это аккаунт бота (который проходит аутентификацию), `channel` — чат, к которому нужно присоединиться.

## Настройка (подробно)

### Создание учетных данных

Используйте [Twitch Token Generator](https://twitchtokengenerator.com/):

- Выберите **Bot Token**
- Убедитесь, что выбраны области доступа `chat:read` и `chat:write`
- Скопируйте **Client ID** и **Access Token**

<Note>
Ручная регистрация приложения не нужна. Токены истекают через несколько часов.
</Note>

### Настройка бота

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

Если заданы и env, и конфиг, конфиг имеет приоритет.

### Контроль доступа (рекомендуется)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Предпочитайте `allowFrom` для жесткого списка разрешенных пользователей. Используйте `allowedRoles`, если нужен доступ на основе ролей.

**Доступные роли:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Почему ID пользователей?** Имена пользователей могут меняться, что допускает выдачу себя за другого. ID пользователей постоянны.

Найдите свой ID пользователя Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Преобразуйте свое имя пользователя Twitch в ID)
</Note>

## Обновление токена (необязательно)

Токены из [Twitch Token Generator](https://twitchtokengenerator.com/) нельзя обновлять автоматически — создавайте их заново после истечения срока действия.

Для автоматического обновления токена создайте собственное приложение Twitch в [Twitch Developer Console](https://dev.twitch.tv/console) и добавьте в конфиг:

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

Бот автоматически обновляет токены до истечения срока действия и записывает события обновления в журнал.

## Поддержка нескольких аккаунтов

Используйте `channels.twitch.accounts` с токенами для каждого аккаунта. Общий шаблон см. в разделе [Конфигурация](/ru/gateway/configuration).

Пример (один аккаунт бота в двух каналах):

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
Каждому аккаунту нужен собственный токен (один токен на канал).
</Note>

## Контроль доступа

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

    `allowFrom` — это жесткий список разрешенных пользователей. Если он задан, разрешены только эти ID пользователей. Если вам нужен доступ на основе ролей, не задавайте `allowFrom` и вместо этого настройте `allowedRoles`.

  </Tab>
  <Tab title="Disable @mention requirement">
    По умолчанию `requireMention` равно `true`. Чтобы отключить это требование и отвечать на все сообщения:

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

## Устранение неполадок

Сначала выполните диагностические команды:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot does not respond to messages">
    - **Проверьте контроль доступа:** Убедитесь, что ваш ID пользователя указан в `allowFrom`, или временно удалите `allowFrom` и задайте `allowedRoles: ["all"]` для проверки.
    - **Проверьте, что бот находится в канале:** Бот должен присоединиться к каналу, указанному в `channel`.

  </Accordion>
  <Accordion title="Token issues">
    "Failed to connect" или ошибки аутентификации:

    - Убедитесь, что `accessToken` — это значение токена доступа OAuth (обычно начинается с префикса `oauth:`)
    - Проверьте, что у токена есть области доступа `chat:read` и `chat:write`
    - Если используется обновление токена, убедитесь, что заданы `clientSecret` и `refreshToken`

  </Accordion>
  <Accordion title="Token refresh not working">
    Проверьте журналы на наличие событий обновления:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Если вы видите "token refresh disabled (no refresh token)":

    - Убедитесь, что указан `clientSecret`
    - Убедитесь, что указан `refreshToken`

  </Accordion>
</AccordionGroup>

## Конфиг

### Конфиг аккаунта

<ParamField path="username" type="string">
  Имя пользователя бота.
</ParamField>
<ParamField path="accessToken" type="string">
  Токен доступа OAuth с `chat:read` и `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Client ID Twitch (из Token Generator или вашего приложения).
</ParamField>
<ParamField path="channel" type="string" required>
  Канал, к которому нужно присоединиться.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Включить этот аккаунт.
</ParamField>
<ParamField path="clientSecret" type="string">
  Необязательно: для автоматического обновления токена.
</ParamField>
<ParamField path="refreshToken" type="string">
  Необязательно: для автоматического обновления токена.
</ParamField>
<ParamField path="expiresIn" type="number">
  Срок действия токена в секундах.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Метка времени получения токена.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Список разрешенных ID пользователей.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Контроль доступа на основе ролей.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Требовать @mention.
</ParamField>

### Параметры провайдера

- `channels.twitch.enabled` - Включить/отключить запуск канала
- `channels.twitch.username` - Имя пользователя бота (упрощенный конфиг для одного аккаунта)
- `channels.twitch.accessToken` - Токен доступа OAuth (упрощенный конфиг для одного аккаунта)
- `channels.twitch.clientId` - Client ID Twitch (упрощенный конфиг для одного аккаунта)
- `channels.twitch.channel` - Канал, к которому нужно присоединиться (упрощенный конфиг для одного аккаунта)
- `channels.twitch.accounts.<accountName>` - Конфиг для нескольких аккаунтов (все поля аккаунта выше)

Полный пример:

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

## Действия инструментов

Агент может вызвать `twitch` с действием:

- `send` - Отправить сообщение в канал

Пример:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Безопасность и эксплуатация

- **Обращайтесь с токенами как с паролями** — Никогда не коммитьте токены в git.
- **Используйте автоматическое обновление токенов** для долгоживущих ботов.
- **Используйте списки разрешенных ID пользователей** вместо имен пользователей для контроля доступа.
- **Отслеживайте журналы** на предмет событий обновления токенов и состояния подключения.
- **Минимизируйте области доступа токенов** — Запрашивайте только `chat:read` и `chat:write`.
- **Если вы застряли**: перезапустите Gateway после подтверждения, что никакой другой процесс не владеет сессией.

## Ограничения

- **500 символов** на сообщение (автоматически разбивается по границам слов).
- Markdown удаляется перед разбиением.
- Нет ограничения частоты отправки (используются встроенные ограничения частоты Twitch).

## Связанные разделы

- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сессий для сообщений
- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Группы](/ru/channels/groups) — поведение групповых чатов и ограничение по упоминанию
- [Pairing](/ru/channels/pairing) — аутентификация в DM и процесс Pairing
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
