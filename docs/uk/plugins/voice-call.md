---
read_when:
    - Ви хочете здійснити вихідний голосовий виклик з OpenClaw
    - Ви налаштовуєте або розробляєте voice-call plugin
    - Вам потрібен голос у реальному часі або потокова транскрипція для телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні й приймайте вхідні голосові виклики через Twilio, Telnyx або Plivo, з необов’язковим голосовим зв’язком у реальному часі та потоковою транскрипцією.
title: Plugin голосових викликів
x-i18n:
    generated_at: "2026-06-27T18:07:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
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
Plugin Voice Call працює **всередині процесу Gateway**. Якщо ви використовуєте
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

    Використовуйте пакет без версії, щоб стежити за поточним офіційним тегом релізу. Закріплюйте
    точну версію лише тоді, коли потрібне відтворюване встановлення.

    Після цього перезапустіть Gateway, щоб plugin завантажився.

  </Step>
  <Step title="Налаштуйте провайдера й webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (повну структуру див.
    у розділі [Конфігурація](#configuration) нижче). Мінімально потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і загальнодоступна
    URL-адреса webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручно читати в журналах чату й терміналах. Він перевіряє,
    чи ввімкнено plugin, облікові дані провайдера, доступність webhook і те,
    що активний лише один аудіорежим (`streaming` або `realtime`). Використовуйте
    `--json` для скриптів.

  </Step>
  <Step title="Smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди за замовчуванням виконуються як пробні запуски. Додайте `--yes`, щоб справді здійснити короткий
    вихідний виклик-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначати **публічну URL-адресу webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний serve-варіант
визначається як loopback чи приватний мережевий простір, налаштування завершується помилкою замість
запуску провайдера, який не може отримувати webhook від операторів.
</Warning>

## Конфігурація

Якщо `enabled: true`, але для вибраного провайдера бракує облікових даних,
під час запуску Gateway у журналі з’являється попередження про неповне налаштування з відсутніми ключами, і
запуск runtime пропускається. Команди, RPC-виклики та інструменти агента все одно
повертають точну відсутню конфігурацію провайдера під час використання.

<Note>
Облікові дані voice-call приймають SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` розв’язуються через стандартну поверхню SecretRef; див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
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
                  openai: { speakerVoice: "alloy" },
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
  <Accordion title="Нотатки про доступність і безпеку провайдера">
    - Twilio, Telnyx і Plivo всі потребують **публічно доступної** URL-адреси webhook.
    - `mock` — локальний провайдер для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не має значення true.
    - `skipSignatureVerification` призначений лише для локального тестування.
    - На безплатному рівні ngrok задайте `publicUrl` як точну URL-адресу ngrok; перевірка підпису завжди примусова.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL безплатного рівня Ngrok можуть змінюватися або додавати проміжну сторінку; якщо `publicUrl` зсувається, підписи Twilio не проходять перевірку. Для продакшну: віддавайте перевагу стабільному домену або Tailscale funnel.

  </Accordion>
  <Accordion title="Обмеження потокових з’єднань">
    - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
    - `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані сокети до старту на IP-адресу джерела.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікуваних + активних).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації, що використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI у `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Runtime fallback поки що все ще приймає старі ключі voice-call, але
    шлях переписування — це `openclaw doctor --fix`, а compat shim
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

За замовчуванням Voice Call використовує `sessionScope: "per-phone"`, щоб повторні виклики від
того самого абонента зберігали пам’ять розмови. Установіть `sessionScope: "per-call"`, коли
кожен операторський виклик має починатися зі свіжого контексту, наприклад для рецепції,
бронювання, IVR або мостів Google Meet, де той самий номер телефону може
представляти різні зустрічі.

Voice Call зберігає згенеровані ключі сесій у налаштованому просторі імен агента
(`agent:<agentId>:voice:*`), щоб пам’ять викликів переживала канонікалізацію ключів сесій
Gateway після перезапусків. Сирі явні ключі інтеграції використовують той самий
простір імен агента. Канонічний ключ `agent:<configuredAgentId>:*` зберігає цього власника,
а його основні псевдоніми поважають core `session.mainKey` і глобальну область. Чужий або
неправильно сформований ввід `agent:*` обмежується як непрозорий ключ у межах налаштованого агента;
`global` і `unknown` залишаються глобальними sentinel-значеннями. Запуск Gateway просуває старіші
сирі ключі в типових або `{agentId}`-шаблонізованих сховищах, де шлях доводить одного
власника. У фіксованих користувацьких сховищах неоднозначні застарілі рядки лишаються недоторканими, бо
вони не містять достатньо інформації, щоб вибрати власника; нові виклики використовують
канонічну історію в області агента.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного провайдера голосу в реальному часі для живого аудіо
виклику. Він відокремлений від `streaming`, який лише пересилає аудіо
провайдерам транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим для кожного виклику.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` необов’язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера голосу в реальному часі.
- Вбудовані провайдери голосу в реальному часі: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми provider plugins.
- Сира конфігурація, якою володіє провайдер, розміщується в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням відкриває спільний realtime-інструмент `openclaw_agent_consult`. Realtime-модель може викликати його, коли абонент просить глибшого міркування, актуальної інформації або звичайних інструментів OpenClaw.
- `realtime.consultPolicy` необов’язково додає настанови щодо того, коли realtime-модель має викликати `openclaw_agent_consult`.
- `realtime.agentContext.enabled` за замовчуванням вимкнено. Коли ввімкнено, Voice Call додає обмежену ідентичність агента та вибрану капсулу файлів робочого простору до інструкцій realtime-провайдера під час налаштування сесії.
- `realtime.fastContext.enabled` за замовчуванням вимкнено. Коли ввімкнено, Voice Call спершу шукає індексовану пам’ять/контекст сесії для consult-запитання й повертає ці фрагменти realtime-моделі в межах `realtime.fastContext.timeoutMs`, перш ніж переходити до повного consult-агента лише якщо `realtime.fastContext.fallbackToConsult` має значення true.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або взагалі немає зареєстрованого провайдера голосу в реальному часі, Voice Call записує попередження й пропускає realtime-медіа замість того, щоб провалити весь plugin.
- Ключі consult-сесії повторно використовують збережену сесію виклику, коли вона доступна, а потім повертаються до налаштованого `sessionScope` (`per-phone` за замовчуванням або `per-call` для ізольованих викликів).

