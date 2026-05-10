---
read_when:
    - تريد فهم كيفية ارتباط Task Flow بالمهام الخلفية
    - تصادف تدفق المهام أو تدفق مهام OpenClaw في ملاحظات الإصدار أو الوثائق
    - تريد فحص حالة التدفق الدائمة أو إدارتها
summary: طبقة تنسيق تدفق المهام فوق المهام الخلفية
title: سير المهام
x-i18n:
    generated_at: "2026-05-10T19:21:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 135227b250840cd579f10a8ab4211e9319c447bb4d6df25907738ea138fc2d2a
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow هو طبقة تنظيم التدفقات التي تقع فوق [المهام الخلفية](/ar/automation/tasks). يدير تدفقات متينة متعددة الخطوات بحالتها الخاصة، وتتبع المراجعات، ودلالات المزامنة، بينما تظل المهام الفردية هي وحدة العمل المنفصل.

## متى تستخدم Task Flow

استخدم Task Flow عندما يمتد العمل عبر خطوات متعددة متسلسلة أو متفرعة وتحتاج إلى تتبع متين للتقدم عبر عمليات إعادة تشغيل Gateway. بالنسبة إلى العمليات الخلفية المنفردة، تكفي [مهمة](/ar/automation/tasks) عادية.

| السيناريو                            | الاستخدام             |
| ------------------------------------- | -------------------- |
| مهمة خلفية واحدة                      | مهمة عادية           |
| مسار متعدد الخطوات (A ثم B ثم C)      | Task Flow (مُدار)    |
| مراقبة المهام المُنشأة خارجيًا        | Task Flow (معكوس)    |
| تذكير لمرة واحدة                      | مهمة Cron            |

## نمط سير عمل مجدول موثوق

بالنسبة إلى تدفقات العمل المتكررة مثل موجزات معلومات السوق، تعامل مع الجدولة، والتنظيم، وفحوصات الموثوقية كطبقات منفصلة:

1. استخدم [المهام المجدولة](/ar/automation/cron-jobs) للتوقيت.
2. استخدم جلسة cron مستمرة عندما يجب أن يبني سير العمل على سياق سابق.
3. استخدم [Lobster](/ar/tools/lobster) للخطوات الحتمية، وبوابات الموافقة، ورموز الاستئناف.
4. استخدم Task Flow لتتبع التشغيل متعدد الخطوات عبر المهام الفرعية، والانتظارات، وإعادات المحاولة، وعمليات إعادة تشغيل Gateway.

شكل cron نموذجي:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

استخدم `session:<id>` بدلًا من `isolated` عندما يحتاج سير العمل المتكرر إلى سجل مقصود، أو ملخصات تشغيل سابقة، أو سياق قائم. استخدم `isolated` عندما يجب أن يبدأ كل تشغيل من جديد وتكون كل الحالة المطلوبة صريحة في سير العمل.

داخل سير العمل، ضع فحوصات الموثوقية قبل خطوة ملخص LLM:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

فحوصات preflight الموصى بها:

