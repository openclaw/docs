---
read_when:
    - ضبط وتيرة Heartbeat أو المراسلة
    - الاختيار بين Heartbeat و Cron للمهام المجدولة
sidebarTitle: Heartbeat
summary: رسائل استطلاع Heartbeat وقواعد الإشعارات
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T00:59:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: de1fee0df75d9e8f356dc02d089f61ae5048c302169acc363eee2149e09aacb3
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat أم cron؟** راجع [Automation](/ar/automation) للحصول على إرشادات حول وقت استخدام كل منهما.
</Note>

يشغّل Heartbeat **دورات وكيل دورية** في الجلسة الرئيسية حتى يتمكن النموذج من إبراز أي شيء يحتاج إلى انتباهك دون إزعاجك بالرسائل.

Heartbeat هو دورة مجدولة في الجلسة الرئيسية — ولا ينشئ سجلات [مهمة خلفية](/ar/automation/tasks). سجلات المهام مخصصة للعمل المنفصل (تشغيلات ACP، والوكلاء الفرعيون، ومهام cron المعزولة).

استكشاف الأخطاء وإصلاحها: [المهام المجدولة](/ar/automation/cron-jobs#troubleshooting)

## البدء السريع (للمبتدئين)

<Steps>
  <Step title="Pick a cadence">
    اترك Heartbeat مفعلا (الافتراضي هو `30m`، أو `1h` لمصادقة Anthropic OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI) أو اضبط وتيرتك الخاصة.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    أنشئ قائمة تحقق صغيرة في `HEARTBEAT.md` أو كتلة `tasks:` في مساحة عمل الوكيل.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` هو الافتراضي؛ اضبط `target: "last"` للتوجيه إلى آخر جهة اتصال.
  </Step>
  <Step title="Optional tuning">
    - فعّل تسليم استدلال Heartbeat للشفافية.
    - استخدم سياق تمهيد خفيفا إذا كانت تشغيلات Heartbeat تحتاج فقط إلى `HEARTBEAT.md`.
    - فعّل الجلسات المعزولة لتجنب إرسال سجل المحادثة الكامل في كل Heartbeat.
    - قيّد Heartbeat بساعات النشاط (بالتوقيت المحلي).

  </Step>
</Steps>

مثال على الإعداد:

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

- الفاصل الزمني: `30m` (أو `1h` عندما يكون وضع المصادقة المكتشف هو مصادقة Anthropic OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI). اضبط `agents.defaults.heartbeat.every` أو `agents.list[].heartbeat.every` لكل وكيل؛ استخدم `0m` للتعطيل.
- نص الموجه (قابل للضبط عبر `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- يرسل موجه Heartbeat **حرفيا** كرسالة المستخدم. يتضمن موجه النظام قسما باسم "Heartbeat" فقط عند تفعيل Heartbeat للوكيل الافتراضي، ويتم تمييز التشغيل داخليا.
- عند تعطيل Heartbeat باستخدام `0m`، تحذف التشغيلات العادية أيضا `HEARTBEAT.md` من سياق التمهيد حتى لا يرى النموذج تعليمات مخصصة لـ Heartbeat فقط.
- يتم التحقق من ساعات النشاط (`heartbeat.activeHours`) في المنطقة الزمنية المضبوطة. خارج النافذة، يتم تخطي Heartbeat حتى النبضة التالية داخل النافذة.
- يؤجل Heartbeat تلقائيا أثناء نشاط عمل cron أو وجوده في قائمة الانتظار. اضبط `heartbeat.skipWhenBusy: true` للتأجيل أيضا عند وجود مسارات إضافية مشغولة (عمل وكيل فرعي أو أوامر متداخلة)؛ وهذا مفيد لـ Ollama المحلي والمضيفين الآخرين محدودي وقت التشغيل الواحد.

## ما الغرض من موجه Heartbeat

الموجه الافتراضي واسع عمدا:

- **المهام الخلفية**: "Consider outstanding tasks" يحث الوكيل على مراجعة المتابعات (صندوق الوارد، التقويم، التذكيرات، العمل في قائمة الانتظار) وإبراز أي شيء عاجل.
- **اطمئنان على الإنسان**: "Checkup sometimes on your human during day time" يحث على رسالة خفيفة أحيانا مثل "هل تحتاج إلى شيء؟"، لكنه يتجنب الإزعاج ليلا باستخدام منطقتك الزمنية المحلية المضبوطة (راجع [المنطقة الزمنية](/ar/concepts/timezone)).

يمكن لـ Heartbeat التفاعل مع [المهام الخلفية](/ar/automation/tasks) المكتملة، لكن تشغيل Heartbeat نفسه لا ينشئ سجل مهمة.

إذا أردت أن يقوم Heartbeat بشيء محدد جدا (مثل "تحقق من إحصاءات Gmail PubSub" أو "تحقق من صحة Gateway")، فاضبط `agents.defaults.heartbeat.prompt` (أو `agents.list[].heartbeat.prompt`) على نص مخصص (يرسل حرفيا).

## عقد الاستجابة

- إذا لم يكن هناك شيء يحتاج إلى انتباه، فأجب بـ **`HEARTBEAT_OK`**.
- قد تستدعي تشغيلات Heartbeat القادرة على استخدام الأدوات بدلا من ذلك `heartbeat_respond` مع `notify: false` لعدم إظهار أي تحديث، أو `notify: true` مع `notificationText` للتنبيه. عند وجود استجابة الأداة المنظمة، تكون لها الأولوية على النص الاحتياطي.
- أثناء تشغيلات Heartbeat، يتعامل OpenClaw مع `HEARTBEAT_OK` كتأكيد عندما يظهر في **بداية أو نهاية** الرد. تتم إزالة الرمز وإسقاط الرد إذا كان المحتوى المتبقي **≤ `ackMaxChars`** (الافتراضي: 300).
- إذا ظهر `HEARTBEAT_OK` في **وسط** الرد، فلن تتم معاملته بشكل خاص.
- للتنبيهات، **لا** تضمّن `HEARTBEAT_OK`؛ أرجع نص التنبيه فقط.

خارج Heartbeat، تتم إزالة `HEARTBEAT_OK` العارض في بداية/نهاية الرسالة وتسجيله؛ ويتم إسقاط الرسالة التي لا تحتوي إلا على `HEARTBEAT_OK`.

## الإعدادات

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
- يتم دمج `agents.list[].heartbeat` فوقه؛ إذا كان لدى أي وكيل كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغلون Heartbeat.
- يضبط `channels.defaults.heartbeat` إعدادات الظهور الافتراضية لكل القنوات.
- يتجاوز `channels.<channel>.heartbeat` إعدادات القناة الافتراضية.
- يتجاوز `channels.<channel>.accounts.<id>.heartbeat` (القنوات متعددة الحسابات) إعدادات القناة.

### Heartbeat لكل وكيل

إذا تضمن أي إدخال في `agents.list[]` كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغلون Heartbeat. تدمج الكتلة الخاصة بالوكيل فوق `agents.defaults.heartbeat` (لذا يمكنك ضبط الإعدادات الافتراضية المشتركة مرة واحدة وتجاوزها لكل وكيل).

مثال: وكيلان، والوكيل الثاني فقط يشغل Heartbeat.

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

### مثال على ساعات النشاط

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

خارج هذه النافذة (قبل 9 صباحا أو بعد 10 مساء بالتوقيت الشرقي)، يتم تخطي Heartbeat. ستعمل النبضة المجدولة التالية داخل النافذة بشكل طبيعي.

### إعداد 24/7

إذا أردت تشغيل Heartbeat طوال اليوم، فاستخدم أحد هذين النمطين:

- احذف `activeHours` بالكامل (لا يوجد قيد لنافذة زمنية؛ وهذا هو السلوك الافتراضي).
- اضبط نافذة ليوم كامل: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
لا تضبط وقتي `start` و`end` على القيمة نفسها (على سبيل المثال من `08:00` إلى `08:00`). يعامل ذلك كنافذة بعرض صفري، لذلك يتم دائما تخطي Heartbeat.
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
  تجاوز اختياري للنموذج في تشغيلات Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  عند تفعيله، يتم أيضا تسليم رسالة `Reasoning:` المنفصلة عند توفرها (بالشكل نفسه مثل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  عند ضبطه على true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفا وتبقي فقط على `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  عند ضبطه على true، يعمل كل Heartbeat في جلسة جديدة دون سجل محادثة سابق. يستخدم نمط العزل نفسه مثل cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat بشكل كبير. ادمجه مع `lightContext: true` لتحقيق أقصى توفير. لا يزال توجيه التسليم يستخدم سياق الجلسة الرئيسية.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  عند ضبطه على true، تؤجل تشغيلات Heartbeat عند وجود مسارات إضافية مشغولة: عمل وكيل فرعي أو أوامر متداخلة. تؤجل مسارات Cron دائما Heartbeat، حتى دون هذا العلم، حتى لا تشغل مضيفات النماذج المحلية موجهات cron وHeartbeat في الوقت نفسه.
</ParamField>
<ParamField path="session" type="string">
  مفتاح جلسة اختياري لتشغيلات Heartbeat.

- `main` (افتراضي): جلسة الوكيل الرئيسية.
- مفتاح جلسة صريح (انسخه من `openclaw sessions --json` أو [sessions CLI](/ar/cli/sessions)).
- تنسيقات مفتاح الجلسة: راجع [الجلسات](/ar/concepts/session) و[المجموعات](/ar/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: التسليم إلى آخر قناة خارجية مستخدمة.
- قناة صريحة: أي قناة مضبوطة أو معرف Plugin، مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`.
- `none` (افتراضي): شغّل Heartbeat لكن **لا تسلّمه** خارجيا.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  يتحكم في سلوك التسليم المباشر/DM. `allow`: السماح بتسليم Heartbeat المباشر/DM. `block`: منع التسليم المباشر/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  تجاوز اختياري للمستلم (معرف خاص بالقناة، مثل E.164 لـ WhatsApp أو معرف دردشة Telegram). لمواضيع/سلاسل Telegram، استخدم `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  معرف حساب اختياري للقنوات متعددة الحسابات. عند `target: "last"`، ينطبق معرف الحساب على آخر قناة محلولة إذا كانت تدعم الحسابات؛ وإلا يتم تجاهله. إذا لم يطابق معرف الحساب حسابا مضبوطا للقناة المحلولة، يتم تخطي التسليم.

</ParamField>
<ParamField path="prompt" type="string">
  يتجاوز نص الموجه الافتراضي (لا يتم دمجه).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  الحد الأقصى لعدد الأحرف المسموح بها بعد `HEARTBEAT_OK` قبل التسليم.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  عند ضبطه على true، يكتم حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  يقيّد تشغيلات Heartbeat بنافذة زمنية. كائن يتضمن `start` (HH:MM، شامل؛ استخدم `00:00` لبداية اليوم)، و`end` (HH:MM غير شامل؛ يُسمح بـ `24:00` لنهاية اليوم)، و`timezone` اختياريًا.

- عند الحذف أو استخدام `"user"`: يستخدم `agents.defaults.userTimezone` الخاص بك إذا كان مضبوطًا، وإلا يعود إلى المنطقة الزمنية لنظام المضيف.
- `"local"`: يستخدم دائمًا المنطقة الزمنية لنظام المضيف.
- أي معرّف IANA (مثل `America/New_York`): يُستخدم مباشرة؛ وإذا كان غير صالح، يعود إلى سلوك `"user"` أعلاه.
- يجب ألا تكون قيمتا `start` و`end` متساويتين لنافذة نشطة؛ تُعامل القيم المتساوية كنافذة صفرية العرض (خارج النافذة دائمًا).
- خارج النافذة النشطة، تُتخطى Heartbeats حتى النبضة التالية داخل النافذة.

</ParamField>

## سلوك التسليم

<AccordionGroup>
  <Accordion title="توجيه الجلسة والهدف">
    - تعمل Heartbeats في الجلسة الرئيسية للوكيل افتراضيًا (`agent:<id>:<mainKey>`)، أو `global` عندما تكون `session.scope = "global"`. اضبط `session` لتجاوز ذلك إلى جلسة قناة محددة (Discord/WhatsApp/إلخ).
    - يؤثر `session` فقط في سياق التشغيل؛ أما التسليم فيتحكم فيه `target` و`to`.
    - للتسليم إلى قناة/مستلم محدد، اضبط `target` + `to`. مع `target: "last"`، يستخدم التسليم آخر قناة خارجية لتلك الجلسة.
    - تسمح تسليمات Heartbeat بالأهداف المباشرة/DM افتراضيًا. اضبط `directPolicy: "block"` لكتم الإرسال إلى الأهداف المباشرة مع الاستمرار في تشغيل دورة Heartbeat.
    - إذا كان الصف الرئيسي أو مسار جلسة الهدف أو مسار Cron أو مهمة Cron نشطة مشغولًا، تُتخطى Heartbeat ويُعاد المحاولة لاحقًا.
    - إذا كان `skipWhenBusy: true`، تؤجل مسارات الوكلاء الفرعيين والمسارات المتداخلة أيضًا تشغيلات Heartbeat.
    - إذا لم يُحل `target` إلى أي وجهة خارجية، يستمر التشغيل لكن لا تُرسل أي رسالة صادرة.

  </Accordion>
  <Accordion title="الرؤية وسلوك التخطي">
    - إذا كانت `showOk` و`showAlerts` و`useIndicator` كلها معطلة، يُتخطى التشغيل مقدمًا باعتباره `reason=alerts-disabled`.
    - إذا كان تسليم التنبيهات وحده معطلًا، لا يزال بإمكان OpenClaw تشغيل Heartbeat، وتحديث الطوابع الزمنية للمهام المستحقة، واستعادة طابع خمول الجلسة الزمني، وكتم حمولة التنبيه الخارجية.
    - إذا كان هدف Heartbeat المحلول يدعم مؤشر الكتابة، يعرض OpenClaw الكتابة أثناء نشاط تشغيل Heartbeat. يستخدم هذا الهدف نفسه الذي كانت Heartbeat سترسل إليه مخرجات الدردشة، ويُعطله `typingMode: "never"`.

  </Accordion>
  <Accordion title="دورة حياة الجلسة والتدقيق">
    - لا تُبقي الردود الخاصة بـ Heartbeat فقط الجلسة حية. قد تُحدّث بيانات Heartbeat الوصفية صف الجلسة، لكن انتهاء الخمول يستخدم `lastInteractionAt` من آخر رسالة حقيقية من المستخدم/القناة، ويستخدم الانتهاء اليومي `sessionStartedAt`.
    - تخفي واجهة التحكم وسجل WebChat مطالبات Heartbeat وإقرارات OK فقط. لا يزال بإمكان نص الجلسة الأساسي أن يحتوي على تلك الدورات للتدقيق/إعادة التشغيل.
    - يمكن لـ [المهام الخلفية](/ar/automation/tasks) المنفصلة إدراج حدث نظام وإيقاظ Heartbeat عندما ينبغي للجلسة الرئيسية ملاحظة شيء بسرعة. لا يجعل ذلك الإيقاظ تشغيل Heartbeat مهمة خلفية.

  </Accordion>
</AccordionGroup>

## عناصر التحكم في الرؤية

افتراضيًا، تُكتم إقرارات `HEARTBEAT_OK` بينما يُسلّم محتوى التنبيه. يمكنك ضبط ذلك لكل قناة أو لكل حساب:

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

الأسبقية: لكل حساب ← لكل قناة ← إعدادات القناة الافتراضية ← الإعدادات الافتراضية المضمنة.

### ما يفعله كل علم

- `showOk`: يرسل إقرار `HEARTBEAT_OK` عندما يعيد النموذج ردًا يحتوي على OK فقط.
- `showAlerts`: يرسل محتوى التنبيه عندما يعيد النموذج ردًا ليس OK.
- `useIndicator`: يصدر أحداث مؤشر لأسطح حالة واجهة المستخدم.

إذا كانت **الثلاثة كلها** false، يتخطى OpenClaw تشغيل Heartbeat بالكامل (لا توجد استدعاءات للنموذج).

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
| السلوك الافتراضي (إقرارات OK صامتة، والتنبيهات مفعّلة) | _(لا يلزم إعداد)_                                                                     |
| صامت بالكامل (لا رسائل ولا مؤشر) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| مؤشر فقط (لا رسائل)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| إقرارات OK في قناة واحدة فقط                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختياري)

إذا كان ملف `HEARTBEAT.md` موجودًا في مساحة العمل، فإن المطالبة الافتراضية تطلب من الوكيل قراءته. فكّر فيه باعتباره "قائمة تحقق Heartbeat" الخاصة بك: صغيرة، وثابتة، وآمنة للإدراج كل 30 دقيقة.

في التشغيلات العادية، لا يُحقن `HEARTBEAT.md` إلا عندما تكون إرشادات Heartbeat مفعّلة للوكيل الافتراضي. يؤدي تعطيل وتيرة Heartbeat باستخدام `0m` أو ضبط `includeSystemPromptSection: false` إلى حذفه من سياق التمهيد العادي.

إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (يتضمن فقط أسطرًا فارغة وترويسات Markdown مثل `# Heading`)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API. يُبلغ عن ذلك التخطي باعتباره `reason=empty-heartbeat-file`. إذا كان الملف مفقودًا، تستمر Heartbeat في العمل ويقرر النموذج ما يجب فعله.

اجعله صغيرًا جدًا (قائمة تحقق قصيرة أو تذكيرات) لتجنب تضخم المطالبة.

مثال `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### كتل `tasks:`

يدعم `HEARTBEAT.md` أيضًا كتلة `tasks:` منظمة صغيرة للفحوصات المستندة إلى الفواصل الزمنية داخل Heartbeat نفسها.

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
    - لا تُدرج في مطالبة Heartbeat لذلك النبض إلا المهام **المستحقة**.
    - إذا لم تكن هناك مهام مستحقة، تُتخطى Heartbeat بالكامل (`reason=no-tasks-due`) لتجنب استدعاء نموذج مهدور.
    - يُحفظ المحتوى غير المتعلق بالمهام في `HEARTBEAT.md` ويُضاف كسياق إضافي بعد قائمة المهام المستحقة.
    - تُخزن الطوابع الزمنية لآخر تشغيل للمهام في حالة الجلسة (`heartbeatTaskState`)، لذا تبقى الفواصل الزمنية بعد عمليات إعادة التشغيل العادية.
    - لا تُقدّم الطوابع الزمنية للمهام إلا بعد اكتمال تشغيل Heartbeat لمسار الرد العادي. لا تعلّم تشغيلات `empty-heartbeat-file` / `no-tasks-due` المتخطاة المهام كمكتملة.

  </Accordion>
</AccordionGroup>

يكون وضع المهام مفيدًا عندما تريد أن يحتوي ملف Heartbeat واحد على عدة فحوصات دورية دون الدفع مقابلها كلها في كل نبضة.

### هل يمكن للوكيل تحديث HEARTBEAT.md؟

نعم — إذا طلبت منه ذلك.

`HEARTBEAT.md` مجرد ملف عادي في مساحة عمل الوكيل، لذا يمكنك إخبار الوكيل (في دردشة عادية) بشيء مثل:

- "حدّث `HEARTBEAT.md` لإضافة فحص يومي للتقويم."
- "أعد كتابة `HEARTBEAT.md` ليكون أقصر ومركزًا على متابعات البريد الوارد."

إذا أردت أن يحدث ذلك استباقيًا، يمكنك أيضًا تضمين سطر صريح في مطالبة Heartbeat مثل: "إذا أصبحت قائمة التحقق قديمة، فحدّث HEARTBEAT.md بقائمة أفضل."

<Warning>
لا تضع أسرارًا (مفاتيح API، أرقام هواتف، رموزًا خاصة) في `HEARTBEAT.md` — فهو يصبح جزءًا من سياق المطالبة.
</Warning>

## الإيقاظ اليدوي (عند الطلب)

يمكنك إدراج حدث نظام وتشغيل Heartbeat فورية باستخدام:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

إذا كان لدى عدة وكلاء إعداد `heartbeat`، فإن الإيقاظ اليدوي يشغّل كل Heartbeats الخاصة بهؤلاء الوكلاء فورًا.

استخدم `--mode next-heartbeat` للانتظار حتى النبضة المجدولة التالية.

## تسليم الاستدلال (اختياري)

افتراضيًا، لا تسلّم Heartbeats إلا حمولة "الإجابة" النهائية.

إذا أردت الشفافية، فعّل:

- `agents.defaults.heartbeat.includeReasoning: true`

عند التفعيل، ستسلّم Heartbeats أيضًا رسالة منفصلة مسبوقة بـ `Reasoning:` (بالشكل نفسه مثل `/reasoning on`). يمكن أن يكون ذلك مفيدًا عندما يدير الوكيل عدة جلسات/بيئات codex وتريد أن ترى لماذا قرر تنبيهك — لكنه قد يسرّب أيضًا تفاصيل داخلية أكثر مما تريد. يُفضل إبقاؤه معطلًا في دردشات المجموعات.

## الوعي بالتكلفة

تُشغّل Heartbeats دورات وكيل كاملة. تستهلك الفواصل الأقصر رموزًا أكثر. لتقليل التكلفة:

- استخدم `isolatedSession: true` لتجنب إرسال سجل المحادثة الكامل (من نحو 100 ألف رمز إلى نحو 2-5 آلاف لكل تشغيل).
- استخدم `lightContext: true` لقصر ملفات التمهيد على `HEARTBEAT.md` فقط.
- اضبط `model` أرخص (مثل `ollama/llama3.2:1b`).
- أبقِ `HEARTBEAT.md` صغيرًا.
- استخدم `target: "none"` إذا كنت تريد تحديثات الحالة الداخلية فقط.

## فيضان السياق بعد Heartbeat

إذا تركت Heartbeat سابقًا جلسة موجودة على نموذج محلي أصغر، مثل نموذج Ollama بنافذة 32k، وأبلغت دورة الجلسة الرئيسية التالية عن فيضان في السياق، فأعد ضبط نموذج وقت تشغيل الجلسة إلى النموذج الأساسي المضبوط. تشير رسالة إعادة الضبط في OpenClaw إلى ذلك عندما يطابق آخر نموذج وقت تشغيل `heartbeat.model` المضبوط.

تحافظ Heartbeats الحالية على نموذج وقت التشغيل الحالي للجلسة المشتركة بعد اكتمال التشغيل. لا يزال بإمكانك استخدام `isolatedSession: true` لتشغيل Heartbeats في جلسة جديدة، ودمجه مع `lightContext: true` للحصول على أصغر مطالبة، أو اختيار نموذج Heartbeat بنافذة سياق كبيرة بما يكفي للجلسة المشتركة.

## ذات صلة

- [الأتمتة](/ar/automation) — جميع آليات الأتمتة بنظرة سريعة
- [المهام الخلفية](/ar/automation/tasks) — كيفية تتبع العمل المنفصل
- [المنطقة الزمنية](/ar/concepts/timezone) — كيف تؤثر المنطقة الزمنية في جدولة Heartbeat
- [استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting) — تصحيح مشكلات الأتمتة
