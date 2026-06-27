---
read_when:
    - Ви хочете редагувати схвалення exec з CLI
    - Потрібно керувати списками дозволених на хостах Gateway або Node
summary: Довідник CLI для `openclaw approvals` і `openclaw exec-policy`
title: Схвалення
x-i18n:
    generated_at: "2026-06-27T17:19:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Керуйте схваленнями виконання для **локального хоста**, **хоста Gateway** або **хоста вузла**.
За замовчуванням команди націлені на локальний файл схвалень на диску. Використовуйте `--gateway`, щоб націлитися на Gateway, або `--node`, щоб націлитися на конкретний вузол.

Псевдонім: `openclaw exec-approvals`

Пов’язано:

- Схвалення виконання: [Схвалення виконання](/uk/tools/exec-approvals)
- Вузли: [Вузли](/uk/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` — це локальна зручна команда для підтримання запитаної конфігурації
`tools.exec.*` і локального файла схвалень хоста узгодженими за один крок.

Використовуйте її, коли хочете:

- перевірити локальну запитану політику, файл схвалень хоста та ефективне злиття
- застосувати локальний пресет, як-от YOLO або deny-all
- синхронізувати локальні `tools.exec.*` і локальний файл схвалень хоста

Приклади:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Режими виводу:

- без `--json`: друкує зручне для читання людиною табличне подання
- `--json`: друкує машиночитаний структурований вивід

Поточна область дії:

- `exec-policy` є **лише локальною**
- вона оновлює локальний файл конфігурації та локальний файл схвалень разом
- вона **не** надсилає політику на хост Gateway або хост вузла
- `--host node` у цій команді відхиляється, бо схвалення виконання вузла отримуються з вузла під час виконання й натомість мають керуватися через команди схвалень, націлені на вузол
- `openclaw exec-policy show` позначає області `host=node` як керовані вузлом під час виконання замість виведення ефективної політики з локального файла схвалень

Якщо потрібно редагувати схвалення віддаленого хоста напряму, і далі використовуйте `openclaw approvals set --gateway`
або `openclaw approvals set --node <id|name|ip>`.

## Поширені команди

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` тепер показує ефективну політику виконання для локальних цілей, Gateway і вузлів:

- запитана політика `tools.exec`
- політика файла схвалень хоста
- ефективний результат після застосування правил пріоритету

Пріоритетність є навмисною:

- файл схвалень хоста є примусовим джерелом істини
- запитана політика `tools.exec` може звужувати або розширювати намір, але ефективний результат усе одно виводиться з правил хоста
- `--node` поєднує файл схвалень хоста вузла з політикою Gateway `tools.exec`, бо обидві все ще застосовуються під час виконання
- якщо конфігурація Gateway недоступна, CLI повертається до знімка схвалень вузла й зазначає, що фінальну політику часу виконання не вдалося обчислити

## Замінити схвалення з файла

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` приймає JSON5, а не лише строгий JSON. Використовуйте або `--file`, або `--stdin`, не обидва.

## Приклад "Ніколи не запитувати" / YOLO

Для хоста, який ніколи не має зупинятися на схваленнях виконання, установіть стандартні значення схвалень хоста на `full` + `off`:

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

Варіант для вузла:

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

Це змінює лише **файл схвалень хоста**. Щоб запитана політика OpenClaw також залишалася узгодженою, установіть:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Чому `tools.exec.host=gateway` у цьому прикладі:

- `host=auto` досі означає "пісочниця, коли доступна, інакше gateway".
- YOLO стосується схвалень, а не маршрутизації.
- Якщо ви хочете виконання на хості навіть коли налаштована пісочниця, явно задайте вибір хоста за допомогою `gateway` або `/exec host=gateway`.

Пропущений `askFallback` за замовчуванням має значення `deny`. Установіть `askFallback: "full"`
явно під час оновлення хоста без UI, який має зберігати поведінку без запитів.

Локальний скорочений варіант:

```bash
openclaw exec-policy preset yolo
```

Цей локальний скорочений варіант оновлює і запитану локальну конфігурацію `tools.exec.*`, і
локальні стандартні значення схвалень разом. За наміром він еквівалентний ручному двоетапному
налаштуванню вище, але лише для локальної машини.

## Допоміжні засоби списку дозволених

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
- спільні параметри RPC вузла: `--url`, `--token`, `--timeout`, `--json`

Нотатки щодо націлювання:

- відсутність прапорців цілі означає локальний файл схвалень на диску
- `--gateway` націлюється на файл схвалень хоста Gateway
- `--node` націлюється на один хост вузла після розв’язання id, імені, IP або префікса id

`allowlist add|remove` також підтримує:

- `--agent <id>` (за замовчуванням `*`)

## Нотатки

- `--node` використовує той самий розв’язувач, що й `openclaw nodes` (id, ім’я, ip або префікс id).
- `--agent` за замовчуванням має значення `"*"`, яке застосовується до всіх агентів.
- Хост вузла має оголошувати `system.execApprovals.get/set` (застосунок macOS або безголовий хост вузла).
- Файли схвалень зберігаються для кожного хоста в каталозі стану OpenClaw
  (`$OPENCLAW_STATE_DIR/exec-approvals.json` або
  `~/.openclaw/exec-approvals.json`, коли змінну не задано).

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Схвалення виконання](/uk/tools/exec-approvals)
