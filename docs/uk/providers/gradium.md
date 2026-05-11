---
read_when:
    - Вам потрібен Gradium для перетворення тексту на мовлення
    - Потрібні налаштування API-ключа Gradium, голосу або токена директиви
summary: Використання перетворення тексту на мовлення Gradium в OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-05-11T20:54:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c79da6ec63532061a8112965a679f1113bbefcc91ee00def8153dd39b5b5e58
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) — це вбудований постачальник перетворення тексту на мовлення для OpenClaw. Plugin може створювати звичайні аудіовідповіді (WAV), сумісний із голосовими нотатками вивід Opus і 8 кГц u-law аудіо для телефонних поверхонь.

| Властивість        | Значення                             |
| ------------------ | ------------------------------------ |
| Ідентифікатор постачальника | `gradium`                            |
| Автентифікація     | `GRADIUM_API_KEY` або config `apiKey` |
| Базова URL-адреса  | `https://api.gradium.ai` (за замовчуванням) |
| Голос за замовчуванням | `Emma` (`YTpq7expH9539ERJ`)          |

## Налаштування

Створіть ключ Gradium API, а потім надайте його OpenClaw через змінну середовища або ключ конфігурації.

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config key">
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

Plugin спочатку перевіряє вирішений `apiKey` і в разі відсутності використовує змінну середовища `GRADIUM_API_KEY`.

## Конфігурація

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Ключ                                     | Тип    | Опис                                                                                          |
| ---------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`  | string | Вирішений ключ API. Підтримує `${ENV}` і посилання на секрети.                                |
| `messages.tts.providers.gradium.baseUrl` | string | Перевизначає джерело API. Кінцеві скісні риски видаляються. За замовчуванням `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.voiceId` | string | Ідентифікатор голосу за замовчуванням, який використовується, коли немає перевизначення директивою. |

Формат вихідного аудіо автоматично вибирається runtime на основі цільової поверхні й не налаштовується з `openclaw.json`. Див. [Вивід](#output) нижче.

## Голоси

| Назва     | Ідентифікатор голосу |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Голос за замовчуванням: Emma.

### Перевизначення голосу для окремого повідомлення

Коли активна політика мовлення дозволяє перевизначення голосу, ви можете перемикати голоси безпосередньо в тексті за допомогою токена директиви. Усі ці варіанти вирішуються в одне й те саме перевизначення `voiceId`:

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Якщо політика мовлення вимикає перевизначення голосу, директива споживається, але ігнорується.

## Вивід

Runtime вибирає формат виводу з цільової поверхні. Наразі постачальник не синтезує інші формати.

| Ціль           | Формат      | Розширення файлу | Частота дискретизації | Прапорець сумісності з голосом |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| Стандартне аудіо | `wav`       | `.wav`   | постачальник | ні                    |
| Голосова нотатка | `opus`      | `.opus`  | постачальник | так                   |
| Телефонія      | `ulaw_8000` | n/a      | 8 кГц       | n/a                   |

## Порядок автоматичного вибору

Серед налаштованих постачальників TTS порядок автоматичного вибору Gradium дорівнює `30`. Див. [Перетворення тексту на мовлення](/uk/tools/tts), щоб дізнатися, як OpenClaw вибирає активного постачальника, коли `messages.tts.provider` не закріплено.

## Пов’язане

- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Огляд медіа](/uk/tools/media-overview)
