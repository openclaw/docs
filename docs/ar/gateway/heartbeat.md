---
read_when:
    - تعديل وتيرة Heartbeat أو المراسلة
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Heartbeat
summary: رسائل استطلاع Heartbeat وقواعد الإشعارات
title: Heartbeat
x-i18n:
    generated_at: "2026-06-27T17:38:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat مقابل Cron؟** راجع [الأتمتة](/ar/automation) للحصول على إرشادات حول وقت استخدام كل منهما.
</Note>

يشغّل Heartbeat **دورات وكيل دورية** في الجلسة الرئيسية حتى يتمكن النموذج من إظهار أي شيء يحتاج إلى انتباهك دون إغراقك بالرسائل.

Heartbeat هو دورة مجدولة في الجلسة الرئيسية — ولا ينشئ سجلات [مهمة خلفية](/ar/automation/tasks). سجلات المهام مخصصة للعمل المنفصل (تشغيلات ACP، الوكلاء الفرعيون، وظائف Cron المعزولة).

استكشاف الأخطاء وإصلاحها: [المهام المجدولة](/ar/automation/cron-jobs#troubleshooting)

## بدء سريع (للمبتدئين)

<Steps>
  <Step title="اختر وتيرة">
    اترك Heartbeat مفعلا (القيمة الافتراضية هي `30m`، أو `1h` لمصادقة Anthropic OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI) أو اضبط وتيرتك الخاصة.
  </Step>
  <Step title="أضف HEARTBEAT.md (اختياري)">
    أنشئ قائمة تحقق صغيرة `HEARTBEAT.md` أو كتلة `tasks:` في مساحة عمل الوكيل.
  </Step>
  <Step title="قرر إلى أين يجب أن تذهب رسائل Heartbeat">
    `target: "none"` هي القيمة الافتراضية؛ اضبط `target: "last"` للتوجيه إلى آخر جهة اتصال.
  </Step>
  <Step title="ضبط اختياري">
    - فعّل تسليم استدلال Heartbeat للشفافية.
    - استخدم سياق تمهيد خفيفا إذا كانت تشغيلات Heartbeat لا تحتاج إلا إلى `HEARTBEAT.md`.
    - فعّل الجلسات المعزولة لتجنب إرسال سجل المحادثة الكامل في كل Heartbeat.
    - قيّد Heartbeat بساعات النشاط (التوقيت المحلي).

  </Step>
</Steps>

مثال إعدادات:

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
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## القيم الافتراضية

- الفاصل الزمني: `30m` (أو `1h` عندما يكون وضع المصادقة المكتشف هو مصادقة Anthropic OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI). اضبط `agents.defaults.heartbeat.every` أو `agents.list[].heartbeat.every` لكل وكيل؛ استخدم `0m` للتعطيل.
- نص الموجه (قابل للضبط عبر `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- المهلة: تستخدم دورات Heartbeat غير المضبوطة `agents.defaults.timeoutSeconds` عند ضبطها. وإلا، فإنها تستخدم وتيرة Heartbeat بحد أقصى 600 ثانية. اضبط `agents.defaults.heartbeat.timeoutSeconds` أو `agents.list[].heartbeat.timeoutSeconds` لكل وكيل لعمل Heartbeat أطول.
- يرسل موجه Heartbeat **حرفيا** كرسالة المستخدم. يتضمن موجه النظام قسما باسم "Heartbeat" فقط عندما تكون Heartbeat مفعلة للوكيل الافتراضي، ويتم تعليم التشغيل داخليا.
- عند تعطيل Heartbeat باستخدام `0m`، تحذف التشغيلات العادية أيضا `HEARTBEAT.md` من سياق التمهيد حتى لا يرى النموذج تعليمات خاصة بـ Heartbeat فقط.
- يتم التحقق من ساعات النشاط (`heartbeat.activeHours`) في المنطقة الزمنية المضبوطة. خارج النافذة، يتم تخطي Heartbeat حتى النبضة التالية داخل النافذة.
- تؤجل Heartbeat تلقائيا أثناء كون عمل Cron نشطا أو في قائمة الانتظار. اضبط `heartbeat.skipWhenBusy: true` لتأجيل وكيل أيضا على مسارات الوكيل الفرعي المرتبطة بمفتاح جلسته أو مسارات الأوامر المتداخلة الخاصة به؛ لم تعد الوكلاء النظيرة تتوقف لمجرد أن وكيلا آخر لديه عمل وكيل فرعي قيد التنفيذ.

## الغرض من موجه Heartbeat

الموجه الافتراضي واسع عمدا:

- **المهام الخلفية**: "النظر في المهام المعلقة" يدفع الوكيل إلى مراجعة المتابعات (صندوق الوارد، التقويم، التذكيرات، العمل في قائمة الانتظار) وإظهار أي شيء عاجل.
- **اطمئنان بشري**: "الاطمئنان أحيانا على الإنسان أثناء النهار" يدفع رسالة خفيفة من حين لآخر مثل "هل تحتاج إلى شيء؟"، لكنه يتجنب الإزعاج ليلا باستخدام منطقتك الزمنية المحلية المضبوطة (راجع [المنطقة الزمنية](/ar/concepts/timezone)).

يمكن لـ Heartbeat التفاعل مع [المهام الخلفية](/ar/automation/tasks) المكتملة، لكن تشغيل Heartbeat نفسه لا ينشئ سجل مهمة.

إذا أردت أن تنفذ Heartbeat شيئا محددا جدا (مثلا "تحقق من إحصاءات Gmail PubSub" أو "تحقق من صحة Gateway")، فاضبط `agents.defaults.heartbeat.prompt` (أو `agents.list[].heartbeat.prompt`) على نص مخصص (يرسل حرفيا).

## عقد الاستجابة

- إذا لم يحتج أي شيء إلى انتباه، فرد بـ **`HEARTBEAT_OK`**.
- قد تستدعي تشغيلات Heartbeat القادرة على استخدام الأدوات بدلا من ذلك `heartbeat_respond` مع `notify: false` لعدم وجود تحديث مرئي، أو `notify: true` مع `notificationText` لتنبيه. عند وجودها، تكون استجابة الأداة المنظمة لها الأولوية على بديل النص.
- أثناء تشغيلات Heartbeat، يتعامل OpenClaw مع `HEARTBEAT_OK` كإقرار عندما يظهر في **بداية أو نهاية** الرد. تتم إزالة الرمز ويسقط الرد إذا كان المحتوى المتبقي **≤ `ackMaxChars`** (الافتراضي: 300).
- إذا ظهر `HEARTBEAT_OK` في **وسط** رد، فلا يعامل معاملة خاصة.
- للتنبيهات، **لا** تضمّن `HEARTBEAT_OK`؛ أعد نص التنبيه فقط.

خارج Heartbeat، تتم إزالة `HEARTBEAT_OK` العارض في بداية/نهاية رسالة وتسجيله؛ وتسقط الرسالة التي تكون فقط `HEARTBEAT_OK`.

## الإعدادات

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
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

### النطاق والأولوية

- يضبط `agents.defaults.heartbeat` سلوك Heartbeat العام.
- يدمج `agents.list[].heartbeat` فوقه؛ إذا كان لدى أي وكيل كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغلون Heartbeat.
- يضبط `channels.defaults.heartbeat` قيم الرؤية الافتراضية لكل القنوات.
- يتجاوز `channels.<channel>.heartbeat` قيم القناة الافتراضية.
- يتجاوز `channels.<channel>.accounts.<id>.heartbeat` (قنوات متعددة الحسابات) إعدادات كل قناة.

### Heartbeat لكل وكيل

إذا كان أي إدخال `agents.list[]` يتضمن كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغلون Heartbeat. تدمج كتلة كل وكيل فوق `agents.defaults.heartbeat` (حتى تتمكن من ضبط القيم الافتراضية المشتركة مرة واحدة وتجاوزها لكل وكيل).

مثال: وكيلان، الوكيل الثاني فقط يشغل Heartbeat.

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

خارج هذه النافذة (قبل 9 صباحا أو بعد 10 مساء بتوقيت الشرق)، يتم تخطي Heartbeat. ستعمل النبضة المجدولة التالية داخل النافذة بشكل طبيعي.

### إعداد 24/7

إذا أردت أن تعمل Heartbeat طوال اليوم، فاستخدم أحد هذين النمطين:

- احذف `activeHours` بالكامل (لا يوجد قيد نافذة زمنية؛ هذا هو السلوك الافتراضي).
- اضبط نافذة ليوم كامل: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
لا تضبط وقتي `start` و`end` نفسيهما (على سبيل المثال من `08:00` إلى `08:00`). يعامل ذلك كنافذة بعرض صفري، لذلك يتم تخطي Heartbeat دائما.
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
  عند التفعيل، يتم أيضا تسليم رسالة `Thinking` المنفصلة عند توفرها (بالشكل نفسه مثل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  عند الضبط على true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  عند الضبط على true، يعمل كل Heartbeat في جلسة جديدة دون سجل محادثة سابق. يستخدم نمط العزل نفسه مثل Cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat بشكل كبير. ادمجه مع `lightContext: true` لتحقيق أقصى توفير. لا يزال توجيه التسليم يستخدم سياق الجلسة الرئيسية.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  عند الضبط على true، تؤجل تشغيلات Heartbeat على مسارات الانشغال الإضافية لذلك الوكيل: وكيله الفرعي المرتبط بمفتاح الجلسة الخاص به أو عمل الأوامر المتداخل. تؤجل مسارات Cron دائما Heartbeat، حتى دون هذه العلامة، بحيث لا تشغل مضيفات النماذج المحلية موجهات Cron وHeartbeat في الوقت نفسه.
</ParamField>
<ParamField path="session" type="string">
  مفتاح جلسة اختياري لتشغيلات Heartbeat.

- `main` (الافتراضي): الجلسة الرئيسية للوكيل.
- مفتاح جلسة صريح (انسخه من `openclaw sessions --json` أو من [CLI الجلسات](/ar/cli/sessions)).
- تنسيقات مفاتيح الجلسة: راجع [الجلسات](/ar/concepts/session) و[المجموعات](/ar/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: التسليم إلى آخر قناة خارجية مستخدمة.
- قناة صريحة: أي قناة مضبوطة أو معرف Plugin، على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`.
- `none` (الافتراضي): شغّل Heartbeat لكن **لا تسلم** خارجيا.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  يتحكم في سلوك التسليم المباشر/DM. `allow`: السماح بتسليم Heartbeat المباشر/DM. `block`: منع التسليم المباشر/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  تجاوز اختياري للمستلم (معرف خاص بالقناة، مثل E.164 لـ WhatsApp أو معرف محادثة Telegram). لمواضيع/سلاسل Telegram، استخدم `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  معرّف حساب اختياري للقنوات متعددة الحسابات. عند `target: "last"`، ينطبق معرّف الحساب على آخر قناة محلولة إذا كانت تدعم الحسابات؛ وإلا فيتم تجاهله. إذا لم يطابق معرّف الحساب حسابًا مهيأً للقناة المحلولة، يتم تخطي التسليم.

</ParamField>
<ParamField path="prompt" type="string">
  يتجاوز متن الموجه الافتراضي (لا يتم دمجه).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  الحد الأقصى للأحرف المسموح بها بعد `HEARTBEAT_OK` قبل التسليم.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  عند الضبط على true، يكتم حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  الحد الأقصى للثواني المسموح بها لدورة وكيل Heartbeat قبل إجهاضها. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds` عند ضبطه، وإلا فسيتم استخدام إيقاع Heartbeat بحد أقصى 600 ثانية.

</ParamField>
<ParamField path="activeHours" type="object">
  يقيّد تشغيلات Heartbeat بنافذة زمنية. كائن يحتوي على `start` (HH:MM، شامل؛ استخدم `00:00` لبداية اليوم)، و`end` (HH:MM غير شامل؛ يُسمح بـ `24:00` لنهاية اليوم)، و`timezone` اختياري.

- محذوف أو `"user"`: يستخدم `agents.defaults.userTimezone` لديك إذا كان مضبوطًا، وإلا يعود إلى المنطقة الزمنية لنظام المضيف.
- `"local"`: يستخدم دائمًا المنطقة الزمنية لنظام المضيف.
- أي معرّف IANA (مثل `America/New_York`): يُستخدم مباشرة؛ وإذا كان غير صالح، يعود إلى سلوك `"user"` أعلاه.
- يجب ألا تكون قيمتا `start` و`end` متساويتين لنافذة نشطة؛ تُعامل القيم المتساوية كنافذة عديمة العرض (خارج النافذة دائمًا).
- خارج النافذة النشطة، يتم تخطي Heartbeat حتى النبضة التالية داخل النافذة.

</ParamField>

## سلوك التسليم

<AccordionGroup>
  <Accordion title="Session and target routing">
    - تعمل Heartbeats في الجلسة الرئيسية للوكيل افتراضيًا (`agent:<id>:<mainKey>`)، أو `global` عندما تكون `session.scope = "global"`. اضبط `session` للتجاوز إلى جلسة قناة محددة (Discord/WhatsApp/إلخ).
    - يؤثر `session` فقط في سياق التشغيل؛ يتحكم `target` و`to` في التسليم.
    - للتسليم إلى قناة/مستلم محدد، اضبط `target` + `to`. مع `target: "last"`، يستخدم التسليم آخر قناة خارجية لتلك الجلسة.
    - تسمح تسليمات Heartbeat بالأهداف المباشرة/DM افتراضيًا. اضبط `directPolicy: "block"` لكتم الإرسالات إلى الأهداف المباشرة مع استمرار تشغيل دورة Heartbeat.
    - إذا كان الطابور الرئيسي، أو مسار جلسة الهدف، أو مسار Cron، أو مهمة Cron نشطة مشغولًا، يتم تخطي Heartbeat وإعادة المحاولة لاحقًا.
    - إذا كان `skipWhenBusy: true`، فإن الوكيل الفرعي المرتبط بمفتاح جلسة هذا الوكيل والمسارات المتداخلة تؤجل أيضًا تشغيلات Heartbeat. لا تؤجل المسارات المشغولة لوكلاء آخرين هذا الوكيل.
    - إذا لم يُحل `target` إلى وجهة خارجية، فسيظل التشغيل يحدث لكن لا تُرسل رسالة صادرة.

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - إذا كانت `showOk` و`showAlerts` و`useIndicator` كلها معطلة، يتم تخطي التشغيل مسبقًا كـ `reason=alerts-disabled`.
    - إذا كان تسليم التنبيه فقط معطلًا، يستطيع OpenClaw مع ذلك تشغيل Heartbeat، وتحديث الطوابع الزمنية للمهام المستحقة، واستعادة الطابع الزمني لخمول الجلسة، وكتم حمولة التنبيه الخارجية.
    - إذا كان هدف Heartbeat المحلول يدعم الكتابة، يعرض OpenClaw حالة الكتابة أثناء نشاط تشغيل Heartbeat. يستخدم هذا الهدف نفسه الذي كان Heartbeat سيرسل إليه إخراج الدردشة، ويتم تعطيله بواسطة `typingMode: "never"`.

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - لا تُبقي ردود Heartbeat فقط الجلسة حية. قد تحدّث بيانات Heartbeat الوصفية صف الجلسة، لكن انتهاء الخمول يستخدم `lastInteractionAt` من آخر رسالة مستخدم/قناة حقيقية، ويستخدم انتهاء الصلاحية اليومي `sessionStartedAt`.
    - يخفي سجل Control UI وWebChat موجهات Heartbeat وإقرارات OK فقط. قد يظل نص الجلسة الأساسي يحتوي على تلك الدورات لأغراض التدقيق/إعادة التشغيل.
    - يمكن لـ [مهام الخلفية](/ar/automation/tasks) المنفصلة إدراج حدث نظام وإيقاظ Heartbeat عندما يجب أن تلاحظ الجلسة الرئيسية شيئًا بسرعة. لا يجعل ذلك الإيقاظ تشغيل Heartbeat مهمة خلفية.

  </Accordion>
</AccordionGroup>

## عناصر التحكم في الظهور

افتراضيًا، تُكتم إقرارات `HEARTBEAT_OK` بينما يتم تسليم محتوى التنبيه. يمكنك ضبط هذا لكل قناة أو لكل حساب:

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
- `showAlerts`: يرسل محتوى التنبيه عندما يعيد النموذج ردًا ليس OK.
- `useIndicator`: يصدر أحداث مؤشر لأسطح حالة واجهة المستخدم.

إذا كانت **الثلاثة كلها** false، يتخطى OpenClaw تشغيل Heartbeat بالكامل (لا توجد استدعاء نموذج).

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

| الهدف                                    | الإعداد                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| السلوك الافتراضي (OK صامتة، التنبيهات مفعلة) | _(لا حاجة إلى إعداد)_                                                                    |
| صامت بالكامل (لا رسائل، لا مؤشر)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| مؤشر فقط (لا رسائل)                      | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs في قناة واحدة فقط                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختياري)

إذا كان ملف `HEARTBEAT.md` موجودًا في مساحة العمل، فإن الموجه الافتراضي يطلب من الوكيل قراءته. فكر فيه كأنه "قائمة تحقق Heartbeat" الخاصة بك: صغيرة، ومستقرة، وآمنة للنظر فيها كل 30 دقيقة.

في التشغيلات العادية، لا يتم حقن `HEARTBEAT.md` إلا عندما تكون إرشادات Heartbeat مفعلة للوكيل الافتراضي. يؤدي تعطيل إيقاع Heartbeat باستخدام `0m` أو ضبط `includeSystemPromptSection: false` إلى حذفه من سياق التمهيد العادي.

في حزمة Codex الأصلية، لا يتم حقن محتوى `HEARTBEAT.md` في الدورة. إذا كان الملف موجودًا ويحتوي على محتوى غير مسافات بيضاء، تشير تعليمات وضع التعاون في Heartbeat إلى الملف وتطلب منه القراءة قبل المتابعة.

إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (أسطر فارغة فقط، أو تعليقات Markdown/HTML، أو عناوين Markdown مثل `# Heading`، أو علامات سياج، أو نماذج قوائم تحقق فارغة)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API. يتم الإبلاغ عن ذلك التخطي كـ `reason=empty-heartbeat-file`. إذا كان الملف مفقودًا، يظل Heartbeat يعمل ويقرر النموذج ما يجب فعله.

اجعله صغيرًا جدًا (قائمة تحقق قصيرة أو تذكيرات) لتجنب تضخم الموجه.

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
  <Accordion title="Behavior">
    - يحلل OpenClaw كتلة `tasks:` ويفحص كل مهمة مقابل `interval` الخاص بها.
    - لا تُدرج في موجه Heartbeat لتلك النبضة إلا المهام **المستحقة**.
    - إذا لم تكن هناك مهام مستحقة، يتم تخطي Heartbeat بالكامل (`reason=no-tasks-due`) لتجنب استدعاء نموذج مهدور.
    - يتم الحفاظ على المحتوى غير المرتبط بالمهام في `HEARTBEAT.md` وإلحاقه كسياق إضافي بعد قائمة المهام المستحقة.
    - تُخزّن الطوابع الزمنية لآخر تشغيل للمهام في حالة الجلسة (`heartbeatTaskState`)، لذلك تبقى الفواصل الزمنية بعد عمليات إعادة التشغيل العادية.
    - لا يتم تقديم طوابع المهام الزمنية إلا بعد اكتمال تشغيل Heartbeat عبر مسار الرد العادي. لا تضع تشغيلات `empty-heartbeat-file` / `no-tasks-due` المتخطاة علامة اكتمال على المهام.

  </Accordion>
</AccordionGroup>

وضع المهام مفيد عندما تريد أن يحتوي ملف Heartbeat واحد على عدة فحوصات دورية دون الدفع مقابلها كلها في كل نبضة.

### هل يستطيع الوكيل تحديث HEARTBEAT.md؟

نعم — إذا طلبت منه ذلك.

`HEARTBEAT.md` مجرد ملف عادي في مساحة عمل الوكيل، لذا يمكنك إخبار الوكيل (في دردشة عادية) بشيء مثل:

- "حدّث `HEARTBEAT.md` لإضافة فحص يومي للتقويم."
- "أعد كتابة `HEARTBEAT.md` ليكون أقصر ويركز على متابعات البريد الوارد."

إذا أردت أن يحدث هذا استباقيًا، يمكنك أيضًا تضمين سطر صريح في موجه Heartbeat لديك مثل: "إذا أصبحت قائمة التحقق قديمة، فحدّث HEARTBEAT.md بقائمة أفضل."

<Warning>
لا تضع أسرارًا (مفاتيح API، أرقام هواتف، رموز خاصة) في `HEARTBEAT.md` — فهو يصبح جزءًا من سياق الموجه.
</Warning>

## إيقاظ يدوي (عند الطلب)

يمكنك إدراج حدث نظام وتشغيل Heartbeat فوري باستخدام:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

إذا كان لدى عدة وكلاء `heartbeat` مهيأ، فإن الإيقاظ اليدوي يشغل كل Heartbeats لهؤلاء الوكلاء فورًا.

استخدم `--mode next-heartbeat` للانتظار حتى النبضة المجدولة التالية.

## تسليم الاستدلال (اختياري)

افتراضيًا، لا تسلّم Heartbeats إلا حمولة "الإجابة" النهائية.

إذا أردت الشفافية، فعّل:

- `agents.defaults.heartbeat.includeReasoning: true`

عند التفعيل، ستسلّم Heartbeats أيضًا رسالة منفصلة مسبوقة بـ `Thinking` (بالشكل نفسه مثل `/reasoning on`). يمكن أن يكون هذا مفيدًا عندما يدير الوكيل عدة جلسات/نسخ Codex وتريد معرفة سبب قراره مراسلتك — لكنه قد يسرّب أيضًا تفاصيل داخلية أكثر مما تريد. يُفضّل إبقاؤه معطلًا في الدردشات الجماعية.

## الوعي بالتكلفة

تعمل Heartbeats كدورات وكيل كاملة. الفواصل الزمنية الأقصر تستهلك رموزًا أكثر. لتقليل التكلفة:

- استخدم `isolatedSession: true` لتجنب إرسال سجل المحادثة الكامل (~100K رمز إلى ~2-5K لكل تشغيل).
- استخدم `lightContext: true` لقصر ملفات التمهيد على `HEARTBEAT.md` فقط.
- اضبط `model` أرخص (مثل `ollama/llama3.2:1b`).
- أبقِ `HEARTBEAT.md` صغيرًا.
- استخدم `target: "none"` إذا كنت تريد تحديثات حالة داخلية فقط.

## فيضان السياق بعد Heartbeat

إذا ترك Heartbeat سابقًا جلسة موجودة على نموذج محلي أصغر، على سبيل المثال نموذج Ollama بنافذة 32k، وأبلغت دورة الجلسة الرئيسية التالية عن فيضان في السياق، فأعد ضبط نموذج وقت تشغيل الجلسة إلى النموذج الأساسي المهيأ. تذكر رسالة إعادة الضبط في OpenClaw هذا عندما يطابق آخر نموذج وقت تشغيل `heartbeat.model` المهيأ.

تحافظ Heartbeats الحالية على نموذج وقت التشغيل الموجود للجلسة المشتركة بعد اكتمال التشغيل. لا يزال بإمكانك استخدام `isolatedSession: true` لتشغيل Heartbeats في جلسة جديدة، أو دمجه مع `lightContext: true` لأصغر موجه، أو اختيار نموذج Heartbeat بنافذة سياق كبيرة بما يكفي للجلسة المشتركة.

## ذو صلة

- [الأتمتة](/ar/automation) — جميع آليات الأتمتة بنظرة سريعة
- [المهام الخلفية](/ar/automation/tasks) — كيف يتم تتبّع العمل المنفصل
- [المنطقة الزمنية](/ar/concepts/timezone) — كيف تؤثر المنطقة الزمنية في جدولة Heartbeat
- [استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting) — تصحيح مشكلات الأتمتة
