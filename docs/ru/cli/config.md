---
read_when:
    - Вы хотите читать или редактировать конфигурацию неинтерактивно
sidebarTitle: Config
summary: Справочник CLI для `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Конфигурация
x-i18n:
    generated_at: "2026-06-28T22:42:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

Вспомогательные команды конфигурации для неинтерактивных правок в `openclaw.json`: получение/задание/применение патча/снятие/файл/схема/проверка значений по пути и вывод активного файла конфигурации. Запустите без подкоманды, чтобы открыть мастер настройки (то же самое, что `openclaw configure`).

<Note>
Когда `OPENCLAW_NIX_MODE=1`, OpenClaw считает `openclaw.json` неизменяемым. Команды только для чтения, такие как `config get`, `config file`, `config schema` и `config validate`, по-прежнему работают, но команды записи конфигурации отказываются выполняться. Вместо этого агенты должны редактировать Nix-источник установки; для официального дистрибутива nix-openclaw используйте [краткое руководство nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) и задавайте значения в `programs.openclaw.config` или `instances.<name>.config`.
</Note>

## Корневые параметры

<ParamField path="--section <section>" type="string">
  Повторяемый фильтр разделов управляемой настройки при запуске `openclaw config` без подкоманды.
</ParamField>

Поддерживаемые управляемые разделы: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## Примеры

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

Выводит сгенерированную схему JSON для `openclaw.json` в stdout как JSON.

<AccordionGroup>
  <Accordion title="Что включено">
    - Текущая корневая схема конфигурации, а также корневое строковое поле `$schema` для инструментов редактора.
    - Метаданные документации полей `title` и `description`, используемые Control UI.
    - Узлы вложенных объектов, wildcard (`*`) и элементов массива (`[]`) наследуют те же метаданные `title` / `description`, когда существует соответствующая документация поля.
    - Ветви `anyOf` / `oneOf` / `allOf` также наследуют те же метаданные документации, когда существует соответствующая документация поля.
    - Метаданные схемы live Plugin + канала по мере возможности, когда можно загрузить манифесты времени выполнения.
    - Чистая резервная схема даже тогда, когда текущая конфигурация недействительна.

  </Accordion>
  <Accordion title="Связанный RPC времени выполнения">
    `config.schema.lookup` возвращает один нормализованный путь конфигурации с неглубоким узлом схемы (`title`, `description`, `type`, `enum`, `const`, общие ограничения), соответствующими метаданными подсказки UI и сводками непосредственных дочерних элементов. Используйте его для детализации по путям в Control UI или пользовательских клиентах.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Передайте вывод в файл, если хотите изучить или проверить его другими инструментами:

```bash
openclaw config schema > openclaw.schema.json
```

### Пути

Пути используют точечную или скобочную нотацию. Заключайте пути в скобочной нотации в кавычки в примерах shell, чтобы оболочки вроде zsh не разворачивали `[0]` как glob до того, как OpenClaw получит путь:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Используйте индекс списка агентов, чтобы выбрать конкретного агента:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Значения

Значения по возможности разбираются как JSON5; в противном случае они считаются строками. Используйте `--strict-json`, чтобы требовать стандартный разбор JSON без резервного варианта строки. `--json` по-прежнему поддерживается как устаревший псевдоним для `--strict-json`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

Когда включен `--strict-json`, синтаксис только JSON5, например комментарии, завершающие запятые или ключи объектов без кавычек, отклоняется. Опустите `--strict-json` для разбора значений JSON5 с резервным вариантом необработанной строки.

`config get <path> --json` выводит необработанное значение как JSON вместо текста, отформатированного для терминала.

<Note>
Присваивание объекта по умолчанию заменяет целевой путь. Защищенные пути map/list, которые обычно содержат добавленные пользователем записи, такие как `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` и `auth.profiles`, отклоняют замены, которые удалили бы существующие записи, если не передать `--replace`.
</Note>

Используйте `--merge` при добавлении записей в такие map:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Используйте `--replace` только когда намеренно хотите, чтобы переданное значение стало полным целевым значением.

## Режимы `config set`

`openclaw config set` поддерживает четыре стиля присваивания:

<Tabs>
  <Tab title="Режим значения">
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
    Режим конструктора провайдера нацелен только на пути `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Пакетный режим">
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
Присваивания SecretRef отклоняются на неподдерживаемых runtime-mutable поверхностях (например, `hooks.token`, `commands.ownerDisplaySecret`, токены webhook привязки потоков Discord и JSON учетных данных WhatsApp). См. [поверхность учетных данных SecretRef](/ru/reference/secretref-credential-surface).
</Warning>

