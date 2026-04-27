---
read_when:
    - Ви хочете зрозуміти, які функції можуть викликати платні API
    - Вам потрібно перевірити ключі, витрати та видимість використання
    - Ви пояснюєте звітування про витрати у /status або /usage
summary: Перевірте, що може витрачати кошти, які ключі використовуються та як переглянути використання
title: Використання API та витрати
x-i18n:
    generated_at: "2026-04-27T01:11:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: d61fb753442d3be6987877c296238c350d81fcaa8f785f3f33c23463b7831836
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Використання API та витрати

У цьому документі перелічено **функції, які можуть використовувати API-ключі**, і де відображаються їхні витрати. Він зосереджений на
функціях OpenClaw, які можуть генерувати використання провайдера або платні виклики API.

## Де відображаються витрати (чат + CLI)

**Миттєвий знімок вартості за сеанс**

- `/status` показує поточну модель сеансу, використання контексту та токени останньої відповіді.
- Якщо модель використовує **автентифікацію через API-ключ**, `/status` також показує **орієнтовну вартість** останньої відповіді.
- Якщо метадані живого сеансу обмежені, `/status` може відновити лічильники
  токенів/кешу та мітку активної моделі середовища виконання з останнього запису
  про використання в транскрипті. Наявні ненульові живі значення все ще мають
  пріоритет, а підсумки транскрипту розміру запиту можуть мати перевагу, якщо
  збережені підсумки відсутні або менші.

**Нижній колонтитул вартості для кожного повідомлення**

- `/usage full` додає нижній колонтитул використання до кожної відповіді, включно з **орієнтовною вартістю** (лише для API-ключа).
- `/usage tokens` показує лише токени; потоки OAuth/токенів у стилі підписки та CLI приховують вартість у доларах.
- Примітка щодо Gemini CLI: коли CLI повертає вивід JSON, OpenClaw зчитує використання з
  `stats`, нормалізує `stats.cached` у `cacheRead` і виводить вхідні токени з
  `stats.input_tokens - stats.cached`, коли це потрібно.

Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
знову дозволене, тому OpenClaw вважає повторне використання Claude CLI та використання `claude -p`
санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
Anthropic досі не надає оцінку вартості в доларах для кожного повідомлення, яку OpenClaw міг би
показувати в `/usage full`.

**Вікна використання CLI (квоти провайдера)**

- `openclaw status --usage` і `openclaw channels list` показують **вікна використання**
  провайдера (знімки квот, а не витрати на окремі повідомлення).
- Зручний для людини вивід нормалізується до `X% left` для всіх провайдерів.
- Поточні провайдери вікон використання: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi та z.ai.
- Примітка щодо MiniMax: його сирі поля `usage_percent` / `usagePercent` означають
  залишок квоти, тому OpenClaw інвертує їх перед відображенням. Поля на основі кількості
  все ще мають пріоритет, якщо вони присутні. Якщо провайдер повертає `model_remains`, OpenClaw надає перевагу
  запису моделі чату, за потреби виводить мітку вікна з часових міток
  і включає назву моделі до мітки плану.
- Автентифікація використання для цих вікон квот надходить із специфічних для провайдера хуків, коли вони доступні;
  інакше OpenClaw використовує резервний варіант — підбір облікових даних OAuth/API-ключа
  з профілів автентифікації, змінних середовища або конфігурації.

Див. [Використання токенів і витрати](/uk/reference/token-use) для подробиць і прикладів.

## Як виявляються ключі

OpenClaw може отримувати облікові дані з:

- **Профілів автентифікації** (для кожного агента, зберігаються в `auth-profiles.json`).
- **Змінних середовища** (наприклад, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Конфігурації** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), які можуть експортувати ключі до середовища процесу skill.

## Функції, які можуть витрачати ключі

### 1) Основні відповіді моделі (чат + інструменти)

Кожна відповідь або виклик інструмента використовує **поточного провайдера моделі** (OpenAI, Anthropic тощо). Це
основне джерело використання та витрат.

Сюди також входять розміщені провайдери в стилі підписки, які все одно виставляють рахунки поза
локальним UI OpenClaw, наприклад **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** та
шлях входу Claude від Anthropic у OpenClaw з увімкненим **Extra Usage**.

Див. [Моделі](/uk/providers/models) для конфігурації цін і [Використання токенів і витрати](/uk/reference/token-use) для відображення.

### 2) Розуміння медіа (аудіо/зображення/відео)

Вхідні медіа можуть бути підсумовані/транскрибовані до запуску відповіді. Для цього використовуються API моделей/провайдерів.

- Аудіо: OpenAI / Groq / Deepgram / Google / Mistral.
- Зображення: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Відео: Google / Qwen / Moonshot.

Див. [Розуміння медіа](/uk/nodes/media-understanding).

### 3) Генерація зображень і відео

