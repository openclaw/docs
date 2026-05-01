---
read_when:
    - Запуск живих димових перевірок матриці моделей / бекенду CLI / ACP / медіапровайдера
    - Налагодження визначення облікових даних для тестів у реальному середовищі
    - Додавання нового тесту в реальному середовищі для конкретного провайдера
sidebarTitle: Live tests
summary: 'Тести в реальному середовищі (із мережевими зверненнями): матриця моделей, бекенди CLI, ACP, медіапровайдери, облікові дані'
title: 'Тестування: живі набори тестів'
x-i18n:
    generated_at: "2026-05-01T20:38:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 908ce317d5a8d45c8fa8dba4225dadf1bbbf530b5ff47272cd734739a57dbc6e
    source_path: help/testing-live.md
    workflow: 16
---

Для швидкого старту, QA-запускачів, unit/integration наборів і Docker-потоків див.
[Тестування](/uk/help/testing). Ця сторінка охоплює **живі** (що торкаються мережі) тестові
набори: матрицю моделей, CLI-бекенди, ACP і живі тести медіапровайдерів, а також
обробку облікових даних.

## Живі: локальні smoke-команди профілю

Підключіть `~/.profile` перед спеціальними живими перевірками, щоб ключі провайдера й локальні шляхи
інструментів збігалися з вашою shell-оболонкою:

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

`voicecall smoke` є сухим запуском, якщо також не вказано `--yes`. Використовуйте `--yes` лише
тоді, коли навмисно хочете здійснити реальний сповіщувальний дзвінок. Для Twilio, Telnyx і
Plivo успішна перевірка готовності потребує публічної URL-адреси Webhook; локальні-only
loopback/приватні резервні варіанти відхиляються за задумом.

## Живі: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку зараз оголошує** підключений Android Node, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює/запускає/сполучає застосунок).
  - Покомандна валідація Gateway `node.invoke` для вибраного Android Node.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключений і сполучений із Gateway.
  - Застосунок утримується на передньому плані.
  - Дозволи/згода на захоплення надані для можливостей, які ви очікуєте успішними.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android-застосунок](/uk/platforms/android)

## Живі: smoke моделей (ключі профілю)

Живі тести розділено на два шари, щоб можна було ізолювати збої:

- “Пряма модель” показує, чи провайдер/модель узагалі може відповісти з наданим ключем.
- “Gateway smoke” показує, чи повний конвеєр gateway+agent працює для цієї моделі (сесії, історія, інструменти, політика sandbox тощо).

### Шар 1: пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике завершення для кожної моделі (і цільові регресійні перевірки, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб фактично запустити цей набір; інакше він пропускається, щоб `pnpm test:live` був зосереджений на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` є псевдонімом для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Сучасні/all перевірки за замовчуванням мають кероване високосигнальне обмеження; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної сучасної перевірки або додатне число для меншого обмеження.
  - Вичерпні перевірки використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` для тайм-ауту всього тесту direct-model. Типово: 60 хвилин.
  - Проби direct-model за замовчуванням виконуються з паралельністю 20; установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`, щоб перевизначити.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілю та резервні env-значення
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати лише **сховище профілю**
- Навіщо це існує:
  - Відокремлює “API провайдера зламане / ключ недійсний” від “конвеєр агента gateway зламаний”
  - Містить невеликі ізольовані регресійні перевірки (приклад: OpenAI Responses/Codex Responses reasoning replay + потоки tool-call)

### Шар 2: Gateway + smoke dev-агента (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Запустити gateway в процесі
  - Створити/виправити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітерувати моделі з ключами й перевірити:
    - “змістовну” відповідь (без інструментів)
    - працює реальний виклик інструмента (проба читання)
    - необов’язкові додаткові проби інструментів (проба exec+read)
    - регресійні шляхи OpenAI (tool-call-only → follow-up) продовжують працювати
