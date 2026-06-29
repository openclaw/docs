---
read_when:
    - Вы хотите использовать модели Grok в OpenClaw
    - Вы настраиваете аутентификацию xAI или идентификаторы моделей
summary: Использование моделей xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-28T23:41:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw поставляется со встроенным Plugin провайдера `xai` для моделей Grok. Для большинства
пользователей рекомендуемый путь — OAuth Grok с подходящей подпиской SuperGrok или X Premium.
OpenClaw остается локально-ориентированным: Gateway, конфигурация, маршрутизация и
инструменты работают на вашей машине, а запросы к моделям Grok аутентифицируются через xAI
и отправляются в API xAI.

OAuth не требует ключа API xAI и не требует приложения Grok Build.
xAI все равно может показывать Grok Build на экране согласия, потому что OpenClaw использует
общий OAuth-клиент xAI.

## Выберите путь настройки

Используйте путь, соответствующий состоянию вашей установки OpenClaw:

<Steps>
  <Step title="Новая установка OpenClaw">
    Запустите первичную настройку с установкой демона, когда настраиваете новый локальный
    Gateway, затем выберите вариант OAuth xAI/Grok на шаге модели/аутентификации:

    ```bash
    openclaw onboard --install-daemon
    ```

    На VPS или через SSH выберите OAuth xAI напрямую; OpenClaw использует проверку
    по коду устройства и не требует localhost callback:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth не требует ключа API xAI. OpenClaw не требует приложения Grok
    Build. xAI все равно может пометить приложение согласия как Grok Build, потому что
    OpenClaw использует общий OAuth-клиент xAI.

  </Step>
  <Step title="Существующая установка OpenClaw">
    Если OpenClaw уже настроен, войдите только в xAI. Не запускайте полную
    первичную настройку повторно и не переустанавливайте демон только для подключения Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Чтобы сделать Grok моделью по умолчанию после входа, примените это отдельно:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Повторно запускайте полную первичную настройку только если намеренно хотите изменить Gateway,
    демон, канал, рабочую область или другие параметры настройки.

  </Step>
  <Step title="Путь с ключом API">
    Настройка с ключом API по-прежнему работает для ключей xAI Console и для медиа-поверхностей,
    которым требуется конфигурация провайдера на основе ключа:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Выберите модель">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw использует xAI Responses API как встроенный транспорт xAI. Те же
учетные данные из `openclaw models auth login --provider xai --method oauth` или
`openclaw models auth login --provider xai --method api-key` также могут обеспечивать первоклассные
`web_search`, `x_search`, удаленный `code_execution` и генерацию изображений/видео xAI.
Речь и транскрибация сейчас требуют `XAI_API_KEY` или конфигурации провайдера.
`web_search` на базе Grok предпочитает OAuth xAI и откатывается к `XAI_API_KEY` или
конфигурации Plugin для веб-поиска.
Если вы храните ключ xAI в `plugins.entries.xai.config.webSearch.apiKey`,
встроенный провайдер модели xAI также использует этот ключ как резервный вариант.
Задайте `plugins.entries.xai.config.webSearch.baseUrl`, чтобы маршрутизировать Grok `web_search`
и, по умолчанию, `x_search` через операторский прокси xAI Responses.
Настройки `code_execution` находятся в `plugins.entries.xai.config.codeExecution`.
</Note>

## Устранение неполадок OAuth

- Для SSH, Docker, VPS или других удаленных настроек используйте
  `openclaw models auth login --provider xai --method oauth`; OAuth xAI использует
  проверку по коду устройства вместо localhost callback.
- Если вход выполнен успешно, но Grok не является моделью по умолчанию, выполните
  `openclaw models set xai/grok-4.3`.
- Чтобы проверить сохраненные профили аутентификации xAI, выполните:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI решает, какие учетные записи могут получать API-токены OAuth. Если учетная запись не
  подходит, попробуйте путь с ключом API или проверьте подписку на стороне xAI.

<Tip>
Используйте `xai-oauth` при входе из SSH, Docker или с VPS. OpenClaw выводит
URL xAI и короткий код; завершите вход в любом локальном браузере, пока удаленный
процесс опрашивает xAI для завершенного обмена токеном.
</Tip>

## Встроенный каталог

OpenClaw включает текущие чат-модели xAI из коробки, отсортированные от новых
к старым в средствах выбора моделей:

| Семейство      | ID моделей                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Plugin по-прежнему перенаправляет старые slug Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast и Grok Code для существующих конфигураций. Официальные алиасы Grok Code Fast
нормализуются в `grok-build-0.1`; OpenClaw больше не показывает другие устаревшие
вышестоящие slug в выбираемом каталоге.

