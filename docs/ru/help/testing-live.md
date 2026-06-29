---
read_when:
    - Запуск реальной матрицы моделей / бэкенда CLI / ACP / дымовых тестов media-provider
    - Отладка разрешения учетных данных live-тестов
    - Добавление нового live-теста для конкретного провайдера
sidebarTitle: Live tests
summary: 'Live-тесты (затрагивающие сеть): матрица моделей, бэкенды CLI, ACP, поставщики медиа, учетные данные'
title: 'Тестирование: live-наборы'
x-i18n:
    generated_at: "2026-06-28T23:03:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 087ec52b395131889d4ae113f304d71199c58dc9f61a1a5e1e511ae4c5b48c0b
    source_path: help/testing-live.md
    workflow: 16
---

Для быстрого старта, QA-раннеров, наборов unit/integration-тестов и Docker-потоков см.
[Тестирование](/ru/help/testing). Эта страница описывает **live**-наборы тестов
(затрагивающие сеть): матрицу моделей, CLI-бэкенды, ACP и live-тесты
медиапровайдеров, а также работу с учетными данными.

## Live: локальные smoke-команды

Перед разовыми live-проверками экспортируйте нужный ключ провайдера в окружение
процесса.

Безопасный media-smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безопасный smoke готовности голосового вызова:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` выполняет пробный прогон, если также не указан `--yes`.
Используйте `--yes` только когда вы намеренно хотите выполнить реальный
уведомительный звонок. Для Twilio, Telnyx и Plivo успешная проверка готовности
требует публичный URL Webhook; локальные loopback/приватные fallback-варианты
отклоняются намеренно.

## Live: проверка возможностей Android-узла

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Цель: вызвать **каждую команду, объявляемую сейчас** подключенным Android-узлом, и проверить поведение контракта команды.
- Область:
  - Предварительная/ручная настройка (набор тестов не устанавливает, не запускает и не сопрягает приложение).
  - Проверка gateway `node.invoke` команда за командой для выбранного Android-узла.
- Обязательная предварительная настройка:
  - Android-приложение уже подключено и сопряжено с Gateway.
  - Приложение удерживается на переднем плане.
  - Разрешения/согласие на захват предоставлены для возможностей, которые должны проходить.
- Необязательные переопределения цели:
  - `OPENCLAW_ANDROID_NODE_ID` или `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Полные сведения о настройке Android: [Android-приложение](/ru/platforms/android)

## Live: model smoke (ключи профилей)

Live-тесты разделены на два уровня, чтобы мы могли изолировать сбои:

- «Прямая модель» показывает, что провайдер/модель вообще может ответить с данным ключом.
- «Gateway smoke» показывает, что для этой модели работает весь конвейер gateway+agent (сессии, история, инструменты, sandbox-политика и т. д.).

### Уровень 1: прямое completion модели (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Цель:
  - Перечислить обнаруженные модели
  - Использовать `getApiKeyForModel`, чтобы выбрать модели, для которых у вас есть учетные данные
  - Запустить небольшое completion для каждой модели (и точечные регрессии там, где нужно)
- Как включить:
  - `pnpm test:live` (или `OPENCLAW_LIVE_TEST=1`, если вызываете Vitest напрямую)
- Установите `OPENCLAW_LIVE_MODELS=modern`, `small` или `all` (алиас для modern), чтобы действительно запустить этот набор; иначе он пропускается, чтобы `pnpm test:live` оставался сосредоточен на gateway smoke
- Как выбрать модели:
  - `OPENCLAW_LIVE_MODELS=modern`, чтобы запустить современный allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small`, чтобы запустить ограниченный allowlist малых моделей (локально совместимые маршруты Qwen 8B/9B, Ollama Gemma, OpenRouter Qwen/GLM и Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` — алиас для современного allowlist
  - или `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist через запятую)
  - Локальные запуски малых моделей Ollama по умолчанию используют `http://127.0.0.1:11434`; задавайте `OPENCLAW_LIVE_OLLAMA_BASE_URL` только для LAN, пользовательских endpoint-ов или Ollama Cloud.
  - Проверки modern/all и small по умолчанию используют свои курируемые лимиты; задайте `OPENCLAW_LIVE_MAX_MODELS=0` для исчерпывающей проверки выбранного профиля или положительное число для меньшего лимита.
  - Исчерпывающие проверки используют `OPENCLAW_LIVE_TEST_TIMEOUT_MS` как timeout всего прямого теста моделей. По умолчанию: 60 минут.
  - Пробы прямых моделей по умолчанию выполняются с параллелизмом 20; задайте `OPENCLAW_LIVE_MODEL_CONCURRENCY`, чтобы переопределить.
