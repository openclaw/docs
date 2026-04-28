---
read_when:
    - Ви хочете читати або редагувати конфігурацію без інтерактивного режиму
sidebarTitle: Config
summary: Довідка CLI для `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Конфігурація
x-i18n:
    generated_at: "2026-04-26T07:47:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

Допоміжні команди конфігурації для неінтерактивних змін у `openclaw.json`: отримання/встановлення/видалення/файл/схема/перевірка значень за шляхом і виведення активного файлу конфігурації. Запустіть без підкоманди, щоб відкрити майстер налаштування (так само, як `openclaw configure`).

## Кореневі параметри

<ParamField path="--section <section>" type="string">
  Повторюваний фільтр розділів для керованого налаштування, коли ви запускаєте `openclaw config` без підкоманди.
</ParamField>

Підтримувані керовані розділи: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

<AccordionGroup>
  <Accordion title="Що вона містить">
    - Поточну кореневу схему конфігурації, а також кореневе рядкове поле `$schema` для інструментів редактора.
    - Поля документаційних метаданих `title` і `description`, які використовує Control UI.
    - Вкладені об’єкти, вузли з шаблоном (`*`) і вузли елементів масиву (`[]`) успадковують ті самі метадані `title` / `description`, якщо існує відповідна документація поля.
    - Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі документаційні метадані, якщо існує відповідна документація поля.
    - Метадані схеми live Plugin + channel у режимі best-effort, коли можна завантажити runtime-маніфести.
    - Коректну резервну схему, навіть якщо поточна конфігурація невалідна.

  </Accordion>
  <Accordion title="Пов’язаний runtime RPC">
    `config.schema.lookup` повертає один нормалізований шлях конфігурації з поверхневим вузлом схеми (`title`, `description`, `type`, `enum`, `const`, типові обмеження), зіставленими метаданими підказок UI та зведеннями безпосередніх дочірніх елементів. Використовуйте це для деталізації в межах шляху в Control UI або власних клієнтах.
  </Accordion>
</AccordionGroup>

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

Використовуйте індекс у списку агентів, щоб вибрати конкретного агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Значення

Значення, якщо можливо, аналізуються як JSON5; інакше вони обробляються як рядки. Використовуйте `--strict-json`, щоб вимагати аналізу як JSON5. `--json` і надалі підтримується як застарілий псевдонім.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` виводить необроблене значення як JSON замість форматованого для термінала тексту.

<Note>
Присвоєння об’єкта типово замінює цільовий шлях. Захищені шляхи map/list, які часто містять додані користувачем записи, такі як `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` і `auth.profiles`, відхиляють заміни, які видалили б наявні записи, якщо ви не передасте `--replace`.
</Note>

Використовуйте `--merge`, коли додаєте записи до цих map:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Використовуйте `--replace` лише тоді, коли ви свідомо хочете, щоб надане значення стало повним цільовим значенням.

## Режими `config set`

`openclaw config set` підтримує чотири стилі присвоєння:

<Tabs>
  <Tab title="Режим значення">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Режим конструктора SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Режим конструктора провайдера">
    Режим конструктора провайдера націлюється лише на шляхи `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Пакетний режим">
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

  </Tab>
</Tabs>

<Warning>
Присвоєння SecretRef відхиляються на непідтримуваних runtime-змінюваних поверхнях (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, токени Webhook прив’язки гілок Discord і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Warning>

Пакетний аналіз завжди використовує пакетне навантаження (`--batch-json`/`--batch-file`) як джерело істини. `--strict-json` / `--json` не змінюють поведінку пакетного аналізу.

Режим JSON path/value також і далі підтримується як для SecretRef, так і для провайдерів:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Прапорці конструктора провайдера

Цілі конструктора провайдера мають використовувати `secrets.providers.<alias>` як шлях.

<AccordionGroup>
  <Accordion title="Загальні прапорці">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Провайдер env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (можна повторювати)

  </Accordion>
  <Accordion title="Провайдер file (--provider-source file)">
    - `--provider-path <path>` (обов’язково)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Провайдер exec (--provider-source exec)">
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

  </Accordion>
</AccordionGroup>

Приклад посиленого провайдера exec:

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

<AccordionGroup>
  <Accordion title="Поведінка dry-run">
    - Режим конструктора: виконує перевірки можливості розв’язання SecretRef для змінених ref/провайдерів.
    - Режим JSON (`--strict-json`, `--json` або пакетний режим): виконує перевірку схеми плюс перевірки можливості розв’язання SecretRef.
    - Також виконується перевірка політик для відомих непідтримуваних цільових поверхонь SecretRef.
    - Перевірки політик оцінюють повну конфігурацію після змін, тому записи батьківських об’єктів (наприклад, встановлення `hooks` як об’єкта) не можуть обійти перевірку непідтримуваних поверхонь.
    - Перевірки SecretRef exec типово пропускаються під час dry-run, щоб уникнути побічних ефектів виконання команд.
    - Використовуйте `--allow-exec` з `--dry-run`, щоб увімкнути перевірки SecretRef exec (це може виконувати команди провайдера).
    - `--allow-exec` працює лише для dry-run і повертає помилку, якщо використовується без `--dry-run`.

  </Accordion>
  <Accordion title="Поля --dry-run --json">
    `--dry-run --json` виводить машиночитаний звіт:

    - `ok`: чи пройшов dry-run
    - `operations`: кількість оцінених присвоєнь
    - `checks`: чи виконувалися перевірки схеми/можливості розв’язання
    - `checks.resolvabilityComplete`: чи були перевірки можливості розв’язання виконані до кінця (`false`, коли ref exec пропущено)
    - `refsChecked`: кількість ref, фактично розв’язаних під час dry-run
    - `skippedExecRefs`: кількість ref exec, пропущених через те, що не було встановлено `--allow-exec`
    - `errors`: структуровані збої схеми/можливості розв’язання, коли `ok=false`

  </Accordion>
</AccordionGroup>

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
      ref?: string, // присутнє для помилок можливості розв’язання
    },
  ],
}
```

