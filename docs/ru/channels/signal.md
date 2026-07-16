---
read_when:
    - Настройка поддержки Signal
    - Отладка отправки и получения сообщений Signal
summary: Поддержка Signal через signal-cli (нативный демон или контейнер bbernhard), способы настройки и модель номеров
title: Signal
x-i18n:
    generated_at: "2026-07-16T16:36:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal — это загружаемый плагин канала (`@openclaw/signal`). Gateway взаимодействует с `signal-cli` по HTTP: либо с нативным демоном (JSON-RPC + SSE), либо с контейнером [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw не включает libsignal.

## Модель номеров (прочитайте сначала)

- Gateway подключается к **устройству Signal**: учётной записи `signal-cli`.
- Если бот работает в **вашей личной учётной записи Signal**, он игнорирует ваши собственные сообщения (защита от зацикливания).
- Чтобы реализовать сценарий «я пишу боту, а он отвечает», используйте **отдельный номер бота**.

## Установка

```bash
openclaw plugins install @openclaw/signal
```

Для спецификаций плагинов без указания источника сначала используется ClawHub, а затем в качестве резервного варианта npm. Принудительно укажите источник с помощью `openclaw plugins install clawhub:@openclaw/signal` или `npm:@openclaw/signal`. `plugins install` регистрирует и включает плагин; отдельный шаг `enable` не требуется. Общие правила установки см. в разделе [Плагины](/ru/tools/plugin).

## Быстрая настройка

