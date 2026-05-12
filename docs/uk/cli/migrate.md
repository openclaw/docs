---
read_when:
    - Ви хочете мігрувати з Hermes або іншої агентної системи до OpenClaw
    - Ви додаєте постачальника міграцій, що належить Plugin
summary: Довідка CLI для `openclaw migrate` (імпорт стану з іншої агентної системи)
title: Міграція
x-i18n:
    generated_at: "2026-05-12T00:58:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Імпортуйте стан з іншої агентної системи через постачальника міграції, що належить Plugin. Вбудовані постачальники охоплюють стан Codex CLI, [Claude](/uk/install/migrating-claude) і [Hermes](/uk/install/migrating-hermes); сторонні plugins можуть реєструвати додаткових постачальників.

<Tip>
Для покрокових інструкцій для користувачів див. [Міграція з Claude](/uk/install/migrating-claude) і [Міграція з Hermes](/uk/install/migrating-hermes). [Центр міграції](/uk/install/migrating) містить усі шляхи.
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
  Назва зареєстрованого постачальника міграції, наприклад `hermes`. Запустіть `openclaw migrate list`, щоб переглянути встановлених постачальників.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Побудувати план і вийти без зміни стану.
</ParamField>
<ParamField path="--from <path>" type="string">
  Перевизначити каталог вихідного стану. Hermes типово використовує `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Імпортувати підтримувані облікові дані. Типово вимкнено.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Дозволити застосуванню замінювати наявні цілі, коли план повідомляє про конфлікти.
</ParamField>
<ParamField path="--yes" type="boolean">
  Пропустити запит підтвердження. Обов’язково в неінтерактивному режимі.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Вибрати один елемент копіювання навички за назвою навички або ідентифікатором елемента. Повторіть прапорець, щоб мігрувати кілька навичок. Якщо його пропущено, інтерактивні міграції Codex показують селектор із прапорцями, а неінтерактивні міграції зберігають усі заплановані навички.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Вибрати один елемент встановлення Plugin Codex за назвою Plugin або ідентифікатором елемента. Повторіть прапорець, щоб мігрувати кілька plugins Codex. Якщо його пропущено, інтерактивні міграції Codex показують нативний селектор plugins Codex із прапорцями, а неінтерактивні міграції зберігають усі заплановані plugins. Це стосується лише встановлених із джерела plugins Codex `openai-curated`, виявлених інвентарем app-server Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Пропустити резервну копію перед застосуванням. Потребує `--force`, коли локальний стан OpenClaw існує.
</ParamField>
<ParamField path="--force" type="boolean">
  Потрібно разом із `--no-backup`, коли застосування інакше відмовилося б пропустити резервну копію.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести план або результат застосування як JSON. З `--json` і без `--yes` застосування виводить план і не змінює стан.
</ParamField>

## Модель безпеки

`openclaw migrate` спочатку показує попередній перегляд.

<AccordionGroup>
  <Accordion title="Попередній перегляд перед застосуванням">
    Постачальник повертає деталізований план до будь-яких змін, включно з конфліктами, пропущеними елементами та чутливими елементами. Плани JSON, вихід застосування та звіти міграції редагують вкладені ключі, схожі на секрети, як-от API-ключі, токени, заголовки авторизації, cookies і паролі.

    `openclaw migrate apply <provider>` попередньо показує план і запитує підтвердження перед зміною стану, якщо не задано `--yes`. У неінтерактивному режимі застосування потребує `--yes`.

  </Accordion>
  <Accordion title="Резервні копії">
    Застосування створює та перевіряє резервну копію OpenClaw перед застосуванням міграції. Якщо локальний стан OpenClaw ще не існує, крок резервного копіювання пропускається, а міграція може продовжитися. Щоб пропустити резервну копію, коли стан існує, передайте і `--no-backup`, і `--force`.
  </Accordion>
  <Accordion title="Конфлікти">
    Застосування відмовляється продовжувати, коли план має конфлікти. Перегляньте план, а потім запустіть повторно з `--overwrite`, якщо заміна наявних цілей є навмисною. Постачальники все ще можуть записувати резервні копії рівня елемента для перезаписаних файлів у каталозі звіту міграції.
  </Accordion>
  <Accordion title="Секрети">
    Секрети ніколи не імпортуються типово. Використовуйте `--include-secrets`, щоб імпортувати підтримувані облікові дані.
  </Accordion>
</AccordionGroup>

## Постачальник Claude

Вбудований постачальник Claude типово виявляє стан Claude Code у `~/.claude`. Використовуйте `--from <path>`, щоб імпортувати конкретний домашній каталог Claude Code або корінь проєкту.

<Tip>
Для покрокової інструкції для користувачів див. [Міграція з Claude](/uk/install/migrating-claude).
</Tip>

### Що імпортує Claude

- Проєктні `CLAUDE.md` і `.claude/CLAUDE.md` у робочу область агента OpenClaw.
- Користувацький `~/.claude/CLAUDE.md`, доданий до `USER.md` робочої області.
- Визначення серверів MCP з проєктного `.mcp.json`, Claude Code `~/.claude.json` і Claude Desktop `claude_desktop_config.json`.
- Каталоги навичок Claude, які містять `SKILL.md`.
- Markdown-файли команд Claude, перетворені на навички OpenClaw лише з ручним викликом.

### Архівний стан і стан для ручного перегляду

Хуки Claude, дозволи, типові значення середовища, локальна пам’ять, правила з обмеженням за шляхом, субагенти, кеші, плани та історія проєкту зберігаються у звіті міграції або повідомляються як елементи для ручного перегляду. OpenClaw не виконує хуки, не копіює широкі списки дозволів і не імпортує стан облікових даних OAuth/Desktop автоматично.

## Постачальник Codex

Вбудований постачальник Codex типово виявляє стан Codex CLI у `~/.codex` або
в `CODEX_HOME`, коли задано цю змінну середовища. Використовуйте `--from <path>`, щоб
інвентаризувати конкретний домашній каталог Codex.

Використовуйте цього постачальника під час переходу на OpenClaw Codex harness, якщо хочете
свідомо просунути корисні особисті активи Codex CLI. Локальні запуски app-server Codex
використовують окремі для агента каталоги `CODEX_HOME` і `HOME`, тому типово вони не читають
ваш особистий стан Codex CLI.

Запуск `openclaw migrate codex` в інтерактивному терміналі показує попередній перегляд повного
плану, а потім відкриває селектори з прапорцями перед остаточним підтвердженням застосування. Елементи
копіювання навичок запитуються першими. Використовуйте `Toggle all on` або `Toggle all off` для масового
вибору; заплановані навички починають позначеними, конфліктні навички починають непозначеними, а
`Skip for now` пропускає копіювання навичок для цього запуску, все ще продовжуючи до вибору plugins.
Коли встановлені з джерела curated plugins Codex можна мігрувати і
`--plugin` не було передано, міграція потім запитує активацію нативного Plugin Codex
за назвою Plugin. Елементи Plugin
починають позначеними, якщо цільова конфігурація Plugin OpenClaw Codex ще не має цього
Plugin. Наявні цільові plugins починають непозначеними та показують підказку конфлікту, як-от
`conflict: plugin exists`; виберіть `Toggle all off`, щоб не мігрувати нативні plugins Codex
у цьому запуску, або `Skip for now`, щоб зупинитися перед застосуванням. Для скриптових або
точних запусків передайте `--skill <name>` один раз для кожної навички, наприклад:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Використовуйте `--plugin <name>`, щоб неінтерактивно обмежити міграцію нативних plugins Codex
одним або кількома встановленими з джерела curated plugins:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Що імпортує Codex

- Каталоги навичок Codex CLI у `$CODEX_HOME/skills`, окрім кешу
  `.system` Codex.
- Особисті AgentSkills у `$HOME/.agents/skills`, скопійовані в поточну
  робочу область агента OpenClaw, коли потрібне володіння на рівні агента.
- Встановлені з джерела plugins Codex `openai-curated`, виявлені через
  app-server Codex `plugin/list`. Застосування викликає app-server `plugin/install` для кожного
  вибраного Plugin, навіть якщо цільовий app-server уже повідомляє, що цей Plugin
  встановлено й увімкнено. Мігрувані plugins Codex придатні для використання лише в сесіях, які
  вибирають нативний Codex harness; вони не доступні для Pi, звичайних запусків OpenAI
  provider, прив’язок розмов ACP або інших harnesses.

### Стан Codex для ручного перегляду

Codex `config.toml`, нативні `hooks/hooks.json`, не-curated marketplaces і
кешовані bundles Plugin, які не є встановленими з джерела curated plugins, не
активуються автоматично. Їх копіюють або зазначають у звіті міграції для
ручного перегляду.

Для мігруваних встановлених з джерела curated plugins застосування записує:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- один явний запис Plugin з `marketplaceName: "openai-curated"` і
  `pluginName` для кожного вибраного Plugin

Міграція ніколи не записує `plugins["*"]` і ніколи не зберігає локальні шляхи кешу marketplace.
Встановлення, що потребують автентифікації, повідомляються на відповідному елементі Plugin зі
`status: "skipped"`, `reason: "auth_required"` і санітизованими ідентифікаторами застосунку.
Їхні явні записи конфігурації записуються вимкненими, доки ви повторно не авторизуєте їх і не
увімкнете. Інші збої встановлення є результатами `error` на рівні елемента.

Якщо інвентар plugins app-server Codex недоступний під час планування, міграція
повертається до advisory-елементів кешованого bundle замість того, щоб провалити всю
міграцію.

## Постачальник Hermes

Вбудований постачальник Hermes типово виявляє стан у `~/.hermes`. Використовуйте `--from <path>`, коли Hermes розташований деінде.

### Що імпортує Hermes

- Типову конфігурацію моделі з `config.yaml`.
- Налаштованих постачальників моделей і власні OpenAI-сумісні кінцеві точки з `providers` і `custom_providers`.
- Визначення серверів MCP з `mcp_servers` або `mcp.servers`.
- `SOUL.md` і `AGENTS.md` у робочу область агента OpenClaw.
- `memories/MEMORY.md` і `memories/USER.md`, додані до файлів пам’яті робочої області.
- Типові значення конфігурації пам’яті для файлової пам’яті OpenClaw, а також архівні елементи або елементи ручного перегляду для зовнішніх постачальників пам’яті, таких як Honcho.
- Навички, які містять файл `SKILL.md` у `skills/<name>/`.
- Значення конфігурації для окремих навичок із `skills.config`.
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

Джерела міграції є plugins. Plugin оголошує свої ідентифікатори постачальників у `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Під час виконання Plugin викликає `api.registerMigrationProvider(...)`. Постачальник реалізує `detect`, `plan` і `apply`. Ядро володіє оркестрацією CLI, політикою резервного копіювання, запитами, виводом JSON і попередньою перевіркою конфліктів. Ядро передає переглянутий план у `apply(ctx, plan)`, а постачальники можуть перебудовувати план лише тоді, коли цей аргумент відсутній для сумісності.

