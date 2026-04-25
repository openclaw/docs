---
read_when:
    - Ви хочете здійснити вихідний голосовий виклик з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
summary: 'Плагін Voice Call: вихідні + вхідні дзвінки через Twilio/Telnyx/Plivo (встановлення плагіна + налаштування + CLI)'
title: Плагін Voice call
x-i18n:
    generated_at: "2026-04-25T05:04:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54fff21558f5a8788f85a91ed84a60a3d74a4fa8da8edbe81a23adc9a9065e2f
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (плагін)

Голосові виклики для OpenClaw через плагін. Підтримує вихідні сповіщення та
багатоходові розмови з політиками для вхідних викликів.

Поточні провайдери:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (розробка/без мережі)

Коротка модель:

- Встановіть плагін
- Перезапустіть Gateway
- Налаштуйте в `plugins.entries.voice-call.config`
- Використовуйте `openclaw voicecall ...` або інструмент `voice_call`

## Де він працює (локально чи віддалено)

Плагін Voice Call працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, встановіть і налаштуйте плагін на **машині, де працює Gateway**, а потім перезапустіть Gateway, щоб завантажити його.

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

## Налаштування

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
            // Публічний ключ Webhook Telnyx із Telnyx Mission Control Portal
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

          // Публічний доступ (виберіть один варіант)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // необов’язково; якщо не задано, використовується перший зареєстрований провайдер транскрибування в реальному часі
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
            provider: "google", // необов’язково; якщо не задано, використовується перший зареєстрований провайдер голосу в реальному часі
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

Типовий вивід зручно читати в журналах чату та сеансах термінала. Він перевіряє,
чи увімкнено плагін, чи наявні провайдер і облікові дані, чи налаштовано
публічний доступ до Webhook, і чи активний лише один аудіорежим. Для скриптів
використовуйте `openclaw voicecall setup --json`.

Для Twilio, Telnyx і Plivo налаштування має визначитися в публічну URL-адресу
Webhook. Якщо налаштований `publicUrl`, URL тунелю, URL Tailscale або резервний
варіант serve веде на loopback або простір приватної мережі, перевірка
завершиться помилкою замість запуску провайдера, який не може отримувати
реальні carrier Webhook.

Для передбачуваного smoke-тесту виконайте:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

Друга команда все ще є сухим запуском. Додайте `--yes`, щоб здійснити короткий
вихідний виклик у режимі notify:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Примітки:

- Twilio/Telnyx вимагають **публічно доступну** URL-адресу Webhook.
- Plivo вимагає **публічно доступну** URL-адресу Webhook.
- `mock` — це локальний провайдер для розробки (без мережевих викликів).
- Якщо у старіших конфігураціях усе ще використовуються `provider: "log"`, `twilio.from` або застарілі ключі OpenAI `streaming.*`, виконайте `openclaw doctor --fix`, щоб переписати їх.
- Telnyx вимагає `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` призначено лише для локального тестування.
- Якщо ви використовуєте безкоштовний тариф ngrok, задайте `publicUrl` точною URL-адресою ngrok; перевірка підпису завжди примусово увімкнена.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` вказує на loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL-адреси ngrok на безкоштовному тарифі можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio не пройдуть перевірку. Для production краще використовувати стабільний домен або Tailscale funnel.
- `realtime.enabled` запускає повноцінні голосові розмови voice-to-voice; не вмикайте його одночасно з `streaming.enabled`.
- Типові параметри безпеки streaming:
  - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають коректний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до старту на одну IP-адресу джерела.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікування + активні).
- Під час виконання резервна сумісність поки що приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а шар сумісності є тимчасовим.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного провайдера голосу в реальному часі для
живого аудіо дзвінка. Це окремо від `streaming`, який лише пересилає аудіо до
провайдерів транскрибування в реальному часі.

Поточна поведінка під час виконання:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.enabled` не можна поєднувати з `streaming.enabled`.
- `realtime.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера голосу в реальному часі.
- До вбудованих провайдерів голосу в реальному часі входять Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми плагінами провайдерів.
- Сирий конфіг, що належить провайдеру, розміщується в `realtime.providers.<providerId>`.
- Voice Call типово надає спільний інструмент реального часу `openclaw_agent_consult`. Модель реального часу може викликати його, коли абонент просить глибше міркування, актуальну інформацію або звичайні інструменти OpenClaw.
- `realtime.toolPolicy` керує запуском consult:
  - `safe-read-only`: надавати інструмент consult і обмежувати звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
  - `owner`: надавати інструмент consult і дозволяти звичайному агенту використовувати стандартну політику інструментів агента.
  - `none`: не надавати інструмент consult. Користувацькі `realtime.tools` усе одно передаються провайдеру реального часу.
- Ключі сеансу consult повторно використовують наявний голосовий сеанс, коли це можливо, а потім переходять до номера телефону абонента або адресата, щоб повторні consult-виклики зберігали контекст під час дзвінка.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або якщо взагалі не зареєстровано жодного провайдера голосу в реальному часі, Voice Call записує попередження в журнал і пропускає медіа реального часу замість того, щоб аварійно завершувати роботу всього плагіна.

Типові параметри Google Gemini Live realtime:

- API-ключ: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_GENERATIVE_AI_API_KEY`
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
            instructions: "Говоріть стисло. Викликайте openclaw_agent_consult перед використанням глибших інструментів.",
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

Натомість використовуйте OpenAI:

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

## Транскрибування потокового аудіо

`streaming` вибирає провайдера транскрибування в реальному часі для живого
аудіо дзвінка.

Поточна поведінка під час виконання:

- `streaming.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера транскрибування в реальному часі.
- До вбудованих провайдерів транскрибування в реальному часі входять Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми плагінами провайдерів.
- Сирий конфіг, що належить провайдеру, розміщується в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або якщо взагалі не зареєстровано жодного провайдера транскрибування в реальному часі, Voice Call записує попередження в журнал і пропускає медіапотік замість того, щоб аварійно завершувати роботу всього плагіна.

Типові параметри транскрибування OpenAI для streaming:

- API-ключ: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Типові параметри транскрибування xAI для streaming:

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

Натомість використовуйте xAI:

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

Використовуйте `staleCallReaperSeconds`, щоб завершувати дзвінки, які ніколи не отримують термінальний Webhook
(наприклад, виклики в режимі notify, які ніколи не завершуються). Типове значення — `0`
(вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі notify.
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

Коли перед Gateway стоїть проксі або тунель, плагін відновлює
публічну URL-адресу для перевірки підпису. Ці параметри керують тим,
яким пересланим заголовкам можна довіряти.

`webhookSecurity.allowedHosts` задає allowlist хостів із пересланих заголовків.

`webhookSecurity.trustForwardingHeaders` довіряє пересланим заголовкам без allowlist.

`webhookSecurity.trustedProxyIPs` довіряє пересланим заголовкам лише тоді, коли
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення Webhook увімкнено для Twilio і Plivo. Повторно
відтворені коректні Webhook-запити підтверджуються, але пропускаються без побічних ефектів.

Кроки розмови Twilio включають токен для кожного кроку в зворотних викликах `<Gather>`, тому
застарілі або повторно відтворені зворотні виклики мовлення не можуть задовольнити
новіший очікуваний крок транскрипції.

Неавтентифіковані Webhook-запити відхиляються до читання тіла, якщо відсутні
обов’язкові заголовки підпису провайдера.

Webhook voice-call використовує спільний профіль тіла до автентифікації (64 KB / 5 секунд)
плюс обмеження кількості одночасних запитів на одну IP-адресу до перевірки підпису.

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
потокового відтворення мовлення під час дзвінків. Ви можете перевизначити її в конфігурації плагіна з
**такою самою структурою** — вона глибоко об’єднується з `messages.tts`.

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

- Застарілі ключі `tts.<provider>` у конфігурації плагіна (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються через `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `tts.providers.<provider>`.
- **Microsoft speech ігнорується для голосових дзвінків** (аудіо телефонії потребує PCM; поточний транспорт Microsoft не надає вихід PCM для телефонії).
- Основний TTS використовується, коли увімкнено медіапотік Twilio; інакше дзвінки повертаються до вбудованих голосів провайдера.
- Якщо медіапотік Twilio уже активний, Voice Call не повертається до TwiML `<Say>`. Якщо TTS для телефонії в цьому стані недоступний, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS для телефонії переходить до вторинного провайдера, Voice Call записує попередження в журнал із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in або завершення потоку Twilio очищує чергу очікування TTS, поставлені в чергу
  запити на відтворення завершуються замість зависання абонентів, які очікують завершення
  відтворення.

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

Перевизначити на ElevenLabs лише для дзвінків (залишити основне типове значення в інших місцях):

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

Політика вхідних дзвінків типово має значення `disabled`. Щоб увімкнути вхідні дзвінки, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Вітаю! Чим я можу допомогти?",
}
```

`inboundPolicy: "allowlist"` — це низьконадійна фільтрація caller ID. Плагін
нормалізує значення `From`, отримане від провайдера, і порівнює його з `allowFrom`.
Перевірка Webhook автентифікує доставку від провайдера та цілісність вмісту, але
вона не доводить право власності на номер абонента PSTN/VoIP. Розглядайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентифікацію абонента.

Автовідповіді використовують систему агента. Налаштовуйте через:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає суворий контракт озвученого виводу до system prompt:

- `{"spoken":"..."}`

Потім Voice Call захисно витягує текст мовлення:

- Ігнорує вміст, позначений як reasoning/error.
- Аналізує прямий JSON, JSON у fenced-блоках або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й прибирає ймовірні вступні абзаци з плануванням/метаданими.

Це дозволяє зосередити озвучення на тексті для абонента й уникнути витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків у режимі `conversation` обробка першого повідомлення прив’язана до стану відтворення в реальному часі:

- Очищення черги через barge-in і автовідповідь пригнічуються лише поки початкове привітання активно озвучується.
- Якщо початкове відтворення завершується помилкою, дзвінок повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для streaming Twilio починається під час підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищує записи TTS Twilio, які вже стоять у черзі, але ще не почали відтворюватися. Очищені записи завершуються як пропущені, щоб подальша логіка відповіді могла продовжитися без очікування аудіо, яке ніколи не буде відтворено.
- Голосові розмови в реальному часі використовують власний початковий хід потоку реального часу. Voice Call не надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сеанси `<Connect><Stream>` залишаються підключеними.

### Пільговий період після відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає `2000ms` перед автоматичним завершенням дзвінка:

- Якщо потік знову підключається в межах цього вікна, автоматичне завершення скасовується.
- Якщо після завершення пільгового періоду жоден потік не реєструється повторно, дзвінок завершується, щоб запобігти завислим активним дзвінкам.

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
openclaw voicecall latency                     # зведення затримки кроків із журналів
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху зберігання voice-call. Використовуйте
`--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід містить p50/p90/p99 для затримки кроків
і часу очікування прослуховування.

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

- [Синтез мовлення](/uk/tools/tts)
- [Режим розмови](/uk/nodes/talk)
- [Голосова активація](/uk/nodes/voicewake)
