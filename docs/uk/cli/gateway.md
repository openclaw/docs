---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язування та підключення
    - Виявлення Gateway через Bonjour (локальний + широкозонний DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запуск, запити та виявлення шлюзів
title: Gateway
x-i18n:
    generated_at: "2026-04-28T20:56:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 25680abf3f6f32fe9a5eea846ce6223c0d82896b5ae0bc09ea6bd8403ac34cfd
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сеанси, хуки). Підкоманди на цій сторінці розміщені під `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Локальне налаштування mDNS + DNS-SD широкої зони.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw оголошує й знаходить шлюзи.
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

Псевдонім для переднього плану:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Поведінка під час запуску">
    - За замовчуванням Gateway відмовляється запускатися, якщо `gateway.mode=local` не задано в `~/.openclaw/openclaw.json`. Використовуйте `--allow-unconfigured` для спеціальних/dev-запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це зламаною або перезаписаною конфігурацією та виправте її замість того, щоб неявно припускати локальний режим.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється «вгадувати local» за вас.
    - Прив’язування за межами loopback без автентифікації заблоковане (захисне обмеження).
    - `SIGUSR1` запускає перезапуск у процесі, коли це дозволено (`commands.restart` увімкнено за замовчуванням; задайте `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як застосування/оновлення gateway tool/config залишаються дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден користувацький стан термінала. Якщо ви обгортаєте CLI за допомогою TUI або введення в raw-mode, відновіть термінал перед виходом.

  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (значення за замовчуванням береться з config/env; зазвичай `18789`).
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
  Читати пароль gateway з файлу.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Надати доступ до Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скидати конфігурацію Tailscale serve/funnel під час завершення роботи.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Оминає захист запуску лише для спеціального/dev bootstrap; не записує й не виправляє файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + робочий простір, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути dev-конфігурацію + облікові дані + сеанси + робочий простір (потребує `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Перед запуском завершити будь-який наявний слухач на вибраному порту.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Докладні журнали.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показувати в консолі лише журнали бекенду CLI (і ввімкнути stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Стиль журналу Websocket.
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

- Задайте `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати таймінги фаз під час запуску Gateway, включно із затримкою `eventLoopMax` для кожної фази та таймінгами таблиць пошуку Plugin для installed-index, manifest registry, startup planning і owner-map.
- Виконайте `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти продуктивність запуску Gateway. Бенчмарк записує перший вивід процесу, `/healthz`, `/readyz`, таймінги трасування запуску, затримку event-loop і деталі таймінгу таблиць пошуку Plugin.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: зручний для читання людиною (кольоровий у TTY).
    - `--json`: машинозчитуваний JSON (без стилізації/індикатора).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігаючи людський макет.

  </Tab>
  <Tab title="Спільні параметри">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: таймаут/бюджет (залежить від команди).
    - `--expect-final`: чекати на відповідь "final" (виклики агента).

  </Tab>
</Tabs>

<Note>
Коли ви задаєте `--url`, CLI не повертається до облікових даних із конфігурації або середовища. Передайте `--token` або `--password` явно. Відсутність явних облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпоінт `/healthz` — це перевірка життєздатності: він повертає відповідь, щойно сервер може відповідати через HTTP. HTTP-ендпоінт `/readyz` суворіший і залишається червоним, доки startup sidecars, канали або налаштовані хуки ще стабілізуються. Локальні або автентифіковані докладні відповіді готовності містять діагностичний блок `eventLoop` із затримкою event-loop, використанням event-loop, співвідношенням ядер CPU та прапорцем `degraded`.

### `gateway usage-cost`

Отримати підсумки usage-cost із журналів сеансів.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Кількість днів для включення.
</ParamField>

### `gateway stability`

Отримати нещодавній діагностичний recorder стабільності із запущеного Gateway.

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
  Фільтрувати за типом діагностичної події, як-от `payload.large` або `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включати лише події після номера діагностичної послідовності.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Читати збережений пакет стабільності замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану або передайте шлях до JSON пакета напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати придатний для поширення zip із діагностикою підтримки замість друку деталей стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Приватність і поведінка пакетів">
    - Записи зберігають операційні метадані: назви подій, кількості, розміри в байтах, показники пам’яті, стан черги/сеансу, назви каналів/Plugin і редаговані підсумки сеансів. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies, секретні значення, імена хостів або сирі ідентифікатори сеансів. Задайте `diagnostics.enabled: false`, щоб повністю вимкнути recorder.
    - Під час фатальних завершень Gateway, таймаутів завершення роботи та збоїв запуску після перезапуску OpenClaw записує той самий діагностичний знімок до `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли recorder має події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакета.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip із діагностикою, призначений для додавання до звітів про помилки. Модель приватності та вміст пакета описано в [Експорт діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до zip виводу. За замовчуванням це експорт підтримки в каталозі стану.
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
  Таймаут знімка status/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого пакета стабільності.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести записаний шлях, розмір і manifest як JSON.
</ParamField>

Експорт містить manifest, підсумок Markdown, форму конфігурації, санітизовані деталі конфігурації, санітизовані підсумки журналів, санітизовані знімки status/health Gateway і найновіший пакет стабільності, якщо він існує.

Він призначений для поширення. Він зберігає операційні деталі, які допомагають у налагодженні, як-от безпечні поля журналів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, ідентифікатори Plugin, ідентифікатори провайдерів, несекретні налаштування функцій і редаговані операційні повідомлення журналу. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookies, ідентифікатори облікових записів/повідомлень, текст prompt/instruction, імена хостів і секретні значення. Коли повідомлення в стилі LogTape схоже на текст payload користувача/чату/інструмента, експорт зберігає лише факт, що повідомлення було пропущено, разом із його кількістю байтів.

### `gateway status`

`gateway status` показує сервіс Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку connectivity/auth capability.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль перевірки. Налаштований remote + localhost усе ще перевіряються.
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
  Пропустити перевірку підключення (подання лише сервісу).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати сервіси системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до перевірки читання та завершитися з ненульовим кодом, коли ця перевірка читання не вдається. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика стану">
    - `gateway status` залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Стандартна `gateway status` перевіряє стан служби, підключення WebSocket і можливість автентифікації, видиму під час handshake. Вона не перевіряє операції читання/запису/адміністрування.
    - Діагностичні проби не змінюють стан для першої автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис спарювання пристрою лише для читання тільки для перевірки стану.
    - `gateway status` за можливості розв’язує налаштовані auth SecretRefs для автентифікації проби.
    - Якщо потрібний auth SecretRef не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація проби не вдається; передайте `--token`/`--password` явно або спершу розв’яжіть джерело секрету.
    - Якщо проба успішна, попередження про нерозв’язані auth-ref придушуються, щоб уникнути хибних спрацювань.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли служби, що прослуховує порт, недостатньо і потрібно, щоб RPC-виклики з областю читання також були справними.
    - `--deep` додає best-effort сканування додаткових установлень launchd/systemd/schtasks. Коли виявлено кілька gateway-подібних служб, людський вивід друкує підказки з очищення та попереджає, що більшість конфігурацій мають запускати один Gateway на машину.
    - Людський вивід містить розв’язаний шлях до файлового журналу, а також знімок шляхів/чинності конфігурацій CLI та служби, щоб допомогти діагностувати розбіжність профілю або state-dir.

  </Accordion>
  <Accordion title="Перевірки auth-drift для Linux systemd">
    - В установленнях Linux systemd перевірки розбіжності автентифікації служби читають значення `Environment=` і `EnvironmentFile=` з unit (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами з `-`).
    - Перевірки розбіжності розв’язують SecretRefs `gateway.auth.token` за допомогою об’єднаного runtime env (спочатку env команди служби, потім process env як fallback).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy` або mode не встановлено, коли пароль може перемогти і жоден кандидат токена не може перемогти), перевірки token-drift пропускають розв’язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди виконує проби:

