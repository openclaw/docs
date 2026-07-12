---
read_when:
    - Добавление или изменение Skills
    - Изменение ограничений, списков разрешений или правил загрузки Skills
    - Понимание приоритетов Skills и поведения снимков
sidebarTitle: Skills
summary: Skills обучают вашего агента использовать инструменты. Узнайте, как они загружаются, как работают приоритеты и как настроить условия активации, списки разрешений и внедрение переменных окружения.
title: Skills
x-i18n:
    generated_at: "2026-07-12T11:57:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills — это файлы инструкций в формате Markdown, которые объясняют агенту, как и когда использовать
инструменты. Каждый skill находится в каталоге, содержащем файл `SKILL.md` с YAML-
метаданными и телом в формате Markdown. OpenClaw загружает встроенные skills и все локальные
переопределения, а затем фильтрует их во время загрузки на основе окружения, конфигурации и
наличия исполняемых файлов.

<CardGroup cols={2}>
  <Card title="Создание skills" href="/ru/tools/creating-skills" icon="hammer">
    Создайте и протестируйте собственный skill с нуля.
  </Card>
  <Card title="Мастерская skills" href="/ru/tools/skill-workshop" icon="flask">
    Проверяйте и утверждайте предложения skills, подготовленные агентом.
  </Card>
  <Card title="Конфигурация skills" href="/ru/tools/skills-config" icon="gear">
    Полная схема конфигурации `skills.*` и списки разрешённых skills для агентов.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Просматривайте и устанавливайте skills сообщества.
  </Card>
</CardGroup>

## Порядок загрузки

OpenClaw загружает skills из следующих источников, **начиная с источника с наивысшим приоритетом**. Если skill с одним и тем же
именем присутствует в нескольких местах, используется источник с наивысшим приоритетом.

| Приоритет       | Источник                         | Путь                                    |
| --------------- | -------------------------------- | --------------------------------------- |
| 1 — наивысший   | Skills рабочей области           | `<workspace>/skills`                    |
| 2               | Skills агента проекта            | `<workspace>/.agents/skills`            |
| 3               | Личные skills агента             | `~/.agents/skills`                      |
| 4               | Управляемые / локальные skills   | `~/.openclaw/skills`                    |
| 5               | Встроенные skills                | поставляются вместе с установкой        |
| 6 — наименьший  | Дополнительные каталоги          | `skills.load.extraDirs` + skills плагинов |

Корневые каталоги skills поддерживают сгруппированную структуру. OpenClaw обнаруживает skill, если
`SKILL.md` находится в любом месте настроенного корневого каталога (на глубине до 6 уровней):

```text
<workspace>/skills/research/SKILL.md          ✓ найден как "research"
<workspace>/skills/personal/research/SKILL.md ✓ также найден как "research"
```

Путь к папке используется только для организации. Имя skill и команда с косой чертой
берутся из поля `name` метаданных (или из имени каталога, если `name`
отсутствует). Списки разрешённых skills для агентов (см. ниже) также сопоставляются по этому `name`.

<Note>
  Нативный каталог `$CODEX_HOME/skills` в Codex CLI **не** является корневым каталогом
  skills OpenClaw. Используйте `openclaw migrate plan codex`, чтобы получить перечень этих skills, а затем
  `openclaw migrate codex`, чтобы скопировать их в рабочую область OpenClaw.
</Note>

## Skills, размещённые на Node

Подключённый Node без графического интерфейса может публиковать skills, установленные в его активном каталоге
skills OpenClaw (`~/.openclaw/skills` по умолчанию; применяются переопределения
окружения профиля). Пока Node подключён, они отображаются в обычном списке skills агента,
а после отключения исчезают. При конфликте локальный skill или skill Gateway сохраняет своё имя,
а skill Node получает детерминированное имя с префиксом Node.
Для размещённых на Node skills версии 1 имя каталога должно совпадать с полем `name`
в метаданных skill.

