---
read_when:
    - Запуск перевірок live для матриці моделей / бекенду CLI / ACP / медіапровайдерів
    - Налагодження визначення облікових даних для живих тестів
    - Додавання нового живого тесту для конкретного провайдера
sidebarTitle: Live tests
summary: 'Живі (із мережевими зверненнями) тести: матриця моделей, бекенди CLI, ACP, медіапровайдери, облікові дані'
title: 'Тестування: живі набори тестів'
x-i18n:
    generated_at: "2026-04-25T20:48:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70f3539054e1e19f8a8f312e9b571a1e5894f868c3bc963756db4de9b6aaf8b0
    source_path: help/testing-live.md
    workflow: 15
---

Для швидкого старту, раннерів QA, unit/integration наборів і Docker-потоків див.
[Testing](/uk/help/testing). Ця сторінка охоплює **живі** (із мережевими зверненнями) набори тестів:
матрицю моделей, бекенди CLI, ACP і живі тести медіапровайдерів, а також
обробку облікових даних.

## Живі: команди локального smoke-тестування профілю

Підключайте `~/.profile` перед разовими живими перевірками, щоб ключі провайдерів і локальні шляхи до інструментів
відповідали вашій оболонці:

```bash
source ~/.profile
```

Безпечна медіаперевірка:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безпечна перевірка готовності голосового виклику:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` є dry run, якщо також не вказано `--yes`. Використовуйте `--yes` лише тоді,
коли ви свідомо хочете здійснити реальний сповіщувальний дзвінок. Для Twilio, Telnyx і
Plivo успішна перевірка готовності потребує публічного URL Webhook; fallback-варіанти лише для локального
loopback/приватного доступу навмисно відхиляються.

## Живі: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яка наразі оголошена** підключеним Android Node, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює, не запускає і не виконує pair для застосунку).
  - Покомандна перевірка gateway `node.invoke` для вибраного Android Node.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключено й pair виконано з Gateway.
  - Застосунок утримується на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте як успішні.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості щодо налаштування Android: [Android App](/uk/platforms/android)

## Живі: перевірка моделі (ключі профілю)

Живі тести поділено на два рівні, щоб можна було ізолювати збої:

- «Direct model» показує, чи може провайдер/модель взагалі відповісти з наданим ключем.
- «Gateway smoke» показує, чи працює для цієї моделі повний конвеєр gateway+agent (сесії, історія, інструменти, політика sandbox тощо).

### Рівень 1: Безпосереднє завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel` для вибору моделей, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і цільові регресійні перевірки за потреби)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо ви викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб цей набір справді виконувався; інакше його буде пропущено, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Для modern/all перевірок за замовчуванням використовується curated high-signal ліміт; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
  - Вичерпні перевірки використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як тайм-аут усього direct-model тесту. Типове значення: 60 хвилин.
  - Direct-model перевірки за замовчуванням виконуються з паралелізмом 20; щоб перевизначити, установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і fallback через env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламаний / ключ недійсний» від «конвеєр gateway agent зламаний»
  - Містить невеликі ізольовані регресії (приклад: OpenAI Responses/Codex Responses reasoning replay + потоки виклику інструментів)

### Рівень 2: Gateway + smoke dev agent (те, що фактично робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Запустити in-process Gateway
  - Створити/оновити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Перебрати моделі з ключами й перевірити:
    - «змістовну» відповідь (без інструментів)
    - що працює реальний виклик інструмента (перевірка `read`)
    - необов’язкові додаткові перевірки інструментів (перевірка exec+read)
    - що шляхи регресії OpenAI (лише tool-call → follow-up) і далі працюють
- Деталі перевірок (щоб ви могли швидко пояснити збої):
  - перевірка `read`: тест записує nonce-файл у workspace і просить agent виконати `read` для нього та повернути nonce у відповіді.
  - перевірка `exec+read`: тест просить agent через `exec` записати nonce у тимчасовий файл, а потім прочитати його назад через `read`.
  - перевірка зображення: тест додає згенерований PNG (кіт + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо ви викликаєте Vitest напряму)
- Як вибирати моделі:
  - За замовчуванням: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для сучасного allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Для modern/all gateway-перевірок за замовчуванням використовується curated high-signal ліміт; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
- Як вибирати провайдерів (уникати «OpenRouter everything»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Перевірки інструментів і зображень у цьому живому тесті завжди ввімкнені:
  - перевірка `read` + перевірка `exec+read` (навантаження на інструменти)
  - перевірка зображення запускається, коли модель повідомляє про підтримку введення зображень
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG з «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent пересилає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволено)

