---
read_when:
    - Ви хочете індексувати або шукати семантичну пам’ять
    - Ви налагоджуєте доступність пам’яті або індексування
    - Ви хочете перенести викликану короткострокову пам’ять до `MEMORY.md`
summary: Довідник CLI для `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: пам’ять
x-i18n:
    generated_at: "2026-04-23T06:18:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ea7aa2858b18cc6daa6531c45c9e838015b84de1c7a1b88716f2b1323e419c
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Керуйте індексуванням і пошуком семантичної пам’яті.
Надається активним plugin пам’яті (типово: `memory-core`; установіть `plugins.slots.memory = "none"`, щоб вимкнути).

Пов’язане:

- Концепція пам’яті: [Memory](/uk/concepts/memory)
- Вікі пам’яті: [Memory Wiki](/uk/plugins/memory-wiki)
- Wiki CLI: [wiki](/uk/cli/wiki)
- Plugins: [Plugins](/uk/tools/plugin)

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

- `--agent <id>`: обмежити одним агентом. Без цього ці команди виконуються для кожного налаштованого агента; якщо список агентів не налаштовано, вони повертаються до типового агента.
- `--verbose`: виводити докладні журнали під час перевірок та індексування.

`memory status`:

- `--deep`: перевірити доступність vector + embedding.
- `--index`: виконати повторне індексування, якщо сховище забруднене (має на увазі `--deep`).
- `--fix`: виправити застарілі блокування recall і нормалізувати метадані перенесення.
- `--json`: вивести JSON.

`memory index`:

- `--force`: примусово виконати повне повторне індексування.

`memory search`:

- Вхід запиту: передайте або позиційний `[query]`, або `--query <text>`.
- Якщо передано обидва, перемагає `--query`.
- Якщо не передано жодного, команда завершується з помилкою.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--max-results <n>`: обмежити кількість повернених результатів.
- `--min-score <n>`: відфільтрувати збіги з низькою оцінкою.
- `--json`: вивести результати JSON.

`memory promote`:

Попередній перегляд і застосування перенесення короткострокової пам’яті.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- записати перенесення до `MEMORY.md` (типово: лише попередній перегляд).
- `--limit <n>` -- обмежити кількість показаних кандидатів.
- `--include-promoted` -- включити записи, уже перенесені в попередніх циклах.

Повні параметри:

- Ранжує короткострокових кандидатів із `memory/YYYY-MM-DD.md` за допомогою зважених сигналів перенесення (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Використовує короткострокові сигнали як із recall пам’яті, так і з щоденних проходів ingestion, а також легкі сигнали підсилення фаз light/REM.
- Коли Dreaming увімкнено, `memory-core` автоматично керує одним завданням Cron, яке виконує повний цикл (`light -> REM -> deep`) у фоновому режимі (ручний `openclaw cron add` не потрібен).
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--limit <n>`: максимальна кількість кандидатів для повернення/застосування.
- `--min-score <n>`: мінімальна зважена оцінка перенесення.
- `--min-recall-count <n>`: мінімальна кількість recall, потрібна для кандидата.
- `--min-unique-queries <n>`: мінімальна кількість різних запитів, потрібна для кандидата.
- `--apply`: додати вибраних кандидатів до `MEMORY.md` і позначити їх як перенесені.
- `--include-promoted`: включити у вивід уже перенесених кандидатів.
- `--json`: вивести JSON.

`memory promote-explain`:

Пояснити конкретного кандидата на перенесення та розклад його оцінки.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: ключ кандидата, фрагмент шляху або фрагмент уривка для пошуку.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже перенесених кандидатів.
- `--json`: вивести JSON.

`memory rem-harness`:

Попередній перегляд REM reflections, candidate truths і результату deep-перенесення без будь-якого запису.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже перенесених deep-кандидатів.
- `--json`: вивести JSON.

## Dreaming

Dreaming — це фонова система консолідації пам’яті з трьома взаємодоповнювальними
фазами: **light** (сортування/підготовка короткострокового матеріалу), **deep** (перенесення
сталих фактів до `MEMORY.md`) і **REM** (рефлексія та виявлення тем).

- Увімкнення через `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Перемикання з чату через `/dreaming on|off` (або перевірка через `/dreaming status`).
- Dreaming працює за одним керованим розкладом циклу (`dreaming.frequency`) і виконує фази в порядку: light, REM, deep.
- Лише фаза deep записує сталу пам’ять до `MEMORY.md`.
- Людинозрозумілий вивід фаз і записи щоденника записуються до `DREAMS.md` (або наявного `dreams.md`), з необов’язковими звітами по фазах у `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ранжування використовує зважені сигнали: частота recall, релевантність отримання, різноманітність запитів, часова свіжість, міжденна консолідація та похідне концептуальне багатство.
- Перенесення повторно читає live-щоденну нотатку перед записом до `MEMORY.md`, тож відредаговані або видалені короткострокові уривки не будуть перенесені зі застарілих знімків сховища recall.
- Заплановані й ручні запуски `memory promote` використовують однакові типові параметри фази deep, якщо ви не передасте перевизначення порогів через CLI.
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

- `memory index --verbose` виводить подробиці по фазах (provider, model, sources, активність пакетів).
- `memory status` включає будь-які додаткові шляхи, налаштовані через `memorySearch.extraPaths`.
- Якщо фактично активні поля remote API key для пам’яті налаштовано як SecretRef, команда визначає ці значення з активного знімка Gateway. Якщо Gateway недоступний, команда одразу завершується з помилкою.
- Примітка про розбіжність версій Gateway: цей шлях команди потребує Gateway, який підтримує `secrets.resolve`; старіші Gateway повертають помилку unknown-method.
- Налаштовуйте частоту запланованих циклів через `dreaming.frequency`. Політика deep-перенесення в іншому разі є внутрішньою; використовуйте прапорці CLI в `memory promote`, коли вам потрібні разові ручні перевизначення.
- `memory rem-harness --path <file-or-dir> --grounded` показує попередній перегляд grounded `What Happened`, `Reflections` і `Possible Lasting Updates` з історичних щоденних нотаток без будь-якого запису.
- `memory rem-backfill --path <file-or-dir>` записує оборотні grounded-записи щоденника до `DREAMS.md` для перегляду в UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` також додає grounded-сталі кандидати до live-сховища короткострокового перенесення, щоб звичайна фаза deep могла їх ранжувати.
- `memory rem-backfill --rollback` видаляє раніше записані grounded-записи щоденника, а `memory rem-backfill --rollback-short-term` видаляє раніше підготовлених grounded-кандидатів короткострокової пам’яті.
- Див. [Dreaming](/uk/concepts/dreaming) для повного опису фаз і довідника з конфігурації.
