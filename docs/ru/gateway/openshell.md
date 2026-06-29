---
read_when:
    - Вам нужны управляемые в облаке песочницы вместо локального Docker
    - Вы настраиваете Plugin OpenShell
    - Нужно выбрать между режимами зеркального и удаленного рабочего пространства
summary: Используйте OpenShell как управляемый бэкенд песочницы для агентов OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-06-28T22:59:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell — это управляемый бэкенд песочницы для OpenClaw. Вместо локального запуска Docker-контейнеров OpenClaw делегирует жизненный цикл песочницы CLI `openshell`, который создает удаленные окружения с выполнением команд по SSH.

Plugin OpenShell повторно использует тот же основной SSH-транспорт и мост удаленной файловой системы, что и универсальный [SSH-бэкенд](/ru/gateway/sandboxing#ssh-backend). Он добавляет специфичный для OpenShell жизненный цикл (`sandbox create/get/delete`, `sandbox ssh-config`) и необязательный режим рабочей области `mirror`.

## Предварительные требования

- Установлен Plugin OpenShell (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` установлен и доступен в `PATH` (или задан пользовательский путь через
  `plugins.entries.openshell.config.command`)
- Учетная запись OpenShell с доступом к песочницам
- OpenClaw Gateway запущен на хосте

## Быстрый старт

1. Установите и включите Plugin, затем задайте бэкенд песочницы:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Перезапустите Gateway. На следующем ходе агента OpenClaw создает песочницу OpenShell
   и направляет выполнение инструментов через нее.

3. Проверьте:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Режимы рабочей области

Это самое важное решение при использовании OpenShell.

### `mirror`

Используйте `plugins.entries.openshell.config.mode: "mirror"`, когда хотите, чтобы **локальная
рабочая область оставалась канонической**.

Поведение:

- Перед `exec` OpenClaw синхронизирует локальную рабочую область в песочницу OpenShell.
- После `exec` OpenClaw синхронизирует удаленную рабочую область обратно в локальную рабочую область.
- Файловые инструменты по-прежнему работают через мост песочницы, но локальная рабочая область
  остается источником истины между ходами.

Лучше всего подходит для случаев, когда:

- Вы редактируете файлы локально вне OpenClaw и хотите, чтобы эти изменения автоматически были видны
  в песочнице.
- Вы хотите, чтобы песочница OpenShell вела себя как можно более похоже на Docker-бэкенд.
- Вы хотите, чтобы рабочая область хоста отражала записи в песочнице после каждого хода exec.

Компромисс: дополнительные затраты на синхронизацию до и после каждого exec.

### `remote`

Используйте `plugins.entries.openshell.config.mode: "remote"`, когда хотите, чтобы
**рабочая область OpenShell стала канонической**.

Поведение:

- При первом создании песочницы OpenClaw один раз заполняет удаленную рабочую область из
  локальной рабочей области.
- После этого `exec`, `read`, `write`, `edit` и `apply_patch` работают
  напрямую с удаленной рабочей областью OpenShell.
- OpenClaw **не** синхронизирует удаленные изменения обратно в локальную рабочую область.
- Чтение медиа во время формирования промпта по-прежнему работает, потому что файловые и медиаинструменты читают через
  мост песочницы.

Лучше всего подходит для случаев, когда:

- Песочница должна в основном жить на удаленной стороне.
- Вам нужны меньшие накладные расходы на синхронизацию на каждом ходе.
- Вы не хотите, чтобы локальные правки на хосте незаметно перезаписывали удаленное состояние песочницы.

<Warning>
Если после первоначального заполнения вы редактируете файлы на хосте вне OpenClaw, удаленная песочница **не** увидит эти изменения. Используйте `openclaw sandbox recreate`, чтобы заполнить ее заново.
</Warning>

### Выбор режима

|                          | `mirror`                         | `remote`                         |
| ------------------------ | -------------------------------- | -------------------------------- |
| **Каноническая рабочая область** | Локальный хост                   | Удаленная OpenShell              |
| **Направление синхронизации** | Двунаправленное (каждый exec)     | Однократное заполнение           |
| **Накладные расходы на ход** | Выше (выгрузка + загрузка)        | Ниже (прямые удаленные операции) |
| **Локальные правки видны?** | Да, при следующем exec            | Нет, до повторного создания      |
| **Лучше всего для**      | Рабочие процессы разработки       | Долгоживущие агенты, CI          |

## Справочник по конфигурации

Вся конфигурация OpenShell находится в `plugins.entries.openshell.config`:

| Ключ                      | Тип                      | По умолчанию | Описание                                             |
| ------------------------- | ------------------------ | ------------ | ---------------------------------------------------- |
| `mode`                    | `"mirror"` или `"remote"` | `"mirror"`   | Режим синхронизации рабочей области                  |
| `command`                 | `string`                 | `"openshell"` | Путь или имя CLI `openshell`                         |
| `from`                    | `string`                 | `"openclaw"` | Источник песочницы при первом создании               |
| `gateway`                 | `string`                 | —            | Имя Gateway OpenShell (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —            | URL конечной точки Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —            | ID политики OpenShell для создания песочницы         |
| `providers`               | `string[]`               | `[]`         | Имена провайдеров, подключаемых при создании песочницы |
| `gpu`                     | `boolean`                | `false`      | Запрашивать ресурсы GPU                              |
| `autoProviders`           | `boolean`                | `true`       | Передавать `--auto-providers` при создании песочницы |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"` | Основная рабочая область с правом записи внутри песочницы |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`   | Путь монтирования рабочей области агента (для доступа только на чтение) |
| `timeoutSeconds`          | `number`                 | `120`        | Тайм-аут операций CLI `openshell`                    |

Настройки уровня песочницы (`mode`, `scope`, `workspaceAccess`) настраиваются в
`agents.defaults.sandbox`, как и для любого другого бэкенда. См.
[Песочницы](/ru/gateway/sandboxing) для полной матрицы.

## Примеры

### Минимальная удаленная настройка

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Режим mirror с GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell для отдельного агента с пользовательским Gateway

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Управление жизненным циклом

Песочницы OpenShell управляются через обычный CLI песочницы:

```bash
# Список всех сред выполнения песочниц (Docker + OpenShell)
openclaw sandbox list

# Проверить действующую политику
openclaw sandbox explain

# Повторное создание (удаляет удаленную рабочую область, заново заполняет при следующем использовании)
openclaw sandbox recreate --all
```

Для режима `remote` **повторное создание особенно важно**: оно удаляет каноническую
удаленную рабочую область для этой области действия. Следующее использование заполняет новую удаленную рабочую область из
локальной рабочей области.

Для режима `mirror` повторное создание в основном сбрасывает удаленную среду выполнения, потому что
локальная рабочая область остается канонической.

### Когда выполнять повторное создание

Выполняйте повторное создание после изменения любого из этих параметров:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Усиление безопасности

OpenShell закрепляет fd корня рабочей области и повторно проверяет идентичность песочницы перед каждым
чтением, поэтому подмена символических ссылок или перемонтированная рабочая область не могут перенаправить чтение за пределы
предполагаемой удаленной рабочей области.

## Текущие ограничения

- Браузер песочницы не поддерживается в бэкенде OpenShell.
- `sandbox.docker.binds` не применяется к OpenShell.
- Специфичные для Docker параметры среды выполнения в `sandbox.docker.*` применяются только к Docker-
  бэкенду.

## Как это работает

1. OpenClaw вызывает `openshell sandbox create` (с флагами `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu`, как настроено).
2. OpenClaw вызывает `openshell sandbox ssh-config <name>`, чтобы получить данные SSH-подключения
   для песочницы.
3. Ядро записывает SSH-конфигурацию во временный файл и открывает SSH-сеанс, используя
   тот же мост удаленной файловой системы, что и универсальный SSH-бэкенд.
4. В режиме `mirror`: синхронизация с локальной стороны на удаленную перед exec, запуск, синхронизация обратно после exec.
5. В режиме `remote`: однократное заполнение при создании, затем работа напрямую с удаленной
   рабочей областью.

## Связанные материалы

- [Песочницы](/ru/gateway/sandboxing) -- режимы, области действия и сравнение бэкендов
- [Песочница, политика инструментов и повышенные права](/ru/gateway/sandbox-vs-tool-policy-vs-elevated) -- отладка заблокированных инструментов
- [Песочница и инструменты для нескольких агентов](/ru/tools/multi-agent-sandbox-tools) -- переопределения для отдельных агентов
- [CLI песочницы](/ru/cli/sandbox) -- команды `openclaw sandbox`
