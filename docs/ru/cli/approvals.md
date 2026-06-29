---
read_when:
    - Вы хотите редактировать разрешения exec из CLI
    - Вам нужно управлять списками разрешений на хостах Gateway или Node
summary: Справочник CLI для `openclaw approvals` и `openclaw exec-policy`
title: Утверждения
x-i18n:
    generated_at: "2026-06-28T22:41:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Управляйте подтверждениями exec для **локального хоста**, **хоста gateway** или **хоста узла**.
По умолчанию команды обращаются к локальному файлу подтверждений на диске. Используйте `--gateway`, чтобы выбрать gateway, или `--node`, чтобы выбрать конкретный узел.

Псевдоним: `openclaw exec-approvals`

Связанные материалы:

- Подтверждения exec: [Подтверждения exec](/ru/tools/exec-approvals)
- Узлы: [Узлы](/ru/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` — это локальная служебная команда для согласования запрошенной
конфигурации `tools.exec.*` и локального файла подтверждений хоста за один шаг.

Используйте ее, когда хотите:

- проверить локальную запрошенную политику, файл подтверждений хоста и эффективное объединение
- применить локальный пресет, например YOLO или deny-all
- синхронизировать локальные `tools.exec.*` и локальный файл подтверждений хоста

Примеры:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Режимы вывода:

- без `--json`: выводит табличное представление, удобное для чтения человеком
- `--json`: выводит структурированный машинно-читаемый результат

Текущая область действия:

- `exec-policy` работает **только локально**
- он обновляет локальный файл конфигурации и локальный файл подтверждений вместе
- он **не** отправляет политику на хост gateway или хост узла
- `--host node` в этой команде отклоняется, потому что подтверждения exec для узла извлекаются с узла во время выполнения и должны управляться через команды подтверждений, нацеленные на узел
- `openclaw exec-policy show` помечает области `host=node` как управляемые узлом во время выполнения вместо вывода эффективной политики из локального файла подтверждений

Если нужно напрямую изменить подтверждения удаленного хоста, продолжайте использовать `openclaw approvals set --gateway`
или `openclaw approvals set --node <id|name|ip>`.

## Общие команды

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` теперь показывает эффективную политику exec для локальных целей, gateway и узлов:

- запрошенная политика `tools.exec`
- политика файла подтверждений хоста
- эффективный результат после применения правил приоритета

Приоритет задан намеренно:

- файл подтверждений хоста является исполнимым источником истины
- запрошенная политика `tools.exec` может сужать или расширять намерение, но эффективный результат все равно выводится из правил хоста
- `--node` объединяет файл подтверждений хоста узла с политикой gateway `tools.exec`, потому что обе по-прежнему применяются во время выполнения
- если конфигурация gateway недоступна, CLI возвращается к снимку подтверждений узла и отмечает, что итоговую политику времени выполнения вычислить не удалось

## Замена подтверждений из файла

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` принимает JSON5, а не только строгий JSON. Используйте либо `--file`, либо `--stdin`, но не оба сразу.

## Пример "никогда не спрашивать" / YOLO

Для хоста, который никогда не должен останавливаться на подтверждениях exec, задайте значения по умолчанию для подтверждений хоста как `full` + `off`:

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

Вариант для узла:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
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

Это изменяет только **файл подтверждений хоста**. Чтобы также согласовать запрошенную политику OpenClaw, задайте:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Почему в этом примере `tools.exec.host=gateway`:

- `host=auto` по-прежнему означает «песочница при наличии, иначе gateway».
- YOLO относится к подтверждениям, а не к маршрутизации.
- Если вам нужен exec на хосте даже при настроенной песочнице, укажите выбор хоста явно с помощью `gateway` или `/exec host=gateway`.

Пропущенный `askFallback` по умолчанию имеет значение `deny`. Задавайте `askFallback: "full"`
явно при обновлении хоста без UI, который должен сохранить поведение «никогда не спрашивать».

Локальный короткий путь:

```bash
openclaw exec-policy preset yolo
```

Этот локальный короткий путь одновременно обновляет запрошенную локальную конфигурацию `tools.exec.*` и локальные значения подтверждений по умолчанию. По смыслу он эквивалентен ручной двухшаговой настройке выше, но только для локальной машины.

## Вспомогательные команды allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Общие параметры

`get`, `set` и `allowlist add|remove` поддерживают:

- `--node <id|name|ip>`
- `--gateway`
- общие параметры RPC узла: `--url`, `--token`, `--timeout`, `--json`

Примечания по выбору цели:

- отсутствие флагов цели означает локальный файл подтверждений на диске
- `--gateway` выбирает файл подтверждений хоста gateway
- `--node` выбирает один хост узла после разрешения id, имени, IP или префикса id

`allowlist add|remove` также поддерживает:

- `--agent <id>` (по умолчанию `*`)

## Примечания

- `--node` использует тот же механизм разрешения, что и `openclaw nodes` (id, имя, ip или префикс id).
- `--agent` по умолчанию имеет значение `"*"`, которое применяется ко всем агентам.
- Хост узла должен объявлять `system.execApprovals.get/set` (приложение macOS или headless-хост узла).
- Файлы подтверждений хранятся отдельно для каждого хоста в каталоге состояния OpenClaw
  (`$OPENCLAW_STATE_DIR/exec-approvals.json` или
  `~/.openclaw/exec-approvals.json`, если переменная не задана).

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Подтверждения exec](/ru/tools/exec-approvals)
