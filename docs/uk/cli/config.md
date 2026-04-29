---
read_when:
    - Ви хочете читати або редагувати конфігурацію неінтерактивно
sidebarTitle: Config
summary: Довідка CLI для `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Конфігурація
x-i18n:
    generated_at: "2026-04-29T21:05:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f55c4b932d469cb9112d9f55b66f0ff88dbe066250651df7a0a753060a223d
    source_path: cli/config.md
    workflow: 16
---

Помічники конфігурації для неінтерактивних правок в `openclaw.json`: отримуйте/встановлюйте/застосовуйте patch/скидайте/виводьте файл/схему/перевіряйте значення за шляхом і друкуйте активний файл конфігурації. Запустіть без підкоманди, щоб відкрити майстер налаштування (те саме, що `openclaw configure`).

## Кореневі опції

<ParamField path="--section <section>" type="string">
  Повторюваний фільтр розділів керованого налаштування, коли ви запускаєте `openclaw config` без підкоманди.
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
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Друкує згенеровану схему JSON для `openclaw.json` у stdout як JSON.

<AccordionGroup>
  <Accordion title="Що вона містить">
    - Поточну кореневу схему конфігурації, а також кореневе рядкове поле `$schema` для інструментів редактора.
    - Метадані документації полів `title` і `description`, які використовує Control UI.
    - Вкладені об’єкти, wildcard-вузли (`*`) і вузли елементів масиву (`[]`) успадковують ті самі метадані `title` / `description`, коли існує відповідна документація поля.
    - Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації, коли існує відповідна документація поля.
    - Best-effort метадані схеми живих plugin + каналів, коли можна завантажити маніфести середовища виконання.
    - Чисту резервну схему навіть тоді, коли поточна конфігурація недійсна.

  </Accordion>
  <Accordion title="Пов’язаний RPC середовища виконання">
    `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким вузлом схеми (`title`, `description`, `type`, `enum`, `const`, типові межі), відповідними метаданими UI-підказки й короткими описами безпосередніх дочірніх елементів. Використовуйте це для деталізації за шляхом у Control UI або власних клієнтах.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Спрямуйте вивід у файл, коли потрібно переглянути або перевірити його іншими інструментами:

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

Значення розбираються як JSON5, коли це можливо; інакше вони обробляються як рядки. Використовуйте `--strict-json`, щоб вимагати розбору JSON5. `--json` залишається підтримуваним як застарілий alias.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` друкує необроблене значення як JSON замість тексту, відформатованого для термінала.

<Note>
Присвоєння об’єкта за замовчуванням замінює цільовий шлях. Захищені шляхи map/list, які зазвичай містять додані користувачем записи, як-от `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` і `auth.profiles`, відмовляються від замін, які вилучили б наявні записи, якщо ви не передасте `--replace`.
</Note>

Використовуйте `--merge`, коли додаєте записи до таких map:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Використовуйте `--replace` лише тоді, коли навмисно хочете, щоб надане значення стало повним цільовим значенням.

## Режими `config set`

`openclaw config set` підтримує чотири стилі присвоєння:

<Tabs>
  <Tab title="Режим значення">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Режим побудовника SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Режим побудовника provider">
    Режим побудовника provider націлюється лише на шляхи `secrets.providers.<alias>`:

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
Присвоєння SecretRef відхиляються на непідтримуваних runtime-mutable поверхнях (наприклад `hooks.token`, `commands.ownerDisplaySecret`, токени Webhook прив’язки потоків Discord і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Warning>

Пакетний розбір завжди використовує пакетне payload (`--batch-json`/`--batch-file`) як джерело істини. `--strict-json` / `--json` не змінюють поведінку пакетного розбору.

## `config patch`

Використовуйте `config patch`, коли хочете вставити або передати через pipe patch у формі конфігурації замість запуску багатьох команд `config set` на основі шляхів. Вхідні дані — це об’єкт JSON5. Об’єкти рекурсивно об’єднуються, масиви й скалярні значення замінюють цільове значення, а `null` видаляє цільовий шлях.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Також можна передати patch через stdin, що корисно для скриптів віддаленого налаштування:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Приклад patch:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

Використовуйте `--replace-path <path>`, коли один об’єкт або масив має стати точно наданим значенням замість рекурсивного застосування patch:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` запускає перевірки схеми та розв’язуваності SecretRef без запису. Exec-backed SecretRefs за замовчуванням пропускаються під час dry-run; додайте `--allow-exec`, коли ви навмисно хочете, щоб dry-run виконував команди provider.

Режим шляху/значення JSON залишається підтримуваним як для SecretRefs, так і для providers:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Прапорці побудовника provider

Цілі побудовника provider мають використовувати `secrets.providers.<alias>` як шлях.

<AccordionGroup>
  <Accordion title="Спільні прапорці">
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

