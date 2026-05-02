---
read_when:
    - Запуск базових перевірок живої матриці моделей / бекенду CLI / ACP / постачальника медіа
    - Налагодження визначення облікових даних для тестів у реальному середовищі
    - Додавання нового тесту в реальному середовищі для конкретного провайдера
sidebarTitle: Live tests
summary: 'Реальні (що взаємодіють із мережею) тести: матриця моделей, CLI-бекенди, ACP, медіапровайдери, облікові дані'
title: 'Тестування: набори живих тестів'
x-i18n:
    generated_at: "2026-05-02T07:52:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2268f20ce5c0bbee8bf610938851fe529f5e21fa31fe08a70400df94e9241cc3
    source_path: help/testing-live.md
    workflow: 16
---

Для швидкого старту, QA-ранерів, модульних/інтеграційних наборів і Docker-потоків див.
[Тестування](/uk/help/testing). Ця сторінка описує **живі** (з мережевими зверненнями) тестові
набори: матрицю моделей, бекенди CLI, ACP і живі тести медіапровайдерів, а також
обробку облікових даних.

## Живі тести: smoke-команди локального профілю

Перед разовими живими перевірками виконайте source для `~/.profile`, щоб ключі провайдерів і локальні шляхи інструментів
відповідали вашій оболонці:

```bash
source ~/.profile
```

Безпечний медіа smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безпечний smoke готовності голосового виклику:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` є пробним запуском, якщо також не вказано `--yes`. Використовуйте `--yes` лише
коли ви свідомо хочете здійснити реальний сповіщувальний дзвінок. Для Twilio, Telnyx і
Plivo успішна перевірка готовності потребує публічної URL-адреси webhook; локальні
loopback/private запасні варіанти відхиляються за задумом.

## Живі тести: перевірка можливостей Android-вузла

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку наразі оголошує** підключений Android-вузол, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює, не запускає і не спарює застосунок).
  - Перевірка `node.invoke` у gateway для кожної команди вибраного Android-вузла.
- Обов’язкова попередня підготовка:
  - Android-застосунок уже підключений і спарений із gateway.
  - Застосунок утримується на передньому плані.
  - Дозволи/згода на захоплення надані для можливостей, які мають пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android-застосунок](/uk/platforms/android)

## Живі тести: model smoke (ключі профілю)

Живі тести розділено на два рівні, щоб ми могли ізолювати збої:

- “Пряма модель” показує, чи провайдер/модель узагалі може відповісти з заданим ключем.
- “Gateway smoke” показує, чи працює повний конвеєр gateway+агент для цієї моделі (сеанси, історія, інструменти, sandbox-політика тощо).

### Рівень 1: пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике завершення для кожної моделі (і цільові регресії, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб фактично запустити цей набір; інакше він пропускається, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` є псевдонімом для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Modern/all sweep-и за замовчуванням мають підібране високосигнальне обмеження; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern sweep або додатне число для меншого обмеження.
  - Вичерпні sweep-и використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як таймаут усього direct-model тесту. За замовчуванням: 60 хвилин.
  - Direct-model probe-и за замовчуванням працюють із паралельністю 20; установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`, щоб перевизначити.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і env fallback-и
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати лише **сховище профілів**
- Навіщо це існує:
  - Відокремлює “API провайдера зламаний / ключ недійсний” від “конвеєр gateway-агента зламаний”
  - Містить малі ізольовані регресії (приклад: OpenAI Responses/Codex Responses reasoning replay + tool-call потоки)

### Рівень 2: Gateway + smoke dev-агента (що фактично робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process gateway
  - Створити/пропатчити сеанс `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітерувати моделі з ключами й перевірити:
    - “змістовну” відповідь (без інструментів)
    - працює реальний виклик інструмента (read probe)
    - необов’язкові додаткові probe-и інструментів (exec+read probe)
    - шляхи регресії OpenAI (tool-call-only → follow-up) продовжують працювати
