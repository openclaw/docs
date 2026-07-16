---
read_when:
    - Потрібно прочитати або змінити конфігурацію неінтерактивно
sidebarTitle: Config
summary: Довідник CLI для `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Конфігурація
x-i18n:
    generated_at: "2026-07-16T17:52:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

Неінтерактивні допоміжні команди для `openclaw.json`: отримати/встановити/накласти латки/скасувати значення за шляхом, вивести схему, перевірити або вивести шлях до активного файлу. Запустіть `openclaw config` без підкоманди, щоб відкрити той самий покроковий майстер, що й `openclaw configure`.

<Note>
Коли `OPENCLAW_NIX_MODE=1`, OpenClaw вважає `openclaw.json` незмінним. Команди лише для читання (`config get`, `config file`, `config schema`, `config validate`) і далі працюють; команди запису конфігурації відмовляються виконуватися. Натомість відредагуйте джерело Nix для встановлення; для офіційного дистрибутива nix-openclaw скористайтеся [коротким посібником із початку роботи з nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) і задайте значення в `programs.openclaw.config` або `instances.<name>.config`.
</Note>

## Кореневі параметри

<ParamField path="--section <section>" type="string">
  Повторюваний фільтр розділів покрокового налаштування під час запуску `openclaw config` без підкоманди.
</ParamField>

Розділи покрокового налаштування: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

### Шляхи

Крапкова нотація або нотація з дужками. У прикладах для оболонки беріть шляхи з дужками в лапки, щоб zsh не розгортав `[0]` як шаблон:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Зчитує значення з редагованого знімка конфігурації (секрети ніколи не виводяться). `--json` виводить необроблене значення у форматі JSON; інакше рядки, числа й логічні значення виводяться без оформлення, а об’єкти та масиви — як форматований JSON.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Виводить шлях до активного файлу конфігурації, визначений із `OPENCLAW_CONFIG_PATH` або стандартного розташування. Шлях указує на звичайний файл, а не на символічне посилання; див. [Безпека запису](#write-safety).

### `config schema`

Виводить згенеровану схему JSON для `openclaw.json` у стандартний потік виведення.

<AccordionGroup>
  <Accordion title="Що вона містить">
    - Поточна коренева схема конфігурації та кореневе рядкове поле `$schema` для інструментів редактора.
    - Метадані документації полів `title` / `description`, які використовує інтерфейс керування.
    - Вкладені об’єкти, вузли з шаблоном (`*`) і вузли елементів масиву (`[]`) успадковують ті самі метадані `title` / `description`, якщо існує відповідна документація полів.
    - Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації.
    - Метадані схеми активних плагінів і каналів за принципом максимально можливих зусиль, коли можна завантажити маніфести середовища виконання.
    - Чиста резервна схема, навіть якщо поточна конфігурація недійсна.

  </Accordion>
  <Accordion title="Пов’язаний RPC середовища виконання">
    `config.schema.lookup` повертає один нормалізований шлях конфігурації з поверхневим вузлом схеми (`title`, `description`, `type`, `enum`, `const`, загальні обмеження), відповідними метаданими підказок інтерфейсу та зведеннями безпосередніх дочірніх елементів. Використовуйте його для деталізації в межах шляху в інтерфейсі керування або власних клієнтах.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Перевіряє поточну конфігурацію за активною схемою без запуску gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Якщо перевірка вже завершується помилкою, почніть із `openclaw configure` або `openclaw doctor --fix`. `openclaw chat` не обходить захист від недійсної конфігурації.
</Note>

## Значення

Значення за можливості аналізуються як JSON5; інакше вони вважаються необробленими рядками. Використовуйте `--strict-json`, щоб вимагати стандартний JSON без резервного трактування як рядка (у такому разі синтаксис, властивий лише JSON5, як-от коментарі, кінцеві коми або ключі без лапок, відхиляється). `--json` — застарілий псевдонім для `--strict-json` у `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` виводить необроблене значення у форматі JSON замість тексту, відформатованого для термінала.

<Note>
Присвоєння об’єкта типово замінює цільовий шлях. Захищені шляхи, які зазвичай містять додані користувачем записи, відхиляють заміни, що видалили б наявні записи, якщо не передано `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` і `auth.profiles`.
</Note>

Під час додавання записів до цих мап використовуйте `--merge`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Використовуйте `--replace` лише тоді, коли надане значення має навмисно стати повним цільовим значенням.

## Режими `config set`

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
  <Tab title="Режим конструктора постачальника">
    Лише для шляхів `secrets.providers.<alias>`:

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
Присвоєння SecretRef відхиляються на непідтримуваних поверхнях, які можна змінювати під час виконання (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, токени webhook для прив’язування гілок Discord і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Warning>

Пакетний аналіз завжди використовує пакетне корисне навантаження (`--batch-json`/`--batch-file`) як джерело істини; `--strict-json` / `--json` не змінюють поведінку пакетного аналізу.

Режим шляху/значення JSON також працює безпосередньо для SecretRef і постачальників:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Прапорці конструктора постачальника

Цілі конструктора постачальника мають використовувати `secrets.providers.<alias>` як шлях.

<AccordionGroup>
  <Accordion title="Загальні прапорці">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Постачальник середовища (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (можна повторювати)

  </Accordion>
  <Accordion title="Файловий постачальник (--provider-source file)">
    - `--provider-path <path>` (обов’язково)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Постачальник виконання (--provider-source exec)">
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

Приклад посиленого постачальника виконання:

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

## `config patch`

Вставте або передайте через канал конфігураційну латку JSON5 замість виконання багатьох команд `config set` на основі шляхів. Об’єкти об’єднуються рекурсивно; масиви та скалярні значення замінюють ціль; `null` видаляє цільовий шлях.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Передайте латку через стандартний ввід для сценаріїв віддаленого налаштування:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Приклад латки:

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Використовуйте `--replace-path <path>`, коли один об’єкт або масив має стати точно наданим значенням замість рекурсивного накладання латки:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` виконує перевірки схеми й можливості розв’язання SecretRef без запису. Під час пробного запуску SecretRef на основі виконуваних команд типово пропускаються; додайте `--allow-exec`, якщо навмисно хочете, щоб пробний запуск виконував команди постачальника.

