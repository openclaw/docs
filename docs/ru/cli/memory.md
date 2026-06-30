---
read_when:
    - Вы хотите индексировать семантическую память или выполнять по ней поиск
    - Вы отлаживаете доступность памяти или индексирование
    - Вы хотите перевести извлеченную краткосрочную память в `MEMORY.md`
summary: Справочник CLI для `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Память
x-i18n:
    generated_at: "2026-06-30T14:15:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Управляйте индексированием и поиском семантической памяти.
Предоставляется встроенным Plugin `memory-core`. Команда доступна, когда
`plugins.slots.memory` выбирает `memory-core` (по умолчанию); другие Plugins памяти
предоставляют собственные пространства имен CLI.

Связанное:

- Концепция памяти: [Память](/ru/concepts/memory)
- Вики памяти: [Вики памяти](/ru/plugins/memory-wiki)
- Wiki CLI: [wiki](/ru/cli/wiki)
- Plugins: [Plugins](/ru/tools/plugin)

## Примеры

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

## Параметры

`memory status` и `memory index`:

- `--agent <id>`: ограничить область одним агентом. Без него эти команды выполняются для каждого настроенного агента; если список агентов не настроен, они используют агента по умолчанию.
- `--verbose`: выводить подробные журналы во время проверок и индексирования.

`memory status`:

- `--deep`: проверить готовность локального векторного хранилища, готовность провайдера эмбеддингов и готовность семантического векторного поиска. Обычный `memory status` остается быстрым и не запускает живое создание эмбеддингов или обнаружение провайдера; неизвестное состояние векторного хранилища или семантических векторов означает, что эта команда его не проверяла. Лексический QMD `searchMode: "search"` пропускает проверки семантических векторов и обслуживание эмбеддингов даже с `--deep`.
- `--index`: выполнить переиндексацию, если хранилище загрязнено (подразумевает `--deep`).
- `--fix`: исправить устаревшие блокировки recall и нормализовать метаданные продвижения.
- `--json`: вывести JSON.

Если `memory status` показывает `Dreaming status: blocked`, управляемый Cron для Dreaming включен, но Heartbeat, который его запускает, не срабатывает для агента по умолчанию. См. [Dreaming никогда не запускается](/ru/concepts/dreaming#dreaming-never-runs-status-shows-blocked) о двух распространенных причинах.

`memory index`:

- `--force`: принудительно выполнить полную переиндексацию.

`memory search`:

- Ввод запроса: передайте либо позиционный `[query]`, либо `--query <text>`.
- Если указаны оба, побеждает `--query`.
- Если не указан ни один, команда завершается с ошибкой.
- `--agent <id>`: ограничить область одним агентом (по умолчанию: агент по умолчанию).
- `--max-results <n>`: ограничить количество возвращаемых результатов.
- `--min-score <n>`: отфильтровать совпадения с низкой оценкой.
- `--json`: вывести результаты JSON.

`memory promote`:

Предварительно просматривайте и применяйте продвижения краткосрочной памяти.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- записать продвижения в `MEMORY.md` (по умолчанию: только предварительный просмотр).
- `--limit <n>` -- ограничить количество показанных кандидатов.
- `--include-promoted` -- включить записи, уже продвинутые в предыдущих циклах.

Полные параметры:

- Ранжирует краткосрочных кандидатов из `memory/YYYY-MM-DD.md` с помощью взвешенных сигналов продвижения (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Использует краткосрочные сигналы как из recall памяти, так и из проходов ежедневного приема данных, а также сигналы усиления фаз light/REM.
- Когда Dreaming включен, `memory-core` автоматически управляет одним заданием Cron, которое выполняет полный проход (`light -> REM -> deep`) в фоновом режиме (ручной `openclaw cron add` не требуется).
- `--agent <id>`: ограничить область одним агентом (по умолчанию: агент по умолчанию).
- `--limit <n>`: максимальное количество кандидатов для возврата/применения.
- `--min-score <n>`: минимальная взвешенная оценка продвижения.
- `--min-recall-count <n>`: минимальное количество recall, необходимое для кандидата.
- `--min-unique-queries <n>`: минимальное количество различных запросов, необходимое для кандидата.
- `--apply`: добавить выбранных кандидатов в `MEMORY.md` и пометить их как продвинутые.
- `--include-promoted`: включить уже продвинутых кандидатов в вывод.
- `--json`: вывести JSON.

`memory promote-explain`:

Объяснить конкретного кандидата на продвижение и детализацию его оценки.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: ключ кандидата, фрагмент пути или фрагмент текста для поиска.
- `--agent <id>`: ограничить область одним агентом (по умолчанию: агент по умолчанию).
- `--include-promoted`: включить уже продвинутых кандидатов.
- `--json`: вывести JSON.

`memory rem-harness`:

Предварительно просматривать REM-размышления, истины-кандидаты и вывод глубокого продвижения, ничего не записывая.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: ограничить область одним агентом (по умолчанию: агент по умолчанию).
- `--include-promoted`: включить уже продвинутых глубоких кандидатов.
- `--json`: вывести JSON.

## Dreaming

Dreaming — это фоновая система консолидации памяти с тремя совместно работающими
фазами: **light** (сортирует/подготавливает краткосрочный материал), **deep** (продвигает долговечные
факты в `MEMORY.md`) и **REM** (осмысливает и выводит темы).

- Включите через `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Переключайте из чата с помощью `/dreaming on|off` (или проверяйте через `/dreaming status`).
  Вызывающие стороны каналов должны быть владельцами, чтобы менять настройку; клиентам Gateway нужен
  `operator.admin`. Статус только для чтения и справка остаются доступными авторизованным
  отправителям команд.
