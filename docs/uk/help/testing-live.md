---
read_when:
    - Запуск матриці live-моделей / бекенда CLI / ACP / smoke-тестів медіапровайдера
    - Налагодження визначення облікових даних для живих тестів
    - Додавання нового тесту в реальному середовищі для конкретного провайдера
sidebarTitle: Live tests
summary: 'Живі (що звертаються до мережі) тести: матриця моделей, бекенди CLI, ACP, постачальники медіа, облікові дані'
title: 'Тестування: набори тестів у реальному середовищі'
x-i18n:
    generated_at: "2026-05-03T04:51:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4057d8875fa3404108e89e4381c1dd14e96abbc2af13c4934fc6c0dbf878fc00
    source_path: help/testing-live.md
    workflow: 16
---

Для швидкого старту, QA-запускачів, модульних/інтеграційних наборів і Docker-процесів див.
[Тестування](/uk/help/testing). Ця сторінка описує **живі** (ті, що звертаються до мережі) тестові
набори: матрицю моделей, CLI-бекенди, ACP і живі тести медіапровайдерів, а також
роботу з обліковими даними.

## Живі тести: smoke-команди локального профілю

Перед ситуативними живими перевірками підключіть `~/.profile`, щоб ключі провайдерів і локальні шляхи інструментів
відповідали вашій оболонці:

```bash
source ~/.profile
```

Безпечна smoke-перевірка медіа:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безпечна smoke-перевірка готовності голосового виклику:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` є пробним запуском, якщо також не вказано `--yes`. Використовуйте `--yes` лише
тоді, коли навмисно хочете здійснити реальний сповіщувальний виклик. Для Twilio, Telnyx і
Plivo успішна перевірка готовності вимагає публічної Webhook-URL; локальні
резервні варіанти loopback/private відхиляються за задумом.

## Живі тести: перевірка можливостей Android-вузла

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку наразі оголошує** підключений Android-вузол, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює/запускає/сполучає застосунок).
  - Перевірка gateway `node.invoke` окремо для кожної команди для вибраного Android-вузла.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключений і сполучений із gateway.
  - Застосунок утримується на передньому плані.
  - Дозволи/згоду на захоплення надано для можливостей, які ви очікуєте успішно пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Живі тести: smoke-перевірка моделей (ключі профілю)

Живі тести розділено на два шари, щоб можна було ізолювати збої:

- «Пряма модель» показує, чи провайдер/модель узагалі може відповісти з указаним ключем.
- «Gateway smoke» показує, чи повний конвеєр gateway+agent працює для цієї моделі (сесії, історія, інструменти, політика sandbox тощо).

### Шар 1: Пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перерахувати виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике завершення для кожної моделі (і цільові регресійні перевірки, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб фактично запустити цей набір; інакше він пропускається, щоб `pnpm test:live` лишався зосередженим на smoke-перевірці gateway
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний список дозволених моделей (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` є псевдонімом сучасного списку дозволених моделей
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (список дозволених через кому)
  - Сучасні/повні перевірки за замовчуванням мають curated high-signal ліміт; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної сучасної перевірки або додатне число для меншого ліміту.
  - Вичерпні перевірки використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як таймаут усього тесту прямої моделі. За замовчуванням: 60 хвилин.
  - Проби прямої моделі за замовчуванням запускаються з паралелізмом 20; установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`, щоб перевизначити.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (список дозволених через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілю та резервні значення env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати лише **сховище профілю**
- Навіщо це існує:
  - Відокремлює «API провайдера зламаний / ключ недійсний» від «конвеєр gateway agent зламаний»
  - Містить невеликі ізольовані регресійні перевірки (приклад: OpenAI Responses/Codex Responses reasoning replay + потоки викликів інструментів)

### Шар 2: Gateway + dev agent smoke (те, що фактично робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти gateway в процесі
  - Створити/виправити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Перебрати моделі з ключами та перевірити:
    - «змістовну» відповідь (без інструментів)
    - реальний виклик інструмента працює (проба читання)
    - необов’язкові додаткові проби інструментів (проба exec+read)
    - регресійні шляхи OpenAI (лише виклик інструмента → подальша відповідь) продовжують працювати
- Деталі проб (щоб ви могли швидко пояснити збої):
  - Проба `read`: тест записує nonce-файл у workspace і просить агента виконати `read` для нього та повернути nonce.
  - Проба `exec+read`: тест просить агента виконати `exec`-запис nonce у тимчасовий файл, а потім виконати `read` назад.
  - Проба зображення: тест прикріплює згенерований PNG (кіт + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: сучасний список дозволених моделей (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` є псевдонімом сучасного списку дозволених моделей
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити
  - Сучасні/повні gateway-перевірки за замовчуванням мають curated high-signal ліміт; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної сучасної перевірки або додатне число для меншого ліміту.
