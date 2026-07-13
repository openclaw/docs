---
read_when:
    - Вы хотите бесплатно использовать открытые модели в OpenClaw
    - Необходимо настроить NVIDIA_API_KEY
    - Вы хотите использовать Nemotron 3 Ultra через NVIDIA
summary: Использование API NVIDIA, совместимого с OpenAI, в OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-13T18:41:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA бесплатно предоставляет открытые модели через API, совместимый с OpenAI, по адресу
`https://integrate.api.nvidia.com/v1`; для аутентификации используется ключ API с сайта
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). По умолчанию OpenClaw
использует для провайдера NVIDIA модель Nemotron 3 Ultra — модель рассуждений NVIDIA
с 550 млрд параметров всего и 55 млрд активных параметров, предназначенную для агентных
задач с длинным контекстом.

## Начало работы

<Steps>
  <Step title="Получите ключ API">
    Создайте ключ API на сайте [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Экспортируйте ключ и запустите первоначальную настройку">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Выберите модель NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

Для неинтерактивной настройки передайте ключ напрямую:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` сохраняет ключ в истории командной оболочки и выводе `ps`. По возможности используйте
переменную окружения `NVIDIA_API_KEY`.
</Warning>

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

Когда настроен ключ API NVIDIA, при первоначальной настройке и выборе модели
загружается публичный каталог рекомендуемых моделей NVIDIA из
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json`, а
результат кэшируется на 24 часа (первые 32 записи импортируются как строки
с текстовым вводом без дополнительной обработки). Поэтому новые рекомендуемые модели с build.nvidia.com появляются при первоначальной настройке
и на экранах выбора моделей без необходимости ждать выпуска новой версии OpenClaw. Когда
динамический канал данных доступен, первая возвращённая модель предварительно выбирается
при настройке NVIDIA.

Для загрузки применяется фиксированная политика HTTPS-хоста для `assets.ngc.nvidia.com`. Если
ключ API NVIDIA не настроен либо канал данных недоступен или имеет некорректный формат,
OpenClaw использует приведённые ниже встроенный каталог и модель по умолчанию.

## Nemotron 3 Ultra

Nemotron 3 Ultra — модель NVIDIA по умолчанию в OpenClaw. На странице NVIDIA
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
она указана как доступная бесплатная конечная точка со спецификацией контекста на 1 млн токенов.

Встроенная запись Ultra по умолчанию отправляет
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`,
чтобы обычный ответ чата оставался в видимой части ответа, а текст рассуждений
не раскрывался.

Используйте Ultra как модель NVIDIA по умолчанию с максимальными возможностями. Оставьте выбранной Super, если
вам нужна уменьшенная версия Nemotron 3, или выберите одну из сторонних моделей,
размещённых в каталоге NVIDIA, если её контекст, задержка или поведение подходят лучше.

## Встроенный резервный каталог

Доступные для выбора встроенные записи представляют собой снимок каталога рекомендуемых моделей NVIDIA. Устаревшие
записи совместимости по-прежнему доступны по точной ссылке на модель, но не отображаются в средствах
выбора моделей.

| Ссылка на модель                           | Название              | Контекст  | Максимальный вывод |
| ------------------------------------------ | --------------------- | --------- | ------------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192              |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192              |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192              |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192              |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192              |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384             |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384             |

Полный каталог совместимости также сохраняет следующие ранее выпущенные ссылки на модели для существующих
конфигураций: `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` и
`nvidia/minimaxai/minimax-m2.7`. Они по-прежнему доступны по точной ссылке, но
никогда не отображаются при первоначальной настройке или в средствах выбора моделей.

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Автоматическое включение">
    Провайдер включается автоматически, если задана переменная окружения `NVIDIA_API_KEY`
    или ключ был сохранён во время первоначальной настройки. Помимо ключа, явная конфигурация провайдера
    не требуется.
  </Accordion>

  <Accordion title="Каталог и стоимость">
    При настроенной аутентификации NVIDIA OpenClaw предпочитает публичный каталог рекомендуемых моделей NVIDIA
    и кэширует его на 24 часа. Встроенный резервный каталог доступных для выбора моделей —
    статический снимок каталога рекомендуемых моделей NVIDIA; устаревшие записи совместимости,
    доступные по точной ссылке, скрыты из средств выбора моделей. В исходном коде стоимость по умолчанию равна `0`,
    поскольку NVIDIA в настоящее время предоставляет бесплатный доступ через API к перечисленным моделям.
  </Accordion>

  <Accordion title="Конечная точка, совместимая с OpenAI">
    OpenClaw взаимодействует с NVIDIA через адаптер `openai-completions`, используя
    стандартный маршрут завершений чата `/v1`. Любые инструменты, совместимые с OpenAI, должны
    работать без дополнительной настройки с базовым URL NVIDIA.
  </Accordion>

  <Accordion title="Параметры рассуждений Nemotron 3 Ultra">
    В примере запроса Ultra от NVIDIA для вывода рассуждений используются `chat_template_kwargs.enable_thinking`
    и `reasoning_budget`. Встроенная запись Ultra в OpenClaw
    по умолчанию отключает рассуждения в шаблоне для обычного чата. Если вам нужно
    включить вывод рассуждений NVIDIA или принудительно задать другие поля запроса,
    специфичные для NVIDIA, настройте параметры конкретной модели и ограничьте переопределения провайдера
    моделью NVIDIA:

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

    `params.chat_template_kwargs` объединяется с уже имеющимся в запросе объектом
    `chat_template_kwargs`, а не заменяет его целиком.
    `params.extra_body` — окончательное переопределение тела запроса, совместимого с OpenAI,
    которое заменяет конфликтующие ключи полезной нагрузки, поэтому используйте его только для полей,
    документированных NVIDIA для выбранной конечной точки.

  </Accordion>

  <Accordion title="Медленные ответы пользовательского провайдера">
    Некоторым пользовательским моделям, размещённым NVIDIA, может потребоваться больше времени, чем предусмотрено
    таймером бездействия модели по умолчанию (~120 с), прежде чем они отправят первый фрагмент ответа. Для пользовательских
    записей провайдера NVIDIA увеличьте тайм-аут провайдера, а не всего
    времени выполнения агента; `timeoutSeconds` распространяется на HTTP-запросы провайдера и
    повышает предел таймера бездействия и потоковой передачи для этого провайдера:

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
В настоящее время модели NVIDIA можно использовать бесплатно. Актуальные сведения о доступности и
ограничениях частоты запросов см. на сайте
[build.nvidia.com](https://build.nvidia.com/).
</Tip>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации агентов, моделей и провайдеров.
  </Card>
</CardGroup>
