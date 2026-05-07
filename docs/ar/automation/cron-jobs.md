---
read_when:
    - جدولة المهام الخلفية أو عمليات الإيقاظ
    - ربط المشغلات الخارجية (Webhook، Gmail) بـ OpenClaw
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Scheduled tasks
summary: المهام المجدولة وعمليات Webhook ومشغلات Gmail PubSub لمجدول Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-05-07T01:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4771847517f526ec537a940773c70141e056bdc5a7b735099f40c6ea10e18162
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron هو المجدول المدمج في Gateway. يستمر في حفظ المهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه تسليم المخرجات مرة أخرى إلى قناة دردشة أو نقطة نهاية Webhook.

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

## كيفية عمل cron

- يعمل Cron **داخل عملية Gateway** (وليس داخل النموذج).
- تستمر تعريفات المهام في `~/.openclaw/cron/jobs.json` حتى لا تفقد عمليات إعادة التشغيل الجداول.
- تستمر حالة التنفيذ في وقت التشغيل بجواره في `~/.openclaw/cron/jobs-state.json`. إذا كنت تتعقب تعريفات cron في git، فتعقب `jobs.json` وأضف `jobs-state.json` إلى gitignore.
- بعد الفصل، يمكن لإصدارات OpenClaw الأقدم قراءة `jobs.json` لكنها قد تتعامل مع المهام كأنها جديدة لأن حقول وقت التشغيل أصبحت الآن في `jobs-state.json`.
- عند تحرير `jobs.json` أثناء تشغيل Gateway أو توقفه، يقارن OpenClaw حقول الجدول المتغيرة ببيانات تعريف خانة وقت التشغيل المعلقة ويمسح قيم `nextRunAtMs` القديمة. تحافظ عمليات إعادة الكتابة الخاصة بالتنسيق فقط أو ترتيب المفاتيح فقط على الخانة المعلقة.
- تنشئ جميع عمليات تنفيذ cron سجلات [مهمة خلفية](/ar/automation/tasks).
- عند بدء تشغيل Gateway، يعاد جدولة مهام دورات الوكيل المعزولة المتأخرة إلى خارج نافذة اتصال القناة بدلا من إعادة تشغيلها فورا، لكي يظل بدء تشغيل Discord/Telegram وإعداد الأوامر الأصلية مستجيبين بعد عمليات إعادة التشغيل.
- تحذف المهام لمرة واحدة (`--at`) نفسها تلقائيا بعد النجاح افتراضيا.
- تبذل عمليات تشغيل cron المعزولة أفضل جهد لإغلاق علامات تبويب/عمليات المتصفح المتتبعة لجلسة `cron:<jobId>` الخاصة بها عند اكتمال التشغيل، بحيث لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- لا يزال بإمكان عمليات تشغيل cron المعزولة التي تتلقى منحة التنظيف الذاتي الضيقة الخاصة بـ cron قراءة حالة المجدول وقائمة مفلترة ذاتيا لمهمتها الحالية، بحيث تستطيع فحوصات الحالة/Heartbeat فحص جدولها الخاص دون الحصول على وصول أوسع لتعديل cron.
- تحمي عمليات تشغيل cron المعزولة أيضا من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقتا (`on it`، `pulling everything together`، وتلميحات مماثلة) ولم تعد أي عملية وكيل فرعي لاحقة مسؤولة عن الإجابة النهائية، يعيد OpenClaw المطالبة مرة واحدة للحصول على النتيجة الفعلية قبل التسليم.
- تفضل عمليات تشغيل cron المعزولة بيانات تعريف رفض التنفيذ المنظمة من التشغيل المضمن، ثم تعود إلى علامات الملخص/المخرجات النهائية المعروفة مثل `SYSTEM_RUN_DENIED` و`INVALID_REQUEST`، بحيث لا يتم الإبلاغ عن أمر محظور كتشغيل ناجح.
- تتعامل عمليات تشغيل cron المعزولة أيضا مع فشل الوكيل على مستوى التشغيل كأخطاء في المهمة حتى عند عدم إنتاج حمولة رد، بحيث تزيد حالات فشل النموذج/الموفر عدادات الأخطاء وتطلق إشعارات الفشل بدلا من مسح المهمة على أنها ناجحة.
- عندما تصل مهمة دورة وكيل معزولة إلى `timeoutSeconds`، يجهض cron تشغيل الوكيل الأساسي ويمنحه نافذة تنظيف قصيرة. إذا لم يفرغ التشغيل، فإن التنظيف المملوك لـ Gateway يمسح ملكية الجلسة لذلك التشغيل قسرا قبل أن يسجل cron انتهاء المهلة، بحيث لا يبقى عمل الدردشة في قائمة الانتظار خلف جلسة معالجة قديمة.

