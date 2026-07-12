---
read_when:
    - Вам нужно несколько изолированных агентов (рабочие пространства + маршрутизация + аутентификация)
summary: Справочник CLI для `openclaw agents` (список/добавление/удаление/привязки/привязать/отвязать/задать идентичность)
title: Агенты
x-i18n:
    generated_at: "2026-07-12T11:14:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Управление изолированными агентами (рабочими пространствами, аутентификацией и маршрутизацией). Запуск `openclaw agents` без подкоманды эквивалентен `openclaw agents list`.

Связанные материалы:

- [Маршрутизация между несколькими агентами](/ru/concepts/multi-agent)
- [Рабочее пространство агента](/ru/concepts/agent-workspace)
- [Конфигурация Skills](/ru/tools/skills-config): настройка видимости навыков.

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

Параметры: `--json`, `--bindings` (включить полные правила маршрутизации, а не только количество и сводку по каждому агенту).

### `agents add [name]`

Параметры: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (можно указывать несколько раз), `--non-interactive`, `--json`.

- Передача любого явного параметра добавления переводит команду в неинтерактивный режим.
- В неинтерактивном режиме обязательны имя агента и `--workspace`.
- Идентификатор `main` зарезервирован и не может использоваться для нового агента.
- В интерактивном режиме данные аутентификации инициализируются копированием только переносимых статических учетных данных (профилей `api_key` и статического `token`), если для учетных данных не задано `copyToAgents: false`; профили OAuth с токенами обновления не копируются, если только провайдер явно не включил это с помощью `copyToAgents: true`. Без копирования OAuth остается доступен только через сквозное наследование из реального хранилища агента `main`. Если настроенный агент по умолчанию — не `main`, выполните отдельный вход для профилей OAuth нового агента.

### `agents bindings`

Параметры: `--agent <id>`, `--json`.

### `agents bind`

Параметры: `--agent <id>` (по умолчанию используется текущий агент по умолчанию), `--bind <channel[:accountId]>` (можно указывать несколько раз), `--json`.

### `agents unbind`

Параметры: `--agent <id>` (по умолчанию используется текущий агент по умолчанию), `--bind <channel[:accountId]>` (можно указывать несколько раз), `--all`, `--json`. Принимается либо `--all`, либо одно или несколько значений `--bind`, но не оба варианта одновременно.

### `agents set-identity`

Параметры: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. См. раздел [Настройка идентичности](#set-identity) ниже.

### `agents delete <id>`

Параметры: `--force`, `--json`.

- Агент `main` не может быть удален.
- Без `--force` требуется интерактивное подтверждение (команда завершается ошибкой в сеансе без TTY; запустите ее повторно с `--force`).
- Каталоги рабочего пространства, состояния агента и расшифровок сеансов перемещаются в корзину, а не удаляются безвозвратно.
- Если Gateway доступен, удаление выполняется через Gateway, чтобы очистка конфигурации и хранилища сеансов использовала тот же механизм записи, что и рабочий трафик. Если Gateway недоступен, CLI переключается на локальный автономный способ.
- Если рабочее пространство другого агента находится по тому же пути, внутри этого рабочего пространства или содержит его, рабочее пространство сохраняется, а `--json` сообщает поля `workspaceRetained`, `workspaceRetainedReason` и `workspaceSharedWith`.

## Привязки маршрутизации

Используйте привязки маршрутизации, чтобы направлять входящий трафик канала конкретному агенту.

Если для разных агентов также требуются разные видимые навыки, настройте `agents.defaults.skills` и `agents.list[].skills` в `openclaw.json`. См. [Конфигурацию Skills](/ru/tools/skills-config) и [Справочник по конфигурации](/ru/gateway/config-agents#agentsdefaultsskills).

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

Если опустить `accountId` (`--bind <channel>`), OpenClaw определит его с помощью обработчиков настройки плагина, принудительной привязки учетной записи или настроенного количества учетных записей канала.

Если опустить `--agent` для `bind` или `unbind`, OpenClaw использует текущего агента по умолчанию.

### Формат `--bind`

| Формат                       | Значение                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Соответствует всем учетным записям в канале.                                                                                 |
| `--bind <channel>:<account>` | Соответствует одной учетной записи.                                                                                          |
| `--bind <channel>`           | Соответствует только учетной записи по умолчанию, если CLI не может безопасно определить область учетной записи для плагина. |

### Поведение области привязки

- Сохраненная привязка без `accountId` соответствует только учетной записи канала по умолчанию.
- `accountId: "*"` служит резервным вариантом для всего канала (всех учетных записей) и имеет меньший приоритет, чем явная привязка учетной записи.
- Если у того же агента уже есть соответствующая привязка канала без `accountId`, а затем добавляется привязка с явным или определенным `accountId`, OpenClaw обновляет существующую привязку на месте, а не создает дубликат.

Примеры:

```bash
# соответствовать всем учетным записям в канале
openclaw agents bind --agent work --bind telegram:*

# соответствовать определенной учетной записи
openclaw agents bind --agent work --bind telegram:ops

# исходная привязка только к каналу
openclaw agents bind --agent work --bind telegram

# последующее обновление до привязки с областью учетной записи
openclaw agents bind --agent work --bind telegram:alerts
```

После обновления маршрутизация для этой привязки ограничивается `telegram:alerts`. Если также требуется маршрутизация для учетной записи по умолчанию, добавьте ее явно (например, `--bind telegram:default`).

Удаление привязок:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Файлы идентичности

Каждое рабочее пространство агента может содержать файл `IDENTITY.md` в корне рабочего пространства:

- Пример пути: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` считывает данные из корня рабочего пространства (или из файла, явно указанного через `--identity-file`).

Пути к аватарам разрешаются относительно корня рабочего пространства и не могут выходить за его пределы даже через символическую ссылку.

## Настройка идентичности

`set-identity` записывает поля в `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (путь относительно рабочего пространства, URL-адрес HTTP(S) или URI данных).

- `--agent` или `--workspace` выбирает целевого агента. Если `--workspace` соответствует нескольким агентам, команда завершается ошибкой и предлагает передать `--agent`.
- Размер локальных файлов изображений аватара, путь к которым задан относительно рабочего пространства, ограничен 2 МБ. URL-адреса HTTP(S) и URI `data:` не проверяются на соответствие локальному ограничению размера файла.
- Если поля идентичности не указаны явно, команда считывает данные идентичности из `IDENTITY.md`.

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

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Маршрутизация между несколькими агентами](/ru/concepts/multi-agent)
- [Рабочее пространство агента](/ru/concepts/agent-workspace)
