---
read_when:
    - Вам потрібні детерміновані багатоетапні робочі процеси з явними затвердженнями
    - Потрібно відновити робочий процес, не запускаючи попередні кроки повторно
summary: Типізоване середовище виконання робочих процесів для OpenClaw із відновлюваними шлюзами затвердження.
title: Омар
x-i18n:
    generated_at: "2026-05-03T22:56:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1a81fddd11fa36f4ce3b3f0bce35f5a7e90300e225027331965bdfdc8919532
    source_path: tools/lobster.md
    workflow: 16
---

Lobster — це оболонка робочих процесів, яка дає OpenClaw змогу запускати багатоетапні послідовності інструментів як одну детерміновану операцію з явними контрольними точками затвердження.

Lobster — це один авторський шар над від’єднаною фоновою роботою. Про оркестрацію потоків над окремими завданнями див. [TaskFlow](/uk/automation/taskflow) (`openclaw tasks flow`). Про журнал активності завдань див. [`openclaw tasks`](/uk/automation/tasks).

## Хук

Ваш асистент може створювати інструменти, які керують ним самим. Попросіть робочий процес, і за 30 хвилин матимете CLI плюс конвеєри, що запускаються одним викликом. Lobster — це відсутня ланка: детерміновані конвеєри, явні затвердження та стан, який можна відновити.

## Навіщо

Сьогодні складні робочі процеси потребують багатьох взаємних викликів інструментів. Кожен виклик витрачає токени, а LLM має оркеструвати кожен крок. Lobster переносить цю оркестрацію в типізоване середовище виконання:

- **Один виклик замість багатьох**: OpenClaw виконує один виклик інструмента Lobster і отримує структурований результат.
- **Вбудовані затвердження**: побічні ефекти (надіслати email, опублікувати коментар) зупиняють робочий процес до явного затвердження.
- **Можливість відновлення**: зупинені робочі процеси повертають токен; затвердьте й відновіть без повторного виконання всього процесу.

## Навіщо DSL замість звичайних програм?

Lobster навмисно невеликий. Мета — не "нова мова", а передбачувана, зручна для AI специфікація конвеєра з повноцінними затвердженнями й токенами відновлення.

- **Затвердження/відновлення вбудовано**: звичайна програма може попросити людину про підтвердження, але не може _призупинитися й відновитися_ зі сталим токеном, якщо ви самі не створите таке середовище виконання.
- **Детермінізм + аудитованість**: конвеєри — це дані, тому їх легко логувати, порівнювати, відтворювати й переглядати.
- **Обмежена поверхня для AI**: крихітна граматика + передавання JSON зменшують кількість “творчих” шляхів коду й роблять валідацію реалістичною.
- **Політика безпеки вбудована**: тайм-аути, обмеження виводу, перевірки пісочниці та allowlist-и застосовуються середовищем виконання, а не кожним скриптом.
- **Водночас програмований**: кожен крок може викликати будь-який CLI або скрипт. Якщо хочете JS/TS, генеруйте файли `.lobster` з коду.

## Як це працює

OpenClaw запускає робочі процеси Lobster **у межах процесу** за допомогою вбудованого раннера. Зовнішній підпроцес CLI не створюється; рушій робочих процесів виконується всередині процесу Gateway і повертає JSON-конверт напряму.
Якщо конвеєр призупиняється для затвердження, інструмент повертає `resumeToken`, щоб ви могли продовжити пізніше.

## Патерн: малий CLI + JSON-канали + затвердження

Створюйте невеликі команди, які спілкуються JSON, а потім об’єднуйте їх в один виклик Lobster. (Назви прикладних команд нижче — замініть їх на власні.)

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

Якщо конвеєр запитує затвердження, відновіть його з токеном:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI запускає робочий процес; Lobster виконує кроки. Шлюзи затвердження роблять побічні ефекти явними й аудитованими.

Приклад: зіставлення вхідних елементів із викликами інструментів:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Кроки LLM лише з JSON (llm-task)

Для робочих процесів, яким потрібен **структурований крок LLM**, увімкніть необов’язковий інструмент plugin
`llm-task` і викликайте його з Lobster. Це зберігає робочий процес
детермінованим, але дає змогу класифікувати, підсумовувати й готувати чернетки за допомогою моделі.

Увімкніть інструмент:

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

Використайте його в конвеєрі:

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

Див. [LLM Task](/uk/tools/llm-task), щоб дізнатися про подробиці й параметри конфігурації.

## Файли робочих процесів (.lobster)

Lobster може запускати YAML/JSON-файли робочих процесів із полями `name`, `args`, `steps`, `env`, `condition` та `approval`. У викликах інструментів OpenClaw задайте `pipeline` як шлях до файлу.

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
- `condition` (або `when`) може ставити кроки в залежність від `$step.approved`.

## Встановлення Lobster

Вбудовані робочі процеси Lobster виконуються в межах процесу; окремий бінарний файл `lobster` не потрібен. Вбудований раннер постачається з plugin Lobster.

