---
read_when:
    - Вы хотите использовать Ollama для web_search
    - Вам нужен провайдер web_search без ключа
    - Вы хотите использовать размещённый Ollama Web Search с OLLAMA_API_KEY
    - Вам нужна инструкция по настройке Ollama Web Search
summary: Веб-поиск Ollama через локальный хост Ollama или хостируемый API Ollama
title: Веб-поиск Ollama
x-i18n:
    generated_at: "2026-06-28T23:54:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw поддерживает **Ollama Web Search** как встроенный провайдер `web_search`. Он
использует API веб-поиска Ollama и возвращает структурированные результаты с заголовками, URL
и фрагментами.

Для локальной или самостоятельно размещенной Ollama эта настройка по умолчанию
не требует API-ключа. Для нее требуется:

- хост Ollama, доступный из OpenClaw
- `ollama signin`

Для прямого размещенного поиска задайте базовый URL провайдера Ollama как `https://ollama.com`
и укажите настоящий `OLLAMA_API_KEY`.

## Настройка

<Steps>
  <Step title="Запустите Ollama">
    Убедитесь, что Ollama установлена и запущена.
  </Step>
  <Step title="Войдите">
    Выполните:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Выберите Ollama Web Search">
    Выполните:

    ```bash
    openclaw configure --section web
    ```

    Затем выберите **Ollama Web Search** в качестве провайдера.

  </Step>
</Steps>

Если вы уже используете Ollama для моделей, Ollama Web Search повторно использует тот же
настроенный хост.

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

Необязательное переопределение хоста Ollama:

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

Если вы уже настраиваете Ollama как провайдера моделей, провайдер веб-поиска может
вместо этого повторно использовать этот хост:

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

Провайдер моделей Ollama использует `baseUrl` как канонический ключ. Провайдер веб-поиска также учитывает `baseURL` в `models.providers.ollama` для совместимости с примерами конфигурации в стиле OpenAI SDK.

Если явный базовый URL Ollama не задан, OpenClaw использует `http://127.0.0.1:11434`.

Если ваш хост Ollama ожидает bearer-аутентификацию, OpenClaw повторно использует
`models.providers.ollama.apiKey` (или соответствующую аутентификацию провайдера на основе env)
для запросов к этому настроенному хосту.

Прямой размещенный Ollama Web Search:

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

## Примечания

- Для этого провайдера не требуется отдельное поле API-ключа для веб-поиска.
- Если хост Ollama защищен аутентификацией, OpenClaw повторно использует обычный API-ключ
  провайдера Ollama, когда он присутствует.
- Если `baseUrl` равно `https://ollama.com`, OpenClaw напрямую вызывает
  `https://ollama.com/api/web_search` и отправляет настроенный API-ключ Ollama
  как bearer-аутентификацию.
- Если настроенный хост не предоставляет веб-поиск и задан `OLLAMA_API_KEY`,
  OpenClaw может вернуться к `https://ollama.com/api/web_search` без отправки
  этого env-ключа на локальный хост.
- OpenClaw предупреждает во время настройки, если Ollama недоступна или вход не выполнен, но
  не блокирует выбор.
- OpenClaw не выбирает Ollama Web Search автоматически, когда не настроен
  провайдер с учетными данными с более высоким приоритетом; выберите его явно через
  `tools.web.search.provider: "ollama"`.
- Хосты локального демона Ollama используют локальную прокси-точку
  `/api/experimental/web_search`, которая подписывает запросы и пересылает их в Ollama Cloud.
- Хосты `https://ollama.com` используют публичную размещенную точку
  `/api/web_search` напрямую с bearer-аутентификацией по API-ключу.

## Связанные материалы

- [Обзор Web Search](/ru/tools/web) -- все провайдеры и автообнаружение
- [Ollama](/ru/providers/ollama) -- настройка моделей Ollama и облачный/локальный режимы
