---
read_when:
    - Ви хочете переглянути список збережених сеансів і побачити нещодавню активність
summary: Довідник CLI для `openclaw sessions` (список збережених сеансів + використання)
title: Сеанси
x-i18n:
    generated_at: "2026-05-04T21:23:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Показати список збережених сесій розмов.

Списки сесій не є перевірками активності каналу/провайдера. Вони показують збережені
рядки розмов зі сховищ сесій. Тихий Discord, Slack, Telegram або
інший канал може успішно перепідключитися без створення нового рядка сесії,
доки не буде оброблено повідомлення. Використовуйте `openclaw channels status --probe`,
`openclaw status --deep` або `openclaw health --verbose`, коли потрібне живе
підключення каналу.

Відповіді `openclaw sessions` і Gateway `sessions.list` за замовчуванням
обмежені, щоб великі довготривалі сховища не могли монополізувати процес CLI або цикл
подій Gateway. CLI за замовчуванням повертає 100 найновіших сесій; передайте
`--limit <n>` для меншого/більшого вікна або `--limit all`, коли навмисно
потрібне повне сховище. JSON-відповіді містять `totalCount`, `limitApplied` і
`hasMore`, коли викликачам потрібно показати, що існують додаткові рядки.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Вибір області:

- за замовчуванням: налаштоване сховище агента за замовчуванням
- `--verbose`: докладне журналювання
- `--agent <id>`: одне налаштоване сховище агента
- `--all-agents`: об’єднати всі налаштовані сховища агентів
- `--store <path>`: явний шлях до сховища (не можна поєднувати з `--agent` або `--all-agents`)
- `--limit <n|all>`: максимальна кількість рядків для виведення (за замовчуванням `100`; `all` відновлює повне виведення)

Експортувати пакет траєкторії для збереженої сесії:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Це шлях команди, який використовує slash-команда `/export-trajectory` після того,
як власник схвалить запит на виконання. Вихідний каталог завжди розв’язується
всередині `.openclaw/trajectory-exports/` у вибраному робочому просторі.

`openclaw sessions --all-agents` читає налаштовані сховища агентів. Виявлення
сесій Gateway і ACP ширше: воно також охоплює сховища лише на диску, знайдені під
коренем `agents/` за замовчуванням або шаблонізованим коренем `session.store`. Ці
виявлені сховища мають розв’язуватися у звичайні файли `sessions.json` всередині
кореня агента; символьні посилання та шляхи поза коренем пропускаються.

Приклади JSON:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Обслуговування очищення

Запустити обслуговування зараз (замість очікування наступного циклу запису):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` використовує параметри `session.maintenance` з конфігурації:

- Примітка щодо області: `openclaw sessions cleanup` обслуговує сховища сесій, транскрипти та допоміжні файли траєкторій. Вона не очищає журнали запусків cron (`cron/runs/<jobId>.jsonl`), якими керують `cron.runLog.maxBytes` і `cron.runLog.keepLines` у [конфігурації Cron](/uk/automation/cron-jobs#configuration) і які пояснено в [обслуговуванні Cron](/uk/automation/cron-jobs#maintenance).

- `--dry-run`: попередньо показати, скільки записів було б очищено/обмежено без запису.
  - У текстовому режимі dry-run друкує таблицю дій для кожної сесії (`Action`, `Key`, `Age`, `Model`, `Flags`), щоб ви могли побачити, що було б збережено, а що видалено.
- `--enforce`: застосувати обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видалити записи, чиї файли транскриптів відсутні, навіть якщо зазвичай вони ще не вибули б за віком/кількістю.
- `--active-key <key>`: захистити конкретний активний ключ від вилучення через бюджет диска. Довговічні зовнішні вказівники на розмови, як-от групові сесії та чат-сесії в межах треду, також зберігаються під час обслуговування за віком/кількістю/бюджетом диска.
- `--agent <id>`: запустити очищення для одного налаштованого сховища агента.
- `--all-agents`: запустити очищення для всіх налаштованих сховищ агентів.
- `--store <path>`: запустити для конкретного файлу `sessions.json`.
- `--json`: надрукувати зведення JSON. З `--all-agents` вивід містить одне зведення на кожне сховище.

Коли Gateway доступний, очищення без dry-run для налаштованих сховищ агентів
надсилається через Gateway, щоб воно використовувало той самий записувач сховища
сесій, що й трафік під час виконання. Використовуйте `--store <path>` для явного
офлайнового відновлення файлу сховища.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Пов’язане:

- Конфігурація сесій: [довідник конфігурації](/uk/gateway/config-agents#session)

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Керування сесіями](/uk/concepts/session)
