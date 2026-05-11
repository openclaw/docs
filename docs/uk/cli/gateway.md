---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язування та підключення
    - Виявлення Gateway через Bonjour (локальний + широкозонний DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запуск, запити та виявлення шлюзів
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:28:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сеанси, хуки). Підкоманди на цій сторінці розміщені під `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + широкозонного DNS-SD.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw оголошує та знаходить Gateway.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration">
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
  <Accordion title="Поведінка під час запуску">
    - За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не задано `gateway.mode=local`. Використовуйте `--allow-unconfigured` лише для разових/розробницьких запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це зламаною або затертою конфігурацією та виправте її, а не неявно припускайте локальний режим.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації й відмовляється «вгадувати локальний режим» замість вас.
    - Прив’язування поза loopback без автентифікації блокується (захисний запобіжник).
    - `SIGUSR1` запускає перезапуск усередині процесу, коли це дозволено (`commands.restart` увімкнено за замовчуванням; задайте `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як операції Gateway для застосування/оновлення інструментів/конфігурації залишаються дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес Gateway, але не відновлюють жоден користувацький стан термінала. Якщо ви обгортаєте CLI за допомогою TUI або введення в raw-режимі, відновіть термінал перед виходом.

  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (значення за замовчуванням береться з конфігурації/середовища; зазвичай `18789`).
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
  Читати пароль Gateway з файлу.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Відкрити доступ до Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скидати конфігурацію Tailscale serve/funnel під час завершення роботи.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск Gateway без `gateway.mode=local` у конфігурації. Оминає захист запуску лише для разового/розробницького bootstrap; не записує й не виправляє файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити розробницьку конфігурацію + робочу область, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути розробницьку конфігурацію + облікові дані + сеанси + робочу область (потребує `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Завершити будь-який наявний слухач на вибраному порту перед запуском.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Докладні журнали.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показувати в консолі лише журнали бекенду CLI (і ввімкнути stdout/stderr).
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
  Шлях jsonl для сирого потоку.
</ParamField>

## Перезапуск Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` просить запущений Gateway попередньо перевірити активну роботу OpenClaw перед перезапуском. Якщо активні операції в черзі, доставлення відповідей, вбудовані запуски або запуски завдань, Gateway повідомляє про блокувальники, об’єднує дублікати запитів безпечного перезапуску та перезапускається, щойно активна робота завершиться. Звичайний `restart` зберігає наявну поведінку менеджера служб для сумісності. Використовуйте `--force` лише тоді, коли явно потрібен шлях негайного примусового перевизначення.

`openclaw gateway restart --safe --skip-deferral` виконує той самий скоординований перезапуск з урахуванням OpenClaw, що й `--safe`, але оминає бар’єр відкладання через активну роботу, тому Gateway ініціює перезапуск негайно навіть тоді, коли повідомлено про блокувальники. Використовуйте це як аварійний шлях оператора, коли відкладання заблоковане завислим запуском завдання, а сам `--safe` чекав би безкінечно. `--skip-deferral` потребує `--safe`.

<Warning>
Вбудований у командний рядок `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, змінним середовища або `gateway.auth.password`, підкріпленому SecretRef.
</Warning>

### Профілювання запуску

- Задайте `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати таймінги фаз під час запуску Gateway, зокрема затримку `eventLoopMax` для кожної фази та таймінги таблиць пошуку Plugin для індексу встановленого, реєстру маніфестів, планування запуску й роботи з мапою власників.
- Задайте `OPENCLAW_DIAGNOSTICS=timeline` з `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, щоб записати JSONL-хронологію діагностики запуску з максимально можливою повнотою для зовнішніх QA-обв’язок. Також можна ввімкнути прапорець через `diagnostics.flags: ["timeline"]` у конфігурації; шлях усе одно надається через середовище. Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити зразки циклу подій.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти продуктивність запуску Gateway. Бенчмарк записує перший вивід процесу, `/healthz`, `/readyz`, таймінги трасування запуску, затримку циклу подій і деталі таймінгів таблиць пошуку Plugin.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: зручний для читання людиною (з кольорами в TTY).
    - `--json`: машиночитний JSON (без стилізації/індикатора виконання).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши людинозручне компонування.

  </Tab>
  <Tab title="Спільні параметри">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: тайм-аут/бюджет (залежить від команди).
    - `--expect-final`: чекати на фінальну відповідь (виклики агента).

  </Tab>
</Tabs>

<Note>
Коли ви задаєте `--url`, CLI не повертається до облікових даних із конфігурації або середовища. Передайте `--token` або `--password` явно. Відсутність явних облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпойнт `/healthz` — це проба життєздатності: він повертається, щойно сервер може відповідати HTTP. HTTP-ендпойнт `/readyz` суворіший і залишається червоним, поки стартові сайдкари Plugin, канали або налаштовані хуки ще стабілізуються. Локальні або автентифіковані докладні відповіді готовності містять діагностичний блок `eventLoop` із затримкою циклу подій, використанням циклу подій, співвідношенням ядер CPU та прапорцем `degraded`.

### `gateway usage-cost`

Отримати з журналів сеансів підсумки usage-cost.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Кількість днів для включення.
</ParamField>

### `gateway stability`

Отримати нещодавні дані діагностичного реєстратора стабільності із запущеного Gateway.

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
  Включати лише події після діагностичного порядкового номера.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Читати збережений пакет стабільності замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану або передайте шлях до JSON-пакета напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати ZIP діагностики підтримки, придатний для поширення, замість виведення деталей стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфіденційність і поведінка пакета">
    - Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сеансу, назви каналів/Plugin і відредаговані підсумки сеансів. Вони не зберігають текст чату, тіла Webhook, вивід інструментів, сирі тіла запитів або відповідей, токени, cookie, секретні значення, імена хостів або сирі ідентифікатори сеансів. Задайте `diagnostics.enabled: false`, щоб повністю вимкнути реєстратор.
    - У разі фатальних виходів Gateway, тайм-аутів завершення роботи та збоїв запуску після перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли в реєстраторі є події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакета.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний ZIP діагностики, призначений для додавання до звітів про помилки. Щодо моделі конфіденційності та вмісту пакета див. [Експорт діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до ZIP виводу. За замовчуванням це експорт підтримки в каталозі стану.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальна кількість санітизованих рядків журналу для включення.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальна кількість байтів журналу для перевірки.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway для знімка стану здоров’я.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для знімка стану здоров’я.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для знімка стану здоров’я.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Тайм-аут знімка статусу/стану здоров’я.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого пакета стабільності.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести записаний шлях, розмір і маніфест як JSON.
</ParamField>

Експорт містить маніфест, підсумок Markdown, форму конфігурації, санітизовані деталі конфігурації, санітизовані підсумки журналів, санітизовані знімки статусу/стану здоров’я Gateway і найновіший пакет стабільності, якщо він існує.

Він призначений для поширення. Він зберігає операційні деталі, корисні для налагодження, як-от безпечні поля журналів OpenClaw, назви підсистем, коди статусів, тривалості, налаштовані режими, порти, ідентифікатори Plugin, ідентифікатори провайдерів, несекретні налаштування функцій і відредаговані операційні повідомлення журналу. Він пропускає або редагує текст чату, тіла Webhook, вивід інструментів, облікові дані, cookie, ідентифікатори облікових записів/повідомлень, текст промптів/інструкцій, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст корисного навантаження користувача/чату/інструмента, експорт зберігає лише факт, що повідомлення було пропущено, плюс кількість його байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливості підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додайте явну ціль для перевірки. Налаштовані віддалена ціль і localhost усе одно перевіряються.
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
  Пропустити перевірку підключення (подання лише служби).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати служби системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до перевірки читання й завершити роботу з ненульовим кодом, якщо ця перевірка читання не вдасться. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика стану">
    - `gateway status` залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Типова `gateway status` підтверджує стан служби, підключення WebSocket і можливість автентифікації, видиму під час рукостискання. Вона не підтверджує операції читання/запису/адміністрування.
    - Діагностичні перевірки не змінюють стан для першої автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис сполучення пристрою лише для читання тільки для перевірки стану.
    - `gateway status` за можливості розв’язує налаштовані auth SecretRefs для автентифікації перевірки.
    - Якщо потрібний auth SecretRef не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація перевірки не вдається; передайте `--token`/`--password` явно або спершу розв’яжіть джерело секрету.
    - Якщо перевірка успішна, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибних спрацювань.
    - Використовуйте `--require-rpc` у сценаріях і автоматизації, коли служби, що прослуховує, недостатньо й потрібно, щоб RPC-виклики з областю читання також були справними.
    - `--deep` додає найкращу доступну спробу сканування додаткових інсталяцій launchd/systemd/schtasks. Коли виявлено кілька служб, схожих на Gateway, вивід для людини друкує підказки з очищення й попереджає, що більшість налаштувань має запускати один Gateway на машину.
    - `--deep` також повідомляє про нещодавню передачу перезапуску супервізора Gateway, коли процес служби коректно завершився для перезапуску зовнішнім супервізором.
    - `--deep` виконує перевірку конфігурації в режимі з урахуванням Plugin (`pluginValidation: "full"`) і показує попередження налаштованого маніфесту Plugin (наприклад, відсутні метадані конфігурації каналу), щоб smoke-перевірки інсталяції й оновлення їх виявляли. Типова `gateway status` зберігає швидкий шлях лише для читання, який пропускає перевірку Plugin.
    - Вивід для людини містить розв’язаний шлях до файлового журналу, а також знімок шляхів/дійсності конфігурації CLI порівняно зі службою, щоб допомогти діагностувати розбіжність профілю або state-dir.

  </Accordion>
  <Accordion title="Перевірки розбіжності автентифікації Linux systemd">
    - В інсталяціях Linux systemd перевірки розбіжності автентифікації служби читають значення `Environment=` і `EnvironmentFile=` з unit (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами з `-`).
    - Перевірки розбіжності розв’язують `gateway.auth.token` SecretRefs за допомогою об’єднаного runtime env (спочатку env команди служби, потім резервно process env).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy` або mode не задано, де пароль може мати перевагу й жоден кандидат токена не може мати перевагу), перевірки token-drift пропускають розв’язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений Gateway (якщо задано), і
