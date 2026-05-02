---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте Plugin для голосових викликів
    - Вам потрібен голосовий зв’язок у реальному часі або потокова транскрипція для телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові дзвінки через Twilio, Telnyx або Plivo, з опційною голосовою взаємодією в реальному часі та потоковою транскрипцією
title: Plugin голосових викликів
x-i18n:
    generated_at: "2026-05-02T07:52:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc27646aca94c88d50d42838e166ac81eba3373154797cbb564e9c2eab0533fa
    source_path: plugins/voice-call.md
    workflow: 16
---

Voice calls for OpenClaw через Plugin. Підтримує вихідні сповіщення,
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
    пакета походить зі старішої зовнішньої гілки пакування; використовуйте
    поточну пакетовану збірку OpenClaw або шлях до локальної папки, доки не буде
    опубліковано новіший npm-пакет.

    Після цього перезапустіть Gateway, щоб plugin завантажився.

  </Step>
  <Step title="Configure provider and webhook">
    Задайте конфігурацію в `plugins.entries.voice-call.config` (повну форму див.
    у розділі [Конфігурація](#configuration) нижче). Мінімально потрібні:
    `provider`, облікові дані провайдера, `fromNumber` і публічно
    доступний URL Webhook.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручно читати в журналах чату й терміналах. Він перевіряє,
    чи plugin увімкнений, облікові дані провайдера, доступність Webhook і те,
    що активний лише один аудіорежим (`streaming` або `realtime`). Використовуйте
    `--json` для скриптів.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди за замовчуванням виконують пробний запуск. Додайте `--yes`,
    щоб фактично здійснити короткий вихідний виклик-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначати **публічний URL Webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний serve-варіант
визначається як loopback чи приватний мережевий простір, налаштування
завершується помилкою замість запуску провайдера, який не зможе отримувати
Webhook від операторів.
</Warning>

## Конфігурація

Якщо `enabled: true`, але для вибраного провайдера бракує облікових даних,
під час запуску Gateway записує попередження про неповне налаштування з
відсутніми ключами та пропускає запуск runtime. Команди, RPC-виклики й
інструменти агента все одно повертають точну відсутню конфігурацію провайдера
під час використання.

<Note>
Облікові дані voice-call приймають SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` визначаються через стандартну поверхню SecretRef; див. [поверхню облікових даних SecretRef](/uk/reference/secretref-credential-surface).
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
    - `mock` — локальний dev-провайдер (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безкоштовному рівні ngrok задайте `publicUrl` як точний URL ngrok; перевірка підпису завжди примусова.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL безкоштовного рівня ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміщується, підписи Twilio не проходять перевірку. Для production надавайте перевагу стабільному домену або funnel Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих pre-start сокетів.
    - `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих pre-start сокетів на IP-адресу джерела.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (pending + active).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Старіші конфігурації, які використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Runtime fallback поки що все ще приймає старі ключі voice-call, але
    шлях переписування — `openclaw doctor --fix`, а compat shim є
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

За замовчуванням Voice Call використовує `sessionScope: "per-phone"`, тож
повторні виклики від того самого абонента зберігають пам’ять розмови. Задайте
`sessionScope: "per-call"`, коли кожен операторський виклик має починатися зі
свіжим контекстом, наприклад для рецепції, бронювання, IVR або потоків мосту
Google Meet, де той самий номер телефону може представляти різні зустрічі.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного голосового провайдера реального часу для
живого аудіо виклику. Це окремо від `streaming`, який лише передає аудіо
провайдерам транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим для кожного виклику.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` необов’язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого голосового провайдера реального часу.
- Вбудовані голосові провайдери реального часу: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми provider plugins.
- Сира конфігурація, якою володіє провайдер, розміщується в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням надає спільний інструмент реального часу `openclaw_agent_consult`. Модель реального часу може викликати його, коли абонент просить глибше міркування, актуальну інформацію або звичайні інструменти OpenClaw.
- `realtime.fastContext.enabled` за замовчуванням вимкнено. Коли ввімкнено, Voice Call спочатку шукає проіндексовану пам’ять/контекст сесії для запитання consult і повертає ці фрагменти моделі реального часу в межах `realtime.fastContext.timeoutMs`, перш ніж переходити до повного consult agent лише якщо `realtime.fastContext.fallbackToConsult` дорівнює true.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або взагалі не зареєстровано жодного голосового провайдера реального часу, Voice Call записує попередження й пропускає realtime media замість того, щоб зупиняти весь plugin.
- Ключі сесії consult повторно використовують збережену сесію виклику, коли вона доступна, а потім повертаються до налаштованого `sessionScope` (`per-phone` за замовчуванням або `per-call` для ізольованих викликів).

### Політика інструментів

`realtime.toolPolicy` керує запуском consult:

| Політика         | Поведінка                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Надає інструмент consult і обмежує звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Надає інструмент consult і дозволяє звичайному агенту використовувати стандартну політику інструментів агента.                          |
| `none`           | Не надає інструмент consult. Користувацькі `realtime.tools` все одно передаються провайдеру реального часу.                              |

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

Див. [провайдер Google](/uk/providers/google) і
[провайдер OpenAI](/uk/providers/openai), щоб переглянути специфічні для провайдера
параметри голосу реального часу.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для живого аудіо виклику.

Поточна поведінка runtime:

- `streaming.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого зареєстрованого провайдера транскрибування в реальному часі.
- Вбудовані провайдери транскрибування в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми провайдерськими plugins.
- Необроблена конфігурація, якою володіє провайдер, розміщується в `streaming.providers.<providerId>`.
- Після того як Twilio надсилає прийняте повідомлення `start` для потоку, Voice Call негайно реєструє потік, ставить вхідні медіадані в чергу через провайдера транскрибування, доки провайдер підключається, і запускає початкове привітання лише після готовності транскрибування в реальному часі.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або жоден провайдер не зареєстрований, Voice Call записує попередження в журнал і пропускає потокове передавання медіа замість того, щоб спричинити збій усього plugin.

### Приклади провайдерів потокового передавання

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
**такою самою структурою** — вона глибоко об’єднується з `messages.tts`.

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

Нотатки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; закомічена конфігурація має використовувати `tts.providers.<provider>`.
- Основний TTS використовується, коли ввімкнено потокове передавання медіа Twilio; інакше виклики повертаються до нативних голосів провайдера.
- Якщо медіапотік Twilio уже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS недоступний у цьому стані, запит відтворення завершується з помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до резервного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in Twilio або завершення потоку очищає чергу очікування TTS, запити відтворення в черзі завершуються, а не залишають абонентів у завислому стані в очікуванні завершення відтворення.

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

Типова вхідна політика — `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — це перевірка caller-ID з низьким рівнем гарантії. 
Plugin нормалізує надане провайдером значення `From` і порівнює його з
`allowFrom`. Перевірка Webhook автентифікує доставку провайдером і
цілісність payload, але вона **не** доводить володіння номером абонента
PSTN/VoIP. Сприймайте `allowFrom` як фільтрацію caller-ID, а не як надійну
ідентифікацію абонента.
</Warning>

Автовідповіді використовують агентну систему. Налаштовуйте за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Контракт мовленнєвого виводу

Для автовідповідей Voice Call додає до системного prompt строгий контракт
мовленнєвого виводу:

```text
{"spoken":"..."}
```

Voice Call обережно витягує текст мовлення:

- Ігнорує payload, позначені як вміст reasoning/error.
- Розбирає прямий JSON, JSON у fenced-блоці або inline-ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє ймовірні вступні абзаци з плануванням або метаданими.

Це утримує мовленнєве відтворення зосередженим на тексті для абонента й запобігає
потраплянню тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив’язана до
поточного стану відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише тоді, коли початкове привітання активно промовляється.
- Якщо початкове відтворення завершується з помилкою, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio починається під час підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищає записи Twilio TTS, які стоять у черзі, але ще не відтворюються. Очищені записи завершуються як пропущені, тож логіка подальшої відповіді може продовжуватися без очікування аудіо, яке ніколи не буде відтворене.
- Голосові розмови в реальному часі використовують власний початковий хід потоку в реальному часі. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` залишаються приєднаними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call очікує **2000 ms** перед
автоматичним завершенням виклику:

- Якщо потік повторно підключається впродовж цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду жоден потік не реєструється повторно, виклик завершується, щоб запобігти завислим активним викликам.

## Очищення застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують фінальний
webhook (наприклад, виклики в режимі сповіщення, які ніколи не завершуються). Типове значення
— `0` (вимкнено).

Рекомендовані діапазони:

- **Продакшн:** `120`–`300` секунд для потоків у стилі сповіщень.
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

Коли proxy або tunnel розташований перед Gateway, plugin
відтворює публічну URL-адресу для перевірки підпису. Ці параметри
контролюють, яким forwarded headers довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Список дозволених хостів із forwarding headers.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти forwarded headers без списку дозволених.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти forwarded headers лише тоді, коли remote IP запиту відповідає списку.
</ParamField>

Додаткові захисти:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio і Plivo. Повторно відтворені дійсні webhook-запити підтверджуються, але пропускаються для побічних ефектів.
- Ходи розмови Twilio містять токен на кожен хід у callbacks `<Gather>`, тому застарілі або повторно відтворені callbacks мовлення не можуть задовольнити новіший очікуваний хід transcript.
- Неавтентифіковані webhook-запити відхиляються до читання тіла, якщо відсутні обов’язкові заголовки підпису провайдера.
- Webhook voice-call використовує спільний pre-auth профіль тіла (64 KB / 5 секунд) плюс per-IP ліміт одночасних запитів до перевірки підпису.

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
runtime голосових викликів, яким володіє Gateway, щоб CLI не прив’язував другий
webhook-сервер. Якщо Gateway недоступний, команди повертаються до
автономного CLI runtime.

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call.
Використовуйте `--file <path>`, щоб вказати інший журнал, і `--last <n>`, щоб обмежити
аналіз останніми N записами (типово 200). Вивід містить p50/p90/p99
для затримки ходу й часу очікування прослуховування.

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

`dtmfSequence` дійсний лише з `mode: "conversation"`. Виклики в режимі сповіщення
мають використовувати `voicecall.dtmf` після створення виклику, якщо їм потрібні
цифри після підключення.

## Усунення несправностей

### Налаштування не може виставити Webhook

Запустіть налаштування з того самого середовища, у якому працює Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` і `plivo` `webhook-exposure` має бути зеленим. Налаштований `publicUrl` усе одно завершується помилкою, коли він указує на локальний або приватний мережевий простір, оскільки оператор не може виконати зворотний виклик на ці адреси. Не використовуйте `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Вихідні дзвінки Twilio у режимі сповіщень надсилають початковий `<Say>` TwiML безпосередньо в запиті створення дзвінка, тому перше озвучене повідомлення не залежить від того, чи Twilio отримає webhook TwiML. Публічний webhook усе ще потрібен для зворотних викликів стану, розмовних дзвінків, DTMF перед з’єднанням, потоків реального часу та керування дзвінком після з’єднання.

Використайте один шлях публічної доступності:

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

`voicecall smoke` виконує пробний запуск, якщо не передати `--yes`.

### Облікові дані провайдера не працюють

Перевірте вибраного провайдера та обов’язкові поля облікових даних:

- Twilio: `twilio.accountSid`, `twilio.authToken` і `fromNumber`, або `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` і `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` і `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` і `fromNumber`.

Облікові дані мають існувати на хості Gateway. Редагування локального профілю оболонки не впливає на вже запущений Gateway, доки він не перезапуститься або не перезавантажить своє середовище.

### Дзвінки запускаються, але webhook провайдера не надходять

Переконайтеся, що консоль провайдера вказує на точну публічну URL-адресу webhook:

```text
https://voice.example.com/voice/webhook
```

Потім перегляньте стан виконання:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Поширені причини:

- `publicUrl` указує на інший шлях, ніж `serve.path`.
- URL тунелю змінився після запуску Gateway.
- Проксі пересилає запит, але видаляє або переписує заголовки host/proto.
- Брандмауер або DNS спрямовує публічне ім’я хоста не на Gateway.
- Gateway було перезапущено без увімкненого Plugin Voice Call.

Коли перед Gateway стоїть зворотний проксі або тунель, установіть `webhookSecurity.allowedHosts` на публічне ім’я хоста або використайте `webhookSecurity.trustedProxyIPs` для відомої адреси проксі. Використовуйте `webhookSecurity.trustForwardingHeaders` лише тоді, коли межа проксі перебуває під вашим контролем.

### Перевірка підпису не проходить

Підписи провайдера перевіряються відносно публічної URL-адреси, яку OpenClaw відтворює з вхідного запиту. Якщо підписи не проходять перевірку:

- Переконайтеся, що URL webhook у провайдера точно збігається з `publicUrl`, включно зі схемою, хостом і шляхом.
- Для URL ngrok безплатного рівня оновлюйте `publicUrl`, коли ім’я хоста тунелю змінюється.
- Переконайтеся, що проксі зберігає початкові заголовки host і proto, або налаштуйте `webhookSecurity.allowedHosts`.
- Не вмикайте `skipSignatureVerification` поза локальним тестуванням.

### Приєднання Google Meet через Twilio не працює

Google Meet використовує цей Plugin для приєднання через телефонний набір Twilio. Спочатку перевірте Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Потім явно перевірте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Якщо Voice Call має зелений статус, але учасник Meet так і не приєднується, перевірте номер для телефонного підключення Meet, PIN і `--dtmf-sequence`. Телефонний дзвінок може бути справним, тоді як зустріч відхиляє або ігнорує неправильну послідовність DTMF.

Google Meet передає послідовність DTMF Meet і вступний текст у `voicecall.start`. Для дзвінків Twilio Voice Call спочатку обслуговує DTMF TwiML, перенаправляє назад на webhook, а потім відкриває медіапотік реального часу, щоб збережений вступ було згенеровано після приєднання телефонного учасника до зустрічі.

Використовуйте `openclaw logs --follow` для трасування фази в реальному часі. Справне приєднання Twilio Meet записує такий порядок:

- Google Meet делегує приєднання Twilio до Voice Call.
- Voice Call зберігає DTMF TwiML перед з’єднанням.
- Початковий TwiML Twilio споживається й обслуговується перед обробкою в реальному часі.
- Voice Call обслуговує TwiML реального часу для дзвінка Twilio.
- Міст реального часу запускається з поставленим у чергу початковим привітанням.

`openclaw voicecall tail` усе ще показує збережені записи дзвінків; це корисно для стану дзвінка й транскриптів, але не кожен перехід webhook або реального часу з’являється там.

### У дзвінку реального часу немає мовлення

Переконайтеся, що ввімкнено лише один аудіорежим. `realtime.enabled` і `streaming.enabled` не можуть одночасно мати значення true.

Для дзвінків Twilio у реальному часі також перевірте:

- Plugin провайдера реального часу завантажено й зареєстровано.
- `realtime.provider` не встановлено або вказує на зареєстрованого провайдера.
- Ключ API провайдера доступний процесу Gateway.
- `openclaw logs --follow` показує, що TwiML реального часу обслуговується, міст реального часу запущено, а початкове привітання поставлено в чергу.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
