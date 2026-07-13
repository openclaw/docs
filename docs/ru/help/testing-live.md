---
read_when:
    - Запуск проверок на реальных моделях для матрицы моделей, серверной части CLI, ACP и поставщика медиафайлов
    - Отладка разрешения учётных данных для тестирования в рабочей среде
    - Добавление нового теста для конкретного провайдера в реальной среде
sidebarTitle: Live tests
summary: 'Live-тесты (с обращением к сети): матрица моделей, бэкенды CLI, ACP, поставщики медиасервисов, учётные данные'
title: 'Тестирование: тестовые наборы в реальной среде'
x-i18n:
    generated_at: "2026-07-13T18:13:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Для быстрого старта, средств запуска QA, модульных/интеграционных наборов тестов и сценариев Docker см.
[Тестирование](/ru/help/testing). На этой странице описаны **живые** тесты (с обращением к сети):
матрица моделей, серверные части CLI, ACP, поставщики мультимедиа и обработка учетных данных.

## Живые тесты: локальные команды быстрой проверки

Перед разовыми живыми проверками экспортируйте необходимый ключ поставщика
в окружение процесса.

Безопасная быстрая проверка мультимедиа:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "Живая быстрая проверка OpenClaw." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безопасная быстрая проверка готовности голосовых вызовов:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` выполняется в тестовом режиме, если также не указан `--yes`; используйте `--yes` только
если намерены совершить реальный вызов. Для Twilio, Telnyx и Plivo
успешная проверка готовности требует общедоступного URL-адреса Webhook — локальные/частные
URL-адреса обратной петли отклоняются, поскольку эти поставщики не могут к ним подключиться.

## Живые тесты: проверка возможностей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Цель: вызвать **каждую команду, объявленную в настоящее время** подключенным Android Node, и проверить поведение контракта команд.
- Область:
  - Предварительная/ручная настройка (набор тестов не устанавливает, не запускает и не сопрягает приложение).
  - Покомандная проверка gateway `node.invoke` для выбранного Android Node.
- Необходимая предварительная настройка:
  - Приложение Android уже подключено и сопряжено с gateway.
  - Приложение остается на переднем плане.
  - Предоставлены разрешения/согласие на захват для возможностей, которые должны пройти проверку.
- Необязательные переопределения целевого объекта:
  - `OPENCLAW_ANDROID_NODE_ID` или `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Полные сведения о настройке Android: [Приложение Android](/ru/platforms/android)

## Живые тесты: быстрая проверка моделей (ключи профилей)

Живые тесты моделей разделены на два уровня, чтобы изолировать сбои:

- «Прямая модель» показывает, способен ли поставщик/модель вообще ответить с указанным ключом.
- «Быстрая проверка Gateway» показывает, работает ли для этой модели полный конвейер Gateway и агента (сеансы, история, инструменты, политика песочницы и т. д.).

Приведенные ниже подготовленные списки моделей находятся в `src/agents/live-model-filter.ts` и
со временем изменяются; источником истины следует считать массивы в этом файле, а не эту
страницу.

MiniMax M3 по умолчанию использует `minimax/MiniMax-M3` в качестве ссылки на поставщика/модель.

### Уровень 1: прямое завершение модели (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Цель:
  - Перечислить обнаруженные модели
  - Использовать `getApiKeyForModel` для выбора моделей, к которым у вас есть учетные данные
  - Выполнить небольшое завершение для каждой модели (и целевые регрессионные проверки, где необходимо)
- Как включить:
  - `pnpm test:live` (или `OPENCLAW_LIVE_TEST=1` при непосредственном вызове Vitest)
  - Укажите `OPENCLAW_LIVE_MODELS=modern`, `small` или `all` (псевдоним для `modern`), чтобы фактически запустить этот набор; иначе он будет пропущен, поэтому сам по себе `pnpm test:live` остается ориентированным на быструю проверку Gateway.
