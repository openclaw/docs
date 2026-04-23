---
read_when:
    - Ви хочете індексувати або шукати семантичну пам’ять
    - Ви налагоджуєте доступність пам’яті або індексування
    - Ви хочете перенести відновлену короткочасну пам’ять до `MEMORY.md`
summary: Довідник CLI для `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Пам’ять
x-i18n:
    generated_at: "2026-04-23T20:47:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ecdf14bf3f3185efae40d07bbfad49a41b47c51674da8290c3a32d845a3a9c7
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Керування індексуванням і пошуком семантичної пам’яті.
Надається активним plugin-ом пам’яті (за замовчуванням: `memory-core`; установіть `plugins.slots.memory = "none"`, щоб вимкнути).

Пов’язане:

- Концепція пам’яті: [Memory](/uk/concepts/memory)
- Вікі пам’яті: [Memory Wiki](/uk/plugins/memory-wiki)
- CLI вікі: [wiki](/uk/cli/wiki)
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

- `--agent <id>`: обмежити одним агентом. Без цього ці команди виконуються для кожного налаштованого агента; якщо список агентів не налаштовано, вони повертаються до агента за замовчуванням.
- `--verbose`: виводити докладні журнали під час перевірок і індексування.

`memory status`:

- `--deep`: перевірити доступність vector + embedding.
- `--index`: виконати повторне індексування, якщо сховище позначене як dirty (має на увазі `--deep`).
- `--fix`: виправити застарілі recall lock-и та нормалізувати metadata перенесення.
- `--json`: вивести JSON.

Якщо `memory status` показує `Dreaming status: blocked`, керований cron Dreaming увімкнено, але heartbeat, який його запускає, не спрацьовує для агента за замовчуванням. Див. [Dreaming never runs](/uk/concepts/dreaming#dreaming-never-runs-status-shows-blocked) щодо двох типових причин.

`memory index`:

- `--force`: примусово виконати повне повторне індексування.

`memory search`:

- Вхід запиту: передайте або позиційний `[query]`, або `--query <text>`.
- Якщо передано обидва варіанти, пріоритет має `--query`.
- Якщо не передано жодного, команда завершується з помилкою.
- `--agent <id>`: обмежити одним агентом (за замовчуванням: агент за замовчуванням).
- `--max-results <n>`: обмежити кількість повернених результатів.
- `--min-score <n>`: відфільтрувати збіги з низьким score.
- `--json`: вивести результати у форматі JSON.

`memory promote`:

Попередній перегляд і застосування перенесення короткочасної пам’яті.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- записати перенесення в `MEMORY.md` (за замовчуванням: лише попередній перегляд).
- `--limit <n>` -- обмежити кількість показаних кандидатів.
- `--include-promoted` -- включити записи, уже перенесені в попередніх циклах.

Повний перелік параметрів:

- Ранжує короткочасних кандидатів із `memory/YYYY-MM-DD.md` за зваженими сигналами перенесення (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Використовує короткочасні сигнали як із recall пам’яті, так і з щоденних проходів ingestion, а також сигнали підсилення light/REM phase.
- Коли Dreaming увімкнено, `memory-core` автоматично керує одним cron-завданням, яке у фоновому режимі виконує повний прохід (`light -> REM -> deep`) (ручний `openclaw cron add` не потрібен).
- `--agent <id>`: обмежити одним агентом (за замовчуванням: агент за замовчуванням).
- `--limit <n>`: максимальна кількість кандидатів для повернення/застосування.
- `--min-score <n>`: мінімальний зважений score перенесення.
- `--min-recall-count <n>`: мінімальна кількість recall, потрібна для кандидата.
- `--min-unique-queries <n>`: мінімальна кількість різних запитів, потрібна для кандидата.
- `--apply`: додати вибраних кандидатів у `MEMORY.md` і позначити їх як перенесені.
- `--include-promoted`: включити у вивід уже перенесених кандидатів.
- `--json`: вивести JSON.

`memory promote-explain`:

Пояснити конкретного кандидата на перенесення та розбивку його score.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: ключ кандидата, фрагмент шляху або фрагмент уривка для пошуку.
- `--agent <id>`: обмежити одним агентом (за замовчуванням: агент за замовчуванням).
- `--include-promoted`: включити вже перенесених кандидатів.
- `--json`: вивести JSON.

`memory rem-harness`:

Попередній перегляд REM reflections, candidate truths і результату deep promotion без запису будь-чого.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: обмежити одним агентом (за замовчуванням: агент за замовчуванням).
- `--include-promoted`: включити вже перенесених deep-кандидатів.
- `--json`: вивести JSON.

## Dreaming

Dreaming — це фонова система консолідації пам’яті з трьома кооперативними
phase-ами: **light** (сортування/підготовка короткочасного матеріалу), **deep** (перенесення довготривалих
фактів у `MEMORY.md`) і **REM** (рефлексія та виявлення тем).

- Увімкнення через `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Перемикання з чату через `/dreaming on|off` (або перегляд через `/dreaming status`).
- Dreaming виконується за одним керованим розкладом проходу (`dreaming.frequency`) і запускає phase-и в такому порядку: light, REM, deep.
- Лише phase deep записує довготривалу пам’ять у `MEMORY.md`.
- Зрозумілий для людини вивід phase і записи щоденника записуються в `DREAMS.md` (або наявний `dreams.md`), з необов’язковими звітами по phase у `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ранжування використовує зважені сигнали: частота recall, релевантність отримання, різноманітність запитів, часова давність, міжденна консолідація та похідне концептуальне багатство.
- Перенесення повторно зчитує актуальну щоденну нотатку перед записом у `MEMORY.md`, тож відредаговані або видалені короткочасні уривки не будуть перенесені зі застарілих знімків recall-store.
- Заплановані та ручні запуски `memory promote` використовують однакові значення deep phase за замовчуванням, якщо ви не передаєте перевизначення порогів через CLI.
- Автоматичні запуски розподіляються між налаштованими робочими просторами пам’яті.

Розклад за замовчуванням:

- **Частота проходу**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` виводить подробиці по кожній phase (provider, model, джерела, активність пакетів).
- `memory status` включає всі додаткові шляхи, налаштовані через `memorySearch.extraPaths`.
- Якщо фактично активні поля remote API key пам’яті налаштовані як SecretRef, команда розв’язує ці значення з активного snapshot gateway. Якщо gateway недоступний, команда швидко завершується з помилкою.
- Примітка щодо розбіжності версій Gateway: цей шлях команд вимагає gateway, який підтримує `secrets.resolve`; старіші gateway повертають помилку unknown-method.
- Налаштовуйте частоту запланованих проходів через `dreaming.frequency`. Політика deep promotion в іншому разі є внутрішньою; використовуйте прапорці CLI у `memory promote`, коли вам потрібні одноразові ручні перевизначення.
- `memory rem-harness --path <file-or-dir> --grounded` показує grounded `What Happened`, `Reflections` і `Possible Lasting Updates` з історичних щоденних нотаток без запису будь-чого.
- `memory rem-backfill --path <file-or-dir>` записує оборотні grounded-записи щоденника в `DREAMS.md` для перегляду в UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` також додає grounded довготривалих кандидатів до активного short-term store перенесення, щоб звичайна deep phase могла їх ранжувати.
- `memory rem-backfill --rollback` видаляє раніше записані grounded-записи щоденника, а `memory rem-backfill --rollback-short-term` видаляє раніше підготовлених grounded short-term кандидатів.
- Див. [Dreaming](/uk/concepts/dreaming) для повного опису phase і довідника з конфігурації.
