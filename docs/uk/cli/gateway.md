---
read_when:
    - Запуск Gateway із CLI (для розробки або на серверах)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення Gateway через Bonjour (локальний + глобальний DNS-SD)
sidebarTitle: Gateway
summary: CLI Gateway OpenClaw (`openclaw gateway`) — запуск, запити та виявлення шлюзів
title: Gateway
x-i18n:
    generated_at: "2026-07-12T13:07:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сеанси, хуки). Усі наведені нижче підкоманди доступні в `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Налаштування локального mDNS і глобального DNS-SD.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw оголошує та знаходить шлюзи.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration">
    Ключі конфігурації Gateway верхнього рівня.
  </Card>
</CardGroup>

## Запуск Gateway

```bash
openclaw gateway
openclaw gateway run   # рівнозначна явна форма
```

<AccordionGroup>
  <Accordion title="Поведінка під час запуску">
    - Відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Використовуйте `--allow-unconfigured` для спеціальних запусків або запусків у середовищі розробки; цей прапорець обходить перевірку без запису чи виправлення конфігурації.
    - `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл конфігурації існує, але `gateway.mode` відсутній, це вважається пошкодженою або перезаписаною конфігурацією, і Gateway не намагатиметься самостійно вгадати значення `local` — повторно виконайте початкове налаштування, установіть ключ вручну або передайте `--allow-unconfigured`.
    - Прив’язування за межами loopback без автентифікації блокується.
    - Значення `lan`, `tailnet` і `custom` для `--bind` наразі обробляються лише через шляхи IPv4; для конфігурацій із власним хостом лише з IPv6 потрібен допоміжний компонент IPv4 або проксі перед Gateway.
    - `SIGUSR1` запускає перезапуск усередині процесу, якщо це дозволено. `commands.restart` (типово: увімкнено) контролює надіслані ззовні сигнали `SIGUSR1`; установіть значення `false`, щоб заблокувати ручні перезапуски через сигнал ОС, водночас залишивши можливість перезапуску за допомогою команди `gateway restart`, інструмента Gateway і застосування або оновлення конфігурації.
    - `SIGINT`/`SIGTERM` зупиняють процес, але не відновлюють спеціальний стан термінала — якщо ви обгортаєте CLI у TUI або використовуєте введення в необробленому режимі, самостійно відновіть термінал перед виходом.

  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (типово береться з конфігурації або змінної середовища; зазвичай `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Режим прив’язування: `loopback` (типово), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Спільний токен для `connect.params.auth.token`. Типово використовується `OPENCLAW_GATEWAY_TOKEN`, якщо її встановлено.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Режим автентифікації: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль для `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Прочитати пароль Gateway із файлу.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Режим доступу через Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скинути конфігурацію Tailscale serve/funnel під час завершення роботи.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Запустити без обов’язкової перевірки `gateway.mode=local`. Лише для спеціальної ініціалізації або ініціалізації середовища розробки; не зберігає та не виправляє конфігурацію.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити конфігурацію та робочий простір для розробки, якщо вони відсутні (пропускає `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути конфігурацію для розробки, облікові дані, сеанси та робочий простір. Потребує `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Перед запуском завершити роботу всіх наявних слухачів на цільовому порту.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Докладне журналювання у stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показувати в консолі лише журнали серверної частини CLI (також вмикає stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Стиль журналу WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Псевдонім для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Записувати необроблені події потоку моделі у форматі JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях до JSONL необробленого потоку.
</ParamField>

`--claude-cli-logs` — застарілий псевдонім для `--cli-backend-logs`.

Для `--bind custom` установіть `gateway.customBindHost` на адресу IPv4. Для будь-якої адреси, крім `127.0.0.1` або `0.0.0.0`, також потрібна адреса `127.0.0.1` на тому самому порту для клієнтів на тому самому хості; запуск завершиться помилкою, якщо хоча б один зі слухачів не зможе виконати прив’язування. Універсальна адреса `0.0.0.0` не додає окремого обов’язкового псевдоніма. Для конфігурацій із власним хостом лише з IPv6 потрібен допоміжний компонент IPv4 або проксі перед Gateway.

## Перезапуск Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` просить запущений Gateway попередньо перевірити активну роботу та запланувати один об’єднаний перезапуск після її завершення. Очікування обмежене параметром `gateway.reload.deferralTimeoutMs` (типово: 5 хвилин / `300000`); коли відведений час спливає, перезапуск виконується примусово. Установіть `deferralTimeoutMs: 0`, щоб чекати необмежено довго (з періодичними попередженнями про незавершене очікування) замість примусового перезапуску. `--safe` не можна поєднувати з `--force` або `--wait`.

