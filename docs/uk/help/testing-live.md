---
read_when:
    - Запуск smoke-тестів live-матриці моделей / бекенду CLI / ACP / медіапровайдерів
    - Налагодження визначення облікових даних live-тестів
    - Додавання нового live-тесту, специфічного для провайдера
sidebarTitle: Live tests
summary: 'Live (мережеві) тести: матриця моделей, бекенди CLI, ACP, медіапровайдери, облікові дані'
title: 'Тестування: live-набори тестів'
x-i18n:
    generated_at: "2026-04-28T00:34:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db18fe515b823a73e1fccf06c9de1899000700eba9d4972506d35d25b9c4a2f
    source_path: help/testing-live.md
    workflow: 15
---

Для швидкого старту, раннерів QA, наборів unit/integration тестів і Docker-процесів див.
[Тестування](/uk/help/testing). Ця сторінка охоплює **live** (мережеві) набори тестів:
матрицю моделей, бекенди CLI, ACP і live-тести медіапровайдерів, а також
обробку облікових даних.

## Live: команди локального smoke-тесту профілю

Виконайте `source ~/.profile` перед разовими live-перевірками, щоб ключі
провайдерів і шляхи до локальних інструментів відповідали вашій оболонці:

```bash
source ~/.profile
```

Безпечний медіа-smoke-тест:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безпечний smoke-тест готовності голосового виклику:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` — це dry run, якщо також не вказано `--yes`. Використовуйте `--yes`, лише
коли ви свідомо хочете здійснити реальний сповіщувальний дзвінок. Для Twilio, Telnyx і
Plivo успішна перевірка готовності потребує публічної URL-адреси Webhook; лише локальні
резервні варіанти loopback/private навмисно відхиляються.

## Live: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку наразі оголошує** підключений Android Node, і перевірити поведінку контракту команд.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір тестів не встановлює, не запускає й не спаровує застосунок).
  - Перевірка `node.invoke` у Gateway для вибраного Android Node покомандно.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключено й спаровано з Gateway.
  - Застосунок утримується на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте успішно перевірити.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості про налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke-тест моделі (ключі профілю)

Live-тести поділено на два рівні, щоб можна було ізолювати збої:

- «Пряма модель» показує, чи може провайдер/модель взагалі відповісти з наданим ключем.
- «Smoke-тест Gateway» показує, чи працює для цієї моделі весь конвеєр gateway+agent (сеанси, історія, інструменти, політика sandbox тощо).

### Рівень 1: Пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і цільові регресійні перевірки за потреби)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб фактично запустити цей набір тестів; інакше його буде пропущено, щоб `pnpm test:live` залишався зосередженим на smoke-тесті gateway
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Для modern/all-перевірок за замовчуванням використовується підібране обмеження з високим сигналом; встановіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
  - Для вичерпних перевірок використовується `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як тайм-аут для всього тесту прямої моделі. За замовчуванням: 60 хвилин.
  - Перевірки прямої моделі за замовчуванням виконуються з паралелізмом 20; для перевизначення встановіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні варіанти з env
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламаний / ключ недійсний» від «конвеєр gateway agent зламаний»
  - Містить невеликі ізольовані регресії (приклад: відтворення міркувань OpenAI Responses/Codex Responses + процеси tool-call)

