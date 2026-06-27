---
read_when:
    - Ви хочете увімкнути або налаштувати web_search
    - Ви хочете ввімкнути або налаштувати x_search
    - Потрібно вибрати постачальника пошуку
    - Ви хочете зрозуміти автовиявлення та вибір провайдера
sidebarTitle: Web Search
summary: web_search, x_search і web_fetch -- пошук в інтернеті, пошук дописів X або отримання вмісту сторінки
title: Вебпошук
x-i18n:
    generated_at: "2026-06-27T18:31:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

Інструмент `web_search` шукає в інтернеті за допомогою налаштованого вами провайдера й
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
  <Step title="Виберіть провайдера">
    Виберіть провайдера й виконайте всі потрібні кроки налаштування. Деякі провайдери
    не потребують ключа, тоді як інші використовують API-ключі. Подробиці дивіться на
    сторінках провайдерів нижче.
  </Step>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    ```
    Це зберігає провайдера та всі потрібні облікові дані. Ви також можете задати змінну
    середовища (наприклад `BRAVE_API_KEY`) і пропустити цей крок для провайдерів,
    що працюють через API.
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
    Структуровані результати з фрагментами. Підтримує режим `llm-context`, фільтри країни/мови. Доступний безкоштовний рівень.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/uk/plugins/codex-harness">
    Синтезовані ШІ обґрунтовані відповіді через ваш обліковий запис сервера застосунку Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/uk/tools/duckduckgo-search">
    Провайдер без ключа. API-ключ не потрібен. Неофіційна інтеграція на основі HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/uk/tools/exa-search">
    Нейронний + ключовий пошук із витягуванням вмісту (виділення, текст, підсумки).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/uk/tools/firecrawl">
    Структуровані результати. Найкраще поєднувати з `firecrawl_search` і `firecrawl_scrape` для глибокого витягування.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/uk/tools/gemini-search">
    Синтезовані ШІ відповіді з цитуваннями через обґрунтування Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/uk/tools/grok-search">
    Синтезовані ШІ відповіді з цитуваннями через вебобґрунтування xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/uk/tools/kimi-search">
    Синтезовані ШІ відповіді з цитуваннями через вебпошук Moonshot; необґрунтовані резервні переходи до чату явно завершуються помилкою.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/uk/tools/minimax-search">
    Структуровані результати через пошуковий API MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/uk/tools/ollama-search">
    Пошук через локальний хост Ollama із виконаним входом або розміщений API Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/uk/tools/parallel-search">
    Платний API Parallel Search (`PARALLEL_API_KEY`); вищі ліміти частоти та налаштування цілей.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/uk/tools/parallel-search">
    Добровільне використання без ключа. Безкоштовний Search MCP від Parallel, з щільними фрагментами, оптимізованими для LLM, і без API-ключа.
  </Card>
  <Card title="Perplexity" icon="search" href="/uk/tools/perplexity-search">
    Структуровані результати з керуванням витягуванням вмісту та фільтрацією доменів.
  </Card>
  <Card title="SearXNG" icon="server" href="/uk/tools/searxng-search">
    Самостійно розміщений метапошук. API-ключ не потрібен. Агрегує Google, Bing, DuckDuckGo тощо.
  </Card>
  <Card title="Tavily" icon="globe" href="/uk/tools/tavily">
    Структуровані результати з глибиною пошуку, фільтрацією тем і `tavily_extract` для витягування URL.
  </Card>
</CardGroup>

### Порівняння провайдерів

| Провайдер                                        | Стиль результатів                                             | Фільтри                                         | API-ключ                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| [Brave](/uk/tools/brave-search)                     | Структуровані фрагменти                                       | Країна, мова, час, режим `llm-context`          | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/uk/plugins/codex-harness)    | Синтезовані ШІ + URL джерел                                   | Домени, розмір контексту, місцеперебування користувача | Немає; використовує вхід Codex/OpenAI                                                   |
| [DuckDuckGo](/uk/tools/duckduckgo-search)           | Структуровані фрагменти                                       | --                                              | Немає (без ключа)                                                                       |
| [Exa](/uk/tools/exa-search)                         | Структуровані + витягнуті                                     | Нейронний/ключовий режим, дата, витягування вмісту | `EXA_API_KEY`                                                                           |
| [Firecrawl](/uk/tools/firecrawl)                    | Структуровані фрагменти                                       | Через інструмент `firecrawl_search`             | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/uk/tools/gemini-search)                   | Синтезовані ШІ + цитування                                    | --                                              | `GEMINI_API_KEY`                                                                        |
| [Grok](/uk/tools/grok-search)                       | Синтезовані ШІ + цитування                                    | --                                              | xAI OAuth, `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/uk/tools/kimi-search)                       | Синтезовані ШІ + цитування; помилка при необґрунтованих резервних переходах до чату | --                                              | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/uk/tools/minimax-search)          | Структуровані фрагменти                                       | Регіон (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/uk/tools/ollama-search)        | Структуровані фрагменти                                       | --                                              | Немає для локальних хостів із виконаним входом; `OLLAMA_API_KEY` для прямого пошуку `https://ollama.com` |
| [Parallel](/uk/tools/parallel-search)               | Щільні фрагменти, ранжовані для контексту LLM                 | --                                              | `PARALLEL_API_KEY` (платний)                                                            |
| [Parallel Search (Free)](/uk/tools/parallel-search) | Щільні фрагменти, ранжовані для контексту LLM                 | --                                              | Немає (безкоштовний Search MCP)                                                         |
| [Perplexity](/uk/tools/perplexity-search)           | Структуровані фрагменти                                       | Країна, мова, час, домени, ліміти вмісту        | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/uk/tools/searxng-search)                 | Структуровані фрагменти                                       | Категорії, мова                                 | Немає (самостійне розміщення)                                                           |
| [Tavily](/uk/tools/tavily)                          | Структуровані фрагменти                                       | Через інструмент `tavily_search`                | `TAVILY_API_KEY`                                                                        |

