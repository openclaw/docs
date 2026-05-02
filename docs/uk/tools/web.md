---
read_when:
    - Ви хочете увімкнути або налаштувати web_search
    - Ви хочете увімкнути або налаштувати x_search
    - Потрібно вибрати пошукового провайдера
    - Ви хочете зрозуміти автоматичне виявлення та резервне перемикання провайдерів
sidebarTitle: Web Search
summary: web_search, x_search і web_fetch -- шукати в інтернеті, шукати дописи X або отримувати вміст сторінки
title: Пошук в інтернеті
x-i18n:
    generated_at: "2026-05-02T04:49:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6200b148d750e1ed7205bd256ba6d33b4f6491577ba7544a684ffd11990ac274
    source_path: tools/web.md
    workflow: 16
---

Інструмент `web_search` шукає в інтернеті за допомогою налаштованого вами провайдера та
повертає результати. Результати кешуються за запитом на 15 хвилин (можна налаштувати).

OpenClaw також містить `x_search` для дописів X (раніше Twitter) і
`web_fetch` для легкого отримання URL. На цьому етапі `web_fetch` залишається
локальним, тоді як `web_search` і `x_search` можуть внутрішньо використовувати xAI Responses.

<Info>
  `web_search` — це легкий HTTP-інструмент, а не автоматизація браузера. Для
  сайтів, що активно використовують JS, або входу в обліковий запис використовуйте [Веббраузер](/uk/tools/browser). Для
  отримання конкретної URL-адреси використовуйте [Web Fetch](/uk/tools/web-fetch).
</Info>

## Швидкий старт

<Steps>
  <Step title="Виберіть провайдера">
    Виберіть провайдера та виконайте всі потрібні налаштування. Деякі провайдери
    не потребують ключів, тоді як інші використовують ключі API. Докладніше дивіться
    на сторінках провайдерів нижче.
  </Step>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    ```
    Це зберігає провайдера та всі потрібні облікові дані. Ви також можете задати env
    var (наприклад `BRAVE_API_KEY`) і пропустити цей крок для провайдерів,
    що працюють через API.
  </Step>
  <Step title="Використайте">
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
    Структуровані результати з фрагментами. Підтримує режим `llm-context`, фільтри країни/мови. Доступний безкоштовний тариф.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/uk/tools/duckduckgo-search">
    Резервний варіант без ключа. Ключ API не потрібен. Неофіційна інтеграція на основі HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/uk/tools/exa-search">
    Нейронний + ключовий пошук із витягуванням вмісту (виділення, текст, підсумки).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/uk/tools/firecrawl">
    Структуровані результати. Найкраще поєднувати з `firecrawl_search` і `firecrawl_scrape` для глибокого витягування.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/uk/tools/gemini-search">
    Відповіді, синтезовані ШІ, з цитуваннями через прив’язку до Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/uk/tools/grok-search">
    Відповіді, синтезовані ШІ, з цитуваннями через вебприв’язку xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/uk/tools/kimi-search">
    Відповіді, синтезовані ШІ, з цитуваннями через вебпошук Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/uk/tools/minimax-search">
    Структуровані результати через пошуковий API MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/uk/tools/ollama-search">
    Пошук через локальний хост Ollama з виконаним входом або розміщений Ollama API.
  </Card>
  <Card title="Perplexity" icon="search" href="/uk/tools/perplexity-search">
    Структуровані результати з керуванням витягуванням вмісту та фільтрацією доменів.
  </Card>
  <Card title="SearXNG" icon="server" href="/uk/tools/searxng-search">
    Самостійно розгорнутий метапошук. Ключ API не потрібен. Агрегує Google, Bing, DuckDuckGo та інші.
  </Card>
  <Card title="Tavily" icon="globe" href="/uk/tools/tavily">
    Структуровані результати з глибиною пошуку, фільтрацією за темою та `tavily_extract` для витягування URL.
  </Card>
</CardGroup>

### Порівняння провайдерів

| Провайдер                                 | Стиль результатів          | Фільтри                                         | Ключ API                                                                                |
| ----------------------------------------- | -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| [Brave](/uk/tools/brave-search)              | Структуровані фрагменти    | Країна, мова, час, режим `llm-context`          | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/uk/tools/duckduckgo-search)    | Структуровані фрагменти    | --                                              | Немає (без ключа)                                                                       |
| [Exa](/uk/tools/exa-search)                  | Структуровані + витягнуті  | Нейронний/ключовий режим, дата, витягування вмісту | `EXA_API_KEY`                                                                           |
| [Firecrawl](/uk/tools/firecrawl)             | Структуровані фрагменти    | Через інструмент `firecrawl_search`             | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/uk/tools/gemini-search)            | Синтезовано ШІ + цитування | --                                              | `GEMINI_API_KEY`                                                                        |
| [Grok](/uk/tools/grok-search)                | Синтезовано ШІ + цитування | --                                              | `XAI_API_KEY`                                                                           |
| [Kimi](/uk/tools/kimi-search)                | Синтезовано ШІ + цитування | --                                              | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/uk/tools/minimax-search)   | Структуровані фрагменти    | Регіон (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/uk/tools/ollama-search) | Структуровані фрагменти    | --                                              | Немає для локальних хостів із виконаним входом; `OLLAMA_API_KEY` для прямого пошуку `https://ollama.com` |
| [Perplexity](/uk/tools/perplexity-search)    | Структуровані фрагменти    | Країна, мова, час, домени, обмеження вмісту     | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/uk/tools/searxng-search)          | Структуровані фрагменти    | Категорії, мова                                 | Немає (самостійно розгорнуто)                                                           |
| [Tavily](/uk/tools/tavily)                   | Структуровані фрагменти    | Через інструмент `tavily_search`                | `TAVILY_API_KEY`                                                                        |

