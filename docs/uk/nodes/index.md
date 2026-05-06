---
read_when:
    - Сполучення вузлів iOS/Android із Gateway
    - Використання полотна/камери вузла для контексту агента
    - Додавання нових команд Node або допоміжних CLI-інструментів
summary: 'Вузли: сполучення, можливості, дозволи та допоміжні засоби CLI для полотна/камери/екрана/пристрою/сповіщень/системи'
title: Вузли
x-i18n:
    generated_at: "2026-05-06T05:21:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

**Node** — це супровідний пристрій (macOS/iOS/Android/headless), який підключається до **WebSocket** Gateway (той самий порт, що й оператори) з `role: "node"` і надає командну поверхню (наприклад, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Деталі протоколу: [протокол Gateway](/uk/gateway/protocol).

Застарілий транспорт: [протокол Bridge](/uk/gateway/bridge-protocol) (TCP JSONL;
лише історичний для поточних Node).

macOS також може працювати в **режимі Node**: застосунок у рядку меню підключається до
WS-сервера Gateway і надає свої локальні команди canvas/camera як Node (тож
`openclaw nodes …` працює з цим Mac). У режимі віддаленого Gateway автоматизацію
браузера обробляє CLI-хост Node (`openclaw node run` або встановлена служба
Node), а не Node нативного застосунку.

Примітки:

- Node — це **периферійні пристрої**, а не Gateway. Вони не запускають службу Gateway.
- Повідомлення Telegram/WhatsApp/тощо надходять на **Gateway**, а не на Node.
- Runbook для усунення несправностей: [/nodes/troubleshooting](/uk/nodes/troubleshooting)

## Сполучення + статус

**WS Node використовують сполучення пристроїв.** Node передають ідентичність пристрою під час `connect`; Gateway
створює запит на сполучення пристрою для `role: node`. Підтвердьте через CLI пристроїв (або UI).

Швидкий CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Якщо Node повторює спробу зі зміненими даними автентифікації (роль/області дії/публічний ключ), попередній
запит у стані очікування замінюється, і створюється новий `requestId`. Повторно виконайте
`openclaw devices list` перед підтвердженням.

Примітки:

- `nodes status` позначає Node як **сполучений**, коли його роль сполучення пристрою містить `node`.
- Запис сполучення пристрою є довготривалим контрактом схваленої ролі. Ротація токенів
  залишається в межах цього контракту; вона не може підвищити сполучений Node до
  іншої ролі, яку схвалення сполучення ніколи не надавало.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) — це окреме сховище
  сполучень Node, яким володіє Gateway; воно **не** обмежує WS-рукостискання `connect`.
- `openclaw nodes remove --node <id|name|ip>` видаляє застарілі записи з цього
  окремого сховища сполучень Node, яким володіє Gateway.
- Область схвалення відповідає заявленим командам запиту в стані очікування:
  - запит без команд: `operator.pairing`
  - не-exec команди Node: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Віддалений хост Node (system.run)

Використовуйте **хост Node**, коли ваш Gateway працює на одній машині, а команди потрібно
виконувати на іншій. Модель усе ще звертається до **Gateway**; Gateway
пересилає виклики `exec` до **хоста Node**, коли вибрано `host=node`.

### Що де виконується

- **Хост Gateway**: отримує повідомлення, запускає модель, маршрутизує виклики інструментів.
- **Хост Node**: виконує `system.run`/`system.which` на машині Node.
- **Схвалення**: застосовуються на хості Node через `~/.openclaw/exec-approvals.json`.

Примітка щодо схвалення:

- Запуски Node, підкріплені схваленням, прив’язують точний контекст запиту.
- Для прямих виконань shell/runtime-файлів OpenClaw також, наскільки можливо, прив’язує один конкретний локальний
  файловий операнд і відхиляє запуск, якщо цей файл змінюється перед виконанням.
- Якщо OpenClaw не може визначити рівно один конкретний локальний файл для команди інтерпретатора/runtime,
  виконання, підкріплене схваленням, відхиляється замість удавання повного покриття runtime. Використовуйте sandboxing,
  окремі хости або явний довірений allowlist/повний робочий процес для ширшої семантики інтерпретатора.

### Запуск хоста Node (передній план)

На машині Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Віддалений Gateway через SSH-тунель (прив’язка loopback)

Якщо Gateway прив’язується до loopback (`gateway.bind=loopback`, типово в локальному режимі),
віддалені хости Node не можуть підключитися напряму. Створіть SSH-тунель і спрямуйте
хост Node на локальний кінець тунелю.

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
- У віддаленому режимі `gateway.remote.token` / `gateway.remote.password` придатні згідно з правилами пріоритету віддаленої конфігурації.
- Якщо активні локальні SecretRefs `gateway.auth.*` налаштовані, але не розв’язані, автентифікація хоста Node завершується закрито.
- Розв’язання автентифікації хоста Node враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

