---
read_when:
    - Ви хочете керувати хуками агентів
    - Ви хочете перевірити доступність хуків або ввімкнути хуки робочого простору
summary: Довідник CLI для `openclaw hooks` (хуки агентів)
title: Хуки
x-i18n:
    generated_at: "2026-05-06T16:00:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56dd1ef82458dde3280e2cdfb4f3835211726517416e90625d3272d128eb9e0e
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Керуйте хуками агента (подієво-керованими автоматизаціями для команд на кшталт `/new`, `/reset` і запуску Gateway).

Запуск `openclaw hooks` без підкоманди еквівалентний `openclaw hooks list`.

Пов’язане:

- Хуки: [Хуки](/uk/automation/hooks)
- Plugin-хуки: [Plugin-хуки](/uk/plugins/hooks)

## Перелічити всі хуки

```bash
openclaw hooks list
```

Перелічує всі виявлені хуки з робочої області, керованих, додаткових і вбудованих каталогів.
Під час запуску Gateway не завантажує внутрішні обробники хуків, доки не налаштовано принаймні один внутрішній хук.

**Параметри:**

- `--eligible`: Показати лише придатні хуки (вимоги виконано)
- `--json`: Вивести як JSON
- `-v, --verbose`: Показати докладну інформацію, включно з відсутніми вимогами

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

Показує докладну інформацію про конкретний хук.

**Аргументи:**

- `<name>`: Назва хука або ключ хука (наприклад, `session-memory`)

**Параметри:**

- `--json`: Вивести як JSON

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

Показує зведення статусу придатності хуків (скільки готові, а скільки ні).

**Параметри:**

- `--json`: Вивести як JSON

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

Увімкніть конкретний хук, додавши його до своєї конфігурації (`~/.openclaw/openclaw.json` за замовчуванням).

**Примітка:** Хуки робочої області вимкнені за замовчуванням, доки їх не ввімкнено тут або в конфігурації. Хуки, керовані plugins, показують `plugin:<id>` у `openclaw hooks list` і не можуть бути ввімкнені або вимкнені тут. Натомість увімкніть або вимкніть Plugin.

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

Якщо хук походить із `<workspace>/hooks/`, цей крок явного ввімкнення потрібен до того, як
Gateway завантажить його.

**Після ввімкнення:**

- Перезапустіть Gateway, щоб хуки перезавантажилися (перезапуск застосунку в рядку меню на macOS або перезапуск процесу Gateway у dev).

## Вимкнути хук

```bash
openclaw hooks disable <name>
```

Вимкніть конкретний хук, оновивши свою конфігурацію.

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

- Перезапустіть Gateway, щоб хуки перезавантажилися

## Примітки

- `openclaw hooks list --json`, `info --json` і `check --json` записують структурований JSON безпосередньо в stdout.
- Хуки, керовані Plugin, не можна ввімкнути або вимкнути тут; натомість увімкніть або вимкніть Plugin-власник.

## Установити пакети хуків

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Установлюйте пакети хуків через уніфікований інсталятор plugins.

`openclaw hooks install` все ще працює як псевдонім сумісності, але друкує
попередження про застарівання та переспрямовує до `openclaw plugins install`.

Специфікації npm є **лише registry** (назва пакета + необов’язкова **точна версія** або
**dist-tag**). Специфікації Git/URL/файлів і діапазони semver відхиляються. Установлення залежностей
виконується локально для проєкту з `--ignore-scripts` для безпеки, навіть якщо ваша
оболонка має глобальні налаштування npm install.

Голі специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-яку з
них у попередній випуск, OpenClaw зупиняється і просить вас явно погодитися за допомогою
тега попереднього випуску, такого як `@beta`/`@rc`, або точної версії попереднього випуску.

**Що це робить:**

- Копіює пакет хуків у `~/.openclaw/hooks/<id>`
- Увімкнює встановлені хуки в `hooks.internal.entries.*`
- Записує встановлення в `hooks.internal.installs`

**Параметри:**

- `-l, --link`: Пов’язати локальний каталог замість копіювання (додає його до `hooks.internal.load.extraDirs`)
- `--pin`: Записувати встановлення npm як точно розв’язане `name@version` у `hooks.internal.installs`

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

Пов’язані пакети хуків обробляються як керовані хуки з каталогу,
налаштованого оператором, а не як хуки робочої області.

## Оновити пакети хуків

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Оновлюйте відстежувані пакети хуків на основі npm через уніфікований засіб оновлення plugins.

`openclaw hooks update` все ще працює як псевдонім сумісності, але друкує
попередження про застарівання та переспрямовує до `openclaw plugins update`.

**Параметри:**

- `--all`: Оновити всі відстежувані пакети хуків
- `--dry-run`: Показати, що зміниться, без запису

Коли збережений хеш цілісності існує, а хеш отриманого артефакту змінюється,
OpenClaw друкує попередження та просить підтвердження перед продовженням. Використовуйте
глобальний `--yes`, щоб обійти запити в CI/неінтерактивних запусках.

## Вбудовані хуки

### session-memory

Зберігає контекст сеансу в пам’ять, коли ви виконуєте `/new` або `/reset`.

**Увімкнення:**

```bash
openclaw hooks enable session-memory
```

**Вивід:** `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md` за замовчуванням. Установіть `hooks.internal.entries.session-memory.llmSlug: true` для згенерованих моделлю слагів імен файлів.

**Див.:** [документацію session-memory](/uk/automation/hooks#session-memory)

### bootstrap-extra-files

Вставляє додаткові bootstrap-файли (наприклад, локальні для монорепозиторію `AGENTS.md` / `TOOLS.md`) під час `agent:bootstrap`.

**Увімкнення:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Див.:** [документацію bootstrap-extra-files](/uk/automation/hooks#bootstrap-extra-files)

### command-logger

Записує всі події команд до централізованого файлу аудиту.

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

Запускає `BOOT.md`, коли Gateway запускається (після запуску каналів).

**Події**: `gateway:startup`

**Увімкнення**:

```bash
openclaw hooks enable boot-md
```

**Див.:** [документацію boot-md](/uk/automation/hooks#boot-md)

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Хуки автоматизації](/uk/automation/hooks)
