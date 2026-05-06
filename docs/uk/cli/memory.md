---
read_when:
    - Ви хочете індексувати семантичну пам’ять або шукати в ній
    - Ви налагоджуєте доступність пам’яті або індексування
    - Ви хочете перенести відтворену короткострокову пам’ять до `MEMORY.md`
summary: Довідник CLI для `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Пам’ять
x-i18n:
    generated_at: "2026-05-06T16:00:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7137f8a9529095204699de5fee7a0baf5d5a377792dc93b4059145d0eefab737
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Керуйте індексацією та пошуком семантичної памʼяті.
Надається активним Plugin памʼяті (типово: `memory-core`; задайте `plugins.slots.memory = "none"`, щоб вимкнути).

Повʼязане:

- Концепція памʼяті: [Памʼять](/uk/concepts/memory)
- Вікі памʼяті: [Вікі памʼяті](/uk/plugins/memory-wiki)
- Wiki CLI: [wiki](/uk/cli/wiki)
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

- `--agent <id>`: обмежити одним агентом. Без нього ці команди виконуються для кожного налаштованого агента; якщо список агентів не налаштовано, вони повертаються до типового агента.
- `--verbose`: виводити докладні журнали під час перевірок та індексації.

`memory status`:

- `--deep`: перевірити готовність локального векторного сховища, готовність провайдера embeddings і готовність семантичного векторного пошуку. Звичайний `memory status` залишається швидким і не виконує live embedding або виявлення провайдера; невідомий стан векторного сховища чи семантичного вектора означає, що його не перевіряли в цій команді. Лексичний QMD `searchMode: "search"` пропускає семантичні векторні перевірки та обслуговування embeddings навіть із `--deep`.
- `--index`: запустити переіндексацію, якщо сховище має незбережені зміни (передбачає `--deep`).
- `--fix`: відновити застарілі блокування recall і нормалізувати метадані просування.
- `--json`: надрукувати JSON-вивід.

Якщо `memory status` показує `Dreaming status: blocked`, керований Dreaming cron увімкнено, але Heartbeat, що його запускає, не спрацьовує для типового агента. Див. [Dreaming ніколи не запускається](/uk/concepts/dreaming#dreaming-never-runs-status-shows-blocked) щодо двох поширених причин.

`memory index`:

- `--force`: примусово виконати повну переіндексацію.

`memory search`:

- Вхідний запит: передайте або позиційний `[query]`, або `--query <text>`.
- Якщо надано обидва, `--query` має пріоритет.
- Якщо не надано жодного, команда завершується з помилкою.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--max-results <n>`: обмежити кількість повернених результатів.
- `--min-score <n>`: відфільтрувати збіги з низьким score.
- `--json`: надрукувати JSON-результати.

`memory promote`:

Переглядайте й застосовуйте просування короткострокової памʼяті.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- записати просування до `MEMORY.md` (типово: лише попередній перегляд).
- `--limit <n>` -- обмежити кількість показаних кандидатів.
- `--include-promoted` -- включити записи, уже просунуті в попередніх циклах.

Повні параметри:

- Ранжує короткострокових кандидатів із `memory/YYYY-MM-DD.md` за допомогою зважених сигналів просування (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Використовує короткострокові сигнали як із recall памʼяті, так і зі щоденних проходів ingestion, а також сигнали підсилення фаз light/REM.
- Коли Dreaming увімкнено, `memory-core` автоматично керує одним завданням cron, яке запускає повний sweep (`light -> REM -> deep`) у фоновому режимі (ручний `openclaw cron add` не потрібен).
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--limit <n>`: максимальна кількість кандидатів для повернення/застосування.
- `--min-score <n>`: мінімальний зважений score просування.
- `--min-recall-count <n>`: мінімальна кількість recall, потрібна для кандидата.
- `--min-unique-queries <n>`: мінімальна кількість різних запитів, потрібна для кандидата.
- `--apply`: додати вибраних кандидатів до `MEMORY.md` і позначити їх як просунуті.
- `--include-promoted`: включити вже просунутих кандидатів у вивід.
- `--json`: надрукувати JSON-вивід.

`memory promote-explain`:

Пояснює конкретного кандидата на просування та розподіл його score.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: ключ кандидата, фрагмент шляху або фрагмент snippet для пошуку.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже просунутих кандидатів.
- `--json`: надрукувати JSON-вивід.

`memory rem-harness`:

Переглядайте REM-рефлексії, кандидатні істини та вивід глибокого просування без запису будь-чого.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже просунутих глибоких кандидатів.
- `--json`: надрукувати JSON-вивід.

## Dreaming

Dreaming — це фонова система консолідації памʼяті з трьома спільними
фазами: **light** (сортування/підготовка короткострокового матеріалу), **deep** (просування стійких
фактів до `MEMORY.md`) і **REM** (рефлексія та виявлення тем).

- Увімкніть за допомогою `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Перемикайте з чату за допомогою `/dreaming on|off` (або переглядайте через `/dreaming status`).
- Dreaming працює за одним керованим розкладом sweep (`dreaming.frequency`) і виконує фази по порядку: light, REM, deep.
- Лише фаза deep записує стійку памʼять до `MEMORY.md`.
- Людиночитний вивід фаз і записи щоденника записуються до `DREAMS.md` (або наявного `dreams.md`), з необовʼязковими звітами для кожної фази в `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ранжування використовує зважені сигнали: частоту recall, релевантність retrieval, різноманітність запитів, часову новизну, консолідацію між днями та похідне багатство концептів.
- Перед записом до `MEMORY.md` просування повторно читає live щоденну нотатку, тому відредаговані або видалені короткострокові snippets не просуваються із застарілих snapshots сховища recall.
- Заплановані й ручні запуски `memory promote` мають однакові типові значення фази deep, якщо ви не передаєте перевизначення порогів CLI.
- Автоматичні запуски розгортаються на всі налаштовані робочі області памʼяті.

Типове планування:

- **Каденція sweep**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` друкує деталі для кожної фази (провайдер, модель, джерела, batch-активність).
- `memory status` включає всі додаткові шляхи, налаштовані через `memorySearch.extraPaths`.
- Якщо фактично активні поля remote API key памʼяті налаштовано як SecretRefs, команда розвʼязує ці значення з активного snapshot Gateway. Якщо Gateway недоступний, команда швидко завершується з помилкою.
- Примітка щодо розбіжності версій Gateway: цей шлях команди потребує Gateway, що підтримує `secrets.resolve`; старіші gateways повертають помилку невідомого методу.
- Налаштовуйте каденцію запланованого sweep через `dreaming.frequency`. Політика просування deep в іншому внутрішня; використовуйте прапорці CLI на `memory promote`, коли потрібні одноразові ручні перевизначення.
- `memory rem-harness --path <file-or-dir> --grounded` попередньо показує grounded `What Happened`, `Reflections` і `Possible Lasting Updates` з історичних щоденних нотаток без запису будь-чого.
- `memory rem-backfill --path <file-or-dir>` записує оборотні grounded записи щоденника до `DREAMS.md` для перегляду в UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` також засіває grounded стійких кандидатів у live сховище короткострокового просування, щоб звичайна фаза deep могла їх ранжувати.
- `memory rem-backfill --rollback` видаляє раніше записані grounded записи щоденника, а `memory rem-backfill --rollback-short-term` видаляє раніше підготовлених grounded короткострокових кандидатів.
- Див. [Dreaming](/uk/concepts/dreaming) для повних описів фаз і довідника з конфігурації.

## Повʼязане

- [Довідник CLI](/uk/cli)
- [Огляд памʼяті](/uk/concepts/memory)
