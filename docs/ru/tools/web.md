---
read_when:
    - Вы хотите включить или настроить web_search
    - Вы хотите включить или настроить x_search
    - Вам нужно выбрать поискового провайдера
    - Вы хотите разобраться в автоматическом обнаружении и выборе провайдера
sidebarTitle: Web Search
summary: web_search, x_search и web_fetch — поиск в интернете, поиск публикаций в X или получение содержимого страницы
title: Веб-поиск
x-i18n:
    generated_at: "2026-07-12T11:58:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` выполняет поиск в интернете с помощью настроенного провайдера и возвращает
нормализованные результаты, кэшируемые по запросу на 15 минут (настраивается). OpenClaw
также включает `x_search` для поиска публикаций в X (ранее Twitter) и `web_fetch` для
упрощённого получения данных по URL. `web_fetch` всегда выполняется локально; `web_search`
направляет запросы через xAI Responses, когда провайдером выбран Grok, а `x_search` всегда
использует xAI Responses.

<Info>
  `web_search` — это упрощённый HTTP-инструмент, а не средство автоматизации браузера. Для
  сайтов, активно использующих JS, или входа в учётную запись используйте [веб-браузер](/ru/tools/browser). Для
  получения данных по конкретному URL используйте [Web Fetch](/ru/tools/web-fetch).
</Info>

## Быстрый старт

<Steps>
  <Step title="Выберите провайдера">
    Выберите провайдера и выполните необходимую настройку. Некоторые провайдеры
    не требуют ключа, другим нужен ключ API. Подробности приведены ниже на
    страницах провайдеров.
  </Step>
  <Step title="Настройте">
    ```bash
    openclaw configure --section web
    ```
    Команда сохраняет провайдера и необходимые учётные данные. Для провайдеров,
    использующих API, вместо этого можно задать переменную окружения провайдера
    (например, `BRAVE_API_KEY`) и пропустить этот шаг.
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
    Синтезированные ИИ ответы на основе источников через вашу учётную запись сервера приложений Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ru/tools/duckduckgo-search">
    Провайдер без ключа. Ключ API не требуется. Неофициальная интеграция на основе HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ru/tools/exa-search">
    Нейронный поиск и поиск по ключевым словам с извлечением содержимого (выделенные фрагменты, текст, сводки).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ru/tools/firecrawl">
    Структурированные результаты. Для глубокого извлечения лучше всего использовать вместе с `firecrawl_search` и `firecrawl_scrape`.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ru/tools/gemini-search">
    Синтезированные ИИ ответы с цитатами и привязкой к результатам Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/ru/tools/grok-search">
    Синтезированные ИИ ответы с цитатами и привязкой к веб-источникам через xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/ru/tools/kimi-search">
    Синтезированные ИИ ответы с цитатами через веб-поиск Moonshot; резервные ответы чата без привязки к источникам завершаются явной ошибкой.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ru/tools/minimax-search">
    Структурированные результаты через API поиска MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ru/tools/ollama-search">
    Поиск через локальный хост Ollama с выполненным входом или размещённый API Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/ru/tools/parallel-search">
    Платный API Parallel Search (`PARALLEL_API_KEY`); повышенные ограничения частоты запросов и настройка под целевые задачи.
  </Card>
  <Card title="Parallel Search (бесплатно)" icon="layer-group" href="/ru/tools/parallel-search">
    Подключаемый вариант без ключа. Бесплатный Search MCP от Parallel с плотными фрагментами, оптимизированными для LLM, без ключа API.
  </Card>
  <Card title="Perplexity" icon="search" href="/ru/tools/perplexity-search">
    Структурированные результаты с настройками извлечения содержимого и фильтрацией по доменам.
  </Card>
  <Card title="SearXNG" icon="server" href="/ru/tools/searxng-search">
    Самостоятельно размещаемый метапоиск. Ключ API не требуется. Объединяет Google, Bing, DuckDuckGo и другие системы.
  </Card>
  <Card title="Tavily" icon="globe" href="/ru/tools/tavily">
    Структурированные результаты с настройкой глубины поиска, фильтрацией по темам и `tavily_extract` для извлечения данных по URL.
  </Card>
