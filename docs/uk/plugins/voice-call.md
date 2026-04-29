---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок із OpenClaw
    - Ви налаштовуєте або розробляєте Plugin голосових викликів
    - Потрібні голос у реальному часі або потокова транскрипція для телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні голосові виклики та приймайте вхідні через Twilio, Telnyx або Plivo, з додатковою підтримкою голосу в реальному часі й потокової транскрипції
title: Plugin для голосових дзвінків
x-i18n:
    generated_at: "2026-04-29T05:40:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Voice calls для OpenClaw через Plugin. Підтримує вихідні сповіщення,
багатоходові розмови, повнодуплексний голос у реальному часі, потокову
транскрипцію та вхідні дзвінки з політиками списку дозволених.

**Поточні провайдери:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (розробка/без мережі).

<Note>
Voice Call plugin працює **всередині процесу Gateway**. Якщо ви використовуєте
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

    Якщо npm повідомляє, що пакет, яким володіє OpenClaw, є застарілим, ця версія пакета
    походить зі старішої зовнішньої лінійки пакетів; використовуйте поточну пакетовану збірку
    OpenClaw або шлях до локальної папки, доки не буде опубліковано новіший npm-пакет.

    Після цього перезапустіть Gateway, щоб Plugin завантажився.

  </Step>
  <Step title="Configure provider and webhook">
    Установіть конфігурацію в `plugins.entries.voice-call.config` (повну структуру див.
    у розділі [Конфігурація](#configuration) нижче). Мінімум:
    `provider`, облікові дані провайдера, `fromNumber` і публічно
    доступна URL-адреса Webhook.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Типовий вивід зручно читати в журналах чату й терміналах. Він перевіряє
    ввімкнення Plugin, облікові дані провайдера, доступність Webhook і те,
    що активний лише один аудіорежим (`streaming` або `realtime`). Використовуйте
    `--json` для скриптів.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Обидві команди за замовчуванням є пробними запусками. Додайте `--yes`, щоб фактично здійснити короткий
    вихідний дзвінок-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначати **публічну URL-адресу Webhook**.
Якщо `publicUrl`, URL тунелю, URL Tailscale або резервний варіант serve
визначається як loopback чи приватний мережевий простір, налаштування завершується помилкою замість
запуску провайдера, який не зможе отримувати Webhook від операторів.
</Warning>

## Конфігурація

Якщо `enabled: true`, але у вибраного провайдера відсутні облікові дані,
під час запуску Gateway записує попередження про незавершене налаштування з відсутніми ключами та
пропускає запуск runtime. Команди, RPC-виклики й інструменти агента все одно
повертають точну відсутню конфігурацію провайдера під час використання.

<Note>
Облікові дані voice-call підтримують SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` обробляються через стандартну поверхню SecretRef; див. [поверхню облікових даних SecretRef](/uk/reference/secretref-credential-surface).
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
    - Twilio, Telnyx і Plivo всі потребують **публічно доступної** URL-адреси Webhook.
    - `mock` — локальний провайдер для розробки (без мережевих викликів).
    - Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не дорівнює true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безкоштовному рівні ngrok установіть `publicUrl` на точну URL-адресу ngrok; перевірка підпису завжди застосовується.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL безкоштовного рівня Ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` розходиться, підписи Twilio не проходять перевірку. Для production віддавайте перевагу стабільному домену або Tailscale funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний кадр `start`.
    - `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих pre-start сокетів.
    - `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані pre-start сокети на IP-адресу джерела.
    - `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувані + активні).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Старіші конфігурації, що використовують `provider: "log"`, `twilio.from` або застарілі
    ключі OpenAI `streaming.*`, переписуються командою `openclaw doctor --fix`.
    Резервний runtime поки що все ще приймає старі ключі voice-call, але
    шлях переписування — це `openclaw doctor --fix`, а compat shim є
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

`realtime` вибирає повнодуплексного голосового провайдера реального часу для живого аудіо
дзвінка. Це окремо від `streaming`, який лише пересилає аудіо до
провайдерів транскрипції в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим на дзвінок.
</Warning>

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.provider` необов’язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого голосового провайдера реального часу.
- Вбудовані голосові провайдери реального часу: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані їхніми provider plugins.
- Сира конфігурація, що належить провайдеру, розміщується в `realtime.providers.<providerId>`.
- Voice Call за замовчуванням відкриває спільний інструмент реального часу `openclaw_agent_consult`. Модель реального часу може викликати його, коли абонент просить глибшого reasoning, актуальну інформацію або звичайні інструменти OpenClaw.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або жоден голосовий провайдер реального часу не зареєстрований, Voice Call записує попередження й пропускає медіа реального часу замість того, щоб зупиняти весь Plugin.
- Ключі consult-сесії повторно використовують наявну голосову сесію, коли вона доступна, а потім переходять до номера телефону абонента/отримувача, щоб наступні consult-виклики зберігали контекст під час дзвінка.

### Політика інструментів

`realtime.toolPolicy` керує consult-запуском:

| Політика         | Поведінка                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Відкрити consult-інструмент і обмежити звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Відкрити consult-інструмент і дозволити звичайному агенту використовувати нормальну політику інструментів агента.                       |
| `none`           | Не відкривати consult-інструмент. Користувацькі `realtime.tools` все одно передаються провайдеру реального часу.                        |

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
реального часу.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для живого аудіо дзвінка.

Поточна поведінка runtime:

- `streaming.provider` необов’язковий. Якщо його не задано, Voice Call використовує першого зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані їхніми provider plugins.
- Сира конфігурація, що належить провайдеру, розміщується в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або жоден не зареєстрований, Voice Call записує попередження й пропускає потокове передавання медіа замість того, щоб зупиняти весь Plugin.

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
**Microsoft speech ігнорується для голосових викликів.** Телефонний звук потребує PCM;
поточний транспорт Microsoft не надає телефонного PCM-виводу.
</Warning>

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; зафіксована конфігурація має використовувати `tts.providers.<provider>`.
- Основний TTS використовується, коли потокове передавання медіа Twilio увімкнене; інакше виклики повертаються до нативних голосів провайдера.
- Якщо медіапотік Twilio уже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телефонний TTS недоступний у цьому стані, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли Twilio barge-in або демонтаж потоку очищує чергу очікування TTS, поставлені в чергу запити відтворення завершуються, а не залишають абонентів чекати завершення відтворення.

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

Типове значення вхідної політики — `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — це перевірка caller-ID з низьким рівнем надійності. Plugin
нормалізує надане провайдером значення `From` і порівнює його з
`allowFrom`. Перевірка Webhook автентифікує доставку провайдером і
цілісність payload, але **не** доводить право власності на номер абонента
PSTN/VoIP. Розглядайте `allowFrom` як фільтрацію caller-ID, а не надійну
ідентичність абонента.
</Warning>

Автовідповіді використовують систему агента. Налаштовуйте за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Контракт мовленнєвого виводу

Для автовідповідей Voice Call додає суворий контракт мовленнєвого виводу до
системного prompt:

```text
{"spoken":"..."}
```

Voice Call обережно витягує текст мовлення:

- Ігнорує payloads, позначені як вміст reasoning/error.
- Розбирає прямий JSON, JSON у fenced-блоці або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє ймовірні вступні абзаци планування/метаінформації.

Це зберігає мовленнєве відтворення зосередженим на тексті для абонента й запобігає
потраплянню тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив’язана до поточного
стану відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише тоді, коли початкове привітання активно промовляється.
- Якщо початкове відтворення завершується помилкою, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio запускається під час підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищує записи Twilio TTS, які стоять у черзі, але ще не відтворюються. Очищені записи завершуються як пропущені, тож логіка подальшої відповіді може продовжити роботу без очікування аудіо, яке ніколи не відтвориться.
- Голосові розмови realtime використовують власний початковий хід realtime-потоку. Voice Call **не** публікує застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` залишаються підключеними.

### Пільговий період після від’єднання потоку Twilio

Коли медіапотік Twilio від’єднується, Voice Call чекає **2000 мс**, перш ніж
автоматично завершити дзвінок:

- Якщо потік повторно під’єднується протягом цього вікна, автоматичне завершення скасовується.
- Якщо після пільгового періоду жоден потік не реєструється повторно, дзвінок завершується, щоб запобігти зависанню активних дзвінків.

## Очищувач застарілих дзвінків

Використовуйте `staleCallReaperSeconds`, щоб завершувати дзвінки, які ніколи не отримують кінцевий
webhook (наприклад, дзвінки в режимі сповіщення, які ніколи не завершуються). Типове значення
— `0` (вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі сповіщень.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні дзвінки могли завершитися. Хороша початкова точка — `maxDurationSeconds + 30–60` секунд.

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

Коли перед Gateway розташований проксі або тунель, plugin
відтворює публічну URL-адресу для перевірки підпису. Ці параметри
керують тим, яким пересланим заголовкам можна довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Дозволений список хостів із пересланих заголовків.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти пересланим заголовкам без дозволеного списку.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти пересланим заголовкам лише тоді, коли віддалена IP-адреса запиту збігається зі списком.
</ParamField>

Додаткові засоби захисту:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio і Plivo. Повторно відтворені дійсні webhook-запити підтверджуються, але їхні побічні ефекти пропускаються.
- Ходи розмови Twilio містять токен для кожного ходу у зворотних викликах `<Gather>`, тому застарілі або повторно відтворені мовленнєві зворотні виклики не можуть задовольнити новіший очікуваний хід транскрипту.
- Неавтентифіковані webhook-запити відхиляються до читання тіла, якщо відсутні обов’язкові заголовки підпису провайдера.
- Webhook voice-call використовує спільний профіль тіла перед автентифікацією (64 КБ / 5 секунд) плюс обмеження одночасних запитів для кожної IP-адреси перед перевіркою підпису.

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

Цей репозиторій постачає відповідну документацію skill за шляхом `skills/voice-call/SKILL.md`.

## RPC Gateway

| Метод                | Аргументи                 |
| -------------------- | ------------------------- |
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