- Деталі probe-ів (щоб швидко пояснювати збої):
  - `read` probe: тест записує nonce-файл у робочій області та просить агента виконати `read` для нього й повторити nonce у відповіді.
  - `exec+read` probe: тест просить агента через `exec` записати nonce у тимчасовий файл, а потім через `read` прочитати його назад.
  - image probe: тест прикріплює згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` є псевдонімом для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити
  - Modern/all gateway sweep-и за замовчуванням мають підібране високосигнальне обмеження; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern sweep або додатне число для меншого обмеження.
- Як вибрати провайдерів (уникнути “всього OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Probe-и інструментів + зображень завжди ввімкнені в цьому живому тесті:
  - `read` probe + `exec+read` probe (стрес інструментів)
  - image probe запускається, коли модель оголошує підтримку вхідних зображень
  - Потік (на високому рівні):
    - Тест генерує маленький PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded-агент пересилає мультимодальне повідомлення користувача до моделі
    - Перевірка: відповідь містить `cat` + код (OCR-допуск: незначні помилки дозволені)

<Tip>
Щоб побачити, що можна протестувати на вашій машині (і точні ідентифікатори `provider/model`), запустіть:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Живі тести: smoke бекенда CLI (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + агент за допомогою локального бекенда CLI, не торкаючись вашої конфігурації за замовчуванням.
- Специфічні для бекенда smoke-налаштування за замовчуванням живуть у визначенні `cli-backend.ts` належного plugin.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значення за замовчуванням:
  - Провайдер/модель за замовчуванням: `claude-cli/claude-sonnet-4-6`
  - Поведінка команди/аргументів/зображень береться з метаданих CLI backend plugin, якому це належить.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати справжнє вкладення-зображення (шляхи інжектяться в prompt). Docker-рецепти за замовчуванням вимикають це, якщо не запитано явно.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як CLI-аргументи замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати передаванням image-аргументів, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити resume-потік.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути probe безперервності того самого сеансу Claude Sonnet -> Opus, коли вибрана модель підтримує ціль перемикання. Docker-рецепти за замовчуванням вимикають це для агрегованої надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути MCP/tool loopback probe. Docker-рецепти за замовчуванням вимикають це, якщо не запитано явно.

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Дешевий smoke конфігурації Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Це не просить Gemini згенерувати відповідь. Воно записує ті самі системні
налаштування, які OpenClaw дає Gemini, а потім запускає `gemini --debug mcp list`, щоб довести, що
збережений сервер `transport: "streamable-http"` нормалізується до HTTP MCP
форми Gemini і може підключитися до локального streamable-HTTP MCP сервера.

Docker-рецепт:

```bash
pnpm test:docker:live-cli-backend
```

Docker-рецепти для окремих провайдерів:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker-ранер розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live CLI-backend smoke всередині Docker-образу репозиторію як non-root користувач `node`.
- Він визначає CLI smoke metadata з відповідного Plugin, а потім встановлює відповідний Linux CLI пакет (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс за `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносного Claude Code subscription OAuth через `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім запускає два ходи Gateway CLI-backend без збереження env vars API-ключа Anthropic. Ця subscription-лінія за замовчуванням вимикає Claude MCP/tool та image probe-и, бо Claude наразі маршрутизує використання сторонніх застосунків через billing за додаткове використання замість звичайних лімітів subscription-плану.
- Live CLI-backend smoke тепер відпрацьовує той самий end-to-end потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик MCP-інструмента `cron`, перевірений через gateway CLI.
- Smoke за замовчуванням для Claude також патчить сеанс із Sonnet на Opus і перевіряє, що відновлений сеанс досі пам’ятає попередню нотатку.

## Живі тести: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити справжній потік прив’язування розмови ACP із живим агентом ACP:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє в стенограму прив’язаного сеансу ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - агенти ACP у Docker: `claude,codex,gemini`
  - агент ACP для прямого `pnpm test:live ...`: `claude`
  - синтетичний канал: контекст розмови в стилі DM Slack
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
  - Ця доріжка використовує поверхню Gateway `chat.send` із синтетичними полями початкового маршруту лише для адміністраторів, щоб тести могли приєднати контекст каналу повідомлень, не вдаючи зовнішню доставку.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів вбудованого plugin `acpx` для вибраного агента обв’язки ACP.
  - Створення MCP bound-session cron за замовчуванням виконується за принципом найкращого зусилля, оскільки зовнішні обв’язки ACP можуть скасувати виклики MCP після успішного підтвердження прив’язування/зображення; задайте `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, щоб зробити цю post-bind cron-перевірку суворою.

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

