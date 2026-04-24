---
read_when:
    - جدولة المهام الخلفية أو عمليات الاستيقاظ
    - ربط المشغلات الخارجية (Webhooks وGmail) بـ OpenClaw
    - اتخاذ قرار بين Heartbeat وCron للمهام المجدولة
summary: المهام المجدولة، وWebhooks، ومشغلات Gmail PubSub لجدولة Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-04-24T07:29:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: a165c7d2c51ebd5625656690458a96b04b498de29ecadcefc65864cbc2c1b84b
    source_path: automation/cron-jobs.md
    workflow: 15
---

# المهام المجدولة (Cron)

Cron هو المجدول المدمج في Gateway. يحتفظ بالمهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه إعادة تسليم المخرجات إلى قناة دردشة أو نقطة نهاية Webhook.

## البدء السريع

```bash
# إضافة تذكير لمرة واحدة
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# التحقق من مهامك
openclaw cron list
openclaw cron show <job-id>

# عرض سجل التشغيل
openclaw cron runs --id <job-id>
```

## كيف يعمل Cron

- يعمل Cron **داخل** عملية Gateway (وليس داخل النموذج).
- تُحفَظ تعريفات المهام في `~/.openclaw/cron/jobs.json` بحيث لا تؤدي عمليات إعادة التشغيل إلى فقدان الجداول.
- تُحفَظ حالة التنفيذ وقت التشغيل إلى جانبه في `~/.openclaw/cron/jobs-state.json`. إذا كنت تتتبع تعريفات Cron في git، فتتبع `jobs.json` وأضف `jobs-state.json` إلى gitignore.
- بعد هذا الفصل، يمكن لإصدارات OpenClaw الأقدم قراءة `jobs.json` لكنها قد تتعامل مع المهام على أنها جديدة لأن حقول وقت التشغيل أصبحت الآن موجودة في `jobs-state.json`.
- تنشئ جميع عمليات تنفيذ Cron سجلات [مهام الخلفية](/ar/automation/tasks).
- تُحذَف مهام المرة الواحدة (`--at`) تلقائيًا بعد النجاح افتراضيًا.
- تحاول عمليات Cron المعزولة، بأفضل جهد، إغلاق علامات تبويب/عمليات المتصفح المتعقبة الخاصة بجلسة `cron:<jobId>` عند اكتمال التشغيل، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- تحمي عمليات Cron المعزولة أيضًا من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it` و`pulling everything together` وتلميحات مشابهة) ولم يعد أي تشغيل تابع descendant subagent مسؤولًا عن الإجابة النهائية، فإن OpenClaw يعيد التوجيه مرة واحدة للحصول على النتيجة الفعلية قبل التسليم.

<a id="maintenance"></a>

إن تسوية المهام الخاصة بـ Cron مملوكة لوقت التشغيل: تظل مهمة Cron النشطة قيد التشغيل ما دام وقت تشغيل Cron لا يزال يتتبع تلك المهمة على أنها قيد التشغيل، حتى إذا كان لا يزال هناك صف جلسة فرعية قديم موجودًا.
وبمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي مهلة السماح البالغة 5 دقائق، يمكن للصيانة وسم المهمة بأنها `lost`.

## أنواع الجداول

| النوع   | علامة CLI | الوصف                                                    |
| ------- | --------- | -------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لمرة واحدة (ISO 8601 أو صيغة نسبية مثل `20m`) |
| `every` | `--every` | فاصل زمني ثابت                                           |
| `cron`  | `--cron`  | تعبير Cron من 5 أو 6 حقول مع `--tz` اختياري             |

تُعامَل الطوابع الزمنية التي لا تحتوي على منطقة زمنية على أنها UTC. أضف `--tz America/New_York` لاستخدام الجدولة حسب التوقيت المحلي الفعلي.

تُوزَّع تلقائيًا تعبيرات التكرار المتكررة في بداية كل ساعة بفارق يصل إلى 5 دقائق لتقليل ذروات الحمل. استخدم `--exact` لفرض التوقيت الدقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تُحلَّل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون حقلا يوم الشهر ويوم الأسبوع كلاهما غير wildcard، فإن croner يطابق عندما يطابق **أيٌّ من** الحقلين — وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# المقصود: "الساعة 9 صباحًا في اليوم 15، فقط إذا كان يوم اثنين"
# الفعلي:   "الساعة 9 صباحًا في كل يوم 15، و9 صباحًا في كل يوم اثنين"
0 9 15 * 1
```

