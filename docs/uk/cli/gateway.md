---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язування та підключення
    - Виявлення Gateway через Bonjour (локальний + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запускайте, запитуйте й виявляйте Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-05T08:04:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, хуки). Підкоманди на цій сторінці розташовані під `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + глобального DNS-SD.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw оголошує про шлюзи й знаходить їх.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration">
    Ключі конфігурації gateway верхнього рівня.
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
  <Accordion title="Поведінка запуску">
    - За замовчуванням Gateway відмовляється запускатися, якщо `gateway.mode=local` не задано в `~/.openclaw/openclaw.json`. Використовуйте `--allow-unconfigured` для разових/dev-запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією й виправте її, замість неявного припущення локального режиму.
    - Якщо файл існує, але `gateway.mode` відсутній, Gateway розцінює це як підозріле пошкодження конфігурації та відмовляється "вгадувати local" за вас.
    - Прив’язка поза loopback без автентифікації блокується (захисне обмеження).
    - `SIGUSR1` запускає перезапуск у межах процесу, коли це дозволено (`commands.restart` увімкнено за замовчуванням; задайте `commands.restart: false`, щоб заблокувати ручний перезапуск, водночас застосування/оновлення через інструмент/config gateway залишаються дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден кастомний стан термінала. Якщо ви обгортаєте CLI за допомогою TUI або введення в raw-mode, відновіть термінал перед виходом.

  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (значення за замовчуванням береться з config/env; зазвичай `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим прив’язки слухача.
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
  Прочитати пароль gateway з файлу.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Відкрити доступ до Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скинути конфігурацію Tailscale serve/funnel під час завершення.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить захист запуску лише для разового/dev bootstrap; не записує й не виправляє файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev config + робочий простір, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути dev config + облікові дані + сесії + робочий простір (потребує `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Завершити будь-який наявний слухач на вибраному порту перед запуском.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Докладні журнали.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показувати в консолі лише журнали backend CLI (і ввімкнути stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Стиль журналу WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Псевдонім для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Записувати сирі події потоку моделі в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях до jsonl сирого потоку.
</ParamField>

## Перезапуск Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` просить запущений Gateway виконати попередню перевірку активної роботи OpenClaw перед перезапуском. Якщо активні операції в черзі, доставлення відповідей, вбудовані запуски або запуски завдань, Gateway повідомляє про блокувальники, об’єднує дубльовані запити безпечного перезапуску й перезапускається після завершення активної роботи. Звичайний `restart` зберігає наявну поведінку менеджера сервісів для сумісності. Використовуйте `--force` лише тоді, коли явно хочете негайний шлях примусового перевизначення.

<Warning>
Вбудований `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання запуску

- Задайте `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб записувати в журнал таймінги фаз під час запуску Gateway, включно із затримкою `eventLoopMax` для кожної фази та таймінгами таблиць пошуку plugin для installed-index, реєстру manifest, планування запуску й роботи owner-map.
- Задайте `OPENCLAW_DIAGNOSTICS=timeline` із `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, щоб записати best-effort JSONL timeline діагностики запуску для зовнішніх QA harnesses. Також можна ввімкнути прапорець через `diagnostics.flags: ["timeline"]` у конфігурації; шлях все одно надається через env. Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити вибірки event-loop.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти швидкодію запуску Gateway. Бенчмарк записує перший вивід процесу, `/healthz`, `/readyz`, таймінги трасування запуску, затримку event-loop і подробиці таймінгів таблиць пошуку plugin.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: зручно для читання людиною (кольорове в TTY).
    - `--json`: машинозчитуваний JSON (без стилізації/spinner).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігаючи людське компонування.

  </Tab>
  <Tab title="Спільні параметри">
    - `--url <url>`: WebSocket URL Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: тайм-аут/бюджет (залежить від команди).
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

HTTP endpoint `/healthz` — це liveness probe: він повертає відповідь, щойно сервер може відповідати через HTTP. HTTP endpoint `/readyz` суворіший і залишається червоним, поки startup plugin sidecars, канали або налаштовані хуки ще стабілізуються. Локальні або автентифіковані докладні відповіді готовності містять діагностичний блок `eventLoop` із затримкою event-loop, використанням event-loop, співвідношенням CPU core та прапорцем `degraded`.

### `gateway usage-cost`

Отримати зведення вартості використання з журналів сесій.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Кількість днів для включення.
</ParamField>

### `gateway stability`

Отримати останній diagnostic stability recorder із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальна кількість останніх подій для включення (макс. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фільтрувати за типом діагностичної події, наприклад `payload.large` або `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включати лише події після номера діагностичної послідовності.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Прочитати збережений stability bundle замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого bundle у каталозі стану або передайте шлях до JSON bundle напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати придатний для поширення zip із діагностикою підтримки замість друку подробиць стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфіденційність і поведінка bundle">
    - Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/plugin і заредаговані зведення сесій. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookie, секретні значення, імена хостів або сирі id сесій. Задайте `diagnostics.enabled: false`, щоб повністю вимкнути recorder.
    - Під час фатальних завершень Gateway, тайм-аутів завершення й помилок запуску після перезапуску OpenClaw записує той самий діагностичний snapshot у `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли recorder має події. Перегляньте найновіший bundle за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip із діагностикою, призначений для додавання до звітів про помилки. Модель конфіденційності та вміст bundle описано в [Експорт діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до zip виводу. За замовчуванням — support export у каталозі стану.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальна кількість очищених рядків журналу для включення.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальна кількість байтів журналу для перевірки.
</ParamField>
<ParamField path="--url <url>" type="string">
  WebSocket URL Gateway для snapshot стану здоров’я.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для snapshot стану здоров’я.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для snapshot стану здоров’я.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Тайм-аут snapshot статусу/стану здоров’я.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого stability bundle.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати записаний шлях, розмір і manifest як JSON.
</ParamField>

Експорт містить manifest, Markdown-зведення, форму конфігурації, очищені подробиці конфігурації, очищені зведення журналів, очищені snapshot статусу/стану здоров’я Gateway і найновіший stability bundle, якщо він існує.

Він призначений для поширення. Він зберігає операційні подробиці, які допомагають із налагодженням, наприклад безпечні поля журналу OpenClaw, назви підсистем, коди статусу, тривалості, налаштовані режими, порти, id plugin, id провайдерів, несекретні налаштування функцій і заредаговані операційні повідомлення журналу. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookie, ідентифікатори акаунтів/повідомлень, текст prompt/інструкцій, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст payload користувача/чату/інструмента, експорт зберігає лише факт, що повідомлення було пропущено, а також його кількість байтів.

### `gateway status`

`gateway status` показує сервіс Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливості підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додайте явну ціль перевірки. Налаштований віддалений хост + localhost усе одно перевіряються.
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
  Пропустити перевірку підключення (перегляд лише сервісу).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати сервіси системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до перевірки читання та завершуватися з ненульовим кодом, коли ця перевірка читання не вдається. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статусу">
    - `gateway status` залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Типова команда `gateway status` підтверджує стан сервісу, WebSocket-підключення та можливість автентифікації, видиму під час handshake. Вона не підтверджує операції читання/запису/адміністрування.
    - Діагностичні перевірки не вносять змін для автентифікації пристрою вперше: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність CLI-пристрою чи запис read-only сполучення пристрою лише для перевірки статусу.
    - `gateway status` за можливості розв’язує налаштовані auth SecretRefs для автентифікації перевірки.
    - Якщо обов’язковий auth SecretRef не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація перевірки не вдається; передайте `--token`/`--password` явно або спершу розв’яжіть джерело секрету.
    - Якщо перевірка успішна, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибних спрацювань.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли сервіс, що прослуховує порт, недостатній і потрібно, щоб RPC-виклики з областю читання також були справними.
    - `--deep` додає best-effort сканування додаткових установок launchd/systemd/schtasks. Коли виявлено кілька gateway-подібних сервісів, вивід для людини друкує підказки з очищення та попереджає, що більшість налаштувань мають запускати один gateway на машину.
    - `--deep` також повідомляє про нещодавню передачу перезапуску супервізора Gateway, коли процес сервісу коректно завершився для перезапуску зовнішнім супервізором.
    - Вивід для людини містить розв’язаний шлях до файлового журналу, а також знімок шляхів/чинності конфігурації CLI проти сервісу, щоб допомогти діагностувати розбіжність профілю або state-dir.

  </Accordion>
  <Accordion title="Перевірки auth-drift для Linux systemd">
    - В установках Linux systemd перевірки розбіжності автентифікації сервісу читають значення `Environment=` і `EnvironmentFile=` з unit (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами з `-`).
    - Перевірки розбіжності розв’язують `gateway.auth.token` SecretRefs за допомогою об’єднаного runtime env (спершу env команди сервісу, потім fallback до process env).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не задано, де пароль може перемогти й жоден кандидат токена не може перемогти), перевірки token-drift пропускають розв’язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «debug everything». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (loopback) **навіть якщо віддалений gateway налаштовано**.

Якщо передати `--url`, ця явна ціль додається перед обома. Вивід для людини позначає цілі так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька gateway, команда друкує їх усі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість установок усе одно запускає один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-підключення.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що перевірка змогла підтвердити щодо автентифікації. Це окремо від доступності.
    - `Read probe: ok` означає, що RPC-виклики деталей з областю читання (`health`/`status`/`system-presence`/`config.get`) також успішні.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC з областю читання обмежене. Це повідомляється як **погіршена** доступність, а не повна відмова.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв WebSocket-з’єднання, але подальша діагностика читання завершилася тайм-аутом або помилкою. Це також **погіршена** доступність, а не недоступний Gateway.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює першу ідентичність пристрою чи стан сполучення.
    - Код виходу ненульовий лише тоді, коли жодна перевірена ціль недоступна.

  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль прийняла підключення, але не завершила повну детальну RPC-діагностику.
    - `capability`: найкраща можливість, побачена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштований віддалений хост, потім local loopback.
    - `warnings[]`: best-effort записи попереджень із `code`, `message` та необов’язковими `targetIds`.
    - `network`: підказки URL для local loopback/tailnet, отримані з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів виявлення, використані для цього проходу перевірки.

    Для кожної цілі (`targets[].connect`):

    - `ok`: доступність після connect + degraded класифікації.
    - `rpcOk`: успішне повне RPC деталей.
    - `scopeLimited`: RPC деталей не вдалося через відсутню область оператора.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступна.
    - `scopes`: надані області, повідомлені в `hello-ok`, коли доступні.
    - `capability`: показана класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: налаштування SSH-тунелю не вдалося; команда повернулася до прямих перевірок.
    - `multiple_gateways`: доступна більше ніж одна ціль; це незвично, якщо ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
    - `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося розв’язати для цілі з помилкою.
    - `probe_scope_limited`: WebSocket-підключення успішне, але перевірка читання обмежена через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалений доступ через SSH (паритет із Mac app)

Режим "Remote over SSH" у macOS app використовує локальне перенаправлення порту, щоб віддалений gateway (який може бути прив’язаний лише до loopback) став доступним за адресою `ws://127.0.0.1:<port>`.

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
  Вибрати перший виявлений хост gateway як SSH-ціль із розв’язаного endpoint виявлення (`local.` плюс налаштований wide-area domain, якщо є). Підказки лише TXT ігноруються.
</ParamField>

Конфігурація (необов’язкова, використовується як значення за замовчуванням):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий RPC-помічник.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Рядок JSON-об’єкта для params.
</ParamField>
<ParamField path="--url <url>" type="string">
  WebSocket URL Gateway.
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
  Переважно для agent-style RPC, які транслюють проміжні події перед фінальним payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний JSON-вивід.
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

Використовуйте `--wrapper`, коли керований сервіс має запускатися через інший виконуваний файл, наприклад shim менеджера секретів або run-as helper. Wrapper отримує звичайні аргументи Gateway і відповідає за те, щоб зрештою виконати `openclaw` або Node із цими аргументами.

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

Ви також можете задати wrapper через середовище. `gateway install` перевіряє, що шлях є виконуваним файлом, записує wrapper у service `ProgramArguments` і зберігає `OPENCLAW_WRAPPER` у середовищі сервісу для подальших примусових перевстановлень, оновлень і виправлень doctor.

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
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Поведінка життєвого циклу">
    - Використовуйте `gateway restart`, щоб перезапустити керований сервіс. Не поєднуйте `gateway stop` і `gateway start` як заміну перезапуску; на macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.
    - `gateway restart --safe` просить запущений Gateway попередньо перевірити активну роботу OpenClaw і відкласти перезапуск, доки доставка відповідей, embedded runs і task runs не завершаться. `--safe` не можна поєднувати з `--force` або `--wait`.
    - `gateway restart --wait 30s` перевизначає налаштований бюджет drain для цього перезапуску. Числа без одиниць — мілісекунди; приймаються одиниці на кшталт `s`, `m` і `h`. `--wait 0` очікує безстроково.
    - `gateway restart --force` пропускає drain активної роботи та перезапускає негайно. Використовуйте це, коли оператор уже перевірив перелічені блокувальники завдань і хоче повернути gateway зараз.
    - Команди життєвого циклу приймають `--json` для скриптів.

  </Accordion>
  <Accordion title="Автентифікація і SecretRefs під час установлення">
    - Коли автентифікація за токеном вимагає токен і `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища сервісу.
    - Якщо автентифікація за токеном вимагає токен, а налаштований SecretRef токена не розв’язано, установлення завершується закритою відмовою замість збереження резервного відкритого тексту.
    - Для автентифікації паролем у `gateway run` віддавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
    - У виведеному режимі автентифікації лише оболонковий `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час установлення; використовуйте тривалу конфігурацію (`gateway.auth.password` або `env` конфігурації) під час установлення керованого сервісу.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки режим не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення gateway (Bonjour)

`gateway discover` сканує beacons Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише gateway, для яких увімкнено виявлення Bonjour (типово), рекламують beacon.

Записи Wide-Area discovery містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, напр. `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти типово використовують `22` для SSH-цілей, коли його немає)
- `tailnetDns` (ім’я хоста MagicDNS, коли доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленого встановлення, записана в wide-area зону)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для команди (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний вивід (також вимикає стилізацію/індикатор виконання).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований wide-area домен, коли його ввімкнено.
- `wsUrl` у JSON-виводі походить від розв’язаного endpoint сервісу, а не від підказок лише з TXT, як-от `lanHost` або `tailnetDns`.
- У `local.` mDNS, `sshPort` і `cliPath` транслюються лише коли `discovery.mdns.mode` дорівнює `full`. Wide-area DNS-SD все одно записує `cliPath`; `sshPort` там також лишається необов’язковим.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
