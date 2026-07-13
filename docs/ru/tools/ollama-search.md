---
read_when:
    - Вы хотите использовать Ollama для web_search
    - Вам нужен провайдер web_search без ключа
    - Вы хотите использовать облачный веб-поиск Ollama с OLLAMA_API_KEY
    - Вам нужны инструкции по настройке веб-поиска Ollama
summary: Веб-поиск Ollama через локальный хост Ollama или размещённый API Ollama
title: Веб-поиск Ollama
x-i18n:
    generated_at: "2026-07-13T20:22:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw поддерживает **Ollama Web Search** как встроенный провайдер `web_search`,
возвращающий заголовки, URL-адреса и фрагменты результатов из API веб-поиска Ollama.

Для локального или самостоятельно размещённого Ollama по умолчанию не требуется ключ API; необходимы доступный
хост Ollama и `ollama signin`. Для прямого поиска через облачный сервис (без локального Ollama) требуются
`baseUrl: "https://ollama.com"` и действительный `OLLAMA_API_KEY`.

## Настройка

<Steps>
  <Step title="Запустите Ollama">
    Убедитесь, что Ollama установлен и запущен.
  </Step>
  <Step title="Войдите в систему">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Выберите Ollama Web Search">
    ```bash
    openclaw configure --section web
    ```

    Выберите **Ollama Web Search** в качестве провайдера.

  </Step>
</Steps>

Если вы уже используете Ollama для моделей, Ollama Web Search повторно использует тот же
настроенный хост.

<Note>
  OpenClaw никогда не выбирает Ollama Web Search автоматически вместо провайдера
  с учётными данными и более высоким приоритетом; его необходимо выбрать явно с помощью
  `tools.web.search.provider: "ollama"`.
</Note>

## Конфигурация

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Необязательное переопределение хоста, применяемое только к веб-поиску:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

Или повторно используйте хост, уже настроенный для провайдера моделей Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

`models.providers.ollama.baseUrl` — канонический ключ; провайдер веб-поиска
также принимает там `baseURL` для совместимости с примерами
конфигурации в стиле OpenAI SDK. Если ничего не задано, OpenClaw по умолчанию использует
`http://127.0.0.1:11434`.

Прямой облачный Ollama Web Search (без локального Ollama):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Аутентификация и маршрутизация запросов

- Отдельного поля ключа API для веб-поиска не существует; провайдер повторно использует
  `models.providers.ollama.apiKey` (или соответствующую аутентификацию провайдера на основе переменных окружения),
  когда настроенный хост защищён аутентификацией.
- Порядок разрешения хоста: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (или `baseURL`) → `http://127.0.0.1:11434`.
- Если разрешённый хост — `https://ollama.com`, OpenClaw обращается
  непосредственно к `https://ollama.com/api/web_search`, используя ключ API для аутентификации
  по схеме Bearer.
- В противном случае OpenClaw сначала обращается к конечной точке локального прокси
  `/api/experimental/web_search` (которая подписывает и перенаправляет запрос в Ollama
  Cloud), а затем при сбое использует `/api/web_search` на том же хосте. Если оба запроса завершаются сбоем
  и задан `OLLAMA_API_KEY`, выполняется одна повторная попытка обращения к
  `https://ollama.com/api/web_search` с этим ключом — без его отправки
  локальному хосту.
- Во время настройки OpenClaw предупреждает, если Ollama недоступен или вход не выполнен, но
  не блокирует выбор провайдера.

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) -- все провайдеры и автоматическое обнаружение
- [Ollama](/ru/providers/ollama) -- настройка моделей Ollama и облачный/локальный режимы
