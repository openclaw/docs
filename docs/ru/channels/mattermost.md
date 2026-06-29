---
read_when:
    - Настройка Mattermost
    - Отладка маршрутизации Mattermost
sidebarTitle: Mattermost
summary: Настройка бота Mattermost и конфигурация OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-06-28T22:35:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

Статус: загружаемый Plugin (токен бота + события WebSocket). Поддерживаются каналы, группы и личные сообщения. Mattermost — это командная платформа обмена сообщениями, которую можно размещать самостоятельно; сведения о продукте и загрузки см. на официальном сайте [mattermost.com](https://mattermost.com).

## Установка

Установите Mattermost перед настройкой канала:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Подробнее: [Plugins](/ru/tools/plugin)

## Быстрая настройка

<Steps>
  <Step title="Ensure plugin is available">
    Установите `@openclaw/mattermost` с помощью команды выше, затем перезапустите Gateway, если он уже запущен.
  </Step>
  <Step title="Create a Mattermost bot">
    Создайте учетную запись бота Mattermost и скопируйте **токен бота**.
  </Step>
  <Step title="Copy the base URL">
    Скопируйте **базовый URL** Mattermost (например, `https://chat.example.com`).
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
    Минимальная конфигурация:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

  </Step>
</Steps>

## Нативные слеш-команды

Нативные слеш-команды включаются отдельно. Когда они включены, OpenClaw регистрирует слеш-команды `oc_*` через API Mattermost и получает callback POST-запросы на HTTP-сервере Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Behavior notes">
    - `native: "auto"` по умолчанию отключено для Mattermost. Установите `native: true`, чтобы включить.
    - Если `callbackUrl` не указан, OpenClaw формирует его из хоста/порта Gateway + `callbackPath`.
    - Для настроек с несколькими учетными записями `commands` можно задать на верхнем уровне или в `channels.mattermost.accounts.<id>.commands` (значения учетной записи переопределяют поля верхнего уровня).
    - Callback-запросы команд проверяются с помощью токенов для каждой команды, возвращенных Mattermost при регистрации OpenClaw команд `oc_*`.
    - OpenClaw обновляет текущую регистрацию команд Mattermost перед приемом каждого callback-запроса, поэтому устаревшие токены удаленных или заново созданных слеш-команд перестают приниматься без перезапуска Gateway.
    - Проверка callback-запроса завершается закрыто, если API Mattermost не может подтвердить, что команда все еще актуальна; неудачные проверки кратковременно кэшируются, параллельные lookup-запросы объединяются, а запуск свежих lookup-запросов ограничивается по частоте для каждой команды, чтобы сдерживать нагрузку от повторного воспроизведения.
    - Callback-запросы слеш-команд завершаются закрыто, если регистрация не удалась, запуск был частичным или токен callback-запроса не совпадает с зарегистрированным токеном найденной команды (токен, действительный для одной команды, не может пройти upstream-проверку для другой команды).

  </Accordion>
  <Accordion title="Reachability requirement">
    Конечная точка callback должна быть доступна с сервера Mattermost.

    - Не задавайте `callbackUrl` как `localhost`, если Mattermost не работает на том же хосте или в том же сетевом namespace, что и OpenClaw.
    - Не задавайте `callbackUrl` как базовый URL Mattermost, если этот URL не проксирует `/api/channels/mattermost/command` обратно в OpenClaw.
    - Быстрая проверка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET должен вернуть от OpenClaw `405 Method Not Allowed`, а не `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    Если ваш callback указывает на частные/tailnet/внутренние адреса, настройте Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`, включив туда хост/домен callback.

    Используйте записи хоста/домена, а не полные URL.

    - Хорошо: `gateway.tailnet-name.ts.net`
    - Плохо: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Переменные окружения (учетная запись по умолчанию)

Задайте их на хосте Gateway, если предпочитаете переменные окружения:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Переменные окружения применяются только к учетной записи **по умолчанию** (`default`). Для других учетных записей нужно использовать значения конфигурации.

`MATTERMOST_URL` нельзя задать из workspace `.env`; см. [файлы workspace `.env`](/ru/gateway/security).
</Note>

## Режимы чата

Mattermost автоматически отвечает на личные сообщения. Поведение в каналах управляется `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Отвечать в каналах только при @упоминании.
  </Tab>
  <Tab title="onmessage">
    Отвечать на каждое сообщение в канале.
  </Tab>
  <Tab title="onchar">
    Отвечать, когда сообщение начинается с префикса-триггера.
  </Tab>
</Tabs>

Пример конфигурации:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Примечания:

- `onchar` все равно отвечает на явные @упоминания.
- `channels.mattermost.requireMention` учитывается для устаревших конфигураций, но предпочтителен `chatmode`.
- После того как бот отправит видимый ответ в ветке канала, последующие сообщения в той же ветке получают ответ без нового @упоминания или префикса `onchar`, поэтому многоходовые обсуждения в ветке продолжаются без прерываний. Участие запоминается на 7 дней неактивности ветки (обновляется при каждом ответе) и сохраняется после перезапуска Gateway. Ветки, которые бот только наблюдал, не затрагиваются; начните новое сообщение верхнего уровня, чтобы снова требовать явное упоминание.

## Ветки и сеансы

Используйте `channels.mattermost.replyToMode`, чтобы управлять тем, остаются ли ответы в каналах и группах в основном канале или начинают ветку под сообщением-триггером.

- `off` (по умолчанию): отвечать в ветке только тогда, когда входящий пост уже находится в ветке.
- `first`: для постов верхнего уровня в канале/группе начать ветку под этим постом и направить разговор в сеанс, scoped к ветке.
- `all`: сегодня для Mattermost поведение такое же, как у `first`.
- Личные сообщения игнорируют этот параметр и остаются без веток.

Пример конфигурации:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Примечания:

- Сеансы, scoped к ветке, используют id поста-триггера как корень ветки.
- `first` и `all` сейчас эквивалентны, потому что после появления корня ветки в Mattermost последующие фрагменты и медиа продолжаются в той же ветке.

## Контроль доступа (личные сообщения)

- По умолчанию: `channels.mattermost.dmPolicy = "pairing"` (неизвестные отправители получают код сопряжения).
- Одобрение через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публичные личные сообщения: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` принимает записи `accessGroup:<name>`. См. [группы доступа](/ru/channels/access-groups).

## Каналы (группы)

- По умолчанию: `channels.mattermost.groupPolicy = "allowlist"` (с ограничением по упоминанию).
- Разрешайте отправителей через `channels.mattermost.groupAllowFrom` (рекомендуются ID пользователей).
- `channels.mattermost.groupAllowFrom` принимает записи `accessGroup:<name>`. См. [группы доступа](/ru/channels/access-groups).
- Переопределения упоминаний для отдельных каналов находятся в `channels.mattermost.groups.<channelId>.requireMention` или `channels.mattermost.groups["*"].requireMention` для значения по умолчанию.
- Сопоставление `@username` изменяемо и включается только при `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Открытые каналы: `channels.mattermost.groupPolicy="open"` (с ограничением по упоминанию).
- Примечание о runtime: если `channels.mattermost` полностью отсутствует, runtime откатывается к `groupPolicy="allowlist"` для проверок групп (даже если задан `channels.defaults.groupPolicy`).

Пример:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Цели для исходящей доставки

Используйте эти форматы целей с `openclaw message send` или cron/webhooks:

- `channel:<id>` для канала
- `user:<id>` для личного сообщения
- `@username` для личного сообщения (разрешается через API Mattermost)

<Warning>
Простые непрозрачные ID (например, `64ifufp...`) в Mattermost **неоднозначны** (ID пользователя или ID канала).

OpenClaw разрешает их **сначала как пользователя**:

- Если ID существует как пользователь (`GET /api/v4/users/<id>` успешен), OpenClaw отправляет **личное сообщение**, разрешая прямой канал через `/api/v4/channels/direct`.
- Иначе ID считается **ID канала**.

Если вам нужно детерминированное поведение, всегда используйте явные префиксы (`user:<id>` / `channel:<id>`).
</Warning>

## Повторные попытки для DM-канала

Когда OpenClaw отправляет сообщение в цель Mattermost DM и сначала должен разрешить прямой канал, он по умолчанию повторяет временные сбои создания прямого канала.

Используйте `channels.mattermost.dmChannelRetry`, чтобы настроить это поведение глобально для Mattermost Plugin, или `channels.mattermost.accounts.<id>.dmChannelRetry` для одной учетной записи.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Примечания:

- Это применяется только к созданию DM-канала (`/api/v4/channels/direct`), а не к каждому вызову API Mattermost.
- Повторные попытки применяются к временным сбоям, таким как лимиты частоты, ответы 5xx, а также сетевые ошибки или тайм-ауты.
- Клиентские ошибки 4xx, кроме `429`, считаются постоянными и не повторяются.

## Потоковый предпросмотр

Mattermost передает размышления, активность инструментов и частичный текст ответа в один **черновой пост предпросмотра**, который финализируется на месте, когда итоговый ответ безопасно отправлять. Предпросмотр обновляется в том же id поста, вместо того чтобы засорять канал сообщениями для каждого фрагмента. Финальные медиа/ошибки отменяют ожидающие правки предпросмотра и используют обычную доставку вместо сброса одноразового поста предпросмотра.

Включите через `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Streaming modes">
    - `partial` — обычный выбор: один пост предпросмотра, который редактируется по мере роста ответа, затем финализируется полным ответом.
    - `block` использует черновые фрагменты в стиле append внутри поста предпросмотра.
    - `progress` показывает статусный предпросмотр во время генерации и публикует итоговый ответ только при завершении.
    - `off` отключает потоковый предпросмотр.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - Если поток нельзя финализировать на месте (например, пост был удален в середине потока), OpenClaw откатывается к отправке нового финального поста, чтобы ответ никогда не потерялся.
    - Payloads только с размышлениями подавляются в постах канала, включая текст, который приходит как blockquote `> Thinking`. Установите `/reasoning on`, чтобы видеть размышления на других поверхностях; финальный пост Mattermost сохраняет только ответ.
    - См. [Streaming](/ru/concepts/streaming#preview-streaming-modes) для матрицы сопоставления каналов.

  </Accordion>
</AccordionGroup>

## Реакции (инструмент сообщений)

- Используйте `message action=react` с `channel=mattermost`.
- `messageId` — это id поста Mattermost.
- `emoji` принимает имена вроде `thumbsup` или `:+1:` (двоеточия необязательны).
- Установите `remove=true` (boolean), чтобы удалить реакцию.
- События добавления/удаления реакций пересылаются как системные события в маршрутизированный сеанс агента.

Примеры:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфигурация:

- `channels.mattermost.actions.reactions`: включить/отключить действия реакций (по умолчанию true).
- Переопределение для учетной записи: `channels.mattermost.accounts.<id>.actions.reactions`.

## Интерактивные кнопки (инструмент сообщений)

Отправляйте сообщения с кликабельными кнопками. Когда пользователь нажимает кнопку, агент получает выбор и может ответить.

Обычные ответы агента также могут включать семантические полезные нагрузки `presentation`. OpenClaw отображает кнопки значений как интерактивные кнопки Mattermost, оставляет URL-кнопки видимыми в тексте сообщения и преобразует меню выбора в читаемый текст.

Включите кнопки, добавив `inlineButtons` в возможности канала:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Используйте `message action=send` с параметром `buttons`. Кнопки — это двумерный массив (строки кнопок):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Поля кнопок:

<ParamField path="text" type="string" required>
  Отображаемая метка.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Значение, отправляемое обратно при нажатии (используется как ID действия).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Стиль кнопки.
</ParamField>

Когда пользователь нажимает кнопку:

<Steps>
  <Step title="Buttons replaced with confirmation">
    Все кнопки заменяются строкой подтверждения (например, "✓ **Yes** выбрано @user").
  </Step>
  <Step title="Agent receives the selection">
    Агент получает выбранный вариант как входящее сообщение и отвечает.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - Обратные вызовы кнопок используют проверку HMAC-SHA256 (автоматически, настройка не требуется).
    - Mattermost удаляет данные обратного вызова из своих ответов API (функция безопасности), поэтому при нажатии удаляются все кнопки — частичное удаление невозможно.
    - ID действий, содержащие дефисы или подчёркивания, автоматически очищаются (ограничение маршрутизации Mattermost).

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: массив строк возможностей. Добавьте `"inlineButtons"`, чтобы включить описание инструмента кнопок в системном промпте агента.
    - `channels.mattermost.interactions.callbackBaseUrl`: необязательный внешний базовый URL для обратных вызовов кнопок (например, `https://gateway.example.com`). Используйте это, когда Mattermost не может напрямую достичь Gateway на его bind-хосте.
    - В конфигурациях с несколькими аккаунтами то же поле можно также задать в `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Если `interactions.callbackBaseUrl` опущен, OpenClaw выводит URL обратного вызова из `gateway.customBindHost` + `gateway.port`, затем откатывается к `http://localhost:<port>`.
    - Правило доступности: URL обратного вызова кнопки должен быть доступен с сервера Mattermost. `localhost` работает только когда Mattermost и OpenClaw запущены на одном хосте/в одном сетевом пространстве имён.
    - Если цель обратного вызова приватная/tailnet/внутренняя, добавьте её хост/домен в `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost.

  </Accordion>
</AccordionGroup>

### Прямая интеграция API (внешние скрипты)

Внешние скрипты и Webhook могут публиковать кнопки напрямую через Mattermost REST API вместо использования инструмента агента `message`. По возможности используйте `buildButtonAttachments()` из Plugin; если публикуете сырой JSON, следуйте этим правилам:

**Структура полезной нагрузки:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Критически важные правила**

1. Вложения указываются в `props.attachments`, а не в `attachments` верхнего уровня (иначе молча игнорируются).
2. Каждому действию нужен `type: "button"` — без него нажатия молча проглатываются.
3. Каждому действию нужно поле `id` — Mattermost игнорирует действия без ID.
4. `id` действия должен содержать **только буквы и цифры** (`[a-zA-Z0-9]`). Дефисы и подчёркивания ломают серверную маршрутизацию действий Mattermost (возвращается 404). Удаляйте их перед использованием.
5. `context.action_id` должен совпадать с `id` кнопки, чтобы сообщение подтверждения показывало имя кнопки (например, "Approve"), а не сырой ID.
6. `context.action_id` обязателен — без него обработчик взаимодействий возвращает 400.

</Warning>

**Генерация токена HMAC**

Gateway проверяет нажатия кнопок с помощью HMAC-SHA256. Внешние скрипты должны генерировать токены, соответствующие логике проверки Gateway:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    Создайте объект контекста со всеми полями, **кроме** `_token`.
  </Step>
  <Step title="Serialize with sorted keys">
    Сериализуйте с **отсортированными ключами** и **без пробелов** (Gateway использует `JSON.stringify` с отсортированными ключами, что даёт компактный вывод).
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    Добавьте полученный шестнадцатеричный дайджест как `_token` в контекст.
  </Step>
</Steps>

Пример на Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Common HMAC pitfalls">
    - Python `json.dumps` по умолчанию добавляет пробелы (`{"key": "val"}`). Используйте `separators=(",", ":")`, чтобы соответствовать компактному выводу JavaScript (`{"key":"val"}`).
    - Всегда подписывайте **все** поля контекста (за вычетом `_token`). Gateway удаляет `_token`, затем подписывает всё оставшееся. Подпись подмножества приводит к тихому сбою проверки.
    - Используйте `sort_keys=True` — Gateway сортирует ключи перед подписью, а Mattermost может переупорядочить поля контекста при сохранении полезной нагрузки.
    - Выводите секрет из токена бота (детерминированно), а не из случайных байтов. Секрет должен быть одинаковым в процессе, который создаёт кнопки, и в Gateway, который проверяет.

  </Accordion>
</AccordionGroup>

## Адаптер каталога

Plugin Mattermost включает адаптер каталога, который разрешает имена каналов и пользователей через Mattermost API. Это включает цели `#channel-name` и `@username` в `openclaw message send` и доставках Cron/Webhook.

Конфигурация не требуется — адаптер использует токен бота из конфигурации аккаунта.

## Несколько аккаунтов

Mattermost поддерживает несколько аккаунтов в `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Устранение неполадок

<AccordionGroup>
  <Accordion title="No replies in channels">
    Убедитесь, что бот находится в канале, и упомяните его (oncall), используйте префикс-триггер (onchar) или задайте `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - Проверьте токен бота, базовый URL и включён ли аккаунт.
    - Проблемы с несколькими аккаунтами: переменные окружения применяются только к аккаунту `default`.

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`: OpenClaw не принял токен обратного вызова. Типичные причины:
      - регистрация slash-команды завершилась неудачно или только частично при запуске
      - обратный вызов попадает не в тот Gateway/аккаунт
      - в Mattermost всё ещё есть старые команды, указывающие на предыдущую цель обратного вызова
      - Gateway был перезапущен без повторной активации slash-команд
    - Если встроенные slash-команды перестают работать, проверьте журналы на наличие `mattermost: failed to register slash commands` или `mattermost: native slash commands enabled but no commands could be registered`.
    - Если `callbackUrl` опущен и журналы предупреждают, что обратный вызов разрешился в `http://127.0.0.1:18789/...`, этот URL, вероятно, доступен только когда Mattermost запущен на том же хосте/в том же сетевом пространстве имён, что и OpenClaw. Вместо этого задайте явный внешне доступный `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Buttons issues">
    - Кнопки отображаются как белые прямоугольники: агент может отправлять некорректно сформированные данные кнопок. Проверьте, что у каждой кнопки есть оба поля: `text` и `callback_data`.
    - Кнопки отображаются, но нажатия ничего не делают: проверьте, что `AllowedUntrustedInternalConnections` в конфигурации сервера Mattermost включает `127.0.0.1 localhost`, и что `EnablePostActionIntegration` имеет значение `true` в ServiceSettings.
    - Кнопки возвращают 404 при нажатии: `id` кнопки, вероятно, содержит дефисы или подчёркивания. Маршрутизатор действий Mattermost ломается на неалфавитно-цифровых ID. Используйте только `[a-zA-Z0-9]`.
    - Журналы Gateway показывают `invalid _token`: несоответствие HMAC. Проверьте, что вы подписываете все поля контекста (а не подмножество), используете отсортированные ключи и компактный JSON (без пробелов). См. раздел HMAC выше.
    - Журналы Gateway показывают `missing _token in context`: поле `_token` отсутствует в контексте кнопки. Убедитесь, что оно включено при построении полезной нагрузки интеграции.
    - Подтверждение показывает сырой ID вместо имени кнопки: `context.action_id` не совпадает с `id` кнопки. Задайте для обоих одно и то же очищенное значение.
    - Агент не знает о кнопках: добавьте `capabilities: ["inlineButtons"]` в конфигурацию канала Mattermost.

  </Accordion>
</AccordionGroup>

## Связанные материалы

- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Группы](/ru/channels/groups) — поведение группового чата и ограничение по упоминаниям
- [Сопряжение](/ru/channels/pairing) — аутентификация DM и поток сопряжения
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
