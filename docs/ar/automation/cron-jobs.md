---
read_when:
    - جدولة المهام الخلفية أو عمليات الإيقاظ
    - ربط المشغّلات الخارجية (Webhook، Gmail) بـ OpenClaw
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Scheduled tasks
summary: المهام المجدولة، ومشغلات Webhook، ومشغلات Gmail PubSub لمجدول Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-07-01T08:03:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron هو المجدول المدمج في Gateway. فهو يستبقي المهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه تسليم المخرجات مرة أخرى إلى قناة دردشة أو نقطة نهاية Webhook.

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
  <Step title="التحقق من مهامك">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
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

- يعمل Cron **داخل عملية Gateway** وليس داخل النموذج.
- تستمر تعريفات المهام، وحالة وقت التشغيل، وسجل التشغيل في قاعدة بيانات حالة SQLite المشتركة في OpenClaw، بحيث لا تؤدي إعادة التشغيل إلى فقدان الجداول.
- عند الترقية، شغّل `openclaw doctor --fix` لاستيراد ملفات `~/.openclaw/cron/jobs.json` و`jobs-state.json` و`runs/*.jsonl` القديمة إلى SQLite وإعادة تسميتها بإضافة اللاحقة `.migrated`. يتم تخطي صفوف المهام غير الصالحة من وقت التشغيل ونسخها إلى `jobs-quarantine.json` لإصلاحها أو مراجعتها لاحقًا.
- لا يزال `cron.store` يحدد مفتاح مخزن cron المنطقي ومسار استيراد doctor. بعد الاستيراد، لم يعد تعديل ملف JSON ذلك يغير مهام cron النشطة؛ استخدم `openclaw cron add|edit|remove` أو طرق Cron RPC في Gateway بدلًا من ذلك.
- تنشئ كل عمليات تنفيذ cron سجلات [مهمة خلفية](/ar/automation/tasks).
- عند بدء Gateway، تتم إعادة جدولة مهام دورة الوكيل المعزولة المتأخرة إلى خارج نافذة اتصال القناة بدلًا من إعادة تشغيلها فورًا، بحيث يظل بدء Discord/Telegram وإعداد الأوامر الأصلية مستجيبين بعد عمليات إعادة التشغيل.
- تُحذف مهام المرة الواحدة (`--at`) تلقائيًا بعد النجاح افتراضيًا.
- تبذل عمليات cron المعزولة أفضل جهد لإغلاق علامات تبويب/عمليات المتصفح المتتبعة لجلسة `cron:<jobId>` الخاصة بها عند اكتمال التشغيل، بحيث لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- يمكن لعمليات cron المعزولة التي تتلقى منحة التنظيف الذاتي الضيقة الخاصة بـ cron أن تقرأ حالة المجدول، وقائمة مفلترة ذاتيًا لمهمتها الحالية، وسجل تشغيل تلك المهمة، بحيث تستطيع فحوصات الحالة/Heartbeat فحص جدولها الخاص دون الحصول على وصول أوسع لتعديل cron.
- تحمي عمليات cron المعزولة أيضًا من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it` و`pulling everything together` وتلميحات مشابهة) ولم تعد أي عملية وكيل فرعي لاحقة مسؤولة عن الإجابة النهائية، يعيد OpenClaw المطالبة مرة واحدة للحصول على النتيجة الفعلية قبل التسليم.
- تستخدم عمليات cron المعزولة بيانات وصفية منظمة لرفض التنفيذ من التشغيل المضمن، بما في ذلك أغلفة مضيف العقدة `UNAVAILABLE` التي تبدأ رسالة الخطأ المتداخلة فيها بـ `SYSTEM_RUN_DENIED` أو `INVALID_REQUEST`، بحيث لا يتم الإبلاغ عن أمر محظور كتشتغيل ناجح بينما لا تُعامل صياغة المساعد العادية كرفض.
- تتعامل عمليات cron المعزولة أيضًا مع إخفاقات الوكيل على مستوى التشغيل كأخطاء مهمة حتى عندما لا يتم إنتاج حمولة رد، بحيث تزيد إخفاقات النموذج/الموفر عدادات الأخطاء وتطلق إشعارات الفشل بدلًا من مسح المهمة كناجحة.
- عندما تصل مهمة دورة وكيل معزولة إلى `timeoutSeconds`، يوقف cron تشغيل الوكيل الأساسي ويمنحه نافذة تنظيف قصيرة. إذا لم يُصرّف التشغيل، فإن التنظيف المملوك لـ Gateway يفرض مسح ملكية جلسة ذلك التشغيل قبل أن يسجل cron انتهاء المهلة، بحيث لا يبقى عمل الدردشة في الصف خلف جلسة معالجة قديمة.
- إذا توقفت دورة وكيل معزولة قبل بدء المشغّل أو قبل أول استدعاء للنموذج، يسجل cron انتهاء مهلة خاصًا بالمرحلة مثل `setup timed out before runner start` أو `stalled before first model call (last phase: context-engine)`. تغطي أدوات المراقبة هذه الموفرين المضمنين والموفرين المدعومين بـ CLI قبل أن تبدأ عملية CLI الخارجية فعليًا، وتُحدّ بشكل مستقل عن قيم `timeoutSeconds` الطويلة بحيث تظهر إخفاقات البدء البارد/المصادقة/السياق بسرعة بدلًا من انتظار ميزانية المهمة كاملة.
- إذا كنت تستخدم cron النظام أو مجدولًا خارجيًا آخر لتشغيل `openclaw agent`، فلفّه بتصعيد قتل صارم حتى وإن كان CLI يتعامل مع `SIGTERM`/`SIGINT`. تطلب عمليات التشغيل المدعومة بـ Gateway من Gateway إيقاف عمليات التشغيل المقبولة؛ وتتلقى عمليات التشغيل المحلية والمضمنة الاحتياطية إشارة الإيقاف نفسها. بالنسبة إلى `timeout` في GNU، فضّل `timeout -k 60 600 openclaw agent ...` على `timeout 600 ...` العادي؛ قيمة `-k` هي حاجز المشرف إذا تعذر تصريف العملية. بالنسبة إلى وحدات systemd، حافظ على الشكل نفسه باستخدام إشارة إيقاف `SIGTERM` مع نافذة سماح مثل `TimeoutStopSec` قبل أي قتل نهائي. إذا أعادت محاولة استخدام `--run-id` بينما لا يزال تشغيل Gateway الأصلي نشطًا، يتم الإبلاغ عن النسخة المكررة بأنها قيد التنفيذ بدلًا من بدء تشغيل ثانٍ.

<a id="maintenance"></a>

<Note>
تسوية المهام في cron مملوكة لوقت التشغيل أولًا، ومدعومة بسجل دائم ثانيًا: تبقى مهمة cron النشطة حية ما دام وقت تشغيل cron لا يزال يتتبع تلك المهمة كقيد التشغيل، حتى إذا كان صف جلسة فرعية قديم لا يزال موجودًا. بمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي نافذة السماح البالغة 5 دقائق، تتحقق الصيانة من سجلات التشغيل المستبقاة وحالة المهمة لتشغيل `cron:<jobId>:<startedAt>` المطابق. إذا أظهر ذلك السجل الدائم نتيجة نهائية، يتم إنهاء دفتر المهام بناءً عليها؛ وإلا يمكن للصيانة المملوكة لـ Gateway وسم المهمة بأنها `lost`. يمكن لتدقيق CLI دون اتصال الاسترداد من السجل الدائم، لكنه لا يعامل مجموعة المهام النشطة الفارغة داخل عمليته كدليل على اختفاء تشغيل cron مملوك لـ Gateway.
</Note>

## أنواع الجدولة

| النوع    | علم CLI  | الوصف                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لمرة واحدة (ISO 8601 أو نسبي مثل `20m`)    |
| `every` | `--every` | فاصل ثابت                                          |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري |

تُعامل الطوابع الزمنية التي لا تحتوي على منطقة زمنية كـ UTC. أضف `--tz America/New_York` للجدولة وفق الساعة الجدارية المحلية.

تُزاح تعبيرات التكرار عند رأس الساعة تلقائيًا بما يصل إلى 5 دقائق لتقليل ذروات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تُحلل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون حقلا يوم الشهر ويوم الأسبوع غير شاملين، يطابق croner عندما يطابق **أي** من الحقلين، وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

يعمل هذا نحو 5-6 مرات شهريًا بدلًا من 0-1 مرة شهريًا. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لاشتراط تحقق الشرطين معًا، استخدم معدل يوم الأسبوع `+` في Croner (`0 9 15 * +1`) أو جدولت على حقل واحد واحرس الآخر في مطالبة المهمة أو أمرها.

## أنماط التنفيذ

| النمط           | قيمة `--session`   | يعمل في                  | الأنسب لـ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| الجلسة الرئيسية    | `main`              | مسار إيقاظ مخصص لـ cron | التذكيرات، أحداث النظام        |
| معزول        | `isolated`          | `cron:<jobId>` مخصص | التقارير، الأعمال الخلفية      |
| الجلسة الحالية | `current`           | مرتبط وقت الإنشاء   | العمل المتكرر الواعي بالسياق    |
| جلسة مخصصة  | `session:custom-id` | جلسة مسماة مستمرة | سير العمل الذي يبني على السجل |

<AccordionGroup>
  <Accordion title="الجلسة الرئيسية مقابل المعزولة مقابل المخصصة">
    تقوم مهام **الجلسة الرئيسية** بإدراج حدث نظام في مسار تشغيل مملوك لـ cron وتوقظ Heartbeat اختياريًا (`--wake now` أو `--wake next-heartbeat`). يمكنها استخدام سياق التسليم الأخير للجلسة الرئيسية المستهدفة للردود، لكنها لا تلحق دورات cron الروتينية بمسار الدردشة البشرية ولا تمدد حداثة إعادة الضبط اليومية/الخاملة للجلسة المستهدفة. تعمل المهام **المعزولة** كدورة وكيل مخصصة بجلسة جديدة. تستبقي **الجلسات المخصصة** (`session:xxx`) السياق عبر عمليات التشغيل، ما يمكّن سير عمل مثل الاجتماعات اليومية التي تبني على الملخصات السابقة.

    أحداث cron للجلسة الرئيسية هي تذكيرات أحداث نظام مكتفية ذاتيًا. وهي لا
    تتضمن تلقائيًا تعليمة مطالبة Heartbeat الافتراضية "Read
    HEARTBEAT.md". إذا كان ينبغي لتذكير متكرر الرجوع إلى
    `HEARTBEAT.md`، فقل ذلك صراحة في نص حدث cron أو في
    تعليمات الوكيل نفسه.

  </Accordion>
  <Accordion title="ما معنى 'جلسة جديدة' للمهام المعزولة">
    بالنسبة إلى المهام المعزولة، تعني "جلسة جديدة" معرّف نسخة نصية/جلسة جديدًا لكل تشغيل. قد يحمل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السرعة/الإسهاب، والتسميات، وتجاوزات النموذج/المصادقة التي اختارها المستخدم صراحة، لكنه لا يرث سياق المحادثة المحيط من صف cron أقدم: توجيه القناة/المجموعة، سياسة الإرسال أو الصف، الرفع، الأصل، أو ربط وقت تشغيل ACP. استخدم `current` أو `session:<id>` عندما ينبغي لمهمة متكررة أن تبني عمدًا على سياق المحادثة نفسه.
  </Accordion>
  <Accordion title="تنظيف وقت التشغيل">
    بالنسبة إلى المهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيفًا بأفضل جهد للمتصفح لتلك جلسة cron. يتم تجاهل إخفاقات التنظيف بحيث تظل نتيجة cron الفعلية هي التي تسود.

    تتخلص عمليات cron المعزولة أيضًا من أي نُسخ وقت تشغيل MCP مضمّنة أُنشئت للمهمة عبر مسار تنظيف وقت التشغيل المشترك. يطابق هذا كيفية تفكيك عملاء MCP للجلسة الرئيسية والجلسة المخصصة، بحيث لا تسرب مهام cron المعزولة عمليات stdio فرعية أو اتصالات MCP طويلة العمر عبر عمليات التشغيل.

  </Accordion>
  <Accordion title="تسليم الوكيل الفرعي وDiscord">
    عندما تنسق عمليات cron المعزولة وكلاء فرعيين، يفضّل التسليم أيضًا مخرجات السليل النهائية على النص المؤقت القديم للأصل. إذا كانت السلالات لا تزال قيد التشغيل، يكبت OpenClaw ذلك التحديث الجزئي من الأصل بدلًا من إعلانه.

    بالنسبة إلى أهداف إعلان Discord النصية فقط، يرسل OpenClaw النص النهائي القانوني للمساعد مرة واحدة بدلًا من إعادة تشغيل كل من حمولات النص المتدفقة/الوسيطة والإجابة النهائية. لا تزال حمولات الوسائط وDiscord المنظمة تُسلّم كحمولات منفصلة حتى لا تُسقط المرفقات والمكونات.

  </Accordion>
</AccordionGroup>

### حمولات الأوامر

استخدم حمولات الأوامر للبرامج النصية الحتمية التي ينبغي أن تعمل داخل مجدول Gateway دون بدء دورة وكيل معزولة مدعومة بنموذج. تُنفذ مهام الأوامر على مضيف Gateway، وتلتقط stdout/stderr، وتسجل التشغيل في سجل cron، وتعيد استخدام أوضاع التسليم `announce` و`webhook` و`none` نفسها مثل المهام المعزولة.

<Note>
أوامر cron هي سطح أتمتة Gateway للمشغل-المسؤول، وليست استدعاء
`tools.exec` من الوكيل. يتطلب إنشاء مهام cron أو تحديثها أو إزالتها أو تشغيلها يدويًا
`operator.admin`؛ وتُنفذ عمليات الأوامر المجدولة لاحقًا داخل عملية
Gateway كأتمتة ألّفها ذلك المسؤول. تحكم سياسة تنفيذ الوكيل مثل
`tools.exec.mode` ومطالبات الموافقة وقوائم السماح بالأدوات لكل وكيل
أدوات exec المرئية للنموذج، وليس حمولات أوامر cron.
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

إذا كان stdout غير فارغ، فذلك النص هو النتيجة المُسلَّمة. إذا كان stdout فارغًا وكان stderr غير فارغ، فسيتم تسليم stderr. إذا كان كلا التدفقين موجودين، يسلّم Cron كتلة صغيرة `stdout:` / `stderr:`. يسجّل رمز خروج صفري التشغيل على أنه `ok`؛ أما الخروج غير الصفري، أو الإشارة، أو انتهاء المهلة، أو انتهاء مهلة عدم وجود مخرجات فيسجّل `error` ويمكن أن يفعّل تنبيهات الفشل. الأمر الذي يطبع `NO_REPLY` فقط يستخدم كبت الرمز الصامت العادي في Cron ولا ينشر أي شيء مرة أخرى في الدردشة.

### خيارات الحمولة للمهام المعزولة

<ParamField path="--message" type="string" required>
  نص المطالبة (مطلوب للمعزول).
</ParamField>
<ParamField path="--model" type="string">
  تجاوز النموذج؛ يستخدم النموذج المسموح المحدد للمهمة.
</ParamField>
<ParamField path="--fallbacks" type="string">
  قائمة نماذج احتياطية لكل مهمة، على سبيل المثال `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. مرّر `--fallbacks ""` لتشغيل صارم من دون بدائل احتياطية.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  عند `cron edit`، يزيل تجاوز البدائل الاحتياطية لكل مهمة لكي تتبع المهمة أسبقية البدائل الاحتياطية المضبوطة. لا يمكن دمجه مع `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  عند `cron edit`، يزيل تجاوز النموذج لكل مهمة لكي تتبع المهمة أسبقية اختيار نموذج Cron العادية (تجاوز جلسة Cron مخزّن إذا كان مضبوطًا، وإلا نموذج الوكيل/النموذج الافتراضي). لا يمكن دمجه مع `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  تجاوز مستوى التفكير.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  عند `cron edit`، يزيل تجاوز التفكير لكل مهمة لكي تتبع المهمة أسبقية التفكير العادية في Cron. لا يمكن دمجه مع `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تخطَّ حقن ملف تمهيد مساحة العمل.
</ParamField>
<ParamField path="--tools" type="string">
  قيّد الأدوات التي يمكن للمهمة استخدامها، على سبيل المثال `--tools exec,read`.
</ParamField>

يستخدم `--model` النموذج المسموح المحدد كنموذج أساسي لتلك المهمة. وهو ليس مماثلًا لتجاوز `/model` في جلسة الدردشة: لا تزال سلاسل البدائل الاحتياطية المضبوطة تُطبّق عندما يفشل النموذج الأساسي للمهمة. إذا لم يكن النموذج المطلوب مسموحًا به أو تعذّر حله، يفشل Cron التشغيل بخطأ تحقق صريح بدل الرجوع بصمت إلى اختيار نموذج الوكيل/النموذج الافتراضي للمهمة.

يمكن لمهام Cron أيضًا حمل `fallbacks` على مستوى الحمولة. عند وجودها، تستبدل تلك القائمة سلسلة البدائل الاحتياطية المضبوطة للمهمة. استخدم `fallbacks: []` في حمولة المهمة/API عندما تريد تشغيل Cron صارمًا يجرّب النموذج المحدد فقط. إذا كانت لدى مهمة `--model` لكن لا توجد بدائل احتياطية في الحمولة ولا في الضبط، يمرر OpenClaw تجاوز بدائل احتياطية فارغًا صريحًا لكي لا يُضاف النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي مخفي.

تجتاز فحوصات ما قبل التشغيل للمزوّد المحلي البدائل الاحتياطية المضبوطة قبل تعليم تشغيل Cron بأنه `skipped`؛ يحافظ `fallbacks: []` على صرامة مسار ما قبل التشغيل هذا.

أسبقية اختيار النموذج للمهام المعزولة هي:

1. تجاوز نموذج خطاف Gmail (عندما يأتي التشغيل من Gmail ويكون ذلك التجاوز مسموحًا)
2. `model` في حمولة المهمة
3. تجاوز نموذج جلسة Cron المخزّن الذي اختاره المستخدم
4. اختيار نموذج الوكيل/النموذج الافتراضي

يتبع الوضع السريع الاختيار الحي المحلول أيضًا. إذا كان ضبط النموذج المحدد يحتوي على `params.fastMode`، يستخدم Cron المعزول ذلك افتراضيًا. لا يزال تجاوز `fastMode` لجلسة مخزّنة يتغلب على الضبط في كلا الاتجاهين. يستخدم الوضع التلقائي حد `params.fastAutoOnSeconds` للنموذج المحدد عند وجوده، مع افتراض 60 ثانية افتراضيًا.

إذا صادف تشغيل معزول تسليمًا لتبديل نموذج حي، يعيد Cron المحاولة بالمزوّد/النموذج الذي تم التبديل إليه ويحفظ ذلك الاختيار الحي للتشغيل النشط قبل إعادة المحاولة. عندما يحمل التبديل أيضًا ملف تعريف مصادقة جديدًا، يحفظ Cron تجاوز ملف تعريف المصادقة ذلك للتشغيل النشط أيضًا. إعادة المحاولة محدودة: بعد المحاولة الأولية بالإضافة إلى محاولتي تبديل، يُجهض Cron بدل الدوران إلى الأبد.

قبل أن يدخل تشغيل Cron معزول إلى مشغّل الوكيل، يتحقق OpenClaw من نقاط نهاية المزوّد المحلي القابلة للوصول للمزوّدين المضبوطين `api: "ollama"` و`api: "openai-completions"` الذين يكون `baseUrl` لديهم local loopback أو شبكة خاصة أو `.local`. إذا كانت نقطة النهاية تلك معطّلة، يُسجّل التشغيل على أنه `skipped` مع خطأ واضح للمزوّد/النموذج بدل بدء استدعاء نموذج. تُخزَّن نتيجة نقطة النهاية مؤقتًا لمدة 5 دقائق، لذلك تشارك مهام كثيرة مستحقة تستخدم خادم Ollama أو vLLM أو SGLang أو LM Studio المحلي المعطّل نفسه مسبارًا صغيرًا واحدًا بدل إنشاء عاصفة طلبات. لا تزيد تشغيلات ما قبل تشغيل المزوّد التي تم تخطيها تراجع أخطاء التنفيذ؛ فعّل `failureAlert.includeSkipped` عندما تريد إشعارات تخطٍ متكررة.

## التسليم والمخرجات

| الوضع       | ما يحدث                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | يسلّم النص النهائي احتياطيًا إلى الهدف إذا لم يرسله الوكيل |
| `webhook`  | يرسل حمولة حدث الانتهاء عبر POST إلى URL                                |
| `none`     | لا يوجد تسليم احتياطي من المشغّل                                         |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى قناة. لموضوعات منتدى Telegram، استخدم `-1001234567890:topic:123`؛ يقبل OpenClaw أيضًا الاختصار المملوك من Telegram `-1001234567890:123`. يمكن لمستدعي RPC/الضبط المباشرين تمرير `delivery.threadId` كسلسلة أو رقم. يجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`، `user:<id>`). معرّفات غرف Matrix حساسة لحالة الأحرف؛ استخدم معرّف الغرفة الدقيق أو الصيغة `room:!room:server` من Matrix.

