---
read_when:
    - Вам нужен провайдер веб-поиска, не требующий ключа API
    - Вы хотите использовать DuckDuckGo для web_search
    - Вам нужен явно выбранный провайдер поиска без ключа
summary: Веб-поиск DuckDuckGo — провайдер без ключа (экспериментальный, на основе HTML)
title: Поиск DuckDuckGo
x-i18n:
    generated_at: "2026-07-13T18:42:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw поддерживает DuckDuckGo как **не требующий ключа** провайдер `web_search`. API-ключ и учетная запись не требуются.

<Warning>
  DuckDuckGo — **экспериментальная неофициальная** интеграция, которая извлекает данные со страниц результатов поиска DuckDuckGo в HTML-версии без JavaScript, а не использует официальный API. Возможны периодические сбои из-за страниц проверки на бота или изменений HTML.
</Warning>

## Настройка

DuckDuckGo никогда не выбирается автоматически, поскольку автоматическое обнаружение учитывает только провайдеров с пригодными учетными данными. Укажите его явно:

<Steps>
  <Step title="Настройка">
    ```bash
    openclaw configure --section web
    # Выберите "duckduckgo" в качестве провайдера
    ```
  </Step>
</Steps>

## Конфигурация

Укажите провайдера непосредственно в конфигурации:

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Необязательные настройки региона и SafeSearch на уровне плагина:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // Код региона DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" или "off"
          },
        },
      },
    },
  },
}
```

## Параметры инструмента

<ParamField path="query" type="string" required>
Поисковый запрос.
</ParamField>

<ParamField path="count" type="number" default="5">
Количество возвращаемых результатов (1-10).
</ParamField>

<ParamField path="region" type="string">
Код региона DuckDuckGo (например, `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Уровень SafeSearch.
</ParamField>

Параметры инструмента `region` и `safeSearch` переопределяют указанные выше значения конфигурации плагина для каждого отдельного запроса.

## Примечания

- **Без API-ключа** — работает после выбора DuckDuckGo в качестве провайдера `web_search`.
- **Экспериментальная интеграция** — извлекает данные со страниц результатов поиска DuckDuckGo в HTML-версии без JavaScript, а не использует официальный API или SDK. Результаты зависят от структуры страницы, которая может измениться без предупреждения.
- **Риск проверки на бота** — при интенсивном или автоматизированном использовании DuckDuckGo может показывать CAPTCHA или блокировать запросы.
- **Только явный выбор** — автоматическое обнаружение OpenClaw учитывает только провайдеров с пригодными учетными данными, поэтому такой не требующий ключа провайдер, как DuckDuckGo, никогда не выбирается автоматически; необходимо задать `provider: "duckduckgo"`.
- **Если параметр не настроен, SafeSearch по умолчанию имеет значение `moderate`**.

<Tip>
  Для использования в рабочей среде рассмотрите [Brave Search](/ru/tools/brave-search) (доступен бесплатный тариф) или другого провайдера на основе API.
</Tip>

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) — все провайдеры и автоматическое обнаружение
- [Brave Search](/ru/tools/brave-search) — структурированные результаты с бесплатным тарифом
- [Exa Search](/ru/tools/exa-search) — нейронный поиск с извлечением содержимого
