---
read_when:
    - Ви хочете переглянути або відредагувати окремий кінцевий вузол у файлі робочого простору з термінала
    - Ви пишете скрипти для роботи зі станом робочого простору й потребуєте стабільної, незалежної від типу схеми адресації
    - Ви вирішуєте, чи ввімкнути необов’язковий `oc-path` Plugin на самостійно розгорнутому Gateway
summary: 'Вбудований `oc-path` Plugin: постачає `openclaw path` CLI для схеми адресації файлів робочого простору `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-05-11T20:48:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

Укомплектований Plugin `oc-path` додає CLI [`openclaw path`](/uk/cli/path) для
схеми адресації файлів робочої області `oc://`. Він постачається в репозиторії OpenClaw у
`extensions/oc-path/`, але є опціональним — install/build залишає його неактивним, доки ви
його не ввімкнете.

Адреси `oc://` вказують на один кінцевий елемент (або wildcard-набір кінцевих елементів) усередині
файлу робочої області. Сьогодні Plugin розуміє три види файлів:

- **markdown** (`.md`, `.mdx`): frontmatter, розділи, елементи, поля
- **jsonc** (`.jsonc`, `.json5`, `.json`): коментарі та форматування зберігаються
- **jsonl** (`.jsonl`, `.ndjson`): записи, орієнтовані на рядки

Ті, хто розгортає власні інстанси, та розширення редакторів використовують CLI, щоб читати або записувати один кінцевий елемент
без написання скриптів безпосередньо проти SDK; агенти й hooks розглядають його як
детерміновану основу, щоб byte-fidelity round-trips і захист
redaction sentinel застосовувалися однаково для всіх видів.

## Навіщо його вмикати

Увімкніть `oc-path`, коли хочете, щоб scripts, hooks або локальні інструменти агентів вказували
на точну частину стану робочої області без створення окремого парсера для кожної форми файлу.
Одна адреса `oc://` може називати ключ frontmatter у markdown, елемент розділу,
кінцевий елемент конфігурації JSONC або поле події JSONL.

Це важливо для workflows супровідників, де зміна має бути невеликою,
аудитованою та повторюваною: перевірити одне значення, знайти відповідні записи, dry-run
запис, а потім застосувати лише цей кінцевий елемент, не змінюючи коментарі, закінчення рядків і
сусіднє форматування. Збереження цього як опціонального Plugin дає досвідченим користувачам
основу адресації без додавання залежностей парсерів або CLI-поверхні в
core для інсталяцій, яким це ніколи не потрібно.

Поширені причини ввімкнути його:

- **Локальна автоматизація**: shell scripts можуть визначити або оновити одне значення робочої області
  через `openclaw path … --json` замість підтримки окремого коду парсингу markdown, JSONC
  і JSONL.
- **Редагування, видимі агенту**: агент може показати diff dry-run для одного адресованого
  кінцевого елемента перед записом, що простіше переглядати, ніж довільне переписування файлу.
- **Інтеграції з редакторами**: редактор може зіставити `oc://AGENTS.md/tools/gh` з
  точним вузлом markdown і номером рядка без здогадок за текстом заголовка.
- **Діагностика**: `emit` пропускає файл через parser і emitter у round-trip, тож
  можна перевірити, чи є вид файлу byte-stable, перш ніж покладатися на автоматизовані
  редагування.

Конкретні приклади:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Plugin навмисно не є власником семантики вищого рівня. Memory
plugins і далі володіють записами пам’яті, config commands і далі володіють повним керуванням config,
а логіка LKG і далі володіє відновленням/просуванням. `oc-path` — це вузький
шар адресації та byte-preserving файлових операцій, навколо якого ці інструменти вищого рівня
можуть будуватися.

## Де він працює

Plugin працює **в процесі всередині CLI `openclaw`** на host, де ви
викликаєте команду. Йому не потрібен запущений Gateway, і він не відкриває жодних
мережевих сокетів — кожне дієслово є чистим перетворенням файлу, на який ви вказали.

Метадані Plugin містяться в `extensions/oc-path/openclaw.plugin.json`:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` не допускає Plugin до hot path Gateway. `onCommands:
["path"]` повідомляє CLI, що Plugin треба ледаче завантажити під час першого запуску
`openclaw path …`, тому інсталяції, які ніколи не використовують це дієслово, не несуть витрат.

## Увімкнення

```bash
openclaw plugins enable oc-path
```

Перезапустіть Gateway (якщо ви його запускаєте), щоб snapshot маніфесту підхопив новий
стан. Прості виклики `openclaw path` працюють негайно на тому самому host —
CLI завантажує Plugin за потреби.

Вимкнути можна так:

```bash
openclaw plugins disable oc-path
```

## Залежності

Усі залежності parser є локальними для Plugin — увімкнення `oc-path` не додає
нові пакети до core runtime:

| Залежність     | Призначення                                                        |
| -------------- | ----------------------------------------------------------------- |
| `commander`    | Підключення підкоманд для `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Парсинг JSONC + редагування кінцевих елементів зі збереженням коментарів і кінцевих ком. |
| `markdown-it`  | Токенізація Markdown для моделі section / item / field.           |

JSONL залишається реалізованим вручну — line-oriented parsing простіший за будь-яку
залежність, а per-line парсинг JSONC уже проходить через `jsonc-parser`.

## Що він надає

| Поверхня                       | Надається через                                          |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Parser / formatter `oc://`     | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Per-kind parse / emit / edit   | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| Universal resolve / find / set | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Захист redaction-sentinel      | `extensions/oc-path/src/oc-path/sentinel.ts`            |

Сьогодні CLI є єдиною публічною поверхнею. Дієслова substrate є приватними для
Plugin; споживачі використовують CLI (або створюють власний Plugin на основі SDK).

## Відношення до інших Plugin

- **`memory-*`**: записи пам’яті проходять через memory plugins, а не `oc-path`.
  `oc-path` — це generic file substrate; memory plugins накладають власну
  семантику поверх нього.
- **LKG**: `path` не знає про відновлення Last-Known-Good config. Якщо
  файл відстежується LKG, наступний виклик `observe` вирішує, чи просувати, чи
  відновлювати; `set --batch` для атомарного multi-set через життєвий цикл promote/recover LKG
  заплановано разом із LKG-recovery substrate.

## Безпека

`set` записує raw bytes через emit path substrate, який автоматично застосовує
захист redaction-sentinel. Кінцевий елемент, що містить
`__OPENCLAW_REDACTED__` (буквально або як substring), відхиляється під час запису
з `OC_EMIT_SENTINEL`. CLI також вилучає буквальний sentinel з будь-якого
human або JSON output, який друкує, замінюючи його на `[REDACTED]`, щоб terminal
captures і pipelines ніколи не розкривали marker.

## Пов’язано

- [Довідник CLI `openclaw path`](/uk/cli/path)
- [Керування plugins](/uk/plugins/manage-plugins)
- [Створення plugins](/uk/plugins/building-plugins)
