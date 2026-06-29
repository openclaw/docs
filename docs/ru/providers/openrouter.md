---
read_when:
    - Вам нужен единый API-ключ для множества LLM
    - Вы хотите запускать модели через OpenRouter в OpenClaw
    - Вы хотите использовать OpenRouter для генерации изображений
    - Вы хотите использовать OpenRouter для генерации музыки
    - Вы хотите использовать OpenRouter для генерации видео
summary: Используйте единый API OpenRouter для доступа ко многим моделям в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-06-28T23:39:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter предоставляет **унифицированный API**, который маршрутизирует запросы ко множеству моделей за одним
endpoint и ключом API. Он совместим с OpenAI, поэтому большинство SDK OpenAI работают после смены базового URL.

## Начало работы

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Запустите OAuth-онбординг">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw открывает браузерный поток входа OpenRouter, обменивает код
        PKCE на ключ API OpenRouter и сохраняет этот ключ в стандартном
        профиле аутентификации OpenRouter. На удаленных/безголовых хостах OpenClaw печатает
        URL входа и просит вставить URL перенаправления после входа.
      </Step>
      <Step title="(Необязательно) Переключитесь на конкретную модель">
        Онбординг по умолчанию использует `openrouter/auto`. Позже выберите конкретную модель:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Ключ API">
    <Steps>
      <Step title="Получите ключ API">
        Создайте ключ API на [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Запустите онбординг с ключом API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Необязательно) Переключитесь на конкретную модель">
        Онбординг по умолчанию использует `openrouter/auto`. Позже выберите конкретную модель:

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

## Идентификаторы моделей

<Note>
Идентификаторы моделей следуют шаблону `openrouter/<provider>/<model>`. Полный список
доступных провайдеров и моделей см. в [/concepts/model-providers](/ru/concepts/model-providers).
</Note>

Встроенные резервные примеры:

| Идентификатор модели             | Примечания                                |
| -------------------------------- | ----------------------------------------- |
| `openrouter/auto`                | Автоматическая маршрутизация OpenRouter   |
| `openrouter/openrouter/fusion`   | Маршрутизатор OpenRouter Fusion           |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI               |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 через MoonshotAI               |

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

OpenClaw отправляет запросы изображений в API изображений chat completions OpenRouter с `modalities: ["image", "text"]`. Модели изображений Gemini получают поддерживаемые подсказки `aspectRatio` и `resolution` через `image_config` OpenRouter. Используйте `agents.defaults.imageGenerationModel.timeoutMs` для более медленных моделей изображений OpenRouter; параметр `timeoutMs` для отдельного вызова инструмента `image_generate` по-прежнему имеет приоритет.

## Генерация видео

OpenRouter также может обслуживать инструмент `video_generate` через свой асинхронный API `/videos`. Используйте видеомодель OpenRouter в `agents.defaults.videoGenerationModel`:

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
`unsigned_urls` OpenRouter или документированного endpoint содержимого задания.
Эталонные изображения по умолчанию отправляются как изображения первого/последнего кадра; изображения
с тегом `reference_image` отправляются как входные ссылки OpenRouter. Встроенное
значение по умолчанию `google/veo-3.1-fast` объявляет текущие поддерживаемые длительности 4/6/8
секунд, разрешения `720P`/`1080P` и соотношения сторон `16:9`/`9:16`.
Video-to-video не зарегистрирован для OpenRouter, потому что upstream
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
результат как сгенерированные медиа для доставки в канал. Эталонные изображения
принимаются для моделей Lyria через общий параметр `music_generate image=...`.

## Text-to-speech

OpenRouter также можно использовать как TTS-провайдера через его совместимый с OpenAI
endpoint `/audio/speech`.

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

Если `messages.tts.providers.openrouter.apiKey` не указан, TTS повторно использует
`models.providers.openrouter.apiKey`, затем `OPENROUTER_API_KEY`.

## Speech-to-text (входящее аудио)

OpenRouter может транскрибировать входящие голосовые/аудиовложения через общий
путь `tools.media.audio`, используя свой STT endpoint (`/audio/transcriptions`).
Это применяется к любому channel Plugin, который передает входящий голос/аудио в
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

OpenClaw отправляет STT-запросы OpenRouter как JSON с аудио base64 в
`input_audio` (контракт STT OpenRouter), а не как multipart-загрузки форм OpenAI.

## Маршрутизатор Fusion

Используйте OpenRouter Fusion, когда хотите, чтобы один идентификатор модели OpenClaw запрашивал несколько
моделей OpenRouter параллельно, OpenRouter оценивал их ответы и возвращал
единый финальный ответ через обычный endpoint провайдера OpenRouter. Поскольку
upstream slug модели — `openrouter/fusion`, идентификатор модели OpenClaw включает
и префикс провайдера OpenClaw, и upstream namespace OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Настройте панель и судью Fusion через `params.extraBody` модели. Эти
поля передаются в тело запроса chat-completions OpenRouter. Fusion
работает как с OAuth-онбордингом OpenRouter, так и с онбордингом по ключу API; если вы используете
OAuth, опустите строку `env.OPENROUTER_API_KEY` из примера ниже.

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

