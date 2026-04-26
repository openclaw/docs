---
read_when:
    - ضبط وتيرة Heartbeat أو رسائلها
    - تحديد الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Heartbeat
summary: رسائل استطلاع Heartbeat وقواعد الإشعارات
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:29:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat أم Cron؟** راجع [Automation & Tasks](/ar/automation) للحصول على إرشادات حول وقت استخدام كل منهما.
</Note>

تشغّل Heartbeat **أدوار وكيل دورية** في الجلسة الرئيسية حتى يتمكن النموذج من إظهار أي شيء يحتاج إلى انتباه من دون إغراقك بالرسائل.

Heartbeat هي دور مجدول في الجلسة الرئيسية — وهي **لا** تنشئ سجلات [مهام في الخلفية](/ar/automation/tasks). فسجلات المهام مخصصة للعمل المنفصل (عمليات ACP، والوكلاء الفرعيون، ووظائف Cron المعزولة).

استكشاف الأخطاء وإصلاحها: [Scheduled Tasks](/ar/automation/cron-jobs#troubleshooting)

## البدء السريع (للمبتدئين)

<Steps>
  <Step title="اختر الوتيرة">
    اترك Heartbeats مفعلة (القيمة الافتراضية هي `30m`، أو `1h` لمصادقة Anthropic عبر OAuth/token، بما في ذلك إعادة استخدام Claude CLI) أو اضبط وتيرتك الخاصة.
  </Step>
  <Step title="أضف HEARTBEAT.md (اختياري)">
    أنشئ قائمة تحقق صغيرة في `HEARTBEAT.md` أو كتلة `tasks:` في مساحة عمل الوكيل.
  </Step>
  <Step title="قرر إلى أين يجب أن تذهب رسائل Heartbeat">
    القيمة الافتراضية لـ `target: "none"`؛ اضبط `target: "last"` للتوجيه إلى آخر جهة اتصال.
  </Step>
  <Step title="ضبط اختياري">
    - فعّل تسليم reasoning الخاصة بـ Heartbeat من أجل الشفافية.
    - استخدم سياق تهيئة أولية خفيفًا إذا كانت تشغيلات Heartbeat تحتاج فقط إلى `HEARTBEAT.md`.
    - فعّل الجلسات المعزولة لتجنب إرسال سجل المحادثة الكامل مع كل Heartbeat.
    - قيّد Heartbeats بالساعات النشطة (بالتوقيت المحلي).
  </Step>
</Steps>

مثال على التهيئة:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // تسليم صريح إلى آخر جهة اتصال (الافتراضي هو "none")
        directPolicy: "allow", // الافتراضي: السماح بالأهداف المباشرة/DM؛ اضبط "block" للكبت
        lightContext: true, // اختياري: حقن HEARTBEAT.md فقط من ملفات التهيئة الأولية
        isolatedSession: true, // اختياري: جلسة جديدة مع كل تشغيل (بلا سجل محادثة)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // اختياري: إرسال رسالة `Reasoning:` منفصلة أيضًا
      },
    },
  },
}
```

## القيم الافتراضية

- الفاصل الزمني: `30m` (أو `1h` عندما تكون مصادقة Anthropic عبر OAuth/token هي وضع المصادقة المكتشف، بما في ذلك إعادة استخدام Claude CLI). اضبط `agents.defaults.heartbeat.every` أو `agents.list[].heartbeat.every` لكل وكيل؛ واستخدم `0m` للتعطيل.
- متن المطالبة (قابل للتهيئة عبر `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- تُرسل مطالبة Heartbeat **كما هي حرفيًا** كرسالة مستخدم. ولا يتضمن system prompt قسم "Heartbeat" إلا عندما تكون Heartbeats مفعلة للوكيل الافتراضي، وتكون عملية التشغيل موسومة داخليًا.
- عند تعطيل Heartbeats باستخدام `0m`، تحذف التشغيلات العادية أيضًا `HEARTBEAT.md` من سياق التهيئة الأولية حتى لا يرى النموذج تعليمات خاصة بـ Heartbeat فقط.
- يتم التحقق من الساعات النشطة (`heartbeat.activeHours`) في المنطقة الزمنية المضبوطة. وخارج النافذة الزمنية، يتم تخطي Heartbeats حتى النبضة التالية داخل النافذة.

## ما الغرض من مطالبة Heartbeat

المطالبة الافتراضية عامة عمدًا:

- **المهام الخلفية**: عبارة "Consider outstanding tasks" تدفع الوكيل إلى مراجعة المتابعات (البريد الوارد، والتقويم، والتذكيرات، والعمل في قائمة الانتظار) وإظهار أي شيء عاجل.
- **الاطمئنان على الإنسان**: عبارة "Checkup sometimes on your human during day time" تدفع نحو رسالة خفيفة عرضية من نوع "هل تحتاج إلى شيء؟"، لكنها تتجنب الإزعاج الليلي باستخدام منطقتك الزمنية المحلية المضبوطة (راجع [Timezone](/ar/concepts/timezone)).

يمكن لـ Heartbeat التفاعل مع [المهام الخلفية](/ar/automation/tasks) المكتملة، لكن تشغيل Heartbeat نفسه لا ينشئ سجل مهمة.

إذا أردت أن تنفذ Heartbeat شيئًا محددًا جدًا (مثل "تحقق من إحصاءات Gmail PubSub" أو "تحقق من سلامة gateway")، فاضبط `agents.defaults.heartbeat.prompt` (أو `agents.list[].heartbeat.prompt`) على متن مخصص (يُرسل حرفيًا كما هو).

## عقد الاستجابة

- إذا لم يكن هناك ما يحتاج إلى انتباه، فردّ باستخدام **`HEARTBEAT_OK`**.
- أثناء تشغيلات Heartbeat، يتعامل OpenClaw مع `HEARTBEAT_OK` على أنه إقرار عندما يظهر في **بداية الرد أو نهايته**. تتم إزالة الرمز ويُحذف الرد إذا كان المحتوى المتبقي **≤ `ackMaxChars`** (الافتراضي: 300).
- إذا ظهر `HEARTBEAT_OK` في **منتصف** الرد، فلا يُعامل معاملة خاصة.
- في التنبيهات، **لا** تضمّن `HEARTBEAT_OK`؛ وأعد فقط نص التنبيه.

خارج Heartbeats، تتم إزالة `HEARTBEAT_OK` الشاردة في بداية الرسالة/نهايتها ويُسجل ذلك؛ أما الرسالة التي تكون فقط `HEARTBEAT_OK` فتُحذف.

## التهيئة

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // الافتراضي: 30m (0m للتعطيل)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // الافتراضي: false (تسليم رسالة Reasoning: منفصلة عند توفرها)
        lightContext: false, // الافتراضي: false؛ true تبقي فقط HEARTBEAT.md من ملفات التهيئة الأولية لمساحة العمل
        isolatedSession: false, // الافتراضي: false؛ true تشغّل كل Heartbeat في جلسة جديدة (بلا سجل محادثة)
        target: "last", // الافتراضي: none | الخيارات: last | none | <channel id> (أساسي أو Plugin، مثل "bluebubbles")
        to: "+15551234567", // تجاوز اختياري خاص بالقناة
        accountId: "ops-bot", // معرّف قناة اختياري للحسابات المتعددة
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // الحد الأقصى للأحرف المسموح بها بعد HEARTBEAT_OK
      },
    },
  },
}
```

### النطاق والأولوية

- يضبط `agents.defaults.heartbeat` سلوك Heartbeat العام.
- يندمج `agents.list[].heartbeat` فوقه؛ وإذا كان لدى أي وكيل كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** هم من يشغّلون Heartbeats.
- يضبط `channels.defaults.heartbeat` القيم الافتراضية للظهور لجميع القنوات.
- يتجاوز `channels.<channel>.heartbeat` القيم الافتراضية للقناة.
- يتجاوز `channels.<channel>.accounts.<id>.heartbeat` (في القنوات متعددة الحسابات) إعدادات كل قناة.

### Heartbeats لكل وكيل

إذا تضمّن أي إدخال في `agents.list[]` كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** هم من يشغّلون Heartbeats. وتندمج الكتلة الخاصة بكل وكيل فوق `agents.defaults.heartbeat` (بحيث يمكنك تعيين القيم الافتراضية المشتركة مرة واحدة وتجاوزها لكل وكيل).

مثال: وكيلان، ولا يشغّل Heartbeats إلا الوكيل الثاني.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // تسليم صريح إلى آخر جهة اتصال (الافتراضي هو "none")
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

قيّد Heartbeats بساعات العمل في منطقة زمنية محددة:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // تسليم صريح إلى آخر جهة اتصال (الافتراضي هو "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // اختياري؛ يستخدم userTimezone لديك إذا كانت مضبوطة، وإلا فـ host tz
        },
      },
    },
  },
}
```

