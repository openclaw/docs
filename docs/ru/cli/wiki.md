---
read_when:
    - Вы хотите использовать CLI memory-wiki
    - Вы документируете или изменяете `openclaw wiki`
summary: Справочник по CLI для `openclaw wiki` (состояние хранилища memory-wiki, поиск, компиляция, проверка, применение, мост, импорт из ChatGPT и вспомогательные средства Obsidian)
title: Вики
x-i18n:
    generated_at: "2026-07-13T18:01:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Проверяйте и обслуживайте хранилище `memory-wiki`. Предоставляется встроенным плагином `memory-wiki`.

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
openclaw wiki search "альфа"
openclaw wiki search "кого мне спросить о Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Сводка по альфе" \
  --body "Краткий текст синтеза" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Всё ещё активно?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "альфа"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Выбор агента

Когда `plugins.entries.memory-wiki.config.vault.scope` имеет значение `agent`, выберите
хранилище с помощью глобального параметра `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "политика возврата средств"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

Если настроено несколько агентов, для операций CLI требуется `--agent`,
чтобы команда не могла читать или записывать произвольное хранилище по умолчанию. Если
настроен только один агент, он остаётся агентом по умолчанию. Неизвестные идентификаторы агентов
вызывают ошибку до начала операции с хранилищем. Этот параметр не изменяет выбранный
путь, когда `vault.scope` имеет значение `global`.

Для клиентов Gateway действует то же правило: передавайте `agentId` в запросах `wiki.*`,
работающих с хранилищем, при конфигурации с несколькими агентами и областью действия агента. Отсутствующий или неизвестный идентификатор
считается ошибкой. Ходы агента, инструменты вики, дополнения к корпусу памяти и скомпилированные
дайджесты промптов уже содержат контекст активного агента среды выполнения.

## Команды

### `wiki status`

Показывает режим и область действия хранилища, определённого агента, состояние и доступность CLI Obsidian. Используйте эту команду первой, чтобы проверить, инициализировано ли нужное хранилище, исправен ли режим моста и доступна ли интеграция с Obsidian.

Когда режим моста активен и настроен на чтение артефактов памяти, эта команда обращается к работающему Gateway, поэтому видит тот же контекст активного плагина памяти, что и память агента или среды выполнения.

### `wiki doctor`

Запускает проверки состояния вики и сообщает о возможных исправлениях. При обнаружении проблем завершается с ненулевым кодом.

Когда режим моста активен и настроен на чтение артефактов памяти, эта команда обращается к работающему Gateway перед формированием отчёта. Отключённый импорт через мост и конфигурации моста, не читающие артефакты памяти, работают локально и автономно.

Типичные проблемы:

- режим моста включён без общедоступных артефактов памяти
- недопустимая или отсутствующая структура хранилища
- отсутствует внешний CLI Obsidian, когда ожидается режим Obsidian

### `wiki init`

Создаёт структуру хранилища вики и начальные страницы, включая индексы верхнего уровня и каталоги кеша.

### `wiki ingest <path>`

Импортирует локальный файл Markdown или текстовый файл в папку `sources/` вики в качестве исходной страницы. `<path>` должен быть путём к локальному файлу; импорт по URL сейчас не поддерживается. Двоичные файлы отклоняются.

Импортированные исходные страницы содержат frontmatter с данными о происхождении (`sourceType: local-file`, `sourcePath`, `ingestedAt`). После импорта хранилище всегда компилируется заново.

Флаги: `--title <title>` переопределяет заголовок источника (по умолчанию он формируется из имени файла).

### `wiki okf import <path>`

Импортирует распакованный пакет Open Knowledge Format в страницы концепций вики.

Импортёр читает каждый незарезервированный документ концепции `.md` в дереве каталогов OKF, требует непустое поле `type` и обрабатывает неизвестные значения OKF `type` как универсальные концепции. Зарезервированные файлы OKF `index.md` и `log.md` не импортируются как концепции.

Импортированные страницы размещаются в плоской структуре внутри `concepts/`, поэтому существующие процессы компиляции, поиска, чтения, создания дайджестов и панелей вики сразу их видят. Исходный идентификатор концепции OKF, `type`, `resource`, `tags`, временная метка, путь к источнику и полный frontmatter сохраняются во frontmatter страницы. Внутренние ссылки Markdown из OKF переписываются так, чтобы указывать на созданные страницы вики; неработающие и внешние ссылки остаются без изменений. После импорта хранилище всегда компилируется заново.

Примеры:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "Таблица BigQuery" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Перестраивает индексы, блоки связанных материалов, панели и скомпилированные дайджесты. Записывает стабильные машиночитаемые артефакты в:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Если включён `render.createDashboards`, компиляция также обновляет страницы отчётов.

### `wiki lint`

Проверяет хранилище и записывает отчёт, охватывающий:

- структурные проблемы (неработающие ссылки, отсутствующие или повторяющиеся идентификаторы, отсутствующий тип страницы или заголовок, недопустимый frontmatter)
- пробелы в данных о происхождении (отсутствующие идентификаторы источников, отсутствующие данные о происхождении импорта)
- противоречия (отмеченные противоречия, конфликтующие утверждения)
- открытые вопросы
- страницы и утверждения с низкой степенью уверенности
- устаревшие страницы и утверждения

Запускайте эту команду после существенных обновлений вики.

### `wiki search <query>`

Выполняет поиск по содержимому вики. Поведение зависит от конфигурации:

- `search.backend`: `shared` или `local`
- `search.corpus`: `wiki`, `memory` или `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` или `raw-claim`

Используйте `wiki search` для ранжирования и отслеживания происхождения с учётом особенностей вики. Для одного широкого прохода поиска по общей памяти предпочитайте `openclaw memory search`, когда активный плагин памяти предоставляет общий поиск.

Режимы поиска:

- `find-person`: псевдонимы, имена пользователей, учётные записи в социальных сетях, канонические идентификаторы и страницы людей
- `route-question`: подсказки о том, к кому обращаться и для чего лучше использовать, а также контекст отношений
- `source-evidence`: исходные страницы и структурированные поля доказательств
- `raw-claim`: текст структурированных утверждений с метаданными утверждений и доказательств

Примеры:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "кто разбирается в развёртывании Teams?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "надёжный маршрут Teams" --mode raw-claim --json
```