### Політика інструментів

`realtime.toolPolicy` керує consult-запуском:

| Політика         | Поведінка                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Відкриває consult-інструмент і обмежує звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Відкриває consult-інструмент і дозволяє звичайному агенту використовувати нормальну політику інструментів агента.                                                      |
| `none`           | Не відкриває consult-інструмент. Користувацькі `realtime.tools` все одно передаються realtime-провайдеру.                               |

`realtime.consultPolicy` керує лише інструкціями realtime-моделі:

| Політика      | Настанова                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Залишає типовий prompt і дозволяє провайдеру вирішувати, коли викликати consult-інструмент.              |
| `substantive` | Відповідає на прості розмовні зв’язки напряму й звертається до consult перед фактами, пам’яттю, інструментами або контекстом. |
| `always`      | Звертається до consult перед кожною змістовною відповіддю.                                                        |

### Голосовий контекст агента

Увімкніть `realtime.agentContext`, коли голосовий міст має звучати як
налаштований агент OpenClaw без повного циклу звернення до агента на
звичайних ходах. Капсула контексту додається один раз під час створення
сеансу реального часу, тому вона не додає затримки на кожен хід. Виклики
`openclaw_agent_consult` усе одно запускають повного агента OpenClaw і мають
використовуватися для роботи з інструментами, поточної інформації, пошуку в
пам’яті або стану робочого простору.

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

### Приклади провайдерів реального часу

<Tabs>
  <Tab title="Google Gemini Live">
    Типові значення: API-ключ із `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` або `GOOGLE_GENERATIVE_AI_API_KEY`; модель
    `gemini-2.5-flash-native-audio-preview-12-2025`; голос `Kore`.
    `sessionResumption` і `contextWindowCompression` типово ввімкнені для
    довших викликів із можливістю повторного підключення. Використовуйте
    `silenceDurationMs`, `startSensitivity` і `endSensitivity`, щоб
    налаштувати швидшу зміну черги мовлення для телефонного аудіо.

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
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    speakerVoice: "Kore",
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

