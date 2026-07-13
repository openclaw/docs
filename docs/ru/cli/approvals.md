---
read_when:
    - Вы хотите изменить подтверждения выполнения команд из CLI
    - Необходимо управлять списками разрешений на хостах Gateway или Node
summary: Справочник по CLI для `openclaw approvals` и `openclaw exec-policy`
title: Подтверждения
x-i18n:
    generated_at: "2026-07-13T17:59:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Управляйте подтверждениями выполнения команд для **локального хоста**, **хоста Gateway** или **хоста Node**. Если флаг целевого хоста не указан, команды читают и записывают локальный файл подтверждений на диске. Используйте `--gateway`, чтобы выбрать Gateway, или `--node <id|name|ip>`, чтобы выбрать конкретный Node.

Псевдоним: `openclaw exec-approvals`

См. также: [Подтверждения выполнения команд](/ru/tools/exec-approvals), [Узлы](/ru/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` — вспомогательная команда, работающая **только локально** и за один шаг синхронизирующая запрошенную конфигурацию `tools.exec.*` с локальным файлом подтверждений хоста:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Предустановки (`yolo`, `cautious`, `deny-all`) одновременно применяют `host`, `security`, `ask` и `askFallback`. `set` применяет только переданные вами флаги; каждое допустимое значение проверяется (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Область действия:

- Одновременно обновляет локальный файл конфигурации и локальный файл подтверждений; не передаёт политику в Gateway или на хост Node.
- `--host node` отклоняется: подтверждения выполнения команд Node во время работы получаются от самого Node, поэтому локальная команда `exec-policy` не может их синхронизировать. Вместо неё используйте `openclaw approvals set --node <id|name|ip>`.
- `exec-policy show` помечает области `host=node` как управляемые Node во время работы вместо вычисления итоговой политики на основе локального файла подтверждений.

Для подтверждений удалённого хоста используйте непосредственно `openclaw approvals set --gateway` или `openclaw approvals set --node <id|name|ip>`.

## Часто используемые команды

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` показывает итоговую политику выполнения команд для целевого хоста: запрошенную политику `tools.exec`, политику из файла подтверждений хоста и объединённый итоговый результат. Узлы с собственной политикой хоста, например приложение-компаньон для Windows, показывают эту политику напрямую без применения логики объединения политики из файла подтверждений OpenClaw.

Для узлов, использующих файл, объединённое представление требует снимка политики, сформированного на хосте. Для старых узлов итоговая политика отображается как недоступная вместо предположения, что запрошенная политика Gateway также применяется на хосте.

<Note>
Переопределения `/exec` для отдельных сеансов не учитываются. Выполните `/exec` в соответствующем сеансе, чтобы проверить его текущие значения по умолчанию.
</Note>

Приоритет:

- Файл подтверждений хоста является применяемым источником истины.
- Запрошенная политика `tools.exec` может сужать или расширять намерение, но итоговый результат определяется правилами хоста.
- `--node` объединяет файл подтверждений хоста Node с политикой `tools.exec` Gateway (обе применяются во время работы).
- Если конфигурация Gateway недоступна, CLI использует снимок подтверждений Node и указывает, что окончательную политику времени выполнения вычислить не удалось.

## Замена подтверждений из файла

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` принимает JSON5, а не только строгий JSON. Используйте либо `--file`, либо `--stdin`, но не оба одновременно.

Узлы Windows с собственной политикой хоста используют свой формат политики:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI сначала считывает текущий хеш Node и отправляет его вместе с обновлением, поэтому параллельные локальные изменения отклоняются, а не перезаписываются. `rules` является обязательным, поскольку эта операция заменяет полный список правил Node; `defaultAction` указывать необязательно. Node, сообщающий, что его собственная политика отключена, нельзя настроить удалённо; сначала включите или настройте политику на этом хосте. Собственные политики хоста не поддерживают вспомогательные средства `allowlist add|remove`.

## Пример «никогда не запрашивать» / YOLO

Установите для подтверждений хоста значения по умолчанию `full` + `off`, если хост никогда не должен останавливаться для запроса подтверждений выполнения команд:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Для узлов, предоставляющих файл подтверждений OpenClaw, используйте то же содержимое с `openclaw approvals set --node <id|name|ip> --stdin`. Для узлов с собственной политикой хоста требуется показанный выше формат, определённый их владельцем.

Это изменяет только **файл подтверждений хоста**. Чтобы согласовать с ним запрошенную политику OpenClaw, также задайте:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Здесь `tools.exec.host=gateway` указан явно, поскольку `host=auto` по-прежнему означает «песочница, если она доступна, иначе Gateway»: YOLO относится к подтверждениям, а не к маршрутизации. Используйте `gateway` (или `/exec host=gateway`), если требуется выполнять команды на хосте даже при настроенной песочнице.

Если `askFallback` не указан, по умолчанию используется `deny`. При обновлении хоста без пользовательского интерфейса, который должен сохранить режим без запросов, явно задайте `askFallback: "full"`.

Локальная сокращённая команда для того же режима, действующая только на локальной машине:

```bash
openclaw exec-policy preset yolo
```

## Вспомогательные команды списка разрешений

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Общие параметры

`get`, `set` и `allowlist add|remove` поддерживают:

- `--node <id|name|ip>` (определяет Node по идентификатору, имени, IP-адресу или префиксу идентификатора; используется тот же механизм, что и в `openclaw nodes`)
- `--gateway`
- общие параметры RPC для Node: `--url`, `--token`, `--timeout`, `--json`

Если флаг целевого хоста не указан, используется локальный файл подтверждений на диске.

`allowlist add|remove` также поддерживает `--agent <id>` (по умолчанию `"*"`, применяется ко всем агентам).

## Примечания

- Хост Node должен объявлять поддержку `system.execApprovals.get/set` (приложение macOS, хост Node без графического интерфейса или приложение-компаньон для Windows).
- Файлы подтверждений хранятся отдельно для каждого хоста в каталоге состояния OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json` или `~/.openclaw/exec-approvals.json`, если переменная не задана.

## См. также

- [Справочник CLI](/ru/cli)
- [Подтверждения выполнения команд](/ru/tools/exec-approvals)