`--skip-deferral` обходить перевірку відкладення через активну роботу під час безпечного перезапуску, тому Gateway перезапускається негайно навіть за наявності повідомлених блокувальних чинників. Потребує `--safe` — використовуйте, коли відкладення зависло через некероване завдання.

`--wait <duration>` перевизначає час очікування завершення роботи для звичайного (небезпечного) перезапуску. Приймає значення в мілісекундах без суфікса або із суфіксами одиниць `ms`, `s`, `m`, `h`, `d` (наприклад, `30s`, `5m`, `1h30m`); `--wait 0` очікує необмежено довго. Несумісний із `--force` або `--safe`.

`--force` пропускає очікування завершення активної роботи та виконує перезапуск негайно. Звичайна команда `restart` (без прапорців) зберігає наявну поведінку перезапуску через диспетчер служб.

<Warning>
Вбудований у команду параметр `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, змінній середовища або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` записує тривалість фаз під час запуску, зокрема затримку `eventLoopMax` для кожної фази та час формування таблиць пошуку плагінів (індекс установлених плагінів, реєстр маніфестів, планування запуску, робота з картою власників).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` записує рядки `restart trace:`, пов’язані з перезапуском: обробку сигналів, очікування завершення активної роботи, фази завершення роботи, наступний запуск, час до готовності та показники пам’яті.
- `OPENCLAW_DIAGNOSTICS=timeline` разом із `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` записує в режимі найкращих зусиль часову шкалу діагностики запуску у форматі JSONL для зовнішніх засобів автоматизації контролю якості (рівнозначно конфігурації `diagnostics.flags: ["timeline"]`; шлях усе ще задається лише через змінну середовища). Додайте `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, щоб включити зразки циклу подій.
- `pnpm build`, а потім `pnpm test:startup:gateway -- --runs 5 --warmup 1` вимірюють продуктивність запуску Gateway через зібрану точку входу CLI: перший вивід процесу, `/healthz`, `/readyz`, часові показники трасування запуску, затримку циклу подій і час формування таблиць пошуку плагінів.
- `pnpm build`, а потім `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` вимірюють продуктивність перезапуску всередині процесу в macOS або Linux (не підтримується у Windows; для перезапуску потрібен `SIGUSR1`). Команда використовує `SIGUSR1`, вмикає обидва види трасування в дочірньому процесі та записує наступні `/healthz` і `/readyz`, час простою, час до готовності, використання CPU, RSS і показники трасування перезапуску.
- `/healthz` перевіряє життєздатність; `/readyz` — готовність до використання. Розглядайте рядки трасування та результати вимірювань як сигнал для визначення відповідального компонента, а не як остаточний висновок про продуктивність на основі одного проміжку чи зразка.

## Запити до запущеного Gateway

Усі команди запитів використовують RPC через WebSocket.

<Tabs>
  <Tab title="Режими виведення">
    - Типово: зручний для читання людиною формат (кольоровий у TTY).
    - `--json`: придатний для машинної обробки JSON (без стилізації та індикатора виконання).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши форматування для читання людиною.

  </Tab>
  <Tab title="Спільні параметри">
    - `--url <url>`: URL WebSocket для Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: час очікування або бюджет (типове значення залежить від команди; дивіться опис кожної команди нижче).
    - `--expect-final`: очікувати на «остаточну» відповідь (виклики агента).

  </Tab>
</Tabs>

