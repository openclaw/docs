---
read_when:
    - Додавання або змінення Skills
    - Зміна керування доступом до Skills, списків дозволів або правил завантаження
    - Розуміння пріоритетності Skills і поведінки знімків
sidebarTitle: Skills
summary: Skills навчають вашого агента користуватися інструментами. Дізнайтеся, як вони завантажуються, як працює пріоритетність і як налаштовувати контроль доступу, списки дозволів та ін’єкцію середовища.
title: Skills
x-i18n:
    generated_at: "2026-06-27T18:28:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills — це інструкційні markdown-файли, які навчають агента, як і коли використовувати
інструменти. Кожен Skill міститься в каталозі з файлом `SKILL.md`, YAML
frontmatter і markdown-тілом. OpenClaw завантажує вбудовані Skills разом з усіма локальними
перевизначеннями та фільтрує їх під час завантаження на основі середовища, конфігурації та
наявності бінарних файлів.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/uk/tools/creating-skills" icon="hammer">
    Створіть і протестуйте власний Skill з нуля.
  </Card>
  <Card title="Skill Workshop" href="/uk/tools/skill-workshop" icon="flask">
    Переглядайте й затверджуйте пропозиції Skills, підготовлені агентом.
  </Card>
  <Card title="Skills config" href="/uk/tools/skills-config" icon="gear">
    Повна схема конфігурації `skills.*` і списки дозволених агентів.
  </Card>
  <Card title="ClawHub" href="/uk/clawhub" icon="cloud">
    Переглядайте та встановлюйте спільнотні Skills.
  </Card>
</CardGroup>

## Порядок завантаження

OpenClaw завантажує з цих джерел, **спочатку з найвищим пріоритетом**. Коли та сама
назва Skill трапляється в кількох місцях, перемагає джерело з найвищим пріоритетом.

| Пріоритет    | Джерело                 | Шлях                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — найвищий | Skills робочого простору       | `<workspace>/skills`                    |
| 2           | Skills агента проєкту   | `<workspace>/.agents/skills`            |
| 3           | Особисті Skills агента  | `~/.agents/skills`                      |
| 4           | Керовані / локальні Skills | `~/.openclaw/skills`                    |
| 5           | Вбудовані Skills         | постачаються з інсталяцією                |
| 6 — найнижчий  | Додаткові каталоги      | `skills.load.extraDirs` + Skills Plugin |

Корені Skills підтримують згруповані структури. OpenClaw виявляє Skill щоразу, коли
`SKILL.md` з’являється будь-де під налаштованим коренем:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Шлях до папки призначений лише для організації. Назва Skill, slash-команда та
ключ списку дозволених беруться з поля frontmatter `name` (або з назви каталогу,
коли `name` відсутнє).

<Note>
  Нативний каталог Codex CLI `$CODEX_HOME/skills` **не** є коренем Skills
  OpenClaw. Використовуйте `openclaw migrate plan codex`, щоб інвентаризувати ці Skills, а потім
  `openclaw migrate codex`, щоб скопіювати їх у ваш робочий простір OpenClaw.
</Note>

## Skills для окремого агента і спільні Skills

У багатоагентних налаштуваннях кожен агент має власний робочий простір. Використовуйте шлях, який
відповідає бажаній видимості:

| Область          | Шлях                         | Видимо для                  |
| -------------- | ---------------------------- | --------------------------- |
| Для окремого агента      | `<workspace>/skills`         | Лише цього агента             |
| Агент проєкту  | `<workspace>/.agents/skills` | Лише агента цього робочого простору |
| Особистий агент | `~/.agents/skills`           | Усі агенти на цій машині  |
| Спільні керовані | `~/.openclaw/skills`         | Усі агенти на цій машині  |
| Додаткові каталоги     | `skills.load.extraDirs`      | Усі агенти на цій машині  |

## Списки дозволених агентів

**Розташування** Skill (пріоритет) і **видимість** Skill (який агент може його використовувати)
є окремими засобами керування. Використовуйте списки дозволених, щоб обмежити, які Skills бачить агент,
незалежно від того, звідки їх завантажено.

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
    - Пропустіть `agents.defaults.skills`, щоб за замовчуванням залишити всі Skills без обмежень.
    - Пропустіть `agents.list[].skills`, щоб успадкувати `agents.defaults.skills`.
    - Установіть `agents.list[].skills: []`, щоб не показувати жодних Skills для цього агента.
    - Непорожній список `agents.list[].skills` є **остаточним** набором — він не
      об’єднується зі значеннями за замовчуванням.
    - Ефективний список дозволених застосовується до побудови prompt, виявлення slash-команд,
      синхронізації sandbox і знімків Skills.
  </Accordion>
