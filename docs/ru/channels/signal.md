---
read_when:
    - Настройка поддержки Signal
    - Отладка отправки/получения Signal
summary: Поддержка Signal через signal-cli (нативный демон или контейнер bbernhard), пути настройки и модель номеров
title: Signal
x-i18n:
    generated_at: "2026-07-03T17:33:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

Статус: внешняя интеграция CLI. Gateway взаимодействует с `signal-cli` по HTTP — либо с нативным демоном (JSON-RPC + SSE), либо с контейнером bbernhard/signal-cli-rest-api (REST + WebSocket).

## Предварительные требования

- OpenClaw установлен на вашем сервере (описанный ниже сценарий для Linux проверен на Ubuntu 24).
- Одно из:
  - `signal-cli` доступен на хосте (нативный режим), **или**
  - Docker-контейнер `bbernhard/signal-cli-rest-api` (контейнерный режим).
- Номер телефона, который может получить одно SMS для подтверждения (для сценария регистрации через SMS).
- Доступ к браузеру для капчи Signal (`signalcaptchas.org`) во время регистрации.

## Быстрая настройка (для начинающих)

1. Используйте **отдельный номер Signal** для бота (рекомендуется).
2. Установите Plugin OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. Установите `signal-cli` (если вы используете JVM-сборку, требуется Java).
4. Выберите один путь настройки:
   - **Путь A (привязка по QR):** `signal-cli link -n "OpenClaw"` и отсканируйте код в Signal.
   - **Путь B (регистрация по SMS):** зарегистрируйте выделенный номер с капчей и подтверждением по SMS.
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
| `allowFrom`  | Номера телефонов или значения `uuid:<id>`, которым разрешено отправлять личные сообщения |

## Что это такое

- Канал Signal через `signal-cli` (не встроенный libsignal).
- Детерминированная маршрутизация: ответы всегда возвращаются в Signal.
- Личные сообщения используют основной сеанс агента; группы изолированы (`agent:<agentId>:signal:group:<groupId>`).

## Запись конфигурации

По умолчанию Signal разрешено записывать обновления конфигурации, вызванные `/config set|unset` (требуется `commands.config: true`).

Отключить можно так:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Модель номера (важно)

- Gateway подключается к **устройству Signal** (учетной записи `signal-cli`).
- Если вы запускаете бота на **своей личной учетной записи Signal**, он будет игнорировать ваши собственные сообщения (защита от зацикливания).
- Для сценария «я пишу боту, и он отвечает» используйте **отдельный номер бота**.

## Путь настройки A: привязать существующую учетную запись Signal (QR)

1. Установите `signal-cli` (JVM- или нативную сборку).
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

