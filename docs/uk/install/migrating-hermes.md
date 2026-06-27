---
read_when:
    - Ви переходите з Hermes і хочете зберегти свою конфігурацію моделі, підказки, пам’ять і Skills
    - Ви хочете знати, що OpenClaw імпортує автоматично, а що залишається лише в архіві
    - Вам потрібен чистий, скриптований шлях міграції (CI, новий ноутбук, автоматизація)
summary: Перейдіть із Hermes на OpenClaw із попередньо переглянутим, зворотним імпортом
title: Міграція з Hermes
x-i18n:
    generated_at: "2026-06-27T17:41:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw імпортує стан Hermes через вбудований постачальник міграції. Постачальник попередньо показує все перед зміною стану, редагує секрети в планах і звітах та створює перевірену резервну копію перед застосуванням.

<Note>
Імпорт потребує свіжого налаштування OpenClaw. Якщо у вас уже є локальний стан OpenClaw, спочатку скиньте конфігурацію, облікові дані, сеанси та робочий простір або використайте `openclaw migrate` напряму з `--overwrite` після перегляду плану.
</Note>

## Два способи імпорту

<Tabs>
  <Tab title="Onboarding wizard">
    Найшвидший шлях. Майстер виявляє Hermes у `~/.hermes` і показує попередній перегляд перед застосуванням.

    ```bash
    openclaw onboard --flow import
    ```

    Або вкажіть конкретне джерело:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Використовуйте `openclaw migrate` для скриптованих або повторюваних запусків. Див. [`openclaw migrate`](/uk/cli/migrate) для повної довідки.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Додайте `--from <path>`, коли Hermes розміщено поза `~/.hermes`.

  </Tab>
</Tabs>

## Що імпортується