<a id="maintenance"></a>

<Note>
تسوية المهام في cron مملوكة لوقت التشغيل أولا، ومدعومة بالسجل المتين ثانيا: تبقى مهمة cron النشطة حية ما دام وقت تشغيل cron لا يزال يتتبع تلك المهمة كقيد التشغيل، حتى إذا كان صف جلسة فرعية قديم لا يزال موجودا. بمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي نافذة السماح البالغة 5 دقائق، تتحقق الصيانة من سجلات التشغيل المستمرة وحالة المهمة لتشغيل `cron:<jobId>:<startedAt>` المطابق. إذا أظهر ذلك السجل المتين نتيجة نهائية، ينهى دفتر المهام بناء عليه؛ وإلا يمكن للصيانة المملوكة لـ Gateway تعليم المهمة كـ `lost`. يمكن لتدقيق CLI دون اتصال الاسترداد من السجل المتين، لكنه لا يتعامل مع مجموعة المهام النشطة الفارغة داخل العملية الخاصة به كدليل على اختفاء تشغيل cron مملوك لـ Gateway.
</Note>

## أنواع الجداول

| النوع    | علم CLI  | الوصف                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لمرة واحدة (ISO 8601 أو نسبي مثل `20m`)    |
| `every` | `--every` | فاصل زمني ثابت                                          |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري |

تعامل الطوابع الزمنية بلا منطقة زمنية كـ UTC. أضف `--tz America/New_York` للجدولة وفق ساعة الحائط المحلية.

تزاح التعبيرات المتكررة عند بداية الساعة تلقائيا بما يصل إلى 5 دقائق لتقليل ارتفاعات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تحلل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون حقلا يوم الشهر ويوم الأسبوع كلاهما غير حرف بدل، يطابق croner عندما يطابق **أي** من الحقلين، وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

يعمل هذا نحو 5-6 مرات في الشهر بدلا من 0-1 مرة في الشهر. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لاشتراط تحقق الشرطين معا، استخدم معدل يوم الأسبوع `+` في Croner (`0 9 15 * +1`) أو جدوله على حقل واحد وتحقق من الآخر في مطالبة مهمتك أو أمرها.

## أنماط التنفيذ

| النمط           | قيمة `--session`   | يعمل في                  | الأنسب لـ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| الجلسة الرئيسية    | `main`              | دورة Heartbeat التالية      | التذكيرات، أحداث النظام        |
| معزول        | `isolated`          | `cron:<jobId>` مخصص | التقارير، الأعمال الخلفية      |
| الجلسة الحالية | `current`           | مرتبط وقت الإنشاء   | عمل متكرر مدرك للسياق    |
| جلسة مخصصة  | `session:custom-id` | جلسة مسماة مستمرة | سير العمل الذي يبني على السجل |

