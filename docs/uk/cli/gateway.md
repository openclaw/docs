---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення Gateway через Bonjour (локально + широкозонний DNS-SD)
summary: CLI Gateway OpenClaw (`openclaw gateway`) — запуск, запити й виявлення Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-23T06:17:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60706df4d3c49271c4b53029eaae16672dde534c7f6f4ce68e04b58fb0cfa467
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, хуки).

Підкоманди на цій сторінці доступні через `openclaw gateway …`.

Пов’язана документація:

- [/gateway/bonjour](/uk/gateway/bonjour)
- [/gateway/discovery](/uk/gateway/discovery)
- [/gateway/configuration](/uk/gateway/configuration)

## Запуск Gateway

Запустіть локальний процес Gateway:

```bash
openclaw gateway
```

Псевдонім для запуску у foreground:

```bash
openclaw gateway run
```

Примітки:

- За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Для разових запусків або запусків у режимі розробки використовуйте `--allow-unconfigured`.
- Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та виправте її, а не припускайте локальний режим неявно.
- Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється «вгадувати local» за вас.
- Прив’язка поза межами loopback без автентифікації блокується (захисне обмеження).
- `SIGUSR1` запускає перезапуск у межах процесу за наявності дозволу (`commands.restart` увімкнено за замовчуванням; установіть `commands.restart: false`, щоб заборонити ручний перезапуск, при цьому інструменти gateway tool/config apply/update залишатимуться дозволеними).
- Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден користувацький стан термінала. Якщо ви обгортаєте CLI в TUI або raw-mode input, відновіть термінал перед виходом.

### Параметри

