---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
summary: 'Плагін Voice Call: вихідні + вхідні дзвінки через Twilio/Telnyx/Plivo (встановлення плагіна + конфігурація + CLI)'
title: Плагін Voice Call
x-i18n:
    generated_at: "2026-04-23T03:31:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Голосові дзвінки для OpenClaw через Plugin. Підтримує вихідні сповіщення та
багатоходові розмови із вхідними політиками.

Поточні провайдери:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (розробка/без мережі)

Коротка ментальна модель:

- Встановіть Plugin
- Перезапустіть Gateway
- Налаштуйте в `plugins.entries.voice-call.config`
- Використовуйте `openclaw voicecall ...` або інструмент `voice_call`

## Де це працює (локально чи віддалено)

Plugin Voice Call працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, встановіть/налаштуйте Plugin на **машині, де працює Gateway**, а потім перезапустіть Gateway, щоб він його завантажив.

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
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; first registered realtime transcription provider when unset
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

- Twilio/Telnyx потребують **публічно доступної** URL-адреси Webhook.
- Plivo потребує **публічно доступної** URL-адреси Webhook.
- `mock` — це локальний провайдер для розробки (без мережевих викликів).
- Якщо старіші конфігурації досі використовують `provider: "log"`, `twilio.from` або застарілі ключі OpenAI в `streaming.*`, виконайте `openclaw doctor --fix`, щоб переписати їх.
- Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` призначений лише для локального тестування.
- Якщо ви використовуєте безкоштовний тариф ngrok, задайте `publicUrl` точною URL-адресою ngrok; перевірка підпису завжди примусово виконується.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook-и Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є local loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL-адреси ngrok на безкоштовному тарифі можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio не пройдуть перевірку. Для продакшну надавайте перевагу стабільному домену або Tailscale funnel.
- Значення безпеки streaming за замовчуванням:
  - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають коректний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих pre-start сокетів.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих pre-start сокетів на одну вихідну IP-адресу.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувальні + активні).
- Runtime fallback поки що все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а shim сумісності є тимчасовим.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для живого аудіо дзвінків.

Поточна поведінка в runtime:

- `streaming.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі включають Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), які реєструються їхніми провайдерськими Plugins.
- Необроблена конфігурація, що належить провайдеру, розташована в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або взагалі не зареєстровано жодного провайдера транскрипції в реальному часі, Voice Call записує попередження в журнал і пропускає потокову передачу медіа замість того, щоб зупиняти весь Plugin.

Значення OpenAI для потокової транскрипції за замовчуванням:

- API-ключ: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- модель: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Значення xAI для потокової транскрипції за замовчуванням:

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
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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
                apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

Використовуйте `staleCallReaperSeconds`, щоб завершувати дзвінки, які ніколи не отримують фінальний Webhook
(наприклад, дзвінки в режимі notify, які ніколи не завершуються). Значення за замовчуванням — `0`
(вимкнено).

Рекомендовані діапазони:

- **Продакшн:** `120`–`300` секунд для потоків у стилі notify.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні дзвінки могли
  завершитися. Хороша початкова точка — `maxDurationSeconds + 30–60` секунд.

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

Коли перед Gateway стоїть проксі або тунель, Plugin відновлює
публічну URL-адресу для перевірки підпису. Ці параметри керують тим,
яким переспрямованим заголовкам можна довіряти.

`webhookSecurity.allowedHosts` задає список дозволених хостів із переспрямованих заголовків.

`webhookSecurity.trustForwardingHeaders` дозволяє довіряти переспрямованим заголовкам без списку дозволених.

`webhookSecurity.trustedProxyIPs` дозволяє довіряти переспрямованим заголовкам лише тоді, коли
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення Webhook увімкнено для Twilio і Plivo. Повторно відтворені коректні запити Webhook
підтверджуються, але пропускаються без побічних ефектів.

Ходи розмови Twilio включають токен на кожен хід у callback-ах `<Gather>`, тому
застарілі/повторно відтворені callback-и мовлення не можуть задовольнити новіший очікуваний хід транскрипції.

Неавтентифіковані запити Webhook відхиляються до читання тіла, якщо відсутні
обов’язкові заголовки підпису від провайдера.

Webhook voice-call використовує спільний профіль pre-auth для тіла (64 KB / 5 секунд),
а також обмеження на кількість одночасних запитів з однієї IP-адреси до перевірки підпису.

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
- **Microsoft speech ігнорується для голосових дзвінків** (телефонному аудіо потрібен PCM; поточний транспорт Microsoft не надає PCM-вивід для телефонії).
- Основний TTS використовується, коли увімкнено потокову передачу медіа Twilio; в іншому разі дзвінки переходять на вбудовані голоси провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не переходить на TwiML `<Say>`. Якщо TTS для телефонії недоступний у цьому стані, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS для телефонії переходить на резервного провайдера, Voice Call записує попередження в журнал із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.

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
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` — це екранування caller ID з низьким рівнем гарантій. Plugin
нормалізує надане провайдером значення `From` і порівнює його з `allowFrom`.
Перевірка Webhook автентифікує доставку від провайдера та цілісність корисного навантаження, але
вона не доводить право власності на номер виклику PSTN/VoIP. Розглядайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентифікацію абонента.

Автовідповіді використовують систему агентів. Налаштовуйте за допомогою:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає суворий контракт озвученого виводу до системного prompt:

- `{"spoken":"..."}`

Потім Voice Call захисно витягує текст мовлення:

- Ігнорує payload-и, позначені як reasoning/error content.
- Розбирає прямий JSON, JSON у fenced-блоках або вбудовані ключі `"spoken"`.
- Використовує простий текст як fallback і видаляє ймовірні вступні абзаци з плануванням/метаінформацією.

Це дозволяє зосередити озвучене відтворення на тексті для абонента й уникнути витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків `conversation` обробка першого повідомлення прив’язана до стану живого відтворення:

- Очищення черги barge-in та автовідповідь пригнічуються лише тоді, коли початкове привітання активно озвучується.
- Якщо початкове відтворення не вдається, дзвінок повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокової передачі Twilio починається при підключенні потоку без додаткової затримки.

### Пільговий період при відключенні потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає `2000ms`, перш ніж автоматично завершити дзвінок:

- Якщо потік повторно підключається протягом цього вікна, автозавершення скасовується.
- Якщо після завершення пільгового періоду жоден потік не реєструється знову, дзвінок завершується, щоб запобігти завислим активним дзвінкам.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху зберігання voice-call. Використовуйте
`--file <path>`, щоб вказати інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід включає p50/p90/p99 для затримки
ходу та часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`

Дії:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Цей репозиторій постачає відповідний документ Skills у `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
