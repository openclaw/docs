---
read_when:
    - Ви хочете індексувати або шукати семантичну пам’ять
    - Ви налагоджуєте доступність пам’яті або індексування
    - Ви хочете підвищити викликану короткострокову пам’ять до `MEMORY.md`
summary: Довідник CLI для `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Пам’ять
x-i18n:
    generated_at: "2026-06-27T17:20:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Керуйте індексуванням і пошуком семантичної пам’яті.
Надається вбудованим plugin `memory-core`. Команда доступна, коли
`plugins.slots.memory` вибирає `memory-core` (за замовчуванням); інші plugins пам’яті
надають власні простори імен CLI.

Пов’язане:

- Концепція пам’яті: [Пам’ять](/uk/concepts/memory)
- Wiki пам’яті: [Wiki пам’яті](/uk/plugins/memory-wiki)
- CLI Wiki: [wiki](/uk/cli/wiki)
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

- `--agent <id>`: обмежити одним агентом. Без нього ці команди виконуються для кожного налаштованого агента; якщо список агентів не налаштовано, вони повертаються до агента за замовчуванням.
- `--verbose`: виводити докладні журнали під час перевірок та індексування.

`memory status`:

- `--deep`: перевірити готовність локального векторного сховища, готовність embedding-провайдера та готовність семантичного векторного пошуку. Звичайний `memory status` залишається швидким і не виконує живе створення embeddings або виявлення провайдера; невідомий стан векторного сховища або семантичних векторів означає, що його не перевіряли в цій команді. Лексичний QMD `searchMode: "search"` пропускає семантичні векторні перевірки та обслуговування embeddings навіть із `--deep`.
- `--index`: виконати повторне індексування, якщо сховище забруднене (передбачає `--deep`).
- `--fix`: виправити застарілі блокування recall і нормалізувати метадані promotion.
- `--json`: вивести JSON.

Якщо `memory status` показує `Dreaming status: blocked`, керований cron Dreaming увімкнено, але heartbeat, який ним керує, не спрацьовує для агента за замовчуванням. Див. [Dreaming ніколи не запускається](/uk/concepts/dreaming#dreaming-never-runs-status-shows-blocked) щодо двох поширених причин.

`memory index`:

- `--force`: примусово виконати повне повторне індексування.

`memory search`:

- Вхідний запит: передайте або позиційний `[query]`, або `--query <text>`.
- Якщо надано обидва, перемагає `--query`.
- Якщо не надано жодного, команда завершується з помилкою.
- `--agent <id>`: обмежити одним агентом (за замовчуванням: агент за замовчуванням).
- `--max-results <n>`: обмежити кількість повернених результатів.
- `--min-score <n>`: відфільтрувати збіги з низьким score.
- `--json`: вивести результати JSON.

`memory promote`:

Попередньо переглядайте й застосовуйте promotion короткострокової пам’яті.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- записати promotion до `MEMORY.md` (за замовчуванням: лише попередній перегляд).
- `--limit <n>` -- обмежити кількість показаних кандидатів.
- `--include-promoted` -- включити записи, уже promoted у попередніх циклах.

Повні параметри:

- Ранжує короткострокових кандидатів із `memory/YYYY-MM-DD.md` за допомогою зважених сигналів promotion (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Використовує короткострокові сигнали як із memory recalls, так і з проходів щоденного ingestion, а також сигнали підсилення фаз light/REM.
- Коли Dreaming увімкнено, `memory-core` автоматично керує одним cron-завданням, яке запускає повний прохід (`light -> REM -> deep`) у фоновому режимі (ручний `openclaw cron add` не потрібен).
- `--agent <id>`: обмежити одним агентом (за замовчуванням: агент за замовчуванням).
- `--limit <n>`: максимальна кількість кандидатів для повернення/застосування.
- `--min-score <n>`: мінімальний зважений score promotion.
- `--min-recall-count <n>`: мінімальна кількість recall, потрібна для кандидата.
- `--min-unique-queries <n>`: мінімальна кількість різних запитів, потрібна для кандидата.
- `--apply`: додати вибраних кандидатів до `MEMORY.md` і позначити їх як promoted.
- `--include-promoted`: включити вже promoted кандидатів у вивід.
- `--json`: вивести JSON.

`memory promote-explain`:

Пояснити конкретного кандидата promotion і розклад його score.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: ключ кандидата, фрагмент шляху або фрагмент snippet для пошуку.
- `--agent <id>`: обмежити одним агентом (за замовчуванням: агент за замовчуванням).
- `--include-promoted`: включити вже promoted кандидатів.
- `--json`: вивести JSON.

`memory rem-harness`:

Попередньо переглядайте REM reflections, кандидатні truths і вивід deep promotion, нічого не записуючи.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: обмежити одним агентом (за замовчуванням: агент за замовчуванням).
- `--include-promoted`: включити вже promoted deep-кандидатів.
- `--json`: вивести JSON.

## Dreaming

Dreaming — це фонова система консолідації пам’яті з трьома кооперативними
фазами: **light** (сортувати/підготувати короткостроковий матеріал), **deep** (promote тривкі
факти до `MEMORY.md`) і **REM** (осмислювати та виявляти теми).

- Увімкніть за допомогою `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Перемикайте з чату за допомогою `/dreaming on|off` (або перевіряйте за допомогою `/dreaming status`).
- Dreaming працює за одним керованим розкладом проходів (`dreaming.frequency`) і виконує фази по порядку: light, REM, deep.
- Лише фаза deep записує тривку пам’ять до `MEMORY.md`.
- Людиночитний вивід фаз і записи щоденника записуються до `DREAMS.md` (або наявного `dreams.md`), з необов’язковими звітами для кожної фази в `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ранжування використовує зважені сигнали: частоту recall, релевантність retrieval, різноманітність запитів, часову свіжість, міжденну консолідацію та похідну концептуальну насиченість.
- Promotion повторно читає живу щоденну нотатку перед записом до `MEMORY.md`, тому відредаговані або видалені короткострокові snippets не потрапляють у promotion із застарілих snapshots recall-сховища.
- Заплановані й ручні запускі `memory promote` мають ті самі стандартні значення фази deep, якщо ви не передасте перевизначення порогів CLI.
- Автоматичні запуски розгалужуються між налаштованими робочими просторами пам’яті.

Планування за замовчуванням:

- **Каденс проходу**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` виводить деталі для кожної фази (провайдер, модель, джерела, активність batch).
- `memory status` включає всі додаткові шляхи, налаштовані через `memorySearch.extraPaths`.
- Якщо фактично активні поля ключів remote API Active Memory налаштовані як SecretRefs, команда resolve ці значення з активного snapshot Gateway. Якщо gateway недоступний, команда швидко завершується з помилкою.
- Примітка щодо розбіжності версій Gateway: цей шлях команди потребує gateway, який підтримує `secrets.resolve`; старіші gateways повертають помилку невідомого методу.
- Налаштовуйте каденс запланованого проходу за допомогою `dreaming.frequency`. Політика deep promotion інакше є внутрішньою, крім `dreaming.phases.deep.maxPromotedSnippetTokens`, який обмежує довжину promoted snippet, зберігаючи видимість походження. Використовуйте прапорці CLI для `memory promote`, коли потрібні разові ручні перевизначення порогів.
- `memory rem-harness --path <file-or-dir> --grounded` попередньо показує grounded `What Happened`, `Reflections` і `Possible Lasting Updates` з історичних щоденних нотаток, нічого не записуючи.
- `memory rem-backfill --path <file-or-dir>` записує зворотні grounded записи щоденника до `DREAMS.md` для перегляду в UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` також сіє grounded durable кандидатів у живе сховище short-term promotion, щоб звичайна фаза deep могла їх ранжувати.
- `memory rem-backfill --rollback` видаляє раніше записані grounded записи щоденника, а `memory rem-backfill --rollback-short-term` видаляє раніше staged grounded short-term кандидатів.
- Див. [Dreaming](/uk/concepts/dreaming) для повних описів фаз і довідника конфігурації.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд пам’яті](/uk/concepts/memory)
