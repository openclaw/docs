---
read_when:
    - جدولة مهام الخلفية أو عمليات الإيقاظ
    - ربط المشغّلات الخارجية (Webhook، Gmail) بـ OpenClaw
    - الاختيار بين Heartbeat و Cron للمهام المجدولة
sidebarTitle: Scheduled tasks
summary: المهام المجدولة، وWebhook، ومشغلات Gmail PubSub لمجدول Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-04-30T07:39:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron هو المجدول المدمج في Gateway. يحفظ المهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه توصيل المخرجات مرة أخرى إلى قناة دردشة أو نقطة نهاية webhook.

## البدء السريع

<Steps>
  <Step title="إضافة تذكير لمرة واحدة">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="تحقق من مهامك">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="راجع سجل التشغيل">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## كيف يعمل cron

- يعمل Cron **داخل عملية Gateway** (وليس داخل النموذج).
- تستمر تعريفات المهام في `~/.openclaw/cron/jobs.json` بحيث لا تفقد عمليات إعادة التشغيل الجداول.
- تستمر حالة التنفيذ وقت التشغيل بجانبها في `~/.openclaw/cron/jobs-state.json`. إذا كنت تتعقب تعريفات cron في git، فتتبع `jobs.json` وأضف `jobs-state.json` إلى gitignore.
- بعد الفصل، يمكن لإصدارات OpenClaw الأقدم قراءة `jobs.json` لكنها قد تتعامل مع المهام كأنها جديدة لأن حقول وقت التشغيل أصبحت الآن في `jobs-state.json`.
- عندما يتم تعديل `jobs.json` أثناء تشغيل Gateway أو توقفه، يقارن OpenClaw حقول الجدول التي تغيرت ببيانات وصف خانة وقت التشغيل المعلقة ويمسح قيم `nextRunAtMs` القديمة. أما إعادة الكتابة التي تقتصر على التنسيق أو ترتيب المفاتيح فقط فتحافظ على الخانة المعلقة.
- تنشئ جميع عمليات تنفيذ cron سجلات [مهمة في الخلفية](/ar/automation/tasks).
- عند بدء تشغيل Gateway، تتم إعادة جدولة مهام دورة الوكيل المعزولة المتأخرة خارج نافذة اتصال القناة بدلا من إعادة تشغيلها فورا، بحيث يظل بدء تشغيل Discord/Telegram وإعداد الأوامر الأصلية مستجيبين بعد إعادة التشغيل.
- تُحذف مهام المرة الواحدة (`--at`) تلقائيا بعد النجاح بشكل افتراضي.
- تحاول عمليات cron المعزولة، بأفضل جهد، إغلاق علامات تبويب/عمليات المتصفح المتتبعة لجلسة `cron:<jobId>` الخاصة بها عند اكتمال التشغيل، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- تحمي عمليات cron المعزولة أيضا من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it`، و`pulling everything together`، وتلميحات مشابهة) ولم تعد أي عملية وكيل فرعي تابعة مسؤولة عن الإجابة النهائية، يعيد OpenClaw المطالبة مرة واحدة للحصول على النتيجة الفعلية قبل التسليم.
- تفضل عمليات cron المعزولة بيانات وصف رفض التنفيذ المنظمة من التشغيل المضمن، ثم تعود إلى علامات الملخص/المخرجات النهائية المعروفة مثل `SYSTEM_RUN_DENIED` و`INVALID_REQUEST`، بحيث لا يتم الإبلاغ عن أمر محظور كتشغيل ناجح.
- تتعامل عمليات cron المعزولة أيضا مع إخفاقات الوكيل على مستوى التشغيل كأخطاء في المهمة حتى عند عدم إنتاج حمولة رد، بحيث تزيد إخفاقات النموذج/الموفر عدادات الأخطاء وتطلق إشعارات الفشل بدلا من مسح المهمة باعتبارها ناجحة.
- عندما تصل مهمة دورة وكيل معزولة إلى `timeoutSeconds`، يوقف cron تشغيل الوكيل الأساسي ويمنحه نافذة تنظيف قصيرة. إذا لم يتم تصريف التشغيل، فإن التنظيف المملوك لـ Gateway يمسح قسرا ملكية جلسة ذلك التشغيل قبل أن يسجل cron انتهاء المهلة، بحيث لا يبقى عمل الدردشة في الطابور خلف جلسة معالجة قديمة.

<a id="maintenance"></a>

<Note>
تسوية المهام في cron مملوكة لوقت التشغيل أولا، ومدعومة بالسجل الدائم ثانيا: تظل مهمة cron النشطة حية طالما أن وقت تشغيل cron لا يزال يتتبع تلك المهمة كقيد التشغيل، حتى إذا كان صف جلسة فرعية قديم لا يزال موجودا. بمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنقضي نافذة السماح البالغة 5 دقائق، تفحص الصيانة سجلات التشغيل المحفوظة وحالة المهمة للتشغيل المطابق `cron:<jobId>:<startedAt>`. إذا أظهر ذلك السجل الدائم نتيجة نهائية، يتم إنهاء دفتر المهام منه؛ وإلا يمكن للصيانة المملوكة لـ Gateway تعليم المهمة كـ `lost`. يمكن لتدقيق CLI دون اتصال الاسترداد من السجل الدائم، لكنه لا يتعامل مع مجموعة المهام النشطة داخل العملية الفارغة الخاصة به كدليل على اختفاء تشغيل cron مملوك لـ Gateway.
</Note>

## أنواع الجداول

| النوع   | علم CLI   | الوصف                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لمرة واحدة (ISO 8601 أو نسبي مثل `20m`)      |
| `every` | `--every` | فاصل زمني ثابت                                          |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري       |

تُعامل الطوابع الزمنية دون منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة حسب ساعة الحائط المحلية.

تتم إزاحة تعبيرات أعلى الساعة المتكررة تلقائيا بما يصل إلى 5 دقائق لتقليل طفرات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تُحلل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون كل من حقلي يوم الشهر ويوم الأسبوع غير شاملين، يطابق croner عندما يطابق **أي** من الحقلين، وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

يعمل هذا نحو 5-6 مرات شهريا بدلا من 0-1 مرة شهريا. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لاشتراط كلا الشرطين، استخدم معدل يوم الأسبوع `+` في Croner (`0 9 15 * +1`) أو جدولة على حقل واحد ووضع حارس للحقل الآخر في مطالبة المهمة أو أمرها.

## أنماط التنفيذ

| النمط          | قيمة `--session`    | يعمل في                  | الأفضل لـ                       |
| -------------- | ------------------- | ------------------------ | ------------------------------- |
| الجلسة الرئيسية | `main`              | دورة Heartbeat التالية   | التذكيرات، أحداث النظام         |
| معزول          | `isolated`          | `cron:<jobId>` مخصص      | التقارير، الأعمال الخلفية       |
| الجلسة الحالية | `current`           | مرتبط عند وقت الإنشاء    | العمل المتكرر الواعي بالسياق    |
| جلسة مخصصة     | `session:custom-id` | جلسة مسماة مستمرة        | مسارات العمل التي تبني على السجل |

<AccordionGroup>
  <Accordion title="الجلسة الرئيسية مقابل المعزولة مقابل المخصصة">
    تضيف مهام **الجلسة الرئيسية** حدث نظام إلى الطابور وتوقظ Heartbeat اختياريا (`--wake now` أو `--wake next-heartbeat`). لا تمد أحداث النظام هذه حداثة إعادة الضبط اليومية/الخاملة للجلسة الهدف. تعمل المهام **المعزولة** في دورة وكيل مخصصة مع جلسة جديدة. تستمر **الجلسات المخصصة** (`session:xxx`) بالسياق عبر عمليات التشغيل، ما يتيح مسارات عمل مثل الاجتماعات اليومية التي تبني على الملخصات السابقة.
  </Accordion>
  <Accordion title="ما معنى 'جلسة جديدة' للمهام المعزولة">
    بالنسبة للمهام المعزولة، تعني "جلسة جديدة" معرف نص/جلسة جديدا لكل تشغيل. قد يحمل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السريع/المفصل، والتسميات، وتجاوزات النموذج/المصادقة التي اختارها المستخدم صراحة، لكنه لا يرث سياق المحادثة المحيط من صف cron أقدم: توجيه القناة/المجموعة، سياسة الإرسال أو الطابور، التصعيد، الأصل، أو ربط وقت تشغيل ACP. استخدم `current` أو `session:<id>` عندما ينبغي لمهمة متكررة أن تبني عمدا على سياق المحادثة نفسه.
  </Accordion>
  <Accordion title="تنظيف وقت التشغيل">
    بالنسبة للمهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيف المتصفح بأفضل جهد لجلسة cron تلك. يتم تجاهل إخفاقات التنظيف بحيث تظل نتيجة cron الفعلية هي الحاسمة.

    تتخلص عمليات cron المعزولة أيضا من أي مثيلات وقت تشغيل MCP مدمجة تم إنشاؤها للمهمة عبر مسار تنظيف وقت التشغيل المشترك. يطابق هذا كيفية تفكيك عملاء MCP في الجلسة الرئيسية والجلسة المخصصة، بحيث لا تسرب مهام cron المعزولة عمليات فرعية stdio أو اتصالات MCP طويلة العمر عبر عمليات التشغيل.

  </Accordion>
  <Accordion title="الوكيل الفرعي وتسليم Discord">
    عندما تنسق عمليات cron المعزولة وكلاء فرعيين، يفضل التسليم أيضا المخرج النهائي للتابع على النص المؤقت القديم للأصل. إذا كانت التوابع لا تزال قيد التشغيل، يمنع OpenClaw ذلك التحديث الجزئي من الأصل بدلا من إعلانه.

    بالنسبة لأهداف إعلان Discord النصية فقط، يرسل OpenClaw النص النهائي القياسي للمساعد مرة واحدة بدلا من إعادة تشغيل كل من حمولات النص المتدفقة/الوسيطة والإجابة النهائية. لا تزال حمولات Discord الإعلامية والمنظمة تُسلم كحمولات منفصلة حتى لا تُسقط المرفقات والمكونات.

  </Accordion>
</AccordionGroup>

### خيارات الحمولة للمهام المعزولة

<ParamField path="--message" type="string" required>
  نص المطالبة (مطلوب للمعزولة).
</ParamField>
<ParamField path="--model" type="string">
  تجاوز النموذج؛ يستخدم النموذج المسموح المحدد للمهمة.
</ParamField>
<ParamField path="--thinking" type="string">
  تجاوز مستوى التفكير.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تخطي حقن ملف تمهيد مساحة العمل.
</ParamField>
<ParamField path="--tools" type="string">
  تقييد الأدوات التي يمكن للمهمة استخدامها، على سبيل المثال `--tools exec,read`.
</ParamField>

يستخدم `--model` النموذج المسموح المحدد كنموذج أساسي لتلك المهمة. وهو ليس مثل تجاوز `/model` لجلسة دردشة: لا تزال سلاسل الرجوع الاحتياطي المكونة تنطبق عندما يفشل النموذج الأساسي للمهمة. إذا لم يكن النموذج المطلوب مسموحا به أو لا يمكن حله، يفشل cron التشغيل بخطأ تحقق صريح بدلا من الرجوع بصمت إلى اختيار وكيل/نموذج المهمة الافتراضي.

يمكن لمهام Cron أيضا حمل `fallbacks` على مستوى الحمولة. عند وجودها، تستبدل تلك القائمة سلسلة الرجوع الاحتياطي المكونة للمهمة. استخدم `fallbacks: []` في حمولة/API المهمة عندما تريد تشغيل cron صارما يجرب النموذج المحدد فقط. إذا كانت لدى مهمة `--model` ولكن لا توجد بدائل رجوع احتياطي في الحمولة أو التكوين، يمرر OpenClaw تجاوز رجوع احتياطي فارغا صريحا حتى لا يُضاف نموذج الوكيل الأساسي كهدف إعادة محاولة إضافي مخفي.

أسبقية اختيار النموذج للمهام المعزولة هي:

1. تجاوز نموذج خطاف Gmail (عندما يأتي التشغيل من Gmail ويكون ذلك التجاوز مسموحا)
2. `model` حمولة كل مهمة
3. تجاوز نموذج جلسة cron المخزن الذي اختاره المستخدم
4. اختيار نموذج الوكيل/الافتراضي

يتبع الوضع السريع الاختيار الحي المحلول أيضا. إذا كان تكوين النموذج المحدد يحتوي على `params.fastMode`، يستخدم cron المعزول ذلك افتراضيا. لا يزال تجاوز `fastMode` لجلسة مخزنة ينتصر على التكوين في كلا الاتجاهين.

إذا وصل تشغيل معزول إلى تسليم تبديل نموذج حي، يعيد cron المحاولة بالموفر/النموذج الذي تم التبديل إليه ويحفظ ذلك الاختيار الحي للتشغيل النشط قبل إعادة المحاولة. عندما يحمل التبديل أيضا ملف تعريف مصادقة جديدا، يحفظ cron تجاوز ملف تعريف المصادقة ذلك للتشغيل النشط أيضا. عمليات إعادة المحاولة محدودة: بعد المحاولة الأولية بالإضافة إلى محاولتي إعادة محاولة تبديل، يوقف cron بدلا من الدوران إلى الأبد.

قبل أن يدخل تشغيل cron معزول إلى مشغل الوكيل، يتحقق OpenClaw من نقاط نهاية الموفر المحلي القابلة للوصول للموفرين المكونين `api: "ollama"` و`api: "openai-completions"` الذين تكون `baseUrl` لديهم local loopback أو شبكة خاصة أو `.local`. إذا كانت نقطة النهاية تلك معطلة، يتم تسجيل التشغيل كـ `skipped` مع خطأ موفر/نموذج واضح بدلا من بدء استدعاء نموذج. تُخزن نتيجة نقطة النهاية مؤقتا لمدة 5 دقائق، لذلك تتشارك العديد من المهام المستحقة التي تستخدم خادم Ollama أو vLLM أو SGLang أو LM Studio المحلي المعطل نفسه فحصا صغيرا واحدا بدلا من إنشاء عاصفة طلبات. لا تزيد عمليات تخطي الفحص المسبق للموفر من التراجع بسبب أخطاء التنفيذ؛ فعّل `failureAlert.includeSkipped` عندما تريد إشعارات تخطي متكررة.

## التسليم والمخرجات

| الوضع     | ما يحدث                                                             |
| ---------- | ------------------------------------------------------------------- |
| `announce` | تسليم احتياطي للنص النهائي إلى الهدف إذا لم يرسله الوكيل            |
| `webhook`  | إرسال حمولة حدث الانتهاء عبر POST إلى عنوان URL                    |
| `none`     | لا يوجد تسليم احتياطي من المشغل                                    |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى القناة. لموضوعات منتديات Telegram، استخدم `-1001234567890:topic:123`؛ ويمكن لمستدعي RPC/الإعدادات المباشرين أيضًا تمرير `delivery.threadId` كسلسلة نصية أو رقم. يجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`، `user:<id>`). معرّفات غرف Matrix حساسة لحالة الأحرف؛ استخدم معرّف الغرفة الدقيق أو الصيغة `room:!room:server` من Matrix.

