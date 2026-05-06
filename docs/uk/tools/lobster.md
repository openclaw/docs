---
read_when:
    - Вам потрібні детерміновані багатоетапні робочі процеси з явними схваленнями
    - Вам потрібно відновити робочий процес без повторного виконання попередніх кроків
summary: Типізоване середовище виконання робочих процесів для OpenClaw з етапами затвердження з можливістю відновлення.
title: Омар
x-i18n:
    generated_at: "2026-05-06T03:09:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster — це оболонка робочих процесів, яка дає OpenClaw змогу виконувати багатокрокові послідовності інструментів як одну детерміновану операцію з явними контрольними точками затвердження.

Lobster — це рівень авторства над від’єднаною фоновою роботою. Для оркестрації потоків над окремими завданнями див. [Потік завдань](/uk/automation/taskflow) (`openclaw tasks flow`). Для журналу активності завдань див. [`openclaw tasks`](/uk/automation/tasks).

## Хук

Ваш асистент може створювати інструменти, які керують ним самим. Попросіть робочий процес, і через 30 хвилин у вас буде CLI плюс конвеєри, що виконуються одним викликом. Lobster — відсутня ланка: детерміновані конвеєри, явні затвердження та відновлюваний стан.

## Навіщо

Сьогодні складні робочі процеси потребують багатьох зворотних викликів інструментів. Кожен виклик коштує токенів, а LLM має оркеструвати кожен крок. Lobster переносить цю оркестрацію в типізоване середовище виконання:

- **Один виклик замість багатьох**: OpenClaw виконує один виклик інструмента Lobster і отримує структурований результат.
- **Вбудовані затвердження**: Побічні ефекти (надіслати email, опублікувати коментар) зупиняють робочий процес до явного затвердження.
- **Можливість відновлення**: Зупинені робочі процеси повертають токен; затвердьте й відновіть без повторного виконання всього процесу.

## Навіщо DSL замість звичайних програм?

Lobster навмисно малий. Мета — не "нова мова", а передбачувана, зручна для AI специфікація конвеєра з повноцінними затвердженнями й токенами відновлення.

- **Затвердження/відновлення вбудовано**: Звичайна програма може попросити людину про підтвердження, але вона не може _призупинитися й відновитися_ зі стійким токеном без того, щоб ви самі створили це середовище виконання.
- **Детермінованість + аудитованість**: Конвеєри є даними, тож їх легко логувати, порівнювати, відтворювати й переглядати.
- **Обмежена поверхня для AI**: Крихітна граматика + JSON-конвеєризація зменшують "творчі" шляхи коду й роблять валідацію реалістичною.
- **Політика безпеки вбудована**: Тайм-аути, обмеження виводу, перевірки пісочниці та allowlist-и застосовуються середовищем виконання, а не кожним скриптом.
- **Усе ще програмовано**: Кожен крок може викликати будь-який CLI або скрипт. Якщо вам потрібен JS/TS, генеруйте файли `.lobster` з коду.

## Як це працює

OpenClaw запускає робочі процеси Lobster **всередині процесу** за допомогою вбудованого раннера. Зовнішній підпроцес CLI не запускається; рушій робочого процесу виконується всередині процесу gateway і повертає JSON-конверт напряму.
Якщо конвеєр призупиняється для затвердження, інструмент повертає `resumeToken`, щоб ви могли продовжити пізніше.

## Шаблон: малий CLI + JSON-конвеєри + затвердження

Створюйте маленькі команди, що говорять JSON, а потім з’єднуйте їх в один виклик Lobster. (Назви команд нижче наведені як приклад — замініть їх власними.)

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

AI запускає робочий процес; Lobster виконує кроки. Шлюзи затвердження роблять побічні ефекти явними й придатними до аудиту.

Приклад: зіставлення вхідних елементів із викликами інструментів:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## LLM-кроки лише з JSON (llm-task)

Для робочих процесів, яким потрібен **структурований LLM-крок**, увімкніть необов’язковий
інструмент plugin `llm-task` і викликайте його з Lobster. Це зберігає робочий процес
детермінованим, але все одно дає змогу класифікувати, узагальнювати й створювати чернетки за допомогою моделі.

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
        "tools": { "alsoAllow": ["llm-task"] }
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

Докладніше про параметри конфігурації див. у [LLM Task](/uk/tools/llm-task).

## Файли робочих процесів (.lobster)

Lobster може виконувати файли робочих процесів YAML/JSON із полями `name`, `args`, `steps`, `env`, `condition` і `approval`. У викликах інструментів OpenClaw задайте для `pipeline` шлях до файлу.

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
- `condition` (або `when`) може пропускати кроки залежно від `$step.approved`.

## Встановлення Lobster

