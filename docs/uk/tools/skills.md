---
read_when:
    - Додавання або змінення Skills
    - Зміна контролю доступу до навичок, списків дозволених або правил завантаження
    - Розуміння пріоритетності Skills і поведінки знімків
sidebarTitle: Skills
summary: 'Skills: керовані та робочої області, правила шлюзування, списки дозволених агентів і зв’язування конфігурації'
title: Skills
x-i18n:
    generated_at: "2026-05-02T18:58:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw використовує **сумісні з [AgentSkills](https://agentskills.io)** папки навичок, щоб навчити агента користуватися інструментами. Кожна навичка — це директорія, що містить `SKILL.md` з YAML frontmatter та інструкціями. OpenClaw завантажує вбудовані навички разом із необов’язковими локальними перевизначеннями та фільтрує їх під час завантаження на основі середовища, конфігурації та наявності бінарних файлів.

## Розташування та пріоритет

OpenClaw завантажує навички з цих джерел, **від найвищого пріоритету до найнижчого**:

| #   | Джерело                       | Шлях                             |
| --- | ----------------------------- | -------------------------------- |
| 1   | Навички робочої області       | `<workspace>/skills`             |
| 2   | Навички агента проєкту        | `<workspace>/.agents/skills`     |
| 3   | Особисті навички агента       | `~/.agents/skills`               |
| 4   | Керовані/локальні навички     | `~/.openclaw/skills`             |
| 5   | Вбудовані навички             | постачаються з інсталяцією       |
| 6   | Додаткові папки навичок       | `skills.load.extraDirs` (конфігурація) |

Якщо назва навички конфліктує, перемагає джерело з найвищим пріоритетом.

Нативна директорія Codex CLI `$CODEX_HOME/skills` не є одним із коренів навичок OpenClaw. У режимі Codex harness локальні запуски app-server використовують ізольовані домівки Codex для кожного агента, тому особисті навички Codex CLI не завантажуються неявно. Використайте `openclaw migrate codex --dry-run`, щоб інвентаризувати їх, і `openclaw migrate codex`, щоб вибрати директорії навичок через інтерактивний запит із прапорцями перед копіюванням їх у поточну робочу область агента OpenClaw. Для неінтерактивних запусків повторюйте `--skill <name>` для точних навичок, які потрібно скопіювати.

## Навички для окремого агента й спільні навички

У налаштуваннях із **кількома агентами** кожен агент має власну робочу область:

| Область                       | Шлях                                        | Видима для                          |
| ----------------------------- | ------------------------------------------- | ----------------------------------- |
| Для окремого агента           | `<workspace>/skills`                        | Лише цього агента                   |
| Агент проєкту                 | `<workspace>/.agents/skills`                | Лише агента цієї робочої області    |
| Особистий агент               | `~/.agents/skills`                          | Усіх агентів на цій машині          |
| Спільні керовані/локальні     | `~/.openclaw/skills`                        | Усіх агентів на цій машині          |
| Спільні додаткові директорії  | `skills.load.extraDirs` (найнижчий пріоритет) | Усіх агентів на цій машині        |

Однакова назва в кількох місцях → перемагає джерело з найвищим пріоритетом. Робоча область має вищий пріоритет за агента проєкту, той — за особистого агента, той — за керовані/локальні, ті — за вбудовані, а ті — за додаткові директорії.

## Списки дозволених навичок агента

**Розташування** навички та **видимість** навички — це окремі елементи керування. Розташування/пріоритет визначає, яка копія однойменної навички перемагає; списки дозволених для агента визначають, які навички агент фактично може використовувати.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює defaults
      { id: "locked-down", skills: [] }, // без навичок
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Правила списку дозволеного">
    - Не вказуйте `agents.defaults.skills`, щоб навички за замовчуванням були необмеженими.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати `agents.defaults.skills`.
    - Встановіть `agents.list[].skills: []`, щоб не було жодних навичок.
    - Непорожній список `agents.list[].skills` є **остаточним** набором для цього агента — він не об’єднується з defaults.
    - Ефективний список дозволеного застосовується під час побудови промпта, виявлення slash-команд навичок, синхронізації sandbox та знімків навичок.
  </Accordion>
