---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язування та підключення
    - Виявлення Gateway через Bonjour (локальний + широкозонний DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запуск, запити та виявлення Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-01T20:36:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f204b58e03c9dd1b75a7ddb2be0634ee70b42aa317a2668ab86cb33a0570b01
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, хуки). Підкоманди на цій сторінці належать до `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + глобального DNS-SD.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw рекламує та знаходить gateway.
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
    - За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Використовуйте `--allow-unconfigured` для спеціальних запусків або запусків для розробки.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та відновіть її, а не неявно припускайте локальний режим.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється "вгадувати local" за вас.
    - Прив’язування за межами loopback без автентифікації блокується (захисне обмеження).
    - `SIGUSR1` запускає перезапуск у межах процесу, коли це дозволено (`commands.restart` увімкнено за замовчуванням; встановіть `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як застосування/оновлення інструмента й конфігурації gateway залишаються дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жодний користувацький стан термінала. Якщо ви обгортаєте CLI у TUI або введення в raw-mode, відновіть термінал перед виходом.

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
  Перевизначення токена (також встановлює `OPENCLAW_GATEWAY_TOKEN` для процесу).
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
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить захист запуску лише для спеціального/dev початкового завантаження; не записує й не відновлює файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + робочий простір, якщо вони відсутні (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути dev-конфігурацію + облікові дані + сесії + робочий простір (потрібен `--dev`).
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
  Записувати сирі події потоку моделі у jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях до jsonl сирого потоку.
</ParamField>

<Warning>
Вбудований `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання запуску

- Встановіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати часи фаз під час запуску Gateway, зокрема затримку `eventLoopMax` для кожної фази та часи таблиць пошуку plugin для installed-index, registry маніфестів, планування запуску й роботи owner-map.
- Встановіть `OPENCLAW_DIAGNOSTICS=timeline` з `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, щоб записати best-effort JSONL-хронологію діагностики запуску для зовнішніх QA-оснасток. Ви також можете ввімкнути прапорець через `diagnostics.flags: ["timeline"]` у конфігурації; шлях усе одно надається через env. Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити зразки event-loop.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти запуск Gateway. Бенчмарк записує перший вивід процесу, `/healthz`, `/readyz`, часи трасування запуску, затримку event-loop і деталі часу таблиць пошуку plugin.

## Опитайте запущений Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: зручний для читання людиною (кольоровий у TTY).
    - `--json`: машинозчитуваний JSON (без стилізації/індикатора виконання).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігаючи людський макет.

  </Tab>
  <Tab title="Спільні параметри">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: тайм-аут/бюджет (залежить від команди).
    - `--expect-final`: чекати на "final" відповідь (виклики агента).

  </Tab>
</Tabs>

<Note>
Коли ви встановлюєте `--url`, CLI не повертається до облікових даних із конфігурації або середовища. Передайте `--token` або `--password` явно. Відсутність явних облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпоінт `/healthz` — це проба життєздатності: він повертає відповідь, щойно сервер може відповідати через HTTP. HTTP-ендпоінт `/readyz` суворіший і залишається червоним, поки стартові plugin-sidecars, канали або налаштовані хуки ще стабілізуються. Локальні або автентифіковані докладні відповіді готовності містять діагностичний блок `eventLoop` із затримкою event-loop, використанням event-loop, співвідношенням ядер CPU та прапорцем `degraded`.

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

Отримати нещодавній реєстратор діагностичної стабільності із запущеного Gateway.

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
  Прочитати збережений пакет стабільності замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану, або передайте шлях до JSON пакета напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати спільний zip діагностики підтримки замість друку деталей стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфіденційність і поведінка пакета">
    - Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/plugin і редаговані зведення сесій. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookie, секретні значення, імена хостів або сирі ідентифікатори сесій. Встановіть `diagnostics.enabled: false`, щоб повністю вимкнути реєстратор.
    - Під час фатальних завершень Gateway, тайм-аутів завершення роботи та збоїв запуску після перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли реєстратор має події. Перегляньте найновіший пакет через `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакета.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip діагностики, призначений для додавання до звітів про помилки. Модель конфіденційності й вміст пакета див. у [Експорт діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до zip виводу. За замовчуванням використовується експорт підтримки в каталозі стану.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальна кількість очищених рядків журналу для включення.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальна кількість байтів журналу для перевірки.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway для знімка health.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для знімка health.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для знімка health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Тайм-аут знімка status/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого пакета стабільності.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати записаний шлях, розмір і маніфест як JSON.
</ParamField>

Експорт містить маніфест, зведення Markdown, форму конфігурації, очищені деталі конфігурації, очищені зведення журналів, очищені знімки стану/health Gateway і найновіший пакет стабільності, якщо він існує.

Його призначено для спільного використання. Він зберігає операційні деталі, що допомагають налагодженню, наприклад безпечні поля журналу OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, ідентифікатори plugin, ідентифікатори provider, несекретні налаштування функцій і редаговані операційні повідомлення журналу. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookie, ідентифікатори облікового запису/повідомлення, текст prompt/інструкцій, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст payload користувача/чату/інструмента, експорт зберігає лише факт, що повідомлення було пропущено, а також його кількість байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов’язкову пробу можливості підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль проби. Налаштовані remote + localhost усе одно перевіряються.
</ParamField>
<ParamField path="--token <token>" type="string">
  Автентифікація токеном для проби.
</ParamField>
<ParamField path="--password <password>" type="string">
  Автентифікація паролем для проби.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Тайм-аут проби.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Пропустити пробу підключення (перегляд лише служби).
</ParamField>
<ParamField path="--deep" type="boolean">
  Сканувати також служби системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну пробу підключення до проби читання та завершити з ненульовим кодом, коли ця проба читання не вдається. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статусу">
    - `gateway status` залишається доступним для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Типовий `gateway status` підтверджує стан сервісу, підключення WebSocket і можливість автентифікації, видиму під час handshake. Він не підтверджує операції читання/запису/адміністрування.
    - Діагностичні проби не змінюють стан для першої автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис сполучення пристрою лише для читання тільки для перевірки статусу.
    - `gateway status` за можливості розв'язує налаштовані auth SecretRefs для автентифікації проби.
    - Якщо обов'язковий auth SecretRef не розв'язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація проби не вдається; передайте `--token`/`--password` явно або спочатку розв'яжіть джерело секрету.
    - Якщо проба успішна, попередження про нерозв'язані auth-ref пригнічуються, щоб уникнути хибних спрацювань.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли сервісу, що слухає порт, недостатньо і потрібно, щоб RPC-виклики з областю читання також були справними.
    - `--deep` додає найкращу можливу перевірку додаткових установлень launchd/systemd/schtasks. Коли виявлено кілька сервісів, схожих на Gateway, вивід для людини друкує підказки з очищення й попереджає, що більшість установлень має запускати один gateway на машину.
    - Вивід для людини містить розв'язаний шлях до файлового журналу, а також знімок шляхів/чинності конфігурації CLI порівняно із сервісом, щоб допомогти діагностувати розбіжності профілю або каталогу стану.

  </Accordion>
  <Accordion title="Перевірки розбіжності автентифікації Linux systemd">
    - В установленнях Linux systemd перевірки розбіжності автентифікації сервісу читають як значення `Environment=`, так і `EnvironmentFile=` з unit-файла (включно з `%h`, шляхами в лапках, кількома файлами та необов'язковими файлами `-`).
    - Перевірки розбіжності розв'язують SecretRefs `gateway.auth.token` за допомогою об'єднаного runtime env (спочатку env команди сервісу, потім process env як fallback).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy` або режим не задано, коли пароль може мати перевагу й жоден кандидат токена не може мати перевагу), перевірки розбіжності токена пропускають розв'язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда "налагодити все". Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (local loopback) **навіть якщо віддалений gateway налаштовано**.

