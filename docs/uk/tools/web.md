---
read_when:
    - Ви хочете ввімкнути або налаштувати `web_search`
    - Ви хочете ввімкнути або налаштувати `x_search`
    - Вам потрібно вибрати пошукового провайдера
    - |-
      Ви хочете зрозуміти автовизначення і fallback провайдерів +#+#+#+#+#+analysis to=functions.read 】【。】【commentary  天天中彩票是不是json
      {"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n","offset":1,"limit":10}
sidebarTitle: Web Search
summary: '`web_search`, `x_search` і `web_fetch` — шукайте в інтернеті, у дописах X або отримуйте вміст сторінок'
title: Вебпошук
x-i18n:
    generated_at: "2026-04-23T21:18:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2713e8b13cf0f3c6bba38bee50c24771b914a5cd235ca521bed434a6ddbe2305
    source_path: tools/web.md
    workflow: 15
---

Інструмент `web_search` виконує пошук в інтернеті за допомогою налаштованого провайдера та
повертає результати. Результати кешуються за запитом на 15 хвилин (налаштовується).

OpenClaw також містить `x_search` для дописів X (колишній Twitter) і
`web_fetch` для легкого отримання URL. На цьому етапі `web_fetch` залишається
локальним, тоді як `web_search` і `x_search` можуть використовувати xAI Responses під капотом.

<Info>
  `web_search` — це легкий HTTP-інструмент, а не автоматизація браузера. Для
  сайтів із важким JS або логінами використовуйте [Web Browser](/uk/tools/browser). Для
  отримання конкретного URL використовуйте [Web Fetch](/uk/tools/web-fetch).
</Info>

## Швидкий старт

