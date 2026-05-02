---
read_when:
    - Запуск Gateway з CLI (для розробки або серверів)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення Gateway через Bonjour (локальний + широкозонний DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запуск, запити та виявлення Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-02T21:59:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сеанси, hooks). Підкоманди на цій сторінці розміщені під `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + глобального DNS-SD.
  </Card>
  <Card title="Discovery overview" href="/uk/gateway/discovery">
    Як OpenClaw оголошує та знаходить gateways.
  </Card>
  <Card title="Configuration" href="/uk/gateway/configuration">
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
  <Accordion title="Startup behavior">
    - За замовчуванням Gateway відмовляється запускатися, якщо `gateway.mode=local` не встановлено в `~/.openclaw/openclaw.json`. Використовуйте `--allow-unconfigured` для тимчасових/dev-запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, розглядайте це як зламану або перезаписану конфігурацію та виправляйте її, а не припускайте локальний режим неявно.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється "вгадувати local" за вас.
    - Прив'язування за межами loopback без автентифікації заблоковано (захисне обмеження).
    - `SIGUSR1` запускає перезапуск у процесі, коли це дозволено (`commands.restart` увімкнено за замовчуванням; встановіть `commands.restart: false`, щоб заблокувати ручний перезапуск, при цьому gateway tool/config apply/update залишаються дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден користувацький стан термінала. Якщо ви обгортаєте CLI за допомогою TUI або вводу в raw-режимі, відновіть термінал перед виходом.

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
  Перевизначення токена (також встановлює `OPENCLAW_GATEWAY_TOKEN` для процесу).
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
  Скинути конфігурацію Tailscale serve/funnel під час завершення.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить захисну перевірку запуску лише для тимчасового/dev bootstrap; не записує і не виправляє файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + робочий простір, якщо вони відсутні (пропускає BOOTSTRAP.md).
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
  Стиль журналу Websocket.
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

<Warning>
Inline `--password` може бути видно в локальних списках процесів. Віддавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання запуску

- Встановіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб записувати таймінги фаз під час запуску Gateway, зокрема затримку `eventLoopMax` для кожної фази та таймінги таблиці пошуку Plugin для installed-index, manifest registry, startup planning і owner-map.
- Встановіть `OPENCLAW_DIAGNOSTICS=timeline` з `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, щоб записувати best-effort JSONL-таймлайн діагностики запуску для зовнішніх QA harnesses. Ви також можете ввімкнути прапорець через `diagnostics.flags: ["timeline"]` у конфігурації; шлях усе одно надається через env. Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити зразки event-loop.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти продуктивність запуску Gateway. Бенчмарк записує перший вивід процесу, `/healthz`, `/readyz`, таймінги трасування запуску, затримку event-loop і деталі таймінгів таблиці пошуку Plugin.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - За замовчуванням: зручно для читання людиною (кольорово в TTY).
    - `--json`: машиночитний JSON (без стилізації/spinner).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши людське компонування.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: WebSocket URL Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: таймаут/бюджет (залежить від команди).
    - `--expect-final`: чекати на "final" відповідь (виклики agent).

  </Tab>
</Tabs>

<Note>
Коли ви встановлюєте `--url`, CLI не повертається до облікових даних із конфігурації або середовища. Передайте `--token` або `--password` явно. Відсутність явних облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP endpoint `/healthz` є перевіркою живучості: він повертає відповідь, щойно сервер може відповідати HTTP. HTTP endpoint `/readyz` суворіший і залишається червоним, доки стартові sidecars Plugin, канали або налаштовані hooks ще стабілізуються. Локальні або автентифіковані докладні відповіді готовності містять діагностичний блок `eventLoop` із затримкою event-loop, утилізацією event-loop, співвідношенням ядер CPU та прапорцем `degraded`.

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

