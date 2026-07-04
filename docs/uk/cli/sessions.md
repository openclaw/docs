---
read_when:
    - Ви хочете переглянути список збережених сеансів і побачити нещодавню активність
summary: Довідник CLI для `openclaw sessions` (список збережених сеансів + використання)
title: Сеанси
x-i18n:
    generated_at: "2026-07-04T20:42:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Показує збережені сеанси розмов.

Списки сеансів не є перевірками активності каналу/провайдера. Вони показують збережені
рядки розмов зі сховищ сеансів. Тихий Discord, Slack, Telegram або
інший канал може успішно перепідключитися без створення нового рядка сеансу,
доки повідомлення не буде оброблено. Використовуйте `openclaw channels status --probe`,
`openclaw status --deep` або `openclaw health --verbose`, коли потрібна жива
підключеність каналу.

Відповіді `openclaw sessions` і Gateway `sessions.list` за замовчуванням
обмежені, щоб великі довготривалі сховища не монополізували процес CLI або
цикл подій Gateway. CLI за замовчуванням повертає 100 найновіших сеансів; передайте
`--limit <n>` для меншого/більшого вікна або `--limit all`, коли вам навмисно
потрібне повне сховище. JSON-відповіді містять `totalCount`, `limitApplied` і
`hasMore`, коли викликачам потрібно показати, що існує більше рядків.

RPC-клієнти можуть передати `configuredAgentsOnly: true`, щоб зберегти широке
об’єднане джерело виявлення, але повертати лише рядки для агентів, які зараз
присутні в конфігурації. Control UI використовує цей режим за замовчуванням,
щоб видалені або лише дискові сховища агентів не з’являлися знову у поданні Sessions.

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

