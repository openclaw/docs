---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення шлюзів через Bonjour (локальна мережа + wide-area DNS-SD)
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запуск, запит і виявлення шлюзів
title: Gateway
x-i18n:
    generated_at: "2026-04-25T22:08:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce8f72ad74fc2956520c1c3af2252a5b22b3bda0f2023c5ca76cf8cddb1c0edb
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, хуки).

Підкоманди на цій сторінці знаходяться в `openclaw gateway …`.

Пов’язані документи:

- [/gateway/bonjour](/uk/gateway/bonjour)
- [/gateway/discovery](/uk/gateway/discovery)
- [/gateway/configuration](/uk/gateway/configuration)

## Запуск Gateway

Запустіть локальний процес Gateway:

```bash
openclaw gateway
```

Псевдонім для запуску у передньому плані:

```bash
openclaw gateway run
```

Примітки:

- За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Для одноразових або dev-запусків використовуйте `--allow-unconfigured`.
- Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або затертою конфігурацією та виправте її, а не припускайте неявно локальний режим.
- Якщо файл існує, а `gateway.mode` відсутній, Gateway розцінює це як підозріле пошкодження конфігурації та відмовляється «вгадувати local» за вас.
- Прив’язка за межами loopback без автентифікації блокується (захисне обмеження).
- `SIGUSR1` запускає перезапуск у межах процесу за наявності дозволу (`commands.restart` увімкнено за замовчуванням; встановіть `commands.restart: false`, щоб заблокувати ручний перезапуск, водночас інструменти gateway tool/config apply/update залишаться дозволеними).
- Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жодний користувацький стан термінала. Якщо ви обгортаєте CLI у TUI або ввід у raw mode, відновіть термінал перед виходом.

### Параметри

