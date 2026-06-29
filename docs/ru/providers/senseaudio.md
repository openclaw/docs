---
read_when:
    - Вам нужен SenseAudio для преобразования речи в текст для аудиовложений
    - Вам нужна переменная окружения ключа API SenseAudio или путь к аудиоконфигурации
summary: Пакетное преобразование речи в текст SenseAudio для входящих голосовых сообщений
title: SenseAudio
x-i18n:
    generated_at: "2026-06-28T23:40:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio может расшифровывать входящие аудио и вложения с голосовыми заметками через общий конвейер OpenClaw `tools.media.audio`. OpenClaw отправляет multipart-аудио в OpenAI-совместимый endpoint транскрибации и добавляет возвращенный текст как `{{Transcript}}` плюс блок `[Audio]`.

| Свойство      | Значение                                         |
| ------------- | ------------------------------------------------ |
| ID провайдера | `senseaudio`                                     |
| Plugin        | встроенный, `enabledByDefault: true`             |
| Контракт      | `mediaUnderstandingProviders` (audio)            |
| Переменная env для auth | `SENSEAUDIO_API_KEY`                    |
| Модель по умолчанию | `senseaudio-asr-pro-1.5-260319`             |
| URL по умолчанию | `https://api.senseaudio.cn/v1`                |
| Сайт          | [senseaudio.cn](https://senseaudio.cn)           |
| Документация  | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Начало работы

<Steps>
  <Step title="Задайте API-ключ">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Включите аудиопровайдера">
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
  <Step title="Отправьте голосовую заметку">
    Отправьте аудиосообщение через любой подключенный канал. OpenClaw загружает
    аудио в SenseAudio и использует транскрипт в конвейере ответа.
  </Step>
</Steps>

## Параметры

| Параметр   | Путь                                  | Описание                            |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID модели SenseAudio ASR            |
| `language` | `tools.media.audio.models[].language` | Необязательная подсказка языка      |
| `prompt`   | `tools.media.audio.prompt`            | Необязательный prompt транскрибации |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | Переопределяет OpenAI-совместимую базу |
| `headers`  | `tools.media.audio.request.headers`   | Дополнительные заголовки запроса    |

<Note>
В OpenClaw SenseAudio поддерживает только пакетное STT. Транскрибация Voice Call
в реальном времени по-прежнему использует провайдеров с поддержкой потокового STT.
</Note>

## Связанные материалы

- [Понимание медиа (аудио)](/ru/nodes/audio)
- [Провайдеры моделей](/ru/concepts/model-providers)
