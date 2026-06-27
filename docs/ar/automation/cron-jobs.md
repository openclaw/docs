---
read_when:
    - جدولة المهام الخلفية أو التنبيهات
    - ربط المشغلات الخارجية (Webhook، Gmail) بـ OpenClaw
    - تحديد الخيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Scheduled tasks
summary: المهام المجدولة، Webhook، ومشغلات Gmail PubSub لجدولة Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-06-27T17:08:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
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

## كيف يعمل cron

- يعمل Cron **داخل عملية Gateway** (وليس داخل النموذج).
- تبقى تعريفات المهام، وحالة وقت التشغيل، وسجل التشغيل محفوظة في قاعدة بيانات حالة SQLite المشتركة الخاصة بـ OpenClaw حتى لا تضيع الجداول الزمنية عند إعادة التشغيل.
- عند الترقية، شغّل `openclaw doctor --fix` لاستيراد ملفات `~/.openclaw/cron/jobs.json` و`jobs-state.json` و`runs/*.jsonl` القديمة إلى SQLite وإعادة تسميتها بلاحقة `.migrated`. يتم تخطي صفوف المهام المشوهة من وقت التشغيل ونسخها إلى `jobs-quarantine.json` لإصلاحها أو مراجعتها لاحقًا.
- لا يزال `cron.store` يحدد مفتاح مخزن cron المنطقي ومسار استيراد doctor. بعد الاستيراد، لم يعد تعديل ملف JSON هذا يغير مهام cron النشطة؛ استخدم `openclaw cron add|edit|remove` أو طرق cron RPC الخاصة بـ Gateway بدلًا من ذلك.
- تنشئ كل عمليات تنفيذ cron سجلات [مهام خلفية](/ar/automation/tasks).
- عند بدء تشغيل Gateway، تتم إعادة جدولة مهام دورة الوكيل المعزولة المتأخرة إلى خارج نافذة اتصال القناة بدلًا من إعادة تشغيلها فورًا، بحيث يظل بدء تشغيل Discord/Telegram وإعداد الأوامر الأصلية سريع الاستجابة بعد إعادة التشغيل.
- تُحذف المهام لمرة واحدة (`--at`) تلقائيًا بعد النجاح افتراضيًا.
- تبذل تشغيلات cron المعزولة جهدًا لإغلاق علامات تبويب/عمليات المتصفح المتتبعة لجلسة `cron:<jobId>` الخاصة بها عند اكتمال التشغيل، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- يمكن لتشغيلات cron المعزولة التي تتلقى منحة التنظيف الذاتي الضيقة الخاصة بـ cron أن تقرأ أيضًا حالة المجدول، وقائمة مفلترة ذاتيًا بمهمتها الحالية، وسجل تشغيل تلك المهمة، بحيث تستطيع فحوصات الحالة/Heartbeat فحص جدولها الخاص دون الحصول على وصول أوسع لتعديل cron.
- تحمي تشغيلات cron المعزولة أيضًا من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it` و`pulling everything together` وتلميحات مشابهة) ولم تعد أي عملية تشغيل لوكيل فرعي تابع مسؤولة عن الإجابة النهائية، يعيد OpenClaw المطالبة مرة واحدة للحصول على النتيجة الفعلية قبل التسليم.
- تستخدم تشغيلات cron المعزولة بيانات وصفية منظمة لرفض التنفيذ من التشغيل المضمن، بما في ذلك أغلفة مضيف العقدة `UNAVAILABLE` التي تبدأ رسالة الخطأ المتداخلة فيها بـ `SYSTEM_RUN_DENIED` أو `INVALID_REQUEST`، بحيث لا يتم الإبلاغ عن أمر محظور كتغيل ناجح بينما لا تُعامل نثرية المساعد العادية كرفض.
- تتعامل تشغيلات cron المعزولة أيضًا مع إخفاقات الوكيل على مستوى التشغيل كأخطاء في المهمة حتى عند عدم إنتاج حمولة رد، بحيث تزيد إخفاقات النموذج/الموفر عدادات الأخطاء وتطلق إشعارات الفشل بدلًا من مسح المهمة باعتبارها ناجحة.
- عندما تصل مهمة دورة وكيل معزولة إلى `timeoutSeconds`، يجهض cron تشغيل الوكيل الأساسي ويمنحه نافذة تنظيف قصيرة. إذا لم يفرغ التشغيل، فإن التنظيف المملوك لـ Gateway يمسح قسرًا ملكية جلسة ذلك التشغيل قبل أن يسجل cron المهلة، بحيث لا يبقى عمل الدردشة في الطابور خلف جلسة معالجة قديمة.
- إذا تعثرت دورة وكيل معزولة قبل بدء المشغّل أو قبل أول استدعاء للنموذج، يسجل cron مهلة خاصة بالمرحلة مثل `setup timed out before runner start` أو `stalled before first model call (last phase: context-engine)`. تغطي هذه المراقبات الموفرين المضمنين والموفرين المدعومين بـ CLI قبل بدء عملية CLI الخارجية فعليًا، وتُحدد بسقوف مستقلة عن قيم `timeoutSeconds` الطويلة بحيث تظهر إخفاقات البدء البارد/المصادقة/السياق بسرعة بدلًا من انتظار ميزانية المهمة كاملة.
- إذا كنت تستخدم cron النظام أو مجدولًا خارجيًا آخر لتشغيل `openclaw agent`، فلفّه بتصعيد قتل قسري حتى وإن كان CLI يتعامل مع `SIGTERM`/`SIGINT`. تطلب التشغيلات المدعومة بـ Gateway من Gateway إجهاض التشغيلات المقبولة؛ وتتلقى التشغيلات المحلية والمضمنة الاحتياطية إشارة الإجهاض نفسها. بالنسبة إلى GNU `timeout`، فضّل `timeout -k 60 600 openclaw agent ...` على `timeout 600 ...` العادي؛ قيمة `-k` هي حاجز المشرف الأخير إذا لم تتمكن العملية من التفريغ. بالنسبة إلى وحدات systemd، حافظ على الشكل نفسه باستخدام إشارة إيقاف `SIGTERM` مع نافذة سماح مثل `TimeoutStopSec` قبل أي قتل نهائي. إذا أعادت محاولة استخدام `--run-id` بينما لا يزال تشغيل Gateway الأصلي نشطًا، يتم الإبلاغ عن النسخة المكررة كقيد التنفيذ بدلًا من بدء تشغيل ثانٍ.

<a id="maintenance"></a>

<Note>
تسوية المهام الخاصة بـ cron مملوكة لوقت التشغيل أولًا ومدعومة بسجل دائم ثانيًا: تبقى مهمة cron النشطة حية ما دام وقت تشغيل cron لا يزال يتتبع تلك المهمة كقيد التشغيل، حتى إن كان صف جلسة فرعية قديم لا يزال موجودًا. بمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي نافذة السماح البالغة 5 دقائق، تتحقق الصيانة من سجلات التشغيل المحفوظة وحالة المهمة للتشغيل المطابق `cron:<jobId>:<startedAt>`. إذا أظهر ذلك السجل الدائم نتيجة نهائية، يُنهى دفتر المهام بناءً عليها؛ وإلا فيمكن للصيانة المملوكة لـ Gateway وسم المهمة بأنها `lost`. يمكن لتدقيق CLI غير المتصل الاسترداد من السجل الدائم، لكنه لا يتعامل مع مجموعته الفارغة الخاصة بالمهام النشطة داخل العملية كدليل على اختفاء تشغيل cron مملوك لـ Gateway.
</Note>

## أنواع الجداول الزمنية

| النوع    | علم CLI  | الوصف                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لمرة واحدة (ISO 8601 أو نسبي مثل `20m`)    |
| `every` | `--every` | فاصل زمني ثابت                                          |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري |

تُعامل الطوابع الزمنية التي لا تحتوي على منطقة زمنية كـ UTC. أضف `--tz America/New_York` للجدولة حسب ساعة الحائط المحلية.

تتم إزاحة التعبيرات المتكررة عند بداية الساعة تلقائيًا بما يصل إلى 5 دقائق لتقليل طفرات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تُحلل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما لا يكون حقلا يوم الشهر ويوم الأسبوع أحرف بدل، يطابق croner عندما يطابق **أي** من الحقلين — وليس كليهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

ينطلق هذا نحو 5-6 مرات شهريًا بدلًا من 0-1 مرة شهريًا. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لاشتراط كلا الشرطين، استخدم معدّل يوم الأسبوع `+` الخاص بـ Croner (`0 9 15 * +1`) أو جدْول على حقل واحد واحرس الآخر في مطالبة مهمتك أو أمرها.

## أساليب التنفيذ

| الأسلوب           | قيمة `--session`   | يعمل في                  | الأنسب لـ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| الجلسة الرئيسية    | `main`              | مسار إيقاظ cron مخصص | التذكيرات، أحداث النظام        |
| معزول        | `isolated`          | `cron:<jobId>` مخصص | التقارير، الأعمال الخلفية الروتينية      |
| الجلسة الحالية | `current`           | مرتبط وقت الإنشاء   | العمل المتكرر الواعي بالسياق    |
| جلسة مخصصة  | `session:custom-id` | جلسة مسماة مستمرة | سير العمل الذي يبني على السجل |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    تضع مهام **الجلسة الرئيسية** حدث نظام في مسار تشغيل مملوك لـ cron وتوقظ Heartbeat اختياريًا (`--wake now` أو `--wake next-heartbeat`). يمكنها استخدام آخر سياق تسليم للجلسة الرئيسية الهدف للردود، لكنها لا تضيف دورات cron الروتينية إلى مسار دردشة الإنسان ولا تمدد حداثة إعادة الضبط اليومية/الخاملة للجلسة الهدف. تعمل المهام **المعزولة** كدورة وكيل مخصصة مع جلسة جديدة. تحافظ **الجلسات المخصصة** (`session:xxx`) على السياق عبر التشغيلات، مما يتيح سير عمل مثل الوقفات اليومية التي تبني على الملخصات السابقة.

    أحداث cron في الجلسة الرئيسية هي تذكيرات أحداث نظام مستقلة. وهي
    لا تتضمن تلقائيًا تعليمة مطالبة Heartbeat الافتراضية "Read
    HEARTBEAT.md". إذا كان ينبغي لتذكير متكرر أن يرجع إلى
    `HEARTBEAT.md`، فقل ذلك صراحة في نص حدث cron أو في
    تعليمات الوكيل الخاصة.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    بالنسبة إلى المهام المعزولة، تعني "الجلسة الجديدة" معرّف نص/جلسة جديدًا لكل تشغيل. قد يحمل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السرعة/الإسهاب، والتسميات، وتجاوزات النموذج/المصادقة الصريحة التي اختارها المستخدم، لكنه لا يرث سياق المحادثة المحيط من صف cron أقدم: توجيه القناة/المجموعة، سياسة الإرسال أو الطابور، الرفع، الأصل، أو ربط وقت تشغيل ACP. استخدم `current` أو `session:<id>` عندما ينبغي لمهمة متكررة أن تبني عمدًا على سياق المحادثة نفسه.
  </Accordion>
  <Accordion title="Runtime cleanup">
    بالنسبة إلى المهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيف المتصفح بأفضل جهد لجلسة cron تلك. يتم تجاهل إخفاقات التنظيف حتى تظل نتيجة cron الفعلية هي الحاكمة.

    تتخلص تشغيلات cron المعزولة أيضًا من أي مثيلات وقت تشغيل MCP مضمّنة أُنشئت للمهمة عبر مسار تنظيف وقت التشغيل المشترك. يطابق هذا طريقة تفكيك عملاء MCP في الجلسة الرئيسية والجلسة المخصصة، بحيث لا تسرب مهام cron المعزولة عمليات stdio فرعية أو اتصالات MCP طويلة العمر عبر التشغيلات.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    عندما تنسق تشغيلات cron المعزولة وكلاء فرعيين، يفضل التسليم أيضًا مخرجات التابع النهائية على نص الأصل المؤقت القديم. إذا كان التابعون لا يزالون قيد التشغيل، يقمع OpenClaw ذلك التحديث الجزئي من الأصل بدلًا من إعلانه.

    بالنسبة إلى أهداف إعلان Discord النصية فقط، يرسل OpenClaw نص المساعد النهائي المعتمد مرة واحدة بدلًا من إعادة تشغيل حمولات النص المتدفقة/الوسيطة والإجابة النهائية معًا. لا تزال وسائط وحمولات Discord المنظمة تُسلّم كحمولات منفصلة حتى لا تُسقط المرفقات والمكونات.

  </Accordion>
</AccordionGroup>

### حمولات الأوامر

استخدم حمولات الأوامر للسكربتات الحتمية التي ينبغي تشغيلها داخل مجدول Gateway دون بدء دورة وكيل معزولة مدعومة بنموذج. تنفذ مهام الأوامر على مضيف Gateway، وتلتقط stdout/stderr، وتسجل التشغيل في سجل cron، وتعيد استخدام أوضاع التسليم نفسها `announce` و`webhook` و`none` الخاصة بالمهام المعزولة.

<Note>
أمر cron هو سطح أتمتة Gateway لمشرف المشغل، وليس استدعاء
`tools.exec` من الوكيل. يتطلب إنشاء مهام cron أو تحديثها أو إزالتها أو تشغيلها يدويًا
`operator.admin`؛ وتُنفذ تشغيلات الأوامر المجدولة لاحقًا داخل
عملية Gateway كأتمتة كتبها ذلك المشرف. سياسة تنفيذ الوكيل مثل
`tools.exec.mode`، ومطالبات الموافقة، وقوائم السماح للأدوات لكل وكيل تحكم
أدوات التنفيذ المرئية للنموذج، وليس حمولات cron للأوامر.
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

يخزن `--command <shell>` القيمة `argv: ["sh", "-lc", <shell>]`. استخدم `--command-argv '["node","scripts/report.mjs"]'` عندما تريد تنفيذ argv دقيقًا دون تحليل shell. تتحكم الحقول الاختيارية `--command-env KEY=VALUE` و`--command-input` و`--timeout-seconds` و`--no-output-timeout-seconds` و`--output-max-bytes` في بيئة العملية، وstdin، وحدود المخرجات.

إذا كان stdout غير فارغ، فذلك النص هو النتيجة المسلّمة. إذا كان stdout فارغًا وstderr غير فارغ، فسيتم تسليم stderr. إذا كان كلا الدفقين موجودين، يسلّم cron كتلة صغيرة `stdout:` / `stderr:`. يسجّل رمز الخروج الصفري التشغيل كـ `ok`؛ أما الخروج غير الصفري، أو الإشارة، أو انتهاء المهلة، أو انتهاء مهلة عدم وجود مخرجات فيسجّل `error` ويمكن أن يؤدي إلى تنبيهات فشل. الأمر الذي يطبع `NO_REPLY` فقط يستخدم كتم رمز الصمت العادي في cron ولا ينشر شيئًا إلى الدردشة.

### خيارات الحمولة للمهام المعزولة

<ParamField path="--message" type="string" required>
  نص المطالبة (مطلوب للمعزول).
</ParamField>
<ParamField path="--model" type="string">
  تجاوز النموذج؛ يستخدم النموذج المسموح المحدد للمهمة.
</ParamField>
<ParamField path="--fallbacks" type="string">
  قائمة نماذج fallback لكل مهمة، مثل `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. مرّر `--fallbacks ""` لتشغيل صارم بلا fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  في `cron edit`، يزيل تجاوز fallback لكل مهمة كي تتبع المهمة أسبقية fallback المكوّنة. لا يمكن دمجه مع `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  في `cron edit`، يزيل تجاوز النموذج لكل مهمة كي تتبع المهمة أسبقية اختيار نموذج cron العادية (تجاوز جلسة cron مخزّن إذا كان مضبوطًا، وإلا نموذج الوكيل/الافتراضي). لا يمكن دمجه مع `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  تجاوز مستوى التفكير.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تخطّي حقن ملف تمهيد مساحة العمل.
