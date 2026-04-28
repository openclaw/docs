---
read_when:
    - جدولة المهام الخلفية أو عمليات التنبيه
    - ربط المشغلات الخارجية (Webhooks وGmail) بـ OpenClaw
    - اتخاذ قرار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Scheduled tasks
summary: المهام المجدولة وWebhooks ومشغلات Gmail PubSub لجدولة Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-04-26T11:22:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron هو المجدول المدمج في Gateway. وهو يحتفظ بالمهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه إعادة تسليم المخرجات إلى قناة دردشة أو نقطة نهاية Webhook.

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

- يعمل Cron **داخل** عملية Gateway (وليس داخل النموذج).
- تُحفَظ تعريفات المهام بشكل دائم في `~/.openclaw/cron/jobs.json` حتى لا تؤدي عمليات إعادة التشغيل إلى فقدان الجداول.
- تُحفَظ حالة التنفيذ أثناء التشغيل بشكل دائم بجواره في `~/.openclaw/cron/jobs-state.json`. إذا كنت تتتبع تعريفات cron في git، فتتبع `jobs.json` وأضف `jobs-state.json` إلى `gitignore`.
- بعد هذا الفصل، يمكن لإصدارات OpenClaw الأقدم قراءة `jobs.json` لكنها قد تتعامل مع المهام على أنها جديدة لأن حقول وقت التشغيل أصبحت الآن موجودة في `jobs-state.json`.
- تنشئ جميع عمليات تنفيذ cron سجلات [مهام الخلفية](/ar/automation/tasks).
- تُحذَف المهام ذات التشغيل الواحد (`--at`) تلقائيًا بعد النجاح افتراضيًا.
- تحاول عمليات cron المعزولة، قدر الإمكان، إغلاق علامات تبويب/عمليات المتصفح المتتبعة الخاصة بجلسة `cron:<jobId>` عند اكتمال التشغيل، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- تحمي عمليات cron المعزولة أيضًا من ردود الإقرار القديمة. إذا كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it` و`pulling everything together` وتلميحات مشابهة) ولم يعد أي تشغيل تابع فرعي مسؤولًا عن الإجابة النهائية، فإن OpenClaw يعيد الطلب مرة واحدة للحصول على النتيجة الفعلية قبل التسليم.

<a id="maintenance"></a>

<Note>
تعتمد مطابقة المهام لـ cron أولًا على وقت التشغيل الذي يملكها، وثانيًا على السجل الدائم: تظل مهمة cron النشطة فعالة ما دام وقت تشغيل cron لا يزال يتتبع تلك المهمة على أنها قيد التشغيل، حتى لو كان لا يزال هناك صف جلسة فرعية قديم موجودًا. بمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي مهلة السماح البالغة 5 دقائق، تتحقق فحوصات الصيانة من سجلات التشغيل المحفوظة وحالة المهمة للتشغيل المطابق `cron:<jobId>:<startedAt>`. إذا أظهر هذا السجل الدائم نتيجة نهائية، فيجري إنهاء سجل المهمة بالاعتماد عليه؛ وإلا فقد تضع الصيانة المملوكة من Gateway علامة `lost` على المهمة. يمكن لتدقيق CLI دون اتصال الاستعادة من السجل الدائم، لكنه لا يعتبر مجموعة المهام النشطة الفارغة الخاصة به داخل العملية دليلًا على أن تشغيل cron المملوك من Gateway قد اختفى.
</Note>

## أنواع الجداول

| النوع    | علامة CLI  | الوصف                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لمرة واحدة (ISO 8601 أو نسبي مثل `20m`)      |
| `every` | `--every` | فاصل زمني ثابت                                          |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري       |

تُعامَل الطوابع الزمنية التي لا تحتوي على منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة حسب التوقيت المحلي على الساعة الحائطية.

تُوزَّع تعبيرات التكرار أعلى الساعة تلقائيًا بما يصل إلى 5 دقائق لتقليل طفرات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لتحديد نافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تُحلَّل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون كل من حقلي يوم الشهر ويوم الأسبوع غير عامَّين، فإن croner يطابق عندما يتطابق **أيّ** من الحقلين — وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# المقصود: "الساعة 9 صباحًا في اليوم 15، فقط إذا كان يوم الاثنين"
# الفعلي:  "الساعة 9 صباحًا في كل يوم 15، و9 صباحًا في كل يوم اثنين"
0 9 15 * 1
```