Якщо вам потрібен автономний CLI Lobster для розробки або зовнішніх конвеєрів, установіть його з [репозиторію Lobster](https://github.com/openclaw/lobster) і переконайтеся, що `lobster` є в `PATH`.

## Увімкнення інструмента

Lobster — це **необов’язковий** інструмент plugin (не ввімкнений за замовчуванням).

Рекомендовано (адитивно, безпечно):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Або для окремого агента:

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

Уникайте використання `tools.allow: ["lobster"]`, якщо не маєте наміру працювати в обмежувальному режимі allowlist.

<Note>
Allowlists вмикаються за бажанням для необов’язкових plugins. `alsoAllow` вмикає лише названі необов’язкові інструменти plugin, зберігаючи звичайний набір базових інструментів. Щоб обмежити базові інструменти, використовуйте `tools.allow` із потрібними базовими інструментами або групами.
</Note>

## Приклад: сортування email

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

Повертає JSON-конверт (скорочено):

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

Користувач затверджує → відновлення:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Один робочий процес. Детермінований. Безпечний.

## Параметри інструмента

### `run`

Запустіть конвеєр у режимі інструмента.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Запустіть файл робочого процесу з аргументами:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Продовжіть зупинений робочий процес після затвердження.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Необов’язкові вхідні дані

- `cwd`: відносний робочий каталог для конвеєра (має залишатися в межах робочого каталогу Gateway).
- `timeoutMs`: перервати робочий процес, якщо він перевищує цю тривалість (за замовчуванням: 20000).
- `maxStdoutBytes`: перервати робочий процес, якщо вивід перевищує цей розмір (за замовчуванням: 512000).
- `argsJson`: JSON-рядок, переданий до `lobster run --args-json` (лише файли робочих процесів).

## Конверт виводу

Lobster повертає JSON-конверт з одним із трьох статусів:

- `ok` → успішно завершено
- `needs_approval` → призупинено; для відновлення потрібен `requiresApproval.resumeToken`
- `cancelled` → явно відхилено або скасовано

Інструмент показує конверт і в `content` (форматований JSON), і в `details` (сирий об’єкт).

## Затвердження

Якщо присутній `requiresApproval`, перегляньте запит і вирішіть:

- `approve: true` → відновити й продовжити побічні ефекти
- `approve: false` → скасувати й завершити робочий процес

Використовуйте `approve --preview-from-stdin --limit N`, щоб додати JSON-перегляд до запитів на затвердження без власного jq/heredoc-клею. Токени відновлення тепер компактні: Lobster зберігає стан відновлення робочого процесу у своєму каталозі стану й повертає невеликий ключ токена.

## OpenProse

OpenProse добре поєднується з Lobster: використовуйте `/prose` для оркестрації підготовки кількох агентів, а потім запускайте конвеєр Lobster для детермінованих затверджень. Якщо програмі Prose потрібен Lobster, дозвольте інструмент `lobster` для субагентів через `tools.subagents.tools`. Див. [OpenProse](/uk/prose).

## Безпека

- **Лише локально в межах процесу** — робочі процеси виконуються всередині процесу Gateway; сам plugin не виконує мережевих викликів.
- **Без секретів** — Lobster не керує OAuth; він викликає інструменти OpenClaw, які це роблять.
- **З урахуванням пісочниці** — вимикається, коли контекст інструмента перебуває в пісочниці.
- **Зміцнений** — тайм-аути й обмеження виводу застосовуються вбудованим раннером.

## Усунення несправностей

- **`lobster timed out`** → збільште `timeoutMs` або розділіть довгий конвеєр.
- **`lobster output exceeded maxStdoutBytes`** → збільште `maxStdoutBytes` або зменште розмір виводу.
- **`lobster returned invalid JSON`** → переконайтеся, що конвеєр працює в режимі інструмента й друкує лише JSON.
- **`lobster failed`** → перевірте журнали Gateway, щоб знайти подробиці помилки вбудованого раннера.

## Докладніше

- [Plugins](/uk/tools/plugin)
- [Створення інструментів plugin](/uk/plugins/building-plugins#registering-agent-tools)

## Приклад із практики: спільнотні робочі процеси

Один публічний приклад: CLI “другий мозок” + конвеєри Lobster, які керують трьома Markdown-сховищами (особистим, партнерським, спільним). CLI видає JSON для статистики, списків inbox і сканувань застарілого вмісту; Lobster об’єднує ці команди в робочі процеси на кшталт `weekly-review`, `inbox-triage`, `memory-consolidation` і `shared-task-sync`, кожен зі шлюзами затвердження. AI виконує оцінювання (категоризацію), коли доступний, і повертається до детермінованих правил, коли ні.

- Потік: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Репозиторій: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Пов’язане

- [Автоматизація та завдання](/uk/automation) — планування робочих процесів Lobster
- [Огляд автоматизації](/uk/automation) — усі механізми автоматизації
- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
