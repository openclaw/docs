---
read_when:
    - Вы хотите включить или настроить web_search
    - Вы хотите включить или настроить x_search
    - Вам нужно выбрать поискового провайдера
    - Вы хотите понять автоматическое обнаружение и выбор провайдера
sidebarTitle: Web Search
summary: web_search, x_search и web_fetch — поиск в интернете, поиск публикаций в X или получение содержимого страницы
title: Веб-поиск
x-i18n:
    generated_at: "2026-07-13T20:24:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` выполняет поиск в интернете с помощью настроенного провайдера и возвращает
нормализованные результаты, кэшируемые по запросу на 15 минут (период можно настроить). OpenClaw
также включает `x_search` для публикаций в X (ранее Twitter) и `web_fetch` для
упрощённого получения данных по URL. `web_fetch` всегда выполняется локально; `web_search` направляет запросы
через xAI Responses, когда провайдером является Grok, а `x_search` всегда использует
xAI Responses.

<Info>
  `web_search` — упрощённый HTTP-инструмент, а не средство автоматизации браузера. Для
  сайтов, активно использующих JS, или входа в систему используйте [веб-браузер](/ru/tools/browser). Для
  получения данных по конкретному URL используйте [Web Fetch](/ru/tools/web-fetch).
</Info>

## Быстрый старт

<Steps>
  <Step title="Выберите провайдера">
    Выберите провайдера и выполните необходимую настройку. Для некоторых провайдеров
    ключ не требуется, другим нужен ключ API. Подробности см.
    на страницах провайдеров ниже.
  </Step>
  <Step title="Настройте">
    ```bash
    openclaw configure --section web
    ```
    Эта команда сохраняет провайдера и необходимые учётные данные. Для провайдеров,
    использующих API, вместо этого можно задать переменную окружения провайдера (например,
    `BRAVE_API_KEY`) и пропустить этот шаг.
  </Step>
  <Step title="Используйте">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Для публикаций в X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Выбор провайдера

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ru/tools/brave-search">
    Структурированные результаты с фрагментами. Поддерживает режим `llm-context` и фильтры по стране и языку. Доступен бесплатный тариф.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/ru/plugins/codex-harness">
    Синтезированные ИИ ответы, основанные на источниках, через вашу учётную запись Codex app-server.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ru/tools/duckduckgo-search">
    Провайдер без ключа. Ключ API не требуется. Неофициальная интеграция на основе HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ru/tools/exa-search">
    Нейронный поиск и поиск по ключевым словам с извлечением содержимого (основные фрагменты, текст, сводки).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ru/tools/firecrawl">
    Структурированные результаты. Для глубокого извлечения лучше всего использовать совместно с `firecrawl_search` и `firecrawl_scrape`.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ru/tools/gemini-search">
    Синтезированные ИИ ответы с цитированием на основе результатов Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/ru/tools/grok-search">
    Синтезированные ИИ ответы с цитированием на основе веб-источников xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/ru/tools/kimi-search">
    Синтезированные ИИ ответы с цитированием через веб-поиск Moonshot; резервные ответы чата без опоры на источники завершаются явной ошибкой.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ru/tools/minimax-search">
    Структурированные результаты через поисковый API MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ru/tools/ollama-search">
    Поиск через локальный хост Ollama с выполненным входом или размещённый API Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/ru/tools/parallel-search">
    Платный API Parallel Search (`PARALLEL_API_KEY`); более высокие ограничения частоты запросов и настройка целевой функции.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/ru/tools/parallel-search">
    Подключаемый провайдер без ключа. Бесплатный Search MCP от Parallel с плотными фрагментами, оптимизированными для LLM, и без ключа API.
  </Card>
  <Card title="Perplexity" icon="search" href="/ru/tools/perplexity-search">
    Структурированные результаты с настройками извлечения содержимого и фильтрацией по доменам.
  </Card>
  <Card title="SearXNG" icon="server" href="/ru/tools/searxng-search">
    Самостоятельно размещаемый метапоиск. Ключ API не требуется. Объединяет результаты Google, Bing, DuckDuckGo и других систем.
  </Card>
  <Card title="Tavily" icon="globe" href="/ru/tools/tavily">
    Структурированные результаты с настройкой глубины поиска, фильтрацией по темам и `tavily_extract` для извлечения данных по URL.
  </Card>