- Как выбрать модели:
  - `OPENCLAW_LIVE_MODELS=modern` запускает подготовленный приоритетный список наиболее показательных моделей (см. [Живые тесты: матрица моделей](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` запускает подготовленный приоритетный список малых моделей
  - `OPENCLAW_LIVE_MODELS=all` является псевдонимом для `modern`
  - или `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (список разрешений через запятую)
  - Для локальных запусков малых моделей Ollama по умолчанию используется `http://127.0.0.1:11434`; задавайте `OPENCLAW_LIVE_OLLAMA_BASE_URL` только для локальной сети, пользовательских конечных точек или конечных точек Ollama Cloud.
  - Для современных/всех моделей и малых моделей ограничение по умолчанию равно длине соответствующего подготовленного списка; задайте `OPENCLAW_LIVE_MAX_MODELS=0` для исчерпывающей проверки выбранного профиля или положительное число для меньшего ограничения.
  - Для исчерпывающих проверок `OPENCLAW_LIVE_TEST_TIMEOUT_MS` определяет время ожидания всего теста прямых моделей. По умолчанию: 60 минут.
  - По умолчанию проверки прямых моделей выполняются с параллелизмом 20; задайте `OPENCLAW_LIVE_MODEL_CONCURRENCY`, чтобы переопределить это значение.
- Как выбрать поставщиков:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (список разрешений через запятую)
- Откуда берутся ключи:
  - По умолчанию: хранилище профилей и резервные значения из окружения
  - Задайте `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, чтобы разрешить использование только **хранилища профилей**
- Зачем это нужно:
  - Отделяет ситуацию «API поставщика не работает / ключ недействителен» от ситуации «конвейер агента Gateway не работает»
  - Содержит небольшие изолированные регрессионные проверки (пример: воспроизведение рассуждений OpenAI Responses/Codex Responses и потоки вызова инструментов)

### Уровень 2: быстрая проверка Gateway и агента разработки (что на самом деле делает «@openclaw»)

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Цель:
  - Запустить внутрипроцессный Gateway
  - Создать/изменить сеанс `agent:dev:*` (переопределение модели для каждого запуска)
  - Перебрать модели с ключами и проверить:
    - «содержательный» ответ (без инструментов)
    - работоспособность реального вызова инструмента (проверка чтения)
    - необязательные дополнительные проверки инструментов (проверка выполнения и чтения)
    - регрессионные пути OpenAI (только вызов инструмента -> последующий запрос) продолжают работать
- Сведения о проверках (чтобы можно было быстро объяснить сбои):
  - Проверка `read`: тест записывает файл с одноразовым значением в рабочую область и просит агента выполнить для него `read`, а затем вернуть это значение.
  - Проверка `exec+read`: тест просит агента выполнить `exec` для записи одноразового значения во временный файл, а затем выполнить `read` для его обратного чтения.
  - Проверка изображения: тест прикрепляет сгенерированный PNG (кот + случайный код) и ожидает, что модель вернет `cat <CODE>`.
  - Справочная реализация: `src/gateway/gateway-models.profiles.live.test.ts` и `test/helpers/live-image-probe.ts`.
- Как включить:
  - `pnpm test:live` (или `OPENCLAW_LIVE_TEST=1` при непосредственном вызове Vitest)
- Как выбрать модели:
  - По умолчанию: подготовленный приоритетный список наиболее показательных моделей (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` запускает подготовленный список малых моделей через полный конвейер Gateway и агента
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` является псевдонимом для `modern`
  - Или задайте `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (либо список через запятую), чтобы сузить выбор
  - Для проверок современных/всех и малых моделей через Gateway ограничение по умолчанию равно длине соответствующего подготовленного списка; задайте `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для исчерпывающей выбранной проверки или положительное число для меньшего ограничения.
- Как выбрать поставщиков (избегая «всего через OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (список разрешений через запятую)
- Проверки инструментов и изображений всегда включены в этом живом тесте:
  - Проверка `read` и проверка `exec+read` (нагрузка на инструменты)
  - проверка изображения выполняется, когда модель объявляет поддержку ввода изображений
  - Поток (в общих чертах):
    - Тест создает небольшой PNG с надписью «CAT» и случайным кодом (`test/helpers/live-image-probe.ts`)
    - Отправляет его через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway преобразует вложения в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Встроенный агент пересылает модели мультимодальное сообщение пользователя
    - Проверка: ответ содержит `cat` и код (допуск OCR: разрешены незначительные ошибки)

<Tip>
Чтобы узнать, что можно протестировать на вашем компьютере (и точные идентификаторы `provider/model`), выполните:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Живые тесты: быстрая проверка серверной части CLI (Claude, Gemini или другие локальные CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Цель: проверить конвейер Gateway и агента с помощью локальной серверной части CLI, не затрагивая конфигурацию по умолчанию.
- Значения быстрой проверки по умолчанию для конкретных серверных частей находятся в определении `cli-backend.ts` соответствующего плагина-владельца.
- Включение:
  - `pnpm test:live` (или `OPENCLAW_LIVE_TEST=1` при непосредственном вызове Vitest)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значения по умолчанию:
  - Поставщик/модель по умолчанию: `claude-cli/claude-sonnet-4-6`
  - Поведение команд, аргументов и изображений определяется метаданными соответствующего плагина серверной части CLI.
- Переопределения (необязательно):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` для отправки реального вложения-изображения (пути внедряются в запрос). По умолчанию отключено в рецептах Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` для передачи путей к файлам изображений как аргументов CLI вместо внедрения в запрос.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (или `"list"`) для управления передачей аргументов изображений, когда задан `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` для отправки второго запроса и проверки потока возобновления.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` для включения проверки непрерывности Claude Sonnet -> Opus в рамках одного сеанса, когда выбранная модель поддерживает целевой объект переключения. По умолчанию отключено, в том числе в рецептах Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` для включения проверки замкнутого цикла MCP/инструментов. По умолчанию отключено в рецептах Docker.

Пример:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Быстрая и недорогая проверка конфигурации Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Она не просит Gemini сгенерировать ответ. Она записывает те же системные
настройки, которые OpenClaw передает Gemini, а затем запускает `gemini --debug mcp list`, чтобы подтвердить,
что сохраненный сервер `transport: "streamable-http"` нормализуется в HTTP-формат MCP
Gemini и может подключиться к локальному потоковому HTTP-серверу MCP.

Рецепт Docker:

```bash
pnpm test:docker:live-cli-backend
```

Рецепты Docker для отдельных поставщиков:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Примечания:

- Средство запуска Docker находится в `scripts/test-live-cli-backend-docker.sh`.
- Оно выполняет живую быструю проверку серверной части CLI внутри Docker-образа репозитория от имени непривилегированного пользователя `node`.
- Оно получает метаданные быстрой проверки CLI из соответствующего плагина-владельца, а затем устанавливает подходящий пакет CLI для Linux (`@anthropic-ai/claude-code` или `@google/gemini-cli`) в кэшируемый доступный для записи префикс по адресу `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (по умолчанию: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` больше не является встроенной серверной частью CLI; вместо нее используйте `openai/*` со средой выполнения сервера приложений Codex (см. [Живые тесты: быстрая проверка стенда сервера приложений Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` требует переносимой авторизации OAuth по подписке Claude Code через `~/.claude/.credentials.json` с `claudeAiOauth.subscriptionType` либо через `CLAUDE_CODE_OAUTH_TOKEN` из `claude setup-token`. Сначала выполняется прямая проверка `claude -p` в Docker, затем два запроса к серверной части CLI через Gateway без сохранения переменных окружения с ключом API Anthropic. В этой ветке подписки проверки MCP/инструментов и изображений Claude по умолчанию отключены, поскольку они расходуют лимиты использования авторизованной подписки, а Anthropic может изменить порядок тарификации и ограничения частоты запросов Claude Agent SDK / `claude -p` без выпуска новой версии OpenClaw.
- Claude и Gemini поддерживают одинаковый набор проверок (текстовый запрос, классификация изображений, вызов инструмента MCP `cron`, непрерывность при переключении модели) через указанные выше флаги, но ни одна из этих проверок не выполняется по умолчанию — включайте каждую необходимую проверку соответствующим флагом.

## Живые тесты: доступность прокси APNs по HTTP/2

- Тест: `src/infra/push-apns-http2.live.test.ts`
- Цель: создать туннель через локальный HTTP-прокси CONNECT к конечной точке песочницы APNs Apple, отправить проверочный HTTP/2-запрос APNs и убедиться, что реальный ответ Apple `403 InvalidProviderToken` возвращается через прокси.
- Включение:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Необязательный тайм-аут:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Интерактивная проверка: быстрый тест привязки ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Цель: проверить реальный поток привязки беседы ACP с действующим агентом ACP:
  - отправить `/acp spawn <agent> --bind here`
  - привязать синтетическую беседу канала сообщений на месте
  - отправить обычное последующее сообщение в той же беседе
  - убедиться, что последующее сообщение попало в протокол привязанного сеанса ACP
- Включение:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Значения по умолчанию:
  - Агенты ACP в Docker: `claude,codex,gemini`
  - Агент ACP для прямого `pnpm test:live ...`: `claude`
  - Синтетический канал: контекст беседы в стиле личных сообщений Slack
  - Бэкенд ACP: `acpx`
- Переопределения:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (или `on`/`true`/`yes`), чтобы принудительно включить проверку изображения; любое другое значение принудительно отключает её. По умолчанию выполняется для каждого агента, кроме `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Примечания:
  - Этот сценарий использует поверхность Gateway `chat.send` с доступными только администраторам синтетическими полями исходного маршрута, чтобы тесты могли присоединять контекст канала сообщений, не имитируя внешнюю доставку.
  - Если `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задана, тест использует встроенный реестр агентов плагина `acpx` для выбранного агента тестового стенда ACP.
  - Создание Cron MCP для привязанного сеанса по умолчанию выполняется без гарантии успеха, поскольку внешние тестовые стенды ACP могут отменять вызовы MCP после успешной проверки привязки и изображения; задайте `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, чтобы сделать эту проверку Cron после привязки строгой.

Пример:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Команда для Docker:

```bash
pnpm test:docker:live-acp-bind
```

Команды Docker для отдельных агентов:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Примечания по Docker:

- Средство запуска Docker находится в `scripts/test-live-acp-bind-docker.sh`.
- По умолчанию оно последовательно запускает быстрый тест привязки ACP для совокупности действующих агентов CLI: `claude`, `codex`, затем `gemini`.
- Используйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` или `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, чтобы сузить матрицу.
- Оно помещает соответствующие аутентификационные данные CLI в контейнер, а затем при отсутствии устанавливает запрошенный действующий CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid через `https://app.factory.ai/cli`, `@google/gemini-cli` или `opencode-ai`). Сам бэкенд ACP — это встроенный пакет `acpx/runtime` из официального плагина `acpx`.
- Вариант Docker для Droid помещает `~/.factory` для настроек, передаёт `FACTORY_API_KEY` и требует этот ключ API, поскольку локальную аутентификацию Factory через OAuth или связку ключей невозможно перенести в контейнер. Он использует встроенную запись реестра ACPX `droid exec --output-format acp`.
- Вариант Docker для OpenCode — строгий регрессионный сценарий с одним агентом. Он записывает временную модель по умолчанию `OPENCODE_CONFIG_CONTENT` из `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (по умолчанию `opencode/kimi-k2.6`).
- Прямые вызовы CLI `acpx` предназначены только для ручного использования или обходного пути при сравнении поведения вне Gateway. Быстрый тест привязки ACP в Docker проверяет встроенный бэкенд среды выполнения `acpx` OpenClaw.

## Интерактивная проверка: быстрый тест стенда сервера приложений Codex

- Цель: проверить принадлежащий плагину тестовый стенд Codex через обычный метод Gateway
  `agent`:
  - загрузить встроенный плагин `codex`
  - выбрать модель OpenAI через `/model <ref> --runtime codex`
  - отправить первый ход агента через Gateway с запрошенным уровнем рассуждений
  - отправить второй ход в тот же сеанс OpenClaw и убедиться, что поток сервера приложений
    можно возобновить
  - запустить `/codex status` и `/codex models` через тот же путь команд
    Gateway
  - при необходимости выполнить две проверенные Guardian команды оболочки с повышенными правами: одну безопасную
    команду, которая должна быть одобрена, и одну попытку отправки фиктивного секрета, которая должна быть
    отклонена, чтобы агент запросил подтверждение
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Включение: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Базовая модель тестового стенда: `openai/gpt-5.6-luna`
- Выбор по умолчанию для нового ключа API OpenAI: `openai/gpt-5.6`
- Рассуждения по умолчанию: `low`
- Переопределение модели: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Переопределение рассуждений: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Переопределение матрицы: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Режим аутентификации: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (по умолчанию) использует
  скопированные данные входа Codex; `api-key` использует `OPENAI_API_KEY` через сервер приложений Codex.
- Необязательная проверка изображения: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необязательная проверка MCP/инструмента: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необязательная проверка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Быстрый тест принудительно задаёт поставщика и модель `agentRuntime.id: "codex"`, чтобы неисправный тестовый стенд Codex
  не мог пройти проверку за счёт незаметного отката к OpenClaw.
- Аутентификация: аутентификация сервера приложений Codex из локального входа в подписку Codex или
  `OPENAI_API_KEY`, когда `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Для запусков с подпиской Docker может
  скопировать `~/.codex/auth.json` и `~/.codex/config.toml`.

Команда для локального запуска:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Команда для Docker:

```bash
pnpm test:docker:live-codex-harness
```

Матрица GPT-5.6 для нативного Codex:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Значение по умолчанию для нового ключа API OpenAI:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

При этой проверке `OPENCLAW_LIVE_GATEWAY_MODELS` остаётся незаданной, модель определяется через
новый механизм выбора вывода при первоначальной настройке, проверяется `openai/gpt-5.6`, после чего
выполняется реальный ход через Gateway с определённой моделью.

Матрица GPT-5.6 для встроенного OpenClaw:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Примечания по Docker:

- Средство запуска Docker находится в `scripts/test-live-codex-harness-docker.sh`.
- Оно передаёт `OPENAI_API_KEY`, копирует файлы аутентификации Codex CLI при их наличии, устанавливает
  `@openai/codex` в доступный для записи подключённый префикс
  npm, помещает дерево исходного кода, а затем запускает только интерактивный тест стенда Codex.
- Docker по умолчанию включает проверки изображения, MCP/инструмента и Guardian. Задайте
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`,
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` или
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, если требуется более узкий
  отладочный запуск.
- Docker использует ту же явно заданную конфигурацию среды выполнения Codex, поэтому устаревшие псевдонимы или откат к OpenClaw
  не могут скрыть регрессию тестового стенда Codex.
- Целевые элементы матрицы выполняются последовательно в одном контейнере. Скрипт Docker масштабирует
  стандартный 35-минутный тайм-аут по числу целевых элементов; любой внешний тайм-аут оболочки или CI должен
  допускать такое же общее время. Канонический CI размещает каждый целевой элемент GPT-5.6 в отдельном сегменте.

### Рекомендуемые команды для интерактивной проверки

Узкие, явно заданные списки разрешённых элементов работают быстрее всего и наименее подвержены нестабильности:

- Одна модель, напрямую (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Прямой профиль малой модели:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Профиль малой модели через Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Быстрый тест API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Одна модель, быстрый тест Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Вызов инструментов у нескольких поставщиков:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Прямой быстрый тест GLM-5.2 в Z.AI Coding Plan:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Проверки Google (ключ API Gemini и Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Быстрый тест адаптивных рассуждений Google (`qa manual` из закрытого QA CLI — требуются `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` и рабочая копия исходного кода; см. [обзор QA](/ru/concepts/qa-e2e-automation)):
  - Динамическое значение по умолчанию Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамический бюджет Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примечания:

- `google/...` использует API Gemini (ключ API).
- `google-antigravity/...` использует мост OAuth Antigravity (конечную точку агента в стиле Cloud Code Assist).
- `google-gemini-cli/...` использует локальный Gemini CLI на вашем компьютере (отдельная аутентификация и особенности инструментов).
- API Gemini и Gemini CLI:
  - API: OpenClaw вызывает размещённый у Google API Gemini по HTTP (ключ API или аутентификация профиля); именно это большинство пользователей подразумевает под «Gemini».
  - CLI: OpenClaw запускает локальный двоичный файл `gemini` через оболочку; у него собственная аутентификация, и его поведение может отличаться (потоковая передача, поддержка инструментов и расхождение версий).

## Интерактивная проверка: матрица моделей (что охватывается)

Интерактивная проверка включается по запросу, поэтому фиксированного «списка моделей CI» нет. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (и их псевдоним `all`) запускают отобранный приоритетный список из `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` в `src/agents/live-model-filter.ts` в следующем порядке приоритета:

| Провайдер/модель                              | Примечания |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

Подобранный список **малых моделей** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`) из `SMALL_LIVE_MODEL_PRIORITY`:

| Провайдер/модель            |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Примечания к современному списку:

- Провайдеры `codex` и `codex-cli` исключены из стандартного прогона современных моделей (они охватывают поведение бэкенда CLI/ACP, которое тестируется отдельно выше). Сам `openai/gpt-5.5` по умолчанию маршрутизируется через тестовую обвязку сервера приложений Codex; см. [Live: быстрый тест тестовой обвязки сервера приложений Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` и `xai` в прогоне современных моделей запускают только явно подобранные идентификаторы моделей (без автоматического расширения до «всех моделей этого провайдера»).
- Включите в `OPENCLAW_LIVE_GATEWAY_MODELS` хотя бы одну модель с поддержкой изображений (варианты Claude/Gemini/семейства OpenAI с компьютерным зрением и т. п.), чтобы выполнить проверку изображений.

Запустите быстрый тест Gateway с инструментами и изображением на вручную подобранном наборе разных провайдеров:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Необязательное дополнительное покрытие за пределами подобранных списков (желательно выбрать включённую у вас модель с поддержкой инструментов):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (если у вас есть доступ)
- LM Studio: `lmstudio/...` (локально; вызов инструментов зависит от режима API)

### Агрегаторы / альтернативные шлюзы

Если у вас настроены ключи, также можно протестировать через:

- OpenRouter: `openrouter/...` (сотни моделей; используйте `openclaw models scan`, чтобы найти варианты с поддержкой инструментов и изображений)
- OpenCode: `opencode/...` для Zen и `opencode-go/...` для Go (аутентификация через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Другие провайдеры, которые можно включить в матрицу live-тестов (при наличии учётных данных/конфигурации):

- Встроенные: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Через `models.providers` (пользовательские конечные точки): `minimax` (облако/API), а также любой прокси, совместимый с OpenAI/Anthropic (LM Studio, vLLM, LiteLLM и т. п.)

<Tip>
Не указывайте жёстко «все модели» в документации. Авторитетным является список, который `discoverModels(...)` возвращает на вашем компьютере с учётом доступных ключей.
</Tip>

## Учётные данные (никогда не добавляйте в коммиты)

Live-тесты обнаруживают учётные данные так же, как CLI. Практические следствия:

- Если CLI работает, live-тесты должны найти те же ключи.
- Если live-тест сообщает «нет учётных данных», выполняйте отладку так же, как при отладке `openclaw models list` / выбора модели.

- Профили аутентификации для отдельных агентов: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (именно это означает «ключи профилей» в live-тестах)
- Конфигурация: `~/.openclaw/openclaw.json` (или `OPENCLAW_CONFIG_PATH`)
- Каталог устаревшего OAuth: `~/.openclaw/credentials/` (при наличии копируется в подготовленный домашний каталог live-тестов, но не является основным хранилищем ключей профилей)
- Локальные live-запуски копируют активную конфигурацию (исключая переопределения `agents.*.workspace` / `agentDir`) и файл `auth-profiles.json` каждого агента, но не остальные данные из каталога агента, поэтому данные `workspace/` и `sandboxes/` никогда не попадают в подготовленный домашний каталог; кроме того, во временный домашний каталог для тестирования копируются устаревший каталог `credentials/` и поддерживаемые файлы/каталоги аутентификации внешних CLI (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`).

Если вы хотите использовать ключи из переменных окружения, экспортируйте их перед локальными тестами или используйте
приведённые ниже средства запуска Docker с явно заданным `OPENCLAW_PROFILE_FILE`.

## Live-тест Deepgram (транскрибирование аудио)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Включение: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live-тест плана программирования BytePlus

- Тест: `extensions/byteplus/live.test.ts`
- Включение: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необязательное переопределение модели: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live-тест медиафайлов рабочего процесса ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Включение: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Область:
  - Проверяет встроенные пути comfy для изображений, видео и `music_generate`
  - Пропускает каждую возможность, если не настроен `plugins.entries.comfy.config.<capability>`
  - Полезен после изменения отправки рабочих процессов comfy, опроса состояния, загрузок или регистрации плагинов

## Live-тест генерации изображений

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Тестовая обвязка: `pnpm test:live:media image`
- Область:
  - Перечисляет все зарегистрированные плагины провайдеров генерации изображений
  - Перед проверкой использует уже экспортированные переменные окружения провайдера
  - По умолчанию предпочитает ключи API из live-конфигурации/окружения сохранённым профилям аутентификации, поэтому устаревшие тестовые ключи в `auth-profiles.json` не скрывают реальные учётные данные оболочки
  - Пропускает провайдеров без пригодной аутентификации, профиля или модели
  - Запускает каждого настроенного провайдера через общую среду выполнения генерации изображений:
    - `<provider>:generate`
    - `<provider>:edit`, если провайдер заявляет поддержку редактирования
- Охватываемые в настоящее время встроенные провайдеры:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Необязательное сужение области:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Необязательное поведение аутентификации:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, чтобы принудительно использовать аутентификацию из хранилища профилей и игнорировать переопределения, заданные только через окружение

Для поставляемого пути CLI после успешного прохождения live-теста провайдера/среды выполнения
добавьте быстрый тест `infer`:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Минималистичное плоское тестовое изображение: один синий квадрат на белом фоне, без текста." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Это охватывает разбор аргументов CLI, разрешение конфигурации/агента по умолчанию, активацию встроенного
плагина, общую среду выполнения генерации изображений и live-запрос к провайдеру.
Ожидается, что зависимости плагина присутствуют до загрузки среды выполнения.

## Live-тест генерации музыки

- Тест: `extensions/music-generation-providers.live.test.ts`
- Включение: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Тестовая обвязка: `pnpm test:live:media music`
- Область:
  - Проверяет общий путь встроенного провайдера генерации музыки
  - В настоящее время охватывает `fal`, `google`, `minimax` и `openrouter`
  - Перед проверкой использует уже экспортированные переменные окружения провайдера
  - По умолчанию предпочитает ключи API из live-конфигурации/окружения сохранённым профилям аутентификации, поэтому устаревшие тестовые ключи в `auth-profiles.json` не скрывают реальные учётные данные оболочки
  - Пропускает провайдеров без пригодной аутентификации, профиля или модели
  - Запускает оба заявленных режима среды выполнения, когда они доступны:
    - `generate` с входными данными только в виде запроса
    - `edit`, если провайдер заявляет `capabilities.edit.enabled`
  - Для `comfy` предусмотрен отдельный файл live-теста, он не входит в этот общий прогон
- Необязательное сужение области:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необязательное поведение аутентификации:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, чтобы принудительно использовать аутентификацию из хранилища профилей и игнорировать переопределения, заданные только через окружение

## Live-тест генерации видео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Включение: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Среда тестирования: `pnpm test:live:media video`
- Область:
  - Проверяет общий путь встроенного провайдера генерации видео для `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - По умолчанию использует безопасный для выпуска путь дымового тестирования: один запрос преобразования текста в видео на провайдера, секундный промпт с лобстером и ограничение количества операций для каждого провайдера из `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (по умолчанию `180000`)
  - По умолчанию пропускает FAL, поскольку задержка очереди на стороне провайдера может занять большую часть времени выпуска; передайте `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (или очистите список пропуска), чтобы запустить его явно
  - Перед проверкой использует уже экспортированные переменные окружения провайдера
  - По умолчанию отдает приоритет действующим ключам API из переменных окружения перед сохраненными профилями аутентификации, чтобы устаревшие тестовые ключи в `auth-profiles.json` не скрывали реальные учетные данные оболочки
  - Пропускает провайдеров без пригодных данных аутентификации, профиля или модели
  - По умолчанию запускает только `generate`
  - Задайте `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, чтобы также запускать заявленные режимы преобразования, когда они доступны:
    - `imageToVideo`, когда провайдер заявляет `capabilities.imageToVideo.enabled`, а выбранные провайдер и модель принимают в общем прогоне локальное изображение из буфера
    - `videoToVideo`, когда провайдер заявляет `capabilities.videoToVideo.enabled`, а выбранные провайдер и модель принимают в общем прогоне локальное видео из буфера
  - Текущий заявленный, но пропускаемый провайдер `imageToVideo` в общем прогоне:
    - `vydra` (локальный ввод изображения из буфера не поддерживается в этом сценарии)
  - Покрытие, специфичное для провайдера Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Этот файл запускает `veo3` для преобразования текста в видео, а также сценарий `kling` для преобразования изображения в видео, который по умолчанию использует фикстуру с удаленным URL изображения (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` для переопределения).
  - Покрытие, специфичное для провайдера xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Классический сценарий сначала создает квадратный локальный первый кадр в формате PNG, не задает геометрию, запрашивает секундный клип преобразования изображения в видео, опрашивает состояние до завершения и проверяет загруженный буфер.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Сценарий 1.5 создает локальный первый кадр в формате PNG, запрашивает секундный клип преобразования изображения в видео с разрешением 1080P, опрашивает состояние до завершения и проверяет загруженный буфер.
  - Текущее тестовое покрытие `videoToVideo` с реальным сервисом:
    - `runway` только когда выбранная модель разрешается в `gen4_aleph`
  - Текущие заявленные, но пропускаемые провайдеры `videoToVideo` в общем прогоне:
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, поскольку этим путям сейчас требуются удаленные URL-адреса ссылок `http(s)`, а не локальный ввод из буфера
- Необязательное сужение:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, чтобы включить в прогон по умолчанию всех провайдеров, включая FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, чтобы уменьшить ограничение количества операций каждого провайдера для интенсивного дымового тестирования
- Необязательное поведение аутентификации:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, чтобы принудительно использовать аутентификацию из хранилища профилей и игнорировать переопределения, заданные только через переменные окружения

## Среда тестирования с реальными медиасервисами

- Команда: `pnpm test:live:media`
- Точка входа: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, которая запускает `pnpm test:live -- <suite-test-file>` для каждого выбранного набора, чтобы поведение Heartbeat и тихого режима оставалось согласованным с другими запусками `pnpm test:live`.
- Назначение:
  - Запускает общие наборы тестов изображений, музыки и видео с реальными сервисами через единую нативную для репозитория точку входа
  - Автоматически загружает отсутствующие переменные окружения провайдера из `~/.profile`
  - По умолчанию автоматически ограничивает каждый набор провайдерами, для которых сейчас доступны пригодные данные аутентификации
- Флаги:
  - `--providers <csv>` — глобальный фильтр провайдеров; `--image-providers` / `--music-providers` / `--video-providers` ограничивают фильтр одним набором
  - `--all-providers` отключает автоматическую фильтрацию по данным аутентификации
  - `--allow-empty` завершает работу с кодом `0`, если после фильтрации не остается доступных для запуска провайдеров
  - `--quiet` / `--no-quiet` передаются в `test:live`
- Примеры:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Связанные материалы

- [Тестирование](/ru/help/testing) — модульные, интеграционные, QA- и Docker-наборы тестов
