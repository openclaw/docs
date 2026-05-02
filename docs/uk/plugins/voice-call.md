---
read_when:
    - Ви хочете здійснити вихідний голосовий виклик з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin голосових викликів
    - Вам потрібен голосовий зв’язок у реальному часі або потокове транскрибування для телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові дзвінки через Twilio, Telnyx або Plivo, з необов’язковою підтримкою голосового зв’язку в реальному часі та потокової транскрипції
title: Plugin для голосових викликів
x-i18n:
    generated_at: "2026-05-02T21:59:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосові дзвінки для OpenClaw через plugin. Підтримує вихідні сповіщення,
багатоетапні розмови, повнодуплексний голос у реальному часі, потокову
транскрипцію та вхідні дзвінки з політиками списку дозволених.

**Поточні провайдери:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (розробка/без мережі).

<Note>
Plugin голосових дзвінків працює **всередині процесу Gateway**. Якщо ви використовуєте
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

    Використовуйте пакет без версії, щоб слідувати поточному офіційному тегу релізу. Закріплюйте
    точну версію лише тоді, коли потрібна відтворювана інсталяція.

    Після цього перезапустіть Gateway, щоб plugin завантажився.

  </Step>
  <Step title="Налаштуйте провайдера та webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (див.
    [Конфігурація](#configuration) нижче для повної структури). Мінімально потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і публічно
    доступна URL-адреса webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручно читати в журналах чату й терміналах. Він перевіряє
    увімкнення plugin, облікові дані провайдера, доступність webhook і те, що
    активний лише один аудіорежим (`streaming` або `realtime`). Використовуйте
    `--json` для скриптів.

  </Step>
  <Step title="Smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди за замовчуванням виконуються без реальних дій. Додайте `--yes`, щоб справді здійснити короткий
    вихідний дзвінок-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначатися як **публічна URL-адреса webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний варіант serve
визначається як loopback чи простір приватної мережі, налаштування завершується помилкою замість
запуску провайдера, який не зможе отримувати webhook від оператора.
</Warning>

## Конфігурація

Якщо `enabled: true`, але для вибраного провайдера бракує облікових даних,
під час запуску Gateway записує попередження про неповне налаштування з відсутніми ключами та
пропускає запуск runtime. Команди, RPC-виклики та інструменти агента все одно
повертають точну відсутню конфігурацію провайдера під час використання.

<Note>
Облікові дані voice-call підтримують SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` розв’язуються через стандартну поверхню SecretRef; див. [поверхню облікових даних SecretRef](/uk/reference/secretref-credential-surface).
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
  <Accordion title="Примітки щодо доступності та безпеки провайдера">
    - Twilio, Telnyx і Plivo всі потребують **публічно доступної** URL-адреси webhook.
    - `mock` — локальний провайдер для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безплатному рівні ngrok задайте `publicUrl` як точну URL-адресу ngrok; перевірка підпису завжди застосовується.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL-адреси безплатного рівня ngrok можуть змінюватися або додавати проміжну сторінку; якщо `publicUrl` зміщується, підписи Twilio не проходять перевірку. Для production віддавайте перевагу стабільному домену або funnel Tailscale.

  </Accordion>
  <Accordion title="Ліміти потокових підключень">
    - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
    - `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до старту для кожної вихідної IP-адреси.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувані + активні).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації, що використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI у `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Резервний runtime поки що все ще приймає старі ключі voice-call, але
    шлях переписування — `openclaw doctor --fix`, а shim сумісності є
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

За замовчуванням Voice Call використовує `sessionScope: "per-phone"`, щоб повторні дзвінки від
того самого абонента зберігали пам’ять розмови. Установіть `sessionScope: "per-call"`, коли
кожен дзвінок оператора має починатися зі свіжим контекстом, наприклад для рецепції,
бронювання, IVR або потоків мосту Google Meet, де той самий номер телефону може
представляти різні зустрічі.

## Голосові розмови в реальному часі

`realtime` вибирає провайдера повнодуплексного голосу в реальному часі для live-аудіо
дзвінка. Це окремо від `streaming`, який лише передає аудіо
провайдерам транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим для кожного дзвінка.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого зареєстрованого провайдера голосу в реальному часі.
- Вбудовані провайдери голосу в реальному часі: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми plugin провайдерів.
- Сира конфігурація, що належить провайдеру, міститься в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням надає спільний інструмент `openclaw_agent_consult` у реальному часі. Модель реального часу може викликати його, коли абонент просить глибшого міркування, актуальної інформації або звичайних інструментів OpenClaw.
- `realtime.fastContext.enabled` за замовчуванням вимкнено. Коли ввімкнено, Voice Call спочатку шукає проіндексовану пам’ять/контекст сесії для consult-запитання та повертає ці фрагменти моделі реального часу в межах `realtime.fastContext.timeoutMs`, перш ніж відкотитися до повного consult-агента лише якщо `realtime.fastContext.fallbackToConsult` дорівнює true.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або жодного провайдера голосу в реальному часі не зареєстровано, Voice Call записує попередження та пропускає realtime-медіа замість збою всього plugin.
- Ключі consult-сесії повторно використовують збережену сесію дзвінка, коли вона доступна, а потім відкочуються до налаштованого `sessionScope` (`per-phone` за замовчуванням або `per-call` для ізольованих дзвінків).

### Політика інструментів

`realtime.toolPolicy` керує запуском consult:

| Політика         | Поведінка                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Надає інструмент consult і обмежує звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Надає інструмент consult і дозволяє звичайному агенту використовувати стандартну політику інструментів агента.                           |
| `none`           | Не надає інструмент consult. Користувацькі `realtime.tools` усе одно передаються провайдеру реального часу.                              |

### Приклади провайдерів реального часу

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
[провайдера OpenAI](/uk/providers/openai) для параметрів голосу в реальному часі,
специфічних для провайдера.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для live-аудіо дзвінка.

Поточна поведінка runtime:

- `streaming.provider` необов’язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми плагінами провайдерів.
- Сирова конфігурація, що належить провайдеру, розміщується в `streaming.providers.<providerId>`.
- Після того як Twilio надсилає прийняте повідомлення потоку `start`, Voice Call негайно реєструє потік, ставить вхідні медіадані в чергу через провайдера транскрипції, поки провайдер підключається, і запускає початкове привітання лише після готовності транскрипції в реальному часі.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або жодного не зареєстровано, Voice Call записує попередження в журнал і пропускає потокове передавання медіа замість того, щоб завершити роботу всього плагіна з помилкою.

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
мовлення під час викликів. Її можна перевизначити в конфігурації плагіна з
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
**Microsoft speech ігнорується для голосових викликів.** Телефонне аудіо потребує PCM;
поточний транспорт Microsoft не надає телефонний PCM-вивід.
</Warning>

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації плагіна (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; зафіксована конфігурація має використовувати `tts.providers.<provider>`.
- Core TTS використовується, коли потокове передавання медіа Twilio увімкнене; інакше виклики повертаються до власних голосів провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS недоступний у такому стані, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in Twilio або демонтаж потоку очищає чергу TTS, відкладені запити на відтворення завершуються, а не залишають абонентів очікувати завершення відтворення.

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
`inboundPolicy: "allowlist"` — це перевірка caller-ID із низьким рівнем гарантії. Плагін
нормалізує надане провайдером значення `From` і порівнює його з
`allowFrom`. Перевірка Webhook автентифікує доставку провайдером і
цілісність payload, але вона **не** доводить право власності на номер
абонента PSTN/VoIP. Сприймайте `allowFrom` як фільтрацію caller-ID, а не як надійну
ідентичність абонента.
</Warning>

Автовідповіді використовують систему агентів. Налаштовуйте їх за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Маршрутизація за номером

Використовуйте `numbers`, коли один плагін Voice Call приймає виклики для кількох телефонних
номерів і кожен номер має поводитися як окрема лінія. Наприклад, один
номер може використовувати невимушеного персонального асистента, а інший — бізнес-персону,
іншого агента відповіді та інший голос TTS.

Маршрути вибираються з наданого провайдером набраного номера `To`. Ключі мають бути
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

Значення маршруту `tts` глибоко об’єднується поверх глобальної конфігурації Voice Call `tts`, тож
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

### Контракт мовного виводу

Для автовідповідей Voice Call додає до системного prompt суворий контракт мовного виводу:

```text
{"spoken":"..."}
```

Voice Call захисно витягує текст мовлення:

- Ігнорує payloads, позначені як вміст reasoning/error.
- Розбирає прямий JSON, fenced JSON або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє ймовірні вступні абзаци планування/метаданих.

Це зосереджує мовне відтворення на тексті для абонента й запобігає
потраплянню тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив’язана до поточного
стану відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише тоді, коли початкове привітання активно промовляється.
- Якщо початкове відтворення завершується помилкою, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio запускається під час підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищає записи Twilio TTS, які вже стоять у черзі, але ще не відтворюються. Очищені записи завершуються як пропущені, тож логіка подальшої відповіді може продовжити роботу без очікування аудіо, яке ніколи не буде відтворено.
- Голосові розмови в реальному часі використовують власний початковий хід потоку в реальному часі. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тож вихідні сеанси `<Connect><Stream>` залишаються приєднаними.

### Grace-період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає **2000 мс** перед
автоматичним завершенням виклику:

- Якщо потік повторно підключається протягом цього вікна, автоматичне завершення скасовується.
- Якщо після grace-періоду жоден потік не реєструється повторно, виклик завершується, щоб уникнути завислих активних викликів.

## Reaper застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують термінальний
webhook (наприклад, виклики в режимі notify, які ніколи не завершуються). Типове значення
— `0` (вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі notify.
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

Коли proxy або tunnel розміщено перед Gateway, плагін
реконструює публічну URL-адресу для перевірки підпису. Ці параметри
керують тим, яким forwarded-заголовкам довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Allowlist хостів із forwarding-заголовків.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти forwarded-заголовкам без allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти forwarded-заголовкам лише тоді, коли віддалена IP-адреса запиту збігається зі списком.
</ParamField>

Додаткові захисти:

- **Захист від replay** Webhook увімкнено для Twilio і Plivo. Повторно відтворені чинні webhook-запити підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмови Twilio містять токен для кожного ходу в callback-викликах `<Gather>`, тому застарілі/повторно відтворені speech callback-виклики не можуть задовольнити новіший очікуваний хід транскрипта.
- Неавтентифіковані webhook-запити відхиляються до читання тіла, якщо обов’язкові заголовки підпису провайдера відсутні.
- Webhook voice-call використовує спільний pre-auth body profile (64 КБ / 5 секунд) плюс обмеження кількості одночасних запитів для кожної IP-адреси перед перевіркою підпису.

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
runtime voice-call, що належить Gateway, щоб CLI не прив’язував другий
webhook-сервер. Якщо Gateway недоступний, команди повертаються до
автономного runtime CLI.

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

Цей репозиторій постачається з відповідним документом skill у `skills/voice-call/SKILL.md`.

## Gateway RPC

| Метод                | Аргументи                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` дійсний лише з `mode: "conversation"`. Виклики в режимі сповіщення
мають використовувати `voicecall.dtmf` після створення виклику, якщо їм потрібні
цифри після з’єднання.

