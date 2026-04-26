---
read_when:
    - Ви хочете здійснити вихідний голосовий виклик з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
    - Вам потрібен голосовий зв’язок у реальному часі або потокова транскрипція в телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові виклики через Twilio, Telnyx або Plivo, з необов’язковою голосовою взаємодією в реальному часі та потоковою транскрипцією
title: Плагін голосових викликів
x-i18n:
    generated_at: "2026-04-26T05:46:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

Голосові виклики для OpenClaw через Plugin. Підтримує вихідні сповіщення,
багатокрокові розмови, повнодуплексний голосовий зв’язок у реальному часі, потокову
транскрипцію та вхідні виклики з політиками списку дозволених номерів.

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
      <Tab title="З npm (рекомендовано)">
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

    Після цього перезапустіть Gateway, щоб Plugin завантажився.

  </Step>
  <Step title="Налаштуйте провайдера та Webhook">
    Укажіть конфігурацію в `plugins.entries.voice-call.config` (див.
    [Конфігурація](#configuration) нижче для повної структури). Мінімально потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і
    публічно доступна URL-адреса Webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручно читати в журналах чату та терміналах. Команда перевіряє
    увімкнення Plugin, облікові дані провайдера, доступність Webhook і те,
    що активний лише один аудіорежим (`streaming` або `realtime`). Для
    скриптів використовуйте `--json`.

  </Step>
  <Step title="Виконайте smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    За замовчуванням обидві команди виконуються як dry run. Додайте `--yes`, щоб
    справді здійснити короткий вихідний дзвінок-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначатися як **публічна URL-адреса Webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний варіант serve
визначається як loopback або приватний мережевий простір, налаштування завершиться помилкою замість
запуску провайдера, який не зможе отримувати carrier Webhook.
</Warning>

## Конфігурація

Якщо `enabled: true`, але для вибраного провайдера відсутні облікові дані,
під час запуску Gateway у журналі з’явиться попередження про неповне налаштування з відсутніми ключами, а
запуск runtime буде пропущено. Команди, RPC-виклики та інструменти агента все одно
повертатимуть точну відсутню конфігурацію провайдера під час використання.

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

          // Публічний доступ (виберіть один)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* див. Потокова транскрипція */ },
          realtime: { enabled: false /* див. Голосовий зв’язок у реальному часі */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Примітки щодо публічного доступу провайдера та безпеки">
    - Twilio, Telnyx і Plivo усі потребують **публічно доступної** URL-адреси Webhook.
    - `mock` — це локальний провайдер для розробки (без мережевих викликів).
    - Для Telnyx потрібен `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо лише `skipSignatureVerification` не має значення true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безкоштовному тарифі ngrok установіть `publicUrl` на точну URL-адресу ngrok; перевірка підпису завжди примусово увімкнена.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` — це loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL-адреси безкоштовного тарифу ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio перестануть проходити перевірку. Для production: надавайте перевагу стабільному домену або funnel у Tailscale.
  </Accordion>
  <Accordion title="Обмеження підключень для потокової передачі">
    - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають коректний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до початку роботи.
    - `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до початку роботи на одну вихідну IP-адресу.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікування + активні).
  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Старіші конфігурації, що використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI у `streaming.*`, переписуються за допомогою `openclaw doctor --fix`.
    Резервна сумісність runtime поки що все ще приймає старі ключі voice-call, але
    шлях переписування — це `openclaw doctor --fix`, а shim сумісності —
    тимчасовий.

    Ключі потокової передачі, що мігруються автоматично:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного провайдера голосового зв’язку в реальному часі для живого аудіо виклику.
Він відокремлений від `streaming`, який лише пересилає аудіо
провайдерам транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим на виклик.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера голосового зв’язку в реальному часі.
- Вбудовані провайдери голосового зв’язку в реальному часі: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми Plugin провайдерів.
- Необроблена конфігурація, що належить провайдеру, зберігається в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням надає спільний інструмент реального часу `openclaw_agent_consult`. Модель реального часу може викликати його, коли абоненту потрібні глибші міркування, актуальна інформація або звичайні інструменти OpenClaw.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або взагалі не зареєстровано жодного провайдера голосового зв’язку в реальному часі, Voice Call записує попередження в журнал і пропускає медіа реального часу замість помилки для всього Plugin.
- Ключі сеансу consult повторно використовують наявний голосовий сеанс, коли це можливо, а потім повертаються до номера телефону того, хто дзвонить/кому дзвонять, щоб наступні consult-виклики зберігали контекст під час дзвінка.

### Політика інструментів

`realtime.toolPolicy` керує запуском consult:

| Політика           | Поведінка                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only`   | Надає інструмент consult і обмежує звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`            | Надає інструмент consult і дозволяє звичайному агенту використовувати стандартну політику інструментів агента.                           |
| `none`             | Не надає інструмент consult. Користувацькі `realtime.tools` усе одно передаються провайдеру реального часу.                              |

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
                instructions: "Говори коротко. Викликай openclaw_agent_consult перед використанням глибших інструментів.",
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
[OpenAI provider](/uk/providers/openai) для параметрів голосового зв’язку в реальному часі,
специфічних для провайдера.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для живого аудіо виклику.

Поточна поведінка runtime:

- `streaming.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми Plugin провайдерів.
- Необроблена конфігурація, що належить провайдеру, зберігається в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або не зареєстровано жодного, Voice Call записує попередження в журнал і пропускає медіапотік замість помилки для всього Plugin.

### Приклади провайдерів потокової передачі

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
синтезу мовлення під час викликів. Її можна перевизначити в конфігурації Plugin із
**тією самою структурою** — вона глибоко об’єднується з `messages.tts`.

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
поточний транспорт Microsoft не надає телекомунікаційний PCM-вивід.
</Warning>

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються за допомогою `openclaw doctor --fix`; збережена конфігурація має використовувати `tts.providers.<provider>`.
- Базовий TTS використовується, коли увімкнено потокову передачу медіа Twilio; інакше виклики повертаються до голосів, вбудованих у провайдера.
- Якщо потік медіа Twilio уже активний, Voice Call не повертається до TwiML `<Say>`. Якщо TTS для телефонії недоступний у цьому стані, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS для телефонії повертається до вторинного провайдера, Voice Call записує попередження в журнал із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in Twilio або завершення потоку очищає чергу TTS, що очікує, запити на відтворення в черзі завершуються замість того, щоб змушувати абонентів чекати завершення відтворення.

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

Політика вхідних викликів за замовчуванням має значення `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Привіт! Чим я можу допомогти?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — це екранування caller ID з низьким рівнем достовірності. 
Plugin нормалізує значення `From`, надане провайдером, і порівнює його з
`allowFrom`. Перевірка Webhook автентифікує доставку провайдера та
цілісність payload, але **не** доводить право власності на номер
того, хто телефонує, у PSTN/VoIP. Розглядайте `allowFrom` як фільтрацію caller ID, а не як надійну
ідентичність абонента.
</Warning>

Автовідповіді використовують систему агента. Налаштовуйте їх за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Контракт озвученого виводу

Для автовідповідей Voice Call додає до системного промпту строгий контракт
озвученого виводу:

```text
{"spoken":"..."}
```

Voice Call захищено витягує текст мовлення:

- Ігнорує payload, позначені як reasoning/error content.
- Аналізує прямий JSON, JSON в огородженому блоці або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту та видаляє ймовірні вступні абзаци з плануванням/метаінформацією.

Це допомагає зосередити озвучене відтворення на тексті для абонента й уникати
потрапляння тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив’язана до стану
живого відтворення:

- Очищення черги через barge-in і автовідповідь пригнічуються лише поки початкове привітання активно озвучується.
- Якщо початкове відтворення завершується помилкою, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокової передачі Twilio запускається після підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищає записи TTS Twilio, що стоять у черзі, але ще не почали відтворюватися. Очищені записи завершуються як пропущені, тож подальша логіка відповіді може продовжитися без очікування аудіо, яке ніколи не буде відтворене.
- Голосові розмови в реальному часі використовують власний початковий хід потоку реального часу. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сеанси `<Connect><Stream>` залишаються підключеними.

### Пільговий період при від’єднанні потоку Twilio

Коли медіапотік Twilio від’єднується, Voice Call чекає **2000 мс** перед
автоматичним завершенням виклику:

- Якщо потік повторно підключається протягом цього вікна, авто-завершення скасовується.
- Якщо після пільгового періоду жоден потік не реєструється повторно, виклик завершується, щоб запобігти зависанню активних викликів.

## Очищувач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують термінального
Webhook (наприклад, виклики в режимі notify, які ніколи не завершуються). Значення за замовчуванням —
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
відновлює публічну URL-адресу для перевірки підпису. Ці параметри
керують тим, яким forwarded headers довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Список дозволених хостів із forwarding headers.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти forwarded headers без списку дозволених.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти forwarded headers лише коли віддалена IP-адреса запиту збігається зі списком.
</ParamField>

Додатковий захист:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio і Plivo. Повторно відтворені коректні запити Webhook підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмови Twilio включають токен на кожен хід у callback ` <Gather>`, тож застарілі/повторно відтворені callback мовлення не можуть задовольнити новіший хід транскрипції, що очікує.
- Неавтентифіковані запити Webhook відхиляються ще до читання тіла, якщо відсутні обов’язкові заголовки підпису провайдера.
- Webhook voice-call використовує спільний профіль тіла до автентифікації (64 КБ / 5 секунд) плюс обмеження на кількість одночасних запитів з однієї IP-адреси до перевірки підпису.

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
openclaw voicecall latency                      # зведення затримки ходів із журналів
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху зберігання voice-call.
Використовуйте `--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити
аналіз останніми N записами (типово 200). Вивід містить p50/p90/p99
для затримки ходу та часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`.

| Дія             | Аргументи                |
| --------------- | ------------------------ |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Цей репозиторій містить відповідний документ skill за адресою `skills/voice-call/SKILL.md`.

## Gateway RPC

| Метод               | Аргументи                |
| ------------------- | ------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