- localhost (loopback) **навіть якщо віддалену ціль налаштовано**.

Якщо передати `--url`, ця явна ціль додається перед обома. Вивід для людини позначає цілі так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька Gateway, команда друкує їх усі. Кілька Gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість інсталяцій усе одно запускає один Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла підключення WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що перевірка змогла підтвердити щодо автентифікації. Це окремо від доступності.
    - `Read probe: ok` означає, що RPC-виклики подробиць з областю читання (`health`/`status`/`system-presence`/`config.get`) також виконалися успішно.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення вдалося, але RPC з областю читання обмежено. Це повідомляється як **погіршена** доступність, а не повна помилка.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв WebSocket-з’єднання, але наступна діагностика читання перевищила час очікування або завершилася помилкою. Це також **погіршена** доступність, а не недоступний Gateway.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює початкову ідентичність пристрою або стан сполучення.
    - Код завершення ненульовий лише тоді, коли жодна перевірена ціль недоступна.

  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль прийняла підключення, але не завершила повну діагностику RPC з подробицями.
    - `capability`: найкраща можливість, побачена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштована віддалена ціль, потім local loopback.
    - `warnings[]`: записи попереджень best-effort з `code`, `message` і необов’язковими `targetIds`.
    - `network`: підказки URL local loopback/tailnet, отримані з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів виявлення, використані для цього проходу перевірки.

    Для кожної цілі (`targets[].connect`):

    - `ok`: доступність після підключення + класифікація погіршення.
    - `rpcOk`: повний успіх RPC з подробицями.
    - `scopeLimited`: RPC з подробицями не вдався через відсутню область оператора.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, якщо доступна.
    - `scopes`: надані області, повідомлені в `hello-ok`, якщо доступні.
    - `capability`: показана класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: налаштування SSH-тунелю не вдалося; команда повернулася до прямих перевірок.
    - `multiple_gateways`: доступною була більш ніж одна ціль; це незвично, якщо ви навмисно не запускаєте ізольовані профілі, як-от rescue bot.
    - `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося розв’язати для цілі з помилкою.
    - `probe_scope_limited`: підключення WebSocket вдалося, але перевірку читання було обмежено через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалений доступ через SSH (паритет із застосунком Mac)

Режим «Remote over SSH» у застосунку macOS використовує локальне перенаправлення порту, щоб віддалений Gateway (який може бути прив’язаний лише до loopback) став доступним за `ws://127.0.0.1:<port>`.

