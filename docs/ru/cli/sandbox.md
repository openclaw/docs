---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Управление средами выполнения песочницы и просмотр действующей политики песочницы
title: CLI песочницы
x-i18n:
    generated_at: "2026-07-12T11:18:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Управление средами выполнения песочницы для изолированного выполнения агентов: контейнерами Docker, целевыми узлами SSH или бэкендами OpenShell.

## Команды

### `openclaw sandbox list`

Вывод сред выполнения песочницы с указанием состояния, бэкенда, соответствия конфигурации, возраста, времени простоя и связанного сеанса или агента.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # только браузерные контейнеры
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Удаление сред выполнения песочницы для их принудительного пересоздания с текущей конфигурацией. Среды выполнения автоматически пересоздаются при следующем использовании агента.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # включает дочерние сеансы agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # только браузерные контейнеры
openclaw sandbox recreate --all --force        # без запроса подтверждения
```

Параметры:

- `--all`: пересоздать все контейнеры песочницы
- `--session <key>`: пересоздать среду выполнения с этим точным ключом области действия (как показано командой `sandbox list`); короткое имя не раскрывается
- `--agent <id>`: пересоздать среды выполнения для одного агента (соответствуют `agent:<id>` и `agent:<id>:*`)
- `--browser`: затронуть только браузерные контейнеры
- `--force`: пропустить запрос подтверждения

Укажите ровно один из параметров: `--all`, `--session` или `--agent`.

Для `ssh` и OpenShell `remote` пересоздание важнее, чем для Docker: после первоначального заполнения удалённая рабочая область становится канонической, команда `recreate` удаляет эту каноническую удалённую рабочую область для выбранной области действия, а при следующем запуске она снова заполняется из текущей локальной рабочей области.

### `openclaw sandbox explain`

Просмотр фактического режима и области действия песочницы, доступа к рабочей области, политики инструментов песочницы и ограничений для инструментов с повышенными привилегиями (с путями к ключам конфигурации для исправления).

В отчёте `workspaceRoot` остаётся настроенным корневым каталогом песочницы, а фактическая рабочая область хоста, рабочий каталог среды выполнения бэкенда и таблица подключений Docker отображаются отдельно. При `workspaceAccess: "rw"` фактической рабочей областью хоста является рабочая область агента, а не каталог внутри `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

В отличие от `recreate --session`, эта команда принимает короткие имена сеансов (например, `main`) и раскрывает их относительно определённого агента.

## Зачем нужно пересоздание

Обновление конфигурации песочницы не влияет на работающие контейнеры: существующие среды выполнения сохраняют старые настройки, а неактивные среды удаляются только по истечении `prune.idleHours` (по умолчанию 24 часа). Регулярно используемые агенты могут неограниченно долго сохранять устаревшие среды выполнения. Команда `openclaw sandbox recreate` удаляет старую среду выполнения, чтобы при следующем использовании она была заново создана с текущей конфигурацией.

<Tip>
Предпочитайте `openclaw sandbox recreate` ручной очистке, зависящей от конкретного бэкенда. Эта команда использует реестр сред выполнения Gateway и предотвращает несоответствия при изменении области действия или ключей сеансов.
</Tip>

## Типичные причины

| Изменение                                                                                                                                                      | Команда                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Обновление образа Docker (`agents.defaults.sandbox.docker.image`)                                                                                              | `openclaw sandbox recreate --all`                                   |
| Конфигурация песочницы (`agents.defaults.sandbox.*`)                                                                                                           | `openclaw sandbox recreate --all`                                   |
| Целевой узел или аутентификация SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Источник, политика или режим OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                 | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (или `--agent <id>` для одного агента) |

<Note>
Среды выполнения автоматически пересоздаются при следующем использовании агента.
</Note>

## Миграция реестра

Метаданные сред выполнения песочницы хранятся в общей базе данных состояния SQLite. В старых установках могут оставаться устаревшие файлы реестра, которые больше не перезаписываются при обычном чтении:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- по одному фрагменту JSON для каждого контейнера или браузера в `~/.openclaw/sandbox/containers/` или `~/.openclaw/sandbox/browsers/`

Выполните `openclaw doctor --fix`, чтобы перенести допустимые устаревшие записи в SQLite. Недопустимые устаревшие файлы помещаются в карантин, чтобы повреждённый старый реестр не мог скрыть текущие записи сред выполнения.

## Конфигурация

Настройки песочницы находятся в `~/.openclaw/openclaw.json` в разделе `agents.defaults.sandbox` (переопределения для отдельных агентов задаются в `agents.list[].sandbox`):

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
          // ... дополнительные параметры Docker
        },
        "prune": {
          "idleHours": 24, // автоматическое удаление после 24 часов простоя
          "maxAgeDays": 7, // автоматическое удаление через 7 дней
        },
      },
    },
  },
}
```

## См. также

- [Справочник CLI](/ru/cli)
- [Работа в песочнице](/ru/gateway/sandboxing)
- [Рабочая область агента](/ru/concepts/agent-workspace)
- [Диагностика](/ru/gateway/doctor): проверяет настройку песочницы.
