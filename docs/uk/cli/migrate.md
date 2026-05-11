---
read_when:
    - Ви хочете мігрувати з Hermes або іншої агентної системи до OpenClaw
    - Ви додаєте постачальника міграцій, що належить Plugin
summary: Довідник CLI для `openclaw migrate` (імпорт стану з іншої агентної системи)
title: Міграція
x-i18n:
    generated_at: "2026-05-11T20:28:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Імпортуйте стан з іншої агентної системи через провайдер міграції, що належить Plugin. Вбудовані провайдери охоплюють стан Codex CLI, [Claude](/uk/install/migrating-claude) і [Hermes](/uk/install/migrating-hermes); сторонні plugins можуть реєструвати додаткових провайдерів.

<Tip>
Покрокові інструкції для користувачів див. у [Міграція з Claude](/uk/install/migrating-claude) і [Міграція з Hermes](/uk/install/migrating-hermes). [Центр міграції](/uk/install/migrating) перелічує всі шляхи.
</Tip>

## Команди

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
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
  Перевизначити каталог вихідного стану. Hermes за замовчуванням використовує `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Імпортувати підтримувані облікові дані. Типово вимкнено.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Дозволити застосуванню замінювати наявні цільові об’єкти, коли план повідомляє про конфлікти.
</ParamField>
<ParamField path="--yes" type="boolean">
  Пропустити запит підтвердження. Обов’язково в неінтерактивному режимі.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Вибрати один елемент копіювання skill за назвою skill або ідентифікатором елемента. Повторіть прапорець, щоб мігрувати кілька skills. Якщо пропущено, інтерактивні міграції Codex показують селектор із прапорцями, а неінтерактивні міграції зберігають усі заплановані skills.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Вибрати один елемент установлення Plugin Codex за назвою Plugin або ідентифікатором елемента. Повторіть прапорець, щоб мігрувати кілька plugins Codex. Якщо пропущено, інтерактивні міграції Codex показують нативний селектор plugins Codex із прапорцями, а неінтерактивні міграції зберігають усі заплановані plugins. Це застосовується лише до встановлених у джерелі plugins Codex `openai-curated`, виявлених інвентарем сервера застосунку Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Пропустити резервну копію перед застосуванням. Потребує `--force`, коли існує локальний стан OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Обов’язковий разом із `--no-backup`, коли застосування інакше відмовилося б пропустити резервне копіювання.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати план або результат застосування як JSON. З `--json` і без `--yes` застосування друкує план і не змінює стан.
</ParamField>

## Модель безпеки

`openclaw migrate` спочатку показує попередній перегляд.

<AccordionGroup>
  <Accordion title="Попередній перегляд перед застосуванням">
    Провайдер повертає деталізований план до будь-яких змін, включно з конфліктами, пропущеними елементами та чутливими елементами. JSON-плани, вивід застосування та звіти міграції редагують вкладені ключі, схожі на секрети, як-от API-ключі, токени, заголовки авторизації, cookies і паролі.

    `openclaw migrate apply <provider>` попередньо показує план і запитує підтвердження перед зміною стану, якщо не встановлено `--yes`. У неінтерактивному режимі застосування потребує `--yes`.

  </Accordion>
  <Accordion title="Резервні копії">
    Застосування створює та перевіряє резервну копію OpenClaw перед застосуванням міграції. Якщо локального стану OpenClaw ще немає, крок резервного копіювання пропускається, і міграція може продовжитися. Щоб пропустити резервну копію, коли стан існує, передайте і `--no-backup`, і `--force`.
  </Accordion>
  <Accordion title="Конфлікти">
    Застосування відмовляється продовжувати, коли план має конфлікти. Перегляньте план, а потім запустіть повторно з `--overwrite`, якщо заміна наявних цільових об’єктів є навмисною. Провайдери все ще можуть записувати резервні копії на рівні елементів для перезаписаних файлів у каталозі звіту міграції.
  </Accordion>
  <Accordion title="Секрети">
    Секрети ніколи не імпортуються за замовчуванням. Використовуйте `--include-secrets`, щоб імпортувати підтримувані облікові дані.
  </Accordion>
</AccordionGroup>

## Провайдер Claude

Вбудований провайдер Claude за замовчуванням виявляє стан Claude Code у `~/.claude`. Використовуйте `--from <path>`, щоб імпортувати конкретну домашню теку Claude Code або корінь проєкту.

<Tip>
Покрокову інструкцію для користувачів див. у [Міграція з Claude](/uk/install/migrating-claude).
</Tip>

### Що імпортує Claude

- Проєктні `CLAUDE.md` і `.claude/CLAUDE.md` у робочий простір агента OpenClaw.
- Користувацький `~/.claude/CLAUDE.md`, доданий до робочого простору `USER.md`.
- Визначення MCP-серверів із проєктного `.mcp.json`, Claude Code `~/.claude.json` і Claude Desktop `claude_desktop_config.json`.
- Каталоги skills Claude, що містять `SKILL.md`.
- Markdown-файли команд Claude, перетворені на skills OpenClaw лише з ручним викликом.

### Стан архіву та ручного перегляду

Хуки Claude, дозволи, типові значення середовища, локальна пам’ять, правила з областю дії за шляхом, субагенти, кеші, плани та історія проєкту зберігаються у звіті міграції або повідомляються як елементи для ручного перегляду. OpenClaw не виконує хуки, не копіює широкі списки дозволів і не імпортує стан облікових даних OAuth/Desktop автоматично.

## Провайдер Codex

Вбудований провайдер Codex за замовчуванням виявляє стан Codex CLI у `~/.codex` або
у `CODEX_HOME`, коли цю змінну середовища встановлено. Використовуйте `--from <path>`, щоб
інвентаризувати конкретну домашню теку Codex.

Використовуйте цього провайдера під час переходу на harness OpenClaw Codex, коли потрібно
свідомо перенести корисні особисті ресурси Codex CLI. Локальні запуски сервера застосунку Codex
використовують окремі для агента каталоги `CODEX_HOME` і `HOME`, тому за замовчуванням не читають
ваш особистий стан Codex CLI.

Запуск `openclaw migrate codex` в інтерактивному терміналі попередньо показує повний
план, а потім відкриває селектори з прапорцями перед остаточним підтвердженням застосування. Елементи
копіювання skill запитуються першими. Використовуйте `Toggle all on` або `Toggle all off` для масового
вибору; заплановані skills починають вибраними, конфліктні skills починають невибраними, а
`Skip for now` пропускає копії skill для цього запуску, водночас продовжуючи до вибору
Plugin. Коли встановлені в джерелі curated plugins Codex можна мігрувати, а
`--plugin` не було надано, міграція потім запитує активацію нативного Plugin Codex
за назвою Plugin. Елементи Plugin
починають вибраними, якщо цільова конфігурація Plugin OpenClaw Codex ще не має цього
Plugin. Наявні цільові plugins починають невибраними й показують підказку про конфлікт, як-от
`conflict: plugin exists`; виберіть `Toggle all off`, щоб не мігрувати нативні plugins Codex
у цьому запуску, або `Skip for now`, щоб зупинитися перед застосуванням. Для скриптових або
точних запусків передайте `--skill <name>` один раз для кожного skill, наприклад:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Використовуйте `--plugin <name>`, щоб неінтерактивно обмежити міграцію нативних plugins Codex
одним або кількома встановленими в джерелі curated plugins:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Що імпортує Codex

- Каталоги skills Codex CLI у `$CODEX_HOME/skills`, за винятком кешу Codex
  `.system`.
- Особисті AgentSkills у `$HOME/.agents/skills`, скопійовані в поточний
  робочий простір агента OpenClaw, коли потрібне володіння на рівні агента.
- Встановлені в джерелі plugins Codex `openai-curated`, виявлені через Codex
  app-server `plugin/list`. Застосування викликає app-server `plugin/install` для кожного
  вибраного Plugin, навіть якщо цільовий app-server уже повідомляє, що цей Plugin
  встановлено й увімкнено. Мігрувані plugins Codex придатні лише в сеансах, які
  вибирають нативний harness Codex; вони не доступні Pi, звичайним запускам
  провайдера OpenAI, прив’язкам розмов ACP або іншим harnesses.

### Стан Codex для ручного перегляду

Codex `config.toml`, нативні `hooks/hooks.json`, не-curated marketplaces і
кешовані бандли plugins, які не є встановленими в джерелі curated plugins, не
активуються автоматично. Вони копіюються або повідомляються у звіті міграції для
ручного перегляду.

Для мігрованих встановлених у джерелі curated plugins застосування записує:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- один явний запис Plugin з `marketplaceName: "openai-curated"` і
  `pluginName` для кожного вибраного Plugin

Міграція ніколи не записує `plugins["*"]` і ніколи не зберігає локальні шляхи кешу marketplace.
Установлення, що потребують автентифікації, повідомляються для відповідного елемента Plugin з
`status: "skipped"`, `reason: "auth_required"` і очищеними ідентифікаторами застосунку.
Їхні явні записи конфігурації записуються вимкненими, доки ви повторно не авторизуєтеся й
не ввімкнете їх. Інші помилки встановлення є результатами `error` на рівні елемента.

Якщо інвентар plugins app-server Codex недоступний під час планування, міграція
переходить до дорадчих елементів кешованого бандла замість відмови всієї
міграції.

## Провайдер Hermes

Вбудований провайдер Hermes за замовчуванням виявляє стан у `~/.hermes`. Використовуйте `--from <path>`, коли Hermes розташовано в іншому місці.

### Що імпортує Hermes

- Типову конфігурацію моделі з `config.yaml`.
- Налаштованих провайдерів моделей і власні OpenAI-сумісні кінцеві точки з `providers` і `custom_providers`.
- Визначення MCP-серверів з `mcp_servers` або `mcp.servers`.
- `SOUL.md` і `AGENTS.md` у робочий простір агента OpenClaw.
- `memories/MEMORY.md` і `memories/USER.md`, додані до файлів пам’яті робочого простору.
- Типові значення конфігурації пам’яті для файлової пам’яті OpenClaw, а також елементи архіву або ручного перегляду для зовнішніх провайдерів пам’яті, як-от Honcho.
- Skills, що містять файл `SKILL.md` у `skills/<name>/`.
- Значення конфігурації для кожного skill з `skills.config`.
- Підтримувані API-ключі з `.env`, лише з `--include-secrets`.

### Підтримувані ключі `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Стан лише для архіву

