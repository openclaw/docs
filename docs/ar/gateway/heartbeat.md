---
read_when:
    - ضبط وتيرة Heartbeat أو الرسائل
    - اتخاذ قرار بين Heartbeat وCron للمهام المجدولة
summary: رسائل استطلاع Heartbeat وقواعد الإشعارات
title: Heartbeat
x-i18n:
    generated_at: "2026-04-22T07:17:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13004e4e20b02b08aaf16f22cdf664d0b59da69446ecb30453db51ffdfd1d267
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat أم Cron؟** راجع [الأتمتة والمهام](/ar/automation) للحصول على إرشادات حول وقت استخدام كل منهما.

يشغّل Heartbeat **أدوار وكيل دورية** في الجلسة الرئيسية حتى يتمكن النموذج من
إظهار أي شيء يحتاج إلى انتباه من دون إغراقك بالرسائل.

Heartbeat هو دور مجدول في الجلسة الرئيسية — وهو **لا** ينشئ سجلات [مهام في الخلفية](/ar/automation/tasks).
سجلات المهام مخصّصة للعمل المنفصل (عمليات ACP، والوكلاء الفرعيون، ووظائف Cron المعزولة).

استكشاف الأخطاء وإصلاحها: [المهام المجدولة](/ar/automation/cron-jobs#troubleshooting)

## البدء السريع (للمبتدئين)

1. اترك Heartbeat مفعّلًا (القيمة الافتراضية هي `30m`، أو `1h` لمصادقة Anthropic OAuth/الرمز المميز، بما في ذلك إعادة استخدام Claude CLI) أو اضبط وتيرتك الخاصة.
2. أنشئ قائمة تحقق صغيرة في `HEARTBEAT.md` أو كتلة `tasks:` في مساحة عمل الوكيل (اختياري لكنه موصى به).
3. حدّد المكان الذي يجب أن تذهب إليه رسائل Heartbeat (`target: "none"` هو الخيار الافتراضي؛ اضبط `target: "last"` للتوجيه إلى آخر جهة اتصال).
4. اختياري: فعّل تسليم الاستدلال الخاص بـ Heartbeat لمزيد من الشفافية.
5. اختياري: استخدم سياق تهيئة خفيف إذا كانت تشغيلات Heartbeat تحتاج فقط إلى `HEARTBEAT.md`.
6. اختياري: فعّل الجلسات المعزولة لتجنب إرسال السجل الكامل للمحادثة مع كل Heartbeat.
7. اختياري: قيّد Heartbeat بالساعات النشطة (بالتوقيت المحلي).

مثال على الإعداد:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // تسليم صريح إلى آخر جهة اتصال (القيمة الافتراضية هي "none")
        directPolicy: "allow", // الافتراضي: السماح بالأهداف المباشرة/الرسائل الخاصة؛ اضبط "block" لكبتها
        lightContext: true, // اختياري: حقن HEARTBEAT.md فقط من ملفات التهيئة
        isolatedSession: true, // اختياري: جلسة جديدة لكل تشغيل (من دون سجل محادثة)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // اختياري: أرسل أيضًا رسالة `Reasoning:` منفصلة
      },
    },
  },
}
```

## القيم الافتراضية

- الفاصل الزمني: `30m` (أو `1h` عندما يكون وضع المصادقة المكتشف هو Anthropic OAuth/مصادقة الرمز المميز، بما في ذلك إعادة استخدام Claude CLI). اضبط `agents.defaults.heartbeat.every` أو لكل وكيل `agents.list[].heartbeat.every`؛ استخدم `0m` للتعطيل.
- نص المطالبة (قابل للتهيئة عبر `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- تُرسل مطالبة Heartbeat **حرفيًا** بوصفها رسالة المستخدم. وتتضمن
  مطالبة النظام قسمًا باسم “Heartbeat” فقط عندما تكون Heartbeat مفعّلة
  للوكيل الافتراضي، وعندما يتم تمييز التشغيل داخليًا.
- عند تعطيل Heartbeat باستخدام `0m`، تحذف التشغيلات العادية أيضًا `HEARTBEAT.md`
  من سياق التهيئة حتى لا يرى النموذج تعليمات خاصة بـ Heartbeat فقط.
