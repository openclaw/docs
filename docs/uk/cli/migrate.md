---
read_when:
    - Ви хочете перейти з Hermes або іншої агентної системи на OpenClaw
    - Ви додаєте провайдера міграцій, що належить плагіну
summary: Довідник CLI для `openclaw migrate` (імпорт стану з іншої агентної системи)
title: Міграція
x-i18n:
    generated_at: "2026-04-29T19:09:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Імпортуйте стан з іншої агентної системи через провайдер міграції, яким володіє Plugin. Вбудовані провайдери охоплюють [Claude](/uk/install/migrating-claude) і [Hermes](/uk/install/migrating-hermes); сторонні plugins можуть реєструвати додаткових провайдерів.

<Tip>
Для користувацьких покрокових інструкцій див. [Міграція з Claude](/uk/install/migrating-claude) і [Міграція з Hermes](/uk/install/migrating-hermes). [Центр міграції](/uk/install/migrating) перелічує всі шляхи.
</Tip>

## Команди

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Назва зареєстрованого провайдера міграції, наприклад `hermes`. Виконайте `openclaw migrate list`, щоб побачити встановлених провайдерів.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Побудувати план і вийти без зміни стану.
</ParamField>
<ParamField path="--from <path>" type="string">
  Перевизначити каталог стану джерела. Hermes за замовчуванням використовує `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Імпортувати підтримувані облікові дані. Вимкнено за замовчуванням.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Дозволити застосуванню замінювати наявні цільові об’єкти, коли план повідомляє про конфлікти.
</ParamField>
<ParamField path="--yes" type="boolean">
  Пропустити запит підтвердження. Обов’язково в неінтерактивному режимі.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Пропустити резервну копію перед застосуванням. Потребує `--force`, коли існує локальний стан OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Потрібно разом із `--no-backup`, коли застосування інакше відмовилося б пропускати резервну копію.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати план або результат застосування як JSON. З `--json` і без `--yes` застосування друкує план і не змінює стан.
</ParamField>

## Модель безпеки

`openclaw migrate` спершу показує попередній перегляд.

<AccordionGroup>
  <Accordion title="Попередній перегляд перед застосуванням">
    Провайдер повертає деталізований план до будь-яких змін, включно з конфліктами, пропущеними елементами та чутливими елементами. JSON-плани, вивід застосування та звіти міграції редагують вкладені ключі, схожі на секрети, як-от API-ключі, токени, заголовки авторизації, cookie та паролі.

    `openclaw migrate apply <provider>` попередньо показує план і запитує підтвердження перед зміною стану, якщо не встановлено `--yes`. У неінтерактивному режимі застосування потребує `--yes`.

  </Accordion>
  <Accordion title="Резервні копії">
    Застосування створює й перевіряє резервну копію OpenClaw перед застосуванням міграції. Якщо локального стану OpenClaw ще немає, крок резервного копіювання пропускається, і міграція може продовжитися. Щоб пропустити резервну копію, коли стан існує, передайте і `--no-backup`, і `--force`.
  </Accordion>
  <Accordion title="Конфлікти">
    Застосування відмовляється продовжувати, коли план має конфлікти. Перегляньте план, потім запустіть повторно з `--overwrite`, якщо заміна наявних цільових об’єктів є навмисною. Провайдери все ще можуть записувати резервні копії на рівні елементів для перезаписаних файлів у каталозі звіту міграції.
  </Accordion>
  <Accordion title="Секрети">
    Секрети ніколи не імпортуються за замовчуванням. Використовуйте `--include-secrets`, щоб імпортувати підтримувані облікові дані.
  </Accordion>
</AccordionGroup>

## Провайдер Claude

Вбудований провайдер Claude за замовчуванням виявляє стан Claude Code у `~/.claude`. Використовуйте `--from <path>`, щоб імпортувати певний домашній каталог Claude Code або корінь проєкту.

<Tip>
Для користувацьких покрокових інструкцій див. [Міграція з Claude](/uk/install/migrating-claude).
</Tip>

### Що імпортує Claude

- Проєктні `CLAUDE.md` і `.claude/CLAUDE.md` у робочий простір агента OpenClaw.
- Користувацький `~/.claude/CLAUDE.md`, доданий до `USER.md` робочого простору.
- Визначення серверів MCP із проєктного `.mcp.json`, Claude Code `~/.claude.json` і Claude Desktop `claude_desktop_config.json`.
- Каталоги Claude Skills, які містять `SKILL.md`.
- Markdown-файли команд Claude, перетворені на OpenClaw Skills лише з ручним викликом.

### Архів і стан для ручного перегляду

Хуки Claude, дозволи, стандартні значення середовища, локальна пам’ять, правила з областю дії за шляхом, субагенти, кеші, плани та історія проєкту зберігаються у звіті міграції або повідомляються як елементи для ручного перегляду. OpenClaw не виконує хуки, не копіює широкі списки дозволів і не імпортує стан облікових даних OAuth/Desktop автоматично.

## Провайдер Hermes

Вбудований провайдер Hermes за замовчуванням виявляє стан у `~/.hermes`. Використовуйте `--from <path>`, коли Hermes розташований в іншому місці.

### Що імпортує Hermes

- Стандартну конфігурацію моделі з `config.yaml`.
- Налаштованих провайдерів моделей і власні OpenAI-сумісні кінцеві точки з `providers` і `custom_providers`.
- Визначення серверів MCP з `mcp_servers` або `mcp.servers`.
- `SOUL.md` і `AGENTS.md` у робочий простір агента OpenClaw.
- `memories/MEMORY.md` і `memories/USER.md`, додані до файлів пам’яті робочого простору.
- Стандартні значення конфігурації пам’яті для файлової пам’яті OpenClaw, а також архівні елементи або елементи для ручного перегляду для зовнішніх провайдерів пам’яті, як-от Honcho.
- Skills, які містять файл `SKILL.md` у `skills/<name>/`.
- Значення конфігурації для окремих Skills з `skills.config`.
- Підтримувані API-ключі з `.env`, лише з `--include-secrets`.

### Підтримувані ключі `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Стан лише для архіву

