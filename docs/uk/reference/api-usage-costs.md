---
read_when:
    - Ви хочете зрозуміти, які функції можуть викликати платні API
    - Потрібно проводити аудит ключів, витрат і видимості використання
    - Ви пояснюєте звітування про витрати в /status або /usage
summary: Аудит того, що може витрачати кошти, які ключі використовуються та як переглядати використання
title: Використання API та витрати
x-i18n:
    generated_at: "2026-05-06T05:01:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Цей документ перелічує **функції, які можуть викликати API-ключі**, і те, де відображаються їхні витрати. Він зосереджується на
функціях OpenClaw, які можуть генерувати використання провайдера або платні API-виклики.

## Де відображаються витрати (чат + CLI)

**Знімок вартості за сесію**

- `/status` показує поточну модель сесії, використання контексту та токени останньої відповіді.
- Якщо модель використовує **автентифікацію API-ключем**, `/status` також показує **орієнтовну вартість** останньої відповіді.
- Якщо live-метадані сесії неповні, `/status` може відновити лічильники токенів/кешу
  і мітку активної runtime-моделі з останнього запису використання в транскрипті.
  Наявні ненульові live-значення все ще мають пріоритет, а підсумки транскрипта
  розміру prompt можуть переважати, коли збережені підсумки відсутні або менші.

**Футер вартості для кожного повідомлення**

- `/usage full` додає футер використання до кожної відповіді, включно з **орієнтовною вартістю** (лише API-ключ).
- `/usage tokens` показує лише токени; OAuth/token у стилі підписки та CLI-потоки приховують вартість у доларах.
- Примітка щодо Gemini CLI: коли CLI повертає JSON-вивід, OpenClaw читає використання зі
  `stats`, нормалізує `stats.cached` у `cacheRead` і за потреби виводить вхідні токени
  з `stats.input_tokens - stats.cached`.

Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
знову дозволене, тому OpenClaw розглядає повторне використання Claude CLI і використання `claude -p` як
санкціоновані для цієї інтеграції, якщо Anthropic не опублікує нову політику.
Anthropic досі не надає оцінку вартості в доларах для кожного повідомлення, яку OpenClaw може
показати в `/usage full`.

**Вікна використання CLI (квоти провайдерів)**

- `openclaw status --usage` і `openclaw channels list` показують **вікна використання** провайдера
  (знімки квот, а не вартість окремих повідомлень).
- Людський вивід нормалізується до `X% left` для різних провайдерів.
- Поточні провайдери вікон використання: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi і z.ai.
- Примітка щодо MiniMax: його сирі поля `usage_percent` / `usagePercent` означають залишок
  квоти, тому OpenClaw інвертує їх перед показом. Поля на основі кількості все одно мають
  пріоритет, коли вони присутні. Якщо провайдер повертає `model_remains`, OpenClaw надає перевагу
  запису чат-моделі, за потреби виводить мітку вікна з часових позначок і
  включає назву моделі в мітку плану.
- Автентифікація використання для цих вікон квот надходить із provider-specific hooks, коли
  вони доступні; інакше OpenClaw повертається до відповідних OAuth/API-key
  облікових даних із профілів автентифікації, env або config.

Див. [Використання токенів і витрати](/uk/reference/token-use) для деталей і прикладів.

## Як виявляються ключі

OpenClaw може отримувати облікові дані з:

- **Профілів автентифікації** (для кожного агента, зберігаються в `auth-profiles.json`).
- **Змінних середовища** (наприклад, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), які можуть експортувати ключі в env процесу skill.

## Функції, які можуть витрачати ключі

### 1) Основні відповіді моделі (чат + tools)

Кожна відповідь або виклик tool використовує **поточного провайдера моделі** (OpenAI, Anthropic тощо). Це
основне джерело використання і витрат.

Сюди також входять hosted providers у стилі підписки, які все ще виставляють рахунки поза
локальним UI OpenClaw, як-от **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** і
шлях входу Anthropic OpenClaw Claude з увімкненим **Extra Usage**.

Див. [Моделі](/uk/providers/models) щодо config ціноутворення і [Використання токенів і витрати](/uk/reference/token-use) щодо відображення.

### 2) Розуміння медіа (аудіо/зображення/відео)

Вхідні медіа можуть узагальнюватися/транскрибуватися до виконання відповіді. Це використовує API моделей/провайдерів.

- Аудіо: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Зображення: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Відео: Google / Qwen / Moonshot.

Див. [Розуміння медіа](/uk/nodes/media-understanding).

