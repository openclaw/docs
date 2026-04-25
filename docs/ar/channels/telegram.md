---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم بوت Telegram، والإمكانات، والإعدادات
title: Telegram
x-i18n:
    generated_at: "2026-04-25T18:18:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9509ae437c6017c966d944b6d09af65b106f78ea023174127ac900b8cdc45ede
    source_path: channels/telegram.md
    workflow: 15
---

جاهز للإنتاج لرسائل البوت المباشرة والمجموعات عبر grammY. وضع الاستقصاء الطويل هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    أدوات تشخيص متعددة القنوات وأدلة إصلاح.
  </Card>
  <Card title="إعداد Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لإعدادات القنوات.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز البوت في BotFather">
    افتح Telegram وابدأ محادثة مع **@BotFather** (تأكد من أن المعرّف هو `@BotFather` تمامًا).

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
    لا يستخدم Telegram الأمر `openclaw channels login telegram`; اضبط الرمز في الإعدادات/متغيرات البيئة، ثم ابدأ gateway.

  </Step>

  <Step title="ابدأ gateway ووافق على أول رسالة مباشرة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="أضف البوت إلى مجموعة">
    أضف البوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` بما يتوافق مع نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حلّ الرمز يعتمد على الحساب. عمليًا، تكون لقيم الإعدادات الأولوية على بديل متغيرات البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية وظهور المجموعة">
    تستخدم بوتات Telegram **وضع الخصوصية** افتراضيًا، ما يقيّد الرسائل الجماعية التي تتلقاها.

    إذا كان يجب أن يرى البوت جميع رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا على المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف من إعدادات مجموعة Telegram.

    تتلقى البوتات المشرفة جميع رسائل المجموعة، وهو ما يفيد في سلوك المجموعة الدائم التشغيل.

  </Accordion>

  <Accordion title="خيارات BotFather المفيدة">

    - `/setjoingroups` للسماح بإضافة المجموعات أو منعها
    - `/setprivacy` لسلوك ظهور رسائل المجموعات

  </Accordion>
</AccordionGroup>

## التحكم بالوصول والتنشيط

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول إلى الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. وتُقبل البادئتان `telegram:` و`tg:` وتُطبَّعان.
    يؤدي `dmPolicy: "allowlist"` مع `allowFrom` فارغ إلى حظر جميع الرسائل المباشرة، ويرفضه التحقق من صحة الإعدادات.
    يطلب الإعداد معرّفات المستخدمين الرقمية فقط.
    إذا قمت بالترقية وكان إعدادك يحتوي على إدخالات allowlist من نوع `@username`، فشغّل `openclaw doctor --fix` لحلّها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات allowlist الخاصة بمخزن الاقتران، فيمكن لـ `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في تدفقات allowlist (على سبيل المثال عندما يكون `dmPolicy: "allowlist"` بلا معرّفات صريحة حتى الآن).

    بالنسبة إلى بوتات المالك الواحد، يُفضَّل استخدام `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة للحفاظ على سياسة الوصول ثابتة داخل الإعدادات (بدلًا من الاعتماد على موافقات اقتران سابقة).

    التباس شائع: الموافقة على اقتران الرسائل المباشرة لا تعني أن "هذا المرسل مخوّل في كل مكان".
    يمنح الاقتران الوصول إلى الرسائل المباشرة فقط. أما تخويل المرسل في المجموعات فما يزال يأتي من allowlists الصريحة في الإعدادات.
    إذا أردت أن يعني "أنا مخوّل مرة واحدة وتعمل الرسائل المباشرة وأوامر المجموعات معًا"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    الطريقة الأكثر أمانًا (من دون بوت تابع لجهة خارجية):

    1. أرسل رسالة مباشرة إلى البوت.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة جهة خارجية (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وallowlists">
    يُطبَّق عنصرَا تحكم معًا:

    1. **ما المجموعات المسموح بها** (`channels.telegram.groups`)
       - من دون إعداد `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (افتراضي): تُحظر المجموعات حتى تضيف إدخالات إلى `groups` (أو `"*"`)
       - عند ضبط `groups`: يعمل كـ allowlist (معرّفات صريحة أو `"*"`)

    2. **ما المرسلون المسموح بهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (افتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. وإذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (وتُطبَّع البادئتان `telegram:` و`tg:`).
    لا تضع معرّفات دردشات مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. فمعرّفات الدردشة السالبة مكانها ضمن `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية عند تخويل المرسلين.
    حدّ الأمان (`2026.2.25+`): لا يرث تخويل مرسل المجموعة موافقات مخزن الاقتران الخاصة بالرسائل المباشرة.
    يظل الاقتران خاصًا بالرسائل المباشرة فقط. بالنسبة إلى المجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يتم ضبط `groupAllowFrom`، يعود Telegram إلى `allowFrom` في الإعدادات، وليس إلى مخزن الاقتران.
    نمط عملي لبوتات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فإن القيم الافتراضية وقت التشغيل تكون مغلقة افتراضيًا عبر `groupPolicy="allowlist"` ما لم يُضبط `channels.defaults.groupPolicy` صراحةً.

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

    مثال: السماح فقط لمستخدمين محددين داخل مجموعة محددة واحدة:

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
      خطأ شائع: `groupAllowFrom` ليس allowlist لمجموعات Telegram.

      - ضع معرّفات مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` ضمن `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل البوت.
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

    تبديلات الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    هذه تحدّث حالة الجلسة فقط. استخدم الإعدادات للاستمرار.

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

- Telegram مملوك لعملية gateway.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُطبَّع الرسائل الواردة إلى غلاف القناة المشترك مع بيانات التعريف الخاصة بالردود وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات بحسب معرّف المجموعة. وتُلحق مواضيع المنتدى بـ `:topic:<threadId>` للحفاظ على عزل المواضيع.
- يمكن أن تحمل الرسائل المباشرة `message_thread_id`؛ ويوجه OpenClaw هذه الرسائل باستخدام مفاتيح جلسات تراعي سلاسل الرسائل ويحافظ على معرّف السلسلة في الردود.
- يستخدم الاستقصاء الطويل grammY runner مع تسلسل لكل دردشة/سلسلة. ويستخدم تزامن sink العام في runner القيمة `agents.defaults.maxConcurrent`.
- يُحمى الاستقصاء الطويل داخل كل عملية gateway بحيث لا يمكن إلا لمستقصٍ نشط واحد استخدام رمز بوت واحد في الوقت نفسه. إذا كنت ما تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن gateway أخرى من OpenClaw أو نصًا برمجيًا أو مستقصيًا خارجيًا يستخدم الرمز نفسه.
- تُفعَّل إعادة تشغيل مراقب الاستقصاء الطويل بعد 120 ثانية من دون اكتمال حيوية `getUpdates` افتراضيًا. زد قيمة `channels.telegram.pollingStallThresholdMs` فقط إذا كانت بيئة النشر لديك ما تزال تشهد إعادات تشغيل خاطئة بسبب تعطل الاستقصاء أثناء الأعمال طويلة التشغيل. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ كما أن التجاوزات لكل حساب مدعومة.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث الحي (تحرير الرسائل)">
    يمكن لـ OpenClaw بث الردود الجزئية في الوقت الفعلي:

    - المحادثات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/المواضيع: رسالة معاينة + `editMessageText`

    المتطلبات:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - تُطابَق القيمة `progress` مع `partial` في Telegram (للتوافق مع التسمية متعددة القنوات)
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأدوات/التقدم ستعيد استخدام رسالة المعاينة المعدّلة نفسها (الافتراضي: `true` عندما تكون معاينة البث مفعلة)
    - تُكتشف القيمة القديمة `channels.telegram.streamMode` وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي سطور "Working..." القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءة الملفات، وتحديثات التخطيط، أو ملخصات التصحيحات. يبقي Telegram هذه الميزة مفعلة افتراضيًا لمطابقة سلوك OpenClaw المُصدر ابتداءً من `v2026.4.22` وما بعده. للاحتفاظ بالمعاينة المعدّلة لنص الإجابة مع إخفاء سطور تقدم الأدوات، اضبط:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تعطيل تعديلات معاينة Telegram بالكامل. واستخدم `streaming.preview.toolProgress: false` عندما تريد فقط تعطيل سطور حالة تقدم الأدوات.

    بالنسبة إلى الردود النصية فقط:

    - رسالة مباشرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)
    - مجموعة/موضوع: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)

    بالنسبة إلى الردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    معاينة البث منفصلة عن block streaming. عندما يكون block streaming مفعّلًا صراحةً في Telegram، يتجاوز OpenClaw بث المعاينة لتجنب البث المزدوج.

    إذا كان نقل المسودة الأصلي غير متاح/مرفوضًا، يعود OpenClaw تلقائيًا إلى `sendMessage` + `editMessageText`.

    بث الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة الحية أثناء التوليد
    - تُرسل الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع إلى HTML">
    يستخدم النص الصادر في Telegram القيمة `parse_mode: "HTML"`.

    - يُعرَض النص ذو النمط المشابه لـ Markdown بصيغة HTML آمنة لـ Telegram.
    - يتم تهريب HTML الخام الصادر من النموذج لتقليل حالات فشل التحليل في Telegram.
    - إذا رفض Telegram HTML المُحلَّل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    يتم تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    القيم الافتراضية للأوامر الأصلية:

    - `commands.native: "auto"` يفعّل الأوامر الأصلية لـ Telegram

    أضف إدخالات مخصصة إلى قائمة الأوامر:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "نسخ احتياطي لـ Git" },
        { command: "generate", description: "إنشاء صورة" },
      ],
    },
  },
}
```

    القواعد:

    - تُطبَّع الأسماء (إزالة الشرطة المائلة `/` من البداية، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z` و`0-9` و`_`، والطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات في القائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - قد تستمر أوامر Plugin/Skills في العمل عند كتابتها حتى لو لم تُعرض في قائمة Telegram

    إذا تم تعطيل الأوامر الأصلية، تُزال الأوامر المضمنة. وقد تظل أوامر Plugin/الأوامر المخصصة تُسجَّل إذا كانت مُعدّة لذلك.

    حالات فشل الإعداد الشائعة:

    - تعني رسالة `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما تزال تتجاوز الحد بعد التقليم؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل `channels.telegram.commands.native`.
    - تعني رسالة `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً أن اتصالات DNS/HTTPS الصادرة إلى `api.telegram.org` محظورة.

    ### أوامر اقتران الأجهزة (`device-pair` Plugin)

    عند تثبيت Plugin `device-pair`:

    1. ينشئ `/pair` رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلّقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلّق واحد فقط
       - `/pair approve latest` لأحدث طلب

    يحمل رمز الإعداد رمز bootstrap مميزًا قصير العمر. وتحافظ عملية bootstrap handoff المضمنة على رمز Node الأساسي عند `scopes: []`؛ وأي رمز مشغّل operator يُسلَّم يظل محصورًا ضمن `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تكون فحوصات نطاق bootstrap مسبوقة بالدور، لذلك فإن allowlist الخاصة بالمشغّل operator لا تلبّي إلا طلبات operator؛ أما الأدوار غير الخاصة بالمشغّل فما تزال تحتاج إلى نطاقات ضمن بادئة الدور الخاصة بها.

    إذا أعاد جهاز المحاولة مع تفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، فيُستبدل الطلب المعلّق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

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
    - `allowlist` (افتراضي)

    تتحول القيمة القديمة `capabilities: ["inlineButtons"]` إلى `inlineButtons: "all"`.

    مثال على إجراء رسالة:

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

    تُمرَّر نقرات رد النداء callback إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أداة Telegram ما يلي:

    - `sendMessage` (`to`, `content`, واختياريًا `mediaUrl` و`replyToMessageId` و`messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, واختياريًا `iconColor` و`iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماءً بديلة مريحة (`send` و`react` و`delete` و`edit` و`sticker` و`sticker-search` و`topic-create`).

    عناصر التحكم في التقييد:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطّل)

    ملاحظة: الخياران `edit` و`topic-create` مفعّلان افتراضيًا حاليًا ولا يملكان مفاتيح تبديل منفصلة ضمن `channels.telegram.actions.*`.
    تستخدم عمليات الإرسال وقت التشغيل اللقطة النشطة من الإعدادات/الأسرار (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة حلّ `SecretRef` مخصصة عند كل إرسال.

    دلالات إزالة التفاعلات: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تسلسل الردود">
    يدعم Telegram وسومًا صريحة لتسلسل الردود في المخرجات المُولَّدة:

    - `[[reply_to_current]]` للرد على الرسالة التي أدت إلى التشغيل
    - `[[reply_to:<id>]]` للرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في طريقة المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    ملاحظة: يؤدي `off` إلى تعطيل تسلسل الردود الضمني. ومع ذلك، تظل الوسوم الصريحة `[[reply_to_*]]` محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك السلاسل">
    في المجموعات الفائقة الخاصة بالمنتدى:

    - تُلحَق بمفاتيح جلسات المواضيع القيمة `:topic:<threadId>`
    - تستهدف الردود ومؤشرات الكتابة سلسلة الموضوع
    - مسار إعداد الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    الحالة الخاصة للموضوع العام (`threadId=1`):

    - تُرسَل الرسائل من دون `message_thread_id` (يرفض Telegram `sendMessage(...thread_id=1)`)
    - تظل إجراءات الكتابة تتضمن `message_thread_id`

    وراثة المواضيع: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention` و`allowFrom` و`skills` و`systemPrompt` و`enabled` و`groupPolicy`).
    يكون `agentId` خاصًا بالموضوع فقط ولا يرث من القيم الافتراضية للمجموعة.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر ضبط `agentId` في إعدادات الموضوع. وهذا يمنح كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // الموضوع العام → الوكيل main
                "3": { agentId: "zu" },        // موضوع التطوير → الوكيل zu
                "5": { agentId: "coder" }      // مراجعة الكود → الوكيل coder
              }
            }
          }
        }
      }
    }
    ```

    يصبح لكل موضوع بعد ذلك مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط ACP دائم للموضوع**: يمكن لمواضيع المنتدى تثبيت جلسات ACP harness عبر عمليات ربط ACP typed على المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). يقتصر ذلك حاليًا على مواضيع المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالسلسلة من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجَّه المتابعات إليها مباشرة. يثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب ذلك `channels.telegram.threadBindings.spawnAcpSessions=true`.

    يوفّر سياق القالب `MessageThreadId` و`IsForum`. وتحتفظ دردشات الرسائل المباشرة التي تحتوي على `message_thread_id` بتوجيه الرسائل المباشرة لكنها تستخدم مفاتيح جلسات تراعي سلاسل الرسائل.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميّز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - استخدم الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطَّر تفريغات الملاحظات الصوتية الواردة كنص مُنشأ آليًا وغير موثوق
      داخل سياق الوكيل؛ وما يزال كشف الإشارات يستخدم التفريغ الخام
      لذا تستمر الرسائل الصوتية المقيّدة بالإشارة في العمل.

    مثال على إجراء رسالة:

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

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ ويُرسل نص الرسالة المقدَّم بشكل منفصل.

    ### الملصقات

    معالجة الملصقات الواردة:

    - WEBP ثابت: يُنزَّل ويُعالَج (عنصر نائب `<media:sticker>`)
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

    تُوصَف الملصقات مرة واحدة (عند الإمكان) وتُخزَّن مؤقتًا لتقليل استدعاءات الرؤية المتكررة.

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

    ابحث في الملصقات المخزنة مؤقتًا:

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

    عند التفعيل، يضع OpenClaw في الطابور أحداث نظام مثل:

    - `تمت إضافة تفاعل Telegram: 👍 بواسطة Alice (@alice) على الرسالة 42`

    الإعدادات:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدم على الرسائل التي أرسلها البوت فقط (بأفضل جهد عبر ذاكرة تخزين مؤقت للرسائل المرسلة).
    - ما تزال أحداث التفاعل تراعي عناصر التحكم بالوصول في Telegram (`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom`)؛ ويُسقط المرسلون غير المخولين.
    - لا يوفّر Telegram معرّفات سلاسل الرسائل في تحديثات التفاعل.
      - في المجموعات غير الخاصة بالمنتديات، يجري التوجيه إلى جلسة دردشة المجموعة
      - في مجموعات المنتدى، يجري التوجيه إلى جلسة الموضوع العام للمجموعة (`:topic:1`) وليس إلى الموضوع الأصلي الدقيق

    تتضمن `allowed_updates` الخاصة بالاستقصاء/Webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات التأكيد">
    يرسل `ackReaction` رمزًا تعبيريًا للتأكيد بينما يعالج OpenClaw رسالة واردة.

    ترتيب الحلّ:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرجوع إلى الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا `"👀"`)

    ملاحظات:

    - يتوقع Telegram رموزًا تعبيرية Unicode (مثل `"👀"`).
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابة الإعدادات من أحداث Telegram وأوامره">
    تكون كتابات إعدادات القناة مفعلة افتراضيًا (`configWrites !== false`).

    تتضمن الكتابات التي يطلقها Telegram ما يلي:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلب تمكين الأوامر)

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
    الوضع الافتراضي هو الاستقصاء الطويل. بالنسبة إلى وضع Webhook، اضبط `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`، ويمكن اختياريًا ضبط `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية هي `/telegram-webhook` و`127.0.0.1` و`8787`).

    يرتبط المستمع المحلي بالعنوان `127.0.0.1:8787`. وبالنسبة إلى الإدخال العام، إما أن تضع وكيلاً عكسيًا أمام المنفذ المحلي أو تضبط `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع Webhook من حواجز حماية الطلب، ومن الرمز السري لـ Telegram، ومن جسم JSON قبل إعادة `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل دردشة/لكل موضوع المستخدمة في الاستقصاء الطويل، بحيث لا تؤدي دورات الوكيل البطيئة إلى حجز إشعار التسليم ACK من Telegram.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدّ `channels.telegram.mediaMaxMb` (الافتراضي 100) من حجم وسائط Telegram الواردة والصادرة.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُضبط، تُستخدم القيمة الافتراضية لـ grammY).
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ ولا تضبطها بين `30000` و`600000` إلا لحالات إعادة التشغيل الخاطئة الإيجابية لتعطل الاستقصاء.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتعطّل القيمة `0` هذه الميزة.
    - يُمرَّر حاليًا السياق التكميلي للرد/الاقتباس/إعادة التوجيه كما تم استلامه.
    - تتحكم allowlists في Telegram أساسًا في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على أدوات الإرسال في Telegram ‏(CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد.

    يمكن أن يكون هدف الإرسال في CLI معرّف دردشة رقميًا أو اسم مستخدم:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    تستخدم استطلاعات Telegram الأمر `openclaw message poll` وتدعم مواضيع المنتدى:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    خيارات الاستطلاع الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` ‏(5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لمواضيع المنتدى (أو استخدم هدفًا من نوع `:topic:`)

    يدعم إرسال Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يستطيع البوت التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من رفعها كصور مضغوطة أو وسائط متحركة

    تقييد الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات exec في Telegram">
    يدعم Telegram موافقات exec في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يُفعَّل تلقائيًا عند إمكانية حلّ موافق واحد على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرّفات المالك الرقمية من `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: ‏`dm` (افتراضي) | `channel` | `both`
    - `agentFilter` و`sessionFilter`

    يُظهر التسليم عبر القناة نص الأمر في الدردشة؛ لذا لا تفعّل `channel` أو `both` إلا في المجموعات/المواضيع الموثوق بها. وعندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع من أجل مطالبة الموافقة والمتابعة. وتنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح المستهدف (`dm` أو `group` أو `all`). تُحلّ معرّفات الموافقة المسبوقة بـ `plugin:` عبر موافقات Plugin؛ أما البقية فتُحلّ عبر موافقات exec أولًا.

    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في الرد على الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو من المزوّد، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. ويتحكم مفتاحا إعداد في هذا السلوك:

| المفتاح                                 | القيم            | الافتراضي | الوصف                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | ترسل القيمة `reply` رسالة خطأ ودية إلى الدردشة. وتمنع `silent` ردود الأخطاء بالكامل. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع إغراق الدردشة بالأخطاء أثناء الانقطاعات.        |

تُدعَم التجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنفس وراثة مفاتيح إعداد Telegram الأخرى).

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
  <Accordion title="البوت لا يرد على رسائل المجموعات غير الموجّهة إليه بالإشارة">

    - إذا كانت `requireMention=false`، فيجب أن يسمح وضع خصوصية Telegram بالظهور الكامل.
      - BotFather: ‏`/setprivacy` -> تعطيل
      - ثم أزل البوت من المجموعة وأعد إضافته
    - يحذّر `openclaw channels status` عندما تتوقع الإعدادات رسائل مجموعات بلا إشارة.
    - يمكن لـ `openclaw channels status --probe` فحص معرّفات مجموعات رقمية صريحة؛ ولا يمكن فحص العضوية باستخدام الرمز العام `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة مطلقًا">

    - عند وجود `channels.telegram.groups`، يجب أن تكون المجموعة مدرجة (أو أن تتضمن `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - خوّل هوية المرسل الخاصة بك (الاقتران و/أو `allowFrom` الرقمي)
    - ما يزال تخويل الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - تعني رسالة `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل القوائم الأصلية
    - تعني رسالة `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً وجود مشكلات في الوصول عبر DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="عدم استقرار الاستقصاء أو الشبكة">

    - قد يؤدي Node 22+ مع `fetch`/وكيل مخصص إلى سلوك إجهاض فوري إذا لم تتطابق أنواع AbortSignal.
    - تحل بعض الاستضافات `api.telegram.org` إلى IPv6 أولًا؛ وقد يسبب تعطل الخروج عبر IPv6 حالات فشل متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الحالات باعتبارها أخطاء شبكة قابلة للاسترداد.
    - إذا تضمنت السجلات `Polling stall detected`، فإن OpenClaw يعيد تشغيل الاستقصاء ويعيد بناء نقل Telegram بعد 120 ثانية من دون اكتمال حيوية الاستقصاء الطويل افتراضيًا.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` الطويلة صحية لكن المضيف ما يزال يبلغ عن إعادات تشغيل خاطئة إيجابية لتعطل الاستقصاء. وعادةً ما تشير حالات التعطل المستمرة إلى مشكلات في الوكيل أو DNS أو IPv6 أو TLS للخروج بين المضيف و`api.telegram.org`.
    - على مضيفات VPS ذات الخروج/TLS المباشر غير المستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2) و`dnsResultOrder=ipv4first`.
    - إذا كان مضيفك هو WSL2 أو كان يعمل بوضوح بصورة أفضل مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاقات القياس RFC 2544 ‏(`198.18.0.0/15`) مسموح بها بالفعل
      افتراضيًا لتنزيلات وسائط Telegram. وإذا كان عنوان IP مزيف موثوق أو
      وكيل شفاف يعيد كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/ذو استخدام خاص أثناء تنزيلات الوسائط، فيمكنك
      الاشتراك في هذا التجاوز الخاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب في
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان الوكيل لديك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطيرة معطلة أولًا. تسمح وسائط Telegram بالفعل بنطاق
      القياس RFC 2544 افتراضيًا.

    <Warning>
      يُضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` حماية SSRF الخاصة بوسائط Telegram.
      استخدمه فقط في بيئات وكيل موثوق بها وتحت تحكم المشغّل
      مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما
      تُنشئ هذه البيئات إجابات خاصة أو ذات استخدام خاص خارج نطاق القياس
      RFC 2544. اتركه معطلًا للوصول العادي إلى Telegram عبر الإنترنت العام.
    </Warning>

    - تجاوزات متغيرات البيئة (مؤقتة):
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

- بدء التشغيل/المصادقة: `enabled` و`botToken` و`tokenFile` و`accounts.*` ‏(`tokenFile` يجب أن يشير إلى ملف عادي؛ وتُرفض الروابط الرمزية)
- التحكم بالوصول: `dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom` و`groups` و`groups.*.topics.*` و`bindings[]` على المستوى الأعلى (`type: "acp"`)
- موافقات exec: ‏`execApprovals` و`accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native` و`commands.nativeSkills` و`customCommands`
- سلاسل الردود/الردود: `replyToMode`
- البث: `streaming` (المعاينة) و`streaming.preview.toolProgress` و`blockStreaming`
- التنسيق/التسليم: `textChunkLimit` و`chunkMode` و`linkPreview` و`responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb` و`timeoutSeconds` و`pollingStallThresholdMs` و`retry` و`network.autoSelectFamily` و`network.dangerouslyAllowPrivateNetwork` و`proxy`
- Webhook: ‏`webhookUrl` و`webhookSecret` و`webhookPath` و`webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons` و`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications` و`reactionLevel`
- الأخطاء: `errorPolicy` و`errorCooldownMs`
- الكتابة/السجل: `configWrites` و`historyLimit` و`dmHistoryLimit` و`dms.*.historyLimit`

</Accordion>

<Note>
أولوية الحسابات المتعددة: عند ضبط معرّفي حسابين أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا فسيعود OpenClaw إلى أول معرّف حساب مُطبَّع ويعرض `openclaw doctor` تحذيرًا. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقتران مستخدم Telegram مع gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك allowlist للمجموعات والمواضيع.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    توجيه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديدات والتقوية.
  </Card>
  <Card title="التوجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    ربط المجموعات والمواضيع بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    أدوات تشخيص متعددة القنوات.
  </Card>
</CardGroup>