عندما يستخدم تسليم الإعلان `channel: "last"` أو يحذف `channel`، يمكن لهدف ذي بادئة مزوّد مثل `telegram:123` أن يحدد القناة قبل أن يرجع Cron إلى سجل الجلسة أو قناة مضبوطة واحدة. البادئات التي يعلنها Plugin المحمّل فقط هي محددات مزوّد. إذا كان `delivery.channel` صريحًا، فيجب أن تسمّي بادئة الهدف المزوّد نفسه؛ على سبيل المثال، يتم رفض `channel: "whatsapp"` مع `to: "telegram:123"` بدل ترك WhatsApp يفسّر معرّف Telegram كرقم هاتف. تظل بادئات نوع الهدف والخدمة مثل `channel:<id>` و`user:<id>` و`imessage:<handle>` و`sms:<number>` صياغة أهداف مملوكة للقناة، وليست محددات مزوّد.

بالنسبة للمهام المعزولة، يكون تسليم الدردشة مشتركًا. إذا كان مسار دردشة متاحًا، يمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. إذا أرسل الوكيل إلى الهدف المضبوط/الحالي، يتخطى OpenClaw الإعلان الاحتياطي. وإلا فإن `announce` و`webhook` و`none` تتحكم فقط في ما يفعله المشغّل بالرد النهائي بعد دور الوكيل.

