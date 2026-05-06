---
read_when:
    - Ви хочете читати або редагувати конфігурацію неінтерактивно
sidebarTitle: Config
summary: Довідник CLI для `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Конфігурація
x-i18n:
    generated_at: "2026-05-06T12:48:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4e0d580347e162278277ddb33eed0e42105c5e85bac4325c07fa2cd700b831d
    source_path: cli/config.md
    workflow: 16
---

Допоміжні команди конфігурації для неінтерактивних змін у `openclaw.json`: отримуйте/задавайте/застосовуйте патчі/скасовуйте/переглядайте файл/схему/перевіряйте значення за шляхом і виводьте активний файл конфігурації. Запустіть без підкоманди, щоб відкрити майстер налаштування (те саме, що `openclaw configure`).

<Note>
Коли `OPENCLAW_NIX_MODE=1`, OpenClaw вважає `openclaw.json` незмінним. Команди лише для читання, як-от `config get`, `config file`, `config schema` і `config validate`, усе ще працюють, але команди запису конфігурації відмовляються виконуватись. Натомість агенти мають редагувати джерело Nix для встановлення; для офіційного дистрибутива nix-openclaw використовуйте [Короткий старт nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) і задавайте значення в `programs.openclaw.config` або `instances.<name>.config`.
</Note>

## Кореневі параметри

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

Виводить згенеровану схему JSON для `openclaw.json` у stdout як JSON.

<AccordionGroup>
  <Accordion title="Що вона містить">
    - Поточну кореневу схему конфігурації, а також кореневе рядкове поле `$schema` для редакторських інструментів.
    - Метадані документації полів `title` і `description`, які використовує Control UI.
    - Вкладені об'єкти, вузли wildcard (`*`) і елементів масиву (`[]`) успадковують ті самі метадані `title` / `description`, коли існує відповідна документація поля.
    - Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації, коли існує відповідна документація поля.
    - Наскільки можливо актуальні метадані схем Plugin + каналу, коли можна завантажити runtime-маніфести.
    - Чисту резервну схему навіть тоді, коли поточна конфігурація недійсна.

  </Accordion>
  <Accordion title="Пов'язаний runtime RPC">
    `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені межі), зіставленими метаданими підказок UI і короткими описами безпосередніх дочірніх елементів. Використовуйте його для деталізації, обмеженої шляхом, у Control UI або власних клієнтах.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Передайте результат у файл, коли хочете переглянути або перевірити його іншими інструментами:

```bash
openclaw config schema > openclaw.schema.json
```

### Шляхи

Шляхи використовують крапкову або дужкову нотацію:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Використовуйте індекс списку агентів, щоб указати конкретного агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Значення

Значення за можливості розбираються як JSON5; інакше вони обробляються як рядки. Використовуйте `--strict-json`, щоб вимагати розбору JSON5. `--json` залишається підтримуваним як застарілий псевдонім.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` виводить сире значення як JSON замість тексту, відформатованого для термінала.

<Note>
Призначення об'єкта типово замінює цільовий шлях. Захищені шляхи мап/списків, які зазвичай містять додані користувачем записи, як-от `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` і `auth.profiles`, відмовляються від замін, які вилучили б наявні записи, якщо ви не передасте `--replace`.
</Note>

Використовуйте `--merge`, коли додаєте записи до цих мап:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Використовуйте `--replace` лише тоді, коли навмисно хочете, щоб надане значення стало повним цільовим значенням.

## Режими `config set`

`openclaw config set` підтримує чотири стилі призначення:

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
    Режим конструктора провайдера застосовується лише до шляхів `secrets.providers.<alias>`:

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
Призначення SecretRef відхиляються на непідтримуваних runtime-змінюваних поверхнях (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, токенах Webhook прив'язки тредів Discord і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Warning>

Пакетний розбір завжди використовує пакетне корисне навантаження (`--batch-json`/`--batch-file`) як джерело істини. `--strict-json` / `--json` не змінюють поведінку пакетного розбору.

## `config patch`

Використовуйте `config patch`, коли хочете вставити або передати через pipe патч у формі конфігурації замість виконання багатьох команд `config set` на основі шляхів. Вхідні дані є об'єктом JSON5. Об'єкти об'єднуються рекурсивно, масиви та скалярні значення замінюють цільове значення, а `null` видаляє цільовий шлях.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Ви також можете передати патч через stdin, що корисно для сценаріїв віддаленого налаштування:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Приклад патча:

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

Використовуйте `--replace-path <path>`, коли один об'єкт або масив має стати точно наданим значенням замість рекурсивного патчування:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` запускає перевірки схеми та розв'язуваності SecretRef без запису. Exec-backed SecretRefs типово пропускаються під час сухого запуску; додайте `--allow-exec`, коли навмисно хочете, щоб сухий запуск виконував команди провайдера.

