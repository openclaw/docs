---
read_when:
    - راه‌اندازی گردش‌کارهای عامل خودمختار که بدون پرامپت‌دهی برای هر وظیفه اجرا می‌شوند
    - تعریف کارهایی که عامل می‌تواند مستقل انجام دهد در مقابل کارهایی که به تأیید انسان نیاز دارد
    - ساختاربندی عامل‌های چندبرنامه‌ای با مرزهای روشن و قواعد ارجاع
summary: تعریف اختیار عملیاتی دائمی برای برنامه‌های عامل خودمختار
title: دستورهای دائمی
x-i18n:
    generated_at: "2026-05-06T09:02:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04e871bbd3f51b50ce162576936d4b37acbdc5a94edcd73e390adc784465aa4
    source_path: automation/standing-orders.md
    workflow: 16
---

دستورهای دائمی به عامل شما **اختیار عملیاتی دائمی** برای برنامه‌های تعریف‌شده می‌دهند. به‌جای اینکه هر بار دستورهای جداگانه برای هر وظیفه بدهید، برنامه‌هایی با دامنه، محرک‌ها و قواعد ارجاع روشن تعریف می‌کنید - و عامل در همان مرزها به‌صورت خودکار اجرا می‌کند.

این تفاوت بین این است که هر جمعه به دستیار خود بگویید «گزارش هفتگی را بفرست» یا اختیار دائمی بدهید: «گزارش هفتگی با توست. هر جمعه آن را تدوین کن، بفرست، و فقط اگر چیزی نادرست به نظر رسید ارجاع بده.»

## چرا دستورهای دائمی

**بدون دستورهای دائمی:**

- باید برای هر وظیفه به عامل درخواست بدهید
- عامل بین درخواست‌ها بیکار می‌ماند
- کارهای روتین فراموش یا با تأخیر انجام می‌شوند
- شما به گلوگاه تبدیل می‌شوید

**با دستورهای دائمی:**

- عامل در مرزهای تعریف‌شده به‌صورت خودکار اجرا می‌کند
- کارهای روتین طبق زمان‌بندی و بدون درخواست انجام می‌شوند
- شما فقط برای استثناها و تأییدها درگیر می‌شوید
- عامل زمان بیکاری را به‌صورت سازنده پر می‌کند

## نحوهٔ کارکرد

دستورهای دائمی در فایل‌های [فضای کاری عامل](/fa/concepts/agent-workspace) شما تعریف می‌شوند. رویکرد پیشنهادی این است که آن‌ها را مستقیماً در `AGENTS.md` قرار دهید (که در هر نشست به‌صورت خودکار تزریق می‌شود) تا عامل همیشه آن‌ها را در زمینه داشته باشد. برای پیکربندی‌های بزرگ‌تر، همچنین می‌توانید آن‌ها را در یک فایل اختصاصی مثل `standing-orders.md` قرار دهید و از `AGENTS.md` به آن ارجاع بدهید.

هر برنامه مشخص می‌کند:

1. **دامنه** - عامل مجاز است چه کاری انجام دهد
2. **محرک‌ها** - چه زمانی اجرا شود (زمان‌بندی، رویداد یا شرط)
3. **دروازه‌های تأیید** - چه چیزی پیش از اقدام به تأیید انسانی نیاز دارد
4. **قواعد ارجاع** - چه زمانی متوقف شود و کمک بخواهد

عامل این دستورها را در هر نشست از طریق فایل‌های راه‌انداز فضای کاری بارگذاری می‌کند (برای فهرست کامل فایل‌های تزریق‌شوندهٔ خودکار، [فضای کاری عامل](/fa/concepts/agent-workspace) را ببینید) و آن‌ها را همراه با [کارهای Cron](/fa/automation/cron-jobs) برای اجرای مبتنی بر زمان اجرا می‌کند.

<Tip>
دستورهای دائمی را در `AGENTS.md` قرار دهید تا تضمین شود در هر نشست بارگذاری می‌شوند. راه‌انداز فضای کاری به‌صورت خودکار `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md` و `MEMORY.md` را تزریق می‌کند - اما فایل‌های دلخواه در زیردایرکتوری‌ها را نه.
</Tip>

