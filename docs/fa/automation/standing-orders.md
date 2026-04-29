---
read_when:
    - راه‌اندازی گردش‌کارهای عامل‌های خودمختار که بدون پرامپت‌دهی برای هر وظیفه اجرا می‌شوند
    - تعریف اینکه عامل چه کارهایی را می‌تواند مستقل انجام دهد و چه کارهایی به تأیید انسانی نیاز دارد
    - ساختاردهی عامل‌های چندبرنامه‌ای با مرزهای روشن و قواعد ارجاع
summary: اختیار عملیاتی دائمی را برای برنامه‌های عامل خودمختار تعریف کنید
title: دستورالعمل‌های دائمی
x-i18n:
    generated_at: "2026-04-29T22:23:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 16
---

دستورهای دائمی به عامل شما **اختیار عملیاتی دائمی** برای برنامه‌های تعریف‌شده می‌دهند. به‌جای اینکه هر بار دستورهای جداگانه برای وظیفه‌ها بدهید، برنامه‌هایی با محدوده، محرک‌ها و قواعد تشدید روشن تعریف می‌کنید، و عامل در همان مرزها به‌صورت خودمختار اجرا می‌کند.

این تفاوت بین این است که هر جمعه به دستیار خود بگویید «گزارش هفتگی را بفرست» و اینکه اختیار دائمی بدهید: «گزارش هفتگی مال توست. هر جمعه آن را گردآوری کن، بفرست، و فقط اگر چیزی نادرست به نظر رسید تشدید کن.»

## چرا دستورهای دائمی

**بدون دستورهای دائمی:**

- باید برای هر وظیفه به عامل prompt بدهید
- عامل بین درخواست‌ها بیکار می‌ماند
- کارهای روتین فراموش یا عقب می‌افتند
- شما به گلوگاه تبدیل می‌شوید

**با دستورهای دائمی:**

- عامل در مرزهای تعریف‌شده به‌صورت خودمختار اجرا می‌کند
- کارهای روتین بدون prompt طبق زمان‌بندی انجام می‌شوند
- شما فقط برای استثناها و تأییدها درگیر می‌شوید
- عامل زمان بیکاری را به‌شکل مولد پر می‌کند

## چگونه کار می‌کنند

دستورهای دائمی در فایل‌های [فضای کاری عامل](/fa/concepts/agent-workspace) شما تعریف می‌شوند. رویکرد پیشنهادی این است که آن‌ها را مستقیم در `AGENTS.md` بگذارید (که در هر نشست به‌صورت خودکار تزریق می‌شود) تا عامل همیشه آن‌ها را در context داشته باشد. برای پیکربندی‌های بزرگ‌تر، می‌توانید آن‌ها را در یک فایل اختصاصی مثل `standing-orders.md` هم قرار دهید و از `AGENTS.md` به آن ارجاع دهید.

هر برنامه مشخص می‌کند:

1. **محدوده** — عامل مجاز است چه کاری انجام دهد
2. **محرک‌ها** — چه زمانی اجرا شود (زمان‌بندی، رویداد، یا شرط)
3. **دروازه‌های تأیید** — چه چیزی پیش از اقدام به امضای انسانی نیاز دارد
4. **قواعد تشدید** — چه زمانی متوقف شود و کمک بخواهد

عامل این دستورها را در هر نشست از طریق فایل‌های راه‌اندازی فضای کاری بارگذاری می‌کند (برای فهرست کامل فایل‌های تزریق‌شده خودکار، [فضای کاری عامل](/fa/concepts/agent-workspace) را ببینید) و بر اساس آن‌ها اجرا می‌کند؛ همراه با [کارهای cron](/fa/automation/cron-jobs) برای اعمال زمان‌بندی‌شده.

<Tip>
دستورهای دائمی را در `AGENTS.md` بگذارید تا تضمین شود در هر نشست بارگذاری می‌شوند. راه‌اندازی فضای کاری به‌صورت خودکار `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md` و `MEMORY.md` را تزریق می‌کند، اما فایل‌های دلخواه در زیردایرکتوری‌ها را تزریق نمی‌کند.
</Tip>

