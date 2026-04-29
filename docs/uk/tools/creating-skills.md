---
read_when:
    - Ви створюєте нову власну навичку у своєму робочому просторі
    - Вам потрібен швидкий початковий робочий процес для Skills на основі SKILL.md
summary: Створення та тестування власних Skills робочої області за допомогою SKILL.md
title: Створення Skills
x-i18n:
    generated_at: "2026-04-29T03:21:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills навчають агента, як і коли використовувати інструменти. Кожен skill — це каталог,
що містить файл `SKILL.md` із YAML frontmatter та markdown-інструкціями.

Про те, як skills завантажуються та пріоритизуються, див. [Skills](/uk/tools/skills).

## Створіть свій перший skill

<Steps>
  <Step title="Створіть каталог skill">
    Skills зберігаються у вашому робочому просторі. Створіть нову папку:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Напишіть SKILL.md">
    Створіть `SKILL.md` у цьому каталозі. Frontmatter визначає метадані,
    а markdown-тіло містить інструкції для агента.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Використовуйте hyphen-case з малими літерами, цифрами та дефісами для
    `name` skill. Узгоджуйте назву папки та `name` у frontmatter.

  </Step>

  <Step title="Додайте інструменти (необов’язково)">
    Ви можете визначити власні схеми інструментів у frontmatter або вказати агенту
    використовувати наявні системні інструменти (наприклад, `exec` чи `browser`). Skills також можуть
    постачатися всередині plugins поруч з інструментами, які вони документують.

  </Step>

  <Step title="Завантажте skill">
    Почніть нову сесію, щоб OpenClaw підхопив skill:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Перевірте, що skill завантажено:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Протестуйте його">
    Надішліть повідомлення, яке має активувати skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Або просто поспілкуйтеся з агентом і попросіть привітання.

  </Step>
</Steps>

## Довідник метаданих skill

YAML frontmatter підтримує такі поля:

| Поле                                | Обов’язкове | Опис                                                               |
| ----------------------------------- | ----------- | ------------------------------------------------------------------ |
| `name`                              | Так         | Унікальний ідентифікатор із малими літерами, цифрами та дефісами   |
| `description`                       | Так         | Однорядковий опис, який показується агенту                         |
| `metadata.openclaw.os`              | Ні          | Фільтр ОС (`["darwin"]`, `["linux"]` тощо)                         |
| `metadata.openclaw.requires.bins`   | Ні          | Обов’язкові виконувані файли в PATH                                |
| `metadata.openclaw.requires.config` | Ні          | Обов’язкові ключі конфігурації                                     |

## Найкращі практики

- **Будьте лаконічними** — інструктуйте модель, _що_ робити, а не як бути ШІ
- **Безпека передусім** — якщо ваш skill використовує `exec`, переконайтеся, що prompts не допускають довільної ін’єкції команд із ненадійного вводу
- **Тестуйте локально** — використовуйте `openclaw agent --message "..."` для тестування перед поширенням
- **Використовуйте ClawHub** — переглядайте skills і долучайте їх на [ClawHub](https://clawhub.ai)

## Де зберігаються skills

| Розташування                    | Пріоритет   | Область дії                    |
| ------------------------------- | ----------- | ------------------------------ |
| `\<workspace\>/skills/`         | Найвищий    | Для окремого агента            |
| `\<workspace\>/.agents/skills/` | Високий     | Для агента робочого простору   |
| `~/.agents/skills/`             | Середній    | Спільний профіль агента        |
| `~/.openclaw/skills/`           | Середній    | Спільно (усі агенти)           |
| Вбудовані (постачаються з OpenClaw) | Низький | Глобальна                      |
| `skills.load.extraDirs`         | Найнижчий   | Власні спільні папки           |

## Пов’язане

- [Довідник Skills](/uk/tools/skills) — правила завантаження, пріоритету та gating
- [Конфігурація Skills](/uk/tools/skills-config) — схема конфігурації `skills.*`
- [ClawHub](/uk/tools/clawhub) — публічний реєстр skills
- [Створення Plugins](/uk/plugins/building-plugins) — plugins можуть постачати skills