<Steps>
  <Step title="Выберите номер">
    Используйте для бота **отдельный номер Signal** (рекомендуется).
  </Step>
  <Step title="Установите плагин">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Запустите пошаговую настройку">
    ```bash
    openclaw channels add
    ```
    Мастер определяет, находится ли `signal-cli` в `PATH`, и при его отсутствии предлагает установить его: загружает официальную нативную сборку GraalVM для Linux x86-64 либо устанавливает через Homebrew в macOS и на других архитектурах. Затем он запрашивает номер бота и путь `signal-cli`.

    Для неинтерактивной настройки `openclaw channels add --channel signal` также принимает `--signal-number <e164>` для номера телефона бота, а также `--http-host <host>` и `--http-port <port>` для конечной точки демона Signal (по умолчанию `127.0.0.1:8080`).

  </Step>
  <Step title="Привяжите или зарегистрируйте учётную запись">
    - **Привязка по QR-коду (самый быстрый способ):** `signal-cli link -n "OpenClaw"`, затем отсканируйте код в Signal. См. [вариант A](#setup-path-a-link-existing-signal-account-qr).
    - **Регистрация по SMS:** отдельный номер с капчей и проверкой по SMS. См. [вариант B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Проверьте и выполните сопряжение">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Отправьте первое личное сообщение и подтвердите сопряжение: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

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

| Поле        | Описание                                       |
| ------------ | ------------------------------------------------- |
| `account`    | Номер телефона бота в формате E.164 (`+15551234567`) |
| `cliPath`    | Путь к `signal-cli` (`signal-cli`, если находится в `PATH`)  |
| `configPath` | Каталог конфигурации signal-cli, передаваемый как `--config`        |
| `dmPolicy`   | Политика доступа к личным сообщениям (рекомендуется `pairing`)          |
| `allowFrom`  | Номера телефонов или значения `uuid:<id>`, которым разрешено отправлять личные сообщения |

Поддержка нескольких учётных записей: используйте `channels.signal.accounts` с конфигурацией для каждой учётной записи и необязательным `name`. Общий шаблон см. в разделе [Каналы с несколькими учётными записями](/ru/gateway/config-channels#multi-account-all-channels).

## Что это такое

- Детерминированная маршрутизация: ответы всегда отправляются обратно в Signal.
- Личные сообщения используют основной сеанс агента совместно; группы изолированы (`agent:<agentId>:signal:group:<groupId>`).
- По умолчанию Signal может записывать изменения конфигурации, инициированные `/config set|unset` (требуется `commands.config: true`). Отключите это с помощью `channels.signal.configWrites: false`.

## Вариант настройки A: привязка существующей учётной записи Signal (QR-код)

1. Установите `signal-cli` (сборку JVM или нативную сборку) либо позвольте `openclaw channels add` установить её.
2. Привяжите учётную запись бота: `signal-cli link -n "OpenClaw"`, затем отсканируйте QR-код в Signal.
3. Настройте Signal и запустите Gateway.

## Вариант настройки B: регистрация отдельного номера бота (SMS, Linux)

Используйте этот вариант для отдельного номера бота вместо привязки существующей учётной записи приложения Signal. Приведённый ниже процесс протестирован в Ubuntu 24.

1. Получите номер, способный принимать SMS (или голосовые вызовы для проверки стационарных номеров). Отдельный номер бота позволяет избежать конфликтов учётных записей и сеансов.
2. Установите `signal-cli` на хосте Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Если вы используете сборку JVM (`signal-cli-${VERSION}.tar.gz`), сначала установите JRE. Своевременно обновляйте `signal-cli`; разработчики исходного проекта отмечают, что старые выпуски могут перестать работать по мере изменения серверных API Signal.

3. Зарегистрируйте и подтвердите номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Если требуется капча (для выполнения этого шага необходим доступ к браузеру):

1. Откройте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдите капчу и скопируйте целевой адрес ссылки `signalcaptcha://...` из «Open Signal».
3. По возможности запускайте команду с того же внешнего IP-адреса, что и сеанс браузера (срок действия токенов капчи быстро истекает).
4. Незамедлительно зарегистрируйте и подтвердите номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Настройте OpenClaw, перезапустите Gateway и проверьте канал:

```bash
# Если Gateway запущен как пользовательская служба systemd:
systemctl --user restart openclaw-gateway.service

# Затем выполните проверку:
openclaw doctor
openclaw channels status --probe
```

5. Выполните сопряжение отправителя личных сообщений:
   - Отправьте любое сообщение на номер бота.
   - Подтвердите на сервере: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Сохраните номер бота в контактах телефона, чтобы избежать пометки «Unknown contact».

<Warning>
Регистрация учётной записи с номером телефона с помощью `signal-cli` может отменить аутентификацию основного сеанса приложения Signal для этого номера. Предпочтительно использовать отдельный номер бота или режим привязки по QR-коду, чтобы сохранить текущую настройку приложения на телефоне.
</Warning>

Ссылки на исходный проект:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Процесс работы с капчей: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Процесс привязки: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим внешнего демона (httpUrl)

Чтобы самостоятельно управлять `signal-cli` (медленный холодный запуск JVM, инициализация контейнера, общие ресурсы ЦП), запустите демон отдельно и укажите его адрес в OpenClaw:

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

При этом автоматический запуск и ожидание запуска со стороны OpenClaw пропускаются. Для медленного автоматически запускаемого процесса задайте `channels.signal.startupTimeoutMs`.

## Режим контейнера (bbernhard/signal-cli-rest-api)

Вместо нативного запуска `signal-cli` используйте Docker-контейнер [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), который предоставляет доступ к `signal-cli` через интерфейс REST + WebSocket.

Требования:

- Контейнер **должен** работать с `MODE=json-rpc` для получения сообщений в реальном времени.
- Перед подключением OpenClaw зарегистрируйте или привяжите учётную запись Signal внутри контейнера.

Пример службы `docker-compose.yml`:

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
      apiMode: "container", // или "auto" для автоматического определения
    },
  },
}
```

`apiMode` определяет, какой протокол использует OpenClaw:

| Значение         | Поведение                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (По умолчанию) Проверяет оба транспорта; потоковая передача подтверждает получение через WebSocket контейнера    |
| `"native"`    | Принудительно использовать нативный signal-cli (JSON-RPC по адресу `/api/v1/rpc`, SSE по адресу `/api/v1/events`)         |
| `"container"` | Принудительно использовать контейнер bbernhard (REST по адресу `/v2/send`, WebSocket по адресу `/v1/receive/{account}`) |

Когда `apiMode` имеет значение `"auto"`, OpenClaw кэширует обнаруженный режим на 30 секунд для каждого URL демона, чтобы избежать повторных проверок (если оба транспорта исправны, приоритет имеет нативный). Получение через контейнер выбирается для потоковой передачи только после перехода `/v1/receive/{account}` на WebSocket, для которого требуется `MODE=json-rpc`.

Режим контейнера поддерживает те же операции Signal, что и нативный режим, если контейнер предоставляет соответствующие API: отправку и получение сообщений, вложения, индикаторы набора текста, уведомления о прочтении и просмотре, реакции, группы и форматированный текст. OpenClaw преобразует нативные вызовы Signal RPC в полезные нагрузки REST контейнера, включая идентификаторы групп `group.{base64(internal_id)}` и `text_mode: "styled"` для форматированного текста.

Примечания по эксплуатации:

- В режиме контейнера используйте `autoStart: false`; OpenClaw не должен запускать нативный демон, когда выбран `apiMode: "container"`.
- Для получения сообщений используйте `MODE=json-rpc`. `MODE=normal` может создавать впечатление, что `/v1/about` исправен, но `/v1/receive/{account}` не выполнит переход на WebSocket, поэтому OpenClaw не выберет потоковое получение через контейнер в режиме `auto`.
- Задайте `apiMode: "container"`, когда `httpUrl` указывает на REST API bbernhard, `"native"`, когда он указывает на нативный JSON-RPC/SSE `signal-cli`, и `"auto"`, когда вариант развёртывания может меняться.
- При загрузке вложений в режиме контейнера действуют те же ограничения на объём медиаданных в байтах, что и в нативном режиме. Если сервер отправляет `Content-Length`, ответы чрезмерного размера отклоняются до полной буферизации, а в остальных случаях — во время потоковой передачи.

## Управление доступом (личные сообщения и группы)

Личные сообщения:

- По умолчанию: `channels.signal.dmPolicy = "pairing"`.
- Неизвестные отправители получают код сопряжения; сообщения игнорируются до подтверждения (срок действия кодов истекает через 1 час).
- Подтвердите с помощью `openclaw pairing list signal` и `openclaw pairing approve signal <CODE>`.
- Сопряжение — стандартный способ обмена токенами для личных сообщений Signal. Подробнее: [Сопряжение](/ru/channels/pairing)
- Отправители, идентифицируемые только по UUID (из `sourceUuid`), сохраняются как `uuid:<id>` в `channels.signal.allowFrom`.

Группы:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` определяет, какие группы или отправители могут инициировать ответы в группах, когда задан `allowlist`; в качестве записей могут использоваться идентификаторы групп Signal (необработанные, `group:<id>` или `signal:group:<id>`), номера телефонов отправителей, значения `uuid:<id>` или `*`.
- `channels.signal.groups["<group-id>" | "*"]` может переопределять поведение группы с помощью `requireMention`, `tools` и `toolsBySender`.
- Для переопределений на уровне учётных записей в конфигурациях с несколькими учётными записями используйте `channels.signal.accounts.<id>.groups`.
- Добавление группы Signal в список разрешённых с помощью `groupAllowFrom` само по себе не отключает требование упоминания. Явно настроенная запись `channels.signal.groups["<group-id>"]` обрабатывает каждое сообщение группы, если не задан `requireMention=true`.
- При `requireMention=true` нативные упоминания @ в Signal сопоставляются по структурированным метаданным упоминаний с номером телефона или `accountUuid` учётной записи бота. Настроенные `mentionPatterns` остаются резервным вариантом на основе обычного текста.
- Примечание о среде выполнения: если `channels.signal` полностью отсутствует, среда выполнения использует `groupPolicy="allowlist"` как резервный вариант для проверок групп (даже если задан `channels.defaults.groupPolicy`).

