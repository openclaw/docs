---
read_when:
    - Запуск живих smoke-тестів для матриці моделей / бекенду CLI / ACP / медіапровайдера
    - Налагодження визначення облікових даних для живих тестів
    - Додавання нового живого тесту, специфічного для провайдера
sidebarTitle: Live tests
summary: 'Живі тести (що звертаються до мережі): матриця моделей, бекенди CLI, ACP, медіапровайдери, облікові дані'
title: 'Тестування: живі набори тестів'
x-i18n:
    generated_at: "2026-04-26T18:18:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a47decebb4e95db2c1635b2ac72e1284734bbd81330e9d517427eb710e93ead
    source_path: help/testing-live.md
    workflow: 15
---

Для швидкого старту, QA-ранерів, unit/integration-наборів тестів і Docker-потоків див.
[Тестування](/uk/help/testing). Ця сторінка охоплює **живі** (що звертаються до мережі) набори
тестів: матрицю моделей, бекенди CLI, ACP і живі тести медіапровайдерів, а також
обробку облікових даних.

## Живі тести: локальні команди smoke-тестів для профілю

Виконайте `source ~/.profile` перед довільними живими перевірками, щоб ключі
провайдерів і шляхи до локальних інструментів збігалися з вашим shell:

```bash
source ~/.profile
```