للمهام المعزولة، يكون تسليم الدردشة مشتركًا. إذا كان مسار دردشة متاحًا، يمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. إذا أرسل الوكيل إلى الهدف المكوّن/الحالي، يتخطى OpenClaw إعلان الرجوع الاحتياطي. بخلاف ذلك، تتحكم `announce` و`webhook` و`none` فقط في ما يفعله المشغّل بالرد النهائي بعد دورة الوكيل.

عندما ينشئ وكيل تذكيرًا معزولًا من دردشة نشطة، يخزّن OpenClaw هدف التسليم الحي المحفوظ لمسار إعلان الرجوع الاحتياطي. قد تكون مفاتيح الجلسات الداخلية بأحرف صغيرة؛ ولا تُعاد صياغة أهداف تسليم المزوّد من تلك المفاتيح عندما يكون سياق الدردشة الحالي متاحًا.

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يضبط `cron.failureDestination` افتراضيًا عامًا لإشعارات الفشل.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُضبط أي منهما وكانت المهمة تسلّم بالفعل عبر `announce`، تعود إشعارات الفشل الآن إلى هدف الإعلان الأساسي ذلك.
- لا يكون `delivery.failureDestination` مدعومًا إلا في مهام `sessionTarget="isolated"` إلا إذا كان وضع التسليم الأساسي هو `webhook`.
- يفعّل `failureAlert.includeSkipped: true` سياسة تنبيهات مهمة أو Cron عامة لإرسال تنبيهات متكررة عن التشغيلات المتخطاة. تحتفظ التشغيلات المتخطاة بعدّاد تخطٍ متتالٍ منفصل، لذا لا تؤثر في تراجع أخطاء التنفيذ.