<Tip>
Используйте `grok-4.3` для обычного чата и `grok-build-0.1` для рабочих нагрузок,
ориентированных на сборку/кодинг, если вам явно не нужен бета-алиас Grok 4.20.
</Tip>

## Покрытие возможностей OpenClaw

Встроенный Plugin отображает текущую публичную поверхность API xAI на общие
контракты провайдера и инструментов OpenClaw. Возможности, которые не подходят под общий контракт
(например, потоковый TTS и голос в реальном времени), не раскрываются - см. таблицу
ниже.

| Возможность xAI            | Поверхность OpenClaw                       | Статус                                                              |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Чат / Responses            | провайдер модели `xai/<model>`             | Да                                                                  |
| Серверный веб-поиск        | провайдер `web_search` `grok`              | Да                                                                  |
| Серверный поиск X          | инструмент `x_search`                      | Да                                                                  |
| Серверное выполнение кода  | инструмент `code_execution`                | Да                                                                  |
| Изображения                | `image_generate`                           | Да                                                                  |
| Видео                      | `video_generate`                           | Да                                                                  |
| Пакетный text-to-speech    | `messages.tts.provider: "xai"` / `tts`     | Да                                                                  |
| Потоковый TTS              | -                                          | Не раскрывается; контракт TTS OpenClaw возвращает полные аудиобуферы |
| Пакетный speech-to-text    | `tools.media.audio` / понимание медиа      | Да                                                                  |
| Потоковый speech-to-text   | Voice Call `streaming.provider: "xai"`     | Да                                                                  |
| Голос в реальном времени   | -                                          | Пока не раскрывается; другой контракт сессии/WebSocket              |
| Файлы / пакеты             | Только совместимость с универсальным API модели | Не первоклассный инструмент OpenClaw                                 |

<Note>
OpenClaw использует REST API xAI для изображений/видео/TTS/STT при генерации медиа,
речи и пакетной транскрибации, потоковый STT WebSocket xAI для транскрибации
живых голосовых вызовов и Responses API для инструментов моделей, поиска и
выполнения кода. Возможности, которым нужны другие контракты OpenClaw, такие как
голосовые сессии в реальном времени, задокументированы здесь как возможности вышестоящего сервиса,
а не как скрытое поведение Plugin.
</Note>

### Сопоставления быстрого режима

`/fast on` или `agents.defaults.models["xai/<model>"].params.fastMode: true`
переписывает нативные запросы xAI следующим образом:

| Исходная модель | Цель быстрого режима |
| --------------- | -------------------- |
| `grok-3`        | `grok-3-fast`        |
| `grok-3-mini`   | `grok-3-mini-fast`   |
| `grok-4`        | `grok-4-fast`        |
| `grok-4-0709`   | `grok-4-fast`        |

### Устаревшие алиасы совместимости

Устаревшие алиасы по-прежнему нормализуются в канонические встроенные ID:

| Устаревший алиас          | Канонический ID                       |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Возможности

