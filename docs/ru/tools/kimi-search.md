---
read_when:
    - Вы хотите использовать Kimi для web_search
    - Вам нужен `KIMI_API_KEY` или `MOONSHOT_API_KEY`
summary: Веб-поиск Kimi через веб-поиск Moonshot
title: Поиск Kimi
x-i18n:
    generated_at: "2026-07-12T11:57:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi — это поставщик `web_search`, использующий встроенный веб-поиск Moonshot. Вместо возврата ранжированного списка результатов Moonshot формирует единый ответ со встроенными ссылками на источники, аналогично поставщикам Gemini и Grok, создающим ответы на основе найденных данных.

## Настройка

<Steps>
  <Step title="Создание ключа">
    Получите ключ API в [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Сохранение ключа">
    Задайте `KIMI_API_KEY` или `MOONSHOT_API_KEY` в окружении Gateway (при
    установке Gateway добавьте его в `~/.openclaw/.env`) или настройте с помощью:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

При выборе **Kimi** во время выполнения `openclaw onboard` или `openclaw configure --section web`
также запрашиваются:

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

Если `tools.web.search.provider` не указан, он определяется автоматически по доступным ключам API;
явно задайте значение `kimi`, если настроены учётные данные для нескольких поисковых служб.

Также поддерживается эквивалентная форма с областью действия `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`);
обе структуры объединяются в одну итоговую конфигурацию.

Значения по умолчанию: если `baseUrl` не указан, используется `https://api.moonshot.ai/v1`, а для `model`
используется `kimi-k2.6`.

Если трафик чата использует китайский хост (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), то Kimi `web_search` автоматически использует тот же хост,
когда его собственный `baseUrl` не задан. Благодаря этому ключи `.cn` не будут случайно отправлены
на международную конечную точку, которая возвращает для них HTTP 401. Чтобы переопределить это
наследование, явно задайте `baseUrl` для Kimi.

## Требование к обоснованию

OpenClaw возвращает результат Kimi `web_search` только после того, как ответ Moonshot
будет содержать встроенные свидетельства использования веб-поиска, например повтор вызова инструмента
`$web_search`, `search_results` или URL-адреса источников. Если Kimi отвечает напрямую без
обоснования (например, «Я не могу просматривать интернет»), OpenClaw возвращает ошибку
`kimi_web_search_ungrounded`, а не рассматривает этот текст как результат поиска.
Повторите запрос, переключитесь на поставщика структурированных результатов, например Brave, или используйте
`web_fetch` / инструмент браузера, если у вас уже есть целевой URL-адрес.

## Параметры инструмента

| Параметр                                                        | Поддержка                                                                                                                        |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `query`                                                         | Да                                                                                                                               |
| `count`                                                         | Принимается для совместимости между поставщиками, но игнорируется: Kimi всегда возвращает один сформированный ответ, а не список из N результатов |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Нет                                                                                                                              |

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) — все поставщики и автоматическое определение
- [Moonshot AI](/ru/providers/moonshot) — документация по модели Moonshot и поставщику Kimi Coding
- [Поиск Gemini](/ru/tools/gemini-search) — сформированные ИИ ответы на основе данных Google
- [Поиск Grok](/ru/tools/grok-search) — сформированные ИИ ответы на основе данных xAI
