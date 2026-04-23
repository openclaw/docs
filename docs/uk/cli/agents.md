---
read_when:
    - Ви хочете кілька ізольованих агентів (робочі простори + маршрутизація + автентифікація)
summary: Довідник CLI для `openclaw agents` (`list`/`add`/`delete`/`bindings`/`bind`/`unbind`/`set identity`)
title: Агенти
x-i18n:
    generated_at: "2026-04-23T20:45:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55fb9a79fade299556a785780619e0422ba3e4a24c0e6e287510948c15df83ec
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Керуйте ізольованими агентами (робочі простори + автентифікація + маршрутизація).

Пов’язане:

- Маршрутизація з кількома агентами: [Multi-Agent Routing](/uk/concepts/multi-agent)
- Робочий простір агента: [Agent workspace](/uk/concepts/agent-workspace)
- Конфігурація видимості Skills: [Skills config](/uk/tools/skills-config)

## Приклади

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Прив’язки маршрутизації

Використовуйте прив’язки маршрутизації, щоб закріпити вхідний трафік каналу за конкретним агентом.

Якщо ви також хочете різний видимий набір Skills для кожного агента, налаштуйте
`agents.defaults.skills` і `agents.list[].skills` у `openclaw.json`. Див.
[Skills config](/uk/tools/skills-config) і
[Configuration Reference](/uk/gateway/configuration-reference#agents-defaults-skills).

Список прив’язок:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Додавання прив’язок:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Якщо ви пропускаєте `accountId` (`--bind <channel>`), OpenClaw визначає його з типових значень каналу та хуків налаштування Plugin, коли вони доступні.

Якщо ви пропускаєте `--agent` для `bind` або `unbind`, OpenClaw використовує поточний типовий агент.

### Поведінка області дії прив’язки

- Прив’язка без `accountId` відповідає лише типовому обліковому запису каналу.
- `accountId: "*"` — це резервний варіант для всього каналу (усі облікові записи) і він менш специфічний, ніж явна прив’язка облікового запису.
- Якщо той самий агент уже має відповідну прив’язку каналу без `accountId`, а пізніше ви виконуєте прив’язку з явним або визначеним `accountId`, OpenClaw оновлює цю наявну прив’язку на місці замість додавання дубліката.

Приклад:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Після оновлення маршрутизація для цієї прив’язки обмежується `telegram:ops`. Якщо вам також потрібна маршрутизація для типового облікового запису, додайте її явно (наприклад, `--bind telegram:default`).

Видалення прив’язок:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` приймає або `--all`, або одне чи кілька значень `--bind`, але не обидва варіанти одночасно.

## Поверхня команд

### `agents`

Запуск `openclaw agents` без підкоманди еквівалентний `openclaw agents list`.

### `agents list`

Параметри:

- `--json`
- `--bindings`: включити повні правила маршрутизації, а не лише кількість/зведення для кожного агента

### `agents add [name]`

Параметри:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (можна повторювати)
- `--non-interactive`
- `--json`

Примітки:

- Передавання будь-яких явних прапорців add переводить команду в неінтерактивний режим.
- Неінтерактивний режим вимагає імені агента та `--workspace`.
- `main` зарезервовано й не може використовуватися як ідентифікатор нового агента.

### `agents bindings`

Параметри:

- `--agent <id>`
- `--json`

### `agents bind`

Параметри:

- `--agent <id>` (типово — поточний типовий агент)
- `--bind <channel[:accountId]>` (можна повторювати)
- `--json`

### `agents unbind`

Параметри:

- `--agent <id>` (типово — поточний типовий агент)
- `--bind <channel[:accountId]>` (можна повторювати)
- `--all`
- `--json`

### `agents delete <id>`

Параметри:

- `--force`
- `--json`

Примітки:

- `main` не можна видалити.
- Без `--force` потрібне інтерактивне підтвердження.
- Каталоги робочого простору, стану агента та транскриптів сесій переміщуються в Trash, а не видаляються безповоротно.

## Файли identity

Кожен робочий простір агента може містити `IDENTITY.md` у корені робочого простору:

- Приклад шляху: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` читає з кореня робочого простору (або з явно вказаного `--identity-file`)

Шляхи до аватарів визначаються відносно кореня робочого простору.

## Налаштування identity

`set-identity` записує поля в `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (шлях відносно робочого простору, URL `http(s)` або data URI)

Параметри:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Примітки:

- Для вибору цільового агента можна використовувати `--agent` або `--workspace`.
- Якщо ви покладаєтеся на `--workspace`, а кілька агентів використовують той самий робочий простір, команда завершується помилкою та просить передати `--agent`.
- Якщо явні поля identity не надано, команда читає дані identity з `IDENTITY.md`.

Завантаження з `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Явне перевизначення полів:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Приклад конфігурації:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```
