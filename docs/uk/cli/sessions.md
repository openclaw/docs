---
read_when:
    - Ви хочете переглянути список збережених сеансів і побачити нещодавню активність
summary: Довідник CLI для `openclaw sessions` (список збережених сеансів + використання)
title: Сеанси
x-i18n:
    generated_at: "2026-06-27T17:22:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Перелічує збережені сеанси розмов.

Списки сеансів не є перевірками доступності каналів/провайдерів. Вони показують збережені
рядки розмов зі сховищ сеансів. Тихий Discord, Slack, Telegram або
інший канал може успішно перепідключитися без створення нового рядка сеансу,
доки повідомлення не буде оброблено. Використовуйте `openclaw channels status --probe`,
`openclaw status --deep` або `openclaw health --verbose`, коли потрібна жива
підключеність каналу.

Відповіді `openclaw sessions` і Gateway `sessions.list` типово обмежені,
щоб великі довгоживучі сховища не могли монополізувати процес CLI або цикл
подій Gateway. CLI типово повертає 100 найновіших сеансів; передайте
`--limit <n>` для меншого/більшого вікна або `--limit all`, коли вам навмисно
потрібне повне сховище. JSON-відповіді містять `totalCount`, `limitApplied` і
`hasMore`, коли клієнтам потрібно показати, що існують додаткові рядки.

RPC-клієнти можуть передати `configuredAgentsOnly: true`, щоб зберегти широке комбіноване
джерело виявлення, але повертати лише рядки для агентів, які наразі присутні в конфігурації.
Control UI типово використовує цей режим, щоб видалені або лише дискові сховища агентів
не з’являлися знову у поданні Sessions.

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

- типово: налаштоване типове сховище агента
- `--verbose`: докладне журналювання
- `--agent <id>`: одне налаштоване сховище агента
- `--all-agents`: агрегувати всі налаштовані сховища агентів
- `--store <path>`: явний шлях до сховища (не можна поєднувати з `--agent` або `--all-agents`)
- `--limit <n|all>`: максимальна кількість рядків для виведення (типово `100`; `all` відновлює повне виведення)

