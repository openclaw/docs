---
read_when:
    - Вы создаёте новый пользовательский навык
    - Вам нужен краткий начальный рабочий процесс для Skills на основе SKILL.md
    - Вы хотите использовать Skill Workshop, чтобы предложить навык на проверку агенту
sidebarTitle: Creating skills
summary: Создавайте, тестируйте и публикуйте пользовательские навыки рабочей области SKILL.md для своих агентов OpenClaw.
title: Создание Skills
x-i18n:
    generated_at: "2026-07-13T18:48:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills обучают агента тому, как и когда использовать инструменты. Каждый навык представляет собой каталог,
содержащий файл `SKILL.md` с YAML frontmatter и инструкциями в формате Markdown.
OpenClaw загружает навыки из нескольких корневых каталогов в определённом [порядке приоритета](/ru/tools/skills#loading-order).

## Создание первого навыка

<Steps>
  <Step title="Создайте каталог навыка">
    Навыки хранятся в папке `skills/` вашей рабочей области:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Для удобства организации навыки можно группировать по вложенным папкам — имя навыка
    по-прежнему задаётся полем `SKILL.md` во frontmatter, а не путём к папке:

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
    echo "Привет от вашего пользовательского навыка!"
    ```
    ```

    Правила именования:
    - Для `name` используйте строчные буквы, цифры и дефисы.
    - Имя каталога должно совпадать со значением `name` во frontmatter.
    - `description` отображается агенту и при поиске слеш-команд —
      оно должно занимать одну строку и содержать менее 160 символов.

  </Step>

  <Step title="Убедитесь, что навык загружен">
    ```bash
    openclaw skills list
    ```

    По умолчанию OpenClaw отслеживает файлы `SKILL.md` в корневых каталогах навыков. Если
    отслеживание отключено или вы продолжаете существующий сеанс, начните новый,
    чтобы агент получил обновлённый список:

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

    Или откройте чат и обратитесь к агенту напрямую. Используйте `/skill hello-world`,
    чтобы явно вызвать навык по имени.

  </Step>
</Steps>

## Справочник по SKILL.md

### Обязательные поля

| Поле          | Описание                                                        |
| ------------- | --------------------------------------------------------------- |
| `name`        | Уникальный идентификатор из строчных букв, цифр и дефисов       |
| `description` | Однострочное описание, отображаемое агенту и в результатах поиска |

### Необязательные ключи frontmatter

| Поле                       | По умолчанию | Описание                                                                       |
| -------------------------- | ------------ | ------------------------------------------------------------------------------ |
| `user-invocable`           | `true`  | Сделать навык доступным как пользовательскую слеш-команду                      |
| `disable-model-invocation` | `false` | Не включать навык в системный промпт агента (он по-прежнему запускается через `/skill`) |
| `command-dispatch`         | —            | Установите `tool`, чтобы направлять слеш-команду непосредственно инструменту в обход модели |
| `command-tool`             | —            | Имя инструмента, вызываемого при заданном `command-dispatch: tool`                  |
| `command-arg-mode`         | `raw`   | При перенаправлении инструменту передаёт исходную строку аргументов            |
| `homepage`                 | —            | URL, отображаемый как "Website" в интерфейсе Skills для macOS                 |

Описание полей условий загрузки (`requires.bins`, `requires.env` и других) см. в разделе
[Skills — условия загрузки](/ru/tools/skills#gating).

### Использование `{baseDir}`

Ссылайтесь на файлы внутри каталога навыка без жёстко заданных путей —
агент разрешает `{baseDir}` относительно собственного каталога навыка:

```markdown
Запустите вспомогательный скрипт по адресу `{baseDir}/scripts/run.sh`.
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
  <Accordion title="Параметры условий загрузки">
    | Ключ | Описание |
    | --- | --- |
    | `requires.bins` | Все исполняемые файлы должны существовать в `PATH` |
    | `requires.anyBins` | В `PATH` должен существовать хотя бы один исполняемый файл |
    | `requires.env` | Каждая переменная окружения должна существовать в процессе или конфигурации |
    | `requires.config` | Каждый путь `openclaw.json` должен иметь истинное значение |
    | `os` | Фильтр платформ: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Установите `true`, чтобы пропустить все проверки и всегда включать навык |

    Полный справочник: [Skills — условия загрузки](/ru/tools/skills#gating).

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

    Ключ внедряется в процесс хоста только на время этого хода агента.
    Он не передаётся в песочницу — см.
    [переменные окружения в песочнице](/ru/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Создание предложения через Skill Workshop

Для навыков, подготовленных агентом, или когда перед активацией навыка требуется проверка оператором,
используйте предложения [Skill Workshop](/ru/tools/skill-workshop), а не записывайте
`SKILL.md` напрямую.

```bash
# Предложить совершенно новый навык
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Предложить обновление существующего навыка
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

Используйте `--proposal-dir`, если предложение содержит вспомогательные файлы:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

Каталог должен содержать `PROPOSAL.md` в своём корне. Вспомогательные файлы размещаются в
`assets/`, `examples/`, `references/`, `scripts/` или `templates/`.

После проверки:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Полный жизненный цикл предложения описан в разделе [Skill Workshop](/ru/tools/skill-workshop).

## Публикация в ClawHub

<Steps>
  <Step title="Убедитесь, что ваш SKILL.md заполнен">
    Убедитесь, что заданы `name`, `description` и все необходимые поля
    условий загрузки `metadata.openclaw`. Добавьте URL `homepage`, если у вас есть страница проекта.
  </Step>
  <Step title="Установите автономный ClawHub CLI и войдите в систему">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Опубликуйте навык">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Добавьте `--version <version>` или `--owner <owner>`, чтобы переопределить автоматически определённую
    версию или опубликовать навык от имени определённого владельца. Полный процесс, область владельца и другие
    команды обслуживания (`clawhub sync`, `clawhub skill rename`, ...) описаны в разделах
    [ClawHub — публикация](/ru/clawhub/publishing) и
    [ClawHub CLI](/ru/clawhub/cli).

  </Step>
</Steps>

## Рекомендации

<Tip>
  - **Будьте лаконичны** — указывайте модели, *что* делать, а не как быть ИИ.
  - **Безопасность прежде всего** — если ваш навык использует `exec`, убедитесь, что промпты не допускают
    внедрения произвольных команд из недоверенных входных данных.
  - **Тестируйте локально** — перед публикацией используйте `openclaw agent --message "..."`.
  - **Используйте ClawHub** — прежде чем создавать навык с нуля, просмотрите навыки сообщества на [clawhub.ai](https://clawhub.ai).
</Tip>

## Связанные разделы

<CardGroup cols={2}>
  <Card title="Справочник по Skills" href="/ru/tools/skills" icon="puzzle-piece">
    Порядок загрузки, условия загрузки, списки разрешений и формат SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений для навыков, подготовленных агентом.
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
