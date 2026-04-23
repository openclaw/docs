---
read_when:
    - Ви хочете керувати хуками агента
    - Ви хочете перевірити доступність хуків або ввімкнути хуки робочого простору
summary: Довідка CLI для `openclaw hooks` (хуки агента)
title: хуки
x-i18n:
    generated_at: "2026-04-23T06:17:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Керуйте хуками агента (автоматизаціями на основі подій для команд на кшталт `/new`, `/reset` і запуску gateway).

Запуск `openclaw hooks` без підкоманди еквівалентний `openclaw hooks list`.

Пов’язано:

- Хуки: [Хуки](/uk/automation/hooks)
- Хуки Plugin: [Хуки Plugin](/uk/plugins/architecture#provider-runtime-hooks)

## Список усіх хуків

```bash
openclaw hooks list
```

Показати всі виявлені хуки з каталогів workspace, managed, extra і bundled.
Під час запуску gateway внутрішні обробники хуків не завантажуються, доки не налаштовано принаймні один внутрішній хук.

**Параметри:**

- `--eligible`: Показувати лише придатні хуки (вимоги виконано)
- `--json`: Вивести у форматі JSON
- `-v, --verbose`: Показувати докладну інформацію, включно з відсутніми вимогами

**Приклад виводу:**

```
Хуки (4/4 готові)

Готові:
  🚀 boot-md ✓ - Запускати BOOT.md під час запуску gateway
  📎 bootstrap-extra-files ✓ - Додавати додаткові bootstrap-файли workspace під час bootstrap агента
  📝 command-logger ✓ - Журналювати всі події команд у централізований файл аудиту
  💾 session-memory ✓ - Зберігати контекст сесії в пам’ять, коли подається команда /new або /reset
```

**Приклад (verbose):**

```bash
openclaw hooks list --verbose
```

Показує відсутні вимоги для непридатних хуків.

**Приклад (JSON):**

```bash
openclaw hooks list --json
```

Повертає структурований JSON для програмного використання.

## Отримати інформацію про хук

```bash
openclaw hooks info <name>
```

Показати докладну інформацію про конкретний хук.

**Аргументи:**

- `<name>`: Назва хука або ключ хука (наприклад, `session-memory`)

**Параметри:**

- `--json`: Вивести у форматі JSON

**Приклад:**

```bash
openclaw hooks info session-memory
```

**Вивід:**

```
💾 session-memory ✓ Готово

Зберігати контекст сесії в пам’ять, коли подається команда /new або /reset

Докладно:
  Джерело: openclaw-bundled
  Шлях: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Обробник: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Домашня сторінка: https://docs.openclaw.ai/automation/hooks#session-memory
  Події: command:new, command:reset

Вимоги:
  Конфігурація: ✓ workspace.dir
```

## Перевірити придатність хуків

```bash
openclaw hooks check
```

Показати зведення про стан придатності хуків (скільки готові, а скільки ні).

**Параметри:**

- `--json`: Вивести у форматі JSON

**Приклад виводу:**

```
Стан хуків

Усього хуків: 4
Готові: 4
Не готові: 0
```

## Увімкнути хук

```bash
openclaw hooks enable <name>
```

Увімкнути конкретний хук, додавши його до вашої конфігурації (типово `~/.openclaw/openclaw.json`).

**Примітка:** Хуки workspace типово вимкнені, доки ви не ввімкнете їх тут або в конфігурації. Хуки, якими керують plugins, показують `plugin:<id>` у `openclaw hooks list`, і їх не можна вмикати/вимикати тут. Натомість увімкніть/вимкніть сам Plugin.

**Аргументи:**

- `<name>`: Назва хука (наприклад, `session-memory`)

**Приклад:**

```bash
openclaw hooks enable session-memory
```

**Вивід:**

```
✓ Хук увімкнено: 💾 session-memory
```

**Що це робить:**

- Перевіряє, чи існує хук і чи є він придатним
- Оновлює `hooks.internal.entries.<name>.enabled = true` у вашій конфігурації
- Зберігає конфігурацію на диск

Якщо хук походить із `<workspace>/hooks/`, цей крок явного ввімкнення є обов’язковим, перш ніж
Gateway завантажить його.

**Після ввімкнення:**

- Перезапустіть gateway, щоб хуки перезавантажилися (перезапуск застосунку в рядку меню на macOS або перезапуск вашого процесу gateway у dev).

## Вимкнути хук

```bash
openclaw hooks disable <name>
```

Вимкнути конкретний хук, оновивши вашу конфігурацію.

**Аргументи:**

- `<name>`: Назва хука (наприклад, `command-logger`)

**Приклад:**

```bash
openclaw hooks disable command-logger
```

**Вивід:**

```
⏸ Хук вимкнено: 📝 command-logger
```

**Після вимкнення:**

- Перезапустіть gateway, щоб хуки перезавантажилися

## Примітки

- `openclaw hooks list --json`, `info --json` і `check --json` записують структурований JSON безпосередньо в stdout.
- Хуки, якими керують plugins, не можна вмикати або вимикати тут; натомість увімкніть або вимкніть Plugin-власник.

## Встановити набори хуків

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Встановіть набори хуків через уніфікований інсталятор plugins.

`openclaw hooks install` усе ще працює як псевдонім сумісності, але виводить
попередження про застарілість і перенаправляє на `openclaw plugins install`.

Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або
**dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення
залежностей виконуються з `--ignore-scripts` для безпеки.

Прості специфікації та `@latest` залишаються на стабільній гілці. Якщо npm визначає будь-який із
них як передвипускну версію, OpenClaw зупиняється й просить вас явно підтвердити це за допомогою
тега передвипуску, наприклад `@beta`/`@rc`, або точної передвипускної версії.

**Що це робить:**

- Копіює набір хуків до `~/.openclaw/hooks/<id>`
- Увімкнює встановлені хуки в `hooks.internal.entries.*`
- Записує встановлення в `hooks.internal.installs`

**Параметри:**

- `-l, --link`: Зв’язати локальний каталог замість копіювання (додає його до `hooks.internal.load.extraDirs`)
- `--pin`: Записувати встановлення npm як точний визначений `name@version` у `hooks.internal.installs`

**Підтримувані архіви:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Приклади:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Набори хуків, зв’язані через link, розглядаються як managed-хуки з каталогу,
налаштованого оператором, а не як хуки workspace.

## Оновити набори хуків

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Оновіть відстежувані набори хуків на основі npm через уніфікований засіб оновлення plugins.

`openclaw hooks update` усе ще працює як псевдонім сумісності, але виводить
попередження про застарілість і перенаправляє на `openclaw plugins update`.

**Параметри:**

- `--all`: Оновити всі відстежувані набори хуків
- `--dry-run`: Показати, що зміниться, без запису

Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється,
OpenClaw виводить попередження й просить підтвердження перед продовженням. Використовуйте
глобальний `--yes`, щоб обійти запити в CI/неінтерактивних запусках.

## Вбудовані хуки

### session-memory

Зберігає контекст сесії в пам’ять, коли ви подаєте `/new` або `/reset`.

**Увімкнути:**

```bash
openclaw hooks enable session-memory
```

**Вивід:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Див.:** [документацію session-memory](/uk/automation/hooks#session-memory)

### bootstrap-extra-files

Додає додаткові bootstrap-файли (наприклад, локальні для монорепозиторію `AGENTS.md` / `TOOLS.md`) під час `agent:bootstrap`.

**Увімкнути:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Див.:** [документацію bootstrap-extra-files](/uk/automation/hooks#bootstrap-extra-files)

### command-logger

Журналює всі події команд у централізований файл аудиту.

**Увімкнути:**

```bash
openclaw hooks enable command-logger
```

**Вивід:** `~/.openclaw/logs/commands.log`

**Переглянути журнали:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Див.:** [документацію command-logger](/uk/automation/hooks#command-logger)

### boot-md

Запускає `BOOT.md` під час запуску gateway (після запуску каналів).

**Події**: `gateway:startup`

**Увімкнути**:

```bash
openclaw hooks enable boot-md
```

**Див.:** [документацію boot-md](/uk/automation/hooks#boot-md)