## أمثلة CLI

<Tabs>
  <Tab title="تذكير لمرة واحدة">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="مهمة معزولة متكررة">
    ```bash
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="تجاوز النموذج والتفكير">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
</Tabs>

## Webhook

يمكن لـ Gateway كشف نقاط نهاية HTTP Webhook للمشغلات الخارجية. فعّلها في الإعدادات:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### المصادقة

يجب أن يتضمن كل طلب رمز الخطاف عبر الترويسة:

- `Authorization: Bearer <token>` (موصى به)
- `x-openclaw-token: <token>`

تُرفض رموز سلسلة الاستعلام.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    أدرج حدث نظام في قائمة انتظار الجلسة الرئيسية:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      وصف الحدث.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` أو `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    شغّل دورة وكيل معزولة:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    الحقول: `message` (مطلوب)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="خطافات معيّنة (POST /hooks/<name>)">
    تُحل أسماء الخطافات المخصصة عبر `hooks.mappings` في الإعدادات. يمكن للتعيينات تحويل الحمولات العشوائية إلى إجراءات `wake` أو `agent` باستخدام القوالب أو تحويلات الكود.
  </Accordion>
</AccordionGroup>

<Warning>
أبقِ نقاط نهاية الخطافات خلف local loopback أو tailnet أو وكيل عكسي موثوق.

- استخدم رمز خطاف مخصصًا؛ لا تعد استخدام رموز مصادقة Gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ تُرفض `/`.
- اضبط `hooks.allowedAgentIds` للحد من توجيه `agentId` الصريح.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يختارها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلّف حمولات الخطافات بحدود أمان افتراضيًا.

</Warning>

## تكامل Gmail PubSub

اربط مشغلات صندوق وارد Gmail مع OpenClaw عبر Google PubSub.

<Note>
**المتطلبات المسبقة:** `gcloud` CLI، و`gog` (gogcli)، وتمكين خطافات OpenClaw، وTailscale لنقطة نهاية HTTPS العامة.
</Note>

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعدادات `hooks.gmail`، ويفعّل إعداد Gmail المسبق، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### بدء Gateway التلقائي

عندما يكون `hooks.enabled=true` و`hooks.gmail.account` مضبوطًا، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للانسحاب.

### إعداد يدوي لمرة واحدة

<Steps>
  <Step title="حدد مشروع GCP">
    حدد مشروع GCP الذي يملك عميل OAuth المستخدم بواسطة `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="أنشئ الموضوع وامنح وصول دفع Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="ابدأ المراقبة">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### تجاوز نموذج Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## إدارة المهام

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
ملاحظة تجاوز النموذج:

- يغيّر `openclaw cron add|edit --model ...` النموذج المحدد للمهمة.
- إذا كان النموذج مسموحًا به، يصل ذلك المزوّد/النموذج الدقيق إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا به أو تعذّر حله، يفشل Cron التشغيل مع خطأ تحقق صريح.
- لا تزال سلاسل الرجوع الاحتياطي المكوّنة مطبقة لأن `--model` في Cron هو أساسي للمهمة، وليس تجاوزًا لـ `/model` في الجلسة.
- تستبدل حمولة `fallbacks` الرجوعات الاحتياطية المكوّنة لتلك المهمة؛ ويعطّل `fallbacks: []` الرجوع الاحتياطي ويجعل التشغيل صارمًا.
- لا ينتقل `--model` عادي دون قائمة رجوع احتياطي صريحة أو مكوّنة إلى الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

</Note>

## الإعدادات

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

يحد `maxConcurrentRuns` من إرسال Cron المجدول وتنفيذ دورات الوكيل المعزولة معًا. تستخدم دورات وكيل Cron المعزولة مسار التنفيذ المخصص `cron-nested` في قائمة الانتظار داخليًا، لذا فإن رفع هذه القيمة يتيح لتشغيلات Cron LLM المستقلة التقدم بالتوازي بدلًا من بدء أغلفة Cron الخارجية فقط. لا يوسّع هذا الإعداد مسار `nested` غير الخاص بـ Cron والمشترك.

