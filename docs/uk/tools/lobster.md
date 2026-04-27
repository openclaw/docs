---
read_when:
    - Вам потрібні детерміновані багатокрокові workflow з явними погодженнями
    - Вам потрібно відновити workflow без повторного запуску попередніх кроків
summary: Типізоване середовище виконання workflow для OpenClaw із відновлюваними етапами погодження.
title: Lobster
x-i18n:
    generated_at: "2026-04-27T06:28:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 15
---

Lobster — це оболонка workflow, яка дозволяє OpenClaw виконувати багатокрокові послідовності інструментів як одну детерміновану операцію з явними контрольними точками погодження.

Lobster — це рівень авторингу, що стоїть на один щабель вище за відокремлену фонову роботу. Для оркестрації потоків над окремими завданнями див. [TaskFlow](/uk/automation/taskflow) (`openclaw tasks flow`). Для журналу активності завдань див. [`openclaw tasks`](/uk/automation/tasks).

## Хук

Ваш помічник може створювати інструменти, які керують ним самим. Попросіть workflow — і за 30 хвилин у вас буде CLI плюс конвеєри, які виконуються як один виклик. Lobster — це відсутній елемент: детерміновані конвеєри, явні погодження та відновлюваний стан.

## Навіщо

Сьогодні складні workflow вимагають багатьох викликів інструментів із поверненням назад і вперед. Кожен виклик коштує токенів, а LLM має оркеструвати кожен крок. Lobster переносить цю оркестрацію в типізоване середовище виконання:

- **Один виклик замість багатьох**: OpenClaw виконує один виклик інструмента Lobster і отримує структурований результат.
- **Вбудовані погодження**: побічні дії (надіслати email, залишити коментар) зупиняють workflow, доки його явно не погодять.
- **Відновлюваність**: зупинені workflow повертають токен; погодьте й відновіть без повторного запуску всього.

## Чому DSL, а не звичайні програми?

Lobster навмисно невеликий. Мета не в тому, щоб створити "нову мову", а в тому, щоб мати передбачувану, дружню до AI специфікацію конвеєра з першокласними погодженнями й токенами відновлення.

- **Погодження/відновлення вбудовано**: звичайна програма може попросити людину про підтвердження, але не може _зупинитися й відновитися_ за допомогою стійкого токена без того, щоб ви самі не вигадали таке середовище виконання.
- **Детермінізм + аудитованість**: конвеєри — це дані, тому їх легко журналювати, порівнювати, відтворювати й перевіряти.
- **Обмежена поверхня для AI**: маленька граматика + передавання JSON зменшують кількість “творчих” шляхів виконання коду й роблять валідацію реалістичною.
- **Політика безпеки вбудована**: тайм-аути, обмеження виводу, перевірки sandbox і allowlist примусово забезпечуються середовищем виконання, а не кожним окремим скриптом.
- **Усе ще програмований**: кожен крок може викликати будь-який CLI або скрипт. Якщо ви хочете JS/TS, генеруйте файли `.lobster` з коду.

## Як це працює

OpenClaw виконує workflow Lobster **у межах процесу** за допомогою вбудованого runner. Жоден зовнішній підпроцес CLI не запускається; рушій workflow виконується всередині процесу gateway і напряму повертає JSON-конверт.
Якщо конвеєр зупиняється для погодження, інструмент повертає `resumeToken`, щоб ви могли продовжити пізніше.

## Патерн: маленький CLI + конвеєри JSON + погодження

Створюйте маленькі команди, які працюють із JSON, а потім об’єднуйте їх в один виклик Lobster. (Нижче наведено лише приклади назв команд — замініть їх своїми.)

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

Якщо конвеєр запитує погодження, відновіть його за токеном:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI ініціює workflow; Lobster виконує кроки. Етапи погодження роблять побічні дії явними й аудитованими.

Приклад: зіставити вхідні елементи з викликами інструментів:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Кроки LLM лише з JSON (`llm-task`)

Для workflow, яким потрібен **структурований крок LLM**, увімкніть необов’язковий
інструмент plugin `llm-task` і викликайте його з Lobster. Це зберігає workflow
детермінованим, але водночас дозволяє класифікувати/узагальнювати/створювати чернетки за допомогою моделі.

Увімкнення інструмента:

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

Використання в конвеєрі:

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

Докладніше про параметри й конфігурацію див. у [LLM Task](/uk/tools/llm-task).

## Файли workflow (.lobster)

Lobster може виконувати YAML/JSON-файли workflow з полями `name`, `args`, `steps`, `env`, `condition` і `approval`. У викликах інструментів OpenClaw задайте `pipeline` як шлях до файла.

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
- `condition` (або `when`) може керувати виконанням кроків на основі `$step.approved`.

## Установлення Lobster