Безпечний медіа smoke-тест:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безпечний smoke-тест готовності до голосового виклику:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` — це dry run, якщо також не вказано `--yes`. Використовуйте `--yes`, лише
коли ви свідомо хочете здійснити справжній сповіщувальний дзвінок. Для Twilio, Telnyx і
Plivo успішна перевірка готовності вимагає публічної URL-адреси Webhook; суто локальні
loopback/private резервні варіанти навмисно відхиляються.

## Живі тести: повна перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, що наразі оголошена** підключеним Android Node, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір тестів не встановлює/не запускає/не виконує pairing для застосунку).
  - Покомандна валідація gateway `node.invoke` для вибраного Android Node.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключено й спарено з Gateway.
  - Застосунок утримується на передньому плані.
  - Для можливостей, які ви очікуєте успішно пройти, надано дозволи/згоду на захоплення.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні подробиці налаштування Android: [Android App](/uk/platforms/android)

## Живі тести: smoke-тест моделей (ключі профілю)

Живі тести поділено на два рівні, щоб можна було ізолювати збої:

- “Direct model” показує, чи може провайдер/модель взагалі відповісти з наданим ключем.
- “Gateway smoke” показує, чи працює для цієї моделі повний конвеєр gateway+agent (сесії, історія, інструменти, політика sandbox тощо).

### Рівень 1: Пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перерахувати виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике completion для кожної моделі (і цільові регресійні перевірки за потреби)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо ви викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб справді запустити цей набір тестів; інакше його буде пропущено, щоб `pnpm test:live` залишався зосередженим на smoke-тестах gateway
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern-allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для modern-allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - За замовчуванням повні modern/all-перевірки мають підібране обмеження з високим сигналом; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого обмеження.
  - Вичерпні перевірки використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як тайм-аут для всього прямого тесту моделі. Типове значення: 60 хвилин.
  - За замовчуванням прямі перевірки моделей виконуються з паралелізмом 20; щоб перевизначити, установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні варіанти з env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює “API провайдера зламаний / ключ недійсний” від “конвеєр gateway agent зламаний”
  - Містить невеликі, ізольовані регресії (приклад: повторення міркувань і потоки виклику інструментів для OpenAI Responses/Codex Responses)

### Рівень 2: Gateway + smoke-тест dev agent (те, що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Запустити in-process Gateway
  - Створити/оновити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітерувати моделі з ключами й перевіряти:
    - “осмислену” відповідь (без інструментів)
    - що працює справжній виклик інструмента (перевірка read)
    - необов’язкові додаткові перевірки інструментів (перевірка exec+read)
    - що шляхи регресії OpenAI (лише виклик інструмента → подальший крок) і далі працюють
- Подробиці перевірок (щоб ви могли швидко пояснювати збої):
  - перевірка `read`: тест записує файл із nonce у робочому просторі та просить agent виконати `read` цього файла й повернути nonce.
  - перевірка `exec+read`: тест просить agent записати nonce у тимчасовий файл через `exec`, а потім прочитати його назад через `read`.
  - перевірка зображення: тест додає згенерований PNG (cat + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо ви викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: modern-allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для modern-allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - За замовчуванням повні modern/all gateway-перевірки мають підібране обмеження з високим сигналом; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого обмеження.
- Як вибрати провайдерів (уникнути “OpenRouter everything”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Перевірки інструментів і зображень у цьому живому тесті завжди ввімкнені:
  - перевірка `read` + перевірка `exec+read` (навантаження на інструменти)
  - перевірка зображення виконується, коли модель оголошує підтримку вхідних зображень
  - Потік (високорівнево):
    - Тест генерує маленький PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent пересилає мультимодальне повідомлення користувача до моделі
    - Перевірка: відповідь містить `cat` + код (допускається OCR-tolerance: незначні помилки дозволені)

Порада: щоб побачити, що саме ви можете тестувати на своїй машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Живі тести: smoke-тест бекенду CLI (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent з використанням локального бекенду CLI, не торкаючись вашої типової конфігурації.
- Типові параметри smoke-тесту для конкретного бекенду зберігаються у визначенні `cli-backend.ts` відповідного extension.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо ви викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image походить із метаданих Plugin бекенду CLI, якому він належить.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати справжнє вкладення-зображення (шляхи впроваджуються в prompt). У рецептах Docker це типово вимкнено, якщо явно не запитано.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість упровадження в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати способом передавання аргументів зображення, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути перевірку безперервності тієї самої сесії Claude Sonnet -> Opus, коли вибрана модель підтримує ціль перемикання. У рецептах Docker це типово вимкнено для загальної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути loopback-перевірку MCP/інструментів. У рецептах Docker це типово вимкнено, якщо явно не запитано.

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Дешева smoke-перевірка конфігурації Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Це не просить Gemini згенерувати відповідь. Воно записує ті самі системні
налаштування, які OpenClaw передає Gemini, а потім виконує `gemini --debug mcp list`, щоб довести,
що збережений сервер `transport: "streamable-http"` нормалізується до HTTP MCP-форми Gemini
і може підключитися до локального streamable-HTTP MCP-сервера.

Рецепт Docker:

```bash
pnpm test:docker:live-cli-backend
```

Рецепти Docker для одного провайдера:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker-ранер розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає живий smoke-тест CLI-бекенду всередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані smoke-тесту CLI з extension, якому він належить, а потім установлює відповідний Linux-пакет CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований префікс із можливістю запису за адресою `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` вимагає portable Claude Code subscription OAuth через або `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить роботу прямого `claude -p` у Docker, а потім запускає два ходи Gateway CLI-бекенду без збереження змінних середовища API-ключа Anthropic. У цьому subscription-режимі за замовчуванням вимикаються перевірки Claude MCP/інструментів і зображень, оскільки Claude наразі маршрутизує використання сторонніх застосунків через оплату додаткового використання, а не через звичайні ліміти subscription-плану.
- Smoke-тест живого CLI-бекенду тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Типовий smoke-тест Claude також оновлює сесію з Sonnet до Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Живі тести: smoke-тест прив’язки ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити справжній потік conversation-bind ACP із живим ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє до транскрипту прив’язаної ACP-сесії
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP agents у Docker: `claude,codex,gemini`
  - ACP agent для прямого `pnpm test:live ...`: `claude`
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Примітки:
  - Цей режим використовує поверхню gateway `chat.send` з адміністративними синтетичними полями originating-route, щоб тести могли додавати контекст каналу повідомлень без удавання зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр agent для вибраного ACP harness agent із вбудованого Plugin `acpx`.
  - Створення cron MCP для прив’язаної сесії за замовчуванням виконується за принципом best-effort, оскільки зовнішні ACP harness можуть скасовувати виклики MCP після успішного проходження перевірки bind/image; установіть `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, щоб зробити цю post-bind перевірку cron суворою.

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
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Примітки щодо Docker:

- Docker-ранер розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає ACP bind smoke-тест послідовно для сукупних живих CLI agents: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він виконує `source ~/.profile`, передає до контейнера відповідні матеріали автентифікації CLI, а потім встановлює потрібний живий CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` або `opencode-ai`), якщо його немає. Сам ACP-бекенд — це вбудований пакет `acpx/runtime` із Plugin `acpx`.
- Варіант Droid для Docker передає `~/.factory` для налаштувань, прокидає `FACTORY_API_KEY` і вимагає цей API-ключ, оскільки локальна Factory OAuth/keyring-автентифікація не є переносною в контейнер. Він використовує вбудований запис реєстру ACPX `droid exec --output-format acp`.
- Варіант OpenCode для Docker — це суворий режим регресійної перевірки для одного agent. Він записує тимчасову типову модель `OPENCODE_CONFIG_CONTENT` із `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (типово `opencode/kimi-k2.6`) після виконання `source ~/.profile`, а `pnpm test:docker:live-acp-bind:opencode` вимагає транскрипт прив’язаного assistant замість прийняття загального post-bind skip.
- Прямі виклики CLI `acpx` — лише ручний/обхідний шлях для порівняння поведінки поза Gateway. Docker ACP bind smoke-тест перевіряє вбудований бекенд runtime `acpx` у OpenClaw.

## Живі тести: smoke-тест harness app-server Codex

- Мета: перевірити Plugin-власний harness Codex через звичайний метод gateway
  `agent`:
  - завантажити вбудований Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `openai/gpt-5.2` із примусовим Codex harness
  - надіслати другий хід до тієї самої сесії OpenClaw і перевірити, що потік
    app-server може відновитися
  - запустити `/codex status` і `/codex models` через той самий шлях
    команди gateway
  - за потреби запустити дві ескальовані shell-перевірки, переглянуті Guardian: одну нешкідливу
    команду, яку слід схвалити, і одне фальшиве завантаження секрету,
    яке слід відхилити, щоб agent перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.2`
