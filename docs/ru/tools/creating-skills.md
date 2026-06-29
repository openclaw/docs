---
read_when:
    - Вы создаете новый пользовательский навык
    - Нужен быстрый стартовый рабочий процесс для Skills на основе SKILL.md
    - Вы хотите использовать Skill Workshop, чтобы предложить skill для проверки агентом
sidebarTitle: Creating skills
summary: Создавайте, тестируйте и публикуйте пользовательские Skills рабочей области SKILL.md для ваших агентов OpenClaw.
title: Создание Skills
x-i18n:
    generated_at: "2026-06-28T23:51:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills учат агента, как и когда использовать инструменты. Каждый Skill — это каталог,
содержащий файл `SKILL.md` с YAML frontmatter и инструкциями в markdown.
OpenClaw загружает Skills из нескольких корней в заданном [порядке приоритета](/ru/tools/skills#loading-order).

## Создайте свой первый Skill

<Steps>
  <Step title="Создайте каталог Skill">
    Skills находятся в папке `skills/` вашего рабочего пространства. Создайте каталог для
    нового Skill:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Для организации можно группировать Skills в подпапках — имя Skill всё равно
    задаётся frontmatter в `SKILL.md`, а не путём к папке:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Напишите SKILL.md">
    Создайте `SKILL.md` внутри каталога. Frontmatter определяет метаданные;
    тело содержит инструкции для агента.

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

    Правила именования:
    - Используйте строчные буквы, цифры и дефисы для `name`.
    - Синхронизируйте имя каталога и `name` во frontmatter.
    - `description` показывается агенту и в обнаружении slash-команд —
      оставляйте его в одну строку и короче 160 символов.

  </Step>

  <Step title="Проверьте, что Skill загружен">
    ```bash
    openclaw skills list
    ```

    По умолчанию OpenClaw отслеживает файлы `SKILL.md` в корнях Skills. Если
    наблюдатель отключён или вы продолжаете существующую сессию, запустите новую,
    чтобы агент получил обновлённый список:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Протестируйте его">
    Отправьте сообщение, которое должно активировать Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Или откройте чат и спросите агента напрямую. Используйте `/skill hello-world`, чтобы
    вызвать его явно по имени.

  </Step>
</Steps>

## Справочник SKILL.md

### Обязательные поля

| Поле          | Описание                                                       |
| ------------- | -------------------------------------------------------------- |
| `name`        | Уникальный slug из строчных букв, цифр и дефисов               |
| `description` | Однострочное описание, показываемое агенту и в выводе обнаружения |

### Необязательные ключи frontmatter

| Поле                      | По умолчанию | Описание                                                                            |
| -------------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `user-invocable`           | `true`       | Показывает Skill как пользовательскую slash-команду                                  |
| `disable-model-invocation` | `false`      | Исключает Skill из системного prompt агента (он всё ещё запускается через `/skill`) |
| `command-dispatch`         | —            | Установите `tool`, чтобы направить slash-команду напрямую в инструмент, обходя модель |
| `command-tool`             | —            | Имя инструмента для вызова, когда задано `command-dispatch: tool`                    |
| `command-arg-mode`         | `raw`        | Для диспетчеризации инструмента передаёт в инструмент необработанную строку аргументов |
| `homepage`                 | —            | URL, показываемый как "Website" в macOS UI Skills                                   |

Поля ограничений (`requires.bins`, `requires.env` и т. д.) см. в
[Skills — Ограничения](/ru/tools/skills#gating).

### Использование `{baseDir}`

Используйте `{baseDir}` в теле Skill, чтобы ссылаться на файлы внутри каталога
Skill без жёстко заданных путей:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Добавление условной активации

Ограничьте Skill так, чтобы он загружался только при доступности его зависимостей:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Параметры ограничений">
    | Ключ | Описание |
    | --- | --- |
    | `requires.bins` | Все бинарные файлы должны существовать в `PATH` |
    | `requires.anyBins` | Хотя бы один бинарный файл должен существовать в `PATH` |
    | `requires.env` | Каждая переменная env должна существовать в процессе или конфигурации |
    | `requires.config` | Каждый путь `openclaw.json` должен иметь truthy-значение |
    | `os` | Фильтр платформы: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Установите `true`, чтобы пропустить все ограничения и всегда включать Skill |

    Полный справочник: [Skills — Ограничения](/ru/tools/skills#gating).

  </Accordion>
  <Accordion title="Переменные окружения и API-ключи">
    Привяжите API-ключ к записи Skill в `openclaw.json`:

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

    Ключ внедряется в процесс хоста только на этот ход агента.
    Он не попадает в песочницу — см.
    [переменные env в песочнице](/ru/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Предложение через Skill Workshop

Для Skills, подготовленных агентом, или когда перед запуском Skill в работу нужен
операторский review, используйте предложения [Skill Workshop](/ru/tools/skill-workshop)
вместо прямой записи `SKILL.md`.

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

Используйте `--proposal-dir`, когда предложение включает вспомогательные файлы:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

Каталог должен содержать `PROPOSAL.md`. Вспомогательные файлы можно размещать в `assets/`,
`examples/`, `references/`, `scripts/` или `templates/`.

После review:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Полный жизненный цикл предложения см. в [Skill Workshop](/ru/tools/skill-workshop).

## Публикация в ClawHub

<Steps>
  <Step title="Убедитесь, что ваш SKILL.md заполнен полностью">
    Убедитесь, что заданы `name`, `description` и все поля ограничений `metadata.openclaw`.
    Добавьте URL `homepage`, если у вас есть страница проекта.
  </Step>
  <Step title="Установите Skill ClawHub">
    Skill ClawHub документирует текущую форму команды публикации и обязательные
    метаданные:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Опубликуйте">
    ```bash
    clawhub publish
    ```

    Полный процесс см. в [ClawHub — Публикация](/ru/clawhub/publishing).

  </Step>
</Steps>

## Рекомендации

<Tip>
  - **Будьте лаконичны** — инструктируйте модель, *что* делать, а не как быть ИИ.
  - **Безопасность прежде всего** — если ваш Skill использует `exec`, убедитесь, что prompt не позволяет
    произвольную инъекцию команд из недоверенного ввода.
  - **Тестируйте локально** — используйте `openclaw agent --message "..."` перед публикацией.
  - **Используйте ClawHub** — просматривайте Skills сообщества на [clawhub.ai](https://clawhub.ai)
    перед созданием с нуля.
</Tip>

## См. также

<CardGroup cols={2}>
  <Card title="Справочник Skills" href="/ru/tools/skills" icon="puzzle-piece">
    Порядок загрузки, ограничения, allowlists и формат SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений для Skills, подготовленных агентом.
  </Card>
  <Card title="Конфигурация Skills" href="/ru/tools/skills-config" icon="gear">
    Полная схема конфигурации `skills.*`.
  </Card>
  <Card title="ClawHub" href="/ru/clawhub" icon="cloud">
    Просматривайте и публикуйте Skills в публичном registry.
  </Card>
  <Card title="Создание Plugins" href="/ru/plugins/building-plugins" icon="plug">
    Plugins могут поставлять Skills вместе с инструментами, которые они документируют.
  </Card>
</CardGroup>
