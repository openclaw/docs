---
read_when:
    - Увімкнення перетворення тексту на мовлення для відповідей
    - Налаштування провайдера TTS, ланцюжка резервних варіантів або персони
    - Використання команд або директив `/tts`
summary: Перетворення тексту на мовлення для вихідних відповідей — провайдери, персони, slash-команди та вихід для кожного каналу
title: Перетворення тексту на мовлення
x-i18n:
    generated_at: "2026-04-26T05:03:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1034592bfea99395133f07e6e629088ecb4a22d737028681006d897a10df157
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо через **13 провайдерів мовлення**
і надсилати нативні голосові повідомлення у Feishu, Matrix, Telegram і WhatsApp,
аудіовкладення всюди в інших місцях, а також потоки PCM/Ulaw для телефонії та Talk.

## Швидкий старт

<Steps>
  <Step title="Виберіть провайдера">
    OpenAI та ElevenLabs — найнадійніші хостингові варіанти. Microsoft і
    Local CLI працюють без API-ключа. Повний список дивіться в [матриці провайдерів](#supported-providers).
  </Step>
  <Step title="Задайте API-ключ">
    Експортуйте змінну середовища для вашого провайдера (наприклад, `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft і Local CLI не потребують ключа.
  </Step>
  <Step title="Увімкніть у конфігурації">
    Встановіть `messages.tts.auto: "always"` і `messages.tts.provider`:

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
Auto-TTS **вимкнено** за замовчуванням. Якщо `messages.tts.provider` не встановлено,
OpenClaw вибирає першого налаштованого провайдера в порядку автоматичного вибору реєстру.
</Note>

## Підтримувані провайдери

| Провайдер         | Автентифікація                                                                                                   | Примітки                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Також використовується для автоузагальнення; підтримує `instructions` персони. |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` або `XI_API_KEY`                                                                            | Клонування голосу, багатомовність, детермінованість через `seed`.       |
| **Google Gemini** | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                                                                            | Gemini API TTS; підтримує персону через `promptTemplate: "audio-profile-v1"`. |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (також `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)         | Нативний вивід голосових нотаток Ogg/Opus і телефонія.                  |
| **Microsoft**     | none                                                                                                             | Публічний Edge neural TTS через `node-edge-tts`. Best-effort, без SLA.  |
| **MiniMax**       | `MINIMAX_API_KEY` (або Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)     | API T2A v2. За замовчуванням `speech-2.8-hd`.                           |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Streaming TTS API. Нативна голосова нотатка Opus і PCM-телефонія.       |
| **xAI**           | `XAI_API_KEY`                                                                                                    | Пакетний TTS xAI. Нативна голосова нотатка Opus **не** підтримується.   |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY` (застарілі AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | HTTP API BytePlus Seed Speech.                                          |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS через Xiaomi chat completions.                                 |
| **OpenRouter**    | `OPENROUTER_API_KEY` (може повторно використовувати `models.providers.openrouter.apiKey`)                       | Модель за замовчуванням `hexgrad/kokoro-82m`.                           |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Вивід голосових нотаток і телефонії.                                    |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Спільний провайдер зображень, відео й мовлення.                         |
| **Local CLI**     | none                                                                                                             | Запускає налаштовану локальну TTS-команду.                              |

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний,
а решта стають резервними варіантами. Автоузагальнення використовує `summaryModel` (або
`agents.defaults.model.primary`), тому цей провайдер також має бути автентифікований,
якщо ви залишаєте узагальнення увімкненими.

<Warning>
Вбудований провайдер **Microsoft** використовує онлайн-сервіс neural TTS Microsoft Edge
через `node-edge-tts`. Це публічний вебсервіс без опублікованих
SLA чи квот — розглядайте його як best-effort. Застарілий ідентифікатор провайдера `edge`
нормалізується до `microsoft`, а `openclaw doctor --fix` переписує збережену
конфігурацію; у нових конфігураціях завжди слід використовувати `microsoft`.
</Warning>

## Конфігурація

Конфігурація TTS розміщується в `messages.tts` у `~/.openclaw/openclaw.json`. Виберіть
пресет і адаптуйте блок провайдера:

<Tabs>
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
  <Tab title="Лише ElevenLabs">
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
          // Необов’язкові підказки природною мовою для стилю:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
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
  <Tab title="Microsoft (без ключа)">
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
</Tabs>

### Перевизначення голосу для окремого агента

Використовуйте `agents.list[].tts`, коли один агент має говорити з іншим провайдером,
голосом, моделлю, персоною або режимом auto-TTS. Блок агента глибоко об’єднується поверх
`messages.tts`, тому облікові дані провайдера можуть залишатися в глобальній конфігурації провайдера:

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

Щоб закріпити персону для окремого агента, встановіть `agents.list[].tts.persona` поруч із
конфігурацією провайдера — вона перевизначає глобальну `messages.tts.persona` лише для цього агента.

Порядок пріоритету для автоматичних відповідей, `/tts audio`, `/tts status` і
інструмента агента `tts`:

1. `messages.tts`
2. активний `agents.list[].tts`
3. локальні налаштування `/tts` для цього хоста
4. вбудовані директиви `[[tts:...]]`, коли [перевизначення моделлю](#model-driven-directives) увімкнені

## Персони

**Персона** — це стабільна мовна ідентичність, яку можна детерміновано застосовувати
між провайдерами. Вона може надавати перевагу одному провайдеру, визначати незалежний від провайдера намір підказки
та містити специфічні для провайдера прив’язки для голосів, моделей, шаблонів
підказок, `seed` і налаштувань голосу.

### Мінімальна персона

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Оповідач",
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

### Повна персона (нейтральний до провайдера prompt)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Стриманий, теплий британський голос дворецького-оповідача.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Блискучий британський дворецький. Стриманий, дотепний, теплий, чарівний, емоційно виразний, ніколи не безликий.",
            scene: "Тихий кабінет пізно вночі. Оповідь із близьким мікрофоном для довіреного оператора.",
            sampleContext: "Мовець відповідає на приватний технічний запит лаконічно, впевнено й зі стриманою теплотою.",
            style: "Вишуканий, стриманий, з легкою усмішкою.",
            accent: "Британська англійська.",
            pacing: "Розмірений, із короткими драматичними паузами.",
            constraints: ["Не озвучуйте значення конфігурації вголос.", "Не пояснюйте персону."],
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

1. локальне налаштування `/tts persona <id>`, якщо встановлено.
2. `messages.tts.persona`, якщо встановлено.
3. Без персони.

Вибір провайдера виконується за принципом explicit-first:

1. Прямі перевизначення (CLI, Gateway, Talk, дозволені TTS-директиви).
2. Локальне налаштування `/tts provider <id>`.
3. `provider` активної персони.
4. `messages.tts.provider`.
5. Автовибір реєстру.

Для кожної спроби з провайдером OpenClaw об’єднує конфігурації в такому порядку:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Довірені перевизначення запиту
4. Дозволені перевизначення TTS-директив, згенерованих моделлю

### Як провайдери використовують prompt персони

Поля prompt персони (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) є **нейтральними до провайдера**. Кожен провайдер сам вирішує,
як їх використовувати:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Обгортає поля prompt персони в структуру prompt для Gemini TTS **лише коли**
    ефективна конфігурація провайдера Google встановлює `promptTemplate: "audio-profile-v1"`
    або `personaPrompt`. Старіші поля `audioProfile` і `speakerName`
    як і раніше додаються на початок як текст prompt, специфічний для Google. Вбудовані аудіотеги, наприклад
    `[whispers]` або `[laughs]` усередині блока `[[tts:text]]`, зберігаються
    всередині транскрипту Gemini; OpenClaw не генерує ці теги.
  </Accordion>
  <Accordion title="OpenAI">
    Зіставляє поля prompt персони з полем запиту `instructions` **лише коли**
    не налаштовано явний `instructions` для OpenAI. Явний `instructions`
    завжди має пріоритет.
  </Accordion>
  <Accordion title="Інші провайдери">
    Використовують лише прив’язки персони, специфічні для провайдера, у
    `personas.<id>.providers.<provider>`. Поля prompt персони ігноруються,
    якщо провайдер не реалізує власне зіставлення prompt персони.
  </Accordion>
</AccordionGroup>

### Політика резервних варіантів

`fallbackPolicy` керує поведінкою, коли персона **не має прив’язки** для
провайдера, який намагаються використати:

| Політика            | Поведінка                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **За замовчуванням.** Нейтральні до провайдера поля prompt залишаються доступними; провайдер може використовувати їх або ігнорувати.        |
| `provider-defaults` | Персона пропускається під час підготовки prompt для цієї спроби; провайдер використовує свої нейтральні значення за замовчуванням, поки триває перехід до інших провайдерів. |
| `fail`              | Пропускає цю спробу з провайдером із `reasonCode: "not_configured"` і `personaBinding: "missing"`. Резервні провайдери все одно перевіряються. |

Увесь TTS-запит завершується помилкою лише тоді, коли **кожен** провайдер у спробах пропущено
або він завершився помилкою.

## Директиви, керовані моделлю

За замовчуванням асистент **може** виводити директиви `[[tts:...]]` для перевизначення
голосу, моделі або швидкості для однієї відповіді, а також необов’язковий
блок `[[tts:text]]...[[/tts:text]]` для виразних підказок, які мають з’являтися
лише в аудіо:

```text
Ось, будь ласка.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](сміється) Прочитай пісню ще раз.[[/tts:text]]
```

Коли `messages.tts.auto` дорівнює `"tagged"`, **директиви обов’язкові** для запуску
аудіо. Потокова доставка блоків прибирає директиви з видимого тексту до того,
як канал їх побачить, навіть якщо вони розділені між сусідніми блоками.

`provider=...` ігнорується, якщо не встановлено `modelOverrides.allowProvider: true`. Коли
відповідь оголошує `provider=...`, інші ключі в цій директиві аналізуються
лише цим провайдером; непідтримувані ключі видаляються й повідомляються як попередження
директив TTS.

**Доступні ключі директив:**

- `provider` (ідентифікатор зареєстрованого провайдера; потребує `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0–10)
- `pitch` (цілочисельний pitch MiniMax, від −12 до 12; дробові значення усікаються)
- `emotion` (тег емоції Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Повністю вимкнути перевизначення моделлю:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Дозволити перемикання провайдера, залишивши інші параметри налаштовуваними:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash-команди

Одна команда `/tts`. У Discord OpenClaw також реєструє `/voice`, оскільки
`/tts` — це вбудована команда Discord — текстовий `/tts ...` усе ще працює.

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
Команди потребують авторизованого відправника (застосовуються правила allowlist/owner) і
має бути увімкнено або `commands.text`, або нативну реєстрацію команд.
</Note>

Примітки щодо поведінки:

- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- `/tts chat on|off|default` записує перевизначення auto-TTS на рівні сесії для поточного чату.
- `/tts persona <id>` записує локальне налаштування персони; `/tts persona off` очищає його.
- `/tts latest` читає останню відповідь асистента з поточного транскрипту сесії й надсилає її як аудіо один раз. Воно зберігає лише хеш цієї відповіді в записі сесії, щоб запобігати дубльованому надсиланню голосу.
- `/tts audio` генерує одноразову аудіовідповідь (TTS **не** вмикається).
- `limit` і `summary` зберігаються в **локальних prefs**, а не в основній конфігурації.
- `/tts status` містить діагностику резервних варіантів для останньої спроби — `Fallback: <primary> -> <used>`, `Attempts: ...` і деталі по кожній спробі (`provider:outcome(reasonCode) latency`).
- `/status` показує активний режим TTS, а також налаштовані провайдер, модель, голос і санітизовані метадані користувацької кінцевої точки, коли TTS увімкнено.

## Налаштування для окремого користувача

Slash-команди записують локальні перевизначення в `prefsPath`. За замовчуванням це
`~/.openclaw/settings/tts.json`; можна перевизначити через змінну середовища `OPENCLAW_TTS_PREFS`
або `messages.tts.prefsPath`.

| Збережене поле | Ефект                                       |
| -------------- | ------------------------------------------- |
| `auto`         | Локальне перевизначення auto-TTS (`always`, `off`, …) |
| `provider`     | Локальне перевизначення основного провайдера |
| `persona`      | Локальне перевизначення персони             |
| `maxLength`    | Поріг узагальнення (типово `1500` символів) |
| `summarize`    | Перемикач узагальнення (типово `true`)      |

Вони перевизначають ефективну конфігурацію з `messages.tts` разом з активним
блоком `agents.list[].tts` для цього хоста.

## Поведінка auto-TTS

Коли `messages.tts.auto` увімкнено, OpenClaw:

- Пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- Пропускає дуже короткі відповіді (менше ніж 10 символів).
- Узагальнює довгі відповіді, коли узагальнення увімкнені, використовуючи
  `summaryModel` (або `agents.defaults.model.primary`).
- Додає згенероване аудіо до відповіді.
- У `mode: "final"` усе одно надсилає TTS лише як аудіо для фінальних потокових відповідей
  після завершення текстового потоку; згенерований медіафайл проходить ту саму
  нормалізацію медіа каналу, що й звичайні вкладення у відповіді.

Якщо відповідь перевищує `maxLength`, а узагальнення вимкнено (або немає API-ключа для
моделі узагальнення), аудіо пропускається й надсилається звичайна текстова відповідь.

```text
Відповідь -> TTS увімкнено?
  ні   -> надіслати текст
  так  -> є медіа / MEDIA: / коротка?
           так  -> надіслати текст
           ні   -> довжина > ліміт?
                    ні   -> TTS -> прикріпити аудіо
                    так  -> узагальнення увімкнено?
                             ні   -> надіслати текст
                             так  -> узагальнити -> TTS -> прикріпити аудіо
```

## Формати виводу за каналами

| Ціль                                  | Формат                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | У відповідях як голосові нотатки перевага надається **Opus** (`opus_48000_64` від ElevenLabs, `opus` від OpenAI). 48 кГц / 64 кбіт/с — баланс між чіткістю та розміром. |
| Інші канали                           | **MP3** (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI). 44,1 кГц / 128 кбіт/с за замовчуванням для мовлення.                    |
| Talk / телефонія                      | Нативний для провайдера **PCM** (Inworld 22050 Гц, Google 24 кГц) або `ulaw_8000` від Gradium для телефонії.                         |

Примітки для окремих провайдерів:

  - **Перекодування Feishu / WhatsApp:** Коли відповідь із голосовою нотаткою надходить як MP3/WebM/WAV/M4A, плагін каналу перекодовує її в 48 кГц Ogg/Opus за допомогою `ffmpeg`. WhatsApp надсилає через Baileys з `ptt: true` і `audio/ogg; codecs=opus`. Якщо конвертація не вдається: Feishu повертається до вкладення оригінального файла; надсилання в WhatsApp завершується помилкою, а не публікує несумісний payload PTT.
  - **MiniMax / Xiaomi MiMo:** MP3 за замовчуванням (32 кГц для MiniMax `speech-2.8-hd`); для цілей голосових нотаток перекодовуються в 48 кГц Opus через `ffmpeg`.
  - **Local CLI:** Використовує налаштований `outputFormat`. Для цілей голосових нотаток конвертується в Ogg/Opus, а для виводу телефонії — у raw 16 кГц mono PCM.
  - **Google Gemini:** Повертає raw 24 кГц PCM. OpenClaw обгортає його як WAV для вкладень, перекодовує в 48 кГц Opus для цілей голосових нотаток, повертає PCM напряму для Talk/телефонії.
  - **Inworld:** Вкладення MP3, нативна голосова нотатка `OGG_OPUS`, raw `PCM` 22050 Гц для Talk/телефонії.
  - **xAI:** MP3 за замовчуванням; `responseFormat` може бути `mp3|wav|pcm|mulaw|alaw`. Використовує пакетний REST endpoint xAI — потоковий WebSocket TTS **не** використовується. Нативний формат голосових нотаток Opus **не** підтримується.
  - **Microsoft:** Використовує `microsoft.outputFormat` (за замовчуванням `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` у Telegram приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні гарантовані голосові повідомлення Opus. Якщо налаштований формат Microsoft не працює, OpenClaw повторює спробу з MP3.

  Формати виводу OpenAI та ElevenLabs фіксовані для кожного каналу, як зазначено вище.

  ## Довідник полів

  <AccordionGroup>
  <Accordion title="Верхньорівневі messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Режим auto-TTS. `inbound` надсилає аудіо лише після вхідного голосового повідомлення; `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:...]]` або блок `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Застарілий перемикач. `openclaw doctor --fix` мігрує його до `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` включає відповіді інструментів/блоків на додачу до фінальних відповідей.
    </ParamField>
    <ParamField path="provider" type="string">
      Ідентифікатор провайдера мовлення. Якщо не встановлено, OpenClaw використовує першого налаштованого провайдера в порядку автовибору реєстру. Застаріле `provider: "edge"` переписується на `"microsoft"` через `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Ідентифікатор активної персони з `personas`. Нормалізується до нижнього регістру.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Стабільна мовна ідентичність. Поля: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Див. [Персони](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Дешева модель для автоузагальнення; за замовчуванням `agents.defaults.model.primary`. Приймає `provider/model` або псевдонім налаштованої моделі.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Дозволяє моделі виводити TTS-директиви. `enabled` за замовчуванням дорівнює `true`; `allowProvider` за замовчуванням дорівнює `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Налаштування провайдера, ключовані ідентифікатором провайдера мовлення. Застарілі прямі блоки (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) переписуються через `openclaw doctor --fix`; комітьте лише `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Жорстке обмеження на кількість символів вхідного тексту для TTS. `/tts audio` завершується помилкою, якщо ліміт перевищено.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Тайм-аут запиту в мілісекундах.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Перевизначає локальний JSON-шлях prefs (provider/limit/summary). За замовчуванням `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Використовує `OPENAI_API_KEY` як резервне значення.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі OpenAI TTS (наприклад, `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Назва голосу (наприклад, `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Явне поле OpenAI `instructions`. Якщо встановлено, поля prompt персони **не** зіставляються автоматично.</ParamField>
    <ParamField path="baseUrl" type="string">
      Перевизначає endpoint OpenAI TTS. Порядок визначення: конфігурація → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Значення, відмінні від стандартного, вважаються OpenAI-сумісними TTS endpoint, тому допускаються користувацькі назви моделі й голосу.
    </ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Використовує `ELEVENLABS_API_KEY` або `XI_API_KEY` як резервне значення.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі (наприклад, `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">Ідентифікатор голосу ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (кожне `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = звичайна).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Режим нормалізації тексту.</ParamField>
    <ParamField path="languageCode" type="string">2-літерний ISO 639-1 (наприклад, `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Ціле число `0..4294967295` для best-effort детермінованості.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначає базовий URL API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Використовує `GEMINI_API_KEY` / `GOOGLE_API_KEY` як резервне значення. Якщо пропущено, TTS може повторно використовувати `models.providers.google.apiKey` перед резервним переходом до env.</ParamField>
    <ParamField path="model" type="string">Модель Gemini TTS. За замовчуванням `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Назва вбудованого голосу Gemini. За замовчуванням `Kore`. Псевдонім: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Підказка стилю природною мовою, що додається перед озвучуваним текстом.</ParamField>
    <ParamField path="speakerName" type="string">Необов’язкова мітка мовця, що додається перед озвучуваним текстом, коли ваш prompt використовує іменованого мовця.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Встановіть `audio-profile-v1`, щоб обгорнути поля prompt активної персони в детерміновану структуру prompt Gemini TTS.</ParamField>
    <ParamField path="personaPrompt" type="string">Додатковий текст prompt персони, специфічний для Google, який додається до Director's Notes шаблону.</ParamField>
    <ParamField path="baseUrl" type="string">Приймається лише `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Регіон Azure Speech (наприклад, `eastus`). Env: `AZURE_SPEECH_REGION` або `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Необов’язкове перевизначення endpoint Azure Speech (псевдонім `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">Azure voice ShortName. За замовчуванням `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Код мови SSML. За замовчуванням `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` для стандартного аудіо. За замовчуванням `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` для виводу голосових нотаток. За замовчуванням `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (без API-ключа)">
    <ParamField path="enabled" type="boolean" default="true">Дозволяє використання мовлення Microsoft.</ParamField>
    <ParamField path="voice" type="string">Назва neural-голосу Microsoft (наприклад, `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Код мови (наприклад, `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Формат виводу Microsoft. За замовчуванням `audio-24khz-48kbitrate-mono-mp3`. Не всі формати підтримуються вбудованим транспортом на базі Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Рядки у відсотках (наприклад, `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Записує JSON-субтитри поруч з аудіофайлом.</ParamField>
    <ParamField path="proxy" type="string">URL проксі для запитів мовлення Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Перевизначення тайм-ауту запиту (мс).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Застарілий псевдонім. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію на `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Використовує `MINIMAX_API_KEY` як резервне значення. Автентифікація Token Plan через `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` або `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">За замовчуванням `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. За замовчуванням `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. За замовчуванням `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Ціле число `-12..12`. За замовчуванням `0`. Дробові значення усікаються перед запитом.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">За замовчуванням `inworld-tts-1.5-max`. Також: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Температура семплювання `0..2`.</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням `eve`. Live voices: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Код мови BCP-47 або `auto`. За замовчуванням `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>За замовчуванням `mp3`.</ParamField>
    <ParamField path="speed" type="number">Перевизначення швидкості, нативне для провайдера.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">За замовчуванням `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Використовуйте `seed-tts-2.0`, коли ваш проєкт має entitlement для TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Заголовок ключа застосунку. За замовчуванням `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначає HTTP endpoint TTS Seed Speech. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Тип голосу. За замовчуванням `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Нативне для провайдера співвідношення швидкості.</ParamField>
    <ParamField path="emotion" type="string">Нативний для провайдера тег емоції.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Застарілі поля Volcengine Speech Console. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (за замовчуванням `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">За замовчуванням `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Також підтримується `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">За замовчуванням `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>За замовчуванням `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Необов’язкова інструкція стилю природною мовою, що надсилається як повідомлення користувача; не озвучується.</ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Може повторно використовувати `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://openrouter.ai/api/v1`. Застаріле `https://openrouter.ai/v1` нормалізується.</ParamField>
    <ParamField path="model" type="string">За замовчуванням `hexgrad/kokoro-82m`. Псевдонім: `modelId`.</ParamField>
    <ParamField path="voice" type="string">За замовчуванням `af_alloy`. Псевдонім: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>За замовчуванням `mp3`.</ParamField>
    <ParamField path="speed" type="number">Перевизначення швидкості, нативне для провайдера.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Локальний виконуваний файл або рядок команди для CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Аргументи команди. Підтримує заповнювачі `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Очікуваний формат виводу CLI. За замовчуванням `mp3` для аудіовкладень.</ParamField>
    <ParamField path="timeoutMs" type="number">Тайм-аут команди в мілісекундах. За замовчуванням `120000`.</ParamField>
    <ParamField path="cwd" type="string">Необов’язковий робочий каталог команди.</ParamField>
    <ParamField path="env" type="Record<string, string>">Необов’язкові перевизначення середовища для команди.</ParamField>
  </Accordion>
</AccordionGroup>

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення й повертає аудіовкладення для
доставки відповіді. У Feishu, Matrix, Telegram і WhatsApp аудіо
доставляється як голосове повідомлення, а не як файлове вкладення. Feishu і
WhatsApp можуть перекодовувати не-Opus TTS-вивід на цьому шляху, якщо доступний `ffmpeg`.

WhatsApp надсилає аудіо через Baileys як голосову нотатку PTT (`audio` з
`ptt: true`) і надсилає видимий текст **окремо** від PTT-аудіо, тому що
клієнти не завжди коректно відображають підписи до голосових нотаток.

Інструмент приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` — це
тайм-аут запиту до провайдера для конкретного виклику в мілісекундах.

## Gateway RPC

| Метод             | Призначення                              |
| ----------------- | --------------------------------------- |
| `tts.status`      | Читання поточного стану TTS і останньої спроби. |
| `tts.enable`      | Встановлює локальне налаштування auto в `always`. |
| `tts.disable`     | Встановлює локальне налаштування auto в `off`. |
| `tts.convert`     | Одноразове перетворення тексту на аудіо. |
| `tts.setProvider` | Встановлює локальне налаштування провайдера. |
| `tts.setPersona`  | Встановлює локальне налаштування персони. |
| `tts.providers`   | Показує список налаштованих провайдерів і їхній стан. |

## Посилання на сервіси

- [Посібник OpenAI з перетворення тексту на мовлення](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідник OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
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
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Пов’язане

- [Огляд медіа](/uk/tools/media-overview)
- [Генерація музики](/uk/tools/music-generation)
- [Генерація відео](/uk/tools/video-generation)
- [Slash-команди](/uk/tools/slash-commands)
- [Плагін голосових викликів](/uk/plugins/voice-call)
