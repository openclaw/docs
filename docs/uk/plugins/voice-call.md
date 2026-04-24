---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
summary: 'Плагін Voice Call: вихідні + вхідні дзвінки через Twilio/Telnyx/Plivo (встановлення плагіна + конфігурація + CLI)'
title: Плагін Voice call
x-i18n:
    generated_at: "2026-04-24T09:19:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (плагін)

Голосові дзвінки для OpenClaw через плагін. Підтримує вихідні сповіщення та
багатоходові розмови з політиками для вхідних викликів.

Поточні провайдери:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (dev/без мережі)

Коротка ментальна модель:

- Встановіть плагін
- Перезапустіть Gateway
- Налаштуйте в `plugins.entries.voice-call.config`
- Використовуйте `openclaw voicecall ...` або інструмент `voice_call`

## Де це працює (локально чи віддалено)

Плагін Voice Call працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, встановіть/налаштуйте плагін на **машині, де запущено Gateway**, а потім перезапустіть Gateway, щоб завантажити його.

## Встановлення

### Варіант A: встановлення з npm (рекомендовано)

```bash
openclaw plugins install @openclaw/voice-call
```

Після цього перезапустіть Gateway.

### Варіант B: встановлення з локальної папки (dev, без копіювання)

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
            // Публічний ключ Webhook Telnyx з Telnyx Mission Control Portal
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

          // Публічна експозиція (виберіть один варіант)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // необов’язково; якщо не вказано, використовується перший зареєстрований провайдер транскрипції в реальному часі
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
            provider: "google", // необов’язково; якщо не вказано, використовується перший зареєстрований голосовий провайдер у реальному часі
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

- Twilio/Telnyx вимагають **публічно доступний** URL Webhook.
- Plivo вимагає **публічно доступний** URL Webhook.
- `mock` — це локальний dev-провайдер (без мережевих викликів).
- Якщо старі конфігурації досі використовують `provider: "log"`, `twilio.from` або застарілі ключі `streaming.*` для OpenAI, виконайте `openclaw doctor --fix`, щоб переписати їх.
- Для Telnyx потрібен `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` призначений лише для локального тестування.
- Якщо ви використовуєте безкоштовний рівень ngrok, задайте `publicUrl` як точний URL ngrok; перевірка підпису завжди примусово увімкнена.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook-и Twilio з невалідними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL-адреси безкоштовного рівня Ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio не пройдуть перевірку. Для production віддавайте перевагу стабільному домену або Tailscale funnel.
- `realtime.enabled` запускає повноцінні голосові розмови голос-до-голосу; не вмикайте його разом із `streaming.enabled`.
- Типові параметри безпеки streaming:
  - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають валідний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до старту з однієї IP-адреси джерела.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувальні + активні).
- Під час виконання fallback наразі все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а шар сумісності є тимчасовим.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного голосового провайдера в реальному часі для аудіо живого дзвінка.
Він відокремлений від `streaming`, який лише пересилає аудіо провайдерам
транскрипції в реальному часі.

Поточна поведінка під час виконання:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.enabled` не можна поєднувати з `streaming.enabled`.
- `realtime.provider` є необов’язковим. Якщо не вказано, Voice Call використовує першого
  зареєстрованого голосового провайдера в реальному часі.
- Вбудовані голосові провайдери в реальному часі включають Google Gemini Live (`google`) та
  OpenAI (`openai`), зареєстровані їхніми плагінами провайдерів.
- Сирий конфіг, що належить провайдеру, розташовано в `realtime.providers.<providerId>`.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або якщо жодного голосового
  провайдера в реальному часі взагалі не зареєстровано, Voice Call записує попередження в лог і пропускає
  медіа в реальному часі замість того, щоб ламати весь плагін.

Типові значення Google Gemini Live realtime:

- API key: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` або
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
            instructions: "Говоріть коротко й запитуйте перед використанням інструментів.",
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

Використовуйте OpenAI натомість:

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

Див. [провайдер Google](/uk/providers/google) і [провайдер OpenAI](/uk/providers/openai)
для параметрів голосу в реальному часі, специфічних для провайдера.

## Streaming транскрипції

`streaming` вибирає провайдера транскрипції в реальному часі для аудіо живого дзвінка.

Поточна поведінка під час виконання:

- `streaming.provider` є необов’язковим. Якщо не вказано, Voice Call використовує першого
  зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі включають Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI
  (`xai`), зареєстровані їхніми плагінами провайдерів.
- Сирий конфіг, що належить провайдеру, розташовано в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або якщо жодного провайдера
  транскрипції в реальному часі взагалі не зареєстровано, Voice Call записує попередження в лог і
  пропускає streaming медіа замість того, щоб ламати весь плагін.

Типові значення транскрипції streaming OpenAI:

- API key: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Типові значення транскрипції streaming xAI:

- API key: `streaming.providers.xai.apiKey` або `XAI_API_KEY`
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

Використовуйте xAI натомість:

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

