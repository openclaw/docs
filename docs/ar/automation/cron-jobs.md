---
read_when:
    - جدولة المهام في الخلفية أو عمليات التنبيه
    - ربط المشغلات الخارجية (webhooks وGmail) بـ OpenClaw
    - اتخاذ القرار بين heartbeat وcron للمهام المجدولة
summary: الوظائف المجدولة، وwebhooks، ومشغلات Gmail PubSub لجدولة Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-04-11T02:44:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d94baa152de17d78515f7d545f099fe4810363ab67e06b465e489737f54665
    source_path: automation/cron-jobs.md
    workflow: 15
---

# المهام المجدولة (Cron)

Cron هو المجدول المدمج في Gateway. فهو يحفظ الوظائف، ويوقظ الوكيل في الوقت المناسب، ويمكنه إعادة إرسال المخرجات إلى قناة دردشة أو نقطة نهاية webhook.

## بدء سريع

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

## كيف يعمل cron

- يعمل Cron **داخل** عملية Gateway (وليس داخل النموذج).
- تُحفَظ الوظائف في `~/.openclaw/cron/jobs.json` حتى لا تؤدي إعادة التشغيل إلى فقدان الجداول الزمنية.
- تُنشئ جميع عمليات تنفيذ cron سجلات [مهام في الخلفية](/ar/automation/tasks).
- تُحذف الوظائف ذات التشغيل الواحد (`--at`) تلقائيًا بعد النجاح بشكل افتراضي.
- تحاول تشغيلات cron المعزولة، بأفضل جهد ممكن، إغلاق علامات تبويب/عمليات المتصفح المتتبعة لجلسة `cron:<jobId>` الخاصة بها عند اكتمال التشغيل، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة وراءها.
- تحمي تشغيلات cron المعزولة أيضًا من ردود الإقرار القديمة. إذا كانت
  النتيجة الأولى مجرد تحديث حالة مؤقت (`on it` و`pulling everything
together` وتلميحات مشابهة) ولم يعد أي تشغيل فرعي منحدر
  مسؤولًا عن الإجابة النهائية، فإن OpenClaw يعيد التوجيه مرة واحدة للحصول على
  النتيجة الفعلية قبل التسليم.

<a id="maintenance"></a>

تسوية المهام الخاصة بـ cron مملوكة لوقت التشغيل: تظل مهمة cron النشطة قائمة ما دام
وقت تشغيل cron لا يزال يتتبع تلك الوظيفة على أنها قيد التشغيل، حتى إذا كان لا يزال يوجد صف جلسة فرعية قديم.
وبمجرد أن يتوقف وقت التشغيل عن امتلاك الوظيفة وتنتهي نافذة السماح البالغة 5 دقائق، يمكن للصيانة
وضع علامة `lost` على المهمة.

## أنواع الجداول الزمنية

| النوع    | علامة CLI | الوصف |
| ------- | --------- | ----- |
| `at`    | `--at`    | طابع زمني لتشغيل واحد (ISO 8601 أو قيمة نسبية مثل `20m`) |
| `every` | `--every` | فاصل زمني ثابت |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري |

تُعامل الطوابع الزمنية من دون منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة بحسب التوقيت المحلي الفعلي.

تُوزَّع التعبيرات المتكررة التي تعمل عند بداية كل ساعة تلقائيًا بفارق يصل إلى 5 دقائق لتقليل ذروات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لتحديد نافذة صريحة.

## أنماط التنفيذ

| النمط          | قيمة `--session`    | يعمل في                 | الأنسب لـ |
| -------------- | ------------------- | ----------------------- | --------- |
| الجلسة الرئيسية | `main`              | دورة heartbeat التالية  | التذكيرات، وأحداث النظام |
| معزول          | `isolated`          | `cron:<jobId>` مخصص     | التقارير، والمهام الخلفية |
| الجلسة الحالية  | `current`           | يرتبط عند الإنشاء       | العمل المتكرر المعتمد على السياق |
| جلسة مخصصة     | `session:custom-id` | جلسة مسماة دائمة        | سير العمل الذي يبني على السجل |