</AccordionGroup>

## Plugins і Skills

Plugin-и можуть постачати власні Skills, вказуючи каталоги `skills` в
`openclaw.plugin.json` (шляхи відносно кореня Plugin). Skills Plugin завантажуються,
коли Plugin увімкнено — наприклад, браузерний Plugin постачає
Skill `browser-automation` для багатоетапного керування браузером.

Каталоги Skills Plugin об’єднуються на тому самому низькопріоритетному рівні, що й
`skills.load.extraDirs`, тому однойменний вбудований, керований, агентський або робочого простору
Skill перевизначає їх. Обмежуйте їх через `metadata.openclaw.requires.config` у
конфігураційному записі Plugin.

Див. [Plugins](/uk/tools/plugin) і [Tools](/uk/tools), щоб ознайомитися з повною системою Plugin.

## Skill Workshop

[Skill Workshop](/uk/tools/skill-workshop) — це черга пропозицій між агентом
і вашими активними файлами Skills. Коли агент помічає придатну для повторного використання роботу, він створює
пропозицію замість того, щоб писати безпосередньо в `SKILL.md`. Ви переглядаєте й затверджуєте
перед будь-якими змінами.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Див. [Skill Workshop](/uk/tools/skill-workshop), щоб ознайомитися з повним життєвим циклом, довідником CLI
і конфігурацією.

## Встановлення з ClawHub

