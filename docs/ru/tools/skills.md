---
read_when:
    - Добавление или изменение Skills
    - Изменение ограничений Skills, списков разрешений или правил загрузки
    - Понимание приоритета Skills и поведения снимков
sidebarTitle: Skills
summary: Skills обучают вашего агента пользоваться инструментами. Узнайте, как они загружаются, как работает приоритет и как настроить гейтинг, списки разрешений и инъекцию окружения.
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:29:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills — это файлы инструкций в формате Markdown, которые учат агента, как и когда использовать
инструменты. Каждый skill находится в каталоге, содержащем файл `SKILL.md` с YAML
frontmatter и телом в Markdown. OpenClaw загружает встроенные Skills, а также любые локальные
переопределения, и фильтрует их во время загрузки на основе окружения, конфигурации и
наличия бинарных файлов.

<CardGroup cols={2}>
  <Card title="Создание Skills" href="/ru/tools/creating-skills" icon="hammer">
    Создайте и протестируйте пользовательский skill с нуля.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Просматривайте и одобряйте предложения Skills, подготовленные агентом.
  </Card>
  <Card title="Конфигурация Skills" href="/ru/tools/skills-config" icon="gear">
    Полная схема конфигурации `skills.*` и allowlist агентов.
  </Card>
  <Card title="ClawHub" href="/ru/clawhub" icon="cloud">
    Просматривайте и устанавливайте Skills сообщества.
  </Card>
</CardGroup>

## Порядок загрузки

OpenClaw загружает данные из этих источников, **сначала с наивысшим приоритетом**. Когда одно и то же
имя skill встречается в нескольких местах, побеждает источник с наивысшим приоритетом.

| Приоритет    | Источник                 | Путь                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — наивысший | Skills рабочей области       | `<workspace>/skills`                    |
| 2           | Skills агента проекта   | `<workspace>/.agents/skills`            |
| 3           | Личные Skills агента  | `~/.agents/skills`                      |
| 4           | Управляемые / локальные Skills | `~/.openclaw/skills`                    |
| 5           | Встроенные Skills         | поставляются вместе с установкой                |
| 6 — наименьший  | Дополнительные каталоги      | `skills.load.extraDirs` + Skills Plugin |

Корневые каталоги Skills поддерживают группированные структуры. OpenClaw обнаруживает skill, когда
`SKILL.md` появляется где-либо внутри настроенного корневого каталога:

```text
<workspace>/skills/research/SKILL.md          ✓ найден как "research"
<workspace>/skills/personal/research/SKILL.md ✓ также найден как "research"
```

Путь к папке используется только для организации. Имя skill, slash-команда и
ключ allowlist берутся из поля frontmatter `name` (или из имени каталога,
если `name` отсутствует).

<Note>
  Нативный каталог Codex CLI `$CODEX_HOME/skills` **не** является корневым каталогом Skills
  OpenClaw. Используйте `openclaw migrate plan codex`, чтобы инвентаризировать эти Skills, затем
  `openclaw migrate codex`, чтобы скопировать их в вашу рабочую область OpenClaw.
</Note>

## Skills для отдельных агентов и общие Skills

В конфигурациях с несколькими агентами у каждого агента есть собственная рабочая область. Используйте путь, который
соответствует нужной видимости:

| Область          | Путь                         | Видно для                  |
| -------------- | ---------------------------- | --------------------------- |
| Для отдельного агента      | `<workspace>/skills`         | Только этому агенту             |
| Агент проекта  | `<workspace>/.agents/skills` | Только агенту этой рабочей области |
| Личный агент | `~/.agents/skills`           | Всем агентам на этой машине  |
| Общие управляемые | `~/.openclaw/skills`         | Всем агентам на этой машине  |
| Дополнительные каталоги     | `skills.load.extraDirs`      | Всем агентам на этой машине  |

## Allowlists агентов

