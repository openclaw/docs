---
read_when:
    - ضبط وتيرة Heartbeat أو المراسلة
    - الاختيار بين Heartbeat وCron للمهام المجدولة
sidebarTitle: Heartbeat
summary: رسائل استطلاع Heartbeat وقواعد الإشعارات
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T05:56:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat أم Cron؟** راجع [الأتمتة](/ar/automation) للحصول على إرشادات حول وقت استخدام كل منهما.
</Note>

يشغّل Heartbeat **دورات دورية للوكيل** في الجلسة الرئيسية حتى يتمكن النموذج من إظهار أي أمر يحتاج إلى الانتباه دون إغراقك بالرسائل.

Heartbeat هو دورة مجدولة في الجلسة الرئيسية، ولا ينشئ سجلات [مهام في الخلفية](/ar/automation/tasks). سجلات المهام مخصصة للعمل المنفصل (عمليات تشغيل ACP والوكلاء الفرعيون ومهام Cron المعزولة).

استكشاف الأخطاء وإصلاحها: [المهام المجدولة](/ar/automation/cron-jobs#troubleshooting)

## البدء السريع (للمبتدئين)

<Steps>
  <Step title="Pick a cadence">
    اترك Heartbeat مفعّلًا (القيمة الافتراضية هي `30m`، أو `1h` عند إعداد مصادقة OAuth/الرمز المميز من Anthropic، بما في ذلك إعادة استخدام Claude CLI) أو عيّن وتيرتك الخاصة.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    أنشئ قائمة تحقق صغيرة في `HEARTBEAT.md` أو كتلة `tasks:` في مساحة عمل الوكيل.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    القيمة الافتراضية هي `target: "none"`؛ عيّن `target: "last"` لتوجيه الرسائل إلى آخر جهة اتصال.
  </Step>
  <Step title="Optional tuning">
    - فعّل إرسال استدلال Heartbeat لتعزيز الشفافية.
    - استخدم سياق تمهيد خفيفًا إذا كانت عمليات تشغيل Heartbeat لا تحتاج إلا إلى `HEARTBEAT.md`.
    - فعّل الجلسات المعزولة لتجنب إرسال سجل المحادثة الكامل مع كل Heartbeat.
    - احصر Heartbeat ضمن الساعات النشطة (بالتوقيت المحلي).

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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## القيم الافتراضية

- الفاصل الزمني: `30m`. يؤدي تطبيق القيم الافتراضية لمزوّد Anthropic إلى رفعه إلى `1h` عندما يكون وضع المصادقة المحدد هو OAuth/الرمز المميز (بما في ذلك إعادة استخدام Claude CLI)، ولكن فقط ما دام `heartbeat.every` غير معيّن. عيّن `agents.defaults.heartbeat.every` أو `agents.list[].heartbeat.every` لكل وكيل؛ واستخدم `0m` للتعطيل.
- نص المطالبة (يمكن إعداده عبر `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- المهلة: تستخدم دورات Heartbeat التي لم تُعيّن لها مهلة قيمة `agents.defaults.timeoutSeconds` عند تعيينها. وإلا فإنها تستخدم وتيرة Heartbeat بحد أقصى قدره 600 ثانية. عيّن `agents.defaults.heartbeat.timeoutSeconds` أو `agents.list[].heartbeat.timeoutSeconds` لكل وكيل لتنفيذ أعمال Heartbeat الأطول.
- تُرسل مطالبة Heartbeat **حرفيًا** بوصفها رسالة المستخدم. لا تتضمن مطالبة النظام قسمًا بعنوان "Heartbeats" إلا عندما يكون Heartbeat مفعّلًا للوكيل الافتراضي (وألا تكون قيمة `includeSystemPromptSection` هي `false`)، وتُعلّم عملية التشغيل داخليًا.
- عند تعطيل Heartbeat باستخدام `0m`، تحذف عمليات التشغيل العادية أيضًا `HEARTBEAT.md` من سياق التمهيد حتى لا يرى النموذج تعليمات مخصصة لـ Heartbeat فقط.
- تُفحص الساعات النشطة (`heartbeat.activeHours`) وفق المنطقة الزمنية المعدّة. خارج النافذة، يجري تخطي Heartbeat حتى النبضة التالية الواقعة داخل النافذة.
- يُؤجَّل Heartbeat تلقائيًا عندما يكون عمل Cron نشطًا أو في قائمة الانتظار. عيّن `heartbeat.skipWhenBusy: true` لتأجيل وكيل أيضًا أثناء انشغال وكيله الفرعي المرتبط بمفتاح الجلسة أو مسارات أوامره المتداخلة؛ لم يعد الوكلاء الأشقاء يتوقفون لمجرد وجود عمل جارٍ لوكيل فرعي تابع لوكيل آخر.

## الغرض من مطالبة Heartbeat

المطالبة الافتراضية عامة عن قصد:

- **المهام في الخلفية**: تحث عبارة "ضع المهام المعلّقة في الحسبان" الوكيل على مراجعة إجراءات المتابعة (صندوق الوارد والتقويم والتذكيرات والعمل في قائمة الانتظار) وإظهار أي أمر عاجل.
- **الاطمئنان على المستخدم**: تحث عبارة "اطمئن أحيانًا على المستخدم خلال النهار" على إرسال رسالة خفيفة من حين إلى آخر مثل "هل تحتاج إلى شيء؟"، مع تجنب الإزعاج ليلًا باستخدام منطقتك الزمنية المحلية المعدّة (راجع [المنطقة الزمنية](/ar/concepts/timezone)).

يمكن لـ Heartbeat التفاعل مع [المهام في الخلفية](/ar/automation/tasks) المكتملة، لكن عملية تشغيل Heartbeat نفسها لا تنشئ سجل مهمة.

إذا أردت من Heartbeat تنفيذ أمر محدد جدًا (مثل "تحقق من إحصاءات Gmail PubSub" أو "تحقق من سلامة Gateway")، فعيّن `agents.defaults.heartbeat.prompt` (أو `agents.list[].heartbeat.prompt`) إلى نص مخصص (يُرسل حرفيًا).

## عقد الاستجابة

- إذا لم يكن هناك ما يحتاج إلى الانتباه، فأجب بـ **`HEARTBEAT_OK`**.
- يمكن لعمليات تشغيل Heartbeat بدلًا من ذلك استدعاء `heartbeat_respond` مع `notify: false` لعدم إظهار تحديث مرئي، أو مع `notify: true` بالإضافة إلى `notificationText` لإرسال تنبيه. عند وجود استجابة الأداة المنظّمة، تكون لها الأولوية على الاستجابة النصية الاحتياطية.
- أثناء عمليات تشغيل Heartbeat، يتعامل OpenClaw مع `HEARTBEAT_OK` بوصفه إقرارًا عندما يظهر في **بداية الرد أو نهايته**. تُحذف العلامة ويُسقط الرد إذا كان المحتوى المتبقي **≤ `ackMaxChars`** (القيمة الافتراضية: 300).
- إذا ظهر `HEARTBEAT_OK` في **منتصف** الرد، فلا يُعامل معاملة خاصة.
- بالنسبة إلى التنبيهات، **لا** تضمّن `HEARTBEAT_OK`؛ أعد نص التنبيه فقط.

خارج عمليات Heartbeat، تُحذف أي علامة `HEARTBEAT_OK` زائدة في بداية الرسالة أو نهايتها ويُسجل ذلك؛ وتُسقط الرسالة إذا كانت لا تحتوي إلا على `HEARTBEAT_OK`.

## الإعداد

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
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### النطاق والأولوية

- يضبط `agents.defaults.heartbeat` السلوك العام لـ Heartbeat.
- تُدمج إعدادات `agents.list[].heartbeat` فوقها؛ إذا كان أي وكيل يحتوي على كتلة `heartbeat`، فإن **هؤلاء الوكلاء وحدهم** يشغّلون Heartbeat.
- يضبط `channels.defaults.heartbeat` القيم الافتراضية للظهور في جميع القنوات.
- يتجاوز `channels.<channel>.heartbeat` القيم الافتراضية للقناة.
- يتجاوز `channels.<channel>.accounts.<id>.heartbeat` (للقنوات متعددة الحسابات) الإعدادات الخاصة بالقناة.

### Heartbeat لكل وكيل

إذا تضمّن أي إدخال في `agents.list[]` كتلة `heartbeat`، فإن **هؤلاء الوكلاء وحدهم** يشغّلون Heartbeat. تُدمج الكتلة الخاصة بالوكيل فوق `agents.defaults.heartbeat` (بحيث يمكنك تعيين القيم الافتراضية المشتركة مرة واحدة وتجاوزها لكل وكيل).

مثال: وكيلان، والوكيل الثاني فقط يشغّل Heartbeat.

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

احصر Heartbeat ضمن ساعات العمل في منطقة زمنية محددة:

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

خارج هذه النافذة (قبل الساعة 9 صباحًا أو بعد الساعة 10 مساءً بالتوقيت الشرقي)، يجري تخطي Heartbeat. ستعمل النبضة المجدولة التالية داخل النافذة كالمعتاد.

### إعداد التشغيل على مدار الساعة

إذا أردت تشغيل Heartbeat طوال اليوم، فاستخدم أحد الأنماط التالية:

- احذف `activeHours` بالكامل (دون تقييد بنافذة زمنية؛ وهذا هو السلوك الافتراضي).
- عيّن نافذة ليوم كامل: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
لا تعيّن وقت `start` و`end` نفسه (مثلًا من `08:00` إلى `08:00`). يُعامل ذلك على أنه نافذة بعرض صفري، ولذلك يجري دائمًا تخطي Heartbeat.
</Warning>

### مثال متعدد الحسابات

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
  الفاصل الزمني لـ Heartbeat (سلسلة مدة؛ الوحدة الافتراضية = الدقائق).
</ParamField>
<ParamField path="model" type="string">
  تجاوز اختياري للنموذج في عمليات تشغيل Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  عند التفعيل، تُرسل أيضًا رسالة `Thinking` المنفصلة عند توفرها (بالبنية نفسها التي يستخدمها `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  عندما تكون القيمة صحيحة، تستخدم عمليات تشغيل Heartbeat سياق تمهيد خفيفًا ولا تحتفظ من ملفات تمهيد مساحة العمل إلا بـ `HEARTBEAT.md`.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  عندما تكون القيمة صحيحة، يعمل كل Heartbeat في جلسة جديدة دون أي سجل سابق للمحادثة. يستخدم نمط العزل نفسه الذي يستخدمه Cron مع `sessionTarget: "isolated"`. يقلل ذلك بصورة كبيرة تكلفة الرموز لكل Heartbeat. ادمجه مع `lightContext: true` لتحقيق أقصى قدر من التوفير. يظل توجيه التسليم يستخدم سياق الجلسة الرئيسية.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  عندما تكون القيمة صحيحة، تُؤجّل عمليات تشغيل Heartbeat أثناء انشغال المسارات الإضافية لذلك الوكيل: وكيله الفرعي المرتبط بمفتاح الجلسة أو عمل الأوامر المتداخل. تؤجل مسارات Cron دائمًا Heartbeat، حتى دون هذه العلامة، بحيث لا تشغّل مضيفات النماذج المحلية مطالبات Cron وHeartbeat في الوقت نفسه.
</ParamField>
<ParamField path="session" type="string">
  مفتاح جلسة اختياري لعمليات تشغيل Heartbeat.

- `main` (القيمة الافتراضية): الجلسة الرئيسية للوكيل.
- مفتاح جلسة صريح (انسخه من `openclaw sessions --json` أو من [CLI للجلسات](/ar/cli/sessions)).
- تنسيقات مفاتيح الجلسات: راجع [الجلسات](/ar/concepts/session) و[المجموعات](/ar/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: التسليم إلى آخر قناة خارجية مستخدمة.
- قناة صريحة: أي قناة معدّة أو معرّف Plugin، مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`.
- `none` (القيمة الافتراضية): تشغيل Heartbeat مع **عدم التسليم** خارجيًا.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  يتحكم في سلوك التسليم المباشر/عبر الرسائل الخاصة. `allow`: السماح بتسليم Heartbeat مباشرةً/عبر الرسائل الخاصة. `block`: منع التسليم المباشر/عبر الرسائل الخاصة (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  تجاوز اختياري للمستلِم (معرّف خاص بالقناة، مثل E.164 لـ WhatsApp أو معرّف دردشة Telegram). لمواضيع/سلاسل Telegram، استخدم `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  معرّف حساب اختياري للقنوات متعددة الحسابات. عندما تكون `target: "last"`، يُطبّق معرّف الحساب على آخر قناة تم حلّها إذا كانت تدعم الحسابات؛ وإلا يُتجاهل. إذا لم يتطابق معرّف الحساب مع حساب مُهيأ للقناة التي تم حلّها، يُتخطى التسليم.

</ParamField>
<ParamField path="prompt" type="string">
  يستبدل نص الموجّه الافتراضي (من دون دمج).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  يحدد ما إذا كان قسم `## Heartbeats` في موجّه النظام للوكيل الافتراضي سيُدرج. اضبطه على `false` للإبقاء على سلوك تشغيل Heartbeat (الوتيرة، والتسليم، وHEARTBEAT.md) مع حذف تعليمات Heartbeat من موجّه نظام الوكيل.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  الحد الأقصى للأحرف المسموح بها بعد `HEARTBEAT_OK` قبل التسليم.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  عندما تكون القيمة true، يمنع حمولات التحذير من أخطاء الأدوات أثناء عمليات تشغيل Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  الحد الأقصى للثواني المسموح بها لدورة وكيل Heartbeat قبل إيقافها. اتركه دون ضبط لاستخدام `agents.defaults.timeoutSeconds` عند ضبطه، وإلا فتُستخدم وتيرة Heartbeat بحد أقصى 600 ثانية.

</ParamField>
<ParamField path="activeHours" type="object">
  يقصر عمليات تشغيل Heartbeat على نافذة زمنية. كائن يحتوي على `start`‏ (HH:MM، شامل؛ استخدم `00:00` لبداية اليوم)، و`end`‏ (HH:MM، غير شامل؛ يُسمح بـ`24:00` لنهاية اليوم)، و`timezone` اختياري.

- عند الحذف أو استخدام `"user"`: تُستخدم `agents.defaults.userTimezone` إذا كانت مضبوطة، وإلا يُرجع إلى المنطقة الزمنية لنظام المضيف.
- `"local"`: يستخدم دائمًا المنطقة الزمنية لنظام المضيف.
- أي معرّف IANA (مثل `America/New_York`): يُستخدم مباشرة؛ وإذا كان غير صالح، يُرجع إلى سلوك `"user"` الموضح أعلاه.
- يجب ألا تتساوى `start` و`end` لنافذة نشطة؛ تُعامل القيم المتساوية على أنها نافذة بعرض صفري (أي خارج النافذة دائمًا).
- خارج النافذة النشطة، تُتخطى Heartbeat حتى النبضة التالية داخل النافذة.

</ParamField>

## سلوك التسليم

<AccordionGroup>
  <Accordion title="توجيه الجلسة والهدف">
    - تعمل Heartbeat افتراضيًا في الجلسة الرئيسية للوكيل (`agent:<id>:<mainKey>`)، أو في `global` عندما تكون `session.scope = "global"`. اضبط `session` للتجاوز إلى جلسة قناة محددة (Discord/WhatsApp/إلخ).
    - لا تؤثر `session` إلا في سياق التشغيل؛ ويتحكم `target` و`to` في التسليم.
    - للتسليم إلى قناة/مستلِم محدد، اضبط `target` + `to`. مع `target: "last"`، يستخدم التسليم آخر قناة خارجية لتلك الجلسة.
    - تسمح تسليمات Heartbeat افتراضيًا بالأهداف المباشرة/الرسائل الخاصة. اضبط `directPolicy: "block"` لمنع الإرسال إلى الأهداف المباشرة مع الاستمرار في تشغيل دورة Heartbeat.
    - إذا كان الصف الرئيسي، أو مسار الجلسة الهدف، أو مسار Cron، أو مهمة Cron نشطة مشغولًا، تُتخطى Heartbeat ويُعاد تنفيذها لاحقًا.
    - إذا كانت `skipWhenBusy: true`، فإن مسارات الوكلاء الفرعيين المرتبطة بمفتاح جلسة هذا الوكيل والمسارات المتداخلة تؤجل أيضًا عمليات تشغيل Heartbeat. لا تؤجل المسارات المشغولة للوكلاء الآخرين هذا الوكيل.
    - إذا لم ينتج عن حل `target` أي وجهة خارجية، يستمر التشغيل، لكن لا تُرسل أي رسالة صادرة.

  </Accordion>
  <Accordion title="سلوك الظهور والتخطي">
    - إذا كانت `showOk` و`showAlerts` و`useIndicator` كلها معطلة، يُتخطى التشغيل مسبقًا مع `reason=alerts-disabled`.
    - إذا كان تسليم التنبيهات وحده معطلًا، يظل بإمكان OpenClaw تشغيل Heartbeat، وتحديث الطوابع الزمنية للمهام المستحقة، واستعادة الطابع الزمني لخمول الجلسة، ومنع حمولة التنبيه الخارجية.
    - إذا كان هدف Heartbeat الذي تم حلّه يدعم مؤشر الكتابة، يعرض OpenClaw مؤشر الكتابة أثناء نشاط تشغيل Heartbeat. يستخدم ذلك الهدف نفسه الذي سترسل إليه Heartbeat مخرجات الدردشة، ويُعطّل بواسطة `typingMode: "never"`.

  </Accordion>
  <Accordion title="دورة حياة الجلسة والتدقيق">
    - الردود الخاصة بـHeartbeat فقط **لا** تُبقي الجلسة نشطة. قد تحدّث بيانات Heartbeat الوصفية صف الجلسة، لكن انتهاء الصلاحية بسبب الخمول يستخدم `lastInteractionAt` من آخر رسالة فعلية للمستخدم/القناة، ويستخدم انتهاء الصلاحية اليومي `sessionStartedAt`.
    - يُخفي سجل واجهة التحكم وWebChat موجّهات Heartbeat وإقرارات OK فقط. ومع ذلك، يمكن أن يظل نص الجلسة الأساسي محتويًا على تلك الدورات لأغراض التدقيق/إعادة التشغيل.
    - يمكن لـ[المهام الخلفية](/ar/automation/tasks) المنفصلة إضافة حدث نظام إلى الصف وإيقاظ Heartbeat عندما ينبغي للجلسة الرئيسية ملاحظة شيء بسرعة. لا يجعل ذلك الإيقاظ تشغيل Heartbeat مهمة خلفية.

  </Accordion>
</AccordionGroup>

## عناصر التحكم في الظهور

افتراضيًا، تُمنع إقرارات `HEARTBEAT_OK` بينما يُسلّم محتوى التنبيه. يمكنك ضبط ذلك لكل قناة أو لكل حساب:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # إخفاء HEARTBEAT_OK (افتراضي)
      showAlerts: true # إظهار رسائل التنبيه (افتراضي)
      useIndicator: true # إصدار أحداث المؤشر (افتراضي)
  telegram:
    heartbeat:
      showOk: true # إظهار إقرارات OK على Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # منع تسليم التنبيهات لهذا الحساب
```

الأولوية: لكل حساب ← لكل قناة ← إعدادات القناة الافتراضية ← الإعدادات الافتراضية المضمّنة.

### وظيفة كل علامة

- `showOk`: يرسل إقرار `HEARTBEAT_OK` عندما يعيد النموذج ردًا يحتوي على OK فقط.
- `showAlerts`: يرسل محتوى التنبيه عندما يعيد النموذج ردًا ليس OK.
- `useIndicator`: يصدر أحداث المؤشر لأسطح حالة واجهة المستخدم.

إذا كانت **الثلاثة جميعًا** false، يتخطى OpenClaw تشغيل Heartbeat بالكامل (من دون استدعاء النموذج).

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
      showOk: true # جميع حسابات Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # منع التنبيهات لحساب العمليات فقط
  telegram:
    heartbeat:
      showOk: true
```

### أنماط شائعة

| الهدف                                     | الإعداد                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| السلوك الافتراضي (إقرارات OK صامتة، والتنبيهات مفعّلة) | _(لا يلزم إعداد)_                                                                     |
| صامت تمامًا (لا رسائل ولا مؤشر) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| مؤشر فقط (لا رسائل)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| إقرارات OK في قناة واحدة فقط                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختياري)

إذا وُجد ملف `HEARTBEAT.md` في مساحة العمل، يطلب الموجّه الافتراضي من الوكيل قراءته. اعتبره «قائمة تحقق Heartbeat» الخاصة بك: صغيرة، وثابتة، وآمنة للمراجعة كل 30 دقيقة.

في عمليات التشغيل العادية، لا يُدرج `HEARTBEAT.md` إلا عندما تكون إرشادات Heartbeat مفعّلة للوكيل الافتراضي. يؤدي تعطيل وتيرة Heartbeat باستخدام `0m` أو ضبط `includeSystemPromptSection: false` إلى حذفه من سياق التمهيد العادي.

في بيئة Codex الأصلية، لا يُدرج محتوى `HEARTBEAT.md` في الدورة مثل ملفات التمهيد الأخرى. إذا كان الملف موجودًا ويحتوي على محتوى غير فارغ، تشير ملاحظة وضع تعاون Heartbeat إلى الملف وتطلب من Codex قراءته قبل المتابعة.

إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (لا يحتوي إلا على أسطر فارغة، أو تعليقات Markdown/HTML، أو عناوين Markdown مثل `# Heading`، أو علامات الأسوار، أو عناصر قائمة تحقق فارغة)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API. يُبلّغ عن هذا التخطي بوصفه `reason=empty-heartbeat-file`. إذا كان الملف مفقودًا، تظل Heartbeat قيد التشغيل ويقرر النموذج ما ينبغي فعله.

أبقِه صغيرًا جدًا (قائمة تحقق قصيرة أو تذكيرات) لتجنب تضخم الموجّه.

مثال على `HEARTBEAT.md`:

```md
# قائمة تحقق Heartbeat

- فحص سريع: هل يوجد شيء عاجل في صناديق الوارد؟
- إذا كان الوقت نهارًا، أجرِ متابعة خفيفة إن لم يكن هناك شيء آخر معلّق.
- إذا كانت مهمة محظورة، دوّن _ما هو مفقود_ واسأل Peter في المرة القادمة.
```

### كتل `tasks:`

يدعم `HEARTBEAT.md` أيضًا كتلة `tasks:` منظمة وصغيرة لإجراء عمليات تحقق قائمة على الفواصل الزمنية داخل Heartbeat نفسها.

مثال:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "تحقق من رسائل البريد الإلكتروني العاجلة غير المقروءة، وعلّم أي شيء حساس للوقت."
- name: calendar-scan
  interval: 2h
  prompt: "تحقق من الاجتماعات القادمة التي تحتاج إلى تحضير أو متابعة."

# تعليمات إضافية

- اجعل التنبيهات قصيرة.
- إذا لم يحتج أي شيء إلى الانتباه بعد جميع المهام المستحقة، فردّ بـHEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="السلوك">
    - يحلل OpenClaw كتلة `tasks:` ويتحقق من كل مهمة وفق `interval` الخاص بها.
    - لا تُدرج في موجّه Heartbeat لتلك النبضة إلا المهام **المستحقة**.
    - إذا لم تكن هناك مهام مستحقة، يُتخطى تشغيل Heartbeat بالكامل (`reason=no-tasks-due`) لتجنب استدعاء نموذج مهدور.
    - يُحفظ المحتوى غير المتعلق بالمهام في `HEARTBEAT.md` ويُلحق كسياق إضافي بعد قائمة المهام المستحقة.
    - تُخزن الطوابع الزمنية لآخر تشغيل للمهام في حالة الجلسة (`heartbeatTaskState`)، لذلك تستمر الفواصل الزمنية بعد عمليات إعادة التشغيل العادية.
    - لا تُقدّم الطوابع الزمنية للمهام إلا بعد أن يُكمل تشغيل Heartbeat مسار الرد العادي. عمليات التشغيل المتخطاة بسبب `empty-heartbeat-file` / `no-tasks-due` لا تضع علامة اكتمال على المهام.

  </Accordion>
</AccordionGroup>

يكون وضع المهام مفيدًا عندما تريد أن يحتوي ملف Heartbeat واحد على عدة عمليات تحقق دورية من دون دفع تكلفة تنفيذها جميعًا في كل نبضة.

### هل يمكن للوكيل تحديث HEARTBEAT.md؟

نعم، إذا طلبت منه ذلك.

`HEARTBEAT.md` مجرد ملف عادي في مساحة عمل الوكيل، لذا يمكنك أن تقول للوكيل (في دردشة عادية) شيئًا مثل:

- «حدّث `HEARTBEAT.md` لإضافة فحص يومي للتقويم.»
- «أعد كتابة `HEARTBEAT.md` ليكون أقصر ويركز على متابعات صندوق الوارد.»

إذا أردت أن يحدث ذلك استباقيًا، يمكنك أيضًا تضمين سطر صريح في موجّه Heartbeat مثل: «إذا أصبحت قائمة التحقق قديمة، فحدّث HEARTBEAT.md بقائمة أفضل.»

<Warning>
لا تضع الأسرار (مفاتيح API، أو أرقام الهواتف، أو الرموز الخاصة) في `HEARTBEAT.md`، لأنه يصبح جزءًا من سياق الموجّه.
</Warning>

## الإيقاظ اليدوي (عند الطلب)

استخدم `openclaw system event` لإضافة حدث نظام إلى الصف وتشغيل Heartbeat فورية اختياريًا:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| العلامة                         | الوصف                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | نص حدث النظام (مطلوب).                                                                    |
| `--mode <mode>`              | يشغّل `now` Heartbeat فورية؛ وينتظر `next-heartbeat` (افتراضي) النبضة المجدولة التالية. |
| `--session-key <sessionKey>` | يستهدف جلسة محددة للحدث؛ ويستخدم افتراضيًا الجلسة الرئيسية للوكيل.                   |
| `--json`                     | يُخرج JSON.                                                                                     |

إذا لم تُحدد `--session-key` وكان لدى عدة وكلاء إعداد `heartbeat`، فإن `--mode now` يشغّل Heartbeat لكل واحد من هؤلاء الوكلاء فورًا.

عناصر التحكم ذات الصلة بـHeartbeat في مجموعة CLI نفسها:

```bash
openclaw system heartbeat last     # عرض آخر حدث Heartbeat
openclaw system heartbeat enable   # تمكين Heartbeat
openclaw system heartbeat disable  # تعطيل Heartbeat
```

## تسليم الاستدلال (اختياري)

افتراضيًا، لا ترسل Heartbeat سوى حمولة «الإجابة» النهائية.

إذا أردت الشفافية، ففعّل:

- `agents.defaults.heartbeat.includeReasoning: true`

عند التفعيل، سترسل Heartbeat أيضًا رسالة منفصلة مسبوقة بـ `Thinking` (بالبنية نفسها للأمر `/reasoning on`). قد يكون ذلك مفيدًا عندما يدير الوكيل جلسات/نسخ Codex متعددة وتريد معرفة سبب قراره بتنبيهك، لكنه قد يكشف أيضًا تفاصيل داخلية أكثر مما تريد. يُفضّل إبقاؤه معطّلًا في المحادثات الجماعية.

## الوعي بالتكلفة

تشغّل Heartbeat دورات كاملة للوكيل. تستهلك الفواصل الزمنية الأقصر رموزًا أكثر. لتقليل التكلفة:

- استخدم `isolatedSession: true` لتجنّب إرسال سجل المحادثة الكامل (من نحو 100 ألف رمز إلى نحو 2–5 آلاف رمز لكل تشغيل).
- استخدم `lightContext: true` لقصر ملفات التمهيد على `HEARTBEAT.md` فقط.
- عيّن `model` أقل تكلفة (مثل `ollama/llama3.2:1b`).
- أبقِ `HEARTBEAT.md` صغيرًا.
- استخدم `target: "none"` إذا كنت تريد تحديثات الحالة الداخلية فقط.

## تجاوز سعة السياق بعد Heartbeat

تحافظ Heartbeat على نموذج وقت التشغيل الحالي للجلسة المشتركة بعد اكتمال التشغيل، لذا فإن Heartbeat التي بدّلت الجلسة إلى نموذج محلي أصغر (مثل نموذج Ollama بنافذة سياق حجمها 32 ألفًا) قد تُبقي ذلك النموذج مستخدمًا في الدورة التالية للجلسة الرئيسية. إذا أبلغت تلك الدورة التالية عن تجاوز سعة السياق، وكان آخر نموذج وقت تشغيل للجلسة يطابق `heartbeat.model` المُعدّ، فستشير رسالة الاسترداد في OpenClaw إلى تسرّب نموذج Heartbeat بوصفه السبب المحتمل وتقترح حلًا.

لتجنّب ذلك: استخدم `isolatedSession: true` لتشغيل Heartbeat في جلسة جديدة (ويمكن دمجه مع `lightContext: true` للحصول على أصغر موجّه)، أو اختر نموذج Heartbeat بنافذة سياق كبيرة بما يكفي للجلسة المشتركة.

## ذو صلة

- [الأتمتة](/ar/automation) - جميع آليات الأتمتة في لمحة
- [المهام في الخلفية](/ar/automation/tasks) - كيفية تتبّع العمل المنفصل
- [المنطقة الزمنية](/ar/concepts/timezone) - كيفية تأثير المنطقة الزمنية في جدولة Heartbeat
- [استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting) - تصحيح مشكلات الأتمتة
