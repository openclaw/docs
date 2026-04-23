---
read_when:
    - Запуск coding harness через ACP
    - Налаштування ACP-сесій, прив’язаних до conversation, у каналах обміну повідомленнями
    - Прив’язка conversation каналу повідомлень до постійної ACP-сесії
    - Усунення несправностей backend-а ACP і wiring Plugin
    - Налагодження доставки ACP completion або циклів agent-to-agent
    - Керування командами /acp з чату
summary: Використання runtime-сесій ACP для Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP та інших harness-агентів
title: ACP-агенти
x-i18n:
    generated_at: "2026-04-23T21:13:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f7a47390cf8cad0363f0d1f03e58a229c9fcc7ac6ad4c86392925c42383bb83
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) сесії дають OpenClaw змогу запускати зовнішні coding harness (наприклад Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI та інші підтримувані ACPX harness) через ACP backend Plugin.

Якщо ви просите OpenClaw звичайною мовою “запусти це в Codex” або “запусти Claude Code у thread”, OpenClaw має маршрутизувати цей запит до runtime ACP (а не до native runtime sub-agent). Кожен spawn ACP-сесії відстежується як [фонове завдання](/uk/automation/tasks).

Якщо ви хочете, щоб Codex або Claude Code підключалися як зовнішній MCP client
безпосередньо до наявних channel conversation OpenClaw, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp) замість ACP.

## Яка сторінка мені потрібна?

Поруч є три поверхні, які легко сплутати:

| Ви хочете...                                                                     | Використовуйте це                       | Примітки                                                                                                       |
| --------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Запускати Codex, Claude Code, Gemini CLI або інший зовнішній harness _через_ OpenClaw | Ця сторінка: ACP-агенти                | Chat-bound сесії, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, runtime-контролі       |
| Відкрити сесію OpenClaw Gateway _як_ ACP server для редактора або client          | [`openclaw acp`](/uk/cli/acp)             | Режим bridge. IDE/client говорить з OpenClaw по ACP через stdio/WebSocket                                      |
| Повторно використовувати локальний AI CLI як text-only fallback model             | [CLI Backends](/uk/gateway/cli-backends)  | Не ACP. Немає інструментів OpenClaw, немає ACP-controls, немає harness runtime                                 |

## Чи працює це одразу?

Зазвичай так. Свіжі встановлення постачають вбудований runtime Plugin `acpx`, увімкнений за замовчуванням, із plugin-local pinned binary `acpx`, який OpenClaw перевіряє й самовідновлює під час запуску. Виконайте `/acp doctor` для перевірки готовності.

Типові пастки першого запуску:

- Цільові harness-adapter-и (Codex, Claude тощо) можуть підтягуватися на вимогу через `npx` під час першого використання.
- Vendor auth все одно має існувати на хості для цього harness.
- Якщо на хості немає npm або доступу до мережі, перше завантаження adapter-ів завершиться помилкою, доки кеші не буде прогріто або adapter не буде встановлено іншим способом.

## Runbook оператора

Швидкий потік `/acp` із чату:

1. **Spawn** — `/acp spawn codex --bind here` або `/acp spawn codex --mode persistent --thread auto`
2. **Працюйте** у прив’язаній conversation або thread (або явно націлюйтеся на session key).
3. **Перевіряйте стан** — `/acp status`
4. **Налаштовуйте** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Скеровуйте** без заміни контексту — `/acp steer tighten logging and continue`
6. **Зупиняйте** — `/acp cancel` (поточний хід) або `/acp close` (сесія + bindings)

Тригери природною мовою, які мають маршрутизуватися до runtime ACP:

- “Bind this Discord channel to Codex.”
- “Start a persistent Codex session in a thread here.”
- “Run this as a one-shot Claude Code ACP session and summarize the result.”
- “Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread.”

OpenClaw вибирає `runtime: "acp"`, розв’язує harness `agentId`, прив’язує до поточної conversation або thread, коли це підтримується, і маршрутизує follow-up у цю сесію до close/expiry.

## ACP проти sub-agent

Використовуйте ACP, коли вам потрібен зовнішній harness runtime. Використовуйте sub-agent, коли вам потрібні делеговані запуски, native для OpenClaw.