تُدرج وظائف **الجلسة الرئيسية** حدث نظام في قائمة الانتظار، ويمكنها اختياريًا إيقاظ heartbeat (`--wake now` أو `--wake next-heartbeat`). أما الوظائف **المعزولة** فتشغّل دورة وكيل مخصصة مع جلسة جديدة. وتحتفظ **الجلسات المخصصة** (`session:xxx`) بالسياق عبر التشغيلات، ما يتيح سير عمل مثل الاجتماعات اليومية المختصرة التي تبني على الملخصات السابقة.

بالنسبة إلى الوظائف المعزولة، يتضمن الإنهاء في وقت التشغيل الآن تنظيفًا للمتصفح، بأفضل جهد ممكن، لتلك الجلسة الخاصة بـ cron. ويتم تجاهل إخفاقات التنظيف بحيث تظل نتيجة cron الفعلية هي المعتمدة.

عندما تنسق تشغيلات cron المعزولة وكلاء فرعيين، يفضّل التسليم أيضًا
الناتج النهائي المنحدر على النص المؤقت القديم من الأصل.
وإذا كانت الكيانات المنحدرة لا تزال قيد التشغيل، فإن OpenClaw يحجب ذلك التحديث
الجزئي من الأصل بدلًا من الإعلان عنه.

### خيارات الحمولة للوظائف المعزولة

- `--message`: نص الموجّه (مطلوب للوظائف المعزولة)
- `--model` / `--thinking`: تجاوزات النموذج ومستوى التفكير
- `--light-context`: تخطي حقن ملف bootstrap الخاص بمساحة العمل
- `--tools exec,read`: تقييد الأدوات التي يمكن للوظيفة استخدامها

يستخدم `--model` النموذج المسموح المحدد لتلك الوظيفة. وإذا لم يكن النموذج المطلوب
مسموحًا، يسجل cron تحذيرًا ويعود إلى اختيار النموذج الافتراضي/نموذج الوكيل الخاص بالوظيفة.
وتظل سلاسل التراجع المكوّنة مسبقًا سارية، لكن تجاوزًا عاديًا
للنموذج من دون قائمة تراجع صريحة لكل وظيفة لم يعد يضيف النموذج الأساسي للوكيل
كهدف إعادة محاولة إضافي مخفي.

ترتيب أولوية اختيار النموذج للوظائف المعزولة هو:

1. تجاوز نموذج hook الخاص بـ Gmail (عندما يكون التشغيل قد أتى من Gmail وكان هذا التجاوز مسموحًا)
2. `model` في الحمولة لكل وظيفة
3. تجاوز النموذج المخزّن لجلسة cron
4. اختيار النموذج الافتراضي/نموذج الوكيل

يتبع الوضع السريع الاختيار المباشر المحسوم أيضًا. وإذا كان إعداد النموذج المحدد
يتضمن `params.fastMode`، يستخدم cron المعزول ذلك افتراضيًا. ولا يزال تجاوز
`fastMode` المخزّن للجلسة هو الذي يتغلب على الإعداد في كلا الاتجاهين.

إذا اصطدم تشغيل معزول بعملية تسليم تبديل نموذج مباشرة، يعيد cron المحاولة باستخدام
المزوّد/النموذج المحوَّل إليه ويحفظ هذا الاختيار المباشر قبل إعادة المحاولة. وعندما
يحمل التبديل أيضًا ملف تعريف مصادقة جديدًا، يحفظ cron تجاوز ملف تعريف المصادقة هذا أيضًا.
وتكون إعادة المحاولات محدودة: بعد المحاولة الأولى بالإضافة إلى محاولتي تبديل،
يوقف cron العملية بدلًا من التكرار إلى ما لا نهاية.

## التسليم والمخرجات

