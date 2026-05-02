---
read_when:
    - Ви хочете переглянути список збережених сеансів і побачити нещодавню активність
summary: Довідка CLI для `openclaw sessions` (перелік збережених сеансів + використання)
title: Сеанси
x-i18n:
    generated_at: "2026-05-02T07:08:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c7f0d521756ace4af05451b925256f89661bf971533541764c128e2be9d6431
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Показує список збережених сеансів розмов.

Списки сеансів не є перевірками активності каналу/провайдера. Вони показують збережені
рядки розмов зі сховищ сеансів. Тихий Discord, Slack, Telegram або
інший канал може успішно перепідключитися без створення нового рядка сеансу,
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

Експортувати пакет траєкторії для збереженого сеансу:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Це шлях команди, який використовує slash-команда `/export-trajectory` після того,
як власник схвалить запит на виконання. Каталог виводу завжди визначається
всередині `.openclaw/trajectory-exports/` у вибраному робочому просторі.

`openclaw sessions --all-agents` читає налаштовані сховища агентів. Виявлення сеансів Gateway і ACP
ширше: воно також включає сховища лише на диску, знайдені в
корені `agents/` за замовчуванням або в шаблонізованому корені `session.store`. Такі
виявлені сховища мають визначатися як звичайні файли `sessions.json` всередині
кореня агента; символьні посилання та шляхи за межами кореня пропускаються.

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

Запустити обслуговування зараз (замість очікування наступного циклу запису):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` використовує налаштування `session.maintenance` з конфігурації:

- Примітка щодо області: `openclaw sessions cleanup` обслуговує сховища сеансів, транскрипти та побічні файли траєкторій. Вона не очищає журнали запусків cron (`cron/runs/<jobId>.jsonl`), якими керують `cron.runLog.maxBytes` і `cron.runLog.keepLines` у [конфігурації Cron](/uk/automation/cron-jobs#configuration) та які пояснено в [обслуговуванні Cron](/uk/automation/cron-jobs#maintenance).

- `--dry-run`: попередньо показати, скільки записів буде видалено/обмежено без запису.
  - У текстовому режимі dry-run друкує таблицю дій для кожного сеансу (`Action`, `Key`, `Age`, `Model`, `Flags`), щоб можна було побачити, що буде збережено, а що видалено.
- `--enforce`: застосувати обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видалити записи, чиї файли транскриптів відсутні, навіть якщо вони зазвичай ще не підлягали б видаленню за віком/кількістю.
- `--active-key <key>`: захистити конкретний активний ключ від витіснення через дисковий бюджет. Стійкі зовнішні вказівники розмов, як-от групові сеанси та чат-сеанси в межах треду, також зберігаються під час обслуговування за віком/кількістю/дисковим бюджетом.
- `--agent <id>`: запустити очищення для одного налаштованого сховища агента.
- `--all-agents`: запустити очищення для всіх налаштованих сховищ агентів.
- `--store <path>`: виконати для конкретного файлу `sessions.json`.
- `--json`: надрукувати підсумок JSON. З `--all-agents` вивід містить один підсумок на кожне сховище.

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

- Конфігурація сеансів: [довідник із конфігурації](/uk/gateway/config-agents#session)

## Пов’язане

- [довідник CLI](/uk/cli)
- [керування сеансами](/uk/concepts/session)
