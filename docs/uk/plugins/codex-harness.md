---
read_when:
    - Ви хочете використовувати вбудовану тестову обв’язку сервера застосунку Codex
    - Вам потрібні приклади конфігурації середовища виконання Codex
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою, а не переходили резервно на Pi
summary: Запускайте ходи вбудованого агента OpenClaw через комплектну обв’язку Codex app-server
title: Середовище Codex
x-i18n:
    generated_at: "2026-04-30T00:30:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

The bundled `codex` plugin lets OpenClaw run embedded agent turns through the
Codex app-server instead of the built-in PI harness.

Use this when you want Codex to own the low-level agent session: model
discovery, native thread resume, native compaction, and app-server execution.
OpenClaw still owns chat channels, session files, model selection, tools,
approvals, media delivery, and the visible transcript mirror.

If you are trying to orient yourself, start with
[Agent runtimes](/uk/concepts/agent-runtimes). The short version is:
`openai/gpt-5.5` is the model ref, `codex` is the runtime, and Telegram,
Discord, Slack, or another channel remains the communication surface.

## What this plugin changes

The bundled `codex` plugin contributes several separate capabilities:

| Capability                        | How you use it                                      | What it does                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native embedded runtime           | `agentRuntime.id: "codex"`                          | Runs OpenClaw embedded agent turns through Codex app-server.                  |
| Native chat-control commands      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Binds and controls Codex app-server threads from a messaging conversation.    |
| Codex app-server provider/catalog | `codex` internals, surfaced through the harness     | Lets the runtime discover and validate app-server models.                     |
| Codex media-understanding path    | `codex/*` image-model compatibility paths           | Runs bounded Codex app-server turns for supported image understanding models. |
| Native hook relay                 | Plugin hooks around Codex-native events             | Lets OpenClaw observe/block supported Codex-native tool/finalization events.  |

Enabling the plugin makes those capabilities available. It does **not**:

- start using Codex for every OpenAI model
- convert `openai-codex/*` model refs into the native runtime
- make ACP/acpx the default Codex path
- hot-switch existing sessions that already recorded a PI runtime
- replace OpenClaw channel delivery, session files, auth-profile storage, or
  message routing

The same plugin also owns the native `/codex` chat-control command surface. If
the plugin is enabled and the user asks to bind, resume, steer, stop, or inspect
Codex threads from chat, agents should prefer `/codex ...` over ACP. ACP remains
the explicit fallback when the user asks for ACP/acpx or is testing the ACP
Codex adapter.