Стан Hermes, який OpenClaw не може безпечно інтерпретувати, копіюється у звіт міграції для ручного перегляду, але не завантажується в активну конфігурацію або облікові дані OpenClaw. Це зберігає непрозорий або небезпечний стан, не вдаючи, що OpenClaw може виконувати його або автоматично йому довіряти:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Після застосування

```bash
openclaw doctor
```

## Контракт Plugin

Джерела міграції — це plugins. Plugin оголошує свої ідентифікатори провайдера в `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Під час виконання Plugin викликає `api.registerMigrationProvider(...)`. Провайдер реалізує `detect`, `plan` і `apply`. Ядро відповідає за оркестрацію CLI, політику резервного копіювання, запити, JSON-вивід і попередню перевірку конфліктів. Ядро передає переглянутий план у `apply(ctx, plan)`, а провайдери можуть перебудовувати план лише тоді, коли цей аргумент відсутній для сумісності.

Провайдерські plugins можуть використовувати `openclaw/plugin-sdk/migration` для створення елементів і підрахунків у підсумках, а також `openclaw/plugin-sdk/migration-runtime` для копіювання файлів з урахуванням конфліктів, копій звітів лише для архіву, кешованих обгорток config-runtime і звітів міграції.

## Інтеграція з початковим налаштуванням

Початкове налаштування може запропонувати міграцію, коли провайдер виявляє відоме джерело. І `openclaw onboard --flow import`, і `openclaw setup --wizard --import-from hermes` використовують того самого провайдера міграції Plugin і все одно показують попередній перегляд перед застосуванням.

<Note>
Імпорти під час початкового налаштування потребують свіжого налаштування OpenClaw. Спочатку скиньте конфігурацію, облікові дані, сеанси та робочий простір, якщо у вас уже є локальний стан. Імпорти з резервним копіюванням і перезаписом або злиттям закриті feature-gate для наявних налаштувань.
</Note>

## Пов’язане

- [Міграція з Hermes](/uk/install/migrating-hermes): користувацькі покрокові інструкції.
- [Міграція з Claude](/uk/install/migrating-claude): користувацькі покрокові інструкції.
- [Міграція](/uk/install/migrating): перемістити OpenClaw на нову машину.
- [Doctor](/uk/gateway/doctor): перевірка стану після застосування міграції.
- [Plugins](/uk/tools/plugin): встановлення й реєстрація plugins.
