---
read_when:
    - Ви хочете перейти з Hermes або іншої агентської системи до OpenClaw
    - Ви додаєте постачальника міграцій, що належить Plugin
summary: Довідник CLI для `openclaw migrate` (імпорт стану з іншої агентської системи)
title: Міграція
x-i18n:
    generated_at: "2026-04-30T19:53:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Імпортуйте стан з іншої агентної системи через постачальника міграції, що належить Plugin. Вбудовані постачальники охоплюють стан Codex CLI, [Claude](/uk/install/migrating-claude) і [Hermes](/uk/install/migrating-hermes); сторонні plugins можуть реєструвати додаткових постачальників.

<Tip>
Покрокові інструкції для користувачів див. у [Міграція з Claude](/uk/install/migrating-claude) і [Міграція з Hermes](/uk/install/migrating-hermes). [Центр міграції](/uk/install/migrating) перелічує всі шляхи.
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
  Назва зареєстрованого постачальника міграції, наприклад `hermes`. Виконайте `openclaw migrate list`, щоб побачити встановлених постачальників.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Створити план і вийти без зміни стану.
</ParamField>
<ParamField path="--from <path>" type="string">
  Перевизначити каталог вихідного стану. Для Hermes типовим є `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Імпортувати підтримувані облікові дані. Типово вимкнено.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Дозволити apply замінювати наявні цілі, коли план повідомляє про конфлікти.
</ParamField>
<ParamField path="--yes" type="boolean">
  Пропустити запит підтвердження. Обов’язково в неінтерактивному режимі.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Вибрати один елемент копіювання skill за назвою skill або ідентифікатором елемента. Повторіть прапорець, щоб мігрувати кілька skills. Якщо прапорець пропущено, інтерактивні міграції Codex показують селектор із прапорцями, а неінтерактивні міграції зберігають усі заплановані skills.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Пропустити резервну копію перед apply. Потребує `--force`, коли існує локальний стан OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Обов’язково разом із `--no-backup`, коли apply інакше відмовився б пропускати резервну копію.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати план або результат apply як JSON. З `--json` і без `--yes` apply друкує план і не змінює стан.
</ParamField>

## Модель безпеки

`openclaw migrate` спочатку показує попередній перегляд.

<AccordionGroup>
  <Accordion title="Попередній перегляд перед apply">
    Постачальник повертає деталізований план до будь-яких змін, включно з конфліктами, пропущеними елементами та чутливими елементами. JSON-плани, вивід apply і звіти міграції редагують вкладені ключі, схожі на секрети, як-от API-ключі, токени, заголовки авторизації, cookies і паролі.

    `openclaw migrate apply <provider>` попередньо показує план і запитує підтвердження перед зміною стану, якщо не задано `--yes`. У неінтерактивному режимі apply потребує `--yes`.

  </Accordion>
  <Accordion title="Резервні копії">
    Apply створює й перевіряє резервну копію OpenClaw перед застосуванням міграції. Якщо локального стану OpenClaw ще немає, крок резервного копіювання пропускається, а міграція може продовжитися. Щоб пропустити резервну копію, коли стан існує, передайте і `--no-backup`, і `--force`.
  </Accordion>
  <Accordion title="Конфлікти">
    Apply відмовляється продовжувати, коли план має конфлікти. Перегляньте план, а потім повторно запустіть із `--overwrite`, якщо заміна наявних цілей є навмисною. Постачальники все ще можуть записувати резервні копії на рівні елементів для перезаписаних файлів у каталозі звіту міграції.
  </Accordion>
  <Accordion title="Секрети">
    Секрети типово ніколи не імпортуються. Використовуйте `--include-secrets`, щоб імпортувати підтримувані облікові дані.
  </Accordion>
</AccordionGroup>

## Постачальник Claude

Вбудований постачальник Claude типово виявляє стан Claude Code у `~/.claude`. Використовуйте `--from <path>`, щоб імпортувати конкретний домашній каталог Claude Code або корінь проєкту.

<Tip>
Покрокову інструкцію для користувачів див. у [Міграція з Claude](/uk/install/migrating-claude).
</Tip>

### Що імпортує Claude

- Проєктні `CLAUDE.md` і `.claude/CLAUDE.md` у робочу область агента OpenClaw.
- Користувацький `~/.claude/CLAUDE.md`, доданий до `USER.md` робочої області.
- Визначення MCP-серверів із проєктного `.mcp.json`, Claude Code `~/.claude.json` і Claude Desktop `claude_desktop_config.json`.
- Каталоги skills Claude, які містять `SKILL.md`.
- Markdown-файли команд Claude, перетворені на skills OpenClaw лише з ручним викликом.

### Стан архівування та ручного перегляду

Hooks Claude, дозволи, типові значення середовища, локальна пам’ять, правила з областю дії за шляхом, субагенти, кеші, плани й історія проєкту зберігаються у звіті міграції або повідомляються як елементи для ручного перегляду. OpenClaw не виконує hooks, не копіює широкі allowlists і не імпортує стан облікових даних OAuth/Desktop автоматично.

## Постачальник Codex

Вбудований постачальник Codex типово виявляє стан Codex CLI у `~/.codex` або
в `CODEX_HOME`, коли цю змінну середовища задано. Використовуйте `--from <path>`, щоб
інвентаризувати конкретний домашній каталог Codex.

Використовуйте цього постачальника під час переходу на harness OpenClaw Codex, коли потрібно
свідомо просунути корисні особисті ресурси Codex CLI. Локальні запуски app-server Codex
використовують каталоги `CODEX_HOME` і `HOME` для кожного агента, тому типово вони не читають
ваш особистий стан Codex CLI.

Запуск `openclaw migrate codex` в інтерактивному терміналі попередньо показує повний
план, а потім відкриває селектор із прапорцями для елементів копіювання skill перед фінальним
підтвердженням apply. Усі skills спочатку вибрані; зніміть прапорець із будь-якого skill, який не потрібно
копіювати в цього агента. Для скриптових або точних запусків передайте `--skill <name>` по одному разу
для кожного skill, наприклад:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Що імпортує Codex

- Каталоги skills Codex CLI у `$CODEX_HOME/skills`, окрім кешу `.system`
  Codex.
- Особисті AgentSkills у `$HOME/.agents/skills`, скопійовані в поточну
  робочу область агента OpenClaw, коли потрібне володіння на рівні агента.

### Стан Codex для ручного перегляду

Нативні plugins Codex, `config.toml` і нативні `hooks/hooks.json` не
активуються автоматично. Plugins можуть відкривати MCP-сервери, apps, hooks або іншу
виконувану поведінку, тому постачальник повідомляє про них для перегляду замість завантаження
їх в OpenClaw. Файли config і hook копіюються у звіт міграції
для ручного перегляду.

## Постачальник Hermes

Вбудований постачальник Hermes типово виявляє стан у `~/.hermes`. Використовуйте `--from <path>`, коли Hermes розташований в іншому місці.

### Що імпортує Hermes

- Типову конфігурацію моделі з `config.yaml`.
- Налаштованих постачальників моделей і власні OpenAI-сумісні endpoints із `providers` і `custom_providers`.
- Визначення MCP-серверів із `mcp_servers` або `mcp.servers`.
- `SOUL.md` і `AGENTS.md` у робочу область агента OpenClaw.
- `memories/MEMORY.md` і `memories/USER.md`, додані до файлів пам’яті робочої області.
- Типові значення конфігурації пам’яті для файлової пам’яті OpenClaw, а також архівні елементи або елементи для ручного перегляду для зовнішніх постачальників пам’яті, як-от Honcho.
- Skills, які містять файл `SKILL.md` у `skills/<name>/`.
- Значення конфігурації для кожного skill із `skills.config`.
- Підтримувані API-ключі з `.env`, лише з `--include-secrets`.

### Підтримувані ключі `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Стан лише для архіву

