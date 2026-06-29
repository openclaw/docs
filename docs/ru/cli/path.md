---
read_when:
    - Вы хотите прочитать или записать конечный элемент внутри файла рабочей области из терминала
    - Вы пишете скрипты для состояния рабочей области и хотите стабильную схему адресации, не зависящую от типа.
    - Вы отлаживаете путь `oc://` (проверьте синтаксис, посмотрите, во что он разрешается)
summary: Справочник CLI для `openclaw path` (просмотр и редактирование файлов рабочей области через схему адресации `oc://`)
title: Путь
x-i18n:
    generated_at: "2026-06-28T22:45:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Предоставляемый Plugin доступ из оболочки к основе адресации `oc://`: единая
схема путей с диспетчеризацией по типу для проверки и редактирования адресуемых
файлов рабочей области (markdown, jsonc, jsonl, yaml/yml/lobster). Пользователи
с самостоятельным хостингом, авторы Plugin и расширения редакторов используют
ее, чтобы читать, находить или обновлять узкую область без написания отдельных
парсеров для каждого типа файлов.

CLI отражает публичные глаголы основы:

- `resolve` конкретен и возвращает одно совпадение.
- `find` — глагол для множественных совпадений по подстановкам, объединениям,
  предикатам и позиционному разворачиванию.
- `set` принимает только конкретные пути или маркеры вставки; шаблоны с
  подстановками отклоняются до записи.

`path` предоставляется встроенным опциональным Plugin `oc-path`. Включите его
перед первым использованием:

```bash
openclaw plugins enable oc-path
```

## Зачем это использовать

Состояние OpenClaw распределено по редактируемым человеком markdown-файлам,
конфигурации JSONC с комментариями, журналам JSONL только для добавления и YAML
файлам рабочих процессов/спецификаций. Скриптам оболочки, хукам и агентам часто
нужно одно небольшое значение из этих файлов: ключ frontmatter, настройка
Plugin, поле записи журнала, шаг YAML или пункт списка под именованным разделом.

`openclaw path` дает таким вызывающим сторонам стабильный адрес вместо
одноразового grep, регулярного выражения или парсера для каждого типа файла.
Один и тот же путь `oc://` можно валидировать, разрешать, искать, выполнять в
пробном режиме и записывать из терминала, что упрощает проверку узкой
автоматизации и делает ее безопаснее для повторного запуска. Это особенно
полезно, когда нужно обновить один лист, сохранив остальные комментарии файла,
переводы строк и окружающее форматирование.

Используйте это, когда нужный объект имеет логический адрес, но физическая
форма файла различается:

- Хук хочет прочитать одну настройку из JSONC с комментариями, не теряя
  комментарии при обратной записи значения.
- Скрипт обслуживания хочет найти каждое совпадающее поле события в журнале
  JSONL, не загружая весь журнал в пользовательский парсер.
- Расширение редактора хочет перейти к разделу markdown или пункту списка по
  slug, а затем отобразить точную строку, к которой был разрешен путь.
- Агент хочет пробно выполнить небольшое редактирование рабочей области перед
  применением, чтобы измененные байты были видны при ревью.

Вам, вероятно, не нужен `openclaw path` для обычного редактирования всего файла,
сложных миграций конфигурации или записей, специфичных для памяти. Для этого
следует использовать команду или Plugin владельца. `path` предназначен для
небольших адресуемых операций с файлами, где повторяемая терминальная команда
понятнее, чем еще один специальный парсер.

## Как это используется

Прочитать одно значение из редактируемого человеком файла конфигурации:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Предварительно просмотреть запись без изменения диска:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Найти совпадающие записи в журнале JSONL только для добавления:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Адресовать инструкцию в markdown по разделу и элементу вместо номера строки:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Проверить путь в CI или preflight-скрипте до чтения или записи скриптом:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Эти команды рассчитаны на копирование в shell-скрипты. Используйте `--json`,
когда вызывающей стороне нужен структурированный вывод, и `--human`, когда
результат просматривает человек.

## Как это работает

`openclaw path` делает четыре вещи:

1. Разбирает адрес `oc://` на слоты: файл, раздел, элемент, поле и
   опциональную сессию.
2. Выбирает адаптер типа файла по целевому расширению (`.md`, `.jsonc`,
   `.jsonl`, `.yaml`, `.yml`, `.lobster` и связанные псевдонимы).
3. Разрешает слоты относительно AST этого типа файла: заголовки/элементы
   markdown, ключи объектов/индексы массивов JSONC, построчные записи JSONL или
   узлы map/sequence YAML.
4. Для `set` выводит отредактированные байты через тот же адаптер, чтобы
   нетронутые части файла сохраняли комментарии, переводы строк и близкое
   форматирование там, где тип это поддерживает.

`resolve` и `set` требуют одну конкретную цель. `find` — исследовательский
глагол: он разворачивает подстановки, объединения, предикаты и порядковые
указатели в конкретные совпадения, которые можно проверить перед выбором одного
для записи.

## Подкоманды

