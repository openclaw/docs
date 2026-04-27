---
read_when:
    - Ви хочете ввімкнути або налаштувати web_search
    - Ви хочете ввімкнути або налаштувати x_search
    - Вам потрібно вибрати постачальника пошуку
    - Ви хочете зрозуміти авто виявлення та резервне перемикання на постачальника
sidebarTitle: Web Search
summary: web_search, x_search та web_fetch — шукати в інтернеті, шукати дописи в X або отримувати вміст сторінки
title: Пошук у вебі
x-i18n:
    generated_at: "2026-04-27T01:11:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2effe661329a0bf4eb98c23a097816343819ae12dbc0f0e77fa935567eb1f0
    source_path: tools/web.md
    workflow: 15
---

Інструмент `web_search` шукає в інтернеті за допомогою налаштованого постачальника та
повертає результати. Результати кешуються за запитом на 15 хвилин (можна налаштувати).

OpenClaw також містить `x_search` для дописів у X (раніше Twitter) та
`web_fetch` для полегшеного отримання URL. На цьому етапі `web_fetch` залишається
локальним, тоді як `web_search` і `x_search` можуть використовувати xAI Responses під капотом.

<Info>
  `web_search` — це полегшений HTTP-інструмент, а не автоматизація браузера. Для
  сайтів із великою кількістю JS або входом в обліковий запис використовуйте [Web Browser](/uk/tools/browser). Для
  отримання конкретного URL використовуйте [Web Fetch](/uk/tools/web-fetch).
</Info>

## Швидкий старт

<Steps>
  <Step title="Виберіть постачальника">
    Виберіть постачальника та виконайте всі потрібні кроки налаштування. Деякі постачальники
    не потребують ключа, тоді як інші використовують API-ключі. Докладніше дивіться на
    сторінках постачальників нижче.
  </Step>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    ```
    Це збереже постачальника та всі потрібні облікові дані. Ви також можете встановити змінну середовища
    (наприклад, `BRAVE_API_KEY`) і пропустити цей крок для
    постачальників на основі API.
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

## Вибір постачальника

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/uk/tools/brave-search">
    Структуровані результати з уривками. Підтримує режим `llm-context`, фільтри країни/мови. Доступний безкоштовний тариф.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/uk/tools/duckduckgo-search">
    Резервний варіант без ключа. API-ключ не потрібен. Неофіційна інтеграція на основі HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/uk/tools/exa-search">
    Нейронний + ключовий пошук із витягуванням вмісту (виділення, текст, підсумки).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/uk/tools/firecrawl">
    Структуровані результати. Найкраще поєднувати з `firecrawl_search` і `firecrawl_scrape` для глибокого витягування.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/uk/tools/gemini-search">
    Відповіді, синтезовані ШІ, з цитуваннями через Google Search grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/uk/tools/grok-search">
    Відповіді, синтезовані ШІ, з цитуваннями через xAI web grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/uk/tools/kimi-search">
    Відповіді, синтезовані ШІ, з цитуваннями через вебпошук Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/uk/tools/minimax-search">
    Структуровані результати через API пошуку MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/uk/tools/ollama-search">
    Пошук через локальний хост Ollama, у який виконано вхід, або через розміщений API Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/uk/tools/perplexity-search">
    Структуровані результати з керуванням витягуванням вмісту та фільтрацією доменів.
  </Card>
  <Card title="SearXNG" icon="server" href="/uk/tools/searxng-search">
    Самостійно розміщений метапошук. API-ключ не потрібен. Агрегує Google, Bing, DuckDuckGo та інші.
  </Card>
  <Card title="Tavily" icon="globe" href="/uk/tools/tavily">
    Структуровані результати з глибиною пошуку, фільтрацією за темою та `tavily_extract` для витягування URL.
  </Card>
</CardGroup>

### Порівняння постачальників

| Постачальник                              | Стиль результатів          | Фільтри                                          | API-ключ                                                                                |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/uk/tools/brave-search)              | Структуровані уривки       | Країна, мова, час, режим `llm-context`           | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/uk/tools/duckduckgo-search)    | Структуровані уривки       | --                                               | Немає (без ключа)                                                                       |
| [Exa](/uk/tools/exa-search)                  | Структуровані + витягнуті  | Нейронний/ключовий режим, дата, витягування      | `EXA_API_KEY`                                                                           |
| [Firecrawl](/uk/tools/firecrawl)             | Структуровані уривки       | Через інструмент `firecrawl_search`              | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/uk/tools/gemini-search)            | Синтезовані ШІ + цитування | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/uk/tools/grok-search)                | Синтезовані ШІ + цитування | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/uk/tools/kimi-search)                | Синтезовані ШІ + цитування | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/uk/tools/minimax-search)   | Структуровані уривки       | Регіон (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/uk/tools/ollama-search) | Структуровані уривки       | --                                               | Немає для локальних хостів із виконаним входом; `OLLAMA_API_KEY` для прямого пошуку `https://ollama.com` |
| [Perplexity](/uk/tools/perplexity-search)    | Структуровані уривки       | Країна, мова, час, домени, ліміти вмісту         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/uk/tools/searxng-search)          | Структуровані уривки       | Категорії, мова                                  | Немає (самостійне розміщення)                                                           |
| [Tavily](/uk/tools/tavily)                   | Структуровані уривки       | Через інструмент `tavily_search`                 | `TAVILY_API_KEY`                                                                        |