Див. [провайдер Google](/uk/providers/google) і
[провайдер OpenAI](/uk/providers/openai), щоб дізнатися про параметри голосу
реального часу, специфічні для провайдера.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції реального часу для живого аудіо
дзвінка.

Поточна поведінка середовища виконання:

- `streaming.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції реального часу.
- Вбудовані провайдери транскрипції реального часу: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми Plugin провайдерів.
- Необроблена конфігурація, якою володіє провайдер, розміщується в `streaming.providers.<providerId>`.
- Після того як Twilio надсилає прийняте повідомлення `start` потоку, Voice Call негайно реєструє потік, ставить вхідні медіадані в чергу через провайдера транскрипції, поки провайдер підключається, і запускає початкове привітання лише після готовності транскрипції реального часу.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або жодного провайдера не зареєстровано, Voice Call записує попередження в журнал і пропускає потокове передавання медіа замість того, щоб зупинити весь Plugin з помилкою.

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

## TTS для дзвінків

Voice Call використовує основну конфігурацію `messages.tts` для потокового
мовлення під час дзвінків. Ви можете перевизначити її в конфігурації Plugin з
**такою самою формою** — вона глибоко об’єднується з `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Мовлення Microsoft ігнорується для голосових дзвінків.** Телефонному аудіо потрібен PCM;
поточний транспорт Microsoft не надає телефонний PCM-вивід.
</Warning>

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; зафіксована конфігурація має використовувати `tts.providers.<provider>`.
- Основний TTS використовується, коли потокове передавання медіа Twilio ввімкнене; інакше дзвінки повертаються до нативних голосів провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS у цьому стані недоступний, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли переривання Twilio або завершення потоку очищає чергу TTS, що очікує, поставлені в чергу запити відтворення завершуються, а не залишають абонентів у стані очікування завершення відтворення.

### Приклади TTS

<Tabs>
  <Tab title="Лише основний TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
                speakerVoice: "marin",
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
`inboundPolicy: "allowlist"` — це перевірка ідентифікатора абонента з низьким рівнем гарантії.
Plugin нормалізує надане провайдером значення `From` і порівнює його з
`allowFrom`. Перевірка Webhook автентифікує доставку провайдером і
цілісність корисного навантаження, але **не** доводить володіння номером
абонента PSTN/VoIP. Розглядайте `allowFrom` як фільтрацію за ідентифікатором
абонента, а не як надійну ідентичність абонента.
</Warning>

Автовідповіді використовують систему агента. Налаштовуйте їх за допомогою
`responseModel`, `responseSystemPrompt` і `responseTimeoutMs`.

### Маршрутизація за номером

Використовуйте `numbers`, коли один Plugin Voice Call приймає дзвінки для
кількох телефонних номерів і кожен номер має поводитися як окрема лінія.
Наприклад, один номер може використовувати невимушеного особистого помічника,
а інший — бізнес-персону, іншого агента відповіді та інший голос TTS.

Маршрути вибираються з наданого провайдером набраного номера `To`. Ключі мають
бути номерами E.164. Коли надходить дзвінок, Voice Call один раз визначає
відповідний маршрут, зберігає зіставлений маршрут у записі дзвінка й повторно
використовує цю ефективну конфігурацію для привітання, класичного шляху
автовідповіді, шляху консультації в реальному часі та відтворення TTS. Якщо
маршрут не збігається, використовується глобальна конфігурація Voice Call.
Вихідні дзвінки не використовують `numbers`; під час ініціювання дзвінка
передавайте вихідну ціль, повідомлення та сеанс явно.

Перевизначення маршруту наразі підтримують:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Значення маршруту `tts` глибоко об’єднується поверх глобальної конфігурації
Voice Call `tts`, тому зазвичай можна перевизначити лише голос провайдера:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Контракт усного виводу