</CardGroup>

### Сравнение провайдеров

| Провайдер                                        | Вид результатов                                                | Фильтры                                          | Ключ API                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ru/tools/brave-search)                     | Структурированные фрагменты                                    | Страна, язык, время, режим `llm-context`          | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/ru/plugins/codex-harness)    | Синтезированные ИИ ответы + URL источников                     | Домены, размер контекста, местоположение пользователя | Не требуется; используется вход в Codex/OpenAI                                      |
| [DuckDuckGo](/ru/tools/duckduckgo-search)           | Структурированные фрагменты                                    | --                                               | Не требуется (без ключа)                                                                |
| [Exa](/ru/tools/exa-search)                         | Структурированные + извлечённые данные                         | Нейронный режим/ключевые слова, дата, извлечение содержимого | `EXA_API_KEY`                                                                   |
| [Firecrawl](/ru/tools/firecrawl)                    | Структурированные фрагменты                                    | Через инструмент `firecrawl_search`               | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ru/tools/gemini-search)                   | Синтезированные ИИ ответы + цитаты                             | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ru/tools/grok-search)                       | Синтезированные ИИ ответы + цитаты                             | --                                               | OAuth xAI, `XAI_API_KEY` или `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/ru/tools/kimi-search)                       | Синтезированные ИИ ответы + цитаты; ошибка при резервных ответах чата без привязки к источникам | --                         | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ru/tools/minimax-search)          | Структурированные фрагменты                                    | Регион (`global` / `cn`)                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ru/tools/ollama-search)        | Структурированные фрагменты                                    | --                                               | Не требуется для локальных хостов с выполненным входом; `OLLAMA_API_KEY` для прямого поиска через `https://ollama.com` |
| [Parallel](/ru/tools/parallel-search)               | Плотные фрагменты, ранжированные для контекста LLM             | --                                               | `PARALLEL_API_KEY` (платный)                                                             |
| [Parallel Search (бесплатно)](/ru/tools/parallel-search) | Плотные фрагменты, ранжированные для контекста LLM         | --                                               | Не требуется (бесплатный Search MCP)                                                     |
| [Perplexity](/ru/tools/perplexity-search)           | Структурированные фрагменты                                    | Страна, язык, время, домены, ограничения содержимого | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                          |
| [SearXNG](/ru/tools/searxng-search)                 | Структурированные фрагменты                                    | Категории, язык                                  | Не требуется (самостоятельное размещение)                                               |
| [Tavily](/ru/tools/tavily)                          | Структурированные фрагменты                                    | Через инструмент `tavily_search`                  | `TAVILY_API_KEY`                                                                        |

## Автоматическое определение

Списки провайдеров в документации и процессах настройки упорядочены по алфавиту. Для автоматического определения
используется отдельный фиксированный порядок приоритета; провайдер, которому нужны
учётные данные (`requiresCredential !== false`), выбирается только при наличии настроенных данных. Если
`provider` не задан, OpenClaw проверяет провайдеров в следующем порядке и использует
первый готовый:

Сначала провайдеры на основе API:

1. **Brave** -- `BRAVE_API_KEY` или `plugins.entries.brave.config.webSearch.apiKey` (порядок 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` или `plugins.entries.minimax.config.webSearch.apiKey` (порядок 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` или `models.providers.google.apiKey` (порядок 20)
4. **Grok** -- OAuth xAI, `XAI_API_KEY` или `plugins.entries.xai.config.webSearch.apiKey` (порядок 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` или `plugins.entries.moonshot.config.webSearch.apiKey` (порядок 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` или `plugins.entries.perplexity.config.webSearch.apiKey` (порядок 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` или `plugins.entries.firecrawl.config.webSearch.apiKey` (порядок 60)
8. **Exa** -- `EXA_API_KEY` или `plugins.entries.exa.config.webSearch.apiKey`; необязательный параметр `plugins.entries.exa.config.webSearch.baseUrl` переопределяет конечную точку Exa (порядок 65)
9. **Tavily** -- `TAVILY_API_KEY` или `plugins.entries.tavily.config.webSearch.apiKey` (порядок 70)
10. **Parallel** -- платный API Parallel Search через `PARALLEL_API_KEY` или `plugins.entries.parallel.config.webSearch.apiKey`; необязательный параметр `plugins.entries.parallel.config.webSearch.baseUrl` переопределяет конечную точку (порядок 75)

Затем провайдеры с настроенной конечной точкой:

11. **SearXNG** -- `SEARXNG_BASE_URL` или `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Провайдеры без ключа, такие как **Parallel Search (бесплатно)**, **DuckDuckGo**,
**Ollama Web Search** и **Codex Hosted Search**, никогда не выбираются автоматически,
даже если у них есть внутреннее значение порядка. Они используются, только когда вы
явно выбираете их с помощью `tools.web.search.provider` или через
`openclaw configure --section web`. OpenClaw не отправляет управляемые
запросы `web_search` провайдеру без ключа только потому, что ни один провайдер
на основе API не настроен.

Модели OpenAI Responses являются исключением: пока `tools.web.search.provider`
не задан, они используют встроенный веб-поиск OpenAI вместо перечисленных выше
управляемых провайдеров (см. ниже). Задайте для `tools.web.search.provider`
значение `parallel-free` (или другого провайдера), чтобы вместо этого направлять их
через управляемый путь.

<Note>
  Все поля ключей провайдеров поддерживают объекты SecretRef. SecretRef в области Plugin,
  заданные в `plugins.entries.<plugin>.config.webSearch.apiKey`, разрешаются для
  установленных провайдеров веб-поиска на основе API, включая Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity и Tavily,
  независимо от того, выбран ли провайдер явно через `tools.web.search.provider` или
  определён автоматически. В режиме автоматического определения OpenClaw разрешает только
  ключ выбранного провайдера — невыбранные SecretRef остаются неактивными, поэтому можно
  настроить несколько провайдеров без затрат на разрешение ключей тех,
  которые не используются.
</Note>

## Встроенный веб-поиск OpenAI

Модели прямого доступа OpenAI Responses (`api: "openai-responses"`, провайдер `openai`,
без базового URL или с официальным базовым URL API OpenAI) автоматически используют
размещённый в OpenAI инструмент `web_search`, когда веб-поиск OpenClaw включён и
управляемый провайдер не закреплён. Это поведение принадлежит провайдеру в комплектном
плагине OpenAI и не применяется к базовым URL OpenAI-совместимых прокси или маршрутам
Azure. Установите для `tools.web.search.provider` другой провайдер, например `brave`,
чтобы сохранить управляемый инструмент `web_search` для моделей OpenAI, либо установите
`tools.web.search.enabled: false`, чтобы отключить как управляемый поиск, так и
встроенный поиск OpenAI.

## Встроенный веб-поиск Codex

Среда выполнения app-server Codex автоматически использует размещённый в Codex
инструмент `web_search`, когда веб-поиск включён и управляемый провайдер не выбран.
Встроенный размещённый поиск и динамический управляемый инструмент `web_search`
OpenClaw взаимоисключающие, поэтому управляемый поиск не может обойти ограничения
встроенного поиска по доменам. OpenClaw использует управляемый инструмент, когда
размещённый поиск недоступен, явно отключён или заменён выбранным управляемым
провайдером. OpenClaw оставляет автономное расширение Codex `web.run` отключённым
(`features.standalone_web_search: false`), поскольку рабочий трафик app-server
отклоняет определённое пользователем пространство имён `web`.

- Настройте встроенный поиск в `tools.web.search.openaiCodex`
- Установите `tools.web.search.provider: "codex"`, чтобы предоставить Codex Hosted Search
  как управляемый провайдер `web_search` для любой родительской модели. Каждый вызов
  выполняет ограниченный эфемерный ход app-server Codex и завершается ошибкой, если
  Codex не выдаёт размещённый элемент `webSearch`.
- `mode: "cached"` — предпочтение по умолчанию, но Codex преобразует его в оперативный
  внешний доступ для неограниченных ходов app-server; установите `"live"`, чтобы
  явно запросить оперативный доступ
- Установите для `tools.web.search.provider` управляемый провайдер, например `brave`,
  чтобы вместо этого использовать управляемый `web_search` OpenClaw
- Установите `tools.web.search.openaiCodex.enabled: false`, чтобы отказаться от
  размещённого в Codex поиска; другие управляемые провайдеры останутся доступны
- Ограничение поверхности встроенных инструментов Codex также сохраняет доступность
  управляемого `web_search`
- Если задан `allowedDomains`, автоматический переход на управляемый поиск при
  недоступности размещённого поиска завершается отказом, чтобы встроенный список
  разрешённых доменов нельзя было обойти
- Запуски только с LLM и отключёнными инструментами отключают как встроенный, так и
  управляемый поиск
- `tools.web.search.enabled: false` отключает как управляемый, так и встроенный поиск

Постоянные изменения действующей политики поиска Codex создают новый привязанный
поток, чтобы уже загруженный поток app-server не сохранял устаревший доступ к
размещённому поиску. Временные ограничения для отдельного хода используют временный
ограниченный поток и сохраняют существующую привязку для последующего возобновления.

Трафик прямого доступа OpenAI ChatGPT Responses также может использовать размещённый
в OpenAI инструмент `web_search`. Этот отдельный путь по-прежнему включается явно
через `tools.web.search.openaiCodex.enabled: true` и применяется только к подходящим
моделям `openai/*`, использующим `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Необязательно: использовать Codex Hosted Search и из родительских моделей, отличных от Codex.
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

Для сред выполнения и провайдеров, не поддерживающих встроенный поиск Codex, Codex
может использовать резервный управляемый `web_search` через пространство динамических
инструментов OpenClaw. Используйте явно указанный управляемый провайдер, когда вместо
размещённого в Codex поиска вам нужны провайдер-специфичные средства управления сетью
OpenClaw.

Выбор `provider: "codex"` включает комплектный плагин `codex` и использует те же
ограничения `tools.web.search.openaiCodex`, которые показаны выше. Сначала выполните
аутентификацию app-server Codex командой `openclaw models auth login --provider openai`.
Родительский агент может использовать любую модель или среду выполнения; через Codex
работает только ограниченный поисковый исполнитель.

## Безопасность сети

Вызовы управляемых HTTP-провайдеров `web_search` используют защищённый путь получения
данных OpenClaw, ограниченный собственным именем хоста текущего провайдера. Только для
этого имени хоста OpenClaw разрешает поддельные DNS-ответы IP от Surge, Clash и
sing-box в диапазонах `198.18.0.0/15` и `fc00::/7`. Другие частные адреса, local loopback,
локальные адреса канала и адреса метаданных остаются заблокированными. Codex Hosted Search
является исключением: его ограниченный исполнитель делегирует сетевой доступ
размещённому инструменту `web_search` app-server Codex.

Это автоматическое разрешение не применяется к произвольным URL `web_fetch`. Для
`web_fetch` явно включайте `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` и
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` только в том случае, если ваш
доверенный прокси владеет этими синтетическими диапазонами.

## Конфигурация

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // по умолчанию: true
        provider: "brave", // или опустите для автоматического обнаружения
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Конфигурация конкретного провайдера (ключи API, базовые URL, режимы) находится в
`plugins.entries.<plugin>.config.webSearch.*`. Gemini также может повторно использовать
`models.providers.google.apiKey` и `models.providers.google.baseUrl` как резервные
варианты с более низким приоритетом после специальной конфигурации веб-поиска и
`GEMINI_API_KEY`. Примеры см. на страницах провайдеров.
Grok также может повторно использовать профиль аутентификации xAI OAuth, созданный
командой `openclaw models auth login --provider xai --method oauth`; конфигурация с
ключом API остаётся резервным вариантом.

Значение `tools.web.search.provider` проверяется по идентификаторам провайдеров
веб-поиска, объявленным в манифестах комплектных и установленных плагинов. Опечатка,
например `"brvae"`, приводит к ошибке проверки конфигурации вместо неявного перехода
к автоматическому обнаружению. Если для настроенного провайдера имеются только
устаревшие сведения о плагине, например оставшийся блок
`plugins.entries.<plugin>` после удаления стороннего плагина, OpenClaw сохраняет
устойчивость запуска и сообщает предупреждение, чтобы вы могли переустановить плагин
или запустить `openclaw doctor --fix` для очистки устаревшей конфигурации.

Выбор резервного провайдера `web_fetch` выполняется отдельно:

- выберите его с помощью `tools.web.fetch.provider`
- либо опустите это поле и позвольте OpenClaw автоматически обнаружить первого
  готового провайдера web-fetch по настроенным учётным данным
- `web_fetch` вне песочницы может использовать провайдеры установленных плагинов,
  объявляющих `contracts.webFetchProviders`; запросы в песочнице допускают комплектные
  провайдеры и проверенные установки официальных плагинов, но исключают внешние
  сторонние плагины
- официальный плагин Firecrawl на данный момент является единственным комплектным
  поставщиком `webFetchProviders` и настраивается в
  `plugins.entries.firecrawl.config.webFetch.*`

Если во время `openclaw onboard` или `openclaw configure --section web` вы выберете
**Kimi**, OpenClaw также может запросить:

- регион API Moonshot (`https://api.moonshot.ai/v1` или `https://api.moonshot.cn/v1`)
- модель веб-поиска Kimi по умолчанию (по умолчанию `kimi-k2.6`)

Для `x_search` настройте `plugins.entries.xai.config.xSearch.*`. Он использует тот же
профиль аутентификации xAI, что и чат, либо `XAI_API_KEY` / учётные данные веб-поиска
плагина, используемые веб-поиском Grok.
Устаревшая конфигурация `tools.web.x_search.*` автоматически переносится командой
`openclaw doctor --fix`.
Если во время `openclaw onboard` или `openclaw configure --section web` вы выберете
Grok, OpenClaw также предложит необязательную настройку `x_search` с теми же учётными
данными сразу после завершения настройки Grok. Это отдельный последующий шаг внутри
пути Grok, а не отдельный выбор провайдера веб-поиска верхнего уровня. Если вы выберете
другого провайдера, OpenClaw не покажет запрос `x_search`.

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
| `count`               | Количество возвращаемых результатов (1–10, по умолчанию: 5)        |
| `country`             | Двухбуквенный код страны ISO (например, "US", "DE")                 |
| `language`            | Код языка ISO 639-1 (например, "en", "de")                          |
| `search_lang`         | Код языка поиска (только Brave)                                    |
| `freshness`           | Фильтр времени: `day`, `week`, `month` или `year`                  |
| `date_after`          | Результаты после этой даты (ГГГГ-ММ-ДД)                            |
| `date_before`         | Результаты до этой даты (ГГГГ-ММ-ДД)                               |
| `ui_lang`             | Код языка интерфейса (только Brave)                                |
| `domain_filter`       | Массив разрешённых/запрещённых доменов (только Perplexity)         |
| `max_tokens`          | Общий бюджет токенов содержимого, только собственный API Perplexity Search |
| `max_tokens_per_page` | Ограничение токенов извлечения на страницу, только собственный API Perplexity Search |

<Warning>
  Не все параметры работают со всеми провайдерами. Режим Brave `llm-context`
  отклоняет `ui_lang`; для `date_before` также требуется `date_after`, поскольку
  пользовательские диапазоны актуальности Brave требуют обе даты — начальную и
  конечную.
  Gemini, Grok и Kimi возвращают один синтезированный ответ с цитатами. Они
  принимают `count` для совместимости с общим инструментом, но этот параметр не
  изменяет структуру обоснованного ответа. Gemini рассматривает актуальность `day`
  как подсказку о давности; более широкие значения актуальности и явные даты
  задают временные диапазоны для обоснования через Google Search.
  Perplexity ведёт себя так же при использовании пути совместимости
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` или `OPENROUTER_API_KEY`); этот путь также не поддерживает `max_tokens`
  и `max_tokens_per_page`.
  SearXNG принимает `http://` только для доверенных хостов частной сети или
  local loopback; общедоступные конечные точки SearXNG должны использовать `https://`.
  Firecrawl и Tavily через `web_search` поддерживают только `query` и `count`
  — для расширенных параметров используйте их специальные инструменты.
</Warning>

## x_search

`x_search` выполняет поиск публикаций X (ранее Twitter) с помощью xAI и возвращает
синтезированные ИИ ответы с цитатами. Он принимает запросы на естественном языке и
необязательные структурированные фильтры. OpenClaw создаёт встроенный инструмент xAI
`x_search` для каждого запроса, а не держит его постоянно зарегистрированным, поэтому
он активен только в том ходе, который действительно его вызывает.

<Warning>
  `x_search` выполняется на серверах xAI. xAI взимает 5 долларов за 1 000 вызовов
  инструмента, а также плату за входные и выходные токены модели.
</Warning>

<Note>
  Согласно документации xAI, `x_search` поддерживает поиск по ключевым словам,
  семантический поиск, поиск пользователей и получение веток обсуждений. Для
  статистики взаимодействия с отдельной публикацией, например числа репостов,
  ответов, закладок или просмотров, предпочтителен целевой поиск по точному URL
  публикации или идентификатору статуса. Широкий поиск по ключевым словам может
  найти нужную публикацию, но вернуть менее полные метаданные отдельной публикации.
  Рекомендуемый подход: сначала найдите публикацию, затем выполните второй запрос
  `x_search`, ориентированный на эту конкретную публикацию.
</Note>

### Конфигурация x_search

Если параметр `enabled` не указан, `x_search` доступен только тогда, когда провайдер активной модели — `xai` и учетные данные xAI успешно определены. Для активной модели с известным провайдером, отличным от xAI, задайте для `plugins.entries.xai.config.xSearch.enabled` значение `true`, чтобы разрешить использование с другими провайдерами. Если провайдер активной модели отсутствует или не определен, инструмент остается скрытым. Задайте для `enabled` значение `false`, чтобы отключить его для всех провайдеров. Учетные данные xAI требуются всегда.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // требуется для известного провайдера модели, отличного от xAI
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // необязательно, переопределяет webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // необязательно, если задан профиль аутентификации xAI или XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // необязательный общий базовый URL xAI Responses
          },
        },
      },
    },
  },
}
```

`x_search` отправляет POST-запрос на `<baseUrl>/responses`, если задано
`plugins.entries.xai.config.xSearch.baseUrl`. Если это поле не указано,
используется `plugins.entries.xai.config.webSearch.baseUrl`, затем устаревший
`tools.web.search.grok.baseUrl` и, наконец, общедоступная конечная точка xAI
(`https://api.x.ai/v1`).

