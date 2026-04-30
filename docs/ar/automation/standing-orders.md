---
read_when:
    - إعداد سير عمل لوكلاء مستقلين تعمل دون مطالبة لكل مهمة
    - تحديد ما يمكن للوكيل فعله بشكل مستقل مقابل ما يحتاج إلى موافقة بشرية
    - هيكلة وكلاء متعددة البرامج بحدود واضحة وقواعد تصعيد
summary: تحديد صلاحيات تشغيل دائمة لبرامج الوكلاء المستقلين
title: التعليمات الدائمة
x-i18n:
    generated_at: "2026-04-30T07:39:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 16
---

الأوامر الدائمة تمنح وكيلك **صلاحية تشغيل دائمة** لبرامج محددة. بدلاً من إعطاء تعليمات مهام فردية في كل مرة، تعرّف برامج ذات نطاق واضح، ومشغلات، وقواعد تصعيد — وينفذها الوكيل ذاتياً ضمن تلك الحدود.

هذا هو الفرق بين أن تقول لمساعدك "أرسل التقرير الأسبوعي" كل يوم جمعة وبين منحه صلاحية دائمة: "أنت مسؤول عن التقرير الأسبوعي. اجمعه كل يوم جمعة، وأرسله، ولا تصعّد إلا إذا بدا أن هناك خطأ."

## لماذا الأوامر الدائمة

**من دون أوامر دائمة:**

- يجب أن تطلب من الوكيل تنفيذ كل مهمة
- يبقى الوكيل خاملاً بين الطلبات
- تُنسى الأعمال الروتينية أو تتأخر
- تصبح أنت عنق الزجاجة

**مع الأوامر الدائمة:**

- ينفذ الوكيل ذاتياً ضمن حدود محددة
- يحدث العمل الروتيني وفق الجدول من دون طلب
- لا تتدخل إلا في الاستثناءات والموافقات
- يستثمر الوكيل وقت الخمول بإنتاجية

## كيف تعمل

تُعرّف الأوامر الدائمة في ملفات [مساحة عمل الوكيل](/ar/concepts/agent-workspace). النهج الموصى به هو تضمينها مباشرةً في `AGENTS.md` (الذي يُحقن تلقائياً في كل جلسة) بحيث تكون دائماً ضمن سياق الوكيل. وللإعدادات الأكبر، يمكنك أيضاً وضعها في ملف مخصص مثل `standing-orders.md` والإشارة إليه من `AGENTS.md`.

يحدد كل برنامج:

1. **النطاق** — ما الذي يُخوّل الوكيل بفعله
2. **المشغلات** — متى يُنفذ (جدول، حدث، أو شرط)
3. **بوابات الموافقة** — ما الذي يتطلب توقيعاً بشرياً قبل التصرف
4. **قواعد التصعيد** — متى يجب التوقف وطلب المساعدة

يحمّل الوكيل هذه التعليمات في كل جلسة عبر ملفات تمهيد مساحة العمل (راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) للاطلاع على القائمة الكاملة للملفات المحقونة تلقائياً) وينفذ وفقها، مع دمجها مع [مهام Cron](/ar/automation/cron-jobs) للفرض المستند إلى الوقت.

<Tip>
ضع الأوامر الدائمة في `AGENTS.md` لضمان تحميلها في كل جلسة. تمهيد مساحة العمل يحقن تلقائياً `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md` و`MEMORY.md` — لكنه لا يحقن ملفات عشوائية في الأدلة الفرعية.
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
- Do not skip delivery if metrics look bad — report accurately
```

## الأوامر الدائمة مع مهام Cron

تحدد الأوامر الدائمة **ما** الذي يُخوّل الوكيل بفعله. وتحدد [مهام Cron](/ar/automation/cron-jobs) **متى** يحدث ذلك. يعملان معاً:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

يجب أن يشير موجه مهمة Cron إلى الأمر الدائم بدلاً من نسخه:

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
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### المثال 2: العمليات المالية (مشغلة بحدث)

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

## نمط التنفيذ والتحقق والتقرير

تعمل الأوامر الدائمة بأفضل شكل عند دمجها مع انضباط تنفيذ صارم. يجب أن تتبع كل مهمة في أمر دائم هذه الحلقة:

1. **نفّذ** — أنجز العمل الفعلي (لا تكتفِ بالإقرار بالتعليمة)
2. **تحقق** — أكد أن النتيجة صحيحة (الملف موجود، الرسالة سُلّمت، البيانات حُللت)
3. **أبلِغ** — أخبر المالك بما أُنجز وما تم التحقق منه

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

يمنع هذا النمط أكثر أوضاع فشل الوكيل شيوعاً: الإقرار بالمهمة من دون إكمالها.

## بنية متعددة البرامج

للوكلاء الذين يديرون اهتمامات متعددة، نظّم الأوامر الدائمة كبرامج منفصلة ذات حدود واضحة:

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

يجب أن يكون لكل برنامج:

- **إيقاع تشغيل** خاص به (أسبوعي، شهري، قائم على الأحداث، مستمر)
- **بوابات موافقة** خاصة به (بعض البرامج تحتاج إشرافاً أكثر من غيرها)
- **حدود** واضحة (يجب أن يعرف الوكيل أين ينتهي برنامج ويبدأ آخر)

## أفضل الممارسات

### افعل

- ابدأ بصلاحية ضيقة ووسعها مع بناء الثقة
- عرّف بوابات موافقة صريحة للإجراءات عالية المخاطر
- ضمّن أقسام "ما يجب عدم فعله" — فالحدود مهمة بقدر الأذونات
- ادمجها مع مهام Cron للتنفيذ الموثوق المستند إلى الوقت
- راجع سجلات الوكيل أسبوعياً للتحقق من اتباع الأوامر الدائمة
- حدّث الأوامر الدائمة مع تطور احتياجاتك — فهي مستندات حية

### تجنّب

- منح صلاحية واسعة في اليوم الأول ("افعل ما تراه الأفضل")
- تخطي قواعد التصعيد — كل برنامج يحتاج بنداً يحدد "متى تتوقف وتسأل"
- افتراض أن الوكيل سيتذكر التعليمات الشفهية — ضع كل شيء في الملف
- خلط الاهتمامات في برنامج واحد — افصل البرامج بحسب المجالات
- نسيان فرضها بمهام Cron — الأوامر الدائمة بلا مشغلات تصبح اقتراحات

## ذو صلة

- [الأتمتة والمهام](/ar/automation): كل آليات الأتمتة في لمحة واحدة.
- [مهام Cron](/ar/automation/cron-jobs): فرض الجدولة للأوامر الدائمة.
- [الخطافات](/ar/automation/hooks): سكربتات مدفوعة بالأحداث لأحداث دورة حياة الوكيل.
- [Webhooks](/ar/automation/cron-jobs#webhooks): مشغلات أحداث HTTP واردة.
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace): حيث توجد الأوامر الدائمة، بما في ذلك القائمة الكاملة لملفات التمهيد المحقونة تلقائياً (`AGENTS.md` و`SOUL.md` وما إلى ذلك).
