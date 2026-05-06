---
read_when:
    - Сполучення вузлів iOS/Android із Gateway
    - Використання полотна/камери Node для контексту агента
    - Додавання нових команд Node або допоміжних засобів CLI
summary: 'Вузли: сполучення, можливості, дозволи та допоміжні засоби CLI для canvas/camera/screen/device/notifications/system'
title: Вузли
x-i18n:
    generated_at: "2026-05-06T01:51:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7cb933edcd0df2151373ea7c3b0289a0aa1b2fc6af581147ce6eb780f9a76351
    source_path: nodes/index.md
    workflow: 16
---

**Node** — це супутній пристрій (macOS/iOS/Android/headless), який підключається до Gateway **WebSocket** (той самий порт, що й оператори) з `role: "node"` і надає командну поверхню (наприклад, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Подробиці протоколу: [протокол Gateway](/uk/gateway/protocol).

Застарілий транспорт: [протокол Bridge](/uk/gateway/bridge-protocol) (TCP JSONL;
лише історичний для поточних Node).

macOS також може працювати в **режимі Node**: застосунок у рядку меню підключається до
WS-сервера Gateway і надає свої локальні команди canvas/camera як Node (тому
`openclaw nodes …` працює з цим Mac). У режимі віддаленого Gateway автоматизацію браузера
виконує хост Node CLI (`openclaw node run` або
встановлена служба Node), а не Node нативного застосунку.

Примітки:

- Node — це **периферійні пристрої**, а не Gateway. Вони не запускають службу Gateway.
- Повідомлення Telegram/WhatsApp/тощо надходять на **Gateway**, а не на Node.
- Runbook для усунення несправностей: [/nodes/troubleshooting](/uk/nodes/troubleshooting)

## Сполучення + статус

**WS Node використовують сполучення пристроїв.** Node передають ідентичність пристрою під час `connect`; Gateway
створює запит на сполучення пристрою для `role: node`. Схваліть через CLI пристроїв (або UI).

Швидкий CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Якщо Node повторює спробу зі зміненими даними автентифікації (роль/області доступу/публічний ключ), попередній
очікуваний запит замінюється, і створюється новий `requestId`. Повторно виконайте
`openclaw devices list` перед схваленням.

Примітки:

- `nodes status` позначає Node як **сполучений**, коли його роль сполучення пристрою містить `node`.
- Запис сполучення пристрою є сталим контрактом схваленої ролі. Ротація токенів
  лишається всередині цього контракту; вона не може підвищити сполучений Node до
  іншої ролі, яку схвалення сполучення ніколи не надавало.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) — це окреме сховище
  сполучення Node, власником якого є Gateway; воно **не** контролює WS-рукостискання `connect`.
- `openclaw nodes remove --node <id|name|ip>` видаляє застарілі записи з цього
  окремого сховища сполучення Node, власником якого є Gateway.
- Область схвалення відповідає оголошеним командам очікуваного запиту:
  - запит без команд: `operator.pairing`
  - команди Node без exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Віддалений хост Node (system.run)

Використовуйте **хост Node**, коли ваш Gateway працює на одній машині, а ви хочете, щоб команди
виконувалися на іншій. Модель і надалі спілкується з **Gateway**; Gateway
пересилає виклики `exec` до **хоста Node**, коли вибрано `host=node`.

### Що де виконується

- **Хост Gateway**: отримує повідомлення, запускає модель, маршрутизує виклики інструментів.
- **Хост Node**: виконує `system.run`/`system.which` на машині Node.
- **Схвалення**: застосовуються на хості Node через `~/.openclaw/exec-approvals.json`.

Примітка щодо схвалень:

- Запуски Node зі схваленням прив’язують точний контекст запиту.
- Для прямих виконань файлів shell/runtime OpenClaw також, за можливості, прив’язує один конкретний локальний
  файловий операнд і відхиляє запуск, якщо цей файл змінюється перед виконанням.
- Якщо OpenClaw не може визначити рівно один конкретний локальний файл для команди інтерпретатора/runtime,
  виконання зі схваленням відхиляється замість удаваного повного покриття runtime. Використовуйте пісочницю,
  окремі хости або явний довірений allowlist/повний робочий процес для ширшої семантики інтерпретатора.

### Запуск хоста Node (передній план)

На машині Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Віддалений Gateway через SSH-тунель (loopback-прив’язка)

Якщо Gateway прив’язується до loopback (`gateway.bind=loopback`, типовий варіант у локальному режимі),
віддалені хости Node не можуть підключатися напряму. Створіть SSH-тунель і вкажіть
хосту Node локальний кінець тунелю.