يؤدي هذا إلى التشغيل نحو 5–6 مرات شهريًا بدلًا من 0–1 مرة شهريًا. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لاشتراط تحقق الشرطين معًا، استخدم معدِّل يوم الأسبوع `+` في Croner (`0 9 15 * +1`) أو جدولة أحد الحقلين والتحقق من الآخر داخل prompt أو الأمر الخاص بمهمتك.

## أنماط التنفيذ

| النمط           | قيمة `--session`     | يعمل في                  | الأفضل لـ                     |
| --------------- | ------------------- | ------------------------ | ----------------------------- |
| الجلسة الرئيسية | `main`              | دورة Heartbeat التالية   | التذكيرات، وأحداث النظام      |
| معزول           | `isolated`          | `cron:<jobId>` مخصص      | التقارير، والأعمال الخلفية    |
| الجلسة الحالية  | `current`           | يرتبط وقت الإنشاء        | الأعمال المتكررة الواعية بالسياق |
| جلسة مخصصة      | `session:custom-id` | جلسة مسماة دائمة         | سير العمل المبني على السجل    |

<AccordionGroup>
  <Accordion title="الجلسة الرئيسية مقابل المعزولة مقابل المخصصة">
    تُدرِج مهام **الجلسة الرئيسية** حدث نظام في قائمة الانتظار، ويمكنها اختياريًا إيقاظ Heartbeat (`--wake now` أو `--wake next-heartbeat`). لا تُمدِّد أحداث النظام هذه حداثة إعادة الضبط اليومية/الخمول للجلسة المستهدفة. تعمل المهام **المعزولة** على تنفيذ دورة وكيل مخصصة بجلسة جديدة. أما **الجلسات المخصصة** (`session:xxx`) فتحافظ على السياق عبر عمليات التشغيل، مما يتيح سير عمل مثل الاجتماعات اليومية المختصرة التي تبني على الملخصات السابقة.
  </Accordion>
  <Accordion title="ما المقصود بـ &quot;جلسة جديدة&quot; للمهام المعزولة">
    بالنسبة إلى المهام المعزولة، تعني "جلسة جديدة" معرّف transcript/session جديدًا لكل عملية تشغيل. قد ينقل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السريع/التفصيلي، والتسميات، وتجاوزات model/auth التي اختارها المستخدم صراحةً، لكنه لا يرث سياق المحادثة المحيط من صف cron أقدم: توجيه القناة/المجموعة، أو سياسة الإرسال أو قائمة الانتظار، أو التصعيد، أو المصدر، أو ربط وقت تشغيل ACP. استخدم `current` أو `session:<id>` عندما ينبغي لمهمة متكررة أن تبني عمدًا على سياق المحادثة نفسه.
  </Accordion>
  <Accordion title="تنظيف وقت التشغيل">
    بالنسبة إلى المهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيف المتصفح بأفضل جهد لتلك الجلسة الخاصة بـ cron. يتم تجاهل إخفاقات التنظيف حتى تبقى نتيجة cron الفعلية هي الحاسمة.

    تتخلّص عمليات cron المعزولة أيضًا من أي مثيلات MCP runtime مضمّنة أُنشئت للمهمة عبر مسار تنظيف وقت التشغيل المشترك. يتطابق هذا مع طريقة إنهاء عملاء MCP في الجلسة الرئيسية والجلسات المخصصة، حتى لا تتسبب مهام cron المعزولة في تسريب عمليات stdio الفرعية أو اتصالات MCP طويلة العمر عبر عمليات التشغيل.

  </Accordion>
  <Accordion title="التسليم عبر الوكلاء الفرعيين وDiscord">
    عندما تنسّق عمليات cron المعزولة وكلاء فرعيين، يفضّل التسليم أيضًا مخرجات السليل النهائي على النص المؤقت القديم من الأصل. وإذا كانت الوحدات التابعة لا تزال تعمل، فإن OpenClaw يحجب هذا التحديث الجزئي من الأصل بدلًا من إعلانه.

    بالنسبة إلى أهداف الإعلان النصية فقط في Discord، يرسل OpenClaw النص النهائي القياسي للمساعد مرة واحدة بدلًا من إعادة تشغيل كل من حمولات النص المتدفقة/الوسيطة والإجابة النهائية. أما حمولات Discord الخاصة بالوسائط والبنية المنظمة فلا تزال تُسلَّم كحمولات منفصلة حتى لا تُفقَد المرفقات والمكونات.

  </Accordion>
</AccordionGroup>

