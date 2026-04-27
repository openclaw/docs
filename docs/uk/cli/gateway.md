---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення шлюзів через Bonjour (локально + DNS-SD широкої області)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запуск, запит і виявлення шлюзів
title: Gateway
x-i18n:
    generated_at: "2026-04-27T08:07:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c909e8f6e1fb56b612eb1a0826cd993626c9f65b1736924b33c95a37dc60d14
    source_path: cli/gateway.md
    workflow: 15
---

Gateway — це сервер WebSocket OpenClaw (канали, вузли, сесії, хуки). Підкоманди на цій сторінці використовуються під `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + DNS-SD широкої області.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw рекламує та знаходить шлюзи.
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
    - За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Використовуйте `--allow-unconfigured` для одноразових/розробницьких запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` запишуть `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та відновіть її замість неявного припущення локального режиму.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації й відмовляється «вгадувати local» за вас.
    - Прив’язка поза межами loopback без автентифікації заблокована (захисний механізм безпеки).
    - `SIGUSR1` запускає перезапуск у межах процесу, якщо це дозволено (`commands.restart` увімкнено за замовчуванням; встановіть `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як застосування gateway tool/config apply/update залишиться дозволеним).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден спеціальний стан термінала. Якщо ви обгортаєте CLI у TUI або введення в raw mode, відновіть термінал перед виходом.
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
  Перевизначення токена (також установлює `OPENCLAW_GATEWAY_TOKEN` для процесу).