Еквівалент CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` або `user@host:port` (типовий порт — `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Файл ідентичності.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Вибрати перший виявлений хост Gateway як SSH-ціль із розв’язаної кінцевої точки виявлення (`local.` плюс налаштований wide-area домен, якщо є). Підказки лише TXT ігноруються.
</ParamField>

Конфігурація (необов’язкова, використовується як типові значення):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий помічник RPC.

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
  Переважно для RPC у стилі агентів, які транслюють проміжні події перед фінальним payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний вивід JSON.
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

### Інсталяція з wrapper

Використовуйте `--wrapper`, коли керована служба має запускатися через інший виконуваний файл, наприклад
shim менеджера секретів або помічник run-as. Wrapper отримує звичайні аргументи Gateway і
відповідає за те, щоб зрештою виконати `openclaw` або Node з цими аргументами.

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

Ви також можете задати wrapper через середовище. `gateway install` перевіряє, що шлях є
виконуваним файлом, записує wrapper у service `ProgramArguments` і зберігає
`OPENCLAW_WRAPPER` у середовищі служби для подальших примусових перевстановлень, оновлень і
виправлень doctor.

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
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Поведінка життєвого циклу">
    - Використовуйте `gateway restart`, щоб перезапустити керований сервіс. Не поєднуйте `gateway stop` і `gateway start` як заміну перезапуску.
    - У macOS `gateway stop` типово використовує `launchctl bootout`, що вилучає LaunchAgent з поточного сеансу завантаження без збереження вимкнення — автоматичне відновлення KeepAlive лишається активним для майбутніх збоїв, а `gateway start` повторно вмикається коректно без ручного `launchctl enable`. Передайте `--disable`, щоб постійно придушити KeepAlive і RunAtLoad, аби gateway не перезапускався до наступного явного `gateway start`; використовуйте це, коли ручна зупинка має пережити перезавантаження або перезапуски системи.
    - `gateway restart --safe` просить запущений Gateway попередньо перевірити активну роботу OpenClaw і відкласти перезапуск, доки доставка відповідей, вбудовані запуски та запуски завдань не завершаться. `--safe` не можна поєднувати з `--force` або `--wait`.
    - `gateway restart --wait 30s` перевизначає налаштований бюджет очікування завершення для цього перезапуску. Числа без одиниць вимірюються в мілісекундах; приймаються одиниці на кшталт `s`, `m` і `h`. `--wait 0` чекає безстроково.
    - `gateway restart --safe --skip-deferral` виконує безпечний перезапуск з урахуванням OpenClaw, але обходить шлюз відкладання, тож Gateway негайно видає перезапуск, навіть коли повідомлено про блокери. Операторський аварійний вихід для відкладань через завислі запуски завдань; потребує `--safe`.
    - `gateway restart --force` пропускає очікування завершення активної роботи й перезапускає негайно. Використовуйте це, коли оператор уже перевірив перелічені блокери завдань і хоче повернути gateway в роботу зараз.
    - Команди життєвого циклу приймають `--json` для сценаріїв.

  </Accordion>
  <Accordion title="Автентифікація та SecretRefs під час встановлення">
    - Коли автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища сервісу.
    - Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не розв’язується, встановлення завершується відмовою замість збереження резервного відкритого тексту.
    - Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
    - У режимі виведеної автентифікації лише оболонковий `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час встановлення; використовуйте довготривалу конфігурацію (`gateway.auth.password` або config `env`) під час встановлення керованого сервісу.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення блокується, доки режим не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише gateway з увімкненим виявленням Bonjour (типово) оголошують маяк.

Записи широкозонного виявлення містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти типово використовують SSH-цілі `22`, коли його немає)
- `tailnetDns` (ім’я хоста MagicDNS, коли доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленого встановлення, записана в широкозонну зону)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для команди (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний вивід (також вимикає стилізацію/індикатор).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований широкозонний домен, коли його ввімкнено.
- `wsUrl` у JSON-виводі отримується з розв’язаної кінцевої точки сервісу, а не з підказок лише TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS, `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` має значення `full`. Широкозонний DNS-SD усе одно записує `cliPath`; `sshPort` там також лишається необов’язковим.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Операційний посібник Gateway](/uk/gateway)
