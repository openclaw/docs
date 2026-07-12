---
read_when:
    - Ви хочете здійснити вихідний голосовий виклик з OpenClaw
    - Ви налаштовуєте або розробляєте плагін голосових викликів
    - Вам потрібен голосовий зв’язок у реальному часі або потокове транскрибування в телефонії
sidebarTitle: Voice call
summary: Здійснюйте вихідні та приймайте вхідні голосові виклики через Twilio, Telnyx або Plivo з необов’язковим голосовим зв’язком у реальному часі та потоковим транскрибуванням
title: Plugin голосових викликів
x-i18n:
    generated_at: "2026-07-12T13:39:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосові виклики для OpenClaw через Plugin: вихідні сповіщення, багатоетапні
розмови, повнодуплексний голосовий зв’язок у реальному часі, потокове транскрибування та
вхідні виклики з політиками списку дозволених номерів.

**Провайдери:** `mock` (для розробки, без мережі), `plivo` (Voice API + передавання XML +
розпізнавання мовлення GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
Plugin голосових викликів працює **всередині процесу Gateway**. Якщо ви використовуєте
віддалений Gateway, установіть і налаштуйте Plugin на машині, де працює
Gateway, а потім перезапустіть Gateway, щоб завантажити його.
</Note>

## Швидкий початок

<Steps>
  <Step title="Установіть Plugin">
    <Tabs>
      <Tab title="З npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="З локальної папки (для розробки)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Використовуйте пакет без зазначення версії, щоб отримувати поточний тег випуску. Закріплюйте точну
    версію лише тоді, коли потрібне відтворюване встановлення. Після цього перезапустіть Gateway,
    щоб Plugin завантажився.

  </Step>
  <Step title="Налаштуйте провайдера та Webhook">
    Установіть конфігурацію в `plugins.entries.voice-call.config` (див.
    [Конфігурація](#configuration) нижче). Щонайменше потрібні: `provider`, облікові дані
    провайдера, `fromNumber` і загальнодоступна URL-адреса Webhook.
  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Перевіряє, чи ввімкнено Plugin, облікові дані провайдера, доступність Webhook і
    чи активний лише один аудіорежим (`streaming` або `realtime`).

  </Step>
  <Step title="Виконайте базову перевірку">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    За замовчуванням обидві команди виконують пробний запуск без фактичного виклику. Додайте `--yes`, щоб здійснити короткий вихідний
    виклик-сповіщення:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx і Plivo налаштування має визначати **загальнодоступну URL-адресу Webhook**.
Якщо `publicUrl`, URL-адреса тунелю, URL-адреса Tailscale або резервний варіант `serve`
визначається як local loopback чи адреса приватної мережі, налаштування завершується помилкою замість
запуску провайдера, який не зможе отримувати Webhook від оператора.
</Warning>

## Конфігурація

Якщо встановлено `enabled: true`, але для вибраного провайдера відсутні облікові дані, під час запуску Gateway
до журналу записується попередження про незавершене налаштування із зазначенням відсутніх ключів, а
середовище виконання не запускається. Команди, виклики RPC та інструменти агента однаково повертають
точний перелік відсутніх параметрів конфігурації під час використання.

<Note>
Облікові дані голосових викликів підтримують SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` і `plugins.entries.voice-call.config.tts.providers.*.apiKey` розпізнаються через стандартний інтерфейс SecretRef; див. [Інтерфейс облікових даних SecretRef](/uk/reference/secretref-credential-surface).
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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, чим я можу допомогти?",
              responseSystemPrompt: "Ви — лаконічний фахівець із бейсбольних карток.",
              tts: {
                providers: {
                  openai: { speakerVoice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
            // region: "ie1", // необов’язково: us1 | ie1 | au1; за замовчуванням us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Відкритий ключ Webhook Telnyx із Mission Control Portal
            // (Base64; також можна встановити через TELNYX_PUBLIC_KEY).
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

          // Загальнодоступність (виберіть один варіант)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* див. Потокове транскрибування */ },
          realtime: { enabled: false /* див. Голосові розмови в реальному часі */ },
        },
      },
    },
  },
}
```

### Довідник із конфігурації

Ключі верхнього рівня в `plugins.entries.voice-call.config`, не наведені вище:

| Ключ                            | Значення за замовчуванням | Примітки                                                                              |
| ------------------------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| `enabled`                       | `false`                   | Головний перемикач увімкнення/вимкнення.                                               |
| `inboundPolicy`                 | `"disabled"`              | `disabled` \| `allowlist` \| `pairing` \| `open`. Див. [Вхідні виклики](#inbound-calls). |
| `allowFrom`                     | `[]`                      | Список дозволених номерів E.164 для `inboundPolicy: "allowlist"`.                      |
| `maxDurationSeconds`            | `300`                     | Жорстке обмеження тривалості кожного виклику, яке діє незалежно від стану відповіді.   |
| `staleCallReaperSeconds`        | `120`                     | Див. [Очищення застарілих викликів](#stale-call-reaper). `0` вимикає його.              |
| `silenceTimeoutMs`              | `800`                     | Виявлення тиші наприкінці мовлення для класичного потоку (не в реальному часі).        |
| `transcriptTimeoutMs`           | `180000`                  | Максимальний час очікування транскрипту абонента перед припиненням спроби обробити репліку. |
| `ringTimeoutMs`                 | `30000`                   | Час очікування відповіді на вихідний виклик.                                           |
| `maxConcurrentCalls`            | `1`                       | Вихідні виклики понад це обмеження відхиляються.                                       |
| `outbound.notifyHangupDelaySec` | `3`                       | Кількість секунд очікування після TTS перед автоматичним завершенням виклику в режимі сповіщення. |
| `skipSignatureVerification`     | `false`                   | Лише для локального тестування; ніколи не вмикайте у виробничому середовищі.            |
| `store`                         | не встановлено            | Перевизначає стандартний шлях журналу викликів `~/.openclaw/voice-calls`.               |
| `agentId`                       | `"main"`                  | Агент, що використовується для генерування відповідей і зберігання сеансів.             |
| `responseModel`                 | не встановлено            | Перевизначає стандартну модель для класичних відповідей (не в реальному часі).         |
| `responseSystemPrompt`          | генерується               | Власний системний запит для класичних відповідей.                                      |
| `responseTimeoutMs`             | `30000`                   | Час очікування генерування класичної відповіді (мс).                                   |

За замовчуванням Twilio використовує свою кінцеву точку REST у US1. Щоб обробляти виклики в підтримуваному
регіоні за межами США, установіть `twilio.region` у значення `ie1` або `au1` і використовуйте облікові дані з
цього регіону. Див.
[Посібник Twilio щодо REST API в регіоні за межами США](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Примітки щодо доступності й безпеки провайдерів">
    - Для Twilio, Telnyx і Plivo потрібна **загальнодоступна** URL-адреса Webhook.
    - `mock` — локальний провайдер для розробки (без мережевих викликів).
    - Для Telnyx потрібен `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо `skipSignatureVerification` не має значення true.
    - `skipSignatureVerification` призначено лише для локального тестування.
    - На безплатному тарифі ngrok установіть `publicUrl` у точну URL-адресу ngrok; перевірка підпису завжди обов’язкова.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** тоді, коли `tunnel.provider="ngrok"`, а `serve.bind` є local loopback (локальний агент ngrok). Лише для локальної розробки.
    - URL-адреси безплатного тарифу ngrok можуть змінюватися або додавати проміжні сторінки; якщо `publicUrl` зміниться, перевірка підписів Twilio завершуватиметься помилкою. Для виробничого середовища надавайте перевагу стабільному домену або Tailscale funnel.

  </Accordion>
  <Accordion title="Обмеження потокових з’єднань">
    - `streaming.preStartTimeoutMs` (за замовчуванням `5000`) закриває сокети, які так і не надіслали дійсний кадр `start`.
    - `streaming.maxPendingConnections` (за замовчуванням `32`) обмежує загальну кількість неавтентифікованих сокетів до запуску.
    - `streaming.maxPendingConnectionsPerIp` (за замовчуванням `4`) обмежує кількість неавтентифікованих сокетів до запуску для кожної вихідної IP-адреси.
    - `streaming.maxConnections` (за замовчуванням `128`) обмежує всі відкриті сокети медіапотоків (очікувані + активні).

  </Accordion>
  <Accordion title="Міграції застарілої конфігурації">
    Під час розбору конфігурації ці застарілі ключі автоматично нормалізуються, а до журналу
    записується попередження із зазначенням нового шляху; цей адаптер буде видалено в майбутньому
    випуску (`2026.6.0`), тому виконайте `openclaw doctor --fix`, щоб перезаписати збережену
    конфігурацію в канонічному форматі:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` видалено (контекст реального часу тепер використовує згенерований запит агента)

  </Accordion>
</AccordionGroup>

## Область сеансу

За замовчуванням Voice Call використовує `sessionScope: "per-phone"`, щоб повторні виклики від
того самого абонента зберігали пам’ять розмови. Установіть `sessionScope: "per-call"`, коли
кожен виклик через оператора має починатися з нового контексту, наприклад для рецепції,
бронювання, IVR або потоків мосту Google Meet, де той самий номер телефону може
представляти різні зустрічі.

Voice Call зберігає згенеровані ключі сеансів у налаштованому просторі імен агента
(`agent:<agentId>:voice:*`). Явно задані необроблені ключі інтеграції розпізнаються в
тому самому просторі імен: канонічний ключ `agent:<configuredAgentId>:*` зберігає цього
власника та враховує псевдоніми `session.mainKey`/глобальної області ядра; сторонні або
неправильно сформовані вхідні значення `agent:*` обробляються як непрозорий ключ у просторі налаштованого
агента; `global` і `unknown` залишаються глобальними сигнальними значеннями.

## Голосові розмови в реальному часі

`realtime` вибирає провайдера повнодуплексного голосового зв’язку в реальному часі для аудіо виклику.
Він відокремлений від `streaming`, який лише передає аудіо провайдерам транскрибування
в реальному часі.

<Warning>
`realtime.enabled` не можна поєднувати з `streaming.enabled`. Виберіть один
аудіорежим для кожного виклику.
</Warning>

Поточна поведінка середовища виконання:

- `realtime.enabled` підтримується для Twilio і Telnyx.
- `realtime.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого постачальника голосового зв’язку в реальному часі.
- Вбудовані постачальники голосового зв’язку в реальному часі: Google Gemini Live (`google`) і OpenAI (`openai`), зареєстровані відповідними Plugin постачальників.
- Необроблена конфігурація, якою керує постачальник, розміщується в `realtime.providers.<providerId>`.
- За замовчуванням Voice Call надає спільний інструмент реального часу `openclaw_agent_consult`. Модель реального часу може викликати його, коли абонент просить про глибший аналіз, актуальну інформацію або звичайні інструменти OpenClaw.
- `realtime.consultPolicy` необов’язково додає вказівки щодо того, коли модель реального часу має викликати `openclaw_agent_consult`.
- `realtime.agentContext.enabled` за замовчуванням вимкнено. Коли цей параметр увімкнено, Voice Call під час налаштування сеансу додає до інструкцій постачальника реального часу обмежений опис ідентичності агента та вибраний набір файлів робочого простору.
- `realtime.fastContext.enabled` за замовчуванням вимкнено. Коли цей параметр увімкнено, Voice Call спочатку шукає контекст запитання для консультації в індексованій пам’яті та контексті сеансу й повертає ці фрагменти моделі реального часу протягом `realtime.fastContext.timeoutMs`, а до повноцінного агента консультацій переходить лише тоді, коли `realtime.fastContext.fallbackToConsult` має значення `true`.
- Якщо `realtime.provider` указує на незареєстрованого постачальника або жодного постачальника голосового зв’язку в реальному часі взагалі не зареєстровано, Voice Call записує попередження в журнал і пропускає медіа в реальному часі замість завершення роботи всього Plugin з помилкою.
- `inboundPolicy` не повинен мати значення `"disabled"`, коли `realtime.enabled` має значення `true`; `validateProviderConfig` відхиляє таке поєднання.
- Ключі сеансів консультацій повторно використовують збережений сеанс виклику, якщо він доступний, а потім переходять до налаштованого `sessionScope` (за замовчуванням `per-phone` або `per-call` для ізольованих викликів).

### Політика інструментів

`realtime.toolPolicy` керує виконанням консультації:

| Політика         | Поведінка                                                                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Надає інструмент консультацій і обмежує звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`. |
| `owner`          | Надає інструмент консультацій і дозволяє звичайному агенту використовувати стандартну політику інструментів агента.                                                      |
| `none`           | Не надає інструмент консультацій. Користувацькі `realtime.tools` усе одно передаються постачальнику реального часу.                               |

`realtime.consultPolicy` керує лише інструкціями моделі реального часу:

| Політика      | Вказівки                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Зберігає стандартний запит і дозволяє постачальнику вирішувати, коли викликати інструмент консультацій.              |
| `substantive` | Безпосередньо відповідає на прості зв’язувальні репліки в розмові та консультується перед використанням фактів, пам’яті, інструментів або контексту. |
| `always`      | Консультується перед кожною змістовною відповіддю.                                                        |

### Голосовий контекст агента

Увімкніть `realtime.agentContext`, якщо голосовий міст має звучати як
налаштований агент OpenClaw без повного циклу звернення до агента консультацій
під час звичайних реплік. Контекстний набір додається один раз під час створення
сеансу реального часу, тому він не збільшує затримку кожної репліки. Виклики
`openclaw_agent_consult` усе одно запускають повноцінного агента OpenClaw і мають
використовуватися для роботи з інструментами, отримання актуальної інформації,
пошуку в пам’яті або стану робочого простору.

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

### Приклади постачальників реального часу

<Tabs>
  <Tab title="Google Gemini Live">
    Значення за замовчуванням: ключ API із `realtime.providers.google.apiKey`, `GEMINI_API_KEY`
    або `GOOGLE_API_KEY`; модель `gemini-3.1-flash-live-preview`;
    голос `Kore`. `sessionResumption` і `contextWindowCompression` за замовчуванням
    увімкнено для довших викликів із можливістю повторного підключення. Використовуйте
    `silenceDurationMs`, `startSensitivity` і `endSensitivity`, щоб налаштувати швидше
    чергування реплік для телефонного аудіо.

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
                    model: "gemini-3.1-flash-live-preview",
                    speakerVoice: "Kore",
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

Параметри голосового зв’язку в реальному часі для конкретних постачальників див. у розділах
[Постачальник Google](/uk/providers/google) і
[Постачальник OpenAI](/uk/providers/openai).

## Потокове транскрибування

`streaming` вибирає постачальника транскрибування в реальному часі для аудіо виклику наживо.

Поточна поведінка середовища виконання:

- `streaming.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого зареєстрованого постачальника транскрибування в реальному часі.
- Вбудовані постачальники транскрибування в реальному часі: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI (`xai`), зареєстровані відповідними Plugin постачальників.
- Необроблена конфігурація, якою керує постачальник, розміщується в `streaming.providers.<providerId>`.
- Після того як Twilio надсилає прийняте повідомлення `start` для потоку, Voice Call негайно реєструє потік, ставить вхідні медіадані в чергу для обробки постачальником транскрибування, поки той підключається, і запускає початкове привітання лише після готовності транскрибування в реальному часі.
- Якщо `streaming.provider` указує на незареєстрованого постачальника або жодного постачальника не зареєстровано, Voice Call записує попередження в журнал і пропускає потокове передавання медіа замість завершення роботи всього Plugin з помилкою.

### Приклади постачальників потокового передавання

<Tabs>
  <Tab title="OpenAI">
    Значення за замовчуванням: ключ API `streaming.providers.openai.apiKey` або
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
    Значення за замовчуванням: ключ API `streaming.providers.xai.apiKey` або `XAI_API_KEY`
    (якщо жодного з них не задано, використовується профіль автентифікації xAI OAuth);
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

Voice Call використовує основну конфігурацію `messages.tts` для потокового синтезу мовлення
під час викликів. Її можна перевизначити в конфігурації Plugin за допомогою **такої самої структури** —
вона рекурсивно об’єднується з `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Мовлення Microsoft ігнорується для голосових викликів.** Для телефонного синтезу
потрібен постачальник, який реалізує виведення для телефонії; постачальник мовлення
Microsoft цього не робить, тому для викликів його пропускають і натомість
випробовують інших постачальників у ланцюжку резервування.
</Warning>

Примітки щодо поведінки:

- Застарілі ключі `tts.<provider>` у конфігурації Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються командою `openclaw doctor --fix`; зафіксована в репозиторії конфігурація має використовувати `tts.providers.<provider>`.
- Основний TTS використовується, коли ввімкнено потокове передавання медіа Twilio; інакше виклики переходять до вбудованих голосів постачальника.
- Якщо потік медіа Twilio вже активний, Voice Call не переходить до TwiML `<Say>`. Якщо TTS для телефонії в такому стані недоступний, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS для телефонії переходить до резервного постачальника, Voice Call записує в журнал попередження з ланцюжком постачальників (`from`, `to`, `attempts`) для налагодження.
- Коли переривання мовлення Twilio або завершення потоку очищає чергу очікування TTS, поставлені в чергу запити на відтворення завершуються, а не залишають абонентів, які очікують завершення відтворення, у завислому стані.

### Приклади TTS

<Tabs>
  <Tab title="Лише основний TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
  <Tab title="Перевизначення моделі OpenAI (рекурсивне об’єднання)">
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
                speakerVoice: "marin",
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

За замовчуванням політика вхідних викликів має значення `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — це перевірка ідентифікатора абонента з низьким рівнем надійності. Plugin
нормалізує надане провайдером значення `From` і порівнює його з `allowFrom`.
Перевірка Webhook автентифікує доставку провайдером і цілісність корисного навантаження,
але **не** підтверджує належність номера абонента PSTN/VoIP. Розглядайте
`allowFrom` як фільтрування ідентифікатора абонента, а не як надійне підтвердження його особи.
</Warning>

Автоматичні відповіді використовують систему агента. Налаштовуйте її за допомогою `responseModel`,
`responseSystemPrompt` і `responseTimeoutMs`.

### Маршрутизація за номером

Використовуйте `numbers`, коли один Plugin Voice Call приймає виклики на кілька телефонних
номерів і кожен номер має працювати як окрема лінія. Наприклад,
один номер може використовувати невимушеного персонального помічника, а інший — ділову
персону, іншого агента відповідей та інший голос TTS.

Маршрути вибираються за наданим провайдером набраним номером `To`. Ключами мають
бути номери у форматі E.164. Коли надходить виклик, Voice Call одноразово визначає відповідний
маршрут, зберігає його в записі виклику та повторно використовує цю
ефективну конфігурацію для привітання, класичного шляху автоматичної відповіді, шляху
консультації в реальному часі та відтворення TTS. Якщо жоден маршрут не відповідає,
використовується глобальна конфігурація Voice Call. Вихідні виклики не використовують
`numbers`; під час ініціювання виклику явно передавайте цільовий номер,
повідомлення та сеанс.

Перевизначення маршрутів наразі підтримують:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Значення маршруту `tts` глибоко об’єднується з глобальною конфігурацією `tts` Voice Call, тому
зазвичай достатньо перевизначити лише голос провайдера:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Контракт голосового виведення

Для автоматичних відповідей Voice Call додає до системного запиту суворий контракт голосового виведення,
який вимагає JSON-відповідь `{"spoken":"..."}`. Voice Call
надійно видобуває текст для озвучення:

- Ігнорує корисні навантаження, позначені як вміст міркувань або помилок.
- Аналізує безпосередній JSON, JSON у блоці коду або вбудовані ключі `"spoken"`.
- У разі невдачі використовує звичайний текст і видаляє ймовірні вступні абзаци з плануванням або метаданими.

Це зосереджує голосове відтворення на тексті для абонента та запобігає
потраплянню тексту планування в аудіо.

### Поведінка під час початку розмови

Для вихідних викликів `conversation` обробка першого повідомлення пов’язана зі станом
відтворення наживо:

- Очищення черги під час перебивання та автоматична відповідь блокуються лише тоді, коли початкове привітання активно озвучується.
- Якщо початкове відтворення завершується помилкою, виклик повертається до стану `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового передавання Twilio запускається після підключення потоку без додаткової затримки.
- Перебивання припиняє активне відтворення та очищає записи TTS Twilio, які перебувають у черзі, але ще не відтворюються. Очищені записи завершуються як пропущені, тому логіка наступної відповіді може продовжитися, не очікуючи аудіо, яке ніколи не буде відтворено.
- Голосові розмови в реальному часі використовують власну початкову репліку потоку реального часу. Voice Call **не** надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сеанси `<Connect><Stream>` залишаються підключеними.

### Період очікування після відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call очікує **2000 мс**, перш ніж
автоматично завершити виклик:

- Якщо потік повторно підключається протягом цього періоду, автоматичне завершення скасовується.
- Якщо після завершення періоду очікування жоден потік не реєструється повторно, виклик завершується, щоб уникнути завислих активних викликів.

## Очищення застарілих викликів

Використовуйте `staleCallReaperSeconds` (типове значення — **120**), щоб завершувати виклики, на які ніколи
не відповіли та які ніколи не досягли стану активної розмови, наприклад виклики в режимі сповіщення,
для яких провайдер ніколи не надсилає завершальний Webhook. Установіть значення `0`, щоб
вимкнути цю функцію.

Очищення запускається кожні 30 секунд і завершує лише виклики, які не мають
часової позначки `answeredAt` і ще не перебувають у завершальному стані або стані активної
розмови (`speaking`/`listening`), тому цей таймер ніколи не завершує
розмови, на які відповіли; `maxDurationSeconds` (типове значення — 300) — це окреме обмеження,
яке завершує виклики, на які відповіли, якщо вони тривають надто довго.

Для сценаріїв зі сповіщеннями, у яких оператори можуть повільно надсилати Webhook
дзвінка або відповіді, збільште `staleCallReaperSeconds` понад типове значення, щоб повільні, але нормальні
виклики не завершувалися передчасно; **120–300** секунд — доцільний діапазон
для робочого середовища.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Безпека Webhook

Коли перед Gateway розташовано проксі або тунель, Plugin відновлює
публічну URL-адресу для перевірки підпису. Ці параметри визначають, яким
пересланим заголовкам слід довіряти:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Список дозволених хостів із заголовків пересилання.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Довіряти пересланим заголовкам без списку дозволених.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Довіряти пересланим заголовкам лише тоді, коли віддалена IP-адреса запиту відповідає списку.
</ParamField>

Додаткові засоби захисту:

- **Захист від повторного відтворення** Webhook увімкнено для Twilio, Telnyx і Plivo. Повторно надіслані дійсні запити Webhook підтверджуються, але їхні побічні дії пропускаються.
- Репліки розмови Twilio містять окремий токен для кожної репліки у зворотних викликах `<Gather>`, тому застарілі або повторно відтворені зворотні виклики мовлення не можуть задовольнити новішу очікувану репліку транскрипту.
- Неавтентифіковані запити Webhook відхиляються до читання тіла, якщо відсутні обов’язкові заголовки підпису провайдера.
- Webhook voice-call використовує спільний профіль читання тіла до автентифікації (максимальний розмір тіла — 64 КБ, час очікування читання — 5 секунд), а також обмеження кількості активних запитів для кожного ключа (типово 8 одночасних запитів на ключ) до перевірки підпису.

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

Коли Gateway уже запущено, операційні команди `voicecall`
передають виконання середовищу voice-call, яким керує Gateway, щоб CLI не прив’язував
другий сервер Webhook. Якщо Gateway недоступне, команди переходять до
автономного середовища CLI.

`latency` читає `calls.jsonl` із типового шляху сховища voice-call. Використовуйте
`--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити
аналіз останніми N записами (типово 200). Виведення містить мінімальне, максимальне й середнє значення,
p50 і p95 для затримки репліки та часу очікування прослуховування.

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

Plugin voice-call постачається з відповідним Skills агента.

## RPC Gateway

| Метод                       | Аргументи                                                        | Примітки                                                                                       |
| --------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Використовує конфігурацію `toNumber`, якщо `to` не вказано.                                     |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Те саме, що й `initiate`, але також приймає `dtmfSequence` до підключення.                       |
| `voicecall.continue`        | `callId`, `message`                                              | Блокує виконання до завершення репліки; повертає транскрипт.                                    |
| `voicecall.continue.start`  | `callId`, `message`                                              | Асинхронний варіант: негайно повертає `operationId`.                                            |
| `voicecall.continue.result` | `operationId`                                                    | Опитує очікувану операцію `voicecall.continue.start`, щоб отримати її результат.                |
| `voicecall.speak`           | `callId`, `message`                                              | Озвучує без очікування; використовує міст реального часу, коли ввімкнено `realtime.enabled`.     |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                                                |
| `voicecall.end`             | `callId`                                                         |                                                                                                |
| `voicecall.status`          | `callId?`                                                        | Не вказуйте `callId`, щоб отримати список усіх активних викликів.                               |

`dtmfSequence` допустиме лише з `mode: "conversation"`; виклики в режимі сповіщення,
яким потрібні цифри після підключення, мають використовувати `voicecall.dtmf` після створення
виклику.

## Усунення несправностей

### Налаштуванню не вдається опублікувати Webhook

Запускайте налаштування з того самого середовища, у якому працює Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` і `plivo` перевірка `webhook-exposure` має бути успішною. Налаштована
`publicUrl` усе одно не працюватиме, якщо вказує на локальний або приватний
мережевий простір, оскільки оператор не може виконати зворотний виклик на такі адреси.
Не використовуйте `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` або інші діапазони NAT
операторського класу як `publicUrl`.

Вихідні виклики Twilio в режимі сповіщення надсилають початковий TwiML `<Say>` безпосередньо
в запиті створення виклику, тому перше озвучене повідомлення не залежить від
отримання Twilio Webhook TwiML. Публічний Webhook усе одно потрібен для зворотних викликів
стану, розмовних викликів, DTMF до підключення, потоків реального часу та
керування викликом після підключення.

Використовуйте один публічний шлях доступу:

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

`voicecall smoke` виконується в режимі пробного запуску, якщо не передати `--yes`.

### Помилка облікових даних провайдера

Перевірте вибраного провайдера та обов’язкові поля облікових даних:

- Twilio: `twilio.accountSid`, `twilio.authToken` і `fromNumber` або
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` і `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` і
  `fromNumber` або `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` і
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` і `fromNumber` або
  `PLIVO_AUTH_ID` і `PLIVO_AUTH_TOKEN`.

Облікові дані мають бути на хості Gateway. Редагування локального профілю оболонки
не впливає на вже запущений Gateway, доки його не буде перезапущено або він не
перезавантажить своє середовище.

### Виклики починаються, але Webhook постачальника не надходять

Переконайтеся, що в консолі постачальника вказано точну публічну URL-адресу Webhook:

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

- `publicUrl` указує на шлях, відмінний від `serve.path`.
- URL-адреса тунелю змінилася після запуску Gateway.
- Проксі пересилає запит, але видаляє або переписує заголовки хосту чи протоколу.
- Брандмауер або DNS спрямовує публічне ім’я хосту не на Gateway.
- Gateway було перезапущено без увімкненого Plugin голосових викликів.

Якщо перед Gateway розташований зворотний проксі або тунель, задайте в
`webhookSecurity.allowedHosts` публічне ім’я хосту або використовуйте
`webhookSecurity.trustedProxyIPs` для відомої адреси проксі. Використовуйте
`webhookSecurity.trustForwardingHeaders`, лише якщо межа проксі
перебуває під вашим контролем.

### Не вдається перевірити підпис

Підписи постачальника перевіряються щодо публічної URL-адреси, яку OpenClaw відтворює
з вхідного запиту. Якщо перевірка підписів не вдається:

- Переконайтеся, що URL-адреса Webhook постачальника точно відповідає `publicUrl`, включно зі схемою, хостом і шляхом.
- Для URL-адрес безплатного рівня ngrok оновлюйте `publicUrl`, коли змінюється ім’я хосту тунелю.
- Переконайтеся, що проксі зберігає початкові заголовки хосту та протоколу, або налаштуйте `webhookSecurity.allowedHosts`.
- Не вмикайте `skipSignatureVerification` поза межами локального тестування.

### Не вдається приєднатися до Google Meet через Twilio

Google Meet використовує цей Plugin для приєднання через телефонний набір Twilio. Спочатку перевірте
голосові виклики:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Потім окремо перевірте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Якщо голосові виклики працюють, але учасник Meet так і не приєднується, перевірте
номер телефонного підключення Meet, PIN-код і `--dtmf-sequence`. Телефонний виклик може працювати
нормально, навіть якщо зустріч відхиляє або ігнорує неправильну послідовність DTMF.

Google Meet запускає телефонне з’єднання Twilio через `voicecall.start` із
послідовністю DTMF перед підключенням. Послідовності, сформовані з PIN-коду, містять
`voiceCall.dtmfDelayMs` Plugin Google Meet (типове значення — **12000 мс**) як початкові
цифри очікування Twilio, оскільки підказки телефонного підключення Meet можуть надходити із запізненням.
Потім голосовий виклик перенаправляється назад до обробки в реальному часі до запиту
вступного привітання.

Використовуйте `openclaw logs --follow` для відстеження етапів у реальному часі. Успішне
приєднання Twilio до Meet реєструє події в такому порядку:

- Google Meet делегує приєднання через Twilio голосовому виклику.
- Голосовий виклик зберігає TwiML із DTMF перед підключенням.
- Початковий TwiML Twilio обробляється й надається до обробки в реальному часі.
- Голосовий виклик надає TwiML реального часу для виклику Twilio.
- Google Meet запитує вступне мовлення через `voicecall.speak` після затримки, що настає після DTMF.

`openclaw voicecall tail` і далі показує збережені записи викликів; це корисно для
стану викликів і транскрипцій, але не кожен перехід Webhook або режиму реального часу
відображається там.

### У виклику в реальному часі немає мовлення

Переконайтеся, що ввімкнено лише один режим аудіо: `realtime.enabled` і
`streaming.enabled` не можуть одночасно мати значення true.

Для викликів Twilio/Telnyx у реальному часі також перевірте:

- Plugin постачальника роботи в реальному часі завантажено й зареєстровано.
- `realtime.provider` не задано або він указує на зареєстрованого постачальника.
- API-ключ постачальника доступний процесу Gateway.
- `openclaw logs --follow` показує надання TwiML реального часу, запуск моста реального часу та додавання початкового привітання до черги.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Голосове пробудження](/uk/nodes/voicewake)