## Автовиявлення

## Нативний вебпошук OpenAI

Безпосередні моделі OpenAI Responses автоматично використовують розміщений OpenAI інструмент `web_search`, коли в OpenClaw увімкнено вебпошук і не закріплено керованого постачальника. Це поведінка, що належить постачальнику, у вбудованому Plugin OpenAI і застосовується лише до нативного трафіку OpenAI API, а не до OpenAI-сумісних проксі-URL або маршрутів Azure. Установіть `tools.web.search.provider` на іншого постачальника, наприклад `brave`, щоб зберегти керований інструмент `web_search` для моделей OpenAI, або встановіть `tools.web.search.enabled: false`, щоб вимкнути і керований пошук, і нативний пошук OpenAI.

## Нативний вебпошук Codex

Моделі з підтримкою Codex можуть за бажанням використовувати нативний інструмент Responses `web_search` постачальника замість керованої функції OpenClaw `web_search`.

- Налаштовується в `tools.web.search.openaiCodex`
- Активується лише для моделей із підтримкою Codex (`openai-codex/*` або постачальників, що використовують `api: "openai-codex-responses"`)
- Керований `web_search` і далі застосовується до моделей без підтримки Codex
- `mode: "cached"` — типовий і рекомендований параметр
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

Списки постачальників у документації та сценаріях налаштування наведено в алфавітному порядку. Автовиявлення використовує
окремий порядок пріоритету.

Якщо `provider` не встановлено, OpenClaw перевіряє постачальників у такому порядку та використовує
першого, який готовий:

Спочатку постачальники на основі API:

