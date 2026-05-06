---
read_when:
    - Вам потрібне перетворення мовлення на текст SenseAudio для аудіовкладень
    - Потрібна змінна середовища з API-ключем SenseAudio або шлях до конфігурації аудіо
summary: Пакетне перетворення мовлення на текст у SenseAudio для вхідних голосових повідомлень
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T00:38:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 775d27439d8f1598c6639df936f8a80f105ced9b915e98f7ff73d9049ac1b6a2
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio може транскрибувати вхідні аудіо та вкладення голосових нотаток через спільний конвеєр OpenClaw `tools.media.audio`. OpenClaw надсилає multipart-аудіо до сумісної з OpenAI кінцевої точки транскрипції та вставляє повернений текст як `{{Transcript}}` разом із блоком `[Audio]`.

| Властивість       | Значення                                         |
| ----------------- | ------------------------------------------------ |
| ID провайдера     | `senseaudio`                                     |
| Plugin            | вбудований, `enabledByDefault: true`             |
| Контракт          | `mediaUnderstandingProviders` (аудіо)            |
| Змінна env auth   | `SENSEAUDIO_API_KEY`                             |
| Типова модель     | `senseaudio-asr-pro-1.5-260319`                  |
| Типова URL-адреса | `https://api.senseaudio.cn/v1`                   |
| Вебсайт           | [senseaudio.cn](https://senseaudio.cn)           |
| Документація      | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

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
  <Step title="Надішліть голосову нотатку">
    Надішліть аудіоповідомлення через будь-який підключений канал. OpenClaw завантажує
    аудіо до SenseAudio та використовує транскрипт у конвеєрі відповіді.
  </Step>
</Steps>

## Параметри

| Параметр  | Шлях                                  | Опис                                      |
| --------- | ------------------------------------- | ----------------------------------------- |
| `model`   | `tools.media.audio.models[].model`    | ID ASR-моделі SenseAudio                  |
| `language` | `tools.media.audio.models[].language` | Необов’язкова підказка щодо мови          |
| `prompt`  | `tools.media.audio.prompt`            | Необов’язковий prompt для транскрипції    |
| `baseUrl` | `tools.media.audio.baseUrl` or model  | Перевизначити сумісну з OpenAI базову URL |
| `headers` | `tools.media.audio.request.headers`   | Додаткові заголовки запиту                |

<Note>
SenseAudio в OpenClaw підтримує лише пакетне STT. Транскрипція голосових викликів у реальному часі
й надалі використовує провайдерів із підтримкою потокового STT.
</Note>