- Запускач Docker розміщено в `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він послідовно запускає ACP bind smoke для сукупних живих агентів CLI: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він завантажує `~/.profile`, готує відповідні матеріали автентифікації CLI у контейнері, а потім встановлює запитаний живий CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` або `opencode-ai`), якщо його бракує. Сам бекенд ACP — це вбудований пакет `acpx/runtime` з офіційного plugin `acpx`.
- Варіант Droid для Docker готує `~/.factory` для налаштувань, передає `FACTORY_API_KEY` і потребує цього ключа API, оскільки локальна автентифікація Factory OAuth/keyring не переноситься в контейнер. Він використовує вбудований запис реєстру ACPX `droid exec --output-format acp`.
- Варіант OpenCode для Docker є суворою регресійною доріжкою з одним агентом. Він записує тимчасову типову модель `OPENCODE_CONFIG_CONTENT` з `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (типово `opencode/kimi-k2.6`) після завантаження `~/.profile`, а `pnpm test:docker:live-acp-bind:opencode` вимагає стенограму прив’язаного асистента замість прийняття загального пропуску після прив’язування.
- Прямі виклики CLI `acpx` є лише ручним/обхідним шляхом для порівняння поведінки поза Gateway. Docker ACP bind smoke перевіряє вбудований у OpenClaw runtime-бекенд `acpx`.

## Live: smoke для обв’язки Codex app-server

- Мета: перевірити обв’язку Codex, якою володіє plugin, через звичайний метод gateway
  `agent`:
  - завантажити вбудований plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід агента gateway до `openai/gpt-5.5` із примусово ввімкненою обв’язкою Codex
  - надіслати другий хід у той самий сеанс OpenClaw і перевірити, що потік app-server
    може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях команди gateway
  - за бажанням виконати дві переглянуті Guardian ескальовані shell-перевірки: одну безпечну
    команду, яку має бути схвалено, і одне фальшиве вивантаження секрету, яке має бути
    відхилено, щоб агент поставив зворотне запитання
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.5`
- Додаткова перевірка зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Додаткова перевірка MCP/інструмента: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Додаткова перевірка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke задає `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламана обв’язка Codex
  не могла пройти через тихий fallback до PI.
- Автентифікація: автентифікація Codex app-server з локального входу через підписку Codex. Docker
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

Примітки щодо Docker:

- Запускач Docker розміщено в `scripts/test-live-codex-harness-docker.sh`.
- Він завантажує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли автентифікації Codex CLI
  за наявності, встановлює `@openai/codex` у придатний для запису змонтований префікс npm,
  готує дерево джерел, а потім запускає лише live-тест обв’язки Codex.
- Docker за замовчуванням вмикає перевірки зображення, MCP/інструмента та Guardian. Задайте
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` чи
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий debug-запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, що відповідає конфігурації live-тесту,
  щоб застарілі псевдоніми або fallback PI не могли приховати регресію обв’язки Codex.

### Рекомендовані live-рецепти

