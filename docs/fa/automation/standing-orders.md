---
read_when:
    - راه‌اندازی جریان‌های کاری عامل‌های خودمختار که بدون پرامپت‌دهی برای هر وظیفه اجرا می‌شوند
    - تعیین اینکه عامل چه کارهایی را می‌تواند مستقل انجام دهد و چه کارهایی نیازمند تأیید انسانی است
    - ساختاردهی عامل‌های چندبرنامه‌ای با مرزبندی‌های روشن و قواعد ارجاع
summary: اختیارات عملیاتی دائمی را برای برنامه‌های عامل خودمختار تعریف کنید
title: دستورهای دائمی
x-i18n:
    generated_at: "2026-05-10T19:21:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c78a723c296e1b695fd0fa7b0c3dbc3572fcfc1f49d6fadcab7a5a7a44c4b8d
    source_path: automation/standing-orders.md
    workflow: 16
---

دستورهای دائمی به عامل شما **اختیار عملیاتی دائمی** برای برنامه‌های تعریف‌شده می‌دهند. به‌جای اینکه هر بار دستورهای جداگانه برای هر وظیفه بدهید، برنامه‌هایی با دامنه، محرک‌ها و قواعد ارجاع روشن تعریف می‌کنید - و عامل در همان مرزها به‌صورت خودکار اجرا می‌کند.

این تفاوت بین این است که هر جمعه به دستیار خود بگویید «گزارش هفتگی را بفرست» و اینکه اختیار دائمی بدهید: «گزارش هفتگی با توست. هر جمعه آن را گردآوری کن، بفرست، و فقط اگر چیزی نادرست به نظر رسید ارجاع بده.»

## چرا دستورهای دائمی

**بدون دستورهای دائمی:**

- باید برای هر وظیفه به عامل اعلان بدهید
- عامل بین درخواست‌ها بیکار می‌ماند
- کارهای روتین فراموش یا به تأخیر می‌افتند
- شما به گلوگاه تبدیل می‌شوید

**با دستورهای دائمی:**

- عامل در مرزهای تعریف‌شده به‌صورت خودکار اجرا می‌کند
- کارهای روتین بدون اعلان طبق زمان‌بندی انجام می‌شوند
- شما فقط برای استثناها و تأییدها درگیر می‌شوید
- عامل زمان بیکاری را به‌صورت سازنده پر می‌کند

## چگونه کار می‌کنند

دستورهای دائمی در فایل‌های [فضای کاری عامل](/fa/concepts/agent-workspace) شما تعریف می‌شوند. رویکرد پیشنهادی این است که آن‌ها را مستقیماً در `AGENTS.md` قرار دهید (که در هر نشست به‌صورت خودکار تزریق می‌شود) تا عامل همیشه آن‌ها را در context داشته باشد. برای پیکربندی‌های بزرگ‌تر، می‌توانید آن‌ها را در یک فایل اختصاصی مانند `standing-orders.md` نیز قرار دهید و از `AGENTS.md` به آن ارجاع دهید.

هر برنامه مشخص می‌کند:

1. **دامنه** - عامل مجاز به انجام چه کارهایی است
2. **محرک‌ها** - چه زمانی اجرا شود (زمان‌بندی، رویداد، یا شرط)
3. **دروازه‌های تأیید** - چه چیزی قبل از اقدام به امضای انسانی نیاز دارد
4. **قواعد ارجاع** - چه زمانی متوقف شود و کمک بخواهد

عامل این دستورها را در هر نشست از طریق فایل‌های bootstrap فضای کاری بارگذاری می‌کند (برای فهرست کامل فایل‌های تزریق‌شده خودکار، [فضای کاری عامل](/fa/concepts/agent-workspace) را ببینید) و همراه با [کارهای Cron](/fa/automation/cron-jobs) برای اجرای مبتنی بر زمان، آن‌ها را اجرا می‌کند.

<Tip>
دستورهای دائمی را در `AGENTS.md` قرار دهید تا تضمین شود در هر نشست بارگذاری می‌شوند. bootstrap فضای کاری به‌صورت خودکار `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md` و `MEMORY.md` را تزریق می‌کند - اما فایل‌های دلخواه در زیردایرکتوری‌ها را نه.
</Tip>

## ساختار یک دستور دائمی

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

## دستورهای دائمی به‌همراه کارهای Cron