<AccordionGroup>
  <Accordion title="Веб-поиск">
    Встроенный провайдер веб-поиска `grok` предпочитает OAuth xAI, затем откатывается
    к `XAI_API_KEY` или ключу веб-поиска Plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Генерация видео">
    Встроенный Plugin `xai` регистрирует генерацию видео через общий
    инструмент `video_generate`.

    - Модель видео по умолчанию: `xai/grok-imagine-video`
    - Режимы: text-to-video, image-to-video, генерация reference-image, удаленное
      редактирование видео и удаленное расширение видео
    - Соотношения сторон: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Разрешения: `480P`, `720P`
    - Длительность: 1-15 секунд для генерации/image-to-video, 1-10 секунд при
      использовании ролей `reference_image`, 2-10 секунд для расширения
    - Генерация reference-image: задайте `imageRoles` равным `reference_image` для
      каждого предоставленного изображения; xAI принимает до 7 таких изображений
    - Тайм-аут операции по умолчанию: 600 секунд, если не задан `video_generate.timeoutMs`
      или `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    Локальные видеобуферы не принимаются. Используйте удаленные URL `http(s)` для
    входных данных редактирования/расширения видео. Image-to-video принимает локальные буферы изображений, потому что
    OpenClaw может кодировать их как data URL для xAI.
    </Warning>

    Чтобы использовать xAI как провайдера видео по умолчанию:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    См. [Генерация видео](/ru/tools/video-generation) для общих параметров инструмента,
    выбора провайдера и поведения failover.
    </Note>

  </Accordion>

  <Accordion title="Генерация изображений">
    Встроенный Plugin `xai` регистрирует генерацию изображений через общий
    инструмент `image_generate`.

    - Модель изображений по умолчанию: `xai/grok-imagine-image`
    - Дополнительная модель: `xai/grok-imagine-image-quality`
    - Режимы: text-to-image и редактирование reference-image
    - Входные reference-данные: одно `image` или до пяти `images`
    - Соотношения сторон: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Разрешения: `1K`, `2K`
    - Количество: до 4 изображений
    - Тайм-аут операции по умолчанию: 600 секунд, если не задан `image_generate.timeoutMs`
      или `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw запрашивает у xAI ответы изображений `b64_json`, чтобы сгенерированные медиа можно было
    хранить и доставлять через обычный путь вложений канала. Локальные
    эталонные изображения преобразуются в data URL; удаленные ссылки `http(s)`
    передаются напрямую.

    Чтобы использовать xAI как провайдера изображений по умолчанию:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI также документирует `quality`, `mask`, `user` и дополнительные нативные соотношения,
    такие как `1:2`, `2:1`, `9:20` и `20:9`. Сейчас OpenClaw передает только
    общие межпровайдерные элементы управления изображениями; неподдерживаемые
    нативные параметры намеренно не доступны через `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Преобразование текста в речь">
    Встроенный Plugin `xai` регистрирует преобразование текста в речь через общий
    провайдерский интерфейс `tts`.

    - Голоса: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Голос по умолчанию: `eve`
    - Форматы: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Язык: код BCP-47 или `auto`
    - Скорость: нативное переопределение скорости провайдера
    - Нативный формат голосовых заметок Opus не поддерживается

    Чтобы использовать xAI как провайдера TTS по умолчанию:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw использует пакетный endpoint xAI `/v1/tts`. xAI также предлагает потоковый TTS
    через WebSocket, но контракт речевого провайдера OpenClaw сейчас ожидает
    полный аудиобуфер до доставки ответа.
    </Note>

  </Accordion>

  <Accordion title="Преобразование речи в текст">
    Встроенный Plugin `xai` регистрирует пакетное преобразование речи в текст через
    поверхность транскрибации для понимания медиа в OpenClaw.

    - Модель по умолчанию: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Путь ввода: загрузка аудиофайла multipart
    - Поддерживается OpenClaw везде, где транскрибация входящего аудио использует
      `tools.media.audio`, включая сегменты голосовых каналов Discord и
      аудиовложения каналов

    Чтобы принудительно использовать xAI для транскрибации входящего аудио:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Язык можно передать через общую конфигурацию аудиомедиа или через запрос
    транскрибации для отдельного вызова. Подсказки промпта принимаются общей
    поверхностью OpenClaw, но интеграция xAI REST STT передает только файл, модель и
    язык, потому что они напрямую соответствуют текущему публичному endpoint xAI.

  </Accordion>

  <Accordion title="Потоковое преобразование речи в текст">
    Встроенный Plugin `xai` также регистрирует провайдера транскрибации в реальном времени
    для аудио живых голосовых вызовов.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Кодировка по умолчанию: `mulaw`
    - Частота дискретизации по умолчанию: `8000`
    - Endpointing по умолчанию: `800ms`
    - Промежуточные транскрипты: включены по умолчанию

    Медиапоток Twilio в Voice Call отправляет аудиокадры G.711 µ-law, поэтому
    провайдер xAI может передавать эти кадры напрямую без транскодирования:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Конфигурация, принадлежащая провайдеру, находится в
    `plugins.entries.voice-call.config.streaming.providers.xai`. Поддерживаемые
    ключи: `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` или
    `alaw`), `interimResults`, `endpointingMs` и `language`.

    <Note>
    Этот потоковый провайдер предназначен для пути транскрибации Voice Call в реальном времени.
    Голос Discord сейчас записывает короткие сегменты и вместо этого использует пакетный
    путь транскрибации `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Конфигурация x_search">
    Встроенный Plugin xAI предоставляет `x_search` как инструмент OpenClaw для поиска
    контента X (ранее Twitter) через Grok.

    Путь конфигурации: `plugins.entries.xai.config.xSearch`

    | Ключ               | Тип     | По умолчанию       | Описание                             |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Включить или отключить x_search      |
    | `model`            | string  | `grok-4-1-fast`    | Модель для запросов x_search         |
    | `baseUrl`          | string  | -                  | Переопределение базового URL xAI Responses |
    | `inlineCitations`  | boolean | -                  | Включать встроенные цитирования в результаты |
    | `maxTurns`         | number  | -                  | Максимальное число ходов разговора   |
    | `timeoutSeconds`   | number  | -                  | Тайм-аут запроса в секундах          |
    | `cacheTtlMinutes`  | number  | -                  | Время жизни кэша в минутах           |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Конфигурация выполнения кода">
    Встроенный Plugin xAI предоставляет `code_execution` как инструмент OpenClaw для
    удаленного выполнения кода в песочнице xAI.

    Путь конфигурации: `plugins.entries.xai.config.codeExecution`

    | Ключ              | Тип     | По умолчанию       | Описание                              |
    | ----------------- | ------- | ------------------ | ------------------------------------- |
    | `enabled`         | boolean | `true` (если ключ доступен) | Включить или отключить выполнение кода |
    | `model`           | string  | `grok-4-1-fast`    | Модель для запросов выполнения кода   |
    | `maxTurns`        | number  | -                  | Максимальное число ходов разговора    |
    | `timeoutSeconds`  | number  | -                  | Тайм-аут запроса в секундах           |

    <Note>
    Это удаленное выполнение в песочнице xAI, а не локальный [`exec`](/ru/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Известные ограничения">
    - Аутентификация xAI может использовать API-ключ, переменную окружения, резервную конфигурацию Plugin
      или OAuth с подходящей учетной записью xAI. OAuth использует проверку device-code
      без callback на localhost. xAI решает, какие учетные записи могут получать OAuth
      API-токены, а страница согласия может показывать Grok Build, даже если OpenClaw
      не требует приложение Grok Build.
    - OpenClaw сейчас не предоставляет семейство многоагентных моделей xAI. xAI
      обслуживает эти модели через Responses API, но они не принимают клиентские
      или пользовательские инструменты, которые использует общий агентский цикл OpenClaw. См.
      [ограничения многоагентных моделей xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Голос xAI Realtime пока не зарегистрирован как провайдер OpenClaw. Для него
      нужен другой контракт двунаправленной голосовой сессии, отличный от пакетного STT или
      потоковой транскрибации.
    - `quality` изображения xAI, `mask` изображения и дополнительные нативные соотношения сторон
      не предоставляются, пока общий инструмент `image_generate` не получит соответствующие
      межпровайдерные элементы управления.
  </Accordion>

  <Accordion title="Расширенные заметки">
    - OpenClaw автоматически применяет исправления совместимости схемы инструментов и вызовов инструментов,
      специфичные для xAI, на общем пути runner.
    - Нативные запросы xAI по умолчанию используют `tool_stream: true`. Установите
      `agents.defaults.models["xai/<model>"].params.tool_stream` в `false`, чтобы
      отключить это.
    - Встроенная обертка xAI удаляет неподдерживаемые строгие флаги схемы инструментов и
      ключи полезной нагрузки reasoning *effort* перед отправкой нативных запросов xAI. Только
      `grok-4.3` / `grok-4.3-*` объявляют настраиваемое усилие reasoning; все
      остальные модели xAI с поддержкой reasoning все равно запрашивают
      `include: ["reasoning.encrypted_content"]`, чтобы предыдущее зашифрованное reasoning
      можно было воспроизвести в последующих ходах.
    - `web_search`, `x_search` и `code_execution` предоставляются как инструменты OpenClaw.
      OpenClaw включает конкретный встроенный инструмент xAI, который нужен внутри каждого
      запроса инструмента, вместо того чтобы прикреплять все нативные инструменты к каждому ходу чата.
    - Grok `web_search` читает `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` читает `plugins.entries.xai.config.xSearch.baseUrl`, затем
      откатывается к базовому URL веб-поиска Grok.
    - `x_search` и `code_execution` принадлежат встроенному Plugin xAI, а не
      жестко закодированы в runtime основной модели.
    - `code_execution` — это удаленное выполнение в песочнице xAI, а не локальный
      [`exec`](/ru/tools/exec).
  </Accordion>
</AccordionGroup>

## Живое тестирование

Медиапути xAI покрыты модульными тестами и opt-in живыми наборами тестов. Экспортируйте
`XAI_API_KEY` в окружение процесса перед запуском живых проверок.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Файл живых тестов, специфичный для провайдера, синтезирует обычный TTS, TTS PCM,
подходящий для телефонии, транскрибирует аудио через пакетный STT xAI, передает тот же PCM
через STT xAI в реальном времени, генерирует вывод text-to-image и редактирует эталонное изображение. Общий файл живых тестов изображений проверяет того же провайдера xAI через путь
выбора runtime OpenClaw, fallback, нормализации и медиавложений.

## См. также

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения failover.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры видеоинструмента и выбор провайдера.
  </Card>
  <Card title="Все провайдеры" href="/ru/providers/index" icon="grid-2">
    Более широкий обзор провайдеров.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространенные проблемы и исправления.
  </Card>
</CardGroup>
