---
read_when:
    - جدولة المهام الخلفية أو عمليات الإيقاظ
    - ربط المشغلات الخارجية (Webhook، Gmail) بـ OpenClaw
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Scheduled tasks
summary: الوظائف المجدولة وWebhook ومشغّلات Gmail PubSub لمجدول Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-05-06T17:52:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron هو المجدول المدمج في Gateway. يحتفظ بالمهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه تسليم المخرجات إلى قناة دردشة أو نقطة نهاية Webhook.

## البدء السريع

<Steps>
  <Step title="أضف تذكيراً لمرة واحدة">
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
  <Step title="اطلع على سجل التشغيل">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## كيف يعمل Cron

- يعمل Cron **داخل عملية Gateway** (وليس داخل النموذج).
- تستمر تعريفات المهام في `~/.openclaw/cron/jobs.json` حتى لا تضيع الجداول عند إعادة التشغيل.
- تستمر حالة التنفيذ وقت التشغيل بجانبه في `~/.openclaw/cron/jobs-state.json`. إذا كنت تتتبع تعريفات Cron في git، فتتبع `jobs.json` وأضف `jobs-state.json` إلى gitignore.
- بعد التقسيم، تستطيع إصدارات OpenClaw الأقدم قراءة `jobs.json` لكنها قد تتعامل مع المهام كأنها جديدة لأن حقول وقت التشغيل تعيش الآن في `jobs-state.json`.
- عند تحرير `jobs.json` أثناء تشغيل Gateway أو توقفه، يقارن OpenClaw حقول الجدولة المتغيرة ببيانات تعريف خانة وقت التشغيل المعلقة ويمسح قيم `nextRunAtMs` القديمة. تعيد الكتابة التي تقتصر على التنسيق أو ترتيب المفاتيح فقط الحفاظ على الخانة المعلقة.
- تنشئ كل عمليات تنفيذ Cron سجلات [مهمة خلفية](/ar/automation/tasks).
- عند بدء تشغيل Gateway، يعاد جدولة مهام دور الوكيل المعزولة المتأخرة خارج نافذة اتصال القناة بدلاً من إعادة تشغيلها فوراً، بحيث يبقى بدء تشغيل Discord/Telegram وإعداد الأوامر الأصلية سريع الاستجابة بعد إعادة التشغيل.
- تحذف المهام لمرة واحدة (`--at`) نفسها تلقائياً بعد النجاح افتراضياً.
- تبذل عمليات تشغيل Cron المعزولة أفضل جهد لإغلاق علامات تبويب/عمليات المتصفح المتتبعة لجلسة `cron:<jobId>` الخاصة بها عند اكتمال التشغيل، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- لا تزال عمليات تشغيل Cron المعزولة التي تتلقى منحة التنظيف الذاتي الضيقة الخاصة بـ Cron تستطيع قراءة حالة المجدول وقائمة مرشحة ذاتياً لمهمتها الحالية، بحيث تستطيع فحوصات الحالة/Heartbeat فحص جدولها الخاص من دون الحصول على صلاحية أوسع لتعديل Cron.
- تحمي عمليات تشغيل Cron المعزولة أيضاً من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it`، `pulling everything together`، وتلميحات مشابهة) ولم يعد أي تشغيل وكيل فرعي منحدر مسؤولاً عن الإجابة النهائية، يعيد OpenClaw المطالبة مرة واحدة للحصول على النتيجة الفعلية قبل التسليم.
- تفضل عمليات تشغيل Cron المعزولة بيانات تعريف رفض التنفيذ المهيكلة من التشغيل المدمج، ثم ترجع إلى علامات الملخص/المخرجات النهائية المعروفة مثل `SYSTEM_RUN_DENIED` و`INVALID_REQUEST`، حتى لا يبلغ عن أمر محظور كتشغيل ناجح.
- تتعامل عمليات تشغيل Cron المعزولة أيضاً مع إخفاقات الوكيل على مستوى التشغيل كأخطاء مهمة حتى عندما لا تنتج حمولة رد، بحيث تزيد إخفاقات النموذج/المزوّد عدادات الأخطاء وتطلق إشعارات الفشل بدلاً من مسح المهمة كأنها ناجحة.
- عندما تصل مهمة دور وكيل معزولة إلى `timeoutSeconds`، يوقف Cron تشغيل الوكيل الأساسي ويمنحه نافذة تنظيف قصيرة. إذا لم يفرغ التشغيل، يفرض التنظيف المملوك لـ Gateway مسح ملكية جلسة ذلك التشغيل قبل أن يسجل Cron انتهاء المهلة، حتى لا يترك عمل الدردشة في قائمة الانتظار خلف جلسة معالجة قديمة.

<a id="maintenance"></a>

<Note>
تسوية المهام في Cron مملوكة لوقت التشغيل أولاً، ومدعومة بسجل دائم ثانياً: تبقى مهمة Cron نشطة حية ما دام وقت تشغيل Cron لا يزال يتتبع تلك المهمة كقيد التشغيل، حتى إذا كان صف جلسة فرعية قديم لا يزال موجوداً. بعد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي نافذة السماح البالغة 5 دقائق، تتحقق الصيانة من سجلات التشغيل المستمرة وحالة المهمة لتشغيل `cron:<jobId>:<startedAt>` المطابق. إذا أظهر ذلك السجل الدائم نتيجة نهائية، ينجز سجل المهام منها؛ وإلا يمكن للصيانة المملوكة لـ Gateway وسم المهمة كـ `lost`. يستطيع تدقيق CLI دون اتصال الاسترداد من السجل الدائم، لكنه لا يتعامل مع مجموعة المهام النشطة الفارغة داخل عمليته كدليل على أن تشغيل Cron المملوك لـ Gateway قد اختفى.
</Note>

## أنواع الجدولة

| النوع   | علم CLI   | الوصف                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لمرة واحدة (ISO 8601 أو نسبي مثل `20m`)      |
| `every` | `--every` | فاصل زمني ثابت                                          |
| `cron`  | `--cron`  | تعبير Cron من 5 أو 6 حقول مع `--tz` اختياري             |

تعامل الطوابع الزمنية من دون منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة حسب وقت الساعة المحلي.

تزاح تعبيرات التكرار عند بداية الساعة تلقائياً بما يصل إلى 5 دقائق لتقليل طفرات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### تستخدم حقول يوم الشهر ويوم الأسبوع منطق OR

تحلل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون حقلا يوم الشهر ويوم الأسبوع غير بدل، يطابق croner عندما يطابق **أي** من الحقلين، وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

ينطلق هذا نحو 5-6 مرات شهرياً بدلاً من 0-1 مرة شهرياً. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لاشتراط تحقق الشرطين معاً، استخدم معدّل يوم الأسبوع `+` في Croner (`0 9 15 * +1`) أو جدول على حقل واحد واحم الحقل الآخر في موجّه مهمتك أو أمرها.

## أنماط التنفيذ

| النمط           | قيمة `--session`    | يعمل ضمن                 | الأنسب لـ                         |
| --------------- | ------------------- | ------------------------ | --------------------------------- |
| الجلسة الرئيسية | `main`              | دور Heartbeat التالي     | التذكيرات، أحداث النظام           |
| معزول           | `isolated`          | `cron:<jobId>` مخصص      | التقارير، الأعمال الخلفية         |
| الجلسة الحالية  | `current`           | مرتبطة عند وقت الإنشاء   | العمل المتكرر المدرك للسياق       |
| جلسة مخصصة      | `session:custom-id` | جلسة مسماة مستمرة        | سير العمل الذي يبني على السجل     |

<AccordionGroup>
  <Accordion title="الجلسة الرئيسية مقابل المعزولة مقابل المخصصة">
    تضع مهام **الجلسة الرئيسية** حدث نظام في قائمة الانتظار وتوقظ Heartbeat اختيارياً (`--wake now` أو `--wake next-heartbeat`). لا تمدد أحداث النظام هذه حداثة إعادة الضبط اليومية/عند الخمول للجلسة الهدف. تشغل المهام **المعزولة** دور وكيل مخصصاً بجلسة جديدة. تحافظ **الجلسات المخصصة** (`session:xxx`) على السياق عبر عمليات التشغيل، مما يتيح سير عمل مثل اجتماعات الوقوف اليومية التي تبني على الملخصات السابقة.
  </Accordion>
  <Accordion title="ما معنى 'جلسة جديدة' للمهام المعزولة">
    بالنسبة إلى المهام المعزولة، تعني "الجلسة الجديدة" معرّف نص محادثة/جلسة جديداً لكل تشغيل. قد يحمل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السريع/المفصل، والتسميات، وتجاوزات النموذج/المصادقة الصريحة التي اختارها المستخدم، لكنه لا يرث سياق المحادثة المحيط من صف Cron أقدم: توجيه القناة/المجموعة، سياسة الإرسال أو وضع الانتظار، رفع الصلاحية، الأصل، أو ربط وقت تشغيل ACP. استخدم `current` أو `session:<id>` عندما ينبغي لمهمة متكررة أن تبني عمداً على سياق المحادثة نفسه.
  </Accordion>
  <Accordion title="تنظيف وقت التشغيل">
    بالنسبة إلى المهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيف المتصفح بأفضل جهد لجلسة Cron تلك. يتم تجاهل إخفاقات التنظيف بحيث تبقى نتيجة Cron الفعلية هي الحاسمة.

    تتخلص عمليات تشغيل Cron المعزولة أيضاً من أي مثيلات وقت تشغيل MCP مضمّنة أنشئت للمهمة عبر مسار تنظيف وقت التشغيل المشترك. يطابق هذا كيفية تفكيك عملاء MCP للجلسة الرئيسية والجلسة المخصصة، بحيث لا تسرب مهام Cron المعزولة عمليات stdio فرعية أو اتصالات MCP طويلة العمر عبر عمليات التشغيل.

  </Accordion>
  <Accordion title="تسليم الوكيل الفرعي وDiscord">
    عندما تنسق عمليات تشغيل Cron المعزولة وكلاء فرعيين، يفضل التسليم أيضاً المخرج النهائي المنحدر على نص الوالد المؤقت القديم. إذا كان المنحدرون لا يزالون قيد التشغيل، يكتم OpenClaw تحديث الوالد الجزئي ذلك بدلاً من إعلانه.

    بالنسبة إلى أهداف إعلان Discord النصية فقط، يرسل OpenClaw نص المساعد النهائي المعتمد مرة واحدة بدلاً من إعادة تشغيل كل من حمولات النص المتدفقة/الوسيطة والإجابة النهائية. لا تزال وسائط Discord والحمولات المهيكلة تسلم كحمولات منفصلة حتى لا تسقط المرفقات والمكونات.

  </Accordion>
</AccordionGroup>

### خيارات الحمولة للمهام المعزولة

<ParamField path="--message" type="string" required>
  نص الموجّه (مطلوب للمعزول).
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

يستخدم `--model` النموذج المسموح المحدد كنموذج أساسي لتلك المهمة. وهو ليس مثل تجاوز `/model` لجلسة دردشة: تظل سلاسل الرجوع المهيأة مطبقة عندما يفشل النموذج الأساسي للمهمة. إذا لم يكن النموذج المطلوب مسموحاً أو لا يمكن حله، يفشل Cron التشغيل مع خطأ تحقق صريح بدلاً من الرجوع بصمت إلى اختيار نموذج الوكيل/الافتراضي للمهمة.

يمكن لمهام Cron أيضاً حمل `fallbacks` على مستوى الحمولة. عند وجودها، تستبدل تلك القائمة سلسلة الرجوع المهيأة للمهمة. استخدم `fallbacks: []` في حمولة/API المهمة عندما تريد تشغيل Cron صارماً يحاول النموذج المحدد فقط. إذا كانت لدى مهمة `--model` لكن ليس لديها رجوع في الحمولة ولا في الإعداد، يمرر OpenClaw تجاوز رجوع فارغاً صريحاً حتى لا يضاف النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي مخفي.

أسبقية اختيار النموذج للمهام المعزولة هي:

1. تجاوز نموذج خطاف Gmail (عندما يأتي التشغيل من Gmail ويكون ذلك التجاوز مسموحاً)
2. `model` في حمولة كل مهمة
3. تجاوز نموذج جلسة Cron المخزن الذي اختاره المستخدم
4. اختيار نموذج الوكيل/الافتراضي

يتبع الوضع السريع الاختيار الحي المحلول أيضاً. إذا كان إعداد النموذج المحدد يحتوي على `params.fastMode`، يستخدمه Cron المعزول افتراضياً. يظل تجاوز `fastMode` المخزن للجلسة هو الغالب على الإعداد في أي من الاتجاهين.

إذا وصل تشغيل معزول إلى تسليم تبديل نموذج حي، يعيد Cron المحاولة بالمزوّد/النموذج المحوّل ويحتفظ بذلك الاختيار الحي للتشغيل النشط قبل إعادة المحاولة. عندما يحمل التبديل أيضاً ملف تعريف مصادقة جديداً، يحتفظ Cron بتجاوز ملف تعريف المصادقة ذلك للتشغيل النشط أيضاً. إعادة المحاولات محدودة: بعد المحاولة الأولية إضافة إلى محاولتي تبديل، يوقف Cron بدلاً من الدوران إلى الأبد.

قبل أن يدخل تشغيل Cron معزول إلى مشغل الوكيل، يتحقق OpenClaw من نقاط نهاية المزوّد المحلي القابلة للوصول للمزوّدين المهيأين `api: "ollama"` و`api: "openai-completions"` الذين تكون `baseUrl` لديهم حلقة ارتداد أو شبكة خاصة أو `.local`. إذا كانت نقطة النهاية متوقفة، يسجل التشغيل كـ `skipped` مع خطأ مزوّد/نموذج واضح بدلاً من بدء استدعاء نموذج. تخزن نتيجة نقطة النهاية مؤقتاً لمدة 5 دقائق، بحيث تشارك مهام كثيرة مستحقة تستخدم خادم Ollama أو vLLM أو SGLang أو LM Studio المحلي المتوقف نفسه فحصاً صغيراً واحداً بدلاً من إنشاء عاصفة طلبات. لا تزيد عمليات تشغيل الفحص القبلي للمزوّد التي تم تخطيها تراجع أخطاء التنفيذ؛ فعّل `failureAlert.includeSkipped` عندما تريد إشعارات تخط متكررة.

## التسليم والمخرجات

| الوضع     | ما يحدث                                                            |
| ---------- | ------------------------------------------------------------------- |
| `announce` | يسلم النص النهائي كرجوع إلى الهدف إذا لم يرسله الوكيل              |
| `webhook`  | يرسل حمولة حدث الانتهاء عبر POST إلى URL                           |
| `none`     | لا يوجد تسليم رجوعي من المشغل                                      |

Use `--announce --channel telegram --to "-1001234567890"` للتسليم إلى القناة. بالنسبة إلى موضوعات منتديات Telegram، استخدم `-1001234567890:topic:123`؛ ويمكن لمستدعي RPC/التكوين المباشرين أيضًا تمرير `delivery.threadId` كسلسلة نصية أو رقم. ينبغي أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`، `user:<id>`). معرّفات غرف Matrix حساسة لحالة الأحرف؛ استخدم معرّف الغرفة الدقيق أو صيغة `room:!room:server` من Matrix.

