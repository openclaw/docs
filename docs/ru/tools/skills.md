---
read_when:
    - Добавление или изменение Skills
    - Изменение ограничений для Skills, списков разрешений или правил загрузки
    - Понимание приоритета навыков и поведения снимков
sidebarTitle: Skills
summary: Skills обучают вашего агента пользоваться инструментами. Узнайте, как они загружаются, как работает приоритет и как настроить gating, allowlists и внедрение окружения.
title: Skills
x-i18n:
    generated_at: "2026-06-28T23:55:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills — это markdown-файлы инструкций, которые объясняют агенту, как и когда использовать
инструменты. Каждый Skills находится в каталоге с файлом `SKILL.md`, содержащим YAML
frontmatter и markdown-тело. OpenClaw загружает встроенные Skills и любые локальные
переопределения, а затем фильтрует их во время загрузки на основе окружения, конфигурации и
наличия бинарных файлов.

<CardGroup cols={2}>
  <Card title="Создание Skills" href="/ru/tools/creating-skills" icon="hammer">
    Соберите и протестируйте пользовательский Skills с нуля.
  </Card>
  <Card title="Мастерская Skills" href="/ru/tools/skill-workshop" icon="flask">
    Проверяйте и утверждайте предложения Skills, подготовленные агентом.
  </Card>
  <Card title="Конфигурация Skills" href="/ru/tools/skills-config" icon="gear">
    Полная схема конфигурации `skills.*` и списки разрешений агентов.
  </Card>
  <Card title="ClawHub" href="/ru/clawhub" icon="cloud">
    Просматривайте и устанавливайте Skills сообщества.
  </Card>
</CardGroup>

## Порядок загрузки

OpenClaw загружает Skills из этих источников, **сначала с наивысшим приоритетом**. Когда одно и то же
имя Skills встречается в нескольких местах, побеждает источник с наивысшим приоритетом.

| Приоритет   | Источник               | Путь                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — высший  | Skills рабочей области | `<workspace>/skills`                    |
| 2           | Skills агента проекта  | `<workspace>/.agents/skills`            |
| 3           | Личные Skills агента   | `~/.agents/skills`                      |
| 4           | Управляемые / локальные Skills | `~/.openclaw/skills`                    |
| 5           | Встроенные Skills      | поставляются с установкой               |
| 6 — низший  | Дополнительные каталоги | `skills.load.extraDirs` + Skills Plugin |

Корневые каталоги Skills поддерживают сгруппированные структуры. OpenClaw обнаруживает Skills всякий раз, когда
`SKILL.md` появляется где-либо внутри настроенного корня:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Путь к папке нужен только для организации. Имя Skills, slash-команда и
ключ списка разрешений берутся из поля frontmatter `name` (или из имени каталога,
если `name` отсутствует).

<Note>
  Нативный каталог Codex CLI `$CODEX_HOME/skills` **не** является корневым каталогом Skills
  OpenClaw. Используйте `openclaw migrate plan codex`, чтобы инвентаризировать эти Skills, затем
  `openclaw migrate codex`, чтобы скопировать их в рабочую область OpenClaw.
</Note>

## Skills для отдельного агента и общие Skills

В конфигурациях с несколькими агентами у каждого агента есть собственная рабочая область. Используйте путь, который
соответствует желаемой видимости:

| Область             | Путь                         | Видимо для                         |
| -------------- | ---------------------------- | --------------------------- |
| Для отдельного агента | `<workspace>/skills`         | Только этого агента             |
| Агент проекта       | `<workspace>/.agents/skills` | Только агента этой рабочей области |
| Личный агент        | `~/.agents/skills`           | Все агенты на этой машине  |
| Общие управляемые   | `~/.openclaw/skills`         | Все агенты на этой машине  |
| Дополнительные каталоги | `skills.load.extraDirs`      | Все агенты на этой машине  |

## Списки разрешений агентов