### خيارات الحمولة للمهام المعزولة

<ParamField path="--message" type="string" required>
  نص prompt (مطلوب للمهام المعزولة).
</ParamField>
<ParamField path="--model" type="string">
  تجاوز model؛ يستخدم model المحدد والمسموح به للمهمة.
</ParamField>
<ParamField path="--thinking" type="string">
  تجاوز مستوى التفكير.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تخطَّ حقن ملف تهيئة مساحة العمل.
</ParamField>
<ParamField path="--tools" type="string">
  قَيِّد الأدوات التي يمكن للمهمة استخدامها، مثل `--tools exec,read`.
</ParamField>

يستخدم `--model` model المحدد والمسموح به لتلك المهمة. إذا لم يكن model المطلوب مسموحًا به، يسجل cron تحذيرًا ويعود بدلًا من ذلك إلى اختيار model الافتراضي/Model الوكيل الخاص بالمهمة. لا تزال سلاسل fallback المهيأة تنطبق، لكن تجاوز model العادي من دون قائمة fallback صريحة لكل مهمة لم يعد يضيف model الأساسي للوكيل كهدف إعادة محاولة مخفي إضافي.

أولوية اختيار model للمهام المعزولة هي:

1. تجاوز model من خطاف Gmail (عندما تكون عملية التشغيل قد جاءت من Gmail وكان هذا التجاوز مسموحًا به)
2. `model` في حمولة كل مهمة
3. تجاوز model المخزن لجلسة cron الذي اختاره المستخدم
4. اختيار model الافتراضي/Model الوكيل

يتبع الوضع السريع Fast mode التحديد النهائي النشط أيضًا. إذا كان إعداد model المحدد يحتوي على `params.fastMode`، فإن cron المعزول يستخدمه افتراضيًا. ولا يزال تجاوز `fastMode` المخزَّن للجلسة يتقدّم على الإعداد في كلا الاتجاهين.

إذا واجهت عملية تشغيل معزولة عملية تسليم model-switch حيّة، يعيد cron المحاولة باستخدام provider/model اللذين تم التحويل إليهما ويحفظ هذا التحديد الحي لعملية التشغيل النشطة قبل إعادة المحاولة. وعندما يحمل التحويل أيضًا ملف تعريف auth جديدًا، يحفظ cron تجاوز ملف تعريف auth هذا لعملية التشغيل النشطة أيضًا. تكون إعادة المحاولات محدودة: بعد المحاولة الأولية بالإضافة إلى محاولتي تحويل، يوقف cron العملية بدلًا من الدخول في حلقة لا نهائية.

## التسليم والمخرجات

| الوضع      | ما الذي يحدث                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | يسلّم النص النهائي إلى الهدف احتياطيًا إذا لم يرسله الوكيل         |
| `webhook`  | يرسل حمولة حدث مكتمل عبر POST إلى URL                              |
| `none`     | لا يوجد تسليم احتياطي من المشغّل                                   |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى القنوات. وبالنسبة إلى مواضيع منتديات Telegram، استخدم `-1001234567890:topic:123`. ينبغي أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>` و`user:<id>`). معرّفات غرف Matrix حساسة لحالة الأحرف؛ استخدم معرّف الغرفة الدقيق أو الصيغة `room:!room:server` من Matrix.

بالنسبة إلى المهام المعزولة، يكون تسليم الدردشة مشتركًا. إذا كان مسار الدردشة متاحًا، يمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. إذا أرسل الوكيل إلى الهدف المهيأ/الحالي، يتخطى OpenClaw الإعلان الاحتياطي. بخلاف ذلك، فإن `announce` و`webhook` و`none` تتحكم فقط فيما يفعله المشغّل بالرد النهائي بعد دورة الوكيل.

عندما ينشئ وكيل تذكيرًا معزولًا من دردشة نشطة، يخزن OpenClaw هدف التسليم الحي المحفوظ لمسار الإعلان الاحتياطي. قد تكون مفاتيح الجلسة الداخلية بأحرف صغيرة؛ ولا يُعاد تكوين أهداف تسليم provider من تلك المفاتيح عندما يكون سياق الدردشة الحالي متاحًا.

تتبع إشعارات الإخفاق مسار وجهة منفصلًا:

- يحدد `cron.failureDestination` القيمة الافتراضية العامة لإشعارات الإخفاق.
- يتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُضبط أي منهما وكانت المهمة تُسلِّم أصلًا عبر `announce`، فإن إشعارات الإخفاق تعود الآن إلى هدف الإعلان الأساسي هذا.
- لا يكون `delivery.failureDestination` مدعومًا إلا في المهام ذات `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.

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
  <Tab title="تجاوز model ومستوى التفكير">
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

