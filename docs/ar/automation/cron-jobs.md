---
read_when:
    - جدولة المهام الخلفية أو عمليات الإيقاظ
    - ربط المشغلات الخارجية (Webhook، Gmail) بـ OpenClaw
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Scheduled tasks
summary: الوظائف المجدولة وعمليات Webhook ومشغلات Gmail PubSub لمجدول Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-05-10T19:21:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron هو المجدول المدمج في Gateway. يحفظ المهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه تسليم المخرجات مرة أخرى إلى قناة دردشة أو نقطة نهاية Webhook.

## البدء السريع

<Steps>
  <Step title="أضف تذكيرا لمرة واحدة">
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
- تستمر تعريفات المهام في `~/.openclaw/cron/jobs.json` بحيث لا تفقد عمليات إعادة التشغيل الجداول الزمنية.
- تستمر حالة التنفيذ وقت التشغيل بجانبه في `~/.openclaw/cron/jobs-state.json`. إذا كنت تتتبع تعريفات Cron في git، فتتبع `jobs.json` وأضف `jobs-state.json` إلى gitignore.
- بعد الفصل، يمكن لإصدارات OpenClaw الأقدم قراءة `jobs.json` لكنها قد تتعامل مع المهام على أنها جديدة لأن حقول وقت التشغيل أصبحت الآن في `jobs-state.json`.
- عندما يتم تحرير `jobs.json` أثناء تشغيل Gateway أو توقفه، يقارن OpenClaw حقول الجدول المتغيرة ببيانات تعريف خانة وقت التشغيل المعلقة ويمسح قيم `nextRunAtMs` القديمة. تحافظ إعادة الكتابة التي تقتصر على التنسيق أو ترتيب المفاتيح فقط على الخانة المعلقة.
- تنشئ كل عمليات تنفيذ Cron سجلات [مهام خلفية](/ar/automation/tasks).
- عند بدء Gateway، يعاد جدولة مهام دورة الوكيل المعزولة المتأخرة إلى خارج نافذة اتصال القناة بدلا من إعادة تشغيلها فورا، بحيث يظل بدء Discord/Telegram وإعداد الأوامر الأصلية مستجيبين بعد عمليات إعادة التشغيل.
- تحذف مهام المرة الواحدة (`--at`) نفسها تلقائيا بعد النجاح بشكل افتراضي.
- تحاول عمليات Cron المعزولة، بأفضل جهد، إغلاق علامات تبويب/عمليات المتصفح المتتبعة لجلسة `cron:<jobId>` الخاصة بها عند اكتمال التشغيل، بحيث لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- لا تزال عمليات Cron المعزولة التي تتلقى منحة التنظيف الذاتي الضيقة الخاصة بـ Cron قادرة على قراءة حالة المجدول، وقائمة مفلترة ذاتيا لمهمتها الحالية، وسجل تشغيل تلك المهمة، بحيث يمكن لفحوصات الحالة/Heartbeat فحص جدولها الخاص من دون الحصول على وصول أوسع لتعديل Cron.
- تحمي عمليات Cron المعزولة أيضا من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it`، `pulling everything together`، وتلميحات مشابهة) ولم تعد أي عملية وكيل فرعي سليلة مسؤولة عن الإجابة النهائية، يعيد OpenClaw المطالبة مرة واحدة للحصول على النتيجة الفعلية قبل التسليم.
- تفضل عمليات Cron المعزولة بيانات تعريف رفض التنفيذ المنظمة من التشغيل المضمن، ثم تعود إلى علامات الملخص/الإخراج النهائية المعروفة مثل `SYSTEM_RUN_DENIED` و`INVALID_REQUEST`، بحيث لا يتم الإبلاغ عن أمر محظور على أنه تشغيل أخضر.
- تتعامل عمليات Cron المعزولة أيضا مع إخفاقات الوكيل على مستوى التشغيل على أنها أخطاء مهمة حتى عندما لا يتم إنتاج حمولة رد، بحيث تزيد إخفاقات النموذج/المزود عدادات الأخطاء وتؤدي إلى إشعارات فشل بدلا من مسح المهمة على أنها ناجحة.
- عندما تصل مهمة دورة وكيل معزولة إلى `timeoutSeconds`، يجهض Cron تشغيل الوكيل الأساسي ويمنحه نافذة تنظيف قصيرة. إذا لم يتم تفريغ التشغيل، فإن التنظيف المملوك لـ Gateway يمسح قسرا ملكية جلسة ذلك التشغيل قبل أن يسجل Cron انتهاء المهلة، بحيث لا يبقى عمل الدردشة المنتظر خلف جلسة معالجة قديمة.
- إذا توقفت دورة وكيل معزولة قبل بدء المشغل أو قبل أول استدعاء للنموذج، يسجل Cron انتهاء مهلة خاصا بالمرحلة مثل `setup timed out before runner start` أو `stalled before first model call (last phase: context-engine)`. تغطي هذه المراقبات المزودين المضمنين والمزودين المدعومين بـ CLI قبل أن تبدأ عملية CLI الخارجية فعليا، وتحد بشكل مستقل عن قيم `timeoutSeconds` الطويلة بحيث تظهر إخفاقات البدء البارد/المصادقة/السياق بسرعة بدلا من انتظار ميزانية المهمة بالكامل.

<a id="maintenance"></a>

<Note>
تسوية المهام لـ Cron مملوكة لوقت التشغيل أولا، ومدعومة بالسجل الدائم ثانيا: تبقى مهمة Cron النشطة حية ما دام وقت تشغيل Cron لا يزال يتتبع تلك المهمة على أنها قيد التشغيل، حتى إذا كان صف جلسة فرعية قديم لا يزال موجودا. بمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي نافذة السماح البالغة 5 دقائق، تفحص الصيانة سجلات التشغيل المحفوظة وحالة المهمة للتشغيل المطابق `cron:<jobId>:<startedAt>`. إذا أظهر ذلك السجل الدائم نتيجة نهائية، يتم إنهاء دفتر المهام منه؛ وإلا يمكن للصيانة المملوكة لـ Gateway وسم المهمة بأنها `lost`. يمكن لتدقيق CLI دون اتصال الاسترداد من السجل الدائم، لكنه لا يتعامل مع مجموعة المهام النشطة الفارغة داخل عمليته الخاصة كدليل على أن تشغيل Cron مملوك لـ Gateway قد اختفى.
</Note>

## أنواع الجداول

| النوع    | علم CLI  | الوصف                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لمرة واحدة (ISO 8601 أو نسبي مثل `20m`)    |
| `every` | `--every` | فاصل زمني ثابت                                          |
| `cron`  | `--cron`  | تعبير Cron من 5 حقول أو 6 حقول مع `--tz` اختياري |

تعامل الطوابع الزمنية من دون منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة حسب ساعة الحائط المحلية.

تتم إزاحة تعبيرات بداية الساعة المتكررة تلقائيا بما يصل إلى 5 دقائق لتقليل ارتفاعات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

يتم تحليل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون حقلا يوم الشهر ويوم الأسبوع كلاهما غير شاملين، يطابق croner عندما يطابق **أي** من الحقلين، وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

يتم تشغيل هذا نحو 5 إلى 6 مرات شهريا بدلا من 0 إلى 1 مرة شهريا. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لاشتراط كلا الشرطين، استخدم معدّل يوم الأسبوع `+` في Croner (`0 9 15 * +1`) أو جدوِل على حقل واحد واحرس الحقل الآخر في مطالبة مهمتك أو أمرها.

## أنماط التنفيذ

| النمط           | قيمة `--session`   | يعمل في                  | الأنسب لـ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| الجلسة الرئيسية    | `main`              | دورة Heartbeat التالية      | التذكيرات، أحداث النظام        |
| معزول        | `isolated`          | `cron:<jobId>` مخصص | التقارير، الأعمال الخلفية      |
| الجلسة الحالية | `current`           | مربوط وقت الإنشاء   | العمل المتكرر الواعي بالسياق    |
| جلسة مخصصة  | `session:custom-id` | جلسة مسماة مستمرة | مهام سير العمل التي تبني على السجل |

<AccordionGroup>
  <Accordion title="الجلسة الرئيسية مقابل المعزولة مقابل المخصصة">
    تقوم مهام **الجلسة الرئيسية** بوضع حدث نظام في قائمة الانتظار وإيقاظ Heartbeat اختياريا (`--wake now` أو `--wake next-heartbeat`). لا تمدد أحداث النظام هذه حداثة إعادة الضبط اليومية/الخاملة للجلسة المستهدفة. تعمل المهام **المعزولة** في دورة وكيل مخصصة مع جلسة جديدة. تحتفظ **الجلسات المخصصة** (`session:xxx`) بالسياق عبر عمليات التشغيل، مما يتيح مهام سير عمل مثل الاجتماعات اليومية التي تبني على الملخصات السابقة.
  </Accordion>
  <Accordion title="ما معنى 'جلسة جديدة' للمهام المعزولة">
    بالنسبة للمهام المعزولة، تعني "جلسة جديدة" معرف نص/جلسة جديدا لكل تشغيل. قد يحمل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السريع/المفصل، والتسميات، وتجاوزات النموذج/المصادقة المحددة صراحة من المستخدم، لكنه لا يرث سياق المحادثة المحيط من صف Cron أقدم: توجيه القناة/المجموعة، سياسة الإرسال أو الطابور، الرفع، الأصل، أو ربط وقت تشغيل ACP. استخدم `current` أو `session:<id>` عندما ينبغي لمهمة متكررة أن تبني عمدا على سياق المحادثة نفسه.
  </Accordion>
  <Accordion title="تنظيف وقت التشغيل">
    بالنسبة للمهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيف المتصفح بأفضل جهد لجلسة Cron تلك. يتم تجاهل إخفاقات التنظيف بحيث تظل نتيجة Cron الفعلية هي الحاسمة.

    تتخلص عمليات Cron المعزولة أيضا من أي مثيلات وقت تشغيل MCP مضمّنة تم إنشاؤها للمهمة عبر مسار تنظيف وقت التشغيل المشترك. يطابق هذا طريقة تفكيك عملاء MCP للجلسة الرئيسية والجلسة المخصصة، لذلك لا تسرب مهام Cron المعزولة عمليات فرعية stdio أو اتصالات MCP طويلة العمر عبر عمليات التشغيل.

  </Accordion>
  <Accordion title="تسليم الوكيل الفرعي وDiscord">
    عندما تنسق عمليات Cron المعزولة وكلاء فرعيين، يفضل التسليم أيضا المخرجات النهائية للسليل على نص الوالد المؤقت القديم. إذا كانت السلالات لا تزال تعمل، يخفي OpenClaw ذلك التحديث الجزئي من الوالد بدلا من إعلانه.

    بالنسبة لأهداف إعلان Discord النصية فقط، يرسل OpenClaw النص النهائي القانوني للمساعد مرة واحدة بدلا من إعادة تشغيل كل من حمولات النص المتدفقة/المتوسطة والإجابة النهائية. لا تزال حمولات Discord الوسائطية والمنظمة تسلم كحمولات منفصلة بحيث لا يتم إسقاط المرفقات والمكونات.

  </Accordion>
</AccordionGroup>

### خيارات الحمولة للمهام المعزولة

<ParamField path="--message" type="string" required>
  نص المطالبة (مطلوب للمعزول).
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

يستخدم `--model` النموذج المسموح المحدد كنموذج أساسي لتلك المهمة. وهو ليس مثل تجاوز `/model` لجلسة دردشة: لا تزال سلاسل الرجوع المكوّنة تنطبق عندما يفشل نموذج المهمة الأساسي. إذا لم يكن النموذج المطلوب مسموحا به أو تعذر حله، يفشل Cron التشغيل بخطأ تحقق صريح بدلا من الرجوع بصمت إلى اختيار نموذج وكيل/افتراضي للمهمة.

يمكن لمهام Cron أيضا حمل `fallbacks` على مستوى الحمولة. عند وجودها، تستبدل تلك القائمة سلسلة الرجوع المكوّنة للمهمة. استخدم `fallbacks: []` في حمولة/واجهة برمجة تطبيقات المهمة عندما تريد تشغيل Cron صارما يحاول النموذج المحدد فقط. إذا كانت للمهمة `--model` لكن لا توجد رجوعات في الحمولة ولا مكوّنة، يمرر OpenClaw تجاوز رجوع فارغا صريحا بحيث لا يتم إلحاق النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي مخفي.

أسبقية اختيار النموذج للمهام المعزولة هي:

1. تجاوز نموذج خطاف Gmail (عندما يأتي التشغيل من Gmail ويكون ذلك التجاوز مسموحا)
2. `model` في حمولة كل مهمة
3. تجاوز نموذج جلسة Cron المخزن المحدد من المستخدم
4. اختيار النموذج الوكيل/الافتراضي

يتبع الوضع السريع الاختيار الحي المحلول أيضا. إذا كان تكوين النموذج المحدد يحتوي على `params.fastMode`، يستخدم Cron المعزول ذلك افتراضيا. لا يزال تجاوز `fastMode` المخزن للجلسة ينتصر على التكوين في أي اتجاه.

إذا اصطدم تشغيل معزول بتسليم تبديل نموذج حي، يعيد Cron المحاولة باستخدام المزود/النموذج المحوّل ويحفظ ذلك الاختيار الحي للتشغيل النشط قبل إعادة المحاولة. عندما يحمل التبديل أيضا ملف تعريف مصادقة جديدا، يحفظ Cron تجاوز ملف تعريف المصادقة ذلك للتشغيل النشط أيضا. إعادة المحاولات محدودة: بعد المحاولة الأولية بالإضافة إلى محاولتي تبديل، يجهض Cron بدلا من الدوران إلى الأبد.

قبل أن يدخل تشغيل Cron معزول إلى مشغّل الوكيل، يتحقق OpenClaw من نقاط نهاية المزوّد المحلي القابلة للوصول للمزوّدين المضبوطين `api: "ollama"` و`api: "openai-completions"` الذين يكون `baseUrl` لديهم هو local loopback أو شبكة خاصة أو `.local`. إذا كانت نقطة النهاية تلك متوقفة، يُسجَّل التشغيل بالحالة `skipped` مع خطأ واضح للمزوّد/النموذج بدلًا من بدء استدعاء نموذج. تُخزَّن نتيجة نقطة النهاية مؤقتًا لمدة 5 دقائق، لذلك تشترك مهام كثيرة مستحقة تستخدم الخادم المحلي نفسه المتوقف، مثل Ollama أو vLLM أو SGLang أو LM Studio، في فحص صغير واحد بدل إنشاء عاصفة طلبات. عمليات تشغيل فحص المزوّد المسبق المتجاوزة لا تزيد تراجع أخطاء التنفيذ؛ فعّل `failureAlert.includeSkipped` عندما تريد إشعارات تجاوز متكررة.

## التسليم والمخرجات

| الوضع      | ما يحدث                                                             |
| ---------- | ------------------------------------------------------------------- |
| `announce` | يسلّم النص النهائي احتياطيًا إلى الهدف إذا لم يرسله الوكيل          |
| `webhook`  | يرسل حمولة حدث الانتهاء عبر POST إلى عنوان URL                      |
| `none`     | لا يوجد تسليم احتياطي من المشغّل                                    |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى قناة. لمواضيع منتديات Telegram، استخدم `-1001234567890:topic:123`؛ يمكن لمستدعي RPC/الإعدادات المباشرين أيضًا تمرير `delivery.threadId` كسلسلة أو رقم. يجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`، `user:<id>`). معرّفات غرف Matrix حساسة لحالة الأحرف؛ استخدم معرّف الغرفة الدقيق أو صيغة `room:!room:server` من Matrix.

