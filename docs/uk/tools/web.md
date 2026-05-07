---
read_when:
    - Ви хочете ввімкнути або налаштувати web_search
    - Ви хочете ввімкнути або налаштувати x_search
    - Потрібно вибрати постачальника пошуку
    - Ви хочете зрозуміти автовиявлення та резервний перехід між провайдерами
sidebarTitle: Web Search
summary: web_search, x_search і web_fetch -- пошук у вебі, пошук дописів X або отримання вмісту сторінки
title: Вебпошук
x-i18n:
    generated_at: "2026-05-07T01:55:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 806b614fe3103439ea0a1acaaaa9f4071e22440cc2091ff814834e75b2079529
    source_path: tools/web.md
    workflow: 16
---

Інструмент `web_search` шукає в інтернеті за допомогою налаштованого вами провайдера і
повертає результати. Результати кешуються за запитом на 15 хвилин (можна налаштувати).

OpenClaw також містить `x_search` для дописів X (раніше Twitter) і
`web_fetch` для легкого отримання URL. На цьому етапі `web_fetch` залишається
локальним, тоді як `web_search` і `x_search` можуть використовувати xAI Responses під капотом.

<Info>
  `web_search` — це легкий HTTP-інструмент, а не автоматизація браузера. Для
  сайтів із великою кількістю JS або входів у систему використовуйте [Веббраузер](/uk/tools/browser). Для
  отримання конкретного URL використовуйте [Web Fetch](/uk/tools/web-fetch).
</Info>

## Швидкий старт

<Steps>
  <Step title="Choose a provider">
    Виберіть провайдера і виконайте все потрібне налаштування. Деякі провайдери
    не потребують ключів, тоді як інші використовують API-ключі. Докладніше див.
    на сторінках провайдерів нижче.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Це зберігає провайдера та всі потрібні облікові дані. Ви також можете задати змінну
    середовища (наприклад `BRAVE_API_KEY`) і пропустити цей крок для провайдерів,
    що працюють через API.
  </Step>
  <Step title="Use it">
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
    Структуровані результати з фрагментами. Підтримує режим `llm-context`, фільтри країни/мови. Доступний безкоштовний рівень.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/uk/tools/duckduckgo-search">
    Резервний варіант без ключа. API-ключ не потрібен. Неофіційна інтеграція на основі HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/uk/tools/exa-search">
    Нейронний + ключовий пошук із витягненням вмісту (виділення, текст, підсумки).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/uk/tools/firecrawl">
    Структуровані результати. Найкраще поєднувати з `firecrawl_search` і `firecrawl_scrape` для глибокого витягнення.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/uk/tools/gemini-search">
    Відповіді, синтезовані ШІ, з цитуваннями через прив’язку до Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/uk/tools/grok-search">
    Відповіді, синтезовані ШІ, з цитуваннями через вебприв’язку xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/uk/tools/kimi-search">
    Відповіді, синтезовані ШІ, з цитуваннями через вебпошук Moonshot; непідтверджені резервні переходи до чату явно завершуються помилкою.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/uk/tools/minimax-search">
    Структуровані результати через пошуковий API MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/uk/tools/ollama-search">
    Пошук через локальний хост Ollama із виконаним входом або через розміщений API Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/uk/tools/perplexity-search">
    Структуровані результати з елементами керування витягненням вмісту та фільтрацією доменів.
  </Card>
  <Card title="SearXNG" icon="server" href="/uk/tools/searxng-search">
    Самостійно розміщений метапошук. API-ключ не потрібен. Агрегує Google, Bing, DuckDuckGo та інші.
  </Card>
  <Card title="Tavily" icon="globe" href="/uk/tools/tavily">
    Структуровані результати з глибиною пошуку, фільтрацією за темою та `tavily_extract` для витягнення URL.
  </Card>
</CardGroup>

### Порівняння провайдерів

