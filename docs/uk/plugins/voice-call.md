---
read_when:
    - Ви хочете здійснити вихідний голосовий виклик з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin для голосових викликів
    - Вам потрібен голосовий зв’язок у реальному часі або потокова транскрипція для телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові виклики через Twilio, Telnyx або Plivo, з опційним голосовим зв’язком у реальному часі та потоковою транскрипцією
title: Plugin для голосових викликів
x-i18n:
    generated_at: "2026-04-28T11:21:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2847b22c29f224d58390993ddc2d9af499e18e7f9a652f1d5dfa3b6f110c50b
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосові виклики для OpenClaw через Plugin. Підтримує вихідні сповіщення,
багатораундові розмови, повнодуплексний голос у реальному часі, потокову
транскрипцію та вхідні виклики з політиками списку дозволених.

**Поточні постачальники:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (розробка/без мережі).

<Note>
Plugin Voice Call працює **всередині процесу Gateway**. Якщо ви використовуєте
віддалений Gateway, встановіть і налаштуйте Plugin на машині, де працює
Gateway, а потім перезапустіть Gateway, щоб завантажити його.
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
      <Tab title="З локальної теки (розробка)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Після цього перезапустіть Gateway, щоб Plugin завантажився.

  </Step>
  <Step title="Налаштуйте постачальника та webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (повну
    структуру див. нижче в розділі [Конфігурація](#configuration)). Мінімум:
    `provider`, облікові дані постачальника, `fromNumber` і загальнодоступна
    URL-адреса webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручний для читання в журналах чату й терміналах. Він
    перевіряє, чи ввімкнено Plugin, облікові дані постачальника, доступність
    webhook і те, що активний лише один аудіорежим (`streaming` або `realtime`).
    Для скриптів використовуйте `--json`.

  </Step>
  <Step title="Smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    За замовчуванням обидві команди виконуються як пробні запуски. Додайте
    `--yes`, щоб фактично здійснити короткий вихідний виклик зі сповіщенням:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначати **публічну URL-адресу webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний варіант `serve`
визначається як loopback чи простір приватної мережі, налаштування завершується
помилкою замість запуску постачальника, який не зможе отримувати carrier webhook.
</Warning>

## Конфігурація

Якщо `enabled: true`, але для вибраного постачальника бракує облікових даних,
під час запуску Gateway записує попередження про незавершене налаштування з
відсутніми ключами та пропускає запуск середовища виконання. Команди, RPC-виклики
й інструменти агента все одно повертають точну відсутню конфігурацію
постачальника під час використання.

<Note>
Облікові дані voice-call приймають SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` розв'язуються через стандартну поверхню SecretRef; див. [поверхню облікових даних SecretRef](/uk/reference/secretref-credential-surface).
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
  <Accordion title="Примітки щодо доступності постачальника та безпеки">
    - Twilio, Telnyx і Plivo всі потребують URL-адреси webhook, **доступної публічно**.
    - `mock` — локальний постачальник для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безплатному рівні ngrok задайте для `publicUrl` точну URL-адресу ngrok; перевірка підпису завжди примусова.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL-адреси безплатного рівня ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміщується, підписи Twilio не проходять перевірку. Для production віддавайте перевагу стабільному домену або funnel Tailscale.

  </Accordion>
  <Accordion title="Обмеження потокових з'єднань">
    - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
    - `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані сокети до старту для кожної вихідної IP-адреси.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувані + активні).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації, що використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Резервний механізм під час виконання поки що приймає старі ключі voice-call,
    але шлях переписування — `openclaw doctor --fix`, а сумісна прокладка є
    тимчасовою.

    Автоматично мігровані ключі streaming:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного постачальника голосу в реальному часі для
живого аудіо виклику. Це окремо від `streaming`, який лише пересилає аудіо
постачальникам транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим для кожного виклику.
</Warning>