**Расположение** skill (приоритет) и **видимость** skill (какой агент может его использовать)
управляются отдельно. Используйте allowlists, чтобы ограничить, какие Skills видит агент,
независимо от того, откуда они загружены.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Правила allowlist">
    - Опустите `agents.defaults.skills`, чтобы по умолчанию оставить все Skills без ограничений.
    - Опустите `agents.list[].skills`, чтобы наследовать `agents.defaults.skills`.
    - Задайте `agents.list[].skills: []`, чтобы не показывать этому агенту никакие Skills.
    - Непустой список `agents.list[].skills` является **итоговым** набором — он не
      объединяется со значениями по умолчанию.
    - Эффективный allowlist применяется при построении prompt, обнаружении slash-команд,
      синхронизации sandbox и снимках Skills.
    - Это не граница авторизации shell на хосте. Если тот же агент может
      использовать `exec`, ограничьте этот shell отдельно с помощью sandboxing, изоляции OS-пользователя,
      deny/allowlists для exec и учетных данных для каждого ресурса.
  </Accordion>
</AccordionGroup>

## Plugins и Skills

Plugins могут поставлять собственные Skills, перечисляя каталоги `skills` в
`openclaw.plugin.json` (пути относительно корня Plugin). Skills Plugin загружаются,
когда Plugin включен — например, browser Plugin поставляет skill
`browser-automation` для многошагового управления браузером.

Каталоги Skills Plugin объединяются на том же уровне низкого приоритета, что и
`skills.load.extraDirs`, поэтому встроенный, управляемый, агентский или рабочей области
skill с тем же именем переопределяет их. Ограничивайте их через `metadata.openclaw.requires.config` в
записи конфигурации Plugin.

См. [Plugins](/ru/tools/plugin) и [Инструменты](/ru/tools), чтобы узнать о полной системе Plugin.

## Skill Workshop

[Skill Workshop](/ru/tools/skill-workshop) — это очередь предложений между агентом
и вашими активными файлами Skills. Когда агент замечает переиспользуемую работу, он создает
предложение вместо прямой записи в `SKILL.md`. Вы просматриваете и одобряете
его до внесения каких-либо изменений.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

См. [Skill Workshop](/ru/tools/skill-workshop) для полного жизненного цикла, справки по CLI
и настройки.

## Установка из ClawHub

