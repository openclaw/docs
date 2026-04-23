---
read_when:
    - Налаштування робочих процесів автономних агентів, які працюють без окремого запиту для кожного завдання
    - Визначення того, що агент може робити самостійно, а що потребує схвалення людини
    - Структурування багатопрограмних агентів із чіткими межами та правилами ескалації
summary: Визначте постійні операційні повноваження для автономних агентних програм
title: Постійні розпорядження
x-i18n:
    generated_at: "2026-04-23T20:43:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a69cd16b23caedea5020e6bf6dfbe4f77b5bcd5a329af7dfcf535c6aa0924ce4
    source_path: automation/standing-orders.md
    workflow: 15
---

Постійні розпорядження надають вашому агенту **постійні операційні повноваження** для визначених програм. Замість того щоб щоразу давати окремі інструкції для завдань, ви визначаєте програми з чіткою сферою дії, тригерами та правилами ескалації — а агент виконує їх автономно в межах цих обмежень.

У цьому й полягає різниця між тим, щоб щоп’ятниці казати своєму помічнику «надішли щотижневий звіт», і тим, щоб надати постійні повноваження: «Ти відповідаєш за щотижневий звіт. Готуй його щоп’ятниці, надсилай і звертайся лише якщо щось виглядає не так».

## Навіщо потрібні постійні розпорядження?

**Без постійних розпоряджень:**

- Ви мусите надсилати агенту запит для кожного завдання
- Агент простоює між запитами
- Рутинна робота забувається або затримується
- Ви стаєте вузьким місцем

**З постійними розпорядженнями:**

- Агент діє автономно в межах визначених обмежень
- Рутинна робота виконується за розкладом без додаткових запитів
- Ви залучаєтеся лише для винятків і погоджень
- Агент продуктивно використовує час простою

## Як це працює

Постійні розпорядження визначаються у файлах вашого [робочого простору агента](/uk/concepts/agent-workspace). Рекомендований підхід — включати їх безпосередньо в `AGENTS.md` (який автоматично додається до кожної сесії), щоб агент завжди мав їх у контексті. Для більших конфігурацій ви також можете розмістити їх в окремому файлі, наприклад `standing-orders.md`, і послатися на нього з `AGENTS.md`.

Кожна програма визначає:

1. **Сферу дії** — що агент уповноважений робити
2. **Тригери** — коли виконувати (за розкладом, подією або умовою)
3. **Точки погодження** — що потребує схвалення людини перед виконанням
4. **Правила ескалації** — коли зупинитися й звернутися по допомогу

Агент завантажує ці інструкції в кожній сесії через bootstrap-файли робочого простору (див. [Agent Workspace](/uk/concepts/agent-workspace) для повного списку файлів, що автоматично додаються) і виконує їх у поєднанні з [Cron jobs](/uk/automation/cron-jobs) для забезпечення виконання за часом.

<Tip>
Розміщуйте постійні розпорядження в `AGENTS.md`, щоб гарантувати їх завантаження в кожній сесії. Bootstrap робочого простору автоматично додає `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` і `MEMORY.md` — але не довільні файли в підкаталогах.
</Tip>

## Анатомія постійного розпорядження

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution Steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to Do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## Постійні розпорядження + Cron jobs

Постійні розпорядження визначають, **що** агент уповноважений робити. [Cron jobs](/uk/automation/cron-jobs) визначають, **коли** це відбувається. Вони працюють разом:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Запит Cron job має посилатися на постійне розпорядження, а не дублювати його:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Приклади

### Приклад 1: Контент і соціальні мережі (щотижневий цикл)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly Cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content Rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Приклад 2: Фінансові операції (запуск за подією)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When New Data Arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation Rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Приклад 3: Моніторинг і сповіщення (безперервно)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Шаблон «Виконати-Перевірити-Звітувати»

Постійні розпорядження працюють найкраще в поєднанні зі строгою дисципліною виконання. Кожне завдання в постійному розпорядженні має проходити через цей цикл:

1. **Виконати** — виконати фактичну роботу (а не просто підтвердити інструкцію)
2. **Перевірити** — підтвердити, що результат правильний (файл існує, повідомлення доставлено, дані розібрано)
3. **Звітувати** — повідомити власнику, що було зроблено і що було перевірено

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Цей шаблон запобігає найпоширенішому режиму збою агента: підтвердженню завдання без його фактичного виконання.

## Архітектура з кількома програмами

Для агентів, які керують кількома напрямами, організовуйте постійні розпорядження як окремі програми з чіткими межами:

```markdown
# Standing Orders

## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

Кожна програма повинна мати:

- Власну **частоту тригерів** (щотижня, щомісяця, за подією, безперервно)
- Власні **точки погодження** (деякі програми потребують більшого контролю, ніж інші)
- Чіткі **межі** (агент має розуміти, де закінчується одна програма і починається інша)

## Найкращі практики

### Робіть

- Починайте з вузьких повноважень і розширюйте їх у міру зростання довіри
- Визначайте явні точки погодження для дій з високим ризиком
- Додавайте розділи «Що НЕ робити» — межі не менш важливі, ніж дозволи
- Поєднуйте з Cron jobs для надійного виконання за розкладом
- Щотижня переглядайте журнали агента, щоб переконатися, що постійні розпорядження виконуються
- Оновлюйте постійні розпорядження відповідно до зміни ваших потреб — це живі документи

### Уникайте

- Надавати широкі повноваження в перший же день («роби все, що вважаєш найкращим»)
- Пропускати правила ескалації — кожній програмі потрібен пункт «коли зупинитися й запитати»
- Припускати, що агент запам’ятає усні інструкції — заносьте все до файлу
- Змішувати різні напрями в одній програмі — окремі програми для окремих доменів
- Забувати про забезпечення через Cron jobs — постійні розпорядження без тригерів перетворюються на побажання

## Пов’язане

- [Automation & Tasks](/uk/automation) — усі механізми автоматизації з першого погляду
- [Cron Jobs](/uk/automation/cron-jobs) — забезпечення виконання за розкладом для постійних розпоряджень
- [Hooks](/uk/automation/hooks) — скрипти, що запускаються за подіями життєвого циклу агента
- [Webhooks](/uk/automation/cron-jobs#webhooks) — вхідні HTTP-тригери подій
- [Agent Workspace](/uk/concepts/agent-workspace) — де розміщуються постійні розпорядження, включно з повним списком bootstrap-файлів, що автоматично додаються (AGENTS.md, SOUL.md тощо)
