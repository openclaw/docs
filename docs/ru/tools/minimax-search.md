---
read_when:
    - Вы хотите использовать MiniMax для web_search
    - Вам нужен ключ MiniMax Token Plan или токен OAuth
    - Вам нужны рекомендации по хосту поиска MiniMax CN/global
summary: MiniMax Search через поисковый API Token Plan
title: Поиск MiniMax
x-i18n:
    generated_at: "2026-06-28T23:53:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw поддерживает MiniMax как провайдера `web_search` через API поиска MiniMax
Token Plan. Он возвращает структурированные результаты поиска с заголовками, URL,
фрагментами и связанными запросами.

## Получение учетных данных Token Plan

<Steps>
  <Step title="Создайте ключ">
    Создайте или скопируйте ключ MiniMax Token Plan на
    [платформе MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    Конфигурации OAuth вместо этого могут повторно использовать `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Сохраните ключ">
    Задайте `MINIMAX_CODE_PLAN_KEY` в окружении Gateway или настройте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw также принимает `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` и
`MINIMAX_API_KEY` как алиасы env. `MINIMAX_API_KEY` должен указывать на учетные
данные Token Plan с поддержкой поиска; обычные API-ключи моделей MiniMax могут
не приниматься конечной точкой поиска Token Plan.

## Конфигурация

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Альтернатива через окружение:** задайте `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` или `MINIMAX_API_KEY` в окружении Gateway.
Для установки gateway поместите его в `~/.openclaw/.env`.

## Выбор региона

MiniMax Search использует следующие конечные точки:

- Глобальная: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Если `plugins.entries.minimax.config.webSearch.region` не задан, OpenClaw определяет
регион в следующем порядке:

1. `tools.web.search.minimax.region` / принадлежащий plugin `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Это означает, что онбординг CN или `MINIMAX_API_HOST=https://api.minimaxi.com/...`
также автоматически оставляет MiniMax Search на хосте CN.

Даже если вы аутентифицировали MiniMax через путь OAuth `minimax-portal`,
web search все равно регистрируется с идентификатором провайдера `minimax`; базовый URL
OAuth-провайдера используется как подсказка региона для выбора хоста CN/global, а `MINIMAX_OAUTH_TOKEN`
может удовлетворять требование bearer-учетных данных MiniMax Search.

## Поддерживаемые параметры

| Параметр | Тип         | Ограничения   | Описание                                                                    |
| --------- | ----------- | ------------- | --------------------------------------------------------------------------- |
| `query`   | строка      | обязательный  | Строка поискового запроса.                                                  |
| `count`   | целое число | 1-10          | Количество возвращаемых результатов. OpenClaw обрезает возвращенный список до этого размера. |

Фильтры, специфичные для провайдера, сейчас не поддерживаются.

## Связанные материалы

- [Обзор Web Search](/ru/tools/web) -- все провайдеры и автоматическое обнаружение
- [MiniMax](/ru/providers/minimax) -- настройка модели, изображений, речи и аутентификации