عندما يستخدم تسليم الإعلان `channel: "last"` أو يحذف `channel`، يمكن لهدف ذي بادئة مزوّد مثل `telegram:123` أن يحدد القناة قبل أن يتراجع Cron إلى سجل الجلسة أو قناة واحدة مضبوطة. وحدها البادئات التي يعلن عنها Plugin المحمّل تكون محددات مزوّد. إذا كان `delivery.channel` صريحًا، فيجب أن تسمي بادئة الهدف المزوّد نفسه؛ على سبيل المثال، يُرفض `channel: "whatsapp"` مع `to: "telegram:123"` بدل السماح لـ WhatsApp بتفسير معرّف Telegram كرقم هاتف. تبقى بادئات نوع الهدف والخدمة مثل `channel:<id>` و`user:<id>` و`imessage:<handle>` و`sms:<number>` صياغة أهداف مملوكة للقناة، لا محددات مزوّد.

بالنسبة إلى المهام المعزولة، يكون تسليم الدردشة مشتركًا. إذا كان مسار دردشة متاحًا، يستطيع الوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. إذا أرسل الوكيل إلى الهدف المضبوط/الحالي، يتجاوز OpenClaw الإعلان الاحتياطي. بخلاف ذلك، تتحكم `announce` و`webhook` و`none` فقط فيما يفعله المشغّل بالرد النهائي بعد دورة الوكيل.

