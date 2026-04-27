---
read_when:
    - Ви хочете переглянути список збережених сеансів і недавню активність
summary: Довідка CLI для `openclaw sessions` (перелік збережених сеансів + використання)
title: Сеанси
x-i18n:
    generated_at: "2026-04-27T20:08:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77bf1cdc5cb1688889ec5155241ed98a2c62204c56e727a1174c593a79c78ca8
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Перелічує збережені сеанси розмов.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Вибір області:

- за замовчуванням: сховище агента, налаштоване за замовчуванням
- `--verbose`: докладне журналювання
- `--agent <id>`: одне налаштоване сховище агента
- `--all-agents`: агрегує всі налаштовані сховища агентів
- `--store <path>`: явний шлях до сховища (не можна поєднувати з `--agent` або `--all-agents`)

`openclaw sessions --all-agents` читає налаштовані сховища агентів. Виявлення
сеансів Gateway і ACP має ширше охоплення: воно також включає сховища, знайдені
лише на диску, у стандартному корені `agents/` або в корені `session.store`,
заданому шаблоном. Ці виявлені сховища мають відповідати звичайним файлам
`sessions.json` усередині кореня агента; символічні посилання та шляхи поза
коренем пропускаються.

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

- Примітка щодо області дії: `openclaw sessions cleanup` обслуговує сховища сеансів, стенограми та побічні файли траєкторій. Воно не обрізає журнали запусків Cron (`cron/runs/<jobId>.jsonl`), якими керують `cron.runLog.maxBytes` і `cron.runLog.keepLines` у [конфігурації Cron](/uk/automation/cron-jobs#configuration), а також які описані в [обслуговуванні Cron](/uk/automation/cron-jobs#maintenance).

- `--dry-run`: попередньо показує, скільки записів буде вилучено/обмежено без запису.
  - У текстовому режимі dry-run виводить таблицю дій по сеансах (`Action`, `Key`, `Age`, `Model`, `Flags`), щоб ви могли побачити, що буде збережено, а що видалено.
- `--enforce`: застосовує обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видаляє записи, у яких відсутні файли стенограм, навіть якщо вони зазвичай ще не підлягали б видаленню за віком/кількістю.
- `--active-key <key>`: захищає конкретний активний ключ від витіснення через обмеження дискового бюджету.
- `--agent <id>`: запускає очищення для одного налаштованого сховища агента.
- `--all-agents`: запускає очищення для всіх налаштованих сховищ агентів.
- `--store <path>`: запускає очищення для конкретного файла `sessions.json`.
- `--json`: виводить підсумок у форматі JSON. Із `--all-agents` вивід містить по одному підсумку для кожного сховища.

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

- Конфігурація сеансів: [Довідник із конфігурації](/uk/gateway/config-agents#session)

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Керування сеансами](/uk/concepts/session)
