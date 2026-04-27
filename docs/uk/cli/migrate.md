---
read_when:
    - Ви хочете мігрувати з Hermes або іншої агентної системи до OpenClaw
    - Ви додаєте provider міграції, що належить Plugin
summary: Довідник CLI для `openclaw migrate` (імпорт стану з іншої агентної системи)
title: Міграція
x-i18n:
    generated_at: "2026-04-27T08:07:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8bb986558e2ce09e7fecbfc78beb149890965df8b6d82924cbfbcadb74b9f3c1
    source_path: cli/migrate.md
    workflow: 15
---

# `openclaw migrate`

Імпортуйте стан з іншої агентної системи через provider міграції, що належить Plugin.

<Tip>
Щоб переглянути орієнтований на користувача покроковий посібник з переходу з Hermes, див. [Міграція з Hermes](/uk/install/migrating-hermes).
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
  Назва зареєстрованого provider міграції, наприклад `hermes`. Запустіть `openclaw migrate list`, щоб побачити встановлені provider-и.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Побудувати план і завершити роботу без зміни стану.
</ParamField>
<ParamField path="--from <path>" type="string">
  Перевизначити каталог вихідного стану. Для Hermes типовим є `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Імпортувати підтримувані облікові дані. За замовчуванням вимкнено.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Дозволити apply замінювати наявні цілі, коли план повідомляє про конфлікти.
</ParamField>
<ParamField path="--yes" type="boolean">
  Пропустити запит на підтвердження. Обов’язково в неінтерактивному режимі.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Пропустити резервне копіювання перед apply. Потребує `--force`, коли існує локальний стан OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Обов’язково разом із `--no-backup`, коли apply інакше відмовився б пропускати резервне копіювання.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести план або результат apply у форматі JSON. Якщо вказано `--json` без `--yes`, apply виводить план і не змінює стан.
</ParamField>

## Модель безпеки

`openclaw migrate` спочатку показує попередній перегляд.

<AccordionGroup>
  <Accordion title="Попередній перегляд перед apply">
    Provider повертає деталізований план до внесення будь-яких змін, зокрема конфлікти, пропущені елементи та чутливі елементи. Плани JSON, вивід apply і звіти про міграцію маскують вкладені ключі, схожі на секрети, як-от API-ключі, токени, заголовки авторизації, cookies і паролі.

    `openclaw migrate apply <provider>` показує попередній перегляд плану й запитує підтвердження перед зміною стану, якщо не вказано `--yes`. У неінтерактивному режимі apply потребує `--yes`.
  </Accordion>
  <Accordion title="Резервні копії">
    Apply створює та перевіряє резервну копію OpenClaw перед застосуванням міграції. Якщо локального стану OpenClaw ще немає, крок резервного копіювання пропускається, і міграція може продовжитися. Щоб пропустити резервне копіювання, коли стан існує, передайте одночасно `--no-backup` і `--force`.
  </Accordion>
  <Accordion title="Конфлікти">
    Apply відмовляється продовжувати, якщо в плані є конфлікти. Перегляньте план, а потім повторно запустіть із `--overwrite`, якщо заміна наявних цілей є навмисною. Provider-и все одно можуть записувати резервні копії окремих елементів для перезаписаних файлів у каталог звіту про міграцію.
  </Accordion>
  <Accordion title="Секрети">
    Секрети ніколи не імпортуються за замовчуванням. Використовуйте `--include-secrets`, щоб імпортувати підтримувані облікові дані.
  </Accordion>
</AccordionGroup>

## Provider Hermes

Вбудований provider Hermes за замовчуванням виявляє стан у `~/.hermes`. Використовуйте `--from <path>`, якщо Hermes розташований в іншому місці.

### Що імпортується

- Типова конфігурація моделі з `config.yaml`.
- Налаштовані provider-и моделей і користувацькі OpenAI-сумісні кінцеві точки з `providers` і `custom_providers`.
- Визначення MCP-серверів з `mcp_servers` або `mcp.servers`.
- `SOUL.md` і `AGENTS.md` у робочий простір агента OpenClaw.
- `memories/MEMORY.md` і `memories/USER.md`, додані до файлів пам’яті робочого простору.
- Типові налаштування пам’яті для файлової пам’яті OpenClaw, а також елементи архіву або ручної перевірки для зовнішніх provider-ів пам’яті, таких як Honcho.
- Skills, які містять файл `SKILL.md` у `skills/<name>/`.
- Значення конфігурації для кожного Skill з `skills.config`.
- Підтримувані API-ключі з `.env`, лише з `--include-secrets`.

### Підтримувані ключі `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Стан лише для архіву

Стан Hermes, який OpenClaw не може безпечно інтерпретувати, копіюється до звіту про міграцію для ручної перевірки, але не завантажується в активну конфігурацію чи облікові дані OpenClaw. Це дає змогу зберегти непрозорий або потенційно небезпечний стан без удавання, що OpenClaw може автоматично виконувати або довіряти йому:

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

Джерела міграції — це plugins. Plugin оголошує ідентифікатори своїх provider-ів у `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Під час виконання Plugin викликає `api.registerMigrationProvider(...)`. Provider реалізує `detect`, `plan` і `apply`. Core відповідає за оркестрацію CLI, політику резервного копіювання, запити підтвердження, вивід JSON і попередню перевірку конфліктів. Core передає перевірений план до `apply(ctx, plan)`, а provider-и можуть перебудовувати план лише тоді, коли цей аргумент відсутній, для сумісності.

Plugins provider-ів можуть використовувати `openclaw/plugin-sdk/migration` для побудови елементів і підсумкових підрахунків, а також `openclaw/plugin-sdk/migration-runtime` для копіювання файлів з урахуванням конфліктів, копіювання звітів лише для архіву та звітів про міграцію.

## Інтеграція з онбордингом

Під час онбордингу можна запропонувати міграцію, коли provider виявляє відоме джерело. І `openclaw onboard --flow import`, і `openclaw setup --wizard --import-from hermes` використовують той самий plugin provider міграції та все одно показують попередній перегляд перед застосуванням.

<Note>
Імпорт під час онбордингу потребує свіжого налаштування OpenClaw. Спочатку скиньте конфігурацію, облікові дані, сесії та робочий простір, якщо у вас уже є локальний стан. Імпорт із резервним копіюванням і перезаписом або злиттям для наявних налаштувань доступний лише за feature gate.
</Note>

## Пов’язане

- [Міграція з Hermes](/uk/install/migrating-hermes): орієнтований на користувача покроковий посібник.
- [Міграція](/uk/install/migrating): переміщення OpenClaw на нову машину.
- [Doctor](/uk/gateway/doctor): перевірка стану після застосування міграції.
- [Plugins](/uk/tools/plugin): встановлення та реєстрація Plugin.