عندما ينشئ وكيل تذكيرًا معزولًا من دردشة نشطة، يخزّن OpenClaw هدف التسليم الحي المحفوظ لمسار الإعلان الاحتياطي. قد تكون مفاتيح الجلسة الداخلية بأحرف صغيرة؛ ولا تُعاد إعادة بناء أهداف تسليم المزوّد من تلك المفاتيح عندما يتوفر سياق الدردشة الحالي.

يستخدم تسليم الإعلان الضمني قوائم السماح المضبوطة للقنوات للتحقق من الأهداف القديمة وإعادة توجيهها. موافقات مخزن اقتران الرسائل المباشرة ليست مستلمين للأتمتة الاحتياطية؛ اضبط `delivery.to` أو اضبط إدخال `allowFrom` للقناة عندما يجب أن ترسل مهمة مجدولة إلى رسالة مباشرة بشكل استباقي.

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يضبط `cron.failureDestination` قيمة افتراضية عامة لإشعارات الفشل.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُضبط أي منهما وكانت المهمة تسلّم بالفعل عبر `announce`، فستتراجع إشعارات الفشل الآن إلى هدف الإعلان الأساسي ذلك.
- `delivery.failureDestination` مدعوم فقط في مهام `sessionTarget="isolated"` إلا إذا كان وضع التسليم الأساسي هو `webhook`.
- يختار `failureAlert.includeSkipped: true` سياسة تنبيه Cron لمهمة أو السياسة العامة في تنبيهات تشغيل متجاوزة متكررة. تحتفظ عمليات التشغيل المتجاوزة بعدّاد تجاوزات متتالية منفصل، لذلك لا تؤثر في تراجع أخطاء التنفيذ.

