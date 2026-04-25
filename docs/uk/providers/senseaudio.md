---
read_when:
    - Ви хочете перетворення мовлення на текст SenseAudio для аудіовкладень
    - Вам потрібна змінна середовища з API-ключем SenseAudio або шлях до аудіоконфігурації
summary: Пакетне перетворення мовлення на текст SenseAudio для вхідних голосових повідомлень
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T11:57:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio може транскрибувати вхідні аудіовкладення/голосові повідомлення через
спільний конвеєр `tools.media.audio` в OpenClaw. OpenClaw надсилає multipart-аудіо
до сумісного з OpenAI endpoint транскрибування та вставляє повернутий текст
як `{{Transcript}}` і блок `[Audio]`.

| Деталь        | Значення                                         |
| ------------- | ------------------------------------------------ |
| Вебсайт       | [senseaudio.cn](https://senseaudio.cn)           |
| Документація  | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Автентифікація | `SENSEAUDIO_API_KEY`                            |
| Модель за замовчуванням | `senseaudio-asr-pro-1.5-260319`       |
| URL за замовчуванням | `https://api.senseaudio.cn/v1`             |

## Початок роботи

<Steps>
  <Step title="Установіть свій API-ключ">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Увімкніть аудіопровайдер">
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
    аудіо до SenseAudio та використає транскрипт у конвеєрі відповіді.
  </Step>
</Steps>

## Параметри

| Параметр   | Шлях                                 | Опис                                |
| ---------- | ------------------------------------ | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`   | ID моделі ASR SenseAudio            |
| `language` | `tools.media.audio.models[].language` | Необов’язкова підказка мови        |
| `prompt`   | `tools.media.audio.prompt`           | Необов’язковий prompt транскрибування |
| `baseUrl`  | `tools.media.audio.baseUrl` or model | Перевизначити сумісну з OpenAI базу |
| `headers`  | `tools.media.audio.request.headers`  | Додаткові заголовки запиту          |

<Note>
У OpenClaw SenseAudio підтримує лише пакетне STT. Транскрибування в реальному часі для Voice Call
і надалі використовує провайдерів із підтримкою потокового STT.
</Note>
