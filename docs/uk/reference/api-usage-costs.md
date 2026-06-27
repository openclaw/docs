---
read_when:
    - Ви хочете зрозуміти, які функції можуть викликати платні API
    - Вам потрібно перевіряти ключі, витрати та видимість використання
    - Ви пояснюєте звітування про витрати для /status або /usage
summary: Аудит того, що може витрачати гроші, які ключі використовуються та як переглядати використання
title: Використання API та витрати
x-i18n:
    generated_at: "2026-06-27T18:16:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Цей документ перелічує **функції, які можуть викликати ключі API**, і де відображаються їхні витрати. Він зосереджений на
функціях OpenClaw, які можуть генерувати використання постачальників або платні виклики API.

## Де відображаються витрати (чат + CLI)

**Знімок вартості за сеанс**

- `/status` показує поточну модель сеансу, використання контексту та токени останньої відповіді.
- Якщо OpenClaw має метадані використання та локальні ціни для активної моделі,
  `/status` також показує **орієнтовну вартість** останньої відповіді. Це може включати
  явно оцінені постачальники без ключів API, як-от моделі Bedrock `aws-sdk`.
- Якщо живі метадані сеансу неповні, `/status` може відновити лічильники
  токенів/кешу та мітку активної runtime-моделі з останнього запису використання
  в транскрипті. Наявні ненульові живі значення все одно мають пріоритет, а
  підсумки транскрипту розміру prompt можуть переважити, коли збережені підсумки
  відсутні або менші.

**Нижній колонтитул вартості за повідомлення**

- `/usage full` додає нижній колонтитул використання до кожної відповіді, зокрема **орієнтовну вартість**,
  коли локальні ціни налаштовані для активної моделі й метадані використання
  доступні.
- `/usage tokens` показує лише токени; потоки OAuth/токенів і CLI у стилі підписки
  все одно показують лише токени, якщо цей runtime не надає сумісні метадані використання
  й не налаштовано явну локальну ціну.