Отримати нещодавній diagnostic stability recorder із запущеного Gateway.

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
  Включати лише події після діагностичного sequence number.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Читати збережений stability bundle замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого bundle у каталозі стану або передайте шлях до bundle JSON напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати придатний для поширення zip із діагностикою підтримки замість друку деталей стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам'яті, стан черг/сеансів, назви каналів/Plugin і редаговані зведення сеансів. Вони не зберігають текст чату, тіла Webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies, secret values, hostnames або сирі session ids. Встановіть `diagnostics.enabled: false`, щоб повністю вимкнути recorder.
    - Під час фатальних завершень Gateway, таймаутів завершення та збоїв перезапуску під час запуску OpenClaw записує той самий діагностичний snapshot у `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли recorder має події. Перегляньте найновіший bundle за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip із діагностикою, призначений для додавання до звітів про помилки. Про модель приватності та вміст bundle див. [Експорт діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до zip виводу. За замовчуванням використовується support export у каталозі стану.
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
  Пропустити пошук збереженого stability bundle.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати записаний шлях, розмір і manifest як JSON.
</ParamField>

Експорт містить manifest, Markdown-зведення, форму конфігурації, санітизовані деталі конфігурації, санітизовані зведення журналів, санітизовані snapshots статусу/здоров'я Gateway і найновіший stability bundle, якщо він існує.

Його призначено для поширення. Він зберігає операційні деталі, що допомагають налагодженню, як-от безпечні поля журналу OpenClaw, назви підсистем, коди статусу, тривалості, налаштовані режими, порти, plugin ids, provider ids, не секретні налаштування функцій і редаговані операційні повідомлення журналу. Він пропускає або редагує текст чату, тіла Webhook, виводи інструментів, облікові дані, cookies, ідентифікатори облікових записів/повідомлень, текст prompts/інструкцій, hostnames і secret values. Коли повідомлення у стилі LogTape виглядає як текст payload користувача/чату/інструмента, експорт зберігає лише факт, що повідомлення було пропущено, плюс його кількість байтів.

### `gateway status`

`gateway status` показує сервіс Gateway (launchd/systemd/schtasks) плюс необов'язкову перевірку можливостей підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль перевірки. Налаштований remote + localhost усе одно перевіряються.
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
  Пропустити перевірку підключення (перегляд лише сервісу).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати системні сервіси.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до read probe і завершитися з ненульовим кодом, коли ця read probe не вдається. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статусу">
    - `gateway status` залишається доступним для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Типовий `gateway status` підтверджує стан сервісу, підключення WebSocket і можливість автентифікації, видиму під час handshake. Він не підтверджує операції читання/запису/адміністрування.
    - Діагностичні перевірки не змінюють стан для первинної автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис read-only pairing пристрою лише для перевірки статусу.
    - `gateway status` за можливості розв’язує налаштовані SecretRefs автентифікації для автентифікації перевірки.
    - Якщо обов’язковий SecretRef автентифікації не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація перевірки не вдається; передайте `--token`/`--password` явно або спершу розв’яжіть джерело секрету.
    - Якщо перевірка успішна, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибних спрацьовувань.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли сервісу, що слухає, недостатньо й потрібно, щоб RPC-виклики зі scope читання також були справними.
    - `--deep` додає best-effort сканування додаткових інсталяцій launchd/systemd/schtasks. Коли виявлено кілька gateway-подібних сервісів, вивід для людини друкує підказки з очищення й попереджає, що більшість конфігурацій мають запускати один Gateway на машину.
    - Вивід для людини містить розв’язаний шлях до файлового журналу, а також знімок шляхів/чинності конфігурацій CLI і сервісу, щоб допомогти діагностувати розходження профілю або state-dir.

  </Accordion>
  <Accordion title="Перевірки auth-drift у Linux systemd">
    - В інсталяціях Linux systemd перевірки розходження автентифікації сервісу читають значення `Environment=` і `EnvironmentFile=` з unit (включно з `%h`, шляхами в лапках, кількома файлами й необов’язковими файлами `-`).
    - Перевірки розходження розв’язують SecretRefs `gateway.auth.token` за допомогою об’єднаного runtime env (спочатку env команди сервісу, потім резервно process env).
    - Якщо токенна автентифікація фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не задано, де пароль може перемогти й жоден кандидат токена не може перемогти), перевірки token-drift пропускають розв’язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений Gateway (якщо задано), і
- localhost (loopback) **навіть якщо віддалений Gateway налаштовано**.

Якщо передати `--url`, ціль, задана явно, додається перед обома. Вивід для людини позначає цілі як:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька Gateway, команда виводить їх усі. Кілька Gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість інсталяцій усе ж запускають один Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Тлумачення">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-підключення.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що перевірка змогла підтвердити щодо автентифікації. Це окремо від досяжності.
    - `Read probe: ok` означає, що RPC-виклики деталей зі scope читання (`health`/`status`/`system-presence`/`config.get`) також виконалися успішно.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC зі scope читання обмежено. Це повідомляється як **погіршена** досяжність, а не повний збій.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв WebSocket-з’єднання, але подальша діагностика читання вичерпала час очікування або зазнала збою. Це також **погіршена** досяжність, а не недосяжний Gateway.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює первинну ідентичність пристрою або стан pairing.
    - Код виходу ненульовий лише тоді, коли жодна перевірена ціль не є досяжною.

  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль досяжна.
    - `degraded`: принаймні одна ціль прийняла з’єднання, але не завершила повну детальну RPC-діагностику.
    - `capability`: найкраща можливість, побачена серед досяжних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштований віддалений Gateway, потім local loopback.
    - `warnings[]`: best-effort записи попереджень із `code`, `message` і необов’язковими `targetIds`.
    - `network`: підказки URL local loopback/tailnet, отримані з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет виявлення/кількість результатів, використані для цього проходу перевірки.

    Для кожної цілі (`targets[].connect`):

    - `ok`: досяжність після підключення + класифікація погіршення.
    - `rpcOk`: успішне виконання повного детального RPC.
    - `scopeLimited`: детальний RPC зазнав збою через відсутній operator scope.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступна.
    - `scopes`: надані scopes, повідомлені в `hello-ok`, коли доступні.
    - `capability`: відкрита класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: не вдалося налаштувати SSH-тунель; команда повернулася до прямих перевірок.
    - `multiple_gateways`: досяжною була більш ніж одна ціль; це незвично, якщо ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
    - `auth_secretref_unresolved`: налаштований SecretRef автентифікації не вдалося розв’язати для цілі, що зазнала збою.
    - `probe_scope_limited`: WebSocket-підключення успішне, але перевірку читання було обмежено через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалено через SSH (паритет Mac app)

Режим macOS app «Remote over SSH» використовує локальне перенаправлення порту, щоб віддалений Gateway (який може бути прив’язаний лише до loopback) став доступним за `ws://127.0.0.1:<port>`.

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
  Вибрати перший виявлений хост Gateway як SSH-ціль із розв’язаного endpoint виявлення (`local.` плюс налаштований wide-area домен, якщо є). Підказки лише з TXT ігноруються.
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
  Переважно для agent-style RPC, які перед фінальним payload транслюють проміжні події.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний вивід JSON.
