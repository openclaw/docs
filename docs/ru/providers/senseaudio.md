---
read_when:
    - Вам нужно преобразование речи в текст с помощью SenseAudio для аудиовложений
    - Вам нужна переменная окружения с ключом API SenseAudio или путь к конфигурации аудио
summary: Пакетное преобразование речи в текст с помощью SenseAudio для входящих голосовых сообщений
title: SenseAudio
x-i18n:
    generated_at: "2026-07-13T20:14:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio расшифровывает входящие аудиофайлы и вложения с голосовыми сообщениями через общий конвейер `tools.media.audio` OpenClaw. OpenClaw отправляет аудио в формате multipart на совместимую с OpenAI конечную точку транскрибирования и вставляет возвращённый текст как `{{Transcript}}`, а также блок `[Audio]`.

| Свойство             | Значение                                         |
| -------------------- | ------------------------------------------------ |
| Идентификатор провайдера | `senseaudio`                           |
| Плагин                | встроенный, `enabledByDefault: true`                   |
| Контракт              | `mediaUnderstandingProviders` (аудио)                       |
| Переменная окружения для аутентификации | `SENSEAUDIO_API_KEY`              |
| Модель по умолчанию   | `senseaudio-asr-pro-1.5-260319`                               |
| URL по умолчанию      | `https://api.senseaudio.cn/v1`                               |
| Веб-сайт              | [senseaudio.cn](https://senseaudio.cn)           |
| Документация          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Начало работы

<Steps>
  <Step title="Задайте ключ API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Включите провайдер аудио">
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
    Отправьте аудиосообщение через любой подключённый канал. OpenClaw загрузит
    аудио в SenseAudio и использует расшифровку в конвейере ответа.
  </Step>
</Steps>

## Параметры

| Параметр          | Путь                                  | Описание                                      |
| ----------------- | ------------------------------------- | --------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Идентификатор модели ASR SenseAudio           |
| `language` | `tools.media.audio.models[].language` | Необязательная подсказка языка                |
| `prompt`   | `tools.media.audio.prompt`            | Необязательный промпт для транскрибирования   |
| `baseUrl`  | `tools.media.audio.baseUrl` или модель | Переопределение совместимой с OpenAI базовой конечной точки |
| `headers`  | `tools.media.audio.request.headers`   | Дополнительные заголовки запроса              |

<Note>
В OpenClaw SenseAudio поддерживает только пакетное преобразование речи в текст. Транскрибирование
звонков в реальном времени продолжает использовать провайдеров с поддержкой потокового преобразования речи в текст.
</Note>

## Связанные материалы

- [Распознавание медиаконтента (аудио)](/ru/nodes/audio)
- [Провайдеры моделей](/ru/concepts/model-providers)
