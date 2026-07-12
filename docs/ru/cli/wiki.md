---
read_when:
    - Вы хотите использовать CLI memory-wiki
    - Вы документируете или изменяете `openclaw wiki`
summary: Справочник по CLI для `openclaw wiki` (состояние хранилища memory-wiki, поиск, компиляция, проверка, применение, мост, импорт из ChatGPT и вспомогательные средства Obsidian)
title: Вики
x-i18n:
    generated_at: "2026-07-12T11:19:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Просмотр и обслуживание хранилища `memory-wiki`. Предоставляется встроенным плагином `memory-wiki`.

См. также: [плагин Memory Wiki](/ru/plugins/memory-wiki), [обзор памяти](/ru/concepts/memory), [CLI: память](/ru/cli/memory)

## Основные команды

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Выбор агента

Если параметр `plugins.entries.memory-wiki.config.vault.scope` имеет значение `agent`, выберите хранилище с помощью параметра верхнего уровня `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

В конфигурации с несколькими настроенными агентами параметр `--agent` обязателен для операций CLI, чтобы команда не могла читать или записывать произвольное хранилище по умолчанию. Если настроен только один агент, он остаётся агентом по умолчанию. Неизвестные идентификаторы агентов приводят к ошибке до начала операции с хранилищем. Этот параметр не изменяет выбранный путь, если `vault.scope` имеет значение `global`.

Клиенты Gateway следуют тому же правилу: передавайте `agentId` в запросах `wiki.*`, использующих хранилище, при конфигурации с несколькими агентами и отдельными хранилищами для каждого агента. Отсутствующий или неизвестный идентификатор считается ошибкой. Ходы агента, инструменты вики, дополнения к корпусу памяти и скомпилированные дайджесты промптов уже содержат контекст активного агента среды выполнения.

## Команды

### `wiki status`

Показывает режим и область действия хранилища, выбранного агента, состояние и доступность CLI Obsidian. Сначала используйте эту команду, чтобы проверить, инициализировано ли нужное хранилище, исправен ли режим моста и доступна ли интеграция с Obsidian.

Когда режим моста активен и настроен на чтение артефактов памяти, эта команда обращается к работающему Gateway, поэтому использует тот же контекст активного плагина памяти, что и память агента или среды выполнения.

### `wiki doctor`

Выполняет проверки состояния вики и сообщает о способах устранения проблем. Завершается с ненулевым кодом, если обнаружены проблемы.

Когда режим моста активен и настроен на чтение артефактов памяти, эта команда обращается к работающему Gateway перед формированием отчёта. Отключённый импорт через мост и конфигурации моста без чтения артефактов памяти работают локально, без подключения к сети.

Типичные проблемы:

- режим моста включён без общедоступных артефактов памяти
- недопустимая или отсутствующая структура хранилища
- отсутствует внешний CLI Obsidian, когда предполагается использование режима Obsidian

### `wiki init`

Создаёт структуру хранилища вики и начальные страницы, включая индексы верхнего уровня и каталоги кэша.

### `wiki ingest <path>`

Импортирует локальный файл Markdown или текстовый файл в папку `sources/` вики в качестве исходной страницы. `<path>` должен быть путём к локальному файлу; импорт по URL сейчас не поддерживается. Двоичные файлы отклоняются.

Импортированные исходные страницы содержат во frontmatter сведения о происхождении (`sourceType: local-file`, `sourcePath`, `ingestedAt`). После импорта хранилище всегда компилируется заново.

Флаги: `--title <title>` переопределяет заголовок источника (по умолчанию он формируется из имени файла).

### `wiki okf import <path>`

Импортирует распакованный пакет Open Knowledge Format в страницы концепций вики.

Импортёр читает все незарезервированные документы концепций `.md` в дереве каталогов OKF, требует непустое поле `type` и обрабатывает неизвестные значения OKF `type` как универсальные концепции. Зарезервированные файлы OKF `index.md` и `log.md` не импортируются как концепции.

Импортированные страницы размещаются без вложенности в каталоге `concepts/`, поэтому существующие процессы компиляции, поиска, получения, формирования дайджестов и панелей мониторинга вики сразу получают к ним доступ. Исходный идентификатор концепции OKF, `type`, `resource`, `tags`, временная метка, путь к источнику и полный frontmatter сохраняются во frontmatter страницы. Внутренние ссылки Markdown OKF переписываются так, чтобы указывать на созданные страницы вики; неработающие и внешние ссылки остаются без изменений. После импорта хранилище всегда компилируется заново.

Примеры:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Перестраивает индексы, связанные блоки, панели мониторинга и скомпилированные дайджесты. Записывает стабильные машиночитаемые артефакты в следующие файлы:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Если параметр `render.createDashboards` включён, компиляция также обновляет страницы отчётов.

### `wiki lint`

Проверяет хранилище и записывает отчёт, охватывающий:

- структурные проблемы (неработающие ссылки, отсутствующие или повторяющиеся идентификаторы, отсутствие типа или заголовка страницы, недопустимый frontmatter)
- пробелы в сведениях о происхождении (отсутствующие идентификаторы источников, отсутствие сведений о происхождении импорта)
- противоречия (отмеченные противоречия, конфликтующие утверждения)
- открытые вопросы
- страницы и утверждения с низкой достоверностью
- устаревшие страницы и утверждения

Запускайте эту команду после существенных обновлений вики.

### `wiki search <query>`

Выполняет поиск по содержимому вики. Поведение зависит от конфигурации:

- `search.backend`: `shared` или `local`
- `search.corpus`: `wiki`, `memory` или `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` или `raw-claim`

Используйте `wiki search`, когда важны характерное для вики ранжирование и происхождение данных. Для одного широкого прохода поиска по общей памяти предпочтительнее использовать `openclaw memory search`, если активный плагин памяти предоставляет общий поиск.

Режимы поиска:

- `find-person`: псевдонимы, имена пользователей, профили в социальных сетях, канонические идентификаторы и страницы людей
- `route-question`: подсказки о том, к кому обратиться и для чего лучше использовать контакт, а также контекст отношений
- `source-evidence`: исходные страницы и структурированные поля доказательств
- `raw-claim`: текст структурированного утверждения с метаданными утверждения и доказательств

Примеры:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Текстовый вывод содержит строки `Claim:` и `Evidence:`, если результат соответствует структурированному утверждению. Вывод JSON также предоставляет поля `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` и `evidenceSourceIds` для подробного анализа на стороне агента.

### `wiki get <lookup>`

Читает страницу вики по идентификатору или относительному пути.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Применяет точечные изменения без произвольного редактирования страницы:

- `apply synthesis <title>`: создаёт или обновляет страницу синтеза с управляемым текстом сводки
- `apply metadata <lookup>`: обновляет метаданные существующей страницы

Обе команды принимают параметры `--source-id`, `--contradiction`, `--question` (каждый можно указывать несколько раз), `--confidence <n>` (0–1) и `--status <status>`. Команда `apply metadata` также принимает параметр `--clear-confidence` для удаления сохранённого значения достоверности. Это поддерживаемый способ обновления страниц вики, сохраняющий целостность управляемых сгенерированных блоков.

### `wiki bridge import`

Импортирует общедоступные артефакты памяти из активного плагина памяти в исходные страницы, использующие мост. Используйте эту команду в режиме `bridge`, чтобы загрузить в хранилище вики последние экспортированные артефакты памяти.

Для чтения активных артефактов моста CLI направляет импорт через RPC Gateway, чтобы использовать контекст плагина памяти среды выполнения. Если импорт через мост отключён или чтение артефактов выключено, команда сохраняет локальное автономное поведение с нулевым количеством импортированных элементов. Обновление индекса после импорта определяется параметром `ingest.autoCompile`.

### `wiki unsafe-local import`

Импортирует данные из явно настроенных локальных путей (`unsafeLocal.paths`) в режиме `unsafe-local`. Этот режим является намеренно экспериментальным и предназначен только для работы на одном компьютере. Обновление индекса после импорта определяется параметром `ingest.autoCompile`.

### `wiki chatgpt import`

Импортирует экспорт ChatGPT в черновые исходные страницы вики.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Флаг              | Значение по умолчанию | Описание                                                                   |
| ----------------- | --------------------- | -------------------------------------------------------------------------- |
| `--export <path>` | (обязательно)         | Каталог экспорта ChatGPT или путь к файлу `conversations.json`.            |
| `--dry-run`       | `false`               | Показывает количество созданных, обновлённых и пропущенных страниц без записи. |

Если импорт не является пробным и изменяет хотя бы одну страницу, идентификатор запуска импорта записывается и выводится в сводке; он необходим для отката.

### `wiki chatgpt rollback <run-id>`

Откатывает ранее применённый запуск импорта ChatGPT: удаляет созданные им страницы и восстанавливает перезаписанные. Ничего не делает (и сообщает `alreadyRolledBack`), если запуск уже был отменён.

### `wiki obsidian ...`

Вспомогательные команды Obsidian для хранилищ, работающих в режиме совместимости с Obsidian: `status`, `search`, `open`, `command`, `daily`. Если параметр `obsidian.useOfficialCli` включён, для этих команд требуется официальный CLI `obsidian`, доступный через `PATH`.

Проверка конфигурации отклоняет `obsidian.useOfficialCli: true`, если `vault.scope` имеет значение `agent`, поскольку `obsidian.vaultName` — это единая глобальная настройка, а не сопоставление для отдельных агентов. При этом остаётся доступным рендеринг Markdown, совместимый с Obsidian.

## Практические рекомендации по использованию

- Используйте `wiki search` вместе с `wiki get`, когда важны происхождение данных и идентичность страницы.
- Используйте `wiki apply` вместо ручного редактирования управляемых сгенерированных разделов.
- Используйте `wiki lint`, прежде чем доверять противоречивому содержимому или содержимому с низкой достоверностью.
- Используйте `wiki compile` после массового импорта или изменения источников, если требуется немедленно обновить панели мониторинга и скомпилированные дайджесты.
- Используйте `wiki okf import`, если каталог данных, экспорт документации или конвейер обогащения агента уже создаёт пакеты Markdown в формате OKF.
- Используйте `wiki bridge import`, если режим моста зависит от недавно экспортированных артефактов памяти.

## Связанные параметры конфигурации

На поведение `openclaw wiki` влияют:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Полную модель конфигурации см. в разделе [плагин Memory Wiki](/ru/plugins/memory-wiki).

## См. также

- [Справочник CLI](/ru/cli)
- [Вики памяти](/ru/plugins/memory-wiki)
