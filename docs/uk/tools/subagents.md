---
read_when:
    - Ви хочете фонову/паралельну роботу через агента
    - Ви змінюєте `sessions_spawn` або політику інструментів sub-agent-ів
    - Ви реалізуєте або налагоджуєте thread-bound subagent-сесії
summary: 'Sub-agent-и: запуск ізольованих agent run, які анонсують результати назад у чат запитувача'
title: Sub-agent-и
x-i18n:
    generated_at: "2026-04-23T21:17:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc5a5865f1758bcbaf6b68443e25f1fd754e90ee810f4fee03ae996e2f64562f
    source_path: tools/subagents.md
    workflow: 15
---

Sub-agent-и — це фонові agent run, створені з наявного agent run. Вони працюють у власній session (`agent:<agentId>:subagent:<uuid>`) і після завершення **оголошують** свій результат назад у чат запитувача. Кожен запуск sub-agent відстежується як [фонове завдання](/uk/automation/tasks).

## Slash-команда

Використовуйте `/subagents`, щоб перевіряти або керувати запуском sub-agent для **поточної session**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Контролі thread binding:

Ці команди працюють на каналах, які підтримують persistent thread bindings. Див. **Канали, що підтримують thread** нижче.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` показує metadata запуску (status, timestamps, session id, transcript path, cleanup).
Використовуйте `sessions_history` для обмеженого, відфільтрованого з погляду безпеки перегляду історії; перевіряйте
шлях transcript на диску, коли вам потрібен сирий повний transcript.

### Поведінка spawn

`/subagents spawn` запускає фоновий sub-agent як користувацьку команду, а не внутрішній relay, і надсилає одне фінальне completion-оновлення назад у чат запитувача, коли запуск завершується.

- Команда spawn є non-blocking; вона одразу повертає run id.
- Після завершення sub-agent оголошує summary/result-повідомлення назад у чатовий канал запитувача.
- Completion є push-based. Після spawn не потрібно в циклі опитувати `/subagents list`,
  `sessions_list` або `sessions_history`, щоб просто чекати завершення;
  перевіряйте status лише на вимогу для налагодження або втручання.
- Після завершення OpenClaw намагається best-effort закрити відстежувані вкладки browser / процеси, відкриті цією sub-agent session, перш ніж потік cleanup announce піде далі.
- Для ручних spawn доставка є стійкою:
  - OpenClaw спершу намагається доставити через direct `agent` зі стабільним idempotency key.
  - Якщо direct delivery зазнає помилки, використовується fallback до queue routing.
  - Якщо queue routing усе одно недоступний, announce повторюється з коротким exponential backoff перед остаточною відмовою.
- Доставка completion зберігає resolved route запитувача:
  - thread-bound або conversation-bound completion route мають пріоритет, коли доступні
  - якщо completion origin надає лише channel, OpenClaw заповнює відсутні target/account з resolved route session запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб direct delivery усе одно працювала
- Передача completion до session запитувача — це внутрішній runtime-generated context (а не текст, написаний користувачем) і він включає:
  - `Result` (найновіший видимий текст відповіді `assistant`, інакше sanitized latest text tool/toolResult; terminal failed run не використовують captured reply text повторно)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - компактну runtime/token statistics
  - інструкцію з доставки, яка каже agent-у запитувача переписати це звичайним голосом асистента (а не пересилати сирі внутрішні metadata)
- `--model` і `--thinking` перевизначають типові значення для цього конкретного run.
- Використовуйте `info`/`log`, щоб перевіряти деталі й output після завершення.
- `/subagents spawn` — це one-shot mode (`mode: "run"`). Для постійних thread-bound session використовуйте `sessions_spawn` з `thread: true` і `mode: "session"`.
- Для ACP harness-сесій (Codex, Claude Code, Gemini CLI) використовуйте `sessions_spawn` з `runtime: "acp"` і див. [ACP Agents](/uk/tools/acp-agents), особливо [модель доставки ACP](/uk/tools/acp-agents#delivery-model), коли налагоджуєте completion або agent-to-agent loops.

Основні цілі:

- Паралелізувати “research / long task / slow tool”-роботу без блокування основного run.
- За замовчуванням тримати sub-agent ізольованими (розділення session + необов’язковий sandboxing).
- Зберігати поверхню інструментів такою, щоб нею було важко зловживати: sub-agent-и **не** отримують session tools за замовчуванням.
- Підтримувати налаштовувану глибину вкладення для orchestrator pattern.

Примітка щодо вартості: кожен sub-agent типово має **власний** контекст і власне використання токенів. Для важких або
повторюваних завдань задавайте для sub-agent дешевшу модель, а основного агента залишайте на
якіснішій моделі. Це можна налаштувати через `agents.defaults.subagents.model` або override для окремого агента.
Коли child справді потребує поточного transcript запитувача, агент може запитати
`context: "fork"` лише для цього одного spawn.

## Інструмент

Використовуйте `sessions_spawn`:

- Запускає sub-agent run (`deliver: false`, global lane: `subagent`)
- Потім виконує крок announce і публікує announce reply у чат-канал запитувача
- Типова модель: успадковується від caller, якщо ви не задасте `agents.defaults.subagents.model` (або `agents.list[].subagents.model` для окремого агента); явний `sessions_spawn.model` усе одно має пріоритет.
- Типове thinking: успадковується від caller, якщо ви не задасте `agents.defaults.subagents.thinking` (або `agents.list[].subagents.thinking` для окремого агента); явний `sessions_spawn.thinking` усе одно має пріоритет.
- Типовий timeout запуску: якщо `sessions_spawn.runTimeoutSeconds` не вказано, OpenClaw використовує `agents.defaults.subagents.runTimeoutSeconds`, коли його задано; інакше використовує fallback до `0` (без timeout).

Параметри tool:

- `task` (обов’язково)
- `label?` (необов’язково)
- `agentId?` (необов’язково; запускати під іншим agent id, якщо дозволено)
- `model?` (необов’язково; перевизначає модель sub-agent; невалідні значення пропускаються, і sub-agent запускається на типовій моделі з попередженням у результаті tool)
- `thinking?` (необов’язково; перевизначає рівень thinking для run sub-agent)
- `runTimeoutSeconds?` (типово береться з `agents.defaults.subagents.runTimeoutSeconds`, якщо задано, інакше `0`; коли задано, run sub-agent переривається після N секунд)
- `thread?` (типово `false`; коли `true`, запитує thread binding каналу для цієї session sub-agent)
- `mode?` (`run|session`)
  - типово `run`
  - якщо `thread: true` і `mode` не вказано, типовим стає `session`
  - `mode: "session"` потребує `thread: true`
- `cleanup?` (`delete|keep`, типово `keep`)
- `sandbox?` (`inherit|require`, типово `inherit`; `require` відхиляє spawn, якщо runtime цільового child не sandboxed)
- `context?` (`isolated|fork`, типово `isolated`; лише для native sub-agent)
  - `isolated` створює чистий child transcript і є типовим значенням.
  - `fork` відгалужує поточний transcript запитувача до child session, тож child стартує з тим самим conversation context.
  - Використовуйте `fork` лише тоді, коли child потребує поточного transcript. Для обмеженої роботи не вказуйте `context`.
- `sessions_spawn` **не** приймає channel-delivery params (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Для доставки використовуйте `message`/`sessions_send` зі spawned run.

## Сесії, прив’язані до thread

Коли для каналу увімкнено thread bindings, sub-agent може залишатися прив’язаним до thread, щоб follow-up-повідомлення користувача в цьому thread і далі маршрутизувалися до тієї самої session sub-agent.

### Канали, що підтримують thread

- Discord (наразі єдиний підтримуваний канал): підтримує persistent thread-bound subagent session (`sessions_spawn` з `thread: true`), ручні thread-controls (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) і ключі adapter-а `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` і `channels.discord.threadBindings.spawnSubagentSessions`.

Швидкий потік:

1. Запустіть spawn через `sessions_spawn`, використовуючи `thread: true` (і за бажанням `mode: "session"`).
2. OpenClaw створює або прив’язує thread до цілі цієї session в active channel.
3. Відповіді й follow-up-повідомлення в цьому thread маршрутизуються до прив’язаної session.
4. Використовуйте `/session idle`, щоб перевіряти/оновлювати inactivity auto-unfocus, і `/session max-age`, щоб керувати жорсткою межею.
5. Використовуйте `/unfocus`, щоб відв’язати вручну.

Ручні контролі:

- `/focus <target>` прив’язує поточний thread (або створює його) до цілі sub-agent/session.
- `/unfocus` прибирає binding для поточного bound thread.
- `/agents` показує active run і стан binding (`thread:<id>` або `unbound`).
- `/session idle` і `/session max-age` працюють лише для focused bound thread.

Перемикачі конфігурації:

- Глобальні типові значення: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Override каналу й ключі auto-bind для spawn є adapter-specific. Див. **Канали, що підтримують thread** вище.

Див. [Configuration Reference](/uk/gateway/configuration-reference) і [Slash commands](/uk/tools/slash-commands) для актуальних деталей adapter-а.

Allowlist:

- `agents.list[].subagents.allowAgents`: список agent id, які можна націлювати через `agentId` (`["*"]`, щоб дозволити будь-який). Типово: лише agent запитувача.
- `agents.defaults.subagents.allowAgents`: типова allowlist цільових агентів, яка використовується, коли agent запитувача не задає власний `subagents.allowAgents`.
- Guard успадкування sandbox: якщо session запитувача sandboxed, `sessions_spawn` відхиляє цілі, які працювали б без sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: коли `true`, блокують виклики `sessions_spawn`, у яких не задано `agentId` (примушує явний вибір profile). Типово: false.

Discovery:

- Використовуйте `agents_list`, щоб побачити, які agent id наразі дозволені для `sessions_spawn`.

Auto-archive:

- Сесії sub-agent автоматично архівуються після `agents.defaults.subagents.archiveAfterMinutes` (типово: 60).
- Архівація використовує `sessions.delete` і перейменовує transcript у `*.deleted.<timestamp>` (та сама папка).
- `cleanup: "delete"` архівує одразу після announce (але transcript усе одно зберігається через перейменування).
- Auto-archive має best-effort-характер; pending timers губляться, якщо gateway перезапускається.
- `runTimeoutSeconds` **не** робить auto-archive; він лише зупиняє run. Session залишається до auto-archive.
- Auto-archive однаково застосовується і до depth-1, і до depth-2 session.
- Browser cleanup відокремлений від archive cleanup: відстежувані вкладки/процеси browser best-effort закриваються після завершення run, навіть якщо transcript/session record зберігається.

## Вкладені Sub-agent-и

Типово sub-agent-и не можуть створювати власних sub-agent (`maxSpawnDepth: 1`). Ви можете увімкнути один рівень вкладення, задавши `maxSpawnDepth: 2`, що дозволяє **orchestrator pattern**: main → orchestrator sub-agent → worker sub-sub-agent-и.

### Як увімкнути

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Рівні глибини

| Depth | Session key shape                            | Role                                          | Can spawn?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Основний agent                                | Завжди                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrator, коли дозволено depth 2) | Лише якщо `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (leaf worker)                   | Ніколи                       |

