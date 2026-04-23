---
read_when:
    - Ви хочете переглянути збережені сесії та побачити нещодавню активність
summary: Довідник CLI для `openclaw sessions` (перелік збережених сесій і usage)
title: Сесії
x-i18n:
    generated_at: "2026-04-23T20:48:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 391da8e183be36e2844324137ad97199aa78094453097bb25265848ac9c72393
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Перелік збережених сесій розмов.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Вибір області:

- типово: сховище типового налаштованого агента
- `--verbose`: докладне журналювання
- `--agent <id>`: сховище одного налаштованого агента
- `--all-agents`: агрегувати всі сховища налаштованих агентів
- `--store <path>`: явний шлях до сховища (не можна поєднувати з `--agent` або `--all-agents`)

`openclaw sessions --all-agents` читає сховища налаштованих агентів. Виявлення сесій Gateway і ACP
ширше: воно також включає сховища, знайдені лише на диску, у типовому корені `agents/` або в шаблонізованому корені `session.store`. Ці
виявлені сховища мають розв’язуватися у звичайні файли `sessions.json` всередині
кореня агента; symlink і шляхи поза коренем пропускаються.

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

`openclaw sessions cleanup` використовує налаштування `session.maintenance` з конфігурації:

- Примітка щодо області: `openclaw sessions cleanup` обслуговує лише сховища сесій/транскрипти. Воно не обрізає журнали запусків Cron (`cron/runs/<jobId>.jsonl`), якими керують `cron.runLog.maxBytes` і `cron.runLog.keepLines` у [конфігурації Cron](/uk/automation/cron-jobs#configuration), а також пояснюються в [обслуговуванні Cron](/uk/automation/cron-jobs#maintenance).

- `--dry-run`: попередньо показати, скільки записів було б обрізано/обмежено без запису.
  - У текстовому режимі dry-run друкує таблицю дій для кожної сесії (`Action`, `Key`, `Age`, `Model`, `Flags`), щоб ви могли побачити, що буде збережено, а що видалено.
- `--enforce`: застосувати обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видалити записи, чиї файли транскриптів відсутні, навіть якщо зазвичай вони ще не підпадали б під вік/ліміт кількості.
- `--active-key <key>`: захистити конкретний активний ключ від витіснення через дисковий бюджет.
- `--agent <id>`: запустити очищення для одного сховища налаштованого агента.
- `--all-agents`: запустити очищення для всіх сховищ налаштованих агентів.
- `--store <path>`: запускати для конкретного файла `sessions.json`.
- `--json`: вивести зведення у форматі JSON. З `--all-agents` вивід містить одне зведення для кожного сховища.

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

- Конфігурація сесій: [Довідник із конфігурації](/uk/gateway/configuration-reference#session)
