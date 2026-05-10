---
read_when:
    - إعداد تدفقات عمل الوكلاء المستقلة التي تعمل دون الحاجة إلى مطالبة لكل مهمة
    - تحديد ما يمكن للوكيل فعله بشكل مستقل مقابل ما يتطلب موافقة بشرية
    - هيكلة الوكلاء متعددي البرامج بحدود واضحة وقواعد تصعيد
summary: تحديد الصلاحية التشغيلية الدائمة لبرامج الوكلاء المستقلة
title: الأوامر الدائمة
x-i18n:
    generated_at: "2026-05-10T19:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c78a723c296e1b695fd0fa7b0c3dbc3572fcfc1f49d6fadcab7a5a7a44c4b8d
    source_path: automation/standing-orders.md
    workflow: 16
---

تمنح الأوامر الدائمة وكيلك **صلاحية تشغيل دائمة** لبرامج محددة. بدلا من إعطاء تعليمات مهمة منفردة في كل مرة، تعرّف برامج ذات نطاق واضح ومشغلات وقواعد تصعيد، وينفذ الوكيل ذاتيا ضمن تلك الحدود.

هذا هو الفرق بين أن تقول لمساعدك "أرسل التقرير الأسبوعي" كل يوم جمعة، وبين منحه صلاحية دائمة: "أنت مسؤول عن التقرير الأسبوعي. اجمعه كل يوم جمعة، وأرسله، ولا تصعّد إلا إذا بدا أن هناك شيئا خاطئا."

## لماذا الأوامر الدائمة

**بدون الأوامر الدائمة:**

- يجب أن تطلب من الوكيل تنفيذ كل مهمة
- يبقى الوكيل خاملا بين الطلبات
- تُنسى الأعمال الروتينية أو تتأخر
- تصبح أنت عنق الزجاجة

**مع الأوامر الدائمة:**

- ينفذ الوكيل ذاتيا ضمن حدود محددة
- تنفذ الأعمال الروتينية في موعدها دون طلب
- لا تتدخل إلا للاستثناءات والموافقات
- يستغل الوكيل وقت الخمول بشكل منتج

## كيف تعمل

تُعرّف الأوامر الدائمة في ملفات [مساحة عمل الوكيل](/ar/concepts/agent-workspace). النهج الموصى به هو تضمينها مباشرة في `AGENTS.md` (الذي يُحقن تلقائيا في كل جلسة) حتى تكون دائما ضمن سياق الوكيل. وللإعدادات الأكبر، يمكنك أيضا وضعها في ملف مخصص مثل `standing-orders.md` والإشارة إليه من `AGENTS.md`.

يحدد كل برنامج:

1. **النطاق** - ما يملك الوكيل صلاحية فعله
2. **المشغلات** - متى ينفذ (جدول، حدث، أو شرط)
3. **بوابات الموافقة** - ما يتطلب توقيعا بشريا قبل التصرف
4. **قواعد التصعيد** - متى يتوقف ويطلب المساعدة

يحمّل الوكيل هذه التعليمات في كل جلسة عبر ملفات تمهيد مساحة العمل (راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) للاطلاع على القائمة الكاملة للملفات المحقونة تلقائيا) وينفذ وفقها، مع دمجها مع [مهام Cron](/ar/automation/cron-jobs) للإنفاذ المعتمد على الوقت.

<Tip>
ضع الأوامر الدائمة في `AGENTS.md` لضمان تحميلها في كل جلسة. يحقن تمهيد مساحة العمل تلقائيا `AGENTS.md`، و`SOUL.md`، و`TOOLS.md`، و`IDENTITY.md`، و`USER.md`، و`HEARTBEAT.md`، و`BOOTSTRAP.md`، و`MEMORY.md` - ولكن لا يحقن الملفات العشوائية في الأدلة الفرعية.
</Tip>

## بنية الأمر الدائم

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

تحدد الأوامر الدائمة **ما** يملك الوكيل صلاحية فعله. وتحدد [مهام Cron](/ar/automation/cron-jobs) **متى** يحدث ذلك. يعملان معا:

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
  --channel imessage \
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

### المثال 2: عمليات التمويل (مشغلة بحدث)

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

تعمل الأوامر الدائمة بأفضل شكل عند دمجها مع انضباط صارم في التنفيذ. ينبغي أن تتبع كل مهمة في أمر دائم هذه الحلقة:

1. **نفّذ** - أنجز العمل الفعلي (لا تكتف بالإقرار بالتعليمات)
2. **تحقق** - أكّد أن النتيجة صحيحة (الملف موجود، الرسالة سُلّمت، البيانات حُللت)
3. **أبلغ** - أخبر المالك بما أُنجز وما تم التحقق منه

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

يمنع هذا النمط أكثر أنماط فشل الوكلاء شيوعا: الإقرار بالمهمة دون إكمالها.

## بنية متعددة البرامج

للوكلاء الذين يديرون عدة مجالات، نظّم الأوامر الدائمة كبرامج منفصلة ذات حدود واضحة:

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

- **إيقاع تشغيل** خاص به (أسبوعي، شهري، مدفوع بحدث، مستمر)
- **بوابات موافقة** خاصة به (تحتاج بعض البرامج إلى إشراف أكثر من غيرها)
- **حدود** واضحة (ينبغي أن يعرف الوكيل أين ينتهي برنامج ويبدأ آخر)

## أفضل الممارسات

### افعل

- ابدأ بصلاحية ضيقة ووسّعها مع ازدياد الثقة
- عرّف بوابات موافقة صريحة للإجراءات عالية المخاطر
- أدرج أقساما بعنوان "ما يجب عدم فعله" - فالحدود مهمة بقدر أهمية الأذونات
- ادمجها مع مهام Cron لتنفيذ موثوق قائم على الوقت
- راجع سجلات الوكيل أسبوعيا للتحقق من اتباع الأوامر الدائمة
- حدّث الأوامر الدائمة مع تطور احتياجاتك - فهي مستندات حية

### تجنب

- منح صلاحية واسعة في اليوم الأول ("افعل ما تراه أفضل")
- تخطي قواعد التصعيد - يحتاج كل برنامج إلى بند "متى تتوقف وتسأل"
- افتراض أن الوكيل سيتذكر التعليمات الشفهية - ضع كل شيء في الملف
- خلط الاهتمامات في برنامج واحد - اجعل البرامج منفصلة للمجالات المنفصلة
- نسيان الإنفاذ باستخدام مهام Cron - الأوامر الدائمة دون مشغلات تصبح اقتراحات

## ذو صلة

- [الأتمتة والمهام](/ar/automation): جميع آليات الأتمتة في لمحة.
- [مهام Cron](/ar/automation/cron-jobs): إنفاذ الجداول للأوامر الدائمة.
- [Hooks](/ar/automation/hooks): سكربتات مدفوعة بالأحداث لأحداث دورة حياة الوكيل.
- [Webhooks](/ar/automation/cron-jobs#webhooks): مشغلات أحداث HTTP الواردة.
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace): حيث تعيش الأوامر الدائمة، بما في ذلك القائمة الكاملة لملفات التمهيد المحقونة تلقائيا (`AGENTS.md`، و`SOUL.md`، وغيرها).
