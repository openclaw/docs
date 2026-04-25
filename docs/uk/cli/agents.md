---
read_when:
    - Вам потрібні кілька ізольованих агентів (робочі простори + маршрутизація + автентифікація)
summary: Довідник CLI для `openclaw agents` (`list`/`add`/`delete`/`bindings`/`bind`/`unbind`/`set identity`)
title: Агенти
x-i18n:
    generated_at: "2026-04-25T01:26:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd0698f0821f9444e84cd82fe78ee46071447fb4c3cada6d1a98b5130147691
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Керуйте ізольованими агентами (робочі простори + автентифікація + маршрутизація).

Пов’язано:

- Маршрутизація з кількома агентами: [Маршрутизація з кількома агентами](/uk/concepts/multi-agent)
- Робочий простір агента: [Робочий простір агента](/uk/concepts/agent-workspace)
- Конфігурація видимості Skills: [Конфігурація Skills](/uk/tools/skills-config)

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

Якщо ви також хочете різну видимість Skills для кожного агента, налаштуйте
`agents.defaults.skills` і `agents.list[].skills` у `openclaw.json`. Див.
[Конфігурація Skills](/uk/tools/skills-config) і
[Довідник із конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

Перегляд прив’язок:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Додавання прив’язок:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Якщо ви не вкажете `accountId` (`--bind <channel>`), OpenClaw визначить його з типових значень каналу та хуків налаштування Plugin, якщо вони доступні.

Якщо ви не вкажете `--agent` для `bind` або `unbind`, OpenClaw вибере поточного типового агента.

### Поведінка області дії прив’язки

- Прив’язка без `accountId` відповідає лише типовому обліковому запису каналу.
- `accountId: "*"` є запасним варіантом для всього каналу (усі облікові записи) і має нижчу специфічність, ніж явна прив’язка облікового запису.
- Якщо той самий агент уже має відповідну прив’язку каналу без `accountId`, а пізніше ви додаєте прив’язку з явним або визначеним `accountId`, OpenClaw оновлює цю наявну прив’язку на місці замість додавання дубліката.

Приклад:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Після оновлення маршрутизація для цієї прив’язки буде обмежена `telegram:ops`. Якщо ви також хочете маршрутизацію для типового облікового запису, додайте її явно (наприклад, `--bind telegram:default`).

Видалення прив’язок:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` приймає або `--all`, або одне чи більше значень `--bind`, але не обидва варіанти одночасно.

## Поверхня команд

### `agents`

Запуск `openclaw agents` без підкоманди еквівалентний `openclaw agents list`.

### `agents list`

Параметри:

- `--json`
- `--bindings`: включити повні правила маршрутизації, а не лише кількість/зведення по агентах

### `agents add [name]`

Параметри:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (можна повторювати)
- `--non-interactive`
- `--json`

Примітки:

- Передавання будь-яких явних прапорців для додавання перемикає команду в неінтерактивний режим.
- Неінтерактивний режим вимагає імені агента та `--workspace`.
- `main` зарезервовано, і його не можна використовувати як новий ідентифікатор агента.

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
- Робочий простір, стан агента та каталоги стенограм сесій переміщуються в Кошик, а не видаляються безповоротно.
- Якщо робочий простір іншого агента має той самий шлях, перебуває всередині цього робочого простору або містить цей робочий простір,
  робочий простір зберігається, а `--json` повідомляє `workspaceRetained`,
  `workspaceRetainedReason` і `workspaceSharedWith`.

## Файли ідентичності

Кожен робочий простір агента може містити `IDENTITY.md` у корені робочого простору:

- Приклад шляху: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` читає з кореня робочого простору (або з явно вказаного `--identity-file`)

Шляхи до аватарів визначаються відносно кореня робочого простору.

## Установлення ідентичності

`set-identity` записує поля в `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (шлях відносно робочого простору, URL `http(s)` або URI даних)

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
- Якщо ви покладаєтеся на `--workspace`, а кілька агентів використовують один і той самий робочий простір, команда завершиться помилкою й попросить вас передати `--agent`.
- Якщо не вказано явних полів ідентичності, команда читає дані ідентичності з `IDENTITY.md`.

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

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Маршрутизація з кількома агентами](/uk/concepts/multi-agent)
- [Робочий простір агента](/uk/concepts/agent-workspace)
