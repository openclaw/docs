---
read_when:
    - Ви хочете здійснити вихідний голосовий виклик з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin голосових викликів
    - Вам потрібен голосовий зв’язок у реальному часі або потокова транскрипція для телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові дзвінки через Twilio, Telnyx або Plivo, з опційною підтримкою голосу в реальному часі та потокової транскрипції
title: Plugin голосових викликів
x-i18n:
    generated_at: "2026-05-06T08:23:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba168696481ef0cc3c55ac8fd8be4382cb36889a12ed6d881fe6b29a2b0a54c
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосові виклики для OpenClaw через Plugin. Підтримує вихідні сповіщення,
багатоетапні розмови, повнодуплексний голос у реальному часі, потокову
транскрипцію та вхідні виклики з політиками списків дозволених.

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
  <Step title="Установіть Plugin">
    <Tabs>
      <Tab title="З npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="З локальної папки (розробка)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Використовуйте пакет без версії, щоб стежити за поточним офіційним тегом релізу. Закріплюйте
    точну версію лише тоді, коли потрібне відтворюване встановлення.

    Потім перезапустіть Gateway, щоб Plugin завантажився.

  </Step>
  <Step title="Налаштуйте провайдера та Webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (повну структуру див.
    у розділі [Конфігурація](#configuration) нижче). Мінімум:
    `provider`, облікові дані провайдера, `fromNumber` і публічно
    доступна URL-адреса Webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручно читати в журналах чату й терміналах. Він перевіряє,
    чи ввімкнено Plugin, облікові дані провайдера, доступність Webhook і те,
    що активний лише один режим аудіо (`streaming` або `realtime`). Використовуйте
    `--json` для скриптів.

  </Step>
  <Step title="Smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    За замовчуванням обидві команди виконуються як пробний запуск. Додайте `--yes`, щоб фактично здійснити короткий
    вихідний виклик-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначатися як **публічна URL-адреса Webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний варіант `serve`
визначається як loopback чи простір приватної мережі, налаштування завершується помилкою замість
запуску провайдера, який не може отримувати Webhook від оператора.
</Warning>

## Конфігурація

Якщо `enabled: true`, але вибраному провайдеру бракує облікових даних,
під час запуску Gateway записує попередження про незавершене налаштування з відсутніми ключами та
пропускає запуск runtime. Команди, RPC-виклики й інструменти агента все одно
повертають точну відсутню конфігурацію провайдера під час використання.

<Note>
Облікові дані voice-call приймають SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` розв’язуються через стандартну поверхню SecretRef; див. [поверхню облікових даних SecretRef](/uk/reference/secretref-credential-surface).
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
  <Accordion title="Примітки щодо доступності провайдера та безпеки">
    - Twilio, Telnyx і Plivo потребують **публічно доступної** URL-адреси Webhook.
    - `mock` — локальний провайдер для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначений лише для локального тестування.
    - На безкоштовному рівні ngrok задайте `publicUrl` як точну URL-адресу ngrok; перевірка підпису завжди примусова.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL-адреси безкоштовного рівня Ngrok можуть змінюватися або додавати проміжну сторінку; якщо `publicUrl` зміщується, підписи Twilio не проходять перевірку. Для production віддавайте перевагу стабільному домену або funnel Tailscale.

  </Accordion>
  <Accordion title="Обмеження потокових підключень">
    - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
    - `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до старту для кожної IP-адреси джерела.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувані + активні).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації, що використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI у `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Резервний runtime поки що все ще приймає старі ключі voice-call, але
    шлях переписування — `openclaw doctor --fix`, а compat-шар
    тимчасовий.

    Автоматично мігровані ключі streaming:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Область сесії

За замовчуванням Voice Call використовує `sessionScope: "per-phone"`, тож повторні виклики від
того самого абонента зберігають пам’ять розмови. Установіть `sessionScope: "per-call"`, коли
кожен виклик оператора має починатися зі свіжого контексту, наприклад для рецепції,
бронювання, IVR або bridge-потоків Google Meet, де той самий номер телефону може
представляти різні зустрічі.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного голосового провайдера реального часу для живого аудіо
виклику. Він відокремлений від `streaming`, який лише пересилає аудіо
провайдерам транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
режим аудіо для кожного виклику.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` необов’язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого голосового провайдера реального часу.
- Вбудовані голосові провайдери реального часу: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми Plugin провайдерів.
- Сира конфігурація, якою володіє провайдер, розміщується в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням надає спільний інструмент реального часу `openclaw_agent_consult`. Модель реального часу може викликати його, коли абонент просить глибшого міркування, актуальної інформації або звичайних інструментів OpenClaw.
- `realtime.consultPolicy` необов’язково додає вказівки щодо того, коли модель реального часу має викликати `openclaw_agent_consult`.
- `realtime.agentContext.enabled` за замовчуванням вимкнено. Коли ввімкнено, Voice Call додає обмежену ідентичність агента, перевизначення системного prompt і вибрану капсулу файлів workspace до інструкцій провайдера реального часу під час налаштування сесії.
- `realtime.fastContext.enabled` за замовчуванням вимкнено. Коли ввімкнено, Voice Call спочатку шукає індексовану пам’ять/контекст сесії для питання consult і повертає ці фрагменти моделі реального часу в межах `realtime.fastContext.timeoutMs`, перш ніж переходити до повного consult-агента лише якщо `realtime.fastContext.fallbackToConsult` має значення true.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або жоден голосовий провайдер реального часу взагалі не зареєстрований, Voice Call записує попередження та пропускає медіа реального часу замість того, щоб зупиняти весь Plugin помилкою.
- Ключі consult-сесії повторно використовують збережену сесію виклику, коли вона доступна, а потім повертаються до налаштованого `sessionScope` (`per-phone` за замовчуванням або `per-call` для ізольованих викликів).

