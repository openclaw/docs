---
read_when:
    - Ви хочете керувати хуками агента
    - Ви хочете перевірити доступність хуків або ввімкнути хуки робочого простору
summary: Довідник CLI для `openclaw hooks` (хуки агента)
title: Хуки
x-i18n:
    generated_at: "2026-04-24T03:06:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6df7ddd75441983f7cd03b4408f91cb1a883243b9f19d2528f05dfc51b2891e8
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Керуйте хуками агента (автоматизаціями на основі подій для команд на кшталт `/new`, `/reset` і запуску Gateway).

Запуск `openclaw hooks` без підкоманди еквівалентний `openclaw hooks list`.

Пов’язане:

- Хуки: [Хуки](/uk/automation/hooks)
- Хуки плагінів: [Хуки Plugin](/uk/plugins/architecture-internals#provider-runtime-hooks)

## Список усіх хуків

```bash
openclaw hooks list
```

Показує список усіх виявлених хуків із каталогів workspace, керованих, додаткових і вбудованих каталогів.
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

## Отримання інформації про хук

```bash
openclaw hooks info <name>
```

Показує докладну інформацію про конкретний хук.

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

## Перевірка придатності хуків

```bash
openclaw hooks check
```

Показує зведення стану придатності хуків (скільки готові, а скільки — ні).

**Параметри:**

- `--json`: Виводити у форматі JSON

**Приклад виводу:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Увімкнення хука

```bash
openclaw hooks enable <name>
```

Увімкніть конкретний хук, додавши його до вашої конфігурації (типово `~/.openclaw/openclaw.json`).

**Примітка:** Хуки workspace типово вимкнені, доки їх не буде ввімкнено тут або в конфігурації. Хуки, якими керують плагіни, показують `plugin:<id>` у `openclaw hooks list` і не можуть бути увімкнені/вимкнені тут. Натомість увімкніть або вимкніть сам Plugin.

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

Якщо хук походить із `<workspace>/hooks/`, цей крок явного ввімкнення обов’язковий, перш ніж
Gateway зможе його завантажити.

**Після ввімкнення:**

- Перезапустіть gateway, щоб хуки перезавантажилися (перезапуск застосунку в рядку меню на macOS або перезапуск вашого процесу gateway у dev).

## Вимкнення хука

```bash
openclaw hooks disable <name>
```

Вимкніть конкретний хук, оновивши вашу конфігурацію.

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
- Хуки, якими керують плагіни, не можна тут увімкнути або вимкнути; натомість увімкніть або вимкніть Plugin-власник.

## Встановлення пакунків хуків

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Встановлюйте пакунки хуків через уніфікований інсталятор плагінів.

`openclaw hooks install` усе ще працює як сумісний псевдонім, але виводить
попередження про застарілість і перенаправляє до `openclaw plugins install`.

Специфікації npm є **лише для реєстру** (назва пакунка + необов’язкова **точна версія** або
**dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконується з `--ignore-scripts` для безпеки.

Базові специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-який із
них у пререліз, OpenClaw зупиняється й просить вас явно підтвердити згоду, використавши
тег пререлізу, наприклад `@beta`/`@rc`, або точну версію пререлізу.

**Що це робить:**

- Копіює пакунок хуків у `~/.openclaw/hooks/<id>`
- Увімкнює встановлені хуки в `hooks.internal.entries.*`
- Записує встановлення в `hooks.internal.installs`

**Параметри:**

- `-l, --link`: Прив’язати локальний каталог замість копіювання (додає його до `hooks.internal.load.extraDirs`)
- `--pin`: Записувати встановлення npm як точні розв’язані `name@version` у `hooks.internal.installs`

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

Прив’язані пакунки хуків розглядаються як керовані хуки з каталогу,
налаштованого оператором, а не як хуки workspace.

## Оновлення пакунків хуків

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Оновлюйте відстежувані пакунки хуків на основі npm через уніфікований засіб оновлення плагінів.

`openclaw hooks update` усе ще працює як сумісний псевдонім, але виводить
попередження про застарілість і перенаправляє до `openclaw plugins update`.

**Параметри:**

- `--all`: Оновити всі відстежувані пакунки хуків
- `--dry-run`: Показати, що зміниться, без запису

Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється,
OpenClaw виводить попередження і просить підтвердження перед продовженням. Використовуйте
глобальний `--yes`, щоб обійти запити в CI/неінтерактивних запусках.

## Вбудовані хуки

### session-memory

Зберігає контекст сесії в пам’ять, коли ви виконуєте `/new` або `/reset`.

**Увімкнення:**

```bash
openclaw hooks enable session-memory
```

**Вивід:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Див.:** [документацію session-memory](/uk/automation/hooks#session-memory)

### bootstrap-extra-files

Впроваджує додаткові файли bootstrap (наприклад, локальні для монорепозиторію `AGENTS.md` / `TOOLS.md`) під час `agent:bootstrap`.

**Увімкнення:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Див.:** [документацію bootstrap-extra-files](/uk/automation/hooks#bootstrap-extra-files)

### command-logger

Журналює всі події команд у централізований файл аудиту.

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

Запускає `BOOT.md`, коли запускається gateway (після запуску каналів).

**Події**: `gateway:startup`

**Увімкнення**:

```bash
openclaw hooks enable boot-md
```

**Див.:** [документацію boot-md](/uk/automation/hooks#boot-md)
