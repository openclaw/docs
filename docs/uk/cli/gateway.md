---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення gateway через Bonjour (локальний і wide-area DNS-SD)
summary: CLI Gateway OpenClaw (`openclaw gateway`) — запуск, запити та виявлення gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-23T20:47:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c6df73cd05f770f22121aa5a835af679b86bfa8eca06702e136a83822a7c9c9
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Gateway — це WebSocket-сервер OpenClaw (канали, Node, сесії, hooks).

Підкоманди на цій сторінці розташовані під `openclaw gateway …`.

Пов’язана документація:

- [/gateway/bonjour](/uk/gateway/bonjour)
- [/gateway/discovery](/uk/gateway/discovery)
- [/gateway/configuration](/uk/gateway/configuration)

## Запуск Gateway

Запустіть локальний процес Gateway:

```bash
openclaw gateway
```

Псевдонім для переднього плану:

```bash
openclaw gateway run
```

Примітки:

- За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не задано `gateway.mode=local`. Використовуйте `--allow-unconfigured` для ad-hoc/dev-запусків.
- Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та виправте її замість неявного припущення локального режиму.
- Якщо файл існує, а `gateway.mode` відсутній, Gateway трактує це як підозріле пошкодження конфігурації та відмовляється «вгадувати local» за вас.
- Прив’язка за межами loopback без автентифікації блокується (захисне обмеження).
- `SIGUSR1` запускає перезапуск у межах процесу, якщо це дозволено (`commands.restart` увімкнено за замовчуванням; задайте `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як застосування/оновлення інструмента gateway і конфігурації залишатиметься дозволеним).
- Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден користувацький стан термінала. Якщо ви обгортаєте CLI через TUI або raw-mode input, відновіть термінал перед виходом.

### Параметри

- `--port <port>`: порт WebSocket (типове значення надходить із config/env; зазвичай `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: режим прив’язки listener.
- `--auth <token|password>`: перевизначення режиму автентифікації.
- `--token <token>`: перевизначення токена (також задає `OPENCLAW_GATEWAY_TOKEN` для процесу).
- `--password <password>`: перевизначення пароля. Попередження: паролі, передані inline, можуть бути видимі в локальних списках процесів.
- `--password-file <path>`: прочитати пароль gateway із файла.
- `--tailscale <off|serve|funnel>`: опублікувати Gateway через Tailscale.
- `--tailscale-reset-on-exit`: скинути конфігурацію serve/funnel Tailscale під час завершення роботи.
- `--allow-unconfigured`: дозволити запуск gateway без `gateway.mode=local` у config. Це обходить стартовий захист лише для ad-hoc/dev bootstrap; воно не записує і не виправляє файл конфігурації.
- `--dev`: створити dev config + workspace, якщо їх немає (пропускає BOOTSTRAP.md).
- `--reset`: скинути dev config + credentials + sessions + workspace (потребує `--dev`).
- `--force`: завершити будь-який наявний listener на вибраному порту перед запуском.
- `--verbose`: докладні журнали.
- `--cli-backend-logs`: показувати в консолі лише журнали backend CLI (і ввімкнути stdout/stderr).
- `--ws-log <auto|full|compact>`: стиль журналу websocket (типово `auto`).
- `--compact`: псевдонім для `--ws-log compact`.
- `--raw-stream`: журналювати необроблені події потоку моделі до jsonl.
- `--raw-stream-path <path>`: шлях до jsonl необробленого потоку.

Профілювання запуску:

- Установіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати тривалість фаз під час запуску Gateway.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти запуск Gateway. Бенчмарк фіксує перший вивід процесу, `/healthz`, `/readyz` і часові мітки трасування запуску.

## Запит до запущеного Gateway

Усі команди запиту використовують WebSocket RPC.

Режими виводу:

- Типово: формат для читання людиною (з кольорами в TTY).
- `--json`: JSON для машинного читання (без стилізації/spinner).
- `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши формат для людини.

Спільні параметри (де підтримується):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: токен Gateway.
- `--password <password>`: пароль Gateway.
- `--timeout <ms>`: timeout/budget (залежить від команди).
- `--expect-final`: чекати на «final» відповідь (виклики агента).

Примітка: коли ви задаєте `--url`, CLI не використовує резервні credentials із config або середовища.
Явно передайте `--token` або `--password`. Відсутність явних credentials — це помилка.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпоінт `/healthz` — це liveness-probe: він повертає результат, щойно сервер може відповідати по HTTP. HTTP-ендпоінт `/readyz` суворіший і лишається червоним, поки sidecar-компоненти запуску, канали або налаштовані hooks ще не завершили ініціалізацію.

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

Отримати недавній діагностичний записувач стабільності із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Параметри:

- `--limit <limit>`: максимальна кількість недавніх подій для включення (типово `25`, максимум `1000`).
- `--type <type>`: фільтр за типом діагностичної події, наприклад `payload.large` або `diagnostic.memory.pressure`.
- `--since-seq <seq>`: включати лише події після номера діагностичної послідовності.
- `--bundle [path]`: читати збережений bundle стабільності замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого bundle у каталозі стану, або передайте шлях до JSON bundle напряму.
- `--export`: записати zip зі спільною діагностикою підтримки замість виведення відомостей про стабільність.
- `--output <path>`: шлях виводу для `--export`.

Примітки:

- Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/plugin, а також відредаговані зведення сесій. Вони не зберігають текст чатів, тіла webhook, виводи інструментів, необроблені тіла запитів чи відповідей, токени, cookie, секретні значення, імена хостів або необроблені id сесій. Установіть `diagnostics.enabled: false`, щоб повністю вимкнути записувач.
- Під час фатальних завершень Gateway, timeout під час вимкнення та збоїв запуску після перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо записувач має події. Перегляньте найновіший bundle через `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу bundle.

### `gateway diagnostics export`

Записати локальний zip із діагностикою, призначений для додавання до bug report.
Модель конфіденційності та вміст bundle див. у [Diagnostics Export](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Параметри:

- `--output <path>`: шлях до вихідного zip. Типово — експорт підтримки в каталозі стану.
- `--log-lines <count>`: максимальна кількість санітизованих рядків журналу для включення (типово `5000`).
- `--log-bytes <bytes>`: максимальна кількість байтів журналу для аналізу (типово `1000000`).
- `--url <url>`: URL WebSocket Gateway для знімка health.
- `--token <token>`: токен Gateway для знімка health.
- `--password <password>`: пароль Gateway для знімка health.
- `--timeout <ms>`: timeout знімка status/health (типово `3000`).
- `--no-stability-bundle`: пропустити пошук збереженого bundle стабільності.
- `--json`: вивести записаний шлях, розмір і manifest як JSON.

Експорт містить manifest, зведення у Markdown, форму config, санітизовані відомості config, санітизовані зведення журналів, санітизовані знімки status/health Gateway та найновіший bundle стабільності, якщо він існує.

Він призначений для поширення. Він зберігає операційні відомості, що допомагають налагодженню, такі як безпечні поля журналів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, id plugin, id provider, несекретні налаштування функцій і відредаговані операційні повідомлення журналу. Він пропускає або редагує текст чатів, тіла webhook, виводи інструментів, credentials, cookie, ідентифікатори облікових записів/повідомлень, текст prompt/інструкцій, імена хостів і секретні значення. Коли повідомлення у стилі LogTape виглядає як текст payload користувача/чату/інструмента, експорт зберігає лише факт пропуску повідомлення та кількість його байтів.

### `gateway status`

`gateway status` показує сервіс Gateway (launchd/systemd/schtasks) плюс необов’язкову probe перевірки підключення/можливостей автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Параметри:

- `--url <url>`: додати явну ціль probe. Налаштовані remote + localhost усе одно перевіряються.
- `--token <token>`: автентифікація токеном для probe.
- `--password <password>`: автентифікація паролем для probe.
- `--timeout <ms>`: timeout probe (типово `10000`).
- `--no-probe`: пропустити перевірку підключення (лише перегляд сервісу).
- `--deep`: також сканувати сервіси системного рівня.
- `--require-rpc`: підвищити типову probe перевірку підключення до probe читання та завершитися з ненульовим кодом, якщо ця probe читання завершується помилкою. Не можна поєднувати з `--no-probe`.

Примітки:

- `gateway status` залишається доступною для діагностики, навіть коли локальна config CLI відсутня або невалідна.
- Типова `gateway status` підтверджує стан сервісу, WebSocket connect і можливість автентифікації, видиму під час handshake. Вона не підтверджує операції читання/запису/адміністрування.
- `gateway status` за можливості розв’язує налаштовані SecretRef автентифікації для probe-автентифікації.
- Якщо потрібний SecretRef автентифікації не розв’язується в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли перевірка підключення/автентифікації RPC завершується помилкою; явно передайте `--token`/`--password` або спочатку розв’яжіть джерело секрету.
- Якщо probe проходить успішно, попередження про нерозв’язаний auth-ref приглушуються, щоб уникнути хибнопозитивних спрацювань.
- Використовуйте `--require-rpc` у скриптах і автоматизації, коли сервісу, що просто слухає, недостатньо і вам потрібно, щоб RPC-виклики зі scope читання теж були справні.
- `--deep` додає best-effort сканування додаткових установлень launchd/systemd/schtasks. Коли виявлено кілька сервісів, схожих на gateway, у виводі для людини друкуються підказки щодо очищення та попередження, що більшість налаштувань мають запускати один gateway на машину.
- Вивід для людини містить розв’язаний шлях до файла журналу плюс знімок шляхів/валідності config CLI-vs-service, щоб допомогти діагностувати дрейф профілю або state-dir.
- В установленнях Linux systemd перевірки дрейфу автентифікації сервісу читають і значення `Environment=`, і `EnvironmentFile=` з unit (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами `-`).
- Перевірки дрейфу розв’язують SecretRef у `gateway.auth.token` за допомогою об’єднаного середовища виконання (спочатку середовище команди сервісу, потім резервне середовище процесу).
- Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або mode не задано там, де може перемогти password і не може перемогти жоден кандидат токена), перевірки дрейфу токена пропускають розв’язання токена config.

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (local loopback) **навіть якщо налаштовано remote**.

Якщо ви передасте `--url`, ця явна ціль додається перед обома. Вивід для людини позначає
цілі як:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

Якщо доступні кілька gateway, вона виводить їх усі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість установлень усе ще запускають один gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Інтерпретація:

- `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket connect.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що probe змогла підтвердити щодо автентифікації. Це окремо від доступності.
- `Read probe: ok` означає, що RPC-виклики з деталями в scope читання (`health`/`status`/`system-presence`/`config.get`) також виконалися успішно.
- `Read probe: limited - missing scope: operator.read` означає, що connect успішний, але RPC зі scope читання обмежений. Це повідомляється як **погіршена** доступність, а не повна помилка.
- Код виходу ненульовий лише тоді, коли жодна перевірена ціль недоступна.

Примітки щодо JSON (`--json`):

- Верхній рівень:
  - `ok`: принаймні одна ціль доступна.
  - `degraded`: принаймні одна ціль мала RPC деталей, обмежений scope.
  - `capability`: найкраща можливість, виявлена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
  - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH tunnel, налаштований remote, потім local loopback.
  - `warnings[]`: записи попереджень best-effort з `code`, `message` і необов’язковими `targetIds`.
  - `network`: підказки URL local loopback/tailnet, виведені з поточної конфігурації та мережі хоста.
  - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет discovery/кількість результатів, використані для цього проходу probe.
- Для кожної цілі (`targets[].connect`):
  - `ok`: доступність після connect + класифікація degraded.
  - `rpcOk`: повний успіх detail RPC.
  - `scopeLimited`: detail RPC завершився помилкою через відсутній scope оператора.
- Для кожної цілі (`targets[].auth`):
  - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступно.
  - `scopes`: надані scope, повідомлені в `hello-ok`, коли доступно.
  - `capability`: класифікація можливості автентифікації, показана для цієї цілі.

Поширені коди попереджень:

- `ssh_tunnel_failed`: не вдалося налаштувати SSH tunnel; команда повернулася до прямих probe.
- `multiple_gateways`: було доступно більше ніж одну ціль; це нетипово, якщо тільки ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
- `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося розв’язати для цілі, що завершилася помилкою.
- `probe_scope_limited`: WebSocket connect успішний, але read-probe була обмежена через відсутність `operator.read`.

#### Remote через SSH (паритет із застосунком Mac)

Режим macOS-застосунку «Remote over SSH» використовує локальне перенаправлення порту, щоб віддалений gateway (який може бути прив’язаний лише до loopback) став доступним за адресою `ws://127.0.0.1:<port>`.

Еквівалент у CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Параметри:

- `--ssh <target>`: `user@host` або `user@host:port` (типовий порт — `22`).
- `--ssh-identity <path>`: файл ідентифікації.
- `--ssh-auto`: вибрати перший виявлений хост gateway як SSH-ціль із розв’язаного
  endpoint discovery (`local.` плюс налаштований wide-area domain, якщо є). Підказки
  лише TXT ігноруються.

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

- `--params <json>`: рядок JSON-об’єкта для params (типово `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Примітки:

- `--params` має бути валідним JSON.
- `--expect-final` головним чином призначений для RPC у стилі агента, які передають проміжні події потоком перед фінальним payload.

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
- Коли автентифікація токеном вимагає токен, а `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища сервісу.
- Якщо автентифікація токеном вимагає токен, а налаштований SecretRef токена не розв’язується, встановлення завершується в fail-closed режимі замість збереження резервного відкритого тексту.
- Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість inline `--password`.
- У режимі виведеної автентифікації лише оболонковий `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена для встановлення; використовуйте стійку конфігурацію (`gateway.auth.password` або config `env`) під час встановлення керованого сервісу.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення блокується, доки mode не буде явно вказано.
- Команди життєвого циклу приймають `--json` для скриптів.

## Виявлення gateway (Bonjour)

`gateway discover` сканує beacons Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (наприклад, `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [/gateway/bonjour](/uk/gateway/bonjour)

Лише gateway з увімкненим Bonjour discovery (типово увімкнено) оголошують beacon.

Записи Wide-Area discovery включають (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти типово використовують `22` для SSH-цілей, якщо його немає)
- `tailnetDns` (ім’я хоста MagicDNS, коли доступно)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + fingerprint сертифіката)
- `cliPath` (підказка віддаленого встановлення, записана в wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

Параметри:

- `--timeout <ms>`: timeout для кожної команди (browse/resolve); типово `2000`.
- `--json`: вивід для машинного читання (також вимикає стилізацію/spinner).

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Примітки:

- CLI сканує `local.` плюс налаштований wide-area domain, якщо він увімкнений.
- `wsUrl` у виводі JSON виводиться з розв’язаного endpoint сервісу, а не з підказок
  лише TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS `sshPort` і `cliPath` транслюються лише тоді, коли
  `discovery.mdns.mode` має значення `full`. Wide-area DNS-SD усе одно записує `cliPath`; `sshPort`
  і там теж залишається необов’язковим.
