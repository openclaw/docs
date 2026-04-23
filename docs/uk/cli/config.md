---
read_when:
    - Ви хочете читати або редагувати конфігурацію в неінтерактивному режимі
summary: Довідка CLI для `openclaw config` (get/set/unset/file/schema/validate)
title: конфігурація
x-i18n:
    generated_at: "2026-04-23T06:17:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b496b6c02eeb144bfe800b801ea48a178b02bc7a87197dbf189b27d6fcf41c9
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Допоміжні команди конфігурації для неінтерактивного редагування в `openclaw.json`: get/set/unset/file/schema/validate
значень за шляхом і виведення активного файла конфігурації. Запустіть без підкоманди, щоб
відкрити майстер налаштування (те саме, що `openclaw configure`).

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
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
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
- Метадані документації полів `title` і `description`, що використовуються інтерфейсом керування
- Вкладені об’єкти, вузли wildcard (`*`) і елементи масиву (`[]`) успадковують ті самі метадані `title` / `description`, коли для відповідного поля існує документація
- Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації, коли для відповідного поля існує документація
- Live-метадані схеми Plugin + channel за принципом best-effort, коли можна завантажити маніфести середовища виконання
- Чисту резервну схему навіть тоді, коли поточна конфігурація невалідна

Пов’язаний runtime RPC:

- `config.schema.lookup` повертає один нормалізований шлях конфігурації з поверхневим
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені межі),
  відповідними метаданими UI hints і зведеннями безпосередніх дочірніх елементів. Використовуйте це для
  деталізації за шляхом в інтерфейсі керування або в користувацьких клієнтах.

```bash
openclaw config schema
```

Спрямуйте результат у файл, якщо хочете перевірити або валідувати його іншими інструментами:

```bash
openclaw config schema > openclaw.schema.json
```

### Шляхи

Шляхи використовують крапкову нотацію або нотацію з дужками:

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