<AccordionGroup>
  <Accordion title="الجلسة الرئيسية مقابل المعزولة مقابل المخصصة">
    تدرج مهام **الجلسة الرئيسية** حدث نظام في قائمة الانتظار وتوقظ Heartbeat اختياريا (`--wake now` أو `--wake next-heartbeat`). لا تمدد أحداث النظام هذه حداثة إعادة الضبط اليومية/الخاملة للجلسة المستهدفة. تشغل المهام **المعزولة** دورة وكيل مخصصة بجلسة جديدة. تستمر **الجلسات المخصصة** (`session:xxx`) في حفظ السياق عبر عمليات التشغيل، مما يتيح سير عمل مثل الاجتماعات اليومية التي تبني على الملخصات السابقة.
  </Accordion>
  <Accordion title="ما معنى 'جلسة جديدة' للمهام المعزولة">
    بالنسبة للمهام المعزولة، تعني "جلسة جديدة" معرف نص/جلسة جديدا لكل تشغيل. قد يحمل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السريع/المفصل، والتسميات، وتجاوزات النموذج/المصادقة المحددة صراحة من المستخدم، لكنه لا يرث سياق المحادثة المحيط من صف cron أقدم: توجيه القناة/المجموعة، سياسة الإرسال أو قائمة الانتظار، الرفع، الأصل، أو ربط وقت تشغيل ACP. استخدم `current` أو `session:<id>` عندما يجب أن تبني مهمة متكررة عمدا على سياق المحادثة نفسه.
  </Accordion>
  <Accordion title="تنظيف وقت التشغيل">
    بالنسبة للمهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيفا بأفضل جهد للمتصفح لتلك جلسة cron. يتم تجاهل حالات فشل التنظيف حتى تظل نتيجة cron الفعلية هي الحاسمة.

    تتخلص عمليات تشغيل cron المعزولة أيضا من أي مثيلات وقت تشغيل MCP مدمجة أنشئت للمهمة عبر مسار تنظيف وقت التشغيل المشترك. يطابق هذا طريقة تفكيك عملاء MCP في الجلسة الرئيسية والجلسة المخصصة، بحيث لا تسرب مهام cron المعزولة عمليات stdio فرعية أو اتصالات MCP طويلة العمر عبر عمليات التشغيل.

  </Accordion>
  <Accordion title="الوكيل الفرعي وتسليم Discord">
    عندما تنسق عمليات تشغيل cron المعزولة الوكلاء الفرعيين، يفضل التسليم أيضا مخرجات السليل النهائي على النص المؤقت القديم للأصل. إذا كان السلال لا يزالون يعملون، يمنع OpenClaw ذلك التحديث الجزئي للأصل بدلا من إعلانه.

    بالنسبة لأهداف إعلان Discord النصية فقط، يرسل OpenClaw نص المساعد النهائي المعتمد مرة واحدة بدلا من إعادة تشغيل كل من حمولات النص المتدفقة/الوسيطة والإجابة النهائية. لا تزال حمولات Discord الإعلامية والمنظمة تسلم كحمولات منفصلة حتى لا تسقط المرفقات والمكونات.

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

يستخدم `--model` النموذج المسموح المحدد كنموذج أساسي لتلك المهمة. ليس هو نفسه تجاوز `/model` لجلسة دردشة: لا تزال سلاسل الاحتياط المهيأة تنطبق عندما يفشل النموذج الأساسي للمهمة. إذا لم يكن النموذج المطلوب مسموحا أو تعذر حله، يفشل cron التشغيل بخطأ تحقق صريح بدلا من الرجوع بصمت إلى اختيار نموذج الوكيل/الافتراضي للمهمة.

إذا كانت إدخالات `jobs.json` الأقدم أو المحررة يدويا تخزن `payload.model` كـ `"default"` أو `"null"` أو سلسلة فارغة أو JSON `null`، فشغل `openclaw doctor --fix`. يزيل Doctor تلك الحراس غير الصالحة المستمرة للتجاوز؛ لا يدعمها وقت التشغيل كأسماء مستعارة للاحتياط. احذف حقل النموذج لاستخدام اختيار نموذج الوكيل/الافتراضي العادي.

يمكن لمهام Cron أيضا حمل `fallbacks` على مستوى الحمولة. عند وجودها، تستبدل تلك القائمة سلسلة الاحتياط المهيأة للمهمة. استخدم `fallbacks: []` في حمولة/واجهة API المهمة عندما تريد تشغيل cron صارما يحاول النموذج المحدد فقط. إذا كانت لدى مهمة `--model` لكن لا توجد احتياطات في الحمولة أو الإعدادات، يمرر OpenClaw تجاوز احتياط فارغا صريحا حتى لا يضاف النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي مخفي.

أسبقية اختيار النموذج للمهام المعزولة هي:

1. تجاوز نموذج خطاف Gmail (عندما يأتي التشغيل من Gmail ويكون ذلك التجاوز مسموحا)
2. `model` في حمولة كل مهمة
3. تجاوز نموذج جلسة cron المخزن والمحدد من المستخدم
4. اختيار نموذج الوكيل/الافتراضي

يتبع الوضع السريع الاختيار المباشر المحلول أيضا. إذا كان تكوين النموذج المحدد يحتوي على `params.fastMode`، يستخدم cron المعزول ذلك افتراضيا. لا يزال تجاوز `fastMode` لجلسة مخزنة يغلب التكوين في أي من الاتجاهين.

