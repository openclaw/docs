---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення Gateway через Bonjour (локальний + широкозонний DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запускайте, опитуйте та виявляйте Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-01T07:53:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 127a6ccb4baa1ad5e5051db0bc7ef0ed30d410c4c3d13f36356483a6e03dce4c
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сеанси, хуки). Підкоманди на цій сторінці розміщені в `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + глобального DNS-SD.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw оголошує та знаходить Gateway.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration">
    Ключі конфігурації Gateway верхнього рівня.
  </Card>
</CardGroup>

## Запустити Gateway

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
    - За замовчуванням Gateway відмовляється запускатися, якщо `gateway.mode=local` не задано в `~/.openclaw/openclaw.json`. Використовуйте `--allow-unconfigured` для разових/dev-запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та відновіть її, замість того щоб неявно припускати локальний режим.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway розцінює це як підозріле пошкодження конфігурації та відмовляється "вгадувати local" за вас.
    - Прив’язування поза loopback без автентифікації заблоковано (захисний запобіжник).
    - `SIGUSR1` запускає перезапуск у межах процесу, коли це дозволено (`commands.restart` увімкнено за замовчуванням; задайте `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як застосування/оновлення інструмента й конфігурації Gateway залишаються дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жодного користувацького стану термінала. Якщо ви обгортаєте CLI за допомогою TUI або вводу в raw-режимі, відновіть термінал перед виходом.

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
  Зчитати пароль Gateway з файлу.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Відкрити доступ до Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скинути конфігурацію Tailscale serve/funnel під час завершення роботи.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить захист запуску лише для разового/dev-бутстрапу; не записує й не відновлює файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + робочий простір, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути dev-конфігурацію + облікові дані + сеанси + робочий простір (потребує `--dev`).
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
  Стиль журналювання Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Псевдонім для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Записувати сирі події потоку моделі до jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях до jsonl сирого потоку.
</ParamField>