- يتم التحقق من الساعات النشطة (`heartbeat.activeHours`) في المنطقة الزمنية المضبوطة.
  وخارج النافذة، يتم تخطي Heartbeat حتى النبضة التالية داخل النافذة.

## الغرض من مطالبة Heartbeat

المطالبة الافتراضية عامة عمدًا:

- **المهام في الخلفية**: عبارة “Consider outstanding tasks” تدفع الوكيل إلى مراجعة
  المتابعات (البريد الوارد، والتقويم، والتذكيرات، والعمل المدرج في قائمة الانتظار) وإبراز أي شيء عاجل.
- **التحقق مع الإنسان**: عبارة “Checkup sometimes on your human during day time” تدفع إلى
  إرسال رسالة خفيفة أحيانًا مثل “هل تحتاج إلى أي شيء؟”، لكنها تتجنب الإزعاج ليلًا
  باستخدام منطقتك الزمنية المحلية المضبوطة (راجع [/concepts/timezone](/ar/concepts/timezone)).

يمكن لـ Heartbeat التفاعل مع [المهام في الخلفية](/ar/automation/tasks) المكتملة، لكن تشغيل Heartbeat نفسه لا ينشئ سجل مهمة.

إذا أردت أن ينفّذ Heartbeat شيئًا محددًا جدًا (مثل “تحقق من إحصاءات Gmail PubSub”
أو “تحقق من سلامة Gateway”)، فاضبط `agents.defaults.heartbeat.prompt` (أو
`agents.list[].heartbeat.prompt`) على نص مخصص (يُرسل حرفيًا).

## عقد الاستجابة

- إذا لم يكن هناك ما يحتاج إلى انتباه، فردّ بـ **`HEARTBEAT_OK`**.
- أثناء تشغيلات Heartbeat، يتعامل OpenClaw مع `HEARTBEAT_OK` بوصفه
  إقرارًا عندما يظهر في **بداية الرد أو نهايته**. تتم إزالة الرمز ويُسقط الرد
  إذا كان المحتوى المتبقي **≤ `ackMaxChars`** (الافتراضي: 300).
- إذا ظهر `HEARTBEAT_OK` في **منتصف** الرد، فلن يُعامل
  معاملة خاصة.
- في التنبيهات، **لا** تُضمّن `HEARTBEAT_OK`؛ أعد نص التنبيه فقط.

خارج Heartbeat، تتم إزالة أي `HEARTBEAT_OK` عارض في بداية/نهاية الرسالة
ويُسجل؛ والرسالة التي تكون فقط `HEARTBEAT_OK` تُسقط.

## الإعداد

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // الافتراضي: 30m (0m يعطل)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // الافتراضي: false (تسليم رسالة Reasoning: منفصلة عند توفرها)
        lightContext: false, // الافتراضي: false؛ true يُبقي فقط HEARTBEAT.md من ملفات تهيئة مساحة العمل
        isolatedSession: false, // الافتراضي: false؛ true يشغّل كل Heartbeat في جلسة جديدة (من دون سجل محادثة)
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

### النطاق والأسبقية

- يضبط `agents.defaults.heartbeat` سلوك Heartbeat العام.
- يتم دمج `agents.list[].heartbeat` فوقه؛ وإذا كان لأي وكيل كتلة `heartbeat`، **فلن تشغّل Heartbeat إلا تلك الوكلاء فقط**.
- يضبط `channels.defaults.heartbeat` القيم الافتراضية للظهور لكل القنوات.
- يتجاوز `channels.<channel>.heartbeat` القيم الافتراضية الخاصة بالقنوات.
- يتجاوز `channels.<channel>.accounts.<id>.heartbeat` (القنوات متعددة الحسابات) إعدادات كل قناة على حدة.

### Heartbeat لكل وكيل

إذا كانت أي خانة في `agents.list[]` تتضمن كتلة `heartbeat`، فإن **تلك الوكلاء فقط**
هم الذين يشغّلون Heartbeat. ويتم دمج الكتلة الخاصة بكل وكيل فوق `agents.defaults.heartbeat`
(لذلك يمكنك ضبط القيم الافتراضية المشتركة مرة واحدة والتجاوز لكل وكيل).