</ParamField>
<ParamField path="--tools" type="string">
  تقييد الأدوات التي يمكن للمهمة استخدامها، مثل `--tools exec,read`.
</ParamField>

يستخدم `--model` النموذج المسموح المحدد كنموذج أساسي لتلك المهمة. ليس هذا مثل تجاوز `/model` في جلسة دردشة: ما زالت سلاسل fallback المكوّنة تنطبق عند فشل النموذج الأساسي للمهمة. إذا لم يكن النموذج المطلوب مسموحًا أو تعذّر حله، يفشل cron التشغيل بخطأ تحقق صريح بدل الرجوع الصامت إلى اختيار نموذج وكيل/افتراضي للمهمة.

يمكن لمهام Cron أيضًا حمل `fallbacks` على مستوى الحمولة. عند وجودها، تستبدل تلك القائمة سلسلة fallback المكوّنة للمهمة. استخدم `fallbacks: []` في حمولة/API المهمة عندما تريد تشغيل cron صارمًا لا يجرّب إلا النموذج المحدد. إذا كانت لدى مهمة `--model` لكن لا توجد fallbacks في الحمولة ولا في الإعدادات، يمرّر OpenClaw تجاوز fallback فارغًا صريحًا كي لا يُلحَق النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي مخفي.