Группа с обязательным упоминанием и ограниченным контекстом:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

Разрешённые групповые сообщения, в которых бот не упоминается, остаются без ответа и сохраняются только в ограниченном окне истории ожидания. Когда последующее нативное @упоминание или резервное текстовое упоминание активирует бота, OpenClaw включает этот недавний контекст и отвечает в ту же группу. Содержимое пропущенных вложений не загружается; в ожидающем контексте они могут отображаться только как компактные заполнители медиафайлов.

## Принцип работы (поведение)

- Нативный режим: `signal-cli` работает как демон; Gateway считывает события через SSE.
- Контейнерный режим: Gateway отправляет сообщения через REST API и получает их через WebSocket.
- Входящие сообщения нормализуются в общий конверт канала.
- Ответы всегда направляются на тот же номер или в ту же группу.
- Ответы на входящие сообщения содержат нативные метаданные цитирования Signal, если серверная часть принимает временную метку и автора входящего сообщения; если метаданные цитирования отсутствуют или отклонены, OpenClaw отправляет ответ как обычное сообщение.
- Настройте использование нативного цитирования с помощью `channels.signal.replyToMode = off | first | all | batched` или `channels.signal.replyToModeByChatType.direct/group` для переопределений по типу чата. Значения уровня учётной записи в `channels.signal.accounts.<id>` имеют приоритет.

