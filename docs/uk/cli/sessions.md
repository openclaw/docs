---
read_when:
    - Ви хочете переглянути список збережених сеансів і побачити нещодавню активність
summary: Довідник CLI для `openclaw sessions` (список збережених сеансів + використання)
title: Сесії
x-i18n:
    generated_at: "2026-05-07T13:15:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Показує список збережених сеансів розмов.

Списки сеансів не є перевірками доступності каналів або провайдерів. Вони показують збережені
рядки розмов зі сховищ сеансів. Тихий Discord, Slack, Telegram або
інший канал може успішно перепідключитися без створення нового рядка сеансу,
доки не буде оброблено повідомлення. Використовуйте `openclaw channels status --probe`,
`openclaw status --deep` або `openclaw health --verbose`, коли потрібна жива
підключеність каналу.

Відповіді `openclaw sessions` і Gateway `sessions.list` за замовчуванням
обмежені, щоб великі довготривалі сховища не монополізували процес CLI або
цикл подій Gateway. CLI за замовчуванням повертає 100 найновіших сеансів; передайте
`--limit <n>` для меншого або більшого вікна чи `--limit all`, коли вам навмисно
потрібне повне сховище. JSON-відповіді містять `totalCount`, `limitApplied` і
`hasMore`, коли викликачам потрібно показати, що існують додаткові рядки.

RPC-клієнти можуть передати `configuredAgentsOnly: true`, щоб зберегти широке комбіноване
джерело виявлення, але повертати лише рядки для агентів, які зараз присутні в конфігурації.
Інтерфейс керування використовує цей режим за замовчуванням, щоб видалені або лише дискові сховища агентів
не з’являлися знову в поданні Сеанси.

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
- `--all-agents`: агрегувати всі налаштовані сховища агентів
- `--store <path>`: явний шлях до сховища (не можна поєднувати з `--agent` або `--all-agents`)
- `--limit <n|all>`: максимальна кількість рядків для виведення (за замовчуванням `100`; `all` відновлює повне виведення)

Експортувати пакет траєкторії для збереженого сеансу:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Це шлях команди, який використовує slash-команда `/export-trajectory` після того, як
власник схвалить запит на виконання. Вихідний каталог завжди розв’язується
всередині `.openclaw/trajectory-exports/` у вибраному робочому просторі.

`openclaw sessions --all-agents` читає налаштовані сховища агентів. Виявлення сеансів
Gateway і ACP ширше: воно також включає лише дискові сховища, знайдені під
коренем `agents/` за замовчуванням або шаблонізованим коренем `session.store`. Ці
виявлені сховища мають розв’язуватися до звичайних файлів `sessions.json` всередині
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
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` використовує налаштування `session.maintenance` з конфігурації:

- Примітка щодо області: `openclaw sessions cleanup` обслуговує сховища сеансів, транскрипти та побічні файли траєкторій. Вона не обрізає журнали запусків Cron (`cron/runs/<jobId>.jsonl`), якими керують `cron.runLog.maxBytes` і `cron.runLog.keepLines` у [Конфігурації Cron](/uk/automation/cron-jobs#configuration) і які пояснено в [Обслуговуванні Cron](/uk/automation/cron-jobs#maintenance).
- Очищення також обрізає непов’язані первинні транскрипти, контрольні точки Compaction і побічні файли траєкторій, старші за `session.maintenance.pruneAfter`; файли, на які все ще посилається `sessions.json`, зберігаються.

- `--dry-run`: попередньо показати, скільки записів буде обрізано або обмежено без запису.
  - У текстовому режимі dry-run друкує таблицю дій для кожного сеансу (`Action`, `Key`, `Age`, `Model`, `Flags`), щоб ви могли побачити, що буде збережено, а що видалено.
- `--enforce`: застосувати обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видалити записи, чиї файли транскриптів відсутні, навіть якщо зазвичай вони ще не вибули б за віком або кількістю.
- `--fix-dm-scope`: коли `session.dmScope` дорівнює `main`, вивести з ужитку застарілі рядки прямих DM з ключами співрозмовників, залишені попередньою маршрутизацією `per-peer`, `per-channel-peer` або `per-account-channel-peer`. Спочатку використовуйте `--dry-run`; застосування очищення видаляє ці рядки з `sessions.json` і зберігає їхні транскрипти як видалені архіви.
- `--active-key <key>`: захистити конкретний активний ключ від вилучення через дисковий бюджет. Довговічні зовнішні вказівники розмов, як-от групові сеанси та сеанси чатів у межах треду, також зберігаються під час обслуговування за віком, кількістю та дисковим бюджетом.
- `--agent <id>`: запустити очищення для одного налаштованого сховища агента.
- `--all-agents`: запустити очищення для всіх налаштованих сховищ агентів.
- `--store <path>`: запустити для конкретного файлу `sessions.json`.
- `--json`: надрукувати JSON-зведення. З `--all-agents` виведення містить одне зведення для кожного сховища.

Коли Gateway доступний, очищення без dry-run для налаштованих сховищ агентів
надсилається через Gateway, щоб воно використовувало той самий записувач сховища сеансів, що й runtime-трафік.
Використовуйте `--store <path>` для явного офлайн-відновлення файлу сховища.

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
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Пов’язане:

- Конфігурація сеансів: [Довідник конфігурації](/uk/gateway/config-agents#session)

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Керування сеансами](/uk/concepts/session)