Стан Hermes, який OpenClaw не може безпечно інтерпретувати, копіюється до звіту міграції для ручного перегляду, але не завантажується в активну конфігурацію або облікові дані OpenClaw. Це зберігає непрозорий або небезпечний стан, не вдаючи, що OpenClaw може автоматично виконувати його або довіряти йому:

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

Джерела міграції — це plugins. Plugin оголошує свої ідентифікатори провайдерів у `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Під час виконання Plugin викликає `api.registerMigrationProvider(...)`. Провайдер реалізує `detect`, `plan` і `apply`. Core відповідає за оркестрацію CLI, політику резервного копіювання, запити, JSON-вивід і попередню перевірку конфліктів. Core передає переглянутий план у `apply(ctx, plan)`, а провайдери можуть перебудовувати план лише тоді, коли цей аргумент відсутній для сумісності.

Provider plugins можуть використовувати `openclaw/plugin-sdk/migration` для побудови елементів і підрахунків у підсумку, а також `openclaw/plugin-sdk/migration-runtime` для копіювання файлів з урахуванням конфліктів, копій звіту лише для архіву, кешованих обгорток config-runtime і звітів міграції.

## Інтеграція з онбордингом

Онбординг може пропонувати міграцію, коли провайдер виявляє відоме джерело. І `openclaw onboard --flow import`, і `openclaw setup --wizard --import-from hermes` використовують того самого провайдера міграції Plugin і все одно показують попередній перегляд перед застосуванням.

<Note>
Імпорт під час онбордингу потребує нового налаштування OpenClaw. Спершу скиньте конфігурацію, облікові дані, сеанси та робочий простір, якщо у вас уже є локальний стан. Імпорти з резервною копією та перезаписом або об’єднанням закриті feature gate для наявних налаштувань.
</Note>

## Пов’язане

- [Міграція з Hermes](/uk/install/migrating-hermes): інструкція для користувачів.
- [Міграція з Claude](/uk/install/migrating-claude): інструкція для користувачів.
- [Міграція](/uk/install/migrating): перенесення OpenClaw на новий комп’ютер.
- [Doctor](/uk/gateway/doctor): перевірка стану після застосування міграції.
- [Плагіни](/uk/tools/plugin): встановлення та реєстрація плагінів.