Пакетный разбор всегда использует пакетную полезную нагрузку (`--batch-json`/`--batch-file`) как источник истины. `--strict-json` / `--json` не меняют поведение пакетного разбора.

## `config patch`

Используйте `config patch`, когда хотите вставить или передать через pipe патч в форме конфигурации вместо запуска множества команд `config set` на основе путей. Ввод представляет собой объект JSON5. Объекты сливаются рекурсивно, массивы и скалярные значения заменяют целевое значение, а `null` удаляет целевой путь.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Вы также можете передать патч через stdin, что полезно для удаленных скриптов настройки:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Пример патча:

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

Используйте `--replace-path <path>`, когда один объект или массив должен стать точно переданным значением вместо рекурсивного применения патча:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` запускает проверки схемы и разрешимости SecretRef без записи. SecretRef на основе exec по умолчанию пропускаются во время dry-run; добавьте `--allow-exec`, когда намеренно хотите, чтобы dry-run выполнял команды провайдера.

Режим пути/значения JSON по-прежнему поддерживается как для SecretRef, так и для провайдеров:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Флаги конструктора провайдера

Цели конструктора провайдера должны использовать `secrets.providers.<alias>` как путь.

<AccordionGroup>
  <Accordion title="Общие флаги">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Провайдер env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (повторяемый)

  </Accordion>
  <Accordion title="Файловый провайдер (--provider-source file)">
    - `--provider-path <path>` (обязательный)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Провайдер exec (--provider-source exec)">
    - `--provider-command <path>` (обязательный)
    - `--provider-arg <arg>` (повторяемый)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (повторяемый)
    - `--provider-pass-env <ENV_VAR>` (повторяемый)
    - `--provider-trusted-dir <path>` (повторяемый)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

Пример усиленного exec-провайдера:

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

## Пробный запуск

Используйте `--dry-run`, чтобы проверить изменения без записи `openclaw.json`.

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
  <Accordion title="Поведение пробного запуска">
    - Режим конструктора: выполняет проверки разрешимости SecretRef для измененных ссылок/поставщиков.
    - Режим JSON (`--strict-json`, `--json` или пакетный режим): выполняет проверку схемы и проверки разрешимости SecretRef.
    - Проверка политики также выполняется для известных неподдерживаемых целевых поверхностей SecretRef.
    - Проверки политики оценивают полную конфигурацию после изменения, поэтому записи родительских объектов (например, установка `hooks` как объекта) не могут обойти проверку неподдерживаемых поверхностей.
    - Проверки exec SecretRef по умолчанию пропускаются во время пробного запуска, чтобы избежать побочных эффектов команд.
    - Используйте `--allow-exec` вместе с `--dry-run`, чтобы явно включить проверки exec SecretRef (это может выполнить команды поставщика).
    - `--allow-exec` работает только для пробного запуска и выдает ошибку, если используется без `--dry-run`.

  </Accordion>
  <Accordion title="Поля --dry-run --json">
    `--dry-run --json` выводит машиночитаемый отчет:

    - `ok`: прошел ли пробный запуск
    - `operations`: количество оцененных присваиваний
    - `checks`: выполнялись ли проверки схемы/разрешимости
    - `checks.resolvabilityComplete`: были ли проверки разрешимости выполнены до конца (false, когда exec-ссылки пропущены)
    - `refsChecked`: количество ссылок, фактически разрешенных во время пробного запуска
    - `skippedExecRefs`: количество exec-ссылок, пропущенных из-за того, что `--allow-exec` не был задан
    - `errors`: структурированные ошибки отсутствующего пути, схемы или разрешимости, когда `ok=false`

  </Accordion>
</AccordionGroup>

### Форма вывода JSON

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
  <Tab title="Пример успеха">
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
  <Tab title="Пример сбоя">
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
  <Accordion title="Если пробный запуск завершается с ошибкой">
    - `config schema validation failed`: форма конфигурации после изменения недействительна; исправьте путь/значение или форму объекта поставщика/ссылки.
    - `Config policy validation failed: unsupported SecretRef usage`: верните эти учетные данные к вводу открытым текстом/строкой и используйте SecretRef только на поддерживаемых поверхностях.
    - `SecretRef assignment(s) could not be resolved`: указанный поставщик/ссылка сейчас не может разрешиться (отсутствующая переменная окружения, недействительный указатель файла, сбой exec-поставщика или несоответствие поставщика/источника).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: пробный запуск пропустил exec-ссылки; запустите повторно с `--allow-exec`, если нужна проверка разрешимости exec.
    - Для пакетного режима исправьте сбойные записи и повторно запустите `--dry-run` перед записью.

  </Accordion>
</AccordionGroup>

## Безопасность записи

`openclaw config set` и другие принадлежащие OpenClaw средства записи конфигурации проверяют полную конфигурацию после изменения перед сохранением на диск. Если новая полезная нагрузка не проходит проверку схемы или выглядит как разрушительная перезапись, активная конфигурация не изменяется, а отклоненная полезная нагрузка сохраняется рядом с ней как `openclaw.json.rejected.*`.

<Warning>
Путь активной конфигурации должен быть обычным файлом. Макеты `openclaw.json` через символическую ссылку не поддерживаются для записи; вместо этого используйте `OPENCLAW_CONFIG_PATH`, чтобы указать прямо на реальный файл.
</Warning>

Для небольших правок предпочитайте запись через CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Если запись отклонена, проверьте сохраненную полезную нагрузку и исправьте форму полной конфигурации:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямые записи через редактор по-прежнему разрешены, но работающий Gateway считает их недоверенными, пока они не пройдут проверку. Недействительные прямые правки приводят к сбою запуска или пропускаются горячей перезагрузкой; Gateway не перезаписывает `openclaw.json`. Запустите `openclaw doctor --fix`, чтобы исправить конфигурацию с префиксами/перезаписью или восстановить последнюю заведомо рабочую копию. См. [устранение неполадок Gateway](/ru/gateway/troubleshooting#gateway-rejected-invalid-config).

Восстановление всего файла предназначено только для исправления через doctor. Изменения схемы Plugin или рассинхронизация `minHostVersion` остаются явными ошибками вместо отката несвязанных пользовательских настроек, таких как модели, поставщики, профили аутентификации, каналы, экспозиция gateway, инструменты, память, браузер или конфигурация cron.

## Подкоманды

- `config file`: вывести путь активного файла конфигурации (разрешенный из `OPENCLAW_CONFIG_PATH` или расположения по умолчанию). Путь должен указывать на обычный файл, а не на символическую ссылку.

Перезапустите gateway после правок.

## Проверка

Проверьте текущую конфигурацию по активной схеме без запуска gateway.

```bash
openclaw config validate
openclaw config validate --json
```

После успешного выполнения `openclaw config validate` можно использовать локальный TUI, чтобы встроенный агент сравнил активную конфигурацию с документацией, пока вы проверяете каждое изменение из того же терминала:

<Note>
Если проверка уже завершается с ошибкой, начните с `openclaw configure` или `openclaw doctor --fix`. `openclaw chat` не обходит защиту от недействительной конфигурации.
</Note>

```bash
openclaw chat
```

Затем внутри TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Типичный цикл исправления:

<Steps>
  <Step title="Сравните с документацией">
    Попросите агента сравнить текущую конфигурацию с соответствующей страницей документации и предложить минимальное исправление.
  </Step>
  <Step title="Примените целевые правки">
    Примените целевые правки с помощью `openclaw config set` или `openclaw configure`.
  </Step>
  <Step title="Повторите проверку">
    Повторно запускайте `openclaw config validate` после каждого изменения.
  </Step>
  <Step title="Doctor для проблем выполнения">
    Если проверка проходит, но среда выполнения все еще неисправна, запустите `openclaw doctor` или `openclaw doctor --fix` для помощи с миграцией и исправлением.
  </Step>
</Steps>

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Конфигурация](/ru/gateway/configuration)