مثال: وكيلان، والوكيل الثاني فقط هو الذي يشغّل Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // تسليم صريح إلى آخر جهة اتصال (القيمة الافتراضية هي "none")
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
        target: "last", // تسليم صريح إلى آخر جهة اتصال (القيمة الافتراضية هي "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // اختياري؛ يستخدم userTimezone إن كان مضبوطًا، وإلا يستخدم المنطقة الزمنية للمضيف
        },
      },
    },
  },
}
```

خارج هذه النافذة (قبل 9 صباحًا أو بعد 10 مساءً بالتوقيت الشرقي)، يتم تخطي Heartbeat. وستعمل النبضة المجدولة التالية داخل النافذة بشكل طبيعي.

### إعداد 24/7

إذا أردت تشغيل Heartbeat طوال اليوم، فاستخدم أحد هذه الأنماط:

- احذف `activeHours` بالكامل (من دون تقييد نافذة زمنية؛ وهذا هو السلوك الافتراضي).
- اضبط نافذة يوم كامل: `activeHours: { start: "00:00", end: "24:00" }`.

لا تضبط القيمتين `start` و`end` على الوقت نفسه (على سبيل المثال `08:00` إلى `08:00`).
فهذا يُعامل على أنه نافذة بعرض صفري، لذلك يتم دائمًا تخطي Heartbeat.

### مثال على تعدد الحسابات

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

- `every`: فاصل Heartbeat الزمني (سلسلة مدة؛ وحدة القياس الافتراضية = الدقائق).
- `model`: تجاوز اختياري للنموذج لتشغيلات Heartbeat (`provider/model`).
- `includeReasoning`: عند تفعيله، يسلّم أيضًا رسالة `Reasoning:` المنفصلة عند توفرها (بنفس صيغة `/reasoning on`).
- `lightContext`: عند تفعيله، تستخدم تشغيلات Heartbeat سياق تهيئة خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات تهيئة مساحة العمل.
- `isolatedSession`: عند تفعيله، تعمل كل تشغيلات Heartbeat في جلسة جديدة من دون أي سجل محادثة سابق. ويستخدم نمط العزل نفسه الموجود في Cron `sessionTarget: "isolated"`. وهذا يقلل بشكل كبير تكلفة الرموز لكل Heartbeat. اجمعه مع `lightContext: true` لتحقيق أقصى توفير. ويظل توجيه التسليم يستخدم سياق الجلسة الرئيسية.
- `session`: مفتاح جلسة اختياري لتشغيلات Heartbeat.
  - `main` (الافتراضي): الجلسة الرئيسية للوكيل.
  - مفتاح جلسة صريح (انسخه من `openclaw sessions --json` أو من [sessions CLI](/cli/sessions)).
  - صيغ مفاتيح الجلسة: راجع [الجلسات](/ar/concepts/session) و[المجموعات](/ar/channels/groups).
- `target`:
  - `last`: التسليم إلى آخر قناة خارجية مستخدمة.
  - قناة صريحة: أي قناة أو معرّف Plugin مهيأ، على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`.
  - `none` (الافتراضي): شغّل Heartbeat لكن **لا تسلّمه** خارجيًا.
- `directPolicy`: يتحكم في سلوك التسليم المباشر/الرسائل الخاصة:
  - `allow` (الافتراضي): السماح بتسليم Heartbeat المباشر/الرسائل الخاصة.
  - `block`: كبت التسليم المباشر/الرسائل الخاصة (`reason=dm-blocked`).
