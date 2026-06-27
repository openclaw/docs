---
read_when:
    - Ви хочете перейти з Hermes або іншої агентної системи на OpenClaw
    - Ви додаєте провайдер міграцій, що належить плагіну
summary: Довідник CLI для `openclaw migrate` (імпорт стану з іншої агентної системи)
title: Мігрувати
x-i18n:
    generated_at: "2026-06-27T17:21:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Імпортуйте стан з іншої агентної системи через провайдера міграції, яким володіє плагін. Вбудовані провайдери охоплюють стан Codex CLI, [Claude](/uk/install/migrating-claude) і [Hermes](/uk/install/migrating-hermes); сторонні плагіни можуть реєструвати додаткових провайдерів.

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
  Назва зареєстрованого провайдера міграції, наприклад `hermes`. Запустіть `openclaw migrate list`, щоб побачити встановлених провайдерів.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Створити план і вийти без зміни стану.
</ParamField>
<ParamField path="--from <path>" type="string">
  Перевизначити каталог вихідного стану. Hermes за замовчуванням використовує `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Імпортувати підтримувані облікові дані без запиту. Інтерактивне застосування запитує перед імпортом виявлених облікових даних автентифікації, із вибраним за замовчуванням «так»; неінтерактивний `--yes` потребує `--include-secrets`, щоб імпортувати їх.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Пропустити імпорт облікових даних автентифікації, включно з інтерактивним запитом.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Дозволити застосуванню замінювати наявні цілі, коли план повідомляє про конфлікти.
</ParamField>
<ParamField path="--yes" type="boolean">
  Пропустити запит підтвердження. Обов’язково в неінтерактивному режимі.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Вибрати один елемент копіювання skill за назвою skill або ідентифікатором елемента. Повторіть прапорець, щоб мігрувати кілька skills. Якщо пропущено, інтерактивні міграції Codex показують селектор із прапорцями, а неінтерактивні міграції зберігають усі заплановані skills.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Вибрати один елемент установлення плагіна Codex за назвою плагіна або ідентифікатором елемента. Повторіть прапорець, щоб мігрувати кілька плагінів Codex. Якщо пропущено, інтерактивні міграції Codex показують нативний селектор плагінів Codex із прапорцями, а неінтерактивні міграції зберігають усі заплановані плагіни. Це застосовується лише до встановлених у джерелі плагінів Codex `openai-curated`, виявлених інвентарем app-server Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Лише Codex. Примусово виконати свіжий обхід `app/list` вихідного app-server Codex перед плануванням нативної активації плагінів. Типово вимкнено, щоб планування міграції залишалося швидким.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Пропустити резервну копію перед застосуванням. Потребує `--force`, коли існує локальний стан OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Обов’язково разом із `--no-backup`, коли інакше застосування відмовилося б пропустити резервне копіювання.
</ParamField>
<ParamField path="--json" type="boolean">
  Надрукувати план або результат застосування як JSON. З `--json` і без `--yes` застосування друкує план і не змінює стан.
</ParamField>

## Модель безпеки

`openclaw migrate` спочатку показує попередній перегляд.

<AccordionGroup>
  <Accordion title="Попередній перегляд перед застосуванням">
    Провайдер повертає деталізований план до будь-яких змін, включно з конфліктами, пропущеними елементами та чутливими елементами. Плани JSON, вивід застосування та звіти міграції редагують вкладені ключі, схожі на секрети, як-от ключі API, токени, заголовки авторизації, cookies і паролі.

    `openclaw migrate apply <provider>` попередньо показує план і запитує перед зміною стану, якщо не встановлено `--yes`. У неінтерактивному режимі застосування потребує `--yes`.

  </Accordion>
  <Accordion title="Резервні копії">
    Застосування створює та перевіряє резервну копію OpenClaw перед застосуванням міграції. Якщо локального стану OpenClaw ще немає, крок резервного копіювання пропускається, і міграція може продовжитися. Щоб пропустити резервну копію, коли стан існує, передайте і `--no-backup`, і `--force`.
  </Accordion>
  <Accordion title="Конфлікти">
    Застосування відмовляється продовжувати, коли план має конфлікти. Перегляньте план, а потім повторно запустіть із `--overwrite`, якщо заміна наявних цілей є навмисною. Провайдери все ще можуть записувати резервні копії на рівні елементів для перезаписаних файлів у каталозі звіту міграції.
  </Accordion>
  <Accordion title="Секрети">
    Інтерактивне застосування запитує, чи імпортувати виявлені облікові дані автентифікації, із вибраним за замовчуванням «так». Використовуйте `--no-auth-credentials`, щоб пропустити їх, або `--include-secrets` для автоматичного імпорту облікових даних із `--yes`.
  </Accordion>
</AccordionGroup>

## Провайдер Claude

Вбудований провайдер Claude за замовчуванням виявляє стан Claude Code у `~/.claude`. Використовуйте `--from <path>`, щоб імпортувати конкретний домашній каталог Claude Code або корінь проєкту.

<Tip>
Покрокову інструкцію для користувачів див. у [Міграція з Claude](/uk/install/migrating-claude).
</Tip>

### Що імпортує Claude

- Проєктні `CLAUDE.md` і `.claude/CLAUDE.md` до робочого простору агента OpenClaw.
- Користувацький `~/.claude/CLAUDE.md`, доданий до `USER.md` робочого простору.
- Визначення серверів MCP з проєктного `.mcp.json`, Claude Code `~/.claude.json` і Claude Desktop `claude_desktop_config.json`.
- Каталоги skills Claude, які містять `SKILL.md`.
- Markdown-файли команд Claude, перетворені на skills OpenClaw лише з ручним викликом.

### Архів і стан для ручного перегляду

Хуки Claude, дозволи, типові значення середовища, локальна пам’ять, правила з областю дії за шляхом, субагенти, кеші, плани та історія проєкту зберігаються у звіті міграції або повідомляються як елементи для ручного перегляду. OpenClaw не виконує хуки, не копіює широкі allowlist і не імпортує стан облікових даних OAuth/Desktop автоматично.

## Провайдер Codex

Вбудований провайдер Codex за замовчуванням виявляє стан Codex CLI у `~/.codex` або
у `CODEX_HOME`, коли встановлено цю змінну середовища. Використовуйте `--from <path>`, щоб
інвентаризувати конкретний домашній каталог Codex.

Використовуйте цього провайдера під час переходу на OpenClaw Codex harness, коли хочете
навмисно перенести корисні особисті ресурси Codex CLI. Локальні запуски app-server Codex
використовують `CODEX_HOME` для кожного агента, тому типово не читають ваш особистий
`~/.codex`. Звичайний процес `HOME` усе ще успадковується, тому Codex
може бачити спільні skills `$HOME/.agents/*`/записи marketplace плагінів, а
підпроцеси можуть знаходити конфігурацію та токени в домашньому каталозі користувача.

Запуск `openclaw migrate codex` в інтерактивному терміналі показує попередній перегляд повного
плану, а потім відкриває селектори з прапорцями перед остаточним підтвердженням застосування. Елементи
копіювання skill запитуються першими. Використовуйте `Toggle all on` або `Toggle all off` для масового
вибору. Натисніть Space, щоб перемикати рядки, або Enter, щоб активувати виділений
рядок і продовжити. Заплановані skills починають позначеними, конфліктні skills починають непозначеними, а
`Skip for now` пропускає копіювання skills для цього запуску, все ще продовжуючи до вибору плагінів.
Коли встановлені у джерелі curated плагіни Codex можна мігрувати, а
`--plugin` не було надано, міграція потім запитує нативну активацію плагінів Codex
за назвою плагіна. Елементи плагінів
починають позначеними, якщо цільова конфігурація плагіна OpenClaw Codex ще не має цього
плагіна. Наявні цільові плагіни починають непозначеними та показують підказку конфлікту, як-от
`conflict: plugin exists`; виберіть `Toggle all off`, щоб не мігрувати жодних нативних плагінів Codex
у цьому запуску, або `Skip for now`, щоб зупинитися перед застосуванням. Для скриптованих або
точних запусків передайте `--skill <name>` один раз для кожного skill, наприклад:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Використовуйте `--plugin <name>`, щоб неінтерактивно обмежити міграцію нативних плагінів Codex
одним або кількома встановленими у джерелі curated плагінами:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Що імпортує Codex

- Каталоги skills Codex CLI у `$CODEX_HOME/skills`, за винятком кешу Codex
  `.system`.
- Особисті AgentSkills у `$HOME/.agents/skills`, скопійовані до поточного
  робочого простору агента OpenClaw, коли потрібне володіння на рівні агента.
- Встановлені у джерелі плагіни Codex `openai-curated`, виявлені через Codex
  app-server `plugin/list`. Планування читає `plugin/read` для кожного увімкненого
  встановленого плагіна. Плагіни, підтримувані застосунками, потребують, щоб відповідь облікового запису вихідного app-server Codex
  була обліковим записом із підпискою ChatGPT; відповіді без ChatGPT або відсутні
  відповіді облікового запису пропускаються з `codex_subscription_required`. За замовчуванням
  міграція не викликає вихідний `app/list`, тому плагіни, підтримувані застосунками, які проходять
  перевірку облікового запису, плануються без перевірки доступності вихідного застосунку, а
  транспортні збої пошуку облікового запису пропускаються з `codex_account_unavailable`. Передайте
  `--verify-plugin-apps`, коли хочете, щоб міграція примусово створила свіжий знімок
  вихідного `app/list` і вимагала, щоб кожен власний застосунок був присутній, увімкнений і
  доступний перед плануванням нативної активації. У цьому режимі транспортні збої пошуку
  облікового запису переходять до перевірки інвентарю вихідних застосунків. Знімок інвентарю
  вихідних застосунків зберігається в пам’яті для поточного процесу; він
  не записується до виводу міграції або цільової конфігурації. Вимкнені плагіни,
  нечитабельні деталі плагінів, вихідні облікові записи, обмежені підпискою, і, коли
  запитано перевірку, відсутні застосунки, вимкнені застосунки, недоступні застосунки або
  збої інвентарю вихідних застосунків стають пропущеними вручну елементами з типізованими причинами
  замість записів цільової конфігурації.
  Застосування викликає app-server `plugin/install` для кожного вибраного придатного плагіна,
  навіть якщо цільовий app-server уже повідомляє, що цей плагін встановлений і
  увімкнений. Мігровані плагіни Codex можна використовувати лише в сеансах, які вибирають
  нативний Codex harness; вони не надаються запускам провайдерів OpenClaw,
  прив’язкам розмов ACP або іншим harness.

### Стан Codex для ручного перегляду

Codex `config.toml`, нативні `hooks/hooks.json`, не-curated marketplaces, кешовані
пакети плагінів, які не є встановленими у джерелі curated плагінами, і встановлені у джерелі
плагіни, які не проходять перевірку вихідної підписки, не активуються автоматично.
Коли встановлено `--verify-plugin-apps`, плагіни, які не проходять перевірку інвентарю вихідних застосунків,
також пропускаються. Вони копіюються або повідомляються у звіті міграції для
ручного перегляду.

Для мігрованих встановлених у джерелі curated плагінів застосування записує:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- один явний запис плагіна з `marketplaceName: "openai-curated"` і
  `pluginName` для кожного вибраного плагіна

Міграція ніколи не записує `plugins["*"]` і ніколи не зберігає локальні шляхи кешу marketplace.
Збої підписок на стороні джерела повідомляються в ручних елементах із типізованими
причинами, такими як `codex_subscription_required`, `codex_account_unavailable`,
`plugin_disabled` або `plugin_read_unavailable`. З `--verify-plugin-apps`
збої інвентаризації застосунків джерела також можуть з’являтися як `app_inaccessible`,
`app_disabled`, `app_missing` або `app_inventory_unavailable`. Пропущені плагіни
не записуються до цільової конфігурації.
Встановлення на цільовій стороні, що потребують автентифікації, повідомляються в ураженому елементі плагіна зі
`status: "skipped"`, `reason: "auth_required"` і санітизованими ідентифікаторами застосунків.
Їхні явні записи конфігурації записуються вимкненими, доки ви повторно не авторизуєтеся й
не ввімкнете їх. Інші збої встановлення є результатами `error`, прив’язаними до елемента.

Якщо інвентар Plugin сервера застосунків Codex недоступний під час планування, міграція
повертається до кешованих рекомендаційних елементів пакета замість того, щоб провалити всю
міграцію.

## Провайдер Hermes

Вбудований провайдер Hermes за замовчуванням виявляє стан у `~/.hermes`. Використовуйте `--from <path>`, коли Hermes розташований в іншому місці.

### Що імпортує Hermes

- Конфігурацію моделі за замовчуванням із `config.yaml`.
- Налаштованих провайдерів моделей і користувацькі OpenAI-сумісні кінцеві точки з `providers` і `custom_providers`.
- Визначення серверів MCP із `mcp_servers` або `mcp.servers`.
- `SOUL.md` і `AGENTS.md` до робочого простору агента OpenClaw.
- `memories/MEMORY.md` і `memories/USER.md`, додані до файлів пам’яті робочого простору.
- Типові значення конфігурації пам’яті для файлової пам’яті OpenClaw, а також архівні елементи або елементи для ручного перегляду для зовнішніх провайдерів пам’яті, таких як Honcho.
- Skills, що містять файл `SKILL.md` у `skills/<name>/`.
- Значення конфігурації для окремих Skills із `skills.config`.
- Облікові дані OpenCode OpenAI OAuth з OpenCode `auth.json`, коли прийнято інтерактивну міграцію облікових даних або коли встановлено `--include-secrets`. Записи OAuth Hermes `auth.json` є застарілим станом, про який повідомляється для ручної повторної автентифікації OpenAI або ремонту через doctor.
- Підтримувані API-ключі й токени з Hermes `.env` і OpenCode `auth.json`, коли прийнято інтерактивну міграцію облікових даних або коли встановлено `--include-secrets`.

### Підтримувані ключі `.env`

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### Стан лише для архіву

Стан Hermes, який OpenClaw не може безпечно інтерпретувати, копіюється до звіту міграції для ручного перегляду, але не завантажується до живої конфігурації або облікових даних OpenClaw. Це зберігає непрозорий або небезпечний стан, не вдаючи, що OpenClaw може виконувати його або автоматично йому довіряти:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

### Після застосування

```bash
openclaw doctor
```

## Контракт Plugin

Джерела міграції є плагінами. Плагін оголошує свої ідентифікатори провайдерів у `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Під час виконання плагін викликає `api.registerMigrationProvider(...)`. Провайдер реалізує `detect`, `plan` і `apply`. Ядро відповідає за оркестрацію CLI, політику резервного копіювання, підказки, JSON-вивід і попередню перевірку конфліктів. Ядро передає переглянутий план у `apply(ctx, plan)`, а провайдери можуть перебудовувати план лише тоді, коли цей аргумент відсутній для сумісності.

Плагіни-провайдери можуть використовувати `openclaw/plugin-sdk/migration` для створення елементів і підрахунків у підсумку, а також `openclaw/plugin-sdk/migration-runtime` для копіювання файлів з урахуванням конфліктів, копій звіту лише для архіву, кешованих обгорток config-runtime і звітів міграції.

## Інтеграція онбордингу

Онбординг може запропонувати міграцію, коли провайдер виявляє відоме джерело. І `openclaw onboard --flow import`, і `openclaw setup --wizard --import-from hermes` використовують той самий провайдер міграції плагіна й усе одно показують попередній перегляд перед застосуванням.

<Note>
Імпорти під час онбордингу потребують свіжого налаштування OpenClaw. Спочатку скиньте конфігурацію, облікові дані, сеанси й робочий простір, якщо у вас уже є локальний стан. Імпорти з резервним копіюванням і перезаписом або злиттям доступні для наявних налаштувань лише за feature gate.
</Note>

## Пов’язане

- [Міграція з Hermes](/uk/install/migrating-hermes): покроковий посібник для користувача.
- [Міграція з Claude](/uk/install/migrating-claude): покроковий посібник для користувача.
- [Міграція](/uk/install/migrating): перенесення OpenClaw на нову машину.
- [Doctor](/uk/gateway/doctor): перевірка стану після застосування міграції.
- [Плагіни](/uk/tools/plugin): встановлення й реєстрація плагінів.
