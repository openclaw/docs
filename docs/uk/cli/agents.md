---
read_when:
    - Вам потрібно кілька ізольованих агентів (робочі простори + маршрутизація + автентифікація)
summary: Довідник CLI для `openclaw agents` (перегляд/додавання/видалення/прив’язки/прив’язування/відв’язування/налаштування ідентичності)
title: Агенти
x-i18n:
    generated_at: "2026-07-12T13:02:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Керуйте ізольованими агентами (робочими просторами, автентифікацією та маршрутизацією). Виконання `openclaw agents` без підкоманди еквівалентне `openclaw agents list`.

Пов’язані матеріали:

- [Багатоагентна маршрутизація](/uk/concepts/multi-agent)
- [Робочий простір агента](/uk/concepts/agent-workspace)
- [Налаштування Skills](/uk/tools/skills-config): налаштування видимості навичок.

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

## Набір команд

### `agents list`

Параметри: `--json`, `--bindings` (включає повні правила маршрутизації, а не лише кількість або зведення для кожного агента).

### `agents add [name]`

Параметри: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (можна повторювати), `--non-interactive`, `--json`.

- Передавання будь-якого явного прапорця додавання перемикає команду в неінтерактивний режим.
- Для неінтерактивного режиму потрібні як ім’я агента, так і `--workspace`.
- `main` зарезервовано, тому його не можна використовувати як ідентифікатор нового агента.
- В інтерактивному режимі початкові дані автентифікації створюються шляхом копіювання лише переносимих статичних облікових даних (профілів `api_key` і статичного `token`), якщо для облікових даних не вимкнено копіювання через `copyToAgents: false`; профілі OAuth із токенами оновлення не копіюються, якщо постачальник явно не ввімкнув це через `copyToAgents: true`. Без копіювання OAuth залишається доступним лише через наскрізне успадкування зі сховища справжнього агента `main`. Якщо налаштований агент за замовчуванням — не `main`, окремо виконайте вхід для профілів OAuth нового агента.

### `agents bindings`

Параметри: `--agent <id>`, `--json`.

### `agents bind`

Параметри: `--agent <id>` (за замовчуванням — поточний агент за замовчуванням), `--bind <channel[:accountId]>` (можна повторювати), `--json`.

### `agents unbind`

Параметри: `--agent <id>` (за замовчуванням — поточний агент за замовчуванням), `--bind <channel[:accountId]>` (можна повторювати), `--all`, `--json`. Приймає або `--all`, або одне чи кілька значень `--bind`, але не обидва варіанти одночасно.

### `agents set-identity`

Параметри: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Див. розділ [Налаштування ідентичності](#set-identity) нижче.

### `agents delete <id>`

Параметри: `--force`, `--json`.

- `main` не можна видалити.
- Без `--force` потрібне інтерактивне підтвердження (у сеансі без TTY команда завершується помилкою; запустіть її повторно з `--force`).
- Каталоги робочого простору, стану агента й журналів сеансів переміщуються до кошика, а не видаляються безповоротно.
- Якщо Gateway доступний, видалення виконується через Gateway, щоб очищення конфігурації та сховища сеансів здійснював той самий компонент запису, що й обробку трафіку під час роботи. Якщо Gateway недоступний, CLI використовує резервний автономний локальний шлях.
- Якщо робочий простір іншого агента має той самий шлях, розташований усередині цього робочого простору або містить його, робочий простір зберігається, а `--json` повертає `workspaceRetained`, `workspaceRetainedReason` і `workspaceSharedWith`.

## Прив’язки маршрутизації

Використовуйте прив’язки маршрутизації, щоб закріпити вхідний трафік каналу за певним агентом.

Якщо вам також потрібні різні видимі Skills для кожного агента, налаштуйте `agents.defaults.skills` і `agents.list[].skills` у `openclaw.json`. Див. [Налаштування Skills](/uk/tools/skills-config) і [Довідник із конфігурації](/uk/gateway/config-agents#agentsdefaultsskills).

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

Прив’язки також можна додати під час створення агента:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Якщо пропустити `accountId` (`--bind <channel>`), OpenClaw визначить його через обробники налаштування плагіна, примусову прив’язку облікового запису або налаштовану кількість облікових записів каналу.

Якщо пропустити `--agent` для `bind` або `unbind`, OpenClaw застосує команду до поточного агента за замовчуванням.

### Формат `--bind`

| Формат                       | Значення                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Відповідність усім обліковим записам у каналі.                                                                                |
| `--bind <channel>:<account>` | Відповідність одному обліковому запису.                                                                                       |
| `--bind <channel>`           | Відповідність лише обліковому запису за замовчуванням, якщо CLI не може безпечно визначити область облікового запису плагіна. |

### Поведінка області прив’язки

- Збережена прив’язка без `accountId` відповідає лише обліковому запису каналу за замовчуванням.
- `accountId: "*"` є резервним варіантом для всього каналу (усіх облікових записів) і має нижчу специфічність, ніж явна прив’язка облікового запису.
- Якщо той самий агент уже має відповідну прив’язку каналу без `accountId`, а згодом ви створюєте прив’язку з явним або визначеним `accountId`, OpenClaw оновлює наявну прив’язку безпосередньо замість додавання дубліката.

Приклади:

```bash
# відповідність усім обліковим записам у каналі
openclaw agents bind --agent work --bind telegram:*

# відповідність певному обліковому запису
openclaw agents bind --agent work --bind telegram:ops

# початкова прив’язка лише до каналу
openclaw agents bind --agent work --bind telegram

# подальше оновлення до прив’язки з областю облікового запису
openclaw agents bind --agent work --bind telegram:alerts
```

Після оновлення маршрутизація для цієї прив’язки обмежується `telegram:alerts`. Якщо вам також потрібна маршрутизація для облікового запису за замовчуванням, додайте її явно (наприклад, `--bind telegram:default`).

Видалення прив’язок:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Файли ідентичності

Кожен робочий простір агента може містити файл `IDENTITY.md` у корені робочого простору:

- Приклад шляху: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` читає дані з кореня робочого простору (або з явно вказаного `--identity-file`).

Шляхи до аватарів визначаються відносно кореня робочого простору й не можуть виходити за його межі навіть через символічне посилання.

## Налаштування ідентичності

`set-identity` записує поля до `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (шлях відносно робочого простору, URL HTTP(S) або URI даних).

- `--agent` або `--workspace` вибирає цільового агента. Якщо `--workspace` відповідає кільком агентам, команда завершується помилкою та просить передати `--agent`.
- Розмір локальних файлів зображень аватарів, шляхи до яких задано відносно робочого простору, обмежено 2 МБ. URL HTTP(S) і URI `data:` не перевіряються щодо локального обмеження розміру файлу.
- Якщо явні поля ідентичності не вказані, команда зчитує дані ідентичності з `IDENTITY.md`.

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

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Багатоагентна маршрутизація](/uk/concepts/multi-agent)
- [Робочий простір агента](/uk/concepts/agent-workspace)
