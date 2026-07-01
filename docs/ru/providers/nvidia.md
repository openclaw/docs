---
read_when:
    - Вы хотите бесплатно использовать открытые модели в OpenClaw
    - Необходимо настроить NVIDIA_API_KEY
    - Вы хотите использовать Nemotron 3 Ultra через NVIDIA
summary: Используйте OpenAI-совместимый API NVIDIA в OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:31:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA предоставляет API, совместимый с OpenAI, по адресу `https://integrate.api.nvidia.com/v1` для
открытых моделей бесплатно. Выполните аутентификацию с помощью API-ключа из
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
по умолчанию использует для провайдера NVIDIA модель Nemotron 3 Ultra, модель NVIDIA для
рассуждений с общим размером 550B / 55B активных параметров для агентной работы с длинным контекстом.

## Начало работы

<Steps>
  <Step title="Получите API-ключ">
    Создайте API-ключ на [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Экспортируйте ключ и запустите онбординг">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Задайте модель NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
Если передать `--nvidia-api-key` вместо переменной окружения, значение попадет в историю
оболочки и вывод `ps`. По возможности предпочитайте переменную окружения `NVIDIA_API_KEY`.
</Warning>

Для неинтерактивной настройки ключ также можно передать напрямую:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Пример конфигурации

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Рекомендуемый каталог

Когда настроен API-ключ NVIDIA, пути настройки OpenClaw и выбора модели
пытаются использовать публичный каталог рекомендуемых моделей NVIDIA из
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` и
кэшируют ранжированный результат на 24 часа. Поэтому новые рекомендуемые модели с build.nvidia.com
появляются в интерфейсах настройки и выбора модели без ожидания
релиза OpenClaw. Когда доступна живая лента, первая возвращенная модель является
вариантом по умолчанию, отображаемым во время настройки NVIDIA.

Загрузка использует фиксированную политику HTTPS-хоста для `assets.ngc.nvidia.com`. Если
API-ключ NVIDIA не настроен либо этот публичный каталог недоступен или
имеет неверный формат, OpenClaw возвращается к встроенному каталогу и встроенному значению по умолчанию ниже.

## Nemotron 3 Ultra

Nemotron 3 Ultra является моделью NVIDIA по умолчанию в OpenClaw. Страница сборки NVIDIA для
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
указывает ее как доступную бесплатную конечную точку со спецификацией контекста в 1M токенов.
Во встроенном каталоге зафиксирован максимальный вывод 16 384 токена, чтобы соответствовать текущему
примеру запроса NVIDIA, совместимому с OpenAI, для размещенной конечной точки.

Используйте Ultra как вариант NVIDIA по умолчанию с максимальными возможностями. Оставьте Super выбранной, когда
нужен меньший вариант Nemotron 3, или выберите одну из сторонних моделей,
размещенных в каталоге NVIDIA, если их контекст, задержка или поведение подходят лучше.
Встроенная строка Ultra по умолчанию отправляет `chat_template_kwargs.enable_thinking: false` и
`force_nonempty_content: true`, чтобы обычный чат-вывод оставался в
видимом ответе, а не раскрывал текст рассуждений.

## Встроенный резервный каталог

| Идентификатор модели                       | Название                     | Контекст  | Максимальный вывод | Примечания                         |
| ------------------------------------------ | ---------------------------- | --------- | ------------------ | ---------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384             | По умолчанию                       |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192              | Рекомендуемый резервный вариант    |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192              | Рекомендуемый резервный вариант    |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192              | Рекомендуемый резервный вариант    |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192              | Рекомендуемый резервный вариант    |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192              | Устарело, совместимость обновления |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192              | Устарело, совместимость обновления |

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Поведение автоматического включения">
    Провайдер автоматически включается, когда задана переменная окружения `NVIDIA_API_KEY`.
    Явная конфигурация провайдера, кроме ключа, не требуется.
  </Accordion>

  <Accordion title="Каталог и цены">
    OpenClaw предпочитает публичный каталог рекомендуемых моделей NVIDIA, когда настроена
    аутентификация NVIDIA, и кэширует его на 24 часа. Встроенный резервный каталог статичен
    и сохраняет устаревшие поставляемые идентификаторы для совместимости обновления. Стоимость по умолчанию
    равна `0` в исходном коде, поскольку NVIDIA сейчас предлагает бесплатный API-доступ для
    перечисленных моделей.
  </Accordion>

  <Accordion title="Конечная точка, совместимая с OpenAI">
    NVIDIA использует стандартную конечную точку completions `/v1`. Любые инструменты,
    совместимые с OpenAI, должны работать сразу с базовым URL NVIDIA.
  </Accordion>

  <Accordion title="Параметры рассуждений Nemotron 3 Ultra">
    Пример запроса Ultra от NVIDIA использует `chat_template_kwargs.enable_thinking`
    и `reasoning_budget` для вывода рассуждений. Встроенная строка Ultra в OpenClaw
    по умолчанию отключает шаблонное мышление для обычного использования чата. Если нужно
    включить вывод рассуждений NVIDIA или принудительно задать другие специфичные для NVIDIA поля
    запроса, задайте параметры для отдельной модели и держите переопределения провайдера в области
    модели NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` является финальным переопределением тела запроса, совместимого с OpenAI, поэтому
    используйте его только для полей, которые NVIDIA документирует для выбранной конечной точки.

  </Accordion>

  <Accordion title="Медленные ответы пользовательского провайдера">
    Некоторым пользовательским моделям, размещенным у NVIDIA, может требоваться больше времени, чем допускает стандартный сторожевой таймер простоя модели,
    прежде чем они выдадут первый фрагмент ответа. Для пользовательских записей провайдера NVIDIA
    увеличивайте тайм-аут провайдера, а не тайм-аут всего времени выполнения агента:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
Модели NVIDIA сейчас можно использовать бесплатно. Проверяйте
[build.nvidia.com](https://build.nvidia.com/) для получения актуальной информации о доступности и
ограничениях частоты запросов.
</Tip>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, идентификаторов моделей и поведения при отказе.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации для агентов, моделей и провайдеров.
  </Card>
</CardGroup>