- Деталі проб (щоб можна було швидко пояснити збої):
  - проба `read`: тест записує nonce-файл у workspace і просить агента `read` його та повернути nonce.
  - проба `exec+read`: тест просить агента через `exec` записати nonce у тимчасовий файл, а потім `read` його назад.
  - проба зображення: тест додає згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - Типово: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` є псевдонімом для сучасного allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Сучасні/all gateway-перевірки за замовчуванням мають кероване високосигнальне обмеження; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної сучасної перевірки або додатне число для меншого обмеження.
- Як вибирати провайдерів (уникати “усе через OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Проби інструментів і зображень завжди ввімкнені в цьому живому тесті:
  - проба `read` + проба `exec+read` (навантаження інструментів)
  - проба зображення запускається, коли модель оголошує підтримку вводу зображень
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент пересилає мультимодальне повідомлення користувача до моделі
    - Перевірка: відповідь містить `cat` + код (толерантність OCR: допускаються незначні помилки)

<Tip>
Щоб побачити, що можна протестувати на вашій машині (і точні ids `provider/model`), запустіть:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Живі: smoke CLI-бекенда (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent за допомогою локального CLI-бекенда, не торкаючись вашої типової конфігурації.
- Специфічні для бекенда smoke-типові значення містяться у визначенні `cli-backend.ts` власницького plugin.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка команд/аргументів/зображень надходить із metadata власницького CLI backend plugin.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи ін’єктуються в prompt). Docker-рецепти за замовчуванням вимикають це, якщо явно не запитано.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як CLI-аргументи замість ін’єкції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються аргументи зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути пробу безперервності тієї самої сесії Claude Sonnet -> Opus, коли вибрана модель підтримує ціль перемикання. Docker-рецепти за замовчуванням вимикають це для сукупної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути MCP/tool loopback пробу. Docker-рецепти за замовчуванням вимикають це, якщо явно не запитано.

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
налаштування, які OpenClaw надає Gemini, а потім запускає `gemini --debug mcp list`, щоб довести, що
збережений сервер `transport: "streamable-http"` нормалізується до HTTP MCP
форми Gemini й може підключитися до локального streamable-HTTP MCP сервера.

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

- Docker runner розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live CLI-backend smoke всередині Docker-образу репозиторію як non-root користувач `node`.
- Він визначає CLI smoke metadata з власницького plugin, потім встановлює відповідний Linux CLI пакет (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс за `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносного Claude Code subscription OAuth через `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спершу він доводить прямий `claude -p` у Docker, потім запускає два Gateway CLI-backend ходи без збереження env vars ключів Anthropic API. Ця subscription lane вимикає Claude MCP/tool і проби зображень за замовчуванням, бо Claude наразі маршрутизує використання сторонніх застосунків через billing додаткового використання замість звичайних лімітів subscription plan.
- Живий CLI-backend smoke тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Типовий smoke Claude також виправляє сесію із Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Живі: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язування розмови ACP із live ACP-агентом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє в transcript прив’язаного сеансу ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Значення за замовчуванням:
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
  - Ця лінія використовує поверхню gateway `chat.send` з admin-only синтетичними полями originating-route, щоб тести могли приєднувати контекст message-channel без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів embedded `acpx` plugin для вибраного агента ACP harness.
  - Створення bound-session cron MCP за замовчуванням виконується best-effort, оскільки зовнішні ACP harnesses можуть скасувати MCP-виклики після того, як bind/image proof уже пройшов; задайте `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, щоб зробити цей post-bind cron probe суворим.

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
- За замовчуванням він послідовно запускає ACP bind smoke проти агрегованих live CLI-агентів: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він завантажує `~/.profile`, підготовлює відповідні матеріали CLI auth у контейнері, а потім встановлює запитаний live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` або `opencode-ai`), якщо його бракує. Сам ACP-бекенд — це bundled embedded пакет `acpx/runtime` з plugin `acpx`.
- Варіант Droid Docker підготовлює `~/.factory` для налаштувань, передає `FACTORY_API_KEY` і потребує цей API-ключ, оскільки локальна Factory OAuth/keyring auth не є переносимою в контейнер. Він використовує вбудований запис реєстру ACPX `droid exec --output-format acp`.
- Варіант OpenCode Docker — це сувора single-agent regression lane. Він записує тимчасову модель за замовчуванням `OPENCODE_CONFIG_CONTENT` з `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (за замовчуванням `opencode/kimi-k2.6`) після завантаження `~/.profile`, а `pnpm test:docker:live-acp-bind:opencode` вимагає transcript прив’язаного assistant замість прийняття загального post-bind skip.
- Прямі виклики `acpx` CLI — лише ручний/обхідний шлях для порівняння поведінки поза Gateway. Docker ACP bind smoke перевіряє embedded `acpx` runtime backend OpenClaw.