تجتاز فحوصات ما قبل التشغيل للمزوّد المحلي fallbacks المكوّنة قبل وسم تشغيل cron بأنه `skipped`؛ يحافظ `fallbacks: []` على صرامة مسار ما قبل التشغيل هذا.

أسبقية اختيار النموذج للمهام المعزولة هي:

1. تجاوز نموذج خطاف Gmail (عندما يأتي التشغيل من Gmail ويكون ذلك التجاوز مسموحًا)
2. `model` في حمولة المهمة
3. تجاوز نموذج جلسة cron المخزّن الذي اختاره المستخدم
4. اختيار نموذج الوكيل/الافتراضي

يتبع الوضع السريع الاختيار المباشر المحلول أيضًا. إذا كان إعداد النموذج المحدد يحتوي على `params.fastMode`، يستخدم cron المعزول ذلك افتراضيًا. ما زال تجاوز `fastMode` المخزّن للجلسة ينتصر على الإعداد في أي اتجاه. يستخدم الوضع التلقائي حد `params.fastAutoOnSeconds` للنموذج المحدد عند وجوده، مع افتراض 60 ثانية.

إذا صادف تشغيل معزول تسليم تبديل نموذج مباشر، يعيد cron المحاولة بالمزوّد/النموذج المُبدّل ويحفظ ذلك الاختيار المباشر للتشغيل النشط قبل إعادة المحاولة. عندما يحمل التبديل أيضًا ملف تعريف مصادقة جديدًا، يحفظ cron تجاوز ملف تعريف المصادقة ذلك للتشغيل النشط أيضًا. إعادة المحاولة محدودة: بعد المحاولة الأولية إضافة إلى محاولتي تبديل، يوقف cron العملية بدل الدوران إلى الأبد.

