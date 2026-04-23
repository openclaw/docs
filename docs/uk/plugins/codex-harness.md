---
read_when:
    - Ви хочете використовувати вбудований harness app-server Codex
    - Вам потрібні model refs Codex і приклади конфігурації
    - Ви хочете вимкнути fallback PI для розгортань лише з Codex
summary: Запуск вбудованих ходів агента OpenClaw через вбудований harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-23T21:02:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65e96ac709a7996878037da3ffb8903cdd3ad83bb5de75c47ab2f0a08882098c
    source_path: plugins/codex-harness.md
    workflow: 15
---

Вбудований Plugin `codex` дозволяє OpenClaw виконувати вбудовані ходи агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex володів низькорівневою сесією агента: виявленням
моделей, native thread resume, native compaction і виконанням app-server.
OpenClaw усе ще володіє chat channels, файлами сесій, вибором моделі, tools,
approvals, доставкою медіа та видимим дзеркалом transcript.

Native-ходи Codex також поважають спільні plugin hooks, тож prompt shim-и,
автоматизація з урахуванням compaction, middleware tools і lifecycle observers
залишаються узгодженими з harness PI:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Вбудовані plugins також можуть реєструвати factory розширення app-server Codex для додавання
асинхронного middleware `tool_result`.

Harness типово вимкнений. Нові конфігурації мають залишати refs моделей OpenAI
канонічними як `openai/gpt-*` і явно примусово задавати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли
потрібне native-виконання через app-server. Legacy refs моделей `codex/*` усе ще автоматично вибирають
harness для сумісності.

## Виберіть правильний префікс моделі

Тепер OpenClaw зберігає refs моделей OpenAI GPT канонічними як `openai/*`:

