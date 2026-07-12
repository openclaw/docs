---
read_when:
    - Настройка интеграции чата Twitch с OpenClaw
sidebarTitle: Twitch
summary: 'Чат-бот Twitch: установка, учетные данные, контроль доступа, обновление токена'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T11:13:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Поддержка чата Twitch через интерфейс чата Twitch (IRC) с использованием клиента Twurple. OpenClaw входит в систему под учётной записью бота Twitch, подключается к одному каналу для каждой настроенной учётной записи и отвечает в этом канале.

## Установка

Twitch поставляется как официальный Plugin и не входит в основную установку.

<Tabs>
  <Tab title="Реестр npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Локальная рабочая копия">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install` регистрирует и включает Plugin. При выборе Twitch во время `openclaw onboard` или `openclaw channels add` он устанавливается по требованию. Используйте имя пакета без версии, чтобы получать текущий выпуск; фиксируйте точную версию только для воспроизводимых установок. Требуется OpenClaw версии 2026.4.10 или новее.

Подробнее: [Плагины](/ru/tools/plugin)

## Быстрая настройка

<Steps>
  <Step title="Установите Plugin">
    См. раздел [Установка](#install) выше.
  </Step>
  <Step title="Создайте учётную запись бота Twitch">
    Создайте отдельную учётную запись Twitch для бота (или используйте существующую).
  </Step>
  <Step title="Создайте учётные данные">
    Используйте [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Выберите **Bot Token**
    - Убедитесь, что выбраны области доступа `chat:read` и `chat:write`
    - Скопируйте **Client ID** и **Access Token**

  </Step>
  <Step title="Найдите свой идентификатор пользователя Twitch">
    Используйте [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), чтобы преобразовать имя пользователя в идентификатор пользователя Twitch.
  </Step>
  <Step title="Настройте токен">
    - Переменная окружения: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (только для учётной записи по умолчанию)
    - Или конфигурация: `channels.twitch.accessToken`

    Если заданы оба варианта, конфигурация имеет приоритет (переменная окружения используется только как резервный вариант для учётной записи по умолчанию).

  </Step>
  <Step title="Запустите Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Добавьте контроль доступа (`allowFrom` или `allowedRoles`), чтобы неавторизованные пользователи не могли запускать бота. По умолчанию `requireMention` имеет значение `true`.
</Warning>

Минимальная конфигурация:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Учётная запись бота в Twitch (используется для аутентификации)
      accessToken: "oauth:abc123...", // Токен доступа OAuth (или используйте переменную окружения OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Идентификатор клиента из Token Generator
      channel: "yourchannel", // К чату какого канала Twitch подключаться (обязательно)
      allowFrom: ["123456789"], // (рекомендуется) Только ваш идентификатор пользователя Twitch
    },
  },
}
```

## Что это такое

- Канал Twitch, принадлежащий Gateway.
- Детерминированная маршрутизация: ответы всегда отправляются обратно в тот канал Twitch, из которого пришло сообщение.
- Каждому подключённому каналу соответствует изолированный ключ группового сеанса `agent:<agentId>:twitch:group:<channel>`.
- `username` — учётная запись бота (используемая для аутентификации), а `channel` — чат, к которому нужно подключиться. Одна запись учётной записи подключается ровно к одному каналу.
- Токены работают как с префиксом `oauth:`, так и без него; OpenClaw нормализует оба варианта (мастер настройки ожидает форму с `oauth:`).

## Обновление токена (необязательно)