- Як вибрати провайдерів (уникати «усього OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (список дозволених через кому)
- Проби інструментів і зображень завжди ввімкнені в цьому живому тесті:
  - Проба `read` + проба `exec+read` (навантаження на інструменти)
  - Проба зображення запускається, коли модель оголошує підтримку введення зображень
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG із “CAT” + випадковий код (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований agent пересилає multimodal повідомлення користувача до моделі
    - Твердження: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволено)

<Tip>
Щоб побачити, що можна протестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Живі тести: smoke-перевірка CLI-бекенда (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent за допомогою локального CLI-бекенда, не торкаючись вашої конфігурації за замовчуванням.
- Значення smoke-перевірки за замовчуванням для конкретного бекенда містяться у визначенні `cli-backend.ts` Plugin-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значення за замовчуванням:
  - Провайдер/модель за замовчуванням: `claude-cli/claude-sonnet-4-6`
  - Поведінка команди/аргументів/зображення береться з метаданих CLI-бекенда Plugin-власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення зображення (шляхи вставляються в prompt). Docker-рецепти за замовчуванням вимикають це, якщо явно не запитано.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи файлів зображень як CLI-аргументи замість вставлення в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються аргументи зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути перевірку безперервності тієї самої сесії Claude Sonnet -> Opus, коли вибрана модель підтримує ціль перемикання. Docker-рецепти за замовчуванням вимикають це для сукупної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути MCP/tool loopback-пробу. Docker-рецепти за замовчуванням вимикають це, якщо явно не запитано.

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Дешева smoke-перевірка конфігурації Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Вона не просить Gemini генерувати відповідь. Вона записує ті самі системні
налаштування, які OpenClaw дає Gemini, а потім запускає `gemini --debug mcp list`, щоб довести, що
збережений сервер `transport: "streamable-http"` нормалізується до HTTP MCP-форми
Gemini і може підключитися до локального streamable-HTTP MCP-сервера.

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

Нотатки:

- Docker-запускач міститься в `scripts/test-live-cli-backend-docker.sh`.
- Він запускає живу smoke-перевірку CLI-бекенда всередині Docker-образу репозиторію як non-root користувач `node`.
- Він визначає метадані CLI-smoke з розширення-власника, а потім встановлює відповідний Linux CLI-пакет (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований префікс із правом запису за `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` вимагає переносний OAuth підписки Claude Code через `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` від `claude setup-token`. Спершу він доводить прямий `claude -p` у Docker, а потім запускає два ходи Gateway CLI-бекенда без збереження змінних env ключа Anthropic API. Ця лінія підписки за замовчуванням вимикає Claude MCP/tool і проби зображень, тому що Claude наразі маршрутизує використання стороннього застосунку через оплату додаткового використання замість звичайних лімітів плану підписки.
- Жива smoke-перевірка CLI-бекенда тепер виконує однаковий end-to-end потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Smoke-перевірка Claude за замовчуванням також виправляє сесію з Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Живі тести: smoke-перевірка ACP bind (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язування розмови ACP з живим агентом ACP:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє до транскрипту прив’язаної сесії ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - Агенти ACP у Docker: `claude,codex,gemini`
  - Агент ACP для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - Бекенд ACP: `acpx`
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
  - Ця смуга використовує поверхню Gateway `chat.send` із синтетичними полями маршруту походження лише для адміністраторів, щоб тести могли додавати контекст каналу повідомлень без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів Plugin `acpx` для вибраного агента тестового стенда ACP.
  - Створення MCP bound-session Cron типово виконується за найкращим зусиллям, бо зовнішні тестові стенди ACP можуть скасовувати виклики MCP після проходження перевірки прив’язування/зображення; задайте `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, щоб зробити цю перевірку Cron після прив’язування суворою.

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

- Запускач Docker розташований у `scripts/test-live-acp-bind-docker.sh`.
- Типово він послідовно запускає димову перевірку прив’язування ACP проти агрегованих живих агентів CLI: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він підвантажує `~/.profile`, розміщує відповідні матеріали автентифікації CLI у контейнері, потім встановлює запитаний живий CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` або `opencode-ai`), якщо його бракує. Сам бекенд ACP є вбудованим пакетом `acpx/runtime` з офіційного Plugin `acpx`.
- Варіант Docker для Droid розміщує `~/.factory` для налаштувань, передає `FACTORY_API_KEY` і вимагає цей API-ключ, бо локальна автентифікація Factory через OAuth/keyring не переноситься в контейнер. Він використовує вбудований запис реєстру ACPX `droid exec --output-format acp`.
- Варіант Docker для OpenCode є суворою регресійною смугою для одного агента. Він записує тимчасову типову модель `OPENCODE_CONFIG_CONTENT` з `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (типово `opencode/kimi-k2.6`) після підвантаження `~/.profile`, а `pnpm test:docker:live-acp-bind:opencode` вимагає транскрипт прив’язаного помічника замість прийняття загального пропуску після прив’язування.
- Прямі виклики CLI `acpx` є лише ручним/обхідним шляхом для порівняння поведінки поза Gateway. Димова перевірка прив’язування ACP у Docker перевіряє вбудований бекенд виконання `acpx` OpenClaw.

## Live: димова перевірка тестового стенда Codex app-server

- Мета: перевірити тестовий стенд Codex, яким володіє Plugin, через звичайний метод Gateway
  `agent`:
  - завантажити вбудований Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід агента Gateway до `openai/gpt-5.5` із примусово вибраним тестовим стендом Codex
  - надіслати другий хід до тієї самої сесії OpenClaw і перевірити, що потік app-server
    може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях команди Gateway
  - необов’язково виконати дві ескальовані проби оболонки, переглянуті Guardian: одну нешкідливу
    команду, яку має бути схвалено, і одне фальшиве завантаження секрету, яке має бути
    відхилено, щоб агент поставив уточнювальне запитання
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.5`
- Необов’язкова проба зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова проба MCP/інструмента: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова проба Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Димова перевірка використовує `agentRuntime.id: "codex"`, щоб несправний тестовий стенд Codex не міг
  пройти, непомітно відкотившись до PI.
- Автентифікація: автентифікація Codex app-server з локального входу в підписку Codex. Димові перевірки Docker
  також можуть надавати `OPENAI_API_KEY` для не-Codex проб, коли це застосовно,
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

- Запускач Docker розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він підвантажує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли автентифікації CLI Codex,
  коли вони присутні, встановлює `@openai/codex` у змонтований префікс npm із правом запису,
  розміщує дерево вихідного коду, а потім запускає лише live-тест тестового стенда Codex.
- Docker типово вмикає проби зображення, MCP/інструмента та Guardian. Задайте
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли вам потрібен вужчий запуск
  для налагодження.
- Docker використовує ту саму явну конфігурацію середовища виконання Codex, тому застарілі псевдоніми або
  відкат до PI не можуть приховати регресію тестового стенда Codex.

### Рекомендовані live-рецепти

Вузькі явні списки дозволених елементів є найшвидшими й найменш нестабільними:

- Одна модель, напряму (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, димова перевірка Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклики інструментів у кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (ключ Gemini API + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Димова перевірка адаптивного мислення Google:
  - Якщо локальні ключі зберігаються в профілі оболонки: `source ~/.profile`
  - Динамічне типове значення Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамічний бюджет Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст Antigravity OAuth (кінцева точка агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений у Google Gemini API через HTTP (API-ключ / автентифікація профілю); це те, що більшість користувачів має на увазі під “Gemini”.
  - CLI: OpenClaw запускає локальний двійковий файл `gemini` через оболонку; він має власну автентифікацію й може поводитися інакше (підтримка потокового передавання/інструментів/розбіжність версій).

## Live: матриця моделей (що ми покриваємо)

Немає фіксованого “списку моделей CI” (live є опціональним), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний набір димових перевірок (виклики інструментів + зображення)

Це запуск “поширених моделей”, який, як ми очікуємо, має залишатися працездатним:

- OpenAI (не Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Запустіть димову перевірку Gateway з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклики інструментів (Read + необов’язковий Exec)

Виберіть принаймні одну модель для кожної родини провайдерів:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (варто мати):

- xAI: `xai/grok-4.3` (або остання доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклики інструментів залежать від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI з підтримкою vision тощо), щоб виконати пробу зображення.

### Агрегатори / альтернативні шлюзи

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів+зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, які можна додати до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (кастомні кінцеві точки): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний проксі (LM Studio, vLLM, LiteLLM тощо)

<Tip>
Не хардкодьте "all models" у документації. Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині, плюс доступні ключі.
</Tip>

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як це робить CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знайти ті самі ключі.
- Якщо live-тест повідомляє “no creds”, налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (це те, що “profile keys” означає в live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється до staged live home, коли наявний, але не є основним сховищем profile-key)
- Локальні live-запуски типово копіюють активну конфігурацію, файли `auth-profiles.json` для кожного агента, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового тестового home; staged live homes пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` вилучаються, щоб probes не торкалися вашого справжнього робочого простору хоста.

Якщо хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker runners нижче (вони можуть монтувати `~/.profile` у контейнер).

## Deepgram live (транскрибування аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо `plugins.entries.comfy.config.<capability>` не налаштовано
  - Корисно після змін у надсиланні workflows comfy, polling, завантаженнях або реєстрації Plugin

## Image generation live

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований Plugin провайдера генерації зображень
  - Завантажує відсутні env vars провайдера з вашої login shell (`~/.profile`) перед probing
  - Типово використовує live/env API keys перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували справжні shell credentials
  - Пропускає провайдерів без придатної auth/profile/model
  - Запускає кожного налаштованого провайдера через спільний runtime генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, коли провайдер заявляє підтримку edit
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати env-only overrides

Для shipped CLI path додайте smoke `infer` після успішного проходження live-тесту провайдера/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це охоплює parsing аргументів CLI, розв’язання config/default-agent, активацію вбудованого Plugin, спільний runtime генерації зображень і live-запит до провайдера. Очікується, що залежності Plugin наявні до завантаження runtime.

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env vars провайдера з вашої login shell (`~/.profile`) перед probing
  - Типово використовує live/env API keys перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували справжні shell credentials
  - Пропускає провайдерів без придатної auth/profile/model
  - Запускає обидва заявлені runtime-режими, коли доступні:
    - `generate` з input лише prompt
    - `edit`, коли провайдер заявляє `capabilities.edit.enabled`
  - Поточне покриття shared-lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий Comfy live-файл, не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати env-only overrides

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації відео
  - Типово використовує release-safe smoke path: не-FAL провайдери, один text-to-video запит на провайдера, one-second lobster prompt і ліміт операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (типово `180000`)
  - Типово пропускає FAL, бо затримка provider-side queue може домінувати над часом release; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env vars провайдера з вашої login shell (`~/.profile`) перед probing
  - Типово використовує live/env API keys перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували справжні shell credentials
  - Пропускає провайдерів без придатної auth/profile/model
  - Типово запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати заявлені transform-режими, коли доступні:
    - `imageToVideo`, коли провайдер заявляє `capabilities.imageToVideo.enabled`, а вибрані provider/model приймають buffer-backed local image input у спільному sweep
    - `videoToVideo`, коли провайдер заявляє `capabilities.videoToVideo.enabled`, а вибрані provider/model приймають buffer-backed local video input у спільному sweep
  - Поточні заявлені, але пропущені провайдери `imageToVideo` у спільному sweep:
    - `vydra`, бо вбудований `veo3` є text-only, а вбудований `kling` потребує remote image URL
  - Provider-specific Vydra coverage:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс lane `kling`, який типово використовує fixture з remote image URL
  - Поточне live-покриття `videoToVideo`:
    - `runway` лише коли вибрана модель є `runway/gen4_aleph`
  - Поточні заявлені, але пропущені провайдери `videoToVideo` у спільному sweep:
    - `alibaba`, `qwen`, `xai`, бо ці шляхи наразі потребують remote `http(s)` / MP4 reference URLs
    - `google`, бо поточна shared Gemini/Veo lane використовує local buffer-backed input, і цей шлях не приймається у спільному sweep
    - `openai`, бо поточна shared lane не має гарантій org-specific доступу до video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера в default sweep, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт кожної операції провайдера для агресивного smoke run
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати env-only overrides

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні image, music і video live suites через одну repo-native entrypoint
  - Автоматично завантажує відсутні env vars провайдера з `~/.profile`
  - Типово автоматично звужує кожен suite до провайдерів, які наразі мають придатну auth
  - Повторно використовує `scripts/test-live.mjs`, тож поведінка Heartbeat і quiet-mode лишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — unit, integration, QA і Docker suites