</CardGroup>

### Сравнение провайдеров

| Провайдер                                        | Формат результатов                                              | Фильтры                                          | Ключ API                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ru/tools/brave-search)                     | Структурированные фрагменты                                    | Страна, язык, время, режим `llm-context`         | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/ru/plugins/codex-harness)    | Синтезированные ИИ ответы + URL источников                     | Домены, размер контекста, местоположение пользователя | Нет; используется вход в Codex/OpenAI                                                   |
| [DuckDuckGo](/ru/tools/duckduckgo-search)           | Структурированные фрагменты                                    | --                                               | Нет (ключ не требуется)                                                                 |
| [Exa](/ru/tools/exa-search)                         | Структурированные + извлечённые данные                         | Нейронный режим/режим ключевых слов, дата, извлечение содержимого | `EXA_API_KEY`                                                           |
| [Firecrawl](/ru/tools/firecrawl)                    | Структурированные фрагменты                                    | Через инструмент `firecrawl_search`              | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ru/tools/gemini-search)                   | Синтезированные ИИ ответы + цитирование                        | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ru/tools/grok-search)                       | Синтезированные ИИ ответы + цитирование                        | --                                               | OAuth xAI, `XAI_API_KEY` или `plugins.entries.xai.config.webSearch.apiKey`               |
| [Kimi](/ru/tools/kimi-search)                       | Синтезированные ИИ ответы + цитирование; ошибка при резервных ответах чата без опоры на источники | --                             | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ru/tools/minimax-search)          | Структурированные фрагменты                                    | Регион (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ru/tools/ollama-search)        | Структурированные фрагменты                                    | --                                               | Нет для локальных хостов с выполненным входом; `OLLAMA_API_KEY` для прямого поиска `https://ollama.com` |
| [Parallel](/ru/tools/parallel-search)               | Плотные фрагменты, ранжированные для контекста LLM             | --                                               | `PARALLEL_API_KEY` (платный)                                                            |
| [Parallel Search (Free)](/ru/tools/parallel-search) | Плотные фрагменты, ранжированные для контекста LLM             | --                                               | Нет (бесплатный Search MCP)                                                             |
| [Perplexity](/ru/tools/perplexity-search)           | Структурированные фрагменты                                    | Страна, язык, время, домены, ограничения содержимого | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                         |
| [SearXNG](/ru/tools/searxng-search)                 | Структурированные фрагменты                                    | Категории, язык                                  | Нет (самостоятельное размещение)                                                        |
| [Tavily](/ru/tools/tavily)                          | Структурированные фрагменты                                    | Через инструмент `tavily_search`              | `TAVILY_API_KEY`                                                                        |

## Автоматическое определение

Списки провайдеров в документации и сценариях настройки упорядочены по алфавиту. Автоматическое определение использует
отдельный фиксированный порядок приоритетов и выбирает провайдера, которому нужны
учётные данные (`requiresCredential !== false`), только если обнаруживает настроенные данные. Если
`provider` не задан, OpenClaw проверяет провайдеров в следующем порядке и использует
первый готовый:

Сначала провайдеры с API:

1. **Brave** -- `BRAVE_API_KEY` или `plugins.entries.brave.config.webSearch.apiKey` (порядок 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` или `plugins.entries.minimax.config.webSearch.apiKey` (порядок 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` или `models.providers.google.apiKey` (порядок 20)
4. **Grok** -- OAuth xAI, `XAI_API_KEY` или `plugins.entries.xai.config.webSearch.apiKey` (порядок 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` или `plugins.entries.moonshot.config.webSearch.apiKey` (порядок 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` или `plugins.entries.perplexity.config.webSearch.apiKey` (порядок 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` или `plugins.entries.firecrawl.config.webSearch.apiKey` (порядок 60)
8. **Exa** -- `EXA_API_KEY` или `plugins.entries.exa.config.webSearch.apiKey`; необязательная переменная `plugins.entries.exa.config.webSearch.baseUrl` переопределяет конечную точку Exa (порядок 65)
9. **Tavily** -- `TAVILY_API_KEY` или `plugins.entries.tavily.config.webSearch.apiKey` (порядок 70)
10. **Parallel** -- платный API Parallel Search через `PARALLEL_API_KEY` или `plugins.entries.parallel.config.webSearch.apiKey`; необязательная переменная `plugins.entries.parallel.config.webSearch.baseUrl` переопределяет конечную точку (порядок 75)

Затем провайдеры с настроенной конечной точкой:

11. **SearXNG** -- `SEARXNG_BASE_URL` или `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Провайдеры без ключей, такие как **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** и **Codex Hosted Search**, никогда не выбираются автоматическим определением,
даже если у них есть внутреннее значение порядка. Они используются, только если вы
явно выберете их с помощью `tools.web.search.provider` или через
`openclaw configure --section web`. OpenClaw не направляет управляемые запросы
`web_search` провайдеру без ключа только потому, что не настроен ни один провайдер
с API.

Модели OpenAI Responses являются исключением: пока `tools.web.search.provider`
не задан, они используют встроенный веб-поиск OpenAI вместо перечисленных выше управляемых
провайдеров (см. ниже). Задайте для `tools.web.search.provider` значение
`parallel-free` (или другого провайдера), чтобы вместо этого направлять их через управляемый путь.

<Note>
  Все поля ключей провайдеров поддерживают объекты SecretRef. SecretRef с областью плагина
  в `plugins.entries.<plugin>.config.webSearch.apiKey` разрешаются для
  установленных провайдеров веб-поиска с API, включая Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity и Tavily,
  независимо от того, выбран ли провайдер явно через `tools.web.search.provider` или
  посредством автоматического определения. В режиме автоматического определения OpenClaw разрешает только
  ключ выбранного провайдера — невыбранные SecretRef остаются неактивными, поэтому можно
  настроить несколько провайдеров без затрат на разрешение данных для тех,
  которые вы не используете.
</Note>

## Встроенный веб-поиск OpenAI

Прямые модели OpenAI Responses (`api: "openai-responses"`, провайдер `openai`,
без базового URL или с официальным базовым URL API OpenAI) автоматически используют размещённый OpenAI
инструмент `web_search`, когда веб-поиск OpenClaw включён и не закреплён
управляемый провайдер. Это поведение принадлежит провайдеру во встроенном
плагине OpenAI и не применяется к базовым URL прокси-серверов, совместимых с OpenAI, или маршрутам Azure.
Задайте для `tools.web.search.provider` другого провайдера, например `brave`, чтобы
сохранить управляемый инструмент `web_search` для моделей OpenAI, либо задайте
`tools.web.search.enabled: false`, чтобы отключить как управляемый поиск, так и встроенный
поиск OpenAI.

## Нативный веб-поиск Codex

Среда выполнения app-server Codex автоматически использует размещённый инструмент Codex `web_search`,
когда веб-поиск включён и управляемый провайдер не выбран. Нативный размещённый
поиск и динамический управляемый инструмент OpenClaw `web_search` являются взаимоисключающими,
поэтому управляемый поиск не может обойти нативные ограничения доменов. OpenClaw использует
управляемый инструмент, когда размещённый поиск недоступен, явно отключён или
заменён выбранным управляемым провайдером. OpenClaw оставляет отдельное
расширение Codex `web.run` отключённым (`features.standalone_web_search: false`),
поскольку рабочий трафик app-server отклоняет заданное пользователем пространство имён `web`.

- Настройте нативный поиск в разделе `tools.web.search.openaiCodex`
- Укажите `tools.web.search.provider: "codex"`, чтобы подготовить Codex Hosted Search в качестве
  управляемого провайдера `web_search` для любой родительской модели. Каждый вызов запускает
  ограниченный эфемерный цикл app-server Codex и завершается ошибкой, если Codex не создаёт
  размещённый элемент `webSearch`.
- `mode: "cached"` — предпочтение по умолчанию, но Codex преобразует его в активный
  внешний доступ для неограниченных циклов app-server; укажите `"live"`, чтобы явно запросить
  активный доступ
- Укажите в `tools.web.search.provider` управляемого провайдера, например `brave`, чтобы вместо этого использовать
  управляемый инструмент OpenClaw `web_search`
- Укажите `tools.web.search.openaiCodex.enabled: false`, чтобы отказаться от размещённого Codex
  поиска; другие управляемые провайдеры останутся доступны
- Ограничение нативной поверхности инструментов Codex также сохраняет доступность управляемого `web_search`
- Когда задано `allowedDomains`, автоматический управляемый резервный механизм закрывается при отказе,
  если размещённый поиск недоступен, поэтому нативный список разрешённых ресурсов нельзя обойти
- Запуски только с LLM и отключёнными инструментами отключают как нативный, так и управляемый поиск
- `tools.web.search.enabled: false` отключает как управляемый, так и нативный поиск

Постоянные изменения фактической политики поиска Codex запускают новый связанный поток, чтобы
уже загруженный поток app-server не мог сохранить устаревший доступ к размещённому поиску.
Временные ограничения для отдельного цикла используют временный ограниченный поток и сохраняют
существующую привязку для последующего возобновления.

Прямой трафик OpenAI ChatGPT Responses также может использовать размещённый
инструмент OpenAI `web_search`. Этот отдельный путь остаётся доступным только при явном включении через
`tools.web.search.openaiCodex.enabled: true` и применяется только к подходящим
моделям `openai/*`, использующим `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Необязательно: также использовать Codex Hosted Search из родительских моделей, отличных от Codex.
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

Для сред выполнения и провайдеров, которые не поддерживают нативный поиск Codex, Codex может
использовать управляемый резервный механизм `web_search` через пространство имён динамических инструментов OpenClaw.
Выберите явного управляемого провайдера, если вам нужны специфичные для провайдера
сетевые ограничения OpenClaw вместо размещённого поиска Codex.

Выбор `provider: "codex"` включает встроенный плагин `codex` и использует
те же ограничения `tools.web.search.openaiCodex`, которые показаны выше. Сначала выполните аутентификацию
app-server Codex с помощью `openclaw models auth login --provider openai`.
Родительский агент может использовать любую модель или среду выполнения; только ограниченный поисковый исполнитель
работает через Codex.

## Безопасность сети

Вызовы управляемого HTTP-провайдера `web_search` используют защищённый путь получения данных OpenClaw,
ограниченный собственным именем хоста текущего провайдера. Только для этого имени хоста
OpenClaw разрешает ответы DNS с поддельными IP-адресами от Surge, Clash и sing-box в
`198.18.0.0/15` и `fc00::/7`. Другие частные адреса, адреса обратной связи, локальные адреса канала и
адреса служб метаданных остаются заблокированными. Codex Hosted Search является исключением:
его ограниченный исполнитель делегирует сетевой доступ размещённому
инструменту app-server Codex `web_search`.

Это автоматическое разрешение не применяется к произвольным URL-адресам `web_fetch`. Для
`web_fetch` явно включайте `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` и
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` только тогда, когда эти синтетические диапазоны
принадлежат вашему доверенному прокси-серверу.

## Конфигурация

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // по умолчанию: true
        provider: "brave", // или не указывайте для автоматического определения
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Конфигурация конкретного провайдера (ключи API, базовые URL-адреса, режимы) находится в
`plugins.entries.<plugin>.config.webSearch.*`. Gemini также может повторно использовать
`models.providers.google.apiKey` и `models.providers.google.baseUrl` как резервные варианты с более низким приоритетом
после своей специальной конфигурации веб-поиска и `GEMINI_API_KEY`. Примеры приведены
на страницах провайдеров.
Grok также может повторно использовать профиль аутентификации xAI OAuth из `openclaw models auth login
--provider xai --method oauth`; конфигурация ключа API остаётся резервным вариантом.

Значение `tools.web.search.provider` проверяется по идентификаторам провайдеров веб-поиска,
объявленным в манифестах встроенных и установленных плагинов. Опечатка вроде `"brvae"`
приводит к ошибке проверки конфигурации вместо незаметного перехода к автоматическому определению. Если
для настроенного провайдера остались только устаревшие данные плагина, например оставшийся
блок `plugins.entries.<plugin>` после удаления стороннего плагина,
OpenClaw сохраняет устойчивость запуска и выводит предупреждение, чтобы вы могли переустановить
плагин или запустить `openclaw doctor --fix` для очистки устаревшей конфигурации.

Выбор резервного провайдера `web_fetch` выполняется отдельно:

- выберите его с помощью `tools.web.fetch.provider`
- либо не указывайте это поле, и OpenClaw автоматически определит первого готового провайдера
  веб-загрузки по настроенным учётным данным
- запрос `web_fetch` вне песочницы может использовать провайдеры установленных плагинов, которые объявляют
  `contracts.webFetchProviders`; запросы из песочницы разрешают встроенных провайдеров и
  проверенные установки официальных плагинов, но исключают сторонние внешние плагины
- официальный плагин Firecrawl на сегодня является единственным встроенным участником `webFetchProviders`,
  который настраивается в разделе
  `plugins.entries.firecrawl.config.webFetch.*`

Когда вы выбираете **Kimi** в процессе `openclaw onboard` или
`openclaw configure --section web`, OpenClaw также может запросить:

- регион API Moonshot (`https://api.moonshot.ai/v1` или `https://api.moonshot.cn/v1`)
- модель веб-поиска Kimi по умолчанию (по умолчанию `kimi-k2.6`)

Для `x_search` настройте `plugins.entries.xai.config.xSearch.*`. Он использует
тот же профиль аутентификации xAI, что и чат, либо учётные данные `XAI_API_KEY` / веб-поиска плагина,
используемые веб-поиском Grok.
Устаревшая конфигурация `tools.web.x_search.*` автоматически переносится командой `openclaw doctor --fix`.
Когда вы выбираете Grok в процессе `openclaw onboard` или `openclaw configure --section web`,
OpenClaw также предлагает необязательную настройку `x_search` с теми же учётными данными сразу
после завершения настройки Grok. Это отдельный последующий шаг в рамках пути Grok,
а не отдельный вариант провайдера веб-поиска верхнего уровня. Если вы выберете другого
провайдера, OpenClaw не покажет запрос `x_search`.

### Хранение ключей API

<Tabs>
  <Tab title="Файл конфигурации">
    Выполните `openclaw configure --section web` или задайте ключ напрямую:

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
  <Tab title="Переменная окружения">
    Задайте переменную окружения провайдера в окружении процесса Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Для установки Gateway поместите её в `~/.openclaw/.env`.
    См. [Переменные окружения](/ru/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Параметры инструмента

| Параметр              | Описание                                                           |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | Поисковый запрос (обязательно)                                     |
| `count`               | Количество возвращаемых результатов (1-10, по умолчанию: 5)        |
| `country`             | 2-буквенный код страны ISO (например, "US", "DE")                   |
| `language`            | Код языка ISO 639-1 (например, "en", "de")                          |
| `search_lang`         | Код языка поиска (только Brave)                                    |
| `freshness`           | Фильтр времени: `day`, `week`, `month` или `year`                   |
| `date_after`          | Результаты после этой даты (YYYY-MM-DD)                             |
| `date_before`         | Результаты до этой даты (YYYY-MM-DD)                                |
| `ui_lang`             | Код языка интерфейса (только Brave)                                |
| `domain_filter`       | Массив разрешённых/запрещённых доменов (только Perplexity)         |
| `max_tokens`          | Общий бюджет токенов содержимого, только нативный Perplexity Search API |
| `max_tokens_per_page` | Ограничение токенов извлечения для одной страницы, только нативный Perplexity Search API |

<Warning>
  Не все параметры работают со всеми провайдерами. Режим Brave `llm-context`
  отклоняет `ui_lang`; для `date_before` также требуется `date_after`, поскольку пользовательские
  диапазоны актуальности Brave требуют как начальную, так и конечную дату.
  Gemini, Grok и Kimi возвращают один синтезированный ответ с цитатами. Они
  принимают `count` для совместимости с общим инструментом, но этот параметр не изменяет
  структуру ответа с привязкой к источникам. Gemini интерпретирует актуальность `day` как указание на давность; более широкие
  значения актуальности и явные даты задают временные диапазоны привязки Google Search.
  Perplexity ведёт себя так же при использовании пути совместимости Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` или `OPENROUTER_API_KEY`); этот путь также отключает поддержку `max_tokens` и
  `max_tokens_per_page`.
  SearXNG принимает `http://` только для доверенных узлов частной сети или обратной связи;
  публичные конечные точки SearXNG должны использовать `https://`.
  Firecrawl и Tavily поддерживают только `query` и `count` через `web_search`
  -- для дополнительных параметров используйте их специализированные инструменты.
</Warning>

## x_search

`x_search` выполняет поиск по публикациям X (ранее Twitter) с помощью xAI и возвращает
ответы, синтезированные ИИ, с цитатами. Он принимает запросы на естественном языке и
необязательные структурированные фильтры. OpenClaw создаёт встроенный инструмент xAI `x_search`
для каждого запроса, а не сохраняет его постоянно зарегистрированным, поэтому он активен только
в том цикле, который действительно его вызывает.

<Warning>
  `x_search` выполняется на серверах xAI. xAI взимает $5 за 1,000 вызовов инструмента плюс
  стоимость входных и выходных токенов модели.
</Warning>

<Note>
  Согласно документации xAI, `x_search` поддерживает поиск по ключевым словам, семантический поиск, поиск
  пользователей и загрузку веток. Для статистики взаимодействий с отдельной публикацией, такой как репосты,
  ответы, закладки или просмотры, предпочтителен целевой поиск по точному URL-адресу публикации
  или идентификатору статуса. Широкий поиск по ключевым словам может найти нужную публикацию, но вернуть менее
  полные метаданные отдельной публикации. Рекомендуемый подход: сначала найдите публикацию, затем
  выполните второй запрос `x_search`, ориентированный на эту конкретную публикацию.
</Note>

### Конфигурация x_search

Если `enabled` не задан, `x_search` предоставляется только тогда, когда провайдер активной модели —
`xai` и доступны учётные данные xAI. Для активной модели с известным
провайдером, отличным от xAI, укажите для `plugins.entries.xai.config.xSearch.enabled` значение `true`, чтобы
явно разрешить межпровайдерное использование. Если провайдер активной модели отсутствует или
не определён, инструмент остаётся скрытым. Укажите для `enabled` значение `false`, чтобы отключить его для
всех провайдеров. Учётные данные xAI требуются всегда.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // обязательно для известного провайдера моделей, отличного от xAI
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // необязательно, переопределяет webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // необязательно, если настроен профиль аутентификации xAI или XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // необязательный общий базовый URL xAI Responses
          },
        },
      },
    },
  },
}
```

`x_search` отправляет запросы в `<baseUrl>/responses`, когда
задано `plugins.entries.xai.config.xSearch.baseUrl`. Если это поле не указано,
используется `plugins.entries.xai.config.webSearch.baseUrl`, затем устаревшее
`tools.web.search.grok.baseUrl` и, наконец, общедоступная конечная точка xAI
(`https://api.x.ai/v1`).