Plugins-постачальники можуть використовувати `openclaw/plugin-sdk/migration` для побудови елементів і підрахунків зведення, а також `openclaw/plugin-sdk/migration-runtime` для копіювання файлів із урахуванням конфліктів, копій звітів лише для архіву, кешованих обгорток config-runtime і звітів міграції.

## Інтеграція онбордингу

Онбординг може запропонувати міграцію, коли постачальник виявляє відоме джерело. І `openclaw onboard --flow import`, і `openclaw setup --wizard --import-from hermes` використовують того самого постачальника міграції Plugin і все одно показують попередній перегляд перед застосуванням.

<Note>
Імпорти під час онбордингу потребують свіжого налаштування OpenClaw. Спершу скиньте конфігурацію, облікові дані, сеанси та робочий простір, якщо у вас уже є локальний стан. Імпорти зі створенням резервної копії та перезаписом або зі злиттям для наявних налаштувань доступні лише через функціональний прапорець.
</Note>

## Пов’язане

- [Міграція з Hermes](/uk/install/migrating-hermes): покроковий посібник для користувачів.
- [Міграція з Claude](/uk/install/migrating-claude): покроковий посібник для користувачів.
- [Міграція](/uk/install/migrating): перенесення OpenClaw на нову машину.
- [Doctor](/uk/gateway/doctor): перевірка стану після застосування міграції.
- [Plugins](/uk/tools/plugin): встановлення та реєстрація plugin.
