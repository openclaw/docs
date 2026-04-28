---
read_when:
    - Запуск живої матриці моделей / бекенду CLI / ACP / базових перевірок медіапровайдера
    - Налагодження визначення облікових даних для тестів у реальному середовищі
    - Додавання нового live-тесту для конкретного провайдера
sidebarTitle: Live tests
summary: 'Живі тести (із мережевими зверненнями): матриця моделей, бекенди CLI, ACP, постачальники медіа, облікові дані'
title: 'Тестування: набори live-тестів'
x-i18n:
    generated_at: "2026-04-28T11:16:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

Для швидкого старту, QA-запускачів, unit-/інтеграційних наборів і Docker-процесів див.
[Тестування](/uk/help/testing). Ця сторінка охоплює **live** (із доступом до мережі) тестові
набори: матрицю моделей, CLI-бекенди, ACP і live-тести медіапровайдерів, а також
роботу з обліковими даними.

## Live: smoke-команди локального профілю

Виконайте `source ~/.profile` перед ad hoc live-перевірками, щоб ключі провайдерів і локальні
шляхи інструментів відповідали вашій оболонці:

```bash
source ~/.profile
```

Безпечний media smoke:

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

`voicecall smoke` є пробним запуском, якщо також не передано `--yes`. Використовуйте `--yes` лише
тоді, коли навмисно хочете здійснити справжній сповіщувальний виклик. Для Twilio, Telnyx і
Plivo успішна перевірка готовності потребує публічного Webhook URL; резервні варіанти
local loopback/private навмисно відхиляються.

## Live: повний прохід можливостей Android-вузла

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, що наразі рекламується** підключеним Android-вузлом, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює, не запускає й не сполучає застосунок).
  - Перевірка `node.invoke` у Gateway для кожної команди вибраного Android-вузла.
- Обов’язкова попередня підготовка:
  - Android-застосунок уже підключений і сполучений із gateway.
  - Застосунок утримується на передньому плані.
  - Дозволи/згода на захоплення надані для можливостей, які ви очікуєте успішно пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні подробиці налаштування Android: [Android-застосунок](/uk/platforms/android)

## Live: model smoke (ключі профілю)

Live-тести розділено на два шари, щоб можна було ізолювати збої:

- “Direct model” показує, чи провайдер/модель узагалі може відповісти з наданим ключем.
- “Gateway smoke” показує, чи працює повний pipeline gateway+agent для цієї моделі (сеанси, історія, інструменти, політика sandbox тощо).

### Шар 1: Direct model completion (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике завершення для кожної моделі (і цільові регресійні перевірки, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб фактично запустити цей набір; інакше він пропускається, щоб `pnpm test:live` був зосереджений на gateway smoke
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` є псевдонімом для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Modern/all-проходи за замовчуванням мають кураторський високосигнальний ліміт; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного сучасного проходу або додатне число для меншого ліміту.
  - Вичерпні проходи використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` для тайм-ауту всього direct-model тесту. Типово: 60 хвилин.
  - Direct-model probe за замовчуванням виконуються з паралелізмом 20; установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`, щоб перевизначити.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілю й fallback через env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб вимагати лише **сховище профілю**
- Навіщо це існує:
  - Відокремлює “API провайдера зламаний / ключ недійсний” від “pipeline gateway agent зламаний”
  - Містить невеликі ізольовані регресії (приклад: OpenAI Responses/Codex Responses reasoning replay + tool-call потоки)

### Шар 2: Gateway + dev agent smoke (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Запустити gateway всередині процесу
  - Створити/пропатчити сеанс `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Пройтися моделями з ключами й перевірити:
    - “змістовну” відповідь (без інструментів)
    - працює справжній виклик інструмента (read probe)
    - необов’язкові додаткові tool probe (exec+read probe)
    - регресійні шляхи OpenAI (tool-call-only → follow-up) продовжують працювати