يؤدي هذا إلى التشغيل حوالي 5–6 مرات شهريًا بدلًا من 0–1 مرة شهريًا. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. إذا كنت تريد اشتراط الشرطين معًا، فاستخدم معدِّل يوم الأسبوع `+` الخاص بـ Croner (`0 9 15 * +1`) أو قم بالجدولة على أحد الحقلين وتحقق من الآخر داخل موجّه المهمة أو الأمر.

## أنماط التنفيذ

| النمط          | قيمة `--session`    | يُشغَّل في                 | الأنسب لـ                     |
| -------------- | ------------------- | -------------------------- | ----------------------------- |
| الجلسة الرئيسية | `main`              | دورة Heartbeat التالية     | التذكيرات، وأحداث النظام      |
| معزول          | `isolated`          | `cron:<jobId>` مخصص        | التقارير، والمهام الخلفية     |
| الجلسة الحالية  | `current`           | يُربَط وقت الإنشاء         | الأعمال المتكررة الواعية بالسياق |
| جلسة مخصصة     | `session:custom-id` | جلسة مسماة دائمة           | سير العمل الذي يبني على السجل |

تُدرِج مهام **الجلسة الرئيسية** حدث نظام، ويمكنها اختياريًا إيقاظ Heartbeat (`--wake now` أو `--wake next-heartbeat`). تُشغِّل مهام **العزل** دورة وكيل مخصصة بجلسة جديدة. وتحتفظ **الجلسات المخصصة** (`session:xxx`) بالسياق عبر عمليات التشغيل، مما يتيح سير عمل مثل الاجتماعات اليومية الموجزة التي تبني على الملخصات السابقة.

بالنسبة للمهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيفًا بأفضل جهد للمتصفح لتلك الجلسة الخاصة بـ Cron. ويتم تجاهل إخفاقات التنظيف بحيث تظل نتيجة Cron الفعلية هي المعتمدة.

كما تتخلص عمليات Cron المعزولة من أي مثيلات وقت تشغيل MCP المجمعة التي أُنشئت للمهمة عبر مسار تنظيف وقت التشغيل المشترك. وهذا يطابق طريقة إيقاف عملاء MCP في الجلسة الرئيسية والجلسات المخصصة، بحيث لا تتسبب مهام Cron المعزولة في تسريب عمليات فرعية stdio أو اتصالات MCP طويلة الأمد عبر عمليات التشغيل.

عندما تنسّق عمليات Cron المعزولة وكلاء فرعيين، فإن التسليم يفضّل أيضًا مخرجات التابع النهائي على النص المؤقت القديم من الأصل. وإذا كان التابعون لا يزالون قيد التشغيل، فإن OpenClaw يحجب هذا التحديث الجزئي من الأصل بدلًا من إعلانه.

### خيارات الحمولة للمهام المعزولة

- `--message`: نص الموجّه (مطلوب للمهام المعزولة)
- `--model` / `--thinking`: تجاوزات النموذج ومستوى التفكير
- `--light-context`: تخطي حقن ملف تهيئة مساحة العمل
- `--tools exec,read`: تقييد الأدوات التي يمكن للمهمة استخدامها

يستخدم `--model` النموذج المسموح المحدد لتلك المهمة. وإذا لم يكن النموذج المطلوب مسموحًا، يسجل Cron تحذيرًا ويعود بدلًا من ذلك إلى اختيار النموذج الافتراضي/نموذج الوكيل الخاص بالمهمة. وتظل سلاسل الرجوع الاحتياطي المهيأة مطبقة، لكن تجاوز النموذج العادي من دون قائمة رجوع احتياطي صريحة لكل مهمة لم يعد يضيف النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي مخفي.

أولوية اختيار النموذج للمهام المعزولة هي:

1. تجاوز نموذج Gmail hook (عندما يكون التشغيل قادمًا من Gmail ويكون هذا التجاوز مسموحًا)
2. `model` في حمولة كل مهمة
3. تجاوز نموذج جلسة Cron المخزَّن
4. اختيار النموذج الافتراضي/نموذج الوكيل

يتبع الوضع السريع الاختيار الحي الذي تم حله أيضًا. إذا كان إعداد النموذج المحدد يحتوي على `params.fastMode`، فإن Cron المعزول يستخدمه افتراضيًا. ولا يزال تجاوز `fastMode` المخزَّن في الجلسة يتفوق على الإعداد في كلا الاتجاهين.

