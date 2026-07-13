---
read_when:
    - Вам нужен единый ключ API для множества LLM-моделей
    - Вы хотите запускать модели через OpenRouter в OpenClaw
    - Вы хотите использовать OpenRouter для генерации изображений
    - Вы хотите использовать OpenRouter для генерации музыки
    - Вы хотите использовать OpenRouter для генерации видео
summary: Используйте единый API OpenRouter для доступа ко множеству моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-13T18:41:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter направляет запросы ко множеству моделей через единый API и один ключ. Он
совместим с OpenAI, поэтому OpenClaw взаимодействует с ним через тот же
транспорт в стиле `openai-completions`, который используется для других прокси-провайдеров.

## Начало работы

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Запустите настройку OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw открывает в браузере процесс входа в OpenRouter (PKCE), обменивает
        код на ключ API OpenRouter и сохраняет его в профиле аутентификации
        OpenRouter по умолчанию. На удалённых серверах или серверах без графического интерфейса OpenClaw выводит
        URL для входа и после входа просит вставить URL перенаправления.
      </Step>
      <Step title="(Необязательно) Переключитесь на определённую модель">
        При первоначальной настройке по умолчанию используется `openrouter/auto`. Позже можно выбрать конкретную модель:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Ключ API">
    <Steps>
      <Step title="Получите ключ API">
        Создайте ключ API на странице [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Запустите настройку с ключом API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Необязательно) Переключитесь на определённую модель">
        При первоначальной настройке по умолчанию используется `openrouter/auto`. Позже можно выбрать конкретную модель:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Пример конфигурации

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Ссылки на модели

<Note>
Ссылки на модели соответствуют шаблону `openrouter/<provider>/<model>`. Полный список
доступных провайдеров и моделей см. в разделе [/concepts/model-providers](/ru/concepts/model-providers).
</Note>

Встроенные резервные модели, используемые, когда обнаружение актуального каталога недоступно:

| Ссылка на модель                  | Примечания                           |
| --------------------------------- | ------------------------------------ |
| `openrouter/auto`                 | Автоматическая маршрутизация OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI           |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 через MoonshotAI           |