</ParamField>
<ParamField path="--password <password>" type="string">
  Перевизначення пароля.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Прочитати пароль gateway з файлу.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Відкрити Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скинути конфігурацію serve/funnel Tailscale під час завершення роботи.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить захист запуску лише для одноразового/розробницького початкового налаштування; не записує і не відновлює файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + робочий простір, якщо вони відсутні (пропускає BOOTSTRAP.md).
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
Вбудований `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання запуску

- Установіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати час фаз під час запуску Gateway, включно із затримкою `eventLoopMax` для кожної фази та часом таблиці пошуку Plugin для installed-index, реєстру маніфестів, планування запуску та роботи owner-map.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти швидкодію запуску Gateway. Бенчмарк фіксує перший вивід процесу, `/healthz`, `/readyz`, час трасування запуску, затримку event loop і деталі часу таблиці пошуку Plugin.

## Запит до запущеного Gateway

Усі команди запиту використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: зручний для читання людиною формат (з кольором у TTY).
    - `--json`: машинозчитуваний JSON (без стилізації/індикатора).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши людський макет.
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
Коли ви задаєте `--url`, CLI не повертається до облікових даних із конфігурації чи середовища. Передайте `--token` або `--password` явно. Відсутність явно заданих облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпоінт `/healthz` — це перевірка життєздатності: він відповідає, щойно сервер може обробляти HTTP. HTTP-ендпоінт `/readyz` суворіший і лишається неготовим, поки побічні процеси запуску, канали або налаштовані хуки ще завершують ініціалізацію.

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

Отримати нещодавній записувач діагностичної стабільності із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальна кількість нещодавніх подій для включення (максимум `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фільтрувати за типом діагностичної події, наприклад `payload.large` або `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включати лише події після номера послідовності діагностики.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Прочитати збережений пакет стабільності замість звернення до запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану, або передайте шлях до JSON пакета безпосередньо.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати zip-файл із діагностикою підтримки, придатний для поширення, замість виведення деталей стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфіденційність і поведінка пакетів">
    - Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/плагінів і відредаговані зведення сесій. Вони не зберігають текст чату, тіла Webhook, результати інструментів, сирі тіла запитів або відповідей, токени, cookies, секретні значення, імена хостів чи сирі id сесій. Установіть `diagnostics.enabled: false`, щоб повністю вимкнути записувач.
    - У разі фатального завершення Gateway, тайм-аутів завершення роботи й помилок запуску під час перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо записувач має події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакета.
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip-файл діагностики, призначений для додавання до звітів про помилки. Модель конфіденційності та вміст пакета див. у [Експорт діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до вихідного zip-файлу. За замовчуванням — export для підтримки в каталозі стану.
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
  Вивести записаний шлях, розмір і маніфест як JSON.
</ParamField>

Експорт містить маніфест, зведення у Markdown, форму конфігурації, очищені деталі конфігурації, очищені зведення журналів, очищені знімки status/health Gateway і найновіший пакет стабільності, якщо він існує.

Він призначений для поширення. Він зберігає операційні деталі, що допомагають у налагодженні, як-от безпечні поля журналів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, id плагінів, id провайдерів, несекретні налаштування функцій і відредаговані повідомлення операційних журналів. Він пропускає або редагує текст чату, тіла Webhook, результати інструментів, облікові дані, cookies, ідентифікатори облікових записів/повідомлень, текст prompt/інструкцій, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст корисного навантаження користувача/чату/інструмента, експорт зберігає лише позначку про те, що повідомлення пропущено, і кількість його байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливостей підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль перевірки. Налаштований віддалений хост + localhost усе одно перевіряються.
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
  Пропустити перевірку підключення (лише перегляд служби).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати служби системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до перевірки читання й завершуватися з ненульовим кодом, якщо ця перевірка читання не вдалася. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статусу">
    - `gateway status` залишається доступним для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Типовий `gateway status` підтверджує стан служби, WebSocket-з’єднання та можливість автентифікації, видиму під час handshake. Він не підтверджує операції читання/запису/адміністрування.
    - Діагностичні проби не змінюють стан для першої автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис pairing read-only пристрою лише для перевірки статусу.
    - `gateway status` за можливості розв’язує налаштовані SecretRef автентифікації для probe auth.
    - Якщо потрібний SecretRef автентифікації не розв’язується в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли не вдається probe підключення/автентифікації; явно передайте `--token`/`--password` або спочатку виправте джерело секрету.
    - Якщо probe успішний, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибнопозитивних спрацьовувань.
    - Використовуйте `--require-rpc` у скриптах і автоматизації, коли недостатньо лише служби, що слухає, і потрібно, щоб також були працездатними виклики RPC з областю читання.
    - `--deep` додає best-effort-сканування додаткових інсталяцій launchd/systemd/schtasks. Коли виявлено кілька служб, схожих на gateway, людиночитаний вивід показує підказки з очищення та попереджає, що в більшості налаштувань на машині має працювати один gateway.
    - Людиночитаний вивід містить розв’язаний шлях до файлового журналу, а також знімок шляхів/дійсності конфігурації CLI-порівняно-зі-службою, щоб допомогти діагностувати дрейф профілю або каталогу стану.
  </Accordion>
  <Accordion title="Перевірки дрейфу автентифікації systemd у Linux">
    - В інсталяціях Linux systemd перевірки дрейфу автентифікації служби читають значення `Environment=` і `EnvironmentFile=` з unit-файлу (включно з `%h`, шляхами в лапках, кількома файлами й необов’язковими файлами з `-`).
    - Перевірки дрейфу розв’язують SecretRef `gateway.auth.token`, використовуючи об’єднане runtime env (спочатку env команди служби, потім резервне env процесу).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або mode не задано там, де може перемогти password і жоден кандидат токена не може перемогти), перевірки дрейфу токена пропускають розв’язання токена конфігурації.
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (loopback) **навіть якщо налаштовано віддалений**.

Якщо ви передасте `--url`, ця явна ціль додається перед обома. Людиночитаний вивід позначає цілі так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступно кілька gateway, буде виведено їх усі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але в більшості інсталяцій усе ще працює один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-з’єднання.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` показує, що probe зміг підтвердити щодо автентифікації. Це окремо від досяжності.
    - `Read probe: ok` означає, що також успішно виконалися докладні виклики RPC з областю читання (`health`/`status`/`system-presence`/`config.get`).
    - `Read probe: limited - missing scope: operator.read` означає, що з’єднання встановлено успішно, але RPC з областю читання обмежений. Це повідомляється як **погіршена** досяжність, а не повний збій.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює стан першої ідентичності пристрою чи pairing.
    - Код виходу є ненульовим лише тоді, коли жодна перевірена ціль не є досяжною.
  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль є досяжною.
    - `degraded`: принаймні для однієї цілі детальний RPC був обмежений за scope.
    - `capability`: найкраща можливість, виявлена серед досяжних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем, у такому порядку: явний URL, SSH-тунель, налаштований віддалений хост, потім локальний loopback.
    - `warnings[]`: записи попереджень best-effort з `code`, `message` і необов’язковими `targetIds`.
    - `network`: підказки URL локального loopback/tailnet, виведені з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів виявлення, використані для цього проходу probe.

    Для кожної цілі (`targets[].connect`):

    - `ok`: досяжність після з’єднання + класифікація degraded.
    - `rpcOk`: повний успіх детального RPC.
    - `scopeLimited`: детальний RPC не вдався через відсутню operator scope.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, якщо доступна.
    - `scopes`: надані scope, повідомлені в `hello-ok`, якщо доступні.
    - `capability`: показана класифікація можливостей автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: не вдалося налаштувати SSH-тунель; команда переключилася на прямі probe.
    - `multiple_gateways`: було досяжно більше ніж одну ціль; це незвично, якщо тільки ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
    - `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося розв’язати для цілі, що завершилася невдачею.
    - `probe_scope_limited`: WebSocket-з’єднання встановлено успішно, але read probe був обмежений через відсутність `operator.read`.
  </Accordion>
</AccordionGroup>

#### Віддалено через SSH (паритет із Mac app)

Режим macOS app «Remote over SSH» використовує локальне переспрямування порту, тому віддалений gateway (який може бути прив’язаний лише до loopback) стає досяжним за адресою `ws://127.0.0.1:<port>`.