Стан Hermes, який OpenClaw не може безпечно інтерпретувати, копіюється у звіт міграції для ручного перегляду, але не завантажується в активну конфігурацію або облікові дані OpenClaw. Це зберігає непрозорий або небезпечний стан без удавання, що OpenClaw може автоматично виконувати його або довіряти йому:

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

Джерела міграції є plugins. Plugin оголошує свої ідентифікатори постачальників в `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Під час виконання Plugin викликає `api.registerMigrationProvider(...)`. Постачальник реалізує `detect`, `plan` і `apply`. Core відповідає за оркестрацію CLI, політику резервного копіювання, запити, JSON-вивід і попередню перевірку конфліктів. Core передає переглянутий план у `apply(ctx, plan)`, а постачальники можуть перебудовувати план лише коли цей аргумент відсутній для сумісності.

Provider plugins можуть використовувати `openclaw/plugin-sdk/migration` для створення елементів і підрахунків у підсумку, а також `openclaw/plugin-sdk/migration-runtime` для копіювання файлів з урахуванням конфліктів, архівних копій у звітах, кешованих wrappers config-runtime і звітів міграції.

## Інтеграція з onboarding

Onboarding може пропонувати міграцію, коли постачальник виявляє відоме джерело. І `openclaw onboard --flow import`, і `openclaw setup --wizard --import-from hermes` використовують того самого постачальника міграції Plugin і все одно показують попередній перегляд перед застосуванням.

<Note>
Імпорти onboarding потребують свіжого налаштування OpenClaw. Спочатку скиньте конфігурацію, облікові дані, сесії та робочу область, якщо у вас уже є локальний стан. Backup-plus-overwrite або merge imports захищені feature gate для наявних налаштувань.
</Note>

## Пов’язане

- [Міграція з Hermes](/uk/install/migrating-hermes): покрокова інструкція для користувачів.
- [Міграція з Claude](/uk/install/migrating-claude): покрокова інструкція для користувачів.
- [Міграція](/uk/install/migrating): перенесіть OpenClaw на новий комп’ютер.
- [Doctor](/uk/gateway/doctor): перевірка справності після застосування міграції.
- [Plugins](/uk/tools/plugin): встановлення та реєстрація plugins.
