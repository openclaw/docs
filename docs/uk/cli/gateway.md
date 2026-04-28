---
read_when:
    - Запуск Gateway із CLI (для розробки або серверів)
    - Налагодження автентифікації Gateway, режимів прив’язування та підключення
    - Виявлення Gateway через Bonjour (локальний + широкозонний DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запускайте, опитуйте й виявляйте Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-28T11:07:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea6cb28046bb9a29c9f308a951c5ff3d25f8ebea4edfeb91e4688ceab5a8bc78
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, хуки). Підкоманди на цій сторінці розміщені в `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/uk/gateway/bonjour">
    Локальне налаштування mDNS + широкозонного DNS-SD.
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
    - За замовчуванням Gateway відмовляється запускатися, якщо `gateway.mode=local` не встановлено в `~/.openclaw/openclaw.json`. Використовуйте `--allow-unconfigured` для ситуативних/dev-запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це зламаною або перезаписаною конфігурацією та відновіть її, а не неявно припускайте локальний режим.
    - Якщо файл існує, але `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється «вгадувати local» за вас.
    - Прив’язування поза межами local loopback без автентифікації заблоковано (запобіжний захист).
    - `SIGUSR1` запускає перезапуск у процесі, коли це дозволено (`commands.restart` увімкнено за замовчуванням; установіть `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як застосування/оновлення інструментів і конфігурації Gateway залишаться дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес Gateway, але не відновлюють жоден користувацький стан термінала. Якщо ви обгортаєте CLI за допомогою TUI або введення в raw-режимі, відновіть термінал перед виходом.

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
  Читати пароль Gateway з файлу.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Надати доступ до Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скинути конфігурацію Tailscale serve/funnel під час вимкнення.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск Gateway без `gateway.mode=local` у конфігурації. Обходить захист запуску лише для ситуативного/dev-завантаження; не записує і не відновлює файл конфігурації.
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
  Записувати сирі події потоку моделі в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях до jsonl сирого потоку.
</ParamField>

<Warning>
Вбудований `--password` може бути видимим у локальних списках процесів. Віддавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання запуску

- Установіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб записувати в журнал тривалість фаз під час запуску Gateway, зокрема затримку `eventLoopMax` для кожної фази та часи таблиць пошуку Plugin для installed-index, реєстру маніфестів, планування запуску й роботи owner-map.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти запуск Gateway. Бенчмарк записує перший вивід процесу, `/healthz`, `/readyz`, часи трасування запуску, затримку циклу подій і деталі часу таблиць пошуку Plugin.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - За замовчуванням: читабельно для людини (кольорово в TTY).
    - `--json`: машинно-читаний JSON (без стилізації/spinner).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігаючи людський макет.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: WebSocket URL Gateway.
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

HTTP-ендпоінт `/healthz` є пробою працездатності: він повертає відповідь, щойно сервер може відповідати через HTTP. HTTP-ендпоінт `/readyz` суворіший і залишається червоним, поки стартові sidecar-процеси, канали або налаштовані хуки ще стабілізуються. Локальні або автентифіковані докладні відповіді готовності містять діагностичний блок `eventLoop` із затримкою циклу подій, використанням циклу подій, співвідношенням CPU-ядер і прапорцем `degraded`.

### `gateway usage-cost`

Отримати з журналів сесій зведення вартості використання.

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
  Читати збережений пакет стабільності замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану або передайте шлях до JSON пакета напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати придатний для передавання zip із діагностикою підтримки замість друку деталей стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin і відредаговані зведення сесій. Вони не зберігають текст чату, тіла Webhook, вивід інструментів, сирі тіла запитів або відповідей, токени, cookie, секретні значення, імена хостів або сирі ідентифікатори сесій. Установіть `diagnostics.enabled: false`, щоб повністю вимкнути реєстратор.
    - Під час фатальних виходів Gateway, таймаутів вимкнення і збоїв запуску після перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли реєстратор має події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакета.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip із діагностикою, призначений для прикріплення до звітів про помилки. Про модель приватності та вміст пакета див. [Експорт діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до вихідного zip. За замовчуванням це експорт для підтримки в каталозі стану.
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

Він призначений для передавання. Він зберігає операційні деталі, що допомагають у налагодженні, як-от безпечні поля журналів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, ідентифікатори Plugin, ідентифікатори провайдерів, несекретні налаштування функцій і відредаговані операційні повідомлення журналу. Він пропускає або редагує текст чату, тіла Webhook, вивід інструментів, облікові дані, cookie, ідентифікатори акаунтів/повідомлень, текст промптів/інструкцій, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст користувацького/чатового/інструментального payload, експорт зберігає лише факт, що повідомлення було пропущено, а також його кількість байтів.

### `gateway status`

`gateway status` показує сервіс Gateway (launchd/systemd/schtasks) і додаткову пробу можливості підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль проби. Налаштований віддалений хост + localhost усе одно перевіряються.
</ParamField>
<ParamField path="--token <token>" type="string">
  Автентифікація токеном для проби.
</ParamField>
<ParamField path="--password <password>" type="string">
  Автентифікація паролем для проби.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Таймаут проби.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Пропустити пробу підключення (подання лише сервісу).
</ParamField>
<ParamField path="--deep" type="boolean">
  Сканувати також сервіси системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Оновити типову пробу підключення до проби читання та завершити з ненульовим кодом, якщо ця проба читання не вдається. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статусу">
    - `gateway status` залишається доступним для діагностики навіть тоді, коли локальна конфігурація CLI відсутня або недійсна.
    - Типовий `gateway status` підтверджує стан служби, підключення WebSocket і можливість автентифікації, видиму під час handshake. Він не підтверджує операції читання/запису/адміністрування.
    - Діагностичні перевірки не змінюють стан для первинної автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис сполучення пристрою лише для читання тільки для перевірки статусу.
    - `gateway status` за можливості розв’язує налаштовані auth SecretRefs для автентифікації перевірки.
    - Якщо потрібний auth SecretRef не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація перевірки не вдається; явно передайте `--token`/`--password` або спершу розв’яжіть джерело секрету.
    - Якщо перевірка успішна, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибних спрацювань.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли недостатньо служби, що слухає порт, і потрібно, щоб RPC-виклики з правами читання також були справними.
    - `--deep` додає best-effort сканування додаткових встановлень launchd/systemd/schtasks. Коли виявлено кілька gateway-подібних служб, вивід для людини друкує підказки з очищення й попереджає, що більшість налаштувань мають запускати один gateway на машину.
    - Вивід для людини містить розв’язаний шлях до файлового журналу, а також знімок шляхів/дійсності конфігурації CLI та служби, щоб допомогти діагностувати розбіжність профілю або каталогу стану.

  </Accordion>
  <Accordion title="Перевірки розбіжності автентифікації Linux systemd">
    - У встановленнях Linux systemd перевірки розбіжності автентифікації служби читають значення `Environment=` і `EnvironmentFile=` з unit (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами з `-`).
    - Перевірки розбіжності розв’язують `gateway.auth.token` SecretRefs за допомогою об’єднаного runtime env (спочатку env команди служби, потім резервно process env).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не задано, де пароль може перемогти, а жоден кандидат токена не може перемогти), перевірки розбіжності токена пропускають розв’язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (loopback) **навіть якщо віддалений gateway налаштовано**.

Якщо передати `--url`, ця явна ціль додається перед обома. Вивід для людини позначає цілі так:

- `URL (явна)`
- `Remote (налаштований)` або `Remote (налаштований, неактивний)`
- `Local loopback`

<Note>
Якщо доступні кілька gateways, команда друкує їх усі. Кілька gateways підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, рятувального бота), але більшість встановлень все одно запускають один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Тлумачення">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла підключення WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що перевірка змогла підтвердити щодо автентифікації. Це окремо від досяжності.
    - `Read probe: ok` означає, що RPC-виклики деталей з правами читання (`health`/`status`/`system-presence`/`config.get`) також були успішними.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC з правами читання обмежений. Це повідомляється як **погіршена** досяжність, а не повна помилка.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює первинну ідентичність пристрою або стан сполучення.
    - Код виходу ненульовий лише тоді, коли жодна перевірена ціль не досяжна.

  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль досяжна.
    - `degraded`: принаймні одна ціль мала RPC деталей, обмежений scope.
    - `capability`: найкраща можливість, побачена серед досяжних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштований віддалений, потім local loopback.
    - `warnings[]`: best-effort записи попереджень із `code`, `message` і необов’язковими `targetIds`.
    - `network`: підказки URL local loopback/tailnet, отримані з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет discovery/кількість результатів, використані для цього проходу перевірки.

    Для цілі (`targets[].connect`):

    - `ok`: досяжність після підключення + класифікація погіршення.
    - `rpcOk`: повний успіх RPC деталей.
    - `scopeLimited`: RPC деталей не вдалося через відсутній operator scope.

    Для цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступна.
    - `scopes`: надані scopes, повідомлені в `hello-ok`, коли доступні.
    - `capability`: відображена класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: не вдалося налаштувати SSH-тунель; команда повернулася до прямих перевірок.
    - `multiple_gateways`: досяжною була більш ніж одна ціль; це незвично, якщо ви навмисно не запускаєте ізольовані профілі, як-от рятувального бота.
    - `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося розв’язати для цілі з помилкою.
    - `probe_scope_limited`: підключення WebSocket успішне, але перевірка читання була обмежена через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалено через SSH (паритет Mac app)

Режим macOS app «Remote over SSH» використовує локальний port-forward, щоб віддалений gateway (який може бути прив’язаний лише до loopback) став досяжним за адресою `ws://127.0.0.1:<port>`.

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
  Вибрати перший виявлений хост gateway як SSH-ціль із розв’язаного endpoint discovery (`local.` плюс налаштований wide-area домен, якщо є). Підказки лише TXT ігноруються.
</ParamField>

Конфігурація (необов’язкова, використовується як типова):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий помічник RPC.

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
  Переважно для RPC у стилі agent, які перед фінальним payload транслюють проміжні події.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний JSON-вивід.
</ParamField>

<Note>
`--params` має бути валідним JSON.
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

Використовуйте `--wrapper`, коли керована служба має запускатися через інший виконуваний файл, наприклад shim менеджера секретів або допоміжний засіб запуску від імені іншого користувача. Wrapper отримує звичайні аргументи Gateway і відповідає за те, щоб зрештою exec-виконати `openclaw` або Node з цими аргументами.

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

Wrapper також можна задати через середовище. `gateway install` перевіряє, що шлях є виконуваним файлом, записує wrapper у service `ProgramArguments` і зберігає `OPENCLAW_WRAPPER` у середовищі служби для подальших примусових перевстановлень, оновлень і виправлень doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Щоб вилучити збережений wrapper, очистьте `OPENCLAW_WRAPPER` під час перевстановлення:

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
    - Використовуйте `gateway restart`, щоб перезапустити керовану службу. Не ланцюжте `gateway stop` і `gateway start` як заміну перезапуску; на macOS `gateway stop` навмисно вимикає LaunchAgent перед зупиненням.
    - Команди життєвого циклу приймають `--json` для скриптів.

  </Accordion>
  <Accordion title="Auth і SecretRefs під час встановлення">
    - Коли для автентифікації токеном потрібен токен і `gateway.auth.token` керується SecretRef, `gateway install` перевіряє, що SecretRef розв’язується, але не зберігає розв’язаний токен у metadata середовища служби.
    - Якщо для автентифікації токеном потрібен токен, а налаштований token SecretRef не розв’язано, встановлення завершується закрито замість збереження fallback plaintext.
    - Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість inline `--password`.
    - У виведеному режимі автентифікації лише-shell `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час встановлення; використовуйте довговічну конфігурацію (`gateway.auth.password` або config `env`) під час встановлення керованої служби.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення блокується, доки режим не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення gateways (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише gateways з увімкненим Bonjour discovery (типово) рекламують маяк.

Записи wide-area discovery містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти за замовчуванням використовують SSH-цілі на `22`, коли він відсутній)
- `tailnetDns` (hostname MagicDNS, коли доступний)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленого встановлення, записана в wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Час очікування для команди (browse/resolve).
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
- CLI сканує `local.` плюс налаштований wide-area домен, коли його ввімкнено.
- `wsUrl` у JSON-виводі отримується з розв’язаного endpoint служби, а не з підказок лише TXT, як-от `lanHost` або `tailnetDns`.
- На `local.` mDNS `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` має значення `full`. Wide-area DNS-SD усе одно записує `cliPath`; `sshPort` там також залишається необов’язковим.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