<Tabs>
  <Tab title="Приклад успіху">
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
  </Tab>
  <Tab title="Приклад помилки">
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
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Якщо dry-run завершується помилкою">
    - `config schema validation failed`: форма вашої конфігурації після змін невалідна; виправте шлях/значення або форму об’єкта provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: поверніть цей обліковий запис до звичайного текстового/рядкового введення й використовуйте SecretRef лише на підтримуваних поверхнях.
    - `SecretRef assignment(s) could not be resolved`: на цей момент не вдається розв’язати вказаний provider/ref (відсутня змінна середовища, недійсний вказівник на файл, збій провайдера exec або невідповідність provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run пропустив ref exec; повторно запустіть із `--allow-exec`, якщо вам потрібна перевірка можливості розв’язання exec.
    - Для пакетного режиму виправте записи, що завершилися помилкою, і повторно запустіть `--dry-run` перед записом.

  </Accordion>
</AccordionGroup>

## Безпека запису

`openclaw config set` та інші засоби запису конфігурації, якими керує OpenClaw, перевіряють усю конфігурацію після змін перед її збереженням на диск. Якщо нове навантаження не проходить перевірку схеми або схоже на руйнівне перезаписування, активна конфігурація залишається без змін, а відхилене навантаження зберігається поруч як `openclaw.json.rejected.*`.

<Warning>
Шлях до активної конфігурації має вказувати на звичайний файл. Компонування `openclaw.json` із symlink не підтримується для запису; замість цього використовуйте `OPENCLAW_CONFIG_PATH`, щоб указати безпосередньо на справжній файл.
</Warning>

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

Прямі зміни в редакторі все ще дозволені, але запущений Gateway вважає їх недовіреними, доки вони не пройдуть перевірку. Невалідні прямі зміни можуть бути відновлені з останньої відомої коректної резервної копії під час запуску або гарячого перезавантаження. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

Відновлення всього файлу зарезервоване для глобально зламаної конфігурації, як-от помилки аналізу, збої схеми на кореневому рівні, помилки застарілої міграції або змішані збої Plugin і кореня. Якщо перевірка не проходить лише в `plugins.entries.<id>...`, OpenClaw залишає активний `openclaw.json` без змін і натомість повідомляє про локальну проблему Plugin, а не відновлює `.last-good`. Це запобігає тому, щоб зміни схеми Plugin або невідповідність `minHostVersion` відкочували не пов’язані налаштування користувача, такі як models, providers, auth profiles, channels, доступність gateway, tools, memory, browser або конфігурація Cron.

## Підкоманди

- `config file`: Вивести шлях до активного файлу конфігурації (визначається з `OPENCLAW_CONFIG_PATH` або стандартного розташування). Шлях має вказувати на звичайний файл, а не symlink.

Після змін перезапустіть gateway.

## Перевірка

Перевірити поточну конфігурацію за активною схемою без запуску gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після того як `openclaw config validate` почне проходити успішно, ви можете використати локальний TUI, щоб вбудований агент порівняв активну конфігурацію з документацією, поки ви перевіряєте кожну зміну в тому самому терміналі:

<Note>
Якщо перевірка вже не проходить, почніть з `openclaw configure` або `openclaw doctor --fix`. `openclaw chat` не обходить захист від невалідної конфігурації.
</Note>

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

<Steps>
  <Step title="Порівняння з документацією">
    Попросіть агента порівняти вашу поточну конфігурацію з відповідною сторінкою документації та запропонувати найменше виправлення.
  </Step>
  <Step title="Застосування точкових змін">
    Застосуйте точкові зміни за допомогою `openclaw config set` або `openclaw configure`.
  </Step>
  <Step title="Повторна перевірка">
    Повторно запускайте `openclaw config validate` після кожної зміни.
  </Step>
  <Step title="Doctor для runtime-проблем">
    Якщо перевірка проходить, але runtime усе ще нездоровий, запустіть `openclaw doctor` або `openclaw doctor --fix` для допомоги з міграцією та відновленням.
  </Step>
</Steps>

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Конфігурація](/uk/gateway/configuration)
