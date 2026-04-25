---
read_when:
    - Запуск smoke-тестів Live для матриці моделей / бекенду CLI / ACP / медіапровайдерів
    - Налагодження визначення облікових даних для Live-тестів
    - Додавання нового Live-тесту, специфічного для провайдера
sidebarTitle: Live tests
summary: 'Тести Live (із взаємодією з мережею): матриця моделей, бекенди CLI, ACP, медіапровайдери, облікові дані'
title: 'Тестування: Live-набори тестів'
x-i18n:
    generated_at: "2026-04-25T05:04:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a475044ae7ae914d36b2530ca204eb7b632bc578e4ed16770811617ffc05d83
    source_path: help/testing-live.md
    workflow: 15
---

Щоб швидко почати, дізнатися про QA-ранери, набори unit/integration тестів і Docker-потоки, дивіться
[Тестування](/uk/help/testing). На цій сторінці описано **live**-набори тестів
(із взаємодією з мережею): матриця моделей, бекенди CLI, ACP і live-тести
медіапровайдерів, а також робота з обліковими даними.

## Live: локальні команди smoke-тестів профілю

Перед спеціальними live-перевірками виконайте `source ~/.profile`, щоб ключі провайдерів і шляхи до локальних інструментів
відповідали вашій оболонці:

```bash
source ~/.profile
```

Безпечний smoke-тест медіа:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безпечний smoke-тест готовності голосових викликів:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` є dry run, якщо також не вказано `--yes`. Використовуйте `--yes` лише тоді,
коли ви свідомо хочете здійснити реальний дзвінок-сповіщення. Для Twilio, Telnyx і
Plivo успішна перевірка готовності потребує публічного URL Webhook; лише локальні
loopback/приватні резервні варіанти навмисно відхиляються.

## Live: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, що зараз оголошена** підключеним Android Node, і перевірити поведінку контракту команд.
- Область:
  - Попередньо підготовлене/ручне налаштування (набір тестів не встановлює/не запускає/не спаровує застосунок).
  - Перевірка gateway `node.invoke` для вибраного Android Node команда за командою.
- Обов’язкова попередня підготовка:
  - Android-застосунок уже підключено й спарено з Gateway.
  - Застосунок утримується на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте успішно пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості про налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke-тест моделей (ключі профілю)

Live-тести поділено на два шари, щоб можна було ізолювати збої:

- «Direct model» показує, чи може провайдер/модель взагалі відповісти з указаним ключем.
- «Gateway smoke» показує, чи працює для цієї моделі весь конвеєр Gateway+агента (сеанси, історія, інструменти, політика sandbox тощо).

### Шар 1: пряме завершення моделі (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і цільові регресійні перевірки, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб справді запустити цей набір тестів; інакше він пропускається, щоб `pnpm test:live` залишався зосередженим на smoke-тесті Gateway
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Для modern/all перевірок за замовчуванням використовується підібраний ліміт із високим сигналом; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
  - Для вичерпних перевірок використовується `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як тайм-аут усього тесту direct-model. За замовчуванням: 60 хвилин.
  - За замовчуванням перевірки direct-model виконуються з паралелізмом 20; щоб перевизначити це, установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні значення env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «конвеєр Gateway-агента зламаний»
  - Містить невеликі ізольовані регресії (приклад: повторення reasoning replay OpenAI Responses/Codex Responses + потоки виклику інструментів)

### Шар 2: smoke-тест Gateway + dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти Gateway у процесі
  - Створити/пропатчити сеанс `agent:dev:*` (з перевизначенням моделі для кожного запуску)
  - Перебрати моделі-з-ключами й перевірити:
    - «змістовну» відповідь (без інструментів)
    - що працює реальний виклик інструмента (перевірка read)
    - необов’язкові додаткові перевірки інструментів (перевірка exec+read)
    - що регресійні шляхи OpenAI (лише tool-call → follow-up) продовжують працювати
- Деталі перевірок (щоб ви могли швидко пояснювати збої):
  - перевірка `read`: тест записує nonce-файл у робочу область і просить агента виконати `read` для нього та повернути nonce.
  - перевірка `exec+read`: тест просить агента через `exec` записати nonce у тимчасовий файл, а потім прочитати його назад через `read`.
  - перевірка зображення: тест додає згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Для modern/all перевірок Gateway за замовчуванням використовується підібраний ліміт із високим сигналом; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
