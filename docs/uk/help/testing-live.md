---
read_when:
    - Запуск живих smoke-тестів для матриці моделей / CLI-бекенду / ACP / медіапровайдера
    - Налагодження визначення облікових даних для живих тестів
    - Додавання нового живого тесту для конкретного провайдера
sidebarTitle: Live tests
summary: 'Живі (такі, що звертаються до мережі) тести: матриця моделей, CLI-бекенди, ACP, медіапровайдери, облікові дані'
title: 'Тестування: живі набори тестів'
x-i18n:
    generated_at: "2026-04-25T01:36:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7c6a2b851660544485c43a743d15ab0105680c0a7220354ddd9e396b505b158
    source_path: help/testing-live.md
    workflow: 15
---

Щоб швидко почати роботу, переглянути QA-ранери, модульні/інтеграційні набори тестів і Docker-потоки, див.
[Тестування](/uk/help/testing). На цій сторінці описано **живі** (такі, що звертаються до мережі) набори тестів:
матриця моделей, CLI-бекенди, ACP і живі тести медіапровайдерів, а також
обробка облікових даних.

## Живі: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, що наразі оголошена** підключеним Android Node, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір тестів не встановлює, не запускає і не спаровує застосунок).
  - Перевірка `node.invoke` Gateway команда за командою для вибраного Android Node.
- Необхідне попереднє налаштування:
  - Android-застосунок уже підключено й спаровано з Gateway.
  - Застосунок утримується на передньому плані.
  - Дозволи/згода на захоплення надані для можливостей, проходження яких ви очікуєте.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості про налаштування Android: [Android App](/uk/platforms/android)

## Живі: smoke-тест моделей (ключі профілів)

Живі тести розділено на два шари, щоб можна було ізолювати збої:

- “Пряма модель” показує, чи провайдер/модель узагалі може відповісти з наданим ключем.
- “Gateway smoke” показує, чи працює для цієї моделі весь конвеєр gateway+agent (сесії, історія, інструменти, політика sandbox тощо).

