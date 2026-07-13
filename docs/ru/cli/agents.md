---
read_when:
    - Вам нужны несколько изолированных агентов (рабочие пространства + маршрутизация + аутентификация)
summary: Справочник по CLI для `openclaw agents` (просмотр/добавление/удаление/привязки/привязка/отвязка/настройка идентичности)
title: Агенты
x-i18n:
    generated_at: "2026-07-13T17:56:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Управление изолированными агентами (рабочими пространствами, аутентификацией и маршрутизацией). Запуск `openclaw agents` без подкоманды эквивалентен `openclaw agents list`.

См. также:

- [Маршрутизация между несколькими агентами](/ru/concepts/multi-agent)
- [Рабочее пространство агента](/ru/concepts/agent-workspace)
- [Настройка Skills](/ru/tools/skills-config): настройка видимости навыков.

## Примеры

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

## Набор команд

### `agents list`

Параметры: `--json`, `--bindings` (включает полные правила маршрутизации, а не только количество и сводки по каждому агенту).

### `agents add [name]`

Параметры: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (можно указывать несколько раз), `--non-interactive`, `--json`.

- Передача любого явного флага добавления переводит команду в неинтерактивный режим.
- Для неинтерактивного режима требуются как имя агента, так и `--workspace`.
- `main` зарезервирован и не может использоваться как идентификатор нового агента.
- В интерактивном режиме данные аутентификации инициализируются копированием только переносимых статических учётных данных (профилей `api_key` и статических профилей `token`), если для учётных данных не отключено копирование с помощью `copyToAgents: false`; профили с токенами обновления OAuth не копируются, если провайдер явно не разрешил это с помощью `copyToAgents: true`. Если копирование не выполняется, OAuth остаётся доступен только посредством сквозного наследования из реального хранилища агента `main`. Если настроенный агент по умолчанию — не `main`, отдельно выполните вход для профилей OAuth нового агента.

### `agents bindings`

Параметры: `--agent <id>`, `--json`.

### `agents bind`

Параметры: `--agent <id>` (по умолчанию используется текущий агент по умолчанию), `--bind <channel[:accountId]>` (можно указывать несколько раз), `--json`.

### `agents unbind`

Параметры: `--agent <id>` (по умолчанию используется текущий агент по умолчанию), `--bind <channel[:accountId]>` (можно указывать несколько раз), `--all`, `--json`. Принимает либо `--all`, либо одно или несколько значений `--bind`, но не оба варианта одновременно.

### `agents set-identity`

Параметры: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. См. раздел [Настройка идентичности](#set-identity) ниже.

### `agents delete <id>`

Параметры: `--force`, `--json`.

- `main` нельзя удалить.
- Без `--force` требуется интерактивное подтверждение (в сеансе без TTY команда завершится ошибкой; запустите её повторно с `--force`).
- Каталоги рабочего пространства, состояния агента и расшифровок сеансов перемещаются в корзину, а не удаляются безвозвратно.
- Когда Gateway доступен, удаление выполняется через Gateway, чтобы очистка конфигурации и хранилища сеансов использовала тот же механизм записи, что и трафик среды выполнения. Если Gateway недоступен, CLI использует резервный автономный локальный путь.
- Если рабочее пространство другого агента совпадает с этим путём, находится внутри этого рабочего пространства или содержит его, рабочее пространство сохраняется, а `--json` сообщает `workspaceRetained`, `workspaceRetainedReason` и `workspaceSharedWith`.

## Привязки маршрутизации

Используйте привязки маршрутизации, чтобы закрепить входящий трафик канала за определённым агентом.

Если вы также хотите задать разные видимые навыки для каждого агента, настройте `agents.defaults.skills` и `agents.list[].skills` в `openclaw.json`. См. [Настройка Skills](/ru/tools/skills-config) и [Справочник по конфигурации](/ru/gateway/config-agents#agentsdefaultsskills).

Просмотр привязок:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Добавление привязок:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Привязки также можно добавить при создании агента:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Если опустить `accountId` (`--bind <channel>`), OpenClaw определит его с помощью хуков настройки плагина, принудительной привязки учётной записи или количества настроенных учётных записей канала.

Если опустить `--agent` для `bind` или `unbind`, OpenClaw выберет текущего агента по умолчанию.

### Формат `--bind`

| Формат                       | Значение                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Соответствует всем учётным записям канала.                                                                 |
| `--bind <channel>:<account>` | Соответствует одной учётной записи.                                                                                 |
| `--bind <channel>`           | Соответствует только учётной записи по умолчанию, если CLI не может безопасно определить область учётной записи, специфичную для плагина. |

### Поведение области привязки

- Сохранённая привязка без `accountId` соответствует только учётной записи канала по умолчанию.
- `accountId: "*"` служит резервным вариантом для всего канала (всех учётных записей) и имеет меньшую специфичность, чем явная привязка учётной записи.
- Если у того же агента уже есть соответствующая привязка канала без `accountId`, а затем вы создаёте привязку с явным или определённым `accountId`, OpenClaw обновляет существующую привязку на месте, а не добавляет дубликат.

Примеры:

```bash
# соответствует всем учётным записям канала
openclaw agents bind --agent work --bind telegram:*

# соответствует определённой учётной записи
openclaw agents bind --agent work --bind telegram:ops

# начальная привязка только к каналу
openclaw agents bind --agent work --bind telegram

# последующее обновление до привязки с областью учётной записи
openclaw agents bind --agent work --bind telegram:alerts
```

После обновления маршрутизация для этой привязки ограничивается `telegram:alerts`. Если вам также нужна маршрутизация для учётной записи по умолчанию, добавьте её явно (например, `--bind telegram:default`).

Удаление привязок:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Файлы идентичности

Каждое рабочее пространство агента может содержать `IDENTITY.md` в корне рабочего пространства:

- Пример пути: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` считывает данные из корня рабочего пространства (или из явно указанного `--identity-file`).

Пути к аватарам разрешаются относительно корня рабочего пространства и не могут выходить за его пределы даже через символическую ссылку.

## Настройка идентичности

`set-identity` записывает поля в `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (путь относительно рабочего пространства, URL-адрес HTTP(S) или URI данных).

- `--agent` или `--workspace` выбирает целевого агента. Если `--workspace` соответствует нескольким агентам, команда завершается ошибкой и предлагает передать `--agent`.
- Размер локальных файлов изображений аватаров с путями относительно рабочего пространства ограничен 2 МБ. URL-адреса HTTP(S) и URI `data:` не проверяются на соответствие локальному ограничению размера файла.
- Если явные поля идентичности не указаны, команда считывает данные идентичности из `IDENTITY.md`.

Загрузка из `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Явное переопределение полей:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Пример конфигурации:

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

## См. также

- [Справочник CLI](/ru/cli)
- [Маршрутизация между несколькими агентами](/ru/concepts/multi-agent)
- [Рабочее пространство агента](/ru/concepts/agent-workspace)
