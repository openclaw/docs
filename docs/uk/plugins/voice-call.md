---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
summary: 'Плагін Voice Call: вихідні + вхідні дзвінки через Twilio/Telnyx/Plivo (встановлення Plugin + конфігурація + CLI)'
title: Плагін Voice call
x-i18n:
    generated_at: "2026-04-24T21:43:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6d03153cf6ba1b4cd7cf2e4c0ffcdf96595363473b172b2d4b21b4100c20e3c
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (плагін)

Голосові дзвінки для OpenClaw через Plugin. Підтримує вихідні сповіщення та
багатокрокові розмови з вхідними політиками.

Поточні провайдери:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (розробка/без мережі)

Швидка ментальна модель:

- Встановіть Plugin
- Перезапустіть Gateway
- Налаштуйте в `plugins.entries.voice-call.config`
- Використовуйте `openclaw voicecall ...` або інструмент `voice_call`

## Де це працює (локально чи віддалено)

Plugin Voice Call працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, встановіть/налаштуйте Plugin на **машині, де запущено Gateway**, а потім перезапустіть Gateway, щоб він його завантажив.

## Встановлення

### Варіант A: встановлення з npm (рекомендовано)

```bash
openclaw plugins install @openclaw/voice-call
```

Після цього перезапустіть Gateway.

### Варіант B: встановлення з локальної папки (розробка, без копіювання)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Після цього перезапустіть Gateway.

## Конфігурація

Задайте конфігурацію в `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // або "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // або TWILIO_FROM_NUMBER для Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Публічний ключ webhook Telnyx з Telnyx Mission Control Portal
            // (рядок Base64; також можна задати через TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Сервер Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Безпека Webhook (рекомендовано для тунелів/проксі)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Публічне відкриття доступу (оберіть один варіант)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // необов’язково; якщо не задано — перший зареєстрований провайдер транскрипції в реальному часі
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // необов’язково, якщо задано OPENAI_API_KEY
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // необов’язково; якщо не задано — перший зареєстрований голосовий провайдер у реальному часі
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Примітки:

- Twilio/Telnyx потребують **публічно доступного** URL Webhook.
- Plivo потребує **публічно доступного** URL Webhook.
- `mock` — це локальний провайдер для розробки (без мережевих викликів).
- Якщо в старіших конфігураціях усе ще використовується `provider: "log"`, `twilio.from` або застарілі ключі OpenAI `streaming.*`, виконайте `openclaw doctor --fix`, щоб переписати їх.
- Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` — лише для локального тестування.
- Якщо ви використовуєте безкоштовний рівень ngrok, задайте `publicUrl` точно як URL ngrok; перевірка підпису завжди примусово увімкнена.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook-и Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` — це local loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL-адреси ngrok на безкоштовному рівні можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio не проходитимуть перевірку. Для продакшну надавайте перевагу стабільному домену або Tailscale funnel.
- `realtime.enabled` запускає повноцінні голосові розмови voice-to-voice; не вмикайте його разом із `streaming.enabled`.
- Типові налаштування безпеки для streaming:
  - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають коректний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до старту для кожної вихідної IP-адреси.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікування + активні).
- На рівні виконання резервна сумісність поки що все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а шар сумісності є тимчасовим.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного голосового провайдера реального часу для аудіо дзвінка вживу.
Він відокремлений від `streaming`, який лише пересилає аудіо провайдерам
транскрипції в реальному часі.

Поточна поведінка під час виконання:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.enabled` не можна поєднувати з `streaming.enabled`.
- `realtime.provider` — необов’язковий. Якщо не задано, Voice Call використовує першого
  зареєстрованого голосового провайдера реального часу.
- Вбудовані голосові провайдери реального часу включають Google Gemini Live (`google`) і
  OpenAI (`openai`), зареєстровані їхніми Plugin провайдерів.
- Власна сира конфігурація провайдера розміщується в `realtime.providers.<providerId>`.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або взагалі не зареєстровано
  жодного голосового провайдера реального часу, Voice Call записує попередження в журнал і пропускає
  медіа реального часу замість того, щоб зламати весь Plugin.

Типові значення для realtime Google Gemini Live:

- API-ключ: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` або
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

Приклад:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Говоріть коротко і питайте перед використанням інструментів.",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Натомість використайте OpenAI:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Див. [Google provider](/uk/providers/google) і [OpenAI provider](/uk/providers/openai)
для специфічних для провайдерів параметрів голосу в реальному часі.

## Транскрипція потокового аудіо

`streaming` вибирає провайдера транскрипції в реальному часі для аудіо дзвінка вживу.

Поточна поведінка під час виконання:

- `streaming.provider` — необов’язковий. Якщо не задано, Voice Call використовує першого
  зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі включають Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI
  (`xai`), зареєстровані їхніми Plugin провайдерів.
- Власна сира конфігурація провайдера розміщується в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або якщо взагалі не зареєстровано
  жодного провайдера транскрипції в реальному часі, Voice Call записує попередження в журнал і
  пропускає потокову передачу медіа замість того, щоб зламати весь Plugin.

Типові значення для потокової транскрипції OpenAI:

- API-ключ: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Типові значення для потокової транскрипції xAI:

- API-ключ: `streaming.providers.xai.apiKey` або `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Приклад:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // необов’язково, якщо задано OPENAI_API_KEY
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Натомість використайте xAI:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // необов’язково, якщо задано XAI_API_KEY
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Застарілі ключі все ще автоматично мігруються через `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Очищення застарілих дзвінків

Використовуйте `staleCallReaperSeconds`, щоб завершувати дзвінки, які ніколи не отримують фінальний webhook
(наприклад, дзвінки в режимі notify, які так і не завершуються). Типове значення — `0`
(вимкнено).

Рекомендовані діапазони:

- **Продакшн:** `120`–`300` секунд для сценаріїв у стилі notify.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні дзвінки могли
  завершитися. Хороша стартова точка — `maxDurationSeconds + 30–60` секунд.

Приклад:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Безпека Webhook

Коли перед Gateway знаходиться проксі або тунель, Plugin відновлює
публічний URL для перевірки підпису. Ці параметри визначають, яким переспрямованим
заголовкам довіряти.

`webhookSecurity.allowedHosts` задає список дозволених хостів із переспрямованих заголовків.

`webhookSecurity.trustForwardingHeaders` довіряє переспрямованим заголовкам без списку дозволених.

`webhookSecurity.trustedProxyIPs` довіряє переспрямованим заголовкам лише тоді, коли
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення webhook увімкнено для Twilio і Plivo. Повторно відтворені коректні webhook-
запити підтверджуються, але їхні побічні ефекти пропускаються.

Кроки розмови Twilio включають токен для кожного кроку в зворотних викликах `<Gather>`, тому
застарілі/повторно відтворені зворотні виклики мовлення не можуть задовольнити новіший очікуваний крок транскрипції.

Неавтентифіковані webhook-запити відхиляються ще до читання тіла, якщо відсутні
обов’язкові заголовки підпису провайдера.

Webhook voice-call використовує спільний профіль тіла до автентифікації (64 КБ / 5 секунд)
плюс обмеження кількості одночасних запитів на IP перед перевіркою підпису.

Приклад зі стабільним публічним хостом:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS для дзвінків

Voice Call використовує основну конфігурацію `messages.tts` для
потокового мовлення в дзвінках. Ви можете перевизначити її в конфігурації Plugin з
**тією самою структурою** — вона глибоко об’єднується з `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Примітки:

- Застарілі ключі `tts.<provider>` у конфігурації Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) автоматично мігруються до `tts.providers.<provider>` під час завантаження. У збереженій конфігурації надавайте перевагу структурі `providers`.
- **Microsoft speech ігнорується для голосових дзвінків** (телефонне аудіо потребує PCM; поточний транспорт Microsoft не надає телефонний вихід PCM).
- Основний TTS використовується, коли увімкнено потокову передачу медіа Twilio; інакше дзвінки повертаються до нативних голосів провайдера.
- Якщо медіапотік Twilio уже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS недоступний у цьому стані, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного провайдера, Voice Call записує попередження в журнал із ланцюгом провайдерів (`from`, `to`, `attempts`) для налагодження.

### Більше прикладів

Використовувати лише основний TTS (без перевизначення):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Перевизначити на ElevenLabs лише для дзвінків (зберегти основне значення за замовчуванням в інших місцях):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Перевизначити лише модель OpenAI для дзвінків (приклад глибокого об’єднання):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Вхідні дзвінки

Політика вхідних дзвінків за замовчуванням має значення `disabled`. Щоб увімкнути вхідні дзвінки, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Вітаю! Чим я можу допомогти?",
}
```

`inboundPolicy: "allowlist"` — це низькорівнева перевірка caller ID. Plugin
нормалізує надане провайдером значення `From` і порівнює його з `allowFrom`.
Перевірка Webhook автентифікує доставку провайдером і цілісність payload, але
не доводить право власності на номер абонента PSTN/VoIP. Сприймайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентифікацію абонента.

Автовідповіді використовують систему агентів. Налаштовуйте за допомогою:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт голосового виводу

Для автовідповідей Voice Call додає строгий контракт голосового виводу до системного промпту:

- `{"spoken":"..."}`

Потім Voice Call обережно витягує текст мовлення:

- Ігнорує payload, позначені як reasoning/error content.
- Розбирає прямий JSON, JSON у fenced-блоках або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й прибирає ймовірні вступні абзаци з плануванням/метаданими.

Це допомагає зосередити голосове відтворення на тексті для абонента й уникнути потрапляння тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків у режимі `conversation` обробка першого повідомлення прив’язана до стану відтворення в реальному часі:

- Очищення черги barge-in і автовідповідь пригнічуються лише поки активно відтворюється початкове привітання.
- Якщо початкове відтворення не вдається, дзвінок повертається в `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокової передачі Twilio починається під час підключення потоку без додаткової затримки.
- Голосові розмови в реальному часі використовують власний початковий хід realtime-потоку. Voice Call не надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` залишаються підключеними.

### Пільговий інтервал при відключенні потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає `2000ms`, перш ніж автоматично завершити дзвінок:

- Якщо потік знову підключається протягом цього вікна, авто-завершення скасовується.
- Якщо після завершення пільгового інтервалу потік не буде повторно зареєстрований, дзвінок завершується, щоб запобігти зависанню активних дзвінків.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # псевдонім для call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # підсумувати затримку ходів із журналів
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху зберігання voice-call. Використовуйте
`--file <path>`, щоб вказати інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід включає p50/p90/p99 для
затримки ходів і часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`

Дії:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Цей репозиторій постачає відповідний документ Skills у `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Пов’язане

- [Text-to-speech](/uk/tools/tts)
- [Talk mode](/uk/nodes/talk)
- [Voice wake](/uk/nodes/voicewake)