- Необов’язкова перевірка зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова перевірка MCP/інструментів: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова перевірка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- У цьому smoke-тесті встановлюється `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний Codex
  harness не міг пройти тест тихим поверненням до PI.
- Автентифікація: автентифікація app-server Codex із локального входу до підписки Codex. Docker
  smoke-тести також можуть передавати `OPENAI_API_KEY` для не-Codex перевірок, де це застосовно,
  а також необов’язково скопійовані `~/.codex/auth.json` і `~/.codex/config.toml`.

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

- Docker-ранер розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він виконує `source` для змонтованого `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації CLI Codex, якщо вони є, встановлює `@openai/codex` у придатний до запису змонтований npm
  prefix, підготовлює дерево вихідного коду, а потім запускає лише живий тест Codex-harness.
- У Docker перевірки зображення, MCP/інструментів і Guardian увімкнені за замовчуванням. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли вам потрібен вужчий режим
  налагодження.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, відповідно до конфігурації живого
  тесту, щоб застарілі псевдоніми або повернення до PI не могли приховати регресію
  Codex harness.

### Рекомендовані живі рецепти

Вузькі, явні allowlist працюють найшвидше та найменш схильні до збоїв:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів для кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Живий smoke-тест adaptive thinking Google:
  - Якщо локальні ключі зберігаються в профілі shell: `source ~/.profile`
  - Динамічне типове значення Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамічний бюджет Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст Antigravity OAuth (кінцева точка agent у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (автентифікація через API-ключ / профіль); саме це більшість користувачів мають на увазі під “Gemini”.
  - CLI: OpenClaw викликає локальний двійковий файл `gemini`; він має власну автентифікацію й може поводитися інакше (streaming/підтримка інструментів/розбіжність версій).

## Живі тести: матриця моделей (що ми покриваємо)

Фіксованого “CI model list” не існує (живі тести вмикаються опційно), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний набір smoke-тестів (виклик інструментів + зображення)

Це запуск “поширених моделей”, який ми очікуємо підтримувати в робочому стані:

- OpenAI (не-Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск gateway smoke з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язково Exec)

Виберіть принаймні по одній моделі на сімейство провайдерів:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4` (або остання доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою інструментів, яку у вас ввімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнено ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів і зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до живої матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні endpoints): `minimax` (хмара/API), а також будь-який OpenAI/Anthropic-сумісний proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко прописати в документації “усі моделі”. Авторитетний список — це все, що повертає `discoverModels(...)` на вашій машині, плюс усі доступні ключі.

## Облікові дані (ніколи не комітьте)

Живі тести виявляють облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, живі тести мають знаходити ті самі ключі.
- Якщо живий тест повідомляє “no creds”, налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає “profile keys” у живих тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється до підготовленого live-home за наявності, але це не основне сховище profile keys)
- Локальні живі запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного agent, застарілий каталог `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового test-home; підготовлені live-home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` і `agentDir` видаляються, щоб probe не торкалися вашого реального робочого простору хоста.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте наведені нижче Docker-ранери (вони можуть монтувати `~/.profile` у контейнер).

## Живі тести Deepgram (транскрибування аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Живий тест BytePlus coding plan

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Живі тести медіа для workflow ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для зображень, відео і `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `plugins.entries.comfy.config.<capability>`
  - Корисно після змін у поданні workflow comfy, опитуванні, завантаженнях або реєстрації Plugin

## Живі тести генерації зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перераховує кожен зареєстрований Plugin провайдера генерації зображень
  - Перед перевіркою завантажує відсутні env-змінні провайдерів із вашого login shell (`~/.profile`)
  - За замовчуванням використовує живі/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає кожного налаштованого провайдера через спільний runtime генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, якщо провайдер оголошує підтримку редагування
- Поточні вбудовані провайдери, які покриваються:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

Для шляху shipped CLI додайте smoke-тест `infer` після успішного проходження
живого тесту провайдера/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це охоплює парсинг аргументів CLI, визначення config/default-agent, активацію
вбудованого Plugin, repair runtime-залежностей вбудованого середовища на вимогу, спільний
runtime генерації зображень і живий запит до провайдера.

## Живі тести генерації музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях вбудованих провайдерів генерації музики
  - Наразі охоплює Google і MiniMax
  - Перед перевіркою завантажує env-змінні провайдерів із вашого login shell (`~/.profile`)
  - За замовчуванням використовує живі/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені режими runtime, коли вони доступні:
    - `generate` з введенням лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття в спільному режимі:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий живий файл Comfy, а не ця спільна перевірка
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

## Живі тести генерації відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях вбудованих провайдерів генерації відео
  - За замовчуванням використовує безпечний для релізу шлях smoke-тесту: провайдери без FAL, один запит text-to-video на провайдера, односекундний prompt із лобстером і ліміт операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці провайдера може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Перед перевіркою завантажує env-змінні провайдерів із вашого login shell (`~/.profile`)
  - За замовчуванням використовує живі/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими трансформації, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальне введення зображень із буфера в спільній перевірці
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальне введення відео з буфера в спільній перевірці
  - Поточні провайдери `imageToVideo`, які оголошені, але пропускаються у спільній перевірці:
    - `vydra`, оскільки вбудований `veo3` підтримує лише текст, а вбудований `kling` вимагає віддалений URL-адрес зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video, а також режим `kling`, який за замовчуванням використовує фікстуру віддаленого URL-адреса зображення
  - Поточне живе покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні провайдери `videoToVideo`, які оголошені, але пропускаються у спільній перевірці:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі вимагають віддалених опорних URL `http(s)` / MP4
    - `google`, оскільки поточний спільний режим Gemini/Veo використовує локальне введення з буфера, а цей шлях не приймається у спільній перевірці
    - `openai`, оскільки в поточному спільному режимі немає гарантій доступу до org-specific функцій video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до типової перевірки, зокрема FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт операції кожного провайдера для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

## Медіа live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні живі набори тестів для зображень, музики й відео через єдину repo-native точку входу
  - Автоматично завантажує відсутні env-змінні провайдерів із `~/.profile`
  - За замовчуванням автоматично звужує кожен набір тестів до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і quiet-mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — unit, integration, QA і Docker-набори тестів