Native Codex turns keep OpenClaw plugin hooks as the public compatibility layer.
These are in-process OpenClaw hooks, not Codex `hooks.json` command hooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` for mirrored transcript records
- `before_agent_finalize` through Codex `Stop` relay
- `agent_end`

Plugins can also register runtime-neutral tool-result middleware to rewrite
OpenClaw dynamic tool results after OpenClaw executes the tool and before the
result is returned to Codex. This is separate from the public
`tool_result_persist` plugin hook, which transforms OpenClaw-owned transcript
tool-result writes.

For the plugin hook semantics themselves, see [Plugin hooks](/uk/plugins/hooks)
and [Plugin guard behavior](/uk/tools/plugin).

The harness is off by default. New configs should keep OpenAI model refs
canonical as `openai/gpt-*` and explicitly force
`agentRuntime.id: "codex"` or `OPENCLAW_AGENT_RUNTIME=codex` when they
want native app-server execution. Legacy `codex/*` model refs still auto-select
the harness for compatibility, but runtime-backed legacy provider prefixes are
not shown as normal model/provider choices.

If the `codex` plugin is enabled but the primary model is still
`openai-codex/*`, `openclaw doctor` warns instead of changing the route. That is
intentional: `openai-codex/*` remains the PI Codex OAuth/subscription path, and
native app-server execution stays an explicit runtime choice.

## Route map

Use this table before changing config:

| Desired behavior                            | Model ref                  | Runtime config                         | Plugin requirement          | Expected status label          |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API through normal OpenClaw runner   | `openai/gpt-*`             | omitted or `runtime: "pi"`             | OpenAI provider             | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/subscription through PI         | `openai-codex/gpt-*`       | omitted or `runtime: "pi"`             | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| Native Codex app-server embedded turns      | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` plugin              | `Runtime: OpenAI Codex`        |
| Mixed providers with conservative auto mode | provider-specific refs     | `agentRuntime.id: "auto"`              | Optional plugin runtimes    | Depends on selected runtime    |
| Explicit Codex ACP adapter session          | ACP prompt/model dependent | `sessions_spawn` with `runtime: "acp"` | healthy `acpx` backend      | ACP task/session status        |

The important split is provider versus runtime:

- `openai-codex/*` answers "which provider/auth route should PI use?"
- `agentRuntime.id: "codex"` answers "which loop should execute this
  embedded turn?"
- `/codex ...` answers "which native Codex conversation should this chat bind
  or control?"
- ACP answers "which external harness process should acpx launch?"

## Pick the right model prefix

OpenAI-family routes are prefix-specific. Use `openai-codex/*` when you want
Codex OAuth through PI; use `openai/*` when you want direct OpenAI API access or
when you are forcing the native Codex app-server harness:

| Model ref                                     | Runtime path                                 | Use when                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI provider through OpenClaw/PI plumbing | You want current direct OpenAI Platform API access with `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth through OpenClaw/PI       | You want ChatGPT/Codex subscription auth with the default PI runner.      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | You want native Codex app-server execution for the embedded agent turn.   |

GPT-5.5 is currently subscription/OAuth-only in OpenClaw. Use
`openai-codex/gpt-5.5` for PI OAuth, or `openai/gpt-5.5` with the Codex
app-server harness. Direct API-key access for `openai/gpt-5.5` is supported
once OpenAI enables GPT-5.5 on the public API.

Legacy `codex/gpt-*` refs remain accepted as compatibility aliases. Doctor
compatibility migration rewrites legacy primary runtime refs to canonical model
refs and records the runtime policy separately, while fallback-only legacy refs
are left unchanged because runtime is configured for the whole agent container.
New PI Codex OAuth configs should use `openai-codex/gpt-*`; new native
app-server harness configs should use `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` follows the same prefix split. Use
`openai-codex/gpt-*` when image understanding should run through the OpenAI
Codex OAuth provider path. Use `codex/gpt-*` when image understanding should run
through a bounded Codex app-server turn. The Codex app-server model must
advertise image input support; text-only Codex models fail before the media turn
starts.

Use `/status` to confirm the effective harness for the current session. If the
selection is surprising, enable debug logging for the `agents/harness` subsystem
and inspect the gateway's structured `agent harness selected` record. It
includes the selected harness id, selection reason, runtime/fallback policy, and,
in `auto` mode, each plugin candidate's support result.

### What doctor warnings mean

`openclaw doctor` warns when all of these are true:

- the bundled `codex` plugin is enabled or allowed
- an agent's primary model is `openai-codex/*`
- that agent's effective runtime is not `codex`

That warning exists because users often expect "Codex plugin enabled" to imply
"native Codex app-server runtime." OpenClaw does not make that leap. The warning
means:

- **No change is required** if you intended ChatGPT/Codex OAuth through PI.
- Change the model to `openai/<model>` and set
  `agentRuntime.id: "codex"` if you intended native app-server
  execution.
- Existing sessions still need `/new` or `/reset` after a runtime change,
  because session runtime pins are sticky.

Harness selection is not a live session control. When an embedded turn runs,
OpenClaw records the selected harness id on that session and keeps using it for
later turns in the same session id. Change `agentRuntime` config or
`OPENCLAW_AGENT_RUNTIME` when you want future sessions to use another harness;
use `/new` or `/reset` to start a fresh session before switching an existing
conversation between PI and Codex. This avoids replaying one transcript through
two incompatible native session systems.

Legacy sessions created before harness pins are treated as PI-pinned once they
have transcript history. Use `/new` or `/reset` to opt that conversation into
Codex after changing config.

`/status` shows the effective model runtime. The default PI harness appears as
`Runtime: OpenClaw Pi Default`, and the Codex app-server harness appears as
`Runtime: OpenAI Codex`.

## Requirements

- OpenClaw with the bundled `codex` plugin available.
- Codex app-server `0.125.0` or newer. The bundled plugin manages a compatible
  Codex app-server binary by default, so local `codex` commands on `PATH` do
  not affect normal harness startup.
- Codex auth available to the app-server process or to OpenClaw's Codex auth
  bridge.

The plugin blocks older or unversioned app-server handshakes. That keeps
OpenClaw on the protocol surface it has been tested against.

For live and Docker smoke tests, auth usually comes from the Codex CLI account
or an OpenClaw `openai-codex` auth profile. Local stdio app-server launches can
also fall back to `CODEX_API_KEY` / `OPENAI_API_KEY` when no account is present.

## Minimal config

Use `openai/gpt-5.5`, enable the bundled plugin, and force the `codex` harness:

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

If your config uses `plugins.allow`, include `codex` there too:

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

Legacy configs that set `agents.defaults.model` or an agent model to
`codex/<model>` still auto-enable the bundled `codex` plugin. New configs should
prefer `openai/<model>` plus the explicit `agentRuntime` entry above.

## Add Codex alongside other models

Do not set `agentRuntime.id: "codex"` globally if the same agent should freely switch
between Codex and non-Codex provider models. A forced runtime applies to every
embedded turn for that agent or session. If you select an Anthropic model while
that runtime is forced, OpenClaw still tries the Codex harness and fails closed
instead of silently routing that turn through PI.

Натомість використовуйте одну з цих форм:

- Розмістіть Codex на виділеному агенті з `agentRuntime.id: "codex"`.
- Залиште типового агента на `agentRuntime.id: "auto"` і fallback PI для звичайного змішаного
  використання провайдерів.
- Використовуйте застарілі посилання `codex/*` лише для сумісності. Нові конфігурації мають віддавати перевагу
  `openai/*` плюс явній політиці середовища виконання Codex.

Наприклад, це залишає типового агента на звичайному автоматичному виборі та
додає окремого агента Codex:

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
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

З цією формою:

- Типовий агент `main` використовує звичайний шлях провайдера та fallback сумісності PI.
- Агент `codex` використовує обв’язку app-server Codex.
- Якщо Codex відсутній або не підтримується для агента `codex`, хід завершується помилкою
  замість непомітного використання PI.

## Маршрутизація команд агента

Агенти мають маршрутизувати запити користувача за наміром, а не лише за словом "Codex":

| Користувач просить...                                  | Агент має використати...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Прив’язати цей чат до Codex"                            | `/codex bind`                                    |
| "Відновити потік Codex `<id>` тут"                       | `/codex resume <id>`                             |
| "Показати потоки Codex"                                  | `/codex threads`                                 |
| "Подати звіт до підтримки про невдалий запуск Codex"     | `/diagnostics [note]`                            |
| "Надіслати відгук Codex лише для цього прикріпленого потоку" | `/codex diagnostics [note]`                      |
| "Використати Codex як середовище виконання для цього агента" | зміна конфігурації `agentRuntime.id`             |
| "Використати мою підписку ChatGPT/Codex зі звичайним OpenClaw" | посилання на моделі `openai-codex/*`             |
| "Запустити Codex через ACP/acpx"                         | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Запустити Claude Code/Gemini/OpenCode/Cursor у потоці"  | ACP/acpx, не `/codex` і не нативні під-агенти    |

OpenClaw рекламує агентам настанови зі створення ACP лише тоді, коли ACP увімкнено,
доступний для диспетчеризації та підтримується завантаженим runtime-бекендом. Якщо ACP недоступний,
системний prompt і Skills Plugin не мають навчати агента маршрутизації
ACP.

## Розгортання лише з Codex

Примусово використовуйте обв’язку Codex, коли потрібно довести, що кожен вбудований хід агента
використовує Codex. Явні середовища виконання Plugin типово не мають fallback PI, тому
`fallback: "none"` необов’язковий, але часто корисний як документація:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Перевизначення через середовище:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Коли Codex примусово ввімкнено, OpenClaw завершується рано, якщо Plugin Codex вимкнено,
app-server надто старий або app-server не може запуститися. Установлюйте
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` лише якщо ви навмисно хочете, щоб PI обробляв
відсутній вибір обв’язки.

## Codex для окремого агента

Можна зробити одного агента лише для Codex, тоді як типовий агент зберігає звичайний
автовибір:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Використовуйте звичайні команди сесії, щоб перемикати агентів і моделі. `/new` створює нову
сесію OpenClaw, а обв’язка Codex створює або відновлює свій допоміжний потік app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього потоку
і дозволяє наступному ходу знову визначити обв’язку з поточної конфігурації.

## Виявлення моделей

Типово Plugin Codex запитує app-server про доступні моделі. Якщо
виявлення завершується помилкою або таймаутом, використовується вбудований fallback-каталог для:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Можна налаштувати виявлення в `plugins.entries.codex.config.discovery`:

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

Вимкніть виявлення, якщо хочете, щоб запуск не опитував Codex і використовував
fallback-каталог:

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

Типово Plugin запускає керований бінарний файл Codex OpenClaw локально з:

```bash
codex app-server --listen stdio://
```

Керований бінарний файл оголошено як bundled runtime dependency Plugin і підготовлено
разом з рештою залежностей Plugin `codex`. Це прив’язує версію app-server
до bundled Plugin, а не до окремого Codex CLI, який випадково
встановлено локально. Установлюйте `appServer.command` лише тоді, коли ви
навмисно хочете запустити інший виконуваний файл.

Типово OpenClaw запускає локальні сесії обв’язки Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це довірена позиція локального оператора, яку використовують
для автономних Heartbeat: Codex може використовувати інструменти shell і мережі без
зупинки на нативних prompt затвердження, на які нікому відповісти.

Щоб увімкнути затвердження Codex з перевіркою guardian, установіть `appServer.mode:
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

Режим Guardian використовує нативний шлях автоматично перевірених затверджень Codex. Коли Codex просить
вийти з пісочниці, записати поза робочою областю або додати дозволи, наприклад мережевий
доступ, Codex маршрутизує цей запит на затвердження нативному рев’юеру замість
людського prompt. Рев’юер застосовує модель оцінки ризиків Codex і схвалює або відхиляє
конкретний запит. Використовуйте Guardian, коли потрібні сильніші запобіжники, ніж режим YOLO,
але все ще потрібно, щоб автоматичні агенти просувалися без нагляду.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` і `sandbox: "workspace-write"`.
Окремі поля політики все ще перевизначають `mode`, тому просунуті розгортання можуть поєднувати
пресет з явними виборами. Старіше значення рев’юера `guardian_subagent`
досі приймається як псевдонім сумісності, але нові конфігурації мають використовувати
`auto_review`.

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

Запуски stdio app-server типово успадковують середовище процесу OpenClaw,
але OpenClaw керує містком облікового запису app-server Codex. Автентифікація вибирається в такому
порядку:

1. Явний профіль автентифікації OpenClaw Codex для агента.
2. Наявний обліковий запис app-server, наприклад локальний вхід ChatGPT у Codex CLI.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли облікового запису app-server немає, а автентифікація OpenAI
   все ще потрібна.

Коли OpenClaw бачить профіль автентифікації Codex у стилі підписки ChatGPT, він вилучає
`CODEX_API_KEY` і `OPENAI_API_KEY` з породженого дочірнього процесу Codex. Це
залишає API-ключі рівня Gateway доступними для embeddings або прямих моделей OpenAI
і водночас не дає нативним ходам app-server Codex випадково тарифікуватися через API.
Явні профілі API-ключа Codex і fallback локального stdio env-key використовують логін app-server
замість успадкованого середовища дочірнього процесу. Підключення WebSocket app-server
не отримують fallback API-ключа середовища Gateway; використовуйте явний профіль автентифікації або
власний обліковий запис віддаленого app-server.

Якщо розгортанню потрібна додаткова ізоляція середовища, додайте ці змінні до
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` впливає лише на породжений дочірній процес app-server Codex.

Підтримувані поля `appServer`:

| Поле                | Типове значення                         | Значення                                                                                                                            |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                                                     |
| `command`           | керований бінарний файл Codex            | Виконуваний файл для stdio-транспорту. Залиште незаданим, щоб використовувати керований бінарний файл; задавайте лише для явного перевизначення. |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для stdio-транспорту.                                                                                                     |
| `url`               | не задано                                | URL WebSocket app-server.                                                                                                           |
| `authToken`         | не задано                                | Bearer-токен для WebSocket-транспорту.                                                                                              |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                                                      |
| `clearEnv`          | `[]`                                     | Додаткові назви змінних середовища, які видаляються зі створеного процесу stdio app-server після того, як OpenClaw сформує успадковане середовище. |
| `requestTimeoutMs`  | `60000`                                  | Тайм-аут для викликів площини керування app-server.                                                                                 |
| `mode`              | `"yolo"`                                 | Пресет для виконання YOLO або виконання з перевіркою guardian.                                                                      |
| `approvalPolicy`    | `"never"`                                | Нативна політика схвалення Codex, яку надсилають під час start/resume/turn потоку.                                                   |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, який надсилають під час start/resume потоку.                                                          |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"auto_review"`, щоб дозволити Codex перевіряти нативні запити на схвалення. `guardian_subagent` залишається застарілим псевдонімом. |
| `serviceTier`       | не задано                                | Необов’язковий рівень сервісу Codex app-server: `"fast"`, `"flex"` або `null`. Недійсні застарілі значення ігноруються.             |

Динамічні виклики інструментів, що належать OpenClaw, обмежуються незалежно від
`appServer.requestTimeoutMs`: кожен запит Codex `item/tool/call` має отримати
відповідь OpenClaw протягом 30 секунд. У разі тайм-ауту OpenClaw перериває
сигнал інструмента там, де це підтримується, і повертає Codex невдалу відповідь
динамічного інструмента, щоб turn міг продовжитися замість того, щоб залишати
сесію в `processing`.

Після того як OpenClaw відповідає на запит app-server у межах turn Codex,
harness також очікує, що Codex завершить нативний turn через `turn/completed`. Якщо
app-server замовкає на 60 секунд після цієї відповіді, OpenClaw докладає
максимальних зусиль, щоб перервати turn Codex, записує діагностичний тайм-аут і
звільняє lane сесії OpenClaw, щоб наступні повідомлення чату не ставали в чергу
за застарілим нативним turn.

Перевизначення середовища залишаються доступними для локального тестування:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` обходить керований бінарний файл, коли
`appServer.command` не задано.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для одноразового локального тестування. Config
бажаніший для повторюваних розгортань, оскільки зберігає поведінку plugin у тому
самому перевіреному файлі, що й решту налаштувань harness Codex.

## Використання комп’ютера

Computer Use описано в окремому посібнику з налаштування:
[Codex Computer Use](/uk/plugins/codex-computer-use).

Коротко: OpenClaw не постачає desktop-control app у складі пакета і не виконує
дії на робочому столі самостійно. Він готує Codex app-server, перевіряє, що MCP
server `computer-use` доступний, а потім дозволяє Codex обробляти нативні
виклики інструментів MCP під час turn у режимі Codex.

Для прямого доступу до драйвера TryCua поза потоком marketplace Codex зареєструйте
`cua-driver mcp` за допомогою `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Див. [Codex Computer Use](/uk/plugins/codex-computer-use), щоб зрозуміти різницю
між Computer Use, що належить Codex, і прямою реєстрацією MCP.

Мінімальна config:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Налаштування можна перевірити або встановити з командної поверхні:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use є специфічним для macOS і може вимагати локальних дозволів ОС,
перш ніж MCP server Codex зможе керувати apps. Якщо `computerUse.enabled` має
значення true, а MCP server недоступний, turn у режимі Codex завершується з
помилкою до запуску потоку замість того, щоб непомітно працювати без нативних
інструментів Computer Use. Див. [Codex Computer Use](/uk/plugins/codex-computer-use)
про варіанти marketplace, обмеження віддаленого catalog, причини status і
усунення несправностей.

Коли `computerUse.autoInstall` має значення true, OpenClaw може зареєструвати
стандартний bundled Codex Desktop marketplace з
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, якщо Codex
ще не виявив локальний marketplace. Використовуйте `/new` або `/reset` після
зміни runtime або config Computer Use, щоб наявні сесії не зберігали старе
прив’язування PI або потоку Codex.

## Поширені рецепти

Локальний Codex із типовим stdio-транспортом:

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

Перевірка harness лише для Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
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

Схвалення Codex із перевіркою guardian:

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
            approvalsReviewer: "auto_review",
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

Перемикання моделі залишається під контролем OpenClaw. Коли сесія OpenClaw
приєднана до наявного потоку Codex, наступний turn знову надсилає до app-server
поточну вибрану модель OpenAI, provider, політику схвалення, sandbox і рівень
сервісу. Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає
прив’язування потоку, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Bundled plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною і працює в будь-якому channel, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує живе підключення app-server, моделі, account, rate limits, MCP servers і skills.
- `/codex models` перелічує живі моделі Codex app-server.
- `/codex threads [filter]` перелічує нещодавні потоки Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить Codex app-server стиснути приєднаний потік.
- `/codex review` запускає нативний review Codex для приєднаного потоку.
- `/codex diagnostics [note]` запитує перед надсиланням діагностичного feedback Codex для приєднаного потоку.
- `/codex computer-use status` перевіряє налаштований plugin Computer Use і MCP server.
- `/codex computer-use install` встановлює налаштований plugin Computer Use і перезавантажує MCP servers.
- `/codex account` показує стан account і rate-limit.
- `/codex mcp` перелічує стан MCP server Codex app-server.
- `/codex skills` перелічує skills Codex app-server.

### Поширений робочий процес налагодження

Коли агент на базі Codex робить щось неочікуване в Telegram, Discord, Slack
або іншому channel, почніть із розмови, де сталася проблема:

1. Запустіть `/diagnostics bad tool choice after image upload` або іншу коротку нотатку,
   що описує побачене.
2. Один раз схваліть діагностичний запит. Схвалення створює локальний
   diagnostics zip Gateway і, оскільки сесія використовує harness Codex, також
   надсилає відповідний feedback bundle Codex на сервери OpenAI.
3. Скопіюйте завершену діагностичну відповідь у bug report або support thread.
   Вона містить шлях до локального bundle, зведення privacy, ідентифікатори
   сесії OpenClaw, ідентифікатори потоку Codex і рядок `Inspect locally` для
   кожного потоку Codex.
4. Якщо хочете самостійно налагодити запуск, виконайте надруковану команду
   `Inspect locally` у терміналі. Вона виглядає як `codex resume <thread-id>` і
   відкриває нативний потік Codex, щоб ви могли переглянути розмову, продовжити
   її локально або запитати Codex, чому він вибрав певний інструмент чи план.

Використовуйте `/codex diagnostics [note]` лише тоді, коли вам конкретно потрібне
завантаження feedback Codex для поточного приєднаного потоку без повного
діагностичного bundle OpenClaw Gateway. Для більшості support reports
`/diagnostics [note]` є кращою відправною точкою, бо пов’язує локальний стан
Gateway та ідентифікатори потоку Codex в одній відповіді. Див.
[Diagnostics export](/uk/gateway/diagnostics) щодо повної моделі privacy і
поведінки group-chat.

Core OpenClaw також надає owner-only `/diagnostics [note]` як загальну команду
діагностики Gateway. Її запит на схвалення показує преамбулу про sensitive-data,
посилання на [Diagnostics Export](/uk/gateway/diagnostics) і щоразу запитує
`openclaw gateway diagnostics export --json` через явне exec-схвалення. Не
схвалюйте diagnostics за правилом allow-all. Після схвалення OpenClaw надсилає
звіт, придатний для вставлення, зі шляхом до локального bundle і зведенням
manifest. Коли активна сесія OpenClaw використовує harness Codex, те саме
схвалення також авторизує надсилання відповідних feedback bundles Codex на
сервери OpenAI. У запиті на схвалення сказано, що feedback Codex буде надіслано,
але до схвалення він не перелічує ідентифікатори сесії або потоку Codex.

Якщо `/diagnostics` викликає owner у group chat, OpenClaw зберігає shared channel
чистим: group отримує лише коротке повідомлення, тоді як преамбула diagnostics,
запити на схвалення та ідентифікатори сесії/потоку Codex надсилаються owner
через приватний маршрут схвалення. Якщо приватного маршруту owner немає,
OpenClaw відхиляє запит group і просить owner запустити його з DM.

Схвалений виклик завантаження Codex викликає `feedback/upload` Codex app-server і просить
app-server включити журнали для кожного вказаного потоку та породжених підпотоків Codex,
коли вони доступні. Завантаження проходить звичайним шляхом зворотного зв’язку Codex до серверів OpenAI;
якщо зворотний зв’язок Codex вимкнено в цьому app-server, команда повертає
помилку app-server. Завершена відповідь діагностики перелічує канали,
ідентифікатори сесій OpenClaw, ідентифікатори потоків Codex і локальні команди
`codex resume <thread-id>` для потоків, які було надіслано. Якщо ви відхилите або проігноруєте схвалення,
OpenClaw не виведе ці ідентифікатори Codex. Це завантаження не замінює локальний
експорт діагностики Gateway.

`/codex resume` записує той самий допоміжний файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw в app-server і залишає розширену історію
увімкненою.

### Перевірка потоку Codex із CLI

Найшвидший спосіб зрозуміти невдалий запуск Codex часто полягає в тому, щоб відкрити нативний потік Codex
безпосередньо:

```sh
codex resume <thread-id>
```

Використовуйте це, коли помічаєте помилку в розмові каналу й хочете перевірити
проблемну сесію Codex, продовжити її локально або запитати Codex, чому він зробив
певний вибір інструмента чи міркування. Найпростіший шлях зазвичай полягає в тому, щоб спершу виконати
`/diagnostics [note]`: після вашого схвалення завершений звіт перелічує
кожен потік Codex і друкує команду `Inspect locally`, наприклад
`codex resume <thread-id>`. Ви можете скопіювати цю команду безпосередньо в термінал.

Ви також можете отримати ідентифікатор потоку з `/codex binding` для поточного чату або
`/codex threads [filter]` для нещодавніх потоків Codex app-server, а потім виконати ту саму
команду `codex resume` у своїй оболонці.

Поверхня команд потребує Codex app-server `0.125.0` або новішого. Окремі
методи керування повідомляються як `unsupported by this Codex app-server`, якщо
майбутній або користувацький app-server не надає цей метод JSON-RPC.

## Межі хуків

Codex harness має три шари хуків:

| Шар                                  | Власник                  | Призначення                                                        |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------ |
| Хуки Plugin OpenClaw                 | OpenClaw                 | Сумісність продукту/Plugin між PI та Codex harness.                |
| Middleware розширення Codex app-server | Комплектні plugins OpenClaw | Поведінка адаптера для кожного ходу навколо динамічних інструментів OpenClaw. |
| Нативні хуки Codex                   | Codex                    | Низькорівневий життєвий цикл Codex і нативна політика інструментів із конфігурації Codex. |

OpenClaw не використовує проєктні або глобальні файли Codex `hooks.json` для маршрутизації
поведінки Plugin OpenClaw. Для підтримуваного мосту нативних інструментів і дозволів
OpenClaw впроваджує конфігурацію Codex для кожного потоку для `PreToolUse`, `PostToolUse`,
`PermissionRequest` і `Stop`. Інші хуки Codex, як-от `SessionStart` і
`UserPromptSubmit`, залишаються засобами керування рівня Codex; вони не відкриті як
хуки Plugin OpenClaw у контракті v1.

Для динамічних інструментів OpenClaw OpenClaw виконує інструмент після того, як Codex запитує
виклик, тому OpenClaw запускає поведінку Plugin і middleware, якою він володіє, в
адаптері harness. Для нативних інструментів Codex канонічним записом інструмента володіє Codex.
OpenClaw може дзеркалити вибрані події, але не може переписати нативний потік Codex,
якщо Codex не відкриває цю операцію через app-server або нативні callback-и хуків.

Проєкції Compaction і життєвого циклу LLM надходять із повідомлень Codex app-server
і стану адаптера OpenClaw, а не з нативних команд хуків Codex.
Події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` є спостереженнями рівня адаптера, а не побайтовими знімками
внутрішнього запиту Codex або payload-ів Compaction.

Нативні повідомлення Codex app-server `hook/started` і `hook/completed`
проєктуються як події агента `codex_app_server.hook` для траєкторії та налагодження.
Вони не викликають хуки Plugin OpenClaw.

## Контракт підтримки V1

Режим Codex не є PI з іншим викликом моделі під ним. Codex володіє більшою частиною
нативного циклу моделі, а OpenClaw адаптує свої поверхні Plugin і сесій
навколо цієї межі.

Підтримується в Codex runtime v1:

| Поверхня                                      | Підтримка                               | Чому                                                                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Цикл моделі OpenAI через Codex               | Підтримується                           | Codex app-server володіє ходом OpenAI, відновленням нативного потоку та продовженням нативного інструмента.                                                                                          |
| Маршрутизація та доставка каналів OpenClaw   | Підтримується                           | Telegram, Discord, Slack, WhatsApp, iMessage та інші канали залишаються поза runtime моделі.                                                                                                         |
| Динамічні інструменти OpenClaw               | Підтримується                           | Codex просить OpenClaw виконувати ці інструменти, тому OpenClaw залишається в шляху виконання.                                                                                                       |
| Plugins промптів і контексту                 | Підтримується                           | OpenClaw створює накладення промптів і проєктує контекст у хід Codex перед запуском або відновленням потоку.                                                                                         |
| Життєвий цикл рушія контексту                | Підтримується                           | Збирання, ingest або обслуговування після ходу, а також координація Compaction рушія контексту виконуються для ходів Codex.                                                                          |
| Хуки динамічних інструментів                 | Підтримується                           | `before_tool_call`, `after_tool_call` і middleware результатів інструментів виконуються навколо динамічних інструментів, якими володіє OpenClaw.                                                      |
| Хуки життєвого циклу                         | Підтримується як спостереження адаптера | `llm_input`, `llm_output`, `agent_end`, `before_compaction` і `after_compaction` спрацьовують із чесними payload-ами режиму Codex.                                                                    |
| Шлюз перегляду фінальної відповіді           | Підтримується через ретранслятор нативних хуків | Codex `Stop` ретранслюється до `before_agent_finalize`; `revise` просить Codex зробити ще один прохід моделі перед фіналізацією.                                                                      |
| Блокування або спостереження нативних shell, patch і MCP | Підтримується через ретранслятор нативних хуків | Codex `PreToolUse` і `PostToolUse` ретранслюються для зафіксованих поверхонь нативних інструментів, включно з payload-ами MCP у Codex app-server `0.125.0` або новішому. Блокування підтримується; переписування аргументів — ні. |
| Нативна політика дозволів                    | Підтримується через ретранслятор нативних хуків | Codex `PermissionRequest` може маршрутизуватися через політику OpenClaw там, де runtime це відкриває. Якщо OpenClaw не повертає рішення, Codex продовжує через свій звичайний guardian або шлях схвалення користувача. |
| Захоплення траєкторії app-server             | Підтримується                           | OpenClaw записує запит, який він надіслав до app-server, і повідомлення app-server, які він отримує.                                                                                                  |

Не підтримується в Codex runtime v1:

| Поверхня                                             | Межа V1                                                                                                                                        | Майбутній шлях                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Мутація аргументів нативного інструмента             | Нативні pre-tool хуки Codex можуть блокувати, але OpenClaw не переписує аргументи нативних інструментів Codex.                                | Потребує підтримки хуків/схеми Codex для заміни вхідних даних інструмента.                 |
| Редагована історія нативного transcript Codex        | Codex володіє канонічною історією нативного потоку. OpenClaw володіє дзеркалом і може проєктувати майбутній контекст, але не має мутувати непідтримувані внутрішні структури. | Додати явні API Codex app-server, якщо потрібна хірургія нативного потоку.                 |
| `tool_result_persist` для записів нативних інструментів Codex | Цей хук перетворює записи transcript, якими володіє OpenClaw, а не записи нативних інструментів Codex.                                       | Можна дзеркалити перетворені записи, але канонічне переписування потребує підтримки Codex. |
| Багаті нативні метадані Compaction                   | OpenClaw спостерігає початок і завершення Compaction, але не отримує стабільного списку збереженого/відкинутого, token delta або payload підсумку. | Потребує багатших подій Compaction Codex.                                                   |
| Втручання в Compaction                               | Поточні хуки Compaction OpenClaw у режимі Codex мають рівень повідомлень.                                                                      | Додати pre/post хуки Compaction Codex, якщо plugins потребують накладати вето або переписувати нативну Compaction. |
| Побайтове захоплення запиту API моделі               | OpenClaw може захоплювати запити й повідомлення app-server, але ядро Codex внутрішньо створює фінальний запит OpenAI API.                    | Потребує події трасування запиту моделі Codex або debug API.                               |

## Інструменти, медіа та Compaction

Codex harness змінює лише низькорівневий вбудований виконавець агента.

OpenClaw, як і раніше, створює список інструментів і отримує результати динамічних інструментів від
harness. Текст, зображення, відео, музика, TTS, схвалення та вивід інструментів обміну повідомленнями
продовжують проходити звичайним шляхом доставки OpenClaw.

Ретранслятор нативних хуків навмисно є загальним, але контракт підтримки v1
обмежений шляхами нативних інструментів і дозволів Codex, які тестує OpenClaw. У
runtime Codex це включає payload-и shell, patch і MCP `PreToolUse`,
`PostToolUse` та `PermissionRequest`. Не припускайте, що кожна майбутня
подія хуків Codex є поверхнею Plugin OpenClaw, доки runtime contract не назве
її.

Для `PermissionRequest` OpenClaw повертає явні рішення allow або deny лише
коли політика ухвалює рішення. Результат без рішення не є allow. Codex трактує його як відсутність
рішення хуку й переходить до свого власного guardian або шляху схвалення користувача.

Запити схвалення інструментів Codex MCP маршрутизуються через потік схвалення Plugin
OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`. Промпти Codex `request_user_input` надсилаються назад до
початкового чату, а наступне повідомлення в черзі відповідає на цей нативний
запит сервера замість того, щоб скеровуватися як додатковий контекст. Інші запити elicitation
MCP все ще завершуються закритою відмовою.

Керування чергою активного запуску відображається на `turn/steer` app-server Codex. Зі стандартним `messages.queue.mode: "steer"` OpenClaw групує поставлені в чергу повідомлення чату протягом налаштованого вікна тиші та надсилає їх як один запит `turn/steer` у порядку надходження. Застарілий режим `queue` надсилає окремі запити `turn/steer`. Перегляд Codex і ручні ходи Compaction можуть відхиляти керування в межах того самого ходу; у такому разі OpenClaw використовує чергу подальших дій, коли вибраний режим дозволяє резервний варіант. Див. [Черга керування](/uk/concepts/queue-steering).

Коли вибрана модель використовує обв’язку Codex, нативна Compaction потоку делегується app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналів, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або обв’язки. Дзеркало містить запит користувача, фінальний текст асистента та легкі записи міркувань або плану Codex, коли app-server їх видає. Наразі OpenClaw записує лише сигнали початку та завершення нативної Compaction. Він поки не надає людиночитного підсумку Compaction або придатного для аудиту списку записів, які Codex зберіг після Compaction.

Оскільки Codex володіє канонічним нативним потоком, `tool_result_persist` наразі не переписує нативні для Codex записи результатів інструментів. Він застосовується лише тоді, коли OpenClaw записує результат інструмента транскрипту сесії, що належить OpenClaw.

Генерація медіа не потребує PI. Зображення, відео, музика, PDF, TTS і розуміння медіа й надалі використовують відповідні налаштування провайдера/моделі, як-от `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і `messages.tts`.

## Усунення несправностей

**Codex не відображається як звичайний провайдер `/model`:** це очікувано для нових конфігурацій. Виберіть модель `openai/gpt-*` з `agentRuntime.id: "codex"` (або застаріле посилання `codex/*`), увімкніть `plugins.entries.codex.enabled` і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** `agentRuntime.id: "auto"` все ще може використовувати PI як сумісний бекенд, коли жодна обв’язка Codex не бере запуск на себе. Установіть `agentRuntime.id: "codex"`, щоб примусово вибрати Codex під час тестування. Примусовий runtime Codex тепер завершується помилкою замість переходу на PI, якщо ви явно не встановите `agentRuntime.fallback: "pi"`. Після вибору app-server Codex його збої відображаються напряму без додаткової конфігурації резервного варіанта.

**app-server відхиляється:** оновіть Codex, щоб рукостискання app-server повідомляло версію `0.125.0` або новішу. Передрелізи тієї самої версії або версії із суфіксом збірки, як-от `0.125.0-alpha.2` чи `0.125.0+custom`, відхиляються, тому що OpenClaw тестує саме стабільний мінімальний рівень протоколу `0.125.0`.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs` або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken` і те, що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Модель не Codex використовує PI:** це очікувано, якщо ви не примусили `agentRuntime.id: "codex"` для цього агента або не вибрали застаріле посилання `codex/*`. Звичайні `openai/gpt-*` та інші посилання провайдерів залишаються на своєму нормальному шляху провайдера в режимі `auto`. Якщо ви примусово встановите `agentRuntime.id: "codex"`, кожен вбудований хід для цього агента має бути підтримуваною Codex моделлю OpenAI.

**Computer Use встановлено, але інструменти не запускаються:** перевірте `/codex computer-use status` із нової сесії. Якщо інструмент повідомляє `Native hook relay unavailable`, використайте `/new` або `/reset`; якщо проблема не зникає, перезапустіть Gateway, щоб очистити застарілі реєстрації нативних хуків. Якщо `computer-use.list_apps` завершується за тайм-аутом, перезапустіть Codex Computer Use або Codex Desktop і повторіть спробу.

## Пов’язане

- [Plugin-и обв’язки агентів](/uk/plugins/sdk-agent-harness)
- [Runtime-и агентів](/uk/concepts/agent-runtimes)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Провайдер OpenAI](/uk/providers/openai)
- [Статус](/uk/cli/status)
- [Хуки Plugin](/uk/plugins/hooks)
- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
