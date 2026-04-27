---
read_when:
    - Ви хочете виконати міграцію з Hermes або іншої системи агентів до OpenClaw
    - Ви додаєте провайдера міграції, яким володіє Plugin
summary: Довідка CLI для `openclaw migrate` (імпортувати стан з іншої системи агентів)
title: Міграція
x-i18n:
    generated_at: "2026-04-27T10:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59f9da14184ba4a8613699f7adb5787146ab1db1f79af605c1c25fcd4b2a112
    source_path: cli/migrate.md
    workflow: 15
---

# `openclaw migrate`

Імпортуйте стан з іншої системи агентів через провайдера міграції, яким володіє Plugin. Вбудовані провайдери охоплюють [Claude](/uk/install/migrating-claude) і [Hermes](/uk/install/migrating-hermes); сторонні плагіни можуть реєструвати додаткових провайдерів.

<Tip>
Для покрокових інструкцій для користувачів дивіться [Міграція з Claude](/uk/install/migrating-claude) і [Міграція з Hermes](/uk/install/migrating-hermes). [Центр міграції](/uk/install/migrating) містить усі шляхи.
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
  Перевизначити каталог стану джерела. Для Hermes типовим значенням є `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Імпортувати підтримувані облікові дані. Типово вимкнено.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Дозволити apply замінювати наявні цілі, коли план повідомляє про конфлікти.
</ParamField>
<ParamField path="--yes" type="boolean">
  Пропустити запит на підтвердження. Обов’язково в неінтерактивному режимі.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Пропустити резервне копіювання перед apply. Потребує `--force`, коли локальний стан OpenClaw уже існує.
</ParamField>
<ParamField path="--force" type="boolean">
  Обов’язковий разом із `--no-backup`, коли apply інакше відмовився б пропускати резервне копіювання.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати план або результат apply у форматі JSON. З `--json` і без `--yes` apply друкує план і не змінює стан.
</ParamField>

## Модель безпеки

`openclaw migrate` спочатку показує попередній перегляд.

<AccordionGroup>
  <Accordion title="Попередній перегляд перед apply">
    Провайдер повертає деталізований план до будь-яких змін, зокрема конфлікти, пропущені елементи та чутливі елементи. Плани JSON, вивід apply і звіти міграції редагують вкладені ключі, схожі на секрети, як-от API-ключі, токени, заголовки авторизації, cookie і паролі.

    `openclaw migrate apply <provider>` показує попередній перегляд плану та запитує підтвердження перед зміною стану, якщо не встановлено `--yes`. У неінтерактивному режимі apply потребує `--yes`.

  </Accordion>
  <Accordion title="Резервні копії">
    Apply створює й перевіряє резервну копію OpenClaw перед застосуванням міграції. Якщо локальний стан OpenClaw ще не існує, крок резервного копіювання пропускається, і міграція може продовжитися. Щоб пропустити резервне копіювання, коли стан існує, передайте і `--no-backup`, і `--force`.
  </Accordion>
  <Accordion title="Конфлікти">
    Apply відмовляється продовжувати, коли в плані є конфлікти. Перегляньте план, а потім перезапустіть із `--overwrite`, якщо заміна наявних цілей є навмисною. Провайдери все одно можуть записувати резервні копії на рівні елементів для перезаписаних файлів у каталог звіту міграції.
  </Accordion>
  <Accordion title="Секрети">
    Секрети ніколи не імпортуються типово. Використовуйте `--include-secrets`, щоб імпортувати підтримувані облікові дані.
  </Accordion>
</AccordionGroup>

## Провайдер Claude

Вбудований провайдер Claude типово виявляє стан Claude Code у `~/.claude`. Використовуйте `--from <path>`, щоб імпортувати конкретний домашній каталог Claude Code або корінь проєкту.

<Tip>
Для покрокової інструкції для користувачів дивіться [Міграція з Claude](/uk/install/migrating-claude).
</Tip>

### Що імпортує Claude

- Файли `CLAUDE.md` проєкту та `.claude/CLAUDE.md` до робочого простору агента OpenClaw.
- Користувацький `~/.claude/CLAUDE.md`, доданий до `USER.md` робочого простору.
- Визначення MCP-серверів із `.mcp.json` проєкту, `~/.claude.json` Claude Code і `claude_desktop_config.json` Claude Desktop.
- Каталоги навичок Claude, які містять `SKILL.md`.
- Markdown-файли команд Claude, перетворені на Skills OpenClaw лише з ручним викликом.

### Стан архіву та ручної перевірки

Хуки Claude, дозволи, типові значення середовища, локальна пам’ять, правила з прив’язкою до шляху, субагенти, кеші, плани й історія проєкту зберігаються у звіті міграції або позначаються як елементи для ручної перевірки. OpenClaw не виконує хуки, не копіює широкі списки дозволів і не імпортує стан OAuth/Desktop-облікових даних автоматично.

## Провайдер Hermes

Вбудований провайдер Hermes типово виявляє стан у `~/.hermes`. Використовуйте `--from <path>`, коли Hermes розміщено в іншому місці.

### Що імпортує Hermes

- Типову конфігурацію моделі з `config.yaml`.
- Налаштованих провайдерів моделей і власні OpenAI-сумісні endpoint-и з `providers` і `custom_providers`.
- Визначення MCP-серверів із `mcp_servers` або `mcp.servers`.
- `SOUL.md` і `AGENTS.md` до робочого простору агента OpenClaw.
- `memories/MEMORY.md` і `memories/USER.md`, додані до файлів пам’яті робочого простору.
- Типові значення конфігурації пам’яті для файлової пам’яті OpenClaw, а також елементи архіву або ручної перевірки для зовнішніх провайдерів пам’яті, таких як Honcho.
- Skills, що містять файл `SKILL.md` у `skills/<name>/`.
- Значення конфігурації для кожної навички з `skills.config`.
- Підтримувані API-ключі з `.env`, лише з `--include-secrets`.

### Підтримувані ключі `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Лише архівний стан

