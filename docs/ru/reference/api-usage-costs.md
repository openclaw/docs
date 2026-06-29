---
read_when:
    - Вы хотите понять, какие функции могут вызывать платные API
    - Необходимо проверить ключи, затраты и видимость использования
    - Вы объясняете отчетность по стоимости /status или /usage
summary: Проверяйте, что может тратить деньги, какие ключи используются и как просматривать использование
title: Использование API и расходы
x-i18n:
    generated_at: "2026-06-28T23:42:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Этот документ перечисляет **функции, которые могут вызывать ключи API**, и где отображаются их затраты. Он сосредоточен на
функциях OpenClaw, которые могут создавать использование провайдеров или платные вызовы API.

## Где отображаются затраты (чат + CLI)

**Снимок стоимости за сеанс**

- `/status` показывает текущую модель сеанса, использование контекста и токены последнего ответа.
- Если у OpenClaw есть метаданные использования и локальные цены для активной модели,
  `/status` также показывает **оценочную стоимость** последнего ответа. Это может включать
  явно оцененные провайдеры без ключей API, такие как модели Bedrock `aws-sdk`.
- Если метаданных живого сеанса мало, `/status` может восстановить счетчики токенов/кеша
  и метку активной модели рантайма из последней записи использования в транскрипте. Существующие ненулевые живые значения
  по-прежнему имеют приоритет, а суммарные значения транскрипта размером с промпт
  могут победить, когда сохраненные итоги отсутствуют или меньше.

**Футер стоимости для каждого сообщения**

- `/usage full` добавляет футер использования к каждому ответу, включая **оценочную стоимость**,
  когда для активной модели настроены локальные цены и доступны метаданные использования.
- `/usage tokens` показывает только токены; OAuth/токенные и CLI-потоки в стиле подписки
  по-прежнему показывают только токены, если этот рантайм не предоставляет совместимые метаданные использования
  и не настроена явная локальная цена.
- Примечание Gemini CLI: стандартный вывод `stream-json` и устаревшие переопределения JSON
  оба читают использование из `stats`, нормализуют `stats.cached` в `cacheRead` и
  при необходимости выводят входные токены из `stats.input_tokens - stats.cached`.

Примечание Anthropic: сотрудники Anthropic сообщили нам, что использование Claude CLI в стиле OpenClaw
снова разрешено, поэтому OpenClaw считает повторное использование Claude CLI и использование `claude -p`
разрешенными для этой интеграции, если Anthropic не опубликует новую политику.
Anthropic по-прежнему не предоставляет долларовую оценку для каждого сообщения, которую OpenClaw может
показывать в `/usage full`.

**Окна использования CLI (квоты провайдеров)**

- `openclaw status --usage` и `openclaw channels list` показывают **окна использования** провайдера
  (снимки квот, а не стоимость каждого сообщения).
- Человекочитаемый вывод нормализован до `X% left` для всех провайдеров.
- Текущие провайдеры окон использования: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi и z.ai.
- Примечание MiniMax: его необработанные поля `usage_percent` / `usagePercent` означают оставшуюся
  квоту, поэтому OpenClaw инвертирует их перед отображением. Поля на основе счетчиков по-прежнему имеют приоритет,
  когда присутствуют. Если провайдер возвращает `model_remains`, OpenClaw предпочитает
  запись чат-модели, при необходимости выводит метку окна из временных меток и
  включает имя модели в метку плана.
- Аутентификация использования для этих окон квот поступает из хуков конкретного провайдера, когда
  они доступны; иначе OpenClaw откатывается к сопоставлению учетных данных OAuth/ключей API
  из профилей аутентификации, env или конфигурации.

См. [Использование токенов и затраты](/ru/reference/token-use) для подробностей и примеров.

## Как обнаруживаются ключи

OpenClaw может подхватывать учетные данные из:

- **Профилей аутентификации** (для каждого агента, хранятся в `auth-profiles.json`).
- **Переменных окружения** (например, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Конфигурации** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), которые могут экспортировать ключи в env процесса Skills.

## Функции, которые могут тратить ключи

### 1) Ответы основной модели (чат + инструменты)

Каждый ответ или вызов инструмента использует **текущего провайдера модели** (OpenAI, Anthropic и т. д.). Это
основной источник использования и затрат.

Сюда также входят размещенные провайдеры в стиле подписки, которые по-прежнему выставляют счета вне
локального UI OpenClaw, такие как **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** и
путь входа Anthropic Claude в OpenClaw с включенным **Extra Usage**.

См. [Модели](/ru/providers/models) для конфигурации цен и [Использование токенов и затраты](/ru/reference/token-use) для отображения.

### 2) Понимание медиа (аудио/изображение/видео)

Входящие медиа могут быть суммаризированы/транскрибированы до запуска ответа. Это использует API моделей/провайдеров.

- Аудио: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Изображение: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Видео: Google / Qwen / Moonshot.

См. [Понимание медиа](/ru/nodes/media-understanding).

### 3) Генерация изображений и видео

Общие возможности генерации также могут тратить ключи провайдеров:

- Генерация изображений: OpenAI / Google / DeepInfra / fal / MiniMax
- Генерация видео: DeepInfra / Qwen