## Автовиявлення

## Нативний вебпошук OpenAI

Прямі моделі OpenAI Responses автоматично використовують розміщений OpenAI інструмент `web_search`, коли вебпошук OpenClaw увімкнено й жоден керований провайдер не закріплено. Це поведінка, що належить провайдеру, у вбудованому Plugin OpenAI і застосовується лише до нативного трафіку OpenAI API, а не до OpenAI-сумісних проксі-базових URL чи маршрутів Azure. Установіть `tools.web.search.provider` на іншого провайдера, наприклад `brave`, щоб залишити керований інструмент `web_search` для моделей OpenAI, або встановіть `tools.web.search.enabled: false`, щоб вимкнути і керований пошук, і нативний пошук OpenAI.

## Нативний вебпошук Codex

Моделі, сумісні з Codex, можуть за бажанням використовувати провайдерський нативний інструмент Responses `web_search` замість керованої функції OpenClaw `web_search`.

- Налаштуйте його в `tools.web.search.openaiCodex`
- Він активується лише для моделей, сумісних із Codex (`openai-codex/*` або провайдерів, що використовують `api: "openai-codex-responses"`)
- Керований `web_search` надалі застосовується до моделей не Codex
- `mode: "cached"` — стандартне та рекомендоване налаштування
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

Якщо нативний пошук Codex увімкнено, але поточна модель не сумісна з Codex, OpenClaw зберігає звичайну керовану поведінку `web_search`.

## Налаштування вебпошуку

Списки провайдерів у документації та потоках налаштування впорядковані за абеткою. Автовиявлення зберігає
окремий порядок пріоритету.

Якщо `provider` не задано, OpenClaw перевіряє провайдерів у такому порядку та використовує
першого готового:

Спершу провайдери, що працюють через API:

1. **Brave** -- `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey` (порядок 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` або `plugins.entries.minimax.config.webSearch.apiKey` (порядок 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` або `models.providers.google.apiKey` (порядок 20)
4. **Grok** -- `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` (порядок 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey` (порядок 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey` (порядок 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey` (порядок 60)
8. **Exa** -- `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey` (порядок 65)
9. **Tavily** -- `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey` (порядок 70)

Після цього резервні варіанти без ключа:

10. **DuckDuckGo** -- резервний HTML-варіант без ключа, без облікового запису чи ключа API (порядок 100)
11. **Ollama Web Search** -- резервний варіант без ключа через ваш налаштований локальний хост Ollama, коли він доступний і в ньому виконано `ollama signin`; може повторно використовувати bearer-автентифікацію провайдера Ollama, коли вона потрібна хосту, і може викликати прямий пошук `https://ollama.com`, коли налаштовано `OLLAMA_API_KEY` (порядок 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Якщо жодного провайдера не виявлено, виконується резервний перехід до Brave (ви отримаєте помилку про відсутній ключ
із пропозицією його налаштувати).

<Note>
  Усі поля ключів провайдерів підтримують об’єкти SecretRef. Plugin-обмежені SecretRef
  у `plugins.entries.<plugin>.config.webSearch.apiKey` розв’язуються для
  вбудованих провайдерів вебпошуку, що працюють через API, зокрема Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity і Tavily,
  незалежно від того, чи провайдера явно вибрано через `tools.web.search.provider`, чи
  вибрано через автовиявлення. У режимі автовиявлення OpenClaw розв’язує лише ключ
  вибраного провайдера -- невибрані SecretRef залишаються неактивними, тож ви можете
  тримати кілька провайдерів налаштованими без витрат на розв’язання для тих,
  які не використовуєте.
</Note>

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Конфігурація, специфічна для провайдера (ключі API, базові URL, режими), розміщується в
`plugins.entries.<plugin>.config.webSearch.*`. Gemini також може повторно використовувати
`models.providers.google.apiKey` і `models.providers.google.baseUrl` як резервні варіанти з нижчим пріоритетом
після своєї спеціальної конфігурації вебпошуку та `GEMINI_API_KEY`. Дивіться
приклади на сторінках провайдерів.

Вибір резервного провайдера `web_fetch` окремий:

- виберіть його за допомогою `tools.web.fetch.provider`
- або пропустіть це поле й дозвольте OpenClaw автоматично виявити першого готового провайдера web-fetch
  з доступних облікових даних
- `web_fetch` без пісочниці може використовувати встановлені провайдери Plugin, які оголошують
  `contracts.webFetchProviders`; отримання в пісочниці залишається лише вбудованим
- наразі вбудований провайдер web-fetch — Firecrawl, налаштований у
  `plugins.entries.firecrawl.config.webFetch.*`

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон Moonshot API (`https://api.moonshot.ai/v1` або `https://api.moonshot.cn/v1`)
- стандартну модель вебпошуку Kimi (за замовчуванням `kimi-k2.6`)

Для `x_search` налаштуйте `plugins.entries.xai.config.xSearch.*`. Він використовує той самий fallback `XAI_API_KEY`, що й вебпошук Grok.
Застарілу конфігурацію `tools.web.x_search.*` автоматично мігрує `openclaw doctor --fix`.
Коли ви вибираєте Grok під час `openclaw onboard` або `openclaw configure --section web`, OpenClaw також може запропонувати необов’язкове налаштування `x_search` із тим самим ключем.
Це окремий наступний крок у межах шляху Grok, а не окремий вибір провайдера вебпошуку верхнього рівня. Якщо ви виберете іншого провайдера, OpenClaw не показуватиме запит `x_search`.

### Зберігання API-ключів

<Tabs>
  <Tab title="Файл конфігурації">
    Запустіть `openclaw configure --section web` або задайте ключ напряму:

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
    Задайте env-змінну провайдера в середовищі процесу Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Для встановлення gateway помістіть її в `~/.openclaw/.env`.
    Див. [Env vars](/uk/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Параметри інструмента

| Параметр              | Опис                                                           |
| --------------------- | -------------------------------------------------------------- |
| `query`               | Пошуковий запит (обов’язково)                                  |
| `count`               | Кількість результатів для повернення (1-10, типово: 5)         |
| `country`             | 2-літерний код країни ISO (наприклад, "US", "DE")              |
| `language`            | Код мови ISO 639-1 (наприклад, "en", "de")                     |
| `search_lang`         | Код мови пошуку (лише Brave)                                   |
| `freshness`           | Фільтр часу: `day`, `week`, `month` або `year`                 |
| `date_after`          | Результати після цієї дати (YYYY-MM-DD)                        |
| `date_before`         | Результати до цієї дати (YYYY-MM-DD)                           |
| `ui_lang`             | Код мови UI (лише Brave)                                       |
| `domain_filter`       | Масив allowlist/denylist доменів (лише Perplexity)             |
| `max_tokens`          | Загальний бюджет вмісту, типово 25000 (лише Perplexity)        |
| `max_tokens_per_page` | Ліміт токенів на сторінку, типово 2048 (лише Perplexity)       |

<Warning>
  Не всі параметри працюють з усіма провайдерами. Режим Brave `llm-context`
  відхиляє `ui_lang`; `date_before` також потребує `date_after`, оскільки
  користувацькі діапазони свіжості Brave вимагають і початкової, і кінцевої дат.
  Gemini, Grok і Kimi повертають одну синтезовану відповідь із цитуваннями. Вони
  приймають `count` для сумісності зі спільним інструментом, але це не змінює
  форму обґрунтованої відповіді. Gemini підтримує `freshness`, `date_after` і
  `date_before`, перетворюючи їх на часові діапазони grounding Google Search.
  Perplexity поводиться так само, коли ви використовуєте шлях сумісності
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` або `OPENROUTER_API_KEY`).
  SearXNG приймає `http://` лише для довірених приватних мережевих або loopback-хостів;
  публічні кінцеві точки SearXNG мають використовувати `https://`.
  Firecrawl і Tavily підтримують лише `query` і `count` через `web_search`
  -- використовуйте їхні спеціальні інструменти для розширених параметрів.
</Warning>

## x_search

`x_search` запитує дописи X (раніше Twitter) за допомогою xAI та повертає
синтезовані AI відповіді з цитуваннями. Він приймає запити природною мовою та
необов’язкові структуровані фільтри. OpenClaw вмикає вбудований інструмент xAI
`x_search` лише для запиту, який обслуговує цей виклик інструмента.

<Note>
  xAI документує `x_search` як такий, що підтримує пошук за ключовими словами,
  семантичний пошук, пошук користувачів і отримання тредів. Для статистики
  взаємодії з окремим дописом, як-от репости, відповіді, закладки або перегляди,
  надавайте перевагу цільовому пошуку за точною URL-адресою допису або status ID.
  Широкі пошуки за ключовими словами можуть знайти потрібний допис, але повернути
  менш повні метадані для окремого допису. Хороший шаблон: спочатку знайти допис,
  потім виконати другий запит `x_search`, сфокусований на цьому точному дописі.
</Note>

### Конфігурація x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` надсилає POST на `<baseUrl>/responses`, коли встановлено
`plugins.entries.xai.config.xSearch.baseUrl`. Якщо це поле пропущено,
він повертається до `plugins.entries.xai.config.webSearch.baseUrl`, потім до
застарілого `tools.web.search.grok.baseUrl`, і нарешті до публічної кінцевої точки xAI.

### Параметри x_search

| Параметр                     | Опис                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| `query`                      | Пошуковий запит (обов’язково)                               |
| `allowed_x_handles`          | Обмежити результати певними X handles                       |
| `excluded_x_handles`         | Виключити певні X handles                                   |
| `from_date`                  | Включати лише дописи на цю дату або після неї (YYYY-MM-DD)  |
| `to_date`                    | Включати лише дописи на цю дату або до неї (YYYY-MM-DD)     |
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
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Приклади

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
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
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Пов’язане

- [Web Fetch](/uk/tools/web-fetch) -- отримати URL і витягти читабельний вміст
- [Web Browser](/uk/tools/browser) -- повна автоматизація браузера для JS-heavy сайтів
- [Grok Search](/uk/tools/grok-search) -- Grok як провайдер `web_search`
- [Ollama Web Search](/uk/tools/ollama-search) -- вебпошук без ключа через ваш хост Ollama