- `to`: تجاوز اختياري للمستلم (معرّف خاص بالقناة، مثل E.164 لـ WhatsApp أو معرّف دردشة Telegram). بالنسبة إلى topics/threads في Telegram، استخدم `<chatId>:topic:<messageThreadId>`.
- `accountId`: معرّف حساب اختياري للقنوات متعددة الحسابات. عندما يكون `target: "last"`، يُطبّق معرّف الحساب على آخر قناة محلولة إذا كانت تدعم الحسابات؛ وإلا فيتم تجاهله. وإذا لم يطابق معرّف الحساب حسابًا مهيأً للقناة المحلولة، فسيتم تخطي التسليم.
- `prompt`: يتجاوز نص المطالبة الافتراضي (من دون دمج).
- `ackMaxChars`: الحد الأقصى للأحرف المسموح بها بعد `HEARTBEAT_OK` قبل التسليم.
- `suppressToolErrorWarnings`: عند تفعيله، يكبت حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `activeHours`: يقيّد تشغيلات Heartbeat بنافذة زمنية. وهو كائن يحتوي على `start` (HH:MM، شامل؛ استخدم `00:00` لبداية اليوم)، و`end` (HH:MM غير شامل؛ يُسمح بـ `24:00` لنهاية اليوم)، و`timezone` اختياري.
  - إذا حُذف أو كان `"user"`: يستخدم `agents.defaults.userTimezone` إن كان مضبوطًا، وإلا يعود إلى المنطقة الزمنية لنظام المضيف.
  - `"local"`: يستخدم دائمًا المنطقة الزمنية لنظام المضيف.
  - أي معرّف IANA (مثل `America/New_York`): يُستخدم مباشرة؛ وإذا كان غير صالح، فسيعود إلى سلوك `"user"` المذكور أعلاه.
  - يجب ألا تكون `start` و`end` متساويتين بالنسبة إلى نافذة نشطة؛ فالقيم المتساوية تُعامل على أنها عرض صفري (دائمًا خارج النافذة).
  - خارج النافذة النشطة، يتم تخطي Heartbeat حتى النبضة التالية داخل النافذة.

## سلوك التسليم

- تعمل Heartbeat في الجلسة الرئيسية للوكيل افتراضيًا (`agent:<id>:<mainKey>`)،
  أو `global` عندما يكون `session.scope = "global"`. اضبط `session` لتجاوزه إلى
  جلسة قناة محددة (Discord/WhatsApp/إلخ).
- يؤثر `session` فقط في سياق التشغيل؛ ويتم التحكم في التسليم بواسطة `target` و`to`.
- للتسليم إلى قناة/مستلم محدد، اضبط `target` + `to`. ومع
  `target: "last"`، يستخدم التسليم آخر قناة خارجية لتلك الجلسة.
- تسمح عمليات تسليم Heartbeat بالأهداف المباشرة/الرسائل الخاصة افتراضيًا. اضبط `directPolicy: "block"` لكبت الإرسال إلى الأهداف المباشرة مع الاستمرار في تشغيل دور Heartbeat.
- إذا كان الطابور الرئيسي مشغولًا، يتم تخطي Heartbeat وتُعاد المحاولة لاحقًا.
- إذا لم يُحل `target` إلى وجهة خارجية، فسيستمر التشغيل لكن لن
  تُرسل أي رسالة صادرة.
- إذا كانت `showOk` و`showAlerts` و`useIndicator` كلها معطلة، فيتم تخطي التشغيل مسبقًا على أنه `reason=alerts-disabled`.
- إذا كان تسليم التنبيهات فقط معطلًا، فلا يزال بإمكان OpenClaw تشغيل Heartbeat، وتحديث الطوابع الزمنية للمهام المستحقة، واستعادة الطابع الزمني لخمول الجلسة، وكبت حمولة التنبيه الخارجية.
- إذا كان هدف Heartbeat المحلول يدعم مؤشر الكتابة، فسيعرض OpenClaw حالة الكتابة أثناء
  نشاط تشغيل Heartbeat. ويستخدم هذا الهدف نفسه الذي كان Heartbeat
  سيرسل إليه مخرجات الدردشة، ويُعطَّل بواسطة `typingMode: "never"`.
- الردود الخاصة بـ Heartbeat فقط **لا** تُبقي الجلسة نشطة؛ إذ تتم استعادة قيمة `updatedAt`
  الأخيرة حتى يعمل انتهاء الخمول بشكل طبيعي.
- يمكن لـ [المهام في الخلفية](/ar/automation/tasks) المنفصلة وضع حدث نظامي في الطابور وتنبيه Heartbeat عندما يجب أن تلاحظ الجلسة الرئيسية شيئًا بسرعة. ولا يجعل هذا التنبيه تشغيل Heartbeat مهمة في الخلفية.

## عناصر التحكم في الظهور

افتراضيًا، يتم كبت إقرارات `HEARTBEAT_OK` بينما يتم
تسليم محتوى التنبيه. ويمكنك ضبط ذلك لكل قناة أو لكل حساب:

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

