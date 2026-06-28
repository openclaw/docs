---
read_when:
    - Вам потрібні детерміновані багатоетапні робочі процеси з явними схваленнями
    - Потрібно відновити робочий процес, не запускаючи повторно попередні кроки
summary: Типізоване середовище виконання робочих процесів для OpenClaw із контрольними точками затвердження з можливістю відновлення.
title: Омар
x-i18n:
    generated_at: "2026-05-12T01:00:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Lobster — це workflow shell, який дозволяє OpenClaw запускати багатоетапні послідовності інструментів як одну детерміновану операцію з явними контрольними точками схвалення.

Lobster — це шар авторингу над від’єднаною фоновою роботою. Для оркестрації потоків над окремими завданнями див. [Task Flow](/uk/automation/taskflow) (`openclaw tasks flow`). Для журналу активності завдань див. [`openclaw tasks`](/uk/automation/tasks).

## Хук

Ваш асистент може створювати інструменти, які керують ним самим. Попросіть workflow, і через 30 хвилин матимете CLI плюс конвеєри, що запускаються одним викликом. Lobster — це відсутня частина: детерміновані конвеєри, явні схвалення та стан, який можна відновити.

## Навіщо

Сьогодні складні workflow потребують багатьох взаємних викликів інструментів. Кожен виклик коштує токенів, а LLM має оркеструвати кожен крок. Lobster переносить цю оркестрацію в типізоване середовище виконання:

- **Один виклик замість багатьох**: OpenClaw виконує один виклик інструмента Lobster і отримує структурований результат.
- **Вбудовані схвалення**: побічні ефекти (надіслати email, опублікувати коментар) зупиняють workflow до явного схвалення.
- **Можна відновити**: зупинені workflow повертають токен; схваліть і відновіть без повторного запуску всього.

## Чому DSL замість звичайних програм?

Lobster навмисно малий. Мета — не «нова мова», а передбачувана, зручна для AI специфікація конвеєра з першокласними схваленнями та токенами відновлення.

- **Схвалення/відновлення вбудовано**: звичайна програма може запитати людину, але не може _призупинитися й відновитися_ зі сталим токеном, якщо ви самі не створите таке середовище виконання.
- **Детермінізм + аудитованість**: конвеєри — це дані, тому їх легко логувати, порівнювати, відтворювати й переглядати.
- **Обмежена поверхня для AI**: крихітна граматика + JSON-пайпи зменшують «творчі» шляхи коду та роблять валідацію реалістичною.
- **Політика безпеки вбудована**: тайм-аути, ліміти виводу, перевірки sandbox та allowlist забезпечуються середовищем виконання, а не кожним скриптом.
- **Усе ще програмований**: кожен крок може викликати будь-який CLI або скрипт. Якщо вам потрібен JS/TS, генеруйте файли `.lobster` з коду.

## Як це працює

OpenClaw запускає workflow Lobster **у процесі** за допомогою вбудованого runner. Зовнішній CLI subprocess не запускається; рушій workflow виконується всередині процесу gateway і повертає JSON-конверт напряму.
Якщо конвеєр призупиняється для схвалення, інструмент повертає `resumeToken`, щоб ви могли продовжити пізніше.

## Патерн: малий CLI + JSON-пайпи + схвалення

Створюйте маленькі команди, які говорять JSON, а потім з’єднуйте їх в один виклик Lobster. (Назви команд нижче наведено як приклад — замініть їх власними.)

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

Якщо конвеєр запитує схвалення, відновіть його з токеном:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI запускає workflow; Lobster виконує кроки. Шлюзи схвалення роблять побічні ефекти явними й придатними для аудиту.

Приклад: зіставити вхідні елементи з викликами інструментів:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Кроки LLM лише з JSON (llm-task)

Для workflow, яким потрібен **структурований крок LLM**, увімкніть необов’язковий інструмент плагіна
`llm-task` і викликайте його з Lobster. Це зберігає workflow
детермінованим, водночас дозволяючи класифікувати/підсумовувати/чернеткувати за допомогою моделі.

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

### Важливе обмеження: вбудований Lobster проти `openclaw.invoke`

Вбудований плагін Lobster запускає workflow **у процесі** всередині gateway. У цьому вбудованому режимі `openclaw.invoke` **не** успадковує автоматично URL/auth-контекст gateway для вкладених викликів інструментів OpenClaw CLI.

Це означає, що цей патерн **наразі ненадійний у вбудованому runner**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Використовуйте приклад нижче лише під час запуску **окремого Lobster CLI** у середовищі, де `openclaw.invoke` уже налаштовано з правильним gateway/auth-контекстом.

Використовуйте його в окремому конвеєрі Lobster CLI:

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

Якщо ви сьогодні використовуєте вбудований плагін Lobster, надавайте перевагу одному з варіантів:

- прямому виклику інструмента `llm-task` поза Lobster, або
- крокам без `openclaw.invoke` всередині конвеєра Lobster, доки не буде додано підтримуваний вбудований міст.