| Провайдер                                 | Стиль результатів                                             | Фільтри                                          | API-ключ                                                                                |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/uk/tools/brave-search)              | Структуровані фрагменти                                       | Країна, мова, час, режим `llm-context`           | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/uk/tools/duckduckgo-search)    | Структуровані фрагменти                                       | --                                               | Немає (без ключа)                                                                       |
| [Exa](/uk/tools/exa-search)                  | Структуровані + витягнені                                     | Нейронний/ключовий режим, дата, витягнення вмісту | `EXA_API_KEY`                                                                           |
| [Firecrawl](/uk/tools/firecrawl)             | Структуровані фрагменти                                       | Через інструмент `firecrawl_search`              | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/uk/tools/gemini-search)            | Синтезовані ШІ + цитування                                    | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/uk/tools/grok-search)                | Синтезовані ШІ + цитування                                    | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/uk/tools/kimi-search)                | Синтезовані ШІ + цитування; помилка для непідтверджених резервних переходів до чату | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/uk/tools/minimax-search)   | Структуровані фрагменти                                       | Регіон (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/uk/tools/ollama-search) | Структуровані фрагменти                                       | --                                               | Немає для локальних хостів із виконаним входом; `OLLAMA_API_KEY` для прямого пошуку `https://ollama.com` |
| [Perplexity](/uk/tools/perplexity-search)    | Структуровані фрагменти                                       | Країна, мова, час, домени, обмеження вмісту      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/uk/tools/searxng-search)          | Структуровані фрагменти                                       | Категорії, мова                                  | Немає (самостійно розміщений)                                                          |
| [Tavily](/uk/tools/tavily)                   | Структуровані фрагменти                                       | Через інструмент `tavily_search`                 | `TAVILY_API_KEY`                                                                        |

## Автовиявлення

## Нативний вебпошук OpenAI

Прямі моделі OpenAI Responses автоматично використовують розміщений OpenAI інструмент `web_search`, коли вебпошук OpenClaw увімкнено і жоден керований провайдер не закріплено. Це поведінка, що належить провайдеру, у вбудованому OpenAI Plugin і застосовується лише до нативного трафіку OpenAI API, а не до базових URL OpenAI-сумісних проксі чи маршрутів Azure. Установіть `tools.web.search.provider` на іншого провайдера, наприклад `brave`, щоб зберегти керований інструмент `web_search` для моделей OpenAI, або встановіть `tools.web.search.enabled: false`, щоб вимкнути і керований пошук, і нативний пошук OpenAI.

## Нативний вебпошук Codex

Моделі з підтримкою Codex можуть необов’язково використовувати провайдерський нативний інструмент Responses `web_search` замість керованої функції OpenClaw `web_search`.

- Налаштуйте його в `tools.web.search.openaiCodex`
- Він активується лише для моделей із підтримкою Codex (`openai-codex/*` або провайдерів, що використовують `api: "openai-codex-responses"`)
- Керований `web_search` усе ще застосовується до моделей без Codex
- `mode: "cached"` є стандартним і рекомендованим параметром
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

Якщо нативний пошук Codex увімкнено, але поточна модель не підтримує Codex, OpenClaw зберігає звичайну керовану поведінку `web_search`.

## Безпека мережі

Виклики провайдера керованого `web_search` використовують захищений шлях fetch OpenClaw. Для
довірених API-хостів провайдера OpenClaw дозволяє відповіді fake-IP DNS від Surge,
Clash і sing-box у `198.18.0.0/15` та `fc00::/7` лише для імені хоста цього провайдера.
Інші приватні, loopback, link-local і metadata призначення залишаються заблокованими.

