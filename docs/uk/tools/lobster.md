---
read_when:
    - Вам потрібні детерміновані багатокрокові робочі процеси з явними затвердженнями
    - Вам потрібно відновити робочий процес без повторного виконання попередніх кроків
summary: Типізоване середовище виконання робочих процесів для OpenClaw із відновлюваними етапами затвердження.
title: Lobster
x-i18n:
    generated_at: "2026-04-05T23:42:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1014945d104ef8fdca0d30be89e35136def1b274c6403b06de29e8502b8124b
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster — це оболонка робочих процесів, яка дає OpenClaw змогу виконувати багатокрокові послідовності інструментів як єдину детерміновану операцію з явними контрольними точками затвердження.

Lobster — це рівень створення сценаріїв, розташований над відокремленою фоновою роботою. Для оркестрації потоків вище за окремі завдання див. [Task Flow](/uk/automation/taskflow) (`openclaw tasks flow`). Для журналу активності завдань див. [`openclaw tasks`](/uk/automation/tasks).

## Hook

Ваш асистент може створювати інструменти, які керують ним самим. Попросіть робочий процес — і за 30 хвилин у вас буде CLI плюс конвеєри, які виконуються одним викликом. Lobster — це відсутній елемент: детерміновані конвеєри, явні затвердження та відновлюваний стан.

## Навіщо

Сьогодні складні робочі процеси вимагають багатьох викликів інструментів із постійною взаємодією туди-сюди. Кожен виклик коштує токенів, і LLM має оркеструвати кожен крок. Lobster переносить цю оркестрацію в типізоване середовище виконання:

- **Один виклик замість багатьох**: OpenClaw виконує один виклик інструмента Lobster і отримує структурований результат.
- **Затвердження вбудовані**: Побічні ефекти (надіслати email, опублікувати коментар) зупиняють робочий процес до явного затвердження.
- **Відновлюваність**: Зупинені робочі процеси повертають токен; затвердіть і відновіть без повторного запуску всього.

## Чому DSL, а не звичайні програми?

Lobster навмисно зроблено невеликим. Мета не в тому, щоб створити «нову мову», а в тому, щоб мати передбачувану, дружню до AI специфікацію конвеєра з підтримкою затверджень і токенів відновлення як першокласних можливостей.

- **Затвердити/відновити вбудовано**: Звичайна програма може запитати людину, але не може _призупинитися й відновитися_ з надійним токеном без того, щоб ви самі винайшли таке середовище виконання.
- **Детермінованість + аудитованість**: Конвеєри — це дані, тому їх легко журналювати, порівнювати, відтворювати й перевіряти.
- **Обмежена поверхня для AI**: Невелика граматика + JSON-передавання зменшують «творчі» шляхи виконання коду та роблять перевірку реалістичною.
- **Політика безпеки вбудована**: Тайм-аути, обмеження виводу, перевірки sandbox і allowlist примусово забезпечуються середовищем виконання, а не кожним скриптом.
- **Усе ще програмований**: Кожен крок може викликати будь-який CLI або скрипт. Якщо вам потрібен JS/TS, генеруйте файли `.lobster` з коду.

## Як це працює

OpenClaw виконує робочі процеси Lobster **у процесі** за допомогою вбудованого раннера. Жоден зовнішній підпроцес CLI не запускається; рушій робочих процесів виконується всередині процесу gateway і напряму повертає JSON-конверт.
Якщо конвеєр призупиняється для затвердження, інструмент повертає `resumeToken`, щоб ви могли продовжити пізніше.

## Шаблон: невеликий CLI + JSON-канали + затвердження

Створюйте маленькі команди, які працюють із JSON, а потім об’єднуйте їх в один виклик Lobster. (Назви команд у прикладі нижче — лише приклад, замініть на свої.)

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

Якщо конвеєр запитує затвердження, відновіть його за допомогою токена:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI запускає робочий процес; Lobster виконує кроки. Етапи затвердження роблять побічні ефекти явними та придатними до аудиту.

Приклад: відображення вхідних елементів у виклики інструментів:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## LLM-кроки лише з JSON (llm-task)

Для робочих процесів, яким потрібен **структурований крок LLM**, увімкніть необов’язковий інструмент плагіна
`llm-task` і викликайте його з Lobster. Це зберігає
детермінованість робочого процесу, водночас даючи змогу класифікувати, узагальнювати або створювати чернетки за допомогою моделі.

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

Див. [LLM Task](/uk/tools/llm-task) для деталей і параметрів конфігурації.

## Файли робочих процесів (.lobster)

Lobster може виконувати файли робочих процесів YAML/JSON з полями `name`, `args`, `steps`, `env`, `condition` і `approval`. У викликах інструментів OpenClaw встановіть `pipeline` на шлях до файла.

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

## Встановлення Lobster

