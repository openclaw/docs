---
read_when:
    - Увімкнення Text-to-speech для відповідей
    - Налаштування provider-ів або лімітів TTS
    - Використання команд /tts
summary: Text-to-speech (TTS) для вихідних відповідей
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-25T05:59:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42faea3996a8a1e88ee09f597808b054fd86fc0935e7f5f781386d2e85da7508
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо за допомогою ElevenLabs, Google Gemini, Gradium, Microsoft, MiniMax, OpenAI, Vydra або xAI.
Це працює всюди, де OpenClaw може надсилати аудіо.

## Підтримувані сервіси

- **ElevenLabs** (основний або fallback provider)
- **Google Gemini** (основний або fallback provider; використовує Gemini API TTS)
- **Gradium** (основний або fallback provider; підтримує вивід voice-note і telephony)
- **Microsoft** (основний або fallback provider; поточна комплектна реалізація використовує `node-edge-tts`)
- **MiniMax** (основний або fallback provider; використовує API T2A v2)
- **OpenAI** (основний або fallback provider; також використовується для summary)
- **Vydra** (основний або fallback provider; спільний provider для зображень, відео та мовлення)
- **xAI** (основний або fallback provider; використовує xAI TTS API)

### Примітки щодо мовлення Microsoft

Поточний комплектний provider мовлення Microsoft зараз використовує онлайн-сервіс
нейронного TTS Microsoft Edge через бібліотеку `node-edge-tts`. Це хостований сервіс (не
локальний), він використовує endpoint-и Microsoft і не потребує API key.
`node-edge-tts` надає параметри конфігурації мовлення й формати виводу, але
не всі параметри підтримуються сервісом. Застарілий конфігураційний і директивний ввід
із `edge` усе ще працює і нормалізується до `microsoft`.

Оскільки цей шлях використовує публічний вебсервіс без опублікованого SLA або квоти,
розглядайте його як best-effort. Якщо вам потрібні гарантовані ліміти й підтримка, використовуйте OpenAI
або ElevenLabs.

## Необов’язкові ключі

Якщо ви хочете використовувати OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra або xAI:

- `ELEVENLABS_API_KEY` (або `XI_API_KEY`)
- `GEMINI_API_KEY` (або `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`

Мовлення Microsoft **не** потребує API key.

Якщо налаштовано кілька provider-ів, спочатку використовується вибраний provider, а інші слугують fallback-варіантами.
Auto-summary використовує налаштований `summaryModel` (або `agents.defaults.model.primary`),
тому, якщо ви вмикаєте summary, цей provider теж має бути автентифікований.

## Посилання на сервіси

- [Посібник OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідка OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/uk/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Формати виводу Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Чи ввімкнено це за замовчуванням?

Ні. Auto‑TTS **вимкнено** за замовчуванням. Увімкніть його в конфігурації через
`messages.tts.auto` або локально через `/tts on`.

Коли `messages.tts.provider` не задано, OpenClaw вибирає перший налаштований
speech provider у порядку авто-вибору registry.

## Конфігурація

Конфігурація TTS розміщується в `messages.tts` у `openclaw.json`.
Повна schema наведена в [Gateway configuration](/uk/gateway/configuration).

### Мінімальна конфігурація (увімкнення + provider)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI як основний, ElevenLabs як fallback

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft як основний (без API key)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### Google Gemini як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS використовує шлях API key Gemini. API key Google Cloud Console,
обмежений Gemini API, тут є валідним, і це той самий тип ключа, який використовує
комплектний provider генерації зображень Google. Порядок визначення такий:
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS використовує той самий шлях `XAI_API_KEY`, що й комплектний provider model Grok.
Порядок визначення: `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Поточні доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal` і `una`; типовим є `eve`.
`language` приймає тег BCP-47 або `auto`.

### OpenRouter як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS використовує той самий шлях `OPENROUTER_API_KEY`, що й комплектний
provider model OpenRouter. Порядок визначення:
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Gradium як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Вимкнення мовлення Microsoft

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Власні ліміти + шлях до prefs

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Відповідати аудіо лише після вхідного голосового повідомлення

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Вимкнення auto-summary для довгих відповідей

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Потім виконайте:

```
/tts summary off
```

### Примітки щодо полів

- `auto`: режим auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` надсилає аудіо лише після вхідного голосового повідомлення.
  - `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:key=value]]` або блок `[[tts:text]]...[[/tts:text]]`.
- `enabled`: застарілий перемикач (doctor мігрує його до `auto`).
- `mode`: `"final"` (типово) або `"all"` (включає відповіді tools/block).
- `provider`: id speech provider, наприклад `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"` або `"xai"` (fallback відбувається автоматично).
- Якщо `provider` **не задано**, OpenClaw використовує перший налаштований speech provider у порядку авто-вибору registry.
- Застарілу конфігурацію `provider: "edge"` виправляє `openclaw doctor --fix`, переписуючи її на `provider: "microsoft"`.
- `summaryModel`: необов’язкова недорога model для auto-summary; типово дорівнює `agents.defaults.model.primary`.
  - Приймає `provider/model` або налаштований псевдонім model.