قبل أن يدخل تشغيل cron معزول إلى مشغّل الوكيل، يتحقق OpenClaw من نقاط نهاية المزوّد المحلي القابلة للوصول لمزوّدي `api: "ollama"` و`api: "openai-completions"` المكوّنين الذين يكون `baseUrl` لديهم local loopback أو شبكة خاصة أو `.local`. إذا كانت نقطة النهاية تلك معطّلة، يُسجّل التشغيل كـ `skipped` مع خطأ مزوّد/نموذج واضح بدل بدء استدعاء نموذج. تُخزّن نتيجة نقطة النهاية مؤقتًا لمدة 5 دقائق، لذا تشارك العديد من المهام المستحقة التي تستخدم خادم Ollama أو vLLM أو SGLang أو LM Studio المحلي المعطّل نفسه فحصًا صغيرًا واحدًا بدل إنشاء عاصفة طلبات. لا تزيد تشغيلات ما قبل فحص المزوّد المتخطّاة من التراجع بسبب أخطاء التنفيذ؛ فعّل `failureAlert.includeSkipped` عندما تريد إشعارات تخطٍّ متكررة.

## التسليم والمخرجات

| الوضع       | ما يحدث                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | يسلّم النص النهائي احتياطيًا إلى الهدف إذا لم يرسله الوكيل |
| `webhook`  | يرسل حمولة حدث الانتهاء إلى URL عبر POST                                |
| `none`     | لا يوجد تسليم احتياطي من المشغّل                                         |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى قناة. لموضوعات منتدى Telegram، استخدم `-1001234567890:topic:123`؛ يقبل OpenClaw أيضًا الاختصار المملوك لـ Telegram‏ `-1001234567890:123`. يمكن لمستدعي RPC/الإعداد المباشرين تمرير `delivery.threadId` كسلسلة نصية أو رقم. ينبغي أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`, `user:<id>`). معرّفات غرف Matrix حساسة لحالة الأحرف؛ استخدم معرّف الغرفة الدقيق أو صيغة `room:!room:server` من Matrix.

عندما يستخدم تسليم الإعلان `channel: "last"` أو يحذف `channel`، يمكن لهدف مسبوق بالمزوّد مثل `telegram:123` اختيار القناة قبل أن يرجع cron إلى سجل الجلسة أو قناة واحدة مكوّنة. البادئات التي يعلنها Plugin المحمّل فقط هي محددات المزوّد. إذا كان `delivery.channel` صريحًا، فيجب أن تسمي بادئة الهدف المزوّد نفسه؛ على سبيل المثال، يتم رفض `channel: "whatsapp"` مع `to: "telegram:123"` بدل السماح لـ WhatsApp بتفسير معرّف Telegram كرقم هاتف. تظل بادئات نوع الهدف والخدمة مثل `channel:<id>` و`user:<id>` و`imessage:<handle>` و`sms:<number>` صياغة أهداف مملوكة للقناة، وليست محددات مزوّد.

بالنسبة للمهام المعزولة، يكون تسليم الدردشة مشتركًا. إذا كان مسار دردشة متاحًا، يمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. إذا أرسل الوكيل إلى الهدف المكوّن/الحالي، يتخطّى OpenClaw إعلان fallback. وإلا فإن `announce` و`webhook` و`none` لا تتحكم إلا فيما يفعله المشغّل بالرد النهائي بعد دورة الوكيل.

عندما ينشئ وكيل تذكيرًا معزولًا من دردشة نشطة، يخزّن OpenClaw هدف التسليم المباشر المحفوظ لمسار إعلان fallback. قد تكون مفاتيح الجلسة الداخلية بأحرف صغيرة؛ لا يُعاد بناء أهداف تسليم المزوّد من تلك المفاتيح عندما يكون سياق الدردشة الحالي متاحًا.

يستخدم تسليم الإعلان الضمني قوائم السماح للقنوات المكوّنة للتحقق من الأهداف القديمة وإعادة توجيهها. موافقات مخزن إقران الرسائل المباشرة ليست مستلمي أتمتة fallback؛ اضبط `delivery.to` أو كوّن إدخال `allowFrom` للقناة عندما ينبغي لمهمة مجدولة أن ترسل استباقيًا إلى رسالة مباشرة.

## لغة المخرجات

لا تستنتج مهام Cron لغة الرد من القناة أو الإعداد المحلي أو الرسائل السابقة. ضع قاعدة اللغة في الرسالة أو القالب المجدول:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

بالنسبة لملفات القوالب، أبقِ تعليمات اللغة في المطالبة الناتجة وتحقق من ملء العناصر النائبة مثل `{{language}}` قبل تشغيل المهمة. إذا مزجت المخرجات بين لغات، فاجعل القاعدة صريحة، مثل: "Use Chinese for narrative text and keep technical terms in English."

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يضبط `cron.failureDestination` افتراضيًا عامًا لإشعارات الفشل.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُضبط أي منهما وكانت المهمة تسلّم بالفعل عبر `announce`، فإن إشعارات الفشل ترجع الآن إلى هدف الإعلان الأساسي ذلك.
- لا يُدعم `delivery.failureDestination` إلا في مهام `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.
- يتيح `failureAlert.includeSkipped: true` لمهمة أو سياسة تنبيه cron عامة تلقي تنبيهات متكررة للتشغيلات المتخطّاة. تحتفظ التشغيلات المتخطّاة بعدّاد تخطٍّ متتالٍ منفصل، لذلك لا تؤثر في التراجع بسبب أخطاء التنفيذ.

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
  <Tab title="مخرجات Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="مخرجات الأمر">
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

