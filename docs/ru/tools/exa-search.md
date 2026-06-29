---
read_when:
    - Вы хотите использовать Exa для web_search
    - Требуется EXA_API_KEY
    - Вам нужен нейронный поиск или извлечение контента
summary: Поиск Exa AI -- нейронный и ключевой поиск с извлечением содержимого
title: Поиск Exa
x-i18n:
    generated_at: "2026-06-28T23:51:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw поддерживает [Exa AI](https://exa.ai/) как провайдера `web_search`. Exa
предлагает нейронный, ключевой и гибридный режимы поиска со встроенным
извлечением контента (выделенные фрагменты, текст, сводки).

## Установка Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Получение API-ключа

<Steps>
  <Step title="Создайте учетную запись">
    Зарегистрируйтесь на [exa.ai](https://exa.ai/) и сгенерируйте API-ключ в
    панели управления.
  </Step>
  <Step title="Сохраните ключ">
    Задайте `EXA_API_KEY` в окружении Gateway или настройте через:

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**Альтернатива через окружение:** задайте `EXA_API_KEY` в окружении Gateway.
Для установки gateway поместите его в `~/.openclaw/.env`.

## Переопределение базового URL

Задайте `plugins.entries.exa.config.webSearch.baseUrl`, когда поисковые запросы Exa
должны проходить через совместимый прокси или альтернативный конечный узел Exa. OpenClaw
нормализует голые хосты, добавляя в начало `https://`, и добавляет `/search`, если
путь еще не заканчивается им. Разрешенный конечный узел включается в ключ кэша поиска,
поэтому результаты с разных конечных узлов Exa не используются совместно.

## Параметры инструмента

<ParamField path="query" type="string" required>
Поисковый запрос.
</ParamField>

<ParamField path="count" type="number">
Количество возвращаемых результатов (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Режим поиска.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Временной фильтр.
</ParamField>

<ParamField path="date_after" type="string">
Результаты после этой даты (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Результаты до этой даты (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Параметры извлечения контента (см. ниже).
</ParamField>

### Извлечение контента

Exa может возвращать извлеченный контент вместе с результатами поиска. Передайте объект `contents`,
чтобы включить:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Параметр contents | Тип                                                                  | Описание                       |
| --------------- | --------------------------------------------------------------------- | ---------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | Извлечь полный текст страницы  |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Извлечь ключевые предложения   |
| `summary`       | `boolean \| { query }`                                                | Сводка, созданная ИИ           |

### Режимы поиска

| Режим            | Описание                                  |
| ---------------- | --------------------------------- |
| `auto`           | Exa выбирает лучший режим (по умолчанию) |
| `neural`         | Семантический поиск / поиск по смыслу     |
| `fast`           | Быстрый поиск по ключевым словам          |
| `deep`           | Тщательный глубокий поиск                 |
| `deep-reasoning` | Глубокий поиск с рассуждением             |
| `instant`        | Самые быстрые результаты                  |

## Примечания

- Если параметр `contents` не указан, Exa по умолчанию использует `{ highlights: true }`,
  поэтому результаты включают фрагменты ключевых предложений
- Результаты сохраняют поля `highlightScores` и `summary` из ответа Exa API,
  когда они доступны
- Описания результатов определяются сначала по выделенным фрагментам, затем по сводке, затем
  по полному тексту — в зависимости от того, что доступно
- `freshness` и `date_after`/`date_before` нельзя сочетать — используйте один
  режим временной фильтрации
- За один запрос можно вернуть до 100 результатов (с учетом ограничений Exa для
  типа поиска)
- Результаты по умолчанию кэшируются на 15 минут (настраивается через
  `cacheTtlMinutes`)
- Exa — официальная интеграция API со структурированными JSON-ответами

## Связанные материалы

- [Обзор Web Search](/ru/tools/web) -- все провайдеры и автообнаружение
- [Brave Search](/ru/tools/brave-search) -- структурированные результаты с фильтрами страны/языка
- [Perplexity Search](/ru/tools/perplexity-search) -- структурированные результаты с фильтрацией по доменам