عندما يستخدم تسليم الإعلان `channel: "last"` أو يحذف `channel`، يمكن لهدف ذي بادئة مزوّد مثل `telegram:123` اختيار القناة قبل أن يرجع cron إلى سجل الجلسة أو قناة واحدة مهيأة. وحدها البادئات التي يعلنها Plugin المحمّل تكون محددات مزوّدين. إذا كان `delivery.channel` صريحًا، فيجب أن تسمّي بادئة الهدف المزوّد نفسه؛ على سبيل المثال، يتم رفض `channel: "whatsapp"` مع `to: "telegram:123"` بدل السماح لـ WhatsApp بتفسير معرّف Telegram كرقم هاتف. تبقى بادئات نوع الهدف والخدمة مثل `channel:<id>` و`user:<id>` و`imessage:<handle>` و`sms:<number>` صياغة أهداف مملوكة للقناة، وليست محددات مزوّدين.

بالنسبة إلى المهام المعزولة، يكون تسليم المحادثة مشتركًا. إذا كان مسار محادثة متاحًا، يمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. إذا أرسل الوكيل إلى الهدف المهيأ/الحالي، يتخطى OpenClaw إعلان fallback. وإلا فإن `announce` و`webhook` و`none` تتحكم فقط في ما يفعله المشغّل بالرد النهائي بعد دور الوكيل.

