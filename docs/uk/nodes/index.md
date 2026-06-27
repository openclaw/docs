---
read_when:
    - Сполучення вузлів iOS/Android із Gateway
    - Використання полотна/камери вузла для контексту агента
    - Додавання нових команд Node або допоміжних CLI-засобів
summary: 'Nodes: сполучення, можливості, дозволи та допоміжні засоби CLI для canvas/camera/screen/device/notifications/system'
title: Вузли
x-i18n:
    generated_at: "2026-06-27T17:43:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

**Node** — це супровідний пристрій (macOS/iOS/Android/headless), який підключається до **WebSocket** Gateway (той самий порт, що й оператори) з `role: "node"` і надає поверхню команд (наприклад, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Деталі протоколу: [протокол Gateway](/uk/gateway/protocol).

Застарілий транспорт: [протокол Bridge](/uk/gateway/bridge-protocol) (TCP JSONL;
лише історичний для поточних Nodes).

macOS також може працювати в **режимі Node**: програма в рядку меню підключається до WS-сервера Gateway і надає свої локальні команди canvas/camera як Node (тож `openclaw nodes …` працює з цим Mac). У режимі віддаленого Gateway автоматизацію браузера обробляє хост CLI Node (`openclaw node run` або встановлений сервіс Node), а не нативний застосунок Node.

Примітки:

- Nodes — це **периферійні пристрої**, а не gateways. Вони не запускають сервіс gateway.
- Повідомлення Telegram/WhatsApp/тощо надходять на **gateway**, а не на Nodes.
- Runbook для усунення несправностей: [/nodes/troubleshooting](/uk/nodes/troubleshooting)

## Сполучення + статус

**WS Nodes використовують сполучення пристрою.** Nodes передають ідентичність пристрою під час `connect`; Gateway створює запит на сполучення пристрою для `role: node`. Схваліть через CLI пристроїв (або UI).

Швидкий CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Якщо Node повторює спробу зі зміненими даними автентифікації (role/scopes/public key), попередній запит у стані очікування замінюється і створюється новий `requestId`. Повторно запустіть `openclaw devices list` перед схваленням.

Примітки:

- `nodes status` позначає Node як **сполучений**, коли роль його сполучення пристрою містить `node`.
- Запис сполучення пристрою є довготривалим контрактом схваленої ролі. Ротація токена лишається в межах цього контракту; вона не може підвищити сполучений Node до іншої ролі, яку схвалення сполучення ніколи не надавало.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) — це окреме сховище сполучень Node, яким володіє gateway; воно **не** контролює handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` видаляє сполучення Node. Для Node, прив’язаного до пристрою, це відкликає роль `node` пристрою в `devices/paired.json` і від’єднує сесії цього пристрою з роллю Node — пристрій зі змішаними ролями зберігає свій рядок і втрачає лише роль `node`, тоді як рядок пристрою тільки з роллю Node видаляється. Це також очищає будь-який відповідний запис з окремого сховища сполучень Node, яким володіє gateway. `operator.pairing` може видаляти неоператорські рядки Node; викликач із device-token, який відкликає власну роль Node на пристрої зі змішаними ролями, додатково потребує `operator.admin`.
- Область схвалення відповідає заявленим командам запиту в очікуванні:
  - запит без команд: `operator.pairing`
  - команди Node без exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Віддалений хост Node (system.run)

Використовуйте **хост Node**, коли ваш Gateway працює на одній машині, а команди потрібно виконувати на іншій. Модель усе ще спілкується з **gateway**; gateway пересилає виклики `exec` до **хоста Node**, коли вибрано `host=node`.

### Що де виконується

- **Хост Gateway**: отримує повідомлення, запускає модель, маршрутизує виклики інструментів.
- **Хост Node**: виконує `system.run`/`system.which` на машині Node.
- **Схвалення**: застосовуються на хості Node через `~/.openclaw/exec-approvals.json`.

Примітка щодо схвалення:

- Запуски Node на основі схвалення прив’язуються до точного контексту запиту.
- Для прямих shell/runtime виконань файлів OpenClaw також за принципом best-effort прив’язує один конкретний локальний файловий операнд і відхиляє запуск, якщо цей файл зміниться до виконання.
- Якщо OpenClaw не може визначити рівно один конкретний локальний файл для команди інтерпретатора/runtime, виконання на основі схвалення відхиляється замість удавання повного покриття runtime. Для ширшої семантики інтерпретатора використовуйте sandboxing, окремі хости або явний довірений allowlist/повний workflow.

### Запуск хоста Node (передній план)

На машині Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Віддалений gateway через SSH-тунель (loopback bind)

Якщо Gateway прив’язаний до loopback (`gateway.bind=loopback`, типово в локальному режимі), віддалені хости Node не можуть підключатися напряму. Створіть SSH-тунель і вкажіть хосту Node локальний кінець тунелю.

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
- Змінні середовища є бажаними: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Резервна конфігурація: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост Node навмисно ігнорує `gateway.remote.token` / `gateway.remote.password`.
- У віддаленому режимі `gateway.remote.token` / `gateway.remote.password` допустимі відповідно до правил пріоритету віддаленого режиму.
- Якщо налаштовані активні локальні SecretRefs `gateway.auth.*`, але їх не розв’язано, автентифікація хоста Node завершується закритою відмовою.
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

Якщо Node повторює спробу зі зміненими даними автентифікації, повторно запустіть `openclaw devices list` і схваліть поточний `requestId`.

Параметри іменування:

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

Або для сесії:

```
/exec host=node security=allowlist node=<id-or-name>
```

Після налаштування будь-який виклик `exec` з `host=node` виконується на хості Node (з урахуванням allowlist/схвалень Node).

`host=auto` не вибере Node неявно самостійно, але явний запит `host=node` для окремого виклику дозволений з `auto`. Якщо потрібно, щоб exec Node був типовим для сесії, явно задайте `tools.exec.host=node` або `/exec host=node ...`.

Пов’язане:

- [CLI хоста Node](/uk/cli/node)
- [Інструмент exec](/uk/tools/exec)
- [Схвалення exec](/uk/tools/exec-approvals)

## Виклик команд

Низький рівень (сирий RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Існують допоміжні засоби вищого рівня для поширених workflow «дати агенту вкладення MEDIA».

## Політика команд

Перед викликом команди Node мають пройти дві перевірки:

1. Node має оголосити команду у своєму списку WebSocket `connect.commands`.
2. Політика платформи gateway має дозволяти оголошену команду.

Супровідні Nodes Windows і macOS типово дозволяють безпечні оголошені команди, як-от `canvas.*`, `camera.list`, `location.get` і `screen.snapshot`. Довірені Nodes, які рекламують можливість `talk` або оголошують команди `talk.*`, також типово дозволяють оголошені push-to-talk команди (`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`), незалежно від мітки платформи. Небезпечні або чутливі до приватності команди, як-от `camera.snap`, `camera.clip` і `screen.record`, усе ще потребують явного opt-in через `gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` завжди має пріоритет над типовими значеннями та додатковими записами allowlist.

Команди Node, якими володіє Plugin, можуть додати політику Gateway node-invoke. Ця політика виконується після перевірки allowlist і перед пересиланням до Node, тож сирий `node.invoke`, CLI-помічники та спеціальні агентські інструменти мають однакову межу дозволів Plugin. Небезпечні команди Node від Plugin усе ще потребують явного opt-in `gateway.nodes.allowCommands`.

Після того як Node змінить свій оголошений список команд, відхиліть старе сполучення пристрою й схваліть новий запит, щоб gateway зберіг оновлений знімок команд.

## Конфігурація (`openclaw.json`)

Налаштування, пов’язані з Node, розміщені в `gateway.nodes` і `tools.exec`:

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

Використовуйте точні назви команд Node. `denyCommands` вилучає команду, навіть якщо типове значення платформи або запис `allowCommands` інакше дозволив би її. Див. [довідник конфігурації Gateway](/uk/gateway/configuration-reference#gateway-field-details) для деталей полів сполучення Node gateway і політики команд.

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

## Знімки екрана (знімки canvas)

Якщо Node показує Canvas (WebView), `canvas.snapshot` повертає `{ format, base64 }`.

CLI-помічник (записує у тимчасовий файл і друкує збережений шлях):

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

- `canvas present` приймає URL або локальні шляхи до файлів (`--target`), а також необов’язкові `--x/--y/--width/--height` для позиціонування.
- `canvas eval` приймає inline JS (`--js`) або позиційний аргумент.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Примітки:

- Мобільні Nodes використовують вбудовану сторінку A2UI, якою володіє застосунок, для рендерингу з підтримкою дій.
- Підтримується лише A2UI v0.8 JSONL (v0.9/createSurface відхиляється).
- iOS і Android рендерять віддалені сторінки Gateway Canvas, але дії кнопок A2UI надсилаються лише з вбудованої сторінки A2UI, якою володіє застосунок. HTTP/HTTPS сторінки A2UI, розміщені на Gateway, на цих мобільних клієнтах доступні лише для рендерингу.

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

- Вузол має бути **на передньому плані** для `canvas.*` і `camera.*` (фонові виклики повертають `NODE_BACKGROUND_UNAVAILABLE`).
- Тривалість кліпу обмежується (зараз `<= 60s`), щоб уникнути завеликих base64-навантажень.
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

- Геолокацію **вимкнено за замовчуванням**.
- "Завжди" потребує системного дозволу; фонове отримання виконується за принципом найкращої спроби.
- Відповідь містить lat/lon, точність (у метрах) і часову позначку.

## SMS (вузли Android)

Вузли Android можуть надавати `sms.send`, коли користувач надає дозвіл **SMS**, а пристрій підтримує телефонію.

Низькорівневий виклик:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примітки:

- Запит дозволу потрібно прийняти на пристрої Android, перш ніж capability буде оголошено.
- Пристрої лише з Wi-Fi без телефонії не оголошуватимуть `sms.send`.

## Команди пристрою Android і персональних даних

Вузли Android можуть оголошувати додаткові сімейства команд, коли ввімкнено відповідні capabilities.

Доступні сімейства:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps`, коли спільний доступ до встановлених застосунків увімкнено в налаштуваннях Android
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

