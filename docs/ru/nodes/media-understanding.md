---
read_when:
    - Проектирование или рефакторинг понимания медиа
    - Настройка предварительной обработки входящих аудио, видео и изображений
sidebarTitle: Media understanding
summary: Понимание входящих изображений/аудио/видео (необязательно) с резервными вариантами через провайдера и CLI
title: Понимание медиа
x-i18n:
    generated_at: "2026-06-28T23:09:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw может **суммаризировать входящие медиа** (изображения/аудио/видео) до запуска конвейера ответа. Он автоматически определяет, доступны ли локальные инструменты или ключи провайдера, и его можно отключить или настроить. Если понимание отключено, модели по-прежнему получают исходные файлы/URL как обычно.

Поведение медиа, специфичное для вендора, регистрируется Plugin вендора, а ядро OpenClaw отвечает за общую конфигурацию `tools.media`, порядок fallback и интеграцию с конвейером ответа.

## Цели

- Опционально: предварительно преобразовывать входящие медиа в краткий текст для более быстрой маршрутизации и лучшего разбора команд.
- Сохранять доставку исходных медиа модели (всегда).
- Поддерживать **API провайдеров** и **CLI fallback**.
- Разрешать несколько моделей с упорядоченным fallback (ошибка/размер/таймаут).

## Высокоуровневое поведение

