---
read_when:
    - Сполучення вузлів iOS/Android із gateway
    - Використання canvas/camera Node для контексту агента
    - Додавання нових команд Node або допоміжних засобів CLI
summary: 'Вузли: сполучення, можливості, дозволи та CLI-помічники для полотна/камери/екрана/пристрою/сповіщень/системи'
title: Вузли
x-i18n:
    generated_at: "2026-07-03T09:57:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

**Node** — це супутній пристрій (macOS/iOS/Android/headless), який підключається до **WebSocket** Gateway (той самий порт, що й оператори) з `role: "node"` і надає поверхню команд (наприклад, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Деталі протоколу: [протокол Gateway](/uk/gateway/protocol).

Застарілий транспорт: [протокол Bridge](/uk/gateway/bridge-protocol) (TCP JSONL;
лише історичний для поточних Node).

macOS також може працювати в **режимі Node**: застосунок у рядку меню підключається до
WS-сервера Gateway і надає свої локальні команди canvas/camera як Node (тому
`openclaw nodes …` працює з цим Mac). У режимі віддаленого Gateway автоматизацію
браузера виконує хост CLI Node (`openclaw node run` або встановлена служба Node),
а не Node нативного застосунку.

Примітки:

- Node — це **периферійні пристрої**, а не gateway-и. Вони не запускають службу gateway.
- Повідомлення Telegram/WhatsApp/тощо надходять на **gateway**, а не на Node.
- Runbook для усунення несправностей: [/nodes/troubleshooting](/uk/nodes/troubleshooting)

## Спарювання + стан

**WS Node використовують спарювання пристроїв.** Node подають ідентичність пристрою під час `connect`; Gateway
створює запит на спарювання пристрою для `role: node`. Схваліть через CLI пристроїв (або UI).

Швидкий CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Якщо Node повторює спробу зі зміненими даними автентифікації (роль/області дії/публічний ключ), попередній
очікуваний запит замінюється, і створюється новий `requestId`. Повторно виконайте
`openclaw devices list` перед схваленням.

Примітки:

- `nodes status` позначає Node як **спарений**, коли його роль спарювання пристрою містить `node`.
- Запис спарювання пристрою є довговічним контрактом схваленої ролі. Ротація
  токенів залишається всередині цього контракту; вона не може підвищити спарений Node до
  іншої ролі, яку схвалення спарювання ніколи не надавало.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) — це окреме сховище
  спарювання Node, яким володіє gateway; воно **не** обмежує handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` видаляє спарювання Node. Для
  Node, прив’язаного до пристрою, це відкликає роль `node` пристрою в `devices/paired.json`
  і відключає сеанси цього пристрою з роллю Node — пристрій зі змішаними ролями зберігає
  свій рядок і втрачає лише роль `node`, тоді як рядок пристрою лише з роллю Node
  видаляється. Це також очищає будь-який відповідний запис з окремого сховища
  спарювання Node, яким володіє gateway. `operator.pairing` може видаляти рядки Node, що не є операторами; викликач із токеном пристрою, який відкликає власну роль Node на пристрої зі змішаними ролями,
  додатково потребує `operator.admin`.
- Область дії схвалення відповідає заявленим командам очікуваного запиту:
  - запит без команд: `operator.pairing`
  - команди Node без exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Віддалений хост Node (system.run)

Використовуйте **хост Node**, коли ваш Gateway працює на одній машині, а команди мають
виконуватися на іншій. Модель усе ще спілкується з **gateway**; gateway
пересилає виклики `exec` до **хоста Node**, коли вибрано `host=node`.

### Що де виконується

- **Хост Gateway**: отримує повідомлення, запускає модель, маршрутизує виклики інструментів.
- **Хост Node**: виконує `system.run`/`system.which` на машині Node.
- **Схвалення**: застосовуються на хості Node через `~/.openclaw/exec-approvals.json`.

Примітка щодо схвалень:

- Запуски Node із підтримкою схвалень прив’язують точний контекст запиту.
- Для прямих виконань shell/runtime файлів OpenClaw також, наскільки можливо, прив’язує один конкретний локальний
  файловий операнд і відхиляє запуск, якщо цей файл змінюється до виконання.
- Якщо OpenClaw не може ідентифікувати рівно один конкретний локальний файл для команди інтерпретатора/runtime,
  виконання із підтримкою схвалення відхиляється замість удаваного повного покриття runtime. Використовуйте sandboxing,
  окремі хости або явний довірений allowlist/повний workflow для ширшої семантики інтерпретатора.

### Запуск хоста Node (foreground)

На машині Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Віддалений gateway через SSH-тунель (loopback bind)

Якщо Gateway прив’язується до loopback (`gateway.bind=loopback`, типовий варіант у локальному режимі),
віддалені хости Node не можуть підключитися напряму. Створіть SSH-тунель і спрямуйте
хост Node на локальний кінець тунелю.

Приклад (хост Node -> хост gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Примітки:

- `openclaw node run` підтримує автентифікацію токеном або паролем.
- Змінні середовища бажані: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Резервна конфігурація: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост Node навмисно ігнорує `gateway.remote.token` / `gateway.remote.password`.
- У віддаленому режимі `gateway.remote.token` / `gateway.remote.password` придатні відповідно до правил пріоритету віддаленого режиму.
- Якщо налаштовано активні локальні SecretRefs `gateway.auth.*`, але їх не розв’язано, автентифікація хоста Node завершується fail-closed.
- Розв’язання автентифікації хоста Node враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

### Запуск хоста Node (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Спарювання + назва

На хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Якщо Node повторює спробу зі зміненими даними автентифікації, повторно виконайте `openclaw devices list`
і схваліть поточний `requestId`.

Варіанти іменування:

- `--display-name` у `openclaw node run` / `openclaw node install` (зберігається в `~/.openclaw/node.json` на Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (перевизначення gateway).

### Додайте команди до allowlist

Схвалення exec є **окремими для кожного хоста Node**. Додайте записи allowlist з gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Схвалення зберігаються на хості Node у `~/.openclaw/exec-approvals.json`.

### Спрямуйте exec на Node

Налаштуйте типові значення (конфігурація gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Або для сеансу:

```
/exec host=node security=allowlist node=<id-or-name>
```

Після налаштування будь-який виклик `exec` з `host=node` виконується на хості Node (з урахуванням
allowlist/схвалень Node).

`host=auto` не вибере Node неявно самостійно, але явний запит `host=node` для окремого виклику дозволений з `auto`. Якщо потрібно, щоб exec на Node був типовим для сеансу, явно встановіть `tools.exec.host=node` або `/exec host=node ...`.

Пов’язане:

- [CLI хоста Node](/uk/cli/node)
- [Інструмент exec](/uk/tools/exec)
- [Схвалення exec](/uk/tools/exec-approvals)

### Локальне виведення моделі

Desktop або серверний Node може надавати моделі з можливістю чату з сервера Ollama,
що працює на цьому Node. Агенти використовують інструмент `node_inference` Plugin Ollama, щоб
виявляти встановлені моделі та запускати обмежений prompt віддалено; Gateway
не потребує прямого мережевого доступу до Ollama. Див. [локальне для Node виведення Ollama](/uk/providers/ollama#node-local-inference)
для налаштування, фільтрації моделей і команд прямої перевірки.

## Виклик команд

Низькорівнево (raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Існують високорівневі helper-и для поширених workflow «дати агенту вкладення MEDIA».

## Політика команд

Команди Node мають пройти двоє воріт, перш ніж їх можна буде викликати:

1. Node має оголосити команду у своєму списку WebSocket `connect.commands`.
2. Політика платформи gateway має дозволити оголошену команду.

Супутні Node Windows і macOS за замовчуванням дозволяють безпечні оголошені команди, як-от
`canvas.*`, `camera.list`, `location.get` і `screen.snapshot`.
Довірені Node, які рекламують capability `talk` або оголошують команди `talk.*`,
також за замовчуванням дозволяють оголошені команди push-to-talk (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), незалежно від мітки платформи.
Небезпечні або чутливі до приватності команди, як-от `camera.snap`, `camera.clip` і
`screen.record`, усе ще потребують явного opt-in через
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` завжди має перевагу над
типовими значеннями та додатковими записами allowlist.

