---
read_when:
    - جدولة المهام الخلفية أو عمليات الإيقاظ
    - ربط المشغلات الخارجية (webhooks، Gmail) بـ OpenClaw
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Scheduled tasks
summary: المهام المجدولة وWebhook ومشغّلات Gmail PubSub لمجدول Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-05-12T00:56:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a713c6aa2467e3c0331fe94605ba83d542632e5e426e94019d6958ef91da1da3
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron هو المجدول المدمج في Gateway. يحتفظ بالمهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه تسليم المخرجات مرة أخرى إلى قناة دردشة أو نقطة نهاية Webhook.

## البدء السريع

<Steps>
  <Step title="Add a one-shot reminder">
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
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## كيف يعمل Cron

- يعمل Cron **داخل عملية Gateway** (وليس داخل النموذج).
- تبقى تعريفات المهام محفوظة في `~/.openclaw/cron/jobs.json` كي لا تؤدي إعادة التشغيل إلى فقدان الجداول.
- تبقى حالة التنفيذ وقت التشغيل محفوظة بجانبها في `~/.openclaw/cron/jobs-state.json`. إذا كنت تتبع تعريفات Cron في git، فتتبع `jobs.json` وضع `jobs-state.json` في gitignore.
- بعد التقسيم، يمكن لإصدارات OpenClaw الأقدم قراءة `jobs.json` لكنها قد تعامل المهام كأنها جديدة لأن حقول وقت التشغيل أصبحت الآن في `jobs-state.json`.
- عند تحرير `jobs.json` أثناء تشغيل Gateway أو توقفه، يقارن OpenClaw حقول الجدولة المتغيرة مع بيانات تعريف خانة وقت التشغيل المعلقة ويمسح قيم `nextRunAtMs` القديمة. أما إعادة الكتابة التي تقتصر على التنسيق أو ترتيب المفاتيح فقط فتحافظ على الخانة المعلقة.
- تنشئ كل تنفيذات Cron سجلات [مهام في الخلفية](/ar/automation/tasks).
- عند بدء تشغيل Gateway، يعاد جدولة مهام دور الوكيل المعزولة المتأخرة خارج نافذة اتصال القناة بدلا من إعادة تشغيلها فورا، كي يبقى بدء تشغيل Discord/Telegram وإعداد الأوامر الأصلية مستجيبا بعد إعادة التشغيل.
- تحذف المهام أحادية التنفيذ (`--at`) نفسها تلقائيا بعد النجاح افتراضيا.
- تغلق تشغيلات Cron المعزولة، وفق أفضل جهد، علامات تبويب/عمليات المتصفح المتتبعة لجلسة `cron:<jobId>` الخاصة بها عند اكتمال التشغيل، كي لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- يمكن لتشغيلات Cron المعزولة التي تتلقى منحة التنظيف الذاتي الضيقة الخاصة بـ Cron أن تظل قادرة على قراءة حالة المجدول، وقائمة مفلترة ذاتيا بمهمتها الحالية، وسجل تشغيل تلك المهمة، بحيث يمكن لفحوصات الحالة/Heartbeat فحص جدولها الخاص دون الحصول على وصول أوسع لتعديل Cron.
- تحمي تشغيلات Cron المعزولة أيضا من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it`، و`pulling everything together`، وتلميحات مشابهة) ولم يعد أي تشغيل لوكيل فرعي تابع مسؤولا عن الإجابة النهائية، يعيد OpenClaw طلب النتيجة الفعلية مرة واحدة قبل التسليم.
- تفضل تشغيلات Cron المعزولة بيانات تعريف رفض التنفيذ المنظمة من التشغيل المضمن، ثم تعود إلى علامات الملخص/المخرجات النهائية المعروفة مثل `SYSTEM_RUN_DENIED` و`INVALID_REQUEST`، بحيث لا يبلغ عن أمر محظور كتشغيل ناجح.
- تعامل تشغيلات Cron المعزولة أيضا إخفاقات الوكيل على مستوى التشغيل كأخطاء مهمة حتى عند عدم إنتاج حمولة رد، بحيث تزيد إخفاقات النموذج/الموفر عدادات الأخطاء وتطلق إشعارات الفشل بدلا من اعتبار المهمة ناجحة.
- عندما تصل مهمة دور وكيل معزولة إلى `timeoutSeconds`، يوقف Cron تشغيل الوكيل الأساسي ويمنحه نافذة تنظيف قصيرة. إذا لم ينته التشغيل، يمسح التنظيف المملوك لـ Gateway قسرا ملكية جلسة ذلك التشغيل قبل أن يسجل Cron انتهاء المهلة، كي لا يبقى عمل الدردشة في الطابور خلف جلسة معالجة قديمة.
- إذا توقف دور وكيل معزول قبل بدء المشغل أو قبل أول استدعاء للنموذج، يسجل Cron انتهاء مهلة خاصا بالمرحلة مثل `setup timed out before runner start` أو `stalled before first model call (last phase: context-engine)`. تغطي آليات المراقبة هذه الموفرين المضمنين والموفرين المدعومين بـ CLI قبل أن تبدأ عملية CLI الخارجية فعليا، وتكون محددة بسقف مستقل عن قيم `timeoutSeconds` الطويلة كي تظهر إخفاقات البدء البارد/المصادقة/السياق بسرعة بدلا من انتظار ميزانية المهمة الكاملة.

<a id="maintenance"></a>

<Note>
تسوية المهام في Cron مملوكة لوقت التشغيل أولا ومدعومة بالسجل الدائم ثانيا: تبقى مهمة Cron النشطة حية ما دام وقت تشغيل Cron لا يزال يتتبع تلك المهمة كقيد التشغيل، حتى إذا كان صف جلسة فرعية قديم لا يزال موجودا. بعد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي نافذة السماح البالغة 5 دقائق، تفحص الصيانة سجلات التشغيل المحفوظة وحالة المهمة للتشغيل المطابق `cron:<jobId>:<startedAt>`. إذا أظهر ذلك السجل الدائم نتيجة نهائية، ينجز دفتر المهام بناء عليها؛ وإلا يمكن للصيانة المملوكة لـ Gateway وسم المهمة بأنها `lost`. يمكن لتدقيق CLI دون اتصال الاسترداد من السجل الدائم، لكنه لا يعامل مجموعة المهام النشطة الفارغة داخل عمليته كدليل على اختفاء تشغيل Cron مملوك لـ Gateway.
</Note>

## أنواع الجداول

| النوع    | علم CLI  | الوصف                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني أحادي التنفيذ (ISO 8601 أو نسبي مثل `20m`)    |
| `every` | `--every` | فاصل زمني ثابت                                          |
| `cron`  | `--cron`  | تعبير Cron من 5 حقول أو 6 حقول مع `--tz` اختياري |

تعامل الطوابع الزمنية بلا منطقة زمنية كـ UTC. أضف `--tz America/New_York` للجدولة وفق ساعة الحائط المحلية.

توزع تعبيرات التكرار عند رأس الساعة تلقائيا بفارق يصل إلى 5 دقائق لتقليل طفرات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تحلل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون حقلا يوم الشهر ويوم الأسبوع غير شاملين، يطابق croner عندما يطابق **أي** من الحقلين، وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

ينطلق هذا نحو 5 إلى 6 مرات شهريا بدلا من 0 إلى 1 مرة شهريا. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لاشتراط تحقق كلا الشرطين، استخدم معدّل يوم الأسبوع `+` الخاص بـ Croner (`0 9 15 * +1`) أو جدوله على حقل واحد وافحص الآخر في موجه المهمة أو أمرها.

## أنماط التنفيذ

| النمط           | قيمة `--session`   | يعمل في                  | الأنسب لـ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| الجلسة الرئيسية    | `main`              | دور Heartbeat التالي      | التذكيرات، أحداث النظام        |
| معزول        | `isolated`          | `cron:<jobId>` مخصص | التقارير، الأعمال الخلفية      |
| الجلسة الحالية | `current`           | مرتبط وقت الإنشاء   | العمل المتكرر الواعي بالسياق    |
| جلسة مخصصة  | `session:custom-id` | جلسة مسماة دائمة | سير العمل الذي يبني على السجل |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    تضيف مهام **الجلسة الرئيسية** حدث نظام إلى الطابور وتوقظ Heartbeat اختياريا (`--wake now` أو `--wake next-heartbeat`). لا تمدد أحداث النظام تلك حداثة إعادة الضبط اليومية/الخاملة للجلسة الهدف. تشغل المهام **المعزولة** دور وكيل مخصصا بجلسة جديدة. تحافظ **الجلسات المخصصة** (`session:xxx`) على السياق عبر التشغيلات، مما يتيح سير عمل مثل الوقفات اليومية التي تبني على الملخصات السابقة.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    بالنسبة للمهام المعزولة، تعني "الجلسة الجديدة" معرف نص/جلسة جديدا لكل تشغيل. قد يحمل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السرعة/الإسهاب، والتسميات، وتجاوزات النموذج/المصادقة المحددة صراحة من المستخدم، لكنه لا يرث سياق المحادثة المحيط من صف Cron أقدم: توجيه القناة/المجموعة، سياسة الإرسال أو الاصطفاف، التصعيد، المصدر، أو ربط وقت تشغيل ACP. استخدم `current` أو `session:<id>` عندما ينبغي لمهمة متكررة أن تبني عمدا على سياق المحادثة نفسه.
  </Accordion>
  <Accordion title="Runtime cleanup">
    بالنسبة للمهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيف المتصفح وفق أفضل جهد لجلسة Cron تلك. يتم تجاهل إخفاقات التنظيف كي تظل نتيجة Cron الفعلية هي المعتمدة.

    تتخلص تشغيلات Cron المعزولة أيضا من أي مثيلات وقت تشغيل MCP مدمجة أنشئت للمهمة عبر مسار تنظيف وقت التشغيل المشترك. يطابق هذا طريقة تفكيك عملاء MCP في الجلسة الرئيسية والجلسة المخصصة، بحيث لا تسرب مهام Cron المعزولة عمليات stdio فرعية أو اتصالات MCP طويلة العمر عبر التشغيلات.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    عندما تنسق تشغيلات Cron المعزولة وكلاء فرعيين، يفضل التسليم أيضا مخرجات التابع النهائية على نص الأصل المؤقت القديم. إذا كان التابعون لا يزالون قيد التشغيل، يكتم OpenClaw ذلك التحديث الجزئي من الأصل بدلا من إعلانه.

    بالنسبة لأهداف إعلان Discord النصية فقط، يرسل OpenClaw نص المساعد النهائي المعتمد مرة واحدة بدلا من إعادة تشغيل كل من حمولات النص المتدفقة/الوسيطة والإجابة النهائية. تظل حمولات Discord الوسائطية والمنظمة تسلم كحمولات منفصلة كي لا تسقط المرفقات والمكونات.

  </Accordion>
</AccordionGroup>

### خيارات الحمولة للمهام المعزولة

<ParamField path="--message" type="string" required>
  نص الموجه (مطلوب للمعزول).
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

يستخدم `--model` النموذج المسموح المحدد كنموذج أساسي لتلك المهمة. ليس هذا مماثلا لتجاوز `/model` الخاص بجلسة الدردشة: لا تزال سلاسل الرجوع المهيأة تنطبق عندما يفشل نموذج المهمة الأساسي. إذا لم يكن النموذج المطلوب مسموحا به أو تعذر حله، يفشل Cron التشغيل بخطأ تحقق صريح بدلا من الرجوع بصمت إلى اختيار وكيل/نموذج المهمة الافتراضي.

يمكن لمهام Cron أيضا حمل `fallbacks` على مستوى الحمولة. عند وجودها، تستبدل تلك القائمة سلسلة الرجوع المهيأة للمهمة. استخدم `fallbacks: []` في حمولة المهمة/API عندما تريد تشغيل Cron صارما يجرب النموذج المحدد فقط. إذا كانت للمهمة `--model` ولكن لا توجد بدائل رجوع في الحمولة ولا في التهيئة، يمرر OpenClaw تجاوز رجوع فارغا صريحا بحيث لا يضاف نموذج الوكيل الأساسي كهدف إعادة محاولة إضافي مخفي.

أسبقية اختيار النموذج للمهام المعزولة هي:

1. تجاوز نموذج خطاف Gmail (عندما يأتي التشغيل من Gmail ويكون ذلك التجاوز مسموحا)
2. `model` في حمولة كل مهمة
3. تجاوز نموذج جلسة Cron المخزن والمحدد من المستخدم
4. اختيار نموذج الوكيل/الافتراضي

يتبع الوضع السريع الاختيار الحي المحلول أيضا. إذا كانت تهيئة النموذج المحدد تحتوي على `params.fastMode`، يستخدم Cron المعزول ذلك افتراضيا. يظل تجاوز `fastMode` المخزن في الجلسة هو الغالب على التهيئة في أي اتجاه.

إذا واجه تشغيل معزول تسليما حيا لتبديل النموذج، يعيد Cron المحاولة بالموفر/النموذج الذي تم التحويل إليه ويحفظ ذلك الاختيار الحي للتشغيل النشط قبل إعادة المحاولة. عندما يحمل التبديل أيضا ملف مصادقة جديدا، يحفظ Cron تجاوز ملف المصادقة ذلك للتشغيل النشط أيضا. إعادة المحاولات محدودة: بعد المحاولة الأولية إضافة إلى محاولتي تبديل، يوقف Cron التشغيل بدلا من الدوران إلى الأبد.

قبل أن يدخل تشغيل cron معزول إلى مشغّل الوكيل، يتحقق OpenClaw من نقاط نهاية المزوّد المحلي القابلة للوصول لمزوّدي `api: "ollama"` و`api: "openai-completions"` المكوّنين الذين تكون قيمة `baseUrl` لديهم loopback أو شبكة خاصة أو `.local`. إذا كانت نقطة النهاية تلك متوقفة، يُسجّل التشغيل كـ `skipped` مع خطأ واضح في المزوّد/النموذج بدلًا من بدء استدعاء نموذج. تُخزّن نتيجة نقطة النهاية مؤقتًا لمدة 5 دقائق، لذلك تشترك عدة مهام مستحقة تستخدم خادم Ollama أو vLLM أو SGLang أو LM Studio المحلي نفسه والمتوقف في فحص صغير واحد بدلًا من إنشاء عاصفة طلبات. لا تزيد تشغيلات الفحص المسبق للمزوّد المتخطاة تراجع أخطاء التنفيذ؛ فعّل `failureAlert.includeSkipped` عندما تريد إشعارات تخطٍ متكررة.

## التسليم والمخرجات

| الوضع       | ما يحدث                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | يسلّم النص النهائي احتياطيًا إلى الهدف إذا لم يرسله الوكيل |
| `webhook`  | يرسل حمولة حدث الانتهاء بطريقة POST إلى URL                                |
| `none`     | لا يوجد تسليم احتياطي من المشغّل                                         |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى قناة. بالنسبة إلى مواضيع منتدى Telegram، استخدم `-1001234567890:topic:123`؛ ويمكن لمستدعي RPC/الإعدادات المباشرين أيضًا تمرير `delivery.threadId` كسلسلة نصية أو رقم. يجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`، `user:<id>`). معرّفات غرف Matrix حساسة لحالة الأحرف؛ استخدم معرّف الغرفة الدقيق أو صيغة `room:!room:server` من Matrix.