<Steps>
  <Step title="Собрать вложения">
    Собирает входящие вложения (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Выбрать по возможности">
    Для каждой включенной возможности (изображение/аудио/видео) выбирает вложения по политике (по умолчанию: **первое**).
  </Step>
  <Step title="Выбрать модель">
    Выбирает первую подходящую запись модели (размер + возможность + авторизация).
  </Step>
  <Step title="Fallback при сбое">
    Если модель завершается с ошибкой или медиа слишком большое, **выполняет fallback к следующей записи**.
  </Step>
  <Step title="Применить блок успеха">
    При успехе:

    - `Body` становится блоком `[Image]`, `[Audio]` или `[Video]`.
    - Аудио задает `{{Transcript}}`; разбор команд использует текст подписи, если он есть, иначе транскрипт.
    - Подписи сохраняются как `User text:` внутри блока.

  </Step>
</Steps>

Если понимание завершается с ошибкой или отключено, **поток ответа продолжается** с исходным body + вложениями.

## Обзор конфигурации

`tools.media` поддерживает **общие модели** и переопределения для отдельных возможностей:

<AccordionGroup>
  <Accordion title="Ключи верхнего уровня">
    - `tools.media.models`: общий список моделей (используйте `capabilities` для ограничения).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - значения по умолчанию (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - переопределения провайдера (`baseUrl`, `headers`, `providerOptions`)
      - аудиоопции Deepgram через `tools.media.audio.providerOptions.deepgram`
      - элементы управления эхо транскрипта аудио (`echoTranscript`, по умолчанию `false`; `echoFormat`)
      - опциональный **список `models` для отдельной возможности** (предпочитается перед общими моделями)
      - политика `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (опциональное ограничение по каналу/chatType/ключу сессии)
    - `tools.media.concurrency`: максимум одновременных запусков возможностей (по умолчанию **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Записи моделей

Каждая запись `models[]` может быть **provider** или **CLI**:

<Tabs>
  <Tab title="Запись провайдера">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Запись CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    Шаблоны CLI также могут использовать:

    - `{{MediaDir}}` (каталог, содержащий медиафайл)
    - `{{OutputDir}}` (scratch-каталог, созданный для этого запуска)
    - `{{OutputBase}}` (базовый путь scratch-файла, без расширения)

  </Tab>
</Tabs>

### Учетные данные провайдера (`apiKey`)

Понимание медиа провайдером использует то же разрешение авторизации провайдера, что и обычные
вызовы моделей: профили авторизации, переменные окружения, затем
`models.providers.<providerId>.apiKey`.

Записи `tools.media.*.models[]` не принимают встроенное поле `apiKey`. Значение
`provider` в записи модели медиа, например `openai` или `moonshot`, должно
иметь учетные данные, доступные через один из стандартных источников авторизации провайдера.

Минимальный пример:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Полную справку по авторизации провайдера, включая профили, переменные окружения
и пользовательские базовые URL, см. в [Инструменты и пользовательские провайдеры](/ru/gateway/config-tools).

## Значения по умолчанию и лимиты

Рекомендуемые значения по умолчанию:

- `maxChars`: **500** для изображений/видео (кратко, удобно для команд)
- `maxChars`: **не задано** для аудио (полный транскрипт, если вы не зададите лимит)
- `maxBytes`:
  - изображение: **10MB**
  - аудио: **20MB**
  - видео: **50MB**

<AccordionGroup>
  <Accordion title="Правила">
    - Если медиа превышает `maxBytes`, эта модель пропускается и **пробуется следующая модель**.
    - Аудиофайлы меньше **1024 байт** считаются пустыми/поврежденными и пропускаются до транскрипции провайдером/CLI; входящий контекст ответа получает детерминированный заполнитель транскрипта, чтобы агент знал, что заметка была слишком маленькой.
    - Если модель возвращает больше `maxChars`, вывод обрезается.
    - `prompt` по умолчанию использует простое "Describe the {media}." плюс указание `maxChars` (только изображение/видео).
    - Если активная основная модель изображений уже нативно поддерживает vision, OpenClaw пропускает блок сводки `[Image]` и вместо этого передает исходное изображение в модель.
    - Если основная модель Gateway/WebChat поддерживает только текст, вложения изображений сохраняются как выгруженные ссылки `media://inbound/*`, чтобы инструменты изображений/PDF или настроенная модель изображений все еще могли их проверить, вместо потери вложения.
    - Явные запросы `openclaw infer image describe --model <provider/model>` отличаются: они напрямую запускают этот провайдер/модель с поддержкой изображений, включая ссылки Ollama, такие как `ollama/qwen2.5vl:7b`.
    - Если `<capability>.enabled: true`, но модели не настроены, OpenClaw пробует **активную модель ответа**, когда ее провайдер поддерживает эту возможность.

  </Accordion>
</AccordionGroup>

### Автоопределение понимания медиа (по умолчанию)

Если `tools.media.<capability>.enabled` **не** задано как `false` и вы не настроили модели, OpenClaw автоматически определяет в этом порядке и **останавливается на первом рабочем варианте**:

<Steps>
  <Step title="Активная модель ответа">
    Активная модель ответа, когда ее провайдер поддерживает эту возможность.
  </Step>
  <Step title="agents.defaults.imageModel">
    Основные/fallback ссылки `agents.defaults.imageModel` (только изображение).
    Предпочитайте ссылки `provider/model`. Голые ссылки квалифицируются из настроенных записей моделей провайдеров с поддержкой изображений только когда совпадение уникально.
  </Step>
  <Step title="Локальные CLI (только аудио)">
    Локальные CLI (если установлены):

    - `sherpa-onnx-offline` (требует `SHERPA_ONNX_MODEL_DIR` с encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; использует `WHISPER_CPP_MODEL` или встроенную tiny-модель)
    - `whisper` (Python CLI; скачивает модели автоматически)

  </Step>
  <Step title="Gemini CLI">
    `gemini` с использованием `read_many_files`.
  </Step>
  <Step title="Авторизация провайдера">
    - Настроенные записи `models.providers.*`, поддерживающие возможность, пробуются перед встроенным порядком fallback.
    - Провайдеры конфигурации только для изображений с моделью, поддерживающей изображения, автоматически регистрируются для понимания медиа, даже если они не являются встроенным Plugin вендора.
    - Понимание изображений Ollama доступно при явном выборе, например через `agents.defaults.imageModel` или `openclaw infer image describe --model ollama/<vision-model>`.

    Встроенный порядок fallback:

    - Аудио: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - Изображение: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Видео: Google → Qwen → Moonshot

  </Step>
</Steps>

Чтобы отключить автоопределение, задайте:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
Обнаружение бинарного файла выполняется по принципу best-effort в macOS/Linux/Windows; убедитесь, что CLI находится в `PATH` (мы раскрываем `~`), или задайте явную CLI-модель с полным путем команды.
</Note>

### Поддержка прокси через окружение (модели провайдеров)

Когда включено понимание медиа **аудио** и **видео** на основе провайдера, OpenClaw учитывает стандартные переменные окружения исходящего прокси для HTTP-вызовов провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Если переменные окружения прокси не заданы, понимание медиа использует прямой исходящий доступ. Если значение прокси имеет неверный формат, OpenClaw записывает предупреждение в журнал и возвращается к прямой загрузке.

## Возможности (опционально)

Если вы задаете `capabilities`, запись запускается только для этих типов медиа. Для общих списков OpenClaw может вывести значения по умолчанию:

- `openai`, `anthropic`, `minimax`: **изображение**
- `minimax-portal`: **изображение**
- `moonshot`: **изображение + видео**
- `openrouter`: **изображение + аудио**
- `google` (Gemini API): **изображение + аудио + видео**
- `qwen`: **изображение + видео**
- `mistral`: **аудио**
- `zai`: **изображение**
- `groq`: **аудио**
- `xai`: **аудио**
- `deepgram`: **аудио**
- Любой каталог `models.providers.<id>.models[]` с моделью, поддерживающей изображения: **изображение**

Для записей CLI **задавайте `capabilities` явно**, чтобы избежать неожиданных совпадений. Если вы опустите `capabilities`, запись будет подходящей для списка, в котором она находится.

## Матрица поддержки провайдеров (интеграции OpenClaw)

| Возможность | Интеграция провайдера                                                                                                        | Примечания                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Изображение | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, провайдеры конфигурации | Plugin вендоров регистрируют поддержку изображений; `openai/*` может использовать маршрутизацию по API-ключу или Codex OAuth; `codex/*` использует ограниченный turn Codex app-server; MiniMax и MiniMax OAuth оба используют `MiniMax-VL-01`; провайдеры конфигурации с поддержкой изображений регистрируются автоматически. |
| Аудио      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Транскрипция провайдером (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                      |
| Видео      | Google, Qwen, Moonshot                                                                                                       | Понимание видео провайдером через Plugin вендоров; понимание видео Qwen использует конечные точки Standard DashScope.                                                                                                                       |

<Note>
**Примечание MiniMax**

- Понимание изображений для `minimax`, `minimax-cn`, `minimax-portal` и `minimax-portal-cn` обеспечивается медиа-провайдером `MiniMax-VL-01`, принадлежащим Plugin.
- Автоматическая маршрутизация изображений продолжает использовать `MiniMax-VL-01`, даже если устаревшие метаданные чата MiniMax M2.x заявляют ввод изображений.

</Note>

## Рекомендации по выбору модели

- Предпочитайте самую сильную модель последнего поколения, доступную для каждой медиа-возможности, когда важны качество и безопасность.
- Для агентов с инструментами, обрабатывающих недоверенный ввод, избегайте старых или более слабых медиа-моделей.
- Держите как минимум один резервный вариант для каждой возможности ради доступности (качественная модель + более быстрая или дешевая модель).
- Резервные варианты CLI (`whisper-cli`, `whisper`, `gemini`) полезны, когда API провайдеров недоступны.
- Примечание по `parakeet-mlx`: с `--output-dir` OpenClaw читает `<output-dir>/<media-basename>.txt`, когда формат вывода равен `txt` (или не указан); форматы не `txt` используют stdout как резервный вариант.

## Политика вложений

Параметр `attachments` для каждой возможности управляет тем, какие вложения обрабатываются:

<ParamField path="mode" type='"first" | "all"' default="first">
  Обрабатывать первое выбранное вложение или все вложения.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Ограничивает количество обрабатываемых вложений.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Предпочтение выбора среди вложений-кандидатов.
</ParamField>

Когда `mode: "all"`, результаты помечаются как `[Image 1/2]`, `[Audio 2/2]` и т. д.

<AccordionGroup>
  <Accordion title="Поведение извлечения файловых вложений">
    - Извлеченный текст файла оборачивается как **недоверенное внешнее содержимое** перед добавлением в медиа-промпт.
    - Вставляемый блок использует явные маркеры границ, например `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, и включает строку метаданных `Source: External`.
    - Этот путь извлечения вложений намеренно опускает длинный баннер `SECURITY NOTICE:`, чтобы не раздувать медиа-промпт; маркеры границ и метаданные при этом сохраняются.
    - Если в файле нет извлекаемого текста, OpenClaw вставляет `[No extractable text]`.
    - Если PDF в этом пути переключается на отрендеренные изображения страниц, OpenClaw передает эти изображения страниц моделям ответа с поддержкой зрения и сохраняет заполнитель `[PDF content rendered to images]` в блоке файла.

  </Accordion>
</AccordionGroup>

## Примеры конфигурации

<Tabs>
  <Tab title="Общие модели + переопределения">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Только аудио + видео">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Только изображения">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Одна мультимодальная запись">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Вывод статуса

Когда выполняется понимание медиа, `/status` включает короткую строку сводки:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Она показывает результаты по каждой возможности и выбранного провайдера/модель, когда применимо.

## Примечания

- Понимание выполняется **по мере возможности**. Ошибки не блокируют ответы.
- Вложения все равно передаются моделям, даже когда понимание отключено.
- Используйте `scope`, чтобы ограничить, где выполняется понимание (например, только в DM).

## Связанные материалы

- [Конфигурация](/ru/gateway/configuration)
- [Поддержка изображений и медиа](/ru/nodes/images)