### Політика інструментів

`realtime.toolPolicy` керує запуском consult:

| Політика         | Поведінка                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Надає інструмент consult і обмежує звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Надає інструмент consult і дозволяє звичайному агенту використовувати звичайну політику інструментів агента.                            |
| `none`           | Не надає інструмент consult. Користувацькі `realtime.tools` все одно передаються провайдеру реального часу.                             |

`realtime.consultPolicy` керує лише інструкціями моделі реального часу:

| Політика      | Вказівки                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `auto`        | Зберігає типовий prompt і дозволяє провайдеру вирішувати, коли викликати інструмент consult.      |
| `substantive` | Відповідає на прості розмовні зв’язки напряму й виконує consult перед фактами, пам’яттю, інструментами або контекстом. |
| `always`      | Виконує consult перед кожною змістовною відповіддю.                                               |

### Голосовий контекст агента

Увімкніть `realtime.agentContext`, коли голосовий міст має звучати як
налаштований агент OpenClaw без витрат на повний round trip agent-consult на
звичайних ходах. Капсула контексту додається один раз під час створення сесії реального часу,
тому вона не додає затримки на кожен хід. Виклики
`openclaw_agent_consult` все одно запускають повного агента OpenClaw і мають використовуватися
для роботи з інструментами, актуальної інформації, пошуку в пам’яті або стану workspace.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeSystemPrompt: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Приклади realtime-провайдерів

<Tabs>
  <Tab title="Google Gemini Live">
    Типові значення: API-ключ із `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` або `GOOGLE_GENERATIVE_AI_API_KEY`; модель
    `gemini-2.5-flash-native-audio-preview-12-2025`; голос `Kore`.
    `sessionResumption` і `contextWindowCompression` типово ввімкнені для довших
    викликів із можливістю повторного підключення. Використовуйте `silenceDurationMs`, `startSensitivity` і
    `endSensitivity`, щоб налаштувати швидший обмін репліками для телефонного аудіо.

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
                consultPolicy: "substantive",
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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

Див. [Google-провайдер](/uk/providers/google) і
[OpenAI-провайдер](/uk/providers/openai), щоб дізнатися про параметри realtime-голосу,
специфічні для провайдера.

## Потокова транскрипція

`streaming` вибирає провайдера realtime-транскрипції для аудіо живого виклику.

Поточна поведінка під час виконання:

- `streaming.provider` необов’язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера realtime-транскрипції.
- Вбудовані провайдери realtime-транскрипції: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми provider plugins.
- Сирова конфігурація, що належить провайдеру, міститься в `streaming.providers.<providerId>`.
- Після того як Twilio надсилає прийняте повідомлення `start` для потоку, Voice Call негайно реєструє потік, ставить вхідні медіадані в чергу через провайдера транскрипції, доки провайдер підключається, і запускає початкове привітання лише після готовності realtime-транскрипції.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або жодного провайдера не зареєстровано, Voice Call записує попередження в журнал і пропускає потокове передавання медіа замість того, щоб завершувати роботу всього plugin з помилкою.

### Приклади streaming-провайдерів

<Tabs>
  <Tab title="OpenAI">
    Типові значення: API-ключ `streaming.providers.openai.apiKey` або
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
    Типові значення: API-ключ `streaming.providers.xai.apiKey` або `XAI_API_KEY`;
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
мовлення під час викликів. Її можна перевизначити в конфігурації plugin із
**такою самою формою** — вона глибоко об’єднується з `messages.tts`.

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

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; зафіксована конфігурація має використовувати `tts.providers.<provider>`.
- Core TTS використовується, коли ввімкнено потокове передавання медіа Twilio; інакше виклики повертаються до нативних для провайдера голосів.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо в цьому стані телефонний TTS недоступний, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного провайдера, Voice Call записує попередження в журнал із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in Twilio або демонтаж потоку очищає чергу очікування TTS, запити на відтворення в черзі завершуються, замість того щоб залишати абонентів у стані очікування завершення відтворення.

### Приклади TTS

<Tabs>
  <Tab title="Лише Core TTS">
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
  <Tab title="Перевизначення на ElevenLabs (лише виклики)">
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
  <Tab title="Перевизначення моделі OpenAI (глибоке об’єднання)">
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
`inboundPolicy: "allowlist"` — це перевірка caller ID із низьким рівнем надійності. Plugin нормалізує надане провайдером значення `From` і порівнює його з `allowFrom`. Перевірка Webhook автентифікує доставку провайдером і цілісність payload, але вона **не** доводить володіння номером абонента PSTN/VoIP. Розглядайте `allowFrom` як фільтрацію caller ID, а не як надійну ідентичність абонента.
</Warning>

Автовідповіді використовують систему агента. Налаштовуйте їх за допомогою `responseModel`, `responseSystemPrompt` і `responseTimeoutMs`.

### Маршрутизація за номером

Використовуйте `numbers`, коли один Plugin Voice Call приймає виклики для кількох телефонних номерів і кожен номер має поводитися як окрема лінія. Наприклад, один номер може використовувати невимушеного персонального асистента, а інший — бізнес-персону, іншого агента відповіді та інший голос TTS.

Маршрути вибираються з наданого провайдером набраного номера `To`. Ключі мають бути номерами E.164. Коли надходить виклик, Voice Call один раз визначає відповідний маршрут, зберігає збіг маршруту в записі виклику та повторно використовує цю ефективну конфігурацію для привітання, класичного шляху автовідповіді, шляху консультації в реальному часі та відтворення TTS. Якщо жоден маршрут не збігається, використовується глобальна конфігурація Voice Call.
Вихідні виклики не використовують `numbers`; передавайте ціль вихідного виклику, повідомлення та сесію явно під час ініціювання виклику.

Перевизначення маршруту наразі підтримують:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Значення маршруту `tts` глибоко об'єднується з глобальною конфігурацією Voice Call `tts`, тож зазвичай можна перевизначити лише голос провайдера:

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

### Контракт голосового виводу

Для автовідповідей Voice Call додає до системного prompt суворий контракт голосового виводу:

```text
{"spoken":"..."}
```

Voice Call обережно витягує текст мовлення:

- Ігнорує payload, позначені як вміст міркування/помилки.
- Розбирає прямий JSON, fenced JSON або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту та видаляє ймовірні вступні абзаци з плануванням/метаданими.

