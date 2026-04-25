---
read_when:
    - Ви хочете читати або редагувати конфігурацію неінтерактивно
summary: Довідка CLI для `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Конфігурація
x-i18n:
    generated_at: "2026-04-25T05:54:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Допоміжні команди конфігурації для неінтерактивних змін у `openclaw.json`: отримання/встановлення/видалення/файл/схема/валідація
значень за шляхом і виведення активного файлу конфігурації. Запустіть без підкоманди, щоб
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

Виводить згенеровану JSON-схему для `openclaw.json` у stdout у форматі JSON.

Що вона містить:

- Поточну кореневу схему конфігурації, а також кореневе строкове поле `$schema` для інструментів редактора
- Метадані документації полів `title` і `description`, які використовує Control UI
- Вкладені об’єкти, вузли з wildcard (`*`) і вузли елементів масиву (`[]`) успадковують ті самі метадані `title` / `description`, коли існує відповідна документація поля
- Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації, коли існує відповідна документація поля
- Метадані схем плагінів і каналів у найкращому доступному вигляді, коли можна завантажити runtime-маніфести
- Чисту резервну схему, навіть коли поточна конфігурація недійсна

Пов’язаний runtime RPC:

- `config.schema.lookup` повертає один нормалізований шлях конфігурації з поверхневим
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені межі),
  відповідними метаданими підказок UI та зведеннями безпосередніх дочірніх елементів. Використовуйте це для
  деталізації в межах шляху в Control UI або власних клієнтах.

```bash
openclaw config schema
```

Перенаправте вивід у файл, якщо хочете переглянути або перевірити його іншими інструментами:

```bash
openclaw config schema > openclaw.schema.json
```

### Шляхи

Шляхи використовують крапкову або дужкову нотацію:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Використовуйте індекс списку агентів, щоб звернутися до конкретного агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Значення

Значення аналізуються як JSON5, коли це можливо; інакше вони обробляються як рядки.
Використовуйте `--strict-json`, щоб вимагати аналіз JSON5. `--json` як і раніше підтримується як застарілий псевдонім.

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
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Використовуйте `--replace` лише тоді, коли ви навмисно хочете, щоб надане значення
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

- Присвоєння SecretRef відхиляються на непідтримуваних runtime-mutable поверхнях (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, токени Webhook прив’язки потоків Discord і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).

Пакетний розбір завжди використовує пакетне корисне навантаження (`--batch-json`/`--batch-file`) як джерело істини.
`--strict-json` / `--json` не змінюють поведінку пакетного розбору.

Режим JSON path/value, як і раніше, підтримується і для SecretRef, і для провайдерів:

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

- `--provider-allowlist <ENV_VAR>` (можна повторювати)

File-провайдер (`--provider-source file`):

- `--provider-path <path>` (обов’язково)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec-провайдер (`--provider-source exec`):

- `--provider-command <path>` (обов’язково)
- `--provider-arg <arg>` (можна повторювати)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (можна повторювати)
- `--provider-pass-env <ENV_VAR>` (можна повторювати)
- `--provider-trusted-dir <path>` (можна повторювати)
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

## Сухий прогін

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

Поведінка сухого прогону:

- Режим builder: запускає перевірки розв’язності SecretRef для змінених ref/провайдерів.
- Режим JSON (`--strict-json`, `--json` або пакетний режим): запускає валідацію схеми та перевірки розв’язності SecretRef.
- Валідація політики також виконується для відомих непідтримуваних цільових поверхонь SecretRef.
- Перевірки політики оцінюють повну конфігурацію після зміни, тому записи батьківських об’єктів (наприклад, встановлення `hooks` як об’єкта) не можуть обійти валідацію непідтримуваної поверхні.
- Перевірки exec SecretRef типово пропускаються під час dry-run, щоб уникнути побічних ефектів команд.
- Використовуйте `--allow-exec` з `--dry-run`, щоб увімкнути перевірки exec SecretRef (це може виконати команди провайдера).
- `--allow-exec` працює лише з dry-run і спричиняє помилку, якщо використовується без `--dry-run`.

`--dry-run --json` виводить звіт у машинозчитуваному форматі:

- `ok`: чи пройшов dry-run
- `operations`: кількість оцінених присвоєнь
- `checks`: чи виконувалися перевірки схеми/розв’язності
- `checks.resolvabilityComplete`: чи були перевірки розв’язності виконані повністю (`false`, коли exec refs пропущено)
- `refsChecked`: кількість ref, фактично розв’язаних під час dry-run
- `skippedExecRefs`: кількість exec ref, пропущених через те, що `--allow-exec` не було встановлено
- `errors`: структуровані збої схеми/розв’язності, коли `ok=false`

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

Якщо dry-run завершується помилкою:

- `config schema validation failed`: форма вашої конфігурації після зміни недійсна; виправте шлях/значення або форму об’єкта провайдера/ref.
- `Config policy validation failed: unsupported SecretRef usage`: поверніть цей обліковий секрет до звичайного текстового/рядкового вводу і залишайте SecretRef лише на підтримуваних поверхнях.
- `SecretRef assignment(s) could not be resolved`: на цей момент не вдається розв’язати вказаний провайдер/ref (відсутня env-змінна, недійсний вказівник на файл, збій exec-провайдера або невідповідність провайдера/джерела).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run пропустив exec refs; запустіть повторно з `--allow-exec`, якщо вам потрібна перевірка розв’язності exec.
- Для пакетного режиму виправте записи з помилками і повторно запустіть `--dry-run` перед записом.

## Безпека запису

`openclaw config set` та інші засоби запису конфігурації, якими керує OpenClaw, перевіряють повну
конфігурацію після зміни перед збереженням її на диск. Якщо нове корисне навантаження не проходить
валідацію схеми або виглядає як руйнівне перезаписування, активна конфігурація залишається без змін,
а відхилене корисне навантаження зберігається поруч із нею як `openclaw.json.rejected.*`.
Шлях до активної конфігурації має вказувати на звичайний файл. Макети `openclaw.json`
із symlink не підтримуються для запису; використовуйте `OPENCLAW_CONFIG_PATH`, щоб указати безпосередньо
на реальний файл.

Для невеликих змін віддавайте перевагу запису через CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Якщо запис відхилено, перегляньте збережене корисне навантаження і виправте повну форму конфігурації:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямий запис через редактор, як і раніше, дозволений, але запущений Gateway розглядає такі зміни як
недовірені, доки вони не пройдуть валідацію. Недійсні прямі редагування можна відновити з
останньої відомої коректної резервної копії під час запуску або гарячого перезавантаження. Див.
[Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

Відновлення всього файлу зарезервоване для глобально зламаної конфігурації, наприклад помилок
розбору, збоїв схеми на кореневому рівні, збоїв застарілої міграції або змішаних збоїв плагіна
і кореня. Якщо валідація завершується помилкою лише в `plugins.entries.<id>...`,
OpenClaw зберігає активний `openclaw.json` без змін і натомість повідомляє про локальну
проблему плагіна, а не відновлює `.last-good`. Це запобігає тому, щоб зміни схеми плагіна або
невідповідність `minHostVersion` відкочували не пов’язані налаштування користувача, як-от models,
providers, профілі auth, канали, зовнішню доступність gateway, tools, memory, browser або
конфігурацію cron.

## Підкоманди

- `config file`: Виводить шлях до активного файлу конфігурації (визначається з `OPENCLAW_CONFIG_PATH` або стандартного розташування). Шлях має вказувати на звичайний файл, а не на symlink.

Після редагування перезапустіть gateway.

## Валідація

Перевіряє поточну конфігурацію на відповідність активній схемі без запуску
gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після того як `openclaw config validate` проходить успішно, ви можете скористатися локальним TUI, щоб
вбудований агент порівняв активну конфігурацію з документацією, поки ви перевіряєте
кожну зміну з того самого термінала:

Якщо валідація вже завершується помилкою, почніть із `openclaw configure` або
`openclaw doctor --fix`. `openclaw chat` не обходить захист від
недійсної конфігурації.

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
- Якщо валідація проходить, але runtime усе ще нездоровий, запустіть `openclaw doctor` або `openclaw doctor --fix` для допомоги з міграцією та відновленням.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Конфігурація](/uk/gateway/configuration)
