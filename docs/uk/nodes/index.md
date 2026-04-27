---
read_when:
    - Сполучення Node iOS/Android з gateway
    - Використання canvas/camera Node для контексту агента
    - Додавання нових команд Node або допоміжних команд CLI
summary: 'Node: сполучення, можливості, дозволи та допоміжні команди CLI для canvas/camera/screen/device/notifications/system'
title: Node
x-i18n:
    generated_at: "2026-04-27T12:51:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59ab02fe377c5f3dae0e86aa14c6ae9a211259c52061630c4daf29bd3d1cb443
    source_path: nodes/index.md
    workflow: 15
---

**Node** — це допоміжний пристрій (macOS/iOS/Android/headless), який підключається до **WebSocket** Gateway (той самий порт, що й для операторів) з `role: "node"` і надає поверхню команд (наприклад, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Подробиці протоколу: [Протокол Gateway](/uk/gateway/protocol).

Застарілий транспорт: [Bridge protocol](/uk/gateway/bridge-protocol) (TCP JSONL;
лише історично для поточних Node).

macOS також може працювати в **режимі Node**: застосунок у рядку меню підключається до
WS-сервера Gateway і надає свої локальні команди canvas/camera як Node (тому
`openclaw nodes …` працює з цим Mac). У режимі віддаленого gateway автоматизацією
браузера керує хост Node CLI (`openclaw node run` або встановлений сервіс Node), а не вбудований Node застосунку.

Примітки:

- Node — це **периферійні пристрої**, а не gateway. Вони не запускають сервіс gateway.
- Повідомлення Telegram/WhatsApp тощо потрапляють у **gateway**, а не на Node.
- Інструкція з усунення несправностей: [/nodes/troubleshooting](/uk/nodes/troubleshooting)

## Сполучення + стан

**WS Node використовують сполучення пристроїв.** Node надсилають ідентичність пристрою під час `connect`; Gateway
створює запит на сполучення пристрою для `role: node`. Схваліть через CLI пристроїв (або UI).

Швидкий CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Якщо Node повторює спробу зі зміненими деталями автентифікації (role/scopes/public key), попередній
запит, що очікує, замінюється, і створюється новий `requestId`. Перед схваленням
повторно виконайте `openclaw devices list`.

Примітки:

- `nodes status` позначає Node як **paired**, коли роль сполучення його пристрою містить `node`.
- Запис сполучення пристрою — це довготривалий контракт схваленої ролі. Ротація
  токенів відбувається всередині цього контракту; вона не може підвищити роль paired Node до
  іншої ролі, яку схвалення сполучення ніколи не надавало.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) — це окреме сховище сполучення Node, що належить gateway;
  воно **не** контролює рукостискання WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` видаляє застарілі записи з цього
  окремого сховища сполучення Node, що належить gateway.
- Обсяг схвалення відповідає заявленим командам запиту, що очікує:
  - запит без команд: `operator.pairing`
  - команди Node без exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Хост віддаленого Node (system.run)

Використовуйте **хост Node**, коли ваш Gateway працює на одній машині, а ви хочете, щоб команди
виконувалися на іншій. Модель, як і раніше, спілкується з **gateway**; gateway
пересилає виклики `exec` на **хост Node**, коли вибрано `host=node`.

### Що де виконується

- **Хост Gateway**: отримує повідомлення, запускає модель, маршрутизує виклики інструментів.
- **Хост Node**: виконує `system.run`/`system.which` на машині Node.
- **Схвалення**: застосовуються на хості Node через `~/.openclaw/exec-approvals.json`.

Примітка щодо схвалення:

- Виконання Node на основі схвалення прив’язує точний контекст запиту.
- Для прямих виконань shell/runtime-файлів OpenClaw також best-effort прив’язує один конкретний локальний
  операнд файлу й забороняє запуск, якщо цей файл змінюється перед виконанням.
- Якщо OpenClaw не може точно визначити один конкретний локальний файл для команди інтерпретатора/runtime,
  виконання на основі схвалення забороняється замість удаваного повного покриття runtime. Використовуйте sandboxing,
  окремі хости або явний довірений allowlist/full workflow для ширшої семантики інтерпретатора.

### Запуск хоста Node (передній план)

На машині Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Віддалений gateway через SSH-тунель (прив’язка loopback)

Якщо Gateway прив’язано до loopback (`gateway.bind=loopback`, типово в локальному режимі),
віддалені хости Node не можуть підключитися напряму. Створіть SSH-тунель і вкажіть
хосту Node локальний кінець цього тунелю.

Приклад (хост Node -> хост gateway):

```bash
# Термінал A (залиште запущеним): переспрямувати локальний 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Термінал B: експортувати токен gateway і підключитися через тунель
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Примітки:

