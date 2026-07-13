---
read_when:
    - Вы хотите запустить OpenClaw с локальным сервером Inferrs
    - Вы предоставляете доступ к Gemma или другой модели через Inferrs
    - Вам нужны точные флаги совместимости OpenClaw для Inferrs
summary: Запуск OpenClaw через Inferrs (локальный сервер, совместимый с OpenAI)
title: Inferrs
x-i18n:
    generated_at: "2026-07-13T18:41:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) предоставляет локальные модели через совместимый с OpenAI API `/v1`. OpenClaw взаимодействует с ним через универсальный адаптер `openai-completions`.

| Свойство                | Значение                                                                      |
| ----------------------- | ----------------------------------------------------------------------------- |
| Идентификатор провайдера | `inferrs` (пользовательский; настраивается в `models.providers.inferrs`)      |
| Плагин                  | отсутствует — это не встроенный плагин провайдера OpenClaw                    |
| Переменная среды аутентификации | не требуется; если сервер inferrs не использует аутентификацию, подойдет любое значение |
| API                     | совместимый с OpenAI (`openai-completions`)                                     |
| Рекомендуемый базовый URL | `http://127.0.0.1:8080/v1` (или адрес, на котором принимает подключения сервер inferrs) |

<Note>
  `inferrs` — это пользовательский самостоятельно размещаемый бэкенд, совместимый с OpenAI, а не отдельный плагин провайдера OpenClaw: его настраивают в `models.providers.inferrs`, а не выбирают вариант аутентификации при первоначальной настройке. Сведения о встроенном плагине с автоматическим обнаружением см. в разделах [SGLang](/ru/providers/sglang) или [vLLM](/ru/providers/vllm).
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
  <Step title="Убедитесь, что сервер доступен">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Добавьте запись провайдера OpenClaw">
    Добавьте явную запись провайдера и укажите ее для модели по умолчанию. См. пример конфигурации ниже.
  </Step>
</Steps>

## Полный пример конфигурации

Gemma 4 на локальном сервере `inferrs`:

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

OpenClaw может самостоятельно запускать `inferrs` только при выборе модели `inferrs/...`. Добавьте `localService` в ту же запись провайдера:

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

`command` должен быть абсолютным путем. Выполните `which inferrs` на хосте Gateway и используйте полученный путь. Полное описание полей: [Сервисы локальных моделей](/ru/gateway/local-model-services).

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Почему requiresStringContent имеет значение">
    Некоторые маршруты Chat Completions `inferrs` принимают в `messages[].content` только строки, а не структурированные массивы частей содержимого.

    <Warning>
    Если запуски OpenClaw завершаются со следующей ошибкой:

    ```text
    messages[1].content: недопустимый тип: последовательность, ожидалась строка
    ```

    задайте `compat.requiresStringContent: true` в записи модели. После этого OpenClaw преобразует части содержимого, состоящие только из текста, в обычные строки перед отправкой запроса.
    </Warning>

  </Accordion>

  <Accordion title="Ограничение Gemma и схемы инструментов">
    Некоторые сочетания `inferrs` и Gemma принимают небольшие прямые запросы `/v1/chat/completions`, но завершаются сбоем при полных циклах среды выполнения агента OpenClaw. Сначала попробуйте отключить поверхность схемы инструментов:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Это снижает нагрузку промпта на более строгие локальные бэкенды. Если небольшие прямые запросы по-прежнему работают, но обычные циклы агента OpenClaw продолжают завершаться сбоем внутри `inferrs`, считайте это ограничением вышестоящей модели или сервера, а не проблемой транспорта OpenClaw.

  </Accordion>

  <Accordion title="Ручная быстрая проверка">
    После настройки проверьте оба уровня:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"Сколько будет 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "Сколько будет 2 + 2? Ответьте одним коротким предложением." \
      --json
    ```

    Если первая команда работает, а вторая завершается сбоем, см. раздел «Устранение неполадок» ниже.

  </Accordion>

  <Accordion title="Поведение в режиме прокси">
    Поскольку `inferrs` использует универсальный адаптер `openai-completions` (а не `openai-responses`), формирование запросов, предназначенное только для нативного OpenAI, никогда не применяется: не отправляются ни `service_tier`, ни `store` Responses, ни подсказки для кэша промптов, ни совместимая с рассуждениями OpenAI структура полезной нагрузки.
  </Accordion>
</AccordionGroup>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Сбой curl /v1/models">
    `inferrs` не запущен, недоступен или не привязан к настроенным хосту и порту. Убедитесь, что сервер запущен и прослушивает этот адрес.
  </Accordion>

  <Accordion title="messages[].content должна быть строкой">
    Задайте `compat.requiresStringContent: true` в записи модели (см. выше).
  </Accordion>

  <Accordion title="Прямые вызовы /v1/chat/completions выполняются успешно, но openclaw infer model run завершается сбоем">
    Задайте `compat.supportsTools: false`, чтобы отключить поверхность схемы инструментов (см. ограничение Gemma выше).
  </Accordion>

  <Accordion title="inferrs по-прежнему аварийно завершается при более крупных циклах агента">
    Если ошибки схемы устранены, но `inferrs` по-прежнему аварийно завершается при более крупных циклах агента, считайте это ограничением вышестоящего `inferrs` или модели. Снизьте нагрузку промпта либо смените бэкенд или модель.
  </Accordion>
</AccordionGroup>

<Tip>
Общие рекомендации см. в разделах [Устранение неполадок](/ru/help/troubleshooting) и [Часто задаваемые вопросы](/ru/help/faq).
</Tip>

## Связанные разделы

<CardGroup cols={2}>
  <Card title="Локальные модели" href="/ru/gateway/local-models" icon="server">
    Использование OpenClaw с серверами локальных моделей.
  </Card>
  <Card title="Сервисы локальных моделей" href="/ru/gateway/local-model-services" icon="play">
    Запуск серверов локальных моделей по требованию для настроенных провайдеров.
  </Card>
  <Card title="Устранение неполадок Gateway" href="/ru/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Отладка локальных совместимых с OpenAI бэкендов, которые успешно проходят проверки, но завершаются сбоем при запусках агента.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
</CardGroup>
