---
read_when:
    - Спарювання Node iOS/Android з gateway
    - Використання canvas/camera Node для контексту агента
    - Додавання нових команд Node або CLI-допоміжних засобів
summary: 'Node: спарювання, можливості, дозволи та CLI-допоміжні команди для canvas/camera/screen/device/notifications/system'
title: Node
x-i18n:
    generated_at: "2026-04-23T20:58:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Node** — це супровідний пристрій (macOS/iOS/Android/headless), який підключається до Gateway **WebSocket** (той самий порт, що й для операторів) з `role: "node"` і надає поверхню команд (наприклад, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Подробиці протоколу: [Gateway protocol](/uk/gateway/protocol).

Застарілий транспорт: [Bridge protocol](/uk/gateway/bridge-protocol) (TCP JSONL;
лише історичний варіант для поточних Node).

macOS також може працювати в **режимі node**: застосунок у рядку меню підключається до WS-сервера Gateway і надає свої локальні команди canvas/camera як node (тобто `openclaw nodes …` працює з цим Mac).

Примітки:

- Node — це **периферійні пристрої**, а не gateway. Вони не запускають сервіс gateway.
- Повідомлення Telegram/WhatsApp тощо потрапляють на **gateway**, а не на Node.
- Runbook для усунення несправностей: [/nodes/troubleshooting](/uk/nodes/troubleshooting)

## Спарювання + статус

**WS Node використовують спарювання пристроїв.** Під час `connect` Node надають ідентичність пристрою; Gateway
створює запит на спарювання пристрою для `role: node`. Схваліть через CLI пристроїв (або UI).

Швидкий CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Якщо node повторює спробу зі зміненими даними auth (role/scopes/public key), попередній
очікувальний запит замінюється, і створюється новий `requestId`. Перед схваленням
знову виконайте `openclaw devices list`.

Примітки:

- `nodes status` позначає node як **paired**, коли роль спарювання пристрою включає `node`.
- Запис спарювання пристрою — це довготривалий контракт схваленої ролі. Ротація
  token відбувається в межах цього контракту; вона не може підвищити paired node до
  іншої ролі, якої ніколи не надавало схвалення спарювання.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) — це окреме сховище
  спарювання node, яким володіє gateway; воно **не** визначає допуск для handshake `connect` у WS.
- Область схвалення залежить від команд, оголошених у запиті, що очікує:
  - запит без команд: `operator.pairing`
  - команди node без exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Віддалений хост node (system.run)

Використовуйте **node host**, коли ваш Gateway працює на одній машині, а ви хочете, щоб команди
виконувалися на іншій. Модель усе одно взаємодіє з **gateway**; gateway
пересилає виклики `exec` на **node host**, коли вибрано `host=node`.

### Що де виконується

- **Хост Gateway**: отримує повідомлення, запускає модель, маршрутизує виклики інструментів.
- **Хост Node**: виконує `system.run`/`system.which` на машині node.
- **Погодження**: застосовуються на хості node через `~/.openclaw/exec-approvals.json`.

Примітка щодо погоджень:

- Запуски node, що ґрунтуються на погодженні, прив’язують точний контекст запиту.
- Для прямих виконань shell/runtime-файлів OpenClaw також у режимі best-effort прив’язує один конкретний локальний
  операнд файла й забороняє запуск, якщо цей файл змінюється до виконання.
- Якщо OpenClaw не може точно визначити один конкретний локальний файл для команди інтерпретатора/runtime,
  виконання на основі погодження забороняється замість удавання повного покриття runtime. Використовуйте sandboxing,
  окремі хости або явний trusted allowlist/full workflow для ширшої семантики інтерпретатора.

### Запуск node host (на передньому плані)

На машині node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Віддалений gateway через SSH tunnel (bind у loopback)

Якщо Gateway прив’язаний до loopback (`gateway.bind=loopback`, типово в локальному режимі),
віддалені node host не можуть підключитися напряму. Створіть SSH tunnel і вкажіть
node host на локальний кінець цього тунелю.

Приклад (node host -> gateway host):

