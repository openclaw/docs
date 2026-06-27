---
read_when:
    - Запуск перевірок працездатності матриці реальних моделей / бекенда CLI / ACP / медіапровайдера
    - Налагодження розв’язання облікових даних live-test
    - Додавання нового live-тесту для конкретного провайдера
sidebarTitle: Live tests
summary: 'Живі тести (що взаємодіють із мережею): матриця моделей, бекенди CLI, ACP, медіапровайдери, облікові дані'
title: 'Тестування: набори тестів у реальному середовищі'
x-i18n:
    generated_at: "2026-06-27T17:38:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

Для швидкого старту, QA-ранерів, unit/integration наборів і Docker-потоків див.
[Тестування](/uk/help/testing). Ця сторінка описує **live** (з мережевими зверненнями) тестові
набори: матрицю моделей, CLI-бекенди, ACP і live-тести медіапровайдерів, а також
обробку облікових даних.

## Live: локальні команди smoke-перевірки

Експортуйте потрібний ключ провайдера в середовище процесу перед ad hoc live
перевірками.

Безпечна media smoke-перевірка:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безпечна smoke-перевірка готовності voice-call:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` є dry run, якщо також не вказано `--yes`. Використовуйте `--yes` лише
тоді, коли ви навмисно хочете здійснити реальний сповіщувальний дзвінок. Для Twilio, Telnyx і
Plivo успішна перевірка готовності потребує публічної URL-адреси Webhook; локальні лише
loopback/private резервні варіанти відхиляються за задумом.

## Live: перевірка можливостей Android-вузла

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку наразі оголошує** підключений Android-вузол, і перевірити поведінку командного контракту.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює/запускає/сполучає застосунок).
  - Перевірка gateway `node.invoke` для вибраного Android-вузла команда за командою.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключено й сполучено з gateway.
  - Застосунок утримується на передньому плані.
  - Дозволи/згоду на захоплення надано для можливостей, які, як ви очікуєте, мають пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android-застосунок](/uk/platforms/android)

## Live: smoke-перевірка моделей (ключі профілів)

Live-тести розділено на два шари, щоб ми могли ізолювати збої:

- "Пряма модель" показує, чи провайдер/модель узагалі може відповідати з указаним ключем.
- "Smoke-перевірка Gateway" показує, чи повний конвеєр gateway+agent працює для цієї моделі (сесії, історія, інструменти, політика sandbox тощо).

### Шар 1: пряме завершення моделлю (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике completion для кожної моделі (і цільові регресії, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern`, `small` або `all` (alias для modern), щоб фактично запустити цей набір; інакше він пропускається, щоб `pnpm test:live` залишався зосередженим на smoke-перевірці gateway
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small`, щоб запустити обмежений allowlist малих моделей (Qwen 8B/9B local-compatible маршрути, Ollama Gemma, OpenRouter Qwen/GLM і Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` є alias для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Локальні запуски малих моделей Ollama за замовчуванням використовують `http://127.0.0.1:11434`; задавайте `OPENCLAW_LIVE_OLLAMA_BASE_URL` лише для LAN, власних або Ollama Cloud endpoint.
  - Modern/all і small перевірки за замовчуванням використовують свої curated caps; задайте `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної перевірки вибраних профілів або додатне число для меншого ліміту.
  - Вичерпні перевірки використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` для тайм-ауту всього direct-model тесту. Значення за замовчуванням: 60 хвилин.
  - Direct-model probes за замовчуванням запускаються з паралельністю 20; задайте `OPENCLAW_LIVE_MODEL_CONCURRENCY`, щоб перевизначити.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і env fallback
  - Задайте `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати лише **сховище профілів**
- Навіщо це існує:
  - Відокремлює "API провайдера зламано / ключ недійсний" від "конвеєр gateway agent зламано"
  - Містить малі ізольовані регресії (приклад: OpenAI Responses/Codex Responses reasoning replay + tool-call потоки)

### Шар 2: Gateway + smoke-перевірка dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process gateway
  - Створити/пропатчити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітеруватися моделями з ключами й перевірити:
    - "змістовну" відповідь (без інструментів)
    - реальний виклик інструмента працює (read probe)
    - необов’язкові додаткові tool probes (exec+read probe)
    - регресійні шляхи OpenAI (tool-call-only → follow-up) продовжують працювати
- Деталі probe (щоб можна було швидко пояснити збої):
  - `read` probe: тест записує nonce-файл у workspace і просить агента `read` його та повернути nonce.
  - `exec+read` probe: тест просить агента через `exec` записати nonce у тимчасовий файл, а потім через `read` прочитати його назад.
  - image probe: тест додає згенерований PNG (CAT + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `test/helpers/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small`, щоб запустити той самий обмежений allowlist малих моделей через повний конвеєр gateway+agent
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` є alias для modern allowlist
  - Або задайте `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити
  - Modern/all і small gateway перевірки за замовчуванням використовують свої curated caps; задайте `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної вибраної перевірки або додатне число для меншого ліміту.