### Запуск хоста Node (служба)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Сполучення + назва

На хості Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Якщо Node повторює спробу зі зміненими даними автентифікації, повторно виконайте `openclaw devices list`
і схваліть поточний `requestId`.

Параметри іменування:

- `--display-name` у `openclaw node run` / `openclaw node install` (зберігається в `~/.openclaw/node.json` на Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (перевизначення Gateway).

### Додавання команд до allowlist

Схвалення exec є **окремими для кожного хоста Node**. Додайте записи allowlist з Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Схвалення зберігаються на хості Node у `~/.openclaw/exec-approvals.json`.

### Спрямування exec на Node

Налаштуйте типові значення (конфігурація Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Або для окремої сесії:

```
/exec host=node security=allowlist node=<id-or-name>
```

Після налаштування будь-який виклик `exec` з `host=node` виконується на хості Node (з урахуванням
allowlist/схвалень Node).

`host=auto` не вибиратиме Node неявно самостійно, але явний запит `host=node` для окремого виклику дозволений з `auto`. Якщо потрібно, щоб exec на Node був типовим для сесії, явно встановіть `tools.exec.host=node` або `/exec host=node ...`.

Пов’язано:

- [CLI хоста Node](/uk/cli/node)
- [Інструмент exec](/uk/tools/exec)
- [Схвалення exec](/uk/tools/exec-approvals)

## Виклик команд

Низький рівень (сирий RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Для поширених робочих процесів “надати агенту вкладення MEDIA” існують допоміжні засоби вищого рівня.

## Політика команд

Команди Node мають пройти дві перевірки, перш ніж їх можна буде викликати:

1. Node має заявити команду у своєму списку WebSocket `connect.commands`.
2. Політика платформи Gateway має дозволяти заявлену команду.

Супровідні Node Windows і macOS типово дозволяють безпечні заявлені команди, такі як
`canvas.*`, `camera.list`, `location.get` і `screen.snapshot`.
Довірені Node, які оголошують можливість `talk` або заявляють команди `talk.*`,
також типово дозволяють заявлені push-to-talk-команди (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) незалежно від мітки платформи.
Небезпечні або чутливі до приватності команди, такі як `camera.snap`, `camera.clip` і
`screen.record`, усе ще потребують явного opt-in через
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` завжди має пріоритет над
типовими значеннями та додатковими записами allowlist.

Команди Node, якими володіє Plugin, можуть додавати політику node-invoke Gateway. Ця політика
виконується після перевірки allowlist і перед пересиланням до Node, тож сирий
`node.invoke`, допоміжні засоби CLI та спеціалізовані інструменти агента мають одну й ту саму межу
дозволів Plugin. Небезпечні команди Node від Plugin усе ще потребують явного
opt-in `gateway.nodes.allowCommands`.

Після того як Node змінює свій заявлений список команд, відхиліть старе сполучення пристрою
і схваліть новий запит, щоб Gateway зберіг оновлений знімок команд.

## Знімки екрана (знімки canvas)

Якщо Node показує Canvas (WebView), `canvas.snapshot` повертає `{ format, base64 }`.

Допоміжний CLI (записує у тимчасовий файл і виводить `MEDIA:<path>`):

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

- `canvas present` приймає URL або локальні шляхи файлів (`--target`), а також необов’язкові `--x/--y/--width/--height` для позиціювання.
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
- Тривалість кліпу обмежується (зараз `<= 60s`), щоб уникнути завеликих base64-пayload.
- Android запропонує дозволи `CAMERA`/`RECORD_AUDIO`, коли це можливо; відхилені дозволи завершуються помилкою `*_PERMISSION_REQUIRED`.

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

## Місцезнаходження (Node)

Node надають `location.get`, коли Location увімкнено в налаштуваннях.

Допоміжний CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Примітки:

- Location **вимкнено типово**.
- "Always" потребує системного дозволу; фонове отримання виконується за принципом best-effort.
- Відповідь містить lat/lon, точність (метри) і часову позначку.

## SMS (Android Node)

Android Node можуть надавати `sms.send`, коли користувач надає дозвіл **SMS**, а пристрій підтримує телефонію.

Низькорівневий виклик:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примітки:

- Запит дозволу має бути прийнятий на пристрої Android, перш ніж можливість буде оголошена.
- Пристрої лише з Wi-Fi без телефонії не оголошуватимуть `sms.send`.

## Команди Android-пристрою + персональних даних

Android Node можуть оголошувати додаткові сімейства команд, коли відповідні можливості ввімкнені.

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

- Команди Motion обмежуються можливостями наявних сенсорів.

## Системні команди (хост вузла / вузол Mac)

Вузол macOS надає `system.run`, `system.notify` і `system.execApprovals.get/set`.
Безголовий хост вузла надає `system.run`, `system.which` і `system.execApprovals.get/set`.

Приклади:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примітки:

- `system.run` повертає stdout/stderr/код виходу в корисному навантаженні.
- Виконання shell тепер проходить через інструмент `exec` із `host=node`; `nodes` залишається прямою поверхнею RPC для явних команд вузла.
- `nodes invoke` не надає `system.run` або `system.run.prepare`; вони залишаються лише на шляху exec.
- Шлях exec готує канонічний `systemRunPlan` перед схваленням. Після надання
  схвалення gateway пересилає цей збережений план, а не будь-які пізніше
  змінені викликачем поля command/cwd/session.
- `system.notify` враховує стан дозволу на сповіщення в застосунку macOS.
- Нерозпізнані метадані вузла `platform` / `deviceFamily` використовують консервативний стандартний список дозволених, який виключає `system.run` і `system.which`. Якщо ці команди навмисно потрібні для невідомої платформи, додайте їх явно через `gateway.nodes.allowCommands`.
- `system.run` підтримує `--cwd`, `--env KEY=VAL`, `--command-timeout` і `--needs-screen-recording`.
- Для обгорток shell (`bash|sh|zsh ... -c/-lc`) значення `--env` у межах запиту зводяться до явного списку дозволених (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень allow-always у режимі списку дозволених відомі обгортки диспетчеризації (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають шляхи внутрішніх виконуваних файлів замість шляхів обгорток. Якщо безпечне розгортання неможливе, жоден запис списку дозволених автоматично не зберігається.
- На хостах вузлів Windows у режимі списку дозволених запуски shell-обгорток через `cmd.exe /c` потребують схвалення (самого запису списку дозволених недостатньо для автоматичного дозволу форми обгортки).
- `system.notify` підтримує `--priority <passive|active|timeSensitive>` і `--delivery <system|overlay|auto>`.
- Хости Node ігнорують перевизначення `PATH` і вилучають небезпечні ключі запуску/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Якщо потрібні додаткові записи PATH, налаштуйте середовище сервісу хоста вузла (або встановіть інструменти у стандартні розташування) замість передавання `PATH` через `--env`.
- У режимі вузла macOS `system.run` обмежується схваленнями exec у застосунку macOS (Settings → Exec approvals).
  Ask/allowlist/full працюють так само, як і для безголового хоста вузла; відхилені запити повертають `SYSTEM_RUN_DENIED`.
- На безголовому хості вузла `system.run` обмежується схваленнями exec (`~/.openclaw/exec-approvals.json`).

## Прив’язування вузла exec

Коли доступно кілька вузлів, можна прив’язати exec до певного вузла.
Це задає стандартний вузол для `exec host=node` (і може бути перевизначено для окремого агента).

Глобальне стандартне значення:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Перевизначення для окремого агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Скиньте налаштування, щоб дозволити будь-який вузол:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Мапа дозволів

Вузли можуть містити мапу `permissions` у `node.list` / `node.describe`, індексовану за назвою дозволу (наприклад, `screenRecording`, `accessibility`) із булевими значеннями (`true` = надано).

## Безголовий хост вузла (кросплатформний)

OpenClaw може запускати **безголовий хост вузла** (без UI), який підключається до Gateway
WebSocket і надає `system.run` / `system.which`. Це корисно на Linux/Windows
або для запуску мінімального вузла поруч із сервером.

Запустіть його:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примітки:

- Сполучення все ще потрібне (Gateway покаже запит на сполучення пристрою).
- Хост вузла зберігає свій id вузла, токен, відображуване ім’я та інформацію про з’єднання з Gateway у `~/.openclaw/node.json`.
- Схвалення exec застосовуються локально через `~/.openclaw/exec-approvals.json`
  (див. [Схвалення exec](/uk/tools/exec-approvals)).
- На macOS безголовий хост вузла стандартно виконує `system.run` локально. Установіть
  `OPENCLAW_NODE_EXEC_HOST=app`, щоб спрямувати `system.run` через хост exec супутнього застосунку; додайте
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, щоб вимагати хост застосунку та завершуватися із закритою відмовою, якщо він недоступний.
- Додайте `--tls` / `--tls-fingerprint`, коли Gateway WS використовує TLS.

## Режим вузла Mac

- Застосунок панелі меню macOS підключається до сервера Gateway WS як вузол (тому `openclaw nodes …` працює з цим Mac).
- У віддаленому режимі застосунок відкриває SSH-тунель для порту Gateway і підключається до `localhost`.