## کالبد یک دستور دائمی

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
- Do not skip delivery if metrics look bad — report accurately
```

## دستورهای دائمی به‌همراه کارهای cron

دستورهای دائمی تعریف می‌کنند عامل مجاز است **چه کاری** انجام دهد. [کارهای Cron](/fa/automation/cron-jobs) تعریف می‌کنند این کار **چه زمانی** انجام شود. آن‌ها با هم کار می‌کنند:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

prompt کار cron باید به دستور دائمی ارجاع دهد، نه اینکه آن را تکرار کند:

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

## مثال‌ها

### مثال ۱: محتوا و رسانه‌های اجتماعی (چرخه هفتگی)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### مثال ۲: عملیات مالی (محرک‌شده با رویداد)

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

### مثال ۳: پایش و هشدارها (پیوسته)

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

## الگوی اجرا-راستی‌آزمایی-گزارش

دستورهای دائمی وقتی بهترین عملکرد را دارند که با انضباط اجرایی سخت‌گیرانه ترکیب شوند. هر وظیفه در یک دستور دائمی باید این حلقه را دنبال کند:

1. **اجرا** — کار واقعی را انجام بده (فقط دستور را تأیید نکن)
2. **راستی‌آزمایی** — تأیید کن نتیجه درست است (فایل وجود دارد، پیام تحویل شده، داده parse شده)
3. **گزارش** — به مالک بگو چه کاری انجام شد و چه چیزی راستی‌آزمایی شد

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

این الگو از رایج‌ترین حالت شکست عامل جلوگیری می‌کند: تأیید یک وظیفه بدون کامل‌کردن آن.

## معماری چندبرنامه‌ای

برای عامل‌هایی که چند حوزه را مدیریت می‌کنند، دستورهای دائمی را به‌صورت برنامه‌های جداگانه با مرزهای روشن سازمان‌دهی کنید:

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

هر برنامه باید داشته باشد:

- **آهنگ محرک** خودش را (هفتگی، ماهانه، رویدادمحور، پیوسته)
- **دروازه‌های تأیید** خودش را (برخی برنامه‌ها به نظارت بیشتری نسبت به بقیه نیاز دارند)
- **مرزهای** روشن (عامل باید بداند یک برنامه کجا تمام می‌شود و برنامه دیگر کجا شروع می‌شود)

## بهترین رویه‌ها

### انجام دهید

- با اختیار محدود شروع کنید و با شکل‌گیری اعتماد آن را گسترش دهید
- برای اقدام‌های پرریسک دروازه‌های تأیید صریح تعریف کنید
- بخش‌های «چه کاری انجام نشود» را اضافه کنید؛ مرزها به‌اندازه مجوزها مهم‌اند
- برای اجرای زمان‌مند قابل‌اعتماد، با کارهای cron ترکیب کنید
- لاگ‌های عامل را هر هفته بازبینی کنید تا مطمئن شوید دستورهای دائمی دنبال می‌شوند
- با تغییر نیازهایتان، دستورهای دائمی را به‌روزرسانی کنید؛ آن‌ها سندهای زنده‌اند

### پرهیز کنید

- در روز اول اختیار گسترده ندهید («هر کاری فکر می‌کنی بهتر است انجام بده»)
- قواعد تشدید را حذف نکنید؛ هر برنامه به یک بند «چه زمانی متوقف شود و بپرسد» نیاز دارد
- فرض نکنید عامل دستورهای شفاهی را به یاد می‌آورد؛ همه چیز را در فایل بگذارید
- حوزه‌ها را در یک برنامه واحد مخلوط نکنید؛ برای حوزه‌های جداگانه برنامه‌های جداگانه بسازید
- اعمال با کارهای cron را فراموش نکنید؛ دستورهای دائمی بدون محرک به پیشنهاد تبدیل می‌شوند

## مرتبط

- [اتوماسیون و وظیفه‌ها](/fa/automation): نمای کلی همه سازوکارهای اتوماسیون.
- [کارهای Cron](/fa/automation/cron-jobs): اعمال زمان‌بندی برای دستورهای دائمی.
- [قلاب‌ها](/fa/automation/hooks): اسکریپت‌های رویدادمحور برای رویدادهای چرخه عمر عامل.
- [Webhookها](/fa/automation/cron-jobs#webhooks): محرک‌های رویداد HTTP ورودی.
- [فضای کاری عامل](/fa/concepts/agent-workspace): جایی که دستورهای دائمی قرار می‌گیرند، شامل فهرست کامل فایل‌های راه‌اندازی تزریق‌شده خودکار (`AGENTS.md`، `SOUL.md`، و غیره).
