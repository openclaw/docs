---
read_when:
    - Запуск Gateway із CLI (для розробки або серверів)
    - Налагодження автентифікації Gateway, режимів прив’язування та підключення
    - Виявлення Gateway через Bonjour (локальний + глобальний DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запускайте Gateway, надсилайте до них запити та виявляйте їх
title: Gateway
x-i18n:
    generated_at: "2026-04-29T18:58:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe53f1ec289bf463766634a9b03bc234e109fdddf35b3fa3958fb8c5255c81a9
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, hooks). Підкоманди на цій сторінці розміщені в `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + wide-area DNS-SD.
  </Card>
  <Card title="Discovery overview" href="/uk/gateway/discovery">
    Як OpenClaw оголошує та знаходить шлюзи.
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
    - За замовчуванням Gateway відмовляється запускатися, якщо `gateway.mode=local` не задано в `~/.openclaw/openclaw.json`. Використовуйте `--allow-unconfigured` для ad-hoc/dev запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та відновіть її, замість того щоб неявно припускати локальний режим.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється "вгадувати local" за вас.
    - Прив'язка за межами loopback без автентифікації заблокована (запобіжник безпеки).
    - `SIGUSR1` запускає перезапуск у межах процесу, коли це дозволено (`commands.restart` увімкнено за замовчуванням; задайте `commands.restart: false`, щоб заблокувати ручний перезапуск, при цьому застосування/оновлення інструментів і конфігурації Gateway залишаються дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес Gateway, але не відновлюють жодного користувацького стану термінала. Якщо ви обгортаєте CLI за допомогою TUI або введення в raw-mode, відновіть термінал перед виходом.

  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (значення за замовчуванням береться з конфігурації/env; зазвичай `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим прив'язки слухача.
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
  Надати доступ до Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скинути конфігурацію Tailscale serve/funnel під час завершення.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск Gateway без `gateway.mode=local` у конфігурації. Обходить запобіжник запуску лише для ad-hoc/dev початкового налаштування; не записує й не відновлює файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + робочу область, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути dev-конфігурацію + облікові дані + сесії + робочу область (потребує `--dev`).
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
  Стиль журналу Websocket.
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