Цей автоматичний дозвіл не застосовується до довільних URL `web_fetch`. Для
`web_fetch` явно вмикайте `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` і
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` лише тоді, коли ваш
довірений проксі володіє цими синтетичними діапазонами.

## Налаштування вебпошуку

Списки провайдерів у документації та потоках налаштування впорядковані за абеткою. Автовиявлення зберігає
окремий порядок пріоритету.

Якщо `provider` не задано, OpenClaw перевіряє провайдерів у такому порядку і використовує
перший готовий:

Спочатку провайдери на основі API:

1. **Brave** -- `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey` (порядок 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey` (порядок 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` або `models.providers.google.apiKey` (порядок 20)
4. **Grok** -- `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` (порядок 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey` (порядок 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey` (порядок 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey` (порядок 60)
8. **Exa** -- `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`; необов’язковий `plugins.entries.exa.config.webSearch.baseUrl` перевизначає endpoint Exa (порядок 65)
9. **Tavily** -- `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey` (порядок 70)

Після цього резервні варіанти без ключа:

10. **DuckDuckGo** -- резервний HTML-варіант без ключа, без облікового запису чи API-ключа (порядок 100)
11. **Ollama Web Search** -- резервний варіант без ключа через ваш налаштований локальний хост Ollama, коли він доступний і в ньому виконано вхід через `ollama signin`; може повторно використовувати bearer-автентифікацію провайдера Ollama, коли вона потрібна хосту, і може викликати прямий пошук `https://ollama.com`, коли налаштовано `OLLAMA_API_KEY` (порядок 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Якщо жодного провайдера не виявлено, використовується резервний Brave (ви отримаєте помилку
про відсутній ключ із пропозицією його налаштувати).

<Note>
  Усі поля ключів провайдера підтримують об’єкти SecretRef. SecretRefs у межах Plugin
  під `plugins.entries.<plugin>.config.webSearch.apiKey` розв’язуються для
  вбудованих API-провайдерів вебпошуку, включно з Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity і Tavily,
  незалежно від того, чи провайдера вибрано явно через `tools.web.search.provider`, чи
  вибрано через автовиявлення. У режимі автовиявлення OpenClaw розв’язує лише
  ключ вибраного провайдера -- невибрані SecretRefs залишаються неактивними, тож ви можете
  тримати налаштованими кілька провайдерів, не сплачуючи вартість розв’язання для тих,
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

Конфігурація, специфічна для провайдера (ключі API, базові URL-адреси, режими), розміщується в
`plugins.entries.<plugin>.config.webSearch.*`. Gemini також може повторно використовувати
`models.providers.google.apiKey` і `models.providers.google.baseUrl` як резервні варіанти
нижчого пріоритету після спеціальної конфігурації вебпошуку та `GEMINI_API_KEY`. Приклади дивіться
на сторінках провайдерів.

`tools.web.search.provider` перевіряється на відповідність ідентифікаторам провайдерів вебпошуку,
оголошеним у маніфестах вбудованих і встановлених plugin, а також відомим встановлюваним
plugin провайдерів. Помилка введення на кшталт `"brvae"` призводить до помилки перевірки конфігурації,
а не до тихого повернення до автовиявлення. Якщо налаштований провайдер відомий, але
plugin, якому він належить, недоступний, OpenClaw зберігає стійкість запуску та повідомляє
попередження, щоб ви могли виконати `openclaw doctor --fix` для встановлення або ввімкнення plugin.
Така сама поведінка попереджень застосовується до застарілих свідчень plugin, наприклад до залишкового
блоку `plugins.entries.<plugin>` після видалення стороннього plugin.

Вибір резервного провайдера `web_fetch` виконується окремо:

- виберіть його за допомогою `tools.web.fetch.provider`
- або пропустіть це поле й дозвольте OpenClaw автоматично виявити першого готового провайдера
  web-fetch з доступних облікових даних
- `web_fetch` поза пісочницею може використовувати встановлені провайдери plugin, які оголошують
  `contracts.webFetchProviders`; вибірки в пісочниці залишаються лише вбудованими
- наразі вбудованим провайдером web-fetch є Firecrawl, який налаштовується в
  `plugins.entries.firecrawl.config.webFetch.*`

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон API Moonshot (`https://api.moonshot.ai/v1` або `https://api.moonshot.cn/v1`)
- типову модель вебпошуку Kimi (за замовчуванням `kimi-k2.6`)

Для `x_search` налаштуйте `plugins.entries.xai.config.xSearch.*`. Він використовує той самий
резервний `XAI_API_KEY`, що й вебпошук Grok.
Застаріла конфігурація `tools.web.x_search.*` автоматично мігрується командою `openclaw doctor --fix`.
Коли ви вибираєте Grok під час `openclaw onboard` або `openclaw configure --section web`,
OpenClaw також може запропонувати необов'язкове налаштування `x_search` з тим самим ключем.
Це окремий подальший крок у шляху Grok, а не окремий вибір провайдера вебпошуку верхнього рівня.
Якщо ви виберете іншого провайдера, OpenClaw не показуватиме запит `x_search`.

### Зберігання ключів API

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
    Задайте змінну середовища провайдера в середовищі процесу Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Для встановлення gateway помістіть її в `~/.openclaw/.env`.
    Дивіться [Змінні середовища](/uk/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Параметри інструмента

| Параметр              | Опис                                                           |
| --------------------- | -------------------------------------------------------------- |
| `query`               | Пошуковий запит (обов'язково)                                  |
| `count`               | Кількість результатів для повернення (1-10, за замовчуванням: 5) |
| `country`             | 2-літерний код країни ISO (наприклад, "US", "DE")              |
| `language`            | Код мови ISO 639-1 (наприклад, "en", "de")                    |
| `search_lang`         | Код мови пошуку (лише Brave)                                   |
| `freshness`           | Фільтр часу: `day`, `week`, `month` або `year`                 |
| `date_after`          | Результати після цієї дати (YYYY-MM-DD)                        |
| `date_before`         | Результати до цієї дати (YYYY-MM-DD)                           |
| `ui_lang`             | Код мови інтерфейсу (лише Brave)                               |
| `domain_filter`       | Масив дозволених/заборонених доменів (лише Perplexity)          |
| `max_tokens`          | Загальний бюджет вмісту, за замовчуванням 25000 (лише Perplexity) |
| `max_tokens_per_page` | Ліміт токенів на сторінку, за замовчуванням 2048 (лише Perplexity) |

<Warning>
  Не всі параметри працюють з усіма провайдерами. Режим Brave `llm-context`
  відхиляє `ui_lang`; `date_before` також потребує `date_after`, оскільки власні
  діапазони свіжості Brave вимагають і початкової, і кінцевої дат.
  Gemini, Grok і Kimi повертають одну синтезовану відповідь із цитуваннями. Вони
  приймають `count` для сумісності зі спільним інструментом, але це не змінює
  форму обґрунтованої відповіді. Gemini підтримує `freshness`, `date_after` і
  `date_before`, перетворюючи їх на часові діапазони grounding Google Search.
  Perplexity поводиться так само, коли ви використовуєте шлях сумісності Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` або `OPENROUTER_API_KEY`).
  SearXNG приймає `http://` лише для довірених хостів приватної мережі або local loopback;
  публічні кінцеві точки SearXNG мають використовувати `https://`.
  Firecrawl і Tavily підтримують лише `query` і `count` через `web_search`
  -- використовуйте їхні спеціалізовані інструменти для розширених параметрів.
</Warning>

## x_search

`x_search` запитує дописи X (раніше Twitter) за допомогою xAI та повертає
синтезовані ШІ відповіді з цитуваннями. Він приймає запити природною мовою та
необов'язкові структуровані фільтри. OpenClaw вмикає вбудований інструмент xAI `x_search`
лише для запиту, який обслуговує цей виклик інструмента.

<Note>
  xAI документує `x_search` як такий, що підтримує пошук за ключовими словами, семантичний пошук, пошук користувачів
  і отримання тредів. Для статистики взаємодії з окремими дописами, такої як репости,
  відповіді, закладки або перегляди, віддавайте перевагу цільовому пошуку за точною URL-адресою допису
  або ID статусу. Широкі пошуки за ключовими словами можуть знайти потрібний допис, але повернути менш
  повні метадані для окремого допису. Хороший шаблон: спочатку знайдіть допис, потім
  виконайте другий запит `x_search`, зосереджений на цьому точному дописі.
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

`x_search` надсилає запити до `<baseUrl>/responses`, коли
`plugins.entries.xai.config.xSearch.baseUrl` задано. Якщо це поле пропущено,
він повертається до `plugins.entries.xai.config.webSearch.baseUrl`, потім до
застарілого `tools.web.search.grok.baseUrl` і нарешті до публічної кінцевої точки xAI.

### Параметри x_search

| Параметр                     | Опис                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| `query`                      | Пошуковий запит (обов'язково)                                |
| `allowed_x_handles`          | Обмежити результати конкретними X handle                     |
| `excluded_x_handles`         | Виключити конкретні X handle                                 |
| `from_date`                  | Включати лише дописи на цю дату або після неї (YYYY-MM-DD)   |
| `to_date`                    | Включати лише дописи на цю дату або до неї (YYYY-MM-DD)      |
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

Якщо ви використовуєте профілі інструментів або списки дозволів, додайте `web_search`, `x_search` або `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Пов'язане

- [Web Fetch](/uk/tools/web-fetch) -- отримати URL і витягти читабельний вміст
- [Web Browser](/uk/tools/browser) -- повна автоматизація браузера для сайтів із великою кількістю JS
- [Grok Search](/uk/tools/grok-search) -- Grok як провайдер `web_search`
- [Ollama Web Search](/uk/tools/ollama-search) -- вебпошук без ключа через ваш хост Ollama
