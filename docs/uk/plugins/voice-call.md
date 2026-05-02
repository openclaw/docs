---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin голосових викликів
    - Вам потрібен голос у реальному часі або потокова транскрипція в телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові дзвінки через Twilio, Telnyx або Plivo, з опційним голосом у реальному часі та потоковою транскрипцією
title: Plugin голосових викликів
x-i18n:
    generated_at: "2026-05-02T09:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосові виклики для OpenClaw через plugin. Підтримує вихідні сповіщення,
багатоходові розмови, повнодуплексний голос у реальному часі, потокову
транскрипцію та вхідні виклики з політиками allowlist.

**Поточні провайдери:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (розробка/без мережі).

<Note>
Plugin Voice Call працює **усередині процесу Gateway**. Якщо ви використовуєте
віддалений Gateway, установіть і налаштуйте plugin на машині, де працює
Gateway, а потім перезапустіть Gateway, щоб завантажити його.
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

    Якщо npm повідомляє, що пакет, яким володіє OpenClaw, застарілий, ця версія пакета
    походить зі старішої зовнішньої лінійки пакетів; використовуйте поточну пакетовану збірку
    OpenClaw або шлях до локальної папки, доки не буде опубліковано новіший npm-пакет.

    Після цього перезапустіть Gateway, щоб plugin завантажився.

  </Step>
  <Step title="Налаштуйте провайдера й webhook">
    Установіть конфігурацію в `plugins.entries.voice-call.config` (див.
    [Конфігурація](#configuration) нижче для повної структури). Мінімально потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і публічно
    доступний URL webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручний для читання в журналах чату й терміналах. Він перевіряє
    увімкнення plugin, облікові дані провайдера, доступність webhook, а також те,
    що активний лише один аудіорежим (`streaming` або `realtime`). Використовуйте
    `--json` для скриптів.

  </Step>
  <Step title="Smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди за замовчуванням виконують пробний запуск без реального виклику. Додайте `--yes`, щоб фактично здійснити короткий
    вихідний виклик-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначатися як **публічний URL webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний варіант serve
визначається як loopback чи простір приватної мережі, налаштування завершується помилкою замість
запуску провайдера, який не зможе отримувати carrier webhooks.
</Warning>

## Конфігурація

Якщо `enabled: true`, але для вибраного провайдера бракує облікових даних,
під час запуску Gateway у журнал записується попередження setup-incomplete з відсутніми ключами, і
runtime не запускається. Команди, RPC-виклики та інструменти агента все одно
повертають точну відсутню конфігурацію провайдера під час використання.

<Note>
Облікові дані voice-call підтримують SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` визначаються через стандартну поверхню SecretRef; див. [поверхню облікових даних SecretRef](/uk/reference/secretref-credential-surface).
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
  <Accordion title="Нотатки щодо доступності провайдера та безпеки">
    - Twilio, Telnyx і Plivo вимагають **публічно доступного** URL webhook.
    - `mock` — локальний dev-провайдер (без мережевих викликів).
    - Telnyx вимагає `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначений лише для локального тестування.
    - На безкоштовному рівні ngrok установіть `publicUrl` у точний URL ngrok; перевірка підпису завжди примусово застосовується.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Twilio webhooks з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL безкоштовного рівня Ngrok можуть змінюватися або додавати проміжну сторінку; якщо `publicUrl` зміститься, підписи Twilio не пройдуть перевірку. Для продакшну надавайте перевагу стабільному домену або Tailscale funnel.

  </Accordion>
  <Accordion title="Ліміти потокових підключень">
    - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
    - `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані сокети до старту для кожної вихідної IP-адреси.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікуваних + активних).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації, що використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Runtime fallback поки що приймає старі ключі voice-call, але
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

## Область сесії

За замовчуванням Voice Call використовує `sessionScope: "per-phone"`, щоб повторні виклики від
того самого абонента зберігали пам’ять розмови. Установіть `sessionScope: "per-call"`, коли
кожен carrier call має починатися зі свіжого контексту, наприклад для рецепції,
бронювання, IVR або bridge-потоків Google Meet, де той самий номер телефону може
представляти різні зустрічі.

## Голосові розмови в реальному часі

`realtime` вибирає провайдера повнодуплексного голосу в реальному часі для live call
audio. Це окремо від `streaming`, який лише пересилає аудіо
провайдерам транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим для кожного виклику.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` необов’язковий. Якщо не задано, Voice Call використовує першого зареєстрованого провайдера голосу в реальному часі.
- Вбудовані провайдери голосу в реальному часі: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми provider plugins.
- Сира конфігурація, якою володіє провайдер, розміщується в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням надає спільний realtime-інструмент `openclaw_agent_consult`. Модель realtime може викликати його, коли абонент просить глибшого міркування, актуальної інформації або звичайних інструментів OpenClaw.
- `realtime.fastContext.enabled` за замовчуванням вимкнено. Коли ввімкнено, Voice Call спочатку шукає індексовану пам’ять/контекст сесії для consult-запитання й повертає ці фрагменти realtime-моделі в межах `realtime.fastContext.timeoutMs`, перш ніж повертатися до повного consult-агента лише якщо `realtime.fastContext.fallbackToConsult` дорівнює true.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або жоден провайдер голосу в реальному часі взагалі не зареєстрований, Voice Call записує попередження в журнал і пропускає realtime media замість того, щоб завершити роботу всього plugin з помилкою.
- Ключі consult-сесії повторно використовують збережену сесію виклику, коли вона доступна, а потім повертаються до налаштованого `sessionScope` (`per-phone` за замовчуванням або `per-call` для ізольованих викликів).

### Політика інструментів

`realtime.toolPolicy` керує consult-запуском:

| Політика         | Поведінка                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Надає consult-інструмент і обмежує звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Надає consult-інструмент і дозволяє звичайному агенту використовувати нормальну політику інструментів агента.                           |
| `none`           | Не надає consult-інструмент. Користувацькі `realtime.tools` усе одно передаються провайдеру realtime.                                  |

### Приклади провайдерів realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Типові значення: API-ключ із `realtime.providers.google.apiKey`,
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
[провайдера OpenAI](/uk/providers/openai) для специфічних для провайдера опцій голосу realtime.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для live call audio.

Поточна поведінка runtime:

- `streaming.provider` необов'язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого постачальника транскрипції в реальному часі.
- Вбудовані постачальники транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми provider plugins.
- Сира конфігурація, що належить постачальнику, зберігається в `streaming.providers.<providerId>`.
- Після того як Twilio надсилає прийняте повідомлення `start` потоку, Voice Call негайно реєструє потік, ставить вхідні медіа в чергу через постачальника транскрипції, поки постачальник підключається, і запускає початкове привітання лише після готовності транскрипції в реальному часі.
- Якщо `streaming.provider` вказує на незареєстрованого постачальника або жодного постачальника не зареєстровано, Voice Call записує попередження в журнал і пропускає потокове передавання медіа замість того, щоб спричинити збій усього Plugin.

### Приклади постачальників потокового передавання

<Tabs>
  <Tab title="OpenAI">
    Типові значення: ключ API `streaming.providers.openai.apiKey` або
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
    Типові значення: ключ API `streaming.providers.xai.apiKey` або `XAI_API_KEY`;
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
мовлення під час викликів. Її можна перевизначити в конфігурації Plugin з
**такою самою формою** — вона глибоко зливається з `messages.tts`.

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

- Застарілі ключі `tts.<provider>` у конфігурації Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; зафіксована в репозиторії конфігурація має використовувати `tts.providers.<provider>`.
- Основний TTS використовується, коли ввімкнено потокове передавання медіа Twilio; інакше виклики повертаються до нативних голосів постачальника.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS недоступний у цьому стані, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного постачальника, Voice Call записує попередження з ланцюжком постачальників (`from`, `to`, `attempts`) для налагодження.
- Коли втручання Twilio або демонтаж потоку очищає чергу TTS, запити на відтворення в черзі завершуються замість того, щоб залишати абонентів у стані очікування завершення відтворення.

### Приклади TTS

<Tabs>
  <Tab title="Лише основний TTS">
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
  <Tab title="Перевизначення моделі OpenAI (глибоке злиття)">
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

Типова вхідна політика — `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — це перевірка ідентифікатора абонента з низькою гарантією. Plugin нормалізує надане постачальником значення `From` і порівнює його з `allowFrom`. Перевірка Webhook автентифікує доставку постачальником і цілісність корисного навантаження, але **не** доводить володіння номером абонента PSTN/VoIP. Розглядайте `allowFrom` як фільтрацію за caller ID, а не як надійну ідентичність абонента.
</Warning>

Автовідповіді використовують систему агентів. Налаштовуйте за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Маршрутизація за номером

Використовуйте `numbers`, коли один Voice Call plugin приймає виклики для кількох телефонних
номерів і кожен номер має поводитися як окрема лінія. Наприклад, один
номер може використовувати невимушеного персонального помічника, а інший — бізнес-
персону, іншого агента відповіді та інший голос TTS.

Маршрути вибираються з наданого постачальником набраного номера `To`. Ключі мають бути
номерами E.164. Коли надходить виклик, Voice Call один раз визначає відповідний маршрут,
зберігає зіставлений маршрут у записі виклику та повторно використовує цю ефективну конфігурацію
для привітання, класичного шляху автовідповіді, шляху консультації в реальному часі та
відтворення TTS. Якщо жоден маршрут не збігається, використовується глобальна конфігурація Voice Call.
Вихідні виклики не використовують `numbers`; передавайте вихідну ціль, повідомлення та
сеанс явно під час ініціювання виклику.

Перевизначення маршрутів наразі підтримують:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Значення маршруту `tts` глибоко зливається поверх глобальної конфігурації Voice Call `tts`, тож
зазвичай можна перевизначити лише голос постачальника:

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

### Контракт мовленого виводу

Для автовідповідей Voice Call додає строгий контракт мовленого виводу до
системного prompt:

```text
{"spoken":"..."}
```

Voice Call захисно витягує текст мовлення:

- Ігнорує корисні навантаження, позначені як вміст reasoning/помилки.
- Розбирає прямий JSON, JSON у fenced-блоці або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє ймовірні вступні абзаци планування/метаопису.

Це зосереджує мовлене відтворення на тексті для абонента й запобігає
потраплянню тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив'язана до поточного
стану відтворення:

- Очищення черги через втручання й автовідповідь пригнічуються лише тоді, коли початкове привітання активно промовляється.
- Якщо початкове відтворення завершується помилкою, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio запускається під час підключення потоку без додаткової затримки.
- Втручання перериває активне відтворення й очищає поставлені в чергу, але ще не відтворювані записи Twilio TTS. Очищені записи завершуються як пропущені, тож логіка подальшої відповіді може продовжуватися без очікування аудіо, яке ніколи не буде відтворено.
- Голосові розмови в реальному часі використовують власний початковий хід realtime-потоку. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сеанси `<Connect><Stream>` залишаються приєднаними.

### Пільговий період від'єднання потоку Twilio

Коли медіапотік Twilio від'єднується, Voice Call чекає **2000 мс** перед
автоматичним завершенням виклику:

- Якщо потік повторно підключається протягом цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду жоден потік не реєструється повторно, виклик завершується, щоб запобігти завислим активним викликам.

## Прибирач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують термінальний
Webhook (наприклад, виклики в режимі сповіщення, що ніколи не завершуються). Типове значення
— `0` (вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі сповіщення.
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

Коли перед Gateway стоїть проксі або тунель, Plugin
реконструює публічну URL-адресу для перевірки підпису. Ці параметри
керують тим, яким forwarded-заголовкам довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Список дозволених хостів із forwarding-заголовків.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти forwarded-заголовкам без списку дозволених.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти forwarded-заголовкам лише тоді, коли віддалена IP-адреса запиту збігається зі списком.
</ParamField>

Додатковий захист:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio і Plivo. Повторно відтворені чинні webhook-запити підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмови Twilio містять токен для кожного ходу в callback-викликах `<Gather>`, тому застарілі/повторно відтворені callback-виклики мовлення не можуть задовольнити новіший очікуваний хід транскрипту.
- Неавтентифіковані webhook-запити відхиляються до читання тіла, коли відсутні обов'язкові signature-заголовки постачальника.
- Webhook voice-call використовує спільний pre-auth профіль тіла (64 КБ / 5 секунд) плюс ліміт одночасних запитів на IP перед перевіркою підпису.

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
voice-call runtime, що належить Gateway, щоб CLI не прив'язував другий
webhook-сервер. Якщо Gateway недоступний, команди повертаються до
самостійного CLI runtime.

`latency` читає `calls.jsonl` зі стандартного шляху зберігання voice-call.
Використовуйте `--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити
аналіз останніми N записами (за замовчуванням 200). Вивід містить p50/p90/p99
для затримки ходу та часу очікування слухання.

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

Цей репозиторій постачається з відповідним документом Skills за адресою `skills/voice-call/SKILL.md`.

## Gateway RPC

| Метод               | Аргументи                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` чинний лише з `mode: "conversation"`. Виклики в режимі сповіщення
мають використовувати `voicecall.dtmf` після створення виклику, якщо їм потрібні
цифри після з’єднання.

## Усунення несправностей

### Налаштування не проходить через доступність webhook

Запустіть налаштування з того самого середовища, у якому працює Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` і `plivo` стан `webhook-exposure` має бути зеленим. Налаштований
`publicUrl` усе одно не проходить перевірку, якщо він указує на локальний або приватний мережевий
простір, оскільки оператор не може виконати зворотний виклик на ці адреси. Не використовуйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Вихідні виклики Twilio в режимі сповіщення надсилають початковий `<Say>` TwiML безпосередньо в
запиті створення виклику, тому перше промовлене повідомлення не залежить від того, чи Twilio
отримає webhook TwiML. Публічний webhook усе одно потрібен для зворотних викликів стану,
розмовних викликів, DTMF до з’єднання, потоків у реальному часі та керування викликом
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

`voicecall smoke` є пробним запуском, якщо не передати `--yes`.

### Облікові дані провайдера не проходять перевірку

Перевірте вибраного провайдера та обов’язкові поля облікових даних:

- Twilio: `twilio.accountSid`, `twilio.authToken` і `fromNumber` або
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` і `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` і
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` і `fromNumber`.

Облікові дані мають існувати на хості Gateway. Редагування локального профілю оболонки
не впливає на вже запущений Gateway, доки він не перезапуститься або не перезавантажить своє
середовище.

### Виклики починаються, але webhook-и провайдера не надходять

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
- URL тунелю змінилася після запуску Gateway.
- Проксі пересилає запит, але видаляє або переписує заголовки host/proto.
- Брандмауер або DNS спрямовує публічне ім’я хоста кудись, окрім Gateway.
- Gateway було перезапущено без увімкненого Plugin Voice Call.

Коли перед Gateway стоїть зворотний проксі або тунель, задайте
`webhookSecurity.allowedHosts` як публічне ім’я хоста або використовуйте
`webhookSecurity.trustedProxyIPs` для відомої адреси проксі. Використовуйте
`webhookSecurity.trustForwardingHeaders` лише тоді, коли межа проксі перебуває
під вашим контролем.

### Перевірка підпису не проходить

Підписи провайдера перевіряються за публічною URL-адресою, яку OpenClaw відтворює
з вхідного запиту. Якщо перевірка підписів не проходить:

- Переконайтеся, що URL webhook провайдера точно збігається з `publicUrl`, включно зі
  схемою, хостом і шляхом.
- Для URL ngrok безплатного рівня оновлюйте `publicUrl`, коли змінюється ім’я хоста тунелю.
- Переконайтеся, що проксі зберігає оригінальні заголовки host і proto, або налаштуйте
  `webhookSecurity.allowedHosts`.
- Не вмикайте `skipSignatureVerification` поза локальним тестуванням.

### Не вдається приєднатися до Google Meet через Twilio

Google Meet використовує цей Plugin для приєднання через телефонний набір Twilio. Спочатку перевірте Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Потім явно перевірте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Якщо Voice Call має зелений стан, але учасник Meet так і не приєднується, перевірте номер
для телефонного підключення Meet, PIN і `--dtmf-sequence`. Телефонний виклик може бути справним, тоді як
зустріч відхиляє або ігнорує неправильну DTMF-послідовність.

Google Meet передає DTMF-послідовність Meet і вступний текст у `voicecall.start`.
Для викликів Twilio Voice Call спочатку віддає DTMF TwiML, переспрямовує назад до
webhook, а потім відкриває медіапотік у реальному часі, щоб збережений вступ генерувався
після того, як телефонний учасник приєднався до зустрічі.

Використовуйте `openclaw logs --follow` для живого трасування фази. Справне приєднання Twilio Meet
реєструє такий порядок:

- Google Meet делегує приєднання Twilio до Voice Call.
- Voice Call зберігає DTMF TwiML до з’єднання.
- Початковий TwiML Twilio споживається й віддається перед обробкою в реальному часі.
- Voice Call віддає TwiML реального часу для виклику Twilio.
- Міст реального часу запускається з початковим привітанням у черзі.

`openclaw voicecall tail` усе ще показує збережені записи викликів; це корисно для
стану виклику й транскриптів, але не кожен webhook-перехід або перехід реального часу
там з’являється.

### Виклик у реальному часі не має мовлення

Переконайтеся, що ввімкнено лише один аудіорежим. `realtime.enabled` і
`streaming.enabled` не можуть одночасно бути true.

Для викликів Twilio у реальному часі також перевірте:

- Plugin провайдера реального часу завантажено та зареєстровано.
- `realtime.provider` не задано або він називає зареєстрованого провайдера.
- API-ключ провайдера доступний процесу Gateway.
- `openclaw logs --follow` показує, що TwiML реального часу віддано, міст реального часу
  запущено, а початкове привітання поставлено в чергу.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Синтез мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