عندما يستخدم تسليم الإعلان `channel: "last"` أو يحذف `channel`، يمكن لهدف ببادئة مزوّد مثل `telegram:123` اختيار القناة قبل أن يرجع cron إلى سجل الجلسة أو قناة واحدة مكوّنة. البادئات التي يعلنها Plugin المحمّل فقط هي محددات المزوّد. إذا كان `delivery.channel` صريحًا، فيجب أن تسمّي بادئة الهدف المزوّد نفسه؛ على سبيل المثال، يُرفض `channel: "whatsapp"` مع `to: "telegram:123"` بدلًا من السماح لـ WhatsApp بتفسير معرّف Telegram كرقم هاتف. تبقى بادئات نوع الهدف والخدمة مثل `channel:<id>` و`user:<id>` و`imessage:<handle>` و`sms:<number>` صياغة هدف مملوكة للقناة، وليست محددات مزوّد.

بالنسبة إلى المهام المعزولة، يكون تسليم الدردشة مشتركًا. إذا كان مسار دردشة متاحًا، يمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. إذا أرسل الوكيل إلى الهدف المكوّن/الحالي، يتخطى OpenClaw الإعلان الاحتياطي. بخلاف ذلك، لا تتحكم `announce` و`webhook` و`none` إلا في ما يفعله المشغّل بالرد النهائي بعد دورة الوكيل.