[ClawHub](https://clawhub.ai) — публичный реестр skills. Используйте команды
`openclaw skills` для установки и обновления или CLI `clawhub` для
публикации и синхронизации.

| Действие                                | Команда                                                |
| --------------------------------------- | ------------------------------------------------------ |
| Установить skill в рабочую область      | `openclaw skills install @owner/<slug>`                |
| Установить из Git-репозитория           | `openclaw skills install git:owner/repo@ref`           |
| Установить локальный каталог skill      | `openclaw skills install ./path/to/skill --as my-tool` |
| Установить для всех локальных агентов   | `openclaw skills install @owner/<slug> --global`       |
| Обновить все skills рабочей области     | `openclaw skills update --all`                         |
| Обновить общий управляемый skill        | `openclaw skills update @owner/<slug> --global`        |
| Обновить все общие управляемые skills   | `openclaw skills update --all --global`                |
| Проверить trust envelope skill          | `openclaw skills verify @owner/<slug>`                 |
| Вывести сгенерированную Skill Card      | `openclaw skills verify @owner/<slug> --card`          |
| Опубликовать / синхронизировать через CLI ClawHub | `clawhub sync --all`                         |

<AccordionGroup>
  <Accordion title="Сведения об установке">
    `openclaw skills install` по умолчанию устанавливает в каталог `skills/`
    активной рабочей области. Добавьте `--global`, чтобы установить в общий
    каталог `~/.openclaw/skills`, видимый всем локальным агентам, если только
    allowlist агентов не сужают доступ.

    Установки из Git и локальных источников ожидают `SKILL.md` в корне
    источника. Slug берется из frontmatter `name` в `SKILL.md`, если он
    корректен, затем используется имя каталога или репозитория. Используйте
    `--as <slug>` для переопределения. `openclaw skills update` отслеживает
    только установки из ClawHub — переустановите источники Git или локальные
    источники, чтобы обновить их.

  </Accordion>
  <Accordion title="Проверка и сканирование безопасности">
    `openclaw skills verify @owner/<slug>` запрашивает у ClawHub trust envelope
    `clawhub.skill.verify.v1` для skill. Установленные skills из ClawHub
    проверяются по версии и реестру, записанным в `.clawhub/origin.json`.
    Голые slugs остаются допустимыми для уже установленных или однозначных
    skills, но ссылки с указанием владельца устраняют неоднозначность
    издателя.

    Страницы skills в ClawHub показывают последнее состояние сканирования
    безопасности до установки, со страницами подробностей для VirusTotal,
    ClawScan и статического анализа. Команда завершается с ненулевым кодом,
    когда ClawHub помечает проверку как неуспешную. Издатели устраняют ложные
    срабатывания через панель ClawHub или команду
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Установка из частных архивов">
    Клиенты Gateway, которым нужна доставка не через ClawHub, могут подготовить
    zip-архив skill с помощью `skills.upload.begin`, `skills.upload.chunk` и
    `skills.upload.commit`, а затем установить его через
    `skills.install({ source: "upload", ... })`. Этот путь по умолчанию
    отключен и требует `skills.install.allowUploadedArchives: true` в
    `openclaw.json`. Обычные установки из ClawHub никогда не требуют этой
    настройки.
  </Accordion>
</AccordionGroup>

## Безопасность

<Warning>
  Относитесь к сторонним skills как к **недоверенному коду**. Читайте их перед
  включением. Для недоверенных входных данных и рискованных инструментов
  предпочитайте запуск в песочнице. См. [Песочница](/ru/gateway/sandboxing) для
  средств управления на стороне агента.
</Warning>

<AccordionGroup>
  <Accordion title="Ограничение путей">
    Обнаружение skills в рабочей области, агенте проекта и дополнительных
    каталогах принимает только корни skills, у которых разрешенный realpath
    остается внутри настроенного корня, если только
    `skills.load.allowSymlinkTargets` явно не доверяет целевому корню.
    Skill Workshop выполняет запись через такие доверенные цели только когда
    включен `skills.workshop.allowSymlinkTargetWrites`.
    Управляемый `~/.openclaw/skills` и личный `~/.agents/skills` могут
    содержать папки skills, подключенные через symlink, но realpath каждого
    `SKILL.md` все равно должен оставаться внутри его разрешенного каталога
    skill.
  </Accordion>
  <Accordion title="Политика установки оператора">
    Настройте `security.installPolicy`, чтобы запускать доверенную локальную
    команду политики перед продолжением установки skills. Политика получает
    метаданные и путь к подготовленному источнику, применяется к путям ClawHub,
    загруженных архивов, Git, локальной установки, обновления и установщика
    зависимостей, а при невозможности вернуть корректное решение завершается
    в закрытом режиме.
  </Accordion>
  <Accordion title="Область внедрения секретов">
    `skills.entries.*.env` и `skills.entries.*.apiKey` внедряют секреты в
    процесс **host** только на этот ход агента — не в песочницу. Не помещайте
    секреты в prompts и logs.
  </Accordion>
</AccordionGroup>

Более широкую модель угроз и контрольные списки безопасности см. в разделе
[Безопасность](/ru/gateway/security).

## Формат SKILL.md

Каждому skill как минимум нужны `name` и `description` во frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw следует спецификации [AgentSkills](https://agentskills.io).
  Парсер frontmatter поддерживает **только однострочные ключи** — `metadata`
  должен быть однострочным JSON-объектом. Используйте `{baseDir}` в теле, чтобы
  сослаться на путь к папке skill.
</Note>

### Необязательные ключи frontmatter

<ParamField path="homepage" type="string">
  URL, отображаемый как "Веб-сайт" в пользовательском интерфейсе macOS Skills.
  Также поддерживается через `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Когда `true`, skill предоставляется как slash command, вызываемая
  пользователем.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Когда `true`, OpenClaw не включает инструкции skill в обычный prompt агента.
  Skill по-прежнему доступен как slash command, когда `user-invocable` также
  имеет значение `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Когда установлено `tool`, slash command обходит модель и отправляется
  напрямую в зарегистрированный инструмент.
</ParamField>

<ParamField path="command-tool" type="string">
  Имя инструмента для вызова, когда задано `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Для отправки инструмента пересылает в инструмент исходную строку аргументов без
  разбора ядром. Инструмент получает
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Управление доступностью

OpenClaw фильтрует навыки во время загрузки с помощью `metadata.openclaw` (однострочный
JSON во frontmatter). Навык без блока `metadata.openclaw` всегда
доступен, если он явно не отключен.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  Если `true`, всегда включает навык и пропускает все остальные проверки.
</ParamField>

<ParamField path="emoji" type="string">
  Необязательный эмодзи, отображаемый в интерфейсе macOS Skills.
</ParamField>

<ParamField path="homepage" type="string">
  Необязательный URL, отображаемый как "Website" в интерфейсе macOS Skills.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Фильтр платформ. Если задан, навык доступен только на перечисленных ОС.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Каждый бинарный файл должен существовать в `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Хотя бы один бинарный файл должен существовать в `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Каждая переменная окружения должна существовать в процессе или быть предоставлена через конфигурацию.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Каждый путь `openclaw.json` должен иметь истинное значение.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Имя переменной окружения, связанной с `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Необязательные спецификации установщика, используемые интерфейсом macOS Skills (brew / node / go / uv / download).
</ParamField>

<Note>
  Устаревшие блоки `metadata.clawdbot` по-прежнему принимаются, когда
  `metadata.openclaw` отсутствует, поэтому ранее установленные навыки сохраняют свои
  проверки зависимостей и подсказки установщика. Новые навыки должны использовать
  `metadata.openclaw`.
</Note>

### Спецификации установщика

Спецификации установщика сообщают интерфейсу macOS Skills, как установить зависимость:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Installer selection rules">
    - Когда перечислено несколько установщиков, gateway выбирает один предпочтительный
      вариант (brew, если доступен, иначе node).
    - Если все установщики имеют тип `download`, OpenClaw перечисляет каждую запись, чтобы вы могли
      видеть все доступные артефакты.
    - Спецификации могут включать `os: ["darwin"|"linux"|"win32"]` для фильтрации по платформе.
    - Установки Node учитывают `skills.install.nodeManager` в `openclaw.json`
      (по умолчанию: npm; варианты: npm / pnpm / yarn / bun). Это влияет только на
      установки навыков; среда выполнения Gateway всё равно должна быть Node.
    - Предпочтение установщика Gateway: Homebrew → uv → настроенный менеджер node →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw не устанавливает Homebrew автоматически и не преобразует brew
      formulas в команды системного пакетного менеджера. В Linux-контейнерах без
      `brew` установщики только для brew скрыты; используйте пользовательский образ или установите
      зависимость вручную.
    - **Go:** если `go` отсутствует, а `brew` доступен, gateway сначала устанавливает
      Go через Homebrew и задает `GOBIN` как `bin` Homebrew.
    - **Download:** `url` (обязательно), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (по умолчанию: auto, когда обнаружен архив), `stripComponents`,
      `targetDir` (по умолчанию: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` проверяется на **хосте** во время загрузки навыка. Если агент
    запускается в песочнице, бинарный файл также должен существовать **внутри контейнера**.
    Установите его через `agents.defaults.sandbox.docker.setupCommand` или пользовательский
    образ. `setupCommand` выполняется один раз после создания контейнера и требует
    сетевого исходящего доступа, доступной для записи корневой FS и пользователя root в песочнице.
  </Accordion>
</AccordionGroup>

## Переопределения конфигурации

Включайте и настраивайте встроенные или управляемые навыки в `skills.entries` в
`~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` отключает навык, даже если он встроен или установлен. Встроенный навык `coding-agent`
  включается явно — задайте `skills.entries.coding-agent.enabled: true`
  и убедитесь, что один из `claude`, `codex`, `opencode` или другой поддерживаемый CLI
  установлен и аутентифицирован.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Удобное поле для навыков, которые объявляют `metadata.openclaw.primaryEnv`.
  Поддерживает строку с открытым текстом или объект SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Переменные окружения, внедряемые для запуска агента. Внедряются только тогда, когда
  переменная еще не задана в процессе.
</ParamField>

<ParamField path="config" type="object">
  Необязательный контейнер для пользовательских полей конфигурации отдельного навыка.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Необязательный список разрешений только для **встроенных** навыков. Если задан, доступны только встроенные навыки
  из списка. Управляемые навыки и навыки рабочей области не затрагиваются.
</ParamField>

<Note>
  Ключи конфигурации по умолчанию совпадают с **именем навыка**. Если навык определяет
  `metadata.openclaw.skillKey`, используйте этот ключ в `skills.entries`. Заключайте
  имена с дефисами в кавычки: JSON5 разрешает ключи в кавычках.
</Note>

## Внедрение окружения

Когда запускается выполнение агента, OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw определяет эффективный список навыков для агента, применяя правила
    доступности, списки разрешений и переопределения конфигурации.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` и `skills.entries.<key>.apiKey` применяются к
    `process.env` на время выполнения.
  </Step>
  <Step title="Builds the system prompt">
    Доступные навыки компилируются в компактный XML-блок и внедряются в
    системный промпт.
  </Step>
  <Step title="Restores the environment">
    После завершения выполнения исходное окружение восстанавливается.
  </Step>
</Steps>

<Warning>
  Внедрение env ограничено запуском агента на **хосте**, а не песочницей. Внутри
  песочницы `env` и `apiKey` не действуют. См.
  [конфигурацию Skills](/ru/tools/skills-config#sandboxed-skills-and-env-vars), чтобы узнать, как
  передавать секреты в запуски в песочнице.
</Warning>

Для встроенного бэкенда `claude-cli` OpenClaw также материализует тот же
снимок доступных навыков как временный плагин Claude Code и передает его через
`--plugin-dir`. Другие CLI-бэкенды используют только каталог промптов.

## Снимки и обновление

OpenClaw создает снимок доступных навыков **при запуске сеанса** и повторно использует этот
список для всех последующих ходов в сеансе. Изменения навыков или конфигурации вступают
в силу в следующем новом сеансе.

Навыки обновляются в середине сеанса в двух случаях:

- Наблюдатель навыков обнаруживает изменение `SKILL.md`.
- Подключается новый доступный удаленный узел.

Обновленный список используется на следующем ходе агента. Если эффективный
список разрешений агента меняется, OpenClaw обновляет снимок, чтобы видимые навыки
оставались согласованными.

<AccordionGroup>
  <Accordion title="Skills watcher">
    По умолчанию OpenClaw наблюдает за папками навыков и обновляет снимок, когда
    файлы `SKILL.md` изменяются. Настройте в `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    Используйте `allowSymlinkTargets` для намеренных макетов с symlink, где symlink корня
    навыка указывает за пределы настроенного корня, например
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Включайте `skills.workshop.allowSymlinkTargetWrites` только когда Skill Workshop
    также должен применять предложения через эти доверенные пути symlink.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Если Gateway работает в Linux, но подключен **узел macOS** с разрешенным
    `system.run`, OpenClaw может считать навыки только для macOS доступными, когда
    требуемые бинарные файлы присутствуют на этом узле. Агент должен запускать эти
    навыки через инструмент `exec` с `host=node`.

    Офлайн-узлы **не** делают удаленные навыки видимыми. Если узел перестает
    отвечать на проверки бинарных файлов, OpenClaw очищает кэшированные совпадения бинарных файлов для него.

  </Accordion>
</AccordionGroup>

## Влияние на токены

Когда навыки доступны, OpenClaw внедряет компактный XML-блок в системный
промпт. Стоимость детерминирована:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Базовые накладные расходы** (только когда ≥ 1 навык): ~195 символов
- **На навык:** ~97 символов + длины полей `name`, `description` и `location`
- XML-экранирование расширяет `& < > " '` в сущности, добавляя несколько символов на каждое вхождение
- При ~4 символах/токен, 97 символов ≈ 24 токена на навык до учета длин полей

Делайте описания короткими и информативными, чтобы минимизировать накладные расходы промпта.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Creating skills" href="/ru/tools/creating-skills" icon="hammer">
    Пошаговое руководство по созданию пользовательского навыка.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений для навыков, подготовленных агентом.
  </Card>
  <Card title="Skills config" href="/ru/tools/skills-config" icon="gear">
    Полная схема конфигурации `skills.*` и списки разрешений агента.
  </Card>
  <Card title="Slash commands" href="/ru/tools/slash-commands" icon="terminal">
    Как регистрируются и маршрутизируются slash-команды навыков.
  </Card>
  <Card title="ClawHub" href="/ru/clawhub" icon="cloud">
    Просматривайте и публикуйте навыки в публичном реестре.
  </Card>
  <Card title="Plugins" href="/ru/tools/plugin" icon="plug">
    Плагины могут поставлять навыки вместе с инструментами, которые они документируют.
  </Card>
</CardGroup>