Використовуйте `--dry-run`, щоб перевірити зміни без запису `openclaw.json`.

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
    - Режим побудовника: запускає перевірки розв’язуваності SecretRef для змінених refs/providers.
    - Режим JSON (`--strict-json`, `--json` або пакетний режим): запускає перевірку схеми та перевірки розв’язуваності SecretRef.
    - Перевірка політики також виконується для відомих непідтримуваних цільових поверхонь SecretRef.
    - Перевірки політики оцінюють повну конфігурацію після зміни, тому записи батьківських об’єктів (наприклад встановлення `hooks` як об’єкта) не можуть обійти перевірку непідтримуваних поверхонь.
    - Перевірки exec SecretRef за замовчуванням пропускаються під час dry-run, щоб уникнути побічних ефектів команд.
    - Використовуйте `--allow-exec` з `--dry-run`, щоб явно ввімкнути перевірки exec SecretRef (це може виконати команди provider).
    - `--allow-exec` призначений лише для dry-run і завершується помилкою, якщо використаний без `--dry-run`.

  </Accordion>
  <Accordion title="Поля --dry-run --json">
    `--dry-run --json` друкує машинозчитуваний звіт:

    - `ok`: чи пройшов dry-run
    - `operations`: кількість оцінених присвоєнь
    - `checks`: чи виконувалися перевірки схеми/розв’язуваності
    - `checks.resolvabilityComplete`: чи перевірки розв’язуваності виконалися до завершення (false, коли exec refs пропущені)
    - `refsChecked`: кількість refs, фактично розв’язаних під час dry-run
    - `skippedExecRefs`: кількість exec refs, пропущених через те, що `--allow-exec` не було встановлено
    - `errors`: структуровані помилки схеми/розв’язуваності, коли `ok=false`

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
      ref?: string, // present for resolvability errors
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
    - `config schema validation failed`: форма вашої конфігурації після зміни недійсна; виправте шлях/значення або форму об’єкта provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: перемістіть ці облікові дані назад до введення відкритим текстом/рядком і використовуйте SecretRefs лише на підтримуваних поверхнях.
    - `SecretRef assignment(s) could not be resolved`: указаний provider/ref наразі неможливо розв’язати (відсутня змінна середовища, недійсний вказівник на файл, помилка exec-провайдера або невідповідність provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run пропустив exec-посилання; повторіть запуск із `--allow-exec`, якщо вам потрібна перевірка розв’язності exec.
    - Для пакетного режиму виправте записи з помилками й повторно запустіть `--dry-run` перед записом.

  </Accordion>
</AccordionGroup>

## Безпека запису

`openclaw config set` та інші засоби запису конфігурації, що належать OpenClaw, перевіряють повну конфігурацію після зміни перед її збереженням на диск. Якщо нове навантаження не проходить перевірку схеми або схоже на руйнівне перезаписування, активна конфігурація лишається без змін, а відхилене навантаження зберігається поруч як `openclaw.json.rejected.*`.

<Warning>
Активний шлях конфігурації має бути звичайним файлом. Макети з `openclaw.json` як символьним посиланням не підтримуються для запису; натомість використовуйте `OPENCLAW_CONFIG_PATH`, щоб указати безпосередньо на справжній файл.
</Warning>

Для невеликих змін надавайте перевагу записам через CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Якщо запис відхилено, перевірте збережене навантаження й виправте повну форму конфігурації:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямі зміни через редактор усе ще дозволені, але запущений Gateway вважає їх ненадійними, доки вони не пройдуть перевірку. Недійсні прямі зміни можна відновити з останньої справної резервної копії під час запуску або гарячого перезавантаження. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

Відновлення всього файла призначене для глобально пошкодженої конфігурації, як-от помилки розбору, помилки схеми на кореневому рівні, помилки міграції застарілої конфігурації або змішані помилки Plugin і кореня. Якщо перевірка не проходить лише під `plugins.entries.<id>...`, OpenClaw залишає активний `openclaw.json` на місці й повідомляє про локальну для Plugin проблему замість відновлення `.last-good`. Це запобігає відкату непов’язаних налаштувань користувача, таких як моделі, провайдери, профілі автентифікації, канали, експозиція gateway, інструменти, пам’ять, браузер або конфігурація cron, через зміни схеми Plugin чи розбіжність `minHostVersion`.

## Підкоманди

- `config file`: вивести шлях до активного файла конфігурації (розв’язаний із `OPENCLAW_CONFIG_PATH` або типового розташування). Шлях має вказувати на звичайний файл, а не на символьне посилання.

Перезапустіть gateway після змін.

## Перевірка

Перевірте поточну конфігурацію за активною схемою без запуску gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після успішного проходження `openclaw config validate` можна використати локальний TUI, щоб вбудований агент порівняв активну конфігурацію з документацією, поки ви перевіряєте кожну зміну з того самого термінала:

<Note>
Якщо перевірка вже завершується помилкою, почніть із `openclaw configure` або `openclaw doctor --fix`. `openclaw chat` не обходить захист від недійсної конфігурації.
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
  <Step title="Порівняйте з документацією">
    Попросіть агента порівняти вашу поточну конфігурацію з відповідною сторінкою документації та запропонувати найменше виправлення.
  </Step>
  <Step title="Застосуйте цільові зміни">
    Застосуйте цільові зміни за допомогою `openclaw config set` або `openclaw configure`.
  </Step>
  <Step title="Повторіть перевірку">
    Повторно запускайте `openclaw config validate` після кожної зміни.
  </Step>
  <Step title="Doctor для проблем виконання">
    Якщо перевірка проходить, але середовище виконання все ще несправне, запустіть `openclaw doctor` або `openclaw doctor --fix`, щоб отримати допомогу з міграцією та виправленням.
  </Step>
</Steps>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Конфігурація](/uk/gateway/configuration)