عندما ينشئ وكيل تذكيرًا معزولًا من دردشة نشطة، يخزّن OpenClaw هدف التسليم الحي المحفوظ لمسار الإعلان الاحتياطي. قد تكون مفاتيح الجلسة الداخلية بأحرف صغيرة؛ لا يُعاد إنشاء أهداف تسليم المزوّد من تلك المفاتيح عندما يكون سياق الدردشة الحالي متاحًا.

يستخدم تسليم الإعلان الضمني قوائم السماح للقنوات المكوّنة للتحقق من الأهداف القديمة وإعادة توجيهها. موافقات مخزن إقران الرسائل المباشرة ليست مستلمي أتمتة احتياطية؛ عيّن `delivery.to` أو كوّن إدخال `allowFrom` للقناة عندما يجب أن ترسل مهمة مجدولة بشكل استباقي إلى رسالة مباشرة.

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يعيّن `cron.failureDestination` قيمة افتراضية عامة لإشعارات الفشل.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُعيّن أي منهما وكانت المهمة تسلّم بالفعل عبر `announce`، فسترجع إشعارات الفشل الآن إلى هدف الإعلان الأساسي ذلك.
- لا يُدعم `delivery.failureDestination` إلا في مهام `sessionTarget="isolated"` إلا إذا كان وضع التسليم الأساسي هو `webhook`.
- يتيح `failureAlert.includeSkipped: true` لمهمة أو سياسة تنبيهات cron عامة الاشتراك في تنبيهات التشغيلات المتخطاة المتكررة. تحتفظ التشغيلات المتخطاة بعدّاد تخطٍ متتالٍ منفصل، لذلك لا تؤثر في تراجع أخطاء التنفيذ.

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

