---
read_when:
    - Ви хочете читати або редагувати конфігурацію неінтерактивно
sidebarTitle: Config
summary: Довідник CLI для `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Конфігурація
x-i18n:
    generated_at: "2026-06-28T22:33:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

Допоміжні засоби конфігурації для неінтерактивних змін у `openclaw.json`: отримуйте/задавайте/застосовуйте патчі/скасовуйте/переглядайте файл/схему/перевіряйте значення за шляхом і виводьте активний файл конфігурації. Запустіть без підкоманди, щоб відкрити майстер налаштування (те саме, що `openclaw configure`).

<Note>
Коли `OPENCLAW_NIX_MODE=1`, OpenClaw розглядає `openclaw.json` як незмінний. Команди лише для читання, як-от `config get`, `config file`, `config schema` і `config validate`, і далі працюють, але команди запису конфігурації відмовляються виконуватись. Натомість агенти мають редагувати джерело Nix для інсталяції; для офіційного дистрибутива nix-openclaw використовуйте [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) і задавайте значення в `programs.openclaw.config` або `instances.<name>.config`.
</Note>

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
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
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
    - Поточну кореневу схему конфігурації, а також кореневе рядкове поле `$schema` для інструментів редактора.
    - Метадані документації полів `title` і `description`, які використовує Control UI.
    - Вкладені об’єкти, wildcard-вузли (`*`) і вузли елементів масиву (`[]`) успадковують ті самі метадані `title` / `description`, коли існує відповідна документація поля.
    - Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації, коли існує відповідна документація поля.
    - Найкращі доступні живі метадані схем plugin + каналу, коли можна завантажити маніфести runtime.
    - Чисту резервну схему навіть тоді, коли поточна конфігурація недійсна.

  </Accordion>
  <Accordion title="Пов’язаний runtime RPC">
    `config.schema.lookup` повертає один нормалізований шлях конфігурації з поверхневим вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені межі), відповідними метаданими підказки UI та короткими описами безпосередніх дочірніх елементів. Використовуйте це для деталізації в межах шляху в Control UI або власних клієнтах.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Передайте це у файл, коли хочете перевірити або валідувати схему іншими інструментами:

```bash
openclaw config schema > openclaw.schema.json
```

### Шляхи

Шляхи використовують крапкову або дужкову нотацію. Беріть шляхи в дужковій нотації в лапки в прикладах shell, щоб shell, як-от zsh, не розгортав `[0]` як glob до того, як OpenClaw отримає шлях:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Використовуйте індекс списку агентів, щоб вибрати конкретного агента:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Значення

Значення за можливості розбираються як JSON5; інакше вони трактуються як рядки. Використовуйте `--strict-json`, щоб вимагати стандартний розбір JSON без резервного трактування як рядка. `--json` і далі підтримується як застарілий псевдонім для `--strict-json`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

Коли ввімкнено `--strict-json`, синтаксис, властивий лише JSON5, як-от коментарі, кінцеві коми або не взяті в лапки ключі об’єктів, відхиляється. Опустіть `--strict-json` для розбору значень JSON5 із резервним трактуванням як необробленого рядка.

`config get <path> --json` виводить необроблене значення як JSON замість тексту, відформатованого для термінала.

<Note>
Присвоєння об’єкта типово замінює цільовий шлях. Захищені шляхи map/list, які зазвичай містять додані користувачем записи, як-от `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` і `auth.profiles`, відмовляються від замін, які видалили б наявні записи, якщо не передати `--replace`.
</Note>

Використовуйте `--merge`, коли додаєте записи до цих map:

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
  <Tab title="Режим конструктора SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Режим конструктора провайдера">
    Режим конструктора провайдера націлений лише на шляхи `secrets.providers.<alias>`:

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
Присвоєння SecretRef відхиляються на непідтримуваних runtime-змінюваних поверхнях (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, webhook-токени прив’язки гілок Discord і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Warning>

Пакетний розбір завжди використовує пакетне навантаження (`--batch-json`/`--batch-file`) як джерело істини. `--strict-json` / `--json` не змінюють поведінку пакетного розбору.

## `config patch`

Використовуйте `config patch`, коли хочете вставити або передати через pipe патч у формі конфігурації замість запуску багатьох команд `config set` на основі шляхів. Вхідні дані є об’єктом JSON5. Об’єкти рекурсивно об’єднуються, масиви й скалярні значення замінюють цільове значення, а `null` видаляє цільовий шлях.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Також можна передати патч через stdin, що корисно для сценаріїв віддаленого налаштування:

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

Використовуйте `--replace-path <path>`, коли один об’єкт або масив має стати точно наданим значенням замість рекурсивного застосування патча:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` запускає перевірки схеми та розв’язності SecretRef без запису. SecretRefs на основі exec типово пропускаються під час dry-run; додайте `--allow-exec`, коли навмисно хочете, щоб dry-run виконував команди провайдера.