## Live: Codex app-server harness smoke

- Мета: перевірити Codex harness, що належить plugin, через звичайний gateway
  метод `agent`:
  - завантажити bundled plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший gateway agent turn до `openai/gpt-5.5` із примусово заданим Codex harness
  - надіслати другий turn до того самого сеансу OpenClaw і перевірити, що app-server
    thread може відновитися
  - виконати `/codex status` і `/codex models` через той самий gateway command
    path
  - опційно запустити два Guardian-reviewed escalated shell probes: одну нешкідливу
    команду, яку слід схвалити, і одне фейкове завантаження секрету, яке слід
    відхилити, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Модель за замовчуванням: `openai/gpt-5.5`
- Опційний image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Опційний MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Опційний Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke задає `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний Codex
  harness не міг пройти, тихо повернувшись до PI.
- Auth: Codex app-server auth з локального входу Codex subscription. Docker
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
- Він завантажує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли Codex CLI
  auth, якщо вони наявні, встановлює `@openai/codex` у доступний для запису змонтований npm
  prefix, підготовлює дерево вихідного коду, а потім запускає лише live-тест Codex-harness.
- Docker за замовчуванням вмикає image, MCP/tool і Guardian probes. Задайте
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий debug
  run.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, відповідно до live
  test config, щоб legacy aliases або PI fallback не могли приховати регресію
  Codex harness.

### Рекомендовані live recipes

Вузькі, явні allowlists — найшвидші й найменш flaky:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling у кількох providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - Якщо локальні ключі зберігаються в shell profile: `source ~/.profile`
  - Gemini 3 dynamic default: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує Gemini API (API key).
- `google-antigravity/...` використовує Antigravity OAuth bridge (endpoint агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема auth + особливості tooling).
- Gemini API vs Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (API key / profile auth); це те, що більшість користувачів мають на увазі під “Gemini”.
  - CLI: OpenClaw запускає локальний бінарник `gemini`; він має власну auth і може поводитися інакше (streaming/tool support/version skew).

## Live: model matrix (що ми покриваємо)

Немає фіксованого “CI model list” (live є opt-in), але це **рекомендовані** моделі для регулярного покриття на dev-машині з ключами.

### Сучасний smoke set (tool calling + image)

Це запуск “common models”, який ми очікуємо підтримувати робочим:

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

Виберіть щонайменше одну на provider family:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Опційне додаткове покриття (добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку ви маєте ввімкненою)
- Cerebras: `cerebras/`… (якщо маєте доступ)
- LM Studio: `lmstudio/`… (локально; tool calling залежить від API mode)

### Vision: image send (attachment → multimodal message)

Додайте щонайменше одну image-capable model до `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI vision-capable variants тощо), щоб перевірити image probe.

