---
read_when:
    - جدولة المهام الخلفية أو عمليات الإيقاظ
    - توصيل المشغلات الخارجية (Webhook، Gmail) بـ OpenClaw
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Scheduled tasks
summary: الوظائف المجدولة، وWebhooks، ومشغلات Gmail PubSub لمجدول Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-07-02T00:55:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron هو المجدول المدمج في Gateway. يحتفظ بالمهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه تسليم المخرجات مرة أخرى إلى قناة دردشة أو نقطة نهاية Webhook.

## البدء السريع

<Steps>
  <Step title="إضافة تذكير لمرة واحدة">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="تحقق من مهامك">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
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
- تستمر تعريفات المهام وحالة وقت التشغيل وسجل التشغيل في قاعدة بيانات حالة SQLite المشتركة في OpenClaw، لذلك لا تؤدي عمليات إعادة التشغيل إلى فقدان الجداول.
- عند الترقية، شغّل `openclaw doctor --fix` لاستيراد ملفات `~/.openclaw/cron/jobs.json` و`jobs-state.json` و`runs/*.jsonl` القديمة إلى SQLite وإعادة تسميتها بلاحقة `.migrated`. يتم تخطي صفوف المهام غير الصحيحة من وقت التشغيل ونسخها إلى `jobs-quarantine.json` لإصلاحها أو مراجعتها لاحقًا.
- لا يزال `cron.store` يسمي مفتاح مخزن cron المنطقي ومسار استيراد doctor. بعد الاستيراد، لم يعد تعديل ملف JSON ذلك يغير مهام cron النشطة؛ استخدم `openclaw cron add|edit|remove` أو طرق Gateway cron RPC بدلًا من ذلك.
- تنشئ كل عمليات تنفيذ cron سجلات [مهام خلفية](/ar/automation/tasks).
- عند بدء Gateway، تتم إعادة جدولة مهام دورات الوكيل المعزولة المتأخرة خارج نافذة اتصال القناة بدلًا من إعادة تشغيلها فورًا، بحيث يظل بدء Discord/Telegram وإعداد الأوامر الأصلية سريع الاستجابة بعد عمليات إعادة التشغيل.
- تُحذف مهام المرة الواحدة (`--at`) تلقائيًا بعد النجاح افتراضيًا.
- تبذل عمليات cron المعزولة أقصى جهد لإغلاق علامات تبويب/عمليات المتصفح المتتبعة لجلسة `cron:<jobId>` الخاصة بها عند اكتمال التشغيل، بحيث لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- لا يزال بإمكان عمليات cron المعزولة التي تتلقى منحة التنظيف الذاتي الضيقة الخاصة بـ cron قراءة حالة المجدول، وقائمة مفلترة ذاتيًا لمهمتها الحالية، وسجل تشغيل تلك المهمة، بحيث يمكن لفحوصات الحالة/Heartbeat فحص جدولها الخاص دون الحصول على وصول أوسع لتعديل cron.
- تحمي عمليات cron المعزولة أيضًا من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it`، و`pulling everything together`، وتلميحات مشابهة) ولم تعد أي عملية وكيل فرعي منحدرة مسؤولة عن الإجابة النهائية، يعيد OpenClaw المطالبة مرة واحدة للحصول على النتيجة الفعلية قبل التسليم.
- تستخدم عمليات cron المعزولة بيانات وصفية منظمة لرفض التنفيذ من التشغيل المضمن، بما في ذلك أغلفة Node-host `UNAVAILABLE` التي تبدأ رسالة الخطأ المتداخلة فيها بـ `SYSTEM_RUN_DENIED` أو `INVALID_REQUEST`، بحيث لا يتم الإبلاغ عن الأمر المحظور كتشغيل أخضر بينما لا يُعامل نثر المساعد العادي كرفض.
- تتعامل عمليات cron المعزولة أيضًا مع إخفاقات الوكيل على مستوى التشغيل كأخطاء مهمة حتى عندما لا يتم إنتاج حمولة رد، بحيث تزيد إخفاقات النموذج/المزود عدادات الأخطاء وتؤدي إلى إشعارات الفشل بدلًا من مسح المهمة على أنها ناجحة.
- عندما تصل مهمة دورة وكيل معزولة إلى `timeoutSeconds`، يوقف cron تشغيل الوكيل الأساسي ويمنحه نافذة تنظيف قصيرة. إذا لم يتم تصريف التشغيل، فإن التنظيف المملوك لـ Gateway يمسح قسرًا ملكية جلسة ذلك التشغيل قبل أن يسجل cron انتهاء المهلة، بحيث لا يُترك عمل الدردشة في قائمة الانتظار خلف جلسة معالجة قديمة.
- إذا توقفت دورة وكيل معزولة قبل بدء المشغل أو قبل أول استدعاء للنموذج، يسجل cron انتهاء مهلة خاصًا بالمرحلة مثل `setup timed out before runner start` أو `stalled before first model call (last phase: context-engine)`. تغطي هذه المراقبات المزودين المضمنين والمزودين المدعومين بـ CLI قبل بدء عملية CLI الخارجية فعليًا، وتُحد بشكل مستقل عن قيم `timeoutSeconds` الطويلة بحيث تظهر إخفاقات البدء البارد/المصادقة/السياق بسرعة بدلًا من انتظار ميزانية المهمة الكاملة.
- إذا كنت تستخدم system cron أو مجدولًا خارجيًا آخر لتشغيل `openclaw agent`، فلفّه بتصعيد قتل صارم رغم أن CLI يتعامل مع `SIGTERM`/`SIGINT`. تطلب عمليات التشغيل المدعومة بـ Gateway من Gateway إيقاف عمليات التشغيل المقبولة؛ وتتلقى عمليات التشغيل المحلية والمضمنة الاحتياطية إشارة الإيقاف نفسها. بالنسبة إلى GNU `timeout`، فضّل `timeout -k 60 600 openclaw agent ...` على `timeout 600 ...` العادي؛ قيمة `-k` هي مسند المشرف الأخير إذا لم تتمكن العملية من التصريف. بالنسبة إلى وحدات systemd، حافظ على الشكل نفسه باستخدام إشارة إيقاف `SIGTERM` مع نافذة سماح مثل `TimeoutStopSec` قبل أي قتل نهائي. إذا أعادت محاولة استخدام `--run-id` بينما لا يزال تشغيل Gateway الأصلي نشطًا، يتم الإبلاغ عن النسخة المكررة على أنها قيد التنفيذ بدلًا من بدء تشغيل ثانٍ.

<a id="maintenance"></a>

<Note>
تسوية المهام لـ cron مملوكة لوقت التشغيل أولًا، ومدعومة بالسجل الدائم ثانيًا: تبقى مهمة cron النشطة حية بينما لا يزال وقت تشغيل cron يتتبع تلك المهمة كقيد التشغيل، حتى إذا كان صف جلسة فرعية قديم لا يزال موجودًا. بعد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي نافذة السماح البالغة 5 دقائق، تفحص الصيانة سجلات التشغيل المستمرة وحالة المهمة لتشغيل `cron:<jobId>:<startedAt>` المطابق. إذا أظهر ذلك السجل الدائم نتيجة نهائية، يتم إنهاء دفتر المهام منه؛ وإلا يمكن للصيانة المملوكة لـ Gateway وسم المهمة بأنها `lost`. يمكن لتدقيق CLI غير المتصل الاسترداد من السجل الدائم، لكنه لا يتعامل مع مجموعة المهام النشطة داخل العملية الفارغة الخاصة به كدليل على أن تشغيل cron المملوك لـ Gateway قد اختفى.
</Note>

## أنواع الجداول

| النوع    | علم CLI  | الوصف                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لمرة واحدة (ISO 8601 أو نسبي مثل `20m`)    |
| `every` | `--every` | فاصل ثابت                                          |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري |

تُعامل الطوابع الزمنية دون منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة حسب ساعة الحائط المحلية.

تُزاح التعبيرات المتكررة في بداية الساعة تلقائيًا بما يصل إلى 5 دقائق لتقليل طفرات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تُحلل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون حقلا يوم الشهر ويوم الأسبوع كلاهما غير شاملين، يطابق croner عندما يطابق **أي** حقل منهما، وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

يعمل هذا نحو 5-6 مرات في الشهر بدلًا من 0-1 مرة في الشهر. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لاشتراط تحقق الشرطين، استخدم معدّل يوم الأسبوع `+` الخاص بـ Croner (`0 9 15 * +1`) أو جدولة أحد الحقلين والتحقق من الآخر في مطالبة المهمة أو أمرها.

## أنماط التنفيذ

| النمط           | قيمة `--session`   | يعمل في                  | الأنسب لـ                       |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| الجلسة الرئيسية    | `main`              | مسار إيقاظ cron مخصص | التذكيرات، أحداث النظام       |
| معزول        | `isolated`          | `cron:<jobId>` مخصص | التقارير، الأعمال الخلفية     |
| الجلسة الحالية | `current`           | تشغيل cron منفصل        | العمل المتكرر الواعي بالسياق   |
| جلسة مخصصة  | `session:custom-id` | تشغيل cron منفصل        | استهداف دردشة/جلسة معروفة |

<AccordionGroup>
  <Accordion title="الجلسة الرئيسية مقابل المعزولة مقابل المخصصة">
    تضيف مهام **الجلسة الرئيسية** حدث نظام إلى مسار تشغيل مملوك لـ cron وتوقظ Heartbeat اختياريًا (`--wake now` أو `--wake next-heartbeat`). يمكنها استخدام سياق التسليم الأخير للجلسة الرئيسية المستهدفة للردود، لكنها لا تضيف دورات cron الروتينية إلى مسار الدردشة البشرية ولا تمدد حداثة إعادة الضبط اليومية/الخاملة للجلسة المستهدفة. تعمل المهام **المعزولة** كدورة وكيل مخصصة بجلسة جديدة. يمكن لمهام الجلسة **الحالية** و**المخصصة** (`current`، `session:xxx`) استخدام الدردشة/الجلسة المحددة لسياق التسليم والبذر الآمن للتفضيلات، لكن كل تشغيل لا يزال ينفذ في جلسة cron منفصلة بحيث لا يحظر العمل المجدول نص المحادثة الحية أو يلوثه.

    أحداث cron للجلسة الرئيسية هي تذكيرات أحداث نظام مستقلة. فهي لا
    تتضمن تلقائيًا تعليمة مطالبة Heartbeat الافتراضية "Read
    HEARTBEAT.md". إذا كان ينبغي لتذكير متكرر الرجوع إلى
    `HEARTBEAT.md`، فاذكر ذلك صراحة في نص حدث cron أو في
    تعليمات الوكيل نفسه.

  </Accordion>
  <Accordion title="ما معنى 'جلسة جديدة' للمهام المنفصلة">
    بالنسبة إلى المهام المعزولة ومهام الجلسة الحالية والجلسة المخصصة، تعني "جلسة جديدة" معرّف نص/جلسة جديدًا لكل تشغيل. قد يحمل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السريع/المفصل، والتسميات، وتجاوزات النموذج/المصادقة التي اختارها المستخدم صراحة. لا ترث عمليات التشغيل المنفصلة سياق المحادثة المحيط من صف cron أقدم: توجيه القناة/المجموعة، سياسة الإرسال أو قائمة الانتظار، الرفع، الأصل، أو ربط وقت تشغيل ACP. ضع حالة العمل المتكرر الدائمة في المطالبة، أو ملفات مساحة العمل، أو الأدوات، أو النظام الذي تعمل عليه المهمة بدلًا من الاعتماد على نص دردشة حي كذاكرة cron.
  </Accordion>
  <Accordion title="تنظيف وقت التشغيل">
    بالنسبة إلى المهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيفًا بأفضل جهد للمتصفح لتلك جلسة cron. يتم تجاهل إخفاقات التنظيف بحيث تظل نتيجة cron الفعلية هي الحاكمة.

    تتخلص عمليات cron المعزولة أيضًا من أي مثيلات وقت تشغيل MCP مضمّنة تم إنشاؤها للمهمة عبر مسار تنظيف وقت التشغيل المشترك. يطابق ذلك كيفية تفكيك عملاء MCP في الجلسة الرئيسية والجلسة المخصصة، بحيث لا تسرب مهام cron المعزولة عمليات فرعية stdio أو اتصالات MCP طويلة العمر عبر عمليات التشغيل.

  </Accordion>
  <Accordion title="تسليم الوكيل الفرعي وDiscord">
    عندما تنسق عمليات cron المعزولة وكلاء فرعيين، يفضل التسليم أيضًا مخرجات المنحدر النهائية على النص المؤقت القديم للأصل. إذا كانت المنحدرات لا تزال قيد التشغيل، يحجب OpenClaw ذلك التحديث الجزئي للأصل بدلًا من إعلانه.

    بالنسبة إلى أهداف إعلان Discord النصية فقط، يرسل OpenClaw نص المساعد النهائي canonical مرة واحدة بدلًا من إعادة تشغيل كل من حمولات النص المتدفقة/الوسيطة والإجابة النهائية. لا تزال وسائط Discord والحمولات المنظمة تُسلّم كحمولات منفصلة حتى لا تُسقط المرفقات والمكونات.

  </Accordion>
</AccordionGroup>

### حمولات الأوامر

استخدم حمولات الأوامر للبرامج النصية الحتمية التي ينبغي تشغيلها داخل مجدول Gateway دون بدء دورة وكيل معزولة مدعومة بنموذج. تنفذ مهام الأوامر على مضيف Gateway، وتلتقط stdout/stderr، وتسجل التشغيل في سجل cron، وتعيد استخدام أوضاع التسليم نفسها `announce` و`webhook` و`none` مثل المهام المعزولة.

<Note>
Command cron هو سطح أتمتة Gateway إداري للمشغل، وليس استدعاء وكيل
`tools.exec`. يتطلب إنشاء مهام cron أو تحديثها أو إزالتها أو تشغيلها يدويًا
`operator.admin`؛ وتُنفذ عمليات تشغيل الأوامر المجدولة لاحقًا داخل عملية
Gateway كأتمتة ألّفها ذلك المسؤول. تحكم سياسة exec الخاصة بالوكيل مثل
`tools.exec.mode`، ومطالبات الموافقة، وقوائم السماح للأدوات لكل وكيل
أدوات exec المرئية للنموذج، وليس حمولات command cron.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

يخزن `--command <shell>` القيمة `argv: ["sh", "-lc", <shell>]`. استخدم `--command-argv '["node","scripts/report.mjs"]'` عندما تريد تنفيذ argv دقيقًا دون تحليل shell. تتحكم حقول `--command-env KEY=VALUE` و`--command-input` و`--timeout-seconds` و`--no-output-timeout-seconds` و`--output-max-bytes` الاختيارية في بيئة العملية وstdin وحدود المخرجات.

إذا كان `stdout` غير فارغ، فهذا النص هو النتيجة المُسلَّمة. إذا كان `stdout` فارغًا وكان `stderr` غير فارغ، فسيُسلَّم `stderr`. إذا كان كلا الدفقين موجودين، فإن cron يسلّم كتلة صغيرة بصيغة `stdout:` / `stderr:`. يسجل رمز الخروج الصفري التشغيل على أنه `ok`؛ أما الخروج غير الصفري أو الإشارة أو انتهاء المهلة أو انتهاء مهلة عدم وجود مخرجات فيسجل `error` ويمكن أن يطلق تنبيهات الفشل. الأمر الذي يطبع `NO_REPLY` فقط يستخدم كبت الرمز الصامت العادي في cron ولا ينشر أي شيء مرة أخرى إلى المحادثة.

### خيارات الحمولة للمهام المعزولة

<ParamField path="--message" type="string" required>
  نص الموجّه (مطلوب للمعزول).
</ParamField>
<ParamField path="--model" type="string">
  تجاوز النموذج؛ يستخدم النموذج المسموح المحدد للمهمة.
</ParamField>
<ParamField path="--fallbacks" type="string">
  قائمة نماذج الرجوع الاحتياطي لكل مهمة، على سبيل المثال `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. مرر `--fallbacks ""` لتشغيل صارم بلا رجوعات احتياطية.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  عند `cron edit`، يزيل تجاوز الرجوع الاحتياطي لكل مهمة بحيث تتبع المهمة أسبقية الرجوع الاحتياطي المكوّنة. لا يمكن دمجه مع `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  عند `cron edit`، يزيل تجاوز النموذج لكل مهمة بحيث تتبع المهمة أسبقية اختيار نموذج cron العادية (تجاوز جلسة cron مخزن إذا كان مضبوطًا، وإلا نموذج الوكيل/الافتراضي). لا يمكن دمجه مع `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  تجاوز مستوى التفكير.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  عند `cron edit`، يزيل تجاوز التفكير لكل مهمة بحيث تتبع المهمة أسبقية تفكير cron العادية. لا يمكن دمجه مع `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تخطَّ حقن ملف تمهيد مساحة العمل.
</ParamField>
<ParamField path="--tools" type="string">
  قيّد الأدوات التي يمكن للمهمة استخدامها، على سبيل المثال `--tools exec,read`.
</ParamField>

يستخدم `--model` النموذج المسموح المحدد كنموذج أساسي لتلك المهمة. وهو ليس مثل تجاوز `/model` في جلسة محادثة: ما تزال سلاسل الرجوع الاحتياطي المكوّنة تنطبق عندما يفشل النموذج الأساسي للمهمة. إذا لم يكن النموذج المطلوب مسموحًا أو تعذّر حله، يفشل cron التشغيل بخطأ تحقق صريح بدل الرجوع بصمت إلى اختيار نموذج الوكيل/الافتراضي للمهمة.

يمكن أن تحمل مهام Cron أيضًا `fallbacks` على مستوى الحمولة. عند وجودها، تستبدل تلك القائمة سلسلة الرجوع الاحتياطي المكوّنة للمهمة. استخدم `fallbacks: []` في حمولة/API المهمة عندما تريد تشغيل cron صارمًا يجرّب النموذج المحدد فقط. إذا كانت المهمة تتضمن `--model` ولكن لا توجد رجوعات احتياطية في الحمولة أو الإعدادات، يمرر OpenClaw تجاوز رجوع احتياطي فارغًا صريحًا حتى لا يُضاف النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي مخفي.

تجتاز فحوصات التمهيد المسبق للمزوّد المحلي الرجوعات الاحتياطية المكوّنة قبل وسم تشغيل cron بأنه `skipped`؛ وتُبقي `fallbacks: []` مسار التمهيد المسبق ذلك صارمًا.

أسبقية اختيار النموذج للمهام المعزولة هي:

1. تجاوز نموذج خطاف Gmail (عندما يأتي التشغيل من Gmail ويكون ذلك التجاوز مسموحًا)
2. `model` في حمولة كل مهمة
3. تجاوز نموذج جلسة cron المخزن الذي حدده المستخدم
4. اختيار نموذج الوكيل/الافتراضي

يتبع الوضع السريع الاختيار الحي المحلول أيضًا. إذا كان إعداد النموذج المحدد يحتوي على `params.fastMode`، يستخدم cron المعزول ذلك افتراضيًا. ما يزال تجاوز `fastMode` لجلسة مخزنة يتغلب على الإعداد في كلا الاتجاهين. يستخدم الوضع التلقائي حد `params.fastAutoOnSeconds` للنموذج المحدد عند وجوده، مع افتراض 60 ثانية افتراضيًا.

إذا واجه تشغيل معزول تسليم تبديل نموذج حي، يعيد cron المحاولة بالمزوّد/النموذج المُبدّل ويثبّت ذلك الاختيار الحي للتشغيل النشط قبل إعادة المحاولة. عندما يحمل التبديل أيضًا ملف تعريف مصادقة جديدًا، يثبّت cron تجاوز ملف تعريف المصادقة ذلك للتشغيل النشط أيضًا. إعادة المحاولات محدودة: بعد المحاولة الأولية بالإضافة إلى محاولتي تبديل، يُجهض cron بدل الدوران إلى الأبد.

قبل أن يدخل تشغيل cron معزول إلى مشغّل الوكيل، يتحقق OpenClaw من نقاط نهاية المزوّد المحلي القابلة للوصول لمزوّدي `api: "ollama"` و`api: "openai-completions"` المكوّنين الذين يكون `baseUrl` لديهم loopback محليًا أو شبكة خاصة أو `.local`. إذا كانت نقطة النهاية معطلة، يُسجَّل التشغيل على أنه `skipped` مع خطأ واضح للمزوّد/النموذج بدل بدء استدعاء نموذج. تُخزَّن نتيجة نقطة النهاية مؤقتًا لمدة 5 دقائق، لذلك تشترك المهام الكثيرة المستحقة التي تستخدم خادم Ollama أو vLLM أو SGLang أو LM Studio المحلي المعطل نفسه في فحص صغير واحد بدل إنشاء عاصفة طلبات. لا تزيد تشغيلات التمهيد المسبق للمزوّد المتخطاة تراجع أخطاء التنفيذ؛ فعّل `failureAlert.includeSkipped` عندما تريد إشعارات تخطٍّ متكررة.

## التسليم والمخرجات

| الوضع       | ما يحدث                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | تسليم النص النهائي احتياطيًا إلى الهدف إذا لم يرسله الوكيل |
| `webhook`  | POST حمولة حدث الانتهاء إلى URL                                |
| `none`     | لا تسليم احتياطي من المشغّل                                         |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى قناة. بالنسبة إلى موضوعات منتدى Telegram، استخدم `-1001234567890:topic:123`؛ يقبل OpenClaw أيضًا الاختصار المملوك لـ Telegram‏ `-1001234567890:123`. يمكن لمستدعي RPC/الإعداد المباشرين تمرير `delivery.threadId` كسلسلة أو رقم. يجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`، `user:<id>`). معرفات غرف Matrix حساسة لحالة الأحرف؛ استخدم معرف الغرفة الدقيق أو صيغة `room:!room:server` من Matrix.

