---
read_when:
    - Вы хотите просматривать или редактировать конфигурацию неинтерактивно
sidebarTitle: Config
summary: Справочник CLI для `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Конфигурация
x-i18n:
    generated_at: "2026-07-13T18:00:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

Неинтерактивные вспомогательные команды для `openclaw.json`: получение, задание, изменение или удаление значения по пути, вывод схемы, проверка либо вывод пути к активному файлу. Запустите `openclaw config` без подкоманды, чтобы открыть тот же пошаговый мастер, что и `openclaw configure`.

<Note>
Когда `OPENCLAW_NIX_MODE=1`, OpenClaw считает `openclaw.json` неизменяемым. Команды только для чтения (`config get`, `config file`, `config schema`, `config validate`) по-прежнему работают; команды записи конфигурации отклоняются. Вместо этого измените исходный код Nix для установки; для официального дистрибутива nix-openclaw используйте [краткое руководство по nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) и задайте значения в `programs.openclaw.config` или `instances.<name>.config`.
</Note>

## Корневые параметры

<ParamField path="--section <section>" type="string">
  Повторяемый фильтр разделов пошаговой настройки при запуске `openclaw config` без подкоманды.
</ParamField>

Разделы пошаговой настройки: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

### Пути

Точечная или скобочная нотация. Заключайте пути со скобками в кавычки в примерах команд оболочки, чтобы zsh не выполнял подстановку шаблона для `[0]`:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Считывает значение из снимка конфигурации со скрытыми данными (секреты никогда не выводятся). `--json` выводит необработанное значение в формате JSON; в противном случае строки, числа и логические значения выводятся без оформления, а объекты и массивы — как форматированный JSON.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Выводит путь к активному файлу конфигурации, определённый по `OPENCLAW_CONFIG_PATH` или расположению по умолчанию. Путь указывает на обычный файл, а не на символическую ссылку; см. [Безопасность записи](#write-safety).

### `config schema`

Выводит сгенерированную схему JSON для `openclaw.json` в стандартный поток вывода.

<AccordionGroup>
  <Accordion title="Что входит">
    - Текущая корневая схема конфигурации, а также корневое строковое поле `$schema` для инструментов редактора.
    - Метаданные документации полей `title` / `description`, используемые Control UI.
    - Узлы вложенных объектов, подстановочных знаков (`*`) и элементов массивов (`[]`) наследуют те же метаданные `title` / `description`, если существует соответствующая документация полей.
    - Ветви `anyOf` / `oneOf` / `allOf` также наследуют те же метаданные документации.
    - Получаемые по возможности актуальные метаданные схем плагинов и каналов, когда можно загрузить манифесты среды выполнения.
    - Корректная резервная схема, даже если текущая конфигурация недействительна.

  </Accordion>
  <Accordion title="Связанный RPC среды выполнения">
    `config.schema.lookup` возвращает один нормализованный путь конфигурации с неглубоким узлом схемы (`title`, `description`, `type`, `enum`, `const`, общие ограничения), соответствующими метаданными подсказок пользовательского интерфейса и сводками непосредственных дочерних элементов. Используйте его для детализации в пределах пути в Control UI или пользовательских клиентах.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Проверяет текущую конфигурацию по активной схеме без запуска Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Если проверка уже завершается ошибкой, начните с `openclaw configure` или `openclaw doctor --fix`. `openclaw chat` не обходит блокировку из-за недействительной конфигурации.
</Note>

## Значения

Значения по возможности разбираются как JSON5; в противном случае они обрабатываются как необработанные строки. Используйте `--strict-json`, чтобы требовать стандартный JSON без возврата к строковому значению (в этом случае синтаксис, допустимый только в JSON5, например комментарии, завершающие запятые или ключи без кавычек, отклоняется). `--json` — устаревший псевдоним `--strict-json` в `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` выводит необработанное значение в формате JSON вместо текста, оформленного для терминала.

<Note>
По умолчанию присваивание объекта заменяет целевой путь. Защищённые пути, которые обычно содержат добавленные пользователем записи, отклоняют замены, удаляющие существующие записи, если не передан `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` и `auth.profiles`.
</Note>

Используйте `--merge` при добавлении записей в эти отображения:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Используйте `--replace` только тогда, когда переданное значение должно намеренно стать полным целевым значением.

## Режимы `config set`

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
    Применим только к путям `secrets.providers.<alias>`:

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
Назначения SecretRef отклоняются для неподдерживаемых поверхностей, изменяемых во время выполнения (например, `hooks.token`, `commands.ownerDisplaySecret`, токенов Webhook привязки веток Discord и JSON с учётными данными WhatsApp). См. [Поверхность учётных данных SecretRef](/ru/reference/secretref-credential-surface).
</Warning>

При пакетном разборе источником истины всегда служат пакетные данные (`--batch-json`/`--batch-file`); `--strict-json` / `--json` не изменяют поведение пакетного разбора.

Режим пути и значения JSON также напрямую работает с SecretRef и провайдерами:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Флаги конструктора провайдера

Целевые пути конструктора провайдера должны использовать `secrets.providers.<alias>`.

<AccordionGroup>
  <Accordion title="Общие флаги">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Провайдер окружения (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (можно указывать многократно)

  </Accordion>
  <Accordion title="Файловый провайдер (--provider-source file)">
    - `--provider-path <path>` (обязательно)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Провайдер исполняемой команды (--provider-source exec)">
    - `--provider-command <path>` (обязательно)
    - `--provider-arg <arg>` (можно указывать многократно)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (можно указывать многократно)
    - `--provider-pass-env <ENV_VAR>` (можно указывать многократно)
    - `--provider-trusted-dir <path>` (можно указывать многократно)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

Пример усиленно защищённого провайдера исполняемой команды:

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

Вставьте или передайте по каналу патч JSON5, имеющий форму конфигурации, вместо выполнения множества команд `config set` на основе путей. Объекты объединяются рекурсивно; массивы и скалярные значения заменяют целевое значение; `null` удаляет целевой путь.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Передайте патч через стандартный поток ввода для сценариев удалённой настройки:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Используйте `--replace-path <path>`, когда один объект или массив должен стать в точности переданным значением, а не изменяться рекурсивно:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` выполняет проверки схемы и разрешимости SecretRef без записи. SecretRef, работающие через исполняемые команды, по умолчанию пропускаются при пробном запуске; добавьте `--allow-exec`, если намеренно хотите, чтобы при пробном запуске выполнялись команды провайдера.