Якщо передати `--url`, цю явну ціль буде додано перед обома. Вивід для людини позначає цілі так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька gateways, команда виведе їх усі. Кілька gateways підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість установлень усе одно запускає один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-підключення.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що проба змогла підтвердити щодо автентифікації. Це окремо від доступності.
    - `Read probe: ok` означає, що RPC-виклики з деталями в області читання (`health`/`status`/`system-presence`/`config.get`) також виконалися успішно.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC в області читання обмежений. Це повідомляється як **погіршена** доступність, а не повний збій.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв WebSocket-з'єднання, але подальша діагностика читання вичерпала час очікування або завершилася помилкою. Це також **погіршена** доступність, а не недоступний Gateway.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює першу ідентичність пристрою або стан сполучення.
    - Код виходу ненульовий лише тоді, коли жодна перевірена ціль недоступна.

  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль прийняла з'єднання, але не завершила повну детальну RPC-діагностику.
    - `capability`: найкраща можливість, побачена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштована віддалена ціль, потім local loopback.
    - `warnings[]`: найкращі можливі записи попереджень із `code`, `message` і необов'язковими `targetIds`.
    - `network`: підказки URL для local loopback/tailnet, отримані з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет виявлення/кількість результатів, використані для цього проходу probe.

    Для кожної цілі (`targets[].connect`):

    - `ok`: доступність після connect + класифікація degraded.
    - `rpcOk`: успіх повної детальної RPC.
    - `scopeLimited`: детальна RPC завершилася помилкою через відсутню область operator.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступна.
    - `scopes`: надані області, повідомлені в `hello-ok`, коли доступні.
    - `capability`: відображена класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: налаштування SSH-тунелю не вдалося; команда повернулася до прямих проб.
    - `multiple_gateways`: доступна більш ніж одна ціль; це незвично, якщо ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
    - `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося розв'язати для цілі з помилкою.
    - `probe_scope_limited`: WebSocket-підключення успішне, але пробу читання обмежено через відсутність `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалено через SSH (паритет із Mac app)