## Автовиявлення

## Нативний вебпошук OpenAI

Прямі моделі OpenAI Responses автоматично використовують розміщений OpenAI інструмент `web_search`, коли вебпошук OpenClaw увімкнено й не закріплено керованого провайдера. Це поведінка, що належить провайдеру, у вбудованому OpenAI Plugin і застосовується лише до нативного трафіку OpenAI API, а не до OpenAI-сумісних базових URL проксі чи маршрутів Azure. Установіть `tools.web.search.provider` на іншого провайдера, наприклад `brave`, щоб залишити керований інструмент `web_search` для моделей OpenAI, або задайте `tools.web.search.enabled: false`, щоб вимкнути і керований пошук, і нативний пошук OpenAI.

## Нативний вебпошук Codex

Середовище виконання сервера застосунку Codex автоматично використовує розміщений Codex інструмент `web_search`,
коли вебпошук увімкнено й не вибрано керованого провайдера. Нативний розміщений
пошук і керований динамічний інструмент OpenClaw `web_search` взаємовиключні,
тому керований пошук не може обійти нативні обмеження доменів. OpenClaw використовує
керований інструмент, коли розміщений пошук недоступний, явно вимкнений або
замінений вибраним керованим провайдером. OpenClaw залишає окреме розширення Codex
`web.run` вимкненим, бо виробничий трафік сервера застосунку відхиляє його
визначений користувачем простір імен `web`.

- Налаштуйте нативний пошук у `tools.web.search.openaiCodex`
- Установіть `tools.web.search.provider: "codex"`, щоб надати Codex Hosted Search як
  керованого провайдера `web_search` для будь-якої батьківської моделі. Кожен виклик запускає
  обмежений ефемерний хід сервера застосунку Codex і завершується помилкою, якщо Codex не видає
  розміщений елемент `webSearch`.
- `mode: "cached"` є типовим уподобанням, але Codex перетворює його на живий
  зовнішній доступ для необмежених ходів сервера застосунку; задайте `"live"`, щоб явно запросити
  живий доступ
- Установіть `tools.web.search.provider` на керованого провайдера, наприклад `brave`, щоб використовувати
  керований `web_search` OpenClaw натомість
- Установіть `tools.web.search.openaiCodex.enabled: false`, щоб відмовитися від пошуку,
  розміщеного Codex; інші керовані провайдери залишаються доступними
- Обмеження нативної поверхні інструментів Codex також залишає керований `web_search`
  доступним
