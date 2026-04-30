---
read_when:
    - ضبط وتيرة Heartbeat أو المراسلة
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Heartbeat
summary: رسائل استقصاء Heartbeat وقواعد الإشعارات
title: Heartbeat
x-i18n:
    generated_at: "2026-04-30T07:59:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bafae7cafb9163015a112c074d36ab070c71d1d7ba1c7c0834e6720521f4275
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat أم Cron؟** راجع [الأتمتة والمهام](/ar/automation) للحصول على إرشادات حول متى تستخدم كلًا منهما.
</Note>

يشغّل Heartbeat **دورات وكيل دورية** في الجلسة الرئيسية حتى يتمكّن النموذج من إبراز أي شيء يحتاج إلى انتباه من دون إغراقك بالرسائل.

Heartbeat هو دورة مجدولة في الجلسة الرئيسية، ولا ينشئ سجلات [مهمة في الخلفية](/ar/automation/tasks). سجلات المهام مخصّصة للعمل المنفصل (تشغيلات ACP، والوكلاء الفرعيون، ومهام Cron المعزولة).

استكشاف الأخطاء وإصلاحها: [المهام المجدولة](/ar/automation/cron-jobs#troubleshooting)

## البدء السريع (للمبتدئين)

<Steps>
  <Step title="Pick a cadence">
    اترك Heartbeat مفعّلًا (القيمة الافتراضية هي `30m`، أو `1h` لمصادقة Anthropic OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI) أو عيّن الإيقاع الذي تريده.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    أنشئ قائمة تحقق صغيرة في `HEARTBEAT.md` أو كتلة `tasks:` في مساحة عمل الوكيل.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` هي القيمة الافتراضية؛ عيّن `target: "last"` للتوجيه إلى آخر جهة اتصال.
  </Step>
  <Step title="Optional tuning">
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

## القيم الافتراضية

- الفاصل الزمني: `30m` (أو `1h` عندما يكون وضع المصادقة المكتشف هو Anthropic OAuth/الرمز، بما في ذلك إعادة استخدام Claude CLI). عيّن `agents.defaults.heartbeat.every` أو `agents.list[].heartbeat.every` لكل وكيل؛ استخدم `0m` للتعطيل.
- نص الموجّه (قابل للإعداد عبر `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- يُرسل موجّه Heartbeat **حرفيًا** كرسالة المستخدم. يتضمن موجّه النظام قسم "Heartbeat" فقط عندما تكون Heartbeat مفعّلة للوكيل الافتراضي، وتُعلَّم التشغيلة داخليًا.
- عند تعطيل Heartbeat باستخدام `0m`، تحذف التشغيلات العادية أيضًا `HEARTBEAT.md` من سياق التمهيد حتى لا يرى النموذج تعليمات مخصّصة لـ Heartbeat فقط.
- تُفحص ساعات النشاط (`heartbeat.activeHours`) في المنطقة الزمنية المضبوطة. خارج النافذة، تُتخطى Heartbeat حتى النبضة التالية داخل النافذة.
- يؤجّل Heartbeat تلقائيًا أثناء نشاط عمل Cron أو وجوده في قائمة الانتظار. عيّن `heartbeat.skipWhenBusy: true` للتأجيل أيضًا عند انشغال مسارات إضافية (وكيل فرعي أو عمل أوامر متداخل)؛ وهذا مفيد لـ Ollama المحلي والمضيفين الآخرين ذوي وقت التشغيل الواحد والمقيّد.

## ما الغرض من موجّه Heartbeat

الموجّه الافتراضي واسع عمدًا:

- **المهام في الخلفية**: عبارة "Consider outstanding tasks" تدفع الوكيل إلى مراجعة المتابعات (البريد الوارد، التقويم، التذكيرات، العمل في قائمة الانتظار) وإبراز أي شيء عاجل.
- **الاطمئنان على الإنسان**: عبارة "Checkup sometimes on your human during day time" تدفع رسالة خفيفة من حين لآخر مثل "هل تحتاج إلى شيء؟"، لكنها تتجنب الإزعاج ليلًا باستخدام منطقتك الزمنية المحلية المضبوطة (راجع [المنطقة الزمنية](/ar/concepts/timezone)).

يمكن لـ Heartbeat التفاعل مع [المهام في الخلفية](/ar/automation/tasks) المكتملة، لكن تشغيل Heartbeat نفسه لا ينشئ سجل مهمة.

إذا أردت أن ينفّذ Heartbeat شيئًا محددًا جدًا (مثل "check Gmail PubSub stats" أو "verify gateway health")، فعيّن `agents.defaults.heartbeat.prompt` (أو `agents.list[].heartbeat.prompt`) إلى نص مخصّص (يُرسل حرفيًا).

## عقد الاستجابة

- إذا لم يكن هناك شيء يحتاج إلى انتباه، فأجب بـ **`HEARTBEAT_OK`**.
- أثناء تشغيلات Heartbeat، يتعامل OpenClaw مع `HEARTBEAT_OK` كتأكيد عندما يظهر في **بداية الرد أو نهايته**. يُزال الرمز وتُسقط الاستجابة إذا كان المحتوى المتبقي **≤ `ackMaxChars`** (القيمة الافتراضية: 300).
- إذا ظهر `HEARTBEAT_OK` في **وسط** رد، فلا يُعامل معاملة خاصة.
- للتنبيهات، **لا** تضمّن `HEARTBEAT_OK`؛ أعد نص التنبيه فقط.

خارج Heartbeat، يُزال `HEARTBEAT_OK` الشارد في بداية/نهاية الرسالة ويُسجّل؛ أما الرسالة التي لا تحتوي إلا على `HEARTBEAT_OK` فتُسقط.

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

- يعيّن `agents.defaults.heartbeat` سلوك Heartbeat العام.
- يندمج `agents.list[].heartbeat` فوقه؛ إذا كان لدى أي وكيل كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغّلون Heartbeat.
- يعيّن `channels.defaults.heartbeat` افتراضات الرؤية لكل القنوات.
- يتجاوز `channels.<channel>.heartbeat` افتراضات القناة.
- يتجاوز `channels.<channel>.accounts.<id>.heartbeat` (للقنوات متعددة الحسابات) إعدادات كل قناة.

### Heartbeat لكل وكيل

إذا تضمّن أي إدخال في `agents.list[]` كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** يشغّلون Heartbeat. تندمج كتلة كل وكيل فوق `agents.defaults.heartbeat` (لذا يمكنك تعيين افتراضات مشتركة مرة واحدة وتجاوزها لكل وكيل).

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

خارج هذه النافذة (قبل 9 صباحًا أو بعد 10 مساءً بتوقيت الشرق)، تُتخطى Heartbeat. ستعمل النبضة المجدولة التالية داخل النافذة بشكل طبيعي.

### إعداد 24/7

إذا أردت أن يعمل Heartbeat طوال اليوم، فاستخدم أحد هذين النمطين:

- احذف `activeHours` بالكامل (لا يوجد قيد نافذة زمنية؛ هذا هو السلوك الافتراضي).
- عيّن نافذة يوم كامل: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
لا تعيّن وقتي `start` و`end` نفسيهما (مثلًا من `08:00` إلى `08:00`). يُعامل ذلك كنافذة صفرية العرض، لذلك تُتخطى Heartbeat دائمًا.
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
  فاصل Heartbeat الزمني (سلسلة مدة؛ الوحدة الافتراضية = دقائق).
</ParamField>
<ParamField path="model" type="string">
  تجاوز اختياري للنموذج في تشغيلات Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  عند التفعيل، تُسلَّم أيضًا رسالة `Reasoning:` المنفصلة عندما تكون متاحة (بنفس شكل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  عند ضبطها على true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا وتُبقي فقط على `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  عند ضبطها على true، يعمل كل Heartbeat في جلسة جديدة من دون سجل محادثات سابق. يستخدم نمط العزل نفسه مثل Cron `sessionTarget: "isolated"`. يقلّل تكلفة الرموز لكل Heartbeat بشكل كبير. ادمجه مع `lightContext: true` لأقصى توفير. لا يزال توجيه التسليم يستخدم سياق الجلسة الرئيسية.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  عند ضبطها على true، تؤجّل تشغيلات Heartbeat عند انشغال مسارات إضافية: وكيل فرعي أو عمل أوامر متداخل. تؤجّل مسارات Cron دائمًا Heartbeat، حتى من دون هذا العلم، حتى لا تشغّل مضيفات النماذج المحلية موجّهات Cron وHeartbeat في الوقت نفسه.
</ParamField>
<ParamField path="session" type="string">
  مفتاح جلسة اختياري لتشغيلات Heartbeat.

- `main` (افتراضي): الجلسة الرئيسية للوكيل.
- مفتاح جلسة صريح (انسخه من `openclaw sessions --json` أو من [CLI الجلسات](/ar/cli/sessions)).
- تنسيقات مفاتيح الجلسة: راجع [الجلسات](/ar/concepts/session) و[المجموعات](/ar/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: التسليم إلى آخر قناة خارجية مستخدمة.
- قناة صريحة: أي قناة مضبوطة أو معرّف Plugin، مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`.
- `none` (افتراضي): يشغّل Heartbeat لكن **لا يسلّم** خارجيًا.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  يتحكم في سلوك التسليم المباشر/عبر الرسائل الخاصة. `allow`: السماح بتسليم Heartbeat المباشر/عبر الرسائل الخاصة. `block`: منع التسليم المباشر/عبر الرسائل الخاصة (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  تجاوز اختياري للمستلم (معرّف خاص بالقناة، مثل E.164 لـ WhatsApp أو معرّف دردشة Telegram). لموضوعات/سلاسل Telegram، استخدم `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  معرّف حساب اختياري للقنوات متعددة الحسابات. عند `target: "last"`، يُطبّق معرّف الحساب على آخر قناة محلولة إذا كانت تدعم الحسابات؛ وإلا يُتجاهل. إذا لم يطابق معرّف الحساب حسابًا مضبوطًا للقناة المحلولة، يُتخطى التسليم.

</ParamField>
<ParamField path="prompt" type="string">
  يتجاوز نص الموجّه الافتراضي (لا يُدمج).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  الحد الأقصى للأحرف المسموح بها بعد `HEARTBEAT_OK` قبل التسليم.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  عندما تكون true، تكبت حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  يقيّد تشغيلات Heartbeat ضمن نافذة زمنية. كائن يحتوي على `start` (HH:MM، شامل؛ استخدم `00:00` لبداية اليوم)، و`end` (HH:MM غير شامل؛ يُسمح بـ `24:00` لنهاية اليوم)، و`timezone` اختياري.

- محذوف أو `"user"`: يستخدم `agents.defaults.userTimezone` لديك إذا كان معيّناً، وإلا يعود إلى المنطقة الزمنية لنظام المضيف.
- `"local"`: يستخدم دائماً المنطقة الزمنية لنظام المضيف.
- أي معرّف IANA (مثل `America/New_York`): يُستخدم مباشرة؛ وإذا كان غير صالح، يعود إلى سلوك `"user"` أعلاه.
- يجب ألا تكون قيمتا `start` و`end` متساويتين لنافذة نشطة؛ تُعامل القيم المتساوية كنافذة صفرية العرض (دائماً خارج النافذة).
- خارج النافذة النشطة، تُتخطى Heartbeats حتى النبضة التالية داخل النافذة.

</ParamField>

## سلوك التسليم

<AccordionGroup>
  <Accordion title="توجيه الجلسة والهدف">
    - تعمل Heartbeats في الجلسة الرئيسية للوكيل افتراضياً (`agent:<id>:<mainKey>`)، أو `global` عندما تكون `session.scope = "global"`. عيّن `session` للتجاوز إلى جلسة قناة محددة (Discord/WhatsApp/إلخ).
    - يؤثر `session` فقط في سياق التشغيل؛ يتحكم `target` و`to` في التسليم.
    - للتسليم إلى قناة/مستلم محدد، عيّن `target` + `to`. مع `target: "last"`، يستخدم التسليم آخر قناة خارجية لتلك الجلسة.
    - تسمح تسليمات Heartbeat بالأهداف المباشرة/رسائل DM افتراضياً. عيّن `directPolicy: "block"` لكبت الإرسال إلى الأهداف المباشرة مع الاستمرار في تشغيل دورة Heartbeat.
    - إذا كان الطابور الرئيسي أو مسار جلسة الهدف أو مسار cron أو مهمة cron نشطة مشغولاً، تُتخطى Heartbeat وتُعاد المحاولة لاحقاً.
    - إذا كانت `skipWhenBusy: true`، فإن مسارات الوكلاء الفرعيين والمسارات المتداخلة تؤجل أيضاً تشغيلات Heartbeat.
    - إذا لم يحلّ `target` إلى وجهة خارجية، يستمر التشغيل لكن لا تُرسل أي رسالة صادرة.

  </Accordion>
  <Accordion title="الرؤية وسلوك التخطي">
    - إذا كانت `showOk` و`showAlerts` و`useIndicator` كلها معطلة، يُتخطى التشغيل مسبقاً بوصفه `reason=alerts-disabled`.
    - إذا كان تسليم التنبيهات فقط معطلاً، يستطيع OpenClaw مع ذلك تشغيل Heartbeat، وتحديث الطوابع الزمنية للمهام المستحقة، واستعادة طابع خمول الجلسة، وكبت حمولة التنبيه الخارجية.
    - إذا كان هدف Heartbeat المحلول يدعم الكتابة، يعرض OpenClaw حالة الكتابة أثناء نشاط تشغيل Heartbeat. يستخدم هذا الهدف نفسه الذي سترسل Heartbeat إليه مخرجات الدردشة، ويُعطّل عبر `typingMode: "never"`.

  </Accordion>
  <Accordion title="دورة حياة الجلسة والتدقيق">
    - لا تُبقي ردود Heartbeat فقط الجلسة حيّة. قد تحدّث بيانات Heartbeat الوصفية صف الجلسة، لكن انتهاء الخمول يستخدم `lastInteractionAt` من آخر رسالة مستخدم/قناة حقيقية، ويستخدم الانتهاء اليومي `sessionStartedAt`.
    - يخفي سجل Control UI وWebChat مطالبات Heartbeat وإقرارات OK فقط. لا يزال بإمكان نص الجلسة الأساسي احتواء تلك الدورات لأغراض التدقيق/إعادة التشغيل.
    - يمكن أن تضيف [المهام الخلفية](/ar/automation/tasks) المنفصلة حدث نظام إلى الطابور وتوقظ Heartbeat عندما ينبغي للجلسة الرئيسية ملاحظة شيء بسرعة. لا يجعل ذلك الإيقاظ تشغيل Heartbeat مهمة خلفية.

  </Accordion>
</AccordionGroup>

## عناصر التحكم في الرؤية

افتراضياً، تُكبت إقرارات `HEARTBEAT_OK` بينما يُسلّم محتوى التنبيهات. يمكنك ضبط هذا لكل قناة أو لكل حساب:

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

الأسبقية: لكل حساب ← لكل قناة ← الإعدادات الافتراضية للقناة ← الإعدادات الافتراضية المضمنة.

### ما الذي يفعله كل علم

- `showOk`: يرسل إقرار `HEARTBEAT_OK` عندما يعيد النموذج رداً من نوع OK فقط.
- `showAlerts`: يرسل محتوى التنبيه عندما يعيد النموذج رداً غير OK.
- `useIndicator`: يصدر أحداث مؤشر لأسطح حالة واجهة المستخدم.

إذا كانت **الثلاثة كلها** false، يتخطى OpenClaw تشغيل Heartbeat بالكامل (لا يوجد استدعاء للنموذج).

### أمثلة لكل قناة مقابل كل حساب

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
| السلوك الافتراضي (OK صامتة، والتنبيهات مفعلة) | _(لا حاجة إلى إعداد)_                                                                    |
| صامت بالكامل (لا رسائل، ولا مؤشر)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| مؤشر فقط (لا رسائل)                      | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK في قناة واحدة فقط                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختياري)

إذا كان ملف `HEARTBEAT.md` موجوداً في مساحة العمل، فإن المطالبة الافتراضية تخبر الوكيل بقراءته. فكّر فيه كأنه "قائمة تحقق Heartbeat" الخاصة بك: صغيرة ومستقرة وآمنة للتضمين كل 30 دقيقة.

في التشغيلات العادية، لا يُحقن `HEARTBEAT.md` إلا عند تمكين إرشادات Heartbeat للوكيل الافتراضي. تعطيل إيقاع Heartbeat باستخدام `0m` أو تعيين `includeSystemPromptSection: false` يحذفه من سياق التمهيد العادي.

إذا كان `HEARTBEAT.md` موجوداً لكنه فارغ فعلياً (فقط أسطر فارغة وعناوين markdown مثل `# Heading`)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API. يُبلّغ عن هذا التخطي باسم `reason=empty-heartbeat-file`. إذا كان الملف مفقوداً، تستمر Heartbeat في العمل ويقرر النموذج ما يجب فعله.

اجعله صغيراً جداً (قائمة تحقق قصيرة أو تذكيرات) لتجنب تضخم المطالبة.

مثال `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### كتل `tasks:`

يدعم `HEARTBEAT.md` أيضاً كتلة `tasks:` منظمة صغيرة للفحوصات القائمة على الفواصل داخل Heartbeat نفسها.

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
    - تُضمّن فقط المهام **المستحقة** في مطالبة Heartbeat لتلك النبضة.
    - إذا لم تكن هناك مهام مستحقة، تُتخطى Heartbeat بالكامل (`reason=no-tasks-due`) لتجنب استدعاء نموذج مهدور.
    - يُحفظ المحتوى غير المتعلق بالمهام في `HEARTBEAT.md` ويُلحق كسياق إضافي بعد قائمة المهام المستحقة.
    - تُخزن الطوابع الزمنية لآخر تشغيل للمهام في حالة الجلسة (`heartbeatTaskState`)، لذلك تصمد الفواصل الزمنية بعد عمليات إعادة التشغيل العادية.
    - لا تُقدّم الطوابع الزمنية للمهام إلا بعد اكتمال تشغيل Heartbeat عبر مسار الرد العادي. لا تضع تشغيلات `empty-heartbeat-file` / `no-tasks-due` المتخطاة علامة اكتمال على المهام.

  </Accordion>
</AccordionGroup>

يكون وضع المهام مفيداً عندما تريد أن يحتوي ملف Heartbeat واحد على عدة فحوصات دورية دون الدفع مقابلها كلها في كل نبضة.

### هل يمكن للوكيل تحديث HEARTBEAT.md؟

نعم — إذا طلبت منه ذلك.

`HEARTBEAT.md` مجرد ملف عادي في مساحة عمل الوكيل، لذلك يمكنك أن تخبر الوكيل (في دردشة عادية) بشيء مثل:

- "حدّث `HEARTBEAT.md` لإضافة فحص يومي للتقويم."
- "أعد كتابة `HEARTBEAT.md` بحيث يكون أقصر ومركزاً على متابعات البريد الوارد."

إذا كنت تريد أن يحدث هذا استباقياً، يمكنك أيضاً تضمين سطر صريح في مطالبة Heartbeat لديك مثل: "إذا أصبحت قائمة التحقق قديمة، فحدّث HEARTBEAT.md بقائمة أفضل."

<Warning>
لا تضع أسراراً (مفاتيح API، أرقام هواتف، رموزاً خاصة) في `HEARTBEAT.md` — فهو يصبح جزءاً من سياق المطالبة.
</Warning>

## إيقاظ يدوي (عند الطلب)

يمكنك إدراج حدث نظام في الطابور وتشغيل Heartbeat فورية باستخدام:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

إذا كان لدى عدة وكلاء إعداد `heartbeat`، فإن الإيقاظ اليدوي يشغّل كل Heartbeats هؤلاء الوكلاء فوراً.

استخدم `--mode next-heartbeat` للانتظار حتى النبضة المجدولة التالية.

## تسليم الاستدلال (اختياري)

افتراضياً، تسلّم Heartbeats حمولة "الإجابة" النهائية فقط.

إذا أردت الشفافية، فعّل:

- `agents.defaults.heartbeat.includeReasoning: true`

عند التمكين، ستسلّم Heartbeats أيضاً رسالة منفصلة مسبوقة بـ `Reasoning:` (بالشكل نفسه مثل `/reasoning on`). قد يكون هذا مفيداً عندما يدير الوكيل جلسات/بيئات codex متعددة وتريد معرفة سبب قراره بمراسلتك — لكنه قد يسرّب أيضاً تفاصيل داخلية أكثر مما تريد. يُفضّل إبقاؤه متوقفاً في دردشات المجموعات.

## الوعي بالتكلفة

تشغّل Heartbeats دورات وكيل كاملة. تحرق الفواصل الأقصر رموزاً أكثر. لتقليل التكلفة:

- استخدم `isolatedSession: true` لتجنب إرسال سجل المحادثة الكامل (من نحو 100 ألف رمز إلى نحو 2-5 آلاف لكل تشغيل).
- استخدم `lightContext: true` لقصر ملفات التمهيد على `HEARTBEAT.md` فقط.
- عيّن `model` أرخص (مثل `ollama/llama3.2:1b`).
- أبقِ `HEARTBEAT.md` صغيراً.
- استخدم `target: "none"` إذا كنت تريد تحديثات الحالة الداخلية فقط.

## تجاوز السياق بعد Heartbeat

إذا استخدمت Heartbeat نموذجاً محلياً أصغر، على سبيل المثال نموذج Ollama بنافذة 32k، وأبلغت دورة الجلسة الرئيسية التالية عن تجاوز السياق، فتحقق مما إذا كانت Heartbeat السابقة قد تركت الجلسة على نموذج Heartbeat. تشير رسالة إعادة التعيين في OpenClaw إلى ذلك عندما يطابق آخر نموذج وقت تشغيل `heartbeat.model` المكوّن.

استخدم `isolatedSession: true` لتشغيل Heartbeats في جلسة جديدة، واجمعه مع `lightContext: true` لأصغر مطالبة، أو اختر نموذج Heartbeat بنافذة سياق كبيرة بما يكفي للجلسة المشتركة.

## ذات صلة

- [الأتمتة والمهام](/ar/automation) — جميع آليات الأتمتة بنظرة سريعة
- [المهام الخلفية](/ar/automation/tasks) — كيف يُتتبع العمل المنفصل
- [المنطقة الزمنية](/ar/concepts/timezone) — كيف تؤثر المنطقة الزمنية في جدولة Heartbeat
- [استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting) — تصحيح مشكلات الأتمتة
