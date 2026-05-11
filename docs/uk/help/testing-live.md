---
read_when:
    - Запуск живої матриці моделей / бекенду CLI / ACP / smoke-тестів media-provider
    - Налагодження розв’язання облікових даних live-тестів
    - Додавання нового тесту в реальному середовищі для конкретного провайдера
sidebarTitle: Live tests
summary: 'Живі (з доступом до мережі) тести: матриця моделей, бекенди CLI, ACP, медіапровайдери, облікові дані'
title: 'Тестування: набори тестів у реальному середовищі'
x-i18n:
    generated_at: "2026-05-11T20:42:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb020672cd71d03b2cfc78b135c7c39862823c421c0f2f31bae69a42f9c3437f
    source_path: help/testing-live.md
    workflow: 16
---

Для швидкого старту, QA-ранерів, модульних/інтеграційних наборів і Docker-потоків див.
[Тестування](/uk/help/testing). Ця сторінка охоплює **live**-набори тестів (які торкаються мережі):
матрицю моделей, CLI-бекенди, ACP і live-тести медіапровайдерів, а також
обробку облікових даних.

## Live: smoke-команди локального профілю

Підключіть `~/.profile` перед спеціальними live-перевірками, щоб ключі провайдерів і
шляхи локальних інструментів збігалися з вашим shell:

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

`voicecall smoke` є пробним запуском, якщо також не вказано `--yes`. Використовуйте `--yes` лише
коли ви навмисно хочете здійснити реальний сповіщувальний виклик. Для Twilio, Telnyx і
Plivo успішна перевірка готовності потребує публічної Webhook-URL-адреси; fallback-варіанти
лише для локального loopback або приватної мережі відхиляються за задумом.

## Live: перевірка можливостей Android-вузла

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку зараз рекламує** підключений Android-вузол, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює/запускає/спарює застосунок).
  - Перевірка `node.invoke` у Gateway для кожної команди вибраного Android-вузла.
- Потрібне попереднє налаштування:
  - Android-застосунок уже підключений і спарений із Gateway.
  - Застосунок утримується на передньому плані.
  - Дозволи/згода на захоплення надані для можливостей, які ви очікуєте успішно пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android-застосунок](/uk/platforms/android)

## Live: smoke моделей (ключі профілю)

Live-тести поділені на два шари, щоб ми могли ізолювати збої:

- "Пряма модель" показує, чи провайдер/модель узагалі може відповісти з наданим ключем.
- "Gateway smoke" показує, чи повний конвеєр gateway+агент працює для цієї моделі (сесії, історія, інструменти, політика пісочниці тощо).

### Шар 1: пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике завершення для кожної моделі (і цільові регресії, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб фактично запустити цей набір; інакше він пропускається, щоб `pnpm test:live` лишався зосередженим на gateway smoke
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern-allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` є псевдонімом для modern-allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Modern/all-перевірки за замовчуванням мають curated high-signal cap; встановіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого обмеження.
  - Вичерпні перевірки використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` для тайм-ауту всього direct-model-тесту. За замовчуванням: 60 хвилин.
  - Direct-model-зонди за замовчуванням запускаються з 20-рівневим паралелізмом; встановіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`, щоб перевизначити.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і fallback-и з env
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати лише **сховище профілів**
- Навіщо це існує:
  - Відокремлює "API провайдера зламаний / ключ недійсний" від "gateway-конвеєр агента зламаний"
  - Містить невеликі ізольовані регресії (приклад: OpenAI Responses/Codex Responses reasoning replay + tool-call-потоки)

### Шар 2: Gateway + smoke dev-агента (що фактично робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти внутрішньопроцесний gateway
  - Створити/пропатчити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітерувати моделі з ключами та перевірити:
    - "змістовну" відповідь (без інструментів)
    - реальний виклик інструмента працює (read-зонд)
    - необов’язкові додаткові зонди інструментів (exec+read-зонд)
    - регресійні шляхи OpenAI (лише tool-call → подальший запит) продовжують працювати
- Деталі зондів (щоб ви могли швидко пояснювати збої):
  - `read`-зонд: тест записує nonce-файл у робочій області та просить агента `read` його й повторити nonce у відповіді.
  - `exec+read`-зонд: тест просить агента через `exec` записати nonce у тимчасовий файл, а потім через `read` прочитати його назад.
  - image-зонд: тест прикріплює згенерований PNG (кіт + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: modern-allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` є псевдонімом для modern-allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити
  - Modern/all gateway-перевірки за замовчуванням мають curated high-signal cap; встановіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого обмеження.
