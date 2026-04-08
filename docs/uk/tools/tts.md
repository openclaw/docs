---
read_when:
    - Увімкнення синтезу мовлення для відповідей
    - Налаштування провайдерів TTS або обмежень
    - Використання команд /tts
summary: Синтез мовлення (TTS) для вихідних відповідей
title: Синтез мовлення
x-i18n:
    generated_at: "2026-04-08T05:14:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e0fbcaf61282733c134f682e05a71f94d2169c03a85131ce9ad233c71a1e533
    source_path: tools/tts.md
    workflow: 15
---

# Синтез мовлення (TTS)

OpenClaw може перетворювати вихідні відповіді на аудіо за допомогою ElevenLabs, Microsoft, MiniMax або OpenAI.
Це працює всюди, де OpenClaw може надсилати аудіо.

## Підтримувані сервіси

- **ElevenLabs** (основний або резервний провайдер)
- **Microsoft** (основний або резервний провайдер; поточна вбудована реалізація використовує `node-edge-tts`)
- **MiniMax** (основний або резервний провайдер; використовує API T2A v2)
- **OpenAI** (основний або резервний провайдер; також використовується для підсумків)

### Примітки щодо Microsoft speech

Поточний вбудований провайдер Microsoft speech наразі використовує онлайн-
сервіс нейромережевого TTS Microsoft Edge через бібліотеку `node-edge-tts`. Це хостинговий сервіс (не
локальний), він використовує кінцеві точки Microsoft і не потребує API-ключа.
`node-edge-tts` надає параметри конфігурації мовлення та формати виводу, але
сервіс підтримує не всі параметри. Застаріла конфігурація та вхідні директиви
з `edge` усе ще працюють і нормалізуються до `microsoft`.

Оскільки цей шлях використовує публічний вебсервіс без опублікованих SLA або квот,
розглядайте його як best-effort. Якщо вам потрібні гарантовані ліміти та підтримка, використовуйте OpenAI
або ElevenLabs.

## Необов’язкові ключі

Якщо ви хочете використовувати OpenAI, ElevenLabs або MiniMax:

- `ELEVENLABS_API_KEY` (або `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft speech **не** потребує API-ключа.

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний провайдер, а інші слугують резервними варіантами.
Автоматичний підсумок використовує налаштований `summaryModel` (або `agents.defaults.model.primary`),
тому цей провайдер також має бути автентифікований, якщо ви вмикаєте підсумки.

## Посилання на сервіси

- [Посібник OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідка OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Формати виводу Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Чи ввімкнено це за замовчуванням?

Ні. Авто‑TTS **вимкнено** за замовчуванням. Увімкніть його в конфігурації через
`messages.tts.auto` або локально за допомогою `/tts on`.

Коли `messages.tts.provider` не задано, OpenClaw вибирає перший налаштований
мовний провайдер у порядку автоматичного вибору реєстру.

## Конфігурація

Конфігурація TTS розташована в `messages.tts` у `openclaw.json`.
Повна схема наведена в [Конфігурація Gateway](/uk/gateway/configuration).

### Мінімальна конфігурація (увімкнення + провайдер)

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

### OpenAI як основний, ElevenLabs як резервний

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

### Власні обмеження + шлях до prefs

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

### Вимкнути автоматичний підсумок для довгих відповідей

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

- `auto`: режим авто‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` надсилає аудіо лише після вхідного голосового повідомлення.
  - `tagged` надсилає аудіо лише тоді, коли відповідь містить теги `[[tts]]`.
- `enabled`: застарілий перемикач (doctor переносить його в `auto`).
- `mode`: `"final"` (типово) або `"all"` (включає відповіді інструментів/блоків).
- `provider`: ідентифікатор мовного провайдера, наприклад `"elevenlabs"`, `"microsoft"`, `"minimax"` або `"openai"` (резервне перемикання відбувається автоматично).
- Якщо `provider` **не задано**, OpenClaw використовує перший налаштований мовний провайдер у порядку автоматичного вибору реєстру.
- Застаріле `provider: "edge"` усе ще працює й нормалізується до `microsoft`.
- `summaryModel`: необов’язкова дешева модель для автоматичного підсумку; типово `agents.defaults.model.primary`.
  - Приймає `provider/model` або псевдонім налаштованої моделі.
- `modelOverrides`: дозволяє моделі видавати директиви TTS (увімкнено за замовчуванням).
  - `allowProvider` типово має значення `false` (перемикання провайдера вмикається окремо).
- `providers.<id>`: налаштування, що належать провайдеру, з ключем ідентифікатора мовного провайдера.
- Застарілі прямі блоки провайдерів (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) автоматично мігруються до `messages.tts.providers.<id>` під час завантаження.
- `maxTextLength`: жорстке обмеження для вхідного тексту TTS (символи). `/tts audio` завершується помилкою, якщо його перевищено.
- `timeoutMs`: тайм-аут запиту (мс).
- `prefsPath`: перевизначає локальний шлях до JSON-файлу налаштувань (провайдер/ліміт/підсумок).
- Значення `apiKey` беруться з env vars, якщо не задані (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: перевизначає базовий URL API ElevenLabs.
- `providers.openai.baseUrl`: перевизначає кінцеву точку OpenAI TTS.
  - Порядок визначення: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Значення, відмінні від типового, розглядаються як OpenAI-сумісні кінцеві точки TTS, тому приймаються власні назви моделей і голосів.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = звичайна швидкість)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-літерний ISO 639-1 (наприклад, `en`, `de`)
- `providers.elevenlabs.seed`: ціле число `0..4294967295` (детермінованість у режимі best-effort)
- `providers.minimax.baseUrl`: перевизначає базовий URL API MiniMax (типово `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: модель TTS (типово `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ідентифікатор голосу (типово `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: швидкість відтворення `0.5..2.0` (типово 1.0).
- `providers.minimax.vol`: гучність `(0, 10]` (типово 1.0; має бути більшою за 0).
- `providers.minimax.pitch`: зсув тону `-12..12` (типово 0).
- `providers.microsoft.enabled`: дозволяє використовувати Microsoft speech (типово `true`; без API-ключа).
- `providers.microsoft.voice`: назва нейромережевого голосу Microsoft (наприклад, `en-US-MichelleNeural`).
- `providers.microsoft.lang`: код мови (наприклад, `en-US`).
- `providers.microsoft.outputFormat`: формат виводу Microsoft (наприклад, `audio-24khz-48kbitrate-mono-mp3`).
  - Дійсні значення див. у Microsoft Speech output formats; не всі формати підтримуються вбудованим транспортом на основі Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: рядки з відсотками (наприклад, `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: записувати JSON-субтитри поруч з аудіофайлом.
- `providers.microsoft.proxy`: URL проксі для запитів Microsoft speech.
- `providers.microsoft.timeoutMs`: перевизначення тайм-ауту запиту (мс).
- `edge.*`: застарілий псевдонім для тих самих налаштувань Microsoft.

## Керовані моделлю перевизначення (увімкнено за замовчуванням)

За замовчуванням модель **може** видавати директиви TTS для однієї відповіді.
Коли `messages.tts.auto` має значення `tagged`, ці директиви потрібні для запуску аудіо.

Коли це ввімкнено, модель може видавати директиви `[[tts:...]]`, щоб перевизначити голос
для однієї відповіді, а також необов’язковий блок `[[tts:text]]...[[/tts:text]]`, щоб
надати виразні теги (сміх, підказки для співу тощо), які мають з’являтися лише
в аудіо.

Директиви `provider=...` ігноруються, якщо не встановлено `modelOverrides.allowProvider: true`.

Приклад payload відповіді:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Доступні ключі директив (коли ввімкнено):

- `provider` (ідентифікатор зареєстрованого мовного провайдера, наприклад `openai`, `elevenlabs`, `minimax` або `microsoft`; потребує `allowProvider: true`)
- `voice` (голос OpenAI) або `voiceId` (ElevenLabs / MiniMax)
- `model` (модель OpenAI TTS, model id ElevenLabs або модель MiniMax)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0-10)
- `pitch` (тон MiniMax, від -12 до 12)
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

Необов’язковий список дозволів (увімкнути перемикання провайдера, залишивши інші параметри налаштовуваними):

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

Slash commands записують локальні перевизначення в `prefsPath` (типово:
`~/.openclaw/settings/tts.json`, перевизначається через `OPENCLAW_TTS_PREFS` або
`messages.tts.prefsPath`).

Поля, що зберігаються:

- `enabled`
- `provider`
- `maxLength` (поріг для підсумку; типово 1500 символів)
- `summarize` (типово `true`)

Вони перевизначають `messages.tts.*` для цього хоста.

## Формати виводу (фіксовані)

- **Feishu / Matrix / Telegram / WhatsApp**: голосове повідомлення Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48 кГц / 64 кбіт/с — хороший компроміс для голосових повідомлень.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44.1 кГц / 128 кбіт/с — типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, частота дискретизації 32 кГц). Формат голосових нотаток нативно не підтримується; використовуйте OpenAI або ElevenLabs, якщо вам потрібні гарантовані голосові повідомлення Opus.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований транспорт приймає `outputFormat`, але сервіс надає не всі формати.
  - Значення форматів виводу відповідають Microsoft Speech output formats (включно з Ogg/WebM Opus).
  - Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення Opus.
  - Якщо налаштований формат виводу Microsoft завершується помилкою, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI/ElevenLabs є фіксованими для кожного каналу (див. вище).

## Поведінка авто-TTS

Коли функцію ввімкнено, OpenClaw:

- пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- пропускає дуже короткі відповіді (< 10 символів).
- підсумовує довгі відповіді, якщо це ввімкнено, за допомогою `agents.defaults.model.primary` (або `summaryModel`).
- додає згенероване аудіо до відповіді.

Якщо відповідь перевищує `maxLength`, а підсумок вимкнено (або немає API-ключа для
моделі підсумку), аудіо
пропускається і надсилається звичайна текстова відповідь.

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

## Використання Slash command

Є одна команда: `/tts`.
Докладніше про ввімкнення див. у [Slash commands](/uk/tools/slash-commands).

Примітка для Discord: `/tts` — це вбудована команда Discord, тому OpenClaw реєструє
`/voice` як нативну команду там. Текстова команда `/tts ...` усе ще працює.

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

- Команди потребують авторизованого відправника (правила allowlist/owner усе ще застосовуються).
- Має бути ввімкнено `commands.text` або реєстрацію нативних команд.
- Конфігурація `messages.tts.auto` приймає `off|always|inbound|tagged`.
- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- Використовуйте конфігурацію, якщо вам потрібні типові значення `inbound` або `tagged`.
- `limit` і `summary` зберігаються в локальних налаштуваннях, а не в основній конфігурації.
- `/tts audio` генерує одноразову аудіовідповідь (не вмикає TTS постійно).
- `/tts status` містить видимість резервного перемикання для останньої спроби:
  - успішне резервне перемикання: `Fallback: <primary> -> <used>` плюс `Attempts: ...`
  - помилка: `Error: ...` плюс `Attempts: ...`
  - докладна діагностика: `Attempt details: provider:outcome(reasonCode) latency`
- Помилки API OpenAI та ElevenLabs тепер містять розібрані деталі помилки провайдера та request id (коли провайдер їх повертає), які відображаються в помилках/логах TTS.

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення та повертає аудіовкладення для
доставки у відповіді. Коли каналом є Feishu, Matrix, Telegram або WhatsApp,
аудіо доставляється як голосове повідомлення, а не як вкладений файл.

## Gateway RPC

Методи Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
