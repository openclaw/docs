---
read_when:
    - Добавление или изменение Skills
    - Изменение ограничений Skills, списков разрешений или правил загрузки
    - Понимание приоритета Skills и поведения снимков
sidebarTitle: Skills
summary: Skills учат вашего агента пользоваться инструментами. Узнайте, как они загружаются, как работает приоритет и как настроить gating, allowlists и внедрение окружения.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:43:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills — это markdown-файлы с инструкциями, которые обучают агента тому, как и когда использовать
инструменты. Каждый skill находится в каталоге, содержащем файл `SKILL.md` с YAML
frontmatter и markdown-телом. OpenClaw загружает встроенные Skills и любые локальные
переопределения, а затем фильтрует их во время загрузки на основе окружения, конфигурации и
наличия бинарных файлов.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/ru/tools/creating-skills" icon="hammer">
    Создайте и протестируйте пользовательский skill с нуля.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Просматривайте и утверждайте предложения Skills, подготовленные агентом.
  </Card>
  <Card title="Skills config" href="/ru/tools/skills-config" icon="gear">
    Полная схема конфигурации `skills.*` и списки разрешенных агентов.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Просматривайте и устанавливайте Skills сообщества.
  </Card>
</CardGroup>

## Порядок загрузки

OpenClaw загружает из этих источников, **сначала с наивысшим приоритетом**. Когда одно и то же
имя skill встречается в нескольких местах, побеждает источник с наивысшим приоритетом.

| Приоритет    | Источник                 | Путь                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — наивысший | Skills рабочей области       | `<workspace>/skills`                    |
| 2           | Skills агента проекта   | `<workspace>/.agents/skills`            |
| 3           | Личные Skills агента  | `~/.agents/skills`                      |
| 4           | Управляемые / локальные Skills | `~/.openclaw/skills`                    |
| 5           | Встроенные Skills         | поставляются вместе с установкой                |
| 6 — низший  | Дополнительные каталоги      | `skills.load.extraDirs` + Skills Plugin |

Корневые каталоги Skills поддерживают сгруппированные структуры. OpenClaw обнаруживает skill всякий раз,
когда `SKILL.md` появляется где-либо внутри настроенного корневого каталога:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Путь к папке используется только для организации. Имя skill, slash-команда и
ключ списка разрешений берутся из поля frontmatter `name` (или из имени каталога,
если `name` отсутствует).

<Note>
  Нативный каталог Codex CLI `$CODEX_HOME/skills` **не** является корневым каталогом Skills
  OpenClaw. Используйте `openclaw migrate plan codex`, чтобы инвентаризировать эти Skills, затем
  `openclaw migrate codex`, чтобы скопировать их в рабочую область OpenClaw.
</Note>

## Skills для отдельного агента и общие Skills

В многоагентных конфигурациях у каждого агента есть собственная рабочая область. Используйте путь, который
соответствует нужной видимости:

| Область          | Путь                         | Видно                  |
| -------------- | ---------------------------- | --------------------------- |
| Для отдельного агента      | `<workspace>/skills`         | Только этому агенту             |
| Агент проекта  | `<workspace>/.agents/skills` | Только агенту этой рабочей области |
| Личный агент | `~/.agents/skills`           | Всем агентам на этой машине  |
| Общий управляемый | `~/.openclaw/skills`         | Всем агентам на этой машине  |
| Дополнительные каталоги     | `skills.load.extraDirs`      | Всем агентам на этой машине  |

## Списки разрешений агентов

**Расположение** skill (приоритет) и **видимость** skill (какой агент может его использовать)
являются отдельными средствами управления. Используйте списки разрешений, чтобы ограничить, какие Skills видит агент,
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
  <Accordion title="Allowlist rules">
    - Опустите `agents.defaults.skills`, чтобы по умолчанию оставить все Skills без ограничений.
    - Опустите `agents.list[].skills`, чтобы наследовать `agents.defaults.skills`.
    - Задайте `agents.list[].skills: []`, чтобы не открывать этому агенту доступ ни к одному skill.
    - Непустой список `agents.list[].skills` является **итоговым** набором — он не
      объединяется со значениями по умолчанию.
    - Эффективный список разрешений применяется при построении prompt, обнаружении
      slash-команд, синхронизации sandbox и snapshot Skills.
    - Это не граница авторизации shell хоста. Если тот же агент может
      использовать `exec`, ограничьте этот shell отдельно с помощью sandboxing, изоляции OS-пользователя,
      списков запрета/разрешения exec и учетных данных для отдельных ресурсов.
  </Accordion>