## أمثلة CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  <Tab title="Model and thinking override">
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

يمكن لـ Gateway كشف نقاط نهاية HTTP Webhook للمشغلات الخارجية. فعّل ذلك في الإعدادات:

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
    شغّل دورة وكيل معزولة:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    الحقول: `message` (مطلوب)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    تُحل أسماء الخطافات المخصصة عبر `hooks.mappings` في الإعدادات. يمكن للتعيينات تحويل الحمولات العشوائية إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات كود.
  </Accordion>
</AccordionGroup>

<Warning>
أبقِ نقاط نهاية الخطافات خلف loopback أو tailnet أو وكيل عكسي موثوق.

- استخدم رمز خطاف مخصصًا؛ لا تعد استخدام رموز مصادقة Gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ يُرفض `/`.
- اضبط `hooks.allowedAgentIds` للحد من توجيه `agentId` الصريح.
- أبقِ `hooks.allowRequestSessionKey=false` إلا إذا كنت تحتاج إلى جلسات يختارها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسة المسموح بها.
- تُغلَّف حمولات الخطافات بحدود أمان افتراضيًا.

</Warning>

## تكامل Gmail PubSub

اربط مشغلات صندوق وارد Gmail بـ OpenClaw عبر Google PubSub.

<Note>
**المتطلبات المسبقة:** `gcloud` CLI، و`gog` (gogcli)، وخطافات OpenClaw مفعّلة، وTailscale لنقطة نهاية HTTPS العامة.
</Note>

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعدادات `hooks.gmail`، ويفعّل إعداد Gmail المسبق، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### بدء Gateway تلقائيًا