</AccordionGroup>

## Плагіни та навички

Плагіни можуть постачати власні навички, перелічуючи директорії `skills` в `openclaw.plugin.json` (шляхи відносно кореня Plugin). Навички Plugin завантажуються, коли Plugin увімкнено. Це правильне місце для інструкцій із роботи з конкретними інструментами, які надто довгі для опису інструмента, але мають бути доступні щоразу, коли Plugin встановлено — наприклад, браузерний Plugin постачає навичку `browser-automation` для багатокрокового керування браузером.

Директорії навичок Plugin об’єднуються в той самий шлях із низьким пріоритетом, що й `skills.load.extraDirs`, тому однойменна вбудована, керована, агентська навичка або навичка робочої області перевизначає їх. Ви можете обмежити їх через `metadata.openclaw.requires.config` у конфігураційному записі Plugin.

Див. [Плагіни](/uk/tools/plugin) для виявлення/конфігурації та [Інструменти](/uk/tools) для поверхні інструментів, якої навчають ці навички.

## Skill Workshop

Необов’язковий експериментальний Plugin **Skill Workshop** може створювати або оновлювати навички робочої області з багаторазових процедур, спостережених під час роботи агента. Він вимкнений за замовчуванням і має бути явно ввімкнений через `plugins.entries.skill-workshop`.

Skill Workshop записує лише до `<workspace>/skills`, сканує згенерований вміст, підтримує очікування затвердження або автоматичні безпечні записи, поміщає небезпечні пропозиції в карантин і оновлює знімок навичок після успішних записів, щоб нові навички стали доступними без перезапуску Gateway.

Використовуйте його для виправлень на кшталт _"наступного разу перевірити атрибуцію GIF"_ або складно здобутих робочих процесів, як-от чеклісти QA для медіа. Почніть з очікування затвердження; використовуйте автоматичні записи лише в довірених робочих областях після перегляду його пропозицій. Повний посібник: [Plugin Skill Workshop](/uk/plugins/skill-workshop).

## ClawHub (інсталяція та синхронізація)

