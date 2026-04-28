---
read_when:
    - Ви хочете читати або редагувати конфігурацію неінтерактивно
sidebarTitle: Config
summary: Довідник CLI для `openclaw config` (get/set/unset/file/schema/validate)
title: Конфігурація
x-i18n:
    generated_at: "2026-04-28T11:06:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e90f979a102a6c54f8458f8a2c7f36bec5b1e82ea4bdd30e9c3a4b1d903cf11
    source_path: cli/config.md
    workflow: 16
---

Помічники конфігурації для неінтерактивних змін у `openclaw.json`: отримання/задання/скасування/файл/схема/перевірка значень за шляхом і виведення активного файла конфігурації. Запустіть без підкоманди, щоб відкрити майстер налаштування (так само, як `openclaw configure`).

## Кореневі параметри

<ParamField path="--section <section>" type="string">
  Повторюваний фільтр розділу керованого налаштування, коли ви запускаєте `openclaw config` без підкоманди.
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

Виводить згенеровану схему JSON для `openclaw.json` у stdout як JSON.

<AccordionGroup>
  <Accordion title="What it includes">
    - Поточна коренева схема конфігурації, а також кореневе рядкове поле `$schema` для інструментів редактора.
    - Метадані документації полів `title` і `description`, які використовує Control UI.
    - Вкладені об’єкти, вузли з wildcard (`*`) і елементи масивів (`[]`) успадковують ті самі метадані `title` / `description`, коли існує відповідна документація полів.
    - Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації, коли існує відповідна документація полів.
    - Метадані схем живих Plugin + каналів у режимі найкращої спроби, коли runtime-маніфести можна завантажити.
    - Чиста резервна схема навіть тоді, коли поточна конфігурація недійсна.

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` повертає один нормалізований шлях конфігурації з поверхневим вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені межі), відповідними метаданими підказок UI та зведеннями безпосередніх дочірніх елементів. Використовуйте це для деталізації за шляхом у Control UI або власних клієнтах.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Передайте це у файл, коли хочете перевірити або провалідувати схему іншими інструментами:

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

Значення за можливості розбираються як JSON5; інакше вони вважаються рядками. Використовуйте `--strict-json`, щоб вимагати розбору JSON5. `--json` залишається підтримуваним як застарілий псевдонім.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` виводить сире значення як JSON замість тексту, відформатованого для термінала.

<Note>
Присвоєння об’єкта типово замінює цільовий шлях. Захищені шляхи мап/списків, які зазвичай містять додані користувачем записи, як-от `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` і `auth.profiles`, відхиляють заміни, які видалили б наявні записи, якщо ви не передасте `--replace`.
</Note>

Використовуйте `--merge`, коли додаєте записи до таких мап:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Використовуйте `--replace` лише тоді, коли навмисно хочете, щоб надане значення стало повним цільовим значенням.

## Режими `config set`

