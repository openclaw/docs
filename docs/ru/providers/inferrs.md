---
read_when:
    - Вы хотите запускать OpenClaw с локальным сервером inferrs
    - Вы обслуживаете Gemma или другую модель через inferrs
    - Вам нужны точные флаги совместимости OpenClaw для inferrs
summary: Запуск OpenClaw через inferrs (локальный сервер, совместимый с OpenAI)
title: Выводит
x-i18n:
    generated_at: "2026-06-28T23:37:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) может обслуживать локальные модели через OpenAI-совместимый API `/v1`. OpenClaw работает с `inferrs` через общий путь `openai-completions`.

| Свойство                    | Значение                                                                 |
| --------------------------- | ------------------------------------------------------------------------ |
| Идентификатор провайдера    | `inferrs` (пользовательский; настраивается в `models.providers.inferrs`) |
| Plugin                      | нет — `inferrs` не является встроенным Plugin провайдера OpenClaw        |
| Переменная окружения auth   | Необязательно. Подойдет любое значение, если у вашего сервера inferrs нет auth |
| API                         | OpenAI-совместимый (`openai-completions`)                                |
| Предлагаемый базовый URL    | `http://127.0.0.1:8080/v1` (или там, где находится ваш сервер inferrs)   |

<Note>
  В настоящее время `inferrs` лучше рассматривать как пользовательский самостоятельно размещаемый OpenAI-совместимый бэкенд, а не как выделенный Plugin провайдера OpenClaw. Вы настраиваете его через `models.providers.inferrs`, а не через флаг выбора при первичной настройке. Если вам нужен настоящий встроенный Plugin с автообнаружением, см. [SGLang](/ru/providers/sglang) или [vLLM](/ru/providers/vllm).
</Note>

## Начало работы

<Steps>
  <Step title="Запустите inferrs с моделью">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Проверьте, что сервер доступен">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Добавьте запись провайдера OpenClaw">
    Добавьте явную запись провайдера и укажите ее для модели по умолчанию. Полный пример конфигурации см. ниже.
  </Step>
</Steps>

## Полный пример конфигурации

В этом примере используется Gemma 4 на локальном сервере `inferrs`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Запуск по требованию

Inferrs также может запускаться OpenClaw только тогда, когда выбрана модель `inferrs/...`. Добавьте `localService` в ту же запись провайдера:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` должен быть абсолютным. Используйте `which inferrs` на хосте Gateway и поместите этот путь в конфигурацию. Полный справочник полей см. в разделе [Сервисы локальных моделей](/ru/gateway/local-model-services).

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Почему requiresStringContent важен">
    Некоторые маршруты Chat Completions в `inferrs` принимают только строковый
    `messages[].content`, а не структурированные массивы частей контента.

    <Warning>
    Если запуски OpenClaw завершаются ошибкой вида:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    задайте `compat.requiresStringContent: true` в записи модели.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw преобразует части чисто текстового контента в обычные строки перед отправкой
    запроса.

  </Accordion>

  <Accordion title="Gemma и оговорка о схеме инструментов">
    Некоторые текущие сочетания `inferrs` + Gemma принимают небольшие прямые
    запросы `/v1/chat/completions`, но все равно завершаются ошибкой на полных
    ходах среды выполнения агента OpenClaw.

    Если это происходит, сначала попробуйте следующее:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Это отключает поверхность схемы инструментов OpenClaw для модели и может снизить
    нагрузку промпта на более строгие локальные бэкенды.

    Если крошечные прямые запросы по-прежнему работают, но обычные ходы агента OpenClaw
    продолжают падать внутри `inferrs`, оставшаяся проблема обычно связана с поведением
    вышестоящей модели или сервера, а не с транспортным уровнем OpenClaw.

  </Accordion>

  <Accordion title="Ручная smoke-проверка">
    После настройки протестируйте оба уровня:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Если первая команда работает, а вторая завершается ошибкой, проверьте раздел устранения неполадок ниже.

  </Accordion>

  <Accordion title="Поведение в стиле прокси">
    `inferrs` рассматривается как OpenAI-совместимый бэкенд `/v1` в стиле прокси, а не как
    нативная конечная точка OpenAI.

    - Формирование запросов, предназначенное только для нативного OpenAI, здесь не применяется
    - Нет `service_tier`, нет Responses `store`, нет подсказок prompt-cache и нет
      формирования полезной нагрузки совместимости reasoning OpenAI
    - Скрытые заголовки атрибуции OpenClaw (`originator`, `version`, `User-Agent`)
      не внедряются для пользовательских базовых URL `inferrs`

  </Accordion>
</AccordionGroup>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="curl /v1/models завершается ошибкой">
    `inferrs` не запущен, недоступен или не привязан к ожидаемым
    хосту/порту. Убедитесь, что сервер запущен и слушает адрес, который вы
    настроили.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    Задайте `compat.requiresStringContent: true` в записи модели. Подробнее см.
    раздел `requiresStringContent` выше.
  </Accordion>

  <Accordion title="Прямые вызовы /v1/chat/completions проходят, но openclaw infer model run завершается ошибкой">
    Попробуйте задать `compat.supportsTools: false`, чтобы отключить поверхность схемы инструментов.
    См. оговорку о схеме инструментов Gemma выше.
  </Accordion>

  <Accordion title="inferrs все еще падает на более крупных ходах агента">
    Если OpenClaw больше не получает ошибок схемы, но `inferrs` все еще падает на более крупных
    ходах агента, рассматривайте это как ограничение вышестоящего `inferrs` или модели. Снизьте
    нагрузку промпта или перейдите на другой локальный бэкенд либо модель.
  </Accordion>
</AccordionGroup>

<Tip>
Общую помощь см. в разделах [Устранение неполадок](/ru/help/troubleshooting) и [FAQ](/ru/help/faq).
</Tip>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Локальные модели" href="/ru/gateway/local-models" icon="server">
    Запуск OpenClaw с локальными серверами моделей.
  </Card>
  <Card title="Сервисы локальных моделей" href="/ru/gateway/local-model-services" icon="play">
    Запуск локальных серверов моделей по требованию для настроенных провайдеров.
  </Card>
  <Card title="Устранение неполадок Gateway" href="/ru/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Отладка локальных OpenAI-совместимых бэкендов, которые проходят пробы, но завершаются ошибкой при запусках агента.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех провайдеров, ссылок на модели и поведения при отказе.
  </Card>
</CardGroup>
