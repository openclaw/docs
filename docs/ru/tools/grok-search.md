---
read_when:
    - Вы хотите использовать Grok для web_search
    - Вы хотите использовать OAuth xAI или XAI_API_KEY для веб-поиска
summary: Веб-поиск Grok через ответы xAI с привязкой к веб-источникам
title: Поиск Grok
x-i18n:
    generated_at: "2026-07-13T18:42:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw поддерживает Grok как провайдера `web_search`, используя ответы xAI с веб-поиском
для формирования синтезированных ИИ ответов на основе актуальных результатов поиска
с указанием источников.

Веб-поиск Grok предпочитает использовать существующий вход через xAI OAuth, если он доступен.
Если профиля OAuth нет, тот же ключ API xAI также обеспечивает работу встроенного
инструмента `x_search` для поиска публикаций в X (ранее Twitter) и инструмента `code_execution`.
Хранение ключа в `plugins.entries.xai.config.webSearch.apiKey` также
позволяет OpenClaw использовать его как резервный вариант для встроенного провайдера моделей xAI.

Для получения метрик отдельных публикаций X (репостов, ответов, закладок, просмотров) используйте
[`x_search`](/ru/tools/web#x_search) с точным URL публикации или идентификатором статуса
вместо широкого поискового запроса.

## Первоначальная настройка и конфигурирование

Выбор **Grok** во время `openclaw onboard` или `openclaw configure --section
web` позволяет OpenClaw повторно использовать существующий профиль xAI OAuth без запроса
отдельного ключа для веб-поиска. При отсутствии OAuth используется настройка ключа API xAI.

Затем OpenClaw предлагает дополнительный шаг для включения `x_search` с теми же учётными
данными xAI. Этот дополнительный шаг:

- отображается только после выбора Grok для `web_search`
- не является отдельным вариантом провайдера веб-поиска верхнего уровня
- может при необходимости задать модель `x_search` в рамках того же процесса

Пропустите его, чтобы включить или изменить `x_search` позже в конфигурации.

## Вход или получение ключа API

<Steps>
  <Step title="Использование xAI OAuth">
    Если вы уже вошли в xAI во время первоначальной настройки или аутентификации модели, выберите
    Grok в качестве провайдера `web_search`. Отдельный ключ API не требуется:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Использование резервного ключа API">
    Получите ключ API в [xAI](https://console.x.ai/), если OAuth недоступен
    или вы намеренно хотите настроить веб-поиск с использованием ключа.
  </Step>
  <Step title="Сохранение ключа">
    Задайте `XAI_API_KEY` в окружении Gateway или выполните настройку с помощью:

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
            apiKey: "xai-...", // необязательно, если доступен xAI OAuth или XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // необязательное переопределение прокси или базового URL Responses API
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

**Альтернативные варианты учётных данных:** `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY` в окружении Gateway или
`plugins.entries.xai.config.webSearch.apiKey`. При установке Gateway поместите переменные
окружения в `~/.openclaw/.env`.

## Принцип работы

Grok использует ответы xAI с веб-поиском для синтеза ответов со встроенными
ссылками на источники, аналогично подходу Gemini с привязкой к Google Search.

## Поддерживаемые параметры

Поиск Grok поддерживает `query`. `count` принимается для совместимости с общим `web_search`,
но Grok всегда возвращает один синтезированный ответ с указанием источников,
а не список из N результатов. Фильтры, специфичные для провайдера, не поддерживаются.

По умолчанию для Grok установлен тайм-аут 60 секунд, поскольку веб-поиск
через xAI Responses может выполняться дольше общего значения по умолчанию `web_search`. Переопределите его
с помощью `tools.web.search.timeoutSeconds`.

## Переопределение базового URL

Задайте `plugins.entries.xai.config.webSearch.baseUrl`, чтобы направить веб-поиск Grok
через прокси оператора или совместимую с xAI конечную точку Responses. OpenClaw
отправляет POST-запросы в `<baseUrl>/responses` после удаления завершающих косых черт. `x_search`
использует в качестве резервного варианта тот же `webSearch.baseUrl`, если
не задан `plugins.entries.xai.config.xSearch.baseUrl`.

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) -- все провайдеры и автоматическое обнаружение
- [x_search в веб-поиске](/ru/tools/web#x_search) -- полноценный поиск в X через xAI
- [Поиск Gemini](/ru/tools/gemini-search) -- синтезированные ИИ ответы с привязкой к Google
