---
read_when:
    - Ви створюєте нову власну навичку
    - Вам потрібен короткий початковий робочий процес для навичок на основі SKILL.md
    - Ви хочете використати Skill Workshop, щоб запропонувати навичку для перевірки агентом
sidebarTitle: Creating skills
summary: Створюйте, тестуйте й публікуйте власні Skills робочого простору у форматі SKILL.md для своїх агентів OpenClaw.
title: Створення Skills
x-i18n:
    generated_at: "2026-07-12T13:45:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills навчають агента, як і коли використовувати інструменти. Кожна навичка — це каталог,
що містить файл `SKILL.md` із YAML frontmatter та інструкціями у форматі Markdown.
OpenClaw завантажує навички з кількох кореневих каталогів у визначеному [порядку пріоритету](/uk/tools/skills#loading-order).

## Створіть свою першу навичку

<Steps>
  <Step title="Створіть каталог навички">
    Навички зберігаються в папці `skills/` вашого робочого простору:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Для впорядкування навички можна групувати в підпапках — назва навички все одно
    визначається у frontmatter файлу `SKILL.md`, а не шляхом до папки:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # назва навички все одно "hello-world", викликається як /hello-world
    ```

  </Step>

  <Step title="Створіть SKILL.md">
    Frontmatter визначає метадані, а основна частина містить інструкції для агента.

    ```markdown
    ---
    name: hello-world
    description: Проста навичка, що виводить привітання.
    ---

    # Привіт, світе

    Коли користувач просить привітання, скористайтеся інструментом `exec`, щоб виконати:

    ```bash
    echo "Привіт від вашої власної навички!"
    ```
    ```

    Правила найменування:
    - Для `name` використовуйте малі літери, цифри та дефіси.
    - Назва каталогу та значення `name` у frontmatter мають збігатися.
    - `description` відображається агенту та під час пошуку команд із похилою рискою —
      зберігайте його в одному рядку завдовжки до 160 символів.

  </Step>

  <Step title="Переконайтеся, що навичку завантажено">
    ```bash
    openclaw skills list
    ```

    За замовчуванням OpenClaw стежить за файлами `SKILL.md` у кореневих каталогах навичок. Якщо
    відстеження вимкнено або ви продовжуєте наявний сеанс, почніть новий,
    щоб агент отримав оновлений список:

    ```bash
    # У чаті — архівувати поточний сеанс і почати новий
    /new

    # Або перезапустити Gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Протестуйте навичку">
    ```bash
    openclaw agent --message "привітай мене"
    ```

    Або відкрийте чат і зверніться безпосередньо до агента. Використовуйте `/skill hello-world`,
    щоб явно викликати навичку за назвою.

  </Step>
</Steps>

## Довідка щодо SKILL.md

### Обов’язкові поля

| Поле          | Опис                                                                 |
| ------------- | -------------------------------------------------------------------- |
| `name`        | Унікальний ідентифікатор із малих літер, цифр і дефісів              |
| `description` | Однорядковий опис, що відображається агенту та в результатах пошуку  |

### Необов’язкові ключі frontmatter

| Поле                       | За замовчуванням | Опис                                                                                              |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`           | Надає навичку як користувацьку команду з похилою рискою                                            |
| `disable-model-invocation` | `false`          | Не додає навичку до системного запиту агента (її все одно можна запустити через `/skill`)          |
| `command-dispatch`         | —                | Установіть `tool`, щоб спрямувати команду з похилою рискою безпосередньо до інструмента в обхід моделі |
| `command-tool`             | —                | Назва інструмента, який викликається, коли встановлено `command-dispatch: tool`                    |
| `command-arg-mode`         | `raw`            | Під час спрямування до інструмента передає йому необроблений рядок аргументів                       |
| `homepage`                 | —                | URL-адреса, що відображається як "Website" в інтерфейсі Skills для macOS                           |

Поля умов активації (`requires.bins`, `requires.env` тощо) описано в розділі
[Skills — Умови активації](/uk/tools/skills#gating).

### Використання `{baseDir}`

Посилайтеся на файли всередині каталогу навички без жорстко заданих шляхів —
агент визначає `{baseDir}` відносно власного каталогу навички:

```markdown
Запустіть допоміжний сценарій за шляхом `{baseDir}/scripts/run.sh`.
```

## Додавання умовної активації

Налаштуйте умови, щоб навичка завантажувалася лише тоді, коли доступні її залежності:

```markdown
---
name: gemini-search
description: Пошук за допомогою Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Параметри умов активації">
    | Ключ | Опис |
    | --- | --- |
    | `requires.bins` | Усі виконувані файли мають бути доступні в `PATH` |
    | `requires.anyBins` | Принаймні один виконуваний файл має бути доступний у `PATH` |
    | `requires.env` | Кожна змінна середовища має існувати в процесі або конфігурації |
    | `requires.config` | Кожен шлях `openclaw.json` повинен мати істинне значення |
    | `os` | Фільтр платформи: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Установіть `true`, щоб пропустити всі умови й завжди додавати навичку |

    Повна довідка: [Skills — Умови активації](/uk/tools/skills#gating).

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

    Ключ додається до головного процесу лише на час цього ходу агента.
    Він не потрапляє до пісочниці — див.
    [змінні середовища в пісочниці](/uk/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Пропозиція через Майстерню навичок

Для навичок, створених агентом, або якщо перед введенням навички в експлуатацію потрібна перевірка оператором,
використовуйте пропозиції [Майстерні навичок](/uk/tools/skill-workshop), а не записуйте
`SKILL.md` безпосередньо.

```bash
# Запропонувати цілком нову навичку
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Проста навичка, що виводить привітання." \
  --proposal ./PROPOSAL.md

# Запропонувати оновлення наявної навички
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Оновлена навичка привітання"
```

Використовуйте `--proposal-dir`, якщо пропозиція містить допоміжні файли:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Проста навичка, що виводить привітання." \
  --proposal-dir ./hello-world-proposal/
```

У корені каталогу має міститися файл `PROPOSAL.md`. Допоміжні файли розміщуються в
`assets/`, `examples/`, `references/`, `scripts/` або `templates/`.

Після перевірки:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Повний життєвий цикл пропозиції описано в розділі [Майстерня навичок](/uk/tools/skill-workshop).

## Публікація в ClawHub

<Steps>
  <Step title="Переконайтеся, що ваш SKILL.md завершено">
    Переконайтеся, що встановлено `name`, `description` та всі поля умов активації `metadata.openclaw`.
    Додайте URL-адресу `homepage`, якщо маєте сторінку проєкту.
  </Step>
  <Step title="Установіть автономний ClawHub CLI та ввійдіть">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Опублікуйте">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Додайте `--version <version>` або `--owner <owner>`, щоб перевизначити визначену
    версію або опублікувати від імені конкретного власника. Повний процес, області власників та інші
    команди обслуговування (`clawhub sync`, `clawhub skill rename`, ...) описано в розділах
    [ClawHub — Публікація](/uk/clawhub/publishing) і
    [ClawHub CLI](/uk/clawhub/cli).

  </Step>
</Steps>

## Рекомендації

<Tip>
  - **Будьте лаконічними** — указуйте моделі, *що* робити, а не як бути ШІ.
  - **Безпека понад усе** — якщо ваша навичка використовує `exec`, переконайтеся, що запити не допускають
    упровадження довільних команд із недовірених вхідних даних.
  - **Тестуйте локально** — перед поширенням використовуйте `openclaw agent --message "..."`.
  - **Використовуйте ClawHub** — перш ніж створювати щось із нуля, перегляньте навички спільноти на [clawhub.ai](https://clawhub.ai).
</Tip>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Довідка щодо Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Порядок завантаження, умови активації, списки дозволів і формат SKILL.md.
  </Card>
  <Card title="Майстерня навичок" href="/uk/tools/skill-workshop" icon="flask">
    Черга пропозицій для навичок, створених агентом.
  </Card>
  <Card title="Конфігурація Skills" href="/uk/tools/skills-config" icon="gear">
    Повна схема конфігурації `skills.*`.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Переглядайте та публікуйте навички в загальнодоступному реєстрі.
  </Card>
  <Card title="Створення плагінів" href="/uk/plugins/building-plugins" icon="plug">
    Плагіни можуть постачати навички разом з інструментами, які вони документують.
  </Card>
</CardGroup>