### Рівень 2: Smoke-тест Gateway + dev agent (що фактично робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Запустити вбудований gateway
  - Створити/виправити сеанс `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Перебрати моделі з ключами й перевірити:
    - «змістовну» відповідь (без інструментів)
    - що працює реальний виклик інструмента (перевірка read)
    - необов’язкові додаткові перевірки інструментів (перевірка exec+read)
    - що шляхи регресії OpenAI (лише tool-call → follow-up) і далі працюють
- Деталі перевірок (щоб ви могли швидко пояснити збої):
  - перевірка `read`: тест записує nonce-файл у workspace і просить agent виконати `read` для нього та повернути nonce.
  - перевірка `exec+read`: тест просить agent через `exec` записати nonce у тимчасовий файл, а потім через `read` прочитати його назад.
  - перевірка зображення: тест прикріплює згенерований PNG (cat + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому) для звуження
  - Для modern/all gateway-перевірок за замовчуванням використовується підібране обмеження з високим сигналом; встановіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
- Як вибрати провайдерів (уникнути «все з OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Перевірки інструментів і зображень у цьому live-тесті завжди ввімкнені:
  - перевірка `read` + перевірка `exec+read` (навантаження на інструменти)
  - перевірка зображення виконується, коли модель оголошує підтримку введення зображень
  - Процес (на високому рівні):
    - Тест генерує крихітний PNG з «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований agent пересилає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допускається OCR-толерантність: незначні помилки дозволені)

<Tip>
Щоб побачити, що можна тестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke-тест бекенду CLI (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent за допомогою локального бекенду CLI, не змінюючи вашу типову конфігурацію.
- Типові значення smoke-тесту для конкретного бекенду містяться у визначенні `cli-backend.ts` розширення-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значення за замовчуванням:
  - Провайдер/модель за замовчуванням: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image походить із метаданих Plugin CLI-бекенду-власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи впроваджуються в prompt). У рецептах Docker це за замовчуванням вимкнено, якщо явно не запитано.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість впровадження в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати способом передавання аргументів зображення, коли задано `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити процес відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути перевірку безперервності в межах одного сеансу Claude Sonnet -> Opus, коли вибрана модель підтримує ціль перемикання. У рецептах Docker це за замовчуванням вимкнено для загальної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути перевірку MCP/tool loopback. У рецептах Docker це за замовчуванням вимкнено, якщо явно не запитано.

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Недорогий smoke-тест конфігурації Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Це не просить Gemini згенерувати відповідь. Воно записує ті самі системні
налаштування, які OpenClaw надає Gemini, а потім запускає `gemini --debug mcp list`, щоб довести, що
збережений сервер `transport: "streamable-http"` нормалізується до HTTP MCP-форми Gemini і
може підключатися до локального streamable-HTTP MCP-сервера.

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

- Docker-раннер розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke-тест CLI-бекенду всередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані smoke-тесту CLI з розширення-власника, а потім встановлює відповідний Linux-пакет CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс за адресою `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносної OAuth-підписки Claude Code через або `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить роботу прямого `claude -p` у Docker, а потім виконує два ходи Gateway CLI-бекенду без збереження env-змінних API-ключа Anthropic. У цьому режимі підписки за замовчуванням вимкнено перевірки Claude MCP/tool і зображень, оскільки Claude наразі маршрутизує використання сторонніх застосунків через тарифікацію додаткового використання замість звичайних лімітів плану підписки.
- Live smoke-тест CLI-бекенду тепер перевіряє той самий наскрізний процес для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Типовий smoke-тест Claude також виправляє сеанс із Sonnet на Opus і перевіряє, що відновлений сеанс усе ще пам’ятає попередню нотатку.

## Live: smoke-тест прив’язки ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний процес conversation-bind ACP із live ACP-agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне follow-up у тій самій розмові
  - перевірити, що follow-up потрапляє до transcript прив’язаного сеансу ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Значення за замовчуванням:
  - ACP-agents у Docker: `claude,codex,gemini`
  - ACP-agent для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - Бекенд ACP: `acpx`
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
  - Цей lane використовує поверхню gateway `chat.send` з admin-only синтетичними полями originating-route, щоб тести могли додавати контекст каналу повідомлень без імітації зовнішньої доставки.
  - Якщо `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр agent з Plugin `acpx` для вибраного harness-agent ACP.
  - Створення bound-session cron MCP за замовчуванням є best-effort, оскільки зовнішні harness ACP можуть скасовувати виклики MCP після проходження bind/image-перевірки; встановіть `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, щоб зробити цю післяприв’язочну перевірку cron суворою.

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

