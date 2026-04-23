---
read_when:
    - Ви хочете кілька ізольованих агентів (робочі простори + маршрутизація + автентифікація)
summary: Довідка CLI для `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: агенти
x-i18n:
    generated_at: "2026-04-23T06:17:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Керуйте ізольованими агентами (робочі простори + автентифікація + маршрутизація).

Пов’язано:

- Маршрутизація між агентами: [Маршрутизація між агентами](/uk/concepts/multi-agent)
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
[Довідник із конфігурації](/uk/gateway/configuration-reference#agents-defaults-skills).

Перелічити прив’язки:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Додати прив’язки:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Якщо ви пропустите `accountId` (`--bind <channel>`), OpenClaw визначить його з типових значень каналу та хуків налаштування plugin, якщо вони доступні.

Якщо ви пропустите `--agent` для `bind` або `unbind`, OpenClaw націлиться на поточний типовий агент.

### Поведінка області дії прив’язки

- Прив’язка без `accountId` відповідає лише типовому обліковому запису каналу.
- `accountId: "*"` — це загальноканальний резервний варіант (усі облікові записи) і він менш специфічний, ніж явна прив’язка облікового запису.
- Якщо той самий агент уже має відповідну прив’язку каналу без `accountId`, а ви пізніше виконаєте прив’язку з явним або визначеним `accountId`, OpenClaw оновить наявну прив’язку на місці замість додавання дубліката.

Приклад:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Після оновлення маршрутизація для цієї прив’язки буде обмежена `telegram:ops`. Якщо вам також потрібна маршрутизація для типового облікового запису, додайте її явно (наприклад, `--bind telegram:default`).

Видалити прив’язки:

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

- Передавання будь-яких явних прапорців додавання перемикає команду в неінтерактивний режим.
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
- Каталоги робочого простору, стану агента та стенограм сесій переміщуються до Кошика, а не видаляються безповоротно.

## Файли identity

Кожен робочий простір агента може містити `IDENTITY.md` у корені робочого простору:

- Приклад шляху: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` читає з кореня робочого простору (або з явного `--identity-file`)

Шляхи до аватарів обчислюються відносно кореня робочого простору.

## Налаштування identity

`set-identity` записує поля до `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (відносний до робочого простору шлях, http(s) URL або data URI)

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
- Якщо ви покладаєтеся на `--workspace`, а кілька агентів використовують цей робочий простір, команда завершиться з помилкою й попросить передати `--agent`.
- Якщо явні поля identity не надано, команда зчитує дані identity з `IDENTITY.md`.

Завантажити з `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Явно перевизначити поля:

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