<Note>
Коли ви задаєте `--url`, CLI не використовує резервні облікові дані з конфігурації або змінних середовища. Передайте `--token` або `--password` явно. Відсутність явно вказаних облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` — це перевірка життєздатності: вона повертає відповідь, щойно сервер може відповідати через HTTP. `/readyz` суворіша й залишається в стані помилки, доки допоміжні компоненти плагінів запуску, канали або налаштовані хуки ще ініціалізуються. Докладні локальні або автентифіковані відповіді `/readyz` містять блок діагностики `eventLoop` (затримка, завантаження, співвідношення до кількості ядер CPU, прапорець `degraded`).

<ParamField path="--port <port>" type="number">
  Звернутися до локального Gateway через local loopback на цьому порту. Перевизначає `OPENCLAW_GATEWAY_URL` і `OPENCLAW_GATEWAY_PORT` для цього виклику.
</ParamField>

### `gateway usage-cost`

Отримати зведення витрат використання з журналів сеансів.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Кількість днів, які потрібно включити.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Обмежити зведення одним ідентифікатором налаштованого агента.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Агрегувати дані всіх налаштованих агентів. Не можна поєднувати з `--agent`.
</ParamField>

### `gateway stability`

Отримати останні дані реєстратора діагностичної стабільності із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальна кількість останніх подій для включення (не більше `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фільтрувати за типом діагностичної події, наприклад `payload.large` або `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включити лише події після вказаного номера діагностичної послідовності.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Прочитати збережений пакет даних стабільності замість звернення до запущеного Gateway. `--bundle latest` (або просто `--bundle`) вибирає найновіший пакет у каталозі стану; також можна безпосередньо передати шлях до JSON-файлу пакета.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати придатний для передавання ZIP-архів діагностики підтримки замість виведення відомостей про стабільність.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виведення для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфіденційність і поведінка пакетів">
    - Записи зберігають операційні метадані: назви подій, кількість, розміри в байтах, показники пам’яті, стан черги та сеансу, ідентифікатори схвалень, назви каналів і плагінів, а також знеособлені зведення сеансів. Вони не містять текст чатів, тіл Webhook, виводу інструментів, необроблених тіл запитів і відповідей, токенів, файлів cookie, секретних значень, імен хостів і необроблених ідентифікаторів сеансів. Установіть `diagnostics.enabled: false`, щоб повністю вимкнути реєстратор.
    - Фатальні завершення Gateway, перевищення часу очікування під час завершення роботи та збої запуску після перезапуску записують той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо реєстратор містить події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виведення пакета.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний ZIP-архів діагностики, призначений для звітів про помилки. Опис моделі конфіденційності та вмісту пакета дивіться в розділі [Експорт діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до вихідного ZIP-файлу. За замовчуванням — експорт для служби підтримки в каталозі стану.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальна кількість очищених рядків журналу, які буде включено.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальна кількість байтів журналу для перевірки.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway для знімка стану працездатності.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для знімка стану працездатності.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для знімка стану працездатності.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Час очікування знімка статусу/стану працездатності.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого пакета стабільності.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести записані шлях, розмір і маніфест у форматі JSON.
</ParamField>

Експорт містить: `manifest.json` (перелік файлів), `summary.md` (підсумок у форматі Markdown), `diagnostics.json` (зведення верхнього рівня щодо конфігурації, журналів, виявлення, стабільності, статусу та стану працездатності), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` і `stability/latest.json`, якщо пакет існує.

Експорт призначений для передавання іншим. Він зберігає операційні відомості, корисні для налагодження, — безпечні поля журналів, назви підсистем, коди статусу, тривалості, налаштовані режими, порти, ідентифікатори плагінів і провайдерів, несекретні параметри функцій та операційні повідомлення журналу з вилученими конфіденційними даними — і вилучає або редагує текст чатів, тіла вебхуків, результати інструментів, облікові дані, файли cookie, ідентифікатори облікових записів і повідомлень, текст запитів та інструкцій, імена хостів і секретні значення. Коли повідомлення журналу схоже на текст корисного навантаження користувача, чату чи інструмента (наприклад, «користувач сказав», «текст чату», «результат інструмента», «тіло вебхука»), експорт зберігає лише факт вилучення повідомлення та кількість його байтів.

### `gateway status`

Показує службу Gateway (launchd/systemd/schtasks), а також необов’язкову перевірку підключення та автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль перевірки. Налаштовану віддалену адресу та localhost усе одно буде перевірено.
</ParamField>
<ParamField path="--token <token>" type="string">
  Автентифікація токеном для перевірки.
