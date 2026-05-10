---
read_when:
    - Налаштування автономних робочих процесів агентів, які виконуються без запитів для кожного завдання
    - Визначення того, що агент може виконувати самостійно, а що потребує схвалення людини
    - Структурування багатопрограмних агентів із чіткими межами та правилами ескалації
summary: Визначте постійні операційні повноваження для автономних агентних програм
title: Постійні вказівки
x-i18n:
    generated_at: "2026-05-10T19:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c78a723c296e1b695fd0fa7b0c3dbc3572fcfc1f49d6fadcab7a5a7a44c4b8d
    source_path: automation/standing-orders.md
    workflow: 16
---

Постійні доручення надають вашому агенту **постійну операційну повноважність** для визначених програм. Замість того щоб щоразу давати окремі інструкції для завдання, ви визначаєте програми з чіткою сферою, тригерами та правилами ескалації - і агент виконує їх автономно в цих межах.

Це різниця між тим, щоб щоп’ятниці казати помічнику "надішли щотижневий звіт", і наданням постійних повноважень: "Ти відповідаєш за щотижневий звіт. Готуй його щоп’ятниці, надсилай і ескалюй лише якщо щось виглядає неправильно."

## Навіщо потрібні постійні доручення

**Без постійних доручень:**

- Ви маєте давати агенту prompt для кожного завдання
- Агент простоює між запитами
- Рутинна робота забувається або затримується
- Ви стаєте вузьким місцем

**З постійними дорученнями:**

- Агент виконує автономно в межах визначених обмежень
- Рутинна робота виконується за розкладом без prompt
- Ви залучаєтеся лише для винятків і затверджень
- Агент продуктивно використовує час простою

## Як вони працюють

Постійні доручення визначаються у файлах вашого [робочого простору агента](/uk/concepts/agent-workspace). Рекомендований підхід - включати їх безпосередньо в `AGENTS.md` (який автоматично ін’єктується в кожну сесію), щоб агент завжди мав їх у контексті. Для більших конфігурацій ви також можете помістити їх у спеціальний файл, наприклад `standing-orders.md`, і посилатися на нього з `AGENTS.md`.

Кожна програма визначає:

1. **Сферу** - що агент уповноважений робити
2. **Тригери** - коли виконувати (розклад, подія або умова)
3. **Шлюзи затвердження** - що потребує підтвердження людини перед дією
4. **Правила ескалації** - коли зупинитися й попросити допомоги

Агент завантажує ці інструкції в кожній сесії через файли початкового завантаження робочого простору (див. [Робочий простір агента](/uk/concepts/agent-workspace) для повного списку автоматично ін’єктованих файлів) і виконує їх разом із [завданнями Cron](/uk/automation/cron-jobs) для примусового виконання за часом.

<Tip>
Розміщуйте постійні доручення в `AGENTS.md`, щоб гарантувати їх завантаження в кожній сесії. Початкове завантаження робочого простору автоматично ін’єктує `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` і `MEMORY.md` - але не довільні файли в підкаталогах.
</Tip>

## Анатомія постійного доручення

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad - report accurately
```

## Постійні доручення плюс завдання Cron

Постійні доручення визначають, **що** агент уповноважений робити. [Завдання Cron](/uk/automation/cron-jobs) визначають, **коли** це відбувається. Вони працюють разом:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Prompt завдання Cron має посилатися на постійне доручення, а не дублювати його:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Приклади

### Приклад 1: контент і соціальні мережі (щотижневий цикл)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday-Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Приклад 2: фінансові операції (запускається подією)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When new data arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Приклад 3: моніторинг і сповіщення (безперервно)

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

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Патерн виконати-перевірити-відзвітувати

Постійні доручення працюють найкраще, коли поєднуються зі строгою дисципліною виконання. Кожне завдання в постійному дорученні має проходити цей цикл:

1. **Виконати** - Зробіть фактичну роботу (не просто підтверджуйте інструкцію)
2. **Перевірити** - Підтвердьте, що результат правильний (файл існує, повідомлення доставлено, дані розібрано)
3. **Відзвітувати** - Повідомте власнику, що було зроблено і що було перевірено

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Цей патерн запобігає найпоширенішому режиму відмови агента: підтвердженню завдання без його завершення.

## Архітектура з кількома програмами

Для агентів, які керують кількома напрямами, організуйте постійні доручення як окремі програми з чіткими межами:

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

Кожна програма повинна мати:

- Власну **частоту тригерів** (щотижня, щомісяця, за подією, безперервно)
- Власні **шлюзи затвердження** (деякі програми потребують більшого нагляду, ніж інші)
- Чіткі **межі** (агент має знати, де одна програма закінчується, а інша починається)

## Найкращі практики

### Робіть

- Починайте з вузьких повноважень і розширюйте їх у міру зростання довіри
- Визначайте явні шлюзи затвердження для дій із високим ризиком
- Додавайте розділи "Чого НЕ робити" - межі так само важливі, як і дозволи
- Поєднуйте із завданнями Cron для надійного виконання за часом
- Щотижня переглядайте журнали агента, щоб перевірити, що постійні доручення виконуються
- Оновлюйте постійні доручення в міру зміни ваших потреб - це живі документи

### Уникайте

- Надавати широкі повноваження в перший день ("роби все, що вважаєш найкращим")
- Пропускати правила ескалації - кожній програмі потрібен пункт "коли зупинитися й запитати"
- Припускати, що агент пам’ятатиме усні інструкції - запишіть усе у файл
- Змішувати напрями в одній програмі - окремі програми для окремих доменів
- Забувати примусове виконання через завдання Cron - постійні доручення без тригерів стають пропозиціями

## Пов’язане

- [Автоматизація та завдання](/uk/automation): усі механізми автоматизації одним поглядом.
- [Завдання Cron](/uk/automation/cron-jobs): примусове виконання розкладу для постійних доручень.
- [Hooks](/uk/automation/hooks): скрипти, керовані подіями, для подій життєвого циклу агента.
- [Webhook-и](/uk/automation/cron-jobs#webhooks): вхідні HTTP-тригери подій.
- [Робочий простір агента](/uk/concepts/agent-workspace): де зберігаються постійні доручення, включно з повним списком автоматично ін’єктованих файлів початкового завантаження (`AGENTS.md`, `SOUL.md` тощо).
