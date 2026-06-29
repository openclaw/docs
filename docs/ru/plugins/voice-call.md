---
read_when:
    - Вы хотите совершить исходящий голосовой вызов из OpenClaw
    - Вы настраиваете или разрабатываете plugin голосовых вызовов
    - Вам нужны голос в реальном времени или потоковая транскрибация в телефонии
sidebarTitle: Voice call
summary: Размещайте исходящие и принимайте входящие голосовые вызовы через Twilio, Telnyx или Plivo с опциональной голосовой связью в реальном времени и потоковой транскрипцией
title: Plugin голосовых вызовов
x-i18n:
    generated_at: "2026-06-28T23:33:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

Голосовые вызовы для OpenClaw через Plugin. Поддерживает исходящие уведомления,
многошаговые разговоры, полнодуплексную голосовую связь в реальном времени,
потоковую транскрипцию и входящие вызовы с политиками списка разрешений.

**Текущие провайдеры:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (разработка/без сети).

<Note>
Plugin Voice Call работает **внутри процесса Gateway**. Если вы используете
удаленный Gateway, установите и настройте Plugin на машине, где запущен
Gateway, затем перезапустите Gateway, чтобы загрузить его.
</Note>

## Быстрый старт

<Steps>
  <Step title="Установите Plugin">
    <Tabs>
      <Tab title="Из npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Из локальной папки (разработка)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Используйте пакет без указания версии, чтобы следовать текущему официальному тегу релиза. Закрепляйте
    точную версию только тогда, когда нужна воспроизводимая установка.

    После этого перезапустите Gateway, чтобы Plugin загрузился.

  </Step>
  <Step title="Настройте провайдера и Webhook">
    Задайте конфигурацию в `plugins.entries.voice-call.config` (полную форму см.
    в разделе [Конфигурация](#configuration) ниже). Минимум:
    `provider`, учетные данные провайдера, `fromNumber` и публично
    доступный URL Webhook.
  </Step>
  <Step title="Проверьте настройку">
    ```bash
    openclaw voicecall setup
    ```

    Вывод по умолчанию читаем в логах чата и терминалах. Он проверяет,
    включен ли Plugin, учетные данные провайдера, доступность Webhook извне и то,
    что активен только один аудиорежим (`streaming` или `realtime`). Используйте
    `--json` для скриптов.

  </Step>
  <Step title="Smoke-тест">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Оба варианта по умолчанию выполняются как пробный запуск. Добавьте `--yes`, чтобы действительно выполнить короткий
    исходящий вызов-уведомление:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Для Twilio, Telnyx и Plivo настройка должна разрешаться в **публичный URL Webhook**.
Если `publicUrl`, URL туннеля, URL Tailscale или резервный serve-вариант
разрешается в loopback или пространство частной сети, настройка завершается ошибкой вместо
запуска провайдера, который не сможет получать Webhook от оператора.
</Warning>

## Конфигурация

Если `enabled: true`, но у выбранного провайдера отсутствуют учетные данные,
при запуске Gateway записывает предупреждение о незавершенной настройке с отсутствующими ключами и
пропускает запуск runtime. Команды, RPC-вызовы и инструменты агента при использовании все равно
возвращают точную отсутствующую конфигурацию провайдера.

<Note>
Учетные данные voice-call принимают SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` и `plugins.entries.voice-call.config.tts.providers.*.apiKey` разрешаются через стандартную поверхность SecretRef; см. [поверхность учетных данных SecretRef](/ru/reference/secretref-credential-surface).
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
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
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
  <Accordion title="Примечания по доступности провайдеров и безопасности">
    - Twilio, Telnyx и Plivo всем требуется **публично доступный** URL Webhook.
    - `mock` — локальный провайдер для разработки (без сетевых вызовов).
    - Telnyx требует `telnyx.publicKey` (или `TELNYX_PUBLIC_KEY`), если `skipSignatureVerification` не равен true.
    - `skipSignatureVerification` предназначен только для локального тестирования.
    - На бесплатном уровне ngrok задайте `publicUrl` равным точному URL ngrok; проверка подписи всегда применяется.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` разрешает Webhook Twilio с недействительными подписями **только** когда `tunnel.provider="ngrok"` и `serve.bind` является loopback (локальный агент ngrok). Только для локальной разработки.
    - URL бесплатного уровня Ngrok могут меняться или добавлять промежуточное поведение; если `publicUrl` меняется, подписи Twilio перестают проходить. Production: предпочтите стабильный домен или Tailscale funnel.

  </Accordion>
  <Accordion title="Лимиты потоковых подключений">
    - `streaming.preStartTimeoutMs` закрывает сокеты, которые никогда не отправляют допустимый кадр `start`.
    - `streaming.maxPendingConnections` ограничивает общее число неаутентифицированных pre-start-сокетов.
    - `streaming.maxPendingConnectionsPerIp` ограничивает неаутентифицированные pre-start-сокеты на исходный IP.
    - `streaming.maxConnections` ограничивает общее число открытых сокетов медиапотока (pending + active).

  </Accordion>
  <Accordion title="Миграции устаревшей конфигурации">
    Старые конфигурации, использующие `provider: "log"`, `twilio.from` или устаревшие
    ключи OpenAI `streaming.*`, переписываются командой `openclaw doctor --fix`.
    Runtime fallback пока все еще принимает старые ключи voice-call, но
    путь переписывания — `openclaw doctor --fix`, а compat-прослойка
    временная.

    Автоматически мигрируемые ключи streaming:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Область сеанса

По умолчанию Voice Call использует `sessionScope: "per-phone"`, поэтому повторные вызовы от
одного и того же вызывающего сохраняют память разговора. Задайте `sessionScope: "per-call"`, когда
каждый операторский вызов должен начинаться со свежим контекстом, например для ресепшена,
бронирования, IVR или мостов Google Meet, где один и тот же номер телефона может
представлять разные встречи.

Voice Call хранит сгенерированные ключи сеансов в настроенном пространстве имен агента
(`agent:<agentId>:voice:*`), чтобы память вызовов переживала каноникализацию session-key в Gateway
после перезапусков. Явные сырые ключи интеграций используют то же
пространство имен агента. Канонический ключ `agent:<configuredAgentId>:*` сохраняет этого владельца,
а его основные alias учитывают core `session.mainKey` и глобальную область. Чужой или
некорректный ввод `agent:*` помещается как opaque-ключ в область настроенного агента;
`global` и `unknown` остаются глобальными sentinel-значениями. При запуске Gateway продвигает старые
сырые ключи в хранилищах по умолчанию или с шаблоном `{agentId}`, если путь доказывает одного
владельца. В фиксированных пользовательских хранилищах неоднозначные устаревшие строки остаются без изменений, потому что
в них недостаточно информации для выбора владельца; новые вызовы используют
каноническую историю в области агента.

## Голосовые разговоры в реальном времени

`realtime` выбирает полнодуплексного провайдера голоса в реальном времени для live-аудио
вызова. Он отделен от `streaming`, который только пересылает аудио
провайдерам транскрипции в реальном времени.

<Warning>
`realtime.enabled` нельзя сочетать с `streaming.enabled`. Выберите один
аудиорежим на вызов.
</Warning>

Текущее поведение runtime:

- `realtime.enabled` поддерживается для Twilio Media Streams.
- `realtime.provider` необязателен. Если он не задан, Voice Call использует первого зарегистрированного провайдера голоса в реальном времени.
- Встроенные провайдеры голоса в реальном времени: Google Gemini Live (`google`) и OpenAI (`openai`), регистрируемые их provider-Plugin.
- Сырая конфигурация, принадлежащая провайдеру, находится в `realtime.providers.<providerId>`.
- Voice Call по умолчанию предоставляет общий инструмент реального времени `openclaw_agent_consult`. Модель реального времени может вызывать его, когда вызывающий просит более глубокое рассуждение, актуальную информацию или обычные инструменты OpenClaw.
- `realtime.consultPolicy` необязательно добавляет указания о том, когда модель реального времени должна вызывать `openclaw_agent_consult`.
- `realtime.agentContext.enabled` по умолчанию выключен. Когда он включен, Voice Call внедряет ограниченную идентичность агента и выбранную капсулу workspace-file в инструкции провайдера реального времени при настройке сеанса.
- `realtime.fastContext.enabled` по умолчанию выключен. Когда он включен, Voice Call сначала ищет в индексированной памяти/контексте сеанса вопрос для consult и возвращает эти фрагменты модели реального времени в пределах `realtime.fastContext.timeoutMs`, прежде чем перейти к полному consult-агенту только если `realtime.fastContext.fallbackToConsult` равен true.
- Если `realtime.provider` указывает на незарегистрированного провайдера или если вообще не зарегистрирован ни один провайдер голоса в реальном времени, Voice Call записывает предупреждение и пропускает realtime-медиа вместо того, чтобы завершить весь Plugin ошибкой.
- Ключи consult-сеанса повторно используют сохраненный сеанс вызова, когда он доступен, затем переходят к настроенному `sessionScope` (`per-phone` по умолчанию или `per-call` для изолированных вызовов).

### Политика инструментов

`realtime.toolPolicy` управляет запуском consult:

| Политика         | Поведение                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Предоставляет инструмент consult и ограничивает обычного агента инструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` и `memory_get`. |
| `owner`          | Предоставляет инструмент consult и позволяет обычному агенту использовать нормальную политику инструментов агента.                        |
| `none`           | Не предоставляет инструмент consult. Пользовательские `realtime.tools` все равно передаются провайдеру реального времени.                |

`realtime.consultPolicy` управляет только инструкциями модели реального времени:

| Политика      | Указания                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `auto`        | Сохранять prompt по умолчанию и позволить провайдеру решать, когда вызывать инструмент consult. |
| `substantive` | Отвечать на простые conversational glue напрямую и выполнять consult перед фактами, памятью, инструментами или контекстом. |
| `always`      | Выполнять consult перед каждым содержательным ответом.                                           |

### Голосовой контекст агента

Включайте `realtime.agentContext`, когда голосовой мост должен звучать как
настроенный агент OpenClaw без полной задержки обращения к агенту на
обычных ходах. Капсула контекста добавляется один раз при создании
сеанса реального времени, поэтому она не добавляет задержку на каждый ход.
Вызовы `openclaw_agent_consult` по-прежнему запускают полного агента
OpenClaw и должны использоваться для работы с инструментами, актуальной
информации, поиска в памяти или состояния рабочей области.

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

### Примеры провайдеров реального времени

<Tabs>
  <Tab title="Google Gemini Live">
    Значения по умолчанию: ключ API из `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` или `GOOGLE_GENERATIVE_AI_API_KEY`; модель
    `gemini-2.5-flash-native-audio-preview-12-2025`; голос `Kore`.
    `sessionResumption` и `contextWindowCompression` по умолчанию включены
    для более долгих вызовов с возможностью переподключения. Используйте
    `silenceDurationMs`, `startSensitivity` и `endSensitivity`, чтобы
    настроить более быстрое чередование реплик в телефонном аудио.

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
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
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

См. [провайдер Google](/ru/providers/google) и
[провайдер OpenAI](/ru/providers/openai), чтобы узнать о параметрах голоса
реального времени, специфичных для провайдера.

## Потоковая транскрибация

`streaming` выбирает провайдера транскрибации в реальном времени для
аудио живого вызова.

Текущее поведение среды выполнения:

- `streaming.provider` необязателен. Если он не задан, Voice Call использует первого зарегистрированного провайдера транскрибации в реальном времени.
- Встроенные провайдеры транскрибации в реальном времени: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) и xAI (`xai`), зарегистрированные их плагинами провайдеров.
- Необработанная конфигурация, принадлежащая провайдеру, находится в `streaming.providers.<providerId>`.
- После того как Twilio отправляет принятое сообщение `start` для потока, Voice Call немедленно регистрирует поток, ставит входящее медиа в очередь через провайдера транскрибации, пока провайдер подключается, и запускает начальное приветствие только после готовности транскрибации в реальном времени.
- Если `streaming.provider` указывает на незарегистрированного провайдера или ни один провайдер не зарегистрирован, Voice Call записывает предупреждение в журнал и пропускает потоковую передачу медиа вместо сбоя всего плагина.

### Примеры потоковых провайдеров

<Tabs>
  <Tab title="OpenAI">
    Значения по умолчанию: ключ API `streaming.providers.openai.apiKey` или
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
    Значения по умолчанию: ключ API `streaming.providers.xai.apiKey` или `XAI_API_KEY`;
    конечная точка `wss://api.x.ai/v1/stt`; кодирование `mulaw`; частота дискретизации `8000`;
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

## TTS для вызовов

Voice Call использует базовую конфигурацию `messages.tts` для потоковой
речи в вызовах. Вы можете переопределить ее в конфигурации плагина с
**той же структурой** — она глубоко объединяется с `messages.tts`.

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
**Microsoft speech игнорируется для голосовых вызовов.** Телефонному аудио
нужен PCM; текущий транспорт Microsoft не предоставляет телефонный вывод PCM.
</Warning>

Примечания о поведении:

- Устаревшие ключи `tts.<provider>` внутри конфигурации плагина (`openai`, `elevenlabs`, `microsoft`, `edge`) исправляются командой `openclaw doctor --fix`; зафиксированная конфигурация должна использовать `tts.providers.<provider>`.
- Core TTS используется, когда включена потоковая передача медиа Twilio; в противном случае вызовы возвращаются к нативным голосам провайдера.
- Если поток медиа Twilio уже активен, Voice Call не возвращается к TwiML `<Say>`. Если телефонный TTS недоступен в этом состоянии, запрос воспроизведения завершается ошибкой вместо смешивания двух путей воспроизведения.
- Когда телефонный TTS возвращается к вторичному провайдеру, Voice Call записывает предупреждение с цепочкой провайдеров (`from`, `to`, `attempts`) для отладки.
- Когда barge-in Twilio или демонтаж потока очищает ожидающую очередь TTS, поставленные в очередь запросы воспроизведения завершаются вместо того, чтобы оставлять вызывающих абонентов в ожидании завершения воспроизведения.

### Примеры TTS

<Tabs>
  <Tab title="Core TTS only">
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

## Входящие вызовы

Политика входящих вызовов по умолчанию — `disabled`. Чтобы включить входящие
вызовы, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` — это проверка идентификатора вызывающего абонента
с низким уровнем надежности. Плагин нормализует предоставленное провайдером
значение `From` и сравнивает его с `allowFrom`. Проверка Webhook подтверждает
доставку провайдером и целостность полезной нагрузки, но **не** доказывает
владение номером вызывающего абонента PSTN/VoIP. Рассматривайте `allowFrom`
как фильтрацию по идентификатору вызывающего абонента, а не как строгую
идентификацию вызывающего абонента.
</Warning>

Автоответы используют систему агентов. Настраивайте их с помощью
`responseModel`, `responseSystemPrompt` и `responseTimeoutMs`.

### Маршрутизация по номерам

Используйте `numbers`, когда один плагин Voice Call принимает вызовы для
нескольких телефонных номеров и каждый номер должен вести себя как отдельная
линия. Например, один номер может использовать непринужденного личного
ассистента, а другой — деловую персону, другого агента ответа и другой голос
TTS.

Маршруты выбираются по предоставленному провайдером набранному номеру `To`.
Ключи должны быть номерами E.164. Когда вызов поступает, Voice Call один раз
разрешает соответствующий маршрут, сохраняет сопоставленный маршрут в записи
вызова и повторно использует эту эффективную конфигурацию для приветствия,
классического пути автоответа, пути консультации в реальном времени и
воспроизведения TTS. Если маршрут не совпадает, используется глобальная
конфигурация Voice Call. Исходящие вызовы не используют `numbers`; передавайте
исходящую цель, сообщение и сеанс явно при инициировании вызова.

Переопределения маршрутов сейчас поддерживают:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Значение маршрута `tts` глубоко объединяется поверх глобальной конфигурации
Voice Call `tts`, поэтому обычно можно переопределить только голос провайдера:

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

### Контракт речевого вывода

Для автоответов Voice Call добавляет строгий контракт речевого вывода к
системной подсказке:

```text
{"spoken":"..."}
```

Voice Call извлекает текст речи защитным образом:

- Игнорирует полезные нагрузки, помеченные как содержимое рассуждения или ошибки.
- Разбирает прямой JSON, JSON в огражденном блоке или встроенные ключи `"spoken"`.
- Возвращается к обычному тексту и удаляет вероятные вступительные абзацы планирования или метаданных.

Это сохраняет воспроизведение речи сфокусированным на тексте для вызывающего
абонента и предотвращает утечку текста планирования в аудио.

### Поведение запуска разговора

Для исходящих вызовов `conversation` обработка первого сообщения привязана к
живому состоянию воспроизведения:

- Очистка очереди barge-in и автоответ подавляются только пока начальное приветствие активно произносится.
- Если начальное воспроизведение завершается ошибкой, вызов возвращается в состояние `listening`, а начальное сообщение остается в очереди для повторной попытки.
- Начальное воспроизведение для потоковой передачи Twilio запускается при подключении потока без дополнительной задержки.
- Barge-in прерывает активное воспроизведение и очищает поставленные в очередь, но еще не воспроизводимые записи Twilio TTS. Очищенные записи разрешаются как пропущенные, поэтому логика последующего ответа может продолжаться без ожидания аудио, которое никогда не будет воспроизведено.
- Голосовые разговоры в реальном времени используют собственный начальный ход потока реального времени. Voice Call **не** отправляет устаревшее обновление TwiML `<Say>` для этого начального сообщения, поэтому исходящие сеансы `<Connect><Stream>` остаются подключенными.

### Льготный период при отключении потока Twilio

Когда медиапоток Twilio отключается, Voice Call ждет **2000 мс** перед
автоматическим завершением вызова:

- Если поток повторно подключается в течение этого окна, автоматическое завершение отменяется.
- Если после льготного периода ни один поток не регистрируется повторно, вызов завершается, чтобы предотвратить зависшие активные вызовы.

## Очистка устаревших вызовов

Используйте `staleCallReaperSeconds`, чтобы завершать вызовы, которые так и не получают
завершающий Webhook (например, вызовы в режиме уведомления, которые никогда не завершаются). Значение по умолчанию
— `0` (отключено).

Рекомендуемые диапазоны:

- **Production:** `120`–`300` секунд для потоков в стиле уведомлений.
- Держите это значение **выше, чем `maxDurationSeconds`**, чтобы обычные вызовы могли завершиться. Хорошая отправная точка — `maxDurationSeconds + 30–60` секунд.

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

## Безопасность Webhook

Когда перед Gateway стоит прокси или туннель, Plugin
восстанавливает публичный URL для проверки подписи. Эти параметры
управляют тем, каким forwarded-заголовкам можно доверять:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Список разрешенных хостов из forwarding-заголовков.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Доверять forwarded-заголовкам без списка разрешенных хостов.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Доверять forwarded-заголовкам только тогда, когда удаленный IP запроса совпадает со списком.
</ParamField>

Дополнительные средства защиты:

- **Защита от повторного воспроизведения Webhook** включена для Twilio и Plivo. Повторно воспроизведенные валидные Webhook-запросы подтверждаются, но пропускаются для побочных эффектов.
- Ходы разговора Twilio включают токен для каждого хода в обратных вызовах `<Gather>`, поэтому устаревшие или повторно воспроизведенные речевые обратные вызовы не могут удовлетворить более новый ожидающий ход транскрипта.
- Неаутентифицированные Webhook-запросы отклоняются до чтения тела, если отсутствуют обязательные заголовки подписи провайдера.
- Webhook voice-call использует общий pre-auth профиль тела (64 КБ / 5 секунд) плюс ограничение на количество одновременных запросов по IP перед проверкой подписи.

Пример со стабильным публичным хостом:

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

Когда Gateway уже запущен, операционные команды `voicecall` делегируются
runtime voice-call, которым владеет Gateway, поэтому CLI не привязывает второй
Webhook-сервер. Если Gateway недоступен, команды переключаются на
автономный runtime CLI.

`latency` читает `calls.jsonl` из стандартного пути хранилища voice-call.
Используйте `--file <path>`, чтобы указать другой журнал, и `--last <n>`, чтобы ограничить
анализ последними N записями (по умолчанию 200). Вывод включает p50/p90/p99
для задержки хода и времени ожидания прослушивания.

## Инструмент агента

Имя инструмента: `voice_call`.

| Действие        | Аргументы                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Plugin voice-call поставляется с соответствующим навыком агента.

## Gateway RPC

| Метод                | Аргументы                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` допустим только с `mode: "conversation"`. Вызовы в режиме уведомления
должны использовать `voicecall.dtmf` после создания вызова, если им нужны
цифры после соединения.

## Устранение неполадок

### Настройка не может открыть Webhook наружу

Запускайте настройку из той же среды, где работает Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Для `twilio`, `telnyx` и `plivo` проверка `webhook-exposure` должна быть зеленой. Настроенный
`publicUrl` все равно не пройдет проверку, если указывает на локальное или частное сетевое
пространство, потому что оператор не сможет выполнить обратный вызов на эти адреса. Не используйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` или `fd00::/8` как `publicUrl`.

Исходящие вызовы Twilio в режиме уведомления отправляют начальный TwiML `<Say>` напрямую в
запросе создания вызова, поэтому первое произнесенное сообщение не зависит от того,
получит ли Twilio Webhook TwiML. Публичный Webhook по-прежнему требуется для status callbacks,
разговорных вызовов, pre-connect DTMF, realtime-потоков и управления вызовом
после соединения.

Используйте один публичный путь доступа:

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

После изменения конфигурации перезапустите или перезагрузите Gateway, затем выполните:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` — это пробный запуск, если вы не передали `--yes`.

### Учетные данные провайдера не проходят проверку

Проверьте выбранного провайдера и обязательные поля учетных данных:

- Twilio: `twilio.accountSid`, `twilio.authToken` и `fromNumber`, или
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` и `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` и
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` и `fromNumber`.

Учетные данные должны существовать на хосте Gateway. Изменение локального профиля оболочки
не влияет на уже запущенный Gateway, пока он не перезапустится или не перезагрузит свое
окружение.

### Вызовы запускаются, но Webhook провайдера не приходят

Убедитесь, что консоль провайдера указывает на точный публичный URL Webhook:

```text
https://voice.example.com/voice/webhook
```

Затем проверьте состояние runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Распространенные причины:

- `publicUrl` указывает на путь, отличный от `serve.path`.
- URL туннеля изменился после запуска Gateway.
- Прокси пересылает запрос, но удаляет или переписывает заголовки host/proto.
- Firewall или DNS направляет публичное имя хоста куда-то помимо Gateway.
- Gateway был перезапущен без включенного Plugin Voice Call.

Когда перед Gateway стоит обратный прокси или туннель, задайте
`webhookSecurity.allowedHosts` равным публичному имени хоста или используйте
`webhookSecurity.trustedProxyIPs` для известного адреса прокси. Используйте
`webhookSecurity.trustForwardingHeaders` только тогда, когда граница прокси находится под
вашим контролем.

### Проверка подписи не проходит

Подписи провайдера проверяются относительно публичного URL, который OpenClaw восстанавливает
из входящего запроса. Если подписи не проходят проверку:

- Убедитесь, что URL Webhook у провайдера точно совпадает с `publicUrl`, включая
  схему, хост и путь.
- Для URL ngrok free-tier обновляйте `publicUrl`, когда имя хоста туннеля меняется.
- Убедитесь, что прокси сохраняет исходные заголовки host и proto, или настройте
  `webhookSecurity.allowedHosts`.
- Не включайте `skipSignatureVerification` вне локального тестирования.

### Не удается присоединиться к Google Meet через Twilio

Google Meet использует этот Plugin для подключений через Twilio dial-in. Сначала проверьте Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Затем явно проверьте транспорт Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Если Voice Call работает корректно, но участник Meet так и не присоединяется, проверьте номер
dial-in Meet, PIN и `--dtmf-sequence`. Телефонный вызов может быть исправен, пока
встреча отклоняет или игнорирует неверную последовательность DTMF.

Google Meet запускает телефонную ветку Twilio через `voicecall.start` с
pre-connect последовательностью DTMF. Последовательности, полученные из PIN, включают
`voiceCall.dtmfDelayMs` Plugin Google Meet как начальные цифры ожидания Twilio. Значение по умолчанию — 12 секунд,
поскольку подсказки dial-in Meet могут приходить поздно. Затем Voice Call перенаправляет обратно на
realtime-обработку до запроса вступительного приветствия.

Используйте `openclaw logs --follow` для трассировки живой фазы. Успешное присоединение Twilio Meet
записывает в журнал следующий порядок:

- Google Meet делегирует присоединение Twilio в Voice Call.
- Voice Call сохраняет pre-connect DTMF TwiML.
- Начальный TwiML Twilio потребляется и отдается до realtime-обработки.
- Voice Call отдает realtime TwiML для вызова Twilio.
- Google Meet запрашивает вступительную речь через `voicecall.speak` после задержки post-DTMF.

`openclaw voicecall tail` по-прежнему показывает сохраненные записи вызовов; это полезно для
состояния вызова и транскриптов, но не каждый Webhook или realtime-переход появляется
там.

### В realtime-вызове нет речи

Убедитесь, что включен только один аудиорежим. `realtime.enabled` и
`streaming.enabled` не могут одновременно быть true.

Для realtime-вызовов Twilio также проверьте:

- Plugin realtime-провайдера загружен и зарегистрирован.
- `realtime.provider` не задан или указывает на зарегистрированного провайдера.
- API-ключ провайдера доступен процессу Gateway.
- `openclaw logs --follow` показывает, что realtime TwiML отдан, realtime-мост
  запущен, а начальное приветствие поставлено в очередь.

## См. также

- [Режим разговора](/ru/nodes/talk)
- [Преобразование текста в речь](/ru/tools/tts)
- [Голосовое пробуждение](/ru/nodes/voicewake)