الأسبقية: لكل حساب ← لكل قناة ← القيم الافتراضية للقناة ← القيم الافتراضية المضمّنة.

### ما الذي يفعله كل خيار

- `showOk`: يرسل إقرار `HEARTBEAT_OK` عندما يعيد النموذج ردًا يقتصر على OK.
- `showAlerts`: يرسل محتوى التنبيه عندما يعيد النموذج ردًا لا يحتوي على OK.
- `useIndicator`: يصدر أحداث المؤشر لواجهات حالة UI.

إذا كانت **الخيارات الثلاثة جميعها** false، فسيتخطى OpenClaw تشغيل Heartbeat بالكامل (من دون استدعاء للنموذج).

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

| الهدف | الإعداد |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| السلوك الافتراضي (إقرارات OK صامتة، والتنبيهات مفعلة) | _(لا حاجة إلى أي إعداد)_ |
| صامت بالكامل (لا رسائل، لا مؤشر) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| مؤشر فقط (من دون رسائل) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| إقرارات OK في قناة واحدة فقط | `channels.telegram.heartbeat: { showOk: true }` |

## `HEARTBEAT.md` (اختياري)

إذا كان ملف `HEARTBEAT.md` موجودًا في مساحة العمل، فإن المطالبة الافتراضية تطلب من
الوكيل قراءته. ويمكنك اعتباره “قائمة التحقق الخاصة بـ Heartbeat”: صغيرة، وثابتة،
وآمنة للتضمين كل 30 دقيقة.

في التشغيلات العادية، لا يتم حقن `HEARTBEAT.md` إلا عندما تكون إرشادات Heartbeat
مفعلة للوكيل الافتراضي. يؤدي تعطيل وتيرة Heartbeat باستخدام `0m` أو
ضبط `includeSystemPromptSection: false` إلى حذفه من سياق التهيئة
العادي.

إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (أسطر فارغة فقط وعناوين markdown
مثل `# Heading`)، فسيتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API.
ويتم الإبلاغ عن هذا التخطي على أنه `reason=empty-heartbeat-file`.
أما إذا كان الملف مفقودًا، فسيستمر Heartbeat في العمل ويقرر النموذج ما يجب فعله.

اجعله صغيرًا جدًا (قائمة تحقق قصيرة أو تذكيرات) لتجنب تضخم المطالبة.

مثال على `HEARTBEAT.md`:

```md
# قائمة التحقق الخاصة بـ Heartbeat

- فحص سريع: هل هناك شيء عاجل في صناديق الوارد؟
- إذا كان الوقت نهارًا، فقم بتحقق خفيف إذا لم يكن هناك شيء آخر معلق.
- إذا كانت هناك مهمة معطلة، فاكتب _ما الذي ينقص_ واسأل Peter في المرة القادمة.
```

### كتل `tasks:`

يدعم `HEARTBEAT.md` أيضًا كتلة `tasks:` منظمة صغيرة لعمليات
التحقق المعتمدة على الفاصل الزمني داخل Heartbeat نفسه.

مثال:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "تحقق من وجود رسائل بريد إلكتروني غير مقروءة وعاجلة وعلّم أي شيء حساس زمنيًا."
- name: calendar-scan
  interval: 2h
  prompt: "تحقق من الاجتماعات القادمة التي تحتاج إلى تحضير أو متابعة."

# تعليمات إضافية

