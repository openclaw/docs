---
read_when:
    - العمل على ميزات Telegram أو Webhooks
summary: حالة دعم بوت Telegram وإمكاناته وإعداداته
title: Telegram
x-i18n:
    generated_at: "2026-07-16T13:48:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج للرسائل الخاصة بالمبوت والمجموعات عبر grammY. الاستقصاء الطويل هو وسيلة النقل الافتراضية؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل الخاصة الافتراضية لـ Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    أدلة تشخيص المشكلات وإصلاحها عبر القنوات.
  </Card>
  <Card title="إعداد Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة إعداد القنوات الكاملة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="إنشاء رمز البوت في BotFather">
    ينتهي كلا المسارين برمز تلصقه في OpenClaw — اختر أحدهما:

    - **مسار الدردشة**: افتح Telegram، وابدأ دردشة مع **@BotFather** (تأكد من أن المعرّف هو تمامًا `@BotFather`) وشغّل `/newbot` واتبع المطالبات واحفظ الرمز.
    - **مسار الويب**: افتح [تطبيق الويب الخاص بـ BotFather](https://t.me/BotFather?startapp) — فهو يعمل في جميع عملاء Telegram، بما فيها [web.telegram.org](https://web.telegram.org) — وأنشئ البوت في واجهة المستخدم، ثم انسخ رمزه.

  </Step>

  <Step title="إعداد الرمز وسياسة الرسائل الخاصة">

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

    المتغير البيئي الاحتياطي: `TELEGRAM_BOT_TOKEN` (للحساب الافتراضي فقط؛ يجب أن تستخدم الحسابات المسماة `botToken` أو `tokenFile`).
    لا يستخدم Telegram ‏`openclaw channels login telegram`؛ اضبط الرمز في الإعداد أو المتغير البيئي، ثم شغّل Gateway.

  </Step>

  <Step title="تشغيل Gateway والموافقة على أول رسالة خاصة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="إضافة البوت إلى مجموعة">
    أضف البوت إلى مجموعتك، ثم احصل على المعرّفين اللذين يتطلبهما الوصول إلى المجموعة:

    - معرّف مستخدم Telegram الخاص بك، لاستخدامه مع `allowFrom` / `groupAllowFrom`
    - معرّف دردشة مجموعة Telegram، ليكون المفتاح ضمن `channels.telegram.groups`

    احصل على معرّف دردشة المجموعة من `openclaw logs --follow` أو من بوت لمعرّفات الرسائل المُعاد توجيهها أو من `getUpdates` في Bot API. بعد السماح للمجموعة، يؤكد `/whoami@<bot_username>` معرّفي المستخدم والمجموعة.

    المعرّفات السالبة للمجموعات الفائقة التي تبدأ بـ `-100` هي معرّفات دردشة مجموعات. توضع ضمن `channels.telegram.groups`، لا ضمن `groupAllowFrom`.

  </Step>
</Steps>

<Note>
يراعي تحديد الرمز الحساب: يتغلب `tokenFile` على `botToken`، والذي يتغلب بدوره على المتغير البيئي، كما يتغلب الإعداد دائمًا على `TELEGRAM_BOT_TOKEN` (الذي لا يُحدَّد إلا للحساب الافتراضي). بعد بدء تشغيل ناجح، يخزّن OpenClaw هوية البوت مؤقتًا لمدة تصل إلى 24 ساعة كي تتخطى عمليات إعادة التشغيل استدعاء `getMe` إضافيًا؛ ويؤدي تغيير الرمز أو إزالته إلى مسح ذاكرة التخزين المؤقت هذه.
</Note>

## الإعدادات من جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية وإمكانية الظهور في المجموعات">
    تستخدم بوتات Telegram افتراضيًا **Privacy Mode**، مما يحد من رسائل المجموعة التي تتلقاها.

    للاطلاع على جميع رسائل المجموعة، يمكنك إما:

    - تعطيل وضع الخصوصية عبر `/setprivacy`، أو
    - تعيين البوت مشرفًا على المجموعة.

    بعد تبديل وضع الخصوصية، أزل البوت وأعد إضافته في كل مجموعة كي يطبق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُضبط حالة المشرف في إعدادات مجموعة Telegram. تتلقى البوتات المشرفة جميع رسائل المجموعة، وهو أمر مفيد للسلوك الدائم التشغيل في المجموعات.
  </Accordion>

  <Accordion title="خيارات BotFather المفيدة">

    - `/setjoingroups` — السماح بإضافة البوت إلى المجموعات أو منعها
    - `/setprivacy` — سلوك إمكانية الظهور في المجموعات

    تتوفر الإعدادات نفسها في [تطبيق الويب الخاص بـ BotFather](https://t.me/BotFather?startapp) إذا كنت تفضّل واجهة مستخدم على أوامر الدردشة.

  </Accordion>
</AccordionGroup>

## التطبيق المصغر للوحة التحكم

شغّل `/dashboard` في رسالة خاصة مع البوت لفتح لوحة تحكم OpenClaw داخل Telegram.

المتطلبات:

- `gateway.tailscale.mode: "serve"` أو `"funnel"` لعنوان URL المنشور عبر HTTPS للتطبيق المصغر.
- يجب أن يكون معرّف مستخدم Telegram الرقمي الخاص بك ضمن `allowFrom` الفعّالة للحساب المحدد أو ضمن `commands.ownerAllowFrom`.
- استخدم رسالة خاصة. في المجموعات، يرد `/dashboard` بـ `open this in a DM with the bot` ولا يرسل أي زر.
- عمليات تثبيت Docker: تتطلب أوضاع Serve/Funnel ربط Gateway بواجهة الاسترجاع بجوار `tailscaled`، وهو ما لا يمكن لشبكة الجسر ذات المنافذ المنشورة تلبيته. شغّل حاوية Gateway باستخدام `network_mode: host`، وثبّت مقبس `tailscaled` الخاص بالمضيف (`/var/run/tailscale`) بالإضافة إلى CLI ‏`tailscale` داخل الحاوية.

التطبيق المصغر هو مسار v1 مخصص لـ Tailscale فقط، ولا يدعم إطار iframe في Telegram Web.

## التحكم في الوصول والتنشيط

### هوية البوت في المجموعة

في المجموعات وموضوعات المنتديات، تؤدي الإشارة الصريحة إلى معرّف البوت المُعدّ (مثل `@my_bot`) إلى مخاطبة وكيل OpenClaw المحدد، حتى عندما يختلف اسم شخصية الوكيل عن اسم مستخدم Telegram. تظل سياسة الصمت في المجموعة سارية على الحركة غير ذات الصلة، لكن معرّف البوت نفسه لا يكون أبدًا «شخصًا آخر».

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.telegram.dmPolicy` في الوصول إلى الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يعثر على اسم مستخدم البوت أو يخمّنه إصدار أوامر إلى البوت. استخدمه فقط للبوتات العامة عمدًا ذات الأدوات المقيّدة بإحكام؛ وينبغي للبوتات ذات المالك الواحد استخدام `allowlist` مع معرّفات مستخدمين رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئتان `telegram:` / `tg:` وتُطبَّعان.
    في إعدادات الحسابات المتعددة، يمثل `channels.telegram.allowFrom` المقيّد على المستوى الأعلى حدًا للأمان: لا يجعل `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا ما لم تظل قائمة السماح الفعّالة المدمجة تحتوي على محرف بدل صريح.
    يمنع `dmPolicy: "allowlist"` مع `allowFrom` فارغة جميع الرسائل الخاصة، ويرفضه التحقق من صحة الإعداد.
    لا يطلب الإعداد سوى معرّفات المستخدمين الرقمية. إذا كان إعدادك يحتوي على إدخالات قائمة سماح `@username` من إعداد أقدم، فشغّل `openclaw doctor --fix` لتحويلها إلى معرّفات رقمية (بقدر الإمكان؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الاقتران، فيمكن لـ `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` لمسارات قائمة السماح (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    بالنسبة إلى البوتات ذات المالك الواحد، يُفضّل استخدام `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة بدلًا من الاعتماد على موافقات الاقتران السابقة.

    التباس شائع: لا تعني الموافقة على اقتران الرسائل الخاصة أن «هذا المرسل مخوّل في كل مكان». يمنح الاقتران الوصول إلى الرسائل الخاصة فقط. إذا لم يوجد مالك للأوامر بعد، فإن أول اقتران معتمد يضبط أيضًا `commands.ownerAllowFrom`، مما يمنح الأوامر الخاصة بالمالك والموافقات على التنفيذ حساب مشغّل صريحًا. ويظل تخويل مرسلي المجموعة مستمدًا من قوائم السماح الصريحة في الإعداد.
    للحصول على تخويل للرسائل الخاصة وأوامر المجموعة معًا بهوية واحدة: ضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`، وتأكد بالنسبة إلى الأوامر الخاصة بالمالك من أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    الطريقة الأكثر أمانًا (دون بوت تابع لجهة خارجية): أرسل رسالة خاصة إلى بوتك، وشغّل `openclaw logs --follow`، واقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    جهة خارجية (خصوصية أقل): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    يُطبَّق عنصران للتحكم معًا:

    1. **المجموعات المسموح بها** (`channels.telegram.groups`)
       - من دون إعداد `groups`، ومع `groupPolicy: "open"`: تجتاز أي مجموعة عمليات التحقق من معرّف المجموعة
       - من دون إعداد `groups`، ومع `groupPolicy: "allowlist"` (الافتراضي): تُحظر جميع المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - عند إعداد `groups`: يعمل بوصفه قائمة سماح (معرّفات صريحة أو `"*"`)

    2. **المرسلون المسموح لهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (الافتراضي) / `disabled`

    يرشّح `groupAllowFrom` مرسلي المجموعة؛ وإذا لم يُضبط، يعود Telegram إلى `allowFrom` (وليس مخزن الاقتران — لا يرث تخويل مرسلي المجموعة مطلقًا موافقات مخزن اقتران الرسائل الخاصة، وهو حد أمان منذ `2026.2.25`).
    ينبغي أن تكون إدخالات `groupAllowFrom` معرّفات رقمية لمستخدمي Telegram (تُطبَّع البادئتان `telegram:` / `tg:`)؛ وتُتجاهل الإدخالات غير الرقمية. لا تضع معرّفات دردشة المجموعات أو المجموعات الفائقة هنا — فمعرّفات الدردشة السالبة توضع ضمن `channels.telegram.groups`.
    نمط عملي للبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` من دون ضبط، واسمح بالمجموعات المستهدفة ضمن `channels.telegram.groups`.
    إذا كان `channels.telegram` مفقودًا تمامًا من الإعداد، تكون القيمة الافتراضية في وقت التشغيل هي `groupPolicy="allowlist"` التي تمنع الوصول افتراضيًا، ما لم يُضبط `channels.defaults.groupPolicy` صراحةً.

    إعداد مجموعة ذات مالك واحد:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    اختبر من المجموعة باستخدام `@<bot_username> ping`. لا تؤدي رسائل المجموعة العادية إلى تشغيل البوت عندما يكون `requireMention: true`.

    السماح لأي عضو في مجموعة محددة واحدة:

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

    السماح لمستخدمين محددين فقط داخل مجموعة محددة واحدة:

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
      خطأ شائع: لا يمثل `groupAllowFrom` قائمة سماح للمجموعات.

      - تُوضع معرّفات دردشة مجموعات Telegram أو مجموعاتها الفائقة السالبة (`-1001234567890`) ضمن `channels.telegram.groups`.
      - تُوضع معرّفات مستخدمي Telegram ‏(`8734062810`) ضمن `groupAllowFrom` لتحديد الأشخاص الذين يمكنهم تشغيل البوت داخل المجموعة المسموح بها.
      - لا تستخدم `groupAllowFrom: ["*"]` إلا للسماح لأي عضو في مجموعة مسموح بها بالتحدث إلى البوت.

    </Warning>

  </Tab>

  <Tab title="سلوك الإشارات">
    تتطلب الردود في المجموعات إشارة افتراضيًا. ويمكن أن تأتي الإشارة من:

    - إشارة `@botusername` أصلية، أو
    - نمط إشارة في `agents.list[].groupChat.mentionPatterns` أو `messages.groupChat.mentionPatterns`

    مفاتيح التبديل على مستوى الجلسة (للحالة فقط، ولا تُحفظ): `/activation always`، `/activation mention`. استخدم الإعداد للاستمرارية:

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

    يكون سياق سجل المجموعة مفعّلًا دائمًا ومقيدًا بـ `historyLimit`. اضبط `channels.telegram.historyLimit: 0` لتعطيل نافذة سجل المجموعة. يزيل `openclaw doctor --fix` المفتاح المتقاعد `includeGroupHistoryContext`.

    للحصول على معرّف دردشة المجموعة: أعد توجيه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`، أو اقرأ `chat.id` من `openclaw logs --follow`، أو افحص `getUpdates` في Bot API، أو شغّل `/whoami@<bot_username>` (بعد السماح للمجموعة).

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- يعمل Telegram داخل عملية Gateway.
- التوجيه حتمي: تعود الردود الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُوحَّد الرسائل الواردة ضمن مغلف القناة المشترك، مع بيانات وصفية للرد، وعناصر نائبة للوسائط، وسياق محفوظ لسلسلة الردود التي رصدها Gateway.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. وتُلحق موضوعات المنتدى `:topic:<threadId>`.
- يمكن أن تحمل رسائل المحادثات الخاصة `message_thread_id`؛ ويحافظ OpenClaw عليها في الردود. لا تنقسم جلسات موضوعات المحادثات الخاصة إلا عندما يُبلغ Telegram عبر `getMe` عن `has_topics_enabled: true` للبوت؛ وإلا فتبقى المحادثات الخاصة ضمن الجلسة المسطحة.
- يستخدم الاستطلاع الطويل مشغّل grammY مع تسلسل لكل محادثة/سلسلة. ويستخدم تزامن مستقبِل المشغّل `agents.defaults.maxConcurrent`.
- يحد بدء التشغيل متعدد الحسابات من تحقيقات `getMe` المتزامنة، كي لا تُطلق مجموعات البوتات الكبيرة تحقيقات جميع الحسابات دفعة واحدة.
- تحمي كل عملية Gateway الاستطلاع الطويل بحيث لا يستطيع استخدام رمز البوت سوى مستطلع نشط واحد في كل مرة. تشير تعارضات 409 المستمرة في `getUpdates` إلى وجود Gateway آخر من OpenClaw أو برنامج نصي أو مستطلع خارجي يستخدم الرمز نفسه.
- تُعيد آلية مراقبة الاستطلاع التشغيل افتراضيًا بعد 120 ثانية من دون اكتمال فحص حيوية `getUpdates`. لا ترفع `channels.telegram.pollingStallThresholdMs` (30000-600000، مع دعم التجاوزات لكل حساب) إلا إذا شهد نشرك عمليات إعادة تشغيل خاطئة بسبب تعطل الاستطلاع أثناء العمل طويل الأمد.
- لا تدعم Telegram Bot API إيصالات القراءة (لا ينطبق `sendReadReceipts`).

<Note>
  أُزيل `channels.telegram.dm.threadReplies` و`channels.telegram.direct.<chatId>.threadReplies`. شغّل `openclaw doctor --fix` بعد الترقية إذا ظل إعدادك يحتوي على هذين المفتاحين. يتبع توجيه موضوعات المحادثات الخاصة الآن `getMe.has_topics_enabled` في Telegram (يتحكم فيه وضع السلاسل في BotFather): تستخدم البوتات التي فُعّلت لها الموضوعات جلسات محادثات خاصة محددة النطاق بالسلسلة عندما يرسل Telegram‏ `message_thread_id`؛ وتبقى المحادثات الخاصة الأخرى ضمن الجلسة المسطحة.
</Note>

## مرجع الميزات

<AccordionGroup>
  <Accordion title="المعاينة المباشرة للبث (تعديلات الرسائل)">
    يبث OpenClaw الردود الجزئية في الوقت الفعلي ضمن المحادثات المباشرة والمجموعات والموضوعات: يرسل رسالة معاينة، ثم ينفّذ `editMessageText` مرارًا، ويُتمّها في موضعها.

    - القيمة `channels.telegram.streaming` هي `off | partial | block | progress` (الافتراضي: `partial`)
    - تُؤجَّل معاينات الإجابات الأولية القصيرة، ثم تُنشأ بعد مهلة محدودة إذا ظل التشغيل نشطًا
    - يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير لتقدم الأدوات، ويعرض تسمية الحالة المستقرة عندما يصل نشاط الإجابة قبل تقدم الأداة، ويمحوها عند الاكتمال، ويرسل الإجابة النهائية كرسالة عادية
    - يتحكم `streaming.preview.toolProgress` في ما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة المعدّلة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأوامر/التنفيذ ضمن تلك الأسطر: `raw` (الافتراضي) أو `status` (تسمية الأداة فقط)
    - يتيح `streaming.progress.commentary` (الافتراضي: `false`) تضمين نص تعليق/تمهيد المساعد في مسودة التقدم المؤقتة
    - تُكتشف القيم القديمة `channels.telegram.streamMode`، والقيم المنطقية لـ `streaming`، ومفاتيح معاينة المسودة الأصلية المتقاعدة؛ شغّل `openclaw doctor --fix` لترحيلها

    أسطر تقدم الأدوات هي تحديثات الحالة القصيرة التي تظهر أثناء تشغيل الأدوات (تنفيذ الأوامر، وقراءة الملفات، وتحديثات التخطيط، وملخصات التصحيحات، وتمهيد/تعليق Codex في وضع خادم التطبيق). يُبقيها Telegram مفعّلة افتراضيًا (بما يطابق السلوك المنشور منذ `v2026.4.22`+).

    أبقِ تعديلات معاينة الإجابة مع إخفاء أسطر تقدم الأدوات:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    أبقِ تقدم الأدوات ظاهرًا مع إخفاء نص الأوامر/التنفيذ:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    يعرض وضع `progress` تقدم الأدوات من دون تعديل الإجابة النهائية داخل تلك الرسالة. ضع سياسة نص الأوامر ضمن `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    يعطّل `streaming.mode: "off"` تعديلات المعاينة ويمنع رسائل الأدوات/التقدم العامة بدلًا من إرسالها كرسائل حالة مستقلة؛ وتظل مطالبات الموافقة والوسائط والأخطاء تمر عبر التسليم النهائي العادي. ويُبقي `streaming.preview.toolProgress: false` تعديلات معاينة الإجابة فقط.

    <Note>
      تمثل الردود على الاقتباسات المحددة الاستثناء. عندما تكون قيمة `replyToMode` هي `first` أو `all` أو `batched`، وتحتوي الرسالة الواردة على نص اقتباس محدد، يرسل OpenClaw الإجابة النهائية عبر مسار الرد الأصلي على الاقتباس في Telegram بدلًا من تعديل معاينة الإجابة، لذا لا يستطيع `streaming.preview.toolProgress` عرض أسطر الحالة في ذلك الدور. وتظل الردود على الرسالة الحالية من دون نص اقتباس محدد تُبث. اضبط `replyToMode: "off"` عندما تكون رؤية تقدم الأدوات أهم من الردود الأصلية على الاقتباسات، أو `streaming.preview.toolProgress: false` لقبول هذه المفاضلة.
    </Note>

    بالنسبة إلى الردود النصية فقط: تتلقى المعاينات القصيرة التعديل النهائي في موضعها؛ وتعيد النتائج النهائية الطويلة التي تنقسم إلى رسائل متعددة استخدام المعاينة كالمقطع الأول، ثم ترسل الباقي فقط؛ وتمحو النتائج النهائية في وضع التقدم مسودة الحالة وتستخدم التسليم النهائي العادي؛ وإذا فشل التعديل النهائي قبل تأكيد الاكتمال، يعود OpenClaw إلى التسليم النهائي العادي وينظف المعاينة القديمة. وبالنسبة إلى الردود المعقدة (حُمولات الوسائط)، يعود OpenClaw دائمًا إلى التسليم النهائي العادي وينظف المعاينة.

    بث المعاينة وبث الكتل متنافيان — فعندما يُفعَّل بث الكتل صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    الاستدلال: يبث `/reasoning stream` الاستدلال إلى المعاينة المباشرة أثناء الإنشاء، ثم يحذف معاينة الاستدلال بعد التسليم النهائي (استخدم `/reasoning on` لإبقائها ظاهرة). وتُرسل الإجابة النهائية من دون نص الاستدلال.

  </Accordion>

  <Accordion title="تنسيق الرسائل الغنية">
    يستخدم النص الصادر رسائل HTML القياسية في Telegram افتراضيًا، وهي قابلة للقراءة عبر العملاء الحاليين: نص عريض، ومائل، وروابط، وشيفرة، ومحتوى مخفي، واقتباسات — وليس كتل Bot API 10.2 الغنية فقط (الجداول الأصلية، والتفاصيل، والوسائط الغنية، والصيغ).

    فعّل رسائل Bot API 10.2 الغنية:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    عند التفعيل: يُبلَّغ الوكيل بأن الرسائل الغنية متاحة لهذا البوت/الحساب (مع عقد التأليف المدعوم باستخدام Markdown وجزر HTML)؛ ويُصيَّر نص Markdown عبر تمثيل Markdown الوسيط في OpenClaw إلى كتل غنية محددة الأنواع من Bot API 10.2 (العناوين، والجداول، والتفاصيل، وقوائم التحقق، والوسائط الغنية، والصيغ، والخرائط، والصور المجمعة)؛ وتظل تسميات الوسائط التوضيحية تستخدم تسميات HTML التوضيحية في Telegram (لا تحل الرسائل الغنية محل التسميات التوضيحية، ويبلغ حدها 1024 حرفًا).

    يُبقي هذا نص النموذج بعيدًا عن رموز Markdown الغني في Telegram، بحيث لا تُفسَّر العملات مثل `$400-600K` على أنها تعبيرات رياضية. وينقسم النص الغني الطويل تلقائيًا وفق حدود Telegram. وتعود الجداول التي تتجاوز حد 20 عمودًا إلى كتلة شيفرة.

    الافتراضي: معطّل، لضمان توافق العملاء — إذ تعرض بعض إصدارات عملاء Desktop وWeb وAndroid والعملاء الخارجيين الحالية الرسائل الغنية المقبولة على أنها غير مدعومة. أبقِ هذا الخيار معطّلًا ما لم يتمكن كل عميل مستخدم مع البوت من عرضها. يوضّح `/status` ما إذا كانت الرسائل الغنية مفعّلة أو معطّلة في الجلسة الحالية.

    معاينات الروابط مفعّلة افتراضيًا. يعطّل `channels.telegram.linkPreview: false` الاكتشاف التلقائي للكيانات في النص الغني.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تُسجَّل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`. ويفعّل `commands.native: "auto"` الأوامر الأصلية لـ Telegram.

    أضف إدخالات أوامر مخصصة إلى القائمة:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "نسخة Git احتياطية" },
        { command: "generate", description: "إنشاء صورة" },
      ],
    },
  },
}
```

    القواعد: تُطبَّع الأسماء (بإزالة `/` البادئة وتحويلها إلى أحرف صغيرة)؛ والنمط الصالح هو `a-z` و`0-9` و`_`، والطول 1-32؛ ولا تستطيع الأوامر المخصصة تجاوز الأوامر الأصلية؛ وتُتخطى التعارضات/التكرارات وتُسجَّل.

    الأوامر المخصصة مجرد إدخالات في القائمة — ولا تنفّذ السلوك تلقائيًا. ويمكن أن تظل أوامر Plugin/Skills تعمل عند كتابتها حتى إذا لم تظهر في قائمة Telegram. وإذا عُطّلت الأوامر الأصلية، تُزال الأوامر المضمّنة؛ وقد تظل أوامر Plugin/الأوامر المخصصة تُسجَّل إذا كانت مضبوطة.

    إخفاقات الإعداد الشائعة:

    - ظهور `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` بعد إعادة محاولة الاختصار يعني أن القائمة لا تزال تتجاوز الحد؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل `channels.telegram.commands.native`.
    - فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر curl المباشرة لـ Bot API يعني عادةً أن `channels.telegram.apiRoot` ضُبط على نقطة نهاية `/bot<TOKEN>` الكاملة. يجب أن يكون `apiRoot` جذر Bot API فقط؛ ويزيل `openclaw doctor --fix` اللاحقة `/bot<TOKEN>` المضافة بالخطأ.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المضبوط. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` (الحساب الافتراضي) برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستطلاع، لذا لا يُبلَّغ عن ذلك كفشل في تنظيف Webhook.
    - يشير `setMyCommands failed` المصحوب بأخطاء الشبكة/الجلب عادةً إلى حظر DNS/HTTPS الصادر إلى `api.telegram.org`.

    ### أوامر إقران الأجهزة (Plugin ‏`device-pair`)

    عند تثبيته:

    1. ينشئ `/pair` رمز إعداد
    2. ألصق الرمز في تطبيق iOS
    3. يسرد `/pair pending` الطلبات المعلّقة (بما فيها الدور/النطاقات)
    4. للموافقة: `/pair approve <requestId>` أو `/pair approve` (الطلب المعلّق الوحيد) أو `/pair approve latest`

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (الدور، أو النطاقات، أو المفتاح العام)، يُستبدل الطلب المعلّق السابق بطلب `requestId` جديد؛ أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [الإقران](/ar/channels/pairing#pair-via-telegram).

  </Accordion>

  <Accordion title="الأزرار المضمّنة">
    اضبط نطاق لوحة المفاتيح المضمّنة:

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

    النطاقات: `off` و`dm` و`group` و`all` و`allowlist` (الافتراضي). يرتبط `capabilities: ["inlineButtons"]` القديم بـ `"all"`.

    مثال لإجراء رسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "اختر خيارًا:",
  buttons: [
    [
      { text: "نعم", callback_data: "yes" },
      { text: "لا", callback_data: "no" },
    ],
    [{ text: "إلغاء", callback_data: "cancel" }],
  ],
}
```

    مثال لزر تطبيق مصغر:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "افتح التطبيق:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "تشغيل", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    لا تعمل أزرار `web_app` إلا في المحادثات الخاصة بين المستخدم والبوت.

    تُمرَّر نقرات الاستدعاء التي لا تطالب بها أي معالِجات تفاعلية مسجّلة لـ plugin إلى الوكيل كنص: `callback_data: <value>`.

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    الإجراءات:

    - `sendMessage` (`to`، `content`، و`mediaUrl` اختياري، و`replyToMessageId`، و`messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content` أو `caption`، وأزرار `presentation` المضمّنة اختيارية؛ تحدّث التعديلات التي تقتصر على الأزرار ترميز الرد)
    - `createForumTopic` (`chatId`، `name`، و`iconColor` اختياري، و`iconCustomEmojiId`)

    الأسماء البديلة الميسّرة: `send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`.

    التحكّم في الإتاحة: `channels.telegram.actions.sendMessage`، `deleteMessage`، `reactions`، `sticker` (الافتراضي: معطّل). تكون `edit` و`createForumTopic` و`editForumTopic` مفعّلة افتراضيًا بلا مفتاح تبديل مخصّص.
    تستخدم عمليات الإرسال في وقت التشغيل لقطة الإعدادات/الأسرار النشطة منذ بدء التشغيل/إعادة التحميل، ولذلك لا تعيد مسارات الإجراءات تحليل قيم `SecretRef` عند كل إرسال.

    دلالات إزالة التفاعلات: [/tools/reactions](/ar/tools/reactions).

  </Accordion>

  <Accordion title="وسوم تسلسل الردود">
    وسوم تسلسل الردود الصريحة في المخرجات المنشأة:

    - `[[reply_to_current]]` — يرد على الرسالة المشغِّلة
    - `[[reply_to:<id>]]` — يرد على معرّف رسالة محدد

    `channels.telegram.replyToMode`: `off` (الافتراضي)، `first`، `all`.

    عند تمكين تسلسل الردود وتوفّر النص/التعليق الأصلي، يضيف OpenClaw مقتطف اقتباس أصليًا تلقائيًا. يقصر Telegram نص الاقتباس الأصلي على 1024 وحدة ترميز UTF-16؛ تُقتبس الرسائل الأطول من بدايتها، ويُرجع إلى رد عادي إذا رفض Telegram الاقتباس.

    يعطّل `off` تسلسل الردود الضمني فقط؛ وتظل وسوم `[[reply_to_*]]` الصريحة مطبّقة.

  </Accordion>

  <Accordion title="موضوعات المنتدى وسلوك سلاسل المحادثات">
    مجموعات المنتدى الفائقة: تُلحق مفاتيح جلسات الموضوع `:topic:<threadId>`؛ وتستهدف الردود وحالة الكتابة سلسلة الموضوع؛ ومسار إعداد الموضوع هو `channels.telegram.groups.<chatId>.topics.<threadId>`.

    الموضوع العام (`threadId=1`) حالة خاصة: تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram القيمة `sendMessage(...thread_id=1)` برسالة "سلسلة المحادثة غير موجودة")، لكن إجراءات الكتابة تظل تتضمن `message_thread_id` (وهو مطلوب تجريبيًا لظهور مؤشر الكتابة).

    ترث إدخالات الموضوع إعدادات المجموعة ما لم تُتجاوز (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`). يقتصر `agentId` على الموضوع ولا يرث الإعدادات الافتراضية للمجموعة. يضبط `topics."*"` الإعدادات الافتراضية لكل موضوع في تلك المجموعة؛ وتظل معرّفات الموضوعات الدقيقة مقدّمة على `"*"`.

    **توجيه الوكيل حسب الموضوع**: يمكن توجيه كل موضوع إلى وكيل مختلف عبر `agentId` في إعداد الموضوع، ما يمنحه مساحة عمل وذاكرة وجلسة خاصة به:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // الموضوع العام -> الوكيل الرئيسي
                "3": { agentId: "zu" },        // موضوع التطوير -> الوكيل zu
                "5": { agentId: "coder" }      // مراجعة الشفرة -> الوكيل coder
              }
            }
          }
        }
      }
    }
    ```

    يصبح لكل موضوع حينئذٍ مفتاح جلسة خاص به، مثل `agent:zu:telegram:group:-1001234567890:topic:3`.

    **ربط موضوع ACP الدائم**: يمكن لموضوعات المنتدى تثبيت جلسات حاضنة ACP عبر روابط مكتوبة من المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بموضوع مثل `-1001234567890:topic:42`). يقتصر النطاق حاليًا على موضوعات المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بسلسلة من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجّه المتابعات إليها مباشرةً، ويثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب `channels.telegram.threadBindings.spawnSessions` (الافتراضي: `true`).

    يوفّر سياق القالب `MessageThreadId` و`IsForum`. تحتفظ محادثات الرسائل المباشرة التي تتضمن `message_thread_id` ببيانات الرد الوصفية، لكنها لا تستخدم مفاتيح جلسات تراعي سلاسل المحادثات إلا عندما يُبلغ `getMe` في Telegram عن `has_topics_enabled: true`.
    أزيل تجاوزا `dm.threadReplies` و`direct.*.threadReplies` المتقاعدان؛ ويُعد وضع سلاسل المحادثات في BotFather المصدر الوحيد للحقيقة. شغّل `openclaw doctor --fix` لإزالة مفاتيح الإعداد القديمة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميّز Telegram الملاحظات الصوتية عن الملفات الصوتية. الافتراضي: سلوك الملف الصوتي؛ ضع وسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية. تُدرج نصوص الملاحظات الصوتية الواردة في سياق الوكيل بوصفها نصًا مولّدًا آليًا وغير موثوق، لكن اكتشاف الإشارات يظل يستخدم النص الخام، بحيث تستمر الرسائل الصوتية المشروطة بالإشارة في العمل.

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

    يميّز Telegram ملفات الفيديو عن ملاحظات الفيديو. لا تدعم ملاحظات الفيديو التعليقات؛ ويُرسل نص الرسالة المقدّم بصورة منفصلة.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### المواقع والأماكن

    استخدم إجراء `send` الحالي مع كائن `location` مستقل واحد. ترسل الإحداثيات دبوسًا أصليًا؛ وتؤدي إضافة كل من `name` و`address` إلى إرسال بطاقة مكان أصلية. لا يمكن دمج عمليات إرسال الموقع مع نص الرسالة أو الوسائط.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "برج إيفل",
    address: "شامب دي مارس، باريس",
  },
}
```

    ### الملصقات

    الوارد: يُنزّل WEBP الثابت ويُعالج (العنصر النائب `<media:sticker>`)؛ ويُتخطى TGS المتحرك وWEBM للفيديو.

    حقول سياق الملصق: `Sticker.emoji`، `Sticker.setName`، `Sticker.fileId`، `Sticker.fileUniqueId`، `Sticker.cachedDescription`. تُخزّن الأوصاف مؤقتًا في حالة plugin الخاصة بـ OpenClaw في SQLite لتقليل استدعاءات الرؤية المتكررة.

    تمكين إجراءات الملصقات:

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

    الإرسال:

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
  query: "قطة تلوّح",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    تصل تفاعلات Telegram كتحديثات `message_reaction`، منفصلة عن حمولات الرسائل. عند التمكين، يضع OpenClaw أحداث النظام مثل `Telegram reaction added: 👍 by Alice (@alice) on msg 42` في قائمة الانتظار.

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    تعني `own` تفاعلات المستخدمين مع الرسائل التي أرسلها البوت فقط (بأفضل جهد عبر ذاكرة مؤقتة للرسائل المرسلة). تظل أحداث التفاعل خاضعة لعناصر تحكّم الوصول في Telegram (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ ويُستبعد المرسلون غير المصرح لهم.

    لا يوفّر Telegram معرّفات سلاسل المحادثات في تحديثات التفاعل: تُوجّه المجموعات غير التابعة لمنتدى إلى جلسة محادثة المجموعة؛ وتُوجّه مجموعات المنتدى إلى جلسة الموضوع العام (`:topic:1`)، لا إلى الموضوع الأصلي الدقيق.

    تتضمن `allowed_updates` للاستقصاء/Webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة. ويحدد `messages.ackReactionScope` *متى* يُرسل.

    **ترتيب تحديد الرمز التعبيري:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرجوع إلى الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    يتوقع Telegram رمزًا تعبيريًا من Unicode (مثل "👀")؛ استخدم `""` لتعطيل التفاعل لقناة أو حساب.

    **النطاق (`messages.ackReactionScope`، الافتراضي `"group-mentions"`؛ لا يوجد حاليًا تجاوز على مستوى حساب Telegram أو قناة Telegram):**

    `all` (الرسائل المباشرة + المجموعات، بما فيها أحداث الغرف المحيطة)، `direct` (الرسائل المباشرة فقط)، `group-all` (كل رسالة جماعية باستثناء أحداث الغرف المحيطة، ولا رسائل مباشرة)، `group-mentions` (المجموعات عندما يُشار إلى البوت؛ **لا رسائل مباشرة** — الافتراضي)، `off` / `none` (معطّل).

    <Note>
    لا يطلق النطاق الافتراضي (`group-mentions`) تفاعلات الإقرار في الرسائل المباشرة أو أحداث الغرف المحيطة. استخدم `direct` أو `all` للرسائل المباشرة؛ وحده `all` يقرّ بأحداث الغرف المحيطة. تُقرأ هذه القيمة عند بدء موفّر Telegram، ولذلك تلزم إعادة تشغيل Gateway ليصبح التغيير نافذًا.
    </Note>

  </Accordion>

  <Accordion title="كتابة الإعدادات من أحداث Telegram وأوامره">
    تُفعّل كتابة إعدادات القناة افتراضيًا (`configWrites !== false`). تشمل عمليات الكتابة التي يشغّلها Telegram أحداث ترحيل المجموعة (`migrate_to_chat_id`، وتحديثات `channels.telegram.groups`) و`/config set` / `/config unset` (يتطلب تمكين الأوامر).

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

  <Accordion title="الاستقصاء الطويل مقابل Webhook">
    الافتراضي هو الاستقصاء الطويل. لوضع Webhook، عيّن `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ ويمكن اختياريًا تعيين `webhookPath` (الافتراضي `/telegram-webhook`)، و`webhookHost` (الافتراضي `127.0.0.1`)، و`webhookPort` (الافتراضي `8787`)، و`webhookCertPath` (شهادة PEM موقعة ذاتيًا لإعدادات عنوان IP المباشر أو بلا نطاق).

    في وضع الاستقصاء الطويل، يحفظ OpenClaw علامة إعادة التشغيل المائية فقط بعد توزيع التحديث بنجاح؛ ويترك المعالِج الفاشل ذلك التحديث قابلًا لإعادة المحاولة في العملية نفسها بدلًا من وضع علامة اكتمال عليه.

    يرتبط المستمع المحلي بـ `127.0.0.1:8787` افتراضيًا. للدخول العام، ضع وكيلًا عكسيًا أمام المنفذ المحلي، أو عيّن `webhookHost: "0.0.0.0"` عمدًا.

    يتحقق وضع Webhook من حواجز الطلب ورمز Telegram السري ونص JSON، ثم يودع التحديث في قائمة انتظار الدخول الدائمة قبل إرجاع `200` فارغ. يتضمن التبنّي الدائم الناجح `x-openclaw-delivery-accepted: durable`؛ أما استجابات الصحة والتوجيه والمصادقة والتحقق وأخطاء التخزين فتحذف هذا الترويس. يمكن للوكلاء العكسيين ووحدات تحكّم المضيف اشتراط الترويس لتمييز تبنّي OpenClaw عن `200` فارغ عام دون استنتاج القبول من توقيت الاستجابة.

    يعالج OpenClaw بعد ذلك التحديث بصورة غير متزامنة عبر مسارات البوت نفسها الخاصة بكل محادثة/موضوع والمستخدمة في الاستقصاء الطويل، بحيث لا تؤخر دورات الوكيل البطيئة إقرار التسليم من Telegram.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة ووجهات CLI">
    - `channels.telegram.textChunkLimit` القيمة الافتراضية 4000؛ يفضّل `streaming.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - `channels.telegram.mediaMaxMb` (القيمة الافتراضية 100) يضع حدًا أقصى لحجم الوسائط الواردة والصادرة.
    - `channels.telegram.mediaGroupFlushMs` (القيمة الافتراضية 500، والنطاق 10-60000) يتحكم في مدة تخزين الألبومات/مجموعات الوسائط مؤقتًا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زِده إذا وصلت أجزاء الألبوم متأخرة؛ وقلّله لتقليل زمن استجابة الرد على الألبوم.
    - `channels.telegram.timeoutSeconds` يتجاوز مهلة عميل API (تُطبّق القيمة الافتراضية لـ grammY إذا لم يُضبط). تقيّد عملاء البوت القيم المضبوطة التي تقل عن حاجز طلب النص/الكتابة الصادر البالغ 60 ثانية، كي لا يُجهض grammY تسليم الرد المرئي قبل أن يتمكن حاجز النقل والمسار الاحتياطي في OpenClaw من العمل. يظل الاستقصاء الطويل يستخدم حاجز طلب `getUpdates` مدته 45 ثانية كي لا تُترك عمليات الاستقصاء الخاملة بلا نهاية.
    - `channels.telegram.pollingStallThresholdMs` قيمته الافتراضية 120000؛ اضبطه بين 30000 و600000 فقط عند حدوث عمليات إعادة تشغيل بسبب اكتشاف خاطئ لتوقف الاستقصاء.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (القيمة الافتراضية 50)؛ ويؤدي `0` إلى تعطيله.
    - يُطبّع السياق الإضافي للرد/الاقتباس/إعادة التوجيه في نافذة سياق محادثة واحدة محددة عندما يكون Gateway قد رصد الرسائل الأصلية؛ وتوجد ذاكرة التخزين المؤقت للرسائل المرصودة في حالة Plugin ضمن SQLite في OpenClaw، بينما يستورد `openclaw doctor --fix` الملفات الجانبية القديمة. لا يضمّن Telegram سوى `reply_to_message` سطحي واحد لكل تحديث، لذلك تقتصر السلاسل الأقدم من ذاكرة التخزين المؤقت على حمولة البيانات هذه.
    - تتحكم قوائم السماح في Telegram أساسًا في مَن يمكنه تشغيل الوكيل، ولا تمثل حدًا كاملًا لتنقيح السياق الإضافي.
    - سجل الرسائل المباشرة: `channels.telegram.dmHistoryLimit`، و`channels.telegram.dms["<user_id>"].historyLimit`.
    - ينطبق `channels.telegram.retry` على مساعدات الإرسال في Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد إعادة محاولة محدودة وآمنة للإرسال عند حالات الفشل السابقة للاتصال، لكنه لا يعيد محاولة أغلفة الشبكة الملتبسة بعد الإرسال، إذ قد تؤدي إلى تكرار الرسائل المرئية.

    تقبل وجهات الإرسال في CLI وأداة الرسائل معرّف دردشة رقميًا أو اسم مستخدم أو وجهة موضوع منتدى:

```bash
openclaw message send --channel telegram --target 123456789 --message "مرحبًا"
openclaw message send --channel telegram --target @name --message "مرحبًا"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "مرحبًا بالموضوع"
```

    تستخدم الاستطلاعات `openclaw message poll` وتدعم موضوعات المنتدى:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "هل ننشره؟" --poll-option "نعم" --poll-option "لا"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "اختر وقتًا" --poll-option "10 صباحًا" --poll-option "2 مساءً" \
  --poll-duration-seconds 300 --poll-public
```

    أعلام الاستطلاع الخاصة بـ Telegram فقط: `--poll-duration-seconds` ‏(5-600)، و`--poll-anonymous`، و`--poll-public`، و`--thread-id` (أو وجهة `:topic:`). يكرر `--poll-option` من 2 إلى 12 مرة (الحد الأقصى لخيارات Telegram).

    يدعم إرسال Telegram أيضًا `--presentation` مع كتل `buttons` للوحات المفاتيح المضمّنة (عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك)، و`--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبّت عندما يستطيع البوت التثبيت في تلك الدردشة، و`--force-document` لإرسال الصور وملفات GIF ومقاطع الفيديو الصادرة كمستندات بدلًا من الرفع المضغوط/المتحرك/المرئي.

    تقييد الإجراءات: يعطّل `channels.telegram.actions.sendMessage=false` جميع الرسائل الصادرة بما فيها الاستطلاعات؛ ويعطّل `channels.telegram.actions.poll=false` إنشاء الاستطلاعات مع إبقاء عمليات الإرسال العادية مفعّلة.

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن تكون هوية الموافقين معرّفات مستخدمين رقمية في Telegram.

    - `channels.telegram.execApprovals.enabled` (يُفعّل `"auto"` عند إمكانية التعرّف على موافق واحد على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرّفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: ‏`dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`، و`sessionFilter`

    تتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` في مَن يمكنه التحدث إلى البوت وفي موضع إرساله للردود العادية، لكنها لا تجعل أي شخص موافقًا على التنفيذ. يؤدي أول اقتران معتمد عبر رسالة مباشرة إلى تهيئة `commands.ownerAllowFrom` عندما لا يوجد مالك للأوامر بعد، بحيث تعمل إعدادات المالك الواحد دون تكرار المعرّفات ضمن `execApprovals.approvers`.

    يعرض التسليم إلى القناة نص الأمر في الدردشة؛ لا تفعّل `channel` أو `both` إلا في المجموعات/الموضوعات الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمّنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بالواجهة المستهدفة (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة التي تبدأ بالبادئة `plugin:` عبر موافقات Plugin؛ أما غيرها فتُحل أولًا عبر موافقات التنفيذ.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزوّد، تتحكم سياسة الأخطاء في وصول رسائل الخطأ إلى دردشة Telegram:

| المفتاح                                 | القيم                     | القيمة الافتراضية         | الوصف                                                                                                                                                                                              |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`، `once`، `silent` | `always`        | يرسل `always` كل رسالة خطأ إلى الدردشة. يرسل `once` كل رسالة خطأ فريدة مرة واحدة لكل نافذة تهدئة (ويحجب الأخطاء المتطابقة المتكررة). لا يرسل `silent` رسائل الخطأ إلى الدردشة مطلقًا. |
| `channels.telegram.errorCooldownMs` | رقم (مللي ثانية)                | `14400000` (4 ساعات) | نافذة التهدئة لسياسة `once`. بعد إرسال خطأ، تُحجب الرسالة نفسها حتى انقضاء هذا الفاصل الزمني. يمنع ذلك إغراق الدردشة بالأخطاء أثناء حالات الانقطاع.                                           |

تُدعم التجاوزات لكل حساب ولكل مجموعة ولكل موضوع (بنفس آلية التوارث لمفاتيح إعداد Telegram الأخرى).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // حجب الأخطاء في هذه المجموعة
        },
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا يستجيب البوت لرسائل المجموعة التي لا تتضمن إشارة">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع الخصوصية في Telegram بالرؤية الكاملة: BotFather ‏`/setprivacy` -> Disable، ثم أزل البوت من المجموعة وأعد إضافته إليها.
    - يحذّر `openclaw channels status` عندما تتوقع الإعدادات رسائل مجموعة بلا إشارة.
    - يفحص `openclaw channels status --probe` معرّفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص عضوية حرف البدل `"*"`.
    - اختبار سريع للجلسة: `/activation always`.

  </Accordion>

  <Accordion title="لا يرى البوت رسائل المجموعة إطلاقًا">

    - عند وجود `channels.telegram.groups`، يجب إدراج المجموعة (أو تضمين `"*"`).
    - تحقق من عضوية البوت في المجموعة.
    - راجع `openclaw logs --follow` لمعرفة أسباب التخطي.

  </Accordion>

  <Accordion title="تعمل الأوامر جزئيًا أو لا تعمل إطلاقًا">

    - صرّح بهوية المرسل (الاقتران و/أو `allowFrom` الرقمي)؛ يظل تصريح الأوامر ساريًا حتى عندما تكون سياسة المجموعة `open`.
    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على إدخالات أكثر من اللازم؛ قلّل أوامر Plugin أو Skills أو الأوامر المخصصة، أو عطّل القوائم الأصلية.
    - تكون استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات الكتابة `sendChatAction` محدودة، وتُعاد محاولتها مرة واحدة عبر مسار النقل الاحتياطي في Telegram عند انتهاء مهلة الطلب. تعني أخطاء الشبكة/الجلب المستمرة عادةً تعذّر الوصول عبر DNS/HTTPS إلى `api.telegram.org`.

  </Accordion>

  <Accordion title="يبلّغ بدء التشغيل عن رمز غير مصرّح به">

    - `getMe returned 401` هو فشل مصادقة في Telegram لرمز البوت المضبوط. انسخ الرمز مجددًا أو أعد توليده في BotFather، ثم حدّث `channels.telegram.botToken` أو `tokenFile` أو `accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` (الحساب الافتراضي).
    - يُعد `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل فشل مصادقة أيضًا؛ فمعاملته باعتباره «لا يوجد Webhook» لن تؤدي إلا إلى تأجيل فشل الرمز غير الصالح نفسه حتى استدعاء API لاحق.

  </Accordion>

  <Accordion title="عدم استقرار الاستقصاء أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع جلب/وكيل مخصص إلى سلوك إجهاض فوري إذا لم تتطابق أنواع `AbortSignal`.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ ويتسبب خروج IPv6 المعطّل في حالات فشل متقطعة لـ API.
    - تُعاد محاولة السجلات التي تحتوي على `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!` باعتبارها أخطاء شبكة قابلة للاسترداد.
    - أثناء بدء تشغيل الاستقصاء، يعيد OpenClaw استخدام فحص `getMe` الناجح عند بدء التشغيل لصالح grammY، كي لا يحتاج المشغّل إلى `getMe` ثانٍ قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء تشغيل الاستقصاء، ينتقل OpenClaw إلى الاستقصاء الطويل بدلًا من إجراء استدعاء آخر لمستوى التحكم قبل الاستقصاء. يظهر Webhook الذي لا يزال نشطًا عندئذٍ كتعارض `getUpdates`؛ ويعيد OpenClaw بناء النقل ويحاول تنظيف Webhook مجددًا.
    - إذا أُعيد تدوير مقابس Telegram وفق وتيرة ثابتة قصيرة، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ إذ تقيّد عملاء البوت القيم المضبوطة التي تقل عن حواجز الطلب الصادر و`getUpdates`، لكن الإصدارات الأقدم كان يمكن أن تُجهض كل عملية استقصاء أو رد عند ضبطها دون تلك الحواجز.
    - يعني `Polling stall detected` في السجلات أن OpenClaw يعيد تشغيل الاستقصاء ويعيد بناء النقل بعد مرور 120 ثانية دون اكتمال إثبات حيوية الاستقصاء الطويل افتراضيًا.
    - يحذّر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استقصاء قيد التشغيل قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستقصاء قديمًا.
    - ارفع `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` طويلة التشغيل سليمة، لكن مضيفك لا يزال يبلّغ عن عمليات إعادة تشغيل خاطئة بسبب توقف الاستقصاء. تشير حالات التوقف المستمرة عادةً إلى مشكلات في الوكيل أو DNS أو IPv6 أو خروج TLS إلى `api.telegram.org`.
    - يراعي Telegram متغيرات بيئة وكيل العملية لنقل Bot API: ‏`HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY`، وصيغها المكتوبة بأحرف صغيرة. لا يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا كان `OPENCLAW_PROXY_URL` مضبوطًا لبيئة خدمة ولا توجد متغيرات بيئة وكيل قياسية، يستخدم Telegram عنوان URL هذا لنقل Bot API أيضًا.
    - على مضيفات VPS ذات خروج مباشر/TLS غير مستقر، وجّه استدعاءات Telegram API عبر وكيل:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2). يراعي ترتيب نتائج DNS في Telegram القيمة `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم الإعداد الافتراضي للعملية (على سبيل المثال `NODE_OPTIONS=--dns-result-order=ipv4first`)؛ ويعود إلى `ipv4first` على Node 22+ إذا لم ينطبق أي منها.
    - على WSL2، أو عندما يعمل السلوك المعتمد على IPv4 فقط بشكل أفضل، افرض تحديد العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق قياس الأداء RFC 2544‏ (`198.18.0.0/15`) مسموح بها بالفعل افتراضيًا لتنزيل وسائط Telegram. إذا أعاد وكيل fake-IP موثوق أو وكيل شفاف كتابة `api.telegram.org` إلى عنوان خاص/داخلي/ذي استخدام خاص آخر أثناء تنزيل الوسائط، ففعّل التجاوز الخاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر خيار التفعيل نفسه لكل حساب على حدة في `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان وكيلك يحل أسماء مضيفي وسائط Telegram إلى `198.18.x.x`، فاترك العلامة الخطرة معطلة أولًا — فهذا النطاق مسموح به بالفعل افتراضيًا.

    <Warning>
      تُضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية Telegram لوسائطه من SSRF. استخدمها فقط في بيئات الوكيل الموثوقة التي يتحكم فيها المشغّل (توجيه fake-IP في Clash وMihomo وSurge) والتي تنشئ إجابات خاصة أو ذات استخدام خاص خارج نطاق قياس الأداء RFC 2544. اتركها معطلة للوصول العادي إلى Telegram عبر الإنترنت العام.
    </Warning>

    - تجاوزات البيئة المؤقتة: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`، `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`، `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - تحقق من إجابات DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

لمزيد من المساعدة: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

## مرجع الإعداد

المرجع الأساسي: [مرجع الإعداد - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="حقول Telegram عالية الدلالة">

- بدء التشغيل/المصادقة: `enabled`، `botToken`، `tokenFile` (يجب أن يكون ملفًا عاديًا؛ تُرفض الروابط الرمزية)، `accounts.*`
- التحكم في الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، و`bindings[]` في المستوى الأعلى (`type: "acp"`)
- الإعدادات الافتراضية للموضوعات: ينطبق `groups.<chatId>.topics."*"` على موضوعات المنتدى غير المطابقة؛ وتتجاوزه معرّفات الموضوعات المطابقة تمامًا
- الموافقات على التنفيذ: `execApprovals`، `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`، `commands.nativeSkills`، `customCommands`
- سلاسل المحادثات/الردود: `replyToMode`، `threadBindings`
- البث: `streaming` (الأوضاع `off | partial | block | progress`)، `streaming.preview.toolProgress`
- التنسيق/التسليم: `textChunkLimit`، `streaming.chunkMode`، `richMessages`، `markdown.tables` (`off | bullets | code | block`)، `linkPreview`، `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`، `mediaGroupFlushMs`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- جذر API المخصص: `apiRoot` (جذر Bot API فقط؛ لا تُضمّن `/bot<TOKEN>`)، `trustedLocalFileRoots` (جذور `file_path` المطلقة لـ Bot API المستضاف ذاتيًا)
- Webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`، `webhookPort`، `webhookCertPath`
- الإجراءات/الإمكانات: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- التفاعلات: `reactionNotifications`، `reactionLevel`
- الأخطاء: `errorPolicy`، `errorCooldownMs`، `silentErrorReplies`
- عمليات الكتابة/السجل: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند إعداد معرّفين أو أكثر للحسابات، عيّن `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا فسيعود OpenClaw إلى أول معرّف حساب بعد تسويته، وسيصدر `openclaw doctor` تحذيرًا. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، ولكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    أقرن مستخدم Telegram بـ Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك قائمة السماح للمجموعات والموضوعات.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية الأمنية.
  </Card>
  <Card title="التوجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والموضوعات بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات.
  </Card>
</CardGroup>