| Подкоманда             | Назначение                                                                     |
| ---------------------- | ------------------------------------------------------------------------------ |
| `resolve <oc-path>`    | Вывести конкретное совпадение по пути (или «не найдено»).                      |
| `find <pattern>`       | Перечислить совпадения для пути с подстановкой / объединением / предикатом.    |
| `set <oc-path> <value>` | Записать лист или цель вставки по конкретному пути. Поддерживает `--dry-run`. |
| `validate <oc-path>`   | Только разбор; вывести структурную разбивку (файл / раздел / элемент / поле). |
| `emit <file>`          | Прогнать файл туда и обратно через `parseXxx` + `emitXxx` (диагностика точности байтов). |

## Глобальные флаги

| Флаг            | Назначение                                                                 |
| --------------- | -------------------------------------------------------------------------- |
| `--cwd <dir>`   | Разрешить слот файла относительно этого каталога (по умолчанию: `process.cwd()`). |
| `--file <path>` | Переопределить разрешенный путь слота файла (абсолютный доступ).           |
| `--json`        | Принудительно вывести JSON (по умолчанию, когда stdout не является TTY).   |
| `--human`       | Принудительно вывести человекочитаемый формат (по умолчанию, когда stdout является TTY). |
| `--dry-run`     | (только для `set`) вывести байты, которые были бы записаны, без записи.     |
| `--diff`        | (с `set --dry-run`) вывести unified diff вместо полных байтов.             |

## Синтаксис `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Правила слотов: `field` требует `item`, а `item` требует `section`. Во всех
четырех слотах:

- **Сегменты в кавычках** — `"a/b.c"` сохраняет разделители `/` и `.`.
  Содержимое является байтовым литералом; `"` и `\` не допускаются внутри
  кавычек. Слот файла также учитывает кавычки: `oc://"skills/email-drafter"/Tools/$last`
  трактует `skills/email-drafter` как единый путь к файлу.
- **Предикаты** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Числовые операции требуют, чтобы обе стороны приводились к
  конечным числам.
- **Объединения** — `{a,b,c}` совпадает с любой из альтернатив.
- **Подстановки** — `*` (один подсегмент) и `**` (ноль или более,
  рекурсивно). `find` принимает их; `resolve` и `set` отклоняют их как
  неоднозначные.
- **Позиционные указатели** — `$first` / `$last` разрешаются в первый /
  последний индекс или объявленный ключ.
- **Порядковый указатель** — `#N` для N-го совпадения в порядке документа.
- **Маркеры вставки** — `+`, `+key`, `+nnn` для вставки по ключу / индексу
  (используйте с `set`).
- **Область сессии** — `?session=cron-daily` и т. п. Ортогональна вложенности
  слотов. Значения сессии являются сырыми, не percent-decoded; они не могут
  содержать управляющие символы или зарезервированные разделители запроса
  (`?`, `&`, `%`).

Зарезервированные символы (`?`, `&`, `%`) вне сегментов в кавычках,
предикатов или объединений отклоняются. Управляющие символы
(U+0000-U+001F, U+007F) отклоняются везде, включая значение запроса `session`.

`formatOcPath(parseOcPath(path)) === path` гарантируется для канонических
путей. Неканонические параметры запроса игнорируются, кроме первого
непустого значения `session=`.

## Адресация по типу файла

| Тип               | Модель адресации                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | Разделы H2 по slug, пункты списка по slug или `#N`, frontmatter через `[frontmatter]`.              |
| JSONC/JSON        | Ключи объектов и индексы массивов; точки разделяют вложенные подсегменты, если они не в кавычках.   |
| JSONL             | Верхнеуровневые адреса строк (`L1`, `L2`, `$first`, `$last`), затем спуск в стиле JSONC внутри строки. |
| YAML/YML/.lobster | Ключи map и индексы sequence; комментарии и flow style обрабатываются API документа YAML.           |

`resolve` возвращает структурированное совпадение: `root`, `node`, `leaf` или
`insertion-point`, с номером строки, начинающимся с 1. Значения листьев
выводятся как текст плюс `leafType`, чтобы авторы Plugin могли отображать
предпросмотры без зависимости от формы AST конкретного типа.

## Контракт мутации

`set` записывает одну конкретную цель:

- Значения frontmatter markdown и поля элементов `- key: value` являются
  строковыми листьями. Вставки markdown добавляют разделы, ключи frontmatter
  или элементы раздела и отрисовывают каноническую форму markdown для
  измененного файла.
- Записи листьев JSONC приводят строковое значение к существующему типу листа
  (`string`, конечный `number`, `true`/`false` или `null`). Используйте
  `--value-json`, когда замена листа JSONC/JSON/JSONL должна разобрать
  `<value>` как JSON и может изменить форму, например при замене строкового
  сокращения SecretRef объектом. Вставки объектов и массивов JSONC разбирают
  `<value>` как JSON и используют путь редактирования `jsonc-parser` для
  обычных записей листьев, сохраняя комментарии и близкое форматирование.
- Записи листьев JSONL приводятся как JSONC внутри строки. Замена всей строки и
  добавление разбирают `<value>` как JSON. Отрисованный JSONL сохраняет
  преобладающее в файле соглашение о переводах строк LF/CRLF.