عندما تكون `hooks.enabled=true` ويكون `hooks.gmail.account` مضبوطًا، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء الاشتراك.

### إعداد يدوي لمرة واحدة

<Steps>
  <Step title="Select the GCP project">
    حدد مشروع GCP الذي يملك عميل OAuth المستخدم بواسطة `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
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
- إذا كان النموذج مسموحًا، يصل ذلك المزوّد/النموذج الدقيق إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا أو تعذر حله، يفشل Cron التشغيل مع خطأ تحقق صريح.
- تظل سلاسل الاحتياط المضبوطة مطبقة لأن `--model` في Cron هو أساسي للمهمة، وليس تجاوز `/model` للجلسة.
- تستبدل حمولة `fallbacks` الاحتياطات المضبوطة لتلك المهمة؛ ويعطّل `fallbacks: []` الاحتياط ويجعل التشغيل صارمًا.
- لا يسقط `--model` العادي بلا قائمة احتياط صريحة أو مضبوطة إلى النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

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

يحد `maxConcurrentRuns` كلًا من إرسال Cron المجدول وتنفيذ دورة الوكيل المعزولة. تستخدم دورات وكلاء Cron المعزولة داخليًا مسار تنفيذ `cron-nested` المخصص لقائمة الانتظار، لذلك يتيح رفع هذه القيمة لعمليات تشغيل Cron LLM المستقلة التقدم بالتوازي بدلًا من بدء أغلفة Cron الخارجية فقط. لا يوسّع هذا الإعداد مسار `nested` غير الخاص بـ Cron والمشترك.

تُشتق الحالة التشغيلية الجانبية من `cron.store`: يستخدم مخزن `.json` مثل `~/clawd/cron/jobs.json` المسار `~/clawd/cron/jobs-state.json`، بينما يضيف مسار المخزن الذي لا يملك لاحقة `.json` اللاحقة `-state.json`.

إذا عدّلت `jobs.json` يدويًا، فاترك `jobs-state.json` خارج التحكم بالمصدر. يستخدم OpenClaw ذلك الملف الجانبي للفتحات المعلّقة، وعلامات النشاط، وبيانات آخر تشغيل الوصفية، وهوية الجدول التي تخبر المجدول متى تحتاج مهمة عُدّلت خارجيًا إلى `nextRunAtMs` جديد.

تعطيل Cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **إعادة محاولة لمرة واحدة**: تُعاد محاولة الأخطاء العابرة (حد المعدل، الحمل الزائد، الشبكة، خطأ الخادم) حتى 3 مرات مع تراجع أسي. الأخطاء الدائمة تُعطّل فورًا.

    **إعادة محاولة متكررة**: تراجع أسي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. يُعاد ضبط التراجع بعد التشغيل الناجح التالي.

  </Accordion>
  <Accordion title="Maintenance">
    يزيل `cron.sessionRetention` (الافتراضي `24h`) إدخالات جلسات التشغيل المعزولة. يزيل `cron.runLog.maxBytes` / `cron.runLog.keepLines` ملفات سجل التشغيل تلقائيًا.
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
  <Accordion title="تعذّر تشغيل Cron">
    - تحقّق من `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
    - تأكّد من أن Gateway يعمل باستمرار.
    - بالنسبة إلى جداول `cron`، تحقّق من المنطقة الزمنية (`--tz`) مقابل المنطقة الزمنية للمضيف.
    - يعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي فُحص باستخدام `openclaw cron run <jobId> --due` وأن المهمة لم يحن موعدها بعد.

  </Accordion>
  <Accordion title="تم تشغيل Cron لكن بلا تسليم">
    - يعني وضع التسليم `none` أنه لا يُتوقع إرسال احتياطي من المُشغِّل. لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message` عندما يكون مسار دردشة متاحًا.
    - يعني هدف التسليم المفقود/غير الصالح (`channel`/`to`) أن الصادر تم تخطيه.
    - بالنسبة إلى Matrix، قد تفشل المهام المنسوخة أو القديمة التي تحتوي على معرّفات غرف `delivery.to` بأحرف صغيرة لأن معرّفات غرف Matrix حساسة لحالة الأحرف. عدّل المهمة إلى القيمة الدقيقة `!room:server` أو `room:!room:server` من Matrix.
    - تعني أخطاء مصادقة القناة (`unauthorized`، `Forbidden`) أن التسليم حُظر بسبب بيانات الاعتماد.
    - إذا أعاد التشغيل المعزول الرمز الصامت فقط (`NO_REPLY` / `no_reply`)، فإن OpenClaw يمنع التسليم الصادر المباشر ويمنع أيضًا مسار الملخص الاحتياطي في قائمة الانتظار، لذلك لا يُنشر أي شيء إلى الدردشة.
    - إذا كان ينبغي للوكيل أن يراسل المستخدم بنفسه، فتحقّق من أن المهمة لديها مسار قابل للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

  </Accordion>
  <Accordion title="يبدو أن Cron أو Heartbeat يمنع انتقال /new-style">
    - لا تستند حداثة إعادة التعيين اليومية وعند الخمول إلى `updatedAt`؛ راجع [إدارة الجلسات](/ar/concepts/session#session-lifecycle).
    - قد تحدّث تنبيهات Cron، وتشغيلات Heartbeat، وإشعارات exec، وعمليات ضبط Gateway صف الجلسة لأغراض التوجيه/الحالة، لكنها لا تمدّد `sessionStartedAt` أو `lastInteractionAt`.
    - بالنسبة إلى الصفوف القديمة التي أُنشئت قبل وجود هذه الحقول، يمكن لـ OpenClaw استرداد `sessionStartedAt` من ترويسة جلسة transcript بصيغة JSONL عندما يكون الملف لا يزال متاحًا. تستخدم صفوف الخمول القديمة التي لا تحتوي على `lastInteractionAt` وقت البدء المسترد هذا كأساس للخمول.

  </Accordion>
  <Accordion title="ملاحظات مهمة حول المناطق الزمنية">
    - يستخدم Cron من دون `--tz` المنطقة الزمنية لمضيف Gateway.
    - تُعامل جداول `at` من دون منطقة زمنية على أنها UTC.
    - يستخدم Heartbeat `activeHours` دقة المنطقة الزمنية المكوّنة.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأتمتة والمهام](/ar/automation) — جميع آليات الأتمتة في لمحة
- [مهام الخلفية](/ar/automation/tasks) — سجل المهام لتنفيذات cron
- [Heartbeat](/ar/gateway/heartbeat) — أدوار دورية في الجلسة الرئيسية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعدادات المنطقة الزمنية
