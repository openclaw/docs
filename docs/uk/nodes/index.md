---
read_when:
    - Підключення вузлів iOS/Android до Gateway
    - Використання полотна/камери вузла для контексту агента
    - Додавання нових команд Node або допоміжних засобів CLI
summary: 'Вузли: сполучення, можливості, дозволи та CLI-помічники для полотна/камери/екрана/пристрою/сповіщень/системи'
title: Вузли
x-i18n:
    generated_at: "2026-04-28T11:18:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe9fdeb21173a32f284810d0bd1e9219932ce7c74fdcbc8b5b197f2647659e8
    source_path: nodes/index.md
    workflow: 16
---

**node** — це супровідний пристрій (macOS/iOS/Android/headless), який підключається до **WebSocket** Gateway (той самий порт, що й для операторів) з `role: "node"` і надає поверхню команд (наприклад, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Деталі протоколу: [протокол Gateway](/uk/gateway/protocol).

Застарілий транспорт: [протокол Bridge](/uk/gateway/bridge-protocol) (TCP JSONL;
лише історичний для поточних вузлів).

macOS також може працювати в **режимі node**: застосунок у рядку меню підключається до WS-сервера Gateway і надає свої локальні команди canvas/camera як node (щоб
`openclaw nodes …` працювало з цим Mac). У режимі віддаленого gateway автоматизацією браузера керує хост CLI node (`openclaw node run` або встановлена служба node), а не node нативного застосунку.

Примітки:

- Nodes — це **периферійні пристрої**, а не gateway. Вони не запускають службу gateway.
- Повідомлення Telegram/WhatsApp тощо надходять на **gateway**, а не на nodes.
- Інструкція з усунення несправностей: [/nodes/troubleshooting](/uk/nodes/troubleshooting)

## Сполучення + стан

**WS nodes використовують сполучення пристроїв.** Nodes передають ідентичність пристрою під час `connect`; Gateway
створює запит на сполучення пристрою для `role: node`. Підтвердьте через CLI пристроїв (або UI).

Швидкий CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Якщо node повторює спробу зі зміненими даними автентифікації (role/scopes/public key), попередній
очікуваний запит замінюється, і створюється новий `requestId`. Повторно виконайте
`openclaw devices list` перед підтвердженням.

Примітки:

- `nodes status` позначає node як **сполучений**, коли його роль сполучення пристрою містить `node`.
- Запис сполучення пристрою є сталим контрактом затвердженої ролі. Ротація токенів
  залишається всередині цього контракту; вона не може підвищити сполучений node до
  іншої ролі, якої схвалення сполучення ніколи не надавало.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) — це окреме сховище
  сполучень node, яким володіє gateway; воно **не** контролює handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` видаляє застарілі записи з цього
  окремого сховища сполучень node, яким володіє gateway.
- Область схвалення відповідає заявленим командам очікуваного запиту:
  - запит без команд: `operator.pairing`
  - команди node без exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Віддалений хост node (system.run)

Використовуйте **хост node**, коли ваш Gateway працює на одній машині, а команди мають
виконуватися на іншій. Модель і далі спілкується з **gateway**; gateway
пересилає виклики `exec` до **хоста node**, коли вибрано `host=node`.

### Що де виконується

- **Хост Gateway**: отримує повідомлення, запускає модель, маршрутизує виклики інструментів.
- **Хост node**: виконує `system.run`/`system.which` на машині node.
- **Схвалення**: застосовуються на хості node через `~/.openclaw/exec-approvals.json`.

Примітка щодо схвалень:

- Запуски node на основі схвалення прив'язуються до точного контексту запиту.
- Для прямих виконань файлів shell/runtime OpenClaw також найкращим можливим способом прив'язує один конкретний локальний
  файловий операнд і відхиляє запуск, якщо цей файл змінюється до виконання.
- Якщо OpenClaw не може ідентифікувати рівно один конкретний локальний файл для команди interpreter/runtime,
  виконання на основі схвалення відхиляється замість імітації повного покриття runtime. Використовуйте sandboxing,
  окремі хости або явний довірений allowlist/повний workflow для ширшої семантики interpreter.

### Запуск хоста node (foreground)

На машині node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Віддалений gateway через SSH-тунель (прив'язка loopback)

Якщо Gateway прив'язується до loopback (`gateway.bind=loopback`, типово в локальному режимі),
віддалені хости node не можуть підключитися напряму. Створіть SSH-тунель і спрямуйте
хост node на локальний кінець тунелю.

Приклад (хост node -> хост gateway):

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
- Запасний варіант конфігурації: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост node навмисно ігнорує `gateway.remote.token` / `gateway.remote.password`.
- У віддаленому режимі `gateway.remote.token` / `gateway.remote.password` допускаються згідно з правилами пріоритету віддаленого режиму.
- Якщо налаштовано активні локальні SecretRefs `gateway.auth.*`, але їх не розв'язано, автентифікація хоста node завершується закритою відмовою.
- Розв'язання автентифікації хоста node враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

### Запуск хоста node (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Сполучення + назва

На хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Якщо node повторює спробу зі зміненими даними автентифікації, повторно виконайте `openclaw devices list`
і схваліть поточний `requestId`.

Параметри іменування:

- `--display-name` у `openclaw node run` / `openclaw node install` (зберігається в `~/.openclaw/node.json` на node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (перевизначення gateway).

### Додавання команд до allowlist

Схвалення exec є **окремими для кожного хоста node**. Додайте записи allowlist із gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Схвалення зберігаються на хості node у `~/.openclaw/exec-approvals.json`.

### Спрямування exec на node

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

Після налаштування будь-який виклик `exec` з `host=node` виконується на хості node (з урахуванням
allowlist/схвалень node).

`host=auto` не вибере node неявно самостійно, але явний запит `host=node` для окремого виклику дозволений з `auto`. Якщо ви хочете, щоб exec на node був типовим для сеансу, явно задайте `tools.exec.host=node` або `/exec host=node ...`.

Пов'язане:

- [CLI хоста node](/uk/cli/node)
- [Інструмент exec](/uk/tools/exec)
- [Схвалення exec](/uk/tools/exec-approvals)

## Виклик команд

Низькорівнево (сирий RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Для поширених workflow «дати агенту вкладення MEDIA» існують високорівневі помічники.

## Політика команд

Команди node мають пройти дві перевірки, перш ніж їх можна буде викликати:

1. Node має заявити команду у своєму списку WebSocket `connect.commands`.
2. Політика платформи gateway має дозволити заявлену команду.

Супровідні nodes Windows і macOS типово дозволяють безпечні заявлені команди, як-от
`canvas.*`, `camera.list`, `location.get` і `screen.snapshot`.
Небезпечні або чутливі до приватності команди, як-от `camera.snap`, `camera.clip` і
`screen.record`, все одно потребують явного opt-in через
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` завжди має пріоритет над
типовими значеннями та додатковими записами allowlist.