إذا وصل تشغيل معزول إلى تسليم تبديل نموذج مباشر، يعيد cron المحاولة بالموفر/النموذج الذي تم التبديل إليه ويستمر في حفظ ذلك الاختيار المباشر للتشغيل النشط قبل إعادة المحاولة. عندما يحمل التبديل أيضا ملف تعريف مصادقة جديدا، يستمر cron في حفظ تجاوز ملف تعريف المصادقة ذلك للتشغيل النشط أيضا. عمليات إعادة المحاولة محدودة: بعد المحاولة الأولية بالإضافة إلى محاولتي تبديل، يجهض cron بدلا من الدوران إلى الأبد.

قبل أن يدخل تشغيل cron معزول إلى مشغل الوكيل، يتحقق OpenClaw من نقاط نهاية الموفر المحلي القابلة للوصول لموفري `api: "ollama"` و`api: "openai-completions"` المهيئين الذين يكون `baseUrl` الخاص بهم loopback أو شبكة خاصة أو `.local`. إذا كانت نقطة النهاية تلك متوقفة، يسجل التشغيل كـ `skipped` مع خطأ واضح في الموفر/النموذج بدلا من بدء نداء نموذج. تخزن نتيجة نقطة النهاية في الذاكرة المؤقتة لمدة 5 دقائق، بحيث تشترك العديد من المهام المستحقة التي تستخدم خادم Ollama أو vLLM أو SGLang أو LM Studio المحلي الميت نفسه في فحص صغير واحد بدلا من إنشاء عاصفة طلبات. لا تزيد عمليات تشغيل فحص الموفر المسبق المتخطاة تراجع أخطاء التنفيذ؛ فعل `failureAlert.includeSkipped` عندما تريد إشعارات تخط متكررة.

## التسليم والمخرجات

| الوضع       | ما يحدث                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | تسليم النص النهائي احتياطيا إلى الهدف إذا لم يرسل الوكيل |
| `webhook`  | إرسال حمولة حدث الانتهاء بطريقة POST إلى عنوان URL                                |
| `none`     | لا يوجد تسليم احتياطي من المشغل                                         |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى القناة. بالنسبة إلى موضوعات منتديات Telegram، استخدم `-1001234567890:topic:123`؛ يمكن لمستدعي RPC/الإعدادات المباشرين أيضا تمرير `delivery.threadId` كسلسلة نصية أو رقم. يجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`، `user:<id>`). معرفات غرف Matrix حساسة لحالة الأحرف؛ استخدم معرف الغرفة الدقيق أو صيغة `room:!room:server` من Matrix.

عندما يستخدم تسليم الإعلان `channel: "last"` أو يحذف `channel`، يمكن لهدف مسبوق بمزود مثل `telegram:123` أن يحدد القناة قبل أن يعود Cron إلى سجل الجلسة أو إلى قناة واحدة مهيأة. وحدها البادئات التي يعلنها Plugin المحمل تكون محددات مزودين. إذا كان `delivery.channel` صريحا، فيجب أن تسمي بادئة الهدف المزود نفسه؛ مثلا، يتم رفض `channel: "whatsapp"` مع `to: "telegram:123"` بدلا من السماح لـ WhatsApp بتفسير معرف Telegram كرقم هاتف. تبقى بادئات نوع الهدف والخدمة مثل `channel:<id>` و`user:<id>` و`imessage:<handle>` و`sms:<number>` صياغة أهداف مملوكة للقناة، وليست محددات مزودين.

بالنسبة إلى المهام المعزولة، يكون تسليم المحادثة مشتركا. إذا كان مسار محادثة متاحا، يمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. إذا أرسل الوكيل إلى الهدف المهيأ/الحالي، يتجاوز OpenClaw إعلان الاحتياط. وإلا فإن `announce` و`webhook` و`none` تتحكم فقط في ما يفعله المشغل بالرد النهائي بعد دورة الوكيل.

عندما ينشئ وكيل تذكيرا معزولا من محادثة نشطة، يخزن OpenClaw هدف التسليم الحي المحفوظ لمسار إعلان الاحتياط. قد تكون مفاتيح الجلسة الداخلية بأحرف صغيرة؛ ولا تتم إعادة إنشاء أهداف تسليم المزودين من تلك المفاتيح عندما يكون سياق المحادثة الحالي متاحا.

يستخدم تسليم الإعلان الضمني قوائم السماح للقنوات المهيأة للتحقق من الأهداف القديمة وإعادة توجيهها. موافقات مخزن إقران الرسائل المباشرة ليست مستلمي أتمتة احتياطية؛ عيّن `delivery.to` أو هيئ إدخال `allowFrom` للقناة عندما ينبغي لمهمة مجدولة أن ترسل استباقيا إلى رسالة مباشرة.

تتبع إشعارات الفشل مسار وجهة منفصلا:

- يعيّن `cron.failureDestination` افتراضيا عاما لإشعارات الفشل.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يتم تعيين أي منهما وكانت المهمة تسلم بالفعل عبر `announce`، فإن إشعارات الفشل تعود الآن إلى هدف الإعلان الأساسي ذلك.
- لا يكون `delivery.failureDestination` مدعوما إلا في مهام `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.
- يختار `failureAlert.includeSkipped: true` سياسة تنبيه Cron لمهمة أو عامة لإدخالها في تنبيهات التشغيل المتخطى المتكررة. تحتفظ عمليات التشغيل المتخطاة بعداد تخطي متتال منفصل، لذلك لا تؤثر في تراجع أخطاء التنفيذ.

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

