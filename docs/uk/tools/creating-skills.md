---
read_when:
    - Ви створюєте новий власний Skill у своєму workspace
    - Вам потрібен швидкий старт для Skills на основі `SKILL.md`
summary: Створюйте й тестуйте власні workspace Skills за допомогою `SKILL.md`
title: Створення Skills
x-i18n:
    generated_at: "2026-04-23T21:13:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Skills навчають агента, як і коли використовувати tools. Кожен Skill — це каталог,
який містить файл `SKILL.md` з YAML frontmatter і markdown-інструкціями.

Про те, як Skills завантажуються і як визначається їхній пріоритет, див. [Skills](/uk/tools/skills).

## Створіть свій перший Skill

<Steps>
  <Step title="Створіть каталог Skill">
    Skills живуть у вашому workspace. Створіть нову теку:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Напишіть SKILL.md">
    Створіть `SKILL.md` усередині цього каталогу. Frontmatter визначає metadata,
    а markdown-body містить інструкції для агента.

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Додайте tools (необов’язково)">
    Ви можете визначати власні schema tool-ів у frontmatter або інструктувати агента
    використовувати наявні system tools (наприклад `exec` або `browser`). Skills також можуть
    постачатися всередині Plugin-ів разом із tools, які вони документують.

  </Step>

  <Step title="Завантажте Skill">
    Запустіть нову сесію, щоб OpenClaw підхопив Skill:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Переконайтеся, що Skill завантажився:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Перевірте його">
    Надішліть повідомлення, яке має активувати Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Або просто поспілкуйтеся з агентом і попросіть привітання.

  </Step>
</Steps>

## Довідник metadata Skill-а

YAML frontmatter підтримує такі поля:

| Поле                                | Обов’язкове | Опис                                       |
| ----------------------------------- | ----------- | ------------------------------------------ |
| `name`                              | Так         | Унікальний ідентифікатор (`snake_case`)    |
| `description`                       | Так         | Однорядковий опис, який показується агенту |
| `metadata.openclaw.os`              | Ні          | Фільтр ОС (`["darwin"]`, `["linux"]` тощо) |
| `metadata.openclaw.requires.bins`   | Ні          | Потрібні бінарні файли в PATH              |
| `metadata.openclaw.requires.config` | Ні          | Потрібні ключі config                      |

## Найкращі практики

- **Будьте лаконічними** — інструктуйте модель, _що_ робити, а не як бути AI
- **Безпека насамперед** — якщо ваш Skill використовує `exec`, переконайтеся, що prompt-и не допускають довільну ін’єкцію команд із недовіреного вводу
- **Тестуйте локально** — використовуйте `openclaw agent --message "..."` для тестування перед поширенням
- **Використовуйте ClawHub** — переглядайте та додавайте Skills у [ClawHub](https://clawhub.ai)

## Де живуть Skills

| Розташування                    | Пріоритет | Scope                 |
| ------------------------------- | --------- | --------------------- |
| `\<workspace\>/skills/`         | Найвищий  | Для конкретного агента |
| `\<workspace\>/.agents/skills/` | Високий   | Для агента в межах workspace |
| `~/.agents/skills/`             | Середній  | Спільний профіль агента |
| `~/.openclaw/skills/`           | Середній  | Спільний (усі агенти) |
| Bundled (постачаються з OpenClaw) | Низький | Глобальний            |
| `skills.load.extraDirs`         | Найнижчий | Власні спільні теки   |

## Пов’язане

- [Довідник Skills](/uk/tools/skills) — завантаження, пріоритет і правила gating
- [Конфігурація Skills](/uk/tools/skills-config) — schema config `skills.*`
- [ClawHub](/uk/tools/clawhub) — публічний registry Skills
- [Building Plugins](/uk/plugins/building-plugins) — Plugin-и можуть постачати Skills