Для автовідповідей Voice Call додає суворий контракт усного виводу до
системного промпта:

```text
{"spoken":"..."}
```

Voice Call захисно витягує текст мовлення:

- Ігнорує корисні навантаження, позначені як вміст міркування/помилки.
- Розбирає прямий JSON, JSON у fenced-блоці або вбудовані ключі `"spoken"`.
- Повертається до простого тексту й видаляє ймовірні вступні абзаци з плануванням або метаданими.

Це утримує усне відтворення зосередженим на тексті для абонента й запобігає
потраплянню тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків `conversation` обробка першого повідомлення прив’язана
до живого стану відтворення:

- Очищення черги при перериванні та автовідповідь пригнічуються лише тоді, коли початкове привітання активно промовляється.
- Якщо початкове відтворення завершується помилкою, дзвінок повертається до стану `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio починається під час підключення потоку без додаткової затримки.
- Переривання скасовує активне відтворення й очищає поставлені в чергу, але ще не відтворювані записи Twilio TTS. Очищені записи завершуються як пропущені, тому логіка подальшої відповіді може продовжуватися без очікування аудіо, яке ніколи не відтвориться.
- Голосові розмови в реальному часі використовують власний початковий хід потоку реального часу. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сеанси `<Connect><Stream>` залишаються підключеними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio від’єднується, Voice Call чекає **2000 мс** перед
автоматичним завершенням виклику:

- Якщо потік повторно під’єднується протягом цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду жоден потік не реєструється повторно, виклик завершується, щоб запобігти завислим активним викликам.

## Очищувач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують термінальний
webhook (наприклад, виклики в режимі сповіщення, які ніколи не завершуються). Типове значення
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

Коли перед Gateway стоїть проксі або тунель, Plugin
відтворює публічну URL-адресу для перевірки підпису. Ці параметри
керують тим, яким пересланим заголовкам довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Список дозволених хостів із заголовків пересилання.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти пересланим заголовкам без списку дозволених хостів.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти пересланим заголовкам лише тоді, коли віддалена IP-адреса запиту збігається зі списком.
</ParamField>

Додаткові засоби захисту:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio та Plivo. Повторно відтворені дійсні webhook-запити підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмови Twilio містять токен для кожного ходу в зворотних викликах `<Gather>`, тому застарілі або повторно відтворені зворотні виклики мовлення не можуть задовольнити новіший очікуваний хід транскрипту.
- Неавтентифіковані webhook-запити відхиляються до читання тіла, якщо відсутні обов’язкові заголовки підпису провайдера.
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

Коли Gateway уже запущено, операційні команди `voicecall` делегуються
середовищу виконання voice-call, яким володіє Gateway, щоб CLI не прив’язував другий
webhook-сервер. Якщо Gateway недоступний, команди повертаються до
автономного середовища виконання CLI.

`latency` читає `calls.jsonl` із типового шляху сховища voice-call.
Використовуйте `--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити
аналіз останніми N записами (типово 200). Вивід містить p50/p90/p99
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

Plugin voice-call постачається з відповідною Skills агента.

## RPC Gateway

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

### Налаштування не може відкрити webhook