Після зміни node свого заявленого списку команд відхиліть старе сполучення пристрою
та схваліть новий запит, щоб gateway зберіг оновлений знімок команд.

## Скриншоти (знімки canvas)

Якщо node показує Canvas (WebView), `canvas.snapshot` повертає `{ format, base64 }`.

CLI-помічник (записує у тимчасовий файл і друкує `MEDIA:<path>`):

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

- `canvas present` приймає URL-адреси або локальні шляхи до файлів (`--target`), а також необов'язкові `--x/--y/--width/--height` для позиціонування.
- `canvas eval` приймає inline JS (`--js`) або позиційний аргумент.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Примітки:

- Підтримується лише A2UI v0.8 JSONL (v0.9/createSurface відхиляється).

## Фото + відео (камера node)

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
- Тривалість кліпу обмежується (наразі `<= 60s`), щоб уникнути завеликих base64 payloads.
- Android запитуватиме дозволи `CAMERA`/`RECORD_AUDIO`, коли це можливо; відхилені дозволи завершуються помилкою `*_PERMISSION_REQUIRED`.

## Записи екрана (nodes)

Підтримувані nodes надають `screen.record` (mp4). Приклад:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Примітки:

- Доступність `screen.record` залежить від платформи node.
- Записи екрана обмежуються до `<= 60s`.
- `--no-audio` вимикає захоплення мікрофона на підтримуваних платформах.
- Використовуйте `--screen <index>`, щоб вибрати дисплей, коли доступно кілька екранів.

## Геолокація (nodes)

Nodes надають `location.get`, коли Location увімкнено в налаштуваннях.

CLI-помічник:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Примітки:

- Location **вимкнено за замовчуванням**.
- “Always” вимагає системного дозволу; фонове отримання виконується найкращим можливим способом.
- Відповідь містить lat/lon, точність (у метрах) і timestamp.

## SMS (Android nodes)

Android nodes можуть надавати `sms.send`, коли користувач надає дозвіл **SMS**, а пристрій підтримує телефонію.

Низькорівневий виклик:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примітки:

- Запит дозволу має бути прийнятий на пристрої Android до того, як capability буде оголошено.
- Пристрої лише з Wi-Fi без телефонії не оголошуватимуть `sms.send`.

## Команди пристрою Android + персональних даних

Android nodes можуть оголошувати додаткові сімейства команд, коли відповідні capabilities увімкнено.

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