Команди Node, якими володіє Plugin, можуть додати політику node-invoke Gateway. Ця політика
виконується після перевірки allowlist і перед пересиланням до Node, тому raw
`node.invoke`, CLI helper-и та спеціалізовані інструменти агента мають однакову межу
дозволів Plugin. Небезпечні команди Node від Plugin усе ще потребують явного
opt-in `gateway.nodes.allowCommands`.

Після того як Node змінює свій оголошений список команд, відхиліть старе спарювання пристрою
і схваліть новий запит, щоб gateway зберіг оновлений snapshot команд.

## Конфігурація (`openclaw.json`)

Налаштування, пов’язані з Node, розташовані в `gateway.nodes` і `tools.exec`:

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

Використовуйте точні назви команд Node. `denyCommands` вилучає команду навіть тоді, коли
типове значення платформи або запис `allowCommands` інакше дозволив би її. Див.
[довідник конфігурації Gateway](/uk/gateway/configuration-reference#gateway-field-details)
для деталей полів спарювання Node gateway і політики команд.

Перевизначення exec Node для окремого агента:

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

## Скриншоти (snapshots canvas)

Якщо Node показує Canvas (WebView), `canvas.snapshot` повертає `{ format, base64 }`.

CLI helper (записує у тимчасовий файл і друкує збережений шлях):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Елементи керування Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Примітки:

- `canvas present` приймає URL-адреси або локальні файлові шляхи (`--target`), а також необов’язкові `--x/--y/--width/--height` для позиціювання.
- `canvas eval` приймає inline JS (`--js`) або позиційний аргумент.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Примітки:

- Мобільні вузли використовують вбудовану сторінку A2UI, що належить застосунку, для рендерингу з підтримкою дій.
- Підтримується лише A2UI v0.8 JSONL (v0.9/createSurface відхиляється).
- iOS і Android рендерять віддалені сторінки Gateway Canvas, але дії кнопок A2UI надсилаються лише з вбудованої сторінки A2UI, що належить застосунку. Сторінки A2UI HTTP/HTTPS, розміщені на Gateway, на цих мобільних клієнтах доступні лише для рендерингу.

## Фото + відео (камера вузла)

Фото (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Відеокліпи (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Примітки:

- Вузол має бути **на передньому плані** для `canvas.*` і `camera.*` (фонові виклики повертають `NODE_BACKGROUND_UNAVAILABLE`).
- Тривалість кліпу обмежується (зараз `<= 60s`), щоб уникнути надмірно великих base64-навантажень.
- Android за можливості запитає дозволи `CAMERA`/`RECORD_AUDIO`; відхилені дозволи завершуються помилкою `*_PERMISSION_REQUIRED`.

## Записи екрана (вузли)

Підтримувані вузли надають `screen.record` (mp4). Приклад:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Примітки:

- Доступність `screen.record` залежить від платформи вузла.
- Записи екрана обмежуються до `<= 60s`.
- `--no-audio` вимикає захоплення мікрофона на підтримуваних платформах.
- Використовуйте `--screen <index>`, щоб вибрати дисплей, коли доступно кілька екранів.

## Геолокація (вузли)

Вузли надають `location.get`, коли геолокацію ввімкнено в налаштуваннях.

Допоміжна команда CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Примітки:

- Геолокація **вимкнена за замовчуванням**.
- "Завжди" потребує системного дозволу; фонове отримання виконується за принципом best-effort.
- Відповідь містить lat/lon, точність (метри) і мітку часу.

## SMS (вузли Android)

Вузли Android можуть надавати `sms.send`, коли користувач надає дозвіл **SMS**, а пристрій підтримує телефонію.

Низькорівневий виклик:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примітки:

- Запит дозволу потрібно прийняти на пристрої Android, перш ніж можливість буде оголошена.
- Пристрої лише з Wi-Fi без телефонії не оголошуватимуть `sms.send`.

## Команди пристрою Android + особистих даних

Вузли Android можуть оголошувати додаткові сімейства команд, коли ввімкнено відповідні можливості.

Доступні сімейства:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps`, коли в налаштуваннях Android увімкнено спільний доступ до встановлених застосунків
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Приклади викликів:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Примітки:

- `device.apps` є opt-in і за замовчуванням повертає застосунки, видимі в лаунчері.
- Команди руху обмежуються можливостями доступних датчиків.

## Системні команди (хост вузла / вузол Mac)

Вузол macOS надає `system.run`, `system.notify` і `system.execApprovals.get/set`.
Headless-хост вузла надає `system.run`, `system.which` і `system.execApprovals.get/set`.

Приклади:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примітки:

- `system.run` повертає stdout/stderr/код виходу в payload.
- Виконання shell тепер проходить через інструмент `exec` з `host=node`; `nodes` залишається поверхнею direct-RPC для явних команд вузла.
- `nodes invoke` не надає `system.run` або `system.run.prepare`; вони залишаються лише на шляху exec.
- Шлях exec готує канонічний `systemRunPlan` перед схваленням. Щойно
  схвалення надано, gateway пересилає цей збережений план, а не будь-які пізніше
  змінені викликачем поля command/cwd/session.
- `system.notify` поважає стан дозволу на сповіщення в застосунку macOS.
- Нерозпізнані метадані вузла `platform` / `deviceFamily` використовують консервативний allowlist за замовчуванням, який виключає `system.run` і `system.which`. Якщо вам навмисно потрібні ці команди для невідомої платформи, додайте їх явно через `gateway.nodes.allowCommands`.
- `system.run` підтримує `--cwd`, `--env KEY=VAL`, `--command-timeout` і `--needs-screen-recording`.
- Для shell-обгорток (`bash|sh|zsh ... -c/-lc`) значення `--env` у межах запиту скорочуються до явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень allow-always у режимі allowlist відомі dispatch-обгортки (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають шляхи внутрішніх виконуваних файлів замість шляхів обгорток. Якщо розгортання небезпечне, жоден запис allowlist не зберігається автоматично.
- На хостах вузлів Windows у режимі allowlist запуски shell-обгорток через `cmd.exe /c` потребують схвалення (самого запису allowlist недостатньо, щоб автоматично дозволити форму обгортки).
- `system.notify` підтримує `--priority <passive|active|timeSensitive>` і `--delivery <system|overlay|auto>`.
- Хости вузлів ігнорують перевизначення `PATH` і видаляють небезпечні ключі запуску/shell (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Якщо вам потрібні додаткові записи PATH, налаштуйте середовище служби хоста вузла (або встановіть інструменти в стандартних розташуваннях) замість передавання `PATH` через `--env`.
- У режимі вузла macOS `system.run` обмежується схваленнями exec у застосунку macOS (Settings → Exec approvals).
  Ask/allowlist/full поводяться так само, як headless-хост вузла; відхилені запити повертають `SYSTEM_RUN_DENIED`.
- На headless-хості вузла `system.run` обмежується схваленнями exec (`~/.openclaw/exec-approvals.json`).

## Прив’язування вузла exec

Коли доступно кілька вузлів, ви можете прив’язати exec до певного вузла.
Це встановлює вузол за замовчуванням для `exec host=node` (і може бути перевизначено для кожного агента).

Глобальне значення за замовчуванням:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Перевизначення для агента:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Скасувати налаштування, щоб дозволити будь-який вузол:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Мапа дозволів

Вузли можуть містити мапу `permissions` у `node.list` / `node.describe`, індексовану за назвою дозволу (наприклад, `screenRecording`, `accessibility`) з булевими значеннями (`true` = надано).

## Headless-хост вузла (кросплатформний)

OpenClaw може запускати **headless-хост вузла** (без UI), який підключається до WebSocket Gateway
і надає `system.run` / `system.which`. Це корисно на Linux/Windows
або для запуску мінімального вузла поруч із сервером.

Запустіть його:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примітки:

- Сполучення все одно потрібне (Gateway покаже запит на сполучення пристрою).
- Хост вузла зберігає свій id вузла, токен, відображуване ім’я та інформацію про підключення до gateway у `~/.openclaw/node.json`.
- Схвалення exec застосовуються локально через `~/.openclaw/exec-approvals.json`
  (див. [Схвалення exec](/uk/tools/exec-approvals)).
- На macOS headless-хост вузла за замовчуванням виконує `system.run` локально. Установіть
  `OPENCLAW_NODE_EXEC_HOST=app`, щоб спрямувати `system.run` через хост exec у супровідному застосунку; додайте
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, щоб вимагати хост застосунку й завершуватися fail closed, якщо він недоступний.
- Додайте `--tls` / `--tls-fingerprint`, коли Gateway WS використовує TLS.

## Режим вузла Mac

- Застосунок панелі меню macOS підключається до сервера Gateway WS як вузол (тож `openclaw nodes …` працює з цим Mac).
- У віддаленому режимі застосунок відкриває SSH-тунель для порту Gateway і підключається до `localhost`.
