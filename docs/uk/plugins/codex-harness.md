---
read_when:
    - Ви хочете використовувати комплектний каркас app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний перехід на PI для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний каркас app-server Codex
title: Каркас Codex
x-i18n:
    generated_at: "2026-04-22T23:11:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1807184a085f4b54e1b722e02c1f47f059dc393a0ba7ecb0ec5903f74495267f
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Каркас Codex

Комплектний plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агента через
app-server Codex замість вбудованого каркаса PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням потоку, нативною Compaction і виконанням через app-server.
OpenClaw і далі керує каналами чату, файлами сесій, вибором моделей, інструментами,
погодженнями, доставкою медіа та видимим дзеркалом транскрипту.

Нативні ходи Codex також поважають спільні plugin-хуки `before_prompt_build`,
`before_compaction` і `after_compaction`, тож шими prompt і автоматизація з урахуванням
Compaction можуть залишатися узгодженими з каркасом PI.

Каркас вимкнений типово. Він вибирається лише тоді, коли plugin `codex` увімкнено і
визначена модель є моделлю `codex/*`, або коли ви явно примусово задаєте
`embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви взагалі не налаштовуєте `codex/*`, наявні запуски PI, OpenAI, Anthropic, Gemini, local
і custom-provider зберігають свою поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у форматі OpenAI та Codex:

| Посилання на модель  | Шлях середовища виконання                  | Використовуйте, коли                                                     |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`     | Провайдер OpenAI через обв’язку OpenClaw/PI | Вам потрібен прямий доступ до OpenAI Platform API за допомогою `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Провайдер OpenAI Codex OAuth через PI    | Вам потрібен ChatGPT/Codex OAuth без каркаса app-server Codex.           |
| `codex/gpt-5.4`      | Комплектний провайдер Codex плюс каркас Codex | Вам потрібне нативне виконання через app-server Codex для вбудованого ходу агента. |

Каркас Codex обробляє лише посилання на моделі `codex/*`. Наявні посилання `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider зберігають
свої звичайні шляхи.

## Вимоги

- OpenClaw із доступним комплектним plugin `codex`.
- app-server Codex версії `0.118.0` або новішої.
- Автентифікація Codex, доступна процесу app-server.

Plugin блокує старіші або безверсійні рукостискання app-server. Це гарантує, що
OpenClaw працює в межах поверхні протоколу, з якою його було протестовано.

Для live- і Docker-smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також
за потреби з файлів CLI Codex, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, що й ваш локальний
app-server Codex.

## Мінімальна конфігурація

Використайте `codex/gpt-5.4`, увімкніть комплектний plugin і примусово задайте каркас `codex`:

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

Якщо у вашій конфігурації використовується `plugins.allow`, також додайте туди `codex`:

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
автоматично вмикає комплектний plugin `codex`. Явний запис plugin усе одно
корисний у спільних конфігураціях, бо робить намір розгортання очевидним.

## Додайте Codex без заміни інших моделей

Залиште `runtime: "auto"`, якщо хочете використовувати Codex для моделей `codex/*` і PI для
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

З такою структурою:

- `/model codex` або `/model codex/gpt-5.4` використовує каркас app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях провайдера OpenAI.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex модель, PI залишається каркасом сумісності.

## Розгортання лише з Codex

Вимкніть резервний перехід на PI, якщо вам потрібно довести, що кожен вбудований хід агента
використовує каркас Codex:

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

За вимкненого fallback OpenClaw завершується з помилкою на ранньому етапі, якщо plugin Codex вимкнено,
потрібна модель не є посиланням `codex/*`, app-server занадто старий або
app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити один агент лише-Codex, тоді як типовий агент зберігатиме звичайний
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

Використовуйте звичайні команди сесії, щоб перемикати агентів і моделі. `/new` створює нову
сесію OpenClaw, а каркас Codex за потреби створює або відновлює свій sidecar-потік app-server.
`/reset` очищає прив’язку сесії OpenClaw для цього потоку.

## Виявлення моделей

Типово plugin Codex запитує app-server про доступні моделі. Якщо
виявлення не вдається або перевищує час очікування, він використовує комплектний резервний каталог:

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

## З’єднання app-server і політика

Типово plugin локально запускає Codex так:

```bash
codex app-server --listen stdio://
```

Типово OpenClaw запускає локальні сесії каркаса Codex повністю без обмежень:
`approvalPolicy: "never"` і `sandbox: "danger-full-access"`. Це відповідає
позиції довіреного локального оператора, яку використовує CLI Codex, і дозволяє автономним
Heartbeat використовувати мережеві та shell-інструменти без очікування на невидимий нативний
шлях погодження. Ви можете посилити цю політику, наприклад, спрямовуючи перевірки
через guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Для app-server, який уже працює, використовуйте транспорт WebSocket:

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

| Поле                | Типове значення                           | Значення                                                                 |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                 | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.          |
| `command`           | `"codex"`                                 | Виконуваний файл для транспорту stdio.                                   |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Аргументи для транспорту stdio.                                          |
| `url`               | не задано                                 | URL WebSocket app-server.                                                |
| `authToken`         | не задано                                 | Bearer-токен для транспорту WebSocket.                                   |
| `headers`           | `{}`                                      | Додаткові заголовки WebSocket.                                           |
| `requestTimeoutMs`  | `60000`                                   | Тайм-аут для викликів control-plane app-server.                          |
| `approvalPolicy`    | `"never"`                                 | Нативна політика погодження Codex, що надсилається під час start/resume/turn потоку. |
| `sandbox`           | `"danger-full-access"`                    | Нативний режим sandbox Codex, що надсилається під час start/resume потоку. |
| `approvalsReviewer` | `"user"`                                  | Використовуйте `"guardian_subagent"`, щоб guardian Codex перевіряв нативні погодження. |
| `serviceTier`       | не задано                                 | Необов’язковий рівень сервісу Codex, наприклад `"priority"`.             |

Старі змінні середовища все ще працюють як резервні варіанти для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Для відтворюваних розгортань краще використовувати конфігурацію.

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

Перевірка каркаса лише-Codex із вимкненим резервним переходом на PI:

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

Погодження Codex, перевірені guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
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

Віддалений app-server із явними заголовками:

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

Перемикання моделей і далі контролюється OpenClaw. Коли сесію OpenClaw прив’язано
до наявного потоку Codex, наступний хід знову надсилає в app-server поточну вибрану
модель `codex/*`, провайдера, політику погодження, sandbox і рівень сервісу.
Перемикання з `codex/gpt-5.4` на `codex/gpt-5.2` зберігає прив’язку потоку, але просить Codex
продовжити роботу з новою вибраною моделлю.

## Команда Codex

Комплектний plugin реєструє `/codex` як авторизовану slash-команду. Вона
є загальною і працює в будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує живе підключення до app-server, моделі, обліковий запис, ліміти швидкості, MCP-сервери та Skills.
- `/codex models` виводить список живих моделей app-server Codex.
- `/codex threads [filter]` виводить список нещодавніх потоків Codex.
- `/codex resume <thread-id>` прив’язує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction для прив’язаного потоку.
- `/codex review` запускає нативну перевірку Codex для прив’язаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` виводить стан MCP-сервера app-server Codex.
- `/codex skills` виводить Skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який каркас використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану в OpenClaw модель `codex/*` в app-server і зберігає ввімкненою
розширену історію.

Поверхня команд вимагає app-server Codex версії `0.118.0` або новішої. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає цей JSON-RPC-метод.

## Інструменти, медіа та Compaction

Каркас Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw і далі формує список інструментів і отримує динамічні результати інструментів із
каркаса. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів повідомлень
і далі проходять через звичайний шлях доставки OpenClaw.

Коли вибрана модель використовує каркас Codex, нативна Compaction потоку
делегується app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделей або каркасів. Дзеркало
включає prompt користувача, фінальний текст асистента та полегшені записи міркувань
або плану Codex, коли їх видає app-server. Наразі OpenClaw записує лише сигнали
початку та завершення нативної Compaction. Він ще не показує людинозрозумілий
підсумок Compaction або придатний для аудиту список записів, які Codex
залишив після Compaction.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування провайдера/моделі, як-от
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення неполадок

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден каркас Codex не обробляє запуск,
OpenClaw може використовувати PI як backend сумісності. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися з помилкою, коли жоден plugin-каркас не підходить. Щойно
вибрано app-server Codex, його помилки передаються безпосередньо без додаткової
конфігурації fallback.

**app-server відхиляється:** оновіть Codex, щоб рукостискання app-server
повідомляло версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується з помилкою:** перевірте `appServer.url`, `authToken`
і чи віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Не-Codex модель використовує PI:** це очікувана поведінка. Каркас Codex обробляє лише
посилання на моделі `codex/*`.

## Пов’язане

- [Plugins каркаса агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