Запускайте налаштування з того самого середовища, у якому працює Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` і `plivo` `webhook-exposure` має бути зеленим. Налаштований
`publicUrl` усе одно зазнає помилки, якщо вказує на локальний або приватний мережевий
простір, тому що оператор не може викликати ці адреси назад. Не використовуйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Вихідні виклики Twilio в режимі сповіщення надсилають початковий TwiML `<Say>` безпосередньо в
запиті створення виклику, тому перше озвучене повідомлення не залежить від того, чи Twilio
отримає webhook TwiML. Публічний webhook усе одно потрібен для зворотних викликів стану,
розмовних викликів, DTMF до з’єднання, потоків реального часу та керування викликом
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

`voicecall smoke` — це пробний запуск, якщо ви не передасте `--yes`.

### Облікові дані провайдера не проходять перевірку

Перевірте вибраного провайдера та обов’язкові поля облікових даних:

- Twilio: `twilio.accountSid`, `twilio.authToken` і `fromNumber`, або
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` і `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` і
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` і `fromNumber`.

Облікові дані мають існувати на хості Gateway. Редагування локального профілю оболонки
не впливає на вже запущений Gateway, доки його не буде перезапущено або доки він не перезавантажить
своє середовище.

### Виклики запускаються, але webhook провайдера не надходять

Переконайтеся, що консоль провайдера вказує на точну публічну URL-адресу webhook:

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

- `publicUrl` вказує на інший шлях, ніж `serve.path`.
- URL тунелю змінився після запуску Gateway.
- Проксі пересилає запит, але видаляє або переписує заголовки host/proto.
- Брандмауер або DNS спрямовує публічне ім’я хоста кудись, окрім Gateway.
- Gateway було перезапущено без увімкненого Plugin Voice Call.

Коли перед Gateway стоїть зворотний проксі або тунель, установіть
`webhookSecurity.allowedHosts` на публічне ім’я хоста або використовуйте
`webhookSecurity.trustedProxyIPs` для відомої адреси проксі. Використовуйте
`webhookSecurity.trustForwardingHeaders` лише тоді, коли межа проксі перебуває під
вашим контролем.

### Перевірка підпису не вдається

Підписи провайдера перевіряються щодо публічної URL-адреси, яку OpenClaw відтворює
з вхідного запиту. Якщо підписи не проходять перевірку:

- Переконайтеся, що URL webhook провайдера точно збігається з `publicUrl`, включно зі
  схемою, хостом і шляхом.
- Для URL ngrok безплатного рівня оновлюйте `publicUrl`, коли змінюється ім’я хоста тунелю.
- Переконайтеся, що проксі зберігає оригінальні заголовки host і proto, або налаштуйте
  `webhookSecurity.allowedHosts`.
- Не вмикайте `skipSignatureVerification` поза локальним тестуванням.

### Збої приєднання Google Meet через Twilio

Google Meet використовує цей Plugin для приєднання через телефонний набір Twilio. Спочатку перевірте Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Потім явно перевірте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Якщо Voice Call у зеленому стані, але учасник Meet ніколи не приєднується, перевірте
номер телефонного набору Meet, PIN і `--dtmf-sequence`. Телефонний виклик може бути справним, тоді як
зустріч відхиляє або ігнорує неправильну послідовність DTMF.

Google Meet запускає телефонну гілку Twilio через `voicecall.start` із
послідовністю DTMF до з’єднання. Послідовності, похідні від PIN, містять
`voiceCall.dtmfDelayMs` Plugin Google Meet як початкові цифри очікування Twilio. Типове значення — 12 секунд,
тому що підказки телефонного входу Meet можуть надходити із запізненням. Потім Voice Call переспрямовує назад до
обробки в реальному часі перед запитом вступного привітання.

Використовуйте `openclaw logs --follow` для трасування живої фази. Справне приєднання Twilio Meet
реєструє такий порядок:

- Google Meet делегує приєднання Twilio до Voice Call.
- Voice Call зберігає TwiML DTMF до з’єднання.
- Початковий TwiML Twilio споживається та обслуговується перед обробкою в реальному часі.
- Voice Call обслуговує TwiML реального часу для виклику Twilio.
- Google Meet запитує вступне мовлення через `voicecall.speak` після затримки після DTMF.

`openclaw voicecall tail` усе ще показує збережені записи викликів; це корисно для
стану виклику та транскриптів, але не кожен webhook або перехід реального часу з’являється
там.

### Виклик у реальному часі не має мовлення

Переконайтеся, що ввімкнено лише один аудіорежим. `realtime.enabled` і
`streaming.enabled` не можуть одночасно мати значення true.

Для викликів Twilio у реальному часі також перевірте:

- Plugin провайдера реального часу завантажено та зареєстровано.
- `realtime.provider` не встановлено або називає зареєстрованого провайдера.
- API-ключ провайдера доступний процесу Gateway.
- `openclaw logs --follow` показує, що TwiML реального часу обслуговано, міст реального часу
  запущено, а початкове привітання поставлено в чергу.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
