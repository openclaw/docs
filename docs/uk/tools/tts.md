---
read_when:
    - Увімкнення перетворення тексту на мовлення для відповідей
    - Налаштування постачальників TTS або обмежень
    - Використання команд `/tts`
summary: Перетворення тексту на мовлення (TTS) для вихідних відповідей
title: Перетворення тексту на мовлення
x-i18n:
    generated_at: "2026-04-25T08:51:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14a2d014850395add532faef86659acae7fd6a8a5757f9dd7dac606c0780d278
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо за допомогою ElevenLabs, Google Gemini, Gradium, Microsoft, MiniMax, OpenAI, Vydra, xAI або Xiaomi MiMo.
Це працює всюди, де OpenClaw може надсилати аудіо.

## Підтримувані сервіси

- **ElevenLabs** (основний або резервний постачальник)
- **Google Gemini** (основний або резервний постачальник; використовує Gemini API TTS)
- **Gradium** (основний або резервний постачальник; підтримує вихід voice-note і telephony)
- **Microsoft** (основний або резервний постачальник; поточна вбудована реалізація використовує `node-edge-tts`)
- **MiniMax** (основний або резервний постачальник; використовує API T2A v2)
- **OpenAI** (основний або резервний постачальник; також використовується для підсумків)
- **Vydra** (основний або резервний постачальник; спільний постачальник зображень, відео та мовлення)
- **xAI** (основний або резервний постачальник; використовує xAI TTS API)
- **Xiaomi MiMo** (основний або резервний постачальник; використовує MiMo TTS через chat completions Xiaomi)

### Примітки щодо мовлення Microsoft

Поточний вбудований постачальник мовлення Microsoft використовує онлайн-сервіс
нейронного TTS Microsoft Edge через бібліотеку `node-edge-tts`. Це хостинговий сервіс (не
локальний), він використовує кінцеві точки Microsoft і не потребує API-ключа.
`node-edge-tts` надає параметри конфігурації мовлення та вихідні формати, але
сервіс підтримує не всі параметри. Застаріла конфігурація та вхідні директиви
з використанням `edge` усе ще працюють і нормалізуються до `microsoft`.

Оскільки цей шлях використовує загальнодоступний вебсервіс без опублікованих SLA або квот,
вважайте його best-effort. Якщо вам потрібні гарантовані ліміти та підтримка, використовуйте OpenAI
або ElevenLabs.

## Необов’язкові ключі

Якщо ви хочете використовувати OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI або Xiaomi MiMo:

