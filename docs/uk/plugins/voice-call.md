---
read_when:
    - Ви хочете здійснити вихідний голосовий виклик з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
    - Вам потрібен голос у реальному часі або потокова транскрипція в телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові виклики через Twilio, Telnyx або Plivo, з додатковою підтримкою голосу в реальному часі та потокової транскрипції
title: Плагін голосових викликів
x-i18n:
    generated_at: "2026-04-27T06:45:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd99495159acbf1d520eed9adca19801f012adcd902a5d826a3d5f6f7b5a26b1
    source_path: plugins/voice-call.md
    workflow: 15
---

Голосові виклики для OpenClaw через Plugin. Підтримує вихідні сповіщення,
багатоходові розмови, повнодуплексний голос у реальному часі, потокову
транскрипцію та вхідні виклики з політиками allowlist.

**Поточні провайдери:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/без мережі).

<Note>
Plugin Voice Call працює **всередині процесу Gateway**. Якщо ви
використовуєте віддалений Gateway, установіть і налаштуйте Plugin на
машині, де працює Gateway, а потім перезапустіть Gateway, щоб
завантажити його.
</Note>

## Швидкий старт

<Steps>
  <Step title="Установіть Plugin">
    <Tabs>
      <Tab title="З npm (рекомендовано)">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="З локальної папки (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Після цього перезапустіть Gateway, щоб Plugin завантажився.

  </Step>
  <Step title="Налаштуйте провайдера та Webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (див.
    [Configuration](#configuration) нижче для повної структури). Мінімально
    потрібні: `provider`, облікові дані провайдера, `fromNumber` і
    загальнодоступний URL Webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручно читати в журналах чату та терміналах. Команда
    перевіряє, чи увімкнений Plugin, облікові дані провайдера, доступність
    Webhook і те, що активний лише один аудіорежим (`streaming` або
    `realtime`). Для скриптів використовуйте `--json`.

  </Step>
  <Step title="Виконайте smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди типово виконуються як dry run. Додайте `--yes`, щоб
    справді здійснити короткий вихідний виклик-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначатися як **публічний URL Webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний URL від serve
вказує на loopback чи приватний мережевий простір, налаштування
завершується помилкою замість запуску провайдера, який не може
приймати Webhook від оператора.
</Warning>

## Configuration

Якщо `enabled: true`, але для вибраного провайдера відсутні облікові дані,
під час запуску Gateway у журналах з’являється попередження про
незавершене налаштування з переліком відсутніх ключів, і середовище
виконання не запускається. Команди, RPC-виклики та інструменти агента
все одно повертають точну інформацію про відсутню конфігурацію провайдера
під час використання.

<Note>
Облікові дані voice-call підтримують SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` визначаються через стандартну поверхню SecretRef; див. [SecretRef credential surface](/uk/reference/secretref-credential-surface).
</Note>

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
            // Публічний ключ Webhook Telnyx з Mission Control Portal
            // (Base64; також можна задати через TELNYX_PUBLIC_KEY).
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

          // Публічна доступність (виберіть один варіант)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* див. Потокова транскрипція */ },
          realtime: { enabled: false /* див. Голос у реальному часі */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Нотатки про публічну доступність і безпеку провайдера">
    - Twilio, Telnyx і Plivo усі потребують **публічно доступного** URL Webhook.
    - `mock` — це локальний dev-провайдер (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
    - `skipSignatureVerification` призначений лише для локального тестування.
    - У безкоштовному тарифі ngrok задавайте `publicUrl` як точний URL ngrok; перевірка підпису завжди примусово виконується.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL ngrok на безкоштовному тарифі можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio перестануть проходити перевірку. Для production краще використовувати стабільний домен або funnel Tailscale.

  </Accordion>
  <Accordion title="Ліміти з’єднань для streaming">
    - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають коректний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до початку.
    - `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до початку на одну вихідну IP-адресу.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувальні + активні).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації, які використовують `provider: "log"`, `twilio.from` або застарілі ключі OpenAI у `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Резервна сумісність середовища виконання поки що все ще приймає старі ключі voice-call, але
    шлях переписування — це `openclaw doctor --fix`, а shim сумісності є
    тимчасовим.

    Автоматично мігровані ключі streaming:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Розмови голосом у реальному часі

`realtime` вибирає повнодуплексного провайдера голосу в реальному часі для
живого аудіо виклику. Це окремо від `streaming`, який лише пересилає аудіо
провайдерам транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Вибирайте
лише один аудіорежим на виклик.
</Warning>

Поточна поведінка середовища виконання:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого зареєстрованого провайдера голосу в реальному часі.
- Вбудовані провайдери голосу в реальному часі: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми Plugin провайдерів.
- Необроблена конфігурація, що належить провайдеру, розміщується в `realtime.providers.<providerId>`.
- Voice Call типово надає спільний інструмент реального часу `openclaw_agent_consult`. Модель реального часу може викликати його, коли абоненту потрібні глибші міркування, поточна інформація або звичайні інструменти OpenClaw.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або якщо взагалі не зареєстровано жодного провайдера голосу в реальному часі, Voice Call записує попередження в журнал і пропускає медіа реального часу замість того, щоб зламати весь Plugin.
- Ключі сесії consult повторно використовують наявну голосову сесію, коли це можливо, а потім переходять до номера телефону абонента, який телефонує або приймає дзвінок, щоб подальші виклики consult зберігали контекст під час дзвінка.

### Політика інструментів

`realtime.toolPolicy` керує запуском consult:

| Політика           | Поведінка                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only`   | Надає інструмент consult і обмежує звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`            | Надає інструмент consult і дозволяє звичайному агенту використовувати стандартну політику інструментів агента.                         |
| `none`             | Не надає інструмент consult. Користувацькі `realtime.tools` усе одно передаються провайдеру реального часу.                             |

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
                instructions: "Говоріть коротко. Викликайте openclaw_agent_consult перед використанням глибших інструментів.",
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

Див. [Google provider](/uk/providers/google) і
[OpenAI provider](/uk/providers/openai) для параметрів голосу в реальному часі,
специфічних для провайдера.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для живого аудіо виклику.

Поточна поведінка середовища виконання:

- `streaming.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми Plugin провайдерів.
- Необроблена конфігурація, що належить провайдеру, розміщується в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або якщо жодного не зареєстровано, Voice Call записує попередження в журнал і пропускає потокову передачу медіа замість того, щоб зламати весь Plugin.

