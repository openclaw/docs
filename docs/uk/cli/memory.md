---
read_when:
    - Ви хочете індексувати семантичну пам’ять або шукати в ній
    - Ви діагностуєте доступність пам’яті або індексування
    - Ви хочете перенести згадану короткострокову пам’ять до `MEMORY.md`
summary: Довідник CLI для `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Пам’ять
x-i18n:
    generated_at: "2026-05-03T16:43:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a33b848272c8853dd1a83e942124f0df30e096312e58a395c0ea08058e41f8fe
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Керуйте індексацією й пошуком семантичної пам'яті.
Надається активним Plugin пам'яті (типово: `memory-core`; задайте `plugins.slots.memory = "none"`, щоб вимкнути).

Пов'язане:

- Концепція пам'яті: [Пам'ять](/uk/concepts/memory)
- Вікі пам'яті: [Вікі пам'яті](/uk/plugins/memory-wiki)
- CLI для вікі: [wiki](/uk/cli/wiki)
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

- `--agent <id>`: обмежити область одним агентом. Без цього ці команди виконуються для кожного налаштованого агента; якщо список агентів не налаштовано, вони повертаються до агента за замовчуванням.
- `--verbose`: виводити докладні журнали під час перевірок та індексації.

`memory status`:

- `--deep`: перевірити готовність локального векторного сховища, готовність постачальника ембедингів і готовність семантичного векторного пошуку. Звичайний `memory status` залишається швидким і не виконує живі ембединги або виявлення постачальників; невідомий стан векторного сховища чи семантичного вектора означає, що в цій команді його не перевіряли. Лексичний QMD `searchMode: "search"` пропускає семантичні векторні перевірки й обслуговування ембедингів навіть із `--deep`.
- `--index`: виконати повторну індексацію, якщо сховище забруднене (передбачає `--deep`).
- `--fix`: виправити застарілі блокування відтворення та нормалізувати метадані просування.
- `--json`: надрукувати вивід JSON.

Якщо `memory status` показує `Dreaming status: blocked`, керований Dreaming cron увімкнено, але Heartbeat, який його запускає, не спрацьовує для агента за замовчуванням. Див. [Dreaming ніколи не запускається](/uk/concepts/dreaming#dreaming-never-runs-status-shows-blocked) щодо двох поширених причин.

`memory index`:

- `--force`: примусово виконати повну повторну індексацію.

`memory search`:

- Введення запиту: передайте або позиційний `[query]`, або `--query <text>`.
- Якщо надано обидва, перемагає `--query`.
- Якщо не надано жодного, команда завершується з помилкою.
- `--agent <id>`: обмежити область одним агентом (типово: агент за замовчуванням).
- `--max-results <n>`: обмежити кількість повернених результатів.
- `--min-score <n>`: відфільтрувати збіги з низькою оцінкою.
- `--json`: надрукувати результати JSON.

`memory promote`:

Переглядайте й застосовуйте просування короткострокової пам'яті.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- записати просування до `MEMORY.md` (типово: лише попередній перегляд).
- `--limit <n>` -- обмежити кількість показаних кандидатів.
- `--include-promoted` -- включити записи, уже просунуті в попередніх циклах.

Повні параметри:

- Ранжує короткострокових кандидатів із `memory/YYYY-MM-DD.md` за допомогою зважених сигналів просування (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Використовує короткострокові сигнали як із відтворень пам'яті, так і з щоденних проходів приймання, а також сигнали підсилення фаз light/REM.
- Коли Dreaming увімкнено, `memory-core` автоматично керує одним завданням cron, яке виконує повний прохід (`light -> REM -> deep`) у фоновому режимі (ручне `openclaw cron add` не потрібне).
- `--agent <id>`: обмежити область одним агентом (типово: агент за замовчуванням).
- `--limit <n>`: максимальна кількість кандидатів для повернення/застосування.
- `--min-score <n>`: мінімальна зважена оцінка просування.
- `--min-recall-count <n>`: мінімальна кількість відтворень, потрібна для кандидата.
- `--min-unique-queries <n>`: мінімальна кількість різних запитів, потрібна для кандидата.
- `--apply`: додати вибраних кандидатів до `MEMORY.md` і позначити їх як просунуті.
- `--include-promoted`: включити вже просунутих кандидатів у вивід.
- `--json`: надрукувати вивід JSON.

`memory promote-explain`:

Пояснити конкретного кандидата на просування та розподіл його оцінки.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: ключ кандидата, фрагмент шляху або фрагмент уривка для пошуку.
- `--agent <id>`: обмежити область одним агентом (типово: агент за замовчуванням).
- `--include-promoted`: включити вже просунутих кандидатів.
- `--json`: надрукувати вивід JSON.

`memory rem-harness`:

Попередньо переглянути REM-роздуми, істини-кандидати та вивід глибокого просування без запису будь-чого.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: обмежити область одним агентом (типово: агент за замовчуванням).
- `--include-promoted`: включити вже просунутих глибоких кандидатів.
- `--json`: надрукувати вивід JSON.

## Dreaming

Dreaming — це фонова система консолідації пам'яті з трьома взаємодійними
фазами: **light** (сортування/підготовка короткострокового матеріалу), **deep** (просування довговічних
фактів у `MEMORY.md`) і **REM** (осмислення та виявлення тем).

- Увімкніть за допомогою `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Перемикайте з чату через `/dreaming on|off` (або перевіряйте через `/dreaming status`).
- Dreaming працює за одним керованим розкладом проходу (`dreaming.frequency`) і виконує фази по порядку: light, REM, deep.
- Лише фаза deep записує довговічну пам'ять до `MEMORY.md`.
- Зручний для читання вивід фаз і записи щоденника записуються до `DREAMS.md` (або наявного `dreams.md`) з необов'язковими звітами для кожної фази в `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ранжування використовує зважені сигнали: частоту відтворення, релевантність отримання, різноманітність запитів, часову недавність, консолідацію між днями та виведене концептуальне багатство.
- Просування перечитує живу щоденну нотатку перед записом до `MEMORY.md`, тому відредаговані або видалені короткострокові уривки не просуваються із застарілих знімків сховища відтворень.
- Заплановані й ручні запуски `memory promote` спільно використовують ті самі типові налаштування фази deep, якщо ви не передасте перевизначення порогів CLI.
- Автоматичні запуски розгортаються на всі налаштовані робочі простори пам'яті.

