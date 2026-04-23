---
read_when:
    - Ви хочете детерміновані багатокрокові робочі процеси з явними approvals
    - Вам потрібно відновити робочий процес без повторного запуску попередніх кроків
summary: Типізований runtime робочих процесів для OpenClaw із відновлюваними approval gates.
title: Lobster
x-i18n:
    generated_at: "2026-04-23T21:15:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster — це оболонка робочих процесів, яка дає змогу OpenClaw запускати багатокрокові послідовності tools як одну детерміновану операцію з явними approval checkpoints.

Lobster — це рівень авторингу на один щабель вище за відокремлену фонову роботу. Для оркестрації flow поверх окремих tasks див. [Task Flow](/uk/automation/taskflow) (`openclaw tasks flow`). Для журналу активності tasks див. [`openclaw tasks`](/uk/automation/tasks).

## Hook

Ваш асистент може створювати tools, які керують ним самим. Попросіть робочий процес — і через 30 хвилин у вас буде CLI плюс pipelines, що виконуються одним викликом. Lobster — це відсутня ланка: детерміновані pipelines, явні approvals і відновлюваний стан.

## Навіщо

Сьогодні складні робочі процеси вимагають багатьох викликів tools туди-сюди. Кожен виклик коштує токенів, і LLM має оркеструвати кожен крок. Lobster переносить цю оркестрацію в типізований runtime:

- **Один виклик замість багатьох**: OpenClaw виконує один виклик tool Lobster і отримує структурований результат.
- **Approvals вбудовані**: побічні ефекти (надіслати email, опублікувати коментар) зупиняють робочий процес до явного схвалення.
- **Відновлюваність**: зупинені робочі процеси повертають token; схваліть і відновіть без повторного запуску всього.

## Навіщо DSL замість звичайних програм?

Lobster навмисно невеликий. Мета не в тому, щоб створити «нову мову», а в тому, щоб мати передбачувану, дружню до AI специфікацію pipeline з first-class approvals і resume token.

- **Approve/resume вбудовано**: звичайна програма може запитати людину, але не може _призупинитися і відновитися_ з довговічним token, якщо ви самі не створите такий runtime.
- **Детермінованість + аудитованість**: pipelines — це дані, тому їх легко логувати, порівнювати, відтворювати й перевіряти.
- **Обмежена поверхня для AI**: маленька граматика + JSON piping зменшують «креативні» шляхи коду і роблять валідацію реалістичною.
- **Політика безпеки вбудована**: тайм-аути, ліміти виводу, перевірки sandbox і allowlist примусово забезпечуються runtime, а не кожним окремим скриптом.
- **Все ще програмовано**: кожен крок може викликати будь-який CLI або скрипт. Якщо вам потрібен JS/TS, генеруйте файли `.lobster` з коду.

## Як це працює

OpenClaw запускає робочі процеси Lobster **всередині процесу** через вбудований runner. Жоден зовнішній CLI subprocess не запускається; рушій робочих процесів виконується всередині процесу gateway і напряму повертає JSON envelope.
Якщо pipeline зупиняється для approval, tool повертає `resumeToken`, щоб ви могли продовжити пізніше.

## Шаблон: невеликий CLI + JSON pipes + approvals

