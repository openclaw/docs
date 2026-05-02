---
read_when:
    - Ви хочете переглянути список збережених сесій і побачити нещодавню активність
summary: Довідник CLI для `openclaw sessions` (список збережених сеансів + використання)
title: Сеанси
x-i18n:
    generated_at: "2026-05-02T12:15:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8791a36fedc18a1c2d4144c3fd4faeaf8f5320676ceee76026959cbe2dc1873c
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Виводить список збережених сесій розмов.

Списки сесій не є перевірками доступності каналу/провайдера. Вони показують збережені
рядки розмов зі сховищ сесій. Тихий Discord, Slack, Telegram або
інший канал може успішно перепідключитися без створення нового рядка сесії,
доки не буде оброблено повідомлення. Використовуйте `openclaw channels status --probe`,
`openclaw status --deep` або `openclaw health --verbose`, коли потрібне живе
підключення каналу.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Вибір області:

- за замовчуванням: налаштоване сховище агента за замовчуванням
- `--verbose`: докладне журналювання
- `--agent <id>`: одне налаштоване сховище агента
- `--all-agents`: агрегувати всі налаштовані сховища агентів
- `--store <path>`: явний шлях до сховища (не можна поєднувати з `--agent` або `--all-agents`)

Експортуйте пакет траєкторії для збереженої сесії:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Це шлях команди, який використовує slash-команда `/export-trajectory` після того,
як власник схвалить запит на виконання. Вихідний каталог завжди визначається
всередині `.openclaw/trajectory-exports/` у вибраному робочому просторі.

`openclaw sessions --all-agents` читає налаштовані сховища агентів. Виявлення сесій Gateway і ACP
ширше: воно також включає сховища лише на диску, знайдені в
корені `agents/` за замовчуванням або в шаблонному корені `session.store`. Ці
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
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Обслуговування очищення

Запустіть обслуговування зараз (замість очікування наступного циклу запису):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` використовує параметри `session.maintenance` з конфігурації:

- Примітка щодо області: `openclaw sessions cleanup` обслуговує сховища сесій, транскрипти та бічні файли траєкторій. Вона не скорочує журнали запусків cron (`cron/runs/<jobId>.jsonl`), якими керують `cron.runLog.maxBytes` і `cron.runLog.keepLines` у [конфігурації Cron](/uk/automation/cron-jobs#configuration) та які пояснено в [обслуговуванні Cron](/uk/automation/cron-jobs#maintenance).

- `--dry-run`: попередньо переглянути, скільки записів було б видалено/обмежено без запису.
  - У текстовому режимі dry-run друкує таблицю дій для кожної сесії (`Action`, `Key`, `Age`, `Model`, `Flags`), щоб можна було побачити, що буде збережено, а що видалено.
- `--enforce`: застосувати обслуговування навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видалити записи, чиї файли транскриптів відсутні, навіть якщо зазвичай вони ще не підпадали б під видалення за віком/кількістю.
- `--active-key <key>`: захистити конкретний активний ключ від витіснення через дисковий бюджет. Довговічні зовнішні вказівники розмов, як-от групові сесії та сесії чату з областю потоку, також зберігаються під час обслуговування за віком/кількістю/дисковим бюджетом.
- `--agent <id>`: запустити очищення для одного налаштованого сховища агента.
- `--all-agents`: запустити очищення для всіх налаштованих сховищ агентів.
- `--store <path>`: виконати для конкретного файлу `sessions.json`.
- `--json`: надрукувати підсумок JSON. З `--all-agents` вивід включає один підсумок на сховище.

Коли Gateway доступний, примусове очищення для налаштованих сховищ агентів
надсилається через Gateway, щоб воно використовувало той самий записувач сховища сесій, що й трафік
під час виконання. Використовуйте `--store <path>` для явного офлайн-відновлення файлу сховища.

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

- [довідник CLI](/uk/cli)
- [Керування сесіями](/uk/concepts/session)
