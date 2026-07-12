---
read_when:
    - Вы создаёте новый пользовательский навык
    - Вам нужен краткий начальный рабочий процесс для Skills на основе SKILL.md
    - Вы хотите использовать Skill Workshop, чтобы предложить навык для проверки агентом
sidebarTitle: Creating skills
summary: Создавайте, тестируйте и публикуйте пользовательские Skills рабочей области в формате SKILL.md для своих агентов OpenClaw.
title: Создание Skills
x-i18n:
    generated_at: "2026-07-12T11:54:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills обучают агента тому, как и когда использовать инструменты. Каждый навык представляет собой каталог,
содержащий файл `SKILL.md` с YAML frontmatter и инструкциями в формате Markdown.
OpenClaw загружает навыки из нескольких корневых каталогов в заданном [порядке приоритета](/ru/tools/skills#loading-order).

## Создание первого навыка

<Steps>
  <Step title="Создайте каталог навыка">
    Skills находятся в папке `skills/` вашего рабочего пространства:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Для удобства организации навыки можно группировать во вложенных папках — имя навыка
    по-прежнему определяется frontmatter файла `SKILL.md`, а не путем к папке:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # имя навыка по-прежнему "hello-world", вызывается как /hello-world
    ```

  </Step>

  <Step title="Создайте SKILL.md">
    Frontmatter определяет метаданные, а основная часть содержит инструкции для агента.

    ```markdown
    ---
    name: hello-world
    description: Простой навык, который выводит приветствие.
    ---

    # Привет, мир

    Когда пользователь просит поприветствовать его, используйте инструмент `exec`, чтобы выполнить:

    ```bash
    echo "Привет от вашего собственного навыка!"
    ```
    ```

    Правила именования:
    - Используйте для `name` строчные буквы, цифры и дефисы.
    - Имя каталога и значение `name` во frontmatter должны совпадать.
    - `description` показывается агенту и при поиске слеш-команд —
      оно должно занимать одну строку и содержать не более 160 символов.

  </Step>

  <Step title="Убедитесь, что навык загружен">
    ```bash
    openclaw skills list
    ```

    По умолчанию OpenClaw отслеживает файлы `SKILL.md` в корневых каталогах навыков. Если
    отслеживание отключено или вы продолжаете существующий сеанс, запустите новый,
    чтобы агент получил обновленный список:

    ```bash
    # В чате — архивировать текущий сеанс и начать новый
    /new

    # Или перезапустить Gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Протестируйте навык">
    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Или откройте чат и обратитесь непосредственно к агенту. Используйте `/skill hello-world`,
    чтобы явно вызвать навык по имени.

  </Step>
</Steps>

## Справочник по SKILL.md

### Обязательные поля

| Поле          | Описание                                                               |
| ------------- | ---------------------------------------------------------------------- |
| `name`        | Уникальный идентификатор из строчных букв, цифр и дефисов              |
| `description` | Однострочное описание, показываемое агенту и в результатах поиска      |

### Необязательные ключи frontmatter

| Поле                       | По умолчанию | Описание                                                                                           |
| -------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`       | Предоставляет навык в виде пользовательской слеш-команды                                           |
| `disable-model-invocation` | `false`      | Исключает навык из системного промпта агента (он по-прежнему запускается через `/skill`)            |
| `command-dispatch`         | —            | Установите `tool`, чтобы направлять слеш-команду непосредственно инструменту, минуя модель          |
| `command-tool`             | —            | Имя инструмента, вызываемого при установленном `command-dispatch: tool`                            |
| `command-arg-mode`         | `raw`        | При направлении инструменту передает ему необработанную строку аргументов                           |
| `homepage`                 | —            | URL, отображаемый как "Website" в интерфейсе Skills для macOS                                      |

Поля условий активации (`requires.bins`, `requires.env` и другие) описаны в разделе
[Skills — условия активации](/ru/tools/skills#gating).

### Использование `{baseDir}`

Ссылайтесь на файлы внутри каталога навыка, не задавая пути жестко —
агент разрешает `{baseDir}` относительно собственного каталога навыка:

```markdown
Запустите вспомогательный скрипт `{baseDir}/scripts/run.sh`.
```

## Добавление условной активации

Настройте условия, чтобы навык загружался только при наличии его зависимостей:

```markdown
---
name: gemini-search
description: Поиск с помощью Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Параметры условий активации">
    | Ключ | Описание |
    | --- | --- |
    | `requires.bins` | Все исполняемые файлы должны присутствовать в `PATH` |
    | `requires.anyBins` | В `PATH` должен присутствовать хотя бы один исполняемый файл |
    | `requires.env` | Каждая переменная окружения должна присутствовать в процессе или конфигурации |
    | `requires.config` | Каждый путь в `openclaw.json` должен иметь истинное значение |
    | `os` | Фильтр платформ: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Установите `true`, чтобы пропустить все условия и всегда включать навык |

    Полный справочник: [Skills — условия активации](/ru/tools/skills#gating).

  </Accordion>
  <Accordion title="Окружение и ключи API">
    Свяжите ключ API с записью навыка в `openclaw.json`:

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

    Ключ внедряется в основной процесс только на время этого хода агента.
    Он не передается в песочницу — см.
    [переменные окружения в песочнице](/ru/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Предложение через мастерскую навыков

Для навыков, подготовленных агентом, или когда перед вводом навыка в эксплуатацию требуется
проверка оператором, используйте предложения [мастерской навыков](/ru/tools/skill-workshop)
вместо непосредственного создания `SKILL.md`.

```bash
# Предложить совершенно новый навык
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Простой навык, который выводит приветствие." \
  --proposal ./PROPOSAL.md

# Предложить обновление существующего навыка
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Обновленный навык приветствия"
```

Используйте `--proposal-dir`, если предложение содержит вспомогательные файлы:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Простой навык, который выводит приветствие." \
  --proposal-dir ./hello-world-proposal/
```

В корне каталога должен находиться файл `PROPOSAL.md`. Вспомогательные файлы размещаются в
`assets/`, `examples/`, `references/`, `scripts/` или `templates/`.

После проверки:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Полный жизненный цикл предложения описан в разделе [Мастерская навыков](/ru/tools/skill-workshop).

## Публикация в ClawHub

<Steps>
  <Step title="Убедитесь, что SKILL.md заполнен">
    Убедитесь, что заданы `name`, `description` и все поля условий активации `metadata.openclaw`.
    Добавьте URL `homepage`, если у вас есть страница проекта.
  </Step>
  <Step title="Установите автономный ClawHub CLI и войдите в систему">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Опубликуйте">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Добавьте `--version <version>` или `--owner <owner>`, чтобы переопределить определенную
    автоматически версию или опубликовать от имени конкретного владельца. Полный процесс,
    область действия владельца и другие команды обслуживания (`clawhub sync`,
    `clawhub skill rename`, ...) описаны в разделах
    [ClawHub — публикация](/ru/clawhub/publishing) и
    [ClawHub CLI](/ru/clawhub/cli).

  </Step>
</Steps>

## Рекомендации

<Tip>
  - **Будьте краткими** — указывайте модели, *что* нужно сделать, а не как быть искусственным интеллектом.
  - **Безопасность прежде всего** — если ваш навык использует `exec`, убедитесь, что промпты не допускают
    внедрение произвольных команд из недоверенных входных данных.
  - **Тестируйте локально** — перед публикацией используйте `openclaw agent --message "..."`.
  - **Используйте ClawHub** — прежде чем создавать навык с нуля, просмотрите навыки сообщества на [clawhub.ai](https://clawhub.ai).
</Tip>

## Связанные разделы

<CardGroup cols={2}>
  <Card title="Справочник по Skills" href="/ru/tools/skills" icon="puzzle-piece">
    Порядок загрузки, условия активации, списки разрешений и формат SKILL.md.
  </Card>
  <Card title="Мастерская навыков" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений навыков, подготовленных агентом.
  </Card>
  <Card title="Конфигурация Skills" href="/ru/tools/skills-config" icon="gear">
    Полная схема конфигурации `skills.*`.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Просмотр и публикация навыков в общедоступном реестре.
  </Card>
  <Card title="Создание плагинов" href="/ru/plugins/building-plugins" icon="plug">
    Плагины могут поставлять навыки вместе с инструментами, которые они документируют.
  </Card>
</CardGroup>