- `openclaw node run` підтримує автентифікацію токеном або паролем.
- Перевага надається змінним середовища: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Резервний варіант конфігурації: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост Node навмисно ігнорує `gateway.remote.token` / `gateway.remote.password`.
- У віддаленому режимі `gateway.remote.token` / `gateway.remote.password` можуть використовуватися згідно з правилами пріоритету віддаленого режиму.
- Якщо активні локальні SecretRef `gateway.auth.*` налаштовані, але не розв’язані, автентифікація хоста Node завершується із забороною.
- Розв’язання автентифікації хоста Node враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

### Запуск хоста Node (сервіс)

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

Якщо Node повторює спробу зі зміненими деталями автентифікації, повторно виконайте `openclaw devices list`
і схваліть поточний `requestId`.

Параметри іменування:

- `--display-name` у `openclaw node run` / `openclaw node install` (зберігається в `~/.openclaw/node.json` на Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (перевизначення gateway).

### Додайте команди до allowlist

Схвалення exec є **окремими для кожного хоста Node**. Додавайте записи allowlist із gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Схвалення зберігаються на хості Node в `~/.openclaw/exec-approvals.json`.

### Спрямуйте exec на Node

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

Після налаштування будь-який виклик `exec` з `host=node` виконується на хості Node (з урахуванням
allowlist/схвалень Node).

`host=auto` не вибере Node неявно сам по собі, але явний запит `host=node` для окремого виклику дозволено з `auto`. Якщо ви хочете, щоб exec на Node був типовим для сесії, явно встановіть `tools.exec.host=node` або `/exec host=node ...`.

Пов’язане:

- [CLI хоста Node](/uk/cli/node)
- [Інструмент Exec](/uk/tools/exec)
- [Схвалення Exec](/uk/tools/exec-approvals)

## Виклик команд

Низькорівневий варіант (сирий RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Для типових сценаріїв «дати агенту вкладення MEDIA» існують
високорівневі допоміжні команди.

## Знімки екрана (знімки canvas)

Якщо Node показує Canvas (WebView), `canvas.snapshot` повертає `{ format, base64 }`.

Допоміжна команда CLI (записує у тимчасовий файл і виводить `MEDIA:<path>`):

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

## Фото + відео (камера Node)

Фото (`jpg`):

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

- Node має бути **на передньому плані** для `canvas.*` і `camera.*` (фонові виклики повертають `NODE_BACKGROUND_UNAVAILABLE`).
- Тривалість кліпу обмежується (зараз `<= 60s`), щоб уникнути завеликих payload base64.
- Android по можливості запитує дозволи `CAMERA`/`RECORD_AUDIO`; у разі відхилення повертається помилка `*_PERMISSION_REQUIRED`.

## Запис екрана (Node)

Підтримувані Node надають `screen.record` (`mp4`). Приклад:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Примітки:

- Доступність `screen.record` залежить від платформи Node.
- Тривалість запису екрана обмежується до `<= 60s`.
- `--no-audio` вимикає захоплення мікрофона на підтримуваних платформах.
- Використовуйте `--screen <index>`, щоб вибрати дисплей, якщо доступно кілька екранів.

## Геолокація (Node)

Node надають `location.get`, коли геолокацію ввімкнено в налаштуваннях.

Допоміжна команда CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Примітки:

- Геолокацію **вимкнено типово**.
- Режим “Always” потребує системного дозволу; фонове отримання є best-effort.
- Відповідь містить lat/lon, точність (у метрах) і часову позначку.

## SMS (Android Node)

Android Node можуть надавати `sms.send`, коли користувач надає дозвіл **SMS**, а пристрій підтримує телефонію.

Низькорівневий виклик:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примітки:

- Потрібно прийняти запит дозволу на Android-пристрої, перш ніж буде оголошено цю можливість.
- Пристрої лише з Wi‑Fi без телефонії не оголошують `sms.send`.

## Команди пристрою Android + персональних даних

Android Node можуть оголошувати додаткові сімейства команд, коли ввімкнено відповідні можливості.

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

- Команди руху контролюються можливостями доступних сенсорів.

## Системні команди (хост Node / mac Node)

Node macOS надає `system.run`, `system.notify` і `system.execApprovals.get/set`.
Headless-хост Node надає `system.run`, `system.which` і `system.execApprovals.get/set`.

Приклади:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примітки:

- `system.run` повертає stdout/stderr/код виходу в payload.
- Виконання shell тепер відбувається через інструмент `exec` з `host=node`; `nodes` залишається поверхнею прямого RPC для явних команд Node.
- `nodes invoke` не надає `system.run` або `system.run.prepare`; вони залишаються доступними лише через шлях exec.
- Шлях exec готує канонічний `systemRunPlan` перед схваленням. Після того як
  схвалення надано, gateway пересилає цей збережений план, а не будь-які пізніше
  змінені викликачем поля command/cwd/session.
- `system.notify` враховує стан дозволу на сповіщення в застосунку macOS.
- Нерозпізнані метадані Node `platform` / `deviceFamily` використовують консервативний типовий allowlist, який виключає `system.run` і `system.which`. Якщо вам навмисно потрібні ці команди для невідомої платформи, додайте їх явно через `gateway.nodes.allowCommands`.
- `system.run` підтримує `--cwd`, `--env KEY=VAL`, `--command-timeout` і `--needs-screen-recording`.
- Для shell-обгорток (`bash|sh|zsh ... -c/-lc`) значення `--env`, обмежені запитом, зводяться до явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень allow-always у режимі allowlist відомі обгортки диспетчеризації (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають внутрішні шляхи виконуваних файлів замість шляхів обгорток. Якщо безпечне розгортання неможливе, запис allowlist автоматично не зберігається.
- На хостах Node Windows у режимі allowlist запуски shell-обгорток через `cmd.exe /c` потребують схвалення (сам запис allowlist не надає автоматичного дозволу для форми з обгорткою).
- `system.notify` підтримує `--priority <passive|active|timeSensitive>` і `--delivery <system|overlay|auto>`.
- Хости Node ігнорують перевизначення `PATH` і видаляють небезпечні ключі startup/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Якщо вам потрібні додаткові записи PATH, налаштуйте середовище сервісу хоста Node (або встановіть інструменти у стандартні розташування) замість передавання `PATH` через `--env`.
- У режимі macOS Node `system.run` контролюється через схвалення exec у застосунку macOS (Settings → Exec approvals).
  Ask/allowlist/full поводяться так само, як і headless-хост Node; відхилені запити повертають `SYSTEM_RUN_DENIED`.
- На headless-хості Node `system.run` контролюється через схвалення exec (`~/.openclaw/exec-approvals.json`).

## Прив’язка exec до Node

Коли доступно кілька Node, ви можете прив’язати exec до конкретного Node.
Це встановлює типовий Node для `exec host=node` (і може бути перевизначено для окремого агента).

Глобальне типове значення:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Перевизначення для окремого агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Скасуйте, щоб дозволити будь-який Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Мапа дозволів

Node можуть включати мапу `permissions` у `node.list` / `node.describe`, з ключами за назвою дозволу (наприклад, `screenRecording`, `accessibility`) і булевими значеннями (`true` = надано).

## Headless-хост Node (кросплатформений)

OpenClaw може запускати **headless-хост Node** (без UI), який підключається до WebSocket Gateway
і надає `system.run` / `system.which`. Це корисно на Linux/Windows
або для запуску мінімального Node поруч із сервером.

Запуск:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примітки:

- Сполучення все одно потрібне (Gateway покаже запит на сполучення пристрою).
- Хост Node зберігає свій id Node, токен, display name і дані підключення до gateway у `~/.openclaw/node.json`.
- Схвалення exec застосовуються локально через `~/.openclaw/exec-approvals.json`
  (див. [Схвалення Exec](/uk/tools/exec-approvals)).
- На macOS headless-хост Node типово виконує `system.run` локально. Установіть
  `OPENCLAW_NODE_EXEC_HOST=app`, щоб маршрутизувати `system.run` через exec-хост допоміжного застосунку; додайте
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, щоб вимагати хост застосунку і завершувати роботу із забороною, якщо він недоступний.
- Додайте `--tls` / `--tls-fingerprint`, коли WebSocket Gateway використовує TLS.

## Режим macOS Node

- Застосунок macOS у рядку меню підключається до WS-сервера Gateway як Node (тому `openclaw nodes …` працює з цим Mac).
- У віддаленому режимі застосунок відкриває SSH-тунель для порту Gateway і підключається до `localhost`.