</ParamField>
<ParamField path="--password <password>" type="string">
  Автентифікація паролем для перевірки.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Час очікування перевірки.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Пропустити перевірку підключення (показати лише службу).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати служби системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Розширити перевірку підключення до перевірки читання та завершити роботу з ненульовим кодом у разі невдачі. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика статусу">
    - Залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Типовий вивід підтверджує стан служби, підключення WebSocket і можливість автентифікації, видиму під час рукостискання, — але не операції читання, запису чи адміністрування.
    - Перевірки не вносять змін під час первинної автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, але ніколи не створюють нову ідентичність пристрою CLI або запис сполучення лише для читання тільки заради перевірки статусу.
    - За можливості розв’язує налаштовані посилання SecretRef автентифікації для перевірки. Якщо потрібне посилання SecretRef не вдалося розв’язати, `--json` повідомляє `rpc.authWarning`, коли перевірка підключення чи автентифікації завершується невдало; явно передайте `--token`/`--password` або виправте джерело секрету. Попередження про нерозв’язану автентифікацію приховуються після успішної перевірки.
    - Вивід JSON містить `gateway.version`, коли запущений Gateway повідомляє її; `--require-rpc` може використати як резервне джерело корисне навантаження RPC `status.runtimeVersion`, якщо перевірка рукостискання не може надати метадані версії.
    - Використовуйте `--require-rpc` у сценаріях і автоматизації, коли служби, що прослуховує порт, недостатньо й також потрібна працездатність RPC з областю читання.
    - `--deep` шукає додаткові інсталяції launchd/systemd/schtasks; якщо знайдено кілька служб, схожих на Gateway, текстовий вивід показує підказки щодо очищення (зазвичай слід запускати один Gateway на машину) і, коли це доречно, повідомляє про нещодавню передачу керування під час перезапуску супервізора.
    - `--deep` також виконує перевірку конфігурації в режимі з урахуванням плагінів (`pluginValidation: "full"`) і показує попередження маніфестів плагінів (наприклад, про відсутні метадані конфігурації каналу). Типова команда `gateway status` зберігає швидкий шлях лише для читання, що пропускає перевірку плагінів.
    - Текстовий вивід містить визначений шлях до файлу журналу, а також шляхи й стан дійсності конфігурацій CLI та служби, щоб полегшити діагностику розбіжностей профілю або каталогу стану.

  </Accordion>
  <Accordion title="Перевірки розбіжностей автентифікації Linux systemd">
    - Перевірки розбіжностей автентифікації служби читають із юніта як `Environment=`, так і `EnvironmentFile=` (зокрема `%h`, шляхи в лапках, кілька файлів і необов’язкові файли з префіксом `-`).
    - Розв’язує посилання SecretRef `gateway.auth.token`, використовуючи об’єднане середовище виконання (спочатку середовище команди служби, потім резервно — середовище процесу).
    - Перевірки розбіжностей токена пропускають розв’язання токена з конфігурації, коли автентифікація токеном фактично неактивна (`gateway.auth.mode` явно має значення `password`/`none`/`trusted-proxy` або режим не задано, пароль може мати пріоритет і жоден кандидат на токен не може бути вибраний).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Команда для «налагодження всього». Вона завжди перевіряє:

- налаштований віддалений Gateway (якщо задано) та
- localhost (local loopback), **навіть якщо налаштовано віддалений Gateway**.

Передавання `--url` додає цю явну ціль перед обома іншими. У текстовому виводі цілі позначаються як `URL (явний)`, `Віддалений (налаштований)` / `Віддалений (налаштований, неактивний)` і `Local loopback`.

