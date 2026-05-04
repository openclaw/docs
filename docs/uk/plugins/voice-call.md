---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin для голосових викликів
    - Вам потрібен голосовий зв’язок у реальному часі або потокова транскрипція для телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові дзвінки через Twilio, Telnyx або Plivo, за потреби з голосовим зв’язком у реальному часі та потоковою транскрипцією
title: Plugin для голосових викликів
x-i18n:
    generated_at: "2026-05-04T04:47:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec2c22dcc9073572963744685a432328787bcedb14025e0326c20d9d842f857
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосові виклики для OpenClaw через plugin. Підтримує вихідні сповіщення,
багатокрокові розмови, повнодуплексний голос у реальному часі, потокову
транскрипцію та вхідні виклики з політиками списку дозволених.

**Поточні провайдери:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (розробка/без мережі).

<Note>
Voice Call plugin працює **всередині процесу Gateway**. Якщо ви використовуєте
віддалений Gateway, установіть і налаштуйте plugin на машині, де працює
Gateway, а потім перезапустіть Gateway, щоб його завантажити.
</Note>

## Швидкий старт

<Steps>
  <Step title="Установіть plugin">
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

    Використовуйте пакет без версії, щоб відстежувати поточний офіційний тег релізу. Закріплюйте
    точну версію лише тоді, коли потрібне відтворюване встановлення.

    Після цього перезапустіть Gateway, щоб plugin завантажився.

  </Step>
  <Step title="Налаштуйте провайдера та webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (повну структуру див.
    у розділі [Конфігурація](#configuration) нижче). Мінімально потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і публічно
    доступний URL webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Стандартний вивід зручно читати в чат-журналах і терміналах. Він перевіряє
    ввімкнення plugin, облікові дані провайдера, доступність webhook і те, що
    активний лише один аудіорежим (`streaming` або `realtime`). Використовуйте
    `--json` для скриптів.

  </Step>
  <Step title="Smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди за замовчуванням виконуються як dry run. Додайте `--yes`, щоб фактично здійснити короткий
    вихідний виклик-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначати **публічний URL webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний варіант serve
визначається як loopback чи приватний мережевий простір, налаштування завершується помилкою замість
запуску провайдера, який не зможе отримувати carrier webhooks.
</Warning>

## Конфігурація

Якщо `enabled: true`, але для вибраного провайдера бракує облікових даних,
під час запуску Gateway записує попередження про неповне налаштування з відсутніми ключами та
пропускає запуск runtime. Команди, RPC-виклики й інструменти агента все одно
повертають точну відсутню конфігурацію провайдера під час використання.

<Note>
Облікові дані Voice-call приймають SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` визначаються через стандартну поверхню SecretRef; див. [поверхню облікових даних SecretRef](/uk/reference/secretref-credential-surface).
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
  <Accordion title="Нотатки про доступність провайдера та безпеку">
    - Twilio, Telnyx і Plivo потребують **публічно доступного** URL webhook.
    - `mock` — це локальний провайдер для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безкоштовному тарифі ngrok задайте `publicUrl` як точний URL ngrok; перевірка підпису завжди примусова.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Twilio webhooks з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL безкоштовного тарифу Ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміщується, підписи Twilio не проходять перевірку. Для продакшну надавайте перевагу стабільному домену або Tailscale funnel.

  </Accordion>
  <Accordion title="Ліміти потокових підключень">
    - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих pre-start сокетів.
    - `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані pre-start сокети для кожної вихідної IP-адреси.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів media stream (pending + active).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації з `provider: "log"`, `twilio.from` або застарілими
    ключами OpenAI `streaming.*` переписуються командою `openclaw doctor --fix`.
    Runtime fallback поки що приймає старі ключі voice-call, але
    шлях переписування — `openclaw doctor --fix`, а compat shim є
    тимчасовим.

    Автоматично мігровані ключі streaming:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Область сесії

За замовчуванням Voice Call використовує `sessionScope: "per-phone"`, тому повторні виклики від
того самого абонента зберігають пам’ять розмови. Задайте `sessionScope: "per-call"`, коли
кожен carrier call має починатися зі свіжого контексту, наприклад для рецепції,
бронювання, IVR або потоків моста Google Meet, де один і той самий номер телефону може
представляти різні зустрічі.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного голосового провайдера в реальному часі для живого аудіо
виклику. Це окремо від `streaming`, який лише передає аудіо
провайдерам транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим для кожного виклику.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` необов’язковий. Якщо не задано, Voice Call використовує першого зареєстрованого голосового провайдера в реальному часі.
- Вбудовані голосові провайдери в реальному часі: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми provider plugins.
- Сирий конфіг, яким володіє провайдер, розміщується в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням відкриває спільний realtime-інструмент `openclaw_agent_consult`. Realtime-модель може викликати його, коли абонент просить глибше міркування, актуальну інформацію або звичайні інструменти OpenClaw.
- `realtime.fastContext.enabled` за замовчуванням вимкнено. Коли ввімкнено, Voice Call спочатку шукає індексовану пам’ять/контекст сесії для consult-запитання та повертає ці фрагменти realtime-моделі протягом `realtime.fastContext.timeoutMs`, перш ніж переходити до повного consult-агента, лише якщо `realtime.fastContext.fallbackToConsult` дорівнює true.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або жодного голосового провайдера в реальному часі не зареєстровано, Voice Call записує попередження та пропускає realtime media замість того, щоб зупиняти весь plugin з помилкою.
- Ключі consult-сесії повторно використовують збережену сесію виклику, коли вона доступна, а потім повертаються до налаштованого `sessionScope` (`per-phone` за замовчуванням або `per-call` для ізольованих викликів).

### Політика інструментів

`realtime.toolPolicy` керує consult-запуском:

| Політика         | Поведінка                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Відкрити consult-інструмент і обмежити звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Відкрити consult-інструмент і дозволити звичайному агенту використовувати стандартну політику інструментів агента.                       |
| `none`           | Не відкривати consult-інструмент. Користувацькі `realtime.tools` все одно передаються realtime-провайдеру.                               |

### Приклади realtime-провайдерів

<Tabs>
  <Tab title="Google Gemini Live">
    Типові значення: API-ключ із `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` або `GOOGLE_GENERATIVE_AI_API_KEY`; модель
    `gemini-2.5-flash-native-audio-preview-12-2025`; голос `Kore`.
    `sessionResumption` і `contextWindowCompression` за замовчуванням увімкнені для довших,
    відновлюваних викликів. Використовуйте `silenceDurationMs`, `startSensitivity` і
    `endSensitivity`, щоб налаштувати швидше передавання черги мовлення для телефонного аудіо.

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

Див. [провайдер Google](/uk/providers/google) та
[провайдер OpenAI](/uk/providers/openai) щодо параметрів голосу в реальному часі,
специфічних для провайдера.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для аудіо живого дзвінка.

Поточна поведінка runtime:

- `streaming.provider` необов’язковий. Якщо не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) та xAI (`xai`), зареєстровані їхніми provider plugins.
- Сирий конфіг, що належить провайдеру, розміщується в `streaming.providers.<providerId>`.
- Після того як Twilio надішле прийняте повідомлення `start` потоку, Voice Call негайно реєструє потік, ставить вхідні медіа в чергу через провайдера транскрипції, поки провайдер підключається, і запускає початкове привітання лише після готовності транскрипції в реальному часі.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або жодного не зареєстровано, Voice Call записує попередження в журнал і пропускає потокове передавання медіа замість того, щоб завершити весь plugin з помилкою.

### Приклади провайдерів потокового передавання

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
    endpoint `wss://api.x.ai/v1/stt`; кодування `mulaw`; частота дискретизації `8000`;
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

## TTS для дзвінків

Voice Call використовує основну конфігурацію `messages.tts` для потокового
мовлення під час дзвінків. Її можна перевизначити в конфігу plugin з
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
**Microsoft speech ігнорується для голосових дзвінків.** Телефонному аудіо потрібен PCM;
поточний транспорт Microsoft не надає вихід PCM для телефонії.
</Warning>

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігу plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; зафіксований конфіг має використовувати `tts.providers.<provider>`.
- Core TTS використовується, коли ввімкнено потокове передавання медіа Twilio; інакше дзвінки повертаються до нативних голосів провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS недоступний у такому стані, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in Twilio або розбір потоку очищує чергу TTS в очікуванні, запити відтворення в черзі завершуються, а не залишають абонентів чекати завершення відтворення.

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
  <Tab title="Перевизначення на ElevenLabs (лише дзвінки)">
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

## Вхідні дзвінки

Для вхідної політики типове значення — `disabled`. Щоб увімкнути вхідні дзвінки, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — це перевірка caller-ID з низьким рівнем надійності. Plugin нормалізує надане провайдером значення `From` і порівнює його з `allowFrom`. Перевірка Webhook автентифікує доставку провайдером і цілісність payload, але **не** доводить право власності на номер абонента PSTN/VoIP. Розглядайте `allowFrom` як фільтрацію caller-ID, а не як надійну ідентичність абонента.
</Warning>

Автовідповіді використовують систему agent. Налаштовуйте за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Маршрутизація за номером

Використовуйте `numbers`, коли один Voice Call plugin приймає дзвінки для кількох телефонних номерів і кожен номер має поводитися як окрема лінія. Наприклад, один номер може використовувати неформального персонального асистента, а інший — бізнес-персону, іншого agent для відповіді та інший голос TTS.

Маршрути вибираються з наданого провайдером набраного номера `To`. Ключі мають бути номерами E.164. Коли надходить дзвінок, Voice Call один раз визначає відповідний маршрут, зберігає знайдений маршрут у записі дзвінка та повторно використовує цей ефективний конфіг для привітання, класичного шляху автовідповіді, шляху консультації в реальному часі та відтворення TTS. Якщо жоден маршрут не збігається, використовується глобальний конфіг Voice Call.
Вихідні дзвінки не використовують `numbers`; передавайте вихідну ціль, повідомлення та
сесію явно під час ініціювання дзвінка.

Перевизначення маршруту наразі підтримують:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Значення маршруту `tts` глибоко об’єднується поверх глобального конфігу Voice Call `tts`, тож зазвичай можна перевизначити лише голос провайдера:

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

### Контракт мовленнєвого виводу

Для автовідповідей Voice Call додає до системного prompt суворий контракт мовленнєвого виводу:

```text
{"spoken":"..."}
```

Voice Call захисно витягує текст мовлення:

- Ігнорує payload, позначені як вміст reasoning/error.
- Розбирає прямий JSON, JSON у fenced-блоці або inline-ключі `"spoken"`.
- Повертається до звичайного тексту та видаляє ймовірні вступні абзаци планування/метаданих.

Це утримує мовленнєве відтворення сфокусованим на тексті для абонента й запобігає
витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків `conversation` обробка першого повідомлення прив’язана до стану живого відтворення:

- Очищення черги barge-in та автовідповідь пригнічуються лише тоді, коли початкове привітання активно промовляється.
- Якщо початкове відтворення завершується помилкою, дзвінок повертається до `listening`, а початкове повідомлення лишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio запускається під час підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищує записи Twilio TTS, які стоять у черзі, але ще не відтворюються. Очищені записи завершуються як пропущені, тож логіка подальшої відповіді може продовжуватися без очікування аудіо, яке ніколи не відтвориться.
- Голосові розмови в реальному часі використовують власний початковий turn потоку в реальному часі. Voice Call **не** надсилає legacy-оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` лишаються підключеними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає **2000 ms** перед
автоматичним завершенням дзвінка:

- Якщо потік повторно підключається протягом цього вікна, автозавершення скасовується.
- Якщо після пільгового періоду жоден потік не реєструється повторно, дзвінок завершується, щоб запобігти завислим активним дзвінкам.

## Прибирач застарілих дзвінків

Використовуйте `staleCallReaperSeconds`, щоб завершувати дзвінки, які ніколи не отримують термінальний webhook (наприклад, дзвінки в notify-режимі, які ніколи не завершуються). Типове значення — `0` (вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків notify-типу.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні дзвінки могли завершитися. Хороша початкова точка — `maxDurationSeconds + 30–60` секунд.

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

Коли proxy або tunnel розміщено перед Gateway, plugin реконструює публічний URL для перевірки підпису. Ці параметри керують тим, яким forwarded-заголовкам довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Список дозволених host з forwarding-заголовків.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти forwarded-заголовкам без allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти forwarded-заголовкам лише тоді, коли віддалений IP запиту збігається зі списком.
</ParamField>

Додаткові засоби захисту:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio та Plivo. Повторно відтворені дійсні webhook-запити підтверджуються, але пропускаються для побічних ефектів.
- Conversation turns Twilio містять токен для кожного turn у callbacks `<Gather>`, тож застарілі/повторно відтворені мовленнєві callbacks не можуть задовольнити новіший очікуваний transcript turn.
- Неавтентифіковані webhook-запити відхиляються до читання body, якщо відсутні потрібні signature-заголовки провайдера.
- Webhook voice-call використовує спільний pre-auth body profile (64 KB / 5 seconds) плюс per-IP in-flight cap перед перевіркою підпису.

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

Коли Gateway вже запущено, операційні команди `voicecall` делегують
runtime голосового виклику, яким володіє Gateway, щоб CLI не прив’язував другий
сервер webhook. Якщо жоден Gateway недоступний, команди повертаються до
автономного runtime CLI.

`latency` читає `calls.jsonl` зі стандартного шляху зберігання голосових викликів.
Використовуйте `--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити
аналіз останніми N записами (за замовчуванням 200). Вивід містить p50/p90/p99
для затримки ходу й часу очікування прослуховування.

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

Цей репозиторій постачає відповідний документ skill за адресою `skills/voice-call/SKILL.md`.

## RPC Gateway

| Метод               | Аргументи                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` дійсний лише з `mode: "conversation"`. Виклики в notify-mode
мають використовувати `voicecall.dtmf` після створення виклику, якщо їм потрібні
цифри після з’єднання.

## Усунення несправностей

### Налаштуванню не вдається оприлюднити Webhook

Запускайте налаштування з того самого середовища, у якому працює Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` і `plivo` `webhook-exposure` має бути зеленим. Налаштований
`publicUrl` усе одно завершується помилкою, коли він указує на локальний або приватний
мережевий простір, оскільки оператор не може викликати ці адреси у зворотному напрямку. Не використовуйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Вихідні виклики Twilio у notify-mode надсилають свій початковий `<Say>` TwiML безпосередньо в
запит create-call, тому перше озвучене повідомлення не залежить від того, чи Twilio
отримає webhook TwiML. Публічний Webhook усе ще потрібен для callback-ів стану,
розмовних викликів, DTMF до з’єднання, потоків реального часу й керування викликом
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

`voicecall smoke` є пробним запуском, якщо ви не передасте `--yes`.

### Облікові дані провайдера не проходять перевірку

Перевірте вибраного провайдера й обов’язкові поля облікових даних:

- Twilio: `twilio.accountSid`, `twilio.authToken` і `fromNumber`, або
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` і `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` і
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` і `fromNumber`.

Облікові дані мають існувати на хості Gateway. Редагування локального shell-профілю
не впливає на вже запущений Gateway, доки він не перезапуститься або не перезавантажить
своє середовище.

### Виклики починаються, але Webhook-и провайдера не надходять

Підтвердьте, що консоль провайдера вказує на точну публічну URL-адресу Webhook:

```text
https://voice.example.com/voice/webhook
```

Потім перевірте стан runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Поширені причини:

- `publicUrl` указує на інший шлях, ніж `serve.path`.
- URL тунелю змінився після запуску Gateway.
- Проксі пересилає запит, але видаляє або переписує заголовки host/proto.
- Firewall або DNS спрямовує публічне ім’я хоста кудись інде, а не до Gateway.
- Gateway було перезапущено без увімкненого Plugin Voice Call.

Коли перед Gateway стоїть reverse proxy або тунель, установіть
`webhookSecurity.allowedHosts` на публічне ім’я хоста або використовуйте
`webhookSecurity.trustedProxyIPs` для відомої адреси проксі. Використовуйте
`webhookSecurity.trustForwardingHeaders` лише тоді, коли межа проксі перебуває під
вашим контролем.

### Перевірка підпису не проходить

Підписи провайдера перевіряються відносно публічної URL-адреси, яку OpenClaw відновлює
з вхідного запиту. Якщо підписи не проходять перевірку:

- Підтвердьте, що URL Webhook провайдера точно збігається з `publicUrl`, включно зі
  схемою, хостом і шляхом.
- Для URL безкоштовного рівня ngrok оновлюйте `publicUrl`, коли ім’я хоста тунелю змінюється.
- Переконайтеся, що проксі зберігає початкові заголовки host і proto, або налаштуйте
  `webhookSecurity.allowedHosts`.
- Не вмикайте `skipSignatureVerification` поза локальним тестуванням.

### Приєднання Google Meet Twilio не вдаються

Google Meet використовує цей Plugin для приєднань Twilio через dial-in. Спочатку перевірте Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Потім явно перевірте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Якщо Voice Call зелений, але учасник Meet так і не приєднується, перевірте номер
dial-in Meet, PIN і `--dtmf-sequence`. Телефонний виклик може бути справним, тоді як
зустріч відхиляє або ігнорує неправильну послідовність DTMF.

Google Meet передає послідовність DTMF Meet і вступний текст до `voicecall.start`.
Для викликів Twilio Voice Call спершу обслуговує DTMF TwiML, перенаправляє назад до
Webhook, а потім відкриває медіапотік реального часу, щоб збережений вступ генерувався
після того, як телефонний учасник приєднався до зустрічі.

Використовуйте `openclaw logs --follow` для трасування живої фази. Справне приєднання
Twilio Meet записує журнали в такому порядку:

- Google Meet делегує приєднання Twilio до Voice Call.
- Voice Call зберігає DTMF TwiML до з’єднання.
- Початковий TwiML Twilio споживається й обслуговується перед обробкою реального часу.
- Voice Call обслуговує TwiML реального часу для виклику Twilio.
- Міст реального часу запускається з початковим привітанням у черзі.

`openclaw voicecall tail` усе ще показує збережені записи викликів; це корисно для
стану виклику й транскриптів, але не кожен Webhook-перехід або перехід реального часу
з’являється там.

### Виклик реального часу не має мовлення

Підтвердьте, що ввімкнено лише один аудіорежим. `realtime.enabled` і
`streaming.enabled` не можуть одночасно бути `true`.

Для викликів Twilio у реальному часі також перевірте:

- Plugin провайдера реального часу завантажено й зареєстровано.
- `realtime.provider` не встановлено або називає зареєстрованого провайдера.
- API-ключ провайдера доступний процесу Gateway.
- `openclaw logs --follow` показує, що TwiML реального часу обслуговано, міст реального часу
  запущено, а початкове привітання поставлено в чергу.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Text-to-speech](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