عندما ينشئ وكيل تذكيرًا معزولًا من دردشة نشطة، يخزّن OpenClaw هدف التسليم الحي المحفوظ لمسار الإعلان الاحتياطي. قد تكون مفاتيح الجلسة الداخلية بأحرف صغيرة؛ لا يُعاد إنشاء أهداف تسليم المزوّد من تلك المفاتيح عندما يكون سياق الدردشة الحالي متاحًا.

يستخدم تسليم الإعلان الضمني قوائم السماح المضبوطة للقنوات للتحقق من الأهداف القديمة وإعادة توجيهها. موافقات مخزن اقتران الرسائل المباشرة ليست مستلمي أتمتة احتياطية؛ عيّن `delivery.to` أو اضبط إدخال `allowFrom` للقناة عندما ينبغي لمهمة مجدولة أن ترسل استباقيًا إلى رسالة مباشرة.

## لغة المخرجات

لا تستنتج مهام Cron لغة الرد من القناة أو الإعداد المحلي أو الرسائل السابقة.
ضع قاعدة اللغة في الرسالة أو القالب المجدول:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

بالنسبة إلى ملفات القوالب، أبقِ تعليمة اللغة في الموجّه المعروض وتحقّق من ملء العناصر النائبة مثل `{{language}}` قبل تشغيل المهمة. إذا خلط الناتج بين اللغات، فاجعل القاعدة صريحة، مثلًا: "استخدم الصينية للنص السردي وأبقِ المصطلحات التقنية بالإنجليزية."

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يعيّن `cron.failureDestination` الإعداد الافتراضي العام لإشعارات الفشل.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُعيّن أي منهما وكانت المهمة تُسلّم بالفعل عبر `announce`، فستعود إشعارات الفشل الآن إلى هدف الإعلان الأساسي هذا.
- لا يُدعم `delivery.failureDestination` إلا في مهام `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.
- يفعّل `failureAlert.includeSkipped: true` سياسة تنبيهات cron لمهمة أو على المستوى العام لإرسال تنبيهات متكررة عن عمليات التشغيل المتخطّاة. تحتفظ عمليات التشغيل المتخطّاة بعدّاد تخطٍّ متتالٍ منفصل، لذلك لا تؤثر في التراجع بعد أخطاء التنفيذ.

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

يمكن أن يوفّر Gateway نقاط نهاية HTTP webhook للمشغّلات الخارجية. فعّل ذلك في الإعدادات:

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
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    تُحل أسماء الخطافات المخصصة عبر `hooks.mappings` في الإعدادات. يمكن للتعيينات تحويل حمولات عشوائية إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات برمجية.
  </Accordion>
</AccordionGroup>

<Warning>
أبقِ نقاط نهاية الخطافات خلف loopback أو tailnet أو وكيل عكسي موثوق.

- استخدم رمز hook مخصصًا؛ لا تُعد استخدام رموز مصادقة Gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ يتم رفض `/`.
- اضبط `hooks.allowedAgentIds` لتحديد الوكيل الفعّال الذي يمكن أن يستهدفه hook، بما في ذلك الوكيل الافتراضي عند حذف `agentId`.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يحددها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسة المسموح بها.
- تُغلّف حمولات hook افتراضيًا بحدود أمان.

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

عندما يكون `hooks.enabled=true` ويكون `hooks.gmail.account` مضبوطًا، يشغّل Gateway الأمر `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء الاشتراك.

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
  <Step title="أنشئ الموضوع وامنح Gmail صلاحية الوصول للدفع">
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