- вашого налаштованого віддаленого Gateway (якщо задано), і
- localhost (loopback) **навіть якщо налаштовано віддалений**.

Якщо передати `--url`, ця явна ціль додається перед обома. Людський вивід позначає цілі як:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька Gateway, команда виведе їх усі. Кілька Gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, рятувального бота), але більшість установлень усе одно запускають один Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-підключення.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що проба змогла підтвердити щодо автентифікації. Це окремо від досяжності.
    - `Read probe: ok` означає, що детальні RPC-виклики з областю читання (`health`/`status`/`system-presence`/`config.get`) також успішні.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC з областю читання обмежено. Це повідомляється як **погіршена** досяжність, а не повна помилка.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв WebSocket-з’єднання, але подальша діагностика читання вичерпала час або зазнала помилки. Це також **погіршена** досяжність, а не недосяжний Gateway.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює першу ідентичність пристрою або стан спарювання.
    - Код виходу ненульовий лише тоді, коли жодна перевірена ціль недосяжна.

  </Accordion>
  <Accordion title="JSON-вивід">
    Верхній рівень:

    - `ok`: принаймні одна ціль досяжна.
    - `degraded`: принаймні одна ціль прийняла підключення, але не завершила повну детальну RPC-діагностику.
    - `capability`: найкраща можливість, побачена серед досяжних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштований віддалений, потім local loopback.
    - `warnings[]`: best-effort записи попереджень із `code`, `message` і необов’язковими `targetIds`.
    - `network`: local loopback/tailnet URL-підказки, отримані з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів виявлення, використані для цього проходу проби.

    Для кожної цілі (`targets[].connect`):

    - `ok`: досяжність після підключення + класифікація погіршення.
    - `rpcOk`: повний успіх детальних RPC.
    - `scopeLimited`: детальний RPC не вдався через відсутність operator scope.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, якщо доступна.
    - `scopes`: надані scopes, повідомлені в `hello-ok`, якщо доступні.
    - `capability`: показана класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: налаштування SSH-тунелю не вдалося; команда повернулася до прямих проб.
    - `multiple_gateways`: досяжною була більш ніж одна ціль; це незвично, якщо ви навмисно не запускаєте ізольовані профілі, наприклад рятувального бота.
    - `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося розв’язати для невдалої цілі.
    - `probe_scope_limited`: WebSocket-підключення успішне, але пробу читання обмежено через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалено через SSH (паритет з Mac app)

Режим macOS app "Remote over SSH" використовує локальне перенаправлення порту, щоб віддалений Gateway (який може бути прив’язаний лише до loopback) став доступним на `ws://127.0.0.1:<port>`.

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
  Вибрати перший виявлений gateway-хост як SSH-ціль із розв’язаного discovery endpoint (`local.` плюс налаштований wide-area домен, якщо є). Підказки лише TXT ігноруються.
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
  Переважно для agent-style RPC, які перед фінальним payload транслюють проміжні події.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний JSON-вивід.