### Ланцюжок announce

Результати рухаються вгору по ланцюгу:

1. Worker depth-2 завершується → оголошує результат своєму parent (orchestrator depth-1)
2. Orchestrator depth-1 отримує announce, синтезує результати, завершується → оголошує main
3. Основний agent отримує announce і доставляє його користувачу

Кожен рівень бачить announce лише від своїх прямих дітей.

Операційні рекомендації:

- Запускайте child-роботу один раз і чекайте на події completion замість того, щоб будувати цикли poll навколо `sessions_list`, `sessions_history`, `/subagents list` або команд `exec` зі sleep.
- Якщо подія completion child приходить після того, як ви вже надіслали фінальну відповідь, правильний follow-up — це точний silent token `NO_REPLY` / `no_reply`.

### Політика інструментів за глибиною

- Role і control scope записуються в metadata session під час spawn. Це не дозволяє пласким або відновленим session key випадково повернути orchestrator privileges.
- **Depth 1 (orchestrator, коли `maxSpawnDepth >= 2`)**: отримує `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, щоб керувати своїми child. Інші session/system tools і далі заборонені.
- **Depth 1 (leaf, коли `maxSpawnDepth == 1`)**: без session tools (поточна типова поведінка).
- **Depth 2 (leaf worker)**: без session tools — `sessions_spawn` завжди заборонений на глибині 2. Не може створювати подальших child.

### Ліміт spawn для окремого агента

Кожна session агента (на будь-якій глибині) може одночасно мати не більше `maxChildrenPerAgent` (типово: 5) active-child. Це запобігає неконтрольованому fan-out від одного orchestrator.

### Cascade stop

Зупинка orchestrator-а depth-1 автоматично зупиняє всіх його child depth-2:

- `/stop` у головному чаті зупиняє всіх agent-ів depth-1 і cascade-зупиняє їхніх child depth-2.
- `/subagents kill <id>` зупиняє конкретного sub-agent і cascade-зупиняє його child.
- `/subagents kill all` зупиняє всіх sub-agent для цього запитувача і cascade-зупиняє їх.

## Автентифікація

Auth sub-agent розв’язується за **agent id**, а не за типом session:

- Session key sub-agent має вигляд `agent:<agentId>:subagent:<uuid>`.
- Auth store завантажується з `agentDir` цього агента.
- Auth profile основного агента додаються як **fallback**; профілі агента мають пріоритет над профілями main у разі конфліктів.

Примітка: merge є additive, тому профілі main завжди доступні як fallback. Повністю ізольований auth для кожного агента наразі не підтримується.

## Announce

Sub-agent-и звітують назад через крок announce:

- Крок announce виконується всередині session sub-agent, а не session запитувача.
- Якщо sub-agent відповідає рівно `ANNOUNCE_SKIP`, нічого не публікується.
- Якщо найновіший текст assistant є точним silent token `NO_REPLY` / `no_reply`,
  announce output пригнічується, навіть якщо раніше існував видимий прогрес.
- Інакше доставка залежить від глибини запитувача:
  - top-level requester session використовують follow-up `agent` call із зовнішньою доставкою (`deliver=true`)
  - nested requester subagent session отримують внутрішню інжекцію follow-up (`deliver=false`), щоб orchestrator міг синтезувати результати child у межах session
  - якщо nested requester subagent session уже відсутня, OpenClaw використовує fallback до requester цієї session, коли це можливо
- Для top-level requester session direct delivery у режимі completion спочатку розв’язує будь-який bound conversation/thread route і hook override, а потім заповнює відсутні channel-target поля зі збереженого route session запитувача. Це утримує completion у правильному chat/topic, навіть коли origin completion ідентифікує лише channel.
- Aggregation completion child обмежується поточним requester run під час побудови nested completion findings, що не дозволяє застарілим output child із попередніх запусків потрапляти в поточний announce.
- Announce reply зберігають маршрутизацію thread/topic, коли вона доступна на channel adapter-ах.
- Контекст announce нормалізується до стабільного внутрішнього event block:
  - джерело (`subagent` або `cron`)
  - key/id child session
  - тип announce + task label
  - рядок status, похідний від runtime outcome (`success`, `error`, `timeout` або `unknown`)
  - контент result, вибраний із найновішого видимого тексту assistant, інакше — з sanitized latest tool/toolResult text; terminal failed run повідомляють про статус failure без повторного програвання captured reply text
  - follow-up instruction, що описує, коли відповідати, а коли лишатися silent
- `Status` не виводиться з output моделі; він походить із сигналів runtime outcome.
- При timeout, якщо child встиг лише до tool call, announce може згорнути цю історію в коротке summary часткового прогресу замість повторного відтворення сирого tool output.

Payload-и announce включають рядок stats наприкінці (навіть коли обгорнуті):

- Runtime (наприклад `runtime 5m12s`)
- Використання токенів (input/output/total)
- Оцінену вартість, коли для моделі налаштовано pricing (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` і шлях до transcript (щоб основний агент міг отримати history через `sessions_history` або перевірити файл на диску)
- Внутрішні metadata призначені лише для orchestration; user-facing replies мають бути переписані звичайним голосом асистента.

