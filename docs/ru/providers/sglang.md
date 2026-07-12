---
read_when:
    - Вы хотите запустить OpenClaw с локальным сервером SGLang
    - Вам нужны совместимые с OpenAI конечные точки /v1 с вашими собственными моделями
summary: Запуск OpenClaw с SGLang (самостоятельно размещаемым сервером, совместимым с OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T11:48:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang обслуживает модели с открытыми весами через HTTP API, совместимый с OpenAI. OpenClaw подключается к SGLang с помощью семейства провайдеров `openai-completions` с автоматическим обнаружением доступных моделей.

| Свойство                        | Значение                                                               |
| ------------------------------- | ---------------------------------------------------------------------- |
| Идентификатор провайдера        | `sglang`                                                               |
| Plugin                          | встроенный, `enabledByDefault: true`                                   |
| Переменная окружения для аутентификации | `SGLANG_API_KEY` (любое непустое значение, если сервер не требует аутентификации) |
| Флаг первоначальной настройки   | `--auth-choice sglang`                                                 |
| API                             | совместимый с OpenAI (`openai-completions`)                            |
| Базовый URL по умолчанию        | `http://127.0.0.1:30000/v1`                                            |
| Заполнитель модели по умолчанию | `sglang/Qwen/Qwen3-8B`                                                 |
| Потоковая передача данных об использовании | Да (`supportsStreamingUsage: true`)                           |
| Тарификация                     | Помечена как внешняя бесплатная (`modelPricing.external: false`)       |

OpenClaw также **автоматически обнаруживает** доступные модели SGLang, когда вы включаете эту возможность с помощью `SGLANG_API_KEY`. Используйте `sglang/*` в `agents.defaults.models`, чтобы обнаружение оставалось динамическим при настройке пользовательского базового URL SGLang. См. раздел [Обнаружение моделей (неявный провайдер)](#model-discovery-implicit-provider) ниже.

## Начало работы

<Steps>
  <Step title="Запустите SGLang">
    Запустите SGLang с сервером, совместимым с OpenAI. Ваш базовый URL должен предоставлять
    конечные точки `/v1` (например, `/v1/models`, `/v1/chat/completions`). Обычно SGLang
    работает по адресу:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Задайте ключ API">
    Если на вашем сервере не настроена аутентификация, подойдет любое значение:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Выполните первоначальную настройку или задайте модель напрямую">
    ```bash
    openclaw onboard
    ```

    Либо настройте модель вручную:

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

Когда задана переменная `SGLANG_API_KEY` (или существует профиль аутентификации) и вы **не**
определили `models.providers.sglang`, OpenClaw отправляет запрос:

- `GET http://127.0.0.1:30000/v1/models`

и преобразует возвращенные идентификаторы в записи моделей.

<Note>
Если вы явно зададите `models.providers.sglang`, OpenClaw по умолчанию будет использовать
объявленные вами модели. Добавьте `"sglang/*": {}` в `agents.defaults.models`, если хотите,
чтобы OpenClaw опрашивал конечную точку `/models` настроенного провайдера и включал
все объявленные модели SGLang.
</Note>

## Явная конфигурация (модели, заданные вручную)

Используйте явную конфигурацию, если:

- SGLang работает на другом хосте или порте.
- Вы хотите зафиксировать значения `contextWindow`/`maxTokens`.
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
  <Accordion title="Поведение в режиме прокси">
    SGLang рассматривается как прокси-бэкенд `/v1`, совместимый с OpenAI, а не как
    нативная конечная точка OpenAI.

    | Поведение | SGLang |
    |----------|--------|
    | Формирование запросов только для OpenAI | Не применяется |
    | `service_tier`, `store` из Responses, подсказки для кэша промптов | Не отправляются |
    | Формирование полезной нагрузки для совместимости с рассуждениями | Не применяется |
    | Скрытые заголовки атрибуции (`originator`, `version`, `User-Agent`) | Не добавляются при использовании пользовательских базовых URL SGLang |

  </Accordion>

  <Accordion title="Устранение неполадок">
    **Сервер недоступен**

    Убедитесь, что сервер запущен и отвечает:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Ошибки аутентификации**

    Если запросы завершаются ошибками аутентификации, задайте настоящий `SGLANG_API_KEY`,
    соответствующий конфигурации вашего сервера, либо явно настройте провайдера в
    `models.providers.sglang`.

    <Tip>
    Если SGLang работает без аутентификации, для включения обнаружения моделей достаточно
    любого непустого значения `SGLANG_API_KEY`.
    </Tip>

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации, включая записи провайдеров.
  </Card>
</CardGroup>
