---
read_when:
    - جدولة مهام الخلفية أو التنبيهات
    - ربط المشغلات الخارجية (Webhook، Gmail) بـ OpenClaw
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Scheduled tasks
summary: المهام المجدولة وwebhooks ومشغلات Gmail PubSub لمجدول Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-07-02T08:18:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron هو المجدول المدمج في Gateway. يحتفظ بالمهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه تسليم المخرجات مرة أخرى إلى قناة دردشة أو نقطة نهاية Webhook.

## البدء السريع

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
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

## كيفية عمل cron

- يعمل Cron **داخل عملية Gateway** (وليس داخل النموذج).
- تستمر تعريفات المهام وحالة التشغيل وسجل التشغيل في قاعدة بيانات حالة SQLite المشتركة في OpenClaw، لذلك لا تؤدي عمليات إعادة التشغيل إلى فقدان الجداول.
- عند الترقية، شغّل `openclaw doctor --fix` لاستيراد ملفات `~/.openclaw/cron/jobs.json` و`jobs-state.json` و`runs/*.jsonl` القديمة إلى SQLite وإعادة تسميتها بلاحقة `.migrated`. يتم تخطي صفوف المهام المشوهة من وقت التشغيل ونسخها إلى `jobs-quarantine.json` لإصلاحها أو مراجعتها لاحقًا.
- ما زال `cron.store` يحدد مفتاح مخزن cron المنطقي ومسار استيراد doctor. بعد الاستيراد، لم يعد تعديل ملف JSON ذلك يغير مهام cron النشطة؛ استخدم `openclaw cron add|edit|remove` أو طرائق RPC الخاصة بـ cron في Gateway بدلًا من ذلك.
- تنشئ كل عمليات تنفيذ cron سجلات [مهمة خلفية](/ar/automation/tasks).
- عند بدء تشغيل Gateway، يُعاد جدولة مهام دورات الوكيل المعزولة المتأخرة خارج نافذة اتصال القناة بدلًا من إعادة تشغيلها فورًا، وبذلك يبقى بدء تشغيل Discord/Telegram وإعداد الأوامر الأصلية مستجيبين بعد عمليات إعادة التشغيل.
- تُحذف المهام لمرة واحدة (`--at`) تلقائيًا بعد النجاح افتراضيًا.
- تغلق تشغيلات cron المعزولة، قدر الإمكان، علامات تبويب/عمليات المتصفح المتتبعة لجلسة `cron:<jobId>` الخاصة بها عند اكتمال التشغيل، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة.
- تستطيع تشغيلات cron المعزولة التي تتلقى منحة التنظيف الذاتي الضيقة الخاصة بـ cron قراءة حالة المجدول، وقائمة ذاتية التصفية لمهمتها الحالية، وسجل تشغيل تلك المهمة، حتى تتمكن فحوصات الحالة/Heartbeat من فحص جدولها الخاص دون الحصول على وصول أوسع لتعديل cron.
- تحمي تشغيلات cron المعزولة أيضًا من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it`، و`pulling everything together`، وتلميحات مشابهة) ولم يعد أي تشغيل وكيل فرعي تابع مسؤولًا عن الإجابة النهائية، يعيد OpenClaw المطالبة مرة واحدة للحصول على النتيجة الفعلية قبل التسليم.
- تستخدم تشغيلات cron المعزولة بيانات وصفية منظمة لرفض التنفيذ من التشغيل المضمن، بما في ذلك أغلفة node-host `UNAVAILABLE` التي تبدأ رسالة الخطأ المتداخلة فيها بـ `SYSTEM_RUN_DENIED` أو `INVALID_REQUEST`، بحيث لا يُبلّغ عن أمر محظور كتشغيل ناجح، بينما لا يُعامل نثر المساعد العادي كرفض.
- تتعامل تشغيلات cron المعزولة أيضًا مع إخفاقات الوكيل على مستوى التشغيل كأخطاء مهام حتى عندما لا تُنتج حمولة رد، بحيث تزيد إخفاقات النموذج/المزوّد عدادات الأخطاء وتطلق إشعارات الفشل بدلًا من اعتبار المهمة ناجحة.
- عندما تصل مهمة دورة وكيل معزولة إلى `timeoutSeconds`، يجهض cron تشغيل الوكيل الأساسي ويمنحه نافذة تنظيف قصيرة. إذا لم يُفرّغ التشغيل، فإن التنظيف المملوك لـ Gateway يزيل قسرًا ملكية جلسة ذلك التشغيل قبل أن يسجل cron انتهاء المهلة، حتى لا يبقى عمل الدردشة المنتظر خلف جلسة معالجة قديمة.
- إذا توقفت دورة وكيل معزولة قبل بدء المشغل أو قبل أول استدعاء للنموذج، يسجل cron انتهاء مهلة خاصًا بالمرحلة مثل `setup timed out before runner start` أو `stalled before first model call (last phase: context-engine)`. تغطي هذه المراقبات المزوّدين المضمنين والمزوّدين المدعومين بـ CLI قبل بدء عملية CLI الخارجية فعليًا، وتُحدد بسقوف مستقلة عن قيم `timeoutSeconds` الطويلة حتى تظهر إخفاقات البدء البارد/المصادقة/السياق بسرعة بدلًا من انتظار ميزانية المهمة الكاملة.
- إذا كنت تستخدم cron النظامي أو مجدولًا خارجيًا آخر لتشغيل `openclaw agent`، فغلّفه بتصعيد قتل صارم حتى لو كان CLI يتعامل مع `SIGTERM`/`SIGINT`. تطلب التشغيلات المدعومة بـ Gateway من Gateway إجهاض التشغيلات المقبولة؛ وتتلقى تشغيلات الرجوع المحلية والمضمنة إشارة الإجهاض نفسها. بالنسبة إلى GNU `timeout`، فضّل `timeout -k 60 600 openclaw agent ...` على `timeout 600 ...` فقط؛ فقيمة `-k` هي مسند المشرف إذا تعذر تفريغ العملية. بالنسبة إلى وحدات systemd، حافظ على الشكل نفسه باستخدام إشارة إيقاف `SIGTERM` مع نافذة سماح مثل `TimeoutStopSec` قبل أي قتل نهائي. إذا أعادت محاولة استخدام `--run-id` بينما ما زال تشغيل Gateway الأصلي نشطًا، يُبلّغ عن النسخة المكررة على أنها قيد التنفيذ بدلًا من بدء تشغيل ثانٍ.

<a id="maintenance"></a>

<Note>
تسوية المهام الخاصة بـ cron مملوكة لوقت التشغيل أولًا ومدعومة بسجل دائم ثانيًا: تبقى مهمة cron النشطة حية ما دام وقت تشغيل cron ما زال يتتبع تلك المهمة على أنها قيد التشغيل، حتى إذا كان صف جلسة ابن قديم ما زال موجودًا. بمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي نافذة السماح البالغة 5 دقائق، تفحص الصيانة سجلات التشغيل المستمرة وحالة المهمة لتشغيل `cron:<jobId>:<startedAt>` المطابق. إذا أظهر ذلك السجل الدائم نتيجة نهائية، يُنجز دفتر المهام منها؛ وإلا يمكن للصيانة المملوكة لـ Gateway وسم المهمة بأنها `lost`. يستطيع تدقيق CLI غير المتصل التعافي من السجل الدائم، لكنه لا يعامل مجموعة المهام النشطة الفارغة داخل عمليته كدليل على اختفاء تشغيل cron مملوك لـ Gateway.
</Note>

## أنواع الجداول

| النوع    | علم CLI  | الوصف                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لمرة واحدة (ISO 8601 أو نسبي مثل `20m`)    |
| `every` | `--every` | فاصل ثابت                                          |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري |

تُعامل الطوابع الزمنية من دون منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة حسب وقت الحائط المحلي.

تُزاح تعبيرات التكرار عند رأس الساعة تلقائيًا بما يصل إلى 5 دقائق لتقليل ذروات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تُحلل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما لا يكون حقلا يوم الشهر ويوم الأسبوع حرفي بدل، يطابق croner عندما يطابق **أي** من الحقلين، وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

ينطلق هذا نحو 5-6 مرات في الشهر بدلًا من 0-1 مرة في الشهر. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لاشتراط تحقق الشرطين، استخدم معدّل يوم الأسبوع `+` في Croner (`0 9 15 * +1`) أو جدوِل على أحد الحقلين واحرس الآخر في مطالبة مهمتك أو أمرها.

## أنماط التنفيذ

| النمط           | قيمة `--session`   | يعمل في                  | الأنسب لـ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| الجلسة الرئيسية    | `main`              | مسار إيقاظ cron مخصص | التذكيرات، أحداث النظام        |
| معزول        | `isolated`          | `cron:<jobId>` مخصص | التقارير، الأعمال الخلفية      |
| الجلسة الحالية | `current`           | مرتبط عند وقت الإنشاء   | العمل المتكرر الواعي بالسياق    |
| جلسة مخصصة  | `session:custom-id` | جلسة مسماة مستمرة | سير العمل الذي يبني على السجل |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    تضيف مهام **الجلسة الرئيسية** حدث نظام إلى مسار تشغيل مملوك لـ cron وتوقظ Heartbeat اختياريًا (`--wake now` أو `--wake next-heartbeat`). يمكنها استخدام آخر سياق تسليم للجلسة الرئيسية المستهدفة للردود، لكنها لا تضيف دورات cron الروتينية إلى مسار دردشة الإنسان ولا تمدد حداثة إعادة الضبط اليومية/الخاملة للجلسة المستهدفة. تعمل المهام **المعزولة** كدورة وكيل مخصصة مع جلسة جديدة. تحتفظ **الجلسات المخصصة** (`session:xxx`) بالسياق عبر التشغيلات، مما يتيح سير عمل مثل الاجتماعات اليومية التي تبني على الملخصات السابقة.

    أحداث cron للجلسة الرئيسية هي تذكيرات أحداث نظام قائمة بذاتها. إنها لا
    تتضمن تلقائيًا تعليمة مطالبة Heartbeat الافتراضية "Read
    HEARTBEAT.md". إذا كان ينبغي لتذكير متكرر الرجوع إلى
    `HEARTBEAT.md`، فاذكر ذلك صراحة في نص حدث cron أو في
    تعليمات الوكيل نفسه.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    بالنسبة إلى المهام المعزولة، تعني "الجلسة الجديدة" معرف نسخة/جلسة جديدًا لكل تشغيل. قد يحمل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السرعة/الإسهاب، والتسميات، وتجاوزات النموذج/المصادقة المختارة صراحة من المستخدم، لكنه لا يرث سياق محادثة محيطًا من صف cron أقدم: توجيه القناة/المجموعة، وسياسة الإرسال أو قائمة الانتظار، والرفع، والأصل، أو ربط وقت تشغيل ACP. استخدم `current` أو `session:<id>` عندما ينبغي لمهمة متكررة أن تبني عمدًا على سياق المحادثة نفسه.
  </Accordion>
  <Accordion title="Runtime cleanup">
    بالنسبة إلى المهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيفًا للمتصفح، قدر الإمكان، لجلسة cron تلك. يتم تجاهل إخفاقات التنظيف حتى تبقى نتيجة cron الفعلية هي الحاسمة.

    تتخلص تشغيلات cron المعزولة أيضًا من أي نُسخ وقت تشغيل MCP مضمّنة أُنشئت للمهمة عبر مسار تنظيف وقت التشغيل المشترك. يطابق هذا طريقة تفكيك عملاء MCP للجلسة الرئيسية والجلسة المخصصة، بحيث لا تُسرّب مهام cron المعزولة عمليات فرعية عبر stdio أو اتصالات MCP طويلة العمر عبر التشغيلات.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    عندما تنسق تشغيلات cron المعزولة وكلاء فرعيين، يفضل التسليم أيضًا مخرج التابع النهائي على النص المؤقت القديم من الأصل. إذا كانت التوابع ما زالت قيد التشغيل، يكتم OpenClaw ذلك التحديث الجزئي من الأصل بدلًا من إعلانه.

    بالنسبة إلى أهداف إعلان Discord النصية فقط، يرسل OpenClaw نص المساعد النهائي القانوني مرة واحدة بدلًا من إعادة تشغيل كل من حمولات النص المتدفقة/الوسيطة والإجابة النهائية. ما زال يتم تسليم وسائط وحمولات Discord المنظمة كحمولات منفصلة حتى لا تُسقط المرفقات والمكونات.

  </Accordion>
</AccordionGroup>

### حمولات الأوامر

استخدم حمولات الأوامر للسكربتات الحتمية التي ينبغي أن تعمل داخل مجدول Gateway دون بدء دورة وكيل معزولة مدعومة بنموذج. تُنفذ مهام الأوامر على مضيف Gateway، وتلتقط stdout/stderr، وتسجل التشغيل في سجل cron، وتعيد استخدام أوضاع التسليم نفسها `announce` و`webhook` و`none` كالمهام المعزولة.

<Note>
أوامر cron هي سطح أتمتة إداري للمشغل في Gateway، وليست استدعاء
`tools.exec` من وكيل. يتطلب إنشاء مهام cron أو تحديثها أو إزالتها أو تشغيلها يدويًا
`operator.admin`؛ وتُنفذ تشغيلات الأوامر المجدولة لاحقًا داخل
عملية Gateway بصفتها أتمتة ألّفها ذلك المسؤول. تحكم سياسة تنفيذ الوكيل مثل
`tools.exec.mode` ومطالبات الموافقة وقوائم سماح الأدوات لكل وكيل
أدوات التنفيذ المرئية للنموذج، وليس حمولات أوامر cron.
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

يخزن `--command <shell>` القيمة `argv: ["sh", "-lc", <shell>]`. استخدم `--command-argv '["node","scripts/report.mjs"]'` عندما تريد تنفيذ argv دقيقًا دون تحليل shell. تتحكم الحقول الاختيارية `--command-env KEY=VALUE` و`--command-input` و`--timeout-seconds` و`--no-output-timeout-seconds` و`--output-max-bytes` في بيئة العملية وstdin وحدود المخرجات.

إذا كان stdout غير فارغ، فذلك النص هو النتيجة المسلّمة. إذا كان stdout فارغًا وكان stderr غير فارغ، فسيتم تسليم stderr. إذا كان كلا الدفقين موجودين، يسلّم cron كتلة صغيرة `stdout:` / `stderr:`. يسجّل رمز خروج صفري التشغيل على أنه `ok`؛ أما الخروج غير الصفري أو الإشارة أو انتهاء المهلة أو انتهاء مهلة عدم وجود مخرجات فيسجّل `error` ويمكن أن يؤدي إلى تشغيل تنبيهات الفشل. الأمر الذي يطبع `NO_REPLY` فقط يستخدم كبت رمز الصمت العادي في cron ولا ينشر أي شيء مرة أخرى في الدردشة.

### خيارات الحمولة للمهام المعزولة

<ParamField path="--message" type="string" required>
  نص الموجّه (مطلوب للمعزول).
</ParamField>
<ParamField path="--model" type="string">
  تجاوز النموذج؛ يستخدم النموذج المسموح المحدد للمهمة.
</ParamField>
<ParamField path="--fallbacks" type="string">
  قائمة نماذج احتياطية لكل مهمة، مثل `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. مرّر `--fallbacks ""` لتشغيل صارم بلا احتياطيات.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  عند `cron edit`، يزيل تجاوز الاحتياطي لكل مهمة بحيث تتبع المهمة أسبقية الاحتياطي المكوّنة. لا يمكن دمجه مع `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  عند `cron edit`، يزيل تجاوز النموذج لكل مهمة بحيث تتبع المهمة أسبقية اختيار النموذج العادية في cron (تجاوز جلسة cron مخزّن إن كان مضبوطًا، وإلا نموذج الوكيل/الافتراضي). لا يمكن دمجه مع `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  تجاوز مستوى التفكير.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  عند `cron edit`، يزيل تجاوز التفكير لكل مهمة بحيث تتبع المهمة أسبقية التفكير العادية في cron. لا يمكن دمجه مع `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تخطَّ حقن ملفات تمهيد مساحة العمل.
</ParamField>
<ParamField path="--tools" type="string">
  قيّد الأدوات التي يمكن للمهمة استخدامها، مثل `--tools exec,read`.
</ParamField>

يستخدم `--model` النموذج المسموح المحدد كنموذج أساسي لتلك المهمة. وهو ليس مثل تجاوز `/model` في جلسة دردشة: لا تزال سلاسل الاحتياطي المكوّنة تنطبق عندما يفشل النموذج الأساسي للمهمة. إذا لم يكن النموذج المطلوب مسموحًا به أو تعذّر حله، يفشل cron التشغيل بخطأ تحقق صريح بدل الرجوع بصمت إلى اختيار نموذج الوكيل/الافتراضي الخاص بالمهمة.

يمكن لمهام Cron أيضًا حمل `fallbacks` على مستوى الحمولة. عند وجودها، تستبدل تلك القائمة سلسلة الاحتياطي المكوّنة للمهمة. استخدم `fallbacks: []` في حمولة المهمة/API عندما تريد تشغيل Cron صارمًا يجرّب النموذج المحدد فقط. إذا كانت المهمة تحتوي على `--model` ولكن لا توجد احتياطيات في الحمولة ولا احتياطيات مكوّنة، يمرّر OpenClaw تجاوز احتياطي فارغًا صريحًا حتى لا يُضاف النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي مخفي.

تفحص اختبارات التمهيد المسبق للمزوّد المحلي الاحتياطيات المكوّنة قبل وسم تشغيل Cron بأنه `skipped`؛ يبقي `fallbacks: []` مسار التمهيد المسبق هذا صارمًا.

أسبقية اختيار النموذج للمهام المعزولة هي:

1. تجاوز نموذج ربط Gmail (عندما يأتي التشغيل من Gmail ويكون ذلك التجاوز مسموحًا)
2. `model` في حمولة كل مهمة
3. تجاوز نموذج جلسة Cron المخزّن المحدد من المستخدم
4. اختيار نموذج الوكيل/الافتراضي

يتبع الوضع السريع الاختيار الحي المحلول أيضًا. إذا كان تكوين النموذج المحدد يحتوي على `params.fastMode`، يستخدمه Cron المعزول افتراضيًا. يظل تجاوز `fastMode` لجلسة مخزّنة متقدمًا على التكوين في كلا الاتجاهين. يستخدم الوضع التلقائي حد `params.fastAutoOnSeconds` للنموذج المحدد عند وجوده، ويكون الافتراضي 60 ثانية.

إذا صادف تشغيل معزول تسليم تبديل نموذج حي، يعيد cron المحاولة بالمزوّد/النموذج الذي تم التبديل إليه ويحفظ ذلك الاختيار الحي للتشغيل النشط قبل إعادة المحاولة. عندما يحمل التبديل أيضًا ملف تعريف مصادقة جديدًا، يحفظ cron تجاوز ملف تعريف المصادقة ذلك للتشغيل النشط أيضًا. إعادة المحاولات محدودة: بعد المحاولة الأولية إضافة إلى محاولتي تبديل، يُجهض cron بدل الدوران إلى الأبد.

قبل أن يدخل تشغيل Cron معزول إلى مشغّل الوكيل، يتحقق OpenClaw من نقاط نهاية المزوّدين المحليين القابلة للوصول للمزوّدين المكوّنين `api: "ollama"` و`api: "openai-completions"` الذين يكون `baseUrl` لديهم local loopback أو شبكة خاصة أو `.local`. إذا كانت نقطة النهاية تلك متوقفة، يُسجّل التشغيل على أنه `skipped` مع خطأ واضح للمزوّد/النموذج بدل بدء استدعاء نموذج. تُخزّن نتيجة نقطة النهاية مؤقتًا لمدة 5 دقائق، لذلك تشترك عدة مهام مستحقة تستخدم خادم Ollama أو vLLM أو SGLang أو LM Studio المحلي نفسه المتوقف في مسبار صغير واحد بدل إنشاء عاصفة طلبات. لا تزيد عمليات التشغيل التي تم تخطيها في تمهيد المزوّد المسبق تراجع أخطاء التنفيذ؛ فعّل `failureAlert.includeSkipped` عندما تريد إشعارات تخطٍّ متكررة.

## التسليم والمخرجات

| الوضع       | ما يحدث                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | تسليم احتياطي للنص النهائي إلى الهدف إذا لم يرسل الوكيل |
| `webhook`  | POST حمولة حدث الانتهاء إلى URL                                |
| `none`     | لا يوجد تسليم احتياطي من المشغّل                                         |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى قناة. لموضوعات منتدى Telegram، استخدم `-1001234567890:topic:123`؛ يقبل OpenClaw أيضًا الاختصار المملوك من Telegram `-1001234567890:123`. يمكن لمستدعي RPC/التكوين المباشرين تمرير `delivery.threadId` كسلسلة أو رقم. يجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`، `user:<id>`). معرفات غرف Matrix حساسة لحالة الأحرف؛ استخدم معرف الغرفة الدقيق أو صيغة `room:!room:server` من Matrix.