يمكن لـ Gateway عرض نقاط نهاية HTTP Webhook للمشغلات الخارجية. فعّل ذلك في الإعدادات:

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

يتم رفض الرموز المميزة في سلسلة الاستعلام.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    أدرِج حدث نظام في قائمة الانتظار للجلسة الرئيسية:

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

    الحقول: `message` (مطلوب)، و`name`، و`agentId`، و`wakeMode`، و`deliver`، و`channel`، و`to`، و`model`، و`thinking`، و`timeoutSeconds`.

  </Accordion>
  <Accordion title="الخطافات المعيّنة (POST /hooks/<name>)">
    تُحل أسماء الخطافات المخصصة عبر `hooks.mappings` في الإعدادات. ويمكن لعمليات التعيين تحويل الحمولات الاعتباطية إلى إجراءات `wake` أو `agent` باستخدام القوالب أو تحولات الكود.
  </Accordion>
</AccordionGroup>

<Warning>
احتفِظ بنقاط نهاية الخطافات خلف local loopback أو tailnet أو وكيل عكسي موثوق.

- استخدم رمز خطاف مخصصًا؛ ولا تُعد استخدام رموز مصادقة gateway.
- احتفِظ بـ `hooks.path` في مسار فرعي مخصص؛ يتم رفض `/`.
- اضبط `hooks.allowedAgentIds` لتقييد التوجيه الصريح عبر `agentId`.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يحددها المتصل.
- إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلَّف حمولات الخطافات بحدود أمان افتراضيًا.
</Warning>

## تكامل Gmail PubSub

اربط مشغلات صندوق الوارد في Gmail بـ OpenClaw عبر Google PubSub.

<Note>
**المتطلبات المسبقة:** CLI `gcloud`، و`gog` (gogcli)، وتفعيل خطافات OpenClaw، وTailscale لنقطة النهاية العامة عبر HTTPS.
</Note>

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعداد `hooks.gmail`، ويفعّل الإعداد المسبق لـ Gmail، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### التشغيل التلقائي لـ Gateway

عندما يكون `hooks.enabled=true` و`hooks.gmail.account` مضبوطًا، يبدأ Gateway الأمر `gog gmail watch serve` عند الإقلاع ويجدّد المراقبة تلقائيًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء ذلك.

### إعداد يدوي لمرة واحدة

