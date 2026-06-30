---
read_when:
    - Ви хочете індексувати або шукати в семантичній пам’яті
    - Ви налагоджуєте доступність пам’яті або індексування
    - Ви хочете підвищити відновлену короткострокову пам’ять до `MEMORY.md`
summary: Довідник CLI для `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Пам’ять
x-i18n:
    generated_at: "2026-06-30T14:24:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Керуйте індексацією та пошуком семантичної пам’яті.
Надається вбудованим Plugin `memory-core`. Команда доступна, коли
`plugins.slots.memory` вибирає `memory-core` (типово); інші плагіни пам’яті
надають власні простори імен CLI.

Пов’язане:

- Концепція пам’яті: [Пам’ять](/uk/concepts/memory)
- Вікі пам’яті: [Вікі пам’яті](/uk/plugins/memory-wiki)
- CLI вікі: [wiki](/uk/cli/wiki)
- Плагіни: [Plugins](/uk/tools/plugin)

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
- `--verbose`: виводити докладні журнали під час перевірок та індексації.

`memory status`:

- `--deep`: перевірити готовність локального векторного сховища, готовність постачальника вбудовувань і готовність семантичного векторного пошуку. Звичайний `memory status` лишається швидким і не запускає живі вбудовування чи виявлення постачальника; невідомий стан векторного сховища або семантичного вектора означає, що його не перевіряли в цій команді. Лексичний QMD `searchMode: "search"` пропускає семантичні векторні перевірки й обслуговування вбудовувань навіть із `--deep`.
- `--index`: виконати повторну індексацію, якщо сховище забруднене (передбачає `--deep`).
- `--fix`: виправити застарілі блокування пригадування й нормалізувати метадані просування.
- `--json`: надрукувати вихід у JSON.

Якщо `memory status` показує `Dreaming status: blocked`, керований cron Dreaming увімкнено, але Heartbeat, що ним керує, не спрацьовує для типового агента. Див. [Dreaming ніколи не запускається](/uk/concepts/dreaming#dreaming-never-runs-status-shows-blocked) щодо двох поширених причин.

`memory index`:

- `--force`: примусово виконати повну повторну індексацію.

`memory search`:

- Вхідний запит: передайте або позиційний `[query]`, або `--query <text>`.
- Якщо надано обидва, перевагу має `--query`.
- Якщо не надано жодного, команда завершується з помилкою.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--max-results <n>`: обмежити кількість повернених результатів.
- `--min-score <n>`: відфільтрувати збіги з низьким балом.
- `--json`: надрукувати результати JSON.

`memory promote`:

Попередньо переглядайте й застосовуйте просування короткострокової пам’яті.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- записати просування до `MEMORY.md` (типово: лише попередній перегляд).
- `--limit <n>` -- обмежити кількість показаних кандидатів.
- `--include-promoted` -- включити записи, уже просунуті в попередніх циклах.

Повні параметри:

- Ранжує короткострокових кандидатів із `memory/YYYY-MM-DD.md` за допомогою зважених сигналів просування (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Використовує короткострокові сигнали як із пригадувань пам’яті, так і з проходів щоденного приймання, плюс сигнали підсилення фаз light/REM.
- Коли Dreaming увімкнено, `memory-core` автоматично керує одним cron-завданням, яке виконує повний прохід (`light -> REM -> deep`) у фоновому режимі (ручний `openclaw cron add` не потрібен).
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--limit <n>`: максимальна кількість кандидатів для повернення/застосування.
- `--min-score <n>`: мінімальний зважений бал просування.
- `--min-recall-count <n>`: мінімальна кількість пригадувань, потрібна для кандидата.
- `--min-unique-queries <n>`: мінімальна кількість різних запитів, потрібна для кандидата.
- `--apply`: додати вибраних кандидатів до `MEMORY.md` і позначити їх як просунуті.
- `--include-promoted`: включити вже просунутих кандидатів у вихід.
- `--json`: надрукувати вихід у JSON.

`memory promote-explain`:

Пояснити конкретного кандидата на просування та розклад його балів.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: ключ кандидата, фрагмент шляху або фрагмент уривка для пошуку.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже просунутих кандидатів.
- `--json`: надрукувати вихід у JSON.

`memory rem-harness`:

Попередньо перегляньте REM-рефлексії, істини-кандидати й результат глибокого просування, нічого не записуючи.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже просунутих глибоких кандидатів.
- `--json`: надрукувати вихід у JSON.

## Dreaming

Dreaming — це фонова система консолідації пам’яті з трьома взаємодійними
фазами: **light** (сортування/підготовка короткострокового матеріалу), **deep** (просування тривких
фактів до `MEMORY.md`) і **REM** (рефлексія та виявлення тем).

- Увімкніть через `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Перемикайте з чату за допомогою `/dreaming on|off` (або перевіряйте через `/dreaming status`).
  Викликачі з каналів мають бути власниками, щоб змінювати налаштування; клієнтам Gateway потрібен
  `operator.admin`. Стан лише для читання й довідка лишаються доступними авторизованим
  відправникам команд.
- Dreaming працює за одним керованим розкладом проходу (`dreaming.frequency`) і виконує фази по черзі: light, REM, deep.
- Лише фаза deep записує тривку пам’ять до `MEMORY.md`.
- Зручний для читання людиною вихід фаз і записи щоденника записуються до `DREAMS.md` (або наявного `dreams.md`), з необов’язковими звітами для кожної фази в `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ранжування використовує зважені сигнали: частоту пригадування, релевантність отримання, різноманітність запитів, часову недавність, консолідацію між днями та похідне концептуальне багатство.
- Просування повторно читає живу щоденну нотатку перед записом до `MEMORY.md`, тому відредаговані або видалені короткострокові уривки не просуваються із застарілих знімків сховища пригадувань.
- Заплановані й ручні запуски `memory promote` мають ті самі типові параметри фази deep, якщо ви не передасте перевизначення порогів CLI.
- Автоматичні запуски розгалужуються по налаштованих робочих просторах пам’яті.

Типове планування:

- **Каденція проходу**: `dreaming.frequency = 0 3 * * *`
- **Пороги фази deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose` друкує деталі для кожної фази (постачальник, модель, джерела, пакетна активність).
- `memory status` включає будь-які додаткові шляхи, налаштовані через `memorySearch.extraPaths`.
- Якщо ефективно активні поля ключів віддаленого API Active Memory налаштовані як SecretRefs, команда розв’язує ці значення з активного знімка Gateway. Якщо Gateway недоступний, команда швидко завершується з помилкою.
- Примітка про розбіжність версій Gateway: цей шлях команди потребує Gateway, який підтримує `secrets.resolve`; старіші Gateway повертають помилку невідомого методу.
- Налаштовуйте каденцію запланованого проходу через `dreaming.frequency`. Політика глибокого просування в іншому є внутрішньою, окрім `dreaming.phases.deep.maxPromotedSnippetTokens`, що обмежує довжину просунутого уривка, зберігаючи видимість походження. Використовуйте прапорці CLI в `memory promote`, коли потрібні разові ручні перевизначення порогів.
- `memory rem-harness --path <file-or-dir> --grounded` попередньо переглядає обґрунтовані `What Happened`, `Reflections` і `Possible Lasting Updates` з історичних щоденних нотаток, нічого не записуючи.
- `memory rem-backfill --path <file-or-dir>` записує оборотні обґрунтовані щоденникові записи до `DREAMS.md` для перегляду в UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` також засіває обґрунтованих тривких кандидатів у живе сховище короткострокового просування, щоб звичайна фаза deep могла їх ранжувати.
- `memory rem-backfill --rollback` видаляє раніше записані обґрунтовані щоденникові записи, а `memory rem-backfill --rollback-short-term` видаляє раніше підготовлених обґрунтованих короткострокових кандидатів.
- Див. [Dreaming](/uk/concepts/dreaming) для повних описів фаз і довідника конфігурації.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд пам’яті](/uk/concepts/memory)
