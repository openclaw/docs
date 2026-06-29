---
read_when:
    - Вам нужны несколько изолированных агентов (рабочие пространства + маршрутизация + аутентификация)
summary: Справочник CLI для `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Агенты
x-i18n:
    generated_at: "2026-06-28T22:41:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Управление изолированными агентами (рабочие области + аутентификация + маршрутизация).

Связанные разделы:

- [Маршрутизация нескольких агентов](/ru/concepts/multi-agent)
- [Рабочая область агента](/ru/concepts/agent-workspace)
- [Конфигурация Skills](/ru/tools/skills-config): настройка видимости Skills.

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

## Привязки маршрутизации

Используйте привязки маршрутизации, чтобы закрепить входящий трафик канала за конкретным агентом.

Если вам также нужны разные видимые Skills для каждого агента, настройте `agents.defaults.skills` и `agents.list[].skills` в `openclaw.json`. См. [Конфигурация Skills](/ru/tools/skills-config) и [Справочник по конфигурации](/ru/gateway/config-agents#agents-defaults-skills).

Список привязок:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Добавить привязки:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Привязки также можно добавить при создании агента:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Если вы опускаете `accountId` (`--bind <channel>`), OpenClaw определяет его через хуки настройки Plugin, принудительную привязку аккаунта или настроенное количество аккаунтов канала.

Если вы опускаете `--agent` для `bind` или `unbind`, OpenClaw выбирает текущего агента по умолчанию.

### Формат `--bind`

| Формат                       | Значение                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Сопоставлять все аккаунты в канале.                                                               |
| `--bind <channel>:<account>` | Сопоставлять один аккаунт.                                                                        |
| `--bind <channel>`           | Сопоставлять только аккаунт по умолчанию, если CLI не может безопасно определить область аккаунта, специфичную для Plugin. |

### Поведение области привязки

- Сохраненная привязка без `accountId` сопоставляет только аккаунт канала по умолчанию.
- `accountId: "*"` — резервная привязка на весь канал (все аккаунты), менее специфичная, чем явная привязка аккаунта.
- Если у того же агента уже есть совпадающая привязка канала без `accountId`, а затем вы выполняете привязку с явным или определенным `accountId`, OpenClaw обновляет существующую привязку на месте вместо добавления дубликата.

Примеры:

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

После обновления маршрутизация для этой привязки ограничена `telegram:alerts`. Если вам также нужна маршрутизация для аккаунта по умолчанию, добавьте ее явно (например, `--bind telegram:default`).

Удалить привязки:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` принимает либо `--all`, либо одно или несколько значений `--bind`, но не оба варианта одновременно.

## Поверхность команд

### `agents`

Запуск `openclaw agents` без подкоманды эквивалентен `openclaw agents list`.

### `agents list`

Параметры:

- `--json`
- `--bindings`: включить полные правила маршрутизации, а не только счетчики/сводки по агентам

### `agents add [name]`

Параметры:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (можно повторять)
- `--non-interactive`
- `--json`

Примечания:

- Передача любых явных флагов добавления переводит команду в неинтерактивный режим.
- Для неинтерактивного режима требуются и имя агента, и `--workspace`.
- `main` зарезервирован и не может использоваться как id нового агента.
- В интерактивном режиме заполнение данных аутентификации копирует только переносимые статические профили
  (`api_key` и статический `token` по умолчанию). Профили с refresh-token OAuth остаются
  доступными только через сквозное наследование чтения из настоящего хранилища агента `main`.
  Если настроенный агент по умолчанию не `main`, войдите отдельно для профилей OAuth
  на новом агенте.

### `agents bindings`

Параметры:

- `--agent <id>`
- `--json`

### `agents bind`

Параметры:

- `--agent <id>` (по умолчанию текущий агент по умолчанию)
- `--bind <channel[:accountId]>` (можно повторять)
- `--json`

### `agents unbind`

Параметры:

- `--agent <id>` (по умолчанию текущий агент по умолчанию)
- `--bind <channel[:accountId]>` (можно повторять)
- `--all`
- `--json`

### `agents delete <id>`

Параметры:

- `--force`
- `--json`

Примечания:

- `main` нельзя удалить.
- Без `--force` требуется интерактивное подтверждение.
- Рабочая область, состояние агента и каталоги транскриптов сессий перемещаются в корзину, а не удаляются безвозвратно.
- Когда Gateway доступен, удаление отправляется через Gateway, чтобы очистка конфигурации и хранилища сессий использовала тот же механизм записи, что и runtime-трафик. Если Gateway недоступен, CLI возвращается к автономному локальному пути.
- Если рабочая область другого агента находится по тому же пути, внутри этой рабочей области или содержит эту рабочую область,
  рабочая область сохраняется, а `--json` сообщает `workspaceRetained`,
  `workspaceRetainedReason` и `workspaceSharedWith`.

## Файлы идентификации

Каждая рабочая область агента может содержать `IDENTITY.md` в корне рабочей области:

- Пример пути: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` читает данные из корня рабочей области (или из явно указанного `--identity-file`)

Пути к аватарам разрешаются относительно корня рабочей области.

## Настройка идентификации

`set-identity` записывает поля в `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (путь относительно рабочей области, URL http(s) или data URI)

Параметры:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Примечания:

- `--agent` или `--workspace` можно использовать для выбора целевого агента.
- Если вы полагаетесь на `--workspace` и несколько агентов используют эту рабочую область совместно, команда завершается ошибкой и просит передать `--agent`.
- Локальные файлы изображений аватара с путем относительно рабочей области ограничены 2 МБ. HTTP(S) URL и URI `data:` не проверяются по локальному ограничению размера файла.
- Если явные поля идентификации не указаны, команда читает данные идентификации из `IDENTITY.md`.

Загрузить из `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Явно переопределить поля:

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

## Связанные разделы

- [Справочник CLI](/ru/cli)
- [Маршрутизация нескольких агентов](/ru/concepts/multi-agent)
- [Рабочая область агента](/ru/concepts/agent-workspace)
