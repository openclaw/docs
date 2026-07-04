---
read_when:
    - Додавання або змінення Skills
    - Зміна обмежень доступу до Skills, списків дозволених або правил завантаження
    - Розуміння пріоритету Skills і поведінки знімків
sidebarTitle: Skills
summary: Skills навчають вашого агента користуватися інструментами. Дізнайтеся, як вони завантажуються, як працює пріоритетність і як налаштовувати контроль доступу, списки дозволених елементів та ін’єкцію середовища.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:49:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills — це файли інструкцій Markdown, які навчають агента, як і коли використовувати
інструменти. Кожен Skills розміщений у каталозі, що містить файл `SKILL.md` із YAML
frontmatter та тілом Markdown. OpenClaw завантажує вбудовані Skills, а також будь-які локальні
перевизначення, і фільтрує їх під час завантаження на основі середовища, конфігурації та
наявності бінарних файлів.

<CardGroup cols={2}>
  <Card title="Створення Skills" href="/uk/tools/creating-skills" icon="hammer">
    Створіть і протестуйте власний Skills з нуля.
  </Card>
  <Card title="Майстерня Skills" href="/uk/tools/skill-workshop" icon="flask">
    Переглядайте й затверджуйте пропозиції Skills, підготовлені агентом.
  </Card>
  <Card title="Конфігурація Skills" href="/uk/tools/skills-config" icon="gear">
    Повна схема конфігурації `skills.*` і списки дозволів агентів.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Переглядайте й установлюйте Skills спільноти.
  </Card>
</CardGroup>

## Порядок завантаження

OpenClaw завантажує з цих джерел, **спершу з найвищим пріоритетом**. Коли однакова
назва Skills з’являється в кількох місцях, перемагає джерело з найвищим пріоритетом.

| Пріоритет   | Джерело                  | Шлях                                    |
| ----------- | ------------------------ | --------------------------------------- |
| 1 — найвищий | Skills робочої області   | `<workspace>/skills`                    |
| 2           | Skills агента проєкту    | `<workspace>/.agents/skills`            |
| 3           | Особисті Skills агента   | `~/.agents/skills`                      |
| 4           | Керовані / локальні Skills | `~/.openclaw/skills`                  |
| 5           | Вбудовані Skills         | постачаються з інсталяцією              |
| 6 — найнижчий | Додаткові каталоги     | `skills.load.extraDirs` + Skills Plugin |

Корені Skills підтримують згруповані макети. OpenClaw виявляє Skills щоразу, коли
`SKILL.md` з’являється будь-де під налаштованим коренем:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Шлях до папки призначений лише для організації. Назва Skills, slash-команда та
ключ списку дозволів усі беруться з поля frontmatter `name` (або з назви каталогу,
коли `name` відсутнє).

<Note>
  Рідний каталог Codex CLI `$CODEX_HOME/skills` **не** є коренем Skills
  OpenClaw. Використайте `openclaw migrate plan codex`, щоб інвентаризувати ці Skills, а потім
  `openclaw migrate codex`, щоб скопіювати їх у вашу робочу область OpenClaw.
</Note>

## Skills для окремого агента та спільні Skills

У налаштуваннях із кількома агентами кожен агент має власну робочу область. Використовуйте шлях, який
відповідає бажаній видимості:

| Область         | Шлях                         | Видимо для                   |
| --------------- | ---------------------------- | ---------------------------- |
| Для окремого агента | `<workspace>/skills`     | Лише цього агента            |
| Агент проєкту   | `<workspace>/.agents/skills` | Лише агента цієї робочої області |
| Особистий агент | `~/.agents/skills`           | Усі агенти на цій машині     |
| Спільні керовані | `~/.openclaw/skills`        | Усі агенти на цій машині     |
| Додаткові каталоги | `skills.load.extraDirs`   | Усі агенти на цій машині     |

## Списки дозволів агентів

**Розташування** Skills (пріоритет) і **видимість** Skills (який агент може його використовувати)
є окремими засобами керування. Використовуйте списки дозволів, щоб обмежити, які Skills бачить агент,
незалежно від того, звідки вони завантажені.

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
  <Accordion title="Правила списків дозволів">
    - Пропустіть `agents.defaults.skills`, щоб за замовчуванням залишити всі Skills без обмежень.
    - Пропустіть `agents.list[].skills`, щоб успадкувати `agents.defaults.skills`.
    - Установіть `agents.list[].skills: []`, щоб не відкривати жодних Skills для цього агента.
    - Непорожній список `agents.list[].skills` є **остаточним** набором — він не
      об’єднується зі значеннями за замовчуванням.
    - Ефективний список дозволів застосовується до побудови промптів, виявлення
      slash-команд, синхронізації sandbox і знімків Skills.
    - Це не межа авторизації хостової оболонки. Якщо той самий агент може
      використовувати `exec`, обмежте цю оболонку окремо за допомогою sandboxing, ізоляції
      користувача ОС, списків заборон/дозволів для exec і облікових даних для окремих ресурсів.
  </Accordion>