- Docker-раннер розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він послідовно запускає ACP bind smoke-тест для сукупності live CLI-agents: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він виконує `source ~/.profile`, підготовлює відповідні auth-матеріали CLI у контейнері, а потім встановлює запитаний live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` або `opencode-ai`), якщо його бракує. Сам бекенд ACP — це пакет вбудованого runtime `acpx/runtime`, що постачається разом із Plugin `acpx`.
- Варіант Docker для Droid готує `~/.factory` для налаштувань, пересилає `FACTORY_API_KEY` і вимагає цей API-ключ, оскільки локальна Factory OAuth/keyring-auth не є переносною в контейнер. Він використовує вбудований запис реєстру ACPX `droid exec --output-format acp`.
- Варіант Docker для OpenCode — це суворий regression-lane для одного agent. Після виконання `source ~/.profile` він записує тимчасову типову модель `OPENCODE_CONFIG_CONTENT` із `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (типово `opencode/kimi-k2.6`), а `pnpm test:docker:live-acp-bind:opencode` вимагає transcript прив’язаного assistant замість прийняття загального post-bind skip.
- Прямі виклики CLI `acpx` — це лише ручний/обхідний шлях для порівняння поведінки поза Gateway. Docker ACP bind smoke-тест перевіряє вбудований у OpenClaw бекенд runtime `acpx`.

## Live: smoke-тест harness app-server Codex

- Мета: перевірити harness Codex, яким володіє plugin, через звичайний
  метод gateway `agent`:
  - завантажити вбудований Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `openai/gpt-5.2` із примусово вибраним harness Codex
  - надіслати другий хід у той самий сеанс OpenClaw і перевірити, що thread app-server
    може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях
    команди gateway
  - за потреби виконати дві escalated shell-перевірки, переглянуті Guardian: одну нешкідливу
    команду, яку слід схвалити, і одну фальшиву передачу секрету,
    яку слід відхилити, щоб agent перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.2`
- Необов’язкова перевірка зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова перевірка MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова перевірка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke-тест встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний harness Codex
  не міг пройти, непомітно переключившись на Pi.
- Auth: auth app-server Codex із локального логіну підписки Codex. Docker-
  smoke-тести також можуть надавати `OPENAI_API_KEY` для перевірок, не пов’язаних із Codex, де це доречно,
  а також необов’язкові скопійовані `~/.codex/auth.json` і `~/.codex/config.toml`.

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
- Він виконує `source` змонтованого `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  auth CLI Codex, якщо вони є, встановлює `@openai/codex` у записуваний змонтований npm-
  префікс, готує дерево вихідного коду, а потім запускає лише live-тест harness Codex.
