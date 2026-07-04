---
read_when:
    - Вам нужен справочник по настройке моделей для каждого провайдера
    - Вам нужны примеры конфигураций или команды онбординга CLI для поставщиков моделей
sidebarTitle: Model providers
summary: Обзор поставщиков моделей с примерами конфигураций и сценариями CLI
title: Поставщики моделей
x-i18n:
    generated_at: "2026-07-04T03:59:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

Справочник по **провайдерам LLM/моделей** (не чат-каналам вроде WhatsApp/Telegram). Правила выбора моделей см. в [Модели](/ru/concepts/models).

## Краткие правила

<AccordionGroup>
  <Accordion title="Ссылки на модели и помощники CLI">
    - Ссылки на модели используют формат `provider/model` (пример: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` при задании работает как список разрешенных моделей.
    - Помощники CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` задают значения по умолчанию на уровне провайдера; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` переопределяют их для отдельной модели.
    - Правила резервного переключения, проверки cooldown и сохранение переопределений сеанса: [Резервное переключение моделей](/ru/concepts/model-failover).

  </Accordion>
  <Accordion title="Добавление аутентификации провайдера не меняет вашу основную модель">
    `openclaw configure` сохраняет существующее значение `agents.defaults.model.primary`, когда вы добавляете провайдера или повторно проходите аутентификацию. `openclaw models auth login` делает то же самое, если не передать `--set-default`. Plugin провайдера все еще может вернуть рекомендованную модель по умолчанию в своем патче конфигурации аутентификации, но OpenClaw трактует это как «сделать эту модель доступной», если основная модель уже существует, а не как «заменить текущую основную модель».

    Чтобы намеренно переключить модель по умолчанию, используйте `openclaw models set <provider/model>` или `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Разделение провайдера и runtime для OpenAI">
    Маршруты семейства OpenAI зависят от префикса:

    - `openai/<model>` по умолчанию использует нативный harness сервера приложений Codex для ходов агента. Это обычная схема для подписки ChatGPT/Codex.
    - устаревшие ссылки на модели Codex являются устаревшей конфигурацией, которую doctor переписывает в `openai/<model>`.
    - `openai/<model>` плюс `agentRuntime.id: "openclaw"` на уровне провайдера/модели использует встроенный runtime OpenClaw для явных маршрутов с API-ключом или совместимостью.

    См. [OpenAI](/ru/providers/openai) и [harness Codex](/ru/plugins/codex-harness). Если разделение провайдера и runtime непонятно, сначала прочитайте [Runtime агентов](/ru/concepts/agent-runtimes).

    Автовключение Plugin следует той же границе: ссылки агентов `openai/*` включают Plugin Codex для маршрута по умолчанию, а явное `agentRuntime.id: "codex"` на уровне провайдера/модели или устаревшие ссылки `codex/<model>` также требуют его.

    GPT-5.5 по умолчанию доступен через нативный harness сервера приложений Codex на `openai/gpt-5.5`, а через runtime OpenClaw — когда политика runtime на уровне провайдера/модели явно выбирает `openclaw`.

  </Accordion>
  <Accordion title="CLI runtime">
    CLI runtime используют то же разделение: выберите канонические ссылки на модели, такие как `anthropic/claude-*` или `google/gemini-*`, затем задайте политику runtime на уровне провайдера/модели как `claude-cli` или `google-gemini-cli`, когда нужен локальный backend CLI.

    Устаревшие ссылки `claude-cli/*` и `google-gemini-cli/*` мигрируют обратно к каноническим ссылкам провайдера с отдельной записью runtime. Устаревшие ссылки `codex-cli/*` мигрируют в `openai/*` и используют маршрут сервера приложений Codex; OpenClaw больше не сохраняет встроенный backend Codex CLI.

  </Accordion>
</AccordionGroup>

## Поведение провайдера, принадлежащее Plugin

Большая часть логики, специфичной для провайдера, находится в Plugin провайдеров (`registerProvider(...)`), тогда как OpenClaw сохраняет общий цикл inference. Plugin владеют onboarding, каталогами моделей, сопоставлением env var для аутентификации, нормализацией транспорта/конфигурации, очисткой схем инструментов, классификацией failover, обновлением OAuth, отчетами об использовании, профилями thinking/reasoning и многим другим.

Полный список хуков provider-SDK и примеров встроенных Plugin находится в [Plugin провайдеров](/ru/plugins/sdk-provider-plugins). Провайдер, которому нужен полностью пользовательский исполнитель запросов, является отдельной, более глубокой поверхностью расширения.

<Note>
Поведение runner, принадлежащее провайдеру, находится в явных хуках провайдера, таких как политика replay, нормализация схем инструментов, оборачивание потока и помощники транспорта/запросов. Устаревший статический набор `ProviderPlugin.capabilities` предназначен только для совместимости и больше не читается общей логикой runner.
</Note>

## Ротация API-ключей

<AccordionGroup>
  <Accordion title="Источники ключей и приоритет">
    Настройте несколько ключей через:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одиночное live-переопределение, наивысший приоритет)
    - `<PROVIDER>_API_KEYS` (список через запятую или точку с запятой)
    - `<PROVIDER>_API_KEY` (основной ключ)
    - `<PROVIDER>_API_KEY_*` (нумерованный список, например `<PROVIDER>_API_KEY_1`)

    Для провайдеров Google `GOOGLE_API_KEY` также включается как fallback. Порядок выбора ключей сохраняет приоритет и удаляет дубликаты значений.

  </Accordion>
  <Accordion title="Когда включается ротация">
    - Запросы повторяются со следующим ключом только при ответах rate limit (например, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` или периодических сообщениях о лимите использования).
    - Ошибки, не связанные с rate limit, завершаются немедленно; ротация ключей не выполняется.
    - Когда все ключи-кандидаты завершаются неудачно, возвращается финальная ошибка из последней попытки.

  </Accordion>
</AccordionGroup>

## Официальные Plugin провайдеров

Официальные Plugin провайдеров публикуют собственные строки каталога моделей. Этим провайдерам **не нужны** записи моделей `models.providers`; включите Plugin провайдера, задайте аутентификацию и выберите модель. Используйте `models.providers` только для явных пользовательских провайдеров или узких настроек запросов, таких как тайм-ауты.

### OpenAI

- Провайдер: `openai`
- Аутентификация: `OPENAI_API_KEY`
- Необязательная ротация: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, плюс `OPENCLAW_LIVE_OPENAI_KEY` (одиночное переопределение)
- Примеры моделей: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Проверяйте доступность аккаунта/модели с помощью `openclaw models list --provider openai`, если конкретная установка или API-ключ ведет себя иначе.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Транспорт по умолчанию — `auto`; OpenClaw передает выбор транспорта в общий runtime модели.
- Переопределение для отдельной модели через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` или `"auto"`)
- Приоритетную обработку OpenAI можно включить через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` и `params.fastMode` сопоставляют прямые запросы Responses `openai/*` с `service_tier=priority` на `api.openai.com`
- Используйте `params.serviceTier`, когда нужен явный уровень вместо общего переключателя `/fast`
- Скрытые заголовки атрибуции OpenClaw (`originator`, `version`, `User-Agent`) применяются только к нативному трафику OpenAI на `api.openai.com`, а не к универсальным OpenAI-совместимым прокси
- Нативные маршруты OpenAI также сохраняют Responses `store`, подсказки prompt-cache и формирование payload, совместимое с reasoning OpenAI; прокси-маршруты этого не делают
- `openai/gpt-5.3-codex-spark` доступен через аутентификацию подписки ChatGPT/Codex OAuth, когда ваш вошедший аккаунт его предоставляет; OpenClaw все еще подавляет прямые маршруты OpenAI API-key и Azure API-key для этой модели, потому что эти транспорты ее отклоняют

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Провайдер: `anthropic`
- Аутентификация: `ANTHROPIC_API_KEY`
- Необязательная ротация: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, плюс `OPENCLAW_LIVE_ANTHROPIC_KEY` (одиночное переопределение)
- Пример модели: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямые публичные запросы Anthropic поддерживают общий переключатель `/fast` и `params.fastMode`, включая трафик с API-ключом и OAuth-аутентификацией, отправленный на `api.anthropic.com`; OpenClaw сопоставляет это с Anthropic `service_tier` (`auto` против `standard_only`)
- Предпочтительная конфигурация Claude CLI сохраняет ссылку на модель канонической и выбирает CLI
  backend отдельно: `anthropic/claude-opus-4-8` с
  `agentRuntime.id: "claude-cli"` в области модели. Устаревшие
  ссылки `claude-cli/claude-opus-4-7` все еще работают для совместимости.

<Note>
Сотрудники Anthropic сообщили нам, что использование Claude CLI в стиле OpenClaw снова разрешено, поэтому OpenClaw считает повторное использование Claude CLI и использование `claude -p` санкционированными для этой интеграции, если Anthropic не опубликует новую политику. setup-token Anthropic остается доступным как поддерживаемый путь токена OpenClaw, но теперь OpenClaw предпочитает повторное использование Claude CLI и `claude -p`, когда они доступны.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Провайдер: `openai`
- Аутентификация: OAuth (ChatGPT)
- Устаревшая ссылка на модель OpenAI Codex: `openai/gpt-5.5`
- Ссылка нативного harness сервера приложений Codex: `openai/gpt-5.5`
- Документация нативного harness сервера приложений Codex: [harness Codex](/ru/plugins/codex-harness)
- Устаревшие ссылки на модели: `codex/gpt-*`
- Граница Plugin: `openai/*` загружает Plugin OpenAI; нативный Plugin сервера приложений Codex выбирается runtime harness Codex.
- CLI: `openclaw onboard --auth-choice openai` или `openclaw models auth login --provider openai`
- Транспорт по умолчанию — `auto` (сначала WebSocket, fallback на SSE)
- Переопределение для отдельной модели OpenAI Codex через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` или `"auto"`)
- `params.serviceTier` также передается в нативных запросах Codex Responses (`chatgpt.com/backend-api`)
- Скрытые заголовки атрибуции OpenClaw (`originator`, `version`, `User-Agent`) добавляются только к нативному трафику Codex на `chatgpt.com/backend-api`, а не к универсальным OpenAI-совместимым прокси
- Использует тот же переключатель `/fast` и конфигурацию `params.fastMode`, что и прямой `openai/*`; OpenClaw сопоставляет это с `service_tier=priority`
- `openai/gpt-5.5` использует нативные значения каталога Codex `contextWindow = 400000` и runtime по умолчанию `contextTokens = 272000`; переопределите ограничение runtime через `models.providers.openai.models[].contextTokens`
- Примечание о политике: OpenAI Codex OAuth явно поддерживается для внешних инструментов/рабочих процессов вроде OpenClaw.
- Для обычного маршрута подписка плюс нативный runtime Codex войдите через аутентификацию `openai` и настройте `openai/gpt-5.5`; ходы агента OpenAI по умолчанию выбирают Codex.
- Используйте `agentRuntime.id: "openclaw"` на уровне провайдера/модели только когда нужен встроенный маршрут OpenClaw; иначе оставьте `openai/gpt-5.5` на harness Codex по умолчанию.
- устаревшие ссылки Codex GPT являются устаревшим состоянием, а не live-маршрутом провайдера. Используйте `openai/gpt-5.5` на нативном runtime Codex для новой конфигурации агента и запустите `openclaw doctor --fix`, чтобы мигрировать старые устаревшие ссылки на модели Codex в канонические ссылки `openai/*`.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Другие размещенные варианты в стиле подписки

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/ru/providers/zai">
    Z.AI Coding Plan или общие API endpoints.
  </Card>
  <Card title="MiniMax" href="/ru/providers/minimax">
    OAuth MiniMax Coding Plan или доступ по API-ключу.
  </Card>
  <Card title="Qwen Cloud" href="/ru/providers/qwen">
    Поверхность провайдера Qwen Cloud плюс сопоставление Alibaba DashScope и endpoint Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Аутентификация: `OPENCODE_API_KEY` (или `OPENCODE_ZEN_API_KEY`)
- Провайдер Zen runtime: `opencode`
- Провайдер Go runtime: `opencode-go`
- Примеры моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` или `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-ключ)

- Провайдер: `google`
- Аутентификация: `GEMINI_API_KEY`
- Необязательная ротация: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервный `GOOGLE_API_KEY` и `OPENCLAW_LIVE_GEMINI_KEY` (одиночное переопределение)
- Примеры моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Совместимость: устаревшая конфигурация OpenClaw, использующая `google/gemini-3.1-flash-preview`, нормализуется в `google/gemini-3-flash-preview`
- Псевдоним: `google/gemini-3.1-pro` принимается и нормализуется в актуальный идентификатор Google Gemini API, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Мышление: `/think adaptive` использует динамическое мышление Google. Gemini 3/3.1 не указывают фиксированный `thinkingLevel`; Gemini 2.5 отправляет `thinkingBudget: -1`.
- Прямые запуски Gemini также принимают `agents.defaults.models["google/<model>"].params.cachedContent` (или устаревшее `cached_content`) для передачи собственного для провайдера дескриптора `cachedContents/...`; попадания в кэш Gemini отображаются как OpenClaw `cacheRead`

### Google Vertex и Gemini CLI

- Провайдеры: `google-vertex`, `google-gemini-cli`
- Аутентификация: Vertex использует gcloud ADC; Gemini CLI использует свой OAuth-поток

<Warning>
Gemini CLI OAuth в OpenClaw является неофициальной интеграцией. Некоторые пользователи сообщали об ограничениях аккаунта Google после использования сторонних клиентов. Ознакомьтесь с условиями Google и используйте некритичный аккаунт, если решите продолжить.
</Warning>

Gemini CLI OAuth поставляется как часть встроенного Plugin `google`.

<Steps>
  <Step title="Установите Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Включите Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Войдите">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Модель по умолчанию: `google-gemini-cli/gemini-3-flash-preview`. Вы **не** вставляете client id или secret в `openclaw.json`. Поток входа CLI сохраняет токены в профилях аутентификации на хосте Gateway.

  </Step>
  <Step title="Задайте проект (если нужно)">
    Если запросы завершаются ошибкой после входа, задайте `GOOGLE_CLOUD_PROJECT` или `GOOGLE_CLOUD_PROJECT_ID` на хосте Gateway.
  </Step>
</Steps>

Gemini CLI по умолчанию использует `stream-json`. OpenClaw читает потоковые
сообщения ассистента и нормализует `stats.cached` в `cacheRead`; устаревшие
переопределения `--output-format json` по-прежнему читают текст ответа из `response`.

### Z.AI (GLM)

- Провайдер: `zai`
- Аутентификация: `ZAI_API_KEY`
- Пример модели: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Ссылки на модели используют канонический идентификатор провайдера `zai/*`.
  - `zai-api-key` автоматически определяет соответствующий эндпоинт Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` и `zai-cn` принудительно выбирают конкретную поверхность

### Vercel AI Gateway

- Провайдер: `vercel-ai-gateway`
- Аутентификация: `AI_GATEWAY_API_KEY`
- Примеры моделей: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Другие встроенные Plugin провайдеров

| Провайдер                               | Id                               | Env аутентификации                                  | Пример модели                                             |
| --------------------------------------- | -------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                  | `byteplus-plan/ark-code-latest`                           |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                | `clawrouter/anthropic/claude-sonnet-4-6`                  |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                    | `cohere/command-a-03-2025`                                |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` или `HF_TOKEN`              | `huggingface/deepseek-ai/DeepSeek-R1`                     |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`           | `minimax/MiniMax-M3`                                      |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                   | `mistral/mistral-large-latest`                            |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                  | `moonshot/kimi-k2.6`                                      |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                    | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                    | `novita/deepseek/deepseek-v3-0324`                        |
| [Ollama Cloud](/ru/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                    | `ollama-cloud/kimi-k2.6`                                  |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth или `OPENROUTER_API_KEY`           | `openrouter/auto`                                         |
| [Qwen OAuth](/ru/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                      | `qwen-oauth/qwen3.5-plus`                                 |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                  | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`        |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                    | -                                                         |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                | `vercel-ai-gateway/anthropic/claude-opus-4.6`             |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                            | `volcengine-plan/ark-code-latest`                         |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth или `XAI_API_KEY`         | `xai/grok-4.3`                                            |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`      | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Особенности, о которых стоит знать

<AccordionGroup>
  <Accordion title="OpenRouter">
    Применяет свои заголовки атрибуции приложения и маркеры Anthropic `cache_control` только на проверенных маршрутах `openrouter.ai`. Ссылки DeepSeek, Moonshot и ZAI подходят для TTL кэша при кэшировании промптов, управляемом OpenRouter, но не получают маркеры кэша Anthropic. Как путь в стиле прокси, совместимый с OpenAI, он пропускает формирование, предназначенное только для нативного OpenAI (`serviceTier`, Responses `store`, подсказки prompt-cache, совместимость с reasoning OpenAI). Ссылки на базе Gemini сохраняют только очистку сигнатуры мыслей proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Ссылки на базе Gemini следуют тому же пути очистки proxy-Gemini; `kilocode/kilo/auto` и другие ссылки без поддержки proxy-reasoning пропускают внедрение proxy reasoning.
  </Accordion>
  <Accordion title="MiniMax">
    Онбординг по API-ключу записывает явные определения чат-моделей M3 и M2.7; понимание изображений остается на медиа-провайдере `MiniMax-VL-01`, принадлежащем Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Идентификаторы моделей используют пространство имен `nvidia/<vendor>/<model>` (например, `nvidia/nvidia/nemotron-...` вместе с `nvidia/moonshotai/kimi-k2.5`); селекторы сохраняют буквальную композицию `<provider>/<model-id>`, а канонический ключ, отправляемый в API, остается с одним префиксом.
  </Accordion>
  <Accordion title="xAI">
    Использует путь xAI Responses. Рекомендуемый путь — SuperGrok/X Premium OAuth; API-ключи по-прежнему работают через `XAI_API_KEY` или конфигурацию Plugin, а Grok `web_search` повторно использует тот же профиль аутентификации перед резервным переходом к API-ключу. `grok-4.3` является встроенной чат-моделью по умолчанию, а `grok-build-0.1` можно выбрать для работы, ориентированной на сборку/кодинг. `/fast` или `params.fastMode: true` переписывает `grok-3`, `grok-3-mini`, `grok-4` и `grok-4-0709` в их варианты `*-fast`. `tool_stream` включен по умолчанию; отключайте через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Провайдеры через `models.providers` (пользовательский/base URL)

Используйте `models.providers` (или `models.json`), чтобы добавить **пользовательских** провайдеров или OpenAI/Anthropic-совместимые прокси.

Многие из перечисленных ниже встроенных плагинов провайдеров уже публикуют каталог по умолчанию. Используйте явные записи `models.providers.<id>` только если нужно переопределить базовый URL, заголовки или список моделей.

Проверки возможностей моделей Gateway также читают явные метаданные `models.providers.<id>.models[]`. Если пользовательская или прокси-модель принимает изображения, задайте для этой модели `input: ["text", "image"]`, чтобы WebChat и пути вложений от узлов передавали изображения как нативные входные данные модели, а не как текстовые ссылки на медиа.

`agents.defaults.models["provider/model"]` управляет только видимостью модели, псевдонимами и метаданными отдельных моделей для агентов. Сам по себе он не регистрирует новую runtime-модель. Для пользовательских моделей провайдера также добавьте `models.providers.<provider>.models[]` как минимум с соответствующим `id`.

### Moonshot AI (Kimi)

Установите `@openclaw/moonshot-provider` перед онбордингом. Добавляйте явную запись `models.providers.moonshot` только если нужно переопределить базовый URL или метаданные модели:

- Провайдер: `moonshot`
- Аутентификация: `MOONSHOT_API_KEY`
- Пример модели: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` или `openclaw onboard --auth-choice moonshot-api-key-cn`

Идентификаторы моделей Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi для кодинга

Kimi Coding использует совместимый с Anthropic endpoint Moonshot AI:

- Провайдер: `kimi`
- Аутентификация: `KIMI_API_KEY`
- Пример модели: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Устаревшие `kimi/kimi-code` и `kimi/k2p5` по-прежнему принимаются как совместимые идентификаторы моделей и нормализуются в стабильный идентификатор API-модели Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) предоставляет доступ к Doubao и другим моделям в Китае.

- Провайдер: `volcengine` (кодинг: `volcengine-plan`)
- Аутентификация: `VOLCANO_ENGINE_API_KEY`
- Пример модели: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

При онбординге по умолчанию используется поверхность для кодинга, но общий каталог `volcengine/*` регистрируется одновременно.

В средствах выбора моделей при онбординге/настройке вариант аутентификации Volcengine предпочитает строки как `volcengine/*`, так и `volcengine-plan/*`. Если эти модели еще не загружены, OpenClaw использует нефильтрованный каталог вместо того, чтобы показывать пустой выбор моделей, ограниченный поставщиком.

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (международный)

BytePlus ARK предоставляет международным пользователям доступ к тем же моделям, что и Volcano Engine.

- Поставщик: `byteplus` (кодинг: `byteplus-plan`)
- Аутентификация: `BYTEPLUS_API_KEY`
- Пример модели: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

При онбординге по умолчанию используется поверхность для кодинга, но общий каталог `byteplus/*` регистрируется одновременно.

В средствах выбора моделей при онбординге/настройке вариант аутентификации BytePlus предпочитает строки как `byteplus/*`, так и `byteplus-plan/*`. Если эти модели еще не загружены, OpenClaw использует нефильтрованный каталог вместо того, чтобы показывать пустой выбор моделей, ограниченный поставщиком.

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic предоставляет Anthropic-совместимые модели через поставщика `synthetic`:

- Поставщик: `synthetic`
- Аутентификация: `SYNTHETIC_API_KEY`
- Пример модели: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax настраивается через `models.providers`, потому что использует пользовательские конечные точки:

- MiniMax OAuth (глобальный): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (Китай): `--auth-choice minimax-cn-oauth`
- API-ключ MiniMax (глобальный): `--auth-choice minimax-global-api`
- API-ключ MiniMax (Китай): `--auth-choice minimax-cn-api`
- Аутентификация: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` или `MINIMAX_API_KEY` для `minimax-portal`

См. [/providers/minimax](/ru/providers/minimax) для подробностей настройки, вариантов моделей и фрагментов конфигурации.

<Note>
На Anthropic-совместимом потоковом пути MiniMax OpenClaw по умолчанию отключает thinking для семейства M2.x, если вы не зададите его явно; MiniMax-M3 (и M3.x) по умолчанию остается на пути поставщика с опущенным/адаптивным thinking. `/fast on` переписывает `MiniMax-M2.7` в `MiniMax-M2.7-highspeed`.
</Note>

Разделение возможностей, принадлежащее Plugin:

- Значения по умолчанию для текста/чата остаются на `minimax/MiniMax-M3`
- Генерация изображений — `minimax/image-01` или `minimax-portal/image-01`
- Понимание изображений — принадлежащая Plugin модель `MiniMax-VL-01` на обоих путях аутентификации MiniMax
- Веб-поиск остается на идентификаторе поставщика `minimax`

### LM Studio

LM Studio поставляется как встроенный Plugin поставщика, который использует нативный API:

- Поставщик: `lmstudio`
- Аутентификация: `LM_API_TOKEN`
- Базовый URL вывода по умолчанию: `http://localhost:1234/v1`

Затем задайте модель (замените на один из идентификаторов, возвращаемых `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw использует нативные `/api/v1/models` и `/api/v1/models/load` LM Studio для обнаружения и автозагрузки, а `/v1/chat/completions` по умолчанию — для вывода. Если вы хотите, чтобы JIT-загрузка LM Studio, TTL и автоматическое вытеснение управляли жизненным циклом модели, задайте `models.providers.lmstudio.params.preload: false`. См. [/providers/lmstudio](/ru/providers/lmstudio) для настройки и устранения неполадок.

### Ollama

Ollama поставляется как встроенный Plugin поставщика и использует нативный API Ollama:

- Поставщик: `ollama`
- Аутентификация: не требуется (локальный сервер)
- Пример модели: `ollama/llama3.3`
- Установка: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama обнаруживается локально по адресу `http://127.0.0.1:11434`, когда вы включаете ее через `OLLAMA_API_KEY`, а встроенный Plugin поставщика добавляет Ollama напрямую в `openclaw onboard` и средство выбора моделей. См. [/providers/ollama](/ru/providers/ollama) для онбординга, облачного/локального режима и пользовательской конфигурации.

### vLLM

vLLM поставляется как встроенный Plugin поставщика для локальных или самостоятельно размещенных OpenAI-совместимых серверов:

- Поставщик: `vllm`
- Аутентификация: необязательно (зависит от вашего сервера)
- Базовый URL по умолчанию: `http://127.0.0.1:8000/v1`

Чтобы включить локальное автообнаружение (подойдет любое значение, если ваш сервер не требует аутентификацию):

```bash
export VLLM_API_KEY="vllm-local"
```

Затем задайте модель (замените на один из идентификаторов, возвращаемых `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

См. [/providers/vllm](/ru/providers/vllm) для подробностей.

### SGLang

SGLang поставляется как встроенный Plugin поставщика для быстрых самостоятельно размещенных OpenAI-совместимых серверов:

- Поставщик: `sglang`
- Аутентификация: необязательно (зависит от вашего сервера)
- Базовый URL по умолчанию: `http://127.0.0.1:30000/v1`

Чтобы включить локальное автообнаружение (подойдет любое значение, если ваш сервер не требует аутентификацию):

```bash
export SGLANG_API_KEY="sglang-local"
```

Затем задайте модель (замените на один из идентификаторов, возвращаемых `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

См. [/providers/sglang](/ru/providers/sglang) для подробностей.

### Локальные прокси (LM Studio, vLLM, LiteLLM и т. д.)

Пример (OpenAI-совместимый):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Default optional fields">
    Для пользовательских поставщиков `reasoning`, `input`, `cost`, `contextWindow` и `maxTokens` необязательны. Если они опущены, OpenClaw по умолчанию использует:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Рекомендуется: задавайте явные значения, соответствующие ограничениям вашего прокси/модели.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Для `api: "openai-completions"` на ненативных конечных точках (любой непустой `baseUrl`, хост которого не является `api.openai.com`) OpenClaw принудительно задает `compat.supportsDeveloperRole: false`, чтобы избежать ошибок поставщика 400 для неподдерживаемых ролей `developer`.
    - Прокси-маршруты в стиле OpenAI-совместимых также пропускают формирование запросов, предназначенное только для нативного OpenAI: без `service_tier`, без Responses `store`, без Completions `store`, без подсказок prompt-cache, без формирования полезной нагрузки совместимости OpenAI reasoning и без скрытых заголовков атрибуции OpenClaw.
    - Для OpenAI-совместимых прокси Completions, которым нужны поля конкретного поставщика, задайте `agents.defaults.models["provider/model"].params.extra_body` (или `extraBody`), чтобы объединить дополнительный JSON с телом исходящего запроса.
    - Для элементов управления chat-template vLLM задайте `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Встроенный Plugin vLLM автоматически отправляет `enable_thinking: false` и `force_nonempty_content: true` для `vllm/nemotron-3-*`, когда уровень thinking в сеансе выключен.
    - Для медленных локальных моделей или удаленных хостов LAN/tailnet задайте `models.providers.<id>.timeoutSeconds`. Это расширяет обработку HTTP-запросов к модели поставщика, включая подключение, заголовки, потоковую передачу тела и общее прерывание защищенной выборки, не увеличивая таймаут всего выполнения агента. Если `agents.defaults.timeoutSeconds` или таймаут конкретного запуска ниже, также поднимите этот предел; таймауты поставщика не могут продлить все выполнение.
    - HTTP-вызовы поставщика моделей разрешают DNS-ответы fake-IP от Surge, Clash и sing-box в `198.18.0.0/15` и `fc00::/7` только для настроенного имени хоста `baseUrl` поставщика. Пользовательские/локальные конечные точки поставщика также доверяют точно настроенному источнику `scheme://host:port` для защищенных запросов к модели, включая loopback, LAN и хосты tailnet. Это не новая настройка конфигурации; настроенный вами `baseUrl` расширяет политику запросов только для этого источника. Разрешение имени хоста fake-IP и доверие точному источнику — независимые механизмы. Другие частные, loopback, link-local, metadata назначения и другие порты по-прежнему требуют явного включения `models.providers.<id>.request.allowPrivateNetwork: true`. Задайте `models.providers.<id>.request.allowPrivateNetwork: false`, чтобы отказаться от доверия точному источнику.
    - Если `baseUrl` пустой/опущен, OpenClaw сохраняет поведение OpenAI по умолчанию (которое разрешается в `api.openai.com`).
    - Для безопасности явное `compat.supportsDeveloperRole: true` все равно переопределяется на ненативных конечных точках `openai-completions`.
    - Для `api: "anthropic-messages"` на непрямых конечных точках (любой поставщик, кроме канонического `anthropic`, или пользовательский `models.providers.anthropic.baseUrl`, хост которого не является публичной конечной точкой `api.anthropic.com`) OpenClaw подавляет неявные бета-заголовки Anthropic, такие как `claude-code-20250219`, `interleaved-thinking-2025-05-14`, и OAuth-маркеры, чтобы пользовательские Anthropic-совместимые прокси не отклоняли неподдерживаемые бета-флаги. Явно задайте `models.providers.<id>.headers["anthropic-beta"]`, если вашему прокси нужны определенные бета-функции.

  </Accordion>
</AccordionGroup>

## Примеры CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

См. также: [Конфигурация](/ru/gateway/configuration) для полных примеров конфигурации.

## Связанные материалы

- [Справочник по конфигурации](/ru/gateway/config-agents#agent-defaults) - ключи конфигурации моделей
- [Отказоустойчивое переключение моделей](/ru/concepts/model-failover) - цепочки fallback и поведение повторных попыток
- [Модели](/ru/concepts/models) - конфигурация моделей и псевдонимы
- [Поставщики](/ru/providers) - руководства по настройке для каждого поставщика