Приклад (хост Node -> хост Gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Примітки:

- `openclaw node run` підтримує автентифікацію через токен або пароль.
- Змінні середовища є бажаними: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Резервний варіант конфігурації: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост Node навмисно ігнорує `gateway.remote.token` / `gateway.remote.password`.
- У віддаленому режимі `gateway.remote.token` / `gateway.remote.password` можуть використовуватися за правилами пріоритету віддаленого режиму.
- Якщо активні локальні SecretRefs `gateway.auth.*` налаштовані, але не розв’язані, автентифікація хоста Node завершується закритою відмовою.
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

Варіанти іменування:

- `--display-name` у `openclaw node run` / `openclaw node install` (зберігається в `~/.openclaw/node.json` на Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (перевизначення Gateway).

### Додайте команди до allowlist

Схвалення exec є **окремими для кожного хоста Node**. Додайте записи allowlist з Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Схвалення зберігаються на хості Node у `~/.openclaw/exec-approvals.json`.

### Спрямуйте exec на Node

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

`host=auto` не вибиратиме Node неявно самостійно, але явний запит `host=node` для окремого виклику дозволено з `auto`. Якщо ви хочете, щоб exec на Node був типовим для сесії, явно задайте `tools.exec.host=node` або `/exec host=node ...`.

Пов’язано:

- [CLI хоста Node](/uk/cli/node)
- [Інструмент exec](/uk/tools/exec)
- [Схвалення exec](/uk/tools/exec-approvals)

## Виклик команд

Низький рівень (raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Для поширених робочих процесів «дати агенту вкладення MEDIA» існують допоміжні засоби вищого рівня.

## Політика команд

Команди Node мають пройти двоє воріт, перш ніж їх можна буде викликати:

1. Node має оголосити команду у своєму списку WebSocket `connect.commands`.
2. Політика платформи Gateway має дозволяти оголошену команду.

Супутні Node для Windows і macOS типово дозволяють безпечні оголошені команди, як-от
`canvas.*`, `camera.list`, `location.get` і `screen.snapshot`.
Довірені Node, які рекламують можливість `talk` або оголошують команди `talk.*`,
також типово дозволяють оголошені push-to-talk-команди (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), незалежно від мітки платформи.
Небезпечні або чутливі до приватності команди, як-от `camera.snap`, `camera.clip` і
`screen.record`, все одно потребують явного opt-in через
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` завжди має перевагу над
типовими значеннями й додатковими записами allowlist.

Команди Node, власником яких є Plugin, можуть додавати політику node-invoke Gateway. Ця політика
виконується після перевірки allowlist і перед пересиланням до Node, тому raw
`node.invoke`, допоміжні засоби CLI та спеціальні інструменти агента мають ту саму межу
дозволів Plugin. Небезпечні команди Node Plugin все одно потребують явного
opt-in через `gateway.nodes.allowCommands`.

Після того як Node змінює свій оголошений список команд, відхиліть старе сполучення пристрою
і схваліть новий запит, щоб Gateway зберіг оновлений знімок команд.

## Знімки екрана (знімки canvas)

Якщо Node показує Canvas (WebView), `canvas.snapshot` повертає `{ format, base64 }`.

Допоміжний засіб CLI (записує в тимчасовий файл і друкує `MEDIA:<path>`):

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

- `canvas present` приймає URL або локальні шляхи до файлів (`--target`), а також необов’язкові `--x/--y/--width/--height` для позиціонування.
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
- Тривалість кліпу обмежується (зараз `<= 60s`), щоб уникнути надмірно великих base64 payloads.
- Android запитуватиме дозволи `CAMERA`/`RECORD_AUDIO`, коли це можливо; відхилені дозволи завершуються помилкою `*_PERMISSION_REQUIRED`.

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

## Локація (Node)

Node надають `location.get`, коли Location увімкнено в налаштуваннях.

Допоміжний засіб CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Примітки:

- Location типово **вимкнено**.
- “Always” потребує системного дозволу; фонове отримання виконується за можливості.
- Відповідь містить lat/lon, точність (метри) і timestamp.

## SMS (Android Node)

Android Node можуть надавати `sms.send`, коли користувач надає дозвіл **SMS**, а пристрій підтримує телефонію.

Низькорівневий виклик:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примітки:

- Запит дозволу має бути прийнятий на пристрої Android до того, як можливість буде рекламована.
- Пристрої лише з Wi-Fi без телефонії не рекламуватимуть `sms.send`.

## Команди Android-пристрою + персональних даних

Android Node можуть рекламувати додаткові сімейства команд, коли відповідні можливості увімкнено.

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

- Команди руху обмежуються можливостями доступних сенсорів.

## Системні команди (хост Node / mac Node)

Node macOS надає `system.run`, `system.notify` і `system.execApprovals.get/set`.
Безголовий хост Node надає `system.run`, `system.which` і `system.execApprovals.get/set`.

Приклади:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примітки:

- `system.run` повертає stdout/stderr/код виходу в корисному навантаженні.
- Виконання оболонки тепер проходить через інструмент `exec` із `host=node`; `nodes` залишається прямою RPC-поверхнею для явних команд Node.
- `nodes invoke` не надає `system.run` або `system.run.prepare`; вони залишаються лише на шляху exec.
- Шлях exec готує канонічний `systemRunPlan` перед схваленням. Після надання схвалення Gateway пересилає цей збережений план, а не будь-які пізніше змінені викликачем поля command/cwd/session.
- `system.notify` враховує стан дозволу на сповіщення в застосунку macOS.
- Нерозпізнані метадані Node `platform` / `deviceFamily` використовують консервативний стандартний allowlist, який виключає `system.run` і `system.which`. Якщо вам навмисно потрібні ці команди для невідомої платформи, додайте їх явно через `gateway.nodes.allowCommands`.
- `system.run` підтримує `--cwd`, `--env KEY=VAL`, `--command-timeout` і `--needs-screen-recording`.
- Для обгорток оболонки (`bash|sh|zsh ... -c/-lc`) значення `--env` в межах запиту зводяться до явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень «завжди дозволяти» в режимі allowlist відомі обгортки диспетчеризації (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають внутрішні шляхи виконуваних файлів замість шляхів обгорток. Якщо розгортання не є безпечним, запис allowlist автоматично не зберігається.
- На хостах Node Windows у режимі allowlist запуски обгорток оболонки через `cmd.exe /c` потребують схвалення (самого запису allowlist недостатньо для автоматичного дозволу форми обгортки).
- `system.notify` підтримує `--priority <passive|active|timeSensitive>` і `--delivery <system|overlay|auto>`.
- Хости Node ігнорують перевизначення `PATH` і вилучають небезпечні ключі запуску/оболонки (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Якщо вам потрібні додаткові записи PATH, налаштуйте середовище служби хоста Node (або встановіть інструменти у стандартні розташування), а не передавайте `PATH` через `--env`.
- У режимі macOS Node `system.run` обмежується схваленнями exec у застосунку macOS (Settings → Exec approvals).
  Ask/allowlist/full поводяться так само, як безголовий хост Node; відхилені запити повертають `SYSTEM_RUN_DENIED`.
- На безголовому хості Node `system.run` обмежується схваленнями exec (`~/.openclaw/exec-approvals.json`).

## Прив’язка exec до Node

Коли доступно кілька Node, ви можете прив’язати exec до конкретного Node.
Це задає стандартний Node для `exec host=node` (і може бути перевизначено для окремого агента).

Глобальне значення за замовчуванням:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Перевизначення для окремого агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Скасувати, щоб дозволити будь-який Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Мапа дозволів

Node можуть містити мапу `permissions` у `node.list` / `node.describe`, з ключами за назвою дозволу (наприклад, `screenRecording`, `accessibility`) і булевими значеннями (`true` = надано).

## Безголовий хост Node (кросплатформний)

OpenClaw може запускати **безголовий хост Node** (без UI), який підключається до WebSocket Gateway і надає `system.run` / `system.which`. Це корисно на Linux/Windows або для запуску мінімального Node поряд із сервером.

Запустіть його:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примітки:

- Сполучення все ще потрібне (Gateway покаже запит на сполучення пристрою).
- Хост Node зберігає свій ідентифікатор Node, токен, відображуване ім’я та інформацію про підключення до Gateway у `~/.openclaw/node.json`.
- Схвалення exec застосовуються локально через `~/.openclaw/exec-approvals.json`
  (див. [Схвалення exec](/uk/tools/exec-approvals)).
- На macOS безголовий хост Node за замовчуванням виконує `system.run` локально. Встановіть `OPENCLAW_NODE_EXEC_HOST=app`, щоб спрямувати `system.run` через хост exec супровідного застосунку; додайте `OPENCLAW_NODE_EXEC_FALLBACK=0`, щоб вимагати хост застосунку й безпечно завершуватися з помилкою, якщо він недоступний.
- Додайте `--tls` / `--tls-fingerprint`, коли Gateway WS використовує TLS.

## Режим Mac Node

- Застосунок панелі меню macOS підключається до сервера Gateway WS як Node (тож `openclaw nodes …` працює з цим Mac).
- У віддаленому режимі застосунок відкриває SSH-тунель для порту Gateway і підключається до `localhost`.
