---
read_when:
    - Вы хотите использовать Gemini для web_search
    - Вам нужен `GEMINI_API_KEY` или `models.providers.google.apiKey`
    - Вам нужно обоснование с помощью Google Search
summary: Веб-поиск Gemini с обоснованием через Google Search
title: Поиск Gemini
x-i18n:
    generated_at: "2026-07-13T18:48:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw поддерживает модели Gemini со встроенным
[обоснованием через Google Search](https://ai.google.dev/gemini-api/docs/grounding),
которое возвращает синтезированные ИИ ответы на основе актуальных результатов Google Search
со ссылками на источники.

## Получение ключа API

<Steps>
  <Step title="Создайте ключ">
    Перейдите в [Google AI Studio](https://aistudio.google.com/apikey) и создайте
    ключ API.
  </Step>
  <Step title="Сохраните ключ">
    Задайте `GEMINI_API_KEY` в окружении Gateway, повторно используйте
    `models.providers.google.apiKey` или настройте отдельный ключ для веб-поиска с помощью:

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
а потом `models.providers.google.apiKey`. Для базовых URL отдельный
`plugins.entries.google.config.webSearch.baseUrl` имеет приоритет перед
`models.providers.google.baseUrl`.

При установке Gateway поместите ключи окружения в `~/.openclaw/.env`.

## Принцип работы

В отличие от традиционных поисковых провайдеров, возвращающих список ссылок и фрагментов,
Gemini использует обоснование через Google Search для создания синтезированных ИИ ответов
со встроенными ссылками на источники. Результаты содержат как синтезированный ответ, так и
URL-адреса источников.

- URL-адреса ссылок на источники из обоснования Gemini автоматически преобразуются из
  URL-адресов перенаправления Google в прямые URL-адреса с помощью запроса HEAD через
  защищенный от SSRF механизм получения данных OpenClaw (переход по перенаправлениям,
  проверка http/https).
- При разрешении перенаправлений применяются строгие настройки SSRF по умолчанию, поэтому
  перенаправления на частные или внутренние адреса блокируются.

## Поддерживаемые параметры

Поиск Gemini поддерживает `query`, `freshness`, `date_after` и `date_before`.

`count` принимается для совместимости с общим `web_search`, но обоснование Gemini
по-прежнему возвращает один синтезированный ответ со ссылками на источники, а не список
из N результатов.

`freshness` принимает `day`, `week`, `month`, `year` и общие сокращения
`pd`, `pw`, `pm` и `py`. `day`/`pd` добавляет в запрос Gemini
указание на актуальность вместо жесткого диапазона в 24 часа. `week`, `month`, `year` и явные
диапазоны `date_after`/`date_before` задают
`timeRangeFilter` для обоснования Gemini через Google Search. `country`, `language` и `domain_filter` не поддерживаются.

## Выбор модели

Модель по умолчанию — `gemini-2.5-flash` (быстрая и экономичная). Через
`plugins.entries.google.config.webSearch.model` можно использовать любую модель Gemini,
поддерживающую обоснование.

## Переопределение базового URL

Задайте `plugins.entries.google.config.webSearch.baseUrl`, если веб-поиск Gemini
должен выполняться через прокси-сервер оператора или пользовательскую конечную точку,
совместимую с Gemini. Если значение не задано, веб-поиск Gemini повторно использует `models.providers.google.baseUrl`. Простое
значение `https://generativelanguage.googleapis.com` нормализуется в
`https://generativelanguage.googleapis.com/v1beta`; пользовательские пути прокси-сервера сохраняются
в указанном виде после удаления завершающих косых черт.

## См. также

- [Обзор веб-поиска](/ru/tools/web) — все провайдеры и автоматическое обнаружение
- [Brave Search](/ru/tools/brave-search) — структурированные результаты с фрагментами
- [Perplexity Search](/ru/tools/perplexity-search) — структурированные результаты и извлечение содержимого