</AccordionGroup>

## Plugin і Skills

Plugin можуть постачати власні Skills, перелічуючи каталоги `skills` в
`openclaw.plugin.json` (шляхи відносно кореня Plugin). Skills Plugin завантажуються,
коли Plugin увімкнено — наприклад, браузерний Plugin постачає Skills
`browser-automation` для багатокрокового керування браузером.

Каталоги Skills Plugin об’єднуються на тому самому рівні низького пріоритету, що й
`skills.load.extraDirs`, тому вбудовані, керовані, агентські або робочої області
Skills з такою самою назвою перевизначають їх. Обмежуйте їх через `metadata.openclaw.requires.config` у
записі конфігурації Plugin.

Див. [Plugin](/uk/tools/plugin) і [Інструменти](/uk/tools), щоб ознайомитися з повною системою Plugin.

## Майстерня Skills

[Майстерня Skills](/uk/tools/skill-workshop) — це черга пропозицій між агентом
і вашими активними файлами Skills. Коли агент помічає роботу, яку можна повторно використати, він створює
пропозицію замість прямого запису в `SKILL.md`. Ви переглядаєте й затверджуєте
перед будь-якими змінами.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Див. [Майстерня Skills](/uk/tools/skill-workshop), щоб ознайомитися з повним життєвим циклом, довідкою CLI
та конфігурацією.

## Установлення з ClawHub

