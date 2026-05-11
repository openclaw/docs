---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте плагін для голосових викликів
    - Вам потрібен голос у реальному часі або потокова транскрипція в телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні й приймайте вхідні голосові виклики через Twilio, Telnyx або Plivo з опційним голосовим зв’язком у реальному часі та потоковою транскрипцією
title: Plugin голосових викликів
x-i18n:
    generated_at: "2026-05-11T20:53:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94e3942b8330ebf2014f1899267f69f8a135859cfa1002ae390244a4f89883d6
    source_path: plugins/voice-call.md
    workflow: 16
---

Plugin голосових викликів для OpenClaw. Підтримує вихідні сповіщення,
багатоетапні розмови, повнодуплексний голос у реальному часі, потокову
транскрипцію та вхідні виклики з політиками списку дозволених.

**Поточні провайдери:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (розробка/без мережі).

<Note>
Plugin голосових викликів працює **всередині процесу Gateway**. Якщо ви використовуєте
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

    Використовуйте базовий пакет, щоб стежити за поточним офіційним тегом релізу. Закріплюйте
    точну версію лише тоді, коли потрібна відтворювана інсталяція.

    Після цього перезапустіть Gateway, щоб Plugin завантажився.

  </Step>
  <Step title="Налаштуйте провайдера й Webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (повну структуру див.
    у розділі [Конфігурація](#configuration) нижче). Мінімально потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і публічно
    доступна URL-адреса Webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Стандартний вивід зручний для читання в журналах чату й терміналах. Він перевіряє
    ввімкнення Plugin, облікові дані провайдера, доступність Webhook і те, що
    активний лише один аудіорежим (`streaming` або `realtime`). Використовуйте
    `--json` для скриптів.

  </Step>
  <Step title="Smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди стандартно виконуються як пробні запуски. Додайте `--yes`, щоб фактично здійснити короткий
    вихідний виклик-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначатися як **публічна URL-адреса Webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний варіант serve
визначається як loopback чи приватний мережевий простір, налаштування завершується помилкою замість
запуску провайдера, який не зможе отримувати Webhook від оператора.
</Warning>

## Конфігурація

Якщо `enabled: true`, але для вибраного провайдера бракує облікових даних,
під час запуску Gateway записує попередження про неповне налаштування з відсутніми ключами та
пропускає запуск runtime. Команди, RPC-виклики й інструменти агента все одно
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
  <Accordion title="Нотатки щодо доступності провайдера й безпеки">
    - Twilio, Telnyx і Plivo всі потребують **публічно доступної** URL-адреси Webhook.
    - `mock` — це локальний провайдер для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безплатному рівні ngrok задайте `publicUrl` як точну URL-адресу ngrok; перевірка підпису завжди застосовується.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL-адреси безплатного рівня Ngrok можуть змінюватися або додавати проміжну сторінку; якщо `publicUrl` зміщується, підписи Twilio не проходять перевірку. Для production віддавайте перевагу стабільному домену або funnel Tailscale.

  </Accordion>
  <Accordion title="Обмеження потокових підключень">
    - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів перед стартом.
    - `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані сокети перед стартом для кожної IP-адреси джерела.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів media stream (очікуваних + активних).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації, що використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Резервний runtime поки що приймає старі ключі voice-call, але
    шлях переписування — `openclaw doctor --fix`, а сумісний shim є
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

Стандартно Plugin голосових викликів використовує `sessionScope: "per-phone"`, щоб повторні виклики від
того самого абонента зберігали пам’ять розмови. Задайте `sessionScope: "per-call"`, коли
кожен виклик оператора має починатися зі свіжого контексту, наприклад для ресепшена,
бронювання, IVR або потоків мосту Google Meet, де той самий номер телефону може
представляти різні зустрічі.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного голосового провайдера реального часу для живого аудіо
виклику. Це окремо від `streaming`, який лише пересилає аудіо до
провайдерів транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим для кожного виклику.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` необов’язковий. Якщо його не задано, Plugin голосових викликів використовує першого зареєстрованого голосового провайдера реального часу.
- Вбудовані голосові провайдери реального часу: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми провайдерськими Plugin.
- Сира конфігурація, що належить провайдеру, розміщується в `realtime.providers.<providerId>`.
- Plugin голосових викликів стандартно відкриває спільний інструмент реального часу `openclaw_agent_consult`. Модель реального часу може викликати його, коли абонент просить глибшого міркування, актуальної інформації або звичайних інструментів OpenClaw.
- `realtime.consultPolicy` необов’язково додає вказівки щодо того, коли модель реального часу має викликати `openclaw_agent_consult`.
- `realtime.agentContext.enabled` стандартно вимкнено. Коли ввімкнено, Plugin голосових викликів додає обмежену ідентичність агента, перевизначення системного prompt і вибрану капсулу файлів робочої області до інструкцій провайдера реального часу під час налаштування сесії.
- `realtime.fastContext.enabled` стандартно вимкнено. Коли ввімкнено, Plugin голосових викликів спершу шукає питання консультації в індексованій пам’яті/контексті сесії та повертає ці фрагменти моделі реального часу в межах `realtime.fastContext.timeoutMs`, перш ніж перейти до повного агента консультації лише якщо `realtime.fastContext.fallbackToConsult` дорівнює true.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або якщо жоден голосовий провайдер реального часу не зареєстрований, Plugin голосових викликів записує попередження й пропускає медіа реального часу замість того, щоб завершити роботу всього Plugin помилкою.
- Ключі сесії консультації повторно використовують збережену сесію виклику, коли вона доступна, а потім переходять до налаштованого `sessionScope` (`per-phone` стандартно або `per-call` для ізольованих викликів).

### Політика інструментів

`realtime.toolPolicy` керує запуском консультації:

| Політика         | Поведінка                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Відкрити інструмент консультації та обмежити звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Відкрити інструмент консультації та дозволити звичайному агенту використовувати нормальну політику інструментів агента.                 |
| `none`           | Не відкривати інструмент консультації. Користувацькі `realtime.tools` все одно передаються провайдеру реального часу.                   |

`realtime.consultPolicy` керує лише інструкціями моделі реального часу:

| Політика      | Настанова                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Зберегти стандартний prompt і дозволити провайдеру вирішувати, коли викликати інструмент консультації. |
| `substantive` | Відповідати на прості розмовні зв’язки напряму й консультуватися перед фактами, пам’яттю, інструментами або контекстом. |
| `always`      | Консультуватися перед кожною змістовною відповіддю.                                             |

### Голосовий контекст агента

Увімкніть `realtime.agentContext`, коли голосовий міст має звучати як
налаштований агент OpenClaw без повного циклу агентської консультації на
звичайних репліках. Капсула контексту додається один раз під час створення сесії реального часу,
тому не додає затримки на кожну репліку. Виклики
`openclaw_agent_consult` все одно запускають повного агента OpenClaw і мають використовуватися
для роботи з інструментами, актуальної інформації, пошуку в пам’яті або стану робочої області.

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

### Приклади провайдерів реального часу

<Tabs>
  <Tab title="Google Gemini Live">
    Типові значення: API-ключ із `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` або `GOOGLE_GENERATIVE_AI_API_KEY`; модель
    `gemini-2.5-flash-native-audio-preview-12-2025`; голос `Kore`.
    `sessionResumption` і `contextWindowCompression` типово ввімкнені для довших
    викликів із можливістю повторного підключення. Використовуйте `silenceDurationMs`, `startSensitivity` і
    `endSensitivity`, щоб налаштувати швидше чергування реплік у телефонному аудіо.

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

Див. [провайдер Google](/uk/providers/google) і
[провайдер OpenAI](/uk/providers/openai), щоб переглянути специфічні для провайдера параметри голосу
реального часу.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції реального часу для аудіо живого виклику.

Поточна поведінка середовища виконання:

- `streaming.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції реального часу.
- Вбудовані провайдери транскрипції реального часу: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми Plugin провайдерів.
- Необроблена конфігурація, якою володіє провайдер, розміщується в `streaming.providers.<providerId>`.
- Після того як Twilio надішле прийняте повідомлення `start` потоку, Voice Call негайно реєструє потік, ставить вхідні медіадані в чергу через провайдера транскрипції, поки провайдер підключається, і запускає початкове привітання лише після готовності транскрипції реального часу.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або жоден провайдер не зареєстрований, Voice Call записує попередження в журнал і пропускає потокове передавання медіа замість того, щоб зупиняти весь Plugin з помилкою.

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
мовлення під час викликів. Ви можете перевизначити її в конфігурації Plugin з
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

- Застарілі ключі `tts.<provider>` у конфігурації Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; зафіксована в репозиторії конфігурація має використовувати `tts.providers.<provider>`.
- Core TTS використовується, коли ввімкнено потокове передавання медіа Twilio; інакше виклики повертаються до нативних голосів провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS недоступний у цьому стані, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in Twilio або демонтаж потоку очищує чергу очікуваного TTS, поставлені в чергу запити відтворення завершуються замість того, щоб залишати абонентів в очікуванні завершення відтворення.

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

Вхідна політика типово має значення `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — це перевірка ідентифікатора абонента з низьким рівнем гарантії. Plugin нормалізує надане провайдером значення `From` і порівнює його з `allowFrom`. Перевірка Webhook автентифікує доставку провайдером і цілісність корисного навантаження, але вона **не** доводить право власності на номер абонента PSTN/VoIP. Розглядайте `allowFrom` як фільтрацію за ідентифікатором абонента, а не як надійну ідентичність абонента.
</Warning>

Автовідповіді використовують систему агента. Налаштовуйте за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Маршрутизація за номером

Використовуйте `numbers`, коли один Plugin Voice Call приймає виклики для кількох телефонних
номерів і кожен номер має поводитися як окрема лінія. Наприклад, один
номер може використовувати невимушеного особистого асистента, а інший — бізнес-персону,
іншого агента відповіді та інший голос TTS.

Маршрути вибираються з наданого провайдером набраного номера `To`. Ключі мають бути
номерами E.164. Коли надходить виклик, Voice Call один раз визначає відповідний маршрут,
зберігає знайдений маршрут у записі виклику та повторно використовує цю ефективну конфігурацію
для привітання, класичного шляху автовідповіді, шляху консультації реального часу та
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

Значення маршруту `tts` глибоко об’єднується з глобальною конфігурацією Voice Call `tts`, тому
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

### Контракт мовленнєвого виводу

Для автовідповідей Voice Call додає суворий контракт мовленнєвого виводу до
системного запиту:

```text
{"spoken":"..."}
```

Voice Call обережно витягує текст мовлення:

- Ігнорує корисні навантаження, позначені як вміст reasoning/error.
- Аналізує прямий JSON, JSON у fenced-блоці або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту та видаляє ймовірні вступні абзаци планування/метаданих.

Це утримує мовленнєве відтворення зосередженим на тексті для абонента й запобігає
потраплянню тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив’язана до живого
стану відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише тоді, коли початкове привітання активно промовляється.
- Якщо початкове відтворення зазнає невдачі, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio починається під час підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищує поставлені в чергу, але ще не відтворювані записи Twilio TTS. Очищені записи завершуються як пропущені, тому логіка подальшої відповіді може продовжуватися без очікування аудіо, яке ніколи не буде відтворене.
- Голосові розмови реального часу використовують власний початковий хід потоку реального часу. Voice Call **не** публікує застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тож вихідні сеанси `<Connect><Stream>` залишаються приєднаними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає **2000 ms** перед
автоматичним завершенням виклику:

- Якщо потік повторно підключається протягом цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду жоден потік не зареєструється повторно, виклик завершується, щоб запобігти завислим активним викликам.

## Очищувач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують термінальний
Webhook (наприклад, виклики в режимі сповіщення, які ніколи не завершуються). Типове значення
— `0` (вимкнено).

Рекомендовані діапазони:

- **Продакшн:** `120`–`300` секунд для потоків типу сповіщень.
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

Коли перед Gateway стоїть проксі або тунель, plugin
відтворює публічну URL-адресу для перевірки підпису. Ці параметри
керують тим, яким пересланим заголовкам можна довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Дозволений список хостів із заголовків пересилання.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти пересланим заголовкам без дозволеного списку.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти пересланим заголовкам лише тоді, коли віддалена IP-адреса запиту збігається зі списком.
</ParamField>

Додаткові захисти:

- Webhook **захист від повторного відтворення** увімкнено для Twilio і Plivo. Повторно відтворені дійсні Webhook-запити підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмови Twilio містять токен для кожного ходу в callback-викликах `<Gather>`, тому застарілі або повторно відтворені callback-виклики мовлення не можуть задовольнити новіший очікуваний хід транскрипта.
- Неавтентифіковані Webhook-запити відхиляються до читання тіла, якщо відсутні обов’язкові заголовки підпису провайдера.
- Webhook voice-call використовує спільний профіль тіла перед автентифікацією (64 КБ / 5 секунд) плюс обмеження одночасних запитів на IP перед перевіркою підпису.

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

Коли Gateway уже запущений, операційні команди `voicecall` делегують
виконання середовищу виконання voice-call, яким володіє Gateway, щоб CLI не прив’язував другий
Webhook-сервер. Якщо Gateway недоступний, команди повертаються до
автономного середовища виконання CLI.

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call.
Використовуйте `--file <path>`, щоб вказати інший журнал, і `--last <n>`, щоб обмежити
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

Цей репозиторій постачає відповідний документ skill у `skills/voice-call/SKILL.md`.

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
цифри після з’єднання.

## Усунення несправностей

### Налаштування не вдається через доступність Webhook

Запустіть налаштування з того самого середовища, у якому працює Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` і `plivo` `webhook-exposure` має бути зеленим. Налаштований
`publicUrl` усе одно не спрацьовує, коли вказує на локальний або приватний мережевий
простір, оскільки оператор не може виконати callback на ці адреси. Не використовуйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Вихідні виклики Twilio в режимі сповіщення надсилають свій початковий TwiML `<Say>` безпосередньо в
запиті створення виклику, тому перше озвучене повідомлення не залежить від того, чи Twilio
отримає Webhook TwiML. Публічний Webhook усе одно потрібен для callback-викликів стану,
розмовних викликів, DTMF перед з’єднанням, потоків у реальному часі та керування викликом
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

Після зміни конфігурації перезапустіть або перезавантажте Gateway, потім виконайте:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` — це пробний запуск, якщо ви не передасте `--yes`.

### Облікові дані провайдера не проходять

Перевірте вибраного провайдера та обов’язкові поля облікових даних:

- Twilio: `twilio.accountSid`, `twilio.authToken` і `fromNumber`, або
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` і `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` і
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` і `fromNumber`.

Облікові дані мають існувати на хості Gateway. Редагування локального профілю shell не
впливає на вже запущений Gateway, доки він не перезапуститься або не перезавантажить своє
середовище.

### Виклики починаються, але Webhook провайдера не надходять

Переконайтеся, що консоль провайдера вказує на точну публічну URL-адресу Webhook:

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
- Firewall або DNS спрямовує публічне ім’я хоста кудись інде, а не до Gateway.
- Gateway було перезапущено без увімкненого plugin Voice Call.

Коли перед Gateway стоїть зворотний проксі або тунель, встановіть
`webhookSecurity.allowedHosts` на публічне ім’я хоста або використовуйте
`webhookSecurity.trustedProxyIPs` для відомої адреси проксі. Використовуйте
`webhookSecurity.trustForwardingHeaders` лише тоді, коли межа проксі перебуває під
вашим контролем.

### Перевірка підпису не вдається

Підписи провайдера перевіряються за публічною URL-адресою, яку OpenClaw відтворює
з вхідного запиту. Якщо підписи не проходять:

- Переконайтеся, що URL Webhook провайдера точно збігається з `publicUrl`, включно зі
  схемою, хостом і шляхом.
- Для URL ngrok безкоштовного рівня оновіть `publicUrl`, коли змінюється ім’я хоста тунелю.
- Переконайтеся, що проксі зберігає оригінальні заголовки host і proto, або налаштуйте
  `webhookSecurity.allowedHosts`.
- Не вмикайте `skipSignatureVerification` поза локальним тестуванням.

### Збої приєднання Google Meet через Twilio

Google Meet використовує цей plugin для приєднань через dial-in Twilio. Спочатку перевірте Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Потім явно перевірте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Якщо Voice Call зелений, але учасник Meet ніколи не приєднується, перевірте номер
dial-in Meet, PIN і `--dtmf-sequence`. Телефонний виклик може бути справним, тоді як
зустріч відхиляє або ігнорує неправильну послідовність DTMF.

Google Meet запускає телефонну лінію Twilio через `voicecall.start` із
послідовністю DTMF перед з’єднанням. Послідовності, отримані з PIN, містять
`voiceCall.dtmfDelayMs` plugin Google Meet як початкові цифри очікування Twilio. Типове значення — 12 секунд,
оскільки підказки dial-in Meet можуть надходити із запізненням. Потім Voice Call перенаправляє назад до
обробки в реальному часі до запиту вступного привітання.

Використовуйте `openclaw logs --follow` для живої трасировки фази. Справне приєднання Twilio Meet
записує в журнал такий порядок:

- Google Meet делегує приєднання Twilio до Voice Call.
- Voice Call зберігає TwiML DTMF перед з’єднанням.
- Початковий TwiML Twilio споживається й обслуговується перед обробкою в реальному часі.
- Voice Call обслуговує TwiML реального часу для виклику Twilio.
- Google Meet запитує вступне мовлення через `voicecall.speak` після затримки після DTMF.

`openclaw voicecall tail` усе ще показує збережені записи викликів; він корисний для
стану викликів і транскриптів, але не кожен перехід Webhook/реального часу з’являється
там.

### Виклик у реальному часі не має мовлення

Переконайтеся, що ввімкнено лише один аудіорежим. `realtime.enabled` і
`streaming.enabled` не можуть одночасно бути true.

Для викликів Twilio у реальному часі також перевірте:

- Plugin провайдера реального часу завантажено та зареєстровано.
- `realtime.provider` не задано або називає зареєстрованого провайдера.
- API-ключ провайдера доступний процесу Gateway.
- `openclaw logs --follow` показує, що TwiML реального часу обслуговується, міст реального часу
  запущено, а початкове привітання поставлено в чергу.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