Вузькі явні списки дозволеного найшвидші й найменш нестабільні:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів у кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (ключ Gemini API + Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - Якщо локальні ключі містяться в профілі shell: `source ~/.profile`
  - Динамічне типове значення Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамічний бюджет Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує Gemini API (ключ API).
- `google-antigravity/...` використовує міст Antigravity OAuth (ендпоїнт агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментарію).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений у Google Gemini API через HTTP (ключ API / автентифікація профілю); саме це більшість користувачів має на увазі під “Gemini”.
  - CLI: OpenClaw викликає локальний бінарний файл `gemini` через shell; він має власну автентифікацію і може поводитися інакше (підтримка streaming/інструментів/розбіжність версій).

## Live: матриця моделей (що ми покриваємо)

Фіксованого “списку моделей CI” немає (live є opt-in), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний smoke-набір (виклик інструментів + зображення)

Це запуск “поширених моделей”, який ми очікуємо підтримувати робочим:

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

Виберіть щонайменше одну модель для кожної родини провайдерів:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Додаткове необов’язкове покриття (бажано мати):

- xAI: `xai/grok-4.3` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо маєте доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (вкладення → multimodal-повідомлення)

Додайте щонайменше одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI із підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні шлюзи

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів+зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, яких можна включити в live-матрицю (якщо маєте облікові дані/конфігурацію):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (кастомні ендпоїнти): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний проксі (LM Studio, vLLM, LiteLLM тощо)

<Tip>
Не хардкодьте "all models" у документації. Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині, плюс доступні ключі.
</Tip>

## Облікові дані (ніколи не комітьте)

Live-тести виявляють облікові дані так само, як це робить CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест повідомляє “no creds”, налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає “profile keys” у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється до підготовленого live-домашнього каталогу, коли присутній, але не є основним сховищем profile-key)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для окремих агентів, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI у тимчасовий тестовий домашній каталог; підготовлені live-домашні каталоги пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` вилучаються, щоб перевірки не торкалися вашого справжнього робочого простору на хості.

Якщо ви хочете покладатися на ключі env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-запускачі нижче (вони можуть монтувати `~/.profile` у контейнер).

## Deepgram live (транскрипція аудіо)

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
  - Корисно після змін надсилання workflow comfy, опитування, завантажень або реєстрації плагіна

## Image generation live

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Оснастка: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований плагін провайдера генерації зображень
  - Завантажує відсутні env-змінні провайдера з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували справжні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає кожного налаштованого провайдера через спільне середовище виконання генерації зображень:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

Для доставленого шляху CLI додайте smoke `infer` після успішного проходження provider/runtime live-тесту:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це охоплює розбір аргументів CLI, розв’язання конфігурації/default-agent, активацію вбудованого плагіна, спільне середовище виконання генерації зображень і live-запит до провайдера. Очікується, що залежності плагіна наявні до завантаження середовища виконання.

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Оснастка: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env-змінні провайдера з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували справжні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені режими runtime, коли вони доступні:
    - `generate` з вхідними даними лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної лінії:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Оснастка: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації відео
  - За замовчуванням використовує release-safe smoke-шлях: провайдери не FAL, один запит text-to-video на провайдера, односекундний prompt із омаром і ліміт операції для кожного провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, бо затримка черги на стороні провайдера може переважати час релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env-змінні провайдера з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували справжні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими трансформації, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled`, а вибраний провайдер/модель приймає локальні вхідні зображення на основі буфера у спільному sweep
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled`, а вибраний провайдер/модель приймає локальні вхідні відео на основі буфера у спільному sweep
  - Поточні провайдери `imageToVideo`, оголошені, але пропущені у спільному sweep:
    - `vydra`, бо вбудований `veo3` підтримує лише text-only, а вбудований `kling` потребує віддаленої URL-адреси зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс лінію `kling`, яка за замовчуванням використовує fixture з віддаленою URL-адресою зображення
  - Поточне live-покриття `videoToVideo`:
    - `runway` лише коли вибрана модель — `runway/gen4_aleph`
  - Поточні провайдери `videoToVideo`, оголошені, але пропущені у спільному sweep:
    - `alibaba`, `qwen`, `xai`, бо ці шляхи наразі потребують віддалених `http(s)` / MP4 reference URL
    - `google`, бо поточна спільна лінія Gemini/Veo використовує локальні вхідні дані на основі буфера, і цей шлях не приймається у спільному sweep
    - `openai`, бо поточна спільна лінія не має гарантій доступу до org-specific video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера в типовий sweep, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт операції кожного провайдера для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики та відео через одну repo-native точку входу
  - Автоматично завантажує відсутні env-змінні провайдера з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тож поведінка Heartbeat і quiet-mode лишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — unit, integration, QA та Docker-набори