<Note>
Якщо доступні кілька цілей перевірки, буде виведено їх усі. Тунель SSH, URL TLS/проксі та налаштований віддалений URL можуть указувати на той самий Gateway навіть за різних транспортних портів; `multiple_gateways` використовується лише для доступних Gateway з різними або неоднозначними ідентичностями. Запуск кількох Gateway підтримується для ізольованих профілів (наприклад, аварійного бота), але більшість інсталяцій використовує один Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Використовувати цей порт для локальної цілі перевірки local loopback і віддаленого порту тунелю SSH. Без `--url` цей параметр вибирає лише локальну ціль local loopback замість URL середовища налаштованого Gateway, порту середовища або віддалених цілей.
</ParamField>

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Доступний: так` означає, що принаймні одна ціль прийняла підключення WebSocket.
    - `Можливості: лише читання|запис дозволено|адміністрування дозволено|очікування сполучення|лише підключення` повідомляє, що перевірка змогла підтвердити щодо автентифікації, окремо від доступності.
    - `Перевірка читання: успішно` означає, що деталізовані виклики RPC з областю читання (`health`/`status`/`system-presence`/`config.get`) також виконано успішно.
    - `Перевірка читання: обмежено — відсутня область: operator.read` означає, що підключення успішне, але RPC з областю читання обмежено. Це повідомляється як **погіршена** доступність, а не повна невдача.
    - `Перевірка читання: невдало` після `Підключення: успішно` означає, що WebSocket підключився, але наступна діагностика читання перевищила час очікування або завершилася невдало — це також **погіршений** стан, а не недоступність.
    - Як і `gateway status`, перевірка повторно використовує наявну кешовану автентифікацію пристрою, але не створює первинну ідентичність пристрою або стан сполучення.
    - Код завершення є ненульовим, лише коли жодна перевірена ціль не доступна.

  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль прийняла підключення, але не завершила повну деталізовану діагностику RPC.
    - `capability`: найкращий рівень можливостей серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активною, у такому порядку: явний URL, тунель SSH, налаштована віддалена ціль, локальний local loopback.
    - `warnings[]`: записи попереджень, сформовані за принципом максимально можливої повноти, з `code`, `message` і необов’язковим `targetIds`.
    - `network`: підказки URL для локального local loopback/tailnet, отримані з поточної конфігурації та мережевих параметрів хоста.
    - `discovery.timeoutMs` / `discovery.count`: фактичний бюджет виявлення та кількість результатів, використані під час цього проходу перевірки.

    Для кожної цілі (`targets[].connect`): `ok` (доступність і класифікація погіршеного стану), `rpcOk` (повний успіх деталізованого RPC), `scopeLimited` (деталізований RPC завершився невдало через відсутність області оператора).

    Для кожної цілі (`targets[].auth`): `role` і `scopes`, повідомлені в `hello-ok`, коли доступні, а також виведена класифікація `capability`.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: не вдалося налаштувати тунель SSH; команда перейшла до прямих перевірок.
    - `multiple_gateways`: були доступні Gateway з різними ідентичностями або OpenClaw не зміг підтвердити, що доступні цілі є тим самим Gateway. Тунель SSH, URL проксі або налаштований віддалений URL до того самого Gateway не спричиняють цього попередження.
    - `auth_secretref_unresolved`: не вдалося розв’язати налаштоване посилання SecretRef автентифікації для цілі, перевірка якої завершилася невдало.
    - `probe_scope_limited`: підключення WebSocket успішне, але перевірку читання обмежено через відсутність `operator.read`.
    - `local_tls_runtime_unavailable`: локальний TLS Gateway увімкнено, але OpenClaw не зміг завантажити відбиток локального сертифіката.

  </Accordion>
</AccordionGroup>

#### Віддалене підключення через SSH (відповідність застосунку Mac)

Режим застосунку macOS "Remote over SSH" використовує локальне перенаправлення порту, щоб віддалений Gateway, доступний лише через local loopback, став доступним за адресою `ws://127.0.0.1:<port>`.

Еквівалент у CLI:

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
  Вибрати перший виявлений хост Gateway як ціль SSH із визначеної кінцевої точки виявлення (`local.` разом із налаштованим глобальним доменом, якщо він є). Підказки, що містять лише TXT, ігноруються.
</ParamField>

Типові параметри конфігурації (необов’язкові): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Низькорівневий допоміжний засіб RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Рядок об’єкта JSON із параметрами.
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  Бюджет часу очікування.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Переважно для RPC у стилі агента, які транслюють проміжні події перед остаточним корисним навантаженням.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний вивід JSON.
</ParamField>