<Warning>
Вбудований `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання запуску

- Задайте `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб записувати часові показники фаз під час запуску Gateway, зокрема затримку `eventLoopMax` для кожної фази та часові показники таблиць пошуку Plugin для installed-index, реєстру маніфестів, планування запуску та роботи owner-map.
- Задайте `OPENCLAW_DIAGNOSTICS=timeline` з `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, щоб записувати best-effort JSONL-хронологію діагностики запуску для зовнішніх QA harnesses. Ви також можете ввімкнути прапорець через `diagnostics.flags: ["timeline"]` у конфігурації; шлях усе одно надається через env. Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити зразки event-loop.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти швидкодію запуску Gateway. Benchmark записує перший вивід процесу, `/healthz`, `/readyz`, часові показники трасування запуску, затримку event-loop і деталі часових показників таблиць пошуку Plugin.

## Опитування запущеного Gateway

Усі команди опитування використовують WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - За замовчуванням: зручний для читання людиною формат (кольоровий у TTY).
    - `--json`: машинозчитуваний JSON (без стилізації/spinner).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігаючи людську розкладку.

  </Tab>
  <Tab title="Shared options">
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

HTTP endpoint `/healthz` — це liveness probe: він повертає відповідь, щойно сервер може відповідати через HTTP. HTTP endpoint `/readyz` суворіший і залишається червоним, доки startup sidecars, канали або налаштовані hooks ще стабілізуються. Локальні або автентифіковані докладні відповіді про готовність містять діагностичний блок `eventLoop` із затримкою event-loop, використанням event-loop, співвідношенням ядер CPU та прапорцем `degraded`.

### `gateway usage-cost`

Отримати підсумки usage-cost із журналів сесій.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Кількість днів для включення.
</ParamField>

### `gateway stability`

Отримати останній реєстратор діагностичної стабільності із запущеного Gateway.

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
  Читати збережений пакет стабільності замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану або передайте шлях до bundle JSON напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати придатний для поширення zip із діагностикою підтримки замість друку деталей стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам'яті, стан черги/сесії, назви каналів/Plugin і редаговані підсумки сесій. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookie, секретні значення, імена хостів або сирі ідентифікатори сесій. Задайте `diagnostics.enabled: false`, щоб повністю вимкнути реєстратор.
    - Під час фатальних завершень Gateway, тайм-аутів завершення та невдалих запусків після перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо реєстратор має події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакета.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip із діагностикою, призначений для додавання до звітів про помилки. Модель приватності та вміст пакета описано в [Diagnostics Export](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до zip виводу. За замовчуванням це export для підтримки в каталозі стану.
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
  Тайм-аут знімка status/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого пакета стабільності.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати записаний шлях, розмір і маніфест як JSON.
</ParamField>

Export містить маніфест, підсумок Markdown, форму конфігурації, очищені деталі конфігурації, очищені підсумки журналів, очищені знімки status/health Gateway і найновіший пакет стабільності, якщо він існує.

Його призначено для поширення. Він зберігає операційні деталі, що допомагають у налагодженні, як-от безпечні поля журналу OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, ідентифікатори Plugin, ідентифікатори провайдерів, несекретні налаштування функцій і редаговані операційні повідомлення журналу. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookie, ідентифікатори акаунтів/повідомлень, текст prompt/інструкцій, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст payload користувача/чату/інструмента, export зберігає лише факт, що повідомлення було пропущено, а також його кількість байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов'язкову перевірку можливості підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль перевірки. Налаштований віддалений + localhost усе одно перевіряються.
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
  Пропустити перевірку підключення (перегляд лише служби).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати служби системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до read probe і завершити з ненульовим кодом, якщо цей read probe не вдається. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика стану">
    - `gateway status` залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Типова `gateway status` підтверджує стан сервісу, підключення WebSocket і можливість автентифікації, видиму під час рукостискання. Вона не підтверджує операції читання/запису/адміністрування.
    - Діагностичні проби не змінюють стан для першої автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис сполучення пристрою лише для читання тільки для перевірки стану.
    - `gateway status` за можливості розвʼязує налаштовані SecretRefs автентифікації для автентифікації проби.
    - Якщо потрібний SecretRef автентифікації не розвʼязано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація проби завершується невдало; передайте `--token`/`--password` явно або спершу розвʼяжіть джерело секрету.
    - Якщо проба успішна, попередження про нерозвʼязані посилання автентифікації пригнічуються, щоб уникнути хибних спрацювань.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли сервісу, що прослуховує порт, недостатньо і вам також потрібні справні RPC-виклики з областю читання.
    - `--deep` додає найкращу можливу перевірку додаткових установок launchd/systemd/schtasks. Коли виявлено кілька сервісів, схожих на gateway, людський вивід друкує підказки щодо очищення й попереджає, що більшість конфігурацій мають запускати один gateway на машину.
    - Людський вивід містить розвʼязаний шлях до файлового журналу, а також знімок шляхів/чинності конфігурації CLI порівняно із сервісом, щоб допомогти діагностувати дрейф профілю або каталогу стану.

  </Accordion>
  <Accordion title="Перевірки дрейфу автентифікації Linux systemd">
    - В установках Linux systemd перевірки дрейфу автентифікації сервісу читають значення `Environment=` і `EnvironmentFile=` з unit-файлу (включно з `%h`, шляхами в лапках, кількома файлами та необовʼязковими файлами з `-`).
    - Перевірки дрейфу розвʼязують SecretRefs `gateway.auth.token` за допомогою обʼєднаного runtime env (спершу env команди сервісу, потім резервно process env).
    - Якщо токенна автентифікація фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не задано, де пароль може перемогти й жоден кандидат токена не може перемогти), перевірки дрейфу токена пропускають розвʼязання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди виконує проби:

- вашого налаштованого віддаленого gateway (якщо задано), і
- localhost (loopback) **навіть якщо налаштовано віддалений**.

Якщо передати `--url`, ця явна ціль додається перед обома. Людський вивід позначає цілі як:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька gateway, вона виведе їх усі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, рятувального бота), але більшість установок усе ж запускають один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла підключення WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що проба змогла підтвердити щодо автентифікації. Це окремо від доступності.
    - `Read probe: ok` означає, що детальні RPC-виклики з областю читання (`health`/`status`/`system-presence`/`config.get`) також успішні.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC з областю читання обмежено. Це повідомляється як **погіршена** доступність, а не повна відмова.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв підключення WebSocket, але подальша діагностика читання вичерпала час очікування або завершилася невдало. Це також **погіршена** доступність, а не недоступний Gateway.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює першу ідентичність пристрою або стан сполучення.
    - Код виходу ненульовий лише тоді, коли жодна перевірена ціль не доступна.

  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль прийняла підключення, але не завершила повну детальну RPC-діагностику.
    - `capability`: найкраща можливість, побачена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштований віддалений, потім local loopback.
    - `warnings[]`: записи попереджень за принципом найкращої спроби з `code`, `message` і необовʼязковими `targetIds`.
    - `network`: підказки URL local loopback/tailnet, отримані з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет виявлення/кількість результатів, використані для цього проходу проби.

    Для кожної цілі (`targets[].connect`):

    - `ok`: доступність після підключення + класифікація погіршення.
    - `rpcOk`: успіх повного детального RPC.
    - `scopeLimited`: детальний RPC завершився невдало через відсутню область оператора.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступно.
    - `scopes`: надані області, повідомлені в `hello-ok`, коли доступно.
    - `capability`: відображена класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: налаштування SSH-тунелю завершилося невдало; команда повернулася до прямих проб.
    - `multiple_gateways`: було доступно більше ніж одну ціль; це незвично, якщо ви навмисно не запускаєте ізольовані профілі, наприклад рятувального бота.
    - `auth_secretref_unresolved`: налаштований SecretRef автентифікації не вдалося розвʼязати для невдалої цілі.
    - `probe_scope_limited`: підключення WebSocket успішне, але пробу читання обмежено через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалений доступ через SSH (паритет застосунку Mac)

Режим застосунку macOS «Віддалений доступ через SSH» використовує локальне перенаправлення порту, тож віддалений gateway (який може бути привʼязаний лише до loopback) стає доступним за `ws://127.0.0.1:<port>`.

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
  Вибрати перший виявлений хост gateway як ціль SSH з розвʼязаної кінцевої точки виявлення (`local.` плюс налаштований широкозонний домен, якщо він є). Підказки лише TXT ігноруються.