- `--port <port>`: порт WebSocket (типове значення надходить із config/env; зазвичай `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: режим прив’язки слухача.
- `--auth <token|password>`: перевизначення режиму автентифікації.
- `--token <token>`: перевизначення токена (також установлює `OPENCLAW_GATEWAY_TOKEN` для процесу).
- `--password <password>`: перевизначення пароля. Попередження: паролі, передані inline, можуть бути видимі в локальних списках процесів.
- `--password-file <path>`: прочитати пароль gateway з файлу.
- `--tailscale <off|serve|funnel>`: оприлюднити Gateway через Tailscale.
- `--tailscale-reset-on-exit`: скинути конфігурацію Tailscale serve/funnel під час завершення роботи.
- `--allow-unconfigured`: дозволити запуск gateway без `gateway.mode=local` у конфігурації. Це обходить стартовий захист лише для разового/dev bootstrap; воно не записує й не виправляє файл конфігурації.
- `--dev`: створити dev config + workspace, якщо їх немає (пропускає BOOTSTRAP.md).
- `--reset`: скинути dev config + credentials + sessions + workspace (потребує `--dev`).
- `--force`: перед запуском завершити будь-який наявний listener на вибраному порту.
- `--verbose`: докладні журнали.
- `--cli-backend-logs`: показувати в консолі лише журнали backend CLI (і вмикати stdout/stderr).
- `--ws-log <auto|full|compact>`: стиль журналу websocket (типово `auto`).
- `--compact`: псевдонім для `--ws-log compact`.
- `--raw-stream`: журналювати сирі події потоку моделі у jsonl.
- `--raw-stream-path <path>`: шлях до raw stream jsonl.

Профілювання запуску:

- Установіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати тривалість фаз під час запуску Gateway.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти продуктивність запуску Gateway. Бенчмарк фіксує перший вивід процесу, `/healthz`, `/readyz` і часові показники startup trace.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

Режими виводу:

- Типово: зручний для читання людиною формат (із кольорами в TTY).
- `--json`: JSON для машинного читання (без стилізації/spinner).
- `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши придатний для читання людиною макет.

Спільні параметри (де підтримуються):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: токен Gateway.
- `--password <password>`: пароль Gateway.
- `--timeout <ms>`: тайм-аут/бюджет часу (залежить від команди).
- `--expect-final`: чекати на відповідь “final” (виклики агентів).

Примітка: коли ви встановлюєте `--url`, CLI не використовує резервний перехід до облікових даних із конфігурації або змінних середовища.
Передайте `--token` або `--password` явно. Відсутність явних облікових даних є помилкою.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпойнт `/healthz` — це перевірка живучості: він повертає відповідь, щойно сервер може відповідати по HTTP. HTTP-ендпойнт `/readyz` суворіший і залишається червоним, доки стартові sidecar-процеси, канали або налаштовані хуки ще завершують ініціалізацію.

### `gateway usage-cost`

Отримати зведення usage-cost із журналів сесій.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Параметри:

- `--days <days>`: кількість днів для включення (типово `30`).

### `gateway stability`

Отримати нещодавні дані записувача діагностичної стабільності із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Параметри:

- `--limit <limit>`: максимальна кількість нещодавніх подій для включення (типово `25`, максимум `1000`).
- `--type <type>`: фільтр за типом діагностичної події, наприклад `payload.large` або `diagnostic.memory.pressure`.
- `--since-seq <seq>`: включати лише події після номера діагностичної послідовності.
- `--bundle [path]`: читати збережений stability bundle замість звернення до запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого bundle у каталозі стану або передайте шлях безпосередньо до bundle JSON.
- `--export`: записати shareable support diagnostics zip замість виведення подробиць stability.
- `--output <path>`: шлях виводу для `--export`.

Примітки:

- Записувач активний за замовчуванням. Установлюйте `diagnostics.enabled: false` лише тоді, коли потрібно вимкнути збір діагностичного Heartbeat Gateway.
- Записи зберігають операційні метадані: назви подій, кількості, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналу/plugin і відредаговані зведення сесій. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies, секретні значення, імена хостів або сирі ідентифікатори сесій.
- У разі фатального завершення Gateway, тайм-аутів під час завершення роботи та збоїв запуску після перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо в записувача є події. Перегляньте найновіший bundle за допомогою `openclaw gateway stability --bundle latest`; параметри `--limit`, `--type` і `--since-seq` також застосовуються до виводу bundle.

### `gateway diagnostics export`

Записати локальний diagnostics zip, призначений для додавання до звітів про помилки.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Параметри:

- `--output <path>`: шлях до вихідного zip-файлу. Типово — support export у каталозі стану.
- `--log-lines <count>`: максимальна кількість санітизованих рядків журналу для включення (типово `5000`).
- `--log-bytes <bytes>`: максимальна кількість байтів журналу для аналізу (типово `1000000`).
- `--url <url>`: URL WebSocket Gateway для знімка health.
- `--token <token>`: токен Gateway для знімка health.
- `--password <password>`: пароль Gateway для знімка health.
- `--timeout <ms>`: тайм-аут знімка status/health (типово `3000`).
- `--no-stability-bundle`: пропустити пошук збереженого stability bundle.
- `--json`: вивести записаний шлях, розмір і manifest у форматі JSON.

Експорт містить manifest, зведення в Markdown, форму конфігурації, санітизовані деталі конфігурації, санітизовані зведення журналів, санітизовані знімки стану/health Gateway і найновіший stability bundle, якщо він існує.

Він призначений для поширення. Він зберігає операційні деталі, які допомагають у налагодженні, наприклад безпечні поля журналів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, ідентифікатори plugin, ідентифікатори провайдерів, несекретні налаштування функцій і відредаговані операційні повідомлення журналу. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookies, ідентифікатори облікових записів/повідомлень, текст prompt/instruction, імена хостів і секретні значення. Якщо повідомлення у стилі LogTape схоже на текст навантаження користувача/чату/інструмента, експорт зберігає лише факт пропуску повідомлення та його розмір у байтах.

### `gateway status`

`gateway status` показує сервіс Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливостей підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Параметри:

- `--url <url>`: додати явну ціль перевірки. Налаштовані remote + localhost також перевіряються.
- `--token <token>`: автентифікація токеном для перевірки.
- `--password <password>`: автентифікація паролем для перевірки.
- `--timeout <ms>`: тайм-аут перевірки (типово `10000`).
- `--no-probe`: пропустити перевірку підключення (лише перегляд сервісу).
- `--deep`: також сканувати системні сервіси.
- `--require-rpc`: підвищити типову перевірку підключення до перевірки читання та завершуватися з ненульовим кодом, якщо ця перевірка читання не вдалася. Не можна поєднувати з `--no-probe`.

Примітки:

- `gateway status` залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
- Типова `gateway status` підтверджує стан сервісу, WebSocket-підключення та можливість автентифікації, видиму під час handshake. Вона не підтверджує операції читання/запису/адміністрування.
- `gateway status` визначає налаштовані auth SecretRef для автентифікації перевірки, коли це можливо.
- Якщо потрібний auth SecretRef не визначається в цьому шляху виконання команди, `gateway status --json` повідомляє `rpc.authWarning`, коли перевірка підключення/автентифікації не вдається; передайте `--token`/`--password` явно або спочатку визначте джерело секрету.
- Якщо перевірка успішна, попередження про невизначені auth-ref приховуються, щоб уникнути хибнопозитивних результатів.
- Використовуйте `--require-rpc` у скриптах і автоматизації, коли недостатньо просто сервісу, що слухає, і потрібно, щоб RPC-виклики зі scope читання теж були справними.
- `--deep` додає спробу знайти додаткові встановлення launchd/systemd/schtasks. Коли виявлено кілька сервісів, схожих на gateway, придатний для читання людиною вивід показує підказки з очищення та попереджає, що більшість установок повинні запускати один gateway на машину.
- Вивід для людини містить визначений шлях до журналу файлу, а також знімок шляхів/чинності конфігурації CLI порівняно із сервісом, щоб допомогти діагностувати розходження профілю або state-dir.
- В установках Linux systemd перевірки розходження автентифікації читають значення `Environment=` і `EnvironmentFile=` з unit-файлу (включно з `%h`, лапкованими шляхами, кількома файлами й необов’язковими файлами з `-`).
- Перевірки розходження визначають SecretRef для `gateway.auth.token`, використовуючи об’єднане runtime env (спочатку env команди сервісу, потім резервно env процесу).
- Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy` або режим не встановлено, де пароль може мати пріоритет і жоден кандидат токена не може мати пріоритет), перевірки розходження токена пропускають визначення токена конфігурації.

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований remote gateway (якщо задано), і
- localhost (loopback) **навіть якщо remote налаштовано**.

Якщо ви передасте `--url`, ця явна ціль буде додана перед обома. У виводі для людини
цілі позначаються так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

Якщо доступно кілька gateway, команда виведе їх усі. Підтримка кількох gateway можлива, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість установок усе ж запускають один gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Інтерпретація:

- `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-підключення.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що саме перевірка змогла довести щодо автентифікації. Це окремо від доступності.
- `Read probe: ok` означає, що RPC-виклики деталей зі scope читання (`health`/`status`/`system-presence`/`config.get`) також були успішними.
- `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC зі scope читання обмежені. Це повідомляється як **знижена** доступність, а не як повна відмова.
- Код виходу є ненульовим лише тоді, коли жодна з перевірених цілей не є доступною.

Примітки щодо JSON (`--json`):

- Верхній рівень:
  - `ok`: принаймні одна ціль є доступною.
  - `degraded`: принаймні одна ціль мала RPC деталей з обмеженим scope.
  - `capability`: найкраща можливість, виявлена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
  - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштований remote, потім local loopback.
  - `warnings[]`: записи попереджень best-effort з `code`, `message` і необов’язковими `targetIds`.
  - `network`: підказки URL для local loopback/tailnet, похідні від поточної конфігурації та мережі хоста.
  - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів виявлення, використані для цього проходу перевірки.
- Для кожної цілі (`targets[].connect`):
  - `ok`: доступність після підключення + класифікація degraded.
  - `rpcOk`: повний успіх RPC деталей.
  - `scopeLimited`: RPC деталей не вдалося через відсутній operator scope.
- Для кожної цілі (`targets[].auth`):
  - `role`: роль автентифікації, повідомлена в `hello-ok`, якщо доступна.
  - `scopes`: надані scope, повідомлені в `hello-ok`, якщо доступні.
  - `capability`: класифікація можливості автентифікації, показана для цієї цілі.

Поширені коди попереджень:

- `ssh_tunnel_failed`: не вдалося налаштувати SSH-тунель; команда повернулася до прямих перевірок.
- `multiple_gateways`: доступною була більш ніж одна ціль; це нетипово, якщо тільки ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
- `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося визначити для цілі, що завершилася помилкою.
- `probe_scope_limited`: WebSocket-підключення успішне, але перевірка читання була обмежена через відсутність `operator.read`.

#### Remote через SSH (паритет із застосунком Mac)

Режим macOS-застосунку “Remote over SSH” використовує локальне перенаправлення порту, щоб remote gateway (який може бути прив’язаний лише до loopback) став доступним за адресою `ws://127.0.0.1:<port>`.

Еквівалент у CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Параметри:

- `--ssh <target>`: `user@host` або `user@host:port` (порт типово `22`).
- `--ssh-identity <path>`: файл identity.
- `--ssh-auto`: вибрати перший виявлений хост gateway як SSH-ціль із визначеної
  кінцевої точки виявлення (`local.` плюс налаштований домен широкозонного виявлення, якщо є). Підказки лише з TXT
  ігноруються.

Конфігурація (необов’язкова, використовується як типові значення):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий допоміжний засіб RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Параметри:

- `--params <json>`: рядок JSON-об’єкта для параметрів (типово `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Примітки:

- `--params` має бути коректним JSON.
- `--expect-final` головним чином призначений для RPC у стилі агентів, які транслюють проміжні події перед фінальним навантаженням.

## Керування сервісом Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Параметри команд:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Примітки:

- `gateway install` підтримує `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Коли автентифікація токеном потребує токен і `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можливо визначити, але не зберігає визначений токен у метаданих середовища сервісу.
- Якщо автентифікація токеном потребує токен, а налаштований token SecretRef не визначається, встановлення завершується із закриттям доступу замість збереження резервного відкритого тексту.
- Для автентифікації паролем у `gateway run` віддавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password`, підкріпленому SecretRef, замість inline `--password`.
- У режимі виведеної автентифікації shell-only `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час встановлення; використовуйте стійку конфігурацію (`gateway.auth.password` або config `env`) під час встановлення керованого сервісу.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не встановлено, встановлення блокується, доки режим не буде задано явно.
- Команди життєвого циклу приймають `--json` для скриптів.

## Виявлення gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (наприклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [/gateway/bonjour](/uk/gateway/bonjour)

Лише gateway з увімкненим виявленням Bonjour (типово ввімкнено) рекламують маяк.

Записи Wide-Area discovery містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти типово використовують `22` для SSH-цілей, якщо це значення відсутнє)
- `tailnetDns` (ім’я хоста MagicDNS, коли доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка remote-install, записана до wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

Параметри:

- `--timeout <ms>`: тайм-аут на команду (browse/resolve); типово `2000`.
- `--json`: машинозчитуваний вивід (також вимикає стилізацію/spinner).

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Примітки:

- CLI сканує `local.` плюс налаштований домен широкозонного виявлення, якщо його ввімкнено.
- `wsUrl` у JSON-виводі виводиться з визначеної кінцевої точки сервісу, а не з підказок
  лише з TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS `sshPort` і `cliPath` транслюються лише тоді, коли
  `discovery.mdns.mode` має значення `full`. Wide-area DNS-SD усе одно записує `cliPath`; `sshPort`
  і там також залишається необов’язковим.
