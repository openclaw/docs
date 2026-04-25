---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin voice-call
summary: 'Plugin Voice Call: вхідні й вихідні дзвінки через Twilio/Telnyx/Plivo (встановлення Plugin + конфігурація + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-25T05:58:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

Голосові дзвінки для OpenClaw через Plugin. Підтримує вихідні сповіщення та
багатоходові розмови з політиками для вхідних викликів.

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

Якщо ви використовуєте віддалений Gateway, встановіть/налаштуйте Plugin на **машині, де працює Gateway**, а потім перезапустіть Gateway, щоб завантажити його.

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
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
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

          realtime: {
            enabled: false,
            provider: "google", // optional; first registered realtime voice provider when unset
            toolPolicy: "safe-read-only",
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

Перевірте налаштування перед тестуванням із реальним провайдером:

```bash
openclaw voicecall setup
```

Типовий вивід зручний для читання в журналах чату та сесіях термінала. Він перевіряє,
чи Plugin увімкнено, чи задано провайдера й облікові дані, чи налаштовано
публічну доступність Webhook, і чи активний лише один аудіорежим. Для сценаріїв
використовуйте `openclaw voicecall setup --json`.

Для Twilio, Telnyx і Plivo налаштування має визначатися в публічний URL Webhook. Якщо
налаштований `publicUrl`, URL тунелю, URL Tailscale або резервний `serve` визначається як
loopback або приватний мережевий простір, налаштування завершується помилкою замість запуску
провайдера, який не може отримувати реальні carrier Webhook.

Для передбачуваного smoke-тесту виконайте:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

Друга команда все ще є dry run. Додайте `--yes`, щоб здійснити короткий
вихідний дзвінок-сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Примітки:

- Twilio/Telnyx потребують **публічно доступного** URL Webhook.
- Plivo потребує **публічно доступного** URL Webhook.
- `mock` — це локальний провайдер для розробки (без мережевих викликів).
- Якщо старі конфігурації все ще використовують `provider: "log"`, `twilio.from` або застарілі ключі `streaming.*` для OpenAI, виконайте `openclaw doctor --fix`, щоб переписати їх.
- Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо лише `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` — лише для локального тестування.
- Якщо ви використовуєте безкоштовний тариф ngrok, встановіть `publicUrl` точно на URL ngrok; перевірка підпису завжди примусово застосовується.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` — це loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL безкоштовного тарифу ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміщується, підписи Twilio не проходитимуть перевірку. Для продакшену віддавайте перевагу стабільному домену або Tailscale funnel.
- `realtime.enabled` запускає повноцінні голосові розмови voice-to-voice; не вмикайте його разом із `streaming.enabled`.
- Типові параметри безпеки потокової передачі:
  - `streaming.preStartTimeoutMs` закриває сокети, які так і не надіслали коректний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до старту на одну IP-адресу джерела.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікування + активні).
- Runtime fallback поки що все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а compat shim є тимчасовим.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного провайдера голосу в реальному часі для живого аудіо дзвінка.
Він відокремлений від `streaming`, який лише пересилає аудіо провайдерам
транскрипції в реальному часі.

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.enabled` не можна поєднувати з `streaming.enabled`.
- `realtime.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого
  зареєстрованого провайдера голосу в реальному часі.
- Вбудовані провайдери голосу в реальному часі включають Google Gemini Live (`google`) та
  OpenAI (`openai`), які реєструються їхніми provider Plugin.
- Сира конфігурація, якою володіє провайдер, розміщується в `realtime.providers.<providerId>`.
- Voice Call типово надає спільний інструмент реального часу `openclaw_agent_consult`.
  Модель реального часу може викликати його, коли абонент просить про глибше
  міркування, актуальну інформацію або звичайні інструменти OpenClaw.
- `realtime.toolPolicy` керує запуском consult:
  - `safe-read-only`: надає інструмент consult і обмежує звичайного агента
    до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
    `memory_get`.
  - `owner`: надає інструмент consult і дозволяє звичайному агенту використовувати
    звичайну політику інструментів агента.
  - `none`: не надає інструмент consult. Користувацькі `realtime.tools` усе одно
    передаються провайдеру реального часу.
- Ключі сесії consult повторно використовують наявну голосову сесію, коли це можливо, а потім
  резервно використовують номер телефону абонента/одержувача, щоб наступні виклики consult
  зберігали контекст під час дзвінка.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або якщо взагалі не
  зареєстровано жодного провайдера голосу в реальному часі, Voice Call записує попередження
  в журнал і пропускає медіа реального часу замість зламу всього Plugin.

Типові значення для Google Gemini Live realtime:

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
            instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
            toolPolicy: "safe-read-only",
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

Використання OpenAI замість цього:

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
для параметрів голосу в реальному часі, специфічних для провайдера.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для живого аудіо дзвінка.

Поточна поведінка runtime:

- `streaming.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого
  зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі включають Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI
  (`xai`), які реєструються їхніми provider Plugin.
- Сира конфігурація, якою володіє провайдер, розміщується в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або якщо взагалі не
  зареєстровано жодного провайдера транскрипції в реальному часі, Voice Call записує попередження в журнал і
  пропускає потокову передачу медіа замість зламу всього Plugin.

Типові значення потокової транскрипції OpenAI:

- API key: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Типові значення потокової транскрипції xAI:

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

Використання xAI замість цього:

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

## Очищувач застарілих дзвінків

Використовуйте `staleCallReaperSeconds`, щоб завершувати дзвінки, які ніколи не отримують термінального Webhook
(наприклад, дзвінки в режимі notify, які ніколи не завершуються). Типове значення — `0`
(вимкнено).

Рекомендовані діапазони:

- **Продакшен:** `120`–`300` секунд для потоків у стилі notify.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні дзвінки могли
  завершитися. Добра стартова точка — `maxDurationSeconds + 30–60` секунд.

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

Коли перед Gateway стоїть проксі або тунель, Plugin реконструює
публічний URL для перевірки підпису. Ці параметри керують тим,
яким forwarded headers довіряти.

`webhookSecurity.allowedHosts` дозволяє лише хости з forwarded headers.

`webhookSecurity.trustForwardingHeaders` довіряє forwarded headers без allowlist.

`webhookSecurity.trustedProxyIPs` довіряє forwarded headers лише тоді, коли
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення Webhook увімкнено для Twilio і Plivo. Повторно
відтворені валідні запити Webhook підтверджуються, але пропускаються для побічних ефектів.

Ходи розмови Twilio включають токен для кожного ходу в зворотних викликах `<Gather>`, тож
застарілі/повторно відтворені callback-и розпізнавання мовлення не можуть задовольнити
новіший хід очікуваної транскрипції.

Неавтентифіковані запити Webhook відхиляються ще до читання body, якщо
відсутні обов’язкові заголовки підпису провайдера.

Webhook voice-call використовує спільний профіль body до автентифікації (64 КБ / 5 секунд)
плюс обмеження одночасних запитів на IP до перевірки підпису.

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

- Застарілі ключі `tts.<provider>` в конфігурації Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються через `openclaw doctor --fix`; збережена конфігурація має використовувати `tts.providers.<provider>`.
- **Microsoft speech ігнорується для голосових дзвінків** (аудіо телефонії потребує PCM; поточний транспорт Microsoft не надає телекомунікаційний вивід PCM).
- Базовий TTS використовується, коли увімкнено потокову передачу медіа Twilio; в іншому разі дзвінки резервно використовують рідні голоси провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не переходить резервно на TwiML `<Say>`. Якщо TTS телефонії в цьому стані недоступний, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS телефонії резервно переходить на вторинного провайдера, Voice Call записує попередження в журнал із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in Twilio або завершення потоку очищає чергу очікуваного TTS, запити
  відтворення в черзі завершуються замість зависання викликачів, які очікують
  завершення відтворення.

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

Перевизначити на ElevenLabs лише для дзвінків (залишити базове типове значення деінде):

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

Типове значення для політики вхідних дзвінків — `disabled`. Щоб увімкнути вхідні дзвінки, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` — це фільтр caller ID з низьким рівнем довіри. Plugin
нормалізує надане провайдером значення `From` і порівнює його з `allowFrom`.
Перевірка Webhook автентифікує доставку провайдера й цілісність payload, але
не доводить право власності на номер PSTN/VoIP. Розглядайте `allowFrom` як
фільтрацію caller ID, а не як надійну ідентичність абонента.

Автовідповіді використовують систему агентів. Налаштовуйте через:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає до system prompt суворий контракт озвученого виводу:

- `{"spoken":"..."}`

Потім Voice Call захисно витягує текст мовлення:

- Ігнорує payload, позначені як вміст reasoning/error.
- Розбирає прямий JSON, JSON у fenced-блоках або вбудовані ключі `"spoken"`.
- Резервно використовує звичайний текст і прибирає ймовірні вступні абзаци з плануванням/метаданими.

Це зосереджує озвучене відтворення на тексті для абонента й запобігає витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків у режимі `conversation` обробка першого повідомлення прив’язана до стану живого відтворення:

- Очищення черги через barge-in і автовідповідь пригнічуються лише тоді, коли початкове привітання активно відтворюється.
- Якщо початкове відтворення не вдається, дзвінок повертається до стану `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокової передачі Twilio стартує після підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищає записи TTS Twilio, поставлені в чергу, але ще не відтворені. Очищені записи завершуються як пропущені, тож подальша логіка відповіді може продовжуватися без очікування аудіо, яке ніколи не відтвориться.
- Голосові розмови в реальному часі використовують власний початковий хід потоку реального часу. Voice Call не надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` залишаються під’єднаними.

### Grace-період після від’єднання потоку Twilio

Коли медіапотік Twilio від’єднується, Voice Call чекає `2000ms` перед автоматичним завершенням дзвінка:

- Якщо потік повторно підключається протягом цього вікна, авто-завершення скасовується.
- Якщо після grace-періоду жоден потік не буде повторно зареєстровано, дзвінок завершується, щоб запобігти зависанню активних дзвінків.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху зберігання voice-call. Використовуйте
`--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід містить p50/p90/p99 для
затримки ходу та часу очікування в режимі listen.

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

## Пов’язано

- [Text-to-speech](/uk/tools/tts)
- [Talk mode](/uk/nodes/talk)
- [Voice wake](/uk/nodes/voicewake)
