---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin voice-call
summary: 'Plugin Voice Call: вхідні й вихідні дзвінки через Twilio/Telnyx/Plivo (встановлення Plugin + config + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-23T21:04:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d98dcabb6f03f3b6dd3b5cfaf0ea1ba684a343f778720662267c1af5ff49425
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Голосові дзвінки для OpenClaw через Plugin. Підтримує вихідні сповіщення та
багатоходові розмови з політиками для вхідних викликів.

Поточні провайдери:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (dev/без мережі)

Швидка ментальна модель:

- Установіть Plugin
- Перезапустіть Gateway
- Налаштуйте в `plugins.entries.voice-call.config`
- Використовуйте `openclaw voicecall ...` або інструмент `voice_call`

## Де це працює (local vs remote)

Plugin Voice Call працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, установіть/налаштуйте Plugin на **машині, де працює Gateway**, а потім перезапустіть Gateway, щоб завантажити його.

## Установлення

### Варіант A: установлення з npm (рекомендовано)

```bash
openclaw plugins install @openclaw/voice-call
```

Після цього перезапустіть Gateway.

### Варіант B: установлення з локальної папки (dev, без копіювання)

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
          fromNumber: "+15550001234",
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

          // Безпека Webhook (рекомендовано для tunnel/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Публічне відкриття (виберіть один варіант)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // необов’язково; перший зареєстрований провайдер транскрибування в реальному часі, якщо не задано
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
        },
      },
    },
  },
}
```

Примітки:

- Twilio/Telnyx потребують **публічно доступного** URL webhook.
- Plivo потребує **публічно доступного** URL webhook.
- `mock` — це локальний dev-провайдер (без мережевих викликів).
- Якщо у старих конфігураціях усе ще використовується `provider: "log"`, `twilio.from` або застарілі ключі `streaming.*` для OpenAI, запустіть `openclaw doctor --fix`, щоб переписати їх.
- Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` призначено лише для локального тестування.
- Якщо ви використовуєте безкоштовний тариф ngrok, задайте `publicUrl` точно як URL ngrok; перевірка signature завжди примусово ввімкнена.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook Twilio з невалідними signature **лише** коли `tunnel.provider="ngrok"` і `serve.bind` має loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL безкоштовного тарифу Ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` розійдеться з фактичним URL, signature Twilio не пройдуть перевірку. Для production надавайте перевагу стабільному домену або Tailscale funnel.
- Типові значення безпеки Streaming:
  - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають валідний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих pre-start сокетів.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих pre-start сокетів на одне джерельне IP.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів media stream (pending + active).
- Runtime fallback поки що все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а shim сумісності є тимчасовим.

## Потокове транскрибування

`streaming` вибирає провайдера транскрибування в реальному часі для живого аудіо дзвінка.

Поточна поведінка runtime:

- `streaming.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого
  зареєстрованого провайдера транскрибування в реальному часі.
- Bundled провайдери транскрибування в реальному часі включають Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI
  (`xai`), зареєстровані їхніми provider Plugin.
- Необроблена config, якою володіє провайдер, міститься в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або взагалі не зареєстровано
  жодного провайдера транскрибування в реальному часі, Voice Call журналює попередження і
  пропускає media streaming замість збою всього Plugin.

Типові значення потокового транскрибування OpenAI:

- API key: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Типові значення потокового транскрибування xAI:

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

Використати xAI замість цього:

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