عندما ينشئ وكيل تذكيرًا معزولًا من محادثة نشطة، يخزن OpenClaw هدف التسليم الحي المحفوظ لمسار إعلان fallback. قد تكون مفاتيح الجلسة الداخلية بأحرف صغيرة؛ ولا تتم إعادة بناء أهداف تسليم المزوّدين من تلك المفاتيح عندما يكون سياق المحادثة الحالي متاحًا.

يستخدم تسليم الإعلان الضمني قوائم السماح للقنوات المهيأة للتحقق من الأهداف القديمة وإعادة توجيهها. موافقات مخزن إقران الرسائل المباشرة ليست مستلمي fallback للأتمتة؛ عيّن `delivery.to` أو هيّئ إدخال `allowFrom` للقناة عندما ينبغي لمهمة مجدولة أن ترسل استباقيًا إلى رسالة مباشرة.

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يضبط `cron.failureDestination` افتراضيًا عامًا لإشعارات الفشل.
- يتجاوزه `job.delivery.failureDestination` لكل مهمة.
- إذا لم يتم ضبط أي منهما وكانت المهمة تسلّم بالفعل عبر `announce`، فإن إشعارات الفشل ترجع الآن إلى هدف الإعلان الأساسي ذلك.
- لا يكون `delivery.failureDestination` مدعومًا إلا في مهام `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.
- يختار `failureAlert.includeSkipped: true` إدخال مهمة أو سياسة تنبيه cron عالمية في تنبيهات التشغيلات المتخطاة المتكررة. تحتفظ التشغيلات المتخطاة بعداد تخطيات متتالية منفصل، ولذلك لا تؤثر في تراجع أخطاء التنفيذ.

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

## Webhooks

يمكن لـ Gateway كشف نقاط نهاية Webhook عبر HTTP للمشغلات الخارجية. فعّل ذلك في التكوين:

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

يتم رفض رموز سلسلة الاستعلام.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    أضف حدث نظام إلى قائمة انتظار الجلسة الرئيسية:

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
    شغّل دور وكيل معزول:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    الحقول: `message` (مطلوب)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="الخطافات المعينة (POST /hooks/<name>)">
    يتم حل أسماء الخطافات المخصصة عبر `hooks.mappings` في التكوين. يمكن للتعيينات تحويل أي حمولات إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات برمجية.
  </Accordion>
</AccordionGroup>

<Warning>
أبقِ نقاط نهاية الخطافات خلف loopback أو tailnet أو وكيل عكسي موثوق.

- استخدم رمز خطاف مخصصًا؛ لا تعِد استخدام رموز مصادقة Gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ يتم رفض `/`.
- عيّن `hooks.allowedAgentIds` لتقييد توجيه `agentId` الصريح.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يختارها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فعيّن أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلّف حمولات الخطافات بحدود أمان افتراضيًا.

</Warning>

## تكامل Gmail PubSub

اربط مشغلات صندوق وارد Gmail مع OpenClaw عبر Google PubSub.

<Note>
**المتطلبات الأساسية:** `gcloud` CLI، و`gog` (gogcli)، وتفعيل خطافات OpenClaw، وTailscale لنقطة نهاية HTTPS العامة.
</Note>

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا تكوين `hooks.gmail`، ويفعّل الإعداد المسبق لـ Gmail، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### التشغيل التلقائي لـ Gateway

عندما يكون `hooks.enabled=true` ويكون `hooks.gmail.account` مضبوطًا، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيًا. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء الاشتراك.

### إعداد يدوي لمرة واحدة

<Steps>
  <Step title="اختر مشروع GCP">
    اختر مشروع GCP الذي يملك عميل OAuth المستخدم بواسطة `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="أنشئ الموضوع وامنح Gmail حق وصول الدفع">
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
- إذا كان النموذج مسموحًا، يصل هذا المزوّد/النموذج الدقيق إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا أو تعذر حله، يفشل cron التشغيل مع خطأ تحقق صريح.
- تظل سلاسل fallback المهيأة مطبقة لأن `--model` في cron هو أساسي للمهمة، وليس تجاوزًا لـ `/model` في الجلسة.
- تستبدل حمولة `fallbacks` قيم fallback المهيأة لتلك المهمة؛ ويعطّل `fallbacks: []` fallback ويجعل التشغيل صارمًا.
- لا ينتقل `--model` عادي بلا قائمة fallback صريحة أو مهيأة إلى النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

