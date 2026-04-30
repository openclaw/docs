---
read_when:
    - Сполучення вузлів iOS/Android із Gateway
    - Використання полотна/камери вузла для контексту агента
    - Додавання нових команд Node або допоміжних засобів CLI
summary: 'Nodes: створення пари, можливості, дозволи та CLI-помічники для canvas/camera/screen/device/notifications/system'
title: Вузли
x-i18n:
    generated_at: "2026-04-30T04:07:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

**Node** — це супровідний пристрій (macOS/iOS/Android/headless), який підключається до Gateway **WebSocket** (той самий порт, що й оператори) з `role: "node"` і надає набір команд (наприклад, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Деталі протоколу: [протокол Gateway](/uk/gateway/protocol).

Застарілий транспорт: [протокол Bridge](/uk/gateway/bridge-protocol) (TCP JSONL;
лише історично для поточних Node).

macOS також може працювати в **режимі Node**: застосунок у рядку меню підключається до WS-сервера Gateway і надає свої локальні команди canvas/camera як Node (тому `openclaw nodes …` працює з цим Mac). У режимі віддаленого Gateway автоматизацію браузера обробляє CLI-хост Node (`openclaw node run` або встановлена служба Node), а не нативний Node застосунку.

Примітки:

- Node — це **периферійні пристрої**, а не Gateway. Вони не запускають службу Gateway.
- Повідомлення Telegram/WhatsApp/тощо потрапляють на **Gateway**, а не на Node.
- Runbook для усунення несправностей: [/nodes/troubleshooting](/uk/nodes/troubleshooting)

## Сполучення + статус

**WS Node використовують сполучення пристроїв.** Node передають ідентичність пристрою під час `connect`; Gateway створює запит на сполучення пристрою для `role: node`. Схваліть через CLI пристроїв (або UI).

Швидкий CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Якщо Node повторює спробу зі зміненими даними автентифікації (роль/області доступу/публічний ключ), попередній запит, що очікував на розгляд, замінюється, і створюється новий `requestId`. Перед схваленням повторно виконайте `openclaw devices list`.

Примітки:

- `nodes status` позначає Node як **сполучений**, коли його роль сполучення пристрою включає `node`.
- Запис сполучення пристрою є довговічним контрактом схваленої ролі. Ротація токенів лишається всередині цього контракту; вона не може підвищити сполучений Node до іншої ролі, яку схвалення сполучення ніколи не надавало.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) — це окреме сховище сполучень Node, яким володіє Gateway; воно **не** блокує handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` видаляє застарілі записи з цього окремого сховища сполучень Node, яким володіє Gateway.
- Область схвалення відповідає заявленим командам запиту, що очікує:
  - запит без команд: `operator.pairing`
  - команди Node без exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Віддалений хост Node (system.run)

Використовуйте **хост Node**, коли ваш Gateway працює на одній машині, а ви хочете виконувати команди на іншій. Модель усе ще спілкується з **Gateway**; Gateway переспрямовує виклики `exec` до **хоста Node**, коли вибрано `host=node`.

### Що де виконується

- **Хост Gateway**: отримує повідомлення, запускає модель, маршрутизує виклики інструментів.
- **Хост Node**: виконує `system.run`/`system.which` на машині Node.
- **Схвалення**: застосовуються на хості Node через `~/.openclaw/exec-approvals.json`.

Примітка щодо схвалень:

- Запуски Node на основі схвалень прив’язують точний контекст запиту.
- Для прямих виконань файлів shell/runtime OpenClaw також, наскільки можливо, прив’язує один конкретний локальний файловий операнд і відхиляє запуск, якщо цей файл змінюється до виконання.
- Якщо OpenClaw не може визначити рівно один конкретний локальний файл для команди інтерпретатора/runtime, виконання на основі схвалення відхиляється замість удаваного повного покриття runtime. Для ширшої семантики інтерпретатора використовуйте ізоляцію, окремі хости або явний довірений allowlist/повний workflow.

### Запуск хоста Node (передній план)

На машині Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Віддалений Gateway через SSH-тунель (loopback bind)

Якщо Gateway прив’язується до loopback (`gateway.bind=loopback`, стандартно в локальному режимі), віддалені хости Node не можуть підключитися напряму. Створіть SSH-тунель і вкажіть хосту Node локальний кінець тунелю.

Приклад (хост Node -> хост Gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Примітки:

- `openclaw node run` підтримує автентифікацію токеном або паролем.
- Змінні середовища є бажаними: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Резервна конфігурація: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост Node навмисно ігнорує `gateway.remote.token` / `gateway.remote.password`.
- У віддаленому режимі `gateway.remote.token` / `gateway.remote.password` можуть використовуватися згідно з правилами пріоритету віддаленої конфігурації.
- Якщо налаштовані активні локальні SecretRefs `gateway.auth.*`, але їх не розв’язано, автентифікація хоста Node завершується закритою відмовою.
- Розв’язання автентифікації хоста Node враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

### Запуск хоста Node (служба)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Сполучення + ім’я

На хості Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Якщо Node повторює спробу зі зміненими даними автентифікації, повторно виконайте `openclaw devices list` і схваліть поточний `requestId`.

Параметри іменування:

- `--display-name` у `openclaw node run` / `openclaw node install` (зберігається в `~/.openclaw/node.json` на Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (перевизначення на Gateway).

### Додайте команди до allowlist

Схвалення exec є **окремими для кожного хоста Node**. Додайте записи allowlist з Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Схвалення зберігаються на хості Node у `~/.openclaw/exec-approvals.json`.

### Спрямуйте exec на Node

Налаштуйте стандартні значення (конфігурація Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Або для окремого сеансу:

```
/exec host=node security=allowlist node=<id-or-name>
```

Після налаштування будь-який виклик `exec` з `host=node` виконується на хості Node (з урахуванням allowlist/схвалень Node).

`host=auto` не вибиратиме Node неявно самостійно, але явний запит `host=node` для окремого виклику дозволений з `auto`. Якщо ви хочете, щоб exec на Node був стандартним для сеансу, явно задайте `tools.exec.host=node` або `/exec host=node ...`.

Пов’язане:

- [CLI хоста Node](/uk/cli/node)
- [Інструмент exec](/uk/tools/exec)
- [Схвалення exec](/uk/tools/exec-approvals)

## Виклик команд

Низький рівень (сирий RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Для типових workflows “надати агенту вкладення MEDIA” існують допоміжні засоби вищого рівня.

## Політика команд

Перед викликом команди Node мають пройти два шлюзи:

1. Node має оголосити команду у своєму списку WebSocket `connect.commands`.
2. Політика платформи Gateway має дозволяти оголошену команду.

Супровідні Node для Windows і macOS стандартно дозволяють безпечні оголошені команди, як-от `canvas.*`, `camera.list`, `location.get` і `screen.snapshot`. Небезпечні або чутливі до приватності команди, як-от `camera.snap`, `camera.clip` і `screen.record`, усе одно потребують явного opt-in через `gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` завжди має пріоритет над стандартними значеннями та додатковими записами allowlist.

Команди Node, якими володіє Plugin, можуть додавати політику Gateway для node-invoke. Ця політика виконується після перевірки allowlist і перед переспрямуванням до Node, тож сирий `node.invoke`, допоміжні засоби CLI та спеціалізовані інструменти агента мають спільну межу дозволів Plugin. Небезпечні команди Node від Plugin усе одно потребують явного opt-in `gateway.nodes.allowCommands`.

Після того як Node змінить свій оголошений список команд, відхиліть старе сполучення пристрою і схваліть новий запит, щоб Gateway зберіг оновлений знімок команд.

## Знімки екрана (знімки canvas)

Якщо Node показує Canvas (WebView), `canvas.snapshot` повертає `{ format, base64 }`.

Допоміжний засіб CLI (записує у тимчасовий файл і друкує `MEDIA:<path>`):

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
- `canvas eval` приймає inline JS (`--js`) або позиційний аргумент.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Примітки:

- Підтримується лише A2UI v0.8 JSONL (v0.9/createSurface відхиляється).

## Фото + відео (камера Node)

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

- Node має бути **на передньому плані** для `canvas.*` і `camera.*` (фонові виклики повертають `NODE_BACKGROUND_UNAVAILABLE`).
- Тривалість кліпу обмежується (наразі `<= 60s`), щоб уникнути завеликих payload base64.
- Android за можливості запитає дозволи `CAMERA`/`RECORD_AUDIO`; відхилені дозволи завершуються помилкою `*_PERMISSION_REQUIRED`.

## Записи екрана (Node)

Підтримувані Node надають `screen.record` (mp4). Приклад:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Примітки:

- Доступність `screen.record` залежить від платформи Node.
- Записи екрана обмежуються до `<= 60s`.
- `--no-audio` вимикає захоплення мікрофона на підтримуваних платформах.
- Використовуйте `--screen <index>`, щоб вибрати дисплей, коли доступно кілька екранів.

## Геолокація (Node)

Node надають `location.get`, коли в налаштуваннях увімкнено Location.

Допоміжний засіб CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Примітки:

- Location **вимкнено стандартно**.
- “Always” потребує системного дозволу; фонове отримання виконується за принципом best-effort.
- Відповідь містить lat/lon, точність (метри) і timestamp.

## SMS (Android Node)

Android Node можуть надавати `sms.send`, коли користувач надає дозвіл **SMS**, а пристрій підтримує телефонію.

Низькорівневий виклик:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примітки:

- Запит дозволу потрібно прийняти на пристрої Android до того, як capability буде оголошено.
- Пристрої лише з Wi-Fi без телефонії не оголошуватимуть `sms.send`.

## Команди пристрою Android + персональних даних

Android Node можуть оголошувати додаткові сімейства команд, коли відповідні capability увімкнені.

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

- Команди руху обмежуються можливостями наявних сенсорів.

## Системні команди (хост вузла / вузол Mac)

Вузол macOS надає `system.run`, `system.notify` і `system.execApprovals.get/set`.
Headless-хост вузла надає `system.run`, `system.which` і `system.execApprovals.get/set`.

Приклади:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примітки:

- `system.run` повертає stdout/stderr/код завершення в payload.
- Виконання shell тепер проходить через інструмент `exec` з `host=node`; `nodes` залишається прямою RPC-поверхнею для явних команд вузла.
- `nodes invoke` не відкриває доступ до `system.run` або `system.run.prepare`; вони залишаються лише на шляху exec.
- Шлях exec готує канонічний `systemRunPlan` перед схваленням. Щойно
  схвалення надано, gateway пересилає цей збережений план, а не будь-які пізніше
  змінені викликачем поля command/cwd/session.
- `system.notify` враховує стан дозволу на сповіщення в застосунку macOS.
- Нерозпізнані метадані вузла `platform` / `deviceFamily` використовують консервативний типовий allowlist, який виключає `system.run` і `system.which`. Якщо вам навмисно потрібні ці команди для невідомої платформи, додайте їх явно через `gateway.nodes.allowCommands`.
- `system.run` підтримує `--cwd`, `--env KEY=VAL`, `--command-timeout` і `--needs-screen-recording`.
- Для shell-обгорток (`bash|sh|zsh ... -c/-lc`) значення `--env`, обмежені запитом, зводяться до явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень «завжди дозволяти» в режимі allowlist відомі диспетчерські обгортки (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають шляхи внутрішніх виконуваних файлів замість шляхів обгорток. Якщо розгортання не є безпечним, запис allowlist автоматично не зберігається.
- На хостах вузлів Windows у режимі allowlist запуск shell-обгортки через `cmd.exe /c` потребує схвалення (самого запису allowlist недостатньо для автоматичного дозволу форми з обгорткою).
- `system.notify` підтримує `--priority <passive|active|timeSensitive>` і `--delivery <system|overlay|auto>`.
- Хости вузлів ігнорують перевизначення `PATH` і вилучають небезпечні ключі запуску/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Якщо вам потрібні додаткові записи PATH, налаштуйте середовище сервісу хоста вузла (або встановіть інструменти у стандартні місця) замість передавання `PATH` через `--env`.
- У режимі вузла macOS `system.run` обмежується схваленнями exec у застосунку macOS (Settings → Exec approvals).
  Ask/allowlist/full поводяться так само, як headless-хост вузла; відхилені запити повертають `SYSTEM_RUN_DENIED`.
- На headless-хості вузла `system.run` обмежується схваленнями exec (`~/.openclaw/exec-approvals.json`).

## Прив’язка вузла exec

Коли доступно кілька вузлів, ви можете прив’язати exec до конкретного вузла.
Це встановлює типовий вузол для `exec host=node` (і може бути перевизначено для окремого агента).

Глобальне значення за замовчуванням:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Перевизначення для окремого агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Скиньте, щоб дозволити будь-який вузол:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Мапа дозволів

Вузли можуть містити мапу `permissions` у `node.list` / `node.describe`, індексовану за назвою дозволу (наприклад, `screenRecording`, `accessibility`) з булевими значеннями (`true` = надано).

## Headless-хост вузла (кросплатформний)

OpenClaw може запускати **headless-хост вузла** (без UI), який підключається до WebSocket Gateway
і надає `system.run` / `system.which`. Це корисно в Linux/Windows
або для запуску мінімального вузла поруч із сервером.

Запустіть його:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примітки:

- Сполучення все ще потрібне (Gateway покаже запит на сполучення пристрою).
- Хост вузла зберігає свій id вузла, token, відображуване ім’я та інформацію про підключення до gateway в `~/.openclaw/node.json`.
- Схвалення exec застосовуються локально через `~/.openclaw/exec-approvals.json`
  (див. [Схвалення exec](/uk/tools/exec-approvals)).
- На macOS headless-хост вузла типово виконує `system.run` локально. Установіть
  `OPENCLAW_NODE_EXEC_HOST=app`, щоб спрямувати `system.run` через exec-хост супровідного застосунку; додайте
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, щоб вимагати хост застосунку й безпечно завершуватися з помилкою, якщо він недоступний.
- Додайте `--tls` / `--tls-fingerprint`, коли Gateway WS використовує TLS.

## Режим вузла Mac

- Застосунок macOS у рядку меню підключається до сервера Gateway WS як вузол (тож `openclaw nodes …` працює з цим Mac).
- У віддаленому режимі застосунок відкриває SSH-тунель для порту Gateway і підключається до `localhost`.
