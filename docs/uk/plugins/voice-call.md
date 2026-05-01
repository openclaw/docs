---
read_when:
    - Ви хочете здійснити вихідний голосовий виклик з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin для голосових викликів
    - Вам потрібен голосовий зв’язок у реальному часі або потокова транскрипція для телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові виклики через Twilio, Telnyx або Plivo, з опційним голосовим зв’язком у реальному часі та потоковою транскрипцією
title: Plugin голосових викликів
x-i18n:
    generated_at: "2026-05-01T05:39:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08690f9f27de8a3d4d2c6056cd08edcc42f60f0592272a464c07cb1dc7fee26e
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосові виклики для OpenClaw через плагін. Підтримує вихідні сповіщення,
багатоходові розмови, повнодуплексний голос у реальному часі, потокову
транскрипцію та вхідні виклики з політиками allowlist.

**Поточні провайдери:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (розробка/без мережі).

<Note>
Плагін Voice Call працює **всередині процесу Gateway**. Якщо ви використовуєте
віддалений Gateway, установіть і налаштуйте плагін на машині, де запущено
Gateway, а потім перезапустіть Gateway, щоб завантажити його.
</Note>

## Швидкий старт

<Steps>
  <Step title="Установіть плагін">
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

    Якщо npm повідомляє, що пакет, який належить OpenClaw, є застарілим, ця версія пакета
    походить зі старішої зовнішньої лінійки пакетів; використовуйте поточну пакетовану збірку OpenClaw
    або шлях до локальної папки, доки не буде опубліковано новіший пакет npm.

    Після цього перезапустіть Gateway, щоб плагін завантажився.

  </Step>
  <Step title="Налаштуйте провайдера та webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (повну структуру див.
    у розділі [Конфігурація](#configuration) нижче). Мінімально потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і загальнодоступна
    URL-адреса webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручно читати в журналах чатів і терміналах. Він перевіряє
    ввімкнення плагіна, облікові дані провайдера, доступність webhook і те, що
    активний лише один аудіорежим (`streaming` або `realtime`). Для скриптів використовуйте
    `--json`.

  </Step>
  <Step title="Smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди за замовчуванням виконуються як пробні запуски. Додайте `--yes`, щоб фактично здійснити короткий
    вихідний дзвінок зі сповіщенням:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначати **публічну URL-адресу webhook**.
Якщо `publicUrl`, URL-адреса тунелю, URL-адреса Tailscale або резервний варіант serve
визначається як loopback чи простір приватної мережі, налаштування завершується помилкою замість
запуску провайдера, який не зможе отримувати webhook від оператора.
</Warning>

## Конфігурація

Якщо `enabled: true`, але для вибраного провайдера бракує облікових даних,
під час запуску Gateway записує попередження про неповне налаштування з відсутніми ключами та
пропускає запуск runtime. Команди, RPC-виклики й інструменти агента все одно
повертають точну відсутню конфігурацію провайдера під час використання.

<Note>
Облікові дані voice-call приймають SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` визначаються через стандартну поверхню SecretRef; див. [поверхню облікових даних SecretRef](/uk/reference/secretref-credential-surface).
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
  <Accordion title="Нотатки щодо доступності провайдера та безпеки">
    - Twilio, Telnyx і Plivo всі потребують **публічно доступної** URL-адреси webhook.
    - `mock` — це локальний провайдер для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не має значення true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безкоштовному рівні ngrok задайте `publicUrl` як точну URL-адресу ngrok; перевірка підпису завжди застосовується.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL-адреси безкоштовного рівня Ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` відхиляється, підписи Twilio не проходять перевірку. Для production краще використовуйте стабільний домен або funnel Tailscale.

  </Accordion>
  <Accordion title="Ліміти потокових з’єднань">
    - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів перед стартом.
    - `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані сокети перед стартом для однієї вихідної IP-адреси.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувані + активні).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації, що використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Резервний runtime поки що все ще приймає старі ключі voice-call, але
    шлях переписування — це `openclaw doctor --fix`, а шар сумісності є
    тимчасовим.

    Автоматично мігровані ключі streaming:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного провайдера голосу в реальному часі для живого аудіо виклику.
Він відокремлений від `streaming`, який лише пересилає аудіо
провайдерам транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим для кожного виклику.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера голосу в реальному часі.
- Вбудовані провайдери голосу в реальному часі: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми плагінами провайдерів.
- Необроблена конфігурація, що належить провайдеру, міститься в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням відкриває спільний інструмент реального часу `openclaw_agent_consult`. Модель реального часу може викликати його, коли абонент просить глибше міркування, актуальну інформацію або звичайні інструменти OpenClaw.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або взагалі не зареєстровано жодного провайдера голосу в реальному часі, Voice Call записує попередження й пропускає медіа реального часу замість того, щоб зупиняти весь плагін з помилкою.
- Ключі сесії consult повторно використовують наявну голосову сесію, коли вона доступна, а потім переходять до номера телефону абонента/одержувача, щоб подальші виклики consult зберігали контекст під час дзвінка.

### Політика інструментів

`realtime.toolPolicy` керує запуском consult:

| Політика          | Поведінка                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Відкрити інструмент consult і обмежити звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Відкрити інструмент consult і дозволити звичайному агенту використовувати стандартну політику інструментів агента.                       |
| `none`           | Не відкривати інструмент consult. Власні `realtime.tools` усе одно передаються провайдеру реального часу.                                |

### Приклади провайдерів реального часу

<Tabs>
  <Tab title="Google Gemini Live">
    Типові значення: ключ API з `realtime.providers.google.apiKey`,
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
[провайдера OpenAI](/uk/providers/openai), щоб дізнатися про параметри голосу в реальному часі,
специфічні для провайдера.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для живого аудіо виклику.

Поточна поведінка runtime:

- `streaming.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми плагінами провайдерів.
- Необроблена конфігурація, що належить провайдеру, міститься в `streaming.providers.<providerId>`.
- Після того як Twilio надсилає прийняте повідомлення потоку `start`, Voice Call негайно реєструє потік, ставить вхідні медіа в чергу через провайдера транскрипції, поки провайдер під’єднується, і запускає початкове привітання лише після готовності транскрипції в реальному часі.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або жодного не зареєстровано, Voice Call записує попередження й пропускає потокове медіа замість того, щоб зупиняти весь плагін з помилкою.

### Приклади провайдерів streaming

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
мовлення під час викликів. Її можна перевизначити в конфігурації plugin з
**тією самою структурою** — вона глибоко об'єднується з `messages.tts`.

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
**Microsoft speech ігнорується для голосових викликів.** Телефонний звук потребує PCM;
поточний транспорт Microsoft не надає телефонний вихід PCM.
</Warning>

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; зафіксована конфігурація має використовувати `tts.providers.<provider>`.
- Основний TTS використовується, коли ввімкнено медіапотокове передавання Twilio; інакше виклики повертаються до нативних голосів провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS у цьому стані недоступний, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли Twilio barge-in або завершення потоку очищає чергу TTS, запити відтворення в черзі завершуються, а не залишають абонентів у завислому стані в очікуванні завершення відтворення.

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

Типова вхідна політика — `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — це перевірка caller ID із низьким рівнем достовірності. Plugin
нормалізує надане провайдером значення `From` і порівнює його з
`allowFrom`. Перевірка Webhook автентифікує доставку провайдером і
цілісність корисного навантаження, але вона **не** доводить право власності
на номер абонента PSTN/VoIP. Сприймайте `allowFrom` як фільтрацію caller ID, а не як надійну
ідентичність абонента.
</Warning>

Автовідповіді використовують систему агента. Налаштовуйте за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Контракт мовленнєвого виводу

Для автовідповідей Voice Call додає строгий контракт мовленнєвого виводу до
системного промпта:

```text
{"spoken":"..."}
```

Voice Call захисно витягує текст мовлення:

- Ігнорує корисні навантаження, позначені як вміст міркувань або помилок.
- Розбирає прямий JSON, JSON у fenced-блоці або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту та видаляє ймовірні вступні абзаци планування чи метаданих.

Це зберігає мовленнєве відтворення зосередженим на тексті для абонента та запобігає
потраплянню тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив'язана до поточного
стану відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише тоді, коли початкове привітання активно промовляється.
- Якщо початкове відтворення не вдається, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio починається після підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення та очищає записи Twilio TTS, які стоять у черзі, але ще не відтворюються. Очищені записи завершуються як пропущені, тому логіка наступної відповіді може продовжитися без очікування аудіо, яке ніколи не відтвориться.
- Голосові розмови Realtime використовують власний початковий хід realtime-потоку. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сеанси `<Connect><Stream>` залишаються підключеними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає **2000 мс** перед
автоматичним завершенням виклику:

- Якщо потік повторно підключається протягом цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду жоден потік не реєструється повторно, виклик завершується, щоб запобігти завислим активним викликам.

## Очищувач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують фінальний
Webhook (наприклад, виклики в режимі сповіщення, що ніколи не завершуються). Типове значення —
`0` (вимкнено).

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

Коли проксі або тунель розташований перед Gateway, plugin
реконструює публічну URL-адресу для перевірки підпису. Ці параметри
керують тим, яким перенаправленим заголовкам можна довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Дозволяє hosts із заголовків forwarding за списком allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряє перенаправленим заголовкам без allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряє перенаправленим заголовкам лише тоді, коли віддалена IP-адреса запиту відповідає списку.
</ParamField>

Додаткові засоби захисту:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio і Plivo. Повторно відтворені дійсні Webhook-запити підтверджуються, але пропускаються щодо побічних ефектів.
- Ходи розмови Twilio містять токен для кожного ходу у callback-ах `<Gather>`, тому застарілі або повторно відтворені callback-и мовлення не можуть задовольнити новіший очікуваний хід транскрипту.
- Неавтентифіковані Webhook-запити відхиляються до читання тіла, якщо відсутні потрібні провайдером заголовки підпису.
- Webhook voice-call використовує спільний pre-auth профіль тіла (64 КБ / 5 секунд) плюс обмеження одночасних запитів для кожної IP-адреси перед перевіркою підпису.

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

Коли Gateway уже запущено, операційні команди `voicecall` делегують виконання
runtime voice-call, яким володіє Gateway, щоб CLI не прив'язував другий
Webhook-сервер. Якщо Gateway недоступний, команди повертаються до
автономного runtime CLI.

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call.
Використовуйте `--file <path>`, щоб вказати інший журнал, і `--last <n>`, щоб обмежити
аналіз останніми N записами (типово 200). Вивід містить p50/p90/p99
для затримки ходу та часу очікування слухання.

## Інструмент агента

Назва інструмента: `voice_call`.

| Дія             | Аргументи                 |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Цей репозиторій постачає відповідний документ skill за адресою `skills/voice-call/SKILL.md`.

## RPC Gateway

| Метод               | Аргументи                 |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Пов'язане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосова активація](/uk/nodes/voicewake)