| Area          | ACP session                           | Sub-agent run                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP backend Plugin (наприклад acpx)   | Native runtime sub-agent OpenClaw  |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Main commands | `/acp ...`                            | `/subagents ...`                   |
| Spawn tool    | `sessions_spawn` з `runtime:"acp"`    | `sessions_spawn` (типовий runtime) |

Див. також [Sub-agents](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Control plane ACP session OpenClaw
2. вбудований runtime Plugin `acpx`
3. Claude ACP adapter
4. runtime/session machinery на боці Claude

Важлива відмінність:

- ACP Claude — це harness-сесія з ACP-controls, resume сесії, відстеженням фонових завдань і необов’язковою прив’язкою conversation/thread.
- CLI backends — це окремі text-only локальні fallback-runtime. Див. [CLI Backends](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- хочете `/acp spawn`, bindable-сесії, runtime-контролі або постійну harness-роботу: використовуйте ACP
- хочете простий локальний text fallback через сирий CLI: використовуйте CLI backends

## Прив’язані сесії

### Прив’язки до поточної conversation

`/acp spawn <harness> --bind here` прив’язує поточну conversation до створеної ACP-сесії — без дочірнього thread, у тій самій chat-поверхні. OpenClaw і далі володіє transport, auth, safety і delivery; follow-up-повідомлення в цій conversation маршрутизуються до тієї самої сесії; `/new` і `/reset` скидають сесію на місці; `/acp close` прибирає прив’язку.

Ментальна модель:

- **chat surface** — місце, де люди продовжують говорити (канал Discord, тема Telegram, чат iMessage).
- **ACP session** — сталий runtime-стан Codex/Claude/Gemini, до якого маршрутизує OpenClaw.
- **child thread/topic** — необов’язкова додаткова messaging-поверхня, яка створюється лише через `--thread ...`.
- **runtime workspace** — розташування файлової системи (`cwd`, checkout репозиторію, workspace backend-а), де працює harness. Воно незалежне від chat surface.

Приклади:

- `/acp spawn codex --bind here` — залишити цей чат, створити або приєднати Codex, маршрутизувати майбутні повідомлення сюди.
- `/acp spawn codex --thread auto` — OpenClaw може створити дочірній thread/topic і прив’язати його туди.
- `/acp spawn codex --bind here --cwd /workspace/repo` — та сама chat-прив’язка, Codex працює в `/workspace/repo`.

Примітки:

- `--bind here` і `--thread ...` взаємовиключні.
- `--bind here` працює лише на каналах, які оголошують current-conversation binding; інакше OpenClaw повертає чітке повідомлення про непідтримуваність. Прив’язки зберігаються після перезапусків Gateway.
- У Discord `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити дочірній thread для `--thread auto|here` — не для `--bind here`.
- Якщо ви виконуєте spawn до іншого ACP agent без `--cwd`, OpenClaw типово успадковує workspace **цільового agent-а**. Відсутні успадковані шляхи (`ENOENT`/`ENOTDIR`) використовують fallback до типового backend-а; інші помилки доступу (наприклад `EACCES`) відображаються як помилки spawn.

### Сесії, прив’язані до thread

Коли для channel adapter увімкнено thread bindings, ACP-сесії можна прив’язувати до thread:

- OpenClaw прив’язує thread до цільової ACP session.
- Follow-up-повідомлення в цьому thread маршрутизуються до прив’язаної ACP session.
- Вивід ACP доставляється назад у той самий thread.
- Unfocus/close/archive/idle-timeout або expiry за max-age прибирають прив’язку.

Підтримка thread binding залежить від adapter-а. Якщо активний channel adapter не підтримує thread bindings, OpenClaw повертає чітке повідомлення unsupported/unavailable.

Потрібні feature flags для ACP, прив’язаного до thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` типово увімкнено (задайте `false`, щоб призупинити ACP dispatch)
- Увімкнений ACP thread-spawn flag channel-adapter-а (adapter-specific)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Канали, що підтримують thread

- Будь-який channel adapter, який відкриває можливість session/thread binding.
- Поточна вбудована підтримка:
  - Discord threads/channels
  - Telegram topics (теми форуму в groups/supergroups і DM topics)
- Plugin channels можуть додати підтримку через той самий binding interface.

## Налаштування, специфічні для каналу

Для неепемерних workflow налаштовуйте постійні ACP bindings у top-level-записах `bindings[]`.

### Модель binding

- `bindings[].type="acp"` позначає постійну ACP conversation binding.
- `bindings[].match` визначає цільову conversation:
  - Discord channel або thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/group chat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних group binding віддавайте перевагу `chat_id:*` або `chat_identifier:*`.
  - iMessage DM/group chat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних group binding віддавайте перевагу `chat_id:*`.
- `bindings[].agentId` — це ID агента OpenClaw, який володіє прив’язкою.
- Необов’язкові ACP override-и містяться в `bindings[].acp`:
  - `mode` (`persistent` або `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Типові значення runtime для кожного агента

Використовуйте `agents.list[].runtime`, щоб один раз визначити ACP-типові значення для кожного агента:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID harness, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Пріоритет override для ACP bound session:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. глобальні ACP-типові значення (наприклад `acp.backend`)

Приклад:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Поведінка:

- OpenClaw гарантує, що налаштована ACP session існує до використання.
- Повідомлення в цьому каналі або topic маршрутизуються до налаштованої ACP session.
- У прив’язаних conversation `/new` і `/reset` скидають той самий ACP session key на місці.
- Тимчасові runtime bindings (наприклад створені потоками thread-focus) і далі застосовуються там, де вони є.
- Для ACP spawn між агентами без явного `cwd` OpenClaw успадковує workspace цільового агента з конфігурації агента.
- Відсутні успадковані шляхи workspace використовують fallback до типового `cwd` backend-а; помилки доступу до наявних шляхів відображаються як помилки spawn.

## Запуск ACP session (інтерфейси)

### З `sessions_spawn`

Використовуйте `runtime: "acp"`, щоб запускати ACP session із ходу агента або виклику tool.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Примітки:

- `runtime` типово дорівнює `subagent`, тому для ACP-сесій задавайте `runtime: "acp"` явно.
- Якщо `agentId` не задано, OpenClaw використовує `acp.defaultAgent`, коли його налаштовано.
- `mode: "session"` потребує `thread: true`, щоб зберігати постійну bound conversation.

Деталі інтерфейсу:

- `task` (обов’язково): початковий prompt, який надсилається до ACP session.
- `runtime` (обов’язково для ACP): має бути `"acp"`.
- `agentId` (необов’язково): ID цільового harness ACP. Використовує fallback до `acp.defaultAgent`, якщо його задано.
- `thread` (необов’язково, типово `false`): запитати потік thread binding, де це підтримується.
- `mode` (необов’язково): `run` (одноразово) або `session` (постійно).
  - типове значення — `run`
  - якщо `thread: true`, а mode не задано, OpenClaw може типово перейти до постійної поведінки залежно від runtime path
  - `mode: "session"` потребує `thread: true`
- `cwd` (необов’язково): запитаний runtime working directory (валідується backend/runtime policy). Якщо не задано, ACP spawn успадковує workspace цільового агента, коли його налаштовано; відсутні успадковані шляхи використовують fallback до типових значень backend-а, а реальні помилки доступу повертаються як помилки.
- `label` (необов’язково): орієнтована на оператора мітка, яка використовується в тексті session/banner.
- `resumeSessionId` (необов’язково): відновити наявну ACP session замість створення нової. Агент повторно програє свою історію conversation через `session/load`. Потребує `runtime: "acp"`.
- `streamTo` (необов’язково): `"parent"` передає короткі зведення прогресу початкового ACP run назад у сесію запитувача як системні події.
  - Коли це доступно, accepted-відповіді містять `streamLogPath`, що вказує на session-scoped JSONL log (`<sessionId>.acp-stream.jsonl`), який можна переглядати для повної історії relay.
- `model` (необов’язково): явний override моделі для ACP child session. Для `runtime: "acp"` він враховується, тож child використовує запитану модель замість тихого fallback до типового агента цілі.

## Модель доставки

ACP-сесії можуть бути або interactive workspace, або фоновою роботою, якою володіє parent. Шлях доставки залежить від цієї форми.

### Interactive ACP-сесії

Interactive-сесії призначені для продовження розмови на видимій chat-поверхні:

- `/acp spawn ... --bind here` прив’язує поточну conversation до ACP session.
- `/acp spawn ... --thread ...` прив’язує channel thread/topic до ACP session.
- Постійні налаштовані `bindings[].type="acp"` маршрутизують відповідні conversation до тієї самої ACP session.

Follow-up-повідомлення в bound conversation маршрутизуються безпосередньо до ACP session, а вивід ACP доставляється назад у той самий channel/thread/topic.

### Parent-owned one-shot ACP-сесії

One-shot ACP-сесії, створені іншим agent run, є фоновими child, подібно до sub-agent:

- Parent запитує роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Child виконується у власній ACP harness session.
- Completion повертається через внутрішній шлях announce про завершення завдання.
- Parent переписує результат child звичайним голосом асистента, коли потрібна user-facing-відповідь.

Не трактуйте цей шлях як peer-to-peer chat між parent і child. У child уже є канал completion назад до parent.

### `sessions_send` і доставка A2A

`sessions_send` може націлюватися на іншу session після spawn. Для звичайних peer-session OpenClaw використовує шлях follow-up agent-to-agent (A2A) після інжекції повідомлення:

- чекати на відповідь цільової session
- за бажанням дозволити обмежену кількість follow-up-ходів між запитувачем і ціллю
- попросити цільову сторону створити announce-повідомлення
- доставити це announce у видимий канал або thread

Цей шлях A2A є fallback для peer-send, коли відправнику потрібен видимий follow-up. Він залишається ввімкненим, коли не пов’язана session може бачити й надсилати повідомлення ACP-цілі, наприклад при широких налаштуваннях `tools.sessions.visibility`.

OpenClaw пропускає follow-up A2A лише тоді, коли запитувач є parent для власного one-shot ACP child, яким він володіє. У такому разі запуск A2A поверх task completion може розбудити parent результатом child, переслати відповідь parent назад у child і створити цикл відлуння parent/child. Результат `sessions_send` повідомляє `delivery.status="skipped"` для такого випадку owned-child, тому що шлях completion уже відповідає за результат.

### Відновлення наявної сесії

Використовуйте `resumeSessionId`, щоб продовжити попередню ACP session замість запуску з нуля. Агент повторно програє свою історію conversation через `session/load`, тому підхоплює повний контекст попередньої роботи.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Типові випадки використання:

- Передати session Codex з ноутбука на телефон — сказати агенту продовжити там, де ви зупинилися
- Продовжити coding session, розпочату інтерактивно в CLI, тепер безголово через агента
- Підхопити роботу, яку перервав restart Gateway або idle timeout

Примітки:

- `resumeSessionId` потребує `runtime: "acp"` — повертає помилку, якщо використовується з runtime sub-agent.
- `resumeSessionId` відновлює історію conversation upstream ACP; `thread` і `mode` усе одно застосовуються як завжди до нової session OpenClaw, яку ви створюєте, тож `mode: "session"` і далі потребує `thread: true`.
- Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
- Якщо ID сесії не знайдено, spawn завершується з чіткою помилкою — без тихого fallback до нової session.

<Accordion title="Smoke-тест після деплою">

Після деплою Gateway запускайте live end-to-end-перевірку, а не покладайтеся лише на unit-тести:

1. Перевірте версію і commit розгорнутого Gateway на цільовому хості.
2. Відкрийте тимчасову bridge-session ACPX до live agent.
3. Попросіть цього агента викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Переконайтеся, що є `accepted=yes`, реальний `childSessionKey` і відсутня validator-помилка.
5. Очистіть тимчасову bridge-session.

Тримайте gate на `mode: "run"` і пропускайте `streamTo: "parent"` — thread-bound `mode: "session"` і stream-relay-шляхи є окремими, багатшими інтеграційними проходами.

</Accordion>

## Сумісність із sandbox

ACP-сесії наразі працюють у host runtime, а не всередині sandbox OpenClaw.

Поточні обмеження:

- Якщо session запитувача sandboxed, ACP spawn блокуються і для `sessions_spawn({ runtime: "acp" })`, і для `/acp spawn`.
  - Помилка: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.
  - Помилка: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Використовуйте `runtime: "subagent"`, коли вам потрібне виконання з примусовим sandbox.

### З команди `/acp`

Використовуйте `/acp spawn` для явного операторського керування з чату, коли це потрібно.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Ключові прапорці:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Див. [Slash Commands](/uk/tools/slash-commands).

## Розв’язання цілі сесії

Більшість дій `/acp` приймають необов’язкову ціль сесії (`session-key`, `session-id` або `session-label`).

Порядок розв’язання:

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - спочатку пробує key
   - потім session id у форматі UUID
   - потім label
2. Поточний thread binding (якщо ця conversation/thread прив’язана до ACP session)
3. Fallback до поточної session запитувача

Current-conversation bindings і thread bindings обидва беруть участь у кроці 2.

Якщо ціль не розв’язується, OpenClaw повертає чітку помилку (`Unable to resolve session target: ...`).

## Режими spawn bind

`/acp spawn` підтримує `--bind here|off`.

| Mode   | Behavior                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | Прив’язати поточну active conversation на місці; завершитися помилкою, якщо жодної active conversation немає. |
| `off`  | Не створювати current-conversation binding.                            |

Примітки:

- `--bind here` — це найпростіший операторський шлях для “зробити цей канал або чат підкріпленим Codex.”
- `--bind here` не створює дочірній thread.
- `--bind here` доступний лише на каналах, які відкривають current-conversation binding.
- `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

## Режими spawn thread

`/acp spawn` підтримує `--thread auto|here|off`.

| Mode   | Behavior                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | У активному thread: прив’язати цей thread. Поза thread: створити/прив’язати дочірній thread, якщо підтримується. |
| `here` | Вимагати поточний active thread; завершитися помилкою, якщо ви не в ньому.                         |
| `off`  | Без прив’язки. Session запускається як unbound.                                                     |

Примітки:

- На поверхнях без thread binding типова поведінка фактично є `off`.
- Thread-bound spawn потребує підтримки channel policy:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Використовуйте `--bind here`, коли хочете закріпити поточну conversation без створення дочірнього thread.

## ACP-контролі

| Command              | What it does                                              | Example                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створити ACP session; необов’язкова current bind або thread bind. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасувати хід in-flight для цільової session.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надіслати steer-інструкцію до запущеної session.          | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закрити session і відв’язати цілі thread.                 | `/acp close`                                                  |
| `/acp status`        | Показати backend, mode, state, runtime options, capabilities. | `/acp status`                                                 |
| `/acp set-mode`      | Задати runtime mode для цільової session.                 | `/acp set-mode plan`                                          |
| `/acp set`           | Універсальний запис параметра runtime config.             | `/acp set model openai/gpt-5.5`                               |
| `/acp cwd`           | Задати override runtime working directory.                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Задати профіль політики approval.                         | `/acp permissions strict`                                     |
| `/acp timeout`       | Задати timeout runtime (секунди).                         | `/acp timeout 120`                                            |
| `/acp model`         | Задати override runtime model.                            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Прибрати override параметрів runtime для session.         | `/acp reset-options`                                          |
| `/acp sessions`      | Перелічити нещодавні ACP session зі store.                | `/acp sessions`                                               |
| `/acp doctor`        | Стан backend, capabilities, дієві виправлення.            | `/acp doctor`                                                 |
| `/acp install`       | Вивести детерміновані кроки встановлення й увімкнення.    | `/acp install`                                                |

`/acp status` показує ефективні runtime options плюс session identifier-и на рівні runtime і backend. Помилки unsupported-control чітко відображаються, коли backend не має певної можливості. `/acp sessions` читає store для поточної bound або requester session; target token-и (`session-key`, `session-id` або `session-label`) розв’язуються через виявлення session Gateway, включно з custom-root `session.store` для окремих агентів.

## Мапінг runtime options

`/acp` має convenience-команди й універсальний setter.

Еквівалентні операції:

- `/acp model <id>` мапиться на runtime config key `model`.
- `/acp permissions <profile>` мапиться на runtime config key `approval_policy`.
- `/acp timeout <seconds>` мапиться на runtime config key `timeout`.
- `/acp cwd <path>` напряму оновлює override runtime cwd.
- `/acp set <key> <value>` — це універсальний шлях.
  - Особливий випадок: `key=cwd` використовує шлях override для cwd.
- `/acp reset-options` очищає всі runtime override для цільової session.

## Підтримка harness acpx (поточна)

Поточні вбудовані alias-и harness acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Коли OpenClaw використовує backend acpx, віддавайте перевагу цим значенням для `agentId`, якщо тільки ваша конфігурація acpx не визначає custom alias-и агентів.
Якщо ваша локальна інсталяція Cursor усе ще відкриває ACP як `agent acp`, перевизначте команду агента `cursor` у своїй конфігурації acpx замість зміни вбудованого типового значення.

Пряме використання CLI acpx також може націлюватися на довільні adapter-и через `--agent <command>`, але цей raw аварійний виняток є можливістю CLI acpx (а не звичайним шляхом `agentId` у OpenClaw).

## Потрібна конфігурація

Базова конфігурація ACP у core:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Конфігурація thread binding є channel-adapter-specific. Приклад для Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Якщо thread-bound ACP spawn не працює, спочатку перевірте feature flag adapter-а:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Current-conversation binds не потребують створення child-thread. Вони потребують active conversation context і channel adapter, який відкриває ACP conversation bindings.

Див. [Configuration Reference](/uk/gateway/configuration-reference).

## Налаштування Plugin для backend acpx

Свіжі встановлення постачають вбудований runtime Plugin `acpx`, увімкнений за замовчуванням, тому ACP
зазвичай працює без кроку ручного встановлення Plugin.

Почніть з:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете
перемкнутися на локальний checkout для розробки, використовуйте явний шлях Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Встановлення з локального workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан backend-а:

```text
/acp doctor
```

### Налаштування команди та версії acpx

Типово вбудований Plugin `acpx` використовує свій plugin-local pinned binary (`node_modules/.bin/acpx` усередині пакета Plugin). Під час запуску backend реєструється як not-ready, а фонове завдання перевіряє `acpx --version`; якщо binary відсутній або має невідповідну версію, виконується `npm install --omit=dev --no-save acpx@<pinned>`, а потім перевірка повторюється. Gateway увесь цей час залишається non-blocking.

Перевизначайте команду або версію в конфігурації Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` приймає абсолютний шлях, відносний шлях (розв’язується відносно workspace OpenClaw) або ім’я команди.
- `expectedVersion: "any"` вимикає сувору перевірку відповідності версії.
- Custom-шляхи `command` вимикають plugin-local auto-install.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви глобально встановлюєте OpenClaw через `npm install -g openclaw`, runtime-залежності acpx
(binary, специфічні для платформи) встановлюються автоматично
через postinstall hook. Якщо автоматичне встановлення завершується помилкою, gateway усе одно запускається
нормально й повідомляє про відсутню залежність через `openclaw acp doctor`.

### Plugin tools MCP bridge

Типово ACPX-сесії **не** відкривають до ACP harness інструменти, зареєстровані Plugin OpenClaw.

Якщо ви хочете, щоб ACP-агенти на кшталт Codex або Claude Code могли викликати
встановлені plugin tools OpenClaw, наприклад memory recall/store, увімкніть окремий bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Інжектує в bootstrap ACPX session вбудований MCP server з назвою `openclaw-plugin-tools`.
- Відкриває plugin tools, уже зареєстровані встановленими та увімкненими Plugins OpenClaw.
- Зберігає цю можливість явною і типово вимкненою.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів ACP harness.
- ACP-агенти отримують доступ лише до тих plugin tools, які вже активні в gateway.
- Ставтеся до цього як до тієї самої межі довіри, що й до дозволу цим Plugins виконуватися в самому OpenClaw.
- Перевіряйте встановлені Plugins перед увімкненням.

Custom `mcpServers` і далі працюють як раніше. Вбудований bridge plugin-tools —
це додаткова opt-in-зручність, а не заміна універсальної конфігурації MCP server.

### OpenClaw tools MCP bridge

Типово ACPX-сесії також **не** відкривають вбудовані інструменти OpenClaw через
MCP. Увімкніть окремий bridge core-tools, коли ACP-агенту потрібні вибрані
вбудовані інструменти, наприклад `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Інжектує в bootstrap ACPX session вбудований MCP server з назвою `openclaw-tools`.
- Відкриває вибрані вбудовані інструменти OpenClaw. Початково server відкриває `cron`.
- Зберігає відкриття core-tools явним і типово вимкненим.

### Налаштування timeout runtime

Вбудований Plugin `acpx` типово задає timeout у 120 секунд для embedded runtime turn.
Це дає повільнішим harness, таким як Gemini CLI, достатньо часу завершити
ACP startup та ініціалізацію. Перевизначте це, якщо вашому хосту потрібен інший
runtime limit:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть gateway.

### Налаштування probe-agent для health

Вбудований Plugin `acpx` перевіряє одного harness-агента, коли вирішує, чи готовий
embedded runtime backend. Типово це `codex`. Якщо у вашому розгортанні використовується інший типовий ACP-агент, задайте probe-agent на той самий id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть gateway.

## Налаштування дозволів

ACP-сесії працюють неінтерактивно — немає TTY, у якому можна було б схвалювати або відхиляти prompts на permission для file-write і shell-exec. Plugin acpx надає два ключі конфігурації, які керують тим, як обробляються дозволи:

Ці дозволи ACPX harness відокремлені від exec approval OpenClaw і від bypass-прапорців vendor-а для CLI-backend, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це harness-level аварійний вимикач для ACP-сесій.

### `permissionMode`

Керує тим, які операції harness-агент може виконувати без prompt.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Автоматично схвалювати всі file write і shell commands.   |
| `approve-reads` | Автоматично схвалювати лише read; write і exec потребують prompt. |
| `deny-all`      | Відхиляти всі permission prompt.                          |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би з’явитися permission prompt, але інтерактивний TTY недоступний (а для ACP-сесій це так завжди).

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Перервати session з `AcpRuntimeError`. **(типово)**               |
| `deny` | Тихо відхилити дозвіл і продовжити (graceful degradation).        |

### Конфігурація

Задається через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть gateway.

> **Важливо:** OpenClaw наразі типово використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних ACP-сесіях будь-який write або exec, який викликає permission prompt, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Якщо вам потрібно обмежити дозволи, задайте `nonInteractivePermissions` як `deny`, щоб сесії деградували коректно замість аварійного завершення.

## Усунення несправностей

| Symptom                                                                     | Likely cause                                                                    | Fix                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Відсутній або вимкнений Plugin backend-а.                                       | Встановіть і ввімкніть Plugin backend-а, а потім виконайте `/acp doctor`.                                                                                        |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                         | Задайте `acp.enabled=true`.                                                                                                                                       |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Вимкнено dispatch зі звичайних thread-повідомлень.                              | Задайте `acp.dispatch.enabled=true`.                                                                                                                              |
| `ACP agent "<id>" is not allowed by policy`                                 | Агент відсутній у allowlist.                                                    | Використовуйте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                             |
| `Unable to resolve session target: ...`                                     | Неправильний token key/id/label.                                                | Виконайте `/acp sessions`, скопіюйте точний key/label і повторіть спробу.                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без active bindable conversation.                     | Перейдіть у цільовий chat/channel і повторіть спробу або використайте unbound spawn.                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter не має можливості ACP binding для current-conversation.                 | Використовуйте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте top-level `bindings[]` або перейдіть у підтримуваний канал.                      |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом thread.                             | Перейдіть у цільовий thread або використайте `--thread auto`/`off`.                                                                                              |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє active binding target.                                 | Переприв’яжіть як власник або використайте іншу conversation чи thread.                                                                                          |
| `Thread bindings are unavailable for <channel>.`                            | Adapter не має можливості thread binding.                                       | Використовуйте `--thread off` або перейдіть до підтримуваного adapter/channel.                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP працює на хості; session запитувача sandboxed.                      | Використовуйте `runtime="subagent"` із sandboxed-сесій або запускайте ACP spawn із не-sandboxed session.                                                        |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Для runtime ACP запитано `sandbox="require"`.                                   | Використовуйте `runtime="subagent"` для обов’язкового sandboxing або використовуйте ACP із `sandbox="inherit"` з не-sandboxed session.                          |
| Missing ACP metadata for bound session                                      | Застарілі/видалені ACP metadata сесії.                                          | Створіть заново через `/acp spawn`, а потім знову прив’яжіть/focus thread.                                                                                       |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує write/exec у неінтерактивній ACP-сесії.                 | Задайте `plugins.entries.acpx.config.permissionMode` як `approve-all` і перезапустіть gateway. Див. [Налаштування дозволів](#permission-configuration).        |
| ACP session fails early with little output                                  | Permission prompt блокуються через `permissionMode`/`nonInteractivePermissions`. | Перевірте логи gateway на `AcpRuntimeError`. Для повних дозволів задайте `permissionMode=approve-all`; для graceful degradation задайте `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Процес harness завершився, але ACP session не повідомила про completion.        | Відстежуйте через `ps aux \| grep acpx`; вручну завершуйте застарілі процеси.                                                                                   |