## Медиафайлы и ограничения

- Исходящий текст разбивается на фрагменты размером `channels.signal.textChunkLimit` (по умолчанию 4000).
- Необязательное разбиение по переводам строк: задайте `channels.signal.streaming.chunkMode="newline"`, чтобы перед разбиением по длине разделять текст по пустым строкам (границам абзацев).
- Вложения поддерживаются (данные base64 получаются из `signal-cli`).
- Для вложений с голосовыми заметками имя файла `signal-cli` используется как резервное значение MIME, если `contentType` отсутствует, поэтому при расшифровке аудио голосовые заметки AAC всё равно можно классифицировать.
- Ограничение медиафайлов по умолчанию: `channels.signal.mediaMaxMb` (по умолчанию 8).
- Используйте `channels.signal.ignoreAttachments`, чтобы пропустить загрузку медиафайлов.
- Контекст истории группы использует `channels.signal.historyLimit` (или `channels.signal.accounts.*.historyLimit`), с резервным переходом к `messages.groupChat.historyLimit`. Задайте `0`, чтобы отключить его (по умолчанию 50).

## Индикаторы набора и уведомления о прочтении

- **Индикаторы набора**: OpenClaw отправляет сигналы набора через `signal-cli sendTyping` и обновляет их во время формирования ответа.
- **Уведомления о прочтении**: когда `channels.signal.sendReadReceipts` имеет значение true, OpenClaw пересылает уведомления о прочтении для разрешённых личных сообщений.
- `signal-cli` не предоставляет уведомления о прочтении для групп.

## Реакции на состояния жизненного цикла

Задайте `messages.statusReactions.enabled: true`, чтобы Signal отображал общий жизненный цикл реакций «в очереди / обдумывание / инструмент / Compaction / завершено / ошибка» для входящих запросов. Signal использует временную метку входящего сообщения в качестве цели реакции; групповые реакции отправляются с идентификатором группы Signal и исходным отправителем в качестве целевого автора.

Для реакций на состояния также требуются реакция подтверждения и соответствующее значение `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` или `all`). Задайте `channels.signal.reactionLevel: "off"`, чтобы отключить реакции Signal на состояния.

`messages.removeAckAfterReply: true` удаляет итоговую реакцию на состояние по истечении настроенного времени отображения. В противном случае Signal восстанавливает исходную реакцию подтверждения после итогового состояния завершения или ошибки.

## Реакции (инструмент сообщений)

Используйте `message action=react` с `channel=signal`.