إذا واجه تشغيل معزول عملية تسليم live model-switch، فإن Cron يعيد المحاولة مع المزوّد/النموذج الذي تم التحويل إليه ويحفظ هذا الاختيار الحي قبل إعادة المحاولة. وعندما يتضمن التحويل أيضًا ملف تعريف مصادقة جديدًا، فإن Cron يحفظ تجاوز ملف تعريف المصادقة هذا أيضًا. وتكون إعادة المحاولة محدودة: بعد المحاولة الأولية إضافة إلى محاولتي تحويل، يُجهِض Cron بدلًا من الاستمرار في حلقة لا نهائية.

## التسليم والمخرجات

| الوضع      | ما الذي يحدث                                                    |
| ---------- | ---------------------------------------------------------------- |
| `announce` | تسليم النص النهائي احتياطيًا إلى الهدف إذا لم يرسله الوكيل      |
| `webhook`  | إرسال حمولة حدث POST مكتمل إلى URL                              |
| `none`     | لا يوجد تسليم احتياطي من المشغّل                                 |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى القناة. وبالنسبة لمواضيع منتديات Telegram، استخدم `-1001234567890:topic:123`. ويجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>` و`user:<id>`).

بالنسبة للمهام المعزولة، يكون تسليم الدردشة مشتركًا. إذا كان مسار الدردشة متاحًا، فيمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. وإذا أرسل الوكيل إلى الهدف المهيأ/الحالي، فإن OpenClaw يتجاوز الإعلان الاحتياطي. وخلاف ذلك، فإن `announce` و`webhook` و`none` تتحكم فقط في ما يفعله المشغّل بالرد النهائي بعد دورة الوكيل.

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يحدد `cron.failureDestination` قيمة افتراضية عامة لإشعارات الفشل.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُضبط أي منهما وكانت المهمة تُسلَّم أصلًا عبر `announce`، فإن إشعارات الفشل تعود الآن احتياطيًا إلى هدف الإعلان الأساسي هذا.
- لا يكون `delivery.failureDestination` مدعومًا إلا في المهام ذات `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.

## أمثلة CLI

تذكير لمرة واحدة (الجلسة الرئيسية):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

مهمة معزولة متكررة مع التسليم:

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

يجب أن يتضمن كل طلب رمز hook المميز عبر ترويسة:

- `Authorization: Bearer <token>` (موصى به)
- `x-openclaw-token: <token>`

تُرفَض الرموز المميزة في سلسلة الاستعلام.

### POST /hooks/wake

أدرِج حدث نظام للجلسة الرئيسية:

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
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

الحقول: `message` (مطلوب)، و`name`، و`agentId`، و`wakeMode`، و`deliver`، و`channel`، و`to`، و`model`، و`thinking`، و`timeoutSeconds`.

### Hooks المعيّنة (POST /hooks/\<name\>)

تُحَل أسماء hooks المخصصة عبر `hooks.mappings` في الإعدادات. ويمكن لعمليات التعيين تحويل الحمولات العشوائية إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات برمجية.

### الأمان

- أبقِ نقاط نهاية hook خلف loopback أو tailnet أو reverse proxy موثوق.
- استخدم رمز hook مميزًا مخصصًا؛ لا تعِد استخدام رموز مصادقة Gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ يتم رفض `/`.
- اضبط `hooks.allowedAgentIds` للحد من توجيه `agentId` الصريح.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يحددها المتصل.
- إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلَّف حمولات hook بحدود أمان افتراضيًا.

## تكامل Gmail PubSub

اربط مشغلات صندوق الوارد في Gmail بـ OpenClaw عبر Google PubSub.

**المتطلبات المسبقة**: CLI `gcloud`، و`gog` (`gogcli`)، وتمكين OpenClaw hooks، وTailscale لنقطة نهاية HTTPS العامة.

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعداد `hooks.gmail`، ويفعّل الإعداد المسبق لـ Gmail، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### التشغيل التلقائي لـ Gateway

عندما يكون `hooks.enabled=true` ويكون `hooks.gmail.account` مضبوطًا، يبدأ Gateway الأمر `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء الاشتراك.

### إعداد يدوي لمرة واحدة

1. اختر مشروع GCP الذي يملك عميل OAuth المستخدم بواسطة `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. أنشئ topic وامنح Gmail إذن الوصول للدفع:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. ابدأ المراقبة:

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
# سرد جميع المهام
openclaw cron list