### Шар 1: Пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике completion для кожної моделі (і цільові регресійні перевірки, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб справді запустити цей набір тестів; інакше його буде пропущено, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Для modern/all-перевірок за замовчуванням використовується підібраний високосигнальний ліміт; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
  - Для вичерпних перевірок використовується `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як загальний тайм-аут тесту прямої моделі. Типове значення: 60 хвилин.
  - Проби прямої моделі за замовчуванням виконуються з паралелізмом 20; щоб перевизначити, установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні значення з env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює “API провайдера зламане / ключ недійсний” від “конвеєр gateway agent зламаний”
  - Містить невеликі ізольовані регресії (приклад: повторення міркування OpenAI Responses/Codex Responses + потоки tool-call)

### Шар 2: Gateway + smoke-тест dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти gateway в процесі
  - Створити/патчити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітеруватися за моделями з ключами й перевіряти:
    - “змістовну” відповідь (без інструментів)
    - що працює реальний виклик інструмента (`read` probe)
    - необов’язкові додаткові проби інструментів (`exec+read` probe)
    - що шляхи регресії OpenAI (лише tool-call → follow-up) продовжують працювати
- Деталі проб (щоб ви могли швидко пояснювати збої):
  - `read` probe: тест записує nonce-файл у робочому просторі й просить agent виконати `read` для нього та повернути nonce.
  - `exec+read` probe: тест просить agent через `exec` записати nonce у тимчасовий файл, а потім прочитати його назад через `read`.
  - image probe: тест прикріплює згенерований PNG (кіт + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для сучасного allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Для modern/all gateway-перевірок за замовчуванням використовується підібраний високосигнальний ліміт; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
- Як вибрати провайдерів (уникнути “усе OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Проби інструментів і зображень у цьому живому тесті завжди ввімкнені:
  - `read` probe + `exec+read` probe (навантаження інструментів)
  - image probe запускається, коли модель оголошує підтримку вхідних зображень
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG з “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway аналізує вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований agent пересилає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що саме можна тестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Живі: smoke-тест CLI-бекенду (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent за допомогою локального CLI-бекенду, не торкаючись вашої типової конфігурації.
- Типові значення smoke-тестів для конкретного бекенду зберігаються у визначенні `cli-backend.ts` розширення-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий provider/model: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих Plugin CLI-бекенду-власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення зображення (шляхи впроваджуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість впровадження в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати способом передавання аргументів зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути пробу безперервності тієї самої сесії Claude Sonnet -> Opus, коли вибрана модель підтримує ціль перемикання. У Docker-рецептах це за замовчуванням вимкнено для загальної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути пробу loopback MCP/tool. У Docker-рецептах це за замовчуванням вимкнено, якщо це не запитано явно.

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

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
- Він запускає живий smoke-тест CLI-бекенду всередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані smoke-тесту CLI з розширення-власника, а потім установлює відповідний пакет Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований префікс із правом запису в `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує portable Claude Code subscription OAuth через або `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить, що прямий `claude -p` працює в Docker, а потім запускає два ходи Gateway CLI-бекенду без збереження env-змінних Anthropic API-key. Для цієї subscription-гілки проби Claude MCP/tool і image за замовчуванням вимкнено, оскільки зараз Claude маршрутизує використання сторонніх застосунків через тарифікацію додаткового використання замість звичайних лімітів плану підписки.
- Живий smoke-тест CLI-бекенду тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Типовий smoke-тест Claude також патчить сесію з Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає раніше залишену нотатку.

## Живі: smoke-тест ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік ACP conversation-bind із живим ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати synthetic message-channel conversation на місці
  - надіслати звичайне follow-up у тій самій conversation
  - перевірити, що follow-up потрапляє в transcript прив’язаної ACP session
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP agents у Docker: `claude,codex,gemini`
  - ACP agent для прямого `pnpm test:live ...`: `claude`
  - Synthetic channel: контекст розмови в стилі Slack DM
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
  - Ця гілка використовує поверхню gateway `chat.send` з admin-only полями synthetic originating-route, щоб тести могли приєднати контекст message-channel без удавання зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр agent Plugin `acpx` для вибраного ACP harness agent.

Приклад:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker-рецепт:

```bash
pnpm test:docker:live-acp-bind
```

Docker-рецепти для окремих agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Docker-ранер розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає smoke-тест ACP bind послідовно для всіх підтримуваних живих CLI agent: `claude`, `codex`, потім `gemini`.
- Використайте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він підвантажує `~/.profile`, підготовлює відповідні матеріали автентифікації CLI в контейнері, установлює `acpx` у npm-префікс із правом запису, а потім установлює запитаний живий CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker ранер установлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб `acpx` зберігав env-змінні провайдера з підвантаженого профілю доступними для дочірнього harness CLI.

## Живі: smoke-тест harness app-server Codex

- Мета: перевірити Codex harness, що належить Plugin, через звичайний gateway-метод
  `agent`:
  - завантажити вбудований Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `openai/gpt-5.2` із примусово вибраним Codex harness
  - надіслати другий хід до тієї самої сесії OpenClaw і перевірити, що app-server
    thread може відновитися
  - запустити `/codex status` і `/codex models` через той самий шлях
    команд gateway
  - за потреби запустити дві ескальовані shell-probe з перевіркою Guardian: одну нешкідливу
    команду, яку слід схвалити, і одне фіктивне завантаження секрету, яке має бути
    відхилене, щоб agent поставив уточнювальне запитання
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.2`
- Необов’язкова image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- У smoke-тесті встановлюється `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний Codex
  harness не міг пройти тихо через fallback до PI.
- Автентифікація: автентифікація Codex app-server з локального входу в підписку Codex. Docker
  smoke-тести також можуть надавати `OPENAI_API_KEY` для не-Codex-проб, де це застосовно,
  а також необов’язково копіювати `~/.codex/auth.json` і `~/.codex/config.toml`.

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

Docker-рецепт:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker-ранер розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він підвантажує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації Codex CLI за їх наявності, установлює `@openai/codex` у змонтований npm-префікс
  із правом запису, підготовлює дерево вихідного коду, а потім запускає лише живий тест Codex-harness.
- У Docker image-, MCP/tool- і Guardian-проби ввімкнено за замовчуванням. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли вам потрібен вужчий налагоджувальний
  запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, відповідно до конфігурації живого
  тесту, щоб застарілі псевдоніми або fallback до PI не могли приховати регресію
  Codex harness.

### Рекомендовані живі рецепти

Вузькі, явні allowlist — найшвидші й найменш схильні до нестабільності:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів у кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (ключ API Gemini + Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke-тест adaptive thinking Google:
  - Якщо локальні ключі зберігаються в профілі shell: `source ~/.profile`
  - Динамічний типовий Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамічний бюджет Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує API Gemini (ключ API).
- `google-antigravity/...` використовує OAuth-міст Antigravity (кінцева точка agent у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментів).
- API Gemini проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google API Gemini через HTTP (автентифікація через ключ API / профіль); саме це більшість користувачів мають на увазі під “Gemini”.
  - CLI: OpenClaw виконує локальний бінарний файл `gemini`; він має власну автентифікацію і може поводитися інакше (streaming/підтримка інструментів/розсинхрон версій).

## Живі: матриця моделей (що ми покриваємо)

Фіксованого “списку моделей CI” немає (живі тести вмикаються за бажанням), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний набір smoke-тестів (виклик інструментів + зображення)

Це запуск “поширених моделей”, який ми очікуємо зберігати працездатним:

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

Виберіть щонайменше одну модель для кожної родини провайдерів:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель з підтримкою інструментів, яку у вас ввімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додайте щонайменше одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI з підтримкою vision тощо), щоб задіяти image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів і зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити в живу матрицю (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (користувацькі кінцеві точки): `minimax` (хмара/API), а також будь-який OpenAI/Anthropic-сумісний проксі (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації “усі моделі”. Авторитетний список — це те, що на вашій машині повертає `discoverModels(...)`, плюс доступні ключі.

## Облікові дані (ніколи не комітьте)

Живі тести виявляють облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, живі тести мають знаходити ті самі ключі.
- Якщо живий тест повідомляє “немає облікових даних”, налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає “ключі профілів” у живих тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється в підготовлений живий домашній каталог за наявності, але не є основним сховищем ключів профілів)
- Локальні живі запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного agent, застарілий каталог `credentials/` і підтримувані зовнішні каталоги автентифікації CLI в тимчасовий домашній каталог тесту; у підготовлених живих домашніх каталогах пропускаються `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб проби не працювали у вашому реальному робочому просторі хоста.