## Пробний запуск

`--dry-run` перевіряє зміни без запису `openclaw.json`. Доступно для `config set`, `config patch` і `config unset`.

```bash
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
  <Accordion title="Поведінка пробного запуску">
    - Режим конструктора: виконує перевірки можливості розв’язання SecretRef для змінених посилань/провайдерів.
    - Режим JSON (`--strict-json`, `--json` або пакетний режим): виконує перевірку схеми та можливості розв’язання SecretRef.
    - Перевірка політики виконується для повної конфігурації після змін, тому запис батьківського об’єкта (наприклад, установлення `hooks` як об’єкта) не дає змоги обійти перевірку непідтримуваної поверхні.
    - Перевірки Exec SecretRef типово пропускаються, щоб уникнути побічних ефектів команд; передайте `--allow-exec`, щоб увімкнути їх (це може виконати команди провайдера). `--allow-exec` призначено лише для пробного запуску; без `--dry-run` виникає помилка.

  </Accordion>
  <Accordion title="Поля --dry-run --json">
    - `ok`: чи успішно пройшов пробний запуск
    - `operations`: кількість оцінених присвоєнь
    - `checks`: чи виконувалися перевірки схеми/можливості розв’язання
    - `checks.resolvabilityComplete`: чи перевірки можливості розв’язання завершилися повністю (false, коли посилання exec пропущено)
    - `refsChecked`: кількість посилань, фактично розв’язаних під час пробного запуску
    - `skippedExecRefs`: кількість посилань exec, пропущених через те, що `--allow-exec` не було встановлено
    - `errors`: структуровані помилки відсутнього шляху, схеми або можливості розв’язання, коли `ok=false`

  </Accordion>
</AccordionGroup>

### Структура виводу JSON

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
      ref?: string, // наявне для помилок можливості розв’язання
    },
  ],
}
```

<Tabs>
  <Tab title="Приклад успішного виконання">
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
  <Tab title="Приклад невдалого виконання">
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
          "message": "Помилка: змінну середовища \"MISSING_TEST_SECRET\" не встановлено.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Якщо пробний запуск завершився невдало">
    - `config schema validation failed`: структура конфігурації після змін недійсна; виправте шлях/значення або структуру об’єкта провайдера/посилання.
    - `Config policy validation failed: unsupported SecretRef usage`: поверніть ці облікові дані до введення у вигляді звичайного тексту/рядка; використовуйте SecretRef лише на підтримуваних поверхнях.
    - `SecretRef assignment(s) could not be resolved`: указаний провайдер/посилання наразі неможливо розв’язати (відсутня змінна середовища, недійсний вказівник на файл, помилка провайдера exec або невідповідність провайдера/джерела).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: повторно запустіть із `--allow-exec`, якщо потрібно перевірити можливість розв’язання exec.
    - У пакетному режимі виправте записи з помилками та повторно запустіть `--dry-run` перед записом.

  </Accordion>
