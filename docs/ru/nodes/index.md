---
read_when:
    - Сопряжение узлов iOS/Android с gateway
    - Использование узла canvas/camera для контекста агента
    - Добавление новых команд узлов или вспомогательных команд CLI
summary: 'Узлы: сопряжение, возможности, разрешения и вспомогательные CLI-команды для холста/камеры/экрана/устройства/уведомлений/системы'
title: Узлы
x-i18n:
    generated_at: "2026-07-03T09:51:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

**node** — это сопутствующее устройство (macOS/iOS/Android/headless), которое подключается к **WebSocket** Gateway (тот же порт, что и у операторов) с `role: "node"` и предоставляет поверхность команд (например, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Подробности протокола: [протокол Gateway](/ru/gateway/protocol).

Устаревший транспорт: [протокол Bridge](/ru/gateway/bridge-protocol) (TCP JSONL;
только исторически для текущих nodes).

macOS также может работать в **режиме node**: приложение в строке меню подключается к
WS-серверу Gateway и предоставляет свои локальные команды canvas/camera как node (поэтому
`openclaw nodes …` работает с этим Mac). В режиме удаленного gateway автоматизацией
браузера занимается хост node CLI (`openclaw node run` или
установленная служба node), а не node нативного приложения.

Примечания:

- Nodes — это **периферийные устройства**, а не gateways. Они не запускают службу gateway.
- Сообщения Telegram/WhatsApp/и т. д. поступают на **gateway**, а не на nodes.
- Runbook по устранению неполадок: [/nodes/troubleshooting](/ru/nodes/troubleshooting)

## Сопряжение + состояние

**WS nodes используют сопряжение устройств.** Nodes предъявляют идентичность устройства во время `connect`; Gateway
создает запрос на сопряжение устройства для `role: node`. Подтвердите через CLI устройств (или UI).

Быстрый CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Если node повторяет попытку с измененными данными аутентификации (роль/области доступа/публичный ключ), предыдущий
ожидающий запрос заменяется и создается новый `requestId`. Повторно выполните
`openclaw devices list` перед подтверждением.

Примечания:

- `nodes status` помечает node как **сопряженный**, когда его роль сопряжения устройства включает `node`.
- Запись сопряжения устройства — это долговечный контракт утвержденной роли. Ротация токенов
  остается внутри этого контракта; она не может повысить сопряженный node до
  другой роли, которую подтверждение сопряжения никогда не предоставляло.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) — это отдельное хранилище
  сопряжений node, принадлежащее gateway; оно **не** ограничивает WS-рукопожатие `connect`.
- `openclaw nodes remove --node <id|name|ip>` удаляет сопряжение node. Для
  node на основе устройства это отзывает роль `node` устройства в `devices/paired.json`
  и отключает сеансы этого устройства с ролью node — устройство со смешанными ролями сохраняет
  свою строку и теряет только роль `node`, а строка устройства только с ролью node
  удаляется. Также очищается любая совпадающая запись из отдельного хранилища сопряжений node,
  принадлежащего gateway. `operator.pairing` может удалять строки node, не являющиеся operator; вызывающему
  с токеном устройства, который отзывает собственную роль node на устройстве со смешанными ролями,
  дополнительно требуется `operator.admin`.
- Область доступа подтверждения следует заявленным командам ожидающего запроса:
  - запрос без команд: `operator.pairing`
  - команды node без exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Удаленный хост node (system.run)

Используйте **хост node**, когда ваш Gateway работает на одной машине, а вы хотите, чтобы команды
выполнялись на другой. Модель по-прежнему общается с **gateway**; gateway
пересылает вызовы `exec` на **хост node**, когда выбран `host=node`.

### Что где выполняется

- **Хост Gateway**: принимает сообщения, запускает модель, маршрутизирует вызовы инструментов.
- **Хост node**: выполняет `system.run`/`system.which` на машине node.
- **Подтверждения**: применяются на хосте node через `~/.openclaw/exec-approvals.json`.