يمكن لـ Gateway كشف نقاط نهاية HTTP Webhook للمحفزات الخارجية. فعّلها في الإعدادات:

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
    يضيف حدث نظام إلى قائمة انتظار الجلسة الرئيسية:

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
    يشغّل دورة وكيل معزولة:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    الحقول: `message` (مطلوب)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="خطافات معيّنة (POST /hooks/<name>)">
    تُحل أسماء الخطافات المخصصة عبر `hooks.mappings` في الإعدادات. يمكن للتعيينات تحويل أي حمولات إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات برمجية.
  </Accordion>
</AccordionGroup>

<Warning>
أبقِ نقاط نهاية الخطافات خلف loopback أو tailnet أو وكيل عكسي موثوق.

- استخدم رمز خطاف مخصصًا؛ لا تعِد استخدام رموز مصادقة Gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ يُرفض `/`.
- عيّن `hooks.allowedAgentIds` للحد من توجيه `agentId` الصريح.
- أبقِ `hooks.allowRequestSessionKey=false` إلا إذا كنت تحتاج إلى جلسات يختارها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فعيّن أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلّف حمولات الخطافات بحدود أمان افتراضيًا.

</Warning>

## تكامل Gmail PubSub

اربط محفزات صندوق وارد Gmail بـ OpenClaw عبر Google PubSub.