عندما يستخدم تسليم الإعلان `channel: "last"` أو يحذف `channel`، يمكن لهدف ذي بادئة مزوّد مثل `telegram:123` اختيار القناة قبل أن يرجع cron إلى سجل الجلسة أو قناة مكوّنة واحدة. البادئات التي يعلنها Plugin المحمّل فقط هي محددات مزوّد. إذا كان `delivery.channel` صريحًا، فيجب أن تسمي بادئة الهدف المزوّد نفسه؛ على سبيل المثال، يُرفض `channel: "whatsapp"` مع `to: "telegram:123"` بدل السماح لـ WhatsApp بتفسير معرف Telegram كرقم هاتف. تبقى بادئات نوع الهدف والخدمة مثل `channel:<id>` و`user:<id>` و`imessage:<handle>` و`sms:<number>` صياغة أهداف مملوكة للقناة، وليست محددات مزوّد.

بالنسبة إلى المهام المعزولة، يكون تسليم المحادثة مشتركًا. إذا كان مسار محادثة متاحًا، يمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. إذا أرسل الوكيل إلى الهدف المكوّن/الحالي، يتخطى OpenClaw الإعلان الاحتياطي. وإلا فإن `announce` و`webhook` و`none` تتحكم فقط فيما يفعله المشغّل بالرد النهائي بعد دورة الوكيل.