## Усунення несправностей

### Налаштування не проходить перевірку експонування Webhook

Запустіть налаштування з того самого середовища, у якому працює Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` і `plivo` `webhook-exposure` має бути зеленим. Налаштований
`publicUrl` усе одно зазнає невдачі, якщо вказує на локальний або приватний
мережевий простір, бо оператор не може виконати зворотний виклик на ці адреси. Не використовуйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Вихідні виклики Twilio в режимі сповіщення надсилають початковий `<Say>` TwiML безпосередньо в
запиті create-call, тому перше озвучене повідомлення не залежить від того, чи Twilio
отримає Webhook TwiML. Публічний Webhook усе ще потрібен для статусних зворотних викликів,
розмовних викликів, DTMF перед з’єднанням, потоків реального часу та керування викликом
після з’єднання.

Використовуйте один шлях публічного експонування:

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

Після зміни конфігурації перезапустіть або перезавантажте Gateway, потім виконайте:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` є пробним запуском, якщо не передати `--yes`.

### Облікові дані провайдера не працюють

Перевірте вибраного провайдера та потрібні поля облікових даних:

- Twilio: `twilio.accountSid`, `twilio.authToken` і `fromNumber`, або
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` і `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` і
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` і `fromNumber`.

Облікові дані мають існувати на хості Gateway. Редагування локального профілю оболонки
не впливає на вже запущений Gateway, доки він не перезапуститься або не перезавантажить своє
середовище.

