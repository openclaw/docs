---
read_when:
    - Вам нужен один API-ключ для множества LLMs
    - Вы хотите запускать модели через OpenRouter в OpenClaw
    - Вы хотите использовать OpenRouter для генерации изображений
    - Вы хотите использовать OpenRouter для генерации музыки
    - Вы хотите использовать OpenRouter для генерации видео
summary: Используйте единый API OpenRouter для доступа ко многим моделям в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:51:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter предоставляет **унифицированный API**, который маршрутизирует запросы ко многим моделям через одну
конечную точку и ключ API. Он совместим с OpenAI, поэтому большинство OpenAI SDK работают после смены базового URL.

## Начало работы

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run OAuth onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw открывает браузерный поток входа OpenRouter, обменивает код
        PKCE на ключ API OpenRouter и сохраняет этот ключ в профиле
        аутентификации OpenRouter по умолчанию. На удаленных хостах или хостах без графического интерфейса OpenClaw выводит
        URL входа и просит вставить URL перенаправления после входа.
      </Step>
      <Step title="(Optional) Switch to a specific model">
        При онбординге по умолчанию используется `openrouter/auto`. Конкретную модель можно выбрать позже:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get your API key">
        Создайте ключ API на [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Run API-key onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Optional) Switch to a specific model">
        При онбординге по умолчанию используется `openrouter/auto`. Конкретную модель можно выбрать позже:

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
Ссылки на модели используют шаблон `openrouter/<provider>/<model>`. Полный список
доступных провайдеров и моделей см. в [/concepts/model-providers](/ru/concepts/model-providers).
</Note>

Встроенные примеры резервных вариантов:

| Ссылка на модель                 | Примечания                          |
| --------------------------------- | ----------------------------------- |
| `openrouter/auto`                 | Автоматическая маршрутизация OpenRouter |
| `openrouter/openrouter/fusion`    | Маршрутизатор OpenRouter Fusion     |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI          |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 через MoonshotAI          |

## Генерация изображений

OpenRouter также может обслуживать инструмент `image_generate`. Используйте модель изображений OpenRouter в `agents.defaults.imageGenerationModel`:

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

OpenClaw отправляет запросы изображений в API изображений chat completions OpenRouter с `modalities: ["image", "text"]`. Модели изображений Gemini получают поддерживаемые подсказки `aspectRatio` и `resolution` через `image_config` OpenRouter. Используйте `agents.defaults.imageGenerationModel.timeoutMs` для более медленных моделей изображений OpenRouter; параметр `timeoutMs` инструмента `image_generate` для отдельного вызова все равно имеет приоритет.

## Генерация видео

OpenRouter также может обслуживать инструмент `video_generate` через свой асинхронный API `/videos`. Используйте модель видео OpenRouter в `agents.defaults.videoGenerationModel`:

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

OpenClaw отправляет задания text-to-video и image-to-video в OpenRouter, опрашивает
возвращенный `polling_url` и скачивает готовое видео из
`unsigned_urls` OpenRouter или документированной конечной точки содержимого задания.
Эталонные изображения по умолчанию отправляются как изображения первого/последнего кадра; изображения,
помеченные `reference_image`, отправляются как входные ссылки OpenRouter. Встроенный
вариант по умолчанию `google/veo-3.1-fast` объявляет поддерживаемые на данный момент длительности 4/6/8
секунд, разрешения `720P`/`1080P` и соотношения сторон `16:9`/`9:16`.
Video-to-video не зарегистрирован для OpenRouter, потому что вышестоящий
API генерации видео сейчас принимает текст и ссылки на изображения.

## Генерация музыки

OpenRouter также может обслуживать инструмент `music_generate` через аудиовывод
chat completions. Используйте аудиомодель OpenRouter в
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

Встроенный музыкальный провайдер OpenRouter по умолчанию использует
`google/lyria-3-pro-preview` и также предоставляет
`google/lyria-3-clip-preview`. OpenClaw отправляет `modalities: ["text",
"audio"]`, включает потоковую передачу, собирает потоковые аудиофрагменты и сохраняет
результат как сгенерированное медиа для доставки в канал. Эталонные изображения
принимаются для моделей Lyria через общий параметр `music_generate image=...`.

