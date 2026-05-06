---
read_when:
    - Ви хочете використати вбудовану обв’язку app-server Codex
    - Вам потрібні приклади конфігурації середовища запуску Codex
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою, а не поверталися до PI
summary: Запускайте ходи вбудованого агента OpenClaw через комплектну обв’язку app-server Codex
title: Обв’язка Codex
x-i18n:
    generated_at: "2026-05-06T08:14:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

Комплектний Plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агента через сервер застосунку Codex замість вбудованої обв’язки PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням моделей, нативним відновленням потоків, нативним ущільненням і виконанням на сервері застосунку. OpenClaw і далі відповідає за канали чату, файли сесій, вибір моделі, інструменти, схвалення, доставлення медіа та видиме дзеркало транскрипту.

Коли хід із вихідного чату виконується через обв’язку Codex, видимі відповіді за замовчуванням надсилаються через інструмент OpenClaw `message`, якщо розгортання явно не налаштувало `messages.visibleReplies`. Агент усе ще може приватно завершити свій хід Codex; він публікує в канал лише тоді, коли викликає `message(action="send")`. Установіть `messages.visibleReplies: "automatic"`, щоб зберегти фінальні відповіді в прямому чаті на застарілому автоматичному шляху доставлення.

Ходи Heartbeat у Codex також за замовчуванням отримують інструмент `heartbeat_respond`, тож агент може зафіксувати, чи пробудження має залишитися тихим або надіслати сповіщення, не кодувавши цей потік керування у фінальному тексті.

Специфічні для Heartbeat настанови щодо ініціативи надсилаються як інструкція розробника в режимі співпраці Codex на самому ході Heartbeat. Звичайні ходи чату відновлюють режим Codex Default замість того, щоб переносити філософію Heartbeat у свій звичайний runtime-промпт.

Якщо ви намагаєтеся зорієнтуватися, почніть із
[Runtime-и агентів](/uk/concepts/agent-runtimes). Коротко:
`openai/gpt-5.5` — це посилання на модель, `codex` — runtime, а Telegram,
Discord, Slack або інший канал лишається поверхнею комунікації.

## Швидка конфігурація

Більшість користувачів, яким потрібен "Codex в OpenClaw", хочуть саме цей маршрут: увійти з підпискою ChatGPT/Codex, а потім запускати вбудовані ходи агента через нативний runtime сервера застосунку Codex. Посилання на модель усе одно лишається канонічним у форматі
`openai/gpt-*`; автентифікація підписки береться з облікового запису/профілю Codex, а не з префікса моделі `openai-codex/*`.

Спершу увійдіть через Codex OAuth, якщо ще цього не зробили:

```bash
openclaw models auth login --provider openai-codex
```

Потім увімкніть комплектний Plugin `codex` і примусово задайте runtime Codex:

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

Якщо ваша конфігурація використовує `plugins.allow`, додайте туди також `codex`:

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

Не використовуйте `openai-codex/gpt-*` у конфігурації. Цей префікс є застарілим маршрутом, який
`openclaw doctor --fix` переписує на `openai/gpt-*` для основних моделей, резервних моделей, перевизначень Heartbeat/субагентів/Compaction, хуків, перевизначень каналів і застарілих закріплень маршруту в збережених сесіях.

## Що змінює цей Plugin

Комплектний Plugin `codex` додає кілька окремих можливостей:

| Можливість                       | Як її використовувати                              | Що вона робить                                                               |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Нативний вбудований runtime       | `agentRuntime.id: "codex"`                          | Запускає вбудовані ходи агента OpenClaw через сервер застосунку Codex.       |
| Нативні команди керування чатом   | `/codex bind`, `/codex resume`, `/codex steer`, ... | Прив’язує потоки сервера застосунку Codex до розмови в месенджері та керує ними. |
| Провайдер/каталог сервера застосунку Codex | внутрішні компоненти `codex`, доступні через обв’язку | Дає runtime змогу виявляти й перевіряти моделі сервера застосунку.           |
| Шлях розуміння медіа Codex        | шляхи сумісності моделей зображень `codex/*`        | Запускає обмежені ходи сервера застосунку Codex для підтримуваних моделей розуміння зображень. |
| Нативна ретрансляція хуків        | хуки Plugin навколо нативних подій Codex            | Дає OpenClaw змогу спостерігати за підтримуваними нативними подіями інструментів/фіналізації Codex або блокувати їх. |

Увімкнення Plugin робить ці можливості доступними. Воно **не**:

- починає використовувати Codex для кожної моделі OpenAI
- перетворює посилання на моделі `openai-codex/*` на нативний runtime без того, щоб doctor
  перевірив, що Codex інстальовано, увімкнено, що він додає обв’язку `codex`
  і готовий до OAuth
- робить ACP/acpx стандартним шляхом Codex
- гаряче перемикає наявні сесії, які вже записали runtime PI
- замінює доставлення каналами OpenClaw, файли сесій, сховище auth-профілів або
  маршрутизацію повідомлень

Цей самий Plugin також відповідає за нативну поверхню команд керування чатом `/codex`. Якщо Plugin увімкнено й користувач просить прив’язати, відновити, спрямувати, зупинити або переглянути потоки Codex із чату, агенти мають віддавати перевагу `/codex ...` замість ACP. ACP лишається явним запасним варіантом, коли користувач просить ACP/acpx або тестує адаптер ACP Codex.

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

If any configured model route is still `openai-codex/*`, `openclaw doctor --fix`
rewrites it to `openai/*`. For matching agent routes, it sets the agent runtime
to `codex` only when the Codex plugin is installed, enabled, contributes the
`codex` harness, and has usable OAuth; otherwise it sets the runtime to `pi`.

