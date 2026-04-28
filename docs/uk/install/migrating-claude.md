---
read_when:
    - Ви переходите з Claude Code або Claude Desktop і хочете зберегти інструкції, сервери MCP та Skills
    - Потрібно зрозуміти, що OpenClaw імпортує автоматично, а що залишається лише в архіві.
summary: Перемістіть локальний стан Claude Code і Claude Desktop до OpenClaw за допомогою імпорту з попереднім переглядом
title: Міграція з Claude
x-i18n:
    generated_at: "2026-04-27T11:00:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bce8e02d56db65a0123e8a941558351ad67bd6e279a0225e03b456ebd8bbac7
    source_path: install/migrating-claude.md
    workflow: 15
---

OpenClaw імпортує локальний стан Claude через вбудованого провайдера міграції Claude. Провайдер показує попередній перегляд кожного елемента перед зміною стану, редагує секрети в планах і звітах та створює перевірену резервну копію перед застосуванням.

<Note>
Імпорт під час onboarding вимагає свіжого налаштування OpenClaw. Якщо у вас уже є локальний стан OpenClaw, спочатку скиньте config, credentials, sessions і workspace, або використайте `openclaw migrate` безпосередньо з `--overwrite` після перегляду плану.
</Note>

## Два способи імпорту

<Tabs>
  <Tab title="Майстер onboarding">
    Майстер пропонує Claude, коли виявляє локальний стан Claude.

    ```bash
    openclaw onboard --flow import
    ```

    Або вкажіть конкретне джерело:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Використовуйте `openclaw migrate` для сценаріїв або повторюваних запусків. Повний довідник див. у [`openclaw migrate`](/uk/cli/migrate).

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Додайте `--from <path>`, щоб імпортувати конкретний домашній каталог Claude Code або корінь проєкту.

  </Tab>
</Tabs>

## Що імпортується

<AccordionGroup>
  <Accordion title="Інструкції та пам’ять">
    - Вміст проєктних `CLAUDE.md` і `.claude/CLAUDE.md` копіюється або додається до `AGENTS.md` у workspace агента OpenClaw.
    - Вміст користувацького `~/.claude/CLAUDE.md` додається до `USER.md` у workspace.

  </Accordion>
  <Accordion title="Сервери MCP">
    Визначення серверів MCP імпортуються з проєктного `.mcp.json`, Claude Code `~/.claude.json` і Claude Desktop `claude_desktop_config.json`, якщо вони присутні.
  </Accordion>
  <Accordion title="Skills і команди">
    - Claude Skills із файлом `SKILL.md` копіюються до каталогу Skills у workspace OpenClaw.
    - Markdown-файли команд Claude у `.claude/commands/` або `~/.claude/commands/` перетворюються на Skills OpenClaw з `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Що залишається лише в архіві

Провайдер копіює це до звіту міграції для ручної перевірки, але **не** завантажує до активного config OpenClaw:

- hooks Claude
- permissions Claude і широкі allowlist інструментів
- defaults середовища Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- subagents Claude у `.claude/agents/` або `~/.claude/agents/`
- кеші, плани та каталоги історії проєктів Claude Code
- розширення Claude Desktop і credentials, що зберігаються в ОС

OpenClaw автоматично відмовляється виконувати hooks, довіряти permission allowlist або декодувати непрозорий стан OAuth і credentials Desktop. Перенесіть потрібне вручну після перевірки архіву.

## Вибір джерела

Без `--from` OpenClaw перевіряє типовий домашній каталог Claude Code у `~/.claude`, вибірковий файл стану Claude Code `~/.claude.json` і config MCP Claude Desktop на macOS.

Коли `--from` вказує на корінь проєкту, OpenClaw імпортує лише файли Claude цього проєкту, такі як `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` і `.mcp.json`. Під час імпорту з кореня проєкту він не читає ваш глобальний домашній каталог Claude.

## Рекомендований процес

<Steps>
  <Step title="Перегляньте план">
    ```bash
    openclaw migrate claude --dry-run
    ```

    План показує все, що буде змінено, включно з конфліктами, пропущеними елементами та чутливими значеннями, прихованими у вкладених полях MCP `env` або `headers`.

  </Step>
  <Step title="Застосуйте з резервною копією">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw створює та перевіряє резервну копію перед застосуванням.

  </Step>
  <Step title="Запустіть doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/uk/gateway/doctor) перевіряє проблеми config або стану після імпорту.

  </Step>
  <Step title="Перезапустіть і перевірте">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Переконайтеся, що gateway працює справно та що ваші імпортовані інструкції, сервери MCP і Skills завантажені.

  </Step>
</Steps>

## Обробка конфліктів

Apply відмовляється продовжувати, коли план повідомляє про конфлікти (файл або значення config уже існує в цільовому місці).

<Warning>
Повторно запускайте з `--overwrite` лише тоді, коли заміна наявної цілі є навмисною. Провайдери все одно можуть записувати резервні копії окремих елементів для перезаписаних файлів у каталог звіту міграції.
</Warning>

Для свіжого встановлення OpenClaw конфлікти нетипові. Зазвичай вони з’являються, коли ви повторно запускаєте імпорт у середовищі, де вже є користувацькі зміни.

## Вивід JSON для автоматизації

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

З `--json` і без `--yes` apply виводить план і не змінює стан. Це найбезпечніший режим для CI і спільних сценаріїв.

## Усунення проблем

<AccordionGroup>
  <Accordion title="Стан Claude знаходиться поза ~/.claude">
    Передайте `--from /actual/path` (CLI) або `--import-source /actual/path` (onboarding).
  </Accordion>
  <Accordion title="Onboarding відмовляється імпортувати в наявне налаштування">
    Імпорт під час onboarding вимагає свіжого налаштування. Або скиньте стан і повторно пройдіть onboarding, або використайте `openclaw migrate apply claude` безпосередньо, що підтримує `--overwrite` і явне керування резервними копіями.
  </Accordion>
  <Accordion title="Сервери MCP з Claude Desktop не імпортувалися">
    Claude Desktop читає `claude_desktop_config.json` зі специфічного для платформи шляху. Вкажіть `--from` на каталог цього файлу, якщо OpenClaw не виявив його автоматично.
  </Accordion>
  <Accordion title="Команди Claude стали Skills з вимкненим викликом моделі">
    Так і задумано. Команди Claude запускаються користувачем, тому OpenClaw імпортує їх як Skills з `disable-model-invocation: true`. Відредагуйте frontmatter кожного skill, якщо хочете, щоб агент викликав їх автоматично.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [`openclaw migrate`](/uk/cli/migrate): повний довідник CLI, контракт plugin і форми JSON.
- [Посібник з міграції](/uk/install/migrating): усі шляхи міграції.
- [Міграція з Hermes](/uk/install/migrating-hermes): інший шлях міжсистемного імпорту.
- [Onboarding](/uk/cli/onboard): сценарій майстра та неінтерактивні прапорці.
- [Doctor](/uk/gateway/doctor): перевірка стану після міграції.
- [Workspace агента](/uk/concepts/agent-workspace): де живуть `AGENTS.md`, `USER.md` і Skills.
