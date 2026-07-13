---
read_when:
    - Вы хотите использовать Kimi для web_search
    - Вам нужен KIMI_API_KEY или MOONSHOT_API_KEY
summary: Веб-поиск Kimi через веб-поиск Moonshot
title: Поиск Kimi
x-i18n:
    generated_at: "2026-07-13T18:42:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi — это провайдер `web_search`, использующий встроенный веб-поиск Moonshot. Moonshot
формирует единый ответ со встроенными ссылками на источники, подобно провайдерам
Gemini и Grok с ответами, основанными на источниках, вместо ранжированного списка результатов.

## Настройка

<Steps>
  <Step title="Создайте ключ">
    Получите ключ API в [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Сохраните ключ">
    Задайте `KIMI_API_KEY` или `MOONSHOT_API_KEY` в окружении Gateway (при
    установке Gateway добавьте его в `~/.openclaw/.env`) либо настройте с помощью:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

При выборе **Kimi** во время `openclaw onboard` или `openclaw configure --section web`
также предлагается указать:

- регион API Moonshot: `https://api.moonshot.ai/v1` или `https://api.moonshot.cn/v1`
- модель веб-поиска (по умолчанию `kimi-k2.6`)

## Конфигурация

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // необязательно, если задана KIMI_API_KEY или MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Если `tools.web.search.provider` не указан, он автоматически определяется по доступным ключам API;
если настроено несколько учётных данных для поиска, явно задайте значение `kimi`.

Также поддерживается эквивалентная форма с областью действия в `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`);
обе формы объединяются в одну итоговую конфигурацию.

Значения по умолчанию: если `baseUrl` не указан, используется `https://api.moonshot.ai/v1`; для `model`
по умолчанию используется `kimi-k2.6`.

Если трафик чата использует хост для Китая (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), то `web_search` Kimi автоматически использует тот же хост,
если его собственный `baseUrl` не задан, чтобы ключи `.cn` случайно не отправлялись на
международную конечную точку (которая возвращает HTTP 401 для таких ключей). Чтобы переопределить
это наследование, явно задайте `baseUrl` Kimi.

## Требование к источникам

OpenClaw возвращает результат `web_search` Kimi, только если ответ Moonshot
содержит подтверждение использования встроенного веб-поиска, например повтор вызова инструмента `$web_search`,
`search_results` или URL-адреса источников. Если Kimi отвечает напрямую без
использования источников (например, «Я не могу просматривать интернет»), OpenClaw возвращает
ошибку `kimi_web_search_ungrounded`, а не считает этот текст результатом
поиска. Повторите запрос, переключитесь на провайдера структурированных результатов, например Brave, либо используйте
`web_fetch` / инструмент браузера, если у вас уже есть целевой URL-адрес.

## Параметры инструмента

| Параметр                                                       | Поддержка                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | Да                                                                                                                      |
| `count`                                                         | Принимается для совместимости между провайдерами, но игнорируется: Kimi всегда возвращает один сформированный ответ, а не список из N результатов |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Нет                                                                                                                       |

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) — все провайдеры и автоматическое определение
- [Moonshot AI](/ru/providers/moonshot) — документация по моделям Moonshot и провайдеру Kimi Coding
- [Поиск Gemini](/ru/tools/gemini-search) — сформированные ИИ ответы на основе источников Google
- [Поиск Grok](/ru/tools/grok-search) — сформированные ИИ ответы на основе источников xAI