- Цели: номер отправителя в формате E.164 или UUID (используйте `uuid:<id>` из вывода сопряжения; UUID без префикса также поддерживается).
- `messageId` — временная метка Signal сообщения, на которое добавляется реакция.
- Для групповых реакций требуется `targetAuthor` или `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Конфигурация:

- `channels.signal.actions.reactions`: включить или отключить действия с реакциями (по умолчанию true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (по умолчанию `minimal`).
  - `off`/`ack` отключает реакции агента (инструмент сообщений `react` возвращает ошибки).
  - `minimal`/`extensive` включает реакции агента и задаёт уровень рекомендаций.
- Переопределения для отдельных учётных записей: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Реакции подтверждения

Запросы на подтверждение выполнения и плагинов Signal используют блоки маршрутизации верхнего уровня `approvals.exec` и `approvals.plugin`. В Signal нет блока `channels.signal.execApprovals`.

- `👍` подтверждает однократно.
- `👎` отклоняет.
- Используйте `/approve <id> allow-always`, если запрос предлагает постоянное подтверждение.

Для обработки реакции подтверждения требуются явно заданные подтверждающие пользователи Signal из `channels.signal.allowFrom`, `channels.signal.defaultTo` или соответствующих полей уровня учётной записи. Прямые запросы на подтверждение выполнения в том же чате могут по-прежнему скрывать дублирующий локальный резервный вариант `/approve` без явно заданных подтверждающих пользователей; для групповых подтверждений без подтверждающих пользователей локальный резервный вариант остаётся видимым.

## Цели доставки (CLI/Cron)

- Личные сообщения: `signal:+15551234567` (или обычный номер E.164).
- Личные сообщения по UUID: `uuid:<id>` (или UUID без префикса).
- Группы: `signal:group:<groupId>`.
- Имена пользователей: `username:<name>` (если поддерживаются вашей учётной записью Signal).

## Псевдонимы

Настройте псевдонимы для постоянных имён регулярно используемых целей Signal. Псевдонимы существуют только в конфигурации OpenClaw; они не создают и не изменяют контакты Signal.

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
openclaw message send --channel signal --target signal:ops --message "Развёртывание завершено"
```

Псевдонимы отдельных учётных записей наследуют псевдонимы верхнего уровня и могут добавлять или переопределять имена:

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

`openclaw directory peers list --channel signal` и `openclaw directory groups list --channel signal` выводят список настроенных псевдонимов. Каталог Signal формируется на основе конфигурации; он не запрашивает контакты Signal в реальном времени и не изменяет учётную запись Signal.

## Устранение неполадок

Сначала выполните следующую последовательность:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Затем при необходимости проверьте состояние сопряжения для личных сообщений:

```bash
openclaw pairing list signal
```

Распространённые сбои:

- Демон доступен, но ответов нет: проверьте настройки учётной записи и демона (`httpUrl`, `account`), а также режим получения.
- Личные сообщения игнорируются: отправитель ожидает подтверждения сопряжения.
- Групповые сообщения игнорируются: ограничения по отправителю группы или упоминанию блокируют доставку.
- Ошибки проверки конфигурации после изменений: выполните `openclaw doctor --fix`.
- Signal отсутствует в диагностике: проверьте `channels.signal.enabled: true`.

Дополнительные проверки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Процесс диагностики: [Устранение неполадок каналов](/ru/channels/troubleshooting).

## Примечания по безопасности

- `signal-cli` хранит ключи учётной записи локально (обычно в `~/.local/share/signal-cli/data/`).
- Создайте резервную копию состояния учётной записи Signal перед переносом или повторным развёртыванием сервера.
- Сохраняйте значение `channels.signal.dmPolicy: "pairing"`, если более широкий доступ к личным сообщениям явно не требуется.
- Подтверждение по SMS требуется только для регистрации или восстановления, однако утрата контроля над номером или учётной записью может усложнить повторную регистрацию.

## Справочник по конфигурации (Signal)

Полная конфигурация: [Конфигурация](/ru/gateway/configuration)

Параметры провайдера:

- `channels.signal.enabled`: включить или отключить запуск канала.
- `channels.signal.apiMode`: `auto | native | container` (по умолчанию: автоматически). См. [Контейнерный режим](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: номер учётной записи бота в формате E.164.
- `channels.signal.accountUuid`: необязательный UUID учётной записи бота для обнаружения нативных @упоминаний и защиты от зацикливания.
- `channels.signal.cliPath`: путь к `signal-cli`.
- `channels.signal.configPath`: необязательный каталог `signal-cli --config`.
- `channels.signal.httpUrl`: полный URL демона (переопределяет хост и порт).
- `channels.signal.httpHost`, `channels.signal.httpPort`: адрес привязки демона (по умолчанию `127.0.0.1:8080`).
- `channels.signal.autoStart`: автоматически запускать демон (по умолчанию true, если `httpUrl` не задан).
- `channels.signal.startupTimeoutMs`: время ожидания запуска в мс (минимум 1000, максимум 120000; по умолчанию 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропускать загрузку вложений.
- `channels.signal.ignoreStories`: игнорировать истории от демона.
- `channels.signal.sendReadReceipts`: пересылать уведомления о прочтении.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (по умолчанию: сопряжение).
- `channels.signal.allowFrom`: список разрешённых отправителей личных сообщений (E.164 или `uuid:<id>`). Для `open` требуется `"*"`. В Signal нет имён пользователей; используйте идентификаторы телефона или UUID.
- `channels.signal.aliases`: псевдонимы OpenClaw для целей доставки личных или групповых сообщений.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (по умолчанию: список разрешённых).
- `channels.signal.groupAllowFrom`: список разрешённых групп; принимает идентификаторы групп Signal (необработанные, `group:<id>` или `signal:group:<id>`), номера отправителей в формате E.164 или значения `uuid:<id>`.
- `channels.signal.groups`: переопределения для отдельных групп с ключами в виде идентификатора группы Signal (или `"*"`). Поддерживаемые поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версия `channels.signal.groups` для отдельных учётных записей в конфигурациях с несколькими учётными записями.
- `channels.signal.accounts.<id>.aliases`: псевдонимы отдельных учётных записей, объединяемые с псевдонимами верхнего уровня.
- `channels.signal.replyToMode`: режим нативного цитирования в ответах, `off | first | all | batched` (по умолчанию: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: переопределения нативного цитирования в ответах по типу чата.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: переопределения цитирования в ответах для отдельных учётных записей.
- `channels.signal.historyLimit`: максимальное количество групповых сообщений, включаемых в контекст (0 отключает).
- `channels.signal.dmHistoryLimit`: ограничение истории личных сообщений в пользовательских запросах. Переопределения для отдельных пользователей: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: размер исходящего фрагмента в символах (по умолчанию 4000).
- `channels.signal.streaming.chunkMode`: `length` (по умолчанию) или `newline`, чтобы перед разбиением по длине разделять текст по пустым строкам (границам абзацев).
- `channels.signal.mediaMaxMb`: ограничение входящих и исходящих медиафайлов в МБ (по умолчанию 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (по умолчанию `minimal`). См. [Реакции](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (по умолчанию `own`) — когда агент получает уведомления о входящих реакциях других пользователей.
- `channels.signal.reactionAllowlist`: отправители, чьи реакции уведомляют агента при `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: общие для каналов элементы управления потоковой передачей в блочном режиме. См. [Потоковая передача](/ru/concepts/streaming).

Связанные глобальные параметры:

- `agents.list[].groupChat.mentionPatterns` (резервный вариант в виде обычного текста; нативные @упоминания Signal определяются по структурированным метаданным, когда настроена идентификация учётной записи бота).
- `messages.groupChat.mentionPatterns` (глобальный резервный вариант).
- `messages.responsePrefix`.

## Связанные материалы

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Сопряжение](/ru/channels/pairing) — аутентификация в личных сообщениях и процесс сопряжения
- [Группы](/ru/channels/groups) — поведение групповых чатов и обработка только при упоминании
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
