---
read_when:
    - جدولة المهام الخلفية أو عمليات الإيقاظ
    - ربط المشغّلات الخارجية (Webhook، Gmail) بـ OpenClaw
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Scheduled tasks
summary: مهام مجدولة، وعمليات Webhook، ومشغلات Gmail PubSub لمجدول Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-05-07T13:13:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron هو المجدول المدمج في Gateway. يحتفظ بالمهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه تسليم الناتج مرة أخرى إلى قناة دردشة أو نقطة نهاية Webhook.

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
  <Step title="التحقق من مهامك">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="عرض سجل التشغيل">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## كيف يعمل cron

- يعمل Cron **داخل عملية Gateway** (وليس داخل النموذج).
- تستمر تعريفات المهام في `~/.openclaw/cron/jobs.json` حتى لا تفقد عمليات إعادة التشغيل الجداول.
- تستمر حالة تنفيذ وقت التشغيل بجانبه في `~/.openclaw/cron/jobs-state.json`. إذا كنت تتتبع تعريفات cron في git، فتتبع `jobs.json` وأضف `jobs-state.json` إلى gitignore.
- بعد الفصل، يمكن لإصدارات OpenClaw الأقدم قراءة `jobs.json` لكنها قد تتعامل مع المهام كأنها جديدة لأن حقول وقت التشغيل أصبحت الآن في `jobs-state.json`.
- عندما يتم تحرير `jobs.json` أثناء تشغيل Gateway أو توقفه، يقارن OpenClaw حقول الجدول المتغيرة مع بيانات تعريف خانة وقت التشغيل المعلقة ويمسح قيم `nextRunAtMs` القديمة. تحافظ عمليات إعادة الكتابة التي تغير التنسيق فقط أو ترتيب المفاتيح فقط على الخانة المعلقة.
- تنشئ كل عمليات تنفيذ cron سجلات [مهمة في الخلفية](/ar/automation/tasks).
- عند بدء تشغيل Gateway، تتم إعادة جدولة مهام دورة الوكيل المعزولة المتأخرة إلى خارج نافذة اتصال القناة بدلا من إعادة تشغيلها فورا، بحيث يظل بدء تشغيل Discord/Telegram وإعداد الأوامر الأصلية مستجيبا بعد عمليات إعادة التشغيل.
- تحذف مهام المرة الواحدة (`--at`) نفسها تلقائيا بعد النجاح افتراضيا.
- تبذل عمليات تشغيل cron المعزولة أفضل جهد لإغلاق تبويبات/عمليات المتصفح المتتبعة لجلسة `cron:<jobId>` الخاصة بها عند اكتمال التشغيل، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- يمكن لعمليات تشغيل cron المعزولة التي تتلقى منحة التنظيف الذاتي الضيقة الخاصة بـ cron أن تقرأ حالة المجدول وقائمة ذاتية التصفية لمهمتها الحالية، بحيث يمكن لفحوصات الحالة/Heartbeat فحص جدولها الخاص من دون الحصول على وصول أوسع لتعديل cron.
- تحمي عمليات تشغيل cron المعزولة أيضا من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it` و`pulling everything together` وتلميحات مشابهة) ولم تعد أي عملية وكيل فرعي منحدرة مسؤولة عن الإجابة النهائية، يعيد OpenClaw المطالبة مرة واحدة للحصول على النتيجة الفعلية قبل التسليم.
- تفضل عمليات تشغيل cron المعزولة بيانات تعريف رفض التنفيذ المهيكلة من التشغيل المضمن، ثم تعود إلى علامات الملخص/الناتج النهائي المعروفة مثل `SYSTEM_RUN_DENIED` و`INVALID_REQUEST`، حتى لا يتم الإبلاغ عن الأمر المحظور كتَشغيل ناجح.
- تتعامل عمليات تشغيل cron المعزولة أيضا مع إخفاقات الوكيل على مستوى التشغيل كأخطاء مهمة حتى عندما لا يتم إنتاج حمولة رد، بحيث تزيد إخفاقات النموذج/المزود عدادات الأخطاء وتطلق إشعارات الفشل بدلا من مسح المهمة كأنها ناجحة.
- عندما تصل مهمة دورة وكيل معزولة إلى `timeoutSeconds`، يجهض cron تشغيل الوكيل الأساسي ويمنحه نافذة تنظيف قصيرة. إذا لم يتم تصريف التشغيل، فإن التنظيف المملوك لـ Gateway يمسح قسرا ملكية جلسة ذلك التشغيل قبل أن يسجل cron انتهاء المهلة، حتى لا يترك عمل الدردشة في الطابور خلف جلسة معالجة قديمة.

<a id="maintenance"></a>

<Note>
تسوية المهام لـ cron مملوكة لوقت التشغيل أولا ومدعومة بالسجل الدائم ثانيا: تظل مهمة cron النشطة حية ما دام وقت تشغيل cron لا يزال يتتبع تلك المهمة كقيد التشغيل، حتى إذا كان صف جلسة فرعية قديم لا يزال موجودا. بمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي نافذة السماح البالغة 5 دقائق، تتحقق الصيانة من سجلات التشغيل المستمرة وحالة المهمة لتشغيل `cron:<jobId>:<startedAt>` المطابق. إذا أظهر ذلك السجل الدائم نتيجة نهائية، يتم إنهاء دفتر المهام منه؛ وإلا فيمكن للصيانة المملوكة لـ Gateway وسم المهمة بأنها `lost`. يمكن لتدقيق CLI دون اتصال الاسترداد من السجل الدائم، لكنه لا يتعامل مع مجموعة مهامه النشطة الفارغة داخل العملية كدليل على اختفاء تشغيل cron مملوك لـ Gateway.
</Note>

## أنواع الجداول

| النوع   | علم CLI   | الوصف                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لمرة واحدة (ISO 8601 أو نسبي مثل `20m`)       |
| `every` | `--every` | فاصل ثابت                                               |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري        |

تتم معاملة الطوابع الزمنية التي لا تحتوي على منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة حسب الساعة المحلية.

تتم مباعدة التعبيرات المتكررة عند بداية الساعة تلقائيا بما يصل إلى 5 دقائق لتقليل ارتفاعات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

يتم تحليل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون كل من حقلي يوم الشهر ويوم الأسبوع غير شاملين، يطابق croner عندما يطابق **أي** من الحقلين، وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

يتم تشغيل هذا نحو 5 إلى 6 مرات شهريا بدلا من 0 إلى 1 مرة شهريا. يستخدم OpenClaw سلوك OR الافتراضي في Croner هنا. لطلب الشرطين معا، استخدم معدل يوم الأسبوع `+` الخاص بـ Croner (`0 9 15 * +1`) أو جدول على حقل واحد واضبط الآخر في مطالبة المهمة أو الأمر الخاص بها.

## أساليب التنفيذ

| الأسلوب        | قيمة `--session`     | يعمل في                  | الأنسب لـ                         |
| -------------- | -------------------- | ------------------------ | --------------------------------- |
| الجلسة الرئيسية | `main`               | دورة Heartbeat التالية   | التذكيرات، أحداث النظام          |
| معزول          | `isolated`           | `cron:<jobId>` مخصص      | التقارير، الأعمال الخلفية        |
| الجلسة الحالية | `current`            | مرتبط وقت الإنشاء        | العمل المتكرر المدرك للسياق      |
| جلسة مخصصة     | `session:custom-id`  | جلسة مسماة مستمرة        | سير العمل الذي يبني على السجل    |

<AccordionGroup>
  <Accordion title="الجلسة الرئيسية مقابل المعزولة مقابل المخصصة">
    تضيف مهام **الجلسة الرئيسية** حدث نظام إلى الطابور وتوقظ Heartbeat اختياريا (`--wake now` أو `--wake next-heartbeat`). لا تمد أحداث النظام هذه حداثة إعادة الضبط اليومية/الخمول للجلسة المستهدفة. تشغل المهام **المعزولة** دورة وكيل مخصصة بجلسة جديدة. تستمر **الجلسات المخصصة** (`session:xxx`) في الاحتفاظ بالسياق عبر عمليات التشغيل، مما يتيح سير عمل مثل الوقفات اليومية التي تبني على ملخصات سابقة.
  </Accordion>
  <Accordion title="معنى 'جلسة جديدة' للمهام المعزولة">
    بالنسبة إلى المهام المعزولة، تعني "جلسة جديدة" معرف نص/جلسة جديدا لكل تشغيل. قد يحمل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السريع/المطول، والتسميات، وتجاوزات النموذج/المصادقة التي اختارها المستخدم صراحة، لكنه لا يرث سياق المحادثة المحيط من صف cron أقدم: توجيه القناة/المجموعة، سياسة الإرسال أو الاصطفاف، الرفع، الأصل، أو ربط وقت تشغيل ACP. استخدم `current` أو `session:<id>` عندما يجب أن تبني مهمة متكررة عمدا على سياق المحادثة نفسه.
  </Accordion>
  <Accordion title="تنظيف وقت التشغيل">
    بالنسبة إلى المهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيفا للمتصفح بأفضل جهد لتلك جلسة cron. يتم تجاهل إخفاقات التنظيف حتى تظل نتيجة cron الفعلية هي الحاسمة.

    تتخلص عمليات تشغيل cron المعزولة أيضا من أي مثيلات وقت تشغيل MCP مدمجة تم إنشاؤها للمهمة عبر مسار تنظيف وقت التشغيل المشترك. يطابق هذا كيفية تفكيك عملاء MCP في الجلسة الرئيسية والجلسة المخصصة، بحيث لا تسرب مهام cron المعزولة عمليات stdio فرعية أو اتصالات MCP طويلة العمر عبر عمليات التشغيل.

  </Accordion>
  <Accordion title="تسليم الوكيل الفرعي وDiscord">
    عندما تنسق عمليات تشغيل cron المعزولة وكلاء فرعيين، يفضل التسليم أيضا الناتج النهائي للمنحدر على النص المؤقت القديم للأصل. إذا كانت المنحدرات لا تزال قيد التشغيل، يمنع OpenClaw ذلك التحديث الجزئي من الأصل بدلا من إعلانه.

    بالنسبة إلى أهداف الإعلان النصية فقط في Discord، يرسل OpenClaw نص المساعد النهائي المعتمد مرة واحدة بدلا من إعادة تشغيل كل من حمولات النص المتدفقة/الوسيطة والإجابة النهائية. لا تزال وسائط Discord والحمولات المهيكلة تسلم كحمولات منفصلة حتى لا يتم إسقاط المرفقات والمكونات.

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
  تقييد الأدوات التي يمكن أن تستخدمها المهمة، على سبيل المثال `--tools exec,read`.
</ParamField>

يستخدم `--model` النموذج المسموح المحدد كنموذج أساسي لتلك المهمة. وهو ليس مثل تجاوز `/model` لجلسة دردشة: لا تزال سلاسل الرجوع المكونة تنطبق عندما يفشل نموذج المهمة الأساسي. إذا لم يكن النموذج المطلوب مسموحا أو لا يمكن حله، يفشل cron التشغيل بخطأ تحقق صريح بدلا من الرجوع بصمت إلى اختيار نموذج وكيل/افتراضي للمهمة.

يمكن لمهام Cron أيضا حمل `fallbacks` على مستوى الحمولة. عند وجودها، تستبدل تلك القائمة سلسلة الرجوع المكونة للمهمة. استخدم `fallbacks: []` في حمولة/واجهة API المهمة عندما تريد تشغيل cron صارما يجرب النموذج المحدد فقط. إذا كانت لدى المهمة `--model` لكن لا توجد أي رجوعات في الحمولة أو الإعدادات، يمرر OpenClaw تجاوز رجوع فارغا صريحا حتى لا تتم إضافة النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي مخفي.

أسبقية اختيار النموذج للمهام المعزولة هي:

1. تجاوز نموذج خطاف Gmail (عندما يأتي التشغيل من Gmail ويكون ذلك التجاوز مسموحا)
2. `model` في حمولة كل مهمة
3. تجاوز نموذج جلسة cron المخزن الذي اختاره المستخدم
4. اختيار نموذج الوكيل/الافتراضي

يتبع الوضع السريع الاختيار الحي المحلول أيضا. إذا كان إعداد النموذج المحدد يحتوي على `params.fastMode`، يستخدمه cron المعزول افتراضيا. لا يزال تجاوز `fastMode` المخزن للجلسة يفوز على الإعداد في كلا الاتجاهين.

إذا واجه تشغيل معزول تسليم تبديل نموذج حي، يعيد cron المحاولة بالمزود/النموذج المحول ويحفظ ذلك الاختيار الحي للتشغيل النشط قبل إعادة المحاولة. عندما يحمل التبديل أيضا ملف مصادقة جديدا، يحفظ cron تجاوز ملف المصادقة ذلك للتشغيل النشط أيضا. إعادة المحاولات محدودة: بعد المحاولة الأولية بالإضافة إلى محاولتي تبديل، يجهض cron بدلا من الدوران إلى الأبد.

قبل أن يدخل تشغيل cron معزول إلى مشغل الوكيل، يتحقق OpenClaw من نقاط نهاية المزود المحلية القابلة للوصول لمزودي `api: "ollama"` و`api: "openai-completions"` المكونين الذين تكون `baseUrl` الخاصة بهم loopback أو شبكة خاصة أو `.local`. إذا كانت تلك النقطة معطلة، يتم تسجيل التشغيل كـ `skipped` مع خطأ مزود/نموذج واضح بدلا من بدء استدعاء نموذج. يتم تخزين نتيجة نقطة النهاية مؤقتا لمدة 5 دقائق، بحيث تشارك مهام كثيرة مستحقة تستخدم خادم Ollama أو vLLM أو SGLang أو LM Studio المحلي المعطل نفسه فحصا صغيرا واحدا بدلا من إنشاء عاصفة طلبات. لا تزيد عمليات التشغيل المتخطاة في فحص المزود المسبق تراجع أخطاء التنفيذ؛ فعّل `failureAlert.includeSkipped` عندما تريد إشعارات تخط متكررة.

## التسليم والناتج

| الوضع      | ما يحدث                                                            |
| ---------- | ------------------------------------------------------------------ |
| `announce` | تسليم احتياطي للنص النهائي إلى الهدف إذا لم يرسله الوكيل           |
| `webhook`  | POST حمولة حدث الانتهاء إلى URL                                    |
| `none`     | لا يوجد تسليم احتياطي من المشغل                                    |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى القناة. بالنسبة إلى مواضيع منتديات Telegram، استخدم `-1001234567890:topic:123`؛ ويمكن لمستدعي RPC/الإعدادات المباشرين أيضًا تمرير `delivery.threadId` كسلسلة نصية أو رقم. يجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`، `user:<id>`). معرّفات غرف Matrix حساسة لحالة الأحرف؛ استخدم معرّف الغرفة الدقيق أو صيغة `room:!room:server` من Matrix.

