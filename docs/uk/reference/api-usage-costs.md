---
read_when:
    - Ви хочете зрозуміти, які функції можуть викликати платні API
    - Вам потрібно перевірити ключі, витрати та видимість використання
    - Ви пояснюєте звітність про витрати у `/status` або `/usage`
summary: Перевірте, що може витрачати гроші, які ключі використовуються та як переглядати використання
title: Використання API та витрати
x-i18n:
    generated_at: "2026-04-28T00:35:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Використання API та витрати

У цьому документі перелічено **функції, які можуть викликати API-ключі**, і де відображаються їхні витрати. Основна увага приділена
функціям OpenClaw, які можуть генерувати використання провайдера або платні виклики API.

## Де відображаються витрати (чат + CLI)

**Знімок вартості для сесії**

- `/status` показує поточну модель сесії, використання контексту та токени останньої відповіді.
- Якщо модель використовує **автентифікацію через API-ключ**, `/status` також показує **орієнтовну вартість** останньої відповіді.
- Якщо live-метадані сесії неповні, `/status` може відновити лічильники
  токенів/кешу та мітку активної runtime-моделі з останнього запису використання в транскрипті.
  Наявні ненульові live-значення все одно мають пріоритет, а підсумки транскрипту
  розміру prompt можуть переважати, коли збережені підсумки відсутні або менші.

**Нижній колонтитул вартості для повідомлення**

- `/usage full` додає нижній колонтитул використання до кожної відповіді, включно з **орієнтовною вартістю** (лише для API-ключів).
- `/usage tokens` показує лише токени; OAuth/токен-потоки у стилі підписки та CLI-потоки приховують вартість у доларах.
- Примітка щодо Gemini CLI: коли CLI повертає вихід у JSON, OpenClaw читає використання з
  `stats`, нормалізує `stats.cached` у `cacheRead` і за потреби виводить вхідні токени
  з `stats.input_tokens - stats.cached`.

Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
знову дозволене, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p`
санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
Anthropic усе ще не надає оцінку вартості в доларах для окремого повідомлення, яку OpenClaw міг би
показувати в `/usage full`.

**Вікна використання CLI (квоти провайдерів)**

- `openclaw status --usage` і `openclaw channels list` показують **вікна використання**
  провайдера (знімки квот, а не вартість окремих повідомлень).
- Зрозумілий для людини вивід нормалізується до `X% left` для всіх провайдерів.
- Поточні провайдери вікон використання: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi і z.ai.
- Примітка щодо MiniMax: його сирі поля `usage_percent` / `usagePercent` означають залишок
  квоти, тому OpenClaw інвертує їх перед показом. Поля на основі лічильників усе одно мають перевагу,
  якщо вони присутні. Якщо провайдер повертає `model_remains`, OpenClaw надає перевагу запису моделі чату,
  за потреби виводить мітку вікна з часових позначок і
  включає назву моделі до мітки плану.
- Автентифікація для цих вікон квот надходить із хуків, специфічних для провайдера, коли вони доступні;
  інакше OpenClaw повертається до пошуку відповідних облікових даних OAuth/API-ключів
  у профілях автентифікації, змінних середовища або конфігурації.

Докладніше й приклади див. у [Використання токенів і витрати](/uk/reference/token-use).

## Як виявляються ключі

OpenClaw може підхоплювати облікові дані з:

- **Профілів автентифікації** (для кожного агента, зберігаються в `auth-profiles.json`).
- **Змінних середовища** (наприклад, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Конфігурації** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), які можуть експортувати ключі до середовища процесу skill.

## Функції, які можуть витрачати ключі

### 1) Відповіді основної моделі (чат + інструменти)

Кожна відповідь або виклик інструмента використовує **поточного провайдера моделі** (OpenAI, Anthropic тощо). Це
основне джерело використання і витрат.

Сюди також входять хостингові провайдери у стилі підписки, які все одно виставляють рахунки поза
локальним UI OpenClaw, наприклад **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** і
шлях входу Anthropic OpenClaw Claude з увімкненим **Extra Usage**.

Див. [Моделі](/uk/providers/models) для конфігурації ціноутворення та [Використання токенів і витрати](/uk/reference/token-use) для відображення.

### 2) Розуміння медіа (аудіо/зображення/відео)

Вхідні медіа можуть бути підсумовані/транскрибовані до запуску відповіді. Для цього використовуються API моделей/провайдерів.

- Аудіо: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Зображення: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Відео: Google / Qwen / Moonshot.

Див. [Розуміння медіа](/uk/nodes/media-understanding).

### 3) Генерація зображень і відео

Спільні можливості генерації також можуть витрачати ключі провайдерів:

- Генерація зображень: OpenAI / Google / DeepInfra / fal / MiniMax
- Генерація відео: DeepInfra / Qwen

Генерація зображень може визначати стандартний провайдер із підтримкою автентифікації, якщо
`agents.defaults.imageGenerationModel` не задано. Генерація відео наразі
вимагає явного `agents.defaults.videoGenerationModel`, наприклад
`qwen/wan2.6-t2v`.

Див. [Генерація зображень](/uk/tools/image-generation), [Qwen Cloud](/uk/providers/qwen)
і [Моделі](/uk/concepts/models).

### 4) Ембедінги пам’яті + семантичний пошук

Семантичний пошук у пам’яті використовує **API ембедінгів**, коли налаштовано віддалених провайдерів:

- `memorySearch.provider = "openai"` → ембедінги OpenAI
- `memorySearch.provider = "gemini"` → ембедінги Gemini
- `memorySearch.provider = "voyage"` → ембедінги Voyage
- `memorySearch.provider = "mistral"` → ембедінги Mistral
- `memorySearch.provider = "deepinfra"` → ембедінги DeepInfra
- `memorySearch.provider = "lmstudio"` → ембедінги LM Studio (локально/self-hosted)
- `memorySearch.provider = "ollama"` → ембедінги Ollama (локально/self-hosted; зазвичай без витрат на хостинговий API)
- Необов’язковий резервний перехід на віддаленого провайдера, якщо локальні ембедінги не спрацюють

Ви можете залишити все локально з `memorySearch.provider = "local"` (без використання API).

Див. [Пам’ять](/uk/concepts/memory).

### 5) Інструмент вебпошуку

`web_search` може спричиняти витрати на використання залежно від вашого провайдера:

- **Brave Search API**: `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: без ключа для доступного локального хоста Ollama з виконаним входом; прямий пошук через `https://ollama.com` використовує `OLLAMA_API_KEY`, а хости із захищеною автентифікацією можуть повторно використовувати звичайну bearer-автентифікацію провайдера Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: резервний варіант без ключа (без оплати API, але неофіційний і на основі HTML)
- **SearXNG**: `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (без ключа/self-hosted; без витрат на хостинговий API)

Застарілі шляхи провайдерів `tools.web.search.*` усе ще завантажуються через тимчасовий шар сумісності, але вони більше не є рекомендованою поверхнею конфігурації.

**Безкоштовний кредит Brave Search:** Кожен тариф Brave включає безкоштовний
кредит на \$5/місяць, що поновлюється. Тариф Search коштує \$5 за 1 000 запитів, тож цей кредит покриває
1 000 запитів/місяць без оплати. Установіть свій ліміт використання в панелі керування Brave,
щоб уникнути неочікуваних витрат.

Див. [Вебінструменти](/uk/tools/web).

### 5) Інструмент web fetch (Firecrawl)

`web_fetch` може викликати **Firecrawl**, якщо наявний API-ключ:

- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webFetch.apiKey`

