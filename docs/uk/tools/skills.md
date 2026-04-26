---
read_when:
    - Додавання або змінення Skills
    - Змінення правил гейтінгу Skills, списків дозволів або правил завантаження
    - Розуміння пріоритету Skills і поведінки знімків
sidebarTitle: Skills
summary: 'Skills: керовані чи робочого простору, правила гейтінгу, списки дозволів агентів і налаштування конфігурації'
title: Skills
x-i18n:
    generated_at: "2026-04-26T05:48:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw використовує сумісні з **[AgentSkills](https://agentskills.io)** теки skills, щоб навчати агента користуватися інструментами. Кожен skill — це директорія, що містить `SKILL.md` з YAML frontmatter та інструкціями. OpenClaw завантажує вбудовані skills, а також необов’язкові локальні перевизначення, і фільтрує їх під час завантаження залежно від середовища, конфігурації та наявності бінарних файлів.

## Розташування та пріоритет

OpenClaw завантажує skills з таких джерел, **від найвищого пріоритету до найнижчого**:

| #   | Джерело               | Шлях                             |
| --- | --------------------- | -------------------------------- |
| 1   | Skills робочого простору | `<workspace>/skills`             |
| 2   | Skills агента проєкту | `<workspace>/.agents/skills`     |
| 3   | Особисті skills агента | `~/.agents/skills`               |
| 4   | Керовані/локальні skills | `~/.openclaw/skills`             |
| 5   | Вбудовані skills      | постачаються разом з установкою  |
| 6   | Додаткові теки skills | `skills.load.extraDirs` (config) |

Якщо назва skill конфліктує, перемагає джерело з найвищим пріоритетом.

## Skills для окремого агента та спільні skills

У конфігураціях **з кількома агентами** кожен агент має власний робочий простір:

| Область               | Шлях                                        | Видимість                  |
| --------------------- | ------------------------------------------- | -------------------------- |
| Для окремого агента   | `<workspace>/skills`                        | Лише для цього агента      |
| Агент проєкту         | `<workspace>/.agents/skills`                | Лише для агента цього workspace |
| Особистий агент       | `~/.agents/skills`                          | Для всіх агентів на цій машині |
| Спільні керовані/локальні | `~/.openclaw/skills`                    | Для всіх агентів на цій машині |
| Спільні додаткові теки | `skills.load.extraDirs` (найнижчий пріоритет) | Для всіх агентів на цій машині |

Однакова назва в кількох місцях → перемагає джерело з найвищим пріоритетом. Workspace має пріоритет над agent проєкту, той — над personal-agent, далі — над managed/local, далі — над bundled, далі — над extra dirs.

## Списки дозволених skills для агентів

**Розташування** skill і **видимість** skill — це різні механізми керування.
Розташування/пріоритет визначає, яка копія skill з однаковою назвою перемагає; списки дозволів агентів визначають, які skills агент узагалі може використовувати.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює defaults
      { id: "locked-down", skills: [] }, // без skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Правила списків дозволів">
    - Не вказуйте `agents.defaults.skills`, якщо за замовчуванням skills не мають бути обмежені.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати `agents.defaults.skills`.
    - Установіть `agents.list[].skills: []`, щоб не дозволити жодного skill.
    - Непорожній список `agents.list[].skills` є **остаточним** набором для цього агента — він не об’єднується з defaults.
    - Ефективний список дозволів застосовується під час побудови prompt, виявлення slash-команд skills, синхронізації sandbox і знімків skills.
  </Accordion>
</AccordionGroup>

## Plugins і skills

Plugins можуть постачати власні skills, перелічуючи директорії `skills` в
`openclaw.plugin.json` (шляхи відносно кореня plugin). Skills plugin завантажуються, коли plugin увімкнено. Це правильне місце для посібників з використання інструментів, які надто довгі для опису інструмента, але мають бути доступні щоразу, коли plugin встановлено — наприклад, plugin браузера постачає skill `browser-automation` для багатокрокового керування браузером.

Директорії skills plugin об’єднуються в той самий шлях із низьким пріоритетом, що й
`skills.load.extraDirs`, тому skill з такою самою назвою з bundled, managed, agent або
workspace перевизначає їх. Їх можна гейтінгувати через
`metadata.openclaw.requires.config` у записі конфігурації plugin.

Див. [Plugins](/uk/tools/plugin) для виявлення/конфігурації та [Tools](/uk/tools) для поверхні інструментів, якої навчають ці skills.

## Skill Workshop

Необов’язковий експериментальний plugin **Skill Workshop** може створювати або оновлювати skills робочого простору на основі повторно використовуваних процедур, виявлених під час роботи агента. Він вимкнений за замовчуванням і має бути явно увімкнений через
`plugins.entries.skill-workshop`.