تُشتق حالة وقت التشغيل الجانبية من `cron.store`: فمخزن `.json` مثل `~/clawd/cron/jobs.json` يستخدم `~/clawd/cron/jobs-state.json`، بينما يضيف مسار مخزن بلا لاحقة `.json` اللاحقة `-state.json`.

إذا عدّلت `jobs.json` يدويًا، فاترك `jobs-state.json` خارج التحكم بالمصدر. يستخدم OpenClaw ذلك الملف الجانبي للخانات المعلقة، والعلامات النشطة، وبيانات آخر تشغيل الوصفية، وهوية الجدول التي تخبر المجدول متى تحتاج مهمة معدّلة خارجيًا إلى `nextRunAtMs` جديد.

تعطيل Cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="سلوك إعادة المحاولة">
    **إعادة محاولة لمرة واحدة**: تُعاد محاولة الأخطاء العابرة (حد المعدل، التحميل الزائد، الشبكة، خطأ الخادم) حتى 3 مرات مع تراجع أسي. تعطّل الأخطاء الدائمة فورًا.

    **إعادة محاولة متكررة**: تراجع أسي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. يُعاد ضبط التراجع بعد التشغيل الناجح التالي.

  </Accordion>
  <Accordion title="الصيانة">
    يشذّب `cron.sessionRetention` (الافتراضي `24h`) إدخالات جلسات التشغيل المعزولة. ويشذّب `cron.runLog.maxBytes` / `cron.runLog.keepLines` ملفات سجل التشغيل تلقائيًا.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

