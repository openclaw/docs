---
read_when:
    - Ви хочете мігрувати з Hermes або іншої агентної системи до OpenClaw
    - Ви додаєте постачальника міграцій, що належить Plugin
summary: Довідник CLI для `openclaw migrate` (імпорт стану з іншої системи агентів)
title: Міграція
x-i18n:
    generated_at: "2026-05-12T23:30:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Імпортуйте стан з іншої агентної системи через постачальника міграції, що належить Plugin. Вбудовані постачальники охоплюють стан Codex CLI, [Claude](/uk/install/migrating-claude) і [Hermes](/uk/install/migrating-hermes); сторонні plugins можуть реєструвати додаткових постачальників.

<Tip>
Покрокові інструкції для користувачів див. у розділах [Міграція з Claude](/uk/install/migrating-claude) і [Міграція з Hermes](/uk/install/migrating-hermes). [Центр міграції](/uk/install/migrating) перелічує всі шляхи.
</Tip>

## Команди

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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
  Ім’я зареєстрованого постачальника міграції, наприклад `hermes`. Запустіть `openclaw migrate list`, щоб побачити встановлених постачальників.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Створити план і вийти без зміни стану.
</ParamField>
<ParamField path="--from <path>" type="string">
  Перевизначити каталог вихідного стану. Для Hermes типовим є `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Імпортувати підтримувані облікові дані. Вимкнено за замовчуванням.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Дозволити застосуванню замінювати наявні цілі, коли план повідомляє про конфлікти.
</ParamField>
<ParamField path="--yes" type="boolean">
  Пропустити запит підтвердження. Обов’язково в неінтерактивному режимі.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Вибрати один елемент копіювання skill за назвою skill або ідентифікатором елемента. Повторіть прапорець, щоб мігрувати кілька skills. Якщо прапорець пропущено, інтерактивні міграції Codex показують селектор із прапорцями, а неінтерактивні міграції зберігають усі заплановані skills.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Вибрати один елемент встановлення Codex plugin за назвою plugin або ідентифікатором елемента. Повторіть прапорець, щоб мігрувати кілька Codex plugins. Якщо прапорець пропущено, інтерактивні міграції Codex показують нативний селектор Codex plugin із прапорцями, а неінтерактивні міграції зберігають усі заплановані plugins. Це застосовується лише до встановлених у джерелі Codex plugins `openai-curated`, виявлених інвентаризацією app-server Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Лише Codex. Примусово виконати свіжий обхід `app/list` вихідного app-server Codex перед плануванням активації нативних plugins. Вимкнено за замовчуванням, щоб планування міграції залишалося швидким.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Пропустити резервну копію перед застосуванням. Потребує `--force`, коли локальний стан OpenClaw існує.
</ParamField>
<ParamField path="--force" type="boolean">
  Обов’язково разом із `--no-backup`, коли застосування інакше відмовилося б пропустити резервне копіювання.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести план або результат застосування як JSON. З `--json` і без `--yes` застосування виводить план і не змінює стан.
</ParamField>

## Модель безпеки

`openclaw migrate` спершу показує попередній перегляд.

<AccordionGroup>
  <Accordion title="Попередній перегляд перед застосуванням">
    Постачальник повертає деталізований план до будь-яких змін, включно з конфліктами, пропущеними елементами та чутливими елементами. Плани JSON, вивід застосування та звіти міграції редагують вкладені ключі, схожі на секрети, як-от API-ключі, токени, заголовки авторизації, cookies і паролі.

    `openclaw migrate apply <provider>` показує попередній перегляд плану й запитує підтвердження перед зміною стану, якщо не встановлено `--yes`. У неінтерактивному режимі застосування потребує `--yes`.

  </Accordion>
  <Accordion title="Резервні копії">
    Застосування створює та перевіряє резервну копію OpenClaw перед застосуванням міграції. Якщо локального стану OpenClaw ще немає, крок резервного копіювання пропускається, і міграція може продовжитися. Щоб пропустити резервне копіювання, коли стан існує, передайте і `--no-backup`, і `--force`.
  </Accordion>
  <Accordion title="Конфлікти">
    Застосування відмовляється продовжувати, коли план має конфлікти. Перегляньте план, а потім перезапустіть із `--overwrite`, якщо заміна наявних цілей є навмисною. Постачальники все одно можуть записувати резервні копії на рівні елементів для перезаписаних файлів у каталозі звіту міграції.
  </Accordion>
  <Accordion title="Секрети">
    Секрети ніколи не імпортуються за замовчуванням. Використовуйте `--include-secrets`, щоб імпортувати підтримувані облікові дані.
  </Accordion>
</AccordionGroup>

## Постачальник Claude

Вбудований постачальник Claude за замовчуванням виявляє стан Claude Code у `~/.claude`. Використовуйте `--from <path>`, щоб імпортувати конкретний домашній каталог Claude Code або корінь проєкту.

<Tip>
Покрокову інструкцію для користувачів див. у розділі [Міграція з Claude](/uk/install/migrating-claude).
</Tip>

### Що імпортує Claude

- Проєктні `CLAUDE.md` і `.claude/CLAUDE.md` у робочий простір агента OpenClaw.
- Користувацький `~/.claude/CLAUDE.md`, доданий до `USER.md` робочого простору.
- Визначення MCP-серверів із проєктного `.mcp.json`, Claude Code `~/.claude.json` і Claude Desktop `claude_desktop_config.json`.
- Каталоги Claude skills, які містять `SKILL.md`.
- Markdown-файли команд Claude, перетворені на OpenClaw skills лише з ручним викликом.

### Архівний стан і стан для ручного перегляду

Хуки Claude, дозволи, типові значення середовища, локальна пам’ять, правила з областю дії за шляхом, субагенти, кеші, плани та історія проєкту зберігаються у звіті міграції або повідомляються як елементи для ручного перегляду. OpenClaw не виконує хуки, не копіює широкі allowlists і не імпортує стан OAuth/Desktop облікових даних автоматично.

## Постачальник Codex

Вбудований постачальник Codex за замовчуванням виявляє стан Codex CLI у `~/.codex` або
у `CODEX_HOME`, коли цю змінну середовища встановлено. Використовуйте `--from <path>`, щоб
інвентаризувати конкретний домашній каталог Codex.

Використовуйте цього постачальника під час переходу на harness OpenClaw Codex, коли хочете
свідомо перенести корисні особисті ресурси Codex CLI. Запуски локального app-server Codex
використовують окремі для кожного агента каталоги `CODEX_HOME` і `HOME`, тому за замовчуванням вони не читають
ваш особистий стан Codex CLI.

Запуск `openclaw migrate codex` в інтерактивному терміналі показує попередній перегляд повного
плану, а потім відкриває селектори з прапорцями перед остаточним підтвердженням застосування. Елементи
копіювання skills запитуються першими. Використовуйте `Toggle all on` або `Toggle all off` для масового
вибору. Натисніть Space, щоб перемикати рядки, або натисніть Enter, щоб активувати виділений
рядок і продовжити. Заплановані skills починаються позначеними, конфліктні skills починаються непозначеними, а
`Skip for now` пропускає копіювання skills для цього запуску, водночас продовжуючи вибір plugins.
Коли встановлені у джерелі curated Codex plugins можна мігрувати і
`--plugin` не було передано, міграція потім запитує активацію нативних Codex plugins
за назвою plugin. Елементи plugin
починаються позначеними, якщо цільова конфігурація OpenClaw Codex plugin уже не має цього
plugin. Наявні цільові plugins починаються непозначеними й показують підказку про конфлікт, наприклад
`conflict: plugin exists`; виберіть `Toggle all off`, щоб не мігрувати нативні Codex
plugins у цьому запуску, або `Skip for now`, щоб зупинитися перед застосуванням. Для скриптових або
точних запусків передайте `--skill <name>` один раз для кожного skill, наприклад:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Використовуйте `--plugin <name>`, щоб неінтерактивно обмежити міграцію нативних Codex plugins
одним або кількома встановленими у джерелі curated plugins:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Що імпортує Codex

- Каталоги skills Codex CLI під `$CODEX_HOME/skills`, за винятком кешу Codex
  `.system`.
- Особисті AgentSkills під `$HOME/.agents/skills`, скопійовані в поточний
  робочий простір агента OpenClaw, коли потрібна власність на рівні агента.
- Встановлені у джерелі Codex plugins `openai-curated`, виявлені через
  app-server `plugin/list` Codex. Планування читає `plugin/read` для кожного ввімкненого
  встановленого plugin. Plugins, підтримані застосунками, потребують, щоб відповідь облікового запису вихідного app-server Codex
  була обліковим записом із підпискою ChatGPT; відповіді не-ChatGPT або відсутні
  відповіді облікового запису пропускаються з `codex_subscription_required`. За замовчуванням
  міграція не викликає вихідний `app/list`, тому plugins, підтримані застосунками, які проходять
  перевірку облікового запису, плануються без перевірки доступності вихідного застосунку, а
  транспортні збої пошуку облікового запису пропускаються з `codex_account_unavailable`. Передайте
  `--verify-plugin-apps`, коли хочете, щоб міграція примусово створила свіжий знімок вихідного
  `app/list` і вимагала, щоб кожен власний застосунок був присутній, увімкнений і
  доступний перед плануванням нативної активації. У цьому режимі транспортні збої пошуку
  облікового запису переходять до перевірки інвентаризації вихідних застосунків. Знімок
  інвентаризації вихідних застосунків зберігається в пам’яті для поточного процесу; він
  не записується у вивід міграції або цільову конфігурацію. Вимкнені plugins,
  нечитабельні деталі plugins, вихідні облікові записи з обмеженням підпискою, а також, коли
  запитано перевірку, відсутні застосунки, вимкнені застосунки, недоступні застосунки або
  збої інвентаризації вихідних застосунків стають пропущеними вручну елементами з типізованими причинами
  замість записів цільової конфігурації.
  Застосування викликає app-server `plugin/install` для кожного вибраного придатного plugin,
  навіть якщо цільовий app-server уже повідомляє, що цей plugin встановлено й
  увімкнено. Мігрувані Codex plugins придатні лише в сесіях, які вибирають
  нативний harness Codex; вони не надаються Pi, звичайним запускам провайдера OpenAI,
  прив’язкам розмов ACP або іншим harnesses.

### Стан Codex для ручного перегляду

Codex `config.toml`, нативні `hooks/hooks.json`, не-curated marketplaces, кешовані
набори plugins, які не є встановленими у джерелі curated plugins, і встановлені у джерелі
plugins, які не проходять вихідну перевірку підписки, не активуються автоматично.
Коли встановлено `--verify-plugin-apps`, plugins, які не проходять перевірку інвентаризації вихідних застосунків,
також пропускаються. Вони копіюються або повідомляються у звіті міграції для
ручного перегляду.

Для мігрованих встановлених у джерелі curated plugins застосування записує:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- один явний запис plugin з `marketplaceName: "openai-curated"` і
  `pluginName` для кожного вибраного plugin

Міграція ніколи не записує `plugins["*"]` і ніколи не зберігає локальні шляхи кешу marketplace.
Збої підписки на стороні джерела повідомляються в ручних елементах із типізованими
причинами, як-от `codex_subscription_required`, `codex_account_unavailable`,
`plugin_disabled` або `plugin_read_unavailable`. З `--verify-plugin-apps`
збої інвентаризації вихідних застосунків також можуть з’являтися як `app_inaccessible`,
`app_disabled`, `app_missing` або `app_inventory_unavailable`. Пропущені plugins
не записуються в цільову конфігурацію.
Встановлення на стороні цілі, що потребують автентифікації, повідомляються для відповідного елемента plugin зі
`status: "skipped"`, `reason: "auth_required"` і очищеними ідентифікаторами застосунків.
Їхні явні записи конфігурації записуються вимкненими, доки ви повторно не авторизуєте
і не ввімкнете їх. Інші збої встановлення є результатами `error` в області елемента.

Якщо інвентаризація plugins app-server Codex недоступна під час планування, міграція
повертається до advisory-елементів кешованих наборів замість збою всієї
міграції.

## Постачальник Hermes

Вбудований постачальник Hermes за замовчуванням виявляє стан у `~/.hermes`. Використовуйте `--from <path>`, коли Hermes розташований в іншому місці.

### Що імпортує Hermes

- Типова конфігурація моделі з `config.yaml`.
- Налаштовані постачальники моделей і власні кінцеві точки, сумісні з OpenAI, з `providers` і `custom_providers`.
- Визначення серверів MCP з `mcp_servers` або `mcp.servers`.
- `SOUL.md` і `AGENTS.md` у робочий простір агента OpenClaw.
- `memories/MEMORY.md` і `memories/USER.md`, додані до файлів пам’яті робочого простору.
- Типові параметри конфігурації пам’яті для файлової пам’яті OpenClaw, а також архівні елементи або елементи для ручного перегляду для зовнішніх постачальників пам’яті, таких як Honcho.
- Skills, що містять файл `SKILL.md` у `skills/<name>/`.
- Значення конфігурації для окремих Skills з `skills.config`.
- Підтримувані API-ключі з `.env`, лише з `--include-secrets`.

### Підтримувані ключі `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Стан лише для архіву

