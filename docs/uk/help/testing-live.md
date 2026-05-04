---
read_when:
    - Запуск матриці реальних моделей / бекенду CLI / ACP / smoke-тестів медіапровайдера
    - Налагодження визначення облікових даних для тестів у реальному середовищі
    - Додавання нового живого тесту для конкретного провайдера
sidebarTitle: Live tests
summary: 'Тести в реальному середовищі (із мережевими зверненнями): матриця моделей, бекенди CLI, ACP, медіапровайдери, облікові дані'
title: 'Тестування: тестові набори в реальному середовищі'
x-i18n:
    generated_at: "2026-05-04T11:09:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03b8ca6348137a55c8d5f67c9c166a130a75a744f6a433cb00496756b29d7016
    source_path: help/testing-live.md
    workflow: 16
---

Для швидкого старту, QA-запускачів, модульних/інтеграційних наборів і Docker-потоків див.
[Тестування](/uk/help/testing). Ця сторінка описує **живі** (з доступом до мережі) тестові
набори: матрицю моделей, CLI-бекенди, ACP і живі тести медіапровайдерів, а також
обробку облікових даних.

## Живі тести: команди димової перевірки локального профілю

Підключіть `~/.profile` перед спеціальними живими перевірками, щоб ключі провайдерів і шляхи
локальних інструментів відповідали вашій оболонці:

```bash
source ~/.profile
```

Безпечна димова перевірка медіа:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безпечна димова перевірка готовності голосового виклику:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` є пробним запуском, якщо також не вказано `--yes`. Використовуйте `--yes` лише
тоді, коли ви свідомо хочете здійснити справжній сповіщувальний виклик. Для Twilio, Telnyx і
Plivo успішна перевірка готовності потребує публічної Webhook-URL-адреси; локальні варіанти
loopback/приватні резервні варіанти відхиляються за задумом.

## Живі тести: перевірка можливостей Android-вузла

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку зараз оголошує** підключений Android-вузол, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо налаштоване/ручне налаштування (набір не встановлює/не запускає/не спарює застосунок).
  - Перевірка `node.invoke` у Gateway для кожної команди вибраного Android-вузла.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключений і спарений із Gateway.
  - Застосунок утримується на передньому плані.
  - Дозволи/згода на захоплення надані для можливостей, які мають пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості про налаштування Android: [Застосунок Android](/uk/platforms/android)

## Живі тести: димова перевірка моделей (ключі профілю)

Живі тести розділено на два шари, щоб можна було ізолювати збої:

- «Пряма модель» показує, що провайдер/модель узагалі може відповідати з наданим ключем.
- «Димова перевірка Gateway» показує, що повний конвеєр Gateway+агент працює для цієї моделі (сеанси, історія, інструменти, політика пісочниці тощо).

### Шар 1: пряме завершення моделі (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике завершення для кожної моделі (і цільові регресії, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб фактично запустити цей набір; інакше він пропускається, щоб `pnpm test:live` лишався зосередженим на димовій перевірці Gateway
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний список дозволених моделей (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` є псевдонімом сучасного списку дозволених моделей
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (список дозволених через кому)
  - Сучасні/повні перевірки за замовчуванням мають підібрану високосигнальну верхню межу; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної сучасної перевірки або додатне число для меншої межі.
  - Вичерпні перевірки використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як тайм-аут усього тесту прямої моделі. За замовчуванням: 60 хвилин.
  - Проби прямої моделі за замовчуванням виконуються з паралелізмом 20; установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`, щоб перевизначити.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (список дозволених через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні значення env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати лише **сховище профілів**
- Навіщо це потрібно:
  - Відокремлює «API провайдера зламаний / ключ недійсний» від «конвеєр агента Gateway зламаний»
  - Містить невеликі ізольовані регресії (приклад: OpenAI Responses/Codex Responses, повтор відтворення reasoning + потоки викликів інструментів)

### Шар 2: Gateway + димова перевірка dev-агента (що фактично робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Запустити внутрішньопроцесний Gateway
  - Створити/пропатчити сеанс `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Перебрати моделі з ключами й перевірити:
    - «змістовну» відповідь (без інструментів)
    - справжній виклик інструмента працює (проба читання)
    - необов’язкові додаткові проби інструментів (проба exec+read)
    - регресійні шляхи OpenAI (лише виклик інструмента → подальше повідомлення) продовжують працювати