| الوضع      | ما الذي يحدث |
| ---------- | ------------ |
| `announce` | تسليم الملخص إلى القناة المستهدفة (الافتراضي للوظائف المعزولة) |
| `webhook`  | إرسال حمولة حدث الاكتمال عبر POST إلى عنوان URL |
| `none`     | داخلي فقط، من دون تسليم |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى قناة. وبالنسبة إلى مواضيع منتديات Telegram، استخدم `-1001234567890:topic:123`. ويجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>` و`user:<id>`).

بالنسبة إلى الوظائف المعزولة المملوكة لـ cron، يملك المشغّل مسار التسليم النهائي.
يُوجَّه الوكيل لإرجاع ملخص نصي عادي، ثم يُرسَل هذا الملخص عبر
`announce` أو `webhook` أو يُحتفظ به داخليًا عند `none`. لا يعيد `--no-deliver`
التسليم إلى الوكيل؛ بل يبقي التشغيل داخليًا.

إذا كانت المهمة الأصلية تنص صراحة على مراسلة مستلم خارجي ما،
فينبغي للوكيل أن يذكر في مخرجاته من/إلى أين يجب أن تذهب تلك الرسالة بدلًا من
محاولة إرسالها مباشرة.

تسلك إشعارات الفشل مسار وجهة منفصلًا:

- يحدد `cron.failureDestination` قيمة افتراضية عامة لإشعارات الفشل.
- يتجاوز `job.delivery.failureDestination` ذلك لكل وظيفة.
- إذا لم يتم تعيين أي منهما، وكانت الوظيفة تسلّم بالفعل عبر `announce`، فإن إشعارات الفشل تعود الآن افتراضيًا إلى هدف الإعلان الأساسي نفسه.
- لا يكون `delivery.failureDestination` مدعومًا إلا في الوظائف ذات `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.

## أمثلة CLI

تذكير بتشغيل واحد (الجلسة الرئيسية):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

وظيفة معزولة متكررة مع تسليم:

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

وظيفة معزولة مع تجاوز للنموذج ومستوى التفكير:

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

يمكن لـ Gateway إتاحة نقاط نهاية webhook عبر HTTP للمشغلات الخارجية. فعّل ذلك في الإعدادات:

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

يجب أن يتضمن كل طلب رمز hook عبر ترويسة:

- `Authorization: Bearer <token>` (موصى به)
- `x-openclaw-token: <token>`

تُرفَض الرموز الموجودة في سلسلة الاستعلام.

### ‏POST /hooks/wake

إدراج حدث نظام في قائمة انتظار الجلسة الرئيسية:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (مطلوب): وصف الحدث
- `mode` (اختياري): `now` (الافتراضي) أو `next-heartbeat`

### ‏POST /hooks/agent

تشغيل دورة وكيل معزولة:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

الحقول: `message` (مطلوب)، و`name`، و`agentId`، و`wakeMode`، و`deliver`، و`channel`، و`to`، و`model`، و`thinking`، و`timeoutSeconds`.

### Hooks المعينة (POST /hooks/\<name\>)

تُحل أسماء hooks المخصصة عبر `hooks.mappings` في الإعدادات. ويمكن لعمليات التعيين تحويل الحمولات العشوائية إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات برمجية.

### الأمان

- أبقِ نقاط نهاية hook خلف loopback أو tailnet أو وكيل عكسي موثوق.
- استخدم رمز hook مخصصًا؛ ولا تعِد استخدام رموز مصادقة gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ إذ يتم رفض `/`.
- عيّن `hooks.allowedAgentIds` لتقييد التوجيه الصريح عبر `agentId`.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يحددها المستدعي.
- إذا فعّلت `hooks.allowRequestSessionKey`، فعيّن أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلَّف حمولات hook بحدود أمان افتراضيًا.

## تكامل Gmail PubSub

اربط مشغلات صندوق الوارد في Gmail بـ OpenClaw عبر Google PubSub.

**المتطلبات المسبقة**: CLI الخاص بـ `gcloud`، و`gog` (gogcli)، وتمكين hooks في OpenClaw، وTailscale لنقطة نهاية HTTPS العامة.

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعداد `hooks.gmail`، ويفعّل إعداد Gmail المسبق، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### البدء التلقائي لـ Gateway

عندما تكون `hooks.enabled=true` و`hooks.gmail.account` معيّنة، يبدأ Gateway
`gog gmail watch serve` عند الإقلاع ويجدد watch تلقائيًا. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء ذلك.

### إعداد يدوي لمرة واحدة

