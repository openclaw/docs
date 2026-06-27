---
read_when:
    - تريد أن تفهم كيف يرتبط Task Flow بالمهام الخلفية
    - تصادف TaskFlow أو تدفق مهام openclaw في ملاحظات الإصدار أو الوثائق
    - تريد فحص حالة التدفق الدائمة أو إدارتها
summary: طبقة تنسيق تدفق المهام فوق مهام الخلفية
title: تدفق المهام
x-i18n:
    generated_at: "2026-06-27T17:09:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

TaskFlow هي طبقة تنسيق التدفقات التي تقع فوق [المهام الخلفية](/ar/automation/tasks). تدير تدفقات متينة متعددة الخطوات لها حالتها الخاصة وتتبع المراجعات ودلالات المزامنة، بينما تظل المهام الفردية وحدة العمل المنفصل.

## متى تستخدم TaskFlow

استخدم TaskFlow عندما يمتد العمل عبر خطوات متعددة متتابعة أو متفرعة وتحتاج إلى تتبع دائم للتقدم عبر عمليات إعادة تشغيل Gateway. بالنسبة للعمليات الخلفية المنفردة، تكفي [مهمة](/ar/automation/tasks) عادية.

| السيناريو                            | الاستخدام              |
| ------------------------------------- | -------------------- |
| مهمة خلفية واحدة                     | مهمة عادية           |
| خط أنابيب متعدد الخطوات (A ثم B ثم C) | TaskFlow (مدار)  |
| مراقبة المهام المنشأة خارجيًا      | TaskFlow (معكوس) |
| تذكير لمرة واحدة                    | مهمة Cron             |

## نمط سير عمل مجدول موثوق

بالنسبة لسير العمل المتكرر مثل موجزات معلومات السوق، تعامل مع الجدولة والتنسيق وفحوصات الموثوقية كطبقات منفصلة:

1. استخدم [المهام المجدولة](/ar/automation/cron-jobs) للتوقيت.
2. استخدم جلسة cron دائمة عندما يجب أن يبني سير العمل على سياق سابق.
3. استخدم [Lobster](/ar/tools/lobster) للخطوات الحتمية وبوابات الموافقة ورموز الاستئناف.
4. استخدم TaskFlow لتتبع التشغيل متعدد الخطوات عبر المهام الفرعية والانتظارات وإعادة المحاولة وعمليات إعادة تشغيل Gateway.

مثال على شكل cron:

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

استخدم `session:<id>` بدلًا من `isolated` عندما يحتاج سير العمل المتكرر إلى سجل متعمد أو ملخصات تشغيل سابقة أو سياق ثابت. استخدم `isolated` عندما يجب أن يبدأ كل تشغيل من جديد وتكون كل الحالة المطلوبة صريحة في سير العمل.

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

فحوصات ما قبل التشغيل الموصى بها:

- توفر المتصفح واختيار الملف الشخصي، مثل `openclaw` للحالة المُدارة أو `user` عندما تكون جلسة Chrome مسجلة الدخول مطلوبة. راجع [المتصفح](/ar/tools/browser).
- بيانات اعتماد API والحصة لكل مصدر.
- إمكانية الوصول عبر الشبكة إلى نقاط النهاية المطلوبة.
- الأدوات المطلوبة مفعلة للوكيل، مثل `lobster` و`browser` و`llm-task`.
- وجهة الفشل مهيأة لـ cron حتى تكون حالات فشل ما قبل التشغيل مرئية. راجع [المهام المجدولة](/ar/automation/cron-jobs#delivery-and-output).

حقول مصدر البيانات الموصى بها لكل عنصر مجمع:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

اجعل سير العمل يرفض العناصر القديمة أو يميزها قبل التلخيص. يجب أن تتلقى خطوة LLM بيانات JSON منظمة فقط، ويجب أن يُطلب منها الحفاظ على `sourceUrl` و`retrievedAt` و`asOf` في مخرجاتها. استخدم [مهمة LLM](/ar/tools/llm-task) عندما تحتاج إلى خطوة نموذج موثقة بالمخطط داخل سير العمل.

بالنسبة لسير العمل القابل لإعادة الاستخدام للفريق أو المجتمع، حزّم CLI وملفات `.lobster` وأي ملاحظات إعداد كمهارة أو plugin وانشره عبر [ClawHub](/ar/clawhub). أبقِ حواجز الحماية الخاصة بسير العمل في تلك الحزمة إلا إذا كانت واجهة API الخاصة بـ plugin تفتقد قدرة عامة مطلوبة.

## أوضاع المزامنة

### الوضع المُدار

يمتلك TaskFlow دورة الحياة من البداية إلى النهاية. ينشئ المهام كخطوات تدفق، ويدفعها إلى الإكمال، ويتقدم بحالة التدفق تلقائيًا.

مثال: تدفق تقرير أسبوعي (1) يجمع البيانات، و(2) ينشئ التقرير، و(3) يوصله. ينشئ TaskFlow كل خطوة كمهمة خلفية، وينتظر الإكمال، ثم ينتقل إلى الخطوة التالية.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### الوضع المعكوس

يراقب TaskFlow المهام المنشأة خارجيًا ويحافظ على تزامن حالة التدفق دون امتلاك إنشاء المهام. يكون هذا مفيدًا عندما تنشأ المهام من مهام cron أو أوامر CLI أو مصادر أخرى وتريد عرضًا موحدًا لتقدمها كتدفق.

مثال: ثلاث مهام cron مستقلة تشكل معًا روتين "عمليات الصباح". يتتبع تدفق معكوس تقدمها الجماعي دون التحكم في وقت أو كيفية تشغيلها.

## الحالة الدائمة وتتبع المراجعات

يستمر كل تدفق في حالته الخاصة ويتتبع المراجعات حتى يصمد التقدم أمام عمليات إعادة تشغيل Gateway. يتيح تتبع المراجعات اكتشاف التعارض عندما تحاول مصادر متعددة تقديم التدفق نفسه بالتزامن.
يستخدم سجل التدفقات SQLite مع صيانة محدودة لسجل الكتابة المسبقة، بما في ذلك
نقاط تحقق دورية وعند إيقاف التشغيل، بحيث لا تحتفظ بوابات Gateway طويلة التشغيل
بملفات جانبية غير محدودة باسم `registry.sqlite-wal`.

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

| الأمر                           | الوصف                                   |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | يعرض التدفقات المتتبعة مع الحالة ووضع المزامنة |
| `openclaw tasks flow show <id>`   | افحص تدفقًا واحدًا بواسطة معرف التدفق أو مفتاح البحث     |
| `openclaw tasks flow cancel <id>` | ألغِ تدفقًا قيد التشغيل ومهامه النشطة    |

## كيف ترتبط التدفقات بالمهام

تنسق التدفقات المهام ولا تستبدلها. قد يقود تدفق واحد عدة مهام خلفية خلال عمره. استخدم `openclaw tasks` لفحص سجلات المهام الفردية و`openclaw tasks flow` لفحص التدفق المنسق.

## ذو صلة

- [المهام الخلفية](/ar/automation/tasks) — سجل العمل المنفصل الذي تنسقه التدفقات
- [CLI: المهام](/ar/cli/tasks) — مرجع أوامر CLI لـ `openclaw tasks flow`
- [نظرة عامة على الأتمتة](/ar/automation) — جميع آليات الأتمتة في لمحة
- [مهام Cron](/ar/automation/cron-jobs) — المهام المجدولة التي قد تغذي التدفقات