`openclaw config set` підтримує чотири стилі присвоєння:

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    Режим конструктора провайдера працює лише зі шляхами `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
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
Присвоєння SecretRef відхиляються на непідтримуваних runtime-змінних поверхнях (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, токени webhook для прив’язки потоків Discord і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Warning>

Пакетний розбір завжди використовує пакетне навантаження (`--batch-json`/`--batch-file`) як джерело істини. `--strict-json` / `--json` не змінюють поведінку пакетного розбору.

Режим шляху/значення JSON залишається підтримуваним як для SecretRefs, так і для провайдерів:

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
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (повторюваний)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (обов’язковий)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
    - `--provider-command <path>` (обов’язковий)
    - `--provider-arg <arg>` (повторюваний)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (повторюваний)
    - `--provider-pass-env <ENV_VAR>` (повторюваний)
    - `--provider-trusted-dir <path>` (повторюваний)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

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

<AccordionGroup>
  <Accordion title="Dry-run behavior">
    - Режим конструктора: виконує перевірки розв’язності SecretRef для змінених посилань/провайдерів.
    - Режим JSON (`--strict-json`, `--json` або пакетний режим): виконує перевірку схеми, а також перевірки розв’язності SecretRef.
    - Перевірка політик також виконується для відомих непідтримуваних цільових поверхонь SecretRef.
    - Перевірки політик оцінюють повну конфігурацію після зміни, тож записи батьківських об’єктів (наприклад, встановлення `hooks` як об’єкта) не можуть обійти перевірку непідтримуваних поверхонь.
    - Перевірки exec SecretRef типово пропускаються під час пробного запуску, щоб уникнути побічних ефектів команд.
    - Використовуйте `--allow-exec` з `--dry-run`, щоб явно ввімкнути перевірки exec SecretRef (це може виконати команди провайдера).
    - `--allow-exec` працює лише з пробним запуском і дає помилку, якщо використовується без `--dry-run`.

  </Accordion>
  <Accordion title="--dry-run --json fields">
    `--dry-run --json` виводить машинозчитуваний звіт:

    - `ok`: чи пройшов пробний запуск
    - `operations`: кількість оцінених присвоєнь
    - `checks`: чи виконувалися перевірки схеми/розв’язності
    - `checks.resolvabilityComplete`: чи перевірки розв’язності виконалися до завершення (false, коли exec-посилання пропущено)
    - `refsChecked`: кількість посилань, фактично розв’язаних під час пробного запуску
    - `skippedExecRefs`: кількість exec-посилань, пропущених через те, що `--allow-exec` не встановлено
    - `errors`: структуровані помилки схеми/розв’язності, коли `ok=false`

  </Accordion>
</AccordionGroup>

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

<Tabs>
  <Tab title="Success example">
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
  <Tab title="Failure example">
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
    - `config schema validation failed`: форма конфігурації після зміни недійсна; виправте шлях/значення або форму об’єкта provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: поверніть ці облікові дані до відкритого тексту/рядкового вводу й використовуйте SecretRefs лише на підтримуваних поверхнях.
    - `SecretRef assignment(s) could not be resolved`: зазначений provider/ref наразі неможливо розв’язати (відсутня змінна середовища, недійсний вказівник на файл, помилка exec-провайдера або невідповідність provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run пропустив exec-посилання; перезапустіть із `--allow-exec`, якщо вам потрібна перевірка розв’язуваності exec.
    - Для пакетного режиму виправте записи з помилками й повторно запустіть `--dry-run` перед записом.

  </Accordion>
</AccordionGroup>

## Безпека запису

`openclaw config set` та інші засоби запису конфігурації, що належать OpenClaw, перевіряють повну конфігурацію після зміни перед збереженням її на диск. Якщо нове корисне навантаження не проходить перевірку схеми або схоже на руйнівне перезаписування, активна конфігурація залишається без змін, а відхилене корисне навантаження зберігається поруч як `openclaw.json.rejected.*`.

<Warning>
Шлях активної конфігурації має бути звичайним файлом. Макети `openclaw.json` із символічними посиланнями не підтримуються для запису; натомість використовуйте `OPENCLAW_CONFIG_PATH`, щоб указати безпосередньо на справжній файл.
</Warning>

Для невеликих змін віддавайте перевагу записам через CLI:

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

Прямі записи через редактор усе ще дозволені, але запущений Gateway вважає їх ненадійними, доки вони не пройдуть перевірку. Недійсні прямі зміни можуть бути відновлені з останньої відомої справної резервної копії під час запуску або гарячого перезавантаження. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

Відновлення всього файла призначене для глобально пошкодженої конфігурації, наприклад помилок розбору, помилок схеми на кореневому рівні, помилок застарілої міграції або змішаних помилок Plugin і кореня. Якщо перевірка не проходить лише під `plugins.entries.<id>...`, OpenClaw залишає активний `openclaw.json` на місці й повідомляє про локальну проблему Plugin замість відновлення `.last-good`. Це запобігає тому, щоб зміни схеми Plugin або розбіжність `minHostVersion` відкотили непов’язані користувацькі налаштування, як-от моделі, провайдери, профілі автентифікації, канали, експозиція Gateway, інструменти, пам’ять, браузер або конфігурація cron.

## Підкоманди

- `config file`: вивести шлях активного файла конфігурації (розв’язаний із `OPENCLAW_CONFIG_PATH` або типового розташування). Шлях має вказувати на звичайний файл, а не на символічне посилання.

Перезапустіть gateway після змін.

## Перевірка

Перевірте поточну конфігурацію за активною схемою без запуску gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після успішного проходження `openclaw config validate` ви можете скористатися локальним TUI, щоб вбудований агент порівняв активну конфігурацію з документацією, поки ви перевіряєте кожну зміну з того самого термінала:

<Note>
Якщо перевірка вже завершується помилкою, почніть з `openclaw configure` або `openclaw doctor --fix`. `openclaw chat` не обходить захист від недійсної конфігурації.
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

Типовий цикл відновлення:

<Steps>
  <Step title="Порівняйте з документацією">
    Попросіть агента порівняти вашу поточну конфігурацію з відповідною сторінкою документації та запропонувати найменше виправлення.
  </Step>
  <Step title="Застосуйте цільові зміни">
    Застосуйте цільові зміни за допомогою `openclaw config set` або `openclaw configure`.
  </Step>
  <Step title="Повторно перевірте">
    Повторно запускайте `openclaw config validate` після кожної зміни.
  </Step>
  <Step title="Doctor для проблем часу виконання">
    Якщо перевірка проходить успішно, але середовище виконання досі несправне, запустіть `openclaw doctor` або `openclaw doctor --fix`, щоб отримати допомогу з міграцією та відновленням.
  </Step>
</Steps>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Конфігурація](/uk/gateway/configuration)
