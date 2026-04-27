---
read_when:
    - Ви переходите з Hermes і хочете зберегти конфігурацію моделі, промпти, пам’ять і Skills
    - Ви хочете знати, що OpenClaw імпортує автоматично, а що залишається лише в архіві
    - Вам потрібен чистий, скриптований шлях міграції (CI, новий ноутбук, автоматизація)
summary: Перейдіть з Hermes на OpenClaw за допомогою попередньо переглянутого імпорту з можливістю скасування
title: Перехід з Hermes
x-i18n:
    generated_at: "2026-04-27T08:25:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f424defc61e4f1127adb6e99b504c1f3a84c59635293208bb24bf3113aa7724d
    source_path: install/migrating-hermes.md
    workflow: 15
---

OpenClaw імпортує стан Hermes через вбудований провайдер міграції. Провайдер показує попередній перегляд усього перед зміною стану, приховує секрети в планах і звітах та створює перевірену резервну копію перед застосуванням.

<Note>
Для імпорту потрібне свіже налаштування OpenClaw. Якщо у вас уже є локальний стан OpenClaw, спочатку скиньте config, credentials, sessions і workspace, або використайте `openclaw migrate` безпосередньо з `--overwrite` після перегляду плану.
</Note>

## Два способи імпорту

<Tabs>
  <Tab title="Майстер початкового налаштування">
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
    Використовуйте `openclaw migrate` для скриптованих або повторюваних запусків. Повний довідник дивіться в [`openclaw migrate`](/uk/cli/migrate).

    ```bash
    openclaw migrate hermes --dry-run    # лише попередній перегляд
    openclaw migrate apply hermes --yes  # застосувати без запиту підтвердження
    ```

    Додайте `--from <path>`, якщо Hermes розташований поза `~/.hermes`.

  </Tab>
</Tabs>

## Що буде імпортовано

<AccordionGroup>
  <Accordion title="Конфігурація моделі">
    - Вибір моделі за замовчуванням із Hermes `config.yaml`.
    - Налаштовані провайдери моделей і власні сумісні з OpenAI endpoint-и з `providers` і `custom_providers`.
  </Accordion>
  <Accordion title="MCP-сервери">
    Визначення MCP-серверів із `mcp_servers` або `mcp.servers`.
  </Accordion>
  <Accordion title="Файли workspace">
    - `SOUL.md` і `AGENTS.md` копіюються до workspace агента OpenClaw.
    - `memories/MEMORY.md` і `memories/USER.md` **додаються** до відповідних файлів пам’яті OpenClaw, а не перезаписують їх.
  </Accordion>
  <Accordion title="Конфігурація пам’яті">
    Типові параметри конфігурації пам’яті для файлової пам’яті OpenClaw. Зовнішні провайдери пам’яті, такі як Honcho, фіксуються як елементи архіву або ручної перевірки, щоб ви могли перенести їх усвідомлено.
  </Accordion>
  <Accordion title="Skills">
    Skills із файлом `SKILL.md` у `skills/<name>/` копіюються разом із значеннями конфігурації для кожного skill із `skills.config`.
  </Accordion>
  <Accordion title="Ключі API (за вибором)">
    Установіть `--include-secrets`, щоб імпортувати підтримувані ключі `.env`: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`. Без цього прапорця секрети ніколи не копіюються.
  </Accordion>
</AccordionGroup>

## Що залишається лише в архіві

Провайдер копіює це до каталогу звіту міграції для ручної перевірки, але **не** завантажує до активних config або credentials OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw відмовляється автоматично виконувати або довіряти цьому стану, оскільки формати та припущення щодо довіри можуть відрізнятися між системами. Перенесіть потрібне вручну після перегляду архіву.

## Рекомендований порядок дій

<Steps>
  <Step title="Перегляньте план">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    План перелічує все, що буде змінено, зокрема конфлікти, пропущені елементи та будь-які чутливі елементи. Вивід плану приховує вкладені ключі, схожі на секрети.

  </Step>
  <Step title="Застосуйте з резервною копією">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    Перед застосуванням OpenClaw створює та перевіряє резервну копію. Якщо вам потрібно імпортувати ключі API, додайте `--include-secrets`.

  </Step>
  <Step title="Запустіть doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/uk/gateway/doctor) повторно застосовує всі відкладені міграції config і перевіряє наявність проблем, внесених під час імпорту.

  </Step>
  <Step title="Перезапустіть і перевірте">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Переконайтеся, що Gateway працює справно і ваші імпортовані модель, пам’ять і Skills завантажені.

  </Step>
</Steps>

## Обробка конфліктів

Застосування відмовляється продовжувати, коли план повідомляє про конфлікти (файл або значення config уже існує в цільовому місці).

<Warning>
Повторно запускайте з `--overwrite` лише тоді, коли заміна наявної цілі є свідомим рішенням. Провайдери все одно можуть записувати резервні копії окремих елементів для перезаписаних файлів у каталог звіту міграції.
</Warning>

Для свіжої інсталяції OpenClaw конфлікти нетипові. Зазвичай вони з’являються, коли ви повторно запускаєте імпорт у налаштуванні, де вже є внесені користувачем зміни.

## Секрети

Секрети ніколи не імпортуються за замовчуванням.

- Спочатку виконайте `openclaw migrate apply hermes --yes`, щоб імпортувати стан без секретів.
- Якщо ви також хочете скопіювати підтримувані ключі `.env`, повторно запустіть із `--include-secrets`.
- Для credentials під керуванням SecretRef налаштуйте джерело SecretRef після завершення імпорту.

## Вивід JSON для автоматизації

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

З `--json` і без `--yes` застосування виводить план і не змінює стан. Це найбезпечніший режим для CI і спільних скриптів.

## Усунення проблем

<AccordionGroup>
  <Accordion title="Застосування відмовляється через конфлікти">
    Перегляньте вивід плану. Кожен конфлікт указує вихідний шлях і наявну ціль. Для кожного елемента вирішіть, чи потрібно пропустити його, відредагувати ціль або повторно запустити з `--overwrite`.
  </Accordion>
  <Accordion title="Hermes розташований поза ~/.hermes">
    Передайте `--from /actual/path` (CLI) або `--import-source /actual/path` (початкове налаштування).
  </Accordion>
  <Accordion title="Початкове налаштування відмовляється імпортувати в наявне налаштування">
    Імпорт через початкове налаштування потребує свіжого налаштування. Або скиньте стан і знову пройдіть початкове налаштування, або безпосередньо використайте `openclaw migrate apply hermes`, що підтримує `--overwrite` і явне керування резервними копіями.
  </Accordion>
  <Accordion title="Ключі API не імпортувалися">
    Потрібен `--include-secrets`, і розпізнаються лише перелічені вище ключі. Інші змінні в `.env` ігноруються.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [`openclaw migrate`](/uk/cli/migrate): повний довідник CLI, контракт Plugin і форми JSON.
- [Початкове налаштування](/uk/cli/onboard): сценарій майстра та неінтерактивні прапорці.
- [Міграція](/uk/install/migrating): перенесення інсталяції OpenClaw між машинами.
- [Doctor](/uk/gateway/doctor): перевірка працездатності після міграції.
- [Workspace агента](/uk/concepts/agent-workspace): де розташовані `SOUL.md`, `AGENTS.md` і файли пам’яті.