</ParamField>

<Note>
`--params` має бути коректним JSON.
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

Використовуйте `--wrapper`, коли керований сервіс має запускатися через інший виконуваний файл, наприклад
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

Wrapper також можна задати через середовище. `gateway install` перевіряє, що шлях є
виконуваним файлом, записує wrapper у сервісні `ProgramArguments` і зберігає
`OPENCLAW_WRAPPER` у середовищі сервісу для подальших примусових перевстановлень, оновлень і
ремонтів doctor.

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
    - Використовуйте `gateway restart`, щоб перезапустити керований сервіс. Не з’єднуйте `gateway stop` і `gateway start` як заміну перезапуску; на macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.
    - `gateway restart --wait 30s` перевизначає налаштований бюджет drain перед перезапуском для цього перезапуску. Голі числа — це мілісекунди; приймаються одиниці, як-от `s`, `m` і `h`. `--wait 0` очікує безстроково.
    - `gateway restart --force` пропускає drain активної роботи й перезапускає негайно. Використовуйте це, коли оператор уже перевірив перелічені task blockers і хоче повернути gateway зараз.
    - Команди життєвого циклу приймають `--json` для скриптів.

  </Accordion>
  <Accordion title="Автентифікація й SecretRefs під час інсталяції">
    - Коли токенна автентифікація потребує токена, а `gateway.auth.token` керується SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у metadata середовища сервісу.
    - Якщо токенна автентифікація потребує токена, а налаштований SecretRef токена не розв’язано, інсталяція завершується закрито замість збереження резервного plaintext.
    - Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef, а не inline `--password`.
    - У виведеному режимі автентифікації shell-only `OPENCLAW_GATEWAY_PASSWORD` не пом’якшує вимоги до токена під час інсталяції; використовуйте довговічну конфігурацію (`gateway.auth.password` або config `env`) під час інсталяції керованого сервісу.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, інсталяція блокується, доки режим не буде встановлено явно.

  </Accordion>
</AccordionGroup>

## Виявлення Gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише Gateway з увімкненим виявленням Bonjour (за замовчуванням) рекламують beacon.

Записи Wide-Area discovery містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти за замовчуванням використовують SSH-цілі на `22`, коли його немає)
- `tailnetDns` (ім’я хоста MagicDNS, коли доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + fingerprint сертифіката)
- `cliPath` (підказка remote-install, записана до wide-area зони)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для кожної команди (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Вивід, придатний для машинного читання (також вимикає стилізацію/індикатор виконання).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований глобальний домен, коли його ввімкнено.
- `wsUrl` у JSON-виводі визначається з розв’язаної кінцевої точки сервісу, а не з підказок лише TXT, як-от `lanHost` або `tailnetDns`.
- У mDNS `local.` значення `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` має значення `full`. Глобальний DNS-SD усе одно записує `cliPath`; `sshPort` там також залишається необов’язковим.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
