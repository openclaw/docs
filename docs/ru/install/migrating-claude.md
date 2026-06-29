---
read_when:
    - Вы переходите с Claude Code или Claude Desktop и хотите сохранить инструкции, серверы MCP и Skills
    - Нужно понимать, что OpenClaw импортирует автоматически, а что остается только в архиве.
summary: Перенос локального состояния Claude Code и Claude Desktop в OpenClaw с предварительным просмотром импорта
title: Миграция с Claude
x-i18n:
    generated_at: "2026-06-28T23:06:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw импортирует локальное состояние Claude через встроенный поставщик миграции Claude. Поставщик предварительно показывает каждый элемент перед изменением состояния, скрывает секреты в планах и отчетах и создает проверенную резервную копию перед применением.

<Note>
Импорт при онбординге требует новой настройки OpenClaw. Если у вас уже есть локальное состояние OpenClaw, сначала сбросьте конфигурацию, учетные данные, сеансы и рабочую область либо используйте `openclaw migrate` напрямую с `--overwrite` после просмотра плана.
</Note>

## Два способа импорта

<Tabs>
  <Tab title="Мастер онбординга">
    Мастер предлагает Claude, когда обнаруживает локальное состояние Claude.

    ```bash
    openclaw onboard --flow import
    ```

    Или укажите конкретный источник:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Используйте `openclaw migrate` для сценарных или повторяемых запусков. Полную справку см. в [`openclaw migrate`](/ru/cli/migrate).

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
    - Содержимое проектных `CLAUDE.md` и `.claude/CLAUDE.md` копируется или добавляется в `AGENTS.md` рабочей области агента OpenClaw.
    - Содержимое пользовательского `~/.claude/CLAUDE.md` добавляется в `USER.md` рабочей области.

  </Accordion>
  <Accordion title="Серверы MCP">
    Определения серверов MCP импортируются из проектного `.mcp.json`, Claude Code `~/.claude.json` и Claude Desktop `claude_desktop_config.json`, если они существуют.
  </Accordion>
  <Accordion title="Skills и команды">
    - Skills Claude с файлом `SKILL.md` копируются в каталог Skills рабочей области OpenClaw.
    - Markdown-файлы команд Claude в `.claude/commands/` или `~/.claude/commands/` преобразуются в Skills OpenClaw с `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Что остается только в архиве

Поставщик копирует это в отчет о миграции для ручной проверки, но **не** загружает в активную конфигурацию OpenClaw:

- хуки Claude
- разрешения Claude и широкие списки разрешенных инструментов
- значения среды по умолчанию Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- субагенты Claude в `.claude/agents/` или `~/.claude/agents/`
- кэши, планы и каталоги истории проектов Claude Code
- расширения Claude Desktop и учетные данные, сохраненные ОС

OpenClaw отказывается автоматически выполнять хуки, доверять спискам разрешений или декодировать непрозрачное состояние учетных данных OAuth и Desktop. Перенесите нужное вручную после просмотра архива.

## Выбор источника

Без `--from` OpenClaw проверяет домашний каталог Claude Code по умолчанию в `~/.claude`, выборочный файл состояния Claude Code `~/.claude.json` и конфигурацию MCP Claude Desktop на macOS.

Когда `--from` указывает на корень проекта, OpenClaw импортирует только файлы Claude этого проекта, такие как `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` и `.mcp.json`. Во время импорта из корня проекта он не читает ваш глобальный домашний каталог Claude.

## Рекомендуемый процесс

<Steps>
  <Step title="Предварительно просмотрите план">
    ```bash
    openclaw migrate claude --dry-run
    ```

    В плане перечисляется все, что изменится, включая конфликты, пропущенные элементы и чувствительные значения, скрытые во вложенных полях MCP `env` или `headers`.

  </Step>
  <Step title="Примените с резервной копией">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw создает и проверяет резервную копию перед применением.

  </Step>
  <Step title="Запустите doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/ru/gateway/doctor) проверяет наличие проблем с конфигурацией или состоянием после импорта.

  </Step>
  <Step title="Перезапустите и проверьте">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Убедитесь, что Gateway исправен, а импортированные инструкции, серверы MCP и Skills загружены.

  </Step>
</Steps>

## Обработка конфликтов

Применение отказывается продолжать работу, когда план сообщает о конфликтах (файл или значение конфигурации уже существует в целевом расположении).

<Warning>
Повторно запускайте с `--overwrite` только тогда, когда замена существующей цели намеренная. Поставщики все равно могут записывать резервные копии уровня отдельных элементов для перезаписанных файлов в каталог отчета о миграции.
</Warning>

Для новой установки OpenClaw конфликты необычны. Обычно они появляются, когда вы повторно запускаете импорт в настройке, где уже есть пользовательские правки.

## Вывод JSON для автоматизации

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

С `--json` и без `--yes` применение печатает план и не изменяет состояние. Это самый безопасный режим для CI и общих скриптов.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Состояние Claude находится вне ~/.claude">
    Передайте `--from /actual/path` (CLI) или `--import-source /actual/path` (онбординг).
  </Accordion>
  <Accordion title="Онбординг отказывается импортировать в существующую настройку">
    Импорт при онбординге требует новой настройки. Либо сбросьте состояние и пройдите онбординг заново, либо используйте `openclaw migrate apply claude` напрямую; он поддерживает `--overwrite` и явное управление резервными копиями.
  </Accordion>
  <Accordion title="Серверы MCP из Claude Desktop не импортировались">
    Claude Desktop читает `claude_desktop_config.json` из пути, зависящего от платформы. Укажите `--from` на каталог этого файла, если OpenClaw не обнаружил его автоматически.
  </Accordion>
  <Accordion title="Команды Claude стали Skills с отключенным вызовом модели">
    Так задумано. Команды Claude запускаются пользователем, поэтому OpenClaw импортирует их как Skills с `disable-model-invocation: true`. Отредактируйте frontmatter каждого Skill, если хотите, чтобы агент вызывал их автоматически.
  </Accordion>
</AccordionGroup>

## См. также

- [`openclaw migrate`](/ru/cli/migrate): полная справка CLI, контракт Plugin и формы JSON.
- [Руководство по миграции](/ru/install/migrating): все пути миграции.
- [Миграция с Hermes](/ru/install/migrating-hermes): другой путь межсистемного импорта.
- [Онбординг](/ru/cli/onboard): поток мастера и флаги для неинтерактивного режима.
- [Doctor](/ru/gateway/doctor): проверка работоспособности после миграции.
- [Рабочая область агента](/ru/concepts/agent-workspace): где находятся `AGENTS.md`, `USER.md` и Skills.
