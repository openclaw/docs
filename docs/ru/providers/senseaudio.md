---
read_when:
    - Вам нужно преобразование речи в текст с помощью SenseAudio для аудиовложений
    - Вам нужна переменная окружения с API-ключом SenseAudio или путь к конфигурации аудио.
summary: Пакетное распознавание речи SenseAudio для входящих голосовых сообщений
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T11:48:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio расшифровывает входящие аудиофайлы и вложения с голосовыми сообщениями через общий конвейер OpenClaw `tools.media.audio`. OpenClaw отправляет аудио в виде multipart-запроса на совместимую с OpenAI конечную точку транскрибирования и добавляет возвращённый текст как `{{Transcript}}` вместе с блоком `[Audio]`.

| Свойство                 | Значение                                         |
| ------------------------ | ------------------------------------------------ |
| Идентификатор провайдера | `senseaudio`                                     |
| Plugin                   | встроенный, `enabledByDefault: true`             |
| Контракт                 | `mediaUnderstandingProviders` (аудио)            |
| Переменная окружения для аутентификации | `SENSEAUDIO_API_KEY`                |
| Модель по умолчанию      | `senseaudio-asr-pro-1.5-260319`                  |
| URL по умолчанию         | `https://api.senseaudio.cn/v1`                   |
| Веб-сайт                 | [senseaudio.cn](https://senseaudio.cn)           |
| Документация             | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Начало работы

<Steps>
  <Step title="Укажите ключ API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Включите провайдера аудио">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Отправьте голосовое сообщение">
    Отправьте аудиосообщение через любой подключённый канал. OpenClaw загружает
    аудио в SenseAudio и использует расшифровку в конвейере ответа.
  </Step>
</Steps>

## Параметры

| Параметр   | Путь                                  | Описание                                      |
| ---------- | ------------------------------------- | --------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Идентификатор модели ASR SenseAudio           |
| `language` | `tools.media.audio.models[].language` | Необязательная подсказка языка                |
| `prompt`   | `tools.media.audio.prompt`            | Необязательный промпт для транскрибирования   |
| `baseUrl`  | `tools.media.audio.baseUrl` или модель | Переопределяет совместимую с OpenAI базовую конечную точку |
| `headers`  | `tools.media.audio.request.headers`   | Дополнительные заголовки запроса              |

<Note>
В OpenClaw SenseAudio поддерживает только пакетное преобразование речи в текст. Транскрибирование в реальном времени для голосовых вызовов
по-прежнему использует провайдеров с поддержкой потокового преобразования речи в текст.
</Note>

## Связанные материалы

- [Обработка мультимедиа (аудио)](/ru/nodes/audio)
- [Провайдеры моделей](/ru/concepts/model-providers)