Типове планування:

- **Періодичність проходу**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` друкує деталі за фазами (постачальник, модель, джерела, активність пакетів).
- `memory status` включає всі додаткові шляхи, налаштовані через `memorySearch.extraPaths`.
- Якщо фактично активні поля ключа віддаленого API пам'яті налаштовані як SecretRefs, команда розв'язує ці значення з активного знімка Gateway. Якщо Gateway недоступний, команда швидко завершується з помилкою.
- Примітка щодо розбіжності версій Gateway: цей шлях команди потребує Gateway, який підтримує `secrets.resolve`; старіші Gateway повертають помилку невідомого методу.
- Налаштовуйте періодичність запланованого проходу через `dreaming.frequency`. Політика просування deep в іншому є внутрішньою; використовуйте прапорці CLI у `memory promote`, коли потрібні одноразові ручні перевизначення.
- `memory rem-harness --path <file-or-dir> --grounded` попередньо переглядає обґрунтовані `What Happened`, `Reflections` і `Possible Lasting Updates` з історичних щоденних нотаток без запису будь-чого.
- `memory rem-backfill --path <file-or-dir>` записує оборотні обґрунтовані записи щоденника до `DREAMS.md` для перегляду в UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` також засіває обґрунтованих довговічних кандидатів у живе сховище короткострокового просування, щоб звичайна фаза deep могла їх ранжувати.
- `memory rem-backfill --rollback` вилучає раніше записані обґрунтовані записи щоденника, а `memory rem-backfill --rollback-short-term` вилучає раніше підготовлених обґрунтованих короткострокових кандидатів.
- Див. [Dreaming](/uk/concepts/dreaming) для повних описів фаз і довідника конфігурації.

## Пов'язане

- [Довідник CLI](/uk/cli)
- [Огляд пам'яті](/uk/concepts/memory)
