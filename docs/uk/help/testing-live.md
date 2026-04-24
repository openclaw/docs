---
read_when:
    - Запуск live smoke-тестів для матриці моделей / бекенда CLI / ACP / постачальника медіа
    - Налагодження визначення облікових даних для live-тестів
    - Додавання нового live-тесту, специфічного для постачальника
sidebarTitle: Live tests
summary: 'Live (з доступом до мережі) тести: матриця моделей, бекенди CLI, ACP, постачальники медіа, облікові дані'
title: 'Тестування: live suites'
x-i18n:
    generated_at: "2026-04-24T15:33:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e9a76038dbfe50271225bd3b5405e5dea9a1a19d7591da2114709009f5de66e
    source_path: help/testing-live.md
    workflow: 15
---

Для швидкого старту, раннерів QA, unit/integration-наборів і Docker-потоків див.
[Тестування](/uk/help/testing). Ця сторінка охоплює **live** (з доступом до мережі) набори
тестів: матрицю моделей, бекенди CLI, ACP і live-тести постачальників медіа, а також
обробку облікових даних.

## Live: перевірка можливостей Android node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яка зараз оголошена** підключеним Android node, і перевірити поведінку контракту команди.
- Обсяг:
  - Налаштування перед запуском/вручну (набір тестів не встановлює/не запускає/не спаровує застосунок).
  - Перевірка `node.invoke` Gateway для вибраного Android node по кожній команді окремо.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключено й спаровано з Gateway.
  - Застосунок утримується на передньому плані.
  - Для можливостей, які ви очікуєте як успішні, надано дозволи/підтвердження захоплення.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості про налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke-тест моделей (ключі профілів)

Live-тести поділено на два рівні, щоб ми могли ізолювати збої:

- «Пряма модель» показує, чи може постачальник/модель взагалі відповісти з наданим ключем.
- «Smoke-тест Gateway» показує, чи працює для цієї моделі повний конвеєр gateway+agent (сесії, історія, інструменти, політика sandbox тощо).

