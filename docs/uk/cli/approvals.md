---
read_when:
    - Ви хочете змінити дозволи на виконання з CLI
    - Вам потрібно керувати списками дозволених на хостах Gateway або Node
summary: Довідка CLI для `openclaw approvals` і `openclaw exec-policy`
title: погодження
x-i18n:
    generated_at: "2026-04-23T06:17:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Керуйте дозволами на виконання для **локального хоста**, **хоста gateway** або **хоста node**.
За замовчуванням команди спрямовуються на локальний файл дозволів на диску. Використовуйте `--gateway`, щоб спрямувати команду на gateway, або `--node`, щоб спрямувати її на конкретний node.

Псевдонім: `openclaw exec-approvals`

Пов’язано:

- Дозволи на виконання: [Дозволи на виконання](/uk/tools/exec-approvals)
- Nodes: [Nodes](/uk/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` — це локальна допоміжна команда для того, щоб за один крок узгодити запитану конфігурацію `tools.exec.*` і локальний файл дозволів хоста.

Використовуйте її, якщо ви хочете:

- перевірити локальну запитану політику, файл дозволів хоста та ефективний результат об’єднання
- застосувати локальний пресет, наприклад YOLO або deny-all
- синхронізувати локальні `tools.exec.*` і локальний `~/.openclaw/exec-approvals.json`

Приклади:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Режими виводу:

- без `--json`: виводить людинозрозуміле табличне представлення
- з `--json`: виводить машинозчитуваний структурований результат

Поточна область дії:

- `exec-policy` — **лише локальна**
- вона одночасно оновлює локальний файл конфігурації та локальний файл дозволів
- вона **не** надсилає політику на хост gateway або хост node
- `--host node` у цій команді відхиляється, оскільки дозволи на виконання для node отримуються від node під час виконання й мають керуватися натомість через команди дозволів, спрямовані на node
- `openclaw exec-policy show` позначає області `host=node` як такі, що керуються node під час виконання, замість виведення ефективної політики з локального файла дозволів

Якщо вам потрібно безпосередньо редагувати дозволи віддаленого хоста, продовжуйте використовувати `openclaw approvals set --gateway`
або `openclaw approvals set --node <id|name|ip>`.

## Поширені команди

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` тепер показує ефективну політику виконання для локальних цілей, gateway і node:

- запитану політику `tools.exec`
- політику файла дозволів хоста
- ефективний результат після застосування правил пріоритету

Пріоритет навмисно такий:

- файл дозволів хоста — це джерело істини, яке реально застосовується
- запитана політика `tools.exec` може звужувати або розширювати намір, але ефективний результат усе одно виводиться з правил хоста
- `--node` поєднує файл дозволів хоста node з політикою gateway `tools.exec`, оскільки обидві все ще застосовуються під час виконання
- якщо конфігурація gateway недоступна, CLI повертається до знімка дозволів node і зазначає, що остаточну політику виконання під час роботи не вдалося обчислити

## Замінити дозволи з файла

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` приймає JSON5, а не лише строгий JSON. Використовуйте або `--file`, або `--stdin`, але не обидва одночасно.

## Приклад «Ніколи не запитувати» / YOLO

Для хоста, який ніколи не повинен зупинятися на дозволах виконання, встановіть для значень за замовчуванням у файлі дозволів хоста `full` + `off`:

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

Варіант для node:

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

Це змінює лише **файл дозволів хоста**. Щоб також узгодити запитану політику OpenClaw, встановіть:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Чому `tools.exec.host=gateway` у цьому прикладі:

- `host=auto` як і раніше означає «пісочниця, якщо доступна, інакше gateway».
- YOLO стосується дозволів, а не маршрутизації.
- Якщо ви хочете виконання на хості навіть тоді, коли налаштована пісочниця, явно вкажіть вибір хоста через `gateway` або `/exec host=gateway`.

Це відповідає поточній поведінці YOLO за замовчуванням для хоста. Зробіть політику суворішою, якщо вам потрібні дозволи.

Локальне скорочення:

```bash
openclaw exec-policy preset yolo
```

Це локальне скорочення одночасно оновлює і запитану локальну конфігурацію `tools.exec.*`, і локальні значення дозволів за замовчуванням. Воно еквівалентне за наміром наведеному вище ручному двокроковому налаштуванню, але лише для локальної машини.

## Допоміжні команди для списку дозволених

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Поширені параметри

`get`, `set` і `allowlist add|remove` усі підтримують:

- `--node <id|name|ip>`
- `--gateway`
- спільні параметри RPC для node: `--url`, `--token`, `--timeout`, `--json`

Примітки щодо спрямування:

- без прапорців цілі використовується локальний файл дозволів на диску
- `--gateway` спрямовує команду на файл дозволів хоста gateway
- `--node` спрямовує команду на один хост node після визначення id, name, IP або префікса id

`allowlist add|remove` також підтримує:

- `--agent <id>` (типове значення — `*`)

## Примітки

- `--node` використовує той самий механізм визначення, що й `openclaw nodes` (id, name, ip або префікс id).
- Для `--agent` типовим значенням є `"*"`, що застосовується до всіх агентів.
- Хост node має оголошувати `system.execApprovals.get/set` (застосунок macOS або headless-хост node).
- Файли дозволів зберігаються окремо для кожного хоста за шляхом `~/.openclaw/exec-approvals.json`.