- Подробиці probe (щоб можна було швидко пояснювати збої):
  - `read` probe: тест записує nonce-файл у workspace і просить agent виконати `read` та повернути nonce.
  - `exec+read` probe: тест просить agent через `exec` записати nonce у тимчасовий файл, а потім через `read` прочитати його назад.
  - image probe: тест додає згенерований PNG (cat + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
- Як вибрати моделі:
  - Типово: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` є псевдонімом для сучасного allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (чи список через кому), щоб звузити
  - Modern/all gateway-проходи за замовчуванням мають кураторський високосигнальний ліміт; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного сучасного проходу або додатне число для меншого ліміту.
- Як вибрати провайдерів (уникайте “усього OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Tool + image probe завжди ввімкнені в цьому live-тесті:
  - `read` probe + `exec+read` probe (навантаження інструментів)
  - image probe запускається, коли модель рекламує підтримку введення зображень
  - Потік (високорівнево):
    - Тест генерує маленький PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований agent пересилає мультимодальне повідомлення користувача до моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: дозволені незначні помилки)

<Tip>
Щоб побачити, що можна протестувати на вашій машині (і точні ідентифікатори `provider/model`), запустіть:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI backend smoke (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити pipeline Gateway + agent з використанням локального CLI-бекенда, не торкаючись вашої типової конфігурації.
- Специфічні для бекенда smoke-налаштування за замовчуванням зберігаються в `cli-backend.ts` визначенні відповідного Plugin.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з metadata відповідного CLI backend Plugin.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати справжнє вкладене зображення (шляхи інжектяться в prompt). Docker-рецепти за замовчуванням вимикають це, якщо не запитано явно.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як CLI args замість prompt injection.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати передаванням image args, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий turn і перевірити resume flow.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути probe безперервності Claude Sonnet -> Opus у тому самому сеансі, коли вибрана модель підтримує ціль перемикання. Docker-рецепти за замовчуванням вимикають це для сукупної надійності.
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

Це не просить Gemini генерувати відповідь. Воно записує ті самі системні
налаштування, які OpenClaw дає Gemini, а потім запускає `gemini --debug mcp list`, щоб довести, що
збережений сервер `transport: "streamable-http"` нормалізується до HTTP MCP-форми Gemini
і може підключитися до локального streamable-HTTP MCP-сервера.

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

Нотатки:

- Docker-запускач розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live CLI-backend smoke всередині Docker-образу репозиторію як non-root користувач `node`.
- Він визначає CLI smoke metadata з відповідного extension, а потім встановлює відповідний Linux CLI package (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний prefix за `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносного Claude Code subscription OAuth через `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` із `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім виконує два Gateway CLI-backend turns без збереження env vars Anthropic API-key. Ця subscription lane за замовчуванням вимикає Claude MCP/tool і image probe, бо Claude наразі маршрутизує використання стороннього застосунку через billing додаткового використання, а не через звичайні ліміти плану subscription.
- Live CLI-backend smoke тепер виконує той самий end-to-end flow для Claude, Codex і Gemini: текстовий turn, turn класифікації зображення, потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Типовий smoke Claude також патчить сеанс із Sonnet на Opus і перевіряє, що відновлений сеанс усе ще пам’ятає попередню нотатку.

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язування розмови ACP із live ACP агентом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє в transcript прив’язаної ACP сесії
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP агенти в Docker: `claude,codex,gemini`
  - ACP агент для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - ACP backend: `acpx`
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
  - Ця lane використовує Gateway поверхню `chat.send` із синтетичними полями originating-route лише для адміністраторів, щоб тести могли додавати контекст каналу повідомлень, не імітуючи зовнішню доставку.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів embedded `acpx` plugin для вибраного ACP harness agent.
  - Створення bound-session cron MCP за замовчуванням виконується за best-effort, бо зовнішні ACP harnesses можуть скасувати MCP виклики після проходження bind/image proof; задайте `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, щоб зробити цей post-bind cron probe суворим.

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

- Docker runner розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає ACP bind smoke послідовно проти aggregate live CLI agents: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він завантажує `~/.profile`, розміщує відповідні CLI auth material у контейнері, а потім установлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` або `opencode-ai`), якщо його немає. Сам ACP backend — це bundled embedded пакет `acpx/runtime` з Plugin `acpx`.
- Варіант Droid Docker розміщує `~/.factory` для налаштувань, передає `FACTORY_API_KEY` і вимагає цей API key, бо локальна Factory OAuth/keyring автентифікація не переноситься в контейнер. Він використовує вбудований ACPX запис реєстру `droid exec --output-format acp`.
- Варіант OpenCode Docker — це сувора regression lane для одного агента. Він записує тимчасову default model `OPENCODE_CONFIG_CONTENT` з `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (типово `opencode/kimi-k2.6`) після завантаження `~/.profile`, а `pnpm test:docker:live-acp-bind:opencode` вимагає bound assistant transcript замість прийняття generic post-bind skip.
- Прямі виклики `acpx` CLI — лише ручний/workaround шлях для порівняння поведінки поза Gateway. Docker ACP bind smoke перевіряє embedded `acpx` runtime backend OpenClaw.

## Live: smoke app-server harness Codex

- Мета: перевірити plugin-owned Codex harness через звичайний gateway
  метод `agent`:
  - завантажити bundled Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший gateway agent turn до `openai/gpt-5.5` із примусово ввімкненим Codex harness
  - надіслати другий turn до тієї самої OpenClaw сесії й перевірити, що app-server
    thread може відновитися
  - запустити `/codex status` і `/codex models` через той самий gateway command
    path
  - опційно запустити два Guardian-reviewed escalated shell probes: одну нешкідливу
    команду, яку має бути схвалено, і одне fake-secret upload, яке має бути
    відхилено, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.5`
- Опційний image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Опційний MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Опційний Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke задає `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний Codex
  harness не міг пройти, тихо повернувшись до PI.
- Автентифікація: Codex app-server auth із локального входу Codex subscription. Docker
  smokes також можуть надавати `OPENAI_API_KEY` для non-Codex probes, коли застосовно,
  плюс опційно скопійовані `~/.codex/auth.json` і `~/.codex/config.toml`.

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

- Docker runner розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він завантажує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює Codex CLI
  auth files, якщо вони присутні, установлює `@openai/codex` у writable mounted npm
  prefix, розміщує source tree, а потім запускає лише live test Codex-harness.
- Docker за замовчуванням вмикає image, MCP/tool і Guardian probes. Задайте
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий debug
  run.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, що відповідає live
  test config, щоб legacy aliases або PI fallback не могли приховати регресію Codex harness.

### Рекомендовані live рецепти

Вузькі, явні allowlists найшвидші й найменш flaky:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling для кількох providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - Якщо локальні keys зберігаються в shell profile: `source ~/.profile`
  - Gemini 3 dynamic default: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує Gemini API (API key).
- `google-antigravity/...` використовує Antigravity OAuth bridge (Cloud Code Assist-style agent endpoint).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає hosted Gemini API Google через HTTP (API key / profile auth); саме це більшість користувачів мають на увазі під “Gemini”.
  - CLI: OpenClaw запускає локальний бінарний файл `gemini`; він має власну автентифікацію й може поводитися інакше (streaming/tool support/version skew).

## Live: model matrix (що ми покриваємо)

Немає фіксованого “CI model list” (live є opt-in), але це **рекомендовані** моделі для регулярного покриття на dev machine з ключами.

### Modern smoke set (tool calling + image)

Це прогін “common models”, який ми очікуємо підтримувати робочим:

- OpenAI (non-Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Запустіть gateway smoke з tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: tool calling (Read + опційний Exec)

Виберіть принаймні одну модель на provider family:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Опційне додаткове покриття (бажано мати):

- xAI: `xai/grok-4` (або остання доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку ви маєте enabled)
- Cerebras: `cerebras/`… (якщо маєте доступ)
- LM Studio: `lmstudio/`… (локально; tool calling залежить від API mode)

### Vision: image send (attachment → multimodal message)

Додайте принаймні одну image-capable модель у `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI vision-capable variants тощо), щоб перевірити image probe.

### Aggregators / alternate gateways

Якщо у вас увімкнені keys, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tool+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше providers, які можна додати до live matrix (якщо маєте creds/config):

- Built-in: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (custom endpoints): `minimax` (cloud/API), плюс будь-який OpenAI/Anthropic-compatible proxy (LM Studio, vLLM, LiteLLM тощо)

<Tip>
Не hardcode "all models" у документації. Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині, плюс доступні keys.
</Tip>

## Credentials (ніколи не commit)

Live tests знаходять credentials так само, як це робить CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знайти ті самі ключі.
- Якщо live-тест повідомляє «немає облікових даних», налагоджуйте так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «ключі профілю» у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється до підготовленого live home, коли наявний, але не є основним сховищем ключів профілю)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного агента, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI у тимчасовий тестовий home; підготовлені live homes пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` вилучаються, щоб перевірки не торкалися вашого справжнього робочого простору хоста.

Якщо ви хочете покладатися на ключі середовища (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` у контейнер).

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
  - Перевіряє вбудовані comfy-шляхи для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо `plugins.entries.comfy.config.<capability>` не налаштовано
  - Корисно після змін надсилання comfy workflow, опитування, завантажень або реєстрації Plugin

## Image generation live

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Обв’язка: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований Plugin постачальника генерації зображень
  - Завантажує відсутні змінні середовища постачальника з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, тому застарілі тестові ключі в `auth-profiles.json` не маскують справжні облікові дані shell
  - Пропускає постачальників без придатної автентифікації/профілю/моделі
  - Запускає кожного налаштованого постачальника через спільний runtime генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, коли постачальник оголошує підтримку редагування
- Поточні охоплені вбудовані постачальники:
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

Для поставленого шляху CLI додайте smoke `infer` після того, як live-тест постачальника/runtime пройде:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це охоплює розбір аргументів CLI, визначення конфігурації/агента за замовчуванням, активацію вбудованого Plugin, відновлення вбудованих runtime-залежностей на вимогу, спільний runtime генерації зображень і live-запит до постачальника.

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Обв’язка: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний вбудований шлях постачальника генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує змінні середовища постачальника з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, тому застарілі тестові ключі в `auth-profiles.json` не маскують справжні облікові дані shell
  - Пропускає постачальників без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені режими runtime, коли вони доступні:
    - `generate` з введенням лише prompt
    - `edit`, коли постачальник оголошує `capabilities.edit.enabled`
  - Поточне охоплення спільної lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий Comfy live-файл, не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Обв’язка: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний вбудований шлях постачальника генерації відео
  - За замовчуванням використовує release-safe smoke-шлях: постачальники не FAL, один запит text-to-video на постачальника, односекундний prompt з лобстером і ліміт операції для кожного постачальника з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці постачальника може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує змінні середовища постачальника з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, тому застарілі тестові ключі в `auth-profiles.json` не маскують справжні облікові дані shell
  - Пропускає постачальників без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Встановіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими трансформації, коли вони доступні:
    - `imageToVideo`, коли постачальник оголошує `capabilities.imageToVideo.enabled`, а вибраний постачальник/модель приймає локальне зображення на основі буфера у спільному sweep
    - `videoToVideo`, коли постачальник оголошує `capabilities.videoToVideo.enabled`, а вибраний постачальник/модель приймає локальне відео на основі буфера у спільному sweep
  - Поточні оголошені, але пропущені постачальники `imageToVideo` у спільному sweep:
    - `vydra`, оскільки вбудований `veo3` є лише текстовим, а вбудований `kling` потребує віддаленої URL-адреси зображення
  - Специфічне для постачальника охоплення Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає text-to-video `veo3` плюс lane `kling`, яка за замовчуванням використовує fixture віддаленої URL-адреси зображення
  - Поточне live-охоплення `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені постачальники `videoToVideo` у спільному sweep:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі потребують віддалених `http(s)` / MP4 reference URLs
    - `google`, оскільки поточна спільна lane Gemini/Veo використовує локальне введення на основі буфера, і цей шлях не приймається у спільному sweep
    - `openai`, оскільки поточна спільна lane не має гарантій доступу до відео inpaint/remix, специфічних для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного постачальника в типовий sweep, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт кожної операції постачальника для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики та відео через одну нативну для repo точку входу
  - Автоматично завантажує відсутні змінні середовища постачальника з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до постачальників, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і quiet-mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — модульні, інтеграційні, QA та Docker-набори