[ClawHub](https://clawhub.ai) — це публічний реєстр Skills. Використовуйте
команди `openclaw skills` для встановлення й оновлення або CLI `clawhub` для
публікації та синхронізації.

| Дія                             | Команда                                                |
| ---------------------------------- | ------------------------------------------------------ |
| Установити Skill у робочий простір | `openclaw skills install @owner/<slug>`                |
| Установити з Git-репозиторію      | `openclaw skills install git:owner/repo@ref`           |
| Установити локальний каталог Skill    | `openclaw skills install ./path/to/skill --as my-tool` |
| Установити для всіх локальних агентів       | `openclaw skills install @owner/<slug> --global`       |
| Оновити всі Skills робочого простору        | `openclaw skills update --all`                         |
| Оновити спільний керований Skill      | `openclaw skills update @owner/<slug> --global`        |
| Оновити всі спільні керовані Skills   | `openclaw skills update --all --global`                |
| Перевірити довірчий конверт Skill    | `openclaw skills verify @owner/<slug>`                 |
| Надрукувати згенеровану Skill Card     | `openclaw skills verify @owner/<slug> --card`          |
| Опублікувати / синхронізувати через ClawHub CLI     | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` за замовчуванням установлює в каталог активного робочого простору
    `skills/`. Додайте `--global`, щоб установити в спільний каталог
    `~/.openclaw/skills`, видимий усім локальним агентам, якщо списки дозволених агентів
    не звужують його.

    Git і локальні встановлення очікують `SKILL.md` у корені джерела. Slug береться
    з frontmatter `SKILL.md` `name`, коли він валідний, а потім повертається до
    назви каталогу або репозиторію. Використовуйте `--as <slug>`, щоб перевизначити.
    `openclaw skills update` відстежує лише встановлення ClawHub — перевстановіть Git або
    локальні джерела, щоб оновити їх.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` запитує в ClawHub довірчий конверт Skill
    `clawhub.skill.verify.v1`. Установлені Skills ClawHub перевіряються
    за версією та реєстром, записаними в `.clawhub/origin.json`.
    Голі slugs залишаються прийнятними для наявних установлених або однозначних Skills, але
    посилання з власником уникають неоднозначності видавця.

    Сторінки Skills ClawHub показують найновіший стан сканування безпеки перед встановленням,
    зі сторінками деталей для VirusTotal, ClawScan і статичного аналізу. Команда
    завершується з ненульовим кодом, коли ClawHub позначає перевірку як невдалу. Видавці
    виправляють хибні спрацювання через панель ClawHub або
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    Клієнти Gateway, яким потрібна доставка не через ClawHub, можуть підготувати zip-архів Skill
    за допомогою `skills.upload.begin`, `skills.upload.chunk` і `skills.upload.commit`,
    а потім установити через `skills.install({ source: "upload", ... })`. Цей шлях
    вимкнено за замовчуванням і потребує `skills.install.allowUploadedArchives: true` в
    `openclaw.json`. Звичайні встановлення ClawHub ніколи не потребують цього налаштування.
  </Accordion>
</AccordionGroup>

## Безпека

<Warning>
  Ставтеся до сторонніх Skills як до **недовіреного коду**. Читайте їх перед увімкненням.
  Віддавайте перевагу запуску в sandbox для недовірених вхідних даних і ризикованих інструментів. Див.
  [Sandboxing](/uk/gateway/sandboxing) для засобів керування на боці агента.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Виявлення Skills робочого простору, агента проєкту та додаткових каталогів приймає лише корені Skills,
    чий розв’язаний realpath залишається всередині налаштованого кореня, якщо
    `skills.load.allowSymlinkTargets` явно не довіряє цільовому кореню.
    Skill Workshop записує через ці довірені цілі лише тоді, коли
    `skills.workshop.allowSymlinkTargetWrites` увімкнено.
    Керовані `~/.openclaw/skills` і особисті `~/.agents/skills` можуть містити
    папки Skills із symlink, але кожен realpath `SKILL.md` усе одно має залишатися
    всередині розв’язаного каталогу Skill.
  </Accordion>
  <Accordion title="Operator install policy">
    Налаштуйте `security.installPolicy`, щоб запускати довірену локальну команду політики
    перед продовженням встановлення Skills. Політика отримує метадані та підготовлений
    шлях джерела, застосовується до ClawHub, завантажених, Git, локальних, оновлювальних і
    dependency-installer шляхів, і завершується закритою відмовою, коли команда не може повернути
    валідне рішення.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` і `skills.entries.*.apiKey` ін’єктують секрети в
    **host**-процес лише для цього ходу агента — не в sandbox. Тримайте
    секрети поза prompts і журналами.
  </Accordion>
</AccordionGroup>

Ширшу модель загроз і контрольні списки безпеки див. у
[Security](/uk/gateway/security).

## Формат SKILL.md

Кожному Skill потрібні щонайменше `name` і `description` у frontmatter:

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
  папки Skill.
</Note>

### Необов’язкові ключі frontmatter

<ParamField path="homepage" type="string">
  URL, який показується як "Website" в інтерфейсі macOS Skills. Також підтримується через
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Коли `true`, Skill показується як slash-команда, яку може викликати користувач.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Коли `true`, OpenClaw не включає інструкції Skill до звичайного
  prompt агента. Skill усе ще доступний як slash-команда, коли `user-invocable`
  також `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Коли встановлено `tool`, slash-команда оминає модель і відправляється
  безпосередньо до зареєстрованого інструмента.
</ParamField>

<ParamField path="command-tool" type="string">
  Назва інструмента для виклику, коли встановлено `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Для відправлення інструмента пересилає необроблений рядок аргументів до інструмента без
  парсингу в core. Інструмент отримує
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Обмеження

OpenClaw фільтрує Skills під час завантаження за допомогою `metadata.openclaw` (однорядковий
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
  Коли `true`, завжди включає Skill і пропускає всі інші перевірки.
</ParamField>

<ParamField path="emoji" type="string">
  Необовʼязковий емодзі, що показується в інтерфейсі macOS Skills.
</ParamField>

<ParamField path="homepage" type="string">
  Необовʼязкова URL-адреса, що показується як "Вебсайт" в інтерфейсі macOS Skills.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Фільтр платформи. Якщо задано, Skill доступний лише на перелічених ОС.
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
  Кожен шлях `openclaw.json` має бути істинним.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Назва змінної середовища, повʼязаної з `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Необовʼязкові специфікації інсталятора, які використовує інтерфейс macOS Skills (brew / node / go / uv / download).
</ParamField>

<Note>
  Застарілі блоки `metadata.clawdbot` досі приймаються, коли
  `metadata.openclaw` відсутній, тож старіші встановлені Skills зберігають свої
  перевірки залежностей і підказки інсталятора. Нові Skills мають використовувати
  `metadata.openclaw`.
</Note>

### Специфікації інсталятора

Специфікації інсталятора повідомляють інтерфейсу macOS Skills, як установити залежність:

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
    - Коли перелічено кілька інсталяторів, Gateway вибирає один бажаний
      варіант (brew, якщо доступний, інакше node).
    - Якщо всі інсталятори мають тип `download`, OpenClaw перелічує кожен запис, щоб ви могли
      бачити всі доступні артефакти.
    - Специфікації можуть включати `os: ["darwin"|"linux"|"win32"]` для фільтрації за платформою.
    - Інсталяції Node враховують `skills.install.nodeManager` в `openclaw.json`
      (типово: npm; варіанти: npm / pnpm / yarn / bun). Це впливає лише на
      інсталяції Skills; середовище виконання Gateway усе одно має бути Node.
    - Перевага інсталятора Gateway: Homebrew → uv → налаштований менеджер node →
      go → download.
  </Accordion>
  <Accordion title="Деталі для кожного інсталятора">
    - **Homebrew:** OpenClaw не встановлює Homebrew автоматично й не перетворює формули brew
      на команди системного менеджера пакетів. У Linux-контейнерах без
      `brew` інсталятори лише для brew приховані; використовуйте власний образ або встановіть
      залежність вручну.
    - **Go:** якщо `go` відсутній, а `brew` доступний, Gateway спершу встановлює
      Go через Homebrew і задає `GOBIN` як `bin` Homebrew.
    - **Завантаження:** `url` (обовʼязково), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (типово: auto, коли виявлено архів), `stripComponents`,
      `targetDir` (типово: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Нотатки щодо ізоляції">
    `requires.bins` перевіряється на **хості** під час завантаження Skill. Якщо агент
    працює в ізольованому середовищі, бінарний файл також має існувати **всередині контейнера**.
    Установіть його через `agents.defaults.sandbox.docker.setupCommand` або власний
    образ. `setupCommand` виконується один раз після створення контейнера й потребує
    вихідного мережевого доступу, кореневої файлової системи з правом запису та користувача root в ізольованому середовищі.
  </Accordion>
</AccordionGroup>

## Перевизначення конфігурації

Увімкніть, вимкніть і налаштуйте вбудовані або керовані Skills у `skills.entries` в
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
  `false` вимикає Skill, навіть якщо він вбудований або встановлений. Вбудований Skill
  `coding-agent` вмикається явно — задайте `skills.entries.coding-agent.enabled: true`
  і переконайтеся, що `claude`, `codex`, `opencode` або інший підтримуваний CLI
  встановлено й автентифіковано.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Зручне поле для Skills, які оголошують `metadata.openclaw.primaryEnv`.
  Підтримує відкритий текстовий рядок або обʼєкт SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Змінні середовища, що впроваджуються для запуску агента. Впроваджуються лише тоді, коли
  змінну ще не задано в процесі.
</ParamField>

<ParamField path="config" type="object">
  Необовʼязковий контейнер для власних полів конфігурації окремого Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Необовʼязковий список дозволених лише для **вбудованих** Skills. Якщо задано, доступні лише вбудовані Skills
  зі списку. Керовані й робочі Skills не зачіпаються.
</ParamField>

<Note>
  Ключі конфігурації типово відповідають **назві Skill**. Якщо Skill визначає
  `metadata.openclaw.skillKey`, використовуйте цей ключ у `skills.entries`. Беріть
  назви з дефісами в лапки: JSON5 дозволяє ключі в лапках.
</Note>

## Впровадження середовища

Коли починається запуск агента, OpenClaw:

<Steps>
  <Step title="Читає метадані Skill">
    OpenClaw визначає ефективний список Skills для агента, застосовуючи правила
    фільтрації, списки дозволених і перевизначення конфігурації.
  </Step>
  <Step title="Впроваджує середовище й ключі API">
    `skills.entries.<key>.env` і `skills.entries.<key>.apiKey` застосовуються до
    `process.env` на час виконання запуску.
  </Step>
  <Step title="Будує системний промпт">
    Доступні Skills компілюються в компактний XML-блок і впроваджуються в
    системний промпт.
  </Step>
  <Step title="Відновлює середовище">
    Після завершення запуску початкове середовище відновлюється.
  </Step>
</Steps>

<Warning>
  Впровадження середовища обмежене запуском агента на **хості**, а не ізольованим середовищем. Усередині
  ізольованого середовища `env` і `apiKey` не мають ефекту. Див.
  [Конфігурація Skills](/uk/tools/skills-config#sandboxed-skills-and-env-vars), щоб дізнатися, як
  передавати секрети в ізольовані запуски.
</Warning>

Для вбудованого бекенда `claude-cli` OpenClaw також матеріалізує той самий
знімок доступних Skills як тимчасовий Plugin Claude Code і передає його через
`--plugin-dir`. Інші CLI-бекенди використовують лише каталог промпта.

## Знімки й оновлення

OpenClaw створює знімок доступних Skills **коли починається сесія** і повторно використовує цей
список для всіх наступних ходів у сесії. Зміни Skills або конфігурації набувають
чинності під час наступної нової сесії.

Skills оновлюються посеред сесії у двох випадках:

- Спостерігач Skills виявляє зміну `SKILL.md`.
- Підключається новий доступний віддалений вузол.

Оновлений список використовується під час наступного ходу агента. Якщо ефективний список дозволених
для агента змінюється, OpenClaw оновлює знімок, щоб видимі Skills
залишалися узгодженими.

<AccordionGroup>
  <Accordion title="Спостерігач Skills">
    Типово OpenClaw спостерігає за папками Skills і оновлює знімок, коли
    змінюються файли `SKILL.md`. Налаштуйте в `skills.load`:

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

    Використовуйте `allowSymlinkTargets` для навмисних макетів із символьними посиланнями, де корінь Skill
    є символьним посиланням за межі налаштованого кореня, наприклад
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Увімкніть `skills.workshop.allowSymlinkTargetWrites` лише тоді, коли Skill Workshop
    також має застосовувати пропозиції через ці довірені шляхи із символьними посиланнями.

  </Accordion>
  <Accordion title="Віддалені вузли macOS (Linux Gateway)">
    Якщо Gateway працює на Linux, але підключено **вузол macOS** із дозволеним
    `system.run`, OpenClaw може вважати Skills лише для macOS доступними, коли
    потрібні бінарні файли присутні на цьому вузлі. Агент має запускати ці
    Skills через інструмент `exec` з `host=node`.

    Вузли офлайн **не** роблять віддалені Skills видимими. Якщо вузол перестає
    відповідати на перевірки бінарних файлів, OpenClaw очищає кешовані збіги бінарних файлів.

  </Accordion>
</AccordionGroup>

## Вплив на токени

Коли Skills доступні, OpenClaw впроваджує компактний XML-блок у системний
промпт. Вартість детермінована:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Базові накладні витрати** (лише коли ≥ 1 Skill): ~195 символів
- **На Skill:** ~97 символів + довжини полів `name`, `description` і `location`
- XML-екранування розгортає `& < > " '` в сутності, додаючи кілька символів на кожне входження
- За ~4 символи/токен, 97 символів ≈ 24 токени на Skill до врахування довжин полів

Тримайте описи короткими й змістовними, щоб мінімізувати накладні витрати промпта.

## Повʼязане

<CardGroup cols={2}>
  <Card title="Створення Skills" href="/uk/tools/creating-skills" icon="hammer">
    Покроковий посібник зі створення власного Skill.
  </Card>
  <Card title="Skill Workshop" href="/uk/tools/skill-workshop" icon="flask">
    Черга пропозицій для Skills, підготовлених агентом.
  </Card>
  <Card title="Конфігурація Skills" href="/uk/tools/skills-config" icon="gear">
    Повна схема конфігурації `skills.*` і списки дозволених агентів.
  </Card>
  <Card title="Слеш-команди" href="/uk/tools/slash-commands" icon="terminal">
    Як слеш-команди Skill реєструються й маршрутизуються.
  </Card>
  <Card title="ClawHub" href="/uk/clawhub" icon="cloud">
    Переглядайте й публікуйте Skills у публічному реєстрі.
  </Card>
  <Card title="Plugins" href="/uk/tools/plugin" icon="plug">
    Plugins можуть постачати Skills разом з інструментами, які вони документують.
  </Card>
</CardGroup>
