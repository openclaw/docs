---
read_when:
    - Вам потрібне перетворення мовлення на текст SenseAudio для аудіовкладень
    - Потрібна змінна середовища ключа API SenseAudio або шлях до конфігурації аудіо
summary: Пакетне перетворення мовлення на текст у SenseAudio для вхідних голосових повідомлень
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T06:38:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio може транскрибувати вхідні аудіо- та голосові вкладення через спільний конвеєр OpenClaw `tools.media.audio`. OpenClaw надсилає multipart-аудіо до OpenAI-сумісної кінцевої точки транскрипції та вставляє повернений текст як `{{Transcript}}` разом із блоком `[Audio]`.

| Властивість   | Значення                                         |
| ------------- | ------------------------------------------------ |
| Ідентифікатор провайдера | `senseaudio`                          |
| Plugin        | вбудований, `enabledByDefault: true`             |
| Контракт      | `mediaUnderstandingProviders` (аудіо)            |
| Змінна середовища автентифікації | `SENSEAUDIO_API_KEY`       |
| Модель за замовчуванням | `senseaudio-asr-pro-1.5-260319`        |
| URL за замовчуванням | `https://api.senseaudio.cn/v1`             |
| Вебсайт       | [senseaudio.cn](https://senseaudio.cn)           |
| Документація  | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Початок роботи

<Steps>
  <Step title="Налаштуйте свій API-ключ">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Увімкніть аудіопровайдера">
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
    Надішліть аудіоповідомлення через будь-який підключений канал. OpenClaw завантажує
    аудіо до SenseAudio і використовує транскрипт у конвеєрі відповіді.
  </Step>
</Steps>

## Параметри

| Параметр   | Шлях                                  | Опис                                |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Ідентифікатор моделі ASR SenseAudio |
| `language` | `tools.media.audio.models[].language` | Необов’язкова підказка мови         |
| `prompt`   | `tools.media.audio.prompt`            | Необов’язкова підказка транскрипції |
| `baseUrl`  | `tools.media.audio.baseUrl` або модель | Перевизначити OpenAI-сумісну базу  |
| `headers`  | `tools.media.audio.request.headers`   | Додаткові заголовки запиту          |

<Note>
SenseAudio у OpenClaw підтримує лише пакетне STT. Транскрипція Voice Call у реальному часі
й надалі використовує провайдерів із підтримкою потокового STT.
</Note>

## Пов’язане

- [Розуміння медіа (аудіо)](/uk/nodes/audio)
- [Провайдери моделей](/uk/concepts/model-providers)
