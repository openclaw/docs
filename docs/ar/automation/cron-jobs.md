---
read_when:
    - جدولة المهام الخلفية أو عمليات التنبيه
    - ربط المشغّلات الخارجية (webhooks وGmail) بـ OpenClaw
    - اتخاذ القرار بين heartbeat وcron للمهام المجدولة
summary: المهام المجدولة، وwebhooks، ومشغّلات Gmail PubSub لجدولة Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-04-12T07:15:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f42bcaeedd0595d025728d7f236a724a0ebc67b6813c57233f4d739b3088317f
    source_path: automation/cron-jobs.md
    workflow: 15
---

# المهام المجدولة (Cron)

Cron هو المجدول المضمّن في Gateway. فهو يحتفظ بالمهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه إعادة تسليم المخرجات إلى قناة دردشة أو نقطة نهاية webhook.

## البدء السريع

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list

# See run history
openclaw cron runs --id <job-id>
```

## كيفية عمل cron

- يعمل Cron **داخل** عملية Gateway (وليس داخل النموذج).
- تُحفَظ المهام في `~/.openclaw/cron/jobs.json` حتى لا تفقد عمليات إعادة التشغيل الجداول الزمنية.
- تنشئ جميع عمليات cron سجلات [مهمة في الخلفية](/ar/automation/tasks).
- تُحذف المهام أحادية التشغيل (`--at`) تلقائيًا بعد النجاح افتراضيًا.
- تحاول عمليات cron المعزولة عند الانتهاء إغلاق علامات تبويب/عمليات المتصفح المتعقبة الخاصة بجلسة `cron:<jobId>` بأفضل جهد ممكن، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- تحمي عمليات cron المعزولة أيضًا من ردود الإقرار القديمة. إذا كانت
  النتيجة الأولى مجرد تحديث حالة مؤقت (`on it` و`pulling everything