- Как выбрать провайдеров:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через запятую)
- Откуда берутся ключи:
  - По умолчанию: хранилище профилей и fallback-значения окружения
  - Задайте `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, чтобы принудительно использовать только **хранилище профилей**
- Зачем это существует:
  - Отделяет «API провайдера сломан / ключ недействителен» от «конвейер gateway agent сломан»
  - Содержит небольшие изолированные регрессии (пример: reasoning replay OpenAI Responses/Codex Responses + потоки tool-call)

### Уровень 2: Gateway + smoke dev-агента (что на самом деле делает "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Цель:
  - Запустить внутрипроцессный Gateway
  - Создать/пропатчить сессию `agent:dev:*` (переопределение модели для каждого запуска)
  - Перебрать модели с ключами и проверить:
    - «содержательный» ответ (без инструментов)
    - реальный вызов инструмента работает (проба чтения)
    - необязательные дополнительные пробы инструментов (проба exec+read)
    - регрессионные пути OpenAI (только tool-call → follow-up) продолжают работать
- Детали проб (чтобы быстро объяснять сбои):
  - Проба `read`: тест записывает nonce-файл в workspace и просит агента `read` его и вернуть nonce в ответе.
  - Проба `exec+read`: тест просит агента через `exec` записать nonce во временный файл, затем прочитать его через `read`.
  - Проба изображения: тест прикрепляет сгенерированный PNG (cat + рандомизированный код) и ожидает, что модель вернет `cat <CODE>`.
  - Ссылка на реализацию: `src/gateway/gateway-models.profiles.live.test.ts` и `test/helpers/live-image-probe.ts`.
- Как включить:
  - `pnpm test:live` (или `OPENCLAW_LIVE_TEST=1`, если вызываете Vitest напрямую)
- Как выбрать модели:
  - По умолчанию: современный allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small`, чтобы прогнать тот же ограниченный allowlist малых моделей через полный конвейер gateway+agent
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — алиас для современного allowlist
  - Или задайте `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (или список через запятую), чтобы сузить выбор
  - Проверки gateway modern/all и small по умолчанию используют свои курируемые лимиты; задайте `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для исчерпывающей выбранной проверки или положительное число для меньшего лимита.
- Как выбрать провайдеров (избежать «весь OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через запятую)
- Пробы инструментов и изображений всегда включены в этом live-тесте:
  - Проба `read` + проба `exec+read` (нагрузка на инструменты)
  - Проба изображения запускается, когда модель объявляет поддержку входных изображений
  - Поток (верхнеуровнево):
    - Тест генерирует крошечный PNG с "CAT" + случайным кодом (`test/helpers/live-image-probe.ts`)
    - Отправляет его через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway разбирает вложения в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Встроенный агент пересылает мультимодальное пользовательское сообщение модели
    - Проверка: ответ содержит `cat` + код (допуск OCR: разрешены небольшие ошибки)