</Note>

## التكوين

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

يحد `maxConcurrentRuns` من إرسال cron المجدول وتنفيذ أدوار الوكلاء المعزولة معًا. تستخدم أدوار وكلاء cron المعزولة مسار التنفيذ المخصص `cron-nested` في قائمة الانتظار داخليًا، لذا فإن رفع هذه القيمة يسمح لتشغيلات LLM المستقلة في cron بالتقدم بالتوازي بدل بدء مغلفات cron الخارجية فقط. لا يتم توسيع مسار `nested` المشترك غير الخاص بـ cron بواسطة هذا الإعداد.

تُشتق حالة التشغيل الجانبية من `cron.store`: فمخزن `.json` مثل `~/clawd/cron/jobs.json` يستخدم `~/clawd/cron/jobs-state.json`، بينما يضيف مسار مخزن بلا لاحقة `.json` اللاحقة `-state.json`.

إذا حررت `jobs.json` يدويًا، فاترك `jobs-state.json` خارج التحكم بالمصدر. يستخدم OpenClaw هذا الملف الجانبي للفتحات المعلقة، والعلامات النشطة، وبيانات آخر تشغيل الوصفية، وهوية الجدول التي تخبر المجدول متى تحتاج مهمة محررة خارجيًا إلى `nextRunAtMs` جديد.