Виводьте в реальному часі зрозумілий для людини прогрес траєкторії для збережених сеансів:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` відображає останні події JSONL траєкторії як компактні рядки прогресу. Без `--session-key` він спершу стежить за запущеними сеансами, а потім за останнім збереженим сеансом. `--tail <count>` керує тим, скільки наявних подій друкується перед режимом стеження; значення за замовчуванням — `80`, а `0` починає з поточного кінця. `--follow` продовжує стежити за вибраними файлами траєкторій, включно з переміщеними файлами, на які посилається `<session>.trajectory-path.json`.

Подання прогресу навмисно консервативне: текст промпта, аргументи інструментів і тіла результатів інструментів не друкуються. Виклики інструментів показують назву інструмента з `{...redacted...}`; результати інструментів показують статус, як-от `ok`, `error` або `done`; рядки завершення моделі показують провайдера/модель і кінцевий статус.

Експортуйте пакет траєкторії для збереженого сеансу:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Це шлях команди, який використовується slash-командою `/export-trajectory` після
того, як власник схвалить запит exec. Вихідний каталог завжди визначається
всередині `.openclaw/trajectory-exports/` у вибраному робочому просторі.

`openclaw sessions --all-agents` читає налаштовані сховища агентів. Виявлення
сеансів Gateway і ACP ширше: воно також включає лише дискові сховища, знайдені
під коренем `agents/` за замовчуванням або шаблонізованим коренем `session.store`.
Ці виявлені сховища мають розв’язуватися у звичайні файли `sessions.json`
всередині кореня агента; символічні посилання та шляхи поза коренем пропускаються.

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

Запустіть обслуговування зараз (замість очікування наступного циклу запису):

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

- Примітка щодо області: `openclaw sessions cleanup` обслуговує сховища сеансів, транскрипти та супровідні файли траєкторій. Він не обрізає історію запусків Cron, якою керує `cron.runLog.keepLines` у [конфігурації Cron](/uk/automation/cron-jobs#configuration) і яку пояснено в [обслуговуванні Cron](/uk/automation/cron-jobs#maintenance).
- Очищення також обрізає непосилані основні транскрипти, контрольні точки Compaction і супровідні файли траєкторій, старші за `session.maintenance.pruneAfter`; файли, на які досі посилається `sessions.json`, зберігаються.
- Очищення повідомляє про короткочасне очищення пробних gateway model-run окремо як `modelRunPruned`. Це відповідає лише суворим явним ключам форми `agent:*:explicit:model-run-<uuid>`. Фіксоване утримання — `24h`, але воно залежить від навантаження: застарілі рядки проб видаляються лише тоді, коли досягнуто обслуговування/тиск ліміту записів сеансів. Коли воно виконується, очищення model-run відбувається перед глобальним очищенням застарілого та обмеженням.

- `--dry-run`: попередньо показати, скільки записів було б обрізано/обмежено без запису.
  - У текстовому режимі dry-run друкує таблицю дій для кожного сеансу (`Action`, `Key`, `Age`, `Model`, `Flags`) плюс підсумок, згрупований за міткою сеансу, щоб ви могли побачити, що буде збережено, а що видалено.
- `--enforce`: застосувати обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видалити записи, чиї файли транскриптів відсутні або містять лише заголовок/порожні, навіть якщо вони ще зазвичай не підпали б під обмеження віку/кількості.
- `--fix-dm-scope`: коли `session.dmScope` має значення `main`, вилучити застарілі peer-keyed direct-DM рядки, залишені попередньою маршрутизацією `per-peer`, `per-channel-peer` або `per-account-channel-peer`. Спершу використайте `--dry-run`; застосування очищення видаляє ці рядки з `sessions.json` і зберігає їхні транскрипти як видалені архіви.
- `--active-key <key>`: захистити конкретний активний ключ від витіснення через дисковий бюджет. Тривкі зовнішні вказівники розмов, як-от групові сеанси та чат-сеанси в межах потоку, також зберігаються обслуговуванням за віком/кількістю/дисковим бюджетом.
- `--agent <id>`: запустити очищення для одного налаштованого сховища агента.
- `--all-agents`: запустити очищення для всіх налаштованих сховищ агентів.
- `--store <path>`: виконати для конкретного файлу `sessions.json`.
- `--json`: надрукувати JSON-підсумок. З `--all-agents` вивід містить по одному підсумку для кожного сховища.

Коли Gateway доступний, очищення без dry-run для налаштованих сховищ агентів
надсилається через Gateway, щоб воно використовувало той самий записувач сховища
сеансів, що й трафік runtime. Використовуйте `--store <path>` для явного
офлайн-відновлення файла сховища.

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

## Стиснення сеансу

Поверніть бюджет контексту для завислого або надмірно великого сеансу. `openclaw sessions compact <key>` — це основна обгортка навколо Gateway RPC `sessions.compact`, яка потребує запущеного Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Без `--max-lines` gateway виконує LLM-зведення транскрипту. CLI за замовчуванням не накладає клієнтський дедлайн; gateway володіє налаштованим життєвим циклом Compaction.
- З `--max-lines <n>` він обрізає до останніх `n` рядків транскрипту й архівує попередній транскрипт як супровідний файл `.bak`.
- `--agent <id>`: агент, якому належить сеанс; обов’язково для ключів `global`.
- `--url` / `--token` / `--password`: перевизначення підключення до gateway.
- `--timeout <ms>`: необов’язковий клієнтський тайм-аут RPC у мілісекундах.
- `--json`: надрукувати сирий payload RPC.

Команда завершується з ненульовим кодом, коли gateway повідомляє про невдалу Compaction або недоступний, тому crons і скрипти ніколи не сплутають тихий no-op з успіхом.

> Примітка: `openclaw agent --message '/compact ...'` **не** є шляхом Compaction. Slash-команди з CLI відхиляються перевіркою authorized-sender; цей виклик завершується з ненульовим кодом із вказівкою сюди замість тихого no-op.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` приймає:

| Поле      | Тип        | Обов’язково | Опис                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | так      | Ключ сеансу для стиснення (наприклад `agent:main:main`).    |
| `agentId`  | string      | ні       | Ідентифікатор агента, якому належить сеанс (для ключів `global`).        |
| `maxLines` | integer ≥ 1 | ні       | Обрізати до останніх N рядків замість LLM-зведення. |

Приклад відповіді LLM-зведення:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Приклад відповіді обрізання (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Пов’язане

- Конфігурація сеансів: [довідник конфігурації](/uk/gateway/config-agents#session)
- [Довідник CLI](/uk/cli)
- [Керування сеансами](/uk/concepts/session)
