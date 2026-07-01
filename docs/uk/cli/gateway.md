---
read_when:
    - Запуск Gateway із CLI (для розробки або серверів)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення Gateway через Bonjour (локальний + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запускайте, запитуйте та виявляйте Gateway-и
title: Gateway
x-i18n:
    generated_at: "2026-07-01T08:30:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сеанси, хуки). Підкоманди на цій сторінці належать до `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + wide-area DNS-SD.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw оголошує та знаходить шлюзи.
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

Аліас для запуску на передньому плані:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Поведінка під час запуску">
    - За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Використовуйте `--allow-unconfigured` для одноразових/dev-запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та виправте її, замість неявного припущення локального режиму.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється "вгадувати local" замість вас.
    - Прив’язування поза loopback без автентифікації заблоковано (захисне обмеження).
    - `lan`, `tailnet` і `custom` наразі розв’язуються через BYOH-шляхи лише IPv4.
    - BYOH лише IPv6 сьогодні не підтримується нативно на цьому шляху. Використовуйте IPv4 sidecar або проксі, якщо сам хост підтримує лише IPv6.
    - `SIGUSR1` запускає перезапуск усередині процесу, коли це авторизовано (`commands.restart` увімкнено за замовчуванням; встановіть `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як застосування/оновлення інструментів і конфігурації gateway залишаються дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден кастомний стан термінала. Якщо ви обгортаєте CLI за допомогою TUI або введення в raw-mode, відновіть термінал перед виходом.

  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (значення за замовчуванням береться з config/env; зазвичай `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим прив’язування слухача. `lan`, `tailnet` і `custom` наразі розв’язуються через шляхи лише IPv4.
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
  Сьогодні очікується IPv4-адреса. Для BYOH лише IPv6 розмістіть IPv4 sidecar або проксі перед Gateway і вкажіть OpenClaw на цю IPv4-кінцеву точку.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить захист запуску лише для одноразового/dev bootstrap; не записує й не виправляє файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + робочий простір, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути dev-конфігурацію + облікові дані + сеанси + робочий простір (потребує `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Завершити будь-якого наявного слухача на вибраному порту перед запуском.
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
  Аліас для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Записувати необроблені події потоку моделі в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях jsonl для необробленого потоку.
</ParamField>

## Перезапуск Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` просить запущений Gateway виконати попередню перевірку активної роботи й запланувати один об’єднаний перезапуск після завершення активної роботи. Безпечний перезапуск за замовчуванням чекає активну роботу до налаштованого `gateway.reload.deferralTimeoutMs` (за замовчуванням 5 хвилин); коли цей ліміт вичерпується, перезапуск примусово виконується. Встановіть `gateway.reload.deferralTimeoutMs` у `0` для безстрокового безпечного очікування, яке ніколи не примушує перезапуск. Звичайний `restart` зберігає наявну поведінку менеджера служб; `--force` залишається шляхом негайного перевизначення.

`openclaw gateway restart --safe --skip-deferral` виконує той самий скоординований перезапуск із урахуванням OpenClaw, що й `--safe`, але обходить шлюз відкладення активної роботи, тому Gateway негайно генерує перезапуск навіть коли повідомлено про блокери. Використовуйте це як аварійний вихід оператора, коли відкладення закріплене завислим запуском задачі, а лише `--safe` може бути обмежений `gateway.reload.deferralTimeoutMs`. `--skip-deferral` потребує `--safe`.

<Warning>
Вбудований `--password` може бути видно в локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання Gateway

- Встановіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати часові показники фаз під час запуску Gateway, включно із затримкою `eventLoopMax` для кожної фази та часовими показниками таблиць пошуку plugin для installed-index, реєстру маніфестів, планування запуску й роботи owner-map.
- Встановіть `OPENCLAW_GATEWAY_RESTART_TRACE=1`, щоб журналювати рядки `restart trace:` у межах перезапуску для обробки сигналу перезапуску, завершення активної роботи, фаз вимкнення, наступного запуску, часу готовності й метрик пам’яті.
- Встановіть `OPENCLAW_DIAGNOSTICS=timeline` разом із `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, щоб записувати best-effort JSONL-хронологію діагностики запуску для зовнішніх QA harnesses. Також можна ввімкнути прапорець через `diagnostics.flags: ["timeline"]` у конфігурації; шлях усе одно надається через env. Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити вибірки event-loop.
- Спочатку запустіть `pnpm build`, потім `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти продуктивність запуску Gateway відносно зібраної точки входу CLI. Benchmark записує перший вивід процесу, `/healthz`, `/readyz`, часові показники трасування запуску, затримку event-loop і деталі часових показників таблиць пошуку plugin.
- Спочатку запустіть `pnpm build`, потім `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, щоб виміряти продуктивність перезапуску Gateway всередині процесу відносно зібраної точки входу CLI на macOS або Linux. Benchmark перезапуску використовує SIGUSR1, вмикає трасування запуску й перезапуску в дочірньому процесі та записує наступний `/healthz`, наступний `/readyz`, downtime, час готовності, CPU, RSS і метрики трасування перезапуску.
- Вважайте `/healthz` перевіркою життєздатності, а `/readyz` — готовністю до використання. Рядки трасування й вивід benchmark призначені для атрибуції власнику; не вважайте один проміжок трасування або одну вибірку повним висновком щодо продуктивності.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: зручно для читання людиною (кольорове в TTY).
    - `--json`: машинозчитуваний JSON (без стилізації/spinner).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігаючи людське компонування.

  </Tab>
  <Tab title="Спільні параметри">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: timeout/budget (залежить від команди).
    - `--expect-final`: чекати на "final" відповідь (виклики агента).

  </Tab>
</Tabs>

<Note>
Коли ви встановлюєте `--url`, CLI не повертається до облікових даних із конфігурації або середовища. Передайте `--token` або `--password` явно. Відсутність явних облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

HTTP-кінцева точка `/healthz` є пробою життєздатності: вона повертається, щойно сервер може відповідати HTTP. HTTP-кінцева точка `/readyz` суворіша й залишається червоною, поки startup plugin sidecars, канали або налаштовані хуки ще стабілізуються. Локальні або автентифіковані детальні відповіді readiness містять діагностичний блок `eventLoop` із затримкою event-loop, використанням event-loop, співвідношенням ядер CPU і прапорцем `degraded`.

<ParamField path="--port <port>" type="number">
  Спрямувати запит на local loopback Gateway на цьому порту. Це перевизначає `OPENCLAW_GATEWAY_URL` і `OPENCLAW_GATEWAY_PORT` для виклику health.
</ParamField>

### `gateway usage-cost`

Отримати підсумки usage-cost із журналів сеансів.

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
  Обмежити підсумок витрат одним налаштованим ідентифікатором агента.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Агрегувати підсумок витрат для всіх налаштованих агентів. Не можна поєднувати з `--agent`.
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
  Включати лише події після діагностичного порядкового номера.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Прочитати збережений stability bundle замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого bundle у каталозі стану або передайте шлях до JSON bundle напряму.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати придатний для поширення zip із діагностикою підтримки замість друку деталей stability.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Приватність і поведінка bundle">
    - Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сеансу, ідентифікатори схвалень, назви каналів/plugin і редаговані підсумки сеансів. Вони не зберігають текст чату, тіла webhook, вивід інструментів, необроблені тіла запитів або відповідей, токени, cookie, секретні значення, імена хостів або необроблені ідентифікатори сеансів. Встановіть `diagnostics.enabled: false`, щоб повністю вимкнути recorder.
    - Під час фатальних завершень Gateway, timeout вимкнення та збоїв запуску після перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли recorder має події. Перегляньте найновіший bundle за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip із діагностикою, призначений для прикріплення до звітів про помилки. Модель приватності та вміст bundle див. у [Експорті діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях вихідного zip-файлу. За замовчуванням використовується експорт для підтримки в каталозі стану.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальна кількість санітизованих рядків журналу для включення.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальна кількість байтів журналу для перевірки.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway для знімка стану справності.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для знімка стану справності.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для знімка стану справності.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Тайм-аут знімка статусу/справності.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого пакета стабільності.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести записаний шлях, розмір і маніфест як JSON.
</ParamField>

Експорт містить маніфест, підсумок Markdown, форму конфігурації, санітизовані деталі конфігурації, санітизовані підсумки журналів, санітизовані знімки статусу/справності Gateway і найновіший пакет стабільності, якщо він існує.

Він призначений для спільного передавання. Він зберігає операційні деталі, що допомагають у налагодженні, як-от безпечні поля журналу OpenClaw, назви підсистем, коди статусу, тривалості, налаштовані режими, порти, ідентифікатори плагінів, ідентифікатори провайдерів, несекретні налаштування функцій і відредаговані операційні повідомлення журналу. Він пропускає або редагує текст чатів, тіла webhook, виводи інструментів, облікові дані, cookies, ідентифікатори облікових записів/повідомлень, текст prompt/інструкцій, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст корисного навантаження користувача/чату/інструмента, експорт зберігає лише те, що повідомлення було пропущено, разом із кількістю його байтів.

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
  Тайм-аут перевірки.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Пропустити перевірку підключення (лише подання служби).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати служби системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до перевірки читання і завершити роботу з ненульовим кодом, якщо ця перевірка читання не вдасться. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статусу">
    - `gateway status` лишається доступним для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Стандартний `gateway status` підтверджує стан служби, підключення WebSocket і можливість автентифікації, видиму під час handshake. Він не підтверджує операції читання/запису/адміністрування.
    - Діагностичні перевірки не змінюють стан для автентифікації пристрою під час першого використання: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис сполучення пристрою лише для читання тільки для перевірки статусу.
    - `gateway status` за можливості розв’язує налаштовані SecretRefs автентифікації для автентифікації перевірки.
    - Якщо потрібний SecretRef автентифікації не розв’язано в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли перевірка підключення/автентифікації не вдається; передайте `--token`/`--password` явно або спершу розв’яжіть джерело секрету.
    - Якщо перевірка успішна, попередження про нерозв’язані посилання автентифікації пригнічуються, щоб уникнути хибних спрацювань.
    - Коли перевірку ввімкнено, вивід JSON містить `gateway.version`, якщо запущений Gateway повідомляє її; `--require-rpc` може повернутися до корисного навантаження RPC `status.runtimeVersion`, якщо подальша перевірка handshake не може надати метадані версії.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли прослуховувальної служби недостатньо і вам також потрібна справність RPC-викликів із областю читання.
    - `--deep` додає найкращу можливу перевірку додаткових встановлень launchd/systemd/schtasks. Коли виявлено кілька служб, схожих на gateway, зрозумілий для людини вивід друкує підказки з очищення і попереджає, що більшість налаштувань мають запускати один gateway на машину.
    - `--deep` також повідомляє про нещодавню передачу перезапуску супервізора Gateway, коли процес служби коректно завершився для перезапуску зовнішнім супервізором.
    - `--deep` запускає перевірку конфігурації в режимі з урахуванням плагінів (`pluginValidation: "full"`) і показує налаштовані попередження маніфестів плагінів (наприклад, відсутні метадані конфігурації каналу), щоб smoke-перевірки встановлення й оновлення їх виявляли. Стандартний `gateway status` зберігає швидкий шлях лише для читання, який пропускає перевірку плагінів.
    - Зрозумілий для людини вивід містить розв’язаний шлях до файлового журналу плюс знімок шляхів/дійсності конфігурації CLI-порівняно-зі-службою, щоб допомогти діагностувати розбіжність профілю або каталогу стану.

  </Accordion>
  <Accordion title="Перевірки розбіжності автентифікації Linux systemd">
    - У встановленнях Linux systemd перевірки розбіжності автентифікації служби читають значення `Environment=` і `EnvironmentFile=` з unit (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами `-`).
    - Перевірки розбіжності розв’язують SecretRefs `gateway.auth.token` за допомогою об’єднаного runtime env (спочатку env команди служби, потім fallback до process env).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy` або режим не задано, де пароль може перемогти, а жоден кандидат токена не може перемогти), перевірки розбіжності токена пропускають розв’язання токена конфігурації.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований remote gateway (якщо задано), і
- localhost (loopback) **навіть якщо remote налаштовано**.

Якщо ви передаєте `--url`, ця явна ціль додається перед обома. Зрозумілий для людини вивід позначає цілі як:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька цілей перевірки, команда друкує їх усі. SSH-тунель, TLS/proxy URL і налаштований remote URL можуть усі вказувати на той самий gateway, навіть коли їхні транспортні порти відрізняються; `multiple_gateways` зарезервовано для окремих або неоднозначних за ідентичністю доступних gateway. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі (наприклад, rescue bot), але більшість встановлень усе одно запускають один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Використати цей порт для цілі перевірки local loopback і віддаленого порту SSH-тунелю. Без `--url` це вибирає ціль local loopback замість налаштованого URL середовища gateway, порту середовища або remote-цілей.
</ParamField>

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла підключення WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що перевірка змогла підтвердити щодо автентифікації. Це окремо від доступності.
    - `Read probe: ok` означає, що RPC-виклики деталей з областю читання (`health`/`status`/`system-presence`/`config.get`) також були успішними.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC з областю читання обмежено. Це повідомляється як **погіршена** доступність, а не повний збій.
    - `Read probe: failed` після `Connect: ok` означає, що Gateway прийняв підключення WebSocket, але подальша діагностика читання перевищила тайм-аут або завершилася невдало. Це також **погіршена** доступність, а не недоступний Gateway.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює ідентичність пристрою під час першого використання або стан сполучення.
    - Код завершення ненульовий лише тоді, коли жодна перевірена ціль не доступна.

  </Accordion>
  <Accordion title="Виведення JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль прийняла підключення, але не завершила повну діагностику RPC з деталями.
    - `capability`: найкраща можливість, виявлена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем у такому порядку: явний URL, SSH-тунель, налаштована віддалена ціль, потім local loopback.
    - `warnings[]`: попереджувальні записи за принципом best-effort із `code`, `message` та необов’язковими `targetIds`.
    - `network`: підказки URL для local loopback/tailnet, отримані з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет виявлення/кількість результатів, використані для цього проходу перевірки.

    Для кожної цілі (`targets[].connect`):

    - `ok`: доступність після підключення + класифікація деградації.
    - `rpcOk`: успішне повне RPC з деталями.
    - `scopeLimited`: RPC з деталями завершився невдало через відсутню область доступу оператора.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, якщо доступна.
    - `scopes`: надані області доступу, повідомлені в `hello-ok`, якщо доступні.
    - `capability`: показана класифікація можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: налаштування SSH-тунелю не вдалося; команда повернулася до прямих перевірок.
    - `multiple_gateways`: були доступні різні ідентичності gateway, або OpenClaw не зміг довести, що доступні цілі є тим самим gateway. SSH-тунель, URL проксі або налаштований віддалений URL до того самого gateway не спричиняє цього попередження.
    - `auth_secretref_unresolved`: налаштований SecretRef автентифікації не вдалося розв’язати для цілі, що завершилася невдало.
    - `probe_scope_limited`: підключення WebSocket успішне, але проба читання була обмежена через відсутній `operator.read`.

  </Accordion>
</AccordionGroup>

#### Віддалено через SSH (паритет із застосунком Mac)

Режим застосунку macOS «Віддалено через SSH» використовує локальне перенаправлення порту, щоб віддалений gateway (який може бути прив’язаний лише до loopback) став доступним за адресою `ws://127.0.0.1:<port>`.

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
  Вибрати перший виявлений хост gateway як SSH-ціль із розв’язаного кінцевого пункту виявлення (`local.` плюс налаштований домен широкої зони, якщо є). Підказки лише TXT ігноруються.
</ParamField>

Конфігурація (необов’язкова, використовується як значення за замовчуванням):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий помічник RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Рядок об’єкта JSON для параметрів.
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
  Машиночитане виведення JSON.
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

Використовуйте `--wrapper`, коли керована служба має запускатися через інший виконуваний файл, наприклад
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

Обгортку також можна задати через середовище. `gateway install` перевіряє, що шлях указує на
виконуваний файл, записує обгортку в `ProgramArguments` служби та зберігає
`OPENCLAW_WRAPPER` у середовищі служби для подальших примусових перевстановлень, оновлень і виправлень
doctor.

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
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Використовуйте `gateway restart`, щоб перезапустити керовану службу. Не поєднуйте послідовно `gateway stop` і `gateway start` як заміну перезапуску.
    - На macOS `gateway stop` типово використовує `launchctl bootout`, що видаляє LaunchAgent із поточного сеансу завантаження без збереження вимкнення — автоматичне відновлення KeepAlive залишається активним для майбутніх збоїв, а `gateway start` повторно вмикає все без ручного `launchctl enable`. Передайте `--disable`, щоб постійно придушити KeepAlive і RunAtLoad, щоб Gateway не запускався повторно до наступного явного `gateway start`; використовуйте це, коли ручна зупинка має зберігатися після перезавантажень або перезапусків системи.
    - `gateway restart --safe` просить запущений Gateway попередньо перевірити активну роботу та запланувати один об’єднаний перезапуск після завершення активної роботи. Типовий безпечний перезапуск чекає на активну роботу до налаштованого `gateway.reload.deferralTimeoutMs` (типово 5 хвилин); коли цей бюджет вичерпується, перезапуск примусово виконується. Установіть `gateway.reload.deferralTimeoutMs` у `0` для безстрокового безпечного очікування, яке ніколи не примушує перезапуск. `--safe` не можна поєднувати з `--force` або `--wait`.
    - `gateway restart --wait 30s` перевизначає налаштований бюджет очікування завершення роботи перед перезапуском для цього перезапуску. Числа без одиниць вимірюються в мілісекундах; приймаються одиниці на кшталт `s`, `m` і `h`. `--wait 0` чекає безстроково.
    - `gateway restart --safe --skip-deferral` виконує безпечний перезапуск із урахуванням OpenClaw, але обходить шлюз відкладання, тому Gateway негайно випромінює перезапуск навіть коли повідомлено про блокери. Це аварійний вихід для оператора в разі завислих відкладань запуску завдань; вимагає `--safe`.
    - `gateway restart --force` пропускає очікування завершення активної роботи та перезапускає негайно. Використовуйте це, коли оператор уже перевірив перелічені блокери завдань і хоче повернути Gateway до роботи негайно.
    - Команди життєвого циклу приймають `--json` для скриптів.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Коли автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища служби.
    - Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не розв’язується, установлення закривається помилкою замість збереження резервного відкритого тексту.
    - Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
    - У виведеному режимі автентифікації лише оболонковий `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час установлення; використовуйте тривалу конфігурацію (`gateway.auth.password` або config `env`) під час установлення керованої служби.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки режим не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення Gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише Gateway з увімкненим виявленням Bonjour (типово) рекламують маяк.

Записи виявлення для широкої зони можуть містити такі підказки TXT:

- `role` (підказка ролі Gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (лише режим повного виявлення; клієнти типово використовують цілі SSH `22`, коли його немає)
- `tailnetDns` (ім’я хоста MagicDNS, коли доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (лише режим повного виявлення)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для команди (огляд/розв’язання).
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний вивід (також вимикає стилізацію/індикатор виконання).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований домен широкої зони, коли його ввімкнено.
- `wsUrl` у JSON-виводі виводиться з розв’язаної кінцевої точки служби, а не з підказок лише TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS і широкозонному DNS-SD `sshPort` і `cliPath` публікуються лише коли `discovery.mdns.mode` має значення `full`.

</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
