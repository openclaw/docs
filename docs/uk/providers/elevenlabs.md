---
read_when:
    - Вам потрібне перетворення тексту на мовлення ElevenLabs в OpenClaw
    - Вам потрібен ElevenLabs Scribe для перетворення мовлення на текст в аудіовкладеннях
    - Вам потрібна транскрипція в реальному часі ElevenLabs для голосового виклику або Google Meet
summary: Використовуйте мовлення ElevenLabs, Scribe STT і транскрипцію в реальному часі з OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T06:21:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw використовує ElevenLabs для перетворення тексту на мовлення, пакетного перетворення мовлення на текст за допомогою Scribe
v2 і потокового STT за допомогою Scribe v2 Realtime.

| Можливість              | Поверхня OpenClaw                                                    | За замовчуванням        |
| ----------------------- | -------------------------------------------------------------------- | ----------------------- |
| Перетворення тексту на мовлення | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Пакетне перетворення мовлення на текст | `tools.media.audio`                                                  | `scribe_v2`              |
| Потокове перетворення мовлення на текст | потокова передача Voice Call або Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Автентифікація

Задайте `ELEVENLABS_API_KEY` у середовищі. `XI_API_KEY` також приймається для
сумісності з наявними інструментами ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Перетворення тексту на мовлення

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Задайте `modelId` як `eleven_v3`, щоб використовувати ElevenLabs v3 TTS. OpenClaw залишає
`eleven_multilingual_v2` типовим значенням для наявних інсталяцій.

## Перетворення мовлення на текст

Використовуйте Scribe v2 для вхідних аудіовкладень і коротких записаних голосових сегментів:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw надсилає multipart-аудіо до ElevenLabs `/v1/speech-to-text` з
`model_id: "scribe_v2"`. Мовні підказки зіставляються з `language_code`, якщо вони наявні.

## Потокове STT

Вбудований Plugin `elevenlabs` реєструє Scribe v2 Realtime для потокової транскрипції Voice Call і
режиму агента Google Meet.

| Налаштування   | Шлях конфігурації                                                      | За замовчуванням                                 |
| -------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| Ключ API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Повертається до `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Модель         | `...elevenlabs.modelId`                                                | `scribe_v2_realtime`                              |
| Формат аудіо   | `...elevenlabs.audioFormat`                                            | `ulaw_8000`                                       |
| Частота дискретизації | `...elevenlabs.sampleRate`                                             | `8000`                                            |
| Стратегія фіксації | `...elevenlabs.commitStrategy`                                         | `vad`                                             |
| Мова           | `...elevenlabs.languageCode`                                           | (не задано)                                       |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call отримує медіа Twilio як 8 кГц G.711 u-law. Провайдер ElevenLabs realtime
за замовчуванням використовує `ulaw_8000`, тому телефонні кадри можна пересилати без
транскодування.
</Note>

Для режиму агента Google Meet задайте
`plugins.entries.google-meet.config.realtime.transcriptionProvider` як
`"elevenlabs"` і налаштуйте той самий блок провайдера в
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Пов’язане

- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Google Meet](/uk/plugins/google-meet)
- [Вибір моделі](/uk/concepts/model-providers)