Примечание о подтверждениях:

- Запуски node на основе подтверждений привязывают точный контекст запроса.
- Для прямых shell/runtime-выполнений файлов OpenClaw также по возможности привязывает один конкретный локальный
  файловый операнд и запрещает запуск, если этот файл изменится до выполнения.
- Если OpenClaw не может точно определить один конкретный локальный файл для команды интерпретатора/runtime,
  выполнение на основе подтверждения запрещается вместо имитации полного покрытия runtime. Используйте песочницу,
  отдельные хосты или явно доверенный allowlist/полный workflow для более широких семантик интерпретатора.

### Запустить хост node (на переднем плане)

На машине node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Удаленный gateway через SSH-туннель (привязка loopback)

Если Gateway привязан к loopback (`gateway.bind=loopback`, по умолчанию в локальном режиме),
удаленные хосты node не могут подключаться напрямую. Создайте SSH-туннель и направьте
хост node на локальный конец туннеля.

Пример (хост node -> хост gateway):

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
- В локальном режиме хост node намеренно игнорирует `gateway.remote.token` / `gateway.remote.password`.
- В удаленном режиме `gateway.remote.token` / `gateway.remote.password` допустимы согласно правилам приоритета для удаленного режима.
- Если активные локальные SecretRefs `gateway.auth.*` настроены, но не разрешены, аутентификация хоста node завершается закрыто.
- Разрешение аутентификации хоста node учитывает только переменные окружения `OPENCLAW_GATEWAY_*`.

### Запустить хост node (служба)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Сопряжение + имя

На хосте gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Если node повторяет попытку с измененными данными аутентификации, повторно выполните `openclaw devices list`
и подтвердите текущий `requestId`.

Варианты именования:

- `--display-name` в `openclaw node run` / `openclaw node install` (сохраняется в `~/.openclaw/node.json` на node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (переопределение gateway).

### Добавить команды в allowlist

Подтверждения exec действуют **для каждого хоста node**. Добавьте записи allowlist с gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Подтверждения находятся на хосте node в `~/.openclaw/exec-approvals.json`.

### Направить exec на node

Настройте значения по умолчанию (конфигурация gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Или для сеанса:

```
/exec host=node security=allowlist node=<id-or-name>
```

После настройки любой вызов `exec` с `host=node` выполняется на хосте node (с учетом
allowlist/подтверждений node).

`host=auto` не будет неявно выбирать node самостоятельно, но явный запрос `host=node` для отдельного вызова разрешен из `auto`. Если вы хотите, чтобы node exec был значением по умолчанию для сеанса, явно задайте `tools.exec.host=node` или `/exec host=node ...`.

Связано:

- [CLI хоста node](/ru/cli/node)
- [Инструмент exec](/ru/tools/exec)
- [Подтверждения exec](/ru/tools/exec-approvals)

### Локальный вывод модели

Настольный или серверный node может предоставлять модели с поддержкой чата с сервера Ollama,
запущенного на этом node. Агенты используют инструмент `node_inference` Plugin Ollama, чтобы
обнаруживать установленные модели и удаленно запускать ограниченный prompt; Gateway не
нужен прямой сетевой доступ к Ollama. См. [локальный для node вывод Ollama](/ru/providers/ollama#node-local-inference)
для настройки, фильтрации моделей и команд прямой проверки.

## Вызов команд

Низкий уровень (сырой RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Существуют помощники более высокого уровня для распространенных workflow «дать агенту вложение MEDIA».

## Политика команд

Команды node должны пройти две проверки, прежде чем их можно вызвать:

1. Node должен объявить команду в своем списке WebSocket `connect.commands`.
2. Политика платформы gateway должна разрешить объявленную команду.

Сопутствующие nodes Windows и macOS по умолчанию разрешают безопасные объявленные команды, такие как
`canvas.*`, `camera.list`, `location.get` и `screen.snapshot`.
Доверенные nodes, которые рекламируют возможность `talk` или объявляют команды `talk.*`,
также по умолчанию разрешают объявленные команды push-to-talk (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), независимо от метки платформы.
Опасные или чувствительные к приватности команды, такие как `camera.snap`, `camera.clip` и
`screen.record`, по-прежнему требуют явного включения через
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` всегда имеет приоритет над
значениями по умолчанию и дополнительными записями allowlist.

Команды node, принадлежащие Plugin, могут добавить политику Gateway для node-invoke. Эта политика
выполняется после проверки allowlist и перед пересылкой на node, поэтому сырой
`node.invoke`, помощники CLI и специализированные инструменты агента используют одну и ту же границу
разрешений Plugin. Опасные команды node Plugin по-прежнему требуют явного
включения через `gateway.nodes.allowCommands`.

После того как node изменит объявленный список команд, отклоните старое сопряжение устройства
и подтвердите новый запрос, чтобы gateway сохранил обновленный снимок команд.

## Конфигурация (`openclaw.json`)

Настройки, связанные с node, находятся в `gateway.nodes` и `tools.exec`:

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

Используйте точные имена команд node. `denyCommands` удаляет команду, даже если
значение платформы по умолчанию или запись `allowCommands` иначе разрешали бы ее. См.
[справочник конфигурации Gateway](/ru/gateway/configuration-reference#gateway-field-details)
для подробностей о полях сопряжения node gateway и политики команд.

Переопределение node для exec на уровне агента:

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

Если node показывает Canvas (WebView), `canvas.snapshot` возвращает `{ format, base64 }`.

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

- `canvas present` принимает URL или локальные пути к файлам (`--target`), а также необязательные `--x/--y/--width/--height` для позиционирования.
- `canvas eval` принимает встроенный JS (`--js`) или позиционный аргумент.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Примечания:

- Мобильные узлы используют встроенную страницу A2UI, принадлежащую приложению, для рендеринга с поддержкой действий.
- Поддерживается только A2UI v0.8 JSONL (v0.9/createSurface отклоняется).
- iOS и Android рендерят удаленные страницы Gateway Canvas, но действия кнопок A2UI отправляются только со встроенной страницы A2UI, принадлежащей приложению. A2UI-страницы HTTP/HTTPS, размещенные на Gateway, на этих мобильных клиентах доступны только для рендеринга.

## Фото и видео (камера узла)

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
- Длительность клипа ограничивается (сейчас `<= 60s`), чтобы избежать слишком больших payload в base64.
- Android по возможности запросит разрешения `CAMERA`/`RECORD_AUDIO`; при отказе операции завершаются с ошибкой `*_PERMISSION_REQUIRED`.

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

## Геолокация (узлы)

Узлы предоставляют `location.get`, когда геолокация включена в настройках.

Вспомогательная команда CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Примечания:

- Геолокация **отключена по умолчанию**.
- "Always" требует системного разрешения; фоновая выборка выполняется по возможности.
- Ответ включает lat/lon, точность (в метрах) и временную метку.

## SMS (узлы Android)

Узлы Android могут предоставлять `sms.send`, когда пользователь выдает разрешение **SMS**, а устройство поддерживает телефонию.

Низкоуровневый вызов:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примечания:

- Запрос разрешения должен быть принят на устройстве Android до того, как возможность будет объявлена.
- Устройства только с Wi-Fi без телефонии не будут объявлять `sms.send`.

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

## Системные команды (хост узла / узел mac)

Узел macOS предоставляет `system.run`, `system.notify` и `system.execApprovals.get/set`.
Безголовый хост узла предоставляет `system.run`, `system.which` и `system.execApprovals.get/set`.

Примеры:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примечания:

- `system.run` возвращает stdout/stderr/код выхода в payload.
- Выполнение shell теперь проходит через инструмент `exec` с `host=node`; `nodes` остается поверхностью прямого RPC для явных команд узла.
- `nodes invoke` не предоставляет `system.run` или `system.run.prepare`; они остаются только на пути exec.
- Путь exec подготавливает канонический `systemRunPlan` перед подтверждением. После выдачи
  подтверждения gateway пересылает этот сохраненный план, а не какие-либо позднее
  измененные вызывающей стороной поля command/cwd/session.
- `system.notify` учитывает состояние разрешения на уведомления в приложении macOS.
- Нераспознанные метаданные узла `platform` / `deviceFamily` используют консервативный allowlist по умолчанию, который исключает `system.run` и `system.which`. Если эти команды намеренно нужны для неизвестной платформы, добавьте их явно через `gateway.nodes.allowCommands`.
- `system.run` поддерживает `--cwd`, `--env KEY=VAL`, `--command-timeout` и `--needs-screen-recording`.
- Для shell-оберток (`bash|sh|zsh ... -c/-lc`) значения `--env`, ограниченные запросом, сокращаются до явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для решений always allow в режиме allowlist известные обертки диспетчеризации (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) сохраняют пути внутренних исполняемых файлов вместо путей оберток. Если безопасно развернуть обертку нельзя, запись allowlist автоматически не сохраняется.
- На хостах узлов Windows в режиме allowlist запуски shell-оберток через `cmd.exe /c` требуют подтверждения (одной записи allowlist недостаточно для автоматического разрешения формы с оберткой).
- `system.notify` поддерживает `--priority <passive|active|timeSensitive>` и `--delivery <system|overlay|auto>`.
- Хосты узлов игнорируют переопределения `PATH` и удаляют опасные ключи запуска/shell (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Если нужны дополнительные записи PATH, настройте окружение службы хоста узла (или установите инструменты в стандартные расположения), вместо того чтобы передавать `PATH` через `--env`.
- В режиме узла macOS `system.run` ограничивается подтверждениями exec в приложении macOS (Settings → Exec approvals).
  Ask/allowlist/full работают так же, как на безголовом хосте узла; отклоненные запросы возвращают `SYSTEM_RUN_DENIED`.
- На безголовом хосте узла `system.run` ограничивается подтверждениями exec (`~/.openclaw/exec-approvals.json`).

## Привязка узла exec

Когда доступно несколько узлов, exec можно привязать к определенному узлу.
Это задает узел по умолчанию для `exec host=node` (и может переопределяться для каждого агента).

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

Узлы могут включать карту `permissions` в `node.list` / `node.describe`, индексированную по имени разрешения (например, `screenRecording`, `accessibility`) с булевыми значениями (`true` = предоставлено).

## Безголовый хост узла (кроссплатформенный)

OpenClaw может запускать **безголовый хост узла** (без UI), который подключается к WebSocket
Gateway и предоставляет `system.run` / `system.which`. Это полезно в Linux/Windows
или для запуска минимального узла рядом с сервером.

Запуск:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примечания:

- Сопряжение по-прежнему требуется (Gateway покажет запрос на сопряжение устройства).
- Хост узла хранит свой id узла, токен, отображаемое имя и сведения о подключении к gateway в `~/.openclaw/node.json`.
- Подтверждения exec применяются локально через `~/.openclaw/exec-approvals.json`
  (см. [Подтверждения exec](/ru/tools/exec-approvals)).
- В macOS безголовый хост узла по умолчанию выполняет `system.run` локально. Установите
  `OPENCLAW_NODE_EXEC_HOST=app`, чтобы направлять `system.run` через exec-хост сопутствующего приложения; добавьте
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, чтобы требовать хост приложения и завершаться закрыто, если он недоступен.
- Добавьте `--tls` / `--tls-fingerprint`, когда Gateway WS использует TLS.

## Режим узла Mac

- Приложение строки меню macOS подключается к серверу Gateway WS как узел (поэтому `openclaw nodes …` работает с этим Mac).
- В удаленном режиме приложение открывает SSH-туннель для порта Gateway и подключается к `localhost`.