Стан Hermes, який OpenClaw не може безпечно інтерпретувати, копіюється у звіт міграції для ручного перегляду, але не завантажується в робочу конфігурацію або облікові дані OpenClaw. Це зберігає непрозорий або небезпечний стан, не створюючи хибного враження, що OpenClaw може автоматично виконувати його або довіряти йому:

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

Під час виконання plugin викликає `api.registerMigrationProvider(...)`. Постачальник реалізує `detect`, `plan` і `apply`. Ядро відповідає за оркестрацію CLI, політику резервного копіювання, запити, JSON-вивід і попередню перевірку конфліктів. Ядро передає переглянутий план у `apply(ctx, plan)`, а постачальники можуть перебудовувати план лише тоді, коли цей аргумент відсутній для сумісності.

Provider plugins можуть використовувати `openclaw/plugin-sdk/migration` для створення елементів і підрахунку підсумків, а також `openclaw/plugin-sdk/migration-runtime` для копіювання файлів з урахуванням конфліктів, копій звітів лише для архіву, кешованих обгорток config-runtime і звітів міграції.

## Інтеграція онбордингу

Онбординг може запропонувати міграцію, коли постачальник виявляє відоме джерело. І `openclaw onboard --flow import`, і `openclaw setup --wizard --import-from hermes` використовують того самого постачальника міграції plugin і все одно показують попередній перегляд перед застосуванням.

<Note>
Імпорти під час онбордингу потребують чистого налаштування OpenClaw. Спочатку скиньте конфігурацію, облікові дані, сесії та робочий простір, якщо у вас уже є локальний стан. Імпорти з резервним копіюванням і перезаписом або злиттям для наявних налаштувань доступні за feature gate.
</Note>

## Пов’язане

- [Міграція з Hermes](/uk/install/migrating-hermes): інструкція для користувачів.
- [Міграція з Claude](/uk/install/migrating-claude): інструкція для користувачів.
- [Міграція](/uk/install/migrating): перенесення OpenClaw на нову машину.
- [Doctor](/uk/gateway/doctor): перевірка стану після застосування міграції.
- [Plugins](/uk/tools/plugin): встановлення та реєстрація plugins.
