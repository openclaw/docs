---
read_when:
    - Ви хочете зрозуміти, які функції можуть викликати платні API
    - Вам потрібно провести аудит ключів, витрат і видимості використання
    - Ви пояснюєте звітність про витрати в /status або /usage
summary: Аудит того, що може витрачати кошти, які ключі використовуються і як переглядати використання
title: Використання API та витрати
x-i18n:
    generated_at: "2026-04-23T21:09:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ff7f2116f4bb9b2ae7c29ac409d27a6f753bb6ecb214556f9f3238e5c3e0ca
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Використання API та витрати

Цей документ перелічує **функції, які можуть викликати API keys** і де відображаються їхні витрати. Він зосереджений на
функціях OpenClaw, які можуть генерувати використання провайдера або платні виклики API.

## Де відображаються витрати (чат + CLI)

**Знімок витрат для сесії**

- `/status` показує поточну модель сесії, використання контексту та токени останньої відповіді.
- Якщо модель використовує **автентифікацію через API key**, `/status` також показує **оцінену вартість** останньої відповіді.
- Якщо live-метадані сесії неповні, `/status` може відновити лічильники токенів/кешу
  і мітку активної runtime-моделі з останнього запису використання transcript.
  Наявні ненульові live-значення, як і раніше, мають пріоритет, а загальні значення з transcript, орієнтовані на розмір запиту,
  можуть перемагати, коли збережені загальні значення відсутні або менші.

**Футер витрат для кожного повідомлення**

- `/usage full` додає до кожної відповіді футер використання, включно з **оціненою вартістю** (лише для API key).
- `/usage tokens` показує лише токени; subscription-style OAuth/token та CLI-потоки приховують вартість у доларах.
- Примітка про Gemini CLI: коли CLI повертає JSON-вивід, OpenClaw читає використання з
  `stats`, нормалізує `stats.cached` у `cacheRead` і за потреби виводить вхідні токени
  як `stats.input_tokens - stats.cached`.

Примітка про Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
знову дозволене, тому OpenClaw розглядає повторне використання Claude CLI і `claude -p` як
санкціоновані для цієї інтеграції, якщо Anthropic не опублікує нову політику.
Anthropic усе ще не надає оцінку вартості в доларах для кожного повідомлення, яку OpenClaw міг би
показувати в `/usage full`.

**Вікна використання в CLI (квоти провайдерів)**

- `openclaw status --usage` і `openclaw channels list` показують **вікна використання**
  провайдера (знімки квот, а не витрати для кожного повідомлення).
- Вивід для людини нормалізовано до `X% left` для всіх провайдерів.
- Поточні провайдери з вікнами використання: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi і z.ai.
- Примітка про MiniMax: його сирі поля `usage_percent` / `usagePercent` означають залишкову
  квоту, тому OpenClaw інвертує їх перед відображенням. Поля на основі підрахунку все одно мають пріоритет,
  коли вони присутні. Якщо провайдер повертає `model_remains`, OpenClaw віддає перевагу
  запису chat-моделі, за потреби виводить мітку вікна з часових міток і
  включає назву моделі в мітку плану.
- Автентифікація для цих вікон квот надходить зі
  специфічних для провайдера хуків, коли вони доступні; інакше OpenClaw використовує запасний варіант, зіставляючи OAuth/API key
  облікові дані з профілів автентифікації, env або config.

Подробиці та приклади див. у [Використання токенів і витрати](/uk/reference/token-use).

## Як виявляються ключі

OpenClaw може підхоплювати облікові дані з:

- **Профілів автентифікації** (для кожного агента, зберігаються в `auth-profiles.json`).
- **Змінних середовища** (наприклад `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Конфігурації** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), які можуть експортувати ключі в env процесу skill.

## Функції, які можуть витрачати ключі

### 1) Основні відповіді моделі (чат + інструменти)

Кожна відповідь або виклик інструмента використовує **поточного провайдера моделі** (OpenAI, Anthropic тощо). Це
основне джерело використання і витрат.

Це також включає hosted-провайдерів у стилі підписки, які все одно виставляють рахунок поза
локальним UI OpenClaw, таких як **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** і
шлях входу Anthropic Claude в OpenClaw з увімкненим **Extra Usage**.

Про конфігурацію ціноутворення див. [Моделі](/uk/providers/models), а про відображення — [Використання токенів і витрати](/uk/reference/token-use).

### 2) Media understanding (аудіо/зображення/відео)

Вхідні медіа можуть бути підсумовані/транскрибовані до запуску відповіді. Це використовує API моделей/провайдерів.

- Аудіо: OpenAI / Groq / Deepgram / Google / Mistral.
- Зображення: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Відео: Google / Qwen / Moonshot.

Див. [Media understanding](/uk/nodes/media-understanding).

### 3) Генерація зображень і відео

Спільні можливості генерації також можуть витрачати ключі провайдерів:

- Генерація зображень: OpenAI / Google / fal / MiniMax
- Генерація відео: Qwen

Генерація зображень може виводити типового провайдера на основі автентифікації, коли
`agents.defaults.imageGenerationModel` не встановлено. Генерація відео наразі
вимагає явного `agents.defaults.videoGenerationModel`, такого як
`qwen/wan2.6-t2v`.

Див. [Генерація зображень](/uk/tools/image-generation), [Qwen Cloud](/uk/providers/qwen),
і [Моделі](/uk/concepts/models).

### 4) Embeddings пам’яті + семантичний пошук

Семантичний пошук у пам’яті використовує **API embeddings**, коли налаштовано віддалених провайдерів:

- `memorySearch.provider = "openai"` → embeddings OpenAI
- `memorySearch.provider = "gemini"` → embeddings Gemini
- `memorySearch.provider = "voyage"` → embeddings Voyage
- `memorySearch.provider = "mistral"` → embeddings Mistral
- `memorySearch.provider = "lmstudio"` → embeddings LM Studio (локально/self-hosted)
- `memorySearch.provider = "ollama"` → embeddings Ollama (локально/self-hosted; зазвичай без білінгу за hosted API)
- Необов’язковий запасний перехід на віддаленого провайдера, якщо локальні embeddings не вдаються

Ви можете залишити все локально з `memorySearch.provider = "local"` (без використання API).

Див. [Пам’ять](/uk/concepts/memory).

### 5) Інструмент web search

`web_search` може спричиняти витрати залежно від вашого провайдера:

- **Brave Search API**: `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: типово без ключа, але потребує доступного хоста Ollama плюс `ollama signin`; також може повторно використовувати звичайну bearer-автентифікацію провайдера Ollama, коли хост її вимагає
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: запасний варіант без ключа (без білінгу за API, але неофіційний і на основі HTML)
- **SearXNG**: `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (без ключа/self-hosted; без білінгу за hosted API)

Застарілі шляхи провайдера `tools.web.search.*` усе ще завантажуються через тимчасовий шар сумісності, але більше не є рекомендованою поверхнею конфігурації.

**Безкоштовний кредит Brave Search:** Кожен план Brave включає поновлюваний
безкоштовний кредит \$5/місяць. План Search коштує \$5 за 1 000 запитів, тож цей кредит покриває
1 000 запитів/місяць без оплати. Установіть ліміт використання в панелі Brave, щоб
уникнути неочікуваних витрат.

Див. [Веб-інструменти](/uk/tools/web).

### 5) Інструмент web fetch (Firecrawl)

`web_fetch` може викликати **Firecrawl**, коли присутній API key:

- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webFetch.apiKey`

Якщо Firecrawl не налаштовано, інструмент використовує запасний варіант — direct fetch + readability (без платного API).

Див. [Веб-інструменти](/uk/tools/web).

### 6) Знімки використання провайдера (status/health)

Деякі команди status викликають **endpoint використання провайдера**, щоб показувати вікна квот або стан автентифікації.
Зазвичай це невелика кількість викликів, але вони все одно звертаються до API провайдера:

- `openclaw status --usage`
- `openclaw models status --json`

Див. [CLI Models](/uk/cli/models).

### 7) Захисне підсумовування Compaction

Захисний механізм Compaction може підсумовувати історію сесії за допомогою **поточної моделі**, що
викликає API провайдера під час запуску.

Див. [Керування сесіями + Compaction](/uk/reference/session-management-compaction).

### 8) Сканування / перевірка моделей

`openclaw models scan` може перевіряти моделі OpenRouter і використовує `OPENROUTER_API_KEY`, коли
перевірку ввімкнено.

Див. [CLI Models](/uk/cli/models).

### 9) Talk (мовлення)

Режим Talk може викликати **ElevenLabs**, коли його налаштовано:

- `ELEVENLABS_API_KEY` або `talk.providers.elevenlabs.apiKey`

Див. [Режим Talk](/uk/nodes/talk).

### 10) Skills (сторонні API)

Skills можуть зберігати `apiKey` у `skills.entries.<name>.apiKey`. Якщо skill використовує цей ключ для зовнішніх
API, це може спричиняти витрати відповідно до провайдера цього skill.

Див. [Skills](/uk/tools/skills).