Skill Workshop записує дані лише до `<workspace>/skills`, сканує згенерований
вміст, підтримує відкладене схвалення або автоматичний безпечний запис, поміщає небезпечні пропозиції в карантин і оновлює знімок skill після успішного запису, щоб нові skills ставали доступними без перезапуску Gateway.

Використовуйте його для виправлень на кшталт _"наступного разу перевіряй атрибуцію GIF"_ або для важко здобутих робочих процесів, таких як контрольні списки QA для медіа. Починайте з відкладеного схвалення; автоматичний запис використовуйте лише в довірених робочих просторах після перевірки його пропозицій. Повний посібник: [plugin Skill Workshop](/uk/plugins/skill-workshop).

## ClawHub (установлення та синхронізація)

[ClawHub](https://clawhub.ai) — це публічний реєстр skills для OpenClaw.
Використовуйте нативні команди `openclaw skills` для виявлення/установлення/оновлення або окремий CLI `clawhub` для робочих процесів публікації/синхронізації. Повний посібник:
[ClawHub](/uk/tools/clawhub).

| Дія                                  | Команда                                |
| ------------------------------------ | -------------------------------------- |
| Установити skill у workspace         | `openclaw skills install <skill-slug>` |
| Оновити всі встановлені skills       | `openclaw skills update --all`         |
| Синхронізація (сканування + публікація оновлень) | `clawhub sync --all`         |

Нативна команда `openclaw skills install` установлює до активної директорії
`skills/` workspace. Окремий CLI `clawhub` також установлює до
`./skills` у поточному робочому каталозі (або використовує налаштований workspace OpenClaw як запасний варіант). OpenClaw підхопить це як
`<workspace>/skills` у наступній сесії.

## Безпека

<Warning>
Ставтеся до сторонніх skills як до **ненадійного коду**. Прочитайте їх перед увімкненням.
Для ненадійних вхідних даних і ризикованих інструментів віддавайте перевагу запускам у sandbox. Див.
[Sandboxing](/uk/gateway/sandboxing) для елементів керування на боці агента.
</Warning>

- Виявлення skills у workspace і в extra-dir приймає лише корені skills і файли `SKILL.md`, чий обчислений realpath залишається всередині налаштованого кореня.
- Установлення залежностей skills через Gateway (`skills.install`, онбординг і UI налаштувань Skills) запускають вбудований сканер небезпечного коду перед виконанням метаданих установлення. Знахідки рівня `critical` блокуються за замовчуванням, якщо викликач явно не встановить dangerous override; підозрілі знахідки лише попереджають.
- `openclaw skills install <slug>` — це інше: команда завантажує теку skill із ClawHub у workspace і не використовує описаний вище шлях метаданих установлення.
- `skills.entries.*.env` і `skills.entries.*.apiKey` інжектують секрети в **host**-процес для цього ходу агента (а не в sandbox). Не допускайте потрапляння секретів у prompts і журнали.

Для ширшої моделі загроз і контрольних списків див. [Security](/uk/gateway/security).

## Формат SKILL.md

`SKILL.md` має містити щонайменше:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw дотримується специфікації AgentSkills щодо структури/призначення. Парсер, який використовує вбудований агент, підтримує лише **однорядкові** ключі frontmatter;
`metadata` має бути **однорядковим** JSON-об’єктом. Використовуйте `{baseDir}` в інструкціях, щоб посилатися на шлях до теки skill.

### Необов’язкові ключі frontmatter

<ParamField path="homepage" type="string">
  URL, що відображається як "Website" в UI Skills для macOS. Також підтримується через `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Якщо значення `true`, skill доступний як slash-команда користувача.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Якщо значення `true`, skill виключається з prompt моделі (але все ще доступний через виклик користувачем).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Якщо встановлено `tool`, slash-команда оминає модель і напряму викликає інструмент.
</ParamField>
<ParamField path="command-tool" type="string">
  Назва інструмента для виклику, коли встановлено `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Для dispatch інструмента передає необроблений рядок args до інструмента (без парсингу ядром). Інструмент викликається з `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Гейтінг (фільтри під час завантаження)

OpenClaw фільтрує skills під час завантаження за допомогою `metadata` (однорядковий JSON):

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

<ParamField path="always" type="boolean">
  Якщо значення `true`, skill завжди включається (інші gate-умови пропускаються).
</ParamField>
<ParamField path="emoji" type="string">
  Необов’язковий emoji, що використовується в UI Skills для macOS.
</ParamField>
<ParamField path="homepage" type="string">
  Необов’язковий URL, що показується як "Website" в UI Skills для macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Необов’язковий список платформ. Якщо задано, skill доступний лише на цих ОС.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Кожен має існувати в `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Принаймні один має існувати в `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Змінна середовища має існувати або бути надана в config.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Список шляхів `openclaw.json`, які мають бути truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Назва змінної середовища, пов’язаної з `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Необов’язкові специфікації інсталятора, що використовуються в UI Skills для macOS (brew/node/go/uv/download).
</ParamField>

Якщо `metadata.openclaw` відсутній, skill завжди вважається доступним (якщо
його не вимкнено в config або не заблоковано через `skills.allowBundled` для bundled skills).

<Note>
Застарілі блоки `metadata.clawdbot` усе ще підтримуються, коли
`metadata.openclaw` відсутній, тож старіші встановлені skills зберігають свої
gate-умови залежностей і підказки для інсталятора. Нові та оновлені skills мають використовувати
`metadata.openclaw`.
</Note>

### Примітки щодо sandboxing

- `requires.bins` перевіряється на **host** під час завантаження skill.
- Якщо агент працює в sandbox, бінарний файл також має існувати **всередині контейнера**. Установіть його через `agents.defaults.sandbox.docker.setupCommand` (або використайте власний образ). `setupCommand` виконується один раз після створення контейнера. Установлення пакетів також потребує вихідного мережевого доступу, доступної для запису кореневої ФС і root-користувача в sandbox.
- Приклад: skill `summarize` (`skills/summarize/SKILL.md`) потребує CLI `summarize` у контейнері sandbox, щоб працювати там.

### Специфікації інсталятора

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
    - Якщо вказано кілька інсталяторів, gateway вибирає один бажаний варіант (brew, якщо доступний, інакше node).
    - Якщо всі інсталятори мають тип `download`, OpenClaw перелічує кожен запис, щоб ви могли бачити доступні артефакти.
    - Специфікації інсталятора можуть містити `os: ["darwin"|"linux"|"win32"]`, щоб фільтрувати варіанти за платформою.
    - Інсталяції Node враховують `skills.install.nodeManager` у `openclaw.json` (типово: npm; варіанти: npm/pnpm/yarn/bun). Це впливає лише на встановлення skills; середовище виконання Gateway все одно має бути Node — Bun не рекомендується для WhatsApp/Telegram.
    - Вибір інсталятора через Gateway базується на пріоритетах: коли специфікації встановлення змішують різні типи, OpenClaw віддає перевагу Homebrew, якщо ввімкнено `skills.install.preferBrew` і існує `brew`, потім `uv`, потім налаштований менеджер node, потім інші запасні варіанти, як-от `go` або `download`.
    - Якщо всі специфікації встановлення мають тип `download`, OpenClaw показує всі варіанти завантаження замість зведення до одного бажаного інсталятора.
  </Accordion>
  <Accordion title="Деталі для кожного інсталятора">
    - **Інсталяції Go:** якщо `go` відсутній, а `brew` доступний, gateway спочатку встановлює Go через Homebrew і, за можливості, встановлює `GOBIN` у `bin` від Homebrew.
    - **Інсталяції через download:** `url` (обов’язково), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (типово: auto, якщо виявлено архів), `stripComponents`, `targetDir` (типово: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
</AccordionGroup>

## Перевизначення конфігурації

Вбудовані та керовані skills можна вмикати/вимикати та передавати їм значення env
через `skills.entries` у `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // або простий текстовий рядок
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

<ParamField path="enabled" type="boolean">
  `false` вимикає skill, навіть якщо він вбудований або встановлений.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Зручне скорочення для skills, які оголошують `metadata.openclaw.primaryEnv`. Підтримує простий текст або SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Інжектується лише якщо змінна ще не встановлена в процесі.
</ParamField>
<ParamField path="config" type="object">
  Необов’язковий контейнер для користувацьких полів окремого skill. Користувацькі ключі мають розміщуватися тут.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Необов’язковий список дозволу лише для **вбудованих** skills. Якщо задано, доступними будуть лише вбудовані skills зі списку (managed/workspace skills не зачіпаються).
</ParamField>

Якщо назва skill містить дефіси, беріть ключ у лапки (JSON5 дозволяє ключі
в лапках). Ключі конфігурації за замовчуванням відповідають **назві skill** — якщо skill
визначає `metadata.openclaw.skillKey`, використовуйте цей ключ у `skills.entries`.

<Note>
Для стандартного генерування/редагування зображень усередині OpenClaw використовуйте основний
інструмент `image_generate` разом із `agents.defaults.imageGenerationModel` замість
вбудованого skill. Приклади skills тут наведені для користувацьких або сторонніх
робочих процесів. Для нативного аналізу зображень використовуйте інструмент `image` з
`agents.defaults.imageModel`. Якщо ви вибираєте `openai/*`, `google/*`,
`fal/*` або іншу модель зображень, специфічну для провайдера, також додайте
автентифікацію/API key цього провайдера.
</Note>

## Інжекція середовища

Коли запускається робота агента, OpenClaw:

1. Зчитує metadata skill.
2. Застосовує `skills.entries.<key>.env` і `skills.entries.<key>.apiKey` до `process.env`.
3. Будує системний prompt з **доступними** skills.
4. Відновлює початкове середовище після завершення запуску.

Інжекція середовища **обмежена запуском агента**, а не є глобальним shell-середовищем.

Для вбудованого бекенда `claude-cli` OpenClaw також матеріалізує той самий
доступний знімок як тимчасовий plugin Claude Code і передає його через
`--plugin-dir`. Тоді Claude Code може використовувати власний нативний resolver skills, тоді як
OpenClaw і далі контролює пріоритет, списки дозволів для окремих агентів, гейтінг і
інжекцію env/API key через `skills.entries.*`. Інші CLI-бекенди використовують лише каталог prompt.

## Знімки та оновлення

OpenClaw створює знімок доступних skills **на початку сесії** і
повторно використовує цей список для наступних ходів у тій самій сесії. Зміни в
skills або config набирають чинності в наступній новій сесії.

Skills можуть оновлюватися посеред сесії у двох випадках:

- Увімкнено спостерігач skills.
- З’являється новий доступний віддалений Node.

Сприймайте це як **гаряче перезавантаження**: оновлений список підхоплюється на
наступному ході агента. Якщо ефективний список дозволених skills агента змінюється для
цієї сесії, OpenClaw оновлює знімок, щоб видимі skills залишалися узгодженими
з поточним агентом.

### Спостерігач skills

За замовчуванням OpenClaw стежить за теками skills і оновлює знімок skills,
коли змінюються файли `SKILL.md`. Налаштовується в `skills.load`:

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

### Віддалені вузли macOS (Linux gateway)

Якщо Gateway працює на Linux, але підключено **вузол macOS** з дозволеним
`system.run` (налаштування безпеки Exec approvals не встановлено на `deny`),
OpenClaw може вважати skills лише для macOS доступними, якщо потрібні
бінарні файли присутні на цьому вузлі. Агент має виконувати такі skills
через інструмент `exec` з `host=node`.

Це спирається на те, що вузол повідомляє про підтримку команд і на перевірку
бінарних файлів через `system.which` або `system.run`. Вузли, що перебувають офлайн, **не** роблять
доступними skills, які можна виконувати лише віддалено. Якщо підключений вузол перестає відповідати на перевірки бінарних файлів, OpenClaw очищує кешовані збіги бінарних файлів, щоб агенти більше не бачили skills, які наразі не можна там виконати.

## Вплив на токени

Коли skills доступні, OpenClaw інжектує компактний XML-список доступних
skills у системний prompt (через `formatSkillsForPrompt` у
`pi-coding-agent`). Вартість детермінована:

- **Базові накладні витрати** (лише коли ≥1 skill): 195 символів.
- **На кожен skill:** 97 символів + довжина значень `<name>`, `<description>` і `<location>`, екранованих для XML.

Формула (символи):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-екранування розширює `& < > " '` до сутностей (`&amp;`, `&lt;` тощо),
збільшуючи довжину. Кількість токенів залежить від токенізатора моделі. Груба
оцінка в стилі OpenAI — приблизно 4 символи на токен, тому **97 символів ≈ 24 токени** на
кожен skill плюс фактична довжина ваших полів.

## Життєвий цикл керованих skills

OpenClaw постачає базовий набір skills як **вбудовані skills** разом з
установкою (npm package або OpenClaw.app). `~/.openclaw/skills` існує для
локальних перевизначень — наприклад, щоб зафіксувати версію або виправити skill без
зміни вбудованої копії. Skills workspace належать користувачу й перевизначають
обидва варіанти у разі конфлікту назв.

## Шукаєте більше skills?

Перегляньте [https://clawhub.ai](https://clawhub.ai). Повна схема
конфігурації: [Конфігурація Skills](/uk/tools/skills-config).

## Пов’язане

- [ClawHub](/uk/tools/clawhub) — публічний реєстр skills
- [Створення skills](/uk/tools/creating-skills) — створення користувацьких skills
- [Plugins](/uk/tools/plugin) — огляд системи plugin
- [plugin Skill Workshop](/uk/plugins/skill-workshop) — генерування skills з роботи агента
- [Конфігурація Skills](/uk/tools/skills-config) — довідник з конфігурації skills
- [Slash-команди](/uk/tools/slash-commands) — усі доступні slash-команди
