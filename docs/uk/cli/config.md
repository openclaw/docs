---
read_when:
    - Ви хочете читати або редагувати конфігурацію неінтерактивно
sidebarTitle: Config
summary: Довідник CLI для `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Конфігурація
x-i18n:
    generated_at: "2026-06-27T17:19:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

Конфігураційні помічники для неінтерактивного редагування в `openclaw.json`: отримання/встановлення/накладання патча/скасування встановлення/файл/схема/валідація значень за шляхом і виведення активного конфігураційного файлу. Запустіть без підкоманди, щоб відкрити майстер налаштування (те саме, що `openclaw configure`).

<Note>
Коли `OPENCLAW_NIX_MODE=1`, OpenClaw розглядає `openclaw.json` як незмінний. Команди лише для читання, як-от `config get`, `config file`, `config schema` і `config validate`, досі працюють, але засоби запису конфігурації відмовляються виконуватись. Натомість агенти мають редагувати джерело Nix для інсталяції; для першостороннього дистрибутива nix-openclaw використовуйте [nix-openclaw Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start) і задавайте значення в `programs.openclaw.config` або `instances.<name>.config`.
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

Вивести згенеровану JSON-схему для `openclaw.json` у stdout як JSON.

<AccordionGroup>
  <Accordion title="Що вона містить">
    - Поточну кореневу схему конфігурації, а також кореневе рядкове поле `$schema` для інструментів редактора.
    - Метадані документації `title` і `description` полів, які використовує Control UI.
    - Вкладені об’єкти, вузли з шаблоном (`*`) і елементи масиву (`[]`) успадковують ті самі метадані `title` / `description`, коли існує відповідна документація поля.
    - Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації, коли існує відповідна документація поля.
    - Наскільки можливо актуальні метадані схем Plugin + каналу, коли можна завантажити маніфести середовища виконання.
    - Чисту резервну схему, навіть коли поточна конфігурація недійсна.

  </Accordion>
  <Accordion title="Пов’язаний runtime RPC">
    `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким вузлом схеми (`title`, `description`, `type`, `enum`, `const`, загальні межі), відповідними метаданими підказки UI та підсумками безпосередніх дочірніх елементів. Використовуйте це для деталізації в межах шляху в Control UI або власних клієнтах.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Передайте це у файл, коли хочете переглянути або перевірити схему іншими інструментами:

```bash
openclaw config schema > openclaw.schema.json
```

### Шляхи

Шляхи використовують крапкову або дужкову нотацію. Беріть шляхи в дужковій нотації в лапки в прикладах оболонки, щоб оболонки на кшталт zsh не розгортали `[0]` як glob до того, як OpenClaw отримає шлях:

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

Значення аналізуються як JSON5, коли це можливо; інакше вони розглядаються як рядки. Використовуйте `--strict-json`, щоб вимагати аналіз JSON5. `--json` залишається підтримуваним як застарілий псевдонім.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` виводить необроблене значення як JSON замість тексту, відформатованого для термінала.

<Note>
Присвоєння об’єкта за замовчуванням замінює цільовий шлях. Захищені шляхи мап/списків, які зазвичай містять додані користувачем записи, як-от `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` і `auth.profiles`, відмовляються від замін, які видалили б наявні записи, якщо ви не передасте `--replace`.
</Note>

Використовуйте `--merge`, коли додаєте записи до цих мап:

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
  <Tab title="Режим побудови SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Режим побудови провайдера">
    Режим побудови провайдера націлюється лише на шляхи `secrets.providers.<alias>`:

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
Присвоєння SecretRef відхиляються на непідтримуваних змінюваних під час виконання поверхнях (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, токени webhook прив’язування потоків Discord і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Warning>

Пакетний аналіз завжди використовує пакетне корисне навантаження (`--batch-json`/`--batch-file`) як джерело істини. `--strict-json` / `--json` не змінюють поведінку пакетного аналізу.

## `config patch`

Використовуйте `config patch`, коли хочете вставити або передати через pipe патч у формі конфігурації замість запуску багатьох команд `config set` на основі шляхів. Вхідні дані є об’єктом JSON5. Об’єкти рекурсивно об’єднуються, масиви й скалярні значення замінюють цільове значення, а `null` видаляє цільовий шлях.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Ви також можете передати патч через stdin, що корисно для скриптів віддаленого налаштування:

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

Використовуйте `--replace-path <path>`, коли один об’єкт або масив має стати точно наданим значенням замість рекурсивного патчування:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` виконує перевірки схеми та можливості розв’язання SecretRef без запису. SecretRefs на основі exec типово пропускаються під час dry-run; додайте `--allow-exec`, коли навмисно хочете, щоб dry-run виконував команди провайдера.

