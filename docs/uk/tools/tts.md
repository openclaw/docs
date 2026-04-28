---
read_when:
    - Увімкнення text-to-speech для відповідей
    - Налаштування провайдера TTS, ланцюжка fallback або персони
    - Використання команд або директив `/tts`
sidebarTitle: Text to speech (TTS)
summary: Text-to-speech для вихідних відповідей — провайдери, персони, slash-команди та вивід для кожного каналу
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-28T00:36:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec58d19fbca0ff0cd9828f32c150123cad22f053a6b4281ed40ec3d1fa41d1b2
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо через **14 speech-провайдерів**
і доставляти нативні голосові повідомлення у Feishu, Matrix, Telegram і WhatsApp,
аудіовкладення всюди в інших місцях, а також потоки PCM/Ulaw для телефонії та Talk.

## Швидкий старт

<Steps>
  <Step title="Виберіть провайдера">
    OpenAI та ElevenLabs — найнадійніші хостингові варіанти. Microsoft і
    Local CLI працюють без API-ключа. Повний список дивіться в [матриці провайдерів](#supported-providers).
  </Step>
  <Step title="Установіть API-ключ">
    Експортуйте env-змінну для вашого провайдера (наприклад, `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Для Microsoft і Local CLI ключ не потрібен.
  </Step>
  <Step title="Увімкніть у конфігурації">
    Установіть `messages.tts.auto: "always"` і `messages.tts.provider`:

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
Auto-TTS **вимкнено** за замовчуванням. Коли `messages.tts.provider` не задано,
OpenClaw вибирає першого налаштованого провайдера в порядку auto-select реєстру.
</Note>

## Підтримувані провайдери

| Провайдер          | Auth                                                                                                             | Примітки                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**   | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (також `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)        | Нативний вивід голосових нотаток Ogg/Opus і телефонії.                  |
| **DeepInfra**      | `DEEPINFRA_API_KEY`                                                                                              | TTS, сумісний з OpenAI. За замовчуванням `hexgrad/Kokoro-82M`.          |
| **ElevenLabs**     | `ELEVENLABS_API_KEY` або `XI_API_KEY`                                                                            | Клонування голосу, багатомовність, детермінованість через `seed`.       |
| **Google Gemini**  | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                                                                            | TTS Gemini API; підтримує персони через `promptTemplate: "audio-profile-v1"`. |
| **Gradium**        | `GRADIUM_API_KEY`                                                                                                | Вивід голосових нотаток і телефонії.                                    |
| **Inworld**        | `INWORLD_API_KEY`                                                                                                | Streaming TTS API. Нативний Opus для голосових нотаток і PCM для телефонії. |
| **Local CLI**      | none                                                                                                             | Запускає налаштовану локальну команду TTS.                              |
| **Microsoft**      | none                                                                                                             | Публічний Edge neural TTS через `node-edge-tts`. Best-effort, без SLA.  |
| **MiniMax**        | `MINIMAX_API_KEY` (або Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)   | API T2A v2. За замовчуванням `speech-2.8-hd`.                           |
| **OpenAI**         | `OPENAI_API_KEY`                                                                                                 | Також використовується для auto-summary; підтримує персону `instructions`. |
| **OpenRouter**     | `OPENROUTER_API_KEY` (може повторно використовувати `models.providers.openrouter.apiKey`)                       | Типова модель `hexgrad/kokoro-82m`.                                     |
| **Volcengine**     | `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY` (застарілі AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | HTTP API BytePlus Seed Speech.                                          |
| **Vydra**          | `VYDRA_API_KEY`                                                                                                  | Спільний провайдер зображень, відео та мовлення.                        |
| **xAI**            | `XAI_API_KEY`                                                                                                    | Пакетний TTS xAI. Нативний Opus для голосових нотаток **не** підтримується. |
| **Xiaomi MiMo**    | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo через chat completions Xiaomi.                                 |

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний,
а інші стають fallback-варіантами. Auto-summary використовує `summaryModel` (або
`agents.defaults.model.primary`), тож якщо ви залишаєте summaries увімкненими,
цей провайдер також має бути автентифікований.

<Warning>
Вбудований провайдер **Microsoft** використовує онлайновий neural TTS-сервіс Microsoft Edge
через `node-edge-tts`. Це публічний вебсервіс без опублікованих
SLA або квот — вважайте його best-effort. Застарілий ідентифікатор провайдера `edge`
нормалізується до `microsoft`, а `openclaw doctor --fix` переписує збережену
конфігурацію; у нових конфігураціях завжди слід використовувати `microsoft`.
</Warning>

## Конфігурація

Конфігурація TTS розміщується в `messages.tts` у `~/.openclaw/openclaw.json`. Виберіть
preset і адаптуйте блок провайдера:

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
          // Необов’язкові запити стилю природною мовою:
          // audioProfile: "Говори спокійним тоном ведучого подкасту.",
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

### Перевизначення голосу для кожного agent

Використовуйте `agents.list[].tts`, коли один agent має говорити з іншим провайдером,
голосом, моделлю, персоною або режимом auto-TTS. Блок agent виконує глибоке злиття поверх
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

Щоб зафіксувати персону для конкретного agent, встановіть `agents.list[].tts.persona` разом із
конфігурацією провайдера — це перевизначає глобальне `messages.tts.persona` лише для цього agent.

Порядок пріоритету для автоматичних відповідей, `/tts audio`, `/tts status` і
інструмента agent `tts`:

1. `messages.tts`
2. активний `agents.list[].tts`
3. перевизначення каналу, коли канал підтримує `channels.<channel>.tts`
4. перевизначення облікового запису, коли канал передає `channels.<channel>.accounts.<id>.tts`
5. локальні налаштування `/tts` для цього host
6. вбудовані директиви `[[tts:...]]`, коли [керовані моделлю перевизначення](#model-driven-directives) увімкнено

Перевизначення каналу й облікового запису використовують ту саму форму, що й `messages.tts`, і
виконують глибоке злиття поверх попередніх шарів, тому спільні облікові дані провайдера можуть залишатися в
`messages.tts`, тоді як канал або обліковий запис бота змінює лише voice, model, persona
або режим auto:

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

**Персона** — це стабільна мовленнєва ідентичність, яку можна детерміновано
застосовувати в різних провайдерів. Вона може надавати перевагу одному провайдеру, визначати
нейтральний щодо провайдера намір prompt і містити прив’язки, специфічні для провайдера, для голосів, моделей, prompt-
templates, seeds і voice settings.

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

### Повна персона (нейтральний щодо провайдера prompt)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Сухий, теплий британський голос оповідача-дворецького.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Блискучий британський дворецький. Сухий, дотепний, теплий, чарівний, емоційно виразний, ніколи не загальний.",
            scene: "Тихий пізньовечірній кабінет. Оповідь біля мікрофона для довіреного оператора.",
            sampleContext: "Мовець відповідає на приватний технічний запит стисло, впевнено й із сухою теплотою.",
            style: "Вишуканий, стриманий, з легкою усмішкою.",
            accent: "Британська англійська.",
            pacing: "Розмірений, із короткими драматичними паузами.",
            constraints: ["Не зачитувати вголос значення конфігурації.", "Не пояснювати персону."],
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
3. Персона відсутня.

Вибір провайдера виконується за принципом explicit-first:

1. Прямі перевизначення (CLI, gateway, Talk, дозволені директиви TTS).
2. Локальне налаштування `/tts provider <id>`.
3. `provider` активної персони.
4. `messages.tts.provider`.
5. Auto-select реєстру.

Для кожної спроби з провайдером OpenClaw об’єднує конфігурації в такому порядку:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Довірені перевизначення запиту
4. Дозволені перевизначення директив TTS, згенерованих моделлю

### Як провайдери використовують prompt персони

Поля prompt персони (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) є **нейтральними щодо провайдера**. Кожен провайдер сам вирішує, як
їх використовувати:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Обгортає поля prompt персони в структуру prompt Gemini TTS **лише коли**
    ефективна конфігурація провайдера Google встановлює `promptTemplate: "audio-profile-v1"`
    або `personaPrompt`. Старіші поля `audioProfile` і `speakerName` усе ще
    додаються на початок як текст prompt, специфічний для Google. Вбудовані audio-теги, такі як
    `[whispers]` або `[laughs]` усередині блоку `[[tts:text]]`, зберігаються
    в transcript Gemini; OpenClaw не генерує ці теги.
  </Accordion>
  <Accordion title="OpenAI">
    Відображає поля prompt персони в поле запиту `instructions` **лише коли**
    не налаштовано явне `instructions` для OpenAI. Явне `instructions`
    завжди має пріоритет.
  </Accordion>
  <Accordion title="Інші провайдери">
    Використовують лише прив’язки персони, специфічні для провайдера, у
    `personas.<id>.providers.<provider>`. Поля prompt персони ігноруються,
    якщо провайдер не реалізує власне зіставлення persona-prompt.
  </Accordion>
</AccordionGroup>

### Політика fallback

`fallbackPolicy` керує поведінкою, коли персона **не має прив’язки** для
провайдера, що перевіряється:

| Політика            | Поведінка                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **За замовчуванням.** Нейтральні щодо провайдера поля prompt залишаються доступними; провайдер може використовувати їх або ігнорувати.         |
| `provider-defaults` | Персона виключається з підготовки prompt для цієї спроби; провайдер використовує свої нейтральні значення за замовчуванням, поки fallback до інших провайдерів триває. |
| `fail`              | Пропускає цю спробу провайдера з `reasonCode: "not_configured"` і `personaBinding: "missing"`. Fallback-провайдери все одно будуть перевірятися. |

Увесь запит TTS завершується помилкою лише тоді, коли **кожен** перевірений провайдер пропущено
або він завершився помилкою.

## Директиви, керовані моделлю

За замовчуванням assistant **може** виводити директиви `[[tts:...]]` для перевизначення
voice, model або speed для однієї відповіді, а також необов’язковий
блок `[[tts:text]]...[[/tts:text]]` для виразних підказок, які мають з’явитися
лише в аудіо:

```text
Ось.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](сміється) Прочитай пісню ще раз.[[/tts:text]]
```

Коли `messages.tts.auto` має значення `"tagged"`, для запуску
аудіо **обов’язково потрібні директиви**. Потокова доставка блоків прибирає директиви з видимого тексту до того, як
канал їх побачить, навіть якщо вони розбиті між сусідніми блоками.

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
- `pitch` (цілочисельний pitch MiniMax, від −12 до 12; дробові значення відкидаються)
- `emotion` (тег emotion у Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Повністю вимкнути перевизначення моделі:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Дозволити перемикання провайдера, залишаючи інші параметри налаштовуваними:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash-команди

Єдина команда `/tts`. У Discord OpenClaw також реєструє `/voice`, оскільки
`/tts` — це вбудована команда Discord — текстова форма `/tts ...` усе одно працює.

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
Команди потребують авторизованого відправника (діють правила allowlist/owner) і
має бути ввімкнено або `commands.text`, або нативну реєстрацію команд.
</Note>

Примітки щодо поведінки:

- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- `/tts chat on|off|default` записує session-scoped перевизначення auto-TTS для поточного чату.
- `/tts persona <id>` записує локальне налаштування персони; `/tts persona off` очищує його.
- `/tts latest` зчитує останню відповідь assistant із transcript поточного сеансу й один раз надсилає її як аудіо. Він зберігає лише hash цієї відповіді в записі сеансу, щоб придушити дублікати голосових надсилань.
- `/tts audio` генерує одноразову аудіовідповідь (**не** вмикає TTS).
- `limit` і `summary` зберігаються в **локальних налаштуваннях**, а не в основній конфігурації.
- `/tts status` включає діагностику fallback для останньої спроби — `Fallback: <primary> -> <used>`, `Attempts: ...` і подробиці для кожної спроби (`provider:outcome(reasonCode) latency`).
- `/status` показує активний режим TTS, а також налаштовані провайдер, модель, голос і санітизовані метадані custom endpoint, коли TTS увімкнено.

## Налаштування для кожного користувача

Slash-команди записують локальні перевизначення в `prefsPath`. За замовчуванням це
`~/.openclaw/settings/tts.json`; перевизначити можна через env-змінну `OPENCLAW_TTS_PREFS`
або `messages.tts.prefsPath`.

| Збережене поле | Ефект                                      |
| -------------- | ------------------------------------------ |
| `auto`         | Локальне перевизначення auto-TTS (`always`, `off`, …) |
| `provider`     | Локальне перевизначення основного провайдера |
| `persona`      | Локальне перевизначення персони            |
| `maxLength`    | Поріг summary (типово `1500` символів)     |
| `summarize`    | Перемикач summary (типово `true`)          |

Вони перевизначають ефективну конфігурацію з `messages.tts` разом з активним
блоком `agents.list[].tts` для цього host.

## Формати виводу (фіксовані)

Доставка голосу TTS визначається можливостями каналу. Plugins каналів оголошують,
чи має TTS у стилі voice просити провайдерів про нативну ціль `voice-note`, чи
зберігати звичайний синтез `audio-file` і лише позначати сумісний вивід для
голосової доставки.

- **Канали з підтримкою voice-note**: відповіді у форматі voice-note віддають перевагу Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48 кГц / 64 кбіт/с — хороший компроміс для голосових повідомлень.
- **Feishu / WhatsApp**: коли відповідь у форматі voice-note створюється як MP3/WebM/WAV/M4A
  або інший імовірний аудіофайл, Plugin каналу перекодовує її в 48 кГц
  Ogg/Opus за допомогою `ffmpeg` перед надсиланням нативного голосового повідомлення. WhatsApp надсилає
  результат через payload Baileys `audio` з `ptt: true` і
  `audio/ogg; codecs=opus`. Якщо конвертація завершується помилкою, Feishu отримує початковий
  файл як вкладення; надсилання WhatsApp завершується помилкою замість публікації несумісного
  payload PTT.
- **BlueBubbles**: залишає синтез провайдера на звичайному шляху audio-file; виводи MP3
  і CAF позначаються для доставки голосових нотаток iMessage.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44,1 кГц / 128 кбіт/с — типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, частота дискретизації 32 кГц) для звичайних аудіовкладень. Для оголошених каналом цілей voice-note OpenClaw перекодовує MP3 MiniMax у 48 кГц Opus за допомогою `ffmpeg` перед доставкою, коли канал оголошує підтримку перекодування.
- **Xiaomi MiMo**: MP3 за замовчуванням або WAV, якщо налаштовано. Для оголошених каналом цілей voice-note OpenClaw перекодовує вивід Xiaomi у 48 кГц Opus за допомогою `ffmpeg` перед доставкою, коли канал оголошує підтримку перекодування.
- **Local CLI**: використовує налаштований `outputFormat`. Цілі voice-note
  конвертуються в Ogg/Opus, а вивід для телефонії — у сирий 16 кГц моно PCM
  за допомогою `ffmpeg`.
- **Google Gemini**: Gemini API TTS повертає сирий 24 кГц PCM. OpenClaw обгортає його у WAV для аудіовкладень, перекодовує в 48 кГц Opus для цілей voice-note і повертає PCM напряму для Talk/телефонії.
- **Gradium**: WAV для аудіовкладень, Opus для цілей voice-note і `ulaw_8000` на 8 кГц для телефонії.
- **Inworld**: MP3 для звичайних аудіовкладень, нативний `OGG_OPUS` для цілей voice-note і сирий `PCM` на 22050 Гц для Talk/телефонії.
- **xAI**: MP3 за замовчуванням; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує пакетну REST-кінцеву точку TTS xAI і повертає повністю готове аудіовкладення; потоковий WebSocket TTS xAI цим шляхом провайдера не використовується. Нативний формат voice-note Opus цим шляхом не підтримується.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований transport приймає `outputFormat`, але не всі формати доступні в сервісі.
  - Значення формату виводу відповідають форматам виводу Microsoft Speech (зокрема Ogg/WebM Opus).
  - `sendVoice` у Telegram приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення Opus.
  - Якщо налаштований формат виводу Microsoft завершується помилкою, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI/ElevenLabs фіксовані для кожного каналу (див. вище).

## Поведінка auto-TTS

Коли `messages.tts.auto` увімкнено, OpenClaw:

- Пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- Пропускає дуже короткі відповіді (менше 10 символів).
- Узагальнює довгі відповіді, якщо summaries увімкнено, використовуючи
  `summaryModel` (або `agents.defaults.model.primary`).
- Додає згенероване аудіо до відповіді.
- У режимі `mode: "final"` усе одно надсилає TTS лише як аудіо для фінальних потокових відповідей
  після завершення текстового потоку; згенеровані медіадані проходять ту саму
  нормалізацію медіа каналу, що й звичайні вкладення відповіді.

Якщо відповідь перевищує `maxLength`, а summary вимкнено (або немає API-ключа для
моделі summary), аудіо пропускається й надсилається звичайна текстова відповідь.

```text
Відповідь -> TTS увімкнено?
  ні  -> надіслати текст
  так -> є медіа / MEDIA: / коротка?
          так -> надіслати текст
          ні  -> довжина > ліміт?
                   ні  -> TTS -> додати аудіо
                   так -> summary увімкнено?
                            ні  -> надіслати текст
                            так -> summary -> TTS -> додати аудіо
```

## Формати виводу за каналом

| Ціль                                  | Формат                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Відповіді у форматі voice-note віддають перевагу **Opus** (`opus_48000_64` від ElevenLabs, `opus` від OpenAI). 48 кГц / 64 кбіт/с балансує чіткість і розмір. |
| Інші канали                           | **MP3** (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI). 44,1 кГц / 128 кбіт/с — типовий варіант для мовлення.                    |
| Talk / телефонія                      | Нативний для провайдера **PCM** (Inworld 22050 Гц, Google 24 кГц) або `ulaw_8000` від Gradium для телефонії.                         |

Примітки для окремих провайдерів:

- **Перекодування Feishu / WhatsApp:** Коли відповідь у форматі voice-note надходить як MP3/WebM/WAV/M4A, Plugin каналу перекодовує її у 48 кГц Ogg/Opus за допомогою `ffmpeg`. WhatsApp надсилає через Baileys з `ptt: true` і `audio/ogg; codecs=opus`. Якщо конвертація завершується помилкою: Feishu повертається до вкладення початкового файла; надсилання WhatsApp завершується помилкою замість публікації несумісного payload PTT.
- **MiniMax / Xiaomi MiMo:** Типово MP3 (32 кГц для MiniMax `speech-2.8-hd`); перекодовується в 48 кГц Opus для цілей voice-note через `ffmpeg`.
- **Local CLI:** Використовує налаштований `outputFormat`. Цілі voice-note конвертуються в Ogg/Opus, а вивід для телефонії — у сирий 16 кГц моно PCM.
- **Google Gemini:** Повертає сирий 24 кГц PCM. OpenClaw обгортає його у WAV для вкладень, перекодовує в 48 кГц Opus для цілей voice-note, повертає PCM напряму для Talk/телефонії.
- **Inworld:** MP3-вкладення, нативний `OGG_OPUS` для voice-note, сирий `PCM` 22050 Гц для Talk/телефонії.
- **xAI:** MP3 за замовчуванням; `responseFormat` може бути `mp3|wav|pcm|mulaw|alaw`. Використовує пакетну кінцеву точку REST xAI — потоковий WebSocket TTS **не** використовується. Нативний формат voice-note Opus **не** підтримується.
- **Microsoft:** Використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` у Telegram приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні гарантовані голосові повідомлення Opus. Якщо налаштований формат Microsoft завершується помилкою, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI та ElevenLabs фіксовані для кожного каналу, як указано вище.

## Довідник полів

<AccordionGroup>
  <Accordion title="Верхньорівневі messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Режим auto-TTS. `inbound` надсилає аудіо лише після вхідного голосового повідомлення; `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:...]]` або блок `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Застарілий перемикач. `openclaw doctor --fix` переносить його в `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` включає відповіді інструментів/блоків на додачу до фінальних відповідей.
    </ParamField>
    <ParamField path="provider" type="string">
      Ідентифікатор speech-провайдера. Якщо не задано, OpenClaw використовує першого налаштованого провайдера в порядку auto-select реєстру. Застаріле `provider: "edge"` переписується в `"microsoft"` за допомогою `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Ідентифікатор активної персони з `personas`. Нормалізується до нижнього регістру.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Стабільна мовленнєва ідентичність. Поля: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Див. [Персони](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Дешева модель для auto-summary; типово `agents.defaults.model.primary`. Приймає `provider/model` або налаштований псевдонім моделі.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Дозволяє моделі виводити директиви TTS. `enabled` типово дорівнює `true`; `allowProvider` типово дорівнює `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Налаштування, що належать провайдеру, з ключем за ідентифікатором speech-провайдера. Застарілі прямі блоки (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) переписуються `openclaw doctor --fix`; комітьте лише `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Жорсткий ліміт символів для вхідного тексту TTS. `/tts audio` завершується помилкою, якщо його перевищено.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Тайм-аут запиту в мілісекундах.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Перевизначає шлях до JSON локальних налаштувань (provider/limit/summary). Типово `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Регіон Azure Speech (наприклад, `eastus`). Env: `AZURE_SPEECH_REGION` або `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Необов’язкове перевизначення endpoint Azure Speech (псевдонім `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName голосу Azure. Типово `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Код мови SSML. Типово `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` для стандартного аудіо. Типово `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` для виводу voice-note. Типово `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Використовує як fallback `ELEVENLABS_API_KEY` або `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі (наприклад, `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">Ідентифікатор голосу ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (кожне `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = звичайна).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Режим нормалізації тексту.</ParamField>
    <ParamField path="languageCode" type="string">2-літерний ISO 639-1 (наприклад, `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Ціле число `0..4294967295` для best-effort детермінованості.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначає базову URL-адресу API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Використовує як fallback `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Якщо пропущено, TTS може повторно використати `models.providers.google.apiKey` перед fallback до env.</ParamField>
    <ParamField path="model" type="string">Модель Gemini TTS. Типово `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Назва вбудованого голосу Gemini. Типово `Kore`. Псевдонім: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Запит стилю природною мовою, що додається перед озвучуваним текстом.</ParamField>
    <ParamField path="speakerName" type="string">Необов’язкова мітка мовця, що додається перед озвучуваним текстом, коли ваш prompt використовує іменованого мовця.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Установіть `audio-profile-v1`, щоб обгорнути поля prompt активної персони в детерміновану структуру prompt Gemini TTS.</ParamField>
    <ParamField path="personaPrompt" type="string">Додатковий текст prompt персони, специфічний для Google, який додається до Director's Notes шаблону.</ParamField>
    <ParamField path="baseUrl" type="string">Приймається лише `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Типово Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Типово `inworld-tts-1.5-max`. Також: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Типово `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Температура семплювання `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Локальний виконуваний файл або рядок команди для CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Аргументи команди. Підтримує placeholders `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Очікуваний формат виводу CLI. Типово `mp3` для аудіовкладень.</ParamField>
    <ParamField path="timeoutMs" type="number">Тайм-аут команди в мілісекундах. Типово `120000`.</ParamField>
    <ParamField path="cwd" type="string">Необов’язковий робочий каталог команди.</ParamField>
    <ParamField path="env" type="Record<string, string>">Необов’язкові перевизначення середовища для команди.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (без API-ключа)">
    <ParamField path="enabled" type="boolean" default="true">Дозволяє використання Microsoft speech.</ParamField>
    <ParamField path="voice" type="string">Назва neural-голосу Microsoft (наприклад, `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Код мови (наприклад, `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Формат виводу Microsoft. Типово `audio-24khz-48kbitrate-mono-mp3`. Не всі формати підтримуються вбудованим transport на базі Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Рядки відсотків (наприклад, `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Записує JSON-субтитри поруч з аудіофайлом.</ParamField>
    <ParamField path="proxy" type="string">URL-адреса proxy для запитів speech Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Перевизначення тайм-ауту запиту (мс).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Застарілий псевдонім. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію в `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Використовує як fallback `MINIMAX_API_KEY`. Auth Token Plan через `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` або `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Типово `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Типово `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Типово `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Типово `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Ціле число `-12..12`. Типово `0`. Дробові значення відкидаються перед запитом.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Використовує як fallback `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі OpenAI TTS (наприклад, `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Назва голосу (наприклад, `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Явне поле OpenAI `instructions`. Коли встановлено, поля prompt персони **не** зіставляються автоматично.</ParamField>
    <ParamField path="baseUrl" type="string">
      Перевизначає endpoint OpenAI TTS. Порядок визначення: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Нестандартні значення розглядаються як OpenAI-сумісні endpoints TTS, тому приймаються власні назви моделей і голосів.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Може повторно використовувати `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://openrouter.ai/api/v1`. Застаріле `https://openrouter.ai/v1` нормалізується.</ParamField>
    <ParamField path="model" type="string">Типово `hexgrad/kokoro-82m`. Псевдонім: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Типово `af_alloy`. Псевдонім: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Типово `mp3`.</ParamField>
    <ParamField path="speed" type="number">Нативне для провайдера перевизначення швидкості.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Типово `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Використовуйте `seed-tts-2.0`, коли ваш проєкт має entitlement TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Заголовок app key. Типово `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначає HTTP endpoint TTS Seed Speech. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Тип голосу. Типово `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Нативне для провайдера співвідношення швидкості.</ParamField>
    <ParamField path="emotion" type="string">Нативний для провайдера тег emotion.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Застарілі поля Volcengine Speech Console. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (типово `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Типово `eve`. Live-голоси: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Код мови BCP-47 або `auto`. Типово `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Типово `mp3`.</ParamField>
    <ParamField path="speed" type="number">Нативне для провайдера перевизначення швидкості.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Типово `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Також підтримує `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Типово `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Типово `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Необов’язкова інструкція стилю природною мовою, яка надсилається як повідомлення користувача; не озвучується.</ParamField>
  </Accordion>
</AccordionGroup>

## Інструмент agent

Інструмент `tts` перетворює текст на мовлення й повертає аудіовкладення для
доставки у відповіді. У Feishu, Matrix, Telegram і WhatsApp аудіо
доставляється як голосове повідомлення, а не як файлове вкладення. Feishu і
WhatsApp можуть перекодовувати вивід TTS, що не є Opus, цим шляхом, коли доступний `ffmpeg`.

WhatsApp надсилає аудіо через Baileys як голосову нотатку PTT (`audio` з
`ptt: true`) і надсилає видимий текст **окремо** від аудіо PTT, оскільки
клієнти не завжди коректно відображають підписи до голосових нотаток.

Інструмент приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` — це
тайм-аут запиту до провайдера для кожного виклику в мілісекундах.

## Gateway RPC

| Метод             | Призначення                              |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Зчитати поточний стан TTS і останню спробу. |
| `tts.enable`      | Установити локальне налаштування auto на `always`. |
| `tts.disable`     | Установити локальне налаштування auto на `off`. |
| `tts.convert`     | Одноразове перетворення текст → аудіо.   |
| `tts.setProvider` | Установити локальне налаштування провайдера. |
| `tts.setPersona`  | Установити локальне налаштування персони. |
| `tts.providers`   | Перелічити налаштованих провайдерів і стан. |

## Посилання на сервіси

- [Посібник OpenAI з text-to-speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідник API OpenAI Audio](https://platform.openai.com/docs/api-reference/audio)
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
- [Plugin Voice call](/uk/plugins/voice-call)