- Dreaming работает по одному управляемому расписанию прохода (`dreaming.frequency`) и выполняет фазы по порядку: light, REM, deep.
- Только фаза deep записывает долговечную память в `MEMORY.md`.
- Человекочитаемый вывод фаз и записи дневника записываются в `DREAMS.md` (или существующий `dreams.md`), с необязательными отчетами по фазам в `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ранжирование использует взвешенные сигналы: частоту recall, релевантность извлечения, разнообразие запросов, временную свежесть, междневную консолидацию и производную концептуальную насыщенность.
- Продвижение повторно читает живую ежедневную заметку перед записью в `MEMORY.md`, поэтому отредактированные или удаленные краткосрочные фрагменты не продвигаются из устаревших снимков recall-хранилища.
- Запланированные и ручные запуски `memory promote` используют одинаковые значения по умолчанию для фазы deep, если вы не передаете переопределения порогов CLI.
- Автоматические запуски распределяются по настроенным рабочим областям памяти.

Расписание по умолчанию:

- **Частота прохода**: `dreaming.frequency = 0 3 * * *`
- **Пороги deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Пример:

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

Примечания:

- `memory index --verbose` выводит подробности по фазам (провайдер, модель, источники, активность пакетов).
- `memory status` включает любые дополнительные пути, настроенные через `memorySearch.extraPaths`.
- Если фактически активные поля ключей удаленного API памяти настроены как SecretRefs, команда разрешает эти значения из активного снимка Gateway. Если Gateway недоступен, команда быстро завершается ошибкой.
- Примечание о расхождении версий Gateway: этот путь команды требует Gateway с поддержкой `secrets.resolve`; более старые Gateway возвращают ошибку неизвестного метода.
- Настройте частоту запланированного прохода через `dreaming.frequency`. Политика глубокого продвижения в остальном внутренняя, кроме `dreaming.phases.deep.maxPromotedSnippetTokens`, который ограничивает длину продвигаемого фрагмента, сохраняя видимость происхождения. Используйте флаги CLI в `memory promote`, когда нужны разовые ручные переопределения порогов.
- `memory rem-harness --path <file-or-dir> --grounded` предварительно показывает grounded `What Happened`, `Reflections` и `Possible Lasting Updates` из исторических ежедневных заметок, ничего не записывая.
- `memory rem-backfill --path <file-or-dir>` записывает обратимые grounded-записи дневника в `DREAMS.md` для просмотра в UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` также добавляет grounded долговечных кандидатов в живое хранилище краткосрочного продвижения, чтобы обычная фаза deep могла их ранжировать.
- `memory rem-backfill --rollback` удаляет ранее записанные grounded-записи дневника, а `memory rem-backfill --rollback-short-term` удаляет ранее подготовленных grounded краткосрочных кандидатов.
- См. [Dreaming](/ru/concepts/dreaming) для полных описаний фаз и справочника по настройке.

## Связанное

- [Справочник CLI](/ru/cli)
- [Обзор памяти](/ru/concepts/memory)
