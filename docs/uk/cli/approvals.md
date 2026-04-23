---
read_when:
    - Ви хочете редагувати схвалення exec з CLI
    - Вам потрібно керувати allowlist на хостах Gateway або Node
summary: Довідник CLI для `openclaw approvals` і `openclaw exec-policy`
title: Схвалення
x-i18n:
    generated_at: "2026-04-23T20:46:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23465c7fdf17ec5fe6c6c561ec19b0c72a94af02e3982a85c52eef99eac2e76c
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Керуйте схваленнями exec для **локального хоста**, **хоста gateway** або **хоста node**.
За замовчуванням команди націлені на локальний файл схвалень на диску. Використовуйте `--gateway`, щоб націлитися на gateway, або `--node`, щоб націлитися на конкретний node.

Псевдонім: `openclaw exec-approvals`

Пов’язане:

- Схвалення exec: [Схвалення exec](/uk/tools/exec-approvals)
- Node: [Node](/uk/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` — це локальна зручна команда для узгодження запитаної
конфігурації `tools.exec.*` і локального файла схвалень хоста за один крок.

Використовуйте її, коли хочете:

- переглянути локальну запитану політику, файл схвалень хоста та ефективне злиття
- застосувати локальний preset, наприклад YOLO або deny-all
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

- без `--json`: виводить таблицю в форматі для читання людиною
- `--json`: виводить структурований результат у форматі для машинного читання

Поточна область застосування:

- `exec-policy` — **лише локальна**
- вона оновлює локальний файл конфігурації та локальний файл схвалень разом
- вона **не** надсилає політику на хост gateway або хост node
- `--host node` відхиляється в цій команді, тому що схвалення exec для node отримуються з node під час виконання і натомість мають керуватися через команди схвалень, націлені на node
- `openclaw exec-policy show` позначає області `host=node` як такі, що керуються node під час виконання, замість виведення ефективної політики з локального файла схвалень

Якщо вам потрібно безпосередньо редагувати схвалення віддаленого хоста, і надалі використовуйте `openclaw approvals set --gateway`
або `openclaw approvals set --node <id|name|ip>`.

## Поширені команди

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` тепер показує ефективну політику exec для локальних, gateway і node-цілей:

- запитану політику `tools.exec`
- політику файла схвалень хоста
- ефективний результат після застосування правил пріоритету

Пріоритет навмисний:

- файл схвалень хоста — це джерело істини, що підлягає застосуванню
- запитана політика `tools.exec` може звужувати або розширювати намір, але ефективний результат усе одно визначається правилами хоста
- `--node` поєднує файл схвалень хоста node з політикою `tools.exec` gateway, оскільки обидва все ще застосовуються під час виконання
- якщо конфігурація gateway недоступна, CLI повертається до знімка схвалень node і зазначає, що остаточну політику часу виконання не вдалося обчислити

## Замінити схвалення з файла

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` приймає JSON5, а не лише строгий JSON. Використовуйте або `--file`, або `--stdin`, але не обидва варіанти.

## Приклад «Ніколи не запитувати» / YOLO

Для хоста, який ніколи не має зупинятися на схваленнях exec, задайте типові значення схвалень хоста як `full` + `off`:

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

Це змінює лише **файл схвалень хоста**. Щоб узгодити запитану політику OpenClaw, також задайте:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Чому в цьому прикладі `tools.exec.host=gateway`:

- `host=auto` усе ще означає «пісочниця, якщо доступна, інакше gateway».
- YOLO стосується схвалень, а не маршрутизації.
- Якщо ви хочете exec на хості навіть тоді, коли налаштовано пісочницю, явно вкажіть вибір хоста через `gateway` або `/exec host=gateway`.

Це відповідає поточній типовій поведінці YOLO для хоста. Зробіть її суворішою, якщо хочете мати схвалення.

Локальний ярлик:

```bash
openclaw exec-policy preset yolo
```

Цей локальний ярлик оновлює і запитану локальну конфігурацію `tools.exec.*`, і
локальні типові схвалення разом. За наміром це еквівалентно ручному двокроковому
налаштуванню вище, але лише для локальної машини.

## Допоміжні команди allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Поширені параметри

`get`, `set` і `allowlist add|remove` підтримують:

- `--node <id|name|ip>`
- `--gateway`
- спільні параметри RPC для node: `--url`, `--token`, `--timeout`, `--json`

Примітки щодо націлювання:

- без прапорців цілі використовується локальний файл схвалень на диску
- `--gateway` націлює файл схвалень хоста gateway
- `--node` націлює один хост node після розв’язання id, name, IP або префікса id

`allowlist add|remove` також підтримує:

- `--agent <id>` (типове значення — `*`)

## Примітки

- `--node` використовує той самий механізм розв’язання, що й `openclaw nodes` (id, name, ip або префікс id).
- `--agent` має типове значення `"*"`, що застосовується до всіх агентів.
- Хост node має оголошувати `system.execApprovals.get/set` (застосунок macOS або headless-хост node).
- Файли схвалень зберігаються окремо для кожного хоста в `~/.openclaw/exec-approvals.json`.
