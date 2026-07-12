---
read_when:
    - Ви хочете використовувати перетворення мовлення на текст SenseAudio для аудіовкладень
    - Вам потрібна змінна середовища з ключем API SenseAudio або шлях до конфігурації аудіо
summary: Пакетне перетворення мовлення на текст за допомогою SenseAudio для вхідних голосових повідомлень
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T13:43:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio транскрибує вхідні аудіофайли та вкладення з голосовими повідомленнями через спільний конвеєр OpenClaw `tools.media.audio`. OpenClaw надсилає аудіо як multipart-запит до сумісної з OpenAI кінцевої точки транскрибування та вставляє повернутий текст як `{{Transcript}}` разом із блоком `[Аудіо]`.

| Властивість          | Значення                                         |
| -------------------- | ------------------------------------------------ |
| Ідентифікатор надавача | `senseaudio`                                   |
| Plugin               | вбудований, `enabledByDefault: true`             |
| Контракт             | `mediaUnderstandingProviders` (аудіо)            |
| Змінна середовища автентифікації | `SENSEAUDIO_API_KEY`                  |
| Модель за замовчуванням | `senseaudio-asr-pro-1.5-260319`                |
| URL за замовчуванням | `https://api.senseaudio.cn/v1`                   |
| Вебсайт              | [senseaudio.cn](https://senseaudio.cn)           |
| Документація         | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Початок роботи

<Steps>
  <Step title="Установіть ключ API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Увімкніть надавача аудіо">
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
  <Step title="Надішліть голосове повідомлення">
    Надішліть аудіоповідомлення через будь-який підключений канал. OpenClaw завантажить
    аудіо до SenseAudio та використає транскрипцію в конвеєрі відповіді.
  </Step>
</Steps>

## Параметри

| Параметр   | Шлях                                  | Опис                                        |
| ---------- | ------------------------------------- | ------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Ідентифікатор моделі ASR SenseAudio         |
| `language` | `tools.media.audio.models[].language` | Необов’язкова підказка щодо мови             |
| `prompt`   | `tools.media.audio.prompt`            | Необов’язкова підказка для транскрибування   |
| `baseUrl`  | `tools.media.audio.baseUrl` або модель | Перевизначення сумісної з OpenAI базової URL-адреси |
| `headers`  | `tools.media.audio.request.headers`   | Додаткові заголовки запиту                   |

<Note>
У OpenClaw SenseAudio підтримує лише пакетне перетворення мовлення на текст. Транскрибування
Voice Call у реальному часі й надалі використовує надавачів із підтримкою потокового перетворення мовлення на текст.
</Note>

## Пов’язані матеріали

- [Розпізнавання медіа (аудіо)](/uk/nodes/audio)
- [Надавачі моделей](/uk/concepts/model-providers)
