---
read_when:
    - Настройка поддержки Signal
    - Отладка отправки и получения в Signal
summary: Поддержка Signal через signal-cli (нативный демон или контейнер bbernhard), пути настройки и модель номера
title: Signal
x-i18n:
    generated_at: "2026-06-28T22:36:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f4d82f43a11494d371a9af9a8e55b227364594a5a144b5a4d8690e865d9ade8
    source_path: channels/signal.md
    workflow: 16
---

Статус: внешняя интеграция с CLI. Gateway взаимодействует с `signal-cli` по HTTP — через нативный демон (JSON-RPC + SSE) или контейнер bbernhard/signal-cli-rest-api (REST + WebSocket).

## Предварительные требования

- OpenClaw установлен на вашем сервере (поток для Linux ниже протестирован на Ubuntu 24).
- Один из вариантов:
  - `signal-cli` доступен на хосте (нативный режим), **или**
  - Docker-контейнер `bbernhard/signal-cli-rest-api` (контейнерный режим).
- Номер телефона, который может получить одно проверочное SMS (для регистрации через SMS).
- Доступ к браузеру для капчи Signal (`signalcaptchas.org`) во время регистрации.

## Быстрая настройка (для начинающих)

1. Используйте **отдельный номер Signal** для бота (рекомендуется).
2. Установите Plugin OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. Установите `signal-cli` (если используете сборку JVM, требуется Java).
4. Выберите один путь настройки:
   - **Путь A (привязка по QR):** `signal-cli link -n "OpenClaw"` и отсканируйте код в Signal.
   - **Путь B (регистрация по SMS):** зарегистрируйте выделенный номер с капчей и SMS-проверкой.
5. Настройте OpenClaw и перезапустите Gateway.
6. Отправьте первое личное сообщение и подтвердите сопряжение (`openclaw pairing approve signal <CODE>`).

Минимальная конфигурация:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Справочник полей:

| Поле         | Описание                                                   |
| ------------ | ---------------------------------------------------------- |
| `account`    | Номер телефона бота в формате E.164 (`+15551234567`)       |
| `cliPath`    | Путь к `signal-cli` (`signal-cli`, если он находится в `PATH`) |
| `configPath` | Каталог конфигурации signal-cli, передаваемый как `--config` |
| `dmPolicy`   | Политика доступа к личным сообщениям (рекомендуется `pairing`) |
| `allowFrom`  | Номера телефонов или значения `uuid:<id>`, которым разрешены личные сообщения |

## Что это такое

- Канал Signal через `signal-cli` (не встроенный libsignal).
- Детерминированная маршрутизация: ответы всегда возвращаются в Signal.
- Личные сообщения используют основную сессию агента; группы изолированы (`agent:<agentId>:signal:group:<groupId>`).

## Запись конфигурации

По умолчанию Signal может записывать обновления конфигурации, вызванные `/config set|unset` (требуется `commands.config: true`).

Отключить можно так:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Модель номера (важно)

- Gateway подключается к **устройству Signal** (учетной записи `signal-cli`).
- Если вы запускаете бота на **своей личной учетной записи Signal**, он будет игнорировать ваши собственные сообщения (защита от зацикливания).
- Для сценария «я пишу боту, а он отвечает» используйте **отдельный номер бота**.

## Путь настройки A: привязать существующую учетную запись Signal (QR)

1. Установите `signal-cli` (сборку JVM или нативную сборку).
2. Привяжите учетную запись бота:
   - `signal-cli link -n "OpenClaw"`, затем отсканируйте QR в Signal.
3. Настройте Signal и запустите Gateway.

