---
read_when:
    - إعداد سير عمل لوكلاء مستقلين تعمل دون الحاجة إلى مطالبات لكل مهمة
    - تحديد ما يمكن للوكيل فعله بشكل مستقل مقابل ما يتطلب موافقة بشرية
    - هيكلة وكلاء متعددة البرامج بحدود واضحة وقواعد تصعيد
summary: تحديد صلاحية تشغيل دائمة لبرامج الوكلاء المستقلة
title: الأوامر الدائمة
x-i18n:
    generated_at: "2026-05-06T07:42:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04e871bbd3f51b50ce162576936d4b37acbdc5a94edcd73e390adc784465aa4
    source_path: automation/standing-orders.md
    workflow: 16
---

تمنح الأوامر الدائمة وكيلك **صلاحية تشغيل دائمة** لبرامج محددة. بدلا من إعطاء تعليمات فردية لكل مهمة في كل مرة، تحدد برامج ذات نطاق واضح ومحفزات وقواعد تصعيد - وينفذ الوكيل بشكل مستقل ضمن تلك الحدود.

هذا هو الفرق بين إخبار مساعدك "أرسل التقرير الأسبوعي" كل يوم جمعة وبين منحه صلاحية دائمة: "أنت مسؤول عن التقرير الأسبوعي. اجمعه كل يوم جمعة، وأرسله، ولا تصعد إلا إذا بدا أن هناك خطأ ما."

## لماذا الأوامر الدائمة

**بدون الأوامر الدائمة:**

- يجب عليك توجيه الوكيل لكل مهمة
- يبقى الوكيل خاملا بين الطلبات
- يتم نسيان العمل الروتيني أو تأخيره
- تصبح أنت عنق الزجاجة

**مع الأوامر الدائمة:**

- ينفذ الوكيل بشكل مستقل ضمن حدود محددة
- يحدث العمل الروتيني وفق الجدول دون توجيه
- لا تتدخل إلا للاستثناءات والموافقات
- يستثمر الوكيل وقت الخمول بإنتاجية

## كيف تعمل

تحدد الأوامر الدائمة في ملفات [مساحة عمل الوكيل](/ar/concepts/agent-workspace). النهج الموصى به هو تضمينها مباشرة في `AGENTS.md` (الذي يتم حقنه تلقائيا في كل جلسة) بحيث تكون دائما ضمن سياق الوكيل. بالنسبة للتكوينات الأكبر، يمكنك أيضا وضعها في ملف مخصص مثل `standing-orders.md` والإشارة إليه من `AGENTS.md`.

يحدد كل برنامج:

1. **النطاق** - ما يملك الوكيل صلاحية فعله
2. **المحفزات** - متى يتم التنفيذ (جدول، حدث، أو شرط)
3. **بوابات الموافقة** - ما يتطلب توقيع موافقة بشرية قبل التصرف
4. **قواعد التصعيد** - متى يتوقف ويطلب المساعدة

يحمل الوكيل هذه التعليمات في كل جلسة عبر ملفات تمهيد مساحة العمل (راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) للاطلاع على القائمة الكاملة للملفات التي يتم حقنها تلقائيا) وينفذ وفقا لها، مع دمجها مع [مهام Cron](/ar/automation/cron-jobs) للتنفيذ المستند إلى الوقت.

<Tip>
ضع الأوامر الدائمة في `AGENTS.md` لضمان تحميلها في كل جلسة. تمهيد مساحة العمل يحقن تلقائيا `AGENTS.md`، و`SOUL.md`، و`TOOLS.md`، و`IDENTITY.md`، و`USER.md`، و`HEARTBEAT.md`، و`BOOTSTRAP.md`، و`MEMORY.md` - لكن لا يحقن ملفات عشوائية في الأدلة الفرعية.
</Tip>

## تشريح أمر دائم

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

## الأوامر الدائمة مع مهام Cron

تحدد الأوامر الدائمة **ما** يملك الوكيل صلاحية فعله. وتحدد [مهام Cron](/ar/automation/cron-jobs) **متى** يحدث ذلك. تعملان معا:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

ينبغي أن يشير موجه مهمة Cron إلى الأمر الدائم بدلا من تكراره:

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

## أمثلة

### المثال 1: المحتوى ووسائل التواصل الاجتماعي (دورة أسبوعية)

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

### المثال 2: العمليات المالية (محفزة بحدث)

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

### المثال 3: المراقبة والتنبيهات (مستمر)

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

## نمط التنفيذ والتحقق والإبلاغ

تعمل الأوامر الدائمة بأفضل شكل عندما تقترن بانضباط تنفيذ صارم. ينبغي أن تتبع كل مهمة في أمر دائم هذه الحلقة:

1. **التنفيذ** - نفذ العمل الفعلي (لا تكتف بالإقرار بالتعليمة)
2. **التحقق** - أكد أن النتيجة صحيحة (الملف موجود، الرسالة تم تسليمها، البيانات تم تحليلها)
3. **الإبلاغ** - أخبر المالك بما تم فعله وما تم التحقق منه

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

يمنع هذا النمط أكثر أنماط فشل الوكيل شيوعا: الإقرار بالمهمة دون إكمالها.

## بنية البرامج المتعددة

بالنسبة للوكلاء الذين يديرون عدة مجالات اهتمام، نظم الأوامر الدائمة كبرامج منفصلة ذات حدود واضحة:

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

ينبغي أن يكون لكل برنامج:

- **إيقاع محفزات** خاص به (أسبوعي، شهري، مدفوع بالأحداث، مستمر)
- **بوابات موافقة** خاصة به (تحتاج بعض البرامج إلى إشراف أكبر من غيرها)
- **حدود** واضحة (ينبغي أن يعرف الوكيل أين ينتهي برنامج وأين يبدأ آخر)

## أفضل الممارسات

### افعل

- ابدأ بصلاحية ضيقة ووسعها مع بناء الثقة
- حدد بوابات موافقة صريحة للإجراءات عالية المخاطر
- أدرج أقسام "ما لا يجب فعله" - فالحدود مهمة بقدر الأذونات
- ادمجها مع مهام Cron لتنفيذ موثوق قائم على الوقت
- راجع سجلات الوكيل أسبوعيا للتحقق من اتباع الأوامر الدائمة
- حدث الأوامر الدائمة مع تطور احتياجاتك - فهي مستندات حية

### تجنب

- منح صلاحية واسعة في اليوم الأول ("افعل ما تراه أفضل")
- تخطي قواعد التصعيد - يحتاج كل برنامج إلى بند "متى تتوقف وتسأل"
- افتراض أن الوكيل سيتذكر التعليمات الشفهية - ضع كل شيء في الملف
- خلط المجالات في برنامج واحد - افصل البرامج حسب المجالات
- نسيان فرضها بمهام Cron - الأوامر الدائمة بلا محفزات تصبح مجرد اقتراحات

## ذو صلة

- [الأتمتة والمهام](/ar/automation): جميع آليات الأتمتة في لمحة واحدة.
- [مهام Cron](/ar/automation/cron-jobs): فرض الجدولة للأوامر الدائمة.
- [الخطافات](/ar/automation/hooks): سكربتات مدفوعة بالأحداث لأحداث دورة حياة الوكيل.
- [Webhooks](/ar/automation/cron-jobs#webhooks): محفزات أحداث HTTP الواردة.
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace): حيث توجد الأوامر الدائمة، بما في ذلك القائمة الكاملة لملفات التمهيد التي يتم حقنها تلقائيا (`AGENTS.md`، و`SOUL.md`، وما إلى ذلك).
