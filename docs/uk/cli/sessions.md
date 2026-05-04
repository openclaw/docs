---
read_when:
    - Ви хочете вивести список збережених сеансів і переглянути нещодавню активність
summary: Довідник CLI для `openclaw sessions` (перелік збережених сеансів + використання)
title: Сеанси
x-i18n:
    generated_at: "2026-05-04T06:12:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Показати список збережених сеансів розмов.

Списки сеансів не є перевірками доступності каналу/провайдера. Вони показують збережені
рядки розмов зі сховищ сеансів. Тихий Discord, Slack, Telegram або
інший канал може успішно перепідключитися без створення нового рядка сеансу,
доки не буде оброблено повідомлення. Використовуйте `openclaw channels status --probe`,
`openclaw status --deep` або `openclaw health --verbose`, коли потрібна жива
підключеність каналу.

Відповіді Gateway `sessions.list` за замовчуванням обмежені, щоб великі довгоживучі
сховища не монополізували цикл подій Gateway. Передавайте явний додатний
`limit` із RPC-клієнтів, коли потрібне інше вікно результатів; відповіді
містять `totalCount`, `limitApplied` і `hasMore`, коли викликачам потрібно показати,
що існує більше рядків.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Вибір області:

- default: налаштоване сховище агента за замовчуванням
- `--verbose`: докладне журналювання
- `--agent <id>`: одне налаштоване сховище агента
- `--all-agents`: агрегувати всі налаштовані сховища агентів
- `--store <path>`: явний шлях до сховища (не можна поєднувати з `--agent` або `--all-agents`)

Експортувати пакет траєкторії для збереженого сеансу:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Це шлях команди, який використовується slash-командою `/export-trajectory` після того,
як власник схвалить запит на виконання. Вихідний каталог завжди розв’язується
всередині `.openclaw/trajectory-exports/` у вибраному робочому просторі.

`openclaw sessions --all-agents` читає налаштовані сховища агентів. Виявлення сеансів Gateway і ACP
ширше: воно також включає сховища лише на диску, знайдені під
коренем `agents/` за замовчуванням або шаблонізованим коренем `session.store`. Ці
виявлені сховища мають розв’язуватися у звичайні файли `sessions.json` всередині
кореня агента; симлінки та шляхи поза коренем пропускаються.

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

`openclaw sessions cleanup` використовує налаштування `session.maintenance` із конфігурації:

- Примітка щодо області: `openclaw sessions cleanup` обслуговує сховища сеансів, транскрипти та бічні файли траєкторій. Вона не обрізає журнали запусків Cron (`cron/runs/<jobId>.jsonl`), які керуються `cron.runLog.maxBytes` і `cron.runLog.keepLines` у [конфігурації Cron](/uk/automation/cron-jobs#configuration) та пояснюються в [обслуговуванні Cron](/uk/automation/cron-jobs#maintenance).

- `--dry-run`: переглянути, скільки записів було б обрізано/обмежено без запису.
  - У текстовому режимі dry-run друкує таблицю дій для кожного сеансу (`Action`, `Key`, `Age`, `Model`, `Flags`), щоб ви могли бачити, що буде збережено, а що видалено.
- `--enforce`: застосувати обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видалити записи, файли транскриптів яких відсутні, навіть якщо вони зазвичай ще не були б вилучені за віком/кількістю.
- `--active-key <key>`: захистити певний активний ключ від витіснення через бюджет диска. Стійкі зовнішні вказівники розмов, як-от групові сеанси та сеанси чату в межах потоку, також зберігаються під час обслуговування за віком/кількістю/бюджетом диска.
- `--agent <id>`: запустити очищення для одного налаштованого сховища агента.
- `--all-agents`: запустити очищення для всіх налаштованих сховищ агентів.
- `--store <path>`: виконати для конкретного файлу `sessions.json`.
- `--json`: надрукувати зведення JSON. З `--all-agents` вивід містить одне зведення для кожного сховища.

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
