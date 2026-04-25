---
read_when:
    - Ви хочете керувати хуками агента
    - Ви хочете перевірити доступність хуків або увімкнути хуки робочого простору
summary: Довідка CLI для `openclaw hooks` (хуки агента)
title: Хуки
x-i18n:
    generated_at: "2026-04-25T22:08:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 874c3c7e7b603066209857e8b8b39bbe23eb8d1eda148025c74907c05bacd8f2
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Керуйте хуками агента (автоматизаціями на основі подій для команд на кшталт `/new`, `/reset` і запуску Gateway).

Запуск `openclaw hooks` без підкоманди еквівалентний `openclaw hooks list`.

Пов’язано:

- Хуки: [Хуки](/uk/automation/hooks)
- Хуки Plugin: [Хуки Plugin](/uk/plugins/hooks)

## Показати всі хуки

```bash
openclaw hooks list
```

Показати всі виявлені хуки з каталогів workspace, managed, extra та bundled.
Під час запуску Gateway внутрішні обробники хуків не завантажуються, доки не налаштовано принаймні один внутрішній хук.

**Параметри:**

- `--eligible`: Показувати лише придатні хуки (вимоги виконано)
- `--json`: Виводити у форматі JSON
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

**Приклад (докладно):**

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

- `--json`: Виводити у форматі JSON

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

Показати зведення стану придатності хуків (скільки готові, а скільки ні).

**Параметри:**

- `--json`: Виводити у форматі JSON

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

Увімкнути конкретний хук, додавши його до вашої конфігурації (`~/.openclaw/openclaw.json` за замовчуванням).

**Примітка:** Хуки workspace за замовчуванням вимкнені, доки їх не буде увімкнено тут або в конфігурації. Хуки, якими керують Plugins, у `openclaw hooks list` показують `plugin:<id>`, і їх не можна вмикати/вимикати тут. Замість цього увімкніть/вимкніть сам Plugin.

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

- Перевіряє, чи існує хук і чи є він придатним
- Оновлює `hooks.internal.entries.<name>.enabled = true` у вашій конфігурації
- Зберігає конфігурацію на диск

Якщо хук походить із `<workspace>/hooks/`, цей крок явного ввімкнення є обов’язковим, перш ніж Gateway зможе його завантажити.

**Після ввімкнення:**

- Перезапустіть gateway, щоб хуки перезавантажилися (перезапуск застосунку в рядку меню на macOS або перезапуск вашого gateway-процесу в dev).

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
- Хуки, якими керують Plugins, не можна вмикати або вимикати тут; натомість увімкніть або вимкніть Plugin-власник.

## Встановити пакети хуків

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Встановлюйте пакети хуків через уніфікований інсталятор Plugins.

`openclaw hooks install` усе ще працює як сумісний псевдонім, але виводить попередження про застарілість і перенаправляє до `openclaw plugins install`.

Специфікації npm — **лише для реєстру** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконується локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо у вашій оболонці є глобальні налаштування встановлення npm.

Специфікації без суфікса та `@latest` залишаються на стабільному каналі. Якщо npm розв’язує будь-який із цих варіантів до prerelease-версії, OpenClaw зупиняється й просить вас явно погодитися через prerelease-тег, як-от `@beta`/`@rc`, або точну prerelease-версію.

**Що це робить:**

- Копіює пакет хуків до `~/.openclaw/hooks/<id>`
- Увімкнює встановлені хуки в `hooks.internal.entries.*`
- Записує встановлення в `hooks.internal.installs`

**Параметри:**

- `-l, --link`: Прив’язати локальний каталог замість копіювання (додає його до `hooks.internal.load.extraDirs`)
- `--pin`: Записувати встановлення npm як точне розв’язане `name@version` у `hooks.internal.installs`

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

Прив’язані пакети хуків розглядаються як managed-хуки з каталогу, налаштованого оператором, а не як хуки workspace.

## Оновити пакети хуків

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Оновлюйте відстежувані пакети хуків на основі npm через уніфікований засіб оновлення Plugins.

`openclaw hooks update` усе ще працює як сумісний псевдонім, але виводить попередження про застарілість і перенаправляє до `openclaw plugins update`.

**Параметри:**

- `--all`: Оновити всі відстежувані пакети хуків
- `--dry-run`: Показати, що зміниться, без запису

Коли існує збережений хеш цілісності й хеш отриманого артефакту змінюється, OpenClaw виводить попередження та просить підтвердження перед продовженням. Використовуйте глобальний `--yes`, щоб обійти запити в CI/неінтерактивних запусках.

## Вбудовані хуки

### session-memory

Зберігає контекст сесії в пам’ять, коли ви використовуєте `/new` або `/reset`.

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

Записує всі події команд до централізованого файла аудиту.

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

**Див.:** [документацію command-logger](/uk/automation/hooks#command-logger)

### boot-md

Запускає `BOOT.md`, коли запускається Gateway (після запуску каналів).

**Події**: `gateway:startup`

**Увімкнення**:

```bash
openclaw hooks enable boot-md
```

**Див.:** [документацію boot-md](/uk/automation/hooks#boot-md)

## Пов’язано

- [Довідка CLI](/uk/cli)
- [Хуки автоматизації](/uk/automation/hooks)