خارج هذه النافذة (قبل 9 صباحًا أو بعد 10 مساءً بالتوقيت الشرقي)، يتم تخطي Heartbeats. وستعمل النبضة المجدولة التالية داخل النافذة بشكل طبيعي.

### إعداد 24/7

إذا أردت أن تعمل Heartbeats طوال اليوم، فاستخدم أحد هذين النمطين:

- احذف `activeHours` بالكامل (بلا تقييد لنافذة زمنية؛ وهذا هو السلوك الافتراضي).
- اضبط نافذة يوم كامل: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
لا تضبط `start` و`end` على الوقت نفسه (مثل `08:00` إلى `08:00`). فهذا يُعامل على أنه نافذة بعرض صفري، لذا يتم دائمًا تخطي Heartbeats.
</Warning>

### مثال على الحسابات المتعددة

استخدم `accountId` لاستهداف حساب محدد في القنوات متعددة الحسابات مثل Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // اختياري: التوجيه إلى topic/thread محدد
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
  الفاصل الزمني لـ Heartbeat (سلسلة مدة؛ وحدة القياس الافتراضية = الدقائق).
</ParamField>
<ParamField path="model" type="string">
  تجاوز اختياري للنموذج لتشغيلات Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  عند التفعيل، يسلّم أيضًا رسالة `Reasoning:` منفصلة عند توفرها (بنفس شكل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  عندما تكون true، تستخدم تشغيلات Heartbeat سياق تهيئة أولية خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات التهيئة الأولية لمساحة العمل.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  عندما تكون true، يعمل كل Heartbeat في جلسة جديدة بلا سجل محادثة سابق. ويستخدم نمط العزل نفسه الذي تستخدمه Cron في `sessionTarget: "isolated"`. وهذا يقلل بدرجة كبيرة من تكلفة الرموز لكل Heartbeat. اجمعه مع `lightContext: true` لتحقيق أقصى توفير. ويظل توجيه التسليم يستخدم سياق الجلسة الرئيسية.
</ParamField>
<ParamField path="session" type="string">
  مفتاح جلسة اختياري لتشغيلات Heartbeat.

- `main` (الافتراضي): الجلسة الرئيسية للوكيل.
- مفتاح جلسة صريح (انسخه من `openclaw sessions --json` أو من [sessions CLI](/ar/cli/sessions)).
- صيغ مفاتيح الجلسات: راجع [Sessions](/ar/concepts/session) و[Groups](/ar/channels/groups).
  </ParamField>
  <ParamField path="target" type="string">
- `last`: التسليم إلى آخر قناة خارجية مستخدمة.
- قناة صريحة: أي قناة مضبوطة أو معرّف Plugin، مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`.
- `none` (الافتراضي): تشغيل Heartbeat لكن **من دون تسليم** خارجي.
  </ParamField>
  <ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  يتحكم في سلوك التسليم المباشر/DM. `allow`: السماح بتسليم Heartbeat المباشر/DM. `block`: كبت التسليم المباشر/DM (`reason=dm-blocked`).
  </ParamField>
  <ParamField path="to" type="string">
  تجاوز اختياري للمستلم (معرّف خاص بالقناة، مثل E.164 لـ WhatsApp أو معرّف دردشة Telegram). وبالنسبة إلى topics/threads في Telegram، استخدم `<chatId>:topic:<messageThreadId>`.
  </ParamField>
  <ParamField path="accountId" type="string">
  معرّف حساب اختياري للقنوات متعددة الحسابات. وعند استخدام `target: "last"`، يُطبَّق معرّف الحساب على آخر قناة تم حلها إذا كانت تدعم الحسابات؛ وإلا فيتم تجاهله. وإذا لم يطابق معرّف الحساب حسابًا مضبوطًا للقناة التي تم حلها، يتم تخطي التسليم.
  </ParamField>
  <ParamField path="prompt" type="string">
  يتجاوز متن المطالبة الافتراضي (من دون دمج).
  </ParamField>
  <ParamField path="ackMaxChars" type="number" default="300">
  الحد الأقصى للأحرف المسموح بها بعد `HEARTBEAT_OK` قبل التسليم.
  </ParamField>
  <ParamField path="suppressToolErrorWarnings" type="boolean">
  عندما تكون true، يتم كبت حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
  </ParamField>
  <ParamField path="activeHours" type="object">
  يقيّد تشغيلات Heartbeat بنافذة زمنية. كائن يحتوي على `start` (بصيغة HH:MM، شامل؛ استخدم `00:00` لبداية اليوم)، و`end` (بصيغة HH:MM، غير شامل؛ ويُسمح بـ `24:00` لنهاية اليوم)، و`timezone` اختيارية.

- إذا تم حذفه أو تعيينه إلى `"user"`: يستخدم `agents.defaults.userTimezone` لديك إذا كانت مضبوطة، وإلا يعود إلى المنطقة الزمنية لنظام المضيف.
- `"local"`: يستخدم دائمًا المنطقة الزمنية لنظام المضيف.
- أي معرّف IANA (مثل `America/New_York`): يُستخدم مباشرة؛ وإذا كان غير صالح، يعود إلى سلوك `"user"` أعلاه.
- يجب ألا تكون قيمتا `start` و`end` متساويتين في نافذة نشطة؛ فالقيم المتساوية تُعامل على أنها نافذة بعرض صفري (دائمًا خارج النافذة).
- خارج النافذة النشطة، يتم تخطي Heartbeats حتى النبضة التالية داخل النافذة.
  </ParamField>

## سلوك التسليم

<AccordionGroup>
  <Accordion title="الجلسة وتوجيه الهدف">
    - تعمل Heartbeats افتراضيًا في الجلسة الرئيسية للوكيل (`agent:<id>:<mainKey>`)، أو `global` عندما تكون `session.scope = "global"`. اضبط `session` لتجاوزها إلى جلسة قناة محددة (Discord/WhatsApp/إلخ).
    - يؤثر `session` فقط في سياق التشغيل؛ أما التسليم فيتحكم فيه `target` و`to`.
    - للتسليم إلى قناة/مستلم محدد، اضبط `target` + `to`. ومع `target: "last"`، يستخدم التسليم آخر قناة خارجية لتلك الجلسة.
    - تسمح عمليات تسليم Heartbeat بالأهداف المباشرة/DM افتراضيًا. اضبط `directPolicy: "block"` لكبت الإرسال إلى الأهداف المباشرة مع الاستمرار في تشغيل دور Heartbeat.
    - إذا كان الطابور الرئيسي مشغولًا، يتم تخطي Heartbeat ثم إعادة المحاولة لاحقًا.
    - إذا تم حل `target` إلى عدم وجود وجهة خارجية، فسيستمر التشغيل لكن لن تُرسل أي رسالة صادرة.
  </Accordion>
  <Accordion title="الظهور وسلوك التخطي">
    - إذا كانت `showOk` و`showAlerts` و`useIndicator` كلها معطلة، فسيتم تخطي التشغيل مسبقًا على أنه `reason=alerts-disabled`.
    - إذا كان تسليم التنبيهات فقط معطلًا، فلا يزال بإمكان OpenClaw تشغيل Heartbeat، وتحديث الطوابع الزمنية للمهام المستحقة، واستعادة الطابع الزمني لخمول الجلسة، وكبت حمولة التنبيه الخارجية.
    - إذا كان الهدف المحلول لـ Heartbeat يدعم الكتابة، فسيعرض OpenClaw مؤشر الكتابة أثناء نشاط تشغيل Heartbeat. ويستخدم هذا الهدف نفسه الذي كان Heartbeat سيرسل إليه خرج الدردشة، ويتم تعطيله بواسطة `typingMode: "never"`.
  </Accordion>
  <Accordion title="دورة حياة الجلسة والتدقيق">
    - الردود الخاصة بـ Heartbeat فقط **لا** تُبقي الجلسة حية. وقد تحدّث بيانات Heartbeat الوصفية صف الجلسة، لكن انتهاء الخمول يستخدم `lastInteractionAt` من آخر رسالة مستخدم/قناة حقيقية، ويستخدم الانتهاء اليومي `sessionStartedAt`.
    - يُخفي سجل Control UI وWebChat مطالبات Heartbeat وإقرارات OK فقط. ومع ذلك، قد تظل نسخة الجلسة الأساسية تحتوي على تلك الأدوار من أجل التدقيق/إعادة التشغيل.
    - يمكن لـ [المهام الخلفية](/ar/automation/tasks) المنفصلة إدراج حدث نظام وتنبيه Heartbeat عندما ينبغي أن تلاحظ الجلسة الرئيسية شيئًا بسرعة. ولا يجعل هذا التنبيه تشغيل Heartbeat مهمة خلفية.
  </Accordion>
</AccordionGroup>

## عناصر التحكم في الظهور

افتراضيًا، يتم كبت إقرارات `HEARTBEAT_OK` بينما يُسلَّم محتوى التنبيه. ويمكنك ضبط ذلك لكل قناة أو لكل حساب:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # إخفاء HEARTBEAT_OK (الافتراضي)
      showAlerts: true # إظهار رسائل التنبيه (الافتراضي)
      useIndicator: true # إصدار أحداث المؤشر (الافتراضي)
  telegram:
    heartbeat:
      showOk: true # إظهار إقرارات OK على Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # كبت تسليم التنبيهات لهذا الحساب
```

الأولوية: لكل حساب ← لكل قناة ← القيم الافتراضية للقنوات ← القيم الافتراضية المضمنة.

### ما الذي يفعله كل علم

- `showOk`: يرسل إقرار `HEARTBEAT_OK` عندما يعيد النموذج ردًا يحتوي على OK فقط.
- `showAlerts`: يرسل محتوى التنبيه عندما يعيد النموذج ردًا غير OK.
- `useIndicator`: يصدر أحداث مؤشر لأسطح حالة واجهة المستخدم.

إذا كانت **الثلاثة كلها** false، فإن OpenClaw يتخطى تشغيل Heartbeat بالكامل (من دون استدعاء للنموذج).

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
      showOk: true # جميع حسابات Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # كبت التنبيهات لحساب ops فقط
  telegram:
    heartbeat:
      showOk: true
```

### أنماط شائعة

| الهدف                                    | التهيئة                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| السلوك الافتراضي (OK صامتة، والتنبيهات مفعلة) | _(لا حاجة إلى تهيئة)_                                                                    |
| صامت بالكامل (لا رسائل ولا مؤشر)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| مؤشر فقط (من دون رسائل)                  | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK في قناة واحدة فقط                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختياري)

إذا كان الملف `HEARTBEAT.md` موجودًا في مساحة العمل، فإن المطالبة الافتراضية تطلب من الوكيل قراءته. فكّر فيه باعتباره "قائمة التحقق الخاصة بـ Heartbeat": صغيرًا، ومستقرًا، وآمنًا للإدراج كل 30 دقيقة.

في التشغيلات العادية، لا يتم حقن `HEARTBEAT.md` إلا عندما تكون إرشادات Heartbeat مفعلة للوكيل الافتراضي. ويؤدي تعطيل وتيرة Heartbeat باستخدام `0m` أو تعيين `includeSystemPromptSection: false` إلى حذفه من سياق التهيئة الأولية العادي.

إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (فقط أسطر فارغة وعناوين Markdown مثل `# Heading`)، فإن OpenClaw يتخطى تشغيل Heartbeat لتوفير استدعاءات API. ويتم الإبلاغ عن هذا التخطي على أنه `reason=empty-heartbeat-file`. أما إذا كان الملف مفقودًا، فتستمر Heartbeat في العمل ويقرر النموذج ما الذي يجب فعله.

اجعله صغيرًا جدًا (قائمة تحقق قصيرة أو تذكيرات) لتجنب تضخم الـ prompt.

مثال على `HEARTBEAT.md`:

```md
# قائمة التحقق الخاصة بـ Heartbeat

- فحص سريع: هل يوجد شيء عاجل في صناديق البريد؟
- إذا كان الوقت نهارًا، فأجرِ تواصلًا خفيفًا إذا لم يكن هناك شيء آخر معلق.
- إذا كانت مهمة ما محجوبة، فدوّن _ما الذي ينقص_ واسأل Peter في المرة القادمة.
```

### كتل `tasks:`

يدعم `HEARTBEAT.md` أيضًا كتلة `tasks:` منظمة صغيرة لإجراء الفحوصات المعتمدة على الفاصل الزمني داخل Heartbeat نفسها.

مثال:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "تحقق من الرسائل الإلكترونية غير المقروءة العاجلة وحدد أي شيء حساس للوقت."
- name: calendar-scan
  interval: 2h
  prompt: "تحقق من الاجتماعات القادمة التي تحتاج إلى استعداد أو متابعة."

# تعليمات إضافية

- اجعل التنبيهات قصيرة.
- إذا لم يكن هناك ما يحتاج إلى انتباه بعد جميع المهام المستحقة، فردّ بـ HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="السلوك">
    - يحلل OpenClaw كتلة `tasks:` ويتحقق من كل مهمة وفق `interval` الخاص بها.
    - لا تُضمَّن في مطالبة Heartbeat لتلك النبضة إلا المهام **المستحقة**.
    - إذا لم تكن هناك مهام مستحقة، يتم تخطي Heartbeat بالكامل (`reason=no-tasks-due`) لتجنب استدعاء نموذج بلا فائدة.
    - يتم الاحتفاظ بالمحتوى غير الخاص بالمهام في `HEARTBEAT.md` وإلحاقه كسياق إضافي بعد قائمة المهام المستحقة.
    - تُخزَّن الطوابع الزمنية لآخر تشغيل للمهام في حالة الجلسة (`heartbeatTaskState`)، لذا تستمر الفواصل الزمنية عبر عمليات إعادة التشغيل العادية.
    - لا تتقدم الطوابع الزمنية للمهام إلا بعد أن يكمل تشغيل Heartbeat مسار رده العادي. أما التشغيلات المتخطاة `empty-heartbeat-file` / `no-tasks-due` فلا تعلّم المهام على أنها مكتملة.
  </Accordion>
</AccordionGroup>

يكون وضع المهام مفيدًا عندما تريد أن يحتوي ملف Heartbeat واحد على عدة فحوصات دورية من دون دفع تكلفة جميعها في كل نبضة.

### هل يمكن للوكيل تحديث HEARTBEAT.md؟

نعم — إذا طلبت منه ذلك.

`HEARTBEAT.md` ليس سوى ملف عادي في مساحة عمل الوكيل، لذلك يمكنك إخبار الوكيل (في محادثة عادية) بشيء مثل:

- "حدّث `HEARTBEAT.md` لإضافة فحص يومي للتقويم."
- "أعد كتابة `HEARTBEAT.md` ليكون أقصر ويركز على متابعات البريد الوارد."

وإذا أردت أن يحدث ذلك بشكل استباقي، فيمكنك أيضًا تضمين سطر صريح في مطالبة Heartbeat مثل: "إذا أصبحت قائمة التحقق قديمة، فحدّث HEARTBEAT.md بقائمة أفضل."

<Warning>
لا تضع أسرارًا (مفاتيح API أو أرقام الهواتف أو الرموز الخاصة) في `HEARTBEAT.md` — لأنه يصبح جزءًا من سياق الـ prompt.
</Warning>

## تنبيه يدوي (عند الطلب)

يمكنك إدراج حدث نظام وتشغيل Heartbeat فورًا باستخدام:

```bash
openclaw system event --text "تحقق من المتابعات العاجلة" --mode now
```

إذا كانت هناك عدة وكلاء لديهم `heartbeat` مضبوطًا، فإن التنبيه اليدوي يشغّل Heartbeats الخاصة بكل هؤلاء الوكلاء فورًا.

استخدم `--mode next-heartbeat` للانتظار حتى النبضة المجدولة التالية.

## تسليم reasoning (اختياري)

افتراضيًا، تسلّم Heartbeats حمولة "الإجابة" النهائية فقط.

إذا كنت تريد الشفافية، ففعّل:

- `agents.defaults.heartbeat.includeReasoning: true`

عند التفعيل، ستسلّم Heartbeats أيضًا رسالة منفصلة مسبوقة بـ `Reasoning:` (بنفس شكل `/reasoning on`). ويمكن أن يكون ذلك مفيدًا عندما يدير الوكيل جلسات/codexes متعددة وتريد أن ترى لماذا قرر تنبيهك — لكنه قد يكشف أيضًا تفاصيل داخلية أكثر مما تريد. ويُفضّل إبقاؤه معطلًا في محادثات المجموعات.

## الوعي بالتكلفة

تشغّل Heartbeats أدوار وكيل كاملة. وكلما قصرت الفواصل الزمنية زاد استهلاك الرموز. ولتقليل التكلفة:

- استخدم `isolatedSession: true` لتجنب إرسال سجل المحادثة الكامل (من ~100 ألف رمز إلى ~2-5 آلاف لكل تشغيل).
- استخدم `lightContext: true` لقصر ملفات التهيئة الأولية على `HEARTBEAT.md` فقط.
- اضبط `model` أرخص (مثل `ollama/llama3.2:1b`).
- أبقِ `HEARTBEAT.md` صغيرًا.
- استخدم `target: "none"` إذا كنت تريد فقط تحديثات الحالة الداخلية.

## ذو صلة

- [Automation & Tasks](/ar/automation) — نظرة سريعة على جميع آليات الأتمتة
- [المهام الخلفية](/ar/automation/tasks) — كيفية تتبع العمل المنفصل
- [Timezone](/ar/concepts/timezone) — كيف تؤثر المنطقة الزمنية في جدولة Heartbeat
- [استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting) — تصحيح مشكلات الأتمتة
