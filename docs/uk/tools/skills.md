---
read_when:
    - Додавання або змінення Skills
    - Зміна перевірок Skills, списків дозволеного або правил завантаження
    - Розуміння пріоритету Skills і поведінки знімків
sidebarTitle: Skills
summary: Skills навчають вашого агента користуватися інструментами. Дізнайтеся, як вони завантажуються, як працює пріоритетність і як налаштовувати gating, allowlists та впровадження середовища.
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:38:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills — це markdown-файли з інструкціями, які навчають агента, як і коли використовувати
інструменти. Кожна навичка розміщується в каталозі з файлом `SKILL.md`, який містить YAML
frontmatter і markdown-тіло. OpenClaw завантажує вбудовані навички разом із будь-якими локальними
перевизначеннями та фільтрує їх під час завантаження на основі середовища, конфігурації та
наявності бінарних файлів.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/uk/tools/creating-skills" icon="hammer">
    Створіть і протестуйте власну навичку з нуля.
  </Card>
  <Card title="Skill Workshop" href="/uk/tools/skill-workshop" icon="flask">
    Переглядайте й затверджуйте пропозиції навичок, підготовлені агентом.
  </Card>
  <Card title="Skills config" href="/uk/tools/skills-config" icon="gear">
    Повна схема конфігурації `skills.*` і списки дозволів агентів.
  </Card>
  <Card title="ClawHub" href="/uk/clawhub" icon="cloud">
    Переглядайте й установлюйте навички спільноти.
  </Card>
</CardGroup>

## Порядок завантаження

OpenClaw завантажує з цих джерел, **спочатку з найвищим пріоритетом**. Коли однакова
назва навички трапляється в кількох місцях, перемагає джерело з найвищим пріоритетом.

| Пріоритет   | Джерело                    | Шлях                                    |
| ----------- | -------------------------- | --------------------------------------- |
| 1 — найвищий | Навички робочої області     | `<workspace>/skills`                    |
| 2           | Навички агента проєкту      | `<workspace>/.agents/skills`            |
| 3           | Особисті навички агента     | `~/.agents/skills`                      |
| 4           | Керовані / локальні навички | `~/.openclaw/skills`                    |
| 5           | Вбудовані навички           | постачаються з інсталяцією              |
| 6 — найнижчий | Додаткові каталоги          | `skills.load.extraDirs` + навички plugin |

Корені навичок підтримують згруповані структури. OpenClaw виявляє навичку щоразу, коли
`SKILL.md` з’являється будь-де під налаштованим коренем:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Шлях до папки призначений лише для організації. Назва навички, slash-команда та
ключ списку дозволів усі походять із поля frontmatter `name` (або з назви каталогу,
коли `name` відсутнє).

<Note>
  Власний каталог Codex CLI `$CODEX_HOME/skills` **не** є коренем навичок OpenClaw.
  Використовуйте `openclaw migrate plan codex`, щоб інвентаризувати ці навички, а потім
  `openclaw migrate codex`, щоб скопіювати їх у вашу робочу область OpenClaw.
</Note>

## Навички для окремого агента й спільні навички

У багатoагентних налаштуваннях кожен агент має власну робочу область. Використовуйте шлях, який
відповідає потрібній видимості:

| Область          | Шлях                         | Видимо для                  |
| ---------------- | ---------------------------- | --------------------------- |
| Для окремого агента | `<workspace>/skills`         | Лише цього агента           |
| Агент проєкту    | `<workspace>/.agents/skills` | Лише агента цієї робочої області |
| Особистий агент  | `~/.agents/skills`           | Усі агенти на цій машині    |
| Спільні керовані | `~/.openclaw/skills`         | Усі агенти на цій машині    |
| Додаткові каталоги | `skills.load.extraDirs`      | Усі агенти на цій машині    |

## Списки дозволів агентів

**Розташування** навички (пріоритет) і **видимість** навички (який агент може її
використовувати) — це окремі елементи керування. Використовуйте списки дозволів, щоб обмежити,
які навички бачить агент, незалежно від того, звідки їх завантажено.

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
    - Не вказуйте `agents.defaults.skills`, щоб за замовчуванням залишити всі навички без обмежень.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати `agents.defaults.skills`.
    - Установіть `agents.list[].skills: []`, щоб не відкривати жодних навичок для цього агента.
    - Непорожній список `agents.list[].skills` є **остаточним** набором — він не
      об’єднується зі значеннями за замовчуванням.
    - Ефективний список дозволів застосовується до побудови промптів, виявлення
      slash-команд, синхронізації пісочниці та знімків навичок.
    - Це не межа авторизації оболонки хоста. Якщо той самий агент може
      використовувати `exec`, обмежуйте цю оболонку окремо за допомогою пісочниці,
      ізоляції OS-користувача, списків заборон/дозволів для exec і облікових даних для кожного ресурсу.
  </Accordion>