- اجعل التنبيهات قصيرة.
- إذا لم يكن هناك ما يحتاج إلى انتباه بعد جميع المهام المستحقة، فردّ بـ HEARTBEAT_OK.
```

السلوك:

- يحلل OpenClaw كتلة `tasks:` ويفحص كل مهمة وفق `interval` الخاص بها.
- لا يتم تضمين سوى المهام **المستحقة** في مطالبة Heartbeat الخاصة بتلك النبضة.
- إذا لم تكن هناك مهام مستحقة، يتم تخطي Heartbeat بالكامل (`reason=no-tasks-due`) لتجنب استدعاء نموذج بلا فائدة.
- يتم الاحتفاظ بالمحتوى غير الخاص بالمهام في `HEARTBEAT.md` وإلحاقه كسياق إضافي بعد قائمة المهام المستحقة.
- يتم تخزين الطوابع الزمنية لآخر تشغيل للمهام في حالة الجلسة (`heartbeatTaskState`)، لذا تبقى الفواصل الزمنية محفوظة عبر عمليات إعادة التشغيل العادية.
- لا يتم تقديم الطوابع الزمنية للمهام إلا بعد أن يكمل تشغيل Heartbeat مسار الرد العادي. أما التشغيلات المتخطاة `empty-heartbeat-file` / `no-tasks-due` فلا تضع علامة على المهام على أنها مكتملة.

يفيد وضع المهام عندما تريد أن يحتوي ملف Heartbeat واحد على عدة عمليات تحقق دورية من دون دفع تكلفة جميعها في كل نبضة.

### هل يمكن للوكيل تحديث `HEARTBEAT.md`؟

نعم — إذا طلبت منه ذلك.

`HEARTBEAT.md` هو مجرد ملف عادي في مساحة عمل الوكيل، لذا يمكنك أن تطلب من
الوكيل (في دردشة عادية) شيئًا مثل:

- “حدّث `HEARTBEAT.md` لإضافة تحقق يومي من التقويم.”
- “أعد كتابة `HEARTBEAT.md` ليكون أقصر ومركزًا على متابعات صندوق الوارد.”

وإذا أردت أن يحدث ذلك بشكل استباقي، فيمكنك أيضًا تضمين سطر صريح في
مطالبة Heartbeat مثل: “إذا أصبحت قائمة التحقق قديمة، فحدّث HEARTBEAT.md
بقائمة أفضل.”

ملاحظة أمان: لا تضع أسرارًا (مفاتيح API، أو أرقام الهواتف، أو الرموز الخاصة) داخل
`HEARTBEAT.md` — لأنه يصبح جزءًا من سياق المطالبة.

## التنبيه اليدوي (عند الطلب)

يمكنك وضع حدث نظامي في الطابور وتشغيل Heartbeat فورًا باستخدام:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

إذا كان لدى عدة وكلاء إعداد `heartbeat`، فإن التنبيه اليدوي يشغّل Heartbeat الخاص بكل من هذه
الوكلاء فورًا.

استخدم `--mode next-heartbeat` لانتظار النبضة المجدولة التالية.

## تسليم الاستدلال (اختياري)

افتراضيًا، تسلّم Heartbeat حمولة “الإجابة” النهائية فقط.

إذا أردت مزيدًا من الشفافية، فعّل:

- `agents.defaults.heartbeat.includeReasoning: true`

عند التفعيل، ستسلّم Heartbeat أيضًا رسالة منفصلة مسبوقة بـ
`Reasoning:` (بنفس صيغة `/reasoning on`). وقد يكون ذلك مفيدًا عندما يكون الوكيل
يدير عدة جلسات/حالات codex وتريد معرفة سبب قراره بتنبيهك
— لكنه قد يكشف أيضًا تفاصيل داخلية أكثر مما تريد. ومن الأفضل إبقاؤه
معطلًا في الدردشات الجماعية.

## الوعي بالتكلفة

تشغّل Heartbeat أدوار وكيل كاملة. وكلما قصرت الفواصل الزمنية زاد استهلاك الرموز. لتقليل التكلفة:

- استخدم `isolatedSession: true` لتجنب إرسال السجل الكامل للمحادثة (من ~100K رمز إلى ~2-5K لكل تشغيل).
- استخدم `lightContext: true` لحصر ملفات التهيئة في `HEARTBEAT.md` فقط.
- اضبط `model` أرخص (مثل `ollama/llama3.2:1b`).
- اجعل `HEARTBEAT.md` صغيرًا.
- استخدم `target: "none"` إذا كنت تريد فقط تحديثات الحالة الداخلية.

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — نظرة سريعة على جميع آليات الأتمتة
- [المهام في الخلفية](/ar/automation/tasks) — كيفية تتبع العمل المنفصل
- [المنطقة الزمنية](/ar/concepts/timezone) — كيف تؤثر المنطقة الزمنية في جدولة Heartbeat
- [استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting) — تصحيح مشكلات الأتمتة