Запись skill содержит указатель на Node. Его файлы, относительные ссылки и
исполняемые файлы находятся на Node, поэтому загружайте и выполняйте его с помощью
`exec host=node node=<node-id>`. Перезапускайте хост Node после изменения файлов skill.
Сведения о сопряжении и отключении см. в разделе [Nodes](/ru/nodes#node-hosted-skills).

## Индивидуальные и общие skills агентов

В конфигурациях с несколькими агентами у каждого агента есть собственная рабочая область. Используйте путь,
соответствующий желаемой области видимости:

| Область                   | Путь                         | Кому доступно                              |
| ------------------------- | ---------------------------- | ------------------------------------------ |
| Для отдельного агента     | `<workspace>/skills`         | Только этому агенту                        |
| Для агента проекта        | `<workspace>/.agents/skills` | Только агенту этой рабочей области         |
| Личные skills агента      | `~/.agents/skills`           | Всем агентам на этом компьютере            |
| Общие управляемые skills  | `~/.openclaw/skills`         | Всем агентам на этом компьютере            |
| Дополнительные каталоги   | `skills.load.extraDirs`      | Всем агентам на этом компьютере            |

## Списки разрешённых skills для агентов

**Расположение** skill (приоритет) и его **видимость** (какой агент может его использовать)
настраиваются независимо. Используйте списки разрешённых skills, чтобы ограничить набор skills, доступных агенту,
независимо от источника их загрузки.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // общая базовая конфигурация
    },
    list: [
      { id: "writer" }, // наследует github, weather
      { id: "docs", skills: ["docs-search"] }, // полностью заменяет значения по умолчанию
      { id: "locked-down", skills: [] }, // без skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Правила списков разрешённых skills">
    - Не указывайте `agents.defaults.skills`, чтобы по умолчанию не ограничивать доступ ни к одному skill.
    - Не указывайте `agents.list[].skills`, чтобы наследовать `agents.defaults.skills`.
    - Установите `agents.list[].skills: []`, чтобы не предоставлять агенту никаких skills.
    - Непустой список `agents.list[].skills` является **окончательным** набором — он не
      объединяется со значениями по умолчанию.
    - Итоговый список разрешённых skills применяется при формировании запроса, обнаружении
      команд с косой чертой, синхронизации песочницы и создании снимков skills.
    - Это не граница авторизации командной оболочки хоста. Если тот же агент может
      использовать `exec`, ограничьте эту оболочку отдельно с помощью песочницы, изоляции
      пользователей ОС, списков запрещённых и разрешённых команд exec и отдельных учётных данных для каждого ресурса.
  </Accordion>
</AccordionGroup>

## Плагины и skills

Плагины могут поставлять собственные skills, перечисляя каталоги `skills` в
`openclaw.plugin.json` (пути указываются относительно корневого каталога плагина). Skills плагина загружаются,
когда плагин включён. Например, плагин браузера поставляет skill
`browser-automation` для многоэтапного управления браузером.

Каталоги skills плагинов объединяются на том же низком уровне приоритета, что и
`skills.load.extraDirs`, поэтому встроенный, управляемый, агентский или относящийся к рабочей области
skill с тем же именем переопределяет их. Условия доступности самого skill плагина задаются через
`metadata.openclaw.requires` в его метаданных, как и для любого другого skill.

Полное описание системы плагинов см. в разделах [Плагины](/ru/tools/plugin) и [Инструменты](/ru/tools).

## Мастерская skills

[Мастерская skills](/ru/tools/skill-workshop) — это очередь предложений между агентом
и вашими активными файлами skills. Когда агент обнаруживает работу, которую можно использовать повторно, он создаёт
черновик предложения вместо прямой записи в `SKILL.md`. Вы проверяете и утверждаете
предложение до внесения любых изменений.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Полное описание жизненного цикла, справочник CLI
и конфигурацию см. в разделе [Мастерская skills](/ru/tools/skill-workshop).

## Установка из ClawHub

[ClawHub](https://clawhub.ai) — это общедоступный реестр skills. Используйте команды
`openclaw skills` для установки и обновления или CLI `clawhub` для
публикации и синхронизации.

| Действие                                      | Команда                                                |
| --------------------------------------------- | ------------------------------------------------------ |
| Установить skill в рабочую область            | `openclaw skills install @owner/<slug>`                |
| Установить из репозитория Git                 | `openclaw skills install git:owner/repo@ref`           |
| Установить локальный каталог skill            | `openclaw skills install ./path/to/skill --as my-tool` |
| Установить для всех локальных агентов         | `openclaw skills install @owner/<slug> --global`       |
| Обновить все skills рабочей области           | `openclaw skills update --all`                         |
| Обновить общий управляемый skill              | `openclaw skills update @owner/<slug> --global`        |
| Обновить все общие управляемые skills         | `openclaw skills update --all --global`                |
| Проверить контур доверия skill                | `openclaw skills verify @owner/<slug>`                 |
| Вывести созданную карточку skill              | `openclaw skills verify @owner/<slug> --card`          |
| Опубликовать / синхронизировать через CLI ClawHub | `clawhub sync --all`                                |

<AccordionGroup>
  <Accordion title="Сведения об установке">
    По умолчанию `openclaw skills install` устанавливает skill в каталог `skills/`
    активной рабочей области. Добавьте `--global`, чтобы установить его в общий каталог
    `~/.openclaw/skills`, доступный всем локальным агентам, если их списки разрешённых skills
    не ограничивают доступ.

    При установке из Git или локального источника файл `SKILL.md` должен находиться в корне источника. Короткое имя берётся
    из поля `name` метаданных `SKILL.md`, если оно допустимо, иначе используется
    имя каталога или репозитория. Используйте `--as <slug>`, чтобы переопределить его.
    `openclaw skills update` отслеживает только установки из ClawHub — для обновления источников Git или
    локальных источников установите их повторно.

  </Accordion>
  <Accordion title="Проверка и сканирование безопасности">
    `openclaw skills verify @owner/<slug>` запрашивает у ClawHub
    контур доверия skill `clawhub.skill.verify.v1`. Установленные из ClawHub skills проверяются
    по версии и реестру, записанным в `.clawhub/origin.json`.
    Короткие имена без владельца по-прежнему принимаются для уже установленных или однозначно определяемых skills, но
    ссылки с указанием владельца исключают неоднозначность издателя.

    Перед установкой страницы skills в ClawHub показывают состояние последнего сканирования безопасности,
    а отдельные страницы содержат сведения от VirusTotal, ClawScan и статического анализа. Команда
    завершается с ненулевым кодом, если ClawHub помечает проверку как неуспешную. Издатели
    могут устранить ложные срабатывания через панель управления ClawHub или командой
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Установка из частных архивов">
    Клиенты Gateway, которым требуется доставка не через ClawHub, могут подготовить ZIP-архив skill
    с помощью `skills.upload.begin`, `skills.upload.chunk` и `skills.upload.commit`,
    а затем установить его через `skills.install({ source: "upload", ... })`. Этот путь
    по умолчанию отключён и требует значения `skills.install.allowUploadedArchives: true` в
    `openclaw.json`. Для обычной установки из ClawHub этот параметр не требуется.
  </Accordion>
</AccordionGroup>

## Безопасность

<Warning>
  Рассматривайте сторонние skills как **недоверенный код**. Прочитайте их перед включением.
  Для недоверенных входных данных и рискованных инструментов предпочитайте запуск в песочнице. Элементы управления
  на стороне агента описаны в разделе [Песочница](/ru/gateway/sandboxing).
</Warning>

<AccordionGroup>
  <Accordion title="Ограничение путей">
    При обнаружении skills в рабочей области, у агента проекта и в дополнительных каталогах принимаются только корневые каталоги skills,
    разрешённый реальный путь которых остаётся внутри настроенного корневого каталога, если только
    `skills.load.allowSymlinkTargets` явно не объявляет целевой корневой каталог доверенным.
    Мастерская skills выполняет запись через такие доверенные цели, только когда включён параметр
    `skills.workshop.allowSymlinkTargetWrites`.
    Управляемый каталог `~/.openclaw/skills` и личный каталог `~/.agents/skills` могут содержать
    папки skills, являющиеся символическими ссылками, но реальный путь каждого `SKILL.md` всё равно должен оставаться
    внутри разрешённого каталога соответствующего skill.
  </Accordion>
  <Accordion title="Политика установки оператора">
    Настройте `security.installPolicy`, чтобы перед продолжением установки skill запускалась
    доверенная локальная команда политики. Политика получает метаданные и путь к подготовленному
    источнику, применяется к установкам из ClawHub, загруженных архивов, Git и локальных источников, обновлениям и
    установщикам зависимостей и запрещает операцию, если команда не может вернуть
    допустимое решение.
  </Accordion>
  <Accordion title="Область внедрения секретов">
    `skills.entries.*.env` и `skills.entries.*.apiKey` внедряют секреты в
    процесс **хоста** только на время этого хода агента, но не в песочницу. Не включайте
    секреты в запросы и журналы.
  </Accordion>
</AccordionGroup>

Более широкую модель угроз и контрольные списки безопасности см. в разделе
[Безопасность](/ru/gateway/security).

## Формат SKILL.md

Каждый skill должен содержать в метаданных как минимум `name` и `description`:

```markdown
---
name: image-lab
description: Создание или редактирование изображений с помощью рабочего процесса, использующего поставщика
---

Когда пользователь просит создать изображение, используйте инструмент `image_generate`...
```

<Note>
  OpenClaw следует спецификации [AgentSkills](https://agentskills.io). Frontmatter
  сначала разбирается как YAML; при ошибке используется резервный парсер,
  поддерживающий только одну строку. Вложенные блоки `metadata` (включая
  многострочные сопоставления YAML) преобразуются в строку JSON и повторно
  разбираются как JSON5, поэтому форма блока, показанная в разделе
  [Условия доступности](#gating), работает. Используйте `{baseDir}` в тексте,
  чтобы сослаться на путь к папке Skills.
</Note>

### Необязательные ключи frontmatter

<ParamField path="homepage" type="string">
  URL, отображаемый как "Website" в интерфейсе Skills для macOS. Также
  поддерживается через `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  При значении `true` Skills становится доступным как вызываемая пользователем
  команда с косой чертой.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  При значении `true` OpenClaw не включает инструкции Skills в обычный промпт
  агента. Skills по-прежнему доступен как команда с косой чертой, если
  `user-invocable` также имеет значение `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Если задано значение `tool`, команда с косой чертой обходит модель и
  передаётся непосредственно зарегистрированному инструменту.
</ParamField>

<ParamField path="command-tool" type="string">
  Имя инструмента, вызываемого при заданном `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  При передаче инструменту исходная строка аргументов направляется ему без
  разбора ядром. Инструмент получает
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Условия доступности

OpenClaw фильтрует Skills во время загрузки с помощью `metadata.openclaw`
(объекта JSON5, встроенного во frontmatter; см. примечание о разборе выше).
Skills без блока `metadata.openclaw` всегда считается доступным, если он не
отключён явно.

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
  При значении `true` всегда включать Skills и пропускать все остальные
  проверки.
</ParamField>

<ParamField path="emoji" type="string">
  Необязательный эмодзи, отображаемый в интерфейсе Skills для macOS.
</ParamField>

<ParamField path="homepage" type="string">
  Необязательный URL, отображаемый как "Website" в интерфейсе Skills для macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Фильтр платформ. Если он задан, Skills доступен только в перечисленных ОС.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Каждый исполняемый файл должен присутствовать в `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  В `PATH` должен присутствовать хотя бы один исполняемый файл.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Каждая переменная окружения должна существовать в процессе или быть
  предоставлена через конфигурацию.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Каждый путь в `openclaw.json` должен иметь истинное значение.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Имя переменной окружения, связанной с `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Необязательные спецификации установщиков, используемые интерфейсом Skills
  для macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Устаревшие блоки `metadata.clawdbot` по-прежнему принимаются при отсутствии
  `metadata.openclaw`, поэтому ранее установленные Skills сохраняют проверки
  зависимостей и подсказки установщика. Новые Skills должны использовать
  `metadata.openclaw`.
</Note>

### Спецификации установщиков

Спецификации установщиков сообщают интерфейсу Skills для macOS, как установить
зависимость:

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
    - Если указано несколько установщиков, Gateway выбирает один
      предпочтительный вариант (brew, если доступен, иначе node).
    - Если все установщики имеют тип `download`, OpenClaw перечисляет каждую
      запись, чтобы были видны все доступные артефакты.
    - Спецификации могут включать `os: ["darwin"|"linux"|"win32"]` для
      фильтрации по платформе.
    - При установке через Node учитывается `skills.install.nodeManager` в
      `openclaw.json` (по умолчанию npm; варианты: npm / pnpm / yarn / bun).
      Это влияет только на установку Skills; средой выполнения Gateway
      по-прежнему должен быть Node.
    - Порядок предпочтения установщиков Gateway: Homebrew → uv → настроенный
      менеджер Node → go → download.
  </Accordion>
  <Accordion title="Сведения по установщикам">
    - **Homebrew:** OpenClaw не устанавливает Homebrew автоматически и не
      преобразует формулы brew в команды системного менеджера пакетов. В
      контейнерах Linux без `brew` установщики, поддерживающие только brew,
      скрыты; используйте собственный образ или установите зависимость вручную.
    - **Go:** Для автоматической установки Skills OpenClaw требуется Go 1.21
      или новее. Если `go` отсутствует, но доступен Homebrew, OpenClaw сначала
      устанавливает Go через Homebrew; в Linux без Homebrew вместо этого можно
      использовать `apt-get` от имени root или через `sudo` без пароля, если
      обновлённая версия-кандидат `golang-go` соответствует минимальному
      требованию. Фактическая команда `go install` для зависимости всегда
      использует отдельный каталог исполняемых файлов под управлением OpenClaw
      (`bin` Homebrew при новой установке, иначе `~/.local/bin`), а не
      настроенный вами `GOBIN` — ваши переменные окружения `GOBIN`, `GOPATH` и
      `GOTOOLCHAIN` считываются, но никогда не перезаписываются.
    - **Загрузка:** `url` (обязательно), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (по умолчанию автоматически при обнаружении архива),
      `stripComponents`, `targetDir` (по умолчанию:
      `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Примечания об изоляции">
    `requires.bins` проверяется на **хосте** во время загрузки Skills. Если
    агент работает в изолированной среде, исполняемый файл также должен
    присутствовать **внутри контейнера**. Установите его через
    `agents.defaults.sandbox.docker.setupCommand` или собственный образ.
    `setupCommand` выполняется один раз после создания контейнера и требует
    исходящего сетевого доступа, доступной для записи корневой файловой системы
    и пользователя root в изолированной среде.
  </Accordion>
</AccordionGroup>

## Переопределения конфигурации

Включайте, отключайте и настраивайте встроенные или управляемые Skills в
`skills.entries` файла `~/.openclaw/openclaw.json`:

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
  Значение `false` отключает Skills, даже если он встроен или установлен.
  Встроенный Skills `coding-agent` требует явного включения — задайте
  `skills.entries.coding-agent.enabled: true` и убедитесь, что `claude`,
  `codex`, `opencode` или другой поддерживаемый CLI установлен и прошёл
  аутентификацию.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Вспомогательное поле для Skills, объявляющих
  `metadata.openclaw.primaryEnv`. Поддерживает строку с открытым текстом или
  объект SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Переменные окружения, внедряемые на время запуска агента. Внедряются только
  в том случае, если переменная ещё не задана в процессе.
</ParamField>

<ParamField path="config" type="object">
  Необязательный набор пользовательских полей конфигурации для конкретного
  Skills.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Необязательный список разрешённых только для **встроенных** Skills. Если он
  задан, доступны только перечисленные встроенные Skills. Управляемые Skills
  и Skills рабочей области не затрагиваются.
</ParamField>

<Note>
  По умолчанию ключи конфигурации соответствуют **имени Skills**. Если Skills
  определяет `metadata.openclaw.skillKey`, используйте вместо этого данный
  ключ в `skills.entries`. Имена с дефисами заключайте в кавычки: JSON5
  допускает ключи в кавычках.
</Note>

## Внедрение переменных окружения

При запуске агента OpenClaw выполняет следующие действия:

<Steps>
  <Step title="Читает метаданные Skills">
    OpenClaw определяет итоговый список Skills для агента, применяя правила
    доступности, списки разрешённых и переопределения конфигурации.
  </Step>
  <Step title="Внедряет переменные окружения и ключи API">
    `skills.entries.<key>.env` и `skills.entries.<key>.apiKey` применяются к
    `process.env` на время выполнения.
  </Step>
  <Step title="Формирует системный промпт">
    Доступные Skills компилируются в компактный блок XML и внедряются в
    системный промпт.
  </Step>
  <Step title="Восстанавливает окружение">
    После завершения выполнения исходное окружение восстанавливается.
  </Step>
</Steps>

<Warning>
  Внедрение переменных окружения применяется к запуску агента на **хосте**, а
  не к изолированной среде. Внутри изолированной среды `env` и `apiKey` не
  действуют. Сведения о передаче секретов в изолированные запуски см. в
  разделе [Конфигурация Skills](/ru/tools/skills-config#sandboxed-skills-and-env-vars).
</Warning>

Для встроенного бэкенда `claude-cli` OpenClaw также материализует тот же снимок
доступных Skills как временный Plugin Claude Code и передаёт его через
`--plugin-dir`. Другие бэкенды CLI используют только каталог промпта.

## Снимки и обновление

OpenClaw создаёт снимок доступных Skills **при запуске сеанса** и повторно
использует этот список для всех последующих ходов в сеансе. Изменения Skills
или конфигурации вступают в силу в следующем новом сеансе.

Skills обновляются во время сеанса в двух случаях:

- Наблюдатель Skills обнаруживает изменение `SKILL.md`.
- Подключается новый доступный удалённый узел.

Обновлённый список используется при следующем ходе агента. Если итоговый список
разрешённых для агента изменяется, OpenClaw обновляет снимок, чтобы видимые
Skills соответствовали ему.

<AccordionGroup>
  <Accordion title="Наблюдатель Skills">
    По умолчанию OpenClaw отслеживает папки Skills и обновляет снимок при
    изменении файлов `SKILL.md`. Настройте это в `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    Используйте `allowSymlinkTargets` для намеренно созданных структур с
    символическими ссылками, в которых ссылка на корневую папку Skills
    указывает за пределы настроенной корневой папки, например
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Включайте `skills.workshop.allowSymlinkTargetWrites` только тогда, когда
    Skill Workshop также должен применять предложения через эти доверенные
    пути с символическими ссылками.

  </Accordion>
  <Accordion title="Удалённые узлы macOS (Gateway в Linux)">
    Если Gateway работает в Linux, но подключён **узел macOS** с разрешённым
    `system.run`, OpenClaw может считать Skills только для macOS доступными,
    когда необходимые исполняемые файлы присутствуют на этом узле. Агент
    должен запускать такие Skills через инструмент `exec` с `host=node`.

    Узлы не в сети **не** делают доступными Skills, работающие только удалённо.
    Если узел перестаёт отвечать на проверки исполняемых файлов, OpenClaw
    очищает кэш совпадений исполняемых файлов для него.

  </Accordion>
</AccordionGroup>

## Влияние на количество токенов

Когда Skills доступны, OpenClaw внедряет компактный блок XML в системный
промпт. Затраты детерминированы и линейно растут с каждым Skills:

- **Базовые накладные расходы** (только при наличии хотя бы одного доступного
  Skills): фиксированный блок вводного текста и обёртка `<available_skills>`.
- **На каждый Skills:** около 97 символов плюс длина полей `name`,
  `description` и `location`.
- Экранирование XML преобразует `& < > " '` в сущности, добавляя несколько
  символов при каждом вхождении.
- При соотношении около 4 символов на токен 97 символов ≈ 24 токена на каждый
  Skills без учёта длины полей.

Если отрисованный блок превысит настроенный бюджет промпта
(`skills.limits.maxSkillsPromptChars`), OpenClaw сначала сохраняет столько
идентификаторов Skills (имя, расположение и версию), сколько помещается
в компактном формате без описаний. Затем оставшийся бюджет используется
для сокращённых описаний. Если бюджета на описания не остаётся, они
опускаются. Когда требуется компактное форматирование или усечение списка,
в промпт включается примечание со ссылкой на `openclaw skills check`.

Делайте описания краткими и информативными, чтобы минимизировать накладные расходы промпта.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Создание Skills" href="/ru/tools/creating-skills" icon="hammer">
    Пошаговое руководство по созданию пользовательского Skills.
  </Card>
  <Card title="Мастерская Skills" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений Skills, подготовленных агентами.
  </Card>
  <Card title="Конфигурация Skills" href="/ru/tools/skills-config" icon="gear">
    Полная схема конфигурации `skills.*` и списки разрешений агентов.
  </Card>
  <Card title="Команды с косой чертой" href="/ru/tools/slash-commands" icon="terminal">
    Как регистрируются и маршрутизируются команды Skills с косой чертой.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Просматривайте и публикуйте Skills в общедоступном реестре.
  </Card>
  <Card title="Плагины" href="/ru/tools/plugin" icon="plug">
    Плагины могут поставлять Skills вместе с описываемыми ими инструментами.
  </Card>
</CardGroup>