</AccordionGroup>

## Plugins і навички

Plugins можуть постачати власні навички, указуючи каталоги `skills` у
`openclaw.plugin.json` (шляхи відносно кореня plugin). Навички plugin завантажуються,
коли plugin увімкнено — наприклад, browser plugin постачає навичку
`browser-automation` для багатокрокового керування браузером.

Каталоги навичок plugin об’єднуються на тому самому низькопріоритетному рівні, що й
`skills.load.extraDirs`, тому вбудована, керована, агентська або робочообласна
навичка з тією самою назвою перевизначає їх. Обмежуйте їх через `metadata.openclaw.requires.config` у
конфігураційному записі plugin.

Дивіться [Plugins](/uk/tools/plugin) і [Інструменти](/uk/tools), щоб ознайомитися з повною системою plugin.

## Майстерня навичок

[Майстерня навичок](/uk/tools/skill-workshop) — це черга пропозицій між агентом
і вашими активними файлами навичок. Коли агент помічає роботу, яку можна повторно використати, він створює
пропозицію замість прямого запису в `SKILL.md`. Ви переглядаєте й затверджуєте її
до будь-яких змін.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Дивіться [Майстерню навичок](/uk/tools/skill-workshop), щоб ознайомитися з повним життєвим циклом, довідкою CLI
та конфігурацією.

## Установлення з ClawHub