عندما يستخدم تسليم الإعلان `channel: "last"` أو يحذف `channel`، يمكن لهدف ذي بادئة موفر مثل `telegram:123` تحديد القناة قبل أن يرجع cron إلى سجل الجلسة أو قناة واحدة مهيأة. البادئات التي يعلنها Plugin المحمل فقط هي محددات موفر. إذا كان `delivery.channel` صريحًا، فيجب أن تسمي بادئة الهدف الموفر نفسه؛ على سبيل المثال، يتم رفض `channel: "whatsapp"` مع `to: "telegram:123"` بدلًا من السماح لـ WhatsApp بتفسير معرّف Telegram كرقم هاتف. تبقى بادئات نوع الهدف والخدمة مثل `channel:<id>`، و`user:<id>`، و`imessage:<handle>`، و`sms:<number>` صياغة أهداف مملوكة للقناة، وليست محددات موفر.

بالنسبة إلى المهام المعزولة، يكون تسليم الدردشة مشتركًا. إذا كان مسار دردشة متاحًا، يمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. إذا أرسل الوكيل إلى الهدف المهيأ/الحالي، يتجاوز OpenClaw إعلان الرجوع الاحتياطي. وإلا فإن `announce`، و`webhook`، و`none` تتحكم فقط فيما يفعله المشغل بالرد النهائي بعد دور الوكيل.

