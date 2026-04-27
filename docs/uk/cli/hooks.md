---
read_when:
    - Ви хочете керувати хуками агента
    - Ви хочете перевірити доступність хуків або ввімкнути хуки робочого простору
summary: Довідник CLI для `openclaw hooks` (хуки агента)
title: Хуки
x-i18n:
    generated_at: "2026-04-27T09:29:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Керуйте хуками агента (автоматизаціями на основі подій для команд на кшталт `/new`, `/reset` і запуску Gateway).

Запуск `openclaw hooks` без підкоманди еквівалентний `openclaw hooks list`.

Пов’язано:

- Хуки: [Hooks](/uk/automation/hooks)
- Хуки Plugin: [Plugin hooks](/uk/plugins/hooks)

## Перелічити всі хуки

```bash
openclaw hooks list
```

Перелічує всі виявлені хуки з каталогів workspace, managed, extra та bundled.
Під час запуску Gateway внутрішні обробники хуків не завантажуються, доки не налаштовано принаймні один внутрішній хук.

**Параметри:**

- `--eligible`: Показувати лише придатні хуки (вимоги виконано)
- `--json`: Виводити як JSON
- `-v, --verbose`: Показувати докладну інформацію, включно з відсутніми вимогами

**Приклад виводу:**

```
Хуки (4/4 готові)

Готові:
  🚀 boot-md ✓ - Запускати BOOT.md під час запуску Gateway
  📎 bootstrap-extra-files ✓ - Вставляти додаткові файли bootstrap робочого простору під час bootstrap агента
  📝 command-logger ✓ - Журналювати всі події команд до централізованого файла аудиту
  💾 session-memory ✓ - Зберігати контекст сесії в пам’ять, коли видається команда /new або /reset
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

Показує докладну інформацію про конкретний хук.

**Аргументи:**

- `<name>`: Назва хука або ключ хука (наприклад, `session-memory`)

**Параметри:**

- `--json`: Виводити як JSON

**Приклад:**

```bash
openclaw hooks info session-memory
```

**Вивід:**

```
💾 session-memory ✓ Готово

Зберігати контекст сесії в пам’ять, коли видається команда /new або /reset

Деталі:
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

Показує зведення про статус придатності хуків (скільки готові, а скільки ні).

**Параметри:**

- `--json`: Виводити як JSON

**Приклад виводу:**

```
Статус хуків

Усього хуків: 4
Готові: 4
Не готові: 0
```

## Увімкнути хук

```bash
openclaw hooks enable <name>
```

Увімкнути конкретний хук, додавши його до вашої конфігурації (типово `~/.openclaw/openclaw.json`).

**Примітка:** Хуки робочого простору типово вимкнені, доки ви не ввімкнете їх тут або в конфігурації. Хуки, якими керують plugins, показують `plugin:<id>` у `openclaw hooks list` і не можуть бути увімкнені або вимкнені тут. Натомість увімкніть або вимкніть сам plugin.

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

- Перевіряє, чи існує хук і чи він придатний
- Оновлює `hooks.internal.entries.<name>.enabled = true` у вашій конфігурації
- Зберігає конфігурацію на диск

Якщо хук надійшов із `<workspace>/hooks/`, цей крок явного ввімкнення обов’язковий, перш ніж Gateway зможе його завантажити.

**Після ввімкнення:**

- Перезапустіть gateway, щоб хуки перезавантажилися (перезапуск програми в рядку меню на macOS або перезапуск вашого процесу gateway у режимі розробки).

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
- Хуки, якими керують plugins, не можна тут увімкнути або вимкнути; натомість увімкніть або вимкніть plugin-власник.

## Встановити пакети хуків

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Встановлюйте пакети хуків через уніфікований інсталятор plugins.

`openclaw hooks install` усе ще працює як сумісний псевдонім, але виводить попередження про застарілість і перенаправляє на `openclaw plugins install`.

Npm-специфікації є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконуються локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо у вашій оболонці є глобальні налаштування npm install.

Специфікації без суфікса та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-яку з них до prerelease-версії, OpenClaw зупиняється й просить вас явно підтвердити згоду через тег prerelease, такий як `@beta`/`@rc`, або через точну prerelease-версію.

**Що це робить:**

- Копіює пакет хуків до `~/.openclaw/hooks/<id>`
- Увімкнює встановлені хуки в `hooks.internal.entries.*`
- Записує встановлення в `hooks.internal.installs`

**Параметри:**

- `-l, --link`: Прив’язати локальний каталог замість копіювання (додає його до `hooks.internal.load.extraDirs`)
- `--pin`: Записувати npm-встановлення як точне розв’язане `name@version` у `hooks.internal.installs`

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

Прив’язані пакети хуків обробляються як managed-хуки з каталогу, налаштованого оператором, а не як хуки робочого простору.

## Оновити пакети хуків

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Оновлюйте відстежувані пакети хуків на основі npm через уніфікований засіб оновлення plugins.

`openclaw hooks update` усе ще працює як сумісний псевдонім, але виводить попередження про застарілість і перенаправляє на `openclaw plugins update`.

**Параметри:**

- `--all`: Оновити всі відстежувані пакети хуків
- `--dry-run`: Показати, що зміниться, без запису

Коли існує збережений хеш цілісності й хеш отриманого артефакту змінюється, OpenClaw виводить попередження й просить підтвердження перед продовженням. Використовуйте глобальний `--yes`, щоб обійти запити в CI/неінтерактивних запусках.

## Вбудовані хуки

### session-memory

Зберігає контекст сесії в пам’ять, коли ви видаєте `/new` або `/reset`.

**Увімкнення:**

```bash
openclaw hooks enable session-memory
```

**Вивід:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Дивіться:** [документацію session-memory](/uk/automation/hooks#session-memory)

### bootstrap-extra-files

Вставляє додаткові bootstrap-файли (наприклад, локальні для монорепозиторію `AGENTS.md` / `TOOLS.md`) під час `agent:bootstrap`.

**Увімкнення:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Дивіться:** [документацію bootstrap-extra-files](/uk/automation/hooks#bootstrap-extra-files)

### command-logger

Журналює всі події команд до централізованого файла аудиту.

**Увімкнення:**

```bash
openclaw hooks enable command-logger
```

**Вивід:** `~/.openclaw/logs/commands.log`

**Перегляд журналів:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Дивіться:** [документацію command-logger](/uk/automation/hooks#command-logger)

### boot-md

Запускає `BOOT.md`, коли запускається gateway (після запуску каналів).

**Події**: `gateway:startup`

**Увімкнення**:

```bash
openclaw hooks enable boot-md
```

**Дивіться:** [документацію boot-md](/uk/automation/hooks#boot-md)

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Хуки автоматизації](/uk/automation/hooks)
