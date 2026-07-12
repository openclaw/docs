---
read_when:
    - Вам нужен провайдер веб-поиска, не требующий ключа API
    - Вы хотите использовать DuckDuckGo для web_search
    - Вам нужен явно выбранный поставщик поиска без ключа
summary: Веб-поиск DuckDuckGo — провайдер без ключа (экспериментальный, на основе HTML)
title: Поиск DuckDuckGo
x-i18n:
    generated_at: "2026-07-12T11:56:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw поддерживает DuckDuckGo в качестве провайдера `web_search`, **не требующего ключа**. Ключ API и учетная запись не требуются.

<Warning>
  DuckDuckGo — **экспериментальная неофициальная** интеграция, которая извлекает данные из HTML-страниц поиска DuckDuckGo без JavaScript, а не использует официальный API. Возможны периодические сбои из-за страниц проверки на бота или изменений HTML.
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
Количество возвращаемых результатов (1–10).
</ParamField>

<ParamField path="region" type="string">
Код региона DuckDuckGo (например, `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Уровень SafeSearch.
</ParamField>

Параметры инструмента `region` и `safeSearch` переопределяют указанные выше значения конфигурации плагина для каждого отдельного запроса.

## Примечания

- **Ключ API не требуется** — работает после выбора DuckDuckGo в качестве провайдера `web_search`.
- **Экспериментальная интеграция** — извлекает данные из HTML-страниц поиска DuckDuckGo без JavaScript и не использует официальный API или SDK. Результаты зависят от структуры страницы, которая может измениться без предупреждения.
- **Риск проверки на бота** — при интенсивном или автоматизированном использовании DuckDuckGo может показывать CAPTCHA или блокировать запросы.
- **Только явный выбор** — автоматическое обнаружение OpenClaw учитывает только провайдеров с пригодными учетными данными, поэтому провайдер без ключа, такой как DuckDuckGo, никогда не выбирается автоматически; необходимо задать `provider: "duckduckgo"`.
- **По умолчанию для SafeSearch используется значение `moderate`**, если оно не настроено.

<Tip>
  Для использования в рабочей среде рассмотрите [Brave Search](/ru/tools/brave-search) (доступен бесплатный тариф) или другого провайдера на основе API.
</Tip>

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) — все провайдеры и автоматическое обнаружение
- [Brave Search](/ru/tools/brave-search) — структурированные результаты с бесплатным тарифом
- [Exa Search](/ru/tools/exa-search) — нейронный поиск с извлечением содержимого