Створюйте маленькі команди, які «говорять» JSON, а потім об’єднуйте їх в один виклик Lobster. (Назви команд у прикладах нижче — лише приклади; підставте свої.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Якщо pipeline запитує approval, відновіть його за token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI запускає workflow; Lobster виконує кроки. Approval gates роблять побічні ефекти явними та аудитованими.

Приклад: перетворення вхідних елементів у виклики tools:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## LLM-кроки лише з JSON (`llm-task`)

Для робочих процесів, яким потрібен **структурований LLM-крок**, увімкніть необов’язковий
Plugin tool `llm-task` і викликайте його з Lobster. Це зберігає детермінованість
робочого процесу, але все ще дозволяє класифікувати/підсумовувати/створювати чернетки за допомогою моделі.

Увімкніть tool:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Використання в pipeline:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Подробиці та параметри конфігурації див. у [LLM Task](/uk/tools/llm-task).

## Файли робочих процесів (.lobster)

Lobster може запускати YAML/JSON-файли робочих процесів з полями `name`, `args`, `steps`, `env`, `condition` і `approval`. У викликах tool OpenClaw задайте `pipeline` як шлях до файла.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Примітки:

- `stdin: $step.stdout` і `stdin: $step.json` передають вивід попереднього кроку.
- `condition` (або `when`) може використовуватися для gating кроків на основі `$step.approved`.

## Встановлення Lobster

Вбудовані робочі процеси Lobster запускаються в процесі; окремий бінарний файл `lobster` не потрібен. Вбудований runner постачається разом із Plugin Lobster.

Якщо вам потрібен окремий CLI Lobster для розробки або зовнішніх pipelines, установіть його з [repo Lobster](https://github.com/openclaw/lobster) і переконайтеся, що `lobster` є в `PATH`.

## Увімкнення tool

Lobster — це **необов’язковий** Plugin tool (типово не ввімкнений).

Рекомендовано (адитивно, безпечно):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Або для конкретного агента:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Уникайте `tools.allow: ["lobster"]`, якщо тільки ви свідомо не хочете працювати в режимі обмежувального allowlist.

Примітка: allowlist для необов’язкових Plugin є opt-in. Якщо ваш allowlist містить лише
tools Plugin (як-от `lobster`), OpenClaw зберігає core tools увімкненими. Щоб обмежити core
tools, також включіть до allowlist core tools або group, які вам потрібні.

## Приклад: тріаж email

Без Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

З Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Повертає JSON envelope (скорочено):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

Користувач схвалює → відновлення:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Один workflow. Детермінований. Безпечний.

## Параметри tool

### `run`

Запустити pipeline в режимі tool.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Запуск файла workflow з args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Продовжити зупинений workflow після approval.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Необов’язкові вхідні параметри

- `cwd`: Відносний робочий каталог для pipeline (має залишатися в межах робочого каталогу gateway).
- `timeoutMs`: Перервати workflow, якщо він перевищує цю тривалість (типово: 20000).
- `maxStdoutBytes`: Перервати workflow, якщо вивід перевищує цей розмір (типово: 512000).
- `argsJson`: Рядок JSON, що передається до `lobster run --args-json` (лише для файлів workflow).

## Вихідний envelope

Lobster повертає JSON envelope з одним із трьох статусів:

- `ok` → успішно завершено
- `needs_approval` → призупинено; для відновлення потрібен `requiresApproval.resumeToken`
- `cancelled` → явно відхилено або скасовано

Tool виводить envelope і в `content` (гарно форматований JSON), і в `details` (сирий об’єкт).

## Approvals

Якщо присутній `requiresApproval`, перегляньте prompt і вирішіть:

- `approve: true` → відновити та продовжити побічні ефекти
- `approve: false` → скасувати й завершити workflow

Використовуйте `approve --preview-from-stdin --limit N`, щоб додавати JSON preview до запитів approval без власного glue на `jq`/heredoc. Resume token тепер компактні: Lobster зберігає стан відновлення workflow у своєму каталозі стану й повертає невеликий token key.

## OpenProse

OpenProse добре поєднується з Lobster: використовуйте `/prose` для оркестрації багатосубагентної підготовки, а потім запускайте pipeline Lobster для детермінованих approvals. Якщо програмі Prose потрібен Lobster, дозвольте tool `lobster` для субагентів через `tools.subagents.tools`. Див. [OpenProse](/uk/prose).

## Безпека

- **Лише локально в процесі** — workflows виконуються всередині процесу gateway; сам Plugin не робить мережевих викликів.
- **Без секретів** — Lobster не керує OAuth; він викликає tools OpenClaw, які це роблять.
- **Ураховує sandbox** — вимикається, коли контекст tool працює в sandbox.
- **Посилений режим** — тайм-аути й ліміти виводу примусово забезпечуються вбудованим runner.

## Усунення проблем

- **`lobster timed out`** → збільште `timeoutMs` або розбийте довгий pipeline.
- **`lobster output exceeded maxStdoutBytes`** → збільште `maxStdoutBytes` або зменште розмір виводу.
- **`lobster returned invalid JSON`** → переконайтеся, що pipeline працює в режимі tool і виводить лише JSON.
- **`lobster failed`** → перевірте логи gateway для деталей помилки вбудованого runner.

## Дізнатися більше

- [Plugins](/uk/tools/plugin)
- [Авторинг Plugin tools](/uk/plugins/building-plugins#registering-agent-tools)

## Приклад із практики спільноти: робочі процеси

Один публічний приклад: CLI «другого мозку» + Lobster pipelines, що керують трьома Markdown-сховищами (особистим, партнерським, спільним). CLI виводить JSON для статистики, списків inbox і сканування застарілих даних; Lobster об’єднує ці команди в workflows на кшталт `weekly-review`, `inbox-triage`, `memory-consolidation` і `shared-task-sync`, кожен з approval gates. AI виконує оцінювальну частину (категоризацію), коли це доступно, і повертається до детермінованих правил, коли ні.

- Тред: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Пов’язане

- [Automation & Tasks](/uk/automation) — планування робочих процесів Lobster
- [Automation Overview](/uk/automation) — усі механізми автоматизації
- [Tools Overview](/uk/tools) — усі доступні agent tools