Це утримує голосове відтворення зосередженим на тексті для абонента та запобігає витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив'язана до стану live-відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише тоді, коли початкове привітання активно озвучується.
- Якщо початкове відтворення завершується помилкою, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для стримінгу Twilio починається під час підключення stream без додаткової затримки.
- Barge-in перериває активне відтворення та очищає поставлені в чергу, але ще не відтворювані записи Twilio TTS. Очищені записи вирішуються як пропущені, тож логіка подальшої відповіді може продовжуватися без очікування аудіо, яке ніколи не буде відтворене.
- Голосові розмови в реальному часі використовують власний початковий хід realtime stream. Voice Call **не** надсилає legacy-оновлення `<Say>` TwiML для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` залишаються підключеними.

### Пільговий період відключення stream Twilio

Коли media stream Twilio відключається, Voice Call очікує **2000 ms** перед автоматичним завершенням виклику:

- Якщо stream повторно підключається протягом цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду жоден stream не реєструється повторно, виклик завершується, щоб запобігти завислим активним викликам.

## Засіб очищення застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують термінальний Webhook (наприклад, виклики в режимі сповіщення, які ніколи не завершуються). Значення за замовчуванням — `0` (вимкнено).

Рекомендовані діапазони:

- **Виробниче середовище:** `120`–`300` секунд для потоків у стилі сповіщень.
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

Коли перед Gateway розміщено проксі або тунель, Plugin
відтворює публічну URL-адресу для перевірки підпису. Ці параметри
керують тим, яким перенаправленим заголовкам довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Список дозволених хостів із заголовків перенаправлення.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти перенаправленим заголовкам без списку дозволених хостів.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти перенаправленим заголовкам лише тоді, коли віддалена IP-адреса запиту збігається зі списком.
</ParamField>

Додаткові засоби захисту:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio та Plivo. Повторно відтворені дійсні запити Webhook підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмови Twilio містять токен для кожного ходу в callbacks `<Gather>`, тому застарілі або повторно відтворені мовні callbacks не можуть задовольнити новіший очікуваний хід транскрипта.
- Неавтентифіковані запити Webhook відхиляються до читання тіла, якщо відсутні обов’язкові заголовки підпису провайдера.
- Webhook voice-call використовує спільний профіль тіла перед автентифікацією (64 КБ / 5 секунд), а також обмеження одночасних запитів для кожної IP-адреси перед перевіркою підпису.

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

Коли Gateway уже запущено, операційні команди `voicecall` делегуються
середовищу виконання voice-call, яким володіє Gateway, тому CLI не прив’язує другий
сервер Webhook. Якщо Gateway недоступний, команди повертаються до
автономного середовища виконання CLI.

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call.
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

Цей репозиторій постачає відповідний документ Skills у `skills/voice-call/SKILL.md`.

## Gateway RPC

| Метод               | Аргументи                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` дійсний лише з `mode: "conversation"`. Виклики в режимі notify
мають використовувати `voicecall.dtmf` після створення виклику, якщо їм потрібні
цифри після з’єднання.

## Усунення несправностей

### Налаштуванню не вдається відкрити Webhook назовні