Генерация изображений может вывести стандартного провайдера на основе аутентификации, когда
`agents.defaults.imageGenerationModel` не задан. Генерация видео сейчас
требует явного `agents.defaults.videoGenerationModel`, такого как
`qwen/wan2.6-t2v`.

См. [Генерация изображений](/ru/tools/image-generation), [Qwen Cloud](/ru/providers/qwen)
и [Модели](/ru/concepts/models).

### 4) Эмбеддинги памяти + семантический поиск

Семантический поиск по памяти использует **API эмбеддингов**, когда настроен для удаленных провайдеров:

- `memorySearch.provider = "openai"` → эмбеддинги OpenAI
- `memorySearch.provider = "gemini"` → эмбеддинги Gemini
- `memorySearch.provider = "voyage"` → эмбеддинги Voyage
- `memorySearch.provider = "mistral"` → эмбеддинги Mistral
- `memorySearch.provider = "deepinfra"` → эмбеддинги DeepInfra
- `memorySearch.provider = "lmstudio"` → эмбеддинги LM Studio (локально/самостоятельно размещено)
- `memorySearch.provider = "ollama"` → эмбеддинги Ollama (локально/самостоятельно размещено; обычно без оплаты размещенного API)
- Необязательный откат к удаленному провайдеру, если локальные эмбеддинги завершаются ошибкой

Вы можете оставить это локальным с `memorySearch.provider = "local"` (без использования API).

См. [Память](/ru/concepts/memory).

### 5) Инструмент веб-поиска

`web_search` может повлечь оплату использования в зависимости от вашего провайдера:

- **Brave Search API**: `BRAVE_API_KEY` или `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` или `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` или `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` или `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: профиль OAuth xAI, `XAI_API_KEY` или `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` или `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` или `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: без ключа для доступного локального хоста Ollama с выполненным входом; прямой поиск `https://ollama.com` использует `OLLAMA_API_KEY`, а хосты с защитой аутентификацией могут повторно использовать обычную bearer-аутентификацию провайдера Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` или `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` или `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: провайдер без ключа при явном выборе (без оплаты API, но неофициальный и основанный на HTML)
- **SearXNG**: `SEARXNG_BASE_URL` или `plugins.entries.searxng.config.webSearch.baseUrl` (без ключа/самостоятельно размещено; без оплаты размещенного API)

Устаревшие пути провайдера `tools.web.search.*` по-прежнему загружаются через временный shim совместимости, но они больше не являются рекомендуемой поверхностью конфигурации.

**Бесплатный кредит Brave Search:** Каждый тариф Brave включает \$5/месяц обновляемого
бесплатного кредита. Тариф Search стоит \$5 за 1 000 запросов, поэтому кредит покрывает
1 000 запросов/месяц бесплатно. Задайте лимит использования в панели Brave,
чтобы избежать неожиданных списаний.

См. [Веб-инструменты](/ru/tools/web).

### 5) Инструмент веб-загрузки (Firecrawl)

`web_fetch` может вызывать **Firecrawl** со стартовым доступом без ключа. Добавьте ключ API
для более высоких лимитов:

- `FIRECRAWL_API_KEY` или `plugins.entries.firecrawl.config.webFetch.apiKey`

Если Firecrawl не настроен, инструмент откатывается к прямой загрузке плюс встроенный Plugin `web-readability` (без платного API). Отключите `plugins.entries.web-readability.enabled`, чтобы пропустить локальное извлечение Readability.

См. [Веб-инструменты](/ru/tools/web).

### 6) Снимки использования провайдера (статус/работоспособность)

Некоторые команды статуса вызывают **эндпоинты использования провайдера**, чтобы показать окна квот или состояние аутентификации.
Обычно это малый объем вызовов, но они все равно обращаются к API провайдера:

- `openclaw status --usage`
- `openclaw models status --json`

См. [CLI моделей](/ru/cli/models).

### 7) Суммаризация защитного механизма Compaction

Защитный механизм Compaction может суммаризировать историю сеанса с помощью **текущей модели**, что
вызывает API провайдера при выполнении.

См. [Управление сеансом + Compaction](/ru/reference/session-management-compaction).

### 8) Сканирование / проба моделей

`openclaw models scan` может проверять модели OpenRouter и использует `OPENROUTER_API_KEY`, когда
проверка включена.

См. [CLI моделей](/ru/cli/models).

### 9) Разговор (речь)

Режим разговора может вызывать **ElevenLabs**, когда он настроен:

- `ELEVENLABS_API_KEY` или `talk.providers.elevenlabs.apiKey`

См. [Режим разговора](/ru/nodes/talk).

### 10) Skills (сторонние API)

Skills могут хранить `apiKey` в `skills.entries.<name>.apiKey`. Если Skills использует этот ключ для внешних
API, это может повлечь затраты согласно провайдеру Skills.

См. [Skills](/ru/tools/skills).

## Связанные материалы

- [Использование токенов и затраты](/ru/reference/token-use)
- [Кеширование промптов](/ru/reference/prompt-caching)
- [Отслеживание использования](/ru/concepts/usage-tracking)