- `device.apps` є опціональним і типово повертає програми, видимі в лаунчері.
- Команди руху обмежуються можливостями доступних датчиків.

## Системні команди (хост вузла / mac-вузол)

Вузол macOS надає `system.run`, `system.notify` і `system.execApprovals.get/set`.
Безголовий хост вузла надає `system.run`, `system.which` і `system.execApprovals.get/set`.

Приклади:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примітки:

- `system.run` повертає stdout/stderr/код виходу в корисному навантаженні.
- Виконання оболонки тепер проходить через інструмент `exec` із `host=node`; `nodes` залишається поверхнею прямого RPC для явних команд вузла.
- `nodes invoke` не надає `system.run` або `system.run.prepare`; вони залишаються лише на шляху exec.
- Шлях exec готує канонічний `systemRunPlan` перед затвердженням. Щойно
  затвердження надано, gateway пересилає цей збережений план, а не будь-які пізніше
  змінені викликачем поля command/cwd/session.
- `system.notify` враховує стан дозволу на сповіщення в програмі macOS.
- Нерозпізнані метадані вузла `platform` / `deviceFamily` використовують консервативний типовий список дозволених команд, який виключає `system.run` і `system.which`. Якщо вам навмисно потрібні ці команди для невідомої платформи, додайте їх явно через `gateway.nodes.allowCommands`.
- `system.run` підтримує `--cwd`, `--env KEY=VAL`, `--command-timeout` і `--needs-screen-recording`.
- Для обгорток оболонки (`bash|sh|zsh ... -c/-lc`) значення `--env` у межах запиту зводяться до явного списку дозволених (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень завжди дозволяти в режимі списку дозволених відомі обгортки диспетчеризації (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають шляхи внутрішніх виконуваних файлів замість шляхів обгорток. Якщо розгортання не є безпечним, запис списку дозволених автоматично не зберігається.
- На хостах вузлів Windows у режимі списку дозволених запуски обгортки оболонки через `cmd.exe /c` потребують затвердження (сам лише запис у списку дозволених не дозволяє автоматично форму обгортки).
- `system.notify` підтримує `--priority <passive|active|timeSensitive>` і `--delivery <system|overlay|auto>`.
- Хости Node ігнорують перевизначення `PATH` і вилучають небезпечні ключі запуску/оболонки (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Якщо вам потрібні додаткові записи PATH, налаштуйте середовище служби хоста вузла (або встановіть інструменти у стандартні місця) замість передавання `PATH` через `--env`.
- У режимі вузла macOS `system.run` обмежується затвердженнями exec у програмі macOS (Settings → Exec approvals).
  Ask/allowlist/full поводяться так само, як і безголовий хост вузла; відхилені запити повертають `SYSTEM_RUN_DENIED`.
- На безголовому хості вузла `system.run` обмежується затвердженнями exec (`~/.openclaw/exec-approvals.json`).

## Прив’язування вузла exec

Коли доступно кілька вузлів, ви можете прив’язати exec до певного вузла.
Це задає типовий вузол для `exec host=node` (і може бути перевизначено для кожного агента).

Глобальне типове значення:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Перевизначення для окремого агента:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Скасуйте налаштування, щоб дозволити будь-який Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Мапа дозволів

Node можуть містити мапу `permissions` у `node.list` / `node.describe`, де ключами є назви дозволів (наприклад, `screenRecording`, `accessibility`) із булевими значеннями (`true` = надано).

## Безголовий хост Node (кросплатформний)

OpenClaw може запускати **безголовий хост Node** (без UI), який підключається до Gateway
WebSocket і надає `system.run` / `system.which`. Це корисно в Linux/Windows
або для запуску мінімального Node поруч із сервером.

Запустіть його:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примітки:

- Сполучення все ще потрібне (Gateway покаже запит на сполучення пристрою).
- Хост Node зберігає свій ідентифікатор Node, токен, відображуване ім’я та дані підключення до Gateway у `~/.openclaw/node.json`.
- Затвердження exec застосовуються локально через `~/.openclaw/exec-approvals.json`
  (див. [Затвердження exec](/uk/tools/exec-approvals)).
- У macOS безголовий хост Node типово виконує `system.run` локально. Установіть
  `OPENCLAW_NODE_EXEC_HOST=app`, щоб спрямувати `system.run` через хост exec супровідного застосунку; додайте
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, щоб вимагати хост застосунку й завершуватися відмовою, якщо він недоступний.
- Додайте `--tls` / `--tls-fingerprint`, коли Gateway WS використовує TLS.

## Режим Mac Node

- Застосунок macOS у рядку меню підключається до сервера Gateway WS як Node (тому `openclaw nodes …` працює з цим Mac).
- У віддаленому режимі застосунок відкриває SSH-тунель для порту Gateway і підключається до `localhost`.
