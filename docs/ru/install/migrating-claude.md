---
read_when:
    - Вы переходите с Claude Code или Claude Desktop и хотите сохранить инструкции, серверы MCP и Skills
    - Вам нужно понимать, что OpenClaw импортирует автоматически, а что остаётся только в архиве
summary: Перенос локального состояния Claude Code и Claude Desktop в OpenClaw с предварительным просмотром импорта
title: Переход с Claude
x-i18n:
    generated_at: "2026-07-12T11:30:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw импортирует локальное состояние Claude через встроенный провайдер миграции Claude. Перед изменением состояния провайдер показывает предварительный список всех элементов, скрывает секреты в планах и отчётах и создаёт проверенную резервную копию перед применением.

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

    Или укажите конкретный источник:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Используйте `openclaw migrate` для запуска по сценарию или повторяемого выполнения. Полное справочное описание см. в разделе [`openclaw migrate`](/ru/cli/migrate).

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
    Определения серверов MCP импортируются при их наличии из файла проекта `.mcp.json`, файла Claude Code `~/.claude.json` и файла Claude Desktop `claude_desktop_config.json`.
  </Accordion>
  <Accordion title="Skills и команды">
    - Skills Claude, содержащие файл `SKILL.md`, копируются в каталог Skills рабочего пространства OpenClaw.
    - Markdown-файлы команд Claude из `.claude/commands/` или `~/.claude/commands/` преобразуются в Skills OpenClaw с параметром `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Что остаётся только в архиве

Провайдер копирует перечисленные ниже элементы в отчёт о миграции для ручной проверки, но **не** загружает их в действующую конфигурацию OpenClaw:

- хуки Claude
- разрешения Claude и широкие списки разрешённых инструментов
- переменные среды Claude по умолчанию
- `CLAUDE.local.md`
- `.claude/rules/`
- субагенты Claude в `.claude/agents/` или `~/.claude/agents/`
- каталоги кешей, планов и истории проектов Claude Code
- расширения Claude Desktop и учётные данные, хранящиеся в операционной системе

OpenClaw не выполняет хуки, не доверяет спискам разрешений и не декодирует автоматически непрозрачное состояние OAuth и учётных данных Desktop. После проверки архива перенесите нужные элементы вручную.

## Выбор источника

Без `--from` OpenClaw проверяет стандартный домашний каталог Claude Code `~/.claude`, файл выборочного состояния Claude Code `~/.claude.json` и конфигурацию MCP Claude Desktop в macOS.

Когда `--from` указывает на корень проекта, OpenClaw импортирует только файлы Claude этого проекта, например `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` и `.mcp.json`. При импорте из корня проекта глобальный домашний каталог Claude не считывается.

## Рекомендуемый порядок действий

<Steps>
  <Step title="Предварительно просмотрите план">
    ```bash
    openclaw migrate claude --dry-run
    ```

    План содержит список всех предстоящих изменений, включая конфликты, пропущенные элементы и конфиденциальные значения, скрытые во вложенных полях MCP `env` или `headers`.

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

    Убедитесь, что Gateway работает исправно, а импортированные инструкции, серверы MCP и Skills загружены.

  </Step>
</Steps>

## Обработка конфликтов

Применение не продолжается, если план сообщает о конфликтах — файл или значение конфигурации уже существует в целевом расположении.

<Warning>
Повторно запускайте команду с `--overwrite` только при намеренной замене существующего целевого элемента. Провайдеры по-прежнему могут создавать резервные копии отдельных перезаписываемых файлов в каталоге отчёта о миграции.
</Warning>

В новой установке OpenClaw конфликты возникают редко. Обычно они появляются при повторном импорте в конфигурацию, уже содержащую пользовательские изменения.

## Вывод JSON для автоматизации

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

При выполнении `migrate apply` вне интерактивного терминала требуется `--yes`; без него OpenClaw завершает работу с ошибкой вместо применения, поэтому сценарии и CI должны явно передавать `--yes`. Сначала выполните предварительный просмотр с `--dry-run --json`, а когда план будет выглядеть правильно, примените его с `--json --yes`.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Состояние Claude находится вне ~/.claude">
    Передайте `--from /actual/path` в CLI или `--import-source /actual/path` при первоначальной настройке.
  </Accordion>
  <Accordion title="Первоначальная настройка не позволяет импортировать в существующую конфигурацию">
    Для импорта при первоначальной настройке требуется новая конфигурация. Сбросьте состояние и повторите первоначальную настройку либо используйте напрямую `openclaw migrate apply claude`, который поддерживает `--overwrite` и явное управление резервным копированием.
  </Accordion>
  <Accordion title="Серверы MCP из Claude Desktop не импортировались">
    Claude Desktop считывает `claude_desktop_config.json` из пути, зависящего от платформы. Если OpenClaw не обнаружил его автоматически, укажите в `--from` каталог, содержащий этот файл.
  </Accordion>
  <Accordion title="Команды Claude преобразовались в Skills с отключённым вызовом моделью">
    Это предусмотрено. Команды Claude запускаются пользователем, поэтому OpenClaw импортирует их как Skills с параметром `disable-model-invocation: true`. Если вы хотите, чтобы агент вызывал их автоматически, измените метаданные frontmatter каждого Skill.
  </Accordion>
</AccordionGroup>

## Связанные разделы

- [`openclaw migrate`](/ru/cli/migrate): полное справочное описание CLI, контракт Plugin и структуры JSON.
- [Руководство по миграции](/ru/install/migrating): все пути миграции.
- [Миграция из Hermes](/ru/install/migrating-hermes): другой способ импорта между системами.
- [Первоначальная настройка](/ru/cli/onboard): работа мастера и флаги неинтерактивного режима.
- [Диагностика](/ru/gateway/doctor): проверка состояния после миграции.
- [Рабочее пространство агента](/ru/concepts/agent-workspace): расположение `AGENTS.md`, `USER.md` и Skills.