## Reaper застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують terminal webhook
(наприклад, виклики в режимі notify, які ніколи не завершуються). Типове значення — `0`
(вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі notify.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні виклики могли
  завершитися. Хороша відправна точка — `maxDurationSeconds + 30–60` секунд.

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

Коли перед Gateway стоїть proxy або tunnel, Plugin реконструює
публічний URL для перевірки signature. Ці параметри керують тим, яким forwarded
headers довіряти.

`webhookSecurity.allowedHosts` створює allowlist host із forwarding headers.

`webhookSecurity.trustForwardingHeaders` довіряє forwarded headers без allowlist.

`webhookSecurity.trustedProxyIPs` довіряє forwarded headers лише тоді, коли
віддалене IP запиту збігається зі списком.

Захист від повторного програвання webhook увімкнено для Twilio і Plivo. Повторно програні валідні webhook
запити підтверджуються, але пропускаються для побічних ефектів.

Ходи conversation у Twilio включають token для кожного ходу в callback `<Gather>`, тому
застарілі/повторно програні callback мовлення не можуть задовольнити новіший очікувальний хід transcript.

Неавтентифіковані webhook-запити відхиляються ще до читання body, коли відсутні
обов’язкові заголовки signature конкретного провайдера.

Webhook voice-call використовує спільний профіль body до автентифікації (64 KB / 5 секунд)
плюс обмеження in-flight на IP до перевірки signature.

Приклад зі стабільним публічним host:

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

Voice Call використовує core-конфігурацію `messages.tts` для
потокового мовлення під час дзвінків. Ви можете перевизначити її в config Plugin з
**тією самою формою** — вона deep-merge-иться з `messages.tts`.

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

- Застарілі ключі `tts.<provider>` всередині config Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) автоматично мігруються до `tts.providers.<provider>` під час завантаження. У збереженій config надавайте перевагу формі `providers`.
- **Мовлення Microsoft ігнорується для голосових дзвінків** (для telephony audio потрібен PCM; поточний транспорт Microsoft не надає telephony PCM output).
- Core TTS використовується, коли ввімкнено media streaming Twilio; інакше дзвінки повертаються до нативних голосів провайдера.
- Якщо media stream Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо TTS для telephony недоступний у такому стані, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS для telephony повертається до вторинного провайдера, Voice Call журналює попередження з ланцюгом провайдерів (`from`, `to`, `attempts`) для налагодження.

### Більше прикладів

Використовувати лише core TTS (без перевизначення):

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

Перевизначити на ElevenLabs лише для дзвінків (залишити core за замовчуванням в інших місцях):

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

Політика inbound типово має значення `disabled`. Щоб увімкнути вхідні дзвінки, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` — це низькорівнева перевірка caller ID. Plugin
нормалізує значення `From`, надане провайдером, і порівнює його з `allowFrom`.
Перевірка webhook підтверджує доставку від провайдера та цілісність payload, але
вона не доводить право власності на номер викликача в PSTN/VoIP. Розглядайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентичність викликача.

Автовідповіді використовують систему агента. Налаштовуйте за допомогою:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає до системного prompt суворий контракт озвученого виводу:

- `{"spoken":"..."}`

Потім Voice Call захисно витягує текст мовлення:

- Ігнорує payload, позначені як reasoning/error content.
- Розбирає прямий JSON, fenced JSON або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й прибирає ймовірні вступні абзаци з planning/meta.

Це дозволяє зосередити озвучене відтворення на тексті, зверненому до абонента, і уникнути витоку planning-тексту в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків у режимі `conversation` обробка першого повідомлення прив’язана до стану live-відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише тоді, коли початкове привітання активно озвучується.
- Якщо початкове відтворення не вдається, виклик повертається в стан `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для Twilio streaming починається при підключенні stream без додаткової затримки.

### Пільговий період при відключенні потоку Twilio

Коли media stream Twilio відключається, Voice Call чекає `2000ms`, перш ніж автоматично завершити виклик:

- Якщо stream повторно підключається протягом цього вікна, авто-завершення скасовується.
- Якщо після пільгового періоду stream не реєструється знову, виклик завершується, щоб запобігти завислим активним викликам.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # псевдонім для call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # зведення затримки ходів із журналів
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call. Використовуйте
`--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід містить p50/p90/p99 для затримки ходів і часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`

Дії:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Цей репозиторій постачає відповідний документ Skill у `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