يمكن لـ Gateway كشف نقاط نهاية Webhook عبر HTTP للمشغّلات الخارجية. فعّلها في الإعداد:

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

يتم رفض الرموز في سلسلة الاستعلام.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    أدرج حدث نظام في الصف للجلسة الرئيسية:

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
  <Accordion title="الخطافات المعيّنة (POST /hooks/<name>)">
    تُحل أسماء الخطافات المخصصة عبر `hooks.mappings` في الإعداد. يمكن للتعيينات تحويل حمولات عشوائية إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات كود.
  </Accordion>
</AccordionGroup>

<Warning>
أبقِ نقاط نهاية الخطافات خلف loopback أو tailnet أو وكيل عكسي موثوق.

- استخدم رمز خطاف مخصصًا؛ لا تعِد استخدام رموز مصادقة Gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ يتم رفض `/`.
- اضبط `hooks.allowedAgentIds` للحد من الوكيل الفعلي الذي يمكن للخطاف استهدافه، بما في ذلك الوكيل الافتراضي عند حذف `agentId`.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يختارها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلّف حمولات الخطافات بحدود أمان افتراضيًا.

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

يكتب هذا إعدادات `hooks.gmail`، ويمكّن الإعداد المسبق لـ Gmail، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### التشغيل التلقائي لـ Gateway

