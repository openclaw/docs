---
read_when:
    - Ви хочете здійснити вихідний голосовий виклик з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin голосових викликів
    - Вам потрібен голосовий зв’язок у реальному часі або потокова транскрипція в телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові виклики через Twilio, Telnyx або Plivo, з необов’язковим голосовим зв’язком у реальному часі та потоковою транскрипцією
title: Plugin голосового виклику
x-i18n:
    generated_at: "2026-05-02T21:05:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cf78847a16cdf6fddc47d045d1cad5acf70f7f220fb868a12ff9d69d6cbde6e
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосові виклики для OpenClaw через Plugin. Підтримує вихідні сповіщення,
багатоетапні розмови, повнодуплексний голос у реальному часі, потокову
транскрипцію та вхідні виклики з політиками списку дозволених.

**Поточні провайдери:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (розробка/без мережі).

<Note>
Plugin Voice Call працює **всередині процесу Gateway**. Якщо ви використовуєте
віддалений Gateway, установіть і налаштуйте Plugin на машині, де працює
Gateway, а потім перезапустіть Gateway, щоб завантажити його.
</Note>

## Швидкий старт

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Використовуйте `@openclaw/voice-call@beta`, коли стежите за бета-каналом OpenClaw і
    npmjs показує `beta` попереду `latest`.

    Після цього перезапустіть Gateway, щоб Plugin завантажився.

  </Step>
  <Step title="Configure provider and webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (повну структуру див.
    у розділі [Конфігурація](#configuration) нижче). Мінімум потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і публічно
    доступна URL-адреса Webhook.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Стандартний вивід зручно читати в журналах чату й терміналах. Він перевіряє,
    чи ввімкнено Plugin, облікові дані провайдера, доступність Webhook і те,
    що активний лише один аудіорежим (`streaming` або `realtime`). Використовуйте
    `--json` для скриптів.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди за замовчуванням виконують пробний запуск без дії. Додайте `--yes`, щоб фактично здійснити короткий
    вихідний виклик зі сповіщенням:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначати **публічну URL-адресу Webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний варіант serve
визначається як loopback чи простір приватної мережі, налаштування завершується помилкою замість
запуску провайдера, який не зможе отримувати Webhook від оператора.
</Warning>

## Конфігурація

Якщо `enabled: true`, але для вибраного провайдера бракує облікових даних,
під час запуску Gateway записує попередження про неповне налаштування з відсутніми ключами та
пропускає запуск runtime. Команди, RPC-виклики й інструменти агента все одно
повертають точну відсутню конфігурацію провайдера під час використання.

<Note>
Облікові дані voice-call приймають SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` визначаються через стандартну поверхню SecretRef; див. [поверхню облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Note>

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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx і Plivo всі потребують **публічно доступної** URL-адреси Webhook.
    - `mock` — локальний провайдер для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безкоштовному рівні ngrok задайте `publicUrl` як точну URL-адресу ngrok; перевірка підпису завжди застосовується.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL-адреси безкоштовного рівня Ngrok можуть змінюватися або додавати проміжну сторінку; якщо `publicUrl` зміщується, підписи Twilio не проходять перевірку. Для production віддавайте перевагу стабільному домену або funnel Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний фрейм `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих pre-start сокетів.
    - `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані pre-start сокети на одну вихідну IP-адресу.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувані + активні).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Старіші конфігурації з `provider: "log"`, `twilio.from` або застарілими
    ключами OpenAI `streaming.*` переписуються командою `openclaw doctor --fix`.
    Резервний шлях runtime поки що приймає старі ключі voice-call, але
    шлях переписування — це `openclaw doctor --fix`, а сумісний shim є
    тимчасовим.

    Автоматично мігровані ключі streaming:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Область сеансу

За замовчуванням Voice Call використовує `sessionScope: "per-phone"`, щоб повторні виклики від
того самого абонента зберігали пам’ять розмови. Задайте `sessionScope: "per-call"`, коли
кожен операторський виклик має починатися зі свіжим контекстом, наприклад для рецепції,
бронювання, IVR або потоків мосту Google Meet, де той самий номер телефону може
позначати різні зустрічі.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного голосового провайдера реального часу для live-аудіо
виклику. Це окремо від `streaming`, який лише передає аудіо
провайдерам транскрипції реального часу.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим на виклик.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` необов’язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого голосового провайдера реального часу.
- Вбудовані голосові провайдери реального часу: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми Plugin провайдерів.
- Сира конфігурація, якою володіє провайдер, розміщується в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням надає спільний realtime-інструмент `openclaw_agent_consult`. Realtime-модель може викликати його, коли абонент просить глибше міркування, актуальну інформацію або звичайні інструменти OpenClaw.
- `realtime.fastContext.enabled` за замовчуванням вимкнено. Коли ввімкнено, Voice Call спершу шукає питання consult в індексованій пам’яті/контексті сеансу й повертає ці фрагменти realtime-моделі протягом `realtime.fastContext.timeoutMs`, перш ніж перейти до повного агента consult, лише якщо `realtime.fastContext.fallbackToConsult` дорівнює true.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або жодного голосового провайдера реального часу взагалі не зареєстровано, Voice Call записує попередження й пропускає realtime-медіа замість того, щоб завершити весь Plugin з помилкою.
- Ключі сеансу consult повторно використовують збережений сеанс виклику, коли він доступний, а потім переходять до налаштованого `sessionScope` (`per-phone` за замовчуванням або `per-call` для ізольованих викликів).

### Політика інструментів

`realtime.toolPolicy` керує запуском consult:

| Політика         | Поведінка                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Надає інструмент consult і обмежує звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Надає інструмент consult і дозволяє звичайному агенту використовувати нормальну політику інструментів агента.                           |
| `none`           | Не надає інструмент consult. Користувацькі `realtime.tools` усе одно передаються realtime-провайдеру.                                   |

### Приклади realtime-провайдерів

<Tabs>
  <Tab title="Google Gemini Live">
    Стандартні значення: API-ключ із `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` або `GOOGLE_GENERATIVE_AI_API_KEY`; модель
    `gemini-2.5-flash-native-audio-preview-12-2025`; голос `Kore`.

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

  </Tab>
  <Tab title="OpenAI">
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
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Див. [провайдера Google](/uk/providers/google) і
[провайдера OpenAI](/uk/providers/openai), щоб дізнатися про специфічні для провайдера параметри голосу реального часу.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції реального часу для live-аудіо виклику.

Поточна поведінка runtime:

- `streaming.provider` необов'язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми провайдерськими plugins.
- Сирий конфіг, що належить провайдеру, зберігається в `streaming.providers.<providerId>`.
- Після того як Twilio надсилає прийняте повідомлення `start` для потоку, Voice Call негайно реєструє потік, ставить вхідні медіадані в чергу через провайдера транскрипції, поки провайдер підключається, і запускає початкове привітання лише після готовності транскрипції в реальному часі.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або жодного провайдера не зареєстровано, Voice Call записує попередження в журнал і пропускає потокове передавання медіа замість того, щоб спричинити збій усього plugin.

### Приклади провайдерів потокового передавання

<Tabs>
  <Tab title="OpenAI">
    Значення за замовчуванням: API-ключ `streaming.providers.openai.apiKey` або
    `OPENAI_API_KEY`; модель `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

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

  </Tab>
  <Tab title="xAI">
    Значення за замовчуванням: API-ключ `streaming.providers.xai.apiKey` або `XAI_API_KEY`;
    кінцева точка `wss://api.x.ai/v1/stt`; кодування `mulaw`; частота дискретизації `8000`;
    `endpointingMs: 800`; `interimResults: true`.

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

  </Tab>
</Tabs>

## TTS для викликів

Voice Call використовує основну конфігурацію `messages.tts` для потокового
мовлення під час викликів. Її можна перевизначити в конфігу plugin з
**тією самою формою** — вона глибоко об'єднується з `messages.tts`.

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

<Warning>
**Microsoft speech ігнорується для голосових викликів.** Телефонному аудіо потрібен PCM;
поточний транспорт Microsoft не надає телефонний PCM-вивід.
</Warning>

Нотатки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігу plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються через `openclaw doctor --fix`; зафіксований конфіг має використовувати `tts.providers.<provider>`.
- Core TTS використовується, коли потокове передавання медіа Twilio увімкнено; інакше виклики повертаються до нативних голосів провайдера.
- Якщо медіапотік Twilio уже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS у цьому стані недоступний, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in Twilio або демонтаж потоку очищає чергу TTS, що очікує, запити відтворення в черзі завершуються, а не залишають абонентів чекати завершення відтворення.

### Приклади TTS

<Tabs>
  <Tab title="Core TTS only">
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
  </Tab>
  <Tab title="Override to ElevenLabs (calls only)">
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
  </Tab>
  <Tab title="OpenAI model override (deep-merge)">
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
  </Tab>
</Tabs>

## Вхідні виклики

Вхідна політика за замовчуванням має значення `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — це перевірка caller-ID із низьким рівнем гарантії. Plugin
нормалізує надане провайдером значення `From` і порівнює його з
`allowFrom`. Перевірка Webhook автентифікує доставку провайдером і
цілісність корисного навантаження, але **не** доводить право власності на номер
PSTN/VoIP абонента. Розглядайте `allowFrom` як фільтрацію caller-ID, а не як надійну
ідентифікацію абонента.
</Warning>

Автовідповіді використовують систему агентів. Налаштовуйте їх за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Маршрутизація за номером

Використовуйте `numbers`, коли один Voice Call plugin приймає виклики для кількох телефонних
номерів і кожен номер має поводитися як окрема лінія. Наприклад, один
номер може використовувати невимушеного персонального асистента, а інший — бізнес-
персону, іншого агента відповіді та інший голос TTS.

Маршрути вибираються з набраного номера `To`, наданого провайдером. Ключі мають бути
номерами E.164. Коли виклик надходить, Voice Call один раз визначає відповідний маршрут,
зберігає зіставлений маршрут у записі виклику й повторно використовує цей ефективний конфіг
для привітання, класичного шляху автовідповіді, шляху консультації в реальному часі та
відтворення TTS. Якщо жоден маршрут не збігається, використовується глобальний конфіг Voice Call.
Вихідні виклики не використовують `numbers`; під час ініціювання виклику передавайте ціль вихідного виклику, повідомлення та
сеанс явно.

Перевизначення маршруту наразі підтримують:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Значення маршруту `tts` глибоко об'єднується поверх глобального конфігу Voice Call `tts`, тож
зазвичай можна перевизначити лише голос провайдера:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### Контракт усного виводу

Для автовідповідей Voice Call додає суворий контракт усного виводу до
системного prompt:

```text
{"spoken":"..."}
```

Voice Call захисно витягує текст мовлення:

- Ігнорує корисні навантаження, позначені як вміст reasoning/error.
- Розбирає прямий JSON, JSON у fenced-блоці або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє ймовірні вступні абзаци планування/метаданих.

Це утримує голосове відтворення зосередженим на тексті для абонента та запобігає
витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив'язана до поточного
стану відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише тоді, коли початкове привітання активно озвучується.
- Якщо початкове відтворення завершується помилкою, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio починається під час підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищає записи Twilio TTS, що перебувають у черзі, але ще не відтворюються. Очищені записи завершуються як пропущені, тож логіка подальшої відповіді може продовжити роботу, не чекаючи аудіо, яке ніколи не буде відтворено.
- Голосові розмови в реальному часі використовують власний початковий хід потоку реального часу. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тож вихідні сеанси `<Connect><Stream>` залишаються підключеними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає **2000 мс**, перш ніж
автоматично завершити виклик:

- Якщо потік повторно підключається протягом цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду жоден потік не реєструється повторно, виклик завершується, щоб запобігти завислим активним викликам.

## Очищувач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують кінцевий
webhook (наприклад, виклики в режимі сповіщення, які ніколи не завершуються). Значення за замовчуванням
— `0` (вимкнено).

Рекомендовані діапазони:

- **Продакшн:** `120`–`300` секунд для потоків у стилі сповіщень.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні виклики могли завершитися. Хороша початкова точка — `maxDurationSeconds + 30–60` секунд.

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

Коли proxy або tunnel стоїть перед Gateway, plugin
відновлює публічний URL для перевірки підпису. Ці опції
керують тим, яким пересланим заголовкам довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Allowlist хостів із заголовків пересилання.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти пересланим заголовкам без allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти пересланим заголовкам лише тоді, коли віддалена IP-адреса запиту збігається зі списком.
</ParamField>

Додаткові захисти:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio і Plivo. Повторно відтворені чинні webhook-запити підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмови Twilio містять токен для кожного ходу в callback-ах `<Gather>`, тому застарілі/повторно відтворені callback-и мовлення не можуть задовольнити новіший хід транскрипту, що очікує.
- Неавтентифіковані webhook-запити відхиляються до читання тіла, коли відсутні обов'язкові заголовки підпису провайдера.
- Webhook voice-call використовує спільний профіль тіла до автентифікації (64 КБ / 5 секунд) плюс обмеження одночасних запитів на IP перед перевіркою підпису.

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
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

Коли Gateway уже запущений, операційні команди `voicecall` делегують виконання
voice-call runtime, що належить Gateway, щоб CLI не прив'язував другий
webhook-сервер. Якщо жоден Gateway недоступний, команди повертаються до
автономного CLI runtime.

`latency` читає `calls.jsonl` зі стандартного шляху сховища голосових викликів.
Використовуйте `--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити
аналіз останніми N записами (за замовчуванням 200). Вивід містить p50/p90/p99
для затримки ходу та часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`.

| Дія             | Аргументи                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Цей репозиторій постачає відповідний документ навички за шляхом `skills/voice-call/SKILL.md`.

## RPC Gateway

| Метод               | Аргументи                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` дійсний лише з `mode: "conversation"`. Виклики в режимі сповіщення
мають використовувати `voicecall.dtmf` після створення виклику, якщо їм потрібні
цифри після підключення.

## Усунення несправностей

### Налаштування не проходить перевірку доступності webhook

Запустіть налаштування з того самого середовища, у якому працює Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` і `plivo` `webhook-exposure` має бути зеленим. Налаштований
`publicUrl` усе одно не проходить перевірку, якщо він указує на локальну або приватну
мережеву адресу, оскільки оператор не може викликати ці адреси у відповідь. Не використовуйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Вихідні виклики Twilio в режимі сповіщення надсилають початковий `<Say>` TwiML безпосередньо в
запиті створення виклику, тож перше промовлене повідомлення не залежить від того, чи Twilio
отримає webhook TwiML. Публічний webhook усе одно потрібен для зворотних викликів статусу,
розмовних викликів, DTMF до підключення, потоків реального часу та керування викликом після
підключення.

Використовуйте один шлях публічного доступу:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Після зміни конфігурації перезапустіть або перезавантажте Gateway, а потім виконайте:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` є пробним запуском, якщо не передати `--yes`.

### Облікові дані провайдера не проходять перевірку

Перевірте вибраного провайдера та обов’язкові поля облікових даних:

- Twilio: `twilio.accountSid`, `twilio.authToken` і `fromNumber`, або
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` і `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` і
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` і `fromNumber`.

Облікові дані мають існувати на хості Gateway. Редагування локального профілю оболонки не
впливає на вже запущений Gateway, доки його не перезапустити або не перезавантажити його
середовище.

### Виклики починаються, але webhook провайдера не надходять

Переконайтеся, що консоль провайдера вказує на точну публічну URL-адресу webhook:

```text
https://voice.example.com/voice/webhook
```

Потім перевірте стан виконання:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Поширені причини:

- `publicUrl` указує на інший шлях, ніж `serve.path`.
- URL тунелю змінився після запуску Gateway.
- Проксі пересилає запит, але видаляє або переписує заголовки host/proto.
- Firewall або DNS спрямовує публічне ім’я хоста кудись, окрім Gateway.
- Gateway було перезапущено без увімкненого Plugin Voice Call.

Коли перед Gateway стоїть зворотний проксі або тунель, задайте
`webhookSecurity.allowedHosts` як публічне ім’я хоста або використовуйте
`webhookSecurity.trustedProxyIPs` для відомої адреси проксі. Використовуйте
`webhookSecurity.trustForwardingHeaders` лише тоді, коли межа проксі перебуває під
вашим контролем.

### Перевірка підпису не проходить

Підписи провайдера перевіряються щодо публічної URL-адреси, яку OpenClaw відновлює
з вхідного запиту. Якщо підписи не проходять перевірку:

- Переконайтеся, що URL-адреса webhook провайдера точно збігається з `publicUrl`, зокрема
  зі схемою, хостом і шляхом.
- Для URL ngrok безкоштовного рівня оновлюйте `publicUrl`, коли змінюється ім’я хоста тунелю.
- Переконайтеся, що проксі зберігає початкові заголовки host і proto, або налаштуйте
  `webhookSecurity.allowedHosts`.
- Не вмикайте `skipSignatureVerification` поза локальним тестуванням.

### Підключення Google Meet через Twilio не вдаються

Google Meet використовує цей Plugin для підключень через дозвон Twilio. Спочатку перевірте Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Потім явно перевірте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Якщо Voice Call зелений, але учасник Meet так і не підключається, перевірте номер дозвону Meet,
PIN і `--dtmf-sequence`. Телефонний виклик може бути справним, тоді як зустріч відхиляє
або ігнорує неправильну послідовність DTMF.

Google Meet передає послідовність DTMF Meet і вступний текст до `voicecall.start`.
Для викликів Twilio Voice Call спочатку обслуговує DTMF TwiML, перенаправляє назад до
webhook, а потім відкриває медіапотік реального часу, щоб збережений вступ було згенеровано
після того, як телефонний учасник приєднався до зустрічі.

Використовуйте `openclaw logs --follow` для живої трасування фази. Справне підключення
Twilio Meet журналює такий порядок:

- Google Meet делегує підключення Twilio до Voice Call.
- Voice Call зберігає DTMF TwiML до підключення.
- Початковий TwiML Twilio споживається й обслуговується до обробки реального часу.
- Voice Call обслуговує TwiML реального часу для виклику Twilio.
- Міст реального часу запускається з початковим привітанням у черзі.

`openclaw voicecall tail` усе ще показує збережені записи викликів; це корисно для
стану виклику та транскриптів, але не кожен перехід webhook/реального часу там
відображається.

### У виклику реального часу немає мовлення

Переконайтеся, що ввімкнено лише один аудіорежим. `realtime.enabled` і
`streaming.enabled` не можуть одночасно бути true.

Для викликів Twilio в реальному часі також перевірте:

- Plugin провайдера реального часу завантажено й зареєстровано.
- `realtime.provider` не задано або він називає зареєстрованого провайдера.
- API-ключ провайдера доступний процесу Gateway.
- `openclaw logs --follow` показує, що TwiML реального часу обслужено, міст реального часу
  запущено, а початкове привітання поставлено в чергу.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