- Коли задано `allowedDomains`, автоматичний керований резервний перехід завершується закритою помилкою, якщо
  розміщений пошук недоступний, щоб нативний список дозволених доменів не можна було обійти
- Запуски лише LLM із вимкненими інструментами вимикають і нативний, і керований пошук
- `tools.web.search.enabled: false` вимикає і керований, і нативний пошук

Постійні ефективні зміни політики пошуку Codex запускають новий прив’язаний потік, щоб
уже завантажений потік сервера застосунку не міг зберегти застарілий доступ до розміщеного пошуку.
Тимчасові обмеження на один хід використовують тимчасовий обмежений потік і зберігають
наявну прив’язку для подальшого відновлення.

Прямий трафік OpenAI ChatGPT Responses також може використовувати розміщений OpenAI
інструмент `web_search`. Цей окремий шлях залишається добровільним через
`tools.web.search.openaiCodex.enabled: true` і застосовується лише до придатних
моделей `openai/*`, що використовують `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
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

Для середовищ виконання й провайдерів, які не підтримують нативний пошук Codex, Codex може
використовувати керований резервний `web_search` через динамічний простір імен інструментів OpenClaw.
Використовуйте явного керованого провайдера, коли вам потрібні провайдер-специфічні
мережеві засоби керування OpenClaw замість пошуку, розміщеного Codex.

Вибір `provider: "codex"` вмикає вбудований плагін `codex` і використовує ті
самі обмеження `tools.web.search.openaiCodex`, показані вище. Спочатку
автентифікуйте app-server Codex за допомогою `openclaw models auth login --provider openai`.
Батьківський агент може використовувати будь-яку модель або runtime; лише обмежений пошуковий worker
працює через Codex.

## Безпека мережі

Виклики керованого HTTP-провайдера `web_search` використовують захищений шлях fetch OpenClaw. Для
довірених API-хостів провайдера OpenClaw дозволяє fake-IP DNS-відповіді Surge,
Clash і sing-box у `198.18.0.0/15` та `fc00::/7` лише для hostname цього провайдера.
Інші приватні, loopback, link-local і metadata-призначення залишаються заблокованими.
Codex Hosted Search є винятком: його обмежений worker делегує мережевий
доступ hosted-інструменту `web_search` app-server Codex.

Цей автоматичний дозвіл не застосовується до довільних URL `web_fetch`. Для
`web_fetch` вмикайте `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` і
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` явно лише тоді, коли ваш
довірений проксі володіє цими синтетичними діапазонами.

## Налаштування web search

Списки провайдерів у документації та потоках налаштування впорядковані за абеткою. Автовиявлення має
окремий порядок пріоритету.

Якщо `provider` не задано, OpenClaw перевіряє провайдерів у такому порядку й використовує
перший готовий:

Спочатку провайдери з API-підтримкою:

1. **Brave** -- `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey` (порядок 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey` (порядок 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` або `models.providers.google.apiKey` (порядок 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` (порядок 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey` (порядок 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey` (порядок 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey` (порядок 60)
8. **Exa** -- `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`; необов’язковий `plugins.entries.exa.config.webSearch.baseUrl` перевизначає endpoint Exa (порядок 65)
9. **Tavily** -- `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey` (порядок 70)
10. **Parallel** -- платний Parallel Search API через `PARALLEL_API_KEY` або `plugins.entries.parallel.config.webSearch.apiKey`; необов’язковий `plugins.entries.parallel.config.webSearch.baseUrl` перевизначає endpoint (порядок 75)

Після цього йдуть провайдери з налаштованим endpoint:

11. **SearXNG** -- `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Провайдери без ключа, як-от **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** і **Codex Hosted Search**, доступні лише тоді, коли ви
вибираєте їх явно через `tools.web.search.provider` або через
`openclaw configure --section web`. OpenClaw не надсилає керовані
запити `web_search` провайдеру без ключа лише тому, що не налаштовано провайдера
з API-підтримкою.

Моделі OpenAI Responses є винятком: поки `tools.web.search.provider` не
задано, вони використовують нативний web search OpenAI замість керованих провайдерів
вище. Задайте `tools.web.search.provider` як `parallel-free` (або інший провайдер),
щоб спрямувати їх через керований шлях.

<Note>
  Усі поля ключів провайдерів підтримують об’єкти SecretRef. SecretRefs з областю плагіна
  в `plugins.entries.<plugin>.config.webSearch.apiKey` розв’язуються для
  встановлених web search провайдерів з API-підтримкою, зокрема Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity і Tavily,
  незалежно від того, чи провайдера вибрано явно через `tools.web.search.provider`, чи
  вибрано через автовиявлення. У режимі автовиявлення OpenClaw розв’язує лише ключ
  вибраного провайдера -- невибрані SecretRefs залишаються неактивними, тож ви можете
  тримати налаштованими кілька провайдерів без витрат на розв’язання для тих,
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

Конфігурація, специфічна для провайдера (API-ключі, базові URL, режими), міститься в
`plugins.entries.<plugin>.config.webSearch.*`. Gemini також може повторно використовувати
`models.providers.google.apiKey` і `models.providers.google.baseUrl` як резервні варіанти
з нижчим пріоритетом після своєї спеціальної конфігурації web-search і `GEMINI_API_KEY`. Дивіться
приклади на сторінках провайдерів.
Grok також може повторно використовувати auth-профіль xAI OAuth з `openclaw models auth login
--provider xai --method oauth`; конфігурація API-ключа залишається резервним варіантом.

`tools.web.search.provider` перевіряється за id провайдерів web-search,
оголошеними в маніфестах вбудованих і встановлених плагінів. Помилка в написанні, як-от `"brvae"`,
спричиняє помилку валідації конфігурації замість тихого повернення до автовиявлення. Якщо
налаштований провайдер має лише застаріле свідчення плагіна, наприклад залишений
блок `plugins.entries.<plugin>` після видалення стороннього плагіна,
OpenClaw зберігає стійкий запуск і повідомляє попередження, щоб ви могли перевстановити
плагін або запустити `openclaw doctor --fix`, щоб очистити застарілу конфігурацію.

Вибір резервного провайдера `web_fetch` є окремим:

- виберіть його за допомогою `tools.web.fetch.provider`
- або не задавайте це поле й дозвольте OpenClaw автовиявити першого готового web-fetch
  провайдера з налаштованих облікових даних
- non-sandboxed `web_fetch` може використовувати встановлених провайдерів плагінів, які оголошують
  `contracts.webFetchProviders`; sandboxed fetch дозволяє вбудовані провайдери та
  перевірені офіційні встановлення плагінів, але виключає сторонні зовнішні плагіни
- офіційний плагін Firecrawl надає резервний web-fetch, налаштований у
  `plugins.entries.firecrawl.config.webFetch.*`

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон Moonshot API (`https://api.moonshot.ai/v1` або `https://api.moonshot.cn/v1`)
- типову модель Kimi web-search (за замовчуванням `kimi-k2.6`)

Для `x_search` налаштуйте `plugins.entries.xai.config.xSearch.*`. Він використовує той самий
auth-профіль xAI, що й чат, або `XAI_API_KEY` / облікові дані plugin web-search,
які використовуються web search Grok.
Застаріла конфігурація `tools.web.x_search.*` автоматично мігрується через `openclaw doctor --fix`.
Коли ви вибираєте Grok під час `openclaw onboard` або `openclaw configure --section web`,
OpenClaw також може запропонувати необов’язкове налаштування `x_search` з тими самими обліковими даними.
Це окремий подальший крок усередині шляху Grok, а не окремий вибір top-level
провайдера web-search. Якщо ви виберете іншого провайдера, OpenClaw не
показуватиме prompt `x_search`.

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
    Задайте env var провайдера в середовищі процесу Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Для встановлення gateway помістіть її в `~/.openclaw/.env`.
    Дивіться [Env vars](/uk/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Параметри інструмента

| Параметр              | Опис                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | Пошуковий запит (обов’язково)                         |
| `count`               | Кількість результатів для повернення (1-10, типово: 5) |
| `country`             | 2-літерний код країни ISO (наприклад, "US", "DE")     |
| `language`            | Код мови ISO 639-1 (наприклад, "en", "de")            |
| `search_lang`         | Код мови пошуку (лише Brave)                          |
| `freshness`           | Фільтр часу: `day`, `week`, `month` або `year`         |
| `date_after`          | Результати після цієї дати (YYYY-MM-DD)               |
| `date_before`         | Результати до цієї дати (YYYY-MM-DD)                  |
| `ui_lang`             | Код мови UI (лише Brave)                              |
| `domain_filter`       | Масив allowlist/denylist доменів (лише Perplexity)    |
| `max_tokens`          | Загальний бюджет вмісту, типово 25000 (лише Perplexity) |
| `max_tokens_per_page` | Ліміт токенів на сторінку, типово 2048 (лише Perplexity) |

<Warning>
  Не всі параметри працюють з усіма провайдерами. Режим Brave `llm-context`
  відхиляє `ui_lang`; `date_before` також потребує `date_after`, бо кастомні
  діапазони freshness Brave вимагають і початкову, і кінцеву дати.
  Gemini, Grok і Kimi повертають одну синтезовану відповідь із цитуваннями. Вони
  приймають `count` для сумісності зі спільним інструментом, але це не змінює
  форму grounded-відповіді. Gemini трактує freshness `day` як підказку щодо новизни; ширші
  значення freshness і явні дати задають часові діапазони Google Search grounding.
  Perplexity поводиться так само, коли ви використовуєте шлях сумісності Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` або `OPENROUTER_API_KEY`).
  SearXNG приймає `http://` лише для довірених хостів приватної мережі або loopback;
  публічні endpoint SearXNG мають використовувати `https://`.
  Firecrawl і Tavily підтримують лише `query` і `count` через `web_search`
  -- використовуйте їхні спеціальні інструменти для розширених опцій.
</Warning>

## x_search

`x_search` запитує пости X (раніше Twitter) за допомогою xAI та повертає
AI-синтезовані відповіді з цитуваннями. Він приймає запити природною мовою та
необов’язкові структуровані фільтри. OpenClaw вмикає вбудований інструмент xAI `x_search`
лише для запиту, який обслуговує цей виклик інструмента.

<Note>
  xAI документує `x_search` як такий, що підтримує keyword search, semantic search, user
  search і thread fetch. Для статистики залучення окремого поста, як-от reposts,
  replies, bookmarks або views, надавайте перевагу цільовому пошуку за точним URL поста
  або status ID. Широкі пошуки за ключовими словами можуть знайти правильний пост, але повернути менш
  повні metadata окремого поста. Добрий шаблон: спочатку знайдіть пост, потім
  виконайте другий запит `x_search`, зосереджений на цьому точному пості.
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
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` надсилає POST до `<baseUrl>/responses`, коли
`plugins.entries.xai.config.xSearch.baseUrl` задано. Якщо це поле пропущено,
він повертається до `plugins.entries.xai.config.webSearch.baseUrl`, потім до
застарілого `tools.web.search.grok.baseUrl`, і зрештою до публічного endpoint xAI.

### Параметри x_search

| Параметр                    | Опис                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Пошуковий запит (обов’язково)                                |
| `allowed_x_handles`          | Обмежити результати конкретними іменами користувачів X                 |
| `excluded_x_handles`         | Виключити конкретні імена користувачів X                             |
| `from_date`                  | Включати лише дописи на цю дату або після неї (YYYY-MM-DD)  |
| `to_date`                    | Включати лише дописи на цю дату або до неї (YYYY-MM-DD) |
| `enable_image_understanding` | Дозволити xAI перевіряти зображення, прикріплені до відповідних дописів      |
| `enable_video_understanding` | Дозволити xAI перевіряти відео, прикріплені до відповідних дописів      |

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

Якщо ви використовуєте профілі інструментів або списки дозволених, додайте `web_search`, `x_search` або `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Пов’язане

- [Веб-вибірка](/uk/tools/web-fetch) -- отримати URL і витягти придатний для читання вміст
- [Веббраузер](/uk/tools/browser) -- повна автоматизація браузера для сайтів із великою кількістю JS
- [Пошук Grok](/uk/tools/grok-search) -- Grok як провайдер `web_search`
- [Вебпошук Ollama](/uk/tools/ollama-search) -- вебпошук без ключа через ваш хост Ollama