يعيد `openclaw cron run <jobId>` النتيجة بعد وضع التشغيل اليدوي في قائمة الانتظار. استخدم `--wait` لخطافات إيقاف التشغيل، أو سكربتات الصيانة، أو أي أتمتة أخرى يجب أن تحظر التنفيذ حتى ينتهي التشغيل الموضوع في قائمة الانتظار. يستطلع وضع الانتظار قيمة `runId` المعادة بالضبط؛ ويخرج بالقيمة `0` للحالة `ok` وبقيمة غير صفرية للحالات `error` أو `skipped` أو انتهاء مهلة الانتظار.

تعيد أداة الوكيل `cron` ملخصات مهام مضغوطة (`id`، `name`، `enabled`، `nextRunAtMs`، `scheduleKind`، `lastRunStatus`) من `cron(action: "list")`؛ استخدم `cron(action: "get", jobId: "...")` لتعريف مهمة كامل واحد. يمكن لمستدعي Gateway المباشرين تمرير `compact: true` إلى `cron.list`؛ يؤدي حذفها إلى الحفاظ على الاستجابة الكاملة الحالية مع معاينات التسليم.

`openclaw cron create` هو اسم مستعار لـ `openclaw cron add`، ويمكن للمهام الجديدة استخدام جدول موضعي (`"0 9 * * 1"`، أو `"every 1h"`، أو `"20m"`، أو طابع زمني ISO) متبوعًا بموجه وكيل موضعي. استخدم `--webhook <url>` على `cron add|create` أو `cron edit` لإرسال حمولة التشغيل المنتهي بطريقة POST إلى نقطة نهاية HTTP. لا يمكن الجمع بين تسليم Webhook وأعلام تسليم المحادثة مثل `--announce` أو `--channel` أو `--to` أو `--thread-id` أو `--account`. في `cron edit`، تلغي `--clear-channel` و`--clear-to` و`--clear-thread-id` و`--clear-account` ضبط حقول التوجيه هذه كلًا على حدة (ويُرفض كل واحد منها مع علم الضبط المطابق له)، وهذا يختلف عن تعطيل `--no-deliver` لتسليم الرجوع الاحتياطي للمشغّل.

