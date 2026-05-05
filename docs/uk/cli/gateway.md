---
read_when:
    - Запуск Gateway із CLI (для розробки або серверів)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення Gateway через Bonjour (локальний + широкозонний DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запускайте, опитуйте та виявляйте екземпляри Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-05T00:49:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, хуки). Підкоманди на цій сторінці знаходяться в `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + широкозонного DNS-SD.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw оголошує та знаходить Gateway.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration">
    Ключі конфігурації gateway верхнього рівня.
  </Card>
</CardGroup>

## Запустіть Gateway

Запустіть локальний процес Gateway:

```bash
openclaw gateway
```

Псевдонім для запуску на передньому плані:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Поведінка під час запуску">
    - За замовчуванням Gateway відмовляється запускатися, якщо `gateway.mode=local` не задано в `~/.openclaw/openclaw.json`. Використовуйте `--allow-unconfigured` для разових/розробницьких запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` запишуть `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, розглядайте це як пошкоджену або перезаписану конфігурацію та відновіть її, замість неявно припускати локальний режим.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється "вгадувати local" за вас.
    - Прив’язування поза межами loopback без автентифікації заблоковано (захисне обмеження).
    - `SIGUSR1` запускає перезапуск усередині процесу, коли це авторизовано (`commands.restart` увімкнено за замовчуванням; задайте `commands.restart: false`, щоб заблокувати ручний перезапуск, водночас застосування/оновлення через інструмент і конфігурацію gateway лишаються дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жодний спеціальний стан термінала. Якщо ви обгортаєте CLI за допомогою TUI або введення в raw-mode, відновіть термінал перед виходом.

  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (значення за замовчуванням береться з конфігурації/env; зазвичай `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим прив’язування слухача.
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
  Зчитати пароль gateway з файла.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Надати доступ до Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скинути конфігурацію Tailscale serve/funnel під час завершення.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить захист запуску лише для разового/розробницького bootstrap; не записує й не відновлює файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + робочий простір, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути dev-конфігурацію + облікові дані + сесії + робочий простір (потребує `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Завершити будь-який наявний слухач на вибраному порту перед запуском.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Докладні логи.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показувати в консолі лише логи backend CLI (і ввімкнути stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Стиль логів Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Псевдонім для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Логувати сирі події потоку моделі в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях jsonl для сирого потоку.
</ParamField>

## Перезапустіть Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` просить запущений Gateway попередньо перевірити активну роботу OpenClaw перед перезапуском. Якщо активні операції в черзі, доставлення відповідей, вбудовані запуски або запуски завдань, Gateway повідомляє про блокувальники, об’єднує дублікати безпечних запитів на перезапуск і перезапускається після завершення активної роботи. Звичайний `restart` зберігає наявну поведінку service-manager для сумісності. Використовуйте `--force` лише тоді, коли явно потрібен шлях негайного перевизначення.

<Warning>
Вбудований `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password`, підкріпленому SecretRef.
</Warning>

### Профілювання запуску

- Задайте `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб логувати таймінги фаз під час запуску Gateway, включно із затримкою `eventLoopMax` для кожної фази та таймінгами lookup-table плагінів для installed-index, manifest registry, startup planning і owner-map.
- Задайте `OPENCLAW_DIAGNOSTICS=timeline` з `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, щоб записати best-effort JSONL-хронологію діагностики запуску для зовнішніх QA harnesses. Також можна ввімкнути прапорець через `diagnostics.flags: ["timeline"]` у конфігурації; шлях усе одно задається через env. Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити зразки event-loop.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виконати benchmark запуску Gateway. Benchmark записує перший вивід процесу, `/healthz`, `/readyz`, таймінги startup trace, затримку event-loop і деталі таймінгів lookup-table плагінів.

## Опитайте запущений Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: зручно для читання людиною (кольорове в TTY).
    - `--json`: машинозчитуваний JSON (без стилізації/spinner).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігаючи людський макет.

  </Tab>
  <Tab title="Спільні параметри">
    - `--url <url>`: WebSocket URL Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: timeout/budget (залежить від команди).
    - `--expect-final`: чекати на відповідь "final" (виклики агента).

  </Tab>
</Tabs>

<Note>
Коли ви задаєте `--url`, CLI не повертається до облікових даних із конфігурації чи середовища. Передайте `--token` або `--password` явно. Відсутність явних облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP endpoint `/healthz` є liveness probe: він повертає відповідь, щойно сервер може відповідати через HTTP. HTTP endpoint `/readyz` суворіший і лишається червоним, доки sidecar-и плагінів запуску, канали або налаштовані хуки ще стабілізуються. Локальні або автентифіковані докладні відповіді readiness містять діагностичний блок `eventLoop` із затримкою event-loop, використанням event-loop, співвідношенням ядер CPU та прапорцем `degraded`.

### `gateway usage-cost`

Отримайте підсумки usage-cost із логів сесій.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Кількість днів для включення.
</ParamField>

### `gateway stability`

Отримайте нещодавній diagnostic stability recorder із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальна кількість нещодавніх подій для включення (макс. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фільтрувати за типом діагностичної події, наприклад `payload.large` або `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включати лише події після номера діагностичної послідовності.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Читати збережений stability bundle замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого bundle у каталозі стану або передайте шлях до JSON bundle напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати придатний для поширення zip із діагностикою підтримки замість друку деталей стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфіденційність і поведінка bundle">
    - Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/плагінів і редаговані підсумки сесій. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies, секретні значення, hostnames або сирі ідентифікатори сесій. Задайте `diagnostics.enabled: false`, щоб повністю вимкнути recorder.
    - Під час фатальних завершень Gateway, timeout під час shutdown і збоїв startup restart OpenClaw записує той самий діагностичний snapshot у `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли recorder має події. Перегляньте найновіший bundle за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Запишіть локальний zip із діагностикою, призначений для додавання до bug reports. Модель конфіденційності та вміст bundle див. у [Експорті діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях zip-виводу. За замовчуванням це експорт підтримки в каталозі стану.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальна кількість очищених рядків логів для включення.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальна кількість байтів логів для перевірки.
</ParamField>
<ParamField path="--url <url>" type="string">
  WebSocket URL Gateway для snapshot health.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для snapshot health.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для snapshot health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout для snapshot status/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого stability bundle.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати записаний шлях, розмір і manifest як JSON.
</ParamField>

Експорт містить manifest, підсумок Markdown, форму конфігурації, очищені деталі конфігурації, очищені підсумки логів, очищені snapshot-и status/health Gateway і найновіший stability bundle, якщо він існує.

Він призначений для поширення. Він зберігає операційні деталі, що допомагають у налагодженні, як-от безпечні поля логів OpenClaw, назви підсистем, коди статусу, тривалості, налаштовані режими, порти, ідентифікатори плагінів, ідентифікатори providers, несекретні налаштування функцій і редаговані операційні повідомлення логів. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookies, ідентифікатори облікових записів/повідомлень, текст prompts/instructions, hostnames і секретні значення. Коли повідомлення в стилі LogTape схоже на текст payload користувача/чату/інструмента, експорт зберігає лише факт, що повідомлення було пропущено, плюс його кількість байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливості підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додайте явну ціль зондування. Налаштовані віддалений вузол і localhost все одно зондуються.
</ParamField>
<ParamField path="--token <token>" type="string">
  Автентифікація токеном для зондування.
</ParamField>
<ParamField path="--password <password>" type="string">
  Автентифікація паролем для зондування.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Час очікування зондування.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Пропустити зондування з’єднання (перегляд лише сервісу).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати служби системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартне зондування з’єднання до зондування читання й завершити з ненульовим кодом, якщо це зондування читання завершується невдало. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статусу">
    - `gateway status` залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Стандартна `gateway status` підтверджує стан сервісу, WebSocket-з’єднання та можливість автентифікації, видиму під час handshake. Вона не підтверджує операції читання/запису/адміністрування.
    - Діагностичні зондування не змінюють стан для першої автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис read-only сполучення пристрою лише для перевірки статусу.
    - `gateway status` за можливості розв’язує налаштовані SecretRefs автентифікації для автентифікації зондування.
    - Якщо потрібний SecretRef автентифікації не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли з’єднання/автентифікація зондування завершується невдало; передайте `--token`/`--password` явно або спершу розв’яжіть джерело секрету.
    - Якщо зондування успішне, попередження про нерозв’язані auth-ref приглушуються, щоб уникнути хибних спрацьовувань.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли сервісу, що прослуховує порт, недостатньо й потрібно, щоб RPC-виклики з областю читання також були працездатними.
    - `--deep` додає best-effort сканування додаткових інсталяцій launchd/systemd/schtasks. Коли виявлено кілька gateway-подібних сервісів, текстовий вивід друкує підказки з очищення та попереджає, що більшість налаштувань мають запускати один gateway на машину.
    - Текстовий вивід містить розв’язаний шлях до файлового журналу, а також знімок шляхів/чинності конфігурації CLI і сервісу, щоб допомогти діагностувати розбіжність профілю або state-dir.

  </Accordion>
  <Accordion title="Перевірки auth-drift у Linux systemd">
    - В інсталяціях Linux systemd перевірки auth drift сервісу читають як значення `Environment=`, так і `EnvironmentFile=` з unit (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами `-`).
    - Перевірки drift розв’язують SecretRefs `gateway.auth.token` за допомогою об’єднаного runtime env (спершу env команди сервісу, потім fallback до process env).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy` або mode не задано, де пароль може перемогти й жоден кандидат токена не може перемогти), перевірки token-drift пропускають розв’язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди зондує:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (loopback) **навіть якщо віддалений вузол налаштовано**.

Якщо передати `--url`, цю явну ціль буде додано перед обома. Текстовий вивід позначає цілі так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька gateway, команда виводить усі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість інсталяцій усе одно запускають один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-з’єднання.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що зондування змогло підтвердити щодо автентифікації. Це окремо від досяжності.
    - `Read probe: ok` означає, що RPC-виклики деталізації з областю читання (`health`/`status`/`system-presence`/`config.get`) також виконалися успішно.
    - `Read probe: limited - missing scope: operator.read` означає, що з’єднання успішне, але RPC з областю читання обмежений. Це повідомляється як **погіршена** досяжність, а не повний збій.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв WebSocket-з’єднання, але подальша діагностика читання перевищила час очікування або завершилася невдало. Це також **погіршена** досяжність, а не недосяжний Gateway.
    - Як і `gateway status`, зондування повторно використовує наявну кешовану автентифікацію пристрою, але не створює першу ідентичність пристрою або стан сполучення.
    - Код виходу ненульовий лише тоді, коли жодна зондувана ціль недосяжна.

  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль досяжна.
    - `degraded`: принаймні одна ціль прийняла з’єднання, але не завершила повну деталізовану RPC-діагностику.
    - `capability`: найкраща можливість, побачена серед досяжних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем, у такому порядку: явний URL, SSH tunnel, налаштований віддалений вузол, потім local loopback.
    - `warnings[]`: best-effort записи попереджень із `code`, `message` та необов’язковими `targetIds`.
    - `network`: підказки URL для local loopback/tailnet, отримані з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів discovery, використані для цього проходу зондування.

    Для кожної цілі (`targets[].connect`):

    - `ok`: досяжність після класифікації connect + degraded.
    - `rpcOk`: успіх повної деталізованої RPC.
    - `scopeLimited`: деталізована RPC завершилася невдало через відсутню область operator.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступна.
    - `scopes`: надані області, повідомлені в `hello-ok`, коли доступні.
    - `capability`: відображена класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: налаштування SSH tunnel завершилося невдало; команда повернулася до прямих зондувань.
    - `multiple_gateways`: досяжною була більш ніж одна ціль; це незвично, якщо ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
    - `auth_secretref_unresolved`: налаштований SecretRef автентифікації не вдалося розв’язати для цілі, що завершилася невдало.
    - `probe_scope_limited`: WebSocket-з’єднання успішне, але зондування читання було обмежене через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалено через SSH (паритет із Mac app)

Режим macOS app «Remote over SSH» використовує локальне перенаправлення порту, щоб віддалений gateway (який може бути прив’язаний лише до loopback) став доступним за `ws://127.0.0.1:<port>`.

Еквівалент CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` або `user@host:port` (port за замовчуванням `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Файл ідентичності.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Вибрати перший виявлений хост gateway як ціль SSH з розв’язаного endpoint discovery (`local.` плюс налаштований wide-area domain, якщо є). Підказки лише TXT ігноруються.
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
  Бюджет часу очікування.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Переважно для RPC у стилі агентів, які передають проміжні події перед фінальним payload.
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

### Інсталяція з wrapper

Використовуйте `--wrapper`, коли керований сервіс має запускатися через інший виконуваний файл, наприклад shim менеджера секретів або run-as helper. Wrapper отримує звичайні аргументи Gateway і відповідає за те, щоб зрештою виконати `openclaw` або Node з цими аргументами.

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

Також можна задати wrapper через середовище. `gateway install` перевіряє, що шлях є виконуваним файлом, записує wrapper у `ProgramArguments` сервісу та зберігає `OPENCLAW_WRAPPER` у середовищі сервісу для подальших примусових перевстановлень, оновлень і виправлень doctor.

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
    - Використовуйте `gateway restart`, щоб перезапустити керований сервіс. Не об’єднуйте `gateway stop` і `gateway start` як заміну перезапуску; на macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.
    - `gateway restart --safe` просить запущений Gateway виконати preflight активної роботи OpenClaw і відкласти перезапуск, доки доставлення відповідей, вбудовані запуски та запуски завдань не завершаться. `--safe` не можна поєднувати з `--force` або `--wait`.
    - `gateway restart --wait 30s` перевизначає налаштований бюджет drain для перезапуску. Голі числа означають мілісекунди; приймаються одиниці, як-от `s`, `m` і `h`. `--wait 0` чекає безстроково.
    - `gateway restart --force` пропускає drain активної роботи й перезапускає негайно. Використовуйте це, коли оператор уже перевірив перелічені блокери завдань і хоче повернути gateway зараз.
    - Команди життєвого циклу приймають `--json` для скриптів.

  </Accordion>
  <Accordion title="Автентифікація та SecretRefs під час встановлення">
    - Коли автентифікація за токеном потребує токен і `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна розв'язати, але не зберігає розв'язаний токен у метаданих середовища сервісу.
    - Якщо автентифікація за токеном потребує токен, а налаштований SecretRef токена не розв'язано, встановлення завершується закритою відмовою замість збереження резервного відкритого тексту.
    - Для автентифікації паролем у `gateway run` віддавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
    - У режимі виведеної автентифікації лише shell-змінна `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час встановлення; використовуйте сталу конфігурацію (`gateway.auth.password` або config `env`) під час встановлення керованого сервісу.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення блокується, доки режим не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення Gateway (Bonjour)

`gateway discover` сканує маячки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише екземпляри Gateway з увімкненим виявленням Bonjour (типово) оголошують маячок.

Записи Wide-Area виявлення містять (TXT):

- `role` (підказка ролі Gateway)
- `transport` (підказка транспорту, напр. `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов'язково; клієнти типово використовують `22` для SSH-цілей, коли він відсутній)
- `tailnetDns` (ім'я хоста MagicDNS, коли доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленого встановлення, записана в wide-area зону)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Таймаут для команди (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний вивід (також вимикає стилізацію/індикатор).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований wide-area домен, коли його ввімкнено.
- `wsUrl` у JSON-виводі походить із розв'язаного endpoint сервісу, а не лише з TXT-підказок, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS, `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` дорівнює `full`. Wide-area DNS-SD все одно записує `cliPath`; `sshPort` там також залишається необов'язковим.

</Note>

## Пов'язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