Режим шляху/значення JSON залишається підтримуваним як для SecretRef, так і для провайдерів:

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
  <Accordion title="Спільні прапорці">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Провайдер env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (повторюваний)

  </Accordion>
  <Accordion title="Файловий провайдер (--provider-source file)">
    - `--provider-path <path>` (обов'язковий)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec-провайдер (--provider-source exec)">
    - `--provider-command <path>` (обов'язковий)
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

## Сухий запуск

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
  <Accordion title="Поведінка сухого запуску">
    - Режим конструктора: запускає перевірки розв'язуваності SecretRef для змінених refs/провайдерів.
    - Режим JSON (`--strict-json`, `--json` або пакетний режим): запускає перевірку схеми плюс перевірки розв'язуваності SecretRef.
    - Перевірка політик також виконується для відомих непідтримуваних цільових поверхонь SecretRef.
    - Перевірки політик оцінюють повну конфігурацію після зміни, тому записи батьківських об'єктів (наприклад, задавання `hooks` як об'єкта) не можуть обійти перевірку непідтримуваних поверхонь.
    - Перевірки exec SecretRef типово пропускаються під час сухого запуску, щоб уникнути побічних ефектів команд.
    - Використовуйте `--allow-exec` з `--dry-run`, щоб явно ввімкнути перевірки exec SecretRef (це може виконувати команди провайдера).
    - `--allow-exec` працює лише для сухого запуску й видає помилку, якщо використовується без `--dry-run`.

  </Accordion>
  <Accordion title="Поля --dry-run --json">
    `--dry-run --json` виводить машинозчитуваний звіт:

    - `ok`: чи пройшов пробний запуск
    - `operations`: кількість оцінених призначень
    - `checks`: чи виконувалися перевірки схеми/можливості розв’язання
    - `checks.resolvabilityComplete`: чи перевірки можливості розв’язання виконалися до завершення (false, коли exec-посилання пропущено)
    - `refsChecked`: кількість посилань, фактично розв’язаних під час пробного запуску
    - `skippedExecRefs`: кількість exec-посилань, пропущених через те, що `--allow-exec` не було встановлено
    - `errors`: структуровані помилки схеми/можливості розв’язання, коли `ok=false`

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
  <Accordion title="If dry-run fails">
    - `config schema validation failed`: форма вашої конфігурації після зміни недійсна; виправте шлях/значення або форму об’єкта provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: поверніть ці облікові дані до введення відкритим текстом/рядком і використовуйте SecretRefs лише на підтримуваних поверхнях.
    - `SecretRef assignment(s) could not be resolved`: указаний provider/ref наразі не може бути розв’язаний (відсутня змінна середовища, недійсний файловий указівник, збій exec-провайдера або невідповідність провайдера/джерела).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: пробний запуск пропустив exec-посилання; перезапустіть із `--allow-exec`, якщо вам потрібна перевірка можливості розв’язання exec.
    - Для пакетного режиму виправте помилкові записи та повторно запустіть `--dry-run` перед записом.

  </Accordion>
</AccordionGroup>

## Безпека запису

`openclaw config set` та інші засоби запису конфігурації, що належать OpenClaw, перевіряють повну конфігурацію після зміни, перш ніж зберегти її на диск. Якщо нове корисне навантаження не проходить перевірку схеми або виглядає як руйнівне перезаписування, активна конфігурація залишається без змін, а відхилене корисне навантаження зберігається поруч як `openclaw.json.rejected.*`.

<Warning>
Шлях активної конфігурації має бути звичайним файлом. Макети `openclaw.json` із символічним посиланням не підтримуються для запису; натомість використовуйте `OPENCLAW_CONFIG_PATH`, щоб указати безпосередньо на справжній файл.
</Warning>

Надавайте перевагу записам через CLI для невеликих змін:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Якщо запис відхилено, перевірте збережене корисне навантаження та виправте повну форму конфігурації:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямі записи в редакторі все ще дозволені, але запущений Gateway вважає їх ненадійними, доки вони не пройдуть перевірку. Недійсні прямі зміни призводять до помилки запуску або пропускаються під час гарячого перезавантаження; Gateway не перезаписує `openclaw.json`. Запустіть `openclaw doctor --fix`, щоб відновити конфігурацію з префіксами/перезаписуванням або повернути останню відому справну копію. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-rejected-invalid-config).

Відновлення всього файла зарезервоване для ремонту через doctor. Зміни схеми Plugin або розбіжність `minHostVersion` залишаються явними, замість того щоб відкочувати непов’язані користувацькі налаштування, як-от моделі, провайдерів, профілі автентифікації, канали, експозицію gateway, інструменти, пам’ять, браузер або конфігурацію cron.

## Підкоманди

- `config file`: вивести шлях до активного файла конфігурації (визначений із `OPENCLAW_CONFIG_PATH` або стандартного розташування). Шлях має вказувати на звичайний файл, а не на символічне посилання.

Перезапустіть gateway після змін.

## Перевірка

Перевірте поточну конфігурацію за активною схемою без запуску gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після успішного проходження `openclaw config validate` ви можете використати локальний TUI, щоб вбудований агент порівняв активну конфігурацію з документацією, поки ви перевіряєте кожну зміну з того самого термінала:

<Note>
Якщо перевірка вже не проходить, почніть із `openclaw configure` або `openclaw doctor --fix`. `openclaw chat` не обходить захист від недійсної конфігурації.
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

Типовий цикл ремонту:

<Steps>
  <Step title="Compare with docs">
    Попросіть агента порівняти вашу поточну конфігурацію з відповідною сторінкою документації та запропонувати найменше виправлення.
  </Step>
  <Step title="Apply targeted edits">
    Застосуйте цільові зміни за допомогою `openclaw config set` або `openclaw configure`.
  </Step>
  <Step title="Re-validate">
    Повторно запускайте `openclaw config validate` після кожної зміни.
  </Step>
  <Step title="Doctor for runtime issues">
    Якщо перевірка проходить, але runtime усе ще несправний, запустіть `openclaw doctor` або `openclaw doctor --fix` для допомоги з міграцією та ремонтом.
  </Step>
</Steps>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Конфігурація](/uk/gateway/configuration)