عندما يستخدم تسليم الإعلان `channel: "last"` أو يحذف `channel`، يمكن لهدف ذي بادئة مزوّد مثل `telegram:123` اختيار القناة قبل أن يرجع cron إلى سجل الجلسة أو قناة مكوّنة واحدة. البادئات التي يعلن عنها Plugin المحمّل فقط هي محددات مزوّد. إذا كان `delivery.channel` صريحًا، فيجب أن تسمي بادئة الهدف المزوّد نفسه؛ على سبيل المثال، يُرفض `channel: "whatsapp"` مع `to: "telegram:123"` بدل السماح لـ WhatsApp بتفسير معرف Telegram كرقم هاتف. تظل بادئات نوع الهدف والخدمة مثل `channel:<id>` و`user:<id>` و`imessage:<handle>` و`sms:<number>` صيغة أهداف مملوكة للقناة، وليست محددات مزوّد.

بالنسبة للمهام المعزولة، يكون تسليم الدردشة مشتركًا. إذا كان مسار دردشة متاحًا، يمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. إذا أرسل الوكيل إلى الهدف المكوّن/الحالي، يتخطى OpenClaw إعلان الاحتياطي. وإلا فإن `announce` و`webhook` و`none` تتحكم فقط فيما يفعله المشغّل بالرد النهائي بعد دور الوكيل.

