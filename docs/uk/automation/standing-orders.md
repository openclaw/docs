---
read_when:
    - Налаштування робочих процесів автономних агентів, які працюють без окремих запитів для кожного завдання
    - Визначення того, що агент може робити самостійно, а що потребує схвалення людини
    - Структурування багатопрограмних агентів із чіткими межами та правилами ескалації
summary: Визначити постійні операційні повноваження для автономних програм-агентів
title: Постійні вказівки
x-i18n:
    generated_at: "2026-04-24T16:21:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d95024b29d04638be610a9fe3ca9651e8704b2b03ea16a3112cf31a7287c386
    source_path: automation/standing-orders.md
    workflow: 15
---

Постійні вказівки надають вашому агенту **постійні операційні повноваження** для визначених програм. Замість того щоб щоразу давати окремі інструкції для завдань, ви визначаєте програми з чіткою сферою дії, тригерами та правилами ескалації — і агент автономно виконує їх у межах цих обмежень.

Це різниця між тим, щоб щоп’ятниці казати вашому помічнику «надішли щотижневий звіт», і тим, щоб надати постійні повноваження: «Щотижневий звіт — на тобі. Готуй його щоп’ятниці, надсилай і ескалюй лише якщо щось виглядає неправильно».

## Навіщо потрібні постійні вказівки?

**Без постійних вказівок:**

- Ви маєте давати агенту запит для кожного завдання
- Агент простоює між запитами
- Рутинна робота забувається або відкладається
- Ви стаєте вузьким місцем

**Із постійними вказівками:**

- Агент діє автономно в межах визначених обмежень
- Рутинна робота виконується за розкладом без окремих запитів
- Ви втручаєтеся лише для винятків і погоджень
- Агент продуктивно заповнює час простою

## Як це працює

Постійні вказівки визначаються у файлах вашого [робочого простору агента](/uk/concepts/agent-workspace). Рекомендований підхід — включати їх безпосередньо в `AGENTS.md` (який автоматично додається до кожної сесії), щоб агент завжди мав їх у контексті. Для більших конфігурацій ви також можете розмістити їх в окремому файлі, наприклад `standing-orders.md`, і послатися на нього з `AGENTS.md`.

Кожна програма визначає:

1. **Сфера дії** — що агент уповноважений робити
2. **Тригери** — коли виконувати (розклад, подія або умова)
3. **Шлюзи погодження** — що потребує людського погодження перед дією
4. **Правила ескалації** — коли зупинитися й попросити допомоги

Агент завантажує ці інструкції в кожній сесії через bootstrap-файли робочого простору (див. [Робочий простір агента](/uk/concepts/agent-workspace) для повного списку файлів, що додаються автоматично) і виконує їх у поєднанні з [Cron jobs](/uk/automation/cron-jobs) для примусового виконання за часом.

<Tip>
Розміщуйте постійні вказівки в `AGENTS.md`, щоб гарантувати їх завантаження в кожній сесії. Bootstrap робочого простору автоматично додає `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` і `MEMORY.md` — але не довільні файли в підкаталогах.
</Tip>

## Анатомія постійної вказівки

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

## Постійні вказівки + Cron jobs

Постійні вказівки визначають, **що** агент уповноважений робити. [Cron jobs](/uk/automation/cron-jobs) визначають, **коли** це відбувається. Вони працюють разом:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Запит Cron job має посилатися на постійну вказівку, а не дублювати її:

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

Постійні вказівки працюють найкраще в поєднанні зі суворою виконавчою дисципліною. Кожне завдання в постійній вказівці має слідувати цьому циклу:

1. **Виконати** — зробити фактичну роботу (а не просто підтвердити інструкцію)
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

Цей шаблон запобігає найпоширенішому режиму збою агента: підтвердженню завдання без його завершення.

## Архітектура з кількома програмами

Для агентів, які керують кількома напрямами, організуйте постійні вказівки як окремі програми з чіткими межами:

```markdown
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

Кожна програма має мати:

- власну **періодичність запуску** (щотижня, щомісяця, за подією, безперервно)
- власні **шлюзи погодження** (деякі програми потребують більшого нагляду, ніж інші)
- чіткі **межі** (агент має розуміти, де закінчується одна програма і починається інша)

## Найкращі практики

### Робіть так

- Починайте з вузьких повноважень і розширюйте їх у міру зростання довіри
- Визначайте явні шлюзи погодження для дій із високим ризиком
- Додавайте розділи «Що НЕ робити» — межі так само важливі, як і дозволи
- Поєднуйте з Cron jobs для надійного виконання за часом
- Щотижня переглядайте журнали агента, щоб перевірити, що постійні вказівки виконуються
- Оновлюйте постійні вказівки разом зі зміною ваших потреб — це живі документи

### Уникайте

- Надавати широкі повноваження в перший день («роби все, що вважаєш найкращим»)
- Пропускати правила ескалації — кожна програма має містити умову «коли зупинитися і запитати»
- Припускати, що агент запам’ятає усні інструкції — записуйте все у файл
- Змішувати різні напрями в одній програмі — окремі програми для окремих доменів
- Забувати про примусове виконання через Cron jobs — постійні вказівки без тригерів стають лише рекомендаціями

## Пов’язане

- [Автоматизація й завдання](/uk/automation) — усі механізми автоматизації в одному огляді
- [Cron Jobs](/uk/automation/cron-jobs) — примусове виконання постійних вказівок за розкладом
- [Hooks](/uk/automation/hooks) — скрипти, що запускаються за подіями життєвого циклу агента
- [Webhooks](/uk/automation/cron-jobs#webhooks) — вхідні HTTP-тригери подій
- [Робочий простір агента](/uk/concepts/agent-workspace) — де зберігаються постійні вказівки, включно з повним списком bootstrap-файлів, що додаються автоматично (AGENTS.md, SOUL.md тощо)