## Route map

Use this table before changing config:

| Desired behavior                                     | Model ref                  | Runtime config                         | Auth/profile route           | Expected status label          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| ChatGPT/Codex subscription with native Codex runtime | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth or Codex account | `Runtime: OpenAI Codex`        |
| OpenAI API through normal OpenClaw runner            | `openai/gpt-*`             | omitted or `runtime: "pi"`             | OpenAI API key               | `Runtime: OpenClaw Pi Default` |
| Legacy config that needs doctor repair               | `openai-codex/gpt-*`       | repaired to `codex` or `pi`            | Existing configured auth     | Recheck after `doctor --fix`   |
| Mixed providers with conservative auto mode          | provider-specific refs     | `agentRuntime.id: "auto"`              | Per selected provider        | Depends on selected runtime    |
| Explicit Codex ACP adapter session                   | ACP prompt/model dependent | `sessions_spawn` with `runtime: "acp"` | ACP backend auth             | ACP task/session status        |

The important split is provider versus runtime:

- `openai-codex/*` is a legacy route that doctor rewrites.
- `agentRuntime.id: "codex"` requires the Codex harness and fails closed if it
  is unavailable.
- `agentRuntime.id: "auto"` lets registered harnesses claim matching provider
  routes, but canonical OpenAI refs are still PI-owned unless a harness supports
  that provider/model pair.
- `/codex ...` answers "which native Codex conversation should this chat bind
  or control?"
- ACP answers "which external harness process should acpx launch?"

## Pick the right model prefix

OpenAI-family routes are prefix-specific. For the common subscription plus
native Codex runtime setup, use `openai/*` with `agentRuntime.id: "codex"`.
Treat `openai-codex/*` as legacy config that doctor should rewrite:

| Model ref                                     | Runtime path                                 | Use when                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI provider through OpenClaw/PI plumbing | You want current direct OpenAI Platform API access with `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | Legacy route repaired by doctor              | You are on old config; run `openclaw doctor --fix` to rewrite it.         |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | You want ChatGPT/Codex subscription auth with native Codex execution.     |

GPT-5.5 can appear on both direct OpenAI API-key and Codex subscription routes
when your account exposes them. Use `openai/gpt-5.5` with the Codex app-server
harness for native Codex runtime, or `openai/gpt-5.5` without a Codex runtime
override for direct API-key traffic.

Legacy `codex/gpt-*` refs remain accepted as compatibility aliases. Doctor
compatibility migration rewrites legacy runtime refs to canonical model refs
and records the runtime policy separately. New native app-server harness configs
should use `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` follows the same prefix split. Use
`openai/gpt-*` for the normal OpenAI route and `codex/gpt-*` when image
understanding should run through a bounded Codex app-server turn. Do not use
`openai-codex/gpt-*`; doctor rewrites that legacy prefix to `openai/gpt-*`. The
Codex app-server model must advertise image input support; text-only Codex
models fail before the media turn starts.

Use `/status` to confirm the effective harness for the current session. If the
selection is surprising, enable debug logging for the `agents/harness` subsystem
and inspect the gateway's structured `agent harness selected` record. It
includes the selected harness id, selection reason, runtime/fallback policy, and,
in `auto` mode, each plugin candidate's support result.

### What doctor warnings mean

`openclaw doctor` warns when configured model refs or persisted session route
state still use `openai-codex/*`. `openclaw doctor --fix` rewrites those routes
to:

- `openai/<model>`
- `agentRuntime.id: "codex"` when Codex is installed, enabled, contributes the
  `codex` harness, and has usable OAuth
- `agentRuntime.id: "pi"` otherwise

The `codex` route forces the native Codex harness. The `pi` route keeps the
agent on the default OpenClaw runner instead of enabling or installing Codex as
a side effect of legacy-route cleanup.
Doctor also repairs stale persisted session pins across discovered agent session
stores so old conversations do not stay wedged on the removed route.

Вибір harness не є керуванням поточним сеансом. Коли виконується вбудований хід,
OpenClaw записує вибраний id harness для цього сеансу й продовжує використовувати його для
подальших ходів у тому самому id сеансу. Змініть конфігурацію `agentRuntime` або
`OPENCLAW_AGENT_RUNTIME`, якщо хочете, щоб майбутні сеанси використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати новий сеанс перед перемиканням наявної
розмови між PI і Codex. Це запобігає повторному програванню одного transcript через
дві несумісні нативні системи сеансів.

Застарілі сеанси, створені до закріплення harness, вважаються закріпленими за PI, щойно
вони мають історію transcript. Використовуйте `/new` або `/reset`, щоб перевести цю розмову на
Codex після зміни конфігурації.

`/status` показує ефективне середовище виконання моделі. Типовий PI harness відображається як
`Runtime: OpenClaw Pi Default`, а Codex app-server harness відображається як
`Runtime: OpenAI Codex`.

## Вимоги

- OpenClaw із доступним вбудованим `codex` Plugin.
- Codex app-server `0.125.0` або новіший. Вбудований Plugin типово керує сумісним
  бінарним файлом Codex app-server, тому локальні команди `codex` у `PATH` не
  впливають на звичайний запуск harness.
- Автентифікація Codex, доступна для процесу app-server або для мосту автентифікації Codex
  в OpenClaw. Локальні запуски app-server використовують керований OpenClaw дім Codex для кожного
  агента та ізольований дочірній `HOME`, тому типово вони не читають ваш особистий
  обліковий запис `~/.codex`, Skills, Plugins, конфігурацію, стан thread або нативні
  `$HOME/.agents/skills`.

Plugin блокує старіші або неверсіоновані handshakes app-server. Це утримує
OpenClaw на поверхні протоколу, з якою його протестовано.

Для live та Docker smoke tests автентифікація зазвичай надходить з облікового запису Codex CLI
або з профілю автентифікації OpenClaw `openai-codex`. Локальні stdio-запуски app-server також можуть
резервно використовувати `CODEX_API_KEY` / `OPENAI_API_KEY`, коли облікового запису немає.

## Файли bootstrap робочої області

Codex сам обробляє `AGENTS.md` через нативне виявлення project-doc. OpenClaw
не записує синтетичні Codex project-doc файли та не залежить від fallback
імен файлів Codex для persona-файлів, бо fallback Codex застосовуються лише коли
`AGENTS.md` відсутній.

Для паритету робочої області OpenClaw Codex harness знаходить інші bootstrap
файли (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` і `MEMORY.md`, якщо наявний) і передає їх через developer
instructions Codex у `thread/start` і `thread/resume`. Це зберігає
`SOUL.md` та пов’язаний контекст workspace persona/profile видимими на нативній
смузі формування поведінки Codex без дублювання `AGENTS.md`.

## Додайте Codex поряд з іншими моделями

Не встановлюйте `agentRuntime.id: "codex"` глобально, якщо той самий агент має вільно перемикатися
між Codex і моделями провайдерів, що не належать до Codex. Примусове runtime застосовується до кожного
вбудованого ходу для цього агента або сеансу. Якщо ви виберете модель Anthropic, коли
це runtime примусово задане, OpenClaw усе одно спробує Codex harness і завершиться закритою помилкою,
замість того щоб непомітно маршрутизувати цей хід через PI.

Натомість використовуйте одну з цих форм:

- Розмістіть Codex на окремому агенті з `agentRuntime.id: "codex"`.
- Залиште типового агента на `agentRuntime.id: "auto"` і PI fallback для звичайного змішаного
  використання провайдерів.
- Використовуйте застарілі refs `codex/*` лише для сумісності. Нові конфігурації мають віддавати перевагу
  `openai/*` плюс явній політиці Codex runtime.

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
- Агент `codex` використовує Codex app-server harness.
- Якщо Codex відсутній або не підтримується для агента `codex`, хід завершується помилкою
  замість тихого використання PI.

## Маршрутизація команд агента

Агенти мають маршрутизувати запити користувачів за наміром, а не лише за словом "Codex":

| Користувач просить...                                  | Агент має використати...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Прив’язати цей чат до Codex"                          | `/codex bind`                                    |
| "Відновити thread Codex `<id>` тут"                    | `/codex resume <id>`                             |
| "Показати threads Codex"                               | `/codex threads`                                 |
| "Подати звіт підтримки щодо невдалого запуску Codex"   | `/diagnostics [note]`                            |
| "Надіслати feedback Codex лише для цього прикріпленого thread" | `/codex diagnostics [note]`                      |
| "Використати мою підписку ChatGPT/Codex з Codex runtime" | `openai/*` плюс `agentRuntime.id: "codex"`       |
| "Відремонтувати старі закріплення конфігурації/сеансів `openai-codex/*`" | `openclaw doctor --fix`                          |
| "Запустити Codex через ACP/acpx"                       | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Запустити Claude Code/Gemini/OpenCode/Cursor у thread" | ACP/acpx, не `/codex` і не нативні sub-agents |

OpenClaw рекламує агентам guidance щодо ACP spawn лише коли ACP увімкнено,
доступний для dispatch і підкріплений завантаженим runtime backend. Якщо ACP недоступний,
system prompt і Plugin skills не мають навчати агента ACP
routing.

## Розгортання лише з Codex

Примусово задайте Codex harness, коли потрібно довести, що кожен вбудований хід агента
використовує Codex. Явні Plugin runtimes завершуються закритою помилкою й ніколи тихо не повторюються
через PI:

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
}
```

Перевизначення середовищем:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Коли Codex примусово задано, OpenClaw завершується рано, якщо Codex Plugin вимкнено, якщо
app-server занадто старий або якщо app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити одного агента лише Codex, тоді як типовий агент зберігає звичайний
автовибір:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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

Використовуйте звичайні команди сеансу, щоб перемикати агентів і моделі. `/new` створює новий
сеанс OpenClaw, а Codex harness за потреби створює або відновлює свій sidecar app-server
thread. `/reset` очищає прив’язку сеансу OpenClaw для цього thread
і дозволяє наступному ходу знову визначити harness з поточної конфігурації.

## Виявлення моделей

Типово Codex Plugin запитує в app-server доступні моделі. Якщо
виявлення завершується помилкою або спливає час очікування, він використовує вбудований fallback catalog для:

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

Вимкніть виявлення, коли хочете, щоб запуск уникав probing Codex і залишався на
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

Типово Plugin запускає керований OpenClaw бінарний файл Codex локально з:

```bash
codex app-server --listen stdio://
```

Керований бінарний файл постачається з пакетом `codex` Plugin. Це утримує
версію app-server прив’язаною до вбудованого Plugin, а не до будь-якого окремого
Codex CLI, який випадково встановлено локально. Встановлюйте `appServer.command` лише коли
ви навмисно хочете запустити інший виконуваний файл.

Типово OpenClaw запускає локальні Codex harness sessions у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це довірена позиція локального оператора, яку використовують
для автономних heartbeats: Codex може використовувати shell і network tools без
зупинки на нативних approval prompts, на які немає кому відповісти.

Щоб увімкнути approvals, reviewed by Codex guardian, встановіть `appServer.mode:
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

Режим Guardian використовує нативний шлях auto-review approval Codex. Коли Codex просить
вийти з sandbox, записати за межами робочої області або додати дозволи, наприклад network
access, Codex маршрутизує цей approval request до нативного reviewer замість
human prompt. Reviewer застосовує risk framework Codex і схвалює або відхиляє
конкретний запит. Використовуйте Guardian, коли хочете більше guardrails, ніж у режимі YOLO,
але все ще потребуєте, щоб unattended agents рухалися далі.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` і `sandbox: "workspace-write"`.
Окремі поля policy все ще перевизначають `mode`, тому advanced deployments можуть поєднувати
пресет з явними виборами. Старіше значення reviewer `guardian_subagent`
все ще приймається як alias сумісності, але нові конфігурації мають використовувати
`auto_review`.

Для app-server, який уже запущено, використовуйте WebSocket transport:

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

Stdio-запуски app-server типово успадковують process environment OpenClaw,
але OpenClaw володіє мостом облікового запису Codex app-server і встановлює обидва
`CODEX_HOME` і `HOME` у каталоги per-agent в межах state цього агента OpenClaw.
Власний skill loader Codex читає `$CODEX_HOME/skills` і
`$HOME/.agents/skills`, тому обидва значення ізольовані для локальних запусків app-server.
Це утримує Codex-native Skills, Plugins, конфігурацію, облікові записи та стан thread
у межах агента OpenClaw замість витоку з особистого дому Codex CLI оператора.

OpenClaw Plugins і snapshots OpenClaw Skills усе ще проходять через власний
plugin registry і skill loader OpenClaw. Особисті assets Codex CLI не проходять. Якщо у вас є
корисні Skills або Plugins Codex CLI, які мають стати частиною агента OpenClaw,
інвентаризуйте їх явно:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Провайдер міграції Codex копіює Skills у поточну робочу область агента OpenClaw.
Нативні Plugins, hooks і config files Codex звітуються або архівуються
для ручного review замість автоматичної активації, бо вони можуть
виконувати команди, відкривати MCP servers або містити credentials.

Автентифікація вибирається в такому порядку:

1. Явний профіль автентифікації OpenClaw Codex для агента.
2. Наявний обліковий запис app-server у Codex home цього агента.
3. Лише для локальних stdio-запусків app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли облікового запису app-server немає, а OpenAI auth
   все ще потрібна.

Коли OpenClaw бачить профіль автентифікації Codex у стилі підписки ChatGPT, він вилучає
`CODEX_API_KEY` і `OPENAI_API_KEY` із породженого дочірнього процесу Codex. Це
залишає API-ключі рівня Gateway доступними для embeddings або прямих моделей OpenAI,
не допускаючи, щоб нативні звернення app-server Codex випадково тарифікувалися через API.
Явні профілі API-ключів Codex і локальний резервний варіант stdio env-key використовують
вхід app-server замість успадкованого середовища дочірнього процесу. WebSocket-з’єднання
app-server не отримують резервний API-ключ Gateway із середовища; використовуйте явний
профіль автентифікації або власний обліковий запис віддаленого app-server.

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

Динамічні інструменти Codex типово використовують профіль `native-first`. У цьому режимі
OpenClaw не відкриває динамічні інструменти, які дублюють нативні для Codex операції
з робочою областю: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` і
`update_plan`. Інтеграційні інструменти OpenClaw, як-от обмін повідомленнями, сеанси, медіа,
cron, браузер, вузли, gateway, `heartbeat_respond` і `web_search`, залишаються
доступними.

Підтримувані поля верхнього рівня Plugin Codex:

| Поле                       | Типове значення | Значення                                                                                           |
| -------------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Використайте `"openclaw-compat"`, щоб відкрити повний набір динамічних інструментів OpenClaw для app-server Codex. |
| `codexDynamicToolsExclude` | `[]`            | Додаткові назви динамічних інструментів OpenClaw, які слід вилучити зі звернень app-server Codex. |

Підтримувані поля `appServer`:

| Поле                | Типове значення                         | Значення                                                                                                                                                                                                                          |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` породжує Codex; `"websocket"` підключається до `url`.                                                                                                                                                                  |
| `command`           | керований бінарний файл Codex            | Виконуваний файл для транспорту stdio. Не задавайте, щоб використовувати керований бінарний файл; задавайте лише для явного перевизначення.                                                                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                                                                                                                                                  |
| `url`               | не задано                                | URL app-server WebSocket.                                                                                                                                                                                                        |
| `authToken`         | не задано                                | Bearer-токен для транспорту WebSocket.                                                                                                                                                                                           |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                                                                                                                                                   |
| `clearEnv`          | `[]`                                     | Додаткові назви змінних середовища, які вилучаються з породженого процесу stdio app-server після того, як OpenClaw будує успадковане середовище. `CODEX_HOME` і `HOME` зарезервовані для ізоляції Codex для кожного агента OpenClaw під час локальних запусків. |
| `requestTimeoutMs`  | `60000`                                  | Тайм-аут для викликів control-plane app-server.                                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | Пресет для виконання YOLO або з перевіркою guardian.                                                                                                                                                                             |
| `approvalPolicy`    | `"never"`                                | Нативна політика схвалення Codex, що надсилається під час запуску/відновлення потоку або звернення.                                                                                                                              |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, що надсилається під час запуску/відновлення потоку.                                                                                                                                                |
| `approvalsReviewer` | `"user"`                                 | Використайте `"auto_review"`, щоб дозволити Codex перевіряти нативні запити на схвалення. `guardian_subagent` залишається застарілим псевдонімом.                                                                                |
| `serviceTier`       | не задано                                | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Недійсні застарілі значення ігноруються.                                                                                                          |

Виклики динамічних інструментів, якими володіє OpenClaw, обмежуються незалежно від
`appServer.requestTimeoutMs`: кожен запит Codex `item/tool/call` має отримати
відповідь OpenClaw протягом 30 секунд. У разі тайм-ауту OpenClaw перериває сигнал
інструмента там, де це підтримується, і повертає до Codex невдалу відповідь динамічного
інструмента, щоб звернення могло продовжитися, а не залишити сеанс у стані `processing`.

Після того як OpenClaw відповідає на запит app-server Codex, обмежений зверненням,
harness також очікує, що Codex завершить нативне звернення через `turn/completed`. Якщо
app-server мовчить 60 секунд після цієї відповіді, OpenClaw у режимі найкращої спроби
перериває звернення Codex, записує діагностичний тайм-аут і звільняє смугу сеансу
OpenClaw, щоб наступні повідомлення чату не ставали в чергу за застарілим нативним
зверненням.

Перевизначення середовища залишаються доступними для локального тестування:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` обходить керований бінарний файл, коли
`appServer.command` не задано.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для одноразового локального тестування. Конфігурація
краща для повторюваних розгортань, оскільки вона тримає поведінку Plugin у тому самому
перевіреному файлі, що й решта налаштування harness Codex.

## Використання комп’ютера

Використання комп’ютера описано в окремому посібнику з налаштування:
[Використання комп’ютера в Codex](/uk/plugins/codex-computer-use).

Коротко: OpenClaw не постачає застосунок для керування робочим столом і не виконує
дії на робочому столі самостійно. Він готує app-server Codex, перевіряє доступність
MCP-сервера `computer-use`, а потім дозволяє Codex обробляти нативні виклики інструментів
MCP під час звернень у режимі Codex.

Для прямого доступу до драйвера TryCua поза потоком marketplace Codex зареєструйте
`cua-driver mcp` за допомогою `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Див. [Використання комп’ютера в Codex](/uk/plugins/codex-computer-use), щоб зрозуміти різницю
між використанням комп’ютера, яким володіє Codex, і прямою реєстрацією MCP.

Мінімальна конфігурація:

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

Використання комп’ютера є специфічним для macOS і може потребувати локальних дозволів ОС,
перш ніж MCP-сервер Codex зможе керувати застосунками. Якщо `computerUse.enabled` має
значення true, а MCP-сервер недоступний, звернення в режимі Codex завершуються помилкою
до запуску потоку, замість мовчки виконуватися без нативних інструментів використання
комп’ютера. Див. [Використання комп’ютера в Codex](/uk/plugins/codex-computer-use) щодо варіантів
marketplace, обмежень віддаленого каталогу, причин стану й усунення несправностей.

Коли `computerUse.autoInstall` має значення true, OpenClaw може зареєструвати стандартний
комплектний marketplace Codex Desktop із
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, якщо Codex
ще не виявив локальний marketplace. Використайте `/new` або `/reset` після зміни
runtime або конфігурації використання комп’ютера, щоб наявні сеанси не зберігали старе
прив’язування потоку PI або Codex.

## Поширені рецепти

Локальний Codex із типовим транспортом stdio:

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

Перемикання моделей залишається під контролем OpenClaw. Коли сеанс OpenClaw приєднано
до наявного потоку Codex, наступне звернення знову надсилає до app-server поточну вибрану
модель OpenAI, провайдера, політику схвалення, sandbox і рівень сервісу. Перемикання з
`openai/gpt-5.5` на `openai/gpt-5.2` зберігає прив’язування потоку, але просить Codex
продовжити з новообраною моделлю.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
універсальною й працює на будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує поточне підключення до сервера застосунку, моделі, обліковий запис, ліміти швидкості, MCP-сервери та Skills.
- `/codex models` перелічує поточні моделі сервера застосунку Codex.
- `/codex threads [filter]` перелічує нещодавні потоки Codex.
- `/codex resume <thread-id>` прив’язує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить сервер застосунку Codex виконати Compaction для прив’язаного потоку.
- `/codex review` запускає нативний огляд Codex для прив’язаного потоку.
- `/codex diagnostics [note]` запитує підтвердження перед надсиланням діагностичного відгуку Codex для прив’язаного потоку.
- `/codex computer-use status` перевіряє налаштований Plugin Computer Use і MCP-сервер.
- `/codex computer-use install` встановлює налаштований Plugin Computer Use і перезавантажує MCP-сервери.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` перелічує стан MCP-серверів сервера застосунку Codex.
- `/codex skills` перелічує Skills сервера застосунку Codex.

Коли Codex повідомляє про помилку ліміту використання, OpenClaw додає наступний
час скидання сервера застосунку, якщо Codex його надав. Використайте `/codex account` у тій самій
розмові, щоб переглянути поточні вікна облікового запису та лімітів швидкості.

### Типовий робочий процес налагодження

Коли агент на базі Codex робить щось несподіване в Telegram, Discord, Slack
або іншому каналі, почніть із розмови, де сталася проблема:

1. Запустіть `/diagnostics bad tool choice after image upload` або іншу коротку нотатку,
   яка описує те, що ви побачили.
2. Один раз підтвердьте запит на діагностику. Підтвердження створює локальний
   діагностичний zip Gateway і, оскільки сесія використовує обв’язку Codex, також
   надсилає відповідний пакет відгуку Codex на сервери OpenAI.
3. Скопіюйте завершену діагностичну відповідь у звіт про помилку або гілку підтримки.
   Вона містить локальний шлях до пакета, підсумок конфіденційності, ідентифікатори сесій OpenClaw,
   ідентифікатори потоків Codex і рядок `Inspect locally` для кожного потоку Codex.
4. Якщо ви хочете налагодити запуск самостійно, виконайте надруковану команду `Inspect locally`
   у терміналі. Вона має вигляд `codex resume <thread-id>` і відкриває
   нативний потік Codex, щоб ви могли переглянути розмову, продовжити її локально
   або запитати Codex, чому він вибрав конкретний інструмент чи план.

Використовуйте `/codex diagnostics [note]` лише тоді, коли вам потрібне саме
завантаження відгуку Codex для поточного прив’язаного потоку без повного
діагностичного пакета OpenClaw Gateway. Для більшості звітів підтримки `/diagnostics [note]` є
кращою початковою точкою, бо пов’язує локальний стан Gateway та ідентифікатори
потоків Codex в одній відповіді. Див. [Експорт діагностики](/uk/gateway/diagnostics)
для повної моделі конфіденційності та поведінки в групових чатах.

Ядро OpenClaw також надає доступну лише власнику команду `/diagnostics [note]` як загальну
діагностичну команду Gateway. Її запит підтвердження показує преамбулу щодо чутливих даних,
посилається на [Експорт діагностики](/uk/gateway/diagnostics) і щоразу запитує
`openclaw gateway diagnostics export --json` через явне підтвердження exec.
Не підтверджуйте діагностику правилом allow-all. Після підтвердження
OpenClaw надсилає звіт, який можна вставити, з локальним шляхом до пакета та підсумком
маніфесту. Коли активна сесія OpenClaw використовує обв’язку Codex, те саме
підтвердження також дозволяє надсилання відповідних пакетів відгуку Codex на
сервери OpenAI. Запит підтвердження каже, що відгук Codex буде надіслано, але
не перелічує ідентифікатори сесій або потоків Codex до підтвердження.

Якщо `/diagnostics` викликає власник у груповому чаті, OpenClaw зберігає
спільний канал чистим: група отримує лише коротке повідомлення, тоді як
діагностична преамбула, запити підтвердження та ідентифікатори сесій/потоків Codex надсилаються
власнику через приватний маршрут підтвердження. Якщо приватного маршруту власника немає,
OpenClaw відхиляє груповий запит і просить власника виконати його з DM.

Підтверджене завантаження Codex викликає `feedback/upload` сервера застосунку Codex і просить
сервер застосунку додати журнали для кожного переліченого потоку та породжених підпотоків Codex,
коли вони доступні. Завантаження проходить звичайним шляхом відгуку Codex на сервери OpenAI;
якщо відгук Codex вимкнено на цьому сервері застосунку, команда повертає
помилку сервера застосунку. Завершена діагностична відповідь перелічує канали,
ідентифікатори сесій OpenClaw, ідентифікатори потоків Codex і локальні команди `codex resume <thread-id>`
для надісланих потоків. Якщо ви відхилите або проігноруєте підтвердження,
OpenClaw не надрукує ці ідентифікатори Codex. Це завантаження не замінює локальний
експорт діагностики Gateway.

`/codex resume` записує той самий sidecar-файл прив’язки, який обв’язка використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw у сервер застосунку та залишає розширену історію
увімкненою.

### Перегляд потоку Codex із CLI

Найшвидший спосіб зрозуміти невдалий запуск Codex часто полягає в тому, щоб відкрити нативний потік Codex
безпосередньо:

```sh
codex resume <thread-id>
```

Використовуйте це, коли помічаєте помилку в розмові каналу й хочете переглянути
проблемну сесію Codex, продовжити її локально або запитати Codex, чому він зробив
конкретний вибір інструмента чи міркування. Найпростіший шлях зазвичай полягає в тому, щоб спочатку запустити
`/diagnostics [note]`: після підтвердження завершений звіт перелічує
кожен потік Codex і друкує команду `Inspect locally`, наприклад
`codex resume <thread-id>`. Ви можете скопіювати цю команду прямо в термінал.

Ви також можете отримати ідентифікатор потоку з `/codex binding` для поточного чату або
`/codex threads [filter]` для нещодавніх потоків сервера застосунку Codex, а потім виконати ту саму
команду `codex resume` у своїй оболонці.

Поверхня команд потребує сервера застосунку Codex `0.125.0` або новішого. Окремі
методи керування повідомляються як `unsupported by this Codex app-server`, якщо
майбутній або спеціальний сервер застосунку не надає цей метод JSON-RPC.

## Межі хуків

Обв’язка Codex має три шари хуків:

| Шар                                  | Власник                  | Призначення                                                         |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| Хуки OpenClaw Plugin                 | OpenClaw                 | Сумісність продукту/Plugin між обв’язками PI та Codex.              |
| Проміжний шар розширень сервера застосунку Codex | Вбудовані Plugin OpenClaw | Адаптерна поведінка на кожен хід навколо динамічних інструментів OpenClaw. |
| Нативні хуки Codex                   | Codex                    | Низькорівневий життєвий цикл Codex і політика нативних інструментів із конфігурації Codex. |

OpenClaw не використовує проєктні або глобальні файли Codex `hooks.json` для маршрутизації
поведінки OpenClaw Plugin. Для підтримуваного моста нативних інструментів і дозволів
OpenClaw ін’єктує конфігурацію Codex для кожного потоку для `PreToolUse`, `PostToolUse`,
`PermissionRequest` і `Stop`. Інші хуки Codex, як-от `SessionStart` і
`UserPromptSubmit`, залишаються елементами керування рівня Codex; вони не надаються як
хуки OpenClaw Plugin у контракті v1.

Для динамічних інструментів OpenClaw OpenClaw виконує інструмент після того, як Codex запитує
виклик, тому OpenClaw запускає належну йому поведінку Plugin і проміжного шару в
адаптері обв’язки. Для нативних інструментів Codex власником канонічного запису інструмента є Codex.
OpenClaw може віддзеркалювати вибрані події, але не може переписати нативний потік Codex,
якщо Codex не надає цю операцію через сервер застосунку або callback-и нативних хуків.

Проєкції Compaction і життєвого циклу LLM надходять зі сповіщень сервера застосунку Codex
і стану адаптера OpenClaw, а не з команд нативних хуків Codex.
Події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` є спостереженнями рівня адаптера, а не побайтовими копіями
внутрішнього запиту Codex або payload Compaction.

Нативні сповіщення сервера застосунку Codex `hook/started` і `hook/completed`
проєктуються як події агента `codex_app_server.hook` для траєкторії та налагодження.
Вони не викликають хуки OpenClaw Plugin.

## Контракт підтримки V1

Режим Codex — це не PI з іншим викликом моделі під капотом. Codex володіє більшою частиною
нативного циклу моделі, а OpenClaw адаптує свої поверхні Plugin і сесії
навколо цієї межі.

Підтримується в runtime Codex v1:

| Поверхня                                      | Підтримка                               | Чому                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Цикл моделі OpenAI через Codex                | Підтримується                           | Сервер застосунку Codex володіє ходом OpenAI, відновленням нативного потоку та продовженням нативних інструментів.                                                                                  |
| Маршрутизація та доставка каналів OpenClaw    | Підтримується                           | Telegram, Discord, Slack, WhatsApp, iMessage та інші канали залишаються поза runtime моделі.                                                                                                        |
| Динамічні інструменти OpenClaw                | Підтримується                           | Codex просить OpenClaw виконати ці інструменти, тому OpenClaw залишається в шляху виконання.                                                                                                        |
| Prompt і контекстні Plugin                    | Підтримується                           | OpenClaw будує накладки prompt і проєктує контекст у хід Codex перед запуском або відновленням потоку.                                                                                               |
| Життєвий цикл рушія контексту                 | Підтримується                           | Збирання, ingest або обслуговування після ходу та координація Compaction рушія контексту виконуються для ходів Codex.                                                                                |
| Хуки динамічних інструментів                  | Підтримується                           | `before_tool_call`, `after_tool_call` і проміжний шар результатів інструментів виконуються навколо динамічних інструментів, якими володіє OpenClaw.                                                  |
| Хуки життєвого циклу                          | Підтримуються як спостереження адаптера | `llm_input`, `llm_output`, `agent_end`, `before_compaction` і `after_compaction` запускаються з чесними payload для режиму Codex.                                                                    |
| Шлюз перегляду фінальної відповіді            | Підтримується через relay нативних хуків | Codex `Stop` передається в `before_agent_finalize`; `revise` просить Codex зробити ще один прохід моделі перед фіналізацією.                                                                         |
| Блокування або спостереження за нативними shell, patch і MCP | Підтримується через relay нативних хуків | Codex `PreToolUse` і `PostToolUse` передаються для закомічених поверхонь нативних інструментів, включно з payload MCP на сервері застосунку Codex `0.125.0` або новішому. Блокування підтримується; переписування аргументів — ні. |
| Нативна політика дозволів                     | Підтримується через relay нативних хуків | Codex `PermissionRequest` може маршрутизуватися через політику OpenClaw там, де runtime це надає. Якщо OpenClaw не повертає рішення, Codex продовжує через свій звичайний guardian або шлях підтвердження користувача. |
| Захоплення траєкторії сервера застосунку      | Підтримується                           | OpenClaw записує запит, який він надіслав серверу застосунку, і сповіщення сервера застосунку, які отримує.                                                                                         |

Не підтримується в runtime Codex v1:

| Поверхня                                           | Межа V1                                                                                                                                          | Майбутній шлях                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Зміна аргументів нативного інструмента              | Нативні pre-tool хуки Codex можуть блокувати, але OpenClaw не переписує аргументи нативних для Codex інструментів.                             | Потребує підтримки хуків/схеми Codex для заміни вхідних даних інструмента.                |
| Редагована нативна історія transcript Codex         | Codex володіє канонічною нативною історією thread. OpenClaw володіє дзеркалом і може проектувати майбутній контекст, але не має змінювати непідтримувані внутрішні структури. | Додати явні API app-server Codex, якщо потрібне хірургічне редагування нативного thread. |
| `tool_result_persist` для нативних записів інструментів Codex | Цей хук перетворює записи transcript, якими володіє OpenClaw, а не нативні записи інструментів Codex.                                           | Можна дзеркалити перетворені записи, але канонічне переписування потребує підтримки Codex. |
| Багаті нативні метадані Compaction                  | OpenClaw спостерігає початок і завершення Compaction, але не отримує стабільний список збереженого/відкинутого, дельту токенів або payload підсумку. | Потребує багатших подій Compaction у Codex.                                                |
| Втручання в Compaction                              | Поточні хуки Compaction OpenClaw у режимі Codex працюють на рівні сповіщень.                                                                    | Додати pre/post хуки Compaction Codex, якщо plugins потрібно ветувати або переписувати нативну Compaction. |
| Побайтове захоплення запиту до API моделі           | OpenClaw може захоплювати запити й сповіщення app-server, але ядро Codex внутрішньо формує фінальний запит OpenAI API.                         | Потребує події трасування model-request Codex або debug API.                              |

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий вбудований виконавець агента.

OpenClaw і далі формує список інструментів та отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, approvals і вивід messaging-tool
продовжують проходити звичайним шляхом доставки OpenClaw.

Нативний relay хуків навмисно є універсальним, але контракт підтримки v1
обмежений нативними для Codex шляхами інструментів і дозволів, які тестує OpenClaw. У
runtime Codex це включає payload-и shell, patch і MCP `PreToolUse`,
`PostToolUse` та `PermissionRequest`. Не припускайте, що кожна майбутня
подія хука Codex є поверхнею plugin OpenClaw, доки runtime-контракт не назве
її.

Для `PermissionRequest` OpenClaw повертає явні рішення allow або deny лише
коли це вирішує політика. Результат без рішення не є allow. Codex трактує його як відсутність
рішення хука і переходить до власного guardian або шляху approval користувача.

Запити approval для інструментів MCP Codex спрямовуються через plugin-потік
approval OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`. Запити Codex `request_user_input` надсилаються назад до
початкового чату, а наступне follow-up повідомлення в черзі відповідає на цей нативний
запит сервера замість того, щоб спрямовуватися як додатковий контекст. Інші запити elicitation
MCP усе ще завершуються закрито.

Спрямування черги активного запуску відображається на `turn/steer` app-server Codex. З
типовим `messages.queue.mode: "steer"` OpenClaw групує повідомлення чату в черзі
протягом налаштованого quiet window і надсилає їх як один запит `turn/steer` у
порядку надходження. Застарілий режим `queue` надсилає окремі запити `turn/steer`. Review
Codex і ручні turn-и Compaction можуть відхиляти спрямування того самого turn, у такому разі
OpenClaw використовує followup queue, коли вибраний режим дозволяє fallback. Див.
[Черга спрямування](/uk/concepts/queue-steering).

Коли вибрана модель використовує harness Codex, нативна Compaction thread
делегується app-server Codex. OpenClaw зберігає дзеркало transcript для історії каналів,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
містить prompt користувача, фінальний текст assistant і легкі записи reasoning або plan Codex,
коли app-server їх надсилає. Наразі OpenClaw записує лише сигнали початку й завершення
нативної Compaction. Він ще не надає людинозрозумілий підсумок Compaction або
аудитований список записів, які Codex зберіг після Compaction.

Оскільки Codex володіє канонічним нативним thread, `tool_result_persist` наразі не
переписує нативні записи результатів інструментів Codex. Він застосовується лише тоді, коли
OpenClaw записує результат інструмента transcript сеансу, яким володіє OpenClaw.

Генерація медіа не потребує PI. Зображення, відео, музика, PDF, TTS і розуміння
медіа продовжують використовувати відповідні налаштування provider/model, як-от
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не відображається як звичайний provider `/model`:** це очікувано для
нових конфігурацій. Виберіть модель `openai/gpt-*` з
`agentRuntime.id: "codex"` (або застарілий ref `codex/*`), увімкніть
`plugins.entries.codex.enabled` і перевірте, чи `plugins.allow` не виключає
`codex`.

**OpenClaw використовує PI замість Codex:** `agentRuntime.id: "auto"` усе ще може використовувати PI як
бекенд сумісності, коли жоден harness Codex не заявляє запуск. Встановіть
`agentRuntime.id: "codex"`, щоб примусово вибрати Codex під час тестування. Примусовий
runtime Codex завершується помилкою замість fallback до PI. Щойно app-server Codex
вибрано, його помилки відображаються напряму.

**app-server відхилено:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.125.0` або новішу. Prerelease тієї самої версії або версії із суфіксом build,
як-от `0.125.0-alpha.2` чи `0.125.0+custom`, відхиляються, бо
стабільна межа протоколу `0.125.0` є тією, яку тестує OpenClaw.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть discovery.

**WebSocket transport одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і те, що віддалений app-server говорить тією самою версією протоколу app-server Codex.

**Модель не Codex використовує PI:** це очікувано, якщо ви не примусили
`agentRuntime.id: "codex"` для цього агента або не вибрали застарілий
ref `codex/*`. Звичайні `openai/gpt-*` та інші provider refs залишаються на своєму звичайному
provider-шляху в режимі `auto`. Якщо ви примусите `agentRuntime.id: "codex"`, кожен вбудований
turn для цього агента має бути моделлю OpenAI, підтримуваною Codex.

**Computer Use встановлено, але інструменти не запускаються:** перевірте
`/codex computer-use status` з нового сеансу. Якщо інструмент повідомляє
`Native hook relay unavailable`, використайте `/new` або `/reset`; якщо це повторюється, перезапустіть
gateway, щоб очистити застарілі реєстрації нативних хуків. Якщо `computer-use.list_apps`
завершується за тайм-аутом, перезапустіть Codex Computer Use або Codex Desktop і повторіть спробу.

## Пов’язане

- [Plugins harness агентів](/uk/plugins/sdk-agent-harness)
- [Runtime-и агентів](/uk/concepts/agent-runtimes)
- [Provider-и моделей](/uk/concepts/model-providers)
- [Provider OpenAI](/uk/providers/openai)
- [Статус](/uk/cli/status)
- [Хуки Plugin](/uk/plugins/hooks)
- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