Режим "Віддалено через SSH" у macOS app використовує локальне переадресування порту, щоб віддалений gateway (який може бути прив'язаний лише до loopback) став доступним за адресою `ws://127.0.0.1:<port>`.

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
  Вибрати перший виявлений хост gateway як SSH-ціль із розв'язаного endpoint виявлення (`local.` плюс налаштований wide-area домен, якщо він є). Підказки лише TXT ігноруються.
</ParamField>

Конфігурація (необов'язкова, використовується як значення за замовчуванням):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий RPC-помічник.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Рядок об'єкта JSON для params.
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
  Переважно для RPC у стилі agent, які транслюють проміжні події перед фінальним payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний вивід JSON.
</ParamField>

<Note>
`--params` має бути чинним JSON.
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

Використовуйте `--wrapper`, коли керований сервіс має запускатися через інший виконуваний файл, наприклад shim менеджера секретів або helper для запуску від імені іншого користувача. Wrapper отримує звичайні аргументи Gateway і відповідає за те, щоб зрештою виконати `openclaw` або Node з цими аргументами.

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

Ви також можете задати wrapper через середовище. `gateway install` перевіряє, що шлях є виконуваним файлом, записує wrapper у `ProgramArguments` сервісу та зберігає `OPENCLAW_WRAPPER` у середовищі сервісу для подальших примусових перевстановлень, оновлень і виправлень doctor.

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
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Поведінка життєвого циклу">
    - Використовуйте `gateway restart`, щоб перезапустити керований сервіс. Не ланцюжте `gateway stop` і `gateway start` як заміну перезапуску; на macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупиненням.
    - Команди життєвого циклу приймають `--json` для скриптів.

  </Accordion>
  <Accordion title="Автентифікація та SecretRefs під час установлення">
    - Коли автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, `gateway install` перевіряє, що SecretRef можна розв'язати, але не зберігає розв'язаний токен у метаданих середовища сервісу.
    - Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не розв'язано, установлення завершується закритою помилкою замість збереження fallback plaintext.
    - Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість inline `--password`.
    - У виведеному режимі автентифікації лише shell-змінна `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час установлення; використовуйте стійку конфігурацію (`gateway.auth.password` або config `env`) під час установлення керованого сервісу.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки режим не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення gateways (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише gateways з увімкненим виявленням Bonjour (за замовчуванням) рекламують маяк.

Записи wide-area виявлення містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, напр. `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов'язково; клієнти використовують SSH-цілі за замовчуванням як `22`, коли він відсутній)
- `tailnetDns` (hostname MagicDNS, коли доступний)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка remote-install, записана в wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для команди (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний вивід (також вимикає styling/spinner).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` і налаштований домен широкої зони, коли його ввімкнено.
- `wsUrl` у виводі JSON походить із визначеної кінцевої точки сервісу, а не з підказок лише TXT, як-от `lanHost` або `tailnetDns`.
- У mDNS `local.` `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` має значення `full`. Широкозонний DNS-SD усе одно записує `cliPath`; `sshPort` там також лишається необов’язковим.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
