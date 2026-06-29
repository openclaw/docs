---
read_when:
    - Вы хотите запустить OpenClaw с локальным сервером SGLang
    - Вам нужны совместимые с OpenAI конечные точки /v1 с вашими собственными моделями
summary: Запуск OpenClaw с SGLang (OpenAI-совместимый самостоятельно размещаемый сервер)
title: SGLang
x-i18n:
    generated_at: "2026-06-28T23:39:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
---

SGLang обслуживает модели с открытыми весами через OpenAI-совместимый HTTP API. OpenClaw подключается к SGLang с помощью семейства провайдеров `openai-completions` с автообнаружением доступных моделей.

| Свойство                  | Значение                                                     |
| ------------------------- | ------------------------------------------------------------ |
| ID провайдера             | `sglang`                                                     |
| Plugin                    | встроенный, `enabledByDefault: true`                         |
| Переменная окружения auth | `SGLANG_API_KEY` (любое непустое значение, если на сервере нет auth) |
| Флаг онбординга           | `--auth-choice sglang`                                       |
| API                       | OpenAI-совместимый (`openai-completions`)                    |
| Базовый URL по умолчанию  | `http://127.0.0.1:30000/v1`                                  |
| Заполнитель модели по умолчанию | `sglang/Qwen/Qwen3-8B`                                |
| Использование streaming   | Да (`supportsStreamingUsage: true`)                          |
| Цены                      | Помечено как внешне-бесплатное (`modelPricing.external: false`) |

OpenClaw также **автоматически обнаруживает** доступные модели из SGLang, когда вы включаете это через `SGLANG_API_KEY`. Используйте `sglang/*` в `agents.defaults.models`, чтобы discovery оставалось динамическим, когда вы также настраиваете пользовательский базовый URL SGLang. См. [Обнаружение моделей (неявный провайдер)](#model-discovery-implicit-provider) ниже.

## Начало работы

<Steps>
  <Step title="Запустите SGLang">
    Запустите SGLang с OpenAI-совместимым сервером. Ваш базовый URL должен предоставлять
    endpoints `/v1` (например, `/v1/models`, `/v1/chat/completions`). SGLang
    обычно работает на:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Задайте ключ API">
    Подойдет любое значение, если на вашем сервере не настроен auth:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Запустите онбординг или задайте модель напрямую">
    ```bash
    openclaw onboard
    ```

    Или настройте модель вручную:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Обнаружение моделей (неявный провайдер)

Когда задан `SGLANG_API_KEY` (или существует профиль auth) и вы **не**
определяете `models.providers.sglang`, OpenClaw выполнит запрос:

- `GET http://127.0.0.1:30000/v1/models`

и преобразует возвращенные ID в записи моделей.

<Note>
Если вы явно задаете `models.providers.sglang`, OpenClaw по умолчанию использует
объявленные вами модели. Добавьте `"sglang/*": {}` в `agents.defaults.models`, когда вы
хотите, чтобы OpenClaw запрашивал endpoint `/models` этого настроенного провайдера и включал
все объявленные модели SGLang.
</Note>

## Явная конфигурация (модели вручную)

Используйте явную конфигурацию, когда:

- SGLang работает на другом хосте/порту.
- Вы хотите закрепить значения `contextWindow`/`maxTokens`.
- Ваш сервер требует настоящий ключ API (или вы хотите управлять заголовками).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
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

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Поведение в стиле прокси">
    SGLang рассматривается как proxy-style OpenAI-совместимый backend `/v1`, а не как
    нативный endpoint OpenAI.

    | Поведение | SGLang |
    |----------|--------|
    | Формирование запросов только для OpenAI | Не применяется |
    | `service_tier`, Responses `store`, подсказки prompt-cache | Не отправляются |
    | Формирование payload для reasoning-compat | Не применяется |
    | Скрытые заголовки атрибуции (`originator`, `version`, `User-Agent`) | Не внедряются для пользовательских базовых URL SGLang |

  </Accordion>

  <Accordion title="Устранение неполадок">
    **Сервер недоступен**

    Проверьте, что сервер запущен и отвечает:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Ошибки auth**

    Если запросы завершаются ошибками auth, задайте настоящий `SGLANG_API_KEY`, который соответствует
    конфигурации вашего сервера, или явно настройте провайдера в
    `models.providers.sglang`.

    <Tip>
    Если вы запускаете SGLang без аутентификации, любого непустого значения для
    `SGLANG_API_KEY` достаточно, чтобы включить обнаружение моделей.
    </Tip>

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения failover.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации, включая записи провайдеров.
  </Card>
</CardGroup>
