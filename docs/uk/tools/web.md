---
read_when:
    - Ви хочете ввімкнути або налаштувати web_search
    - Ви хочете ввімкнути або налаштувати x_search
    - Вам потрібно вибрати провайдера пошуку
    - Ви хочете зрозуміти автоматичне виявлення та fallback провайдера
sidebarTitle: Web Search
summary: web_search, x_search і web_fetch — пошук у вебі, пошук дописів у X або отримання вмісту сторінки
title: Вебпошук
x-i18n:
    generated_at: "2026-04-27T06:29:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 15
---

Інструмент `web_search` виконує пошук у вебі за допомогою налаштованого провайдера і
повертає результати. Результати кешуються за запитом на 15 хвилин (це можна налаштувати).

OpenClaw також містить `x_search` для дописів X (раніше Twitter) і
`web_fetch` для полегшеного отримання URL. На цьому етапі `web_fetch` залишається
локальним, тоді як `web_search` і `x_search` можуть під капотом використовувати xAI Responses.

<Info>
  `web_search` — це легкий HTTP-інструмент, а не автоматизація браузера. Для
  сайтів із важким JS або логінами використовуйте [Web Browser](/uk/tools/browser). Для
  отримання конкретного URL використовуйте [Web Fetch](/uk/tools/web-fetch).
</Info>

## Швидкий старт

<Steps>
  <Step title="Виберіть провайдера">
    Виберіть провайдера та завершіть усі необхідні кроки налаштування. Деякі провайдери
    не потребують ключів, тоді як інші використовують API key. Докладніше
    див. на сторінках провайдерів нижче.
  </Step>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    ```
    Це збереже провайдера та всі потрібні облікові дані. Ви також можете задати env
    var (наприклад, `BRAVE_API_KEY`) і пропустити цей крок для
    провайдерів на основі API.
  </Step>
  <Step title="Використовуйте">
    Тепер агент може викликати `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Для дописів у X використовуйте:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Вибір провайдера

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/uk/tools/brave-search">
    Структуровані результати зі snippet. Підтримує режим `llm-context`, фільтри країни/мови. Доступний безкоштовний тариф.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/uk/tools/duckduckgo-search">
    Fallback без ключа. API key не потрібен. Неофіційна інтеграція на основі HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/uk/tools/exa-search">
    Нейронний + ключовий пошук із витяганням вмісту (highlights, текст, підсумки).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/uk/tools/firecrawl">
    Структуровані результати. Найкраще поєднується з `firecrawl_search` і `firecrawl_scrape` для глибокого витягання.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/uk/tools/gemini-search">
    AI-синтезовані відповіді з цитуванням через grounding Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/uk/tools/grok-search">
    AI-синтезовані відповіді з цитуванням через web grounding xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/uk/tools/kimi-search">
    AI-синтезовані відповіді з цитуванням через вебпошук Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/uk/tools/minimax-search">
    Структуровані результати через API пошуку MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/uk/tools/ollama-search">
    Пошук через локальний хост Ollama з входом у систему або розміщений API Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/uk/tools/perplexity-search">
    Структуровані результати з елементами керування витяганням вмісту та фільтрацією доменів.
  </Card>
  <Card title="SearXNG" icon="server" href="/uk/tools/searxng-search">
    Самостійно розміщений метапошук. API key не потрібен. Агрегує Google, Bing, DuckDuckGo та інші.
  </Card>
  <Card title="Tavily" icon="globe" href="/uk/tools/tavily">
    Структуровані результати з глибиною пошуку, фільтрацією тем і `tavily_extract` для витягання URL.
  </Card>
</CardGroup>

### Порівняння провайдерів

| Провайдер                                 | Стиль результатів           | Фільтри                                          | API key                                                                                 |
| ----------------------------------------- | --------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/uk/tools/brave-search)              | Структуровані snippet       | Країна, мова, час, режим `llm-context`           | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/uk/tools/duckduckgo-search)    | Структуровані snippet       | --                                               | Немає (без ключа)                                                                       |
| [Exa](/uk/tools/exa-search)                  | Структуровані + витягнуті   | Нейронний/ключовий режим, дата, витягання вмісту | `EXA_API_KEY`                                                                           |
| [Firecrawl](/uk/tools/firecrawl)             | Структуровані snippet       | Через інструмент `firecrawl_search`              | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/uk/tools/gemini-search)            | AI-синтезовані + цитування  | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/uk/tools/grok-search)                | AI-синтезовані + цитування  | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/uk/tools/kimi-search)                | AI-синтезовані + цитування  | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/uk/tools/minimax-search)   | Структуровані snippet       | Регіон (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/uk/tools/ollama-search) | Структуровані snippet       | --                                               | Немає для локальних хостів із входом у систему; `OLLAMA_API_KEY` для прямого пошуку `https://ollama.com` |
| [Perplexity](/uk/tools/perplexity-search)    | Структуровані snippet       | Країна, мова, час, домени, обмеження вмісту      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/uk/tools/searxng-search)          | Структуровані snippet       | Категорії, мова                                  | Немає (самостійно розміщений)                                                           |
| [Tavily](/uk/tools/tavily)                   | Структуровані snippet       | Через інструмент `tavily_search`                 | `TAVILY_API_KEY`                                                                        |

