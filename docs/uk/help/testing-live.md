---
read_when:
    - Запуск живих димових перевірок матриці моделей / бекенду CLI / ACP / медіапровайдера
    - Налагодження визначення облікових даних для тестів у реальному середовищі
    - Додавання нового тесту в реальному середовищі для конкретного провайдера
sidebarTitle: Live tests
summary: 'Живі тести (з мережевими зверненнями): матриця моделей, бекенди CLI, ACP, постачальники медіа, облікові дані'
title: 'Тестування: набори тестів у реальному середовищі'
x-i18n:
    generated_at: "2026-05-02T01:45:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce8bd75ee7837b48e6ba1d888d281ee053fc13bdcf0907baddeb78ebcbbef31c
    source_path: help/testing-live.md
    workflow: 16
---

Для швидкого старту, QA-запускачів, модульних/інтеграційних наборів і Docker-потоків див.
[Тестування](/uk/help/testing). Ця сторінка описує **live** (із взаємодією з мережею) тестові
набори: матрицю моделей, CLI-бекенди, ACP і live-тести медіапровайдерів, а також
обробку облікових даних.

## Live: локальні команди smoke для профілю

Перед ad hoc live-перевірками виконайте source для `~/.profile`, щоб ключі провайдерів і локальні шляхи
інструментів відповідали вашій оболонці:

```bash
source ~/.profile
```

Безпечний media smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безпечний smoke готовності голосових викликів:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` є пробним запуском, якщо також не вказано `--yes`. Використовуйте `--yes` лише
тоді, коли ви навмисно хочете здійснити справжній сповіщувальний дзвінок. Для Twilio, Telnyx і
Plivo успішна перевірка готовності потребує публічної URL-адреси Webhook; резервні варіанти лише для
local loopback/приватні резервні варіанти відхиляються за задумом.

## Live: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку зараз рекламує** підключений Android Node, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює/не запускає/не сполучає застосунок).
  - Валідація Gateway `node.invoke` для вибраного Android Node, команда за командою.
- Обов’язкова попередня підготовка:
  - Android-застосунок уже підключений і спарений із Gateway.
  - Застосунок залишається на передньому плані.
  - Дозволи/згода на захоплення надані для можливостей, які ви очікуєте успішно пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android-застосунок](/uk/platforms/android)

## Live: model smoke (ключі профілю)

Live-тести поділено на два шари, щоб ми могли ізолювати збої:

- «Пряма модель» показує, чи провайдер/модель узагалі може відповісти з наданим ключем.
- «Gateway smoke» показує, чи весь конвеєр gateway+agent працює для цієї моделі (сеанси, історія, інструменти, політика sandbox тощо).

### Шар 1: Пряме завершення моделі (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике завершення для кожної моделі (і цільові регресії за потреби)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб фактично запустити цей набір; інакше він пропускається, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` є псевдонімом для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Перевірки modern/all за замовчуванням використовують кураторський високосигнальний ліміт; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
  - Вичерпні перевірки використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як таймаут усього тесту прямої моделі. За замовчуванням: 60 хвилин.
  - Проби прямої моделі за замовчуванням виконуються з паралелізмом 20; установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`, щоб перевизначити.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні варіанти env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати лише **сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламано / ключ недійсний» від «конвеєр gateway agent зламано»
  - Містить невеликі, ізольовані регресії (приклад: reasoning replay OpenAI Responses/Codex Responses + потоки tool-call)

### Шар 2: Gateway + dev agent smoke (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Запустити внутрішньопроцесний Gateway
  - Створити/змінити сеанс `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Перебрати моделі з ключами й перевірити:
    - «змістовну» відповідь (без інструментів)
    - працює справжній виклик інструмента (read-проба)
    - необов’язкові додаткові проби інструментів (exec+read-проба)
    - регресійні шляхи OpenAI (лише tool-call → follow-up) продовжують працювати