together` وتلميحات مشابهة) ولم يعد هناك أي تشغيل لوكيل فرعي تابع
  مسؤول عن الإجابة النهائية، فإن OpenClaw يعيد الطلب مرة واحدة للحصول على
  النتيجة الفعلية قبل التسليم.

<a id="maintenance"></a>

تكون تسوية المهام الخاصة بـ cron مملوكة لوقت التشغيل: تظل مهمة cron النشطة قيد التشغيل ما دام
وقت تشغيل cron لا يزال يتتبع تلك المهمة على أنها قيد التشغيل، حتى لو كان لا يزال هناك صف جلسة فرعية قديم موجود.
بمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي نافذة السماح البالغة 5 دقائق، يمكن للصيانة
وضع علامة `lost` على المهمة.

## أنواع الجداول الزمنية

| النوع    | علم CLI   | الوصف                                                      |
| ------- | --------- | ---------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني أحادي التشغيل (ISO 8601 أو قيمة نسبية مثل `20m`) |
| `every` | `--every` | فاصل زمني ثابت                                             |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري           |

تُعامل الطوابع الزمنية من دون منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة بحسب التوقيت المحلي.

تُوزَّع التعبيرات المتكررة التي تعمل في بداية كل ساعة تلقائيًا على مدى يصل إلى 5 دقائق لتقليل طفرات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تُحلَّل تعبيرات cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون حقلا يوم الشهر ويوم الأسبوع كلاهما غير wildcard، يطابق croner عندما **يطابق أحد** الحقلين — وليس كلاهما. وهذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

يعمل هذا حوالي 5–6 مرات شهريًا بدلًا من 0–1 مرة شهريًا. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لفرض الشرطين معًا، استخدم معدّل يوم الأسبوع `+` الخاص بـ Croner (`0 9 15 * +1`) أو قم بالجدولة على أحد الحقلين وطبّق الحراسة على الآخر داخل prompt أو command الخاص بالمهمة.

## أنماط التنفيذ

| النمط           | قيمة `--session`    | يعمل في                  | الأنسب لـ                       |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| الجلسة الرئيسية | `main`              | دورة heartbeat التالية   | التذكيرات، وأحداث النظام       |
| معزول           | `isolated`          | `cron:<jobId>` مخصص      | التقارير، والمهام الخلفية      |
| الجلسة الحالية  | `current`           | مرتبط عند وقت الإنشاء    | الأعمال المتكررة المرتبطة بالسياق |
| جلسة مخصصة      | `session:custom-id` | جلسة مسماة دائمة         | سير العمل الذي يعتمد على السجل |

تقوم مهام **الجلسة الرئيسية** بوضع حدث نظام في قائمة الانتظار ويمكنها اختياريًا إيقاظ heartbeat (`--wake now` أو `--wake next-heartbeat`). وتُشغِّل المهام **المعزولة** دورة وكيل مخصصة بجلسة جديدة. وتحافظ **الجلسات المخصصة** (`session:xxx`) على السياق عبر مرات التشغيل، مما يتيح سير عمل مثل الاجتماعات اليومية التي تعتمد على الملخصات السابقة.

بالنسبة إلى المهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيفًا بأفضل جهد ممكن للمتصفح لجلسة cron تلك. يتم تجاهل إخفاقات التنظيف حتى تبقى نتيجة cron الفعلية هي المعتمدة.

عندما تنسق عمليات cron المعزولة وكلاء فرعيين، يفضّل التسليم أيضًا
مخرجات التابع النهائية على النص المؤقت القديم من الأصل.
وإذا كانت الوكلاء الفرعيون لا يزالون قيد التشغيل، فإن OpenClaw يمنع هذا
التحديث الجزئي من الأصل بدلًا من الإعلان عنه.

### خيارات الحمولة للمهام المعزولة

- `--message`: نص prompt (مطلوب للمهام المعزولة)
- `--model` / `--thinking`: تجاوزات النموذج ومستوى التفكير
- `--light-context`: تخطي حقن ملف bootstrap الخاص بمساحة العمل
- `--tools exec,read`: تقييد الأدوات التي يمكن للمهمة استخدامها

يستخدم `--model` النموذج المسموح المحدد لتلك المهمة. إذا كان النموذج المطلوب
غير مسموح، يسجل cron تحذيرًا ويعود إلى اختيار النموذج الافتراضي/نموذج الوكيل
لتلك المهمة بدلًا من ذلك. ولا تزال سلاسل fallback المُعدّة مسبقًا سارية، لكن
تجاوز النموذج العادي من دون قائمة fallback صريحة لكل مهمة لم يعد يضيف
النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي مخفي.

ترتيب أولوية اختيار النموذج للمهام المعزولة هو:

1. تجاوز نموذج خطاف Gmail (عندما يأتي التشغيل من Gmail ويكون هذا التجاوز مسموحًا)
2. `model` الموجود في حمولة كل مهمة
3. تجاوز نموذج جلسة cron المخزّن
4. اختيار النموذج الافتراضي/نموذج الوكيل

يتبع الوضع السريع أيضًا الاختيار الفعلي المحسوم. إذا كانت إعدادات النموذج المحدد
تتضمن `params.fastMode`، فإن cron المعزول يستخدم ذلك افتراضيًا. ويظل تجاوز
`fastMode` المخزن في الجلسة متقدمًا على الإعداد في كلا الاتجاهين.

إذا واجه تشغيل معزول عملية تسليم إلى تبديل نموذج مباشر، يعيد cron المحاولة مع
المزوّد/النموذج المُبدّل ويحتفظ بذلك الاختيار المباشر قبل إعادة المحاولة. وعندما
يحمل التبديل أيضًا ملف auth شخصيًا جديدًا، يحتفظ cron بهذا التجاوز لملف auth أيضًا.
وتكون عمليات إعادة المحاولة محدودة: بعد المحاولة الأولية بالإضافة إلى محاولتَي
تبديل، يُجهِض cron العملية بدلًا من الاستمرار في حلقة لا نهائية.

## التسليم والمخرجات

| الوضع      | ما الذي يحدث                                              |
| ---------- | --------------------------------------------------------- |
| `announce` | تسليم الملخص إلى القناة المستهدفة (الافتراضي للمهام المعزولة) |
| `webhook`  | إرسال حمولة حدث مكتمل إلى URL عبر POST                   |
| `none`     | داخلي فقط، من دون تسليم                                   |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى قناة. وبالنسبة إلى موضوعات منتديات Telegram، استخدم `-1001234567890:topic:123`. ويجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>` و`user:<id>`).