- `modelOverrides`: дозволяє model видавати директиви TTS (типово увімкнено).
  - `allowProvider` типово дорівнює `false` (перемикання provider виконується лише через opt-in).
- `providers.<id>`: налаштування, що належать provider, із ключем за id speech provider.
- Застарілі прямі блоки provider (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) виправляються командою `openclaw doctor --fix`; у зафіксованій конфігурації слід використовувати `messages.tts.providers.<id>`.
- Застарілий `messages.tts.providers.edge` також виправляється командою `openclaw doctor --fix`; у зафіксованій конфігурації слід використовувати `messages.tts.providers.microsoft`.
- `maxTextLength`: жорстке обмеження для вхідного тексту TTS (символи). Якщо його перевищено, `/tts audio` завершується помилкою.
- `timeoutMs`: timeout запиту (мс).
- `prefsPath`: перевизначає локальний шлях до JSON-файла prefs (provider/limit/summary).
- Значення `apiKey` беруть fallback зі змінних середовища (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: перевизначає базовий URL API ElevenLabs.
- `providers.openai.baseUrl`: перевизначає endpoint OpenAI TTS.
  - Порядок визначення: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Значення, відмінні від типового, трактуються як сумісні з OpenAI endpoint-и TTS, тому допускаються власні назви model і voice.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (`1.0` = звичайно)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: дволітерний ISO 639-1 (наприклад, `en`, `de`)
- `providers.elevenlabs.seed`: ціле число `0..4294967295` (best-effort determinism)
- `providers.minimax.baseUrl`: перевизначає базовий URL API MiniMax (типово `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: model TTS (типово `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ідентифікатор voice (типово `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: швидкість відтворення `0.5..2.0` (типово 1.0).
- `providers.minimax.vol`: гучність `(0, 10]` (типово 1.0; має бути більшою за 0).
- `providers.minimax.pitch`: ціле зміщення тону `-12..12` (типово 0). Дробові значення обрізаються перед викликом MiniMax T2A, оскільки API відхиляє нецілі значення pitch.
- `providers.google.model`: model Gemini TTS (типово `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: назва вбудованого voice Gemini (типово `Kore`; також приймається `voice`).
- `providers.google.audioProfile`: prompt у стилі natural language, який додається перед озвучуваним текстом.
- `providers.google.speakerName`: необов’язкова мітка спікера, що додається перед озвучуваним текстом, коли ваш TTS prompt використовує іменованого спікера.
- `providers.google.baseUrl`: перевизначає базовий URL Gemini API. Дозволено лише `https://generativelanguage.googleapis.com`.
  - Якщо `messages.tts.providers.google.apiKey` пропущено, TTS може повторно використовувати `models.providers.google.apiKey` до переходу на env fallback.
- `providers.gradium.baseUrl`: перевизначає базовий URL API Gradium (типово `https://api.gradium.ai`).
- `providers.gradium.voiceId`: ідентифікатор voice Gradium (типово Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: API key xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: перевизначає базовий URL xAI TTS (типово `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: id voice xAI (типово `eve`; поточні доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: код мови BCP-47 або `auto` (типово `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` або `alaw` (типово `mp3`).
- `providers.xai.speed`: нативне перевизначення швидкості provider.
- `providers.openrouter.apiKey`: API key OpenRouter (env: `OPENROUTER_API_KEY`; може повторно використовувати `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: перевизначає базовий URL OpenRouter TTS (типово `https://openrouter.ai/api/v1`; застарілий `https://openrouter.ai/v1` нормалізується).
- `providers.openrouter.model`: id model OpenRouter TTS (типово `hexgrad/kokoro-82m`; також приймається `modelId`).
- `providers.openrouter.voice`: id voice, специфічний для provider (типово `af_alloy`; також приймається `voiceId`).
- `providers.openrouter.responseFormat`: `mp3` або `pcm` (типово `mp3`).
- `providers.openrouter.speed`: нативне перевизначення швидкості provider.
- `providers.microsoft.enabled`: дозволити використання мовлення Microsoft (типово `true`; без API key).
- `providers.microsoft.voice`: назва нейронного voice Microsoft (наприклад, `en-US-MichelleNeural`).
- `providers.microsoft.lang`: код мови (наприклад, `en-US`).
- `providers.microsoft.outputFormat`: формат виводу Microsoft (наприклад, `audio-24khz-48kbitrate-mono-mp3`).
  - Див. формати виводу Microsoft Speech для валідних значень; не всі формати підтримуються комплектним транспортом на базі Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: рядки-відсотки (наприклад, `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: записувати JSON-субтитри поруч з аудіофайлом.
- `providers.microsoft.proxy`: URL proxy для запитів до мовлення Microsoft.
- `providers.microsoft.timeoutMs`: перевизначення timeout запиту (мс).
- `edge.*`: застарілий псевдонім для тих самих налаштувань Microsoft. Виконайте
  `openclaw doctor --fix`, щоб переписати збережену конфігурацію на `providers.microsoft`.

## Перевизначення, керовані model (типово увімкнено)

За замовчуванням model **може** видавати директиви TTS для однієї відповіді.
Коли `messages.tts.auto` має значення `tagged`, ці директиви потрібні для запуску аудіо.

Коли це ввімкнено, model може видавати директиви `[[tts:...]]`, щоб перевизначити voice
для однієї відповіді, а також необов’язковий блок `[[tts:text]]...[[/tts:text]]`,
щоб надати expressive tags (сміх, підказки для співу тощо), які мають з’являтися лише
в аудіо.

Директиви `provider=...` ігноруються, якщо `modelOverrides.allowProvider: true` не встановлено.

Приклад payload відповіді:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Доступні ключі директив (коли це ввімкнено):

- `provider` (id зареєстрованого speech provider, наприклад `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra` або `xai`; потребує `allowProvider: true`)
- `voice` (voice OpenAI або Gradium), `voiceName` / `voice_name` / `google_voice` (voice Google) або `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (model OpenAI TTS, id model ElevenLabs або model MiniMax) або `google_model` (model Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0-10)
- `pitch` (цілий pitch MiniMax, від -12 до 12; дробові значення обрізаються перед запитом до MiniMax)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Вимкнути всі перевизначення model:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Необов’язковий allowlist (увімкнути перемикання provider, залишивши інші параметри налаштовуваними):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Налаштування для окремого користувача

Slash-команди записують локальні перевизначення в `prefsPath` (типово:
`~/.openclaw/settings/tts.json`, можна перевизначити через `OPENCLAW_TTS_PREFS` або
`messages.tts.prefsPath`).

Збережені поля:

- `enabled`
- `provider`
- `maxLength` (поріг summary; типово 1500 символів)
- `summarize` (типово `true`)

Вони перевизначають `messages.tts.*` для цього хоста.

## Формати виводу (фіксовані)

- **Feishu / Matrix / Telegram / WhatsApp**: голосове повідомлення Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48 кГц / 64 кбіт/с — це хороший компроміс для голосових повідомлень.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44,1 кГц / 128 кбіт/с — це типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (model `speech-2.8-hd`, частота дискретизації 32 кГц) для звичайних аудіовкладень. Для voice-note-цілей, таких як Feishu і Telegram, OpenClaw перед доставкою перекодовує MP3 MiniMax у 48 кГц Opus за допомогою `ffmpeg`.
- **Google Gemini**: Gemini API TTS повертає сирий PCM 24 кГц. OpenClaw обгортає його як WAV для аудіовкладень і повертає PCM напряму для Talk/telephony. Нативний формат голосових повідомлень Opus цим шляхом не підтримується.
- **Gradium**: WAV для аудіовкладень, Opus для voice-note-цілей і `ulaw_8000` на 8 кГц для telephony.
- **xAI**: типово MP3; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує пакетний REST TTS endpoint xAI і повертає завершене аудіовкладення; streaming TTS WebSocket xAI цим шляхом provider не використовується. Нативний формат голосових повідомлень Opus цим шляхом не підтримується.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Комплектний транспорт приймає `outputFormat`, але не всі формати доступні в сервісі.
  - Значення форматів виводу відповідають форматам виводу Microsoft Speech (включно з Ogg/WebM Opus).
  - Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення Opus.
  - Якщо налаштований формат виводу Microsoft завершується помилкою, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI/ElevenLabs фіксовані для кожного каналу (див. вище).

## Поведінка auto-TTS

Коли це увімкнено, OpenClaw:

- пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- пропускає дуже короткі відповіді (< 10 символів).
- виконує summary довгих відповідей, коли це ввімкнено, за допомогою `agents.defaults.model.primary` (або `summaryModel`).
- додає згенероване аудіо до відповіді.

Якщо відповідь перевищує `maxLength`, а summary вимкнено (або немає API key для
model summary), аудіо
пропускається і надсилається звичайна текстова відповідь.

## Схема потоку

```
Відповідь -> TTS увімкнено?
  ні   -> надіслати текст
  так  -> є медіа / MEDIA: / коротка?
          так  -> надіслати текст
          ні   -> довжина > ліміт?
                   ні   -> TTS -> прикріпити аудіо
                   так  -> summary увімкнено?
                            ні   -> надіслати текст
                            так  -> зробити summary (summaryModel або agents.defaults.model.primary)
                                      -> TTS -> прикріпити аудіо
```

## Використання slash-команди

Є одна команда: `/tts`.
Подробиці щодо ввімкнення див. у [Slash commands](/uk/tools/slash-commands).

Примітка для Discord: `/tts` — це вбудована команда Discord, тому OpenClaw реєструє
там нативну команду `/voice`. Текстовий варіант `/tts ...` усе одно працює.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Примітки:

- Команди потребують авторизованого відправника (правила allowlist/owner, як і раніше, застосовуються).
- Має бути ввімкнено `commands.text` або реєстрацію нативних команд.
- Конфігурація `messages.tts.auto` приймає `off|always|inbound|tagged`.
- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- Використовуйте конфігурацію, якщо хочете типові значення `inbound` або `tagged`.
- `limit` і `summary` зберігаються в локальних prefs, а не в основній конфігурації.
- `/tts audio` генерує одноразову аудіовідповідь (не вмикає TTS).
- `/tts status` включає видимість fallback для останньої спроби:
  - успішний fallback: `Fallback: <primary> -> <used>` плюс `Attempts: ...`
  - помилка: `Error: ...` плюс `Attempts: ...`
  - детальна діагностика: `Attempt details: provider:outcome(reasonCode) latency`
- Помилки API OpenAI та ElevenLabs тепер включають розібрані подробиці помилки provider і id запиту (коли його повертає provider), які відображаються в помилках/логах TTS.

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення й повертає аудіовкладення для
доставки у відповіді. Коли канал — Feishu, Matrix, Telegram або WhatsApp,
аудіо доставляється як голосове повідомлення, а не як файлове вкладення.
Він приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` — це
timeout запиту до provider для конкретного виклику в мілісекундах.

## Gateway RPC

Методи Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Пов’язане

- [Огляд медіа](/uk/tools/media-overview)
- [Генерація музики](/uk/tools/music-generation)
- [Генерація відео](/uk/tools/video-generation)