Стан Hermes, який OpenClaw не може безпечно інтерпретувати, копіюється до звіту міграції для ручної перевірки, але не завантажується до живої конфігурації чи облікових даних OpenClaw. Це зберігає непрозорий або небезпечний стан без удавання, що OpenClaw може автоматично його виконати чи довіряти йому:

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

Джерела міграції — це плагіни. Плагін оголошує свої ідентифікатори провайдерів у `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Під час виконання плагін викликає `api.registerMigrationProvider(...)`. Провайдер реалізує `detect`, `plan` і `apply`. Ядро володіє оркестрацією CLI, політикою резервного копіювання, запитами підтвердження, JSON-виводом і попередньою перевіркою конфліктів. Ядро передає перевірений план у `apply(ctx, plan)`, а провайдери можуть перебудовувати план лише тоді, коли цей аргумент відсутній для сумісності.

Плагіни-провайдери можуть використовувати `openclaw/plugin-sdk/migration` для побудови елементів і підрахунку підсумків, а також `openclaw/plugin-sdk/migration-runtime` для копіювання файлів з урахуванням конфліктів, копіювання звітів лише в архів і звітів міграції.

## Інтеграція з онбордингом

Онбординг може пропонувати міграцію, коли провайдер виявляє відоме джерело. І `openclaw onboard --flow import`, і `openclaw setup --wizard --import-from hermes` використовують того самого провайдера міграції Plugin і все одно показують попередній перегляд перед застосуванням.

<Note>
Імпорт через онбординг вимагає чистого налаштування OpenClaw. Спочатку скиньте конфігурацію, облікові дані, сесії та робочий простір, якщо у вас уже є локальний стан. Імпорт із резервним копіюванням плюс перезапис або злиття для наявних налаштувань увімкнено лише через feature gate.
</Note>

## Пов’язане

- [Міграція з Hermes](/uk/install/migrating-hermes): покрокова інструкція для користувачів.
- [Міграція з Claude](/uk/install/migrating-claude): покрокова інструкція для користувачів.
- [Міграція](/uk/install/migrating): перенесення OpenClaw на нову машину.
- [Doctor](/uk/gateway/doctor): перевірка стану після застосування міграції.
- [Плагіни](/uk/tools/plugin): встановлення та реєстрація плагінів.
