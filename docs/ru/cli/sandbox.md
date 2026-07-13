---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Управление средами выполнения песочницы и просмотр действующей политики песочницы
title: CLI песочницы
x-i18n:
    generated_at: "2026-07-13T18:00:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Управляйте средами выполнения песочницы для изолированного выполнения агентов: контейнерами Docker, целевыми узлами SSH или бэкендами OpenShell.

## Команды

### `openclaw sandbox list`

Выведите список сред выполнения песочницы со статусом, бэкендом, соответствием конфигурации, возрастом, временем простоя и связанным сеансом или агентом.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # только браузерные контейнеры
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Удалите среды выполнения песочницы, чтобы принудительно пересоздать их с текущей конфигурацией. Среды выполнения автоматически пересоздаются при следующем использовании агента.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # включает дочерние сеансы agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # только браузерные контейнеры
openclaw sandbox recreate --all --force        # пропустить подтверждение
```

Параметры:

- `--all`: пересоздать все контейнеры песочницы
- `--session <key>`: пересоздать среду выполнения с этим точным ключом области (как показано в `sandbox list`); краткие имена не раскрываются
- `--agent <id>`: пересоздать среды выполнения для одного агента (соответствует `agent:<id>` и `agent:<id>:*`)
- `--browser`: затронуть только браузерные контейнеры
- `--force`: пропустить запрос подтверждения

Передайте ровно один из параметров: `--all`, `--session` или `--agent`.

Для `ssh` и OpenShell `remote` пересоздание важнее, чем для Docker: после первоначального заполнения удалённое рабочее пространство становится каноническим, `recreate` удаляет это каноническое удалённое рабочее пространство для выбранной области, а при следующем запуске оно повторно заполняется из текущего локального рабочего пространства.

### `openclaw sandbox explain`

Просмотрите действующие режим и область песочницы, доступ к рабочему пространству, политику инструментов песочницы и ограничения для инструментов с повышенными привилегиями (с путями ключей конфигурации для исправления).

В отчёте `workspaceRoot` сохраняется как настроенный корень песочницы, а действующее рабочее пространство хоста, рабочий каталог среды выполнения бэкенда и таблица подключений Docker отображаются отдельно. Для `workspaceAccess: "rw"` действующим рабочим пространством хоста является рабочее пространство агента, а не каталог внутри `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

В отличие от `recreate --session`, эта команда принимает краткие имена сеансов (например, `main`) и раскрывает их с учётом определённого агента.

## Зачем требуется пересоздание

Обновление конфигурации песочницы не влияет на запущенные контейнеры: существующие среды выполнения сохраняют прежние настройки, а неактивные среды удаляются только по истечении `prune.idleHours` (по умолчанию 24 ч). Регулярно используемые агенты могут неограниченно долго сохранять устаревшие среды выполнения. `openclaw sandbox recreate` удаляет старую среду выполнения, чтобы при следующем использовании она была заново создана из текущей конфигурации.

<Tip>
Используйте `openclaw sandbox recreate` вместо ручной очистки, специфичной для конкретного бэкенда. Эта команда использует реестр сред выполнения Gateway и предотвращает несоответствия при изменении ключей области или сеанса.
</Tip>

## Распространённые причины

| Изменение                                                                                                                                                         | Команда                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Обновление образа Docker (`agents.defaults.sandbox.docker.image`)                                                                                                   | `openclaw sandbox recreate --all`                                   |
| Конфигурация песочницы (`agents.defaults.sandbox.*`)                                                                                                                   | `openclaw sandbox recreate --all`                                   |
| Целевой узел или аутентификация SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Источник, политика или режим OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                           | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (или `--agent <id>` для одного агента) |

<Note>
Среды выполнения автоматически пересоздаются при следующем использовании агента.
</Note>

## Миграция реестра

Метаданные сред выполнения песочницы хранятся в общей базе данных состояния SQLite. В старых установках могут оставаться устаревшие файлы реестра, которые больше не перезаписываются при обычном чтении:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- по одному сегменту JSON на контейнер или браузер в `~/.openclaw/sandbox/containers/` либо `~/.openclaw/sandbox/browsers/`

Запустите `openclaw doctor --fix`, чтобы перенести допустимые устаревшие записи в SQLite. Недопустимые устаревшие файлы помещаются в карантин, чтобы повреждённый старый реестр не мог скрыть текущие записи сред выполнения.

## Конфигурация

Настройки песочницы находятся в `~/.openclaw/openclaw.json` в разделе `agents.defaults.sandbox` (переопределения для отдельных агентов указываются в `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (предоставляется плагином)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... другие параметры Docker
        },
        "prune": {
          "idleHours": 24, // автоматически удалить после 24 ч простоя
          "maxAgeDays": 7, // автоматически удалить через 7 дней
        },
      },
    },
  },
}
```

## Связанные материалы

- [Справочник по CLI](/ru/cli)
- [Песочница](/ru/gateway/sandboxing)
- [Рабочее пространство агента](/ru/concepts/agent-workspace)
- [Doctor](/ru/gateway/doctor): проверяет настройку песочницы.