Режим шляху/значення JSON залишається підтримуваним і для SecretRefs, і для провайдерів:

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
    - Режим побудови: виконує перевірки можливості розв’язання SecretRef для змінених посилань/провайдерів.
    - Режим JSON (`--strict-json`, `--json` або пакетний режим): виконує валідацію схеми, а також перевірки можливості розв’язання SecretRef.
    - Валідація політик також виконується для відомих непідтримуваних цільових поверхонь SecretRef.
    - Перевірки політик оцінюють повну конфігурацію після зміни, тому записи батьківського об’єкта (наприклад, встановлення `hooks` як об’єкта) не можуть обійти валідацію непідтримуваних поверхонь.
    - Перевірки exec SecretRef типово пропускаються під час dry-run, щоб уникнути побічних ефектів команд.
    - Використовуйте `--allow-exec` з `--dry-run`, щоб явно ввімкнути перевірки exec SecretRef (це може виконувати команди провайдера).
    - `--allow-exec` призначений лише для dry-run і завершується помилкою, якщо використовується без `--dry-run`.

  </Accordion>
  <Accordion title="Поля --dry-run --json">
    `--dry-run --json` виводить машинозчитуваний звіт:

    - `ok`: чи пройшов dry-run
    - `operations`: кількість оцінених призначень
    - `checks`: чи виконувалися перевірки схеми/розв'язуваності
    - `checks.resolvabilityComplete`: чи перевірки розв'язуваності виконалися до завершення (false, коли exec refs пропущено)
    - `refsChecked`: кількість refs, фактично розв'язаних під час dry-run
    - `skippedExecRefs`: кількість exec refs, пропущених через те, що `--allow-exec` не було задано
    - `errors`: структуровані помилки відсутнього шляху, схеми або розв'язуваності, коли `ok=false`

  </Accordion>
</AccordionGroup>

### Форма JSON-виводу

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
  <Accordion title="Якщо dry-run не вдається">
    - `config schema validation failed`: форма конфігу після зміни недійсна; виправте шлях/значення або форму об'єкта провайдера/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: перемістіть ці облікові дані назад у введення відкритим текстом/рядком і тримайте SecretRefs лише на підтримуваних поверхнях.
    - `SecretRef assignment(s) could not be resolved`: вказаний provider/ref зараз неможливо розв'язати (відсутня змінна середовища, недійсний файловий вказівник, збій exec-провайдера або невідповідність provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run пропустив exec refs; запустіть повторно з `--allow-exec`, якщо вам потрібна перевірка розв'язуваності exec.
    - Для пакетного режиму виправте помилкові записи й повторно запустіть `--dry-run` перед записом.

  </Accordion>
</AccordionGroup>

## Безпека запису

`openclaw config set` та інші засоби запису конфігу, що належать OpenClaw, перевіряють повний конфіг після зміни перед записом на диск. Якщо новий payload не проходить валідацію схеми або виглядає як руйнівне перезаписування, активний конфіг залишається без змін, а відхилений payload зберігається поруч як `openclaw.json.rejected.*`.

<Warning>
Активний шлях конфігу має бути звичайним файлом. Макети `openclaw.json` через symlink не підтримуються для запису; натомість використовуйте `OPENCLAW_CONFIG_PATH`, щоб указати безпосередньо на справжній файл.
</Warning>

Для невеликих змін надавайте перевагу записам через CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Якщо запис відхилено, перевірте збережений payload і виправте повну форму конфігу:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямі записи через редактор усе ще дозволені, але запущений Gateway вважає їх недовіреними, доки вони не пройдуть валідацію. Недійсні прямі зміни спричиняють збій запуску або пропускаються під час hot reload; Gateway не перезаписує `openclaw.json`. Запустіть `openclaw doctor --fix`, щоб відновити конфіг із префіксом/перезаписаний конфіг або повернути останню відому справну копію. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-rejected-invalid-config).

Відновлення всього файлу зарезервоване для виправлення через doctor. Зміни схеми Plugin або розбіжність `minHostVersion` залишаються явними, замість відкочування непов'язаних налаштувань користувача, як-от конфіг моделей, провайдерів, профілів автентифікації, каналів, доступності gateway, інструментів, пам'яті, браузера або cron.

## Підкоманди

- `config file`: вивести шлях до активного файлу конфігу (визначений з `OPENCLAW_CONFIG_PATH` або розташування за замовчуванням). Шлях має вказувати на звичайний файл, а не symlink.

Перезапустіть gateway після змін.

## Валідація

Перевірте поточний конфіг за активною схемою без запуску gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після того як `openclaw config validate` проходить успішно, ви можете скористатися локальним TUI, щоб вбудований агент порівняв активний конфіг із документацією, поки ви перевіряєте кожну зміну з того самого термінала:

<Note>
Якщо валідація вже не проходить, почніть з `openclaw configure` або `openclaw doctor --fix`. `openclaw chat` не обходить захист від недійсного конфігу.
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
    Попросіть агента порівняти ваш поточний конфіг із відповідною сторінкою документації та запропонувати найменше виправлення.
  </Step>
  <Step title="Застосуйте цільові зміни">
    Застосуйте цільові зміни за допомогою `openclaw config set` або `openclaw configure`.
  </Step>
  <Step title="Повторно перевірте">
    Повторно запускайте `openclaw config validate` після кожної зміни.
  </Step>
  <Step title="Doctor для проблем runtime">
    Якщо валідація проходить, але runtime усе ще несправний, запустіть `openclaw doctor` або `openclaw doctor --fix` для допомоги з міграцією та виправленням.
  </Step>
</Steps>

## Пов'язане

- [Довідник CLI](/uk/cli)
- [Конфігурація](/uk/gateway/configuration)