Пример:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Поддержка нескольких учетных записей: используйте `channels.signal.accounts` с конфигурацией для каждой учетной записи и необязательным `name`. Общий шаблон см. в разделе [`gateway/configuration`](/ru/gateway/config-channels#multi-account-all-channels).

## Путь настройки B: зарегистрировать выделенный номер бота (SMS, Linux)

Используйте этот вариант, когда нужен выделенный номер бота вместо привязки существующей учетной записи приложения Signal.

1. Получите номер, который может принимать SMS (или голосовую проверку для стационарных номеров).
   - Используйте выделенный номер бота, чтобы избежать конфликтов учетной записи и сессии.
2. Установите `signal-cli` на хосте Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Если используете сборку JVM (`signal-cli-${VERSION}.tar.gz`), сначала установите JRE 25+.
Поддерживайте `signal-cli` в актуальном состоянии; upstream отмечает, что старые релизы могут ломаться при изменениях серверных API Signal.

3. Зарегистрируйте и подтвердите номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Если требуется капча:

1. Откройте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдите капчу, скопируйте целевой адрес ссылки `signalcaptcha://...` из «Открыть Signal».
3. По возможности запускайте команду с того же внешнего IP, что и браузерная сессия.
4. Сразу повторите регистрацию (токены капчи быстро истекают):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Настройте OpenClaw, перезапустите Gateway, проверьте канал:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Сопрягите отправителя личных сообщений:
   - Отправьте любое сообщение на номер бота.
   - Подтвердите код на сервере: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Сохраните номер бота как контакт на телефоне, чтобы избежать пометки «Неизвестный контакт».

<Warning>
Регистрация учетной записи телефонного номера через `signal-cli` может деавторизовать основную сессию приложения Signal для этого номера. Предпочитайте выделенный номер бота или используйте режим привязки по QR, если нужно сохранить текущую настройку приложения на телефоне.
</Warning>

Ссылки upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Поток капчи: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Поток привязки: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим внешнего демона (httpUrl)

Если вы хотите управлять `signal-cli` самостоятельно (медленные холодные запуски JVM, инициализация контейнера или общие CPU), запустите демон отдельно и укажите OpenClaw путь к нему:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Это пропускает автоматический запуск процесса и ожидание старта внутри OpenClaw. Для медленных запусков при автоматическом запуске задайте `channels.signal.startupTimeoutMs`.

## Контейнерный режим (bbernhard/signal-cli-rest-api)

Вместо нативного запуска `signal-cli` можно использовать Docker-контейнер [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Он оборачивает `signal-cli` в REST API и интерфейс WebSocket.

Требования:

- Контейнер **должен** запускаться с `MODE=json-rpc` для получения сообщений в реальном времени.
- Зарегистрируйте или привяжите учетную запись Signal внутри контейнера перед подключением OpenClaw.

Пример сервиса `docker-compose.yml`:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

Конфигурация OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

Поле `apiMode` управляет тем, какой протокол использует OpenClaw:

| Значение      | Поведение                                                                            |
| ------------- | ------------------------------------------------------------------------------------- |
| `"auto"`      | (По умолчанию) Проверяет оба транспорта; потоковая передача валидирует получение через WebSocket контейнера |
| `"native"`    | Принудительно использовать нативный signal-cli (JSON-RPC на `/api/v1/rpc`, SSE на `/api/v1/events`) |
| `"container"` | Принудительно использовать контейнер bbernhard (REST на `/v2/send`, WebSocket на `/v1/receive/{account}`) |

Когда `apiMode` равен `"auto"`, OpenClaw кэширует обнаруженный режим на 30 секунд, чтобы избежать повторных проверок. Получение через контейнер выбирается для потоковой передачи только после того, как `/v1/receive/{account}` обновляется до WebSocket, что требует `MODE=json-rpc`.

Контейнерный режим поддерживает те же операции канала Signal, что и нативный режим, если контейнер предоставляет соответствующие API: отправка, получение, вложения, индикаторы набора, квитанции о прочтении/просмотре, реакции, группы и стилизованный текст. OpenClaw преобразует свои нативные RPC-вызовы Signal в REST-полезные нагрузки контейнера, включая ID групп `group.{base64(internal_id)}` и `text_mode: "styled"` для форматированного текста.

Операционные заметки:

- Используйте `autoStart: false` с контейнерным режимом. OpenClaw не должен запускать нативный демон, когда выбран `apiMode: "container"`.
- Используйте `MODE=json-rpc` для получения. `MODE=normal` может сделать `/v1/about` визуально исправным, но `/v1/receive/{account}` не обновляется до WebSocket, поэтому OpenClaw не выберет потоковое получение через контейнер в режиме `auto`.
- Задайте `apiMode: "container"`, когда вы знаете, что `httpUrl` указывает на REST API bbernhard. Задайте `apiMode: "native"`, когда вы знаете, что он указывает на нативный JSON-RPC/SSE `signal-cli`. Используйте `"auto"`, когда развертывание может различаться.
- Скачивание вложений в контейнерном режиме соблюдает те же лимиты байтов медиа, что и нативный режим. Слишком большие ответы отклоняются до полного буферизации, когда сервер отправляет `Content-Length`, а иначе — во время потоковой передачи.

## Управление доступом (личные сообщения + группы)

Личные сообщения:

- По умолчанию: `channels.signal.dmPolicy = "pairing"`.
- Неизвестные отправители получают код сопряжения; сообщения игнорируются до подтверждения (коды истекают через 1 час).
- Подтвердить можно через:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Сопряжение — стандартный обмен токенами для личных сообщений Signal. Подробности: [Сопряжение](/ru/channels/pairing)
- Отправители только с UUID (из `sourceUuid`) сохраняются как `uuid:<id>` в `channels.signal.allowFrom`.

Группы:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` управляет тем, какие группы или отправители могут запускать ответы в группе, когда задан `allowlist`; записями могут быть ID групп Signal (сырые, `group:<id>` или `signal:group:<id>`), номера телефонов отправителей, значения `uuid:<id>` или `*`.
- `channels.signal.groups["<group-id>" | "*"]` может переопределять поведение групп с помощью `requireMention`, `tools` и `toolsBySender`.
- Используйте `channels.signal.accounts.<id>.groups` для переопределений на уровне учетной записи в настройках с несколькими учетными записями.
- Добавление группы Signal в список разрешенных через `groupAllowFrom` само по себе не отключает требование упоминания. Специально настроенная запись `channels.signal.groups["<group-id>"]` обрабатывает каждое сообщение группы, если не задано `requireMention=true`.
- Примечание о времени выполнения: если `channels.signal` полностью отсутствует, во время выполнения для проверок групп используется резервное значение `groupPolicy="allowlist"` (даже если задано `channels.defaults.groupPolicy`).

## Как это работает (поведение)

- Нативный режим: `signal-cli` работает как демон; Gateway читает события через SSE.
- Контейнерный режим: Gateway отправляет через REST API и получает через WebSocket.
- Входящие сообщения нормализуются в общий конверт канала.
- Ответы всегда маршрутизируются обратно на тот же номер или в ту же группу.

## Медиа и лимиты

- Исходящий текст разбивается на части по `channels.signal.textChunkLimit` (по умолчанию 4000).
- Необязательное разбиение по переводам строк: задайте `channels.signal.chunkMode="newline"`, чтобы разбивать по пустым строкам (границам абзацев) перед разбиением по длине.
- Вложения поддерживаются (base64 загружается из `signal-cli`).
- Вложения голосовых заметок используют имя файла `signal-cli` как резервный MIME-вариант, когда `contentType` отсутствует, чтобы транскрибация аудио по-прежнему могла классифицировать голосовые заметки AAC.
- Лимит медиа по умолчанию: `channels.signal.mediaMaxMb` (по умолчанию 8).
- Используйте `channels.signal.ignoreAttachments`, чтобы пропускать скачивание медиа.
- Контекст истории групп использует `channels.signal.historyLimit` (или `channels.signal.accounts.*.historyLimit`), с резервным переходом к `messages.groupChat.historyLimit`. Задайте `0`, чтобы отключить (по умолчанию 50).

## Набор текста и квитанции о прочтении

- **Индикаторы набора текста**: OpenClaw отправляет сигналы набора текста через `signal-cli sendTyping` и обновляет их, пока выполняется ответ.
- **Уведомления о прочтении**: когда `channels.signal.sendReadReceipts` равно true, OpenClaw пересылает уведомления о прочтении для разрешенных личных сообщений.
- Signal-cli не предоставляет уведомления о прочтении для групп.

## Реакции (инструмент message)

- Используйте `message action=react` с `channel=signal`.
- Цели: E.164 отправителя или UUID (используйте `uuid:<id>` из вывода сопряжения; простой UUID тоже работает).
- `messageId` — это временная метка Signal для сообщения, на которое вы реагируете.
- Для групповых реакций требуется `targetAuthor` или `targetAuthorUuid`.

Примеры:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Конфигурация:

- `channels.signal.actions.reactions`: включить/отключить действия реакций (по умолчанию true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` отключает реакции агента (инструмент message `react` вернет ошибку).
  - `minimal`/`extensive` включает реакции агента и задает уровень рекомендаций.
- Переопределения для отдельных учетных записей: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Реакции подтверждения

Подсказки подтверждения exec и plugin используют маршрутизирующие блоки верхнего уровня `approvals.exec` и
`approvals.plugin`. У Signal нет блока
`channels.signal.execApprovals`.

- `👍` подтверждает один раз.
- `👎` отклоняет.
- Используйте `/approve <id> allow-always`, когда запрос предлагает постоянное подтверждение.

Для разрешения реакции подтверждения требуются явные утверждающие лица Signal из
`channels.signal.allowFrom`, `channels.signal.defaultTo` или соответствующих полей уровня учетной записи.
Прямые подсказки подтверждения exec в том же чате все еще могут подавлять дублирующий локальный резервный вариант `/approve`
без явных утверждающих лиц; групповые подтверждения без утверждающих лиц оставляют локальный резервный вариант видимым.

## Цели доставки (CLI/cron)

- Личные сообщения: `signal:+15551234567` (или простой E.164).
- Личные сообщения UUID: `uuid:<id>` (или простой UUID).
- Группы: `signal:group:<groupId>`.
- Имена пользователей: `username:<name>` (если поддерживается вашей учетной записью Signal).

## Устранение неполадок

Сначала выполните эту последовательность:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Затем при необходимости подтвердите состояние сопряжения личных сообщений:

```bash
openclaw pairing list signal
```

Типичные сбои:

- Демон доступен, но ответов нет: проверьте настройки учетной записи/демона (`httpUrl`, `account`) и режим приема.
- Личные сообщения игнорируются: отправитель ожидает подтверждения сопряжения.
- Групповые сообщения игнорируются: фильтрация отправителя/упоминаний группы блокирует доставку.
- Ошибки проверки конфигурации после правок: выполните `openclaw doctor --fix`.
- Signal отсутствует в диагностике: подтвердите `channels.signal.enabled: true`.

Дополнительные проверки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Процесс триажа: [/channels/troubleshooting](/ru/channels/troubleshooting).

## Примечания по безопасности

- `signal-cli` хранит ключи учетной записи локально (обычно в `~/.local/share/signal-cli/data/`).
- Создайте резервную копию состояния учетной записи Signal перед миграцией сервера или пересборкой.
- Сохраняйте `channels.signal.dmPolicy: "pairing"`, если вам явно не нужен более широкий доступ к личным сообщениям.
- SMS-проверка нужна только для регистрации или восстановления, но потеря контроля над номером/учетной записью может усложнить повторную регистрацию.

## Справочник по конфигурации (Signal)

Полная конфигурация: [Конфигурация](/ru/gateway/configuration)

Параметры провайдера:

- `channels.signal.enabled`: включить/отключить запуск канала.
- `channels.signal.apiMode`: `auto | native | container` (по умолчанию: auto). См. [Контейнерный режим](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 для учетной записи бота.
- `channels.signal.cliPath`: путь к `signal-cli`.
- `channels.signal.configPath`: необязательный каталог `signal-cli --config`.
- `channels.signal.httpUrl`: полный URL демона (переопределяет host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: привязка демона (по умолчанию 127.0.0.1:8080).
- `channels.signal.autoStart`: автоматически запускать демон (по умолчанию true, если `httpUrl` не задан).
- `channels.signal.startupTimeoutMs`: время ожидания запуска в мс (предел 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропускать скачивание вложений.
- `channels.signal.ignoreStories`: игнорировать истории от демона.
- `channels.signal.sendReadReceipts`: пересылать уведомления о прочтении.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (по умолчанию: pairing).
- `channels.signal.allowFrom`: список разрешенных личных сообщений (E.164 или `uuid:<id>`). Для `open` требуется `"*"`. В Signal нет имен пользователей; используйте телефонные номера/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (по умолчанию: allowlist).
- `channels.signal.groupAllowFrom`: список разрешенных групп; принимает идентификаторы групп Signal (raw, `group:<id>` или `signal:group:<id>`), номера отправителей E.164 или значения `uuid:<id>`.
- `channels.signal.groups`: переопределения для отдельных групп, ключ — id группы Signal (или `"*"`). Поддерживаемые поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версия `channels.signal.groups` для отдельных учетных записей в конфигурациях с несколькими учетными записями.
- `channels.signal.historyLimit`: максимальное количество групповых сообщений, включаемых как контекст (0 отключает).
- `channels.signal.dmHistoryLimit`: лимит истории личных сообщений в пользовательских ходах. Переопределения для отдельных пользователей: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: размер исходящего фрагмента (символы).
- `channels.signal.chunkMode`: `length` (по умолчанию) или `newline` для разбиения по пустым строкам (границам абзацев) перед разбиением по длине.
- `channels.signal.mediaMaxMb`: ограничение входящих/исходящих медиа (МБ).

Связанные глобальные параметры:

- `agents.list[].groupChat.mentionPatterns` (Signal не поддерживает нативные упоминания).
- `messages.groupChat.mentionPatterns` (глобальный резервный вариант).
- `messages.responsePrefix`.

## Связанное

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Сопряжение](/ru/channels/pairing) — аутентификация личных сообщений и процесс сопряжения
- [Группы](/ru/channels/groups) — поведение группового чата и фильтрация упоминаний
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