Вбудовані workflow Lobster виконуються в межах процесу; окремий бінарний файл `lobster` не потрібен. Вбудований runner постачається разом із plugin Lobster.

Якщо вам потрібен окремий CLI Lobster для розробки або зовнішніх конвеєрів, установіть його з [репозиторію Lobster](https://github.com/openclaw/lobster) і переконайтеся, що `lobster` є в `PATH`.

## Увімкнення інструмента

Lobster — це **необов’язковий** інструмент plugin (типово не ввімкнений).

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

Уникайте використання `tools.allow: ["lobster"]`, якщо тільки ви справді не хочете працювати в обмежувальному режимі allowlist.

<Note>
Allowlist для необов’язкових plugin — це opt-in. Якщо ваш allowlist містить лише інструменти plugin (наприклад, `lobster`), OpenClaw залишає основні інструменти ввімкненими. Щоб обмежити основні інструменти, також включіть у allowlist потрібні основні інструменти або групи.
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

Повертає JSON-конверт (усічено):

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

Користувач погоджує → відновлення:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Один workflow. Детермінований. Безпечний.

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

Запуск файла workflow з аргументами:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Продовжити зупинений workflow після погодження.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Необов’язкові вхідні дані

- `cwd`: Відносний робочий каталог для конвеєра (має залишатися в межах робочого каталогу gateway).
- `timeoutMs`: Перервати workflow, якщо він перевищує цю тривалість (типово: 20000).
- `maxStdoutBytes`: Перервати workflow, якщо вивід перевищує цей розмір (типово: 512000).
- `argsJson`: JSON-рядок, що передається в `lobster run --args-json` (лише для файлів workflow).

## Конверт виводу

Lobster повертає JSON-конверт з одним із трьох статусів:

- `ok` → успішно завершено
- `needs_approval` → зупинено; для відновлення потрібен `requiresApproval.resumeToken`
- `cancelled` → явно відхилено або скасовано

Інструмент показує конверт і в `content` (відформатований JSON), і в `details` (сирий об’єкт).

## Погодження

Якщо присутній `requiresApproval`, перегляньте prompt і вирішіть:

- `approve: true` → відновити й продовжити побічні дії
- `approve: false` → скасувати й завершити workflow

Використовуйте `approve --preview-from-stdin --limit N`, щоб прикріплювати JSON-перегляд до запитів на погодження без власних glue-конструкцій `jq`/heredoc. Тепер токени відновлення компактні: Lobster зберігає стан відновлення workflow у своєму каталозі стану й повертає невеликий ключ токена.

## OpenProse

OpenProse добре поєднується з Lobster: використовуйте `/prose` для оркестрації підготовки кількома агентами, а потім запускайте конвеєр Lobster для детермінованих погоджень. Якщо програмі Prose потрібен Lobster, дозвольте інструмент `lobster` для субагентів через `tools.subagents.tools`. Див. [OpenProse](/uk/prose).

## Безпека

- **Лише локально в межах процесу** — workflow виконуються всередині процесу gateway; сам plugin не робить мережевих викликів.
- **Без секретів** — Lobster не керує OAuth; він викликає інструменти OpenClaw, які це роблять.
- **З урахуванням sandbox** — вимикається, коли контекст інструмента перебуває в sandbox.
- **Посилений захист** — тайм-аути й обмеження виводу забезпечуються вбудованим runner.

## Усунення несправностей

- **`lobster timed out`** → збільште `timeoutMs` або розбийте довгий конвеєр.
- **`lobster output exceeded maxStdoutBytes`** → збільшіть `maxStdoutBytes` або зменште розмір виводу.
- **`lobster returned invalid JSON`** → переконайтеся, що конвеєр працює в режимі інструмента й виводить лише JSON.
- **`lobster failed`** → перевірте журнали gateway на наявність деталей помилки вбудованого runner.

## Дізнатися більше

- [Plugins](/uk/tools/plugin)
- [Авторинг інструментів plugin](/uk/plugins/building-plugins#registering-agent-tools)

## Кейс: workflow спільноти

Один публічний приклад: CLI “second brain” + конвеєри Lobster, які керують трьома сховищами Markdown (особистим, партнерським, спільним). CLI виводить JSON для статистики, списків inbox і сканування застарілих елементів; Lobster об’єднує ці команди у workflow на кшталт `weekly-review`, `inbox-triage`, `memory-consolidation` і `shared-task-sync`, кожен з етапами погодження. AI виконує оцінювальні задачі (категоризацію), коли це доступно, і повертається до детермінованих правил, коли ні.

- Тред: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Репозиторій: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Пов’язане

- [Автоматизація і завдання](/uk/automation) — планування workflow Lobster
- [Огляд автоматизації](/uk/automation) — усі механізми автоматизації
- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
