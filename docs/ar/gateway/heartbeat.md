---
read_when:
    - تعديل وتيرة Heartbeat أو الرسائل
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Heartbeat
summary: رسائل استقصاء Heartbeat وقواعد الإشعارات
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat أم cron؟** راجع [الأتمتة](/ar/automation) للحصول على إرشادات حول وقت استخدام كل منهما.
</Note>

يشغّل Heartbeat **دورات وكيل دورية** في الجلسة الرئيسية حتى يتمكن النموذج من إظهار أي شيء يحتاج إلى انتباهك من دون إزعاجك بالرسائل.

Heartbeat هو دورة مجدولة في الجلسة الرئيسية — ولا ينشئ سجلات [مهمة خلفية](/ar/automation/tasks). سجلات المهام مخصصة للعمل المنفصل (تشغيلات ACP والوكلاء الفرعيين ومهام cron المعزولة).

استكشاف الأخطاء وإصلاحها: [المهام المجدولة](/ar/automation/cron-jobs#troubleshooting)

## البدء السريع (للمبتدئين)

<Steps>
  <Step title="اختر وتيرة">
    اترك Heartbeat مفعّلا (الإعداد الافتراضي هو `30m`، أو `1h` لمصادقة Anthropic OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI) أو عيّن وتيرتك الخاصة.
  </Step>
  <Step title="أضف HEARTBEAT.md (اختياري)">
    أنشئ قائمة تحقق صغيرة في `HEARTBEAT.md` أو كتلة `tasks:` في مساحة عمل الوكيل.
  </Step>
  <Step title="حدد أين يجب أن تذهب رسائل Heartbeat">
    `target: "none"` هو الإعداد الافتراضي؛ عيّن `target: "last"` للتوجيه إلى آخر جهة اتصال.
  </Step>
  <Step title="ضبط اختياري">
    - فعّل تسليم استدلال Heartbeat للشفافية.
    - استخدم سياق تمهيد خفيفا إذا كانت تشغيلات Heartbeat لا تحتاج إلا إلى `HEARTBEAT.md`.
    - فعّل الجلسات المعزولة لتجنب إرسال سجل المحادثة الكامل مع كل Heartbeat.
    - قيّد Heartbeats بساعات النشاط (بالتوقيت المحلي).

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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## الإعدادات الافتراضية

- الفاصل الزمني: `30m` (أو `1h` عندما يكون وضع المصادقة المكتشف هو مصادقة Anthropic OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI). عيّن `agents.defaults.heartbeat.every` أو `agents.list[].heartbeat.every` لكل وكيل؛ استخدم `0m` للتعطيل.
- نص الموجه (قابل للضبط عبر `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- يُرسل موجه Heartbeat **حرفيا** كرسالة المستخدم. يتضمن موجه النظام قسم "Heartbeat" فقط عندما تكون Heartbeats مفعّلة للوكيل الافتراضي، وتُعلّم التشغيلة داخليا.
- عند تعطيل Heartbeats باستخدام `0m`، تحذف التشغيلات العادية أيضا `HEARTBEAT.md` من سياق التمهيد حتى لا يرى النموذج تعليمات مخصصة لـ Heartbeat فقط.
- تُفحص ساعات النشاط (`heartbeat.activeHours`) في المنطقة الزمنية المضبوطة. خارج النافذة، تُتخطى Heartbeats حتى النبضة التالية داخل النافذة.
- تؤجل Heartbeats تلقائيا أثناء كون عمل cron نشطا أو في قائمة الانتظار. عيّن `heartbeat.skipWhenBusy: true` لتأجيل وكيل أيضا عند انشغال الوكلاء الفرعيين ذوي مفتاح الجلسة الخاصة به أو مسارات الأوامر المتداخلة؛ لم تعد الوكلاء الأشقاء تتوقف لمجرد أن وكيلا آخر لديه عمل وكيل فرعي قيد التنفيذ.

## ما الغرض من موجه Heartbeat

الموجه الافتراضي واسع عمدا:

- **المهام الخلفية**: "Consider outstanding tasks" يدفع الوكيل إلى مراجعة المتابعات (البريد الوارد والتقويم والتذكيرات والعمل في قائمة الانتظار) وإظهار أي شيء عاجل.
- **تفقّد الإنسان**: "Checkup sometimes on your human during day time" يدفع إلى رسالة خفيفة أحيانا مثل "هل تحتاج إلى شيء؟"، لكنه يتجنب رسائل الإزعاج ليلا باستخدام منطقتك الزمنية المحلية المضبوطة (راجع [المنطقة الزمنية](/ar/concepts/timezone)).

يمكن لـ Heartbeat التفاعل مع [المهام الخلفية](/ar/automation/tasks) المكتملة، لكن تشغيل Heartbeat نفسه لا ينشئ سجل مهمة.

إذا كنت تريد من Heartbeat فعل شيء محدد جدا (مثل "التحقق من إحصاءات Gmail PubSub" أو "التحقق من صحة Gateway")، فعيّن `agents.defaults.heartbeat.prompt` (أو `agents.list[].heartbeat.prompt`) إلى نص مخصص (يُرسل حرفيا).

## عقد الاستجابة

- إذا لم يكن هناك ما يحتاج إلى انتباه، فأجب بـ **`HEARTBEAT_OK`**.
- قد تستدعي تشغيلات Heartbeat القادرة على استخدام الأدوات بدلا من ذلك `heartbeat_respond` مع `notify: false` لعدم عرض تحديث مرئي، أو `notify: true` مع `notificationText` لتنبيه. عند وجوده، تكون لاستجابة الأداة المنظمة أولوية على النص الاحتياطي.
- أثناء تشغيلات Heartbeat، يعامل OpenClaw الرمز `HEARTBEAT_OK` كتأكيد عندما يظهر في **بداية أو نهاية** الرد. يُزال الرمز ويُسقط الرد إذا كان المحتوى المتبقي **≤ `ackMaxChars`** (الافتراضي: 300).
- إذا ظهر `HEARTBEAT_OK` في **وسط** رد، فلا يُعامل معاملة خاصة.
- للتنبيهات، **لا** تضمّن `HEARTBEAT_OK`؛ أعد نص التنبيه فقط.

خارج Heartbeats، يُزال أي `HEARTBEAT_OK` عارض في بداية/نهاية رسالة ويُسجل؛ وتُسقط الرسالة التي تكون فقط `HEARTBEAT_OK`.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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
- يدمج `agents.list[].heartbeat` فوقه؛ إذا كان لدى أي وكيل كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغّلون Heartbeat.
- يضبط `channels.defaults.heartbeat` إعدادات الظهور الافتراضية لكل القنوات.
- يتجاوز `channels.<channel>.heartbeat` إعدادات القناة الافتراضية.
- يتجاوز `channels.<channel>.accounts.<id>.heartbeat` (قنوات متعددة الحسابات) إعدادات كل قناة.

### Heartbeat لكل وكيل

إذا تضمّن أي إدخال `agents.list[]` كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغّلون Heartbeat. تدمج كتلة كل وكيل فوق `agents.defaults.heartbeat` (لذلك يمكنك تعيين الإعدادات الافتراضية المشتركة مرة واحدة وتجاوزها لكل وكيل).

مثال: وكيلان، الوكيل الثاني فقط يشغّل Heartbeat.

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

قيّد Heartbeat بساعات العمل في منطقة زمنية محددة:

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

خارج هذه النافذة (قبل 9 صباحًا أو بعد 10 مساءً بالتوقيت الشرقي)، يتم تخطي Heartbeat. سيعمل النبض المجدول التالي داخل النافذة بشكل طبيعي.

### إعداد 24/7

إذا كنت تريد تشغيل Heartbeat طوال اليوم، فاستخدم أحد هذه الأنماط:

- احذف `activeHours` بالكامل (من دون تقييد بنافذة زمنية؛ هذا هو السلوك الافتراضي).
- عيّن نافذة ليوم كامل: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
لا تعيّن وقت `start` و`end` نفسه (على سبيل المثال من `08:00` إلى `08:00`). يُعامَل ذلك كنافذة بعرض صفري، لذلك يتم دائمًا تخطي Heartbeat.
</Warning>

### مثال لحسابات متعددة

استخدم `accountId` لاستهداف حساب محدد في قنوات متعددة الحسابات مثل Telegram:

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
  فاصل Heartbeat (سلسلة مدة؛ الوحدة الافتراضية = دقائق).
</ParamField>
<ParamField path="model" type="string">
  تجاوز اختياري للنموذج لتشغيلات Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  عند التمكين، يتم أيضًا تسليم رسالة `Reasoning:` المنفصلة عند توفرها (بالبنية نفسها مثل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  عند الضبط على true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا وتحتفظ فقط بملف `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  عند الضبط على true، يعمل كل Heartbeat في جلسة جديدة من دون سجل محادثات سابق. يستخدم نمط العزل نفسه مثل Cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat بدرجة كبيرة. ادمجه مع `lightContext: true` لتحقيق أقصى توفير. لا يزال توجيه التسليم يستخدم سياق الجلسة الرئيسية.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  عند الضبط على true، تؤجل تشغيلات Heartbeat على المسارات الإضافية المشغولة لذلك الوكيل: وكيلها الفرعي المرتبط بمفتاح الجلسة أو عمل الأوامر المتداخلة. تؤجل مسارات Cron دائمًا Heartbeat، حتى من دون هذه العلامة، بحيث لا تشغّل مضيفات النماذج المحلية مطالبات Cron وHeartbeat في الوقت نفسه.
</ParamField>
<ParamField path="session" type="string">
  مفتاح جلسة اختياري لتشغيلات Heartbeat.

- `main` (افتراضي): الجلسة الرئيسية للوكيل.
- مفتاح جلسة صريح (انسخه من `openclaw sessions --json` أو من [CLI الجلسات](/ar/cli/sessions)).
- تنسيقات مفاتيح الجلسات: راجع [الجلسات](/ar/concepts/session) و[المجموعات](/ar/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: التسليم إلى آخر قناة خارجية مستخدمة.
- قناة صريحة: أي قناة مكوّنة أو معرّف plugin، على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`.
- `none` (افتراضي): تشغيل Heartbeat ولكن **عدم التسليم** خارجيًا.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  يتحكم في سلوك التسليم المباشر/عبر الرسائل الخاصة. `allow`: السماح بتسليم Heartbeat المباشر/عبر الرسائل الخاصة. `block`: منع تسليم Heartbeat المباشر/عبر الرسائل الخاصة (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  تجاوز اختياري للمستلم (معرّف خاص بالقناة، مثل E.164 لـ WhatsApp أو معرّف دردشة Telegram). لمواضيع/سلاسل Telegram، استخدم `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  معرّف حساب اختياري للقنوات متعددة الحسابات. عند استخدام `target: "last"`، يُطبَّق معرّف الحساب على آخر قناة تم حلها إذا كانت تدعم الحسابات؛ وإلا فيتم تجاهله. إذا لم يطابق معرّف الحساب حسابًا مكوّنًا للقناة التي تم حلها، يتم تخطي التسليم.

</ParamField>
<ParamField path="prompt" type="string">
  يتجاوز نص الموجه الافتراضي (دون دمج).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  الحد الأقصى للأحرف المسموح بها بعد `HEARTBEAT_OK` قبل التسليم.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  عند ضبطه على true، يكتم حمولات تحذير أخطاء الأدوات أثناء تشغيل Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  يقصر تشغيل Heartbeat على نافذة زمنية. كائن يحتوي على `start` (HH:MM، شامل؛ استخدم `00:00` لبداية اليوم)، و`end` (HH:MM غير شامل؛ يُسمح بـ `24:00` لنهاية اليوم)، و`timezone` اختياري.

- إذا حُذف أو كان `"user"`: يستخدم `agents.defaults.userTimezone` لديك إذا كان مضبوطًا، وإلا يرجع إلى المنطقة الزمنية لنظام المضيف.
- `"local"`: يستخدم دائمًا المنطقة الزمنية لنظام المضيف.
- أي معرّف IANA (مثل `America/New_York`): يُستخدم مباشرة؛ وإذا كان غير صالح، يرجع إلى سلوك `"user"` أعلاه.
- يجب ألا تكون قيمتا `start` و`end` متساويتين لنافذة نشطة؛ تُعامل القيم المتساوية كنافذة بلا عرض (دائمًا خارج النافذة).
- خارج النافذة النشطة، تُتخطى عمليات Heartbeat حتى النبضة التالية داخل النافذة.

</ParamField>

## سلوك التسليم

<AccordionGroup>
  <Accordion title="توجيه الجلسة والهدف">
    - تعمل Heartbeats في جلسة الوكيل الرئيسية افتراضيًا (`agent:<id>:<mainKey>`)، أو `global` عندما تكون `session.scope = "global"`. اضبط `session` لتجاوز ذلك إلى جلسة قناة محددة (Discord/WhatsApp/إلخ).
    - يؤثر `session` فقط في سياق التشغيل؛ يتحكم `target` و`to` في التسليم.
    - للتسليم إلى قناة/مستلم محدد، اضبط `target` + `to`. مع `target: "last"`، يستخدم التسليم آخر قناة خارجية لتلك الجلسة.
    - تسمح عمليات تسليم Heartbeat بالأهداف المباشرة/DM افتراضيًا. اضبط `directPolicy: "block"` لكتم الإرسال إلى الأهداف المباشرة مع الاستمرار في تشغيل دورة Heartbeat.
    - إذا كان الطابور الرئيسي، أو مسار جلسة الهدف، أو مسار Cron، أو مهمة Cron نشطة مشغولًا، تُتخطى Heartbeat ويُعاد المحاولة لاحقًا.
    - إذا كان `skipWhenBusy: true`، فإن الوكيل الفرعي المرتبط بمفتاح جلسة هذا الوكيل والمسارات المتداخلة تؤجل أيضًا تشغيل Heartbeat. لا تؤجل المسارات المشغولة لوكلاء آخرين هذا الوكيل.
    - إذا حُلّ `target` إلى عدم وجود وجهة خارجية، يظل التشغيل يحدث لكن لا تُرسل أي رسالة صادرة.

  </Accordion>
  <Accordion title="الرؤية وسلوك التخطي">
    - إذا كانت `showOk` و`showAlerts` و`useIndicator` كلها معطلة، يُتخطى التشغيل مسبقًا مع `reason=alerts-disabled`.
    - إذا كان تسليم التنبيهات فقط معطلًا، يمكن لـ OpenClaw مع ذلك تشغيل Heartbeat، وتحديث الطوابع الزمنية للمهام المستحقة، واستعادة طابع خمول الجلسة الزمني، وكتم حمولة التنبيه الخارجية.
    - إذا كان هدف Heartbeat المحلول يدعم الكتابة، يعرض OpenClaw مؤشر الكتابة أثناء نشاط تشغيل Heartbeat. يستخدم هذا الهدف نفسه الذي كانت Heartbeat سترسل إليه مخرجات الدردشة، ويُعطَّل بواسطة `typingMode: "never"`.

  </Accordion>
  <Accordion title="دورة حياة الجلسة والتدقيق">
    - لا تُبقي الردود الخاصة بـ Heartbeat فقط الجلسة حية. قد تحدّث بيانات Heartbeat الوصفية صف الجلسة، لكن انتهاء الصلاحية بسبب الخمول يستخدم `lastInteractionAt` من آخر رسالة حقيقية للمستخدم/القناة، ويستخدم انتهاء الصلاحية اليومي `sessionStartedAt`.
    - تُخفي واجهة التحكم وسجل WebChat موجهات Heartbeat وإقرارات OK فقط. لا يزال بإمكان نص الجلسة الأساسي احتواء تلك الدورات للتدقيق/إعادة التشغيل.
    - يمكن لـ [المهام الخلفية](/ar/automation/tasks) المنفصلة إدراج حدث نظام في الطابور وإيقاظ Heartbeat عندما ينبغي للجلسة الرئيسية ملاحظة شيء بسرعة. لا يجعل ذلك الإيقاظ تشغيل Heartbeat مهمة خلفية.

  </Accordion>
</AccordionGroup>

## عناصر التحكم في الرؤية

افتراضيًا، تُكتم إقرارات `HEARTBEAT_OK` بينما يُسلَّم محتوى التنبيه. يمكنك تعديل هذا لكل قناة أو لكل حساب:

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

الأسبقية: لكل حساب → لكل قناة → افتراضيات القناة → الافتراضيات المدمجة.

### ما يفعله كل علم

- `showOk`: يرسل إقرار `HEARTBEAT_OK` عندما يعيد النموذج رد OK فقط.
- `showAlerts`: يرسل محتوى التنبيه عندما يعيد النموذج ردًا غير OK.
- `useIndicator`: يصدر أحداث مؤشر لأسطح حالة واجهة المستخدم.

إذا كانت **الثلاثة كلها** false، يتخطى OpenClaw تشغيل Heartbeat بالكامل (دون استدعاء للنموذج).

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

| الهدف                                    | الإعدادات                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| السلوك الافتراضي (OK صامت، التنبيهات مفعلة) | _(لا حاجة إلى إعداد)_                                                                     |
| صامت بالكامل (لا رسائل، لا مؤشر)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| مؤشر فقط (لا رسائل)                      | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK في قناة واحدة فقط                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختياري)

إذا كان ملف `HEARTBEAT.md` موجودًا في مساحة العمل، فإن الموجه الافتراضي يخبر الوكيل بقراءته. فكّر فيه على أنه "قائمة تحقق Heartbeat" الخاصة بك: صغيرة، وثابتة، وآمنة للتضمين كل 30 دقيقة.

في عمليات التشغيل العادية، لا يُحقن `HEARTBEAT.md` إلا عندما تكون إرشادات Heartbeat مفعلة للوكيل الافتراضي. يؤدي تعطيل إيقاع Heartbeat باستخدام `0m` أو ضبط `includeSystemPromptSection: false` إلى حذفه من سياق التمهيد العادي.

إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (فقط أسطر فارغة وعناوين Markdown مثل `# Heading`)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API. يُبلَّغ عن ذلك التخطي كـ `reason=empty-heartbeat-file`. إذا كان الملف مفقودًا، تظل Heartbeat تعمل ويقرر النموذج ما يجب فعله.

أبقِه صغيرًا جدًا (قائمة تحقق قصيرة أو تذكيرات) لتجنب تضخم الموجه.

مثال `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### كتل `tasks:`

يدعم `HEARTBEAT.md` أيضًا كتلة `tasks:` منظمة صغيرة للفحوصات القائمة على الفواصل الزمنية داخل Heartbeat نفسها.

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
    - لا تُضمّن في موجه Heartbeat لتلك النبضة إلا المهام **المستحقة**.
    - إذا لم تكن أي مهام مستحقة، تُتخطى Heartbeat بالكامل (`reason=no-tasks-due`) لتجنب استدعاء نموذج مهدور.
    - يُحفظ المحتوى غير المتعلق بالمهام في `HEARTBEAT.md` ويُلحق كسياق إضافي بعد قائمة المهام المستحقة.
    - تُخزن الطوابع الزمنية لآخر تشغيل للمهمة في حالة الجلسة (`heartbeatTaskState`)، لذلك تبقى الفواصل الزمنية بعد عمليات إعادة التشغيل العادية.
    - لا تُقدّم طوابع المهام الزمنية إلا بعد اكتمال تشغيل Heartbeat عبر مسار الرد العادي. لا تُعلّم عمليات `empty-heartbeat-file` / `no-tasks-due` المتخطاة المهام كمكتملة.

  </Accordion>
</AccordionGroup>

وضع المهام مفيد عندما تريد أن يحتوي ملف Heartbeat واحد على عدة فحوصات دورية دون الدفع مقابلها كلها في كل نبضة.

### هل يستطيع الوكيل تحديث HEARTBEAT.md؟

نعم — إذا طلبت منه ذلك.

`HEARTBEAT.md` مجرد ملف عادي في مساحة عمل الوكيل، لذا يمكنك أن تطلب من الوكيل (في دردشة عادية) شيئًا مثل:

- "حدّث `HEARTBEAT.md` لإضافة فحص يومي للتقويم."
- "أعد كتابة `HEARTBEAT.md` ليكون أقصر ويركز على متابعات البريد الوارد."

إذا أردت أن يحدث هذا استباقيًا، يمكنك أيضًا تضمين سطر صريح في موجه Heartbeat مثل: "إذا أصبحت قائمة التحقق قديمة، حدّث HEARTBEAT.md بقائمة أفضل."

<Warning>
لا تضع أسرارًا (مفاتيح API، أرقام هواتف، رموزًا خاصة) في `HEARTBEAT.md` — إذ يصبح جزءًا من سياق الموجه.
</Warning>

## إيقاظ يدوي (عند الطلب)

يمكنك إدراج حدث نظام في الطابور وتشغيل Heartbeat فورية باستخدام:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

إذا كان لدى عدة وكلاء إعداد `heartbeat`، فإن الإيقاظ اليدوي يشغل كل Heartbeats الخاصة بهؤلاء الوكلاء فورًا.

استخدم `--mode next-heartbeat` للانتظار حتى النبضة المجدولة التالية.

## تسليم الاستدلال (اختياري)

افتراضيًا، لا تسلم Heartbeats إلا حمولة "الإجابة" النهائية.

إذا أردت الشفافية، فعّل:

- `agents.defaults.heartbeat.includeReasoning: true`

عند التفعيل، ستسلم Heartbeats أيضًا رسالة منفصلة مسبوقة بـ `Reasoning:` (بالشكل نفسه مثل `/reasoning on`). قد يكون هذا مفيدًا عندما يدير الوكيل عدة جلسات/codexes وتريد أن ترى لماذا قرر مراسلتك — لكنه قد يسرّب أيضًا تفاصيل داخلية أكثر مما تريد. يُفضّل إبقاؤه معطلًا في دردشات المجموعات.

## الوعي بالتكلفة

تشغل Heartbeats دورات وكيل كاملة. الفواصل الزمنية الأقصر تستهلك مزيدًا من الرموز. لتقليل التكلفة:

- استخدم `isolatedSession: true` لتجنب إرسال سجل المحادثة الكامل (من نحو ~100K رمز إلى نحو ~2-5K لكل تشغيل).
- استخدم `lightContext: true` لقصر ملفات التمهيد على `HEARTBEAT.md` فقط.
- اضبط `model` أرخص (مثل `ollama/llama3.2:1b`).
- أبقِ `HEARTBEAT.md` صغيرًا.
- استخدم `target: "none"` إذا كنت تريد تحديثات الحالة الداخلية فقط.

## فيض السياق بعد Heartbeat

إذا تركت Heartbeat سابقًا جلسة موجودة على نموذج محلي أصغر، مثل نموذج Ollama بنافذة 32k، وأبلغت دورة الجلسة الرئيسية التالية عن فيض في السياق، فأعد ضبط نموذج وقت تشغيل الجلسة إلى النموذج الأساسي المكوّن. تشير رسالة إعادة الضبط في OpenClaw إلى ذلك عندما يطابق آخر نموذج وقت تشغيل `heartbeat.model` المكوّن.

تحافظ Heartbeats الحالية على نموذج وقت التشغيل الموجود للجلسة المشتركة بعد اكتمال التشغيل. لا يزال بإمكانك استخدام `isolatedSession: true` لتشغيل Heartbeats في جلسة جديدة، ودمجه مع `lightContext: true` للحصول على أصغر موجه، أو اختيار نموذج Heartbeat بنافذة سياق كبيرة بما يكفي للجلسة المشتركة.

## ذو صلة

- [الأتمتة](/ar/automation) — جميع آليات الأتمتة بلمحة واحدة
- [المهام الخلفية](/ar/automation/tasks) — كيف يُتتبع العمل المنفصل
- [المنطقة الزمنية](/ar/concepts/timezone) — كيف تؤثر المنطقة الزمنية في جدولة Heartbeat
- [استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting) — تصحيح مشكلات الأتمتة