### Рівень 1: Пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике completion для кожної моделі (і цільові регресійні перевірки там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб справді запустити цей набір; інакше він буде пропущений, щоб `pnpm test:live` залишався зосередженим на smoke-тесті gateway
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Для modern/all-прогонів за замовчуванням використовується підібране обмеження з високим сигналом; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern-прогону або додатне число для меншого обмеження.
  - Вичерпні прогони використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як тайм-аут для всього прямого тесту моделей. За замовчуванням: 60 хвилин.
  - Прямі перевірки моделей за замовчуванням виконуються з паралелізмом 20; для перевизначення встановіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`.
- Як вибрати постачальників:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні значення env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб жорстко вимагати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API постачальника зламане / ключ недійсний» від «зламаний конвеєр gateway agent»
  - Містить невеликі ізольовані регресії (приклад: OpenAI Responses/Codex Responses reasoning replay + потоки виклику інструментів)

### Рівень 2: Smoke-тест Gateway + dev agent (те, що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти gateway in-process
  - Створити/змінити сесію `agent:dev:*` (з перевизначенням моделі для кожного запуску)
  - Ітерувати моделі з ключами й перевіряти:
    - «змістовну» відповідь (без інструментів)
    - що працює реальний виклик інструмента (перевірка читання)
    - необов’язкові додаткові перевірки інструментів (перевірка exec+read)
    - що регресійні шляхи OpenAI (лише виклик інструмента → подальший крок) і далі працюють
- Подробиці перевірок (щоб ви могли швидко пояснювати збої):
  - перевірка `read`: тест записує nonce-файл у workspace й просить agent виконати `read` і повернути nonce назад.
  - перевірка `exec+read`: тест просить agent через `exec` записати nonce у тимчасовий файл, а потім через `read` прочитати його назад.
  - перевірка зображення: тест прикріплює згенерований PNG (кіт + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Для modern/all gateway-прогонів за замовчуванням використовується підібране обмеження з високим сигналом; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern-прогону або додатне число для меншого обмеження.
- Як вибрати постачальників (уникнути «OpenRouter для всього»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Перевірки інструментів і зображень у цьому live-тесті завжди ввімкнені:
  - перевірка `read` + перевірка `exec+read` (навантаження на інструменти)
  - перевірка зображення виконується, коли модель заявляє підтримку вхідних зображень
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG із «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований agent пересилає multimodal-повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що саме можна тестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke-тест бекенда CLI (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent із використанням локального бекенда CLI, не торкаючись вашої типової конфігурації.
- Типові значення smoke-тесту для конкретного бекенда зберігаються у визначенні `cli-backend.ts` у розширенні-власнику.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий постачальник/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих Plugin бекенда CLI-власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надсилати реальне вкладення-зображення (шляхи впроваджуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість впровадження в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати способом передавання аргументів зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий крок і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типову перевірку безперервності тієї самої сесії Claude Sonnet -> Opus (установіть `1`, щоб примусово ввімкнути її, коли вибрана модель підтримує ціль перемикання).

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

Docker-рецепти для окремих постачальників:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker-раннер розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke-тест CLI-бекенда всередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані smoke-тесту CLI з розширення-власника, а потім встановлює відповідний пакет Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований префікс із правом запису в `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносної OAuth-підписки Claude Code через `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він підтверджує прямий виклик `claude -p` у Docker, а потім запускає два кроки Gateway CLI-бекенда без збереження env-змінних ключа Anthropic API. Ця гілка підписки за замовчуванням вимикає перевірки Claude MCP/tool і image, оскільки зараз Claude маршрутизує використання сторонніх застосунків через додаткове тарифікування usage замість звичайних лімітів плану підписки.
- Live smoke-тест CLI-бекенда тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий крок, крок класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Типовий smoke-тест Claude також змінює сесію із Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: smoke-тест ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язки розмови ACP з live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє в transcript прив’язаної сесії ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP-агенти в Docker: `claude,codex,gemini`
  - ACP-агент для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - Бекенд ACP: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Примітки:
  - Ця гілка використовує поверхню gateway `chat.send` з адмінськими синтетичними полями originating-route, щоб тести могли додавати контекст каналу повідомлень без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр агентів Plugin `acpx` для вибраного ACP harness agent.

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

Docker-рецепти для окремих агентів:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Docker-раннер розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає smoke-тест ACP bind послідовно для всіх підтримуваних live CLI-агентів: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він підвантажує `~/.profile`, переносить відповідні матеріали автентифікації CLI в контейнер, встановлює `acpx` у npm-префікс із правом запису, а потім установлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його бракує.
- Усередині Docker раннер встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні постачальника з підвантаженого профілю доступними для дочірнього harness CLI.

## Live: smoke-тест harness app-server Codex

- Мета: перевірити harness Codex, яким володіє Plugin, через звичайний метод Gateway
  `agent`:
  - завантажити вбудований Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший крок gateway agent до `openai/gpt-5.2` із примусово вибраним harness Codex
  - надіслати другий крок до тієї самої сесії OpenClaw і перевірити, що потік
    app-server може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях
    команди gateway
  - необов’язково виконати дві Guardian-рецензовані ескаловані shell-перевірки: одну безпечну
    команду, яку слід схвалити, і одне фальшиве вивантаження секрету, яке має бути
    відхилене, щоб agent перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.2`
- Необов’язкова перевірка зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова перевірка MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова перевірка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke-тест установлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний harness Codex
  не міг пройти, непомітно переключившись на PI.
- Автентифікація: автентифікація app-server Codex з локального входу в підписку Codex. Docker
  smoke-тести також можуть надавати `OPENAI_API_KEY` для не-Codex перевірок, де це застосовно,
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

- Docker-раннер розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він підвантажує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації CLI Codex, якщо вони є, встановлює `@openai/codex` у змонтований npm-префікс
  із правом запису, підготовлює дерево вихідного коду, а потім запускає лише live-тест harness Codex.
- Docker за замовчуванням вмикає перевірки image, MCP/tool і Guardian. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий налагоджувальний
  прогін.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, відповідно до конфігурації live-
  тесту, щоб застарілі псевдоніми або fallback на PI не могли приховати регресію
  harness Codex.

### Рекомендовані live-рецепти

