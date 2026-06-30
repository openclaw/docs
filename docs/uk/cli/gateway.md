---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язування та підключення
    - Виявлення Gateway через Bonjour (локальний + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запускайте Gateway, надсилайте до них запити та знаходьте їх
title: Gateway
x-i18n:
    generated_at: "2026-06-30T14:25:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, hooks). Підкоманди на цій сторінці розміщені під `openclaw gateway …`.

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

## Запустіть Gateway

Запустіть локальний процес Gateway:

```bash
openclaw gateway
```

Аліас переднього плану:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Використовуйте `--allow-unconfigured` для одноразових/dev-запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це зламаною або перезаписаною конфігурацією та виправте її, а не неявно припускайте локальний режим.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway розцінює це як підозріле пошкодження конфігурації та відмовляється "вгадувати local" за вас.
    - Прив’язка поза loopback без автентифікації заблокована (захисне обмеження).
    - `lan`, `tailnet` і `custom` наразі розв’язуються через BYOH-шляхи лише IPv4.
    - BYOH лише з IPv6 сьогодні не підтримується нативно на цьому шляху. Використайте IPv4 sidecar або проксі, якщо сам host є лише IPv6.
    - `SIGUSR1` запускає перезапуск у межах процесу, коли це дозволено (`commands.restart` увімкнено за замовчуванням; встановіть `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як застосування/оновлення через gateway tool/config залишаються дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден кастомний стан термінала. Якщо ви обгортаєте CLI в TUI або raw-mode ввід, відновіть термінал перед виходом.

  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (значення за замовчуванням береться з config/env; зазвичай `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим прив’язки слухача. `lan`, `tailnet` і `custom` наразі розв’язуються через шляхи лише IPv4.
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
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Сьогодні очікує IPv4-адресу. Для BYOH лише з IPv6 розмістіть IPv4 sidecar або проксі перед Gateway і спрямуйте OpenClaw на цей IPv4 endpoint.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить захист запуску лише для одноразового/dev bootstrap; не записує й не виправляє файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + workspace, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути dev-конфігурацію + credentials + sessions + workspace (потребує `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Завершити будь-який наявний listener на вибраному порту перед запуском.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Докладні логи.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показувати в консолі лише логи CLI backend (і ввімкнути stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Стиль логів WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Аліас для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Логувати сирі події stream моделі в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях до jsonl сирого stream.
</ParamField>

## Перезапустіть Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` просить запущений Gateway виконати preflight активної роботи й запланувати один об’єднаний перезапуск після завершення активної роботи. Безпечний перезапуск за замовчуванням чекає на активну роботу до налаштованого `gateway.reload.deferralTimeoutMs` (за замовчуванням 5 хвилин); коли цей бюджет вичерпується, перезапуск примусово виконується. Встановіть `gateway.reload.deferralTimeoutMs` у `0` для безстрокового безпечного очікування, яке ніколи не примушує перезапуск. Звичайний `restart` зберігає наявну поведінку service-manager; `--force` залишається шляхом негайного перевизначення.

`openclaw gateway restart --safe --skip-deferral` виконує такий самий координований перезапуск із урахуванням OpenClaw, як `--safe`, але обходить gate відкладання активної роботи, тому Gateway негайно ініціює перезапуск навіть коли повідомлено про blockers. Використовуйте це як аварійний вихід для оператора, коли відкладання зафіксовано через завислий task run і лише `--safe` може бути обмежений `gateway.reload.deferralTimeoutMs`. `--skip-deferral` потребує `--safe`.

<Warning>
Inline `--password` може бути видно в локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання Gateway

- Встановіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб логувати таймінги фаз під час запуску Gateway, зокрема затримку `eventLoopMax` для кожної фази та таймінги таблиць пошуку plugins для installed-index, manifest registry, startup planning і owner-map work.
- Встановіть `OPENCLAW_GATEWAY_RESTART_TRACE=1`, щоб логувати рядки `restart trace:` у межах перезапуску для обробки сигналу перезапуску, drain активної роботи, фаз завершення, наступного запуску, ready timing і метрик пам’яті.
- Встановіть `OPENCLAW_DIAGNOSTICS=timeline` з `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, щоб записати best-effort JSONL timeline діагностики запуску для зовнішніх QA harnesses. Також можна ввімкнути прапорець через `diagnostics.flags: ["timeline"]` у конфігурації; шлях усе одно надається через env. Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити зразки event-loop.
- Спочатку запустіть `pnpm build`, потім `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб провести benchmark запуску Gateway відносно зібраного CLI entry. Benchmark записує перший вивід процесу, `/healthz`, `/readyz`, trace-таймінги запуску, затримку event-loop і подробиці таймінгів таблиць пошуку plugins.
- Спочатку запустіть `pnpm build`, потім `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, щоб провести benchmark перезапуску Gateway в межах процесу відносно зібраного CLI entry на macOS або Linux. Benchmark перезапуску використовує SIGUSR1, вмикає traces запуску й перезапуску в дочірньому процесі та записує наступний `/healthz`, наступний `/readyz`, downtime, ready timing, CPU, RSS і restart trace metrics.
- Вважайте `/healthz` liveness, а `/readyz` — usable readiness. Trace-рядки та вивід benchmark призначені для визначення відповідального власника; не вважайте один trace span або один sample повним висновком про продуктивність.

## Опитайте запущений Gateway

Усі команди запиту використовують WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - За замовчуванням: зручно для читання людиною (кольорове в TTY).
    - `--json`: машинозчитуваний JSON (без стилізації/spinner).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігаючи human layout.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: WebSocket URL Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: timeout/budget (залежить від команди).
    - `--expect-final`: чекати на "final" відповідь (agent calls).

  </Tab>
</Tabs>

<Note>
Коли ви встановлюєте `--url`, CLI не fallback до облікових даних із конфігурації або середовища. Передайте `--token` або `--password` явно. Відсутність явних credentials є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

HTTP endpoint `/healthz` є liveness probe: він повертається, щойно сервер може відповідати HTTP. HTTP endpoint `/readyz` суворіший і залишається червоним, поки startup plugin sidecars, канали або налаштовані hooks ще стабілізуються. Локальні або автентифіковані детальні відповіді readiness містять діагностичний блок `eventLoop` із затримкою event-loop, використанням event-loop, співвідношенням CPU core і прапорцем `degraded`.

<ParamField path="--port <port>" type="number">
  Спрямувати запит на local loopback Gateway на цьому порту. Це перевизначає `OPENCLAW_GATEWAY_URL` і `OPENCLAW_GATEWAY_PORT` для health call.
</ParamField>

### `gateway usage-cost`

Отримати summaries usage-cost із session logs.

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
  Обмежити cost summary одним налаштованим agent id.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Агрегувати cost summary для всіх налаштованих agents. Не можна поєднувати з `--agent`.
</ParamField>

### `gateway stability`

Отримати recent diagnostic stability recorder із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальна кількість нещодавніх events для включення (макс. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фільтрувати за типом diagnostic event, наприклад `payload.large` або `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включати лише events після номера diagnostic sequence.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Прочитати збережений stability bundle замість виклику запущеного Gateway. Використайте `--bundle latest` (або просто `--bundle`) для найновішого bundle у state directory, або передайте шлях до bundle JSON напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати shareable support diagnostics zip замість друку stability details.
</ParamField>
<ParamField path="--output <path>" type="string">
  Output path для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Records зберігають operational metadata: event names, counts, byte sizes, memory readings, queue/session state, channel/plugin names і redacted session summaries. Вони не зберігають chat text, webhook bodies, tool outputs, raw request або response bodies, tokens, cookies, secret values, hostnames чи raw session ids. Встановіть `diagnostics.enabled: false`, щоб повністю вимкнути recorder.
    - Під час fatal Gateway exits, shutdown timeouts і restart startup failures OpenClaw записує той самий diagnostic snapshot у `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли recorder має events. Перегляньте найновіший bundle за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до bundle output.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний diagnostics zip, призначений для додавання до bug reports. Модель privacy і вміст bundle див. у [Diagnostics Export](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях вихідного zip-файлу. Типово створює експорт для підтримки в каталозі стану.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальна кількість очищених рядків журналу для включення.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальна кількість байтів журналу для перевірки.
</ParamField>
<ParamField path="--url <url>" type="string">
  WebSocket URL Gateway для знімка стану справності.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для знімка стану справності.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для знімка стану справності.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Тайм-аут знімка стану/справності.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого пакета стабільності.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести записаний шлях, розмір і маніфест як JSON.
</ParamField>

Експорт містить маніфест, Markdown-зведення, форму конфігурації, очищені деталі конфігурації, очищені зведення журналів, очищені знімки стану/справності Gateway і найновіший пакет стабільності, якщо він існує.

Він призначений для передавання іншим. Він зберігає операційні деталі, що допомагають налагодженню, як-от безпечні поля журналу OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, ідентифікатори Plugin, ідентифікатори провайдерів, несекретні налаштування функцій і відредаговані операційні повідомлення журналу. Він пропускає або редагує текст чатів, тіла Webhook, виводи інструментів, облікові дані, cookie, ідентифікатори облікових записів/повідомлень, текст запитів/інструкцій, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст корисного навантаження користувача/чату/інструмента, експорт зберігає лише факт пропуску повідомлення та кількість його байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) і додаткову перевірку можливості підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль перевірки. Налаштовані віддалений + localhost усе одно перевіряються.
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
  Підвищити стандартну перевірку підключення до перевірки читання і завершити з ненульовим кодом, якщо ця перевірка читання не вдається. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` залишається доступною для діагностики навіть тоді, коли локальна конфігурація CLI відсутня або недійсна.
    - Типова `gateway status` підтверджує стан служби, підключення WebSocket і можливість автентифікації, видиму під час рукостискання. Вона не підтверджує операції читання/запису/адміністрування.
    - Діагностичні перевірки не змінюють стан для автентифікації пристрою вперше: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис парування пристрою лише для читання тільки для перевірки стану.
    - `gateway status` за можливості розв’язує налаштовані auth SecretRefs для автентифікації перевірки.
    - Якщо потрібний auth SecretRef не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація перевірки не вдається; передайте `--token`/`--password` явно або спершу розв’яжіть джерело секрету.
    - Якщо перевірка успішна, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибних спрацювань.
    - Коли перевірку ввімкнено, JSON-вивід містить `gateway.version`, якщо запущений Gateway повідомляє її; `--require-rpc` може повернутися до RPC-корисного навантаження `status.runtimeVersion`, якщо наступна перевірка рукостискання не може надати метадані версії.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли служби, що прослуховує порт, недостатньо і потрібно, щоб RPC-виклики з областю читання також були справними.
    - `--deep` додає best-effort сканування додаткових встановлень launchd/systemd/schtasks. Коли виявлено кілька служб, схожих на Gateway, вивід для людини друкує підказки з очищення й попереджає, що більшість налаштувань має запускати один gateway на машину.
    - `--deep` також повідомляє про недавню передачу перезапуску супервізора Gateway, коли процес служби коректно завершився для перезапуску зовнішнім супервізором.
    - `--deep` виконує валідацію конфігурації в режимі з урахуванням Plugin (`pluginValidation: "full"`) і показує попередження налаштованих маніфестів Plugin (наприклад, відсутні метадані конфігурації каналу), щоб smoke-перевірки встановлення й оновлення їх виявляли. Типова `gateway status` зберігає швидкий шлях лише для читання, який пропускає валідацію Plugin.
    - Вивід для людини містить розв’язаний шлях файлового журналу, а також знімок шляхів/дійсності конфігурації CLI проти служби, щоб допомогти діагностувати розбіжність профілю або state-dir.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - У встановленнях Linux systemd перевірки розбіжності автентифікації служби читають значення `Environment=` і `EnvironmentFile=` з unit (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами з `-`).
    - Перевірки розбіжності розв’язують `gateway.auth.token` SecretRefs за допомогою об’єднаного runtime env (спочатку env команди служби, потім fallback до env процесу).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy` або режим не заданий, де пароль може перемогти й жоден кандидат токена не може перемогти), перевірки token-drift пропускають розв’язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (loopback) **навіть якщо віддалений gateway налаштовано**.

Якщо передати `--url`, ця явна ціль додається перед обома. Вивід для людини позначає цілі як:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька цілей перевірки, вона друкує їх усі. SSH-тунель, TLS/proxy URL і налаштований віддалений URL можуть усі вказувати на той самий gateway, навіть коли їхні транспортні порти відрізняються; `multiple_gateways` зарезервовано для окремих або ідентифікаційно неоднозначних доступних gateway. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі (наприклад, rescue bot), але більшість встановлень усе одно запускає один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Використати цей порт для цілі перевірки local loopback і віддаленого порту SSH-тунелю. Без `--url` це вибирає ціль local loopback замість налаштованого URL середовища gateway, порту середовища або віддалених цілей.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-підключення.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що перевірка змогла підтвердити щодо автентифікації. Це окремо від доступності.
    - `Read probe: ok` означає, що RPC-виклики деталей з областю читання (`health`/`status`/`system-presence`/`config.get`) також були успішними.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC з областю читання обмежено. Це повідомляється як **погіршена** доступність, а не повний збій.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв WebSocket-з’єднання, але наступна діагностика читання перевищила тайм-аут або не вдалася. Це також **погіршена** доступність, а не недоступний Gateway.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює ідентичність пристрою або стан парування вперше.
    - Код виходу ненульовий лише тоді, коли жодна перевірена ціль недоступна.

  </Accordion>
  <Accordion title="JSON output">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль прийняла з’єднання, але не завершила повну детальну RPC-діагностику.
    - `capability`: найкраща можливість, побачена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштований віддалений, потім local loopback.
    - `warnings[]`: best-effort записи попереджень із `code`, `message` і необов’язковими `targetIds`.
    - `network`: підказки local loopback/tailnet URL, отримані з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів виявлення, використані для цього проходу перевірки.

    Для кожної цілі (`targets[].connect`):

    - `ok`: доступність після класифікації connect + degraded.
    - `rpcOk`: повний успіх детального RPC.
    - `scopeLimited`: детальний RPC не вдався через відсутню область operator.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступна.
    - `scopes`: надані області, повідомлені в `hello-ok`, коли доступні.
    - `capability`: показана класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: налаштування SSH-тунелю не вдалося; команда повернулася до прямих перевірок.
    - `multiple_gateways`: були доступні окремі ідентичності gateway, або OpenClaw не зміг довести, що доступні цілі є тим самим gateway. SSH-тунель, proxy URL або налаштований віддалений URL до того самого gateway не спричиняє це попередження.
    - `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося розв’язати для цілі, що не вдалася.
    - `probe_scope_limited`: WebSocket-підключення успішне, але перевірка читання була обмежена через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалено через SSH (паритет з Mac app)

Режим macOS app "Remote over SSH" використовує локальне перенаправлення порту, щоб віддалений gateway (який може бути прив’язаний лише до loopback) став доступним за `ws://127.0.0.1:<port>`.

Еквівалент CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` або `user@host:port` (порт типово `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Файл ідентичності.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Вибрати перший виявлений хост gateway як SSH-ціль із розв’язаного endpoint виявлення (`local.` плюс налаштований wide-area domain, якщо є). Підказки лише TXT ігноруються.
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
  Переважно для RPC у стилі агентів, які транслюють проміжні події перед фінальним корисним навантаженням.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний JSON-вивід.
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

### Установлення з обгорткою

Використовуйте `--wrapper`, коли керований сервіс має запускатися через інший виконуваний файл, наприклад через
проміжну обгортку менеджера секретів або допоміжний інструмент запуску від імені іншого користувача. Обгортка отримує звичайні аргументи Gateway і
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

Ви також можете задати обгортку через середовище. `gateway install` перевіряє, що шлях указує на
виконуваний файл, записує обгортку в service `ProgramArguments` і зберігає
`OPENCLAW_WRAPPER` у середовищі сервісу для подальших примусових перевстановлень, оновлень і виправлень doctor.

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
    - Використовуйте `gateway restart`, щоб перезапустити керований сервіс. Не поєднуйте послідовно `gateway stop` і `gateway start` як заміну перезапуску.
    - На macOS `gateway stop` типово використовує `launchctl bootout`, що видаляє LaunchAgent із поточного сеансу завантаження без постійного вимкнення — автоматичне відновлення KeepAlive залишається активним для майбутніх збоїв, а `gateway start` знову вмикає сервіс коректно без ручного `launchctl enable`. Передайте `--disable`, щоб постійно придушити KeepAlive і RunAtLoad, щоб Gateway не запускався повторно до наступного явного `gateway start`; використовуйте це, коли ручна зупинка має зберігатися після перезавантажень або перезапусків системи.
    - `gateway restart --safe` просить запущений Gateway попередньо перевірити активну роботу й запланувати один об’єднаний перезапуск після завершення активної роботи. Типовий безпечний перезапуск чекає на активну роботу до налаштованого `gateway.reload.deferralTimeoutMs` (типово 5 хвилин); коли цей бюджет вичерпано, перезапуск виконується примусово. Установіть `gateway.reload.deferralTimeoutMs` у `0` для безстрокового безпечного очікування, яке ніколи не примушує перезапуск. `--safe` не можна поєднувати з `--force` або `--wait`.
    - `gateway restart --wait 30s` перевизначає налаштований бюджет очікування зупинки для цього перезапуску. Числа без одиниць означають мілісекунди; приймаються одиниці на кшталт `s`, `m` і `h`. `--wait 0` чекає безстроково.
    - `gateway restart --safe --skip-deferral` запускає безпечний перезапуск із урахуванням OpenClaw, але обходить шлюз відкладення, тому Gateway негайно ініціює перезапуск навіть коли повідомлено про блокери. Це аварійний вихід для оператора у разі завислих відкладень запусків завдань; потребує `--safe`.
    - `gateway restart --force` пропускає очікування завершення активної роботи й перезапускає негайно. Використовуйте це, коли оператор уже перевірив перелічені блокери завдань і хоче повернути Gateway у роботу зараз.
    - Команди життєвого циклу приймають `--json` для сценаріїв.

  </Accordion>
  <Accordion title="Автентифікація та SecretRefs під час установлення">
    - Коли автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища сервісу.
    - Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не розв’язується, установлення завершується закритою відмовою замість збереження резервного відкритого тексту.
    - Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
    - У виведеному режимі автентифікації лише оболонковий `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час установлення; використовуйте довготривалу конфігурацію (`gateway.auth.password` або config `env`) під час установлення керованого сервісу.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки режим не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення Gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише Gateway з увімкненим виявленням Bonjour (типово) рекламують маяк.

Записи широкомасштабного виявлення можуть містити такі підказки TXT:

- `role` (підказка ролі Gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (лише режим повного виявлення; клієнти типово використовують цілі SSH на `22`, коли його немає)
- `tailnetDns` (ім’я хоста MagicDNS, коли доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (лише режим повного виявлення)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Таймаут для команди (перегляд/розв’язання).
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний вивід (також вимикає стилізацію/індикатор завантаження).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований широкомасштабний домен, коли його ввімкнено.
- `wsUrl` у JSON-виводі виводиться з розв’язаної кінцевої точки сервісу, а не з підказок лише TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS і широкомасштабному DNS-SD `sshPort` та `cliPath` публікуються лише коли `discovery.mdns.mode` має значення `full`.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