</AccordionGroup>

## Plugins и Skills

Plugins могут поставлять собственные Skills, перечисляя каталоги `skills` в
`openclaw.plugin.json` (пути относительно корня Plugin). Skills Plugin загружаются,
когда Plugin включен — например, browser Plugin поставляет
skill `browser-automation` для многошагового управления браузером.

Каталоги Skills Plugin объединяются на том же низкоприоритетном уровне, что и
`skills.load.extraDirs`, поэтому одноименный встроенный, управляемый, агентский или рабочий
skill переопределяет их. Ограничивайте их через `metadata.openclaw.requires.config` в
конфигурационной записи Plugin.

См. [Plugins](/ru/tools/plugin) и [Инструменты](/ru/tools) для полной системы Plugin.

## Skill Workshop

[Skill Workshop](/ru/tools/skill-workshop) — это очередь предложений между агентом
и вашими активными файлами Skills. Когда агент замечает переиспользуемую работу, он создает
предложение вместо прямой записи в `SKILL.md`. Вы просматриваете и утверждаете его
до любых изменений.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

См. [Skill Workshop](/ru/tools/skill-workshop) для полного жизненного цикла, справочника CLI
и конфигурации.

## Установка из ClawHub

[ClawHub](https://clawhub.ai) — публичный реестр Skills. Используйте команды
`openclaw skills` для установки и обновления или CLI `clawhub` для
публикации и синхронизации.

| Действие                             | Команда                                                |
| ---------------------------------- | ------------------------------------------------------ |
| Установить skill в рабочую область | `openclaw skills install @owner/<slug>`                |
| Установить из Git-репозитория      | `openclaw skills install git:owner/repo@ref`           |
| Установить локальный каталог skill    | `openclaw skills install ./path/to/skill --as my-tool` |
| Установить для всех локальных агентов       | `openclaw skills install @owner/<slug> --global`       |
| Обновить все Skills рабочей области        | `openclaw skills update --all`                         |
| Обновить общий управляемый skill      | `openclaw skills update @owner/<slug> --global`        |
| Обновить все общие управляемые Skills   | `openclaw skills update --all --global`                |
| Проверить доверительный конверт skill    | `openclaw skills verify @owner/<slug>`                 |
| Вывести сгенерированную Skill Card     | `openclaw skills verify @owner/<slug> --card`          |
| Опубликовать / синхронизировать через ClawHub CLI     | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` по умолчанию устанавливает в каталог `skills/`
    активной рабочей области. Добавьте `--global`, чтобы установить в общий
    каталог `~/.openclaw/skills`, видимый всем локальным агентам, если списки
    разрешений агентов не сужают доступ.

    Установки из Git и локальных источников ожидают `SKILL.md` в корне источника. Slug берется
    из frontmatter `name` в `SKILL.md`, если он валиден, затем используется
    имя каталога или репозитория. Используйте `--as <slug>`, чтобы переопределить.
    `openclaw skills update` отслеживает только установки из ClawHub — переустановите источники Git или
    локальные источники, чтобы обновить их.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` запрашивает у ClawHub доверительный конверт
    `clawhub.skill.verify.v1` для skill. Установленные Skills ClawHub проверяются
    по версии и реестру, записанным в `.clawhub/origin.json`.
    Голые slugs по-прежнему принимаются для существующих установленных или однозначных Skills, но
    ссылки с указанием владельца избегают неоднозначности издателя.

    Страницы Skills в ClawHub показывают последнее состояние сканирования безопасности перед установкой,
    со страницами подробностей для VirusTotal, ClawScan и статического анализа. Команда
    завершается с ненулевым кодом, когда ClawHub помечает проверку как неудачную. Издатели
    устраняют ложные срабатывания через панель ClawHub или
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    Клиенты Gateway, которым нужна доставка не через ClawHub, могут подготовить zip-архив skill
    с помощью `skills.upload.begin`, `skills.upload.chunk` и `skills.upload.commit`,
    затем установить через `skills.install({ source: "upload", ... })`. Этот путь
    по умолчанию отключен и требует `skills.install.allowUploadedArchives: true` в
    `openclaw.json`. Обычным установкам из ClawHub эта настройка никогда не нужна.
  </Accordion>
</AccordionGroup>

## Безопасность

<Warning>
  Относитесь к сторонним Skills как к **недоверенному коду**. Читайте их перед включением.
  Для недоверенных входных данных и рискованных инструментов предпочитайте запуски в sandbox. См.
  [Sandboxing](/ru/gateway/sandboxing) для средств управления на стороне агента.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Обнаружение Skills в рабочей области, агенте проекта и дополнительном каталоге принимает только корни Skills,
    чей разрешенный realpath остается внутри настроенного корня, если только
    `skills.load.allowSymlinkTargets` явно не доверяет целевому корню.
    Skill Workshop записывает через эти доверенные цели только когда
    `skills.workshop.allowSymlinkTargetWrites` включен.
    Управляемый `~/.openclaw/skills` и личный `~/.agents/skills` могут содержать
    символьные ссылки на папки Skills, но каждый realpath `SKILL.md` все равно должен оставаться
    внутри своего разрешенного каталога skill.
  </Accordion>
  <Accordion title="Operator install policy">
    Настройте `security.installPolicy`, чтобы запускать доверенную локальную policy-команду
    перед продолжением установки skill. Policy получает метаданные и подготовленный
    путь источника, применяется к путям ClawHub, upload, Git, local, update и
    dependency-installer и закрывается отказом, когда команда не может вернуть
    валидное решение.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` и `skills.entries.*.apiKey` внедряют секреты в
    **host**-процесс только для этого хода агента — не в sandbox. Не помещайте
    секреты в prompts и logs.
  </Accordion>
</AccordionGroup>

Для более широкой модели угроз и контрольных списков безопасности см.
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
  OpenClaw следует спецификации [AgentSkills](https://agentskills.io). Парсер
  frontmatter поддерживает **только однострочные ключи** — `metadata` должен быть
  однострочным JSON-объектом. Используйте `{baseDir}` в теле, чтобы ссылаться на путь
  к папке skill.
</Note>

### Необязательные ключи frontmatter

<ParamField path="homepage" type="string">
  URL, показываемый как "Website" в macOS UI Skills. Также поддерживается через
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Когда `true`, skill доступен как вызываемая пользователем slash-команда.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Когда `true`, OpenClaw не включает инструкции skill в обычный
  prompt агента. Skill по-прежнему доступен как slash-команда, когда `user-invocable`
  также равно `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Когда установлено `tool`, slash-команда обходит модель и отправляется
  напрямую зарегистрированному инструменту.
</ParamField>

<ParamField path="command-tool" type="string">
  Имя инструмента для вызова, когда задано `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Для диспетчеризации инструмента передает в инструмент исходную строку аргументов
  без разбора в ядре. Инструмент получает
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Ограничение доступа

OpenClaw фильтрует навыки во время загрузки с помощью `metadata.openclaw` (однострочный
JSON во frontmatter). Навык без блока `metadata.openclaw` всегда
допускается, если он не отключен явно.

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
  Необязательный эмодзи, показываемый в интерфейсе Skills в macOS.
</ParamField>

<ParamField path="homepage" type="string">
  Необязательный URL, показываемый как "Website" в интерфейсе Skills в macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Фильтр платформ. Если задан, навык допускается только на перечисленных ОС.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Каждый бинарный файл должен существовать в `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Хотя бы один бинарный файл должен существовать в `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Каждая переменная среды должна существовать в процессе или быть предоставлена через конфигурацию.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Каждый путь `openclaw.json` должен иметь истинное значение.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Имя переменной среды, связанной с `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Необязательные спецификации установщика, используемые интерфейсом Skills в macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Устаревшие блоки `metadata.clawdbot` по-прежнему принимаются, когда
  `metadata.openclaw` отсутствует, поэтому у ранее установленных навыков сохраняются
  проверки зависимостей и подсказки установщика. Новые навыки должны использовать
  `metadata.openclaw`.
</Note>

### Спецификации установщика

Спецификации установщика сообщают интерфейсу Skills в macOS, как установить зависимость:

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
    - Когда указано несколько установщиков, Gateway выбирает один предпочтительный
      вариант (brew, если доступен, иначе node).
    - Если все установщики имеют тип `download`, OpenClaw перечисляет каждую
      запись, чтобы вы могли увидеть все доступные артефакты.
    - Спецификации могут включать `os: ["darwin"|"linux"|"win32"]` для фильтрации по платформе.
    - Установки Node учитывают `skills.install.nodeManager` в `openclaw.json`
      (по умолчанию: npm; варианты: npm / pnpm / yarn / bun). Это влияет только на установки
      навыков; среда выполнения Gateway все равно должна оставаться Node.
    - Предпочтение установщика Gateway: Homebrew → uv → настроенный менеджер node →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw не устанавливает Homebrew автоматически и не преобразует формулы brew
      в команды системного пакетного менеджера. В контейнерах Linux без
      `brew` установщики только для brew скрыты; используйте пользовательский образ или установите
      зависимость вручную.
    - **Go:** OpenClaw требует Go 1.21 или новее для автоматических установок навыков и
      сохраняет существующие настройки `GOBIN`, `GOPATH` и `GOTOOLCHAIN`. Если
      настроенная цепочка инструментов не может удовлетворить требуемую версию Go для модуля,
      onboarding группирует навык с ручными предварительными требованиями Go после попытки
      установки. Если `go` отсутствует, а Homebrew доступен, OpenClaw сначала устанавливает
      Go через Homebrew и задает `GOBIN` как `bin` из Homebrew. В Linux
      OpenClaw вместо этого может использовать `apt-get` от root или через беспарольный `sudo`,
      когда обновленный кандидат `golang-go` соответствует минимальной версии.
    - **Download:** `url` (обязательно), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (по умолчанию: auto при обнаружении архива), `stripComponents`,
      `targetDir` (по умолчанию: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` проверяется на **хосте** во время загрузки навыка. Если агент
    работает в песочнице, бинарный файл также должен существовать **внутри контейнера**.
    Установите его через `agents.defaults.sandbox.docker.setupCommand` или пользовательский
    образ. `setupCommand` выполняется один раз после создания контейнера и требует
    исходящего доступа к сети, доступной для записи корневой ФС и пользователя root в песочнице.
  </Accordion>
</AccordionGroup>

## Переопределения конфигурации

Включайте, отключайте и настраивайте встроенные или управляемые навыки в `skills.entries` в
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
  Поддерживает строку открытым текстом или объект SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Переменные среды, внедряемые для запуска агента. Внедряются только тогда, когда
  переменная еще не задана в процессе.
</ParamField>

<ParamField path="config" type="object">
  Необязательный контейнер для пользовательских полей конфигурации отдельного навыка.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Необязательный список разрешений только для **встроенных** навыков. Если задан, допускаются только встроенные навыки
  из списка. Управляемые навыки и навыки рабочего пространства не затрагиваются.
</ParamField>

<Note>
  Ключи конфигурации по умолчанию соответствуют **имени навыка**. Если навык определяет
  `metadata.openclaw.skillKey`, используйте этот ключ в `skills.entries`. Заключайте
  имена с дефисами в кавычки: JSON5 допускает ключи в кавычках.
</Note>

## Внедрение среды

Когда запуск агента начинается, OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw вычисляет эффективный список навыков для агента, применяя правила
    ограничения доступа, списки разрешений и переопределения конфигурации.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` и `skills.entries.<key>.apiKey` применяются к
    `process.env` на время запуска.
  </Step>
  <Step title="Builds the system prompt">
    Допущенные навыки компилируются в компактный XML-блок и внедряются в
    системный промпт.
  </Step>
  <Step title="Restores the environment">
    После завершения запуска исходная среда восстанавливается.
  </Step>
</Steps>

<Warning>
  Внедрение среды ограничено запуском агента на **хосте**, а не песочницей. Внутри
  песочницы `env` и `apiKey` не действуют. См.
  [конфигурацию Skills](/ru/tools/skills-config#sandboxed-skills-and-env-vars), чтобы узнать,
  как передавать секреты в запуски в песочнице.
</Warning>

Для встроенного бэкенда `claude-cli` OpenClaw также материализует тот же
снимок допущенных навыков как временный Plugin Claude Code и передает его через
`--plugin-dir`. Другие бэкенды CLI используют только каталог промптов.

## Снимки и обновление

OpenClaw создает снимки допущенных навыков **при запуске сессии** и повторно использует этот
список для всех последующих ходов в сессии. Изменения навыков или конфигурации
вступают в силу в следующей новой сессии.

Навыки обновляются в середине сессии в двух случаях:

- Наблюдатель навыков обнаруживает изменение `SKILL.md`.
- Подключается новый подходящий удаленный узел.

Обновленный список используется на следующем ходе агента. Если эффективный
список разрешений агента меняется, OpenClaw обновляет снимок, чтобы видимые навыки
оставались согласованными.

<AccordionGroup>
  <Accordion title="Skills watcher">
    По умолчанию OpenClaw наблюдает за папками навыков и обновляет снимок, когда
    файлы `SKILL.md` изменяются. Настраивается в `skills.load`:

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

    Используйте `allowSymlinkTargets` для намеренных макетов с символическими ссылками, где символическая ссылка
    корня навыка указывает за пределы настроенного корня, например
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Включайте `skills.workshop.allowSymlinkTargetWrites` только когда Skill Workshop
    также должен применять предложения через эти доверенные символические пути.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Если Gateway работает в Linux, но подключен **узел macOS** с разрешенным
    `system.run`, OpenClaw может считать навыки только для macOS допустимыми, когда
    требуемые бинарные файлы присутствуют на этом узле. Агент должен запускать эти
    навыки через инструмент `exec` с `host=node`.

    Офлайн-узлы **не** делают видимыми навыки, доступные только удаленно. Если узел перестает
    отвечать на проверки бинарных файлов, OpenClaw очищает кэшированные совпадения бинарных файлов для него.

  </Accordion>
</AccordionGroup>

## Влияние на токены

Когда навыки допустимы, OpenClaw внедряет компактный XML-блок в системный
промпт. Стоимость детерминирована:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Базовые накладные расходы** (только когда навыков ≥ 1): ~195 символов
- **На навык:** ~97 символов + длины ваших полей `name`, `description` и `location`
- XML-экранирование расширяет `& < > " '` в сущности, добавляя несколько символов на каждое вхождение
- При ~4 символах/токен 97 символов ≈ 24 токена на навык до учета длины полей

Делайте описания короткими и информативными, чтобы минимизировать накладные расходы промпта.

## Связанное

<CardGroup cols={2}>
  <Card title="Creating skills" href="/ru/tools/creating-skills" icon="hammer">
    Пошаговое руководство по созданию пользовательского навыка.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений для навыков, набросанных агентом.
  </Card>
  <Card title="Skills config" href="/ru/tools/skills-config" icon="gear">
    Полная схема конфигурации `skills.*` и списки разрешений агентов.
  </Card>
  <Card title="Slash commands" href="/ru/tools/slash-commands" icon="terminal">
    Как slash-команды навыков регистрируются и маршрутизируются.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Просматривайте и публикуйте навыки в публичном реестре.
  </Card>
  <Card title="Plugins" href="/ru/tools/plugin" icon="plug">
    Plugins могут поставлять навыки вместе с инструментами, которые они документируют.
  </Card>
</CardGroup>
