---
read_when:
    - Ви хочете мігрувати з Hermes або іншої агентної системи до OpenClaw
    - Ви додаєте постачальник міграцій, що належить Plugin
summary: Довідник CLI для `openclaw migrate` (імпорт стану з іншої системи агентів)
title: Міграція
x-i18n:
    generated_at: "2026-05-05T23:46:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Імпортуйте стан з іншої агентної системи через провайдера міграції, що належить Plugin. Вбудовані провайдери охоплюють стан Codex CLI, [Claude](/uk/install/migrating-claude) і [Hermes](/uk/install/migrating-hermes); сторонні Plugin можуть реєструвати додаткових провайдерів.

<Tip>
Для користувацьких покрокових інструкцій дивіться [Міграція з Claude](/uk/install/migrating-claude) і [Міграція з Hermes](/uk/install/migrating-hermes). [Центр міграції](/uk/install/migrating) містить усі шляхи.
</Tip>

## Команди

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Назва зареєстрованого провайдера міграції, наприклад `hermes`. Запустіть `openclaw migrate list`, щоб переглянути встановлених провайдерів.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Побудувати план і вийти без зміни стану.
</ParamField>
<ParamField path="--from <path>" type="string">
  Перевизначити каталог початкового стану. Hermes за замовчуванням використовує `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Імпортувати підтримувані облікові дані. Вимкнено за замовчуванням.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Дозволити apply замінювати наявні цільові об'єкти, коли план повідомляє про конфлікти.
</ParamField>
<ParamField path="--yes" type="boolean">
  Пропустити запит підтвердження. Потрібно в неінтерактивному режимі.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Вибрати один елемент копіювання skill за назвою skill або ідентифікатором елемента. Повторіть прапорець, щоб мігрувати кілька skills. Якщо параметр не вказано, інтерактивні міграції Codex показують селектор із прапорцями, а неінтерактивні міграції зберігають усі заплановані skills.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Пропустити резервну копію перед застосуванням. Потребує `--force`, коли існує локальний стан OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Потрібно разом із `--no-backup`, коли apply інакше відмовився б пропустити резервну копію.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести план або результат застосування як JSON. З `--json` і без `--yes` apply виводить план і не змінює стан.
</ParamField>

## Модель безпеки

`openclaw migrate` спочатку показує попередній перегляд.

<AccordionGroup>
  <Accordion title="Попередній перегляд перед застосуванням">
    Провайдер повертає деталізований план до будь-яких змін, зокрема конфлікти, пропущені елементи й конфіденційні елементи. Плани JSON, вивід застосування та звіти міграції редагують вкладені ключі, схожі на секрети, як-от API-ключі, токени, заголовки авторизації, cookies і паролі.

    `openclaw migrate apply <provider>` показує попередній перегляд плану та запитує підтвердження перед зміною стану, якщо не встановлено `--yes`. У неінтерактивному режимі apply потребує `--yes`.

  </Accordion>
  <Accordion title="Резервні копії">
    Apply створює й перевіряє резервну копію OpenClaw перед застосуванням міграції. Якщо локального стану OpenClaw ще немає, крок резервного копіювання пропускається, і міграція може продовжитися. Щоб пропустити резервне копіювання, коли стан існує, передайте разом `--no-backup` і `--force`.
  </Accordion>
  <Accordion title="Конфлікти">
    Apply відмовляється продовжувати, коли план має конфлікти. Перегляньте план, а потім запустіть повторно з `--overwrite`, якщо заміна наявних цільових об'єктів є навмисною. Провайдери все ще можуть записувати резервні копії на рівні елементів для перезаписаних файлів у каталозі звіту міграції.
  </Accordion>
  <Accordion title="Секрети">
    Секрети ніколи не імпортуються за замовчуванням. Використовуйте `--include-secrets`, щоб імпортувати підтримувані облікові дані.
  </Accordion>
</AccordionGroup>

## Провайдер Claude

Вбудований провайдер Claude за замовчуванням виявляє стан Claude Code у `~/.claude`. Використовуйте `--from <path>`, щоб імпортувати конкретний домашній каталог Claude Code або корінь проєкту.

<Tip>
Для користувацької покрокової інструкції дивіться [Міграція з Claude](/uk/install/migrating-claude).
</Tip>

### Що імпортує Claude

- Проєктні `CLAUDE.md` і `.claude/CLAUDE.md` у робочу область агента OpenClaw.
- Користувацький `~/.claude/CLAUDE.md`, доданий до `USER.md` робочої області.
- Визначення серверів MCP з проєктного `.mcp.json`, Claude Code `~/.claude.json` і Claude Desktop `claude_desktop_config.json`.
- Каталоги Claude skill, які містять `SKILL.md`.
- Markdown-файли команд Claude, перетворені на OpenClaw skills лише з ручним викликом.

### Стан архіву й ручного перегляду

Хуки Claude, дозволи, типові значення середовища, локальна пам'ять, правила з областю дії за шляхами, субагенти, кеші, плани та історія проєкту зберігаються у звіті міграції або повідомляються як елементи для ручного перегляду. OpenClaw не виконує хуки, не копіює широкі списки дозволів і не імпортує стан облікових даних OAuth/Desktop автоматично.

## Провайдер Codex

Вбудований провайдер Codex за замовчуванням виявляє стан Codex CLI у `~/.codex` або
в `CODEX_HOME`, коли ця змінна середовища встановлена. Використовуйте `--from <path>`, щоб
інвентаризувати конкретний домашній каталог Codex.

Використовуйте цього провайдера під час переходу до OpenClaw Codex harness, коли потрібно
свідомо просунути корисні особисті ресурси Codex CLI. Локальні запуски app-server Codex
використовують окремі для кожного агента каталоги `CODEX_HOME` і `HOME`, тому за замовчуванням
не читають ваш особистий стан Codex CLI.

Запуск `openclaw migrate codex` в інтерактивному терміналі показує попередній перегляд повного
плану, потім відкриває селектор із прапорцями для елементів копіювання skill перед фінальним
підтвердженням застосування. Використовуйте `Toggle all on` або `Toggle all off` для масового вибору;
заплановані skills спочатку позначені, конфліктні skills спочатку не позначені, а `Skip for now`
залишає skills без змін і без застосування. Для скриптованих або точних запусків передайте
`--skill <name>` один раз для кожного skill, наприклад:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Що імпортує Codex

- Каталоги skill Codex CLI у `$CODEX_HOME/skills`, за винятком кешу Codex
  `.system`.
- Особисті AgentSkills у `$HOME/.agents/skills`, скопійовані в поточну
  робочу область агента OpenClaw, коли потрібне володіння на рівні агента.

### Стан Codex для ручного перегляду

Нативні Plugin Codex, `config.toml` і нативний `hooks/hooks.json` не
активуються автоматично. Plugin можуть надавати сервери MCP, застосунки, хуки або іншу
виконувану поведінку, тому провайдер повідомляє про них для перегляду замість завантаження
в OpenClaw. Файли конфігурації та хуків копіюються до звіту міграції
для ручного перегляду.

## Провайдер Hermes

Вбудований провайдер Hermes за замовчуванням виявляє стан у `~/.hermes`. Використовуйте `--from <path>`, коли Hermes розташований деінде.

### Що імпортує Hermes

- Типову конфігурацію моделі з `config.yaml`.
- Налаштованих провайдерів моделей і власні OpenAI-сумісні кінцеві точки з `providers` і `custom_providers`.
- Визначення серверів MCP з `mcp_servers` або `mcp.servers`.
- `SOUL.md` і `AGENTS.md` у робочу область агента OpenClaw.
- `memories/MEMORY.md` і `memories/USER.md`, додані до файлів пам'яті робочої області.
- Типові значення конфігурації пам'яті для файлової пам'яті OpenClaw, а також архівні елементи або елементи ручного перегляду для зовнішніх провайдерів пам'яті, як-от Honcho.
- Skills, які містять файл `SKILL.md` у `skills/<name>/`.
- Значення конфігурації для кожного skill з `skills.config`.
- Підтримувані API-ключі з `.env`, лише з `--include-secrets`.

### Підтримувані ключі `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Стан лише для архіву

