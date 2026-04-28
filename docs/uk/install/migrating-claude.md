---
read_when:
    - Ви переходите з Claude Code або Claude Desktop і хочете зберегти інструкції, MCP-сервери та Skills
    - Потрібно розуміти, що OpenClaw імпортує автоматично, а що залишається лише в архіві
summary: Перемістіть локальний стан Claude Code і Claude Desktop в OpenClaw за допомогою імпорту з попереднім переглядом
title: Міграція з Claude
x-i18n:
    generated_at: "2026-04-28T11:17:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw імпортує локальний стан Claude через вбудований провайдер міграції Claude. Провайдер попередньо показує кожен елемент перед зміною стану, редагує секрети в планах і звітах та створює перевірену резервну копію перед застосуванням.

<Note>
Імпорт під час онбордингу потребує свіжого налаштування OpenClaw. Якщо у вас уже є локальний стан OpenClaw, спершу скиньте конфігурацію, облікові дані, сеанси та робочий простір або скористайтеся `openclaw migrate` напряму з `--overwrite` після перегляду плану.
</Note>

## Два способи імпорту

<Tabs>
  <Tab title="Майстер онбордингу">
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
    Використовуйте `openclaw migrate` для скриптованих або повторюваних запусків. Повну довідку див. у [`openclaw migrate`](/uk/cli/migrate).

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
    - Вміст проєктних `CLAUDE.md` і `.claude/CLAUDE.md` копіюється або додається до `AGENTS.md` у робочому просторі агента OpenClaw.
    - Вміст користувацького `~/.claude/CLAUDE.md` додається до `USER.md` у робочому просторі.

  </Accordion>
  <Accordion title="MCP-сервери">
    Визначення MCP-серверів імпортуються з проєктного `.mcp.json`, Claude Code `~/.claude.json` і Claude Desktop `claude_desktop_config.json`, якщо вони наявні.
  </Accordion>
  <Accordion title="Skills і команди">
    - Claude Skills із файлом `SKILL.md` копіюються до каталогу Skills робочого простору OpenClaw.
    - Markdown-файли команд Claude у `.claude/commands/` або `~/.claude/commands/` перетворюються на OpenClaw Skills із `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Що залишається лише в архіві

Провайдер копіює це до звіту міграції для ручного перегляду, але **не** завантажує в активну конфігурацію OpenClaw:

- Хуки Claude
- Дозволи Claude і широкі списки дозволених інструментів
- Стандартні значення середовища Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Субагенти Claude у `.claude/agents/` або `~/.claude/agents/`
- Каталоги кешів, планів та історії проєктів Claude Code
- Розширення Claude Desktop і облікові дані, збережені ОС

OpenClaw відмовляється автоматично виконувати хуки, довіряти спискам дозволів або декодувати непрозорий стан облікових даних OAuth і Desktop. Перенесіть потрібне вручну після перегляду архіву.

## Вибір джерела

Без `--from` OpenClaw перевіряє типовий домашній каталог Claude Code у `~/.claude`, вибраний файл стану Claude Code `~/.claude.json` і конфігурацію MCP Claude Desktop на macOS.

Коли `--from` вказує на корінь проєкту, OpenClaw імпортує лише файли Claude цього проєкту, як-от `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` і `.mcp.json`. Під час імпорту з кореня проєкту він не читає ваш глобальний домашній каталог Claude.

## Рекомендований процес

<Steps>
  <Step title="Попередньо перегляньте план">
    ```bash
    openclaw migrate claude --dry-run
    ```

    У плані перелічено все, що буде змінено, зокрема конфлікти, пропущені елементи та чутливі значення, відредаговані з вкладених полів MCP `env` або `headers`.

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

    [Doctor](/uk/gateway/doctor) перевіряє проблеми конфігурації або стану після імпорту.

  </Step>
  <Step title="Перезапустіть і перевірте">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Переконайтеся, що Gateway справний, а імпортовані інструкції, MCP-сервери та Skills завантажено.

  </Step>
</Steps>

## Обробка конфліктів

Застосування відмовляється продовжувати, коли план повідомляє про конфлікти (файл або значення конфігурації вже існує в цільовому місці).

<Warning>
Повторно запускайте з `--overwrite` лише тоді, коли заміна наявної цілі є навмисною. Провайдери все одно можуть записувати резервні копії на рівні елементів для перезаписаних файлів у каталозі звіту міграції.
</Warning>

Для свіжого встановлення OpenClaw конфлікти незвичні. Вони зазвичай з’являються, коли ви повторно запускаєте імпорт у налаштуванні, яке вже має користувацькі зміни.

## Вивід JSON для автоматизації

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

З `--json` і без `--yes` застосування друкує план і не змінює стан. Це найбезпечніший режим для CI і спільних скриптів.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Стан Claude розміщений поза ~/.claude">
    Передайте `--from /actual/path` (CLI) або `--import-source /actual/path` (онбординг).
  </Accordion>
  <Accordion title="Онбординг відмовляється імпортувати в наявне налаштування">
    Імпорт під час онбордингу потребує свіжого налаштування. Або скиньте стан і повторіть онбординг, або скористайтеся `openclaw migrate apply claude` напряму, що підтримує `--overwrite` і явне керування резервними копіями.
  </Accordion>
  <Accordion title="MCP-сервери з Claude Desktop не імпортувалися">
    Claude Desktop читає `claude_desktop_config.json` зі шляху, специфічного для платформи. Вкажіть `--from` на каталог цього файла, якщо OpenClaw не виявив його автоматично.
  </Accordion>
  <Accordion title="Команди Claude стали Skills із вимкненим викликом моделі">
    Це очікувана поведінка. Команди Claude запускає користувач, тому OpenClaw імпортує їх як Skills із `disable-model-invocation: true`. Відредагуйте frontmatter кожного Skill, якщо хочете, щоб агент викликав їх автоматично.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [`openclaw migrate`](/uk/cli/migrate): повна довідка CLI, контракт Plugin і форми JSON.
- [Посібник із міграції](/uk/install/migrating): усі шляхи міграції.
- [Міграція з Hermes](/uk/install/migrating-hermes): інший шлях міжсистемного імпорту.
- [Онбординг](/uk/cli/onboard): процес майстра й неінтерактивні прапорці.
- [Doctor](/uk/gateway/doctor): перевірка справності після міграції.
- [Робочий простір агента](/uk/concepts/agent-workspace): де розміщено `AGENTS.md`, `USER.md` і Skills.