<Warning>
Вбудований `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання запуску

- Задайте `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати таймінги фаз під час запуску Gateway, включно із затримкою `eventLoopMax` для кожної фази та таймінгами таблиць пошуку Plugin для installed-index, реєстру маніфестів, планування запуску й роботи owner-map.
- Задайте `OPENCLAW_DIAGNOSTICS=timeline` разом із `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, щоб записувати best-effort JSONL-хронологію діагностики запуску для зовнішніх QA-обв’язок. Також можна ввімкнути прапорець через `diagnostics.flags: ["timeline"]` у конфігурації; шлях усе одно надається через env. Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити зразки event-loop.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти швидкодію запуску Gateway. Бенчмарк фіксує перший вивід процесу, `/healthz`, `/readyz`, таймінги трасування запуску, затримку event-loop і деталі таймінгів таблиць пошуку Plugin.

## Опитати запущений Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: зручно для читання людиною (кольоровий у TTY).
    - `--json`: машинно-читаний JSON (без стилізації/спінера).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши людський макет.

  </Tab>
  <Tab title="Спільні параметри">
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

HTTP-ендпойнт `/healthz` — це liveness probe: він повертає відповідь, щойно сервер може відповідати HTTP. HTTP-ендпойнт `/readyz` суворіший і залишається червоним, поки runtime-залежності Plugin під час запуску, sidecar-процеси, канали або налаштовані хуки ще стабілізуються. Локальні або автентифіковані докладні відповіді готовності включають діагностичний блок `eventLoop` із затримкою event-loop, використанням event-loop, співвідношенням ядер CPU та прапорцем `degraded`.

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

Отримати нещодавній діагностичний реєстратор стабільності із запущеного Gateway.

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
  Читати збережений пакет стабільності замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану або передайте шлях до JSON пакета напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати спільний zip-файл діагностики підтримки замість друку деталей стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Приватність і поведінка пакетів">
    - Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сеансів, назви каналів/Plugin і відредаговані зведення сеансів. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookie, секретні значення, імена хостів або сирі ідентифікатори сеансів. Задайте `diagnostics.enabled: false`, щоб повністю вимкнути реєстратор.
    - Під час фатальних завершень Gateway, таймаутів завершення роботи та збоїв запуску після перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли реєстратор має події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакета.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip-файл діагностики, призначений для додавання до звітів про помилки. Модель приватності та вміст пакета див. у [Експорті діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до zip-файлу виводу. За замовчуванням — експорт підтримки в каталозі стану.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальна кількість очищених рядків журналу для включення.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальна кількість байтів журналу для перевірки.
</ParamField>
<ParamField path="--url <url>" type="string">
  WebSocket URL Gateway для знімка health.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для знімка health.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для знімка health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Таймаут знімка status/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого пакета стабільності.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати записаний шлях, розмір і маніфест як JSON.
</ParamField>

Експорт містить маніфест, зведення Markdown, форму конфігурації, очищені деталі конфігурації, очищені зведення журналів, очищені знімки status/health Gateway і найновіший пакет стабільності, якщо він існує.

Він призначений для спільного використання. Він зберігає операційні деталі, що допомагають із налагодженням, як-от безпечні поля журналів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, ідентифікатори Plugin, ідентифікатори провайдерів, несекретні налаштування функцій і відредаговані операційні повідомлення журналів. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookie, ідентифікатори облікових записів/повідомлень, текст prompt/інструкцій, імена хостів і секретні значення. Коли повідомлення в стилі LogTape схоже на текст payload користувача/чату/інструмента, експорт зберігає лише те, що повідомлення було пропущено, разом із кількістю байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливості підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль перевірки. Налаштований віддалений вузол + localhost усе одно перевіряються.
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
  Пропустити перевірку підключення (перегляд лише служби).
</ParamField>
<ParamField path="--deep" type="boolean">
  Сканувати також служби системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до перевірки читання та завершитися з ненульовим кодом, якщо ця перевірка читання не вдається. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` залишається доступним для діагностики, навіть якщо локальна конфігурація CLI відсутня або недійсна.
    - Типовий `gateway status` підтверджує стан служби, підключення WebSocket і можливість автентифікації, видиму під час рукостискання. Він не підтверджує операції читання/запису/адміністрування.
    - Діагностичні перевірки не змінюють стан для первинної автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис сполучення пристрою лише для читання тільки для перевірки статусу.
    - `gateway status` за можливості розв’язує налаштовані SecretRefs автентифікації для автентифікації перевірки.
    - Якщо потрібний SecretRef автентифікації не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація перевірки не вдається; передайте `--token`/`--password` явно або спочатку розв’яжіть джерело секрету.
    - Якщо перевірка успішна, попередження про нерозв’язані посилання автентифікації приглушуються, щоб уникнути хибних спрацювань.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли служби, що прослуховується, недостатньо й потрібно, щоб RPC-виклики з областю читання також були справними.
    - `--deep` додає найкращу можливу перевірку додаткових установлень launchd/systemd/schtasks. Коли виявлено кілька служб, схожих на Gateway, вивід для людини друкує підказки з очищення та попереджає, що більшість конфігурацій мають запускати один Gateway на машину.
    - Вивід для людини містить розв’язаний шлях до файлового журналу, а також знімок шляхів/чинності конфігурації CLI порівняно зі службою, щоб допомогти діагностувати розбіжності профілю або каталогу стану.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - В установленнях Linux systemd перевірки розбіжності автентифікації служби читають значення `Environment=` і `EnvironmentFile=` з юніта (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами `-`).
    - Перевірки розбіжності розв’язують SecretRefs `gateway.auth.token` за допомогою об’єднаного runtime-середовища (спочатку середовище команди служби, потім резервно середовище процесу).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy` або режим не задано, коли пароль може мати перевагу й жоден кандидат токена не може мати перевагу), перевірки розбіжності токена пропускають розв’язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (loopback) **навіть якщо віддалений gateway налаштовано**.

Якщо передати `--url`, ця явна ціль додається перед обома. Вивід для людини позначає цілі так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька gateway, команда друкує їх усі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, аварійного бота), але більшість установлень усе одно запускають один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла підключення WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що перевірка змогла підтвердити щодо автентифікації. Це окремо від доступності.
    - `Read probe: ok` означає, що RPC-виклики деталей з областю читання (`health`/`status`/`system-presence`/`config.get`) також успішні.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC з областю читання обмежений. Це повідомляється як **погіршена** доступність, а не повна помилка.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв підключення WebSocket, але подальша діагностика читання перевищила час очікування або завершилася помилкою. Це також **погіршена** доступність, а не недоступний Gateway.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює первинну ідентичність пристрою або стан сполучення.
    - Код виходу ненульовий лише тоді, коли жодна перевірена ціль недоступна.

  </Accordion>
  <Accordion title="JSON output">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль прийняла підключення, але не завершила повну RPC-діагностику деталей.
    - `capability`: найкраща можливість, побачена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштований віддалений gateway, потім local loopback.
    - `warnings[]`: записи попереджень за принципом найкращої спроби з `code`, `message` і необов’язковими `targetIds`.
    - `network`: підказки URL local loopback/tailnet, виведені з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет виявлення/кількість результатів, використані для цього проходу перевірки.

    Для кожної цілі (`targets[].connect`):

    - `ok`: доступність після підключення + класифікація погіршення.
    - `rpcOk`: повний успіх RPC деталей.
    - `scopeLimited`: RPC деталей не вдалося через відсутню область оператора.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступна.
    - `scopes`: надані області, повідомлені в `hello-ok`, коли доступні.
    - `capability`: показана класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: не вдалося налаштувати SSH-тунель; команда повернулася до прямих перевірок.
    - `multiple_gateways`: доступна більш ніж одна ціль; це незвично, якщо ви навмисно не запускаєте ізольовані профілі, наприклад аварійного бота.
    - `auth_secretref_unresolved`: налаштований SecretRef автентифікації не вдалося розв’язати для цілі з помилкою.
    - `probe_scope_limited`: підключення WebSocket успішне, але перевірку читання обмежено через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалений доступ через SSH (паритет із програмою Mac)

Режим програми macOS «Віддалений доступ через SSH» використовує локальне перенаправлення порту, тож віддалений gateway (який може бути прив’язаний лише до loopback) стає доступним за `ws://127.0.0.1:<port>`.

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
  Вибирає перший виявлений хост gateway як ціль SSH з розв’язаного кінцевого пункту виявлення (`local.` плюс налаштований домен широкої зони, якщо є). Підказки лише TXT ігноруються.