</ParamField>

<Note>
`--params` має бути коректним JSON.
</Note>

## Керування службою Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Установлення з wrapper

Використовуйте `--wrapper`, коли керована служба має запускатися через інший виконуваний файл, наприклад
secrets manager shim або run-as helper. Wrapper отримує звичайні аргументи Gateway і
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

Також можна задати wrapper через середовище. `gateway install` перевіряє, що шлях є
виконуваним файлом, записує wrapper у service `ProgramArguments` і зберігає
`OPENCLAW_WRAPPER` у середовищі служби для подальших примусових перевстановлень, оновлень і doctor
repairs.

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
    - Використовуйте `gateway restart`, щоб перезапустити керовану службу. Не ланцюжте `gateway stop` і `gateway start` як заміну перезапуску; на macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.
    - Команди життєвого циклу приймають `--json` для скриптів.

  </Accordion>
  <Accordion title="Auth і SecretRefs під час установлення">
    - Коли автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища служби.
    - Якщо автентифікація токеном потребує токена, а налаштований токен SecretRef не розв’язано, установлення завершується закритою помилкою замість збереження fallback plaintext.
    - Для автентифікації паролем у `gateway run` віддавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість inline `--password`.
    - В inferred auth mode shell-only `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час установлення; використовуйте durable config (`gateway.auth.password` або config `env`) під час установлення керованої служби.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки mode не буде встановлено явно.

  </Accordion>
</AccordionGroup>

## Виявлення Gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише Gateway з увімкненим Bonjour discovery (за замовчуванням) рекламують маяк.

Записи Wide-Area discovery містять (TXT):

- `role` (підказка ролі Gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (WebSocket-порт, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти за замовчуванням використовують SSH-цілі з `22`, коли його немає)
- `tailnetDns` (MagicDNS hostname, коли доступно)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка remote-install, записана у wide-area зону)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для команди (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний вивід (також вимикає стилізацію/spinner).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований глобальний домен, коли його ввімкнено.
- `wsUrl` у виводі JSON походить від розв’язаного кінцевого пункту сервісу, а не від підказок лише з TXT, як-от `lanHost` або `tailnetDns`.
- У `local.` mDNS `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` має значення `full`. Глобальний DNS-SD і далі записує `cliPath`; `sshPort` там також залишається необов’язковим.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Операційна інструкція Gateway](/uk/gateway)
