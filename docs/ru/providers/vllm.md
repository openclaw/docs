---
read_when:
    - Вы хотите использовать OpenClaw с локальным сервером vLLM
    - Вам нужны совместимые с OpenAI конечные точки /v1 с вашими собственными моделями
summary: Запуск OpenClaw с vLLM (локальным сервером, совместимым с OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-13T18:43:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM предоставляет модели с открытым исходным кодом (и некоторые пользовательские модели) через HTTP API, **совместимый с OpenAI**. OpenClaw подключается с помощью API `openai-completions` и может **автоматически обнаруживать** модели, если вы включите эту возможность с помощью `VLLM_API_KEY`.

| Свойство              | Значение                                   |
| --------------------- | ------------------------------------------ |
| Идентификатор провайдера | `vllm`                      |
| API                   | `openai-completions` (совместимый с OpenAI)  |
| Аутентификация        | Переменная среды `VLLM_API_KEY`        |
| Базовый URL по умолчанию | `http://127.0.0.1:8000/v1`                      |
| Потоковая статистика использования | Поддерживается (`stream_options.include_usage`) |

## Начало работы

<Steps>
  <Step title="Запустите vLLM с сервером, совместимым с OpenAI">
    Ваш базовый URL должен предоставлять конечные точки `/v1` (`/v1/models`, `/v1/chat/completions`). Обычно vLLM работает по адресу:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Задайте переменную среды с ключом API">
    Если ваш сервер не требует аутентификации, подойдет любое непустое значение:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Выберите модель">
    Замените значение на один из идентификаторов моделей vLLM:

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
  <Step title="Убедитесь, что модель доступна">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

<Tip>
Для неинтерактивной настройки (CI, сценарии) передайте базовый URL, ключ и модель напрямую:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Обнаружение моделей (неявный провайдер)

Если задан `VLLM_API_KEY` (или существует профиль аутентификации), а `models.providers.vllm` **не** определен, OpenClaw отправляет запрос к `GET http://127.0.0.1:8000/v1/models` и преобразует возвращенные идентификаторы в записи моделей.

<Note>
Если вы явно зададите `models.providers.vllm`, OpenClaw будет использовать только объявленные вами модели. Добавьте `"vllm/*": {}` в `agents.defaults.models`, чтобы OpenClaw также запрашивал конечную точку `/models` этого настроенного провайдера и включал все объявленные модели vLLM.
</Note>

## Явная конфигурация

Используйте явную конфигурацию, если vLLM работает на другом хосте или порте, вы хотите зафиксировать `contextWindow`/`maxTokens`, вашему серверу требуется настоящий ключ API либо вы подключаетесь к доверенной конечной точке на loopback-интерфейсе, в локальной сети или Tailscale:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Необязательно: увеличьте тайм-аут запроса для медленных локальных моделей
        models: [
          {
            id: "your-model-id",
            name: "Локальная модель vLLM",
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

Чтобы сохранить динамическую работу провайдера без перечисления всех моделей, добавьте подстановочный знак в видимый каталог моделей:

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
    vLLM рассматривается как совместимый с OpenAI бэкенд `/v1` в стиле прокси, а не как нативная конечная точка OpenAI:

    | Поведение                                      | Применяется?                              |
    | ---------------------------------------------- | ----------------------------------------- |
    | Нативное формирование запросов OpenAI          | Нет                                       |
    | `service_tier`                             | Не отправляется                           |
    | Responses `store`                   | Не отправляется                           |
    | Подсказки для кэша промптов                     | Не отправляются                           |
    | Формирование полезной нагрузки для совместимости рассуждений OpenAI | Не применяется          |
    | Скрытые заголовки атрибуции OpenClaw            | Не добавляются для пользовательских базовых URL |

  </Accordion>

  <Accordion title="Управление рассуждениями Qwen">
    Для моделей Qwen задайте `compat.thinkingFormat: "qwen-chat-template"` в строке модели, если сервер ожидает аргументы шаблона чата Qwen. Эти модели предоставляют двоичный профиль `/think` (`off`, `on`), поскольку рассуждения в шаблоне чата Qwen включаются или выключаются одним флагом, а не задаются шкалой интенсивности в стиле OpenAI.

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

    OpenClaw сопоставляет `/think off` со следующим значением:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Для уровней рассуждений, отличных от `off`, отправляется `enable_thinking: true`. Если ваша конечная точка вместо этого ожидает флаги верхнего уровня в стиле DashScope, используйте `compat.thinkingFormat: "qwen"`, чтобы отправить `enable_thinking` в корне запроса.

  </Accordion>

  <Accordion title="Управление рассуждениями Nemotron 3">
    Для моделей `vllm/nemotron-3-*` с отключенными рассуждениями встроенный плагин отправляет:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Чтобы настроить эти значения, задайте `chat_template_kwargs` в параметрах модели. Если вы также зададите `params.extra_body.chat_template_kwargs`, это значение будет иметь приоритет, поскольку `extra_body` применяется к телу запроса последним.

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
    Сначала убедитесь, что vLLM запущен с правильным анализатором вызовов инструментов и шаблоном чата для этой модели. В документации vLLM указаны `hermes` для моделей Qwen2.5 и `qwen3_xml` для моделей Qwen3-Coder.

    Симптомы: Skills или инструменты никогда не запускаются, ассистент выводит необработанный JSON/XML, например `{"name":"read","arguments":...}`, либо vLLM возвращает пустой массив `tool_calls`, когда OpenClaw отправляет `tool_choice: "auto"`.

    Некоторые сочетания Qwen и vLLM возвращают структурированные вызовы инструментов только в том случае, если запрос использует `tool_choice: "required"`. Принудительно включите это для отдельной модели с помощью `params.extra_body`:

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

    Замените идентификатор модели точным идентификатором из `openclaw models list --provider vllm` либо примените такое же переопределение через CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Это обходное решение, включаемое явно: оно заставляет каждый ход с инструментами выполнять вызов инструмента, поэтому используйте его только для отдельной записи модели, где такое поведение приемлемо. Не задавайте его глобальным значением по умолчанию для всех моделей vLLM и не сочетайте с прокси, который преобразует произвольный текст ассистента в исполняемые вызовы инструментов.

  </Accordion>

  <Accordion title="Пользовательский базовый URL">
    Если ваш сервер vLLM работает на хосте или порте, отличном от используемого по умолчанию, задайте `baseUrl` в явной конфигурации провайдера:

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
                name: "Удаленная модель vLLM",
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
    Для крупных локальных моделей, удаленных хостов в локальной сети или подключений через tailnet задайте тайм-аут запросов на уровне провайдера:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Локальная модель vLLM" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` применяется только к HTTP-запросам моделей vLLM: установлению соединения, заголовкам ответа, потоковой передаче тела и общему прерыванию защищенного запроса. Он также повышает предел сторожевого таймера простоя и потоковой передачи LLM относительно неявного значения по умолчанию ~120s для этого провайдера. Предпочитайте этот вариант увеличению `agents.defaults.timeoutSeconds`, который управляет всем запуском агента.

  </Accordion>

  <Accordion title="Сервер недоступен">
    Убедитесь, что сервер vLLM запущен и доступен:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Если возникает ошибка подключения, проверьте хост, порт и убедитесь, что vLLM запущен в режиме сервера, совместимого с OpenAI. OpenClaw доверяет точно настроенному источнику `models.providers.vllm.baseUrl` для защищенных запросов моделей к конечным точкам на loopback-интерфейсе, в локальной сети и Tailscale. Источники метаданных и link-local по-прежнему блокируются без явного разрешения. Задавайте `models.providers.vllm.request.allowPrivateNetwork: true` только в том случае, если запросы vLLM должны обращаться к другому частному источнику, или `false`, чтобы отказаться от доверия к точному источнику.

  </Accordion>

  <Accordion title="Ошибки аутентификации при запросах">
    Если запросы завершаются ошибками аутентификации, задайте настоящий `VLLM_API_KEY`, соответствующий конфигурации вашего сервера, либо явно настройте провайдера в `models.providers.vllm`.

    <Tip>
    Если ваш сервер vLLM не требует аутентификации, любое непустое значение `VLLM_API_KEY` служит для OpenClaw сигналом явного включения.
    </Tip>

  </Accordion>

  <Accordion title="Модели не обнаружены">
    Для автоматического обнаружения необходимо задать `VLLM_API_KEY`. Если вы определили `models.providers.vllm`, OpenClaw использует только объявленные вами модели, если `agents.defaults.models` не содержит `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Инструменты отображаются как необработанный текст">
    Если модель Qwen выводит синтаксис инструментов JSON/XML вместо выполнения Skill:

    - Запустите vLLM с правильным анализатором и шаблоном для этой модели.
    - Подтвердите точный идентификатор модели с помощью `openclaw models list --provider vllm`.
    - Добавьте отдельное переопределение `params.extra_body.tool_choice: "required"` для конкретной модели, только если `tool_choice: "auto"` по-прежнему возвращает пустые или только текстовые вызовы инструментов.

  </Accordion>
</AccordionGroup>

<Warning>
Дополнительная помощь: [Устранение неполадок](/ru/help/troubleshooting) и [Часто задаваемые вопросы](/ru/help/faq).
</Warning>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="OpenAI" href="/ru/providers/openai" icon="bolt">
    Нативный провайдер OpenAI и поведение маршрутов, совместимых с OpenAI.
  </Card>
  <Card title="OAuth и аутентификация" href="/ru/gateway/authentication" icon="key">
    Сведения об аутентификации и правила повторного использования учетных данных.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространенные проблемы и способы их устранения.
  </Card>
</CardGroup>
