---
read_when:
    - Ви хочете ввімкнути або налаштувати web_search
    - Ви хочете ввімкнути або налаштувати x_search
    - Вам потрібно вибрати провайдера пошуку
    - Ви хочете зрозуміти автовизначення і fallback провайдера
sidebarTitle: Web Search
summary: web_search, x_search і web_fetch — пошук у вебі, пошук дописів у X або отримання вмісту сторінки
title: Вебпошук
x-i18n:
    generated_at: "2026-04-21T20:38:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2517d660465f850b1cfdd255fbf512dc5c828b1ef22e3b24cec6aab097ebd5
    source_path: tools/web.md
    workflow: 15
---

# Вебпошук

Інструмент `web_search` виконує пошук у вебі за допомогою налаштованого вами провайдера і
повертає результати. Результати кешуються за запитом на 15 хвилин (це можна налаштувати).

OpenClaw також містить `x_search` для дописів у X (раніше Twitter) і
`web_fetch` для легкого отримання URL. На цьому етапі `web_fetch` залишається
локальним, тоді як `web_search` і `x_search` можуть під капотом використовувати xAI Responses.

<Info>
  `web_search` — це легкий HTTP-інструмент, а не автоматизація браузера. Для
  сайтів із важким JS або входом в обліковий запис використовуйте [Web Browser](/uk/tools/browser). Для
  отримання конкретного URL використовуйте [Web Fetch](/uk/tools/web-fetch).
</Info>

## Швидкий старт

<Steps>
  <Step title="Виберіть провайдера">
    Виберіть провайдера і виконайте всі необхідні кроки налаштування. Деякі провайдери
    не потребують ключів, тоді як інші використовують API-ключі. Докладніше
    дивіться на сторінках провайдерів нижче.
  </Step>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    ```
    Це збереже провайдера та всі потрібні облікові дані. Ви також можете встановити env
    var (наприклад, `BRAVE_API_KEY`) і пропустити цей крок для провайдерів,
    що працюють через API.
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
    Структуровані результати зі сніпетами. Підтримує режим `llm-context`, фільтри країни/мови. Є безкоштовний тариф.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/uk/tools/duckduckgo-search">
    Fallback без ключа. API-ключ не потрібен. Неофіційна інтеграція на основі HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/uk/tools/exa-search">
    Нейронний + ключовий пошук із витягуванням вмісту (підсвічування, текст, підсумки).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/uk/tools/firecrawl">
    Структуровані результати. Найкраще поєднується з `firecrawl_search` і `firecrawl_scrape` для глибокого витягування.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/uk/tools/gemini-search">
    Відповіді, синтезовані ШІ, з цитуваннями через Google Search grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/uk/tools/grok-search">
    Відповіді, синтезовані ШІ, з цитуваннями через xAI web grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/uk/tools/kimi-search">
    Відповіді, синтезовані ШІ, з цитуваннями через Moonshot web search.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/uk/tools/minimax-search">
    Структуровані результати через API пошуку MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/uk/tools/ollama-search">
    Пошук без ключа через ваш налаштований хост Ollama. Потрібен `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/uk/tools/perplexity-search">
    Структуровані результати з керуванням витягуванням вмісту та фільтрацією доменів.
  </Card>
  <Card title="SearXNG" icon="server" href="/uk/tools/searxng-search">
    Самохостинговий метапошук. API-ключ не потрібен. Агрегує Google, Bing, DuckDuckGo та інші.
  </Card>
  <Card title="Tavily" icon="globe" href="/uk/tools/tavily">
    Структуровані результати з глибиною пошуку, фільтрацією тем і `tavily_extract` для витягування URL.
  </Card>
</CardGroup>

### Порівняння провайдерів

| Провайдер                                 | Стиль результатів          | Фільтри                                          | API-ключ                                                                        |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/uk/tools/brave-search)              | Структуровані сніпети      | Країна, мова, час, режим `llm-context`           | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/uk/tools/duckduckgo-search)    | Структуровані сніпети      | --                                               | None (без ключа)                                                                 |
| [Exa](/uk/tools/exa-search)                  | Структуровані + витягнуті  | Нейронний/ключовий режим, дата, витягування вмісту | `EXA_API_KEY`                                                                  |
| [Firecrawl](/uk/tools/firecrawl)             | Структуровані сніпети      | Через інструмент `firecrawl_search`              | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/uk/tools/gemini-search)            | Синтезовані ШІ + цитування | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/uk/tools/grok-search)                | Синтезовані ШІ + цитування | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/uk/tools/kimi-search)                | Синтезовані ШІ + цитування | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/uk/tools/minimax-search)   | Структуровані сніпети      | Регіон (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/uk/tools/ollama-search) | Структуровані сніпети      | --                                               | None типово; потрібен `ollama signin`, можна повторно використати bearer auth провайдера Ollama |
| [Perplexity](/uk/tools/perplexity-search)    | Структуровані сніпети      | Країна, мова, час, домени, ліміти вмісту         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/uk/tools/searxng-search)          | Структуровані сніпети      | Категорії, мова                                  | None (самохостинг)                                                               |
| [Tavily](/uk/tools/tavily)                   | Структуровані сніпети      | Через інструмент `tavily_search`                 | `TAVILY_API_KEY`                                                                 |

