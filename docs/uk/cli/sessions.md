---
read_when:
    - Ви хочете переглянути список збережених сеансів і побачити нещодавню активність
summary: Довідник CLI для `openclaw sessions` (перелік збережених сеансів + використання)
title: Сеанси
x-i18n:
    generated_at: "2026-05-05T06:44:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Показати список збережених сеансів розмов.

Списки сеансів не є перевірками активності каналів/провайдерів. Вони показують збережені
рядки розмов зі сховищ сеансів. Тихий Discord, Slack, Telegram або
інший канал може успішно перепідключитися без створення нового рядка сеансу,
доки повідомлення не буде оброблено. Використовуйте `openclaw channels status --probe`,
`openclaw status --deep` або `openclaw health --verbose`, коли потрібне живе
з’єднання каналу.

Відповіді `openclaw sessions` і Gateway `sessions.list` типово обмежені,
щоб великі довготривалі сховища не могли монополізувати процес CLI або цикл
подій Gateway. CLI типово повертає 100 найновіших сеансів; передайте
`--limit <n>` для меншого/більшого вікна або `--limit all`, коли вам навмисно
потрібне все сховище. Відповіді JSON містять `totalCount`, `limitApplied` і
`hasMore`, коли викликачам потрібно показати, що існує більше рядків.

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

- типово: налаштоване сховище агента за замовчуванням
- `--verbose`: докладне журналювання
- `--agent <id>`: одне налаштоване сховище агента
- `--all-agents`: агрегувати всі налаштовані сховища агентів
- `--store <path>`: явний шлях до сховища (не можна поєднувати з `--agent` або `--all-agents`)
- `--limit <n|all>`: максимальна кількість рядків для виводу (типово `100`; `all` відновлює повний вивід)

Експортувати пакет траєкторії для збереженого сеансу:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Це шлях команди, який використовує slash-команда `/export-trajectory` після того,
як власник схвалить запит exec. Каталог виводу завжди визначається
всередині `.openclaw/trajectory-exports/` у вибраному робочому просторі.

`openclaw sessions --all-agents` читає налаштовані сховища агентів. Виявлення
сеансів Gateway і ACP ширше: воно також включає сховища лише на диску, знайдені під
коренем `agents/` за замовчуванням або шаблонізованим коренем `session.store`. Ці
виявлені сховища мають визначатися як звичайні файли `sessions.json` усередині
кореня агента; символічні посилання та шляхи поза коренем пропускаються.

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

`openclaw sessions cleanup` використовує налаштування `session.maintenance` з конфігурації:

- Примітка щодо області: `openclaw sessions cleanup` обслуговує сховища сеансів, транскрипти та sidecar-файли траєкторій. Вона не обрізає журнали запусків cron (`cron/runs/<jobId>.jsonl`), якими керують `cron.runLog.maxBytes` і `cron.runLog.keepLines` у [конфігурації Cron](/uk/automation/cron-jobs#configuration) та які пояснено в [обслуговуванні Cron](/uk/automation/cron-jobs#maintenance).
- Очищення також обрізає первинні транскрипти без посилань, контрольні точки Compaction і sidecar-файли траєкторій, старші за `session.maintenance.pruneAfter`; файли, на які все ще посилається `sessions.json`, зберігаються.

- `--dry-run`: попередньо показати, скільки записів буде обрізано/обмежено без запису.
  - У текстовому режимі dry-run друкує таблицю дій для кожного сеансу (`Action`, `Key`, `Age`, `Model`, `Flags`), щоб ви могли побачити, що буде збережено, а що видалено.
- `--enforce`: застосувати обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видалити записи, чиї файли транскриптів відсутні, навіть якщо зазвичай вони ще не вийшли б за віком/кількістю.
- `--active-key <key>`: захистити конкретний активний ключ від витіснення за дисковим бюджетом. Стійкі зовнішні вказівники розмов, як-от групові сеанси та сеанси чату в межах потоку, також зберігаються під час обслуговування за віком/кількістю/дисковим бюджетом.
- `--agent <id>`: запустити очищення для одного налаштованого сховища агента.
- `--all-agents`: запустити очищення для всіх налаштованих сховищ агентів.
- `--store <path>`: запустити для конкретного файлу `sessions.json`.
- `--json`: надрукувати підсумок JSON. З `--all-agents` вивід містить по одному підсумку для кожного сховища.

Коли Gateway доступний, очищення без dry-run для налаштованих сховищ агентів
надсилається через Gateway, щоб воно використовувало той самий записувач сховища
сеансів, що й трафік під час виконання. Використовуйте `--store <path>` для явного
офлайн-виправлення файлу сховища.

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

- Конфігурація сеансів: [довідник конфігурації](/uk/gateway/config-agents#session)

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Керування сеансами](/uk/concepts/session)