- `ELEVENLABS_API_KEY` (або `XI_API_KEY`)
- `GEMINI_API_KEY` (або `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Мовлення Microsoft **не** потребує API-ключа.

Якщо налаштовано кілька постачальників, спочатку використовується вибраний постачальник, а решта слугують резервними варіантами.
Автоматичний підсумок використовує налаштований `summaryModel` (або `agents.defaults.model.primary`),
тому якщо ви вмикаєте підсумки, цей постачальник також має бути автентифікований.

## Посилання на сервіси

- [Посібник OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідник OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/uk/providers/gradium)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [Синтез мовлення Xiaomi MiMo](/uk/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Вихідні формати Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Чи ввімкнено це за замовчуванням?

Ні. Автоматичний TTS **вимкнено** за замовчуванням. Увімкніть його в конфігурації через
`messages.tts.auto` або локально через `/tts on`.

Коли `messages.tts.provider` не задано, OpenClaw вибирає першого налаштованого
постачальника мовлення в порядку автоматичного вибору реєстру.

## Конфігурація

Конфігурація TTS розміщується в `messages.tts` у `openclaw.json`.
Повна схема наведена в [Конфігурація Gateway](/uk/gateway/configuration).

### Мінімальна конфігурація (увімкнення + постачальник)

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

### OpenAI як основний з ElevenLabs як резервним

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

### Microsoft як основний (без API-ключа)

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

Google Gemini TTS використовує шлях API-ключа Gemini. Тут дійсний API-ключ Google Cloud Console,
обмежений Gemini API, і це той самий тип ключа, який використовується
вбудованим постачальником генерації зображень Google. Порядок визначення:
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

xAI TTS використовує той самий шлях `XAI_API_KEY`, що й вбудований постачальник моделей Grok.
Порядок визначення: `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Поточні доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal` і `una`; `eve` —
значення за замовчуванням. `language` приймає тег BCP-47 або `auto`.

### Xiaomi MiMo як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS використовує той самий шлях `XIAOMI_API_KEY`, що й вбудований постачальник моделей Xiaomi.
Ідентифікатор постачальника мовлення — `xiaomi`; `mimo` також приймається як псевдонім.
Цільовий текст надсилається як повідомлення асистента відповідно до контракту TTS Xiaomi.
Необов’язковий `style` надсилається як інструкція користувача і не озвучується.

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

OpenRouter TTS використовує той самий шлях `OPENROUTER_API_KEY`, що й вбудований
постачальник моделей OpenRouter. Порядок визначення:
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

### Вимкнення автоматичного підсумку для довгих відповідей

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

- `auto`: режим автоматичного TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` надсилає аудіо лише після вхідного голосового повідомлення.
  - `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:key=value]]` або блок `[[tts:text]]...[[/tts:text]]`.
- `enabled`: застарілий перемикач (doctor мігрує його до `auto`).
- `mode`: `"final"` (за замовчуванням) або `"all"` (включає відповіді інструментів/блоків).
- `provider`: ідентифікатор постачальника мовлення, наприклад `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` або `"xiaomi"` (резервне перемикання відбувається автоматично).
- Якщо `provider` **не задано**, OpenClaw використовує першого налаштованого постачальника мовлення в порядку автоматичного вибору реєстру.
- Застаріла конфігурація `provider: "edge"` виправляється командою `openclaw doctor --fix` і
  переписується на `provider: "microsoft"`.
- `summaryModel`: необов’язкова недорога модель для автоматичного підсумку; за замовчуванням використовується `agents.defaults.model.primary`.
  - Приймає `provider/model` або псевдонім налаштованої моделі.
- `modelOverrides`: дозволяє моделі виводити директиви TTS (увімкнено за замовчуванням).
  - `allowProvider` за замовчуванням має значення `false` (перемикання постачальника вмикається явно).
- `providers.<id>`: налаштування, що належать постачальнику, із ключем за ідентифікатором постачальника мовлення.
- Застарілі прямі блоки постачальників (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) виправляються командою `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `messages.tts.providers.<id>`.
- Застарілий `messages.tts.providers.edge` також виправляється командою `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `messages.tts.providers.microsoft`.
- `maxTextLength`: жорстке обмеження для вхідного тексту TTS (символи). `/tts audio` завершується помилкою, якщо ліміт перевищено.
- `timeoutMs`: тайм-аут запиту (мс).
- `prefsPath`: перевизначає локальний шлях до JSON-файлу prefs (постачальник/ліміт/підсумок).
- Значення `apiKey` беруться з env vars (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`), якщо не задані явно.
- `providers.elevenlabs.baseUrl`: перевизначає базовий URL API ElevenLabs.
- `providers.openai.baseUrl`: перевизначає кінцеву точку OpenAI TTS.
  - Порядок визначення: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Значення, відмінні від типових, розглядаються як OpenAI-сумісні кінцеві точки TTS, тому допускаються власні назви моделей і голосів.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = нормально)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-літерний ISO 639-1 (наприклад, `en`, `de`)
- `providers.elevenlabs.seed`: ціле число `0..4294967295` (best-effort determinism)
- `providers.minimax.baseUrl`: перевизначає базовий URL API MiniMax (за замовчуванням `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: модель TTS (за замовчуванням `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ідентифікатор голосу (за замовчуванням `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: швидкість відтворення `0.5..2.0` (за замовчуванням 1.0).
- `providers.minimax.vol`: гучність `(0, 10]` (за замовчуванням 1.0; має бути більшою за 0).
- `providers.minimax.pitch`: цілочисельне зміщення тону `-12..12` (за замовчуванням 0). Дробові значення відкидаються перед викликом MiniMax T2A, оскільки API не приймає нецілі значення тону.
- `providers.google.model`: модель Gemini TTS (за замовчуванням `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: назва вбудованого голосу Gemini (за замовчуванням `Kore`; також приймається `voice`).
- `providers.google.audioProfile`: підказка зі стилем природною мовою, що додається перед озвучуваним текстом.
- `providers.google.speakerName`: необов’язкова мітка мовця, що додається перед озвучуваним текстом, коли ваш TTS prompt використовує іменованого мовця.
- `providers.google.baseUrl`: перевизначає базовий URL Gemini API. Приймається лише `https://generativelanguage.googleapis.com`.
  - Якщо `messages.tts.providers.google.apiKey` пропущено, TTS може повторно використати `models.providers.google.apiKey` перед переходом до env.
- `providers.gradium.baseUrl`: перевизначає базовий URL API Gradium (за замовчуванням `https://api.gradium.ai`).
- `providers.gradium.voiceId`: ідентифікатор голосу Gradium (за замовчуванням Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: API-ключ xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: перевизначає базовий URL xAI TTS (за замовчуванням `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: ідентифікатор голосу xAI (за замовчуванням `eve`; поточні доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: код мови BCP-47 або `auto` (за замовчуванням `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` або `alaw` (за замовчуванням `mp3`).
- `providers.xai.speed`: перевизначення швидкості на рівні постачальника.
- `providers.xiaomi.apiKey`: API-ключ Xiaomi MiMo (env: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: перевизначає базовий URL API Xiaomi MiMo (за замовчуванням `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: модель TTS (за замовчуванням `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; також підтримується `mimo-v2-tts`).
- `providers.xiaomi.voice`: ідентифікатор голосу MiMo (за замовчуванням `mimo_default`, env: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` або `wav` (за замовчуванням `mp3`, env: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: необов’язкова інструкція щодо стилю природною мовою, яка надсилається як повідомлення користувача; вона не озвучується.
- `providers.openrouter.apiKey`: API-ключ OpenRouter (env: `OPENROUTER_API_KEY`; може повторно використовувати `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: перевизначає базовий URL OpenRouter TTS (за замовчуванням `https://openrouter.ai/api/v1`; застарілий `https://openrouter.ai/v1` нормалізується).
- `providers.openrouter.model`: ідентифікатор моделі OpenRouter TTS (за замовчуванням `hexgrad/kokoro-82m`; також приймається `modelId`).
- `providers.openrouter.voice`: ідентифікатор голосу, специфічний для постачальника (за замовчуванням `af_alloy`; також приймається `voiceId`).
- `providers.openrouter.responseFormat`: `mp3` або `pcm` (за замовчуванням `mp3`).
- `providers.openrouter.speed`: перевизначення швидкості на рівні постачальника.
- `providers.microsoft.enabled`: дозволяє використання мовлення Microsoft (за замовчуванням `true`; без API-ключа).
- `providers.microsoft.voice`: назва нейронного голосу Microsoft (наприклад, `en-US-MichelleNeural`).
- `providers.microsoft.lang`: код мови (наприклад, `en-US`).
- `providers.microsoft.outputFormat`: вихідний формат Microsoft (наприклад, `audio-24khz-48kbitrate-mono-mp3`).
  - Дійсні значення див. у Microsoft Speech output formats; не всі формати підтримуються вбудованим транспортом на базі Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: рядки у відсотках (наприклад, `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: записує JSON-субтитри поруч з аудіофайлом.
- `providers.microsoft.proxy`: URL проксі для запитів до мовлення Microsoft.
- `providers.microsoft.timeoutMs`: перевизначення тайм-ауту запиту (мс).
- `edge.*`: застарілий псевдонім для тих самих налаштувань Microsoft. Виконайте
  `openclaw doctor --fix`, щоб переписати збережену конфігурацію на `providers.microsoft`.

## Перевизначення, керовані моделлю (увімкнено за замовчуванням)

За замовчуванням модель **може** виводити директиви TTS для однієї відповіді.
Коли `messages.tts.auto` має значення `tagged`, ці директиви потрібні для запуску аудіо.

Коли цю функцію ввімкнено, модель може виводити директиви `[[tts:...]]` для перевизначення голосу
для однієї відповіді, а також необов’язковий блок `[[tts:text]]...[[/tts:text]]`, щоб
додати виразні теги (сміх, підказки для співу тощо), які мають з’являтися лише в
аудіо.

Директиви `provider=...` ігноруються, якщо `modelOverrides.allowProvider: true` не встановлено.

Приклад payload відповіді:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Доступні ключі директив (коли ввімкнено):

- `provider` (ідентифікатор зареєстрованого постачальника мовлення, наприклад `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` або `xiaomi`; потребує `allowProvider: true`)
- `voice` (голос OpenAI, Gradium або Xiaomi), `voiceName` / `voice_name` / `google_voice` (голос Google) або `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (модель OpenAI TTS, ідентифікатор моделі ElevenLabs, модель MiniMax або модель Xiaomi MiMo TTS) або `google_model` (модель Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0-10)
- `pitch` (цілочисельний тон MiniMax, від -12 до 12; дробові значення відкидаються перед запитом MiniMax)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Вимкнути всі перевизначення моделі:

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

Необов’язковий allowlist (увімкнути перемикання постачальника, зберігши можливість налаштовувати інші параметри):

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

## Налаштування для окремих користувачів

Команди зі слешем записують локальні перевизначення до `prefsPath` (за замовчуванням:
`~/.openclaw/settings/tts.json`, можна перевизначити через `OPENCLAW_TTS_PREFS` або
`messages.tts.prefsPath`).

Поля, що зберігаються:

- `enabled`
- `provider`
- `maxLength` (поріг підсумку; за замовчуванням 1500 символів)
- `summarize` (за замовчуванням `true`)

Вони перевизначають `messages.tts.*` для цього хоста.

## Вихідні формати (фіксовані)

- **Feishu / Matrix / Telegram / WhatsApp**: для відповідей voice-note перевага надається Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48 кГц / 64 кбіт/с — хороший компроміс для голосових повідомлень.
- **Feishu**: коли відповідь voice-note створюється як MP3/WAV/M4A або інший
  імовірний аудіофайл, плагін Feishu перекодовує її в 48 кГц Ogg/Opus за допомогою
  `ffmpeg` перед надсиланням нативної бульбашки `audio`. Якщо перетворення не вдається, Feishu
  отримує оригінальний файл як вкладення.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44,1 кГц / 128 кбіт/с — типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, частота дискретизації 32 кГц) для звичайних аудіовкладень. Для цілей voice-note, таких як Feishu і Telegram, OpenClaw перекодовує MP3 від MiniMax у 48 кГц Opus за допомогою `ffmpeg` перед доставленням.
- **Xiaomi MiMo**: MP3 за замовчуванням або WAV, якщо налаштовано. Для цілей voice-note, таких як Feishu і Telegram, OpenClaw перекодовує вихід Xiaomi у 48 кГц Opus за допомогою `ffmpeg` перед доставленням.
- **Google Gemini**: Gemini API TTS повертає необроблений PCM 24 кГц. OpenClaw обгортає його у WAV для аудіовкладень і повертає PCM безпосередньо для Talk/telephony. Нативний формат voice-note Opus цим шляхом не підтримується.
- **Gradium**: WAV для аудіовкладень, Opus для цілей voice-note і `ulaw_8000` на 8 кГц для telephony.
- **xAI**: MP3 за замовчуванням; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує пакетну REST-кінцеву точку TTS від xAI і повертає завершене аудіовкладення; потоковий TTS WebSocket від xAI не використовується цим шляхом постачальника. Нативний формат voice-note Opus цим шляхом не підтримується.
- **Microsoft**: використовує `microsoft.outputFormat` (за замовчуванням `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований транспорт приймає `outputFormat`, але сервіс підтримує не всі формати.
  - Значення вихідного формату відповідають Microsoft Speech output formats (включно з Ogg/WebM Opus).
  - Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам
    потрібні гарантовані голосові повідомлення Opus.
  - Якщо налаштований вихідний формат Microsoft не спрацьовує, OpenClaw повторює спробу з MP3.

Вихідні формати OpenAI/ElevenLabs фіксовані для кожного каналу (див. вище).

## Поведінка автоматичного TTS

Коли функцію ввімкнено, OpenClaw:

- пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- пропускає дуже короткі відповіді (< 10 символів).
- підсумовує довгі відповіді, коли це ввімкнено, за допомогою `agents.defaults.model.primary` (або `summaryModel`).
- додає згенероване аудіо до відповіді.

Якщо відповідь перевищує `maxLength`, а підсумок вимкнено (або немає API-ключа для
моделі підсумку), аудіо
пропускається, і надсилається звичайна текстова відповідь.

## Схема потоку

```
Відповідь -> TTS увімкнено?
  ні   -> надіслати текст
  так  -> є медіа / MEDIA: / коротко?
          так -> надіслати текст
          ні  -> довжина > ліміт?
                   ні  -> TTS -> прикріпити аудіо
                   так -> підсумок увімкнено?
                            ні  -> надіслати текст
                            так -> підсумувати (`summaryModel` або `agents.defaults.model.primary`)
                                      -> TTS -> прикріпити аудіо
```

## Використання команд зі слешем

Є одна команда: `/tts`.
Деталі ввімкнення див. у [Команди зі слешем](/uk/tools/slash-commands).

Примітка щодо Discord: `/tts` — це вбудована команда Discord, тому OpenClaw реєструє
там `/voice` як нативну команду. Текстова команда `/tts ...` усе одно працює.

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

- Команди потребують авторизованого відправника (правила allowlist/owner також застосовуються).
- Має бути ввімкнено `commands.text` або реєстрацію нативних команд.
- Конфігурація `messages.tts.auto` приймає `off|always|inbound|tagged`.
- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- Використовуйте конфігурацію, якщо потрібні типові значення `inbound` або `tagged`.
- `limit` і `summary` зберігаються в локальних prefs, а не в основній конфігурації.
- `/tts audio` генерує одноразову аудіовідповідь (не вмикає TTS).
- `/tts status` містить видимість резервного перемикання для останньої спроби:
  - успішне резервне перемикання: `Fallback: <primary> -> <used>` плюс `Attempts: ...`
  - помилка: `Error: ...` плюс `Attempts: ...`
  - детальна діагностика: `Attempt details: provider:outcome(reasonCode) latency`
- Збої API OpenAI і ElevenLabs тепер включають розібрані деталі помилки постачальника та request id (коли постачальник його повертає), які відображаються в помилках/журналах TTS.

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення та повертає аудіовкладення для
доставлення у відповіді. Коли каналом є Feishu, Matrix, Telegram або WhatsApp,
аудіо доставляється як голосове повідомлення, а не як файлове вкладення.
Feishu може перекодовувати не-Opus вихід TTS на цьому шляху, коли доступний
`ffmpeg`.
Він приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` — це
тайм-аут запиту до постачальника для окремого виклику в мілісекундах.

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