## Автовизначення

## Нативний вебпошук Codex

Моделі з підтримкою Codex за бажанням можуть використовувати нативний інструмент Responses `web_search` від провайдера замість керованої функції `web_search` OpenClaw.

- Налаштовується в `tools.web.search.openaiCodex`
- Активується лише для моделей із підтримкою Codex (`openai-codex/*` або провайдерів, що використовують `api: "openai-codex-responses"`)
- Керований `web_search` і далі застосовується до моделей без підтримки Codex
- `mode: "cached"` — типове та рекомендоване налаштування
- `tools.web.search.enabled: false` вимикає як керований, так і нативний пошук

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

Списки провайдерів у документації та потоках налаштування впорядковано за абеткою. Автовизначення використовує
окремий порядок пріоритету.

Якщо `provider` не задано, OpenClaw перевіряє провайдерів у такому порядку і використовує
першого, який готовий до роботи:

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

Після цього — fallback без ключа:

10. **DuckDuckGo** -- HTML fallback без ключа, без облікового запису чи API-ключа (порядок 100)
11. **Ollama Web Search** -- fallback без ключа через ваш налаштований хост Ollama; вимагає, щоб Ollama був доступний і вхід було виконано через `ollama signin`, а також може повторно використовувати bearer auth провайдера Ollama, якщо хост його потребує (порядок 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Якщо жодного провайдера не виявлено, використовується fallback до Brave (ви отримаєте помилку
про відсутній ключ із пропозицією налаштувати його).

<Note>
  Усі поля ключів провайдерів підтримують об’єкти SecretRef. SecretRef із областю plugin
  у `plugins.entries.<plugin>.config.webSearch.apiKey` розв’язуються для
  вбудованих провайдерів Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity і Tavily
  незалежно від того, чи провайдера вибрано явно через `tools.web.search.provider`, чи
  через автовизначення. У режимі автовизначення OpenClaw розв’язує лише ключ
  вибраного провайдера — SecretRef невибраних провайдерів залишаються неактивними, тож ви можете
  тримати налаштованими кількох провайдерів без витрат на розв’язання для тих,
  яких ви не використовуєте.
</Note>

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // типово: true
        provider: "brave", // або пропустіть для автовизначення
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Специфічна для провайдера конфігурація (API-ключі, base URL, режими) міститься в
`plugins.entries.<plugin>.config.webSearch.*`. Приклади дивіться на сторінках провайдерів.

Вибір fallback-провайдера для `web_fetch` налаштовується окремо:

- виберіть його через `tools.web.fetch.provider`
- або пропустіть це поле і дозвольте OpenClaw автоматично визначити першого готового провайдера `web_fetch`
  з доступних облікових даних
- на сьогодні вбудований провайдер `web_fetch` — це Firecrawl, який налаштовується в
  `plugins.entries.firecrawl.config.webFetch.*`

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон API Moonshot (`https://api.moonshot.ai/v1` або `https://api.moonshot.cn/v1`)
- типову модель вебпошуку Kimi (типово `kimi-k2.6`)

Для `x_search` налаштуйте `plugins.entries.xai.config.xSearch.*`. Він використовує
той самий fallback `XAI_API_KEY`, що й вебпошук Grok.
Застаріла конфігурація `tools.web.x_search.*` автоматично мігрується через `openclaw doctor --fix`.
Коли ви вибираєте Grok під час `openclaw onboard` або `openclaw configure --section web`,
OpenClaw також може запропонувати додаткове налаштування `x_search` з тим самим ключем.
Це окремий подальший крок усередині шляху Grok, а не окремий вибір провайдера
вебпошуку верхнього рівня. Якщо ви виберете іншого провайдера, OpenClaw не
показуватиме запит для `x_search`.

### Збереження API-ключів

<Tabs>
  <Tab title="Файл конфігурації">
    Виконайте `openclaw configure --section web` або задайте ключ безпосередньо:

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
    Встановіть env var провайдера в середовищі процесу Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Для встановлення Gateway додайте її в `~/.openclaw/.env`.
    Див. [Env vars](/uk/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Параметри інструмента

| Параметр             | Опис                                                     |
| -------------------- | -------------------------------------------------------- |
| `query`              | Пошуковий запит (обов’язковий)                           |
| `count`              | Кількість результатів для повернення (1-10, типово: 5)   |
| `country`            | 2-літерний код країни ISO (наприклад, "US", "DE")       |
| `language`           | Код мови ISO 639-1 (наприклад, "en", "de")              |
| `search_lang`        | Код мови пошуку (лише Brave)                             |
| `freshness`          | Фільтр часу: `day`, `week`, `month` або `year`          |
| `date_after`         | Результати після цієї дати (YYYY-MM-DD)                  |
| `date_before`        | Результати до цієї дати (YYYY-MM-DD)                     |
| `ui_lang`            | Код мови UI (лише Brave)                                 |
| `domain_filter`      | Масив allowlist/denylist доменів (лише Perplexity)       |
| `max_tokens`         | Загальний бюджет вмісту, типово 25000 (лише Perplexity)  |
| `max_tokens_per_page`| Ліміт токенів на сторінку, типово 2048 (лише Perplexity) |

<Warning>
  Не всі параметри працюють з усіма провайдерами. Режим Brave `llm-context`
  не приймає `ui_lang`, `freshness`, `date_after` і `date_before`.
  Gemini, Grok і Kimi повертають одну синтезовану ШІ відповідь із цитуваннями. Вони
  приймають `count` для сумісності зі спільним інструментом, але це не змінює
  форму grounded-відповіді.
  Perplexity поводиться так само, коли ви використовуєте шлях сумісності
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` або `OPENROUTER_API_KEY`).
  SearXNG приймає `http://` лише для довірених хостів приватної мережі або local loopback;
  публічні кінцеві точки SearXNG мають використовувати `https://`.
  Firecrawl і Tavily через `web_search` підтримують лише `query` і `count`
  -- для розширених параметрів використовуйте їхні спеціалізовані інструменти.
</Warning>

## x_search

`x_search` виконує запити до дописів X (раніше Twitter) за допомогою xAI і повертає
синтезовані ШІ відповіді з цитуваннями. Він приймає запити природною мовою та
необов’язкові структуровані фільтри. OpenClaw вмикає вбудований інструмент xAI `x_search`
лише для запиту, який обслуговує цей виклик інструмента.

<Note>
  xAI документує `x_search` як інструмент, що підтримує пошук за ключовими словами, семантичний пошук, пошук користувачів
  і отримання тредів. Для статистики взаємодії окремого допису, як-от репости,
  відповіді, закладки або перегляди, віддавайте перевагу цільовому пошуку за точним URL допису
  або ID статусу. Широкі пошуки за ключовими словами можуть знайти потрібний допис, але повертати менш
  повні метадані для окремого допису. Хороший шаблон такий: спочатку знайдіть допис, потім
  виконайте другий запит `x_search`, зосереджений саме на цьому дописі.
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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### Параметри x_search

| Параметр                   | Опис                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `query`                    | Пошуковий запит (обов’язковий)                             |
| `allowed_x_handles`        | Обмежити результати конкретними handle у X                 |
| `excluded_x_handles`       | Виключити конкретні handle у X                             |
| `from_date`                | Включати лише дописи на цю дату або пізніше (YYYY-MM-DD)   |
| `to_date`                  | Включати лише дописи на цю дату або раніше (YYYY-MM-DD)    |
| `enable_image_understanding` | Дозволити xAI аналізувати зображення, прикріплені до відповідних дописів |
| `enable_video_understanding` | Дозволити xAI аналізувати відео, прикріплені до відповідних дописів      |

### Приклад x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Статистика окремого допису: за можливості використовуйте точний URL статусу або ID статусу
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Приклади

```javascript
// Базовий пошук
await web_search({ query: "OpenClaw plugin SDK" });

// Пошук, орієнтований на Німеччину
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Свіжі результати (за минулий тиждень)
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
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Пов’язане

- [Web Fetch](/uk/tools/web-fetch) -- отримати URL і витягнути придатний для читання вміст
- [Web Browser](/uk/tools/browser) -- повна автоматизація браузера для сайтів із важким JS
- [Grok Search](/uk/tools/grok-search) -- Grok як провайдер `web_search`
- [Ollama Web Search](/uk/tools/ollama-search) -- вебпошук без ключа через ваш хост Ollama