تعطيل cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="سلوك إعادة المحاولة">
    **إعادة محاولة لمرة واحدة**: تعاد محاولة الأخطاء المؤقتة (حد المعدل، التحميل الزائد، الشبكة، خطأ الخادم) حتى 3 مرات مع تراجع أسي. تؤدي الأخطاء الدائمة إلى التعطيل فورًا.

    **إعادة المحاولة المتكررة**: تراجع أسي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. يعاد ضبط التراجع بعد التشغيل الناجح التالي.

  </Accordion>
  <Accordion title="الصيانة">
    يشذّب `cron.sessionRetention` (الافتراضي `24h`) إدخالات جلسات التشغيل المعزولة. ويشذّب `cron.runLog.maxBytes` / `cron.runLog.keepLines` ملفات سجل التشغيل تلقائيًا.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

### سلّم الأوامر

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
    - تحقق من متغير التكوين `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
    - تأكد من أن Gateway يعمل باستمرار.
    - بالنسبة إلى جداول `cron`، تحقق من المنطقة الزمنية (`--tz`) مقارنة بالمنطقة الزمنية للمضيف.
    - يعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي تم فحصه باستخدام `openclaw cron run <jobId> --due` وأن موعد المهمة لم يحن بعد.

  </Accordion>
  <Accordion title="تم تشغيل Cron لكن لم يحدث أي تسليم">
    - وضع التسليم `none` يعني أنه لا يُتوقع إرسال احتياطي من المُشغِّل. ما زال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message` عند توفر مسار دردشة.
    - هدف التسليم مفقود/غير صالح (`channel`/`to`) يعني أنه تم تخطي الصادر.
    - بالنسبة إلى Matrix، قد تفشل المهام المنسوخة أو القديمة التي تحتوي على معرّفات غرف `delivery.to` بأحرف صغيرة لأن معرّفات غرف Matrix حساسة لحالة الأحرف. حرّر المهمة إلى القيمة الدقيقة `!room:server` أو `room:!room:server` من Matrix.
    - أخطاء مصادقة القناة (`unauthorized`، `Forbidden`) تعني أن التسليم حُظر بسبب بيانات الاعتماد.
    - إذا أعاد التشغيل المعزول الرمز الصامت فقط (`NO_REPLY` / `no_reply`)، فإن OpenClaw يمنع التسليم الصادر المباشر ويمنع أيضًا مسار الملخص الاحتياطي في قائمة الانتظار، لذلك لا يُنشر أي شيء مرة أخرى إلى الدردشة.
    - إذا كان ينبغي للوكيل مراسلة المستخدم بنفسه، فتحقق من أن المهمة تحتوي على مسار قابل للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

  </Accordion>
  <Accordion title="يبدو أن Cron أو heartbeat يمنع تدوير /new-style">
    - لا تستند حداثة إعادة الضبط اليومية وعند الخمول إلى `updatedAt`؛ راجع [إدارة الجلسات](/ar/concepts/session#session-lifecycle).
    - قد تحدّث عمليات إيقاظ Cron، وتشغيلات heartbeat، وإشعارات exec، وأعمال حفظ سجلات Gateway صف الجلسة للتوجيه/الحالة، لكنها لا تمدد `sessionStartedAt` أو `lastInteractionAt`.
    - بالنسبة إلى الصفوف القديمة التي أُنشئت قبل وجود هذه الحقول، يمكن لـ OpenClaw استرداد `sessionStartedAt` من ترويسة جلسة transcript JSONL عندما يظل الملف متاحًا. تستخدم صفوف الخمول القديمة التي لا تحتوي على `lastInteractionAt` وقت البدء المسترد هذا كخط أساس للخمول.

  </Accordion>
  <Accordion title="مآزق المنطقة الزمنية">
    - يستخدم Cron بدون `--tz` المنطقة الزمنية لمضيف Gateway.
    - تُعامل جداول `at` التي لا تحتوي على منطقة زمنية على أنها UTC.
    - يستخدم Heartbeat `activeHours` دقة المنطقة الزمنية المكوّنة.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأتمتة والمهام](/ar/automation) — جميع آليات الأتمتة في لمحة
- [مهام الخلفية](/ar/automation/tasks) — سجل المهام لتنفيذات Cron
- [Heartbeat](/ar/gateway/heartbeat) — دورات الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — تكوين المنطقة الزمنية
