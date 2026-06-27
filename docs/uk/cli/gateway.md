---
read_when:
    - Запуск Gateway із CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення gateway через Bonjour (локальний + глобальний DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запуск, запити та виявлення Gateway
title: Gateway
x-i18n:
    generated_at: "2026-06-27T17:20:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, хуки). Підкоманди на цій сторінці розташовані під `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + wide-area DNS-SD.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw оголошує та знаходить gateways.
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

Псевдонім для запуску у foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Поведінка під час запуску">
    - За замовчуванням Gateway відмовляється запускатися, якщо `gateway.mode=local` не задано в `~/.openclaw/openclaw.json`. Використовуйте `--allow-unconfigured` для разових/dev-запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та відновіть її, а не припускайте локальний режим неявно.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється "вгадувати local" за вас.
    - Прив'язування поза межами loopback без автентифікації заблоковано (запобіжний механізм безпеки).
    - `lan`, `tailnet` і `custom` наразі працюють через IPv4-only BYOH-шляхи.
    - IPv6-only BYOH сьогодні не підтримується нативно на цьому шляху. Використовуйте IPv4 sidecar або проксі, якщо сам хост є IPv6-only.
    - `SIGUSR1` запускає перезапуск у межах процесу, коли це авторизовано (`commands.restart` увімкнено за замовчуванням; задайте `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як застосування/оновлення через gateway tool/config залишаться дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден користувацький стан термінала. Якщо ви обгортаєте CLI у TUI або введення в raw-mode, відновіть термінал перед виходом.

  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (значення за замовчуванням береться з config/env; зазвичай `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим прив'язування слухача. `lan`, `tailnet` і `custom` наразі працюють через IPv4-only шляхи.
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
  Скинути конфігурацію Tailscale serve/funnel під час завершення роботи.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Сьогодні очікує IPv4-адресу. Для IPv6-only BYOH розмістіть IPv4 sidecar або проксі перед Gateway і спрямуйте OpenClaw на цю IPv4-кінцеву точку.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить запобіжник запуску лише для разового/dev bootstrap; не записує і не відновлює файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + workspace, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути dev-конфігурацію + облікові дані + сесії + workspace (потребує `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Перед запуском завершити будь-який наявний слухач на вибраному порту.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Докладні журнали.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показувати в консолі лише журнали CLI backend (і ввімкнути stdout/stderr).
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
  Шлях до сирого потоку jsonl.
</ParamField>

## Перезапуск Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` просить запущений Gateway виконати preflight активної роботи OpenClaw перед перезапуском. Якщо активні операції в черзі, доставка відповідей, вбудовані запуски або запуски завдань, Gateway повідомляє про блокери, об'єднує дублікати запитів безпечного перезапуску та перезапускається після завершення активної роботи. Звичайний `restart` зберігає наявну поведінку service-manager для сумісності. Використовуйте `--force` лише тоді, коли явно потрібен шлях негайного перевизначення.

`openclaw gateway restart --safe --skip-deferral` виконує той самий узгоджений із OpenClaw перезапуск, що й `--safe`, але обходить бар'єр відкладення активної роботи, тому Gateway одразу видає перезапуск, навіть коли повідомлено про блокери. Використовуйте це як аварійний вихід оператора, коли відкладення застрягло через завислий запуск завдання, а сам `--safe` чекав би нескінченно. `--skip-deferral` потребує `--safe`.

<Warning>
Inline `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на базі SecretRef.
</Warning>

### Профілювання Gateway

- Задайте `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати таймінги фаз під час запуску Gateway, зокрема затримку `eventLoopMax` для кожної фази та таймінги plugin lookup-table для installed-index, manifest registry, планування запуску та роботи owner-map.
- Задайте `OPENCLAW_GATEWAY_RESTART_TRACE=1`, щоб журналювати рядки `restart trace:` у межах перезапуску для обробки сигналу перезапуску, спорожнення активної роботи, фаз завершення, наступного старту, таймінгу готовності та метрик пам'яті.
- Задайте `OPENCLAW_DIAGNOSTICS=timeline` разом із `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, щоб записувати best-effort JSONL-таймлайн діагностики запуску для зовнішніх QA harnesses. Також можна ввімкнути прапорець через `diagnostics.flags: ["timeline"]` у конфігурації; шлях усе одно надається через env. Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити семпли event-loop.
- Спершу запустіть `pnpm build`, потім `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти запуск Gateway відносно зібраного CLI entry. Бенчмарк записує перший вивід процесу, `/healthz`, `/readyz`, таймінги startup trace, затримку event-loop і деталі таймінгів plugin lookup-table.
- Спершу запустіть `pnpm build`, потім `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, щоб виміряти перезапуск Gateway у межах процесу відносно зібраного CLI entry на macOS або Linux. Бенчмарк перезапуску використовує SIGUSR1, вмикає і startup, і restart traces у дочірньому процесі та записує наступний `/healthz`, наступний `/readyz`, downtime, таймінг готовності, CPU, RSS і метрики restart trace.
- Вважайте `/healthz` ознакою liveness, а `/readyz` — готовністю до використання. Рядки trace і вивід бенчмарка призначені для attribution власника; не вважайте один span trace або один семпл повним висновком про продуктивність.

## Запит до запущеного Gateway

Усі команди запиту використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: зручний для читання людиною (кольоровий у TTY).
    - `--json`: машиночитний JSON (без стилізації/spinner).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігаючи людський макет.

  </Tab>
  <Tab title="Спільні параметри">
    - `--url <url>`: WebSocket URL Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: timeout/budget (залежить від команди).
    - `--expect-final`: чекати на "final" відповідь (виклики агента).

  </Tab>
</Tabs>

<Note>
Коли ви задаєте `--url`, CLI не повертається до облікових даних із конфігурації або середовища. Передайте `--token` або `--password` явно. Відсутність явних облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

HTTP-кінцева точка `/healthz` — це liveness probe: вона повертає відповідь, щойно сервер може відповідати HTTP. HTTP-кінцева точка `/readyz` суворіша та лишається red, доки startup plugin sidecars, канали або налаштовані hooks ще стабілізуються. Локальні або автентифіковані докладні відповіді готовності містять діагностичний блок `eventLoop` із затримкою event-loop, utilization event-loop, співвідношенням CPU core та прапорцем `degraded`.

<ParamField path="--port <port>" type="number">
  Спрямувати виклик health на local loopback Gateway на цьому порту. Це перевизначає `OPENCLAW_GATEWAY_URL` і `OPENCLAW_GATEWAY_PORT` для виклику health.
</ParamField>

### `gateway usage-cost`

Отримати зведення usage-cost із журналів сесій.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Кількість днів для включення.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Обмежити зведення вартості одним налаштованим agent id.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Агрегувати зведення вартості для всіх налаштованих агентів. Не можна поєднувати з `--agent`.
</ParamField>

### `gateway stability`

Отримати нещодавній diagnostic stability recorder із запущеного Gateway.

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
  Включити лише події після номера діагностичної послідовності.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Прочитати збережений stability bundle замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого bundle в каталозі стану, або передайте шлях до bundle JSON напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати придатний для поширення zip із support diagnostics замість друку деталей stability.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфіденційність і поведінка bundle">
    - Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам'яті, стан черги/сесії, назви channel/plugin і відредаговані зведення сесій. Вони не зберігають текст чатів, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies, секретні значення, hostnames або сирі session ids. Задайте `diagnostics.enabled: false`, щоб повністю вимкнути recorder.
    - Під час фатальних завершень Gateway, timeout завершення роботи та помилок запуску після перезапуску OpenClaw записує той самий діагностичний snapshot у `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо recorder має події. Перегляньте найновіший bundle за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний diagnostics zip, призначений для додавання до bug reports. Модель конфіденційності та вміст bundle див. у [Експорт діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до вихідного zip. За замовчуванням — експорт для підтримки в каталозі стану.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальна кількість очищених рядків журналу для включення.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальна кількість байтів журналу для перевірки.
</ParamField>
<ParamField path="--url <url>" type="string">
  WebSocket URL Gateway для знімка стану працездатності.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для знімка стану працездатності.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для знімка стану працездатності.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Таймаут знімка статусу/працездатності.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого пакета стабільності.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати записаний шлях, розмір і маніфест як JSON.
</ParamField>

Експорт містить маніфест, підсумок Markdown, форму конфігурації, очищені деталі конфігурації, очищені підсумки журналів, очищені знімки статусу/працездатності Gateway, а також найновіший пакет стабільності, якщо він існує.

Він призначений для поширення. Він зберігає операційні деталі, що допомагають налагодженню, як-от безпечні поля журналу OpenClaw, назви підсистем, коди статусу, тривалості, налаштовані режими, порти, ідентифікатори Plugin, ідентифікатори провайдерів, несекретні налаштування функцій і відредаговані операційні повідомлення журналу. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookies, ідентифікатори облікових записів/повідомлень, текст промптів/інструкцій, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст користувацького/чатового/інструментального payload, експорт зберігає лише те, що повідомлення було пропущено, плюс кількість його байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливості підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль перевірки. Налаштовані remote + localhost усе одно перевіряються.
</ParamField>
<ParamField path="--token <token>" type="string">
  Автентифікація токеном для перевірки.
</ParamField>
<ParamField path="--password <password>" type="string">
  Автентифікація паролем для перевірки.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Таймаут перевірки.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Пропустити перевірку підключення (подання лише служби).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати служби системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до перевірки читання та завершити з ненульовим кодом, якщо ця перевірка читання не вдалася. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статусу">
    - `gateway status` залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Стандартна `gateway status` підтверджує стан служби, підключення WebSocket і можливість автентифікації, видиму під час handshake. Вона не підтверджує операції читання/запису/admin.
    - Діагностичні перевірки не змінюють стан для першої автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис read-only pairing пристрою лише для перевірки статусу.
    - `gateway status` за можливості розв’язує налаштовані auth SecretRefs для автентифікації перевірки.
    - Якщо потрібний auth SecretRef не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація перевірки не вдається; передайте `--token`/`--password` явно або спочатку розв’яжіть джерело секрету.
    - Якщо перевірка успішна, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибних спрацювань.
    - Коли перевірку ввімкнено, JSON-вивід містить `gateway.version`, якщо запущений Gateway повідомляє її; `--require-rpc` може fallback до RPC payload `status.runtimeVersion`, якщо подальша handshake-перевірка не може надати метадані версії.
    - Використовуйте `--require-rpc` у scripts і автоматизації, коли служби, що слухає, недостатньо і потрібно, щоб RPC-виклики з read-scope також були справними.
    - `--deep` додає best-effort сканування додаткових інсталяцій launchd/systemd/schtasks. Коли виявлено кілька служб, схожих на gateway, вивід для людини друкує підказки щодо очищення та попереджає, що більшість налаштувань мають запускати один gateway на машину.
    - `--deep` також повідомляє про нещодавню передачу перезапуску supervisor Gateway, коли процес служби коректно завершився для зовнішнього перезапуску supervisor.
    - `--deep` запускає перевірку конфігурації в режимі з урахуванням Plugin (`pluginValidation: "full"`) і показує попередження налаштованих маніфестів Plugin (наприклад, відсутні метадані конфігурації каналу), щоб smoke-перевірки встановлення й оновлення їх виявляли. Стандартна `gateway status` зберігає швидкий read-only шлях, який пропускає перевірку Plugin.
    - Вивід для людини містить розв’язаний шлях до файлового журналу плюс знімок шляхів/дійсності конфігурації CLI-проти-служби, щоб допомогти діагностувати дрейф профілю або state-dir.

  </Accordion>
  <Accordion title="Перевірки дрейфу автентифікації Linux systemd">
    - В інсталяціях Linux systemd перевірки дрейфу автентифікації служби читають значення `Environment=` і `EnvironmentFile=` з unit (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами `-`).
    - Перевірки дрейфу розв’язують `gateway.auth.token` SecretRefs за допомогою об’єднаного runtime env (спочатку env команди служби, потім fallback до env процесу).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або mode не задано, де пароль може перемогти й жоден кандидат токена не може перемогти), перевірки token-drift пропускають розв’язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда "налагодити все". Вона завжди перевіряє:

- ваш налаштований remote gateway (якщо задано), і
- localhost (loopback) **навіть якщо remote налаштовано**.

Якщо передати `--url`, ця явна ціль додається перед обома. Вивід для людини позначає цілі як:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька цілей перевірки, вона друкує всі. SSH-тунель, TLS/proxy URL і налаштований remote URL можуть усі вказувати на той самий gateway, навіть коли їхні транспортні порти відрізняються; `multiple_gateways` зарезервовано для окремих або неоднозначних за ідентичністю доступних gateway. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі (наприклад, rescue bot), але більшість інсталяцій усе одно запускають один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Використати цей порт для цілі перевірки local loopback і remote port SSH-тунелю. Без `--url` це вибирає ціль local loopback замість налаштованого gateway environment URL, environment port або remote targets.
</ParamField>

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-підключення.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що перевірка змогла підтвердити щодо автентифікації. Це окремо від доступності.
    - `Read probe: ok` означає, що RPC-виклики деталей read-scope (`health`/`status`/`system-presence`/`config.get`) також успішні.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але read-scope RPC обмежено. Це повідомляється як **погіршена** доступність, а не повна відмова.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв WebSocket-з’єднання, але подальша діагностика читання перевищила таймаут або не вдалася. Це також **погіршена** доступність, а не недоступний Gateway.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює першу ідентичність пристрою або стан pairing.
    - Код виходу ненульовий лише тоді, коли жодна перевірена ціль не доступна.

  </Accordion>
  <Accordion title="JSON-вивід">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль прийняла з’єднання, але не завершила повну деталізовану RPC-діагностику.
    - `capability`: найкраща можливість, побачена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштований remote, потім local loopback.
    - `warnings[]`: best-effort записи попереджень з `code`, `message` і необов’язковими `targetIds`.
    - `network`: підказки URL local loopback/tailnet, виведені з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів discovery, використані для цього проходу перевірки.

    Для кожної цілі (`targets[].connect`):

    - `ok`: доступність після connect + класифікація degraded.
    - `rpcOk`: успіх повної деталізованої RPC.
    - `scopeLimited`: деталізована RPC не вдалася через відсутній operator scope.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступна.
    - `scopes`: надані scopes, повідомлені в `hello-ok`, коли доступні.
    - `capability`: показана класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: налаштування SSH-тунелю не вдалося; команда повернулася до прямих перевірок.
    - `multiple_gateways`: були доступні окремі ідентичності gateway, або OpenClaw не зміг довести, що доступні цілі є тим самим gateway. SSH-тунель, proxy URL або налаштований remote URL до того самого gateway не запускає це попередження.
    - `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося розв’язати для невдалої цілі.
    - `probe_scope_limited`: WebSocket connect успішний, але перевірку читання обмежено через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remote через SSH (паритет Mac app)

Режим macOS app "Remote over SSH" використовує локальний port-forward, щоб remote gateway (який може бути прив’язаний лише до loopback) став доступним на `ws://127.0.0.1:<port>`.

Еквівалент CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` або `user@host:port` (порт за замовчуванням — `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Файл ідентичності.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Вибрати перший виявлений gateway host як SSH target з розв’язаного discovery endpoint (`local.` плюс налаштований wide-area domain, якщо є). Підказки лише TXT ігноруються.
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
  Бюджет таймауту.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Переважно для RPC у стилі agent, які транслюють проміжні події перед фінальним payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний JSON-вивід.
</ParamField>

<Note>
`--params` має бути дійсним JSON.
</Note>

## Керування службою Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Встановлення з wrapper

Використовуйте `--wrapper`, коли керована служба має запускатися через інший виконуваний файл, наприклад
shim менеджера секретів або помічник запуску від імені іншого користувача. Обгортка отримує звичайні аргументи Gateway і
відповідає за подальше виконання через exec `openclaw` або Node із цими аргументами.

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

Також можна встановити обгортку через середовище. `gateway install` перевіряє, що шлях є
виконуваним файлом, записує обгортку в `ProgramArguments` служби та зберігає
`OPENCLAW_WRAPPER` у середовищі служби для подальших примусових перевстановлень, оновлень і виправлень через doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Щоб видалити збережену обгортку, очистьте `OPENCLAW_WRAPPER` під час перевстановлення:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Параметри команд">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Поведінка життєвого циклу">
    - Використовуйте `gateway restart`, щоб перезапустити керовану службу. Не поєднуйте `gateway stop` і `gateway start` як заміну перезапуску.
    - На macOS `gateway stop` за замовчуванням використовує `launchctl bootout`, що видаляє LaunchAgent із поточного сеансу завантаження без збереження вимкнення — автоматичне відновлення KeepAlive залишається активним для майбутніх збоїв, а `gateway start` повторно вмикає все коректно без ручного `launchctl enable`. Передайте `--disable`, щоб постійно приглушити KeepAlive і RunAtLoad, аби Gateway не запускався повторно до наступного явного `gateway start`; використовуйте це, коли ручна зупинка має пережити перезавантаження або перезапуски системи.
    - `gateway restart --safe` просить запущений Gateway попередньо перевірити активну роботу OpenClaw і відкласти перезапуск, доки доставлення відповідей, вбудовані запуски та запуски завдань не завершаться. `--safe` не можна поєднувати з `--force` або `--wait`.
    - `gateway restart --wait 30s` перевизначає налаштований бюджет очікування завершення роботи для цього перезапуску. Числа без одиниць вимірюються в мілісекундах; підтримуються одиниці на кшталт `s`, `m` і `h`. `--wait 0` чекає безстроково.
    - `gateway restart --safe --skip-deferral` виконує безпечний перезапуск з урахуванням OpenClaw, але обходить шлюз відкладення, тому Gateway негайно запускає перезапуск навіть коли повідомлено про блокери. Це аварійний вихід для оператора в разі завислих відкладень запусків завдань; потребує `--safe`.
    - `gateway restart --force` пропускає очікування завершення активної роботи та перезапускає негайно. Використовуйте це, коли оператор уже перевірив перелічені блокери завдань і хоче повернути Gateway в роботу зараз.
    - Команди життєвого циклу приймають `--json` для сценаріїв.

  </Accordion>
  <Accordion title="Автентифікація та SecretRefs під час встановлення">
    - Коли токенна автентифікація потребує токена, а `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища служби.
    - Якщо токенна автентифікація потребує токена, а налаштований SecretRef токена не розв’язується, встановлення завершується закритою помилкою замість збереження резервного відкритого тексту.
    - Для парольної автентифікації в `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
    - У виведеному режимі автентифікації `OPENCLAW_GATEWAY_PASSWORD`, заданий лише у shell, не послаблює вимоги до токена під час встановлення; використовуйте довготривалу конфігурацію (`gateway.auth.password` або config `env`) під час встановлення керованої служби.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення блокується, доки режим не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення Gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише Gateway з увімкненим виявленням Bonjour (за замовчуванням) рекламують маяк.

Записи широкозонного виявлення можуть містити такі підказки TXT:

- `role` (підказка ролі Gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (лише режим повного виявлення; клієнти за замовчуванням використовують SSH-цілі `22`, коли він відсутній)
- `tailnetDns` (ім’я хоста MagicDNS, коли доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (лише режим повного виявлення)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для команди (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний вивід (також вимикає стилізацію/спінер).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований широкозонний домен, коли його ввімкнено.
- `wsUrl` у JSON-виводі походить із розв’язаної кінцевої точки служби, а не з підказок лише TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS і широкозонному DNS-SD `sshPort` та `cliPath` публікуються лише коли `discovery.mdns.mode` має значення `full`.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Операційний посібник Gateway](/uk/gateway)