**Расположение** Skills (приоритет) и **видимость** Skills (какой агент может его использовать)
являются отдельными элементами управления. Используйте списки разрешений, чтобы ограничить, какие Skills видит агент,
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
  <Accordion title="Правила списков разрешений">
    - Опустите `agents.defaults.skills`, чтобы по умолчанию оставить все Skills без ограничений.
    - Опустите `agents.list[].skills`, чтобы унаследовать `agents.defaults.skills`.
    - Задайте `agents.list[].skills: []`, чтобы не предоставлять этому агенту никаких Skills.
    - Непустой список `agents.list[].skills` является **окончательным** набором — он не
      объединяется со значениями по умолчанию.
    - Итоговый список разрешений применяется к построению prompt, обнаружению slash-команд,
      синхронизации sandbox и снимкам Skills.
  </Accordion>
</AccordionGroup>

## Plugins и Skills

Plugins могут поставлять собственные Skills, указывая каталоги `skills` в
`openclaw.plugin.json` (пути относительно корня Plugin). Skills Plugin загружаются,
когда Plugin включен — например, браузерный Plugin поставляет Skills
`browser-automation` для многошагового управления браузером.

Каталоги Skills Plugin объединяются на том же уровне низкого приоритета, что и
`skills.load.extraDirs`, поэтому встроенный, управляемый, агентский или рабочий
Skills с тем же именем переопределяет их. Ограничивайте их через `metadata.openclaw.requires.config` в
записи конфигурации Plugin.

См. [Plugins](/ru/tools/plugin) и [Инструменты](/ru/tools), чтобы узнать о полной системе Plugin.

## Мастерская Skills

[Мастерская Skills](/ru/tools/skill-workshop) — это очередь предложений между агентом
и вашими активными файлами Skills. Когда агент замечает переиспользуемую работу, он создает
предложение вместо прямой записи в `SKILL.md`. Вы проверяете и утверждаете его
до внесения каких-либо изменений.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

См. [Мастерская Skills](/ru/tools/skill-workshop), чтобы узнать о полном жизненном цикле, справочнике CLI
и конфигурации.

## Установка из ClawHub

