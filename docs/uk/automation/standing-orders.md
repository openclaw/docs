---
read_when:
    - Налаштування автономних робочих процесів агентів, які виконуються без запитів для кожного завдання
    - Визначення того, що агент може робити самостійно, а що потребує схвалення людини
    - Структурування багатопрограмних агентів із чіткими межами та правилами ескалації
summary: Визначте постійні операційні повноваження для автономних агентських програм
title: Постійні інструкції
x-i18n:
    generated_at: "2026-05-06T03:01:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04e871bbd3f51b50ce162576936d4b37acbdc5a94edcd73e390adc784465aa4
    source_path: automation/standing-orders.md
    workflow: 16
---

Постійні розпорядження надають вашому агенту **постійні операційні повноваження** для визначених програм. Замість того щоб щоразу давати окремі інструкції для завдання, ви визначаєте програми з чіткою сферою дії, тригерами та правилами ескалації - і агент виконує їх автономно в цих межах.

Це різниця між тим, щоб щоп’ятниці казати помічнику «надішли щотижневий звіт», і наданням постійних повноважень: «Ти відповідаєш за щотижневий звіт. Готуй його щоп’ятниці, надсилай і ескалюй лише тоді, коли щось виглядає неправильно».

## Навіщо потрібні постійні розпорядження

**Без постійних розпоряджень:**

- Ви маєте давати агенту підказку для кожного завдання
- Агент простоює між запитами
- Рутинна робота забувається або затримується
- Ви стаєте вузьким місцем

**З постійними розпорядженнями:**

- Агент виконує роботу автономно в межах визначених повноважень
- Рутинна робота виконується за розкладом без підказок
- Ви долучаєтеся лише для винятків і затверджень
- Агент продуктивно заповнює час простою

## Як вони працюють

Постійні розпорядження визначаються у файлах вашого [робочого простору агента](/uk/concepts/agent-workspace). Рекомендований підхід - додавати їх безпосередньо в `AGENTS.md` (який автоматично впроваджується в кожну сесію), щоб агент завжди мав їх у контексті. Для більших конфігурацій ви також можете розмістити їх в окремому файлі на кшталт `standing-orders.md` і посилатися на нього з `AGENTS.md`.

Кожна програма визначає:

1. **Сферу дії** - що агент уповноважений робити
2. **Тригери** - коли виконувати (за розкладом, подією або умовою)
3. **Контрольні точки затвердження** - що потребує людського підтвердження перед дією
4. **Правила ескалації** - коли зупинитися й попросити допомоги

Агент завантажує ці інструкції в кожній сесії через bootstrap-файли робочого простору (повний список автоматично впроваджуваних файлів див. у [Робочому просторі агента](/uk/concepts/agent-workspace)) і виконує їх разом із [завданнями Cron](/uk/automation/cron-jobs) для примусового виконання за часом.

<Tip>
Розміщуйте постійні розпорядження в `AGENTS.md`, щоб гарантувати їх завантаження в кожній сесії. Bootstrap робочого простору автоматично впроваджує `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` і `MEMORY.md` - але не довільні файли в підкаталогах.
</Tip>

## Анатомія постійного розпорядження

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

## Постійні розпорядження плюс завдання Cron

Постійні розпорядження визначають, **що** агент уповноважений робити. [Завдання Cron](/uk/automation/cron-jobs) визначають, **коли** це відбувається. Вони працюють разом:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Підказка завдання Cron має посилатися на постійне розпорядження, а не дублювати його:

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

### Приклад 2: фінансові операції (запускаються подією)

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

## Шаблон «виконати-перевірити-відзвітувати»

Постійні розпорядження працюють найкраще в поєднанні зі строгою дисципліною виконання. Кожне завдання в постійному розпорядженні має проходити такий цикл:

1. **Виконати** - зробити фактичну роботу (а не просто підтвердити інструкцію)
2. **Перевірити** - підтвердити, що результат правильний (файл існує, повідомлення доставлено, дані розібрано)
3. **Відзвітувати** - повідомити власнику, що було зроблено і що було перевірено

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Цей шаблон запобігає найпоширенішому режиму збою агента: підтвердженню завдання без його завершення.

## Архітектура з кількома програмами

Для агентів, які керують кількома напрямами, організовуйте постійні розпорядження як окремі програми з чіткими межами:

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

- Власну **частоту тригерів** (щотижня, щомісяця, за подією, безперервно)
- Власні **контрольні точки затвердження** (деякі програми потребують більшого нагляду, ніж інші)
- Чіткі **межі** (агент має знати, де закінчується одна програма й починається інша)

## Найкращі практики

### Робіть

- Починайте з вузьких повноважень і розширюйте їх у міру зростання довіри
- Визначайте явні контрольні точки затвердження для дій із високим ризиком
- Додавайте розділи «Чого НЕ робити» - межі так само важливі, як і дозволи
- Поєднуйте із завданнями Cron для надійного виконання за часом
- Щотижня переглядайте журнали агента, щоб перевірити дотримання постійних розпоряджень
- Оновлюйте постійні розпорядження в міру зміни ваших потреб - це живі документи

### Уникайте

- Надавати широкі повноваження в перший день («роби все, що вважаєш найкращим»)
- Пропускати правила ескалації - кожній програмі потрібен пункт «коли зупинитися й запитати»
- Припускати, що агент пам’ятатиме усні інструкції - заносьте все у файл
- Змішувати різні напрями в одній програмі - окремі домени потребують окремих програм
- Забувати про примусове виконання через завдання Cron - постійні розпорядження без тригерів стають пропозиціями

## Пов’язане

- [Автоматизація та завдання](/uk/automation): усі механізми автоматизації одним поглядом.
- [Завдання Cron](/uk/automation/cron-jobs): примусове виконання розкладу для постійних розпоряджень.
- [Hooks](/uk/automation/hooks): сценарії, керовані подіями, для подій життєвого циклу агента.
- [Webhooks](/uk/automation/cron-jobs#webhooks): вхідні тригери HTTP-подій.
- [Робочий простір агента](/uk/concepts/agent-workspace): де зберігаються постійні розпорядження, включно з повним списком автоматично впроваджуваних bootstrap-файлів (`AGENTS.md`, `SOUL.md` тощо).
