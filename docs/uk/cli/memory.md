---
read_when:
    - Ви хочете індексувати або шукати семантичну пам’ять
    - Ви налагоджуєте доступність пам’яті або індексування
    - Ви хочете перенести відновлену короткострокову пам’ять до `MEMORY.md`
summary: Довідник CLI для `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Пам’ять
x-i18n:
    generated_at: "2026-04-27T13:13:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Керує індексуванням і пошуком семантичної пам’яті.
Надається активним плагіном пам’яті (типово: `memory-core`; установіть `plugins.slots.memory = "none"`, щоб вимкнути).

Пов’язане:

- Концепція Memory: [Пам’ять](/uk/concepts/memory)
- Вікі Memory: [Вікі Memory](/uk/plugins/memory-wiki)
- CLI вікі: [wiki](/uk/cli/wiki)
- Плагіни: [Плагіни](/uk/tools/plugin)

## Приклади

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Параметри

`memory status` і `memory index`:

- `--agent <id>`: обмежити однією агентою. Без цього ці команди виконуються для кожної налаштованої агенти; якщо список агентів не налаштовано, вони повертаються до типової агенти.
- `--verbose`: виводити докладні журнали під час перевірок і індексування.

`memory status`:

- `--deep`: перевірити доступність векторів і вбудовувань. Звичайний `memory status` лишається швидким і не виконує живий ping вбудовувань. Лексичний QMD `searchMode: "search"` пропускає перевірки семантичних векторів і обслуговування вбудовувань навіть із `--deep`.
- `--index`: запустити переіндексацію, якщо сховище брудне (має на увазі `--deep`).
- `--fix`: виправити застарілі блокування відновлення та нормалізувати метадані просування.
- `--json`: вивести JSON.

Якщо `memory status` показує `Dreaming status: blocked`, керований Cron Dreaming увімкнений, але Heartbeat, який його запускає, не спрацьовує для типової агенти. Див. [Dreaming never runs](/uk/concepts/dreaming#dreaming-never-runs-status-shows-blocked) щодо двох поширених причин.

`memory index`:

- `--force`: примусово виконати повну переіндексацію.

`memory search`:

- Вхід запиту: передайте або позиційний `[query]`, або `--query <text>`.
- Якщо вказано обидва, пріоритет має `--query`.
- Якщо не вказано жодного, команда завершується з помилкою.
- `--agent <id>`: обмежити однією агентою (типово: типова агента).
- `--max-results <n>`: обмежити кількість повернених результатів.
- `--min-score <n>`: відфільтрувати збіги з низькою оцінкою.
- `--json`: вивести результати у JSON.

`memory promote`:

Попередній перегляд і застосування просування короткострокової пам’яті.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- записати просування до `MEMORY.md` (типово: лише попередній перегляд).
- `--limit <n>` -- обмежити кількість показаних кандидатів.
- `--include-promoted` -- включити записи, уже просунуті в попередніх циклах.

Повні параметри:

- Ранжує короткострокових кандидатів із `memory/YYYY-MM-DD.md` за зваженими сигналами просування (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Використовує короткострокові сигнали як із відновлень пам’яті, так і з щоденних проходів поглинання, а також сигнали підсилення фаз light/REM.
- Коли Dreaming увімкнено, `memory-core` автоматично керує одним завданням Cron, яке запускає повний цикл (`light -> REM -> deep`) у фоновому режимі (ручний `openclaw cron add` не потрібен).
- `--agent <id>`: обмежити однією агентою (типово: типова агента).
- `--limit <n>`: максимальна кількість кандидатів для повернення/застосування.
- `--min-score <n>`: мінімальна зважена оцінка просування.
- `--min-recall-count <n>`: мінімальна кількість відновлень, потрібна для кандидата.
- `--min-unique-queries <n>`: мінімальна кількість різних запитів, потрібна для кандидата.
- `--apply`: додати вибраних кандидатів до `MEMORY.md` і позначити їх як просунуті.
- `--include-promoted`: включити вивід уже просунутих кандидатів.
- `--json`: вивести JSON.

`memory promote-explain`:

Пояснити конкретного кандидата на просування та розклад його оцінки.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: ключ кандидата, фрагмент шляху або фрагмент уривка для пошуку.
- `--agent <id>`: обмежити однією агентою (типово: типова агента).
- `--include-promoted`: включити вже просунутих кандидатів.
- `--json`: вивести JSON.

`memory rem-harness`:

Попередньо переглянути REM-рефлексії, кандидатні істини та вивід deep-просування без будь-якого запису.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: обмежити однією агентою (типово: типова агента).
- `--include-promoted`: включити вже просунутих deep-кандидатів.
- `--json`: вивести JSON.

## Dreaming

Dreaming — це фонова система консолідації пам’яті з трьома кооперативними
фазами: **light** (сортування/підготовка короткострокового матеріалу), **deep** (просування
сталих фактів до `MEMORY.md`) і **REM** (рефлексія та виявлення тем).

- Увімкніть через `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Перемикайте з чату за допомогою `/dreaming on|off` (або перевіряйте через `/dreaming status`).
- Dreaming працює за одним керованим розкладом циклу (`dreaming.frequency`) і виконує фази в порядку: light, REM, deep.
- Лише фаза deep записує сталу пам’ять до `MEMORY.md`.
- Людинозрозумілий вивід фаз і записи щоденника пишуться до `DREAMS.md` (або наявного `dreams.md`), з необов’язковими звітами по фазах у `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ранжування використовує зважені сигнали: частота відновлення, релевантність витягування, різноманіття запитів, часова новизна, міжденна консолідація та похідне концептуальне багатство.
- Під час просування перед записом до `MEMORY.md` повторно читається жива щоденна нотатка, тож відредаговані або видалені короткострокові уривки не будуть просунуті зі застарілих знімків сховища відновлень.
- Заплановані та ручні запуски `memory promote` використовують однакові типові значення фази deep, якщо ви не передасте перевизначення порогів через CLI.
- Автоматичні запуски розподіляються між налаштованими робочими просторами пам’яті.

Типовий розклад:

- **Частота циклу**: `dreaming.frequency = 0 3 * * *`
- **Пороги deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Приклад:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Примітки:

- `memory index --verbose` виводить подробиці по фазах (провайдер, модель, джерела, активність пакетів).
- `memory status` включає всі додаткові шляхи, налаштовані через `memorySearch.extraPaths`.
- Якщо поля ключів віддаленого API active memory, які фактично використовуються, налаштовані як SecretRefs, команда отримує ці значення з активного знімка Gateway. Якщо Gateway недоступний, команда швидко завершується з помилкою.
- Примітка про розсинхронізацію версій Gateway: цей шлях команди потребує Gateway, який підтримує `secrets.resolve`; старіші Gateway повертають помилку unknown-method.
- Налаштуйте частоту запланованого циклу через `dreaming.frequency`. Політика deep-просування в іншому разі є внутрішньою; використовуйте прапорці CLI в `memory promote`, коли потрібні разові ручні перевизначення.
- `memory rem-harness --path <file-or-dir> --grounded` попередньо переглядає прив’язані до джерела `What Happened`, `Reflections` і `Possible Lasting Updates` з історичних щоденних нотаток без будь-якого запису.
- `memory rem-backfill --path <file-or-dir>` записує оборотні прив’язані до джерела записи щоденника в `DREAMS.md` для перегляду в інтерфейсі.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` також засіває прив’язаних до джерела сталих кандидатів до живого короткострокового сховища просування, щоб звичайна фаза deep могла їх ранжувати.
- `memory rem-backfill --rollback` видаляє раніше записані прив’язані до джерела записи щоденника, а `memory rem-backfill --rollback-short-term` видаляє раніше підготовлених прив’язаних до джерела короткострокових кандидатів.
- Див. [Dreaming](/uk/concepts/dreaming) для повного опису фаз і довідника з налаштування.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд пам’яті](/uk/concepts/memory)
