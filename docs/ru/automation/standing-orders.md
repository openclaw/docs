---
read_when:
    - Настройка автономных рабочих процессов агента, которые выполняются без запросов для каждой задачи
    - Определение того, что агент может делать самостоятельно, а что требует одобрения человека
    - Структурирование мультипрограммных агентов с четкими границами и правилами эскалации
summary: Определение постоянных рабочих полномочий для автономных агентных программ
title: Постоянные инструкции
x-i18n:
    generated_at: "2026-06-28T22:32:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a51baa7aca31cb34b682983374d4d551ed6ab57ae54a5c63e7d044bffeef756
    source_path: automation/standing-orders.md
    workflow: 16
---

Постоянные распоряжения дают вашему агенту **постоянные операционные полномочия** для заданных программ. Вместо того чтобы каждый раз давать инструкции для отдельной задачи, вы задаете программы с четкой областью действия, триггерами и правилами эскалации, а агент выполняет их автономно в этих границах.

Это разница между тем, чтобы каждую пятницу говорить помощнику «отправь еженедельный отчет», и тем, чтобы выдать постоянные полномочия: «Еженедельный отчет закреплен за тобой. Готовь его каждую пятницу, отправляй и эскалируй только если что-то выглядит неправильно».

## Зачем нужны постоянные распоряжения

**Без постоянных распоряжений:**

- Вам нужно давать агенту prompt для каждой задачи
- Агент простаивает между запросами
- Рутинная работа забывается или откладывается
- Вы становитесь узким местом

**С постоянными распоряжениями:**

- Агент выполняет задачи автономно в заданных границах
- Рутинная работа выполняется по расписанию без prompt
- Вы подключаетесь только для исключений и утверждений
- Агент продуктивно заполняет время простоя

## Как они работают

Постоянные распоряжения задаются в файлах вашего [рабочего пространства агента](/ru/concepts/agent-workspace). Рекомендуемый подход — включать их напрямую в `AGENTS.md` (он автоматически внедряется в каждый сеанс), чтобы агент всегда имел их в контексте. Для более крупных конфигураций их также можно поместить в отдельный файл, например `standing-orders.md`, и сослаться на него из `AGENTS.md`.

Каждая программа задает:

1. **Область действия** — что агент уполномочен делать
2. **Триггеры** — когда выполнять (по расписанию, событию или условию)
3. **Шлюзы утверждения** — что требует подтверждения человеком перед действием
4. **Правила эскалации** — когда остановиться и попросить помощи

Агент загружает эти инструкции в каждом сеансе через bootstrap-файлы рабочего пространства (полный список автоматически внедряемых файлов см. в разделе [Рабочее пространство агента](/ru/concepts/agent-workspace)) и выполняет их, в сочетании с [заданиями cron](/ru/automation/cron-jobs) для принудительного выполнения по времени.

<Tip>
Помещайте постоянные распоряжения в `AGENTS.md`, чтобы гарантировать их загрузку в каждом сеансе. Bootstrap рабочего пространства автоматически внедряет `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` и `MEMORY.md`, но не произвольные файлы в подкаталогах.
</Tip>

## Анатомия постоянного распоряжения

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

## Постоянные распоряжения плюс задания cron

Постоянные распоряжения определяют, **что** агент уполномочен делать. [Задания cron](/ru/automation/cron-jobs) определяют, **когда** это происходит. Они работают вместе:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Prompt задания cron должен ссылаться на постоянное распоряжение, а не дублировать его:

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

## Примеры

### Пример 1: контент и социальные сети (еженедельный цикл)

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

### Пример 2: финансовые операции (по событию)

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

### Пример 3: мониторинг и оповещения (непрерывно)

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

## Паттерн выполнить-проверить-сообщить

Постоянные распоряжения работают лучше всего в сочетании со строгой дисциплиной выполнения. Каждая задача в постоянном распоряжении должна следовать этому циклу:

1. **Выполнить** — выполнить фактическую работу (а не просто подтвердить инструкцию)
2. **Проверить** — подтвердить, что результат корректен (файл существует, сообщение доставлено, данные разобраны)
3. **Сообщить** — рассказать владельцу, что было сделано и что было проверено

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Этот паттерн предотвращает самый распространенный режим сбоя агента: подтверждение задачи без ее завершения.

## Архитектура из нескольких программ

Для агентов, управляющих несколькими направлениями, организуйте постоянные распоряжения как отдельные программы с четкими границами:

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

У каждой программы должны быть:

- Собственная **частота триггеров** (еженедельно, ежемесячно, по событию, непрерывно)
- Собственные **шлюзы утверждения** (некоторым программам нужен больший контроль, чем другим)
- Четкие **границы** (агент должен понимать, где одна программа заканчивается и начинается другая)

## Рекомендации

### Делайте

- Начинайте с узких полномочий и расширяйте их по мере роста доверия
- Задавайте явные шлюзы утверждения для действий с высоким риском
- Включайте разделы «Что НЕ делать» — границы так же важны, как и разрешения
- Сочетайте с заданиями cron для надежного выполнения по времени
- Еженедельно просматривайте журналы агента, чтобы проверять соблюдение постоянных распоряжений
- Обновляйте постоянные распоряжения по мере изменения ваших потребностей — это живые документы

### Избегайте

- Выдавать широкие полномочия в первый день («делай все, что считаешь лучшим»)
- Пропускать правила эскалации — каждой программе нужен пункт «когда остановиться и спросить»
- Предполагать, что агент запомнит устные инструкции — помещайте все в файл
- Смешивать разные направления в одной программе — отдельные программы для отдельных доменов
- Забывать принудительное выполнение через задания cron — постоянные распоряжения без триггеров превращаются в рекомендации

## См. также

- [Автоматизация](/ru/automation): все механизмы автоматизации в одном обзоре.
- [Задания cron](/ru/automation/cron-jobs): принудительное выполнение постоянных распоряжений по расписанию.
- [Hooks](/ru/automation/hooks): сценарии, запускаемые событиями жизненного цикла агента.
- [Webhooks](/ru/automation/cron-jobs#webhooks): входящие триггеры HTTP-событий.
- [Рабочее пространство агента](/ru/concepts/agent-workspace): где хранятся постоянные распоряжения, включая полный список автоматически внедряемых bootstrap-файлов (`AGENTS.md`, `SOUL.md` и т. д.).