### Параметры x_search

| Параметр                     | Описание                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| `query`                      | Поисковый запрос (обязательно)                               |
| `allowed_x_handles`          | Ограничить результаты максимум 20 идентификаторами X         |
| `excluded_x_handles`         | Исключить максимум 20 идентификаторов X                      |
| `from_date`                  | Включать только публикации, сделанные в эту дату или позднее (YYYY-MM-DD) |
| `to_date`                    | Включать только публикации, сделанные в эту дату или ранее (YYYY-MM-DD) |
| `enable_image_understanding` | Разрешить xAI анализировать изображения в найденных публикациях |
| `enable_video_understanding` | Разрешить xAI анализировать видео в найденных публикациях    |

`allowed_x_handles` и `excluded_x_handles` являются взаимоисключающими.

### Пример x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Статистика отдельной публикации: по возможности используйте точный URL или идентификатор статуса
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Примеры

```javascript
// Базовый поиск
await web_search({ query: "OpenClaw plugin SDK" });

// Поиск по немецким источникам
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Недавние результаты (за последнюю неделю)
await web_search({ query: "AI developments", freshness: "week" });

// Диапазон дат
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Фильтрация по доменам (только Perplexity)
await web_search({
  query: "product reviews",
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

- [Получение веб-страниц](/ru/tools/web-fetch) -- получение данных по URL и извлечение содержимого в удобном для чтения виде
- [Веб-браузер](/ru/tools/browser) -- полная автоматизация браузера для сайтов, активно использующих JS
- [Поиск Grok](/ru/tools/grok-search) -- Grok в качестве провайдера `web_search`
- [Веб-поиск Ollama](/ru/tools/ollama-search) -- веб-поиск без ключа через ваш хост Ollama