- Деталі проб (щоб можна було швидко пояснювати збої):
  - Проба `read`: тест записує nonce-файл у робочій області й просить агента `read` його та повернути nonce.
  - Проба `exec+read`: тест просить агента через `exec` записати nonce у тимчасовий файл, а потім через `read` прочитати його назад.
  - Проба зображення: тест долучає згенерований PNG (кіт + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: сучасний список дозволених моделей (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` є псевдонімом сучасного списку дозволених моделей
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Сучасні/повні перевірки Gateway за замовчуванням мають підібрану високосигнальну верхню межу; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної сучасної перевірки або додатне число для меншої межі.
- Як вибрати провайдерів (уникаючи «усього OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (список дозволених через кому)
- Проби інструментів і зображень завжди ввімкнені в цьому живому тесті:
  - проба `read` + проба `exec+read` (навантаження інструментів)
  - проба зображення запускається, коли модель оголошує підтримку введення зображень
  - Потік (на високому рівні):
    - Тест генерує маленький PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент пересилає мультимодальне повідомлення користувача до моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: дозволені незначні помилки)

<Tip>
Щоб побачити, що можна протестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Живі тести: димова перевірка CLI-бекенду (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + агент із використанням локального CLI-бекенду, не торкаючись вашої конфігурації за замовчуванням.
- Типові значення димової перевірки для конкретного бекенду містяться у визначенні `cli-backend.ts` відповідного Plugin.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка команди/аргументів/зображень надходить із метаданих Plugin відповідного CLI-бекенду.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати справжнє вкладення-зображення (шляхи вставляються в prompt). Docker-рецепти за замовчуванням вимикають це, якщо явно не запитано.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як CLI-аргументи замість вставлення в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються аргументи зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути пробу безперервності того самого сеансу Claude Sonnet -> Opus, коли вибрана модель підтримує ціль перемикання. Docker-рецепти за замовчуванням вимикають це для сукупної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути пробу MCP/інструментального loopback. Docker-рецепти за замовчуванням вимикають це, якщо явно не запитано.

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Дешева димова перевірка конфігурації Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Це не просить Gemini генерувати відповідь. Воно записує ті самі системні
налаштування, які OpenClaw надає Gemini, а потім запускає `gemini --debug mcp list`, щоб довести, що
збережений сервер `transport: "streamable-http"` нормалізується до HTTP MCP-форми Gemini
і може підключитися до локального streamable-HTTP MCP-сервера.

Docker-рецепт:

```bash
pnpm test:docker:live-cli-backend
```

Docker-рецепти для одного провайдера:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker-запускач розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає живу димову перевірку CLI-бекенду всередині Docker-образу репозиторію як некореневий користувач `node`.
- Він визначає метадані димової перевірки CLI з відповідного Plugin, а потім встановлює відповідний Linux-пакет CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс за `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносного OAuth підписки Claude Code через `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім запускає два ходи CLI-бекенду Gateway без збереження env-змінних API-ключа Anthropic. Ця лінія підписки за замовчуванням вимикає MCP/інструментальні проби Claude і проби зображень, оскільки Claude зараз маршрутизує використання сторонніх застосунків через оплату додаткового використання замість звичайних лімітів плану підписки.
- Жива димова перевірка CLI-бекенду тепер виконує той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик інструмента MCP `cron`, перевірений через CLI Gateway.
- Типова димова перевірка Claude також патчить сеанс із Sonnet на Opus і перевіряє, що відновлений сеанс усе ще пам’ятає попередню нотатку.

## Живі тести: досяжність HTTP/2-проксі APNs

- Тест: `src/infra/push-apns-http2.live.test.ts`
- Мета: тунелювати через локальний HTTP CONNECT-проксі до sandbox-кінцевої точки APNs Apple, надіслати HTTP/2-запит валідації APNs і перевірити, що справжня відповідь Apple `403 InvalidProviderToken` повертається через шлях проксі.
- Увімкнення:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Необов’язковий тайм-аут:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Живі тести: димова перевірка прив’язки ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язування ACP-розмови з live ACP-агентом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє до транскрипту прив’язаної ACP-сесії
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP-агенти в Docker: `claude,codex,gemini`
  - ACP-агент для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - ACP-бекенд: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Примітки:
  - Ця лінія використовує поверхню Gateway `chat.send` з доступними лише адміністратору синтетичними полями вихідного маршруту, щоб тести могли приєднувати контекст каналу повідомлень без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів Plugin `acpx` для вибраного агента ACP-стенда.
  - Створення MCP для Cron прив’язаної сесії за замовчуванням виконується best-effort, бо зовнішні ACP-стенди можуть скасовувати MCP-виклики після проходження доказу прив’язування/зображення; задайте `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, щоб зробити цю післяприв’язувальну Cron-перевірку суворою.

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

Примітки Docker:

- Docker-runner розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він послідовно запускає ACP bind smoke проти агрегованих live CLI-агентів: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він підвантажує `~/.profile`, розміщує відповідні матеріали автентифікації CLI у контейнері, а потім встановлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` або `opencode-ai`), якщо він відсутній. Сам ACP-бекенд — це вбудований пакет `acpx/runtime` з офіційного Plugin `acpx`.
- Варіант Droid для Docker розміщує `~/.factory` для налаштувань, передає `FACTORY_API_KEY` і вимагає цей API-ключ, бо локальна автентифікація Factory OAuth/keyring не переноситься в контейнер. Він використовує вбудований запис реєстру ACPX `droid exec --output-format acp`.
- Варіант OpenCode для Docker — це сувора регресійна лінія з одним агентом. Він записує тимчасову типову модель `OPENCODE_CONFIG_CONTENT` з `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (за замовчуванням `opencode/kimi-k2.6`) після підвантаження `~/.profile`, а `pnpm test:docker:live-acp-bind:opencode` вимагає транскрипт прив’язаного асистента замість прийняття загального післяприв’язувального пропуску.
- Прямі виклики CLI `acpx` є лише ручним/обхідним шляхом для порівняння поведінки поза Gateway. Docker ACP bind smoke перевіряє вбудований у OpenClaw runtime-бекенд `acpx`.

## Live: Codex app-server harness smoke

- Мета: перевірити належний Plugin стенд Codex через звичайний метод gateway
  `agent`:
  - завантажити bundled Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший gateway agent turn до `openai/gpt-5.5` із примусово ввімкненим стендом Codex
  - надіслати другий turn до тієї самої сесії OpenClaw і перевірити, що потік app-server
    може відновитися
  - запустити `/codex status` і `/codex models` через той самий шлях команди gateway
  - необов’язково запустити дві перевірені Guardian проби escalated shell: одну безпечну
    команду, яку має бути схвалено, і одне фальшиве завантаження секрету, яке має бути
    відхилено, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.5`
- Необов’язкова перевірка зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова перевірка MCP/інструменту: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова перевірка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke використовує `agentRuntime.id: "codex"`, тож зламаний стенд Codex не може
  пройти, непомітно відкотившись до PI.
- Автентифікація: автентифікація app-server Codex з локального входу підписки Codex. Docker
  smokes також можуть надавати `OPENAI_API_KEY` для не-Codex перевірок, коли це застосовно,
  а також необов’язково скопійовані `~/.codex/auth.json` і `~/.codex/config.toml`.

Локальний рецепт:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Рецепт Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки Docker:

- Docker-runner розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він підвантажує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли автентифікації Codex CLI,
  коли вони присутні, встановлює `@openai/codex` у змонтований npm-префікс із правом запису,
  розміщує дерево джерельного коду, а потім запускає лише live-тест стенда Codex.
- Docker за замовчуванням умикає перевірки зображення, MCP/інструменту та Guardian. Задайте
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` чи
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий debug-запуск.
- Docker використовує ту саму явну конфігурацію runtime Codex, тож застарілі псевдоніми або fallback до PI
  не можуть приховати регресію стенда Codex.

### Рекомендовані live-рецепти

Вузькі, явні allowlists є найшвидшими та найменш нестабільними:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів у кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - Якщо локальні ключі зберігаються в профілі shell: `source ~/.profile`
  - Динамічне типове Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамічний бюджет Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст Antigravity OAuth (endpoint агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений у Google Gemini API через HTTP (API-ключ / автентифікація профілю); саме це більшість користувачів має на увазі під “Gemini”.
  - CLI: OpenClaw запускає локальний бінарний файл `gemini` через shell; він має власну автентифікацію та може поводитися інакше (підтримка streaming/інструментів/розбіжність версій).

## Live: матриця моделей (що ми покриваємо)

Немає фіксованого “списку моделей CI” (live є opt-in), але це **рекомендовані** моделі для регулярного покриття на dev-машині з ключами.

### Сучасний smoke-набір (виклик інструментів + зображення)

Це запуск “поширених моделей”, який, як ми очікуємо, має й надалі працювати:

- OpenAI (не Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Запустіть gateway smoke з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Виберіть принаймні одну модель на кожну родину провайдера:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4.3` (або остання доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо маєте доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI з підтримкою vision тощо), щоб виконати перевірку зображення.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів+зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, яких можна включити до live-матриці (якщо маєте креденшіали/конфігурацію):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (користувацькі endpoints): `minimax` (cloud/API), а також будь-який сумісний з OpenAI/Anthropic proxy (LM Studio, vLLM, LiteLLM тощо)

<Tip>
Не хардкодьте "all models" у документації. Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині, плюс доступні ключі.
</Tip>

## Облікові дані (ніколи не комітьте)

Live-тести виявляють облікові дані так само, як це робить CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест повідомляє «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «profile keys» у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Застарілий каталог стану: `~/.openclaw/credentials/` (копіюється до підготовленого live-домашнього каталогу, якщо наявний, але не є основним сховищем profile-key)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для окремих агентів, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового тестового домашнього каталогу; підготовлені live-домашні каталоги пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` вилучаються, щоб перевірки не торкалися вашого справжнього робочого простору на хості.

Якщо ви хочете покладатися на ключі env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-запускачі нижче (вони можуть монтувати `~/.profile` у контейнер).

## Deepgram live (транскрипція аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live-план кодування BytePlus

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Область:
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо `plugins.entries.comfy.config.<capability>` не налаштовано
  - Корисно після змін у надсиланні workflow comfy, опитуванні, завантаженнях або реєстрації Plugin

## Image generation live

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Область:
  - Перелічує кожен зареєстрований Plugin провайдера генерації зображень
  - Завантажує відсутні env-змінні провайдера з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, тож застарілі тестові ключі в `auth-profiles.json` не приховують справжні облікові дані shell
  - Пропускає провайдери без придатної автентифікації/профілю/моделі
  - Запускає кожного налаштованого провайдера через спільний runtime генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, коли провайдер оголошує підтримку редагування
- Поточні охоплені вбудовані провайдери:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

Для постачуваного шляху CLI додайте smoke `infer` після успішного проходження live-тесту провайдера/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це охоплює розбір аргументів CLI, розв’язання конфігурації/агента за замовчуванням, активацію вбудованих Plugin, спільний runtime генерації зображень і live-запит до провайдера. Очікується, що залежності Plugin будуть наявні до завантаження runtime.

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Область:
  - Перевіряє спільний вбудований шлях провайдера генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env-змінні провайдера з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, тож застарілі тестові ключі в `auth-profiles.json` не приховують справжні облікові дані shell
  - Пропускає провайдери без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені режими runtime, коли вони доступні:
    - `generate` з введенням лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне охоплення shared-lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Область:
  - Перевіряє спільний вбудований шлях провайдера генерації відео
  - За замовчуванням використовує release-safe smoke-шлях: провайдери не FAL, один запит text-to-video на провайдера, односекундний prompt із lobster і ліміт операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, бо затримка черги на боці провайдера може домінувати над часом релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env-змінні провайдера з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, тож застарілі тестові ключі в `auth-profiles.json` не приховують справжні облікові дані shell
  - Пропускає провайдери без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими перетворення, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled`, а вибраний провайдер/модель приймає локальне зображення на основі буфера у спільному sweep
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled`, а вибраний провайдер/модель приймає локальне відео на основі буфера у спільному sweep
  - Поточні оголошені, але пропущені провайдери `imageToVideo` у спільному sweep:
    - `vydra`, бо вбудований `veo3` є лише text-only, а вбудований `kling` потребує віддаленої URL-адреси зображення
  - Специфічне для провайдера охоплення Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс lane `kling`, який за замовчуванням використовує fixture віддаленої URL-адреси зображення
  - Поточне live-охоплення `videoToVideo`:
    - `runway` лише коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у спільному sweep:
    - `alibaba`, `qwen`, `xai`, бо ці шляхи наразі потребують віддалених `http(s)` / MP4 reference URL
    - `google`, бо поточний спільний lane Gemini/Veo використовує локальне введення на основі буфера, а цей шлях не приймається у спільному sweep
    - `openai`, бо поточний спільний lane не має гарантій доступу до video inpaint/remix, специфічних для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера в стандартний sweep, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт кожної операції провайдера для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики й відео через одну repo-native точку входу
  - Автоматично завантажує відсутні env-змінні провайдера з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тож поведінка Heartbeat і quiet-mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — модульні, інтеграційні, QA- та Docker-набори
