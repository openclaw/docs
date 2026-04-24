---
read_when:
    - العمل على ميزات Telegram أو Webhooks
summary: حالة دعم بوت Telegram وإمكاناته وإعداده
title: Telegram
x-i18n:
    generated_at: "2026-04-24T07:32:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdd6ea0277e074f90306f91d51fd329c6914de85dde0ae09a731713f1bba98d9
    source_path: channels/telegram.md
    workflow: 15
---

جاهز للإنتاج لرسائل البوت المباشرة والمجموعات عبر grammY. يُعد الاقتراع الطويل الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة إصلاح.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط إعداد القنوات الكاملة والأمثلة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز البوت في BotFather">
    افتح Telegram وابدأ محادثة مع **@BotFather** (تأكد من أن اسم المستخدم هو بالضبط `@BotFather`).

    شغّل `/newbot`، واتبع المطالبات، واحفظ الرمز.

  </Step>

  <Step title="اضبط الرمز وسياسة الرسائل المباشرة">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    الرجوع إلى متغير البيئة: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram **مطلقًا** `openclaw channels login telegram`; اضبط الرمز في الإعدادات/البيئة، ثم ابدأ Gateway.

  </Step>

  <Step title="ابدأ Gateway ووافق على أول رسالة مباشرة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="أضف البوت إلى مجموعة">
    أضف البوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` ليتطابقا مع نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب تحليل الرمز واعٍ بالحساب. عمليًا، تفوز قيم الإعدادات على الرجوع إلى البيئة، وينطبق `TELEGRAM_BOT_TOKEN` على الحساب الافتراضي فقط.
</Note>

## الإعدادات من جهة Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعات">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، الذي يقيّد الرسائل الجماعية التي تستقبلها.

    إذا كان يجب على البوت رؤية جميع رسائل المجموعة، فقم بأحد الخيارين التاليين:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا على المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    يتم التحكم في حالة المشرف ضمن إعدادات مجموعة Telegram.

    تتلقى البوتات المشرفة جميع رسائل المجموعة، وهذا مفيد للسلوك الجماعي الدائم.

  </Accordion>

  <Accordion title="إعدادات BotFather المفيدة">

    - `/setjoingroups` للسماح/منع الإضافة إلى المجموعات
    - `/setprivacy` لسلوك الرؤية في المجموعات

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول إلى الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن تتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. وتُقبل البادئتان `telegram:` / `tg:` وتُوحَّدان.
    يؤدي `dmPolicy: "allowlist"` مع `allowFrom` فارغة إلى حظر جميع الرسائل المباشرة ويُرفض عبر التحقق من الإعدادات.
    يطلب الإعداد معرّفات المستخدمين الرقمية فقط.
    إذا قمت بالترقية وكان إعدادك يحتوي على إدخالات قائمة سماح من نوع `@username`، فشغّل `openclaw doctor --fix` لتحليلها (بأفضل جهد؛ ويتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة سماح مخزن الاقتران، فيمكن لـ `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (على سبيل المثال عندما تكون `dmPolicy: "allowlist"` من دون معرّفات صريحة بعد).

    بالنسبة إلى البوتات ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة للحفاظ على سياسة الوصول دائمة في الإعدادات (بدلًا من الاعتماد على موافقات الاقتران السابقة).

    لبس شائع: الموافقة على اقتران الرسائل المباشرة لا تعني «أن هذا المرسل مخوّل في كل مكان».
    يمنح الاقتران وصول الرسائل المباشرة فقط. وما يزال تخويل المرسلين في المجموعات يأتي من قوائم السماح الصريحة في الإعدادات.
    إذا كنت تريد «أن أكون مخوّلًا مرة واحدة وتعمل الرسائل المباشرة وأوامر المجموعات معًا»، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    الطريقة الأكثر أمانًا (من دون بوت تابع لجهة خارجية):

    1. أرسل رسالة مباشرة إلى بوتك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة جهة خارجية (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    يُطبّق عنصران للتحكم معًا:

    1. **أي المجموعات مسموح بها** (`channels.telegram.groups`)
       - من دون إعداد `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات إلى `groups` (أو `"*"`)
       - عند ضبط `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **أي المرسلين مسموح بهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. وإذا لم يُضبط، فسيعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (وتُوحَّد البادئتان `telegram:` / `tg:`).
    لا تضع معرّفات دردشات مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. فمعرّفات الدردشة السالبة يجب أن توضع تحت `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية في تخويل المرسلين.
    حد الأمان (`2026.2.25+`): لا يرث تخويل مرسلي المجموعات موافقات مخزن اقتران الرسائل المباشرة.
    يظل الاقتران خاصًا بالرسائل المباشرة فقط. وبالنسبة إلى المجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يُضبط `groupAllowFrom`، فسيعود Telegram إلى `allowFrom` في الإعدادات، وليس إلى مخزن الاقتران.
    نمط عملي للبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة تحت `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فستكون القيم الافتراضية وقت التشغيل هي الفشل المغلق `groupPolicy="allowlist"` ما لم يتم ضبط `channels.defaults.groupPolicy` صراحة.

    مثال: السماح لأي عضو في مجموعة محددة واحدة:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    مثال: السماح لمستخدمين محددين فقط داخل مجموعة محددة واحدة:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      خطأ شائع: `groupAllowFrom` ليست قائمة سماح لمجموعات Telegram.

      - ضع معرّفات دردشات مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` تحت `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` تحت `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى البوت.
    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب الردود في المجموعات الإشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة أصلية `@botusername`، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح تبديل الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    هذه تحدّث حالة الجلسة فقط. استخدم الإعدادات للاستمرارية.

    مثال على إعداد دائم:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    الحصول على معرّف دردشة المجموعة:

    - أعد توجيه رسالة من المجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص `getUpdates` في Bot API

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- تملك عملية Gateway قناة Telegram.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (ولا يختار النموذج القنوات).
- تُوحَّد الرسائل الواردة ضمن غلاف القنوات المشترك مع بيانات وصفية للردود وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات بحسب معرّف المجموعة. وتُلحق موضوعات المنتدى `:topic:<threadId>` للحفاظ على عزل الموضوعات.
- يمكن أن تحمل رسائل الرسائل المباشرة `message_thread_id`؛ يوجّهها OpenClaw بمفاتيح جلسات واعية بالخيوط ويحافظ على معرّف الخيط في الردود.
- يستخدم الاقتراع الطويل grammY runner مع تسلسل لكل دردشة/خيط. ويستخدم التوازي الكلي في حوض runner القيمة `agents.defaults.maxConcurrent`.
- يتم تشغيل إعادة تشغيل مراقب الاقتراع الطويل بعد 120 ثانية من دون اكتمال `getUpdates` للحيوية افتراضيًا. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان النشر لديك ما يزال يشهد إعادات تشغيل خاطئة لتوقف الاقتراع أثناء الأعمال الطويلة. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ كما أن التجاوزات لكل حساب مدعومة.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث الردود الجزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - يتم تعيين `progress` إلى `partial` في Telegram (للتوافق مع التسمية متعددة القنوات)
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأدوات/التقدم ستعيد استخدام رسالة المعاينة المعدلة نفسها (الافتراضي: `true`). اضبطه على `false` للاحتفاظ برسائل أدوات/تقدم منفصلة.
    - يتم تعيين `channels.telegram.streamMode` القديم وقيم `streaming` المنطقية تلقائيًا

    بالنسبة إلى الردود النصية فقط:

    - الرسائل المباشرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)
    - المجموعة/الموضوع: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)

    بالنسبة إلى الردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن البث على مستوى الكتلة. وعندما يُفعَّل البث على مستوى الكتلة صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    إذا كان نقل المسودة الأصلي غير متاح/مرفوضًا، يعود OpenClaw تلقائيًا إلى `sendMessage` + `editMessageText`.

    بث الاستدلال الخاص بـ Telegram فقط:

    - `/reasoning stream` يرسل الاستدلال إلى المعاينة المباشرة أثناء التوليد
    - يتم إرسال الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع إلى HTML">
    يستخدم النص الصادر في Telegram القيمة `parse_mode: "HTML"`.

    - يُحوَّل النص الشبيه بـ Markdown إلى HTML آمن لـ Telegram.
    - يتم تهريب HTML الخام للنموذج لتقليل فشل تحليل Telegram.
    - إذا رفض Telegram HTML المحلل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram عند بدء التشغيل عبر `setMyCommands`.

    الإعدادات الأصلية للأوامر:

    - `commands.native: "auto"` يفعّل الأوامر الأصلية لـ Telegram

    أضف إدخالات قائمة أوامر مخصصة:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "نسخ احتياطي Git" },
        { command: "generate", description: "إنشاء صورة" },
      ],
    },
  },
}
```

    القواعد:

    - تُوحَّد الأسماء (إزالة `/` البادئة، وأحرف صغيرة)
    - النمط الصالح: `a-z` و`0-9` و`_`، والطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - يمكن أن تستمر أوامر Plugin/Skills في العمل عند كتابتها حتى لو لم تظهر في قائمة Telegram

    إذا تم تعطيل الأوامر الأصلية، فستتم إزالة الأوامر المدمجة. وقد تستمر الأوامر المخصصة/أوامر Plugin في التسجيل إذا كانت مضبوطة.

    حالات فشل الإعداد الشائعة:

    - يشير الخطأ `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` إلى أن قائمة Telegram ما تزال متجاوزة للحد بعد التقليص؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل `channels.telegram.commands.native`.
    - يشير الخطأ `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً إلى أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر اقتران الأجهزة (`device-pair` Plugin)

    عند تثبيت Plugin ‏`device-pair`:

    1. يقوم `/pair` بإنشاء رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز bootstrap مميزًا قصير العمر. ويحافظ تسليم bootstrap المدمج على رمز Node الأساسي عند `scopes: []`؛ ويظل أي رمز operator تم تسليمه مقيّدًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. وتكون فحوصات نطاق bootstrap مسبوقة بالدور، لذلك فإن قائمة سماح operator تلك تلبي طلبات operator فقط؛ أما الأدوار غير operator فما تزال تحتاج إلى نطاقات تحت بادئة الدور الخاصة بها.

    إذا أعاد جهاز المحاولة مع تغيّر تفاصيل المصادقة (مثل الدور/النطاقات/المفتاح العام)، فسيتم استبدال الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [الاقتران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="الأزرار المضمنة">
    اضبط نطاق لوحة المفاتيح المضمنة:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    تجاوز لكل حساب:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    النطاقات:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (الافتراضي)

    يتم تعيين `capabilities: ["inlineButtons"]` القديم إلى `inlineButtons: "all"`.

    مثال على إجراء الرسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    يتم تمرير نقرات callback إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أداة Telegram ما يلي:

    - `sendMessage` (`to`, `content`, اختياريًا `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, اختياريًا `iconColor`, `iconCustomEmojiId`)

    تكشف إجراءات رسائل القناة أسماءً بديلة سهلة الاستخدام (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    عناصر التحكم في البوابات:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل منفصلة `channels.telegram.actions.*`.
    تستخدم عمليات الإرسال وقت التشغيل اللقطة النشطة من الإعدادات/الأسرار (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة تحليل مخصصة لـ SecretRef لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم خيوط الرد">
    يدعم Telegram وسوم خيوط الرد الصريحة في المخرجات المُنشأة:

    - `[[reply_to_current]]` يرد على الرسالة المشغِّلة
    - `[[reply_to:<id>]]` يرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    ملاحظة: يؤدي `off` إلى تعطيل خيوط الرد الضمنية. وما تزال وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="موضوعات المنتدى وسلوك الخيوط">
    المجموعات الفائقة الخاصة بالمنتدى:

    - تلحق مفاتيح جلسة الموضوع القيمة `:topic:<threadId>`
    - تستهدف الردود وإجراءات الكتابة خيط الموضوع
    - مسار إعداد الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    الحالة الخاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram ‏`sendMessage(...thread_id=1)`)
    - ما تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوعات: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من إعدادات المجموعة الافتراضية.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر ضبط `agentId` في إعداد الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // الموضوع العام → الوكيل الرئيسي
                "3": { agentId: "zu" },        // موضوع التطوير → وكيل zu
                "5": { agentId: "coder" }      // مراجعة الكود → وكيل coder
              }
            }
          }
        }
      }
    }
    ```

    يصبح لكل موضوع بعد ذلك مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط ACP دائم للموضوع**: يمكن لموضوعات المنتدى تثبيت جلسات ACP harness عبر ارتباطات ACP مكتوبة على المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بموضوع مثل `-1001234567890:topic:42`). وهو حاليًا محصور بموضوعات المنتدى في المجموعات/المجموعات الفائقة. راجع [ACP Agents](/ar/tools/acp-agents).

    **تشغيل ACP مرتبط بالخيط من الدردشة**: يقوم `/acp spawn <agent> --thread here|auto` بربط الموضوع الحالي بجلسة ACP جديدة؛ ويتم توجيه المتابعات إليها مباشرة. يثبّت OpenClaw تأكيد التشغيل داخل الموضوع. يتطلب ذلك `channels.telegram.threadBindings.spawnAcpSessions=true`.

    يكشف سياق القالب عن `MessageThreadId` و`IsForum`. وتحافظ دردشات الرسائل المباشرة التي تحتوي على `message_thread_id` على توجيه الرسائل المباشرة لكنها تستخدم مفاتيح جلسات واعية بالخيوط.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - أضف الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية

    مثال على إجراء الرسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### رسائل الفيديو

    يميز Telegram بين ملفات الفيديو وملاحظات الفيديو.

    مثال على إجراء الرسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ ويتم إرسال نص الرسالة المقدم بشكل منفصل.

    ### الملصقات

    معالجة الملصقات الواردة:

    - WEBP ثابت: يتم تنزيله ومعالجته (عنصر نائب `<media:sticker>`)
    - TGS متحرك: يتم تخطيه
    - WEBM فيديو: يتم تخطيه

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ملف ذاكرة التخزين المؤقت للملصقات:

    - `~/.openclaw/telegram/sticker-cache.json`

    يتم وصف الملصقات مرة واحدة (عند الإمكان) وتخزينها مؤقتًا لتقليل استدعاءات الرؤية المتكررة.

    فعّل إجراءات الملصقات:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    إجراء إرسال ملصق:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    البحث في الملصقات المخزنة مؤقتًا:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند التفعيل، يضيف OpenClaw إلى قائمة الانتظار أحداث نظام مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدمين على الرسائل التي أرسلها البوت فقط (بأفضل جهد عبر ذاكرة التخزين المؤقت للرسائل المرسلة).
    - ما تزال أحداث التفاعل تحترم عناصر التحكم في الوصول في Telegram (`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom`)؛ ويتم إسقاط المرسلين غير المصرح لهم.
    - لا يوفّر Telegram معرّفات خيوط في تحديثات التفاعل.
      - تُوجَّه المجموعات غير التابعة للمنتدى إلى جلسة دردشة المجموعة
      - تُوجَّه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    تتضمن `allowed_updates` الخاصة بالاقتراع/Webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار بينما يعالج OpenClaw رسالة واردة.

    ترتيب التحليل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرجوع إلى الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموزًا تعبيرية Unicode (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات من أحداث Telegram وأوامره">
    تكون كتابات إعدادات القناة مفعلة افتراضيًا (`configWrites !== false`).

    تتضمن الكتابات التي يطلقها Telegram ما يلي:

    - أحداث ترحيل المجموعات (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلبان تفعيل الأوامر)

    التعطيل:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="الاقتراع الطويل مقابل Webhook">
    الوضع الافتراضي هو الاقتراع الطويل. وبالنسبة إلى وضع Webhook، اضبط `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`، مع `webhookPath` و`webhookHost` و`webhookPort` الاختيارية (الافتراضيات: `/telegram-webhook` و`127.0.0.1` و`8787`).

    يرتبط المستمع المحلي بالعنوان `127.0.0.1:8787`. وبالنسبة إلى الإدخال العام، إما أن تضع وكيلًا عكسيًا أمام المنفذ المحلي أو تضبط `webhookHost: "0.0.0.0"` عن قصد.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحد `channels.telegram.mediaMaxMb` (الافتراضي 100) من حجم وسائط Telegram الواردة والصادرة.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (وإذا لم يُضبط، يُطبَّق افتراضي grammY).
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لحالات إعادة تشغيل توقف الاقتراع الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتعطله القيمة `0`.
    - يتم حاليًا تمرير سياق الرد/الاقتباس/إعادة التوجيه الإضافي كما ورد.
    - تتحكم قوائم السماح في Telegram أساسًا في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق الإضافي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات الإرسال في Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد.

    يمكن أن يكون هدف الإرسال عبر CLI معرّف دردشة رقميًا أو اسم مستخدم:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    تستخدم استطلاعات Telegram الأمر `openclaw message poll` وتدعم موضوعات المنتدى:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    علامات الاستطلاع الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` (من 5 إلى 600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لموضوعات المنتدى (أو استخدم هدف `:topic:`)

    يدعم الإرسال في Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يتمكن البوت من التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من رفعها كصور مضغوطة أو وسائط متحركة

    بوابات الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استطلاعات Telegram مع الإبقاء على الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات exec في Telegram">
    يدعم Telegram موافقات exec في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يُفعَّل تلقائيًا عند إمكانية تحليل موافق واحد على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرّفات المالك الرقمية من `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    يُظهر التسليم إلى القناة نص الأمر في الدردشة؛ فعِّل `channel` أو `both` فقط في المجموعات/الموضوعات الموثوقة. وعندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة اللاحقة. تنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح المستهدف (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة ذات البادئة `plugin:` عبر موافقات Plugin؛ وتُحل المعرفات الأخرى عبر موافقات exec أولًا.

    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو من المزوّد، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا إعداد في هذا السلوك:

| المفتاح                            | القيم             | الافتراضي | الوصف                                                                                           |
| ---------------------------------- | ----------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`    | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى الدردشة. ويكتم `silent` ردود الأخطاء بالكامل.                  |
| `channels.telegram.errorCooldownMs` | رقم (مللي ثانية) | `60000`   | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع فيض رسائل الأخطاء أثناء الانقطاعات. |

تُدعم تجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنفس وراثة مفاتيح إعداد Telegram الأخرى).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // كتم الأخطاء في هذه المجموعة
        },
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="البوت لا يستجيب لرسائل المجموعة غير الموجّهة بالإشارة">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع خصوصية Telegram برؤية كاملة.
      - BotFather: `/setprivacy` -> تعطيل
      - ثم أزل البوت وأعد إضافته إلى المجموعة
    - يحذّر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعات غير موجهة بالإشارة.
    - يمكن لـ `openclaw channels status --probe` فحص معرّفات مجموعات رقمية صريحة؛ أما حرف البدل `"*"` فلا يمكن فحص العضوية له.
    - اختبار سريع للجلسة: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقًا">

    - عندما يكون `channels.telegram.groups` موجودًا، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - فوّض هوية المرسل لديك (الاقتران و/أو `allowFrom` الرقمية)
    - ما يزال تخويل الأوامر يُطبَّق حتى عندما تكون سياسة المجموعة `open`
    - يعني الخطأ `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل القوائم الأصلية
    - يشير الخطأ `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً إلى مشكلات في الوصول عبر DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="عدم استقرار الاقتراع أو الشبكة">

    - قد يؤدي Node 22+ مع `fetch`/وكيل مخصص إلى سلوك إجهاض فوري إذا لم تتطابق أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ ويمكن أن يؤدي خروج IPv6 المعطل إلى فشل متقطع في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الحالات كأخطاء شبكة قابلة للاسترداد.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاقتراع وإعادة بناء نقل Telegram بعد 120 ثانية من دون اكتمال حيوية الاقتراع الطويل افتراضيًا.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` الطويلة سليمة لكن مضيفك ما يزال يبلغ عن إعادات تشغيل إيجابية كاذبة لتوقف الاقتراع. وتشير حالات التوقف المستمرة عادةً إلى مشكلات في الوكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - على مضيفات VPS ذات الخروج/TLS المباشر غير المستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2) و`dnsResultOrder=ipv4first`.
    - إذا كان مضيفك WSL2 أو كان يعمل بشكل أفضل صراحةً مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إن استجابات نطاقات القياس RFC 2544 (`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضيًا. وإذا كان عنوان IP مزيف موثوق أو
      وكيل شفاف يعيد كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/ذي استخدام خاص أثناء تنزيلات الوسائط، فيمكنك الاشتراك
      في تجاوز Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب تحت
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان وكيلك يحلل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطيرة معطلة أولًا. فوسائط Telegram تسمح بالفعل بنطاق
      القياس RFC 2544 افتراضيًا.

    <Warning>
      يؤدي `channels.telegram.network.dangerouslyAllowPrivateNetwork` إلى إضعاف حماية
      SSRF الخاصة بوسائط Telegram. استخدمه فقط في بيئات وكيل موثوقة يتحكم بها المشغّل
      مثل Clash أو Mihomo أو توجيه fake-IP في Surge عندما
      تنشئ إجابات خاصة أو ذات استخدام خاص خارج نطاق القياس
      RFC 2544. اتركه معطلًا للوصول العادي إلى Telegram عبر الإنترنت العام.
    </Warning>

    - تجاوزات البيئة (مؤقتة):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - تحقّق من إجابات DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

مزيد من المساعدة: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="حقول Telegram عالية الأهمية">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ الروابط الرمزية مرفوضة)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` على المستوى الأعلى (`type: "acp"`)
- موافقات exec: `execApprovals`, `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- الخيوط/الردود: `replyToMode`
- البث: `streaming` (المعاينة)، `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند إعداد معرّفي حساب أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا يعود OpenClaw إلى أول معرّف حساب مطبّع ويطلق `openclaw doctor` تحذيرًا. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقتران مستخدم Telegram مع Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك قائمة السماح للمجموعات والموضوعات.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    توجيه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="التوجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    ربط المجموعات والموضوعات بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات.
  </Card>
</CardGroup>
