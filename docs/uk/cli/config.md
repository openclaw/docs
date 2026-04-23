---
read_when:
    - Ви хочете читати або редагувати конфігурацію без інтерактивного режиму
summary: Довідник CLI для `openclaw config` (get/set/unset/file/schema/validate)
title: Config
x-i18n:
    generated_at: "2026-04-23T20:46:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d9a9b081906971c44b88a67f70ee20015a88441ce2a2cfdf9c83e01a432458
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Допоміжні команди Config для неінтерактивного редагування `openclaw.json`: отримання/задання/скидання/файл/схема/перевірка
значень за шляхом і виведення активного файла конфігурації. Запуск без підкоманди
відкриває майстер налаштування (так само, як `openclaw configure`).

Кореневі параметри:

- `--section <section>`: повторюваний фільтр розділів для покрокового налаштування, коли ви запускаєте `openclaw config` без підкоманди

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
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.5":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Виводить згенеровану JSON schema для `openclaw.json` у stdout у форматі JSON.

Що вона містить:

- Поточну кореневу схему конфігурації, а також кореневе строкове поле `$schema` для інструментів редактора
- Метадані документації полів `title` і `description`, які використовує Control UI
- Вкладені об’єкти, wildcard-вузли (`*`) і вузли елементів масиву (`[]`) успадковують ті самі метадані `title` / `description`, якщо існує відповідна документація поля
- Гілки `anyOf` / `oneOf` / `allOf` теж успадковують ті самі метадані документації, якщо існує відповідна документація поля
- Метадані схеми live Plugin + channel у режимі best-effort, коли можна завантажити runtime manifests
- Чисту резервну схему, навіть якщо поточна конфігурація невалідна

Пов’язаний runtime RPC:

- `config.schema.lookup` повертає один нормалізований шлях конфігурації з поверхневим
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, загальні межі),
  підібраними метаданими підказок UI та зведеннями безпосередніх дочірніх елементів. Використовуйте це для
  деталізації за шляхом у Control UI або власних клієнтах.

```bash
openclaw config schema
```

Спрямуйте вивід у файл, якщо хочете переглянути або перевірити його іншими інструментами:

```bash
openclaw config schema > openclaw.schema.json
```

### Шляхи

Шляхи використовують крапкову або дужкову нотацію:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Використовуйте індекс у списку агентів, щоб націлитися на конкретного агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Значення

Значення, коли можливо, розбираються як JSON5; інакше вони трактуються як рядки.
Використовуйте `--strict-json`, щоб вимагати розбір як JSON5. `--json` і далі підтримується як застарілий псевдонім.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` виводить необроблене значення як JSON замість тексту, відформатованого для термінала.

Присвоєння об’єкта типово замінює цільовий шлях. Захищені шляхи map/list,
які часто містять записи, додані користувачем, як-от `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` і
`auth.profiles`, відхиляють заміни, які видалили б наявні записи, якщо
ви не передасте `--replace`.

Використовуйте `--merge`, коли додаєте записи до цих map:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.5":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Використовуйте `--replace` лише тоді, коли ви свідомо хочете, щоб передане значення
стало повним значенням цілі.

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

3. Режим побудови провайдера (лише для шляху `secrets.providers.<alias>`):

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

- Присвоєння SecretRef відхиляються на непідтримуваних runtime-mutable поверхнях (наприклад `hooks.token`, `commands.ownerDisplaySecret`, токени Webhook для прив’язки thread у Discord і JSON облікових даних WhatsApp). Див. [SecretRef Credential Surface](/uk/reference/secretref-credential-surface).

Пакетний розбір завжди використовує пакетний payload (`--batch-json`/`--batch-file`) як джерело істини.
`--strict-json` / `--json` не змінюють поведінку пакетного розбору.

Режим JSON path/value і далі підтримується як для SecretRef, так і для провайдерів:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Прапорці побудови провайдера

Цілі побудови провайдера мають використовувати шлях `secrets.providers.<alias>`.

Загальні прапорці:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (повторюваний)

File provider (`--provider-source file`):

- `--provider-path <path>` (обов’язково)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec provider (`--provider-source exec`):

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

Приклад захищеного exec provider:

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

## Dry run

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

Поведінка dry-run:

- Режим builder: виконує перевірки resolvability SecretRef для змінених ref/provider.
- Режим JSON (`--strict-json`, `--json` або пакетний режим): виконує перевірку схеми плюс перевірки resolvability SecretRef.
- Перевірка політики також виконується для відомих непідтримуваних цільових поверхонь SecretRef.
- Перевірки політики оцінюють повну конфігурацію після змін, тому запис у батьківський об’єкт (наприклад, задання `hooks` як об’єкта) не може обійти перевірку непідтримуваних поверхонь.
- Перевірки exec SecretRef типово пропускаються під час dry-run, щоб уникнути побічних ефектів команд.
- Використовуйте `--allow-exec` разом із `--dry-run`, щоб увімкнути перевірки exec SecretRef (це може виконати команди провайдера).
- `--allow-exec` призначений лише для dry-run і спричиняє помилку, якщо використовується без `--dry-run`.

`--dry-run --json` виводить машинозчитуваний звіт:

- `ok`: чи dry-run завершився успішно
- `operations`: кількість оцінених присвоєнь
- `checks`: чи виконувалися перевірки schema/resolvability
- `checks.resolvabilityComplete`: чи перевірки resolvability виконалися повністю (false, коли exec ref пропущено)
- `refsChecked`: кількість ref, які фактично були визначені під час dry-run
- `skippedExecRefs`: кількість exec ref, пропущених через те, що `--allow-exec` не було задано
- `errors`: структуровані збої schema/resolvability, коли `ok=false`

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
      ref?: string, // присутній для помилок resolvability
    },
  ],
}
```