Якщо ви хочете покладатися на ключі з env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker-ранери нижче (вони можуть змонтувати `~/.profile` у контейнер).

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
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `plugins.entries.comfy.config.<capability>`
  - Корисно після змін у надсиланні workflow comfy, опитуванні, завантаженнях або реєстрації Plugin

## Жива генерація зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований Plugin провайдера генерації зображень
  - Перед перевіркою завантажує відсутні env-змінні провайдера з вашого shell входу (`~/.profile`)
  - За замовчуванням використовує живі/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Проганяє кожного налаштованого провайдера через спільний runtime генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, коли провайдер оголошує підтримку редагування
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

Для шляху shipped CLI додайте smoke-тест `infer` після того, як живий тест
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

Це покриває парсинг аргументів CLI, визначення config/default-agent, активацію вбудованих
Plugin, on-demand repair залежностей runtime, спільний
runtime генерації зображень і живий запит до провайдера.

## Жива генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях вбудованих провайдерів генерації музики
  - Наразі покриває Google і MiniMax
  - Перед перевіркою завантажує env-змінні провайдера з вашого shell входу (`~/.profile`)
  - За замовчуванням використовує живі/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені режими runtime, коли вони доступні:
    - `generate` з вхідними даними лише у вигляді prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної гілки:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий живий файл Comfy, а не ця спільна перевірка
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

## Жива генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях вбудованих провайдерів генерації відео
  - За замовчуванням використовує безпечний для релізу smoke-шлях: провайдери без FAL, один запит text-to-video на провайдера, односекундний prompt із лобстером і ліміт операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці провайдера може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Перед перевіркою завантажує env-змінні провайдера з вашого shell входу (`~/.profile`)
  - За замовчуванням використовує живі/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими перетворення, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальні вхідні дані зображення з буфера у спільній перевірці
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальні вхідні дані відео з буфера у спільній перевірці
  - Поточні провайдери `imageToVideo`, оголошені, але пропущені у спільній перевірці:
    - `vydra`, тому що вбудований `veo3` є лише text-only, а вбудований `kling` потребує віддалений URL зображення
  - Покриття Vydra для конкретного провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video, а також гілку `kling`, яка за замовчуванням використовує віддалений URL-зображення як фікстуру
  - Поточне живе покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні провайдери `videoToVideo`, оголошені, але пропущені у спільній перевірці:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі потребують віддалені reference URL `http(s)` / MP4
    - `google`, оскільки поточна спільна гілка Gemini/Veo використовує локальні вхідні дані з буфера, а цей шлях не приймається у спільній перевірці
    - `openai`, оскільки поточна спільна гілка не гарантує доступ до org-specific video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера в типову перевірку, зокрема FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт операції для кожного провайдера під час агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні живі набори тестів для зображень, музики та відео через одну вбудовану в репозиторій точку входу
  - Автоматично завантажує відсутні env-змінні провайдера з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір тестів до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — модульні, інтеграційні, QA- та Docker-набори тестів