- `--port <port>`: порт WebSocket (значення за замовчуванням береться з config/env; зазвичай `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: режим прив’язки слухача.
- `--auth <token|password>`: перевизначення режиму автентифікації.
- `--token <token>`: перевизначення токена (також встановлює `OPENCLAW_GATEWAY_TOKEN` для процесу).
- `--password <password>`: перевизначення пароля. Попередження: паролі, передані безпосередньо в команді, можуть бути видимі в локальних списках процесів.
- `--password-file <path>`: прочитати пароль gateway з файла.
- `--tailscale <off|serve|funnel>`: опублікувати Gateway через Tailscale.
- `--tailscale-reset-on-exit`: скинути конфігурацію Tailscale serve/funnel під час завершення роботи.
- `--allow-unconfigured`: дозволити запуск gateway без `gateway.mode=local` у конфігурації. Це обходить стартовий захист лише для одноразового/dev bootstrap; параметр не записує і не виправляє файл конфігурації.
- `--dev`: створити dev-конфігурацію й робочу область, якщо їх немає (пропускає BOOTSTRAP.md).
- `--reset`: скинути dev-конфігурацію + облікові дані + сесії + робочу область (потрібен `--dev`).
- `--force`: перед запуском завершити будь-який наявний слухач на вибраному порту.
- `--verbose`: докладні журнали.
- `--cli-backend-logs`: показувати в консолі лише журнали бекенда CLI (і ввімкнути stdout/stderr).
- `--ws-log <auto|full|compact>`: стиль журналу websocket (типово `auto`).
- `--compact`: псевдонім для `--ws-log compact`.
- `--raw-stream`: журналювати сирі події потоку моделі в jsonl.
- `--raw-stream-path <path>`: шлях до raw stream jsonl.

Профілювання запуску:

- Встановіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати тривалість фаз під час запуску Gateway.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти швидкодію запуску Gateway. Бенчмарк фіксує перший вивід процесу, `/healthz`, `/readyz` і таймінги трасування запуску.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

Режими виводу:

- Типово: людиночитаний формат (з кольором у TTY).
- `--json`: машиночитаний JSON (без стилізації/spinner).
- `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши людиночитане компонування.

Спільні параметри (де підтримуються):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: токен Gateway.
- `--password <password>`: пароль Gateway.
- `--timeout <ms>`: тайм-аут/бюджет (залежить від команди).
- `--expect-final`: чекати «final» відповіді (виклики агента).

Примітка: коли ви задаєте `--url`, CLI не використовує резервний перехід до облікових даних із config або середовища.
Передайте `--token` або `--password` явно. Відсутність явно заданих облікових даних — це помилка.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпойнт `/healthz` є перевіркою живучості: він повертає відповідь, щойно сервер може відповідати по HTTP. HTTP-ендпойнт `/readyz` суворіший і залишається червоним, поки допоміжні процеси запуску, канали або налаштовані хуки ще стабілізуються.

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

Отримати нещодавній діагностичний записувач стабільності із запущеного Gateway.

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
- `--bundle [path]`: читати збережений пакет стабільності замість звернення до запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану або передайте безпосередньо шлях до JSON-пакета.
- `--export`: записати zip-файл із діагностикою для підтримки, яким можна поділитися, замість виведення подробиць стабільності.
- `--output <path>`: шлях виводу для `--export`.

Примітки:

- Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/плагінів і відредаговані зведення сесій. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies, секретні значення, імена хостів або сирі id сесій. Встановіть `diagnostics.enabled: false`, щоб повністю вимкнути записувач.
- Під час фатальних завершень Gateway, тайм-аутів завершення роботи та збоїв запуску після перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо записувач має події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; параметри `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакета.

### `gateway diagnostics export`

Записати локальний zip-файл із діагностикою, призначений для прикріплення до звітів про помилки.
Модель конфіденційності та вміст пакета дивіться в [Diagnostics Export](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Параметри:

- `--output <path>`: шлях до вихідного zip-файла. Типово — експорт для підтримки в каталозі стану.
- `--log-lines <count>`: максимальна кількість санітизованих рядків журналу для включення (типово `5000`).
- `--log-bytes <bytes>`: максимальна кількість байтів журналу для перевірки (типово `1000000`).
- `--url <url>`: URL WebSocket Gateway для знімка health.
- `--token <token>`: токен Gateway для знімка health.
- `--password <password>`: пароль Gateway для знімка health.
- `--timeout <ms>`: тайм-аут знімка status/health (типово `3000`).
- `--no-stability-bundle`: пропустити пошук збереженого пакета стабільності.
- `--json`: вивести записаний шлях, розмір і маніфест у форматі JSON.

Експорт містить маніфест, підсумок у Markdown, форму конфігурації, санітизовані подробиці конфігурації, санітизовані зведення журналів, санітизовані знімки Gateway status/health і найновіший пакет стабільності, якщо він існує.

Він призначений для поширення. Він зберігає операційні деталі, корисні для налагодження, як-от безпечні поля журналів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, id плагінів, id провайдерів, несекретні параметри функцій і відредаговані операційні повідомлення журналу. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookies, ідентифікатори облікових записів/повідомлень, текст prompt/instruction, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст навантаження користувача/чату/інструмента, експорт зберігає лише факт пропуску повідомлення та кількість його байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливості підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Параметри:

- `--url <url>`: додати явну ціль перевірки. Налаштовані remote + localhost усе одно перевіряються.
- `--token <token>`: автентифікація токеном для перевірки.
- `--password <password>`: автентифікація паролем для перевірки.
- `--timeout <ms>`: тайм-аут перевірки (типово `10000`).
- `--no-probe`: пропустити перевірку підключення (лише перегляд служби).
- `--deep`: також сканувати служби на рівні системи.
- `--require-rpc`: підвищити стандартну перевірку підключення до перевірки читання та завершити з ненульовим кодом, якщо така перевірка читання не вдалася. Не можна поєднувати з `--no-probe`.

Примітки:

- `gateway status` залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
- Типовий `gateway status` підтверджує стан служби, підключення WebSocket і можливість автентифікації, видиму під час handshake. Він не підтверджує операції читання/запису/адміністрування.
- Діагностичні перевірки не змінюють стан під час первинної автентифікації пристрою: вони повторно використовують
  наявний кешований токен пристрою, якщо він існує, але не створюють нову
  ідентичність пристрою CLI або запис pairing read-only пристрою лише для перевірки стану.
- `gateway status` за можливості розв’язує налаштовані auth SecretRef для автентифікації перевірки.
- Якщо потрібний auth SecretRef не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли перевірка підключення/автентифікації не вдається; передайте `--token`/`--password` явно або спочатку розв’яжіть джерело секрету.
- Якщо перевірка успішна, попередження про нерозв’язані auth-ref приглушуються, щоб уникнути хибних спрацьовувань.
- Використовуйте `--require-rpc` у скриптах та автоматизації, коли недостатньо лише служби, що слухає, і потрібно, щоб RPC-виклики з областю читання також були справними.
- `--deep` додає best-effort-сканування для додаткових установок launchd/systemd/schtasks. Коли виявлено кілька служб, схожих на gateway, людиночитаний вивід друкує підказки для очищення та попереджає, що в більшості налаштувань має працювати один gateway на машину.
- Людиночитаний вивід містить розв’язаний шлях до файлового журналу, а також знімок шляхів/валідності конфігурації CLI порівняно зі службою, щоб допомогти діагностувати дрейф профілю або каталогу стану.
- У встановленнях Linux systemd перевірки дрейфу автентифікації служби читають як значення `Environment=`, так і `EnvironmentFile=` з unit-файла (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами з `-`).
- Перевірки дрейфу розв’язують SecretRef `gateway.auth.token`, використовуючи об’єднане runtime-середовище (спочатку env команди служби, потім резервно env процесу).
- Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не встановлено, коли може перемогти пароль і жоден кандидат токена не може перемогти), перевірки дрейфу токена пропускають розв’язання токена конфігурації.

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (loopback) **навіть якщо remote налаштовано**.

Якщо ви передасте `--url`, ця явна ціль буде додана перед обома. У людиночитаному виводі
цілі позначаються так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

Якщо доступні кілька gateway, команда виводить їх усі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але в більшості встановлень усе ж працює один gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Інтерпретація:

- `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-підключення.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що саме перевірка змогла підтвердити щодо автентифікації. Це окремо від досяжності.
- `Read probe: ok` означає, що RPC-виклики з деталями в області читання (`health`/`status`/`system-presence`/`config.get`) також успішні.
- `Read probe: limited - missing scope: operator.read` означає, що підключення вдалося, але RPC в області читання обмежений. Це повідомляється як **погіршена** досяжність, а не як повна невдача.
- Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не
  створює первинну ідентичність пристрою або стан pairing.
- Код виходу є ненульовим лише тоді, коли жодна перевірена ціль недосяжна.

Примітки щодо JSON (`--json`):

- Верхній рівень:
  - `ok`: принаймні одна ціль досяжна.
  - `degraded`: принаймні одна ціль мала RPC деталей з обмеженою областю.
  - `capability`: найкраща можливість, виявлена серед досяжних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
  - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем, у такому порядку: явний URL, SSH-тунель, налаштований remote, потім local loopback.
  - `warnings[]`: записи попереджень у режимі best-effort з `code`, `message` і необов’язковими `targetIds`.
  - `network`: підказки URL для local loopback/tailnet, виведені з поточної конфігурації та мережі хоста.
  - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет виявлення/кількість результатів, використані для цього проходу probe.
- Для кожної цілі (`targets[].connect`):
  - `ok`: досяжність після підключення + класифікація degraded.
  - `rpcOk`: повний успіх RPC деталей.
  - `scopeLimited`: RPC деталей не вдалося через відсутню область operator.
- Для кожної цілі (`targets[].auth`):
  - `role`: роль автентифікації, повідомлена в `hello-ok`, якщо доступна.
  - `scopes`: надані області, повідомлені в `hello-ok`, якщо доступні.
  - `capability`: класифікація можливостей автентифікації, показана для цієї цілі.

Поширені коди попереджень:

- `ssh_tunnel_failed`: не вдалося налаштувати SSH-тунель; команда повернулася до прямих перевірок.
- `multiple_gateways`: досяжною була більш ніж одна ціль; це незвично, якщо ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
- `auth_secretref_unresolved`: для цілі, що не пройшла перевірку, не вдалося розв’язати налаштований auth SecretRef.
- `probe_scope_limited`: WebSocket-підключення вдалося, але перевірка читання була обмежена через відсутність `operator.read`.

#### Remote через SSH (паритет із Mac app)

Режим “Remote over SSH” у macOS app використовує локальне перенаправлення порту, тож віддалений gateway (який може бути прив’язаний лише до loopback) стає досяжним за адресою `ws://127.0.0.1:<port>`.

Еквівалент у CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Параметри:

- `--ssh <target>`: `user@host` або `user@host:port` (порт за замовчуванням `22`).
- `--ssh-identity <path>`: файл ідентичності.
- `--ssh-auto`: вибрати перший виявлений хост gateway як SSH-ціль із розв’язаного
  endpoint виявлення (`local.` плюс налаштований wide-area domain, якщо є). Підказки
  лише з TXT ігноруються.

Конфігурація (необов’язково, використовується як значення за замовчуванням):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий допоміжний інструмент RPC.

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

- `--params` має бути коректним JSON.
- `--expect-final` здебільшого призначений для RPC у стилі агента, які транслюють проміжні події перед фінальним payload.

## Керування службою Gateway

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
- Коли автентифікація токеном потребує токена, а `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища служби.
- Якщо автентифікація токеном потребує токена, а налаштований token SecretRef не розв’язується, встановлення завершується в закритому режимі замість збереження резервного plaintext.
- Для автентифікації паролем у `gateway run` віддавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
- У режимі inferred auth лише shell-змінна `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час встановлення; використовуйте сталу конфігурацію (`gateway.auth.password` або config `env`) під час встановлення керованої служби.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення блокується, доки режим не буде задано явно.
- Команди життєвого циклу приймають `--json` для скриптів.

## Виявлення gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [/gateway/bonjour](/uk/gateway/bonjour)

Рекламують маяк лише ті gateway, для яких увімкнено виявлення Bonjour (типово так).

Записи Wide-Area discovery містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти за замовчуванням використовують для SSH-цілей `22`, якщо він відсутній)
- `tailnetDns` (ім’я хоста MagicDNS, якщо доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка remote-install, записана до wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

Параметри:

- `--timeout <ms>`: тайм-аут для команди (browse/resolve); типово `2000`.
- `--json`: машиночитаний вивід (також вимикає стилізацію/spinner).

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Примітки:

- CLI сканує `local.` плюс налаштований wide-area domain, якщо його увімкнено.
- `wsUrl` у виводі JSON виводиться з розв’язаного endpoint служби, а не з підказок
  лише TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS `sshPort` і `cliPath` транслюються лише коли
  `discovery.mdns.mode` має значення `full`. Wide-area DNS-SD усе одно записує `cliPath`; `sshPort`
  там також залишається необов’язковим.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