Спільні можливості генерації також можуть витрачати ключі провайдерів:

- Генерація зображень: OpenAI / Google / fal / MiniMax
- Генерація відео: Qwen

Генерація зображень може визначати типовий провайдер із автентифікацією, якщо
`agents.defaults.imageGenerationModel` не задано. Генерація відео наразі
потребує явного `agents.defaults.videoGenerationModel`, наприклад
`qwen/wan2.6-t2v`.

Див. [Генерація зображень](/uk/tools/image-generation), [Qwen Cloud](/uk/providers/qwen)
та [Моделі](/uk/concepts/models).

### 4) Ембедінги пам’яті + семантичний пошук

Семантичний пошук у пам’яті використовує **API ембедінгів**, якщо налаштовано віддалені провайдери:

- `memorySearch.provider = "openai"` → ембедінги OpenAI
- `memorySearch.provider = "gemini"` → ембедінги Gemini
- `memorySearch.provider = "voyage"` → ембедінги Voyage
- `memorySearch.provider = "mistral"` → ембедінги Mistral
- `memorySearch.provider = "lmstudio"` → ембедінги LM Studio (локально/самостійний хостинг)
- `memorySearch.provider = "ollama"` → ембедінги Ollama (локально/самостійний хостинг; зазвичай без оплати розміщеного API)
- Необов’язковий резервний перехід до віддаленого провайдера, якщо локальні ембедінги не спрацьовують

Ви можете залишити все локально за допомогою `memorySearch.provider = "local"` (без використання API).

Див. [Пам’ять](/uk/concepts/memory).

### 5) Інструмент вебпошуку

`web_search` може спричиняти списання за використання залежно від вашого провайдера:

- **Brave Search API**: `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: без ключа для доступного локального хоста Ollama із виконаним входом; прямий пошук через `https://ollama.com` використовує `OLLAMA_API_KEY`, а хости, захищені автентифікацією, можуть повторно використовувати звичайну bearer-автентифікацію провайдера Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: резервний варіант без ключа (без оплати API, але неофіційний і на основі HTML)
- **SearXNG**: `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (без ключа/самостійний хостинг; без оплати розміщеного API)

Застарілі шляхи провайдера `tools.web.search.*` усе ще завантажуються через тимчасовий шар сумісності, але це вже не рекомендована поверхня конфігурації.

**Безплатний кредит Brave Search:** Кожен план Brave включає \$5/місяць поновлюваного
безплатного кредиту. План Search коштує \$5 за 1 000 запитів, тож цей кредит покриває
1 000 запитів/місяць без оплати. Установіть свій ліміт використання в панелі керування Brave,
щоб уникнути неочікуваних списань.

Див. [Вебінструменти](/uk/tools/web).

### 5) Інструмент отримання вебсторінок (Firecrawl)

`web_fetch` може викликати **Firecrawl**, якщо присутній API-ключ:

- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webFetch.apiKey`

Якщо Firecrawl не налаштовано, інструмент використовує резервний варіант — пряме отримання плюс вбудований Plugin `web-readability` (без платного API). Вимкніть `plugins.entries.web-readability.enabled`, щоб пропустити локальне витягування Readability.

Див. [Вебінструменти](/uk/tools/web).

### 6) Знімки використання провайдера (status/health)

Деякі команди статусу викликають **кінцеві точки використання провайдера**, щоб показувати вікна квот або стан автентифікації.
Зазвичай це виклики з малим обсягом, але вони все одно звертаються до API провайдера:

- `openclaw status --usage`
- `openclaw models status --json`

Див. [CLI моделей](/uk/cli/models).

### 7) Підсумовування захисту Compaction

Захист Compaction може підсумовувати історію сеансу за допомогою **поточної моделі**, що
викликає API провайдера під час роботи.

Див. [Керування сеансом + Compaction](/uk/reference/session-management-compaction).

### 8) Сканування / перевірка моделі

`openclaw models scan` може перевіряти моделі OpenRouter і використовує `OPENROUTER_API_KEY`, коли
перевірку ввімкнено.

Див. [CLI моделей](/uk/cli/models).

### 9) Talk (мовлення)

Режим Talk може викликати **ElevenLabs**, якщо налаштовано:

- `ELEVENLABS_API_KEY` або `talk.providers.elevenlabs.apiKey`

Див. [Режим Talk](/uk/nodes/talk).

### 10) Skills (сторонні API)

Skills можуть зберігати `apiKey` у `skills.entries.<name>.apiKey`. Якщо skill використовує цей ключ для зовнішніх
API, це може спричиняти витрати відповідно до провайдера цього skill.

Див. [Skills](/uk/tools/skills).

## Пов’язане

- [Використання токенів і витрати](/uk/reference/token-use)
- [Кешування запитів](/uk/reference/prompt-caching)
- [Відстеження використання](/uk/concepts/usage-tracking)