- Як вибирати провайдерів (щоб уникнути «все через OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Перевірки інструментів і зображень у цьому live-тесті завжди увімкнені:
  - перевірка `read` + перевірка `exec+read` (навантаження на інструменти)
  - перевірка зображення виконується, коли модель заявляє підтримку вхідних зображень
  - Потік (на високому рівні):
    - Тест генерує маленький PNG із «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент пересилає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (толерантність OCR: незначні помилки дозволені)

Порада: щоб побачити, що ви можете тестувати на своїй машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke-тест бекенду CLI (Claude, Codex, Gemini або інших локальних CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + агента з використанням локального бекенду CLI, не зачіпаючи вашу типову конфігурацію.
- Типові значення для smoke-тестів конкретного бекенду містяться у визначенні `cli-backend.ts` відповідного розширення.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Провайдер/модель за замовчуванням: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих Plugin бекенду CLI-власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи вбудовуються в prompt). У recipes Docker це за замовчуванням вимкнено, якщо явно не запитано.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість вбудовування в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати передаванням аргументів зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути перевірку безперервності того самого сеансу Claude Sonnet -> Opus, коли вибрана модель підтримує ціль перемикання. У recipes Docker це за замовчуванням вимкнено для загальної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути перевірку loopback MCP/tool. У recipes Docker це за замовчуванням вимкнено, якщо явно не запитано.

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

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

- Docker-ранер розташовано в `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke-тест бекенду CLI всередині Docker-образу репозиторію як непривілейований користувач `node`.
- Він визначає метадані smoke-тестів CLI із відповідного розширення, а потім установлює відповідний Linux-пакет CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс за адресою `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує portable OAuth підписки Claude Code або через `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType`, або через `CLAUDE_CODE_OAUTH_TOKEN` із `claude setup-token`. Спочатку він підтверджує прямий `claude -p` у Docker, а потім виконує два ходи Gateway CLI-backend без збереження змінних середовища Anthropic API-key. У цій гілці підписки перевірки Claude MCP/tool і зображень за замовчуванням вимкнені, оскільки Claude зараз маршрутизує використання сторонніх застосунків через оплату додаткового використання, а не через звичайні ліміти тарифного плану підписки.
- Live smoke-тест бекенду CLI тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Типовий smoke-тест Claude також патчить сеанс із Sonnet на Opus і перевіряє, що відновлений сеанс досі пам’ятає попередню нотатку.

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік conversation-bind ACP із live ACP-агентом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel на місці
  - надіслати звичайний follow-up у тій самій розмові
  - перевірити, що follow-up потрапляє в transcript прив’язаного ACP-сеансу
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
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Примітки:
  - Ця гілка використовує поверхню gateway `chat.send` з адміністративними синтетичними полями originating-route, щоб тести могли приєднати контекст message-channel без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр агентів Plugin `acpx` для вибраного агента ACP harness.

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
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Docker-ранер розташовано в `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає ACP bind smoke-тест послідовно для всіх підтримуваних live CLI-агентів: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він виконує `source ~/.profile`, підготовлює відповідні автентифікаційні матеріали CLI у контейнері, установлює `acpx` у записуваний npm-префікс, а потім установлює запитаний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker раннер установлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав змінні середовища провайдера з профілю, підключеного через `source`, доступними для дочірнього harness CLI.

## Live: smoke-тест harness app-server Codex

- Мета: перевірити Codex harness, що належить Plugin, через звичайний
  метод Gateway `agent`:
  - завантажити вбудований Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `openai/gpt-5.2` із примусово вибраним Codex harness
  - надіслати другий хід до того самого сеансу OpenClaw і перевірити, що потік
    app-server може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях
    команд Gateway
  - за потреби виконати дві ескальовані shell-перевірки, перевірені Guardian: одну безпечну
    команду, яку слід схвалити, і одне фальшиве вивантаження секрету, яке слід
    відхилити, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.2`
- Необов’язкова перевірка зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова перевірка MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова перевірка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Цей smoke-тест установлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний Codex
  harness не міг пройти тест, непомітно переключившись на Pi.
- Автентифікація: автентифікація app-server Codex із локального входу підписки Codex. Docker
  smoke-тести також можуть надавати `OPENAI_API_KEY` для не-Codex перевірок, де це доречно,
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

- Docker-ранер розташовано в `scripts/test-live-codex-harness-docker.sh`.
- Він виконує `source` для змонтованого `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації CLI Codex, якщо вони є, установлює `@openai/codex` у записуваний змонтований npm
  префікс, підготовлює дерево вихідних файлів, а потім запускає лише live-тест Codex-harness.
- У Docker за замовчуванням увімкнені перевірки зображень, MCP/tool і Guardian. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий налагоджувальний
  запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, що відповідає конфігурації live-тесту,
  тож застарілі псевдоніми або fallback на PI не можуть приховати регресію Codex harness.

### Рекомендовані live-рецепти

Найшвидші й найменш нестабільні — вузькі, явні allowlist:

- Одна модель, напряму (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів через кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (ключ API Gemini + Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke-тест адаптивного мислення Google:
  - Якщо локальні ключі зберігаються в профілі оболонки: `source ~/.profile`
  - Gemini 3 dynamic default: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує API Gemini (ключ API).
- `google-antigravity/...` використовує міст OAuth Antigravity (кінцева точка агента в стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний CLI Gemini на вашій машині (окрема автентифікація + особливості інструментарію).
- API Gemini проти CLI Gemini:
  - API: OpenClaw викликає розміщений Google API Gemini через HTTP (автентифікація ключем API / профілем); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw викликає локальний двійковий файл `gemini`; він має власну автентифікацію і може поводитися інакше (streaming/підтримка інструментів/розходження версій).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» немає (live є opt-in), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний набір smoke-тестів (виклик інструментів + зображення)

Це запуск «поширених моделей», який ми очікуємо підтримувати працездатним:

- OpenAI (не-Codex): `openai/gpt-5.2`
- OAuth OpenAI Codex: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск gateway smoke з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Виберіть щонайменше одну модель для кожного сімейства провайдерів:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою інструментів, яку у вас ввімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображень (вкладення → мультимодальне повідомлення)

Додайте щонайменше одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні Gateway

Якщо у вас увімкнено ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів і зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, яких можна додати до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні кінцеві точки): `minimax` (хмара/API), а також будь-який проксі, сумісний з OpenAI/Anthropic (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко зафіксувати в документації «усі моделі». Авторитетним списком є те, що повертає `discoverModels(...)` на вашій машині, разом із доступними ключами.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знайти ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як ви налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це в live-тестах означає «ключі профілю»)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється в підготовлений live home, якщо наявний, але не є основним сховищем ключів профілю)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного агента, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового test home; у підготовлених live home пропускаються `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб перевірки не торкалися вашого реального робочого простору хоста.

Якщо ви хочете покладатися на ключі env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` у контейнер).

## Live Deepgram (транскрибування аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live медіа ComfyUI workflow

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Область:
  - Перевіряє вбудовані шляхи comfy image, video і `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `plugins.entries.comfy.config.<capability>`
  - Корисно після змін у надсиланні workflow comfy, опитуванні, завантаженнях або реєстрації Plugin

## Live генерація зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Область:
  - Перелічує кожен зареєстрований Plugin провайдера генерації зображень
  - Завантажує відсутні env-змінні провайдера з вашої оболонки входу (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не приховували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає кожного налаштованого провайдера через спільний runtime генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, коли провайдер заявляє підтримку редагування
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

Для перевірки шляху shipped CLI додайте smoke-тест `infer` після того, як live-тест
провайдера/runtime пройде успішно:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це покриває розбір аргументів CLI, визначення config/default-agent, активацію вбудованого
Plugin, ремонт залежностей вбудованого runtime на вимогу, спільний
runtime генерації зображень і live-запит до провайдера.

## Live генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Область:
  - Перевіряє спільний шлях вбудованого провайдера генерації музики
  - Наразі покриває Google і MiniMax
  - Завантажує env-змінні провайдера з вашої оболонки входу (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не приховували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва заявлені режими runtime, коли вони доступні:
    - `generate` з введенням лише prompt
    - `edit`, коли провайдер заявляє `capabilities.edit.enabled`
  - Поточне покриття спільної гілки:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не ця спільна перевірка
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Live генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Область:
  - Перевіряє спільний шлях вбудованого провайдера генерації відео
  - За замовчуванням використовує безпечний для релізу шлях smoke-тесту: провайдери без FAL, один запит text-to-video на провайдера, one-second lobster prompt і обмеження операції для кожного провайдера через `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці провайдера може домінувати над часом релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env-змінні провайдера з вашої оболонки входу (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не приховували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати заявлені режими трансформації, коли вони доступні:
    - `imageToVideo`, коли провайдер заявляє `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальне введення зображення на основі буфера у спільній перевірці
    - `videoToVideo`, коли провайдер заявляє `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальне введення відео на основі буфера у спільній перевірці
  - Поточні заявлені, але пропущені провайдери `imageToVideo` у спільній перевірці:
    - `vydra`, оскільки вбудований `veo3` підтримує лише text-to-video, а вбудований `kling` потребує віддалений URL зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс гілку `kling`, яка за замовчуванням використовує фікстуру віддаленого URL зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні заявлені, але пропущені провайдери `videoToVideo` у спільній перевірці:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи зараз потребують віддалені еталонні URL `http(s)` / MP4
    - `google`, оскільки поточна спільна гілка Gemini/Veo використовує локальне введення на основі буфера, а цей шлях не приймається у спільній перевірці
    - `openai`, оскільки поточна спільна гілка не гарантує доступ до video inpaint/remix, специфічний для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до типового набору перевірок, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження операції для кожного провайдера для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики й відео через один вбудований у репозиторій entrypoint
  - Автоматично завантажує відсутні env-змінні провайдера з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір тестів до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і quiet mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — набори unit, integration, QA і Docker