Режим JSON шлях/значення і далі підтримується як для SecretRefs, так і для провайдерів:

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
  <Accordion title="Env-провайдер (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (повторюваний)

  </Accordion>
  <Accordion title="File-провайдер (--provider-source file)">
    - `--provider-path <path>` (обов’язковий)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec-провайдер (--provider-source exec)">
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
    - Режим builder: запускає перевірки розв’язності SecretRef для змінених refs/провайдерів.
    - Режим JSON (`--strict-json`, `--json` або пакетний режим): запускає перевірку схеми та перевірки розв’язності SecretRef.
    - Перевірка політики також виконується для відомих непідтримуваних цільових поверхонь SecretRef.
    - Перевірки політики оцінюють повну конфігурацію після зміни, тому записи батьківських об’єктів (наприклад, встановлення `hooks` як об’єкта) не можуть обійти перевірку непідтримуваних поверхонь.
    - Перевірки exec SecretRef типово пропускаються під час dry-run, щоб уникнути побічних ефектів команд.
    - Використовуйте `--allow-exec` із `--dry-run`, щоб увімкнути перевірки exec SecretRef (це може виконати команди провайдера).
    - `--allow-exec` працює лише для dry-run і завершується помилкою, якщо використовується без `--dry-run`.

  </Accordion>
  <Accordion title="Поля --dry-run --json">
    `--dry-run --json` виводить машинозчитуваний звіт:

    - `ok`: чи dry-run пройшов успішно
    - `operations`: кількість оцінених присвоєнь
    - `checks`: чи виконувалися перевірки схеми/розв’язності
    - `checks.resolvabilityComplete`: чи перевірки розв’язності виконалися до завершення (false, коли exec refs пропущено)
    - `refsChecked`: кількість refs, фактично розв’язаних під час dry-run
    - `skippedExecRefs`: кількість exec refs, пропущених через те, що `--allow-exec` не було задано
    - `errors`: структуровані помилки відсутнього шляху, схеми або розв’язності, коли `ok=false`

  </Accordion>
</AccordionGroup>

### Форма виводу JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
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
  <Tab title="Приклад збою">
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
    - `config schema validation failed`: форма вашої конфігурації після зміни недійсна; виправте шлях/значення або форму об’єкта провайдера/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: поверніть ці облікові дані до відкритого тексту/рядкового вводу й використовуйте SecretRefs лише на підтримуваних поверхнях.
    - `SecretRef assignment(s) could not be resolved`: вказаний провайдер/ref наразі не може розв’язатися (відсутня змінна середовища, недійсний файловий вказівник, збій exec-провайдера або невідповідність провайдера/джерела).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run пропустив exec refs; запустіть повторно з `--allow-exec`, якщо вам потрібна перевірка розв’язності exec.
    - Для пакетного режиму виправте записи, що завершилися помилкою, і повторно запустіть `--dry-run` перед записом.

  </Accordion>
</AccordionGroup>

## Безпека запису

`openclaw config set` та інші засоби запису конфігурації, що належать OpenClaw, перевіряють повну конфігурацію після зміни перед записом на диск. Якщо нове корисне навантаження не проходить перевірку схеми або схоже на руйнівне перезаписування, активна конфігурація залишається без змін, а відхилене корисне навантаження зберігається поруч як `openclaw.json.rejected.*`.

<Warning>
Шлях активної конфігурації має бути звичайним файлом. Макети `openclaw.json` із симлінками не підтримуються для запису; натомість використовуйте `OPENCLAW_CONFIG_PATH`, щоб указати безпосередньо на справжній файл.
</Warning>

Віддавайте перевагу записам через CLI для невеликих редагувань:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Якщо запис відхилено, перегляньте збережене корисне навантаження й виправте повну форму конфігурації:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямі записи через редактор усе ще дозволені, але запущений Gateway вважає їх ненадійними, доки вони не пройдуть перевірку. Недійсні прямі редагування зривають запуск або пропускаються hot reload; Gateway не перезаписує `openclaw.json`. Запустіть `openclaw doctor --fix`, щоб виправити конфігурацію з префіксами/перезаписуванням або відновити останню відому робочу копію. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-rejected-invalid-config).

Відновлення всього файлу зарезервоване для виправлення через doctor. Зміни схем Plugin або розбіжність `minHostVersion` залишаються явними, замість того щоб відкочувати непов’язані налаштування користувача, як-от конфігурацію моделей, провайдерів, профілів автентифікації, каналів, доступності Gateway, інструментів, пам’яті, браузера або cron.

## Підкоманди

- `config file`: Вивести шлях до активного файлу конфігурації (визначений із `OPENCLAW_CONFIG_PATH` або стандартного розташування). Шлях має вказувати на звичайний файл, а не на симлінк.

Перезапустіть gateway після редагувань.

## Перевірка

Перевірте поточну конфігурацію за активною схемою без запуску gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після успішного проходження `openclaw config validate` можна використати локальний TUI, щоб вбудований агент порівняв активну конфігурацію з документацією, поки ви перевіряєте кожну зміну з того самого термінала:

<Note>
Якщо перевірка вже не проходить, почніть з `openclaw configure` або `openclaw doctor --fix`. `openclaw chat` не обходить захист від недійсної конфігурації.
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
  <Step title="Порівняти з документацією">
    Попросіть агента порівняти вашу поточну конфігурацію з відповідною сторінкою документації та запропонувати найменше виправлення.
  </Step>
  <Step title="Застосувати цільові редагування">
    Застосуйте цільові редагування за допомогою `openclaw config set` або `openclaw configure`.
  </Step>
  <Step title="Повторно перевірити">
    Повторно запускайте `openclaw config validate` після кожної зміни.
  </Step>
  <Step title="Doctor для проблем виконання">
    Якщо перевірка проходить, але runtime усе ще несправний, запустіть `openclaw doctor` або `openclaw doctor --fix` для допомоги з міграцією та виправленням.
  </Step>
</Steps>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Конфігурація](/uk/gateway/configuration)