يتم رفض رموز سلسلة الاستعلام.

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
  <Accordion title="الخطافات المعينة (POST /hooks/<name>)">
    يتم حل أسماء الخطافات المخصصة عبر `hooks.mappings` في الإعدادات. يمكن للتعيينات تحويل أي حمولات إلى إجراءات `wake` أو `agent` باستخدام القوالب أو تحويلات التعليمات البرمجية.
  </Accordion>
</AccordionGroup>

<Warning>
أبق نقاط نهاية الخطافات خلف loopback أو tailnet أو وكيل عكسي موثوق.

- استخدم رمز خطاف مخصصا؛ لا تعيد استخدام رموز مصادقة Gateway.
- أبق `hooks.path` على مسار فرعي مخصص؛ يتم رفض `/`.
- عيّن `hooks.allowedAgentIds` للحد من توجيه `agentId` الصريح.
- أبق `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يحددها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فعيّن أيضا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- يتم تغليف حمولات الخطافات بحدود أمان افتراضيا.

</Warning>

## تكامل Gmail PubSub

اربط مشغلات صندوق وارد Gmail بـ OpenClaw عبر Google PubSub.

<Note>
**المتطلبات المسبقة:** `gcloud` CLI، و`gog` (gogcli)، وتمكين خطافات OpenClaw، وTailscale لنقطة نهاية HTTPS العامة.
</Note>

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعدادات `hooks.gmail`، ويفعّل الإعداد المسبق لـ Gmail، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### بدء Gateway تلقائيا

عندما يكون `hooks.enabled=true` و`hooks.gmail.account` معينا، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيا. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` لعدم الاشتراك.

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
  <Step title="أنشئ الموضوع وامنح Gmail صلاحية الدفع">
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

- يغير `openclaw cron add|edit --model ...` النموذج المحدد للمهمة.
- إذا كان النموذج مسموحا، يصل ذلك المزود/النموذج الدقيق إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحا أو تعذر حله، يفشل Cron التشغيل مع خطأ تحقق صريح.
- تظل سلاسل الاحتياط المهيأة مطبقة لأن `--model` في Cron هو نموذج أساسي للمهمة، وليس تجاوز `/model` للجلسة.
- تستبدل حمولة `fallbacks` الاحتياطيات المهيأة لتلك المهمة؛ ويعطل `fallbacks: []` الاحتياط ويجعل التشغيل صارما.
- لا ينتقل `--model` عادي بلا قائمة احتياط صريحة أو مهيأة إلى النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

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

يحد `maxConcurrentRuns` كلا من إرسال Cron المجدول وتنفيذ دورات الوكيل المعزولة. تستخدم دورات وكيل Cron المعزولة داخليا مسار التنفيذ المخصص `cron-nested` في قائمة الانتظار، لذلك فإن رفع هذه القيمة يسمح لتشغيلات LLM المستقلة في Cron بالتقدم بالتوازي بدلا من بدء مغلفات Cron الخارجية فقط. لا يتم توسيع مسار `nested` المشترك غير الخاص بـ Cron بهذا الإعداد.

يتم اشتقاق ملف الحالة المرافق في وقت التشغيل من `cron.store`: فمخزن `.json` مثل `~/clawd/cron/jobs.json` يستخدم `~/clawd/cron/jobs-state.json`، بينما يضيف مسار مخزن بلا لاحقة `.json` اللاحقة `-state.json`.