- Docker за замовчуванням вмикає перевірки зображення, MCP/tool і Guardian. Встановіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`,
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли вам потрібен вужчий налагоджувальний
  запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, як і в конфігурації live-
  тесту, щоб застарілі псевдоніми або fallback до PI не могли приховати регресію
  harness Codex.

### Рекомендовані live-рецепти

Вузькі, явні allowlist — найшвидші й найменш схильні до збоїв:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke-тест:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів через кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke-тест adaptive thinking Google:
  - Якщо локальні ключі містяться в профілі shell: `source ~/.profile`
  - Gemini 3 dynamic default: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст Antigravity OAuth (кінцева точка agent у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема auth + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (API-ключ / auth профілю); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw виконує локальний двійковий файл `gemini`; він має власну auth і може поводитися інакше (streaming/tool support/version skew).

## Live: матриця моделей (що ми охоплюємо)

Фіксованого «списку моделей CI» немає (live вмикається за бажанням), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний smoke-набір (виклик інструментів + зображення)

Це запуск «поширених моделей», який, як ми очікуємо, має залишатися працездатним:

- OpenAI (не Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старих моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Запустіть gateway smoke-тест з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Виберіть принаймні одну модель із кожної родини провайдерів:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яка у вас увімкнена)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI vision-capable variants тощо), щоб перевірити image probe.

### Агрегатори / альтернативні gateway

Якщо у вас є ввімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (auth через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (custom endpoints): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний proxy (LM Studio, vLLM, LiteLLM тощо)

<Tip>
Не хардкодьте "all models" у документації. Авторитетний список — це все, що `discoverModels(...)` повертає на вашій машині, плюс усі доступні ключі.
</Tip>

## Облікові дані (ніколи не комітьте)

Live-тести виявляють облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест повідомляє «немає облікових даних», налагоджуйте це так само, як ви налагоджували б `openclaw models list` / вибір моделі.

- Профілі auth для кожного agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «ключі профілю» в live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Застарілий каталог стану: `~/.openclaw/credentials/` (копіюється в підготовлений live-home за наявності, але це не основне сховище ключів профілю)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного agent, застарілий `credentials/` і підтримувані зовнішні каталоги auth CLI до тимчасового test-home; підготовлені live-home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб перевірки не торкалися вашого реального host-workspace.

Якщо ви хочете покладатися на ключі env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-раннери нижче (вони можуть монтувати `~/.profile` у контейнер).

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
  - Пропускає кожну можливість, якщо не налаштовано `plugins.entries.comfy.config.<capability>`
  - Корисно після змін у надсиланні workflow comfy, опитуванні, завантаженнях або реєстрації Plugin

## Image generation live

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований Plugin-провайдер генерації зображень
  - Завантажує відсутні env-змінні провайдера з вашої оболонки входу (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної auth/профілю/моделі
  - Запускає кожен налаштований провайдер через спільний runtime генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, коли провайдер оголошує підтримку редагування
- Поточні вбудовані провайдери, які покриваються:
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
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати перевизначення лише через env

Для шляху shipped CLI додайте smoke-тест `infer` після успішного проходження live-
тесту провайдера/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це покриває розбір аргументів CLI, визначення config/default-agent, активацію
вбудованих Plugin, repair залежностей runtime вбудованих компонентів на вимогу, спільний
runtime генерації зображень і live-запит до провайдера.

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env-змінні провайдера з вашої оболонки входу (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної auth/профілю/моделі
  - Запускає обидва оголошені режими runtime, коли вони доступні:
    - `generate` із введенням лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільного lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, а не ця спільна перевірка
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати перевизначення лише через env

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації відео
  - За замовчуванням використовує безпечний для релізу шлях smoke-тесту: провайдери без FAL, один запит text-to-video на провайдера, односекундний prompt про лобстера та обмеження операції для кожного провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці провайдера може домінувати над часом релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб явно його запустити
  - Завантажує env-змінні провайдера з вашої оболонки входу (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної auth/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Встановіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими перетворення, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальний вхід зображення з backing buffer у спільній перевірці
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальний вхід відео з backing buffer у спільній перевірці
  - Поточні провайдери `imageToVideo`, оголошені, але пропущені в спільній перевірці:
    - `vydra`, оскільки вбудований `veo3` підтримує лише text, а вбудований `kling` вимагає віддалену URL-адресу зображення
  - Покриття Vydra для конкретного провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс lane `kling`, який за замовчуванням використовує fixture із віддаленою URL-адресою зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні провайдери `videoToVideo`, оголошені, але пропущені в спільній перевірці:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі вимагають віддалені довідкові URL `http(s)` / MP4
    - `google`, оскільки поточний спільний lane Gemini/Veo використовує локальний вхід із backing buffer, і цей шлях не приймається у спільній перевірці
    - `openai`, оскільки поточний спільний lane не гарантує доступ до org-specific video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до типової перевірки, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження операції кожного провайдера для агресивного smoke-запуску
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати перевизначення лише через env

## Harness для media live

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики та відео через одну нативну для репозиторію точку входу
  - Автоматично завантажує відсутні env-змінні провайдера з `~/.profile`
  - Автоматично звужує кожен набір до провайдерів, які зараз мають придатну auth, за замовчуванням
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — unit, integration, QA і Docker-набори тестів
