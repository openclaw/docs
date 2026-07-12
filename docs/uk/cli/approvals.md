---
read_when:
    - Ви хочете редагувати схвалення виконання команд із CLI
    - Вам потрібно керувати списками дозволів на хостах Gateway або Node
summary: Довідник CLI для `openclaw approvals` і `openclaw exec-policy`
title: Схвалення
x-i18n:
    generated_at: "2026-07-12T13:03:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Керуйте схваленнями виконання команд для **локального хоста**, **хоста Gateway** або **хоста Node**. Без прапорця цільового хоста команди читають і записують локальний файл схвалень на диску. Використовуйте `--gateway`, щоб указати Gateway як ціль, або `--node <id|name|ip>`, щоб указати конкретний Node.

Псевдонім: `openclaw exec-approvals`

Пов’язане: [Схвалення виконання команд](/uk/tools/exec-approvals), [Вузли](/uk/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` — це допоміжна команда **лише для локального використання**, яка за один крок синхронізує запитану конфігурацію `tools.exec.*` і локальний файл схвалень хоста:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Попередньо визначені набори (`yolo`, `cautious`, `deny-all`) разом застосовують `host`, `security`, `ask` і `askFallback`. `set` застосовує лише передані вами прапорці; кожне прийняте значення перевіряється (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Область дії:

- Одночасно оновлює локальний файл конфігурації та локальний файл схвалень; не надсилає політику до Gateway або хоста Node.
- `--host node` відхиляється: схвалення виконання команд для Node отримуються з нього під час виконання, тому локальна команда `exec-policy` не може їх синхронізувати. Натомість використовуйте `openclaw approvals set --node <id|name|ip>`.
- `exec-policy show` позначає області `host=node` як керовані Node під час виконання замість визначення ефективної політики з локального файлу схвалень.

Для схвалень віддалених хостів безпосередньо використовуйте `openclaw approvals set --gateway` або `openclaw approvals set --node <id|name|ip>`.

## Поширені команди

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` показує ефективну політику виконання команд для цільового хоста: запитану політику `tools.exec`, політику з файлу схвалень хоста та об’єднаний ефективний результат. Вузли з нативною для хоста політикою, як-от застосунок-компаньйон для Windows, показують цю політику безпосередньо замість застосування правил обчислення політики з файлу схвалень OpenClaw.

Для вузлів, політика яких зберігається у файлі, об’єднане представлення потребує знімка політики, визначеного хостом. Для старіших вузлів ефективна політика позначається як недоступна замість припущення, що запитана політика Gateway також застосовується на хості.

<Note>
Перевизначення `/exec` для окремих сеансів не враховуються. Виконайте `/exec` у відповідному сеансі, щоб переглянути його поточні типові значення.
</Note>

Пріоритетність:

- Файл схвалень хоста є обов’язковим до виконання джерелом істини.
- Запитана політика `tools.exec` може звужувати або розширювати намір, але ефективний результат визначається правилами хоста.
- `--node` поєднує файл схвалень хоста Node з політикою `tools.exec` Gateway (обидві застосовуються під час виконання).
- Якщо конфігурація Gateway недоступна, CLI використовує знімок схвалень Node як резервний варіант і зазначає, що остаточну політику виконання обчислити не вдалося.

## Заміна схвалень із файлу

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` приймає JSON5, а не лише строгий JSON. Використовуйте або `--file`, або `--stdin`, але не обидва одночасно.

Вузли Windows із нативною для хоста політикою використовують власну структуру політики:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI спочатку зчитує поточний хеш Node і надсилає його разом з оновленням, тому паралельні локальні зміни відхиляються, а не перезаписуються. `rules` є обов’язковим, оскільки ця операція замінює повний список правил Node; `defaultAction` є необов’язковим. Node, який повідомляє, що його нативну політику вимкнено, неможливо налаштувати віддалено; спочатку ввімкніть або налаштуйте політику на цьому хості. Нативні для хоста політики не підтримують допоміжні команди `allowlist add|remove`.

## Приклад «Ніколи не запитувати» / YOLO

Установіть типові значення схвалень хоста як `full` + `off` для хоста, який ніколи не має зупинятися через схвалення виконання команд:

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

Для вузлів, які надають файл схвалень OpenClaw, використовуйте те саме тіло з `openclaw approvals set --node <id|name|ip> --stdin`. Вузли з нативною для хоста політикою потребують специфічної для їхнього власника структури, показаної вище.

Це змінює лише **файл схвалень хоста**. Щоб запитана політика OpenClaw залишалася узгодженою, також установіть:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` тут указано явно, оскільки `host=auto` усе ще означає «sandbox, якщо доступний, інакше Gateway»: YOLO стосується схвалень, а не маршрутизації. Використовуйте `gateway` (або `/exec host=gateway`), коли потрібно виконувати команди на хості навіть за наявності налаштованого sandbox.

Якщо `askFallback` не вказано, типовим значенням є `deny`. Явно встановіть `askFallback: "full"` під час оновлення хоста без інтерфейсу користувача, який має зберегти поведінку без запитів.

Локальне скорочення для такого самого наміру, лише на локальному комп’ютері:

```bash
openclaw exec-policy preset yolo
```

## Допоміжні команди списку дозволеного

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Спільні параметри

`get`, `set` і `allowlist add|remove` підтримують:

- `--node <id|name|ip>` (визначає ідентифікатор, ім’я, IP-адресу або префікс ідентифікатора; використовується той самий механізм визначення, що й у `openclaw nodes`)
- `--gateway`
- спільні параметри RPC для Node: `--url`, `--token`, `--timeout`, `--json`

За відсутності прапорця цільового хоста використовується локальний файл схвалень на диску.

`allowlist add|remove` також підтримує `--agent <id>` (типове значення — `"*"`, тобто застосування до всіх агентів).

## Примітки

- Хост Node має оголошувати підтримку `system.execApprovals.get/set` (застосунок macOS, безінтерфейсний хост Node або застосунок-компаньйон для Windows).
- Файли схвалень зберігаються окремо для кожного хоста в каталозі стану OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json` або `~/.openclaw/exec-approvals.json`, якщо змінну не встановлено.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Схвалення виконання команд](/uk/tools/exec-approvals)