عند ضبط `hooks.enabled=true` وتعيين `hooks.gmail.account`، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيًا. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء الاشتراك.

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
  <Step title="إنشاء topic ومنح Gmail حق الوصول للدفع">
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

يعيد `openclaw cron run <jobId>` النتيجة بعد وضع التشغيل اليدوي في قائمة الانتظار. استخدم `--wait` لخطافات إيقاف التشغيل أو سكربتات الصيانة أو أي أتمتة أخرى يجب أن تنتظر حتى يكتمل التشغيل الموضوع في قائمة الانتظار. يستطلع وضع الانتظار قيمة `runId` المعادة بالضبط؛ ويخرج بالرمز `0` للحالة `ok` وبقيمة غير صفرية للحالات `error` أو `skipped` أو عند انتهاء مهلة الانتظار.

تعيد أداة الوكيل `cron` ملخصات مضغوطة للمهام (`id`، `name`، `enabled`، `nextRunAtMs`، `scheduleKind`، `lastRunStatus`) من `cron(action: "list")`؛ استخدم `cron(action: "get", jobId: "...")` للحصول على تعريف كامل لمهمة واحدة. يمكن لمستدعي Gateway المباشرين تمرير `compact: true` إلى `cron.list`؛ وإسقاطها يحافظ على الاستجابة الكاملة الحالية مع معاينات التسليم.

