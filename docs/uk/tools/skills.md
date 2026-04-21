---
read_when:
    - Додавання або змінення Skills
    - Змінення правил gate або завантаження для Skills
summary: 'Skills: керовані проти робочого простору, правила gate і прив’язка config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-21T20:38:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw використовує папки Skills, **сумісні з [AgentSkills](https://agentskills.io)**, щоб навчати агента користуватися інструментами. Кожен Skill — це директорія, що містить `SKILL.md` із YAML frontmatter та інструкціями. OpenClaw завантажує **вбудовані Skills** разом з необов’язковими локальними перевизначеннями та фільтрує їх під час завантаження на основі середовища, config і наявності бінарних файлів.

## Розташування та пріоритет

OpenClaw завантажує Skills із таких джерел:

1. **Додаткові папки Skills**: налаштовуються через `skills.load.extraDirs`
2. **Вбудовані Skills**: постачаються разом з інсталяцією (npm package або OpenClaw.app)
3. **Керовані/локальні Skills**: `~/.openclaw/skills`
4. **Персональні Skills агента**: `~/.agents/skills`
5. **Project agent Skills**: `<workspace>/.agents/skills`
6. **Skills робочого простору**: `<workspace>/skills`

Якщо імена Skills конфліктують, пріоритет такий:

`<workspace>/skills` (найвищий) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані Skills → `skills.load.extraDirs` (найнижчий)

## Skills для окремого агента та спільні Skills

У конфігураціях **з кількома агентами** кожен агент має власний робочий простір. Це означає:

- **Skills окремого агента** розміщуються в `<workspace>/skills` лише для цього агента.
- **Project agent Skills** розміщуються в `<workspace>/.agents/skills` і застосовуються до
  цього робочого простору перед звичайною папкою `skills/` робочого простору.
- **Персональні Skills агента** розміщуються в `~/.agents/skills` і застосовуються в усіх
  робочих просторах на цій машині.
- **Спільні Skills** розміщуються в `~/.openclaw/skills` (керовані/локальні) і видимі
  **всім агентам** на цій самій машині.
- **Спільні папки** також можна додати через `skills.load.extraDirs` (найнижчий
  пріоритет), якщо ви хочете мати спільний набір Skills, який використовується кількома агентами.

Якщо те саме ім’я Skill існує більш ніж в одному місці, застосовується звичайний
пріоритет: перемагає робочий простір, потім Project agent Skills, потім персональні Skills агента,
потім керовані/локальні, потім вбудовані, потім додаткові директорії.

## Списки дозволених Skills для агента

**Розташування** Skill і **видимість** Skill — це окремі механізми керування.

- Розташування/пріоритет визначає, яка копія Skill з однаковою назвою перемагає.
- Списки дозволених Skills для агента визначають, які видимі Skills агент справді може використовувати.

Використовуйте `agents.defaults.skills` для спільної базової конфігурації, а потім перевизначайте для окремого агента через
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює значення за замовчуванням
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

Правила:

- Пропустіть `agents.defaults.skills`, щоб за замовчуванням Skills не були обмежені.
- Пропустіть `agents.list[].skills`, щоб успадкувати `agents.defaults.skills`.
- Установіть `agents.list[].skills: []`, щоб не дозволити жодних Skills.
- Непорожній список `agents.list[].skills` є фінальним набором для цього агента; він
  не об’єднується зі значеннями за замовчуванням.

OpenClaw застосовує ефективний набір Skills агента під час побудови prompt, виявлення slash-команд Skill, синхронізації sandbox і знімків Skills.

## Plugin-ів + Skills

Plugin-и можуть постачати власні Skills, указуючи директорії `skills` у
`openclaw.plugin.json` (шляхи відносно кореня plugin-а). Skills plugin-а завантажуються,
коли plugin увімкнено. Наразі ці директорії зливаються в той самий шлях
низького пріоритету, що й `skills.load.extraDirs`, тож Skill з однаковим ім’ям із вбудованого,
керованого, агентського або робочого простору перевизначає їх.
Ви можете обмежити їх через `metadata.openclaw.requires.config` у записі config
plugin-а. Див. [Plugins](/uk/tools/plugin) щодо виявлення/config та [Tools](/uk/tools) щодо
поверхні інструментів, якої навчають ці Skills.

## Skill Workshop

Необов’язковий експериментальний plugin Skill Workshop може створювати або оновлювати Skills робочого простору
з повторно використовуваних процедур, виявлених під час роботи агента. Його вимкнено за замовчуванням, і його потрібно явно ввімкнути через
`plugins.entries.skill-workshop`.