<AccordionGroup>
  <Accordion title="Model configuration">
    - Вибір моделі за замовчуванням із Hermes `config.yaml`.
    - Налаштовані постачальники моделей і власні OpenAI-сумісні кінцеві точки з `providers` і `custom_providers`.

  </Accordion>
  <Accordion title="MCP servers">
    Визначення серверів MCP з `mcp_servers` або `mcp.servers`.
  </Accordion>
  <Accordion title="Workspace files">
    - `SOUL.md` і `AGENTS.md` копіюються в робочий простір агента OpenClaw.
    - `memories/MEMORY.md` і `memories/USER.md` **додаються** до відповідних файлів пам’яті OpenClaw замість перезапису.

  </Accordion>
  <Accordion title="Memory configuration">
    Типові значення конфігурації пам’яті для файлової пам’яті OpenClaw. Зовнішні постачальники пам’яті, як-от Honcho, записуються як архівні елементи або елементи для ручного перегляду, щоб ви могли перенести їх свідомо.
  </Accordion>
  <Accordion title="Skills">
    Skills із файлом `SKILL.md` у `skills/<name>/` копіюються разом зі значеннями конфігурації для кожного Skill з `skills.config`.
  </Accordion>
  <Accordion title="Auth credentials">
    Інтерактивний `openclaw migrate` запитує перед імпортом облікових даних автентифікації, з типовим вибором «так». Прийнятий імпорт охоплює облікові дані OpenCode OpenAI OAuth з OpenCode `auth.json`, записи OpenCode і GitHub Copilot з OpenCode `auth.json` та [підтримувані ключі `.env`](/uk/cli/migrate#supported-env-keys). Записи Hermes `auth.json` OAuth є застарілим станом і показуються як завдання для ручної повторної автентифікації або doctor замість імпорту в активну автентифікацію. Використовуйте `--include-secrets` для неінтерактивного імпорту облікових даних `openclaw migrate`, `--no-auth-credentials`, щоб пропустити його, або onboarding `--import-secrets` під час імпорту з майстра налаштування.
  </Accordion>
</AccordionGroup>

## Що залишається лише в архіві

Постачальник копіює це в каталог звіту міграції для ручного перегляду, але **не** завантажує в активну конфігурацію або облікові дані OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw відмовляється автоматично виконувати цей стан або довіряти йому, оскільки формати й припущення довіри можуть відрізнятися між системами. Перенесіть потрібне вручну після перегляду архіву.

## Рекомендований процес

<Steps>
  <Step title="Preview the plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    План перелічує все, що зміниться, зокрема конфлікти, пропущені елементи та будь-які чутливі елементи. Вивід плану редагує вкладені ключі, схожі на секрети.

  </Step>
  <Step title="Apply with backup">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw створює й перевіряє резервну копію перед застосуванням. Цей неінтерактивний приклад імпортує несекретний стан. Запустіть без `--yes`, щоб відповісти на запит щодо облікових даних, або додайте `--include-secrets`, щоб включити підтримувані облікові дані в автоматичні запуски.

  </Step>
  <Step title="Run doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/uk/gateway/doctor) повторно застосовує всі незавершені міграції конфігурації та перевіряє проблеми, внесені під час імпорту.

  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Переконайтеся, що Gateway справний, а імпортовані модель, пам’ять і skills завантажено.

  </Step>
</Steps>

## Обробка конфліктів

Застосування відмовляється продовжувати, коли план повідомляє про конфлікти (файл або значення конфігурації вже існує в цілі).

<Warning>
Повторно запускайте з `--overwrite` лише тоді, коли заміна наявної цілі є навмисною. Постачальники все ще можуть записувати резервні копії на рівні елементів для перезаписаних файлів у каталог звіту міграції.
</Warning>

Для свіжого встановлення OpenClaw конфлікти нетипові. Зазвичай вони з’являються, коли ви повторно запускаєте імпорт у налаштуванні, де вже є користувацькі зміни.

Якщо конфлікт виникає посеред застосування (наприклад, неочікувана гонка за файл конфігурації), Hermes позначає решту залежних елементів конфігурації як `skipped` із причиною `blocked by earlier apply conflict` замість часткового запису. Звіт міграції записує кожен заблокований елемент, щоб ви могли усунути початковий конфлікт і повторно запустити імпорт.

## Секрети

Інтерактивний `openclaw migrate` запитує, чи імпортувати виявлені облікові дані автентифікації, з типовим вибором «так».

- Прийняття запиту імпортує облікові дані OpenCode OpenAI OAuth з OpenCode `auth.json`, записи OpenCode і GitHub Copilot з OpenCode `auth.json` та [підтримувані ключі `.env`](/uk/cli/migrate#supported-env-keys). Записи Hermes `auth.json` OAuth повідомляються для ручної повторної автентифікації OpenAI або відновлення через doctor.
- Використовуйте `--no-auth-credentials` або виберіть «ні» у запиті, щоб імпортувати лише несекретний стан.
- Використовуйте `--include-secrets` під час автоматичного запуску з `--yes`.
- Використовуйте onboarding `--import-secrets` під час імпорту облікових даних із майстра налаштування.
- Для облікових даних, керованих SecretRef, налаштуйте джерело SecretRef після завершення імпорту.

## JSON-вивід для автоматизації

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

З `--json` і без `--yes` застосування друкує план і не змінює стан. Це найбезпечніший режим для CI і спільних скриптів.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Apply refuses with conflicts">
    Перегляньте вивід плану. Кожен конфлікт визначає шлях джерела та наявну ціль. Вирішіть для кожного елемента, чи пропустити його, відредагувати ціль або повторно запустити з `--overwrite`.
  </Accordion>
  <Accordion title="Hermes lives outside ~/.hermes">
    Передайте `--from /actual/path` (CLI) або `--import-source /actual/path` (налаштування).
  </Accordion>
  <Accordion title="Onboarding refuses to import on an existing setup">
    Імпорт під час налаштування потребує свіжого налаштування. Або скиньте стан і повторно пройдіть налаштування, або використовуйте `openclaw migrate apply hermes` напряму; він підтримує `--overwrite` і явне керування резервними копіями.
  </Accordion>
  <Accordion title="API keys did not import">
    Інтерактивний `openclaw migrate` імпортує API-ключі лише коли ви приймаєте запит щодо облікових даних. Неінтерактивні запуски з `--yes` потребують `--include-secrets`; імпорт під час налаштування потребує `--import-secrets`. Розпізнаються лише [підтримувані ключі `.env`](/uk/cli/migrate#supported-env-keys); інші змінні в `.env` ігноруються.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [`openclaw migrate`](/uk/cli/migrate): повна довідка CLI, контракт Plugin і форми JSON.
- [Налаштування](/uk/cli/onboard): процес майстра та неінтерактивні прапорці.
- [Міграція](/uk/install/migrating): перенесення встановлення OpenClaw між машинами.
- [Doctor](/uk/gateway/doctor): перевірка стану після міграції.
- [Робочий простір агента](/uk/concepts/agent-workspace): де розміщуються `SOUL.md`, `AGENTS.md` і файли пам’яті.
