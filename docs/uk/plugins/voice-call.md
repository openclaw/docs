---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin для голосових викликів
    - Вам потрібен голосовий зв’язок у реальному часі або потокова транскрипція для телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові виклики через Twilio, Telnyx або Plivo, з необов’язковим голосовим зв’язком у реальному часі та потоковою транскрипцією
title: Plugin для голосових викликів
x-i18n:
    generated_at: "2026-05-01T06:21:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea655c1fab7a92056a8469018e9719e015c6492d96419dc3a6757efd90c14508
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосові виклики для OpenClaw через Plugin. Підтримує вихідні сповіщення,
багатоходові розмови, повнодуплексний голос у реальному часі, потокову
транскрипцію та вхідні виклики з політиками allowlist.

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

    Якщо npm повідомляє, що пакет, яким володіє OpenClaw, застарілий, ця версія
    пакета походить зі старішої зовнішньої лінійки пакетів; використовуйте поточну
    пакетовану збірку OpenClaw або шлях до локальної папки, доки не буде опубліковано
    новіший npm-пакет.

    Після цього перезапустіть Gateway, щоб Plugin завантажився.

  </Step>
  <Step title="Налаштуйте провайдера та webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (повну форму див.
    у розділі [Конфігурація](#configuration) нижче). Мінімально потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і публічно
    доступна URL-адреса webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручно читати в журналах чату та терміналах. Він перевіряє,
    чи ввімкнено Plugin, облікові дані провайдера, доступність webhook
    і те, що активний лише один аудіорежим (`streaming` або `realtime`).
    Використовуйте `--json` для скриптів.

  </Step>
  <Step title="Smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди за замовчуванням виконуються як пробні запуски. Додайте `--yes`,
    щоб фактично здійснити короткий вихідний виклик-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначатися як **публічна URL-адреса webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний варіант serve
визначається як loopback чи простір приватної мережі, налаштування завершується
помилкою замість запуску провайдера, який не зможе отримувати webhook від оператора.
</Warning>

## Конфігурація

Якщо `enabled: true`, але для вибраного провайдера бракує облікових даних,
під час запуску Gateway записує попередження про неповне налаштування з
відсутніми ключами та пропускає запуск runtime. Команди, RPC-виклики й
інструменти агента все одно повертають точну відсутню конфігурацію провайдера
під час використання.

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
  <Accordion title="Нотатки щодо доступності та безпеки провайдера">
    - Twilio, Telnyx і Plivo потребують **публічно доступної** URL-адреси webhook.
    - `mock` — локальний провайдер для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безплатному рівні ngrok задайте `publicUrl` як точну URL-адресу ngrok; перевірка підпису завжди примусово ввімкнена.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL безплатного рівня Ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` розходиться, підписи Twilio не проходять перевірку. Production: надавайте перевагу стабільному домену або funnel Tailscale.

  </Accordion>
  <Accordion title="Ліміти потокових підключень">
    - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих pre-start сокетів.
    - `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані pre-start сокети на IP-адресу джерела.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (pending + active).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації, що використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Резервний runtime поки що приймає старі ключі voice-call, але шлях переписування —
    `openclaw doctor --fix`, а сумісний shim є тимчасовим.

    Автоматично мігровані ключі streaming:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного голосового провайдера в реальному часі для
аудіо живого виклику. Це окремо від `streaming`, який лише пересилає аудіо
провайдерам транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим для кожного виклику.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` необов’язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого голосового провайдера реального часу.
- Вбудовані голосові провайдери реального часу: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми Plugin-провайдерами.
- Raw-конфігурація, якою володіє провайдер, міститься в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням надає спільний realtime-інструмент `openclaw_agent_consult`. Realtime-модель може викликати його, коли абонент просить глибшого міркування, актуальної інформації або звичайних інструментів OpenClaw.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або взагалі не зареєстровано жодного голосового провайдера реального часу, Voice Call записує попередження та пропускає realtime-медіа замість того, щоб зупиняти весь Plugin з помилкою.
- Ключі consult-сеансів повторно використовують наявний голосовий сеанс, коли він доступний, а потім переходять до номера телефону абонента/одержувача, щоб подальші consult-виклики зберігали контекст під час виклику.

### Політика інструментів

`realtime.toolPolicy` керує consult-запуском:

| Політика         | Поведінка                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Надає consult-інструмент і обмежує звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Надає consult-інструмент і дозволяє звичайному агенту використовувати звичайну політику інструментів агента.                            |
| `none`           | Не надає consult-інструмент. Користувацькі `realtime.tools` все одно передаються realtime-провайдеру.                                   |

### Приклади realtime-провайдерів

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

Див. [провайдер Google](/uk/providers/google) і
[провайдер OpenAI](/uk/providers/openai), щоб дізнатися про параметри
голосу в реальному часі для конкретних провайдерів.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для аудіо живого виклику.

Поточна поведінка runtime:

- `streaming.provider` необов’язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми Plugin-провайдерами.
- Raw-конфігурація, якою володіє провайдер, міститься в `streaming.providers.<providerId>`.
- Після того як Twilio надсилає прийняте повідомлення `start` потоку, Voice Call негайно реєструє потік, ставить вхідні медіа в чергу через провайдера транскрипції, поки провайдер підключається, і запускає початкове привітання лише після готовності realtime-транскрипції.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або жодного не зареєстровано, Voice Call записує попередження та пропускає потокове медіа замість того, щоб зупиняти весь Plugin з помилкою.

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
мовлення під час викликів. Її можна перевизначити в конфігурації plugin з
**такою самою структурою** — вона глибоко об'єднується з `messages.tts`.

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

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; закомічена конфігурація має використовувати `tts.providers.<provider>`.
- Основний TTS використовується, коли ввімкнено потокове передавання медіа Twilio; інакше виклики повертаються до власних голосів provider.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо в такому стані телефонний TTS недоступний, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного provider, Voice Call записує попередження з ланцюжком provider (`from`, `to`, `attempts`) для налагодження.
- Коли переривання Twilio або демонтаж потоку очищує чергу очікування TTS, запити відтворення в черзі завершуються, а не залишають абонентів чекати завершення відтворення.

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
`inboundPolicy: "allowlist"` — це перевірка caller ID з низьким рівнем гарантії.
Plugin нормалізує надане provider значення `From` і порівнює його з
`allowFrom`. Перевірка Webhook автентифікує доставку від provider і
цілісність payload, але вона **не** доводить право власності на номер абонента
PSTN/VoIP. Розглядайте `allowFrom` як фільтрацію caller ID, а не як надійну
ідентичність абонента.
</Warning>

Автовідповіді використовують систему агентів. Налаштовуйте їх за допомогою
`responseModel`, `responseSystemPrompt` і `responseTimeoutMs`.

### Контракт усного виводу

Для автовідповідей Voice Call додає суворий контракт усного виводу до
системного prompt:

```text
{"spoken":"..."}
```

Voice Call захисно витягує текст мовлення:

- Ігнорує payload, позначені як reasoning/error content.
- Розбирає прямий JSON, JSON у fenced-блоці або inline-ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє ймовірні вступні абзаци планування/метаданих.

Це тримає озвучене відтворення сфокусованим на тексті для абонента й запобігає
потраплянню тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив'язана до живого
стану відтворення:

- Очищення черги під час переривання та автовідповідь пригнічуються лише тоді, коли початкове привітання активно озвучується.
- Якщо початкове відтворення завершується помилкою, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового Twilio починається під час підключення потоку без додаткової затримки.
- Переривання скасовує активне відтворення й очищує записи Twilio TTS, що стоять у черзі, але ще не відтворюються. Очищені записи розв'язуються як пропущені, тож логіка подальшої відповіді може продовжуватися без очікування аудіо, яке ніколи не буде відтворено.
- Розмови realtime voice використовують власний початковий хід realtime-потоку. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` залишаються підключеними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає **2000 мс** перед
автоматичним завершенням виклику:

- Якщо потік повторно підключається протягом цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду жоден потік не реєструється повторно, виклик завершується, щоб запобігти завислим активним викликам.

## Очищувач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують термінальний
Webhook (наприклад, виклики в режимі notify, які ніколи не завершуються). Типове значення
— `0` (вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі notify.
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

Коли proxy або тунель стоїть перед Gateway, plugin
відтворює публічний URL для перевірки підпису. Ці параметри
керують тим, яким forwarded-заголовкам можна довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Allowlist хостів із forwarding-заголовків.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти forwarded-заголовкам без allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти forwarded-заголовкам лише тоді, коли віддалена IP-адреса запиту збігається зі списком.
</ParamField>

Додаткові засоби захисту:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio і Plivo. Повторно відтворені дійсні Webhook-запити підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмов Twilio містять токен на кожен хід у callbacks `<Gather>`, тому застарілі/повторно відтворені callbacks мовлення не можуть задовольнити новіший очікуваний хід transcript.
- Неавтентифіковані Webhook-запити відхиляються до читання тіла, якщо відсутні обов'язкові заголовки підпису provider.
- Webhook voice-call використовує спільний профіль тіла pre-auth (64 КБ / 5 секунд) плюс обмеження одночасних запитів на IP до перевірки підпису.

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
Webhook-сервер. Якщо Gateway недоступний, команди повертаються до
автономного CLI runtime.

`latency` читає `calls.jsonl` зі стандартного шляху зберігання voice-call.
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

Цей repo постачає відповідний документ skill за шляхом `skills/voice-call/SKILL.md`.

## Gateway RPC

| Метод                | Аргументи                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` дійсний лише з `mode: "conversation"`. Виклики в режимі notify
мають використовувати `voicecall.dtmf` після створення виклику, якщо їм потрібні
цифри після підключення.

## Усунення несправностей

### Налаштування не вдається через exposure Webhook

Запустіть налаштування з того самого середовища, у якому працює Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` і `plivo` `webhook-exposure` має бути зеленим. Налаштований
`publicUrl` усе одно завершується помилкою, коли він вказує на локальний або приватний мережевий
простір, тому що оператор не може викликати ці адреси у відповідь. Не використовуйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Використовуйте один публічний шлях exposure:

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

`voicecall smoke` — це dry run, якщо не передати `--yes`.

### Не вдається перевірити облікові дані провайдера

Перевірте вибраного провайдера та обов’язкові поля облікових даних:

- Twilio: `twilio.accountSid`, `twilio.authToken` і `fromNumber`, або
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` і `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` і
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` і `fromNumber`.

Облікові дані мають існувати на хості Gateway. Редагування локального профілю оболонки
не впливає на вже запущений Gateway, доки він не перезапуститься або не перезавантажить
своє середовище.

### Виклики запускаються, але Webhook-и провайдера не надходять

Переконайтеся, що консоль провайдера вказує на точну публічну URL-адресу Webhook:

```text
https://voice.example.com/voice/webhook
```

Потім перевірте стан виконання:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
```

Поширені причини:

- `publicUrl` вказує на інший шлях, ніж `serve.path`.
- URL тунелю змінився після запуску Gateway.
- Проксі пересилає запит, але видаляє або переписує заголовки host/proto.
- Брандмауер або DNS спрямовує публічне ім’я хоста кудись іще, а не до Gateway.
- Gateway було перезапущено без увімкненого Plugin Voice Call.

Коли перед Gateway стоїть зворотний проксі або тунель, задайте
`webhookSecurity.allowedHosts` як публічне ім’я хоста або використайте
`webhookSecurity.trustedProxyIPs` для відомої адреси проксі. Використовуйте
`webhookSecurity.trustForwardingHeaders` лише тоді, коли межа проксі перебуває під
вашим контролем.

### Не вдається перевірити підпис

Підписи провайдера перевіряються відносно публічної URL-адреси, яку OpenClaw відтворює
з вхідного запиту. Якщо перевірка підписів не вдається:

- Переконайтеся, що URL Webhook провайдера точно відповідає `publicUrl`, включно зі
  схемою, хостом і шляхом.
- Для URL-адрес безплатного рівня ngrok оновлюйте `publicUrl`, коли змінюється ім’я хоста тунелю.
- Переконайтеся, що проксі зберігає початкові заголовки host і proto, або налаштуйте
  `webhookSecurity.allowedHosts`.
- Не вмикайте `skipSignatureVerification` поза локальним тестуванням.

### Збої підключення Google Meet через Twilio

Google Meet використовує цей Plugin для підключень через телефонний набір Twilio. Спочатку перевірте Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Потім явно перевірте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Якщо Voice Call працює, але учасник Meet так і не приєднується, перевірте номер
дозвону Meet, PIN і `--dtmf-sequence`. Телефонний виклик може бути справним, тоді як
зустріч відхиляє або ігнорує неправильну DTMF-послідовність.

Google Meet передає DTMF-послідовність Meet і вступний текст до `voicecall.start`.
Для викликів Twilio Voice Call спочатку віддає DTMF TwiML, перенаправляє назад до
Webhook, а потім відкриває медіапотік реального часу, щоб збережений вступ було
згенеровано після приєднання телефонного учасника до зустрічі.

### У виклику реального часу немає мовлення

Переконайтеся, що увімкнено лише один аудіорежим. `realtime.enabled` і
`streaming.enabled` не можуть одночасно мати значення true.

Для викликів Twilio у реальному часі також перевірте:

- Plugin провайдера реального часу завантажено та зареєстровано.
- `realtime.provider` не задано або він називає зареєстрованого провайдера.
- Ключ API провайдера доступний процесу Gateway.
- `openclaw voicecall tail` показує, що медіапотік прийнято, а провайдер реального часу
  готовий до початкового привітання.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