### Параметры x_search

| Параметр                     | Описание                                                    |
| ---------------------------- | ----------------------------------------------------------- |
| `query`           | Поисковый запрос (обязательно)                              |
| `allowed_x_handles`           | Ограничить результаты максимум 20 дескрипторами X           |
| `excluded_x_handles`           | Исключить максимум 20 дескрипторов X                        |
| `from_date`           | Включать только публикации не ранее этой даты (YYYY-MM-DD)   |
| `to_date`           | Включать только публикации не позднее этой даты (YYYY-MM-DD) |
| `enable_image_understanding`           | Разрешить xAI анализировать изображения в найденных публикациях |
| `enable_video_understanding`           | Разрешить xAI анализировать видео в найденных публикациях    |

`allowed_x_handles` и `excluded_x_handles` являются взаимоисключающими.

### Пример x_search

```javascript
await x_search({
  query: "рецепты ужина",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Статистика отдельной публикации: по возможности используйте точный URL статуса или идентификатор статуса
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Примеры

```javascript
// Базовый поиск
await web_search({ query: "SDK плагинов OpenClaw" });

// Поиск для Германии
await web_search({ query: "смотреть телевидение онлайн", country: "DE", language: "de" });

// Недавние результаты (за последнюю неделю)
await web_search({ query: "разработки в области ИИ", freshness: "week" });

// Диапазон дат
await web_search({
  query: "исследования климата",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Фильтрация по доменам (только Perplexity)
await web_search({
  query: "обзоры продуктов",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Профили инструментов

Если вы используете профили инструментов или списки разрешений, добавьте `web_search`, `x_search` или `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // или: allow: ["group:web"]  (включает web_search, x_search и web_fetch)
  },
}
```

## Связанные материалы

- [Получение веб-страниц](/ru/tools/web-fetch) -- получение URL и извлечение удобного для чтения содержимого
- [Веб-браузер](/ru/tools/browser) -- полная автоматизация браузера для сайтов, активно использующих JS
- [Поиск Grok](/ru/tools/grok-search) -- Grok в качестве провайдера `web_search`
- [Веб-поиск Ollama](/ru/tools/ollama-search) -- веб-поиск без ключа через ваш хост Ollama