<Note>
**المتطلبات الأساسية:** `gcloud` CLI، و`gog` (gogcli)، وتفعيل خطافات OpenClaw، وTailscale لنقطة نهاية HTTPS العامة.
</Note>

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعدادات `hooks.gmail`، ويفعّل الإعداد المسبق لـ Gmail، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### بدء Gateway تلقائيًا

عندما تكون `hooks.enabled=true` ويكون `hooks.gmail.account` معيّنًا، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدّد المراقبة تلقائيًا. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء الاشتراك.

### إعداد يدوي لمرة واحدة

<Steps>
  <Step title="اختيار مشروع GCP">
    اختر مشروع GCP الذي يملك عميل OAuth المستخدم بواسطة `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="إنشاء موضوع ومنح Gmail صلاحية الدفع">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="بدء المراقبة">
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

# Get one stored job as JSON
openclaw cron get <jobId>

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
- إذا لم يكن مسموحًا به أو تعذّر حله، يفشل cron التشغيل بخطأ تحقق صريح.
- لا تزال سلاسل الرجوع المكوّنة تنطبق لأن `--model` في cron هو أساسي للمهمة، وليس تجاوزًا لـ `/model` في الجلسة.
- تستبدل حمولة `fallbacks` خيارات الرجوع المكوّنة لتلك المهمة؛ وتعطّل `fallbacks: []` الرجوع وتجعل التشغيل صارمًا.
- لا ينتقل `--model` العادي بلا قائمة رجوع صريحة أو مكوّنة إلى النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

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

يحد `maxConcurrentRuns` من كل من إرسال cron المجدول وتنفيذ دورة الوكيل المعزولة. تستخدم دورات وكلاء cron المعزولة مسار التنفيذ المخصص `cron-nested` في قائمة الانتظار داخليًا، لذلك يتيح رفع هذه القيمة لتشغيلات LLM مستقلة في cron التقدم بالتوازي بدلًا من بدء أغلفة cron الخارجية فقط. لا يوسّع هذا الإعداد مسار `nested` المشترك غير الخاص بـ cron.

تُشتق حاوية حالة وقت التشغيل الجانبية من `cron.store`: يستخدم مخزن `.json` مثل `~/clawd/cron/jobs.json` المسار `~/clawd/cron/jobs-state.json`، بينما يضيف مسار مخزن بلا لاحقة `.json` اللاحقة `-state.json`.

إذا عدّلت `jobs.json` يدويًا، فاترك `jobs-state.json` خارج التحكم بالمصدر. يستخدم OpenClaw تلك الحاوية الجانبية للفتحات المعلقة، والعلامات النشطة، وبيانات آخر تشغيل الوصفية، وهوية الجدول التي تخبر المجدول متى تحتاج مهمة عُدّلت خارجيًا إلى `nextRunAtMs` جديد.

تعطيل cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="سلوك إعادة المحاولة">
    **إعادة محاولة لمرة واحدة**: تعاد محاولة الأخطاء العابرة (حد المعدل، التحميل الزائد، الشبكة، خطأ الخادم) حتى 3 مرات مع تراجع أسي. تعطّل الأخطاء الدائمة فورًا.

    **إعادة محاولة متكررة**: تراجع أسي (من 30 ث إلى 60 د) بين المحاولات. يُعاد ضبط التراجع بعد التشغيل الناجح التالي.

  </Accordion>
  <Accordion title="الصيانة">
    يؤدي `cron.sessionRetention` (الافتراضي `24h`) إلى إزالة إدخالات جلسات التشغيل المعزولة. تعمل `cron.runLog.maxBytes` / `cron.runLog.keepLines` على إزالة ملفات سجل التشغيل تلقائيًا.
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
    - تعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي فُحص باستخدام `openclaw cron run <jobId> --due` وأن المهمة لم يحن موعدها بعد.

  </Accordion>
  <Accordion title="تم تشغيل Cron لكن دون تسليم">
    - يعني وضع التسليم `none` أنه لا يُتوقع إرسال احتياطي من المشغّل. لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message` عند توفر مسار محادثة.
    - يعني هدف التسليم المفقود/غير الصالح (`channel`/`to`) أنه تم تخطي الإرسال الصادر.
    - بالنسبة إلى Matrix، قد تفشل المهام المنسوخة أو القديمة التي تحتوي على معرّفات غرف `delivery.to` بأحرف صغيرة لأن معرّفات غرف Matrix حساسة لحالة الأحرف. عدّل المهمة إلى قيمة `!room:server` أو `room:!room:server` الدقيقة من Matrix.
    - تعني أخطاء مصادقة القناة (`unauthorized`، `Forbidden`) أن التسليم حُظر بسبب بيانات الاعتماد.
    - إذا أعاد التشغيل المعزول رمز الصمت فقط (`NO_REPLY` / `no_reply`)، فإن OpenClaw يكبت التسليم الصادر المباشر ويكبت أيضًا مسار الملخص الاحتياطي في قائمة الانتظار، لذلك لا يُنشر أي شيء مرة أخرى في المحادثة.
    - إذا كان يجب على الوكيل مراسلة المستخدم بنفسه، فتحقق من أن المهمة لديها مسار قابل للاستخدام (`channel: "last"` مع محادثة سابقة، أو قناة/هدف صريح).

  </Accordion>
  <Accordion title="يبدو أن Cron أو Heartbeat يمنع الانتقال بأسلوب /new">
    - لا تعتمد حداثة إعادة الضبط اليومية والخاملة على `updatedAt`؛ راجع [إدارة الجلسات](/ar/concepts/session#session-lifecycle).
    - قد تحدّث تنبيهات Cron وتشغيلات Heartbeat وإشعارات exec ومسك سجلات Gateway صف الجلسة لأغراض التوجيه/الحالة، لكنها لا تمدّد `sessionStartedAt` أو `lastInteractionAt`.
    - بالنسبة إلى الصفوف القديمة التي أُنشئت قبل وجود هذه الحقول، يمكن لـ OpenClaw استرداد `sessionStartedAt` من ترويسة جلسة transcript بتنسيق JSONL عندما يظل الملف متاحًا. تستخدم الصفوف الخاملة القديمة التي لا تحتوي على `lastInteractionAt` وقت البدء المسترد هذا كأساس للخمول.

  </Accordion>
  <Accordion title="ملاحظات مهمة حول المنطقة الزمنية">
    - يستخدم Cron من دون `--tz` المنطقة الزمنية لمضيف Gateway.
    - تُعامل جداول `at` من دون منطقة زمنية على أنها UTC.
    - يستخدم `activeHours` في Heartbeat تحليل المنطقة الزمنية المكوّن.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأتمتة](/ar/automation) — جميع آليات الأتمتة في لمحة
- [المهام الخلفية](/ar/automation/tasks) — سجل المهام لتنفيذات cron
- [Heartbeat](/ar/gateway/heartbeat) — أدوار الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — تكوين المنطقة الزمنية