Якщо Firecrawl не налаштовано, інструмент переходить до прямого fetch плюс вбудований plugin `web-readability` (без платного API). Вимкніть `plugins.entries.web-readability.enabled`, щоб пропустити локальне витягування Readability.

Див. [Вебінструменти](/uk/tools/web).

### 6) Знімки використання провайдера (status/health)

Деякі команди status викликають **endpoint використання провайдера**, щоб відображати вікна квот або стан автентифікації.
Зазвичай це виклики з невеликим обсягом, але вони все одно звертаються до API провайдера:

- `openclaw status --usage`
- `openclaw models status --json`

Див. [CLI моделей](/uk/cli/models).

### 7) Підсумовування захисту Compaction

Захист Compaction може підсумовувати історію сесії за допомогою **поточної моделі**, що
викликає API провайдера під час виконання.

Див. [Керування сесіями + Compaction](/uk/reference/session-management-compaction).

### 8) Сканування / перевірка моделей

`openclaw models scan` може перевіряти моделі OpenRouter і використовує `OPENROUTER_API_KEY`, якщо
перевірку ввімкнено.

Див. [CLI моделей](/uk/cli/models).

### 9) Talk (мовлення)

Режим Talk може викликати **ElevenLabs**, якщо його налаштовано:

- `ELEVENLABS_API_KEY` або `talk.providers.elevenlabs.apiKey`

Див. [Режим Talk](/uk/nodes/talk).

### 10) Skills (сторонні API)

Skills можуть зберігати `apiKey` у `skills.entries.<name>.apiKey`. Якщо skill використовує цей ключ для зовнішніх
API, це може спричинити витрати відповідно до провайдера цього skill.

Див. [Skills](/uk/tools/skills).

## Пов’язане

- [Використання токенів і витрати](/uk/reference/token-use)
- [Кешування prompt](/uk/reference/prompt-caching)
- [Відстеження використання](/uk/concepts/usage-tracking)
