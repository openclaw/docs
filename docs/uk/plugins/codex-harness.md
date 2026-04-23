---
read_when:
    - Ви хочете використовувати комплектний каркас app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний перехід на PI для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний каркас app-server Codex
title: Каркас Codex
x-i18n:
    generated_at: "2026-04-23T02:13:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc2acc3dc906d12e12a837a25a52ec0e72d44325786106771045d456e6327040
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Каркас Codex

Комплектний Plugin `codex` дає OpenClaw змогу виконувати вбудовані ходи агента через
app-server Codex замість вбудованого каркаса PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням потоку, нативною Compaction і виконанням через
app-server. OpenClaw і далі керує каналами чату, файлами сесій, вибором моделей, інструментами,
схваленнями, доставкою медіа та видимим дзеркалом стенограми.

Нативні ходи Codex також враховують спільні хуки Plugin `before_prompt_build`,
`before_compaction` і `after_compaction`, тож шими промптів і
автоматизація з урахуванням Compaction можуть залишатися узгодженими з каркасом PI.
Нативні ходи Codex також враховують спільні хуки Plugin `before_prompt_build`,
`before_compaction`, `after_compaction`, `llm_input`, `llm_output` і
`agent_end`, тож шими промптів, автоматизація з урахуванням Compaction і
спостерігачі життєвого циклу можуть залишатися узгодженими з каркасом PI.