### Приклади провайдерів streaming

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

  </Tab>
</Tabs>

## TTS для викликів

Voice Call використовує базову конфігурацію `messages.tts` для потокового
відтворення мовлення під час викликів. Ви можете перевизначити її в
конфігурації Plugin із **тією самою структурою** — вона глибоко зливається з `messages.tts`.

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
**Microsoft speech ігнорується для голосових викликів.** Аудіо телефонії потребує PCM;
поточний транспорт Microsoft не надає телекомунікаційний вихід PCM.
</Warning>

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `tts.providers.<provider>`.
- Базовий TTS використовується, коли ввімкнено потокову передачу медіа Twilio; в інших випадках виклики повертаються до голосів, вбудованих у провайдера.
- Якщо медіапотік Twilio уже активний, Voice Call не повертається до TwiML `<Say>`. Якщо TTS телефонії недоступний у такому стані, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS телефонії повертається до вторинного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in Twilio або завершення потоку очищає чергу TTS, що очікує, запити на відтворення з черги завершуються, а не зависають, поки абоненти чекають завершення відтворення.

### Приклади TTS

<Tabs>
  <Tab title="Лише базовий TTS">
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
  <Tab title="Перевизначення на ElevenLabs (лише для викликів)">
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

Політика вхідних викликів типово має значення `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — це перевірка caller ID з низьким рівнем
довіри. Plugin нормалізує значення `From`, надане провайдером, і
порівнює його з `allowFrom`. Перевірка Webhook автентифікує доставку від
провайдера й цілісність корисного навантаження, але **не** доводить
володіння номером абонента PSTN/VoIP. Розглядайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентифікацію абонента.
</Warning>

Автовідповіді використовують систему агента. Налаштовуйте їх через `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Контракт голосового виводу