<Tip>
Чтобы увидеть, что можно тестировать на вашей машине (и точные id `provider/model`), выполните:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke CLI-бэкенда (Claude, Gemini или другие локальные CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Цель: проверить конвейер Gateway + agent с использованием локального CLI-бэкенда, не затрагивая вашу конфигурацию по умолчанию.
- Специфичные для бэкенда значения smoke по умолчанию находятся в определении `cli-backend.ts` владеющего Plugin.
- Включение:
  - `pnpm test:live` (или `OPENCLAW_LIVE_TEST=1`, если вызываете Vitest напрямую)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значения по умолчанию:
  - Провайдер/модель по умолчанию: `claude-cli/claude-sonnet-4-6`
  - Поведение команды/аргументов/изображений берется из метаданных владеющего CLI backend Plugin.
- Переопределения (необязательно):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, чтобы отправить реальное вложение-изображение (пути внедряются в prompt). Docker-рецепты по умолчанию отключают это, если явно не запрошено.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, чтобы передавать пути к файлам изображений как CLI-аргументы вместо внедрения в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (или `"list"`), чтобы управлять тем, как передаются аргументы изображений при заданном `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, чтобы отправить второй ход и проверить поток resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, чтобы включить пробу непрерывности Claude Sonnet -> Opus в той же сессии, когда выбранная модель поддерживает целевое переключение. Docker-рецепты по умолчанию отключают это для общей надежности.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, чтобы включить пробу loopback MCP/инструментов. Docker-рецепты по умолчанию отключают это, если явно не запрошено.

Пример:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Дешевый smoke конфигурации Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Это не просит Gemini генерировать ответ. Он записывает те же системные
настройки, которые OpenClaw передает Gemini, затем выполняет `gemini --debug mcp list`, чтобы доказать, что сохраненный сервер
`transport: "streamable-http"` нормализуется в HTTP MCP-форму Gemini
и может подключиться к локальному streamable-HTTP MCP-серверу.

Docker-рецепт:

```bash
pnpm test:docker:live-cli-backend
```

Docker-рецепты для отдельных провайдеров:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Примечания:

- Docker-раннер находится в `scripts/test-live-cli-backend-docker.sh`.
- Он запускает live-smoke CLI-бэкенда внутри Docker-образа репозитория от непривилегированного пользователя `node`.
- Он разрешает CLI smoke-метаданные из владеющего Plugin, затем устанавливает соответствующий Linux CLI-пакет (`@anthropic-ai/claude-code` или `@google/gemini-cli`) в кэшируемый записываемый префикс по `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (по умолчанию: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` требует переносимый OAuth подписки Claude Code через `~/.claude/.credentials.json` с `claudeAiOauth.subscriptionType` или `CLAUDE_CODE_OAUTH_TOKEN` из `claude setup-token`. Сначала он доказывает прямой `claude -p` в Docker, затем выполняет два хода Gateway CLI-бэкенда без сохранения env vars API-ключей Anthropic. Эта subscription-линия по умолчанию отключает пробы Claude MCP/инструментов и изображений, потому что она расходует лимиты использования подписки с входом в систему, а Anthropic может менять поведение биллинга и rate-limit для Claude Agent SDK / `claude -p` без релиза OpenClaw.
- Live-smoke CLI-бэкенда теперь выполняет один и тот же сквозной поток для Claude и Gemini: текстовый ход, ход классификации изображения, затем вызов инструмента MCP `cron`, проверенный через gateway CLI.
- Smoke Claude по умолчанию также патчит сессию с Sonnet на Opus и проверяет, что возобновленная сессия все еще помнит более раннюю заметку.

## Live: достижимость APNs HTTP/2 proxy

- Тест: `src/infra/push-apns-http2.live.test.ts`
- Цель: пройти туннелем через локальный HTTP CONNECT proxy к sandbox endpoint Apple APNs, отправить APNs HTTP/2 validation request и проверить, что реальный ответ Apple `403 InvalidProviderToken` возвращается через proxy-путь.
- Включение:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Необязательный timeout:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Цель: проверить реальный поток привязки беседы ACP с live-агентом ACP:
  - отправить `/acp spawn <agent> --bind here`
  - привязать синтетическую беседу канала сообщений на месте
  - отправить обычное последующее сообщение в той же беседе
  - проверить, что последующее сообщение попадает в транскрипт привязанной сессии ACP
- Включение:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Значения по умолчанию:
  - агенты ACP в Docker: `claude,codex,gemini`
  - агент ACP для прямого `pnpm test:live ...`: `claude`
  - синтетический канал: контекст беседы в стиле Slack DM
  - бэкенд ACP: `acpx`
- Переопределения:
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
- Примечания:
  - Этот lane использует поверхность Gateway `chat.send` с синтетическими полями исходного маршрута только для администраторов, чтобы тесты могли присоединять контекст канала сообщений, не имитируя внешнюю доставку.
  - Когда `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задан, тест использует встроенный реестр агентов встроенного Plugin `acpx` для выбранного агента ACP harness.
  - Создание MCP для Cron привязанной сессии по умолчанию выполняется по принципу best-effort, потому что внешние ACP harness могут отменять вызовы MCP после прохождения проверки привязки/изображения; задайте `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, чтобы сделать эту проверку Cron после привязки строгой.

Пример:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-acp-bind
```

Рецепты Docker для одного агента:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Примечания Docker:

- Docker runner находится в `scripts/test-live-acp-bind-docker.sh`.
- По умолчанию он последовательно запускает smoke привязки ACP для агрегированных live-агентов CLI: `claude`, `codex`, затем `gemini`.
- Используйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` или `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, чтобы сузить матрицу.
- Он подготавливает соответствующие материалы аутентификации CLI в контейнере, затем устанавливает запрошенный live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` или `opencode-ai`), если он отсутствует. Сам бэкенд ACP — встроенный пакет `acpx/runtime` из официального Plugin `acpx`.
- Вариант Droid Docker подготавливает `~/.factory` для настроек, пробрасывает `FACTORY_API_KEY` и требует этот ключ API, потому что локальная аутентификация Factory OAuth/keyring непереносима в контейнер. Он использует встроенную запись реестра ACPX `droid exec --output-format acp`.
- Вариант OpenCode Docker — строгий regression lane для одного агента. Он записывает временную модель по умолчанию `OPENCODE_CONFIG_CONTENT` из `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (по умолчанию `opencode/kimi-k2.6`), а `pnpm test:docker:live-acp-bind:opencode` требует транскрипт привязанного assistant вместо принятия общего пропуска после привязки.
- Прямые вызовы CLI `acpx` — только ручной путь/обходной путь для сравнения поведения вне Gateway. Smoke привязки Docker ACP проверяет встроенный runtime-бэкенд `acpx` OpenClaw.

## Live: smoke harness Codex app-server

- Цель: проверить принадлежащий Plugin harness Codex через обычный метод Gateway
  `agent`:
  - загрузить bundled Plugin `codex`
  - выбрать `openai/gpt-5.5`, который по умолчанию маршрутизирует агентские ходы OpenAI через Codex
  - отправить первый агентский ход Gateway в `openai/gpt-5.5` с выбранным harness Codex
  - отправить второй ход в ту же сессию OpenClaw и проверить, что thread app-server
    может возобновиться
  - выполнить `/codex status` и `/codex models` через тот же путь команд Gateway
  - опционально выполнить две проверенные Guardian shell-проверки с повышенными правами: одну безвредную
    команду, которая должна быть одобрена, и одну загрузку fake-secret, которая должна быть
    отклонена, чтобы агент задал уточняющий вопрос
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Включение: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Модель по умолчанию: `openai/gpt-5.5`
- Опциональная проверка изображения: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Опциональная проверка MCP/инструмента: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Опциональная проверка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke принудительно задает provider/model `agentRuntime.id: "codex"`, чтобы сломанный harness Codex
  не мог пройти за счет тихого fallback к OpenClaw.
- Аутентификация: аутентификация Codex app-server из локального входа по подписке Codex. Docker
  smokes также могут предоставлять `OPENAI_API_KEY` для не-Codex проверок, когда применимо,
  а также опционально скопированные `~/.codex/auth.json` и `~/.codex/config.toml`.

Локальный рецепт:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-codex-harness
```

Примечания Docker:

- Docker runner находится в `scripts/test-live-codex-harness-docker.sh`.
- Он передает `OPENAI_API_KEY`, копирует файлы аутентификации Codex CLI при наличии, устанавливает
  `@openai/codex` в доступный для записи смонтированный npm
  prefix, подготавливает дерево исходного кода, затем запускает только live-тест Codex-harness.
- Docker по умолчанию включает проверки изображения, MCP/инструмента и Guardian. Задайте
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` или
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` или
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, когда нужен более узкий отладочный
  запуск.
- Docker использует ту же явную конфигурацию runtime Codex, поэтому legacy alias или fallback OpenClaw
  не могут скрыть регрессию harness Codex.

### Рекомендуемые live-рецепты

Узкие, явные allowlists быстрее всего и наименее нестабильны:

- Одна модель, напрямую (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Прямой профиль small-model:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Профиль small-model через Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke Ollama Cloud API:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Одна модель, smoke через Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Вызов инструментов у нескольких провайдеров:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Прямой smoke Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Фокус Google (ключ Gemini API + Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke Google adaptive thinking:
  - Gemini 3 dynamic по умолчанию: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примечания:

- `google/...` использует Gemini API (ключ API).
- `google-antigravity/...` использует мост Antigravity OAuth (agent endpoint в стиле Cloud Code Assist).
- `google-gemini-cli/...` использует локальный Gemini CLI на вашей машине (отдельная аутентификация + особенности инструментов).
- Gemini API и Gemini CLI:
  - API: OpenClaw вызывает размещенный Google Gemini API по HTTP (ключ API / аутентификация профиля); именно это большинство пользователей подразумевает под "Gemini".
  - CLI: OpenClaw запускает локальный бинарный файл `gemini`; у него собственная аутентификация, и он может вести себя иначе (поддержка streaming/инструментов/расхождение версий).

## Live: матрица моделей (что мы покрываем)

Фиксированного "списка моделей CI" нет (live включается явно), но это **рекомендуемые** модели для регулярного покрытия на dev-машине с ключами.

### Современный smoke-набор (вызов инструментов + изображение)

Это запуск "common models", который, как ожидается, должен продолжать работать:

- OpenAI (не Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (или `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` и `google/gemini-3-flash-preview` (избегайте более старых моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` и `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` и `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (общий API) или `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Запустите smoke Gateway с инструментами + изображением:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовый уровень: вызов инструментов (Read + опциональный Exec)

Выберите как минимум одну модель на каждое семейство провайдеров:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (или `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (или `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (общий API) или `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Опциональное дополнительное покрытие (желательно):

- xAI: `xai/grok-4.3` (или последняя доступная)
- Mistral: `mistral/`… (выберите одну поддерживающую "tools" модель, которая у вас включена)
- Cerebras: `cerebras/`… (если у вас есть доступ)
- LM Studio: `lmstudio/`… (локально; вызов инструментов зависит от режима API)

### Vision: отправка изображения (вложение → мультимодальное сообщение)

Включите как минимум одну модель с поддержкой изображений в `OPENCLAW_LIVE_GATEWAY_MODELS` (варианты Claude/Gemini/OpenAI с поддержкой vision и т. д.), чтобы выполнить проверку изображения.

### Агрегаторы / альтернативные Gateway

Если у вас включены ключи, мы также поддерживаем тестирование через:

- OpenRouter: `openrouter/...` (сотни моделей; используйте `openclaw models scan`, чтобы найти кандидатов с поддержкой инструментов+изображений)
- OpenCode: `opencode/...` для Zen и `opencode-go/...` для Go (аутентификация через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Другие провайдеры, которых можно включить в live-матрицу (если у вас есть учетные данные/конфигурация):

- Встроенные: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (пользовательские конечные точки): `minimax` (облако/API), а также любой OpenAI/Anthropic-совместимый прокси (LM Studio, vLLM, LiteLLM и т. д.)

<Tip>
Не прописывайте жестко «все модели» в документации. Авторитетный список — это то, что `discoverModels(...)` возвращает на вашей машине, плюс все доступные ключи.
</Tip>

## Учетные данные (никогда не коммитьте)

Живые тесты обнаруживают учетные данные так же, как это делает CLI. Практические следствия:

- Если CLI работает, живые тесты должны найти те же ключи.
- Если живой тест сообщает «нет учетных данных», отлаживайте это так же, как вы отлаживали бы `openclaw models list` / выбор модели.

- Профили аутентификации для каждого агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (именно это означает «ключи профиля» в живых тестах)
- Конфигурация: `~/.openclaw/openclaw.json` (или `OPENCLAW_CONFIG_PATH`)
- Устаревший каталог состояния: `~/.openclaw/credentials/` (копируется в подготовленный живой домашний каталог при наличии, но не является основным хранилищем ключей профилей)
- Локальные живые запуски по умолчанию копируют активную конфигурацию, файлы `auth-profiles.json` для каждого агента, устаревший `credentials/` и поддерживаемые внешние каталоги аутентификации CLI во временный тестовый домашний каталог; подготовленные живые домашние каталоги пропускают `workspace/` и `sandboxes/`, а переопределения путей `agents.*.workspace` / `agentDir` удаляются, чтобы проверки не попадали в ваше реальное рабочее пространство на хосте.

Если вы хотите полагаться на ключи из окружения, экспортируйте их перед локальными тестами или используйте
Docker-запускатели ниже с явным `OPENCLAW_PROFILE_FILE`.

## Deepgram live (транскрибация аудио)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Включение: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Живой тест плана кодирования BytePlus

- Тест: `extensions/byteplus/live.test.ts`
- Включение: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необязательное переопределение модели: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Живой тест медиа для workflow ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Включение: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Область:
  - Проверяет встроенные пути comfy для изображений, видео и `music_generate`
  - Пропускает каждую возможность, если `plugins.entries.comfy.config.<capability>` не настроен
  - Полезно после изменений отправки workflow comfy, polling, загрузок или регистрации Plugin

## Живой тест генерации изображений

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Оснастка: `pnpm test:live:media image`
- Область:
  - Перечисляет каждый зарегистрированный provider plugin для генерации изображений
  - Использует уже экспортированные переменные окружения провайдера перед проверкой
  - По умолчанию использует live/env API-ключи раньше сохраненных профилей аутентификации, поэтому устаревшие тестовые ключи в `auth-profiles.json` не скрывают реальные учетные данные shell
  - Пропускает провайдеры без пригодной аутентификации/профиля/модели
  - Прогоняет каждый настроенный провайдер через общий runtime генерации изображений:
    - `<provider>:generate`
    - `<provider>:edit`, когда провайдер объявляет поддержку редактирования
- Текущие покрытые встроенные провайдеры:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Необязательное сужение:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Необязательное поведение аутентификации:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, чтобы принудительно использовать аутентификацию из хранилища профилей и игнорировать переопределения только из окружения

Для поставляемого пути CLI добавьте smoke-тест `infer` после успешного прохождения живого
теста provider/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Это покрывает разбор аргументов CLI, разрешение конфигурации/default-agent, активацию встроенного
Plugin, общий runtime генерации изображений и живой запрос к провайдеру. Ожидается, что зависимости Plugin присутствуют до загрузки runtime.

## Живой тест генерации музыки

- Тест: `extensions/music-generation-providers.live.test.ts`
- Включение: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Оснастка: `pnpm test:live:media music`
- Область:
  - Проверяет общий путь встроенного провайдера генерации музыки
  - В настоящее время покрывает Google и MiniMax
  - Использует уже экспортированные переменные окружения провайдера перед проверкой
  - По умолчанию использует live/env API-ключи раньше сохраненных профилей аутентификации, поэтому устаревшие тестовые ключи в `auth-profiles.json` не скрывают реальные учетные данные shell
  - Пропускает провайдеры без пригодной аутентификации/профиля/модели
  - Запускает оба объявленных режима runtime, когда они доступны:
    - `generate` с вводом только prompt
    - `edit`, когда провайдер объявляет `capabilities.edit.enabled`
  - Текущее покрытие общего lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: отдельный живой файл Comfy, не этот общий sweep
- Необязательное сужение:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необязательное поведение аутентификации:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, чтобы принудительно использовать аутентификацию из хранилища профилей и игнорировать переопределения только из окружения

## Живой тест генерации видео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Включение: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Оснастка: `pnpm test:live:media video`
- Область:
  - Проверяет общий путь встроенного провайдера генерации видео
  - По умолчанию использует release-safe smoke-путь: провайдеры не FAL, один text-to-video запрос на провайдера, prompt с омаром на одну секунду и лимит операции на провайдера из `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` по умолчанию)
  - По умолчанию пропускает FAL, потому что задержка очереди на стороне провайдера может доминировать во времени релиза; передайте `--video-providers fal` или `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, чтобы запустить его явно
  - Использует уже экспортированные переменные окружения провайдера перед проверкой
  - По умолчанию использует live/env API-ключи раньше сохраненных профилей аутентификации, поэтому устаревшие тестовые ключи в `auth-profiles.json` не скрывают реальные учетные данные shell
  - Пропускает провайдеры без пригодной аутентификации/профиля/модели
  - По умолчанию запускает только `generate`
  - Установите `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, чтобы также запускать объявленные режимы transform, когда они доступны:
    - `imageToVideo`, когда провайдер объявляет `capabilities.imageToVideo.enabled`, а выбранный провайдер/модель принимает локальный ввод изображения на основе буфера в общем sweep
    - `videoToVideo`, когда провайдер объявляет `capabilities.videoToVideo.enabled`, а выбранный провайдер/модель принимает локальный ввод видео на основе буфера в общем sweep
  - Текущие объявленные, но пропускаемые провайдеры `imageToVideo` в общем sweep:
    - `vydra`, потому что встроенный `veo3` поддерживает только текст, а встроенный `kling` требует удаленный URL изображения
  - Покрытие Vydra для конкретного провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - этот файл запускает `veo3` text-to-video плюс lane `kling`, который по умолчанию использует фикстуру с удаленным URL изображения
  - Текущее живое покрытие `videoToVideo`:
    - только `runway`, когда выбранная модель — `runway/gen4_aleph`
  - Текущие объявленные, но пропускаемые провайдеры `videoToVideo` в общем sweep:
    - `alibaba`, `qwen`, `xai`, потому что эти пути сейчас требуют удаленные эталонные URL `http(s)` / MP4
    - `google`, потому что текущий общий lane Gemini/Veo использует локальный ввод на основе буфера, а этот путь не принимается в общем sweep
    - `openai`, потому что текущему общему lane не хватает гарантий доступа к редактированию видео, зависящих от организации
- Необязательное сужение:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, чтобы включить каждого провайдера в sweep по умолчанию, включая FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, чтобы уменьшить лимит каждой операции провайдера для агрессивного smoke-запуска
- Необязательное поведение аутентификации:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, чтобы принудительно использовать аутентификацию из хранилища профилей и игнорировать переопределения только из окружения

## Живая media-оснастка

- Команда: `pnpm test:live:media`
- Назначение:
  - Запускает общие живые наборы тестов изображений, музыки и видео через одну repo-native точку входа
  - Использует уже экспортированные переменные окружения провайдера
  - По умолчанию автоматически сужает каждый набор до провайдеров, для которых сейчас есть пригодная аутентификация
  - Повторно использует `scripts/test-live.mjs`, поэтому поведение Heartbeat и quiet-mode остается согласованным
- Примеры:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Связанные материалы

- [Тестирование](/ru/help/testing) - unit, integration, QA и Docker-наборы