<Note>
`--params` має містити дійсний JSON, і кожен метод перевіряє власну структуру параметрів (зайві або неправильно названі поля відхиляються).
</Note>

## Керування службою Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Встановлення з обгорткою

Використовуйте `--wrapper`, коли керована служба має запускатися через інший виконуваний файл, наприклад адаптер менеджера секретів або допоміжний засіб запуску від імені іншого користувача. Обгортка отримує звичайні аргументи Gateway і відповідає за те, щоб зрештою виконати `openclaw` або Node із цими аргументами.

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

Також обгортку можна встановити через середовище. `gateway install` перевіряє, що шлях указує на виконуваний файл, записує обгортку в `ProgramArguments` служби та зберігає `OPENCLAW_WRAPPER` у середовищі служби для подальших примусових перевстановлень, оновлень і виправлень через doctor.

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
    - `gateway install`: `--port`, `--runtime <node|bun>` (типово: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Поведінка життєвого циклу">
    - Використовуйте `gateway restart`, щоб перезапустити керовану службу. Не поєднуйте послідовно `gateway stop` і `gateway start` як заміну перезапуску.
    - У macOS команда `gateway stop` типово використовує `launchctl bootout`, що видаляє LaunchAgent із поточного сеансу завантаження, не зберігаючи стан вимкнення — автоматичне відновлення KeepAlive залишається активним для майбутніх збоїв, а `gateway start` коректно повторно вмикає службу без ручного виконання `launchctl enable`. Передайте `--disable`, щоб постійно блокувати KeepAlive і RunAtLoad, аби Gateway не запускався повторно до наступного явного виконання `gateway start`; використовуйте це, якщо зупинка вручну має зберігатися після перезавантажень.
    - Команди життєвого циклу приймають `--json` для використання у скриптах.

  </Accordion>
  <Accordion title="Автентифікація та SecretRef під час установлення">
    - Коли для автентифікації за токеном потрібен токен, а `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, чи можна отримати значення SecretRef, але не зберігає отриманий токен у метаданих середовища служби.
    - Якщо для автентифікації за токеном потрібен токен, а значення налаштованого SecretRef токена неможливо отримати, установлення завершується відмовою замість збереження резервного відкритого тексту.
    - Для автентифікації за паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
    - У режимі автоматичного визначення автентифікації змінна `OPENCLAW_GATEWAY_PASSWORD`, доступна лише в оболонці, не послаблює вимог щодо токена під час установлення; під час установлення керованої служби використовуйте постійну конфігурацію (`gateway.auth.password` або `env` у конфігурації).
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки режим не буде задано явно.

  </Accordion>
</AccordionGroup>

## Виявлення Gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Багатоадресна DNS-SD: `local.`
- Одноадресна DNS-SD (Bonjour для глобальної мережі): виберіть домен (наприклад, `openclaw.internal.`) і налаштуйте розділену DNS та DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Маяк оголошують лише ті Gateway, для яких увімкнено виявлення Bonjour (типово).

Підказки TXT у кожному маяку: `role` (підказка щодо ролі Gateway), `transport` (підказка щодо транспорту, наприклад `gateway`), `gatewayPort` (порт WebSocket, зазвичай `18789`), `tailnetDns` (ім’я хоста MagicDNS, якщо доступне), `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката). `sshPort` і `cliPath` публікуються лише в режимі повного виявлення (`discovery.mdns.mode: "full"`; типовим є `"minimal"`, у якому їх пропущено — тоді клієнти типово використовують порт `22` для цілей SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Час очікування для кожної команди (перегляд/розпізнавання).
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний вивід (також вимикає стилізацію та індикатор перебігу).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Сканує `local.` і налаштований домен глобальної мережі, якщо його ввімкнено.
- `wsUrl` у виводі JSON визначається з розпізнаної кінцевої точки служби, а не лише з підказок TXT, як-от `lanHost` або `tailnetDns`.
- `discovery.mdns.mode` керує публікацією `sshPort`/`cliPath` як у mDNS `local.`, так і в DNS-SD глобальної мережі (див. вище).

</Note>

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Посібник з експлуатації Gateway](/uk/gateway)
