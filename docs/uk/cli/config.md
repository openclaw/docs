---
read_when:
    - Ви хочете читати або редагувати конфігурацію в неінтерактивному режимі
summary: Довідка CLI для `openclaw config` (get/set/unset/file/schema/validate)
title: Конфігурація
x-i18n:
    generated_at: "2026-04-25T05:04:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60935e011a72e08c47dc21a634a78ce11edf261ff9896009519dc4e04561f465
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Допоміжні засоби конфігурації для неінтерактивних змін у `openclaw.json`: get/set/unset/file/schema/validate
значень за шляхом і виведення активного файла конфігурації. Запустіть без підкоманди, щоб
відкрити майстер налаштування (так само, як `openclaw configure`).

Кореневі параметри:

- `--section <section>`: повторюваний фільтр розділів покрокового налаштування, коли ви запускаєте `openclaw config` без підкоманди

Підтримувані розділи покрокового налаштування:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Приклади

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Виводить згенеровану JSON-схему для `openclaw.json` у stdout як JSON.

Що вона містить:

- Поточну кореневу схему конфігурації, а також кореневе строкове поле `$schema` для інструментів редактора
- Метадані документації полів `title` і `description`, які використовує інтерфейс Control UI
- Вкладені об’єкти, вузли з шаблоном (`*`) і вузли елементів масиву (`[]`) успадковують ті самі метадані `title` / `description`, коли існує відповідна документація поля
- Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації, коли існує відповідна документація поля
- Метадані схем для live Plugin + channel у режимі best-effort, коли можна завантажити runtime-маніфести
- Чисту резервну схему навіть тоді, коли поточна конфігурація недійсна

Пов’язаний runtime RPC:

- `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, загальні межі),
  відповідними метаданими підказок UI та зведеннями безпосередніх дочірніх елементів. Використовуйте це для
  деталізації в межах шляху в Control UI або в користувацьких клієнтах.

```bash
openclaw config schema
```

Спрямуйте вивід у файл, якщо хочете переглянути або перевірити його за допомогою інших інструментів:

```bash
openclaw config schema > openclaw.schema.json
```

### Шляхи

Шляхи використовують крапкову або дужкову нотацію:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Використовуйте індекс списку агентів, щоб націлитися на конкретного агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Значення

Значення, коли це можливо, розбираються як JSON5; інакше вони розглядаються як рядки.
Використовуйте `--strict-json`, щоб вимагати розбір JSON5. `--json` усе ще підтримується як застарілий псевдонім.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` виводить необроблене значення як JSON замість відформатованого для термінала тексту.

Присвоєння об’єкта за замовчуванням замінює цільовий шлях. Захищені шляхи map/list,
які часто містять додані користувачем записи, як-от `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` і
`auth.profiles`, відхиляють заміни, які видалили б наявні записи, якщо ви не передасте `--replace`.

Використовуйте `--merge`, коли додаєте записи до цих map:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Використовуйте `--replace` лише тоді, коли ви свідомо хочете, щоб надане значення
стало повним цільовим значенням.

## Режими `config set`

`openclaw config set` підтримує чотири стилі присвоєння:

1. Режим значення: `openclaw config set <path> <value>`
2. Режим побудови SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Режим побудови провайдера (лише шлях `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Пакетний режим (`--batch-json` або `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

Примітка щодо політики:

- Присвоєння SecretRef відхиляються на непідтримуваних runtime-змінюваних поверхнях (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, токени Webhook для прив’язки Discord thread і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).

Пакетний розбір завжди використовує пакетне навантаження (`--batch-json`/`--batch-file`) як єдине джерело істини.
`--strict-json` / `--json` не змінюють поведінку пакетного розбору.

Режим шляху/значення JSON усе ще підтримується і для SecretRef, і для провайдерів:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Прапорці побудови провайдера

Цілі побудови провайдера мають використовувати `secrets.providers.<alias>` як шлях.

Загальні прапорці:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env-провайдер (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (повторюваний)

File-провайдер (`--provider-source file`):

- `--provider-path <path>` (обов’язково)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec-провайдер (`--provider-source exec`):

- `--provider-command <path>` (обов’язково)
- `--provider-arg <arg>` (повторюваний)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (повторюваний)
- `--provider-pass-env <ENV_VAR>` (повторюваний)
- `--provider-trusted-dir <path>` (повторюваний)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Приклад посиленого exec-провайдера:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Пробний запуск

Використовуйте `--dry-run`, щоб перевірити зміни без запису в `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Поведінка пробного запуску:

- Режим побудови: запускає перевірки розв’язуваності SecretRef для змінених ref/провайдерів.
- Режим JSON (`--strict-json`, `--json` або пакетний режим): запускає перевірку схеми та перевірки розв’язуваності SecretRef.
- Також запускається перевірка політики для відомих непідтримуваних цільових поверхонь SecretRef.
- Перевірки політики оцінюють повну конфігурацію після змін, тому запис у батьківський об’єкт (наприклад, встановлення `hooks` як об’єкта) не може обійти перевірку непідтримуваних поверхонь.
- Перевірки exec SecretRef під час пробного запуску за замовчуванням пропускаються, щоб уникнути побічних ефектів команд.
- Використовуйте `--allow-exec` разом із `--dry-run`, щоб явно дозволити перевірки exec SecretRef (це може виконати команди провайдера).
- `--allow-exec` працює лише для пробного запуску й призводить до помилки, якщо використовується без `--dry-run`.

`--dry-run --json` виводить машиночитаний звіт:

- `ok`: чи пройшов пробний запуск
- `operations`: кількість оцінених присвоєнь
- `checks`: чи виконувалися перевірки схеми/розв’язуваності
- `checks.resolvabilityComplete`: чи перевірки розв’язуваності були виконані до кінця (`false`, коли exec ref пропущено)
- `refsChecked`: кількість ref, фактично розв’язаних під час пробного запуску
- `skippedExecRefs`: кількість exec ref, пропущених через те, що `--allow-exec` не було встановлено
- `errors`: структуровані збої схеми/розв’язуваності, коли `ok=false`

### Форма JSON-виводу

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

Приклад успіху:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

Приклад помилки:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Якщо пробний запуск завершується помилкою:

- `config schema validation failed`: форма вашої конфігурації після змін недійсна; виправте шлях/значення або форму об’єкта провайдера/ref.
- `Config policy validation failed: unsupported SecretRef usage`: перенесіть цей обліковий даний назад до звичайного тексту/рядкового вводу та залишайте SecretRef лише на підтримуваних поверхнях.
- `SecretRef assignment(s) could not be resolved`: на цей момент указаний провайдер/ref не може бути розв’язаний (відсутня змінна env, недійсний вказівник на файл, збій exec-провайдера або невідповідність провайдера/джерела).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: пробний запуск пропустив exec ref; повторно запустіть із `--allow-exec`, якщо вам потрібна перевірка розв’язуваності exec.
- Для пакетного режиму виправте записи, які завершилися помилкою, і повторно запустіть `--dry-run` перед записом.

## Безпека запису

`openclaw config set` та інші інструменти запису конфігурації, якими керує OpenClaw, перевіряють повну
конфігурацію після змін перед її збереженням на диск. Якщо нове навантаження не проходить
перевірку схеми або виглядає як руйнівне перезаписування, активна конфігурація залишається без змін,
а відхилене навантаження зберігається поруч із нею як `openclaw.json.rejected.*`.
Шлях до активної конфігурації має вказувати на звичайний файл. Макети з `openclaw.json`
через символічні посилання не підтримуються для запису; натомість використовуйте `OPENCLAW_CONFIG_PATH`,
щоб указати безпосередньо на реальний файл.

Для невеликих змін віддавайте перевагу запису через CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Якщо запис відхилено, перегляньте збережене навантаження й виправте повну форму конфігурації:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямий запис через редактор усе ще дозволений, але запущений Gateway розглядає такі зміни як
ненадійні, доки вони не пройдуть перевірку. Недійсні прямі редагування можна відновити з
останньої відомої справної резервної копії під час запуску або гарячого перезавантаження. Див.
[Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

Відновлення всього файла зарезервоване для глобально пошкодженої конфігурації, зокрема для помилок
розбору, збоїв схеми на кореневому рівні, збоїв застарілої міграції або змішаних збоїв Plugin
і кореневої конфігурації. Якщо перевірка завершується помилкою лише в `plugins.entries.<id>...`,
OpenClaw залишає активний `openclaw.json` на місці й натомість повідомляє про локальну
проблему Plugin, а не відновлює `.last-good`. Це запобігає тому, щоб зміни схеми Plugin або
невідповідність `minHostVersion` відкочували не пов’язані налаштування користувача, як-от models,
providers, auth profiles, channels, exposure Gateway, tools, memory, browser або
конфігурацію Cron.

## Підкоманди

- `config file`: Виводить шлях до активного файла конфігурації (визначений із `OPENCLAW_CONFIG_PATH` або стандартного розташування). Шлях має вказувати на звичайний файл, а не на символічне посилання.

Перезапустіть gateway після редагувань.

## Перевірка

Перевіряє поточну конфігурацію на відповідність активній схемі без запуску
gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після того як `openclaw config validate` пройде успішно, ви можете використовувати локальний TUI, щоб
вбудований агент порівняв активну конфігурацію з документацією, поки ви перевіряєте
кожну зміну з того самого термінала:

Якщо перевірка вже завершується помилкою, почніть з `openclaw configure` або
`openclaw doctor --fix`. `openclaw chat` не обходить
захист від недійсної конфігурації.

```bash
openclaw chat
```

Потім усередині TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Типовий цикл виправлення:

- Попросіть агента порівняти вашу поточну конфігурацію з відповідною сторінкою документації та запропонувати найменше можливе виправлення.
- Застосуйте цільові зміни за допомогою `openclaw config set` або `openclaw configure`.
- Повторно запускайте `openclaw config validate` після кожної зміни.
- Якщо перевірка проходить, але runtime усе ще нездоровий, запустіть `openclaw doctor` або `openclaw doctor --fix` для допомоги з міграцією та відновленням.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Конфігурація](/uk/gateway/configuration)