### Виклики запускаються, але Webhook провайдера не надходять

Переконайтеся, що консоль провайдера вказує на точну публічну URL-адресу Webhook:

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

- `publicUrl` вказує на інший шлях, ніж `serve.path`.
- URL тунелю змінився після запуску Gateway.
- Проксі пересилає запит, але видаляє або переписує заголовки host/proto.
- Брандмауер або DNS спрямовує публічне ім’я хоста кудись не на Gateway.
- Gateway було перезапущено без увімкненого Plugin Voice Call.

Коли перед Gateway стоїть зворотний проксі або тунель, задайте
`webhookSecurity.allowedHosts` як публічне ім’я хоста або використайте
`webhookSecurity.trustedProxyIPs` для відомої адреси проксі. Використовуйте
`webhookSecurity.trustForwardingHeaders` лише тоді, коли межа проксі перебуває під
вашим контролем.

### Перевірка підпису не вдається

Підписи провайдера перевіряються відносно публічної URL-адреси, яку OpenClaw відтворює
з вхідного запиту. Якщо підписи не проходять перевірку:

- Переконайтеся, що URL Webhook провайдера точно відповідає `publicUrl`, включно зі
  схемою, хостом і шляхом.
- Для URL безплатного рівня ngrok оновлюйте `publicUrl`, коли змінюється ім’я хоста тунелю.
- Переконайтеся, що проксі зберігає оригінальні заголовки host і proto, або налаштуйте
  `webhookSecurity.allowedHosts`.
