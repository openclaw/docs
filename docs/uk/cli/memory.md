---
read_when:
    - Ви хочете індексувати або шукати семантичну пам’ять
    - Ви налагоджуєте доступність пам’яті або індексування
    - Ви хочете перенести відновлену короткочасну пам’ять до `MEMORY.md`
summary: Довідка CLI для `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Пам’ять
x-i18n:
    generated_at: "2026-04-27T12:59:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 965bcd0373e0146a0b1dac7e8166cab84e0d368c1d7d186e78a335f971917974
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Керує індексуванням і пошуком семантичної пам’яті.
Надається активним плагіном пам’яті (типово: `memory-core`; установіть `plugins.slots.memory = "none"`, щоб вимкнути).

Пов’язане:

- Концепція Memory: [Пам’ять](/uk/concepts/memory)
- Вікі Memory: [Вікі пам’яті](/uk/plugins/memory-wiki)
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

- `--agent <id>`: обмежити одним агентом. Без цього параметра ці команди виконуються для кожного налаштованого агента; якщо список агентів не налаштовано, вони повертаються до типового агента.
- `--verbose`: виводити докладні журнали під час перевірок та індексування.

`memory status`:

- `--deep`: перевірити доступність векторів і embedding. Звичайна команда `memory status` залишається швидкою і не виконує живий ping embedding.
- `--index`: виконати повторне індексування, якщо сховище забруднене (має на увазі `--deep`).
- `--fix`: виправити застарілі блокування recall і нормалізувати метадані перенесення.
- `--json`: вивести результат у форматі JSON.

Якщо `memory status` показує `Dreaming status: blocked`, це означає, що керований Cron Dreaming увімкнено, але Heartbeat, який його запускає, не спрацьовує для типового агента. Див. [Dreaming never runs](/uk/concepts/dreaming#dreaming-never-runs-status-shows-blocked) для двох найпоширеніших причин.

`memory index`:

- `--force`: примусово виконати повне повторне індексування.

`memory search`:

- Вхід запиту: передайте або позиційний `[query]`, або `--query <text>`.
- Якщо передано обидва, перевагу має `--query`.
- Якщо не передано жодного, команда завершується з помилкою.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--max-results <n>`: обмежити кількість повернених результатів.
- `--min-score <n>`: відфільтрувати збіги з низьким балом.
- `--json`: вивести результати у форматі JSON.

`memory promote`:

Попередній перегляд і застосування перенесення короткочасної пам’яті.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- записати перенесення до `MEMORY.md` (типово: лише попередній перегляд).
- `--limit <n>` -- обмежити кількість показаних кандидатів.
- `--include-promoted` -- включити записи, уже перенесені в попередніх циклах.

Повні параметри:

- Ранжує короткочасних кандидатів із `memory/YYYY-MM-DD.md` за допомогою зважених сигналів перенесення (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Використовує короткочасні сигнали як із recall пам’яті, так і з щоденних проходів ingest, а також легкі сигнали підкріплення фаз light/REM.
- Коли Dreaming увімкнено, `memory-core` автоматично керує одним завданням Cron, яке запускає повний цикл (`light -> REM -> deep`) у фоновому режимі (ручне `openclaw cron add` не потрібне).
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--limit <n>`: максимальна кількість кандидатів для повернення/застосування.
- `--min-score <n>`: мінімальний зважений бал перенесення.
- `--min-recall-count <n>`: мінімальна кількість recall, потрібна для кандидата.
- `--min-unique-queries <n>`: мінімальна кількість унікальних запитів, потрібна для кандидата.
- `--apply`: додати вибраних кандидатів до `MEMORY.md` і позначити їх як перенесені.
- `--include-promoted`: включити до виводу кандидатів, уже перенесених раніше.
- `--json`: вивести результат у форматі JSON.

`memory promote-explain`:

Пояснити конкретного кандидата на перенесення і розбивку його оцінки.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: ключ кандидата, фрагмент шляху або фрагмент уривка для пошуку.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже перенесених кандидатів.
- `--json`: вивести результат у форматі JSON.

`memory rem-harness`:

Попередньо переглянути REM-рефлексії, кандидатів на істини та результат deep-перенесення без жодного запису.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже перенесених deep-кандидатів.
- `--json`: вивести результат у форматі JSON.

## Dreaming

Dreaming — це фонова система консолідації пам’яті з трьома кооперативними
фазами: **light** (сортування/підготовка короткочасного матеріалу), **deep** (перенесення
стійких фактів до `MEMORY.md`) і **REM** (рефлексія та виявлення тем).

- Увімкніть через `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Перемикайте з чату командою `/dreaming on|off` (або переглядайте через `/dreaming status`).
- Dreaming працює за одним керованим розкладом циклів (`dreaming.frequency`) і виконує фази в порядку: light, REM, deep.
- Лише фаза deep записує стійку пам’ять до `MEMORY.md`.
- Зрозумілий для людини вивід фаз і записи щоденника записуються до `DREAMS.md` (або наявного `dreams.md`), з необов’язковими звітами по фазах у `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ранжування використовує зважені сигнали: частоту recall, релевантність отримання, різноманітність запитів, часову давність, консолідацію між днями та похідну концептуальну насиченість.
- Перед записом до `MEMORY.md` перенесення повторно зчитує актуальну щоденну нотатку, тож відредаговані або видалені короткочасні уривки не будуть перенесені зі застарілих знімків сховища recall.
- Заплановані й ручні запуски `memory promote` використовують однакові типові значення фази deep, якщо ви не передасте перевизначення порогів через CLI.
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
- Якщо фактично активні поля ключів віддаленого API пам’яті налаштовані як SecretRefs, команда розв’язує ці значення з активного знімка Gateway. Якщо Gateway недоступний, команда завершується помилкою одразу.
- Примітка щодо розсинхронізації версій Gateway: цей шлях команди потребує Gateway, який підтримує `secrets.resolve`; старіші Gateway повертають помилку unknown-method.
- Налаштовуйте частоту запланованих циклів через `dreaming.frequency`. Політика deep-перенесення інакше є внутрішньою; використовуйте прапорці CLI в `memory promote`, коли потрібні одноразові ручні перевизначення.
- `memory rem-harness --path <file-or-dir> --grounded` попередньо переглядає прив’язані до джерела `What Happened`, `Reflections` і `Possible Lasting Updates` з історичних щоденних нотаток без жодного запису.
- `memory rem-backfill --path <file-or-dir>` записує зворотні прив’язані до джерела записи щоденника в `DREAMS.md` для перегляду в UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` також додає прив’язаних до джерела стійких кандидатів до активного короткочасного сховища перенесення, щоб звичайна фаза deep могла їх ранжувати.
- `memory rem-backfill --rollback` видаляє раніше записані прив’язані до джерела записи щоденника, а `memory rem-backfill --rollback-short-term` видаляє раніше підготовлених прив’язаних до джерела короткочасних кандидатів.
- Див. [Dreaming](/uk/concepts/dreaming) для повних описів фаз і довідки з конфігурації.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Огляд пам’яті](/uk/concepts/memory)