Skill Workshop записує лише в `<workspace>/skills`, сканує згенерований вміст,
підтримує очікування підтвердження або автоматичний безпечний запис, поміщає небезпечні
пропозиції на карантин і оновлює знімок Skills після успішного запису, щоб нові
Skills могли стати доступними без перезапуску Gateway.

Використовуйте його, коли хочете, щоб такі виправлення, як «наступного разу перевіряй атрибуцію GIF» або
складно здобуті робочі процеси, як-от контрольні списки медіа-QA, ставали
стійкими процедурними інструкціями. Починайте з режиму очікування підтвердження; використовуйте автоматичний запис лише в довірених робочих просторах після перегляду його пропозицій. Повний посібник:
[Skill Workshop Plugin](/uk/plugins/skill-workshop).

## ClawHub (інсталяція + синхронізація)

ClawHub — це публічний реєстр Skills для OpenClaw. Перегляд доступний на
[https://clawhub.ai](https://clawhub.ai). Використовуйте нативні команди `openclaw skills`
для виявлення/інсталяції/оновлення Skills або окремий CLI `clawhub`, коли
вам потрібні робочі процеси публікації/синхронізації.
Повний посібник: [ClawHub](/uk/tools/clawhub).

Поширені сценарії:

- Інсталювати Skill у ваш робочий простір:
  - `openclaw skills install <skill-slug>`
- Оновити всі інстальовані Skills:
  - `openclaw skills update --all`
- Синхронізувати (сканування + публікація оновлень):
  - `clawhub sync --all`

Нативна команда `openclaw skills install` інсталює в активну директорію `skills/`
робочого простору. Окремий CLI `clawhub` також інсталює в `./skills` у вашому
поточному робочому каталозі (або використовує налаштований робочий простір OpenClaw як резервний варіант).
OpenClaw підхопить це як `<workspace>/skills` під час наступної сесії.

## Примітки щодо безпеки

- Вважайте сторонні Skills **ненадійним кодом**. Читайте їх перед увімкненням.
- Для ненадійних входів і ризикованих інструментів надавайте перевагу sandbox-запускам. Див. [Sandboxing](/uk/gateway/sandboxing).
- Виявлення Skills у робочому просторі та додаткових директоріях приймає лише корені Skills і файли `SKILL.md`, чий обчислений realpath залишається всередині налаштованого кореня.
- Інсталяції залежностей Skill через Gateway (`skills.install`, onboarding і UI налаштувань Skills) запускають вбудований сканер небезпечного коду перед виконанням метаданих інсталятора. Знахідки рівня `critical` блокуються за замовчуванням, якщо викликач явно не встановлює перевизначення небезпеки; підозрілі знахідки все ще лише попереджають.
- `openclaw skills install <slug>` відрізняється: ця команда завантажує папку Skill з ClawHub до робочого простору і не використовує описаний вище шлях метаданих інсталятора.
- `skills.entries.*.env` і `skills.entries.*.apiKey` інжектують секрети в **host**-процес
  для цього ходу агента (не в sandbox). Не допускайте секрети в prompt-и й логи.
- Ширшу модель загроз і контрольні списки див. в [Security](/uk/gateway/security).

## Формат (сумісний з AgentSkills + Pi)

`SKILL.md` має містити щонайменше:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Примітки:

- Ми дотримуємося специфікації AgentSkills щодо структури/призначення.
- Парсер, який використовує вбудований агент, підтримує лише **однорядкові** ключі frontmatter.
- `metadata` має бути **однорядковим JSON-об’єктом**.
- Використовуйте `{baseDir}` в інструкціях, щоб посилатися на шлях до папки Skill.
- Необов’язкові ключі frontmatter:
  - `homepage` — URL, який відображається як “Website” у macOS UI Skills (також підтримується через `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (типове значення: `true`). Якщо `true`, Skill доступний як slash-команда користувача.
  - `disable-model-invocation` — `true|false` (типове значення: `false`). Якщо `true`, Skill виключається з prompt моделі (але все ще доступний через виклик користувачем).
  - `command-dispatch` — `tool` (необов’язково). Якщо встановлено `tool`, slash-команда оминає модель і напряму диспетчеризується до інструмента.
  - `command-tool` — назва інструмента, який потрібно викликати, коли встановлено `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (типове значення). Для диспетчеризації до інструмента пересилає сирий рядок аргументів до інструмента (без парсингу в ядрі).

    Інструмент викликається з параметрами:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gate (фільтри під час завантаження)

OpenClaw **фільтрує Skills під час завантаження** за допомогою `metadata` (однорядковий JSON):

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

Поля в `metadata.openclaw`:

- `always: true` — завжди включати Skill (пропустити інші gate).
- `emoji` — необов’язковий emoji, який використовується в macOS UI Skills.
- `homepage` — необов’язковий URL, який відображається як “Website” у macOS UI Skills.
- `os` — необов’язковий список платформ (`darwin`, `linux`, `win32`). Якщо встановлено, Skill доступний лише в цих ОС.
- `requires.bins` — список; кожен елемент має існувати в `PATH`.
- `requires.anyBins` — список; у `PATH` має існувати принаймні один елемент.
- `requires.env` — список; змінна середовища має існувати **або** бути наданою в config.
- `requires.config` — список шляхів `openclaw.json`, які мають бути truthy.
- `primaryEnv` — назва змінної середовища, пов’язаної з `skills.entries.<name>.apiKey`.
- `install` — необов’язковий масив специфікацій інсталятора, який використовує macOS UI Skills (brew/node/go/uv/download).

Примітка щодо sandboxing:

- `requires.bins` перевіряється на **host** під час завантаження Skill.
- Якщо агент працює в sandbox, бінарний файл також має існувати **всередині контейнера**.
  Інсталюйте його через `agents.defaults.sandbox.docker.setupCommand` (або через власний образ).
  `setupCommand` запускається один раз після створення контейнера.
  Інсталяція package також вимагає мережевого виходу, записуваної кореневої FS і root-користувача в sandbox.
  Наприклад, Skill `summarize` (`skills/summarize/SKILL.md`) потребує CLI `summarize`
  у контейнері sandbox, щоб працювати там.

Приклад інсталятора:

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

Примітки:

- Якщо вказано кілька інсталяторів, Gateway вибирає **один** бажаний варіант (brew, якщо доступний, інакше node).
- Якщо всі інсталятори мають тип `download`, OpenClaw перелічує кожен запис, щоб ви могли бачити доступні артефакти.
- Специфікації інсталятора можуть містити `os: ["darwin"|"linux"|"win32"]`, щоб фільтрувати варіанти за платформою.
- Інсталяції через node враховують `skills.install.nodeManager` в `openclaw.json` (типове значення: npm; варіанти: npm/pnpm/yarn/bun).
  Це впливає лише на **інсталяції Skills**; runtime Gateway усе одно має бути Node
  (Bun не рекомендується для WhatsApp/Telegram).
- Вибір інсталятора через Gateway базується на пріоритетах, а не лише на node:
  коли специфікації інсталяції змішують різні типи, OpenClaw надає перевагу Homebrew, якщо
  увімкнено `skills.install.preferBrew` і існує `brew`, потім `uv`, потім
  налаштований node manager, потім інші резервні варіанти, такі як `go` або `download`.
- Якщо кожна специфікація інсталяції має тип `download`, OpenClaw показує всі варіанти завантаження
  замість згортання до одного бажаного інсталятора.
- Інсталяції через Go: якщо `go` відсутній, а `brew` доступний, Gateway спочатку інсталює Go через Homebrew і за можливості встановлює `GOBIN` на `bin` від Homebrew.
- Інсталяції через download: `url` (обов’язково), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (типове значення: auto при виявленні архіву), `stripComponents`, `targetDir` (типове значення: `~/.openclaw/tools/<skillKey>`).

Якщо `metadata.openclaw` відсутній, Skill завжди доступний (якщо тільки
його не вимкнено в config або не заблоковано через `skills.allowBundled` для вбудованих Skills).

## Перевизначення config (`~/.openclaw/openclaw.json`)

Вбудовані/керовані Skills можна вмикати або вимикати та надавати їм значення env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // або рядок plaintext
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
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

Примітка: якщо назва Skill містить дефіси, візьміть ключ у лапки (JSON5 дозволяє ключі в лапках).

Якщо вам потрібне стандартне генерування/редагування зображень усередині самого OpenClaw, використовуйте основний
інструмент `image_generate` з `agents.defaults.imageGenerationModel` замість
вбудованого Skill. Приклади Skills тут наведені для користувацьких або сторонніх робочих процесів.

Для нативного аналізу зображень використовуйте інструмент `image` з `agents.defaults.imageModel`.
Для нативного генерування/редагування зображень використовуйте `image_generate` з
`agents.defaults.imageGenerationModel`. Якщо ви вибираєте `openai/*`, `google/*`,
`fal/*` або іншу специфічну для провайдера модель зображення, також додайте auth/API
ключ цього провайдера.

Ключі config за замовчуванням відповідають **назві Skill**. Якщо Skill визначає
`metadata.openclaw.skillKey`, використовуйте цей ключ у `skills.entries`.

Правила:

- `enabled: false` вимикає Skill, навіть якщо він вбудований/інстальований.
- `env`: інжектується **лише якщо** змінна ще не встановлена в процесі.
- `apiKey`: зручний механізм для Skills, які оголошують `metadata.openclaw.primaryEnv`.
  Підтримує plaintext-рядок або об’єкт SecretRef (`{ source, provider, id }`).
- `config`: необов’язковий контейнер для користувацьких полів окремого Skill; користувацькі ключі мають міститися тут.
- `allowBundled`: необов’язковий allowlist лише для **вбудованих** Skills. Якщо встановлено, доступними є лише
  вбудовані Skills зі списку (керовані/робочого простору Skills не зачіпаються).

## Інжекція середовища (для кожного запуску агента)

Коли запускається агент, OpenClaw:

1. Читає метадані Skill.
2. Застосовує будь-які `skills.entries.<key>.env` або `skills.entries.<key>.apiKey` до
   `process.env`.
3. Будує системний prompt із **доступними** Skills.
4. Відновлює початкове середовище після завершення запуску.

Це **обмежується запуском агента**, а не глобальним shell-середовищем.

Для вбудованого backend `claude-cli` OpenClaw також матеріалізує той самий
доступний знімок як тимчасовий plugin Claude Code і передає його через
`--plugin-dir`. Тоді Claude Code може використовувати власний нативний резолвер Skills, тоді як
OpenClaw усе ще володіє пріоритетом, allowlist-ами для окремих агентів, gate-ами та
інжекцією env/API key через `skills.entries.*`. Інші CLI backend-и використовують лише каталог
prompt-ів.

## Знімок сесії (продуктивність)

OpenClaw робить знімок доступних Skills **під час початку сесії** і повторно використовує цей список для наступних ходів у межах тієї самої сесії. Зміни в Skills або config набирають чинності в наступній новій сесії.

Skills також можуть оновлюватися в середині сесії, коли ввімкнено watcher Skills або коли з’являється новий доступний віддалений Node (див. нижче). Думайте про це як про **гаряче перезавантаження**: оновлений список підхоплюється на наступному ході агента.

Якщо для цієї сесії змінюється ефективний allowlist Skills агента, OpenClaw
оновлює знімок, щоб видимі Skills залишалися узгодженими з поточним
агентом.

## Віддалені macOS Node-и (Linux Gateway)

Якщо Gateway працює на Linux, але **macOS Node** підключений **з дозволеним `system.run`** (безпека Exec approvals не встановлена в `deny`), OpenClaw може вважати Skills лише для macOS доступними, коли потрібні бінарні файли присутні на цьому Node. Агент має виконувати такі Skills через інструмент `exec` з `host=node`.

Це спирається на те, що Node повідомляє про підтримку команд і на перевірку бінарних файлів через `system.run`. Якщо macOS Node пізніше відключиться, Skills залишаться видимими; виклики можуть завершуватися помилкою, доки Node не підключиться знову.

## Watcher Skills (автооновлення)

За замовчуванням OpenClaw відстежує папки Skills і збільшує знімок Skills, коли змінюються файли `SKILL.md`. Налаштовується це в `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Вплив на токени (список Skills)

Коли Skills доступні, OpenClaw інжектує компактний XML-список доступних Skills у системний prompt (через `formatSkillsForPrompt` у `pi-coding-agent`). Вартість є детермінованою:

- **Базові накладні витрати (лише коли ≥1 Skill):** 195 символів.
- **На один Skill:** 97 символів + довжина значень `<name>`, `<description>` і `<location>` після XML-екранування.

Формула (символи):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Примітки:

- XML-екранування розширює `& < > " '` до сутностей (`&amp;`, `&lt;` тощо), збільшуючи довжину.
- Кількість токенів залежить від tokenizer моделі. Груба оцінка у стилі OpenAI — ~4 символи/токен, тому **97 символів ≈ 24 токени** на Skill плюс фактичні довжини ваших полів.

## Життєвий цикл керованих Skills

OpenClaw постачає базовий набір Skills як **вбудовані Skills** у складі
інсталяції (npm package або OpenClaw.app). `~/.openclaw/skills` існує для локальних
перевизначень (наприклад, щоб зафіксувати/пропатчити Skill без зміни вбудованої
копії). Skills робочого простору належать користувачу та перевизначають обидва варіанти в разі конфліктів імен.

## Довідник config

Повну схему конфігурації див. у [Skills config](/uk/tools/skills-config).

## Шукаєте більше Skills?

Перегляньте [https://clawhub.ai](https://clawhub.ai).

---

## Пов’язане

- [Створення Skills](/uk/tools/creating-skills) — створення користувацьких Skills
- [Skills Config](/uk/tools/skills-config) — довідник конфігурації Skills
- [Slash Commands](/uk/tools/slash-commands) — усі доступні slash-команди
- [Plugins](/uk/tools/plugin) — огляд системи plugin-ів