1. **Brave** -- `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey` (порядок 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey` (порядок 15)
3. **Gemini** -- `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey` (порядок 20)
4. **Grok** -- `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` (порядок 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey` (порядок 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey` (порядок 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey` (порядок 60)
8. **Exa** -- `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey` (порядок 65)
9. **Tavily** -- `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey` (порядок 70)

Після цього резервні варіанти без ключа:

10. **DuckDuckGo** -- HTML-резервний варіант без ключа, без облікового запису чи API-ключа (порядок 100)
11. **Ollama Web Search** -- резервний варіант без ключа через налаштований локальний хост Ollama, коли він доступний і в ньому виконано вхід за допомогою `ollama signin`; може повторно використовувати bearer-автентифікацію постачальника Ollama, якщо вона потрібна хосту, і може викликати прямий пошук `https://ollama.com`, якщо налаштовано `OLLAMA_API_KEY` (порядок 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Якщо жодного постачальника не виявлено, використовується Brave (ви отримаєте помилку
про відсутній ключ із підказкою налаштувати його).

<Note>
  Усі поля ключів постачальників підтримують об’єкти SecretRef. SecretRef-и з областю Plugin
  у `plugins.entries.<plugin>.config.webSearch.apiKey` розв’язуються для
  вбудованих постачальників Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity і Tavily
  незалежно від того, чи вибрано постачальника явно через `tools.web.search.provider`, чи
  через автовиявлення. У режимі автовиявлення OpenClaw розв’язує лише ключ
  вибраного постачальника — SecretRef-и невибраних постачальників залишаються неактивними, тож ви можете
  тримати налаштованими кількох постачальників без витрат на розв’язання для
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

Специфічна для постачальника конфігурація (API-ключі, базові URL, режими) міститься в
`plugins.entries.<plugin>.config.webSearch.*`. Приклади дивіться на сторінках
постачальників.

Вибір резервного постачальника для `web_fetch` налаштовується окремо:

- виберіть його через `tools.web.fetch.provider`
- або пропустіть це поле й дозвольте OpenClaw автоматично виявити першого готового
  постачальника web-fetch серед доступних облікових даних
- наразі вбудованим постачальником web-fetch є Firecrawl, що налаштовується в
  `plugins.entries.firecrawl.config.webFetch.*`

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон API Moonshot (`https://api.moonshot.ai/v1` або `https://api.moonshot.cn/v1`)
- типову модель вебпошуку Kimi (типово `kimi-k2.6`)

Для `x_search` налаштуйте `plugins.entries.xai.config.xSearch.*`. Він використовує
той самий резервний `XAI_API_KEY`, що й вебпошук Grok.
Застаріла конфігурація `tools.web.x_search.*` автоматично мігрується за допомогою `openclaw doctor --fix`.
Коли ви вибираєте Grok під час `openclaw onboard` або `openclaw configure --section web`,
OpenClaw також може запропонувати додаткове налаштування `x_search` з тим самим ключем.
Це окремий наступний крок у межах шляху Grok, а не окремий вибір постачальника
вебпошуку верхнього рівня. Якщо ви виберете іншого постачальника, OpenClaw не
показуватиме запит для `x_search`.

### Зберігання API-ключів

<Tabs>
  <Tab title="Файл конфігурації">
    Виконайте `openclaw configure --section web` або встановіть ключ безпосередньо:

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
    Встановіть змінну середовища постачальника в середовищі процесу Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Для встановлення gateway додайте її в `~/.openclaw/.env`.
    Дивіться [Змінні середовища](/uk/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Параметри інструмента

| Параметр             | Опис                                                  |
| -------------------- | ----------------------------------------------------- |
| `query`              | Пошуковий запит (обов’язково)                         |
| `count`              | Кількість результатів для повернення (1-10, типово: 5) |
| `country`            | 2-літерний код країни ISO (наприклад, "US", "DE")    |
| `language`           | Код мови ISO 639-1 (наприклад, "en", "de")            |
| `search_lang`        | Код мови пошуку (лише для Brave)                      |
| `freshness`          | Часовий фільтр: `day`, `week`, `month` або `year`     |
| `date_after`         | Результати після цієї дати (YYYY-MM-DD)               |
| `date_before`        | Результати до цієї дати (YYYY-MM-DD)                  |
| `ui_lang`            | Код мови інтерфейсу (лише для Brave)                  |
| `domain_filter`      | Масив списку дозволених/заборонених доменів (лише для Perplexity) |
| `max_tokens`         | Загальний бюджет вмісту, типово 25000 (лише для Perplexity) |
| `max_tokens_per_page` | Ліміт токенів на сторінку, типово 2048 (лише для Perplexity) |

<Warning>
  Не всі параметри працюють з усіма постачальниками. Режим Brave `llm-context`
  відхиляє `ui_lang`, `freshness`, `date_after` і `date_before`.
  Gemini, Grok і Kimi повертають одну синтезовану ШІ відповідь із цитуваннями. Вони
  приймають `count` для сумісності зі спільним інструментом, але це не змінює
  форму grounded-відповіді.
  Perplexity поводиться так само, коли ви використовуєте шлях сумісності Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` або `OPENROUTER_API_KEY`).
  SearXNG приймає `http://` лише для довірених хостів приватної мережі або loopback;
  публічні кінцеві точки SearXNG повинні використовувати `https://`.
  Firecrawl і Tavily підтримують лише `query` і `count` через `web_search`
  -- для додаткових параметрів використовуйте їхні спеціалізовані інструменти.
</Warning>

## x_search

`x_search` виконує запити до дописів у X (раніше Twitter) за допомогою xAI і повертає
синтезовані ШІ відповіді з цитуваннями. Він приймає запити природною мовою та
необов’язкові структуровані фільтри. OpenClaw вмикає вбудований інструмент xAI `x_search`
лише для запиту, який обслуговує цей виклик інструмента.

<Note>
  xAI документує `x_search` як такий, що підтримує пошук за ключовими словами, семантичний пошук, пошук користувачів
  і отримання гілок. Для статистики взаємодії окремого допису, такої як репости,
  відповіді, закладки або перегляди, краще виконувати цільовий пошук за точним URL допису
  або ID статусу. Широкі пошуки за ключовими словами можуть знайти потрібний допис, але повернути
  менш повні метадані окремого допису. Хороший підхід: спочатку знайти допис, а потім
  виконати другий запит `x_search`, зосереджений саме на цьому дописі.
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
            apiKey: "xai-...", // необов’язково, якщо встановлено XAI_API_KEY
          },
        },
      },
    },
  },
}
```

### Параметри x_search

| Параметр                   | Опис                                                  |
| -------------------------- | ----------------------------------------------------- |
| `query`                    | Пошуковий запит (обов’язково)                         |
| `allowed_x_handles`        | Обмежити результати конкретними X-хендлами            |
| `excluded_x_handles`       | Виключити конкретні X-хендли                          |
| `from_date`                | Включати лише дописи в цю дату або пізніше (YYYY-MM-DD) |
| `to_date`                  | Включати лише дописи в цю дату або раніше (YYYY-MM-DD) |
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
// Статистика окремого допису: використовуйте точний URL статусу або ID статусу, коли це можливо
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

// Нещодавні результати (за минулий тиждень)
await web_search({ query: "AI developments", freshness: "week" });

// Діапазон дат
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Фільтрація доменів (лише для Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Профілі інструментів

Якщо ви використовуєте профілі інструментів або списки дозволів, додайте `web_search`, `x_search` або `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // або: allow: ["group:web"]  (включає web_search, x_search і web_fetch)
  },
}
```

## Пов’язане

- [Web Fetch](/uk/tools/web-fetch) -- отримати URL і витягти читабельний вміст
- [Web Browser](/uk/tools/browser) -- повна автоматизація браузера для сайтів із великою кількістю JS
- [Grok Search](/uk/tools/grok-search) -- Grok як постачальник `web_search`
- [Ollama Web Search](/uk/tools/ollama-search) -- вебпошук без ключа через ваш хост Ollama