<Note>
ملاحظة تجاوز النموذج:

- يغيّر `openclaw cron add|edit --model ...` النموذج المحدد للمهمة.
- إذا كان النموذج مسموحًا به، فسيصل ذلك الموفّر/النموذج الدقيق إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا به أو تعذر حله، يفشل Cron التشغيل بخطأ تحقق صريح.
- يمكن لتصحيحات حمولة API `cron.update` ضبط `model: null` لمسح تجاوز نموذج مهمة مخزن.
- يمسح `openclaw cron edit <job-id> --clear-model` ذلك التجاوز من CLI (بنفس تأثير تصحيح `model: null`) ولا يمكن جمعه مع `--model`.
- تظل سلاسل الرجوع الاحتياطي المضبوطة سارية لأن `--model` في Cron هو أساسي للمهمة، وليس تجاوزًا للجلسة `/model`.
- يضبط `openclaw cron add|edit --fallbacks ...` حمولة `fallbacks`، مستبدلًا الرجوعات الاحتياطية المضبوطة لتلك المهمة؛ وتعطّل `--fallbacks ""` الرجوع الاحتياطي وتجعل التشغيل صارمًا. يمسح `openclaw cron edit <job-id> --clear-fallbacks` التجاوز الخاص بالمهمة.
- لا ينتقل `--model` العادي دون قائمة رجوع احتياطي صريحة أو مضبوطة إلى النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

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

