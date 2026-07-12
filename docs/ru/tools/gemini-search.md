---
read_when:
    - Вы хотите использовать Gemini для web_search
    - Вам потребуется `GEMINI_API_KEY` или `models.providers.google.apiKey`
    - Вам нужно обоснование с помощью Google Search
summary: Веб-поиск Gemini с подтверждением результатов через Google Search
title: Поиск Gemini
x-i18n:
    generated_at: "2026-07-12T11:55:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw поддерживает модели Gemini со встроенной
[привязкой к Google Поиску](https://ai.google.dev/gemini-api/docs/grounding),
которая возвращает синтезированные ИИ ответы на основе актуальных результатов Google Поиска
со ссылками на источники.

## Получение API-ключа

<Steps>
  <Step title="Создание ключа">
    Перейдите в [Google AI Studio](https://aistudio.google.com/apikey) и создайте
    API-ключ.
  </Step>
  <Step title="Сохранение ключа">
    Задайте `GEMINI_API_KEY` в окружении Gateway, повторно используйте
    `models.providers.google.apiKey` либо настройте отдельный ключ для веб-поиска:

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
            apiKey: "AIza...", // необязательно, если задан GEMINI_API_KEY или models.providers.google.apiKey
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // необязательно; при отсутствии используется models.providers.google.baseUrl
            model: "gemini-2.5-flash", // значение по умолчанию
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

**Приоритет учётных данных:** веб-поиск Gemini сначала использует
`plugins.entries.google.config.webSearch.apiKey`, затем `GEMINI_API_KEY`,
а после — `models.providers.google.apiKey`. Для базовых URL приоритет имеет
отдельный параметр `plugins.entries.google.config.webSearch.baseUrl`,
а затем — `models.providers.google.baseUrl`.

При установке Gateway поместите ключи окружения в `~/.openclaw/.env`.

## Принцип работы

В отличие от традиционных поисковых провайдеров, возвращающих список ссылок и фрагментов,
Gemini использует привязку к Google Поиску для создания синтезированных ИИ ответов
со встроенными ссылками на источники. Результаты содержат как синтезированный ответ,
так и URL-адреса источников.

- URL-адреса источников из привязки Gemini автоматически преобразуются из URL-адресов
  переадресации Google в прямые URL-адреса с помощью HEAD-запроса через защищённый
  от SSRF механизм получения данных OpenClaw (с переходом по перенаправлениям
  и проверкой http/https).
- При разрешении перенаправлений используются строгие настройки SSRF по умолчанию,
  поэтому перенаправления на частные или внутренние ресурсы блокируются.

## Поддерживаемые параметры

Поиск Gemini поддерживает `query`, `freshness`, `date_after` и `date_before`.

Параметр `count` принимается для совместимости с общим интерфейсом `web_search`,
но привязка Gemini всё равно возвращает один синтезированный ответ со ссылками
на источники, а не список из N результатов.

Параметр `freshness` принимает значения `day`, `week`, `month`, `year`, а также
общие сокращения `pd`, `pw`, `pm` и `py`. Значения `day`/`pd` добавляют к запросу
Gemini указание учитывать актуальность вместо жёсткого диапазона в 24 часа.
Значения `week`, `month`, `year` и явно заданные диапазоны
`date_after`/`date_before` устанавливают `timeRangeFilter` для привязки Gemini
к Google Поиску. Параметры `country`, `language` и `domain_filter` не поддерживаются.

## Выбор модели

Модель по умолчанию — `gemini-2.5-flash` (быстрая и экономичная). Через
`plugins.entries.google.config.webSearch.model` можно использовать любую модель
Gemini, поддерживающую привязку к поиску.

## Переопределение базового URL

Задайте `plugins.entries.google.config.webSearch.baseUrl`, если веб-поиск Gemini
должен направлять запросы через операторский прокси-сервер или пользовательскую
конечную точку, совместимую с Gemini. Если этот параметр не задан, веб-поиск Gemini
повторно использует `models.providers.google.baseUrl`. Значение
`https://generativelanguage.googleapis.com` без пути нормализуется до
`https://generativelanguage.googleapis.com/v1beta`; пути пользовательских
прокси-серверов сохраняются в заданном виде после удаления завершающих косых черт.

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) -- все провайдеры и автоматическое определение
- [Brave Search](/ru/tools/brave-search) -- структурированные результаты с фрагментами
- [Perplexity Search](/ru/tools/perplexity-search) -- структурированные результаты и извлечение содержимого
