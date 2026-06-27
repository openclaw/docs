---
read_when:
    - Вам потрібен Gradium для перетворення тексту на мовлення
    - Вам потрібна конфігурація ключа API Gradium, голосу або токена директиви
summary: Використовуйте перетворення тексту на мовлення Gradium в OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:11:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) — це провайдер перетворення тексту на мовлення для OpenClaw. Plugin може створювати звичайні аудіовідповіді (WAV), сумісний із голосовими нотатками вивід Opus та аудіо 8 kHz u-law для телефонних поверхонь.

| Властивість               | Значення                             |
| ------------------------- | ------------------------------------ |
| Ідентифікатор провайдера  | `gradium`                            |
| Автентифікація            | `GRADIUM_API_KEY` або config `apiKey` |
| Базова URL-адреса         | `https://api.gradium.ai` (типово)    |
| Голос за замовчуванням    | `Emma` (`YTpq7expH9539ERJ`)          |

## Установлення Plugin

Установіть офіційний Plugin, потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Налаштування

Створіть API-ключ Gradium, потім надайте його OpenClaw через змінну середовища або ключ конфігурації.

<Tabs>
  <Tab title="Змінна середовища">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Ключ конфігурації">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Plugin спочатку перевіряє розв’язаний `apiKey`, а потім повертається до змінної середовища `GRADIUM_API_KEY`.

## Конфігурація

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Ключ                                            | Тип    | Опис                                                                                              |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Розв’язаний API-ключ. Підтримує `${ENV}` і посилання на секрети.                                  |
| `messages.tts.providers.gradium.baseUrl`        | string | Перевизначає джерело API. Завершальні скісні риски видаляються. Типово `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | Ідентифікатор голосу за замовчуванням, який використовується, коли немає перевизначення директивою. |

Формат вихідного аудіо автоматично вибирається середовищем виконання на основі цільової поверхні й не налаштовується з `openclaw.json`. Див. [Вивід](#output) нижче.

## Голоси

| Ім’я      | Ідентифікатор голосу |
| --------- | -------------------- |
| Emma      | `YTpq7expH9539ERJ`   |
| Kent      | `LFZvm12tW_z0xfGo`   |
| Tiffany   | `Eu9iL_CYe8N-Gkx_`   |
| Christina | `2H4HY2CBNyJHBCrP`   |
| Sydney    | `jtEKaLYNn6iif5PR`   |
| John      | `KWJiFWu2O9nMPYcR`   |
| Arthur    | `3jUdJyOi9pgbxBTK`   |

Голос за замовчуванням: Emma.

### Перевизначення голосу для окремого повідомлення

Коли активна політика мовлення дозволяє перевизначення голосу, ви можете перемикати голоси вбудовано за допомогою токена директиви. Використовуйте `speakerVoiceId` для нативних ідентифікаторів голосу провайдера.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Якщо політика мовлення вимикає перевизначення голосу, директива споживається, але ігнорується.

## Вивід

Середовище виконання вибирає формат виводу з цільової поверхні. Наразі провайдер не синтезує інші формати.

| Ціль              | Формат      | Розширення файлу | Частота дискретизації | Прапорець сумісності з голосом |
| ----------------- | ----------- | ---------------- | --------------------- | ------------------------------ |
| Стандартне аудіо  | `wav`       | `.wav`           | провайдер             | ні                             |
| Голосова нотатка  | `opus`      | `.opus`          | провайдер             | так                            |
| Телефонія         | `ulaw_8000` | n/a              | 8 kHz                 | n/a                            |

## Порядок автоматичного вибору

Серед налаштованих TTS-провайдерів порядок автоматичного вибору Gradium — `30`. Див. [Перетворення тексту на мовлення](/uk/tools/tts), щоб дізнатися, як OpenClaw вибирає активного провайдера, коли `messages.tts.provider` не закріплено.

## Пов’язане

- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Огляд медіа](/uk/tools/media-overview)
