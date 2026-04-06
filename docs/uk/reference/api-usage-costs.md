---
read_when:
    - Ви хочете зрозуміти, які функції можуть викликати платні API
    - Вам потрібно перевірити ключі, витрати та видимість використання
    - Ви пояснюєте звітування про витрати в /status або /usage
summary: Перевірка того, що може витрачати кошти, які ключі використовуються і як переглядати використання
title: Використання API і витрати
x-i18n:
    generated_at: "2026-04-06T15:31:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab6eefcde9ac014df6cdda7aaa77ef48f16936ab12eaa883d9fe69425a31a2dd
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# використання API і витрати

У цьому документі перелічено **функції, які можуть викликати API-ключі**, і де відображаються їхні витрати. Основна увага приділяється
функціям OpenClaw, які можуть генерувати використання постачальників або платні виклики API.

## Де відображаються витрати (чат + CLI)

**Знімок витрат для сеансу**

- `/status` показує поточну модель сеансу, використання контексту та токени останньої відповіді.
- Якщо модель використовує **автентифікацію через API-ключ**, `/status` також показує **орієнтовну вартість** останньої відповіді.
- Якщо живі метадані сеансу неповні, `/status` може відновити лічильники
  токенів/кешу та мітку активної runtime-моделі з останнього запису використання в transcript.
  Наявні ненульові живі значення все одно мають пріоритет, а підсумки transcript розміру prompt
  можуть перемагати, коли збережені підсумки відсутні або менші.

**Нижній колонтитул витрат для повідомлення**

- `/usage full` додає нижній колонтитул використання до кожної відповіді, зокрема **орієнтовну вартість** (лише для API-ключа).
- `/usage tokens` показує лише токени; потоки OAuth/токена та CLI у стилі підписки приховують вартість у доларах.
- Примітка про Gemini CLI: коли CLI повертає JSON-вивід, OpenClaw зчитує використання з
  `stats`, нормалізує `stats.cached` у `cacheRead` і за потреби обчислює вхідні токени
  з `stats.input_tokens - stats.cached`.

Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
знову дозволене, тому OpenClaw вважає повторне використання Claude CLI та використання `claude -p`
санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
Anthropic усе ще не надає оцінку вартості в доларах для окремого повідомлення, яку OpenClaw міг би
показувати в `/usage full`.

**Вікна використання CLI (квоти постачальника)**

- `openclaw status --usage` і `openclaw channels list` показують **вікна використання**
  постачальника (знімки квот, а не витрати на окремі повідомлення).
- Зрозумілий для людини вивід нормалізується до `X% left` для всіх постачальників.
- Поточні постачальники вікон використання: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi і z.ai.
- Примітка щодо MiniMax: його сирі поля `usage_percent` / `usagePercent` означають
  залишок квоти, тому OpenClaw інвертує їх перед показом. Поля на основі лічильників усе одно мають пріоритет,
  якщо вони присутні. Якщо постачальник повертає `model_remains`, OpenClaw віддає перевагу запису моделі чату,
  за потреби виводить мітку вікна з часових позначок і
  включає назву моделі в мітку плану.
- Автентифікація використання для цих вікон квот надходить із хуків, специфічних для постачальника, коли вони доступні;
  інакше OpenClaw повертається до відповідних облікових даних OAuth/API-ключа
  з профілів автентифікації, env або config.

Докладно та з прикладами див. [Token use & costs](/uk/reference/token-use).

## Як виявляються ключі

OpenClaw може отримувати облікові дані з:

- **Профілів автентифікації** (для кожного агента окремо, зберігаються в `auth-profiles.json`).
- **Змінних середовища** (наприклад, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Конфігурації** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), які можуть експортувати ключі в env процесу skill.

## Функції, які можуть витрачати ключі

### 1) Основні відповіді моделей (чат + інструменти)

Кожна відповідь або виклик інструмента використовує **поточного постачальника моделі** (OpenAI, Anthropic тощо). Це
основне джерело використання та витрат.

Сюди також входять хостингові постачальники в стилі підписки, які все одно виставляють рахунки поза
локальним UI OpenClaw, наприклад **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** та
шлях входу Claude в Anthropic для OpenClaw з увімкненим **Extra Usage**.

Щодо конфігурації ціноутворення див. [Models](/uk/providers/models), а щодо відображення — [Token use & costs](/uk/reference/token-use).

### 2) Розуміння медіа (аудіо/зображення/відео)

Вхідні медіа можуть бути підсумовані/транскрибовані перед формуванням відповіді. Для цього використовуються API моделей/постачальників.