### تسلسل الأوامر

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron لا يعمل">
    - تحقق من `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
    - تأكد أن Gateway يعمل باستمرار.
    - لجداول `cron`، تحقق من المنطقة الزمنية (`--tz`) مقارنة بالمنطقة الزمنية للمضيف.
    - يعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي فُحص باستخدام `openclaw cron run <jobId> --due` وأن موعد المهمة لم يحن بعد.

  </Accordion>
  <Accordion title="عمل Cron لكن لا يوجد تسليم">
    - يعني وضع التسليم `none` أنه لا يُتوقع إرسال رجوع احتياطي من المشغّل. لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message` عندما يكون مسار دردشة متاحًا.
    - يعني هدف التسليم المفقود/غير الصالح (`channel`/`to`) أن الإرسال الصادر تم تخطيه.
    - في Matrix، قد تفشل المهام المنسوخة أو القديمة التي تحتوي على معرّفات غرف `delivery.to` بأحرف صغيرة لأن معرّفات غرف Matrix حساسة لحالة الأحرف. حرّر المهمة إلى القيمة الدقيقة `!room:server` أو `room:!room:server` من Matrix.
    - تعني أخطاء مصادقة القناة (`unauthorized`، `Forbidden`) أن التسليم حُظر بسبب بيانات الاعتماد.
    - إذا أرجع التشغيل المعزول الرمز الصامت فقط (`NO_REPLY` / `no_reply`)، يقمع OpenClaw التسليم الصادر المباشر ويقمع أيضًا مسار ملخص قائمة انتظار الرجوع الاحتياطي، لذلك لا يُنشر أي شيء مرة أخرى إلى الدردشة.
    - إذا كان يجب أن يرسل الوكيل رسالة إلى المستخدم بنفسه، فتحقق أن المهمة لديها مسار قابل للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

  </Accordion>
  <Accordion title="يبدو أن Cron أو Heartbeat يمنع انتقال /new-style">
    - لا تعتمد حداثة إعادة الضبط اليومية والخاملة على `updatedAt`؛ راجع [إدارة الجلسات](/ar/concepts/session#session-lifecycle).
    - قد تحدّث عمليات تنبيه Cron، وتشغيلات Heartbeat، وإشعارات exec، وحفظ سجلات Gateway صف الجلسة لأغراض التوجيه/الحالة، لكنها لا تمدّد `sessionStartedAt` أو `lastInteractionAt`.
    - بالنسبة إلى الصفوف القديمة التي أُنشئت قبل وجود هذه الحقول، يمكن لـ OpenClaw استرداد `sessionStartedAt` من ترويسة جلسة JSONL في سجل النصوص عندما يظل الملف متاحًا. تستخدم صفوف الخمول القديمة التي لا تحتوي على `lastInteractionAt` وقت البدء المسترد هذا كخط أساس للخمول.

  </Accordion>
  <Accordion title="ملاحظات مهمة حول المنطقة الزمنية">
    - يستخدم Cron من دون `--tz` المنطقة الزمنية لمضيف Gateway.
    - تُعامل جداول `at` من دون منطقة زمنية على أنها UTC.
    - يستخدم `activeHours` في Heartbeat حل المنطقة الزمنية المكوّن.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأتمتة والمهام](/ar/automation) — كل آليات الأتمتة في لمحة
- [مهام الخلفية](/ar/automation/tasks) — سجل المهام لتنفيذات Cron
- [Heartbeat](/ar/gateway/heartbeat) — أدوار الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — تكوين المنطقة الزمنية