</ParamField>

Конфігурація (необов’язково, використовується як типові значення):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий RPC-помічник.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Рядок JSON-об’єкта для параметрів.
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
  Бюджет часу очікування.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Переважно для RPC у стилі агентів, які транслюють проміжні події перед фінальним корисним навантаженням.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний вивід JSON.
</ParamField>

<Note>
`--params` має бути чинним JSON.
</Note>

## Керуйте службою Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Установлення з wrapper

Використовуйте `--wrapper`, коли керована служба має запускатися через інший виконуваний файл, наприклад shim менеджера секретів або помічник запуску від імені іншого користувача. Wrapper отримує звичайні аргументи Gateway і відповідає за те, щоб зрештою виконати `openclaw` або Node з цими аргументами.

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

Ви також можете задати wrapper через середовище. `gateway install` перевіряє, що шлях є виконуваним файлом, записує wrapper у `ProgramArguments` служби та зберігає `OPENCLAW_WRAPPER` у середовищі служби для подальших примусових перевстановлень, оновлень і виправлень doctor.

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
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Використовуйте `gateway restart`, щоб перезапустити керовану службу. Не ланцюжте `gateway stop` і `gateway start` як заміну перезапуску; у macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.
    - Команди життєвого циклу приймають `--json` для скриптів.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Коли автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища служби.
    - Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена нерозв’язаний, установлення завершується закритою помилкою замість збереження резервного відкритого тексту.
    - Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
    - У виведеному режимі автентифікації лише shell-змінна `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час установлення; використовуйте тривку конфігурацію (`gateway.auth.password` або `env` конфігурації) під час установлення керованої служби.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки режим не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише gateway з увімкненим виявленням Bonjour (типово) рекламують маяк.

Записи виявлення Wide-Area містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, напр. `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти типово використовують SSH-цілі `22`, коли його немає)
- `tailnetDns` (ім’я хоста MagicDNS, коли доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленого встановлення, записана в зону широкої області)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Час очікування для команди (перегляд/розв’язання).
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний вивід (також вимикає стилі/індикатор завантаження).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований домен широкої зони, коли його увімкнено.
- `wsUrl` у виводі JSON походить із визначеної кінцевої точки сервісу, а не з підказок лише з TXT, як-от `lanHost` або `tailnetDns`.
- У `local.` mDNS `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` має значення `full`. DNS-SD широкої зони все одно записує `cliPath`; `sshPort` там також залишається необов’язковим.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Операційний посібник Gateway](/uk/gateway)