[ClawHub](https://clawhub.ai) — это публичный реестр Skills. Используйте
команды `openclaw skills` для установки и обновления или CLI `clawhub` для
публикации и синхронизации.

| Действие                           | Команда                                                |
| ---------------------------------- | ------------------------------------------------------ |
| Установить Skills в рабочую область | `openclaw skills install @owner/<slug>`                |
| Установить из Git-репозитория      | `openclaw skills install git:owner/repo@ref`           |
| Установить локальный каталог Skills | `openclaw skills install ./path/to/skill --as my-tool` |
| Установить для всех локальных агентов | `openclaw skills install @owner/<slug> --global`       |
| Обновить все Skills рабочей области | `openclaw skills update --all`                         |
| Обновить общий управляемый Skills  | `openclaw skills update @owner/<slug> --global`        |
| Обновить все общие управляемые Skills | `openclaw skills update --all --global`                |
| Проверить доверенный конверт Skills | `openclaw skills verify @owner/<slug>`                 |
| Вывести сгенерированную карточку Skills | `openclaw skills verify @owner/<slug> --card`          |
| Опубликовать / синхронизировать через CLI ClawHub | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Подробности установки">
    `openclaw skills install` по умолчанию устанавливает в каталог `skills/`
    активной рабочей области. Добавьте `--global`, чтобы установить в общий
    каталог `~/.openclaw/skills`, видимый всем локальным агентам, если списки
    разрешений агентов не сужают доступ.

    Установки из Git и локальных источников ожидают `SKILL.md` в корне источника. Slug берется
    из frontmatter `name` файла `SKILL.md`, если он корректен, затем используется
    имя каталога или репозитория. Используйте `--as <slug>` для переопределения.
    `openclaw skills update` отслеживает только установки ClawHub — переустановите источники Git или
    локальные источники, чтобы обновить их.

  </Accordion>
  <Accordion title="Проверка и сканирование безопасности">
    `openclaw skills verify @owner/<slug>` запрашивает у ClawHub доверенный конверт
    `clawhub.skill.verify.v1` для Skills. Установленные Skills ClawHub проверяются
    по версии и реестру, записанным в `.clawhub/origin.json`.
    Голые slugs остаются допустимыми для существующих установленных или однозначных Skills, но
    ссылки с указанием владельца избегают неоднозначности издателя.

    Страницы Skills в ClawHub показывают актуальное состояние сканирования безопасности перед установкой,
    с подробными страницами для VirusTotal, ClawScan и статического анализа. Команда
    завершается с ненулевым кодом, когда ClawHub помечает проверку как неуспешную. Издатели
    исправляют ложные срабатывания через панель управления ClawHub или
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Установки из приватного архива">
    Клиенты Gateway, которым нужна доставка не через ClawHub, могут подготовить zip-архив Skills
    с помощью `skills.upload.begin`, `skills.upload.chunk` и `skills.upload.commit`,
    а затем установить его через `skills.install({ source: "upload", ... })`. Этот путь
    по умолчанию отключен и требует `skills.install.allowUploadedArchives: true` в
    `openclaw.json`. Обычным установкам ClawHub эта настройка никогда не нужна.
  </Accordion>
</AccordionGroup>

## Безопасность

<Warning>
  Относитесь к сторонним Skills как к **недоверенному коду**. Читайте их перед включением.
  Для недоверенных входных данных и рискованных инструментов предпочитайте запуски в sandbox. См.
  [Sandboxing](/ru/gateway/sandboxing) для элементов управления на стороне агента.
</Warning>

<AccordionGroup>
  <Accordion title="Ограничение путей">
    Обнаружение Skills в рабочей области, у агента проекта и в дополнительных каталогах принимает только корни Skills,
    чей разрешенный realpath остается внутри настроенного корня, если только
    `skills.load.allowSymlinkTargets` явно не доверяет целевому корню.
    Мастерская Skills записывает через эти доверенные цели только тогда, когда
    включен `skills.workshop.allowSymlinkTargetWrites`.
    Управляемый `~/.openclaw/skills` и личный `~/.agents/skills` могут содержать
    папки Skills в виде символических ссылок, но каждый realpath `SKILL.md` все равно должен оставаться
    внутри разрешенного каталога Skills.
  </Accordion>
  <Accordion title="Политика установки оператора">
    Настройте `security.installPolicy`, чтобы запускать доверенную локальную команду политики
    перед продолжением установки Skills. Политика получает метаданные и путь к подготовленному
    источнику, применяется к путям ClawHub, загрузок, Git, локальным источникам, обновлениям и
    установщику зависимостей и завершает работу закрытым отказом, если команда не может вернуть
    допустимое решение.
  </Accordion>
  <Accordion title="Область внедрения секретов">
    `skills.entries.*.env` и `skills.entries.*.apiKey` внедряют секреты в
    **хостовый** процесс только на время этого хода агента — не в sandbox. Не допускайте попадания
    секретов в prompts и журналы.
  </Accordion>
</AccordionGroup>

Более широкую модель угроз и контрольные списки безопасности см. в
[Безопасность](/ru/gateway/security).

## Формат SKILL.md

Каждому Skills как минимум нужны `name` и `description` во frontmatter:

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
  к папке Skills.
</Note>

### Необязательные ключи frontmatter

<ParamField path="homepage" type="string">
  URL, показываемый как "Веб-сайт" в пользовательском интерфейсе Skills для macOS. Также поддерживается через
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Когда `true`, Skills предоставляется как вызываемая пользователем slash-команда.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Когда `true`, OpenClaw не включает инструкции Skills в обычный
  prompt агента. Skills все равно доступен как slash-команда, когда `user-invocable`
  также равно `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Когда задано `tool`, slash-команда обходит модель и отправляется
  напрямую зарегистрированному инструменту.
</ParamField>

<ParamField path="command-tool" type="string">
  Имя инструмента для вызова, когда задано `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Для отправки инструменту передает строку сырых аргументов инструменту без
  разбора ядром. Инструмент получает
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Управление доступом

OpenClaw фильтрует навыки во время загрузки с помощью `metadata.openclaw` (однострочный
JSON во frontmatter). Навык без блока `metadata.openclaw` всегда
доступен, если он не отключен явно.

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
  Если `true`, всегда включать навык и пропускать все остальные проверки.
</ParamField>

<ParamField path="emoji" type="string">
  Необязательный эмодзи, отображаемый в интерфейсе Skills macOS.
</ParamField>

<ParamField path="homepage" type="string">
  Необязательный URL, отображаемый как "Веб-сайт" в интерфейсе Skills macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Фильтр платформ. Если задан, навык доступен только на перечисленных ОС.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Каждый исполняемый файл должен существовать в `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Хотя бы один исполняемый файл должен существовать в `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Каждая переменная окружения должна существовать в процессе или предоставляться через конфигурацию.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Каждый путь `openclaw.json` должен иметь истинное значение.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Имя переменной окружения, связанной с `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Необязательные спецификации установщика, используемые интерфейсом Skills macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Устаревшие блоки `metadata.clawdbot` по-прежнему принимаются, когда
  `metadata.openclaw` отсутствует, поэтому более старые установленные навыки сохраняют свои
  проверки зависимостей и подсказки установщика. Новым навыкам следует использовать
  `metadata.openclaw`.
</Note>

### Спецификации установщика

Спецификации установщика сообщают интерфейсу Skills macOS, как установить зависимость:

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
  <Accordion title="Правила выбора установщика">
    - Когда перечислено несколько установщиков, gateway выбирает один предпочтительный
      вариант (brew, если доступен, иначе node).
    - Если все установщики имеют значение `download`, OpenClaw перечисляет каждую запись, чтобы вы могли
      видеть все доступные артефакты.
    - Спецификации могут включать `os: ["darwin"|"linux"|"win32"]` для фильтрации по платформе.
    - Установки Node учитывают `skills.install.nodeManager` в `openclaw.json`
      (по умолчанию: npm; варианты: npm / pnpm / yarn / bun). Это влияет только на
      установки навыков; среда выполнения Gateway по-прежнему должна быть Node.
    - Предпочтения установщика Gateway: Homebrew → uv → настроенный менеджер node →
      go → download.
  </Accordion>
  <Accordion title="Сведения по каждому установщику">
    - **Homebrew:** OpenClaw не устанавливает Homebrew автоматически и не преобразует формулы brew
      в команды системного пакетного менеджера. В контейнерах Linux без
      `brew` установщики, доступные только через brew, скрыты; используйте собственный образ или установите
      зависимость вручную.
    - **Go:** если `go` отсутствует, а `brew` доступен, gateway сначала устанавливает
      Go через Homebrew и задает `GOBIN` равным `bin` Homebrew.
    - **Download:** `url` (обязательно), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (по умолчанию: auto, когда обнаружен архив), `stripComponents`,
      `targetDir` (по умолчанию: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Примечания по изоляции">
    `requires.bins` проверяется на **хосте** во время загрузки навыка. Если агент
    работает в изолированной среде, исполняемый файл также должен существовать **внутри контейнера**.
    Установите его через `agents.defaults.sandbox.docker.setupCommand` или собственный
    образ. `setupCommand` выполняется один раз после создания контейнера и требует
    исходящего доступа к сети, доступной для записи корневой ФС и пользователя root в изолированной среде.
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
  Поддерживает строку открытого текста или объект SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Переменные окружения, внедряемые для запуска агента. Внедряются только тогда, когда
  переменная еще не задана в процессе.
</ParamField>

<ParamField path="config" type="object">
  Необязательный контейнер для пользовательских полей конфигурации конкретного навыка.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Необязательный список разрешений только для **встроенных** Skills. Если задан,
  допустимы только встроенные Skills из списка. Управляемые Skills и Skills рабочей области
  не затрагиваются.
</ParamField>

<Note>
  Ключи конфигурации по умолчанию совпадают с **именем Skill**. Если Skill задает
  `metadata.openclaw.skillKey`, используйте этот ключ в `skills.entries`. Заключайте
  имена с дефисами в кавычки: JSON5 допускает ключи в кавычках.
</Note>

## Внедрение окружения

Когда запускается выполнение агента, OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw определяет фактический список Skills для агента, применяя правила
    допуска, списки разрешений и переопределения конфигурации.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` и `skills.entries.<key>.apiKey` применяются к
    `process.env` на время выполнения.
  </Step>
  <Step title="Builds the system prompt">
    Допустимые Skills компилируются в компактный XML-блок и внедряются в
    системный промпт.
  </Step>
  <Step title="Restores the environment">
    После завершения выполнения исходное окружение восстанавливается.
  </Step>
</Steps>

<Warning>
  Внедрение env ограничено выполнением **хостового** агента, а не песочницей.
  Внутри песочницы `env` и `apiKey` не действуют. См.
  [Конфигурация Skills](/ru/tools/skills-config#sandboxed-skills-and-env-vars), чтобы узнать,
  как передавать секреты в изолированные выполнения.
</Warning>

Для встроенного бэкенда `claude-cli` OpenClaw также материализует тот же
снимок допустимых Skills как временный Plugin Claude Code и передает его через
`--plugin-dir`. Другие CLI-бэкенды используют только каталог промпта.

## Снимки и обновление

OpenClaw создает снимок допустимых Skills **при запуске сеанса** и повторно использует этот
список для всех последующих ходов в сеансе. Изменения Skills или конфигурации
вступают в силу в следующем новом сеансе.

Skills обновляются в середине сеанса в двух случаях:

- Наблюдатель Skills обнаруживает изменение `SKILL.md`.
- Подключается новый допустимый удаленный узел.

Обновленный список используется на следующем ходе агента. Если фактический
список разрешений агента меняется, OpenClaw обновляет снимок, чтобы видимые
Skills оставались согласованными.

<AccordionGroup>
  <Accordion title="Skills watcher">
    По умолчанию OpenClaw отслеживает папки Skills и обновляет снимок при
    изменении файлов `SKILL.md`. Настраивается в `skills.load`:

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

    Используйте `allowSymlinkTargets` для намеренных компоновок с символическими
    ссылками, где корневая символическая ссылка Skill указывает за пределы
    настроенного корня, например
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Включайте `skills.workshop.allowSymlinkTargetWrites` только когда Skill Workshop
    также должен применять предложения через эти доверенные пути символических ссылок.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Если Gateway работает на Linux, но подключен **узел macOS** с разрешенным
    `system.run`, OpenClaw может считать Skills только для macOS допустимыми,
    когда необходимые бинарные файлы присутствуют на этом узле. Агент должен
    запускать эти Skills через инструмент `exec` с `host=node`.

    Узлы не в сети **не** делают Skills, доступные только удаленно, видимыми.
    Если узел перестает отвечать на проверки бинарных файлов, OpenClaw очищает
    кэшированные совпадения бинарных файлов для него.

  </Accordion>
</AccordionGroup>

## Влияние на токены

Когда Skills допустимы, OpenClaw внедряет компактный XML-блок в системный
промпт. Стоимость детерминирована:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Базовые накладные расходы** (только когда ≥ 1 Skill): ~195 символов
- **На Skill:** ~97 символов + длины полей `name`, `description` и `location`
- XML-экранирование разворачивает `& < > " '` в сущности, добавляя несколько символов на каждое вхождение
- При ~4 символах/токен 97 символов ≈ 24 токена на Skill до учета длин полей

Делайте описания краткими и информативными, чтобы минимизировать накладные расходы промпта.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Creating skills" href="/ru/tools/creating-skills" icon="hammer">
    Пошаговое руководство по созданию пользовательского Skill.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений для Skills, подготовленных агентом.
  </Card>
  <Card title="Skills config" href="/ru/tools/skills-config" icon="gear">
    Полная схема конфигурации `skills.*` и списки разрешений агентов.
  </Card>
  <Card title="Slash commands" href="/ru/tools/slash-commands" icon="terminal">
    Как регистрируются и маршрутизируются слеш-команды Skill.
  </Card>
  <Card title="ClawHub" href="/ru/clawhub" icon="cloud">
    Просматривайте и публикуйте Skills в публичном реестре.
  </Card>
  <Card title="Plugins" href="/ru/tools/plugin" icon="plug">
    Plugins могут поставлять Skills вместе с инструментами, которые они документируют.
  </Card>
</CardGroup>