Відстеження людиночитного прогресу траєкторії для збережених сеансів:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` відтворює нещодавні події траєкторії JSONL як компактні рядки прогресу. Без `--session-key` він спочатку відстежує запущені сеанси, а потім найновіший збережений сеанс. `--tail <count>` керує тим, скільки наявних подій вивести перед режимом стеження; типове значення — `80`, а `0` починає з поточного кінця. `--follow` продовжує стежити за вибраними файлами траєкторії, включно з переміщеними файлами, на які посилається `<session>.trajectory-path.json`.

Подання прогресу навмисно консервативне: текст промпта, аргументи інструментів і тіла результатів інструментів не друкуються. Виклики інструментів показують назву інструмента з `{...redacted...}`; результати інструментів показують статус, як-от `ok`, `error` або `done`; рядки завершення моделі показують провайдера/модель і кінцевий статус.

Експортуйте пакет траєкторії для збереженого сеансу:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Це шлях команди, який використовує slash-команда `/export-trajectory` після того,
як власник схвалює запит exec. Вихідний каталог завжди розв’язується
всередині `.openclaw/trajectory-exports/` під вибраним робочим простором.

`openclaw sessions --all-agents` читає налаштовані сховища агентів. Виявлення
сеансів Gateway і ACP ширше: воно також включає лише дискові сховища, знайдені під
типовим коренем `agents/` або шаблонізованим коренем `session.store`. Ці
виявлені сховища мають розв’язуватися у звичайні файли `sessions.json` усередині
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

`openclaw sessions cleanup` використовує параметри `session.maintenance` з конфігурації:

- Примітка щодо області: `openclaw sessions cleanup` обслуговує сховища сеансів, транскрипти та допоміжні файли траєкторій. Він не обрізає історію запусків cron, якою керує `cron.runLog.keepLines` у [конфігурації Cron](/uk/automation/cron-jobs#configuration) і яку пояснено в [обслуговуванні Cron](/uk/automation/cron-jobs#maintenance).
- Очищення також обрізає непов’язані первинні транскрипти, контрольні точки Compaction і допоміжні файли траєкторій, старіші за `session.maintenance.pruneAfter`; файли, на які все ще посилається `sessions.json`, зберігаються.
- Очищення окремо звітує про очищення короткоживучих пробних запусків моделей gateway як `modelRunPruned`. Це відповідає лише суворим явним ключам форми `agent:*:explicit:model-run-<uuid>`. Фіксоване утримання становить `24h`, але воно обмежене тиском: воно видаляє застарілі рядки проб лише тоді, коли досягнуто обслуговування/тиск ліміту записів сеансів. Коли воно запускається, очищення model-run відбувається перед глобальним очищенням застарілих записів і обмеженням.

- `--dry-run`: попередньо переглянути, скільки записів було б обрізано/обмежено без запису.
  - У текстовому режимі dry-run друкує таблицю дій для кожного сеансу (`Action`, `Key`, `Age`, `Model`, `Flags`) плюс зведення, згруповане за міткою сеансу, щоб ви могли побачити, що було б збережено, а що видалено.
- `--enforce`: застосувати обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.
- `--fix-missing`: видалити записи, чиї файли транскриптів відсутні або містять лише заголовок/порожні, навіть якщо вони зазвичай ще не вибули б за віком/кількістю.
- `--fix-dm-scope`: коли `session.dmScope` має значення `main`, вилучити застарілі peer-keyed рядки прямих DM, залишені попередньою маршрутизацією `per-peer`, `per-channel-peer` або `per-account-channel-peer`. Спочатку використовуйте `--dry-run`; застосування очищення видаляє ці рядки з `sessions.json` і зберігає їхні транскрипти як видалені архіви.
- `--active-key <key>`: захистити конкретний активний ключ від витіснення через дисковий бюджет. Довговічні зовнішні вказівники розмов, як-от групові сеанси та сеанси чатів, обмежені темою, також зберігаються обслуговуванням за віком/кількістю/дисковим бюджетом.
- `--agent <id>`: запустити очищення для одного налаштованого сховища агента.
- `--all-agents`: запустити очищення для всіх налаштованих сховищ агентів.
- `--store <path>`: виконати для конкретного файлу `sessions.json`.
- `--json`: надрукувати JSON-зведення. З `--all-agents` вивід містить одне зведення для кожного сховища.

Коли Gateway доступний, очищення без dry-run для налаштованих сховищ агентів
надсилається через Gateway, щоб воно використовувало той самий записувач сховища сеансів, що й runtime
трафік. Використовуйте `--store <path>` для явного офлайн-виправлення файлу сховища.

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

Поверніть бюджет контексту для завислого або надмірно великого сеансу. `openclaw sessions compact <key>` — це основна обгортка навколо Gateway RPC `sessions.compact`, і вона потребує запущеного gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Без `--max-lines` gateway LLM-узагальнює транскрипт. Це може бути повільно, тому типове значення `--timeout` становить `180000` мс.
- З `--max-lines <n>` він обрізає до останніх `n` рядків транскрипту й архівує попередній транскрипт як допоміжний файл `.bak`.
- `--agent <id>`: агент, якому належить сеанс; обов’язково для ключів `global`.
- `--url` / `--token` / `--password`: перевизначення підключення gateway.
- `--timeout <ms>`: тайм-аут RPC у мілісекундах.
- `--json`: надрукувати сире корисне навантаження RPC.

Команда завершується з ненульовим кодом, коли gateway повідомляє про невдалу Compaction або недоступний, тому crons і скрипти ніколи не сплутають тиху відсутність дії з успіхом.

> Примітка: `openclaw agent --message '/compact ...'` **не** є шляхом Compaction. Slash-команди з CLI відхиляються перевіркою авторизованого відправника; цей виклик завершується з ненульовим кодом із підказкою, що вказує сюди, замість тихої відсутності дії.

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` приймає:

| Поле       | Тип         | Обов’язково | Опис                                                       |
| ---------- | ----------- | ----------- | ---------------------------------------------------------- |
| `key`      | string      | так         | Ключ сеансу для стиснення (наприклад `agent:main:main`).   |
| `agentId`  | string      | ні          | Ідентифікатор агента, якому належить сеанс (для ключів `global`). |
| `maxLines` | integer ≥ 1 | ні          | Обрізати до останніх N рядків замість LLM-узагальнення.    |

Приклад відповіді LLM-узагальнення:

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

- Конфігурація сеансів: [Довідник конфігурації](/uk/gateway/config-agents#session)
- [Довідник CLI](/uk/cli)
- [Керування сеансами](/uk/concepts/session)