1. حدّد مشروع GCP الذي يملك عميل OAuth المستخدم بواسطة `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. أنشئ topic وامنح Gmail صلاحية الدفع:

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

## إدارة الوظائف

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

ملاحظة بشأن تجاوز النموذج:

- يغيّر `openclaw cron add|edit --model ...` النموذج المحدد للوظيفة.
- إذا كان النموذج مسموحًا، يصل ذلك المزوّد/النموذج المحدد بالضبط إلى تشغيل
  الوكيل المعزول.
- وإذا لم يكن مسموحًا، يصدر cron تحذيرًا ويعود إلى اختيار
  النموذج الافتراضي/نموذج الوكيل الخاص بالوظيفة.
- وتظل سلاسل التراجع المكوّنة سارية، لكن تجاوز `--model` العادي
  من دون قائمة تراجع صريحة لكل وظيفة لم يعد يمر تلقائيًا إلى النموذج
  الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

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

**إعادة محاولة التشغيل الواحد**: تتم إعادة محاولة الأخطاء المؤقتة (تحديد المعدل، وزيادة الحمل، وأخطاء الشبكة، وخطأ الخادم) حتى 3 مرات مع تراجع أسي. أما الأخطاء الدائمة فتؤدي إلى التعطيل فورًا.

**إعادة محاولة الوظائف المتكررة**: تراجع أسي (من 30 ثانية إلى 60 دقيقة) بين محاولات إعادة التشغيل. ويُعاد ضبط التراجع بعد التشغيل الناجح التالي.

**الصيانة**: يقوم `cron.sessionRetention` (الافتراضي `24h`) بتقليم إدخالات جلسات التشغيل المعزولة. وتقوم `cron.runLog.maxBytes` / `cron.runLog.keepLines` بتقليم ملفات سجل التشغيل تلقائيًا.

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

### Cron لا يعمل

- تحقق من `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
- تأكد من أن Gateway يعمل بشكل مستمر.
- بالنسبة إلى جداول `cron`، تحقق من المنطقة الزمنية (`--tz`) مقابل المنطقة الزمنية للمضيف.
- يشير `reason: not-due` في مخرجات التشغيل إلى أن التشغيل اليدوي تم التحقق منه باستخدام `openclaw cron run <jobId> --due` وأن وقت الوظيفة لم يحن بعد.

### تم تشغيل Cron لكن لم يحدث أي تسليم

- يعني وضع التسليم `none` أنه لا يُتوقع إرسال أي رسالة خارجية.
- يعني غياب هدف التسليم أو كونه غير صالح (`channel`/`to`) أنه تم تخطي الإرسال الخارجي.
- تعني أخطاء مصادقة القناة (`unauthorized` و`Forbidden`) أن التسليم تم حجبه بسبب بيانات الاعتماد.
- إذا أعاد التشغيل المعزول الرمز الصامت فقط (`NO_REPLY` / `no_reply`)،
  فإن OpenClaw يحجب التسليم الخارجي المباشر ويمنع أيضًا
  مسار الملخص الاحتياطي الموضوع في قائمة الانتظار، لذلك لا يتم نشر أي شيء إلى الدردشة.
- بالنسبة إلى الوظائف المعزولة المملوكة لـ cron، لا تتوقع أن يستخدم الوكيل أداة الرسائل
  كحل احتياطي. فالمشغّل يملك التسليم النهائي؛ ويُبقي `--no-deliver` التشغيل
  داخليًا بدلًا من السماح بإرسال مباشر.

### ملاحظات مهمة حول المنطقة الزمنية

- يستخدم cron من دون `--tz` المنطقة الزمنية لمضيف gateway.
- تُعامل جداول `at` من دون منطقة زمنية على أنها UTC.
- يستخدم `activeHours` في heartbeat دقة المنطقة الزمنية المكوّنة.

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — نظرة عامة على جميع آليات الأتمتة
- [المهام في الخلفية](/ar/automation/tasks) — سجل المهام لعمليات تنفيذ cron
- [Heartbeat](/ar/gateway/heartbeat) — دورات الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعدادات المنطقة الزمنية