- Деталі проб (щоб можна було швидко пояснити збої):
  - `read`-проба: тест записує nonce-файл у робочій області й просить агента `read` його та повернути nonce.
  - `exec+read`-проба: тест просить агента через `exec` записати nonce у тимчасовий файл, а потім через `read` прочитати його назад.
  - проба зображення: тест долучає згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` є псевдонімом для сучасного allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити
  - Gateway-перевірки modern/all за замовчуванням використовують кураторський високосигнальний ліміт; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
- Як вибрати провайдерів (уникайте «усе з OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Проби інструментів + зображень у цьому live-тесті завжди ввімкнені:
  - `read`-проба + `exec+read`-проба (навантаження інструментів)
  - проба зображення виконується, коли модель оголошує підтримку введення зображень
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент пересилає мультимодальне повідомлення користувача до моделі
    - Твердження: відповідь містить `cat` + код (толерантність OCR: незначні помилки дозволені)

<Tip>
Щоб побачити, що можна тестувати на вашій машині (і точні ідентифікатори `provider/model`), запустіть:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI backend smoke (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent за допомогою локального CLI-бекенда, не торкаючись вашої типової конфігурації.
- Специфічні для бекенда smoke-налаштування за замовчуванням живуть у визначенні `cli-backend.ts` відповідного Plugin.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка команди/аргументів/зображень береться з метаданих відповідного CLI backend plugin.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати справжнє зображення-вкладення (шляхи ін’єктуються в prompt). Docker-рецепти за замовчуванням вимикають це, якщо явно не запитано.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як CLI-аргументи замість ін’єкції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються аргументи зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути пробу безперервності Claude Sonnet -> Opus у тому самому сеансі, коли вибрана модель підтримує ціль перемикання. Docker-рецепти за замовчуванням вимикають це для сукупної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути пробу MCP/інструментального loopback. Docker-рецепти за замовчуванням вимикають це, якщо явно не запитано.

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

Це не просить Gemini згенерувати відповідь. Воно записує ті самі системні
налаштування, які OpenClaw надає Gemini, а потім запускає `gemini --debug mcp list`, щоб довести, що
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
- Він запускає live CLI-backend smoke всередині Docker-образу репозиторію як некореневий користувач `node`.
- Він визначає CLI smoke-метадані з відповідного Plugin, а потім встановлює відповідний Linux CLI-пакет (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс за `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносного OAuth для підписки Claude Code через `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім запускає два Gateway CLI-backend ходи без збереження env vars ключа Anthropic API. Ця subscription-смуга за замовчуванням вимикає Claude MCP/інструментальну пробу та пробу зображення, бо Claude зараз маршрутизує використання сторонніх застосунків через billing додаткового використання замість звичайних лімітів плану підписки.
- Live CLI-backend smoke тепер перевіряє той самий end-to-end потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Типовий smoke Claude також змінює сеанс із Sonnet на Opus і перевіряє, що відновлений сеанс усе ще пам’ятає попередню нотатку.

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити справжній потік прив’язування розмови ACP із живим агентом ACP:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє до транскрипта прив’язаної сесії ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - агенти ACP у Docker: `claude,codex,gemini`
  - агент ACP для прямого `pnpm test:live ...`: `claude`
  - синтетичний канал: контекст розмови у стилі Slack DM
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
  - Ця лінія використовує поверхню Gateway `chat.send` з адміністративними полями синтетичного вихідного маршруту, щоб тести могли приєднувати контекст каналу повідомлень без удавання зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів вбудованого Plugin `acpx` для вибраного агента ACP harness.
  - Створення Cron MCP для прив’язаної сесії типово виконується за принципом best-effort, бо зовнішні ACP harness можуть скасовувати виклики MCP після проходження перевірки прив’язування/зображення; задайте `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, щоб зробити цю перевірку Cron після прив’язування суворою.

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

- Runner Docker розташований у `scripts/test-live-acp-bind-docker.sh`.
- Типово він послідовно запускає smoke ACP bind для сукупних живих агентів CLI: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він підключає `~/.profile`, розміщує відповідні матеріали автентифікації CLI в контейнері, а потім, якщо бракує, встановлює запитаний живий CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` або `opencode-ai`). Сам бекенд ACP є вбудованим пакетом `acpx/runtime` із Plugin `acpx`.
- Варіант Docker для Droid розміщує `~/.factory` для налаштувань, передає `FACTORY_API_KEY` і вимагає цей API-ключ, бо локальна автентифікація Factory через OAuth/keyring не переноситься в контейнер. Він використовує вбудований запис реєстру ACPX `droid exec --output-format acp`.
- Варіант Docker для OpenCode є суворою регресійною лінією з одним агентом. Він записує тимчасову типову модель `OPENCODE_CONFIG_CONTENT` з `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (типово `opencode/kimi-k2.6`) після підключення `~/.profile`, а `pnpm test:docker:live-acp-bind:opencode` вимагає прив’язаний транскрипт асистента замість прийняття загального пропуску після прив’язування.
- Прямі виклики CLI `acpx` є лише ручним/обхідним шляхом для порівняння поведінки поза Gateway. Docker smoke ACP bind перевіряє вбудований бекенд runtime `acpx` OpenClaw.

## Live: smoke app-server harness Codex

- Мета: перевірити Codex harness, що належить Plugin, через звичайний метод gateway
  `agent`:
  - завантажити вбудований Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід агента gateway до `openai/gpt-5.5` із примусово заданим Codex harness
  - надіслати другий хід до тієї самої сесії OpenClaw і перевірити, що потік app-server
    може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях команди gateway
  - необов’язково виконати дві перевірені Guardian підвищені shell-перевірки: одну нешкідливу
    команду, яку має бути схвалено, і одне фальшиве завантаження секрету, яке має бути
    відхилено, щоб агент поставив запитання у відповідь
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.5`
- Необов’язкова перевірка зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова перевірка MCP/інструмента: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова перевірка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke задає `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб несправний Codex
  harness не міг пройти через мовчазний fallback до PI.
- Автентифікація: автентифікація app-server Codex з локального входу в підписку Codex. Docker
  smokes також можуть надавати `OPENAI_API_KEY` для перевірок не-Codex, коли застосовно,
  плюс необов’язково скопійовані `~/.codex/auth.json` і `~/.codex/config.toml`.

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

