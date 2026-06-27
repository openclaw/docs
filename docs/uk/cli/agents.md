---
read_when:
    - Вам потрібно кілька ізольованих агентів (робочі простори + маршрутизація + автентифікація)
summary: Довідник CLI для `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Агенти
x-i18n:
    generated_at: "2026-06-27T17:18:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Керуйте ізольованими агентами (робочі простори + автентифікація + маршрутизація).

Пов’язано:

- [Маршрутизація з кількома агентами](/uk/concepts/multi-agent)
- [Робочий простір агента](/uk/concepts/agent-workspace)
- [Конфігурація Skills](/uk/tools/skills-config): конфігурація видимості навичок.

## Приклади

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Прив’язки маршрутизації

Використовуйте прив’язки маршрутизації, щоб закріпити вхідний трафік каналу за певним агентом.

Якщо вам також потрібні різні видимі Skills для кожного агента, налаштуйте `agents.defaults.skills` і `agents.list[].skills` в `openclaw.json`. Див. [Конфігурація Skills](/uk/tools/skills-config) і [Довідник конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

Список прив’язок:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Додати прив’язки:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Ви також можете додавати прив’язки під час створення агента:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Якщо пропустити `accountId` (`--bind <channel>`), OpenClaw визначає його з хуків налаштування Plugin, примусової прив’язки облікового запису або налаштованої кількості облікових записів каналу.

Якщо пропустити `--agent` для `bind` або `unbind`, OpenClaw націлюється на поточного агента за замовчуванням.

### Формат `--bind`

| Формат                       | Значення                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Відповідність усім обліковим записам у каналі.                                                    |
| `--bind <channel>:<account>` | Відповідність одному обліковому запису.                                                           |
| `--bind <channel>`           | Відповідність лише обліковому запису за замовчуванням, якщо CLI не може безпечно визначити область облікового запису, специфічну для Plugin. |

### Поведінка області прив’язки

- Збережена прив’язка без `accountId` відповідає лише обліковому запису каналу за замовчуванням.
- `accountId: "*"` є резервним варіантом для всього каналу (усі облікові записи) і менш специфічний, ніж явна прив’язка облікового запису.
- Якщо той самий агент уже має відповідну прив’язку каналу без `accountId`, а пізніше ви прив’язуєте з явним або визначеним `accountId`, OpenClaw оновлює цю наявну прив’язку на місці замість додавання дубліката.

Приклади:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

Після оновлення маршрутизація для цієї прив’язки обмежена `telegram:alerts`. Якщо вам також потрібна маршрутизація для облікового запису за замовчуванням, додайте її явно (наприклад, `--bind telegram:default`).

Видалити прив’язки:

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
- `--bindings`: включати повні правила маршрутизації, а не лише кількості/зведення для кожного агента

### `agents add [name]`

Параметри:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (можна повторювати)
- `--non-interactive`
- `--json`

Примітки:

- Передавання будь-яких явних прапорців додавання перемикає команду на неінтерактивний шлях.
- Неінтерактивний режим вимагає імені агента та `--workspace`.
- `main` зарезервовано, і його не можна використовувати як ідентифікатор нового агента.
- В інтерактивному режимі початкове заповнення автентифікації копіює лише переносні статичні профілі
  (`api_key` і статичний `token` за замовчуванням). Профілі OAuth із refresh-token залишаються
  доступними лише через read-through успадкування зі справжнього сховища агента `main`.
  Якщо налаштований агент за замовчуванням не є `main`, увійдіть окремо для профілів OAuth
  на новому агенті.

### `agents bindings`

Параметри:

- `--agent <id>`
- `--json`

### `agents bind`

Параметри:

- `--agent <id>` (за замовчуванням поточний агент за замовчуванням)
- `--bind <channel[:accountId]>` (можна повторювати)
- `--json`

### `agents unbind`

Параметри:

- `--agent <id>` (за замовчуванням поточний агент за замовчуванням)
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
- Робочий простір, стан агента та каталоги транскриптів сеансів переміщуються до кошика, а не видаляються остаточно.
- Коли Gateway доступний, видалення надсилається через Gateway, щоб очищення конфігурації та сховища сеансів використовували той самий записувач, що й трафік виконання. Якщо Gateway недоступний, CLI повертається до офлайн-локального шляху.
- Якщо робочий простір іншого агента має той самий шлях, розташований усередині цього робочого простору або містить цей робочий простір,
  робочий простір зберігається, а `--json` повідомляє `workspaceRetained`,
  `workspaceRetainedReason` і `workspaceSharedWith`.

## Файли ідентичності

Кожен робочий простір агента може містити `IDENTITY.md` у корені робочого простору:

- Приклад шляху: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` читає з кореня робочого простору (або з явного `--identity-file`)

Шляхи до аватарів визначаються відносно кореня робочого простору.

## Налаштування ідентичності

`set-identity` записує поля в `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (шлях відносно робочого простору, URL http(s) або URI даних)

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

- `--agent` або `--workspace` можна використовувати для вибору цільового агента.
- Якщо ви покладаєтеся на `--workspace`, а кілька агентів спільно використовують цей робочий простір, команда завершується помилкою та просить передати `--agent`.
- Локальні файли зображень аватарів відносно робочого простору обмежені 2 МБ. URL HTTP(S) і URI `data:` не перевіряються локальним обмеженням розміру файлу.
- Якщо явні поля ідентичності не надано, команда читає дані ідентичності з `IDENTITY.md`.

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

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Маршрутизація з кількома агентами](/uk/concepts/multi-agent)
- [Робочий простір агента](/uk/concepts/agent-workspace)