Запускайте налаштування з того самого середовища, у якому працює Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` і `plivo` `webhook-exposure` має бути зеленим.
Налаштований `publicUrl` усе одно не спрацює, якщо він указує на локальний або приватний мережевий
простір, оскільки оператор не може виконати зворотний виклик на ці адреси. Не використовуйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Вихідні виклики Twilio в режимі notify надсилають свій початковий TwiML `<Say>` безпосередньо в
запиті створення виклику, тому перше озвучене повідомлення не залежить від того, чи Twilio
отримає TwiML Webhook. Публічний Webhook усе ще потрібен для callbacks стану,
розмовних викликів, DTMF перед з’єднанням, потоків реального часу та керування викликом
після з’єднання.

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

`voicecall smoke` — це пробний запуск, якщо не передати `--yes`.

### Облікові дані провайдера не проходять перевірку

Перевірте вибраного провайдера та обов’язкові поля облікових даних:

- Twilio: `twilio.accountSid`, `twilio.authToken` і `fromNumber`, або
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` і `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` і
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` і `fromNumber`.

Облікові дані мають існувати на хості Gateway. Редагування локального профілю оболонки
не впливає на вже запущений Gateway, доки його не буде перезапущено або доки він не перезавантажить своє
середовище.

### Виклики починаються, але Webhook провайдера не надходять

Підтвердьте, що консоль провайдера вказує на точну публічну URL-адресу Webhook:

```text
https://voice.example.com/voice/webhook
```

Потім перевірте стан середовища виконання:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Поширені причини:

- `publicUrl` указує на шлях, відмінний від `serve.path`.
- URL тунелю змінився після запуску Gateway.
- Проксі перенаправляє запит, але видаляє або переписує заголовки хоста/proto.
- Брандмауер або DNS спрямовує публічне ім’я хоста кудись інше, а не до Gateway.
- Gateway було перезапущено без увімкненого Plugin Voice Call.

Коли перед Gateway розміщено зворотний проксі або тунель, установіть
`webhookSecurity.allowedHosts` на публічне ім’я хоста або використовуйте
`webhookSecurity.trustedProxyIPs` для відомої адреси проксі. Використовуйте
`webhookSecurity.trustForwardingHeaders` лише тоді, коли межа проксі перебуває під
вашим контролем.

### Перевірка підпису не вдається

Підписи провайдера перевіряються відносно публічної URL-адреси, яку OpenClaw відтворює
з вхідного запиту. Якщо підписи не проходять перевірку:

- Підтвердьте, що URL Webhook провайдера точно збігається з `publicUrl`, включно зі
  схемою, хостом і шляхом.
- Для URL безкоштовного рівня ngrok оновлюйте `publicUrl`, коли змінюється ім’я хоста тунелю.
- Переконайтеся, що проксі зберігає початкові заголовки хоста та proto, або налаштуйте
  `webhookSecurity.allowedHosts`.
- Не вмикайте `skipSignatureVerification` поза локальним тестуванням.

### Підключення Google Meet через Twilio не вдаються

Google Meet використовує цей Plugin для підключень через номер дозвону Twilio. Спершу перевірте Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Потім явно перевірте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Якщо Voice Call зелений, але учасник Meet так і не підключається, перевірте номер дозвону Meet,
PIN і `--dtmf-sequence`. Телефонний виклик може бути справним, тоді як
зустріч відхиляє або ігнорує неправильну послідовність DTMF.

Google Meet запускає телефонну ділянку Twilio через `voicecall.start` із
послідовністю DTMF перед з’єднанням. Послідовності, отримані з PIN, включають
`voiceCall.dtmfDelayMs` Plugin Google Meet як початкові цифри очікування Twilio. Типове значення — 12 секунд,
оскільки підказки дозвону Meet можуть надходити із затримкою. Потім Voice Call перенаправляє назад до
обробки в реальному часі до запиту вступного привітання.

Використовуйте `openclaw logs --follow` для трасування живої фази. Справне підключення Twilio до Meet
записує такий порядок:

- Google Meet делегує підключення Twilio до Voice Call.
- Voice Call зберігає TwiML DTMF перед з’єднанням.
- Початковий TwiML Twilio споживається та віддається перед обробкою в реальному часі.
- Voice Call віддає TwiML реального часу для виклику Twilio.
- Google Meet запитує вступне мовлення через `voicecall.speak` після затримки після DTMF.

`openclaw voicecall tail` усе ще показує збережені записи викликів; це корисно для
стану виклику та транскриптів, але не кожен перехід Webhook/реального часу з’являється
там.

### У виклику реального часу немає мовлення

Підтвердьте, що ввімкнено лише один аудіорежим. `realtime.enabled` і
`streaming.enabled` не можуть одночасно бути `true`.

Для викликів Twilio у реальному часі також перевірте:

- Plugin провайдера реального часу завантажено та зареєстровано.
- `realtime.provider` не встановлено або називає зареєстрованого провайдера.
- API-ключ провайдера доступний процесу Gateway.
- `openclaw logs --follow` показує, що TwiML реального часу віддано, міст реального часу
  запущено, а початкове привітання поставлено в чергу.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