عندما ينشئ وكيل تذكيرًا معزولًا من دردشة نشطة، يخزّن OpenClaw هدف التسليم الحي المحفوظ لمسار إعلان الاحتياطي. قد تكون مفاتيح الجلسة الداخلية بأحرف صغيرة؛ لا تُعاد إعادة بناء أهداف تسليم المزوّدين من تلك المفاتيح عندما يكون سياق الدردشة الحالي متاحًا.

يستخدم تسليم الإعلان الضمني قوائم السماح للقنوات المكوّنة للتحقق من الأهداف القديمة وإعادة توجيهها. موافقات مخزن اقتران الرسائل المباشرة ليست مستلمي أتمتة احتياطية؛ عيّن `delivery.to` أو كوّن إدخال `allowFrom` للقناة عندما يجب أن ترسل مهمة مجدولة بشكل استباقي إلى رسالة مباشرة.

## لغة المخرجات

لا تستنتج مهام Cron لغة الرد من القناة أو الإعداد المحلي أو الرسائل
السابقة. ضع قاعدة اللغة في الرسالة أو القالب المجدول:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

بالنسبة لملفات القوالب، أبقِ تعليمة اللغة في الموجّه المعروض وتحقق من
ملء العناصر النائبة مثل `{{language}}` قبل تشغيل المهمة. إذا
مزجت المخرجات بين اللغات، فاجعل القاعدة صريحة، مثل: "Use Chinese
for narrative text and keep technical terms in English."

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يعيّن `cron.failureDestination` افتراضيًا عامًا لإشعارات الفشل.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُضبط أي منهما وكانت المهمة تسلّم بالفعل عبر `announce`، ترجع إشعارات الفشل الآن إلى هدف الإعلان الأساسي ذلك.
- لا يكون `delivery.failureDestination` مدعومًا إلا في مهام `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي `webhook`.
- يختار `failureAlert.includeSkipped: true` لمهمة أو سياسة تنبيه Cron عالمية الدخول في تنبيهات التشغيل المتخطى المتكررة. تحتفظ عمليات التشغيل المتخطاة بعداد تخطٍ متتالٍ منفصل، لذلك لا تؤثر في تراجع أخطاء التنفيذ.

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

يمكن لـ Gateway كشف نقاط نهاية Webhook عبر HTTP للمشغلات الخارجية. فعّلها في التكوين:

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

يجب أن يتضمن كل طلب رمز الربط عبر الترويسة:

- `Authorization: Bearer <token>` (موصى به)
- `x-openclaw-token: <token>`

تُرفض رموز سلسلة الاستعلام.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    أدرج حدث نظام في طابور الجلسة الرئيسية:

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
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    تُحل أسماء الروابط المخصصة عبر `hooks.mappings` في التكوين. يمكن للتعيينات تحويل أي حمولات إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات برمجية.
  </Accordion>
</AccordionGroup>

<Warning>
أبقِ نقاط نهاية الربط خلف local loopback أو tailnet أو وكيل عكسي موثوق.

- استخدم رمز hook مخصصًا؛ لا تُعد استخدام رموز مصادقة Gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ يتم رفض `/`.
- اضبط `hooks.allowedAgentIds` للحد من الوكيل الفعّال الذي يمكن أن يستهدفه hook، بما في ذلك الوكيل الافتراضي عند حذف `agentId`.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يختارها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلّف حمولات hook بحدود أمان افتراضيًا.

</Warning>

## تكامل Gmail PubSub

اربط مشغّلات صندوق وارد Gmail بـ OpenClaw عبر Google PubSub.

<Note>
**المتطلبات الأساسية:** CLI `gcloud`، و`gog` (gogcli)، وتفعيل hooks في OpenClaw، وTailscale لنقطة نهاية HTTPS العامة.
</Note>

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعدادات `hooks.gmail`، ويفعّل الإعداد المسبق لـ Gmail، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### بدء Gateway تلقائيًا

عندما يكون `hooks.enabled=true` و`hooks.gmail.account` مضبوطًا، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء الاشتراك.

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
  <Step title="إنشاء موضوع ومنح Gmail صلاحية وصول الدفع">
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
# سرد كل المهام
openclaw cron list

# جلب مهمة واحدة مخزنة بصيغة JSON
openclaw cron get <jobId>

# عرض مهمة واحدة، بما في ذلك مسار التسليم المحلول
openclaw cron show <jobId>

# تعديل مهمة
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# فرض تشغيل مهمة الآن
openclaw cron run <jobId>

# فرض تشغيل مهمة الآن وانتظار حالتها النهائية
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# التشغيل فقط إذا كان موعدها قد حان
openclaw cron run <jobId> --due

# عرض سجل التشغيل
openclaw cron runs --id <jobId> --limit 50

# عرض تشغيل محدد بدقة
openclaw cron runs --id <jobId> --run-id <runId>

# حذف مهمة
openclaw cron remove <jobId>

# اختيار الوكيل (إعدادات متعددة الوكلاء)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

يعيد `openclaw cron run <jobId>` بعد وضع التشغيل اليدوي في الصف. استخدم `--wait` لخطّافات الإيقاف، أو سكربتات الصيانة، أو أي أتمتة أخرى يجب أن تحجب التنفيذ حتى ينتهي التشغيل الموجود في الصف. يستطلع وضع الانتظار `runId` المُعاد بدقة؛ ويخرج بالقيمة `0` للحالة `ok` وبقيمة غير صفرية للحالات `error` أو `skipped` أو انتهاء مهلة الانتظار.

تعيد أداة الوكيل `cron` ملخصات مهام مضغوطة (`id`، `name`، `enabled`، `nextRunAtMs`، `scheduleKind`، `lastRunStatus`) من `cron(action: "list")`؛ استخدم `cron(action: "get", jobId: "...")` لتعريف مهمة كامل واحد. يمكن لمستدعي Gateway المباشرين تمرير `compact: true` إلى `cron.list`؛ ويؤدي حذفها إلى الحفاظ على الاستجابة الكاملة الحالية مع معاينات التسليم.

`openclaw cron create` هو اسم بديل لـ `openclaw cron add`، ويمكن للمهام الجديدة استخدام جدولة موضعية (`"0 9 * * 1"` أو `"every 1h"` أو `"20m"` أو طابع زمني ISO) يليها موجّه وكيل موضعي. استخدم `--webhook <url>` على `cron add|create` أو `cron edit` لإرسال حمولة التشغيل المكتمل بطريقة POST إلى نقطة نهاية HTTP. لا يمكن جمع تسليم Webhook مع أعلام تسليم الدردشة مثل `--announce` أو `--channel` أو `--to` أو `--thread-id` أو `--account`. في `cron edit`، تلغي `--clear-channel` و`--clear-to` و`--clear-thread-id` و`--clear-account` ضبط حقول التوجيه هذه كلٌّ على حدة (ويُرفض كل منها مع علم الضبط المطابق له)، وهذا يختلف عن تعطيل `--no-deliver` لتسليم الرجوع الاحتياطي الخاص بالمشغّل.

<Note>
ملاحظة تجاوز النموذج:

- يغيّر `openclaw cron add|edit --model ...` النموذج المحدد للمهمة.
- إذا كان النموذج مسموحًا به، يصل الموفّر/النموذج نفسه إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا به أو لا يمكن حله، يفشل Cron التشغيل بخطأ تحقق صريح.
- يمكن لرقع حمولة API `cron.update` ضبط `model: null` لمسح تجاوز نموذج مهمة مخزن.
- يمسح `openclaw cron edit <job-id> --clear-model` ذلك التجاوز من CLI (بنفس أثر رقعة `model: null`) ولا يمكن جمعه مع `--model`.
- تظل سلاسل الرجوع الاحتياطي المضبوطة مطبقة لأن Cron `--model` هو أساسي للمهمة، وليس تجاوز `/model` للجلسة.
- يضبط `openclaw cron add|edit --fallbacks ...` حمولة `fallbacks`، مستبدلًا عمليات الرجوع الاحتياطي المضبوطة لتلك المهمة؛ ويعطّل `--fallbacks ""` الرجوع الاحتياطي ويجعل التشغيل صارمًا. يمسح `openclaw cron edit <job-id> --clear-fallbacks` التجاوز الخاص بكل مهمة.
- لا ينتقل `--model` عادي بلا قائمة رجوع احتياطي صريحة أو مضبوطة إلى النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

</Note>

## الإعداد

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

يحد `maxConcurrentRuns` كلًا من إرسال Cron المجدول وتنفيذ دورات الوكيل المعزولة، وقيمته الافتراضية 8. تستخدم دورات وكيل Cron المعزولة داخليًا مسار تنفيذ `cron-nested` المخصص للصف، لذا فإن رفع هذه القيمة يسمح لعمليات تشغيل LLM الخاصة بـ Cron والمستقلة بالتقدم بالتوازي بدلًا من الاكتفاء ببدء أغلفة Cron الخارجية. لا يوسّع هذا الإعداد مسار `nested` المشترك غير الخاص بـ Cron.

`cron.store` هو مفتاح مخزن منطقي ومسار استيراد قديم عبر doctor. شغّل `openclaw doctor --fix` لاستيراد مخازن JSON الحالية إلى SQLite وأرشفتها؛ وينبغي أن تمر تغييرات Cron المستقبلية عبر CLI أو API Gateway.

تعطيل Cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="سلوك إعادة المحاولة">
    **إعادة محاولة لمرة واحدة**: يُعاد محاولة الأخطاء العابرة (حد المعدل، الحمل الزائد، الشبكة، خطأ الخادم) حتى 3 مرات مع تراجع أسي. تؤدي الأخطاء الدائمة إلى التعطيل فورًا.

    **إعادة محاولة متكررة**: تراجع أسي (من 30ث إلى 60د) بين المحاولات. يُعاد ضبط التراجع بعد التشغيل الناجح التالي.

  </Accordion>
  <Accordion title="الصيانة">
    يزيل `cron.sessionRetention` (الافتراضي `24h`) إدخالات جلسات التشغيل المعزولة القديمة. يحد `cron.runLog.keepLines` صفوف سجل التشغيل المحتفظ بها في SQLite لكل مهمة؛ ويتم الاحتفاظ بـ `maxBytes` للتوافق في الإعداد مع سجلات التشغيل القديمة المدعومة بالملفات.
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
  <Accordion title="Cron لا يبدأ">
    - تحقق من `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
    - تأكد من أن Gateway يعمل باستمرار.
    - بالنسبة إلى جداول `cron`، تحقق من المنطقة الزمنية (`--tz`) مقابل المنطقة الزمنية للمضيف.
    - يعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي فُحص باستخدام `openclaw cron run <jobId> --due` وأن موعد المهمة لم يحن بعد.

  </Accordion>
  <Accordion title="Cron بدأ لكن بلا تسليم">
    - يعني وضع التسليم `none` أنه لا يُتوقع إرسال رجوع احتياطي من المشغّل. لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message` عند توفر مسار دردشة.
    - يعني هدف التسليم المفقود/غير الصالح (`channel`/`to`) أن الإرسال الصادر تم تخطيه.
    - بالنسبة إلى Matrix، يمكن أن تفشل المهام المنسوخة أو القديمة ذات معرّفات غرف `delivery.to` المكتوبة بأحرف صغيرة لأن معرّفات غرف Matrix حساسة لحالة الأحرف. عدّل المهمة إلى قيمة `!room:server` أو `room:!room:server` الدقيقة من Matrix.
    - تعني أخطاء مصادقة القناة (`unauthorized`، `Forbidden`) أن التسليم حُظر بسبب بيانات الاعتماد.
    - إذا كان التشغيل المعزول يعيد الرمز الصامت فقط (`NO_REPLY` / `no_reply`)، فإن OpenClaw يمنع التسليم الصادر المباشر ويمنع أيضًا مسار ملخص الصف الاحتياطي، لذلك لا يُنشر شيء مرة أخرى في الدردشة.
    - إذا كان ينبغي للوكيل مراسلة المستخدم بنفسه، فتحقق من أن لدى المهمة مسارًا قابلًا للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

  </Accordion>
  <Accordion title="يبدو أن Cron أو Heartbeat يمنع انتقال نمط /new">
    - لا تعتمد حداثة إعادة الضبط اليومية والخاملة على `updatedAt`؛ راجع [إدارة الجلسات](/ar/concepts/session#session-lifecycle).
    - قد تحدّث إيقاظات Cron، وتشغيلات Heartbeat، وإشعارات exec، ومسك دفاتر Gateway صف الجلسة للتوجيه/الحالة، لكنها لا تمدد `sessionStartedAt` أو `lastInteractionAt`.
    - بالنسبة إلى الصفوف القديمة التي أُنشئت قبل وجود هذه الحقول، يستطيع OpenClaw استعادة `sessionStartedAt` من ترويسة جلسة transcript JSONL عندما يظل الملف متاحًا. تستخدم صفوف الخمول القديمة بلا `lastInteractionAt` وقت البدء المستعاد هذا كأساس خمول لها.

  </Accordion>
  <Accordion title="مزالق المناطق الزمنية">
    - يستخدم Cron بدون `--tz` المنطقة الزمنية لمضيف Gateway.
    - تُعامل جداول `at` بلا منطقة زمنية على أنها UTC.
    - يستخدم Heartbeat `activeHours` حل المنطقة الزمنية المضبوط.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأتمتة](/ar/automation) — جميع آليات الأتمتة في لمحة
- [المهام الخلفية](/ar/automation/tasks) — سجل المهام لتنفيذات Cron
- [Heartbeat](/ar/gateway/heartbeat) — دورات الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعداد المنطقة الزمنية