Порада: щоб побачити, що саме можна тестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Живі: перевірка бекенду CLI (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent із локальним бекендом CLI, не змінюючи вашу типову конфігурацію.
- Типові параметри smoke для конкретного бекенду містяться у визначенні `cli-backend.ts` відповідного Plugin.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо ви викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Команда/аргументи/поведінка зображень беруться з метаданих відповідного Plugin бекенду CLI.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати справжнє вкладення-зображення (шляхи вбудовуються в prompt). У рецептах Docker це типово вимкнено, якщо явно не запитано.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість вбудовування в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються аргументи зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути перевірку безперервності тієї самої сесії Claude Sonnet -> Opus, коли вибрана модель підтримує ціль перемикання. У рецептах Docker це типово вимкнено для загальної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути перевірку loopback MCP/tool. У рецептах Docker це типово вимкнено, якщо явно не запитано.

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Недорога перевірка конфігурації Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Це не просить Gemini згенерувати відповідь. Воно записує ті самі системні
налаштування, які OpenClaw передає Gemini, а потім запускає `gemini --debug mcp list`, щоб довести, що
збережений сервер `transport: "streamable-http"` нормалізується до HTTP MCP-форми Gemini і
може підключатися до локального streamable-HTTP MCP-сервера.

Рецепт Docker:

```bash
pnpm test:docker:live-cli-backend
```

Рецепти Docker для окремих провайдерів:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker runner розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає живу перевірку бекенду CLI всередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані перевірки CLI з відповідного extension, а потім установлює відповідний пакет Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований доступний для запису префікс у `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує portable Claude Code subscription OAuth через або `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім запускає два ходи Gateway CLI-backend без збереження змінних середовища Anthropic API-key. Цей subscription lane типово вимикає перевірки Claude MCP/tool і image, оскільки Claude наразі маршрутизує використання сторонніх застосунків через тарифікацію extra-usage, а не через звичайні ліміти плану підписки.
- Жива перевірка бекенду CLI тепер охоплює той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Типова перевірка Claude також оновлює сесію із Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Живі: перевірка прив’язки ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік ACP conversation-bind із живим ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне follow-up у тій самій розмові
  - перевірити, що follow-up потрапляє до transcript прив’язаної ACP-сесії
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP agents у Docker: `claude,codex,gemini`
  - ACP agent для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови в стилі Slack DM
  - Бекенд ACP: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Примітки:
  - Ця lane використовує поверхню gateway `chat.send` з admin-only синтетичними полями originating-route, щоб тести могли приєднувати контекст каналу повідомлень без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр agent із вбудованого Plugin `acpx` для вибраного ACP harness agent.

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

Рецепти Docker для одного agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Примітки щодо Docker:

- Docker runner розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає ACP bind smoke для сукупних живих CLI agents послідовно: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він підключає `~/.profile`, підготовлює відповідні матеріали автентифікації CLI в контейнері, а потім установлює запитаний живий CLI (`@anthropic-ai/claude-code`, `@openai/codex`, `@google/gemini-cli` або `opencode-ai`), якщо його бракує. Сам бекенд ACP — це вбудований пакет `acpx/runtime` із Plugin `acpx`.
- Варіант OpenCode для Docker — це сувора регресійна lane для одного agent. Він записує тимчасову типову модель `OPENCODE_CONFIG_CONTENT` з `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (типово `opencode/kimi-k2.6`) після підключення `~/.profile`, а `pnpm test:docker:live-acp-bind:opencode` вимагає transcript прив’язаного assistant замість прийняття загального post-bind skip.
- Прямі виклики CLI `acpx` — це лише ручний/обхідний шлях для порівняння поведінки поза Gateway. Docker ACP bind smoke перевіряє вбудований бекенд середовища виконання `acpx` в OpenClaw.

## Живі: smoke Codex app-server harness

- Мета: перевірити Codex harness, що належить Plugin, через звичайний метод gateway
  `agent`:
  - завантажити вбудований Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `openai/gpt-5.2` із примусово вибраним Codex harness
  - надіслати другий хід до тієї самої сесії OpenClaw і перевірити, що потік
    app-server може бути відновлений
  - виконати `/codex status` і `/codex models` через той самий шлях
    команд gateway
  - за потреби виконати дві Guardian-reviewed перевірки shell з підвищенням прав: одну нешкідливу
    команду, яку має бути схвалено, і одне фальшиве вивантаження секрету, яке має бути
    відхилено, щоб agent перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.2`
- Необов’язкова перевірка зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова перевірка MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова перевірка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний Codex
  harness не міг пройти непомітно через fallback до PI.
- Автентифікація: автентифікація Codex app-server із локального входу в підписку Codex. Docker
  smoke-тести також можуть передавати `OPENAI_API_KEY` для не-Codex перевірок, де це доречно,
  а також за потреби скопійовані `~/.codex/auth.json` і `~/.codex/config.toml`.

Локальний рецепт:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Рецепт Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker runner розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він підключає змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації Codex CLI за наявності, установлює `@openai/codex` у доступний для запису змонтований npm
  префікс, готує дерево вихідного коду, а потім запускає лише живий тест Codex-harness.
- У Docker перевірки image, MCP/tool і Guardian увімкнені за замовчуванням. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий
  налагоджувальний запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, відповідно до конфігурації живого
  тесту, щоб застарілі псевдоніми або fallback до PI не могли приховати регресію
  Codex harness.

### Рекомендовані живі рецепти

Вузькі, явні allowlist є найшвидшими й найменш нестабільними:

- Одна модель, direct (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклики інструментів для кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (ключ API Gemini + Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptive thinking для Google:
  - Якщо локальні ключі зберігаються в профілі оболонки: `source ~/.profile`
  - Gemini 3 dynamic default: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує API Gemini (ключ API).
- `google-antigravity/...` використовує OAuth-міст Antigravity (кінцева точка agent у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (ключ API / автентифікація профілю); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw виконує локальний двійковий файл `gemini`; він має власну автентифікацію й може поводитися інакше (streaming/підтримка інструментів/розбіжність версій).

## Живі: матриця моделей (що ми охоплюємо)

Немає фіксованого «списку моделей CI» (живі тести вмикаються за бажанням), але це **рекомендовані** моделі для регулярного покриття на dev-машині з ключами.

### Сучасний набір smoke (виклик інструментів + зображення)

Це запуск «поширених моделей», який ми очікуємо зберігати працездатним:

- OpenAI (не-Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск gateway smoke з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Виберіть щонайменше одну модель на сімейство провайдерів:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою інструментів, яку у вас ввімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Включіть щонайменше одну модель із підтримкою зображень у `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/варіанти OpenAI з підтримкою Vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнено ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти відповідні кандидати з підтримкою інструментів і зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до живої матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні кінцеві точки): `minimax` (хмара/API), а також будь-який OpenAI/Anthropic-сумісний проксі (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко фіксувати в документації «усі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, плюс доступні ключі.

## Облікові дані (ніколи не комітьте)

Живі тести виявляють облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, живі тести мають знаходити ті самі ключі.
- Якщо живий тест повідомляє «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «ключі профілю» у живих тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється до staged live home за наявності, але не є основним сховищем ключів профілю)
- Локальні живі запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного agent, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового test home; staged live homes пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` і `agentDir` видаляються, щоб перевірки не торкалися вашого реального host workspace.

Якщо ви хочете покладатися на ключі з env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker runners нижче (вони можуть монтувати `~/.profile` у контейнер).

## Живий Deepgram (транскрипція аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Живий BytePlus coding plan

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Живий ComfyUI workflow media

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для зображень, відео і `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `plugins.entries.comfy.config.<capability>`
  - Корисно після змін у надсиланні comfy workflow, polling, завантаженнях або реєстрації plugin

## Жива генерація зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований provider plugin генерації зображень
  - Завантажує відсутні змінні env провайдерів із вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує ключі live/env API раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає кожного налаштованого провайдера через спільне середовище виконання генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, коли провайдер заявляє підтримку редагування
- Поточні вбудовані провайдери, які охоплено:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

Для shipped шляху CLI додайте smoke для `infer` після того, як живий
тест provider/runtime пройде успішно:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це охоплює розбір аргументів CLI, визначення config/default-agent, активацію вбудованого
plugin, repair залежностей середовища виконання вбудованого runtime на вимогу, спільне
середовище виконання генерації зображень і live-запит до провайдера.

## Жива генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях вбудованих провайдерів генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує змінні env провайдерів із вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує ключі live/env API раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва заявлені режими runtime, коли вони доступні:
    - `generate` з введенням лише prompt
    - `edit`, коли провайдер заявляє `capabilities.edit.enabled`
  - Поточне покриття спільної lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий живий файл Comfy, а не ця спільна перевірка
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Жива генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях вбудованих провайдерів генерації відео
  - За замовчуванням використовує безпечний для релізу smoke-шлях: провайдери без FAL, один запит text-to-video на провайдера, односекундний prompt з лобстером і ліміт операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (типово `180000`)
  - За замовчуванням пропускає FAL, оскільки затримка черги на стороні провайдера може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує змінні env провайдерів із вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує ключі live/env API раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати заявлені режими трансформації, коли вони доступні:
    - `imageToVideo`, коли провайдер заявляє `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальне введення зображення на основі буфера в межах спільної перевірки
    - `videoToVideo`, коли провайдер заявляє `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальне введення відео на основі буфера в межах спільної перевірки
  - Поточні заявлені, але пропущені провайдери `imageToVideo` у спільній перевірці:
    - `vydra`, оскільки вбудований `veo3` підтримує лише текст, а вбудований `kling` вимагає віддалений URL зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс lane `kling`, яка за замовчуванням використовує fixture з віддаленим URL зображення
  - Поточне живе покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні заявлені, але пропущені провайдери `videoToVideo` у спільній перевірці:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі вимагають віддалені URL-посилання `http(s)` / MP4
    - `google`, оскільки поточна спільна lane Gemini/Veo використовує локальне введення на основі буфера, а цей шлях не приймається у спільній перевірці
    - `openai`, оскільки поточна спільна lane не гарантує доступ до inpaint/remix відео, специфічний для організації
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до типової перевірки, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт операції для кожного провайдера під час агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Harness для живих медіатестів

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні живі набори для зображень, музики та відео через один вбудований у репозиторій entrypoint
  - Автоматично завантажує відсутні змінні env провайдерів із `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Testing](/uk/help/testing) — набори unit, integration, QA і Docker
