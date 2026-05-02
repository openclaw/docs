---
read_when:
    - تعديل وتيرة Heartbeat أو المراسلة
    - الاختيار بين Heartbeat و Cron للمهام المجدولة
sidebarTitle: Heartbeat
summary: رسائل استطلاع Heartbeat وقواعد الإشعارات
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T20:45:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat أم cron؟** راجع [الأتمتة والمهام](/ar/automation) للحصول على إرشادات حول متى تستخدم كلًا منهما.
</Note>

يشغّل Heartbeat **دورات وكيل دورية** في الجلسة الرئيسية حتى يتمكن النموذج من إظهار أي شيء يحتاج إلى انتباهك دون إغراقك بالرسائل.

Heartbeat هو دورة مجدولة في الجلسة الرئيسية — ولا ينشئ سجلات [مهام خلفية](/ar/automation/tasks). سجلات المهام مخصصة للعمل المنفصل (تشغيلات ACP، والوكلاء الفرعيين، ومهام cron المعزولة).

استكشاف الأخطاء وإصلاحها: [المهام المجدولة](/ar/automation/cron-jobs#troubleshooting)

## البدء السريع (للمبتدئين)

<Steps>
  <Step title="اختر وتيرة">
    اترك Heartbeat مفعّلًا (القيمة الافتراضية هي `30m`، أو `1h` لمصادقة Anthropic عبر OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI) أو اضبط وتيرتك الخاصة.
  </Step>
  <Step title="أضف HEARTBEAT.md (اختياري)">
    أنشئ قائمة تحقق صغيرة في `HEARTBEAT.md` أو كتلة `tasks:` في مساحة عمل الوكيل.
  </Step>
  <Step title="حدد أين يجب أن تذهب رسائل Heartbeat">
    `target: "none"` هي القيمة الافتراضية؛ اضبط `target: "last"` للتوجيه إلى آخر جهة اتصال.
  </Step>
  <Step title="ضبط اختياري">
    - فعّل تسليم استدلال Heartbeat للشفافية.
    - استخدم سياق تمهيد خفيفًا إذا كانت تشغيلات Heartbeat تحتاج فقط إلى `HEARTBEAT.md`.
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

## القيم الافتراضية

- الفاصل الزمني: `30m` (أو `1h` عندما يكون وضع المصادقة المكتشف هو مصادقة Anthropic عبر OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI). اضبط `agents.defaults.heartbeat.every` أو `agents.list[].heartbeat.every` لكل وكيل؛ استخدم `0m` للتعطيل.
- نص الموجه (قابل للضبط عبر `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- يُرسل موجه Heartbeat **حرفيًا** كرسالة المستخدم. يتضمن موجه النظام قسم "Heartbeat" فقط عندما تكون Heartbeat مفعّلة للوكيل الافتراضي، ويتم وسم التشغيل داخليًا.
- عند تعطيل Heartbeat باستخدام `0m`، تحذف التشغيلات العادية أيضًا `HEARTBEAT.md` من سياق التمهيد حتى لا يرى النموذج تعليمات مخصصة لـ Heartbeat فقط.
- تُفحص ساعات النشاط (`heartbeat.activeHours`) في المنطقة الزمنية المضبوطة. خارج النافذة، يتم تخطي Heartbeat حتى النبضة التالية داخل النافذة.
- يؤجل Heartbeat تلقائيًا عندما يكون عمل cron نشطًا أو في قائمة الانتظار. اضبط `heartbeat.skipWhenBusy: true` للتأجيل أيضًا على المسارات الإضافية المشغولة (عمل وكيل فرعي أو أوامر متداخلة)؛ وهذا مفيد لـ Ollama المحلي وغيره من المضيفين المقيدين بزمن تشغيل واحد.

## الغرض من موجه Heartbeat

الموجه الافتراضي واسع عمدًا:

- **المهام الخلفية**: عبارة "Consider outstanding tasks" تدفع الوكيل إلى مراجعة المتابعات (صندوق الوارد، التقويم، التذكيرات، العمل في قائمة الانتظار) وإظهار أي شيء عاجل.
- **الاطمئنان على الإنسان**: عبارة "Checkup sometimes on your human during day time" تدفع إلى رسالة خفيفة عرضية مثل "هل تحتاج إلى أي شيء؟"، لكنها تتجنب الإزعاج الليلي باستخدام منطقتك الزمنية المحلية المضبوطة (راجع [المنطقة الزمنية](/ar/concepts/timezone)).

يمكن لـ Heartbeat التفاعل مع [المهام الخلفية](/ar/automation/tasks) المكتملة، لكن تشغيل Heartbeat نفسه لا ينشئ سجل مهمة.

إذا أردت أن ينفذ Heartbeat شيئًا محددًا جدًا (مثل "check Gmail PubSub stats" أو "verify gateway health")، فاضبط `agents.defaults.heartbeat.prompt` (أو `agents.list[].heartbeat.prompt`) على نص مخصص (يُرسل حرفيًا).

## عقد الاستجابة

- إذا لم يكن هناك شيء يحتاج إلى انتباه، فأجب بـ **`HEARTBEAT_OK`**.
- يمكن لتشغيلات Heartbeat القادرة على استخدام الأدوات أن تستدعي بدلًا من ذلك `heartbeat_respond` مع `notify: false` لعدم إظهار تحديث مرئي، أو `notify: true` مع `notificationText` لتنبيه. عند وجود استجابة الأداة المنظمة، تكون لها الأولوية على النص الاحتياطي.
- أثناء تشغيلات Heartbeat، يتعامل OpenClaw مع `HEARTBEAT_OK` كتأكيد عندما يظهر في **بداية الرد أو نهايته**. يُزال الرمز وتُسقط الرسالة إذا كان المحتوى المتبقي **≤ `ackMaxChars`** (القيمة الافتراضية: 300).
- إذا ظهر `HEARTBEAT_OK` في **منتصف** الرد، فلا تتم معاملته معاملة خاصة.
- للتنبيهات، **لا** تضمّن `HEARTBEAT_OK`؛ أرجع نص التنبيه فقط.

خارج Heartbeat، يُزال `HEARTBEAT_OK` العارض في بداية/نهاية الرسالة ويُسجل؛ وتُسقط الرسالة التي تكون فقط `HEARTBEAT_OK`.

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
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### النطاق والأولوية

- يضبط `agents.defaults.heartbeat` سلوك Heartbeat العام.
- يندمج `agents.list[].heartbeat` فوقه؛ إذا كان لدى أي وكيل كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغّلون Heartbeat.
- يضبط `channels.defaults.heartbeat` القيم الافتراضية للرؤية لكل القنوات.
- يتجاوز `channels.<channel>.heartbeat` القيم الافتراضية للقناة.
- يتجاوز `channels.<channel>.accounts.<id>.heartbeat` (القنوات متعددة الحسابات) إعدادات كل قناة.

### Heartbeat لكل وكيل

إذا كان أي إدخال في `agents.list[]` يتضمن كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغّلون Heartbeat. تُدمج الكتلة الخاصة بكل وكيل فوق `agents.defaults.heartbeat` (لذلك يمكنك ضبط الإعدادات الافتراضية المشتركة مرة واحدة وتجاوزها لكل وكيل).

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

### مثال ساعات النشاط

قيّد Heartbeat بساعات العمل في منطقة زمنية معينة:

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

خارج هذه النافذة (قبل 9 صباحًا أو بعد 10 مساءً بالتوقيت الشرقي)، يتم تخطي Heartbeat. سيعمل موعد الجدولة التالي داخل النافذة بشكل طبيعي.

### إعداد 24/7

إذا كنت تريد تشغيل Heartbeat طوال اليوم، فاستخدم أحد هذه الأنماط:

- احذف `activeHours` بالكامل (لا يوجد قيد لنافذة زمنية؛ وهذا هو السلوك الافتراضي).
- اضبط نافذة يوم كامل: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
لا تضبط وقت `start` و`end` نفسه (على سبيل المثال من `08:00` إلى `08:00`). يُعامَل ذلك كنافذة بعرض صفري، لذلك يتم دائمًا تخطي Heartbeat.
</Warning>

### مثال الحسابات المتعددة

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
  فاصل Heartbeat (سلسلة مدة؛ الوحدة الافتراضية = دقائق).
</ParamField>
<ParamField path="model" type="string">
  تجاوز اختياري للنموذج في تشغيلات Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  عند التمكين، يتم أيضًا تسليم رسالة `Reasoning:` المنفصلة عند توفرها (بالشكل نفسه مثل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  عندما تكون القيمة صحيحة، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا وتحتفظ فقط بملف `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  عندما تكون القيمة صحيحة، يعمل كل Heartbeat في جلسة جديدة بلا سجل محادثات سابق. يستخدم نمط العزل نفسه مثل cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat بدرجة كبيرة. ادمجه مع `lightContext: true` لتحقيق أقصى توفير. يظل توجيه التسليم يستخدم سياق الجلسة الرئيسية.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  عندما تكون القيمة صحيحة، تؤجل تشغيلات Heartbeat في مسارات الانشغال الإضافية: عمل الوكيل الفرعي أو الأوامر المتداخلة. تؤجل مسارات Cron دائمًا Heartbeat، حتى من دون هذه الراية، بحيث لا تشغل مضيفات النماذج المحلية مطالبات Cron وHeartbeat في الوقت نفسه.
</ParamField>
<ParamField path="session" type="string">
  مفتاح جلسة اختياري لتشغيلات Heartbeat.

- `main` (افتراضي): جلسة الوكيل الرئيسية.
- مفتاح جلسة صريح (انسخه من `openclaw sessions --json` أو [واجهة CLI للجلسات](/ar/cli/sessions)).
- تنسيقات مفاتيح الجلسات: راجع [الجلسات](/ar/concepts/session) و[المجموعات](/ar/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: التسليم إلى آخر قناة خارجية مستخدمة.
- قناة صريحة: أي قناة مهيأة أو معرّف Plugin، مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`.
- `none` (افتراضي): شغّل Heartbeat ولكن **لا تسلّم** خارجيًا.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  يتحكم في سلوك التسليم المباشر/رسائل DM. `allow`: السماح بتسليم Heartbeat المباشر/رسائل DM. `block`: منع تسليم Heartbeat المباشر/رسائل DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  تجاوز اختياري للمستلم (معرّف خاص بالقناة، مثل E.164 لـ WhatsApp أو معرّف دردشة Telegram). لمواضيع/سلاسل Telegram، استخدم `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  معرّف حساب اختياري للقنوات متعددة الحسابات. عند استخدام `target: "last"`، ينطبق معرّف الحساب على آخر قناة تم حلّها إذا كانت تدعم الحسابات؛ وإلا فيتم تجاهله. إذا لم يطابق معرّف الحساب حسابًا مهيأً للقناة التي تم حلّها، يتم تخطي التسليم.

</ParamField>
<ParamField path="prompt" type="string">
  يتجاوز نص الموجه الافتراضي (لا يتم دمجه).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  الحد الأقصى للأحرف المسموح بها بعد `HEARTBEAT_OK` قبل التسليم.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  عند ضبطه على true، يكبت حمولات تحذير أخطاء الأدوات أثناء تشغيل Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  يقيّد تشغيل Heartbeat بنافذة زمنية. كائن يحتوي على `start` (HH:MM، شامل؛ استخدم `00:00` لبداية اليوم)، و`end` (HH:MM غير شامل؛ يُسمح بـ `24:00` لنهاية اليوم)، و`timezone` اختياري.

- عند الحذف أو ضبطه على `"user"`: يستخدم `agents.defaults.userTimezone` إذا كان مضبوطًا، وإلا يرجع إلى المنطقة الزمنية لنظام المضيف.
- `"local"`: يستخدم دائمًا المنطقة الزمنية لنظام المضيف.
- أي معرّف IANA (مثل `America/New_York`): يُستخدم مباشرة؛ وإذا كان غير صالح، يرجع إلى سلوك `"user"` أعلاه.
- يجب ألا يكون `start` و`end` متساويين لنافذة نشطة؛ تُعامل القيم المتساوية كنافذة بلا عرض (دائمًا خارج النافذة).
- خارج النافذة النشطة، يتم تخطي Heartbeats حتى النبضة التالية داخل النافذة.

</ParamField>

## سلوك التسليم

<AccordionGroup>
  <Accordion title="توجيه الجلسة والهدف">
    - تعمل Heartbeats افتراضيًا في جلسة الوكيل الرئيسية (`agent:<id>:<mainKey>`)، أو `global` عندما تكون `session.scope = "global"`. اضبط `session` للتجاوز إلى جلسة قناة محددة (Discord/WhatsApp/إلخ).
    - يؤثر `session` فقط في سياق التشغيل؛ أما التسليم فتتحكم به `target` و`to`.
    - للتسليم إلى قناة/مستلم محدد، اضبط `target` + `to`. مع `target: "last"`، يستخدم التسليم آخر قناة خارجية لتلك الجلسة.
    - تسمح تسليمات Heartbeat افتراضيًا بالأهداف المباشرة/DM. اضبط `directPolicy: "block"` لكبت الإرسال إلى الأهداف المباشرة مع الاستمرار في تشغيل دور Heartbeat.
    - إذا كانت الطابور الرئيسية، أو مسار جلسة الهدف، أو مسار cron، أو مهمة cron نشطة مشغولة، يتم تخطي Heartbeat وإعادة المحاولة لاحقًا.
    - إذا كان `skipWhenBusy: true`، تؤجل مسارات الوكلاء الفرعيين والمسارات المتداخلة تشغيل Heartbeat أيضًا.
    - إذا حُلّ `target` إلى عدم وجود وجهة خارجية، يستمر التشغيل لكن لا تُرسل أي رسالة صادرة.

  </Accordion>
  <Accordion title="الرؤية وسلوك التخطي">
    - إذا كانت `showOk` و`showAlerts` و`useIndicator` كلها معطلة، يتم تخطي التشغيل من البداية باعتباره `reason=alerts-disabled`.
    - إذا كان تسليم التنبيهات وحده معطلًا، يمكن لـ OpenClaw الاستمرار في تشغيل Heartbeat، وتحديث الطوابع الزمنية للمهام المستحقة، واستعادة الطابع الزمني لخمول الجلسة، وكبت حمولة التنبيه الخارجية.
    - إذا كان هدف Heartbeat المحسوم يدعم مؤشر الكتابة، يعرض OpenClaw الكتابة أثناء نشاط تشغيل Heartbeat. يستخدم هذا الهدف نفسه الذي كان Heartbeat سيرسل إليه مخرجات الدردشة، ويُعطل بواسطة `typingMode: "never"`.

  </Accordion>
  <Accordion title="دورة حياة الجلسة والتدقيق">
    - الردود الخاصة بـ Heartbeat فقط **لا** تبقي الجلسة حية. قد تحدّث بيانات Heartbeat الوصفية صف الجلسة، لكن انتهاء الصلاحية بسبب الخمول يستخدم `lastInteractionAt` من آخر رسالة مستخدم/قناة حقيقية، ويستخدم انتهاء الصلاحية اليومي `sessionStartedAt`.
    - يخفي سجل Control UI وWebChat مطالبات Heartbeat وإقرارات OK فقط. يمكن أن يظل نص الجلسة الأساسي محتويًا على تلك الأدوار للتدقيق/إعادة التشغيل.
    - يمكن لـ [مهام الخلفية](/ar/automation/tasks) المنفصلة إدراج حدث نظام في الطابور وإيقاظ Heartbeat عندما ينبغي للجلسة الرئيسية أن تلاحظ شيئًا بسرعة. لا يجعل ذلك الإيقاظ تشغيل Heartbeat مهمة خلفية.

  </Accordion>
</AccordionGroup>

## عناصر التحكم في الرؤية

افتراضيًا، تُكبت إقرارات `HEARTBEAT_OK` بينما يُسلّم محتوى التنبيه. يمكنك ضبط ذلك لكل قناة أو لكل حساب:

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

الأسبقية: لكل حساب ← لكل قناة ← الإعدادات الافتراضية للقناة ← الإعدادات الافتراضية المدمجة.

### وظيفة كل علامة

- `showOk`: ترسل إقرار `HEARTBEAT_OK` عندما يعيد النموذج ردًا يحتوي على OK فقط.
- `showAlerts`: ترسل محتوى التنبيه عندما يعيد النموذج ردًا غير OK.
- `useIndicator`: تصدر أحداث مؤشر لأسطح حالة واجهة المستخدم.

إذا كانت **الثلاثة كلها** false، يتخطى OpenClaw تشغيل Heartbeat بالكامل (بلا استدعاء للنموذج).

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

| الهدف                                    | الإعداد                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| السلوك الافتراضي (OK صامتة، والتنبيهات مفعلة) | _(لا حاجة إلى إعداد)_                                                                     |
| صامت بالكامل (لا رسائل، ولا مؤشر)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| مؤشر فقط (لا رسائل)                      | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs في قناة واحدة فقط                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختياري)

إذا وُجد ملف `HEARTBEAT.md` في مساحة العمل، فإن المطالبة الافتراضية تطلب من الوكيل قراءته. اعتبره "قائمة تحقق Heartbeat" الخاصة بك: صغيرة، وثابتة، وآمنة للإدراج كل 30 دقيقة.

في التشغيلات العادية، لا يُحقن `HEARTBEAT.md` إلا عندما تكون إرشادات Heartbeat مفعلة للوكيل الافتراضي. تعطيل وتيرة Heartbeat باستخدام `0m` أو ضبط `includeSystemPromptSection: false` يحذفه من سياق التمهيد العادي.

إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (أسطر فارغة فقط ورؤوس markdown مثل `# Heading`)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API. يُبلّغ عن ذلك التخطي باعتباره `reason=empty-heartbeat-file`. إذا كان الملف مفقودًا، يستمر Heartbeat في التشغيل ويقرر النموذج ما يجب فعله.

اجعله صغيرًا جدًا (قائمة تحقق قصيرة أو تذكيرات) لتجنب تضخم المطالبة.

مثال `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### كتل `tasks:`

يدعم `HEARTBEAT.md` أيضًا كتلة `tasks:` منظمة صغيرة للفحوصات القائمة على الفواصل الزمنية داخل Heartbeat نفسه.

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
    - يحلل OpenClaw كتلة `tasks:` ويفحص كل مهمة وفق `interval` الخاص بها.
    - لا تُدرج في مطالبة Heartbeat لتلك النبضة إلا المهام **المستحقة**.
    - إذا لم تكن هناك مهام مستحقة، يتم تخطي Heartbeat بالكامل (`reason=no-tasks-due`) لتجنب استدعاء نموذج مهدور.
    - يُحفظ المحتوى غير المتعلق بالمهام في `HEARTBEAT.md` ويُلحق كسياق إضافي بعد قائمة المهام المستحقة.
    - تُخزن طوابع آخر تشغيل للمهام في حالة الجلسة (`heartbeatTaskState`)، لذلك تبقى الفواصل الزمنية بعد عمليات إعادة التشغيل العادية.
    - لا تُقدّم طوابع المهام الزمنية إلا بعد أن يكمل تشغيل Heartbeat مسار الرد العادي. لا تضع تشغيلات `empty-heartbeat-file` / `no-tasks-due` المتخطاة علامة على المهام كمكتملة.

  </Accordion>
</AccordionGroup>

يكون وضع المهام مفيدًا عندما تريد أن يحتوي ملف Heartbeat واحد على عدة فحوصات دورية دون دفع تكلفة تشغيلها كلها في كل نبضة.

### هل يمكن للوكيل تحديث HEARTBEAT.md؟

نعم — إذا طلبت منه ذلك.

`HEARTBEAT.md` هو مجرد ملف عادي في مساحة عمل الوكيل، لذلك يمكنك أن تقول للوكيل (في دردشة عادية) شيئًا مثل:

- "حدّث `HEARTBEAT.md` لإضافة فحص تقويم يومي."
- "أعد كتابة `HEARTBEAT.md` ليكون أقصر ومركزًا على متابعات صندوق الوارد."

إذا أردت أن يحدث هذا بشكل استباقي، يمكنك أيضًا تضمين سطر صريح في مطالبة Heartbeat مثل: "إذا أصبحت قائمة التحقق قديمة، فحدّث HEARTBEAT.md بقائمة أفضل."

<Warning>
لا تضع الأسرار (مفاتيح API، أرقام الهواتف، الرموز الخاصة) في `HEARTBEAT.md` — يصبح جزءًا من سياق المطالبة.
</Warning>

## إيقاظ يدوي (عند الطلب)

يمكنك إدراج حدث نظام في الطابور وتشغيل Heartbeat فوري باستخدام:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

إذا كان لدى عدة وكلاء `heartbeat` مهيأ، فإن الإيقاظ اليدوي يشغل كل Heartbeats الخاصة بهؤلاء الوكلاء فورًا.

استخدم `--mode next-heartbeat` للانتظار حتى النبضة المجدولة التالية.

## تسليم الاستدلال (اختياري)

افتراضيًا، لا تسلّم Heartbeats إلا حمولة "الإجابة" النهائية.

إذا أردت الشفافية، ففعّل:

- `agents.defaults.heartbeat.includeReasoning: true`

عند التفعيل، ستسلّم Heartbeats أيضًا رسالة منفصلة مسبوقة بـ `Reasoning:` (بالشكل نفسه مثل `/reasoning on`). يمكن أن يكون هذا مفيدًا عندما يدير الوكيل عدة جلسات/بيئات codex وتريد رؤية سبب قراره بإرسال تنبيه إليك — لكنه قد يسرّب أيضًا تفاصيل داخلية أكثر مما تريد. يُفضّل إبقاؤه معطلًا في دردشات المجموعات.

## الوعي بالتكلفة

تشغّل Heartbeats أدوار وكيل كاملة. الفواصل الزمنية الأقصر تستهلك رموزًا أكثر. لتقليل التكلفة:

- استخدم `isolatedSession: true` لتجنب إرسال سجل المحادثة الكامل (من نحو 100 ألف رمز إلى نحو 2-5 آلاف لكل تشغيل).
- استخدم `lightContext: true` لقصر ملفات التمهيد على `HEARTBEAT.md` فقط.
- اضبط `model` أرخص (مثل `ollama/llama3.2:1b`).
- أبقِ `HEARTBEAT.md` صغيرًا.
- استخدم `target: "none"` إذا كنت تريد تحديثات حالة داخلية فقط.

## فيضان السياق بعد Heartbeat

إذا ترك Heartbeat سابق جلسة موجودة على نموذج محلي أصغر، مثل نموذج Ollama بنافذة 32k، وأبلغ دور الجلسة الرئيسية التالي عن فيضان في السياق، فأعد ضبط نموذج تشغيل الجلسة إلى النموذج الأساسي المهيأ. تنبه رسالة إعادة الضبط في OpenClaw إلى ذلك عندما يطابق آخر نموذج تشغيل `heartbeat.model` المهيأ.

تحافظ Heartbeats الحالية على نموذج التشغيل الموجود للجلسة المشتركة بعد اكتمال التشغيل. لا يزال بإمكانك استخدام `isolatedSession: true` لتشغيل Heartbeats في جلسة جديدة، ودمجه مع `lightContext: true` لأصغر مطالبة، أو اختيار نموذج Heartbeat بنافذة سياق كبيرة بما يكفي للجلسة المشتركة.

## ذات صلة

- [الأتمتة والمهام](/ar/automation) — جميع آليات الأتمتة بنظرة واحدة
- [مهام الخلفية](/ar/automation/tasks) — كيف يُتتبع العمل المنفصل
- [المنطقة الزمنية](/ar/concepts/timezone) — كيف تؤثر المنطقة الزمنية في جدولة Heartbeat
- [استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting) — تصحيح مشكلات الأتمتة