Поддержка нескольких учетных записей: используйте `channels.signal.accounts` с конфигурацией для каждой учетной записи и необязательным `name`. Общий шаблон см. в [`gateway/configuration`](/ru/gateway/config-channels#multi-account-all-channels).

## Путь настройки B: зарегистрировать выделенный номер бота (SMS, Linux)

Используйте это, если хотите выделенный номер бота вместо привязки существующей учетной записи приложения Signal.

1. Получите номер, который может принимать SMS (или голосовое подтверждение для стационарных номеров).
   - Используйте выделенный номер бота, чтобы избежать конфликтов учетной записи или сеанса.
2. Установите `signal-cli` на хосте Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Если вы используете JVM-сборку (`signal-cli-${VERSION}.tar.gz`), сначала установите JRE 25+.
Поддерживайте `signal-cli` в актуальном состоянии; upstream отмечает, что старые релизы могут ломаться при изменениях серверных API Signal.

3. Зарегистрируйте и подтвердите номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Если требуется капча:

1. Откройте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдите капчу, скопируйте целевой адрес ссылки `signalcaptcha://...` из "Open Signal".
3. По возможности выполняйте команду с того же внешнего IP-адреса, что и браузерная сессия.
4. Сразу снова запустите регистрацию (токены капчи быстро истекают):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Настройте OpenClaw, перезапустите Gateway и проверьте канал:

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
   - Сохраните номер бота как контакт на телефоне, чтобы избежать пометки "Unknown contact".

<Warning>
Регистрация учетной записи телефонного номера через `signal-cli` может деавторизовать основной сеанс приложения Signal для этого номера. Предпочитайте выделенный номер бота или используйте режим привязки по QR, если нужно сохранить существующую настройку приложения на телефоне.
</Warning>

Ссылки upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Поток с капчей: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Поток привязки: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим внешнего демона (httpUrl)

Если вы хотите управлять `signal-cli` самостоятельно (медленные холодные старты JVM, инициализация контейнера или общие CPU), запустите демон отдельно и укажите OpenClaw на него:

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

Это пропускает автоматический запуск и ожидание старта внутри OpenClaw. Для медленных стартов при автоматическом запуске задайте `channels.signal.startupTimeoutMs`.

## Контейнерный режим (bbernhard/signal-cli-rest-api)

Вместо нативного запуска `signal-cli` можно использовать Docker-контейнер [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Он оборачивает `signal-cli` REST API и интерфейсом WebSocket.

Требования:

- Контейнер **должен** запускаться с `MODE=json-rpc` для получения сообщений в реальном времени.
- Зарегистрируйте или привяжите учетную запись Signal внутри контейнера до подключения OpenClaw.

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
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (По умолчанию) Проверяет оба транспорта; потоковая передача проверяет прием через контейнерный WebSocket |
| `"native"`    | Принудительно использует нативный signal-cli (JSON-RPC на `/api/v1/rpc`, SSE на `/api/v1/events`) |
| `"container"` | Принудительно использует контейнер bbernhard (REST на `/v2/send`, WebSocket на `/v1/receive/{account}`) |

Когда `apiMode` равен `"auto"`, OpenClaw кэширует обнаруженный режим на 30 секунд, чтобы избежать повторных проверок. Прием через контейнер выбирается для потоковой передачи только после того, как `/v1/receive/{account}` обновится до WebSocket, что требует `MODE=json-rpc`.

Контейнерный режим поддерживает те же операции канала Signal, что и нативный режим, там, где контейнер предоставляет соответствующие API: отправку, прием, вложения, индикаторы набора текста, квитанции о прочтении/просмотре, реакции, группы и форматированный текст. OpenClaw преобразует свои нативные RPC-вызовы Signal в REST-полезные нагрузки контейнера, включая идентификаторы групп `group.{base64(internal_id)}` и `text_mode: "styled"` для форматированного текста.

Операционные примечания:

- Используйте `autoStart: false` с контейнерным режимом. OpenClaw не должен запускать нативный демон, когда выбран `apiMode: "container"`.
- Используйте `MODE=json-rpc` для приема. `MODE=normal` может показывать `/v1/about` как исправный, но `/v1/receive/{account}` не выполняет обновление до WebSocket, поэтому OpenClaw не выберет потоковый прием контейнера в режиме `auto`.
- Задайте `apiMode: "container"`, если вы знаете, что `httpUrl` указывает на REST API bbernhard. Задайте `apiMode: "native"`, если вы знаете, что он указывает на нативный JSON-RPC/SSE `signal-cli`. Используйте `"auto"`, если развертывание может отличаться.
- Загрузки вложений в контейнерном режиме соблюдают те же лимиты байтов медиа, что и нативный режим. Ответы слишком большого размера отклоняются до полной буферизации, если сервер отправляет `Content-Length`; иначе они отклоняются во время потоковой передачи.

## Контроль доступа (личные сообщения + группы)

Личные сообщения:

- По умолчанию: `channels.signal.dmPolicy = "pairing"`.
- Неизвестные отправители получают код сопряжения; сообщения игнорируются до подтверждения (коды истекают через 1 час).
- Подтверждение через:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Сопряжение — стандартный обмен токеном для личных сообщений Signal. Подробности: [Сопряжение](/ru/channels/pairing)
- Отправители только с UUID (из `sourceUuid`) сохраняются как `uuid:<id>` в `channels.signal.allowFrom`.

Группы:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` управляет тем, какие группы или отправители могут запускать ответы в группе, когда задан `allowlist`; записи могут быть идентификаторами групп Signal (сырыми, `group:<id>` или `signal:group:<id>`), номерами телефонов отправителей, значениями `uuid:<id>` или `*`.
- `channels.signal.groups["<group-id>" | "*"]` может переопределять поведение групп с помощью `requireMention`, `tools` и `toolsBySender`.
- Используйте `channels.signal.accounts.<id>.groups` для переопределений по учетной записи в настройках с несколькими учетными записями.
- Добавление группы Signal в список разрешенных через `groupAllowFrom` само по себе не отключает требование упоминания. Специально настроенная запись `channels.signal.groups["<group-id>"]` обрабатывает каждое сообщение группы, если не задано `requireMention=true`.
- Примечание о runtime: если `channels.signal` полностью отсутствует, runtime возвращается к `groupPolicy="allowlist"` для проверок групп (даже если задан `channels.defaults.groupPolicy`).

## Как это работает (поведение)

- Нативный режим: `signal-cli` работает как демон; Gateway читает события через SSE.
- Контейнерный режим: Gateway отправляет через REST API и получает через WebSocket.
- Входящие сообщения нормализуются в общий конверт канала.
- Ответы всегда маршрутизируются обратно на тот же номер или в ту же группу.

## Медиа + лимиты

- Исходящий текст разбивается на фрагменты по `channels.signal.textChunkLimit` (по умолчанию 4000).
- Необязательное разбиение по переводам строк: задайте `channels.signal.chunkMode="newline"`, чтобы сначала разделять по пустым строкам (границам абзацев), а затем по длине.
- Вложения поддерживаются (base64 извлекается из `signal-cli`).
- Вложения голосовых заметок используют имя файла `signal-cli` как запасной вариант MIME, когда `contentType` отсутствует, поэтому транскрипция аудио все еще может классифицировать голосовые заметки AAC.
- Лимит медиа по умолчанию: `channels.signal.mediaMaxMb` (по умолчанию 8).
- Используйте `channels.signal.ignoreAttachments`, чтобы пропускать загрузку медиа.
- Контекст истории группы использует `channels.signal.historyLimit` (или `channels.signal.accounts.*.historyLimit`), с возвратом к `messages.groupChat.historyLimit`. Задайте `0`, чтобы отключить (по умолчанию 50).

## Набор текста + квитанции о прочтении

- **Индикаторы набора**: OpenClaw отправляет сигналы набора через `signal-cli sendTyping` и обновляет их, пока выполняется ответ.
- **Уведомления о прочтении**: когда `channels.signal.sendReadReceipts` равно true, OpenClaw пересылает уведомления о прочтении для разрешенных личных сообщений.
- Signal-cli не предоставляет уведомления о прочтении для групп.

## Реакции статуса жизненного цикла

Установите `messages.statusReactions.enabled: true`, чтобы Signal показывал общий
жизненный цикл реакций «в очереди/обдумывание/инструмент/Compaction/готово/ошибка» для входящих обращений.
Signal использует временную метку входящего сообщения как цель реакции; групповые
реакции отправляются с идентификатором группы Signal и исходным отправителем в качестве
целевого автора.

Для реакций статуса также требуется реакция подтверждения и соответствующий
`messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` или `all`).
Установите `channels.signal.reactionLevel: "off"`, чтобы отключить реакции статуса Signal.
Действие `react` инструмента сообщений остается строже: для него требуется
`reactionLevel: "minimal"` или `"extensive"`.

`messages.removeAckAfterReply: true` очищает финальную реакцию статуса после
настроенного времени удержания. В противном случае Signal восстанавливает начальную реакцию подтверждения после
финального состояния готово/ошибка.

## Реакции (инструмент сообщений)

- Используйте `message action=react` с `channel=signal`.
- Цели: E.164 отправителя или UUID (используйте `uuid:<id>` из вывода привязки; простой UUID тоже работает).
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
  - `off`/`ack` отключает реакции агента (инструмент сообщений `react` вернет ошибку).
  - `minimal`/`extensive` включает реакции агента и задает уровень рекомендаций.
- Переопределения для отдельных аккаунтов: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Реакции подтверждения

Запросы подтверждения выполнения Signal и Plugin используют блоки маршрутизации верхнего уровня `approvals.exec` и
`approvals.plugin`. У Signal нет блока
`channels.signal.execApprovals`.

- `👍` подтверждает один раз.
- `👎` отклоняет.
- Используйте `/approve <id> allow-always`, когда запрос предлагает постоянное подтверждение.

Для разрешения реакции подтверждения требуются явные подтверждающие Signal из
`channels.signal.allowFrom`, `channels.signal.defaultTo` или соответствующих полей уровня аккаунта.
Прямые запросы подтверждения выполнения в том же чате все еще могут подавлять дублирующий локальный запасной вариант `/approve`
без явных подтверждающих; групповые подтверждения без подтверждающих оставляют локальный запасной вариант видимым.

## Цели доставки (CLI/cron)

- Личные сообщения: `signal:+15551234567` (или обычный E.164).
- Личные сообщения UUID: `uuid:<id>` (или простой UUID).
- Группы: `signal:group:<groupId>`.
- Имена пользователей: `username:<name>` (если поддерживается вашим аккаунтом Signal).

## Псевдонимы

Настройте псевдонимы, если вам нужны стабильные имена для повторяющихся целей Signal.
Псевдонимы существуют только в конфигурации на стороне OpenClaw; они не создают и не редактируют контакты Signal.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Используйте псевдонимы везде, где принимаются цели доставки Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Псевдонимы для отдельных аккаунтов наследуют псевдонимы верхнего уровня и могут добавлять или переопределять имена:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` и
`openclaw directory groups list --channel signal` выводят настроенные псевдонимы. Каталог
Signal основан на конфигурации; он не запрашивает контакты Signal в реальном времени и не
изменяет аккаунт Signal.

## Устранение неполадок

Сначала выполните эту последовательность:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Затем при необходимости подтвердите состояние привязки личных сообщений:

```bash
openclaw pairing list signal
```

Распространенные сбои:

- Демон доступен, но ответов нет: проверьте настройки аккаунта/демона (`httpUrl`, `account`) и режим получения.
- Личные сообщения игнорируются: отправитель ожидает подтверждения привязки.
- Групповые сообщения игнорируются: доставка блокируется ограничениями по отправителю группы/упоминаниям.
- Ошибки проверки конфигурации после изменений: выполните `openclaw doctor --fix`.
- Signal отсутствует в диагностике: подтвердите `channels.signal.enabled: true`.

Дополнительные проверки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Порядок диагностики: [/channels/troubleshooting](/ru/channels/troubleshooting).

## Заметки по безопасности

- `signal-cli` хранит ключи аккаунта локально (обычно в `~/.local/share/signal-cli/data/`).
- Создайте резервную копию состояния аккаунта Signal перед миграцией сервера или пересборкой.
- Сохраняйте `channels.signal.dmPolicy: "pairing"`, если вам явно не нужен более широкий доступ к личным сообщениям.
- SMS-проверка нужна только для сценариев регистрации или восстановления, но потеря контроля над номером/аккаунтом может усложнить повторную регистрацию.

## Справочник конфигурации (Signal)

Полная конфигурация: [Конфигурация](/ru/gateway/configuration)

Параметры провайдера:

- `channels.signal.enabled`: включить/отключить запуск канала.
- `channels.signal.apiMode`: `auto | native | container` (по умолчанию: auto). См. [Контейнерный режим](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 для аккаунта бота.
- `channels.signal.cliPath`: путь к `signal-cli`.
- `channels.signal.configPath`: необязательный каталог `signal-cli --config`.
- `channels.signal.httpUrl`: полный URL демона (переопределяет хост/порт).
- `channels.signal.httpHost`, `channels.signal.httpPort`: привязка демона (по умолчанию 127.0.0.1:8080).
- `channels.signal.autoStart`: автоматический запуск демона (по умолчанию true, если `httpUrl` не задан).
- `channels.signal.startupTimeoutMs`: тайм-аут ожидания запуска в мс (предел 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропускать загрузку вложений.
- `channels.signal.ignoreStories`: игнорировать истории от демона.
- `channels.signal.sendReadReceipts`: пересылать уведомления о прочтении.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (по умолчанию: pairing).
- `channels.signal.allowFrom`: список разрешенных личных сообщений (E.164 или `uuid:<id>`). Для `open` требуется `"*"`. У Signal нет имен пользователей; используйте идентификаторы телефона/UUID.
- `channels.signal.aliases`: псевдонимы на стороне OpenClaw для целей доставки личных сообщений или групп.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (по умолчанию: allowlist).
- `channels.signal.groupAllowFrom`: список разрешенных групп; принимает идентификаторы групп Signal (сырые, `group:<id>` или `signal:group:<id>`), номера отправителей в E.164 или значения `uuid:<id>`.
- `channels.signal.groups`: переопределения для отдельных групп с ключами по идентификатору группы Signal (или `"*"`). Поддерживаемые поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версия `channels.signal.groups` для отдельных аккаунтов в настройках с несколькими аккаунтами.
- `channels.signal.accounts.<id>.aliases`: псевдонимы для отдельных аккаунтов, объединяемые с псевдонимами верхнего уровня.
- `channels.signal.historyLimit`: максимальное число групповых сообщений, включаемых как контекст (0 отключает).
- `channels.signal.dmHistoryLimit`: лимит истории личных сообщений в обращениях пользователя. Переопределения для отдельных пользователей: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: размер исходящего фрагмента (символы).
- `channels.signal.chunkMode`: `length` (по умолчанию) или `newline` для разбиения по пустым строкам (границам абзацев) перед разбиением по длине.
- `channels.signal.mediaMaxMb`: лимит входящих/исходящих медиа (МБ).

Связанные глобальные параметры:

- `agents.list[].groupChat.mentionPatterns` (Signal не поддерживает нативные упоминания).
- `messages.groupChat.mentionPatterns` (глобальный запасной вариант).
- `messages.responsePrefix`.

## См. также

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Привязка](/ru/channels/pairing) — аутентификация личных сообщений и процесс привязки
- [Группы](/ru/channels/groups) — поведение групповых чатов и ограничение по упоминаниям
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
