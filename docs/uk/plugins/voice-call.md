---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin для голосових викликів
    - Вам потрібен голосовий зв’язок у реальному часі або потокова транскрипція в телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові виклики через Twilio, Telnyx або Plivo, з необов’язковим голосовим зв’язком у реальному часі та потоковою транскрипцією
title: Plugin для голосових викликів
x-i18n:
    generated_at: "2026-05-01T05:30:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7ab7d7499e65d4514eda607f49b10aabd5feab11cac9f808de890176606f3b
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосові виклики для OpenClaw через Plugin. Підтримує вихідні сповіщення,
багатоходові розмови, повнодуплексний голос у реальному часі, потокову
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

    Якщо npm повідомляє, що пакет, який належить OpenClaw, застарілий, ця версія пакета
    походить зі старішої зовнішньої гілки пакетів; використовуйте поточну пакетовану збірку
    OpenClaw або шлях до локальної папки, доки не буде опубліковано новіший пакет npm.

    Після цього перезапустіть Gateway, щоб Plugin завантажився.

  </Step>
  <Step title="Налаштуйте провайдера та Webhook">
    Установіть конфігурацію в `plugins.entries.voice-call.config` (повну структуру див.
    у розділі [Конфігурація](#configuration) нижче). Мінімально потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і публічно
    доступна URL-адреса Webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручно читати в журналах чату й терміналах. Він перевіряє,
    чи ввімкнено Plugin, облікові дані провайдера, доступність Webhook і те,
    що активний лише один аудіорежим (`streaming` або `realtime`). Використовуйте
    `--json` для скриптів.

  </Step>
  <Step title="Smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    За замовчуванням обидві команди виконуються як dry run. Додайте `--yes`, щоб фактично здійснити короткий
    вихідний виклик-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначати **публічну URL-адресу Webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний serve
визначається як loopback чи приватний мережевий простір, налаштування завершується помилкою замість
запуску провайдера, який не може отримувати Webhook-и оператора.
</Warning>

## Конфігурація

Якщо `enabled: true`, але у вибраного провайдера бракує облікових даних,
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
  <Accordion title="Нотатки щодо відкриття доступу до провайдера та безпеки">
    - Twilio, Telnyx і Plivo потребують **публічно доступної** URL-адреси Webhook.
    - `mock` — локальний провайдер для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безплатному рівні ngrok установіть `publicUrl` на точну URL-адресу ngrok; перевірка підписів завжди застосовується.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook-и Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL-адреси безплатного рівня Ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміщується, підписи Twilio не проходять перевірку. Продакшн: віддавайте перевагу стабільному домену або Tailscale funnel.

  </Accordion>
  <Accordion title="Обмеження потокових підключень">
    - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до start.
    - `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до start на IP-адресу джерела.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувані + активні).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації, що використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Резервний runtime поки що все ще приймає старі ключі voice-call, але
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

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного голосового провайдера реального часу для live-аудіо виклику.
Це окремо від `streaming`, який лише пересилає аудіо до
провайдерів транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим на виклик.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого голосового провайдера реального часу.
- Вбудовані голосові провайдери реального часу: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми провайдерськими plugins.
- Необроблена конфігурація, що належить провайдеру, розміщується в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням відкриває спільний realtime-інструмент `openclaw_agent_consult`. Модель реального часу може викликати його, коли абонент просить глибшого міркування, актуальної інформації або звичайних інструментів OpenClaw.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або жодного голосового провайдера реального часу не зареєстровано, Voice Call записує попередження й пропускає realtime-медіа замість того, щоб завершити весь Plugin помилкою.
- Ключі консультативної сесії повторно використовують наявну голосову сесію, коли вона доступна, а потім переходять до номера телефону абонента/одержувача, щоб подальші консультативні виклики зберігали контекст під час виклику.

### Політика інструментів

`realtime.toolPolicy` керує консультативним запуском:

| Політика         | Поведінка                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Відкриває консультативний інструмент і обмежує звичайного агента `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Відкриває консультативний інструмент і дозволяє звичайному агенту використовувати нормальну політику інструментів агента.              |
| `none`           | Не відкриває консультативний інструмент. Користувацькі `realtime.tools` все одно передаються провайдеру реального часу.                |

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
[провайдера OpenAI](/uk/providers/openai) щодо специфічних для провайдера параметрів голосу
в реальному часі.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для live-аудіо виклику.

Поточна поведінка runtime:

- `streaming.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми провайдерськими plugins.
- Необроблена конфігурація, що належить провайдеру, розміщується в `streaming.providers.<providerId>`.
- Після того як Twilio надсилає прийняте повідомлення `start` потоку, Voice Call негайно реєструє потік, ставить вхідні медіа в чергу через провайдера транскрипції, поки провайдер підключається, і починає початкове привітання лише після готовності транскрипції в реальному часі.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або жодного не зареєстровано, Voice Call записує попередження й пропускає потокове медіа замість того, щоб завершити весь Plugin помилкою.

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
мовлення під час викликів. Її можна перевизначити в конфігурації Plugin з
**такою самою структурою** — вона глибоко зливається з `messages.tts`.

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
**Microsoft speech ігнорується для голосових викликів.** Телефонний аудіопотік потребує PCM;
поточний транспорт Microsoft не надає телефонний PCM-вивід.
</Warning>

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; зафіксована конфігурація має використовувати `tts.providers.<provider>`.
- Основний TTS використовується, коли ввімкнено потокове передавання медіа Twilio; інакше виклики повертаються до нативних голосів провайдера.
- Якщо медіапотік Twilio уже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS недоступний у цьому стані, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли втручання в розмову Twilio або завершення потоку очищає чергу очікуваного TTS, поставлені в чергу запити відтворення завершуються, а не залишають абонентів чекати на завершення відтворення.

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

Типове значення політики вхідних викликів — `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — це перевірка caller ID з низьким рівнем надійності. Plugin
нормалізує надане провайдером значення `From` і порівнює його з
`allowFrom`. Перевірка Webhook автентифікує доставлення провайдером і
цілісність payload, але **не** доводить володіння номером абонента
PSTN/VoIP. Розглядайте `allowFrom` як фільтрацію caller ID, а не як надійну
ідентифікацію абонента.
</Warning>

Автовідповіді використовують систему агента. Налаштовуйте їх за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Контракт мовленнєвого виводу

Для автовідповідей Voice Call додає до системного prompt суворий контракт мовленнєвого виводу:

```text
{"spoken":"..."}
```

Voice Call захисно витягує текст мовлення:

- Ігнорує payload, позначені як reasoning/error content.
- Розбирає прямий JSON, JSON у fenced-блоці або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє ймовірні вступні абзаци планування/метаданих.

Це утримує мовленнєве відтворення сфокусованим на тексті для абонента й запобігає
витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив’язана до поточного
стану відтворення:

- Очищення черги під час втручання в розмову та автовідповідь пригнічуються лише тоді, коли початкове привітання активно промовляється.
- Якщо початкове відтворення завершується помилкою, виклик повертається до стану `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio запускається під час підключення потоку без додаткової затримки.
- Втручання в розмову перериває активне відтворення й очищає записи Twilio TTS, які поставлені в чергу, але ще не відтворюються. Очищені записи завершуються як пропущені, тож логіка наступної відповіді може продовжуватися без очікування аудіо, яке ніколи не буде відтворене.
- Розмови realtime voice використовують власний початковий хід realtime-потоку. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тож вихідні сеанси `<Connect><Stream>` залишаються підключеними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає **2000 мс**, перш ніж
автоматично завершити виклик:

- Якщо потік повторно підключається протягом цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду жоден потік не зареєструється повторно, виклик завершується, щоб запобігти завислим активним викликам.

## Очищувач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують термінальний
Webhook (наприклад, виклики в notify-режимі, які ніколи не завершуються). Типове значення —
`0` (вимкнено).

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

Коли перед Gateway розміщено proxy або tunnel, Plugin
реконструює публічний URL для перевірки підпису. Ці параметри
керують тим, яким forwarded headers довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Список дозволених hosts із forwarding headers.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти forwarded headers без списку дозволених.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти forwarded headers лише тоді, коли віддалений IP запиту збігається зі списком.
</ParamField>

Додаткові засоби захисту:

- **Захист від replay** Webhook увімкнено для Twilio і Plivo. Повторно відтворені дійсні запити Webhook підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмови Twilio містять токен для кожного ходу в callbacks `<Gather>`, тож застарілі/повторно відтворені speech callbacks не можуть задовольнити новіший очікуваний хід транскрипта.
- Неавтентифіковані запити Webhook відхиляються до читання body, коли відсутні потрібні провайдеру signature headers.
- Webhook voice-call використовує спільний pre-auth body profile (64 KB / 5 секунд) плюс per-IP in-flight cap до перевірки підпису.

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

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call.
Використовуйте `--file <path>`, щоб указати інший log, і `--last <n>`, щоб обмежити
аналіз останніми N записами (типово 200). Вивід містить p50/p90/p99
для затримки ходу та часу очікування прослуховування.

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

## Gateway RPC

| Метод                | Аргументи                 |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Пов’язане

- [Talk mode](/uk/nodes/talk)
- [Text-to-speech](/uk/tools/tts)
- [Voice wake](/uk/nodes/voicewake)