Любая другая ссылка `openrouter/<provider>/<model>`, включая
`openrouter/openrouter/fusion` (см. [маршрутизатор Fusion](#fusion-router)), разрешается
динамически по актуальному каталогу моделей OpenRouter.

## Генерация изображений

OpenRouter может служить серверной частью инструмента `image_generate`. Укажите модель изображений OpenRouter
в параметре `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw отправляет запросы на генерацию изображений в API изображений OpenRouter для завершения чата с
`modalities: ["image", "text"]`. Модели изображений Gemini также получают
подсказки `aspectRatio` и `resolution` через `image_config` OpenRouter; другие
модели изображений их не получают. Для более медленных моделей используйте `agents.defaults.imageGenerationModel.timeoutMs`;
при этом параметр `timeoutMs` инструмента `image_generate`, указанный для отдельного вызова, по-прежнему имеет приоритет.

## Генерация видео

OpenRouter может служить серверной частью инструмента `video_generate` через свой асинхронный
API `/videos`. Укажите видеомодель OpenRouter в параметре
`agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw отправляет задания на преобразование текста в видео и изображения в видео, опрашивает возвращённый
`polling_url` и загружает готовое видео из `unsigned_urls` OpenRouter
или из конечной точки содержимого задания. По умолчанию эталонные изображения используются
как первый или последний кадр; изображения с тегом `reference_image` вместо этого отправляются как входные
эталонные изображения. Встроенное значение по умолчанию `google/veo-3.1-fast` поддерживает длительность 4/6/8
секунд, разрешения `720P`/`1080P` и соотношения сторон `16:9`/`9:16`.
Преобразование видео в видео не поддерживается: вышестоящий API принимает только текстовые ссылки и ссылки
на изображения.

## Генерация музыки

OpenRouter может служить серверной частью инструмента `music_generate` через аудиовывод
завершения чата. Укажите аудиомодель OpenRouter в параметре
`agents.defaults.musicGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Встроенный музыкальный провайдер OpenRouter по умолчанию использует `google/lyria-3-pro-preview`
и также предоставляет `google/lyria-3-clip-preview`. OpenClaw отправляет `modalities:
["text", "audio"]`, принимает ответ в потоковом режиме, собирает фрагменты аудио и сохраняет
результат как сгенерированный медиафайл для доставки в канал. Модели Lyria принимают одно
эталонное изображение через общий параметр `music_generate image=...`.
Потоковое аудио, хранение расшифровки и производная оболочка событий SSE
ограничиваются параметром `agents.defaults.mediaMaxMb` (ограничение аудио по умолчанию составляет 16 MB).

## Преобразование текста в речь

OpenRouter может выступать в качестве провайдера TTS через свой совместимый с OpenAI
эндпоинт `/audio/speech`.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Если `messages.tts.providers.openrouter.apiKey` не указан, TTS последовательно использует резервные варианты
`models.providers.openrouter.apiKey`, а затем `OPENROUTER_API_KEY`.

## Преобразование речи в текст (входящее аудио)

OpenRouter может транскрибировать входящие голосовые и аудиовложения через общий
путь `tools.media.audio`, используя свой эндпоинт STT (`/audio/transcriptions`).
Это применимо к любому плагину канала, который передаёт входящий голос или аудио
на предварительный этап распознавания медиаданных.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw отправляет запросы STT в OpenRouter в формате JSON с аудио в кодировке base64
в поле `input_audio` (согласно контракту STT OpenRouter), а не как загрузки
форм OpenAI в формате multipart.

## Маршрутизатор Fusion

OpenRouter Fusion параллельно отправляет одну ссылку на модель OpenClaw нескольким
моделям OpenRouter, поручает OpenRouter оценить их ответы и возвращает один итоговый
ответ через обычный эндпоинт OpenRouter. Идентификатор вышестоящей модели —
`openrouter/fusion`, поэтому ссылка на модель OpenClaw содержит как префикс
провайдера OpenClaw, так и пространство имён вышестоящего OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Настройте панель и модель-судью Fusion через `params.extraBody` модели;
эти поля напрямую передаются в тело запроса chat-completions OpenRouter.
Fusion работает как с OAuth, так и с подключением по API-ключу; если вы
используете OAuth, опустите строку `env.OPENROUTER_API_KEY` ниже.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` — параллельная панель; `model` в конфигурации
плагина Fusion — модель-судья. В обычных запусках агента и чата не задавайте
верхнеуровневому `tool_choice` значение `"required"`, пытаясь
принудительно включить Fusion: запросы OpenClaw могут содержать собственные
определения инструментов, и обязательный выбор инструмента верхнего уровня может
выбрать один из них вместо маршрутизатора Fusion. При наличии этой конфигурации
плагина Fusion OpenClaw добавляет в системный промпт очищенную заметку со списком
настроенных моделей анализа и модели-судьи, чтобы агент мог отвечать на вопросы
о собственной панели Fusion. Другие поля `extraBody` в промпт не копируются.

Fusion намеренно работает медленнее: OpenRouter распределяет промпт между
несколькими моделями анализа, а затем выполняет этап оценки и синтеза, поэтому
задержка выше, чем при прямом запросе к одной модели. Используйте его для
взвешенных высококачественных ответов или сценариев эскалации, а не как вариант
по умолчанию для задач, чувствительных к задержке. Сохраняйте панель небольшой
и выбирайте более быстрые модели анализа и модель-судью, чтобы ускорить ответы.

Проверьте настроенную ссылку однократным локальным вызовом:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Аутентификация и заголовки

OpenRouter использует Bearer-токен из вашего API-ключа. OAuth OpenRouter — это
процесс входа с PKCE, который выдаёт API-ключ OpenRouter, поэтому OpenClaw
сохраняет результат в том же профиле аутентификации по API-ключу
`openrouter:default`, который используется при ручной настройке API-ключа.

Чтобы войти или заменить сохранённый ключ в существующей установке без повторного
прохождения полной первоначальной настройки:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

В проверенные запросы OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw добавляет
документированные заголовки атрибуции приложения OpenRouter:

| Заголовок                 | Значение                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`        | `https://openclaw.ai`                                                                                     |
| `X-OpenRouter-Title`        | `OpenClaw`                                                                                     |
| `X-OpenRouter-Categories`        | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent`                                                                                     |

<Warning>
Если перенаправить провайдер OpenRouter на другой прокси-сервер или базовый URL,
OpenClaw **не** добавляет эти специфичные для OpenRouter заголовки или маркеры
кэша Anthropic.
</Warning>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Кэширование ответов">
    Кэширование ответов OpenRouter включается явно. Включите его отдельно для каждой модели:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw отправляет `X-OpenRouter-Cache: true` и, если настроено,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` принудительно обновляет
    ответ для текущего запроса и сохраняет новый ответ. Также принимаются
    псевдонимы в snake_case (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`), а также `responseCacheTtl` /
    `response_cache_ttl` без суффикса `Seconds`.

    Это не связано с кэшированием промптов у провайдера и с маркерами Anthropic
    `cache_control` в OpenRouter. Эта возможность применяется только к
    проверенным маршрутам `openrouter.ai`, но не к пользовательским базовым
    URL прокси-серверов.

  </Accordion>

  <Accordion title="Маркеры кэша Anthropic">
    На проверенных маршрутах OpenRouter ссылки на модели Anthropic сохраняют
    маркеры Anthropic `cache_control` из OpenRouter для более эффективного
    повторного использования кэша промптов в блоках системных промптов и промптов
    разработчика.
  </Accordion>

  <Accordion title="Предварительное заполнение рассуждений Anthropic">
    На проверенных маршрутах OpenRouter для ссылок на модели Anthropic с включённым
    рассуждением завершающие реплики предварительного заполнения ассистента удаляются
    до отправки запроса в OpenRouter, что соответствует требованию Anthropic:
    диалоги с рассуждением должны завершаться репликой пользователя.
  </Accordion>

  <Accordion title="Внедрение рассуждений">
    На поддерживаемых маршрутах, отличных от `auto`, OpenClaw сопоставляет выбранный уровень рассуждений
    с данными рассуждений прокси OpenRouter. `openrouter/auto` и неподдерживаемые
    указания моделей пропускают это внедрение. Устаревшие ссылки `openrouter/hunter-alpha` также
    пропускают его, поскольку на этом выведенном из эксплуатации маршруте OpenRouter мог возвращать текст окончательного ответа
    в полях рассуждений.
  </Accordion>

  <Accordion title="Повторное воспроизведение рассуждений DeepSeek V4">
    На проверенных маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` и
    `openrouter/deepseek/deepseek-v4-pro` заполняют отсутствующее значение `reasoning_content` в
    повторно воспроизводимых ходах ассистента, сохраняя диалоги с рассуждениями и инструментами в требуемом
    DeepSeek V4 формате последующих сообщений. Для этих маршрутов OpenClaw отправляет поддерживаемые OpenRouter
    значения `reasoning.effort`: `xhigh`/`max` сопоставляются с `xhigh`,
    а любой другой включённый уровень — с `high`.
  </Accordion>

  <Accordion title="Формирование запросов только для OpenAI">
    OpenRouter работает через совместимый с OpenAI путь в стиле прокси, поэтому специфичное
    для нативного OpenAI формирование запросов, такое как `serviceTier`, Responses `store`,
    данные совместимости рассуждений OpenAI и указания для кэша промптов, не перенаправляется.
  </Accordion>

  <Accordion title="Маршруты на базе Gemini">
    Ссылки OpenRouter на базе Gemini остаются на прокси-пути Gemini: OpenClaw сохраняет
    там очистку сигнатур рассуждений Gemini, но не включает нативную
    проверку повторного воспроизведения Gemini или преобразования начальной загрузки.
  </Accordion>

  <Accordion title="Метаданные маршрутизации провайдера">
    OpenRouter поддерживает объект запроса `provider` для маршрутизации через нижележащих
    провайдеров. Настройте политику по умолчанию для всех запросов к текстовым моделям OpenRouter
    с помощью `models.providers.openrouter.params.provider`:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw передаёт этот объект в OpenRouter как данные запроса `provider`.
    Используйте документированные OpenRouter поля в формате snake_case, включая `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` и `enforce_distillable_text`.

    Параметры отдельных моделей переопределяют общий для провайдера объект маршрутизации:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Это применяется только к маршрутам завершения чата OpenRouter. Прямые маршруты Anthropic,
    Google, OpenAI и пользовательских провайдеров игнорируют параметры маршрутизации OpenRouter.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации агентов, моделей и провайдеров.
  </Card>
</CardGroup>