Токены из [Twitch Token Generator](https://twitchtokengenerator.com/) не могут обновляться средствами OpenClaw — создайте новый токен после истечения срока действия (они действуют несколько часов; регистрация приложения не требуется).

Для автоматического обновления создайте собственное приложение в [Twitch Developer Console](https://dev.twitch.tv/console) и добавьте:

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

Если заданы оба параметра, Plugin использует провайдер аутентификации с обновлением, который обновляет токены до истечения срока их действия и регистрирует каждое обновление в журнале. Без `refreshToken` в журнал выводится `token refresh disabled (no refresh token)`; без `clientSecret` используется статический токен без обновления.

## Поддержка нескольких учётных записей

Используйте `channels.twitch.accounts` с отдельными учётными данными для каждой учётной записи. Общая схема описана в разделе [Конфигурация](/ru/gateway/configuration).

Пример (одна учётная запись бота в двух каналах):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "yourchannel",
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
Для каждой записи учётной записи требуется собственный `accessToken` (переменная окружения применяется только к учётной записи по умолчанию). Учётная запись подключается ровно к одному каналу, поэтому для подключения к двум каналам нужны две учётные записи. `channels.twitch.defaultAccount` определяет учётную запись по умолчанию.
</Note>

## Контроль доступа

`allowFrom` — строгий список разрешённых идентификаторов пользователей Twitch. Когда он задан, `allowedRoles` игнорируется; чтобы использовать доступ на основе ролей, не задавайте `allowFrom`.

**Доступные роли:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Список разрешённых идентификаторов пользователей (наиболее безопасно)">
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
  <Tab title="На основе ролей">
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
  </Tab>
  <Tab title="Отключение требования @упоминания">
    По умолчанию `requireMention` имеет значение `true`. Чтобы отвечать на все разрешённые сообщения:

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

<Note>
**Почему идентификаторы пользователей?** Имена пользователей могут изменяться, что позволяет выдавать себя за другого пользователя. Идентификаторы пользователей постоянны.

Найдите свой идентификатор с помощью [конвертера имени пользователя в идентификатор](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Устранение неполадок

Сначала выполните диагностические команды:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Бот не отвечает на сообщения">
    - **Проверьте контроль доступа:** убедитесь, что ваш идентификатор пользователя присутствует в `allowFrom`, либо для проверки временно удалите `allowFrom` и задайте `allowedRoles: ["all"]`.
    - **Проверьте условие упоминания:** при `requireMention: true` (значение по умолчанию) сообщения должны содержать @упоминание имени пользователя бота.
    - **Проверьте, что бот находится в канале:** бот подключается только к каналу, указанному в `channel`.

  </Accordion>
  <Accordion title="Проблемы с токеном">
    Ошибка «не удалось подключиться» или ошибки аутентификации:

    - Убедитесь, что `accessToken` содержит значение токена доступа OAuth (префикс `oauth:` необязателен)
    - Проверьте, что токен имеет области доступа `chat:read` и `chat:write`
    - Если используется обновление токена, убедитесь, что заданы `clientSecret` и `refreshToken`

  </Accordion>
  <Accordion title="Обновление токена не работает">
    Проверьте журнал на наличие событий обновления:

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Если отображается `token refresh disabled (no refresh token)`:

    - Убедитесь, что указан `clientSecret`
    - Убедитесь, что указан `refreshToken`

  </Accordion>
</AccordionGroup>

## Конфигурация

### Конфигурация учётной записи

<ParamField path="username" type="string" required>
  Имя пользователя бота (учётная запись, используемая для аутентификации).
</ParamField>
<ParamField path="accessToken" type="string" required>
  Токен доступа OAuth с областями доступа `chat:read` и `chat:write` (конфигурация или переменная окружения для учётной записи по умолчанию).
</ParamField>
<ParamField path="clientId" type="string" required>
  Идентификатор клиента Twitch (из Token Generator или вашего приложения). Необязателен в схеме, но необходим для подключения.
</ParamField>
<ParamField path="channel" type="string" required>
  Канал, к которому нужно подключиться.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Включить эту учётную запись.
</ParamField>
<ParamField path="clientSecret" type="string">
  Необязательно: для автоматического обновления токена.
</ParamField>
<ParamField path="refreshToken" type="string">
  Необязательно: для автоматического обновления токена.
</ParamField>
<ParamField path="expiresIn" type="number">
  Срок действия токена в секундах (для отслеживания обновления).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Временная метка получения токена (для отслеживания обновления).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Список разрешённых идентификаторов пользователей. Если он задан, роли игнорируются.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Контроль доступа на основе ролей.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Требовать @упоминание для запуска бота.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Переопределение префикса исходящих ответов для этой учётной записи.
</ParamField>

### Параметры провайдера

- `channels.twitch.enabled` — включение или отключение запуска канала
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` — упрощённая конфигурация одной учётной записи (неявная учётная запись `default`; имеет приоритет над `accounts.default`)
- `channels.twitch.accounts.<accountName>` — конфигурация нескольких учётных записей (все перечисленные выше поля учётной записи)
- `channels.twitch.defaultAccount` — имя учётной записи по умолчанию
- `channels.twitch.markdown.tables` — режим отображения таблиц Markdown (`off` | `bullets` | `code` | `block`)

Полный пример:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Действия инструментов

Агент может отправлять сообщения Twitch с помощью действия `send` инструмента сообщений:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` является необязательным параметром; по умолчанию используется настроенное для учётной записи значение `channel`.

## Безопасность и эксплуатация

- **Обращайтесь с токенами как с паролями** — никогда не добавляйте токены в git.
- **Используйте автоматическое обновление токенов** для длительно работающих ботов.
- **Используйте списки разрешённых идентификаторов пользователей**, а не имена пользователей, для контроля доступа.
- **Отслеживайте журналы**, чтобы контролировать события обновления токенов и состояние подключения.
- **Ограничивайте области доступа токенов до необходимого минимума** — запрашивайте только `chat:read` и `chat:write`.
- **Если не удаётся продолжить**: перезапустите Gateway, предварительно убедившись, что сеанс не используется другим процессом.

## Ограничения

- **500 символов** на сообщение; более длинные ответы разбиваются на части по границам слов.
- Перед отправкой разметка Markdown удаляется (чат Twitch использует обычный текст; переводы строк заменяются пробелами).
- OpenClaw не добавляет собственных ограничений частоты запросов; клиент чата Twurple обрабатывает ограничения Twitch.

## См. также

- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Группы](/ru/channels/groups) — поведение группового чата и условие упоминания
- [Сопряжение](/ru/channels/pairing) — аутентификация в личных сообщениях и процесс сопряжения
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