Текстовый вывод содержит строки `Claim:` и `Evidence:`, когда результат соответствует структурированному утверждению. Вывод JSON дополнительно предоставляет `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` и `evidenceSourceIds` для подробного изучения на стороне агента.

### `wiki get <lookup>`

Читает страницу вики по идентификатору или относительному пути.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Применяет ограниченные изменения без произвольного редактирования страниц:

- `apply synthesis <title>`: создаёт или обновляет страницу синтеза с управляемым текстом сводки
- `apply metadata <lookup>`: обновляет метаданные существующей страницы

Обе команды принимают `--source-id`, `--contradiction`, `--question` (каждый можно указывать несколько раз), `--confidence <n>` (0-1) и `--status <status>`. `apply metadata` также принимает `--clear-confidence`, чтобы удалить сохранённое значение уверенности. Это поддерживаемый способ развития страниц вики, при котором управляемые сгенерированные блоки остаются неизменными.

### `wiki bridge import`

Импортирует общедоступные артефакты памяти из активного плагина памяти в исходные страницы на основе моста. Используйте эту команду в режиме `bridge`, чтобы загрузить последние экспортированные артефакты памяти в хранилище вики.

Для активного чтения артефактов через мост CLI направляет импорт через RPC Gateway, чтобы использовать контекст плагина памяти среды выполнения. Если импорт через мост отключён или чтение артефактов выключено, команда сохраняет локальное и автономное поведение с нулевым импортом. Обновление индекса после импорта контролируется параметром `ingest.autoCompile`.

### `wiki unsafe-local import`

Импортирует данные из явно настроенных локальных путей (`unsafeLocal.paths`) в режиме `unsafe-local`. Эта возможность намеренно является экспериментальной и работает только на одном компьютере. Обновление индекса после импорта контролируется параметром `ingest.autoCompile`.

### `wiki chatgpt import`

Импортирует экспорт ChatGPT в черновые исходные страницы вики.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Флаг              | По умолчанию    | Описание                                                   |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | (обязательно) | Каталог экспорта ChatGPT или путь `conversations.json`.        |
| `--dry-run`       | `false`    | Показывает количество созданных, обновлённых и пропущенных страниц без их записи. |

Если импорт без пробного режима изменяет какие-либо страницы, он регистрирует идентификатор запуска импорта, выводимый в сводке и необходимый для отката.

### `wiki chatgpt rollback <run-id>`

Откатывает ранее применённый запуск импорта ChatGPT: удаляет созданные им страницы и восстанавливает перезаписанные. Ничего не делает (и сообщает `alreadyRolledBack`), если запуск уже был отменён.

### `wiki obsidian ...`

Вспомогательные команды Obsidian для хранилищ, работающих в режиме совместимости с Obsidian: `status`, `search`, `open`, `command`, `daily`. Когда включён `obsidian.useOfficialCli`, для них требуется официальный CLI `obsidian` в `PATH`.

Проверка конфигурации отклоняет `obsidian.useOfficialCli: true`, когда
`vault.scope` имеет значение `agent`, поскольку `obsidian.vaultName` — это одна глобальная настройка,
а не сопоставление для каждого агента. Отображение Markdown в формате, совместимом с Obsidian, остаётся
доступным.

## Практические рекомендации по использованию

- Используйте `wiki search` + `wiki get`, когда важны происхождение и идентичность страницы.
- Используйте `wiki apply` вместо ручного редактирования управляемых сгенерированных разделов.
- Используйте `wiki lint`, прежде чем доверять противоречивому содержимому или содержимому с низкой степенью уверенности.
- Используйте `wiki compile` после массового импорта или изменения источников, если хотите сразу получить обновлённые панели и скомпилированные дайджесты.
- Используйте `wiki okf import`, когда каталог данных, экспорт документации или конвейер обогащения агента уже создаёт пакеты Markdown в формате OKF.
- Используйте `wiki bridge import`, когда режим моста зависит от недавно экспортированных артефактов памяти.

## Связь с конфигурацией

Поведение `openclaw wiki` определяется следующими параметрами:

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
