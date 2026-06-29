---
read_when:
    - Вам нужен веб-поиск без ключа API
    - Вам нужен платный API поиска Parallel
    - Вам нужны плотные выдержки, ранжированные по эффективности контекста LLM
summary: Параллельный поиск -- плотные выдержки из веб-источников, оптимизированные для LLM
title: Параллельный поиск
x-i18n:
    generated_at: "2026-06-28T23:54:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Plugin Parallel предоставляет два провайдера `web_search` от [Parallel](https://parallel.ai/):

- **Parallel Search (Free)** (`parallel-free`) -- бесплатный
  [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) от Parallel. Не требует
  учетной записи или API-ключа. Выбирайте его явно, когда нужен размещенный у Parallel
  путь поиска без ключа.
- **Parallel Search** (`parallel`) -- платный Search API от Parallel. Требует
  `PARALLEL_API_KEY` и предлагает более высокие лимиты частоты запросов и настройку objective.

Оба возвращают ранжированные, оптимизированные для LLM выдержки из веб-индекса, созданного для AI-агентов.
Задайте `tools.web.search.provider` как `parallel-free` или `parallel`, чтобы выбрать один
явно.

<Note>
  Модели OpenAI Responses используют собственный веб-поиск OpenAI, когда
  `tools.web.search.provider` не задан, поэтому они обходят провайдеры Parallel.
  Задайте `tools.web.search.provider` как `parallel-free` или `parallel`, чтобы направлять их
  через Parallel.
</Note>

## Установите Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API-ключ (платный провайдер)

`parallel-free` не требует API-ключа, но его все равно нужно выбрать как
управляемый провайдер. Платному провайдеру `parallel` нужен API-ключ:

<Steps>
  <Step title="Create an account">
    Зарегистрируйтесь на [platform.parallel.ai](https://platform.parallel.ai) и
    сгенерируйте API-ключ в своей панели управления.
  </Step>
  <Step title="Store the key">
    Задайте `PARALLEL_API_KEY` в окружении Gateway или настройте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Конфигурация

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**Альтернатива через окружение:** задайте `PARALLEL_API_KEY` в окружении Gateway.
Для установки gateway поместите его в `~/.openclaw/.env`.

## Переопределение базового URL

Переопределение базового URL применяется только к платному провайдеру `parallel`. Бесплатный
провайдер `parallel-free` всегда использует `https://search.parallel.ai/mcp`.

Задайте `plugins.entries.parallel.config.webSearch.baseUrl`, когда запросы Parallel
должны проходить через совместимый прокси или альтернативную конечную точку Parallel (например,
Cloudflare AI Gateway). OpenClaw нормализует голые хосты, добавляя
`https://`, и добавляет `/v1/search`, если путь еще не заканчивается
так. Разрешенная конечная точка включается в ключ кеша поиска, поэтому результаты
из разных конечных точек Parallel не смешиваются.

## Параметры инструмента

OpenClaw предоставляет нативную форму поиска Parallel, чтобы модель могла заполнить и
цель на естественном языке, и несколько коротких ключевых запросов — это сочетание
Parallel [рекомендует](https://docs.parallel.ai/search/best-practices) для
лучших результатов.

<ParamField path="objective" type="string" required>
Описание базового вопроса или цели на естественном языке (максимум 5000
символов). Должно быть самодостаточным.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Краткие ключевые поисковые запросы, по 3-6 слов каждый (1-5 элементов, максимум 200 символов
каждый). Для лучших результатов укажите 2-3 разнообразных запроса.
</ParamField>

<ParamField path="count" type="number">
Количество возвращаемых результатов (1-40).
</ParamField>

<ParamField path="session_id" type="string">
Необязательный идентификатор сессии Parallel (максимум 1000 символов для `parallel`; бесплатный
Search MCP `parallel-free` ограничивает его 100). Передавайте `sessionId` из предыдущего
результата Parallel в последующих поисках, относящихся к той же задаче, чтобы Parallel
мог группировать связанные вызовы и улучшать последующие результаты. Идентификатор сверх лимита
отбрасывается, и генерируется новый.
</ParamField>

<ParamField path="client_model" type="string">
Необязательный идентификатор модели, выполняющей вызов (например, `claude-opus-4-7`,
`gpt-5.5`). Позволяет Parallel адаптировать настройки по умолчанию под
возможности вашей модели. Передавайте точный slug активной модели; не сокращайте его до
псевдонима семейства.
</ParamField>

## Примечания

- Parallel ранжирует и сжимает результаты на основе полезности для рассуждений LLM, а не
  переходов пользователей; ожидайте плотные выдержки в каждом результате, а не
  содержимое полных страниц
- Выдержки результатов возвращаются как массив `excerpts` и также объединяются в
  поле `description` для совместимости с общим контрактом `web_search`
- Parallel возвращает `session_id` в каждом ответе; OpenClaw показывает его как
  `sessionId` в полезной нагрузке инструмента, чтобы вызывающие стороны могли группировать последующие поиски
- `searchId`, `warnings` и `usage` от Parallel передаются дальше, когда
  присутствуют
- OpenClaw всегда передает разрешенное количество результатов в Parallel как
  `advanced_settings.max_results`. Аргумент вызывающей стороны `count` имеет приоритет, затем
  настройка верхнего уровня `tools.web.search.maxResults`, иначе общий
  стандарт OpenClaw для `web_search` (5). Это сохраняет согласованный объем результатов
  при переключении между провайдерами; сам Parallel по умолчанию использует 10
- Результаты по умолчанию кешируются на 15 минут (настраивается через
  `cacheTtlMinutes`)
- Бесплатный провайдер `parallel-free` принимает те же параметры. Он применяет
  `count` на стороне клиента и генерирует `session_id` для каждого вызова, если он не
  предоставлен.

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) -- все провайдеры и автоопределение
- [Поиск Exa](/ru/tools/exa-search) -- нейронный поиск с извлечением содержимого
- [Поиск Perplexity](/ru/tools/perplexity-search) -- структурированные результаты с фильтрацией по доменам