Приклад успішного виконання:

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

Приклад невдалого виконання:

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

Якщо dry-run завершується невдало:

- `config schema validation failed`: форма вашої конфігурації після змін невалідна; виправте шлях/значення або форму об’єкта provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: поверніть цей обліковий запис до plaintext/string input і залишайте SecretRef лише на підтримуваних поверхнях.
- `SecretRef assignment(s) could not be resolved`: на цей момент не вдається визначити вказаний provider/ref (відсутня env var, невалідний вказівник на файл, збій exec provider або невідповідність provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run пропустив exec ref; повторно запустіть із `--allow-exec`, якщо вам потрібна перевірка resolvability для exec.
- Для пакетного режиму виправте записи, що завершилися помилкою, і повторно запустіть `--dry-run` перед записом.

## Безпека запису

`openclaw config set` та інші засоби запису конфігурації, якими керує OpenClaw, перевіряють повну
конфігурацію після змін перед записом на диск. Якщо новий payload не проходить перевірку схеми
або виглядає як руйнівне перезаписування, активна конфігурація залишається без змін,
а відхилений payload зберігається поруч із нею як `openclaw.json.rejected.*`.
Шлях активної конфігурації має вказувати на звичайний файл. Макети `openclaw.json`
із symlink не підтримуються для запису; натомість використовуйте `OPENCLAW_CONFIG_PATH`, щоб напряму вказати
на реальний файл.

Для невеликих змін надавайте перевагу запису через CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Якщо запис було відхилено, перегляньте збережений payload і виправте повну форму конфігурації:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямий запис із редактора все ще дозволений, але запущений Gateway розглядає його як
недовірений, доки він не пройде перевірку. Невалідні прямі редагування можна відновити з
резервної копії останнього коректного стану під час запуску або гарячого перезавантаження. Див.
[Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Підкоманди

- `config file`: вивести шлях до активного файла конфігурації (визначається з `OPENCLAW_CONFIG_PATH` або типового розташування). Шлях має вказувати на звичайний файл, а не symlink.

Після редагування перезапустіть Gateway.

## Перевірка

Перевірте поточну конфігурацію щодо активної схеми без запуску
Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після того як `openclaw config validate` почне проходити успішно, ви можете використовувати локальний TUI, щоб
вбудований агент порівнював активну конфігурацію з документацією, поки ви перевіряєте
кожну зміну з того самого термінала:

Якщо перевірка вже завершується помилкою, почніть із `openclaw configure` або
`openclaw doctor --fix`. `openclaw chat` не обходить захист від невалідної конфігурації.

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

- Попросіть агента порівняти вашу поточну конфігурацію з відповідною сторінкою документації та запропонувати найменше виправлення.
- Застосуйте цільові зміни за допомогою `openclaw config set` або `openclaw configure`.
- Повторно запускайте `openclaw config validate` після кожної зміни.
- Якщо перевірка проходить, але runtime усе ще працює некоректно, запустіть `openclaw doctor` або `openclaw doctor --fix` для допомоги з міграцією та відновленням.
