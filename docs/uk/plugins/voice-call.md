---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin для голосових викликів
    - Вам потрібен голосовий зв’язок у реальному часі або потокова транскрипція в телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові виклики через Twilio, Telnyx або Plivo, з опційною підтримкою голосу в реальному часі та потокової транскрипції.
title: Plugin голосових викликів
x-i18n:
    generated_at: "2026-05-01T11:40:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: cde64fa054743d4ed3f146042bd65532af0e9eb5b792b088a856889b3d2cb3c9
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосові виклики для OpenClaw через Plugin. Підтримує вихідні сповіщення,
багатоходові розмови, повнодуплексний голос у реальному часі, потокове
транскрибування та вхідні виклики з політиками allowlist.

**Поточні провайдери:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (розробка/без мережі).

<Note>
Plugin Voice Call працює **всередині процесу Gateway**. Якщо ви використовуєте
віддалений Gateway, установіть і налаштуйте Plugin на машині, де працює
Gateway, а потім перезапустіть Gateway, щоб його завантажити.
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

    Якщо npm повідомляє, що пакет, яким володіє OpenClaw, застарілий, ця версія
    пакета походить зі старішої зовнішньої лінійки пакетів; використовуйте поточну
    пакетовану збірку OpenClaw або шлях до локальної папки, доки не буде
    опубліковано новіший пакет npm.

    Після цього перезапустіть Gateway, щоб Plugin завантажився.

  </Step>
  <Step title="Configure provider and webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (див.
    [Конфігурація](#configuration) нижче для повної структури). Мінімально потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і публічно
    доступний URL Webhook.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручно читати в журналах чату й терміналах. Він перевіряє
    увімкнення Plugin, облікові дані провайдера, доступність Webhook і те, що
    активний лише один аудіорежим (`streaming` або `realtime`). Використовуйте
    `--json` для скриптів.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди за замовчуванням виконуються в режимі dry run. Додайте `--yes`,
    щоб фактично здійснити короткий вихідний виклик-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має розв’язуватися в **публічний URL Webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний варіант serve
розв’язується в loopback чи простір приватної мережі, налаштування завершується
помилкою замість запуску провайдера, який не зможе отримувати Webhook від оператора.
</Warning>

## Конфігурація

Якщо `enabled: true`, але вибраному провайдеру бракує облікових даних,
під час запуску Gateway записує попередження про неповне налаштування з відсутніми
ключами та пропускає запуск runtime. Команди, RPC-виклики й інструменти агента
все одно повертають точну відсутню конфігурацію провайдера під час використання.

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
    - Twilio, Telnyx і Plivo всі потребують **публічно доступного** URL Webhook.
    - `mock` — це локальний провайдер для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безплатному рівні ngrok встановіть `publicUrl` на точний URL ngrok; перевірка підпису завжди примусова.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Twilio Webhook з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Тільки для локальної розробки.
    - URL безплатного рівня Ngrok можуть змінюватися або додавати проміжну сторінку; якщо `publicUrl` змінюється, підписи Twilio не проходять перевірку. Для продакшну: віддавайте перевагу стабільному домену або funnel Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
    - `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані сокети до старту для кожної вихідної IP-адреси.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікуваних + активних).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Старіші конфігурації, які використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI у `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Runtime fallback поки що все ще приймає старі ключі voice-call, але
    шлях переписування — `openclaw doctor --fix`, а compat shim є тимчасовим.

    Автоматично мігровані ключі streaming:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного провайдера голосу в реальному часі для аудіо
живого виклику. Він окремий від `streaming`, який лише пересилає аудіо до
провайдерів транскрибування в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим для кожного виклику.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` необов’язковий. Якщо не задано, Voice Call використовує першого зареєстрованого провайдера голосу в реальному часі.
- Вбудовані провайдери голосу в реальному часі: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми Plugin провайдера.
- Сира конфігурація, якою володіє провайдер, розміщується в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням надає спільний інструмент `openclaw_agent_consult` для realtime. Realtime-модель може викликати його, коли абонент просить глибшого міркування, актуальної інформації або звичайних інструментів OpenClaw.
- `realtime.fastContext.enabled` за замовчуванням вимкнений. Коли ввімкнено, Voice Call спочатку шукає проіндексовану пам’ять/контекст сесії для запитання consult і повертає ці фрагменти realtime-моделі в межах `realtime.fastContext.timeoutMs`, перш ніж перейти до повного consult-агента, лише якщо `realtime.fastContext.fallbackToConsult` має значення true.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або якщо жодного провайдера голосу в реальному часі взагалі не зареєстровано, Voice Call записує попередження й пропускає медіа realtime замість того, щоб завершувати роботу всього Plugin помилкою.
- Ключі consult-сесії повторно використовують наявну голосову сесію, коли вона доступна, а потім повертаються до номера телефону абонента/одержувача, щоб подальші consult-виклики зберігали контекст під час виклику.

### Політика інструментів

`realtime.toolPolicy` керує consult-запуском:

| Політика         | Поведінка                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Надає consult-інструмент і обмежує звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Надає consult-інструмент і дозволяє звичайному агенту використовувати стандартну політику інструментів агента.                          |
| `none`           | Не надає consult-інструмент. Користувацькі `realtime.tools` усе одно передаються провайдеру realtime.                                   |

### Приклади провайдерів realtime

<Tabs>
  <Tab title="Google Gemini Live">
    За замовчуванням: API-ключ із `realtime.providers.google.apiKey`,
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
[провайдера OpenAI](/uk/providers/openai), щоб дізнатися про параметри голосу
realtime для конкретного провайдера.

## Потокове транскрибування

`streaming` вибирає провайдера транскрибування в реальному часі для аудіо живого виклику.

Поточна поведінка runtime:

- `streaming.provider` необов’язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого постачальника транскрипції в реальному часі.
- Вбудовані постачальники транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми плагінами постачальників.
- Сира конфігурація, якою володіє постачальник, розміщується в `streaming.providers.<providerId>`.
- Після того як Twilio надсилає прийняте повідомлення потоку `start`, Voice Call одразу реєструє потік, ставить вхідні медіадані в чергу через постачальника транскрипції, поки постачальник підключається, і запускає початкове привітання лише після готовності транскрипції в реальному часі.
- Якщо `streaming.provider` вказує на незареєстрованого постачальника або жодного не зареєстровано, Voice Call записує попередження в журнал і пропускає потокове передавання медіа замість того, щоб завершувати весь плагін помилкою.

### Приклади постачальників потокового передавання

<Tabs>
  <Tab title="OpenAI">
    Стандартні значення: API-ключ `streaming.providers.openai.apiKey` або
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
    Стандартні значення: API-ключ `streaming.providers.xai.apiKey` або `XAI_API_KEY`;
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

## TTS для викликів

Voice Call використовує основну конфігурацію `messages.tts` для потокового
мовлення під час викликів. Ви можете перевизначити її в конфігурації плагіна з
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
поточний транспорт Microsoft не надає вихід телефонного PCM.
</Warning>

Нотатки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації плагіна (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються через `openclaw doctor --fix`; зафіксована конфігурація має використовувати `tts.providers.<provider>`.
- Основний TTS використовується, коли потокове передавання медіа Twilio увімкнено; інакше виклики повертаються до власних голосів постачальника.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS недоступний у цьому стані, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного постачальника, Voice Call записує попередження з ланцюжком постачальників (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in Twilio або завершення потоку очищає чергу очікування TTS, запити відтворення в черзі завершуються, а не залишають абонентів у підвішеному стані в очікуванні завершення відтворення.

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
`inboundPolicy: "allowlist"` — це перевірка ідентифікатора абонента з низьким рівнем гарантії.
Плагін нормалізує надане постачальником значення `From` і порівнює його з
`allowFrom`. Перевірка Webhook автентифікує доставку постачальника та
цілісність payload, але вона **не** доводить право власності на номер
абонента PSTN/VoIP. Розглядайте `allowFrom` як фільтрацію за ідентифікатором абонента, а не як надійну
ідентичність абонента.
</Warning>

Автовідповіді використовують систему агентів. Налаштовуйте за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Контракт мовленого виводу

Для автовідповідей Voice Call додає до системного prompt суворий контракт мовленого виводу:

```text
{"spoken":"..."}
```

Voice Call захищено витягує текст мовлення:

- Ігнорує payload, позначені як вміст reasoning/error.
- Розбирає прямий JSON, JSON в огородженому блоці або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє ймовірні вступні абзаци планування/метаданих.

Це утримує мовлене відтворення сфокусованим на тексті для абонента й запобігає
витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив’язана до стану
живого відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише тоді, коли початкове привітання активно промовляється.
- Якщо початкове відтворення завершується помилкою, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio запускається під час підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищає записи Twilio TTS, які вже в черзі, але ще не відтворюються. Очищені записи завершуються як пропущені, тому логіка подальшої відповіді може продовжити роботу без очікування аудіо, яке ніколи не буде відтворене.
- Голосові розмови в реальному часі використовують власний початковий хід потоку реального часу. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` залишаються підключеними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає **2000 мс** перед
автоматичним завершенням виклику:

- Якщо потік повторно підключається протягом цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду потік не реєструється повторно, виклик завершується, щоб запобігти завислим активним викликам.

## Очищення застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують кінцевий
Webhook (наприклад, виклики в режимі сповіщення, які ніколи не завершуються). Стандартне значення
— `0` (вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі сповіщень.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні виклики могли завершитися. Добра початкова точка — `maxDurationSeconds + 30–60` секунд.

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

Коли проксі або тунель розташований перед Gateway, плагін
відновлює публічний URL для перевірки підпису. Ці параметри
керують тим, яким пересланим заголовкам довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Список дозволених хостів із заголовків пересилання.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти пересланим заголовкам без списку дозволених.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти пересланим заголовкам лише тоді, коли віддалена IP-адреса запиту збігається зі списком.
</ParamField>

Додаткові засоби захисту:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio і Plivo. Повторно відтворені дійсні запити Webhook підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмови Twilio містять токен для кожного ходу в callback `<Gather>`, тому застарілі/повторно відтворені callback мовлення не можуть задовольнити новіший очікуваний хід transcript.
- Неавтентифіковані запити Webhook відхиляються до читання body, якщо відсутні обов’язкові заголовки підпису постачальника.
- Webhook voice-call використовує спільний профіль body до автентифікації (64 КБ / 5 секунд) плюс обмеження одночасних запитів для кожної IP-адреси перед перевіркою підпису.

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
до runtime voice-call, яким володіє Gateway, щоб CLI не прив’язував другий
сервер Webhook. Якщо Gateway недосяжний, команди повертаються до
автономного runtime CLI.

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call.
Використовуйте `--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити
аналіз останніми N записами (стандартно 200). Вивід містить p50/p90/p99
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

Цей репозиторій постачає відповідну документацію Skills за адресою `skills/voice-call/SKILL.md`.

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
цифри після підключення.

## Усунення несправностей

### Налаштування не може відкрити Webhook назовні

Запустіть налаштування з того самого середовища, у якому працює Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` і `plivo` `webhook-exposure` має бути зеленим. Налаштований `publicUrl` усе одно завершиться помилкою, якщо вказує на локальний або приватний мережевий простір, бо оператор не може виконати зворотний виклик на ці адреси. Не використовуйте `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Вихідні виклики Twilio в режимі сповіщення надсилають початковий `<Say>` TwiML безпосередньо в запиті створення виклику, тому перше промовлене повідомлення не залежить від того, чи Twilio отримає Webhook TwiML. Публічний Webhook усе ще потрібен для зворотних викликів статусу, розмовних викликів, DTMF перед підключенням, потоків реального часу та керування викликом після підключення.

Використайте один шлях публічного доступу:

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

`voicecall smoke` виконує пробний запуск, якщо не передати `--yes`.

### Облікові дані провайдера не проходять перевірку

Перевірте вибраного провайдера та обов’язкові поля облікових даних:

- Twilio: `twilio.accountSid`, `twilio.authToken` і `fromNumber`, або
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` і `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` і
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` і `fromNumber`.

Облікові дані мають існувати на хості Gateway. Редагування локального профілю оболонки не впливає на вже запущений Gateway, доки його не буде перезапущено або доки він не перезавантажить своє середовище.

### Виклики запускаються, але Webhook-и провайдера не надходять

Переконайтеся, що консоль провайдера вказує на точну публічну URL-адресу Webhook:

```text
https://voice.example.com/voice/webhook
```

Потім перевірте стан під час виконання:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Поширені причини:

- `publicUrl` вказує на інший шлях, ніж `serve.path`.
- URL тунелю змінився після запуску Gateway.
- Проксі пересилає запит, але видаляє або переписує заголовки host/proto.
- Брандмауер або DNS спрямовує публічне ім’я хоста не на Gateway.
- Gateway було перезапущено без увімкненого Plugin Voice Call.

Коли перед Gateway стоїть зворотний проксі або тунель, задайте `webhookSecurity.allowedHosts` як публічне ім’я хоста або використайте `webhookSecurity.trustedProxyIPs` для відомої адреси проксі. Використовуйте `webhookSecurity.trustForwardingHeaders` лише тоді, коли межа проксі перебуває під вашим контролем.

### Перевірка підпису не проходить

Підписи провайдера перевіряються щодо публічної URL-адреси, яку OpenClaw реконструює з вхідного запиту. Якщо підписи не проходять перевірку:

- Переконайтеся, що URL Webhook провайдера точно збігається з `publicUrl`, включно зі схемою, хостом і шляхом.
- Для URL ngrok безкоштовного рівня оновлюйте `publicUrl`, коли змінюється ім’я хоста тунелю.
- Переконайтеся, що проксі зберігає початкові заголовки host і proto, або налаштуйте `webhookSecurity.allowedHosts`.
- Не вмикайте `skipSignatureVerification` поза локальним тестуванням.

### Приєднання Google Meet через Twilio не працює

Google Meet використовує цей Plugin для приєднання через набір Twilio. Спочатку перевірте Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Потім явно перевірте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Якщо Voice Call зелений, але учасник Meet не приєднується, перевірте номер дозвону Meet, PIN і `--dtmf-sequence`. Телефонний виклик може бути справним, тоді як зустріч відхиляє або ігнорує неправильну послідовність DTMF.

Google Meet передає послідовність DTMF Meet і вступний текст до `voicecall.start`. Для викликів Twilio Voice Call спочатку подає DTMF TwiML, перенаправляє назад до Webhook, а потім відкриває медіапотік реального часу, щоб збережений вступ було згенеровано після приєднання телефонного учасника до зустрічі.

Використовуйте `openclaw logs --follow` для живого трасування фази. Справне приєднання Twilio Meet записує події в такому порядку:

- Google Meet делегує приєднання Twilio до Voice Call.
- Voice Call зберігає DTMF TwiML перед підключенням.
- Початковий TwiML Twilio споживається та подається перед обробкою реального часу.
- Voice Call подає TwiML реального часу для виклику Twilio.
- Міст реального часу запускається з початковим привітанням у черзі.

`openclaw voicecall tail` усе ще показує збережені записи викликів; це корисно для стану виклику й транскриптів, але не кожен перехід Webhook/реального часу там з’являється.

### У виклику реального часу немає мовлення

Переконайтеся, що ввімкнено лише один аудіорежим. `realtime.enabled` і `streaming.enabled` не можуть одночасно бути `true`.

Для викликів Twilio реального часу також перевірте:

- Plugin провайдера реального часу завантажено й зареєстровано.
- `realtime.provider` не задано або він називає зареєстрованого провайдера.
- Ключ API провайдера доступний процесу Gateway.
- `openclaw logs --follow` показує, що TwiML реального часу подано, міст реального часу запущено, а початкове привітання поставлено в чергу.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