<Steps>
  <Step title="Виберіть провайдера">
    Виберіть провайдера та виконайте всі потрібні кроки налаштування. Деякі провайдери
    не потребують ключа, тоді як інші використовують API key. Докладніше див. на
    сторінках провайдерів нижче.
  </Step>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    ```
    Це збереже провайдера і всі потрібні облікові дані. Ви також можете задати env
    var (наприклад `BRAVE_API_KEY`) і пропустити цей крок для провайдерів,
    які працюють через API.
  </Step>
  <Step title="Використовуйте">
    Тепер агент може викликати `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Для дописів X використовуйте:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Вибір провайдера

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/uk/tools/brave-search">
    Структуровані результати зі сніпетами. Підтримує режим `llm-context`, фільтри країни/мови. Доступний безкоштовний рівень.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/uk/tools/duckduckgo-search">
    Fallback без ключа. API key не потрібен. Неофіційна інтеграція на основі HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/uk/tools/exa-search">
    Нейронний + ключовий пошук із витягуванням вмісту (highlights, текст, підсумки).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/uk/tools/firecrawl">
    Структуровані результати. Найкраще працює разом із `firecrawl_search` і `firecrawl_scrape` для глибокого витягування.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/uk/tools/gemini-search">
    AI-синтезовані відповіді з цитатами через Google Search grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/uk/tools/grok-search">
    AI-синтезовані відповіді з цитатами через xAI web grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/uk/tools/kimi-search">
    AI-синтезовані відповіді з цитатами через вебпошук Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/uk/tools/minimax-search">
    Структуровані результати через API пошуку MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/uk/tools/ollama-search">
    Пошук без ключа через ваш налаштований host Ollama. Потребує `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/uk/tools/perplexity-search">
    Структуровані результати з керуванням витягуванням вмісту та фільтрацією доменів.
  </Card>
  <Card title="SearXNG" icon="server" href="/uk/tools/searxng-search">
    Self-hosted meta-search. API key не потрібен. Агрегує Google, Bing, DuckDuckGo тощо.
  </Card>
  <Card title="Tavily" icon="globe" href="/uk/tools/tavily">
    Структуровані результати з глибиною пошуку, фільтрацією тем і `tavily_extract` для витягування URL.
  </Card>
</CardGroup>

### Порівняння провайдерів

| Provider                                  | Result style               | Filters                                            | API key                                                                           |
| ----------------------------------------- | -------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Brave](/uk/tools/brave-search)              | Структуровані сніпети      | Країна, мова, час, режим `llm-context`             | `BRAVE_API_KEY`                                                                   |
| [DuckDuckGo](/uk/tools/duckduckgo-search)    | Структуровані сніпети      | --                                                 | Немає (без ключа)                                                                 |
| [Exa](/uk/tools/exa-search)                  | Структурований + витягнутий | Режим neural/keyword, дата, витягування вмісту     | `EXA_API_KEY`                                                                     |
| [Firecrawl](/uk/tools/firecrawl)             | Структуровані сніпети      | Через інструмент `firecrawl_search`                | `FIRECRAWL_API_KEY`                                                               |
| [Gemini](/uk/tools/gemini-search)            | AI-синтезовані + цитати    | --                                                 | `GEMINI_API_KEY`                                                                  |
| [Grok](/uk/tools/grok-search)                | AI-синтезовані + цитати    | --                                                 | `XAI_API_KEY`                                                                     |
| [Kimi](/uk/tools/kimi-search)                | AI-синтезовані + цитати    | --                                                 | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                               |
| [MiniMax Search](/uk/tools/minimax-search)   | Структуровані сніпети      | Регіон (`global` / `cn`)                           | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                |
| [Ollama Web Search](/uk/tools/ollama-search) | Структуровані сніпети      | --                                                 | Типово немає; потрібен `ollama signin`, може повторно використовувати bearer auth провайдера Ollama, якщо host його потребує |
| [Perplexity](/uk/tools/perplexity-search)    | Структуровані сніпети      | Країна, мова, час, домени, ліміти вмісту           | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                       |
| [SearXNG](/uk/tools/searxng-search)          | Структуровані сніпети      | Категорії, мова                                    | Немає (self-hosted)                                                               |
| [Tavily](/uk/tools/tavily)                   | Структуровані сніпети      | Через інструмент `tavily_search`                   | `TAVILY_API_KEY`                                                                  |

## Автовизначення

## Нативний вебпошук OpenAI

Прямі моделі OpenAI Responses автоматично використовують hosted-інструмент OpenAI `web_search`, коли в OpenClaw увімкнено вебпошук і не закріплено жодного керованого провайдера. Це поведінка, якою володіє провайдер у bundled Plugin OpenAI, і вона застосовується лише до нативного трафіку OpenAI API, а не до proxy base URL, сумісних з OpenAI, або маршрутів Azure. Задайте `tools.web.search.provider` на іншого провайдера, наприклад `brave`, щоб зберегти керований інструмент `web_search` для моделей OpenAI, або задайте `tools.web.search.enabled: false`, щоб вимкнути і керований пошук, і нативний пошук OpenAI.

## Нативний вебпошук Codex

Моделі з підтримкою Codex за бажанням можуть використовувати нативний для провайдера інструмент Responses `web_search` замість керованої функції `web_search` OpenClaw.

- Налаштовується в `tools.web.search.openaiCodex`
- Активується лише для моделей із підтримкою Codex (`openai-codex/*` або провайдерів із `api: "openai-codex-responses"`)
- Керований `web_search` і далі застосовується до моделей без Codex
- `mode: "cached"` — типове й рекомендоване налаштування
- `tools.web.search.enabled: false` вимикає і керований, і нативний пошук

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Якщо нативний пошук Codex увімкнено, але поточна модель не підтримує Codex, OpenClaw зберігає звичайну поведінку керованого `web_search`.

## Налаштування вебпошуку

Списки провайдерів у документації та потоках setup розташовані в алфавітному порядку. Для автовизначення використовується
окремий порядок пріоритету.

Якщо `provider` не задано, OpenClaw перевіряє провайдерів у такому порядку й використовує
першого, який готовий:

Спочатку провайдери з API:

1. **Brave** -- `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey` (порядок 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey` (порядок 15)
3. **Gemini** -- `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey` (порядок 20)
4. **Grok** -- `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` (порядок 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey` (порядок 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey` (порядок 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey` (порядок 60)
8. **Exa** -- `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey` (порядок 65)
9. **Tavily** -- `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey` (порядок 70)

Після цього — fallback без ключа:

10. **DuckDuckGo** -- fallback HTML без ключа, без облікового запису й API key (порядок 100)
11. **Ollama Web Search** -- fallback без ключа через ваш налаштований host Ollama; потребує доступного Ollama і входу через `ollama signin`, а також може повторно використовувати bearer auth провайдера Ollama, якщо host його потребує (порядок 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Якщо жодного провайдера не виявлено, використовується fallback до Brave (ви отримаєте
помилку про відсутній ключ із підказкою налаштувати його).

<Note>
  Усі поля ключів провайдерів підтримують об’єкти SecretRef. SecretRef у межах Plugin
  під `plugins.entries.<plugin>.config.webSearch.apiKey` визначаються для
  bundled-провайдерів Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity і Tavily
  незалежно від того, чи вибрано провайдера явно через `tools.web.search.provider`,
  чи його вибрано через auto-detect. У режимі auto-detect OpenClaw визначає лише
  ключ вибраного провайдера — SecretRef невибраних провайдерів залишаються
  неактивними, тож ви можете тримати налаштованими кількох провайдерів, не
  сплачуючи вартість визначення для тих, які не використовуються.
</Note>

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // типово: true
        provider: "brave", // або не задавайте для автовизначення
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Config, специфічна для провайдера (API keys, base URL, режими), міститься в
`plugins.entries.<plugin>.config.webSearch.*`. Приклади див. на сторінках
провайдерів.

Вибір fallback-провайдера `web_fetch` є окремим:

- виберіть його через `tools.web.fetch.provider`
- або пропустіть це поле й дозвольте OpenClaw автоматично визначити першого готового провайдера web-fetch на основі доступних облікових даних
- наразі bundled-провайдером web-fetch є Firecrawl, який налаштовується в
  `plugins.entries.firecrawl.config.webFetch.*`

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон API Moonshot (`https://api.moonshot.ai/v1` або `https://api.moonshot.cn/v1`)
- типову модель вебпошуку Kimi (типово `kimi-k2.6`)

Для `x_search` налаштуйте `plugins.entries.xai.config.xSearch.*`. Він використовує
той самий fallback `XAI_API_KEY`, що й вебпошук Grok.
Застаріла config `tools.web.x_search.*` автоматично мігрується через `openclaw doctor --fix`.
Коли ви вибираєте Grok під час `openclaw onboard` або `openclaw configure --section web`,
OpenClaw також може запропонувати необов’язкове налаштування `x_search` з тим самим ключем.
Це окремий подальший крок усередині шляху Grok, а не окремий top-level
вибір провайдера вебпошуку. Якщо ви вибираєте іншого провайдера, OpenClaw не
показує prompt для `x_search`.

### Зберігання API key

<Tabs>
  <Tab title="Файл config">
    Виконайте `openclaw configure --section web` або задайте ключ напряму:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Змінна середовища">
    Задайте env var провайдера в середовищі процесу Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Для встановленого gateway помістіть його в `~/.openclaw/.env`.
    Див. [Env vars](/uk/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Параметри інструмента

| Parameter             | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `query`               | Пошуковий запит (обов’язково)                            |
| `count`               | Кількість результатів для повернення (1-10, типово: 5)   |
| `country`             | 2-літерний код країни ISO (наприклад, "US", "DE")        |
| `language`            | Код мови ISO 639-1 (наприклад, "en", "de")               |
| `search_lang`         | Код мови пошуку (лише Brave)                             |
| `freshness`           | Фільтр часу: `day`, `week`, `month` або `year`           |
| `date_after`          | Результати після цієї дати (YYYY-MM-DD)                  |
| `date_before`         | Результати до цієї дати (YYYY-MM-DD)                     |
| `ui_lang`             | Код мови UI (лише Brave)                                 |
| `domain_filter`       | Масив allowlist/denylist доменів (лише Perplexity)       |
| `max_tokens`          | Загальний бюджет вмісту, типово 25000 (лише Perplexity)  |
| `max_tokens_per_page` | Ліміт токенів на сторінку, типово 2048 (лише Perplexity) |

<Warning>
  Не всі параметри працюють з усіма провайдерами. Режим Brave `llm-context`
  відхиляє `ui_lang`, `freshness`, `date_after` і `date_before`.
  Gemini, Grok і Kimi повертають одну синтезовану відповідь із цитатами. Вони
  приймають `count` для сумісності зі спільним інструментом, але це не змінює
  форму обґрунтованої відповіді.
  Perplexity поводиться так само, коли ви використовуєте шлях
  сумісності Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` або `OPENROUTER_API_KEY`).
  SearXNG приймає `http://` лише для довірених хостів у приватній мережі або loopback;
  публічні endpoint SearXNG мають використовувати `https://`.
  Firecrawl і Tavily підтримують лише `query` і `count` через `web_search`
  -- для розширених параметрів використовуйте їхні окремі інструменти.
</Warning>

## x_search

`x_search` виконує запити до дописів X (колишній Twitter) через xAI і повертає
AI-синтезовані відповіді з цитатами. Він приймає запити природною мовою та
необов’язкові структуровані фільтри. OpenClaw вмикає вбудований інструмент xAI `x_search`
лише для запиту, який обслуговує цей виклик інструмента.

<Note>
  xAI документує `x_search` як інструмент, що підтримує пошук за ключовими словами, семантичний пошук, пошук користувачів і отримання thread. Для статистики окремих дописів, як-от reposts,
  replies, bookmarks або views, надавайте перевагу цільовому lookup точного URL допису
  або status ID. Широкі пошуки за ключовими словами можуть знайти потрібний допис, але повертати менш повні метадані для конкретного допису. Хороший шаблон: спочатку знайдіть допис, а потім
  виконайте другий запит `x_search`, сфокусований саме на ньому.
</Note>

### config x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // необов’язково, якщо задано XAI_API_KEY
          },
        },
      },
    },
  },
}
```

### Параметри x_search

| Parameter                    | Description                                                |
| ---------------------------- | ---------------------------------------------------------- |
| `query`                      | Пошуковий запит (обов’язково)                              |
| `allowed_x_handles`          | Обмежити результати конкретними X-handle                   |
| `excluded_x_handles`         | Виключити конкретні X-handle                               |
| `from_date`                  | Включати лише дописи на або після цієї дати (YYYY-MM-DD)   |
| `to_date`                    | Включати лише дописи на або до цієї дати (YYYY-MM-DD)      |
| `enable_image_understanding` | Дозволити xAI аналізувати зображення, прикріплені до відповідних дописів |
| `enable_video_understanding` | Дозволити xAI аналізувати відео, прикріплені до відповідних дописів |

### Приклад x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Статистика окремого допису: використовуйте точний URL статусу або status ID, коли це можливо
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Приклади

```javascript
// Базовий пошук
await web_search({ query: "OpenClaw plugin SDK" });

// Пошук, специфічний для Німеччини
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Недавні результати (за останній тиждень)
await web_search({ query: "AI developments", freshness: "week" });

// Діапазон дат
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Фільтрація доменів (лише Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Профілі інструментів

Якщо ви використовуєте профілі інструментів або allowlist, додайте `web_search`, `x_search` або `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // або: allow: ["group:web"]  (включає web_search, x_search і web_fetch)
  },
}
```

## Пов’язане

- [Web Fetch](/uk/tools/web-fetch) -- отримання URL і витягування читабельного вмісту
- [Web Browser](/uk/tools/browser) -- повна автоматизація браузера для сайтів із важким JS
- [Grok Search](/uk/tools/grok-search) -- Grok як провайдер `web_search`
- [Ollama Web Search](/uk/tools/ollama-search) -- вебпошук без ключа через ваш host Ollama