عندما ينشئ وكيل تذكيرًا معزولًا من محادثة نشطة، يخزن OpenClaw هدف التسليم الحي المحفوظ لمسار الإعلان الاحتياطي. قد تكون مفاتيح الجلسة الداخلية بأحرف صغيرة؛ ولا تُعاد بناء أهداف تسليم المزوّد من تلك المفاتيح عندما يكون سياق المحادثة الحالي متاحًا.

يستخدم التسليم الضمني للإعلان قوائم السماح للقنوات المكوّنة للتحقق من الأهداف القديمة وإعادة توجيهها. موافقات مخزن اقتران الرسائل المباشرة ليست مستلمي أتمتة احتياطية؛ اضبط `delivery.to` أو كوّن إدخال `allowFrom` للقناة عندما يجب أن ترسل مهمة مجدولة بصورة استباقية إلى رسالة مباشرة.

## لغة المخرجات

لا تستنتج مهام Cron لغة الرد من القناة أو الإعدادات المحلية أو الرسائل السابقة.
ضع قاعدة اللغة في الرسالة أو القالب المجدول:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

بالنسبة إلى ملفات القوالب، أبقِ تعليمة اللغة في الموجّه المعروض وتحقق من تعبئة العناصر النائبة مثل `{{language}}` قبل تشغيل المهمة. إذا خلط المخرج بين لغات متعددة، فاجعل القاعدة صريحة، مثل: "استخدم الصينية للنص السردي وأبقِ المصطلحات التقنية بالإنجليزية."

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يعيّن `cron.failureDestination` افتراضيًا عامًا لإشعارات الفشل.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُعيّن أي منهما وكانت المهمة تسلّم بالفعل عبر `announce`، فستعود إشعارات الفشل الآن إلى هدف الإعلان الأساسي ذاك.
- لا يُدعم `delivery.failureDestination` إلا في مهام `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.
- يفعّل `failureAlert.includeSkipped: true` سياسة تنبيهات cron لمهمة أو على المستوى العام بحيث تشمل تنبيهات التشغيلات المتخطاة المتكررة. تحتفظ التشغيلات المتخطاة بعدّاد تخطٍ متتالٍ منفصل، لذلك لا تؤثر في التراجع عند أخطاء التنفيذ.

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
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
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
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhooks

يمكن لـ Gateway كشف نقاط نهاية HTTP Webhook للمشغّلات الخارجية. فعّل ذلك في الإعدادات:

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

تُرفض الرموز في سلسلة الاستعلام.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    أدرج حدث نظام للجلسة الرئيسية في قائمة الانتظار:

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
    تُحل أسماء الخطافات المخصصة عبر `hooks.mappings` في الإعدادات. يمكن للتعيينات تحويل الحمولات العشوائية إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات برمجية.
  </Accordion>
</AccordionGroup>

<Warning>
أبقِ نقاط نهاية الخطافات خلف local loopback أو tailnet أو وكيل عكسي موثوق.

- استخدم رمز hook مخصصًا؛ لا تعِد استخدام رموز مصادقة Gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ يتم رفض `/`.
- اضبط `hooks.allowedAgentIds` للحد من الوكيل الفعّال الذي يمكن أن يستهدفه hook، بما في ذلك الوكيل الافتراضي عند حذف `agentId`.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يختارها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلّف حمولات Hook بحدود أمان افتراضيًا.

</Warning>

## تكامل Gmail PubSub

اربط مشغلات صندوق وارد Gmail بـ OpenClaw عبر Google PubSub.

<Note>
**المتطلبات المسبقة:** `gcloud` CLI، و`gog` (gogcli)، وتفعيل hooks في OpenClaw، وTailscale لنقطة نهاية HTTPS العامة.
</Note>

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعداد `hooks.gmail`، ويفعّل الإعداد المسبق لـ Gmail، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### التشغيل التلقائي لـ Gateway

عندما يكون `hooks.enabled=true` ويتم ضبط `hooks.gmail.account`، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء ذلك.

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
  <Step title="إنشاء الموضوع ومنح Gmail صلاحية الدفع">
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

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

يرجع `openclaw cron run <jobId>` بعد إدراج التشغيل اليدوي في قائمة الانتظار. استخدم `--wait` لخطافات إيقاف التشغيل، أو سكربتات الصيانة، أو أي أتمتة أخرى يجب أن تنتظر حتى ينتهي التشغيل المدرج في قائمة الانتظار. يستطلع وضع الانتظار قيمة `runId` المرجعة بدقة؛ ويخرج بالقيمة `0` للحالة `ok` وبقيمة غير صفرية للحالات `error` أو `skipped` أو انتهاء مهلة الانتظار.

تعيد أداة الوكيل `cron` ملخصات مهام مضغوطة (`id`، و`name`، و`enabled`، و`nextRunAtMs`، و`scheduleKind`، و`lastRunStatus`) من `cron(action: "list")`؛ استخدم `cron(action: "get", jobId: "...")` لتعريف كامل لمهمة واحدة. يمكن لمستدعي Gateway المباشرين تمرير `compact: true` إلى `cron.list`؛ وحذفها يحافظ على الاستجابة الكاملة الحالية مع معاينات التسليم.

`openclaw cron create` هو اسم مستعار لـ `openclaw cron add`، ويمكن للمهام الجديدة استخدام جدول موضعي (`"0 9 * * 1"`، أو `"every 1h"`، أو `"20m"`، أو طابع زمني ISO) متبوعًا بموجه وكيل موضعي. استخدم `--webhook <url>` على `cron add|create` أو `cron edit` لإرسال حمولة التشغيل المنتهي عبر POST إلى نقطة نهاية HTTP. لا يمكن الجمع بين تسليم Webhook ورايات تسليم الدردشة مثل `--announce`، أو `--channel`، أو `--to`، أو `--thread-id`، أو `--account`. في `cron edit`، تزيل `--clear-channel`، و`--clear-to`، و`--clear-thread-id`، و`--clear-account` حقول التوجيه هذه كلًا على حدة (ويُرفض كل منها مع راية الضبط المطابقة له)، وهذا يختلف عن تعطيل `--no-deliver` لتسليم الرجوع الاحتياطي عبر المشغّل.

<Note>
ملاحظة تجاوز النموذج:

- يغيّر `openclaw cron add|edit --model ...` النموذج المحدد للمهمة.
- إذا كان النموذج مسموحًا به، يصل هذا المزوّد/النموذج المحدد إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا به أو تعذر حله، يفشل Cron التشغيل بخطأ تحقق صريح.
- يمكن لرقع حمولة API `cron.update` ضبط `model: null` لمسح تجاوز نموذج مهمة مخزن.
- يمسح `openclaw cron edit <job-id> --clear-model` ذلك التجاوز من CLI (بنفس تأثير رقعة `model: null`) ولا يمكن جمعه مع `--model`.
- لا تزال سلاسل الرجوع الاحتياطي المهيأة تنطبق لأن `--model` في Cron هو خيار أساسي للمهمة، وليس تجاوزًا لجلسة `/model`.
- يضبط `openclaw cron add|edit --fallbacks ...` قيمة `fallbacks` في الحمولة، مستبدلًا الرجوعات الاحتياطية المهيأة لتلك المهمة؛ ويعطّل `--fallbacks ""` الرجوع الاحتياطي ويجعل التشغيل صارمًا. يمسح `openclaw cron edit <job-id> --clear-fallbacks` التجاوز الخاص بالمهمة.
- لا يسقط `--model` وحده، من دون قائمة رجوع احتياطي صريحة أو مهيأة، إلى النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

</Note>

## الإعدادات

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
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

يحد `maxConcurrentRuns` من إرسال Cron المجدول وتنفيذ دور الوكيل المعزول معًا، وقيمته الافتراضية 8. تستخدم أدوار وكيل Cron المعزولة مسار التنفيذ المخصص `cron-nested` في قائمة الانتظار داخليًا، لذلك يتيح رفع هذه القيمة لتشغيلات Cron LLM المستقلة أن تتقدم بالتوازي بدلًا من بدء مغلفات Cron الخارجية فقط. لا يتم توسيع المسار المشترك غير الخاص بـ Cron وهو `nested` بهذا الإعداد.

`cron.store` هو مفتاح تخزين منطقي ومسار استيراد قديم لـ doctor. شغّل `openclaw doctor --fix` لاستيراد مخازن JSON الحالية إلى SQLite وأرشفتها؛ ويجب أن تمر تغييرات Cron المستقبلية عبر CLI أو API الخاصة بـ Gateway.

تعطيل Cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="سلوك إعادة المحاولة">
    **إعادة محاولة لمرة واحدة**: تُعاد محاولة الأخطاء العابرة (حد المعدل، التحميل الزائد، الشبكة، خطأ الخادم) حتى 3 مرات مع تراجع أسي. الأخطاء الدائمة تُعطّل فورًا.

    **إعادة محاولة متكررة**: تراجع أسي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. يُعاد ضبط التراجع بعد التشغيل الناجح التالي.

  </Accordion>
  <Accordion title="الصيانة">
    يزيل `cron.sessionRetention` (الافتراضي `24h`) إدخالات جلسات التشغيل المعزولة القديمة. يحد `cron.runLog.keepLines` من صفوف سجل التشغيل المحفوظة في SQLite لكل مهمة؛ ويتم الاحتفاظ بـ `maxBytes` لتوافق الإعدادات مع سجلات التشغيل القديمة المدعومة بالملفات.
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
    - تحقق من متغير الإعداد `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
    - تأكد من أن Gateway يعمل باستمرار.
    - لجداول `cron`، تحقق من المنطقة الزمنية (`--tz`) مقارنةً بالمنطقة الزمنية للمضيف.
    - تعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي فُحص باستخدام `openclaw cron run <jobId> --due` وأن المهمة لم يحن موعدها بعد.

  </Accordion>
  <Accordion title="تم تشغيل Cron لكن لا يوجد تسليم">
    - يعني وضع التسليم `none` أنه لا يُتوقع إرسال رجوع احتياطي من المشغّل. لا يزال بإمكان الوكيل الإرسال مباشرةً باستخدام أداة `message` عندما يكون مسار الدردشة متاحًا.
    - يعني هدف التسليم المفقود/غير الصالح (`channel`/`to`) أنه تم تخطي الإرسال الصادر.
    - بالنسبة إلى Matrix، يمكن أن تفشل المهام المنسوخة أو القديمة ذات معرفات غرف `delivery.to` المحولة إلى أحرف صغيرة لأن معرفات غرف Matrix حساسة لحالة الأحرف. عدّل المهمة إلى قيمة `!room:server` أو `room:!room:server` الدقيقة من Matrix.
    - تعني أخطاء مصادقة القناة (`unauthorized`، و`Forbidden`) أن التسليم حُظر بسبب بيانات الاعتماد.
    - إذا كان التشغيل المعزول لا يعيد إلا الرمز الصامت (`NO_REPLY` / `no_reply`)، فإن OpenClaw يمنع التسليم الصادر المباشر ويمنع أيضًا مسار ملخص الرجوع الاحتياطي المدرج في قائمة الانتظار، لذلك لا يُنشر أي شيء مرة أخرى إلى الدردشة.
    - إذا كان يجب على الوكيل مراسلة المستخدم بنفسه، فتحقق من أن لدى المهمة مسارًا صالحًا للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

  </Accordion>
  <Accordion title="يبدو أن Cron أو Heartbeat يمنع انتقال /new-style">
    - لا تعتمد حداثة إعادة الضبط اليومية والخاملة على `updatedAt`؛ راجع [إدارة الجلسات](/ar/concepts/session#session-lifecycle).
    - قد تحدّث تنبيهات Cron، وتشغيلات Heartbeat، وإشعارات exec، ومحاسبة Gateway صف الجلسة لأغراض التوجيه/الحالة، لكنها لا تمدد `sessionStartedAt` أو `lastInteractionAt`.
    - بالنسبة إلى الصفوف القديمة المنشأة قبل وجود هذه الحقول، يمكن لـ OpenClaw استرداد `sessionStartedAt` من ترويسة جلسة transcript JSONL عندما يكون الملف لا يزال متاحًا. تستخدم صفوف الخمول القديمة التي لا تحتوي على `lastInteractionAt` وقت البدء المسترد هذا كأساس للخمول.

  </Accordion>
  <Accordion title="ملاحظات المنطقة الزمنية">
    - يستخدم Cron من دون `--tz` المنطقة الزمنية لمضيف Gateway.
    - تُعامل جداول `at` من دون منطقة زمنية على أنها UTC.
    - يستخدم Heartbeat `activeHours` حل المنطقة الزمنية المهيأ.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأتمتة](/ar/automation) — جميع آليات الأتمتة في لمحة
- [مهام الخلفية](/ar/automation/tasks) — سجل المهام لتنفيذات Cron
- [Heartbeat](/ar/gateway/heartbeat) — أدوار دورية في الجلسة الرئيسية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعداد المنطقة الزمنية