Еквівалент у CLI:

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
  Вибрати перший виявлений хост gateway як SSH-ціль із розв’язаного endpoint виявлення (`local.` плюс налаштований wide-area domain, якщо є). Підказки лише з TXT ігноруються.
</ParamField>

Конфігурація (необов’язково, використовується як значення за замовчуванням):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий допоміжний засіб RPC.

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
  Головним чином для RPC у стилі агентів, які передають проміжні події потоком перед фінальним корисним навантаженням.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний вивід JSON.
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

### Інсталяція з wrapper

Використовуйте `--wrapper`, коли керована служба має запускатися через інший виконуваний файл, наприклад
shim менеджера секретів або допоміжний засіб запуску від іншого користувача. Wrapper отримує звичайні аргументи Gateway і
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

Ви також можете задати wrapper через середовище. `gateway install` перевіряє, що шлях
вказує на виконуваний файл, записує wrapper у `ProgramArguments` служби та зберігає
`OPENCLAW_WRAPPER` у середовищі служби для подальших примусових перевстановлень, оновлень і виправлень через doctor.

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
  <Accordion title="Параметри команди">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`
  </Accordion>
  <Accordion title="Поведінка життєвого циклу">
    - Використовуйте `gateway restart`, щоб перезапустити керовану службу. Не поєднуйте `gateway stop` і `gateway start` як заміну перезапуску; у macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.
    - Команди життєвого циклу підтримують `--json` для скриптів.
  </Accordion>
  <Accordion title="Автентифікація і SecretRefs під час інсталяції">
    - Коли для автентифікації токеном потрібен токен і `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища служби.
    - Якщо для автентифікації токеном потрібен токен, а налаштований SecretRef токена не розв’язується, інсталяція завершується в безпечному режимі замість збереження резервного відкритого тексту.
    - Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
    - У режимі виведеної автентифікації лише shell-змінна `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час інсталяції; використовуйте стійку конфігурацію (`gateway.auth.password` або config `env`) під час інсталяції керованої служби.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, інсталяцію буде заблоковано, доки режим не буде задано явно.
  </Accordion>
</AccordionGroup>

## Виявлення gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Багатоадресний DNS-SD: `local.`
- Одноадресний DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише gateway з увімкненим виявленням Bonjour (типово ввімкнено) рекламують маяк.

Записи виявлення Wide-Area містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти за замовчуванням використовують `22` для SSH-цілей, якщо його немає)
- `tailnetDns` (ім’я хоста MagicDNS, якщо доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленої інсталяції, записана в wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для кожної команди (browse/resolve).
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
- CLI сканує `local.` плюс налаштований wide-area domain, коли його увімкнено.
- `wsUrl` у JSON-виводі виводиться з розв’язаного endpoint служби, а не з підказок лише з TXT, таких як `lanHost` або `tailnetDns`.
- Для mDNS у `local.` `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` має значення `full`. Wide-area DNS-SD усе одно записує `cliPath`; `sshPort` там також залишається необов’язковим.
</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