- Команди motion обмежуються capability за доступними датчиками.

## Системні команди (хост Node / Node на Mac)

Node на macOS надає `system.run`, `system.notify` та `system.execApprovals.get/set`.
Безінтерфейсний хост Node надає `system.run`, `system.which` та `system.execApprovals.get/set`.

Приклади:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примітки:

- `system.run` повертає stdout/stderr/код виходу в payload.
- Виконання shell тепер проходить через інструмент `exec` з `host=node`; `nodes` залишається поверхнею direct-RPC для явних команд Node.
- `nodes invoke` не надає `system.run` або `system.run.prepare`; вони залишаються лише на шляху exec.
- Шлях exec готує канонічний `systemRunPlan` перед схваленням. Після надання схвалення Gateway пересилає цей збережений план, а не будь-які пізніше змінені викликачем поля command/cwd/session.
- `system.notify` враховує стан дозволу на сповіщення в застосунку macOS.
- Нерозпізнані метадані Node `platform` / `deviceFamily` використовують консервативний стандартний allowlist, який виключає `system.run` і `system.which`. Якщо вам навмисно потрібні ці команди для невідомої платформи, додайте їх явно через `gateway.nodes.allowCommands`.
- `system.run` підтримує `--cwd`, `--env KEY=VAL`, `--command-timeout` і `--needs-screen-recording`.
- Для shell-обгорток (`bash|sh|zsh ... -c/-lc`) значення `--env` у межах запиту скорочуються до явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень «завжди дозволяти» в режимі allowlist відомі диспетчерські обгортки (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають шляхи до внутрішніх виконуваних файлів замість шляхів до обгорток. Якщо розгортання не є безпечним, запис allowlist автоматично не зберігається.
- На хостах Node Windows у режимі allowlist запуски shell-обгорток через `cmd.exe /c` потребують схвалення (самого запису allowlist недостатньо, щоб автоматично дозволити форму обгортки).
- `system.notify` підтримує `--priority <passive|active|timeSensitive>` і `--delivery <system|overlay|auto>`.
- Хости Node ігнорують перевизначення `PATH` і вилучають небезпечні ключі запуску/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Якщо вам потрібні додаткові записи PATH, налаштуйте середовище сервісу хоста Node (або встановіть інструменти у стандартних розташуваннях), замість передавання `PATH` через `--env`.
- У режимі Node на macOS `system.run` контролюється схваленнями exec у застосунку macOS (Settings → Exec approvals).
  Ask/allowlist/full працюють так само, як у безінтерфейсному хості Node; відхилені запити повертають `SYSTEM_RUN_DENIED`.
- На безінтерфейсному хості Node `system.run` контролюється схваленнями exec (`~/.openclaw/exec-approvals.json`).

## Прив’язка Node для exec

Коли доступно кілька Node, ви можете прив’язати exec до конкретного Node.
Це задає стандартний Node для `exec host=node` (і може бути перевизначено для окремого агента).

Глобальне стандартне значення:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Перевизначення для окремого агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Скасувати налаштування, щоб дозволити будь-який Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Мапа дозволів

Node можуть включати мапу `permissions` у `node.list` / `node.describe`, ключами якої є назви дозволів (наприклад, `screenRecording`, `accessibility`) з булевими значеннями (`true` = надано).

## Безінтерфейсний хост Node (кросплатформний)

OpenClaw може запускати **безінтерфейсний хост Node** (без UI), який підключається до WebSocket Gateway
і надає `system.run` / `system.which`. Це корисно на Linux/Windows
або для запуску мінімального Node поруч із сервером.

Запустіть його:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примітки:

- Сполучення все ще потрібне (Gateway покаже запит на сполучення пристрою).
- Хост Node зберігає свій ідентифікатор Node, токен, відображуване ім’я та дані підключення до Gateway у `~/.openclaw/node.json`.
- Схвалення exec застосовуються локально через `~/.openclaw/exec-approvals.json`
  (див. [Схвалення exec](/uk/tools/exec-approvals)).
- На macOS безінтерфейсний хост Node за замовчуванням виконує `system.run` локально. Установіть
  `OPENCLAW_NODE_EXEC_HOST=app`, щоб маршрутизувати `system.run` через exec-хост супровідного застосунку; додайте
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, щоб вимагати хост застосунку й завершуватися закритою відмовою, якщо він недоступний.
- Додайте `--tls` / `--tls-fingerprint`, коли Gateway WS використовує TLS.

## Режим Node на Mac

- Застосунок рядка меню macOS підключається до сервера Gateway WS як Node (тож `openclaw nodes …` працює з цим Mac).
- У віддаленому режимі застосунок відкриває SSH-тунель для порту Gateway і підключається до `localhost`.
