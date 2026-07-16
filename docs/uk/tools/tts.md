---
read_when:
    - Увімкнення синтезу мовлення для відповідей
    - Налаштування постачальника TTS, ланцюжка резервних варіантів або персони
    - Використання команд або директив /tts
sidebarTitle: Text to speech (TTS)
summary: Перетворення тексту на мовлення для вихідних відповідей — постачальники, персони, команди зі скісною рискою та виведення для кожного каналу
title: Перетворення тексту на мовлення
x-i18n:
    generated_at: "2026-07-16T18:42:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ba17f56927507a73b5b116f5f13bb7b612b4ba7669f5ad240d5c96a6620c611
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw перетворює вихідні відповіді на аудіо за допомогою **14 постачальників синтезу мовлення**:
нативні голосові повідомлення у Feishu, Matrix, Telegram і WhatsApp; аудіовкладення
в усіх інших місцях; а також потоки PCM/Ulaw для телефонії та Talk.

TTS — це частина Talk, що відповідає за виведення мовлення в режимі `stt-tts` (`talk.speak` використовує
той самий шлях синтезу). Нативні для постачальника сеанси Talk `realtime` синтезують
мовлення всередині постачальника реального часу; сеанси `transcription` ніколи
не синтезують голосову відповідь асистента.

## Швидкий початок