يحد `maxConcurrentRuns` من إرسال Cron المجدول وتنفيذ دورة الوكيل المعزولة، وتكون قيمته الافتراضية 8. تستخدم دورات وكيل Cron المعزولة مسار التنفيذ المخصص لقائمة الانتظار `cron-nested` داخليًا، لذلك يتيح رفع هذه القيمة لتشغيلات LLM Cron المستقلة التقدم بالتوازي بدلًا من بدء أغلفتها الخارجية فقط. لا يوسّع هذا الإعداد مسار `nested` المشترك غير الخاص بـ Cron.

`cron.store` هو مفتاح مخزن منطقي ومسار استيراد doctor قديم. شغّل `openclaw doctor --fix` لاستيراد مخازن JSON الحالية إلى SQLite وأرشفتها؛ يجب أن تمر تغييرات Cron المستقبلية عبر CLI أو API الخاص بـ Gateway.

تعطيل Cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="سلوك إعادة المحاولة">
    **إعادة المحاولة لمرة واحدة**: الأخطاء العابرة (حد المعدل، الحمل الزائد، الشبكة، خطأ الخادم) تعاد محاولتها حتى 3 مرات مع تراجع أسي. الأخطاء الدائمة تُعطّل فورًا.

    **إعادة المحاولة المتكررة**: تراجع أسي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. يعاد ضبط التراجع بعد التشغيل الناجح التالي.

  </Accordion>
  <Accordion title="الصيانة">
    يزيل `cron.sessionRetention` (الافتراضي `24h`) إدخالات جلسات التشغيل المعزولة القديمة. يحد `cron.runLog.keepLines` من صفوف سجل التشغيل المحفوظة في SQLite لكل مهمة؛ ويُحتفظ بـ `maxBytes` لتوافق الإعدادات مع سجلات التشغيل القديمة المدعومة بالملفات.
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
    - تحقق من متغير الإعداد `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
    - تأكد من أن Gateway يعمل باستمرار.
    - بالنسبة إلى جداول `cron`، تحقق من المنطقة الزمنية (`--tz`) مقابل المنطقة الزمنية للمضيف.
    - تعني `reason: not-due` في خرج التشغيل أن التشغيل اليدوي فُحص باستخدام `openclaw cron run <jobId> --due` وأن موعد المهمة لم يحن بعد.

  </Accordion>
  <Accordion title="Cron عمل لكن دون تسليم">
    - يعني وضع التسليم `none` أنه لا يُتوقع إرسال رجوع احتياطي من المشغّل. لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message` عندما يتوفر مسار محادثة.
    - يعني هدف تسليم مفقود/غير صالح (`channel`/`to`) أن الإرسال الصادر تم تخطيه.
    - بالنسبة إلى Matrix، قد تفشل المهام المنسوخة أو القديمة التي تحتوي على معرّفات غرف `delivery.to` بأحرف صغيرة لأن معرّفات غرف Matrix حساسة لحالة الأحرف. عدّل المهمة إلى قيمة `!room:server` أو `room:!room:server` الدقيقة من Matrix.
    - أخطاء مصادقة القناة (`unauthorized`، `Forbidden`) تعني أن التسليم حُظر بسبب بيانات الاعتماد.
    - إذا أعاد التشغيل المعزول الرمز الصامت فقط (`NO_REPLY` / `no_reply`)، يمنع OpenClaw التسليم الصادر المباشر ويمنع أيضًا مسار ملخص الرجوع الاحتياطي الموضوع في قائمة الانتظار، لذلك لا يُنشر أي شيء مرة أخرى في المحادثة.
    - إذا كان يجب أن يراسل الوكيل المستخدم بنفسه، فتحقق من أن المهمة لديها مسار قابل للاستخدام (`channel: "last"` مع محادثة سابقة، أو قناة/هدف صريح).

  </Accordion>
  <Accordion title="يبدو أن Cron أو Heartbeat يمنع انتقال /new-style">
    - لا تعتمد حداثة إعادة الضبط اليومية والخاملة على `updatedAt`؛ راجع [إدارة الجلسات](/ar/concepts/session#session-lifecycle).
    - قد تحدث تنبيهات Cron، وتشغيلات Heartbeat، وإشعارات التنفيذ، ومسك سجلات Gateway صف الجلسة لأغراض التوجيه/الحالة، لكنها لا تمدد `sessionStartedAt` أو `lastInteractionAt`.
    - بالنسبة إلى الصفوف القديمة التي أُنشئت قبل وجود تلك الحقول، يمكن لـ OpenClaw استعادة `sessionStartedAt` من ترويسة جلسة transcript بصيغة JSONL عندما يظل الملف متاحًا. تستخدم الصفوف الخاملة القديمة دون `lastInteractionAt` وقت البدء المستعاد هذا كخط أساس للخمول.

  </Accordion>
  <Accordion title="ملاحظات المنطقة الزمنية">
    - يستخدم Cron دون `--tz` المنطقة الزمنية لمضيف Gateway.
    - تُعامل جداول `at` دون منطقة زمنية على أنها UTC.
    - يستخدم Heartbeat `activeHours` تحليل المنطقة الزمنية المضبوطة.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأتمتة](/ar/automation) — جميع آليات الأتمتة في لمحة
- [مهام الخلفية](/ar/automation/tasks) — سجل المهام لتنفيذات Cron
- [Heartbeat](/ar/gateway/heartbeat) — دورات الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعداد المنطقة الزمنية