## Автовиявлення

## Власний вебпошук OpenAI

Прямі моделі OpenAI Responses автоматично використовують розміщений OpenAI інструмент `web_search`, коли вебпошук OpenClaw увімкнено й не зафіксовано керований провайдер. Це поведінка, що належить провайдеру у вбудованому plugin OpenAI, і вона застосовується лише до нативного API-трафіку OpenAI, а не до сумісних з OpenAI proxy base URL чи маршрутів Azure. Установіть `tools.web.search.provider` на іншого провайдера, наприклад `brave`, щоб зберегти керований інструмент `web_search` для моделей OpenAI, або встановіть `tools.web.search.enabled: false`, щоб вимкнути і керований пошук, і власний пошук OpenAI.

## Власний вебпошук Codex

Моделі з підтримкою Codex можуть за бажанням використовувати власний інструмент `web_search` провайдера Responses замість керованої функції `web_search` OpenClaw.

- Налаштовується через `tools.web.search.openaiCodex`
- Активується лише для моделей із підтримкою Codex (`openai-codex/*` або провайдерів, що використовують `api: "openai-codex-responses"`)
- Керований `web_search` і далі застосовується до моделей без Codex
- `mode: "cached"` — типове та рекомендоване значення
- `tools.web.search.enabled: false` вимикає і керований, і власний пошук

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

Якщо власний пошук Codex увімкнено, але поточна модель не підтримує Codex, OpenClaw зберігає звичайну поведінку керованого `web_search`.

## Налаштування вебпошуку

Списки провайдерів у документації та потоках налаштування наведено за алфавітом. Автовиявлення використовує
окремий порядок пріоритетів.

Якщо `provider` не задано, OpenClaw перевіряє провайдерів у такому порядку й використовує
першого, який готовий:

Спочатку провайдери на основі API:

1. **Brave** -- `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey` (порядок 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey` (порядок 15)
3. **Gemini** -- `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey` (порядок 20)
4. **Grok** -- `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` (порядок 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey` (порядок 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey` (порядок 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey` (порядок 60)
8. **Exa** -- `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey` (порядок 65)
9. **Tavily** -- `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey` (порядок 70)

Після цього fallback без ключа:

10. **DuckDuckGo** -- HTML-fallback без ключа, без облікового запису чи API key (порядок 100)
11. **Ollama Web Search** -- fallback без ключа через ваш налаштований локальний хост Ollama, коли він доступний і виконано `ollama signin`; може повторно використовувати bearer auth провайдера Ollama, коли це потрібно хосту, і може викликати прямий пошук `https://ollama.com`, якщо налаштовано `OLLAMA_API_KEY` (порядок 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Якщо жодного провайдера не виявлено, використовується Brave (ви отримаєте помилку
про відсутній ключ із пропозицією налаштувати його).

<Note>
  Усі поля ключів провайдерів підтримують об’єкти SecretRef. SecretRef
  у межах plugin у `plugins.entries.<plugin>.config.webSearch.apiKey` визначаються для
  вбудованих провайдерів вебпошуку на основі API, включно з Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity і Tavily,
  незалежно від того, чи провайдер вибрано явно через `tools.web.search.provider`, чи
  через автовиявлення. У режимі автовиявлення OpenClaw визначає лише ключ
  вибраного провайдера — SecretRef невибраних провайдерів залишаються неактивними, тож ви можете
  тримати налаштованими кількох провайдерів, не сплачуючи вартість визначення для
  тих, які не використовуєте.
</Note>

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // типово: true
        provider: "brave", // або пропустіть для автовиявлення
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Конфігурація для конкретного провайдера (API key, base URL, режими) знаходиться в
`plugins.entries.<plugin>.config.webSearch.*`. Приклади див. на сторінках провайдерів.

Вибір fallback-провайдера для `web_fetch` виконується окремо:

- виберіть його через `tools.web.fetch.provider`
- або пропустіть це поле й дозвольте OpenClaw автоматично виявити першого готового
  провайдера web-fetch серед доступних облікових даних
- наразі вбудованим провайдером web-fetch є Firecrawl, який налаштовується через
  `plugins.entries.firecrawl.config.webFetch.*`

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- API-регіон Moonshot (`https://api.moonshot.ai/v1` або `https://api.moonshot.cn/v1`)
- типову модель вебпошуку Kimi (типово `kimi-k2.6`)

Для `x_search` налаштуйте `plugins.entries.xai.config.xSearch.*`. Він використовує
той самий fallback `XAI_API_KEY`, що й вебпошук Grok.
Застарілу конфігурацію `tools.web.x_search.*` автоматично мігрує `openclaw doctor --fix`.
Коли ви вибираєте Grok під час `openclaw onboard` або `openclaw configure --section web`,
OpenClaw також може запропонувати необов’язкове налаштування `x_search` з тим самим ключем.
Це окремий подальший крок усередині шляху Grok, а не окремий вибір провайдера
вебпошуку верхнього рівня. Якщо ви виберете іншого провайдера, OpenClaw не
показуватиме запит для `x_search`.

### Зберігання API key

<Tabs>
  <Tab title="Файл конфігурації">
    Запустіть `openclaw configure --section web` або задайте ключ безпосередньо:

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

    Для встановлення gateway помістіть її в `~/.openclaw/.env`.
    Див. [Змінні env](/uk/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Параметри інструмента

| Параметр             | Опис                                                  |
| -------------------- | ----------------------------------------------------- |
| `query`              | Пошуковий запит (обов’язково)                         |
| `count`              | Кількість результатів для повернення (1-10, типово: 5) |
| `country`            | 2-літерний код країни ISO (наприклад, "US", "DE")     |
| `language`           | Код мови ISO 639-1 (наприклад, "en", "de")            |
| `search_lang`        | Код мови пошуку (лише Brave)                          |
| `freshness`          | Фільтр часу: `day`, `week`, `month` або `year`        |
| `date_after`         | Результати після цієї дати (YYYY-MM-DD)               |
| `date_before`        | Результати до цієї дати (YYYY-MM-DD)                  |
| `ui_lang`            | Код мови UI (лише Brave)                              |
| `domain_filter`      | Масив allowlist/denylist доменів (лише Perplexity)    |
| `max_tokens`         | Загальний бюджет вмісту, типово 25000 (лише Perplexity) |
| `max_tokens_per_page`| Обмеження токенів на сторінку, типово 2048 (лише Perplexity) |

<Warning>
  Не всі параметри працюють з усіма провайдерами. Режим `llm-context` у Brave
  відхиляє `ui_lang`, `freshness`, `date_after` і `date_before`.
  Gemini, Grok і Kimi повертають одну AI-синтезовану відповідь із цитуваннями. Вони
  приймають `count` для сумісності зі спільним інструментом, але це не змінює
  форму grounded answer.
  Perplexity поводиться так само, коли ви використовуєте шлях сумісності
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` або `OPENROUTER_API_KEY`).
  SearXNG приймає `http://` лише для довірених хостів у приватній мережі або loopback;
  публічні кінцеві точки SearXNG мають використовувати `https://`.
  Firecrawl і Tavily підтримують через `web_search`
  лише `query` і `count` -- для розширених параметрів використовуйте їхні спеціалізовані інструменти.
</Warning>

## x_search

`x_search` виконує запити до дописів у X (раніше Twitter) через xAI і повертає
AI-синтезовані відповіді з цитуваннями. Він приймає запити природною мовою та
необов’язкові структуровані фільтри. OpenClaw вмикає вбудований інструмент `x_search`
xAI лише для запиту, який обслуговує цей виклик інструмента.

<Note>
  xAI документує `x_search` як інструмент із підтримкою пошуку за ключовими словами, семантичного пошуку, пошуку користувачів і отримання thread. Для статистики взаємодії на рівні окремого допису, як-от repost, replies, bookmarks або views, краще використовувати цільовий пошук за точним URL допису або status ID. Широкі пошуки за ключовими словами можуть знайти потрібний допис, але повернути менш повні метадані для конкретного допису. Гарний шаблон такий: спочатку знайдіть допис, а потім виконайте другий запит `x_search`, зосереджений саме на цьому дописі.
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

| Параметр                   | Опис                                                   |
| -------------------------- | ------------------------------------------------------ |
| `query`                    | Пошуковий запит (обов’язково)                          |
| `allowed_x_handles`        | Обмежити результати конкретними X handle               |
| `excluded_x_handles`       | Виключити конкретні X handle                           |
| `from_date`                | Включати лише дописи, створені в цю дату або пізніше (YYYY-MM-DD) |
| `to_date`                  | Включати лише дописи, створені в цю дату або раніше (YYYY-MM-DD) |
| `enable_image_understanding` | Дозволити xAI аналізувати зображення, вкладені у відповідні дописи |
| `enable_video_understanding` | Дозволити xAI аналізувати відео, вкладені у відповідні дописи     |

### Приклад x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Статистика окремого допису: використовуйте точний status URL або status ID, коли це можливо
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Приклади

```javascript
// Базовий пошук
await web_search({ query: "OpenClaw plugin SDK" });

// Пошук для Німеччини
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Недавні результати (за минулий тиждень)
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

- [Web Fetch](/uk/tools/web-fetch) -- отримання URL і витягання придатного для читання вмісту
- [Web Browser](/uk/tools/browser) -- повна автоматизація браузера для сайтів із важким JS
- [Grok Search](/uk/tools/grok-search) -- Grok як провайдер `web_search`
- [Ollama Web Search](/uk/tools/ollama-search) -- вебпошук без ключа через ваш хост Ollama
