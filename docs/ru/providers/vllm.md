---
read_when:
    - Вы хотите запустить OpenClaw с локальным сервером vLLM
    - Вам нужны OpenAI-совместимые конечные точки /v1 с вашими собственными моделями
summary: Запуск OpenClaw с vLLM (локальный сервер, совместимый с OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-06-28T23:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM может обслуживать open-source (и некоторые пользовательские) модели через **OpenAI-совместимый** HTTP API. OpenClaw подключается к vLLM с помощью API `openai-completions`.

OpenClaw также может **автоматически обнаруживать** доступные модели из vLLM, если вы включите это через `VLLM_API_KEY` (подойдет любое значение, если ваш сервер не требует аутентификации). Используйте `vllm/*` в `agents.defaults.models`, чтобы обнаружение оставалось динамическим, когда вы также настраиваете пользовательский базовый URL vLLM.

OpenClaw рассматривает `vllm` как локального OpenAI-совместимого провайдера, который поддерживает
потоковый учет использования, поэтому счетчики токенов статуса/контекста могут обновляться из
ответов `stream_options.include_usage`.

| Свойство              | Значение                                 |
| --------------------- | ---------------------------------------- |
| ID провайдера         | `vllm`                                   |
| API                   | `openai-completions` (OpenAI-совместимый) |
| Аутентификация        | переменная окружения `VLLM_API_KEY`      |
| Базовый URL по умолчанию | `http://127.0.0.1:8000/v1`            |

## Начало работы

<Steps>
  <Step title="Запустите vLLM с OpenAI-совместимым сервером">
    Ваш базовый URL должен предоставлять эндпоинты `/v1` (например, `/v1/models`, `/v1/chat/completions`). vLLM обычно работает на:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Задайте переменную окружения API-ключа">
    Подойдет любое значение, если ваш сервер не требует аутентификации:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Выберите модель">
    Замените на один из ID моделей vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Проверьте, что модель доступна">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Обнаружение моделей (неявный провайдер)

Когда задан `VLLM_API_KEY` (или существует профиль аутентификации) и вы **не** определяете `models.providers.vllm`, OpenClaw запрашивает:

```
GET http://127.0.0.1:8000/v1/models
```

и преобразует возвращенные ID в записи моделей.

<Note>
Если вы явно задаете `models.providers.vllm`, OpenClaw по умолчанию использует объявленные вами модели. Добавьте `"vllm/*": {}` в `agents.defaults.models`, если хотите, чтобы OpenClaw запрашивал эндпоинт `/models` этого настроенного провайдера и включал все объявленные модели vLLM.
</Note>

## Явная конфигурация (модели вручную)

Используйте явную конфигурацию, когда:

- vLLM работает на другом хосте или порту
- Вы хотите закрепить значения `contextWindow` или `maxTokens`
- Вашему серверу требуется настоящий API-ключ (или вы хотите управлять заголовками)
- Вы подключаетесь к доверенному loopback, LAN или эндпоинту vLLM в Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Чтобы этот провайдер оставался динамическим без ручного перечисления каждой модели, добавьте
подстановочный знак провайдера в видимый каталог моделей:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Поведение в стиле прокси">
    vLLM рассматривается как OpenAI-совместимый бэкенд `/v1` в стиле прокси, а не как нативный
    эндпоинт OpenAI. Это означает:

    | Поведение | Применяется? |
    |----------|----------|
    | Нативное формирование запросов OpenAI | Нет |
    | `service_tier` | Не отправляется |
    | Responses `store` | Не отправляется |
    | Подсказки prompt-cache | Не отправляются |
    | Формирование payload для совместимости с reasoning OpenAI | Не применяется |
    | Скрытые заголовки атрибуции OpenClaw | Не внедряются для пользовательских базовых URL |

  </Accordion>

  <Accordion title="Управление мышлением Qwen">
    Для моделей Qwen, обслуживаемых через vLLM, задайте
    `compat.thinkingFormat: "qwen-chat-template"` в строке модели настроенного провайдера,
    когда сервер ожидает kwargs chat-template Qwen. Модели,
    настроенные таким образом, предоставляют бинарный профиль `/think` (`off`, `on`), потому что
    template thinking Qwen — это флаг запроса вкл/выкл, а не шкала усилия в стиле OpenAI.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw сопоставляет `/think off` с:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Уровни мышления, отличные от `off`, отправляют `enable_thinking: true`. Если ваш эндпоинт
    вместо этого ожидает флаги верхнего уровня в стиле DashScope, используйте
    `compat.thinkingFormat: "qwen"`, чтобы отправлять `enable_thinking` в корне
    запроса.

  </Accordion>

  <Accordion title="Управление мышлением Nemotron 3">
    vLLM/Nemotron 3 может использовать kwargs chat-template, чтобы управлять тем, возвращается ли reasoning
    как скрытое reasoning или как видимый текст ответа. Когда сессия OpenClaw
    использует `vllm/nemotron-3-*` с выключенным мышлением, встроенный Plugin vLLM отправляет:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Чтобы настроить эти значения, задайте `chat_template_kwargs` в параметрах модели.
    Если вы также зададите `params.extra_body.chat_template_kwargs`, это значение будет иметь
    окончательный приоритет, потому что `extra_body` является последним переопределением тела запроса.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Вызовы инструментов Qwen отображаются как текст">
    Сначала убедитесь, что vLLM был запущен с правильным парсером вызовов инструментов и chat
    template для модели. Например, в документации vLLM указаны `hermes` для моделей Qwen2.5
    и `qwen3_xml` для моделей Qwen3-Coder.

    Симптомы:

    - Skills или инструменты никогда не запускаются
    - ассистент печатает необработанный JSON/XML, например `{"name":"read","arguments":...}`
    - vLLM возвращает пустой массив `tool_calls`, когда OpenClaw отправляет
      `tool_choice: "auto"`

    Некоторые сочетания Qwen/vLLM возвращают структурированные вызовы инструментов только когда
    в запросе используется `tool_choice: "required"`. Для таких записей моделей принудительно задайте
    OpenAI-совместимое поле запроса через `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    Замените `Qwen-Qwen2.5-Coder-32B-Instruct` на точный id, возвращенный командой:

    ```bash
    openclaw models list --provider vllm
    ```

    Вы можете применить то же переопределение из CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Это opt-in обходной путь совместимости. Он заставляет каждый ход модели с
    инструментами требовать вызов инструмента, поэтому используйте его только для выделенной записи
    локальной модели, где такое поведение приемлемо. Не используйте его как глобальное значение по умолчанию для всех
    моделей vLLM и не используйте прокси, который вслепую преобразует произвольный
    текст ассистента в исполняемые вызовы инструментов.

  </Accordion>

  <Accordion title="Пользовательский базовый URL">
    Если ваш сервер vLLM работает на нестандартном хосте или порту, задайте `baseUrl` в явной конфигурации провайдера:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Медленный первый ответ или тайм-аут удаленного сервера">
    Для больших локальных моделей, удаленных хостов LAN или соединений tailnet задайте
    тайм-аут запросов на уровне провайдера:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` применяется только к HTTP-запросам моделей vLLM, включая
    установку соединения, заголовки ответа, потоковую передачу тела и общий
    guarded-fetch abort. Предпочитайте это перед увеличением
    `agents.defaults.timeoutSeconds`, который управляет всем запуском агента.

  </Accordion>

  <Accordion title="Сервер недоступен">
    Проверьте, что сервер vLLM запущен и доступен:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Если вы видите ошибку соединения, проверьте хост, порт и то, что vLLM был запущен в OpenAI-совместимом серверном режиме.
    Для явных loopback, LAN или Tailscale эндпоинтов OpenClaw доверяет
    точному настроенному origin `models.providers.vllm.baseUrl` для защищенных модельных
    запросов. Origin metadata/link-local остаются заблокированными без явного
    opt-in. Устанавливайте `models.providers.vllm.request.allowPrivateNetwork: true` только
    когда запросы vLLM должны достигать другого частного origin, и устанавливайте его в `false`,
    чтобы отказаться от доверия к точному origin.

  </Accordion>

  <Accordion title="Ошибки аутентификации в запросах">
    Если запросы завершаются ошибками аутентификации, задайте настоящий `VLLM_API_KEY`, соответствующий конфигурации вашего сервера, или явно настройте провайдера в `models.providers.vllm`.

    <Tip>
    Если ваш сервер vLLM не требует аутентификации, любое непустое значение `VLLM_API_KEY` работает как opt-in сигнал для OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Модели не обнаружены">
    Для автоматического обнаружения требуется, чтобы был задан `VLLM_API_KEY`. Если вы определили `models.providers.vllm`, OpenClaw использует только объявленные вами модели, если `agents.defaults.models` не содержит `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Инструменты отображаются как необработанный текст">
    Если модель Qwen печатает синтаксис инструментов JSON/XML вместо выполнения skill,
    проверьте рекомендации для Qwen в разделе расширенной конфигурации выше. Обычное исправление:

    - запустить vLLM с правильным парсером/шаблоном для этой модели
    - подтвердить точный id модели с помощью `openclaw models list --provider vllm`
    - добавить выделенное переопределение `params.extra_body.tool_choice: "required"` для конкретной модели
      только если `tool_choice: "auto"` по-прежнему возвращает пустые или текстовые
      вызовы инструментов

  </Accordion>
</AccordionGroup>

<Warning>
Дополнительная помощь: [Устранение неполадок](/ru/help/troubleshooting) и [FAQ](/ru/help/faq).
</Warning>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="OpenAI" href="/ru/providers/openai" icon="bolt">
    Собственный провайдер OpenAI и поведение маршрутов, совместимых с OpenAI.
  </Card>
  <Card title="OAuth и аутентификация" href="/ru/gateway/authentication" icon="key">
    Сведения об аутентификации и правила повторного использования учетных данных.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространенные проблемы и способы их устранения.
  </Card>
</CardGroup>