Вузькі, явні allowlist працюють найшвидше й найменш схильні до збоїв:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke-тест:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів у кількох постачальників:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (ключ API Gemini + Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує API Gemini (ключ API).
- `google-antigravity/...` використовує міст OAuth Antigravity (кінцева точка agent у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний CLI Gemini на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API порівняно з Gemini CLI:
  - API: OpenClaw викликає розміщений Google API Gemini через HTTP (ключ API / автентифікація профілю); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw виконує локальний бінарний файл `gemini`; він має власну автентифікацію й може поводитися інакше (streaming/підтримка інструментів/розбіжність версій).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» немає (live вмикається опційно), але це **рекомендовані** моделі для регулярного покриття на dev-машині з ключами.

### Сучасний набір smoke-тестів (виклик інструментів + image)

Це прогін «типових моделей», який ми очікуємо зберігати працездатним:

- OpenAI (не-Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запустіть gateway smoke-тест із tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Виберіть щонайменше одну модель з кожної родини постачальників:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4` (або остання доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку у вас ввімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображень (вкладення → multimodal-повідомлення)

Додайте щонайменше одну модель із підтримкою зображень у `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші постачальники, яких можна включити до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні кінцеві точки): `minimax` (хмара/API), а також будь-який OpenAI/Anthropic-сумісний проксі (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко зашити в документацію «всі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині + які ключі доступні.

## Облікові дані (ніколи не комітьте)

Live-тести визначають облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знайти ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це у live-тестах означає «ключі профілів»)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється до staged live home, якщо присутній, але не є основним сховищем ключів профілю)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного agent, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI у тимчасовий домашній каталог тесту; staged live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` вилучаються, щоб перевірки не торкалися вашого реального host workspace.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-раннери нижче (вони можуть монтувати `~/.profile` у контейнер).

## Live: Deepgram (транскрипція аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live: BytePlus coding plan

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live: медіа ComfyUI workflow

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у надсиланні workflow comfy, опитуванні, завантаженнях або реєстрації Plugin

## Live: генерація зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований Plugin постачальника генерації зображень
  - Завантажує відсутні env-змінні постачальників із вашого login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env-ключі API раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає постачальників без придатної автентифікації/профілю/моделі
  - Проганяє стандартні варіанти генерації зображень через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані постачальники в покритті:
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

## Live: генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний вбудований шлях постачальника генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env-змінні постачальників із вашого login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env-ключі API раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає постачальників без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` з вхідними даними лише у вигляді prompt
    - `edit`, коли постачальник оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної гілки:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не цей спільний прогін
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Live: генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний вбудований шлях постачальника генерації відео
  - За замовчуванням використовує безпечний для релізу шлях smoke-тесту: постачальники без FAL, один запит text-to-video на постачальника, односекундний prompt із лобстером і обмеження операції на кожного постачальника з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - FAL за замовчуванням пропускається, оскільки затримка черги на боці постачальника може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env-змінні постачальників із вашого login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env-ключі API раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає постачальників без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими перетворення, коли вони доступні:
    - `imageToVideo`, коли постачальник оголошує `capabilities.imageToVideo.enabled` і вибраний постачальник/модель приймає локальний вхід зображення на основі буфера у спільному прогоні
    - `videoToVideo`, коли постачальник оголошує `capabilities.videoToVideo.enabled` і вибраний постачальник/модель приймає локальний вхід відео на основі буфера у спільному прогоні
  - Поточні оголошені, але пропущені постачальники `imageToVideo` у спільному прогоні:
    - `vydra`, оскільки вбудований `veo3` підтримує лише text, а вбудований `kling` вимагає віддалений URL зображення
  - Покриття Vydra, специфічне для постачальника:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video, а також гілку `kling`, яка за замовчуванням використовує fixture з віддаленим URL зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені постачальники `videoToVideo` у спільному прогоні:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі вимагають віддалені еталонні URL `http(s)` / MP4
    - `google`, оскільки поточна спільна гілка Gemini/Veo використовує локальний вхід на основі буфера, а цей шлях не приймається у спільному прогоні
    - `openai`, оскільки в поточній спільній гілці немає гарантій доступу до video inpaint/remix, специфічного для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити до типового прогону кожного постачальника, зокрема FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження операції для кожного постачальника під час агресивного smoke-прогону
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики та відео через один вбудований у репозиторій entrypoint
  - Автоматично завантажує відсутні env-змінні постачальників із `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до постачальників, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і quiet mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — набори unit, integration, QA і Docker