- Аудіо: OpenAI / Groq / Deepgram / Google / Mistral.
- Зображення: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Відео: Google / Qwen / Moonshot.

Див. [Media understanding](/uk/nodes/media-understanding).

### 3) Генерація зображень і відео

Спільні можливості генерації також можуть витрачати ключі постачальників:

- Генерація зображень: OpenAI / Google / fal / MiniMax
- Генерація відео: Qwen

Генерація зображень може визначити типовий постачальник із підтримкою автентифікації, якщо
`agents.defaults.imageGenerationModel` не встановлено. Генерація відео зараз
вимагає явного `agents.defaults.videoGenerationModel`, наприклад
`qwen/wan2.6-t2v`.

Див. [Image generation](/uk/tools/image-generation), [Qwen Cloud](/uk/providers/qwen)
і [Models](/uk/concepts/models).

### 4) Вбудовування пам’яті + семантичний пошук

Семантичний пошук у пам’яті використовує **API вбудовувань**, коли для віддалених постачальників налаштовано:

- `memorySearch.provider = "openai"` → вбудовування OpenAI
- `memorySearch.provider = "gemini"` → вбудовування Gemini
- `memorySearch.provider = "voyage"` → вбудовування Voyage
- `memorySearch.provider = "mistral"` → вбудовування Mistral
- `memorySearch.provider = "ollama"` → вбудовування Ollama (локально/self-hosted; зазвичай без тарифікації хостингового API)
- Необов’язковий перехід до віддаленого постачальника, якщо локальні вбудовування не спрацювали

Можна повністю працювати локально з `memorySearch.provider = "local"` (без використання API).

Див. [Memory](/uk/concepts/memory).

### 5) Інструмент вебпошуку

`web_search` може спричиняти витрати за використання залежно від вашого постачальника:

- **Brave Search API**: `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: за замовчуванням без ключа, але потребує доступного хоста Ollama плюс `ollama signin`; також може повторно використовувати звичайну bearer-автентифікацію постачальника Ollama, якщо хост її вимагає
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: резервний варіант без ключа (без тарифікації API, але неофіційний і на основі HTML)
- **SearXNG**: `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (без ключа/self-hosted; без тарифікації хостингового API)

Застарілі шляхи постачальників `tools.web.search.*` усе ще завантажуються через тимчасовий compatibility shim, але більше не є рекомендованою поверхнею конфігурації.

**Безплатний кредит Brave Search:** Кожен тарифний план Brave включає
відновлюваний безплатний кредит \$5 на місяць. План Search коштує \$5 за 1 000 запитів, тож цього кредиту достатньо для
1 000 запитів на місяць без оплати. Установіть свій ліміт використання в панелі Brave,
щоб уникнути неочікуваних витрат.

Див. [Web tools](/uk/tools/web).

### 5) Інструмент веботримання (Firecrawl)

`web_fetch` може викликати **Firecrawl**, якщо присутній API-ключ:

- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webFetch.apiKey`

Якщо Firecrawl не налаштовано, інструмент повертається до прямого fetch + readability (без платного API).

Див. [Web tools](/uk/tools/web).

### 6) Знімки використання постачальника (status/health)

Деякі команди status викликають **кінцеві точки використання постачальника**, щоб показати вікна квот або стан автентифікації.
Зазвичай це виклики з низьким обсягом, але вони все одно звертаються до API постачальників:

- `openclaw status --usage`
- `openclaw models status --json`

Див. [Models CLI](/cli/models).

### 7) Підсумовування захисту компактизації

Захист компактизації може підсумовувати історію сеансу за допомогою **поточної моделі**, що
викликає API постачальника під час виконання.

Див. [Session management + compaction](/uk/reference/session-management-compaction).

### 8) Сканування / probe моделей

`openclaw models scan` може виконувати probe моделей OpenRouter і використовує `OPENROUTER_API_KEY`, якщо
probe увімкнено.

Див. [Models CLI](/cli/models).

### 9) Talk (мовлення)

Режим Talk може викликати **ElevenLabs**, якщо його налаштовано:

- `ELEVENLABS_API_KEY` або `talk.providers.elevenlabs.apiKey`

Див. [Talk mode](/uk/nodes/talk).

### 10) Skills (сторонні API)

Skills можуть зберігати `apiKey` у `skills.entries.<name>.apiKey`. Якщо skill використовує цей ключ для зовнішніх
API, це може спричиняти витрати відповідно до постачальника цього skill.

Див. [Skills](/uk/tools/skills).