## کالبدشناسی یک دستور دائمی

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

## دستورهای دائمی به‌علاوهٔ کارهای Cron

دستورهای دائمی تعریف می‌کنند عامل مجاز است **چه کاری** انجام دهد. [کارهای Cron](/fa/automation/cron-jobs) تعریف می‌کنند آن کار **چه زمانی** انجام شود. این دو با هم کار می‌کنند:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

درخواست کار Cron باید به دستور دائمی ارجاع بدهد، نه اینکه آن را تکرار کند:

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

### مثال ۱: محتوا و شبکه‌های اجتماعی (چرخهٔ هفتگی)

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

دستورهای دائمی وقتی بهترین عملکرد را دارند که با انضباط اجرایی سخت‌گیرانه همراه شوند. هر وظیفه در یک دستور دائمی باید این چرخه را دنبال کند:

1. **اجرا** - کار واقعی را انجام بده (فقط دستور را تأیید نکن)
2. **راستی‌آزمایی** - تأیید کن نتیجه درست است (فایل وجود دارد، پیام تحویل داده شده، داده تجزیه شده)
3. **گزارش** - به مالک بگو چه کاری انجام شد و چه چیزی راستی‌آزمایی شد

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

این الگو رایج‌ترین حالت شکست عامل را پیشگیری می‌کند: تأیید یک وظیفه بدون کامل‌کردن آن.

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

- **آهنگ محرک** خودش (هفتگی، ماهانه، رویدادمحور، پیوسته)
- **دروازه‌های تأیید** خودش (برخی برنامه‌ها به نظارت بیشتری نسبت به بقیه نیاز دارند)
- **مرزهای** روشن (عامل باید بداند یک برنامه کجا تمام می‌شود و برنامهٔ دیگر کجا شروع می‌شود)

## بهترین شیوه‌ها

### انجام دهید

- با اختیار محدود شروع کنید و با افزایش اعتماد آن را گسترش دهید
- برای اقدام‌های پرریسک، دروازه‌های تأیید صریح تعریف کنید
- بخش‌های «چه کاری انجام نشود» را اضافه کنید - مرزها به‌اندازهٔ مجوزها اهمیت دارند
- برای اجرای قابل‌اعتماد مبتنی بر زمان، با کارهای Cron ترکیب کنید
- لاگ‌های عامل را هر هفته مرور کنید تا تأیید شود دستورهای دائمی دنبال می‌شوند
- دستورهای دائمی را با تغییر نیازهایتان به‌روزرسانی کنید - آن‌ها اسناد زنده هستند

### پرهیز کنید

- اعطای اختیار گسترده در روز اول («هر کاری فکر می‌کنی بهتر است انجام بده»)
- حذف قواعد ارجاع - هر برنامه به بندی برای «چه زمانی متوقف شود و بپرسد» نیاز دارد
- فرض اینکه عامل دستورهای شفاهی را به خاطر می‌سپارد - همه چیز را در فایل بگذارید
- آمیختن دغدغه‌ها در یک برنامهٔ واحد - برای حوزه‌های جداگانه، برنامه‌های جداگانه داشته باشید
- فراموش‌کردن اعمال با کارهای Cron - دستورهای دائمی بدون محرک به پیشنهاد تبدیل می‌شوند

## مرتبط

- [اتوماسیون و وظیفه‌ها](/fa/automation): همهٔ سازوکارهای اتوماسیون در یک نگاه.
- [کارهای Cron](/fa/automation/cron-jobs): اعمال زمان‌بندی برای دستورهای دائمی.
- [قلاب‌ها](/fa/automation/hooks): اسکریپت‌های رویدادمحور برای رویدادهای چرخهٔ عمر عامل.
- [Webhookها](/fa/automation/cron-jobs#webhooks): محرک‌های رویداد HTTP ورودی.
- [فضای کاری عامل](/fa/concepts/agent-workspace): جایی که دستورهای دائمی در آن قرار می‌گیرند، شامل فهرست کامل فایل‌های راه‌انداز تزریق‌شوندهٔ خودکار (`AGENTS.md`، `SOUL.md` و غیره).
