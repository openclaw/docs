---
read_when:
    - Ви хочете ввімкнути або налаштувати web_search
    - Ви хочете ввімкнути або налаштувати x_search
    - Вам потрібно вибрати постачальника пошуку
    - Ви хочете зрозуміти автоматичне виявлення та вибір провайдера
sidebarTitle: Web Search
summary: web_search, x_search і web_fetch — пошук в інтернеті, пошук дописів у X або отримання вмісту сторінки
title: Вебпошук
x-i18n:
    generated_at: "2026-07-12T13:49:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` виконує пошук у вебі за допомогою налаштованого постачальника та повертає
нормалізовані результати, кешовані за запитом протягом 15 хвилин (можна налаштувати). OpenClaw
також постачається з `x_search` для дописів у X (раніше Twitter) і `web_fetch` для
полегшеного отримання даних за URL-адресою. `web_fetch` завжди виконується локально; `web_search` спрямовує
запити через xAI Responses, коли постачальником є Grok, а `x_search` завжди використовує
xAI Responses.

<Info>
  `web_search` — це полегшений інструмент HTTP, а не засіб автоматизації браузера. Для
  сайтів, що активно використовують JS, або входу в обліковий запис скористайтеся [веббраузером](/uk/tools/browser). Для
  отримання даних із конкретної URL-адреси скористайтеся [Web Fetch](/uk/tools/web-fetch).
</Info>

## Швидкий початок

<Steps>
  <Step title="Виберіть постачальника">
    Виберіть постачальника та виконайте всі необхідні налаштування. Деякі постачальники
    не потребують ключа, іншим потрібен ключ API. Докладніше дивіться на сторінках постачальників
    нижче.
  </Step>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    ```
    Ця команда зберігає постачальника та всі необхідні облікові дані. Для постачальників
    з доступом через API натомість можна встановити змінну середовища постачальника (наприклад,
    `BRAVE_API_KEY`) і пропустити цей крок.
  </Step>
  <Step title="Скористайтеся">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Для дописів у X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Вибір постачальника

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/uk/tools/brave-search">
    Структуровані результати з фрагментами. Підтримує режим `llm-context` і фільтри за країною та мовою. Доступний безкоштовний рівень.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/uk/plugins/codex-harness">
    Синтезовані ШІ обґрунтовані відповіді через ваш обліковий запис сервера застосунку Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/uk/tools/duckduckgo-search">
    Постачальник без ключа. Ключ API не потрібен. Неофіційна інтеграція на основі HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/uk/tools/exa-search">
    Нейронний пошук і пошук за ключовими словами з видобуванням вмісту (виділені фрагменти, текст, резюме).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/uk/tools/firecrawl">
    Структуровані результати. Для глибокого видобування найкраще використовувати разом із `firecrawl_search` і `firecrawl_scrape`.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/uk/tools/gemini-search">
    Синтезовані ШІ відповіді з цитуваннями, обґрунтовані результатами Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/uk/tools/grok-search">
    Синтезовані ШІ відповіді з цитуваннями через вебобґрунтування xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/uk/tools/kimi-search">
    Синтезовані ШІ відповіді з цитуваннями через вебпошук Moonshot; резервні відповіді чату без обґрунтування завершуються явною помилкою.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/uk/tools/minimax-search">
    Структуровані результати через API пошуку MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/uk/tools/ollama-search">
    Пошук через локальний хост Ollama із виконаним входом або розміщений API Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/uk/tools/parallel-search">
    Платний API Parallel Search (`PARALLEL_API_KEY`); вищі обмеження частоти запитів і налаштування цільової функції.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/uk/tools/parallel-search">
    Підключається за бажанням і не потребує ключа. Безкоштовний Search MCP від Parallel зі щільними уривками, оптимізованими для LLM, без ключа API.
  </Card>
  <Card title="Perplexity" icon="search" href="/uk/tools/perplexity-search">
    Структуровані результати з керуванням видобуванням вмісту та фільтрацією за доменами.
  </Card>
  <Card title="SearXNG" icon="server" href="/uk/tools/searxng-search">
    Самостійно розміщений метапошук. Ключ API не потрібен. Агрегує Google, Bing, DuckDuckGo тощо.
  </Card>
  <Card title="Tavily" icon="globe" href="/uk/tools/tavily">
    Структуровані результати з налаштуванням глибини пошуку, фільтрацією за темою та `tavily_extract` для видобування даних із URL-адрес.
  </Card>
</CardGroup>

### Порівняння постачальників

| Постачальник                                     | Формат результатів                                             | Фільтри                                          | Ключ API                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/uk/tools/brave-search)                     | Структуровані фрагменти                                        | Країна, мова, час, режим `llm-context`            | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/uk/plugins/codex-harness)    | Синтезовані ШІ відповіді + URL-адреси джерел                   | Домени, розмір контексту, розташування користувача | Немає; використовує вхід у Codex/OpenAI                                                 |
| [DuckDuckGo](/uk/tools/duckduckgo-search)           | Структуровані фрагменти                                        | --                                               | Немає (без ключа)                                                                       |
| [Exa](/uk/tools/exa-search)                         | Структуровані результати + видобутий вміст                     | Нейронний режим/режим ключових слів, дата, видобування вмісту | `EXA_API_KEY`                                                                           |
| [Firecrawl](/uk/tools/firecrawl)                    | Структуровані фрагменти                                        | Через інструмент `firecrawl_search`               | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/uk/tools/gemini-search)                   | Синтезовані ШІ відповіді + цитування                           | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/uk/tools/grok-search)                       | Синтезовані ШІ відповіді + цитування                           | --                                               | OAuth xAI, `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey`               |
| [Kimi](/uk/tools/kimi-search)                       | Синтезовані ШІ відповіді + цитування; помилка для резервних відповідей чату без обґрунтування | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/uk/tools/minimax-search)          | Структуровані фрагменти                                        | Регіон (`global` / `cn`)                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/uk/tools/ollama-search)        | Структуровані фрагменти                                        | --                                               | Немає для локальних хостів із виконаним входом; `OLLAMA_API_KEY` для прямого пошуку через `https://ollama.com` |
| [Parallel](/uk/tools/parallel-search)               | Щільні уривки, ранжовані для контексту LLM                     | --                                               | `PARALLEL_API_KEY` (платний)                                                            |
| [Parallel Search (Free)](/uk/tools/parallel-search) | Щільні уривки, ранжовані для контексту LLM                     | --                                               | Немає (безкоштовний Search MCP)                                                         |
| [Perplexity](/uk/tools/perplexity-search)           | Структуровані фрагменти                                        | Країна, мова, час, домени, обмеження вмісту       | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/uk/tools/searxng-search)                 | Структуровані фрагменти                                        | Категорії, мова                                   | Немає (самостійне розміщення)                                                           |
| [Tavily](/uk/tools/tavily)                          | Структуровані фрагменти                                        | Через інструмент `tavily_search`                  | `TAVILY_API_KEY`                                                                        |