Вбудовані робочі процеси Lobster виконуються всередині процесу; окремий бінарний файл `lobster` не потрібен. Вбудований раннер постачається з plugin Lobster.

Якщо вам потрібен автономний CLI Lobster для розробки або зовнішніх конвеєрів, встановіть його з [репозиторію Lobster](https://github.com/openclaw/lobster) і переконайтеся, що `lobster` є в `PATH`.

## Увімкнення інструмента

Lobster — **необов’язковий** інструмент plugin (типово не ввімкнений).

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
Allowlists вмикаються явно для необов’язкових plugins. `alsoAllow` вмикає лише названі необов’язкові інструменти plugin, зберігаючи звичайний набір основних інструментів. Щоб обмежити основні інструменти, використовуйте `tools.allow` з потрібними основними інструментами або групами.
</Note>

## Приклад: Сортування email

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

Запустити конвеєр у режимі інструмента.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Запустити файл робочого процесу з аргументами:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Продовжити зупинений робочий процес після затвердження.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Необов’язкові вхідні дані

- `cwd`: Відносний робочий каталог для конвеєра (має залишатися в межах робочого каталогу gateway).
- `timeoutMs`: Перервати робочий процес, якщо він перевищить цю тривалість (типово: 20000).
- `maxStdoutBytes`: Перервати робочий процес, якщо вивід перевищить цей розмір (типово: 512000).
- `argsJson`: JSON-рядок, переданий до `lobster run --args-json` (лише для файлів робочих процесів).

## Вихідний конверт

Lobster повертає JSON-конверт з одним із трьох статусів:

- `ok` → завершено успішно
- `needs_approval` → призупинено; для відновлення потрібен `requiresApproval.resumeToken`
- `cancelled` → явно відхилено або скасовано

Інструмент показує конверт і в `content` (відформатований JSON), і в `details` (сирий об’єкт).

## Затвердження

Якщо присутній `requiresApproval`, перегляньте запит і вирішіть:

- `approve: true` → відновити й продовжити побічні ефекти
- `approve: false` → скасувати й завершити робочий процес

Використовуйте `approve --preview-from-stdin --limit N`, щоб додати JSON-попередній перегляд до запитів на затвердження без спеціального jq/heredoc-зв’язування. Токени відновлення тепер компактні: Lobster зберігає стан відновлення робочого процесу у своєму каталозі стану й повертає малий ключ токена.

## OpenProse

OpenProse добре поєднується з Lobster: використовуйте `/prose`, щоб оркеструвати підготовку з кількома агентами, а потім запустіть конвеєр Lobster для детермінованих затверджень. Якщо програмі Prose потрібен Lobster, дозвольте інструмент `lobster` для під-агентів через `tools.subagents.tools`. Див. [OpenProse](/uk/prose).

## Безпека

- **Лише локально всередині процесу** - робочі процеси виконуються всередині процесу gateway; сам plugin не здійснює мережевих викликів.
- **Без секретів** - Lobster не керує OAuth; він викликає інструменти OpenClaw, які це роблять.
- **З урахуванням пісочниці** - вимикається, коли контекст інструмента перебуває в пісочниці.
- **Посилений захист** - тайм-аути й обмеження виводу застосовуються вбудованим раннером.

## Усунення несправностей

- **`lobster timed out`** → збільште `timeoutMs` або розділіть довгий конвеєр.
- **`lobster output exceeded maxStdoutBytes`** → збільште `maxStdoutBytes` або зменште розмір виводу.
- **`lobster returned invalid JSON`** → переконайтеся, що конвеєр працює в режимі інструмента й виводить лише JSON.
- **`lobster failed`** → перевірте логи gateway, щоб побачити подробиці помилки вбудованого раннера.

## Дізнатися більше

- [Plugins](/uk/tools/plugin)
- [Створення інструментів plugin](/uk/plugins/building-plugins#registering-agent-tools)

## Приклад: робочі процеси спільноти

Один публічний приклад: CLI "другий мозок" + конвеєри Lobster, які керують трьома Markdown-сховищами (особистим, партнерським, спільним). CLI виводить JSON для статистики, списків inbox і сканувань застарілих елементів; Lobster з’єднує ці команди в робочі процеси на кшталт `weekly-review`, `inbox-triage`, `memory-consolidation` і `shared-task-sync`, кожен із шлюзами затвердження. AI виконує судження (категоризацію), коли доступний, і повертається до детермінованих правил, коли ні.

- Тред: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Репозиторій: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Пов’язане

- [Автоматизація і завдання](/uk/automation) - планування робочих процесів Lobster
- [Огляд автоматизації](/uk/automation) - усі механізми автоматизації
- [Огляд інструментів](/uk/tools) - усі доступні інструменти агента
