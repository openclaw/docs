---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم بوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-05-03T21:27:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 528ace9dae29eda22f98cc1436ec16146eb9d83edc73aa6db1ab8283f4f873c0
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والمجموعات الخاصة بالبوتات عبر grammY. وضع الاستقصاء الطويل هو الوضع الافتراضي؛ وضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الإقران.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة إصلاح إجرائية.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة إعداد القنوات الكاملة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="إنشاء رمز البوت في BotFather">
    افتح Telegram وتحدث مع **@BotFather** (تأكد من أن المعرّف هو بالضبط `@BotFather`).

    شغّل `/newbot`، واتبع المطالبات، واحفظ الرمز.

  </Step>

  <Step title="إعداد الرمز وسياسة الرسائل المباشرة">

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

    بديل البيئة: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ اضبط الرمز في الإعدادات/البيئة، ثم ابدأ تشغيل Gateway.

  </Step>

  <Step title="بدء Gateway والموافقة على أول رسالة مباشرة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الإقران بعد ساعة واحدة.

  </Step>

  <Step title="إضافة البوت إلى مجموعة">
    أضف البوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` بما يطابق نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حلّ الرموز واعٍ بالحسابات. عمليًا، تكون قيم الإعدادات أسبق من بديل البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جهة Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية وظهور المجموعة">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، الذي يقيّد رسائل المجموعة التي تستقبلها.

    إذا كان يجب أن يرى البوت جميع رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف من إعدادات مجموعة Telegram.

    تستقبل البوتات المشرفة جميع رسائل المجموعة، وهو أمر مفيد لسلوك المجموعات الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح تبديل BotFather المفيدة">

    - `/setjoingroups` للسماح بإضافات المجموعات أو رفضها
    - `/setprivacy` لسلوك ظهور المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول عبر الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يجد اسم مستخدم البوت أو يخمّنه أن يوجّه أوامر إلى البوت. استخدمه فقط للبوتات العامة عمدًا ذات الأدوات المقيّدة بإحكام؛ ينبغي للبوتات ذات المالك الواحد استخدام `allowlist` مع معرّفات مستخدمين رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئتان `telegram:` / `tg:` وتُطبّعان.
    في إعدادات الحسابات المتعددة، يُعامل `channels.telegram.allowFrom` المقيّد على المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا إلا إذا كانت قائمة السماح الفعلية للحساب لا تزال تحتوي على حرف بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ جميع الرسائل المباشرة، ويرفضه تحقق الإعدادات.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا رقيت وكان إعدادك يحتوي على إدخالات قائمة سماح من نوع `@username`، فشغّل `openclaw doctor --fix` لحلّها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الإقران، فيمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    للبوتات ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول دائمة في الإعدادات (بدلًا من الاعتماد على موافقات الإقران السابقة).

    لبس شائع: الموافقة على إقران الرسائل المباشرة لا تعني "هذا المرسل مصرح له في كل مكان".
    يمنح الإقران وصول الرسائل المباشرة. إذا لم يكن هناك مالك أوامر بعد، فإن أول إقران معتمد يضبط أيضًا `commands.ownerAllowFrom` بحيث تكون لأوامر المالك فقط وموافقات التنفيذ جهة تشغيل صريحة.
    لا يزال تفويض مرسلي المجموعات يأتي من قوائم السماح الصريحة في الإعدادات.
    إذا أردت "أنا مصرح لي مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`؛ ولأوامر المالك فقط، تأكد من أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (من دون بوت تابع لطرف ثالث):

    1. أرسل رسالة مباشرة إلى بوتك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة طرف ثالث (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    ينطبق عنصران للتحكم معًا:

    1. **ما المجموعات المسموح بها** (`channels.telegram.groups`)
       - لا يوجد إعداد `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - تم إعداد `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **ما المرسلون المسموح بهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    ينبغي أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع البادئتان `telegram:` / `tg:`).
    لا تضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة ضمن `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية في تفويض المرسلين.
    حد الأمان (`2026.2.25+`): لا يرث تفويض مرسلي المجموعات موافقات مخزن إقران الرسائل المباشرة.
    يبقى الإقران خاصًا بالرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/لكل موضوع.
    إذا لم يُضبط `groupAllowFrom`، يعود Telegram إلى `allowFrom` في الإعدادات، وليس إلى مخزن الإقران.
    نمط عملي للبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فإن وقت التشغيل يستخدم افتراضيًا `groupPolicy="allowlist"` مغلقًا عند الفشل ما لم يُضبط `channels.defaults.groupPolicy` صراحة.

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

      - ضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` ضمن `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى البوت.

    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب ردود المجموعات الإشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة `@botusername` الأصلية، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح تبديل الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه حالة الجلسة فقط. استخدم الإعدادات للاستمرارية.

    مثال إعداد دائم:

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

- يملك إجراء Gateway قناة Telegram.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى مظروف القنوات المشترك مع بيانات الرد الوصفية وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تلحق موضوعات المنتدى `:topic:<threadId>` لإبقاء الموضوعات معزولة.
- يمكن أن تحمل رسائل الرسائل المباشرة `message_thread_id`؛ يحافظ OpenClaw على معرّف الخيط للردود، لكنه يُبقي الرسائل المباشرة على الجلسة المسطحة افتراضيًا. اضبط `channels.telegram.dm.threadReplies: "inbound"` أو `channels.telegram.direct.<chatId>.threadReplies: "inbound"` أو `requireTopic: true` أو إعداد موضوع مطابق عندما تريد عمدًا عزل جلسات موضوعات الرسائل المباشرة.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل دردشة/لكل خيط. يستخدم تزامن مصرف المشغّل العام `agents.defaults.maxConcurrent`.
- يُحرس الاستقصاء الطويل داخل كل إجراء Gateway بحيث يمكن لمستقصٍ نشط واحد فقط استخدام رمز بوت في كل مرة. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر من OpenClaw أو سكربتًا أو مستقصيًا خارجيًا يستخدم الرمز نفسه.
- تبدأ عمليات إعادة تشغيل مراقب الاستقصاء الطويل افتراضيًا بعد 120 ثانية من دون حيوية `getUpdates` مكتملة. زِد `channels.telegram.pollingStallThresholdMs` فقط إذا كان النشر لديك لا يزال يرى عمليات إعادة تشغيل خاطئة بسبب توقف الاستقصاء أثناء عمل طويل المدة. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يستطيع OpenClaw بث ردود جزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - يحافظ `progress` على مسودة حالة واحدة قابلة للتعديل ويحدّثها بتقدم الأدوات حتى التسليم النهائي
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة المعدّلة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - تُكتشف قيم `channels.telegram.streamMode` القديمة وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي أسطر الحالة القصيرة المعروضة أثناء تشغيل الأدوات، مثل تنفيذ الأوامر أو قراءة الملفات أو تحديثات التخطيط أو ملخصات التصحيحات. يبقي Telegram هذه مفعّلة افتراضيًا لمطابقة سلوك OpenClaw الصادر من `v2026.4.22` وما بعده. للإبقاء على المعاينة المعدّلة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، اضبط:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    استخدم `streaming.mode: "off"` فقط عندما تريد التسليم النهائي فقط: يتم تعطيل تعديلات معاينة Telegram ويتم كتم ثرثرة الأدوات/التقدم العامة بدلا من إرسالها كرسائل حالة مستقلة. لا تزال مطالبات الموافقة وحمولات الوسائط والأخطاء تمر عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط إبقاء تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأداة.

    <Note>
      ردود الاقتباس المحددة في Telegram هي الاستثناء. عندما تكون `replyToMode` هي `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدلا من تعديل معاينة الإجابة، لذلك لا يستطيع `streaming.preview.toolProgress` عرض أسطر الحالة القصيرة لتلك الجولة. لا تزال ردود الرسالة الحالية من دون نص اقتباس محدد تحتفظ ببث المعاينة. اضبط `replyToMode: "off"` عندما تكون رؤية تقدم الأداة أهم من ردود الاقتباس الأصلية، أو اضبط `streaming.preview.toolProgress: false` للإقرار بالمفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات الرسائل المباشرة/المجموعات/المواضيع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلا نهائيا في مكانها، ما لم يتم إرسال رسالة مرئية غير معاينة بعد ظهور المعاينة
    - المعاينات التي تتبعها مخرجات مرئية غير معاينة: يرسل OpenClaw الرد المكتمل كرسالة نهائية جديدة وينظف المعاينة الأقدم، بحيث تظهر الإجابة النهائية بعد المخرجات الوسيطة
    - المعاينات الأقدم من نحو دقيقة واحدة: يرسل OpenClaw الرد المكتمل كرسالة نهائية جديدة ثم ينظف المعاينة، بحيث يعكس الطابع الزمني المرئي في Telegram وقت الاكتمال بدلا من وقت إنشاء المعاينة

    للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عند تمكين بث الكتل صراحة في Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    بث الاستدلال الخاص بـ Telegram فقط:

    - `/reasoning stream` يرسل الاستدلال إلى المعاينة المباشرة أثناء الإنشاء
    - يتم إرسال الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع الاحتياطي إلى HTML">
    يستخدم النص الصادر Telegram `parse_mode: "HTML"`.

    - يتم عرض النص الشبيه بـ Markdown كـ HTML آمن لـ Telegram.
    - يتم تهريب HTML الخام من النموذج لتقليل إخفاقات تحليل Telegram.
    - إذا رفض Telegram HTML المحلل، يعيد OpenClaw المحاولة كنص عادي.

    يتم تمكين معاينات الروابط افتراضيا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    الإعدادات الافتراضية للأوامر الأصلية:

    - `commands.native: "auto"` يمكّن الأوامر الأصلية لـ Telegram

    أضف إدخالات قائمة أوامر مخصصة:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    القواعد:

    - يتم تطبيع الأسماء (إزالة `/` البادئة، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، الطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيا
    - يمكن لأوامر plugin/skill أن تستمر في العمل عند كتابتها حتى لو لم تظهر في قائمة Telegram

    إذا تم تعطيل الأوامر الأصلية، تتم إزالة الأوامر المضمنة. قد تستمر أوامر custom/plugin في التسجيل إذا تم تكوينها.

    إخفاقات الإعداد الشائعة:

    - `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` يعني أن قائمة Telegram ما زالت تجاوزت الحد بعد التشذيب؛ قلل أوامر plugin/skill/custom أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر curl المباشرة لـ Bot API أن `channels.telegram.apiRoot` ضُبط على نقطة النهاية الكاملة `/bot<TOKEN>`. يجب أن يكون `apiRoot` هو جذر Bot API فقط، ويزيل `openclaw doctor --fix` اللاحقة العرضية `/bot<TOKEN>`.
    - `getMe returned 401` يعني أن Telegram رفض رمز البوت المكوّن. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستقصاء، لذلك لا يتم الإبلاغ عن هذا كفشل تنظيف Webhook.
    - `setMyCommands failed` مع أخطاء الشبكة/الجلب يعني عادة أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (Plugin `device-pair`)

    عند تثبيت Plugin `device-pair`:

    1. ينشئ `/pair` رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يوجد طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز تمهيد قصير العمر. يحافظ تسليم التمهيد المضمن على رمز العقدة الأساسي عند `scopes: []`؛ وأي رمز مشغّل تم تسليمه يبقى محدودا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. يتم بادئة فحوصات نطاق التمهيد بالدور، لذلك لا تفي قائمة السماح تلك الخاصة بالمشغّل إلا بطلبات المشغّل؛ لا تزال الأدوار غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يتم استبدال الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفا. أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [الإقران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="الأزرار المضمنة">
    كوّن نطاق لوحة المفاتيح المضمنة:

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
    - `allowlist` (افتراضي)

    يتم تعيين `capabilities: ["inlineButtons"]` القديم إلى `inlineButtons: "all"`.

    مثال إجراء رسالة:

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

    يتم تمرير نقرات رد الاستدعاء إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أداة Telegram:

    - `sendMessage` (`to`، `content`، `mediaUrl` اختياري، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، `iconColor` اختياري، `iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماء بديلة مريحة (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    عناصر التحكم بالبوابة:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطل)

    ملاحظة: `edit` و`topic-create` ممكّنان حاليا افتراضيا وليست لهما مفاتيح تبديل `channels.telegram.actions.*` منفصلة.
    تستخدم عمليات الإرسال في وقت التشغيل لقطة التكوين/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة حل SecretRef مخصصة لكل إرسال.

    دلالات إزالة التفاعلات: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم ترابط الردود">
    يدعم Telegram وسوم ترابط رد صريحة في المخرجات المنشأة:

    - `[[reply_to_current]]` يرد على الرسالة المشغّلة
    - `[[reply_to:<id>]]` يرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    عندما يكون ترابط الردود ممكنا ويكون نص Telegram الأصلي أو التعليق متاحا، يدرج OpenClaw تلقائيا مقتطف اقتباس Telegram أصليا. يحدد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك يتم اقتباس الرسائل الأطول من البداية والرجوع إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطل `off` ترابط الردود الضمني. لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك السلاسل">
    المجموعات الفائقة للمنتدى:

    - تضيف مفاتيح جلسة الموضوع `:topic:<threadId>`
    - تستهدف الردود والكتابة سلسلة الموضوع
    - مسار تكوين الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram `sendMessage(...thread_id=1)`)
    - لا تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من إعدادات المجموعة الافتراضية.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عن طريق ضبط `agentId` في تكوين الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    لكل موضوع بعد ذلك مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط موضوع ACP الدائم**: يمكن لمواضيع المنتدى تثبيت جلسات تسخير ACP من خلال روابط ACP typed على المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بموضوع مثل `-1001234567890:topic:42`). النطاق الحالي يقتصر على مواضيع المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بسلسلة من المحادثة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتتوجه المتابعات إليها مباشرة. يثبت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` ممكنا (الافتراضي: `true`).

    يعرض سياق القالب `MessageThreadId` و`IsForum`. تحتفظ محادثات الرسائل المباشرة التي تحتوي على `message_thread_id` بتوجيه الرسائل المباشرة وبيانات الرد الوصفية على جلسات مسطحة افتراضيا؛ ولا تستخدم مفاتيح جلسة واعية بالسلسلة إلا عند تكوينها بـ `threadReplies: "inbound"` أو `threadReplies: "always"` أو `requireTopic: true` أو تكوين موضوع مطابق. استخدم `channels.telegram.dm.threadReplies` على المستوى الأعلى لإعداد الحساب الافتراضي، أو `direct.<chatId>.threadReplies` لرسالة مباشرة واحدة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض إرسال ملاحظة صوتية
    - يتم تأطير نصوص الملاحظات الصوتية الواردة كنصوص منشأة آليا
      وغير موثوقة في سياق الوكيل؛ لا يزال اكتشاف الإشارة يستخدم النص الخام
      بحيث تستمر الرسائل الصوتية المقيدة بالإشارة في العمل.

    مثال إجراء رسالة:

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

    مثال على إجراء رسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ يُرسل نص الرسالة المقدم بشكل منفصل.

    ### الملصقات

    التعامل مع الملصقات الواردة:

    - WEBP ثابت: يتم تنزيله ومعالجته (العنصر النائب `<media:sticker>`)
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

    يتم وصف الملصقات مرة واحدة (عند الإمكان) وتخزينها مؤقتا لتقليل استدعاءات الرؤية المتكررة.

    تفعيل إجراءات الملصقات:

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

    البحث في الملصقات المخزنة مؤقتا:

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
    تصل تفاعلات Telegram على شكل تحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند التفعيل، يضع OpenClaw أحداث النظام في قائمة الانتظار مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - يعني `own` تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (أفضل جهد عبر ذاكرة تخزين الرسائل المرسلة المؤقتة).
    - تظل أحداث التفاعل تراعي ضوابط وصول Telegram (`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom`)؛ يتم إسقاط المرسلين غير المصرح لهم.
    - لا يوفر Telegram معرفات سلاسل النقاش في تحديثات التفاعل.
      - تُوجه المجموعات غير المنتديات إلى جلسة محادثة المجموعة
      - تُوجه مجموعات المنتديات إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    تتضمن `allowed_updates` للاستقصاء/الـ Webhook القيمة `message_reaction` تلقائيا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزا تعبيريا للإقرار بينما يعالج OpenClaw رسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرمز التعبيري الاحتياطي لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموزا تعبيرية Unicode (على سبيل المثال "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات من أحداث وأوامر Telegram">
    تكون كتابات إعدادات القناة مفعلة افتراضيا (`configWrites !== false`).

    تشمل الكتابات التي يشغلها Telegram:

    - أحداث ترحيل المجموعات (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلب تفعيل الأوامر)

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
    الافتراضي هو الاستقصاء الطويل. لوضع Webhook عيّن `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ والخيارات الاختيارية `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    يرتبط المستمع المحلي بـ `127.0.0.1:8787`. للإدخال العام، ضع وكيلا عكسيا أمام المنفذ المحلي أو عيّن `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع Webhook من حراس الطلب، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    يعالج OpenClaw بعد ذلك التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل محادثة/كل موضوع التي يستخدمها الاستقصاء الطويل، لذا لا تمنع دورات الوكيل البطيئة ACK التسليم الخاص بـ Telegram.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحد `channels.telegram.mediaMaxMb` (الافتراضي 100) حجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زدها إذا وصلت أجزاء الألبوم متأخرة؛ وأنقصها لتقليل زمن استجابة الرد على الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم تكن معينة، ينطبق افتراضي grammY). يقيّد عملاء البوت القيم المضبوطة تحت حارس طلب النص/الكتابة الصادر لمدة 60 ثانية حتى لا يوقف grammY تسليم الرد المرئي قبل أن يتمكن حارس النقل والاحتياط في OpenClaw من العمل. يظل الاستقصاء الطويل يستخدم حارس طلب `getUpdates` لمدة 45 ثانية حتى لا تُترك الاستقصاءات الخاملة بلا نهاية.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لحالات إعادة تشغيل توقف الاستقصاء الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ القيمة `0` تعطل ذلك.
    - يتم حاليا تمرير السياق التكميلي للرد/الاقتباس/إعادة التوجيه كما تم استلامه.
    - قوائم السماح في Telegram تضبط أساسا من يستطيع تشغيل الوكيل، وليست حدا كاملا لحجب السياق التكميلي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضا إعادة محاولة إرسال آمن محدودة لإخفاقات ما قبل الاتصال في Telegram، لكنه لا يعيد محاولة مغلفات الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن يكون هدف إرسال CLI معرف محادثة رقميا أو اسم مستخدم:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    تستخدم استقصاءات Telegram الأمر `openclaw message poll` وتدعم موضوعات المنتديات:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    أعلام الاستقصاء الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لموضوعات المنتديات (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يستطيع البوت التثبيت في تلك المحادثة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلا من تحميلها كصور مضغوطة أو وسائط متحركة

    تقييد الإجراءات:

    - يعطل `channels.telegram.actions.sendMessage=false` رسائل Telegram الصادرة، بما في ذلك الاستقصاءات
    - يعطل `channels.telegram.actions.poll=false` إنشاء استقصاءات Telegram مع إبقاء الإرسال العادي مفعلا

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريا نشر المطالبات في المحادثة أو الموضوع الأصلي. يجب أن يكون الموافقون معرفات مستخدمين رقمية في Telegram.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يتفعل تلقائيا عندما يكون هناك موافق واحد قابل للحل على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter` و`sessionFilter`

    تتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` في من يستطيع التحدث إلى البوت وأين يرسل الردود العادية. لا تجعل شخصا ما موافقا على التنفيذ. تمهد أول عملية إقران رسائل مباشرة معتمدة لـ `commands.ownerAllowFrom` عندما لا يكون هناك مالك أوامر بعد، لذا يظل إعداد المالك الواحد يعمل من دون تكرار المعرفات تحت `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في المحادثة؛ فعّل `channel` أو `both` فقط في المجموعات/الموضوعات الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيا.

    تتطلب أزرار الموافقة المضمنة أيضا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح الهدف (`dm` أو `group` أو `all`). تُحل معرفات الموافقة ذات البادئة `plugin:` عبر موافقات Plugin؛ أما غيرها فيُحل عبر موافقات التنفيذ أولا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو الموفر، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا إعدادات في هذا السلوك:

| المفتاح                             | القيم             | الافتراضي | الوصف                                                                                          |
| ----------------------------------- | ----------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى المحادثة. يكتم `silent` ردود الأخطاء بالكامل.                  |
| `channels.telegram.errorCooldownMs` | رقم (مللي ثانية) | `60000`   | الحد الأدنى للوقت بين ردود الأخطاء إلى المحادثة نفسها. يمنع الرسائل المزعجة أثناء الانقطاعات. |

تُدعم التجاوزات لكل حساب ولكل مجموعة ولكل موضوع (بالميراث نفسه لمفاتيح إعدادات Telegram الأخرى).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="البوت لا يرد على رسائل المجموعة التي لا تحتوي على إشارة">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع خصوصية Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> تعطيل
      - ثم أزل البوت من المجموعة وأعد إضافته
    - يحذر `openclaw channels status` عندما تتوقع الإعدادات رسائل مجموعة بلا إشارة.
    - يمكن لـ `openclaw channels status --probe` التحقق من معرفات المجموعات الرقمية الصريحة؛ لا يمكن فحص عضوية حرف البدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقا">

    - عندما يكون `channels.telegram.groups` موجودا، يجب أن تكون المجموعة مدرجة (أو تضمين `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيا أو لا تعمل إطلاقا">

    - صرّح لهوية المرسل الخاصة بك (الإقران و/أو `allowFrom` الرقمي)
    - يظل تفويض الأوامر ساريا حتى عندما تكون سياسة المجموعة `open`
    - فشل `setMyCommands` مع `BOT_COMMANDS_TOO_MUCH` يعني أن القائمة الأصلية تحتوي على إدخالات كثيرة جدا؛ قلل أوامر Plugin/Skills/المخصصة أو عطّل القوائم الأصلية
    - استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات كتابة `sendChatAction` محدودة وتُعاد محاولتها مرة واحدة عبر احتياط نقل Telegram عند انتهاء مهلة الطلب. تشير أخطاء الشبكة/الجلب المستمرة عادة إلى مشكلات قابلية الوصول إلى DNS/HTTPS نحو `api.telegram.org`

  </Accordion>

  <Accordion title="بدء التشغيل يبلغ عن رمز غير مصرح به">

    - `getMe returned 401` هو فشل مصادقة Telegram لرمز bot المهيأ.
    - أعد نسخ رمز bot أو أعد توليده في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضًا فشل مصادقة؛ معاملته على أنها "لا يوجد Webhook" لن يؤدي إلا إلى تأجيل فشل الرمز السيئ نفسه إلى استدعاءات API لاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستطلاع أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع fetch/proxy مخصصين إلى سلوك إلغاء فوري إذا كانت أنواع AbortSignal غير متطابقة.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ وقد يتسبب خروج IPv6 المعطل في حالات فشل متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للتعافي.
    - أثناء بدء الاستطلاع، يعيد OpenClaw استخدام فحص بدء التشغيل الناجح `getMe` لصالح grammY حتى لا يحتاج المشغّل إلى `getMe` ثانٍ قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بسبب خطأ شبكة عابر أثناء بدء الاستطلاع، ينتقل OpenClaw إلى الاستطلاع الطويل بدلًا من إجراء استدعاء control-plane آخر قبل الاستطلاع. يظهر Webhook الذي لا يزال نشطًا كتعارض `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويعيد محاولة تنظيف Webhook.
    - إذا كانت مقابس Telegram يعاد تدويرها وفق وتيرة ثابتة قصيرة، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ يقيّد عملاء bot القيم المهيأة التي تقل عن حراس طلبات الخروج و`getUpdates`، لكن الإصدارات الأقدم كان يمكن أن تلغي كل استطلاع أو رد عندما كانت هذه القيمة مضبوطة دون تلك الحراس.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستطلاع ويعيد بناء نقل Telegram بعد 120 ثانية افتراضيًا من دون اكتمال حيوية الاستطلاع الطويل.
    - يحذّر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استطلاع جارٍ قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook جارٍ قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستطلاع قديمًا.
    - لا تزد `channels.telegram.pollingStallThresholdMs` إلا عندما تكون استدعاءات `getUpdates` طويلة الأمد سليمة لكن مضيفك لا يزال يبلغ خطأً عن إعادات تشغيل بسبب توقف الاستطلاع. تشير التوقفات المستمرة عادةً إلى مشكلات في proxy أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يحترم Telegram أيضًا متغيرات بيئة proxy للعملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` ومتغيراتها بالأحرف الصغيرة. لا يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا كان proxy المُدار من OpenClaw مهيأً عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولا توجد بيئة proxy قياسية، يستخدم Telegram ذلك URL لنقل Bot API أيضًا.
    - على مضيفات VPS ذات خروج/TLS مباشر غير مستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يضبط Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2). يتبع ترتيب نتائج DNS في Telegram `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم الإعداد الافتراضي للعملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ وإذا لم ينطبق أي منها، يرجع Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحةً بشكل أفضل بسلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق قياس الأداء وفق RFC 2544 (`198.18.0.0/15`) مسموح بها بالفعل
      افتراضيًا لتنزيلات وسائط Telegram. إذا كان fake-IP أو
      proxy شفاف موثوق يعيد كتابة `api.telegram.org` إلى عنوان
      خاص/داخلي/مخصص لاستخدام خاص آخر أثناء تنزيلات الوسائط، يمكنك الاشتراك
      في تجاوز مخصص لـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان proxy لديك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة معطلة أولًا. تسمح وسائط Telegram بالفعل بنطاق قياس الأداء
      RFC 2544 افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية SSRF
      لوسائط Telegram. استخدمه فقط في بيئات proxy موثوقة يتحكم بها المشغّل
      مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما تولّد
      إجابات خاصة أو مخصصة لاستخدام خاص خارج نطاق قياس الأداء RFC 2544.
      اتركه معطلًا للوصول العادي إلى Telegram عبر الإنترنت العام.
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

## مرجع التهيئة

المرجع الأساسي: [مرجع التهيئة - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="حقول Telegram عالية الدلالة">

- بدء التشغيل/المصادقة: `enabled`، `botToken`، `tokenFile`، `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ تُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` على المستوى الأعلى (`type: "acp"`)
- موافقات التنفيذ: `execApprovals`، `accounts.*.execApprovals`
- الأمر/القائمة: `commands.native`، `commands.nativeSkills`، `customCommands`
- التشعب/الردود: `replyToMode`، `dm.threadReplies`، `direct.*.threadReplies`
- البث: `streaming` (معاينة)، `streaming.preview.toolProgress`، `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`، `mediaGroupFlushMs`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`، `reactionLevel`
- الأخطاء: `errorPolicy`، `errorCooldownMs`
- الكتابات/السجل: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند تهيئة معرّفي حسابين أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا يرجع OpenClaw إلى أول معرّف حساب مُطبّع ويحذّر `openclaw doctor`. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Telegram بالـ Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك قائمة السماح للمجموعات والمواضيع.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="التوجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والمواضيع بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات.
  </Card>
</CardGroup>
