---
read_when:
    - Подключение узлов iOS/Android к gateway
    - Использование node canvas/camera для контекста агента
    - Добавление новых команд Node или вспомогательных CLI-инструментов
summary: 'Узлы: сопряжение, возможности, разрешения и вспомогательные команды CLI для canvas/камеры/экрана/устройства/уведомлений/системы'
title: Узлы
x-i18n:
    generated_at: "2026-06-28T23:09:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

**Node** — это сопутствующее устройство (macOS/iOS/Android/без интерфейса), которое подключается к **WebSocket** Gateway (тот же порт, что и у операторов) с `role: "node"` и предоставляет командную поверхность (например, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Подробности протокола: [протокол Gateway](/ru/gateway/protocol).

Устаревший транспорт: [протокол Bridge](/ru/gateway/bridge-protocol) (TCP JSONL;
только исторически для текущих Node).

macOS также может работать в **режиме Node**: приложение в строке меню подключается к WS-серверу Gateway и предоставляет свои локальные команды canvas/camera как Node (так что `openclaw nodes …` работает с этим Mac). В режиме удаленного Gateway автоматизация браузера обрабатывается хостом Node CLI (`openclaw node run` или установленной службой Node), а не нативным приложением Node.

Примечания:

- Node — это **периферийные устройства**, а не Gateway. Они не запускают службу Gateway.
- Сообщения Telegram/WhatsApp/и т. д. поступают на **Gateway**, а не на Node.
- Руководство по устранению неполадок: [/nodes/troubleshooting](/ru/nodes/troubleshooting)

## Сопряжение и статус

**WS Node используют сопряжение устройств.** Node предъявляют идентификатор устройства во время `connect`; Gateway создает запрос на сопряжение устройства для `role: node`. Одобрите его через CLI устройств (или UI).

Быстрый CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Если Node повторяет попытку с измененными данными аутентификации (роль/области действия/публичный ключ), предыдущий ожидающий запрос заменяется и создается новый `requestId`. Повторно выполните `openclaw devices list` перед одобрением.

Примечания:

- `nodes status` помечает Node как **сопряженный**, когда его роль сопряжения устройства включает `node`.
- Запись сопряжения устройства — это долговечный контракт утвержденной роли. Ротация токенов остается внутри этого контракта; она не может повысить сопряженный Node до другой роли, которую одобрение сопряжения никогда не предоставляло.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) — это отдельное хранилище сопряжений Node, принадлежащее Gateway; оно **не** ограничивает рукопожатие WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` удаляет сопряжение Node. Для Node на основе устройства это отзывает роль `node` у устройства в `devices/paired.json` и отключает сессии этого устройства с ролью Node — устройство со смешанными ролями сохраняет свою строку и теряет только роль `node`, а строка устройства только с ролью Node удаляется. Также очищается любое совпадающее значение из отдельного хранилища сопряжений Node, принадлежащего Gateway. `operator.pairing` может удалять строки Node без роли оператора; вызывающему через токен устройства, который отзывает собственную роль Node на устройстве со смешанными ролями, дополнительно требуется `operator.admin`.
- Область одобрения следует объявленным командам ожидающего запроса:
  - запрос без команд: `operator.pairing`
  - не-exec команды Node: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Удаленный хост Node (system.run)

Используйте **хост Node**, когда Gateway работает на одной машине, а команды должны выполняться на другой. Модель по-прежнему общается с **Gateway**; Gateway пересылает вызовы `exec` на **хост Node**, когда выбран `host=node`.

### Что где выполняется

- **Хост Gateway**: принимает сообщения, запускает модель, маршрутизирует вызовы инструментов.
- **Хост Node**: выполняет `system.run`/`system.which` на машине Node.
- **Одобрения**: применяются на хосте Node через `~/.openclaw/exec-approvals.json`.

Примечание об одобрениях:

- Запуски Node на основе одобрений привязываются к точному контексту запроса.
- Для прямых shell/runtime-выполнений файлов OpenClaw также по мере возможности привязывает один конкретный локальный файловый операнд и запрещает запуск, если этот файл изменится до выполнения.
- Если OpenClaw не может определить ровно один конкретный локальный файл для команды интерпретатора/runtime, выполнение на основе одобрения запрещается, вместо того чтобы имитировать полное покрытие runtime. Используйте песочницу, отдельные хосты или явный доверенный список разрешений/полный workflow для более широких семантик интерпретатора.

### Запуск хоста Node (передний план)

На машине Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Удаленный Gateway через SSH-туннель (привязка к loopback)

Если Gateway привязан к loopback (`gateway.bind=loopback`, по умолчанию в локальном режиме), удаленные хосты Node не могут подключиться напрямую. Создайте SSH-туннель и направьте хост Node на локальный конец туннеля.

Пример (хост Node -> хост Gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Примечания:

- `openclaw node run` поддерживает аутентификацию по токену или паролю.
- Предпочтительны переменные окружения: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Резервная конфигурация: `gateway.auth.token` / `gateway.auth.password`.
- В локальном режиме хост Node намеренно игнорирует `gateway.remote.token` / `gateway.remote.password`.
- В удаленном режиме `gateway.remote.token` / `gateway.remote.password` применимы согласно правилам приоритета для удаленного режима.
- Если настроены активные локальные SecretRefs `gateway.auth.*`, но они не разрешены, аутентификация хоста Node завершается отказом.
- Разрешение аутентификации хоста Node учитывает только переменные окружения `OPENCLAW_GATEWAY_*`.

### Запуск хоста Node (служба)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Сопряжение и имя

На хосте Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Если Node повторяет попытку с измененными данными аутентификации, повторно выполните `openclaw devices list` и одобрите текущий `requestId`.

Варианты именования:

- `--display-name` в `openclaw node run` / `openclaw node install` (сохраняется в `~/.openclaw/node.json` на Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (переопределение Gateway).

### Добавление команд в список разрешений

Одобрения exec являются **отдельными для каждого хоста Node**. Добавьте записи списка разрешений из Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Одобрения находятся на хосте Node в `~/.openclaw/exec-approvals.json`.

### Направление exec на Node

Настройте значения по умолчанию (конфигурация Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Или для отдельной сессии:

```
/exec host=node security=allowlist node=<id-or-name>
```

После настройки любой вызов `exec` с `host=node` выполняется на хосте Node (с учетом списка разрешений/одобрений Node).

`host=auto` не будет неявно выбирать Node самостоятельно, но явный запрос `host=node` для отдельного вызова разрешен из `auto`. Если вы хотите, чтобы exec на Node был значением по умолчанию для сессии, явно задайте `tools.exec.host=node` или `/exec host=node ...`.

Связанное:

- [CLI хоста Node](/ru/cli/node)
- [Инструмент Exec](/ru/tools/exec)
- [Одобрения Exec](/ru/tools/exec-approvals)

## Вызов команд

Низкий уровень (сырой RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Для распространенных workflow «передать агенту вложение MEDIA» существуют помощники более высокого уровня.

## Политика команд

Перед вызовом команды Node должны пройти две проверки:

1. Node должен объявить команду в своем списке WebSocket `connect.commands`.
2. Политика платформы Gateway должна разрешать объявленную команду.

Сопутствующие Node для Windows и macOS по умолчанию разрешают безопасные объявленные команды, такие как `canvas.*`, `camera.list`, `location.get` и `screen.snapshot`. Доверенные Node, которые рекламируют возможность `talk` или объявляют команды `talk.*`, также по умолчанию разрешают объявленные команды push-to-talk (`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`), независимо от метки платформы. Опасные команды или команды с высоким влиянием на приватность, такие как `camera.snap`, `camera.clip` и `screen.record`, по-прежнему требуют явного включения через `gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` всегда имеет приоритет над значениями по умолчанию и дополнительными записями списка разрешений.

Команды Node, принадлежащие Plugin, могут добавить политику node-invoke Gateway. Эта политика выполняется после проверки списка разрешений и перед пересылкой на Node, поэтому сырой `node.invoke`, помощники CLI и специализированные инструменты агента используют одну и ту же границу разрешений Plugin. Опасные команды Node из Plugin по-прежнему требуют явного включения через `gateway.nodes.allowCommands`.

После изменения объявленного списка команд Node отклоните старое сопряжение устройства и одобрите новый запрос, чтобы Gateway сохранил обновленный снимок команд.

## Конфигурация (`openclaw.json`)

Настройки, связанные с Node, находятся в `gateway.nodes` и `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Используйте точные имена команд Node. `denyCommands` удаляет команду даже тогда, когда значение платформы по умолчанию или запись `allowCommands` иначе разрешили бы ее. См. [справочник конфигурации Gateway](/ru/gateway/configuration-reference#gateway-field-details) для подробностей о полях сопряжения Node Gateway и политики команд.

Переопределение Node для exec на уровне агента:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Скриншоты (снимки canvas)

Если Node показывает Canvas (WebView), `canvas.snapshot` возвращает `{ format, base64 }`.

Помощник CLI (записывает во временный файл и выводит сохраненный путь):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Управление Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Примечания:

- `canvas present` принимает URL или пути к локальным файлам (`--target`), а также необязательные `--x/--y/--width/--height` для позиционирования.
- `canvas eval` принимает встроенный JS (`--js`) или позиционный аргумент.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Примечания:

- Мобильные Node используют встроенную страницу A2UI, принадлежащую приложению, для рендеринга с поддержкой действий.
- Поддерживается только A2UI v0.8 JSONL (v0.9/createSurface отклоняется).
- iOS и Android отображают удаленные страницы Gateway Canvas, но действия кнопок A2UI отправляются только со встроенной страницы A2UI, принадлежащей приложению. HTTP/HTTPS-страницы A2UI, размещенные на Gateway, на этих мобильных клиентах доступны только для рендеринга.

## Фото и видео (камера Node)

Фото (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Видеоклипы (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Примечания:

- Узел должен быть **на переднем плане** для `canvas.*` и `camera.*` (фоновые вызовы возвращают `NODE_BACKGROUND_UNAVAILABLE`).
- Длительность клипа ограничивается (сейчас `<= 60s`), чтобы избежать слишком больших полезных нагрузок base64.
- Android по возможности запросит разрешения `CAMERA`/`RECORD_AUDIO`; при отказе разрешения команда завершится ошибкой `*_PERMISSION_REQUIRED`.

## Записи экрана (узлы)

Поддерживаемые узлы предоставляют `screen.record` (mp4). Пример:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Примечания:

- Доступность `screen.record` зависит от платформы узла.
- Записи экрана ограничиваются `<= 60s`.
- `--no-audio` отключает захват микрофона на поддерживаемых платформах.
- Используйте `--screen <index>`, чтобы выбрать дисплей, когда доступно несколько экранов.

## Местоположение (узлы)

Узлы предоставляют `location.get`, когда местоположение включено в настройках.

Вспомогательная команда CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Примечания:

- Местоположение **выключено по умолчанию**.
- «Всегда» требует системного разрешения; фоновое получение выполняется по мере возможности.
- Ответ включает широту/долготу, точность (в метрах) и временную метку.

## SMS (узлы Android)

Узлы Android могут предоставлять `sms.send`, когда пользователь выдает разрешение **SMS** и устройство поддерживает телефонию.

Низкоуровневый вызов:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примечания:

- Запрос разрешения должен быть принят на устройстве Android до того, как возможность будет опубликована.
- Устройства только с Wi-Fi без телефонии не будут публиковать `sms.send`.

## Команды устройства Android и личных данных

Узлы Android могут объявлять дополнительные семейства команд, когда включены соответствующие возможности.

Доступные семейства:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps`, когда в настройках Android включен общий доступ к установленным приложениям
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Примеры вызовов:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Примечания:

- `device.apps` включается явно и по умолчанию возвращает приложения, видимые в лаунчере.
- Команды движения ограничиваются возможностями доступных датчиков.

## Системные команды (хост узла / узел Mac)

Узел macOS предоставляет `system.run`, `system.notify` и `system.execApprovals.get/set`.
Безголовый хост узла предоставляет `system.run`, `system.which` и `system.execApprovals.get/set`.

Примеры:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примечания:

- `system.run` возвращает stdout/stderr/код выхода в полезной нагрузке.
- Выполнение shell теперь проходит через инструмент `exec` с `host=node`; `nodes` остается прямой RPC-поверхностью для явных команд узла.
- `nodes invoke` не предоставляет `system.run` или `system.run.prepare`; они остаются только на пути exec.
- Путь exec подготавливает канонический `systemRunPlan` перед подтверждением. После
  выдачи подтверждения Gateway пересылает этот сохраненный план, а не какие-либо позднее
  отредактированные вызывающей стороной поля команды/cwd/сессии.
- `system.notify` учитывает состояние разрешения уведомлений в приложении macOS.
- Нераспознанные метаданные узла `platform` / `deviceFamily` используют консервативный список разрешений по умолчанию, который исключает `system.run` и `system.which`. Если эти команды намеренно нужны для неизвестной платформы, добавьте их явно через `gateway.nodes.allowCommands`.
- `system.run` поддерживает `--cwd`, `--env KEY=VAL`, `--command-timeout` и `--needs-screen-recording`.
- Для оболочек-оберток (`bash|sh|zsh ... -c/-lc`) значения `--env`, ограниченные запросом, сокращаются до явного списка разрешений (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для решений «разрешать всегда» в режиме списка разрешений известные обертки диспетчеризации (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) сохраняют пути внутренних исполняемых файлов вместо путей оберток. Если безопасное разворачивание невозможно, запись списка разрешений автоматически не сохраняется.
- На хостах узлов Windows в режиме списка разрешений запуски оболочки-обертки через `cmd.exe /c` требуют подтверждения (одна запись в списке разрешений не разрешает форму обертки автоматически).
- `system.notify` поддерживает `--priority <passive|active|timeSensitive>` и `--delivery <system|overlay|auto>`.
- Хосты узлов игнорируют переопределения `PATH` и удаляют опасные ключи запуска/оболочки (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Если нужны дополнительные записи PATH, настройте окружение службы хоста узла (или установите инструменты в стандартные расположения), а не передавайте `PATH` через `--env`.
- В режиме узла macOS `system.run` ограничивается подтверждениями exec в приложении macOS (Настройки → Подтверждения exec).
  Ask/allowlist/full ведут себя так же, как безголовый хост узла; отклоненные запросы возвращают `SYSTEM_RUN_DENIED`.
- На безголовом хосте узла `system.run` ограничивается подтверждениями exec (`~/.openclaw/exec-approvals.json`).

## Привязка узла exec

Когда доступно несколько узлов, можно привязать exec к конкретному узлу.
Это задает узел по умолчанию для `exec host=node` (и может быть переопределено для каждого агента).

Глобальное значение по умолчанию:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Переопределение для агента:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Сброс, чтобы разрешить любой узел:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Карта разрешений

Узлы могут включать карту `permissions` в `node.list` / `node.describe`, с ключами по имени разрешения (например, `screenRecording`, `accessibility`) и булевыми значениями (`true` = выдано).

## Безголовый хост узла (кроссплатформенный)

OpenClaw может запускать **безголовый хост узла** (без UI), который подключается к WebSocket
Gateway и предоставляет `system.run` / `system.which`. Это полезно на Linux/Windows
или для запуска минимального узла рядом с сервером.

Запуск:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примечания:

- Сопряжение по-прежнему требуется (Gateway покажет запрос сопряжения устройства).
- Хост узла хранит свой идентификатор узла, токен, отображаемое имя и сведения о подключении к Gateway в `~/.openclaw/node.json`.
- Подтверждения exec применяются локально через `~/.openclaw/exec-approvals.json`
  (см. [Подтверждения exec](/ru/tools/exec-approvals)).
- На macOS безголовый хост узла по умолчанию выполняет `system.run` локально. Задайте
  `OPENCLAW_NODE_EXEC_HOST=app`, чтобы направлять `system.run` через exec-хост сопутствующего приложения; добавьте
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, чтобы требовать хост приложения и завершаться отказом, если он недоступен.
- Добавьте `--tls` / `--tls-fingerprint`, когда WS Gateway использует TLS.

## Режим узла Mac

- Приложение macOS в строке меню подключается к серверу WS Gateway как узел (поэтому `openclaw nodes …` работает с этим Mac).
- В удаленном режиме приложение открывает SSH-туннель для порта Gateway и подключается к `localhost`.