Стан Hermes, який OpenClaw не може безпечно інтерпретувати, копіюється до звіту міграції для ручного перегляду, але не завантажується в активну конфігурацію або облікові дані OpenClaw. Це зберігає непрозорий або небезпечний стан без удавання, що OpenClaw може автоматично виконувати його або довіряти йому:

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

Джерела міграції є Plugin. Plugin оголошує свої ідентифікатори провайдерів у `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Під час виконання Plugin викликає `api.registerMigrationProvider(...)`. Провайдер реалізує `detect`, `plan` і `apply`. Ядро відповідає за оркестрацію CLI, політику резервного копіювання, запити, вивід JSON і попередню перевірку конфліктів. Ядро передає переглянутий план у `apply(ctx, plan)`, а провайдери можуть перебудовувати план лише тоді, коли цей аргумент відсутній для сумісності.

Plugin-провайдери можуть використовувати `openclaw/plugin-sdk/migration` для побудови елементів і підрахунків у підсумку, а також `openclaw/plugin-sdk/migration-runtime` для копіювання файлів з урахуванням конфліктів, копій звітів лише для архіву, кешованих обгорток config-runtime і звітів міграції.

## Інтеграція з онбордингом

Онбординг може запропонувати міграцію, коли провайдер виявляє відоме джерело. І `openclaw onboard --flow import`, і `openclaw setup --wizard --import-from hermes` використовують того самого Plugin-провайдера міграції та все одно показують попередній перегляд перед застосуванням.

<Note>
Імпорт під час онбордингу потребує свіжого налаштування OpenClaw. Спершу скиньте конфігурацію, облікові дані, сесії та робочу область, якщо локальний стан уже існує. Імпорти з резервною копією плюс перезаписом або злиттям захищені feature gate для наявних налаштувань.
</Note>

## Пов'язане

- [Міграція з Hermes](/uk/install/migrating-hermes): користувацька покрокова інструкція.
- [Міграція з Claude](/uk/install/migrating-claude): користувацька покрокова інструкція.
- [Міграція](/uk/install/migrating): перенесення OpenClaw на нову машину.
- [Doctor](/uk/gateway/doctor): перевірка працездатності після застосування міграції.
- [Plugins](/uk/tools/plugin): встановлення та реєстрація Plugin.