بالنسبة إلى المهام المعزولة المملوكة لـ cron، يمتلك المشغّل مسار التسليم النهائي.
يُطلَب من الوكيل إرجاع ملخص نصّي عادي، ثم يُرسل هذا الملخص عبر
`announce` أو `webhook` أو يُحتفَظ به داخليًا عند `none`. لا يعيد
`--no-deliver` التسليم إلى الوكيل؛ بل يُبقي التشغيل داخليًا.

إذا كانت المهمة الأصلية تنص صراحةً على مراسلة مستلِم خارجي ما، فيجب على
الوكيل أن يذكر في مخرجاته من/إلى أين ينبغي أن تذهب تلك الرسالة بدلًا من
محاولة إرسالها مباشرة.

تتبع إشعارات الإخفاق مسار وجهة منفصلًا:

- يضبط `cron.failureDestination` وجهة افتراضية عامة لإشعارات الإخفاق.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُضبط أي منهما وكانت المهمة تُسلَّم أصلًا عبر `announce`، فإن إشعارات الإخفاق تعود الآن افتراضيًا إلى هدف announce الأساسي نفسه.
- لا يكون `delivery.failureDestination` مدعومًا إلا في المهام ذات `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.

## أمثلة CLI

تذكير أحادي التشغيل (الجلسة الرئيسية):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

مهمة معزولة متكررة مع تسليم:

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

مهمة معزولة مع تجاوز النموذج والتفكير:

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

## Webhooks

يمكن لـ Gateway كشف نقاط نهاية HTTP webhook للمشغّلات الخارجية. فعّل ذلك في الإعدادات:

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

يجب أن يتضمن كل طلب رمز الخطاف عبر ترويسة:

- `Authorization: Bearer <token>` (موصى به)
- `x-openclaw-token: <token>`

تُرفض الرموز الممرَّرة في query-string.

### POST /hooks/wake

ضع حدث نظام في قائمة انتظار الجلسة الرئيسية:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (مطلوب): وصف الحدث
- `mode` (اختياري): `now` (الافتراضي) أو `next-heartbeat`

### POST /hooks/agent

شغّل دورة وكيل معزولة:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

الحقول: `message` (مطلوب)، و`name`، و`agentId`، و`wakeMode`، و`deliver`، و`channel`، و`to`، و`model`، و`thinking`، و`timeoutSeconds`.

### الخطافات المعيّنة (POST /hooks/\<name\>)

تُحل أسماء الخطافات المخصصة عبر `hooks.mappings` في الإعدادات. ويمكن لعمليات التعيين تحويل أي حمولة إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات برمجية.

### الأمان

- أبقِ نقاط نهاية الخطافات خلف loopback أو tailnet أو reverse proxy موثوق.
- استخدم رمز خطاف مخصصًا؛ ولا تعِد استخدام رموز auth الخاصة بـ gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ فالقيمة `/` مرفوضة.
- اضبط `hooks.allowedAgentIds` لتقييد التوجيه الصريح لـ `agentId`.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن بحاجة إلى جلسات يختارها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسة المسموح بها.
- تُغلَّف حمولات الخطافات بحدود أمان افتراضيًا.

## تكامل Gmail PubSub

اربط مشغّلات صندوق بريد Gmail الوارد بـ OpenClaw عبر Google PubSub.

**المتطلبات المسبقة**: CLI `gcloud`، و`gog` (`gogcli`)، وتمكين خطافات OpenClaw، وTailscale لنقطة نهاية HTTPS العامة.

### الإعداد عبر المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعداد `hooks.gmail`، ويفعّل إعداد Gmail المسبق، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### التشغيل التلقائي لـ Gateway

عندما يكون `hooks.enabled=true` و`hooks.gmail.account` مضبوطًا، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدّد watch تلقائيًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء الاشتراك.

### إعداد يدوي لمرة واحدة

1. اختر مشروع GCP الذي يملك عميل OAuth المستخدم بواسطة `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. أنشئ topic وامنح Gmail إذن push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. ابدأ watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

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