Список `analysis_models` — это параллельная панель, а `model` внутри конфигурации
Plugin Fusion — модель-судья. Не задавайте верхнеуровневый `tool_choice` как
`"required"` в обычных agent/chat-ходах OpenClaw, пытаясь принудительно включить Fusion;
ходы OpenClaw могут включать определения инструментов OpenClaw, и верхнеуровневый обязательный
выбор инструмента может потребовать один из этих инструментов вместо маршрутизатора Fusion. Когда
эта конфигурация Plugin Fusion присутствует, OpenClaw также добавляет очищенную
заметку в system prompt с настроенными моделями анализа и моделью-судьей, чтобы
агент мог отвечать на вопросы о своей текущей панели Fusion. Другие поля `extraBody`
не копируются в prompt.

Fusion намеренно медленнее. OpenRouter может отправить один и тот же prompt OpenClaw
нескольким моделям анализа, а затем выполнить финальный шаг оценки/синтеза, поэтому задержка
обычно выше, чем у прямого запроса к одной модели. Используйте Fusion для продуманных,
высококачественных ответов или путей эскалации, а не как значение по умолчанию для
чата, чувствительного к задержке. Для более быстрых ответов держите панель небольшой и выбирайте
более быстрые модели анализа и судьи.

Проверьте настроенный идентификатор одноразовым локальным вызовом модели:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Аутентификация и заголовки

OpenRouter под капотом использует Bearer-токен с вашим ключом API. OpenRouter
OAuth — это поток входа PKCE, который выдает ключ API OpenRouter, поэтому OpenClaw сохраняет
результат как тот же профиль аутентификации ключа API `openrouter:default`, который используется
путем ручной настройки ключа API.

Для существующей установки войдите или замените сохраненный ключ OpenRouter без
повторного полного онбординга:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Используйте `openclaw models auth login --provider openrouter --method api-key`, когда
хотите вставить ключ, созданный вручную в OpenRouter.

В реальных запросах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw также добавляет
документированные заголовки OpenRouter для атрибуции приложения:

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
  <Accordion title="Кэширование ответов">
    Кэширование ответов OpenRouter включается явно. Включите его для каждой модели OpenRouter с помощью
    параметров модели:

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
    текущий запрос и сохраняет заменяющий ответ. Также принимаются snake_case-алиасы
    (`response_cache`, `response_cache_ttl_seconds` и
    `response_cache_clear`).

    Это отдельно от кэширования prompt провайдера и от маркеров
    Anthropic `cache_control` OpenRouter. Оно применяется только на проверенных
    маршрутах `openrouter.ai`, а не на базовых URL пользовательских прокси.

  </Accordion>

  <Accordion title="Маркеры кэша Anthropic">
    На проверенных маршрутах OpenRouter идентификаторы моделей Anthropic сохраняют
    специфичные для OpenRouter маркеры Anthropic `cache_control`, которые OpenClaw использует для
    лучшего повторного использования prompt cache в блоках system/developer prompt.
  </Accordion>

  <Accordion title="Предзаполнение рассуждений Anthropic">
    На проверенных маршрутах OpenRouter ссылки на модели Anthropic с включенными рассуждениями
    удаляют завершающие ходы предзаполнения ассистента до того, как запрос дойдет до OpenRouter,
    что соответствует требованию Anthropic: диалоги с рассуждениями должны завершаться ходом
    пользователя.
  </Accordion>

  <Accordion title="Внедрение thinking / reasoning">
    На поддерживаемых маршрутах, отличных от `auto`, OpenClaw сопоставляет выбранный уровень thinking с
    полезными нагрузками рассуждений прокси OpenRouter. Неподдерживаемые подсказки моделей и
    `openrouter/auto` пропускают это внедрение рассуждений. Hunter Alpha также пропускает
    прокси-рассуждения для устаревших настроенных ссылок на модели, потому что OpenRouter мог
    возвращать текст финального ответа в полях рассуждений для этого выведенного из эксплуатации маршрута.
  </Accordion>

  <Accordion title="Повтор рассуждений DeepSeek V4">
    На проверенных маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` и
    `openrouter/deepseek/deepseek-v4-pro` заполняют отсутствующий `reasoning_content` в
    повторно воспроизводимых ходах ассистента, чтобы диалоги с thinking/инструментами сохраняли
    требуемую для DeepSeek V4 форму последующего ответа. OpenClaw отправляет поддерживаемые OpenRouter
    значения `reasoning_effort` для этих маршрутов; `xhigh` является самым высоким заявленным
    уровнем, а устаревшие переопределения `max` сопоставляются с `xhigh`.
  </Accordion>

  <Accordion title="Формирование запросов только для OpenAI">
    OpenRouter по-прежнему проходит через прокси-путь, совместимый с OpenAI, поэтому
    нативное формирование запросов только для OpenAI, такое как `serviceTier`, Responses `store`,
    полезные нагрузки совместимости рассуждений OpenAI и подсказки кэша промптов, не пересылается.
  </Accordion>

  <Accordion title="Маршруты на базе Gemini">
    Ссылки OpenRouter на базе Gemini остаются на прокси-Gemini пути: OpenClaw сохраняет
    там очистку сигнатур мыслей Gemini, но не включает нативную проверку воспроизведения Gemini
    или перезаписи начальной инициализации.
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

    OpenClaw пересылает этот объект в OpenRouter как полезную нагрузку `provider` запроса.
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

    Это применяется только к маршрутам chat-completions OpenRouter. Прямые маршруты Anthropic,
    Google, OpenAI или пользовательских провайдеров игнорируют параметры маршрутизации OpenRouter.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации для агентов, моделей и провайдеров.
  </Card>
</CardGroup>
