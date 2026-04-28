---
read_when:
    - Додавання або змінювання Skills
    - Зміна обмежень Skills, списків дозволених елементів або правил завантаження
    - Розуміння пріоритетності Skills і поведінки знімків
sidebarTitle: Skills
summary: 'Skills: керовані й робочого простору, правила допуску, списки дозволених агентів і підключення конфігурації'
title: Skills
x-i18n:
    generated_at: "2026-04-28T11:28:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 847de67a57a364e74a4c0878b08b870eb17f03aac7fe98bc88e4e2d79261a698
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw використовує папки навичок, **сумісні з [AgentSkills](https://agentskills.io)**, щоб навчити агента користуватися інструментами. Кожна навичка — це каталог, що містить `SKILL.md` з YAML frontmatter та інструкціями. OpenClaw завантажує вбудовані навички й додаткові локальні перевизначення та фільтрує їх під час завантаження на основі середовища, конфігурації та наявності бінарних файлів.

## Розташування та пріоритет

OpenClaw завантажує навички з цих джерел, **від найвищого пріоритету до найнижчого**:

| #   | Джерело                         | Шлях                             |
| --- | ------------------------------- | -------------------------------- |
| 1   | Навички робочого простору       | `<workspace>/skills`             |
| 2   | Навички агента проєкту          | `<workspace>/.agents/skills`     |
| 3   | Особисті навички агента         | `~/.agents/skills`               |
| 4   | Керовані/локальні навички       | `~/.openclaw/skills`             |
| 5   | Вбудовані навички               | постачаються з інсталяцією       |
| 6   | Додаткові папки навичок         | `skills.load.extraDirs` (конфігурація) |

Якщо назва навички конфліктує, перемагає джерело з найвищим пріоритетом.

## Навички окремого агента та спільні навички

У налаштуваннях із **кількома агентами** кожен агент має власний робочий простір:

| Область                      | Шлях                                        | Видимо для                         |
| ---------------------------- | ------------------------------------------- | ---------------------------------- |
| Окремий агент                | `<workspace>/skills`                        | Лише цього агента                  |
| Агент проєкту                | `<workspace>/.agents/skills`                | Лише агента цього робочого простору |
| Особистий агент              | `~/.agents/skills`                          | Усіх агентів на цій машині         |
| Спільні керовані/локальні    | `~/.openclaw/skills`                        | Усіх агентів на цій машині         |
| Спільні додаткові каталоги   | `skills.load.extraDirs` (найнижчий пріоритет) | Усіх агентів на цій машині       |

Однакова назва в кількох місцях → перемагає джерело з найвищим пріоритетом. Робочий простір має перевагу над
агентом проєкту, той — над особистим агентом, той — над керованими/локальними, ті — над вбудованими,
а вбудовані — над додатковими каталогами.

## Списки дозволених навичок агента

**Розташування** навички та **видимість** навички — це окремі елементи керування.
Розташування/пріоритет визначає, яка копія навички з однаковою назвою перемагає; списки дозволених навичок агента визначають, які навички агент фактично може використовувати.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Правила списку дозволених навичок">
    - Не вказуйте `agents.defaults.skills`, щоб навички за замовчуванням були необмежені.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати `agents.defaults.skills`.
    - Установіть `agents.list[].skills: []`, щоб навички були відсутні.
    - Непорожній список `agents.list[].skills` є **остаточним** набором для цього
      агента — він не об'єднується зі стандартними значеннями.
    - Ефективний список дозволених навичок застосовується до побудови підказки, виявлення
      slash-команд навичок, синхронізації sandbox і знімків навичок.
  </Accordion>
</AccordionGroup>

## Plugins і навички

Plugins можуть постачати власні навички, перелічуючи каталоги `skills` у
`openclaw.plugin.json` (шляхи відносно кореня Plugin). Навички Plugin
завантажуються, коли Plugin увімкнено. Це правильне місце для
робочих інструкцій, специфічних для інструмента, які надто довгі для опису інструмента, але мають бути
доступні щоразу, коли Plugin інстальовано — наприклад, браузерний
Plugin постачає навичку `browser-automation` для багатоетапного керування браузером.

Каталоги навичок Plugin об'єднуються в той самий шлях із низьким пріоритетом, що й
`skills.load.extraDirs`, тому вбудована, керована, агентська або
робочо-просторова навичка з такою самою назвою перевизначає їх. Ви можете обмежувати їх через
`metadata.openclaw.requires.config` у записі конфігурації Plugin.

Див. [Plugins](/uk/tools/plugin) для виявлення/конфігурації та [Інструменти](/uk/tools) для
поверхні інструментів, які ці навички пояснюють.

## Skill Workshop

Додатковий експериментальний Plugin **Skill Workshop** може створювати або оновлювати
навички робочого простору на основі багаторазових процедур, помічених під час роботи агента. Він
вимкнений за замовчуванням і має бути явно ввімкнений через
`plugins.entries.skill-workshop`.

Skill Workshop записує лише до `<workspace>/skills`, сканує згенерований
вміст, підтримує очікування схвалення або автоматичні безпечні записи, ізолює
небезпечні пропозиції та оновлює знімок навичок після успішних
записів, щоб нові навички ставали доступними без перезапуску Gateway.

Використовуйте його для виправлень на кшталт _"наступного разу перевірити атрибуцію GIF"_ або
набутих складних робочих процесів, як-от контрольні списки QA для медіа. Почніть з очікування
схвалення; використовуйте автоматичні записи лише в довірених робочих просторах після перегляду
його пропозицій. Повний посібник: [Plugin Skill Workshop](/uk/plugins/skill-workshop).

## ClawHub (інсталяція та синхронізація)

[ClawHub](https://clawhub.ai) — це публічний реєстр навичок для OpenClaw.
Використовуйте нативні команди `openclaw skills` для виявлення/інсталяції/оновлення або
окремий CLI `clawhub` для робочих процесів публікації/синхронізації. Повний посібник:
[ClawHub](/uk/tools/clawhub).

| Дія                                      | Команда                                |
| ---------------------------------------- | -------------------------------------- |
| Інсталювати навичку в робочий простір    | `openclaw skills install <skill-slug>` |
| Оновити всі інстальовані навички         | `openclaw skills update --all`         |
| Синхронізувати (сканування + публікація оновлень) | `clawhub sync --all`          |

Нативна команда `openclaw skills install` інсталює в каталог активного робочого простору
`skills/`. Окремий CLI `clawhub` також інсталює в
`./skills` у вашому поточному робочому каталозі (або повертається до
налаштованого робочого простору OpenClaw). OpenClaw підхоплює це як
`<workspace>/skills` під час наступної сесії.

## Безпека

<Warning>
Ставтеся до сторонніх навичок як до **ненадійного коду**. Прочитайте їх перед увімкненням.
Віддавайте перевагу sandbox-запускам для ненадійних вхідних даних і ризикованих інструментів. Див.
[Sandboxing](/uk/gateway/sandboxing) для елементів керування на боці агента.
</Warning>

- Виявлення навичок у робочому просторі та додаткових каталогах приймає лише корені навичок і файли `SKILL.md`, чий розв'язаний realpath залишається всередині налаштованого кореня.
- Інсталяції залежностей навичок через Gateway (`skills.install`, onboarding і UI налаштувань Skills) запускають вбудований сканер небезпечного коду перед виконанням метаданих інсталятора. Знахідки `critical` блокуються за замовчуванням, якщо викликач явно не встановить небезпечне перевизначення; підозрілі знахідки все одно лише попереджають.
- `openclaw skills install <slug>` відрізняється — вона завантажує папку навички ClawHub у робочий простір і не використовує шлях метаданих інсталятора вище.
- `skills.entries.*.env` і `skills.entries.*.apiKey` ін'єктують секрети в процес **хоста** для цього ходу агента (не в sandbox). Не допускайте потрапляння секретів у підказки й журнали.

Для ширшої моделі загроз і контрольних списків див. [Безпека](/uk/gateway/security).

## Формат SKILL.md

`SKILL.md` має містити принаймні:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw дотримується специфікації AgentSkills щодо структури/наміру. Парсер, який використовує
вбудований агент, підтримує лише **однорядкові** ключі frontmatter;
`metadata` має бути **однорядковим JSON-об'єктом**. Використовуйте `{baseDir}` в
інструкціях, щоб посилатися на шлях папки навички.

### Додаткові ключі frontmatter

<ParamField path="homepage" type="string">
  URL, що відображається як "Website" в UI macOS Skills. Також підтримується через `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Коли `true`, навичка показується як користувацька slash-команда.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Коли `true`, навичка виключається з підказки моделі (досі доступна через користувацький виклик).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Коли встановлено `tool`, slash-команда обходить модель і передається безпосередньо інструменту.
</ParamField>
<ParamField path="command-tool" type="string">
  Назва інструмента для виклику, коли встановлено `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Для передавання інструменту пересилає сирий рядок аргументів до інструмента (без парсингу ядром). Інструмент викликається з `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Обмеження (фільтри під час завантаження)

OpenClaw фільтрує навички під час завантаження за допомогою `metadata` (однорядковий JSON):

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
  Коли `true`, завжди включати навичку (пропустити інші обмеження).
</ParamField>
<ParamField path="emoji" type="string">
  Додатковий emoji, який використовує UI macOS Skills.
</ParamField>
<ParamField path="homepage" type="string">
  Додатковий URL, що показується як "Website" в UI macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Додатковий список платформ. Якщо встановлено, навичка придатна лише на цих OS.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Кожен має існувати в `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Принаймні один має існувати в `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Змінна середовища має існувати або бути надана в конфігурації.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Список шляхів `openclaw.json`, які мають бути truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Назва змінної середовища, пов'язаної з `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Додаткові специфікації інсталятора, які використовує UI macOS Skills (brew/node/go/uv/download).
</ParamField>

Якщо `metadata.openclaw` відсутній, навичка завжди придатна (якщо її не
вимкнено в конфігурації або не заблоковано `skills.allowBundled` для вбудованих навичок).

<Note>
Застарілі блоки `metadata.clawdbot` досі приймаються, коли
`metadata.openclaw` відсутній, тому старіші інстальовані навички зберігають свої
обмеження залежностей і підказки інсталятора. Нові та оновлені навички мають використовувати
`metadata.openclaw`.
</Note>

### Примітки щодо Sandboxing

- `requires.bins` перевіряється на **хості** під час завантаження навички.
- Якщо агент працює в sandbox, бінарний файл також має існувати **всередині контейнера**. Інсталюйте його через `agents.defaults.sandbox.docker.setupCommand` (або власний образ). `setupCommand` запускається один раз після створення контейнера. Інсталяції пакетів також потребують вихідного мережевого доступу, кореневої FS із правом запису та користувача root у sandbox.
- Приклад: навичці `summarize` (`skills/summarize/SKILL.md`) потрібен CLI `summarize` у контейнері sandbox, щоб запускатися там.

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
    - Якщо вказано кілька інсталяторів, gateway вибирає один пріоритетний варіант (brew, коли доступний, інакше node).
    - Якщо всі інсталятори мають тип `download`, OpenClaw перелічує кожен запис, щоб ви могли бачити доступні артефакти.
    - Специфікації інсталяторів можуть містити `os: ["darwin"|"linux"|"win32"]`, щоб фільтрувати варіанти за платформою.
    - Інсталяції Node враховують `skills.install.nodeManager` в `openclaw.json` (за замовчуванням: npm; варіанти: npm/pnpm/yarn/bun). Це впливає лише на інсталяції skill; середовище виконання Gateway усе одно має бути Node — Bun не рекомендовано для WhatsApp/Telegram.
    - Вибір інсталятора на базі Gateway керується пріоритетами: коли специфікації інсталяції змішують типи, OpenClaw надає перевагу Homebrew, якщо ввімкнено `skills.install.preferBrew` і існує `brew`, потім `uv`, потім налаштованому менеджеру node, потім іншим резервним варіантам, як-от `go` або `download`.
    - Якщо кожна специфікація інсталяції має тип `download`, OpenClaw показує всі варіанти завантаження замість зведення до одного пріоритетного інсталятора.

  </Accordion>
  <Accordion title="Відомості для кожного інсталятора">
    - **Інсталяції Go:** якщо `go` відсутній, а `brew` доступний, gateway спочатку інсталює Go через Homebrew і, коли можливо, встановлює `GOBIN` на `bin` Homebrew.
    - **Інсталяції завантаженням:** `url` (обов’язково), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (за замовчуванням: автоматично, коли виявлено архів), `stripComponents`, `targetDir` (за замовчуванням: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Перевизначення конфігурації

Bundled і керовані skills можна вмикати або вимикати й надавати їм значення env
у `skills.entries` в `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
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
  `false` вимикає skill, навіть якщо його bundled або інстальовано.
  Bundled skill `coding-agent` вмикається явно: задайте
  `skills.entries.coding-agent.enabled: true`, перш ніж відкривати його агентам,
  а потім переконайтеся, що один із `claude`, `codex`, `opencode` або `pi` інстальовано й
  автентифіковано для власного CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Зручний спосіб для skills, які оголошують `metadata.openclaw.primaryEnv`. Підтримує відкритий текст або SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Впроваджується лише тоді, коли змінну ще не задано в процесі.
</ParamField>
<ParamField path="config" type="object">
  Необов’язковий контейнер для власних полів конкретного skill. Власні ключі мають бути тут.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Необов’язковий allowlist лише для **bundled** skills. Якщо задано, придатними є тільки bundled skills зі списку (керовані/workspace skills не зачіпаються).
</ParamField>

Якщо назва skill містить дефіси, візьміть ключ у лапки (JSON5 дозволяє ключі
в лапках). Ключі конфігурації за замовчуванням відповідають **назві skill** — якщо skill
визначає `metadata.openclaw.skillKey`, використовуйте цей ключ у `skills.entries`.

<Note>
Для стандартної генерації/редагування зображень в OpenClaw використовуйте основний
інструмент `image_generate` з `agents.defaults.imageGenerationModel` замість
bundled skill. Приклади skills тут призначені для власних або сторонніх
робочих процесів. Для нативного аналізу зображень використовуйте інструмент `image` з
`agents.defaults.imageModel`. Якщо ви вибираєте `openai/*`, `google/*`,
`fal/*` або іншу provider-specific модель зображень, також додайте
auth/API key цього provider.
</Note>

## Впровадження середовища

Коли запускається виконання агента, OpenClaw:

1. Читає метадані skill.
2. Застосовує `skills.entries.<key>.env` і `skills.entries.<key>.apiKey` до `process.env`.
3. Формує системний prompt з **придатними** skills.
4. Відновлює початкове середовище після завершення виконання.

Впровадження середовища **обмежене виконанням агента**, а не глобальним shell
середовищем.

Для bundled бекенда `claude-cli` OpenClaw також матеріалізує той самий
придатний snapshot як тимчасовий Plugin Claude Code і передає його з
`--plugin-dir`. Claude Code потім може використовувати власний розпізнавач skill, тоді як
OpenClaw усе ще керує пріоритетами, per-agent allowlists, gating і
впровадженням env/API key через `skills.entries.*`. Інші CLI бекенди використовують лише
prompt-каталог.

## Snapshots і оновлення

OpenClaw створює snapshots придатних skills **коли починається сесія** і
повторно використовує цей список для наступних ходів у тій самій сесії. Зміни
skills або конфігурації набирають чинності в наступній новій сесії.

Skills можуть оновлюватися всередині сесії у двох випадках:

- Увімкнено watcher skills.
- З’являється новий придатний віддалений node.

Сприймайте це як **гаряче перезавантаження**: оновлений список підхоплюється на
наступному ході агента. Якщо ефективний allowlist skills агента змінюється для цієї
сесії, OpenClaw оновлює snapshot, щоб видимі skills залишалися узгодженими
з поточним агентом.

### Watcher skills

За замовчуванням OpenClaw стежить за папками skills і оновлює snapshot skills,
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

### Віддалені macOS nodes (Linux gateway)

Якщо Gateway працює на Linux, але під’єднано **macOS node** з дозволеним
`system.run` (захист Exec approvals не встановлено на `deny`),
OpenClaw може вважати macOS-only skills придатними, коли потрібні
бінарні файли наявні на цьому node. Агент має виконувати ці skills
через інструмент `exec` з `host=node`.

Це залежить від того, що node повідомляє про підтримку команд, і від перевірки bin
через `system.which` або `system.run`. Offline nodes **не** роблять
remote-only skills видимими. Якщо під’єднаний node припиняє відповідати на bin
probes, OpenClaw очищає кешовані bin matches, щоб агенти більше не бачили
skills, які наразі не можуть там виконуватися.

## Вплив на токени

Коли skills придатні, OpenClaw впроваджує компактний XML-список доступних
skills у системний prompt (через `formatSkillsForPrompt` у
`pi-coding-agent`). Вартість є детермінованою:

- **Базові накладні витрати** (лише коли є ≥1 skill): 195 символів.
- **На skill:** 97 символів + довжина XML-escaped значень `<name>`, `<description>` і `<location>`.

Формула (символи):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML escaping розгортає `& < > " '` у сутності (`&amp;`, `&lt;` тощо),
збільшуючи довжину. Кількість токенів залежить від tokenizer моделі. Приблизна
оцінка у стилі OpenAI — ~4 символи/токен, тож **97 символів ≈ 24 токени** на
skill плюс фактичні довжини ваших полів.

## Життєвий цикл керованих skills

OpenClaw постачає базовий набір skills як **bundled skills** разом з
інсталяцією (npm package або OpenClaw.app). `~/.openclaw/skills` існує для
локальних перевизначень — наприклад, щоб закріпити або виправити skill без
зміни bundled копії. Workspace skills належать користувачу й перевизначають
обидва варіанти у разі конфліктів назв.

## Шукаєте більше skills?

Перегляньте [https://clawhub.ai](https://clawhub.ai). Повна схема
конфігурації: [Конфігурація Skills](/uk/tools/skills-config).

## Пов’язане

- [ClawHub](/uk/tools/clawhub) — публічний реєстр skills
- [Створення skills](/uk/tools/creating-skills) — побудова власних skills
- [Plugins](/uk/tools/plugin) — огляд системи plugin
- [Plugin Skill Workshop](/uk/plugins/skill-workshop) — генерування skills на основі роботи агента
- [Конфігурація Skills](/uk/tools/skills-config) — довідник з конфігурації skill
- [Slash-команди](/uk/tools/slash-commands) — усі доступні slash-команди
