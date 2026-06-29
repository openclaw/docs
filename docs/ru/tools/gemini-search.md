---
read_when:
    - Вы хотите использовать Gemini для web_search
    - Вам нужен GEMINI_API_KEY или models.providers.google.apiKey
    - Вам нужно обоснование через Google Search
summary: Веб-поиск Gemini с привязкой к Google Search
title: Поиск Gemini
x-i18n:
    generated_at: "2026-06-28T23:52:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw поддерживает модели Gemini со встроенным
[grounding Google Search](https://ai.google.dev/gemini-api/docs/grounding),
который возвращает синтезированные ИИ ответы на основе актуальных результатов Google Search с
цитатами.

## Получение API-ключа

<Steps>
  <Step title="Создайте ключ">
    Перейдите в [Google AI Studio](https://aistudio.google.com/apikey) и создайте
    API-ключ.
  </Step>
  <Step title="Сохраните ключ">
    Задайте `GEMINI_API_KEY` в окружении Gateway, повторно используйте
    `models.providers.google.apiKey` или настройте отдельный ключ веб-поиска с помощью:

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
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Приоритет учетных данных:** веб-поиск Gemini сначала использует
`plugins.entries.google.config.webSearch.apiKey`, затем `GEMINI_API_KEY`,
затем `models.providers.google.apiKey`. Для базовых URL отдельный
`plugins.entries.google.config.webSearch.baseUrl` имеет приоритет перед
`models.providers.google.baseUrl`.

Для установки Gateway поместите ключи окружения в `~/.openclaw/.env`.

## Как это работает

В отличие от традиционных поисковых провайдеров, которые возвращают список ссылок и фрагментов,
Gemini использует grounding Google Search, чтобы создавать синтезированные ИИ ответы со
встроенными цитатами. Результаты включают как синтезированный ответ, так и исходные
URL.

- URL цитат из grounding Gemini автоматически преобразуются из
  URL перенаправления Google в прямые URL.
- Разрешение перенаправлений использует путь защиты от SSRF (HEAD + проверки перенаправлений +
  валидация http/https) перед возвратом итогового URL цитаты.
- Разрешение перенаправлений использует строгие значения SSRF по умолчанию, поэтому перенаправления на
  частные/внутренние цели блокируются.

## Поддерживаемые параметры

Поиск Gemini поддерживает `query`, `freshness`, `date_after` и `date_before`.

`count` принимается для совместимости с общим `web_search`, но grounding Gemini
все равно возвращает один синтезированный ответ с цитатами, а не список из N
результатов.

`freshness` принимает `day`, `week`, `month`, `year` и общие сокращения
`pd`, `pw`, `pm` и `py`. `day`/`pd` добавляет в запрос Gemini инструкцию о недавности
вместо жесткого 24-часового диапазона. `week`, `month`, `year` и явные
диапазоны `date_after`/`date_before` задают `timeRangeFilter` для grounding Google Search
Gemini. `country`, `language` и `domain_filter` не поддерживаются.

## Выбор модели

Модель по умолчанию — `gemini-2.5-flash` (быстрая и экономичная). Любую модель Gemini,
которая поддерживает grounding, можно использовать через
`plugins.entries.google.config.webSearch.model`.

## Переопределения базового URL

Задайте `plugins.entries.google.config.webSearch.baseUrl`, когда веб-поиск Gemini
должен маршрутизироваться через операторский прокси или пользовательскую Gemini-совместимую конечную точку. Если
это значение не задано, веб-поиск Gemini повторно использует `models.providers.google.baseUrl`. Обычное
значение `https://generativelanguage.googleapis.com` нормализуется в
`https://generativelanguage.googleapis.com/v1beta`; пути пользовательских прокси сохраняются
как переданы после удаления завершающих косых черт.

## См. также

- [Обзор веб-поиска](/ru/tools/web) -- все провайдеры и автоопределение
- [Brave Search](/ru/tools/brave-search) -- структурированные результаты с фрагментами
- [Perplexity Search](/ru/tools/perplexity-search) -- структурированные результаты + извлечение содержимого