```bash
# Термінал A (залишити запущеним): переслати локальний 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Термінал B: експортувати токен gateway і підключитися через тунель
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Примітки:

- `openclaw node run` підтримує автентифікацію токеном або паролем.
- Перевага надається змінним середовища: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback конфігурації — `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі node host навмисно ігнорує `gateway.remote.token` / `gateway.remote.password`.
- У віддаленому режимі `gateway.remote.token` / `gateway.remote.password` допускаються згідно з правилами пріоритету для remote.
- Якщо активні локальні SecretRef у `gateway.auth.*` налаштовано, але не визначено, auth node-host завершується в режимі fail closed.
- Визначення auth для node-host враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

### Запуск node host (як сервіс)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Спарювання + ім’я

На хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Якщо node повторює спробу зі зміненими даними auth, знову виконайте `openclaw devices list`
і схваліть поточний `requestId`.

Варіанти іменування:

- `--display-name` у `openclaw node run` / `openclaw node install` (зберігається в `~/.openclaw/node.json` на node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (перевизначення на gateway).

### Додайте команди до allowlist

Погодження exec є **для кожного node host окремо**. Додавайте записи allowlist із gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Погодження зберігаються на хості node у `~/.openclaw/exec-approvals.json`.

### Спрямуйте exec на node

Налаштуйте типові значення (конфігурація gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Або для окремої сесії:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Після налаштування будь-який виклик `exec` з `host=node` виконується на хості node (за умови
дотримання allowlist/погоджень node).

`host=auto` сам по собі не вибере node неявно, але явний запит `host=node` для окремого виклику дозволений із `auto`. Якщо ви хочете, щоб exec на node був типовим для сесії, явно встановіть `tools.exec.host=node` або `/exec host=node ...`.

Пов’язане:

- [Node host CLI](/uk/cli/node)
- [Exec tool](/uk/tools/exec)
- [Exec approvals](/uk/tools/exec-approvals)

## Виклик команд

Низькорівнево (сирий RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Для поширених сценаріїв «дати агенту вкладення MEDIA» існують високорівневі допоміжні команди.

## Знімки екрана (знімки canvas)

Якщо node показує Canvas (WebView), `canvas.snapshot` повертає `{ format, base64 }`.

CLI-допоміжна команда (записує у тимчасовий файл і виводить `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Керування Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Примітки:

- `canvas present` приймає URL або локальні шляхи до файлів (`--target`), а також необов’язкові `--x/--y/--width/--height` для позиціювання.
- `canvas eval` приймає вбудований JS (`--js`) або позиційний аргумент.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Примітки:

- Підтримується лише A2UI v0.8 JSONL (v0.9/createSurface відхиляється).

## Фото + відео (камера node)

Фотографії (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # типово: обидва напрямки (2 рядки MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Відеокліпи (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Примітки:

- Node має бути **на передньому плані** для `canvas.*` і `camera.*` (виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`).
- Тривалість кліпу обмежується (зараз `<= 60s`), щоб уникнути завеликих payload base64.
- Android, коли це можливо, запитує дозволи `CAMERA`/`RECORD_AUDIO`; відхилені дозволи призводять до помилки `*_PERMISSION_REQUIRED`.

## Запис екрана (Node)

Підтримувані Node надають `screen.record` (`mp4`). Приклад:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Примітки:

- Доступність `screen.record` залежить від платформи node.
- Тривалість запису екрана обмежується значенням `<= 60s`.
- `--no-audio` вимикає захоплення мікрофона на підтримуваних платформах.
- Використовуйте `--screen <index>`, щоб вибрати дисплей, якщо екранів кілька.

## Геолокація (Node)

Node надають `location.get`, коли в налаштуваннях увімкнено Location.

CLI-допоміжна команда:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Примітки:

- Геолокацію **вимкнено типово**.
- Режим “Always” потребує системного дозволу; фонове отримання працює у режимі best-effort.
- Відповідь містить lat/lon, точність (у метрах) і часову позначку.

## SMS (Android Node)

Android Node можуть надавати `sms.send`, коли користувач надає дозвіл **SMS**, а пристрій підтримує телефонію.

Низькорівневий виклик:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примітки:

- На Android-пристрої потрібно прийняти запит на дозвіл, перш ніж можливість буде оголошена.
- Пристрої лише з Wi‑Fi без телефонії не оголошують `sms.send`.

## Команди Android device + персональні дані

Android Node можуть оголошувати додаткові сімейства команд, коли відповідні можливості ввімкнено.

Доступні сімейства:

- `device.status`, `device.info`, `device.permissions`, `device.health`
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
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Примітки:

- Команди motion залежать від доступних датчиків.

## Системні команди (node host / mac node)

Node macOS надає `system.run`, `system.notify` і `system.execApprovals.get/set`.
Headless node host надає `system.run`, `system.which` і `system.execApprovals.get/set`.

Приклади:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примітки:

- `system.run` повертає stdout/stderr/код виходу в payload.
- Виконання shell тепер відбувається через інструмент `exec` з `host=node`; `nodes` залишається поверхнею прямого RPC для явних команд node.
- `nodes invoke` не надає `system.run` або `system.run.prepare`; вони залишаються доступними лише через шлях exec.
- Шлях exec готує канонічний `systemRunPlan` перед погодженням. Після надання
  погодження gateway пересилає саме цей збережений план, а не будь-які пізніше відредаговані викликаючою стороною поля command/cwd/session.
- `system.notify` враховує стан дозволу на сповіщення в застосунку macOS.
- Нерозпізнані метадані node `platform` / `deviceFamily` використовують консервативний типовий allowlist, який виключає `system.run` і `system.which`. Якщо вам навмисно потрібні ці команди для невідомої платформи, додайте їх явно через `gateway.nodes.allowCommands`.
- `system.run` підтримує `--cwd`, `--env KEY=VAL`, `--command-timeout` і `--needs-screen-recording`.
- Для shell-wrapper (`bash|sh|zsh ... -c/-lc`) значення `--env`, задані на рівні запиту, зводяться до явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень allow-always у режимі allowlist відомі dispatch-wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають шляхи внутрішнього виконуваного файла, а не шляхи wrapper. Якщо безпечне розгортання wrapper неможливе, запис allowlist автоматично не зберігається.
- На Windows node host у режимі allowlist запуски shell-wrapper через `cmd.exe /c` потребують погодження (сам запис allowlist не авто-дозволяє форму wrapper).
- `system.notify` підтримує `--priority <passive|active|timeSensitive>` і `--delivery <system|overlay|auto>`.
- Node host ігнорують перевизначення `PATH` і прибирають небезпечні ключі запуску/оболонки (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Якщо вам потрібні додаткові записи PATH, налаштуйте середовище сервісу node host (або встановіть інструменти у стандартні розташування) замість передавання `PATH` через `--env`.
- У режимі macOS node `system.run` захищено погодженнями exec у застосунку macOS (Settings → Exec approvals).
  Ask/allowlist/full працюють так само, як і для headless node host; відхилені запити повертають `SYSTEM_RUN_DENIED`.
- На headless node host `system.run` захищено погодженнями exec (`~/.openclaw/exec-approvals.json`).

## Прив’язка exec до node

Коли доступно кілька Node, ви можете прив’язати exec до конкретного node.
Це задає типовий node для `exec host=node` (і може перевизначатися для окремого агента).

Глобальне типове значення:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Перевизначення для окремого агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Скиньте значення, щоб дозволити будь-який node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Карта дозволів

Node можуть включати карту `permissions` у `node.list` / `node.describe`, ключем якої є назва дозволу (наприклад, `screenRecording`, `accessibility`), а значенням — boolean (`true` = надано).

## Headless node host (кросплатформений)

OpenClaw може запускати **headless node host** (без UI), який підключається до Gateway
WebSocket і надає `system.run` / `system.which`. Це корисно на Linux/Windows
або для запуску мінімального node поруч із сервером.

Запуск:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примітки:

- Спарювання все одно потрібне (Gateway покаже запит на спарювання пристрою).
- Node host зберігає свій node id, token, display name та інформацію про підключення до gateway у `~/.openclaw/node.json`.
- Погодження exec застосовуються локально через `~/.openclaw/exec-approvals.json`
  (див. [Exec approvals](/uk/tools/exec-approvals)).
- На macOS headless node host типово виконує `system.run` локально. Установіть
  `OPENCLAW_NODE_EXEC_HOST=app`, щоб маршрутизувати `system.run` через exec host супровідного застосунку; додайте
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, щоб вимагати app host і завершуватися в режимі fail closed, якщо він недоступний.
- Додайте `--tls` / `--tls-fingerprint`, коли Gateway WS використовує TLS.

## Режим mac node

- Застосунок macOS у рядку меню підключається до WS-сервера Gateway як node (тобто `openclaw nodes …` працює з цим Mac).
- У remote mode застосунок відкриває SSH tunnel для порту Gateway і підключається до `localhost`.
