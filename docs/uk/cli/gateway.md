---
read_when:
    - Запуск Gateway із CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та з’єднання
    - Виявлення Gateway через Bonjour (локально + DNS-SD широкої області)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запуск, запити та виявлення Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-26T09:06:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, хуки). Підкоманди на цій сторінці доступні через `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + DNS-SD широкої області.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw рекламує та знаходить Gateway.
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

Псевдонім для запуску у передньому плані:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Поведінка під час запуску">
    - За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Використовуйте `--allow-unconfigured` для разових/розробницьких запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та виправте її замість того, щоб неявно припускати локальний режим.
    - Якщо файл існує і `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється «вгадувати local» за вас.
    - Прив’язка поза межами loopback без автентифікації блокується (захисне обмеження).
    - `SIGUSR1` запускає перезапуск у межах процесу за наявності дозволу (`commands.restart` увімкнено за замовчуванням; встановіть `commands.restart: false`, щоб заблокувати ручний перезапуск, водночас `gateway tool/config apply/update` залишатимуться дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жодний спеціальний стан термінала. Якщо ви обгортаєте CLI у TUI або ввід у raw-режимі, відновіть термінал перед виходом.
  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (типове значення надходить із config/env; зазвичай `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим прив’язки слухача.
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
  Зчитати пароль gateway із файла.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Відкрити Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скинути конфігурацію Tailscale serve/funnel під час завершення роботи.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить захист під час запуску лише для разового/розробницького bootstrap; не записує і не виправляє файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити конфігурацію розробки + робочий простір, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути конфігурацію розробки + облікові дані + сесії + робочий простір (потребує `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Завершити будь-який наявний слухач на вибраному порту перед запуском.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Докладні журнали.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показувати в консолі лише журнали бекенда CLI (і вмикати stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Стиль журналу WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Псевдонім для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Журналювати сирі події потоку моделі в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях до jsonl для сирого потоку.
</ParamField>

<Warning>
Вбудований `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання запуску

- Установіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати тривалість етапів під час запуску Gateway.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти швидкодію запуску Gateway. Бенчмарк фіксує перший вивід процесу, `/healthz`, `/readyz` і часи трасування запуску.

## Запит до запущеного Gateway

Усі команди запиту використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: зручний для читання людиною формат (кольоровий у TTY).
    - `--json`: JSON для машинного читання (без стилізації/спінера).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши зручне для людини компонування.
  </Tab>
  <Tab title="Спільні параметри">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: тайм-аут/бюджет часу (залежить від команди).
    - `--expect-final`: чекати на «final» відповідь (виклики агента).
  </Tab>
</Tabs>

<Note>
Коли ви встановлюєте `--url`, CLI не використовує як запасний варіант облікові дані з конфігурації або середовища. Явно передайте `--token` або `--password`. Відсутність явних облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпойнт `/healthz` — це перевірка живості: він повертає відповідь, щойно сервер може відповідати по HTTP. HTTP-ендпойнт `/readyz` суворіший і лишається недоступним, поки під час запуску ще ініціалізуються побічні служби, канали або налаштовані хуки.

### `gateway usage-cost`

Отримати зведення usage-cost із журналів сесій.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Кількість днів для включення.
</ParamField>

### `gateway stability`

Отримати недавній діагностичний записувач стабільності із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальна кількість недавніх подій для включення (максимум `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фільтрувати за типом діагностичної події, наприклад `payload.large` або `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включати лише події після номера послідовності діагностики.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Прочитати збережений пакет стабільності замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану, або передайте шлях до JSON пакета безпосередньо.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати zip із діагностикою підтримки, придатний для поширення, замість виведення подробиць стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфіденційність і поведінка пакетів">
    - Записи зберігають операційні метадані: назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/плагінів і знеособлені зведення сесій. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookie, секретні значення, імена хостів або сирі ідентифікатори сесій. Установіть `diagnostics.enabled: false`, щоб повністю вимкнути записувач.
    - У разі фатального завершення Gateway, тайм-аутів під час завершення роботи та збоїв запуску після перезапуску OpenClaw записує той самий знімок діагностики до `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо записувач має події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакетів.
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip із діагностикою, призначений для прикріплення до звітів про помилки. Модель конфіденційності та вміст пакета див. у [Експорт діагностики](/uk/gateway/diagnostics).

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
  Вивести записаний шлях, розмір і маніфест у форматі JSON.
</ParamField>

Експорт містить маніфест, зведення у форматі Markdown, форму конфігурації, очищені відомості конфігурації, очищені зведення журналів, очищені знімки status/health Gateway і найновіший пакет стабільності, якщо він існує.

Він призначений для поширення. Він зберігає операційні подробиці, які допомагають у налагодженні, наприклад безпечні поля журналів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, ідентифікатори плагінів, ідентифікатори провайдерів, несекретні налаштування функцій і знеособлені повідомлення операційних журналів. Він пропускає або знеособлює текст чату, тіла webhook, виводи інструментів, облікові дані, cookie, ідентифікатори облікових записів/повідомлень, текст prompt/інструкцій, імена хостів і секретні значення. Якщо повідомлення у стилі LogTape схоже на текст payload користувача/чату/інструмента, експорт зберігає лише факт пропуску повідомлення та кількість його байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливостей з’єднання/автентифікації.

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
  Тайм-аут перевірки.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Пропустити перевірку з’єднання (лише перегляд служби).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати системні служби.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку з’єднання до перевірки читання і завершити роботу з ненульовим кодом, якщо ця перевірка читання не вдається. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика status">
    - `gateway status` лишається доступним для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Типовий `gateway status` підтверджує стан служби, WebSocket-з’єднання і можливість автентифікації, видиму під час handshake. Він не підтверджує операції читання/запису/адміністрування.
    - Діагностичні перевірки не змінюють стан для першої автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис прив’язки пристрою лише для читання лише для перевірки status.
    - `gateway status` за можливості розв’язує налаштовані SecretRef автентифікації для перевірочної автентифікації.
    - Якщо потрібний SecretRef автентифікації не розв’язується в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли перевірка з’єднання/автентифікації RPC не вдається; явно передайте `--token`/`--password` або спочатку розв’яжіть джерело секрету.
    - Якщо перевірка успішна, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибнопозитивних результатів.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли служби, що слухає, недостатньо і потрібно, щоб також були справні RPC-виклики з областю читання.
    - `--deep` додає найкращу можливу спробу сканування додаткових інсталяцій launchd/systemd/schtasks. Коли виявлено кілька служб, схожих на gateway, вивід для людини показує підказки з очищення та попереджає, що більшість налаштувань мають запускати один gateway на машину.
    - Вивід для людини містить розв’язаний шлях до файла журналу, а також знімок шляхів/дійсності конфігурації CLI порівняно зі службою, щоб допомогти діагностувати дрейф профілю або каталогу стану.
  </Accordion>
  <Accordion title="Перевірки дрейфу автентифікації Linux systemd">
    - В інсталяціях Linux systemd перевірки дрейфу автентифікації служби читають значення `Environment=` і `EnvironmentFile=` з unit-файла (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами `-`).
    - Перевірки дрейфу розв’язують SecretRef `gateway.auth.token`, використовуючи об’єднане runtime-середовище (спочатку командне середовище служби, потім запасний варіант із середовища процесу).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не встановлено, де може перемогти пароль і жоден кандидат токена не може перемогти), перевірки дрейфу токена пропускають розв’язання токена конфігурації.
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо встановлено), і
- localhost (local loopback) **навіть якщо віддалений gateway налаштовано**.

Якщо передати `--url`, ця явна ціль додається перед обома. Вивід для людини позначає цілі так:

- `URL (явний)`
- `Remote (налаштований)` або `Remote (налаштований, неактивний)`
- `Local loopback`

<Note>
Якщо доступно кілька gateway, команда виводить їх усі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість інсталяцій усе ще запускають один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-з’єднання.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що саме перевірка змогла підтвердити про автентифікацію. Це окремо від доступності.
    - `Read probe: ok` означає, що RPC-виклики з подробицями в області читання (`health`/`status`/`system-presence`/`config.get`) також успішні.
    - `Read probe: limited - missing scope: operator.read` означає, що з’єднання встановлено успішно, але RPC з областю читання обмежений. Це повідомляється як **погіршена** доступність, а не як повна невдача.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює стан першої ідентичності пристрою або прив’язки.
    - Код виходу ненульовий лише тоді, коли жодна з перевірених цілей недоступна.
  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль мала RPC із подробицями, обмежений областю.
    - `capability`: найкраща можливість, побачена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштований remote, потім local loopback.
    - `warnings[]`: записи попереджень із найкращою можливою спробою, що містять `code`, `message` і необов’язкові `targetIds`.
    - `network`: підказки URL для local loopback/tailnet, похідні від поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів виявлення, використані для цього проходу probe.

    Для кожної цілі (`targets[].connect`):

    - `ok`: доступність після з’єднання + класифікація погіршення.
    - `rpcOk`: повний успіх RPC із подробицями.
    - `scopeLimited`: RPC із подробицями не вдався через відсутню область оператора.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступна.
    - `scopes`: надані області, повідомлені в `hello-ok`, коли доступні.
    - `capability`: представлена класифікація можливостей автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: не вдалося налаштувати SSH-тунель; команда повернулася до прямих перевірок.
    - `multiple_gateways`: доступною була більш ніж одна ціль; це незвично, якщо тільки ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
    - `auth_secretref_unresolved`: налаштований SecretRef автентифікації не вдалося розв’язати для цілі, що завершилася невдачею.
    - `probe_scope_limited`: WebSocket-з’єднання встановлено успішно, але перевірка читання була обмежена через відсутність `operator.read`.
  </Accordion>
</AccordionGroup>

#### Remote через SSH (паритет із застосунком Mac)

Режим «Remote over SSH» у застосунку macOS використовує локальне перенаправлення порту, щоб віддалений gateway (який може бути прив’язаний лише до loopback) став доступним за адресою `ws://127.0.0.1:<port>`.

Еквівалент у CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` або `user@host:port` (типовий порт — `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Файл ідентифікації.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Вибрати перший виявлений хост gateway як ціль SSH із розв’язаного endpoint виявлення (`local.` плюс налаштований домен широкої області, якщо є). Підказки лише TXT ігноруються.
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
  Бюджет тайм-ауту.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Переважно для RPC у стилі агента, які перед фінальним payload передають проміжні події потоку.
</ParamField>
<ParamField path="--json" type="boolean">
  JSON-вивід для машинного читання.
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

<AccordionGroup>
  <Accordion title="Параметри команд">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`
  </Accordion>
  <Accordion title="Примітки щодо інсталяції та життєвого циклу служби">
    - `gateway install` підтримує `--port`, `--runtime`, `--token`, `--force`, `--json`.
    - Використовуйте `gateway restart`, щоб перезапустити керовану службу. Не поєднуйте `gateway stop` і `gateway start` як заміну перезапуску; на macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.
    - Коли автентифікація токеном потребує токена і `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища служби.
    - Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не розв’язується, інсталяція завершується із закритою відмовою замість збереження запасного відкритого тексту.
    - Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef, а не вбудованому `--password`.
    - У режимі виведеної автентифікації лише оболонковий `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час інсталяції; використовуйте стійку конфігурацію (`gateway.auth.password` або config `env`) під час інсталяції керованої служби.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не встановлено, інсталяція блокується, доки режим не буде встановлено явно.
    - Команди життєвого циклу приймають `--json` для сценаріїв.
  </Accordion>
</AccordionGroup>

## Виявлення gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише gateway з увімкненим виявленням Bonjour (типово увімкнено) рекламують маяк.

Записи виявлення Wide-Area містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти типово використовують `22` для SSH-цілей, якщо його немає)
- `tailnetDns` (ім’я хоста MagicDNS, якщо доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленої інсталяції, записана до зони wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для кожної команди (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Вивід для машинного читання (також вимикає стилізацію/спінер).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований домен wide-area, коли його увімкнено.
- `wsUrl` у JSON-виводі виводиться з розв’язаного endpoint служби, а не з підказок лише TXT, таких як `lanHost` або `tailnetDns`.
- У mDNS `local.` значення `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` має значення `full`. Wide-Area DNS-SD усе одно записує `cliPath`; `sshPort` там також лишається необов’язковим.
</Note>

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