[ClawHub](https://clawhub.ai) — це публічний реєстр навичок. Використовуйте
команди `openclaw skills` для встановлення й оновлення або CLI `clawhub` для
публікації та синхронізації.

| Дія                                | Команда                                                |
| ---------------------------------- | ------------------------------------------------------ |
| Установити навичку в робочу область | `openclaw skills install @owner/<slug>`                |
| Установити з Git-репозиторію       | `openclaw skills install git:owner/repo@ref`           |
| Установити локальний каталог навички | `openclaw skills install ./path/to/skill --as my-tool` |
| Установити для всіх локальних агентів | `openclaw skills install @owner/<slug> --global`       |
| Оновити всі навички робочої області | `openclaw skills update --all`                         |
| Оновити спільну керовану навичку   | `openclaw skills update @owner/<slug> --global`        |
| Оновити всі спільні керовані навички | `openclaw skills update --all --global`                |
| Перевірити trust envelope навички  | `openclaw skills verify @owner/<slug>`                 |
| Надрукувати згенеровану Skill Card | `openclaw skills verify @owner/<slug> --card`          |
| Опублікувати / синхронізувати через CLI ClawHub | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` за замовчуванням установлює в каталог `skills/`
    активної робочої області. Додайте `--global`, щоб установити в спільний
    каталог `~/.openclaw/skills`, видимий для всіх локальних агентів, якщо списки
    дозволів агентів не звужують доступ.

    Git і локальні встановлення очікують `SKILL.md` у корені джерела. Slug береться
    з frontmatter `name` у `SKILL.md`, коли воно валідне, а потім відступає до
    назви каталогу або репозиторію. Використовуйте `--as <slug>` для перевизначення.
    `openclaw skills update` відстежує лише встановлення з ClawHub — перевстановлюйте Git або
    локальні джерела, щоб оновити їх.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` запитує в ClawHub trust envelope
    `clawhub.skill.verify.v1` для навички. Установлені навички ClawHub перевіряються
    за версією та реєстром, записаними в `.clawhub/origin.json`.
    Голі slugs залишаються прийнятними для вже встановлених або однозначних навичок, але
    посилання з власником уникають неоднозначності видавця.

    Сторінки навичок ClawHub показують найновіший стан сканування безпеки перед установленням,
    зі сторінками деталей для VirusTotal, ClawScan і статичного аналізу. Команда
    завершується з ненульовим кодом, коли ClawHub позначає перевірку як невдалу. Видавці
    усувають хибні спрацьовування через панель ClawHub або
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    Клієнти Gateway, яким потрібна доставка поза ClawHub, можуть підготувати zip-архів навички
    за допомогою `skills.upload.begin`, `skills.upload.chunk` і `skills.upload.commit`,
    а потім установити через `skills.install({ source: "upload", ... })`. Цей шлях
    вимкнено за замовчуванням, і він потребує `skills.install.allowUploadedArchives: true` у
    `openclaw.json`. Звичайні встановлення ClawHub ніколи не потребують цього параметра.
  </Accordion>
</AccordionGroup>

## Безпека

<Warning>
  Ставтеся до сторонніх навичок як до **недовіреного коду**. Читайте їх перед увімкненням.
  Надавайте перевагу запуску в пісочниці для недовірених вхідних даних і ризикованих інструментів. Дивіться
  [Пісочниця](/uk/gateway/sandboxing) для керування на боці агента.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Виявлення навичок у робочій області, агенті проєкту та додаткових каталогах приймає лише корені навичок,
    чий розв’язаний realpath залишається всередині налаштованого кореня, якщо
    `skills.load.allowSymlinkTargets` явно не довіряє цільовому кореню.
    Майстерня навичок записує через ці довірені цілі лише тоді, коли
    `skills.workshop.allowSymlinkTargetWrites` увімкнено.
    Керовані `~/.openclaw/skills` і особисті `~/.agents/skills` можуть містити
    симлінковані папки навичок, але кожен realpath `SKILL.md` усе одно має залишатися
    всередині свого розв’язаного каталогу навички.
  </Accordion>
  <Accordion title="Operator install policy">
    Налаштуйте `security.installPolicy`, щоб запускати довірену локальну команду політики
    перед продовженням установлення навичок. Політика отримує метадані та шлях до підготовленого
    джерела, застосовується до шляхів ClawHub, завантажених архівів, Git, локальних джерел, оновлень і
    інсталяторів залежностей, і закривається з відмовою, коли команда не може повернути
    валідне рішення.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` і `skills.entries.*.apiKey` інжектують секрети в
    процес **хоста** лише для цього ходу агента — не в пісочницю. Тримайте
    секрети поза промптами й логами.
  </Accordion>
</AccordionGroup>

Ширшу модель загроз і контрольні списки безпеки дивіться в
[Безпека](/uk/gateway/security).

## Формат SKILL.md

Кожна навичка потребує щонайменше `name` і `description` у frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw дотримується специфікації [AgentSkills](https://agentskills.io). Парсер
  frontmatter підтримує **лише однорядкові ключі** — `metadata` має бути
  однорядковим JSON-об’єктом. Використовуйте `{baseDir}` у тілі, щоб посилатися на шлях
  папки навички.
</Note>

### Необов’язкові ключі frontmatter

<ParamField path="homepage" type="string">
  URL, що показується як "Вебсайт" в інтерфейсі macOS Skills. Також підтримується через
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Коли `true`, навичка відкривається як slash-команда, яку може викликати користувач.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Коли `true`, OpenClaw не включає інструкції навички до звичайного промпта агента.
  Навичка все одно доступна як slash-команда, коли `user-invocable`
  також має значення `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Коли встановлено `tool`, slash-команда обходить модель і диспетчеризується
  безпосередньо до зареєстрованого інструмента.
</ParamField>

<ParamField path="command-tool" type="string">
  Назва інструмента, який потрібно викликати, коли встановлено `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Для диспетчеризації інструмента пересилає сирий рядок аргументів до інструмента без
  розбору ядром. Інструмент отримує
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Допуск

OpenClaw фільтрує навички під час завантаження за допомогою `metadata.openclaw` (однорядковий
JSON у frontmatter). Навичка без блока `metadata.openclaw` завжди
придатна, якщо її явно не вимкнено.

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
  Коли `true`, завжди включає навичку й пропускає всі інші умови допуску.
</ParamField>

<ParamField path="emoji" type="string">
  Необов’язковий емодзі, який показується в інтерфейсі macOS Skills.
</ParamField>

<ParamField path="homepage" type="string">
  Необов’язкова URL-адреса, яка показується як "Вебсайт" в інтерфейсі macOS Skills.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Фільтр платформи. Коли задано, навичка придатна лише на перелічених ОС.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Кожен бінарний файл має існувати в `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Принаймні один бінарний файл має існувати в `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Кожна змінна середовища має існувати в процесі або бути наданою через конфігурацію.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Кожен шлях `openclaw.json` має бути truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Назва змінної середовища, пов’язаної з `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Необов’язкові специфікації інсталятора, які використовує інтерфейс macOS Skills (brew / node / go / uv / download).
</ParamField>

<Note>
  Застарілі блоки `metadata.clawdbot` досі приймаються, коли
  `metadata.openclaw` відсутній, тож старіші встановлені навички зберігають свої
  умови залежностей і підказки інсталятора. Нові навички мають використовувати
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
    - Коли перелічено кілька інсталяторів, Gateway вибирає один пріоритетний
      варіант (brew, якщо доступний, інакше node).
    - Якщо всі інсталятори мають тип `download`, OpenClaw перелічує кожен запис, щоб ви могли
      бачити всі доступні артефакти.
    - Специфікації можуть містити `os: ["darwin"|"linux"|"win32"]` для фільтрації за платформою.
    - Інсталяції Node враховують `skills.install.nodeManager` в `openclaw.json`
      (типово: npm; варіанти: npm / pnpm / yarn / bun). Це впливає лише на
      інсталяції навичок; середовище виконання Gateway усе одно має бути Node.
    - Пріоритет інсталятора Gateway: Homebrew → uv → налаштований менеджер node →
      go → download.
  </Accordion>
  <Accordion title="Подробиці для кожного інсталятора">
    - **Homebrew:** OpenClaw не встановлює Homebrew автоматично й не перетворює формули brew
      на команди системного пакункового менеджера. У Linux-контейнерах без
      `brew` інсталятори лише з brew приховано; використайте власний образ або встановіть
      залежність вручну.
    - **Go:** якщо `go` відсутній, а `brew` доступний, Gateway спершу встановлює
      Go через Homebrew і задає `GOBIN` як `bin` Homebrew.
    - **Download:** `url` (обов’язково), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (типово: auto, коли виявлено архів), `stripComponents`,
      `targetDir` (типово: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Нотатки щодо ізоляції">
    `requires.bins` перевіряється на **хості** під час завантаження навички. Якщо агент
    працює в ізольованому середовищі, бінарний файл також має існувати **всередині контейнера**.
    Установіть його через `agents.defaults.sandbox.docker.setupCommand` або власний
    образ. `setupCommand` виконується один раз після створення контейнера й потребує
    мережевого виходу, кореневої ФС із правом запису та користувача root в ізольованому середовищі.
  </Accordion>
</AccordionGroup>

## Перевизначення конфігурації

Перемикайте й налаштовуйте вбудовані або керовані навички в `skills.entries` у
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
  `false` вимикає навичку, навіть якщо вона вбудована або встановлена. Вбудована навичка `coding-agent`
  вмикається явно — задайте `skills.entries.coding-agent.enabled: true`
  і переконайтеся, що один із `claude`, `codex`, `opencode` або інший підтримуваний CLI
  встановлений і автентифікований.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Зручне поле для навичок, які оголошують `metadata.openclaw.primaryEnv`.
  Підтримує відкритий текстовий рядок або об’єкт SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Змінні середовища, ін’єктовані для запуску агента. Ін’єктуються лише тоді, коли
  змінну ще не задано в процесі.
</ParamField>

<ParamField path="config" type="object">
  Необов’язковий контейнер для власних полів конфігурації окремої навички.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Необов’язковий список дозволених лише для **вбудованих** навичок. Коли задано, придатними є лише вбудовані навички
  зі списку. На керовані навички та навички робочого простору це не впливає.
</ParamField>

<Note>
  Ключі конфігурації типово відповідають **назві навички**. Якщо навичка визначає
  `metadata.openclaw.skillKey`, використовуйте цей ключ у `skills.entries`. Беріть
  назви з дефісами в лапки: JSON5 дозволяє ключі в лапках.
</Note>

## Ін’єкція середовища

Коли запуск агента починається, OpenClaw:

<Steps>
  <Step title="Читає метадані навичок">
    OpenClaw визначає ефективний список навичок для агента, застосовуючи правила допуску,
    списки дозволених і перевизначення конфігурації.
  </Step>
  <Step title="Ін’єктує змінні середовища й API-ключі">
    `skills.entries.<key>.env` і `skills.entries.<key>.apiKey` застосовуються до
    `process.env` на час виконання запуску.
  </Step>
  <Step title="Будує системний промпт">
    Придатні навички компілюються в компактний XML-блок і ін’єктуються в
    системний промпт.
  </Step>
  <Step title="Відновлює середовище">
    Після завершення запуску початкове середовище відновлюється.
  </Step>
</Steps>

<Warning>
  Ін’єкція змінних середовища обмежена запуском агента на **хості**, а не ізольованим середовищем. Усередині
  ізольованого середовища `env` і `apiKey` не мають ефекту. Див.
  [Конфігурація Skills](/uk/tools/skills-config#sandboxed-skills-and-env-vars), щоб дізнатися, як
  передавати секрети в ізольовані запуски.
</Warning>

Для вбудованого бекенда `claude-cli` OpenClaw також матеріалізує той самий
знімок придатних навичок як тимчасовий Plugin Claude Code і передає його через
`--plugin-dir`. Інші бекенди CLI використовують лише каталог промпта.

## Знімки й оновлення

OpenClaw створює знімок придатних навичок **коли починається сеанс** і повторно використовує цей
список для всіх наступних ходів у сеансі. Зміни навичок або конфігурації набирають
чинності під час наступного нового сеансу.

Skills оновлюються посеред сеансу у двох випадках:

- Спостерігач Skills виявляє зміну `SKILL.md`.
- Підключається новий придатний віддалений вузол.

Оновлений список підхоплюється під час наступного ходу агента. Якщо ефективний список дозволених
для агента змінюється, OpenClaw оновлює знімок, щоб видимі навички
залишалися узгодженими.

<AccordionGroup>
  <Accordion title="Спостерігач Skills">
    Типово OpenClaw відстежує папки навичок і підвищує версію знімка, коли
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

    Використовуйте `allowSymlinkTargets` для навмисних компонувань із символьними посиланнями, де символьне посилання
    кореня навички вказує за межі налаштованого кореня, наприклад
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Увімкніть `skills.workshop.allowSymlinkTargetWrites` лише тоді, коли Skill Workshop
    також має застосовувати пропозиції через ці довірені шляхи символьних посилань.

  </Accordion>
  <Accordion title="Віддалені вузли macOS (Linux Gateway)">
    Якщо Gateway працює на Linux, але підключено **вузол macOS** із дозволеним
    `system.run`, OpenClaw може вважати навички лише для macOS придатними, коли
    потрібні бінарні файли присутні на цьому вузлі. Агент має запускати ці
    навички через інструмент `exec` з `host=node`.

    Вузли офлайн **не** роблять видимими навички лише для віддаленого запуску. Якщо вузол припиняє
    відповідати на перевірки бінарних файлів, OpenClaw очищає кешовані збіги бінарних файлів для нього.

  </Accordion>
</AccordionGroup>

## Вплив на токени

Коли навички придатні, OpenClaw ін’єктує компактний XML-блок у системний
промпт. Вартість детермінована:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Базові накладні витрати** (лише коли ≥ 1 навичка): ~195 символів
- **На навичку:** ~97 символів + довжини ваших полів `name`, `description` і `location`
- XML-екранування розгортає `& < > " '` у сутності, додаючи кілька символів на кожен випадок
- За ~4 символи/токен, 97 символів ≈ 24 токени на навичку до врахування довжин полів

Тримайте описи короткими й інформативними, щоб мінімізувати накладні витрати промпта.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Створення навичок" href="/uk/tools/creating-skills" icon="hammer">
    Покроковий посібник зі створення власної навички.
  </Card>
  <Card title="Skill Workshop" href="/uk/tools/skill-workshop" icon="flask">
    Черга пропозицій для навичок, підготовлених агентом.
  </Card>
  <Card title="Конфігурація Skills" href="/uk/tools/skills-config" icon="gear">
    Повна схема конфігурації `skills.*` і списки дозволених для агентів.
  </Card>
  <Card title="Слеш-команди" href="/uk/tools/slash-commands" icon="terminal">
    Як реєструються й маршрутизуються слеш-команди навичок.
  </Card>
  <Card title="ClawHub" href="/uk/clawhub" icon="cloud">
    Переглядайте й публікуйте навички в публічному реєстрі.
  </Card>
  <Card title="Plugins" href="/uk/tools/plugin" icon="plug">
    Plugins можуть постачати навички разом з інструментами, які вони документують.
  </Card>
</CardGroup>