- توفر المتصفح واختيار الملف الشخصي، على سبيل المثال `openclaw` للحالة المُدارة أو `user` عندما تكون جلسة Chrome مُسجلة الدخول مطلوبة. راجع [المتصفح](/ar/tools/browser).
- بيانات اعتماد API والحصة لكل مصدر.
- إمكانية الوصول عبر الشبكة إلى نقاط النهاية المطلوبة.
- تفعيل الأدوات المطلوبة للوكيل، مثل `lobster`، و`browser`، و`llm-task`.
- تكوين وجهة الفشل لـ cron بحيث تكون إخفاقات preflight مرئية. راجع [المهام المجدولة](/ar/automation/cron-jobs#delivery-and-output).

حقول مصدر البيانات الموصى بها لكل عنصر مُجمّع:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

اجعل سير العمل يرفض العناصر القديمة أو يضع علامة عليها قبل التلخيص. يجب أن تتلقى خطوة LLM JSON منظمًا فقط، ويجب أن يُطلب منها الحفاظ على `sourceUrl` و`retrievedAt` و`asOf` في مخرجاتها. استخدم [LLM Task](/ar/tools/llm-task) عندما تحتاج إلى خطوة نموذج مُتحقق منها بالمخطط داخل سير العمل.

بالنسبة إلى تدفقات العمل القابلة لإعادة الاستخدام للفِرق أو المجتمع، حزّم CLI، وملفات `.lobster`، وأي ملاحظات إعداد كـ skill أو plugin وانشرها عبر [ClawHub](/ar/clawhub). أبقِ حواجز الحماية الخاصة بسير العمل داخل تلك الحزمة ما لم تكن واجهة plugin API تفتقد قدرة عامة مطلوبة.

## أوضاع المزامنة

### الوضع المُدار

يمتلك Task Flow دورة الحياة من البداية إلى النهاية. ينشئ المهام كخطوات تدفق، ويدفعها إلى الإكمال، ويُقدّم حالة التدفق تلقائيًا.

مثال: تدفق تقرير أسبوعي يقوم بـ (1) جمع البيانات، و(2) إنشاء التقرير، و(3) تسليمه. ينشئ Task Flow كل خطوة كمهمة خلفية، وينتظر اكتمالها، ثم ينتقل إلى الخطوة التالية.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### الوضع المعكوس

يراقب Task Flow المهام المُنشأة خارجيًا ويحافظ على مزامنة حالة التدفق دون امتلاك إنشاء المهام. يكون ذلك مفيدًا عندما تنشأ المهام من وظائف cron، أو أوامر CLI، أو مصادر أخرى، وتريد عرضًا موحدًا لتقدمها كتدفق.

مثال: ثلاث وظائف cron مستقلة تُشكّل معًا روتين "عمليات الصباح". يتتبع تدفق معكوس تقدمها الجماعي دون التحكم في وقت تشغيلها أو كيفية تشغيلها.

## الحالة المتينة وتتبع المراجعات

يحتفظ كل تدفق بحالته الخاصة ويتتبع المراجعات بحيث ينجو التقدم من عمليات إعادة تشغيل Gateway. يتيح تتبع المراجعات اكتشاف التعارضات عندما تحاول مصادر متعددة تقديم التدفق نفسه في الوقت ذاته.
يستخدم سجل التدفقات SQLite مع صيانة محدودة لسجل الكتابة المسبقة، بما في ذلك
نقاط تحقق دورية وعند إيقاف التشغيل، حتى لا تحتفظ بوابات Gateway طويلة التشغيل
بملفات جانبية غير محدودة من نوع `registry.sqlite-wal`.

## سلوك الإلغاء

يضبط `openclaw tasks flow cancel` نية إلغاء ثابتة على التدفق. تُلغى المهام النشطة داخل التدفق، ولا تبدأ أي خطوات جديدة. تستمر نية الإلغاء عبر عمليات إعادة التشغيل، لذلك يبقى التدفق الملغى ملغى حتى إذا أُعيد تشغيل Gateway قبل انتهاء كل المهام الفرعية.

## أوامر CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| الأمر                             | الوصف                                         |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | يعرض التدفقات المتتبعة مع الحالة ووضع المزامنة |
| `openclaw tasks flow show <id>`   | افحص تدفقًا واحدًا حسب معرف التدفق أو مفتاح البحث |
| `openclaw tasks flow cancel <id>` | ألغِ تدفقًا قيد التشغيل ومهامه النشطة          |

## علاقة التدفقات بالمهام

تنسق التدفقات المهام ولا تستبدلها. قد يقود تدفق واحد عدة مهام خلفية طوال عمره. استخدم `openclaw tasks` لفحص سجلات المهام الفردية، و`openclaw tasks flow` لفحص التدفق المنظم.

## ذات صلة

- [المهام الخلفية](/ar/automation/tasks) — سجل العمل المنفصل الذي تنسقه التدفقات
- [CLI: المهام](/ar/cli/tasks) — مرجع أوامر CLI لـ `openclaw tasks flow`
- [نظرة عامة على الأتمتة](/ar/automation) — جميع آليات الأتمتة بلمحة واحدة
- [وظائف Cron](/ar/automation/cron-jobs) — وظائف مجدولة قد تغذي التدفقات