<Steps>
  <Step title="حدد مشروع GCP">
    حدِّد مشروع GCP الذي يملك عميل OAuth المستخدم بواسطة `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="أنشئ topic وامنح Gmail صلاحية push">
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

### تجاوز model لـ Gmail

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
# أدرج كل المهام
openclaw cron list

# اعرض مهمة واحدة، بما في ذلك مسار التسليم المحلول
openclaw cron show <jobId>

# عدّل مهمة
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# شغّل مهمة الآن بالقوة
openclaw cron run <jobId>

# شغّل فقط إذا حان موعدها
openclaw cron run <jobId> --due

# اعرض سجل التشغيل
openclaw cron runs --id <jobId> --limit 50

# احذف مهمة
openclaw cron remove <jobId>

# اختيار الوكيل (في إعدادات متعددة الوكلاء)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
ملاحظة حول تجاوز model:

- يغيّر `openclaw cron add|edit --model ...` model المحدد للمهمة.
- إذا كان model مسموحًا به، يصل هذا provider/model المحدد بالضبط إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا به، يحذر cron ويعود إلى اختيار model الافتراضي/Model الوكيل الخاص بالمهمة.
- لا تزال سلاسل fallback المهيأة تنطبق، لكن تجاوز `--model` العادي من دون قائمة fallback صريحة لكل مهمة لم يعد يتراجع إلى model الأساسي للوكيل بوصفه هدف إعادة محاولة إضافيًا صامتًا.
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

تُشتق حالة sidecar الخاصة بوقت التشغيل من `cron.store`: فالمخزن ذو الامتداد `.json` مثل `~/clawd/cron/jobs.json` يستخدم `~/clawd/cron/jobs-state.json`، بينما يضيف مسار المخزن الذي لا ينتهي باللاحقة `.json` اللاحقة `-state.json`.

لتعطيل cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="سلوك إعادة المحاولة">
    **إعادة محاولة لمرة واحدة**: تعاد محاولة الأخطاء العابرة (حد المعدل، والتحميل الزائد، والشبكة، وخطأ الخادم) حتى 3 مرات مع تراجع أُسّي. أما الأخطاء الدائمة فتُعطَّل فورًا.

    **إعادة محاولة للمهام المتكررة**: تراجع أُسّي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. يُعاد ضبط التراجع بعد عملية التشغيل الناجحة التالية.

  </Accordion>
  <Accordion title="الصيانة">
    يقوم `cron.sessionRetention` (الافتراضي `24h`) بتقليم إدخالات جلسات التشغيل المعزولة. كما يقوم `cron.runLog.maxBytes` / `cron.runLog.keepLines` بتقليم ملفات سجل التشغيل تلقائيًا.
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
    - تحقّق من `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
    - أكِّد أن Gateway يعمل بشكل مستمر.
    - بالنسبة إلى جداول `cron`، تحقّق من المنطقة الزمنية (`--tz`) مقابل المنطقة الزمنية للمضيف.
    - تعني `reason: not-due` في مخرجات التشغيل أنه تم التحقق من التشغيل اليدوي باستخدام `openclaw cron run <jobId> --due` وأن موعد المهمة لم يحن بعد.
  </Accordion>
  <Accordion title="تم تشغيل Cron ولكن لم يحدث تسليم">
    - يعني وضع التسليم `none` أنه لا يُتوقع إرسال احتياطي من المشغّل. ولا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message` عند توفر مسار دردشة.
    - يعني فقدان هدف التسليم أو عدم صحته (`channel`/`to`) أنه تم تخطي الإرسال الصادر.
    - بالنسبة إلى Matrix، قد تفشل المهام المنسوخة أو القديمة التي تحتوي على معرّفات غرف `delivery.to` مكتوبة بأحرف صغيرة لأن معرّفات غرف Matrix حساسة لحالة الأحرف. عدّل المهمة إلى القيمة الدقيقة `!room:server` أو `room:!room:server` من Matrix.
    - تعني أخطاء مصادقة القنوات (`unauthorized` و`Forbidden`) أن التسليم حُظر بسبب بيانات الاعتماد.
    - إذا أعاد التشغيل المعزول فقط الرمز الصامت (`NO_REPLY` / `no_reply`)، فسيحجب OpenClaw التسليم المباشر الصادر كما يحجب أيضًا مسار الملخص الاحتياطي الموضوع في قائمة الانتظار، لذلك لن يُنشر شيء إلى الدردشة.
    - إذا كان من المفترض أن يراسل الوكيل المستخدم بنفسه، فتحقّق من أن المهمة تملك مسارًا قابلًا للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدفًا صريحًا).
  </Accordion>
  <Accordion title="يبدو أن Cron أو Heartbeat يمنعان التدوير بأسلوب /new">
    - لا تستند حداثة إعادة الضبط اليومية وإعادة الضبط عند الخمول إلى `updatedAt`؛ راجع [إدارة الجلسات](/ar/concepts/session#session-lifecycle).
    - قد تقوم عمليات الإيقاظ الخاصة بـ cron، وعمليات تشغيل Heartbeat، وإشعارات exec، وعمليات مسك الدفاتر الخاصة بـ gateway بتحديث صف الجلسة لأغراض التوجيه/الحالة، لكنها لا تمدد `sessionStartedAt` أو `lastInteractionAt`.
    - بالنسبة إلى الصفوف القديمة التي أُنشئت قبل وجود هذه الحقول، يمكن لـ OpenClaw استعادة `sessionStartedAt` من ترويسة جلسة transcript JSONL عندما يكون الملف لا يزال متاحًا. وتستخدم صفوف الخمول القديمة التي لا تحتوي على `lastInteractionAt` وقت البدء المستعاد هذا كأساس للخمول.
  </Accordion>
  <Accordion title="مزالق المنطقة الزمنية">
    - يستخدم cron من دون `--tz` المنطقة الزمنية لمضيف gateway.
    - تُعامَل جداول `at` التي لا تحتوي على منطقة زمنية على أنها UTC.
    - يستخدم `activeHours` في Heartbeat دقة المنطقة الزمنية المهيأة.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — نظرة سريعة على جميع آليات الأتمتة
- [مهام الخلفية](/ar/automation/tasks) — سجل المهام لعمليات تنفيذ cron
- [Heartbeat](/ar/gateway/heartbeat) — دورات الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعدادات المنطقة الزمنية
