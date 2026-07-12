---
read_when:
    - Запуск перевірок працездатності матриці моделей у реальному середовищі / бекенду CLI / ACP / постачальника медіа моделей
    - Налагодження визначення облікових даних для тестування наживо
    - Додавання нового інтерактивного тесту для конкретного постачальника
sidebarTitle: Live tests
summary: 'Живі тести (із мережевою взаємодією): матриця моделей, бекенди CLI, ACP, постачальники медіа, облікові дані'
title: 'Тестування: набори тестів у реальному середовищі'
x-i18n:
    generated_at: "2026-07-12T13:22:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Для швидкого початку, засобів запуску QA, модульних/інтеграційних наборів тестів і сценаріїв Docker див.
[Тестування](/uk/help/testing). Ця сторінка охоплює **живі** тести (із мережевою взаємодією):
матрицю моделей, бекенди CLI, ACP, медіапровайдери та роботу з обліковими даними.

## Живі тести: локальні команди димового тестування

Перед разовими живими перевірками експортуйте потрібний ключ провайдера в середовище процесу.

Безпечний димовий тест медіа:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безпечний димовий тест готовності голосових викликів:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` виконується в режимі пробного запуску, якщо також не вказано `--yes`; використовуйте `--yes`, лише
якщо справді маєте намір здійснити виклик. Для Twilio, Telnyx і Plivo
успішна перевірка готовності потребує загальнодоступної URL-адреси вебхука — локальні/приватні
URL-адреси loopback відхиляються, оскільки ці провайдери не можуть до них підключитися.

## Живі тести: повна перевірка можливостей Android-вузла

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, що наразі оголошується** підключеним Android-вузлом, і перевірити поведінку контракту команд.
- Обсяг:
  - Попередньо налаштоване вручну середовище (набір тестів не встановлює, не запускає й не сполучає застосунок).
  - Перевірка через `node.invoke` у Gateway кожної команди для вибраного Android-вузла.
- Обов’язкове попереднє налаштування:
  - Застосунок Android уже підключено та сполучено з Gateway.
  - Застосунок залишається на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які мають пройти перевірку.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повна інформація про налаштування Android: [Застосунок Android](/uk/platforms/android)

## Живі тести: димове тестування моделей (ключі профілю)

Живі тести моделей розділено на два рівні, щоб ізолювати збої:

- «Пряма модель» показує, чи може провайдер/модель узагалі відповісти із заданим ключем.
- «Димовий тест Gateway» показує, чи працює для цієї моделі повний конвеєр Gateway+агент (сеанси, історія, інструменти, політика пісочниці тощо).

Наведені нижче підібрані списки моделей містяться в `src/agents/live-model-filter.ts` і
змінюються з часом; джерелом істини вважайте масиви в цьому файлі, а не цю
сторінку.

MiniMax M3 використовує `minimax/MiniMax-M3` як стандартне посилання на провайдера/модель.

### Рівень 1: пряме завершення моделі (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і цільові регресійні перевірки, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest безпосередньо)
  - Установіть `OPENCLAW_LIVE_MODELS=modern`, `small` або `all` (псевдонім для `modern`), щоб цей набір тестів справді виконувався; інакше його буде пропущено, тож сам по собі `pnpm test:live` залишається зосередженим на димовому тестуванні Gateway.
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern` запускає підібраний пріоритетний список із високою інформативністю (див. [Живі тести: матриця моделей](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` запускає підібраний пріоритетний список малих моделей
  - `OPENCLAW_LIVE_MODELS=all` є псевдонімом для `modern`
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (список дозволених значень, розділених комами)
  - Локальні запуски малих моделей Ollama за замовчуванням використовують `http://127.0.0.1:11434`; установлюйте `OPENCLAW_LIVE_OLLAMA_BASE_URL` лише для кінцевих точок у локальній мережі, власних кінцевих точок або Ollama Cloud.
  - Повні перевірки modern/all і small за замовчуванням обмежено довжиною відповідного підібраного списку; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної перевірки вибраного профілю або додатне число для меншого обмеження.
  - Вичерпні перевірки використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як тайм-аут усього тесту прямих моделей. Значення за замовчуванням: 60 хвилин.
  - Перевірки прямих моделей за замовчуванням виконуються з паралельністю 20; установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`, щоб перевизначити її.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (список дозволених значень, розділених комами)
- Звідки беруться ключі:
  - За замовчуванням: зі сховища профілів і резервних значень середовища
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб дозволити **лише сховище профілів**
- Навіщо це потрібно:
  - Відокремлює «API провайдера не працює / ключ недійсний» від «конвеєр агента Gateway не працює»
  - Містить невеликі ізольовані регресійні перевірки (приклад: відтворення міркувань OpenAI Responses/Codex Responses і потоки викликів інструментів)

### Рівень 2: димове тестування Gateway + агента розробки (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Запустити Gateway всередині процесу
  - Створити/оновити сеанс `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Перебрати моделі з ключами та перевірити:
    - «змістовну» відповідь (без інструментів)
    - роботу справжнього виклику інструмента (перевірка читання)
    - необов’язкові додаткові перевірки інструментів (перевірка виконання+читання)
    - подальшу роботу регресійних шляхів OpenAI (лише виклик інструмента -> наступний запит)
- Відомості про перевірки (щоб можна було швидко пояснити збої):
  - Перевірка `read`: тест записує файл із nonce у робочому просторі та просить агента прочитати його й повторити nonce у відповіді.
  - Перевірка `exec+read`: тест просить агента за допомогою `exec` записати nonce у тимчасовий файл, а потім прочитати його через `read`.
  - Перевірка зображення: тест додає згенерований PNG (кіт + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `test/helpers/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest безпосередньо)
- Як вибрати моделі:
  - За замовчуванням: підібраний пріоритетний список із високою інформативністю (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` запускає підібраний список малих моделей через повний конвеєр Gateway+агент
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` є псевдонімом для `modern`
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (чи список, розділений комами), щоб звузити вибір
  - Повні перевірки Gateway для modern/all і small за замовчуванням обмежено довжиною відповідного підібраного списку; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної вибраної перевірки або додатне число для меншого обмеження.
- Як вибрати провайдерів (щоб уникнути «усього через OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (список дозволених значень, розділених комами)
- Перевірки інструментів і зображень у цьому живому тесті завжди ввімкнено:
  - перевірка `read` + перевірка `exec+read` (навантаження на інструменти)
  - перевірка зображення виконується, коли модель заявляє про підтримку введення зображень
  - Потік (на високому рівні):
    - Тест генерує невеликий PNG із «CAT» + випадковим кодом (`test/helpers/live-image-probe.ts`)
    - Надсилає його через `agent` у `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway перетворює вкладення на `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент пересилає моделі мультимодальне повідомлення користувача
    - Перевірка: відповідь містить `cat` + код (допуск OCR: дозволено незначні помилки)

<Tip>
Щоб побачити, що можна протестувати на вашому комп’ютері (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Живі тести: димове тестування бекенда CLI (Claude, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + агент за допомогою локального бекенда CLI, не змінюючи стандартну конфігурацію.
- Стандартні параметри димового тестування для конкретного бекенда містяться у визначенні `cli-backend.ts` Plugin-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest безпосередньо)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Стандартні значення:
  - Стандартний провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка команд/аргументів/зображень визначається метаданими Plugin-власника бекенда CLI.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати справжнє вкладення із зображенням (шляхи додаються до запиту). За замовчуванням вимкнено в рецептах Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість додавання до запиту.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати передаванням аргументів зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб явно ввімкнути перевірку безперервності одного сеансу під час переходу Claude Sonnet -> Opus, якщо вибрана модель підтримує ціль перемикання. За замовчуванням вимкнено, зокрема в рецептах Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб явно ввімкнути перевірку MCP/loopback інструментів. За замовчуванням вимкнено в рецептах Docker.

Приклад:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Недорогий димовий тест конфігурації Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Цей тест не просить Gemini згенерувати відповідь. Він записує ті самі системні
налаштування, які OpenClaw передає Gemini, а потім запускає `gemini --debug mcp list`, щоб довести, що
збережений сервер `transport: "streamable-http"` нормалізується до HTTP-форми MCP для Gemini
і може підключитися до локального MCP-сервера з потоковим HTTP.

Рецепт Docker:

```bash
pnpm test:docker:live-cli-backend
```

Рецепти Docker для окремих провайдерів:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Засіб запуску Docker міститься в `scripts/test-live-cli-backend-docker.sh`.
- Він запускає живий димовий тест бекенда CLI всередині Docker-образу репозиторію від імені користувача `node` без прав root.
- Він отримує метадані димового тестування CLI з Plugin-власника, а потім установлює відповідний пакет CLI для Linux (`@anthropic-ai/claude-code` або `@google/gemini-cli`) у кешований доступний для запису префікс у `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` більше не є вбудованим бекендом CLI; натомість використовуйте `openai/*` із середовищем виконання сервера застосунку Codex (див. [Живі тести: димове тестування стенда сервера застосунку Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносної підпискової авторизації OAuth Claude Code через `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` від `claude setup-token`. Спочатку він перевіряє безпосередній запуск `claude -p` у Docker, а потім виконує два ходи бекенда CLI через Gateway без збереження змінних середовища ключа API Anthropic. Цей підписковий сценарій за замовчуванням вимикає перевірки MCP/інструментів і зображень Claude, оскільки він витрачає ліміти використання підписки авторизованого користувача, а Anthropic може змінювати правила оплати й обмеження частоти для Claude Agent SDK / `claude -p` без випуску нової версії OpenClaw.
- Claude і Gemini підтримують однаковий набір перевірок (текстовий хід, класифікація зображень, виклик інструмента MCP `cron`, безперервність перемикання моделей) за допомогою наведених вище прапорців, але жодна з цих перевірок не запускається за замовчуванням — вмикайте потрібні окремо відповідним прапорцем.

## Живі тести: доступність проксі APNs HTTP/2

- Тест: `src/infra/push-apns-http2.live.test.ts`
- Мета: створити тунель через локальний проксі HTTP CONNECT до тестової кінцевої точки APNs Apple, надіслати запит перевірки APNs HTTP/2 і переконатися, що справжня відповідь Apple `403 InvalidProviderToken` повертається через проксі.
- Увімкнення:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Необов’язковий тайм-аут:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Живі тести: димове тестування прив’язки ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язування розмови ACP за допомогою активного агента ACP:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати на місці синтетичну розмову каналу повідомлень
  - надіслати звичайне наступне повідомлення в тій самій розмові
  - переконатися, що наступне повідомлення потрапило до транскрипту прив’язаного сеансу ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - Агенти ACP у Docker: `claude,codex,gemini`
  - Агент ACP для безпосереднього `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови в стилі приватних повідомлень Slack
  - Серверна частина ACP: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (або `on`/`true`/`yes`), щоб примусово ввімкнути перевірку зображення; будь-яке інше значення примусово вимикає її. Типово виконується для кожного агента, крім `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Примітки:
  - Цей канал перевірки використовує поверхню `chat.send` Gateway із доступними лише адміністраторам синтетичними полями початкового маршруту, щоб тести могли додавати контекст каналу повідомлень, не імітуючи зовнішнє доставлення.
  - Якщо `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів вбудованого plugin `acpx` для вибраного агента тестового середовища ACP.
  - Створення MCP для Cron прив’язаного сеансу типово виконується за принципом максимально можливого результату, оскільки зовнішні тестові середовища ACP можуть скасовувати виклики MCP після успішної перевірки прив’язування або зображення; задайте `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, щоб зробити цю перевірку Cron після прив’язування суворою.

Приклад:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-acp-bind
```

Рецепти Docker для одного агента:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Примітки щодо Docker:

- Засіб запуску Docker розташований у `scripts/test-live-acp-bind-docker.sh`.
- Типово він послідовно запускає димову перевірку прив’язування ACP для сукупності активних агентів CLI: `claude`, `codex`, а потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він розміщує в контейнері відповідні матеріали автентифікації CLI, а потім, за відсутності, встановлює потрібний активний CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` або `opencode-ai`). Самою серверною частиною ACP є вбудований пакет `acpx/runtime` з офіційного plugin `acpx`.
- Варіант Docker для Droid розміщує `~/.factory` для налаштувань, передає `FACTORY_API_KEY` і вимагає цей ключ API, оскільки локальну автентифікацію Factory через OAuth або сховище ключів неможливо перенести до контейнера. Він використовує вбудований запис реєстру ACPX `droid exec --output-format acp`.
- Варіант Docker для OpenCode є суворим регресійним каналом перевірки одного агента. Він записує тимчасову типову модель `OPENCODE_CONFIG_CONTENT` зі значення `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (типово `opencode/kimi-k2.6`).
- Безпосередні виклики CLI `acpx` призначені лише для ручного використання або обходу проблем під час порівняння поведінки поза Gateway. Димова перевірка прив’язування ACP у Docker перевіряє вбудовану серверну частину середовища виконання `acpx` OpenClaw.

## Активна перевірка: димова перевірка тестового середовища сервера застосунку Codex

- Мета: перевірити тестове середовище Codex, яким володіє plugin, через звичайний метод Gateway
  `agent`:
  - завантажити вбудований plugin `codex`
  - вибрати модель OpenAI через `/model <ref> --runtime codex`
  - надіслати перший хід агента Gateway із потрібним рівнем міркування
  - надіслати другий хід до того самого сеансу OpenClaw і переконатися, що потік сервера застосунку
    можна продовжити
  - виконати `/codex status` і `/codex models` через той самий шлях команд Gateway
  - за потреби виконати дві перевірені Guardian перевірки команд оболонки з підвищеними правами: одну безпечну
    команду, яку слід схвалити, і одне надсилання фальшивого секрету, яке слід
    відхилити, щоб агент запросив підтвердження
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Базова модель тестового середовища: `openai/gpt-5.6-luna`
- Типовий вибір для нового ключа API OpenAI: `openai/gpt-5.6`
- Типовий рівень міркування: `low`
- Перевизначення моделі: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Перевизначення рівня міркування: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Перевизначення матриці: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Режим автентифікації: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (типово) використовує
  скопійований вхід Codex; `api-key` використовує `OPENAI_API_KEY` через сервер застосунку Codex.
- Необов’язкова перевірка зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова перевірка MCP/інструментів: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова перевірка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Димова перевірка примусово задає `agentRuntime.id: "codex"` для постачальника та моделі, тому несправне тестове
  середовище Codex не може пройти перевірку завдяки непомітному поверненню до OpenClaw.
- Автентифікація: автентифікація сервера застосунку Codex через локальний вхід передплати Codex або
  `OPENAI_API_KEY`, коли задано `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Для запусків із передплатою Docker може
  копіювати `~/.codex/auth.json` і `~/.codex/config.toml`.

Локальний рецепт:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-codex-harness
```

Матриця GPT-5.6 для нативного Codex:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Типове значення для нового ключа API OpenAI:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Ця перевірка залишає `OPENCLAW_LIVE_GATEWAY_MODELS` незаданою, визначає модель через
новий механізм вибору на етапі початкового налаштування, перевіряє `openai/gpt-5.6`, а потім
виконує реальний хід Gateway із визначеною моделлю.

Матриця GPT-5.6 для вбудованого OpenClaw:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Примітки щодо Docker:

- Засіб запуску Docker розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він передає `OPENAI_API_KEY`, копіює файли автентифікації CLI Codex за їх наявності, встановлює
  `@openai/codex` у доступний для запису змонтований префікс
  npm, розміщує дерево вихідного коду, а потім запускає лише активний тест тестового середовища Codex.
- Docker типово вмикає перевірки зображення, MCP/інструментів і Guardian. Задайте
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`, або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий налагоджувальний
  запуск.
- Docker використовує ту саму явну конфігурацію середовища виконання Codex, тому застарілі псевдоніми або резервне
  повернення до OpenClaw не можуть приховати регресію тестового середовища Codex.
- Цільові елементи матриці виконуються послідовно в одному контейнері. Скрипт Docker масштабує свій
  типовий 35-хвилинний час очікування відповідно до кількості цілей; будь-який зовнішній час очікування оболонки або CI має
  допускати таку саму загальну тривалість. Канонічний CI зберігає кожну ціль GPT-5.6 в окремому сегменті.

### Рекомендовані рецепти активних перевірок

Вузькі явні списки дозволених елементів працюють найшвидше та найстабільніше:

- Одна модель, безпосередньо (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Безпосередній профіль малої моделі:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Профіль малої моделі для Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Димова перевірка API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Одна модель, димова перевірка Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів у кількох постачальників:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Безпосередня димова перевірка GLM-5.2 для Z.AI Coding Plan:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Перевірка Google (ключ API Gemini + Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Димова перевірка адаптивного міркування Google (`qa manual` із приватного CLI контролю якості — потребує `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` і робочої копії вихідного коду; див. [огляд контролю якості](/uk/concepts/qa-e2e-automation)):
  - Динамічне типове значення Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамічний бюджет Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує API Gemini (ключ API).
- `google-antigravity/...` використовує міст OAuth Antigravity (кінцеву точку агента в стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний CLI Gemini на вашому комп’ютері (окрема автентифікація та особливості інструментів).
- API Gemini порівняно з CLI Gemini:
  - API: OpenClaw викликає розміщений Google API Gemini через HTTP (ключ API або автентифікація профілю); саме це більшість користувачів має на увазі під «Gemini».
  - CLI: OpenClaw запускає локальний двійковий файл `gemini` через оболонку; він має власну автентифікацію та може поводитися інакше (потокове передавання, підтримка інструментів, розбіжності версій).

## Активна перевірка: матриця моделей (що ми перевіряємо)

Активна перевірка вмикається явно, тому фіксованого «списку моделей CI» немає. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (і їхній псевдонім `all`) запускають сформований список пріоритетних моделей із `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` у `src/agents/live-model-filter.ts` у такому порядку пріоритету:

| Постачальник/модель                           | Примітки   |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

Добірний список **малих моделей** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`) із `SMALL_LIVE_MODEL_PRIORITY`:

| Постачальник/модель          |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Примітки щодо сучасного списку:

- Постачальники `codex` і `codex-cli` виключені зі стандартного сучасного прогону (вони охоплюють поведінку бекенду CLI/ACP, яку окремо перевірено вище). Сама модель `openai/gpt-5.5` за замовчуванням маршрутизується через тестове середовище сервера застосунку Codex; див. [Live: базова перевірка тестового середовища сервера застосунку Codex](#live-codex-app-server-harness-smoke).
- У сучасному прогоні `fireworks`, `google`, `openrouter` і `xai` запускають лише явно відібрані ідентифікатори моделей (без автоматичного розширення до «кожної моделі цього постачальника»).
- Додайте до `OPENCLAW_LIVE_GATEWAY_MODELS` принаймні одну модель із підтримкою зображень (варіанти Claude/Gemini/OpenAI із комп’ютерним зором тощо), щоб виконати перевірку зображень.

Запустіть базову перевірку Gateway з інструментами та зображенням на вручну відібраному наборі від різних постачальників:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Необов’язкове додаткове покриття поза добірними списками (бажано; виберіть увімкнену у вас модель із підтримкою інструментів):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (якщо у вас є доступ)
- LM Studio: `lmstudio/...` (локально; виклик інструментів залежить від режиму API)

### Агрегатори / альтернативні шлюзи

Якщо у вас увімкнено ключі, також можна тестувати через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти варіанти з підтримкою інструментів і зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші постачальники, яких можна додати до матриці перевірок Live (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Через `models.providers` (власні кінцеві точки): `minimax` (хмара/API), а також будь-який проксі, сумісний з OpenAI/Anthropic (LM Studio, vLLM, LiteLLM тощо)

<Tip>
Не задавайте «всі моделі» безпосередньо в документації. Авторитетним списком є все, що `discoverModels(...)` повертає на вашому комп’ютері, з урахуванням доступних ключів.
</Tip>

## Облікові дані (ніколи не додавайте до комітів)

Перевірки Live виявляють облікові дані так само, як CLI. Практичні наслідки:

- Якщо CLI працює, перевірки Live мають знайти ті самі ключі.
- Якщо перевірка Live повідомляє «немає облікових даних», діагностуйте проблему так само, як для `openclaw models list` / вибору моделі.

- Профілі автентифікації окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означають «ключі профілю» в перевірках Live)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілої конфігурації OAuth: `~/.openclaw/credentials/` (за наявності копіюється до підготовленого домашнього каталогу перевірок Live, але не є основним сховищем ключів профілю)
- Локальні запуски Live копіюють активну конфігурацію (без перевизначень `agents.*.workspace` / `agentDir`) і файл `auth-profiles.json` кожного агента, але не решту каталогу агента, тому дані з `workspace/` і `sandboxes/` ніколи не потрапляють до підготовленого домашнього каталогу, а також каталог застарілої конфігурації `credentials/` і підтримувані файли/каталоги автентифікації зовнішніх CLI (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) до тимчасового домашнього каталогу перевірок.

Якщо ви хочете покладатися на ключі зі змінних середовища, експортуйте їх перед локальними перевірками або використовуйте
наведені нижче засоби запуску Docker із явно заданим `OPENCLAW_PROFILE_FILE`.

## Перевірка Deepgram Live (транскрибування аудіо)

- Перевірка: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Перевірка Live тарифного плану BytePlus для програмування

- Перевірка: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Перевірка Live мультимедіа робочого процесу ComfyUI

- Перевірка: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо `plugins.entries.comfy.config.<capability>` не налаштовано
  - Корисно після змін у надсиланні робочих процесів comfy, опитуванні стану, завантаженнях або реєстрації Plugin

## Перевірка Live генерування зображень

- Перевірка: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Тестове середовище: `pnpm test:live:media image`
- Обсяг:
  - Перераховує всі зареєстровані Plugin постачальників генерування зображень
  - Перед перевіркою використовує вже експортовані змінні середовища постачальника
  - За замовчуванням надає ключам API із Live/середовища пріоритет над збереженими профілями автентифікації, тому застарілі тестові ключі в `auth-profiles.json` не приховують справжні облікові дані оболонки
  - Пропускає постачальників без придатної автентифікації, профілю або моделі
  - Запускає кожного налаштованого постачальника через спільне середовище виконання генерування зображень:
    - `<provider>:generate`
    - `<provider>:edit`, якщо постачальник заявляє про підтримку редагування
- Наразі охоплено такі вбудовані постачальники:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише через змінні середовища

Для шляху CLI, що постачається, додайте базову перевірку `infer` після успішного
проходження перевірки Live постачальника/середовища виконання:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це охоплює розбір аргументів CLI, визначення конфігурації/агента за замовчуванням, активацію вбудованого
Plugin, спільне середовище виконання генерування зображень і запит до постачальника Live.
Очікується, що залежності Plugin будуть наявні до завантаження середовища виконання.

## Перевірка Live генерування музики

- Перевірка: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Тестове середовище: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний вбудований шлях постачальників генерування музики
  - Наразі охоплює `fal`, `google`, `minimax` і `openrouter`
  - Перед перевіркою використовує вже експортовані змінні середовища постачальника
  - За замовчуванням надає ключам API із Live/середовища пріоритет над збереженими профілями автентифікації, тому застарілі тестові ключі в `auth-profiles.json` не приховують справжні облікові дані оболонки
  - Пропускає постачальників без придатної автентифікації, профілю або моделі
  - Запускає обидва заявлені режими середовища виконання, коли вони доступні:
    - `generate` із вхідними даними лише у вигляді запиту
    - `edit`, якщо постачальник заявляє `capabilities.edit.enabled`
  - `comfy` має власний окремий файл перевірки Live і не входить до цього спільного прогону
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише через змінні середовища

## Перевірка Live генерування відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Засіб тестування: `pnpm test:live:media video`
- Охоплення:
  - Перевіряє спільний шлях вбудованих постачальників генерації відео для `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - За замовчуванням використовує безпечний для випуску шлях димового тестування: один запит перетворення тексту на відео для кожного постачальника, запит із лобстером тривалістю одну секунду та обмеження тривалості операції для кожного постачальника з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (за замовчуванням `180000`)
  - За замовчуванням пропускає FAL, оскільки затримка в черзі на боці постачальника може зайняти більшу частину часу випуску; передайте `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (або очистьте список пропусків), щоб запустити його явно
  - Перед перевіркою використовує вже експортовані змінні середовища постачальника
  - За замовчуванням віддає перевагу API-ключам із поточного середовища перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не приховували справжні облікові дані оболонки
  - Пропускає постачальників без придатної автентифікації, профілю або моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими перетворення, коли вони доступні:
    - `imageToVideo`, коли постачальник оголошує `capabilities.imageToVideo.enabled`, а вибрані постачальник і модель приймають у спільному прогоні локальне вхідне зображення у вигляді буфера
    - `videoToVideo`, коли постачальник оголошує `capabilities.videoToVideo.enabled`, а вибрані постачальник і модель приймають у спільному прогоні локальне вхідне відео у вигляді буфера
  - Поточний постачальник `imageToVideo`, оголошений, але пропущений у спільному прогоні:
    - `vydra` (локальне вхідне зображення у вигляді буфера не підтримується в цьому маршруті)
  - Окреме покриття Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Цей файл запускає перетворення тексту на відео через `veo3`, а також маршрут перетворення зображення на відео через `kling`, який за замовчуванням використовує тестове віддалене URL-зображення (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` для перевизначення).
  - Окреме покриття xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Класичний сценарій спочатку генерує квадратний локальний перший кадр у форматі PNG, не вказує геометрію, запитує односекундний кліп перетворення зображення на відео, опитує стан до завершення та перевіряє завантажений буфер.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Сценарій 1.5 генерує локальний перший кадр у форматі PNG, запитує односекундний кліп перетворення зображення на відео з роздільною здатністю 1080P, опитує стан до завершення та перевіряє завантажений буфер.
  - Поточне живе покриття `videoToVideo`:
    - Лише `runway`, коли вибрана модель визначається як `gen4_aleph`
  - Поточні постачальники `videoToVideo`, оголошені, але пропущені у спільному прогоні:
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, оскільки ці шляхи наразі потребують віддалених URL-посилань `http(s)`, а не локальних вхідних даних у вигляді буфера
- Необов'язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного постачальника до стандартного прогону, зокрема FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження тривалості кожної операції постачальника для агресивного димового прогону
- Необов'язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише зі змінних середовища

## Засіб запуску живих тестів медіа

- Команда: `pnpm test:live:media`
- Точка входу: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, яка запускає `pnpm test:live -- <suite-test-file>` для кожного вибраного набору, тому поведінка Heartbeat і тихого режиму залишається узгодженою з іншими запусками `pnpm test:live`.
- Призначення:
  - Запускає спільні живі набори тестів зображень, музики та відео через єдину вбудовану точку входу репозиторію
  - Автоматично завантажує відсутні змінні середовища постачальника з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до постачальників, які наразі мають придатну автентифікацію
- Прапорці:
  - `--providers <csv>` — глобальний фільтр постачальників; `--image-providers` / `--music-providers` / `--video-providers` обмежують фільтр одним набором
  - `--all-providers` вимикає автоматичний фільтр на основі автентифікації
  - `--allow-empty` завершує роботу з кодом `0`, якщо після фільтрації не залишається постачальників, придатних для запуску
  - `--quiet` / `--no-quiet` передаються до `test:live`
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язані матеріали

- [Тестування](/uk/help/testing) — модульні, інтеграційні, QA- та Docker-набори тестів