`sessions_history` — це безпечніший шлях orchestration:

- recall assistant спочатку нормалізується:
  - thinking-tags прибираються
  - scaffold-блоки `<relevant-memories>` / `<relevant_memories>` прибираються
  - plain-text XML payload-блоки викликів tools, такі як `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` і
    `<function_calls>...</function_calls>`, прибираються, включно з обрізаними
    payload, які так і не закрилися коректно
  - downgraded scaffold-и tool-call/result та historical-context markers прибираються
  - leaked control token-и моделі, такі як `<|assistant|>`, інші ASCII
    token-и `<|...|>` і full-width варіанти `<｜...｜>`, прибираються
  - malformed XML tool-call від MiniMax прибирається
- Текст, схожий на credential/token, редагується
- Довгі blocks можуть обрізатися
- Дуже великі history можуть відкидати старіші рядки або замінювати надто великий рядок на
  `[sessions_history omitted: message too large]`
- Перегляд сирого transcript на диску — це fallback, коли вам потрібен повний transcript байт-у-байт

## Політика інструментів (інструменти sub-agent)

Типово sub-agent-и отримують **усі інструменти, крім session tools** і system tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` і тут залишається обмеженим, sanitized-виглядом recall; це
не сирий transcript dump.

Коли `maxSpawnDepth >= 2`, sub-agent-и-orchestrator-и depth-1 додатково отримують `sessions_spawn`, `subagents`, `sessions_list` і `sessions_history`, щоб мати змогу керувати своїми child.

Перевизначення через конфігурацію:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrency

Sub-agent-и використовують окремий in-process queue lane:

- Назва lane: `subagent`
- Concurrency: `agents.defaults.subagents.maxConcurrent` (типово `8`)

## Зупинка

- Надсилання `/stop` у чаті запитувача перериває session запитувача і зупиняє всі active run sub-agent, створені з неї, каскадно зупиняючи вкладених child.
- `/subagents kill <id>` зупиняє конкретного sub-agent і каскадно зупиняє його child.

## Обмеження

- Announce sub-agent є **best-effort**. Якщо gateway перезапуститься, відкладена робота “announce back” буде втрачена.
- Sub-agent-и все ще ділять ресурси того самого процесу gateway; ставтеся до `maxConcurrent` як до запобіжного клапана.
- `sessions_spawn` завжди non-blocking: він одразу повертає `{ status: "accepted", runId, childSessionKey }`.
- Контекст sub-agent інжектує лише `AGENTS.md` + `TOOLS.md` (без `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` або `BOOTSTRAP.md`).
- Максимальна глибина вкладення — 5 (`maxSpawnDepth` у діапазоні 1–5). Для більшості випадків рекомендована глибина 2.
- `maxChildrenPerAgent` обмежує кількість active-child для однієї session (типово: 5, діапазон: 1–20).
