---
read_when:
    - Вы хотите использовать CLI memory-wiki
    - Вы документируете или изменяете `openclaw wiki`
summary: Справочник CLI для `openclaw wiki` (состояние хранилища memory-wiki, поиск, компиляция, lint, применение, bridge и вспомогательные утилиты Obsidian)
title: Вики
x-i18n:
    generated_at: "2026-06-28T22:47:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Проверяйте и поддерживайте хранилище `memory-wiki`.

Предоставляется встроенным Plugin `memory-wiki`.

Связанные материалы:

- [Plugin Memory Wiki](/ru/plugins/memory-wiki)
- [Обзор памяти](/ru/concepts/memory)
- [CLI: memory](/ru/cli/memory)

## Для чего это нужно

Используйте `openclaw wiki`, когда вам нужно скомпилированное хранилище знаний с:

- нативным для вики поиском и чтением страниц
- синтезами с богатым происхождением данных
- отчетами о противоречиях и актуальности
- мостовыми импортами из активного Plugin памяти
- необязательными помощниками Obsidian CLI

## Частые команды

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

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Команды

### `wiki status`

Проверить текущий режим хранилища, состояние и доступность Obsidian CLI.

Используйте это первым, когда не уверены, инициализировано ли хранилище, исправен ли мостовой режим или доступна ли интеграция Obsidian.

Когда мостовой режим активен и настроен на чтение артефактов памяти, эта команда запрашивает работающий Gateway, поэтому видит тот же контекст активного Plugin памяти, что и память агента/рантайма.

### `wiki doctor`

Запустить проверки состояния вики и показать проблемы конфигурации или хранилища.

Когда мостовой режим активен и настроен на чтение артефактов памяти, эта команда запрашивает работающий Gateway перед построением отчета. Отключенные мостовые импорты и мостовые конфигурации, которые не читают артефакты памяти, остаются локальными/офлайн.

Типичные проблемы:

- мостовой режим включен без публичных артефактов памяти
- недопустимая или отсутствующая структура хранилища
- отсутствует внешний Obsidian CLI, когда ожидается режим Obsidian

### `wiki init`

Создать структуру вики-хранилища и стартовые страницы.

Это инициализирует корневую структуру, включая индексы верхнего уровня и каталоги кэша.

### `wiki ingest <path-or-url>`

Импортировать содержимое в исходный слой вики.

Примечания:

- импорт URL управляется `ingest.allowUrlIngest`
- импортированные исходные страницы сохраняют происхождение данных во frontmatter
- автокомпиляция может запускаться после импорта, если включена

### `wiki okf import <path>`

Импортировать распакованный пакет Open Knowledge Format в концептуальные страницы вики.

Импортер читает каждый незарезервированный концептуальный документ `.md` в дереве каталогов OKF, требует непустое поле `type` и рассматривает неизвестные значения OKF `type` как универсальные концепты. Зарезервированные файлы OKF `index.md` и `log.md` не импортируются как концепты.

Импортированные страницы разворачиваются под `concepts/`, чтобы существующие потоки компиляции, поиска, получения, дайджеста и панели вики сразу их видели. Исходный ID концепта OKF, `type`, `resource`, `tags`, временная метка, путь источника и полный frontmatter сохраняются во frontmatter страницы. Внутренние Markdown-ссылки OKF переписываются на сгенерированные страницы вики; неработающие или внешние ссылки остаются без изменений.

Примеры:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Пересобрать индексы, связанные блоки, панели и скомпилированные дайджесты.

Это записывает стабильные машиноориентированные артефакты в:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Если `render.createDashboards` включен, компиляция также обновляет страницы отчетов.

### `wiki lint`

Проверить хранилище и сообщить о:

- структурных проблемах
- пробелах в происхождении данных
- противоречиях
- открытых вопросах
- страницах/утверждениях с низкой уверенностью
- устаревших страницах/утверждениях

Запускайте это после значимых обновлений вики.

### `wiki search <query>`

Искать содержимое вики.

Поведение зависит от конфигурации:

- `search.backend`: `shared` или `local`
- `search.corpus`: `wiki`, `memory` или `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` или
  `raw-claim`

Используйте `wiki search`, когда нужны специфичное для вики ранжирование или детали происхождения данных. Для одного широкого прохода общего вспоминания предпочитайте `openclaw memory search`, когда активный Plugin памяти предоставляет общий поиск.

Режимы поиска помогают агенту выбрать правильную поверхность:

- `find-person`: псевдонимы, handles, соцсети, канонические ID и страницы людей
- `route-question`: подсказки ask-for/best-used-for и контекст отношений
- `source-evidence`: исходные страницы и структурированные поля доказательств
- `raw-claim`: структурированный текст утверждения с метаданными утверждения/доказательства

Примеры:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Текстовый вывод включает строки `Claim:` и `Evidence:`, когда результат соответствует структурированному утверждению. JSON-вывод дополнительно предоставляет `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` и `evidenceSourceIds` для агентского детального просмотра.

### `wiki get <lookup>`

Прочитать страницу вики по ID или относительному пути.

Примеры:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Применять узкие изменения без произвольной правки страниц.

Поддерживаемые потоки включают:

- создание/обновление страницы синтеза
- обновление метаданных страницы
- прикрепление ID источников
- добавление вопросов
- добавление противоречий
- обновление уверенности/статуса
- запись структурированных утверждений

Эта команда существует, чтобы вики могла безопасно развиваться без ручного редактирования управляемых блоков.

### `wiki bridge import`

Импортировать публичные артефакты памяти из активного Plugin памяти в исходные страницы с мостовой поддержкой.

Используйте это в режиме `bridge`, когда хотите подтянуть в вики-хранилище последние экспортированные артефакты памяти.

Для активного чтения мостовых артефактов CLI направляет импорт через Gateway RPC, чтобы импорт использовал рантайм-контекст Plugin памяти. Если мостовые импорты отключены или чтение артефактов выключено, команда сохраняет локальное/офлайн поведение с нулевым импортом.

### `wiki unsafe-local import`

Импортировать из явно настроенных локальных путей в режиме `unsafe-local`.

Это намеренно экспериментально и только для той же машины.

### `wiki obsidian ...`

Вспомогательные команды Obsidian для хранилищ, работающих в режиме, дружественном к Obsidian.

Подкоманды:

- `status`
- `search`
- `open`
- `command`
- `daily`

Они требуют официальный CLI `obsidian` в `PATH`, когда включен `obsidian.useOfficialCli`.

## Практические рекомендации по использованию

- Используйте `wiki search` + `wiki get`, когда важны происхождение данных и идентичность страницы.
- Используйте `wiki apply` вместо ручного редактирования управляемых сгенерированных разделов.
- Используйте `wiki lint`, прежде чем доверять противоречивому содержимому или содержимому с низкой уверенностью.
- Используйте `wiki compile` после массовых импортов или изменений источников, когда хотите сразу получить свежие панели и скомпилированные дайджесты.
- Используйте `wiki okf import`, когда каталог данных, экспорт документации или конвейер обогащения агента уже выдает Markdown-пакеты OKF.
- Используйте `wiki bridge import`, когда мостовой режим зависит от недавно экспортированных артефактов памяти.

## Связи с конфигурацией

Поведение `openclaw wiki` определяется:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

См. [Plugin Memory Wiki](/ru/plugins/memory-wiki) для полной модели конфигурации.

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Memory wiki](/ru/plugins/memory-wiki)