Значення розбираються як JSON5, коли це можливо; інакше вони трактуються як рядки.
Використовуйте `--strict-json`, щоб вимагати розбір JSON5. `--json` і далі підтримується як застарілий псевдонім.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` виводить необроблене значення як JSON замість тексту, відформатованого для термінала.

Присвоєння об’єкта типово замінює цільовий шлях. Захищені шляхи map/list,
які часто містять записи, додані користувачем, наприклад `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` і
`auth.profiles`, відмовляють у заміні, яка видалила б наявні записи, якщо
ви не передасте `--replace`.

Використовуйте `--merge`, коли додаєте записи до цих map:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
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

3. Режим побудови provider (лише для шляху `secrets.providers.<alias>`):

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

- Присвоєння SecretRef відхиляються на непідтримуваних поверхнях runtime-mutable (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, токени Webhook для прив’язки потоків Discord і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).

Пакетний розбір завжди використовує пакетне корисне навантаження (`--batch-json`/`--batch-file`) як джерело істини.
`--strict-json` / `--json` не змінюють поведінку пакетного розбору.

Режим шляху/значення JSON і далі підтримується як для SecretRef, так і для provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Прапорці побудови provider

Цілі побудови provider повинні використовувати `secrets.providers.<alias>` як шлях.

Поширені прапорці:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (можна повторювати)

File provider (`--provider-source file`):

- `--provider-path <path>` (обов’язково)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Exec provider (`--provider-source exec`):

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

Приклад hardened exec provider:

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

## Сухий запуск

Використовуйте `--dry-run`, щоб валідувати зміни без запису в `openclaw.json`.

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

Поведінка сухого запуску:

- Режим побудови: запускає перевірки розв’язуваності SecretRef для змінених ref/provider.
- Режим JSON (`--strict-json`, `--json` або пакетний режим): запускає валідацію схеми та перевірки розв’язуваності SecretRef.
- Валідація політики також запускається для відомих непідтримуваних цільових поверхонь SecretRef.
- Перевірки політики оцінюють повну конфігурацію після змін, тому записи батьківських об’єктів (наприклад, встановлення `hooks` як об’єкта) не можуть обійти валідацію непідтримуваних поверхонь.
- Перевірки exec SecretRef типово пропускаються під час сухого запуску, щоб уникнути побічних ефектів команд.
- Використовуйте `--allow-exec` разом із `--dry-run`, щоб увімкнути перевірки exec SecretRef (це може виконати команди provider).
- `--allow-exec` призначений лише для сухого запуску й спричиняє помилку, якщо використовується без `--dry-run`.

`--dry-run --json` виводить машинозчитуваний звіт:

- `ok`: чи пройдено сухий запуск
- `operations`: кількість оцінених присвоєнь
- `checks`: чи запускалися перевірки схеми/розв’язуваності
- `checks.resolvabilityComplete`: чи були перевірки розв’язуваності виконані до кінця (`false`, коли exec ref пропущено)
- `refsChecked`: кількість ref, фактично розв’язаних під час сухого запуску
- `skippedExecRefs`: кількість exec ref, пропущених через те, що не було встановлено `--allow-exec`
- `errors`: структуровані збої схеми/розв’язуваності, коли `ok=false`

### Форма виводу JSON

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

Якщо сухий запуск завершується помилкою:

- `config schema validation failed`: форма вашої конфігурації після змін невалідна; виправте шлях/значення або форму об’єкта provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: перенесіть цей обліковий запис назад у plaintext/string input і залишайте SecretRef лише на підтримуваних поверхнях.
- `SecretRef assignment(s) could not be resolved`: на цей момент не вдається розв’язати вказаний provider/ref (відсутня змінна середовища, невалідний вказівник на файл, збій exec provider або невідповідність provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: сухий запуск пропустив exec ref; перезапустіть з `--allow-exec`, якщо вам потрібна валідація розв’язуваності exec.
- Для пакетного режиму виправте записи, які не пройшли, і перед записом повторно запустіть `--dry-run`.

## Безпека запису

`openclaw config set` та інші засоби запису конфігурації, якими керує OpenClaw, валідують повну
конфігурацію після змін перед її збереженням на диск. Якщо нове корисне навантаження не проходить
валідацію схеми або виглядає як руйнівне перезаписування, активна конфігурація залишається без змін,
а відхилене корисне навантаження зберігається поруч як `openclaw.json.rejected.*`.
Активний шлях конфігурації має бути звичайним файлом. Макети `openclaw.json`
із символічними посиланнями не підтримуються для запису; натомість використовуйте `OPENCLAW_CONFIG_PATH`, щоб вказати безпосередньо
на реальний файл.

Для невеликих змін віддавайте перевагу запису через CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Якщо запис відхилено, перевірте збережене корисне навантаження й виправте повну форму конфігурації:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямий запис через редактор і далі дозволений, але запущений Gateway розглядає такі зміни як
недовірені, доки вони не пройдуть валідацію. Невалідні прямі редагування можна відновити з
резервної копії останнього відомого коректного стану під час запуску або гарячого перезавантаження. Див.
[Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Підкоманди

- `config file`: Вивести шлях до активного файла конфігурації (визначений з `OPENCLAW_CONFIG_PATH` або стандартного розташування). Шлях має вказувати на звичайний файл, а не на символічне посилання.

Після редагувань перезапустіть gateway.

## Валідація

Валідуйте поточну конфігурацію щодо активної схеми без запуску
gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після того як `openclaw config validate` почне проходити, ви можете використовувати локальний TUI, щоб
вбудований агент порівняв активну конфігурацію з документацією, поки ви валідуєте
кожну зміну з того самого термінала:

Якщо валідація вже не проходить, почніть з `openclaw configure` або
`openclaw doctor --fix`. `openclaw chat` не обходить захист від
невалідної конфігурації.

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
- Якщо валідація проходить, але середовище виконання все ще нездорове, запустіть `openclaw doctor` або `openclaw doctor --fix` для допомоги з міграцією та виправленням.