</ParamField>

Конфігурація (необовʼязково, використовується як типові значення):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий помічник RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Рядок обʼєкта JSON для params.
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
  Переважно для RPC у стилі агентів, які транслюють проміжні події перед фінальним payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний вивід JSON.
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

### Установлення з обгорткою

Використовуйте `--wrapper`, коли керований сервіс має запускатися через інший виконуваний файл, наприклад shim менеджера секретів або помічник запуску від імені іншого користувача. Обгортка отримує звичайні аргументи Gateway і відповідає за те, щоб зрештою виконати `openclaw` або Node з цими аргументами.

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

Ви також можете задати обгортку через середовище. `gateway install` перевіряє, що шлях є виконуваним файлом, записує обгортку в `ProgramArguments` сервісу та зберігає `OPENCLAW_WRAPPER` у середовищі сервісу для подальших примусових перевстановлень, оновлень і виправлень doctor.

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
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Поведінка життєвого циклу">
    - Використовуйте `gateway restart`, щоб перезапустити керований сервіс. Не зʼєднуйте `gateway stop` і `gateway start` як заміну перезапуску; на macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.
    - Команди життєвого циклу приймають `--json` для скриптів.

  </Accordion>
  <Accordion title="Автентифікація й SecretRefs під час установлення">
    - Коли токенна автентифікація потребує токена, а `gateway.auth.token` керується SecretRef, `gateway install` перевіряє, що SecretRef можна розвʼязати, але не зберігає розвʼязаний токен у метаданих середовища сервісу.
    - Якщо токенна автентифікація потребує токена, а налаштований SecretRef токена не розвʼязано, установлення завершується закритою відмовою замість збереження резервного відкритого тексту.
    - Для парольної автентифікації в `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або підкріпленому SecretRef `gateway.auth.password` замість вбудованого `--password`.
    - У виведеному режимі автентифікації лише shell-змінна `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час установлення; використовуйте довговічну конфігурацію (`gateway.auth.password` або config `env`) під час установлення керованого сервісу.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки режим не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише gateway з увімкненим виявленням Bonjour (типово) рекламують маяк.

Записи широкозонного виявлення містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необовʼязково; клієнти за замовчуванням використовують SSH-цілі `22`, коли його немає)
- `tailnetDns` (імʼя хоста MagicDNS, коли доступно)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленого встановлення, записана в широкозонну зону)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Час очікування для команди (browse/resolve).
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
- CLI сканує `local.` разом із налаштованим широкозонним доменом, коли його ввімкнено.
- `wsUrl` у виводі JSON походить із визначеної кінцевої точки сервісу, а не з підказок лише TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` має значення `full`. Широкозонний DNS-SD все одно записує `cliPath`; `sshPort` там також залишається необов’язковим.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Операційний посібник Gateway](/uk/gateway)
