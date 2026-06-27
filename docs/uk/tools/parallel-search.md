---
read_when:
    - Вам потрібен вебпошук без API-ключа
    - Вам потрібен платний Search API від Parallel
    - Вам потрібні щільні уривки, ранжовані за ефективністю контексту LLM
summary: Паралельний пошук -- щільні уривки з вебджерел, оптимізовані для LLM
title: Паралельний пошук
x-i18n:
    generated_at: "2026-06-27T18:28:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Plugin Parallel надає два провайдери `web_search` для [Parallel](https://parallel.ai/):

- **Parallel Search (Free)** (`parallel-free`) -- безкоштовний
  [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) від Parallel. Не потребує
  облікового запису або API-ключа. Вибирайте його явно, коли потрібен розміщений у Parallel
  шлях пошуку без ключа.
- **Parallel Search** (`parallel`) -- платний Search API від Parallel. Потребує
  `PARALLEL_API_KEY` і пропонує вищі ліміти частоти та налаштування цілі.

Обидва повертають ранжовані, оптимізовані для LLM уривки з вебіндексу, створеного для AI-агентів.
Установіть `tools.web.search.provider` на `parallel-free` або `parallel`, щоб явно
вибрати один із них.

<Note>
  Моделі OpenAI Responses використовують нативний вебпошук OpenAI, коли
  `tools.web.search.provider` не задано, тому вони обходять провайдери Parallel.
  Установіть `tools.web.search.provider` на `parallel-free` або `parallel`, щоб спрямувати їх
  через Parallel.
</Note>

## Встановлення Plugin

Встановіть офіційний Plugin, потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API-ключ (платний провайдер)

`parallel-free` не потребує API-ключа, але його все одно потрібно вибрати як
керований провайдер. Платному провайдеру `parallel` потрібен API-ключ:

<Steps>
  <Step title="Create an account">
    Зареєструйтеся на [platform.parallel.ai](https://platform.parallel.ai) і
    згенеруйте API-ключ у своїй панелі керування.
  </Step>
  <Step title="Store the key">
    Установіть `PARALLEL_API_KEY` у середовищі Gateway або налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Конфігурація

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

**Альтернатива через середовище:** установіть `PARALLEL_API_KEY` у середовищі Gateway.
Для встановлення gateway розмістіть його в `~/.openclaw/.env`.

## Перевизначення базової URL-адреси

Перевизначення базової URL-адреси застосовується лише до платного провайдера `parallel`. Безкоштовний
провайдер `parallel-free` завжди використовує `https://search.parallel.ai/mcp`.

Установіть `plugins.entries.parallel.config.webSearch.baseUrl`, коли запити Parallel
мають проходити через сумісний проксі або альтернативну кінцеву точку Parallel (наприклад,
Cloudflare AI Gateway). OpenClaw нормалізує голі хости, додаючи
`https://` на початок, і додає `/v1/search`, якщо шлях ще не закінчується
так. Розв’язана кінцева точка включається до ключа кешу пошуку, тому результати
з різних кінцевих точок Parallel не спільно використовуються.

## Параметри інструмента

OpenClaw надає нативну форму пошуку Parallel, щоб модель могла заповнити і
ціль природною мовою, і кілька коротких ключових запитів — поєднання, яке
Parallel [рекомендує](https://docs.parallel.ai/search/best-practices) для
найкращих результатів.

<ParamField path="objective" type="string" required>
Опис базового запитання або цілі природною мовою (максимум 5000
символів). Має бути самодостатнім.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Стислі ключові пошукові запити, по 3-6 слів кожен (1-5 записів, максимум 200 символів
кожен). Надайте 2-3 різноманітні запити для найкращих результатів.
</ParamField>

<ParamField path="count" type="number">
Кількість результатів для повернення (1-40).
</ParamField>

<ParamField path="session_id" type="string">
Необов’язковий ідентифікатор сесії Parallel (максимум 1000 символів для `parallel`; безкоштовний
Search MCP `parallel-free` обмежує його до 100). Передавайте `sessionId` із попереднього
результату Parallel у подальших пошуках, що є частиною того самого завдання, щоб Parallel
міг групувати пов’язані виклики та покращувати наступні результати. Ідентифікатор, що перевищує
ліміт, відкидається, і генерується новий.
</ParamField>

<ParamField path="client_model" type="string">
Необов’язковий ідентифікатор моделі, яка виконує виклик (наприклад, `claude-opus-4-7`,
`gpt-5.5`). Дає Parallel змогу адаптувати стандартні налаштування до можливостей
вашої моделі. Передавайте точний slug активної моделі; не скорочуйте його до
псевдоніма сімейства.
</ParamField>

## Примітки

- Parallel ранжує та стискає результати на основі корисності для міркування LLM, а не
  людських переходів за кліками; очікуйте щільних уривків у кожному результаті замість
  вмісту повної сторінки
- Уривки результатів повертаються як масив `excerpts` і також об’єднуються в
  поле `description` для сумісності із загальним контрактом `web_search`
- Parallel повертає `session_id` у кожній відповіді; OpenClaw надає його як
  `sessionId` у payload інструмента, щоб викликачі могли групувати подальші пошуки
- `searchId`, `warnings` і `usage` від Parallel передаються далі, коли
  вони присутні
- OpenClaw завжди передає розв’язану кількість результатів до Parallel як
  `advanced_settings.max_results`. Аргумент `count` викликача має пріоритет, потім
  налаштування верхнього рівня `tools.web.search.maxResults`, інакше використовується
  стандартне значення OpenClaw для загального `web_search` (5). Це підтримує узгоджений обсяг
  результатів під час перемикання між провайдерами; сам Parallel за замовчуванням використовує 10
- Результати кешуються за замовчуванням на 15 хвилин (налаштовується через
  `cacheTtlMinutes`)
- Безкоштовний провайдер `parallel-free` приймає ті самі параметри. Він застосовує
  `count` на стороні клієнта та генерує `session_id` для кожного виклику, якщо його не
  надано.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери й автоматичне виявлення
- [Пошук Exa](/uk/tools/exa-search) -- нейронний пошук із витягненням вмісту
- [Пошук Perplexity](/uk/tools/perplexity-search) -- структуровані результати з фільтрацією доменів