`openclaw cron create` هو اسم بديل لـ `openclaw cron add`، ويمكن للمهام الجديدة استخدام جدول موضعي (`"0 9 * * 1"` أو `"every 1h"` أو `"20m"` أو طابع زمني ISO) يتبعه موجه وكيل موضعي. استخدم `--webhook <url>` مع `cron add|create` أو `cron edit` لإرسال حمولة التشغيل المكتمل بطريقة POST إلى نقطة نهاية HTTP. لا يمكن دمج تسليم Webhook مع أعلام تسليم الدردشة مثل `--announce` أو `--channel` أو `--to` أو `--thread-id` أو `--account`. في `cron edit`، تلغي `--clear-channel` و`--clear-to` و`--clear-thread-id` و`--clear-account` تعيين حقول التوجيه تلك كلٌ على حدة (ويرفض كل منها مع علم التعيين المطابق له)، وهذا يختلف عن تعطيل `--no-deliver` لتسليم الرجوع الخاص بالمشغّل.

<Note>
ملاحظة تجاوز النموذج:

- يغيّر `openclaw cron add|edit --model ...` النموذج المحدد للمهمة.
- إذا كان النموذج مسموحًا، يصل ذلك المزود/النموذج المحدد إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا أو تعذر حله، يفشل Cron التشغيل مع خطأ تحقق صريح.
- يمكن لتصحيحات حمولة API `cron.update` تعيين `model: null` لمسح تجاوز نموذج محفوظ للمهمة.
- يمسح `openclaw cron edit <job-id> --clear-model` ذلك التجاوز من CLI (بنفس تأثير تصحيح `model: null`) ولا يمكن دمجه مع `--model`.
- تظل سلاسل الرجوع المهيأة مطبقة لأن `--model` في Cron هو أساسي للمهمة، وليس تجاوزًا لـ `/model` في الجلسة.
- يعيّن `openclaw cron add|edit --fallbacks ...` حمولة `fallbacks`، مستبدلًا الرجوعات المهيأة لتلك المهمة؛ يعطل `--fallbacks ""` الرجوع ويجعل التشغيل صارمًا. يمسح `openclaw cron edit <job-id> --clear-fallbacks` التجاوز الخاص بالمهمة.
- لا ينتقل `--model` عادي من دون قائمة رجوع صريحة أو مهيأة إلى النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

</Note>

## التهيئة

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

يحد `maxConcurrentRuns` كلًا من إرسال Cron المجدول وتنفيذ دور الوكيل المعزول، وقيمته الافتراضية 8. تستخدم أدوار وكيل Cron المعزولة مسار التنفيذ المخصص `cron-nested` الخاص بقائمة الانتظار داخليًا، لذا فإن رفع هذه القيمة يتيح لتشغيلات LLM المستقلة في Cron التقدم بالتوازي بدلًا من بدء أغلفة Cron الخارجية فقط. لا يوسّع هذا الإعداد مسار `nested` المشترك غير الخاص بـ Cron.

`cron.store` هو مفتاح مخزن منطقي ومسار استيراد doctor قديم. شغّل `openclaw doctor --fix` لاستيراد مخازن JSON الموجودة إلى SQLite وأرشفتها؛ وينبغي أن تمر تغييرات Cron المستقبلية عبر CLI أو API الخاصة بـ Gateway.

