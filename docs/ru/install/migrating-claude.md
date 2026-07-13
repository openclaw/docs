---
read_when:
    - Вы переходите с Claude Code или Claude Desktop и хотите сохранить инструкции, серверы MCP и навыки
    - Вам нужно понимать, что OpenClaw импортирует автоматически, а что остаётся только в архиве
summary: Перенесите локальное состояние Claude Code и Claude Desktop в OpenClaw с предварительным просмотром импорта
title: Миграция с Claude
x-i18n:
    generated_at: "2026-07-13T18:19:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw импортирует локальное состояние Claude с помощью встроенного провайдера миграции Claude. Перед изменением состояния провайдер показывает предварительный список всех элементов, скрывает секреты в планах и отчётах и создаёт проверенную резервную копию перед применением.

<Note>
Для импорта при первоначальной настройке требуется новая конфигурация OpenClaw. Если у вас уже есть локальное состояние OpenClaw, сначала сбросьте конфигурацию, учётные данные, сеансы и рабочее пространство либо используйте `openclaw migrate` напрямую с `--overwrite` после проверки плана.
</Note>

## Два способа импорта

<Tabs>
  <Tab title="Мастер первоначальной настройки">
    Мастер предлагает импорт из Claude, когда обнаруживает локальное состояние Claude.

    ```bash
    openclaw onboard --flow import
    ```

    Либо укажите конкретный источник:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Используйте `openclaw migrate` для запуска по сценарию или повторяемых запусков. Полное справочное руководство см. в разделе [`openclaw migrate`](/ru/cli/migrate).

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Добавьте `--from <path>`, чтобы импортировать конкретный домашний каталог Claude Code или корень проекта.

  </Tab>
</Tabs>

## Что импортируется

<AccordionGroup>
  <Accordion title="Инструкции и память">
    - Содержимое файлов проекта `CLAUDE.md` и `.claude/CLAUDE.md` копируется или добавляется в `AGENTS.md` рабочего пространства агента OpenClaw.
    - Содержимое пользовательского файла `~/.claude/CLAUDE.md` добавляется в `USER.md` рабочего пространства.

  </Accordion>
  <Accordion title="Серверы MCP">
    Определения серверов MCP импортируются при наличии из файла проекта `.mcp.json`, файла Claude Code `~/.claude.json` и файла Claude Desktop `claude_desktop_config.json`.
  </Accordion>
  <Accordion title="Skills и команды">
    - Skills Claude с файлом `SKILL.md` копируются в каталог Skills рабочего пространства OpenClaw.
    - Markdown-файлы команд Claude в `.claude/commands/` или `~/.claude/commands/` преобразуются в Skills OpenClaw с `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Что остаётся только в архиве

Провайдер копирует перечисленные ниже данные в отчёт о миграции для ручной проверки, но **не** загружает их в действующую конфигурацию OpenClaw:

- Хуки Claude
- Разрешения Claude и широкие списки разрешённых инструментов
- Значения среды Claude по умолчанию
- `CLAUDE.local.md`
- `.claude/rules/`
- Субагенты Claude в `.claude/agents/` или `~/.claude/agents/`
- Каталоги кешей, планов и истории проектов Claude Code
- Расширения Claude Desktop и учётные данные, хранящиеся в ОС

OpenClaw не выполняет хуки, не считает доверенными списки разрешений и не декодирует автоматически непрозрачное состояние учётных данных OAuth и Desktop. После проверки архива перенесите нужные данные вручную.

## Выбор источника

Если параметр `--from` не указан, OpenClaw проверяет стандартный домашний каталог Claude Code по пути `~/.claude`, файл состояния выборки Claude Code `~/.claude.json` и конфигурацию MCP Claude Desktop в macOS.

Когда `--from` указывает на корень проекта, OpenClaw импортирует только файлы Claude этого проекта, например `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` и `.mcp.json`. Во время импорта из корня проекта глобальный домашний каталог Claude не считывается.

## Рекомендуемый порядок действий

<Steps>
  <Step title="Предварительно просмотрите план">
    ```bash
    openclaw migrate claude --dry-run
    ```

    В плане перечислено всё, что будет изменено, включая конфликты, пропущенные элементы и конфиденциальные значения, скрытые во вложенных полях MCP `env` или `headers`.

  </Step>
  <Step title="Примените с резервным копированием">
    ```bash
    openclaw migrate apply claude --yes
    ```

    Перед применением OpenClaw создаёт и проверяет резервную копию.

  </Step>
  <Step title="Запустите диагностику">
    ```bash
    openclaw doctor
    ```

    [Диагностика](/ru/gateway/doctor) проверяет наличие проблем с конфигурацией или состоянием после импорта.

  </Step>
  <Step title="Перезапустите и проверьте">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Убедитесь, что Gateway работает нормально, а импортированные инструкции, серверы MCP и Skills загружены.

  </Step>
</Steps>

## Обработка конфликтов

Применение не продолжается, если в плане указаны конфликты: файл или значение конфигурации уже существует в целевом расположении.

<Warning>
Повторно запускайте с `--overwrite` только в том случае, если вы намеренно хотите заменить существующие целевые данные. Провайдеры всё равно могут создавать в каталоге отчёта о миграции резервные копии отдельных перезаписываемых файлов.
</Warning>

При новой установке OpenClaw конфликты встречаются редко. Обычно они возникают при повторном импорте в конфигурацию, которая уже содержит пользовательские изменения.

## Вывод JSON для автоматизации

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Для `migrate apply` вне интерактивного терминала требуется `--yes`; без него OpenClaw возвращает ошибку вместо применения, поэтому сценарии и CI должны явно передавать `--yes`. Сначала выполните предварительный просмотр с `--dry-run --json`, а когда план будет выглядеть правильно, примените его с `--json --yes`.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Состояние Claude находится вне ~/.claude">
    Передайте `--from /actual/path` для CLI или `--import-source /actual/path` для первоначальной настройки.
  </Accordion>
  <Accordion title="Первоначальная настройка отказывается выполнять импорт в существующую конфигурацию">
    Для импорта при первоначальной настройке требуется новая конфигурация. Сбросьте состояние и повторите первоначальную настройку либо используйте `openclaw migrate apply claude` напрямую, где поддерживаются `--overwrite` и явное управление резервным копированием.
  </Accordion>
  <Accordion title="Серверы MCP из Claude Desktop не импортировались">
    Claude Desktop считывает `claude_desktop_config.json` из пути, зависящего от платформы. Если OpenClaw не обнаружил его автоматически, укажите каталог этого файла в `--from`.
  </Accordion>
  <Accordion title="Команды Claude преобразовались в Skills с отключённым вызовом моделью">
    Это предусмотрено. Команды Claude запускаются пользователем, поэтому OpenClaw импортирует их как Skills с `disable-model-invocation: true`. Измените метаданные frontmatter каждого Skill, если хотите, чтобы агент вызывал их автоматически.
  </Accordion>
</AccordionGroup>

## Связанные материалы

- [`openclaw migrate`](/ru/cli/migrate): полное справочное руководство по CLI, контракту плагина и структурам JSON.
- [Руководство по миграции](/ru/install/migrating): все пути миграции.
- [Миграция с Hermes](/ru/install/migrating-hermes): другой способ импорта между системами.
- [Первоначальная настройка](/ru/cli/onboard): работа мастера и флаги неинтерактивного режима.
- [Диагностика](/ru/gateway/doctor): проверка состояния после миграции.
- [Рабочее пространство агента](/ru/concepts/agent-workspace): где находятся `AGENTS.md`, `USER.md` и Skills.
