---
read_when:
    - Вам потрібні кілька ізольованих агентів (робочі простори + маршрутизація + автентифікація)
summary: Довідник CLI для `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Агенти
x-i18n:
    generated_at: "2026-05-02T12:44:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3522394dd416a9c8b4bf25767a14073484df0ff3d7c546cf6c730f111c5c51dc
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Керуйте ізольованими агентами (робочі простори + автентифікація + маршрутизація).

Пов’язано:

- [Маршрутизація з кількома агентами](/uk/concepts/multi-agent)
- [Робочий простір агента](/uk/concepts/agent-workspace)
- [Конфігурація Skills](/uk/tools/skills-config): конфігурація видимості Skills.

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

Якщо ви також хочете різні видимі Skills для кожного агента, налаштуйте `agents.defaults.skills` і `agents.list[].skills` в `openclaw.json`. Див. [Конфігурація Skills](/uk/tools/skills-config) і [Довідник конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

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

Якщо пропустити `accountId` (`--bind <channel>`), OpenClaw визначить його з типових параметрів каналу та хуків налаштування Plugin, коли вони доступні.

Якщо пропустити `--agent` для `bind` або `unbind`, OpenClaw вибере поточного типового агента.

### Поведінка області дії прив’язки

- Прив’язка без `accountId` відповідає лише типовому обліковому запису каналу.
- `accountId: "*"` є резервним варіантом для всього каналу (усі облікові записи) і є менш специфічним, ніж явна прив’язка облікового запису.
- Якщо той самий агент уже має відповідну прив’язку каналу без `accountId`, а згодом ви додаєте прив’язку з явним або визначеним `accountId`, OpenClaw оновлює цю наявну прив’язку на місці, замість додавання дубліката.

Приклад:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Після оновлення маршрутизація для цієї прив’язки обмежується `telegram:ops`. Якщо також потрібна маршрутизація для типового облікового запису, додайте її явно (наприклад, `--bind telegram:default`).

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
- `--bindings`: включити повні правила маршрутизації, а не лише кількості/зведення для кожного агента

### `agents add [name]`

Параметри:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (можна повторювати)
- `--non-interactive`
- `--json`

Примітки:

- Передавання будь-яких явних прапорців додавання переводить команду в неінтерактивний шлях.
- Неінтерактивний режим потребує і назви агента, і `--workspace`.
- `main` зарезервовано, і його не можна використовувати як новий ідентифікатор агента.
- В інтерактивному режимі початкове заповнення автентифікації копіює лише переносимі статичні профілі
  (`api_key` і статичний `token` за замовчуванням). Профілі OAuth із refresh token залишаються
  доступними лише через успадкування читанням із реального сховища агента `main`.
  Якщо налаштований типовий агент не є `main`, увійдіть окремо для профілів OAuth
  у новому агенті.

### `agents bindings`

Параметри:

- `--agent <id>`
- `--json`

### `agents bind`

Параметри:

- `--agent <id>` (за замовчуванням поточний типовий агент)
- `--bind <channel[:accountId]>` (можна повторювати)
- `--json`

### `agents unbind`

Параметри:

- `--agent <id>` (за замовчуванням поточний типовий агент)
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
- Коли Gateway доступний, видалення надсилається через Gateway, щоб очищення конфігурації та сховища сесій використовувало той самий записувач, що й трафік під час виконання. Якщо Gateway недоступний, CLI повертається до локального офлайн-шляху.
- Якщо робочий простір іншого агента має той самий шлях, розташований усередині цього робочого простору або містить цей робочий простір,
  робочий простір зберігається, а `--json` повідомляє `workspaceRetained`,
  `workspaceRetainedReason` і `workspaceSharedWith`.

## Файли ідентичності

Кожен робочий простір агента може містити `IDENTITY.md` у корені робочого простору:

- Приклад шляху: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` читає з кореня робочого простору (або з явного `--identity-file`)

Шляхи аватарів визначаються відносно кореня робочого простору.

## Налаштувати ідентичність

`set-identity` записує поля в `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (шлях відносно робочого простору, URL http(s) або data URI)

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
- Якщо ви покладаєтеся на `--workspace`, і кілька агентів спільно використовують цей робочий простір, команда завершується помилкою та просить передати `--agent`.
- Коли явні поля ідентичності не надано, команда читає дані ідентичності з `IDENTITY.md`.

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