## Пробный запуск

`--dry-run` проверяет изменения без записи `openclaw.json`. Доступно для `config set`, `config patch` и `config unset`.

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
  <Accordion title="Поведение пробного запуска">
    - Режим конструктора: выполняет проверки разрешимости SecretRef для изменённых ссылок и провайдеров.
    - Режим JSON (`--strict-json`, `--json` или пакетный режим): выполняет проверку схемы и проверки разрешимости SecretRef.
    - Проверка политик выполняется для полной конфигурации после изменений, поэтому запись родительских объектов (например, задание `hooks` в виде объекта) не позволяет обойти проверку неподдерживаемых поверхностей.
    - Проверки Exec SecretRef по умолчанию пропускаются, чтобы избежать побочных эффектов команд; передайте `--allow-exec`, чтобы включить их (при этом могут выполняться команды провайдера). `--allow-exec` предназначен только для пробного запуска и без `--dry-run` приводит к ошибке.

  </Accordion>
  <Accordion title="Поля --dry-run --json">
    - `ok`: успешно ли завершён пробный запуск
    - `operations`: количество проверенных присваиваний
    - `checks`: выполнялись ли проверки схемы и разрешимости
    - `checks.resolvabilityComplete`: завершились ли проверки разрешимости полностью (false, если ссылки exec пропущены)
    - `refsChecked`: количество ссылок, фактически разрешённых во время пробного запуска
    - `skippedExecRefs`: количество ссылок exec, пропущенных из-за того, что `--allow-exec` не был задан
    - `errors`: структурированные ошибки отсутствующего пути, схемы или разрешимости при `ok=false`

  </Accordion>
</AccordionGroup>