## Очищувач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують фінального Webhook
(наприклад, виклики в режимі notify, які ніколи не завершуються). Типове значення — `0`
(вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі notify.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні виклики могли
  завершитися. Гарна стартова точка — `maxDurationSeconds + 30–60` секунд.

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

Коли перед Gateway стоїть проксі або тунель, плагін реконструює
публічний URL для перевірки підпису. Ці параметри керують тим, яким forwarded
заголовкам довіряти.

`webhookSecurity.allowedHosts` задає allowlist хостів із forwarding-заголовків.

`webhookSecurity.trustForwardingHeaders` довіряє forwarded-заголовкам без allowlist.

`webhookSecurity.trustedProxyIPs` довіряє forwarded-заголовкам лише тоді, коли
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення Webhook увімкнено для Twilio та Plivo. Повторно відтворені валідні запити Webhook
підтверджуються, але пропускаються з погляду побічних ефектів.

Ходи розмов Twilio включають токен на кожен хід у callback-ах `<Gather>`, тому
застарілі/повторно відтворені callback-и мовлення не можуть задовольнити новіший очікуваний хід транскрипту.

Неавтентифіковані запити Webhook відхиляються до читання тіла, якщо відсутні
обов’язкові заголовки підпису провайдера.

Webhook voice-call використовує спільний профіль тіла до автентифікації (64 KB / 5 секунд)
плюс обмеження кількості одночасних запитів на IP до перевірки підпису.

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

Voice Call використовує базову конфігурацію `messages.tts` для
потокового мовлення під час дзвінків. Ви можете перевизначити її в конфігурації плагіна з
**тією самою структурою** — вона deep-merge-иться з `messages.tts`.

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

- Застарілі ключі `tts.<provider>` усередині конфігурації плагіна (`openai`, `elevenlabs`, `microsoft`, `edge`) автоматично мігруються до `tts.providers.<provider>` під час завантаження. У збереженій конфігурації віддавайте перевагу формі `providers`.
- **Microsoft speech ігнорується для голосових дзвінків** (телефонному аудіо потрібен PCM; поточний транспорт Microsoft не надає вихід PCM для телефонії).
- Базовий TTS використовується, коли ввімкнено потокове медіа Twilio; інакше дзвінки переходять до вбудованих голосів провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не переходить на TwiML `<Say>`. Якщо TTS для телефонії в такому стані недоступний, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS для телефонії переходить на вторинного провайдера, Voice Call записує попередження в лог із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.

### Більше прикладів

Використовувати лише базовий TTS (без перевизначення):

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

Перевизначити на ElevenLabs лише для дзвінків (залишити базове значення в інших місцях):

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

Перевизначити лише модель OpenAI для дзвінків (приклад deep-merge):

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

Типове значення політики вхідних дзвінків — `disabled`. Щоб увімкнути вхідні дзвінки, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Вітаю! Чим я можу допомогти?",
}
```

`inboundPolicy: "allowlist"` — це низькорівневий фільтр caller ID. Плагін
нормалізує значення `From`, яке надає провайдер, і порівнює його з `allowFrom`.
Перевірка Webhook автентифікує доставку від провайдера та цілісність payload, але
не доводить право власності на номер абонента PSTN/VoIP. Сприймайте `allowFrom` як
фільтрацію caller ID, а не як сильне підтвердження особи абонента.

Автовідповіді використовують систему агентів. Налаштовуйте через:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає до системного prompt суворий контракт озвученого виводу:

- `{"spoken":"..."}`

Потім Voice Call обережно витягує текст мовлення:

- Ігнорує payload, позначені як reasoning/error content.
- Розбирає прямий JSON, JSON у fenced-блоках або вбудовані ключі `"spoken"`.
- Переходить до plain text і видаляє ймовірні вступні абзаци з плануванням/метаданими.

Це дозволяє зосередити озвучення на тексті для абонента й уникнути потрапляння в аудіо тексту планування.

### Поведінка під час запуску розмови

Для вихідних дзвінків у режимі `conversation` обробка першого повідомлення пов’язана зі станом живого відтворення:

- Очищення черги barge-in та автовідповідь пригнічуються лише тоді, коли початкове привітання активно озвучується.
- Якщо початкове відтворення не вдається, дзвінок повертається до стану `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового Twilio починається під час підключення потоку без додаткової затримки.

### Пільговий період після відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає `2000ms` перед автоматичним завершенням дзвінка:

- Якщо потік перепідключається протягом цього вікна, авто-завершення скасовується.
- Якщо після завершення пільгового періоду потік не реєструється знову, дзвінок завершується, щоб запобігти завислим активним дзвінкам.

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
openclaw voicecall latency                     # підсумувати затримку ходів за логами
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call. Використовуйте
`--file <path>`, щоб вказати інший лог, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід містить p50/p90/p99 для затримки ходу
та часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`

Дії:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Цей репозиторій містить відповідний документ Skills у `skills/voice-call/SKILL.md`.

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