عندما ينشئ وكيل تذكيرًا معزولًا من دردشة نشطة، يخزن OpenClaw هدف التسليم المباشر المحفوظ لمسار إعلان الرجوع الاحتياطي. قد تكون مفاتيح الجلسة الداخلية بأحرف صغيرة؛ ولا تتم إعادة إنشاء أهداف تسليم الموفر من تلك المفاتيح عندما يكون سياق الدردشة الحالي متاحًا.

يستخدم تسليم الإعلان الضمني قوائم السماح للقنوات المهيأة للتحقق من الأهداف القديمة وإعادة توجيهها. موافقات مخزن اقتران الرسائل المباشرة ليست مستلمي أتمتة احتياطية؛ عيّن `delivery.to` أو هيئ إدخال `allowFrom` للقناة عندما يجب أن ترسل مهمة مجدولة بشكل استباقي إلى رسالة مباشرة.

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يعيّن `cron.failureDestination` قيمة افتراضية عامة لإشعارات الفشل.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُعيّن أي منهما وكانت المهمة تسلم بالفعل عبر `announce`، فسترجع إشعارات الفشل الآن إلى هدف الإعلان الأساسي ذلك.
- لا يكون `delivery.failureDestination` مدعومًا إلا في مهام `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.
- يؤدي `failureAlert.includeSkipped: true` إلى إدخال مهمة أو سياسة تنبيه cron عامة في تنبيهات التشغيلات المتخطاة المتكررة. تحتفظ التشغيلات المتخطاة بعدّاد تخطي متتالٍ منفصل، لذلك لا تؤثر في تراجع أخطاء التنفيذ.

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
    أضف حدث نظام إلى الطابور للجلسة الرئيسية:

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
    تُحل أسماء الخطافات المخصصة عبر `hooks.mappings` في الإعدادات. يمكن للتعيينات تحويل حمولات عشوائية إلى إجراءات `wake` أو `agent` باستخدام القوالب أو تحويلات الكود.
  </Accordion>
</AccordionGroup>

<Warning>
أبقِ نقاط نهاية الخطافات خلف loopback أو tailnet أو وكيل عكسي موثوق.

- استخدم رمز خطاف مخصصًا؛ لا تُعد استخدام رموز مصادقة Gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ يتم رفض `/`.
- عيّن `hooks.allowedAgentIds` للحد من توجيه `agentId` الصريح.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يختارها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فعيّن أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسة المسموح بها.
- تُغلف حمولات الخطافات بحدود أمان افتراضيًا.

</Warning>

## تكامل Gmail PubSub

صِل مشغلات صندوق وارد Gmail إلى OpenClaw عبر Google PubSub.

<Note>
**المتطلبات المسبقة:** CLI `gcloud`، و`gog` (gogcli)، وخطافات OpenClaw مفعّلة، وTailscale لنقطة نهاية HTTPS العامة.
</Note>

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعدادات `hooks.gmail`، ويفعّل الإعداد المسبق لـ Gmail، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### بدء Gateway تلقائيًا

عندما يكون `hooks.enabled=true` ويكون `hooks.gmail.account` معينًا، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيًا. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء الاشتراك.

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
  <Step title="أنشئ موضوعًا وامنح Gmail وصول الدفع">
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
- إذا كان النموذج مسموحًا به، يصل ذلك الموفر/النموذج الدقيق إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا به أو تعذر حله، يفشل cron التشغيل مع خطأ تحقق صريح.
- لا تزال سلاسل الرجوع الاحتياطي المهيأة تنطبق لأن `--model` في cron هو أساسي للمهمة، وليس تجاوزًا لـ `/model` في الجلسة.
- تستبدل حمولة `fallbacks` حالات الرجوع الاحتياطي المهيأة لتلك المهمة؛ يعطل `fallbacks: []` الرجوع الاحتياطي ويجعل التشغيل صارمًا.
- لا ينتقل `--model` عادي بلا قائمة رجوع احتياطي صريحة أو مهيأة إلى النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

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

يحد `maxConcurrentRuns` من إرسال cron المجدول وتنفيذ أدوار الوكلاء المعزولة معًا. تستخدم أدوار وكلاء cron المعزولة داخليًا مسار التنفيذ المخصص `cron-nested` للطابور، لذلك يتيح رفع هذه القيمة لتشغيلات LLM المستقلة الخاصة بـ cron التقدم بالتوازي بدلًا من بدء أغلفة cron الخارجية فقط. لا يوسّع هذا الإعداد مسار `nested` المشترك غير الخاص بـ cron.

تُشتق الحالة الجانبية لوقت التشغيل من `cron.store`: يستخدم مخزن `.json` مثل `~/clawd/cron/jobs.json` المسار `~/clawd/cron/jobs-state.json`، بينما يضيف مسار مخزن بلا لاحقة `.json` اللاحقة `-state.json`.

إذا حررت `jobs.json` يدويًا، فاترك `jobs-state.json` خارج التحكم في المصدر. يستخدم OpenClaw ذلك الملف الجانبي للفتحات المعلقة، والعلامات النشطة، وبيانات التعريف لآخر تشغيل، وهوية الجدول التي تخبر المجدول متى تحتاج مهمة محررة خارجيًا إلى `nextRunAtMs` جديد.

تعطيل cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="سلوك إعادة المحاولة">
    **إعادة محاولة لمرة واحدة**: تعاد محاولة الأخطاء العابرة (حد المعدل، التحميل الزائد، الشبكة، خطأ الخادم) حتى 3 مرات مع تراجع أسي. تؤدي الأخطاء الدائمة إلى التعطيل فورًا.

    **إعادة محاولة متكررة**: تراجع أسي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. يُعاد ضبط التراجع بعد التشغيل الناجح التالي.

  </Accordion>
  <Accordion title="الصيانة">
    يزيل `cron.sessionRetention` (افتراضيًا `24h`) إدخالات جلسات التشغيل المعزولة القديمة. يعمل `cron.runLog.maxBytes` / `cron.runLog.keepLines` على تقليم ملفات سجلات التشغيل تلقائيًا.
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
    - تأكد من أن Gateway يعمل باستمرار.
    - بالنسبة إلى جداول `cron`، تحقق من المنطقة الزمنية (`--tz`) مقارنة بالمنطقة الزمنية للمضيف.
    - يعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي فُحص باستخدام `openclaw cron run <jobId> --due` وأن المهمة لم يكن موعدها قد حان بعد.

  </Accordion>
  <Accordion title="تشغيل Cron بلا تسليم">
    - يعني وضع التسليم `none` أنه لا يُتوقّع إرسال احتياطي من المشغّل. لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message` عندما يكون مسار الدردشة متاحًا.
    - يعني هدف التسليم المفقود/غير الصالح (`channel`/`to`) أنه تم تخطي الإرسال الصادر.
    - بالنسبة إلى Matrix، قد تفشل المهام المنسوخة أو القديمة التي تحتوي على معرّفات غرف `delivery.to` بأحرف صغيرة لأن معرّفات غرف Matrix حساسة لحالة الأحرف. عدّل المهمة إلى قيمة `!room:server` أو `room:!room:server` الدقيقة من Matrix.
    - تعني أخطاء مصادقة القناة (`unauthorized`، `Forbidden`) أن التسليم حُظر بسبب بيانات الاعتماد.
    - إذا لم يُرجع التشغيل المعزول إلا الرمز الصامت (`NO_REPLY` / `no_reply`)، فإن OpenClaw يمنع التسليم الصادر المباشر ويمنع أيضًا مسار الملخص الاحتياطي الموضوع في قائمة الانتظار، لذلك لا يُنشر أي شيء مرة أخرى في الدردشة.
    - إذا كان ينبغي للوكيل أن يراسل المستخدم بنفسه، فتحقق من أن المهمة لديها مسار قابل للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

  </Accordion>
  <Accordion title="يبدو أن Cron أو Heartbeat يمنع الانتقال وفق /new-style">
    - لا تستند حداثة إعادة الضبط اليومية وإعادة الضبط عند الخمول إلى `updatedAt`؛ راجع [إدارة الجلسات](/ar/concepts/session#session-lifecycle).
    - قد تحدّث إيقاظات Cron، وتشغيلات Heartbeat، وإشعارات التنفيذ، وسجلات Gateway صف الجلسة لأغراض التوجيه/الحالة، لكنها لا تمدد `sessionStartedAt` أو `lastInteractionAt`.
    - بالنسبة إلى الصفوف القديمة التي أُنشئت قبل وجود تلك الحقول، يمكن لـ OpenClaw استرداد `sessionStartedAt` من ترويسة جلسة transcript JSONL عندما يكون الملف لا يزال متاحًا. تستخدم صفوف الخمول القديمة التي لا تحتوي على `lastInteractionAt` وقت البدء المسترد هذا كأساس للخمول.

  </Accordion>
  <Accordion title="محاذير المنطقة الزمنية">
    - يستخدم Cron بدون `--tz` المنطقة الزمنية لمضيف Gateway.
    - تُعامل جداول `at` التي لا تحتوي على منطقة زمنية على أنها UTC.
    - يستخدم `activeHours` في Heartbeat حل المنطقة الزمنية المكوّن.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأتمتة والمهام](/ar/automation) — جميع آليات الأتمتة في لمحة
- [مهام الخلفية](/ar/automation/tasks) — سجل المهام لتنفيذات Cron
- [Heartbeat](/ar/gateway/heartbeat) — أدوار دورية في الجلسة الرئيسية
- [المنطقة الزمنية](/ar/concepts/timezone) — تهيئة المنطقة الزمنية
