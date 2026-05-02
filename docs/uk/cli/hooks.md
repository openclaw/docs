---
read_when:
    - Ви хочете керувати хуками агентів
    - Ви хочете перевірити доступність хуків або ввімкнути хуки робочої області
summary: Довідник CLI для `openclaw hooks` (агентські хуки)
title: Хуки
x-i18n:
    generated_at: "2026-05-02T19:10:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b02c176b4a310adba3fa1fde3758f6c8a19d454aeec58e919458b3f1a66c87d
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Керуйте хуками агента (автоматизаціями, керованими подіями, для команд на кшталт `/new`, `/reset` і запуску Gateway).

Запуск `openclaw hooks` без підкоманди еквівалентний `openclaw hooks list`.

Пов’язане:

- Хуки: [Хуки](/uk/automation/hooks)
- Хуки Plugin: [Хуки Plugin](/uk/plugins/hooks)

## Перелічити всі хуки

```bash
openclaw hooks list
```

Перелічує всі виявлені хуки з робочого простору, керованих, додаткових і вбудованих каталогів.
Під час запуску Gateway внутрішні обробники хуків не завантажуються, доки не налаштовано принаймні один внутрішній хук.

**Параметри:**

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

- `<name>`: Назва хуку або ключ хуку (наприклад, `session-memory`)

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

Показує підсумок статусу придатності хуків (скільки готові, а скільки ні).

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

Увімкніть конкретний хук, додавши його до своєї конфігурації (типово `~/.openclaw/openclaw.json`).

**Примітка:** Хуки робочого простору вимкнено за замовчуванням, доки їх не буде ввімкнено тут або в конфігурації. Хуки, керовані Plugin, показують `plugin:<id>` у `openclaw hooks list`, і їх не можна ввімкнути або вимкнути тут. Натомість увімкніть або вимкніть Plugin.

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

- Перевіряє, чи існує хук і чи він придатний
- Оновлює `hooks.internal.entries.<name>.enabled = true` у вашій конфігурації
- Зберігає конфігурацію на диск

Якщо хук походить із `<workspace>/hooks/`, цей крок явної згоди потрібен до того, як
Gateway завантажить його.

**Після ввімкнення:**

- Перезапустіть Gateway, щоб хуки перезавантажилися (перезапуск програми в рядку меню на macOS або перезапуск процесу Gateway у розробці).

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

- Перезапустіть Gateway, щоб хуки перезавантажилися

## Примітки

- `openclaw hooks list --json`, `info --json` і `check --json` записують структурований JSON безпосередньо в stdout.
- Хуки, керовані Plugin, не можна ввімкнути або вимкнути тут; натомість увімкніть або вимкніть Plugin, якому вони належать.

## Установити пакети хуків

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Установлюйте пакети хуків через уніфікований інсталятор plugins.

`openclaw hooks install` досі працює як псевдонім сумісності, але виводить
попередження про застарілість і передає виконання до `openclaw plugins install`.

Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або
**dist-tag**). Специфікації Git/URL/файлів і діапазони semver відхиляються. Установлення залежностей
виконується локально для проєкту з `--ignore-scripts` задля безпеки, навіть коли ваша
оболонка має глобальні налаштування npm install.

Прості специфікації та `@latest` залишаються на стабільному каналі. Якщо npm розв’язує будь-що з
цього до попереднього випуску, OpenClaw зупиняється й просить вас явно погодитися за допомогою
тегу попереднього випуску, як-от `@beta`/`@rc`, або точної версії попереднього випуску.

**Що це робить:**

- Копіює пакет хуків у `~/.openclaw/hooks/<id>`
- Увімкнює встановлені хуки в `hooks.internal.entries.*`
- Записує встановлення в `hooks.internal.installs`

**Параметри:**

- `-l, --link`: Зв’язати локальний каталог замість копіювання (додає його до `hooks.internal.load.extraDirs`)
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

Зв’язані пакети хуків розглядаються як керовані хуки з каталогу, налаштованого оператором,
а не як хуки робочого простору.

## Оновити пакети хуків

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Оновлюйте відстежувані пакети хуків на основі npm через уніфікований оновлювач plugins.

`openclaw hooks update` досі працює як псевдонім сумісності, але виводить
попередження про застарілість і передає виконання до `openclaw plugins update`.

**Параметри:**

- `--all`: Оновити всі відстежувані пакети хуків
- `--dry-run`: Показати, що зміниться, без запису

Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється,
OpenClaw виводить попередження й просить підтвердження перед продовженням. Використовуйте
глобальний `--yes`, щоб обійти запити в CI/неінтерактивних запусках.

## Вбудовані хуки

### session-memory

Зберігає контекст сеансу в пам’ять, коли ви видаєте `/new` або `/reset`.

**Увімкнути:**

```bash
openclaw hooks enable session-memory
```

**Вивід:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Див.:** [документація session-memory](/uk/automation/hooks#session-memory)

### bootstrap-extra-files

Вставляє додаткові файли bootstrap (наприклад, локальні для монорепозиторію `AGENTS.md` / `TOOLS.md`) під час `agent:bootstrap`.

**Увімкнути:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Див.:** [документація bootstrap-extra-files](/uk/automation/hooks#bootstrap-extra-files)

### command-logger

Записує всі події команд до централізованого файлу аудиту.

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

**Див.:** [документація command-logger](/uk/automation/hooks#command-logger)

### boot-md

Запускає `BOOT.md`, коли Gateway запускається (після запуску каналів).

**Події**: `gateway:startup`

**Увімкнути**:

```bash
openclaw hooks enable boot-md
```

**Див.:** [документація boot-md](/uk/automation/hooks#boot-md)

## Пов’язане

- [довідник CLI](/uk/cli)
- [хуки автоматизації](/uk/automation/hooks)