Вбудовані робочі процеси Lobster виконуються у процесі; окремий бінарний файл `lobster` не потрібен. Вбудований раннер постачається разом із плагіном Lobster.

Якщо вам потрібен автономний CLI Lobster для розробки або зовнішніх конвеєрів, установіть його з [репозиторію Lobster](https://github.com/openclaw/lobster) і переконайтеся, що `lobster` є в `PATH`.

## Увімкнення інструмента

Lobster — це **необов’язковий** інструмент плагіна (типово не ввімкнений).

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

Уникайте використання `tools.allow: ["lobster"]`, якщо тільки ви справді не хочете працювати в режимі обмежувального allowlist.

Примітка: allowlist для необов’язкових плагінів — це механізм із явним увімкненням.
Якщо ваш allowlist містить лише
інструменти плагінів (як-от `lobster`), OpenClaw залишає core tools увімкненими. Щоб обмежити core
tools, також укажіть у allowlist потрібні core tools або групи.

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

Запускає конвеєр у режимі інструмента.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Запуск файла робочого процесу з аргументами:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Продовжує зупинений робочий процес після затвердження.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Необов’язкові входи

- `cwd`: Відносний робочий каталог для конвеєра (має залишатися в межах робочого каталогу gateway).
- `timeoutMs`: Перериває робочий процес, якщо він перевищує цю тривалість (типово: 20000).
- `maxStdoutBytes`: Перериває робочий процес, якщо вивід перевищує цей розмір (типово: 512000).
- `argsJson`: JSON-рядок, який передається в `lobster run --args-json` (лише для файлів робочих процесів).

## Конверт виводу

Lobster повертає JSON-конверт з одним із трьох статусів:

- `ok` → успішно завершено
- `needs_approval` → призупинено; для відновлення потрібен `requiresApproval.resumeToken`
- `cancelled` → явно відхилено або скасовано

Інструмент відображає цей конверт і в `content` (форматований JSON), і в `details` (сирий об’єкт).

## Затвердження

Якщо присутній `requiresApproval`, перегляньте запит і вирішіть:

- `approve: true` → відновити та продовжити побічні ефекти
- `approve: false` → скасувати й завершити робочий процес

Використовуйте `approve --preview-from-stdin --limit N`, щоб додати JSON-перегляд до запитів на затвердження без власних glue-скриптів на jq/heredoc. Тепер токени відновлення компактні: Lobster зберігає стан відновлення робочого процесу у своєму каталозі стану й повертає невеликий ключ токена.

## OpenProse

OpenProse добре поєднується з Lobster: використовуйте `/prose` для оркестрації підготовки з кількома агентами, а потім запускайте конвеєр Lobster для детермінованих затверджень. Якщо програмі Prose потрібен Lobster, дозвольте інструмент `lobster` для субагентів через `tools.subagents.tools`. Див. [OpenProse](/uk/prose).

## Безпека

- **Лише локальне виконання у процесі** — робочі процеси виконуються всередині процесу gateway; сам плагін не робить мережевих викликів.
- **Без секретів** — Lobster не керує OAuth; він викликає інструменти OpenClaw, які це роблять.
- **Обізнаний про sandbox** — вимикається, коли контекст інструмента працює в sandbox.
- **Посилений захист** — тайм-аути та обмеження виводу забезпечуються вбудованим раннером.

## Усунення несправностей

- **`lobster timed out`** → збільште `timeoutMs` або розбийте довгий конвеєр.
- **`lobster output exceeded maxStdoutBytes`** → збільште `maxStdoutBytes` або зменште розмір виводу.
- **`lobster returned invalid JSON`** → переконайтеся, що конвеєр працює в режимі інструмента й виводить лише JSON.
- **`lobster failed`** → перевірте журнали gateway для деталей помилки вбудованого раннера.

## Дізнатися більше

- [Plugins](/uk/tools/plugin)
- [Створення інструментів плагінів](/uk/plugins/building-plugins#registering-agent-tools)

## Кейс: робочі процеси спільноти

Один публічний приклад: CLI «другий мозок» + конвеєри Lobster, які керують трьома сховищами Markdown (особистим, партнерським і спільним). CLI виводить JSON для статистики, списків inbox і перевірок застарілого вмісту; Lobster з’єднує ці команди в робочі процеси на кшталт `weekly-review`, `inbox-triage`, `memory-consolidation` і `shared-task-sync`, кожен із етапами затвердження. AI виконує оцінювальні дії (категоризацію), коли доступний, і повертається до детермінованих правил, коли недоступний.

- Обговорення: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Репозиторій: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Пов’язане

- [Automation & Tasks](/uk/automation) — планування робочих процесів Lobster
- [Огляд Automation](/uk/automation) — усі механізми автоматизації
- [Огляд Tools](/uk/tools) — усі доступні інструменти агента