### Структура вывода JSON

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
      ref?: string, // присутствует для ошибок разрешимости
    },
  ],
}
```

<Tabs>
  <Tab title="Пример успешного выполнения">
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
  <Tab title="Пример ошибки">
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
          "message": "Ошибка: переменная окружения \"MISSING_TEST_SECRET\" не задана.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Если пробный запуск завершился ошибкой">
    - `config schema validation failed`: структура конфигурации после изменений недопустима; исправьте путь или значение либо структуру объекта провайдера или ссылки.
    - `Config policy validation failed: unsupported SecretRef usage`: верните эти учётные данные в виде открытого текста или строкового ввода; используйте SecretRef только на поддерживаемых поверхностях.
    - `SecretRef assignment(s) could not be resolved`: указанная ссылка или провайдер сейчас не разрешается (отсутствует переменная окружения, недопустим указатель на файл, сбой провайдера exec либо несоответствие провайдера и источника).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: повторите запуск с `--allow-exec`, если требуется проверить разрешимость exec.
    - В пакетном режиме исправьте записи с ошибками и повторно выполните `--dry-run` перед записью.

  </Accordion>
</AccordionGroup>

## Применение изменений

После каждого успешного выполнения `config set` / `config patch` / `config unset` CLI выводит одну из трёх подсказок, чтобы показать, требуется ли перезапуск Gateway:

| Подсказка                                           | Значение                                           |
| --------------------------------------------------- | -------------------------------------------------- |
| `Restart the gateway to apply.`                                  | Изменённый путь требует полного перезапуска.       |
| `Change will apply without restarting the gateway.`                                  | Горячая перезагрузка применит изменение автоматически. |
| `No gateway restart needed.`                                  | Значимых для среды выполнения изменений нет.       |

Запись в `plugins.entries` (или любой вложенный путь) всегда требует перезапуска, поскольку CLI не может гарантировать, что метаданные перезагрузки каждого плагина загружены.

## Безопасность записи

`openclaw config set` и другие средства записи конфигурации, принадлежащие OpenClaw, проверяют полную конфигурацию после изменений перед сохранением на диск. Если новые данные не проходят проверку схемы или выглядят как разрушительная перезапись, активная конфигурация остаётся без изменений, а отклонённые данные сохраняются рядом с ней как `openclaw.json.rejected.*`.

<Warning>
Путь к активной конфигурации должен указывать на обычный файл. Схемы с символической ссылкой `openclaw.json` не поддерживают запись; вместо этого используйте `OPENCLAW_CONFIG_PATH`, чтобы напрямую указать реальный файл.
</Warning>

Для небольших изменений предпочитайте запись через CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Если запись отклонена, проверьте сохранённые данные и исправьте полную структуру конфигурации:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямая запись через редактор также разрешена, но работающий Gateway считает такие изменения недоверенными, пока они не пройдут проверку. Недопустимые прямые изменения приводят к сбою запуска или пропускаются при горячей перезагрузке; Gateway не перезаписывает `openclaw.json`. Запустите `openclaw doctor --fix`, чтобы исправить конфигурацию с добавленным префиксом или разрушительной перезаписью либо восстановить последнюю заведомо исправную копию. См. [Устранение неполадок Gateway](/ru/gateway/troubleshooting#gateway-rejected-invalid-config).

Восстановление всего файла предназначено только для исправления с помощью doctor. Изменения схемы плагина или рассинхронизация `minHostVersion` приводят к явной ошибке, а не к откату не связанных с ними пользовательских настроек, таких как конфигурация моделей, провайдеров, профилей аутентификации, каналов, внешней доступности Gateway, инструментов, памяти, браузера или cron.

## Цикл исправления

После успешного прохождения `openclaw config validate` используйте локальный TUI, чтобы встроенный агент сравнил активную конфигурацию с документацией, пока вы проверяете каждое изменение в том же терминале:

```bash
openclaw chat
```

В TUI начальный символ `!` запускает буквальную локальную команду оболочки (после однократного запроса подтверждения для каждого сеанса):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Сравните с документацией">
    Попросите агента сравнить текущую конфигурацию с соответствующей страницей документации и предложить минимальное исправление.
  </Step>
  <Step title="Примените точечные изменения">
    Примените точечные изменения с помощью `openclaw config set` или `openclaw configure`.
  </Step>
  <Step title="Повторите проверку">
    Повторно запускайте `openclaw config validate` после каждого изменения.
  </Step>
  <Step title="Используйте doctor для проблем среды выполнения">
    Если проверка проходит, но среда выполнения по-прежнему работает некорректно, запустите `openclaw doctor` или `openclaw doctor --fix` для помощи с миграцией и исправлением.
  </Step>
</Steps>

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Конфигурация](/ru/gateway/configuration)