دستورهای دائمی تعریف می‌کنند عامل مجاز به انجام **چه کاری** است. [کارهای Cron](/fa/automation/cron-jobs) تعریف می‌کنند آن کار **چه زمانی** انجام می‌شود. آن‌ها با هم کار می‌کنند:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

اعلان کار Cron باید به دستور دائمی ارجاع دهد، نه اینکه آن را تکرار کند:

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

## مثال‌ها

### مثال ۱: محتوا و شبکه‌های اجتماعی (چرخه هفتگی)

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

### مثال ۲: عملیات مالی (محرک‌محور با رویداد)

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

دستورهای دائمی زمانی بهترین کارایی را دارند که با انضباط اجرایی سخت‌گیرانه ترکیب شوند. هر وظیفه در یک دستور دائمی باید این حلقه را دنبال کند:

1. **اجرا** - کار واقعی را انجام بده (صرفاً دستور را تأیید نکن)
2. **راستی‌آزمایی** - تأیید کن نتیجه درست است (فایل وجود دارد، پیام تحویل داده شده، داده parse شده است)
3. **گزارش** - به مالک بگو چه کاری انجام شده و چه چیزی راستی‌آزمایی شده است

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

این الگو از رایج‌ترین حالت شکست عامل جلوگیری می‌کند: تأیید یک وظیفه بدون کامل کردن آن.

## معماری چندبرنامه‌ای

برای عامل‌هایی که چند دغدغه را مدیریت می‌کنند، دستورهای دائمی را به‌صورت برنامه‌های جداگانه با مرزهای روشن سازمان‌دهی کنید:

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

- **ریتم محرک** مخصوص خود (هفتگی، ماهانه، رویدادمحور، پیوسته)
- **دروازه‌های تأیید** مخصوص خود (برخی برنامه‌ها به نظارت بیشتری نسبت به بقیه نیاز دارند)
- **مرزهای** روشن (عامل باید بداند یک برنامه کجا تمام می‌شود و برنامه دیگر کجا شروع می‌شود)

## بهترین رویه‌ها

### انجام دهید

- با اختیار محدود شروع کنید و با افزایش اعتماد آن را گسترش دهید
- برای اقدام‌های پرریسک، دروازه‌های تأیید صریح تعریف کنید
- بخش‌های «چه کاری انجام نشود» را اضافه کنید - مرزها به‌اندازه مجوزها مهم‌اند
- برای اجرای قابل‌اعتماد مبتنی بر زمان، با کارهای Cron ترکیب کنید
- لاگ‌های عامل را هر هفته مرور کنید تا راستی‌آزمایی شود دستورهای دائمی دنبال می‌شوند
- با تکامل نیازهایتان، دستورهای دائمی را به‌روزرسانی کنید - آن‌ها اسناد زنده‌اند

### پرهیز کنید

- در روز اول اختیار گسترده بدهید («هر کاری فکر می‌کنی بهتر است انجام بده»)
- قواعد ارجاع را حذف کنید - هر برنامه به بند «چه زمانی متوقف شود و بپرسد» نیاز دارد
- فرض نکنید عامل دستورهای شفاهی را به خاطر می‌سپارد - همه‌چیز را در فایل قرار دهید
- دغدغه‌ها را در یک برنامه واحد مخلوط نکنید - برای دامنه‌های جداگانه، برنامه‌های جداگانه بسازید
- اجرای آن را با کارهای Cron فراموش نکنید - دستورهای دائمی بدون محرک به پیشنهاد تبدیل می‌شوند

## مرتبط

- [اتوماسیون و وظیفه‌ها](/fa/automation): همه سازوکارهای اتوماسیون در یک نگاه.
- [کارهای Cron](/fa/automation/cron-jobs): اجرای زمان‌بندی برای دستورهای دائمی.
- [Hookها](/fa/automation/hooks): اسکریپت‌های رویدادمحور برای رویدادهای چرخه عمر عامل.
- [Webhookها](/fa/automation/cron-jobs#webhooks): محرک‌های رویداد HTTP ورودی.
- [فضای کاری عامل](/fa/concepts/agent-workspace): جایی که دستورهای دائمی قرار دارند، شامل فهرست کامل فایل‌های bootstrap تزریق‌شده خودکار (`AGENTS.md`، `SOUL.md` و غیره).