[ClawHub](https://clawhub.ai) — це публічний реєстр навичок для OpenClaw. Використовуйте нативні команди `openclaw skills` для пошуку/інсталяції/оновлення або окремий CLI `clawhub` для робочих процесів публікації/синхронізації. Повний посібник: [ClawHub](/uk/tools/clawhub).

| Дія                                      | Команда                                |
| ---------------------------------------- | -------------------------------------- |
| Встановити навичку в робочу область      | `openclaw skills install <skill-slug>` |
| Оновити всі встановлені навички          | `openclaw skills update --all`         |
| Синхронізувати (сканувати + опублікувати оновлення) | `clawhub sync --all`          |

Нативна команда `openclaw skills install` встановлює в директорію `skills/` активної робочої області. Окремий CLI `clawhub` також встановлює в `./skills` у вашій поточній робочій директорії (або повертається до налаштованої робочої області OpenClaw). OpenClaw підхоплює це як `<workspace>/skills` у наступній сесії. Налаштовані корені навичок також підтримують один рівень групування, наприклад `skills/<group>/<skill>/SKILL.md`, тож пов’язані сторонні навички можна тримати у спільній папці без широкого рекурсивного сканування.

Сторінки навичок ClawHub показують найновіший стан безпекового сканування перед інсталяцією, зі сторінками деталей сканерів для VirusTotal, ClawScan і статичного аналізу. `openclaw skills install <slug>` залишається лише шляхом інсталяції; видавці усувають хибнопозитивні спрацювання через панель ClawHub або `clawhub skill rescan <slug>`.

## Безпека

<Warning>
Ставтеся до сторонніх навичок як до **ненадійного коду**. Прочитайте їх перед увімкненням. Для ненадійних вхідних даних і ризикованих інструментів віддавайте перевагу sandbox-запускам. Див. [Sandboxing](/uk/gateway/sandboxing) для елементів керування з боку агента.
</Warning>

- Виявлення навичок робочої області та extra-dir приймає лише корені навичок і файли `SKILL.md`, чий розв’язаний realpath залишається всередині налаштованого кореня.
- Встановлення залежностей навичок через Gateway (`skills.install`, onboarding і UI налаштувань Skills) запускають вбудований сканер небезпечного коду перед виконанням метаданих інсталятора. Знахідки `critical` блокуються за замовчуванням, якщо викликач явно не встановив небезпечне перевизначення; підозрілі знахідки все ще лише попереджають.
- `openclaw skills install <slug>` відрізняється — він завантажує папку навички ClawHub у робочу область і не використовує наведений вище шлях метаданих інсталятора.
- `skills.entries.*.env` і `skills.entries.*.apiKey` інжектують секрети в **host**-процес для цього ходу агента (не в sandbox). Не допускайте потрапляння секретів у промпти й журнали.

Для ширшої моделі загроз і чеклістів див. [Безпека](/uk/gateway/security).

## Формат SKILL.md

`SKILL.md` має містити щонайменше:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw дотримується специфікації AgentSkills щодо компонування/наміру. Парсер, який використовується вбудованим агентом, підтримує лише **однорядкові** ключі frontmatter; `metadata` має бути **однорядковим JSON-об’єктом**. Використовуйте `{baseDir}` в інструкціях, щоб посилатися на шлях папки навички.

### Необов’язкові ключі frontmatter

<ParamField path="homepage" type="string">
  URL, що відображається як "Вебсайт" в UI macOS Skills. Також підтримується через `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Коли `true`, навичка показується як користувацька slash-команда.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Коли `true`, OpenClaw не додає інструкції навички до звичайного промпта агента. Навичка все одно встановлена й усе ще може бути явно запущена як slash-команда, коли `user-invocable` також має значення `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Коли встановлено `tool`, slash-команда оминає модель і спрямовується безпосередньо до інструмента.
</ParamField>
<ParamField path="command-tool" type="string">
  Назва інструмента, який потрібно викликати, коли встановлено `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Для спрямування до інструмента передає сирий рядок аргументів інструменту (без парсингу ядром). Інструмент викликається з `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
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
  Коли `true`, завжди включати навичку (пропускати інші обмеження).
</ParamField>
<ParamField path="emoji" type="string">
  Необов’язковий emoji, який використовується UI macOS Skills.
</ParamField>
<ParamField path="homepage" type="string">
  Необов’язковий URL, що показується як "Вебсайт" в UI macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Необов’язковий список платформ. Якщо задано, навичка придатна лише на цих ОС.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Кожен має існувати в `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Принаймні один має існувати в `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Змінна середовища має існувати або бути наданою в конфігурації.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Список шляхів `openclaw.json`, які мають бути truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Назва змінної середовища, пов’язаної з `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Необов’язкові специфікації інсталятора, які використовуються UI macOS Skills (brew/node/go/uv/download).
</ParamField>

Якщо `metadata.openclaw` відсутній, навичка завжди придатна (якщо її не вимкнено в конфігурації або не заблоковано `skills.allowBundled` для вбудованих навичок).

<Note>
Застарілі блоки `metadata.clawdbot` усе ще приймаються, коли `metadata.openclaw` відсутній, тож старіші встановлені навички зберігають свої обмеження залежностей і підказки інсталятора. Нові й оновлені навички мають використовувати `metadata.openclaw`.
</Note>

### Примітки щодо sandbox

- `requires.bins` перевіряється на **host** під час завантаження навички.
- Якщо агент працює в sandbox, бінарний файл також має існувати **всередині контейнера**. Встановіть його через `agents.defaults.sandbox.docker.setupCommand` (або користувацький образ). `setupCommand` запускається один раз після створення контейнера. Встановлення пакетів також потребують мережевого виходу, записуваної кореневої FS і користувача root у sandbox.
- Приклад: навичці `summarize` (`skills/summarize/SKILL.md`) потрібен CLI `summarize` у sandbox-контейнері, щоб працювати там.

### Специфікації інсталяторів

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
    - Якщо вказано кілька інсталяторів, gateway вибирає один пріоритетний варіант (brew, якщо доступний, інакше node).
    - Якщо всі інсталятори мають тип `download`, OpenClaw показує кожен запис, щоб ви могли бачити доступні артефакти.
    - Специфікації інсталятора можуть містити `os: ["darwin"|"linux"|"win32"]`, щоб фільтрувати варіанти за платформою.
    - Інсталяції Node враховують `skills.install.nodeManager` в `openclaw.json` (типово: npm; варіанти: npm/pnpm/yarn/bun). Це впливає лише на встановлення Skills; середовище виконання Gateway усе одно має бути Node — Bun не рекомендовано для WhatsApp/Telegram.
    - Вибір інсталятора через Gateway керується пріоритетами: коли специфікації інсталяції змішують типи, OpenClaw віддає перевагу Homebrew, якщо `skills.install.preferBrew` увімкнено і `brew` існує, потім `uv`, потім налаштованому менеджеру node, потім іншим резервним варіантам на кшталт `go` або `download`.
    - Якщо кожна специфікація інсталяції має тип `download`, OpenClaw показує всі варіанти завантаження замість згортання до одного пріоритетного інсталятора.

  </Accordion>
  <Accordion title="Деталі для кожного інсталятора">
    - **Інсталяції Go:** якщо `go` відсутній, а `brew` доступний, gateway спочатку встановлює Go через Homebrew і, коли можливо, задає `GOBIN` як `bin` Homebrew.
    - **Інсталяції завантаженням:** `url` (обов’язково), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (типово: автоматично, коли виявлено архів), `stripComponents`, `targetDir` (типово: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Перевизначення конфігурації

Bundled і керовані Skills можна вмикати або вимикати та передавати їм значення env
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
  `false` вимикає skill, навіть якщо він bundled або встановлений.
  Bundled skill `coding-agent` є opt-in: задайте
  `skills.entries.coding-agent.enabled: true`, перш ніж показувати його агентам,
  а потім переконайтеся, що один із `claude`, `codex`, `opencode` або `pi` встановлений і
  автентифікований для власного CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Зручний параметр для Skills, які оголошують `metadata.openclaw.primaryEnv`. Підтримує відкритий текст або SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Впроваджується лише якщо змінна ще не задана в процесі.
</ParamField>
<ParamField path="config" type="object">
  Необов’язковий контейнер для власних полів окремого skill. Власні ключі мають розміщуватися тут.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Необов’язковий allowlist лише для **bundled** Skills. Якщо задано, придатними є лише bundled Skills зі списку (керовані/workspace Skills не зачіпаються).
</ParamField>

Якщо назва skill містить дефіси, візьміть ключ у лапки (JSON5 дозволяє ключі
в лапках). Ключі конфігурації типово відповідають **назві skill** — якщо skill
визначає `metadata.openclaw.skillKey`, використовуйте цей ключ у `skills.entries`.

<Note>
Для стандартної генерації/редагування зображень усередині OpenClaw використовуйте основний
інструмент `image_generate` з `agents.defaults.imageGenerationModel` замість
bundled skill. Приклади Skills тут призначені для власних або сторонніх
workflow. Для нативного аналізу зображень використовуйте інструмент `image` з
`agents.defaults.imageModel`. Якщо ви вибираєте `openai/*`, `google/*`,
`fal/*` або іншу модель зображень, специфічну для провайдера, також додайте
ключ автентифікації/API цього провайдера.
</Note>

## Впровадження середовища

Коли запускається виконання агента, OpenClaw:

1. Читає метадані skill.
2. Застосовує `skills.entries.<key>.env` і `skills.entries.<key>.apiKey` до `process.env`.
3. Будує системний prompt із **придатними** Skills.
4. Відновлює початкове середовище після завершення виконання.

Впровадження середовища **обмежене виконанням агента**, а не глобальним
середовищем shell.

Для bundled бекенда `claude-cli` OpenClaw також матеріалізує той самий
придатний знімок як тимчасовий Plugin Claude Code і передає його з
`--plugin-dir`. Claude Code після цього може використовувати свій нативний resolver Skills, тоді як
OpenClaw і далі керує пріоритетом, allowlist для кожного агента, gating і
впровадженням env/API-ключів `skills.entries.*`. Інші CLI-бекенди використовують
лише каталог prompt.

## Знімки та оновлення

OpenClaw створює знімок придатних Skills **під час старту session** і
повторно використовує цей список для наступних turn у тій самій session. Зміни до
Skills або конфігурації набирають чинності під час наступної нової session.

Skills можуть оновлюватися посеред session у двох випадках:

- Watcher Skills увімкнено.
- З’являється новий придатний віддалений node.

Сприймайте це як **hot reload**: оновлений список підхоплюється на
наступному turn агента. Якщо effective allowlist Skills агента змінюється для цієї
session, OpenClaw оновлює знімок, щоб видимі Skills залишалися узгодженими
з поточним агентом.

### Watcher Skills

Типово OpenClaw відстежує теки Skills і збільшує знімок Skills,
коли змінюються файли `SKILL.md`. Налаштуйте в `skills.load`:

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

Якщо Gateway працює на Linux, але підключено **macOS node** з дозволеним
`system.run` (безпека Exec approvals не встановлена в `deny`),
OpenClaw може вважати Skills лише для macOS придатними, коли потрібні
бінарні файли присутні на цьому node. Агент має виконувати ці Skills
через інструмент `exec` з `host=node`.

Це залежить від того, що node повідомляє про свою підтримку команд, і від bin probe
через `system.which` або `system.run`. Offline nodes **не** роблять
Skills, доступні лише віддалено, видимими. Якщо підключений node перестає відповідати на bin
probes, OpenClaw очищає кешовані відповідники bin, щоб агенти більше не бачили
Skills, які наразі не можуть там запускатися.

## Вплив на токени

Коли Skills придатні, OpenClaw впроваджує компактний XML-список доступних
Skills у системний prompt (через `formatSkillsForPrompt` в
`pi-coding-agent`). Вартість детермінована:

- **Базові накладні витрати** (лише коли ≥1 skill): 195 символів.
- **На skill:** 97 символів + довжина XML-екранованих значень `<name>`, `<description>` і `<location>`.

Формула (символи):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-екранування розгортає `& < > " '` у entities (`&amp;`, `&lt;` тощо),
збільшуючи довжину. Кількість токенів залежить від токенізатора моделі. Приблизна
оцінка в стилі OpenAI — ~4 символи/токен, тож **97 символів ≈ 24 токени** на
skill плюс фактичні довжини ваших полів.

## Життєвий цикл керованих Skills

OpenClaw постачає базовий набір Skills як **bundled Skills** разом з
інсталяцією (npm-пакет або OpenClaw.app). `~/.openclaw/skills` існує для
локальних перевизначень — наприклад, щоб зафіксувати або пропатчити skill без
зміни bundled копії. Workspace Skills належать користувачу і мають пріоритет
над обома у разі конфліктів назв.

## Шукаєте більше Skills?

Перегляньте [https://clawhub.ai](https://clawhub.ai). Повна schema конфігурації:
[Конфігурація Skills](/uk/tools/skills-config).

## Пов’язане

- [ClawHub](/uk/tools/clawhub) — публічний реєстр Skills
- [Створення Skills](/uk/tools/creating-skills) — створення власних Skills
- [Plugins](/uk/tools/plugin) — огляд системи plugin
- [Plugin Skill Workshop](/uk/plugins/skill-workshop) — генерування Skills з роботи агента
- [Конфігурація Skills](/uk/tools/skills-config) — довідник конфігурації skill
- [Команди зі скісною рискою](/uk/tools/slash-commands) — усі доступні команди зі скісною рискою