- Примітка щодо Gemini CLI: стандартний вивід `stream-json` і застарілі перевизначення JSON
  обидва зчитують використання зі `stats`, нормалізують `stats.cached` у `cacheRead` і
  за потреби виводять вхідні токени з `stats.input_tokens - stats.cached`.

Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
знову дозволене, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p`
санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
Anthropic досі не надає оцінку в доларах за повідомлення, яку OpenClaw може
показати в `/usage full`.

**Вікна використання CLI (квоти постачальників)**

- `openclaw status --usage` і `openclaw channels list` показують **вікна використання** постачальників
  (знімки квот, а не витрати за повідомлення).
- Людиночитний вивід нормалізовано до `X% left` для всіх постачальників.
- Поточні постачальники вікон використання: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi і z.ai.
- Примітка щодо MiniMax: його сирі поля `usage_percent` / `usagePercent` означають залишок
  квоти, тому OpenClaw інвертує їх перед відображенням. Поля на основі лічильників усе одно
  мають пріоритет, коли присутні. Якщо постачальник повертає `model_remains`, OpenClaw надає перевагу
  запису моделі чату, за потреби виводить мітку вікна з часових позначок і
  включає назву моделі в мітку плану.
- Авторизація використання для цих вікон квот надходить із хуків, специфічних для постачальника, коли
  доступно; інакше OpenClaw повертається до відповідних облікових даних OAuth/ключів API
  з профілів авторизації, env або конфігурації.

Див. [Використання токенів і витрати](/uk/reference/token-use) для деталей і прикладів.

## Як виявляються ключі

OpenClaw може отримувати облікові дані з:

- **Профілів авторизації** (для кожного агента, зберігаються в `auth-profiles.json`).
- **Змінних середовища** (наприклад, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Конфігурації** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), які можуть експортувати ключі в env процесу skill.

## Функції, які можуть витрачати ключі

### 1) Основні відповіді моделі (чат + інструменти)

Кожна відповідь або виклик інструмента використовує **поточного постачальника моделі** (OpenAI, Anthropic тощо). Це
основне джерело використання та витрат.

Це також включає розміщених постачальників у стилі підписки, які все одно виставляють рахунки поза
локальним інтерфейсом OpenClaw, як-от **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** і
шлях входу Claude від Anthropic в OpenClaw з увімкненим **Extra Usage**.

Див. [Моделі](/uk/providers/models) для конфігурації цін і [Використання токенів і витрати](/uk/reference/token-use) для відображення.

### 2) Розуміння медіа (аудіо/зображення/відео)

Вхідні медіа можуть бути підсумовані/транскрибовані перед виконанням відповіді. Це використовує API моделей/постачальників.

- Аудіо: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Зображення: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Відео: Google / Qwen / Moonshot.

Див. [Розуміння медіа](/uk/nodes/media-understanding).

### 3) Генерація зображень і відео

Спільні можливості генерації також можуть витрачати ключі постачальників:

- Генерація зображень: OpenAI / Google / DeepInfra / fal / MiniMax
- Генерація відео: DeepInfra / Qwen

Генерація зображень може вивести стандартного постачальника з підтримкою авторизації, коли
`agents.defaults.imageGenerationModel` не встановлено. Генерація відео наразі
потребує явного `agents.defaults.videoGenerationModel`, як-от
`qwen/wan2.6-t2v`.

Див. [Генерація зображень](/uk/tools/image-generation), [Qwen Cloud](/uk/providers/qwen)
і [Моделі](/uk/concepts/models).

### 4) Ембедінги пам’яті + семантичний пошук

Семантичний пошук у пам’яті використовує **API ембедінгів**, коли налаштований для віддалених постачальників:

- `memorySearch.provider = "openai"` → ембедінги OpenAI
- `memorySearch.provider = "gemini"` → ембедінги Gemini
- `memorySearch.provider = "voyage"` → ембедінги Voyage
- `memorySearch.provider = "mistral"` → ембедінги Mistral
- `memorySearch.provider = "deepinfra"` → ембедінги DeepInfra
- `memorySearch.provider = "lmstudio"` → ембедінги LM Studio (локально/самостійно розміщено)
- `memorySearch.provider = "ollama"` → ембедінги Ollama (локально/самостійно розміщено; зазвичай без рахунків за розміщений API)
- Необов’язковий fallback до віддаленого постачальника, якщо локальні ембедінги не спрацюють

Ви можете залишити це локальним за допомогою `memorySearch.provider = "local"` (без використання API).

Див. [Пам’ять](/uk/concepts/memory).

### 5) Інструмент вебпошуку

`web_search` може спричиняти плату за використання залежно від вашого постачальника:

- **Brave Search API**: `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: профіль OAuth xAI, `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: без ключа для доступного локального хоста Ollama з виконаним входом; прямий пошук `https://ollama.com` використовує `OLLAMA_API_KEY`, а захищені авторизацією хости можуть повторно використовувати звичайну bearer-авторизацію постачальника Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: постачальник без ключа, коли явно вибраний (без рахунків за API, але неофіційний і на основі HTML)
- **SearXNG**: `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (без ключа/самостійно розміщено; без рахунків за розміщений API)

Застарілі шляхи постачальників `tools.web.search.*` досі завантажуються через тимчасовий shim сумісності, але вони більше не є рекомендованою поверхнею конфігурації.

**Безкоштовний кредит Brave Search:** Кожен план Brave включає \$5/місяць поновлюваного
безкоштовного кредиту. План Search коштує \$5 за 1 000 запитів, тому кредит покриває
1 000 запитів/місяць безкоштовно. Установіть свій ліміт використання на панелі Brave,
щоб уникнути неочікуваних списань.

Див. [Вебінструменти](/uk/tools/web).

### 5) Інструмент веботримання (Firecrawl)

`web_fetch` може викликати **Firecrawl** зі стартовим доступом без ключа. Додайте ключ API
для вищих лімітів:

- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webFetch.apiKey`

Якщо Firecrawl не налаштовано, інструмент повертається до прямого отримання плюс вбудований plugin `web-readability` (без платного API). Вимкніть `plugins.entries.web-readability.enabled`, щоб пропустити локальне витягнення Readability.

Див. [Вебінструменти](/uk/tools/web).

### 6) Знімки використання постачальників (статус/стан)

Деякі команди статусу викликають **кінцеві точки використання постачальників**, щоб показати вікна квот або стан авторизації.
Зазвичай це низькооб’ємні виклики, але вони все одно звертаються до API постачальників:

- `openclaw status --usage`
- `openclaw models status --json`

Див. [CLI моделей](/uk/cli/models).

### 7) Захисне підсумовування Compaction

Захист Compaction може підсумовувати історію сеансу за допомогою **поточної моделі**, що
викликає API постачальників під час виконання.

Див. [Керування сеансом + Compaction](/uk/reference/session-management-compaction).

### 8) Сканування / перевірка моделі

`openclaw models scan` може перевіряти моделі OpenRouter і використовує `OPENROUTER_API_KEY`, коли
перевірку ввімкнено.

Див. [CLI моделей](/uk/cli/models).

### 9) Talk (мовлення)

Режим Talk може викликати **ElevenLabs**, коли налаштований:

- `ELEVENLABS_API_KEY` або `talk.providers.elevenlabs.apiKey`

Див. [Режим Talk](/uk/nodes/talk).

### 10) Skills (сторонні API)

Skills можуть зберігати `apiKey` у `skills.entries.<name>.apiKey`. Якщо skill використовує цей ключ для зовнішніх
API, це може спричиняти витрати відповідно до постачальника skill.

Див. [Skills](/uk/tools/skills).

## Пов’язане

- [Використання токенів і витрати](/uk/reference/token-use)
- [Кешування prompt](/uk/reference/prompt-caching)
- [Відстеження використання](/uk/concepts/usage-tracking)
