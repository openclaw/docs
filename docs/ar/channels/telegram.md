---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم روبوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-05-02T20:41:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b5a733970f21e6b5a145b9ebb13134fb8e18b81fa0c723607019837c60f5497
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج لرسائل البوت المباشرة والمجموعات عبر grammY. وضع الاستطلاع الطويل هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الإقران.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وأدلة إصلاح عملية.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لإعدادات القنوات.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز البوت في BotFather">
    افتح Telegram وتحدّث مع **@BotFather** (تأكد أن المعرّف هو بالضبط `@BotFather`).

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

    بديل متغير البيئة: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ اضبط الرمز في الإعدادات/متغير البيئة، ثم ابدأ Gateway.

  </Step>

  <Step title="ابدأ Gateway ووافق على أول رسالة مباشرة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الإقران بعد ساعة واحدة.

  </Step>

  <Step title="أضف البوت إلى مجموعة">
    أضف البوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` بما يطابق نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حل الرمز يراعي الحساب. عمليًا، تتقدم قيم الإعدادات على بديل متغير البيئة، وينطبق `TELEGRAM_BOT_TOKEN` على الحساب الافتراضي فقط.
</Note>

## إعدادات جهة Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعة">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، وهو يحد من رسائل المجموعات التي تتلقاها.

    إذا كان يجب أن يرى البوت كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف من إعدادات مجموعة Telegram.

    تتلقى البوتات المشرفة كل رسائل المجموعة، وهذا مفيد لسلوك المجموعات الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح BotFather المفيدة">

    - `/setjoingroups` للسماح بإضافات المجموعات أو رفضها
    - `/setprivacy` لسلوك رؤية المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتنشيط

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول إلى الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يعثر على اسم مستخدم البوت أو يخمّنه أن يأمر البوت. استخدمه فقط للبوتات العامة عمدًا مع أدوات مقيّدة بإحكام؛ أما بوتات المالك الواحد فيجب أن تستخدم `allowlist` مع معرّفات مستخدمين رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئتان `telegram:` / `tg:` وتُطبّعان.
    في إعدادات الحسابات المتعددة، تُعامل قيمة `channels.telegram.allowFrom` التقييدية في المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا إلا إذا بقيت قائمة السماح الفعالة للحساب تحتوي على حرف بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغة كل الرسائل المباشرة، ويرفضه تحقق الإعدادات.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا أجريت ترقية وكانت إعداداتك تحتوي على إدخالات قائمة سماح بصيغة `@username`، فشغّل `openclaw doctor --fix` لحلّها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الإقران، يمكن لـ `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (على سبيل المثال عندما لا يحتوي `dmPolicy: "allowlist"` على أي معرّفات صريحة بعد).

    لبوتات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول ثابتة في الإعدادات (بدلًا من الاعتماد على موافقات إقران سابقة).

    التباس شائع: لا تعني موافقة إقران الرسائل المباشرة أن "هذا المرسل مخوّل في كل مكان".
    يمنح الإقران وصولًا إلى الرسائل المباشرة. إذا لم يوجد مالك أوامر بعد، فإن أول إقران معتمد يضبط أيضًا `commands.ownerAllowFrom` بحيث يكون للأوامر الخاصة بالمالك وموافقات التنفيذ حساب مشغّل صريح.
    لا يزال تفويض مرسلي المجموعات يأتي من قوائم السماح الصريحة في الإعدادات.
    إذا كنت تريد "أنا مخوّل مرة واحدة وتعمل الرسائل المباشرة وأوامر المجموعة معًا"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`؛ وللأوامر الخاصة بالمالك، تأكد أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    طريقة أكثر أمانًا (بلا بوت تابع لطرف ثالث):

    1. أرسل رسالة مباشرة إلى بوتك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة طرف ثالث (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعة وقوائم السماح">
    ينطبق عنصران للتحكم معًا:

    1. **ما المجموعات المسموح بها** (`channels.telegram.groups`)
       - بلا إعداد `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - مع ضبط `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **ما المرسلون المسموح لهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. إذا لم يُضبط، يرجع Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع البادئتان `telegram:` / `tg:`).
    لا تضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة تحت `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتفويض المرسل.
    حد الأمان (`2026.2.25+`): لا يرث تفويض مرسل المجموعة موافقات مخزن إقران الرسائل المباشرة.
    يبقى الإقران خاصًا بالرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/كل موضوع.
    إذا لم يُضبط `groupAllowFrom`، يرجع Telegram إلى إعداد `allowFrom`، وليس مخزن الإقران.
    نمط عملي لبوتات المالك الواحد: اضبط معرّف مستخدمك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح للمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، تفشل افتراضيات وقت التشغيل بشكل مغلق مع `groupPolicy="allowlist"` ما لم يُضبط `channels.defaults.groupPolicy` صراحة.

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

      - ضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` تحت `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` تحت `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى البوت.

    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب ردود المجموعة إشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة أصلية بصيغة `@botusername`، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح تبديل الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه حالة الجلسة فقط. استخدم الإعدادات للاستمرارية.

    مثال إعدادات مستمر:

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

    - وجّه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص Bot API `getUpdates`

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- يملك عملية Gateway قناة Telegram.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى مغلف القنوات المشترك مع بيانات وصفية للرد وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تضيف موضوعات المنتدى `:topic:<threadId>` لإبقاء الموضوعات معزولة.
- يمكن أن تحمل الرسائل المباشرة `message_thread_id`؛ يحتفظ OpenClaw بمعرّف الخيط للردود، لكنه يبقي الرسائل المباشرة على الجلسة المسطحة افتراضيًا. اضبط `channels.telegram.dm.threadReplies: "inbound"` أو `channels.telegram.direct.<chatId>.threadReplies: "inbound"` أو `requireTopic: true` أو إعداد موضوع مطابقًا عندما تريد عمدًا عزل جلسات موضوعات الرسائل المباشرة.
- يستخدم الاستطلاع الطويل مشغّل grammY مع تسلسل لكل دردشة/كل خيط. يستخدم تزامن مصرف المشغّل الإجمالي `agents.defaults.maxConcurrent`.
- يُحرس الاستطلاع الطويل داخل كل عملية Gateway بحيث لا يمكن إلا لمستطلع نشط واحد استخدام رمز بوت في كل مرة. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المحتمل أن Gateway آخر من OpenClaw أو سكربتًا أو مستطلعًا خارجيًا يستخدم الرمز نفسه.
- تبدأ إعادة تشغيل مراقب الاستطلاع الطويل افتراضيًا بعد 120 ثانية من دون اكتمال مؤشرات حياة `getUpdates`. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان نشرُك لا يزال يرى عمليات إعادة تشغيل زائفة بسبب توقف الاستطلاع أثناء عمل طويل الأمد. القيمة بالميلي ثانية ومسموح بها من `30000` إلى `600000`؛ وتدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يستطيع OpenClaw بث ردود جزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - تُطابق `progress` إلى `partial` على Telegram (للتوافق مع التسمية عبر القنوات)
    - يتحكم `streaming.preview.toolProgress` في ما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة المعدّلة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - تُكتشف قيم `channels.telegram.streamMode` القديمة وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي أسطر "Working..." القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءة الملفات، وتحديثات التخطيط، أو ملخصات التصحيحات. يبقي Telegram هذه مفعّلة افتراضيًا لمطابقة سلوك OpenClaw الصادر من `v2026.4.22` وما بعده. للإبقاء على المعاينة المعدّلة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، اضبط:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: تُعطَّل تعديلات معاينة Telegram ويُكبت كلام الأدوات/التقدّم العام بدلًا من إرساله كرسائل مستقلة "Working...". لا تزال مطالبات الموافقة وحمولات الوسائط والأخطاء تُمرَّر عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط الإبقاء على تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدّم الأدوات.

    للردود النصية فقط:

    - معاينات الرسائل الخاصة/المجموعات/المواضيع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويُجري تعديلًا نهائيًا في مكانها
    - المعاينات الأقدم من نحو دقيقة واحدة: يرسل OpenClaw الرد المكتمل كرسالة نهائية جديدة ثم ينظّف المعاينة، بحيث يعكس الطابع الزمني المرئي في Telegram وقت الاكتمال بدلًا من وقت إنشاء المعاينة

    للردود المعقدة (مثل حمولات الوسائط)، يرجع OpenClaw إلى التسليم النهائي العادي ثم ينظّف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عندما يُفعَّل بث الكتل صراحةً لـ Telegram، يتجاوز OpenClaw بث المعاينة لتجنّب البث المزدوج.

    بث الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة الحية أثناء التوليد
    - تُرسل الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع الاحتياطي إلى HTML">
    يستخدم النص الصادر في Telegram `parse_mode: "HTML"`.

    - يُعرَض النص الشبيه بـ Markdown كـ HTML آمن لـ Telegram.
    - يُهرَّب HTML الخام الصادر من النموذج لتقليل حالات فشل التحليل في Telegram.
    - إذا رفض Telegram الـ HTML المحلَّل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعّلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    يُعالَج تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    إعدادات الأوامر الأصلية الافتراضية:

    - يفعّل `commands.native: "auto"` الأوامر الأصلية لـ Telegram

    أضف إدخالات مخصصة إلى قائمة الأوامر:

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

    - تُطبَّع الأسماء (إزالة `/` البادئة، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، الطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - تُتجاوز التعارضات/التكرارات وتُسجَّل في السجل

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفّذ السلوك تلقائيًا
    - يمكن لأوامر Plugin/skill أن تعمل عند كتابتها حتى إن لم تظهر في قائمة Telegram

    إذا عُطّلت الأوامر الأصلية، تُزال الأوامر المضمنة. قد تستمر أوامر Plugin/المخصصة في التسجيل إذا كانت مهيأة.

    حالات فشل الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram لا تزال متجاوزة للحد بعد التقليم؛ قلّل أوامر Plugin/skill/المخصصة أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر curl المباشرة لـ Bot API أن `channels.telegram.apiRoot` ضُبط على نقطة النهاية الكاملة `/bot<TOKEN>`. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` اللاحقة العرضية `/bot<TOKEN>`.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المهيأ. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل polling لذلك لا يُبلَّغ عن هذا كفشل في تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (Plugin `device-pair`)

    عندما يكون Plugin `device-pair` مثبتًا:

    1. ينشئ `/pair` رمز الإعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما لا يوجد سوى طلب واحد معلّق
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز bootstrap قصير العمر. يحافظ تسليم bootstrap المضمن على رمز العقدة الأساسية عند `scopes: []`؛ وأي رمز مشغّل مُسلَّم يبقى محدودًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تكون فحوصات نطاق bootstrap مسبوقة بالدور، لذلك لا تفي قائمة السماح الخاصة بالمشغّل إلا بطلبات المشغّل؛ ولا تزال الأدوار غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلّق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [الإقران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="الأزرار المضمنة">
    هيّئ نطاق لوحة المفاتيح المضمنة:

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

    يطابق `capabilities: ["inlineButtons"]` القديم `inlineButtons: "all"`.

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

    تُمرَّر نقرات رد الاتصال إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تشمل إجراءات أدوات Telegram:

    - `sendMessage` (`to`، `content`، اختياريًا `mediaUrl`، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، اختياريًا `iconColor`، `iconCustomEmojiId`)

    تكشف إجراءات رسائل القناة أسماءً بديلة سهلة الاستخدام (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    عناصر التحكم في البوابات:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (افتراضيًا: معطّل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل منفصلة `channels.telegram.actions.*`.
    تستخدم عمليات الإرسال وقت التشغيل لقطة الإعدادات/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تنفّذ مسارات الإجراءات إعادة حل SecretRef ارتجالية لكل إرسال.

    دلالات إزالة التفاعلات: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تسلسل الردود">
    يدعم Telegram وسوم تسلسل ردود صريحة في المخرجات المولّدة:

    - يرد `[[reply_to_current]]` على الرسالة المحفّزة
    - يرد `[[reply_to:<id>]]` على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    عندما يكون تسلسل الردود مفعّلًا ويتوفر نص Telegram الأصلي أو التعليق، يضمّن OpenClaw مقتطف اقتباس أصليًا من Telegram تلقائيًا. يحد Telegram نص الاقتباس الأصلي إلى 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من البداية وترجع إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطّل `off` تسلسل الردود الضمني. لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك السلاسل">
    المجموعات الفائقة للمنتدى:

    - تضيف مفاتيح جلسات المواضيع `:topic:<threadId>`
    - تستهدف الردود والكتابة سلسلة الموضوع
    - مسار إعدادات الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram `sendMessage(...thread_id=1)`)
    - لا تزال إجراءات الكتابة تضمّن `message_thread_id`

    وراثة الموضوع: ترث إدخالات المواضيع إعدادات المجموعة ما لم تُتجاوز (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من إعدادات المجموعة الافتراضية.

    **توجيه الوكيل حسب الموضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر تعيين `agentId` في إعدادات الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

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

    يصبح لكل موضوع بعد ذلك مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط موضوع ACP المستمر**: يمكن لمواضيع المنتدى تثبيت جلسات عدة ACP عبر ارتباطات ACP المعرّفة من المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي محصور بمواضيع المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP المرتبط بالسلسلة من المحادثة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجّه المتابعات إليها مباشرة. يثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعّلًا (افتراضيًا: `true`).

    يكشف سياق القالب `MessageThreadId` و`IsForum`. تحافظ محادثات الرسائل الخاصة التي تحتوي على `message_thread_id` على توجيه الرسائل الخاصة وبيانات الرد الوصفية في جلسات مسطحة افتراضيًا؛ ولا تستخدم مفاتيح جلسات واعية بالسلاسل إلا عند تهيئتها بـ `threadReplies: "inbound"` أو `threadReplies: "always"` أو `requireTopic: true` أو إعداد موضوع مطابق. استخدم `channels.telegram.dm.threadReplies` من المستوى الأعلى لإعداد الحساب الافتراضي، أو `direct.<chatId>.threadReplies` لرسالة خاصة واحدة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميّز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - افتراضيًا: سلوك ملف الصوت
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطَّر نصوص الملاحظات الصوتية الواردة كنص مولّد آليًا
      وغير موثوق في سياق الوكيل؛ لا يزال اكتشاف الإشارة يستخدم النص الخام
      لذلك تستمر الرسائل الصوتية المقيّدة بالإشارة في العمل.

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

    يميّز Telegram بين ملفات الفيديو وملاحظات الفيديو.

    مثال إجراء رسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    لا تدعم ملاحظات الفيديو التعليقات؛ ويُرسل نص الرسالة المقدّم بشكل منفصل.

    ### الملصقات

    معالجة الملصقات الواردة:

    - WEBP ثابت: يُنزّل ويُعالَج (العنصر النائب `<media:sticker>`)
    - TGS متحرك: يُتجاوز
    - WEBM فيديو: يُتجاوز

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ملف ذاكرة الملصقات المؤقتة:

    - `~/.openclaw/telegram/sticker-cache.json`

    تُوصَف الملصقات مرة واحدة (عندما يكون ذلك ممكنًا) وتُخزَّن مؤقتًا لتقليل استدعاءات الرؤية المتكررة.

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

    إرسال إجراء ملصق:

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

  <Accordion title="Reaction notifications">
    تصل تفاعلات Telegram كتحديثات `message_reaction` منفصلة عن حمولات الرسائل.

    عند التفعيل، يضع OpenClaw أحداث النظام في قائمة الانتظار مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدمين مع الرسائل المرسلة من الروبوت فقط (على أساس أفضل جهد عبر ذاكرة الرسائل المرسلة المؤقتة).
    - تظل أحداث التفاعل تراعي عناصر التحكم في الوصول في Telegram (`dmPolicy`، و`allowFrom`، و`groupPolicy`، و`groupAllowFrom`)؛ ويتم إسقاط المرسلين غير المصرح لهم.
    - لا يوفر Telegram معرّفات سلاسل المحادثات في تحديثات التفاعل.
      - توجه المجموعات غير المنتديات إلى جلسة دردشة المجموعة
      - توجه مجموعات المنتديات إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` للاستقصاء/webhook `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="Ack reactions">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرمز التعبيري الاحتياطي لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموزًا تعبيرية unicode (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    تكون عمليات كتابة إعدادات القناة مفعّلة افتراضيًا (`configWrites !== false`).

    تشمل عمليات الكتابة التي يطلقها Telegram:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
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

  <Accordion title="Long polling vs webhook">
    الافتراضي هو الاستقصاء الطويل. لوضع webhook، عيّن `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ ويمكن اختياريًا تعيين `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    يربط المستمع المحلي نفسه بـ `127.0.0.1:8787`. للإدخال العام، ضع وكيلاً عكسيًا أمام المنفذ المحلي أو عيّن `webhookHost: "0.0.0.0"` عمدًا.

    يتحقق وضع Webhook من حراس الطلب، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات الروبوت نفسها لكل دردشة/كل موضوع المستخدمة في الاستقصاء الطويل، لذلك لا تجعل دورات الوكيل البطيئة إقرار التسليم الخاص بـ Telegram ينتظر.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحد `channels.telegram.mediaMaxMb` (الافتراضي 100) حجم وسائط Telegram الواردة والصادرة.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُعيّن، تُطبّق القيمة الافتراضية لـ grammY). تضبط عملاء الروبوت القيم المضبوطة إلى أقل من حارس طلب النص/الكتابة الصادر لمدة 60 ثانية حتى لا يجهض grammY تسليم الرد المرئي قبل أن يعمل حارس النقل والاحتياط في OpenClaw. يظل الاستقصاء الطويل يستخدم حارس طلب `getUpdates` لمدة 45 ثانية حتى لا تُترك عمليات الاستقصاء الخاملة بلا نهاية.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لحالات إعادة تشغيل توقف الاستقصاء الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتعطله `0`.
    - يُمرر السياق التكميلي للرد/الاقتباس/إعادة التوجيه حاليًا كما تم استلامه.
    - تتحكم قوائم السماح في Telegram أساسًا بمن يمكنه تشغيل الوكيل، وليست حدًا كاملاً لتنقيح السياق التكميلي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضًا إعادة محاولة آمنة ومحدودة للإرسال عند إخفاقات ما قبل الاتصال في Telegram، لكنه لا يعيد محاولة مغلفات الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن يكون هدف إرسال CLI معرّف دردشة رقميًا أو اسم مستخدم:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    تستخدم استطلاعات Telegram `openclaw message poll` وتدعم مواضيع المنتديات:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    أعلام الاستطلاع الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لمواضيع المنتديات (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح بها `channels.telegram.capabilities.inlineButtons`
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يستطيع الروبوت التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من رفعها كصور مضغوطة أو وسائط متحركة

    تقييد الإجراءات:

    - يعطل `channels.telegram.actions.sendMessage=false` رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يعطل `channels.telegram.actions.poll=false` إنشاء استطلاعات Telegram مع إبقاء الإرسالات العادية مفعّلة

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يتفعّل تلقائيًا عندما يكون هناك موافق واحد قابل للحل على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع احتياطيًا إلى معرّفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`، و`sessionFilter`

    يتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` بمن يمكنه التحدث إلى الروبوت وأين يرسل الردود العادية. ولا تجعل شخصًا ما موافقًا على التنفيذ. يهيئ أول اقتران رسائل مباشرة معتمد `commands.ownerAllowFrom` عندما لا يوجد مالك أوامر بعد، لذلك يظل إعداد المالك الواحد يعمل دون تكرار المعرّفات ضمن `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في الدردشة؛ فعّل `channel` أو `both` فقط في المجموعات/المواضيع الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح الهدف (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة التي تبدأ بـ `plugin:` عبر موافقات Plugin؛ وتُحل غيرها عبر موافقات التنفيذ أولًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ تسليم أو موفر، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا إعداد في هذا السلوك:

| المفتاح                             | القيم             | الافتراضي | الوصف                                                                                          |
| ----------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى الدردشة. ويكتم `silent` ردود الأخطاء بالكامل.                 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع رسائل الخطأ المتكررة أثناء الانقطاعات. |

تُدعم التجاوزات لكل حساب وكل مجموعة وكل موضوع (بنفس التوارث مثل مفاتيح إعداد Telegram الأخرى).

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
  <Accordion title="Bot does not respond to non mention group messages">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع خصوصية Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> تعطيل
      - ثم أزل الروبوت وأعد إضافته إلى المجموعة
    - يحذر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعة غير مذكور فيها الروبوت.
    - يمكن لـ `openclaw channels status --probe` فحص معرّفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص عضوية حرف البدل `"*"`.
    - اختبار سريع للجلسة: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - عند وجود `channels.telegram.groups`، يجب أن تكون المجموعة مدرجة (أو تضمين `"*"`)
    - تحقق من عضوية الروبوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - صرّح هوية المرسل لديك (الاقتران و/أو `allowFrom` الرقمي)
    - يظل تفويض الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلل أوامر Plugin/المهارات/الأوامر المخصصة أو عطّل القوائم الأصلية
    - تكون استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات الكتابة `sendChatAction` محدودة وتُعاد محاولتها مرة واحدة عبر احتياط نقل Telegram عند انتهاء مهلة الطلب. تشير أخطاء الشبكة/الجلب المستمرة عادةً إلى مشكلات إمكانية الوصول إلى DNS/HTTPS نحو `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` هو إخفاق مصادقة Telegram لرمز الروبوت المضبوط.
    - انسخ رمز الروبوت مجددًا أو أعد توليده في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضًا إخفاق مصادقة؛ معاملته على أنها "لا يوجد webhook" لن تؤدي إلا إلى تأجيل إخفاق الرمز السيئ نفسه إلى استدعاءات API لاحقة.
    - إذا فشل `deleteWebhook` بسبب خطأ شبكة عابر أثناء بدء الاستقصاء، يفحص OpenClaw `getWebhookInfo`؛ وعندما يبلغ Telegram عن عنوان URL فارغ للـ webhook، يستمر الاستقصاء لأن التنظيف مستوفى بالفعل.

  </Accordion>

  <Accordion title="Polling or network instability">

    - يمكن أن يؤدي Node 22+ مع `fetch`/proxy مخصصين إلى تشغيل سلوك إلغاء فوري إذا كان هناك عدم تطابق في أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ وقد يتسبب خروج IPv6 المعطل في إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء باعتبارها أخطاء شبكة قابلة للاسترداد.
    - إذا كانت مقابس Telegram يعاد تدويرها وفق وتيرة ثابتة قصيرة، فتحقق من انخفاض قيمة `channels.telegram.timeoutSeconds`؛ إذ تفرض عملاء البوت حدًا أدنى على القيم المضبوطة عندما تكون أدنى من حواجز طلبات الخروج و`getUpdates`، لكن الإصدارات الأقدم كانت قد تلغي كل عملية استطلاع أو رد عند ضبط هذه القيمة دون تلك الحواجز.
    - إذا تضمنت السجلات `Polling stall detected`، فإن OpenClaw يعيد تشغيل الاستطلاع ويعيد بناء نقل Telegram بعد 120 ثانية افتراضيًا دون اكتمال حيوية الاستطلاع الطويل.
    - يحذر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استطلاع قيد التشغيل قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستطلاع قديمًا.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` طويلة التشغيل سليمة لكن مضيفك ما يزال يبلغ عن عمليات إعادة تشغيل خاطئة بسبب توقف الاستطلاع. تشير حالات التوقف المستمرة عادةً إلى مشكلات في proxy أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يلتزم Telegram أيضًا ببيئة proxy الخاصة بالعملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` وصيغها ذات الأحرف الصغيرة. يمكن أن يظل `NO_PROXY` / `no_proxy` متجاوزًا لـ`api.telegram.org`.
    - إذا كان proxy المُدار من OpenClaw مضبوطًا عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولم تكن هناك بيئة proxy قياسية، فإن Telegram يستخدم ذلك العنوان لنقل Bot API أيضًا.
    - على مضيفات VPS ذات خروج/TLS مباشر غير مستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يضبط Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2). يلتزم ترتيب نتائج DNS الخاصة بـTelegram بـ`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم افتراضي العملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ وإذا لم ينطبق أي منها، يرجع Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحةً بشكل أفضل مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق معيار RFC 2544 ‏(`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضيًا. إذا أعاد fake-IP موثوق أو
      proxy شفاف كتابة `api.telegram.org` إلى عنوان خاص/داخلي/خاص الاستخدام آخر
      أثناء تنزيلات الوسائط، يمكنك الاشتراك في التجاوز الخاص بـTelegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان proxy لديك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلم الخطر معطلًا أولًا. تسمح وسائط Telegram بالفعل بنطاق معيار
      RFC 2544 افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية SSRF
      لوسائط Telegram. استخدمه فقط في بيئات proxy موثوقة يتحكم فيها المشغل
      مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما تنشئ
      إجابات خاصة أو خاصة الاستخدام خارج نطاق معيار RFC 2544. اتركه معطلًا
      للوصول العادي إلى Telegram عبر الإنترنت العام.
    </Warning>

    - تجاوزات البيئة (مؤقتة):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - تحقق من إجابات DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

مزيد من المساعدة: [استكشاف أخطاء القناة وإصلاحها](/ar/channels/troubleshooting).

## مرجع الإعداد

المرجع الأساسي: [مرجع الإعداد - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- بدء التشغيل/المصادقة: `enabled`، `botToken`، `tokenFile`، `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ تُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` ذات المستوى الأعلى (`type: "acp"`)
- موافقات التنفيذ: `execApprovals`، `accounts.*.execApprovals`
- الأمر/القائمة: `commands.native`، `commands.nativeSkills`، `customCommands`
- سلاسل المحادثات/الردود: `replyToMode`، `dm.threadReplies`، `direct.*.threadReplies`
- البث: `streaming` (معاينة)، `streaming.preview.toolProgress`، `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- جذر API المخصص: `apiRoot` (جذر Bot API فقط؛ لا تضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`، `reactionLevel`
- الأخطاء: `errorPolicy`، `errorCooldownMs`
- الكتابات/السجل: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند ضبط معرفي حساب أو أكثر، عيّن `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا يرجع OpenClaw إلى أول معرف حساب مُطبّع ويحذر `openclaw doctor`. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Telegram بالـGateway.
  </Card>
  <Card title="Groups" icon="users" href="/ar/channels/groups">
    سلوك قائمة السماح للمجموعة والموضوع.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="Security" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتحصين.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والموضوعات بالوكلاء.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات.
  </Card>
</CardGroup>
