---
read_when:
    - Ви хочете мігрувати з Hermes або іншої системи агентів до OpenClaw
    - Ви додаєте Plugin-власний провайдер міграції
summary: Довідник CLI для `openclaw migrate` (імпортувати стан з іншої системи агентів)
title: Мігрувати
x-i18n:
    generated_at: "2026-04-27T08:25:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f509745e8967d0e89accd803acd5e9cfb1d25040f49cbe8d2cc858d6911792d8
    source_path: cli/migrate.md
    workflow: 15
---

# `openclaw migrate`

Імпортуйте стан з іншої системи агентів через Plugin-власний провайдер міграції.

<Tip>
Покроковий посібник для користувачів щодо переходу з Hermes див. у [Migrating from Hermes](/uk/install/migrating-hermes).
</Tip>

## Команди

```bash
openclaw migrate list
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Назва зареєстрованого провайдера міграції, наприклад `hermes`. Виконайте `openclaw migrate list`, щоб побачити встановлені провайдери.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Побудувати план і вийти без зміни стану.
</ParamField>
<ParamField path="--from <path>" type="string">
  Перевизначити каталог вихідного стану. Для Hermes типовим значенням є `~/.hermes`.
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
  Пропустити резервне копіювання перед apply. Потребує `--force`, якщо локальний стан OpenClaw існує.
</ParamField>
<ParamField path="--force" type="boolean">
  Обов’язково разом із `--no-backup`, якщо apply інакше відмовився б пропустити резервне копіювання.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести план або результат apply як JSON. З `--json` і без `--yes` apply виводить план і не змінює стан.
</ParamField>

## Модель безпеки

`openclaw migrate` спочатку показує попередній перегляд.

<AccordionGroup>
  <Accordion title="Попередній перегляд перед застосуванням">
    Провайдер повертає деталізований план до внесення будь-яких змін, включно з конфліктами, пропущеними елементами та чутливими елементами. Плани JSON, вивід apply і звіти міграції приховують вкладені ключі, схожі на секрети, такі як ключі API, токени, заголовки авторизації, cookies і паролі.

    `openclaw migrate apply <provider>` показує попередній перегляд плану та запитує підтвердження перед зміною стану, якщо не задано `--yes`. У неінтерактивному режимі apply потребує `--yes`.

  </Accordion>
  <Accordion title="Резервні копії">
    Apply створює та перевіряє резервну копію OpenClaw перед застосуванням міграції. Якщо локальний стан OpenClaw ще не існує, крок резервного копіювання пропускається, і міграція може продовжитися. Щоб пропустити резервне копіювання, коли стан існує, передайте одночасно `--no-backup` і `--force`.
  </Accordion>
  <Accordion title="Конфлікти">
    Apply відмовляється продовжувати, якщо в плані є конфлікти. Перегляньте план, а потім повторно виконайте команду з `--overwrite`, якщо заміна наявних цілей є навмисною. Провайдери все одно можуть записувати резервні копії окремих елементів для перезаписаних файлів у каталог звіту міграції.
  </Accordion>
  <Accordion title="Секрети">
    Секрети ніколи не імпортуються типово. Використайте `--include-secrets`, щоб імпортувати підтримувані облікові дані.
  </Accordion>
</AccordionGroup>

## Провайдер Hermes

Вбудований провайдер Hermes типово виявляє стан у `~/.hermes`. Використовуйте `--from <path>`, якщо Hermes розташований деінде.

### Що імпортується

- Типова конфігурація моделі з `config.yaml`.
- Налаштовані провайдери моделей і власні сумісні з OpenAI кінцеві точки з `providers` і `custom_providers`.
- Визначення серверів MCP з `mcp_servers` або `mcp.servers`.
- `SOUL.md` і `AGENTS.md` до робочого простору агента OpenClaw.
- `memories/MEMORY.md` і `memories/USER.md`, додані до файлів пам’яті робочого простору.
- Типові значення конфігурації пам’яті для файлової пам’яті OpenClaw, а також елементи архіву або ручного перегляду для зовнішніх провайдерів пам’яті, таких як Honcho.
- Skills, які містять файл `SKILL.md` у `skills/<name>/`.
- Значення конфігурації для кожної навички з `skills.config`.
- Підтримувані ключі API з `.env`, лише з `--include-secrets`.

### Підтримувані ключі `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Стан лише для архіву

Стан Hermes, який OpenClaw не може безпечно інтерпретувати, копіюється до звіту міграції для ручного перегляду, але не завантажується в активну конфігурацію чи облікові дані OpenClaw. Це зберігає непрозорий або небезпечний стан, не створюючи хибного враження, що OpenClaw може автоматично його виконувати або довіряти йому:

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

Під час виконання Plugin викликає `api.registerMigrationProvider(...)`. Провайдер реалізує `detect`, `plan` і `apply`. Core відповідає за оркестрацію CLI, політику резервного копіювання, запити підтвердження, вивід JSON і попередню перевірку конфліктів. Core передає перевірений план у `apply(ctx, plan)`, а провайдери можуть перебудовувати план лише тоді, коли цей аргумент відсутній для сумісності.

Plugin-провайдери можуть використовувати `openclaw/plugin-sdk/migration` для побудови елементів і підрахунку підсумків, а також `openclaw/plugin-sdk/migration-runtime` для копіювання файлів з урахуванням конфліктів, копій звітів лише для архіву та звітів міграції.

## Інтеграція з onboarding

Onboarding може запропонувати міграцію, коли провайдер виявляє відоме джерело. І `openclaw onboard --flow import`, і `openclaw setup --wizard --import-from hermes` використовують той самий Plugin-провайдер міграції та все одно показують попередній перегляд перед застосуванням.

<Note>
Для імпорту через onboarding потрібне нове налаштування OpenClaw. Спочатку скиньте конфігурацію, облікові дані, сесії та робочий простір, якщо у вас уже є локальний стан. Імпорт із резервним копіюванням і перезаписом або об’єднанням для наявних налаштувань доступний лише за feature gate.
</Note>

## Пов’язане

- [Migrating from Hermes](/uk/install/migrating-hermes): покроковий посібник для користувачів.
- [Migrating](/uk/install/migrating): перенесення OpenClaw на нову машину.
- [Doctor](/uk/gateway/doctor): перевірка стану після застосування міграції.
- [Plugins](/uk/tools/plugin): встановлення та реєстрація plugin.
