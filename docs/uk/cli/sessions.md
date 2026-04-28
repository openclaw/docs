---
read_when:
    - Ви хочете переглянути список збережених сеансів і побачити нещодавню активність
summary: Довідник CLI для `openclaw sessions` (список збережених сеансів + використання)
title: Сеанси
x-i18n:
    generated_at: "2026-04-28T22:44:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Перелічує збережені сесії розмов.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Вибір області:

- типово: налаштоване стандартне сховище агента
- `--verbose`: докладне журналювання
- `--agent <id>`: одне налаштоване сховище агента
- `--all-agents`: об'єднати всі налаштовані сховища агентів
- `--store <path>`: явний шлях до сховища (не можна поєднувати з `--agent` або `--all-agents`)

Експортувати пакет траєкторії для збереженої сесії:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Це шлях команди, який використовується slash-командою `/export-trajectory` після того,
як власник схвалює запит на виконання. Вихідний каталог завжди визначається
всередині `.openclaw/trajectory-exports/` у вибраному робочому просторі.

`openclaw sessions --all-agents` читає налаштовані сховища агентів. Виявлення сесій Gateway і ACP
ширше: воно також включає сховища лише на диску, знайдені під
стандартним коренем `agents/` або шаблонним коренем `session.store`. Ці
виявлені сховища мають визначатися як звичайні файли `sessions.json` всередині
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

- Примітка щодо області: `openclaw sessions cleanup` обслуговує сховища сесій, транскрипти та супровідні файли траєкторій. Вона не обрізає журнали запусків Cron (`cron/runs/<jobId>.jsonl`), якими керують `cron.runLog.maxBytes` і `cron.runLog.keepLines` у [конфігурації Cron](/uk/automation/cron-jobs#configuration) та які пояснено в [обслуговуванні Cron](/uk/automation/cron-jobs#maintenance).

- `--dry-run`: попередньо показати, скільки записів було б очищено/обмежено без запису.
  - У текстовому режимі dry-run друкує таблицю дій для кожної сесії (`Action`, `Key`, `Age`, `Model`, `Flags`), щоб було видно, що буде збережено, а що видалено.
- `--enforce`: застосувати обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видалити записи, чиї файли транскриптів відсутні, навіть якщо зазвичай вони ще не підпали б під обмеження віку/кількості.
- `--active-key <key>`: захистити певний активний ключ від витіснення через дисковий бюджет.
- `--agent <id>`: запустити очищення для одного налаштованого сховища агента.
- `--all-agents`: запустити очищення для всіх налаштованих сховищ агентів.
- `--store <path>`: виконати для певного файла `sessions.json`.
- `--json`: надрукувати зведення JSON. З `--all-agents` вивід містить одне зведення для кожного сховища.

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

Пов'язано:

- Конфігурація сесій: [довідник конфігурації](/uk/gateway/config-agents#session)

## Пов'язано

- [Довідник CLI](/uk/cli)
- [Керування сесіями](/uk/concepts/session)
