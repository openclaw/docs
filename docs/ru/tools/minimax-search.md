---
read_when:
    - Вы хотите использовать MiniMax для web_search
    - Вам нужен ключ MiniMax Token Plan или токен OAuth
    - Вам нужны рекомендации по хосту поиска MiniMax для Китая или других регионов
summary: Поиск MiniMax через API поиска Token Plan
title: Поиск MiniMax
x-i18n:
    generated_at: "2026-07-13T20:22:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw поддерживает MiniMax как провайдера `web_search` через API поиска MiniMax
Token Plan. Он возвращает структурированные результаты поиска с заголовками, URL-адресами,
фрагментами и связанными запросами.

## Получение учётных данных Token Plan

<Steps>
  <Step title="Создание ключа">
    Создайте или скопируйте ключ MiniMax Token Plan на
    [платформе MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    Вместо него в конфигурациях OAuth можно повторно использовать `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Сохранение ключа">
    Задайте `MINIMAX_CODE_PLAN_KEY` в окружении Gateway или настройте с помощью:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw также принимает `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` и
`MINIMAX_API_KEY` как псевдонимы переменных окружения, проверяя их в указанном порядке после
`MINIMAX_CODE_PLAN_KEY`. `MINIMAX_API_KEY` должна указывать на учётные данные
Token Plan с поддержкой поиска; обычные ключи API моделей MiniMax могут не приниматься
эндпоинтом поиска Token Plan.

## Конфигурация

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // необязательно, если задана переменная окружения MiniMax Token Plan
            region: "global", // или "cn"
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
Для установки Gateway поместите её в `~/.openclaw/.env`.

## Выбор региона

MiniMax Search использует следующие эндпоинты:

- Глобальный: `https://api.minimax.io/v1/coding_plan/search`
- Китай: `https://api.minimaxi.com/v1/coding_plan/search`

Если `plugins.entries.minimax.config.webSearch.region` не задана, OpenClaw определяет
регион в следующем порядке:

1. `tools.web.search.minimax.region` / принадлежащая плагину `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Это означает, что настройка для Китая или `MINIMAX_API_HOST=https://api.minimaxi.com/...`
автоматически сохраняет использование китайского хоста и для MiniMax Search.

Даже если вы прошли аутентификацию MiniMax через путь OAuth `minimax-portal`,
веб-поиск всё равно регистрируется с идентификатором провайдера `minimax`; базовый URL
провайдера OAuth используется как подсказка региона при выборе китайского или глобального хоста, а `MINIMAX_OAUTH_TOKEN`
может использоваться в качестве учётных данных носителя MiniMax Search.

## Поддерживаемые параметры

| Параметр | Тип     | Ограничения       | Описание                                                                      |
| -------- | ------- | ----------------- | ----------------------------------------------------------------------------- |
| `query`   | строка  | обязательно       | Строка поискового запроса.                                                     |
| `count`   | целое число | 1-10, по умолчанию 5 | Количество возвращаемых результатов. OpenClaw сокращает возвращённый список до этого размера. |

Фильтры, специфичные для провайдера, в настоящее время не поддерживаются.

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) -- все провайдеры и автоматическое определение
- [MiniMax](/ru/providers/minimax) -- настройка моделей, изображений, речи и аутентификации