تعطيل Cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="سلوك إعادة المحاولة">
    **إعادة محاولة لمرة واحدة**: يعاد تجريب الأخطاء العابرة (حد المعدل، التحميل الزائد، الشبكة، خطأ الخادم) حتى 3 مرات مع تراجع أسي. تعطل الأخطاء الدائمة فورًا.

    **إعادة محاولة متكررة**: تراجع أسي (من 30ث إلى 60د) بين المحاولات. يعاد ضبط التراجع بعد التشغيل الناجح التالي.

  </Accordion>
  <Accordion title="الصيانة">
    ينظف `cron.sessionRetention` (الافتراضي `24h`) إدخالات جلسات التشغيل المعزولة. يحد `cron.runLog.keepLines` صفوف سجل التشغيل المحفوظة في SQLite لكل مهمة؛ ويُحتفظ بـ `maxBytes` لتوافق الإعداد مع سجلات التشغيل القديمة المدعومة بالملفات.
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
    - تحقق من متغير البيئة `cron.enabled` و`OPENCLAW_SKIP_CRON`.
    - تأكد من أن Gateway يعمل باستمرار.
    - بالنسبة إلى جداول `cron`، تحقق من المنطقة الزمنية (`--tz`) مقارنةً بالمنطقة الزمنية للمضيف.
    - تعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي فُحص باستخدام `openclaw cron run <jobId> --due` وأن وقت المهمة لم يحن بعد.

  </Accordion>
  <Accordion title="Cron عمل لكن لا يوجد تسليم">
    - يعني وضع التسليم `none` أنه لا يتوقع إرسال رجوع من المشغّل. لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message` عند توفر مسار دردشة.
    - يعني هدف التسليم المفقود/غير الصالح (`channel`/`to`) أنه تم تخطي الإرسال الصادر.
    - بالنسبة إلى Matrix، قد تفشل المهام المنسوخة أو القديمة ذات معرّفات غرف `delivery.to` المكتوبة بأحرف صغيرة لأن معرّفات غرف Matrix حساسة لحالة الأحرف. عدّل المهمة إلى قيمة `!room:server` أو `room:!room:server` الدقيقة من Matrix.
    - تعني أخطاء مصادقة القناة (`unauthorized`، `Forbidden`) أن التسليم حُظر بسبب بيانات الاعتماد.
    - إذا أعاد التشغيل المعزول رمز الصمت فقط (`NO_REPLY` / `no_reply`)، فإن OpenClaw يكبت التسليم الصادر المباشر ويكبت أيضًا مسار ملخص الرجوع الموضوع في قائمة الانتظار، لذلك لا يُنشر أي شيء مرة أخرى إلى الدردشة.
    - إذا كان على الوكيل مراسلة المستخدم بنفسه، فتحقق من أن المهمة لديها مسار صالح للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

  </Accordion>
  <Accordion title="يبدو أن Cron أو Heartbeat يمنع تدوير /new-style">
    - لا تعتمد حداثة إعادة الضبط اليومية والخاملة على `updatedAt`؛ راجع [إدارة الجلسات](/ar/concepts/session#session-lifecycle).
    - قد تحدّث إيقاظات Cron وتشغيلات Heartbeat وإشعارات exec ودفاتر Gateway صف الجلسة للتوجيه/الحالة، لكنها لا تمدد `sessionStartedAt` أو `lastInteractionAt`.
    - بالنسبة إلى الصفوف القديمة التي أُنشئت قبل وجود تلك الحقول، يستطيع OpenClaw استعادة `sessionStartedAt` من ترويسة جلسة transcript JSONL عندما يظل الملف متاحًا. تستخدم صفوف الخمول القديمة التي لا تحتوي على `lastInteractionAt` وقت البدء المستعاد ذلك كخط أساس للخمول.

  </Accordion>
  <Accordion title="مزالق المنطقة الزمنية">
    - يستخدم Cron من دون `--tz` المنطقة الزمنية لمضيف Gateway.
    - تعامل جداول `at` بلا منطقة زمنية على أنها UTC.
    - يستخدم Heartbeat `activeHours` حل المنطقة الزمنية المهيأ.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأتمتة](/ar/automation) — كل آليات الأتمتة في لمحة
- [مهام الخلفية](/ar/automation/tasks) — سجل مهام تنفيذات Cron
- [Heartbeat](/ar/gateway/heartbeat) — أدوار دورية للجلسة الرئيسية
- [المنطقة الزمنية](/ar/concepts/timezone) — تهيئة المنطقة الزمنية