### Aggregators / alternate gateways

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tool+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (auth через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші providers, які можна включити до live matrix (якщо маєте creds/config):

- Built-in: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (custom endpoints): `minimax` (cloud/API), плюс будь-який OpenAI/Anthropic-compatible proxy (LM Studio, vLLM, LiteLLM тощо)

<Tip>
Не hardcode "all models" у docs. Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині, плюс доступні ключі.
</Tip>

## Облікові дані (ніколи не commit)

Live tests знаходять облікові дані так само, як це робить CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест повідомляє «no creds», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає “profile keys” у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється у підготовлений live-домашній каталог, коли наявний, але не є основним сховищем ключів профілів)
- Локальні live-запуски типово копіюють активну конфігурацію, файли `auth-profiles.json` для окремих агентів, застарілий каталог `credentials/` і підтримувані каталоги автентифікації зовнішніх CLI у тимчасовий тестовий домашній каталог; підготовлені live-домашні каталоги пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` вилучаються, щоб проби не зверталися до вашого реального робочого простору на хості.

Якщо ви хочете покладатися на ключі середовища (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте наведені нижче Docker-запускачі (вони можуть монтувати `~/.profile` у контейнер).

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
  - Корисно після змін у надсиланні workflow comfy, опитуванні, завантаженнях або реєстрації plugin

## Image generation live

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Обв’язка: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований provider plugin для генерації зображень
  - Завантажує відсутні змінні середовища провайдера з вашого login shell (`~/.profile`) перед пробою
  - Типово використовує live/API-ключі із середовища перед збереженими профілями автентифікації, тому застарілі тестові ключі в `auth-profiles.json` не маскують реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає кожного налаштованого провайдера через спільний runtime генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, коли провайдер заявляє підтримку редагування
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише із середовища

Для поставленого CLI-шляху додайте smoke `infer` після успішного проходження live-тесту провайдера/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це охоплює розбір аргументів CLI, визначення конфігурації/типового агента, активацію вбудованих plugin, спільний runtime генерації зображень і live-запит до провайдера. Очікується, що залежності plugin будуть наявні перед завантаженням runtime.

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Обв’язка: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує змінні середовища провайдера з вашого login shell (`~/.profile`) перед пробою
  - Типово використовує live/API-ключі із середовища перед збереженими профілями автентифікації, тому застарілі тестові ключі в `auth-profiles.json` не маскують реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва заявлені режими runtime, коли вони доступні:
    - `generate` із введенням лише prompt
    - `edit`, коли провайдер заявляє `capabilities.edit.enabled`
  - Поточне покриття спільної lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий Comfy live-файл, не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише із середовища

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Обв’язка: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації відео
  - Типово використовує release-safe smoke-шлях: не-FAL провайдери, один запит text-to-video на провайдера, односекундний prompt з омаром і обмеження операції для кожного провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` типово)
  - Типово пропускає FAL, бо затримка черги на боці провайдера може домінувати час релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує змінні середовища провайдера з вашого login shell (`~/.profile`) перед пробою
  - Типово використовує live/API-ключі із середовища перед збереженими профілями автентифікації, тому застарілі тестові ключі в `auth-profiles.json` не маскують реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Типово запускає лише `generate`
  - Встановіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати заявлені режими transform, коли вони доступні:
    - `imageToVideo`, коли провайдер заявляє `capabilities.imageToVideo.enabled`, а вибраний провайдер/модель приймає локальне зображення з buffer-backed input у спільному sweep
    - `videoToVideo`, коли провайдер заявляє `capabilities.videoToVideo.enabled`, а вибраний провайдер/модель приймає локальне відео з buffer-backed input у спільному sweep
  - Поточні заявлені, але пропущені провайдери `imageToVideo` у спільному sweep:
    - `vydra`, бо вбудований `veo3` є лише text-only, а вбудований `kling` потребує віддаленого URL зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс lane `kling`, яка типово використовує fixture із віддаленим URL зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні заявлені, але пропущені провайдери `videoToVideo` у спільному sweep:
    - `alibaba`, `qwen`, `xai`, бо ці шляхи наразі потребують віддалених `http(s)` / MP4 reference URL
    - `google`, бо поточна спільна lane Gemini/Veo використовує локальне buffer-backed input, і цей шлях не приймається у спільному sweep
    - `openai`, бо поточній спільній lane бракує гарантій доступу до video inpaint/remix, специфічних для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера в типовий sweep, зокрема FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження кожної операції провайдера для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише із середовища

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики та відео через одну repo-native entrypoint
  - Автоматично завантажує відсутні змінні середовища провайдера з `~/.profile`
  - Типово автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і quiet-mode лишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — unit-, інтеграційні, QA- та Docker-набори
