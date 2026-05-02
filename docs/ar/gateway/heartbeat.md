---
read_when:
    - ضبط وتيرة Heartbeat أو الرسائل
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Heartbeat
summary: رسائل استقصاء Heartbeat وقواعد الإشعارات
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T07:27:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8198c74e2712c7ed9d34c41bad7c4e9be62043e8755cb4c9a60649222e04e37
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat مقابل cron؟** راجع [الأتمتة والمهام](/ar/automation) للحصول على إرشادات حول وقت استخدام كل منهما.
</Note>

يشغّل Heartbeat **دورات دورية للوكيل** في الجلسة الرئيسية حتى يتمكن النموذج من إبراز أي شيء يحتاج إلى انتباهك دون إغراقك بالرسائل.

Heartbeat هو دورة مجدولة في الجلسة الرئيسية — ولا ينشئ سجلات [مهمة خلفية](/ar/automation/tasks). سجلات المهام مخصصة للعمل المنفصل (تشغيلات ACP، والوكلاء الفرعيين، ومهام cron المعزولة).

استكشاف الأخطاء وإصلاحها: [المهام المجدولة](/ar/automation/cron-jobs#troubleshooting)

## البدء السريع (للمبتدئين)

<Steps>
  <Step title="اختر وتيرة">
    اترك Heartbeat مفعّلًا (الافتراضي هو `30m`، أو `1h` لمصادقة Anthropic عبر OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI) أو عيّن وتيرتك الخاصة.
  </Step>
  <Step title="أضف HEARTBEAT.md (اختياري)">
    أنشئ قائمة تحقق صغيرة `HEARTBEAT.md` أو كتلة `tasks:` في مساحة عمل الوكيل.
  </Step>
  <Step title="حدد أين يجب أن تذهب رسائل Heartbeat">
    `target: "none"` هو الافتراضي؛ عيّن `target: "last"` للتوجيه إلى آخر جهة اتصال.
  </Step>
  <Step title="ضبط اختياري">
    - فعّل تسليم استدلال Heartbeat للشفافية.
    - استخدم سياق تمهيد خفيفًا إذا كانت تشغيلات Heartbeat تحتاج فقط إلى `HEARTBEAT.md`.
    - فعّل الجلسات المعزولة لتجنب إرسال سجل المحادثة الكامل مع كل Heartbeat.
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

- الفاصل الزمني: `30m` (أو `1h` عندما يكون وضع المصادقة المكتشف هو مصادقة Anthropic عبر OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI). عيّن `agents.defaults.heartbeat.every` أو `agents.list[].heartbeat.every` لكل وكيل؛ استخدم `0m` للتعطيل.
- نص المطالبة (قابل للتكوين عبر `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- تُرسل مطالبة Heartbeat **حرفيًا** كرسالة المستخدم. تتضمن مطالبة النظام قسم "Heartbeat" فقط عند تفعيل Heartbeat للوكيل الافتراضي، وتُعلَّم عملية التشغيل داخليًا.
- عند تعطيل Heartbeat باستخدام `0m`، تحذف التشغيلات العادية أيضًا `HEARTBEAT.md` من سياق التمهيد حتى لا يرى النموذج تعليمات مخصصة لـ Heartbeat فقط.
- تُفحص ساعات النشاط (`heartbeat.activeHours`) في المنطقة الزمنية المكوّنة. خارج النافذة، تُتخطى Heartbeat حتى النبضة التالية داخل النافذة.
- يؤجل Heartbeat تلقائيًا أثناء كون عمل cron نشطًا أو في قائمة الانتظار. عيّن `heartbeat.skipWhenBusy: true` للتأجيل أيضًا في مسارات الانشغال الإضافية (عمل وكيل فرعي أو أمر متداخل)؛ يفيد ذلك مع Ollama المحلي وغيره من مضيفي وقت التشغيل الواحد ذوي الموارد المحدودة.

## الغرض من مطالبة Heartbeat

المطالبة الافتراضية واسعة عمدًا:

- **المهام الخلفية**: عبارة "Consider outstanding tasks" تدفع الوكيل إلى مراجعة المتابعات (البريد الوارد، التقويم، التذكيرات، الأعمال في قائمة الانتظار) وإبراز أي شيء عاجل.
- **الاطمئنان على الإنسان**: عبارة "Checkup sometimes on your human during day time" تدفع إلى رسالة خفيفة من حين لآخر مثل "هل تحتاج إلى شيء؟"، لكنها تتجنب الإزعاج ليلًا باستخدام منطقتك الزمنية المحلية المكوّنة (راجع [المنطقة الزمنية](/ar/concepts/timezone)).

يمكن لـ Heartbeat التفاعل مع [المهام الخلفية](/ar/automation/tasks) المكتملة، لكن تشغيل Heartbeat نفسه لا ينشئ سجل مهمة.

إذا أردت من Heartbeat تنفيذ شيء محدد جدًا (مثل "فحص إحصاءات Gmail PubSub" أو "التحقق من صحة Gateway")، فعيّن `agents.defaults.heartbeat.prompt` (أو `agents.list[].heartbeat.prompt`) إلى نص مخصص (يُرسل حرفيًا).

## عقد الاستجابة

- إذا لم يكن هناك ما يحتاج إلى انتباه، فاردد **`HEARTBEAT_OK`**.
- قد تستدعي تشغيلات Heartbeat القادرة على استخدام الأدوات بدلًا من ذلك `heartbeat_respond` مع `notify: false` عند عدم وجود تحديث مرئي، أو `notify: true` مع `notificationText` لتنبيه. عند وجودها، تكون استجابة الأداة المنظمة لها الأولوية على النص الاحتياطي.
- أثناء تشغيلات Heartbeat، يتعامل OpenClaw مع `HEARTBEAT_OK` كإقرار عندما يظهر في **بداية أو نهاية** الرد. يُزال الرمز ويُسقط الرد إذا كان المحتوى المتبقي **≤ `ackMaxChars`** (الافتراضي: 300).
- إذا ظهر `HEARTBEAT_OK` في **منتصف** الرد، فلا يُعامل معاملة خاصة.
- للتنبيهات، **لا** تضمّن `HEARTBEAT_OK`؛ أرجع نص التنبيه فقط.

خارج Heartbeat، يُزال `HEARTBEAT_OK` العارض في بداية/نهاية الرسالة ويُسجل؛ وتُسقط الرسالة التي تحتوي فقط على `HEARTBEAT_OK`.

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

### النطاق والأسبقية

- يحدد `agents.defaults.heartbeat` سلوك Heartbeat العام.
- يُدمج `agents.list[].heartbeat` فوقه؛ إذا كان لدى أي وكيل كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغّلون Heartbeat.
- يحدد `channels.defaults.heartbeat` الإعدادات الافتراضية للظهور لكل القنوات.
- يتجاوز `channels.<channel>.heartbeat` إعدادات القناة الافتراضية.
- يتجاوز `channels.<channel>.accounts.<id>.heartbeat` (القنوات متعددة الحسابات) إعدادات كل قناة.

### Heartbeat لكل وكيل

إذا كان أي إدخال في `agents.list[]` يتضمن كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغلون Heartbeat. تندمج الكتلة الخاصة بكل وكيل فوق `agents.defaults.heartbeat` (بحيث يمكنك ضبط الإعدادات الافتراضية المشتركة مرة واحدة وتجاوزها لكل وكيل).

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

خارج هذه النافذة (قبل 9 صباحًا أو بعد 10 مساءً بتوقيت الشرق الأمريكي)، يتم تخطي Heartbeat. سيعمل النبض المجدول التالي داخل النافذة بشكل طبيعي.

### إعداد 24/7

إذا كنت تريد تشغيل Heartbeat طوال اليوم، فاستخدم أحد هذه الأنماط:

- احذف `activeHours` بالكامل (لا يوجد تقييد بنافذة زمنية؛ هذا هو السلوك الافتراضي).
- اضبط نافذة يوم كامل: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
لا تضبط وقت `start` و`end` نفسه (مثلًا من `08:00` إلى `08:00`). يُعامل ذلك كنافذة بعرض صفري، لذلك يتم تخطي Heartbeat دائمًا.
</Warning>

### مثال على حسابات متعددة

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
  تجاوز اختياري للنموذج لتشغيل Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  عند التفعيل، يتم أيضًا تسليم رسالة `Reasoning:` المنفصلة عند توفرها (بالشكل نفسه مثل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  عند true، تستخدم عمليات Heartbeat سياق تمهيد خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  عند true، تعمل كل عملية Heartbeat في جلسة جديدة بلا سجل محادثة سابق. تستخدم نمط العزل نفسه مثل cron `sessionTarget: "isolated"`. يقلل ذلك تكلفة الرموز لكل Heartbeat بدرجة كبيرة. ادمجه مع `lightContext: true` لتحقيق أقصى توفير. ما زال توجيه التسليم يستخدم سياق الجلسة الرئيسية.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  عند true، تؤجل عمليات Heartbeat في مسارات الانشغال الإضافية: عمل الوكيل الفرعي أو الأوامر المتداخلة. تؤجل مسارات Cron دائمًا Heartbeat، حتى بدون هذه العلامة، بحيث لا تشغل مضيفات النماذج المحلية مطالبات cron وHeartbeat في الوقت نفسه.
</ParamField>
<ParamField path="session" type="string">
  مفتاح جلسة اختياري لعمليات Heartbeat.

- `main` (افتراضي): جلسة الوكيل الرئيسية.
- مفتاح جلسة صريح (انسخه من `openclaw sessions --json` أو من [CLI الجلسات](/ar/cli/sessions)).
- تنسيقات مفاتيح الجلسات: راجع [الجلسات](/ar/concepts/session) و[المجموعات](/ar/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: التسليم إلى آخر قناة خارجية مستخدمة.
- قناة صريحة: أي قناة مضبوطة أو معرّف plugin، مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`.
- `none` (افتراضي): شغّل Heartbeat لكن **لا تسلّم** خارجيًا.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  يتحكم في سلوك التسليم المباشر/DM. `allow`: السماح بتسليم Heartbeat المباشر/DM. `block`: منع التسليم المباشر/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  تجاوز اختياري للمستلم (معرّف خاص بالقناة، مثل E.164 لـ WhatsApp أو معرّف محادثة Telegram). بالنسبة إلى مواضيع/سلاسل Telegram، استخدم `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  معرّف حساب اختياري للقنوات متعددة الحسابات. عند `target: "last"`، ينطبق معرّف الحساب على آخر قناة تم حلها إذا كانت تدعم الحسابات؛ وإلا يتم تجاهله. إذا لم يطابق معرّف الحساب حسابًا مضبوطًا للقناة التي تم حلها، يتم تخطي التسليم.

</ParamField>
<ParamField path="prompt" type="string">
  يتجاوز نص المطالبة الافتراضي (لا يتم دمجه).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  الحد الأقصى لعدد الأحرف المسموح بها بعد `HEARTBEAT_OK` قبل التسليم.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  عند التعيين إلى true، يكتم حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  يقيّد تشغيلات Heartbeat بنافذة زمنية. كائن يحتوي على `start` ‏(HH:MM، شامل؛ استخدم `00:00` لبداية اليوم)، و`end` ‏(HH:MM غير شامل؛ يُسمح بـ `24:00` لنهاية اليوم)، و`timezone` اختياري.

- محذوف أو `"user"`: يستخدم `agents.defaults.userTimezone` إذا كان معيّناً، وإلا يعود إلى المنطقة الزمنية لنظام المضيف.
- `"local"`: يستخدم دائماً المنطقة الزمنية لنظام المضيف.
- أي معرّف IANA (مثلاً `America/New_York`): يُستخدم مباشرة؛ وإذا كان غير صالح، يعود إلى سلوك `"user"` أعلاه.
- يجب ألا تكون قيمتا `start` و`end` متساويتين لنافذة نشطة؛ تُعامل القيم المتساوية كنافذة ذات عرض صفري (دائماً خارج النافذة).
- خارج النافذة النشطة، يتم تخطي Heartbeats حتى النبضة التالية داخل النافذة.

</ParamField>

## سلوك التسليم

<AccordionGroup>
  <Accordion title="Session and target routing">
    - تعمل Heartbeats في الجلسة الرئيسية للوكيل افتراضياً (`agent:<id>:<mainKey>`)، أو `global` عندما تكون `session.scope = "global"`. عيّن `session` للتجاوز إلى جلسة قناة محددة (Discord/WhatsApp/إلخ).
    - يؤثر `session` فقط في سياق التشغيل؛ يتحكم `target` و`to` في التسليم.
    - للتسليم إلى قناة/مستلم محدد، عيّن `target` + `to`. مع `target: "last"`، يستخدم التسليم آخر قناة خارجية لتلك الجلسة.
    - تسمح تسليمات Heartbeat بأهداف مباشرة/رسائل خاصة افتراضياً. عيّن `directPolicy: "block"` لكتم الإرسال إلى الأهداف المباشرة مع استمرار تشغيل دورة Heartbeat.
    - إذا كان الطابور الرئيسي، أو مسار جلسة الهدف، أو مسار cron، أو مهمة cron نشطة مشغولاً، يتم تخطي Heartbeat وإعادة المحاولة لاحقاً.
    - إذا كان `skipWhenBusy: true`، فإن مسارات الوكلاء الفرعيين والمسارات المتداخلة تؤجل أيضاً تشغيلات Heartbeat.
    - إذا تم حل `target` إلى عدم وجود وجهة خارجية، فسيظل التشغيل يحدث ولكن لا تُرسل أي رسالة صادرة.

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - إذا كانت `showOk` و`showAlerts` و`useIndicator` كلها معطلة، يتم تخطي التشغيل مسبقاً كـ `reason=alerts-disabled`.
    - إذا كان تسليم التنبيهات فقط معطلاً، فلا يزال بإمكان OpenClaw تشغيل Heartbeat، وتحديث الطوابع الزمنية للمهام المستحقة، واستعادة الطابع الزمني لخمول الجلسة، وكتم حمولة التنبيه الخارجية.
    - إذا كان هدف Heartbeat المحلول يدعم الكتابة، يعرض OpenClaw مؤشر الكتابة أثناء نشاط تشغيل Heartbeat. يستخدم هذا الهدف نفسه الذي كان سيرسل إليه Heartbeat مخرجات المحادثة، ويتم تعطيله بواسطة `typingMode: "never"`.

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - الردود الخاصة بـ Heartbeat فقط **لا** تبقي الجلسة حية. قد تحدّث بيانات Heartbeat الوصفية صف الجلسة، لكن انتهاء الخمول يستخدم `lastInteractionAt` من آخر رسالة مستخدم/قناة حقيقية، ويستخدم الانتهاء اليومي `sessionStartedAt`.
    - يخفي سجل Control UI وWebChat مطالبات Heartbeat وإقرارات OK فقط. لا يزال من الممكن أن يحتوي نص الجلسة الأساسي على تلك الدورات للتدقيق/إعادة التشغيل.
    - يمكن لـ [المهام الخلفية](/ar/automation/tasks) المنفصلة إضافة حدث نظام إلى الطابور وإيقاظ Heartbeat عندما ينبغي للجلسة الرئيسية أن تلاحظ شيئاً بسرعة. لا يجعل ذلك الإيقاظ تشغيل Heartbeat مهمة خلفية.

  </Accordion>
</AccordionGroup>

## عناصر التحكم في الرؤية

افتراضياً، يتم كتم إقرارات `HEARTBEAT_OK` بينما يتم تسليم محتوى التنبيه. يمكنك ضبط هذا لكل قناة أو لكل حساب:

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

- `showOk`: يرسل إقرار `HEARTBEAT_OK` عندما يعيد النموذج رداً من نوع OK فقط.
- `showAlerts`: يرسل محتوى التنبيه عندما يعيد النموذج رداً ليس OK.
- `useIndicator`: يصدر أحداث المؤشر لأسطح حالة واجهة المستخدم.

إذا كانت **الثلاثة كلها** false، يتخطى OpenClaw تشغيل Heartbeat بالكامل (لا استدعاء للنموذج).

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
| السلوك الافتراضي (إقرارات OK صامتة، التنبيهات مفعلة) | _(لا حاجة إلى إعداد)_                                                                     |
| صامت بالكامل (لا رسائل، لا مؤشر) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| مؤشر فقط (لا رسائل)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| إقرارات OK في قناة واحدة فقط                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختياري)

إذا كان ملف `HEARTBEAT.md` موجوداً في مساحة العمل، فإن المطالبة الافتراضية تخبر الوكيل بقراءته. فكّر فيه كـ "قائمة تحقق Heartbeat" الخاصة بك: صغيرة، وثابتة، وآمنة للتضمين كل 30 دقيقة.

في التشغيلات العادية، لا يُحقن `HEARTBEAT.md` إلا عندما تكون إرشادات Heartbeat مفعلة للوكيل الافتراضي. يؤدي تعطيل وتيرة Heartbeat باستخدام `0m` أو تعيين `includeSystemPromptSection: false` إلى حذفه من سياق التمهيد العادي.

إذا كان `HEARTBEAT.md` موجوداً لكنه فارغ فعلياً (فقط أسطر فارغة وعناوين markdown مثل `# Heading`)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API. يتم الإبلاغ عن ذلك التخطي كـ `reason=empty-heartbeat-file`. إذا كان الملف مفقوداً، فلا يزال Heartbeat يعمل ويقرر النموذج ما يجب فعله.

اجعله صغيراً جداً (قائمة تحقق قصيرة أو تذكيرات) لتجنب تضخم المطالبة.

مثال `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### كتل `tasks:`

يدعم `HEARTBEAT.md` أيضاً كتلة `tasks:` منظمة صغيرة للفحوصات المعتمدة على الفواصل الزمنية داخل Heartbeat نفسه.

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
    - لا تُدرج في مطالبة Heartbeat لتلك النبضة إلا المهام **المستحقة**.
    - إذا لم تكن هناك مهام مستحقة، يتم تخطي Heartbeat بالكامل (`reason=no-tasks-due`) لتجنب استدعاء نموذج مهدور.
    - يُحفظ المحتوى غير المتعلق بالمهام في `HEARTBEAT.md` ويُلحق كسياق إضافي بعد قائمة المهام المستحقة.
    - تُخزن الطوابع الزمنية لآخر تشغيل للمهام في حالة الجلسة (`heartbeatTaskState`)، لذلك تبقى الفواصل الزمنية عبر عمليات إعادة التشغيل العادية.
    - لا تُقدّم الطوابع الزمنية للمهام إلا بعد اكتمال تشغيل Heartbeat لمسار الرد العادي. تشغيلات `empty-heartbeat-file` / `no-tasks-due` المتخطاة لا تضع علامة على المهام كمكتملة.

  </Accordion>
</AccordionGroup>

يكون وضع المهام مفيداً عندما تريد أن يحتوي ملف Heartbeat واحد على عدة فحوصات دورية دون الدفع مقابلها كلها في كل نبضة.

### هل يمكن للوكيل تحديث HEARTBEAT.md؟

نعم — إذا طلبت منه ذلك.

`HEARTBEAT.md` هو مجرد ملف عادي في مساحة عمل الوكيل، لذا يمكنك إخبار الوكيل (في محادثة عادية) بشيء مثل:

- "حدّث `HEARTBEAT.md` لإضافة فحص يومي للتقويم."
- "أعد كتابة `HEARTBEAT.md` بحيث يكون أقصر ومركزاً على متابعات صندوق الوارد."

إذا أردت أن يحدث هذا بشكل استباقي، يمكنك أيضاً تضمين سطر صريح في مطالبة Heartbeat لديك مثل: "إذا أصبحت قائمة التحقق قديمة، فحدّث HEARTBEAT.md بقائمة أفضل."

<Warning>
لا تضع الأسرار (مفاتيح API، أرقام الهواتف، الرموز الخاصة) في `HEARTBEAT.md` — فهو يصبح جزءاً من سياق المطالبة.
</Warning>

## إيقاظ يدوي (عند الطلب)

يمكنك إضافة حدث نظام إلى الطابور وتشغيل Heartbeat فوري باستخدام:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

إذا كان لدى عدة وكلاء `heartbeat` مكوّن، فإن الإيقاظ اليدوي يشغّل كل Heartbeats لهؤلاء الوكلاء فوراً.

استخدم `--mode next-heartbeat` للانتظار حتى النبضة المجدولة التالية.

## تسليم الاستدلال (اختياري)

افتراضياً، لا تسلم Heartbeats إلا حمولة "الإجابة" النهائية.

إذا أردت الشفافية، فعّل:

- `agents.defaults.heartbeat.includeReasoning: true`

عند التفعيل، ستسلم Heartbeats أيضاً رسالة منفصلة مسبوقة بـ `Reasoning:` (بالشكل نفسه مثل `/reasoning on`). يمكن أن يكون هذا مفيداً عندما يدير الوكيل عدة جلسات/codexes وتريد أن ترى لماذا قرر تنبيهك — لكنه قد يسرّب أيضاً تفاصيل داخلية أكثر مما تريد. يفضّل إبقاؤه معطلاً في محادثات المجموعات.

## الوعي بالتكلفة

تشغّل Heartbeats دورات وكيل كاملة. الفواصل الأقصر تستهلك رموزاً أكثر. لتقليل التكلفة:

- استخدم `isolatedSession: true` لتجنب إرسال سجل المحادثة الكامل (من نحو 100 ألف رمز إلى نحو 2-5 آلاف لكل تشغيل).
- استخدم `lightContext: true` لقصر ملفات التمهيد على `HEARTBEAT.md` فقط.
- عيّن `model` أرخص (مثلاً `ollama/llama3.2:1b`).
- أبقِ `HEARTBEAT.md` صغيراً.
- استخدم `target: "none"` إذا كنت تريد تحديثات الحالة الداخلية فقط.

## تجاوز السياق بعد Heartbeat

إذا استخدم Heartbeat نموذجاً محلياً أصغر، مثلاً نموذج Ollama بنافذة 32k، وأبلغت دورة الجلسة الرئيسية التالية عن تجاوز السياق، فتحقق مما إذا كان Heartbeat السابق قد ترك الجلسة على نموذج Heartbeat. تشير رسالة إعادة التعيين في OpenClaw إلى ذلك عندما يطابق نموذج وقت التشغيل الأخير `heartbeat.model` المكوّن.

استخدم `isolatedSession: true` لتشغيل Heartbeats في جلسة جديدة، واجمعه مع `lightContext: true` لأصغر مطالبة، أو اختر نموذج Heartbeat بنافذة سياق كبيرة بما يكفي للجلسة المشتركة.

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — جميع آليات الأتمتة في لمحة
- [المهام الخلفية](/ar/automation/tasks) — كيف يتم تتبع العمل المنفصل
- [المنطقة الزمنية](/ar/concepts/timezone) — كيف تؤثر المنطقة الزمنية في جدولة Heartbeat
- [استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting) — تصحيح مشكلات الأتمتة