## Автоматичне визначення

Списки постачальників у документації та процесах налаштування впорядковано за абеткою. Для автоматичного визначення використовується
окремий фіксований порядок пріоритетності, і постачальник, якому потрібні
облікові дані (`requiresCredential !== false`), вибирається лише тоді, коли такі дані налаштовано. Якщо
`provider` не задано, OpenClaw перевіряє постачальників у наведеному порядку та використовує
першого готового:

Спочатку постачальники з доступом через API:

1. **Brave** -- `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey` (порядок 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey` (порядок 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` або `models.providers.google.apiKey` (порядок 20)
4. **Grok** -- OAuth xAI, `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` (порядок 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey` (порядок 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey` (порядок 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey` (порядок 60)
8. **Exa** -- `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`; необов’язковий параметр `plugins.entries.exa.config.webSearch.baseUrl` перевизначає кінцеву точку Exa (порядок 65)
9. **Tavily** -- `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey` (порядок 70)
10. **Parallel** -- платний API Parallel Search через `PARALLEL_API_KEY` або `plugins.entries.parallel.config.webSearch.apiKey`; необов’язковий параметр `plugins.entries.parallel.config.webSearch.baseUrl` перевизначає кінцеву точку (порядок 75)

Після них — постачальники з налаштованими кінцевими точками:

11. **SearXNG** -- `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Постачальники без ключів, як-от **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** і **Codex Hosted Search**, ніколи не вибираються автоматично,
навіть якщо мають внутрішнє значення порядку. Вони використовуються лише тоді, коли ви
явно вибираєте їх за допомогою `tools.web.search.provider` або через
`openclaw configure --section web`. OpenClaw не надсилає керовані
запити `web_search` постачальнику без ключа лише тому, що не налаштовано жодного
постачальника з доступом через API.

Моделі OpenAI Responses є винятком: доки `tools.web.search.provider`
не задано, вони використовують нативний вебпошук OpenAI замість зазначених вище керованих
постачальників (див. нижче). Установіть для `tools.web.search.provider` значення
`parallel-free` (або іншого постачальника), щоб натомість спрямовувати їх через керований шлях.

<Note>
  Усі поля ключів постачальників підтримують об’єкти SecretRef. SecretRef у межах Plugin
  за шляхом `plugins.entries.<plugin>.config.webSearch.apiKey` розпізнаються для
  встановлених постачальників вебпошуку з доступом через API, зокрема Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity і Tavily,
  незалежно від того, чи постачальника явно вибрано через `tools.web.search.provider`, чи
  визначено автоматично. У режимі автоматичного визначення OpenClaw розпізнає лише ключ
  вибраного постачальника — невибрані SecretRef залишаються неактивними, тож можна
  налаштувати кількох постачальників без витрат на розпізнавання тих,
  яких ви не використовуєте.
</Note>

## Нативний вебпошук OpenAI

Моделі прямого доступу до OpenAI Responses (`api: "openai-responses"`, постачальник `openai`,
без базової URL-адреси або з офіційною базовою URL-адресою OpenAI API) автоматично використовують розміщений в OpenAI
інструмент `web_search`, коли вебпошук OpenClaw увімкнено й не закріплено
керованого постачальника. Ця поведінка належить постачальнику в комплектному
Plugin OpenAI й не поширюється на базові URL-адреси проксі, сумісних з OpenAI, або маршрути Azure.
Установіть для `tools.web.search.provider` іншого постачальника, наприклад `brave`, щоб
зберегти керований інструмент `web_search` для моделей OpenAI, або встановіть
`tools.web.search.enabled: false`, щоб вимкнути і керований пошук, і вбудований
пошук OpenAI.

## Вбудований вебпошук Codex

Середовище виконання app-server Codex автоматично використовує розміщений у Codex інструмент `web_search`,
коли вебпошук увімкнено й не вибрано керованого постачальника. Вбудований розміщений
пошук і динамічний керований інструмент `web_search` OpenClaw взаємовиключні,
тому керований пошук не може обійти вбудовані обмеження доменів. OpenClaw використовує
керований інструмент, коли розміщений пошук недоступний, явно вимкнений або
замінений вибраним керованим постачальником. OpenClaw залишає автономне
розширення `web.run` Codex вимкненим (`features.standalone_web_search: false`),
оскільки робочий трафік app-server відхиляє визначений користувачем простір імен `web`.

- Налаштуйте вбудований пошук у `tools.web.search.openaiCodex`
- Установіть `tools.web.search.provider: "codex"`, щоб налаштувати Codex Hosted Search як
  керованого постачальника `web_search` для будь-якої батьківської моделі. Кожен виклик запускає
  обмежений ефемерний хід app-server Codex і завершується помилкою, якщо Codex не створить
  розміщений елемент `webSearch`.
- `mode: "cached"` є типовим бажаним режимом, але Codex перетворює його на прямий
  зовнішній доступ для необмежених ходів app-server; установіть `"live"`, щоб явно запросити
  прямий доступ
- Установіть для `tools.web.search.provider` керованого постачальника, наприклад `brave`, щоб натомість
  використовувати керований інструмент `web_search` OpenClaw
- Установіть `tools.web.search.openaiCodex.enabled: false`, щоб відмовитися від розміщеного в Codex
  пошуку; інші керовані постачальники залишаться доступними
- Обмеження поверхні вбудованих інструментів Codex також зберігає доступність керованого `web_search`
- Коли встановлено `allowedDomains`, автоматичний перехід до керованого пошуку завершується безпечною відмовою, якщо
  розміщений пошук недоступний, щоб не можна було обійти вбудований список дозволених доменів
- Запуски лише з LLM і вимкненими інструментами вимикають як вбудований, так і керований пошук
- `tools.web.search.enabled: false` вимикає як керований, так і вбудований пошук

Постійні зміни чинної політики пошуку Codex запускають новий прив’язаний потік, щоб
уже завантажений потік app-server не міг зберегти застарілий доступ до розміщеного пошуку.
Тимчасові обмеження для окремого ходу використовують тимчасовий обмежений потік і зберігають
наявну прив’язку для подальшого відновлення.

Прямий трафік OpenAI ChatGPT Responses також може використовувати розміщений в OpenAI
інструмент `web_search`. Цей окремий шлях залишається доступним за явною згодою через
`tools.web.search.openaiCodex.enabled: true` і застосовується лише до придатних
моделей `openai/*`, що використовують `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Необов’язково: використовуйте Codex Hosted Search і з батьківськими моделями, відмінними від Codex.
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

Для середовищ виконання та постачальників, які не підтримують вбудований пошук Codex, Codex може
використовувати резервний керований `web_search` через простір імен динамічних інструментів OpenClaw.
Використовуйте явно вказаного керованого постачальника, коли замість розміщеного в Codex пошуку вам потрібні
мережеві засоби керування OpenClaw, специфічні для постачальника.

Вибір `provider: "codex"` вмикає комплектний Plugin `codex` і використовує
ті самі обмеження `tools.web.search.openaiCodex`, що наведені вище. Спочатку автентифікуйте
app-server Codex за допомогою `openclaw models auth login --provider openai`.
Батьківський агент може використовувати будь-яку модель або середовище виконання; лише обмежений пошуковий виконавець
працює через Codex.

## Безпека мережі

Виклики постачальників керованого HTTP-інструмента `web_search` використовують захищений шлях отримання даних OpenClaw,
обмежений власним ім’ям хоста поточного постачальника. Лише для цього імені хоста
OpenClaw дозволяє DNS-відповіді з фіктивними IP-адресами Surge, Clash і sing-box у
`198.18.0.0/15` та `fc00::/7`. Інші приватні адреси, local loopback, локальні адреси каналу та
адреси метаданих залишаються заблокованими. Codex Hosted Search є винятком:
його обмежений виконавець делегує мережевий доступ розміщеному інструменту `web_search`
app-server Codex.

Цей автоматичний дозвіл не поширюється на довільні URL-адреси `web_fetch`. Для
`web_fetch` явно вмикайте `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` і
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` лише тоді, коли ваш
довірений проксі володіє цими синтетичними діапазонами.

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // типове значення: true
        provider: "brave", // або пропустіть для автоматичного визначення
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Специфічна для постачальника конфігурація (ключі API, базові URL-адреси, режими) міститься в
`plugins.entries.<plugin>.config.webSearch.*`. Gemini також може повторно використовувати
`models.providers.google.apiKey` і `models.providers.google.baseUrl` як резервні варіанти
з нижчим пріоритетом після спеціальної конфігурації вебпошуку та `GEMINI_API_KEY`. Приклади
дивіться на сторінках постачальників.
Grok також може повторно використовувати профіль автентифікації xAI OAuth із `openclaw models auth login
--provider xai --method oauth`; конфігурація ключа API залишається резервним варіантом.

`tools.web.search.provider` перевіряється за ідентифікаторами постачальників вебпошуку,
оголошеними в маніфестах комплектних і встановлених Plugin. Друкарська помилка на кшталт `"brvae"`
спричиняє помилку перевірки конфігурації замість непомітного переходу до автоматичного визначення. Якщо
налаштований постачальник має лише застарілі свідчення Plugin, наприклад залишковий
блок `plugins.entries.<plugin>` після видалення стороннього Plugin,
OpenClaw зберігає стійкість запуску й повідомляє попередження, щоб ви могли повторно встановити
Plugin або запустити `openclaw doctor --fix` для очищення застарілої конфігурації.

Вибір резервного постачальника `web_fetch` здійснюється окремо:

- виберіть його за допомогою `tools.web.fetch.provider`
- або пропустіть це поле й дозвольте OpenClaw автоматично визначити першого готового постачальника web-fetch
  з налаштованих облікових даних
- `web_fetch` поза пісочницею може використовувати встановлених постачальників Plugin, які оголошують
  `contracts.webFetchProviders`; отримання даних у пісочниці дозволяє комплектних постачальників і
  перевірені встановлення офіційних Plugin, але виключає сторонні зовнішні Plugin
- офіційний Plugin Firecrawl наразі є єдиним комплектним учасником `webFetchProviders`,
  налаштованим у
  `plugins.entries.firecrawl.config.webFetch.*`

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон Moonshot API (`https://api.moonshot.ai/v1` або `https://api.moonshot.cn/v1`)
- типову модель вебпошуку Kimi (типове значення — `kimi-k2.6`)

Для `x_search` налаштуйте `plugins.entries.xai.config.xSearch.*`. Він використовує
той самий профіль автентифікації xAI, що й чат, або облікові дані `XAI_API_KEY` / вебпошуку Plugin,
які використовує вебпошук Grok.
Застаріла конфігурація `tools.web.x_search.*` автоматично переноситься командою `openclaw doctor --fix`.
Коли ви вибираєте Grok під час `openclaw onboard` або `openclaw configure --section web`,
OpenClaw також пропонує необов’язкове налаштування `x_search` із тими самими обліковими даними
відразу після завершення налаштування Grok. Це окремий наступний крок у шляху Grok,
а не окремий вибір постачальника вебпошуку верхнього рівня. Якщо вибрати іншого
постачальника, OpenClaw не показує запит `x_search`.

### Зберігання ключів API

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
    Установіть змінну середовища постачальника в середовищі процесу Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Для встановлення Gateway помістіть її в `~/.openclaw/.env`.
    Див. [Змінні середовища](/uk/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Параметри інструмента

| Параметр              | Опис                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | Пошуковий запит (обов’язковий)                                     |
| `count`               | Кількість результатів для повернення (1–10, типове значення: 5)    |
| `country`             | Дволітерний код країни ISO (наприклад, "US", "DE")                  |
| `language`            | Код мови ISO 639-1 (наприклад, "en", "de")                          |
| `search_lang`         | Код мови пошуку (лише Brave)                                       |
| `freshness`           | Фільтр часу: `day`, `week`, `month` або `year`                      |
| `date_after`          | Результати після цієї дати (РРРР-ММ-ДД)                            |
| `date_before`         | Результати до цієї дати (РРРР-ММ-ДД)                               |
| `ui_lang`             | Код мови інтерфейсу (лише Brave)                                   |
| `domain_filter`       | Масив дозволених/заборонених доменів (лише Perplexity)             |
| `max_tokens`          | Загальний бюджет токенів вмісту, лише для вбудованого Perplexity Search API |
| `max_tokens_per_page` | Обмеження токенів для отримання даних з однієї сторінки, лише для вбудованого Perplexity Search API |

<Warning>
  Не всі параметри працюють з усіма постачальниками. Режим Brave `llm-context`
  відхиляє `ui_lang`; для `date_before` також потрібен `date_after`, оскільки власні
  діапазони актуальності Brave вимагають і початкової, і кінцевої дат.
  Gemini, Grok і Kimi повертають одну синтезовану відповідь із посиланнями на джерела. Вони
  приймають `count` для сумісності зі спільним інструментом, але це не змінює
  форму обґрунтованої відповіді. Gemini трактує актуальність `day` як підказку щодо давності; ширші
  значення актуальності та явні дати задають часові діапазони обґрунтування Google Search.
  Perplexity поводиться так само, коли ви використовуєте шлях сумісності Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` або `OPENROUTER_API_KEY`); цей шлях також не підтримує `max_tokens` і
  `max_tokens_per_page`.
  SearXNG приймає `http://` лише для довірених хостів приватної мережі або local loopback;
  загальнодоступні кінцеві точки SearXNG мають використовувати `https://`.
  Firecrawl і Tavily через `web_search` підтримують лише `query` та `count`
  — для розширених параметрів використовуйте їхні спеціалізовані інструменти.
</Warning>

## x_search

`x_search` виконує пошук дописів у X (раніше Twitter) за допомогою xAI та повертає
синтезовані ШІ відповіді з посиланнями на джерела. Він приймає запити природною мовою та
необов’язкові структуровані фільтри. OpenClaw створює вбудований інструмент xAI `x_search`
для кожного запиту, а не зберігає його постійно зареєстрованим, тому він активний лише
для ходу, який фактично його викликає.

<Warning>
  `x_search` працює на серверах xAI. xAI стягує $5 за 1 000 викликів інструмента плюс
  токени введення та виведення моделі.
</Warning>

<Note>
  У документації xAI зазначено, що `x_search` підтримує пошук за ключовими словами, семантичний пошук, пошук
  користувачів і отримання гілок обговорення. Для статистики взаємодії з окремим дописом, як-от репости,
  відповіді, закладки або перегляди, надавайте перевагу цільовому пошуку за точною URL-адресою допису
  або ідентифікатором статусу. Широкі пошуки за ключовими словами можуть знайти потрібний допис, але повернути менш
  повні метадані окремого допису. Рекомендована схема: спочатку знайдіть допис, а потім
  виконайте другий запит `x_search`, зосереджений саме на цьому дописі.
</Note>

### Конфігурація x_search

Якщо `enabled` не вказано, `x_search` доступний лише тоді, коли постачальником активної моделі є `xai` і облікові дані xAI успішно визначено. Для активної моделі з відомим постачальником, відмінним від xAI, установіть `plugins.entries.xai.config.xSearch.enabled` у `true`, щоб увімкнути використання між постачальниками. Якщо постачальника активної моделі не вказано або не вдалося визначити, інструмент залишається прихованим. Установіть `enabled` у `false`, щоб вимкнути його для всіх постачальників. Облікові дані xAI потрібні завжди.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // обов’язково для відомого постачальника моделі, відмінного від xAI
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // необов’язково, перевизначає webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // необов’язково, якщо налаштовано профіль автентифікації xAI або XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // необов’язкова спільна базова URL-адреса xAI Responses
          },
        },
      },
    },
  },
}
```

`x_search` надсилає POST-запити до `<baseUrl>/responses`, якщо встановлено `plugins.entries.xai.config.xSearch.baseUrl`. Якщо це поле не вказано, використовується `plugins.entries.xai.config.webSearch.baseUrl`, потім застаріле `tools.web.search.grok.baseUrl` і, зрештою, загальнодоступна кінцева точка xAI (`https://api.x.ai/v1`).

