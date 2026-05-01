---
read_when:
    - Увімкнення перетворення тексту на мовлення для відповідей
    - Налаштування провайдера TTS, ланцюжка резервного перемикання або персони
    - Використання команд або директив /tts
sidebarTitle: Text to speech (TTS)
summary: Перетворення тексту на мовлення для вихідних відповідей — провайдери, персони, slash-команди та виведення для кожного каналу
title: Перетворення тексту на мовлення
x-i18n:
    generated_at: "2026-05-01T22:03:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ff736249314fcfbc4f61c24a9c005c02e3582e2aa5fe0baac7e99c5e00f15e1
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw може перетворювати вихідні відповіді на аудіо через **14 провайдерів мовлення**
і надсилати нативні голосові повідомлення у Feishu, Matrix, Telegram і WhatsApp,
аудіовкладення в усіх інших каналах, а також потоки PCM/Ulaw для телефонії та Talk.

## Швидкий старт

<Steps>
  <Step title="Виберіть провайдера">
    OpenAI і ElevenLabs — найнадійніші хостингові варіанти. Microsoft і
    Local CLI працюють без ключа API. Повний список див. у [матриці провайдерів](#supported-providers).
  </Step>
  <Step title="Налаштуйте ключ API">
    Експортуйте змінну середовища для вашого провайдера (наприклад `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft і Local CLI не потребують ключа.
  </Step>
  <Step title="Увімкніть у конфігурації">
    Задайте `messages.tts.auto: "always"` і `messages.tts.provider`:

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

  </Step>
  <Step title="Спробуйте в чаті">
    `/tts status` показує поточний стан. `/tts audio Hello from OpenClaw`
    надсилає одноразову аудіовідповідь.
  </Step>
</Steps>

<Note>
Auto-TTS за замовчуванням **вимкнено**. Коли `messages.tts.provider` не задано,
OpenClaw вибирає першого налаштованого провайдера в порядку автоматичного вибору реєстру.
</Note>

## Підтримувані провайдери

| Провайдер         | Авторизація                                                                                                      | Примітки                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (також `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | Нативний вивід голосових нотаток Ogg/Opus і телефонія.                 |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS, сумісний з OpenAI. За замовчуванням `hexgrad/Kokoro-82M`.          |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` або `XI_API_KEY`                                                                             | Клонування голосу, багатомовність, детермінованість через `seed`.       |
| **Google Gemini** | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                                                                             | TTS Gemini API; враховує персону через `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Вивід голосових нотаток і телефонії.                                    |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API потокового TTS. Нативна голосова нотатка Opus і телефонія PCM.      |
| **Local CLI**     | немає                                                                                                            | Запускає налаштовану локальну команду TTS.                              |
| **Microsoft**     | немає                                                                                                            | Публічний нейронний TTS Edge через `node-edge-tts`. Найкраще можливе, без SLA. |
| **MiniMax**       | `MINIMAX_API_KEY` (або Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | API T2A v2. За замовчуванням `speech-2.8-hd`.                           |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Також використовується для автопідсумку; підтримує `instructions` персони. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (може повторно використовувати `models.providers.openrouter.apiKey`)                        | Модель за замовчуванням `hexgrad/kokoro-82m`.                           |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY` (застарілі AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | HTTP API BytePlus Seed Speech.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Спільний провайдер зображень, відео й мовлення.                         |
| **xAI**           | `XAI_API_KEY`                                                                                                    | Пакетний TTS xAI. Нативна голосова нотатка Opus **не** підтримується.   |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS через чат-завершення Xiaomi.                                   |

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний, а
інші є резервними варіантами. Автопідсумок використовує `summaryModel` (або
`agents.defaults.model.primary`), тому цей провайдер також має бути автентифікований,
якщо ви залишаєте підсумки ввімкненими.

<Warning>
Вбудований провайдер **Microsoft** використовує онлайн-сервіс нейронного TTS Microsoft Edge
через `node-edge-tts`. Це публічний вебсервіс без опублікованого
SLA чи квоти — вважайте його сервісом без гарантованого результату. Застарілий ідентифікатор провайдера `edge`
нормалізується до `microsoft`, а `openclaw doctor --fix` переписує збережену
конфігурацію; нові конфігурації завжди мають використовувати `microsoft`.
</Warning>

## Конфігурація

Конфігурація TTS зберігається в `messages.tts` у `~/.openclaw/openclaw.json`. Виберіть
пресет і адаптуйте блок провайдера:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (no key)">
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
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
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
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### Перевизначення голосу для окремого агента

Використовуйте `agents.list[].tts`, коли один агент має говорити з іншим провайдером,
голосом, моделлю, персоною або режимом автоматичного TTS. Блок агента глибоко зливається поверх
`messages.tts`, тож облікові дані провайдера можуть залишатися в глобальній конфігурації провайдера:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Щоб закріпити персону для окремого агента, задайте `agents.list[].tts.persona` поруч із конфігурацією
провайдера — це перевизначає глобальну `messages.tts.persona` лише для цього агента.

Порядок пріоритету для автоматичних відповідей, `/tts audio`, `/tts status` та
інструмента агента `tts`:

1. `messages.tts`
2. активний `agents.list[].tts`
3. перевизначення каналу, коли канал підтримує `channels.<channel>.tts`
4. перевизначення облікового запису, коли канал передає `channels.<channel>.accounts.<id>.tts`
5. локальні налаштування `/tts` для цього хоста
6. вбудовані директиви `[[tts:...]]`, коли ввімкнено [перевизначення, керовані моделлю](#model-driven-directives)

Перевизначення каналів і облікових записів використовують ту саму форму, що й `messages.tts`, і
глибоко зливаються поверх попередніх шарів, тому спільні облікові дані провайдера можуть залишатися в
`messages.tts`, тоді як канал або обліковий запис бота змінює лише голос, модель, персону
або автоматичний режим:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Персони

**Персона** — це стабільна мовлена ідентичність, яку можна детерміновано застосовувати
між провайдерами. Вона може віддавати перевагу одному провайдеру, визначати
провайдерно-нейтральний намір підказки та містити прив’язки, специфічні для провайдера:
голоси, моделі, шаблони підказок, зерна та налаштування голосу.

### Мінімальна персона

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### Повна персона (провайдерно-нейтральна підказка)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Визначення персони

Активна персона вибирається детерміновано:

1. Локальне налаштування `/tts persona <id>`, якщо задано.
2. `messages.tts.persona`, якщо задано.
3. Без персони.

Вибір провайдера виконується за принципом явного пріоритету:

1. Прямі перевизначення (CLI, Gateway, Talk, дозволені директиви TTS).
2. Локальне налаштування `/tts provider <id>`.
3. `provider` активної персони.
4. `messages.tts.provider`.
5. Автовибір реєстру.

Для кожної спроби провайдера OpenClaw зливає конфігурації в такому порядку:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Довірені перевизначення запиту
4. Дозволені перевизначення директив TTS, згенеровані моделлю

### Як провайдери використовують підказки персони

Поля підказки персони (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) є **провайдерно-нейтральними**. Кожен провайдер вирішує,
як їх використовувати:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Обгортає поля підказки персони в структуру підказки Gemini TTS **лише тоді, коли**
    ефективна конфігурація провайдера Google задає `promptTemplate: "audio-profile-v1"`
    або `personaPrompt`. Старіші поля `audioProfile` і `speakerName` все ще
    додаються на початок як специфічний для Google текст підказки. Вбудовані аудіотеги, як-от
    `[whispers]` або `[laughs]` усередині блоку `[[tts:text]]`, зберігаються
    в транскрипті Gemini; OpenClaw не генерує ці теги.
  </Accordion>
  <Accordion title="OpenAI">
    Зіставляє поля підказки персони з полем запиту `instructions` **лише тоді, коли**
    явні OpenAI `instructions` не налаштовано. Явні `instructions`
    завжди мають пріоритет.
  </Accordion>
  <Accordion title="Інші провайдери">
    Використовують лише специфічні для провайдера прив’язки персони в
    `personas.<id>.providers.<provider>`. Поля підказки персони ігноруються,
    якщо провайдер не реалізує власне зіставлення підказок персони.
  </Accordion>
</AccordionGroup>

### Політика резервного переходу

`fallbackPolicy` керує поведінкою, коли персона **не має прив’язки** для
провайдера, який пробують використати:

| Політика            | Поведінка                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Типово.** Провайдерно-нейтральні поля підказки залишаються доступними; провайдер може використовувати їх або ігнорувати.                     |
| `provider-defaults` | Персона вилучається з підготовки підказки для цієї спроби; провайдер використовує свої нейтральні типові значення, поки резервний перехід до інших провайдерів триває. |
| `fail`              | Пропустити цю спробу провайдера з `reasonCode: "not_configured"` і `personaBinding: "missing"`. Резервні провайдери все ще пробуються.          |

Увесь запит TTS завершується невдачею лише тоді, коли **кожну** спробу провайдера пропущено
або вона завершилась помилкою.

## Директиви, керовані моделлю

За замовчуванням помічник **може** виводити директиви `[[tts:...]]`, щоб перевизначити
голос, модель або швидкість для однієї відповіді, а також необов’язковий блок
`[[tts:text]]...[[/tts:text]]` для виразних підказок, які мають з’являтися
лише в аудіо:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Коли `messages.tts.auto` має значення `"tagged"`, **директиви обов’язкові** для запуску
аудіо. Потокова доставка блоків прибирає директиви з видимого тексту до того, як
канал їх побачить, навіть якщо вони розділені між сусідніми блоками.

`provider=...` ігнорується, якщо `modelOverrides.allowProvider: true` не задано. Коли
відповідь оголошує `provider=...`, інші ключі в цій директиві аналізуються
лише цим провайдером; непідтримувані ключі вилучаються й повідомляються як
попередження директив TTS.

**Доступні ключі директив:**

- `provider` (зареєстрований ідентифікатор провайдера; потребує `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0–10)
- `pitch` (цілочисельна висота тону MiniMax, −12 до 12; дробові значення обрізаються)
- `emotion` (тег емоції Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Повністю вимкнути перевизначення моделі:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Дозволити перемикання провайдера, зберігаючи інші регулятори налаштовуваними:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash-команди

Одна команда `/tts`. У Discord OpenClaw також реєструє `/voice`, оскільки
`/tts` є вбудованою командою Discord — текстова `/tts ...` все одно працює.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
Команди потребують авторизованого відправника (застосовуються правила allowlist/власника), а також
має бути ввімкнено `commands.text` або нативну реєстрацію команд.
</Note>

Нотатки щодо поведінки:

- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- `/tts chat on|off|default` записує перевизначення auto-TTS в межах сесії для поточного чату.
- `/tts persona <id>` записує локальне налаштування персони; `/tts persona off` очищує його.
- `/tts latest` читає останню відповідь помічника з поточного транскрипту сесії та надсилає її як аудіо один раз. Він зберігає лише хеш цієї відповіді в записі сесії, щоб пригнічувати дублікати голосових надсилань.
- `/tts audio` генерує одноразову аудіовідповідь (**не** вмикає TTS).
- `limit` і `summary` зберігаються в **локальних налаштуваннях**, а не в основній конфігурації.
- `/tts status` включає діагностику резервного переходу для останньої спроби — `Fallback: <primary> -> <used>`, `Attempts: ...` і деталі кожної спроби (`provider:outcome(reasonCode) latency`).
- `/status` показує активний режим TTS, а також налаштовані провайдера, модель, голос і санітизовані метадані користувацького кінцевого пункту, коли TTS увімкнено.

## Налаштування для кожного користувача

Slash-команди записують локальні перевизначення в `prefsPath`. Типове значення:
`~/.openclaw/settings/tts.json`; перевизначте його через змінну середовища `OPENCLAW_TTS_PREFS`
або `messages.tts.prefsPath`.

| Збережене поле | Ефект                                            |
| -------------- | ------------------------------------------------ |
| `auto`         | Локальне перевизначення auto-TTS (`always`, `off`, …) |
| `provider`     | Локальне перевизначення основного провайдера     |
| `persona`      | Локальне перевизначення персони                  |
| `maxLength`    | Поріг підсумовування (типово `1500` символів)    |
| `summarize`    | Перемикач підсумовування (типово `true`)         |

Вони перевизначають ефективну конфігурацію з `messages.tts` плюс активний
блок `agents.list[].tts` для цього хоста.

## Формати виводу (фіксовані)

Голосова доставка TTS керується можливостями каналу. Channel plugins оголошують,
чи має голосовий TTS просити провайдерів про нативну ціль `voice-note`, чи
зберігати звичайний синтез `audio-file` і лише позначати сумісний вивід для голосової
доставки.

- **Канали з підтримкою голосових нотаток**: відповіді голосовими нотатками надають перевагу Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48 кГц / 64 кбіт/с — добрий компроміс для голосових повідомлень.
- **Feishu / WhatsApp**: коли відповідь голосовою нотаткою створюється як MP3/WebM/WAV/M4A
  або інший імовірний аудіофайл, Plugin каналу транскодує її у 48 кГц
  Ogg/Opus за допомогою `ffmpeg` перед надсиланням нативного голосового повідомлення. WhatsApp надсилає
  результат через payload Baileys `audio` з `ptt: true` і
  `audio/ogg; codecs=opus`. Якщо конвертація не вдається, Feishu отримує оригінальний
  файл як вкладення; надсилання WhatsApp завершується помилкою, а не публікує несумісний
  payload PTT.
- **BlueBubbles**: зберігає синтез провайдера у звичайному шляху аудіофайлу; вихідні файли MP3
  і CAF позначаються для доставлення голосової нотатки iMessage.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44,1 кГц / 128 кбіт/с — стандартний баланс для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, частота дискретизації 32 кГц) для звичайних аудіовкладень. Для оголошених каналом цілей голосових нотаток OpenClaw транскодує MiniMax MP3 у 48 кГц Opus за допомогою `ffmpeg` перед доставленням, коли канал оголошує транскодування.
- **Xiaomi MiMo**: MP3 за замовчуванням або WAV, якщо налаштовано. Для оголошених каналом цілей голосових нотаток OpenClaw транскодує вихід Xiaomi у 48 кГц Opus за допомогою `ffmpeg` перед доставленням, коли канал оголошує транскодування.
- **Локальний CLI**: використовує налаштований `outputFormat`. Цілі голосових нотаток
  конвертуються в Ogg/Opus, а телефонний вихід конвертується в сирий 16 кГц моно PCM
  за допомогою `ffmpeg`.
- **Google Gemini**: Gemini API TTS повертає сирий 24 кГц PCM. OpenClaw обгортає його як WAV для аудіовкладень, транскодує його у 48 кГц Opus для цілей голосових нотаток і повертає PCM напряму для Talk/телефонії.
- **Gradium**: WAV для аудіовкладень, Opus для цілей голосових нотаток і `ulaw_8000` на 8 кГц для телефонії.
- **Inworld**: MP3 для звичайних аудіовкладень, нативний `OGG_OPUS` для цілей голосових нотаток і сирий `PCM` на 22050 Гц для Talk/телефонії.
- **xAI**: MP3 за замовчуванням; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує batch REST TTS endpoint xAI і повертає повне аудіовкладення; streaming TTS WebSocket xAI не використовується цим шляхом провайдера. Нативний формат голосових нотаток Opus не підтримується цим шляхом.
- **Microsoft**: використовує `microsoft.outputFormat` (за замовчуванням `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований транспорт приймає `outputFormat`, але не всі формати доступні із сервісу.
  - Значення формату виходу відповідають форматам виходу Microsoft Speech (зокрема Ogg/WebM Opus).
  - Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення Opus.
  - Якщо налаштований формат виходу Microsoft завершується помилкою, OpenClaw повторює спробу з MP3.

Формати виходу OpenAI/ElevenLabs фіксовані для кожного каналу (див. вище).

## Поведінка Auto-TTS

Коли `messages.tts.auto` увімкнено, OpenClaw:

- Пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- Пропускає дуже короткі відповіді (менше 10 символів).
- Узагальнює довгі відповіді, коли узагальнення увімкнені, використовуючи
  `summaryModel` (або `agents.defaults.model.primary`).
- Додає згенероване аудіо до відповіді.
- У `mode: "final"` усе одно надсилає audio-only TTS для streamed final replies
  після завершення текстового stream; згенероване медіа проходить через ту саму
  нормалізацію медіа каналу, що й звичайні вкладення відповіді.

Якщо відповідь перевищує `maxLength`, а узагальнення вимкнене (або немає API key для
моделі узагальнення), аудіо пропускається, і надсилається звичайна текстова відповідь.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Формати виходу за каналом

  | Ціль                                  | Формат                                                                                                                                |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | Відповіді голосовими нотатками надають перевагу **Opus** (`opus_48000_64` від ElevenLabs, `opus` від OpenAI). 48 кГц / 64 кбіт/с балансує чіткість і розмір. |
  | Інші канали                           | **MP3** (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI). 44,1 кГц / 128 кбіт/с типово для мовлення.                                 |
  | Talk / телефонія                      | Нативний для постачальника **PCM** (Inworld 22050 Гц, Google 24 кГц) або `ulaw_8000` від Gradium для телефонії.                                 |

  Примітки за постачальниками:

  - **Транскодування Feishu / WhatsApp:** Коли відповідь голосовою нотаткою надходить як MP3/WebM/WAV/M4A, Plugin каналу транскодує її в 48 кГц Ogg/Opus за допомогою `ffmpeg`. WhatsApp надсилає через Baileys із `ptt: true` та `audio/ogg; codecs=opus`. Якщо перетворення не вдається: Feishu повертається до вкладення оригінального файлу; надсилання WhatsApp завершується помилкою замість публікації несумісного PTT-навантаження.
  - **MiniMax / Xiaomi MiMo:** Типово MP3 (32 кГц для MiniMax `speech-2.8-hd`); транскодується в 48 кГц Opus для цілей голосових нотаток через `ffmpeg`.
  - **Локальний CLI:** Використовує налаштований `outputFormat`. Цілі голосових нотаток перетворюються на Ogg/Opus, а телефонний вихід — на сирий моно PCM 16 кГц.
  - **Google Gemini:** Повертає сирий PCM 24 кГц. OpenClaw обгортає його як WAV для вкладень, транскодує в 48 кГц Opus для цілей голосових нотаток, повертає PCM напряму для Talk/телефонії.
  - **Inworld:** MP3-вкладення, нативний `OGG_OPUS` для голосових нотаток, сирий `PCM` 22050 Гц для Talk/телефонії.
  - **xAI:** Типово MP3; `responseFormat` може бути `mp3|wav|pcm|mulaw|alaw`. Використовує пакетну REST-кінцеву точку xAI — потоковий WebSocket TTS **не** використовується. Нативний формат Opus для голосових нотаток **не** підтримується.
  - **Microsoft:** Використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні гарантовані голосові повідомлення Opus. Якщо налаштований формат Microsoft завершується помилкою, OpenClaw повторює спробу з MP3.

  Формати виводу OpenAI та ElevenLabs фіксовані для кожного каналу, як зазначено вище.

  ## Довідник полів

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Режим автоматичного TTS. `inbound` надсилає аудіо лише після вхідного голосового повідомлення; `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:...]]` або блок `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Застарілий перемикач. `openclaw doctor --fix` переносить це в `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` включає відповіді інструментів/блоків на додачу до фінальних відповідей.
    </ParamField>
    <ParamField path="provider" type="string">
      Ідентифікатор постачальника мовлення. Якщо не задано, OpenClaw використовує першого налаштованого постачальника в порядку автоматичного вибору реєстру. Застаріле `provider: "edge"` переписується на `"microsoft"` командою `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Ідентифікатор активної персони з `personas`. Нормалізується до нижнього регістру.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Стабільна розмовна ідентичність. Поля: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Див. [Персони](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Дешева модель для автоматичного підсумку; типово `agents.defaults.model.primary`. Приймає `provider/model` або налаштований псевдонім моделі.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Дозволяє моделі видавати директиви TTS. `enabled` типово `true`; `allowProvider` типово `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Налаштування, що належать постачальнику, з ключами за ідентифікатором постачальника мовлення. Застарілі прямі блоки (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) переписуються командою `openclaw doctor --fix`; комітьте лише `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Жорстке обмеження кількості символів для входу TTS. `/tts audio` завершується помилкою, якщо його перевищено.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Тайм-аут запиту в мілісекундах.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Перевизначає локальний шлях JSON налаштувань (постачальник/ліміт/підсумок). Типово `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Резервно використовує `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Регіон Azure Speech (наприклад, `eastus`). Змінні середовища: `AZURE_SPEECH_REGION` або `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Необов’язкове перевизначення кінцевої точки Azure Speech (псевдонім `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName голосу Azure. Типово `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Код мови SSML. Типово `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` для стандартного аудіо. Типово `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` для виводу голосових нотаток. Типово `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Резервно використовує `ELEVENLABS_API_KEY` або `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі (наприклад, `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">Ідентифікатор голосу ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (кожен `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = нормально).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Режим нормалізації тексту.</ParamField>
    <ParamField path="languageCode" type="string">2-літерний ISO 639-1 (наприклад, `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Ціле число `0..4294967295` для детермінізму за принципом найкращого зусилля.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначає базову URL-адресу API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Резервно використовує `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Якщо пропущено, TTS може повторно використовувати `models.providers.google.apiKey` перед резервним використанням змінних середовища.</ParamField>
    <ParamField path="model" type="string">Модель Gemini TTS. Типово `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Назва готового голосу Gemini. Типово `Kore`. Псевдонім: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Підказка стилю природною мовою, що додається перед вимовленим текстом.</ParamField>
    <ParamField path="speakerName" type="string">Необов’язкова мітка мовця, що додається перед вимовленим текстом, коли ваша підказка використовує названого мовця.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Установіть `audio-profile-v1`, щоб обгорнути активні поля підказки персони в детерміновану структуру підказки Gemini TTS.</ParamField>
    <ParamField path="personaPrompt" type="string">Додатковий текст підказки персони, специфічний для Google, що додається до Director's Notes шаблону.</ParamField>
    <ParamField path="baseUrl" type="string">Приймається лише `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Змінна середовища: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Змінна середовища: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">За замовчуванням `inworld-tts-1.5-max`. Також: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Температура семплювання `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Локальний виконуваний файл або рядок команди для CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Аргументи команди. Підтримує заповнювачі `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Очікуваний формат виводу CLI. За замовчуванням `mp3` для аудіовкладень.</ParamField>
    <ParamField path="timeoutMs" type="number">Тайм-аут команди в мілісекундах. За замовчуванням `120000`.</ParamField>
    <ParamField path="cwd" type="string">Необов’язковий робочий каталог команди.</ParamField>
    <ParamField path="env" type="Record<string, string>">Необов’язкові перевизначення середовища для команди.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">Дозволити використання мовлення Microsoft.</ParamField>
    <ParamField path="voice" type="string">Назва нейронного голосу Microsoft (наприклад, `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Код мови (наприклад, `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Формат виводу Microsoft. За замовчуванням `audio-24khz-48kbitrate-mono-mp3`. Не всі формати підтримуються вбудованим транспортом на основі Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Відсоткові рядки (наприклад, `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Записувати субтитри JSON поряд з аудіофайлом.</ParamField>
    <ParamField path="proxy" type="string">URL проксі для запитів мовлення Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Перевизначення тайм-ауту запиту (мс).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Застарілий псевдонім. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію на `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Як резерв використовує `MINIMAX_API_KEY`. Автентифікація Token Plan через `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` або `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.minimax.io`. Змінна середовища: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">За замовчуванням `speech-2.8-hd`. Змінна середовища: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням `English_expressive_narrator`. Змінна середовища: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. За замовчуванням `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. За замовчуванням `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Ціле число `-12..12`. За замовчуванням `0`. Дробові значення обрізаються перед запитом.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Як резерв використовує `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі OpenAI TTS (наприклад, `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Назва голосу (наприклад, `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Явне поле OpenAI `instructions`. Коли воно задане, поля промпту персони **не** зіставляються автоматично.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Додаткові поля JSON, що об’єднуються з тілами запитів `/audio/speech` після згенерованих полів OpenAI TTS. Використовуйте це для сумісних з OpenAI кінцевих точок, як-от Kokoro, яким потрібні специфічні для провайдера ключі на кшталт `lang`; небезпечні ключі прототипу ігноруються.</ParamField>
    <ParamField path="baseUrl" type="string">
      Перевизначає кінцеву точку OpenAI TTS. Порядок розв’язання: конфігурація → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Значення, відмінні від стандартного, розглядаються як сумісні з OpenAI кінцеві точки TTS, тому приймаються власні назви моделей і голосів.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Змінна середовища: `OPENROUTER_API_KEY`. Може повторно використовувати `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://openrouter.ai/api/v1`. Застарілий `https://openrouter.ai/v1` нормалізується.</ParamField>
    <ParamField path="model" type="string">За замовчуванням `hexgrad/kokoro-82m`. Псевдонім: `modelId`.</ParamField>
    <ParamField path="voice" type="string">За замовчуванням `af_alloy`. Псевдонім: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>За замовчуванням `mp3`.</ParamField>
    <ParamField path="speed" type="number">Перевизначення швидкості у форматі провайдера.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Змінна середовища: `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">За замовчуванням `seed-tts-1.0`. Змінна середовища: `VOLCENGINE_TTS_RESOURCE_ID`. Використовуйте `seed-tts-2.0`, коли ваш проєкт має право на TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Заголовок ключа застосунку. За замовчуванням `aGjiRDfUWi`. Змінна середовища: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначає HTTP-кінцеву точку Seed Speech TTS. Змінна середовища: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Тип голосу. За замовчуванням `en_female_anna_mars_bigtts`. Змінна середовища: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Коефіцієнт швидкості у форматі провайдера.</ParamField>
    <ParamField path="emotion" type="string">Тег емоції у форматі провайдера.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Застарілі поля Volcengine Speech Console. Змінні середовища: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (за замовчуванням `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Змінна середовища: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.x.ai/v1`. Змінна середовища: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням `eve`. Доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Код мови BCP-47 або `auto`. За замовчуванням `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>За замовчуванням `mp3`.</ParamField>
    <ParamField path="speed" type="number">Перевизначення швидкості у форматі провайдера.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Змінна середовища: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.xiaomimimo.com/v1`. Змінна середовища: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">За замовчуванням `mimo-v2.5-tts`. Змінна середовища: `XIAOMI_TTS_MODEL`. Також підтримує `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">За замовчуванням `mimo_default`. Змінна середовища: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>За замовчуванням `mp3`. Змінна середовища: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Необов’язкова інструкція стилю природною мовою, що надсилається як повідомлення користувача; не озвучується.</ParamField>
  </Accordion>
</AccordionGroup>

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення й повертає аудіовкладення для
доставки відповіді. У Feishu, Matrix, Telegram і WhatsApp аудіо
доставляється як голосове повідомлення, а не як файлове вкладення. Feishu і
WhatsApp можуть перекодовувати вивід TTS не у форматі Opus на цьому шляху, коли `ffmpeg`
доступний.

WhatsApp надсилає аудіо через Baileys як голосову нотатку PTT (`audio` з
`ptt: true`) і надсилає видимий текст **окремо** від аудіо PTT, оскільки
клієнти не завжди стабільно відображають підписи до голосових нотаток.

Інструмент приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` — це
тайм-аут запиту провайдера для кожного виклику в мілісекундах.

## Gateway RPC

| Метод             | Призначення                              |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Читати поточний стан TTS і останню спробу. |
| `tts.enable`      | Установити локальну автоматичну перевагу на `always`. |
| `tts.disable`     | Установити локальну автоматичну перевагу на `off`. |
| `tts.convert`     | Одноразове перетворення текст → аудіо.   |
| `tts.setProvider` | Установити локальну перевагу провайдера. |
| `tts.setPersona`  | Установити локальну перевагу персони.    |
| `tts.providers`   | Перелічити налаштованих провайдерів і статус. |

## Посилання на сервіси

- [Посібник OpenAI з перетворення тексту на мовлення](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідник OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST для перетворення тексту на мовлення](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Провайдер Azure Speech](/uk/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/uk/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/uk/providers/volcengine#text-to-speech)
- [Синтез мовлення Xiaomi MiMo](/uk/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Формати виводу Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI перетворення тексту на мовлення](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Пов’язане

- [Огляд медіа](/uk/tools/media-overview)
- [Генерація музики](/uk/tools/music-generation)
- [Генерація відео](/uk/tools/video-generation)
- [Slash-команди](/uk/tools/slash-commands)
- [Plugin голосових викликів](/uk/plugins/voice-call)
