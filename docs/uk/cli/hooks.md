---
read_when:
    - Ви хочете керувати хуками агента
    - Ви хочете перевірити доступність хуків або ввімкнути хуки робочого простору
summary: Довідка CLI для `openclaw hooks` (хуки агентів)
title: Хуки
x-i18n:
    generated_at: "2026-05-05T08:03:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e860d4a20a09526e804fa1aff8c983a75396fcd1e6e24f742252fdf1812f6b7
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Керуйте хуками агента (автоматизаціями на основі подій для команд на кшталт `/new`, `/reset` і запуску Gateway).

Запуск `openclaw hooks` без підкоманди еквівалентний `openclaw hooks list`.

Пов’язане:

- Хуки: [Хуки](/uk/automation/hooks)
- Plugin-хуки: [Plugin-хуки](/uk/plugins/hooks)

## Перелічити всі хуки

```bash
openclaw hooks list
```

Перелічує всі виявлені хуки з каталогів workspace, managed, extra та bundled.
Запуск Gateway не завантажує внутрішні обробники хуків, доки не налаштовано принаймні один внутрішній хук.

**Опції:**

- `--eligible`: Показати лише придатні хуки (вимоги виконано)
- `--json`: Вивести як JSON
- `-v, --verbose`: Показати докладну інформацію, зокрема відсутні вимоги

**Приклад виводу:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Приклад (докладний):**

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

- `<name>`: Назва хуку або ключ хуку (наприклад, `session-memory`)

**Опції:**

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

Показує підсумок стану придатності хуків (скільки готові, а скільки не готові).

**Опції:**

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

**Примітка:** Workspace-хуки вимкнені за замовчуванням, доки їх не ввімкнути тут або в конфігурації. Хуки, керовані plugins, показують `plugin:<id>` в `openclaw hooks list`, і їх не можна ввімкнути або вимкнути тут. Натомість увімкніть або вимкніть відповідний plugin.

**Аргументи:**

- `<name>`: Назва хуку (наприклад, `session-memory`)

**Приклад:**

```bash
openclaw hooks enable session-memory
```

**Вивід:**

```
✓ Enabled hook: 💾 session-memory
```

**Що це робить:**

- Перевіряє, чи хук існує та є придатним
- Оновлює `hooks.internal.entries.<name>.enabled = true` у вашій конфігурації
- Зберігає конфігурацію на диск

Якщо хук походить із `<workspace>/hooks/`, цей крок явної згоди потрібен, перш ніж
Gateway завантажить його.

**Після ввімкнення:**

- Перезапустіть gateway, щоб хуки перезавантажилися (перезапуск застосунку в рядку меню на macOS або перезапуск процесу gateway у dev).

## Вимкнути хук

```bash
openclaw hooks disable <name>
```

Вимкніть конкретний хук, оновивши свою конфігурацію.

**Аргументи:**

- `<name>`: Назва хуку (наприклад, `command-logger`)

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
- Хуки, керовані Plugin, не можна ввімкнути або вимкнути тут; натомість увімкніть або вимкніть відповідний plugin.

## Установити пакети хуків

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Установлюйте пакети хуків через уніфікований інсталятор plugins.

`openclaw hooks install` досі працює як псевдонім сумісності, але виводить
попередження про застарілість і переспрямовує до `openclaw plugins install`.

Специфікації npm є **лише registry** (назва пакета + необов’язкова **точна версія** або
**dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Установлення залежностей
виконується локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо у вашій
оболонці налаштовано глобальні параметри встановлення npm.

Прості специфікації та `@latest` залишаються на стабільному каналі. Якщо npm зіставляє будь-яку з
них із попереднім випуском, OpenClaw зупиняється й просить вас явно погодитися за допомогою
тегу попереднього випуску, наприклад `@beta`/`@rc`, або точної версії попереднього випуску.

**Що це робить:**

- Копіює пакет хуків у `~/.openclaw/hooks/<id>`
- Вмикає встановлені хуки в `hooks.internal.entries.*`
- Записує встановлення в `hooks.internal.installs`

**Опції:**

- `-l, --link`: Зв’язати локальний каталог замість копіювання (додає його до `hooks.internal.load.extraDirs`)
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

Зв’язані пакети хуків розглядаються як керовані хуки з каталогу, налаштованого оператором,
а не як workspace-хуки.

## Оновити пакети хуків

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Оновлюйте відстежувані npm-пакети хуків через уніфікований оновлювач plugins.

`openclaw hooks update` досі працює як псевдонім сумісності, але виводить
попередження про застарілість і переспрямовує до `openclaw plugins update`.

**Опції:**

- `--all`: Оновити всі відстежувані пакети хуків
- `--dry-run`: Показати, що змінилося б, без запису

Коли збережений хеш цілісності існує, а хеш отриманого артефакту змінюється,
OpenClaw виводить попередження й просить підтвердження перед продовженням. Використовуйте
глобальний `--yes`, щоб обійти запити в CI/неінтерактивних запусках.

## Вбудовані хуки

### session-memory

Зберігає контекст сесії в пам’ять, коли ви виконуєте `/new` або `/reset`.

**Увімкнути:**

```bash
openclaw hooks enable session-memory
```

**Вивід:** `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md` за замовчуванням. Установіть `hooks.internal.entries.session-memory.llmSlug: true` для slug-частин імен файлів, згенерованих моделлю.

**Див.:** [документацію session-memory](/uk/automation/hooks#session-memory)

### bootstrap-extra-files

Вставляє додаткові bootstrap-файли (наприклад, локальні для монорепозиторію `AGENTS.md` / `TOOLS.md`) під час `agent:bootstrap`.

**Увімкнути:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Див.:** [документацію bootstrap-extra-files](/uk/automation/hooks#bootstrap-extra-files)

### command-logger

Записує всі події команд у централізований файл аудиту.

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

Запускає `BOOT.md`, коли gateway запускається (після запуску каналів).

**Події**: `gateway:startup`

**Увімкнути**:

```bash
openclaw hooks enable boot-md
```

**Див.:** [документацію boot-md](/uk/automation/hooks#boot-md)

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Хуки автоматизації](/uk/automation/hooks)
