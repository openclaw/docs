---
read_when:
    - Ви хочете використовувати синтез мовлення ElevenLabs в OpenClaw
    - Ви хочете використовувати перетворення мовлення на текст ElevenLabs Scribe для аудіовкладень
    - Вам потрібне транскрибування в реальному часі від ElevenLabs для голосового виклику або Google Meet
summary: Використовуйте синтез мовлення ElevenLabs, Scribe STT і транскрибування в реальному часі з OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T13:41:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw використовує ElevenLabs для синтезу мовлення з тексту, пакетного розпізнавання мовлення за допомогою Scribe
v2 і потокового розпізнавання мовлення за допомогою Scribe v2 Realtime. Plugin постачається в комплекті та
ввімкнений за замовчуванням; крок `plugins install` не потрібен.

| Можливість                         | Поверхня OpenClaw                                                   | Значення за замовчуванням |
| ---------------------------------- | ------------------------------------------------------------------- | ------------------------- |
| Синтез мовлення з тексту           | `messages.tts` / `talk`                                             | `eleven_multilingual_v2`  |
| Пакетне розпізнавання мовлення     | `tools.media.audio`                                                 | `scribe_v2`               |
| Потокове розпізнавання мовлення    | Потокова передача Voice Call або `realtime.transcriptionProvider` у Google Meet | `scribe_v2_realtime`      |

## Автентифікація

Установіть `ELEVENLABS_API_KEY` у середовищі. `XI_API_KEY` також підтримується для
сумісності з наявними інструментами ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Синтез мовлення з тексту

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

Установіть для `modelId` значення `eleven_v3`, щоб використовувати синтез мовлення ElevenLabs v3. OpenClaw зберігає
`eleven_multilingual_v2` як значення за замовчуванням для наявних інсталяцій.

Голосові канали Discord використовують потокову кінцеву точку синтезу мовлення ElevenLabs, коли ElevenLabs
вибрано як постачальника `voice.tts`/`messages.tts`: відтворення починається з
отриманого аудіопотоку, не очікуючи, поки OpenClaw спочатку завантажить увесь
аудіофайл. `latencyTier` зіставляється з параметром запиту ElevenLabs `optimize_streaming_latency`
для моделей, які його підтримують; OpenClaw не передає цей параметр для
`eleven_v3`, оскільки ця модель його відхиляє.

## Розпізнавання мовлення

Використовуйте Scribe v2 для вхідних аудіовкладень і коротких записаних голосових фрагментів:

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

OpenClaw надсилає багатокомпонентні аудіодані до кінцевої точки ElevenLabs `/v1/speech-to-text` із
`model_id: "scribe_v2"`. Підказки щодо мови, якщо вони наявні, зіставляються з `language_code`.

## Потокове розпізнавання мовлення

Вбудований Plugin `elevenlabs` реєструє Scribe v2 Realtime для потокового розпізнавання мовлення
у Voice Call і режимі агента Google Meet.

| Параметр             | Шлях конфігурації                                                        | Значення за замовчуванням                                  |
| -------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Ключ API             | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Використовує резервно `ELEVENLABS_API_KEY` / `XI_API_KEY`   |
| Модель               | `...elevenlabs.modelId`                                                  | `scribe_v2_realtime`                                        |
| Формат аудіо         | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                                  |
| Частота дискретизації | `...elevenlabs.sampleRate`                                              | `8000`                                                       |
| Стратегія фіксації   | `...elevenlabs.commitStrategy`                                           | `vad`                                                        |
| Мова                 | `...elevenlabs.languageCode`                                             | (не задано)                                                  |

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
Voice Call отримує медіадані Twilio у форматі 8 кГц G.711 u-law. Постачальник ElevenLabs для обробки в реальному часі
за замовчуванням використовує `ulaw_8000`, тому кадри телефонного аудіо можна передавати без
транскодування.
</Note>

Для режиму агента Google Meet установіть
`plugins.entries.google-meet.config.realtime.transcriptionProvider` у значення
`"elevenlabs"` і налаштуйте такий самий блок постачальника в
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Пов’язані матеріали

- [Синтез мовлення з тексту](/uk/tools/tts)
- [Google Meet](/uk/plugins/google-meet)
- [Вибір моделі](/uk/concepts/model-providers)