| Ref моделі                                            | Шлях runtime                                 | Використовуйте, коли                                                     |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.5`                                      | provider OpenAI через OpenClaw/PI plumbing   | Вам потрібен прямий доступ до OpenAI Platform API через `OPENAI_API_KEY`. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness app-server Codex                     | Вам потрібне native-виконання через app-server Codex для вбудованого ходу агента. |

Legacy refs `openai-codex/gpt-*` і `codex/gpt-*` усе ще приймаються як
compatibility alias-и, але нові приклади документації/конфігурації мають використовувати `openai/gpt-*`.

Вибір harness — це не механізм керування live session. Коли виконується вбудований хід,
OpenClaw записує id вибраного harness у цій сесії й продовжує використовувати його для
наступних ходів у тому самому id сесії. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням уже наявної
розмови між PI і Codex. Це запобігає повторному програванню одного transcript через
дві несумісні native session systems.

Legacy sessions, створені до появи pins harness, вважаються прив’язаними до PI, щойно
мають історію transcript. Використовуйте `/new` або `/reset`, щоб перевести цю розмову на
Codex після зміни конфігурації.

`/status` показує ефективний non-PI harness поруч із `Fast`, наприклад
`Fast · codex`. Типовий harness PI лишається `Runner: pi (embedded)` і
не додає окремий badge harness.

## Вимоги

- OpenClaw із доступним вбудованим Plugin `codex`.
- Codex app-server `0.118.0` або новіший.
- Auth Codex, доступна для процесу app-server.

Plugin блокує старіші або безверсійні handshakes app-server. Це тримає
OpenClaw у межах тієї поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke tests auth зазвичай надходить із `OPENAI_API_KEY`, плюс
необов’язкові файли Codex CLI, такі як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте той самий auth material, який використовує ваш локальний Codex app-server.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть вбудований Plugin і примусово задайте harness `codex`:

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
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Якщо ваша конфігурація використовує `plugins.allow`, включіть туди й `codex`:

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

Legacy-конфігурації, які задають `agents.defaults.model` або модель агента як
`codex/<model>`, усе ще автоматично вмикають вбудований Plugin `codex`. Нові конфігурації мають
надавати перевагу `openai/<model>` плюс явному запису `embeddedHarness` вище.

## Додати Codex без заміни інших моделей

Залишайте `runtime: "auto"`, коли хочете, щоб legacy refs `codex/*` вибирали Codex, а
PI — усе інше. Для нових конфігурацій надавайте перевагу явному `runtime: "codex"` для
агентів, які мають використовувати harness.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

За такої форми:

- `/model gpt` або `/model openai/gpt-5.5` використовує harness app-server Codex для цієї конфігурації.
- `/model opus` використовує шлях provider-а Anthropic.
- Якщо вибрано non-Codex model, PI лишається harness сумісності.

## Розгортання лише з Codex

Вимкніть fallback PI, коли потрібно довести, що кожен вбудований хід агента використовує
harness Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Коли fallback вимкнено, OpenClaw одразу завершується з помилкою, якщо Plugin Codex вимкнено,
app-server занадто старий або app-server не вдається запустити.

## Codex для окремого агента

Ви можете зробити одного агента Codex-only, тоді як типовий агент зберігатиме звичайне
автовибрання:

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
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Використовуйте звичайні команди сесії, щоб перемикати агентів і моделі. `/new` створює свіжу
сесію OpenClaw, а harness Codex створює або відновлює свій sidecar app-server
thread за потреби. `/reset` очищає прив’язку сесії OpenClaw до цього thread
і дозволяє наступному ходу знову розв’язати harness з поточної конфігурації.

## Виявлення моделей

Типово Plugin Codex запитує app-server про доступні моделі. Якщо
виявлення не вдається або спливає timeout, він використовує вбудований fallback catalog для:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

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

Вимкніть виявлення, якщо хочете, щоб startup не виконував probe Codex і лишався на
fallback catalog:

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

## Підключення app-server і політика

Типово Plugin запускає Codex локально так:

```bash
codex app-server --listen stdio://
```

Типово OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це довірена локальна операторська позиція, яка використовується
для автономних heartbeat: Codex може користуватися shell і network tools без
зупинки на native approval prompts, на які нікому відповідати.

Щоб увімкнути перевірювані Guardian approvals у Codex, задайте `appServer.mode:
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

Guardian — це native reviewer approvals у Codex. Коли Codex просить вийти із sandbox, писати поза workspace або додати дозволи на кшталт доступу до мережі, Codex спрямовує цей approval request до reviewer subagent-а, а не до prompt людини. Reviewer застосовує risk framework Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, коли вам потрібно більше запобіжників, ніж у режимі YOLO, але все ще потрібно, щоб unattended agents могли просуватися далі.

Preset `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики все одно перевизначають `mode`, тому в розширених розгортаннях можна змішувати preset з явними виборами.

Для вже запущеного app-server використовуйте транспорт WebSocket:

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

| Поле                | Типове значення                            | Значення                                                                                                   |
| ------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                  | `"stdio"` породжує Codex; `"websocket"` підключається до `url`.                                            |
| `command`           | `"codex"`                                  | Executable для транспорту stdio.                                                                           |
| `args`              | `["app-server", "--listen", "stdio://"]`   | Аргументи для транспорту stdio.                                                                            |
| `url`               | не задано                                  | URL WebSocket app-server.                                                                                  |
| `authToken`         | не задано                                  | Bearer token для транспорту WebSocket.                                                                     |
| `headers`           | `{}`                                       | Додаткові заголовки WebSocket.                                                                             |
| `requestTimeoutMs`  | `60000`                                    | Timeout для викликів control-plane app-server.                                                             |
| `mode`              | `"yolo"`                                   | Preset для YOLO або виконання з approvals, перевірюваними Guardian.                                        |
| `approvalPolicy`    | `"never"`                                  | Native approval policy Codex, що надсилається під час start/resume/turn thread.                            |
| `sandbox`           | `"danger-full-access"`                     | Native sandbox mode Codex, що надсилається під час start/resume.                                           |
| `approvalsReviewer` | `"user"`                                   | Використовуйте `"guardian_subagent"`, щоб Codex Guardian перевіряв prompts.                                |
| `serviceTier`       | не задано                                  | Необов’язковий service tier app-server Codex: `"fast"`, `"flex"` або `null`. Невалідні legacy values ігноруються. |

Старіші змінні середовища все ще працюють як fallback для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було видалено. Використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` натомість або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Конфігурація
є кращою для повторюваних розгортань, оскільки зберігає поведінку plugin у тому самому
перевіреному файлі, що й решта налаштування harness Codex.

## Поширені рецепти

Локальний Codex з типовим транспортом stdio:

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

Перевірка harness лише з Codex, з вимкненим fallback PI:

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

Approvals Codex, перевірювані Guardian:

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

Віддалений app-server з явними headers:

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
до наявного thread Codex, наступний хід знову надсилає до
app-server поточні вибрані OpenClaw модель OpenAI, provider, approval policy, sandbox і service tier.
Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає прив’язку до thread, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Вбудований Plugin реєструє `/codex` як авторизовану slash-команду. Вона
загальна й працює на будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує live-підключення до app-server, моделі, обліковий запис, rate limits, MCP servers і skills.
- `/codex models` показує live-моделі app-server Codex.
- `/codex threads [filter]` показує список недавніх thread-ів Codex.
- `/codex resume <thread-id>` прив’язує поточну сесію OpenClaw до наявного thread Codex.
- `/codex compact` просить app-server Codex виконати compaction для прив’язаного thread.
- `/codex review` запускає native review Codex для прив’язаного thread.
- `/codex account` показує стан облікового запису й rate-limit.
- `/codex mcp` показує стан MCP server app-server Codex.
- `/codex skills` показує skills app-server Codex.

`/codex resume` записує той самий файл прив’язки sidecar, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновить цей thread Codex, передасть
поточну вибрану в OpenClaw модель `codex/*` в app-server і збереже
розширену історію ввімкненою.

Поверхня команд вимагає Codex app-server `0.118.0` або новішого. Окремі
control-методи показуються як `unsupported by this Codex app-server`, якщо
майбутній або custom app-server не відкриває цей JSON-RPC method.

## Tools, media і Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw і далі будує список tools і отримує динамічні результати tools від
harness. Текст, зображення, відео, музика, TTS, approvals і вивід messaging-tool
продовжують проходити звичайним шляхом доставки OpenClaw.

Elicitation approval для інструментів MCP Codex маршрутизується через потік
approval plugin OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші elicitation- і free-form input-запити все ще завершуються в закритий спосіб.

Коли вибрана модель використовує harness Codex, native compaction thread
делегується app-server Codex. OpenClaw зберігає transcript mirror для історії каналів,
пошуку, `/new`, `/reset` і майбутнього перемикання моделей або harness. Mirror
містить prompt користувача, фінальний текст асистента та полегшені записи reasoning або plan від Codex, коли app-server їх генерує. Наразі OpenClaw записує лише сигнали початку й завершення native compaction. Він ще не показує
людинозрозуміле зведення compaction або придатний до аудиту список того, які записи Codex
залишив після compaction.

Генерація медіа не потребує PI. Зображення, відео, музика, PDF, TTS і розуміння медіа
і далі використовують відповідні налаштування provider/model, як-от
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте ref моделі `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не взяв на себе цей запуск,
OpenClaw може використати PI як backend сумісності. Задайте
`embeddedHarness.runtime: "codex"`, щоб примусово вибирати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися з помилкою, коли жоден harness plugin не підходить. Щойно вибрано app-server Codex, його збої показуються напряму без додаткової
конфігурації fallback.

**App-server відхиляється:** оновіть Codex так, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і що віддалений app-server говорить тією самою версією протоколу app-server Codex.

**Non-Codex model використовує PI:** це очікувано. Harness Codex бере на себе
лише refs моделей `codex/*`.

## Пов’язане

- [Agent Harness Plugins](/uk/plugins/sdk-agent-harness)
- [Model Providers](/uk/concepts/model-providers)
- [Configuration Reference](/uk/gateway/configuration-reference)
- [Testing](/uk/help/testing#live-codex-app-server-harness-smoke)