# عرض مهمة واحدة، بما في ذلك مسار التسليم المحلول
openclaw cron show <jobId>

# تعديل مهمة
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# فرض تشغيل مهمة الآن
openclaw cron run <jobId>

# التشغيل فقط إذا حان وقتها
openclaw cron run <jobId> --due

# عرض سجل التشغيل
openclaw cron runs --id <jobId> --limit 50

# حذف مهمة
openclaw cron remove <jobId>

# اختيار الوكيل (إعدادات متعددة الوكلاء)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

ملاحظة حول تجاوز النموذج:

- يغيّر `openclaw cron add|edit --model ...` النموذج المحدد للمهمة.
- إذا كان النموذج مسموحًا، فإن هذا المزوّد/النموذج المحدد بالضبط يصل إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا، فإن Cron يحذّر ويعود إلى اختيار النموذج الافتراضي/نموذج الوكيل الخاص بالمهمة.
- تظل سلاسل الرجوع الاحتياطي المهيأة مطبقة، لكن تجاوز `--model` العادي من دون قائمة رجوع احتياطي صريحة لكل مهمة لم يعد ينتقل إلى النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

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

يُشتق ملف sidecar لحالة وقت التشغيل من `cron.store`: يستخدم مخزن `.json` مثل
`~/clawd/cron/jobs.json` الملف `~/clawd/cron/jobs-state.json`، بينما يضيف مسار المخزن
الذي لا يحتوي على اللاحقة `.json` اللاحقة `-state.json`.

تعطيل Cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

**إعادة محاولة المرة الواحدة**: تعيد الأخطاء العابرة (حد المعدل، والتحميل الزائد، والشبكة، وخطأ الخادم) المحاولة حتى 3 مرات مع تراجع أسي. أما الأخطاء الدائمة فتعطَّل فورًا.

**إعادة محاولة المهام المتكررة**: تراجع أسي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. ويُعاد ضبط التراجع بعد التشغيل الناجح التالي.

**الصيانة**: يقوم `cron.sessionRetention` (الافتراضي `24h`) بتقليم إدخالات جلسات التشغيل المعزولة. ويقوم `cron.runLog.maxBytes` / `cron.runLog.keepLines` بتقليم ملفات سجل التشغيل تلقائيًا.

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

- تحقّق من `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
- تأكد من أن Gateway يعمل باستمرار.
- بالنسبة لجداول `cron`، تحقّق من المنطقة الزمنية (`--tz`) مقابل المنطقة الزمنية للمضيف.
- تعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي تم التحقق منه باستخدام `openclaw cron run <jobId> --due` وأن وقت المهمة لم يحن بعد.

### تم تشغيل Cron ولكن لا يوجد تسليم

- يعني وضع التسليم `none` أنه لا يُتوقع أي إرسال احتياطي من المشغّل. ولا يزال بإمكان الوكيل الإرسال مباشرةً باستخدام أداة `message` عندما يكون مسار الدردشة متاحًا.
- يعني فقدان/عدم صلاحية هدف التسليم (`channel`/`to`) أنه تم تخطي الإرسال الخارجي.
- تعني أخطاء مصادقة القناة (`unauthorized` و`Forbidden`) أن التسليم تم حجبه بسبب بيانات الاعتماد.
- إذا أعاد التشغيل المعزول الرمز الصامت فقط (`NO_REPLY` / `no_reply`)، فإن OpenClaw يمنع التسليم الخارجي المباشر ويمنع أيضًا مسار الملخص الاحتياطي الموضوع في قائمة الانتظار، لذلك لا يتم نشر أي شيء مرة أخرى إلى الدردشة.
- إذا كان من المفترض أن يرسل الوكيل رسالة إلى المستخدم بنفسه، فتحقق من أن المهمة لديها مسار قابل للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

### ملاحظات مهمة حول المنطقة الزمنية

- يستخدم Cron بدون `--tz` المنطقة الزمنية لمضيف gateway.
- تُعامل جداول `at` بدون منطقة زمنية على أنها UTC.
- يستخدم `activeHours` الخاص بـ Heartbeat حل المنطقة الزمنية المهيأ.

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — لمحة سريعة عن جميع آليات الأتمتة
- [مهام الخلفية](/ar/automation/tasks) — سجل المهام لعمليات تنفيذ Cron
- [Heartbeat](/ar/gateway/heartbeat) — دورات الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعدادات المنطقة الزمنية