- Як вибрати провайдерів (уникнути "усього OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Зонди інструментів і зображень у цьому live-тесті завжди ввімкнені:
  - `read`-зонд + `exec+read`-зонд (навантаження на інструменти)
  - image-зонд запускається, коли модель рекламує підтримку введення зображень
  - Потік (високий рівень):
    - Тест генерує крихітний PNG із "CAT" + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент пересилає мультимодальне повідомлення користувача до моделі
    - Перевірка: відповідь містить `cat` + код (толерантність OCR: незначні помилки дозволені)

<Tip>
Щоб побачити, що можна тестувати на вашій машині (і точні `provider/model` id), виконайте:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke CLI-бекенду (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + агента за допомогою локального CLI-бекенду, не торкаючись вашої конфігурації за замовчуванням.
- Специфічні для бекенду smoke-значення за замовчуванням живуть у визначенні `cli-backend.ts` Plugin-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значення за замовчуванням:
  - Провайдер/модель за замовчуванням: `claude-cli/claude-sonnet-4-6`
  - Поведінка команди/аргументів/зображень береться з метаданих Plugin CLI-бекенду власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи інжектяться в prompt). Docker-рецепти за замовчуванням вимикають це, якщо явно не запитано.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як CLI-аргументи замість ін’єкції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати способом передавання image-аргументів, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити resume-потік.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути перевірку безперервності Claude Sonnet -> Opus у тій самій сесії, коли вибрана модель підтримує ціль перемикання. Docker-рецепти за замовчуванням вимикають це для сукупної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути MCP/tool local loopback-зонд. Docker-рецепти за замовчуванням вимикають це, якщо явно не запитано.

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
збережений `transport: "streamable-http"` сервер нормалізується до HTTP MCP-форми Gemini
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

Примітки:

- Docker-ранер розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke CLI-бекенду всередині Docker-образу репозиторію як non-root користувач `node`.
- Він визначає CLI smoke-метадані з Plugin-власника, а потім встановлює відповідний Linux CLI-пакет (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс за `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує портативного Claude Code subscription OAuth через `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім запускає два ходи CLI-бекенду Gateway без збереження env-змінних Anthropic API-key. Ця subscription-гілка за замовчуванням вимикає Claude MCP/tool і image-зонди, оскільки Claude зараз маршрутизує використання сторонніх застосунків через оплату extra-usage замість звичайних лімітів subscription-плану.
- Live smoke CLI-бекенду тепер виконує той самий end-to-end-потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик MCP-інструмента `cron`, перевірений через Gateway CLI.
- Smoke за замовчуванням для Claude також патчить сесію з Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: досяжність APNs HTTP/2-проксі

- Тест: `src/infra/push-apns-http2.live.test.ts`
- Мета: тунелювати через локальний HTTP CONNECT-проксі до sandbox APNs endpoint Apple, надіслати APNs HTTP/2-запит валідації та перевірити, що реальна відповідь Apple `403 InvalidProviderToken` повертається через шлях проксі.
- Увімкнення:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Необов’язковий тайм-аут:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язування розмови ACP з живим агентом ACP:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє до транскрипту прив’язаного сеансу ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - агенти ACP у Docker: `claude,codex,gemini`
  - агент ACP для прямого `pnpm test:live ...`: `claude`
  - синтетичний канал: контекст розмови у стилі DM Slack
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
  - Ця лінія використовує поверхню Gateway `chat.send` із синтетичними полями вихідного маршруту лише для адміністраторів, щоб тести могли додавати контекст каналу повідомлень, не вдаючи зовнішню доставку.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів плагіна `acpx` для вибраного агента обв’язки ACP.
  - Створення MCP Cron прив’язаного сеансу за замовчуванням виконується за принципом найкращого зусилля, оскільки зовнішні обв’язки ACP можуть скасовувати виклики MCP після проходження доказу прив’язування/зображення; задайте `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, щоб зробити цей післяприв’язувальний зонд Cron суворим.

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

- Запускач Docker розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він послідовно запускає димовий тест прив’язування ACP проти сукупних живих агентів CLI: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він підвантажує `~/.profile`, розміщує відповідні матеріали автентифікації CLI у контейнері, а потім встановлює потрібний живий CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` або `opencode-ai`), якщо його бракує. Сам бекенд ACP — це вбудований пакет `acpx/runtime` з офіційного плагіна `acpx`.
- Варіант Docker для Droid розміщує `~/.factory` для налаштувань, передає `FACTORY_API_KEY` і вимагає цей ключ API, оскільки локальна OAuth/зв’язка ключів Factory не переноситься в контейнер. Він використовує вбудований запис реєстру ACPX `droid exec --output-format acp`.
- Варіант Docker для OpenCode — це сувора регресійна лінія для одного агента. Він записує тимчасову типову модель `OPENCODE_CONFIG_CONTENT` з `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (типово `opencode/kimi-k2.6`) після підвантаження `~/.profile`, а `pnpm test:docker:live-acp-bind:opencode` вимагає транскрипт прив’язаного асистента замість прийняття загального пропуску після прив’язування.
- Прямі виклики CLI `acpx` — лише ручний/обхідний шлях для порівняння поведінки поза Gateway. Димовий тест прив’язування ACP у Docker перевіряє вбудований бекенд рантайму `acpx` OpenClaw.

## Live: димовий тест обв’язки сервера застосунку Codex

- Мета: перевірити обв’язку Codex, що належить плагіну, через звичайний метод gateway
  `agent`:
  - завантажити вбудований плагін `codex`
  - вибрати `openai/gpt-5.5`, який за замовчуванням маршрутизує ходи агента OpenAI через Codex
  - надіслати перший хід агента gateway до `openai/gpt-5.5` із вибраною обв’язкою Codex
  - надіслати другий хід у той самий сеанс OpenClaw і перевірити, що потік сервера застосунку може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях команди gateway
  - за бажанням виконати два переглянуті Guardian зонди оболонки з підвищенням прав: одну нешкідливу команду, яку слід схвалити, і одне фальшиве завантаження секрету, яке слід відхилити, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.5`
- Необов’язковий зонд зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язковий зонд MCP/інструментів: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язковий зонд Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Димовий тест примусово задає для постачальника/моделі `agentRuntime.id: "codex"`, щоб зламана обв’язка Codex не могла пройти, тихо повернувшись до PI.
- Автентифікація: автентифікація сервера застосунку Codex з локального входу підписки Codex. Димові тести Docker також можуть надавати `OPENAI_API_KEY` для зондiв не Codex, коли це застосовно, а також необов’язково скопійовані `~/.codex/auth.json` і `~/.codex/config.toml`.

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

- Запускач Docker розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він підвантажує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли автентифікації CLI Codex, коли вони наявні, встановлює `@openai/codex` у доступний для запису змонтований префікс npm, розміщує дерево вихідного коду, а потім запускає лише живий тест обв’язки Codex.
- Docker за замовчуванням вмикає зонди зображення, MCP/інструментів і Guardian. Задайте `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` чи `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий налагоджувальний запуск.
- Docker використовує ту саму явну конфігурацію рантайму Codex, тому застарілі псевдоніми або повернення до PI не можуть приховати регресію обв’язки Codex.

### Рекомендовані живі рецепти

Вузькі, явні списки дозволеного найшвидші та найменш схильні до нестабільності:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, димовий тест gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів у кількох постачальників:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (ключ API Gemini + Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Димовий тест адаптивного мислення Google:
  - Якщо локальні ключі зберігаються в профілі оболонки: `source ~/.profile`
  - Динамічне типове значення Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамічний бюджет Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує Gemini API (ключ API).
- `google-antigravity/...` використовує міст Antigravity OAuth (агентська кінцева точка у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний CLI Gemini на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (ключ API / автентифікація профілю); саме це більшість користувачів мають на увазі під "Gemini".
  - CLI: OpenClaw викликає локальний бінарний файл `gemini` через оболонку; він має власну автентифікацію і може поводитися інакше (потокова передача/підтримка інструментів/розбіжність версій).

## Live: матриця моделей (що ми покриваємо)

Немає фіксованого "списку моделей CI" (live вмикається явно), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний димовий набір (виклик інструментів + зображення)

Це запуск "поширених моделей", який ми очікуємо підтримувати працездатним:

- OpenAI (не Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Запустіть димовий тест gateway з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (читання + необов’язкове виконання)

Виберіть принаймні одну на кожну родину постачальників:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4.3` (або остання доступна)
- Mistral: `mistral/`… (виберіть одну модель із можливістю "tools", яку ви ввімкнули)
- Cerebras: `cerebras/`… (якщо маєте доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI з підтримкою бачення тощо), щоб перевірити зонд зображення.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів+зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше постачальників, яких можна включити до живої матриці (якщо маєте облікові дані/конфігурацію):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (користувацькі кінцеві точки): `minimax` (хмара/API), а також будь-який сумісний з OpenAI/Anthropic проксі (LM Studio, vLLM, LiteLLM тощо)

<Tip>
Не хардкодьте "усі моделі" в документації. Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині, плюс доступні ключі.
</Tip>

## Облікові дані (ніколи не комітьте)

Живі тести виявляють облікові дані так само, як це робить CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест повідомляє "no creds", налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації на рівні агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає "profile keys" у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Застарілий каталог стану: `~/.openclaw/credentials/` (копіюється в підготовлений live-домашній каталог, коли присутній, але не є основним сховищем profile-key)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` на рівні агента, застарілий `credentials/` і підтримувані каталоги автентифікації зовнішніх CLI у тимчасовий тестовий домашній каталог; підготовлені live-домашні каталоги пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` вилучаються, щоб проби не торкалися вашого реального робочого простору на хості.

Якщо ви хочете покладатися на ключі з env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-запускачі нижче (вони можуть змонтувати `~/.profile` у контейнер).

## Deepgram live (транскрипція аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов'язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо `plugins.entries.comfy.config.<capability>` не налаштовано
  - Корисно після змін у надсиланні comfy workflow, опитуванні, завантаженнях або реєстрації plugin

## Image generation live

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Обв'язка: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований provider plugin генерації зображень
  - Завантажує відсутні env vars провайдера з вашої login shell (`~/.profile`) перед пробою
  - За замовчуванням використовує live/env API keys перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає кожного налаштованого провайдера через спільний runtime генерації зображень:
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
- Необов'язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Необов'язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати env-only перевизначення

Для поставленого CLI-шляху додайте `infer` smoke після успішного проходження provider/runtime live
test:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це охоплює розбір аргументів CLI, розв'язання config/default-agent, активацію вбудованого
plugin, спільний runtime генерації зображень і live-запит до провайдера.
Очікується, що залежності Plugin будуть наявні до завантаження runtime.

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Обв'язка: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях вбудованого provider генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env vars провайдера з вашої login shell (`~/.profile`) перед пробою
  - За замовчуванням використовує live/env API keys перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` із введенням лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне охоплення shared-lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не цей спільний sweep
- Необов'язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов'язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати env-only перевизначення

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Обв'язка: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях вбудованого provider генерації відео
  - За замовчуванням використовує release-safe smoke-шлях: провайдери не FAL, один запит text-to-video на провайдера, one-second lobster prompt і обмеження операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, бо затримка provider-side queue може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env vars провайдера з вашої login shell (`~/.profile`) перед пробою
  - За замовчуванням використовує live/env API keys перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими трансформації, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled`, а вибраний провайдер/модель приймає buffer-backed локальне зображення у спільному sweep
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled`, а вибраний провайдер/модель приймає buffer-backed локальне відео у спільному sweep
  - Поточні оголошені, але пропущені провайдери `imageToVideo` у спільному sweep:
    - `vydra`, бо вбудований `veo3` є text-only, а вбудований `kling` потребує віддаленого URL зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає text-to-video для `veo3` плюс lane `kling`, який за замовчуванням використовує fixture з віддаленим URL зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у спільному sweep:
    - `alibaba`, `qwen`, `xai`, бо ці шляхи наразі потребують віддалених reference URLs `http(s)` / MP4
    - `google`, бо поточна спільна lane Gemini/Veo використовує локальне buffer-backed введення, а цей шлях не приймається у спільному sweep
    - `openai`, бо поточна спільна lane не має гарантій доступу до org-specific video inpaint/remix
- Необов'язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера в default sweep, зокрема FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження кожної операції провайдера для агресивного smoke-запуску
- Необов'язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати env-only перевизначення

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори image, music і video через одну repo-native точку входу
  - Автоматично завантажує відсутні env vars провайдера з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і quiet-mode лишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов'язане

- [Тестування](/uk/help/testing) - unit, integration, QA та Docker-набори