### Параметри x_search

| Параметр                     | Опис                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| `query`                      | Пошуковий запит (обов’язково)                                          |
| `allowed_x_handles`          | Обмежити результати щонайбільше 20 ідентифікаторами X                  |
| `excluded_x_handles`         | Виключити щонайбільше 20 ідентифікаторів X                             |
| `from_date`                  | Включати лише дописи, опубліковані в цю дату або пізніше (YYYY-MM-DD)  |
| `to_date`                    | Включати лише дописи, опубліковані в цю дату або раніше (YYYY-MM-DD)   |
| `enable_image_understanding` | Дозволити xAI аналізувати зображення, прикріплені до відповідних дописів |
| `enable_video_understanding` | Дозволити xAI аналізувати відео, прикріплені до відповідних дописів    |

`allowed_x_handles` і `excluded_x_handles` є взаємовиключними.

### Приклад x_search

```javascript
await x_search({
  query: "рецепти вечері",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Статистика окремого допису: за можливості використовуйте точну URL-адресу статусу або ідентифікатор статусу
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Приклади

```javascript
// Базовий пошук
await web_search({ query: "SDK плагінів OpenClaw" });

// Пошук німецькою мовою
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Нещодавні результати (за минулий тиждень)
await web_search({ query: "розвиток ШІ", freshness: "week" });

// Діапазон дат
await web_search({
  query: "дослідження клімату",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Фільтрування за доменами (лише Perplexity)
await web_search({
  query: "огляди продуктів",
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

## Пов’язані матеріали

- [Отримання вебвмісту](/uk/tools/web-fetch) -- отримання даних за URL-адресою та видобування зручного для читання вмісту
- [Веббраузер](/uk/tools/browser) -- повна автоматизація браузера для сайтів, що інтенсивно використовують JS
- [Пошук Grok](/uk/tools/grok-search) -- Grok як постачальник `web_search`
- [Вебпошук Ollama](/uk/tools/ollama-search) -- вебпошук без ключа через ваш хост Ollama