Каркас вимкнено за замовчуванням. Його буде вибрано лише тоді, коли Plugin `codex`
увімкнено і визначена модель є моделлю `codex/*`, або коли ви явно
примусово задаєте `embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви взагалі не налаштовуєте `codex/*`, наявні запуски PI, OpenAI, Anthropic, Gemini, local
і custom-provider зберігають поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у форматі OpenAI та Codex:

| Посилання на модель   | Шлях виконання                               | Використовуйте, коли                                                     |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`      | Провайдер OpenAI через інфраструктуру OpenClaw/PI | Вам потрібен прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`.    |
| `openai-codex/gpt-5.4` | Провайдер OpenAI Codex OAuth через PI       | Вам потрібен ChatGPT/Codex OAuth без каркаса app-server Codex.           |
| `codex/gpt-5.4`       | Комплектний провайдер Codex плюс каркас Codex | Вам потрібне нативне виконання через app-server Codex для вбудованого ходу агента. |

Каркас Codex обробляє лише посилання на моделі `codex/*`. Наявні посилання `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider зберігають
свої звичайні шляхи.

## Вимоги

- OpenClaw із доступним комплектним Plugin `codex`.
- app-server Codex версії `0.118.0` або новішої.
- Автентифікація Codex, доступна процесу app-server.

Plugin блокує старіші або безверсійні рукостискання app-server. Це утримує
OpenClaw на поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також
з необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, що й ваш локальний
app-server Codex.

## Мінімальна конфігурація

Використовуйте `codex/gpt-5.4`, увімкніть комплектний Plugin і примусово задайте
каркас `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Якщо у вашій конфігурації використовується `plugins.allow`, додайте туди також `codex`:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Установлення `agents.defaults.model` або моделі агента в `codex/<model>` також
автоматично вмикає комплектний Plugin `codex`. Явний запис Plugin, як і раніше,
корисний у спільних конфігураціях, оскільки робить намір розгортання очевидним.

## Додайте Codex без заміни інших моделей

Залиште `runtime: "auto"`, якщо хочете використовувати Codex для моделей `codex/*`, а PI — для
всього іншого:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

За такої форми:

- `/model codex` або `/model codex/gpt-5.4` використовує каркас app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях через провайдер OpenAI.
- `/model opus` використовує шлях через провайдер Anthropic.
- Якщо вибрано модель не Codex, PI залишається каркасом сумісності.

## Розгортання лише з Codex

Вимкніть резервний перехід на PI, коли потрібно підтвердити, що кожен вбудований хід агента використовує
каркас Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Перевизначення через середовище:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Коли резервний перехід вимкнено, OpenClaw завершує роботу з помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
потрібна модель не є посиланням `codex/*`, app-server надто старий або
app-server не вдається запустити.

## Codex для окремого агента

Ви можете зробити одного агента лише для Codex, тоді як агент за замовчуванням зберігатиме звичайний
автовибір:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Використовуйте звичайні команди сесії для перемикання агентів і моделей. `/new` створює нову
сесію OpenClaw, а каркас Codex створює або відновлює свій sidecar-потік app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього потоку.

## Виявлення моделей

За замовчуванням Plugin Codex запитує app-server про доступні моделі. Якщо
виявлення завершується помилкою або перевищує час очікування, він використовує комплектний резервний каталог:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Ви можете налаштувати виявлення в `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалося зондування Codex і
використовувався резервний каталог:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Підключення до app-server і політика

За замовчуванням Plugin запускає Codex локально так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії каркаса Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, яка використовується
для автономних Heartbeat: Codex може використовувати інструменти shell і мережі без
зупинок на нативних запитах схвалення, на які нікому відповісти.

Щоб увімкнути схвалення Codex, переглянуті Guardian, установіть `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Режим Guardian розгортається в таке:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Guardian — це нативний рецензент схвалень Codex. Коли Codex просить вийти з
пісочниці, записати за межами робочого простору або додати дозволи, наприклад доступ до мережі,
Codex надсилає цей запит на схвалення до підлеглого агента-рецензента, а не людині через
підказку. Рецензент збирає контекст і застосовує модель ризиків Codex, а потім
схвалює або відхиляє конкретний запит. Guardian корисний, коли вам потрібні
сильніші запобіжники, ніж у режимі YOLO, але все одно потрібні агенти без нагляду та Heartbeat,
які можуть просуватися далі.

Docker live harness містить перевірку Guardian, коли
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Він запускає каркас Codex у
режимі Guardian, перевіряє, що нешкідлива shell-команда з підвищенням привілеїв схвалюється, і
перевіряє, що вивантаження фальшивого секрету до недовіреного зовнішнього призначення відхиляється,
щоб агент повторно запросив явне схвалення.

Окремі поля політики, як і раніше, мають пріоритет над `mode`, тож розширені розгортання можуть
поєднувати готове налаштування з явними параметрами.

Для app-server, який уже запущено, використовуйте транспорт WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Підтримувані поля `appServer`:

| Поле                | За замовчуванням                           | Значення                                                                                                   |
| ------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                  | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                            |
| `command`           | `"codex"`                                  | Виконуваний файл для транспорту stdio.                                                                     |
| `args`              | `["app-server", "--listen", "stdio://"]`   | Аргументи для транспорту stdio.                                                                            |
| `url`               | не задано                                  | URL app-server WebSocket.                                                                                  |
| `authToken`         | не задано                                  | Bearer-токен для транспорту WebSocket.                                                                     |
| `headers`           | `{}`                                       | Додаткові заголовки WebSocket.                                                                             |
| `requestTimeoutMs`  | `60000`                                    | Тайм-аут для викликів площини керування app-server.                                                        |
| `mode`              | `"yolo"`                                   | Готове налаштування для виконання в режимі YOLO або з рецензуванням Guardian.                              |
| `approvalPolicy`    | `"never"`                                  | Нативна політика схвалення Codex, що надсилається під час запуску/відновлення потоку та ходу.             |
| `sandbox`           | `"danger-full-access"`                     | Нативний режим пісочниці Codex, що надсилається під час запуску/відновлення потоку.                        |
| `approvalsReviewer` | `"user"`                                   | Використовуйте `"guardian_subagent"`, щоб дозволити Codex Guardian перевіряти запити.                     |
| `serviceTier`       | не задано                                  | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища, як і раніше, працюють як резервні варіанти для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Конфігурація
є кращою для відтворюваних розгортань, оскільки зберігає поведінку Plugin в тому
самому перевіреному файлі, що й решта налаштувань каркаса Codex.

## Поширені рецепти

Локальний Codex зі стандартним транспортом stdio:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Перевірка каркаса лише Codex, із вимкненим резервним переходом на PI:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Схвалення Codex, перевірені Guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Віддалений app-server з явними заголовками:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Перемикання моделей і далі контролюється OpenClaw. Коли сесію OpenClaw під’єднано
до наявного потоку Codex, наступний хід знову надсилає до
app-server поточні вибрані `codex/*` модель, провайдер, політику схвалення, пісочницю та рівень сервісу.
Перемикання з `codex/gpt-5.4` на `codex/gpt-5.2` зберігає
прив’язку до потоку, але просить Codex продовжити з нововибраною моделлю.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона
є універсальною і працює в будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує стан підключення до live app-server, моделі, обліковий запис, обмеження швидкості, сервери MCP і skills.
- `/codex models` показує список live-моделей app-server Codex.
- `/codex threads [filter]` показує список нещодавніх потоків Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction для приєднаного потоку.
- `/codex review` запускає нативне рев’ю Codex для приєднаного потоку.
- `/codex account` показує стан облікового запису та обмежень швидкості.
- `/codex mcp` показує стан серверів MCP app-server Codex.
- `/codex skills` показує Skills app-server Codex.

`/codex resume` записує той самий файл sidecar-прив’язки, який каркас використовує для
звичайних ходів. На наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану в OpenClaw модель `codex/*` до app-server і зберігає увімкненою
розширену історію.

Поверхня команд вимагає app-server Codex версії `0.118.0` або новішої. Окремі
методи керування повідомляються як `unsupported by this Codex app-server`, якщо
майбутній або користувацький app-server не надає цього JSON-RPC-методу.

## Інструменти, медіа та Compaction

Каркас Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw і далі формує список інструментів і отримує динамічні результати інструментів від
каркаса. Текст, зображення, відео, музика, TTS, схвалення та вивід інструментів обміну повідомленнями
і далі проходять звичайним шляхом доставки OpenClaw.

Запити на схвалення інструментів Codex MCP маршрутизуються через потік
схвалення Plugin OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити на підтвердження та запити довільного введення, як і раніше, завершуються
заборонено за замовчуванням.

Коли вибрана модель використовує каркас Codex, нативна Compaction потоку
делегується app-server Codex. OpenClaw зберігає дзеркало стенограми для
історії каналу, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або каркаса. Дзеркало
містить запит користувача, фінальний текст асистента та полегшені записи міркувань або плану Codex,
коли їх генерує app-server. Наразі OpenClaw записує лише сигнали
початку та завершення нативної Compaction. Він іще не показує
зрозуміле для людини зведення Compaction або придатний для аудиту список того, які записи Codex
зберіг після Compaction.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення неполадок

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден каркас Codex не обробляє запуск,
OpenClaw може використовувати PI як сумісний бекенд. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися з помилкою, коли жоден каркас Plugin не підходить. Щойно
буде вибрано app-server Codex, його збої проявлятимуться безпосередньо, без додаткової
конфігурації резервного переходу.

**app-server відхиляється:** оновіть Codex, щоб рукостискання app-server
повідомляло версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується з помилкою:** перевірте `appServer.url`, `authToken`
і те, що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Модель не Codex використовує PI:** це очікувано. Каркас Codex обробляє лише
посилання на моделі `codex/*`.

## Пов’язані матеріали

- [Plugins каркаса агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