Поточна поведінка середовища виконання:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` є необов'язковим. Якщо не задано, Voice Call використовує першого зареєстрованого постачальника голосу в реальному часі.
- Вбудовані постачальники голосу в реальному часі: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми Plugin постачальників.
- Необроблена конфігурація, що належить постачальнику, зберігається в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням відкриває спільний інструмент реального часу `openclaw_agent_consult`. Модель реального часу може викликати його, коли абонент просить глибшого міркування, поточної інформації або звичайних інструментів OpenClaw.
- Якщо `realtime.provider` вказує на незареєстрованого постачальника або жодного постачальника голосу в реальному часі не зареєстровано, Voice Call записує попередження й пропускає realtime media замість того, щоб зупиняти весь Plugin.
- Ключі сесії консультації повторно використовують наявну голосову сесію, коли вона доступна, а потім повертаються до номера телефону абонента/одержувача, щоб наступні виклики консультації зберігали контекст під час виклику.

### Політика інструментів

`realtime.toolPolicy` керує запуском консультації:

| Політика         | Поведінка                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Відкрити інструмент консультації та обмежити звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Відкрити інструмент консультації та дозволити звичайному агенту використовувати звичайну політику інструментів агента.                  |
| `none`           | Не відкривати інструмент консультації. Користувацькі `realtime.tools` усе одно передаються постачальнику реального часу.                |

### Приклади постачальників реального часу

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

Див. [постачальника Google](/uk/providers/google) і
[постачальника OpenAI](/uk/providers/openai), щоб переглянути параметри голосу
в реальному часі, специфічні для постачальника.

## Потокова транскрипція

`streaming` вибирає постачальника транскрипції в реальному часі для живого аудіо виклику.

Поточна поведінка середовища виконання:

- `streaming.provider` є необов'язковим. Якщо не задано, Voice Call використовує першого зареєстрованого постачальника транскрипції в реальному часі.
- Вбудовані постачальники транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми Plugin постачальників.
- Необроблена конфігурація, що належить постачальнику, зберігається в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого постачальника або жодного не зареєстровано, Voice Call записує попередження й пропускає потокове передавання медіа замість того, щоб зупиняти весь Plugin.

### Приклади постачальників streaming

<Tabs>
  <Tab title="OpenAI">
    За замовчуванням: API-ключ `streaming.providers.openai.apiKey` або
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
**такою самою формою** — вона глибоко обʼєднується з `messages.tts`.

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
**Мовлення Microsoft ігнорується для голосових викликів.** Телефонному аудіо потрібен PCM;
поточний транспорт Microsoft не надає телефонний PCM-вивід.
</Warning>

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; закомічена конфігурація має використовувати `tts.providers.<provider>`.
- Основний TTS використовується, коли ввімкнено потокове медіа Twilio; інакше виклики повертаються до нативних голосів провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS у цьому стані недоступний, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли переривання Twilio або завершення потоку очищає чергу TTS, поставлені в чергу запити відтворення завершуються, а не залишають абонентів чекати завершення відтворення.

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
`inboundPolicy: "allowlist"` — це перевірка caller ID з низьким рівнем гарантії. Plugin нормалізує надане провайдером значення `From` і порівнює його з `allowFrom`. Перевірка Webhook автентифікує доставку провайдером і цілісність корисного навантаження, але **не** доводить володіння номером абонента PSTN/VoIP. Розглядайте `allowFrom` як фільтрацію caller ID, а не як надійну ідентичність абонента.
</Warning>

Автовідповіді використовують агентну систему. Налаштовуйте їх за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Контракт мовленнєвого виводу

Для автовідповідей Voice Call додає до системного prompt строгий контракт мовленнєвого виводу:

```text
{"spoken":"..."}
```

Voice Call захисно витягує текст мовлення:

- Ігнорує корисні навантаження, позначені як вміст reasoning/error.
- Розбирає прямий JSON, JSON у fenced-блоці або inline-ключі `"spoken"`.
- Повертається до простого тексту та видаляє ймовірні вступні абзаци планування/метаданих.

Це утримує мовленнєве відтворення сфокусованим на тексті для абонента та запобігає
потраплянню тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення привʼязана до живого
стану відтворення:

- Очищення черги під час переривання та автовідповідь пригнічуються лише тоді, коли початкове привітання активно промовляється.
- Якщо початкове відтворення завершується помилкою, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового Twilio запускається під час підключення потоку без додаткової затримки.
- Переривання скасовує активне відтворення та очищає записи Twilio TTS, які поставлені в чергу, але ще не відтворюються. Очищені записи завершуються як пропущені, тому логіка подальшої відповіді може продовжуватися без очікування аудіо, яке ніколи не буде відтворено.
- Розмови Realtime voice використовують власний початковий хід realtime-потоку. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` залишаються підключеними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає **2000 мс** перед
автоматичним завершенням виклику:

- Якщо потік повторно підключається протягом цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду жоден потік не реєструється знову, виклик завершується, щоб запобігти завислим активним викликам.

## Очищувач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують термінальний
Webhook (наприклад, виклики в режимі сповіщення, які ніколи не завершуються). Типове значення
дорівнює `0` (вимкнено).

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
реконструює публічну URL-адресу для перевірки підпису. Ці параметри
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

- **Захист від повторного відтворення** Webhook увімкнено для Twilio і Plivo. Повторно відтворені дійсні запити Webhook підтверджуються, але пропускаються щодо побічних ефектів.
- Ходи розмов Twilio містять токен для кожного ходу в callback-викликах `<Gather>`, тому застарілі або повторно відтворені callback-виклики мовлення не можуть задовольнити новіший очікуваний хід транскрипта.
- Неавтентифіковані запити Webhook відхиляються до читання тіла, коли відсутні обовʼязкові заголовки підпису провайдера.
- Webhook voice-call використовує спільний pre-auth профіль тіла (64 КБ / 5 секунд) плюс обмеження одночасних запитів для кожної IP-адреси перед перевіркою підпису.

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

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call.
Використовуйте `--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити
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

## Повʼязане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
