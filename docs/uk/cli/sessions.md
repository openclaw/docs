---
read_when:
    - Ви хочете переглянути список збережених сесій і побачити нещодавню активність
summary: Довідник CLI для `openclaw sessions` (список збережених сесій + використання)
title: сесії
x-i18n:
    generated_at: "2026-04-23T06:19:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47eb55d90bd0681676283310cfa50dcacc95dff7d9a39bf2bb188788c6e5e5ba
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Перегляд списку збережених сесій розмов.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Вибір області:

- типово: сховище типового агента, налаштоване в конфігурації
- `--verbose`: докладне журналювання
- `--agent <id>`: одне сховище налаштованого агента
- `--all-agents`: агрегувати всі сховища налаштованих агентів
- `--store <path>`: явний шлях до сховища (не можна поєднувати з `--agent` або `--all-agents`)

`openclaw sessions --all-agents` читає сховища налаштованих агентів. Виявлення сесій Gateway і ACP
має ширшу область: воно також включає сховища лише на диску, знайдені під
типовим коренем `agents/` або шаблонізованим коренем `session.store`. Ці
виявлені сховища мають визначатися як звичайні файли `sessions.json` усередині
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

`openclaw sessions cleanup` використовує параметри `session.maintenance` з конфігурації:

- Примітка щодо області: `openclaw sessions cleanup` обслуговує лише сховища сесій/transcript. Воно не очищує журнали запусків cron (`cron/runs/<jobId>.jsonl`), якими керують `cron.runLog.maxBytes` і `cron.runLog.keepLines` у [Cron configuration](/uk/automation/cron-jobs#configuration) і які пояснюються в [Cron maintenance](/uk/automation/cron-jobs#maintenance).

- `--dry-run`: попередньо показати, скільки записів буде очищено/обмежено без запису.
  - У текстовому режимі dry-run виводить таблицю дій для кожної сесії (`Action`, `Key`, `Age`, `Model`, `Flags`), щоб ви могли побачити, що буде збережено, а що видалено.
- `--enforce`: застосувати обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видалити записи, файли transcript яких відсутні, навіть якщо зазвичай вони ще не підлягали б очищенню через вік/кількість.
- `--active-key <key>`: захистити конкретний активний ключ від витіснення через бюджет диска.
- `--agent <id>`: запустити очищення для одного сховища налаштованого агента.
- `--all-agents`: запустити очищення для всіх сховищ налаштованих агентів.
- `--store <path>`: запустити для конкретного файла `sessions.json`.
- `--json`: вивести зведення JSON. Із `--all-agents` вивід містить одне зведення для кожного сховища.

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

- Конфігурація сесій: [Configuration reference](/uk/gateway/configuration-reference#session)