[ClawHub](https://clawhub.ai) — це публічний реєстр Skills. Використовуйте
команди `openclaw skills` для встановлення та оновлення або CLI `clawhub` для
публікації та синхронізації.

| Дія                                      | Команда                                                |
| --------------------------------------- | ------------------------------------------------------ |
| Установити Skills у робочу область      | `openclaw skills install @owner/<slug>`                |
| Установити з Git-репозиторію            | `openclaw skills install git:owner/repo@ref`           |
| Установити локальний каталог Skills     | `openclaw skills install ./path/to/skill --as my-tool` |
| Установити для всіх локальних агентів   | `openclaw skills install @owner/<slug> --global`       |
| Оновити всі Skills робочої області      | `openclaw skills update --all`                         |
| Оновити спільний керований Skills       | `openclaw skills update @owner/<slug> --global`        |
| Оновити всі спільні керовані Skills     | `openclaw skills update --all --global`                |
| Перевірити довірчий конверт Skills      | `openclaw skills verify @owner/<slug>`                 |
| Надрукувати згенеровану картку Skills   | `openclaw skills verify @owner/<slug> --card`          |
| Опублікувати / синхронізувати через CLI ClawHub | `clawhub sync --all`                            |

<AccordionGroup>
  <Accordion title="Деталі встановлення">
    `openclaw skills install` за замовчуванням установлює в каталог активної робочої області
    `skills/`. Додайте `--global`, щоб установити в спільний каталог
    `~/.openclaw/skills`, видимий усім локальним агентам, якщо списки дозволів агентів
    не звужують доступ.

    Git- і локальні встановлення очікують `SKILL.md` у корені джерела. Slug береться
    з frontmatter `SKILL.md` `name`, коли він коректний, а потім використовується
    назва каталогу або репозиторію як запасний варіант. Використовуйте `--as <slug>` для перевизначення.
    `openclaw skills update` відстежує лише встановлення ClawHub — перевстановіть Git- або
    локальні джерела, щоб оновити їх.

  </Accordion>
  <Accordion title="Перевірка та сканування безпеки">
    `openclaw skills verify @owner/<slug>` запитує в ClawHub довірчий конверт Skills
    `clawhub.skill.verify.v1`. Установлені Skills ClawHub перевіряються
    щодо версії та реєстру, записаних у `.clawhub/origin.json`.
    Голі slug залишаються прийнятними для вже встановлених або однозначних Skills, але
    посилання з власником уникають неоднозначності видавця.

    Сторінки Skills у ClawHub показують найновіший стан сканування безпеки перед встановленням
    зі сторінками деталей для VirusTotal, ClawScan і статичного аналізу. Команда
    завершується з ненульовим кодом, коли ClawHub позначає перевірку як невдалу. Видавці
    усувають хибнопозитивні результати через панель ClawHub або
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Установлення з приватних архівів">
    Клієнти Gateway, яким потрібне постачання не через ClawHub, можуть підготувати zip-архів Skills
    за допомогою `skills.upload.begin`, `skills.upload.chunk` і `skills.upload.commit`,
    а потім установити через `skills.install({ source: "upload", ... })`. Цей шлях
    вимкнений за замовчуванням і потребує `skills.install.allowUploadedArchives: true` в
    `openclaw.json`. Звичайні встановлення ClawHub ніколи не потребують цього налаштування.
  </Accordion>
</AccordionGroup>

## Безпека

<Warning>
  Розглядайте сторонні Skills як **ненадійний код**. Читайте їх перед увімкненням.
  Надавайте перевагу запускам у sandbox для ненадійних вхідних даних і ризикованих інструментів. Див.
  [Sandboxing](/uk/gateway/sandboxing) для засобів керування на боці агента.
</Warning>

<AccordionGroup>
  <Accordion title="Обмеження шляхів">
    Виявлення Skills у робочій області, агента проєкту та додаткових каталогах приймає лише корені Skills,
    чий розв’язаний realpath залишається всередині налаштованого кореня, якщо тільки
    `skills.load.allowSymlinkTargets` явно не довіряє цільовому кореню.
    Майстерня Skills записує через ці довірені цілі лише тоді, коли
    `skills.workshop.allowSymlinkTargetWrites` увімкнено.
    Керований `~/.openclaw/skills` і особистий `~/.agents/skills` можуть містити
    символічно зв’язані папки Skills, але кожен realpath `SKILL.md` усе одно має залишатися
    всередині свого розв’язаного каталогу Skills.
  </Accordion>
  <Accordion title="Політика встановлення оператора">
    Налаштуйте `security.installPolicy`, щоб запускати довірену локальну команду політики
    перед продовженням установлення Skills. Політика отримує метадані та підготовлений
    шлях джерела, застосовується до шляхів ClawHub, завантажених архівів, Git, локальних, оновлення та
    інсталятора залежностей і завершується відмовою, коли команда не може повернути
    чинне рішення.
  </Accordion>
  <Accordion title="Область ін’єкції секретів">
    `skills.entries.*.env` і `skills.entries.*.apiKey` ін’єктують секрети в
    процес **хоста** лише для цього ходу агента — не в sandbox. Не додавайте
    секрети до промптів і журналів.
  </Accordion>
</AccordionGroup>

Ширшу модель загроз і контрольні списки безпеки див. у
[Безпека](/uk/gateway/security).

## Формат SKILL.md

Кожному Skills потрібні щонайменше `name` і `description` у frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw дотримується специфікації [AgentSkills](https://agentskills.io).
  Парсер frontmatter підтримує **лише однорядкові ключі** — `metadata` має бути
  однорядковим JSON-об’єктом. Використовуйте `{baseDir}` у тілі, щоб посилатися на шлях
  папки Skills.
</Note>

### Необов’язкові ключі frontmatter

<ParamField path="homepage" type="string">
  URL, який відображається як "Вебсайт" в інтерфейсі Skills macOS. Також підтримується через
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Коли `true`, Skills відкривається як доступна користувачу slash-команда.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Коли `true`, OpenClaw не включає інструкції Skills у звичайний
  промпт агента. Skills усе ще доступний як slash-команда, коли `user-invocable`
  також має значення `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Коли встановлено `tool`, slash-команда обходить модель і спрямовується
  безпосередньо до зареєстрованого інструмента.
</ParamField>

<ParamField path="command-tool" type="string">
  Назва інструмента для виклику, коли встановлено `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Для диспетчеризації інструментів передає сирий рядок аргументів інструменту без
  парсингу в ядрі. Інструмент отримує
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Обмеження доступності

OpenClaw фільтрує skills під час завантаження за допомогою `metadata.openclaw` (однорядковий
JSON у frontmatter). Skill без блока `metadata.openclaw` завжди
доступний, якщо його явно не вимкнено.

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
  Коли `true`, завжди включати skill і пропускати всі інші обмеження.
</ParamField>

<ParamField path="emoji" type="string">
  Необов’язковий emoji, що показується в інтерфейсі macOS Skills.
</ParamField>

<ParamField path="homepage" type="string">
  Необов’язкова URL-адреса, що показується як «Вебсайт» в інтерфейсі macOS Skills.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Фільтр платформи. Якщо задано, skill доступний лише на перелічених ОС.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Кожен бінарний файл має існувати в `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Принаймні один бінарний файл має існувати в `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Кожна змінна середовища має існувати в процесі або бути надана через конфігурацію.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Кожен шлях `openclaw.json` має бути truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Ім’я змінної середовища, пов’язане з `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Необов’язкові специфікації інсталяторів, які використовує інтерфейс macOS Skills (brew / node / go / uv / download).
</ParamField>

<Note>
  Застарілі блоки `metadata.clawdbot` досі приймаються, коли
  `metadata.openclaw` відсутній, тому старіші встановлені skills зберігають свої
  обмеження залежностей і підказки інсталяторів. Нові skills мають використовувати
  `metadata.openclaw`.
</Note>

### Специфікації інсталяторів

Специфікації інсталяторів повідомляють інтерфейсу macOS Skills, як встановити залежність:

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
  <Accordion title="Правила вибору інсталятора">
    - Коли перелічено кілька інсталяторів, gateway вибирає один бажаний
      варіант (brew, якщо доступний, інакше node).
    - Якщо всі інсталятори мають тип `download`, OpenClaw перелічує кожен запис, щоб ви могли
      бачити всі доступні артефакти.
    - Специфікації можуть містити `os: ["darwin"|"linux"|"win32"]` для фільтрації за платформою.
    - Інсталяції Node враховують `skills.install.nodeManager` у `openclaw.json`
      (типово: npm; варіанти: npm / pnpm / yarn / bun). Це впливає лише на
      інсталяції skills; середовище виконання Gateway все одно має бути Node.
    - Перевага інсталяторів Gateway: Homebrew → uv → налаштований менеджер node →
      go → download.
  </Accordion>
  <Accordion title="Деталі для кожного інсталятора">
    - **Homebrew:** OpenClaw не встановлює Homebrew автоматично й не перетворює формули brew
      на команди системного менеджера пакетів. У Linux-контейнерах без
      `brew` інсталятори лише для brew приховано; використовуйте власний образ або встановіть
      залежність вручну.
    - **Go:** OpenClaw потребує Go 1.21 або новішого для автоматичних інсталяцій skills і
      зберігає наявні налаштування `GOBIN`, `GOPATH` і `GOTOOLCHAIN`. Якщо
      налаштований toolchain не може задовольнити потрібну версію Go для модуля,
      onboarding групує skill з ручними передумовами Go після спроби інсталяції.
      Якщо `go` відсутній, а Homebrew доступний, OpenClaw спочатку встановлює
      Go через Homebrew і встановлює `GOBIN` у `bin` Homebrew. У Linux
      OpenClaw натомість може використати `apt-get` від root або через безпарольний `sudo`,
      коли оновлений кандидат `golang-go` відповідає мінімальній версії.
    - **Download:** `url` (обов’язково), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (типово: auto, коли виявлено архів), `stripComponents`,
      `targetDir` (типово: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Нотатки щодо sandboxing">
    `requires.bins` перевіряється на **host** під час завантаження skill. Якщо агент
    працює в sandbox, бінарний файл також має існувати **всередині контейнера**.
    Установіть його через `agents.defaults.sandbox.docker.setupCommand` або власний
    образ. `setupCommand` виконується один раз після створення контейнера й потребує
    виходу в мережу, кореневої файлової системи з правом запису та користувача root у sandbox.
  </Accordion>
</AccordionGroup>

## Перевизначення конфігурації

Перемикайте й налаштовуйте bundled або managed skills у `skills.entries` в
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
  `false` вимикає skill, навіть якщо він bundled або installed. Bundled skill `coding-agent`
  є opt-in — задайте `skills.entries.coding-agent.enabled: true`
  і переконайтеся, що один із `claude`, `codex`, `opencode` або інший підтримуваний CLI
  встановлено й автентифіковано.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Зручне поле для skills, які оголошують `metadata.openclaw.primaryEnv`.
  Підтримує plaintext-рядок або об’єкт SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Змінні середовища, що інжектуються для запуску агента. Інжектуються лише тоді, коли
  змінну ще не встановлено в процесі.
</ParamField>

<ParamField path="config" type="object">
  Необов’язковий контейнер для власних полів конфігурації для окремого skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Необов’язковий allowlist лише для **bundled** skills. Якщо задано, доступні лише bundled skills
  зі списку. Managed і workspace skills не зачіпаються.
</ParamField>

<Note>
  Ключі конфігурації типово відповідають **імені skill**. Якщо skill визначає
  `metadata.openclaw.skillKey`, використовуйте цей ключ у `skills.entries`. Беріть
  імена з дефісами в лапки: JSON5 дозволяє ключі в лапках.
</Note>

## Інжекція середовища

Коли запуск агента починається, OpenClaw:

<Steps>
  <Step title="Читає метадані skill">
    OpenClaw визначає ефективний список skills для агента, застосовуючи правила
    обмеження доступності, allowlists і перевизначення конфігурації.
  </Step>
  <Step title="Інжектує env і API-ключі">
    `skills.entries.<key>.env` і `skills.entries.<key>.apiKey` застосовуються до
    `process.env` на час виконання запуску.
  </Step>
  <Step title="Будує system prompt">
    Доступні skills компілюються в компактний XML-блок і інжектуються в
    system prompt.
  </Step>
  <Step title="Відновлює середовище">
    Після завершення запуску початкове середовище відновлюється.
  </Step>
</Steps>

<Warning>
  Інжекція env обмежена запуском агента на **host**, а не sandbox. Усередині
  sandbox `env` і `apiKey` не мають ефекту. Див.
  [Конфігурація Skills](/uk/tools/skills-config#sandboxed-skills-and-env-vars), щоб дізнатися,
  як передавати secrets у sandboxed-запуски.
</Warning>

Для bundled backend `claude-cli` OpenClaw також матеріалізує той самий
знімок доступних skills як тимчасовий Claude Code plugin і передає його через
`--plugin-dir`. Інші CLI backends використовують лише каталог prompt.

## Знімки й оновлення

OpenClaw робить знімок доступних skills **коли починається сесія** і повторно використовує цей
список для всіх наступних ходів у сесії. Зміни в skills або конфігурації набувають
чинності в наступній новій сесії.

Skills оновлюються посеред сесії у двох випадках:

- watcher skills виявляє зміну `SKILL.md`.
- Під’єднується новий доступний remote node.

Оновлений список використовується на наступному ході агента. Якщо ефективний
allowlist агента змінюється, OpenClaw оновлює знімок, щоб видимі skills
залишалися узгодженими.

<AccordionGroup>
  <Accordion title="Watcher Skills">
    Типово OpenClaw стежить за папками skills і підвищує версію знімка, коли
    файли `SKILL.md` змінюються. Налаштування в `skills.load`:

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

    Використовуйте `allowSymlinkTargets` для навмисних symlinked-layouts, де symlink кореня skill
    вказує за межі налаштованого кореня, наприклад
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Увімкніть `skills.workshop.allowSymlinkTargetWrites` лише тоді, коли Skill Workshop
    також має застосовувати пропозиції через ці довірені symlinked-шляхи.

  </Accordion>
  <Accordion title="Віддалені вузли macOS (Linux gateway)">
    Якщо Gateway працює на Linux, але під’єднано **вузол macOS** із дозволеним
    `system.run`, OpenClaw може вважати skills лише для macOS доступними, коли
    потрібні бінарні файли присутні на цьому вузлі. Агент має запускати ці
    skills через інструмент `exec` з `host=node`.

    Offline-вузли **не** роблять skills лише для віддалених вузлів видимими. Якщо вузол перестає
    відповідати на bin probes, OpenClaw очищає його кешовані збіги bin.

  </Accordion>
</AccordionGroup>

## Вплив на токени

Коли skills доступні, OpenClaw інжектує компактний XML-блок у system
prompt. Вартість детермінована:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Базові накладні витрати** (лише коли ≥ 1 skill): ~195 символів
- **На skill:** ~97 символів + довжини ваших полів `name`, `description` і `location`
- XML-екранування розгортає `& < > " '` в entities, додаючи кілька символів на кожну появу
- За ~4 символи/токен, 97 символів ≈ 24 токени на skill до врахування довжин полів

Тримайте описи короткими й інформативними, щоб мінімізувати накладні витрати prompt.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Створення skills" href="/uk/tools/creating-skills" icon="hammer">
    Покроковий посібник зі створення власного skill.
  </Card>
  <Card title="Skill Workshop" href="/uk/tools/skill-workshop" icon="flask">
    Черга пропозицій для skills, підготовлених агентом.
  </Card>
  <Card title="Конфігурація Skills" href="/uk/tools/skills-config" icon="gear">
    Повна схема конфігурації `skills.*` і allowlists агентів.
  </Card>
  <Card title="Slash-команди" href="/uk/tools/slash-commands" icon="terminal">
    Як slash-команди skill реєструються й маршрутизуються.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Переглядайте й публікуйте skills у публічному registry.
  </Card>
  <Card title="Plugins" href="/uk/tools/plugin" icon="plug">
    Plugins можуть постачати skills разом з інструментами, які вони документують.
  </Card>
</CardGroup>
