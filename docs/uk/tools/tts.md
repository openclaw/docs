---
read_when:
    - Увімкнення text-to-speech для відповідей
    - Налаштування provider-ів або лімітів TTS
    - Використання команд /tts
summary: Text-to-speech (TTS) для вихідних відповідей
title: Text-to-speech♀♀♀♀♀♀analysis to=functions.read  สล็อตโcommentary  微信上的天天中彩票 久久免费热在线精品  东臣  бызшәа  უპ്  天天中彩票在  content='{"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n/AGENTS.md"}'
x-i18n:
    generated_at: "2026-04-23T21:17:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5b600070d2688225a6d939541db2e98e2c01342a0e3ae14650c28219dc76eb1
    source_path: tools/tts.md
    workflow: 15
---

# Text-to-speech (TTS)

OpenClaw може перетворювати вихідні відповіді на аудіо за допомогою ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI або xAI.
Це працює всюди, де OpenClaw може надсилати аудіо.

## Підтримувані сервіси

- **ElevenLabs** (основний або fallback provider)
- **Google Gemini** (основний або fallback provider; використовує Gemini API TTS)
- **Microsoft** (основний або fallback provider; поточна bundled-реалізація використовує `node-edge-tts`)
- **MiniMax** (основний або fallback provider; використовує API T2A v2)
- **OpenAI** (основний або fallback provider; також використовується для summary)
- **xAI** (основний або fallback provider; використовує xAI TTS API)

### Примітки щодо Microsoft speech

Поточний bundled provider Microsoft speech використовує онлайн-сервіс neural TTS Microsoft Edge
через бібліотеку `node-edge-tts`. Це хостований сервіс (не локальний),
використовує endpoint-и Microsoft і не потребує API key.
`node-edge-tts` надає параметри конфігурації мовлення й формати виводу, але
сервіс підтримує не всі параметри. Застарілі config та вхідні дані директив,
що використовують `edge`, усе ще працюють і нормалізуються до `microsoft`.

Оскільки цей шлях використовує публічний веб-сервіс без опублікованого SLA або quota,
ставтеся до нього як до best-effort. Якщо вам потрібні гарантовані ліміти й підтримка, використовуйте OpenAI
або ElevenLabs.

## Необов’язкові ключі

Якщо ви хочете використовувати OpenAI, ElevenLabs, Google Gemini, MiniMax або xAI:

- `ELEVENLABS_API_KEY` (або `XI_API_KEY`)
- `GEMINI_API_KEY` (або `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft speech **не** потребує API key.

Якщо налаштовано кілька provider-ів, спочатку використовується вибраний provider, а решта є fallback-варіантами.
Auto-summary використовує налаштований `summaryModel` (або `agents.defaults.model.primary`),
тому якщо ви вмикаєте summary, цей provider також має бути автентифікований.

## Посилання на сервіси

- [Посібник OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідник OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Формати виводу Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Чи ввімкнено це типово?

Ні. Auto‑TTS **типово вимкнено**. Увімкніть його в config через
`messages.tts.auto` або локально через `/tts on`.

Коли `messages.tts.provider` не задано, OpenClaw вибирає перший налаштований
speech provider у порядку auto-select реєстру.

## Config

Config TTS живе в `messages.tts` у `openclaw.json`.
Повна schema є в [Конфігурації Gateway](/uk/gateway/configuration).

### Мінімальний config (увімкнення + provider)

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
обмежений лише Gemini API, тут є коректним, і це той самий тип ключа, який використовується
вбудованим provider-ом генерації зображень Google. Порядок визначення такий:
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

xAI TTS використовує той самий шлях `XAI_API_KEY`, що й bundled provider моделей Grok.
Порядок визначення такий: `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Поточні live-voice: `ara`, `eve`, `leo`, `rex`, `sal` і `una`; типовим є `eve`.
`language` приймає тег BCP-47 або `auto`.

### Вимкнути Microsoft speech

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

### Кастомні ліміти + шлях prefs

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

### Відповідати аудіо лише після вхідного voice message

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Вимкнути auto-summary для довгих відповідей

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
  - `inbound` надсилає аудіо лише після вхідного voice message.
  - `tagged` надсилає аудіо лише коли відповідь містить директиви `[[tts:key=value]]` або блок `[[tts:text]]...[[/tts:text]]`.
- `enabled`: застарілий перемикач (doctor мігрує його в `auto`).
- `mode`: `"final"` (типово) або `"all"` (включає відповіді tools/block).
- `provider`: id speech provider-а, наприклад `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` або `"openai"` (fallback відбувається автоматично).
- Якщо `provider` **не задано**, OpenClaw використовує перший налаштований speech provider у порядку auto-select реєстру.
- Застарілий `provider: "edge"` усе ще працює і нормалізується до `microsoft`.
- `summaryModel`: необов’язкова дешева модель для auto-summary; типово використовується `agents.defaults.model.primary`.
  - Приймає `provider/model` або налаштований alias моделі.
- `modelOverrides`: дозволяє моделі виводити TTS directives (типово увімкнено).
  - `allowProvider` типово має значення `false` (перемикання provider-а відбувається лише через opt-in).
- `providers.<id>`: налаштування, якими володіє provider, із ключем за id speech provider-а.
- Застарілі прямі блоки provider-ів (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) автоматично мігруються до `messages.tts.providers.<id>` під час завантаження.
- `maxTextLength`: жорстке обмеження для вхідного TTS (символи). `/tts audio` завершується помилкою, якщо його перевищено.
- `timeoutMs`: timeout запиту (мс).
- `prefsPath`: перевизначає локальний шлях до JSON prefs (provider/limit/summary).
- Значення `apiKey` повертаються до env-змінних (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: перевизначає API base URL ElevenLabs.
- `providers.openai.baseUrl`: перевизначає endpoint OpenAI TTS.
  - Порядок визначення: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Значення, відмінні від типового, трактуються як OpenAI-compatible TTS endpoint-и, тож кастомні назви моделей і voice приймаються.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = звичайно)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-літерний ISO 639-1 (наприклад, `en`, `de`)
- `providers.elevenlabs.seed`: ціле число `0..4294967295` (best-effort determinism)
- `providers.minimax.baseUrl`: перевизначає MiniMax API base URL (типово `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: модель TTS (типово `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ідентифікатор голосу (типово `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: швидкість відтворення `0.5..2.0` (типово 1.0).
- `providers.minimax.vol`: гучність `(0, 10]` (типово 1.0; має бути більшою за 0).
- `providers.minimax.pitch`: зсув висоти тону `-12..12` (типово 0).
- `providers.google.model`: модель Gemini TTS (типово `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: назва вбудованого голосу Gemini (типово `Kore`; також приймається `voice`).
- `providers.google.baseUrl`: перевизначає Gemini API base URL. Приймається лише `https://generativelanguage.googleapis.com`.
  - Якщо `messages.tts.providers.google.apiKey` пропущено, TTS може повторно використовувати `models.providers.google.apiKey` до env fallback.
- `providers.xai.apiKey`: API key xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: перевизначає xAI TTS base URL (типово `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: id голосу xAI (типово `eve`; поточні live-voice: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: код мови BCP-47 або `auto` (типово `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` або `alaw` (типово `mp3`).
- `providers.xai.speed`: перевизначення швидкості, нативне для provider-а.
- `providers.microsoft.enabled`: дозволити використання Microsoft speech (типово `true`; без API key).
- `providers.microsoft.voice`: назва Microsoft neural voice (наприклад, `en-US-MichelleNeural`).
- `providers.microsoft.lang`: код мови (наприклад, `en-US`).
- `providers.microsoft.outputFormat`: формат виводу Microsoft (наприклад, `audio-24khz-48kbitrate-mono-mp3`).
  - Коректні значення див. у Microsoft Speech output formats; не всі формати підтримуються bundled transport-ом на основі Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: рядки відсотків (наприклад, `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: записувати JSON-субтитри поруч з аудіофайлом.
- `providers.microsoft.proxy`: URL proxy для запитів Microsoft speech.
- `providers.microsoft.timeoutMs`: перевизначення timeout запиту (мс).
- `edge.*`: застарілий псевдонім для тих самих налаштувань Microsoft.

## Перевизначення, керовані моделлю (типово увімкнено)

Типово модель **може** виводити TTS directives для однієї відповіді.
Коли `messages.tts.auto` має значення `tagged`, ці директиви потрібні для запуску аудіо.

Коли це ввімкнено, модель може виводити директиви `[[tts:...]]`, щоб перевизначити voice
для однієї відповіді, а також необов’язковий блок `[[tts:text]]...[[/tts:text]]`, щоб
надати виразні теги (сміх, підказки для співу тощо), які мають з’являтися лише в
аудіо.

Директиви `provider=...` ігноруються, якщо тільки `modelOverrides.allowProvider: true` не має значення true.

Приклад payload відповіді:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Доступні ключі директив (коли це ввімкнено):

- `provider` (id зареєстрованого speech provider-а, наприклад `openai`, `elevenlabs`, `google`, `minimax` або `microsoft`; вимагає `allowProvider: true`)
- `voice` (voice OpenAI), `voiceName` / `voice_name` / `google_voice` (voice Google) або `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (модель OpenAI TTS, id моделі ElevenLabs або модель MiniMax) або `google_model` (модель Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0-10)
- `pitch` (висота тону MiniMax, -12 до 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Вимкнути всі перевизначення, керовані моделлю:

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

Необов’язковий allowlist (увімкнути перемикання provider-а, залишивши інші параметри налаштовуваними):

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

## Налаштування для кожного користувача

Slash-команди записують локальні перевизначення в `prefsPath` (типово:
`~/.openclaw/settings/tts.json`, перевизначається через `OPENCLAW_TTS_PREFS` або
`messages.tts.prefsPath`).

Поля, що зберігаються:

- `enabled`
- `provider`
- `maxLength` (поріг для summary; типово 1500 символів)
- `summarize` (типово `true`)

Вони перевизначають `messages.tts.*` для цього host-а.

## Формати виводу (фіксовані)

- **Feishu / Matrix / Telegram / WhatsApp**: голосове повідомлення Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48kHz / 64kbps — хороший компроміс для voice message.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44.1kHz / 128kbps — типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, sample rate 32kHz). Формат voice note нативно не підтримується; використовуйте OpenAI або ElevenLabs для гарантованих voice message у форматі Opus.
- **Google Gemini**: Gemini API TTS повертає сирий PCM 24kHz. OpenClaw обгортає його у WAV для audio attachment-ів і повертає PCM напряму для Talk/telephony. Нативний формат voice note Opus цим шляхом не підтримується.
- **xAI**: типово MP3; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує batch REST TTS endpoint xAI і повертає готовий audio attachment; streaming TTS WebSocket xAI не використовується цим шляхом provider-а. Нативний формат voice note Opus цим шляхом не підтримується.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Bundled transport приймає `outputFormat`, але сервіс надає не всі формати.
  - Значення output format відповідають Microsoft Speech output formats (включно з Ogg/WebM Opus).
  - Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення у форматі Opus.
  - Якщо налаштований формат виводу Microsoft не працює, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI/ElevenLabs фіксовані для кожного каналу (див. вище).

## Поведінка auto-TTS

Коли це ввімкнено, OpenClaw:

- пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- пропускає дуже короткі відповіді (< 10 символів).
- робить summary довгих відповідей, коли це ввімкнено, використовуючи `agents.defaults.model.primary` (або `summaryModel`).
- додає згенероване аудіо до відповіді.

Якщо відповідь перевищує `maxLength` і summary вимкнено (або немає API key для
summary model), аудіо
пропускається, і надсилається звичайна текстова відповідь.

## Діаграма потоку

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Використання slash-команди

Є одна команда: `/tts`.
Подробиці ввімкнення див. в [Slash-команди](/uk/tools/slash-commands).

Примітка для Discord: `/tts` — це вбудована команда Discord, тож OpenClaw
реєструє там нативну команду `/voice`. Текстова команда `/tts ...` усе одно працює.

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

- Команди вимагають авторизованого відправника (правила allowlist/owner усе ще застосовуються).
- Має бути ввімкнено `commands.text` або реєстрацію нативних команд.
- Config `messages.tts.auto` приймає `off|always|inbound|tagged`.
- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- Використовуйте config, коли хочете типові значення `inbound` або `tagged`.
- `limit` і `summary` зберігаються в локальних prefs, а не в основній config.
- `/tts audio` генерує одноразову аудіовідповідь (не перемикає TTS у ввімкнений стан).
- `/tts status` включає видимість fallback для останньої спроби:
  - fallback у разі успіху: `Fallback: <primary> -> <used>` плюс `Attempts: ...`
  - у разі збою: `Error: ...` плюс `Attempts: ...`
  - докладна діагностика: `Attempt details: provider:outcome(reasonCode) latency`
- Помилки API OpenAI та ElevenLabs тепер включають розібрані деталі помилки provider-а та request id (коли provider його повертає), і це відображається в помилках/логах TTS.

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення й повертає audio attachment для
доставки відповіді. Коли канал — це Feishu, Matrix, Telegram або WhatsApp,
аудіо доставляється як голосове повідомлення, а не як вкладення файла.

## Gateway RPC

Методи Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