- Не вмикайте `skipSignatureVerification` поза локальним тестуванням.

### Приєднання Google Meet через Twilio не вдаються

Google Meet використовує цей Plugin для приєднань через набір номера Twilio. Спершу перевірте Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Потім явно перевірте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Якщо Voice Call зелений, але учасник Meet так і не приєднується, перевірте номер набору
Meet, PIN і `--dtmf-sequence`. Телефонний виклик може бути справним, тоді як
зустріч відхиляє або ігнорує неправильну послідовність DTMF.

Google Meet передає послідовність DTMF Meet і вступний текст до `voicecall.start`.
Для викликів Twilio Voice Call спочатку віддає DTMF TwiML, перенаправляє назад до
Webhook, а потім відкриває медіапотік реального часу, щоб збережений вступ був згенерований
після того, як телефонний учасник приєднався до зустрічі.

Використовуйте `openclaw logs --follow` для живого трасування фази. Успішне приєднання
Twilio Meet записує журнали в такому порядку:

- Google Meet делегує приєднання Twilio до Voice Call.
- Voice Call зберігає DTMF TwiML перед з’єднанням.
- Початковий TwiML Twilio споживається та віддається перед обробкою реального часу.
- Voice Call віддає TwiML реального часу для виклику Twilio.
- Міст реального часу запускається з початковим привітанням у черзі.

`openclaw voicecall tail` усе ще показує збережені записи викликів; це корисно для
стану виклику та транскриптів, але не кожен перехід Webhook/реального часу з’являється
там.

### У виклику реального часу немає мовлення

Переконайтеся, що увімкнено лише один аудіорежим. `realtime.enabled` і
`streaming.enabled` не можуть одночасно бути true.

Для викликів Twilio реального часу також перевірте:

- Plugin провайдера реального часу завантажений і зареєстрований.
- `realtime.provider` не заданий або називає зареєстрованого провайдера.
- API-ключ провайдера доступний процесу Gateway.
- `openclaw logs --follow` показує, що TwiML реального часу віддано, міст реального часу
  запущено, а початкове привітання поставлено в чергу.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