<Steps>
  <Step title="Виберіть постачальника">
    OpenAI та ElevenLabs — найнадійніші хостингові варіанти. Microsoft і
    локальний CLI працюють без ключа API. Повний список наведено в [матриці постачальників](#supported-providers).
  </Step>
  <Step title="Установіть ключ API">
    Експортуйте змінну середовища для свого постачальника (наприклад, `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Для Microsoft і локального CLI ключ не потрібен.
  </Step>
  <Step title="Увімкніть у конфігурації">
    Установіть `messages.tts.auto: "always"` та `messages.tts.provider`:

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
Автоматичний TTS за замовчуванням **вимкнено**. Якщо `messages.tts.provider` не задано,
OpenClaw вибирає першого налаштованого постачальника відповідно до порядку автоматичного вибору в реєстрі.
Вбудований інструмент агента `tts` використовується лише за явним наміром: звичайний чат залишається
текстовим, якщо користувач не попросить аудіо, не використає `/tts` або не ввімкне автоматичний TTS чи
мовлення за директивою.
</Note>

## Підтримувані постачальники

| Постачальник      | Автентифікація                                                                                                   | Примітки                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (також `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)         | Нативне виведення голосових нотаток Ogg/Opus і телефонія.                                   |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                               | TTS, сумісний з OpenAI. За замовчуванням — `hexgrad/Kokoro-82M`.                              |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` або `XI_API_KEY`                                                                        | Клонування голосу, багатомовність, детермінованість через `seed`; потокове передавання для голосового відтворення в Discord. |
| **Google Gemini** | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                                                                        | Пакетний TTS через Gemini API; підтримка персон за допомогою `promptTemplate: "audio-profile-v1"`.             |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                               | Виведення голосових нотаток і телефонія.                                                    |
| **Inworld**       | `INWORLD_API_KEY`                                                                                               | Потоковий API TTS. Нативні голосові нотатки Opus і телефонія PCM.                           |
| **Локальний CLI** | немає                                                                                                            | Запускає налаштовану локальну команду TTS.                                                  |
| **Microsoft**     | немає                                                                                                            | Загальнодоступний нейронний TTS Edge через `node-edge-tts`. Працює без гарантій, SLA немає. |
| **MiniMax**       | `MINIMAX_API_KEY` (або план токенів: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)                 | API T2A v2. За замовчуванням — `speech-2.8-hd`.                                          |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                               | Також використовується для автоматичного підсумовування; підтримує персону `instructions`. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (можна повторно використати `models.providers.openrouter.apiKey`)                                               | Модель за замовчуванням — `hexgrad/kokoro-82m`.                                               |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY` (застарілі AppID/токен: `VOLCENGINE_TTS_APPID`/`_TOKEN`)          | HTTP API BytePlus Seed Speech.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                               | Спільний постачальник зображень, відео та мовлення.                                         |
| **xAI**           | `XAI_API_KEY`                                                                                               | Пакетний TTS xAI. Нативні голосові нотатки Opus **не** підтримуються.                        |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                               | TTS MiMo через завершення чату Xiaomi.                                                      |

Якщо налаштовано кількох постачальників, спочатку використовується вибраний, а
решта слугують резервними варіантами. Автоматичне підсумовування використовує `summaryModel` (або
`agents.defaults.model.primary`), тому для цього постачальника також потрібно налаштувати автентифікацію,
якщо підсумовування залишається ввімкненим.

<Warning>
Вбудований постачальник **Microsoft** використовує онлайн-службу нейронного TTS Microsoft Edge
через `node-edge-tts`. Це загальнодоступна вебслужба без опублікованих
SLA або квоти — розраховуйте на роботу без гарантій. Застарілий ідентифікатор постачальника `edge`
нормалізується до `microsoft`, а `openclaw doctor --fix` переписує збережену
конфігурацію; у нових конфігураціях завжди слід використовувати `microsoft`.
</Warning>

## Конфігурація

Конфігурація TTS міститься в `messages.tts` у файлі `~/.openclaw/openclaw.json`. Виберіть
готовий набір і адаптуйте блок постачальника. Показані нижче поля `speakerVoice`/`speakerVoiceId`
є канонічними; власні назви полів `voice`/`voiceId`/
`voiceName` кожного постачальника досі працюють як застарілі псевдоніми.

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
          // Необов'язкові підказки щодо стилю природною мовою:
          // audioProfile: "Говоріть спокійним тоном ведучого подкасту.",
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Локальний CLI">
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
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

Для Xiaomi `mimo-v2.5-tts-voicedesign` не вказуйте `speakerVoice` і задайте для `style`
підказку для проєктування голосу. OpenClaw надсилає цю підказку як повідомлення TTS `user`
і не надсилає `audio.voice` для моделі voicedesign.

### Перевизначення голосу для окремих агентів

Використовуйте `agents.list[].tts`, коли один агент має говорити через іншого провайдера,
іншим голосом, моделлю, персоною або в іншому режимі автоматичного TTS. Блок агента глибоко об’єднується з
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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Щоб закріпити персону за окремим агентом, задайте `agents.list[].tts.persona` разом із конфігурацією
провайдера — це перевизначає глобальне значення `messages.tts.persona` лише для цього агента.

Порядок пріоритету для автоматичних відповідей, `/tts audio`, `/tts status` та
інструмента агента `tts`:

1. `messages.tts`
2. активний `agents.list[].tts`
3. перевизначення каналу, якщо канал підтримує `channels.<channel>.tts`
4. перевизначення облікового запису, якщо канал передає `channels.<channel>.accounts.<id>.tts`
5. локальні налаштування `/tts` для цього хоста
6. вбудовані директиви `[[tts:...]]`, коли ввімкнено [перевизначення моделлю](#model-driven-directives)

Перевизначення каналу й облікового запису мають ту саму структуру, що й `messages.tts`, і
глибоко об’єднуються з попередніми шарами, тому спільні облікові дані провайдера можуть залишатися в
`messages.tts`, тоді як канал або обліковий запис бота змінює лише голос мовця, модель, персону
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
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Персони

**Персона** — це стабільна голосова ідентичність, яку можна детерміновано застосовувати
до різних провайдерів. Вона може надавати перевагу одному провайдеру, визначати
незалежний від провайдера задум підказки та містити прив’язки до конкретних провайдерів
для голосів, моделей, шаблонів підказок, початкових значень і налаштувань голосу.

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
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### Повна персона (незалежна від провайдера підказка)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Альфред",
          description: "Стриманий, доброзичливий британський дворецький-оповідач.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Блискучий британський дворецький. Стриманий, дотепний, доброзичливий, чарівний, емоційно виразний, ніколи не шаблонний.",
            scene: "Тихий нічний кабінет. Оповідь близько до мікрофона для довіреного оператора.",
            sampleContext: "Мовець відповідає на приватний технічний запит стисло, впевнено та зі стриманою доброзичливістю.",
            style: "Вишуканий, стриманий, з легкою усмішкою.",
            accent: "Британська англійська.",
            pacing: "Розмірений, із короткими драматичними паузами.",
            constraints: ["Не зачитувати значення конфігурації вголос.", "Не пояснювати персону."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
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

Під час вибору провайдера явні налаштування мають пріоритет:

1. Прямі перевизначення (CLI, Gateway, Talk, дозволені директиви TTS).
2. Локальне налаштування `/tts provider <id>`.
3. `provider` активної персони.
4. `messages.tts.provider`.
5. Автоматичний вибір із реєстру.

Для кожної спроби провайдера OpenClaw об’єднує конфігурації в такому порядку:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Довірені перевизначення запиту
4. Дозволені перевизначення з директив TTS, згенерованих моделлю

### Як провайдери використовують підказки персони

Поля підказки персони (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) **не залежать від провайдера**. Кожен провайдер сам вирішує, як
їх використовувати:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Обгортає поля підказки персони в структуру підказки Gemini TTS **лише тоді, коли**
    ефективна конфігурація провайдера Google задає `promptTemplate: "audio-profile-v1"`
    або `personaPrompt`. Старіші поля `audioProfile` і `speakerName` усе ще
    додаються на початок як текст підказки, специфічний для Google. Вбудовані аудіотеги, як-от
    `[whispers]` або `[laughs]`, усередині блоку `[[tts:text]]` зберігаються
    в транскрипті Gemini; OpenClaw не генерує ці теги.
  </Accordion>
  <Accordion title="OpenAI">
    Зіставляє поля підказки персони з полем запиту `instructions` **лише тоді, коли**
    не налаштовано явне значення OpenAI `instructions`. Явне значення `instructions`
    завжди має пріоритет.
  </Accordion>
  <Accordion title="Інші провайдери">
    Використовують лише прив’язки персони до конкретного провайдера в
    `personas.<id>.providers.<provider>`. Поля підказки персони ігноруються,
    якщо провайдер не реалізує власне зіставлення підказки персони.
  </Accordion>
</AccordionGroup>

### Політика резервного вибору

`fallbackPolicy` керує поведінкою, коли персона **не має прив’язки** для
провайдера, що випробовується:

| Політика              | Поведінка                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Типово.** Незалежні від провайдера поля підказки залишаються доступними; провайдер може використати або проігнорувати їх.                                            |
| `provider-defaults` | Персону не включають до підготовки підказки для цієї спроби; провайдер використовує нейтральні типові значення, а резервний перехід до інших провайдерів триває. |
| `fail`              | Пропустити спробу цього провайдера з `reasonCode: "not_configured"` і `personaBinding: "missing"`. Резервні провайдери все одно випробовуються.              |

Увесь запит TTS завершується невдало, лише коли **кожного** випробуваного провайдера пропущено
або кожна спроба завершилася невдало.

Вибір провайдера сеансу Talk діє в межах сеансу. Клієнт Talk має вибирати
ідентифікатори провайдерів, моделей, голосів і локалі з `talk.catalog` та передавати
їх через запит сеансу Talk або передачі керування. Відкриття голосового сеансу не повинно
змінювати `messages.tts` або глобальні типові налаштування провайдера Talk.

## Директиви, керовані моделлю

Типово асистент **може** виводити директиви `[[tts:...]]`, щоб перевизначити
голос, модель або швидкість для однієї відповіді, а також необов’язковий
блок `[[tts:text]]...[[/tts:text]]` для виразних підказок, які мають бути присутні
лише в аудіо:

```text
Ось, будь ласка.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](сміється) Прочитай пісню ще раз.[[/tts:text]]
```

Коли `messages.tts.auto` має значення `"tagged"`, для запуску аудіо
**потрібні директиви**. Потокове доставлення блоків вилучає директиви з видимого тексту до того,
як канал їх отримає, навіть якщо вони розділені між сусідніми блоками.

`provider=...` ігнорується, якщо не задано `modelOverrides.allowProvider: true`. Коли
відповідь оголошує `provider=...`, інші ключі цієї директиви аналізуються
лише цим провайдером; непідтримувані ключі вилучаються та реєструються як попередження
директив TTS.

**Доступні ключі директив:**

- `provider` (зареєстрований ідентифікатор провайдера; потребує `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (застарілі псевдоніми: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, `(0, 10]`)
- `pitch` (цілочисельна висота тону MiniMax, від −12 до 12; дробові значення відкидаються)
- `emotion` (тег емоції Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Повністю вимкнути перевизначення моделлю:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Дозволити перемикання провайдера, зберігши можливість налаштовувати інші параметри:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Команди зі скісною рискою

Єдина команда `/tts`. У Discord OpenClaw також реєструє `/voice`, оскільки
`/tts` є вбудованою командою Discord — текстова команда `/tts ...` усе ще працює.

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
Команди потребують авторизованого відправника (застосовуються правила списку дозволених користувачів/власника), а також має бути ввімкнено
`commands.text` або нативну реєстрацію команд.
</Note>

Примітки щодо поведінки:

- `/tts on` записує локальне налаштування TTS до `always`; `/tts off` записує його до `off`.
- `/tts chat on|off|default` записує перевизначення автоматичного TTS для поточного чату, що діє в межах сеансу.
- `/tts persona <id>` записує локальне налаштування персони; `/tts persona off` очищає його.
- `/tts latest` зчитує останню відповідь асистента з транскрипту поточного сеансу й одноразово надсилає її як аудіо. У записі сеансу зберігається лише хеш цієї відповіді, щоб запобігти дублюванню голосових повідомлень.
- `/tts audio` генерує одноразову аудіовідповідь (**не** вмикає TTS).
- `/tts limit <chars>` приймає значення **100–4096** (4096 — максимальна довжина підпису/повідомлення Telegram); значення поза цим діапазоном відхиляються.
- `limit` і `summary` зберігаються в **локальних налаштуваннях**, а не в основній конфігурації.
- `/tts status` містить діагностику резервних переходів для останньої спроби — `Fallback: <primary> -> <used>`, `Attempts: ...` і відомості про кожну спробу (`provider:outcome(reasonCode) latency`).
- `/status` показує активний режим TTS, а також налаштовані провайдер, модель, голос і очищені метадані власної кінцевої точки, коли TTS увімкнено.

## Налаштування окремих користувачів

Команди зі скісною рискою записують локальні перевизначення до `prefsPath`. Типовим значенням є
`~/.openclaw/settings/tts.json`; перевизначте його за допомогою змінної середовища `OPENCLAW_TTS_PREFS`
або `messages.tts.prefsPath`.

| Збережене поле | Ефект                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | Локальне перевизначення автоматичного TTS (`always`, `off`, …)                                     |
| `provider`   | Локальне перевизначення основного провайдера                                                  |
| `persona`    | Локальне перевизначення персони                                                           |
| `maxLength`  | Порогове значення підсумовування/скорочення (за замовчуванням `1500` символів, діапазон `/tts limit` — 100–4096) |
| `summarize`  | Перемикач підсумовування (за замовчуванням `true`)                                                  |

Вони перевизначають чинну конфігурацію з `messages.tts` разом з активним
блоком `agents.list[].tts` для цього хоста.

## Формати виведення

Передавання голосового TTS визначається можливостями каналу. Плагіни каналів повідомляють,
чи має голосовий TTS запитувати в провайдерів нативний цільовий формат `voice-note` або
зберігати звичайний синтез `audio-file`, а також чи перекодовує канал
ненативний результат перед надсиланням.

| Цільовий канал                        | Формат                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Для відповідей у вигляді голосових повідомлень бажано використовувати **Opus** (`opus_48000_64` від ElevenLabs, `opus` від OpenAI). 48 кГц / 64 кбіт/с забезпечує баланс між чіткістю та розміром. |
| Інші канали                           | **MP3** (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI). 44,1 кГц / 128 кбіт/с — стандартний баланс для мовлення.                  |
| Talk / телефонія                      | Нативний для провайдера **PCM** (Inworld 22050 Гц, Google 24 кГц) або `ulaw_8000` від Gradium для телефонії.                                 |

Примітки щодо провайдерів:

- **Перекодування Feishu / WhatsApp:** коли відповідь у вигляді голосового повідомлення надходить як MP3/WebM/WAV/M4A або інший імовірний аудіофайл, плагін каналу перед надсиланням нативного голосового повідомлення перекодовує його в Ogg/Opus із частотою 48 кГц за допомогою `ffmpeg` (`libopus`, 64 кбіт/с). WhatsApp надсилає результат через корисне навантаження Baileys `audio` з `ptt: true` і `audio/ogg; codecs=opus`. У разі помилки перекодування Feishu перехоплює помилку й надсилає вихідний файл як звичайне вкладення; WhatsApp не має резервного варіанта, тому саме надсилання завершується помилкою замість публікації несумісного корисного навантаження PTT.
- **MiniMax:** MP3 (модель `speech-2.8-hd`, частота дискретизації 32 кГц) для звичайних аудіовкладень; перекодування в Opus із частотою 48 кГц за допомогою `ffmpeg` для цільових форматів голосових повідомлень, оголошених каналом.
- **Xiaomi MiMo:** MP3 за замовчуванням або WAV, якщо це налаштовано; перекодування в Opus із частотою 48 кГц за допомогою `ffmpeg` для цільових форматів голосових повідомлень, оголошених каналом.
- **Локальний CLI:** використовує налаштований `outputFormat`. Цільові формати голосових повідомлень перетворюються на Ogg/Opus, а вихідні дані для телефонії — на необроблений монофонічний PCM із частотою 16 кГц за допомогою `ffmpeg`.
- **Google Gemini:** повертає необроблений PCM із частотою 24 кГц. OpenClaw обгортає його у WAV для аудіовкладень, перекодовує в Opus із частотою 48 кГц для цільових форматів голосових повідомлень і повертає PCM безпосередньо для Talk/телефонії.
- **Gradium:** WAV для аудіовкладень, Opus для цільових форматів голосових повідомлень і `ulaw_8000` із частотою 8 кГц для телефонії.
- **Inworld:** MP3 для звичайних аудіовкладень, нативний `OGG_OPUS` для цільових форматів голосових повідомлень і необроблений `PCM` із частотою 22050 Гц для Talk/телефонії.
- **xAI:** MP3 за замовчуванням; для синтезу аудіофайлів можна використовувати `mp3`, `wav`, `pcm`, `mulaw` або `alaw` як для буферизованого, так і для потокового виведення. Для цільових форматів голосових повідомлень використовується MP3 під час потокового виведення та як резервний варіант буферизованого виведення, оскільки результати `pcm`, `mulaw` і `alaw` від xAI є необробленим аудіо без заголовків. Буферизований синтез використовує пакетну REST-кінцеву точку xAI `/v1/tts`; `textToSpeechStream` використовує нативний `wss://api.x.ai/v1/tts`. Це не контракт голосового зв’язку в реальному часі. Нативний формат голосових повідомлень Opus не підтримується.
- **Microsoft:** використовує `microsoft.outputFormat` (за замовчуванням `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований транспорт приймає `outputFormat`, але сервіс надає не всі формати.
  - Значення формату виведення відповідають вихідним форматам Microsoft Speech (зокрема Ogg/WebM Opus).
  - Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо потрібні гарантовані голосові повідомлення Opus.
  - Якщо налаштований формат виведення Microsoft не спрацьовує, OpenClaw повторює спробу з MP3.
  - Якщо явне перевизначення голосу не задано й використовується стандартний англійський голос, OpenClaw автоматично перемикається на китайський нейронний голос (`zh-CN-XiaoxiaoNeural`, локаль `zh-CN`), якщо в тексті відповіді переважають символи CJK.

Формати виведення OpenAI та ElevenLabs фіксовані для кожного каналу, як зазначено вище.

## Поведінка автоматичного TTS

Коли `messages.tts.auto` увімкнено, OpenClaw:

- Пропускає TTS, якщо відповідь уже містить структуровані медіадані.
- Пропускає дуже короткі відповіді (менше ніж 10 символів).
- Підсумовує довгі відповіді, коли підсумовування ввімкнено, використовуючи
  `summaryModel` (або `agents.defaults.model.primary`).
- Додає згенероване аудіо до відповіді.
- У `mode: "final"` усе одно надсилає лише аудіо TTS для фінальних потокових відповідей
  після завершення текстового потоку; згенеровані медіадані проходять ту саму
  нормалізацію медіаданих каналу, що й звичайні вкладення відповіді.

Якщо відповідь перевищує `maxLength`, OpenClaw ніколи не пропускає аудіо повністю:

- **Підсумовування ввімкнено** (за замовчуванням) і модель підсумовування доступна: підсумовує
  текст приблизно до `maxLength` символів, а потім синтезує підсумок.
- **Підсумовування вимкнено**, підсумовування завершується помилкою або для
  моделі підсумовування немає ключа API: скорочує текст до `maxLength` символів і синтезує
  скорочений текст.

```text
Відповідь -> TTS увімкнено?
  ні  -> надіслати текст
  так -> є медіадані / коротка?
          так -> надіслати текст
          ні  -> довжина > обмеження?
                   ні  -> TTS -> додати аудіо
                   так -> підсумовування ввімкнене й доступне?
                            ні  -> скоротити -> TTS -> додати аудіо
                            так -> підсумувати -> TTS -> додати аудіо
```

## Довідник полів

<AccordionGroup>
  <Accordion title="Верхньорівневі messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Режим автоматичного TTS. `inbound` надсилає аудіо лише після вхідного голосового повідомлення; `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:...]]` або блок `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Застарілий перемикач. `openclaw doctor --fix` переносить його до `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` включає відповіді інструментів/блоків на додачу до фінальних відповідей.
    </ParamField>
    <ParamField path="provider" type="string">
      Ідентифікатор провайдера мовлення. Якщо його не задано, OpenClaw використовує першого налаштованого провайдера відповідно до порядку автоматичного вибору в реєстрі. Застарілий `provider: "edge"` замінюється на `"microsoft"` за допомогою `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Ідентифікатор активної персони з `personas`. Нормалізується до нижнього регістру.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Стабільна голосова ідентичність. Поля: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Див. [Персони](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Недорога модель для автоматичного підсумовування; за замовчуванням `agents.defaults.model.primary`. Приймає `provider/model` або налаштований псевдонім моделі.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Дозволяє моделі створювати директиви TTS. Значення `enabled` за замовчуванням — `true`; значення `allowProvider` за замовчуванням — `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Налаштування, якими керує провайдер і які індексуються за ідентифікатором провайдера мовлення. Застарілі безпосередні блоки (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) переписуються за допомогою `openclaw doctor --fix`; зберігайте лише `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Жорстке обмеження кількості символів у вхідних даних TTS. `/tts audio`, `tts.convert` і `tts.speak` завершуються помилкою в разі перевищення.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Час очікування запиту в мілісекундах. Значення `timeoutMs` для окремого виклику (інструмент агента, Gateway) має пріоритет, якщо його задано; інакше явно налаштоване `messages.tts.timeoutMs` має пріоритет над будь-яким стандартним значенням провайдера, заданим плагіном.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Перевизначає локальний шлях до JSON налаштувань (провайдер/обмеження/підсумовування). За замовчуванням `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Змінна середовища: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Регіон Azure Speech (наприклад, `eastus`). Змінна середовища: `AZURE_SPEECH_REGION` або `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Необов’язкове перевизначення кінцевої точки Azure Speech (псевдонім `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName голосу Azure. За замовчуванням `en-US-JennyNeural`. Застарілий псевдонім: `voice`.</ParamField>
    <ParamField path="lang" type="string">Код мови SSML. За замовчуванням `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` для стандартного аудіо. За замовчуванням `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` для виведення голосових повідомлень. За замовчуванням `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Як резерв використовує `ELEVENLABS_API_KEY` або `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі. За замовчуванням `eleven_multilingual_v2`. Застарілі ідентифікатори `eleven_turbo_v2_5`/`eleven_turbo_v2` нормалізуються до відповідної моделі `flash`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Ідентифікатор голосу ElevenLabs. За замовчуванням `pMsXgVXv3BLzUgSXRplE`. Застарілий псевдонім: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (кожне `0..1`, стандартні значення `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, стандартне значення `true`), `speed` (`0.5..2.0`, стандартне значення `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Режим нормалізації тексту.</ParamField>
    <ParamField path="languageCode" type="string">Дволітерний код ISO 639-1 (наприклад, `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Ціле число `0..4294967295` для детермінованості за принципом докладання максимальних зусиль.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначає базову URL-адресу API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Якщо значення не задано, використовуються `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Якщо параметр пропущено, TTS може повторно використати `models.providers.google.apiKey` перед використанням змінної середовища.</ParamField>
    <ParamField path="model" type="string">Модель Gemini TTS. Типове значення — `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Назва готового голосу Gemini. Типове значення — `Kore`. Застарілі псевдоніми: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Опис стилю природною мовою, який додається перед озвучуваним текстом.</ParamField>
    <ParamField path="speakerName" type="string">Необов’язкова позначка мовця, яка додається перед озвучуваним текстом, якщо у запиті використовується іменований мовець.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Установіть значення `audio-profile-v1`, щоб обгорнути активні поля запиту персони в детерміновану структуру запиту Gemini TTS.</ParamField>
    <ParamField path="personaPrompt" type="string">Додатковий текст запиту персони для Google, який додається до режисерських приміток шаблону.</ParamField>
    <ParamField path="baseUrl" type="string">Приймається лише `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Змінна середовища: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">URL-адреса Gradium API через HTTPS на `api.gradium.ai`. Типове значення — `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Типове значення — Emma (`YTpq7expH9539ERJ`). Застарілий псевдонім: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Основний Inworld

    <ParamField path="apiKey" type="string">Змінна середовища: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типове значення — `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Типове значення — `inworld-tts-1.5-max`. Також: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Типове значення — `Sarah`. Застарілий псевдонім: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Температура вибірки `0..2` (за винятком 0).</ParamField>

  </Accordion>

  <Accordion title="Локальний CLI (tts-local-cli)">
    <ParamField path="command" type="string">Локальний виконуваний файл або рядок команди для TTS через CLI.</ParamField>
    <ParamField path="args" type="string[]">Аргументи команди. Підтримує заповнювачі `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Очікуваний формат виведення CLI. Типове значення для аудіовкладень — `mp3`.</ParamField>
    <ParamField path="timeoutMs" type="number">Час очікування команди в мілісекундах. Типове значення — `120000`.</ParamField>
    <ParamField path="cwd" type="string">Необов’язковий робочий каталог команди.</ParamField>
    <ParamField path="env" type="Record<string, string>">Необов’язкові перевизначення змінних середовища для команди.</ParamField>

    Стандартне виведення команди та створене або перетворене аудіо обмежені розміром 50 МіБ. Діагностичне стандартне виведення помилок обмежене розміром 1 МіБ. OpenClaw завершує команду та вважає синтез невдалим, якщо перевищено будь-яке з обмежень.

  </Accordion>

  <Accordion title="Microsoft (без ключа API)">
    <ParamField path="enabled" type="boolean" default="true">Дозволити використання синтезу мовлення Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Назва нейронного голосу Microsoft (наприклад, `en-US-MichelleNeural`). Застарілий псевдонім: `voice`. Якщо використовується типовий англійський голос, а в тексті відповіді переважають символи CJK, OpenClaw автоматично перемикається на `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Код мови (наприклад, `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Формат виведення Microsoft. Типове значення — `audio-24khz-48kbitrate-mono-mp3`. Вбудований транспорт на основі Edge підтримує не всі формати.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Рядки з відсотковими значеннями (наприклад, `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Записувати субтитри JSON поруч з аудіофайлом.</ParamField>
    <ParamField path="proxy" type="string">URL-адреса проксі для запитів синтезу мовлення Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Перевизначення часу очікування запиту (мс).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Застарілий псевдонім. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію на `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Якщо значення не задано, використовується `MINIMAX_API_KEY`. Автентифікація Token Plan через `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` або `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типове значення — `https://api.minimax.io`. Змінна середовища: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Типове значення — `speech-2.8-hd`. Змінна середовища: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Типове значення — `English_expressive_narrator`. Змінна середовища: `MINIMAX_TTS_VOICE_ID`. Застарілий псевдонім: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Типове значення — `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Типове значення — `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Ціле число `-12..12`. Типове значення — `0`. Дробові значення перед запитом відкидаються.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Якщо значення не задано, використовується `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі OpenAI TTS. Типове значення — `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Назва голосу (наприклад, `alloy`, `cedar`). Типове значення — `coral`. Застарілий псевдонім: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Явне поле OpenAI `instructions`. Якщо його задано, поля запиту персони **не** зіставляються автоматично.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Додаткові поля JSON, які об’єднуються з тілами запитів `/audio/speech` після згенерованих полів OpenAI TTS. Використовуйте це для сумісних з OpenAI кінцевих точок, як-от Kokoro, що потребують специфічних для постачальника ключів на кшталт `lang`; небезпечні ключі прототипів ігноруються.</ParamField>
    <ParamField path="baseUrl" type="string">
      Перевизначає кінцеву точку OpenAI TTS. Порядок визначення: конфігурація → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Нетипові значення розглядаються як сумісні з OpenAI кінцеві точки TTS, тому приймаються власні назви моделей і голосів, а для `speed` вимикається перевірка діапазону `0.25..4.0`.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Змінна середовища: `OPENROUTER_API_KEY`. Може повторно використовувати `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Типове значення — `https://openrouter.ai/api/v1`. Застаріле значення `https://openrouter.ai/v1` нормалізується.</ParamField>
    <ParamField path="model" type="string">Типове значення — `hexgrad/kokoro-82m`. Псевдонім: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Типове значення — `af_alloy`. Застарілі псевдоніми: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Типове значення — `mp3`.</ParamField>
    <ParamField path="speed" type="number">Власне перевизначення швидкості постачальника.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Змінна середовища: `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Типове значення — `seed-tts-1.0`. Змінна середовища: `VOLCENGINE_TTS_RESOURCE_ID`. Використовуйте `seed-tts-2.0`, якщо ваш проєкт має право на TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Заголовок ключа застосунку. Типове значення — `aGjiRDfUWi`. Змінна середовища: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначає кінцеву точку HTTP для Seed Speech TTS. Змінна середовища: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Тип голосу. Типове значення — `en_female_anna_mars_bigtts`. Змінна середовища: `VOLCENGINE_TTS_VOICE`. Застарілий псевдонім: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Власний коефіцієнт швидкості постачальника, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Власна позначка емоції постачальника.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Застарілі поля Volcengine Speech Console. Змінні середовища: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (типове значення — `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Змінна середовища: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типове значення — `https://api.x.ai/v1`. Змінна середовища: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Типове значення — `eve`. За наявності автентифікації `openclaw infer tts voices --provider xai` отримує поточний вбудований каталог; без автентифікації виводить автономні резервні варіанти `ara`, `eve`, `leo`, `rex` і `sal`. Власні ідентифікатори голосів облікового запису передаються далі, навіть якщо їх немає у вбудованому списку. Застарілий псевдонім: `voiceId`.</ParamField>
    <ParamField path="language" type="string">Код мови BCP-47 або `auto`. Типове значення — `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Типове значення — `mp3`.</ParamField>
    <ParamField path="speed" type="number">Власне перевизначення швидкості постачальника, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Змінна середовища: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типове значення — `https://api.xiaomimimo.com/v1`. Змінна середовища: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Типове значення — `mimo-v2.5-tts`. Змінна середовища: `XIAOMI_TTS_MODEL`. Також підтримує `mimo-v2-tts` і `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Типове значення для моделей із попередньо заданими голосами — `mimo_default`. Змінна середовища: `XIAOMI_TTS_VOICE`. Застарілий псевдонім: `voice`. Не надсилається для `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Типове значення — `mp3`. Змінна середовища: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Необов’язкова інструкція щодо стилю природною мовою, яка надсилається як повідомлення користувача, але не озвучується. Для `mimo-v2.5-tts-voicedesign` це запит для створення голосу; якщо його пропущено, OpenClaw надає типове значення.</ParamField>
  </Accordion>
</AccordionGroup>

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення та повертає аудіовкладення для
доставлення відповіді. У Feishu, Matrix, Telegram і WhatsApp аудіо
доставляється як голосове повідомлення, а не як файлове вкладення. Feishu і
WhatsApp можуть перекодовувати виведення TTS не у форматі Opus на цьому шляху, коли
доступний `ffmpeg`.

WhatsApp надсилає аудіо через Baileys як голосову нотатку PTT (`audio` із
`ptt: true`) і надсилає видимий текст **окремо** від аудіо PTT, оскільки
клієнти не завжди відображають підписи до голосових нотаток.

Інструмент приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` — це
час очікування запиту до постачальника для окремого виклику в мілісекундах. Значення окремого виклику перевизначають
`messages.tts.timeoutMs`; налаштовані часи очікування TTS перевизначають будь-яке типове значення
постачальника, задане плагіном.

## RPC Gateway

| Метод            | Призначення                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | Читання поточного стану TTS і останньої спроби.     |
| `tts.enable`      | Установлення локального параметра автоматичного режиму на `always`.       |
| `tts.disable`     | Установлення локального параметра автоматичного режиму на `off`.          |
| `tts.convert`     | Одноразове перетворення тексту → аудіо.                        |
| `tts.setProvider` | Установлення локального бажаного постачальника.               |
| `tts.personas`    | Перелік налаштованих персон і активної персони. |
| `tts.setPersona`  | Установлення локальної бажаної персони.                |
| `tts.providers`   | Перелік налаштованих постачальників і їхнього стану.        |

## Посилання на сервіси

- [Посібник OpenAI із синтезу мовлення з тексту](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідник OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Синтез мовлення з тексту через Azure Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Постачальник Azure Speech](/uk/providers/azure-speech)
- [Синтез мовлення з тексту ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/uk/providers/gradium)
- [API TTS Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [HTTP API TTS Volcengine](/uk/providers/volcengine#text-to-speech)
- [Синтез мовлення Xiaomi MiMo](/uk/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Формати виведення Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Синтез мовлення з тексту xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Пов’язане

- [Огляд медіа](/uk/tools/media-overview)
- [Генерування музики](/uk/tools/music-generation)
- [Генерування відео](/uk/tools/video-generation)
- [Команди зі скісною рискою](/uk/tools/slash-commands)
- [Plugin голосових викликів](/uk/plugins/voice-call)