### 3) Генерація зображень і відео

Спільні можливості генерації також можуть витрачати ключі провайдерів:

- Генерація зображень: OpenAI / Google / DeepInfra / fal / MiniMax
- Генерація відео: DeepInfra / Qwen

Генерація зображень може вивести provider default з підтримкою автентифікації, коли
`agents.defaults.imageGenerationModel` не встановлено. Генерація відео наразі
вимагає явного `agents.defaults.videoGenerationModel`, наприклад
`qwen/wan2.6-t2v`.

Див. [Генерація зображень](/uk/tools/image-generation), [Qwen Cloud](/uk/providers/qwen)
і [Моделі](/uk/concepts/models).

### 4) Memory embeddings + семантичний пошук

Семантичний пошук у пам’яті використовує **embedding APIs**, коли налаштований для віддалених провайдерів:

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "deepinfra"` → DeepInfra embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings (локальні/самостійно розміщені)
- `memorySearch.provider = "ollama"` → Ollama embeddings (локальні/самостійно розміщені; зазвичай без billing hosted API)
- Необов’язковий fallback до віддаленого провайдера, якщо локальні embeddings не спрацьовують

Ви можете залишити це локальним за допомогою `memorySearch.provider = "local"` (без використання API).

Див. [Пам’ять](/uk/concepts/memory).

### 5) Tool вебпошуку

`web_search` може спричиняти плату за використання залежно від вашого провайдера:

- **Brave Search API**: `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: без ключа для доступного локального хоста Ollama з виконаним входом; прямий пошук `https://ollama.com` використовує `OLLAMA_API_KEY`, а захищені автентифікацією хости можуть повторно використовувати звичайну bearer auth провайдера Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback без ключа (без API billing, але неофіційний і на основі HTML)
- **SearXNG**: `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (без ключа/самостійно розміщений; без billing hosted API)

Застарілі шляхи провайдера `tools.web.search.*` усе ще завантажуються через тимчасовий compatibility shim, але вони більше не є рекомендованою поверхнею config.

**Безкоштовний кредит Brave Search:** Кожен план Brave включає \$5/місяць відновлюваного
безкоштовного кредиту. План Search коштує \$5 за 1 000 запитів, тож кредит покриває
1 000 запитів/місяць без плати. Встановіть ліміт використання в панелі Brave,
щоб уникнути неочікуваних стягнень.

Див. [Веб-tools](/uk/tools/web).

### 5) Tool веботримання (Firecrawl)

`web_fetch` може викликати **Firecrawl**, коли присутній API-ключ:

- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webFetch.apiKey`

Якщо Firecrawl не налаштований, tool повертається до прямого fetch плюс bundled `web-readability` plugin (без платного API). Вимкніть `plugins.entries.web-readability.enabled`, щоб пропустити локальне вилучення Readability.

Див. [Веб-tools](/uk/tools/web).

### 6) Знімки використання провайдерів (status/health)

Деякі команди status викликають **endpoints використання провайдера**, щоб показати вікна квот або стан автентифікації.
Зазвичай це низькооб’ємні виклики, але вони все одно звертаються до API провайдерів:

- `openclaw status --usage`
- `openclaw models status --json`

Див. [Models CLI](/uk/cli/models).

### 7) Узагальнення запобіжника Compaction

Запобіжник compaction може узагальнювати історію сесії за допомогою **поточної моделі**, що
викликає API провайдера під час роботи.

Див. [Керування сесіями + compaction](/uk/reference/session-management-compaction).

### 8) Сканування / probe моделей

`openclaw models scan` може probe моделі OpenRouter і використовує `OPENROUTER_API_KEY`, коли
probing увімкнено.

Див. [Models CLI](/uk/cli/models).

### 9) Talk (мовлення)

Режим Talk може викликати **ElevenLabs**, коли налаштований:

- `ELEVENLABS_API_KEY` або `talk.providers.elevenlabs.apiKey`

Див. [Режим Talk](/uk/nodes/talk).

### 10) Skills (сторонні API)

Skills можуть зберігати `apiKey` у `skills.entries.<name>.apiKey`. Якщо skill використовує цей ключ для зовнішніх
API, це може спричинити витрати відповідно до провайдера skill.

Див. [Skills](/uk/tools/skills).

## Пов’язане

- [Використання токенів і витрати](/uk/reference/token-use)
- [Кешування prompt](/uk/reference/prompt-caching)
- [Відстеження використання](/uk/concepts/usage-tracking)