## Преобразование текста в речь

OpenRouter также можно использовать как провайдера TTS через его совместимую с OpenAI
конечную точку `/audio/speech`.

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

Если `messages.tts.providers.openrouter.apiKey` опущен, TTS повторно использует
`models.providers.openrouter.apiKey`, затем `OPENROUTER_API_KEY`.

## Распознавание речи (входящее аудио)

OpenRouter может транскрибировать входящие голосовые/аудиовложения через общий
путь `tools.media.audio`, используя свою конечную точку STT (`/audio/transcriptions`).
Это применяется к любому Plugin канала, который передает входящий голос/аудио в
предварительную обработку понимания медиа.

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

OpenClaw отправляет STT-запросы OpenRouter как JSON с аудио в base64 в
`input_audio` (контракт OpenRouter STT), а не как multipart-загрузки форм OpenAI.

## Маршрутизатор Fusion

Используйте OpenRouter Fusion, когда хотите, чтобы одна ссылка на модель OpenClaw обращалась к нескольким
моделям OpenRouter параллельно, OpenRouter оценивал их ответы и возвращал
единый итоговый ответ через обычную конечную точку провайдера OpenRouter. Поскольку
слаг вышестоящей модели — `openrouter/fusion`, ссылка на модель OpenClaw включает
и префикс провайдера OpenClaw, и вышестоящее пространство имен OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Настройте панель и судью Fusion через `params.extraBody` модели. Эти
поля передаются в тело запроса chat-completions OpenRouter. Fusion
работает как с онбордингом OpenRouter OAuth, так и с онбордингом по ключу API; если вы используете
OAuth, уберите строку `env.OPENROUTER_API_KEY` из примера ниже.

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

Список `analysis_models` — это параллельная панель, а `model` внутри конфигурации Plugin
Fusion — модель-судья. Не задавайте верхнеуровневый `tool_choice` как
`"required"` в обычных агентских/чат-ходах OpenClaw, пытаясь принудительно использовать Fusion;
ходы OpenClaw могут включать определения инструментов OpenClaw, и верхнеуровневый обязательный
выбор инструмента может потребовать один из этих инструментов вместо маршрутизатора Fusion. Когда
эта конфигурация Plugin Fusion присутствует, OpenClaw также добавляет очищенную
заметку системного промпта с настроенными моделями анализа и моделью-судьей, чтобы
агент мог отвечать на вопросы о своей текущей панели Fusion. Другие поля `extraBody`
не копируются в промпт.

Fusion по замыслу работает медленнее. OpenRouter может отправить один и тот же промпт OpenClaw
нескольким моделям анализа, а затем выполнить финальный шаг судейства/синтеза, поэтому задержка
обычно выше, чем при прямом запросе к одной модели. Используйте Fusion для продуманных,
качественных ответов или путей эскалации, а не как вариант по умолчанию для
чата, чувствительного к задержке. Для более быстрых ответов оставляйте панель небольшой и выбирайте
более быстрые модели анализа и судейства.

Проверьте настроенную ссылку одноразовым локальным вызовом модели:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Аутентификация и заголовки

OpenRouter внутри использует Bearer-токен с вашим ключом API. OpenRouter
OAuth — это поток входа PKCE, который выдает ключ API OpenRouter, поэтому OpenClaw сохраняет
результат как тот же профиль аутентификации по ключу API `openrouter:default`, который используется
ручным путем настройки ключа API.

Для существующей установки выполните вход или ротируйте сохраненный ключ OpenRouter без
повторного полного онбординга:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Используйте `openclaw models auth login --provider openrouter --method api-key`, когда
хотите вставить ключ, созданный вручную в OpenRouter.

В реальных запросах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw также добавляет
документированные заголовки атрибуции приложения OpenRouter:

| Заголовок                 | Значение                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Если вы перенаправите провайдера OpenRouter на другой прокси или базовый URL, OpenClaw
**не** внедряет эти специфичные для OpenRouter заголовки или маркеры кэша Anthropic.
</Warning>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Response caching">
    Кэширование ответов OpenRouter включается явно. Включите его для каждой модели OpenRouter
    через параметры модели:

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
    текущий запрос и сохраняет заменяющий ответ. Также принимаются алиасы в snake_case
    (`response_cache`, `response_cache_ttl_seconds` и
    `response_cache_clear`).

    Это отдельно от кэширования промптов провайдера и от маркеров
    Anthropic `cache_control` OpenRouter. Применяется только на проверенных
    маршрутах `openrouter.ai`, а не на пользовательских базовых URL прокси.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    На проверенных маршрутах OpenRouter ссылки на модели Anthropic сохраняют
    специфичные для OpenRouter маркеры Anthropic `cache_control`, которые OpenClaw использует для
    лучшего повторного использования кэша промптов на блоках системных/разработческих промптов.
  </Accordion>

  <Accordion title="Предзаполнение рассуждений Anthropic">
    На проверенных маршрутах OpenRouter ссылки на модели Anthropic с включенными рассуждениями
    удаляют завершающие ходы предварительного заполнения assistant до того, как запрос достигает OpenRouter,
    что соответствует требованию Anthropic: диалоги с рассуждениями должны заканчиваться ходом
    пользователя.
  </Accordion>

  <Accordion title="Инъекция мышления / рассуждений">
    На поддерживаемых маршрутах, отличных от `auto`, OpenClaw сопоставляет выбранный уровень мышления с
    полезными нагрузками рассуждений прокси OpenRouter. Неподдерживаемые подсказки моделей и
    `openrouter/auto` пропускают эту инъекцию рассуждений. Hunter Alpha также пропускает
    прокси-рассуждения для устаревших настроенных ссылок на модели, потому что OpenRouter мог
    возвращать текст финального ответа в полях рассуждений для этого выведенного из эксплуатации маршрута.
  </Accordion>

  <Accordion title="Повтор рассуждений DeepSeek V4">
    На проверенных маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` и
    `openrouter/deepseek/deepseek-v4-pro` заполняют отсутствующее `reasoning_content` в
    повторно воспроизведенных ходах assistant, чтобы диалоги с мышлением/инструментами сохраняли требуемую DeepSeek V4
    форму продолжения. OpenClaw отправляет поддерживаемые OpenRouter
    значения `reasoning.effort` для этих маршрутов; более низкие уровни, отличные от off, сопоставляются с
    `high`, а устаревшие переопределения `max` сопоставляются с `xhigh`.
  </Accordion>

  <Accordion title="Формирование запросов только для OpenAI">
    OpenRouter по-прежнему проходит через прокси-стиль OpenAI-совместимого пути, поэтому
    нативное формирование запросов только для OpenAI, такое как `serviceTier`, Responses `store`,
    полезные нагрузки совместимости рассуждений OpenAI и подсказки кэша промптов, не пересылается.
  </Accordion>

  <Accordion title="Маршруты на базе Gemini">
    Ссылки OpenRouter на базе Gemini остаются на прокси-пути Gemini: OpenClaw сохраняет
    там очистку сигнатур мыслей Gemini, но не включает нативную проверку повтора Gemini
    или переписывания начальной загрузки.
  </Accordion>

  <Accordion title="Метаданные маршрутизации провайдера">
    OpenRouter поддерживает объект запроса `provider` для маршрутизации базового провайдера.
    Настройте политику по умолчанию для всех запросов текстовых моделей OpenRouter
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

    OpenClaw пересылает этот объект в OpenRouter как полезную нагрузку запроса `provider`.
    Используйте документированные OpenRouter поля в snake_case, включая `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` и `enforce_distillable_text`.

    Параметры отдельных моделей по-прежнему переопределяют объект маршрутизации на уровне провайдера:

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

    Это применяется только на маршрутах chat-completions OpenRouter. Прямые маршруты Anthropic,
    Google, OpenAI или пользовательских провайдеров игнорируют параметры маршрутизации OpenRouter.

  </Accordion>
</AccordionGroup>

## Связанное

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Справочник конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник конфигурации для агентов, моделей и провайдеров.
  </Card>
</CardGroup>