- Runner Docker розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він підключає змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли автентифікації Codex CLI
  за наявності, встановлює `@openai/codex` у доступний для запису змонтований префікс npm,
  розміщує дерево вихідного коду, а потім запускає лише живий тест Codex-harness.
- Docker типово вмикає перевірки зображення, MCP/інструмента та Guardian. Задайте
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`, або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий налагоджувальний
  запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, відповідно до конфігурації живого
  тесту, щоб застарілі псевдоніми або fallback PI не могли приховати регресію Codex harness.

### Рекомендовані живі рецепти

Вузькі, явні списки дозволеного найшвидші й найменш нестабільні:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклики інструментів у кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - Якщо локальні ключі зберігаються в профілі shell: `source ~/.profile`
  - Динамічне типове значення Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамічний бюджет Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст Antigravity OAuth (endpoint агента в стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (API-ключ / автентифікація профілю); саме це більшість користувачів має на увазі під “Gemini”.
  - CLI: OpenClaw запускає локальний бінарний файл `gemini` через shell; він має власну автентифікацію й може поводитися інакше (streaming/підтримка інструментів/розбіжність версій).

## Live: матриця моделей (що ми покриваємо)

Фіксованого “списку моделей CI” немає (live вмикається явно), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний smoke-набір (виклик інструментів + зображення)

Це запуск “поширених моделей”, який ми очікуємо підтримувати в робочому стані:

- OpenAI (не-Codex): `openai/gpt-5.5`
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

Виберіть принаймні одну модель для кожної родини провайдерів:

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

Якщо у вас увімкнено ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів+зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Додаткові провайдери, яких можна включити в live-матрицю (якщо маєте облікові дані/конфігурацію):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні endpoints): `minimax` (хмара/API), плюс будь-який проксі, сумісний з OpenAI/Anthropic (LM Studio, vLLM, LiteLLM тощо)

<Tip>
Не хардкодьте "all models" у документації. Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині, плюс доступні ключі.
</Tip>

## Облікові дані (ніколи не комітьте)

Живі тести знаходять облікові дані так само, як це робить CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест повідомляє «no creds», налагоджуйте так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає “profile keys” у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється до проміжного live-домашнього каталогу, якщо присутній, але не є основним сховищем profile-key)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного агента, застарілий каталог `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового тестового домашнього каталогу; проміжні live-домашні каталоги пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` вилучаються, щоб зондування не потрапляли у ваш реальний робочий простір хоста.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` у контейнер).

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
  - Корисно після зміни надсилання workflow comfy, polling, завантажень або реєстрації plugin

## Image generation live

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований plugin провайдера генерації зображень
  - Завантажує відсутні env-змінні провайдера з вашої login shell (`~/.profile`) перед зондуванням
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Проганяє кожного налаштованого провайдера через спільний runtime генерації зображень:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише через env

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

Це охоплює розбір аргументів CLI, визначення конфігурації/default-agent, активацію вбудованого plugin, спільний runtime генерації зображень і live-запит до провайдера. Очікується, що залежності Plugin будуть наявні до завантаження runtime.

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний вбудований шлях провайдера генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env-змінні провайдера з вашої login shell (`~/.profile`) перед зондуванням
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва заявлені режими runtime, коли доступні:
    - `generate` із введенням лише prompt
    - `edit`, коли провайдер заявляє `capabilities.edit.enabled`
  - Поточне охоплення shared-lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий Comfy live-файл, не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише через env

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний вбудований шлях провайдера генерації відео
  - За замовчуванням використовує release-safe smoke-шлях: провайдери не FAL, один text-to-video-запит на провайдера, односекундний lobster prompt і ліміт операцій на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, бо затримка черги на боці провайдера може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env-змінні провайдера з вашої login shell (`~/.profile`) перед зондуванням
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати заявлені режими transform, коли доступні:
    - `imageToVideo`, коли провайдер заявляє `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає buffer-backed локальне зображення у спільному sweep
    - `videoToVideo`, коли провайдер заявляє `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає buffer-backed локальне відео у спільному sweep
  - Поточні заявлені, але пропущені провайдери `imageToVideo` у спільному sweep:
    - `vydra`, бо вбудований `veo3` підтримує лише text-only, а вбудований `kling` потребує віддаленого URL зображення
  - Специфічне для провайдера охоплення Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс lane `kling`, який за замовчуванням використовує fixture віддаленого URL зображення
  - Поточне live-охоплення `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні заявлені, але пропущені провайдери `videoToVideo` у спільному sweep:
    - `alibaba`, `qwen`, `xai`, бо ці шляхи наразі потребують віддалених `http(s)` / MP4 reference URL
    - `google`, бо поточний спільний lane Gemini/Veo використовує локальне buffer-backed введення, і цей шлях не приймається у спільному sweep
    - `openai`, бо поточний спільний lane не має гарантій доступу до org-specific video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера в default sweep, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт операції кожного провайдера для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів та ігнорувати перевизначення лише через env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні image, music і video live-набори через одну repo-native точку входу
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
