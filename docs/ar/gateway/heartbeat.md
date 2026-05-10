---
read_when:
    - ضبط وتيرة Heartbeat أو الرسائل
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Heartbeat
summary: رسائل استطلاع Heartbeat وقواعد الإشعارات
title: Heartbeat
x-i18n:
    generated_at: "2026-05-10T19:40:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c4a4076ff4c7a88b47a9bb4daff56b3075173e79409a991ac564ad6ab305a9d
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat مقابل Cron؟** راجع [الأتمتة والمهام](/ar/automation) للحصول على إرشادات حول متى تستخدم كلًا منهما.
</Note>

يشغّل Heartbeat **دورات وكيل دورية** في الجلسة الرئيسية حتى يتمكن النموذج من إظهار أي شيء يحتاج إلى انتباهك دون إزعاجك برسائل متكررة.

Heartbeat هو دورة مجدولة في الجلسة الرئيسية — ولا ينشئ سجلات [مهمة خلفية](/ar/automation/tasks). سجلات المهام مخصصة للعمل المنفصل (تشغيلات ACP، والوكلاء الفرعيون، ومهام Cron المعزولة).

استكشاف الأخطاء وإصلاحها: [المهام المجدولة](/ar/automation/cron-jobs#troubleshooting)

## البدء السريع (للمبتدئين)

<Steps>
  <Step title="اختر وتيرة">
    اترك Heartbeat مفعّلًا (القيمة الافتراضية هي `30m`، أو `1h` لمصادقة Anthropic OAuth/token، بما في ذلك إعادة استخدام Claude CLI) أو اضبط وتيرتك الخاصة.
  </Step>
  <Step title="أضف HEARTBEAT.md (اختياري)">
    أنشئ قائمة تحقق صغيرة في `HEARTBEAT.md` أو كتلة `tasks:` في مساحة عمل الوكيل.
  </Step>
  <Step title="حدد أين يجب أن تذهب رسائل Heartbeat">
    `target: "none"` هو الإعداد الافتراضي؛ اضبط `target: "last"` للتوجيه إلى آخر جهة اتصال.
  </Step>
  <Step title="ضبط اختياري">
    - فعّل تسليم استدلال Heartbeat للشفافية.
    - استخدم سياق تمهيد خفيفًا إذا كانت تشغيلات Heartbeat تحتاج فقط إلى `HEARTBEAT.md`.
    - فعّل الجلسات المعزولة لتجنب إرسال سجل المحادثة الكامل في كل Heartbeat.
    - قيّد Heartbeat بساعات النشاط (بالتوقيت المحلي).

  </Step>
</Steps>

مثال إعداد:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## الإعدادات الافتراضية

- الفاصل الزمني: `30m` (أو `1h` عندما يكون وضع المصادقة المكتشف هو Anthropic OAuth/token، بما في ذلك إعادة استخدام Claude CLI). اضبط `agents.defaults.heartbeat.every` أو `agents.list[].heartbeat.every` لكل وكيل؛ استخدم `0m` للتعطيل.
- نص الموجه (قابل للضبط عبر `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- يُرسل موجه Heartbeat **حرفيًا** كرسالة المستخدم. يتضمن موجه النظام قسم "Heartbeat" فقط عندما تكون Heartbeat مفعّلة للوكيل الافتراضي، وتُعلَّم التشغيلة داخليًا.
- عند تعطيل Heartbeat باستخدام `0m`، تستبعد التشغيلات العادية أيضًا `HEARTBEAT.md` من سياق التمهيد حتى لا يرى النموذج تعليمات مخصصة لـ Heartbeat فقط.
- تُفحص ساعات النشاط (`heartbeat.activeHours`) في المنطقة الزمنية المضبوطة. خارج النافذة، تُتخطى Heartbeat حتى الدقة التالية داخل النافذة.
- تؤجل Heartbeat نفسها تلقائيًا أثناء نشاط عمل Cron أو وجوده في قائمة الانتظار. اضبط `heartbeat.skipWhenBusy: true` للتأجيل أيضًا في المسارات الإضافية المشغولة (عمل وكيل فرعي أو أمر متداخل)؛ وهذا مفيد لـ Ollama المحلي وغيره من المضيفات محدودة وقت التشغيل الفردي.

## الغرض من موجه Heartbeat

الموجه الافتراضي واسع عمدًا:

- **المهام الخلفية**: "Consider outstanding tasks" يدفع الوكيل إلى مراجعة المتابعات (البريد الوارد، التقويم، التذكيرات، العمل في قائمة الانتظار) وإظهار أي شيء عاجل.
- **الاطمئنان على الإنسان**: "Checkup sometimes on your human during day time" يدفع إلى رسالة خفيفة بين الحين والآخر من نوع "هل تحتاج إلى شيء؟"، لكنه يتجنب الرسائل المزعجة ليلًا باستخدام منطقتك الزمنية المحلية المضبوطة (راجع [المنطقة الزمنية](/ar/concepts/timezone)).

يمكن لـ Heartbeat التفاعل مع [المهام الخلفية](/ar/automation/tasks) المكتملة، لكن تشغيل Heartbeat نفسه لا ينشئ سجل مهمة.

إذا أردت من Heartbeat فعل شيء محدد جدًا (مثل "check Gmail PubSub stats" أو "verify gateway health")، فاضبط `agents.defaults.heartbeat.prompt` (أو `agents.list[].heartbeat.prompt`) إلى نص مخصص (يُرسل حرفيًا).

## عقد الاستجابة

- إذا لم يكن هناك ما يحتاج إلى الانتباه، فردّ بـ **`HEARTBEAT_OK`**.
- يمكن لتشغيلات Heartbeat القادرة على استخدام الأدوات أن تستدعي بدلًا من ذلك `heartbeat_respond` مع `notify: false` لعدم إظهار أي تحديث مرئي، أو `notify: true` مع `notificationText` للتنبيه. عند وجودها، تكون استجابة الأداة المنظمة لها الأولوية على بديل النص.
- أثناء تشغيلات Heartbeat، يتعامل OpenClaw مع `HEARTBEAT_OK` كتأكيد عندما يظهر في **بداية أو نهاية** الرد. تُزال العلامة ويُسقط الرد إذا كان المحتوى المتبقي **≤ `ackMaxChars`** (الافتراضي: 300).
- إذا ظهر `HEARTBEAT_OK` في **منتصف** رد، فلا يُعامل معاملة خاصة.
- للتنبيهات، **لا** تُضمّن `HEARTBEAT_OK`؛ أعد نص التنبيه فقط.

خارج Heartbeat، يُزال `HEARTBEAT_OK` العارض في بداية/نهاية الرسالة ويُسجّل؛ أما الرسالة التي تكون فقط `HEARTBEAT_OK` فتُسقط.

## الإعداد

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### النطاق والأسبقية

- يضبط `agents.defaults.heartbeat` سلوك Heartbeat العام.
- يندمج `agents.list[].heartbeat` فوقه؛ إذا كان لدى أي وكيل كتلة `heartbeat`، فـ **هؤلاء الوكلاء فقط** يشغّلون Heartbeat.
- يضبط `channels.defaults.heartbeat` إعدادات الظهور الافتراضية لكل القنوات.
- يتجاوز `channels.<channel>.heartbeat` الإعدادات الافتراضية للقناة.
- يتجاوز `channels.<channel>.accounts.<id>.heartbeat` (القنوات متعددة الحسابات) إعدادات كل قناة.

### عمليات Heartbeat لكل وكيل

إذا كان أي إدخال في `agents.list[]` يتضمن كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغلون عمليات Heartbeat. تُدمج الكتلة الخاصة بالوكيل فوق `agents.defaults.heartbeat` (لذا يمكنك ضبط الإعدادات الافتراضية المشتركة مرة واحدة وتجاوزها لكل وكيل).

مثال: وكيلان، الوكيل الثاني فقط يشغل عمليات Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### مثال على الساعات النشطة

اقصر عمليات Heartbeat على ساعات العمل في منطقة زمنية محددة:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

خارج هذه النافذة (قبل 9 صباحًا أو بعد 10 مساءً بالتوقيت الشرقي)، يتم تخطي عمليات Heartbeat. سيعمل المؤشر المجدول التالي داخل النافذة بشكل طبيعي.

### إعداد 24/7

إذا أردت تشغيل عمليات Heartbeat طوال اليوم، فاستخدم أحد هذه الأنماط:

- احذف `activeHours` بالكامل (لا يوجد تقييد بنافذة زمنية؛ وهذا هو السلوك الافتراضي).
- اضبط نافذة يوم كامل: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
لا تضبط وقتَي `start` و`end` نفسيهما (مثلًا من `08:00` إلى `08:00`). يُعامل ذلك كنافذة بعرض صفري، لذلك يتم دائمًا تخطي عمليات Heartbeat.
</Warning>

### مثال متعدد الحسابات

استخدم `accountId` لاستهداف حساب محدد على القنوات متعددة الحسابات مثل Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### ملاحظات الحقول

<ParamField path="every" type="string">
  فاصل Heartbeat الزمني (سلسلة مدة؛ الوحدة الافتراضية = دقائق).
</ParamField>
<ParamField path="model" type="string">
  تجاوز اختياري للنموذج لتشغيلات Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  عند التفعيل، يتم أيضًا توصيل رسالة `Reasoning:` المنفصلة عندما تكون متاحة (بنفس شكل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  عندما تكون true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  عندما تكون true، تعمل كل عملية Heartbeat في جلسة جديدة بلا سجل محادثة سابق. تستخدم نمط العزل نفسه مثل Cron `sessionTarget: "isolated"`. يقلل ذلك تكلفة الرموز لكل Heartbeat بشكل كبير. ادمجه مع `lightContext: true` لتحقيق أقصى توفير. لا يزال توجيه التسليم يستخدم سياق الجلسة الرئيسية.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  عندما تكون true، تؤجل تشغيلات Heartbeat نفسها في المسارات شديدة الانشغال: عمل وكيل فرعي أو أمر متداخل. تؤجل مسارات Cron عمليات Heartbeat دائمًا، حتى دون هذا العلم، كي لا يشغل مضيفو النماذج المحلية مطالبات Cron وHeartbeat في الوقت نفسه.
</ParamField>
<ParamField path="session" type="string">
  مفتاح جلسة اختياري لتشغيلات Heartbeat.

- `main` (الافتراضي): الجلسة الرئيسية للوكيل.
- مفتاح جلسة صريح (انسخه من `openclaw sessions --json` أو [CLI الجلسات](/ar/cli/sessions)).
- تنسيقات مفاتيح الجلسات: راجع [الجلسات](/ar/concepts/session) و[المجموعات](/ar/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: يوصّل إلى آخر قناة خارجية مستخدمة.
- قناة صريحة: أي قناة مهيأة أو معرف plugin، مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`.
- `none` (الافتراضي): يشغل Heartbeat لكنه **لا يوصّلها** خارجيًا.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  يتحكم في سلوك التسليم المباشر/DM. `allow`: يسمح بتسليم Heartbeat المباشر/DM. `block`: يمنع التسليم المباشر/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  تجاوز اختياري للمستلم (معرف خاص بالقناة، مثل E.164 لـ WhatsApp أو معرف دردشة Telegram). بالنسبة إلى مواضيع/سلاسل Telegram، استخدم `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  معرف حساب اختياري للقنوات متعددة الحسابات. عندما يكون `target: "last"`، ينطبق معرف الحساب على آخر قناة تم حلها إذا كانت تدعم الحسابات؛ وإلا يتم تجاهله. إذا لم يطابق معرف الحساب حسابًا مهيأً للقناة التي تم حلها، يتم تخطي التسليم.

</ParamField>
<ParamField path="prompt" type="string">
  يتجاوز نص المطالبة الافتراضي (لا يتم دمجه).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  الحد الأقصى للأحرف المسموح بها بعد `HEARTBEAT_OK` قبل التسليم.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  عند ضبطها على true، تكبت حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  يقيّد تشغيلات Heartbeat بنافذة زمنية. كائن يحتوي على `start` (HH:MM، شامل؛ استخدم `00:00` لبداية اليوم)، و`end` (HH:MM غير شامل؛ يُسمح بـ `24:00` لنهاية اليوم)، و`timezone` اختياري.

- عند الحذف أو `"user"`: يستخدم `agents.defaults.userTimezone` إذا كان مضبوطًا، وإلا يعود إلى المنطقة الزمنية لنظام المضيف.
- `"local"`: يستخدم دائمًا المنطقة الزمنية لنظام المضيف.
- أي معرّف IANA (مثل `America/New_York`): يُستخدم مباشرة؛ وإذا كان غير صالح، يعود إلى سلوك `"user"` أعلاه.
- يجب ألا تكون `start` و`end` متساويتين لنافذة نشطة؛ تُعامل القيم المتساوية كعرض صفري (دائمًا خارج النافذة).
- خارج النافذة النشطة، يتم تخطي Heartbeats حتى النبضة التالية داخل النافذة.

</ParamField>

## سلوك التسليم

<AccordionGroup>
  <Accordion title="توجيه الجلسة والهدف">
    - تعمل Heartbeats في جلسة الوكيل الرئيسية افتراضيًا (`agent:<id>:<mainKey>`)، أو `global` عندما تكون `session.scope = "global"`. اضبط `session` للتجاوز إلى جلسة قناة محددة (Discord/WhatsApp/إلخ).
    - يؤثر `session` فقط في سياق التشغيل؛ ويتحكم `target` و`to` في التسليم.
    - للتسليم إلى قناة/مستلم محدد، اضبط `target` + `to`. مع `target: "last"`، يستخدم التسليم آخر قناة خارجية لتلك الجلسة.
    - تسمح تسليمات Heartbeat بالأهداف المباشرة/رسائل DM افتراضيًا. اضبط `directPolicy: "block"` لكبت الإرسال إلى الأهداف المباشرة مع الاستمرار في تشغيل دورة Heartbeat.
    - إذا كان الطابور الرئيسي، أو مسار جلسة الهدف، أو مسار cron، أو مهمة cron نشطة مشغولًا، يتم تخطي Heartbeat وإعادة المحاولة لاحقًا.
    - إذا كانت `skipWhenBusy: true`، تؤجل مسارات الوكلاء الفرعيين والمسارات المتداخلة أيضًا تشغيلات Heartbeat.
    - إذا لم يُحل `target` إلى وجهة خارجية، يظل التشغيل يحدث، لكن لا تُرسل أي رسالة صادرة.

  </Accordion>
  <Accordion title="الرؤية وسلوك التخطي">
    - إذا كانت `showOk` و`showAlerts` و`useIndicator` كلها معطلة، يتم تخطي التشغيل من البداية باعتباره `reason=alerts-disabled`.
    - إذا كان تسليم التنبيهات وحده معطلًا، لا يزال بإمكان OpenClaw تشغيل Heartbeat، وتحديث الطوابع الزمنية للمهام المستحقة، واستعادة طابع خمول الجلسة الزمني، وكبت حمولة التنبيه الخارجية.
    - إذا كان هدف Heartbeat المحلول يدعم الكتابة، يعرض OpenClaw مؤشر الكتابة أثناء نشاط تشغيل Heartbeat. يستخدم هذا الهدف نفسه الذي كان Heartbeat سيرسل إليه مخرجات الدردشة، ويتم تعطيله بواسطة `typingMode: "never"`.

  </Accordion>
  <Accordion title="دورة حياة الجلسة والتدقيق">
    - لا تُبقي الردود الخاصة بـ Heartbeat فقط الجلسة حية. قد تحدّث بيانات Heartbeat الوصفية صف الجلسة، لكن انتهاء الخمول يستخدم `lastInteractionAt` من آخر رسالة مستخدم/قناة حقيقية، ويستخدم الانتهاء اليومي `sessionStartedAt`.
    - تخفي واجهة التحكم وسجل WebChat مطالبات Heartbeat وإقرارات OK فقط. لا يزال بإمكان نص الجلسة الأساسي احتواء تلك الدورات لأغراض التدقيق/إعادة التشغيل.
    - يمكن لـ [المهام الخلفية](/ar/automation/tasks) المنفصلة إدراج حدث نظام في الطابور وإيقاظ Heartbeat عندما ينبغي للجلسة الرئيسية ملاحظة شيء بسرعة. لا يجعل هذا الإيقاظ تشغيل Heartbeat مهمة خلفية.

  </Accordion>
</AccordionGroup>

## عناصر التحكم في الرؤية

افتراضيًا، يتم كبت إقرارات `HEARTBEAT_OK` بينما يتم تسليم محتوى التنبيه. يمكنك ضبط ذلك لكل قناة أو لكل حساب:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

الأسبقية: لكل حساب → لكل قناة → افتراضيات القناة → الافتراضيات المضمنة.

### ما يفعله كل علم

- `showOk`: يرسل إقرار `HEARTBEAT_OK` عندما يعيد النموذج ردًا يحتوي على OK فقط.
- `showAlerts`: يرسل محتوى التنبيه عندما يعيد النموذج ردًا غير OK.
- `useIndicator`: يصدر أحداث مؤشر لأسطح حالة واجهة المستخدم.

إذا كانت **الثلاثة كلها** false، يتخطى OpenClaw تشغيل Heartbeat بالكامل (من دون استدعاء النموذج).

### أمثلة لكل قناة مقابل لكل حساب

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### أنماط شائعة

| الهدف                                     | الإعداد                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| السلوك الافتراضي (OKs صامتة، والتنبيهات مفعلة) | _(لا حاجة إلى إعداد)_                                                                     |
| صامت بالكامل (لا رسائل، ولا مؤشر) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| مؤشر فقط (لا رسائل)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs في قناة واحدة فقط                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختياري)

إذا كان ملف `HEARTBEAT.md` موجودًا في مساحة العمل، تطلب المطالبة الافتراضية من الوكيل قراءته. فكّر فيه باعتباره "قائمة تحقق Heartbeat" الخاصة بك: صغيرة، ومستقرة، وآمنة للإدراج كل 30 دقيقة.

في التشغيلات العادية، لا يتم حقن `HEARTBEAT.md` إلا عندما تكون إرشادات Heartbeat مفعلة للوكيل الافتراضي. يؤدي تعطيل إيقاع Heartbeat باستخدام `0m` أو ضبط `includeSystemPromptSection: false` إلى حذفه من سياق التمهيد العادي.

إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (يحتوي فقط على أسطر فارغة وعناوين markdown مثل `# Heading`)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API. يتم الإبلاغ عن ذلك التخطي باعتباره `reason=empty-heartbeat-file`. إذا كان الملف مفقودًا، يظل Heartbeat يعمل ويقرر النموذج ما يجب فعله.

أبقِه صغيرًا جدًا (قائمة تحقق قصيرة أو تذكيرات) لتجنب تضخم المطالبة.

مثال `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### كتل `tasks:`

يدعم `HEARTBEAT.md` أيضًا كتلة `tasks:` منظمة صغيرة للفحوصات المستندة إلى الفواصل الزمنية داخل Heartbeat نفسه.

مثال:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="السلوك">
    - يحلل OpenClaw كتلة `tasks:` ويفحص كل مهمة مقابل `interval` الخاص بها.
    - لا تُدرج في مطالبة Heartbeat لتلك النبضة إلا المهام **المستحقة**.
    - إذا لم تكن هناك مهام مستحقة، يتم تخطي Heartbeat بالكامل (`reason=no-tasks-due`) لتجنب استدعاء نموذج مهدور.
    - يتم الحفاظ على المحتوى غير المتعلق بالمهام في `HEARTBEAT.md` وإلحاقه كسياق إضافي بعد قائمة المهام المستحقة.
    - تُخزن طوابع آخر تشغيل للمهام الزمنية في حالة الجلسة (`heartbeatTaskState`)، لذلك تبقى الفواصل الزمنية بعد عمليات إعادة التشغيل العادية.
    - لا تُقدّم طوابع المهام الزمنية إلا بعد أن يكمل تشغيل Heartbeat مسار الرد العادي. لا تُعلّم تشغيلات `empty-heartbeat-file` / `no-tasks-due` المتخطاة المهام كمكتملة.

  </Accordion>
</AccordionGroup>

يكون وضع المهام مفيدًا عندما تريد أن يحتوي ملف Heartbeat واحد على عدة فحوصات دورية من دون الدفع مقابلها كلها في كل نبضة.

### هل يمكن للوكيل تحديث HEARTBEAT.md؟

نعم — إذا طلبت منه ذلك.

`HEARTBEAT.md` هو مجرد ملف عادي في مساحة عمل الوكيل، لذلك يمكنك إخبار الوكيل (في دردشة عادية) بشيء مثل:

- "حدّث `HEARTBEAT.md` لإضافة فحص تقويم يومي."
- "أعد كتابة `HEARTBEAT.md` ليكون أقصر ومركزًا على متابعات صندوق الوارد."

إذا أردت أن يحدث هذا استباقيًا، يمكنك أيضًا تضمين سطر صريح في مطالبة Heartbeat مثل: "إذا أصبحت قائمة التحقق قديمة، فحدّث HEARTBEAT.md بقائمة أفضل."

<Warning>
لا تضع الأسرار (مفاتيح API، أرقام الهواتف، الرموز الخاصة) في `HEARTBEAT.md` — فهو يصبح جزءًا من سياق المطالبة.
</Warning>

## إيقاظ يدوي (عند الطلب)

يمكنك إدراج حدث نظام في الطابور وتشغيل Heartbeat فوري باستخدام:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

إذا كان لدى عدة وكلاء إعداد `heartbeat`، فإن الإيقاظ اليدوي يشغّل كل Heartbeats الخاصة بتلك الوكلاء فورًا.

استخدم `--mode next-heartbeat` للانتظار حتى النبضة المجدولة التالية.

## تسليم الاستدلال (اختياري)

افتراضيًا، لا تسلم Heartbeats إلا حمولة "الإجابة" النهائية.

إذا أردت الشفافية، فعّل:

- `agents.defaults.heartbeat.includeReasoning: true`

عند التفعيل، ستسلم Heartbeats أيضًا رسالة منفصلة مسبوقة بـ `Reasoning:` (بالشكل نفسه مثل `/reasoning on`). يمكن أن يكون هذا مفيدًا عندما يدير الوكيل جلسات/بيئات codex متعددة وتريد معرفة سبب قراره تنبيهك — لكنه قد يكشف أيضًا تفاصيل داخلية أكثر مما تريد. يفضل إبقاؤه متوقفًا في دردشات المجموعات.

## الوعي بالتكلفة

تشغّل Heartbeats دورات وكيل كاملة. تحرق الفواصل الأقصر مزيدًا من الرموز. لتقليل التكلفة:

- استخدم `isolatedSession: true` لتجنب إرسال سجل المحادثة الكامل (من نحو 100 ألف رمز إلى نحو 2-5 آلاف لكل تشغيل).
- استخدم `lightContext: true` لقصر ملفات التمهيد على `HEARTBEAT.md` فقط.
- اضبط `model` أرخص (مثل `ollama/llama3.2:1b`).
- أبقِ `HEARTBEAT.md` صغيرًا.
- استخدم `target: "none"` إذا كنت تريد تحديثات الحالة الداخلية فقط.

## فيضان السياق بعد Heartbeat

إذا ترك Heartbeat سابقًا جلسة موجودة على نموذج محلي أصغر، مثل نموذج Ollama بنافذة 32k، وأبلغت دورة الجلسة الرئيسية التالية عن فيضان في السياق، فأعد ضبط نموذج تشغيل الجلسة إلى النموذج الأساسي المكوّن. تشير رسالة إعادة الضبط في OpenClaw إلى ذلك عندما يطابق آخر نموذج تشغيل `heartbeat.model` المكوّن.

تحافظ Heartbeats الحالية على نموذج تشغيل الجلسة المشتركة الحالي بعد اكتمال التشغيل. لا يزال بإمكانك استخدام `isolatedSession: true` لتشغيل Heartbeats في جلسة جديدة، ودمجه مع `lightContext: true` لأصغر مطالبة، أو اختيار نموذج Heartbeat بنافذة سياق كبيرة بما يكفي للجلسة المشتركة.

## ذات صلة

- [الأتمتة والمهام](/ar/automation) — كل آليات الأتمتة بنظرة عامة
- [المهام الخلفية](/ar/automation/tasks) — كيفية تتبع العمل المنفصل
- [المنطقة الزمنية](/ar/concepts/timezone) — كيف تؤثر المنطقة الزمنية في جدولة Heartbeat
- [استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting) — تصحيح مشكلات الأتمتة
