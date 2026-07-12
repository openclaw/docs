---
read_when:
    - Ви переходите з Claude Code або Claude Desktop і хочете зберегти інструкції, сервери MCP та Skills
    - Вам потрібно розуміти, що OpenClaw імпортує автоматично, а що залишається лише в архіві
summary: Перенесіть локальний стан Claude Code і Claude Desktop до OpenClaw за допомогою попереднього перегляду імпорту
title: Перехід із Claude
x-i18n:
    generated_at: "2026-07-12T13:23:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw імпортує локальний стан Claude за допомогою вбудованого постачальника міграції Claude. Перед зміною стану постачальник показує попередній перегляд кожного елемента, приховує секрети в планах і звітах та створює перевірену резервну копію перед застосуванням.

<Note>
Імпорт під час початкового налаштування потребує нового налаштування OpenClaw. Якщо у вас уже є локальний стан OpenClaw, спочатку скиньте конфігурацію, облікові дані, сеанси й робочий простір або скористайтеся безпосередньо `openclaw migrate` з `--overwrite` після перегляду плану.
</Note>

## Два способи імпорту

<Tabs>
  <Tab title="Майстер початкового налаштування">
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
    Використовуйте `openclaw migrate` для запусків зі сценаріїв або повторюваних запусків. Повний довідник див. у розділі [`openclaw migrate`](/uk/cli/migrate).

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
    - Вміст файлів проєкту `CLAUDE.md` і `.claude/CLAUDE.md` копіюється або додається до `AGENTS.md` у робочому просторі агента OpenClaw.
    - Вміст користувацького файлу `~/.claude/CLAUDE.md` додається до `USER.md` у робочому просторі.

  </Accordion>
  <Accordion title="Сервери MCP">
    Визначення серверів MCP імпортуються за наявності з проєктного `.mcp.json`, файлу Claude Code `~/.claude.json` і файлу Claude Desktop `claude_desktop_config.json`.
  </Accordion>
  <Accordion title="Skills і команди">
    - Skills Claude, що мають файл `SKILL.md`, копіюються до каталогу Skills у робочому просторі OpenClaw.
    - Markdown-файли команд Claude у `.claude/commands/` або `~/.claude/commands/` перетворюються на Skills OpenClaw із `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Що залишається лише в архіві

Постачальник копіює наведені нижче елементи до звіту про міграцію для ручного перегляду, але **не** завантажує їх до активної конфігурації OpenClaw:

- перехоплювачі Claude
- дозволи Claude і широкі списки дозволених інструментів
- стандартні значення середовища Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- субагенти Claude у `.claude/agents/` або `~/.claude/agents/`
- кеші, плани та каталоги історії проєктів Claude Code
- розширення Claude Desktop і збережені в ОС облікові дані

OpenClaw відмовляється автоматично виконувати перехоплювачі, довіряти спискам дозволів або декодувати непрозорий стан облікових даних OAuth і Desktop. Після перегляду архіву вручну перенесіть потрібні елементи.

## Вибір джерела

Без `--from` OpenClaw перевіряє стандартний домашній каталог Claude Code `~/.claude`, файл вибіркового стану Claude Code `~/.claude.json` і конфігурацію MCP Claude Desktop у macOS.

Коли `--from` указує на корінь проєкту, OpenClaw імпортує лише файли Claude цього проєкту, як-от `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` і `.mcp.json`. Під час імпорту з кореня проєкту глобальний домашній каталог Claude не зчитується.

## Рекомендований процес

<Steps>
  <Step title="Перегляньте план">
    ```bash
    openclaw migrate claude --dry-run
    ```

    У плані перелічено все, що буде змінено, зокрема конфлікти, пропущені елементи та конфіденційні значення, приховані у вкладених полях MCP `env` або `headers`.

  </Step>
  <Step title="Застосуйте зі створенням резервної копії">
    ```bash
    openclaw migrate apply claude --yes
    ```

    Перед застосуванням OpenClaw створює та перевіряє резервну копію.

  </Step>
  <Step title="Запустіть діагностику">
    ```bash
    openclaw doctor
    ```

    [Діагностика](/uk/gateway/doctor) перевіряє наявність проблем із конфігурацією або станом після імпорту.

  </Step>
  <Step title="Перезапустіть і перевірте">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Переконайтеся, що Gateway працює справно, а імпортовані інструкції, сервери MCP і Skills завантажено.

  </Step>
</Steps>

## Обробка конфліктів

Застосування відмовляється продовжувати, коли план повідомляє про конфлікти (файл або значення конфігурації вже існує в цільовому розташуванні).

<Warning>
Повторно запускайте з `--overwrite`, лише якщо ви навмисно замінюєте наявну ціль. Постачальники все одно можуть записувати резервні копії перезаписаних файлів на рівні окремих елементів до каталогу звіту про міграцію.
</Warning>

Для нового встановлення OpenClaw конфлікти нетипові. Зазвичай вони виникають, коли ви повторно запускаєте імпорт у налаштуванні, яке вже містить користувацькі зміни.

## Виведення JSON для автоматизації

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--yes` є обов’язковим для `migrate apply` поза інтерактивним терміналом; без нього OpenClaw повертає помилку замість застосування, тому сценарії та CI мають явно передавати `--yes`. Спочатку виконайте попередній перегляд за допомогою `--dry-run --json`, а коли план матиме належний вигляд, застосуйте його за допомогою `--json --yes`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Стан Claude розташований поза ~/.claude">
    Передайте `--from /actual/path` (CLI) або `--import-source /actual/path` (початкове налаштування).
  </Accordion>
  <Accordion title="Початкове налаштування відмовляється імпортувати в наявне налаштування">
    Імпорт під час початкового налаштування потребує нового налаштування. Або скиньте стан і повторіть початкове налаштування, або скористайтеся безпосередньо `openclaw migrate apply claude`, що підтримує `--overwrite` і явне керування резервними копіями.
  </Accordion>
  <Accordion title="Сервери MCP із Claude Desktop не імпортувалися">
    Claude Desktop зчитує `claude_desktop_config.json` зі шляху, що залежить від платформи. Якщо OpenClaw не виявив його автоматично, укажіть у `--from` каталог цього файлу.
  </Accordion>
  <Accordion title="Команди Claude стали Skills із вимкненим викликом моделлю">
    Так передбачено. Команди Claude запускає користувач, тому OpenClaw імпортує їх як Skills із `disable-model-invocation: true`. Відредагуйте frontmatter кожного Skill, якщо хочете, щоб агент викликав їх автоматично.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [`openclaw migrate`](/uk/cli/migrate): повний довідник CLI, контракт Plugin і структури JSON.
- [Посібник із міграції](/uk/install/migrating): усі шляхи міграції.
- [Міграція з Hermes](/uk/install/migrating-hermes): інший шлях імпорту між системами.
- [Початкове налаштування](/uk/cli/onboard): процес майстра та прапорці неінтерактивного режиму.
- [Діагностика](/uk/gateway/doctor): перевірка стану після міграції.
- [Робочий простір агента](/uk/concepts/agent-workspace): де розташовані `AGENTS.md`, `USER.md` і Skills.