ملاحظة حول تجاوز النموذج:

- يغيّر `openclaw cron add|edit --model ...` النموذج المحدد للمهمة.
- إذا كان النموذج مسموحًا، فإن هذا المزوّد/النموذج المحدد نفسه يصل إلى
  تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا، يصدر cron تحذيرًا ويعود إلى اختيار
  النموذج الافتراضي/نموذج الوكيل الخاص بالمهمة.
- تظل سلاسل fallback المُعدّة مسبقًا سارية، لكن تجاوز `--model` العادي
  من دون قائمة fallback صريحة لكل مهمة لم يعد ينتقل إلى النموذج الأساسي
  للوكيل كهدف إعادة محاولة إضافي صامت.

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

تعطيل cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

**إعادة محاولة التشغيل الأحادي**: تُعاد محاولة الأخطاء العابرة (حد المعدل، والتحميل الزائد، والشبكة، وخطأ الخادم) حتى 3 مرات مع تراجع أُسّي. وتُعطَّل الأخطاء الدائمة فورًا.

**إعادة محاولة التشغيل المتكرر**: تراجع أُسّي (من 30 ثانية إلى 60 دقيقة) بين محاولات إعادة التشغيل. ويُعاد ضبط التراجع بعد التشغيل الناجح التالي.

**الصيانة**: يقوم `cron.sessionRetention` (الافتراضي `24h`) بتقليم إدخالات جلسات التشغيل المعزولة. كما يقوم `cron.runLog.maxBytes` و`cron.runLog.keepLines` بتقليم ملفات سجل التشغيل تلقائيًا.

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

### cron لا يعمل

- تحقّق من `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
- أكّد أن Gateway يعمل بشكل مستمر.
- بالنسبة إلى جداول `cron`، تحقّق من المنطقة الزمنية (`--tz`) مقابل المنطقة الزمنية للمضيف.
- إن ظهور `reason: not-due` في مخرجات التشغيل يعني أن التشغيل اليدوي تم التحقق منه باستخدام `openclaw cron run <jobId> --due` وأن المهمة لم يكن قد حان موعدها بعد.

### تم تشغيل cron ولكن لم يحدث أي تسليم

- إذا كان وضع التسليم هو `none` فهذا يعني أنه لا يُتوقع أي رسالة خارجية.
- إذا كان هدف التسليم مفقودًا/غير صالح (`channel`/`to`) فهذا يعني أنه تم تخطي الإرسال الخارجي.
- أخطاء auth الخاصة بالقناة (`unauthorized` و`Forbidden`) تعني أن التسليم تم منعه بسبب بيانات الاعتماد.
- إذا أعاد التشغيل المعزول الرمز الصامت فقط (`NO_REPLY` / `no_reply`)،
  فإن OpenClaw يمنع التسليم الخارجي المباشر ويمنع أيضًا مسار
  الملخص الاحتياطي الموضوع في قائمة الانتظار، لذلك لا يتم نشر أي شيء
  مرة أخرى إلى الدردشة.
- بالنسبة إلى المهام المعزولة المملوكة لـ cron، لا تتوقع من الوكيل استخدام أداة message
  كخيار احتياطي. فالمشغّل يملك التسليم النهائي؛ ويحافظ `--no-deliver` على
  التشغيل داخليًا بدلًا من السماح بإرسال مباشر.

### تنبيهات المنطقة الزمنية

- يستخدم cron من دون `--tz` المنطقة الزمنية لمضيف gateway.
- تُعامل جداول `at` من دون منطقة زمنية على أنها UTC.
- يستخدم `activeHours` في heartbeat دقة المنطقة الزمنية المُعدّة.

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — جميع آليات الأتمتة في لمحة
- [المهام في الخلفية](/ar/automation/tasks) — سجل المهام لعمليات cron
- [Heartbeat](/ar/gateway/heartbeat) — دورات الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعداد المنطقة الزمنية