Див. [LLM Task](/uk/tools/llm-task), щоб дізнатися деталі та параметри конфігурації.

## Файли workflow (.lobster)

Lobster може запускати YAML/JSON-файли workflow з полями `name`, `args`, `steps`, `env`, `condition` і `approval`. У викликах інструментів OpenClaw встановіть `pipeline` на шлях до файлу.

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
- `condition` (або `when`) може обмежувати кроки за `$step.approved`.

## Установлення Lobster

Вбудовані workflow Lobster виконуються у процесі; окремий binary `lobster` не потрібен. Вбудований runner постачається з плагіном Lobster.

Якщо вам потрібен окремий Lobster CLI для розробки або зовнішніх конвеєрів, установіть його з [репозиторію Lobster](https://github.com/openclaw/lobster) і переконайтеся, що `lobster` є в `PATH`.

## Увімкнення інструмента

Lobster — це **необов’язковий** інструмент плагіна (не ввімкнений за замовчуванням).

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
Allowlists вмикаються явно для необов’язкових плагінів. `alsoAllow` вмикає лише названі необов’язкові інструменти плагінів, зберігаючи звичайний набір основних інструментів. Щоб обмежити основні інструменти, використовуйте `tools.allow` з потрібними основними інструментами або групами.
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

Користувач схвалює → відновлення:

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

Запустити файл workflow з аргументами:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Продовжити зупинений workflow після схвалення.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Необов’язкові вхідні параметри

- `cwd`: відносний робочий каталог для конвеєра (має залишатися в межах робочого каталогу gateway).
- `timeoutMs`: перервати workflow, якщо він перевищує цю тривалість (за замовчуванням: 20000).
- `maxStdoutBytes`: перервати workflow, якщо вивід перевищує цей розмір (за замовчуванням: 512000).
- `argsJson`: JSON-рядок, переданий до `lobster run --args-json` (лише для файлів workflow).

## Вихідний конверт

Lobster повертає JSON-конверт з одним із трьох статусів:

- `ok` → завершено успішно
- `needs_approval` → призупинено; для відновлення потрібен `requiresApproval.resumeToken`
- `cancelled` → явно відхилено або скасовано

Інструмент показує конверт і в `content` (форматований JSON), і в `details` (сирий об’єкт).

## Схвалення

Якщо присутній `requiresApproval`, перевірте prompt і вирішіть:

- `approve: true` → відновити й продовжити побічні ефекти
- `approve: false` → скасувати й фіналізувати workflow

Використовуйте `approve --preview-from-stdin --limit N`, щоб додати JSON-попередній перегляд до запитів на схвалення без власного jq/heredoc glue. Токени відновлення тепер компактні: Lobster зберігає стан відновлення workflow у своєму каталозі стану й повертає малий ключ токена.

## OpenProse

OpenProse добре поєднується з Lobster: використовуйте `/prose` для оркестрації підготовки з кількома агентами, а потім запускайте конвеєр Lobster для детермінованих схвалень. Якщо програмі Prose потрібен Lobster, дозвольте інструмент `lobster` для субагентів через `tools.subagents.tools`. Див. [OpenProse](/uk/prose).

## Безпека

- **Лише локально в процесі** - workflow виконуються всередині процесу gateway; сам плагін не робить мережевих викликів.
- **Без секретів** - Lobster не керує OAuth; він викликає інструменти OpenClaw, які це роблять.
- **З урахуванням sandbox** - вимикається, коли контекст інструмента працює в sandbox.
- **Посилений** - тайм-аути й ліміти виводу забезпечуються вбудованим runner.

## Усунення несправностей

- **`lobster timed out`** → збільште `timeoutMs` або розділіть довгий конвеєр.
- **`lobster output exceeded maxStdoutBytes`** → збільште `maxStdoutBytes` або зменште розмір виводу.
- **`lobster returned invalid JSON`** → переконайтеся, що конвеєр запускається в режимі інструмента й друкує лише JSON.
- **`lobster failed`** → перевірте логи gateway, щоб побачити деталі помилки вбудованого runner.

## Дізнатися більше

- [Плагіни](/uk/tools/plugin)
- [Створення інструментів плагінів](/uk/plugins/building-plugins#registering-agent-tools)

## Приклад: community workflow

Один публічний приклад: CLI «second brain» + конвеєри Lobster, які керують трьома Markdown-сховищами (особистим, партнерським, спільним). CLI виводить JSON для статистики, списків inbox і сканування застарілих елементів; Lobster об’єднує ці команди у workflow на кшталт `weekly-review`, `inbox-triage`, `memory-consolidation` і `shared-task-sync`, кожен із шлюзами схвалення. AI обробляє судження (категоризацію), коли доступний, і повертається до детермінованих правил, коли ні.

- Тред: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Репозиторій: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Пов’язане

- [Автоматизація](/uk/automation) - планування workflow Lobster
- [Огляд автоматизації](/uk/automation) - усі механізми автоматизації
- [Огляд інструментів](/uk/tools) - усі доступні інструменти агента