Для автовідповідей Voice Call додає до системного prompt суворий контракт
голосового виводу:

```text
{"spoken":"..."}
```

Voice Call витягує текст мовлення захисним способом:

- Ігнорує корисні навантаження, позначені як reasoning/error content.
- Розбирає прямий JSON, JSON в огороджених блоках або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє ймовірні вступні абзаци з плануванням/метаданими.

Це дозволяє зосередити голосове відтворення на тексті для абонента й
уникати витоку тексту планування в аудіо.

### Поведінка під час запуску розмови

Для вихідних викликів у режимі `conversation` обробка першого повідомлення
прив’язана до стану живого відтворення:

- Очищення черги через barge-in і автовідповідь пригнічуються лише поки активно відтворюється початкове привітання.
- Якщо початкове відтворення завершується помилкою, виклик повертається до стану `listening`, а початкове повідомлення лишається в черзі для повторної спроби.
- Початкове відтворення для потокової передачі Twilio запускається під час підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищає записи Twilio TTS, які стоять у черзі, але ще не відтворюються. Очищені записи завершуються як пропущені, тому подальша логіка відповіді може продовжитися без очікування аудіо, яке ніколи не буде відтворено.
- Розмови голосом у реальному часі використовують власний початковий хід потоку реального часу. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` залишаються підключеними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає **2000 ms** перед
автоматичним завершенням виклику:

- Якщо потік повторно підключається протягом цього вікна, авто-завершення скасовується.
- Якщо після пільгового періоду жоден потік не реєструється повторно, виклик завершується, щоб не допустити завислих активних викликів.

## Очищувач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які
ніколи не отримують фінальний Webhook (наприклад, виклики в режимі notify,
які ніколи не завершуються). Типове значення —
`0` (вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі notify.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні виклики могли завершитися. Гарна початкова точка — `maxDurationSeconds + 30–60` секунд.

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

Коли перед Gateway розташовано проксі або тунель, Plugin
реконструює публічний URL для перевірки підпису. Ці параметри
керують тим, яким пересланим заголовкам довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Дозволені хости з заголовків переспрямування.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти пересланим заголовкам без allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти пересланим заголовкам лише тоді, коли віддалена IP-адреса запиту збігається зі списком.
</ParamField>

Додаткові засоби захисту:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio і Plivo. Повторно відтворені коректні запити Webhook підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмови Twilio містять токен для кожного ходу у зворотних викликах `<Gather>`, тому застарілі/повторно відтворені зворотні виклики мовлення не можуть задовольнити новіший очікувальний хід транскрипції.
- Неавтентифіковані запити Webhook відхиляються до читання тіла, якщо відсутні потрібні заголовки підпису провайдера.
- Webhook voice-call використовує спільний профіль тіла до автентифікації (64 KB / 5 секунд) плюс обмеження одночасних запитів на одну IP-адресу до перевірки підпису.

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
openclaw voicecall start --to "+15555550123"   # псевдонім для call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # підсумувати затримку ходу з журналів
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call.
Використовуйте `--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб
обмежити аналіз останніми N записами (типово 200). Вивід містить p50/p90/p99
для затримки ходу й часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`.

| Дія             | Аргументи                |
| --------------- | ------------------------ |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`      |
| `speak_to_user` | `callId`, `message`      |
| `send_dtmf`     | `callId`, `digits`       |
| `end_call`      | `callId`                 |
| `get_status`    | `callId`                 |

Цей репозиторій містить відповідний документ Skills у `skills/voice-call/SKILL.md`.

## Gateway RPC

| Метод               | Аргументи                |
| ------------------- | ------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`      |
| `voicecall.speak`    | `callId`, `message`      |
| `voicecall.dtmf`     | `callId`, `digits`       |
| `voicecall.end`      | `callId`                 |
| `voicecall.status`   | `callId`                 |

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Синтез мовлення](/uk/tools/tts)
- [Голосова активація](/uk/nodes/voicewake)
