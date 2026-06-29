---
read_when:
    - Вы хотите использовать Grok для web_search
    - Вы хотите использовать xAI OAuth или XAI_API_KEY для поиска в интернете
summary: Веб-поиск Grok через ответы xAI, основанные на веб-данных
title: Поиск Grok
x-i18n:
    generated_at: "2026-06-28T23:52:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw поддерживает Grok как провайдера `web_search`, используя основанные на веб-поиске
ответы xAI для создания синтезированных ИИ ответов, подкрепленных актуальными результатами поиска
с цитированием.

Веб-поиск Grok предпочитает существующий вход через xAI OAuth, когда он доступен.
Если профиля OAuth нет, тот же API-ключ xAI также может обеспечивать работу встроенного
инструмента `x_search` для поиска публикаций X (ранее Twitter) и инструмента `code_execution`.
Если вы сохраните ключ в `plugins.entries.xai.config.webSearch.apiKey`,
OpenClaw также повторно использует его как резервный вариант для встроенного провайдера моделей xAI.

Для метрик на уровне публикации X, таких как репосты, ответы, закладки или просмотры, предпочитайте
`x_search` с точным URL публикации или ID статуса вместо широкого поискового
запроса.

## Начальная настройка и конфигурирование

Если вы выбираете **Grok** во время:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw может использовать существующий профиль xAI OAuth без запроса отдельного
ключа для веб-поиска. Если OAuth недоступен, выполняется переход к настройке API-ключа xAI.
OpenClaw также может показать отдельный последующий шаг для включения `x_search` с теми же
учетными данными xAI. Этот последующий шаг:

- появляется только после выбора Grok для `web_search`
- не является отдельным выбором провайдера веб-поиска верхнего уровня
- может при необходимости задать модель `x_search` в том же потоке

Если вы пропустите его, вы сможете включить или изменить `x_search` позже в конфигурации.

## Войдите или получите API-ключ

<Steps>
  <Step title="Используйте xAI OAuth">
    Если вы уже вошли через xAI во время начальной настройки или авторизации модели, выберите
    Grok как провайдера `web_search`. Отдельный API-ключ не требуется:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Используйте резервный API-ключ">
    Получите API-ключ в [xAI](https://console.x.ai/), если OAuth недоступен
    или вы намеренно хотите конфигурацию веб-поиска на основе ключа.
  </Step>
  <Step title="Сохраните ключ">
    Задайте `XAI_API_KEY` в окружении Gateway или настройте через:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Альтернативы учетных данных:** войдите с помощью `openclaw models auth login
--provider xai --method oauth`, задайте `XAI_API_KEY` в окружении Gateway
или сохраните `plugins.entries.xai.config.webSearch.apiKey`. Для установки gateway
поместите переменные окружения в `~/.openclaw/.env`.

## Как это работает

Grok использует основанные на веб-поиске ответы xAI, чтобы синтезировать ответы со встроенными
цитатами, подобно подходу Gemini с опорой на Google Search.

## Поддерживаемые параметры

Поиск Grok поддерживает `query`.

`count` принимается для совместимости с общим `web_search`, но Grok все равно
возвращает один синтезированный ответ с цитатами, а не список из N результатов.

Фильтры, специфичные для провайдера, сейчас не поддерживаются.

Grok использует специфичный для провайдера тайм-аут по умолчанию в 60 секунд, потому что основанные
на веб-поиске запросы xAI Responses могут выполняться дольше, чем общий тайм-аут `web_search` по умолчанию. Задайте
`tools.web.search.timeoutSeconds`, чтобы переопределить его.

## Переопределения базового URL

Задайте `plugins.entries.xai.config.webSearch.baseUrl`, когда веб-поиск Grok должен
маршрутизироваться через операторский прокси или совместимую с xAI конечную точку Responses. OpenClaw
отправляет запросы в `<baseUrl>/responses` после удаления завершающих слэшей. `x_search`
использует тот же резервный `webSearch.baseUrl`, если
`plugins.entries.xai.config.xSearch.baseUrl` не задан.

## Связанное

- [Обзор веб-поиска](/ru/tools/web) -- все провайдеры и автоопределение
- [x_search в веб-поиске](/ru/tools/web#x_search) -- полноценный поиск X через xAI
- [Поиск Gemini](/ru/tools/gemini-search) -- синтезированные ИИ ответы через обоснование Google
