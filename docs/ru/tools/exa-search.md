---
read_when:
    - Вы хотите использовать Exa для web_search
    - Вам нужен EXA_API_KEY
    - Вам нужен нейронный поиск или извлечение содержимого
summary: Поиск Exa AI — нейросетевой поиск и поиск по ключевым словам с извлечением содержимого
title: Поиск Exa
x-i18n:
    generated_at: "2026-07-13T20:20:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) — провайдер `web_search` с нейронным, ключевым и
гибридным режимами поиска, а также встроенным извлечением содержимого (выделенные фрагменты, текст,
сводки).

## Установка плагина

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Получение ключа API

<Steps>
  <Step title="Создание учётной записи">
    Зарегистрируйтесь на [exa.ai](https://exa.ai/) и создайте ключ API в своей
    панели управления.
  </Step>
  <Step title="Сохранение ключа">
    Задайте `EXA_API_KEY` в окружении Gateway или настройте его с помощью:

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // необязательно, если задан EXA_API_KEY
            baseUrl: "https://api.exa.ai", // необязательно; OpenClaw добавляет /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Альтернатива через переменную окружения:** задайте `EXA_API_KEY` в окружении Gateway. При
установке Gateway поместите её в `~/.openclaw/.env`. См.
[Переменные окружения](/ru/help/faq#env-vars-and-env-loading).

## Переопределение базового URL

Задайте `plugins.entries.exa.config.webSearch.baseUrl`, чтобы направлять поисковые
запросы Exa через совместимый прокси-сервер или альтернативную конечную точку. OpenClaw
нормализует адреса без схемы, добавляя в начало `https://`, и добавляет `/search`, если
путь ещё не оканчивается на него. Разрешённая конечная точка входит в ключ
кеша поиска, поэтому результаты от разных конечных точек никогда не используются совместно.

## Параметры инструмента

<ParamField path="query" type="string" required>
Поисковый запрос.
</ParamField>

<ParamField path="count" type="number" default="5">
Количество возвращаемых результатов (1–100, с учётом ограничений типа поиска Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Режим поиска.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Фильтр по времени. Нельзя использовать вместе с `date_after`/`date_before`.
</ParamField>

<ParamField path="date_after" type="string">
Результаты после этой даты (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Результаты до этой даты (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Параметры извлечения содержимого (см. ниже).
</ParamField>

### Извлечение содержимого

Передайте объект `contents`, чтобы управлять извлекаемым содержимым результатов:

```javascript
await web_search({
  query: "объяснение архитектуры трансформера",
  type: "neural",
  contents: {
    text: true, // полный текст страницы
    highlights: { numSentences: 3 }, // ключевые предложения
    summary: true, // сводка, созданная ИИ
  },
});
```

| Параметр содержимого | Тип                                                                   | Описание                       |
| -------------------- | --------------------------------------------------------------------- | ------------------------------ |
| `text`   | `boolean \| { maxCharacters }`                                                    | Извлечь полный текст страницы  |
| `highlights`   | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }`                                                    | Извлечь ключевые предложения   |
| `summary`   | `boolean \| { query }`                                                    | Сводка, созданная ИИ           |

Если `contents` не указан, Exa по умолчанию использует `{ highlights: true }`, поэтому результаты
содержат выдержки из ключевых предложений. Описания результатов формируются сначала из выделенных
фрагментов, затем из сводки, а затем из полного текста — используется первый доступный вариант. Результаты
также сохраняют необработанные поля `highlightScores` и `summary` из ответа API Exa,
если они доступны.

### Режимы поиска

| Режим            | Описание                                      |
| ---------------- | --------------------------------------------- |
| `auto` | Exa выбирает лучший режим (по умолчанию)    |
| `neural` | Семантический поиск по смыслу                |
| `fast` | Быстрый поиск по ключевым словам             |
| `deep` | Тщательный глубокий поиск                    |
| `deep-reasoning` | Глубокий поиск с рассуждением                |
| `instant` | Самое быстрое получение результатов          |

## Примечания

- `count` принимает значения до 100 с учётом ограничений типа поиска Exa.
- По умолчанию результаты кешируются на 15 минут. Настройте общие параметры
  `tools.web.search.cacheTtlMinutes` (в минутах) и
  `tools.web.search.timeoutSeconds` (по умолчанию 30 с), чтобы изменить кеширование и
  время ожидания запросов для всех провайдеров `web_search`, включая Exa.

## См. также

- [Обзор веб-поиска](/ru/tools/web) — все провайдеры и автоматическое определение
- [Brave Search](/ru/tools/brave-search) — структурированные результаты с фильтрами по стране и языку
- [Perplexity Search](/ru/tools/perplexity-search) — структурированные результаты с фильтрацией по доменам
