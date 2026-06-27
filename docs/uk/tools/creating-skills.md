---
read_when:
    - Ви створюєте нову власну skill
    - Потрібен швидкий початковий робочий процес для Skills на основі SKILL.md
    - Ви хочете використати Skill Workshop, щоб запропонувати skill для перевірки агентом
sidebarTitle: Creating skills
summary: Створюйте, тестуйте й публікуйте користувацькі навички робочого простору SKILL.md для ваших агентів OpenClaw.
title: Створення Skills
x-i18n:
    generated_at: "2026-06-27T18:23:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills навчають агента, як і коли використовувати інструменти. Кожна навичка — це каталог,
що містить файл `SKILL.md` із YAML frontmatter та інструкціями markdown.
OpenClaw завантажує Skills із кількох коренів у визначеному [порядку пріоритету](/uk/tools/skills#loading-order).

## Створіть свою першу навичку

<Steps>
  <Step title="Створіть каталог навички">
    Skills зберігаються у папці `skills/` вашого робочого простору. Створіть каталог для своєї
    нової навички:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Для організації можна групувати Skills у підпапках — назву навички все одно
    визначає frontmatter у `SKILL.md`, а не шлях до папки:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Напишіть SKILL.md">
    Створіть `SKILL.md` усередині каталогу. Frontmatter визначає метадані;
    тіло надає агенту інструкції.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    Правила іменування:
    - Використовуйте малі літери, цифри та дефіси для `name`.
    - Узгоджуйте назву каталогу та `name` у frontmatter.
    - `description` показується агенту та у виявленні slash-команд —
      тримайте його в один рядок і до 160 символів.

  </Step>

  <Step title="Перевірте, що навичку завантажено">
    ```bash
    openclaw skills list
    ```

    OpenClaw типово відстежує файли `SKILL.md` під коренями Skills. Якщо
    спостерігач вимкнений або ви продовжуєте наявну сесію, почніть нову,
    щоб агент отримав оновлений список:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Протестуйте її">
    Надішліть повідомлення, яке має активувати навичку:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Або відкрийте чат і зверніться до агента напряму. Використовуйте `/skill hello-world`,
    щоб явно викликати її за назвою.

  </Step>
</Steps>

## Довідник SKILL.md

### Обов’язкові поля

| Поле          | Опис                                                            |
| ------------- | --------------------------------------------------------------- |
| `name`        | Унікальний slug із малих літер, цифр і дефісів                  |
| `description` | Однорядковий опис, який показується агенту та у виводі виявлення |

### Необов’язкові ключі frontmatter

| Поле                       | Типово  | Опис                                                                                  |
| -------------------------- | ------- | ------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | Показувати навичку як користувацьку slash-команду                                     |
| `disable-model-invocation` | `false` | Не включати навичку до системного prompt агента (вона все ще запускається через `/skill`) |
| `command-dispatch`         | —       | Встановіть `tool`, щоб спрямувати slash-команду безпосередньо до інструмента, оминаючи модель |
| `command-tool`             | —       | Назва інструмента для виклику, коли встановлено `command-dispatch: tool`              |
| `command-arg-mode`         | `raw`   | Для dispatch до інструмента передає сирий рядок аргументів інструменту                |
| `homepage`                 | —       | URL, що показується як "Вебсайт" в інтерфейсі Skills macOS                            |

Для полів gating (`requires.bins`, `requires.env` тощо) див.
[Skills — Gating](/uk/tools/skills#gating).

### Використання `{baseDir}`

Використовуйте `{baseDir}` у тілі навички, щоб посилатися на файли всередині каталогу
навички без жорстко заданих шляхів:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Додавання умовної активації

Обмежте навичку так, щоб вона завантажувалася лише тоді, коли доступні її залежності:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Параметри gating">
    | Ключ | Опис |
    | --- | --- |
    | `requires.bins` | Усі виконувані файли мають існувати в `PATH` |
    | `requires.anyBins` | Принаймні один виконуваний файл має існувати в `PATH` |
    | `requires.env` | Кожна змінна env має існувати в процесі або конфігурації |
    | `requires.config` | Кожен шлях `openclaw.json` має бути truthy |
    | `os` | Фільтр платформи: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Встановіть `true`, щоб пропустити всі gates і завжди включати навичку |

    Повний довідник: [Skills — Gating](/uk/tools/skills#gating).

  </Accordion>
  <Accordion title="Середовище та ключі API">
    Прив’яжіть ключ API до запису навички в `openclaw.json`:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    Ключ вводиться в процес host лише для цього ходу агента.
    Він не потрапляє до sandbox — див.
    [sandboxed env vars](/uk/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Запропонуйте через Skill Workshop

Для Skills, підготовлених агентом, або коли потрібен перегляд оператором перед тим, як навичка стане
активною, використовуйте пропозиції [Skill Workshop](/uk/tools/skill-workshop) замість безпосереднього написання
`SKILL.md`.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

Використовуйте `--proposal-dir`, коли пропозиція містить допоміжні файли:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

Каталог має містити `PROPOSAL.md`. Допоміжні файли можна розміщувати в `assets/`,
`examples/`, `references/`, `scripts/` або `templates/`.

Після перегляду:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Див. [Skill Workshop](/uk/tools/skill-workshop), щоб ознайомитися з повним життєвим циклом пропозиції.

## Публікація в ClawHub

<Steps>
  <Step title="Переконайтеся, що ваш SKILL.md повний">
    Переконайтеся, що `name`, `description` і будь-які поля gating `metadata.openclaw`
    задані. Додайте URL `homepage`, якщо у вас є сторінка проєкту.
  </Step>
  <Step title="Встановіть навичку ClawHub">
    Навичка ClawHub документує поточну форму команди публікації та потрібні
    метадані:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Опублікуйте">
    ```bash
    clawhub publish
    ```

    Див. [ClawHub — Публікація](/uk/clawhub/publishing), щоб ознайомитися з повним процесом.

  </Step>
</Steps>

## Найкращі практики

<Tip>
  - **Будьте лаконічними** — інструктуйте модель, *що* робити, а не як бути AI.
  - **Безпека передусім** — якщо ваша навичка використовує `exec`, переконайтеся, що prompts не дозволяють
    довільне впровадження команд із ненадійного вводу.
  - **Тестуйте локально** — використовуйте `openclaw agent --message "..."` перед поширенням.
  - **Використовуйте ClawHub** — перегляньте Skills спільноти на [clawhub.ai](https://clawhub.ai)
    перед створенням з нуля.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Довідник Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Порядок завантаження, gating, allowlists і формат SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/uk/tools/skill-workshop" icon="flask">
    Черга пропозицій для Skills, підготовлених агентом.
  </Card>
  <Card title="Конфігурація Skills" href="/uk/tools/skills-config" icon="gear">
    Повна схема конфігурації `skills.*`.
  </Card>
  <Card title="ClawHub" href="/uk/clawhub" icon="cloud">
    Переглядайте та публікуйте Skills у публічному реєстрі.
  </Card>
  <Card title="Створення plugins" href="/uk/plugins/building-plugins" icon="plug">
    Plugins можуть постачати Skills разом з інструментами, які вони документують.
  </Card>
</CardGroup>
