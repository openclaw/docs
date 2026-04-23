---
read_when:
    - Ви хочете керувати хуками агента
    - Ви хочете перевірити доступність хуків або ввімкнути хуки workspace
summary: Довідник CLI для `openclaw hooks` (хуки агента)
title: Хуки
x-i18n:
    generated_at: "2026-04-23T20:47:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5846aaf8c9b966b92575a4c0c5268195ce4f8b29feb0846bfb121ed3bb8f69ef
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Керуйте хуками агента (автоматизаціями на основі подій для команд на кшталт `/new`, `/reset` і запуску gateway).

Запуск `openclaw hooks` без підкоманди еквівалентний `openclaw hooks list`.

Пов’язане:

- Хуки: [Хуки](/uk/automation/hooks)
- Plugin-хуки: [Plugin-хуки](/uk/plugins/architecture#provider-runtime-hooks)

## Перелічити всі хуки

```bash
openclaw hooks list
```

Перелічити всі виявлені хуки з каталогів workspace, managed, extra і bundled.
Під час запуску Gateway не завантажує обробники внутрішніх хуків, доки не налаштовано принаймні один внутрішній хук.

**Параметри:**

- `--eligible`: Показувати лише придатні хуки (вимоги виконано)
- `--json`: Виводити як JSON
- `-v, --verbose`: Показувати докладну інформацію, включно з відсутніми вимогами

**Приклад виводу:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
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

- `--json`: Виводити як JSON

**Приклад:**

```bash
openclaw hooks info session-memory
```

**Вивід:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Перевірити придатність хуків

```bash
openclaw hooks check
```

Показати зведення стану придатності хуків (скільки готові, а скільки — ні).

**Параметри:**

- `--json`: Виводити як JSON

**Приклад виводу:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Увімкнути хук

```bash
openclaw hooks enable <name>
```

Увімкнути конкретний хук, додавши його до вашої конфігурації (типово `~/.openclaw/openclaw.json`).

**Примітка:** Хуки workspace типово вимкнені, доки їх не ввімкнути тут або в конфігурації. Хуки, якими керують Plugin-и, показують `plugin:<id>` у `openclaw hooks list`, і тут їх не можна ввімкнути/вимкнути. Натомість увімкніть/вимкніть сам Plugin.

**Аргументи:**

- `<name>`: Назва хука (наприклад, `session-memory`)

**Приклад:**

```bash
openclaw hooks enable session-memory
```

**Вивід:**

```
✓ Enabled hook: 💾 session-memory
```

**Що це робить:**

- Перевіряє, чи існує хук і чи він придатний
- Оновлює `hooks.internal.entries.<name>.enabled = true` у вашій конфігурації
- Зберігає конфігурацію на диск

Якщо хук походить із `<workspace>/hooks/`, цей крок підтвердження потрібен, перш ніж
Gateway його завантажить.

**Після ввімкнення:**

- Перезапустіть gateway, щоб хуки перезавантажилися (перезапуск застосунку в menu bar на macOS або перезапуск процесу gateway у dev).

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
⏸ Disabled hook: 📝 command-logger
```

**Після вимкнення:**

- Перезапустіть gateway, щоб хуки перезавантажилися

## Примітки

- `openclaw hooks list --json`, `info --json` і `check --json` записують структурований JSON безпосередньо в stdout.
- Хуки, якими керують Plugin-и, тут не можна ввімкнути або вимкнути; натомість увімкніть або вимкніть Plugin-власник.

## Встановити пакети хуків

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Встановлюйте пакети хуків через уніфікований інсталятор Plugin-ів.

`openclaw hooks install` усе ще працює як псевдонім сумісності, але виводить
попередження про застарілість і перенаправляє на `openclaw plugins install`.

Npm-специфікації є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або
**dist-tag**). Специфікації Git/URL/файлів і діапазони semver відхиляються. Встановлення
залежностей виконуються з `--ignore-scripts` задля безпеки.

Звичайні специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-яку з
них до prerelease, OpenClaw зупиняється і просить вас явно погодитися за допомогою
prerelease-тега, такого як `@beta`/`@rc`, або точної prerelease-версії.

**Що це робить:**

- Копіює пакет хуків до `~/.openclaw/hooks/<id>`
- Увімкнює встановлені хуки в `hooks.internal.entries.*`
- Записує встановлення в `hooks.internal.installs`

**Параметри:**

- `-l, --link`: Прив’язати локальний каталог замість копіювання (додає його до `hooks.internal.load.extraDirs`)
- `--pin`: Записувати npm-встановлення як точний розв’язаний `name@version` у `hooks.internal.installs`

**Підтримувані архіви:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Приклади:**

```bash
# Локальний каталог
openclaw plugins install ./my-hook-pack

# Локальний архів
openclaw plugins install ./my-hook-pack.zip

# NPM-пакет
openclaw plugins install @openclaw/my-hook-pack

# Прив’язати локальний каталог без копіювання
openclaw plugins install -l ./my-hook-pack
```

Прив’язані пакети хуків розглядаються як managed-хуки з каталогу,
налаштованого оператором, а не як хуки workspace.

## Оновити пакети хуків

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Оновлюйте відстежувані npm-пакети хуків через уніфікований засіб оновлення Plugin-ів.

`openclaw hooks update` усе ще працює як псевдонім сумісності, але виводить
попередження про застарілість і перенаправляє на `openclaw plugins update`.

**Параметри:**

- `--all`: Оновити всі відстежувані пакети хуків
- `--dry-run`: Показати, що зміниться, без запису

Коли існує збережений хеш цілісності й хеш отриманого артефакта змінюється,
OpenClaw виводить попередження і просить підтвердження перед продовженням. Використовуйте
глобальний `--yes`, щоб обходити запити в CI/неінтерактивних запусках.

## Вбудовані хуки

### session-memory

Зберігає контекст сесії в memory, коли ви виконуєте `/new` або `/reset`.

**Увімкнення:**

```bash
openclaw hooks enable session-memory
```

**Вивід:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Див.:** [документацію session-memory](/uk/automation/hooks#session-memory)

### bootstrap-extra-files

Впроваджує додаткові bootstrap-файли (наприклад, локальні для monorepo `AGENTS.md` / `TOOLS.md`) під час `agent:bootstrap`.

**Увімкнення:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Див.:** [документацію bootstrap-extra-files](/uk/automation/hooks#bootstrap-extra-files)

### command-logger

Логує всі події команд у централізований файл аудиту.

**Увімкнення:**

```bash
openclaw hooks enable command-logger
```

**Вивід:** `~/.openclaw/logs/commands.log`

**Перегляд логів:**

```bash
# Останні команди
tail -n 20 ~/.openclaw/logs/commands.log

# Гарно відформатувати
cat ~/.openclaw/logs/commands.log | jq .

# Відфільтрувати за дією
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Див.:** [документацію command-logger](/uk/automation/hooks#command-logger)

### boot-md

Виконує `BOOT.md` під час запуску gateway (після запуску каналів).

**Події**: `gateway:startup`

**Увімкнення**:

```bash
openclaw hooks enable boot-md
```

**Див.:** [документацію boot-md](/uk/automation/hooks#boot-md)