- Записи листьев YAML приводятся к существующему скалярному типу (`string`,
  конечный `number`, `true`/`false` или `null`). Вставки YAML используют API
  документа встроенного пакета `yaml` для обновлений map/sequence. Некорректные
  YAML-документы с ошибками парсера отклоняются перед мутацией с
  `parse-error`.

Используйте `--dry-run` перед видимыми пользователю записями, когда точные
байты имеют значение. Основа сохраняет побайтно идентичный вывод для циклов
parse/emit, но мутация может канонизировать отредактированную область или файл
в зависимости от типа. Добавьте `--diff`, когда нужен предпросмотр в виде
сфокусированного патча до/после вместо полного отрисованного файла.

## Примеры

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Еще примеры грамматики:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Рецепты по типам файлов

Одни и те же пять команд работают для всех типов; схема адресации выбирает обработчик по
расширению файла. Примеры ниже используют фикстуры из описания PR.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

Предикат `[frontmatter]` адресует блок YAML frontmatter; `tools`
сопоставляется с заголовком `## Tools` через slug, а листья элементов сохраняют свою форму slug,
даже когда в источнике используются подчёркивания (`send_email` → `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

Правки JSONC проходят через `jsonc-parser`, поэтому комментарии и пробелы сохраняются после
`set`. Сначала запускайте с `--dry-run`, чтобы проверить байты перед записью.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Каждая строка является записью. Адресуйте по предикату (`[event=action]`), когда
номер строки неизвестен, или по каноническому сегменту `LN`, когда он известен.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML использует API `Document` пакета `yaml`, а не самописный парсер,
поэтому обычные циклы parse/emit сохраняют комментарии и авторскую структуру, а
разрешённые пути используют ту же модель ключей map / индексов sequence, что и JSONC. Тот же
адаптер обрабатывает файлы `.yaml`, `.yml` и `.lobster`.

## Справочник подкоманд

### `resolve <oc-path>`

Читает один leaf или node. Wildcard запрещены — используйте для них `find`.
Завершается с `0` при совпадении, с `1` при корректном отсутствии совпадения, с `2` при ошибке разбора или отклонённом
паттерне.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Перечисляет каждое совпадение для шаблона с подстановочными символами / предикатом / объединением. Завершается с кодом `0`
при наличии хотя бы одного совпадения, с `1` при их отсутствии. Подстановочные символы слота файла отклоняются с
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — передайте конкретный файл (globbing по нескольким файлам
планируется как последующая функция).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Записывает конечный узел. Используйте вместе с `--dry-run`, чтобы предварительно просмотреть байты, которые были бы
записаны, не изменяя файл. Добавьте `--diff` для предварительного просмотра unified diff.
Завершается с кодом `0` при успешной записи, с `1`, если субстрат отказывает (например, при
срабатывании sentinel guard), с `2` при ошибках разбора.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Маркер вставки `+key` создает именованный дочерний элемент, если он еще не
существует; `+nnn` и одиночный `+` работают для индексированной вставки и вставки в конец соответственно.

### `validate <oc-path>`

Проверка только разбора. Без доступа к файловой системе. Полезно, когда нужно подтвердить, что
путь шаблона имеет корректную форму перед подстановкой переменных, или когда нужна
структурная разбивка для отладки:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Завершается с кодом `0`, если путь действителен, с `1`, если недействителен (со структурированными `code` и
`message`), с `2` при ошибках аргументов.

### `emit <file>`

Пропускает файл через parser и emitter для соответствующего типа туда и обратно. Вывод должен
быть побайтно идентичен вводу для корректного файла — расхождение указывает на
ошибку parser или срабатывание sentinel. Полезно для отладки поведения субстрата на
реальных входных данных.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Коды выхода

| Код | Значение                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Успех. (`resolve` / `find`: хотя бы одно совпадение. `set`: запись выполнена.) |
| `1`  | Нет совпадений, или `set` отклонен субстратом (без ошибки системного уровня).      |
| `2`  | Ошибка аргумента или разбора.                                                   |

## Режим вывода

`openclaw path` учитывает TTY: удобочитаемый вывод в терминале, JSON, когда
stdout передается по pipe или перенаправляется. `--json` и `--human` переопределяют
автоопределение.

## Примечания

- `set` записывает байты через emit-путь субстрата, который автоматически применяет
  redaction-sentinel guard. Конечный узел, содержащий
  `__OPENCLAW_REDACTED__` (дословно или как подстроку), отклоняется во время
  записи.
- Разбор JSONC и правки конечных узлов используют Plugin-локальную зависимость `jsonc-parser`,
  поэтому комментарии и форматирование сохраняются при обычных
  записях конечных узлов вместо прохождения через самописный parser/re-render путь.
- `path` не знает о LKG. Если файл отслеживается LKG, следующий
  вызов observe решает, выполнять ли promote / recover. `set --batch` для
  атомарного multi-set через жизненный цикл promote/recover LKG планируется
  вместе с субстратом LKG-recovery.

## Связанные материалы

- [Справочник CLI](/ru/cli)