- Як вибрати провайдерів (уникайте "усе через OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Tool + image probes завжди ввімкнені в цьому live-тесті:
  - `read` probe + `exec+read` probe (навантаження на інструменти)
  - image probe запускається, коли модель оголошує підтримку введення зображень
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG із "CAT" + випадковим кодом (`test/helpers/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований agent пересилає мультимодальне повідомлення користувача до моделі
    - Твердження: відповідь містить `cat` + код (толерантність OCR: незначні помилки дозволено)

<Tip>
Щоб побачити, що можна тестувати на вашій машині (і точні `provider/model` ids), запустіть:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke-перевірка CLI-бекенда (Claude, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent з використанням локального CLI-бекенда, не торкаючись вашої конфігурації за замовчуванням.
- Специфічні для бекенда smoke-значення за замовчуванням живуть у визначенні `cli-backend.ts` extension-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значення за замовчуванням:
  - Провайдер/модель за замовчуванням: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image походить із метаданих CLI backend plugin-власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення із зображенням (шляхи інжектяться в prompt). Docker recipes за замовчуванням вимикають це, якщо явно не запитано.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як CLI args замість prompt injection.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються image args, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий turn і перевірити resume flow.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути same-session continuity probe Claude Sonnet -> Opus, коли вибрана модель підтримує switch target. Docker recipes за замовчуванням вимикають це для aggregate reliability.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути MCP/tool loopback probe. Docker recipes за замовчуванням вимикають це, якщо явно не запитано.

Приклад:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Дешева smoke-перевірка конфігурації Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Це не просить Gemini згенерувати відповідь. Воно записує ті самі системні
налаштування, які OpenClaw передає Gemini, а потім запускає `gemini --debug mcp list`, щоб довести, що
збережений сервер `transport: "streamable-http"` нормалізується до HTTP MCP
форми Gemini і може підключитися до локального streamable-HTTP MCP сервера.

Docker recipe:

```bash
pnpm test:docker:live-cli-backend
```

Docker recipes для одного провайдера:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker runner розміщено в `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke-перевірку CLI-backend всередині Docker image репозиторію як non-root користувач `node`.
- Він визначає метадані CLI smoke з extension-власника, а потім встановлює відповідний Linux CLI package (`@anthropic-ai/claude-code` або `@google/gemini-cli`) у кешований записуваний prefix за `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує portable Claude Code subscription OAuth через `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спершу він доводить прямий `claude -p` у Docker, а потім запускає два Gateway CLI-backend turns без збереження env vars ключа Anthropic API. Ця subscription lane за замовчуванням вимикає Claude MCP/tool і image probes, оскільки Claude наразі маршрутизує використання third-party app через extra-usage billing замість звичайних лімітів subscription plan.
- Live smoke-перевірка CLI-backend тепер виконує той самий end-to-end потік для Claude і Gemini: text turn, image classification turn, а потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Smoke-перевірка Claude за замовчуванням також патчить сесію з Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: досяжність APNs HTTP/2 proxy

- Тест: `src/infra/push-apns-http2.live.test.ts`
- Мета: тунелюватися через локальний HTTP CONNECT proxy до sandbox APNs endpoint Apple, надіслати APNs HTTP/2 validation request і перевірити, що реальна відповідь Apple `403 InvalidProviderToken` повертається через proxy path.
- Увімкнення:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Необов’язковий тайм-аут:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язування розмови ACP із живим агентом ACP:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє до транскрипту прив’язаної сесії ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - агенти ACP у Docker: `claude,codex,gemini`
  - агент ACP для прямого `pnpm test:live ...`: `claude`
  - синтетичний канал: контекст розмови в стилі Slack DM
  - бекенд ACP: `acpx`
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
  - Ця гілка використовує поверхню `chat.send` у Gateway із синтетичними полями вихідного маршруту лише для адміністраторів, щоб тести могли приєднувати контекст каналу повідомлень без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів вбудованого плагіна `acpx` для вибраного агента ACP harness.
  - Створення MCP bound-session cron за замовчуванням виконується в режимі best-effort, оскільки зовнішні ACP harness-и можуть скасувати виклики MCP після успішного підтвердження прив’язування/зображення; задайте `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, щоб зробити цей post-bind cron-зонд строгим.

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

- Docker-runner розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він послідовно запускає smoke-перевірку прив’язування ACP для агрегованих live CLI-агентів: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він розміщує відповідні матеріали автентифікації CLI в контейнері, потім встановлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` або `opencode-ai`), якщо його немає. Сам бекенд ACP є вбудованим пакетом `acpx/runtime` з офіційного плагіна `acpx`.
- Варіант Docker для Droid розміщує `~/.factory` для налаштувань, передає `FACTORY_API_KEY` і вимагає цей API-ключ, оскільки локальну автентифікацію Factory через OAuth/keyring неможливо портативно перенести в контейнер. Він використовує вбудований запис реєстру ACPX `droid exec --output-format acp`.
- Варіант Docker для OpenCode є строгою регресійною гілкою для одного агента. Він записує тимчасову модель за замовчуванням `OPENCODE_CONFIG_CONTENT` з `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (типово `opencode/kimi-k2.6`), а `pnpm test:docker:live-acp-bind:opencode` вимагає транскрипт прив’язаного асистента замість прийняття загального post-bind пропуску.
- Прямі виклики CLI `acpx` є лише ручним/обхідним шляхом для порівняння поведінки поза Gateway. Docker smoke-перевірка прив’язування ACP перевіряє вбудований бекенд runtime `acpx` OpenClaw.

## Live: smoke-перевірка Codex app-server harness

- Мета: перевірити належний плагіну Codex harness через звичайний метод Gateway
  `agent`:
  - завантажити bundled-плагін `codex`
  - вибрати `openai/gpt-5.5`, що за замовчуванням маршрутизує agent turns OpenAI через Codex
  - надіслати перший agent turn Gateway до `openai/gpt-5.5` з вибраним Codex harness
  - надіслати другий turn до тієї самої сесії OpenClaw і перевірити, що потік app-server
    може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях команд Gateway
  - за бажанням виконати два Guardian-перевірені підвищені shell-зонди: одну безпечну
    команду, яку має бути схвалено, і одне завантаження фальшивого секрету, яке має бути
    відхилено, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.5`
- Необов’язковий зонд зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язковий зонд MCP/інструмента: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язковий зонд Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke-перевірка примусово задає provider/model `agentRuntime.id: "codex"`, щоб зламаний Codex
  harness не міг пройти через тихий fallback до OpenClaw.
- Автентифікація: автентифікація Codex app-server з локального входу в підписку Codex. Docker
  smoke-перевірки також можуть надавати `OPENAI_API_KEY` для зондів не Codex, коли застосовно,
  плюс необов’язково скопійовані `~/.codex/auth.json` і `~/.codex/config.toml`.

Локальний рецепт:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker-runner розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він передає `OPENAI_API_KEY`, копіює файли автентифікації Codex CLI, коли вони є, встановлює
  `@openai/codex` у доступний для запису змонтований префікс npm,
  розміщує дерево вихідного коду, а потім запускає лише live-тест Codex-harness.
- Docker за замовчуванням вмикає зонди зображення, MCP/інструмента та Guardian. Задайте
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий debug-запуск.
- Docker використовує ту саму явну конфігурацію runtime Codex, тому legacy-аліаси або fallback OpenClaw
  не можуть приховати регресію Codex harness.

### Рекомендовані live-рецепти

Вузькі, явні allowlist-и найшвидші й найменш нестабільні:

- Одна модель, напряму (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Прямий профіль малої моделі:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Профіль малої моделі через Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke-перевірка Ollama Cloud API:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Одна модель, smoke-перевірка Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів у кількох провайдерах:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Пряма smoke-перевірка Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Фокус Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke-перевірка адаптивного мислення Google:
  - Динамічне типове значення Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамічний бюджет Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує Antigravity OAuth bridge (agent endpoint у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (API-ключ / автентифікація профілю); саме це більшість користувачів має на увазі під "Gemini".
  - CLI: OpenClaw викликає локальний бінарний файл `gemini` через shell; він має власну автентифікацію і може поводитися інакше (streaming/підтримка інструментів/розбіжність версій).

## Live: матриця моделей (що ми покриваємо)

Фіксованого "списку моделей CI" немає (live є opt-in), але це **рекомендовані** моделі для регулярного покриття на dev-машині з ключами.

### Сучасний smoke-набір (виклик інструментів + зображення)

Це запуск "common models", який, як очікується, має стабільно працювати:

- OpenAI (не Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (загальний API) або `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Запустіть smoke-перевірку Gateway з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Виберіть принаймні одну модель на кожну сім’ю провайдерів:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (загальний API) або `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4.3` (або остання доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою "tools", яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо маєте доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Включіть принаймні одну модель із підтримкою зображень у `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI з підтримкою vision тощо), щоб перевірити зонд зображення.

### Агрегатори / альтернативні Gateway-и

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів+зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, яких можна включити до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні кінцеві точки): `minimax` (хмара/API), а також будь-який OpenAI/Anthropic-сумісний проксі (LM Studio, vLLM, LiteLLM тощо)

<Tip>
Не фіксуйте в документації "усі моделі" жорстко. Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині, плюс доступні ключі.
</Tip>

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як це робить CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знайти ті самі ключі.
- Якщо live-тест повідомляє "no creds", налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації на рівні агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це "profile keys" означає в live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється в підготовлений live-home, коли наявний, але не є основним сховищем profile-key)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` на рівні агента, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI у тимчасовий тестовий home; підготовлені live-home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб проби не торкалися справжнього workspace на вашому хості.

Якщо ви хочете покладатися на env-ключі, експортуйте їх перед локальними тестами або використовуйте
Docker-запускачі нижче з явним `OPENCLAW_PROFILE_FILE`.

## Deepgram live (аудіотранскрипція)

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
  - Перевіряє пакетні шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо `plugins.entries.comfy.config.<capability>` не налаштовано
  - Корисно після змін у надсиланні workflow comfy, опитуванні, завантаженнях або реєстрації Plugin

## Image generation live

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Тестовий стенд: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований Plugin провайдера генерації зображень
  - Використовує вже експортовані env-змінні провайдера перед пробами
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не приховували справжні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає кожного налаштованого провайдера через спільний runtime генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, коли провайдер оголошує підтримку редагування
- Поточні охоплені пакетні провайдери:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише через env

Для поставленого шляху CLI додайте smoke `infer` після успішного проходження live-тесту
провайдера/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це охоплює розбір аргументів CLI, розв’язання конфігурації/агента за замовчуванням, активацію пакетного
Plugin, спільний runtime генерації зображень і live-запит до провайдера.
Очікується, що залежності Plugin наявні до завантаження runtime.

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Тестовий стенд: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях пакетного провайдера генерації музики
  - Наразі охоплює Google і MiniMax
  - Використовує вже експортовані env-змінні провайдера перед пробами
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не приховували справжні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені режими runtime, коли вони доступні:
    - `generate` з вхідними даними лише у вигляді prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної лінії:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише через env

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Тестовий стенд: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях пакетного провайдера генерації відео
  - За замовчуванням використовує release-safe smoke-шлях: провайдери не FAL, один запит text-to-video на провайдера, односекундний prompt із лобстером і ліміт операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, бо затримка черги на боці провайдера може домінувати над часом релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Використовує вже експортовані env-змінні провайдера перед пробами
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не приховували справжні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими перетворення, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled`, а вибраний провайдер/модель приймає локальні вхідні зображення на основі buffer у спільному sweep
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled`, а вибраний провайдер/модель приймає локальні вхідні відео на основі buffer у спільному sweep
  - Поточні оголошені, але пропущені провайдери `imageToVideo` у спільному sweep:
    - `vydra`, бо пакетний `veo3` є text-only, а пакетний `kling` потребує віддаленого URL зображення
  - Покриття Vydra для конкретного провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс лінію `kling`, яка за замовчуванням використовує fixture з віддаленим URL зображення
  - Поточне live-покриття `videoToVideo`:
    - `runway` лише коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у спільному sweep:
    - `alibaba`, `qwen`, `xai`, бо ці шляхи наразі потребують віддалених `http(s)` / MP4 reference URL
    - `google`, бо поточна спільна лінія Gemini/Veo використовує локальні вхідні дані на основі buffer, і цей шлях не приймається у спільному sweep
    - `openai`, бо поточна спільна лінія не має гарантій доступу до редагування відео, специфічних для організації
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера в sweep за замовчуванням, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт кожної операції провайдера для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише через env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики та відео через одну repo-native точку входу
  - Використовує вже експортовані env-змінні провайдера
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка heartbeat і тихого режиму лишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) - модульні, інтеграційні, QA та Docker-набори
