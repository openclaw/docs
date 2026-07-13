---
read_when:
    - Включение преобразования текста в речь для ответов
    - Настройка провайдера TTS, цепочки резервных вариантов или персоны
    - Использование команд или директив /tts
sidebarTitle: Text to speech (TTS)
summary: Преобразование текста в речь для исходящих ответов — провайдеры, голосовые образы, слеш-команды и вывод для каждого канала
title: Преобразование текста в речь
x-i18n:
    generated_at: "2026-07-13T20:23:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 4ba17f56927507a73b5b116f5f13bb7b612b4ba7669f5ad240d5c96a6620c611
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw преобразует исходящие ответы в аудио с помощью **14 провайдеров синтеза речи**:
нативные голосовые сообщения в Feishu, Matrix, Telegram и WhatsApp; аудиовложения
во всех остальных случаях; а также потоки PCM/Ulaw для телефонии и Talk.

TTS — это отвечающая за речевой вывод часть режима `stt-tts` в Talk (`talk.speak` использует
тот же путь синтеза). В нативных для провайдера сеансах Talk `realtime` речь синтезируется
внутри провайдера реального времени; в сеансах `transcription` голосовой ответ
ассистента никогда не синтезируется.

## Быстрый старт

<Steps>
  <Step title="Выберите провайдера">
    OpenAI и ElevenLabs — наиболее надёжные облачные варианты. Microsoft и
    локальный CLI работают без ключа API. Полный список см. в [матрице провайдеров](#supported-providers).
  </Step>
  <Step title="Задайте ключ API">
    Экспортируйте переменную среды для своего провайдера (например, `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Для Microsoft и локального CLI ключ не нужен.
  </Step>
  <Step title="Включите в конфигурации">
    Задайте `messages.tts.auto: "always"` и `messages.tts.provider`:

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
  <Step title="Попробуйте в чате">
    `/tts status` показывает текущее состояние. `/tts audio Hello from OpenClaw`
    отправляет однократный аудиоответ.
  </Step>
</Steps>

<Note>
Автоматический TTS **отключён** по умолчанию. Если `messages.tts.provider` не задан,
OpenClaw выбирает первого настроенного провайдера в порядке автоматического выбора из реестра.
Встроенный агентский инструмент `tts` используется только при явно выраженном намерении: обычный чат остаётся
текстовым, если пользователь не запросит аудио, не использует `/tts` или не включит автоматический TTS либо
синтез речи посредством директивы.
</Note>

## Поддерживаемые провайдеры

| Провайдер         | Аутентификация                                                                                                  | Примечания                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (также `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)       | Нативный вывод голосовых сообщений Ogg/Opus и телефония.                                           |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS, совместимый с OpenAI. По умолчанию используется `hexgrad/Kokoro-82M`.                           |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` или `XI_API_KEY`                                                                       | Клонирование голоса, многоязычность, детерминированность через `seed`; потоковая передача для воспроизведения голоса в Discord. |
| **Google Gemini** | `GEMINI_API_KEY` или `GOOGLE_API_KEY`                                                                       | Пакетный TTS через Gemini API; учитывает персону через `promptTemplate: "audio-profile-v1"`.                           |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                              | Вывод голосовых сообщений и телефония.                                                             |
| **Inworld**       | `INWORLD_API_KEY`                                                                                              | Потоковый API TTS. Нативные голосовые сообщения Opus и телефония PCM.                               |
| **Локальный CLI** | нет                                                                                                              | Запускает настроенную локальную команду TTS.                                                       |
| **Microsoft**     | нет                                                                                                              | Общедоступный нейронный TTS Edge через `node-edge-tts`. Предоставляется по мере возможности, без SLA. |
| **MiniMax**       | `MINIMAX_API_KEY` (или Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)                  | API T2A v2. По умолчанию используется `speech-2.8-hd`.                                          |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                              | Также используется для автоматического резюмирования; поддерживает персону `instructions`.      |
| **OpenRouter**    | `OPENROUTER_API_KEY` (можно повторно использовать `models.providers.openrouter.apiKey`)                                              | Модель по умолчанию — `hexgrad/kokoro-82m`.                                                          |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` или `BYTEPLUS_SEED_SPEECH_API_KEY` (устаревшие AppID/токен: `VOLCENGINE_TTS_APPID`/`_TOKEN`)       | HTTP API BytePlus Seed Speech.                                                                     |
| **Vydra**         | `VYDRA_API_KEY`                                                                                              | Общий провайдер изображений, видео и речи.                                                         |
| **xAI**           | `XAI_API_KEY`                                                                                              | Пакетный TTS xAI. Нативные голосовые сообщения Opus **не** поддерживаются.                          |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                              | TTS MiMo через дополнения чата Xiaomi.                                                             |

Если настроено несколько провайдеров, сначала используется выбранный, а
остальные служат резервными вариантами. Для автоматического резюмирования используется `summaryModel` (или
`agents.defaults.model.primary`), поэтому этот провайдер также должен быть аутентифицирован,
если резюмирование остаётся включённым.

<Warning>
Встроенный провайдер **Microsoft** использует онлайн-службу нейронного TTS Microsoft Edge
через `node-edge-tts`. Это общедоступная веб-служба без опубликованных
SLA или квоты — рассчитывайте только на предоставление по мере возможности. Устаревший идентификатор провайдера `edge`
нормализуется в `microsoft`, а `openclaw doctor --fix` перезаписывает сохранённую
конфигурацию; в новых конфигурациях всегда следует использовать `microsoft`.
</Warning>

## Конфигурация

Конфигурация TTS находится в разделе `messages.tts` файла `~/.openclaw/openclaw.json`. Выберите
предустановку и адаптируйте блок провайдера. Показанные ниже поля `speakerVoice`/`speakerVoiceId`
являются каноническими; собственные имена полей `voice`/`voiceId`/
`voiceName` каждого провайдера по-прежнему работают как устаревшие псевдонимы.

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
          // Необязательные подсказки по стилю на естественном языке:
          // audioProfile: "Говори спокойным тоном ведущего подкаста.",
          // speakerName: "Алекс",
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
  <Tab title="Локальный CLI">
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

Для Xiaomi `mimo-v2.5-tts-voicedesign` не указывайте `speakerVoice` и задайте в `style`
подсказку для проектирования голоса. OpenClaw отправляет эту подсказку как сообщение TTS `user`
и не отправляет `audio.voice` для модели voicedesign.

### Переопределение голоса для отдельных агентов

Используйте `agents.list[].tts`, если один агент должен говорить с другим провайдером,
голосом, моделью, персоной или режимом автоматического TTS. Блок агента глубоко объединяется поверх
`messages.tts`, поэтому учётные данные провайдера могут оставаться в глобальной конфигурации провайдера:

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

Чтобы закрепить персону за отдельным агентом, задайте `agents.list[].tts.persona` вместе с конфигурацией
провайдера — это переопределяет глобальное значение `messages.tts.persona` только для этого агента.

Порядок приоритетов для автоматических ответов, `/tts audio`, `/tts status` и
инструмента агента `tts`:

1. `messages.tts`
2. активный `agents.list[].tts`
3. переопределение канала, если канал поддерживает `channels.<channel>.tts`
4. переопределение учётной записи, если канал передаёт `channels.<channel>.accounts.<id>.tts`
5. локальные настройки `/tts` для этого хоста
6. встроенные директивы `[[tts:...]]`, если включены [переопределения, задаваемые моделью](#model-driven-directives)

Переопределения канала и учётной записи имеют ту же структуру, что и `messages.tts`, и
глубоко объединяются поверх предыдущих уровней, поэтому общие учётные данные провайдера могут оставаться в
`messages.tts`, а канал или учётная запись бота изменяет только голос диктора, модель, персону
или автоматический режим:

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

## Персоны

**Персона** — это стабильная речевая идентичность, которую можно детерминированно
применять к разным провайдерам. Она может отдавать предпочтение одному провайдеру, задавать
независимый от провайдера замысел запроса и содержать привязки для конкретных провайдеров:
голоса, модели, шаблоны запросов, начальные значения и настройки голоса.

### Минимальная персона

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

### Полная персона (независимый от провайдера запрос)

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

### Определение персоны

Активная персона выбирается детерминированно:

1. Локальная настройка `/tts persona <id>`, если задана.
2. `messages.tts.persona`, если задана.
3. Без персоны.

При выборе провайдера явные настройки имеют приоритет:

1. Прямые переопределения (CLI, Gateway, Talk, разрешённые директивы TTS).
2. Локальная настройка `/tts provider <id>`.
3. `provider` активной персоны.
4. `messages.tts.provider`.
5. Автоматический выбор из реестра.

Для каждой попытки обращения к провайдеру OpenClaw объединяет конфигурации в следующем порядке:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Доверенные переопределения запроса
4. Разрешённые переопределения из директив TTS, созданных моделью

### Как провайдеры используют запросы персоны

Поля запроса персоны (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) **не зависят от провайдера**. Каждый провайдер сам решает, как
их использовать:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Оборачивает поля запроса персоны в структуру запроса Gemini TTS **только тогда**,
    когда в действующей конфигурации провайдера Google задано `promptTemplate: "audio-profile-v1"`
    или `personaPrompt`. Более старые поля `audioProfile` и `speakerName`
    по-прежнему добавляются в начало как текст запроса, специфичный для Google. Встроенные аудиотеги, такие как
    `[whispers]` или `[laughs]`, внутри блока `[[tts:text]]` сохраняются
    в расшифровке Gemini; OpenClaw не создаёт эти теги.
  </Accordion>
  <Accordion title="OpenAI">
    Сопоставляет поля запроса персоны с полем запроса `instructions` **только тогда**,
    когда не настроено явное значение OpenAI `instructions`. Явное значение `instructions`
    всегда имеет приоритет.
  </Accordion>
  <Accordion title="Другие провайдеры">
    Используют только привязки персоны для конкретного провайдера в
    `personas.<id>.providers.<provider>`. Поля запроса персоны игнорируются,
    если провайдер не реализует собственное сопоставление запросов персоны.
  </Accordion>
</AccordionGroup>

### Политика резервного переключения

`fallbackPolicy` управляет поведением, когда у персоны **нет привязки** для
провайдера, к которому выполняется попытка обращения:

| Политика            | Поведение                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **По умолчанию.** Независимые от провайдера поля запроса остаются доступными; провайдер может использовать или игнорировать их.                    |
| `provider-defaults` | Персона исключается из подготовки запроса для этой попытки; провайдер использует нейтральные значения по умолчанию, пока продолжается резервное переключение на другие провайдеры. |
| `fail`              | Пропустить попытку обращения к этому провайдеру с `reasonCode: "not_configured"` и `personaBinding: "missing"`. Резервные провайдеры всё равно будут опробованы.              |

Весь запрос TTS завершается ошибкой, только если **каждый** опробованный провайдер был пропущен
или завершился ошибкой.

Выбор провайдера сеанса Talk действует в пределах сеанса. Клиент Talk должен выбирать
идентификаторы провайдеров, моделей, голосов и локали из `talk.catalog` и передавать
их через запрос сеанса Talk или передачи управления. Открытие голосового сеанса не должно
изменять `messages.tts` или глобальные значения провайдера Talk по умолчанию.

## Директивы, задаваемые моделью

По умолчанию ассистент **может** создавать директивы `[[tts:...]]`, чтобы переопределить
голос, модель или скорость для одного ответа, а также необязательный
блок `[[tts:text]]...[[/tts:text]]` для выразительных указаний, которые должны присутствовать
только в аудио:

```text
Вот, пожалуйста.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](смеётся) Прочитай песню ещё раз.[[/tts:text]]
```

Когда `messages.tts.auto` имеет значение `"tagged"`, для запуска аудио **требуются директивы**.
При потоковой доставке блоков директивы удаляются из видимого текста до того, как
канал его получит, даже если они разделены между соседними блоками.

`provider=...` игнорируется, если не задано `modelOverrides.allowProvider: true`. Когда
ответ объявляет `provider=...`, остальные ключи этой директивы анализируются
только этим провайдером; неподдерживаемые ключи удаляются и регистрируются как
предупреждения директив TTS.

**Доступные ключи директив:**

- `provider` (идентификатор зарегистрированного провайдера; требуется `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (устаревшие псевдонимы: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (громкость MiniMax, `(0, 10]`)
- `pitch` (целочисленная высота тона MiniMax, от −12 до 12; дробные значения усекаются)
- `emotion` (тег эмоции Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Полностью отключить переопределения модели:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Разрешить переключение провайдеров, сохранив возможность настройки остальных параметров:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Команды с косой чертой

Единая команда `/tts`. В Discord OpenClaw также регистрирует `/voice`, поскольку
`/tts` — встроенная команда Discord; текстовая команда `/tts ...` по-прежнему работает.

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
Для команд требуется авторизованный отправитель (применяются правила списка разрешённых отправителей/владельца), а также
должно быть включено `commands.text` или регистрация нативных команд.
</Note>

Примечания о поведении:

- `/tts on` записывает локальную настройку TTS в `always`; `/tts off` записывает её в `off`.
- `/tts chat on|off|default` записывает действующее в пределах сеанса переопределение автоматического TTS для текущего чата.
- `/tts persona <id>` записывает локальную настройку персоны; `/tts persona off` очищает её.
- `/tts latest` читает последний ответ ассистента из расшифровки текущего сеанса и однократно отправляет его как аудио. В записи сеанса сохраняется только хеш этого ответа, чтобы предотвращать повторную отправку голосового сообщения.
- `/tts audio` создаёт однократный аудиоответ (и **не** включает TTS).
- `/tts limit <chars>` принимает значения **100–4096** (4096 — максимальная длина подписи/сообщения в Telegram); значения вне этого диапазона отклоняются.
- `limit` и `summary` сохраняются в **локальных настройках**, а не в основной конфигурации.
- `/tts status` включает диагностику резервного переключения для последней попытки — `Fallback: <primary> -> <used>`, `Attempts: ...` и подробности каждой попытки (`provider:outcome(reasonCode) latency`).
- `/status` показывает активный режим TTS, а также настроенные провайдер, модель, голос и очищенные метаданные пользовательской конечной точки, когда TTS включён.

## Пользовательские настройки

Команды с косой чертой записывают локальные переопределения в `prefsPath`. Значение по умолчанию —
`~/.openclaw/settings/tts.json`; его можно переопределить с помощью переменной окружения `OPENCLAW_TTS_PREFS`
или `messages.tts.prefsPath`.

| Сохраняемое поле | Эффект                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | Локальное переопределение автоматического TTS (`always`, `off`, …)                                     |
| `provider`   | Локальное переопределение основного провайдера                                                  |
| `persona`    | Локальное переопределение персоны                                                           |
| `maxLength`  | Порог суммаризации/усечения (по умолчанию `1500` символов, диапазон `/tts limit`: 100–4096) |
| `summarize`  | Переключатель суммаризации (по умолчанию `true`)                                                  |

Они переопределяют итоговую конфигурацию из `messages.tts` вместе с активным
блоком `agents.list[].tts` для данного хоста.

## Форматы вывода

Передача озвучки TTS определяется возможностями канала. Плагины каналов объявляют,
следует ли для озвучки в стиле голосового сообщения запрашивать у провайдеров нативный целевой формат `voice-note` или
использовать обычный синтез `audio-file`, а также должен ли канал перекодировать
вывод в ненативном формате перед отправкой.

| Цель                                  | Формат                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Для ответов в виде голосовых сообщений предпочтителен **Opus** (`opus_48000_64` от ElevenLabs, `opus` от OpenAI). 48 кГц / 64 кбит/с обеспечивают баланс разборчивости и размера. |
| Другие каналы                         | **MP3** (`mp3_44100_128` от ElevenLabs, `mp3` от OpenAI). 44,1 кГц / 128 кбит/с — стандартный баланс для речи.                  |
| Разговор / телефония                  | Нативный для провайдера **PCM** (Inworld 22050 Гц, Google 24 кГц) или `ulaw_8000` от Gradium для телефонии.                                 |

Примечания по провайдерам:

- **Перекодирование в Feishu / WhatsApp:** когда ответ в виде голосового сообщения поступает как MP3/WebM/WAV/M4A или другой вероятный аудиофайл, плагин канала перед отправкой нативного голосового сообщения перекодирует его в Ogg/Opus с частотой 48 кГц при помощи `ffmpeg` (`libopus`, 64 кбит/с). WhatsApp отправляет результат через полезную нагрузку Baileys `audio` с `ptt: true` и `audio/ogg; codecs=opus`. При ошибке перекодирования Feishu перехватывает ошибку и отправляет исходный файл как обычное вложение; у WhatsApp резервного варианта нет, поэтому сама отправка завершается ошибкой вместо публикации несовместимой полезной нагрузки PTT.
- **MiniMax:** MP3 (модель `speech-2.8-hd`, частота дискретизации 32 кГц) для обычных аудиовложений; для целевых голосовых сообщений, объявленных каналом, перекодируется в Opus с частотой 48 кГц при помощи `ffmpeg`.
- **Xiaomi MiMo:** по умолчанию MP3 или WAV при соответствующей настройке; для целевых голосовых сообщений, объявленных каналом, перекодируется в Opus с частотой 48 кГц при помощи `ffmpeg`.
- **Локальный CLI:** использует настроенный `outputFormat`. Целевые голосовые сообщения преобразуются в Ogg/Opus, а вывод для телефонии — в необработанный монофонический PCM с частотой 16 кГц при помощи `ffmpeg`.
- **Google Gemini:** возвращает необработанный PCM с частотой 24 кГц. OpenClaw упаковывает его в WAV для аудиовложений, перекодирует в Opus с частотой 48 кГц для целевых голосовых сообщений и возвращает PCM напрямую для разговора/телефонии.
- **Gradium:** WAV для аудиовложений, Opus для целевых голосовых сообщений и `ulaw_8000` с частотой 8 кГц для телефонии.
- **Inworld:** MP3 для обычных аудиовложений, нативный `OGG_OPUS` для целевых голосовых сообщений и необработанный `PCM` с частотой 22050 Гц для разговора/телефонии.
- **xAI:** по умолчанию MP3; для синтеза аудиофайлов могут использоваться `mp3`, `wav`, `pcm`, `mulaw` или `alaw` как для буферизованного, так и для потокового вывода. Для целевых голосовых сообщений используется MP3 при потоковой передаче и буферизованном резервном варианте, поскольку выходные данные xAI в форматах `pcm`, `mulaw` и `alaw` представляют собой необработанное аудио без заголовков. Буферизованный синтез использует пакетную конечную точку REST xAI `/v1/tts`; `textToSpeechStream` использует нативный `wss://api.x.ai/v1/tts`. Это не контракт голосовой связи в реальном времени. Нативный формат голосовых сообщений Opus не поддерживается.
- **Microsoft:** использует `microsoft.outputFormat` (по умолчанию `audio-24khz-48kbitrate-mono-mp3`).
  - Встроенный транспорт принимает `outputFormat`, но сервис предоставляет не все форматы.
  - Значения формата вывода соответствуют форматам вывода Microsoft Speech (включая Ogg/WebM Opus).
  - Telegram `sendVoice` принимает OGG/MP3/M4A; используйте OpenAI/ElevenLabs, если необходимы гарантированные голосовые сообщения в формате Opus.
  - Если настроенный формат вывода Microsoft не работает, OpenClaw повторяет попытку с MP3.
  - Если явное переопределение голоса не задано и используется стандартный английский голос, OpenClaw автоматически переключается на китайский нейронный голос (`zh-CN-XiaoxiaoNeural`, локаль `zh-CN`), если в тексте ответа преобладают символы CJK.

Форматы вывода OpenAI и ElevenLabs фиксированы для каждого канала, как указано выше.

## Поведение автоматического TTS

Когда включён `messages.tts.auto`, OpenClaw:

- Пропускает TTS, если ответ уже содержит структурированные медиафайлы.
- Пропускает очень короткие ответы (менее 10 символов).
- Суммирует длинные ответы, если суммирование включено, используя
  `summaryModel` (или `agents.defaults.model.primary`).
- Прикрепляет сгенерированное аудио к ответу.
- В `mode: "final"` после завершения текстового потока по-прежнему отправляет
  только аудио TTS для потоковых финальных ответов; сгенерированный медиафайл проходит
  ту же нормализацию медиафайлов канала, что и обычные вложения ответа.

Если ответ превышает `maxLength`, OpenClaw никогда не пропускает аудио полностью:

- **Суммирование включено** (по умолчанию) и модель суммирования доступна:
  суммирует текст примерно до `maxLength` символов, затем синтезирует сводку.
- **Суммирование выключено**, суммирование завершается с ошибкой или для модели
  суммирования отсутствует ключ API: обрезает текст до `maxLength` символов и
  синтезирует обрезанный текст.

```text
Ответ -> TTS включён?
  нет -> отправить текст
  да  -> есть медиафайл / ответ короткий?
          да  -> отправить текст
          нет -> длина > лимита?
                   нет -> TTS -> прикрепить аудио
                   да  -> суммирование включено и доступно?
                            нет -> обрезать -> TTS -> прикрепить аудио
                            да  -> суммировать -> TTS -> прикрепить аудио
```

## Справочник полей

<AccordionGroup>
  <Accordion title="Верхнеуровневые параметры messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Режим автоматического TTS. `inbound` отправляет аудио только после входящего голосового сообщения; `tagged` отправляет аудио только тогда, когда ответ содержит директивы `[[tts:...]]` или блок `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Устаревший переключатель. `openclaw doctor --fix` переносит его в `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` включает ответы инструментов и блоков в дополнение к финальным ответам.
    </ParamField>
    <ParamField path="provider" type="string">
      Идентификатор поставщика синтеза речи. Если значение не задано, OpenClaw использует первого настроенного поставщика в порядке автоматического выбора из реестра. Устаревший `provider: "edge"` заменяется на `"microsoft"` с помощью `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Идентификатор активной персоны из `personas`. Нормализуется в нижний регистр.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Стабильная речевая идентичность. Поля: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. См. [Персоны](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Недорогая модель для автоматического суммирования; по умолчанию `agents.defaults.model.primary`. Принимает `provider/model` или настроенный псевдоним модели.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Разрешает модели выдавать директивы TTS. Значение `enabled` по умолчанию — `true`; значение `allowProvider` по умолчанию — `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Настройки, принадлежащие поставщику и индексируемые по идентификатору поставщика синтеза речи. Устаревшие непосредственные блоки (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) преобразуются с помощью `openclaw doctor --fix`; сохраняйте только `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Жёсткое ограничение количества символов во входных данных TTS. `/tts audio`, `tts.convert` и `tts.speak` завершаются с ошибкой при его превышении.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Тайм-аут запроса в миллисекундах. Если для отдельного вызова задан `timeoutMs` (инструмент агента, Gateway), используется он; в противном случае явно настроенный `messages.tts.timeoutMs` имеет приоритет над любым значением по умолчанию поставщика, заданным плагином.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Переопределяет локальный путь к JSON-файлу настроек (поставщик/ограничение/суммирование). По умолчанию `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Переменная среды: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` или `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Регион Azure Speech (например, `eastus`). Переменная среды: `AZURE_SPEECH_REGION` или `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Необязательное переопределение конечной точки Azure Speech (псевдоним `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName голоса Azure. По умолчанию `en-US-JennyNeural`. Устаревший псевдоним: `voice`.</ParamField>
    <ParamField path="lang" type="string">Код языка SSML. По умолчанию `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` для стандартного аудио. По умолчанию `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` для вывода голосовых заметок. По умолчанию `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">При отсутствии значения использует `ELEVENLABS_API_KEY` или `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Идентификатор модели. По умолчанию `eleven_multilingual_v2`. Устаревшие идентификаторы `eleven_turbo_v2_5`/`eleven_turbo_v2` нормализуются в соответствующую модель `flash`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Идентификатор голоса ElevenLabs. По умолчанию `pMsXgVXv3BLzUgSXRplE`. Устаревший псевдоним: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (каждое — `0..1`, значения по умолчанию — `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, по умолчанию `true`), `speed` (`0.5..2.0`, по умолчанию `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Режим нормализации текста.</ParamField>
    <ParamField path="languageCode" type="string">Двухбуквенный код ISO 639-1 (например, `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Целое число `0..4294967295` для обеспечения детерминизма по мере возможности.</ParamField>
    <ParamField path="baseUrl" type="string">Переопределяет базовый URL API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">При отсутствии значения используются `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Если параметр не задан, TTS может повторно использовать `models.providers.google.apiKey`, прежде чем обращаться к переменным окружения.</ParamField>
    <ParamField path="model" type="string">Модель Gemini TTS. По умолчанию `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Имя встроенного голоса Gemini. По умолчанию `Kore`. Устаревшие псевдонимы: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Текстовая инструкция по стилю на естественном языке, добавляемая перед произносимым текстом.</ParamField>
    <ParamField path="speakerName" type="string">Необязательная метка говорящего, добавляемая перед произносимым текстом, если в инструкции используется именованный говорящий.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Укажите `audio-profile-v1`, чтобы заключить поля инструкции активной персоны в детерминированную структуру инструкции Gemini TTS.</ParamField>
    <ParamField path="personaPrompt" type="string">Дополнительный текст инструкции персоны для Google, добавляемый к режиссёрским примечаниям шаблона.</ParamField>
    <ParamField path="baseUrl" type="string">Допускается только `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Переменная окружения: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">URL API Gradium по HTTPS на `api.gradium.ai`. По умолчанию `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">По умолчанию Emma (`YTpq7expH9539ERJ`). Устаревший псевдоним: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Основной Inworld

    <ParamField path="apiKey" type="string">Переменная окружения: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">По умолчанию `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">По умолчанию `inworld-tts-1.5-max`. Также: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">По умолчанию `Sarah`. Устаревший псевдоним: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Температура сэмплирования `0..2` (не включая 0).</ParamField>

  </Accordion>

  <Accordion title="Локальный CLI (tts-local-cli)">
    <ParamField path="command" type="string">Локальный исполняемый файл или строка команды для TTS через CLI.</ParamField>
    <ParamField path="args" type="string[]">Аргументы команды. Поддерживаются заполнители `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Ожидаемый формат вывода CLI. По умолчанию `mp3` для звуковых вложений.</ParamField>
    <ParamField path="timeoutMs" type="number">Время ожидания команды в миллисекундах. По умолчанию `120000`.</ParamField>
    <ParamField path="cwd" type="string">Необязательный рабочий каталог команды.</ParamField>
    <ParamField path="env" type="Record<string, string>">Необязательные переопределения переменных окружения для команды.</ParamField>

    Размер стандартного вывода команды и созданного или преобразованного аудио ограничен 50 МиБ. Размер диагностического стандартного потока ошибок ограничен 1 МиБ. При превышении любого из ограничений OpenClaw завершает команду и синтез оканчивается ошибкой.

  </Accordion>

  <Accordion title="Microsoft (без ключа API)">
    <ParamField path="enabled" type="boolean" default="true">Разрешить использование синтеза речи Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Имя нейросетевого голоса Microsoft (например, `en-US-MichelleNeural`). Устаревший псевдоним: `voice`. Если используется стандартный английский голос, а в тексте ответа преобладают символы CJK, OpenClaw автоматически переключается на `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Код языка (например, `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Формат вывода Microsoft. По умолчанию `audio-24khz-48kbitrate-mono-mp3`. Встроенный транспорт на базе Edge поддерживает не все форматы.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Строки с процентными значениями (например, `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Записывать субтитры JSON рядом с аудиофайлом.</ParamField>
    <ParamField path="proxy" type="string">URL прокси-сервера для запросов синтеза речи Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Переопределение времени ожидания запроса (мс).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Устаревший псевдоним. Выполните `openclaw doctor --fix`, чтобы преобразовать сохранённую конфигурацию в `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">При отсутствии значения используется `MINIMAX_API_KEY`. Авторизация Token Plan через `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` или `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">По умолчанию `https://api.minimax.io`. Переменная окружения: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">По умолчанию `speech-2.8-hd`. Переменная окружения: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">По умолчанию `English_expressive_narrator`. Переменная окружения: `MINIMAX_TTS_VOICE_ID`. Устаревший псевдоним: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. По умолчанию `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. По умолчанию `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Целое число `-12..12`. По умолчанию `0`. Дробные значения перед запросом усекаются.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">При отсутствии значения используется `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Идентификатор модели OpenAI TTS. По умолчанию `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Имя голоса (например, `alloy`, `cedar`). По умолчанию `coral`. Устаревший псевдоним: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Явное поле OpenAI `instructions`. Если оно задано, поля инструкции персоны **не** сопоставляются автоматически.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Дополнительные поля JSON, объединяемые с телами запросов `/audio/speech` после сгенерированных полей OpenAI TTS. Используйте их для совместимых с OpenAI конечных точек, например Kokoro, которым требуются специфичные для поставщика ключи, такие как `lang`; небезопасные ключи прототипа игнорируются.</ParamField>
    <ParamField path="baseUrl" type="string">
      Переопределяет конечную точку OpenAI TTS. Порядок разрешения: конфигурация → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Значения, отличные от стандартного, рассматриваются как совместимые с OpenAI конечные точки TTS, поэтому допускаются пользовательские имена моделей и голосов, а для `speed` больше не проверяется диапазон `0.25..4.0`.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Переменная окружения: `OPENROUTER_API_KEY`. Можно повторно использовать `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">По умолчанию `https://openrouter.ai/api/v1`. Устаревшее значение `https://openrouter.ai/v1` нормализуется.</ParamField>
    <ParamField path="model" type="string">По умолчанию `hexgrad/kokoro-82m`. Псевдоним: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">По умолчанию `af_alloy`. Устаревшие псевдонимы: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>По умолчанию `mp3`.</ParamField>
    <ParamField path="speed" type="number">Переопределение скорости в собственном формате поставщика.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Переменная окружения: `VOLCENGINE_TTS_API_KEY` или `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">По умолчанию `seed-tts-1.0`. Переменная окружения: `VOLCENGINE_TTS_RESOURCE_ID`. Используйте `seed-tts-2.0`, если в вашем проекте предоставлено право на TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Заголовок ключа приложения. По умолчанию `aGjiRDfUWi`. Переменная окружения: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Переопределяет конечную точку HTTP Seed Speech TTS. Переменная окружения: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Тип голоса. По умолчанию `en_female_anna_mars_bigtts`. Переменная окружения: `VOLCENGINE_TTS_VOICE`. Устаревший псевдоним: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Коэффициент скорости в собственном формате поставщика, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Тег эмоции в собственном формате поставщика.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Устаревшие поля Volcengine Speech Console. Переменные окружения: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (по умолчанию `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Переменная окружения: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">По умолчанию `https://api.x.ai/v1`. Переменная окружения: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">По умолчанию `eve`. При наличии авторизации `openclaw infer tts voices --provider xai` получает текущий встроенный каталог; без авторизации выводится список автономных резервных вариантов: `ara`, `eve`, `leo`, `rex` и `sal`. Идентификаторы пользовательских голосов учётной записи передаются дальше, даже если их нет во встроенном списке. Устаревший псевдоним: `voiceId`.</ParamField>
    <ParamField path="language" type="string">Код языка BCP-47 или `auto`. По умолчанию `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>По умолчанию `mp3`.</ParamField>
    <ParamField path="speed" type="number">Переопределение скорости в собственном формате поставщика, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Переменная окружения: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">По умолчанию `https://api.xiaomimimo.com/v1`. Переменная окружения: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">По умолчанию `mimo-v2.5-tts`. Переменная окружения: `XIAOMI_TTS_MODEL`. Также поддерживаются `mimo-v2-tts` и `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">По умолчанию `mimo_default` для моделей с предустановленными голосами. Переменная окружения: `XIAOMI_TTS_VOICE`. Устаревший псевдоним: `voice`. Не отправляется для `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>По умолчанию `mp3`. Переменная окружения: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Необязательная инструкция по стилю на естественном языке, отправляемая как сообщение пользователя; она не произносится. Для `mimo-v2.5-tts-voicedesign` это инструкция по созданию голоса; если она не задана, OpenClaw предоставляет значение по умолчанию.</ParamField>
  </Accordion>
</AccordionGroup>

## Инструмент агента

Инструмент `tts` преобразует текст в речь и возвращает звуковое вложение для
доставки ответа. В Feishu, Matrix, Telegram и WhatsApp аудио
доставляется как голосовое сообщение, а не как вложенный файл. Feishu и
WhatsApp могут перекодировать вывод TTS не в формате Opus на этом пути, когда доступен
`ffmpeg`.

WhatsApp отправляет аудио через Baileys как голосовое сообщение PTT (`audio` с
`ptt: true`) и отправляет видимый текст **отдельно** от аудио PTT, поскольку
клиенты не всегда отображают подписи к голосовым сообщениям.

Инструмент принимает необязательные поля `channel` и `timeoutMs`; `timeoutMs` — это
время ожидания запроса к поставщику для отдельного вызова в миллисекундах. Значения отдельного вызова переопределяют
`messages.tts.timeoutMs`; настроенные значения времени ожидания TTS переопределяют любые стандартные
значения поставщика, заданные плагином.

## RPC Gateway

| Метод            | Назначение                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | Получить текущее состояние TTS и данные последней попытки.     |
| `tts.enable`      | Установить локальную настройку автоматического режима в значение `always`.       |
| `tts.disable`     | Установить локальную настройку автоматического режима в значение `off`.          |
| `tts.convert`     | Однократное преобразование текста в аудио.                        |
| `tts.setProvider` | Установить локальное предпочтение провайдера.               |
| `tts.personas`    | Вывести список настроенных персон и активную персону. |
| `tts.setPersona`  | Установить локальное предпочтение персоны.                |
| `tts.providers`   | Вывести список настроенных провайдеров и их состояние.        |

## Ссылки на сервисы

- [Руководство OpenAI по преобразованию текста в речь](https://platform.openai.com/docs/guides/text-to-speech)
- [Справочник по OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Преобразование текста в речь через Azure Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Провайдер Azure Speech](/ru/providers/azure-speech)
- [Преобразование текста в речь в ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Аутентификация в ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ru/providers/gradium)
- [API TTS от Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [HTTP API TTS от Volcengine](/ru/providers/volcengine#text-to-speech)
- [Синтез речи Xiaomi MiMo](/ru/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Форматы вывода Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Преобразование текста в речь в xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Связанные материалы

- [Обзор работы с медиа](/ru/tools/media-overview)
- [Генерация музыки](/ru/tools/music-generation)
- [Генерация видео](/ru/tools/video-generation)
- [Команды с косой чертой](/ru/tools/slash-commands)
- [Плагин голосовых вызовов](/ru/plugins/voice-call)
