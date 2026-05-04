---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язування та підключення
    - Виявлення Gateway через Bonjour (локальний + широкозонний DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запускайте, опитуйте та виявляйте екземпляри Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-04T18:03:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 310867c59148577f2e8ce6f708da6bce936e09243ce7fbe5daeb453c6b3b370d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сеанси, хуки). Підкоманди на цій сторінці розміщені в `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + wide-area DNS-SD.
  </Card>
  <Card title="Discovery overview" href="/uk/gateway/discovery">
    Як OpenClaw оголошує та знаходить Gateway.
  </Card>
  <Card title="Configuration" href="/uk/gateway/configuration">
    Ключі конфігурації Gateway верхнього рівня.
  </Card>
</CardGroup>

## Запуск Gateway

Запустіть локальний процес Gateway:

```bash
openclaw gateway
```

Псевдонім для запуску на передньому плані:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не задано `gateway.mode=local`. Використовуйте `--allow-unconfigured` для ситуативних/dev запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та виправте її, а не припускайте локальний режим неявно.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється "вгадувати local" за вас.
    - Прив'язування за межами loopback без автентифікації заблоковано (захисне обмеження).
    - `SIGUSR1` запускає перезапуск у межах процесу, коли це дозволено (`commands.restart` увімкнено за замовчуванням; установіть `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як застосування/оновлення через інструменти/конфігурацію Gateway залишаються дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес Gateway, але вони не відновлюють жодний власний стан термінала. Якщо ви обгортаєте CLI за допомогою TUI або введення в raw-mode, відновіть термінал перед виходом.

  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (значення за замовчуванням береться з конфігурації/env; зазвичай `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим прив'язування слухача.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Перевизначення режиму автентифікації.
</ParamField>
<ParamField path="--token <token>" type="string">
  Перевизначення токена (також задає `OPENCLAW_GATEWAY_TOKEN` для процесу).
</ParamField>
<ParamField path="--password <password>" type="string">
  Перевизначення пароля.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Зчитати пароль Gateway з файлу.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Відкрити доступ до Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скинути конфігурацію Tailscale serve/funnel під час завершення роботи.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск Gateway без `gateway.mode=local` у конфігурації. Обходить захисну перевірку запуску лише для ситуативного/dev bootstrap; не записує й не виправляє файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + робочу область, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути dev-конфігурацію + облікові дані + сеанси + робочу область (потребує `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Завершити будь-який наявний слухач на вибраному порту перед запуском.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Докладні журнали.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показувати в консолі лише журнали бекенда CLI (і ввімкнути stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Стиль журналу WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Псевдонім для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Записувати необроблені події потоку моделі в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях до jsonl необробленого потоку.
</ParamField>

## Перезапуск Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` просить запущений Gateway попередньо перевірити активну роботу OpenClaw перед перезапуском. Якщо активні операції в черзі, доставлення відповідей, вбудовані запуски або виконання завдань, Gateway повідомляє про блокувальники, об'єднує дублікати запитів безпечного перезапуску та перезапускається, коли активна робота завершується. Звичайний `restart` зберігає наявну поведінку менеджера служби для сумісності. Використовуйте `--force` лише тоді, коли явно потрібен шлях негайного перевизначення.

<Warning>
Вбудований `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання запуску

- Задайте `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати тривалість фаз під час запуску Gateway, включно із затримкою `eventLoopMax` для кожної фази та таймінгами lookup-таблиць Plugin для installed-index, manifest registry, планування запуску й роботи owner-map.
- Задайте `OPENCLAW_DIAGNOSTICS=timeline` з `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, щоб записати best-effort JSONL timeline діагностики запуску для зовнішніх QA harnesses. Також можна ввімкнути прапорець через `diagnostics.flags: ["timeline"]` у конфігурації; шлях усе одно надається через env. Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити вибірки event-loop.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виконати бенчмарк запуску Gateway. Бенчмарк записує перший вивід процесу, `/healthz`, `/readyz`, таймінги трасування запуску, затримку event-loop і деталі таймінгів lookup-таблиць Plugin.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - За замовчуванням: зручно для читання людиною (кольорово в TTY).
    - `--json`: машинозчитуваний JSON (без стилізації/spinner).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігаючи людський макет.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: WebSocket URL Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: таймаут/бюджет (залежить від команди).
    - `--expect-final`: чекати на "final" відповідь (виклики агента).

  </Tab>
</Tabs>

<Note>
Коли ви задаєте `--url`, CLI не повертається до облікових даних із конфігурації або середовища. Передайте `--token` або `--password` явно. Відсутність явних облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP endpoint `/healthz` — це liveness probe: він повертає відповідь, щойно сервер може відповідати через HTTP. HTTP endpoint `/readyz` суворіший і лишається червоним, поки startup Plugin sidecars, канали або налаштовані хуки ще стабілізуються. Локальні або автентифіковані докладні відповіді готовності містять діагностичний блок `eventLoop` із затримкою event-loop, utilization event-loop, співвідношенням ядер CPU та прапорцем `degraded`.

### `gateway usage-cost`

Отримати зведення usage-cost із журналів сеансів.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Кількість днів для включення.
</ParamField>

### `gateway stability`

Отримати нещодавній реєстратор діагностичної стабільності із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальна кількість нещодавніх подій для включення (максимум `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фільтрувати за типом діагностичної події, наприклад `payload.large` або `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включати лише події після номера діагностичної послідовності.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Зчитати збережений bundle стабільності замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого bundle у каталозі стану, або передайте шлях до JSON bundle напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати zip діагностики підтримки, придатний для поширення, замість друку деталей стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Записи зберігають операційні метадані: назви подій, кількості, розміри в байтах, показники пам'яті, стан черг/сеансів, назви каналів/Plugin і відредаговані зведення сеансів. Вони не зберігають текст чату, тіла webhook, виводи інструментів, необроблені тіла запитів або відповідей, токени, cookies, секретні значення, імена хостів або необроблені ідентифікатори сеансів. Установіть `diagnostics.enabled: false`, щоб повністю вимкнути реєстратор.
    - Під час фатальних завершень Gateway, таймаутів завершення роботи та збоїв startup restart OpenClaw записує той самий діагностичний snapshot у `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли реєстратор має події. Перегляньте найновіший bundle за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip діагностики, призначений для додавання до звітів про помилки. Щоб дізнатися про модель приватності та вміст bundle, див. [Diagnostics Export](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до zip виводу. За замовчуванням це support export у каталозі стану.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальна кількість санітизованих рядків журналу для включення.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальна кількість байтів журналу для перевірки.
</ParamField>
<ParamField path="--url <url>" type="string">
  WebSocket URL Gateway для snapshot здоров'я.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для snapshot здоров'я.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для snapshot здоров'я.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Таймаут snapshot статусу/здоров'я.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого bundle стабільності.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати записаний шлях, розмір і маніфест як JSON.
</ParamField>

Експорт містить маніфест, Markdown-зведення, форму конфігурації, санітизовані деталі конфігурації, санітизовані зведення журналів, санітизовані snapshots статусу/здоров'я Gateway і найновіший bundle стабільності, якщо він існує.

Його призначено для поширення. Він зберігає операційні деталі, які допомагають налагодженню, як-от безпечні поля журналів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, ідентифікатори Plugin, ідентифікатори провайдерів, несекретні налаштування функцій і відредаговані операційні повідомлення журналів. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookies, ідентифікатори акаунтів/повідомлень, текст prompt/instruction, імена хостів і секретні значення. Коли повідомлення в стилі LogTape схоже на текст корисного навантаження користувача/чату/інструмента, експорт зберігає лише факт, що повідомлення було пропущено, разом із його кількістю байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks), а також необов'язкову перевірку можливостей підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль перевірки. Налаштовані віддалена ціль і localhost усе одно перевіряються.
</ParamField>
<ParamField path="--token <token>" type="string">
  Автентифікація токеном для перевірки.
</ParamField>
<ParamField path="--password <password>" type="string">
  Автентифікація паролем для перевірки.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Тайм-аут перевірки.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Пропустити перевірку підключення (подання лише сервісу).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати сервіси системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до перевірки читання та завершити роботу з ненульовим кодом, якщо ця перевірка читання не вдасться. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статусу">
    - `gateway status` залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Стандартна `gateway status` підтверджує стан сервісу, підключення WebSocket і можливість автентифікації, видиму під час рукостискання. Вона не підтверджує операції читання/запису/адміністрування.
    - Діагностичні перевірки не вносять змін для первинної автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис сполучення пристрою лише для читання тільки для перевірки статусу.
    - `gateway status` за можливості розв’язує налаштовані auth SecretRefs для автентифікації перевірки.
    - Якщо обов’язковий auth SecretRef не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація перевірки не вдається; явно передайте `--token`/`--password` або спочатку розв’яжіть джерело секрету.
    - Якщо перевірка успішна, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибних спрацювань.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли сервісу, що прослуховує, недостатньо і потрібна справність RPC-викликів із областю читання.
    - `--deep` додає best-effort сканування додаткових встановлень launchd/systemd/schtasks. Коли виявлено кілька сервісів, схожих на Gateway, вивід для людини друкує підказки з очищення та попереджає, що більшість налаштувань мають запускати один gateway на машину.
    - Вивід для людини містить розв’язаний шлях до файлового журналу, а також знімок шляхів/дійсності конфігурацій CLI та сервісу, щоб допомогти діагностувати зміщення профілю або state-dir.

  </Accordion>
  <Accordion title="Перевірки розходження автентифікації Linux systemd">
    - У встановленнях Linux systemd перевірки розходження автентифікації сервісу читають значення `Environment=` і `EnvironmentFile=` з unit (включно з `%h`, шляхами в лапках, кількома файлами й необов’язковими файлами з `-`).
    - Перевірки розходження розв’язують SecretRefs `gateway.auth.token` за допомогою об’єднаного runtime env (спочатку env команди сервісу, потім fallback до env процесу).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy` або mode не задано, коли password може перемогти й жоден кандидат токена не може перемогти), перевірки розходження токена пропускають розв’язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (loopback) **навіть якщо налаштовано віддалений**.

Якщо передати `--url`, ця явна ціль додається перед обома. Вивід для людини позначає цілі як:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька gateways, вона друкує їх усі. Кілька gateways підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість встановлень усе одно запускають один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла підключення WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що перевірка змогла підтвердити щодо автентифікації. Це окремо від доступності.
    - `Read probe: ok` означає, що RPC-виклики деталей з областю читання (`health`/`status`/`system-presence`/`config.get`) також успішні.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC з областю читання обмежений. Це повідомляється як **погіршена** доступність, а не повна помилка.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв WebSocket-з’єднання, але подальша діагностика читання перевищила час очікування або не вдалася. Це також **погіршена** доступність, а не недоступний Gateway.
    - Як і `gateway status`, перевірка повторно використовує наявну кешовану автентифікацію пристрою, але не створює первинну ідентичність пристрою або стан сполучення.
    - Код виходу ненульовий лише тоді, коли жодна перевірена ціль недоступна.

  </Accordion>
  <Accordion title="JSON-вивід">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль прийняла підключення, але не завершила повну RPC-діагностику деталей.
    - `capability`: найкраща можливість, побачена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштована віддалена ціль, потім local loopback.
    - `warnings[]`: best-effort записи попереджень із `code`, `message` і необов’язковими `targetIds`.
    - `network`: підказки URL local loopback/tailnet, отримані з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет виявлення/кількість результатів, використані для цього проходу перевірки.

    Для кожної цілі (`targets[].connect`):

    - `ok`: доступність після підключення + класифікація погіршення.
    - `rpcOk`: повний успіх RPC деталей.
    - `scopeLimited`: RPC деталей не вдалося через відсутню область operator.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступна.
    - `scopes`: надані області, повідомлені в `hello-ok`, коли доступні.
    - `capability`: показана класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: налаштування SSH-тунелю не вдалося; команда повернулася до прямих перевірок.
    - `multiple_gateways`: було доступно більше ніж одну ціль; це незвично, якщо ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
    - `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося розв’язати для невдалої цілі.
    - `probe_scope_limited`: підключення WebSocket успішне, але перевірку читання обмежено через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалено через SSH (паритет Mac app)

Режим macOS app "Remote over SSH" використовує локальне перенаправлення порту, тому віддалений gateway (який може бути прив’язаний лише до loopback) стає доступним за `ws://127.0.0.1:<port>`.

Еквівалент CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` або `user@host:port` (порт за замовчуванням `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Файл ідентичності.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Вибрати перший виявлений хост gateway як ціль SSH з розв’язаного endpoint виявлення (`local.` плюс налаштований wide-area domain, якщо є). Підказки лише TXT ігноруються.
</ParamField>

Конфігурація (необов’язкова, використовується як значення за замовчуванням):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий допоміжний засіб RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Рядок JSON-об’єкта для params.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Бюджет тайм-ауту.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Переважно для RPC в стилі agent, які транслюють проміжні події перед фінальним payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний JSON-вивід.
</ParamField>

<Note>
`--params` має бути дійсним JSON.
</Note>

## Керування сервісом Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Установлення з wrapper

Використовуйте `--wrapper`, коли керований сервіс має запускатися через інший виконуваний файл, наприклад shim менеджера секретів або helper запуску від іншого користувача. Wrapper отримує звичайні аргументи Gateway і відповідає за те, щоб зрештою виконати `openclaw` або Node із цими аргументами.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Також можна задати wrapper через середовище. `gateway install` перевіряє, що шлях є виконуваним файлом, записує wrapper у service `ProgramArguments` і зберігає `OPENCLAW_WRAPPER` у середовищі сервісу для подальших примусових перевстановлень, оновлень і виправлень doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Щоб видалити збережений wrapper, очистьте `OPENCLAW_WRAPPER` під час перевстановлення:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Параметри команд">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Поведінка життєвого циклу">
    - Використовуйте `gateway restart`, щоб перезапустити керований сервіс. Не зв’язуйте `gateway stop` і `gateway start` як заміну перезапуску; на macOS `gateway stop` навмисно вимикає LaunchAgent перед зупинкою.
    - `gateway restart --wait 30s` перевизначає налаштований бюджет drain перезапуску для цього перезапуску. Числа без одиниць — це мілісекунди; приймаються одиниці на кшталт `s`, `m` і `h`. `--wait 0` чекає безстроково.
    - `gateway restart --force` пропускає drain активної роботи й перезапускає негайно. Використовуйте це, коли оператор уже перевірив перелічені блокувальники завдань і хоче повернути gateway зараз.
    - Команди життєвого циклу приймають `--json` для скриптів.

  </Accordion>
  <Accordion title="Автентифікація та SecretRefs під час установлення">
    - Коли автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у metadata середовища сервісу.
    - Якщо автентифікація токеном потребує токена, а налаштований token SecretRef не розв’язано, установлення закривається помилкою замість збереження fallback plaintext.
    - Для автентифікації паролем у `gateway run` віддавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на базі SecretRef замість inline `--password`.
    - В режимі inferred auth лише shell `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час установлення; використовуйте durable config (`gateway.auth.password` або config `env`) під час установлення керованого сервісу.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки mode не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення gateways (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Багатоадресний DNS-SD: `local.`
- Одноадресний DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише Gateway з увімкненим виявленням Bonjour (за замовчуванням) оголошують маяк.

Записи виявлення Wide-Area містять (TXT):

- `role` (підказка ролі Gateway)
- `transport` (підказка транспорту, напр. `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти за замовчуванням використовують SSH-цілі на `22`, коли його немає)
- `tailnetDns` (ім’я хоста MagicDNS, якщо доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленого встановлення, записана в зону Wide-Area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для команди (перегляд/розв’язання).
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний вивід (також вимикає стилізацію/індикатор завантаження).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований домен Wide-Area, коли його увімкнено.
- `wsUrl` у виводі JSON походить із розв’язаної кінцевої точки сервісу, а не з підказок лише TXT, як-от `lanHost` або `tailnetDns`.
- У mDNS `local.` `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` дорівнює `full`. Wide-Area DNS-SD усе одно записує `cliPath`; `sshPort` там теж залишається необов’язковим.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