</AccordionGroup>

## Застосування змін

Після кожного успішного виконання `config set` / `config patch` / `config unset` CLI виводить одну з трьох підказок, щоб було зрозуміло, чи потрібно перезапустити Gateway:

| Підказка                                            | Значення                                      |
| --------------------------------------------------- | --------------------------------------------- |
| `Restart the gateway to apply.`                     | Змінений шлях потребує повного перезапуску.   |
| `Change will apply without restarting the gateway.` | Гаряче перезавантаження застосує його автоматично. |
| `No gateway restart needed.`                        | Нічого важливого для середовища виконання не змінилося. |

Запис до `plugins.entries` (або будь-якого вкладеного шляху) завжди потребує перезапуску, оскільки CLI не може підтвердити, що завантажено метадані перезавантаження кожного плагіна.

## Безпека запису

`openclaw config set` та інші засоби запису конфігурації, що належать OpenClaw, перевіряють повну конфігурацію після змін перед її збереженням на диск. Якщо нове корисне навантаження не проходить перевірку схеми або схоже на руйнівне перезаписування, активна конфігурація залишається незмінною, а відхилене корисне навантаження зберігається поруч як `openclaw.json.rejected.*`.

Під час запису засоби OpenClaw повторно серіалізують JSON5 як стандартний JSON. Якщо джерело містить коментарі, засіб запису попереджає безпосередньо перед їх видаленням; використовуйте текстовий редактор безпосередньо, якщо важливо зберегти коментарі.

<Warning>
Активний шлях конфігурації має вказувати на звичайний файл. Компонування `openclaw.json` із символічними посиланнями не підтримуються для запису; натомість використовуйте `OPENCLAW_CONFIG_PATH`, щоб указати безпосередньо на справжній файл.
</Warning>

Для невеликих змін надавайте перевагу запису через CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Якщо запис відхилено, перевірте збережене корисне навантаження та виправте повну структуру конфігурації:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Безпосереднє редагування в текстовому редакторі також дозволено, але запущений Gateway вважає такі зміни ненадійними, доки вони не пройдуть перевірку. Недійсні безпосередні зміни спричиняють помилку запуску або пропускаються під час гарячого перезавантаження; Gateway не перезаписує `openclaw.json`. Запустіть `openclaw doctor --fix`, щоб відновити конфігурацію з префіксом або руйнівно перезаписану конфігурацію чи повернути останню відому справну копію. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-rejected-invalid-config).

Відновлення всього файлу призначене лише для виправлення за допомогою doctor. Зміни схеми плагіна або розбіжність `minHostVersion` спричиняють явну помилку замість відкочування непов’язаних налаштувань користувача, як-от конфігурація моделей, провайдерів, профілів автентифікації, каналів, доступності Gateway, інструментів, пам’яті, браузера або cron.

## Цикл виправлення

Після успішного виконання `openclaw config validate` скористайтеся локальним TUI, щоб вбудований агент порівняв активну конфігурацію з документацією, поки ви перевірятимете кожну зміну в тому самому терміналі:

```bash
openclaw chat
```

У TUI початковий `!` запускає буквальну локальну команду оболонки (після одноразового запиту підтвердження для кожного сеансу):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Порівняйте з документацією">
    Попросіть агента порівняти поточну конфігурацію з відповідною сторінкою документації та запропонувати найменше виправлення.
  </Step>
  <Step title="Застосуйте цільові зміни">
    Застосуйте цільові зміни за допомогою `openclaw config set` або `openclaw configure`.
  </Step>
  <Step title="Повторно перевірте">
    Повторно запускайте `openclaw config validate` після кожної зміни.
  </Step>
  <Step title="Doctor для проблем середовища виконання">
    Якщо перевірка проходить успішно, але середовище виконання все ще несправне, запустіть `openclaw doctor` або `openclaw doctor --fix`, щоб отримати допомогу з міграцією та виправленням.
  </Step>
</Steps>

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Конфігурація](/uk/gateway/configuration)