إذا حررت `jobs.json` يدويا، فاترك `jobs-state.json` خارج التحكم بالمصدر. يستخدم OpenClaw ذلك الملف المرافق للخانات المعلقة، والعلامات النشطة، وبيانات آخر تشغيل الوصفية، وهوية الجدول التي تخبر المجدول متى تحتاج مهمة معدلة خارجيا إلى `nextRunAtMs` جديد.

تعطيل Cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="سلوك إعادة المحاولة">
    **إعادة محاولة لمرة واحدة**: الأخطاء العابرة (حد المعدل، الحمل الزائد، الشبكة، خطأ الخادم) يعاد محاولة تنفيذها حتى 3 مرات مع تراجع أسي. الأخطاء الدائمة تعطل فورا.

    **إعادة محاولة متكررة**: تراجع أسي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. تتم إعادة ضبط التراجع بعد التشغيل الناجح التالي.

  </Accordion>
  <Accordion title="الصيانة">
    يقوم `cron.sessionRetention` (الافتراضي `24h`) بتنظيف إدخالات جلسات التشغيل المعزولة. يقوم `cron.runLog.maxBytes` / `cron.runLog.keepLines` بتنظيف ملفات سجل التشغيل تلقائيا.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

### سلم الأوامر

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
    - تعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي تم فحصه باستخدام `openclaw cron run <jobId> --due` وأن موعد المهمة لم يحن بعد.

  </Accordion>
  <Accordion title="تم تشغيل Cron ولكن لم يحدث تسليم">
    - يعني وضع التسليم `none` أنه لا يُتوقع إرسال احتياطي من المشغّل. لا يزال بإمكان الوكيل الإرسال مباشرةً باستخدام أداة `message` عندما يكون مسار الدردشة متاحًا.
    - يعني هدف التسليم المفقود/غير الصالح (`channel`/`to`) أنه تم تخطي الإرسال الصادر.
    - بالنسبة إلى Matrix، يمكن أن تفشل المهام المنسوخة أو القديمة التي تحتوي على معرّفات غرف `delivery.to` بأحرف صغيرة لأن معرّفات غرف Matrix حساسة لحالة الأحرف. حرّر المهمة إلى قيمة `!room:server` أو `room:!room:server` الدقيقة من Matrix.
    - تعني أخطاء مصادقة القناة (`unauthorized`، `Forbidden`) أن التسليم حُظر بسبب بيانات الاعتماد.
    - إذا أعاد التشغيل المعزول رمز الصمت فقط (`NO_REPLY` / `no_reply`)، فإن OpenClaw يكبح التسليم الصادر المباشر ويكبح أيضًا مسار الملخص الاحتياطي في قائمة الانتظار، لذلك لا يُنشر أي شيء مرة أخرى في الدردشة.
    - إذا كان ينبغي للوكيل مراسلة المستخدم بنفسه، فتحقق من أن المهمة لديها مسار قابل للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

  </Accordion>
  <Accordion title="يبدو أن Cron أو Heartbeat يمنعان تدوير /new-style">
    - لا تستند حداثة إعادة الضبط اليومية وعند الخمول إلى `updatedAt`؛ راجع [إدارة الجلسات](/ar/concepts/session#session-lifecycle).
    - قد تحدّث تنبيهات Cron، وتشغيلات Heartbeat، وإشعارات التنفيذ، ومهام مسك سجلات Gateway صف الجلسة لأغراض التوجيه/الحالة، لكنها لا تمدد `sessionStartedAt` أو `lastInteractionAt`.
    - بالنسبة إلى الصفوف القديمة التي أُنشئت قبل وجود تلك الحقول، يمكن لـ OpenClaw استرداد `sessionStartedAt` من ترويسة جلسة transcript JSONL عندما يظل الملف متاحًا. تستخدم الصفوف القديمة الخاملة التي لا تحتوي على `lastInteractionAt` وقت البدء المسترد هذا كخط أساس للخمول.

  </Accordion>
  <Accordion title="تنبيهات المنطقة الزمنية">
    - يستخدم Cron من دون `--tz` المنطقة الزمنية لمضيف Gateway.
    - تُعامل جداول `at` من دون منطقة زمنية على أنها UTC.
    - يستخدم `activeHours` الخاص بـ Heartbeat حل المنطقة الزمنية المُكوّن.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأتمتة والمهام](/ar/automation) — جميع آليات الأتمتة في لمحة
- [مهام الخلفية](/ar/automation/tasks) — سجل المهام لتنفيذات Cron
- [Heartbeat](/ar/gateway/heartbeat) — دورات الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعداد المنطقة الزمنية
